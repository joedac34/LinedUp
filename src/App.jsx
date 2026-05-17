import { useState, useEffect, useRef } from "react";
import { supabase } from './supabase';

// iOS System Colors
const IOS = {
  blue:    "#0A84FF",
  green:   "#30D158",
  red:     "#FF453A",
  orange:  "#FF9F0A",
  purple:  "#BF5AF2",
  teal:    "#5AC8FA",
  yellow:  "#FFD60A",
  pink:    "#FF375F",
  indigo:  "#5E5CE6",
  gray:    "#8E8E93",
  gray2:   "#636366",
  gray3:   "#48484A",
  gray4:   "#3A3A3C",
  gray5:   "#2C2C2E",
  gray6:   "#1C1C1E",
  bg:      "#000000",
  bg2:     "#1C1C1E",
  bg3:     "#2C2C2E",
  label:   "#FFFFFF",
  label2:  "rgba(255,255,255,0.6)",
  label3:  "rgba(255,255,255,0.3)",
  label4:  "rgba(255,255,255,0.18)",
  sep:     "rgba(255,255,255,0.1)",
  fill:    "rgba(255,255,255,0.05)",
  fill2:   "rgba(255,255,255,0.08)",
  fill3:   "rgba(255,255,255,0.12)",
};

// ─── SPORT CONFIG ───────────────────────────────────────────────
const SPORTS = {
  nfl: {
    id:"nfl", label:"NFL", icon:"🏈", color:"#0A84FF",
    season:"2024 NFL Season",
    slots:[
      { id:"ml",       label:"Moneyline",  mult:1, icon:"🎯", color:"#0A84FF", bg:"rgba(10,132,255,0.15)",  desc:"Pick a winner straight up" },
      { id:"prop",     label:"Prop",       mult:2, icon:"⭐", color:"#FFD60A", bg:"rgba(255,214,10,0.15)",  desc:"Player or game prop bet" },
      { id:"ou",       label:"Over/Under", mult:3, icon:"📊", color:"#FF9F0A", bg:"rgba(255,159,10,0.15)",  desc:"Total points over or under" },
      { id:"spread",   label:"Spread",     mult:4, icon:"📐", color:"#30D158", bg:"rgba(48,209,88,0.15)",   desc:"Beat the point spread" },
      { id:"longshot", label:"Parlay",     mult:5, icon:"🚀", color:"#FF375F", bg:"rgba(255,55,95,0.15)",   desc:"Build a mini parlay — pick 2+ bets" },
    ],
    bets:{
      ml:[
        { id:"ml1",  game:"Raiders @ Chiefs",      pick:"KC Chiefs",          odds:"-280", impliedOdds:-280 },
        { id:"ml2",  game:"Cowboys @ Eagles",      pick:"Philadelphia Eagles",odds:"-165", impliedOdds:-165 },
        { id:"ml3",  game:"Dolphins @ Bills",      pick:"Buffalo Bills",      odds:"-210", impliedOdds:-210 },
        { id:"ml4",  game:"Rams @ 49ers",          pick:"San Francisco 49ers",odds:"-195", impliedOdds:-195 },
        { id:"ml5",  game:"Vikings @ Packers",     pick:"Green Bay Packers",  odds:"-125", impliedOdds:-125 },
        { id:"ml6",  game:"Panthers @ Falcons",    pick:"Atlanta Falcons",    odds:"-245", impliedOdds:-245 },
        { id:"ml7",  game:"Broncos @ Chargers",    pick:"LA Chargers",        odds:"-165", impliedOdds:-165 },
        { id:"ml8",  game:"Giants @ Commanders",   pick:"Washington Commanders",odds:"-170",impliedOdds:-170},
        { id:"ml9",  game:"Bears @ Lions",         pick:"Detroit Lions",      odds:"-300", impliedOdds:-300 },
        { id:"ml10", game:"Bengals @ Ravens",       pick:"Baltimore Ravens",   odds:"-155", impliedOdds:-155 },
        { id:"ml11", game:"Seahawks @ Cardinals",  pick:"Seattle Seahawks",   odds:"-130", impliedOdds:-130 },
        { id:"ml12", game:"Saints @ Buccaneers",   pick:"Tampa Bay Buccaneers",odds:"-120",impliedOdds:-120 },
        { id:"ml13", game:"Jets @ Patriots",       pick:"NY Jets",            odds:"-140", impliedOdds:-140 },
        { id:"ml14", game:"Steelers @ Browns",     pick:"Pittsburgh Steelers",odds:"+110", impliedOdds:110  },
        { id:"ml15", game:"Colts @ Titans",        pick:"Indianapolis Colts", odds:"-105", impliedOdds:-105 },
        { id:"ml16", game:"Raiders @ Chiefs",      pick:"Las Vegas Raiders",  odds:"+240", impliedOdds:240  },
        { id:"ml17", game:"Cowboys @ Eagles",      pick:"Dallas Cowboys",     odds:"+145", impliedOdds:145  },
      ],
      prop:[
        { id:"pr1",  game:"Patrick Mahomes",       pick:"300+ Pass Yards",    odds:"-130", impliedOdds:-130 },
        { id:"pr2",  game:"Jalen Hurts",           pick:"2+ Rush TDs",        odds:"+175", impliedOdds:175  },
        { id:"pr3",  game:"Josh Allen",            pick:"35+ Pass Attempts",  odds:"-115", impliedOdds:-115 },
        { id:"pr4",  game:"Brock Purdy",           pick:"Over 1.5 TDs",       odds:"-140", impliedOdds:-140 },
        { id:"pr5",  game:"Christian McCaffrey",   pick:"90.5+ Rush Yds",     odds:"-110", impliedOdds:-110 },
        { id:"pr6",  game:"Tyreek Hill",           pick:"Over 85.5 Rec Yds",  odds:"-125", impliedOdds:-125 },
        { id:"pr7",  game:"Davante Adams",         pick:"Over 65.5 Rec Yds",  odds:"-118", impliedOdds:-118 },
        { id:"pr8",  game:"Travis Kelce",          pick:"Over 55.5 Rec Yds",  odds:"-130", impliedOdds:-130 },
        { id:"pr9",  game:"Stefon Diggs",          pick:"Over 70.5 Rec Yds",  odds:"-115", impliedOdds:-115 },
        { id:"pr10", game:"Justin Jefferson",      pick:"Over 80.5 Rec Yds",  odds:"-120", impliedOdds:-120 },
        { id:"pr11", game:"Lamar Jackson",         pick:"50+ Rush Yards",     odds:"-135", impliedOdds:-135 },
        { id:"pr12", game:"CeeDee Lamb",           pick:"Over 75.5 Rec Yds",  odds:"-118", impliedOdds:-118 },
        { id:"pr13", game:"Ja'Marr Chase",         pick:"Over 70.5 Rec Yds",  odds:"-115", impliedOdds:-115 },
        { id:"pr14", game:"Deebo Samuel",          pick:"Over 60.5 Rec Yds",  odds:"-108", impliedOdds:-108 },
        { id:"pr15", game:"Derrick Henry",         pick:"Over 85.5 Rush Yds", odds:"-120", impliedOdds:-120 },
        { id:"pr16", game:"Patrick Mahomes",       pick:"2+ TD Passes",       odds:"-150", impliedOdds:-150 },
        { id:"pr17", game:"Josh Allen",            pick:"1+ Rush TD",         odds:"-130", impliedOdds:-130 },
        { id:"pr18", game:"Jalen Hurts",           pick:"Over 240.5 Pass Yds",odds:"-115", impliedOdds:-115 },
      ],
      ou:[
        { id:"ou1",  game:"Raiders @ Chiefs",      pick:"Over 47.5",          odds:"-110", impliedOdds:-110 },
        { id:"ou2",  game:"Cowboys @ Eagles",      pick:"Under 44",           odds:"-110", impliedOdds:-110 },
        { id:"ou3",  game:"Dolphins @ Bills",      pick:"Over 48",            odds:"-115", impliedOdds:-115 },
        { id:"ou4",  game:"Rams @ 49ers",          pick:"Under 45.5",         odds:"-110", impliedOdds:-110 },
        { id:"ou5",  game:"Vikings @ Packers",     pick:"Over 43",            odds:"-118", impliedOdds:-118 },
        { id:"ou6",  game:"Panthers @ Falcons",    pick:"Over 41",            odds:"-112", impliedOdds:-112 },
        { id:"ou7",  game:"Broncos @ Chargers",    pick:"Under 44",           odds:"-110", impliedOdds:-110 },
        { id:"ou8",  game:"Giants @ Commanders",   pick:"Under 40.5",         odds:"-108", impliedOdds:-108 },
        { id:"ou9",  game:"Bears @ Lions",         pick:"Over 50.5",          odds:"-115", impliedOdds:-115 },
        { id:"ou10", game:"Bengals @ Ravens",      pick:"Over 46",            odds:"-112", impliedOdds:-112 },
        { id:"ou11", game:"Seahawks @ Cardinals",  pick:"Over 44.5",          odds:"-110", impliedOdds:-110 },
        { id:"ou12", game:"Saints @ Buccaneers",   pick:"Under 43",           odds:"-110", impliedOdds:-110 },
        { id:"ou13", game:"Jets @ Patriots",       pick:"Under 38.5",         odds:"-115", impliedOdds:-115 },
        { id:"ou14", game:"Steelers @ Browns",     pick:"Under 36.5",         odds:"-110", impliedOdds:-110 },
        { id:"ou15", game:"Colts @ Titans",        pick:"Over 42.5",          odds:"-108", impliedOdds:-108 },
      ],
      spread:[
        { id:"sp1",  game:"Raiders @ Chiefs",      pick:"KC Chiefs -6.5",     odds:"-110", impliedOdds:-110 },
        { id:"sp2",  game:"Cowboys @ Eagles",      pick:"Eagles -3",          odds:"-110", impliedOdds:-110 },
        { id:"sp3",  game:"Dolphins @ Bills",      pick:"Bills -5",           odds:"-115", impliedOdds:-115 },
        { id:"sp4",  game:"Rams @ 49ers",          pick:"49ers -4.5",         odds:"-110", impliedOdds:-110 },
        { id:"sp5",  game:"Panthers @ Falcons",    pick:"Falcons -6",         odds:"-108", impliedOdds:-108 },
        { id:"sp6",  game:"Broncos @ Chargers",    pick:"Chargers -3.5",      odds:"-110", impliedOdds:-110 },
        { id:"sp7",  game:"Giants @ Commanders",   pick:"Commanders -3",      odds:"-112", impliedOdds:-112 },
        { id:"sp8",  game:"Bears @ Lions",         pick:"Lions -8.5",         odds:"-110", impliedOdds:-110 },
        { id:"sp9",  game:"Bengals @ Ravens",      pick:"Ravens -4",          odds:"-115", impliedOdds:-115 },
        { id:"sp10", game:"Seahawks @ Cardinals",  pick:"Seahawks -3",        odds:"-110", impliedOdds:-110 },
        { id:"sp11", game:"Saints @ Buccaneers",   pick:"Buccaneers -2.5",    odds:"-110", impliedOdds:-110 },
        { id:"sp12", game:"Jets @ Patriots",       pick:"Jets -3",            odds:"-112", impliedOdds:-112 },
        { id:"sp13", game:"Steelers @ Browns",     pick:"Browns +2.5",        odds:"-110", impliedOdds:-110 },
        { id:"sp14", game:"Colts @ Titans",        pick:"Colts -1",           odds:"-110", impliedOdds:-110 },
        { id:"sp15", game:"Vikings @ Packers",     pick:"Packers -2",         odds:"-112", impliedOdds:-112 },
        { id:"sp16", game:"Raiders @ Chiefs",      pick:"Raiders +6.5",       odds:"-110", impliedOdds:-110 },
        { id:"sp17", game:"Cowboys @ Eagles",      pick:"Cowboys +3",         odds:"-110", impliedOdds:-110 },
      ],
      longshot:[
        { id:"ls1",  game:"Raiders @ Chiefs",      pick:"Raiders ML",         odds:"+240", impliedOdds:240 },
        { id:"ls2",  game:"Cowboys @ Eagles",      pick:"Cowboys ML",         odds:"+350", impliedOdds:350 },
        { id:"ls3",  game:"Panthers @ Falcons",    pick:"Panthers ML",        odds:"+380", impliedOdds:380 },
        { id:"ls4",  game:"Giants @ Commanders",   pick:"Giants ML",          odds:"+310", impliedOdds:310 },
        { id:"ls5",  game:"Broncos @ Chargers",    pick:"Broncos ML",         odds:"+420", impliedOdds:420 },
        { id:"ls6",  game:"Bears @ Lions",         pick:"Bears ML",           odds:"+460", impliedOdds:460 },
        { id:"ls7",  game:"Jets @ Patriots",       pick:"Patriots ML",        odds:"+265", impliedOdds:265 },
        { id:"ls8",  game:"Steelers @ Browns",     pick:"Steelers ML",        odds:"+185", impliedOdds:185 },
        { id:"ls9",  game:"Seahawks @ Cardinals",  pick:"Cardinals ML",       odds:"+290", impliedOdds:290 },
        { id:"ls10", game:"Saints @ Buccaneers",   pick:"Saints ML",          odds:"+175", impliedOdds:175 },
        { id:"ls11", game:"Vikings @ Packers",     pick:"Vikings +2 1H",      odds:"+140", impliedOdds:140 },
        { id:"ls12", game:"Colts @ Titans",        pick:"Titans ML",          odds:"+195", impliedOdds:195 },
        { id:"ls13", game:"Patrick Mahomes",       pick:"4+ TD Passes",       odds:"+280", impliedOdds:280 },
        { id:"ls14", game:"Bengals @ Ravens",      pick:"Bengals ML",         odds:"+210", impliedOdds:210 },
        { id:"ls15", game:"Josh Allen",            pick:"2+ Rush TDs",        odds:"+340", impliedOdds:340 },
      ],
    },
  },
  nba: {
    id:"nba", label:"NBA", icon:"🏀", color:"#FF6B35",
    season:"2024-25 NBA Season",
    slots:[
      { id:"ml",       label:"Moneyline",  mult:1, icon:"🎯", color:"#FF6B35", bg:"rgba(255,107,53,0.15)",  desc:"Pick a team to win straight up" },
      { id:"prop",     label:"Player Prop",mult:2, icon:"⭐", color:"#FFD60A", bg:"rgba(255,214,10,0.15)",  desc:"Points, assists, rebounds prop" },
      { id:"ou",       label:"Over/Under", mult:3, icon:"📊", color:"#30D158", bg:"rgba(48,209,88,0.15)",   desc:"Total points scored" },
      { id:"spread",   label:"Spread",     mult:4, icon:"📐", color:"#BF5AF2", bg:"rgba(191,90,242,0.15)",  desc:"Beat the point spread" },
      { id:"longshot", label:"Parlay",     mult:5, icon:"🚀", color:"#FF375F", bg:"rgba(255,55,95,0.15)",   desc:"Build a same-game parlay" },
    ],
    bets:{
      ml:[
        { id:"ml1", game:"Celtics @ Lakers",   pick:"Boston Celtics",   odds:"-145", impliedOdds:-145 },
        { id:"ml2", game:"Warriors @ Nuggets", pick:"Golden State",     odds:"+125", impliedOdds:125  },
        { id:"ml3", game:"Heat @ Bucks",       pick:"Milwaukee Bucks",  odds:"-165", impliedOdds:-165 },
        { id:"ml4", game:"Suns @ Clippers",    pick:"LA Clippers",      odds:"-110", impliedOdds:-110 },
        { id:"ml5", game:"Knicks @ 76ers",     pick:"New York Knicks",  odds:"+105", impliedOdds:105  },
      ],
      prop:[
        { id:"pr1", game:"LeBron James",       pick:"25+ Points",        odds:"-130", impliedOdds:-130 },
        { id:"pr2", game:"Steph Curry",        pick:"5+ Three-Pointers", odds:"-115", impliedOdds:-115 },
        { id:"pr3", game:"Nikola Jokic",       pick:"10+ Assists",       odds:"+145", impliedOdds:145  },
        { id:"pr4", game:"Jayson Tatum",       pick:"30+ Points",        odds:"+175", impliedOdds:175  },
        { id:"pr5", game:"Giannis",            pick:"12+ Rebounds",      odds:"-120", impliedOdds:-120 },
      ],
      ou:[
        { id:"ou1", game:"Celtics @ Lakers",   pick:"Over 224.5",  odds:"-110", impliedOdds:-110 },
        { id:"ou2", game:"Warriors @ Nuggets", pick:"Over 232",    odds:"-115", impliedOdds:-115 },
        { id:"ou3", game:"Heat @ Bucks",       pick:"Under 218.5", odds:"-110", impliedOdds:-110 },
        { id:"ou4", game:"Suns @ Clippers",    pick:"Over 228",    odds:"-108", impliedOdds:-108 },
        { id:"ou5", game:"Knicks @ 76ers",     pick:"Under 215",   odds:"-112", impliedOdds:-112 },
      ],
      spread:[
        { id:"sp1", game:"Celtics @ Lakers",   pick:"Celtics -3.5",  odds:"-110", impliedOdds:-110 },
        { id:"sp2", game:"Warriors @ Nuggets", pick:"Nuggets -2",    odds:"-110", impliedOdds:-110 },
        { id:"sp3", game:"Heat @ Bucks",       pick:"Bucks -5.5",    odds:"-115", impliedOdds:-115 },
        { id:"sp4", game:"Suns @ Clippers",    pick:"Clippers -1.5", odds:"-110", impliedOdds:-110 },
        { id:"sp5", game:"Knicks @ 76ers",     pick:"76ers -2",      odds:"-108", impliedOdds:-108 },
      ],
      longshot:[
        { id:"ls1", game:"Warriors @ Nuggets", pick:"Warriors ML",     odds:"+125", impliedOdds:125  },
        { id:"ls2", game:"Knicks @ 76ers",     pick:"Knicks ML",       odds:"+105", impliedOdds:105  },
        { id:"ls3", game:"Pistons @ Cavs",     pick:"Pistons ML",      odds:"+340", impliedOdds:340  },
        { id:"ls4", game:"Wizards @ Celtics",  pick:"Wizards ML",      odds:"+520", impliedOdds:520  },
        { id:"ls5", game:"Spurs @ Thunder",    pick:"Spurs ML",        odds:"+290", impliedOdds:290  },
        { id:"ls6", game:"Steph Curry",        pick:"8+ Three-Pointers",odds:"+450",impliedOdds:450  },
      ],
    },
  },
  mlb: {
    id:"mlb", label:"MLB", icon:"⚾", color:"#30D158",
    season:"2024 MLB Season",
    slots:[
      { id:"ml",       label:"Moneyline",  mult:1, icon:"🎯", color:"#30D158", bg:"rgba(48,209,88,0.15)",   desc:"Pick a team to win" },
      { id:"prop",     label:"Player Prop",mult:2, icon:"⭐", color:"#FFD60A", bg:"rgba(255,214,10,0.15)",  desc:"Strikeouts, hits, RBI prop" },
      { id:"ou",       label:"Over/Under", mult:3, icon:"📊", color:"#0A84FF", bg:"rgba(10,132,255,0.15)",  desc:"Total runs scored" },
      { id:"spread",   label:"Run Line",   mult:4, icon:"📐", color:"#FF9F0A", bg:"rgba(255,159,10,0.15)",  desc:"-1.5 or +1.5 run line" },
      { id:"longshot", label:"Parlay",     mult:5, icon:"🚀", color:"#FF375F", bg:"rgba(255,55,95,0.15)",   desc:"Build a multi-game parlay" },
    ],
    bets:{
      ml:[
        { id:"ml1", game:"Yankees @ Red Sox",  pick:"New York Yankees",    odds:"-145", impliedOdds:-145 },
        { id:"ml2", game:"Dodgers @ Giants",   pick:"LA Dodgers",          odds:"-175", impliedOdds:-175 },
        { id:"ml3", game:"Cubs @ Cardinals",   pick:"St. Louis Cardinals", odds:"-120", impliedOdds:-120 },
        { id:"ml4", game:"Astros @ Rangers",   pick:"Houston Astros",      odds:"-130", impliedOdds:-130 },
        { id:"ml5", game:"Braves @ Mets",      pick:"Atlanta Braves",      odds:"-115", impliedOdds:-115 },
      ],
      prop:[
        { id:"pr1", game:"Shohei Ohtani",      pick:"2+ RBIs",            odds:"+155", impliedOdds:155  },
        { id:"pr2", game:"Gerrit Cole",        pick:"8+ Strikeouts",      odds:"-125", impliedOdds:-125 },
        { id:"pr3", game:"Mookie Betts",       pick:"Over 1.5 Hits",      odds:"-140", impliedOdds:-140 },
        { id:"pr4", game:"Aaron Judge",        pick:"Home Run",           odds:"+280", impliedOdds:280  },
        { id:"pr5", game:"Freddie Freeman",    pick:"Over 0.5 RBIs",      odds:"-160", impliedOdds:-160 },
      ],
      ou:[
        { id:"ou1", game:"Yankees @ Red Sox",  pick:"Over 8.5",   odds:"-115", impliedOdds:-115 },
        { id:"ou2", game:"Dodgers @ Giants",   pick:"Under 7.5",  odds:"-110", impliedOdds:-110 },
        { id:"ou3", game:"Cubs @ Cardinals",   pick:"Over 9",     odds:"-108", impliedOdds:-108 },
        { id:"ou4", game:"Astros @ Rangers",   pick:"Under 8",    odds:"-112", impliedOdds:-112 },
        { id:"ou5", game:"Braves @ Mets",      pick:"Over 8.5",   odds:"-110", impliedOdds:-110 },
      ],
      spread:[
        { id:"sp1", game:"Yankees @ Red Sox",  pick:"Yankees -1.5",  odds:"+145", impliedOdds:145  },
        { id:"sp2", game:"Dodgers @ Giants",   pick:"Dodgers -1.5",  odds:"+125", impliedOdds:125  },
        { id:"sp3", game:"Cubs @ Cardinals",   pick:"Cardinals -1.5",odds:"+135", impliedOdds:135  },
        { id:"sp4", game:"Astros @ Rangers",   pick:"Astros -1.5",   odds:"+140", impliedOdds:140  },
        { id:"sp5", game:"Braves @ Mets",      pick:"Mets +1.5",     odds:"-165", impliedOdds:-165 },
      ],
      longshot:[
        { id:"ls1", game:"Yankees @ Red Sox",  pick:"Red Sox ML",    odds:"+125", impliedOdds:125  },
        { id:"ls2", game:"Giants @ Dodgers",   pick:"Giants ML",     odds:"+155", impliedOdds:155  },
        { id:"ls3", game:"Cubs @ Cardinals",   pick:"Cubs ML",       odds:"+105", impliedOdds:105  },
        { id:"ls4", game:"Aaron Judge",        pick:"2+ Home Runs",  odds:"+450", impliedOdds:450  },
        { id:"ls5", game:"Reds @ Pirates",     pick:"Reds ML",       odds:"+210", impliedOdds:210  },
        { id:"ls6", game:"Athletics @ Astros", pick:"Athletics ML",  odds:"+340", impliedOdds:340  },
      ],
    },
  },
};

