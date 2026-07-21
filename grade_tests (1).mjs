/**
 * grade_tests.mjs — postponed/cancelled game grading fixtures.
 * Run from api/:  node grade_tests.mjs
 *
 * Every fixture below is a REAL payload captured 19 Jul 2026 around the postponed
 * Dodgers @ Yankees game (gamePk 823523, original slot Sat 8:08pm ET, made up as
 * Sunday split-DH G1), the incident where MLB's "Postponed = abstractGameState Final"
 * put a zero-stat lineup into the box-score index and graded every Over on the game
 * as L. Nothing here is synthesized except where marked FUTURE-STATE.
 */
import { gradePick, gradeProp, schedGameCompleted } from "./grade.js";

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
}

/* ── Fixture: StatsAPI schedule entries (real, from sched_0718 / sched_0719) ───── */

// The poison: postponed original slot. abstract "Final", detailed "Postponed",
// rescheduleDate set, gameDate = the ORIGINAL Saturday time (1 min from the picks).
const SCHED_POSTPONED = {
  gamePk: 823523, gameDate: "2026-07-19T00:08:00Z", officialDate: "2026-07-19",
  status: { abstractGameState: "Final", detailedState: "Postponed", codedGameState: "D" },
  doubleHeader: "N", gameNumber: 1,
  rescheduleDate: "2026-07-19T16:35:00Z", rescheduleGameDate: "2026-07-19",
  teams: { away: { team: { name: "Los Angeles Dodgers" } }, home: { team: { name: "New York Yankees" } } },
};

// A genuinely played Final from the same real schedule response.
const SCHED_REAL_FINAL = {
  gamePk: 824414, gameDate: "2026-07-18T17:10:00Z",
  status: { abstractGameState: "Final", detailedState: "Final" },
  teams: { away: { team: { name: "Pittsburgh Pirates" } }, home: { team: { name: "Cleveland Guardians" } } },
};

// The makeup game's live slot, pre-game (real, from sched_0719).
const SCHED_MAKEUP_PREGAME = {
  gamePk: 823523, gameDate: "2026-07-19T16:35:00Z",
  status: { abstractGameState: "Preview", detailedState: "Pre-Game", codedGameState: "P" },
  doubleHeader: "S", gameNumber: 1,
  rescheduledFrom: "2026-07-19T00:08:00Z", rescheduledFromDate: "2026-07-18",
};

// FUTURE-STATE: the makeup slot once actually played. rescheduledFrom stays; NO
// rescheduleDate. This MUST index — the makeup is a real game.
const SCHED_MAKEUP_FINAL = {
  gamePk: 823523, gameDate: "2026-07-19T16:35:00Z",
  status: { abstractGameState: "Final", detailedState: "Final" },
  rescheduledFrom: "2026-07-19T00:08:00Z", rescheduledFromDate: "2026-07-18",
};

t("index filter: postponed original slot is EXCLUDED", schedGameCompleted(SCHED_POSTPONED), false);
t("index filter: real final still indexes",            schedGameCompleted(SCHED_REAL_FINAL), true);
t("index filter: pre-game makeup excluded",            schedGameCompleted(SCHED_MAKEUP_PREGAME), false);
t("index filter: PLAYED makeup (rescheduledFrom) indexes", schedGameCompleted(SCHED_MAKEUP_FINAL), true);
t("index filter: cancelled excluded",
  schedGameCompleted({ status: { abstractGameState: "Final", detailedState: "Cancelled" } }), false);
t("index filter: suspended excluded",
  schedGameCompleted({ status: { abstractGameState: "Live", detailedState: "Suspended" } }), false);

/* ── Fixture: ESPN feed in the grader's shape (real, from espn_0718 mapped by
      fetchScoresESPN: STATUS_POSTPONED -> voided:true, completed:false) ─────────── */

