import { seasonYear, scoreVal, parseLog, formSplit, totalSplit, spreadSplit, matchTeam, trendBullets, selectBullets } from "./trends.js";

let pass=0, fail=0;
const eq=(a,b,l)=>{ const A=JSON.stringify(a),B=JSON.stringify(b); if(A===B){pass++;} else {fail++;console.log(`FAIL ${l}\n  got ${A}\n  want ${B}`);} };

// ── seasonYear: the per-sport trap ──
eq(seasonYear("mlb", new Date("2026-07-15T00:00Z")), 2026, "mlb july");
eq(seasonYear("nfl", new Date("2026-07-15T00:00Z")), 2025, "nfl july -> last completed season");
eq(seasonYear("nfl", new Date("2026-09-15T00:00Z")), 2026, "nfl sept -> current");
eq(seasonYear("nfl", new Date("2027-01-15T00:00Z")), 2026, "nfl january -> still 2026 season");
eq(seasonYear("nba", new Date("2026-04-15T00:00Z")), 2026, "nba april -> 2025-26 = 2026");
eq(seasonYear("nba", new Date("2026-11-15T00:00Z")), 2027, "nba november -> 2026-27 = 2027");
eq(seasonYear("nba", new Date("2026-07-15T00:00Z")), 2026, "nba july -> 2026");

// ── scoreVal: the object-vs-string trap ──
eq(scoreVal({value:89,displayValue:"89"}), 89, "score object");
eq(scoreVal("22"), 22, "score string (scoreboard shape)");
eq(scoreVal(null), null, "score null");
eq(scoreVal({}), null, "score empty object");

// ── parseLog against the real probe payload shape ──
const ev = (date, meId, meHA, meScore, oppId, oppScore, completed=true, neutral=false) => ({
  date, competitions:[{ neutralSite:neutral, status:{type:{completed}},
    competitors:[
      {id:meId, homeAway:meHA, winner:meScore>oppScore, score:{value:meScore,displayValue:String(meScore)}, team:{abbreviation:"ME"}},
      {id:oppId, homeAway:meHA==="home"?"away":"home", winner:oppScore>meScore, score:{value:oppScore,displayValue:String(oppScore)}, team:{abbreviation:"OPP"}},
    ]}]});

// PHI's real last 5 from the probe, 2025 NFL
const phi = { events:[
  ev("2025-12-09T00:00Z","21","away",19,"24",22),
  ev("2025-12-14T00:00Z","21","home",31,"13",0),
  ev("2025-12-20T00:00Z","21","away",29,"28",18),
  ev("2025-12-28T00:00Z","21","away",13,"2",12),
  ev("2026-01-04T00:00Z","21","home",17,"28",24),
  ev("2026-01-11T00:00Z","21","home",0,"28",0,false),   // not completed -> must drop
]};
const log = parseLog(phi, "21");
eq(log.length, 5, "parseLog drops incomplete");
eq(log[0], {date:"2025-12-09",home:false,opp:"OPP",pf:19,pa:22,total:41,margin:-3,win:false}, "parseLog row matches probe output");
eq(log.map(g=>g.total), [41,31,47,25,41], "totals match probe");
eq(log.map(g=>g.margin), [-3,31,11,1,-7], "margins match probe");
eq(log.map(g=>g.date), ["2025-12-09","2025-12-14","2025-12-20","2025-12-28","2026-01-04"], "sorted oldest-first");
eq(parseLog({events:[ev("2025-12-09T00:00Z","21","away",19,"24",22)]}, "999").length, 0, "unknown teamId -> empty");
// neutral site is not a home game
eq(parseLog({events:[ev("2025-12-09T00:00Z","21","home",19,"24",22,true,true)]}, "21")[0].home, false, "neutral site != home");
// string scores (if ESPN ever changes shape back) still parse
const strEv = {events:[{date:"2025-12-09T00:00Z",competitions:[{status:{type:{completed:true}},competitors:[
  {id:"21",homeAway:"home",score:"19",team:{abbreviation:"ME"}},{id:"24",homeAway:"away",score:"22",team:{abbreviation:"OPP"}}]}]}]};
eq(parseLog(strEv,"21")[0].total, 41, "string scores still parse");

// ── sample gating: below MIN_LOG(6) everything returns null ──
eq(formSplit(log), null, "formSplit gated at 5 games");
eq(totalSplit(log, 44.5), null, "totalSplit gated");
eq(spreadSplit(log, -3.5), null, "spreadSplit gated");

