/* api/live-activity.js — iOS Live Activity for a live matchup.
 *
 * Three callers:
 *   Client (Supabase user token)
 *     POST { op:"register", kind:"activity"|"push_to_start", token, activityId?, leagueId?, week?, environment? }
 *     POST { op:"unregister", token }
 *     GET  ?leagueId=&week=            -> { attributes, state, shouldRun }  (data to start locally)
 *   grade.js (CRON_SECRET)
 *     POST { op:"tick" }               -> updates every running activity, ends finished ones,
 *                                          push-to-starts activities for games that just kicked off
 *
 * Window rule (the thing that keeps this off people's screens all week):
 *   an activity runs only while the user has a locked pick in a game that is
 *   LIVE NOW (kickoff <= now < kickoff+LIVE_WINDOW). It starts at that first
 *   kickoff and ends once no such game remains and the last one is graded or
 *   past the window. iOS separately hard-caps any activity at 8 hours.
 */
import { createClient } from '@supabase/supabase-js';
import { sendLiveActivity, DEAD_REASONS } from './_apnsLive.js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const LIVE_WINDOW_MS = 4 * 3600 * 1000;      // a game is "live" for up to 4h after kickoff
const START_LEAD_MS  = 2 * 60 * 1000;        // push-to-start up to 2 min before kickoff
const GRACE_MS       = 20 * 60 * 1000;       // keep the card 20 min after the last grade
const MAX_CHIPS      = 4;

async function authedUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try { const { data, error } = await supabase.auth.getUser(token); return (error || !data?.user) ? null : data.user; }
  catch (e) { return null; }
}

const KIND_LABEL = { ml: 'MONEYLINE', spread: 'SPREAD', ou: 'OVER/UNDER', prop: 'PROP', longshot: 'PARLAY', survivor: 'SURVIVOR', td: 'TD' };
const fmt = (v) => (Number(v) === Math.round(Number(v))) ? String(Math.round(Number(v))) : Number(v).toFixed(1);

function chipFor(p) {
  const base = String(p.slot || '').split('_')[0];
  const kind = (KIND_LABEL[base] || base.toUpperCase()) + (p.multiplier && p.multiplier > 1 ? ` · ${p.multiplier}×` : '');
  let status = 'Live', state = 'P';
  if (p.result === 'W') { status = 'Won' + (p.points_earned != null ? ' +' + fmt(p.points_earned) : ''); state = 'W'; }
  else if (p.result === 'L') { status = 'Lost'; state = 'L'; }
  else if (p.result === 'P') { status = 'Push'; state = 'P'; }
  else if (p.result === 'V') { status = 'Void'; state = 'P'; }
  else if (p.home_score != null && p.away_score != null) { status = `${p.away_score}-${p.home_score} · live`; }
  const label = String(p.pick_name || '').replace(/\s*-\s*Anytime TD$/i, ' TD').slice(0, 22);
  return { kind, label, status, state };
}

/* Build the activity payload for one user in one league-week. Returns null when
   the user has nothing to show (no live pick now and nothing just graded). */
