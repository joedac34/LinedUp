// api/dfprobe.js — TEMPORARY one-time probe to discover DataFeeds MLB endpoints + shapes.
// Deploy, hit it once, paste the JSON back, then DELETE this file.
// Reads your token from the DATAFEEDS_TOKEN env var (never echoed in the output).
// Optional gate: set DFPROBE_KEY env var and call with ?key=THATVALUE.

export default async function handler(req, res) {
  const q = req.query || {};
  if (process.env.DFPROBE_KEY && (q.key || "") !== process.env.DFPROBE_KEY) {
    res.status(401).json({ error: "bad or missing ?key" });
    return;
  }
  const TOKEN = process.env.DATAFEEDS_TOKEN;
  if (!TOKEN) {
    res.status(500).json({ error: "DATAFEEDS_TOKEN env var not set in Vercel" });
    return;
  }

  const BASE = "http://rest.datafeeds.rolling-insights.com/api/v1";
  const today = new Date().toISOString().slice(0, 10);
  const Y = new Date().getFullYear();

  // Candidate paths — known patterns (schedule-season, live) plus best-guess slugs for the
  // Pre/Post-Game feature groups. The probe reports which return 200 and a trimmed sample.
  const candidates = [
    ["schedule_season",        `/schedule-season/${Y}/MLB`],
    ["schedule_today",         `/schedule/${today}/MLB`],
    ["live_today",             `/live/${today}/MLB`],
    ["team_info",              `/team-info/MLB`],
    ["team_info_season",       `/team-info/${Y}/MLB`],
    ["player_info",            `/player-info/MLB`],
    ["team_season_stats",      `/team-season-stats/${Y}/MLB`],
    ["team_stats",             `/team-stats/${Y}/MLB`],
    ["player_season_stats",    `/player-season-stats/${Y}/MLB`],
    ["player_stats",           `/player-stats/${Y}/MLB`],
    ["depth_charts",           `/depth-charts/MLB`],
    ["depth_charts_season",    `/depth-charts/${Y}/MLB`],
    ["injuries",               `/injuries/MLB`],
    ["team_game_by_game",      `/team-game-by-game/${Y}/MLB`],
    ["player_game_by_game",    `/player-game-by-game/${Y}/MLB`],
  ];

  const only = String(q.only || "").split(",").map(s => s.trim()).filter(Boolean);
  const results = {};

  for (const [name, path] of candidates) {
    if (only.length && !only.includes(name)) continue;
    const url = `${BASE}${path}?RSC_token=${TOKEN}`;
    try {
      const r = await fetch(url);
      const txt = await r.text();
      let sample, keys = null;
      try {
        const j = JSON.parse(txt);
        keys = j && typeof j === "object" && !Array.isArray(j) ? Object.keys(j).slice(0, 25) : (Array.isArray(j) ? ["<array length " + j.length + ">"] : null);
        sample = JSON.stringify(j).slice(0, 2000);
      } catch (e) {
        sample = txt.slice(0, 400);
      }
      results[name] = { path, status: r.status, ok: r.ok, topKeys: keys, sample };
    } catch (e) {
      results[name] = { path, error: String(e).slice(0, 200) };
    }
    await new Promise(z => setTimeout(z, 500)); // polite spacing
  }

  res.status(200).json({
    note: "DataFeeds MLB probe — copy this whole object and paste it back to Claude. Then delete api/dfprobe.js.",
    date: today, year: Y,
    results,
  });
}
