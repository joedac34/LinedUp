// api/linemoves.js — returns the OPENING line per selection for a set of events.
// The Line Sheet pairs this with the live (current) grid price to show line
// movement + a tiny open->now sparkline. Read-only; safe + cheap (no Odds API).
//
// GET /api/linemoves?events=ev1,ev2,...
// -> { moves: { "<sel_key>": { odds, implied } , ... } }

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

export default async function handler(req, res) {
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: "env not set" });
  const raw = (req.query && req.query.events) || "";
  const events = String(raw).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 40);
  if (!events.length) return res.status(200).json({ moves: {} });
  try {
    const list = events.map((e) => `"${e.replace(/"/g, "")}"`).join(",");
    const url = `${SB_URL}/rest/v1/opening_lines?event_id=in.(${encodeURIComponent(list)})&select=sel_key,odds,implied&limit=2000`;
    const r = await fetch(url, { headers: sbHeaders });
    if (!r.ok) return res.status(200).json({ moves: {} }); // table missing / not ready -> graceful empty
    const rows = await r.json();
    const moves = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row && row.sel_key) moves[row.sel_key] = { odds: row.odds, implied: row.implied };
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ moves });
  } catch (e) {
    return res.status(200).json({ moves: {} });
  }
}