// 10-game log: 6 home / 4 away, known totals+margins
const mk = (rows) => rows.map((r,i)=>({date:`2026-01-${String(i+1).padStart(2,"0")}`,home:r.h,opp:"X",pf:r.pf,pa:r.pa,total:r.pf+r.pa,margin:r.pf-r.pa,win:r.pf>r.pa}));
const L = mk([
  {h:true, pf:24,pa:20}, // t44 m+4 W
  {h:true, pf:30,pa:17}, // t47 m+13 W
  {h:true, pf:10,pa:27}, // t37 m-17 L
  {h:true, pf:21,pa:21}, // t42 m0  L(pf>pa false)
  {h:true, pf:35,pa:14}, // t49 m+21 W
  {h:true, pf:17,pa:20}, // t37 m-3 L
  {h:false,pf:28,pa:24}, // t52 m+4 W
  {h:false,pf:13,pa:31}, // t44 m-18 L
  {h:false,pf:20,pa:22}, // t42 m-2 L
  {h:false,pf:31,pa:13}, // t44 m+18 W
]);
const f = formSplit(L);
eq(f.n, 10, "form n");
eq(f.record, "5-5", "form record");
eq(f.homeRecord, "3-3", "form home record");
eq(f.awayRecord, "2-2", "form away record");
eq(f.pf, 22.9, "form pf avg");
eq(f.pa, 20.9, "form pa avg");

// totals vs a 44 line: exact pushes must NOT count as overs
const ts = totalSplit(L, 44);
eq(ts.all, {o:3,u:4,p:3,n:10}, "totalSplit counts pushes separately (44 is a push, not an over)");
eq(ts.home, {o:2,u:3,p:1,n:6}, "totalSplit home");
eq(ts.away, {o:1,u:1,p:2,n:4}, "totalSplit away");
eq(ts.avgTotal, 43.8, "avg total");
eq(totalSplit(L, null), null, "no line -> null");
eq(totalSplit(L, 44, 4), null, "window smaller than MIN_LOG -> null");

// spread -3.5: margin + point > 0 covers
const ss = spreadSplit(L, -3.5);
eq(ss.all, {c:5,nc:5,p:0,n:10}, "spreadSplit -3.5 (a +4 margin covers by a half point)");
// exact push: +3 with a -3 margin
const P = mk([{h:true,pf:20,pa:23},{h:true,pf:20,pa:23},{h:true,pf:20,pa:23},{h:false,pf:20,pa:23},{h:false,pf:20,pa:23},{h:false,pf:20,pa:23}]);
eq(spreadSplit(P, 3).all, {c:0,nc:0,p:6,n:6}, "spread exact push counted as push");
eq(spreadSplit(P, 3.5).all, {c:6,nc:0,p:6-6,n:6}, "half point turns push into cover");
// venue split needs >=3 games each side
const few = mk([{h:true,pf:20,pa:10},{h:true,pf:20,pa:10},{h:false,pf:20,pa:10},{h:false,pf:20,pa:10},{h:false,pf:20,pa:10},{h:false,pf:20,pa:10}]);
eq(totalSplit(few, 30).home, null, "venue split suppressed under 3 games");

// ── matchTeam ──
const teams = [
  {id:"21", abbr:"PHI", names:["philadelphia eagles","eagles","eagles","philadelphia","phi"]},
  {id:"22", abbr:"PHI", names:["philadelphia phillies","phillies","phillies","philadelphia","phi"]},
  {id:"19", abbr:"LAD", names:["los angeles dodgers","dodgers","dodgers","los angeles","lad"]},
];
eq(matchTeam(teams,"Philadelphia Eagles").id, "21", "matchTeam exact");
eq(matchTeam(teams,"Los Angeles Dodgers").id, "19", "matchTeam exact 2");
eq(matchTeam(teams,"Zzz Nonexistent"), null, "matchTeam miss -> null");