// ─── LEAGUES ────────────────────────────────────────────────────
const LEAGUES_DATA = [
  {
    id:"lg1", sport:"nfl", name:"The Boys League", week:6,
    inviteCode:"BOYS24", commissioner:"Joe",
    isCommissioner:true,
    opponent:"Mike D.", opponentRecord:"6-4",
    userRecord:"7-3", userUnits:"+12.5", userRoi:"+18.4",
    settings:{
      maxMembers:8, pickDeadline:"Sun 1PM ET", seasonWeeks:18,
      privacy:"private", scoringType:"multiplier_odds",
    },
    members:[
      { name:"Joe",      record:"7-3", units:"+12.5", roi:"+18%", streak:"W3", isYou:true,  isCommissioner:true  },
      { name:"Dave K.",  record:"9-1", units:"+22.0", roi:"+32%", streak:"W5", isYou:false, isCommissioner:false },
      { name:"Mike D.",  record:"6-4", units:"+4.2",  roi:"+6%",  streak:"L1", isYou:false, isCommissioner:false },
      { name:"Chris R.", record:"5-5", units:"-1.8",  roi:"-3%",  streak:"W1", isYou:false, isCommissioner:false },
      { name:"Tom B.",   record:"3-7", units:"-9.4",  roi:"-14%", streak:"L3", isYou:false, isCommissioner:false },
      { name:"Alex M.",  record:"4-6", units:"-5.1",  roi:"-8%",  streak:"L2", isYou:false, isCommissioner:false },
      { name:"Ryan S.",  record:"3-7", units:"-11.2", roi:"-17%", streak:"L4", isYou:false, isCommissioner:false },
      { name:"Jake P.",  record:"2-8", units:"-15.8", roi:"-24%", streak:"L5", isYou:false, isCommissioner:false },
    ],
    // Week 6 picks awaiting grading
    weekPicks:[
      { member:"Joe",      picks:[
        { slot:"Moneyline", mult:1, pick:"KC Chiefs",       odds:"-280", result:"pending" },
        { slot:"Prop",      mult:2, pick:"Mahomes 300+ Yds",odds:"-130", result:"pending" },
        { slot:"Over/Under",mult:3, pick:"Over 47.5",       odds:"-110", result:"W"       },
        { slot:"Spread",    mult:4, pick:"Eagles -3",       odds:"-110", result:"W"       },
        { slot:"Parlay",    mult:5, pick:"Raiders + Bears", odds:"+420", result:"pending" },
      ]},
      { member:"Mike D.",  picks:[
        { slot:"Moneyline", mult:1, pick:"Bills ML",        odds:"-210", result:"pending" },
        { slot:"Prop",      mult:2, pick:"Allen 2+ TDs",    odds:"-140", result:"L"       },
        { slot:"Over/Under",mult:3, pick:"Under 44",        odds:"-110", result:"L"       },
        { slot:"Spread",    mult:4, pick:"49ers -4.5",      odds:"-110", result:"pending" },
        { slot:"Parlay",    mult:5, pick:"Panthers + Bears",odds:"+380", result:"pending" },
      ]},
      { member:"Dave K.",  picks:[
        { slot:"Moneyline", mult:1, pick:"Eagles ML",       odds:"-165", result:"W"       },
        { slot:"Prop",      mult:2, pick:"Hurts 2+ TDs",    odds:"+175", result:"pending" },
        { slot:"Over/Under",mult:3, pick:"Over 48",         odds:"-115", result:"W"       },
        { slot:"Spread",    mult:4, pick:"Bills -5",        odds:"-115", result:"W"       },
        { slot:"Parlay",    mult:5, pick:"Cowboys + Giants",odds:"+510", result:"pending" },
      ]},
      { member:"Chris R.", picks:[
        { slot:"Moneyline", mult:1, pick:"Packers ML",      odds:"-125", result:"L"       },
        { slot:"Prop",      mult:2, pick:"Love 250+ Yds",   odds:"-115", result:"pending" },
        { slot:"Over/Under",mult:3, pick:"Over 43",         odds:"-118", result:"L"       },
        { slot:"Spread",    mult:4, pick:"Falcons -6",      odds:"-108", result:"W"       },
        { slot:"Parlay",    mult:5, pick:"Raiders + Jets",  odds:"+580", result:"pending" },
      ]},
      { member:"Tom B.",   picks:[
        { slot:"Moneyline", mult:1, pick:"Raiders ML",      odds:"+240", result:"L"       },
        { slot:"Prop",      mult:2, pick:"CMC 90+ Yds",     odds:"-110", result:"pending" },
        { slot:"Over/Under",mult:3, pick:"Under 45.5",      odds:"-110", result:"W"       },
        { slot:"Spread",    mult:4, pick:"Chiefs -6.5",     odds:"-110", result:"pending" },
        { slot:"Parlay",    mult:5, pick:"Browns + Cards",  odds:"+460", result:"L"       },
      ]},
      { member:"Alex M.",  picks:[
        { slot:"Moneyline", mult:1, pick:"Cowboys ML",      odds:"+350", result:"L"       },
        { slot:"Prop",      mult:2, pick:"Dak 300+ Yds",    odds:"-120", result:"L"       },
        { slot:"Over/Under",mult:3, pick:"Over 44",         odds:"-110", result:"W"       },
        { slot:"Spread",    mult:4, pick:"Cowboys +3",      odds:"-110", result:"L"       },
        { slot:"Parlay",    mult:5, pick:"Panthers + Bears",odds:"+420", result:"pending" },
      ]},
      { member:"Ryan S.",  picks:[
        { slot:"Moneyline", mult:1, pick:"Chargers ML",     odds:"-165", result:"W"       },
        { slot:"Prop",      mult:2, pick:"Herbert 280+ Yds",odds:"-115", result:"pending" },
        { slot:"Over/Under",mult:3, pick:"Under 44",        odds:"-108", result:"L"       },
        { slot:"Spread",    mult:4, pick:"Chargers -3.5",   odds:"-110", result:"W"       },
        { slot:"Parlay",    mult:5, pick:"Colts + Saints",  odds:"+390", result:"L"       },
      ]},
      { member:"Jake P.",  picks:[
        { slot:"Moneyline", mult:1, pick:"Giants ML",       odds:"+310", result:"L"       },
        { slot:"Prop",      mult:2, pick:"Jones 220+ Yds",  odds:"-110", result:"L"       },
        { slot:"Over/Under",mult:3, pick:"Over 40.5",       odds:"-112", result:"pending" },
        { slot:"Spread",    mult:4, pick:"Giants +3.5",     odds:"-110", result:"L"       },
        { slot:"Parlay",    mult:5, pick:"Giants + Raiders",odds:"+650", result:"L"       },
      ]},
    ],
  },
  {
    id:"lg2", sport:"nba", name:"Hoops League", week:12,
    inviteCode:"HOOP24", commissioner:"Dave K.",
    isCommissioner:false,
    opponent:"Dave K.", opponentRecord:"8-4",
    userRecord:"9-3", userUnits:"+18.2", userRoi:"+22.1",
    settings:{
      maxMembers:6, pickDeadline:"Daily 7PM ET", seasonWeeks:24,
      privacy:"private", scoringType:"multiplier_odds",
    },
    members:[
      { name:"Joe",      record:"9-3",  units:"+18.2", roi:"+22%", streak:"W4", isYou:true,  isCommissioner:false },
      { name:"Dave K.",  record:"8-4",  units:"+15.1", roi:"+18%", streak:"W2", isYou:false, isCommissioner:true  },
      { name:"Mike D.",  record:"7-5",  units:"+8.4",  roi:"+10%", streak:"L1", isYou:false, isCommissioner:false },
      { name:"Chris R.", record:"6-6",  units:"+2.1",  roi:"+3%",  streak:"W1", isYou:false, isCommissioner:false },
      { name:"Tom B.",   record:"4-8",  units:"-6.2",  roi:"-8%",  streak:"L3", isYou:false, isCommissioner:false },
      { name:"Alex M.",  record:"3-9",  units:"-12.4", roi:"-15%", streak:"L4", isYou:false, isCommissioner:false },
    ],
    weekPicks:[],
  },
  {
    id:"lg3", sport:"mlb", name:"Diamond Dogs", week:8,
    inviteCode:"DIAM24", commissioner:"Joe",
    isCommissioner:true,
    opponent:"Chris R.", opponentRecord:"5-3",
    userRecord:"6-2", userUnits:"+9.4", userRoi:"+15.6",
    settings:{
      maxMembers:6, pickDeadline:"Daily 12PM ET", seasonWeeks:20,
      privacy:"invite", scoringType:"multiplier_odds",
    },
    members:[
      { name:"Joe",      record:"6-2", units:"+9.4",  roi:"+16%", streak:"W2", isYou:true,  isCommissioner:true  },
      { name:"Chris R.", record:"5-3", units:"+6.8",  roi:"+12%", streak:"W1", isYou:false, isCommissioner:false },
      { name:"Ryan S.",  record:"4-4", units:"+1.2",  roi:"+2%",  streak:"L1", isYou:false, isCommissioner:false },
      { name:"Jake P.",  record:"3-5", units:"-3.4",  roi:"-6%",  streak:"L2", isYou:false, isCommissioner:false },
      { name:"Tom B.",   record:"2-6", units:"-7.8",  roi:"-13%", streak:"L4", isYou:false, isCommissioner:false },
      { name:"Alex M.",  record:"1-7", units:"-11.2", roi:"-18%", streak:"L5", isYou:false, isCommissioner:false },
    ],
    weekPicks:[],
  },
];

const POWER_UPS = [
  { id:"steal",    icon:"🔀", name:"Pick Steal",      desc:"See one opponent's locked lineup",       rarity:"rare",      color:IOS.purple },
  { id:"enhance",  icon:"📈", name:"Spread Enhancer", desc:"Move any spread 1.5pts in your favor",   rarity:"rare",      color:IOS.blue   },
  { id:"insurance",icon:"🛡️", name:"Insurance",       desc:"Lose by 1 leg? Counts as a push",        rarity:"common",    color:IOS.green  },
  { id:"lock",     icon:"🔒", name:"Lock It In",      desc:"Force opponent — no lineup changes",      rarity:"rare",      color:IOS.orange },
  { id:"double",   icon:"2️⃣", name:"Double Down",     desc:"One pick counts double this week",        rarity:"common",    color:IOS.yellow },
  { id:"peek",     icon:"👁️", name:"Peek",            desc:"See what % of league took each bet",      rarity:"common",    color:IOS.teal   },
  { id:"bomb",     icon:"💣", name:"Bomb",            desc:"Nullify one of opponent's winning picks", rarity:"legendary", color:IOS.red    },
  { id:"swap",     icon:"🔄", name:"Hot Swap",        desc:"Swap a losing pick after games start",    rarity:"legendary", color:IOS.pink   },
  { id:"wildcard", icon:"⭐", name:"Wildcard",        desc:"Play any bet — no slot rules",            rarity:"rare",      color:IOS.purple },
  { id:"spin2",    icon:"🎰", name:"Spin Again",      desc:"Spin the wheel a second time",            rarity:"common",    color:IOS.green  },
];

const TROPHIES = [
  { id:"sharp",   icon:"🎯", name:"Sharpshooter",  desc:"Highest season win rate",         holder:"Dave K.",  yours:false, color:IOS.yellow },
  { id:"long",    icon:"🚀", name:"Longshot King",  desc:"Most longshots hit",              holder:"YOU",      yours:true,  color:IOS.pink   },
  { id:"hot",     icon:"🔥", name:"Hot Hand",       desc:"Longest win streak",              holder:"Dave K.",  yours:false, color:IOS.orange },
  { id:"upset",   icon:"🃏", name:"Upset Artist",   desc:"Most upsets correctly called",    holder:"YOU",      yours:true,  color:IOS.purple },
  { id:"whale",   icon:"💰", name:"The Whale",      desc:"Most units won in a single week", holder:"Chris R.", yours:false, color:IOS.green  },
  { id:"cold",    icon:"🧊", name:"Ice Cold",       desc:"Worst ROI in the league",         holder:"Jake P.",  yours:false, color:IOS.teal   },
  { id:"grind",   icon:"⚙️", name:"The Grinder",   desc:"Most picks submitted all season", holder:"Ryan S.",  yours:false, color:IOS.gray   },
  { id:"come",    icon:"⚡", name:"Comeback Kid",   desc:"Biggest weekly points swing",     holder:"Tom B.",   yours:false, color:IOS.yellow },
  { id:"goat",    icon:"🐐", name:"GOAT",           desc:"Season champion",                 holder:"???",      yours:false, color:IOS.yellow },
];


const MATCHUP_HISTORY = [
  {
    week:1, opp:"Jake P.", result:"W", myScore:3, oppScore:2,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"KC Chiefs", odds:"-180", impliedOdds:-180, result:"W" },
      { slot:"Prop",      mult:2, pick:"Mahomes 300+ Yds", odds:"-130", impliedOdds:-130, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 47.5", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Spread",    mult:4, pick:"Eagles -3", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Cowboys +7", odds:"+420", impliedOdds:420, result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", impliedOdds:-210, result:"W" },
      { slot:"Prop",      mult:2, pick:"Josh Allen 2+ TDs", odds:"-140", impliedOdds:-140, result:"L" },
      { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Parlay",    mult:5, pick:"Bears ML + Panthers ML", odds:"+380", impliedOdds:380, result:"L" },
    ],
  },
  {
    week:2, opp:"Ryan S.", result:"W", myScore:4, oppScore:1,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-165", impliedOdds:-165, result:"W" },
      { slot:"Prop",      mult:2, pick:"Jalen Hurts 2+ Rush TDs", odds:"+175", impliedOdds:175, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", impliedOdds:-115, result:"W" },
      { slot:"Spread",    mult:4, pick:"Bills -5", odds:"-115", impliedOdds:-115, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Cowboys ML + Giants ML", odds:"+510", impliedOdds:510, result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Cowboys ML", odds:"+350", impliedOdds:350, result:"L" },
      { slot:"Prop",      mult:2, pick:"Dak 300+ Yds", odds:"-120", impliedOdds:-120, result:"L" },
      { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Spread",    mult:4, pick:"Cowboys +3", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Parlay",    mult:5, pick:"Panthers ML + Broncos ML", odds:"+640", impliedOdds:640, result:"L" },
    ],
  },
  {
    week:3, opp:"Alex M.", result:"L", myScore:2, oppScore:3,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Packers ML", odds:"-125", impliedOdds:-125, result:"L" },
      { slot:"Prop",      mult:2, pick:"Jordan Love 250+ Yds", odds:"-115", impliedOdds:-115, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 43", odds:"-118", impliedOdds:-118, result:"L" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Jets ML + Raiders ML", odds:"+580", impliedOdds:580, result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Vikings ML", odds:"+105", impliedOdds:105, result:"W" },
      { slot:"Prop",      mult:2, pick:"Jefferson 100+ Yds", odds:"-130", impliedOdds:-130, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Spread",    mult:4, pick:"Vikings +2", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Bears ML + Panthers ML", odds:"+420", impliedOdds:420, result:"L" },
    ],
  },
  {
    week:4, opp:"Chris R.", result:"W", myScore:3, oppScore:2,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", impliedOdds:-210, result:"W" },
      { slot:"Prop",      mult:2, pick:"Josh Allen 35+ Attempts", odds:"-115", impliedOdds:-115, result:"L" },
      { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", impliedOdds:-115, result:"W" },
      { slot:"Spread",    mult:4, pick:"KC Chiefs -6.5", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Giants ML", odds:"+490", impliedOdds:490, result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Rams ML", odds:"+115", impliedOdds:115, result:"L" },
      { slot:"Prop",      mult:2, pick:"Kupp 80+ Yds", odds:"-125", impliedOdds:-125, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Spread",    mult:4, pick:"Rams +4.5", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Parlay",    mult:5, pick:"Panthers ML + Bears ML", odds:"+520", impliedOdds:520, result:"L" },
    ],
  },
  {
    week:5, opp:"Tom B.", result:"L", myScore:2, oppScore:3,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-155", impliedOdds:-155, result:"W" },
      { slot:"Prop",      mult:2, pick:"Hurts Over 1.5 TDs", odds:"-140", impliedOdds:-140, result:"L" },
      { slot:"Over/Under",mult:3, pick:"Over 44", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Spread",    mult:4, pick:"Cowboys +7", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Parlay",    mult:5, pick:"Jets ML + Broncos ML", odds:"+610", impliedOdds:610, result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"49ers ML", odds:"-195", impliedOdds:-195, result:"W" },
      { slot:"Prop",      mult:2, pick:"CMC 90+ Rush Yds", odds:"-110", impliedOdds:-110, result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 45.5", odds:"-115", impliedOdds:-115, result:"W" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"L" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Panthers ML", odds:"+540", impliedOdds:540, result:"L" },
    ],
  },
];

