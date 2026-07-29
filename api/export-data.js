/* Export everything PickLock holds about one account.  Place at: api/export-data.js
   Auth: POST + Authorization: Bearer <supabase access_token>. The user is derived
   from the token — a caller can only ever export themselves.
   Body: { format: "html" | "json" }   (default html)
   Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY

   WHY HTML BY DEFAULT
   A raw JSON dump is technically a valid data export and practically unreadable —
   a wall of uuids and timestamps with no indication which league or opponent any
   row refers to. The HTML build resolves those ids to league names and usernames,
   groups everything into tables, and still embeds the complete raw JSON at the
   bottom, so one file is both readable and machine-readable.

   WHY res.end AND NOT res.send
   The first version used res.send with a JSON content type and the body came back
   re-serialised: indentation stripped and object keys reordered. res.end writes
   the bytes exactly as given.

   WHY A SERVER ROUTE AND NOT A CLIENT QUERY
   Row-level security is tuned for the app's screens, not for a complete export.
   Running with the service key, filtered to the token's own user id, means the
   export is guaranteed complete AND still scoped to one person.

   WHAT IS DELIBERATELY NOT INCLUDED
   Other people's picks and messages. A data-access right covers the requester's
   own data, not their league-mates'. Opponent usernames appear because they are
   already visible in-app; nothing else about those accounts is included. */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function authedUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) { return null; }
}

async function grab(table, uid, notes, column) {
  const col = column || 'user_id';
  try {
    const { data, error } = await supabase.from(table).select('*').eq(col, uid);
    if (error) { notes.push(table + ': ' + error.message); return []; }
    return data || [];
  } catch (e) { notes.push(table + ': unavailable'); return []; }
}

// ── formatting helpers ──────────────────────────────────────────────────────
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
function fmtDay(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : '');
const num = (v) => (v == null || v === '' ? '' : String(Math.round(parseFloat(v) * 10) / 10));

// "longshot_0_1" reads as "Longshot 1 (leg 2)".
function slotLabel(slot) {
  const s = String(slot || '');
  const m = s.match(/^([a-z]+)_(\d+)(?:_(\d+))?$/i);
  if (!m) return s;
  const names = {
    ml: 'Moneyline', spread: 'Spread', ou: 'Over/Under', total: 'Total',
    longshot: 'Longshot', prop: 'Player prop',
  };
  const key = m[1].toLowerCase();
  const base = names[key] || (m[1].charAt(0).toUpperCase() + m[1].slice(1));
  return base + ' ' + (Number(m[2]) + 1) + (m[3] != null ? ' (leg ' + (Number(m[3]) + 1) + ')' : '');
}
const resultLabel = (r) =>
  r === 'W' ? '<span class="w">Win</span>' :
  r === 'L' ? '<span class="l">Loss</span>' :
  (r === 'P' || r === 'void') ? '<span class="v">Void</span>' :
  '<span class="p">Pending</span>';