// ── the ATS guardrail: no bullet may claim cover/ATS history ──
const bl = trendBullets("nfl","ARI","PHI",L,L,{total:44,spreads:[{team:"PHI",point:-3.5}]});
const banned = /\bATS\b|covered in|the over is \d|\d-\d ATS|against the spread/i;
const bad = bl.filter(b=>banned.test(b.text));
eq(bad.map(b=>b.text), [], "no bullet claims ATS/cover history");
eq(bl.every(b=>b.text && (b.dir==="up"||b.dir==="down")), true, "bullets well-formed");
eq(bl.some(b=>/tonight's 44 total/.test(b.text)), true, "total bullet framed as tonight's number applied back");
eq(bl.some(b=>/tonight's -3.5/.test(b.text)), true, "spread bullet framed as tonight's number applied back");
eq(trendBullets("nfl","A","B",[],[],{}), [], "empty logs -> no bullets");

// ══ REGRESSION: the two honesty bugs found in the live Mets @ Phillies screenshot ══

// PHI had played exactly ONE home game in their last 10. We rendered "PHI 0-1 at home,
// 5-4 on the road" as a venue trend. One game is not a trend.
const lopsided = mk([
  {h:true, pf:2,pa:5},   // the single home game
  {h:false,pf:4,pa:2},{h:false,pf:5,pa:0},{h:false,pf:1,pa:0},{h:false,pf:5,pa:11},
  {h:false,pf:2,pa:10},{h:false,pf:3,pa:1},{h:false,pf:6,pa:4},{h:false,pf:0,pa:3},{h:false,pf:7,pa:2},
]);
const lf = formSplit(lopsided);
eq(lf.homeN, 1, "lopsided: one home game");
eq(lf.homeRecord, null, "1 home game -> NO home record (was '0-1')");
eq(lf.awayRecord, "6-3", "away side still reported on its own (9 games clears the floor)");
eq(lf.record, "6-4", "overall record still reported");
const lb = trendBullets("mlb","NYM","PHI",L,lopsided,{});
eq(lb.some(b=>b.kind==="venue" && b.team==="PHI"), false, "no PHI venue bullet from a 1-game sample");
eq(lb.some(b=>/0-1 at home/.test(b.text)), false, "the exact bad string never renders");
eq(totalSplit(lopsided, 9.5).home, null, "total venue split also suppressed at 1 home game");
eq(spreadSplit(lopsided, -1.5).home, null, "spread venue split also suppressed");

// The bull case cited a PHI total split that had been sliced off the screen.
// Selection must keep both sides' splits regardless of emission order.
const many = [
  {team:"NYM",kind:"form",dir:"up",text:"nym form"},
  {team:"NYM",kind:"venue",dir:"up",text:"nym venue"},
  {team:"PHI",kind:"form",dir:"up",text:"phi form"},
  {team:"PHI",kind:"venue",dir:"up",text:"phi venue"},
  {team:"NYM",kind:"total",dir:"up",text:"nym total"},
  {team:"NYM",kind:"totalVenue",dir:"up",text:"nym totalVenue"},
  {team:"PHI",kind:"total",dir:"up",text:"phi total"},
  {team:"PHI",kind:"totalVenue",dir:"up",text:"phi totalVenue"},
  {team:null, kind:"mlb",dir:"up",text:"starter era"},
];
const sel6 = selectBullets(many, 6);
eq(sel6.length, 6, "selectBullets respects max");
eq(sel6.some(b=>b.text==="nym total"), true, "NYM total survives");
eq(sel6.some(b=>b.text==="phi total"), true, "PHI total survives (the bug: it did not)");
eq(sel6.filter(b=>b.team==="NYM").length, sel6.filter(b=>b.team==="PHI").length, "sides balanced");
eq(sel6.map(b=>b.text), ["nym total","phi total","nym form","phi form","nym totalVenue","phi totalVenue"], "best kind first, round-robin (totalVenue outranks bare venue)");
// every team's top-priority bullet outranks the other team's second
eq(selectBullets(many, 2).map(b=>b.text), ["nym total","phi total"], "at max 2, one per side");
eq(selectBullets(many, 99).length, many.length, "max above supply -> everything, nothing dropped");
eq(selectBullets([], 8), [], "empty in, empty out");
// untagged bullets fill only leftover room, never displace a tagged split
eq(selectBullets(many, 9).some(b=>b.text==="starter era"), true, "loose bullets included when there's room");
eq(selectBullets(many, 8).some(b=>b.text==="starter era"), false, "loose bullets never displace tagged splits");

// tagging integrity
const tagged = trendBullets("nfl","ARI","PHI",L,L,{total:44,spreads:[{team:"PHI",point:-3.5}]});
eq(tagged.every(b=>b.team && b.kind), true, "every bullet is tagged with team + kind");

console.log(`\n${pass}/${pass+fail} passed`);
process.exit(fail?1:0);
