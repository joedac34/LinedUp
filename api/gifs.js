/**
 * /api/gifs.js — GIF search/trending for league chat, via KLIPY.
 *
 * WHY KLIPY: Google killed the Tenor API on 30 Jun 2026 (no new keys since 13 Jan).
 * Klipy (ex-Tenor team) is where Discord/WhatsApp/Bluesky migrated; it maintains a
 * Tenor-COMPATIBLE endpoint layer at api.klipy.com, so this speaks the well-known
 * Tenor v2 shapes: /v2/search + /v2/featured, results[].media_formats.{tinygif,gif}.
 *
 *   GET /api/gifs            -> trending (picker open state)
 *   GET /api/gifs?q=lebron   -> search
 *   -> { gifs: [{ id, preview, full, w, h }] }
 *
 * Key stays server-side. Edge-cached 10 min + tiny in-memory cache so a whole
 * league opening the picker costs ~one upstream call.
 *
 * ENV: KLIPY_API_KEY
 */

const KEY = process.env.KLIPY_API_KEY;
const BASE = "https://api.klipy.com/v2";

const cache = new Map(); // q -> { at, gifs }
const TTL = 10 * 60 * 1000;

function mapResults(data) {
  const out = [];
  for (const r of (data?.results || [])) {
    const mf = r.media_formats || {};
    const tiny = mf.tinygif || mf.nanogif || mf.gif;
    const full = mf.gif || mf.mediumgif || tiny;
    if (!tiny?.url) continue;
    out.push({
      id: r.id,
      preview: tiny.url,
      full: full?.url || tiny.url,
      w: (tiny.dims && tiny.dims[0]) || null,
      h: (tiny.dims && tiny.dims[1]) || null,
    });
  }
  return out;
}

export default async function handler(req, res) {
  if (!KEY) return res.status(200).json({ gifs: [], error: "KLIPY_API_KEY not set" });

  const q = String(req.query?.q || "").trim().slice(0, 80);
  const ck = q.toLowerCase() || "__trending__";
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) {
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
    return res.status(200).json({ gifs: hit.gifs, cached: true });
  }

  try {
    const url = q
      ? `${BASE}/search?q=${encodeURIComponent(q)}&key=${KEY}&limit=24&media_filter=tinygif,gif&contentfilter=medium`
      : `${BASE}/featured?key=${KEY}&limit=24&media_filter=tinygif,gif&contentfilter=medium`;
    const r = await fetch(url, { headers: { "User-Agent": "PickLock/1.0" } });
    if (!r.ok) return res.status(200).json({ gifs: [], error: `upstream ${r.status}` });
    const data = await r.json();
    const gifs = mapResults(data);
    cache.set(ck, { at: Date.now(), gifs });
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
    return res.status(200).json({ gifs });
  } catch (e) {
    // Never break chat over a GIF — the picker shows an honest empty state.
    return res.status(200).json({ gifs: [], error: String(e.message || e) });
  }
}