const STANDINGS = [
  { rank:1, name:"Dave K.",  record:"9-1", units:"+22.0", roi:"+32%", streak:"W5", wpct:"90%", wr:["W","W","W","L","W","W","W","W","W","W"] },
  { rank:2, name:"Joe",      record:"7-3", units:"+12.5", roi:"+18%", streak:"W3", wpct:"70%", wr:["W","W","L","W","L","W","-","-","-","-"] },
  { rank:3, name:"Mike D.",  record:"6-4", units:"+4.2",  roi:"+6%",  streak:"L1", wpct:"60%", wr:["W","L","W","W","L","L","-","-","-","-"] },
  { rank:4, name:"Chris R.", record:"5-5", units:"-1.8",  roi:"-3%",  streak:"W1", wpct:"50%", wr:["L","W","L","W","L","W","-","-","-","-"] },
  { rank:5, name:"Tom B.",   record:"3-7", units:"-9.4",  roi:"-14%", streak:"L3", wpct:"30%", wr:["W","L","L","L","W","L","-","-","-","-"] },
  { rank:6, name:"Alex M.",  record:"4-6", units:"-5.1",  roi:"-8%",  streak:"L2", wpct:"40%", wr:["L","W","L","W","L","L","-","-","-","-"] },
  { rank:7, name:"Ryan S.",  record:"3-7", units:"-11.2", roi:"-17%", streak:"L4", wpct:"30%", wr:["W","L","L","L","L","L","-","-","-","-"] },
  { rank:8, name:"Jake P.",  record:"2-8", units:"-15.8", roi:"-24%", streak:"L5", wpct:"20%", wr:["L","L","L","W","L","L","-","-","-","-"] },
];

const SCHEDULE = [
  { week:1, opp:"Jake P.",  ms:3, os:2, result:"W" },
  { week:2, opp:"Ryan S.",  ms:4, os:1, result:"W" },
  { week:3, opp:"Alex M.",  ms:2, os:3, result:"L" },
  { week:4, opp:"Chris R.", ms:3, os:2, result:"W" },
  { week:5, opp:"Tom B.",   ms:2, os:3, result:"L" },
  { week:6, opp:"Mike D.",  ms:null, os:null, result:"live" },
  { week:7, opp:"Dave K.",  ms:null, os:null, result:"upcoming" },
  { week:8, opp:"Jake P.",  ms:null, os:null, result:"upcoming" },
  { week:9, opp:"Ryan S.",  ms:null, os:null, result:"upcoming" },
  { week:10,opp:"Alex M.",  ms:null, os:null, result:"upcoming" },
];

const CHAT = [
  { id:1,  user:"Dave K.", init:"D", time:"2h",    text:"lmaooo that KC cover was filthy 💀", me:false },
  { id:2,  user:"Mike D.", init:"M", time:"2h",    text:"bro refs saved KC again",            me:false },
  { id:3,  user:"Joe",     init:"J", time:"1h 52", text:"I had Chiefs too, easy money 😤",    me:true  },
  { id:4,  user:"Tom B.",  init:"T", time:"1h 45", text:"nobody talk to me rn",               me:false },
  { id:5,  user:"Dave K.", init:"D", time:"1h 40", text:"standings lookin scary. someone stop me", me:false },
  { id:6,  user:"Chris R.",init:"C", time:"1h 30", text:"Joe you're the only one who can catch Dave 👀", me:false },
  { id:7,  user:"Joe",     init:"J", time:"1h 20", text:"I got Dave week 7. it's on sight",   me:true  },
  { id:8,  user:"Dave K.", init:"D", time:"1h 18", text:"😂😂 prepare yourself",              me:false },
  { id:9,  user:"Ryan S.", init:"R", time:"45m",   text:"MNF needs to hurry up I can't sit at the bottom", me:false },
  { id:10, user:"Joe",     init:"J", time:"12m",   text:"Bills -6.5 lock of the week. trust me 🔒", me:true },
  { id:11, user:"Mike D.", init:"M", time:"10m",   text:"last time you said that you took Cowboys +7 💀", me:false },
  { id:12, user:"Tom B.",  init:"T", time:"5m",    text:"^^^ 😭😭😭",                         me:false },
];

const WHEEL_ITEMS = [POWER_UPS[0],POWER_UPS[4],POWER_UPS[1],POWER_UPS[9],POWER_UPS[6],POWER_UPS[2],POWER_UPS[8],POWER_UPS[3],POWER_UPS[7],POWER_UPS[5]];

function toDecimal(a){return a>=0?(a/100)+1:(100/Math.abs(a))+1;}
function toAmerican(d){return d>=2?`+${Math.round((d-1)*100)}`:`${Math.round(-100/(d-1))}`;}
function calcLS(bets){if(!bets||!bets.length)return null;const d=bets.reduce((a,b)=>a*toDecimal(b.impliedOdds),1);return{decimal:d,american:toAmerican(d),payout:Math.round((d-1)*100)};}
function calcParlay(picks,ls,slots){
  const singles=slots.filter(s=>s.id!=="longshot").map(s=>([s.id,picks[s.id]])).filter(([,v])=>v);
  const lsO=calcLS(ls);
  const all=[...singles,...(lsO?[["ls_compiled",{_d:lsO.decimal}]]:[])];
  if(!all.length)return null;
  const d=all.reduce((acc,[id,bet])=>{
    if(id==="ls_compiled"){return acc*(1+(bet._d-1)*5);}
    const slot=slots.find(s=>s.id===id);
    return acc*(1+(toDecimal(bet.impliedOdds)-1)*slot.mult);
  },1);
  return{american:toAmerican(d),payout:Math.round((d-1)*100)};
}

// ─── SCORING ────────────────────────────────────────────────────
// Points = Slot Multiplier × Odds Decimal (if win), 0 if loss
function oddsDecimal(impliedOdds) {
  // For negative odds: 100/abs. For positive: odds/100
  if(impliedOdds < 0) return parseFloat((100/Math.abs(impliedOdds)).toFixed(2));
  return parseFloat((impliedOdds/100).toFixed(2));
}
function calcPickPoints(mult, impliedOdds, result) {
  if(result !== "W") return 0;
  return parseFloat((mult * oddsDecimal(impliedOdds) * 10).toFixed(1));
}
function calcMatchupScore(picks) {
  // picks = array of {mult, impliedOdds, result}
  return picks.reduce((sum,p) => sum + calcPickPoints(p.mult, p.impliedOdds, p.result), 0).toFixed(1);
}

const pad=n=>String(n).padStart(2,"0");
const acColor=i=>({D:"#5E5CE6",M:"#0A84FF",T:"#FF453A",C:"#30D158",A:"#FF9F0A",R:"#FF375F"}[i]||IOS.purple);
const rarityColor=r=>r==="legendary"?IOS.pink:r==="rare"?IOS.purple:IOS.green;
const rankMedal=r=>r===1?"🥇":r===2?"🥈":r===3?"🥉":`${r}`;

const polarToCart=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