function table(headers, rows) {
  if (!rows.length) return '<p class="empty">Nothing recorded.</p>';
  return '<div class="tw"><table><thead><tr>' +
    headers.map(h => '<th>' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map(c => '<td>' + (c == null ? '' : c) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}

function buildHtml(p) {
  const a = p.account || {};
  const np = a.notification_preferences || {};
  const bill = a.billing || {};
  const kv = (rows) => '<div class="tw"><table class="kv"><tbody>' +
    rows.filter(r => r[1] !== '' && r[1] != null)
        .map(r => '<tr><th>' + esc(r[0]) + '</th><td>' + r[1] + '</td></tr>').join('') +
    '</tbody></table></div>';

  const c = p.counts || {};
  const chips = [
    ['Picks', c.picks], ['Matchups', c.matchups], ['Leagues', c.leagues],
    ['Messages', c.chat_messages], ['Notifications', c.notifications], ['AI history', c.ai_history],
  ].map(x => '<div class="chip"><b>' + (x[1] || 0) + '</b><span>' + esc(x[0]) + '</span></div>').join('');

  const byWeek = (x, y) => (Number(y.week) || 0) - (Number(x.week) || 0);

  return '<!DOCTYPE html>\n' +
'<html lang="en"><head><meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<title>PickLock data export' + (a.username ? ' \u2014 ' + esc(a.username) : '') + '</title>\n' +
'<style>\n' +
':root{color-scheme:dark}\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
'body{background:#0a0a0c;color:#fff;font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 16px 70px}\n' +
'.wrap{max-width:900px;margin:0 auto}\n' +
'header{padding:34px 0 22px;border-bottom:1px solid rgba(255,255,255,.09)}\n' +
'.brand{font-size:12px;font-weight:800;letter-spacing:.6px;color:#7EA4F2;text-transform:uppercase}\n' +
'h1{font-size:27px;font-weight:800;letter-spacing:-.6px;margin-top:8px}\n' +
'.sub{font-size:13px;color:rgba(255,255,255,.42);margin-top:6px;line-height:1.5}\n' +
'.chips{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 4px}\n' +
'.chip{background:#141418;border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:9px 13px;min-width:86px}\n' +
'.chip b{display:block;font-size:19px;font-weight:800}\n' +
'.chip span{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.38)}\n' +
'h2{font-size:17px;font-weight:800;margin:34px 0 10px;letter-spacing:-.2px}\n' +
'h2 small{font-weight:600;font-size:12px;color:rgba(255,255,255,.35);margin-left:7px}\n' +
'.tw{overflow-x:auto;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#111115}\n' +
'table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}\n' +
'th,td{text-align:left;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.055)}\n' +
'thead th{font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.4);background:#16161b}\n' +
'tbody tr:last-child td,tbody tr:last-child th{border-bottom:none}\n' +
'td{color:rgba(255,255,255,.78)}\n' +
'table.kv{white-space:normal}\n' +
'table.kv th{width:38%;font-weight:700;color:rgba(255,255,255,.45);font-size:12.5px;text-transform:none;letter-spacing:0;background:none}\n' +
'code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(255,255,255,.5)}\n' +
'.w{color:#30D158;font-weight:700}.l{color:#FF453A;font-weight:700}\n' +
'.v{color:rgba(255,255,255,.4);font-weight:700}.p{color:#FF9F0A;font-weight:700}\n' +
'.empty{color:rgba(255,255,255,.3);font-size:13.5px;padding:14px 2px}\n' +
'.note{background:rgba(59,111,224,.08);border:1px solid rgba(59,111,224,.24);border-radius:12px;padding:13px 15px;font-size:13px;color:rgba(255,255,255,.6);margin:18px 0}\n' +
'details{margin-top:34px;border-top:1px solid rgba(255,255,255,.09);padding-top:22px}\n' +
'summary{cursor:pointer;font-size:14px;font-weight:700;color:#7EA4F2}\n' +
'pre{margin-top:12px;background:#111115;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;overflow-x:auto;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(255,255,255,.6)}\n' +
'footer{margin-top:34px;padding-top:20px;border-top:1px solid rgba(255,255,255,.09);font-size:12.5px;color:rgba(255,255,255,.32);line-height:1.6}\n' +
'footer a{color:#7EA4F2;text-decoration:none}\n' +
'@media(max-width:560px){h1{font-size:23px}body{font-size:14px}th,td{padding:8px 10px}}\n' +
'</style></head><body><div class="wrap">\n' +
'<header><div class="brand">PickLock</div><h1>Your data export</h1>\n' +
'<div class="sub">' + esc(a.username || '') + (a.email ? ' &middot; ' + esc(a.email) : '') +
'<br>Generated ' + esc(fmtDate(p.export_generated_at)) + '</div></header>\n' +
'<div class="chips">' + chips + '</div>\n' +

'<h2>Account</h2>' + kv([
  ['Username', esc(a.username)],
  ['Email', esc(a.email)],
  ['Account created', esc(fmtDate(a.created_at))],
  ['Founding member', a.is_founder ? ('Yes' + (a.founder_number ? ' &middot; number ' + esc(a.founder_number) : '')) : 'No'],
  ['PickLock Pro', yesNo(a.is_pro)],
  ['Your referral code', esc(a.referral_code)],
  ['Referred by', esc(a.referred_by)],
  ['User ID', '<code>' + esc(a.user_id) + '</code>'],
]) +

'<h2>Notifications</h2>' + kv([
  ['Push notifications', yesNo(a.push_enabled)],
  ['Weekly results', yesNo(np.weekly_results)],
  ['Picks graded', yesNo(np.picks_graded)],
  ['Pick reminder', yesNo(np.pick_reminder)],
  ['League activity', yesNo(np.league_activity)],
  ['Plok', yesNo(np.plok)],
]) +

'<h2>Billing</h2>' + kv([
  ['Stripe customer ID', esc(bill.stripe_customer_id) || 'None'],
  ['Stripe subscription ID', esc(bill.stripe_subscription_id) || 'None'],
]) +
'<div class="note">PickLock never stores card numbers. Payment details live with Stripe.</div>\n' +

'<h2>Leagues <small>' + (p.leagues || []).length + '</small></h2>' +
table(['League', 'Role', 'Joined'], (p.leagues || []).map(l =>
  [esc(l.league_name || l.league_id), l.is_commissioner ? 'Commissioner' : 'Member', esc(fmtDay(l.joined))])) +

'<h2>Picks <small>' + (p.picks || []).length + '</small></h2>' +
table(['Week', 'League', 'Slot', 'Pick', 'Result', 'Points', 'Game date'],
  (p.picks || []).slice().sort(byWeek).map(k => [
    esc(k.week), esc(k._league || ''), esc(slotLabel(k.slot)),
    esc(k.selection || k.description || k.outcome || k.team || ''),
    resultLabel(k.result), num(k.points_earned), esc(fmtDay(k.game_date)),
  ])) +

'<h2>Matchups <small>' + (p.matchups || []).length + '</small></h2>' +
table(['Week', 'League', 'Opponent', 'Your points', 'Their points', 'Result'],
  (p.matchups || []).slice().sort(byWeek).map(m => [
    esc(m.week), esc(m._league || ''), esc(m._opponent || 'Bye'),
    num(m._myPoints), num(m._theirPoints),
    m._outcome === 'W' ? '<span class="w">Win</span>'
      : m._outcome === 'L' ? '<span class="l">Loss</span>'
      : '<span class="p">Unsettled</span>',
  ])) +

'<h2>Weekly ranks <small>' + (p.weekly_ranks || []).length + '</small></h2>' +
table(['Week', 'League', 'Rank'], (p.weekly_ranks || []).slice().sort(byWeek).map(r =>
  [esc(r.week), esc(r._league || ''), esc(r.rank)])) +

'<h2>Chat messages <small>' + (p.chat_messages || []).length + '</small></h2>' +
table(['Sent', 'League', 'Message'], (p.chat_messages || []).map(m =>
  [esc(fmtDate(m.created_at)), esc(m._league || ''), esc(m.body || m.text || m.message || '')])) +

'<h2>Notifications received <small>' + (p.notifications || []).length + '</small></h2>' +
table(['Sent', 'Title', 'Message'], (p.notifications || []).map(n =>
  [esc(fmtDate(n.created_at)), esc(n.title || ''), esc(n.body || n.message || '')])) +

'<h2>Plok history <small>' + (p.ai_history || []).length + '</small></h2>' +
table(['When', 'Result'], (p.ai_history || []).map(x =>
  [esc(fmtDate(x.created_at)), esc(x.result || '')])) +

((p.notes || []).length ? '<div class="note"><b>Notes:</b> ' + esc(p.notes.join('; ')) + '</div>' : '') +

'<details><summary>Raw data (JSON)</summary>\n' +
'<p style="font-size:12.5px;color:rgba(255,255,255,.4);margin-top:9px">The same information in machine-readable form, for moving it somewhere else.</p>\n' +
'<pre>' + esc(JSON.stringify(p, null, 2)) + '</pre></details>\n' +

'<footer>PickLock LLC &middot; Delaware &middot; Questions about this file: ' +
'<a href="mailto:joe@picklockapp.com">joe@picklockapp.com</a><br>' +
'Other people\'s picks and messages are not included.</footer>\n' +
'</div></body></html>';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env not set' });
  }

  try {
    const user = await authedUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const wantJson = String(body.format || 'html').toLowerCase() === 'json';

    const uid = user.id;
    const notes = [];

    const { data: profile } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (profile && profile.deleted_at) return res.status(409).json({ error: 'account deleted' });

    const [picks, memberships, messages, notifications, plok, ranks, reactions] = await Promise.all([
      grab('picks', uid, notes),
      grab('league_members', uid, notes),
      grab('league_messages', uid, notes),
      grab('notifications', uid, notes),
      grab('plok_calls', uid, notes),
      grab('weekly_ranks', uid, notes),
      grab('chat_reactions', uid, notes),
    ]);

    let matchups = [];
    try {
      const { data, error } = await supabase.from('matchups').select('*')
        .or('user1_id.eq.' + uid + ',user2_id.eq.' + uid);
      if (error) notes.push('matchups: ' + error.message); else matchups = data || [];
    } catch (e) { notes.push('matchups: unavailable'); }

    // ── resolve ids to names so the file reads as English, not uuids ─────────
    const leagueIds = [...new Set([
      ...memberships.map(m => m.league_id),
      ...picks.map(k => k.league_id),
      ...matchups.map(m => m.league_id),
      ...messages.map(m => m.league_id),
      ...ranks.map(r => r.league_id),
    ].filter(Boolean))];

    let leagues = [];
    if (leagueIds.length) {
      const { data } = await supabase.from('leagues')
        .select('id,name,sport,league_type,season_start,created_at').in('id', leagueIds);
      leagues = data || [];
    }
    const lName = (id) => (leagues.find(l => l.id === id) || {}).name || null;

    // Opponent usernames only — nothing else about those accounts.
    const oppIds = [...new Set(matchups
      .map(m => (m.user1_id === uid ? m.user2_id : m.user1_id))
      .filter(x => x && x !== uid))];
    let opps = [];
    if (oppIds.length) {
      const { data } = await supabase.from('users').select('id,username').in('id', oppIds);
      opps = data || [];
    }
    const uName = (id) => (opps.find(u => u.id === id) || {}).username || null;

    picks.forEach(k => { k._league = lName(k.league_id); });
    messages.forEach(m => { m._league = lName(m.league_id); });
    ranks.forEach(r => { r._league = lName(r.league_id); });
    matchups.forEach(m => {
      const mine = m.user1_id === uid;
      const oppId = mine ? m.user2_id : m.user1_id;
      m._league = lName(m.league_id);
      m._opponent = oppId ? (uName(oppId) || 'Unknown player') : null;
      m._myPoints = mine ? m.user1_points : m.user2_points;
      m._theirPoints = mine ? m.user2_points : m.user1_points;
      m._outcome = !m.winner_id ? null : (m.winner_id === uid ? 'W' : 'L');
    });

    const payload = {
      export_generated_at: new Date().toISOString(),
      export_format_version: 2,
      about_this_file:
        'Everything PickLock holds about your account. Other people\'s picks and messages are not included. ' +
        'Questions: joe@picklockapp.com',
      account: profile ? {
        user_id: profile.id,
        username: profile.username,
        email: profile.email,
        created_at: profile.created_at,
        is_founder: profile.is_founder,
        founder_number: profile.founder_number,
        is_pro: profile.is_pro,
        referral_code: profile.referral_code,
        referred_by: profile.referred_by,
        push_enabled: profile.push_enabled,
        notification_preferences: {
          weekly_results: profile.notif_results,
          picks_graded: profile.notif_grades,
          pick_reminder: profile.notif_reminder,
          league_activity: profile.notif_league,
          plok: profile.notif_plok,
        },
        billing: {
          stripe_customer_id: profile.stripe_customer_id || null,
          stripe_subscription_id: profile.stripe_subscription_id || null,
          note: 'PickLock never stores card numbers. Payment details live with Stripe.',
        },
      } : null,
      leagues: memberships.map(m => ({
        league_id: m.league_id,
        league_name: lName(m.league_id),
        is_commissioner: m.is_commissioner,
        joined: m.created_at || null,
      })),
      league_details: leagues,
      picks,
      matchups,
      weekly_ranks: ranks,
      chat_messages: messages,
      chat_reactions: reactions,
      notifications,
      ai_history: plok,
      counts: {
        picks: picks.length, matchups: matchups.length, leagues: memberships.length,
        chat_messages: messages.length, notifications: notifications.length, ai_history: plok.length,
      },
      notes,
    };

    const stamp = new Date().toISOString().slice(0, 10);
    const ext = wantJson ? 'json' : 'html';
    const out = wantJson ? JSON.stringify(payload, null, 2) : buildHtml(payload);

    res.statusCode = 200;
    res.setHeader('Content-Type', (wantJson ? 'application/json' : 'text/html') + '; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="picklock-data-' + stamp + '.' + ext + '"');
    res.setHeader('Cache-Control', 'no-store');
    // res.end, not res.send: send re-serialised the body, stripping indentation
    // and reordering keys.
    return res.end(out);

  } catch (e) {
    console.error('export-data: unexpected', e && e.message);
    return res.status(500).json({ error: 'Could not build your export. Please try again.' });
  }
}