const ESPN_SHELL = {
  home_team: "New York Yankees", away_team: "Los Angeles Dodgers",
  completed: false, voided: true, inProgress: false,
  date: "2026-07-19T00:08Z", id: "401816157",
  scores: [{ name: "New York Yankees", score: "0" }, { name: "Los Angeles Dodgers", score: "0" }],
};
// FUTURE-STATE: Sunday G2 final (23.2h after the original slot) — inside the OLD 24h
// window, outside the new 11h one. Scores arbitrary but real-shaped.
const ESPN_G2_FINAL = {
  home_team: "New York Yankees", away_team: "Los Angeles Dodgers",
  completed: true, voided: false, inProgress: false,
  date: "2026-07-19T23:20Z", id: "401816172",
  scores: [{ name: "New York Yankees", score: "3" }, { name: "Los Angeles Dodgers", score: "5" }],
};

/* ── Picks: verbatim rows from the incident (ids trimmed) ─────────────────────── */

const PICK_PROP_OHTANI = { slot: "prop_2", pick_name: "Shohei Ohtani Over 0.5 Home Runs",
  game: "Los Angeles Dodgers @ New York Yankees", game_date: "2026-07-19 00:09:00+00" };
const PICK_LONGSHOT_BELLI = { slot: "longshot_7", pick_name: "Cody Bellinger Over 0.5 Home Runs",
  game: "Los Angeles Dodgers @ New York Yankees", game_date: "2026-07-19 00:09:00+00" };
const PICK_ML_NYY = { slot: "ml_0", pick_name: "New York Yankees",
  game: "Los Angeles Dodgers @ New York Yankees", game_date: "2026-07-19 00:09:00+00" };

/* ── The poison index: what buildMlbStatsApiIndex ingested pre-fix — the postponed
      game's box (real: 10 players/side, 31-key ALL-ZERO batting lines) ─────────── */
const POISON_ENTRY = { date: Date.parse("2026-07-19T00:08:00Z"),
  home: "New York Yankees", away: "Los Angeles Dodgers",
  stats: { homeRuns: 0, totalBases: 0, stolenBases: 0, hits: 0, doubles: 0, triples: 0 } };
const POISON_INDEX = { "shohei ohtani": [POISON_ENTRY], "cody bellinger": [POISON_ENTRY] };

// Sanity: gradeProp ALONE still loses to the poison (documents why the filter fix
// matters — this entry must never be born).
t("gradeProp vs poison index alone = L (the incident, reproduced)",
  gradeProp(PICK_PROP_OHTANI.pick_name, PICK_PROP_OHTANI.game, POISON_INDEX, {}, PICK_PROP_OHTANI.game_date), "L");

/* ── The fix: voided check fires BEFORE the index is consulted ────────────────── */

t("prop on postponed game -> P (voided beats poison index)",
  gradePick(PICK_PROP_OHTANI, [ESPN_SHELL], POISON_INDEX, {}), "P");
t("player-prop longshot leg on postponed game -> P",
  gradePick(PICK_LONGSHOT_BELLI, [ESPN_SHELL], POISON_INDEX, {}), "P");
t("team ML on postponed game -> P (regression: existing void path)",
  gradePick(PICK_ML_NYY, [ESPN_SHELL], {}, {}), "P");

/* ── 11h date-bind: the makeup games can NEVER grade a Saturday pick ──────────── */

// Real G1-final index entry (16:35Z, +16.4h from the pick) with real-shaped stats.
const G1_ENTRY = { date: Date.parse("2026-07-19T16:35:00Z"),
  home: "New York Yankees", away: "Los Angeles Dodgers",
  stats: { homeRuns: 1, totalBases: 4, stolenBases: 0, hits: 2, doubles: 1, triples: 0 } };
const G1_INDEX = { "shohei ohtani": [G1_ENTRY], "cody bellinger": [G1_ENTRY] };

t("prop: G1 final at +16.4h stays PENDING (11h bind, no ESPN shell in feed)",
  gradePick(PICK_PROP_OHTANI, [], G1_INDEX, {}), null);