async function buildState(userId, leagueId, week, now = Date.now()) {
  const { data: league } = await supabase.from('leagues').select('id,name,league_type,current_week').eq('id', leagueId).single();
  if (!league) return null;
  week = Number(week || league.current_week || 1);

  const { data: myPicks } = await supabase.from('picks')
    .select('slot,pick_name,multiplier,result,points_earned,game_date,home_score,away_score,replaced_by')
    .eq('league_id', leagueId).eq('user_id', userId).eq('week', week).is('replaced_by', null);
  const picks = (myPicks || []).filter(p => p.game_date);
  const kick = (p) => Date.parse(p.game_date);
  const liveNow = picks.filter(p => kick(p) <= now && now < kick(p) + LIVE_WINDOW_MS);
  const gradedRecently = picks.filter(p => p.result && p.result !== 'pending' && kick(p) + LIVE_WINDOW_MS + GRACE_MS > now && kick(p) <= now);
  const shouldRun = liveNow.some(p => p.result === 'pending') || (liveNow.length > 0 && gradedRecently.length > 0 && (now - Math.max(...liveNow.map(kick))) < LIVE_WINDOW_MS);
  const liveGames = new Set(liveNow.filter(p => p.result === 'pending').map(p => p.game_date)).size;

  const { data: me } = await supabase.from('users').select('username').eq('id', userId).single();
  const myName = me?.username || 'You';

  let state, attributes;
  if (league.league_type === 'survivor') {
    const { data: mem } = await supabase.from('league_members').select('eliminated_week').eq('league_id', leagueId).eq('user_id', userId).single();
    const { count: alive } = await supabase.from('league_members').select('user_id', { count: 'exact', head: true }).eq('league_id', leagueId).is('eliminated_week', null);
    const dead = mem && mem.eliminated_week != null;
    const sv = picks[0];
    state = {
      myPts: 0, oppPts: 0, myName, oppName: `${alive ?? 0} alive`,
      status: dead ? 'Eliminated' : 'Alive', liveCount: liveGames, winProb: dead ? 0 : 100,
      picks: sv ? [chipFor(sv)] : [], ended: !shouldRun,
    };
  } else {
    const { data: mus } = await supabase.from('matchups').select('user1_id,user2_id,user1_points,user2_points').eq('league_id', leagueId).eq('week', week);
    const mu = (mus || []).find(m => m.user1_id === userId || m.user2_id === userId) || null;
    const iAm1 = mu && mu.user1_id === userId;
    const oppId = mu ? (iAm1 ? mu.user2_id : mu.user1_id) : null;
    const myPts = mu ? Number((iAm1 ? mu.user1_points : mu.user2_points) || 0) : picks.reduce((n, p) => n + (Number(p.points_earned) || 0), 0);
    const oppPts = mu ? Number((iAm1 ? mu.user2_points : mu.user1_points) || 0) : 0;
    let oppName = 'League';
    if (oppId) { const { data: o } = await supabase.from('users').select('username').eq('id', oppId).single(); oppName = o?.username || 'Opponent'; }
    const diff = myPts - oppPts;
    const winProb = Math.round(Math.max(5, Math.min(95, 50 + Math.max(-45, Math.min(45, diff * 1.5)))));
    const status = !shouldRun ? 'Final' : (diff > 0 ? 'Leading' : diff < 0 ? 'Trailing' : 'Tied');
    const chips = [...liveNow.filter(p => p.result === 'pending'), ...gradedRecently].slice(0, MAX_CHIPS).map(chipFor);
    state = { myPts, oppPts, myName, oppName, status, liveCount: liveGames, winProb, picks: chips, ended: !shouldRun };
  }
  attributes = { leagueName: league.name, leagueType: league.league_type, week, matchupId: `${leagueId}|${week}|${userId}` };
  const nextKick = picks.map(kick).filter(t => t > now - START_LEAD_MS && t <= now + START_LEAD_MS);
  return { attributes, state, shouldRun, startingNow: nextKick.length > 0 };
}