export default function App() {
  const [screen,      setScreen]      = useState("home");
  const [user,        setUser]        = useState(null);
  const [authScreen,  setAuthScreen]  = useState("login");
  const [anim,        setAnim]        = useState(false);
  const [timeLeft,    setTimeLeft]    = useState({h:1,m:47,s:32});
  const [submitted,   setSubmitted]   = useState(false);
  const [leagueTab,   setLeagueTab]   = useState("standings");
  const [expanded,    setExpanded]    = useState(null);
  const [sortBy,      setSortBy]      = useState("rank");
  const [chatMsg,     setChatMsg]     = useState("");
  const [messages,    setMessages]    = useState(CHAT);
  const [activeLeagueId, setActiveLeagueId] = useState("lg1");
  const [realLeagues,    setRealLeagues]    = useState([]);
  const [leagueMembers,  setLeagueMembers]  = useState([]);
  const [weekPicks,      setWeekPicks]      = useState([]);
  const activeLeague = [...realLeagues, ...LEAGUES_DATA].find(l=>l.id===activeLeagueId) || LEAGUES_DATA[0];
  const sport = SPORTS[activeLeague.sport];
  const SLOTS = sport.slots;
  const BETS = sport.bets;

  const [picks,        setPicks]        = useState({ml:null,prop:null,ou:null,spread:null});
  const [lsBets,       setLsBets]       = useState([]);

  // Grading state — weekPicks per league, stored locally
  const [gradingData,  setGradingData]  = useState(() => {
    const init = {};
    LEAGUES_DATA.forEach(lg => { init[lg.id] = JSON.parse(JSON.stringify(lg.weekPicks||[])); });
    return init;
  });
  const currentWeekPicks = gradingData[activeLeagueId] || [];
  const [activeSlot,  setActiveSlot]  = useState(null);
  const [myPUs,       setMyPUs]       = useState([POWER_UPS[1],POWER_UPS[4],POWER_UPS[6]]);
  const [showPUModal, setShowPUModal] = useState(null); // {context:"picks"|"matchup", slotId, pickIdx}
  const [activatedPUs,setActivatedPUs]= useState({}); // slotId -> pu applied on picks screen
  const [matchupPUs,  setMatchupPUs]  = useState({}); // pickIdx -> pu applied on live matchup
  const [profTab,     setProfTab]     = useState("stats");
  const [showWheel,   setShowWheel]   = useState(false);
  const [spinning,    setSpinning]    = useState(false);
  const [wheelAngle,  setWheelAngle]  = useState(0);
  const [wonPU,       setWonPU]       = useState(null);
  const [showWin,     setShowWin]     = useState(false);
  const [showTopScorer, setShowTopScorer] = useState(false);
  const [pickSearch,   setPickSearch]   = useState("");
  const [commishTab,   setCommishTab]   = useState("grade"); // grade | members | settings
  const [showLeaguesList, setShowLeaguesList] = useState(false);

  const createLeague = async (name, sportId) => {
    if(!user) return;
    const inviteCode = Math.random().toString(36).substring(2,8).toUpperCase();
    const {data,error} = await supabase.from("leagues").insert({
      name, sport:sportId, commissioner_id:user.id, invite_code:inviteCode,
      max_members:8, pick_deadline:"Sun 1PM ET", season_weeks:18,
      current_week:1, privacy:"private", scoring_type:"multiplier_odds",
    }).select().single();
    if(error){alert(error.message);return;}
    await supabase.from("league_members").insert({league_id:data.id,user_id:user.id,is_commissioner:true});
    alert(`League created! Invite code: ${data.invite_code}`);
    fetchLeagues(user.id);
  };

const fetchWeekPicks = async (leagueId, week) => {
  const {data:picks} = await supabase
    .from("picks")
    .select("*")
    .eq("league_id", leagueId)
    .eq("week", week);
  if(!picks||!picks.length) return;
  const userIds = [...new Set(picks.map(p=>p.user_id))];
  const {data:users} = await supabase
    .from("users")
    .select("id, username, email")
    .in("id", userIds);
  setWeekPicks(picks.map(p=>({
    ...p,
    users: users?.find(u=>u.id===p.user_id)||null
  })));
};

  const fetchLeagueMembers = async (leagueId, uid) => {
    const {data} = await supabase
      .from("league_members")
      .select("user_id, is_commissioner, users(id, email, username)")
      .eq("league_id", leagueId);
    if(data) setLeagueMembers(data.map(m=>({
      userId: m.user_id,
      isCommissioner: m.is_commissioner,
      name: m.users?.username || m.users?.email?.split("@")[0] || "Unknown",
      email: m.users?.email,
      isYou: m.user_id === uid,
    })));
  };

  const fetchLeagues = async (uid) => {
    const {data:members} = await supabase.from("league_members").select("league_id, is_commissioner").eq("user_id", uid);
    if(!members || members.length===0) return;
    const ids = [...new Set(members.map(m=>m.league_id))];
    const {data:leagues} = await supabase.from("leagues").select("*").in("id", ids);
    if(leagues) {
      setRealLeagues(leagues.map(lg=>({
        ...lg,
        isCommissioner: members.find(m=>m.league_id===lg.id)?.is_commissioner||false
      })));
    }
  };

  const gradePickResult = (leagueId, memberIdx, pickIdx, result) => {
    setGradingData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if(updated[leagueId]?.[memberIdx]?.picks?.[pickIdx]) {
        updated[leagueId][memberIdx].picks[pickIdx].result = result;
      }
      return updated;
    });
  };
  const [savedPicks,  setSavedPicks]  = useState(null);
  const [selectedMatchup, setSelectedMatchup] = useState(null); // week number of selected past matchup // locked picks for the week
  const chatRef=useRef(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      const u = session?.user??null;
      setUser(u);
      if(u) fetchLeagues(u.id);
    });
    supabase.auth.onAuthStateChange((_e,session)=>{
      const u = session?.user??null;
      setUser(u);
      if(u) fetchLeagues(u.id);
    });
    setTimeout(()=>setAnim(true),80);
    const t=setInterval(()=>setTimeLeft(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--;}if(m<0){m=59;h--;}if(h<0){h=0;m=0;s=0;}return{h,m,s};}),1000);
    try {
      const stored = localStorage.getItem("linedup_picks_wk6");
      if(stored) setSavedPicks(JSON.parse(stored));
    } catch(e) {}
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    if(!activeLeagueId||!user) return;
    fetchLeagueMembers(activeLeagueId, user.id);
  },[activeLeagueId, user, screen]);

  useEffect(()=>{
    if(!activeLeagueId||!user) return;
    const lg = [...realLeagues, ...LEAGUES_DATA].find(l=>l.id===activeLeagueId);
    if(lg) fetchWeekPicks(activeLeagueId, lg.current_week||lg.week||1);
  },[activeLeagueId, user, screen]);

  useEffect(()=>{if(screen==="chat"&&chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[screen,messages]);

  const spinWheel=()=>{
    if(spinning)return;
    setSpinning(true);setWonPU(null);
    const segA=360/WHEEL_ITEMS.length;
    const winIdx=Math.floor(Math.random()*WHEEL_ITEMS.length);
    const final=wheelAngle+(5+Math.random()*3)*360+(360-winIdx*segA-segA/2);
    setWheelAngle(final);
    setTimeout(()=>{setWonPU(WHEEL_ITEMS[winIdx]);setSpinning(false);setTimeout(()=>setShowWin(true),400);},4000);
  };

  const claimPU=()=>{if(wonPU&&myPUs.length<3)setMyPUs(p=>[...p,{...wonPU}]);setShowWin(false);setShowWheel(false);setWonPU(null);};

  const usePU=(pu, context, key)=>{
    // Remove from inventory
    setMyPUs(p=>p.filter(x=>x.id!==pu.id));
    // Apply to the right context
    if(context==="picks") setActivatedPUs(p=>({...p,[key]:pu}));
    if(context==="matchup") setMatchupPUs(p=>({...p,[key]:pu}));
    setShowPUModal(null);
  };
  const selectBet=(slotId,bet)=>{
    if(slotId==="longshot"){setLsBets(p=>p.find(b=>b.id===bet.id)?p.filter(b=>b.id!==bet.id):[...p,bet]);}
    else{setPicks(p=>({...p,[slotId]:bet}));setActiveSlot(null);}
  };
  const clearPick=slotId=>{if(slotId==="longshot")setLsBets([]);else setPicks(p=>({...p,[slotId]:null}));};
  const sendMsg=()=>{if(!chatMsg.trim())return;setMessages(p=>[...p,{id:Date.now(),user:"Joe",init:"J",time:"now",text:chatMsg.trim(),me:true}]);setChatMsg("");setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);};

  const parlay=calcParlay(picks,lsBets,SLOTS);
  const lsO=calcLS(lsBets);
  const allFilled=Object.values(picks).every(v=>v)&&lsBets.length>=2;

  const sorted=[...STANDINGS].sort((a,b)=>{
    if(sortBy==="roi")   return parseFloat(b.roi)-parseFloat(a.roi);
    if(sortBy==="units") return parseFloat(b.units)-parseFloat(a.units);
    if(sortBy==="wpct")  return parseFloat(b.wpct)-parseFloat(a.wpct);
    return a.rank-b.rank;
  });

  const W=280;const R=W/2;const segA=360/WHEEL_ITEMS.length;

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    ::-webkit-scrollbar{display:none;}

    .phone{width:390px;min-height:844px;background:#000;position:relative;overflow:hidden;display:flex;flex-direction:column;font-family:'Manrope',system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;}

    /* iOS Status Bar */
    .status-bar{height:54px;padding:14px 20px 0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;position:relative;z-index:10;}
    .status-time{font-size:15px;font-weight:600;letter-spacing:-0.3px;}
    .status-icons{display:flex;align-items:center;gap:6px;font-size:12px;}

    /* Large Title Navigation (iOS style) */
    .nav-header{padding:0 20px 12px;position:relative;z-index:5;}
    .nav-header.large{padding-bottom:8px;}
    .nav-title-small{font-size:17px;font-weight:600;letter-spacing:-0.4px;color:#fff;text-align:center;padding:12px 0 8px;}
    .nav-title-large{font-size:34px;font-weight:700;letter-spacing:-0.5px;color:#fff;line-height:1.1;}
    .nav-subtitle{font-size:13px;color:${IOS.label3};margin-top:2px;}

    /* Scrollable body */
    .body{flex:1;overflow-y:auto;position:relative;z-index:1;}
    .body-pad{padding-bottom:100px;}

    /* iOS grouped sections */
    .ios-section{margin:0 16px 10px;}
    .ios-section-header{font-size:13px;font-weight:400;color:${IOS.label3};text-transform:uppercase;letter-spacing:0.5px;padding:0 6px;margin-bottom:6px;}
    .ios-section-footer{font-size:13px;color:${IOS.label3};padding:6px 6px 0;}

    /* iOS Card / Grouped List */
    .ios-card{background:${IOS.bg2};border-radius:16px;overflow:hidden;}
    .ios-row{display:flex;align-items:center;padding:13px 16px;position:relative;min-height:50px;}
    .ios-row::after{content:'';position:absolute;bottom:0;left:16px;right:0;height:0.5px;background:${IOS.sep};}
    .ios-row:last-child::after{display:none;}
    .ios-row-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-right:12px;}
    .ios-row-content{flex:1;min-width:0;}
    .ios-row-title{font-size:17px;font-weight:400;color:#fff;letter-spacing:-0.2px;}
    .ios-row-sub{font-size:13px;color:${IOS.label3};margin-top:1px;}
    .ios-row-right{display:flex;align-items:center;gap:4px;flex-shrink:0;}
    .ios-row-value{font-size:17px;color:${IOS.label3};}
    .ios-chevron{color:${IOS.gray3};font-size:13px;font-weight:600;}
    .ios-row:active{background:${IOS.fill};}

    /* iOS Big Number Card */
    .big-card{background:${IOS.bg2};border-radius:20px;padding:20px;margin:0 16px 10px;position:relative;overflow:hidden;}
    .big-card-accent{position:absolute;top:0;left:0;right:0;height:3px;}
    .big-card-label{font-size:13px;font-weight:500;color:${IOS.label3};letter-spacing:-0.1px;margin-bottom:8px;}
    .big-card-num{font-size:42px;font-weight:700;letter-spacing:-1.5px;line-height:1;}
    .big-card-sub{font-size:13px;color:${IOS.label3};margin-top:4px;}

    /* iOS Stat pills row */
    .stat-pills{display:flex;gap:8px;padding:0 16px;margin-bottom:10px;overflow-x:auto;}
    .stat-pill{flex:1;min-width:90px;background:${IOS.bg2};border-radius:14px;padding:14px 12px;text-align:center;flex-shrink:0;}
    .stat-pill-val{font-size:22px;font-weight:700;letter-spacing:-0.5px;line-height:1;margin-bottom:4px;}
    .stat-pill-lbl{font-size:11px;color:${IOS.label3};font-weight:500;}

    /* iOS Matchup Widget */
    .matchup-widget{background:${IOS.bg2};border-radius:20px;padding:18px;margin:0 16px 10px;position:relative;overflow:hidden;}
    .mw-top{font-size:12px;font-weight:600;color:${IOS.label3};letter-spacing:0.3px;text-transform:uppercase;margin-bottom:14px;}
    .mw-teams{display:flex;align-items:center;justify-content:space-between;}
    .mw-player{flex:1;}
    .mw-player.right{text-align:right;}
    .mw-name{font-size:22px;font-weight:700;letter-spacing:-0.5px;line-height:1;}
    .mw-rec{font-size:13px;color:${IOS.label3};margin-top:3px;}
    .mw-vs{font-size:13px;font-weight:600;color:${IOS.gray3};padding:0 12px;}
    .mw-scores{display:flex;justify-content:space-around;margin-top:16px;padding-top:14px;border-top:0.5px solid ${IOS.sep};}
    .mw-score-item{text-align:center;}
    .mw-score-num{font-size:20px;font-weight:700;letter-spacing:-0.5px;}
    .mw-score-lbl{font-size:11px;color:${IOS.label3};font-weight:500;margin-top:2px;}

    /* Countdown */
    .countdown-bar{background:${IOS.bg2};border-radius:14px;padding:14px 16px;margin:0 16px 10px;display:flex;align-items:center;justify-content:space-between;}
    .cd-label{font-size:15px;color:${IOS.label2};}
    .cd-time{font-size:22px;font-weight:700;letter-spacing:-0.5px;color:${IOS.blue};}

    /* iOS Primary Button */
    .ios-btn{width:calc(100% - 32px);margin:4px 16px;border:none;border-radius:14px;padding:16px;font-family:'Manrope',sans-serif;font-size:17px;font-weight:600;cursor:pointer;transition:opacity .15s,transform .1s;letter-spacing:-0.2px;display:flex;align-items:center;justify-content:center;gap:8px;}
    .ios-btn:active{opacity:0.85;transform:scale(0.99);}
    .ios-btn.blue{background:${IOS.blue};color:#fff;}
    .ios-btn.green{background:${IOS.green};color:#000;}
    .ios-btn.gray{background:${IOS.bg3};color:${IOS.label2};}
    .ios-btn.warn{background:rgba(255,159,10,0.15);color:${IOS.orange};border:1px solid rgba(255,159,10,0.3);}
    .ios-btn.disabled{background:${IOS.bg3};color:${IOS.gray};cursor:default;}
    .ios-btn.purple-grad{background:linear-gradient(135deg,#5E5CE6,#BF5AF2);color:#fff;}

    /* Power-up shelf */
    .pu-scroll{display:flex;gap:10px;padding:0 16px;overflow-x:auto;padding-bottom:2px;}
    .pu-chip{flex-shrink:0;background:${IOS.bg2};border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.06);}
    .pu-chip-icon{font-size:20px;}
    .pu-chip-name{font-size:13px;font-weight:600;color:#fff;margin-bottom:1px;}
    .pu-chip-rarity{font-size:11px;font-weight:500;}
    .pu-spin-chip{flex-shrink:0;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(191,90,242,0.2));border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:10px;border:1px solid rgba(191,90,242,0.3);cursor:pointer;}
    .pu-spin-chip:active{opacity:0.8;}

    /* Mini standings */
    .mini-stand{display:flex;align-items:center;padding:12px 16px;position:relative;}
    .mini-stand::after{content:'';position:absolute;bottom:0;left:16px;right:0;height:0.5px;background:${IOS.sep};}
    .mini-stand:last-child::after{display:none;}
    .ms-rank{font-size:15px;font-weight:600;width:24px;flex-shrink:0;color:${IOS.label3};}
    .ms-rank.top{color:${IOS.blue};}
    .ms-name{flex:1;font-size:15px;letter-spacing:-0.2px;}
    .ms-name.me{color:${IOS.blue};font-weight:600;}
    .ms-rec{font-size:15px;color:${IOS.label3};width:40px;text-align:center;}
    .ms-units{font-size:15px;font-weight:600;width:52px;text-align:right;}
    .ms-units.pos{color:${IOS.green};} .ms-units.neg{color:${IOS.red};}

    /* ═══ PARLAY BUILDER ═══ */
    .pb-header{padding:0 16px 12px;}
    .pb-title{font-size:34px;font-weight:700;letter-spacing:-1px;color:#fff;line-height:1.05;}
    .pb-sub{font-size:15px;color:${IOS.label3};margin-top:4px;}

    /* Parlay odds card */
    .parlay-odds-card{background:${IOS.bg2};border-radius:20px;padding:18px;margin:0 16px 12px;overflow:hidden;position:relative;transition:border .3s;}
    .poc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
    .poc-label{font-size:13px;font-weight:500;color:${IOS.label3};margin-bottom:6px;}
    .poc-odds{font-size:44px;font-weight:700;letter-spacing:-2px;line-height:1;transition:color .3s;}
    .poc-leg-dots{display:flex;gap:5px;margin-top:8px;}
    .poc-dot{width:8px;height:8px;border-radius:50%;transition:background .2s;}
    .poc-status{font-size:13px;color:${IOS.label3};margin-top:8px;line-height:1.4;}
    .poc-hi{color:rgba(255,255,255,0.75);}
    .poc-ok{color:${IOS.green};font-weight:500;}
    .poc-warn{color:${IOS.orange};font-weight:500;}

    /* Slot cards */
    .slot-card{background:${IOS.bg2};border-radius:16px;margin:0 16px 8px;overflow:hidden;}
    .slot-top-row{display:flex;align-items:center;padding:14px 16px;gap:14px;cursor:pointer;min-height:76px;}
    .slot-top-row:active{background:${IOS.fill};}
    .slot-mult-badge{width:52px;height:52px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
    .slot-mult-n{font-size:28px;font-weight:800;line-height:1;}
    .slot-mult-x{font-size:16px;font-weight:800;opacity:0.85;letter-spacing:-0.5px;margin-top:-2px;}
    .slot-label{font-size:17px;font-weight:600;letter-spacing:-0.3px;color:#fff;}
    .slot-desc-txt{font-size:13px;color:${IOS.label3};margin-top:2px;}
    .slot-add-btn{background:${IOS.fill2};border-radius:20px;padding:6px 14px;font-size:13px;font-weight:600;color:${IOS.blue};white-space:nowrap;cursor:pointer;flex-shrink:0;}
    .slot-add-btn:active{opacity:0.7;}

    .slot-pick-row{padding:12px 16px;border-top:0.5px solid rgba(255,255,255,0.08);display:flex;align-items:center;cursor:pointer;}
    .slot-pick-row:active{background:${IOS.fill};}
    .spr-left{flex:1;min-width:0;}
    .spr-game{font-size:11px;font-weight:500;letter-spacing:0.3px;text-transform:uppercase;margin-bottom:3px;}
    .spr-pick{font-size:15px;font-weight:500;color:#fff;}
    .spr-odds{font-size:22px;font-weight:700;letter-spacing:-0.5px;margin-right:12px;}
    .spr-clear{width:28px;height:28px;border-radius:50%;background:${IOS.fill3};border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:${IOS.label3};flex-shrink:0;}
    .spr-clear:active{background:rgba(255,69,58,0.2);color:${IOS.red};}

    /* LS multi picks inside card */
    .ls-pick-item{display:flex;align-items:center;padding:11px 16px;border-top:0.5px solid rgba(255,55,95,0.15);cursor:pointer;}
    .ls-pick-item:active{background:rgba(255,55,95,0.05);}
    .ls-pick-info{flex:1;}
    .ls-pick-game{font-size:11px;color:rgba(255,55,95,0.7);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;}
    .ls-pick-name{font-size:15px;color:#fff;font-weight:500;}
    .ls-pick-odds{font-size:22px;font-weight:700;letter-spacing:-0.5px;margin-right:10px;}
    .ls-total-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(255,55,95,0.08);border-top:0.5px solid rgba(255,55,95,0.15);}
    .ls-total-lbl{font-size:12px;color:rgba(255,55,95,0.7);font-weight:500;text-transform:uppercase;letter-spacing:0.3px;}
    .ls-total-odds{font-size:20px;font-weight:700;color:${IOS.pink};letter-spacing:-0.5px;}

    /* Sheet / Modal */
    .sheet-bg{position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;flex-direction:column;justify-content:flex-end;backdrop-filter:blur(8px);}
    .sheet{background:#1C1C1E;border-radius:20px 20px 0 0;max-height:72%;overflow-y:auto;}
    .sheet-handle{width:36px;height:5px;border-radius:3px;background:rgba(255,255,255,0.2);margin:10px auto 0;}
    .sheet-hdr{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid ${IOS.sep};position:sticky;top:0;background:#1C1C1E;z-index:1;}
    .sheet-hdr-title{font-size:17px;font-weight:600;letter-spacing:-0.3px;}
    .sheet-hdr-sub{font-size:13px;color:${IOS.label3};margin-top:2px;}
    .sheet-done{font-size:17px;font-weight:600;color:${IOS.blue};cursor:pointer;padding:4px 0;}
    .sheet-search-wrap{padding:10px 16px;background:#1C1C1E;border-bottom:0.5px solid ${IOS.sep};position:sticky;top:60px;z-index:1;}
    .sheet-search{width:100%;background:rgba(255,255,255,0.08);border:none;border-radius:10px;padding:9px 14px 9px 36px;font-family:'Manrope',sans-serif;font-size:15px;color:#fff;outline:none;}
    .sheet-search::placeholder{color:rgba(255,255,255,0.3);}
    .sheet-search-icon{position:absolute;left:28px;top:50%;transform:translateY(-50%);font-size:14px;color:rgba(255,255,255,0.3);pointer-events:none;}
    .sheet-count{font-size:11px;color:${IOS.label3};padding:8px 20px 4px;}
    .sheet-ls-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:rgba(255,55,95,0.08);border-bottom:0.5px solid rgba(255,55,95,0.15);}
    .bet-row{display:flex;align-items:center;padding:14px 20px;border-bottom:0.5px solid ${IOS.sep};cursor:pointer;min-height:64px;}
    .bet-row:last-child{border-bottom:none;}
    .bet-row:active{background:${IOS.fill};}
    .bet-row-left{flex:1;}
    .bet-row-game{font-size:12px;color:${IOS.label3};margin-bottom:3px;font-weight:500;}
    .bet-row-pick{font-size:16px;font-weight:500;color:#fff;}
    .bet-row-right{display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:12px;}
    .bet-row-odds{font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    .bet-check{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .bet-check.off{border:1.5px solid ${IOS.gray3};}
    .bet-check.on{background:${IOS.blue};}

    /* Done screen */
    .done-screen{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;gap:14px;padding:36px;}
    .done-checkmark{width:80px;height:80px;border-radius:50%;background:${IOS.green};display:flex;align-items:center;justify-content:center;font-size:36px;}
    .done-title{font-size:28px;font-weight:700;letter-spacing:-0.5px;text-align:center;}
    .done-odds{font-size:56px;font-weight:700;letter-spacing:-2px;color:${IOS.green};text-align:center;line-height:1;}
    .done-payout{font-size:15px;color:${IOS.label3};text-align:center;}
    .done-legs-card{width:100%;background:${IOS.bg2};border-radius:16px;padding:4px 0;overflow:hidden;}
    .done-leg-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:0.5px solid ${IOS.sep};}
    .done-leg-row:last-child{border-bottom:none;}
    .done-leg-lbl{font-size:12px;color:${IOS.label3};margin-bottom:2px;}
    .done-leg-pick{font-size:14px;color:#fff;font-weight:500;}
    .done-leg-odds{font-size:18px;font-weight:700;letter-spacing:-0.5px;}

    /* League */
    .league-hero{background:${IOS.bg2};border-radius:20px;margin:0 16px 10px;padding:18px;position:relative;overflow:hidden;}
    .lh-rank{font-size:13px;font-weight:500;color:${IOS.blue};margin-bottom:6px;}
    .lh-name{font-size:30px;font-weight:700;letter-spacing:-0.5px;margin-bottom:12px;}
    .lh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;}
    .lh-stat{background:#2C2C2E;padding:10px 6px;text-align:center;}
    .lh-stat-val{font-size:16px;font-weight:700;letter-spacing:-0.3px;line-height:1;margin-bottom:2px;}
    .lh-stat-lbl{font-size:10px;color:${IOS.label3};font-weight:500;}

    .sort-scroll{display:flex;gap:8px;padding:0 16px;overflow-x:auto;margin-bottom:4px;}
    .sort-pill{flex-shrink:0;padding:7px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.08);color:${IOS.label3};background:transparent;transition:all .15s;}
    .sort-pill.on{background:${IOS.blue};color:#fff;border-color:${IOS.blue};}
    .sort-pill:active{opacity:0.8;}

    .standings-card{background:${IOS.bg2};border-radius:16px;margin:0 16px;overflow:hidden;}
    .st-row{display:flex;align-items:center;padding:13px 16px;position:relative;cursor:pointer;}
    .st-row::after{content:'';position:absolute;bottom:0;left:16px;right:0;height:0.5px;background:${IOS.sep};}
    .st-row:last-child::after{display:none;}
    .st-row:active{background:${IOS.fill};}
    .st-row.me{background:rgba(10,132,255,0.08);}
    .st-rank{width:32px;flex-shrink:0;font-size:15px;font-weight:600;color:${IOS.label3};}
    .st-info{flex:1;}
    .st-name{font-size:15px;font-weight:500;letter-spacing:-0.2px;}
    .st-name.me{color:${IOS.blue};font-weight:600;}
    .st-streak{font-size:12px;color:${IOS.label3};margin-top:1px;}
    .st-rec{font-size:14px;color:${IOS.label3};width:38px;text-align:center;}
    .st-units{font-size:15px;font-weight:600;width:52px;text-align:right;letter-spacing:-0.3px;}
    .st-units.pos{color:${IOS.green};} .st-units.neg{color:${IOS.red};}

    .expand-row{background:rgba(10,132,255,0.05);border-bottom:0.5px solid ${IOS.sep};}
    .expand-inner{padding:14px 16px;}
    .exp-stat-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;}
    .exp-stat{background:${IOS.bg3};border-radius:10px;padding:10px;text-align:center;}
    .exp-stat-val{font-size:16px;font-weight:700;letter-spacing:-0.3px;line-height:1;margin-bottom:2px;}
    .exp-stat-lbl{font-size:10px;color:${IOS.label3};font-weight:500;text-transform:uppercase;letter-spacing:0.5px;}
    .wk-row{display:flex;gap:4px;flex-wrap:wrap;}
    .wk-dot{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}
    .wk-dot.W{background:rgba(48,209,88,0.15);color:${IOS.green};}
    .wk-dot.L{background:rgba(255,69,58,0.12);color:${IOS.red};}
    .wk-dot.d{background:${IOS.fill};color:${IOS.gray};}

    .sch-item{display:flex;align-items:center;padding:13px 16px;border-bottom:0.5px solid ${IOS.sep};}
    .sch-item:last-child{border-bottom:none;}
    .sch-wk{font-size:14px;font-weight:600;width:30px;color:${IOS.label3};}
    .sch-wk.live{color:${IOS.blue};}
    .sch-opp{flex:1;font-size:15px;letter-spacing:-0.2px;}
    .sch-opp.live{color:#fff;font-weight:600;}
    .sch-opp.done{color:${IOS.label2};}
    .sch-opp.up{color:${IOS.label3};}
    .sch-score{font-size:14px;color:${IOS.label3};width:40px;text-align:center;}
    .sch-badge{border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700;}
    .sch-badge.W{background:rgba(48,209,88,0.15);color:${IOS.green};}
    .sch-badge.L{background:rgba(255,69,58,0.12);color:${IOS.red};}
    .sch-badge.live{background:rgba(10,132,255,0.15);color:${IOS.blue};}
    .sch-badge.up{background:${IOS.fill};color:${IOS.label3};}

    /* Profile */
    .prof-av-wrap{padding:20px 16px 16px;display:flex;align-items:flex-end;gap:16px;}
    .prof-av{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${IOS.blue},${IOS.indigo});display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;flex-shrink:0;}
    .prof-name{font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:2px;}
    .prof-league{font-size:13px;color:${IOS.label3};}
    .prof-rank-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(10,132,255,0.15);border:1px solid rgba(10,132,255,0.3);border-radius:20px;padding:5px 12px;margin-top:8px;}
    .prof-rank-txt{font-size:12px;font-weight:600;color:${IOS.blue};}

    .seg-control{display:flex;background:${IOS.bg3};border-radius:10px;padding:2px;margin:0 16px 14px;gap:2px;}
    .seg-item{flex:1;text-align:center;padding:7px 4px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:${IOS.label3};transition:all .15s;}
    .seg-item.on{background:${IOS.bg2};color:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);}

    .unit-chart-card{background:${IOS.bg2};border-radius:16px;padding:16px;margin:0 16px 10px;}
    .uc-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
    .uc-title{font-size:15px;font-weight:600;}
    .uc-total{font-size:15px;font-weight:600;color:${IOS.green};}
    .uc-bars{display:flex;align-items:flex-end;gap:8px;height:64px;}
    .uc-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
    .uc-bar{width:100%;border-radius:4px 4px 0 0;}
    .uc-bar-lbl{font-size:10px;color:${IOS.label3};font-weight:500;}

    .perf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 16px 10px;}
    .perf-card{background:${IOS.bg2};border-radius:14px;padding:14px;}
    .perf-lbl{font-size:12px;color:${IOS.label3};margin-bottom:6px;font-weight:500;}
    .perf-val{font-size:17px;font-weight:700;letter-spacing:-0.3px;}

    /* Trophies */
    .trophy-card{background:${IOS.bg2};border-radius:14px;margin:0 16px 8px;padding:14px 16px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;}
    .trophy-icon-bg{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
    .trophy-name{font-size:16px;font-weight:600;letter-spacing:-0.2px;margin-bottom:2px;}
    .trophy-desc{font-size:13px;color:${IOS.label3};}
    .trophy-holder{font-size:12px;font-weight:500;margin-top:4px;}
    .trophy-mine-pill{background:rgba(255,214,10,0.15);border:1px solid rgba(255,214,10,0.3);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:${IOS.yellow};flex-shrink:0;margin-left:auto;}

    /* Power-ups screen */
    .pu-card{background:${IOS.bg2};border-radius:14px;margin:0 16px 8px;padding:14px 16px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;}
    .pu-card-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
    .pu-card-name{font-size:16px;font-weight:600;letter-spacing:-0.2px;margin-bottom:2px;}
    .pu-card-rarity{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;}
    .pu-card-desc{font-size:13px;color:${IOS.label3};}
    .pu-use-btn{background:${IOS.fill2};border:none;border-radius:8px;padding:7px 14px;font-family:'Manrope',sans-serif;font-size:13px;font-weight:600;color:${IOS.blue};cursor:pointer;white-space:nowrap;flex-shrink:0;}

    /* Wheel */
    .wheel-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.92);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;backdrop-filter:blur(10px);}
    .wheel-hdr{text-align:center;margin-bottom:24px;}
    .wheel-hdr-title{font-size:28px;font-weight:700;letter-spacing:-0.5px;}
    .wheel-hdr-sub{font-size:15px;color:${IOS.label3};margin-top:4px;}
    .wheel-wrap{position:relative;width:280px;height:280px;margin-bottom:28px;}
    .wheel-pointer{position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:22px solid #fff;z-index:10;filter:drop-shadow(0 2px 6px rgba(255,255,255,0.3));}
    .spin-ios-btn{background:${IOS.blue};color:#fff;border:none;border-radius:14px;padding:16px 48px;font-family:'Manrope',sans-serif;font-size:17px;font-weight:600;cursor:pointer;letter-spacing:-0.3px;transition:opacity .15s;}
    .spin-ios-btn:active{opacity:0.8;}
    .spin-ios-btn:disabled{background:${IOS.bg3};color:${IOS.gray};cursor:default;}
    .win-modal{position:absolute;inset:0;background:rgba(0,0,0,0.85);z-index:110;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px;}

    /* Power-up modal */
    .pu-modal-bg{position:absolute;inset:0;background:rgba(0,0,0,0.6);z-index:80;display:flex;flex-direction:column;justify-content:flex-end;backdrop-filter:blur(6px);}
    .pu-modal-sheet{background:#1C1C1E;border-radius:20px 20px 0 0;padding:0 0 32px;}
    .pu-modal-handle{width:36px;height:5px;border-radius:3px;background:rgba(255,255,255,0.2);margin:10px auto 0;}
    .pu-modal-hdr{padding:16px 20px 12px;border-bottom:0.5px solid rgba(255,255,255,0.08);}
    .pu-modal-title{font-size:17px;font-weight:700;letter-spacing:-0.3px;margin-bottom:3px;}
    .pu-modal-sub{font-size:13px;color:${IOS.label3};}
    .pu-opt{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:0.5px solid rgba(255,255,255,0.06);cursor:pointer;transition:background .12s;}
    .pu-opt:last-child{border-bottom:none;}
    .pu-opt:active{background:rgba(255,255,255,0.04);}
    .pu-opt-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
    .pu-opt-name{font-size:15px;font-weight:600;color:#fff;margin-bottom:2px;}
    .pu-opt-desc{font-size:12px;color:${IOS.label3};}
    .pu-opt-rarity{font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-top:3px;}

    /* Applied PU badge on slot */
    .pu-active-badge{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;margin-top:8px;cursor:pointer;}
    .pu-active-icon{font-size:14px;}
    .pu-active-name{font-size:11px;font-weight:700;letter-spacing:0.3px;}
    .pu-active-remove{font-size:11px;opacity:0.5;margin-left:2px;}
    .win-icon{font-size:64px;animation:iosPop .4s cubic-bezier(0.34,1.56,0.64,1);}
    @keyframes iosPop{0%{transform:scale(0.3);opacity:0;}100%{transform:scale(1);opacity:1;}}
    .win-got{font-size:13px;font-weight:600;color:${IOS.label3};letter-spacing:0.5px;text-transform:uppercase;}
    .win-name{font-size:28px;font-weight:700;letter-spacing:-0.5px;text-align:center;}
    .win-desc{font-size:15px;color:${IOS.label3};text-align:center;line-height:1.5;}
    .win-rarity-pill{border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;}

    /* Chat */
    .chat-bg{background:${IOS.bg};flex:1;display:flex;flex-direction:column;}
    .chat-msgs{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;}
    .msg-group{display:flex;gap:8px;align-items:flex-end;}
    .msg-group.me{flex-direction:row-reverse;}
    .msg-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;color:#fff;}
    .msg-col{max-width:72%;}
    .msg-sender{font-size:12px;color:${IOS.label3};margin-bottom:3px;}
    .msg-group.me .msg-sender{text-align:right;}
    .bubble{padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.4;letter-spacing:-0.1px;}
    .bubble.them{background:${IOS.bg3};color:#fff;border-bottom-left-radius:4px;}
    .bubble.me{background:${IOS.blue};color:#fff;border-bottom-right-radius:4px;}
    .msg-time{font-size:11px;color:${IOS.label3};margin-top:3px;}
    .msg-group.me .msg-time{text-align:right;}
    .date-sep{text-align:center;margin:6px 0;}
    .date-sep span{font-size:12px;color:${IOS.label3};font-weight:500;}
    .chat-input-bar{background:${IOS.bg2};border-top:0.5px solid ${IOS.sep};padding:10px 16px;display:flex;align-items:center;gap:10px;}
    .chat-field{flex:1;background:${IOS.bg3};border:none;border-radius:20px;padding:10px 16px;font-family:'Manrope',sans-serif;font-size:15px;color:#fff;outline:none;letter-spacing:-0.2px;}
    .chat-field::placeholder{color:${IOS.label3};}
    .chat-send{width:34px;height:34px;border-radius:50%;background:${IOS.blue};border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
    .chat-send:active{opacity:0.8;}
    .chat-send:disabled{background:${IOS.bg3};cursor:default;}

    /* iOS Tab Bar */
    .tab-bar{background:rgba(28,28,30,0.92);backdrop-filter:blur(20px) saturate(180%);border-top:0.5px solid rgba(255,255,255,0.08);display:flex;padding:8px 0 28px;position:sticky;bottom:0;z-index:20;}
    .tab-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:opacity .15s;}
    .tab-item:active{opacity:0.6;}
    .tab-icon{font-size:22px;line-height:1;}
    .tab-label{font-size:10px;font-weight:500;letter-spacing:-0.2px;color:${IOS.gray};}
    .tab-item.on .tab-label{color:${IOS.blue};}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#111",display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <style>{css}</style>

      {/* ══ AUTH SCREEN ══ */}
      {!user && (
        <div style={{width:390,minHeight:"100vh",background:"#09090f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px",fontFamily:"'Manrope',sans-serif"}}>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:-1,color:"#60a5fa",marginBottom:6}}>LINEDUP</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:48}}>Fantasy football for sports bettors</div>
          <div style={{display:"flex",background:"#1C1C1E",borderRadius:12,padding:2,marginBottom:28,width:"100%"}}>
            {["login","signup"].map(t=>(
              <div key={t} onClick={()=>setAuthScreen(t)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:authScreen===t?"#2C2C2E":"transparent",color:authScreen===t?"#fff":"rgba(255,255,255,0.4)",transition:"all .2s"}}>{t==="login"?"Sign In":"Sign Up"}</div>
            ))}
          </div>
          <input id="auth-email" type="email" placeholder="Email" style={{width:"100%",background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",marginBottom:12}}/>
          <input id="auth-password" type="password" placeholder="Password" style={{width:"100%",background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",marginBottom:24}}/>
          <button onClick={async()=>{
            const email=document.getElementById("auth-email").value;
            const password=document.getElementById("auth-password").value;
            if(authScreen==="login"){
              const {error}=await supabase.auth.signInWithPassword({email,password});
              if(error)alert(error.message);
            } else {
              const {error}=await supabase.auth.signUp({email,password});
              if(error)alert(error.message);
              else alert("Account created! Check your email to confirm.");
            }
          }} style={{width:"100%",background:"#0A84FF",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'Manrope',sans-serif",marginBottom:16}}>
            {authScreen==="login"?"Sign In":"Create Account"}
          </button>
          {authScreen==="login"&&<div style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}} onClick={()=>setAuthScreen("signup")}>No account? Sign up</div>}
          {authScreen==="signup"&&<div style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}} onClick={()=>setAuthScreen("login")}>Already have an account? Sign in</div>}
        </div>
      )}

      {user && <div className="phone">

        {/* ══ POWER-UP MODAL ══ */}
        {showPUModal && (
          <div className="pu-modal-bg" onClick={()=>setShowPUModal(null)}>
            <div className="pu-modal-sheet" onClick={e=>e.stopPropagation()}>
              <div className="pu-modal-handle"/>
              <div className="pu-modal-hdr">
                <div className="pu-modal-title">Use a Power-Up</div>
                <div className="pu-modal-sub">
                  {showPUModal.context==="picks"
                    ? `Applied to your ${showPUModal.slotLabel} pick`
                    : `Applied to pick #${(showPUModal.pickIdx||0)+1} in live matchup`}
                </div>
              </div>
              {myPUs.length===0
                ? <div style={{padding:"28px 20px",textAlign:"center",color:IOS.label3,fontSize:15}}>No power-ups in inventory</div>
                : myPUs.map((pu,i)=>(
                  <div key={i} className="pu-opt" onClick={()=>usePU(pu, showPUModal.context, showPUModal.context==="picks"?showPUModal.slotId:showPUModal.pickIdx)}>
                    <div className="pu-opt-icon" style={{background:`${pu.color}20`}}>{pu.icon}</div>
                    <div style={{flex:1}}>
                      <div className="pu-opt-name">{pu.name}</div>
                      <div className="pu-opt-desc">{pu.desc}</div>
                      <div className="pu-opt-rarity" style={{color:rarityColor(pu.rarity)}}>{pu.rarity}</div>
                    </div>
                    <div style={{fontSize:20,color:IOS.label3}}>›</div>
                  </div>
                ))
              }
              <div style={{padding:"14px 20px 0"}}>
                <button onClick={()=>setShowPUModal(null)} style={{width:"100%",background:IOS.bg3,border:"none",borderRadius:12,padding:"14px",fontFamily:"Manrope,sans-serif",fontSize:15,fontWeight:600,color:IOS.label2,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ TOP SCORER CELEBRATION ══ */}
        {showTopScorer && (
          <div style={{
            position:"absolute",inset:0,zIndex:200,
            background:"linear-gradient(180deg, #0a0a1a 0%, #0d0d20 60%, #050510 100%)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"40px 32px",gap:0,
            fontFamily:"'Manrope',sans-serif",
          }}>
            <style>{`
              @keyframes floatUp{0%{transform:translateY(0) scale(1);}50%{transform:translateY(-12px) scale(1.05);}100%{transform:translateY(0) scale(1);}}
              @keyframes pulseGlow{0%,100%{box-shadow:0 0 40px rgba(255,214,10,0.3),0 0 80px rgba(255,214,10,0.1);}50%{box-shadow:0 0 60px rgba(255,214,10,0.5),0 0 120px rgba(255,214,10,0.2);}}
              @keyframes shimmer{0%{opacity:0.6;}50%{opacity:1;}100%{opacity:0.6;}}
              @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
              .ts-trophy{animation:floatUp 3s ease-in-out infinite, pulseGlow 3s ease-in-out infinite;}
              .ts-line1{animation:fadeSlideUp .5s ease forwards; animation-delay:.1s; opacity:0;}
              .ts-line2{animation:fadeSlideUp .5s ease forwards; animation-delay:.3s; opacity:0;}
              .ts-line3{animation:fadeSlideUp .5s ease forwards; animation-delay:.5s; opacity:0;}
              .ts-score{animation:fadeSlideUp .5s ease forwards; animation-delay:.65s; opacity:0;}
              .ts-divider{animation:fadeSlideUp .5s ease forwards; animation-delay:.8s; opacity:0;}
              .ts-btn{animation:fadeSlideUp .5s ease forwards; animation-delay:1s; opacity:0;}
              .ts-dismiss{animation:fadeSlideUp .5s ease forwards; animation-delay:1.2s; opacity:0;}
              .spin-glow-btn{
                background: linear-gradient(135deg, #FFD60A, #FF9F0A);
                border: none; border-radius: 18px; padding: 18px 0; width: 100%;
                font-family: 'Manrope', sans-serif; font-size: 18px; font-weight: 800;
                color: #000; cursor: pointer; letter-spacing: -0.3px;
                box-shadow: 0 8px 32px rgba(255,214,10,0.4), 0 2px 8px rgba(0,0,0,0.3);
                display: flex; align-items: center; justify-content: center; gap: 10px;
                transition: transform .15s, box-shadow .15s;
              }
              .spin-glow-btn:active{transform:scale(0.97);box-shadow:0 4px 16px rgba(255,214,10,0.3);}
              .confetti-dot{position:absolute;border-radius:50%;animation:shimmer 2s ease-in-out infinite;}
            `}</style>

            {/* Confetti dots */}
            {[
              {top:"12%",left:"14%",size:6,color:"#FFD60A",delay:"0s"},
              {top:"18%",right:"12%",size:8,color:"#FF9F0A",delay:"0.4s"},
              {top:"8%",left:"52%",size:5,color:"#30D158",delay:"0.8s"},
              {top:"25%",left:"8%",size:4,color:"#0A84FF",delay:"1.2s"},
              {top:"22%",right:"22%",size:5,color:"#FF375F",delay:"0.6s"},
              {top:"78%",left:"10%",size:6,color:"#FFD60A",delay:"1s"},
              {top:"82%",right:"14%",size:5,color:"#30D158",delay:"0.3s"},
              {top:"72%",left:"82%",size:7,color:"#FF9F0A",delay:"0.7s"},
              {top:"88%",left:"40%",size:4,color:"#BF5AF2",delay:"1.1s"},
            ].map((d,i)=>(
              <div key={i} className="confetti-dot" style={{
                top:d.top,left:d.left,right:d.right,
                width:d.size,height:d.size,
                background:d.color,
                animationDelay:d.delay,
              }}/>
            ))}

            {/* Trophy */}
            <div className="ts-trophy" style={{fontSize:90,lineHeight:1,marginBottom:28}}>🏆</div>

            {/* Week badge */}
            <div className="ts-line1" style={{
              background:"rgba(255,214,10,0.12)",border:"1px solid rgba(255,214,10,0.3)",
              borderRadius:20,padding:"5px 16px",marginBottom:16,
              fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#FFD60A",
            }}>Week 6 · Top Scorer</div>

            {/* Main headline */}
            <div className="ts-line2" style={{
              fontSize:38,fontWeight:800,letterSpacing:-1.5,textAlign:"center",
              color:"#fff",lineHeight:1.1,marginBottom:10,
            }}>You're the top scorer this week</div>

            {/* Sub */}
            <div className="ts-line3" style={{
              fontSize:15,fontWeight:500,color:"rgba(255,255,255,0.45)",
              textAlign:"center",lineHeight:1.6,marginBottom:24,letterSpacing:-0.2,
            }}>You went 4-1 and outscored everyone in The Boys League. Time to claim your reward.</div>

            {/* Score card */}
            <div className="ts-score" style={{
              background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:16,padding:"14px 28px",marginBottom:28,
              display:"flex",gap:32,alignItems:"center",
            }}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,letterSpacing:-0.5,color:"#FFD60A"}}>4-1</div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginTop:2}}>This Week</div>
              </div>
              <div style={{width:1,height:36,background:"rgba(255,255,255,0.1)"}}/>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,letterSpacing:-0.5,color:"#30D158"}}>+8.5u</div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginTop:2}}>Units Won</div>
              </div>
              <div style={{width:1,height:36,background:"rgba(255,255,255,0.1)"}}/>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,letterSpacing:-0.5,color:"#fff"}}>#1</div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginTop:2}}>Rank</div>
              </div>
            </div>

            {/* Divider with label */}
            <div className="ts-divider" style={{
              display:"flex",alignItems:"center",gap:10,marginBottom:20,width:"100%",
            }}>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}}/>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.25)"}}>Your reward</div>
              <div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}}/>
            </div>

            {/* Spin button */}
            <div className="ts-btn" style={{width:"100%",marginBottom:14}}>
              <button className="spin-glow-btn" onClick={()=>{setShowTopScorer(false);setShowWheel(true);}}>
                🎰 Spin the Wheel
              </button>
            </div>

            {/* Dismiss */}
            <div className="ts-dismiss">
              <div onClick={()=>setShowTopScorer(false)} style={{
                fontSize:14,fontWeight:500,color:"rgba(255,255,255,0.3)",
                cursor:"pointer",textAlign:"center",padding:"4px 20px",
              }}>Claim later</div>
            </div>
          </div>
        )}

        {/* ══ WHEEL ══ */}
        {showWheel && (
          <div className="wheel-overlay">
            {showWin && wonPU ? (
              <div className="win-modal">
                <div className="win-icon">{wonPU.icon}</div>
                <div className="win-got">You won a power-up</div>
                <div className="win-name">{wonPU.name}</div>
                <div className="win-rarity-pill" style={{background:`${wonPU.color}20`,color:wonPU.color,border:`1px solid ${wonPU.color}40`}}>
                  {wonPU.rarity==="legendary"?"⚡ Legendary":wonPU.rarity==="rare"?"💎 Rare":"● Common"}
                </div>
                <div className="win-desc">{wonPU.desc}</div>
                <button className="ios-btn blue" style={{width:"auto",padding:"14px 40px",marginTop:8}} onClick={claimPU}>
                  {myPUs.length<3?"Add to Inventory":"Inventory Full"}
                </button>
                <div onClick={()=>{setShowWin(false);setShowWheel(false);setWonPU(null);}} style={{fontSize:15,color:IOS.label3,cursor:"pointer",marginTop:4}}>Dismiss</div>
              </div>
            ) : (
              <>
                <div className="wheel-hdr">
                  <div className="wheel-hdr-title">Power-Up Wheel</div>
                  <div className="wheel-hdr-sub">Week 6 Top Scorer Reward</div>
                </div>
                <div className="wheel-wrap">
                  <div className="wheel-pointer"/>
                  <svg width={W} height={W} style={{transition:spinning?"transform 4s cubic-bezier(0.17,0.67,0.12,0.99)":"none",transform:`rotate(${wheelAngle}deg)`,borderRadius:"50%",display:"block"}}>
                    {WHEEL_ITEMS.map((item,i)=>{
                      const sa=i*segA;const ea=(i+1)*segA;
                      const p1=polarToCart(R,R,R,sa);const p2=polarToCart(R,R,R,ea);
                      const mid=polarToCart(R,R,R*0.64,sa+segA/2);
                      const cols=["#1a1a2e","#16213e","#0f3460","#1a1a2e","#16213e","#0f1b35","#1e1e2e","#141428","#1c1c30","#141422"];
                      return (
                        <g key={i}>
                          <path d={`M ${R} ${R} L ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y} Z`} fill={cols[i%cols.length]} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                          <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle" fontSize="16" transform={`rotate(${sa+segA/2}, ${mid.x}, ${mid.y})`}>{item.icon}</text>
                        </g>
                      );
                    })}
                    <circle cx={R} cy={R} r={16} fill="#1C1C1E" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                  </svg>
                </div>
                <button className="spin-ios-btn" disabled={spinning} onClick={spinWheel}>{spinning?"Spinning...":"Spin"}</button>
                {!spinning&&<div onClick={()=>setShowWheel(false)} style={{marginTop:16,fontSize:15,color:IOS.label3,cursor:"pointer"}}>Cancel</div>}
              </>
            )}
          </div>
        )}

        {/* ══ HOME ══ */}
        {screen==="home"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              <div className="nav-header large" style={{padding:"0 20px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div className="nav-title-large">LINEDUP</div>
                  <div onClick={()=>setScreen("leagues")} style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>All Leagues</div>
                </div>
                {/* League toggle */}
                <div style={{display:"flex",gap:6,marginTop:10,marginBottom:2,overflowX:"auto",paddingBottom:2}}>
                  {(realLeagues.length>0?realLeagues:LEAGUES_DATA).map(lg=>{
                    const sp=SPORTS[lg.sport];
                    const isActive=activeLeagueId===lg.id;
                    return (
                      <div key={lg.id} onClick={()=>{setActiveLeagueId(lg.id);setPicks({ml:null,prop:null,ou:null,spread:null});setLsBets([]);}}
                        style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,cursor:"pointer",transition:"all .18s",
                          background:isActive?`${sp.color}20`:"rgba(255,255,255,0.06)",
                          border:`1px solid ${isActive?sp.color+"50":"rgba(255,255,255,0.08)"}`,
                        }}>
                        <span style={{fontSize:15}}>{sp.icon}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:isActive?sp.color:"rgba(255,255,255,0.6)",letterSpacing:-0.2}}>{lg.name}</div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1}}>Wk {lg.current_week||lg.week||1} · {sp.label}</div>
                        </div>
                        {isActive&&<div style={{width:6,height:6,borderRadius:"50%",background:sp.color,marginLeft:2}}/>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stat pills */}
              <div className="stat-pills">
                <div className="stat-pill"><div className="stat-pill-val" style={{color:sport.color}}>{activeLeague.userRecord}</div><div className="stat-pill-lbl">Record</div></div>
                <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>{activeLeague.userRoi}%</div><div className="stat-pill-lbl">ROI</div></div>
                <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>{activeLeague.userUnits}u</div><div className="stat-pill-lbl">Units</div></div>
              </div>

              {/* Matchup — compact card */}
              <div className="ios-section" style={{margin:"0 16px 6px"}}>
                <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Wk {activeLeague.week} Matchup · Live</span>
                  <span onClick={()=>setScreen("matchup")} style={{color:sport.color,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>View Details</span>
                </div>
              </div>
              <div
                onClick={()=>setScreen("matchup")}
                style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:16,padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden",border:`1px solid ${sport.color}30`}}
              >
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${sport.color},${IOS.teal})`}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5,color:sport.color}}>YOU</div>
                    <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{activeLeague.userRecord}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,letterSpacing:-1,color:"#fff"}}>3 <span style={{fontSize:16,color:IOS.label3,fontWeight:500}}>–</span> 1</div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.green,marginTop:2}}>You're winning</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5}}>{activeLeague.opponent}</div>
                    <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{activeLeague.opponentRecord}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginTop:12,paddingTop:10,borderTop:`0.5px solid ${IOS.sep}`,alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",gap:5}}>
                    {["W","W","L","pending","pending"].map((r,i)=>(
                      <div key={i} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:r==="W"?"rgba(48,209,88,0.15)":r==="L"?"rgba(255,69,58,0.12)":"rgba(255,255,255,0.06)",color:r==="W"?IOS.green:r==="L"?IOS.red:IOS.label3}}>
                        {r==="W"?"W":r==="L"?"L":"·"}
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:IOS.label3,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:sport.color,fontWeight:600}}>2 pending</span>
                    <span style={{fontSize:16,color:IOS.label3}}>›</span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="countdown-bar">
                <div className="cd-label">Lineup locks in</div>
                <div className="cd-time">{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</div>
              </div>
              {savedPicks
                ? <button className="ios-btn" style={{background:IOS.green,color:"#000",marginBottom:6}} onClick={()=>setScreen("picks")}>✓ Picks Locked — View or Edit</button>
                : <button className="ios-btn" style={{background:sport.color,color:"#fff",marginBottom:6}} onClick={()=>setScreen("picks")}>{sport.icon} Make Your {sport.label} Picks</button>
              }

              {/* My Locked Picks card */}
              {savedPicks && (
                <div style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:16,overflow:"hidden",border:`1px solid rgba(48,209,88,0.25)`}}>
                  <div style={{position:"absolute",display:"none"}}/>
                  <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${IOS.sep}`}}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.green}}>✓ Week 6 Picks Locked</div>
                    <div style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}} onClick={()=>setScreen("picks")}>Edit</div>
                  </div>
                  {SLOTS.map(slot=>{
                    const p = slot.id==="longshot" ? null : savedPicks.picks?.[slot.id];
                    const lsB = slot.id==="longshot" ? savedPicks.lsBets : null;
                    if(slot.id==="longshot") {
                      if(!lsB||!lsB.length) return null;
                      return (
                        <div key="ls" style={{padding:"11px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:slot.color,marginBottom:3}}>{slot.mult}× · {slot.label}</div>
                              <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{lsB.length}-leg parlay</div>
                            </div>
                            <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5,color:IOS.pink}}>{calcLS(lsB)?.american}</div>
                          </div>
                          {lsB.map(b=>(
                            <div key={b.id} style={{fontSize:12,color:IOS.label3,marginTop:4,paddingLeft:8}}>· {b.pick} <span style={{color:b.odds.startsWith("+")?IOS.green:IOS.blue,fontWeight:600}}>{b.odds}</span></div>
                          ))}
                        </div>
                      );
                    }
                    if(!p) return null;
                    return (
                      <div key={slot.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:slot.color,marginBottom:3}}>{slot.mult}× · {slot.label}</div>
                          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{p.pick}</div>
                          <div style={{fontSize:11,color:IOS.label3,marginTop:1}}>{p.game}</div>
                        </div>
                        <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,color:p.odds.startsWith("+")?IOS.green:IOS.blue}}>{p.odds}</div>
                      </div>
                    );
                  })}
                  {savedPicks.parlay && (
                    <div style={{padding:"10px 16px",background:"rgba(48,209,88,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:11,fontWeight:600,color:IOS.label3}}>Combined odds · $10 wins</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:12,fontWeight:700,color:IOS.green}}>${((savedPicks.parlay.payout/100)*10).toFixed(2)}</div>
                        <div style={{fontSize:18,fontWeight:800,color:IOS.green,letterSpacing:-0.5}}>{savedPicks.parlay.american}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Power-Ups */}
              <div className="ios-section" style={{margin:"12px 16px 6px"}}>
                <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Power-Ups</span>
                  <span onClick={()=>{setProfTab("power-ups");setScreen("profile");}} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
                </div>
              </div>
              <div className="pu-scroll" style={{paddingBottom:6}}>
                {myPUs.map((pu,i)=>(
                  <div key={i} className="pu-chip">
                    <div className="pu-chip-icon">{pu.icon}</div>
                    <div><div className="pu-chip-name">{pu.name}</div><div className="pu-chip-rarity" style={{color:rarityColor(pu.rarity)}}>{pu.rarity}</div></div>
                  </div>
                ))}
                <div className="pu-spin-chip" onClick={()=>setShowWheel(true)}>
                  <div style={{fontSize:20}}>🎰</div>
                  <div><div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Spin Wheel</div><div style={{fontSize:11,color:IOS.purple,fontWeight:500}}>Wk 6 Reward</div></div>
                </div>
              </div>

              {/* Standings preview */}
              <div className="ios-section" style={{margin:"12px 16px 6px"}}>
                <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Standings</span>
                  <span onClick={()=>setScreen("league")} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
                </div>
              </div>
              <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px",overflow:"hidden"}}>
                {STANDINGS.slice(0,5).map(r=>(
                  <div key={r.rank} className="mini-stand" style={r.name==="Joe"?{background:"rgba(10,132,255,0.08)"}:{}}>
                    <div className={`ms-rank ${r.rank===1?"top":""}`}>{r.rank}</div>
                    <div className={`ms-name ${r.name==="Joe"?"me":""}`}>{r.name==="Joe"?"You":r.name}</div>
                    <div className="ms-rec">{r.record}</div>
                    <div className={`ms-units ${r.units.startsWith("+")?"pos":"neg"}`}>{r.units}u</div>
                  </div>
                ))}
              </div>
              <div style={{height:16}}/>
            </div>
          </>
        )}

        {/* ══ PICKS ══ */}
        {screen==="picks"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>

            {/* Bet picker sheet */}
            {activeSlot&&(
              <div className="sheet-bg" onClick={()=>setActiveSlot(null)}>
                <div className="sheet" onClick={e=>e.stopPropagation()}>
                  <div className="sheet-handle"/>
                  <div className="sheet-hdr">
                    <div>
                      <div className="sheet-hdr-title">{SLOTS.find(s=>s.id===activeSlot)?.label}</div>
                      <div className="sheet-hdr-sub">{activeSlot==="longshot"?`${lsBets.length} selected · compounds into your 5× Parlay leg`:`${SLOTS.find(s=>s.id===activeSlot)?.mult}× multiplier`}</div>
                    </div>
                    <div className="sheet-done" onClick={()=>{setActiveSlot(null);setPickSearch("");}}>Done</div>
                  </div>
                  {activeSlot==="longshot"&&lsBets.length>=2&&(
                    <div className="sheet-ls-bar">
                      <span style={{fontSize:12,fontWeight:600,color:IOS.pink}}>🚀 Mini-parlay odds</span>
                      <span style={{fontSize:20,fontWeight:700,color:IOS.pink,letterSpacing:-0.5}}>{lsO?.american}</span>
                    </div>
                  )}
                  {/* Search bar */}
                  <div className="sheet-search-wrap" style={{top:activeSlot==="longshot"&&lsBets.length>=2?104:60}}>
                    <div style={{position:"relative"}}>
                      <span className="sheet-search-icon">🔍</span>
                      <input
                        className="sheet-search"
                        placeholder={`Search teams, players, matchups...`}
                        value={pickSearch}
                        onChange={e=>setPickSearch(e.target.value)}
                        autoFocus={false}
                      />
                      {pickSearch&&<span onClick={()=>setPickSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>✕</span>}
                    </div>
                  </div>
                  {/* Result count */}
                  {pickSearch&&(
                    <div className="sheet-count">
                      {(BETS[activeSlot]||[]).filter(b=>{const q=pickSearch.toLowerCase();return b.game.toLowerCase().includes(q)||b.pick.toLowerCase().includes(q)||b.odds.includes(q);}).length} results for "{pickSearch}"
                    </div>
                  )}
                  {BETS[activeSlot]?.map(bet=>{
                    const pos=!bet.odds.startsWith("-");
                    const cur=activeSlot==="longshot"?lsBets.find(b=>b.id===bet.id):picks[activeSlot]?.id===bet.id;
                    const slot=SLOTS.find(s=>s.id===activeSlot);
                    const pts=slot ? calcPickPoints(slot.mult, bet.impliedOdds, "W") : 0;
                    // Filter by search
                    const q=pickSearch.toLowerCase().trim();
                    if(q&&!bet.game.toLowerCase().includes(q)&&!bet.pick.toLowerCase().includes(q)&&!bet.odds.includes(q)) return null;
                    return (
                      <div key={bet.id} className="bet-row" style={cur?{background:"rgba(10,132,255,0.06)"}:{}} onClick={()=>selectBet(activeSlot,bet)}>
                        <div className="bet-row-left">
                          <div className="bet-row-game">{bet.game}</div>
                          <div className="bet-row-pick">{bet.pick}</div>
                          <div style={{marginTop:5,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(48,209,88,0.1)",border:"1px solid rgba(48,209,88,0.2)",borderRadius:6,padding:"2px 8px"}}>
                            <span style={{fontSize:10,fontWeight:700,color:IOS.green}}>+{pts} pts if win</span>
                            <span style={{fontSize:9,color:"rgba(48,209,88,0.5)"}}>({slot?.mult}× · {bet.odds})</span>
                          </div>
                        </div>
                        <div className="bet-row-right">
                          <div className="bet-row-odds" style={{color:pos?IOS.green:IOS.blue}}>{bet.odds}</div>
                          <div className={`bet-check ${cur?"on":"off"}`}>{cur&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submitted */}
            {submitted&&(
              <div className="done-screen">
                <div className="done-checkmark">✓</div>
                <div className="done-title">Picks Locked In</div>
                <div className="done-odds">{parlay?.american}</div>
                <div className="done-payout">$100 to win ${parlay?.payout} · Week 6</div>
                <div className="done-legs-card">
                  {SLOTS.map(slot=>{
                    if(slot.id==="longshot"){
                      if(!lsBets.length)return null;
                      return (
                        <div key="ls">
                          <div className="done-leg-row"><div><div className="done-leg-lbl">🚀 Parlay · 5× · {lsBets.length} legs</div></div><div className="done-leg-odds" style={{color:IOS.pink}}>{lsO?.american}</div></div>
                          {lsBets.map(b=><div key={b.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 16px 8px 28px",borderBottom:`0.5px solid ${IOS.sep}`}}><span style={{fontSize:13,color:IOS.label3}}>{b.pick}</span><span style={{fontSize:14,fontWeight:700,letterSpacing:-0.3,color:b.odds.startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</span></div>)}
                        </div>
                      );
                    }
                    const p=picks[slot.id];if(!p)return null;
                    return <div key={slot.id} className="done-leg-row"><div><div className="done-leg-lbl">{slot.icon} {slot.label} · {slot.mult}×</div><div className="done-leg-pick">{p.pick}</div></div><div className="done-leg-odds" style={{color:p.odds.startsWith("+")?IOS.green:IOS.blue}}>{p.odds}</div></div>;
                  })}
                </div>
                <button className="ios-btn blue" onClick={()=>{setSubmitted(false);setPicks({ml:null,prop:null,ou:null,spread:null});setLsBets([]);setScreen("home");}}>Back to Home</button>
              </div>
            )}

            <div className="body">
              <div style={{padding:"8px 16px 14px",display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>setScreen("home")} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                <div style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>Pick Builder</div>
              </div>

              <div className="pb-header">
                <div className="pb-title">{sport.icon} {sport.label} Picks</div>
                <div className="pb-sub">{activeLeague.name} · Wk {activeLeague.week} · vs {activeLeague.opponent}</div>
              </div>

              {/* Parlay odds */}
              {(()=>{
                const sf=Object.values(picks).filter(v=>v).length;
                const lf=lsBets.length>=2;
                const tf=sf+(lf?1:0);
                const oddsColor=tf===0?IOS.label3:tf===5?IOS.green:IOS.blue;
                const payout10=parlay?((parlay.payout/100)*10).toFixed(2):null;
                return (
                  <div className="parlay-odds-card" style={{borderWidth:1,borderStyle:"solid",borderColor:tf===0?IOS.bg3:tf===5?"rgba(48,209,88,0.3)":"rgba(10,132,255,0.2)"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:tf===0?"rgba(255,255,255,0.06)":tf===5?`linear-gradient(90deg,${IOS.green},${IOS.teal})`:`linear-gradient(90deg,${IOS.blue},${IOS.teal})`}}/>
                    <div className="poc-top">
                      <div>
                        <div className="poc-label">Combined Odds</div>
                        <div className="poc-odds" style={{color:oddsColor}}>{tf===0?"—":parlay?.american}</div>
                        {parlay&&tf>0&&<div style={{fontSize:11,color:IOS.label3,marginTop:4}}>$10 wins <span style={{color:IOS.label2,fontWeight:600}}>${payout10}</span></div>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div className="poc-label" style={{marginBottom:8}}>Picks</div>
                        <div className="poc-leg-dots">
                          {SLOTS.map(s=>{const f=s.id==="longshot"?lsBets.length>=2:picks[s.id];return <div key={s.id} className="poc-dot" style={{background:f?s.color:"rgba(255,255,255,0.12)"}}/>;} )}
                        </div>
                      </div>
                    </div>
                    <div className="poc-status">
                      {tf===0&&<span>Fill all 5 picks to see your combined odds</span>}
                      {tf>0&&tf<5&&<span>{tf}/5 picks · Combined: <span className="poc-hi">{parlay?.american||"—"}</span></span>}
                      {tf===5&&<span className="poc-ok">✓ All picks in — ready to lock</span>}
                    </div>
                  </div>
                );
              })()}

              {/* Slot cards */}
              {SLOTS.map(slot=>{
                const pick=slot.id==="longshot"?null:picks[slot.id];
                const lsFilled=slot.id==="longshot"&&lsBets.length>=2;
                const filled=pick||lsFilled;
                const appliedPU=activatedPUs[slot.id];
                return (
                  <div key={slot.id} className="slot-card" style={filled?{borderWidth:1,borderStyle:"solid",borderColor:`${slot.color}40`}:{borderWidth:1,borderStyle:"solid",borderColor:"transparent"}}>
                    <div className="slot-top-row" onClick={()=>setActiveSlot(slot.id)}>
                      <div className="slot-mult-badge" style={{background:slot.bg}}>
                        <div className="slot-mult-n" style={{color:slot.color}}>{slot.mult}</div>
                        <div className="slot-mult-x" style={{color:slot.color}}>×</div>
                      </div>
                      <div style={{flex:1}}>
                        <div className="slot-label">{slot.label}</div>
                        <div className="slot-desc-txt">{slot.id==="longshot"?(lsBets.length===0?"Pick 2+ bets — builds your parlay":`${lsBets.length} bet${lsBets.length>1?"s":""} selected`):slot.desc}</div>
                      </div>
                      <div className="slot-add-btn" style={filled?{color:slot.color}:{}}>{slot.id==="longshot"?(lsBets.length?"+ Add":"+ Pick"):pick?"Change":"+ Pick"}</div>
                    </div>
                    {pick&&slot.id!=="longshot"&&(
                      <div className="slot-pick-row" onClick={()=>setActiveSlot(slot.id)}>
                        <div className="spr-left">
                          <div className="spr-game" style={{color:slot.color}}>{pick.game}</div>
                          <div className="spr-pick">{pick.pick}</div>
                        </div>
                        <div className="spr-odds" style={{color:pick.odds.startsWith("+")?IOS.green:IOS.blue}}>{pick.odds}</div>
                        <button className="spr-clear" onClick={e=>{e.stopPropagation();clearPick(slot.id);}}>✕</button>
                      </div>
                    )}
                    {slot.id==="longshot"&&lsBets.length>0&&(
                      <div>
                        {lsBets.map((b,i)=>(
                          <div key={b.id} className="ls-pick-item" onClick={()=>setActiveSlot("longshot")}>
                            <div className="ls-pick-info">
                              <div className="ls-pick-game">{b.game}</div>
                              <div className="ls-pick-name">{b.pick}</div>
                            </div>
                            <div className="ls-pick-odds" style={{color:b.odds.startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</div>
                            <button className="spr-clear" onClick={e=>{e.stopPropagation();setLsBets(p=>p.filter(x=>x.id!==b.id));}}><span style={{fontSize:11}}>✕</span></button>
                          </div>
                        ))}
                        <div className="ls-total-bar">
                          <div className="ls-total-lbl">{lsBets.length}-leg mini-parlay</div>
                          <div className="ls-total-odds">{lsO?.american}</div>
                        </div>
                      </div>
                    )}
                    {/* Power-up section — show when pick is filled */}
                    {filled && (
                      <div style={{padding:"10px 14px",borderTop:`0.5px solid rgba(255,255,255,0.06)`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        {appliedPU ? (
                          <div className="pu-active-badge" style={{background:`${appliedPU.color}15`,border:`1px solid ${appliedPU.color}30`}}>
                            <span className="pu-active-icon">{appliedPU.icon}</span>
                            <span className="pu-active-name" style={{color:appliedPU.color}}>{appliedPU.name} active</span>
                            <span className="pu-active-remove" onClick={e=>{e.stopPropagation();setMyPUs(p=>[...p,appliedPU]);setActivatedPUs(p=>{const n={...p};delete n[slot.id];return n;});}}>✕</span>
                          </div>
                        ) : (
                          myPUs.length>0 ? (
                            <div
                              onClick={e=>{e.stopPropagation();setShowPUModal({context:"picks",slotId:slot.id,slotLabel:slot.label});}}
                              style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.12)",borderRadius:8,cursor:"pointer"}}
                            >
                              <span style={{fontSize:14}}>⚡</span>
                              <span style={{fontSize:12,fontWeight:600,color:IOS.label3}}>Use a Power-Up</span>
                            </div>
                          ) : (
                            <div style={{fontSize:12,color:IOS.label3}}>No power-ups in inventory</div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{height:12}}/>
              {allFilled
                ? <button className="ios-btn green" onClick={async ()=>{
                    const locked = { picks, lsBets, parlay, lockedAt: new Date().toISOString() };
                    try { localStorage.setItem("linedup_picks_wk6", JSON.stringify(locked)); } catch(e) {}
                    setSavedPicks(locked);
                    if(user) {
                      const picksToSave = SLOTS.filter(s=>s.id!=="longshot").map(s=>{
                        const p = picks[s.id];
                        if(!p) return null;
                        return {
                          league_id: activeLeague.id,
                          user_id: user.id,
                          week: activeLeague.current_week||activeLeague.week||1,
                          slot: s.id,
                          multiplier: s.mult,
                          pick_name: p.pick,
                          odds: p.odds,
                          implied_odds: p.impliedOdds,
                          result: "pending",
                          points_earned: 0,
                        };
                      }).filter(Boolean);
                      if(lsBets.length) {
                        lsBets.forEach(b=>picksToSave.push({
                          league_id: activeLeague.id,
                          user_id: user.id,
                          week: activeLeague.current_week||activeLeague.week||1,
                          slot: "longshot",
                          multiplier: 5,
                          pick_name: b.pick,
                          odds: b.odds,
                          implied_odds: b.impliedOdds,
                          result: "pending",
                          points_earned: 0,
                        }));
                      }
                      if(picksToSave.length) await supabase.from("picks").insert(picksToSave);
                    }
                    setSubmitted(true);
                  }}>🔒 Lock In My Picks · {parlay?.american}</button>
                : <button className="ios-btn disabled" disabled>{Object.values(picks).filter(v=>v).length+(lsBets.length>=2?1:0)} / 5 Picks Filled</button>
              }
              <div style={{height:20}}/>
            </div>
          </>
        )}

        {/* ══ MATCHUP ══ */}
        {screen==="matchup"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              {/* Header */}
              <div style={{padding:"6px 20px 16px"}}>
                <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>Matchup</div>
                <div style={{fontSize:14,fontWeight:500,color:IOS.label3,marginTop:3}}>Week 6 · The Boys League · Live</div>
              </div>

              {/* Big score card */}
              <div style={{margin:"0 16px 14px",background:IOS.bg2,borderRadius:20,padding:"20px",position:"relative",overflow:"hidden",border:`1px solid rgba(10,132,255,0.25)`}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.teal})`}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,color:IOS.blue}}>YOU</div>
                    <div style={{fontSize:13,color:IOS.label3,marginTop:2}}>7-3 season</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:42,fontWeight:800,letterSpacing:-2,lineHeight:1}}>
                      <span style={{color:IOS.green}}>3</span>
                      <span style={{fontSize:20,color:IOS.label3,fontWeight:400,margin:"0 6px"}}>–</span>
                      <span style={{color:IOS.red}}>1</span>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:IOS.green,marginTop:4}}>● Live</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:26,fontWeight:800,letterSpacing:-0.5}}>Mike D.</div>
                    <div style={{fontSize:13,color:IOS.label3,marginTop:2}}>6-4 season</div>
                  </div>
                </div>
                {/* Score breakdown */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:1,background:"rgba(255,255,255,0.05)",borderRadius:12,overflow:"hidden"}}>
                  {[{n:3,l:"Wins",c:IOS.green},{n:1,l:"Pushes",c:IOS.label3},{n:1,l:"Their Wins",c:IOS.red},{n:2,l:"Pending",c:IOS.blue}].map((s,i)=>(
                    <div key={i} style={{background:IOS.bg3,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,color:s.c}}>{s.n}</div>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:0.3,textTransform:"uppercase",color:IOS.label3,marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pick by pick head to head */}
              <div style={{padding:"0 20px 10px"}}>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Pick by Pick</div>
              </div>

              {[
                {slot:"Moneyline", mult:1, col:IOS.blue,   myPick:"KC Chiefs",         myOdds:"-180", myResult:"W",
                                                            oppPick:"Bills ML",          oppOdds:"-210",oppResult:"W"},
                {slot:"Prop",      mult:2, col:IOS.yellow, myPick:"Mahomes 300+ Yds",   myOdds:"-130", myResult:"W",
                                                            oppPick:"Josh Allen 2+ TDs", oppOdds:"-140",oppResult:"L"},
                {slot:"Over/Under",mult:3, col:IOS.orange, myPick:"Over 47.5",          myOdds:"-110", myResult:"L",
                                                            oppPick:"Under 44",          oppOdds:"-110",oppResult:"W"},
                {slot:"Spread",    mult:4, col:IOS.green,  myPick:"Eagles -3",          myOdds:"-110", myResult:"pending",
                                                            oppPick:"49ers -4.5",        oppOdds:"-110",oppResult:"pending"},
                {slot:"Parlay",    mult:5, col:IOS.pink,   myPick:"Raiders + Cowboys",  myOdds:"+420", myResult:"pending",
                                                            oppPick:"Panthers + Bears",  oppOdds:"+380",oppResult:"pending"},
              ].map((row,i)=>{
                const appliedPU=matchupPUs[i];
                const rColor=r=>r==="W"?IOS.green:r==="L"?IOS.red:IOS.label3;
                const rLabel=r=>r==="W"?"✓ Win":r==="L"?"✗ Loss":"● Pending";
                return (
                  <div key={i} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}>
                    {/* Slot header */}
                    <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:30,height:30,borderRadius:8,background:`${row.col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:row.col}}>{row.mult}×</div>
                        <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:row.col}}>{row.slot}</div>
                      </div>
                      {/* PU button or active badge */}
                      {appliedPU ? (
                        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:7,background:`${appliedPU.color}15`,border:`1px solid ${appliedPU.color}30`}}>
                          <span style={{fontSize:11}}>{appliedPU.icon}</span>
                          <span style={{fontSize:10,fontWeight:700,color:appliedPU.color}}>{appliedPU.name}</span>
                          <span style={{fontSize:10,color:IOS.label3,cursor:"pointer"}} onClick={()=>{setMyPUs(prev=>[...prev,appliedPU]);setMatchupPUs(prev=>{const n={...prev};delete n[i];return n;})}}>✕</span>
                        </div>
                      ) : (row.myResult==="pending"&&myPUs.length>0) ? (
                        <div onClick={()=>setShowPUModal({context:"matchup",pickIdx:i,slotLabel:row.slot})}
                          style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.1)",cursor:"pointer"}}>
                          <span style={{fontSize:11}}>⚡</span>
                          <span style={{fontSize:10,fontWeight:600,color:IOS.label3}}>Power-Up</span>
                        </div>
                      ) : null}
                    </div>
                    {/* Side by side picks */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                      {/* My pick */}
                      <div style={{padding:"12px 14px",borderRight:`0.5px solid ${IOS.sep}`,background:row.myResult==="W"?"rgba(48,209,88,0.04)":row.myResult==="L"?"rgba(255,69,58,0.04)":"transparent"}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:5}}>You</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.3,marginBottom:6}}>{row.myPick}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontSize:14,fontWeight:800,letterSpacing:-0.3,color:row.myOdds.startsWith("+")?IOS.green:IOS.blue}}>{row.myOdds}</div>
                          <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:`${rColor(row.myResult)}15`,color:rColor(row.myResult)}}>{rLabel(row.myResult)}</div>
                        </div>
                      </div>
                      {/* Opp pick */}
                      <div style={{padding:"12px 14px",background:row.oppResult==="W"?"rgba(48,209,88,0.04)":row.oppResult==="L"?"rgba(255,69,58,0.04)":"transparent"}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,marginBottom:5}}>Mike D.</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.3,marginBottom:6}}>{row.oppPick}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontSize:14,fontWeight:800,letterSpacing:-0.3,color:row.oppOdds.startsWith("+")?IOS.green:IOS.blue}}>{row.oppOdds}</div>
                          <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:`${rColor(row.oppResult)}15`,color:rColor(row.oppResult)}}>{rLabel(row.oppResult)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Power-ups inventory reminder */}
              {myPUs.length>0&&(
                <div style={{margin:"4px 16px 16px",background:IOS.bg2,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontSize:16}}>⚡</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{myPUs.length} power-up{myPUs.length>1?"s":""} available</div>
                    <div style={{fontSize:11,color:IOS.label3}}>Use them on pending picks above</div>
                  </div>
                  <div onClick={()=>{setProfTab("power-ups");setScreen("profile");}} style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>View</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ LEAGUES LIST ══ */}
        {screen==="leagues"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              <div style={{padding:"6px 20px 18px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>My Leagues</div>
                  <div style={{fontSize:14,fontWeight:500,color:IOS.label3,marginTop:3}}>{LEAGUES_DATA.length} active leagues</div>
                </div>
                <div style={{background:IOS.blue,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>+ New</div>
              </div>

              {/* League cards */}
              {(realLeagues.length>0?realLeagues:LEAGUES_DATA).map(lg=>{
                const sp = SPORTS[lg.sport];
                const isActive = activeLeagueId === lg.id;
                const myMember = lg.members?.find(m=>m.isYou) || {record: lg.userRecord||"—", roi: lg.userRoi||"—", streak: "—"};
                const pendingPicks = (gradingData[lg.id]||[]).reduce((acc,m)=>acc+m.picks.filter(p=>p.result==="pending").length,0);
                return (
                  <div key={lg.id} style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:20,overflow:"hidden",border:`1px solid ${isActive?sp.color+"50":"rgba(255,255,255,0.07)"}`,cursor:"pointer"}}
                    onClick={()=>{setActiveLeagueId(lg.id);setPicks({ml:null,prop:null,ou:null,spread:null});setLsBets([]);}}>
                    {/* Sport accent bar */}
                    <div style={{height:3,background:`linear-gradient(90deg,${sp.color},${sp.color}80)`}}/>
                    <div style={{padding:"16px 18px"}}>
                      {/* Top row */}
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontSize:18}}>{sp.icon}</span>
                            <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5,color:"#fff"}}>{lg.name}</div>
                          </div>
                          <div style={{fontSize:12,color:IOS.label3}}>{sp.label} · Wk {lg.current_week||lg.week||1} · {lg.members?.length||lg.max_members||"?"} members</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                          {lg.isCommissioner&&<div style={{background:"rgba(255,214,10,0.15)",border:"1px solid rgba(255,214,10,0.3)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:IOS.yellow}}>⚙️ COMMISH</div>}
                          {isActive&&<div style={{background:`${sp.color}20`,border:`1px solid ${sp.color}40`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:sp.color}}>● ACTIVE</div>}
                        </div>
                      </div>
                      {/* Stats row */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:"rgba(255,255,255,0.05)",borderRadius:10,overflow:"hidden",marginBottom:12}}>
                        {[{l:"Record",v:myMember?.record,c:sp.color},{l:"ROI",v:myMember?.roi,c:IOS.green},{l:"Streak",v:myMember?.streak,c:myMember?.streak?.startsWith("W")?IOS.green:IOS.red}].map((s,i)=>(
                          <div key={i} style={{background:IOS.bg3,padding:"10px 8px",textAlign:"center"}}>
                            <div style={{fontSize:16,fontWeight:800,letterSpacing:-0.3,color:s.c,marginBottom:2}}>{s.v}</div>
                            <div style={{fontSize:9,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      {/* Bottom row */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:12,color:IOS.label3}}>vs {lg.opponent||"TBD"} this week</div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          {pendingPicks>0&&lg.isCommissioner&&(
                            <div style={{background:"rgba(255,159,10,0.15)",border:"1px solid rgba(255,159,10,0.3)",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,color:IOS.orange}}>{pendingPicks} to grade</div>
                          )}
                          <div onClick={e=>{e.stopPropagation();setActiveLeagueId(lg.id);setScreen(lg.isCommissioner?"commissioner":"league");}} style={{background:IOS.fill2,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>
                            {lg.isCommissioner?"Commish ⚙️":"View →"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Join league */}
              <div onClick={async()=>{
                const code=prompt("Enter invite code:");
                if(!code) return;
                const {data:league,error}=await supabase.from("leagues").select().eq("invite_code",code.toUpperCase().trim()).single();
                if(error||!league){alert("League not found. Check the code and try again.");return;}
                const {error:joinError}=await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
                if(joinError){alert("Error joining. You may already be a member.");return;}
                alert(`Joined ${league.name}! Welcome.`);
                fetchLeagues(user.id);
              }} style={{margin:"4px 16px 16px",background:IOS.bg2,borderRadius:16,padding:"16px 18px",border:"1.5px dashed rgba(255,255,255,0.1)",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🔗</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2}}>Join a League</div>
                  <div style={{fontSize:12,color:IOS.label3}}>Enter an invite code from a friend</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ COMMISSIONER ══ */}
        {screen==="commissioner"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              {/* Header */}
              <div style={{padding:"6px 20px 0",display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <button onClick={()=>setScreen("leagues")} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                <div>
                  <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.3,color:"#fff"}}>{activeLeague.name}</div>
                  <div style={{fontSize:12,color:IOS.yellow}}>⚙️ Commissioner Panel</div>
                </div>
              </div>

              {/* Commish tabs */}
              <div style={{display:"flex",background:IOS.bg3,borderRadius:12,padding:2,margin:"0 16px 16px",gap:2}}>
                {[{id:"grade",l:"Grade Picks"},{id:"members",l:"Members"},{id:"settings",l:"Settings"}].map(t=>(
                  <div key={t.id} onClick={()=>setCommishTab(t.id)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",background:commishTab===t.id?IOS.bg2:"transparent",color:commishTab===t.id?"#fff":IOS.label3,boxShadow:commishTab===t.id?"0 1px 3px rgba(0,0,0,0.4)":"none"}}>{t.l}</div>
                ))}
              </div>

              {/* GRADE PICKS tab */}
              {commishTab==="grade"&&(
                <>
                  <div style={{padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Week {activeLeague.current_week||activeLeague.week||1} · All Picks</div>
                    <div style={{fontSize:12,color:IOS.orange,fontWeight:600}}>{weekPicks.filter(p=>p.result==="pending").length} pending</div>
                  </div>

                  {weekPicks.length===0&&(
                    <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,padding:"24px 16px",textAlign:"center",color:IOS.label3,fontSize:15}}>
                      No picks submitted yet this week
                    </div>
                  )}

                  {/* Group picks by user */}
                  {Object.entries(weekPicks.reduce((acc,p)=>{
                    const uid = p.user_id;
                    if(!acc[uid]) acc[uid]={userId:uid, name:p.users?.username||p.users?.email?.split("@")[0]||"Unknown", picks:[]};
                    acc[uid].picks.push(p);
                    return acc;
                  },{})).map(([uid, memberData])=>{
                    const slotColors={ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};
                    const memberTotal = memberData.picks.filter(p=>p.result==="W").reduce((sum,p)=>{
                      const dec = p.implied_odds ? (p.implied_odds>0?p.implied_odds/100:100/Math.abs(p.implied_odds)) : 0.91;
                      return sum + parseFloat((p.multiplier*dec*10).toFixed(1));
                    },0).toFixed(1);
                    const isYou = uid === user?.id;
                    return (
                      <div key={uid} style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
                        <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.02)"}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:isYou?IOS.blue:"#fff"}}>{memberData.name}{isYou?" (You)":""}</div>
                            <div style={{fontSize:11,color:IOS.label3,marginTop:1}}>Wk {activeLeague.current_week||1} · {memberData.picks.filter(p=>p.result!=="pending").length}/{memberData.picks.length} graded</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:800,color:IOS.green,letterSpacing:-0.3}}>{memberTotal}pts</div>
                            <div style={{fontSize:10,color:IOS.label3}}>so far</div>
                          </div>
                        </div>
                        {memberData.picks.map((pick,pIdx)=>{
                          const col=slotColors[pick.slot]||IOS.blue;
                          const isPending=pick.result==="pending";
                          return (
                            <div key={pick.id} style={{padding:"11px 14px",borderBottom:pIdx<memberData.picks.length-1?`0.5px solid ${IOS.sep}`:"none",background:isPending?"rgba(255,159,10,0.03)":"transparent"}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                                    <div style={{fontSize:10,fontWeight:700,color:col,background:`${col}15`,padding:"1px 6px",borderRadius:4}}>{pick.multiplier}× {pick.slot}</div>
                                    {isPending&&<div style={{fontSize:9,fontWeight:700,color:IOS.orange,background:"rgba(255,159,10,0.12)",padding:"1px 6px",borderRadius:4}}>PENDING</div>}
                                  </div>
                                  <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>{pick.pick_name}</div>
                                  <div style={{fontSize:11,color:IOS.label3}}>{pick.odds}</div>
                                </div>
                                <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:10}}>
                                  <button onClick={async()=>{
                                    const pts = parseFloat((pick.multiplier*(pick.implied_odds>0?pick.implied_odds/100:100/Math.abs(pick.implied_odds||110))*10).toFixed(1));
                                    await supabase.from("picks").update({result:"W",points_earned:pts}).eq("id",pick.id);
                                    setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"W",points_earned:pts}:p));
                                  }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="W"?IOS.green:"rgba(48,209,88,0.12)",color:pick.result==="W"?"#000":IOS.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Win</button>
                                  <button onClick={async()=>{
                                    await supabase.from("picks").update({result:"L",points_earned:0}).eq("id",pick.id);
                                    setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"L",points_earned:0}:p));
                                  }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="L"?IOS.red:"rgba(255,69,58,0.12)",color:pick.result==="L"?"#fff":IOS.red,fontSize:12,fontWeight:700,cursor:"pointer"}}>✗ Loss</button>
                                  {pick.result!=="pending"&&(
                                    <button onClick={async()=>{
                                      await supabase.from("picks").update({result:"pending",points_earned:0}).eq("id",pick.id);
                                      setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"pending",points_earned:0}:p));
                                    }} style={{padding:"7px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:IOS.label3,fontSize:12,fontWeight:700,cursor:"pointer"}}>↩</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {/* MEMBERS tab */}
              {commishTab==="members"&&(
                <>
                  <div style={{padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>{leagueMembers.length} / {activeLeague.max_members||activeLeague.settings?.maxMembers||8} members</div>
                    <div style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>+ Invite</div>
                  </div>
                  <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,overflow:"hidden"}}>
                    {(leagueMembers.length ? leagueMembers : activeLeague.members||[]).map((m,i,arr)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",padding:"13px 16px",borderBottom:i<arr.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
                        <div style={{width:36,height:36,borderRadius:50,background:m.isYou?`linear-gradient(135deg,${IOS.blue},${IOS.indigo})`:`linear-gradient(135deg,${IOS.bg3},${IOS.gray3})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",marginRight:12,flexShrink:0}}>{(m.name||"?")[0]}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{fontSize:15,fontWeight:600,color:m.isYou?IOS.blue:"#fff"}}>{m.name||m.email||"Unknown"}{m.isYou?" (You)":""}</div>
                            {m.isCommissioner&&<div style={{fontSize:9,fontWeight:700,color:IOS.yellow,background:"rgba(255,214,10,0.12)",padding:"1px 6px",borderRadius:4}}>COMMISH</div>}
                          </div>
                          <div style={{fontSize:12,color:IOS.label3,marginTop:1}}>{m.record||m.email||""}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:700,color:IOS.label2,letterSpacing:-0.3}}>{m.units||"—"}</div>
                          <div style={{fontSize:11,color:IOS.label3}}>{m.roi||""}</div>
                        </div>
                        {!m.isYou&&!m.isCommissioner&&(
                          <div style={{marginLeft:10,fontSize:18,color:IOS.label3}}>⋯</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Invite code */}
                  <div style={{margin:"12px 16px",background:"rgba(10,132,255,0.08)",borderRadius:14,padding:"14px 16px",border:`1px solid ${IOS.blue}30`}}>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:IOS.blue,marginBottom:6}}>Invite Code</div>
                    <div style={{fontSize:28,fontWeight:800,letterSpacing:4,color:"#fff",marginBottom:6}}>{activeLeague.inviteCode||activeLeague.invite_code}</div>
                    <div style={{fontSize:12,color:IOS.label3}}>Share this code with friends to join</div>
                  </div>
                </>
              )}

              {/* SETTINGS tab */}
              {commishTab==="settings"&&(
                <>
                  <div style={{padding:"0 20px 10px"}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>League Settings</div>
                  </div>

                  {/* Changeable settings */}
                  <div style={{margin:"0 16px 10px"}}>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:IOS.green,padding:"0 4px",marginBottom:6}}>✓ Can Change Mid-Season</div>
                    <div style={{background:IOS.bg2,borderRadius:14,overflow:"hidden"}}>
                      {[
                        {l:"League Name",     v:activeLeague.name,                   editable:true  },
                        {l:"Pick Deadline",   v:activeLeague.settings.pickDeadline,  editable:true  },
                        {l:"Privacy",         v:activeLeague.settings.privacy,       editable:true  },
                      ].map((s,i,arr)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:i<arr.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,color:IOS.label3,marginBottom:2}}>{s.l}</div>
                            <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{s.v}</div>
                          </div>
                          <div style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Edit</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Locked settings */}
                  <div style={{margin:"0 16px 10px"}}>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:IOS.red,padding:"0 4px",marginBottom:6}}>🔒 Locked for Season</div>
                    <div style={{background:IOS.bg2,borderRadius:14,overflow:"hidden"}}>
                      {[
                        {l:"Sport",         v:`${SPORTS[activeLeague.sport].icon} ${SPORTS[activeLeague.sport].label}`},
                        {l:"Scoring System",v:"Multiplier × Odds"},
                        {l:"Season Length", v:`${activeLeague.settings.seasonWeeks} weeks`},
                        {l:"Max Members",   v:activeLeague.settings.maxMembers},
                      ].map((s,i,arr)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderBottom:i<arr.length-1?`0.5px solid ${IOS.sep}`:"none",opacity:0.6}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,color:IOS.label3,marginBottom:2}}>{s.l}</div>
                            <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{s.v}</div>
                          </div>
                          <div style={{fontSize:16}}>🔒</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div style={{margin:"4px 16px 24px"}}>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:IOS.red,padding:"0 4px",marginBottom:6}}>Danger Zone</div>
                    <div style={{background:IOS.bg2,borderRadius:14,overflow:"hidden"}}>
                      <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                        <div style={{fontSize:15,fontWeight:600,color:IOS.orange}}>Pause Season</div>
                        <div style={{fontSize:16,color:IOS.label3}}>›</div>
                      </div>
                      <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                        <div style={{fontSize:15,fontWeight:600,color:IOS.red}}>End League</div>
                        <div style={{fontSize:16,color:IOS.label3}}>›</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ══ LEAGUE ══ */}
        {screen==="league"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              <div style={{padding:"0 20px 12px"}}>
                <div className="nav-title-large">The Boys</div>
                <div className="nav-subtitle">2024 NFL · 8 members · Week 6</div>
              </div>

              {/* Tabs */}
              <div className="seg-control" style={{marginBottom:14}}>
                {["standings","schedule"].map(t=><div key={t} className={`seg-item ${leagueTab===t?"on":""}`} onClick={()=>setLeagueTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
              </div>

              {leagueTab==="standings"&&(
                <>
                  {/* Hero */}
                  <div className="league-hero">
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.indigo})`}}/>
                    <div className="lh-rank">🏆 Your Rank — #2 of 8</div>
                    <div className="lh-name">You</div>
                    <div className="lh-stats">
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.blue}}>7-3</div><div className="lh-stat-lbl">Record</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>+18%</div><div className="lh-stat-lbl">ROI</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>+12.5u</div><div className="lh-stat-lbl">Units</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>W3</div><div className="lh-stat-lbl">Streak</div></div>
                    </div>
                  </div>

                  {/* Sort */}
                  <div style={{margin:"10px 0 6px"}}>
                    <div className="sort-scroll">
                      {[{id:"rank",l:"Rank"},{id:"units",l:"Units"},{id:"roi",l:"ROI"},{id:"wpct",l:"Win %"}].map(s=><div key={s.id} className={`sort-pill ${sortBy===s.id?"on":""}`} onClick={()=>setSortBy(s.id)}>{s.l}</div>)}
                    </div>
                  </div>

                  <div className="standings-card">
                    {sorted.map((row,i)=>{
                      const isMe=row.name==="Joe";const isExp=expanded===row.rank;const dr=sortBy==="rank"?row.rank:i+1;
                      return (
                        <div key={row.rank}>
                          <div className={`st-row ${isMe?"me":""}`} onClick={()=>setExpanded(isExp?null:row.rank)}>
                            <div className="st-rank">{dr<=3?rankMedal(dr):dr}</div>
                            <div className="st-info">
                              <div className={`st-name ${isMe?"me":""}`}>{isMe?"You ✦":row.name}</div>
                              <div className="st-streak" style={{color:row.streak.startsWith("W")?IOS.green:IOS.red}}>{row.streak.startsWith("W")?"↑":"↓"} {row.streak} · {row.wpct} win rate</div>
                            </div>
                            <div className="st-rec">{row.record}</div>
                            <div className={`st-units ${row.units.startsWith("+")?"pos":"neg"}`}>{row.units}u</div>
                          </div>
                          {isExp&&(
                            <div className="expand-row">
                              <div className="expand-inner">
                                <div className="exp-stat-row">
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:row.roi.startsWith("+")?IOS.green:IOS.red}}>{row.roi}</div><div className="exp-stat-lbl">ROI</div></div>
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:IOS.blue}}>{row.wpct}</div><div className="exp-stat-lbl">Win %</div></div>
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:row.units.startsWith("+")?IOS.green:IOS.red}}>{row.units}u</div><div className="exp-stat-lbl">Units</div></div>
                                </div>
                                <div style={{fontSize:12,color:IOS.label3,fontWeight:500,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Weekly Results</div>
                                <div className="wk-row">{row.wr.map((r,i)=><div key={i} className={`wk-dot ${r==="-"?"d":r}`}>{r==="-"?"·":r}</div>)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{height:16}}/>
                </>
              )}

              {leagueTab==="schedule"&&(
                <>
                {/* Matchup detail overlay */}
                {selectedMatchup && (()=>{
                  const m = MATCHUP_HISTORY.find(x=>x.week===selectedMatchup);
                  if(!m) return null;
                  const slotColors = {Moneyline:IOS.blue, Prop:IOS.yellow, "Over/Under":IOS.orange, Spread:IOS.green, Parlay:IOS.pink};
                  const myTotal = parseFloat(calcMatchupScore(m.myPicks));
                  const oppTotal = parseFloat(calcMatchupScore(m.oppPicks));
                  return (
                    <div style={{position:"absolute",inset:0,background:IOS.bg,zIndex:30,overflowY:"auto",paddingBottom:40}}>
                      {/* Header */}
                      <div style={{padding:"52px 20px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <button onClick={()=>setSelectedMatchup(null)} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                          <div style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>Week {m.week} · {m.opp}</div>
                        </div>
                        {/* Score card with POINTS */}
                        <div style={{background:IOS.bg2,borderRadius:16,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:m.result==="W"?`linear-gradient(90deg,${IOS.green},${IOS.teal})`:`linear-gradient(90deg,${IOS.red},${IOS.orange})`}}/>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                            <div>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:IOS.blue}}>You</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {m.week}</div>
                            </div>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:m.result==="W"?IOS.green:IOS.red}}>{myTotal} <span style={{fontSize:18,color:IOS.label3,fontWeight:400}}>–</span> {oppTotal}</div>
                              <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:m.result==="W"?IOS.green:IOS.red,marginTop:2}}>{m.result==="W"?"Victory":"Defeat"}</div>
                              <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>pts</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{m.opp}</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {m.week}</div>
                            </div>
                          </div>
                          {/* Scoring formula note */}
                          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px",fontSize:11,color:IOS.label3}}>
                            Points = Slot Multiplier × Odds Decimal · 0 for losses
                          </div>
                        </div>
                      </div>

                      {/* Pick by pick */}
                      <div style={{padding:"16px 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Pick by Pick</div>
                        <div style={{display:"flex",gap:16}}>
                          <div style={{fontSize:11,fontWeight:700,color:IOS.blue}}>You: {myTotal}pts</div>
                          <div style={{fontSize:11,color:IOS.label3}}>{m.opp}: {oppTotal}pts</div>
                        </div>
                      </div>

                      {m.myPicks.map((myP, i)=>{
                        const oppP = m.oppPicks[i];
                        const col = slotColors[myP.slot]||IOS.blue;
                        const myPts = calcPickPoints(myP.mult, myP.impliedOdds||0, myP.result);
                        const oppPts = calcPickPoints(oppP.mult, oppP.impliedOdds||0, oppP.result);
                        const maxPts = (myP.mult * (myP.impliedOdds > 0 ? myP.impliedOdds/100 : 100/Math.abs(myP.impliedOdds||110))).toFixed(2);
                        return (
                          <div key={i} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}>
                            {/* Slot header */}
                            <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:28,height:28,borderRadius:8,background:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:col}}>{myP.mult}×</div>
                                <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:col}}>{myP.slot}</div>
                              </div>
                              <div style={{fontSize:10,color:IOS.label3}}>Max {maxPts} pts available</div>
                            </div>
                            {/* Side by side */}
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                              {/* Your pick */}
                              <div style={{padding:"12px 14px",borderRight:`0.5px solid ${IOS.sep}`,background:myP.result==="W"?"rgba(48,209,88,0.05)":"rgba(255,69,58,0.04)"}}>
                                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:5}}>You</div>
                                <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:6,lineHeight:1.3}}>{myP.pick}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                                  <div style={{fontSize:13,fontWeight:800,letterSpacing:-0.3,color:myP.odds.startsWith("+")?IOS.green:IOS.blue}}>{myP.odds}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                                    <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:myP.result==="W"?"rgba(48,209,88,0.15)":"rgba(255,69,58,0.15)",color:myP.result==="W"?IOS.green:IOS.red}}>{myP.result==="W"?"✓ Win":"✗ Loss"}</div>
                                    {myPts>0&&<div style={{fontSize:11,fontWeight:800,color:IOS.green}}>+{myPts}pt</div>}
                                    {myPts===0&&myP.result==="L"&&<div style={{fontSize:11,fontWeight:700,color:IOS.red}}>0pt</div>}
                                  </div>
                                </div>
                              </div>
                              {/* Opp pick */}
                              <div style={{padding:"12px 14px",background:oppP.result==="W"?"rgba(48,209,88,0.05)":"rgba(255,69,58,0.04)"}}>
                                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,marginBottom:5}}>{m.opp}</div>
                                <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:6,lineHeight:1.3}}>{oppP.pick}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                                  <div style={{fontSize:13,fontWeight:800,letterSpacing:-0.3,color:oppP.odds.startsWith("+")?IOS.green:IOS.blue}}>{oppP.odds}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                                    <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:oppP.result==="W"?"rgba(48,209,88,0.15)":"rgba(255,69,58,0.15)",color:oppP.result==="W"?IOS.green:IOS.red}}>{oppP.result==="W"?"✓ Win":"✗ Loss"}</div>
                                    {oppPts>0&&<div style={{fontSize:11,fontWeight:800,color:IOS.green}}>+{oppPts}pt</div>}
                                    {oppPts===0&&oppP.result==="L"&&<div style={{fontSize:11,fontWeight:700,color:IOS.red}}>0pt</div>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Final score summary */}
                      <div style={{margin:"4px 16px 16px",background:m.result==="W"?"rgba(48,209,88,0.08)":"rgba(255,69,58,0.08)",borderRadius:12,padding:"14px 16px",border:`1px solid ${m.result==="W"?"rgba(48,209,88,0.25)":"rgba(255,69,58,0.25)"}`}}>
                        <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:m.result==="W"?IOS.green:IOS.red,marginBottom:8}}>{m.result==="W"?"You Won This Week":"You Lost This Week"}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:28,fontWeight:800,letterSpacing:-1,color:IOS.blue}}>{myTotal} pts</div>
                            <div style={{fontSize:11,color:IOS.label3}}>Your score</div>
                          </div>
                          <div style={{fontSize:24,color:IOS.label3}}>vs</div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:28,fontWeight:800,letterSpacing:-1,color:IOS.label2}}>{oppTotal} pts</div>
                            <div style={{fontSize:11,color:IOS.label3}}>{m.opp}'s score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px",overflow:"hidden"}}>
                  {SCHEDULE.map(wk=>{
                    const live=wk.result==="live";const done=wk.result==="W"||wk.result==="L";
                    const hasMH = MATCHUP_HISTORY.find(x=>x.week===wk.week);
                    const myPts = hasMH ? parseFloat(calcMatchupScore(hasMH.myPicks)) : null;
                    const oppPts = hasMH ? parseFloat(calcMatchupScore(hasMH.oppPicks)) : null;
                    return (
                      <div key={wk.week} className="sch-item"
                        style={{...(live?{background:"rgba(10,132,255,0.06)"}:{}), ...(done?{cursor:"pointer"}:{})}}
                        onClick={()=>done&&hasMH&&setSelectedMatchup(wk.week)}
                      >
                        <div className={`sch-wk ${live?"live":""}`}>W{wk.week}</div>
                        <div className={`sch-opp ${live?"live":done?"done":"up"}`}>{live&&<span style={{color:IOS.blue,marginRight:6}}>●</span>}vs {wk.opp}</div>
                        <div className="sch-score" style={{width:60,fontSize:12}}>
                          {done&&myPts!==null?<span style={{color:wk.result==="W"?IOS.green:IOS.red,fontWeight:700}}>{myPts}–{oppPts}</span>:live?"Live":"—"}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className={`sch-badge ${wk.result==="live"?"live":wk.result==="upcoming"?"up":wk.result}`}>{wk.result==="live"?"LIVE":wk.result==="upcoming"?"—":wk.result}</div>
                          {done&&hasMH&&<div style={{fontSize:16,color:IOS.label3}}>›</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ══ CHAT ══ */}
        {screen==="chat"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div style={{padding:"0 20px 12px"}}>
              <div className="nav-title-large">The Boys</div>
              <div className="nav-subtitle">8 members · 6 online</div>
            </div>
            <div className="chat-bg">
              <div className="chat-msgs" ref={chatRef} style={{paddingBottom:12}}>
                <div className="date-sep"><span>Today</span></div>
                {messages.map(msg=>(
                  <div key={msg.id} className={`msg-group ${msg.me?"me":""}`}>
                    {!msg.me&&<div className="msg-av" style={{background:acColor(msg.init)}}>{msg.init}</div>}
                    <div className="msg-col">
                      {!msg.me&&<div className="msg-sender">{msg.user}</div>}
                      <div className={`bubble ${msg.me?"me":"them"}`}>{msg.text}</div>
                      <div className="msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-bar">
                <input className="chat-field" placeholder="Message..." value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                <button className="chat-send" disabled={!chatMsg.trim()} onClick={sendMsg}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ══ PROFILE ══ */}
        {screen==="profile"&&(
          <>
            <div className="status-bar">
              <div className="status-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</div>
              <div className="status-icons"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
            </div>
            <div className="body">
              <div className="prof-av-wrap">
                <div className="prof-av">J</div>
                <div>
                  <div className="prof-name">Joe</div>
                  <div className="prof-league">The Boys League</div>
                  <div className="prof-rank-pill"><span>🥈</span><span className="prof-rank-txt">#2 of 8 · W3 streak</span></div>
                </div>
              </div>

              <div className="seg-control">
                {["stats","trophies","power-ups"].map(t=><div key={t} className={`seg-item ${profTab===t?"on":""}`} onClick={()=>setProfTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
              </div>

              {profTab==="stats"&&(
                <>
                  <div className="stat-pills" style={{marginBottom:10}}>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.blue}}>7-3</div><div className="stat-pill-lbl">Record</div></div>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>+18.4%</div><div className="stat-pill-lbl">ROI</div></div>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>+12.5u</div><div className="stat-pill-lbl">Units</div></div>
                  </div>
                  <div className="unit-chart-card">
                    <div className="uc-header"><span className="uc-title">Units by Week</span><span className="uc-total">+12.5u total</span></div>
                    <div className="uc-bars">
                      {[3.5,2.0,-1.5,4.0,-2.0,6.5].map((u,i)=>{const h=Math.max(8,Math.abs(u)/6.5*56);return(<div key={i} className="uc-bar-wrap"><div className="uc-bar" style={{height:h,background:u>=0?IOS.green:IOS.red,opacity:0.7}}/><div className="uc-bar-lbl">W{i+1}</div></div>);})}
                    </div>
                  </div>
                  <div className="perf-grid">
                    <div className="perf-card"><div className="perf-lbl">Best Bet</div><div className="perf-val" style={{color:IOS.green}}>Eagles ML</div></div>
                    <div className="perf-card"><div className="perf-lbl">Worst Bet</div><div className="perf-val" style={{color:IOS.red}}>Cowboys +7</div></div>
                  </div>
                  <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,overflow:"hidden"}}>
                    {[["Total Bets","50"],["Wins","7",IOS.green],["Losses","3",IOS.red],["Pushes","3",""],["Win Rate","70%",IOS.blue],["Best Streak","W5",IOS.green]].map(([l,v,c],i,arr)=>(
                      <div key={l} className="ios-row" style={i===arr.length-1?{paddingBottom:13}:{}}>
                        <div className="ios-row-content"><div className="ios-row-title" style={{fontSize:15}}>{l}</div></div>
                        <div className="ios-row-value" style={{fontSize:15,fontWeight:600,color:c||"#fff"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:20}}/>
                </>
              )}

              {profTab==="trophies"&&(
                <div style={{paddingBottom:24}}>
                  <div style={{padding:"14px 20px 8px"}}>
                    <div style={{fontSize:15,color:IOS.label3}}>You hold 2 trophies this season</div>
                  </div>
                  {TROPHIES.map(t=>(
                    <div key={t.id} className="trophy-card" style={t.yours?{borderWidth:1,borderStyle:"solid",borderColor:`${t.color}30`}:{}}>
                      {t.yours&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:t.color,borderRadius:"14px 0 0 14px"}}/>}
                      <div className="trophy-icon-bg" style={{background:`${t.color}15`,border:`1px solid ${t.color}20`}}>{t.icon}</div>
                      <div style={{flex:1}}>
                        <div className="trophy-name" style={{color:t.yours?t.color:"#fff"}}>{t.name}</div>
                        <div className="trophy-desc">{t.desc}</div>
                        <div className="trophy-holder" style={{color:t.yours?t.color:IOS.label3}}>{t.holder==="???"?"Awarded at season end":t.yours?"✦ Currently yours":`Held by ${t.holder}`}</div>
                      </div>
                      {t.yours&&<div className="trophy-mine-pill">YOURS</div>}
                    </div>
                  ))}
                </div>
              )}

              {profTab==="power-ups"&&(
                <div style={{paddingBottom:24}}>
                  <div style={{padding:"14px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:15,color:IOS.label3}}>{myPUs.length}/3 slots used</div>
                    <button onClick={()=>setShowWheel(true)} style={{background:`linear-gradient(135deg,${IOS.indigo},${IOS.purple})`,border:"none",borderRadius:10,padding:"8px 16px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer"}}>🎰 Spin Wheel</button>
                  </div>
                  {myPUs.length===0
                    ? <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,padding:24,textAlign:"center",color:IOS.label3,fontSize:15}}>No power-ups yet. Win a week to spin.</div>
                    : myPUs.map((pu,i)=>(
                        <div key={i} className="pu-card" style={{borderWidth:1,borderStyle:"solid",borderColor:`${pu.color}30`}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:pu.color}}/>
                          <div className="pu-card-icon" style={{background:`${pu.color}15`}}>{pu.icon}</div>
                          <div style={{flex:1}}>
                            <div className="pu-card-rarity" style={{color:rarityColor(pu.rarity)}}>{pu.rarity}</div>
                            <div className="pu-card-name">{pu.name}</div>
                            <div className="pu-card-desc">{pu.desc}</div>
                          </div>
                          <button className="pu-use-btn">Use</button>
                        </div>
                      ))
                  }
                  <div style={{padding:"14px 20px 8px"}}><div style={{fontSize:13,fontWeight:600,color:IOS.label3,textTransform:"uppercase",letterSpacing:0.5}}>All Power-Ups</div></div>
                  {POWER_UPS.map(pu=>(
                    <div key={pu.id} style={{display:"flex",alignItems:"center",padding:"12px 16px",margin:"0 16px 6px",background:IOS.bg2,borderRadius:12,gap:12}}>
                      <div style={{width:38,height:38,borderRadius:10,background:`${pu.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{pu.icon}</div>
                      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2}}>{pu.name}</div><div style={{fontSize:12,color:IOS.label3}}>{pu.desc}</div></div>
                      <div style={{fontSize:10,fontWeight:700,color:rarityColor(pu.rarity),background:`${rarityColor(pu.rarity)}15`,border:`1px solid ${rarityColor(pu.rarity)}30`,padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{pu.rarity}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ TAB BAR ══ */}
        <div className="tab-bar">
          {[
            {icon:"⚡",label:"Home",    id:"home"},
            {icon:"🎯",label:"Picks",   id:"picks"},
            {icon:"🏈",label:"Matchup", id:"matchup"},
            {icon:"🏆",label:"Leagues", id:"leagues"},
            {icon:"👤",label:"Profile", id:"profile"},
          ].map(t=>(
            <div key={t.id} className={`tab-item ${screen===t.id?"on":""}`} onClick={()=>setScreen(t.id)}>
              <div className="tab-icon" style={{filter:screen===t.id?"none":"grayscale(1) opacity(0.5)"}}>{t.icon}</div>
              <div className="tab-label" style={screen===t.id?{color:IOS.blue}:{}}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}