t("gradeProp direct: G1 entry rejected by 11h bind",
  gradeProp(PICK_PROP_OHTANI.pick_name, PICK_PROP_OHTANI.game, G1_INDEX, {}, PICK_PROP_OHTANI.game_date), null);
t("team ML: only G2 final at +23.2h in feed -> PENDING (was gradable under old 24h)",
  gradePick(PICK_ML_NYY, [ESPN_G2_FINAL], {}, {}), null);
t("team ML: shell + G2 both in feed -> P (shell is closer, voided wins)",
  gradePick(PICK_ML_NYY, [ESPN_SHELL, ESPN_G2_FINAL], {}, {}), "P");
t("prop: shell + G2 + G1 index -> P",
  gradePick(PICK_PROP_OHTANI, [ESPN_SHELL, ESPN_G2_FINAL], G1_INDEX, {}), "P");

/* ── Non-postponed grading unaffected ─────────────────────────────────────────── */

const NORMAL_GAME = {
  home_team: "Cleveland Guardians", away_team: "Pittsburgh Pirates",
  completed: true, voided: false, inProgress: false, date: "2026-07-18T17:10Z",
  scores: [{ name: "Cleveland Guardians", score: "4" }, { name: "Pittsburgh Pirates", score: "2" }],
};
t("normal final still grades (ML winner -> W)",
  gradePick({ slot: "ml_0", pick_name: "Cleveland Guardians",
    game: "Pittsburgh Pirates @ Cleveland Guardians", game_date: "2026-07-18T17:10:00Z" },
    [NORMAL_GAME], {}, {}), "W");
t("normal final still grades (ML loser -> L)",
  gradePick({ slot: "ml_0", pick_name: "Pittsburgh Pirates",
    game: "Pittsburgh Pirates @ Cleveland Guardians", game_date: "2026-07-18T17:10:00Z" },
    [NORMAL_GAME], {}, {}), "L");
t("normal prop with valid same-time entry still grades",
  gradeProp("Shohei Ohtani Over 0.5 Home Runs", "Los Angeles Dodgers @ New York Yankees",
    { "shohei ohtani": [{ ...G1_ENTRY }] }, {}, "2026-07-19T16:35:00Z"), "W");


/* ── Doubleheader siblings: a G2 prop must never grade off G1's final box ────── */
// Real incident 19 Jul 2026 (second bite): replacement prop with G2's start time
// (23:21Z) graded L off the G1 box (16:35Z, 6.8h away — inside the old 11h window)
// while G2 was in the 8th inning.
const PICK_G2_CHISHOLM = { slot: "prop_6", pick_name: "Jazz Chisholm Jr. Over 0.5 Home Runs",
  game: "Los Angeles Dodgers @ New York Yankees", game_date: "2026-07-19T23:21:00Z" };
const G1_FINAL_ENTRY = { date: Date.parse("2026-07-19T16:35:00Z"),
  home: "New York Yankees", away: "Los Angeles Dodgers",
  stats: { homeRuns: 0, totalBases: 1, stolenBases: 0, hits: 1, doubles: 0, triples: 0 } };
const G2_FINAL_ENTRY = { date: Date.parse("2026-07-19T23:21:00Z"),
  home: "New York Yankees", away: "Los Angeles Dodgers",
  stats: { homeRuns: 1, totalBases: 4, stolenBases: 0, hits: 2, doubles: 0, triples: 0 } };

t("DH: G2 prop vs only-G1-final index stays PENDING (2h bind)",
  gradeProp(PICK_G2_CHISHOLM.pick_name, PICK_G2_CHISHOLM.game,
    { "jazz chisholm jr": [G1_FINAL_ENTRY] }, {}, PICK_G2_CHISHOLM.game_date), null);
t("DH: G2 prop grades off G2 once final (both entries present)",
  gradeProp(PICK_G2_CHISHOLM.pick_name, PICK_G2_CHISHOLM.game,
    { "jazz chisholm jr": [G1_FINAL_ENTRY, G2_FINAL_ENTRY] }, {}, PICK_G2_CHISHOLM.game_date), "W");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