async function sendWithFlip(row, msg) {
  const first = row.environment === 'sandbox' ? 'sandbox' : 'production';
  let r = await sendLiveActivity(row.token, msg, first);
  if (!r.ok && r.reason === 'BadDeviceToken') {
    const other = first === 'sandbox' ? 'production' : 'sandbox';
    const r2 = await sendLiveActivity(row.token, msg, other);
    if (r2.ok) { await supabase.from('live_activity_tokens').update({ environment: other }).eq('id', row.id); return r2; }
    r = r2;
  }
  return r;
}

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const isInternal = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // ── grade.js tick ────────────────────────────────────────────────────
    if (req.method === 'POST' && isInternal && body.op === 'tick') {
      const now = Date.now();
      const out = { updated: 0, ended: 0, started: 0, pruned: 0, errors: [] };

      // 1. Running activities: update or end.
      const { data: acts } = await supabase.from('live_activity_tokens').select('*').eq('kind', 'activity');
      const dead = [];
      for (const row of (acts || [])) {
        if (!row.league_id) continue;
        const st = await buildState(row.user_id, row.league_id, row.week, now);
        if (!st) { dead.push(row.id); continue; }
        const r = await sendWithFlip(row, st.shouldRun
          ? { event: 'update', contentState: st.state }
          : { event: 'end', contentState: st.state, dismissAt: now + 15 * 60 * 1000 });
        if (r.ok) { if (st.shouldRun) out.updated++; else { out.ended++; dead.push(row.id); } }
        else if (r.reason && DEAD_REASONS.has(r.reason)) dead.push(row.id);
        else out.errors.push({ id: row.id, reason: r.reason, status: r.status });
      }

      // 2. Push-to-start: a user with a device token and a pick kicking off now.
      const { data: p2s } = await supabase.from('live_activity_tokens').select('*').eq('kind', 'push_to_start');
      if (p2s && p2s.length) {
        const since = new Date(now - START_LEAD_MS).toISOString(), until = new Date(now + START_LEAD_MS).toISOString();
        const userIds = [...new Set(p2s.map(r => r.user_id))];
        const { data: kicking } = await supabase.from('picks').select('user_id,league_id,week').in('user_id', userIds)
          .eq('result', 'pending').gte('game_date', since).lte('game_date', until).is('replaced_by', null);
        const running = new Set((acts || []).map(a => `${a.user_id}|${a.league_id}|${a.week}`));
        const seen = new Set();
        for (const k of (kicking || [])) {
          const key = `${k.user_id}|${k.league_id}|${k.week}`;
          if (seen.has(key) || running.has(key)) continue;
          seen.add(key);
          const st = await buildState(k.user_id, k.league_id, k.week, now);
          if (!st || !st.shouldRun) continue;
          for (const row of p2s.filter(r => r.user_id === k.user_id)) {
            const r = await sendWithFlip(row, { event: 'start', attributes: st.attributes, contentState: st.state,
              alert: { title: st.attributes.leagueName, body: 'Your matchup is live' } });
            if (r.ok) out.started++;
            else if (r.reason && DEAD_REASONS.has(r.reason)) dead.push(row.id);
            else out.errors.push({ id: row.id, reason: r.reason, status: r.status });
          }
        }
      }
      if (dead.length) { await supabase.from('live_activity_tokens').delete().in('id', dead); out.pruned = dead.length; }
      return res.status(200).json({ ok: true, ...out });
    }

    // ── client ───────────────────────────────────────────────────────────
    const user = await authedUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
      const { leagueId, week } = req.query || {};
      if (!leagueId) return res.status(400).json({ error: 'leagueId required' });
      const st = await buildState(user.id, leagueId, week);
      if (!st) return res.status(200).json({ shouldRun: false });
      return res.status(200).json(st);
    }

    if (req.method === 'POST' && body.op === 'register') {
      const kind = body.kind === 'push_to_start' ? 'push_to_start' : 'activity';
      const token = String(body.token || '').toLowerCase();
      if (!/^[0-9a-f]{32,200}$/.test(token)) return res.status(400).json({ error: 'bad token' });
      const environment = body.environment === 'sandbox' ? 'sandbox' : 'production';
      const row = { user_id: user.id, kind, token, environment, updated_at: new Date().toISOString(),
        activity_id: kind === 'activity' ? (body.activityId || null) : null,
        league_id: kind === 'activity' ? (body.leagueId || null) : null,
        week: kind === 'activity' ? (Number(body.week) || null) : null };
      const { error } = await supabase.from('live_activity_tokens').upsert(row, { onConflict: 'token' });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST' && body.op === 'unregister') {
      await supabase.from('live_activity_tokens').delete().eq('user_id', user.id).eq('token', String(body.token || '').toLowerCase());
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown op' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
