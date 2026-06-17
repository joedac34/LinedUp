// api/dflive.js — TEMPORARY. Shows the shape of DataFeeds /live/{date}/MLB box scores
// (per-player batting/pitching + whether inning-level data exists, for NRFI).
// Deploy, hit once, paste the JSON back, then delete this file.
// Reads DATAFEEDS_TOKEN from env (never echoed). Optional gate: ?key= vs DFPROBE_KEY.

export default async function handler(req, res) {
  const q = req.query || {};
  if (process.env.DFPROBE_KEY && (q.key || "") !== process.env.DFPROBE_KEY) {
    res.status(401).json({ error: "bad or missing ?key" });
    return;
  }
  const TOKEN = process.env.DATAFEEDS_TOKEN;
  if (!TOKEN) { res.status(500).json({ error: "DATAFEEDS_TOKEN env var not set" }); return; }

  const BASE = "http://rest.datafeeds.rolling-insights.com/api/v1";
  // default: two recent completed dates (override with ?dates=YYYY-MM-DD,YYYY-MM-DD)
  const dates = String(q.dates || "2026-06-15,2026-06-16").split(",").map(s => s.trim()).filter(Boolean);

  const results = {};
  for (const d of dates) {
    try {
      const r = await fetch(`${BASE}/live/${d}/MLB?RSC_token=${TOKEN}`);
      const txt = await r.text();
      const info = { status: r.status, ok: r.ok };
      try {
        const j = JSON.parse(txt);
        const mlb = j && j.data ? j.data.MLB : undefined;
        info.dataKeys = j && j.data ? Object.keys(j.data) : Object.keys(j || {});
        if (Array.isArray(mlb) && mlb.length) {
          const g = mlb[0];
          info.gameCount = mlb.length;
          info.firstGameKeys = Object.keys(g);
          info.firstGameSample = JSON.stringify(g).slice(0, 3800);
        } else if (mlb && typeof mlb === "object") {
          const keys = Object.keys(mlb);
          info.mlbKeys = keys.slice(0, 30);
          const first = mlb[keys[0]];
          info.firstSample = JSON.stringify(first).slice(0, 3800);
        } else {
          info.sample = txt.slice(0, 1500);
        }
      } catch (e) { info.sample = txt.slice(0, 900); }
      results[d] = info;
    } catch (e) { results[d] = { error: String(e).slice(0, 200) }; }
    await new Promise(z => setTimeout(z, 500));
  }

  res.status(200).json({ note: "DataFeeds /live MLB box-score probe — paste this back, then delete api/dflive.js.", results });
}
