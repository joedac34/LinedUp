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
  { id:"steal",    icon:"🔀", name:"Pick Steal",      desc:"See one opponent's locked lineup",       rarity:"rare",      color:IOS.purple, type:"defensive" },
  { id:"enhance",  icon:"📈", name:"Spread Enhancer", desc:"Move any spread 1.5pts in your favor",   rarity:"rare",      color:IOS.blue,   type:"offensive" },
  { id:"insurance",icon:"🛡️", name:"Insurance",       desc:"Lose by 1 leg? Counts as a push",        rarity:"common",    color:IOS.green,  type:"offensive" },
  { id:"lock",     icon:"🔒", name:"Lock It In",      desc:"Force opponent — no lineup changes",      rarity:"rare",      color:IOS.orange, type:"defensive" },
  { id:"double",   icon:"2️⃣", name:"Double Down",     desc:"One pick counts double this week",        rarity:"common",    color:IOS.yellow, type:"offensive" },
  { id:"peek",     icon:"👁️", name:"Peek",            desc:"See what % of league took each bet",      rarity:"common",    color:IOS.teal,   type:"defensive" },
  { id:"bomb",     icon:"💣", name:"Bomb",            desc:"Nullify one of opponent's winning picks", rarity:"legendary", color:IOS.red,    type:"defensive" },
  { id:"swap",     icon:"🔄", name:"Hot Swap",        desc:"Swap a losing pick after games start",    rarity:"legendary", color:IOS.pink,   type:"offensive" },
  { id:"wildcard", icon:"⭐", name:"Wildcard",        desc:"Play any bet — no slot rules",            rarity:"rare",      color:IOS.purple, type:"offensive" },
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


const MATCHUP_HISTORY = []; // replaced by real Supabase data
const _UNUSED_MH = [
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

const GAPER_MEMBERS = ["joe", "mlaforte", "esoumekhian", "dyaffe", "aweinstock", "Player6"];

const SCHEDULE = []; // replaced by real Supabase data
const _UNUSED_SCHEDULE = [
  { week:1,  opp:"mlaforte",    ms:null, os:null, result:"live" },
  { week:2,  opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
  { week:3,  opp:"dyaffe",      ms:null, os:null, result:"upcoming" },
  { week:4,  opp:"aweinstock",  ms:null, os:null, result:"upcoming" },
  { week:5,  opp:"Player6",     ms:null, os:null, result:"upcoming" },
  { week:6,  opp:"mlaforte",    ms:null, os:null, result:"upcoming" },
  { week:7,  opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
  { week:8,  opp:"dyaffe",      ms:null, os:null, result:"upcoming" },
  { week:9,  opp:"aweinstock",  ms:null, os:null, result:"upcoming" },
  { week:10, opp:"Player6",     ms:null, os:null, result:"upcoming" },
  { week:11, opp:"mlaforte",    ms:null, os:null, result:"upcoming" },
  { week:12, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
  { week:13, opp:"dyaffe",      ms:null, os:null, result:"upcoming" },
  { week:14, opp:"aweinstock",  ms:null, os:null, result:"upcoming" },
  { week:15, opp:"Player6",     ms:null, os:null, result:"upcoming" },
  { week:16, opp:"mlaforte",    ms:null, os:null, result:"upcoming" },
  { week:17, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
  { week:18, opp:"dyaffe",      ms:null, os:null, result:"upcoming" },
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
  const [tutorialStep, setTutorialStep] = useState(-1); // -1 = hidden; only shown on fresh signup
  const dismissTutorial = () => {
    try { localStorage.setItem('picklock_tutorial_done','1'); } catch {}
    setTutorialStep(-1);
  };
  const [user,        setUser]        = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { username, email }
  const [editingUsername, setEditingUsername] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [usernamePromptInput, setUsernamePromptInput] = useState("");
  const [usernamePromptError, setUsernamePromptError] = useState("");
  const [usernamePromptSaving, setUsernamePromptSaving] = useState(false);
  const [usernameInput,   setUsernameInput]   = useState("");
  const [usernameSaving,  setUsernameSaving]  = useState(false);
  const [usernameError,   setUsernameError]   = useState("");
  const [authScreen,  setAuthScreen]  = useState("login");
  const [anim,        setAnim]        = useState(false);
  const [timeLeft,    setTimeLeft]    = useState({h:0,m:0,s:0});
  const [submitted,   setSubmitted]   = useState(false);
  const [leagueTab,   setLeagueTab]   = useState("standings");
  const [expanded,    setExpanded]    = useState(null);
  const [sortBy,      setSortBy]      = useState("rank");
  const [chatMsg,     setChatMsg]     = useState("");
  const [messages,    setMessages]    = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeLeagueId, setActiveLeagueId] = useState("lg1");
  const [realLeagues,    setRealLeagues]    = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [leagueMembers,  setLeagueMembers]  = useState([]);
  const [weekPicks,      setWeekPicks]      = useState([]);
  const [liveSchedule,   setLiveSchedule]   = useState([]);
  const [realStandings,  setRealStandings]  = useState([]);
  const [allMyStats,     setAllMyStats]     = useState(null);
  const [leagueTrophies, setLeagueTrophies] = useState([]);
  const activeLeague = [...realLeagues].find(l=>l.id===activeLeagueId) || realLeagues[0] || {id:"",name:"",sport:"nfl",current_week:1,season_weeks:18,max_members:8,target_size:8,isCommissioner:false};
  const sport = SPORTS[activeLeague?.sport] || SPORTS["nfl"];
  const SLOTS = sport.slots;

  // ─── LIVE ODDS STATE ─────────────────────────────────────────────
  const [liveOdds,    setLiveOdds]    = useState({}); // { sportId: {ml,prop,ou,spread,longshot} }
  const [tickerGames, setTickerGames] = useState([]); // raw games for the ticker
  const [espnGames,   setEspnGames]   = useState([]); // ESPN scoreboard with IDs
  const [weekResult,  setWeekResult]  = useState(null); // {won, myPts, oppPts, oppName, week}
  const [gameSheet,   setGameSheet]   = useState(null); // { tickerGame, espnGame, detail }
  const [gameLoading, setGameLoading] = useState(false);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsError,   setOddsError]   = useState(false);
  // oddsLastFetched persisted in localStorage so cache survives page refreshes

  const SPORT_KEYS = { nfl:"americanfootball_nfl", nba:"basketball_nba", mlb:"baseball_mlb" };

  const fetchLiveOdds = async (sportId) => {
    // Cache for 10 minutes


    setOddsLoading(true);
    setOddsError(false);
    try {
      const sportKey = SPORT_KEYS[sportId];
      if(!sportKey) { setOddsLoading(false); return; }

      // Fetch h2h + spreads + totals in one call
      const res = await fetch(`/api/odds?sport=${sportKey}`);
      if(!res.ok) throw new Error(`API error ${res.status}`);
      const payload = await res.json();
      const games = payload.games || payload; // handle both formats

      const ml = [], spread = [], ou = [], longshot = [];

      games.forEach((game, gi) => {
        const home = game.home_team;
        const away = game.away_team;
        const gameLabel = `${away} @ ${home}`;
        const dk = game.bookmakers?.[0];
        if(!dk) return;

        const h2h     = dk.markets?.find(m=>m.key==="h2h");
        const spreads = dk.markets?.find(m=>m.key==="spreads");
        const totals  = dk.markets?.find(m=>m.key==="totals");

        // Moneyline — both sides
        h2h?.outcomes?.forEach((o, oi) => {
          const american = o.price >= 0 ? `+${o.price}` : `${o.price}`;
          ml.push({
            id: `live_ml_${gi}_${oi}`,
            game: gameLabel,
            pick: o.name,
            odds: american,
            impliedOdds: o.price,
          });
          // Longshots: +400 or better
          if(o.price >= 400) {
            longshot.push({
              id: `live_ls_${gi}_${oi}`,
              game: gameLabel,
              pick: `${o.name} ML`,
              odds: american,
              impliedOdds: o.price,
            });
          }
        });

        // Spreads — both sides
        spreads?.outcomes?.forEach((o, oi) => {
          const american = o.price >= 0 ? `+${o.price}` : `${o.price}`;
          const sign = o.point >= 0 ? `+${o.point}` : `${o.point}`;
          spread.push({
            id: `live_sp_${gi}_${oi}`,
            game: gameLabel,
            pick: `${o.name} ${sign}`,
            odds: american,
            impliedOdds: o.price,
          });
        });

        // Totals — over/under
        totals?.outcomes?.forEach((o, oi) => {
          const american = o.price >= 0 ? `+${o.price}` : `${o.price}`;
          ou.push({
            id: `live_ou_${gi}_${oi}`,
            game: gameLabel,
            pick: `${o.name} ${o.point}`,
            odds: american,
            impliedOdds: o.price,
          });
        });
      });

      // Fetch live player props from separate endpoint
      let prop = sport.bets.prop; // fallback to hardcoded
      try {
        const propsRes = await fetch(`/api/props?sport=${sportKey}`);
        if(propsRes.ok) {
          const propsPayload = await propsRes.json();
          if(propsPayload.props && propsPayload.props.length > 0) {
            prop = propsPayload.props;
          }
        }
      } catch(e) {
        console.warn("Props fetch failed, using hardcoded:", e);
      }

      // Fetch ESPN scoreboard to get event IDs for game detail sheet
      try {
        const espnRes = await fetch(`/api/espn?sport=${sportKey}`);
        if(espnRes.ok) {
          const espnPayload = await espnRes.json();
          if(espnPayload.games) setEspnGames(espnPayload.games);
        }
      } catch(e) { console.warn("ESPN scoreboard fetch failed:", e); }

      // Store raw games for the ticker
      setTickerGames(games.map(g => ({
        away: g.away_team,
        home: g.home_team,
        time: g.commence_time,
      })));

      setLiveOdds(prev => ({
        ...prev,
        [sportId]: { ml, spread, ou, longshot, prop }
      }));

    } catch(e) {
      console.error("Odds API error:", e);
      setOddsError(true);
    } finally {
      setOddsLoading(false);
    }
  };

  // Use live odds if available, else fall back to hardcoded
  const BETS = liveOdds[activeLeague.sport] || {ml:[],spread:[],ou:[],prop:sport.bets.prop||[],longshot:[]};
  const isLiveOdds = !!liveOdds[activeLeague.sport];

  const [picks,        setPicks]        = useState({ml:null,prop:null,ou:null,spread:null});
  const [lsBets,       setLsBets]       = useState([]);

  // Flex multiplier system — 5 picks, user assigns mult 1-5, one must be parlay
  const EMPTY_FLEX = [
    {id:0, bet:null, mult:null, isParlay:false, parlayLegs:[]},
    {id:1, bet:null, mult:null, isParlay:false, parlayLegs:[]},
    {id:2, bet:null, mult:null, isParlay:false, parlayLegs:[]},
    {id:3, bet:null, mult:null, isParlay:false, parlayLegs:[]},
    {id:4, bet:null, mult:null, isParlay:false, parlayLegs:[]},
  ];
  const [flexPicks, setFlexPicks] = useState(EMPTY_FLEX);
  const [activeFlexSlot, setActiveFlexSlot] = useState(null); // index of slot being edited
  const [flexCategory, setFlexCategory] = useState(null); // category being browsed
  const [longshotMode, setLongshotMode] = useState("straight"); // "straight" | "parlay" — for longshot sheet
  const [betTypeFilter, setBetTypeFilter] = useState("all"); // "all" | "ml" | "spread" | "ou"
  const usedMults = flexPicks.filter(p=>p.mult!==null).map(p=>p.mult);
  const availableMults = [1,2,3,4,5].filter(m=>!usedMults.includes(m));
  // Valid longshot = straight +400 bet, OR parlay with 2+ legs AND combined odds +400 or better
  // ─── TEAM ACRONYM HELPER ─────────────────────────────────────────
  const getAcronym = (name, isProp=false) => {
    if(!name) return "?";

    // For props — show first name only (e.g. "LeBron James" → "LEBRON", "Patrick Mahomes" → "PAT")
    if(isProp) {
      const first = name.split(" ")[0];
      return first.substring(0,5).toUpperCase();
    }

    // Full name map
    const known = {
      // NFL
      "Kansas City Chiefs":"KC","Philadelphia Eagles":"PHI","San Francisco 49ers":"SF",
      "Dallas Cowboys":"DAL","Buffalo Bills":"BUF","Miami Dolphins":"MIA",
      "New England Patriots":"NE","New York Jets":"NYJ","New York Giants":"NYG",
      "Los Angeles Rams":"LAR","Los Angeles Chargers":"LAC","Las Vegas Raiders":"LV",
      "Seattle Seahawks":"SEA","Arizona Cardinals":"ARI","Green Bay Packers":"GB",
      "Chicago Bears":"CHI","Minnesota Vikings":"MIN","Detroit Lions":"DET",
      "Atlanta Falcons":"ATL","New Orleans Saints":"NO","Carolina Panthers":"CAR",
      "Tampa Bay Buccaneers":"TB","Pittsburgh Steelers":"PIT","Baltimore Ravens":"BAL",
      "Cleveland Browns":"CLE","Cincinnati Bengals":"CIN","Tennessee Titans":"TEN",
      "Indianapolis Colts":"IND","Houston Texans":"HOU","Jacksonville Jaguars":"JAX",
      "Denver Broncos":"DEN","Washington Commanders":"WAS","New York Giants":"NYG",
      // MLB
      "Los Angeles Dodgers":"LAD","New York Yankees":"NYY","Boston Red Sox":"BOS",
      "Chicago Cubs":"CHC","St. Louis Cardinals":"STL","Atlanta Braves":"ATL",
      "Houston Astros":"HOU","Toronto Blue Jays":"TOR","San Francisco Giants":"SFG",
      "New York Mets":"NYM","Philadelphia Phillies":"PHI","San Diego Padres":"SD",
      "Milwaukee Brewers":"MIL","Cincinnati Reds":"CIN","Chicago White Sox":"CWS",
      "Cleveland Guardians":"CLE","Detroit Tigers":"DET","Minnesota Twins":"MIN",
      "Seattle Mariners":"SEA","Oakland Athletics":"OAK","Texas Rangers":"TEX",
      "Baltimore Orioles":"BAL","Tampa Bay Rays":"TB","Miami Marlins":"MIA",
      "Washington Nationals":"WSH","Pittsburgh Pirates":"PIT","Colorado Rockies":"COL",
      "Arizona Diamondbacks":"ARI","Los Angeles Angels":"LAA","Kansas City Royals":"KC",
      // NBA
      "Los Angeles Lakers":"LAL","Golden State Warriors":"GS","Boston Celtics":"BOS",
      "Milwaukee Bucks":"MIL","Phoenix Suns":"PHX","Miami Heat":"MIA",
      "Brooklyn Nets":"BKN","Chicago Bulls":"CHI","Denver Nuggets":"DEN",
      "Memphis Grizzlies":"MEM","Dallas Mavericks":"DAL","Los Angeles Clippers":"LAC",
      "Atlanta Hawks":"ATL","Cleveland Cavaliers":"CLE","Philadelphia 76ers":"PHI",
      "Toronto Raptors":"TOR","New York Knicks":"NYK","Indiana Pacers":"IND",
      "Minnesota Timberwolves":"MIN","Oklahoma City Thunder":"OKC","Sacramento Kings":"SAC",
      "Portland Trail Blazers":"POR","Utah Jazz":"UTA","New Orleans Pelicans":"NO",
      "San Antonio Spurs":"SA","Charlotte Hornets":"CHA","Washington Wizards":"WAS",
      "Orlando Magic":"ORL","Detroit Pistons":"DET",
    };
    if(known[name]) return known[name];

    // Partial name match — check if name contains a known nickname
    const partialMap = {
      "Chiefs":"KC","Eagles":"PHI","49ers":"SF","Cowboys":"DAL","Bills":"BUF",
      "Dolphins":"MIA","Patriots":"NE","Jets":"NYJ","Giants":"NYG","Rams":"LAR",
      "Chargers":"LAC","Raiders":"LV","Seahawks":"SEA","Cardinals":"ARI",
      "Packers":"GB","Bears":"CHI","Vikings":"MIN","Lions":"DET","Falcons":"ATL",
      "Saints":"NO","Panthers":"CAR","Buccaneers":"TB","Steelers":"PIT",
      "Ravens":"BAL","Browns":"CLE","Bengals":"CIN","Titans":"TEN","Colts":"IND",
      "Texans":"HOU","Jaguars":"JAX","Broncos":"DEN","Commanders":"WAS",
      "Dodgers":"LAD","Yankees":"NYY","Red Sox":"BOS","Cubs":"CHC",
      "Braves":"ATL","Astros":"HOU","Blue Jays":"TOR","Mets":"NYM",
      "Phillies":"PHI","Padres":"SD","Brewers":"MIL","Reds":"CIN",
      "Mariners":"SEA","Athletics":"OAK","Rangers":"TEX","Orioles":"BAL",
      "Rays":"TB","Marlins":"MIA","Nationals":"WSH","Pirates":"PIT",
      "Rockies":"COL","Diamondbacks":"ARI","Angels":"LAA","Royals":"KC",
      "Lakers":"LAL","Warriors":"GS","Celtics":"BOS","Bucks":"MIL",
      "Suns":"PHX","Heat":"MIA","Nets":"BKN","Bulls":"CHI","Nuggets":"DEN",
      "Grizzlies":"MEM","Mavericks":"DAL","Clippers":"LAC","Hawks":"ATL",
      "Cavaliers":"CLE","76ers":"PHI","Raptors":"TOR","Knicks":"NYK",
      "Pacers":"IND","Timberwolves":"MIN","Thunder":"OKC","Kings":"SAC",
      "Trail Blazers":"POR","Jazz":"UTA","Pelicans":"NO","Spurs":"SA",
      "Hornets":"CHA","Wizards":"WAS","Magic":"ORL","Pistons":"DET",
    };
    for(const [nickname, abbr] of Object.entries(partialMap)) {
      if(name.includes(nickname)) return abbr;
    }

    // Fallback: first letters of words
    const words = name.split(" ").filter(w=>w.length>2);
    if(words.length===1) return name.substring(0,3).toUpperCase();
    return words.map(w=>w[0]).join("").substring(0,3).toUpperCase();
  };

  const calcParlayOddsDecimal = (legs) => legs.reduce((acc,b)=>{
    const dec = b.impliedOdds > 0 ? (b.impliedOdds/100)+1 : (100/Math.abs(b.impliedOdds))+1;
    return acc * dec;
  }, 1);
  const parlayAmericanOdds = (decimal) => decimal >= 2 ? Math.round((decimal-1)*100) : Math.round(-100/(decimal-1));
  const hasLongshot = flexPicks.some(p=> {
    if(p.category==="longshot" && p.bet && p.bet.impliedOdds >= 400) return true;
    if(p.isParlay && p.parlayLegs.length>=2) {
      const dec = calcParlayOddsDecimal(p.parlayLegs);
      return parlayAmericanOdds(dec) >= 400;
    }
    return false;
  });
  const hasParlay = hasLongshot; // keep hasParlay name so nothing else breaks
  const allFlexFilled = flexPicks.every(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null));
  const ALL_BETS = [
    ...BETS.ml.map(b=>({...b, category:"ml", categoryLabel:"Moneyline", categoryColor:IOS.blue})),
    ...BETS.prop.map(b=>({...b, category:"prop", categoryLabel:"Prop", categoryColor:IOS.yellow})),
    ...BETS.ou.map(b=>({...b, category:"ou", categoryLabel:"Over/Under", categoryColor:IOS.orange})),
    ...BETS.spread.map(b=>({...b, category:"spread", categoryLabel:"Spread", categoryColor:IOS.green})),
    ...BETS.longshot.map(b=>({...b, category:"longshot", categoryLabel:"Parlay Leg", categoryColor:IOS.pink})),
  ];

  // Grading state — weekPicks per league, stored locally
  const [gradingData,  setGradingData]  = useState(() => {
    const init = {};
    LEAGUES_DATA.forEach(lg => { init[lg.id] = JSON.parse(JSON.stringify(lg.weekPicks||[])); });
    return init;
  });
  const currentWeekPicks = gradingData[activeLeagueId] || [];
  const [activeSlot,  setActiveSlot]  = useState(null);
  const [myPUs,       setMyPUs]       = useState([]); // loaded from league_power_ups table
  const [showPUModal, setShowPUModal] = useState(null); // {context:"picks"|"matchup", slotId, pickIdx}
  const [activatedPUs,setActivatedPUs]= useState({}); // slotId -> pu applied on picks screen
  const [matchupPUs,  setMatchupPUs]  = useState({}); // pickIdx -> pu applied on live matchup
  const [profTab,     setProfTab]     = useState("stats");
  const [puLeagueId,  setPuLeagueId]  = useState(null); // which league to view PUs for on profile
  const [puLeaguePUs, setPuLeaguePUs] = useState([]); // PUs for the viewed league
  const [puLeagueSpins, setPuLeagueSpins] = useState(0); // wheel spins for viewed league
  const [showWheel,   setShowWheel]   = useState(false);
  const [spinning,    setSpinning]    = useState(false);
  const [wheelSpins,  setWheelSpins]  = useState(0); // earned by winning a week
  const [wheelAngle,  setWheelAngle]  = useState(0);
  const [wonPU,       setWonPU]       = useState(null);
  const [showWin,     setShowWin]     = useState(false);
  const [showTopScorer, setShowTopScorer] = useState(false);
  const [pickSearch,   setPickSearch]   = useState("");
  const [commishTab,   setCommishTab]   = useState("grade"); // grade | members | settings
  const [selectedGradeMember, setSelectedGradeMember] = useState(null); // userId of member being graded
  const [showLeaguesList, setShowLeaguesList] = useState(false);
  const [showNewLeague,   setShowNewLeague]   = useState(false);
  const [newLeagueSport,  setNewLeagueSport]  = useState(null);
  const [newLeagueName,   setNewLeagueName]   = useState("");
  const [newLeagueCreated, setNewLeagueCreated] = useState(null); // holds created league data for invite code screen
  const [newLeagueSize,    setNewLeagueSize]    = useState(8);
  const [advancingWeek,    setAdvancingWeek]    = useState(false);
  const [creatingLeague,  setCreatingLeague]  = useState(false);

  const shareInvite = async (code, leagueName) => {
    const text = `Join my PickLock league "${leagueName}"! Use invite code: ${code} 🔒`;
    if(navigator.share) {
      try { await navigator.share({ title: "Join my PickLock League", text }); return; } catch(e) {}
    }
    try { await navigator.clipboard.writeText(code); alert("Invite code copied! ✓"); } catch(e) {
      alert(`Invite code: ${code}`);
    }
  };

  const createLeague = async (name, sportId) => {
    if(!user||!name||!sportId) return;
    setCreatingLeague(true);
    const inviteCode = Math.random().toString(36).substring(2,8).toUpperCase();
    const {data,error} = await supabase.from("leagues").insert({
      name, sport:sportId, commissioner_id:user.id, invite_code:inviteCode,
      max_members:newLeagueSize, target_size:newLeagueSize, pick_deadline:"Sun 1PM ET", season_weeks:18,
      current_week:1, privacy:"private", scoring_type:"multiplier_odds",
    }).select().single();
    if(error){alert(`leagues error: ${error.message} | code: ${error.code} | details: ${error.details}`);setCreatingLeague(false);return;}
    const {error:memberError} = await supabase.from("league_members").insert({league_id:data.id,user_id:user.id,is_commissioner:true});
    if(memberError){alert(`league_members error: ${memberError.message} | code: ${memberError.code}`);setCreatingLeague(false);return;}
    await fetchLeagues(user.id);
    setNewLeagueCreated(data);
    setCreatingLeague(false);
  };

  const fetchSchedule = async (leagueId, userId) => {
    const {data} = await supabase
      .from("matchups")
      .select("*")
      .eq("league_id", leagueId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("week", {ascending: true});
    if(!data || !data.length) { setLiveSchedule([]); return; }
    const userIds = [...new Set([...data.map(m=>m.user1_id), ...data.map(m=>m.user2_id)])];
    const {data:users} = await supabase.from("users").select("id,username,email").in("id",userIds);
    const getName = uid => {
      const u = users?.find(x=>x.id===uid);
      return u?.username || u?.email?.split("@")[0] || "Unknown";
    };
    const schedule = data.map(m => {
      const isUser1 = m.user1_id === userId;
      const myPts = isUser1 ? (m.user1_points||0) : (m.user2_points||0);
      const oppPts = isUser1 ? (m.user2_points||0) : (m.user1_points||0);
      const result = m.winner_id === userId ? "W"
        : m.winner_id !== null ? "L"
        : myPts > 0 || oppPts > 0 ? "live"
        : "upcoming";
      return {
        week: m.week,
        opp: getName(isUser1 ? m.user2_id : m.user1_id),
        oppId: isUser1 ? m.user2_id : m.user1_id,
        myPts, oppPts, result, matchupId: m.id,
      };
    });
    setLiveSchedule(schedule);
  };

  // ─── SCHEDULE GENERATION ────────────────────────────────────────
  const generateSchedule = async (leagueId, memberIds, seasonWeeks) => {
    // Round-robin algorithm: generates matchups so everyone plays everyone else
    // before repeating. For N players, each round has N/2 matchups.
    const n = memberIds.length;
    if(n < 2 || n % 2 !== 0) return; // need even number

    // Wipe any existing matchups first
    await supabase.from("matchups").delete().eq("league_id", leagueId);

    const rounds = [];
    const ids = [...memberIds];
    const numRounds = n - 1; // one full round-robin

    for(let r = 0; r < numRounds; r++) {
      const round = [];
      for(let i = 0; i < n / 2; i++) {
        round.push([ids[i], ids[n - 1 - i]]);
      }
      rounds.push(round);
      // Rotate: fix first element, rotate rest
      ids.splice(1, 0, ids.pop());
    }

    // Fill season weeks by repeating round-robin
    const matchupsToInsert = [];
    for(let week = 1; week <= seasonWeeks; week++) {
      const roundIdx = (week - 1) % rounds.length;
      const round = rounds[roundIdx];
      // Shuffle sides for variety each time we repeat
      round.forEach(([a, b]) => {
        const flip = week > rounds.length && Math.random() > 0.5;
        matchupsToInsert.push({
          league_id: leagueId,
          week,
          user1_id: flip ? b : a,
          user2_id: flip ? a : b,
          user1_points: 0,
          user2_points: 0,
          winner_id: null,
        });
      });
    }

    await supabase.from("matchups").insert(matchupsToInsert);
  };

  const fetchPuLeagueData = async (leagueId, userId) => {
    const {data} = await supabase
      .from("league_power_ups")
      .select("*")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .eq("used", false);
    setPuLeaguePUs(data ? data.map(row => {
      const pu = POWER_UPS.find(p=>p.id===row.power_up_id)||POWER_UPS[0];
      return {...pu, dbId: row.id};
    }) : []);
    const {data:member} = await supabase
      .from("league_members")
      .select("wheel_spins")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .maybeSingle();
    setPuLeagueSpins(member?.wheel_spins||0);
  };

  const fetchLeaguePowerUps = async (leagueId, userId) => {
    // Fetch unused power-ups for this user in this league
    const {data} = await supabase
      .from("league_power_ups")
      .select("*")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .eq("used", false);
    if(data) {
      setMyPUs(data.map(row => {
        const pu = POWER_UPS.find(p=>p.id===row.power_up_id) || POWER_UPS[0];
        return {...pu, dbId: row.id};
      }));
    } else {
      setMyPUs([]);
    }
    // Fetch wheel spins for this user in this league
    const {data:member} = await supabase
      .from("league_members")
      .select("wheel_spins")
      .eq("league_id", leagueId)
      .eq("user_id", userId)
      .maybeSingle();
    if(member) setWheelSpins(member.wheel_spins||0);
    else setWheelSpins(0);
  };

  const fetchLeagueTrophies = async (leagueId) => {
    const {data:picks} = await supabase
      .from("picks")
      .select("*")
      .eq("league_id", leagueId)
      .neq("result", "pending");
    if(!picks||!picks.length) { setLeagueTrophies([]); return; }

    const {data:members} = await supabase.from("league_members").select("user_id").eq("league_id", leagueId);
    if(!members||!members.length) { setLeagueTrophies([]); return; }
    const userIds = members.map(m=>m.user_id);
    const {data:users} = await supabase.from("users").select("id,username,email").in("id",userIds);

    const getName = (uid) => {
      const u = users?.find(x=>x.id===uid);
      return u?.username || u?.email?.split("@")[0] || "Unknown";
    };
    const isMe = (uid) => uid === user?.id;

    // Stats per user
    const stats = {};
    picks.forEach(p=>{
      if(!stats[p.user_id]) stats[p.user_id]={wins:0,losses:0,points:0,longshotPts:0,streak:0,maxStreak:0,lastResult:null};
      const s = stats[p.user_id];
      if(p.result==="W") {
        s.wins++;
        s.points += parseFloat(p.points_earned||0);
        if(p.slot==="longshot"||p.slot?.startsWith("longshot_")) s.longshotPts += parseFloat(p.points_earned||0);
        s.streak = s.lastResult==="W" ? s.streak+1 : 1;
      } else {
        s.losses++;
        s.streak = 0;
      }
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      s.lastResult = p.result;
    });

    const uids = Object.keys(stats);
    if(!uids.length) { setLeagueTrophies([]); return; }

    const byPoints = [...uids].sort((a,b)=>stats[b].points-stats[a].points);
    const byWinRate = [...uids].sort((a,b)=>{
      const ra = stats[a].wins/(stats[a].wins+stats[a].losses||1);
      const rb = stats[b].wins/(stats[b].wins+stats[b].losses||1);
      return rb-ra;
    });
    const byStreak = [...uids].sort((a,b)=>stats[b].maxStreak-stats[a].maxStreak);
    const byLongshot = [...uids].sort((a,b)=>stats[b].longshotPts-stats[a].longshotPts);

    const trophies = [
      { id:"whale",    icon:"💰", name:"The Whale",      desc:"Most total points",        holder:getName(byPoints[0]),    isYou:isMe(byPoints[0]),    color:IOS.green  },
      { id:"sharp",    icon:"🎯", name:"Sharpshooter",   desc:"Highest win rate",         holder:getName(byWinRate[0]),   isYou:isMe(byWinRate[0]),   color:IOS.yellow },
      { id:"hot",      icon:"🔥", name:"Hot Hand",       desc:"Longest win streak",       holder:getName(byStreak[0]),    isYou:isMe(byStreak[0]),    color:IOS.orange },
      { id:"longshot", icon:"🚀", name:"Longshot King",  desc:"Most points from longshots",holder:getName(byLongshot[0]), isYou:isMe(byLongshot[0]),  color:IOS.pink   },
    ];
    setLeagueTrophies(trophies);
  };

  const fetchUserProfile = async (uid) => {
    const {data} = await supabase.from("users").select("id,username,email,push_enabled,notif_results,notif_grades,notif_reminder,notif_league").eq("id",uid).maybeSingle();
    if(data) {
      setUserProfile(data);
      // Only show prompt if no username AND account is older than 30 seconds
      // This prevents the prompt from showing immediately after signup
      if(!data.username) {
        const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0;
        const ageSeconds = (Date.now() - createdAt) / 1000;
        if(ageSeconds > 30) setShowUsernamePrompt(true);
      }
    } else {
      // No user record yet — they just signed up, skip prompt
    }
  };

  const fetchAllMyStats = async (uid) => {
    const {data:picks} = await supabase
      .from("picks")
      .select("*")
      .eq("user_id", uid)
      .neq("result", "pending");
    if(!picks||!picks.length) { setAllMyStats({wins:0,losses:0,points:0,total:0,winRate:"0%",bestBet:null,worstBet:null}); return; }
    const wins = picks.filter(p=>p.result==="W").length;
    const losses = picks.filter(p=>p.result==="L").length;
    const points = parseFloat(picks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1));
    const total = wins + losses;
    const winRate = total > 0 ? `${Math.round(wins/total*100)}%` : "0%";
    const bestBet = picks.filter(p=>p.result==="W").sort((a,b)=>parseFloat(b.points_earned||0)-parseFloat(a.points_earned||0))[0];
    const worstBet = picks.filter(p=>p.result==="L")[0];
    setAllMyStats({wins, losses, points, total, winRate, bestBet, worstBet});
  };

  const fetchStandings = async (leagueId) => {
    // Get all graded picks for this league
    const {data:picks} = await supabase
      .from("picks")
      .select("*")
      .eq("league_id", leagueId)
      .neq("result", "pending");
    if(!picks||!picks.length) return;

    // Get all members
    const {data:members} = await supabase
      .from("league_members")
      .select("user_id, is_commissioner")
      .eq("league_id", leagueId);
    if(!members) return;

    const userIds = members.map(m=>m.user_id);
    const {data:users} = await supabase
      .from("users")
      .select("id, username, email")
      .in("id", userIds);

    // Group picks by user and calculate stats
    const statsByUser = {};
    picks.forEach(p=>{
      if(!statsByUser[p.user_id]) statsByUser[p.user_id] = {wins:0, losses:0, points:0};
      if(p.result==="W") {
        statsByUser[p.user_id].wins++;
        statsByUser[p.user_id].points += parseFloat(p.points_earned||0);
      } else if(p.result==="L") {
        statsByUser[p.user_id].losses++;
      }
    });

    // Fetch matchup W/L records for season record
    const {data:matchups} = await supabase
      .from("matchups")
      .select("user1_id,user2_id,winner_id")
      .eq("league_id", leagueId)
      .not("winner_id", "is", null);

    const matchupRecord = {};
    (matchups||[]).forEach(m=>{
      if(!matchupRecord[m.user1_id]) matchupRecord[m.user1_id]={mw:0,ml:0};
      if(!matchupRecord[m.user2_id]) matchupRecord[m.user2_id]={mw:0,ml:0};
      if(m.winner_id===m.user1_id){ matchupRecord[m.user1_id].mw++; matchupRecord[m.user2_id].ml++; }
      else { matchupRecord[m.user2_id].mw++; matchupRecord[m.user1_id].ml++; }
    });

    const standings = userIds.map(uid=>{
      const u = users?.find(x=>x.id===uid);
      const s = statsByUser[uid]||{wins:0,losses:0,points:0};
      const mr = matchupRecord[uid]||{mw:0,ml:0};
      const total = s.wins + s.losses;
      return {
        userId: uid,
        name: u?.username || u?.email?.split("@")[0] || "Unknown",
        wins: s.wins,
        losses: s.losses,
        points: parseFloat(s.points.toFixed(1)),
        record: `${mr.mw}-${mr.ml}`,
        wpct: total > 0 ? `${Math.round(s.wins/total*100)}%` : "0%",
        isYou: uid === user?.id,
      };
    }).sort((a,b)=>{
      // Wins first, then points as tiebreaker
      if(b.wins !== a.wins) return b.wins - a.wins;
      return b.points - a.points;
    })
      .map((s,i)=>({...s, rank:i+1}));

    setRealStandings(standings);
  };
  const fetchMyPicks = async (leagueId, week, uid) => {
    const {data} = await supabase
      .from("picks")
      .select("*")
      .eq("league_id", leagueId)
      .eq("user_id", uid)
      .eq("week", week);
    if(data && data.length > 0) {
      // Convert DB picks back into flexPicks format for the locked view
      const multGroups = {};
      data.forEach(p=>{
        if(!multGroups[p.multiplier]) multGroups[p.multiplier] = [];
        multGroups[p.multiplier].push(p);
      });
      const flexPicks = Object.entries(multGroups).map(([mult, picks])=>{
        const isParlay = picks[0].slot === "longshot";
        return {
          id: parseInt(mult)-1,
          mult: parseInt(mult),
          isParlay,
          parlayLegs: isParlay ? picks.map(p=>({id:p.id, pick:p.pick_name, game:"", odds:p.odds, impliedOdds:p.implied_odds})) : [],
          bet: isParlay ? null : {pick:picks[0].pick_name, game:"", odds:picks[0].odds, impliedOdds:picks[0].implied_odds},
          category: picks[0].slot,
        };
      });
      // Fill missing slots
      while(flexPicks.length < 5) flexPicks.push({id:flexPicks.length, bet:null, mult:null, isParlay:false, parlayLegs:[]});
      setSavedPicks({fromDB: true, flexPicks, dbPicks: data});
    } else {
      setSavedPicks(null);
    }
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
    setLeaguesLoading(true);
    const {data:members} = await supabase.from("league_members").select("league_id, is_commissioner").eq("user_id", uid);
    if(!members || members.length===0) { setLeaguesLoading(false); return; }
    const ids = [...new Set(members.map(m=>m.league_id))];
    const {data:leagues} = await supabase.from("leagues").select("*").in("id", ids);
    if(leagues && leagues.length > 0) {
      const mapped = leagues.map(lg=>({
        ...lg,
        isCommissioner: members.find(m=>m.league_id===lg.id)?.is_commissioner||false
      }));
      setRealLeagues(mapped);
      setActiveLeagueId(mapped[0].id);
      const week = mapped[0].current_week||mapped[0].week||1;
      fetchMyPicks(mapped[0].id, week, uid);
    }
    setLeaguesLoading(false);
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

  const fetchMessages = async (leagueId) => {
    setChatLoading(true);
    const {data} = await supabase
      .from("league_messages")
      .select("*")
      .eq("league_id", leagueId)
      .order("created_at", {ascending: true})
      .limit(100);
    if(data) setMessages(data);
    setChatLoading(false);
  };

  const subscribeToMessages = (leagueId) => {
    return supabase
      .channel(`chat:${leagueId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "league_messages",
        filter: `league_id=eq.${leagueId}`,
      }, payload => {
        setMessages(prev => {
          // Avoid duplicates — remove any temp optimistic message with same content/user
          const filtered = prev.filter(m => 
            !(m.id?.toString().startsWith("temp_") && 
              m.user_id===payload.new.user_id && 
              m.message===payload.new.message)
          );
          return [...filtered, payload.new];
        });
        setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
      })
      .subscribe();
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      const u = session?.user??null;
      setUser(u);
      if(u) { fetchLeagues(u.id); fetchAllMyStats(u.id); fetchUserProfile(u.id); }
    });
    supabase.auth.onAuthStateChange((_e,session)=>{
      const u = session?.user??null;
      setUser(u);
      if(u) { fetchLeagues(u.id); fetchAllMyStats(u.id); fetchUserProfile(u.id); }
    });
    setTimeout(()=>setAnim(true),80);
    const t=setInterval(()=>setTimeLeft(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--;}if(m<0){m=59;h--;}if(h<0){h=0;m=0;s=0;}return{h,m,s};}),1000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    if(!activeLeagueId||!user) return;
    // Clear stale data immediately when league switches
    setWeekPicks([]);
    setLeagueMembers([]);
    setRealStandings([]);
    setLeagueTrophies([]);
    setSavedPicks(null);
    fetchLeagueMembers(activeLeagueId, user.id);
    fetchStandings(activeLeagueId);
    fetchLeagueTrophies(activeLeagueId);
    const lg2 = realLeagues.find(l=>l.id===activeLeagueId);
    // Always fetch odds even if lg2 not loaded yet — use activeLeague sport
    fetchLiveOdds((lg2?.sport || activeLeague?.sport || "nfl"));
    if(lg2) {
      const week = lg2.current_week||lg2.week||1;
      fetchMyPicks(activeLeagueId, week, user.id);
      fetchSchedule(activeLeagueId, user.id);
      fetchLeaguePowerUps(activeLeagueId, user.id);
      // Restore saved picks from localStorage for this specific league+week
      try {
        const stored = localStorage.getItem(`linedup_picks_${activeLeagueId}_wk${week}`);
        if(stored) setSavedPicks(JSON.parse(stored));
      } catch(e) {}
    }
  },[activeLeagueId, user, screen]);

  useEffect(()=>{
    if(!activeLeagueId||!user) return;
    const lg = realLeagues.find(l=>l.id===activeLeagueId);
    if(lg) fetchWeekPicks(activeLeagueId, lg.current_week||lg.week||1);
  },[activeLeagueId, user, screen]);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages]);

  useEffect(()=>{
    if(screen==="chat"&&activeLeague?.id) {
      fetchMessages(activeLeague.id);
      const sub = subscribeToMessages(activeLeague.id);
      return ()=>{ supabase.removeChannel(sub); };
    }
  },[screen, activeLeague?.id]);

  const spinWheel=()=>{
    if(spinning)return;
    setSpinning(true);setWonPU(null);
    const segA=360/WHEEL_ITEMS.length;
    const winIdx=Math.floor(Math.random()*WHEEL_ITEMS.length);
    const final=wheelAngle+(5+Math.random()*3)*360+(360-winIdx*segA-segA/2);
    setWheelAngle(final);
    setTimeout(()=>{setWonPU(WHEEL_ITEMS[winIdx]);setSpinning(false);setTimeout(()=>setShowWin(true),400);},4000);
  };

  const claimPU=async()=>{
    if(wonPU && user && activeLeague?.id) {
      const week = activeLeague.current_week||activeLeague.week||1;
      // Save power-up to DB
      const {data:newPU} = await supabase.from("league_power_ups").insert({
        league_id: activeLeague.id,
        user_id: user.id,
        power_up_id: wonPU.id,
        week_earned: week,
        used: false,
      }).select().single();
      setMyPUs(p=>[...p, {...wonPU, dbId: newPU?.id}]);
      // Decrement wheel_spins in DB
      const newSpins = Math.max(0, wheelSpins-1);
      await supabase.from("league_members")
        .update({wheel_spins: newSpins})
        .eq("league_id", activeLeague.id)
        .eq("user_id", user.id);
      setWheelSpins(newSpins);
    }
    setShowWin(false);setShowWheel(false);setWonPU(null);
  };

  const usePU=async(pu, context, key)=>{
    // Mark as used in DB
    if(pu.dbId) {
      await supabase.from("league_power_ups").update({used:true}).eq("id",pu.dbId);
    }
    // Remove from local inventory
    setMyPUs(p=>p.filter(x=>x.dbId!==pu.dbId));
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
  const sendMsg=async()=>{
    if(!chatMsg.trim()||!user||!activeLeague?.id) return;
    const msg = chatMsg.trim();
    const username = userProfile?.username || user.email?.split("@")[0] || "Unknown";
    setChatMsg("");
    // Optimistically add message to local state immediately
    const optimistic = {
      id: `temp_${Date.now()}`,
      league_id: activeLeague.id,
      user_id: user.id,
      username,
      message: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(prev=>[...prev, optimistic]);
    setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);
    // Then save to Supabase
    await supabase.from("league_messages").insert({
      league_id: activeLeague.id,
      user_id: user.id,
      username,
      message: msg,
    });
  };

  const parlay=calcParlay(picks,lsBets,SLOTS);
  const lsO=calcLS(lsBets);
  const allFilled=Object.values(picks).every(v=>v)&&lsBets.length>=2;

  const baseStandings = realStandings.length > 0 ? realStandings.map(s=>({
    rank: s.rank,
    name: s.isYou ? "You" : s.name,
    record: s.record,
    units: `+${s.points}`,
    roi: s.wpct,
    streak: "—",
    wpct: s.wpct,
    wr: [],
    points: s.points,
    isYou: s.isYou,
  })) : leagueMembers.length > 0 ? leagueMembers.map((m,i)=>({
    rank: i+1,
    name: m.isYou ? "You" : m.name,
    record: "0-0",
    units: "0",
    roi: "0%",
    streak: "—",
    wpct: "0%",
    wr: [],
    points: 0,
    isYou: m.isYou,
  })) : [];

  const sorted=[...baseStandings].sort((a,b)=>{
    if(sortBy==="roi")   return parseFloat(b.roi)-parseFloat(a.roi);
    if(sortBy==="units") return parseFloat(b.units)-parseFloat(a.units);
    if(sortBy==="wpct")  return parseFloat(b.wpct)-parseFloat(a.wpct);
    // Default: wins first, then points as tiebreaker
    const aWins = parseInt((a.record||"0-0").split("-")[0])||0;
    const bWins = parseInt((b.record||"0-0").split("-")[0])||0;
    if(bWins !== aWins) return bWins - aWins;
    return (b.points||0) - (a.points||0);
  });

  const W=280;const R=W/2;const segA=360/WHEEL_ITEMS.length;

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    ::-webkit-scrollbar{display:none;}

    .phone{width:390px;min-height:844px;background:#000;position:relative;overflow:hidden;display:flex;flex-direction:column;font-family:'Manrope',system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;padding-top:env(safe-area-inset-top,0px);box-sizing:border-box;}

    /* iOS Status Bar */


    /* Large Title Navigation (iOS style) */
    .nav-header{padding:env(safe-area-inset-top,44px) 20px 12px;position:relative;z-index:5;background:#000;}
    .nav-header.large{padding-bottom:8px;}
    .nav-title-small{font-size:17px;font-weight:600;letter-spacing:-0.4px;color:#fff;text-align:center;padding:12px 0 8px;}
    .nav-title-large{font-size:34px;font-weight:700;letter-spacing:-0.5px;color:#fff;line-height:1.1;}
    .nav-subtitle{font-size:13px;color:${IOS.label3};margin-top:2px;}

    /* Scrollable body */
    .body{flex:1;overflow-y:auto;position:relative;z-index:1;padding-top:env(safe-area-inset-top,0px);}
    .body-pad{padding-bottom:calc(100px + env(safe-area-inset-bottom,0px));}

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
    .sheet-search{width:100%;background:rgba(255,255,255,0.08);border:none;border-radius:10px;padding:9px 14px 9px 40px;font-family:'Manrope',sans-serif;font-size:15px;color:#fff;outline:none;}
    .sheet-search::placeholder{color:rgba(255,255,255,0.3);}
    .sheet-search-icon{position:absolute;left:30px;top:50%;transform:translateY(-50%);font-size:13px;color:rgba(255,255,255,0.3);pointer-events:none;}
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
    @keyframes ticker-scroll{0%{transform:translateX(0%)}100%{transform:translateX(-50%)}}
    .ticker-wrap{overflow:hidden;background:#0a0a0a;border-top:0.5px solid rgba(255,255,255,0.06);border-bottom:0.5px solid rgba(255,255,255,0.06);height:42px;display:flex;align-items:center;margin:0 0 10px;}
    .ticker-track{display:flex;align-items:center;white-space:nowrap;animation:ticker-scroll 40s linear infinite;will-change:transform;}
    .ticker-track:hover,.ticker-track:active{animation-play-state:paused;}
    .ticker-item{display:inline-flex;align-items:center;gap:7px;padding:0 22px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.02em;font-family:'Manrope',sans-serif;}
    .ticker-item .ti-teams{color:rgba(255,255,255,0.85);font-weight:700;}
    .ticker-item .ti-live{color:#30D158;font-weight:800;letter-spacing:0.05em;}
    .ticker-item .ti-time{color:rgba(255,255,255,0.35);}
    .ticker-sep{color:rgba(255,255,255,0.15);padding:0 4px;font-size:10px;}
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

    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* iOS Tab Bar */
    .tab-bar{background:rgba(28,28,30,0.92);backdrop-filter:blur(20px) saturate(180%);border-top:0.5px solid rgba(255,255,255,0.08);display:flex;padding:8px 0;padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));position:sticky;bottom:0;z-index:20;}
    .tab-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:opacity .15s;}
    .tab-item:active{opacity:0.6;}
    .tab-icon{font-size:22px;line-height:1;}
    .tab-label{font-size:10px;font-weight:500;letter-spacing:-0.2px;color:${IOS.gray};}
    .tab-item.on .tab-label{color:${IOS.blue};}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#111",display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <style>{css}</style>

      {/* ══ TUTORIAL OVERLAY ══ */}
      {user && tutorialStep >= 0 && (() => {
        const steps = [
          {
            icon: "🏆",
            title: "Welcome to PickLock",
            body: "Fantasy sports betting with your friends. Each week you build a pick slip, lock it in, and compete head-to-head for points.",
            highlight: null,
            pos: "center",
          },
          {
            icon: "🏈",
            title: "Create or Join a League",
            body: "Tap 'All Leagues' to create your own league or join one with an invite code. Leagues are 6–12 players.",
            highlight: "All Leagues",
            pos: "top",
          },
          {
            icon: "🎯",
            title: "Build Your Pick Slip",
            body: "Each week you get 5 pick slots — Moneyline, Prop, Over/Under, Spread, and a Longshot (straight or parlay of +400 or greater). For each pick, choose your bet and set a multiplier (1x–5x).",
            highlight: null,
            pos: "center",
          },


          {
            icon: "📊",
            title: "Matchups & Scoring",
            body: "Every week you're matched against one league member. Your points from winning picks add up — whoever scores more wins the week. Check live scores on the Matchup tab.",
            highlight: null,
            pos: "center",
          },
          {
            icon: "🔒",
            title: "Lock It In",
            body: "Once you're happy with your slip, lock it in. You can still make changes up until the first event actually starts. Good luck!",
            highlight: null,
            pos: "bottom",
          },
        ];
        const step = steps[tutorialStep];
        const isLast = tutorialStep === steps.length - 1;
        const isFirst = tutorialStep === 0;
        return (
          <div style={{position:"fixed",inset:0,zIndex:9000,pointerEvents:"all"}}>
            {/* Dim overlay */}
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(2px)"}} onClick={dismissTutorial}/>
            {/* Card */}
            <div style={{
              position:"absolute",
              left:"50%",
              transform:"translateX(-50%)",
              ...(step.pos==="bottom" ? {bottom:100} : step.pos==="top" ? {top:120} : {top:"50%",transform:"translate(-50%,-50%)"}),
              width:"calc(100% - 48px)",
              maxWidth:360,
              background:"#1C1C1E",
              borderRadius:24,
              padding:"28px 24px 22px",
              boxShadow:"0 24px 80px rgba(0,0,0,0.7)",
              border:"1px solid rgba(255,255,255,0.08)",
              zIndex:9001,
            }}>
              {/* Skip */}
              <div onClick={dismissTutorial} style={{position:"absolute",top:16,right:16,fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.35)",cursor:"pointer",padding:"4px 8px",background:"rgba(255,255,255,0.06)",borderRadius:8}}>Skip</div>
              {/* Step dots */}
              <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:20}}>
                {steps.map((_,i)=>(
                  <div key={i} onClick={()=>setTutorialStep(i)} style={{width:i===tutorialStep?20:6,height:6,borderRadius:3,background:i===tutorialStep?IOS.blue:"rgba(255,255,255,0.2)",transition:"all 0.25s",cursor:"pointer"}}/>
                ))}
              </div>
              {/* Icon */}
              <div style={{fontSize:44,textAlign:"center",marginBottom:12}}>{step.icon}</div>
              {/* Title */}
              <div style={{fontSize:20,fontWeight:800,color:"#fff",textAlign:"center",marginBottom:10,letterSpacing:-0.3}}>{step.title}</div>
              {/* Body */}
              <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",textAlign:"center",lineHeight:1.6,marginBottom:24}}>{step.body}</div>
              {/* Buttons */}
              <div style={{display:"flex",gap:10}}>
                {!isFirst && (
                  <button onClick={()=>setTutorialStep(s=>s-1)} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>Back</button>
                )}
                <button onClick={()=>isLast?dismissTutorial():setTutorialStep(s=>s+1)} style={{flex:2,background:IOS.blue,border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>{isLast?"Let's Go! 🏆":"Next"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ AUTH SCREEN ══ */}
      {!user && (
        <div style={{width:390,minHeight:"100vh",background:"#09090f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px",fontFamily:"'Manrope',sans-serif"}}>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:-1,color:"#60a5fa",marginBottom:6}}>PICKLOCK</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:48}}>Fantasy sports betting, built different</div>
          <div style={{display:"flex",background:"#1C1C1E",borderRadius:12,padding:2,marginBottom:28,width:"100%"}}>
            {["login","signup"].map(t=>(
              <div key={t} onClick={()=>setAuthScreen(t)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:authScreen===t?"#2C2C2E":"transparent",color:authScreen===t?"#fff":"rgba(255,255,255,0.4)",transition:"all .2s"}}>{t==="login"?"Sign In":"Sign Up"}</div>
            ))}
          </div>
          <input id="auth-email" type="email" placeholder="Email" style={{width:"100%",background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",marginBottom:12}}/>
          <input id="auth-password" type="password" placeholder="Password" style={{width:"100%",background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",marginBottom:12}}/>
          {authScreen==="signup"&&<input id="auth-username" type="text" placeholder="Username (e.g. sharpshooter99)" style={{width:"100%",background:"#1C1C1E",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",marginBottom:8}}/>}
          {authScreen==="signup"&&<div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:16,alignSelf:"flex-start",paddingLeft:4}}>This is how you'll appear to other players</div>}
          {authScreen==="login"&&<div style={{height:24}}/>}
          <button onClick={async()=>{
            const email=document.getElementById("auth-email").value.trim();
            const password=document.getElementById("auth-password").value;
            if(authScreen==="login"){
              const {error}=await supabase.auth.signInWithPassword({email,password});
              if(error)alert(error.message);
            } else {
              const username=(document.getElementById("auth-username")?.value||"").trim();
              if(!username){ alert("Please enter a username."); return; }
              if(username.length<3){ alert("Username must be at least 3 characters."); return; }
              if(!/^[a-zA-Z0-9_]+$/.test(username)){ alert("Username can only contain letters, numbers, and underscores."); return; }
              // Check username not taken
              const {data:existing}=await supabase.from("users").select("id").eq("username",username).maybeSingle();
              if(existing){ alert("That username is taken. Try another."); return; }
              const {data,error}=await supabase.auth.signUp({email,password});
              if(error){ alert(error.message); return; }
              // Save username to users table
              const uid = data?.user?.id;
              if(uid){
                await supabase.from("users").upsert({id:uid, email, username}, {onConflict:"id"});
              }
              setTutorialStep(0); // show tutorial for new signups only
              alert("Account created! Check your email to confirm, then sign in.");
            }
          }} style={{width:"100%",background:"#0A84FF",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'Manrope',sans-serif",marginBottom:16}}>
            {authScreen==="login"?"Sign In":"Create Account"}
          </button>
          {authScreen==="login"&&<div style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}} onClick={()=>setAuthScreen("signup")}>No account? Sign up</div>}
          {authScreen==="signup"&&<div style={{fontSize:13,color:"rgba(255,255,255,0.35)",cursor:"pointer"}} onClick={()=>setAuthScreen("login")}>Already have an account? Sign in</div>}
        </div>
      )}

      {user && <div className="phone">
        {/* Status bar safe area cover — blends iPhone time/battery into app */}
        <div style={{
          position:"fixed",
          top:0,
          left:"50%",
          transform:"translateX(-50%)",
          width:390,
          height:"env(safe-area-inset-top, 44px)",
          background:"#000",
          zIndex:999,
          pointerEvents:"none",
        }}/>

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
              {(()=>{
                const filteredPUs = showPUModal?.context==="picks"
                  ? myPUs.filter(pu=>pu.type==="offensive")
                  : myPUs;
                return filteredPUs.length===0
                  ? <div style={{padding:"28px 20px",textAlign:"center",color:IOS.label3,fontSize:15}}>No offensive power-ups in inventory</div>
                  : filteredPUs.map((pu,i)=>(
                    <div key={i} className="pu-opt" onClick={()=>usePU(pu, showPUModal.context, showPUModal.context==="picks"?showPUModal.slotId:showPUModal.pickIdx)}>
                      <div className="pu-opt-icon" style={{background:`${pu.color}20`}}>{pu.icon}</div>
                      <div style={{flex:1}}>
                        <div className="pu-opt-name">{pu.name}</div>
                        <div className="pu-opt-desc">{pu.desc}</div>
                        <div className="pu-opt-rarity" style={{color:rarityColor(pu.rarity)}}>{pu.rarity}</div>
                      </div>
                      <div style={{fontSize:20,color:IOS.label3}}>›</div>
                    </div>
                  ));
              })()}
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
                  "Add to Inventory"
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

        {/* ══ USERNAME PROMPT MODAL ══ */}
        {showUsernamePrompt && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:IOS.bg2,borderRadius:24,padding:28,width:"100%",maxWidth:340,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
              <div style={{fontSize:32,textAlign:"center",marginBottom:8}}>👋</div>
              <div style={{fontSize:22,fontWeight:800,color:"#fff",textAlign:"center",marginBottom:6}}>Welcome to PickLock</div>
              <div style={{fontSize:14,color:IOS.label3,textAlign:"center",marginBottom:24,lineHeight:1.5}}>Set a username so your league mates can find you and see your picks.</div>
              <input
                value={usernamePromptInput}
                onChange={e=>{setUsernamePromptInput(e.target.value);setUsernamePromptError("");}}
                placeholder="Choose a username..."
                autoFocus
                style={{width:"100%",background:"#1C1C1E",border:`1.5px solid ${usernamePromptError?IOS.red:IOS.blue}`,borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Manrope,sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}
              />
              {usernamePromptError && <div style={{fontSize:12,color:IOS.red,marginBottom:8}}>{usernamePromptError}</div>}
              <div style={{fontSize:11,color:IOS.label3,marginBottom:20}}>Letters, numbers, and underscores only. Min 3 characters.</div>
              <button onClick={async()=>{
                const val = usernamePromptInput.trim();
                if(!val){setUsernamePromptError("Please enter a username");return;}
                if(val.length<3){setUsernamePromptError("Min 3 characters");return;}
                if(!/^[a-zA-Z0-9_]+$/.test(val)){setUsernamePromptError("Letters, numbers, and _ only");return;}
                setUsernamePromptSaving(true);
                const {data:existing} = await supabase.from("users").select("id").eq("username",val).maybeSingle();
                if(existing && existing.id!==user.id){setUsernamePromptError("That username is taken");setUsernamePromptSaving(false);return;}
                await supabase.from("users").upsert({id:user.id,email:user.email,username:val},{onConflict:"id"});
                setUserProfile(prev=>({...prev,username:val}));
                setShowUsernamePrompt(false);
                setUsernamePromptSaving(false);
              }} style={{width:"100%",background:usernamePromptSaving?"rgba(255,255,255,0.1)":IOS.blue,border:"none",borderRadius:12,padding:"14px",fontSize:16,fontWeight:700,color:usernamePromptSaving?"rgba(255,255,255,0.3)":"#fff",cursor:usernamePromptSaving?"default":"pointer",fontFamily:"Manrope,sans-serif",marginBottom:10}}>
                {usernamePromptSaving?"Saving...":"Set Username"}
              </button>
              <div onClick={()=>setShowUsernamePrompt(false)} style={{textAlign:"center",fontSize:13,color:IOS.label3,cursor:"pointer"}}>Skip for now</div>
            </div>
          </div>
        )}

        {/* ══ HOME ══ */}
        {screen==="home"&&(
          <>
            <div className="body">
              <div className="nav-header large" style={{padding:"0 20px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div className="nav-title-large">PICKLOCK</div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div onClick={()=>setScreen("leagues")} style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>All Leagues</div>
                    <div onClick={()=>setScreen("chat")} style={{width:34,height:34,borderRadius:50,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer"}}>
                      💬
                    </div>
                    <div onClick={()=>setScreen("profile")} style={{width:34,height:34,borderRadius:50,background:`linear-gradient(135deg,${IOS.blue},${IOS.indigo})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                      {(userProfile?.username?.[0]||user?.email?.[0]||"J").toUpperCase()}
                    </div>
                  </div>
                </div>
                {/* League toggle */}
                <div style={{display:"flex",gap:6,marginTop:10,marginBottom:2,overflowX:"auto",paddingBottom:2}}>
                  {realLeagues.map(lg=>{
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

              {/* Games Ticker */}
              {tickerGames.length > 0 && (() => {
                const now = new Date();
                const items = tickerGames.map(g => {
                  const t = new Date(g.time);
                  const isLive = now >= t && now < new Date(t.getTime() + 4*60*60*1000);
                  const isToday = t.toDateString() === now.toDateString();
                  const timeStr = t.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
                  const away = g.away.split(' ').pop(); // last word = team name
                  const home = g.home.split(' ').pop();
                  return {away, home, isLive, isToday, timeStr};
                });
                // Duplicate for seamless loop
                const doubled = [...items, ...items];
                const openGame = async (g) => {
                  // Match ticker game to ESPN game by team name
                  const espn = espnGames.find(e =>
                    e.awayTeam?.toLowerCase().includes(g.away.toLowerCase()) ||
                    e.homeTeam?.toLowerCase().includes(g.home.toLowerCase()) ||
                    e.awayAbbr?.toLowerCase() === g.away.toLowerCase() ||
                    e.homeAbbr?.toLowerCase() === g.home.toLowerCase()
                  );
                  // Find odds for this game from liveOdds
                  const sport = SPORT_KEYS[activeLeague?.sport];
                  const gameOdds = {
                    ml: (liveOdds[activeLeague?.sport]?.ml||[]).filter(o=>o.game?.includes(g.away)||o.game?.includes(g.home)),
                    spread: (liveOdds[activeLeague?.sport]?.spread||[]).filter(o=>o.game?.includes(g.away)||o.game?.includes(g.home)),
                    ou: (liveOdds[activeLeague?.sport]?.ou||[]).filter(o=>o.game?.includes(g.away)||o.game?.includes(g.home)),
                  };
                  setGameSheet({ tickerGame: g, espnGame: espn, detail: null, odds: gameOdds });
                  if(espn?.id) {
                    setGameLoading(true);
                    try {
                      const sportKey = SPORT_KEYS[activeLeague?.sport];
                      const r = await fetch(`/api/espn?sport=${sportKey}&gameId=${espn.id}`);
                      if(r.ok) {
                        const d = await r.json();
                        setGameSheet(prev => ({...prev, detail: d}));
                      }
                    } catch(e) { console.warn('Game detail fetch failed:', e); }
                    finally { setGameLoading(false); }
                  }
                };
                return (
                  <div className='ticker-wrap'>
                    <div className='ticker-track' style={{animationDuration: Math.max(12, items.length * 5) + 's'}}>
                      {doubled.map((g, i) => (
                        <span key={i} className='ticker-item'
                          onClick={e=>{e.stopPropagation();if(i<items.length)openGame(g);}}
                          onTouchEnd={e=>{e.preventDefault();e.stopPropagation();if(i<items.length)openGame(g);}}
                          style={{cursor:"pointer",WebkitTapHighlightColor:"rgba(255,255,255,0.1)",userSelect:"none"}}>
                          <span className='ti-teams'>{g.away} @ {g.home}</span>
                          {g.isLive
                            ? <span className='ti-live'>● LIVE</span>
                            : <span className='ti-time'>{g.timeStr}</span>
                          }
                          <span className='ticker-sep'>|</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Matchup — compact card — only show if there's a real opponent */}
              {(()=>{
                const myPicks = weekPicks.filter(p=>p.user_id===user?.id);
                const currentWeekNum = activeLeague.current_week||activeLeague.week||1;
                const currentOpp = liveSchedule.find(w=>w.week===currentWeekNum)?.opp;
                const oppId = liveSchedule.find(w=>w.week===currentWeekNum)?.oppId;
                const targetSize = activeLeague.target_size||activeLeague.max_members||8;
                const leagueIsFull = leagueMembers.length >= targetSize;
                const hasOpponent = leagueMembers.filter(m=>!m.isYou).length > 0;

                if(!leagueIsFull || !hasOpponent) return null;

                const oppUserPicks = oppId ? weekPicks.filter(p=>p.user_id===oppId) : [];
                const oppName = oppUserPicks[0]?.users?.username || oppUserPicks[0]?.users?.email?.split("@")[0] || currentOpp || "Opponent";
                const myTotal = parseFloat(myPicks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1));
                const oppTotal = parseFloat(oppUserPicks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1));
                const myWins = myPicks.filter(p=>p.result==="W").length;
                const myLosses = myPicks.filter(p=>p.result==="L").length;
                const myPending = myPicks.filter(p=>p.result==="pending").length;
                const isWinning = myTotal > oppTotal;
                const isTied = myTotal === oppTotal;

                return (
                  <>
                    <div className="ios-section" style={{margin:"0 16px 6px"}}>
                      <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span>Wk {activeLeague.current_week||activeLeague.week||1} Matchup · Live</span>
                        <span onClick={()=>setScreen("matchup")} style={{color:sport.color,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>View Details</span>
                      </div>
                    </div>
                    <div onClick={()=>setScreen("matchup")} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:16,padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden",border:`1px solid ${sport.color}30`}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${sport.color},${IOS.teal})`}}/>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5,color:sport.color}}>YOU</div>
                          <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{myTotal}pts</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:28,fontWeight:800,letterSpacing:-1,color:"#fff"}}>{myTotal} <span style={{fontSize:16,color:IOS.label3,fontWeight:500}}>–</span> {oppTotal}</div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:isTied?IOS.blue:isWinning?IOS.green:IOS.red,marginTop:2}}>{isTied?"You're Tied":isWinning?"You're Leading":"You're Trailing"}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:18,fontWeight:800,letterSpacing:-0.5}}>{oppName}</div>
                          <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{oppTotal}pts</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,marginTop:12,paddingTop:10,borderTop:`0.5px solid ${IOS.sep}`,alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",gap:5}}>
                          {myPicks.map((p,i)=>(
                            <div key={i} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:p.result==="W"?"rgba(48,209,88,0.15)":p.result==="L"?"rgba(255,69,58,0.12)":"rgba(255,255,255,0.06)",color:p.result==="W"?IOS.green:p.result==="L"?IOS.red:IOS.label3}}>
                              {p.result==="W"?"W":p.result==="L"?"L":"·"}
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:12,color:IOS.label3,display:"flex",alignItems:"center",gap:4}}>
                          {myPending>0&&<span style={{color:sport.color,fontWeight:600}}>{myPending} pending</span>}
                          <span style={{fontSize:16,color:IOS.label3}}>›</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Games available widget — replaces countdown timer */}
              {(()=>{
                const sportBets = liveOdds[activeLeague.sport];
                const gameCount = sportBets ? [...new Set([
                  ...(sportBets.ml||[]).map(b=>b.game),
                  ...(sportBets.spread||[]).map(b=>b.game),
                ])].length : 0;
                const isLive = !!sportBets;
                return (
                  <div className="countdown-bar" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div className="cd-label">Pregame bets available</div>
                      <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>{isLive?"🔴 Live DK · refreshes every 15 min":"Static odds"}</div>
                    </div>
                    <div className="cd-time" style={{fontSize:isLive?28:18,color:isLive?IOS.green:IOS.label3}}>
                      {isLive?gameCount:"—"}
                    </div>
                  </div>
                );
              })()}
              {savedPicks
                ? <button className="ios-btn" style={{background:IOS.green,color:"#000",marginBottom:6}} onClick={()=>setScreen("picks")}>✓ Slip Locked — View or Edit</button>
                : <button className="ios-btn" style={{background:sport.color,color:"#fff",marginBottom:6}} onClick={()=>setScreen("picks")}>{sport.icon} Build Your {sport.label} Slip</button>
              }

              {/* My Locked Picks card */}
              {savedPicks && savedPicks.flexPicks && (
                <div style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:16,overflow:"hidden",border:`1px solid rgba(48,209,88,0.25)`}}>
                  <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${IOS.sep}`}}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.green}}>✓ Week {activeLeague.current_week||activeLeague.week||1} Slip Locked</div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}} onClick={()=>setScreen("picks")}>Edit</div>
                      <div style={{fontSize:12,fontWeight:600,color:IOS.red,cursor:"pointer"}} onClick={async()=>{
                        if(window.confirm("Clear your slip? This cannot be undone.")){
                          if(user){
                            const week = activeLeague.current_week||activeLeague.week||1;
                            await supabase.from("picks").delete()
                              .eq("league_id",activeLeague.id)
                              .eq("user_id",user.id)
                              .eq("week",week);
                          }
                          setSavedPicks(null);
                          setFlexPicks(EMPTY_FLEX);
                          setWeekPicks(prev=>prev.filter(p=>p.user_id!==user?.id));
                          try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${activeLeague.current_week||activeLeague.week||1}`); } catch(e) {}
                        }
                      }}>Clear</div>
                    </div>
                  </div>
                  {[...savedPicks.flexPicks].sort((a,b)=>a.mult-b.mult).map((slot,i)=>{
                    if(!slot.mult) return null;
                    const multColors = {1:IOS.blue, 2:IOS.yellow, 3:IOS.orange, 4:IOS.green, 5:IOS.pink};
                    if(slot.isParlay) {
                      const ls = calcLS(slot.parlayLegs);
                      return (
                        <div key={i} style={{padding:"11px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:multColors[slot.mult],marginBottom:3}}>{slot.mult}× · Longshot · {slot.parlayLegs.length} legs</div>
                              <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{slot.parlayLegs.map(b=>b.pick).join(" + ")}</div>
                            </div>
                            <div style={{fontSize:18,fontWeight:800,color:IOS.pink}}>{ls?.american}</div>
                          </div>
                        </div>
                      );
                    }
                    if(!slot.bet) return null;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:multColors[slot.mult],marginBottom:3}}>
                            {slot.mult}× · {slot.category?{ml:"Moneyline",prop:"Prop",ou:"Over/Under",spread:"Spread",longshot:"Longshot"}[slot.category]||slot.category:"Pick"}
                          </div>
                          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{slot.bet.pick}</div>
                        </div>
                        <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,color:slot.bet.odds.startsWith("+")?IOS.green:IOS.blue}}>{slot.bet.odds}</div>
                      </div>
                    );
                  })}
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
                {wheelSpins > 0 && (
                  <div className="pu-spin-chip" onClick={()=>setShowWheel(true)}>
                    <div style={{fontSize:20}}>🎰</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Spin Wheel</div>
                      <div style={{fontSize:11,color:IOS.purple,fontWeight:500}}>{wheelSpins} spin{wheelSpins!==1?"s":""} available</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Standings preview */}
              <div className="ios-section" style={{margin:"12px 16px 6px"}}>
                <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Standings</span>
                  <span onClick={()=>setScreen("league")} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
                </div>
              </div>
              <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px",overflow:"hidden"}}>
                {[...baseStandings].sort((a,b)=>{
                  const aw=parseInt((a.record||"0-0").split("-")[0])||0;
                  const bw=parseInt((b.record||"0-0").split("-")[0])||0;
                  if(bw!==aw) return bw-aw;
                  return (b.points||0)-(a.points||0);
                }).slice(0,5).map((r,i)=>(
                  <div key={r.rank} className="mini-stand" style={r.isYou||r.name==="You"?{background:"rgba(10,132,255,0.08)"}:{}}>
                    <div className={`ms-rank ${i===0?"top":""}`}>{i+1}</div>
                    <div className={`ms-name ${r.isYou||r.name==="You"?"me":""}`}>{r.isYou||r.name==="You"?"You":r.name}</div>
                    <div className="ms-rec">{r.record}</div>
                    <div className={`ms-units ${String(r.units).startsWith("+")&&r.units!=="0"?"pos":"neg"}`}>{r.points!==undefined?`${r.points}pts`:r.units}</div>
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

            {/* Bet picker sheet */}
            {activeFlexSlot!==null&&(
              <div className="sheet-bg" onClick={()=>{setActiveFlexSlot(null);setFlexCategory(null);setPickSearch("");setLongshotMode("straight");setBetTypeFilter("all");}}>
                <div className="sheet" onClick={e=>e.stopPropagation()}>
                  <div className="sheet-handle"/>
                  <div className="sheet-hdr">
                    <div>
                      <div className="sheet-hdr-title">
                        {flexPicks[activeFlexSlot]?.isParlay ? "Parlay Legs" : flexCategory ? ["Moneyline","Prop","Over/Under","Spread","Longshot"][["ml","prop","ou","spread","longshot"].indexOf(flexCategory)] : "Choose a Bet"}
                      </div>
                      <div className="sheet-hdr-sub">
                        {flexPicks[activeFlexSlot]?.isParlay
                          ? `${flexPicks[activeFlexSlot]?.parlayLegs.length} legs selected — need 2+`
                          : flexCategory ? "Tap to select" : "Pick a category first"}
                      </div>
                    </div>
                    {(()=>{
                      const slot = activeFlexSlot!==null ? flexPicks[activeFlexSlot] : null;
                      const isLongshotParlay = flexCategory==="longshot" && slot?.isParlay;
                      const legs = slot?.parlayLegs||[];
                      const parlayDec = legs.length>=2 ? legs.reduce((acc,b)=>{
                        const dec = b.impliedOdds>0?(b.impliedOdds/100)+1:(100/Math.abs(b.impliedOdds))+1;
                        return acc*dec;
                      },1) : 1;
                      const parlayAm = legs.length>=2 ? (parlayDec>=2?Math.round((parlayDec-1)*100):Math.round(-100/(parlayDec-1))) : 0;
                      const parlayBlocked = isLongshotParlay && legs.length>=2 && parlayAm < 400;
                      const parlayNeedsLegs = isLongshotParlay && legs.length < 2;
                      const blocked = parlayBlocked || parlayNeedsLegs;
                      return (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                          <div className="sheet-done"
                            style={{color:blocked?"rgba(255,255,255,0.25)":"",cursor:blocked?"not-allowed":""}}
                            onClick={()=>{
                              if(blocked) return;
                              setActiveFlexSlot(null);setFlexCategory(null);setPickSearch("");setLongshotMode("straight");
                            }}>Done</div>
                          {parlayBlocked && <div style={{fontSize:10,color:IOS.orange,textAlign:"right"}}>Need +400 odds</div>}
                          {parlayNeedsLegs && <div style={{fontSize:10,color:IOS.orange,textAlign:"right"}}>Add 2+ legs</div>}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Category selector — show if not parlay and no category chosen yet */}
                  {!flexPicks[activeFlexSlot]?.isParlay && !flexCategory && (
                    <div style={{padding:"12px 16px"}}>
                      {(()=>{
                        // Find categories already used by OTHER slots (not the current one being edited)
                        const usedCats = flexPicks
                          .filter((_,i)=>i!==activeFlexSlot)
                          .filter(p=>(p.bet&&p.category&&!p.isParlay)||(p.isParlay&&p.parlayLegs.length>=2))
                          .map(p=>p.isParlay?"longshot":p.category);
                        return [
                          {id:"ml",      label:"Moneyline",  icon:"🎯", color:IOS.blue,   desc:"Pick a team to win"},
                          {id:"prop",    label:"Prop",       icon:"⭐", color:IOS.yellow, desc:"Player or game prop"},
                          {id:"ou",      label:"Over/Under", icon:"📊", color:IOS.orange, desc:"Total points scored"},
                          {id:"spread",  label:"Spread",     icon:"📐", color:IOS.green,  desc:"Beat the point spread"},
                          {id:"longshot",label:"Longshot",   icon:"🚀", color:IOS.pink,   desc:"High odds single bet"},
                        ].map(cat=>{
                          const taken = usedCats.includes(cat.id);
                          return (
                            <div key={cat.id} onClick={()=>{ if(!taken) setFlexCategory(cat.id); }}
                              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 4px",borderBottom:`0.5px solid ${IOS.sep}`,cursor:taken?"not-allowed":"pointer",opacity:taken?0.35:1}}>
                              <div style={{width:40,height:40,borderRadius:12,background:`${cat.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:16,fontWeight:600,color:taken?IOS.label3:"#fff"}}>{cat.label}</div>
                                <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{taken?"Already in your slip":cat.desc}</div>
                              </div>
                              {taken
                                ? <div style={{fontSize:12,fontWeight:700,color:IOS.label3}}>✓ Used</div>
                                : <div style={{fontSize:18,color:IOS.label3}}>›</div>
                              }
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Back button when category chosen */}
                  {!flexPicks[activeFlexSlot]?.isParlay && flexCategory && (
                    <div onClick={()=>setFlexCategory(null)} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",borderBottom:`0.5px solid ${IOS.sep}`}}>
                      <span style={{color:IOS.blue,fontSize:14}}>‹</span>
                      <span style={{color:IOS.blue,fontSize:14,fontWeight:600}}>Categories</span>
                    </div>
                  )}

                  {/* Search */}
                  {/* Straight / Parlay toggle — longshot only */}
                  {flexCategory==="longshot" && (
                    <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:2,margin:"8px 16px 4px",gap:2}}>
                      {["straight","parlay"].map(mode=>(
                        <div key={mode} onClick={()=>{
                          setLongshotMode(mode);
                          setBetTypeFilter("all");
                          // sync isParlay on the active slot
                          if(activeFlexSlot!==null) {
                            setFlexPicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{...p,isParlay:mode==="parlay",bet:null,parlayLegs:[]}:p));
                          }
                        }} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s",
                          background:longshotMode===mode?(mode==="parlay"?IOS.pink:IOS.green):"transparent",
                          color:longshotMode===mode?"#fff":"rgba(255,255,255,0.4)"}}>
                          {mode==="straight"?"🎯 Straight Bet (+400 only)":"🚀 Parlay (build legs)"}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bet type filter pills — longshot only (both straight and parlay) */}
                  {(flexCategory==="longshot") && (
                    <div style={{display:"flex",gap:6,padding:"6px 16px 4px",overflowX:"auto",scrollbarWidth:"none"}}>
                      {[
                        {id:"all",label:"All"},
                        {id:"ml",label:"Moneyline"},
                        {id:"spread",label:"Spread"},
                        {id:"ou",label:"Over/Under"},
                        {id:"prop",label:"Props"},
                      ].map(f=>{
                        const activeColor = longshotMode==="parlay" ? IOS.pink : IOS.green;
                        return (
                          <div key={f.id} onClick={()=>setBetTypeFilter(f.id)}
                            style={{flexShrink:0,padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
                              background:betTypeFilter===f.id?`${activeColor}20`:"rgba(255,255,255,0.06)",
                              color:betTypeFilter===f.id?activeColor:"rgba(255,255,255,0.5)",
                              border:`1px solid ${betTypeFilter===f.id?activeColor+"60":"rgba(255,255,255,0.08)"}`,
                            }}>
                            {f.label}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(flexCategory || flexPicks[activeFlexSlot]?.isParlay) && (
                    <div className="sheet-search-wrap" style={{top:0,position:"relative"}}>
                      <div style={{position:"relative"}}>
                        <input className="sheet-search" placeholder="Search..." value={pickSearch} onChange={e=>setPickSearch(e.target.value)} autoFocus={false} style={{paddingLeft:14}}/>
                        {pickSearch&&<span onClick={()=>setPickSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>✕</span>}
                      </div>
                    </div>
                  )}

                  {/* Parlay legs selected bar */}
                  {flexPicks[activeFlexSlot]?.isParlay && flexPicks[activeFlexSlot]?.parlayLegs.length >= 2 && (
                    <div className="sheet-ls-bar">
                      <span style={{fontSize:12,fontWeight:600,color:IOS.pink}}>🚀 Parlay odds</span>
                      <span style={{fontSize:20,fontWeight:700,color:IOS.pink}}>{calcLS(flexPicks[activeFlexSlot].parlayLegs)?.american}</span>
                    </div>
                  )}

                  {/* Loading state when odds not yet loaded */}
                  {oddsLoading && flexCategory && (
                    <div style={{padding:"32px 16px",textAlign:"center",color:IOS.label3}}>
                      <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${IOS.blue}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/>
                      <div style={{fontSize:13}}>Loading live odds...</div>
                    </div>
                  )}

                  {/* Bet list */}
                  {!oddsLoading && (flexCategory || flexPicks[activeFlexSlot]?.isParlay) && (
                    (flexPicks[activeFlexSlot]?.isParlay ? ALL_BETS : (BETS[flexCategory]||[])).filter(bet=>{
                      const q = pickSearch.toLowerCase().trim();
                      const textMatch = !q || bet.game.toLowerCase().includes(q) || bet.pick.toLowerCase().includes(q);
                      // Longshot straight mode: only show +400 or better
                      if(flexCategory==="longshot" && longshotMode==="straight") {
                        if(!textMatch || bet.impliedOdds < 400) return false;
                        if(betTypeFilter!=="all" && bet.category!==betTypeFilter) return false;
                        return true;
                      }
                      // Parlay longshot — apply bet type filter
                      if(flexCategory==="longshot" && longshotMode==="parlay") {
                        if(!textMatch) return false;
                        if(betTypeFilter!=="all" && bet.category!==betTypeFilter) return false;
                        return true;
                      }
                      return textMatch;
                    }).map(bet=>{
                      const slot = flexPicks[activeFlexSlot];
                      const isCur = slot?.isParlay
                        ? slot.parlayLegs.find(b=>b.id===bet.id)
                        : slot?.bet?.id===bet.id;
                      const pts = slot?.mult ? calcPickPoints(slot.mult, bet.impliedOdds, "W") : 0;
                      return (
                        <div key={bet.id} className="bet-row" style={isCur?{background:"rgba(10,132,255,0.06)"}:{}}
                          onClick={()=>{
                            if(slot?.isParlay) {
                              setFlexPicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{
                                ...p,
                                parlayLegs: p.parlayLegs.find(b=>b.id===bet.id)
                                  ? p.parlayLegs.filter(b=>b.id!==bet.id)
                                  : [...p.parlayLegs, bet]
                              }:p));
                            } else {
                              setFlexPicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{...p,bet,category:flexCategory}:p));
                              setActiveFlexSlot(null);
                              setFlexCategory(null);
                            }
                          }}>
                          <div className="bet-row-left">
                            <div className="bet-row-game">{bet.game}</div>
                            <div className="bet-row-pick">{bet.pick}</div>
                            {slot?.mult&&<div style={{marginTop:5,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(48,209,88,0.1)",border:"1px solid rgba(48,209,88,0.2)",borderRadius:6,padding:"2px 8px"}}>
                              <span style={{fontSize:10,fontWeight:700,color:IOS.green}}>+{pts} pts if win</span>
                            </div>}
                          </div>
                          <div className="bet-row-right">
                            <div className="bet-row-odds" style={{color:bet.odds.startsWith("+")?IOS.green:IOS.blue}}>{bet.odds}</div>
                            <div className={`bet-check ${isCur?"on":"off"}`}>{isCur&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Submitted */}
            {submitted&&(
              <div className="done-screen">
                <div className="done-checkmark">✓</div>
                <div className="done-title">Slip Locked 🔒</div>
                <div style={{fontSize:13,color:IOS.label3,textAlign:"center"}}>Week {activeLeague.current_week||activeLeague.week||1} · {activeLeague.name}</div>
                <div className="done-legs-card">
                  {[...flexPicks].sort((a,b)=>a.mult-b.mult).map((slot,i)=>{
                    if(!slot.mult) return null;
                    if(slot.isParlay) {
                      const ls = calcLS(slot.parlayLegs);
                      return (
                        <div key={i}>
                          <div className="done-leg-row">
                            <div><div className="done-leg-lbl">🚀 {slot.mult}× Parlay · {slot.parlayLegs.length} legs</div></div>
                            <div className="done-leg-odds" style={{color:IOS.pink}}>{ls?.american}</div>
                          </div>
                          {slot.parlayLegs.map(b=>(
                            <div key={b.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 16px 8px 28px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                              <span style={{fontSize:13,color:IOS.label3}}>{b.pick}</span>
                              <span style={{fontSize:14,fontWeight:700,color:b.odds.startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="done-leg-row">
                        <div>
                          <div className="done-leg-lbl">{slot.mult}× · {slot.bet?.pick}</div>
                          <div style={{fontSize:11,color:IOS.label3}}>{slot.bet?.game}</div>
                        </div>
                        <div className="done-leg-odds" style={{color:slot.bet?.odds.startsWith("+")?IOS.green:IOS.blue}}>{slot.bet?.odds}</div>
                      </div>
                    );
                  })}
                </div>
                <button className="ios-btn blue" onClick={()=>{setSubmitted(false);setFlexPicks(EMPTY_FLEX);setScreen("home");}}>Back to Home</button>
              </div>
            )}

            <div className="body">
              <div style={{padding:"8px 16px 14px",display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>{
                  // If editing (no savedPicks) but localStorage has a locked slip, restore it
                  if(!savedPicks) {
                    try {
                      const stored = localStorage.getItem(`linedup_picks_${activeLeague.id}_wk${activeLeague.current_week||activeLeague.week||1}`);
                      if(stored) setSavedPicks(JSON.parse(stored));
                    } catch(e) {}
                  }
                  setScreen("home");
                }} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                <div style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>{savedPicks?"My Slip":"Build Your Slip"}</div>
                {oddsLoading && <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:"rgba(10,132,255,0.1)",borderRadius:8,padding:"3px 8px"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:IOS.blue,animation:"pulse 1s infinite"}}/>
                  <span style={{fontSize:11,fontWeight:600,color:IOS.blue}}>Loading odds</span>
                </div>}
                {!oddsLoading && isLiveOdds && <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:"rgba(255,69,58,0.12)",borderRadius:8,padding:"3px 8px",border:"1px solid rgba(255,69,58,0.25)"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:IOS.red}}/>
                  <span style={{fontSize:11,fontWeight:700,color:IOS.red,letterSpacing:0.5}}>LIVE DK</span>
                </div>}
                {!oddsLoading && oddsError && <div style={{marginLeft:"auto",fontSize:11,color:IOS.orange}}>⚠ Static odds</div>}
                {savedPicks&&!oddsLoading&&<div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
                  <div onClick={()=>{
                    if(savedPicks?.flexPicks) setFlexPicks(savedPicks.flexPicks);
                    setSavedPicks(null);
                  }} style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Edit</div>
                  <div onClick={async()=>{
                    if(window.confirm("Clear your slip? This cannot be undone.")){
                      // Wipe from Supabase
                      if(user) {
                        const week = activeLeague.current_week||activeLeague.week||1;
                        await supabase.from("picks").delete()
                          .eq("league_id", activeLeague.id)
                          .eq("user_id", user.id)
                          .eq("week", week);
                      }
                      // Wipe local state + localStorage
                      setSavedPicks(null);
                      setFlexPicks(EMPTY_FLEX);
                      setWeekPicks(prev=>prev.filter(p=>p.user_id!==user?.id));
                      try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${activeLeague.current_week||activeLeague.week||1}`); } catch(e) {}
                    }
                  }} style={{fontSize:13,fontWeight:600,color:IOS.red,cursor:"pointer"}}>Clear</div>
                </div>}
              </div>

              {/* Locked picks view */}
              {savedPicks && savedPicks.flexPicks ? (
                <div>
                  <div style={{padding:"0 16px 12px"}}>
                    <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>Your Slip</div>
                    <div style={{fontSize:14,color:IOS.label3,marginTop:4}}>{activeLeague.name} · Wk {activeLeague.current_week||activeLeague.week||1} · Locked ✓</div>
                  </div>
                  {[...savedPicks.flexPicks].sort((a,b)=>a.mult-b.mult).map((slot,i)=>{
                    if(!slot.mult) return null;
                    const multColors = {1:IOS.blue, 2:IOS.yellow, 3:IOS.orange, 4:IOS.green, 5:IOS.pink};
                    const col = multColors[slot.mult];
                    if(slot.isParlay) {
                      const ls = calcLS(slot.parlayLegs);
                      return (
                        <div key={i} style={{margin:"0 16px 8px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${col}30`}}>
                          <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:32,height:32,borderRadius:8,background:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:col}}>{slot.mult}×</div>
                              <div style={{fontSize:13,fontWeight:700,color:col}}>🚀 Parlay · {slot.parlayLegs.length} legs</div>
                            </div>
                            <div style={{fontSize:20,fontWeight:800,color:IOS.pink}}>{ls?.american}</div>
                          </div>
                          {slot.parlayLegs.map((b,j)=>(
                            <div key={j} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:j<slot.parlayLegs.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
                              <div>
                                <div style={{fontSize:11,color:IOS.label3,marginBottom:2}}>{b.game}</div>
                                <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{b.pick}</div>
                              </div>
                              <div style={{fontSize:16,fontWeight:800,color:b.odds.startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if(!slot.bet) return null;
                    const pts = calcPickPoints(slot.mult, slot.bet.impliedOdds, "W");
                    return (
                      <div key={i} style={{margin:"0 16px 8px",background:IOS.bg2,borderRadius:14,padding:"14px",border:`1px solid ${col}30`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:32,height:32,borderRadius:8,background:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:col}}>{slot.mult}×</div>
                            <div>
                              <div style={{fontSize:11,color:IOS.label3,marginBottom:2}}>{slot.bet.game}</div>
                              <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{slot.bet.pick}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:20,fontWeight:800,color:slot.bet.odds.startsWith("+")?IOS.green:IOS.blue}}>{slot.bet.odds}</div>
                            <div style={{fontSize:10,color:IOS.green,marginTop:2}}>+{pts} pts</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{height:20}}/>
                </div>
              ) : (
                <>
              <div className="pb-header">
                <div className="pb-title">{sport.icon} {sport.label} Slip</div>
                <div className="pb-sub">{activeLeague.name} · Wk {activeLeague.current_week||activeLeague.week||1}</div>
              </div>

              {/* League filling banner */}
              {leagueMembers.length < (activeLeague.target_size||activeLeague.max_members||8) && (
                <div style={{margin:"0 16px 14px",background:"rgba(255,159,10,0.08)",borderRadius:12,padding:"10px 14px",border:"1px solid rgba(255,159,10,0.2)",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:16,flexShrink:0}}>⚠️</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:IOS.orange}}>League still filling up</div>
                    <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>Matchups start when {activeLeague.target_size||activeLeague.max_members||8} members join · {leagueMembers.length}/{activeLeague.target_size||activeLeague.max_members||8} so far</div>
                  </div>
                </div>
              )}

              {/* Status bar */}
              <div style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:14,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:600,color:IOS.label3}}>Your Slip</div>
                  <div style={{fontSize:13,fontWeight:600,color:allFlexFilled?IOS.green:IOS.blue}}>
                    {flexPicks.filter(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null)).length}/5 picks
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(m=>{
                    const slot = flexPicks.find(p=>p.mult===m);
                    const filled = slot && (slot.isParlay ? slot.parlayLegs.length>=2 : slot.bet!==null);
                    return (
                      <div key={m} style={{flex:1,height:6,borderRadius:3,background:filled?IOS.green:slot?"rgba(10,132,255,0.4)":"rgba(255,255,255,0.1)"}}/>
                    );
                  })}
                </div>
                {!hasParlay&&<div style={{fontSize:11,color:IOS.orange,marginTop:8}}>⚠ One pick must be a Longshot (+400 or better — straight bet or parlay)</div>}
              </div>

              {/* Flex pick slots — compact card design */}
              {flexPicks.map((slot, idx)=>{
                const parlayDec = slot.isParlay && slot.parlayLegs.length>=2 ? calcParlayOddsDecimal(slot.parlayLegs) : 1;
                const parlayAmerican = slot.isParlay && slot.parlayLegs.length>=2 ? parlayAmericanOdds(parlayDec) : 0;
                const parlayValid = slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican >= 400;
                const filled = slot.isParlay ? parlayValid : slot.bet!==null;
                const parlayOdds = slot.isParlay && slot.parlayLegs.length>=2 ? calcLS(slot.parlayLegs) : null;
                const multColors = {1:IOS.blue, 2:IOS.yellow, 3:IOS.orange, 4:IOS.green, 5:IOS.pink};
                const catColors = {ml:IOS.blue, prop:IOS.yellow, ou:IOS.orange, spread:IOS.green, longshot:IOS.pink};
                const catLabels = {ml:"MONEYLINE", prop:"PROP", ou:"OVER/UNDER", spread:"SPREAD", longshot:"LONGSHOT"};
                const appliedPU = activatedPUs[idx];
                const isDouble = appliedPU?.id==="double";
                const isEnhance = appliedPU?.id==="enhance";
                const mult = isDouble ? (slot.mult||1)*2 : (slot.mult||1);
                const pts = slot.isParlay && parlayOdds
                  ? calcPickPoints(mult, parlayOdds.decimal>1?(parlayOdds.decimal-1)*100:0, "W")
                  : slot.bet ? calcPickPoints(mult, slot.bet.impliedOdds, "W") : 0;

                // Build leg rows for display
                const legRows = slot.isParlay ? slot.parlayLegs : slot.bet ? [slot.bet] : [];

                return (
                  <div key={idx} style={{margin:"0 12px 8px",background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:14,overflow:"hidden"}}>

                    {/* Main content row */}
                    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px 10px"}}>

                      {/* Left: type label + legs */}
                      <div style={{flex:1,minWidth:0}} onClick={()=>setActiveFlexSlot(idx)}>
                        {/* Type row */}
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
                          {slot.category ? (
                            <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:catColors[slot.category]||IOS.label3}}>
                              {catLabels[slot.category]||slot.category.toUpperCase()}
                            </span>
                          ) : (
                            <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:IOS.label3}}>PICK {idx+1}</span>
                          )}
                          {slot.isParlay && slot.parlayLegs.length>0 && (
                            <span style={{fontSize:10,color:"#444"}}>· {slot.parlayLegs.length} legs</span>
                          )}
                          {slot.isParlay && parlayValid && (
                            <span style={{fontSize:10,color:IOS.green,fontWeight:600}}>⚡ Longshot</span>
                          )}
                        </div>

                        {/* Leg rows */}
                        {legRows.length===0 ? (
                          <div style={{fontSize:13,color:IOS.label3}}>+ Add a pick</div>
                        ) : legRows.map((leg, li)=>{
                          const isLast = li===legRows.length-1;
                          // Extract team name and detail (spread/total/ML)
                          const pickStr = leg.pick||"";
                          const isPropSlot = slot.category==="prop";

                          // Stat type abbreviations for props
                          const statAbbr = (str) => {
                            if(!str) return "";
                            const s = str.toLowerCase();
                            if(s.includes("strikeout")||s.includes("k")) return "SO";
                            if(s.includes("rbi")) return "RBI";
                            if(s.includes("home run")||s.includes("hr")) return "HR";
                            if(s.includes("hit")&&!s.includes("pitcher")) return "H";
                            if(s.includes("walk")) return "BB";
                            if(s.includes("point")) return "PTS";
                            if(s.includes("rebound")) return "REB";
                            if(s.includes("assist")) return "AST";
                            if(s.includes("three")||s.includes("3-pointer")||s.includes("3pt")) return "3PT";
                            if(s.includes("block")) return "BLK";
                            if(s.includes("steal")) return "STL";
                            if(s.includes("rush yard")) return "RYD";
                            if(s.includes("pass yard")) return "PYD";
                            if(s.includes("rec yard")||s.includes("receiving yard")) return "RYD";
                            if(s.includes("td")||s.includes("touchdown")) return "TD";
                            if(s.includes("reception")||s.includes("catch")) return "REC";
                            if(s.includes("attempt")) return "ATT";
                            if(s.includes("carry")||s.includes("rush att")) return "CAR";
                            return "";
                          };

                          // For props: parse "8+ Strikeouts" → threshold="8+", stat="SO", player from leg.game
                          let acronym, detail;
                          if(isPropSlot) {
                            const threshMatch = pickStr.match(/^((?:Over|Under)?\s*[\d.]+[+\-]?)/i);
                            const threshold = threshMatch ? threshMatch[0].trim() : "";
                            const statPart = pickStr.replace(threshMatch?.[0]||"","").trim();
                            const abbr = statAbbr(statPart)||statAbbr(pickStr)||"PROP";
                            acronym = abbr;
                            detail = threshold || pickStr;
                          } else {
                            const detailMatch = pickStr.match(/([+-]?\d+\.?\d*)(\s*pts)?\s*$/);
                            detail = detailMatch ? detailMatch[0].trim() : (leg.category==="ml"||slot.category==="ml"?"ML":"");
                            const teamRaw = detailMatch ? pickStr.replace(detailMatch[0],"").trim() : pickStr;
                            acronym = getAcronym(teamRaw||pickStr, false);
                          }
                          const game = leg.game||"";
                          const isEnhancedLeg = isEnhance && !slot.isParlay && li===0;

                          return (
                            <div key={li} style={{
                              display:"flex",alignItems:"center",gap:8,
                              paddingBottom:isLast?0:5,
                              marginBottom:isLast?0:5,
                              borderBottom:isLast?"none":"1px solid #222",
                            }}>
                              {/* Stat/Team badge */}
                              <div style={{background:"#2a2a2a",borderRadius:5,padding:"2px 6px",fontSize:11,fontWeight:800,color:"#e0e0e0",letterSpacing:"0.04em",flexShrink:0,minWidth:28,textAlign:"center"}}>
                                {acronym}
                              </div>
                              {/* Threshold / detail */}
                              {detail&&<div style={{fontSize:12,fontWeight:600,color:isEnhancedLeg?IOS.blue:"#d0d0d0",flexShrink:0}}>
                                {detail}
                              </div>}
                              {/* For props: show player name; for teams: show matchup */}
                              <div style={{fontSize:11,color:"#888",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                {isPropSlot ? (leg.game||"") : game}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: odds + actions */}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                        <div style={{fontSize:22,fontWeight:800,color:slot.isParlay?IOS.pink:slot.bet?.odds?.startsWith("+")?IOS.green:IOS.blue,letterSpacing:"-0.5px",lineHeight:1}}>
                          {slot.isParlay&&parlayOdds?parlayOdds.american:slot.bet?.odds||""}
                        </div>
                        <div style={{display:"flex",gap:5}}>
                          <div onClick={()=>setActiveFlexSlot(idx)} style={{background:"#2a2a2a",borderRadius:7,color:"#bbb",fontSize:11,fontWeight:600,padding:"4px 10px",cursor:"pointer"}}>
                            {filled?"Edit":"+ Pick"}
                          </div>
                          {filled&&<button onClick={e=>{e.stopPropagation();setFlexPicks(prev=>prev.map((p,i)=>i===idx?{...EMPTY_FLEX[0],id:i}:p));}} style={{background:"#2a2a2a",border:"none",borderRadius:7,color:"#555",fontSize:14,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                        </div>
                      </div>
                    </div>

                    {/* Parlay toggle — longshot only */}
                    {slot.category==="longshot" && (
                      <>
                      <div style={{padding:"7px 14px 8px",borderTop:"1px solid #222",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <div style={{fontSize:11,color:IOS.label3}}>Make this a Parlay</div>
                          <div style={{fontSize:10,color:"#444",marginTop:1}}>Pick 2+ legs instead of one straight bet</div>
                        </div>
                        <div onClick={()=>setFlexPicks(prev=>prev.map((p,i)=>i===idx?{...p,isParlay:!p.isParlay,bet:null,parlayLegs:[]}:p))}
                          style={{width:40,height:24,borderRadius:12,background:slot.isParlay?IOS.pink:"rgba(255,255,255,0.1)",position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                          <div style={{position:"absolute",top:2,left:slot.isParlay?18:2,width:20,height:20,borderRadius:50,background:"#fff",transition:"left .2s"}}/>
                        </div>
                      </div>
                      {slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican < 400 && (
                        <div style={{padding:"4px 14px 8px"}}>
                          <span style={{fontSize:11,color:IOS.orange}}>⚠ Need +400 combined · Currently {parlayAmerican>0?`+${parlayAmerican}`:parlayAmerican}</span>
                        </div>
                      )}
                      {slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican >= 400 && (
                        <div style={{padding:"4px 14px 8px"}}>
                          <span style={{fontSize:11,color:IOS.green}}>✓ Qualifies as Longshot · +{parlayAmerican}</span>
                        </div>
                      )}
                      </>
                    )}

                    {/* Bottom bar: multipliers + pts if win */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#141414",borderTop:"1px solid #222",padding:"7px 14px",gap:8}}>
                      <div style={{display:"flex",gap:5}}>
                        {[1,2,3,4,5].map(m=>{
                          const taken = usedMults.includes(m) && slot.mult!==m;
                          const active = slot.mult===m;
                          return (
                            <div key={m} onClick={()=>{if(taken)return;setFlexPicks(prev=>prev.map((p,i)=>i===idx?{...p,mult:active?null:m}:p));}}
                              style={{width:34,height:26,borderRadius:7,border:"none",display:"flex",alignItems:"center",justifyContent:"center",
                                background:active?multColors[m]:"#2a2a2a",
                                color:active?"#fff":taken?"rgba(255,255,255,0.1)":"#555",
                                fontSize:11,fontWeight:700,cursor:taken?"not-allowed":"pointer",transition:"background 0.15s,color 0.15s",
                              }}>
                              {m}×
                            </div>
                          );
                        })}
                      </div>
                      {/* Pts + power-up */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {slot.mult&&filled&&<div style={{fontSize:12,fontWeight:700,color:IOS.green,flexShrink:0}}>
                          {isDouble?`+${pts} pts (2️⃣ doubled!)`:isEnhance&&slot.bet?`+${pts} pts 📈`:`+${pts} pts if win`}
                        </div>}
                        {(myPUs.filter(p=>p.type==="offensive").length>0||appliedPU)&&slot.mult&&filled&&(
                          appliedPU ? (
                            <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,background:`${appliedPU.color}15`,border:`1px solid ${appliedPU.color}30`,cursor:"pointer"}}
                              onClick={e=>{e.stopPropagation();const r=appliedPU;if(r?.dbId)supabase.from("league_power_ups").update({used:false}).eq("id",r.dbId);setMyPUs(p=>[...p,r]);setActivatedPUs(p=>{const n={...p};delete n[idx];return n;});}}>
                              <span style={{fontSize:10}}>{appliedPU.icon}</span>
                              <span style={{fontSize:10,fontWeight:700,color:appliedPU.color}}>{appliedPU.name}</span>
                              <span style={{fontSize:9,color:IOS.label3,marginLeft:2}}>✕</span>
                            </div>
                          ) : (
                            <div onClick={e=>{e.stopPropagation();setShowPUModal({context:"picks",slotId:idx,slotLabel:slot.isParlay?"Parlay":slot.bet?.pick||"Pick"});}}
                              style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.12)",cursor:"pointer"}}>
                              <span style={{fontSize:10}}>⚡</span>
                              <span style={{fontSize:10,fontWeight:600,color:IOS.label3}}>Power-Up</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{height:12}}/>
              {(()=>{
                const targetSize = activeLeague.target_size||activeLeague.max_members||8;
                const leagueIsFull = leagueMembers.length >= targetSize;
                if(!leagueIsFull) return (
                  <div style={{margin:"0 16px",background:"rgba(255,159,10,0.08)",borderRadius:14,padding:"16px",textAlign:"center",border:"1px solid rgba(255,159,10,0.2)"}}>
                    <div style={{fontSize:18,marginBottom:6}}>⏳</div>
                    <div style={{fontSize:14,fontWeight:700,color:IOS.orange,marginBottom:4}}>League Not Full Yet</div>
                    <div style={{fontSize:13,color:IOS.label3,marginBottom:10}}>You can lock your slip once the league is full and your schedule is set</div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,height:6,overflow:"hidden",marginBottom:6}}>
                      <div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${IOS.orange},${IOS.yellow})`,width:`${(leagueMembers.length/targetSize)*100}%`}}/>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:IOS.orange}}>Fill League: {leagueMembers.length}/{targetSize} members</div>
                  </div>
                );
                return null;
              })()}
              {(()=>{
                const targetSize = activeLeague.target_size||activeLeague.max_members||8;
                const leagueIsFull = leagueMembers.length >= targetSize;
                if(!leagueIsFull) return null;
                return allFlexFilled && hasParlay
                ? <button className="ios-btn green" onClick={async()=>{
                    if(user) {
                      const week = activeLeague.current_week||activeLeague.week||1;
                      // Delete any existing picks for this user/league/week first
                      const {data:existing} = await supabase
                        .from("picks")
                        .select("id")
                        .eq("league_id", activeLeague.id)
                        .eq("user_id", user.id)
                        .eq("week", week);
                      // Always delete existing picks first to avoid unique constraint violations
                      await supabase.from("picks").delete()
                        .eq("league_id", activeLeague.id)
                        .eq("user_id", user.id)
                        .eq("week", week);

                      const picksToSave = [];
                      flexPicks.forEach((slot, slotIdx)=>{
                        if(!slot.mult) return;
                        const effectiveMult = activatedPUs[slotIdx]?.id==="double" ? slot.mult * 2 : slot.mult;
                        if(slot.isParlay) {
                          // Give each parlay leg a unique slot name to avoid constraint violations
                          slot.parlayLegs.forEach((b, legIdx)=>picksToSave.push({
                            league_id: activeLeague.id,
                            user_id: user.id,
                            week,
                            slot: `longshot_${legIdx}`,
                            multiplier: effectiveMult,
                            pick_name: b.pick,
                            odds: b.odds,
                            implied_odds: b.impliedOdds,
                            result: "pending",
                            points_earned: 0,
                          }));
                        } else {
                          picksToSave.push({
                            league_id: activeLeague.id,
                            user_id: user.id,
                            week,
                            slot: slot.category||"ml",
                            multiplier: effectiveMult,
                            pick_name: slot.bet.pick,
                            odds: slot.bet.odds,
                            implied_odds: slot.bet.impliedOdds,
                            result: "pending",
                            points_earned: 0,
                          });
                        }
                      });
                      if(picksToSave.length) {
                        const {error:insertError} = await supabase.from("picks").insert(picksToSave);
                        if(insertError) { alert("Error saving picks: " + insertError.message); return; }
                      }
                    }
                    const weekNum = activeLeague.current_week||activeLeague.week||1;
                    const locked = {flexPicks, lockedAt: new Date().toISOString()};
                    try { localStorage.setItem(`linedup_picks_${activeLeague.id}_wk${weekNum}`, JSON.stringify(locked)); } catch(e) {}
                    setSavedPicks(locked);
                    setSubmitted(true);
                  }}>🔒 Lock Your Slip 🔒</button>
                : <button className="ios-btn disabled" disabled>
                    {!hasParlay ? "⚠ Need a Longshot (+400 straight or +400 parlay)" : `${flexPicks.filter(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null)).length} / 5 Slots Filled`}
                  </button>;
              })()}
              <div style={{height:20}}/>
            </>
            )}
            </div>
          </>
        )}

        {/* ══ MATCHUP ══ */}
        {screen==="matchup"&&(
          <>
            <div className="body">
              {/* Header */}
              <div style={{padding:"6px 20px 16px"}}>
                <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>Matchup</div>
                <div style={{fontSize:14,fontWeight:500,color:IOS.label3,marginTop:3}}>
                  Week {activeLeague.current_week||activeLeague.week||1} · {activeLeague.name} · Live
                </div>
              </div>

              {(()=>{
                const targetSize = activeLeague.target_size||activeLeague.max_members||8;
                const leagueIsFull = leagueMembers.length >= targetSize;
                const hasOpponent = leagueMembers.filter(m=>!m.isYou).length > 0;

                // League not full yet — no schedule, no matchup
                if(!leagueIsFull) return (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center",gap:12}}>
                    <div style={{fontSize:56,marginBottom:4}}>🔒</div>
                    <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.5,color:"#fff",lineHeight:1.2}}>Matchups Locked Until League is Full</div>
                    <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6,maxWidth:280,marginTop:4}}>
                      Once {targetSize} members join, the schedule auto-generates and your Week 1 matchup goes live.
                    </div>
                    {/* Progress */}
                    <div style={{width:"100%",maxWidth:280,marginTop:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:13,fontWeight:600,color:IOS.label3}}>Members joined</div>
                        <div style={{fontSize:13,fontWeight:700,color:IOS.blue}}>{leagueMembers.length} / {targetSize}</div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,height:8,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${IOS.blue},${IOS.teal})`,width:`${(leagueMembers.length/targetSize)*100}%`,transition:"width .4s"}}/>
                      </div>
                      <div style={{fontSize:12,color:IOS.label3,marginTop:8,textAlign:"center"}}>{targetSize-leagueMembers.length} more player{targetSize-leagueMembers.length!==1?"s":""} needed</div>
                    </div>
                    {activeLeague.isCommissioner && (
                      <div style={{marginTop:8,background:"rgba(10,132,255,0.1)",borderRadius:14,padding:"14px 20px",border:`1px solid ${IOS.blue}30`,width:"100%",maxWidth:280}}>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:IOS.blue,marginBottom:6}}>Invite Code</div>
                        <div style={{fontSize:28,fontWeight:800,letterSpacing:5,color:"#fff",marginBottom:12}}>{activeLeague.invite_code||activeLeague.inviteCode}</div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>shareInvite(activeLeague.invite_code||activeLeague.inviteCode, activeLeague.name)}
                            style={{flex:1,background:IOS.blue,border:"none",borderRadius:10,padding:"10px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                            📤 Share
                          </button>
                          <button onClick={async()=>{const c=activeLeague.invite_code||activeLeague.inviteCode;try{await navigator.clipboard.writeText(c);alert("Copied! ✓");}catch(e){alert(c);}}}
                            style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );

                // No opponent — show empty state
                if(!hasOpponent) return (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 32px",textAlign:"center",gap:16}}>
                    <div style={{fontSize:56}}>🏟️</div>
                    <div style={{fontSize:22,fontWeight:700,letterSpacing:-0.5,color:"#fff"}}>No Matchup Yet</div>
                    <div style={{fontSize:15,color:IOS.label3,lineHeight:1.6}}>You need at least one other member in {activeLeague.name} to have a matchup.</div>
                    <div onClick={()=>setScreen("commissioner")} style={{marginTop:8,background:IOS.blue,borderRadius:12,padding:"12px 24px",fontSize:15,fontWeight:600,color:"#fff",cursor:"pointer"}}>
                      Invite Members →
                    </div>
                  </div>
                );

                // Get my picks and opponent's picks from weekPicks — use schedule to find correct opponent
                const myPicks = weekPicks.filter(p=>p.user_id===user?.id);
                const currentWeekNum = activeLeague.current_week||activeLeague.week||1;
                const currentOpp = liveSchedule.find(w=>w.week===currentWeekNum)?.opp || "Opponent";
                const oppId = liveSchedule.find(w=>w.week===currentWeekNum)?.oppId;

                const oppUserPicks = oppId ? weekPicks.filter(p=>p.user_id===oppId) : [];
                const oppName = oppUserPicks[0]?.users?.username || oppUserPicks[0]?.users?.email?.split("@")[0] || currentOpp;

                // Calculate scores
                const myTotal = myPicks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1);
                const oppTotal = oppUserPicks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1);
                const myWins = myPicks.filter(p=>p.result==="W").length;
                const myLosses = myPicks.filter(p=>p.result==="L").length;
                const myPending = myPicks.filter(p=>p.result==="pending").length;
                const oppWins = oppUserPicks.filter(p=>p.result==="W").length;
                const oppLosses = oppUserPicks.filter(p=>p.result==="L").length;
                const isWinning = parseFloat(myTotal) > parseFloat(oppTotal);
                const isTied = parseFloat(myTotal) === parseFloat(oppTotal);

                // Group my picks by multiplier
                const myPicksByMult = {};
                myPicks.forEach(p=>{
                  const key = p.multiplier;
                  if(!myPicksByMult[key]) myPicksByMult[key]=[];
                  myPicksByMult[key].push(p);
                });

                const multColors = {1:IOS.blue, 2:IOS.yellow, 3:IOS.orange, 4:IOS.green, 5:IOS.pink};
                const slotLabels = {ml:"Moneyline", prop:"Prop", ou:"Over/Under", spread:"Spread", longshot:"Longshot"};
                const rColor = r=>r==="W"?IOS.green:r==="L"?IOS.red:IOS.label3;
                const rLabel = r=>r==="W"?"✓ Win":r==="L"?"✗ Loss":"● Pending";

                return (
                  <>
                    {/* Big score card */}
                    <div style={{margin:"0 16px 14px",background:IOS.bg2,borderRadius:20,padding:"20px",position:"relative",overflow:"hidden",border:`1px solid rgba(10,132,255,0.25)`}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.teal})`}}/>
                      
                      {/* Live badge */}
                      <div style={{textAlign:"center",marginBottom:14}}>
                        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(10,132,255,0.12)",border:"1px solid rgba(10,132,255,0.25)",borderRadius:20,padding:"4px 14px"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:IOS.blue}}/>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:isTied?IOS.blue:isWinning?IOS.green:IOS.red}}>{isTied?"You're Tied":isWinning?"You're Leading":"You're Trailing"}</div>
                        </div>
                      </div>

                      {/* Two scorecards side by side */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center"}}>
                        
                        {/* My scorecard */}
                        <div style={{background:`linear-gradient(135deg,rgba(10,132,255,0.12),rgba(10,132,255,0.06))`,borderRadius:16,padding:"16px 12px",border:"1px solid rgba(10,132,255,0.2)"}}>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:6}}>You</div>
                          <div style={{fontSize:34,fontWeight:800,letterSpacing:-1.5,color:IOS.green,lineHeight:1}}>{myTotal}</div>
                          <div style={{fontSize:10,color:IOS.label3,marginBottom:12}}>points</div>
                          <div style={{display:"flex",gap:6}}>
                            {[{n:myWins,l:"W",c:IOS.green},{n:myLosses,l:"L",c:IOS.red},{n:myPending,l:"P",c:IOS.blue}].map((s,i)=>(
                              <div key={i} style={{flex:1,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                                <div style={{fontSize:16,fontWeight:800,color:s.c,letterSpacing:-0.5}}>{s.n}</div>
                                <div style={{fontSize:9,fontWeight:600,color:IOS.label3,marginTop:1}}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* VS divider */}
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:13,fontWeight:600,color:IOS.label3}}>vs</div>
                        </div>

                        {/* Opp scorecard */}
                        <div style={{background:`linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))`,borderRadius:16,padding:"16px 12px",border:"1px solid rgba(255,255,255,0.08)"}}>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label2,marginBottom:6}}>{oppName}</div>
                          <div style={{fontSize:34,fontWeight:800,letterSpacing:-1.5,color:IOS.label2,lineHeight:1}}>{oppTotal}</div>
                          <div style={{fontSize:10,color:IOS.label3,marginBottom:12}}>points</div>
                          <div style={{display:"flex",gap:6}}>
                            {[{n:oppWins,l:"W",c:IOS.green},{n:oppLosses,l:"L",c:IOS.red},{n:oppUserPicks.filter(p=>p.result==="pending").length,l:"P",c:IOS.blue}].map((s,i)=>(
                              <div key={i} style={{flex:1,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                                <div style={{fontSize:16,fontWeight:800,color:s.c,letterSpacing:-0.5}}>{s.n}</div>
                                <div style={{fontSize:9,fontWeight:600,color:IOS.label3,marginTop:1}}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* My picks */}
                    <div style={{padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Your Slip</div>
                      <div style={{fontSize:12,color:IOS.label3}}>{myPicks.length} picks · {myPending} pending</div>
                    </div>

                    {myPicks.length===0 ? (
                      <div style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,padding:"20px 16px",textAlign:"center",color:IOS.label3,fontSize:14}}>
                        No picks submitted yet
                      </div>
                    ) : (
                      // Group by multiplier and show each slot
                      Object.entries(myPicksByMult).sort((a,b)=>a[0]-b[0]).map(([mult, picks])=>{
                        const col = multColors[parseInt(mult)] || IOS.blue;
                        const isParlay = picks[0]?.slot?.startsWith("longshot_");
                        const parlayLost = isParlay && picks.some(p=>p.result==="L");
                        const parlayWon = isParlay && picks.every(p=>p.result==="W");
                        const parlayPending = isParlay && !parlayLost && !parlayWon;
                        const parlayStatusColor = parlayLost?IOS.red:parlayWon?IOS.green:IOS.orange;
                        const parlayPts = isParlay ? parseFloat(picks.reduce((s,p)=>s+parseFloat(p.points_earned||0),0).toFixed(1)) : 0;
                        return (
                          <div key={mult} style={{margin:"0 16px 8px",background:parlayLost?"rgba(255,69,58,0.06)":IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid ${parlayLost?"rgba(255,69,58,0.25)":parlayWon?"rgba(48,209,88,0.2)":"rgba(255,255,255,0.06)"}`}}>
                            {/* Slot header */}
                            <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${parlayLost?"rgba(255,69,58,0.15)":IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:parlayLost?"rgba(255,69,58,0.08)":"transparent"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:30,height:30,borderRadius:8,background:isParlay?`${parlayStatusColor}20`:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:isParlay?parlayStatusColor:col}}>{mult}×</div>
                                <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:isParlay?parlayStatusColor:col}}>
                                  {isParlay ? `🚀 Longshot · ${picks.length} legs` : slotLabels[picks[0]?.slot]||picks[0]?.slot}
                                </div>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                {isParlay && parlayWon && parlayPts>0 && (
                                  <div style={{fontSize:13,fontWeight:800,color:IOS.green}}>{'+'+parlayPts.toFixed(1)+' pts'}</div>
                                )}
                                <div style={{fontSize:12,fontWeight:700,color:isParlay?parlayStatusColor:picks[0]?.result==="W"?IOS.green:picks[0]?.result==="L"?IOS.red:IOS.orange}}>
                                  {isParlay ? (parlayLost?"❌ Busted":parlayWon?"✓ Hit!":
                                    `${picks.filter(p=>p.result==="W").length}/${picks.length} hit`) : rLabel(picks[0]?.result)}
                                </div>
                              </div>
                            </div>
                            {/* Pick rows — compact breakdown */}
                            {picks.map((pick,j)=>{
                              const won = pick.result==="W";
                              const lost = pick.result==="L";
                              const pending = pick.result==="pending";
                              return (
                                <div key={j} style={{padding:"9px 14px",borderBottom:j<picks.length-1?`0.5px solid ${IOS.sep}`:"none",background:won?"rgba(48,209,88,0.04)":lost?"rgba(255,69,58,0.04)":"transparent",display:"flex",alignItems:"center",gap:10}}>
                                  {/* Result dot */}
                                  <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:won?IOS.green:lost?IOS.red:IOS.label3,opacity:pending?0.4:1}}/>
                                  {/* Pick name */}
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pick.pick_name}</div>
                                  </div>
                                  {/* Odds */}
                                  <div style={{fontSize:13,fontWeight:700,color:pick.odds?.startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{pick.odds}</div>
                                  {/* Points — hide per-leg for parlay */}
                                  {!isParlay && (
                                    <div style={{fontSize:13,fontWeight:800,color:won?IOS.green:lost?"rgba(255,255,255,0.2)":IOS.label3,flexShrink:0,minWidth:52,textAlign:"right"}}>
                                      {pending?"—":won?`+${parseFloat(pick.points_earned||0).toFixed(1)}`:"0"}
                                      <span style={{fontSize:10,fontWeight:500}}> pts</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}

                    {/* Opponent picks */}
                    <div style={{padding:"8px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>{oppName}'s Slip</div>
                      <div style={{fontSize:12,color:IOS.label3}}>{oppUserPicks.length} picks</div>
                    </div>

                    {oppUserPicks.length===0 ? (
                      <div style={{margin:"0 16px 16px",background:IOS.bg2,borderRadius:14,padding:"20px 16px",textAlign:"center",color:IOS.label3,fontSize:14}}>
                        {oppName} hasn't submitted picks yet
                      </div>
                    ) : (
                      Object.entries(oppUserPicks.reduce((acc,p)=>{
                        if(!acc[p.multiplier]) acc[p.multiplier]=[];
                        acc[p.multiplier].push(p);
                        return acc;
                      },{})).sort((a,b)=>a[0]-b[0]).map(([mult, picks])=>{
                        const col = multColors[parseInt(mult)] || IOS.blue;
                        const isParlay = picks[0]?.slot?.startsWith("longshot_");
                        return (
                          <div key={mult} style={{margin:"0 16px 8px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}>
                            <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:30,height:30,borderRadius:8,background:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:col}}>{mult}×</div>
                                <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:col}}>
                                  {isParlay ? `🚀 Longshot · ${picks.length} legs` : slotLabels[picks[0]?.slot]||picks[0]?.slot}
                                </div>
                              </div>
                              <div style={{fontSize:12,fontWeight:700,color:picks[0]?.result==="W"?IOS.green:picks[0]?.result==="L"?IOS.red:IOS.orange}}>
                                {rLabel(picks[0]?.result)}
                              </div>
                            </div>
                            {picks.map((pick,j)=>{
                              const won = pick.result==="W";
                              const lost = pick.result==="L";
                              const pending = pick.result==="pending";
                              return (
                                <div key={j} style={{padding:"9px 14px",borderBottom:j<picks.length-1?`0.5px solid ${IOS.sep}`:"none",background:won?"rgba(48,209,88,0.04)":lost?"rgba(255,69,58,0.04)":"transparent",display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:won?IOS.green:lost?IOS.red:IOS.label3,opacity:pending?0.4:1}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pick.pick_name}</div>
                                  </div>
                                  <div style={{fontSize:13,fontWeight:700,color:pick.odds?.startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{pick.odds}</div>
                                  <div style={{fontSize:13,fontWeight:800,color:won?IOS.green:lost?"rgba(255,255,255,0.2)":IOS.label3,flexShrink:0,minWidth:52,textAlign:"right"}}>
                                    {pending?"—":won?`+${parseFloat(pick.points_earned||0).toFixed(1)}`:"0"}
                                    <span style={{fontSize:10,fontWeight:500}}> pts</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}

                    <div style={{height:16}}/>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* ══ LEAGUES LIST ══ */}
        {screen==="leagues"&&(
          <>
            <div className="body">

              {/* ── NEW LEAGUE MODAL ── */}
              {showNewLeague && (
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",flexDirection:"column",justifyContent:"flex-end",backdropFilter:"blur(8px)"}}
                  onClick={()=>{if(!newLeagueCreated){setShowNewLeague(false);setNewLeagueSport(null);setNewLeagueName("");setNewLeagueSize(8);}}}>
                  <div style={{background:IOS.bg2,borderRadius:"20px 20px 0 0",padding:"0 0 40px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{width:36,height:5,borderRadius:3,background:"rgba(255,255,255,0.2)",margin:"10px auto 0"}}/>

                    {/* Success screen — league created */}
                    {newLeagueCreated ? (
                      <div style={{padding:"24px 24px 8px",textAlign:"center"}}>
                        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
                        <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff",marginBottom:6}}>{newLeagueCreated.name}</div>
                        <div style={{fontSize:14,color:IOS.label3,marginBottom:28}}>Your league is live. Share the invite code.</div>
                        <div style={{background:IOS.bg3,borderRadius:16,padding:"20px 24px",marginBottom:20,border:`1px solid ${IOS.blue}30`}}>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:IOS.blue,marginBottom:8}}>Invite Code</div>
                          <div style={{fontSize:40,fontWeight:800,letterSpacing:6,color:"#fff"}}>{newLeagueCreated.invite_code}</div>
                          <div style={{display:"flex",gap:10,marginTop:16}}>
                            <button onClick={()=>shareInvite(newLeagueCreated.invite_code, newLeagueCreated.name)}
                              style={{flex:1,background:IOS.blue,border:"none",borderRadius:12,padding:"12px",fontFamily:"Manrope,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                              📤 Share Invite
                            </button>
                            <button onClick={async()=>{try{await navigator.clipboard.writeText(newLeagueCreated.invite_code);alert("Copied! ✓");}catch(e){alert(newLeagueCreated.invite_code);}}}
                              style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px",fontFamily:"Manrope,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                              📋 Copy Code
                            </button>
                          </div>
                          <div style={{fontSize:12,color:IOS.label3,marginTop:6}}>Share with friends to join</div>
                        </div>
                        <button onClick={()=>{
                          setActiveLeagueId(newLeagueCreated.id);
                          setShowNewLeague(false);
                          setNewLeagueCreated(null);
                          setNewLeagueSport(null);
                          setNewLeagueName("");
                          setNewLeagueSize(8);
                        }} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"16px",fontFamily:"Manrope,sans-serif",fontSize:17,fontWeight:600,color:"#fff",cursor:"pointer"}}>
                          Go to My League →
                        </button>
                      </div>
                    ) : (
                      <div style={{padding:"20px 20px 0"}}>
                        <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff",marginBottom:4}}>New League</div>
                        <div style={{fontSize:14,color:IOS.label3,marginBottom:20}}>Pick a sport and name your league</div>

                        {/* Sport selector */}
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,marginBottom:10}}>Sport</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
                          {[
                            {id:"nfl", icon:"🏈", label:"NFL",   color:IOS.blue},
                            {id:"nba", icon:"🏀", label:"NBA",   color:"#FF6B35"},
                            {id:"mlb", icon:"⚾", label:"MLB",   color:IOS.green},
                          ].map(sp=>(
                            <div key={sp.id} onClick={()=>setNewLeagueSport(sp.id)}
                              style={{borderRadius:14,padding:"14px 8px",textAlign:"center",cursor:"pointer",transition:"all .15s",
                                background:newLeagueSport===sp.id?`${sp.color}20`:"rgba(255,255,255,0.05)",
                                border:`1.5px solid ${newLeagueSport===sp.id?sp.color:"rgba(255,255,255,0.08)"}`,
                              }}>
                              <div style={{fontSize:26,marginBottom:6}}>{sp.icon}</div>
                              <div style={{fontSize:13,fontWeight:700,color:newLeagueSport===sp.id?sp.color:"rgba(255,255,255,0.6)"}}>{sp.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* League name input */}
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,marginBottom:10}}>League Name</div>
                        <input
                          value={newLeagueName}
                          onChange={e=>setNewLeagueName(e.target.value)}
                          placeholder="e.g. The Boys League"
                          style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:16,fontFamily:"Manrope,sans-serif",outline:"none",marginBottom:24,boxSizing:"border-box"}}
                        />

                        {/* League size picker */}
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,marginBottom:10}}>League Size</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:24}}>
                          {[6,8,10,12].map(sz=>(
                            <div key={sz} onClick={()=>setNewLeagueSize(sz)}
                              style={{borderRadius:12,padding:"12px 4px",textAlign:"center",cursor:"pointer",transition:"all .15s",
                                background:newLeagueSize===sz?`${IOS.blue}20`:"rgba(255,255,255,0.05)",
                                border:`1.5px solid ${newLeagueSize===sz?IOS.blue:"rgba(255,255,255,0.08)"}`,
                              }}>
                              <div style={{fontSize:20,fontWeight:800,color:newLeagueSize===sz?IOS.blue:"rgba(255,255,255,0.6)"}}>{sz}</div>
                              <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>players</div>
                            </div>
                          ))}
                        </div>

                        {/* Create button */}
                        <button
                          disabled={!newLeagueSport||!newLeagueName.trim()||creatingLeague}
                          onClick={()=>createLeague(newLeagueName.trim(), newLeagueSport)}
                          style={{width:"100%",background:newLeagueSport&&newLeagueName.trim()?IOS.blue:"rgba(255,255,255,0.1)",border:"none",borderRadius:14,padding:"16px",fontFamily:"Manrope,sans-serif",fontSize:17,fontWeight:600,color:newLeagueSport&&newLeagueName.trim()?"#fff":"rgba(255,255,255,0.3)",cursor:newLeagueSport&&newLeagueName.trim()?"pointer":"default",transition:"all .2s"}}
                        >
                          {creatingLeague ? "Creating..." : "Create League"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{padding:"6px 20px 18px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>My Leagues</div>
                  <div style={{fontSize:14,fontWeight:500,color:IOS.label3,marginTop:3}}>{realLeagues.length} active league{realLeagues.length!==1?"s":""}</div>
                </div>
                <div onClick={()=>{setShowNewLeague(true);setNewLeagueCreated(null);setNewLeagueSport(null);setNewLeagueName("");}}
                  style={{background:IOS.blue,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>+ New</div>
              </div>

              {/* League cards */}
              {leaguesLoading ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${IOS.blue}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
                  <div style={{fontSize:14,color:IOS.label3}}>Loading your leagues...</div>
                </div>
              ) : realLeagues.length === 0 ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 32px",textAlign:"center",gap:12}}>
                  <div style={{fontSize:56,marginBottom:4}}>🏆</div>
                  <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff"}}>No Leagues Yet</div>
                  <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6,maxWidth:260}}>Create your first league and invite your friends to get started.</div>
                  <button onClick={()=>{setShowNewLeague(true);setNewLeagueCreated(null);setNewLeagueSport(null);setNewLeagueName("");setNewLeagueSize(8);}}
                    style={{marginTop:8,background:IOS.blue,border:"none",borderRadius:14,padding:"14px 32px",fontFamily:"Manrope,sans-serif",fontSize:16,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                    + Create a League
                  </button>
                  <div style={{fontSize:13,color:IOS.label3}}>or</div>
                  <div onClick={async()=>{
                    const code=prompt("Enter invite code:");
                    if(!code) return;
                    const {data:league,error}=await supabase.from("leagues").select().eq("invite_code",code.toUpperCase().trim()).single();
                    if(error||!league){alert("League not found.");return;}
                    // Check capacity before joining
                    const {data:currentMembers}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
                    const targetSize = league.target_size||league.max_members||8;
                    if(currentMembers && currentMembers.length >= targetSize){alert(`This league is already full (${targetSize}/${targetSize} members).`);return;}
                    const {error:joinError}=await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
                    if(joinError){alert("Error joining. You may already be a member.");return;}
                    const {data:allMembers}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
                    if(allMembers && allMembers.length === targetSize) {
                      await generateSchedule(league.id, allMembers.map(m=>m.user_id), league.season_weeks||18);
                      alert(`Joined ${league.name}! 🎉 League is full — schedule generated!`);
                    } else {
                      alert(`Joined ${league.name}! Welcome. ${targetSize-allMembers.length} more player${targetSize-allMembers.length!==1?"s":""} needed.`);
                    }
                    fetchLeagues(user.id);
                  }} style={{fontSize:14,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Join with Invite Code</div>
                </div>
              ) : realLeagues.map(lg=>{
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
                // Check capacity before joining
                const {data:currentMems}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
                const targetSize = league.target_size||league.max_members||8;
                if(currentMems && currentMems.length >= targetSize){alert(`This league is already full (${targetSize}/${targetSize} members).`);return;}
                const {error:joinError}=await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
                if(joinError){alert("Error joining. You may already be a member.");return;}
                const {data:allMembers}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
                if(allMembers && allMembers.length === targetSize) {
                  const memberIds = allMembers.map(m=>m.user_id);
                  await generateSchedule(league.id, memberIds, league.season_weeks||18);
                  alert(`Joined ${league.name}! 🎉 League is full — schedule has been generated!`);
                } else {
                  alert(`Joined ${league.name}! Welcome. ${targetSize - allMembers.length} more player${targetSize-allMembers.length!==1?"s":""} needed to start the season.`);
                }
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
                {[{id:"grade",l:"Grade Slips"},{id:"members",l:"Members"},{id:"settings",l:"Settings"}].map(t=>(
                  <div key={t.id} onClick={()=>setCommishTab(t.id)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",background:commishTab===t.id?IOS.bg2:"transparent",color:commishTab===t.id?"#fff":IOS.label3,boxShadow:commishTab===t.id?"0 1px 3px rgba(0,0,0,0.4)":"none"}}>{t.l}</div>
                ))}
              </div>

              {/* GRADE PICKS tab */}
              {commishTab==="grade"&&(
                <>
                  <div style={{padding:"0 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Week {activeLeague.current_week||activeLeague.week||1}</div>
                    <div style={{fontSize:12,color:IOS.orange,fontWeight:600}}>{weekPicks.filter(p=>p.result==="pending").length} pending</div>
                  </div>

                  {weekPicks.length===0&&(
                    <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,padding:"24px 16px",textAlign:"center",color:IOS.label3,fontSize:15}}>
                      No picks submitted yet this week
                    </div>
                  )}

                  {/* Member selector tabs */}
                  {weekPicks.length>0&&(()=>{
                    const memberGroups = weekPicks.reduce((acc,p)=>{
                      const uid = p.user_id;
                      if(!acc[uid]) acc[uid]={userId:uid, name:p.users?.username||p.users?.email?.split("@")[0]||"Unknown", picks:[]};
                      acc[uid].picks.push(p);
                      return acc;
                    },{});
                    const memberList = Object.entries(memberGroups);
                    const activeMemberId = selectedGradeMember || memberList[0]?.[0];
                    const activeMemberData = memberGroups[activeMemberId];

                    return (
                      <>
                      {/* Member pills */}
                      <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 16px 10px",scrollbarWidth:"none"}}>
                        {memberList.map(([uid, md])=>{
                          const pending = md.picks.filter(p=>p.result==="pending").length;
                          const allGraded = pending===0;
                          const isActive = uid===activeMemberId;
                          return (
                            <div key={uid} onClick={()=>setSelectedGradeMember(uid)}
                              style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:20,cursor:"pointer",transition:"all .15s",
                                background:isActive?"rgba(10,132,255,0.15)":"rgba(255,255,255,0.06)",
                                border:`1px solid ${isActive?IOS.blue+"60":allGraded?"rgba(48,209,88,0.3)":"rgba(255,255,255,0.08)"}`,
                              }}>
                              <span style={{fontSize:12,fontWeight:700,color:isActive?IOS.blue:allGraded?IOS.green:"rgba(255,255,255,0.6)"}}>{md.name}</span>
                              {!allGraded&&<span style={{fontSize:10,fontWeight:700,color:IOS.orange,background:"rgba(255,159,10,0.15)",borderRadius:10,padding:"1px 6px"}}>{pending}</span>}
                              {allGraded&&<span style={{fontSize:10}}>✓</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Active member picks */}
                      {activeMemberData&&(()=>{
                        const slotColors={ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};
                        const memberTotal = activeMemberData.picks.filter(p=>p.result==="W").reduce((sum,p)=>{
                          const dec = p.implied_odds?(p.implied_odds>0?p.implied_odds/100:100/Math.abs(p.implied_odds)):0.91;
                          return sum+parseFloat((p.multiplier*dec*10).toFixed(1));
                        },0).toFixed(1);
                        const isYou = activeMemberId===user?.id;
                        const pendingCount = activeMemberData.picks.filter(p=>p.result==="pending").length;
                        const uid = activeMemberId;
                        const memberData = activeMemberData;
                        return (
                      <div style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
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
                                    if(pick.slot?.startsWith("longshot_")) {
                                      // Parlay leg win
                                      await supabase.from("picks").update({result:"W",points_earned:0}).eq("id",pick.id);
                                      const updatedPicks = weekPicks.map(p=>p.id===pick.id?{...p,result:"W",points_earned:0}:p);
                                      const parlayLegs = updatedPicks.filter(p=>p.user_id===pick.user_id&&p.multiplier===pick.multiplier&&p.slot?.startsWith("longshot_"));
                                      const allWon = parlayLegs.every(p=>p.result==="W");
                                      if(allWon) {
                                        const dec = parlayLegs.reduce((acc,p)=>{
                                          const d = p.implied_odds>0?(p.implied_odds/100)+1:(100/Math.abs(p.implied_odds||110))+1;
                                          return acc*d;
                                        },1);
                                        const totalPts = parseFloat((pick.multiplier*(dec-1)*10).toFixed(1));
                                        await supabase.from("picks").update({points_earned:totalPts}).eq("id",parlayLegs[0].id);
                                        setWeekPicks(updatedPicks.map(p=>p.id===parlayLegs[0].id?{...p,points_earned:totalPts}:p));
                                      } else {
                                        setWeekPicks(updatedPicks);
                                      }
                                    } else {
                                      // Straight bet win (including straight longshot)
                                      const pts = parseFloat((pick.multiplier*(pick.implied_odds>0?pick.implied_odds/100:100/Math.abs(pick.implied_odds||110))*10).toFixed(1));
                                      await supabase.from("picks").update({result:"W",points_earned:pts}).eq("id",pick.id);
                                      setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"W",points_earned:pts}:p));
                                    }
                                    fetchStandings(activeLeagueId);
                                  }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="W"?IOS.green:"rgba(48,209,88,0.12)",color:pick.result==="W"?"#000":IOS.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Win</button>
                                  <button onClick={async()=>{
                                    if(pick.slot?.startsWith("longshot_")) {
                                      // Parlay — mark ALL legs as loss
                                      await supabase.from("picks").update({result:"L",points_earned:0})
                                        .eq("user_id", pick.user_id).eq("multiplier", pick.multiplier);
                                      setWeekPicks(prev=>prev.map(p=>
                                        p.user_id===pick.user_id&&p.multiplier===pick.multiplier&&p.slot?.startsWith("longshot_")
                                          ? {...p,result:"L",points_earned:0} : p
                                      ));
                                    } else {
                                      // Straight bet (including straight longshot)
                                      await supabase.from("picks").update({result:"L",points_earned:0}).eq("id",pick.id);
                                      setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"L",points_earned:0}:p));
                                    }
                                    fetchStandings(activeLeagueId);
                                  }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="L"?IOS.red:"rgba(255,69,58,0.12)",color:pick.result==="L"?"#fff":IOS.red,fontSize:12,fontWeight:700,cursor:"pointer"}}>✗ Loss</button>
                                  {pick.result!=="pending"&&(
                                    <button onClick={async()=>{
                                      await supabase.from("picks").update({result:"pending",points_earned:0}).eq("id",pick.id);
                                      setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"pending",points_earned:0}:p));
                                      fetchStandings(activeLeagueId);
                                    }} style={{padding:"7px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:IOS.label3,fontSize:12,fontWeight:700,cursor:"pointer"}}>↩</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* Mark remaining as Loss button */}
                        {pendingCount>0&&(
                          <div style={{padding:"10px 14px",borderTop:`0.5px solid ${IOS.sep}`,display:"flex",gap:8}}>
                            <button onClick={async()=>{
                              if(!window.confirm(`Mark all ${pendingCount} pending picks as Loss?`)) return;
                              const pendingPicks = memberData.picks.filter(p=>p.result==="pending");
                              for(const pick of pendingPicks) {
                                if(pick.slot==="longshot"||pick.slot?.startsWith("longshot_")) {
                                  await supabase.from("picks").update({result:"L",points_earned:0})
                                    .eq("user_id",pick.user_id).eq("multiplier",pick.multiplier).eq("slot","longshot");
                                  setWeekPicks(prev=>prev.map(p=>p.user_id===pick.user_id&&p.multiplier===pick.multiplier&&p.slot==="longshot"||p.slot?.startsWith("longshot_")?{...p,result:"L",points_earned:0}:p));
                                } else {
                                  await supabase.from("picks").update({result:"L",points_earned:0}).eq("id",pick.id);
                                  setWeekPicks(prev=>prev.map(p=>p.id===pick.id?{...p,result:"L",points_earned:0}:p));
                                }
                              }
                              fetchStandings(activeLeagueId);
                            }} style={{flex:1,background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:8,padding:"8px",fontFamily:"Manrope,sans-serif",fontSize:12,fontWeight:700,color:IOS.red,cursor:"pointer"}}>
                              ✗ Mark {pendingCount} pending as Loss
                            </button>
                          </div>
                        )}
                      {/* Submit Picks button */}
                      <div style={{padding:"10px 14px",borderTop:`0.5px solid ${IOS.sep}`}}>
                        <button onClick={async()=>{
                          // Use current weekPicks state (already updated by Win/Loss button clicks)
                          const userPicks = weekPicks.filter(p=>p.user_id===uid);
                          // Group by multiplier
                          const multGroups = {};
                          userPicks.forEach(p=>{
                            if(!multGroups[p.multiplier]) multGroups[p.multiplier]=[];
                            multGroups[p.multiplier].push(p);
                          });
                          // Write all results + points to DB sequentially with error logging
                          let errors = [];
                          for(const [mult, picks] of Object.entries(multGroups)){
                            const isParlay = picks[0]?.slot?.startsWith("longshot_");
                            if(isParlay){
                              const allWon = picks.every(p=>p.result==="W");
                              const anyLost = picks.some(p=>p.result==="L");
                              if(allWon){
                                const dec = picks.reduce((acc,p)=>{
                                  const d = p.implied_odds>0?(p.implied_odds/100)+1:(100/Math.abs(p.implied_odds||110))+1;
                                  return acc*d;
                                },1);
                                const totalPts = parseFloat((parseInt(mult)*(dec-1)*10).toFixed(1));
                                for(const p of picks){
                                  const {error} = await supabase.from("picks").update({result:"W", points_earned:p.id===picks[0].id?totalPts:0}).eq("id",p.id);
                                  if(error) errors.push(`id:${p.id} ${error.message}`);
                                }
                              } else if(anyLost){
                                for(const p of picks){
                                  const {error} = await supabase.from("picks").update({result:p.result==="W"?"W":"L", points_earned:0}).eq("id",p.id);
                                  if(error) errors.push(`id:${p.id} ${error.message}`);
                                }
                              }
                            } else {
                              for(const pick of picks){
                                if(pick.result==="W"){
                                  const pts = parseFloat((pick.multiplier*(pick.implied_odds>0?pick.implied_odds/100:100/Math.abs(pick.implied_odds||110))*10).toFixed(1));
                                  const {error} = await supabase.from("picks").update({result:"W", points_earned:pts}).eq("id",pick.id);
                                  if(error) errors.push(`id:${pick.id} ${error.message}`);
                                } else if(pick.result==="L"){
                                  const {error} = await supabase.from("picks").update({result:"L", points_earned:0}).eq("id",pick.id);
                                  if(error) errors.push(`id:${pick.id} ${error.message}`);
                                }
                              }
                            }
                          }

                          // All writes done — now refresh
                          const week = activeLeague.current_week||activeLeague.week||1;
                          await fetchWeekPicks(activeLeague.id, week);
                          await fetchStandings(activeLeagueId);
                          // 🔔 PUSH TRIGGER: notif_grades — notify user their picks were graded
                          // await fetch('/api/notify', {method:'POST',headers:{'Content-Type':'application/json'},
                          //   body:JSON.stringify({userId:uid, title:'Picks Graded!',
                          //     body:`Your Week ${week} picks have been graded. Check your results!`,
                          //     data:{screen:'matchup'}})});
                          alert(memberData.name+"'s picks submitted!");
                        }} style={{width:"100%",background:"linear-gradient(135deg,"+IOS.blue+","+IOS.indigo+")",border:"none",borderRadius:10,padding:"12px",fontFamily:"Manrope,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",letterSpacing:-0.2}}>
                          ✓ Submit Picks for {memberData.name}
                        </button>
                      </div>
                      </div>
                        );
                      })()}
                      </>
                    );
                  })()}
                </>
              )}

              {/* MEMBERS tab */}
              {commishTab==="members"&&(
                <>
                  <div style={{padding:"0 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>{leagueMembers.length} / {activeLeague.max_members||activeLeague.settings?.maxMembers||8} members</div>
                    
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
                    <div style={{fontSize:12,color:IOS.label3,marginBottom:12}}>Share this code with friends to join</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>shareInvite(activeLeague.invite_code||activeLeague.inviteCode, activeLeague.name)}
                        style={{flex:1,background:IOS.blue,border:"none",borderRadius:10,padding:"10px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                        📤 Share
                      </button>
                      <button onClick={async()=>{const c=activeLeague.invite_code||activeLeague.inviteCode;try{await navigator.clipboard.writeText(c);alert("Copied! ✓");}catch(e){alert(c);}}}
                        style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SETTINGS tab */}
              {commishTab==="settings"&&(
                <>
                  {/* ── Week Management ── */}
                  <div style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
                    <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Week Management</div>
                      <div style={{fontSize:22,fontWeight:800,color:IOS.blue}}>Wk {activeLeague.current_week||1}</div>
                    </div>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{fontSize:14,color:"#fff",marginBottom:4}}>Week {activeLeague.current_week||1} of {activeLeague.season_weeks||18}</div>
                      <div style={{fontSize:12,color:IOS.orange,marginBottom:14}}>⚠ Auto-grade runs hourly. You can also trigger it manually below.</div>
                      {/* Auto-grade button */}
                      <button onClick={async()=>{
                        try {
                          const r = await fetch("/api/grade", {
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body: JSON.stringify({leagueId: activeLeague.id})
                          });
                          const d = await r.json();
                          if(d.ok) {
                            await fetchWeekPicks(activeLeague.id, activeLeague.current_week||1);
                            await fetchStandings(activeLeague.id);
                            alert(`✅ Auto-grade complete!\nGraded: ${d.graded} picks\nSkipped: ${d.skipped} (props or incomplete games)`);
                          } else {
                            alert("Grade error: " + (d.error||"Unknown"));
                          }
                        } catch(e) { alert("Failed to reach grade API: " + e.message); }
                      }} style={{width:"100%",background:"rgba(10,132,255,0.15)",border:"1px solid rgba(10,132,255,0.3)",borderRadius:12,padding:"12px",fontFamily:"Manrope,sans-serif",fontSize:14,fontWeight:700,color:IOS.blue,cursor:"pointer",marginBottom:10}}>
                        ⚡ Run Auto-Grade Now
                      </button>
                      <button onClick={async()=>{
                        if(!window.confirm(`End Week ${activeLeague.current_week||1} and start Week ${(activeLeague.current_week||1)+1}? Make sure all slips are graded first.`)) return;
                        setAdvancingWeek(true);
                        const currentWeek = activeLeague.current_week||1;
                        const nextWeek = currentWeek + 1;

                        // Tally points per user for this week
                        const {data:weekPicksAll} = await supabase
                          .from("picks")
                          .select("user_id, points_earned")
                          .eq("league_id", activeLeague.id)
                          .eq("week", currentWeek)
                          .eq("result","W");

                        const totals = {};
                        (weekPicksAll||[]).forEach(p=>{
                          totals[p.user_id]=(totals[p.user_id]||0)+parseFloat(p.points_earned||0);
                        });

                        // Fetch this week's matchups and write winner_id for each
                        const {data:weekMatchups} = await supabase
                          .from("matchups")
                          .select("id, user1_id, user2_id")
                          .eq("league_id", activeLeague.id)
                          .eq("week", currentWeek)
                          .is("winner_id", null);

                        for(const m of (weekMatchups||[])) {
                          const p1 = totals[m.user1_id]||0;
                          const p2 = totals[m.user2_id]||0;
                          const winnerId = p1 >= p2 ? m.user1_id : m.user2_id;
                          const u1pts = parseFloat(p1.toFixed(1));
                          const u2pts = parseFloat(p2.toFixed(1));
                          await supabase.from("matchups").update({
                            winner_id: winnerId,
                            user1_points: u1pts,
                            user2_points: u2pts,
                          }).eq("id", m.id);
                        }

                        // Advance week
                        await supabase.from("leagues").update({current_week: nextWeek}).eq("id", activeLeague.id);

                        // Store week result in DB for each user to see on next login
                        for(const m of (weekMatchups||[])) {
                          const p1 = totals[m.user1_id]||0;
                          const p2 = totals[m.user2_id]||0;
                          const winnerId = p1 >= p2 ? m.user1_id : m.user2_id;
                          for(const [uid, myPts, oppId, oppPts] of [
                            [m.user1_id, p1, m.user2_id, p2],
                            [m.user2_id, p2, m.user1_id, p1],
                          ]) {
                            await supabase.from("users").update({
                              pending_result: JSON.stringify({
                                won: winnerId===uid,
                                myPts: parseFloat(myPts.toFixed(1)),
                                oppPts: parseFloat(oppPts.toFixed(1)),
                                week: currentWeek,
                              })
                            }).eq("id", uid);
                          }
                        }

                        // Wheel spin for top scorer
                        if(weekPicksAll && weekPicksAll.length > 0) {
                          const topScorerId = Object.entries(totals).sort((a,b)=>b[1]-a[1])[0]?.[0];
                          if(topScorerId === user.id) {
                            setWheelSpins(s=>s+1);
                            await supabase.from("league_members")
                              .update({wheel_spins: wheelSpins+1})
                              .eq("league_id", activeLeague.id)
                              .eq("user_id", user.id);
                            alert(`✅ Advanced to Week ${nextWeek}! You were the top scorer — you earned a 🎰 Wheel Spin!`);
                          } else {
                            alert(`✅ Advanced to Week ${nextWeek}! Slips have been reset.`);
                          }
                        } else {
                          alert(`✅ Advanced to Week ${nextWeek}! Slips have been reset.`);
                        }

                        // 🔔 PUSH TRIGGER: notif_results — notify all users of weekly result
                        // for(const m of (weekMatchups||[])) {
                        //   for(const uid of [m.user1_id, m.user2_id]) {
                        //     const won = (totals[uid]||0) >= (totals[uid===m.user1_id?m.user2_id:m.user1_id]||0);
                        //     await fetch('/api/notify', {method:'POST',headers:{'Content-Type':'application/json'},
                        //       body:JSON.stringify({userId:uid,
                        //         title: won ? 'You Won This Week! 🏆' : 'Week Result',
                        //         body: won ? `You won Week ${currentWeek}! Check your standings.`
                        //                   : `Week ${currentWeek} is over. Better luck next week!`,
                        //         data:{screen:'matchup'}})});
                        //   }
                        // }
                        await fetchLeagues(user.id);
                        await fetchStandings(activeLeague.id);
                        await fetchSchedule(activeLeague.id, user.id);
                        setSavedPicks(null);
                        setFlexPicks(EMPTY_FLEX);
                        try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${currentWeek}`); } catch(e) {}
                        setAdvancingWeek(false);
                      }} style={{width:"100%",background:advancingWeek?"rgba(255,255,255,0.08)":IOS.green,border:"none",borderRadius:12,padding:"14px",fontFamily:"Manrope,sans-serif",fontSize:15,fontWeight:700,color:advancingWeek?"rgba(255,255,255,0.3)":"#000",cursor:advancingWeek?"default":"pointer"}}>
                        {advancingWeek ? "Advancing..." : `⏭ End Week ${activeLeague.current_week||1} · Start Week ${(activeLeague.current_week||1)+1}`}
                      </button>
                    </div>
                  </div>

                  {/* ── League Size ── */}
                  <div style={{margin:"0 16px 12px",background:IOS.bg2,borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
                    <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                      <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>League Size</div>
                      <div style={{fontSize:12,color:IOS.label3,marginTop:4}}>
                        {leagueMembers.length} / {activeLeague.target_size||activeLeague.max_members||8} members
                        {leagueMembers.length >= (activeLeague.target_size||activeLeague.max_members||8)
                          ? <span style={{color:IOS.green,fontWeight:700}}> · Full ✓</span>
                          : <span style={{color:IOS.orange}}> · {(activeLeague.target_size||activeLeague.max_members||8)-leagueMembers.length} spots left</span>
                        }
                      </div>
                    </div>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,marginBottom:10}}>Change Target Size</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:10}}>
                        {[6,8,10,12].map(sz=>{
                          const cur = activeLeague.target_size||activeLeague.max_members||8;
                          return (
                            <div key={sz} onClick={async()=>{
                              if(sz===cur) return;
                              if(!window.confirm(`Change league size to ${sz}? This will wipe the current schedule and regenerate it when the league fills.`)) return;
                              await supabase.from("leagues").update({target_size:sz, max_members:sz}).eq("id", activeLeague.id);
                              // Only wipe matchups/schedule — keep picks intact
                              await supabase.from("matchups").delete().eq("league_id", activeLeague.id);
                              await fetchLeagues(user.id);
                              alert(`League size updated to ${sz}. Schedule will regenerate when the league is full. Existing picks are preserved.`);
                            }}
                              style={{borderRadius:12,padding:"12px 4px",textAlign:"center",cursor:sz===cur?"default":"pointer",transition:"all .15s",
                                background:sz===cur?`${IOS.blue}20`:"rgba(255,255,255,0.05)",
                                border:`1.5px solid ${sz===cur?IOS.blue:"rgba(255,255,255,0.08)"}`,
                              }}>
                              <div style={{fontSize:20,fontWeight:800,color:sz===cur?IOS.blue:"rgba(255,255,255,0.5)"}}>{sz}</div>
                              <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>players</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{fontSize:11,color:IOS.label3}}>Changing size wipes the current schedule. It regenerates automatically when the league fills.</div>
                    </div>
                  </div>

                  {/* ── Danger Zone ── */}
                  <div style={{margin:"0 16px 24px"}}>
                    <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:IOS.red,padding:"0 4px",marginBottom:6}}>Danger Zone</div>
                    <div style={{background:IOS.bg2,borderRadius:14,overflow:"hidden"}}>
                      <div onClick={async()=>{
                        if(!window.confirm(`Delete "${activeLeague.name}" permanently? This cannot be undone. All picks, matchups and members will be removed.`)) return;
                        // Delete all related data first
                        await supabase.from("picks").delete().eq("league_id", activeLeague.id);
                        await supabase.from("matchups").delete().eq("league_id", activeLeague.id);
                        await supabase.from("league_members").delete().eq("league_id", activeLeague.id);
                        await supabase.from("league_power_ups").delete().eq("league_id", activeLeague.id);
                        // Delete the league itself
                        const {error} = await supabase.from("leagues").delete().eq("id", activeLeague.id);
                        if(error){ alert("Error deleting league: " + error.message); return; }
                        // Reset local state
                        setRealLeagues(prev => prev.filter(l => l.id !== activeLeague.id));
                        setActiveLeagueId(null);
                        setScreen("home");
                        alert(`"${activeLeague.name}" has been deleted.`);
                      }} style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
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
            <div className="body">
              <div style={{padding:"0 20px 12px"}}>
                <div className="nav-title-large">{activeLeague.name||"My League"}</div>
                <div className="nav-subtitle">{SPORTS[activeLeague.sport]?.label||sport.label} · {leagueMembers.length||"?"} members · Week {activeLeague.current_week||activeLeague.week||1}</div>
              </div>

              {/* Tabs */}
              <div className="seg-control" style={{marginBottom:14}}>
                {["standings","trophies","schedule"].map(t=><div key={t} className={`seg-item ${leagueTab===t?"on":""}`} onClick={()=>setLeagueTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
              </div>

              {leagueTab==="standings"&&(
                <>
                  {/* Hero — your stats */}
                  <div className="league-hero">
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.indigo})`}}/>
                    <div className="lh-rank">🏆 Your Rank — #{realStandings.find(s=>s.isYou)?.rank||"?"} of {activeLeague.target_size||activeLeague.max_members||8}</div>
                    <div className="lh-name">You</div>
                    <div className="lh-stats">
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.blue}}>{realStandings.find(s=>s.isYou)?.record||"0-0"}</div><div className="lh-stat-lbl">Record</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>{realStandings.find(s=>s.isYou)?.wpct||"0%"}</div><div className="lh-stat-lbl">Win %</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>{realStandings.find(s=>s.isYou)?.points||0}pts</div><div className="lh-stat-lbl">Points</div></div>
                      <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>Wk {activeLeague.current_week||activeLeague.week||1}</div><div className="lh-stat-lbl">Current</div></div>
                    </div>
                  </div>

                  {/* 🔥 This Week section */}
                  <div style={{padding:"16px 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:18}}>🔥</div>
                      <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.3,color:"#fff"}}>This Week</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:IOS.orange,background:"rgba(255,159,10,0.12)",padding:"3px 10px",borderRadius:20}}>
                      Wk {activeLeague.current_week||activeLeague.week||1} · Live
                    </div>
                  </div>

                  {/* Weekly scores — filtered to current week only */}
                  {(()=>{
                    const curWeek = activeLeague.current_week||activeLeague.week||1;
                    const curWeekPicks = weekPicks.filter(p=>p.week===curWeek);
                    // Group by user
                    const byUser = {};
                    curWeekPicks.forEach(p=>{
                      if(!byUser[p.user_id]) byUser[p.user_id]={wins:0,losses:0,points:0,name:p.users?.username||p.users?.email?.split("@")[0]||"Unknown",isYou:p.user_id===user?.id};
                      if(p.result==="W"){ byUser[p.user_id].wins++; byUser[p.user_id].points+=parseFloat(p.points_earned||0); }
                      else if(p.result==="L") byUser[p.user_id].losses++;
                    });
                    // Include all league members even if no picks yet
                    const allMembers = leagueMembers.map(m=>({
                      userId: m.userId||m.user_id||m.id,
                      name: m.isYou?"You":m.name||m.username||"Unknown",
                      isYou: m.isYou,
                      ...(byUser[m.userId||m.user_id||m.id]||{wins:0,losses:0,points:0}),
                    }));
                    const sorted = [...allMembers].sort((a,b)=>b.points-a.points);
                    return (
                      <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px 16px",overflow:"hidden"}}>
                        {sorted.length===0 ? (
                          <div style={{padding:"20px 16px",textAlign:"center",color:IOS.label3,fontSize:14}}>No graded picks yet this week</div>
                        ) : sorted.map((row,i)=>{
                          const isMe = row.isYou;
                          const pts = parseFloat((row.points||0).toFixed(1));
                          return (
                            <div key={row.userId||i} style={{display:"flex",alignItems:"center",padding:"13px 16px",background:isMe?"rgba(10,132,255,0.08)":"transparent",borderBottom:i<sorted.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
                              <div style={{width:28,fontSize:15,fontWeight:700,color:i===0?IOS.yellow:i===1?IOS.gray:i===2?IOS.orange:IOS.label3,flexShrink:0}}>
                                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:15,fontWeight:600,color:isMe?IOS.blue:"#fff"}}>{isMe?"You ✦":row.name}</div>
                                <div style={{fontSize:12,color:IOS.label3,marginTop:1}}>{row.wins}W · {row.losses}L this week</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5,color:pts>0?IOS.green:IOS.label3}}>{pts}pts</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Season Standings section */}
                  <div style={{padding:"4px 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:18}}>🏆</div>
                      <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.3,color:"#fff"}}>Season Standings</div>
                    </div>
                  </div>

                  <div className="standings-card">
                    {/* Column headers */}
                    <div style={{display:"flex",alignItems:"center",padding:"8px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                      <div style={{width:28,flexShrink:0}}/>
                      <div style={{flex:1}}/>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,width:38,textAlign:"center"}}>W/L</div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,width:52,textAlign:"right"}}>total pts</div>
                    </div>
                    {sorted.map((row,i)=>{
                      const isMe=row.isYou||row.name==="You";
                      const isExp=expanded===row.rank;
                      const dr=sortBy==="rank"?row.rank:i+1;
                      return (
                        <div key={row.rank||i}>
                          <div className={`st-row ${isMe?"me":""}`} onClick={()=>setExpanded(isExp?null:row.rank)}>
                            <div className="st-rank">{dr<=3?rankMedal(dr):dr}</div>
                            <div className="st-info">
                              <div className={`st-name ${isMe?"me":""}`}>{isMe?"You ✦":row.name}</div>
                              <div className="st-streak" style={{color:IOS.label3}}>{row.wpct} win rate</div>
                            </div>
                            <div className="st-rec" style={{color:IOS.label3}}>{row.record||"0-0"}</div>
                            <div className={`st-units ${(row.points||0)>0?"pos":"neg"}`}>{row.points!==undefined?`${row.points}`:row.units}</div>
                          </div>
                          {isExp&&(
                            <div className="expand-row">
                              <div className="expand-inner">
                                <div className="exp-stat-row">
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:IOS.blue}}>{row.record||"0-0"}</div><div className="exp-stat-lbl">W/L</div></div>
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:IOS.green}}>{row.wpct}</div><div className="exp-stat-lbl">Win %</div></div>
                                  <div className="exp-stat"><div className="exp-stat-val" style={{color:IOS.green}}>{row.points!==undefined?`${row.points}pts`:row.units}</div><div className="exp-stat-lbl">Points</div></div>
                                </div>
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

              {/* TROPHIES TAB */}
              {leagueTab==="trophies"&&(
                <div style={{paddingBottom:24}}>
                  {leagueMembers.filter(m=>!m.isYou).length===0 ? (
                    <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,padding:"40px 24px",textAlign:"center"}}>
                      <div style={{fontSize:48,marginBottom:12}}>🏆</div>
                      <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>No Trophies Yet</div>
                      <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6}}>Trophies are awarded once members start competing. Invite friends to get started.</div>
                    </div>
                  ) : leagueTrophies.length===0 ? (
                    <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,padding:"40px 24px",textAlign:"center"}}>
                      <div style={{fontSize:48,marginBottom:12}}>⏳</div>
                      <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>No Graded Picks Yet</div>
                      <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6}}>Trophies will appear once picks are graded this week.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{padding:"0 20px 14px",fontSize:14,color:IOS.label3}}>Based on graded picks this season</div>
                      {leagueTrophies.map(t=>(
                        <div key={t.id} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:16,padding:"16px",display:"flex",alignItems:"center",gap:14,position:"relative",overflow:"hidden",border:t.isYou?`1px solid ${t.color}30`:"1px solid rgba(255,255,255,0.06)"}}>
                          {t.isYou&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:t.color,borderRadius:"16px 0 0 16px"}}/>}
                          <div style={{width:48,height:48,borderRadius:14,background:`${t.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{t.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:16,fontWeight:700,color:t.isYou?t.color:"#fff",marginBottom:3}}>{t.name}</div>
                            <div style={{fontSize:12,color:IOS.label3,marginBottom:4}}>{t.desc}</div>
                            <div style={{fontSize:12,fontWeight:600,color:t.isYou?t.color:IOS.label2}}>{t.isYou?"✦ Currently yours":`Held by ${t.holder}`}</div>
                          </div>
                          {t.isYou&&<div style={{background:`${t.color}18`,border:`1px solid ${t.color}40`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:t.color,flexShrink:0}}>YOURS</div>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {leagueTab==="schedule"&&(
                <>
                {(()=>{
                  const targetSize = activeLeague.target_size||activeLeague.max_members||8;
                  const currentSize = leagueMembers.length;
                  const isFull = currentSize >= targetSize;
                  if(!isFull) return (
                    <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,padding:"36px 24px",textAlign:"center"}}>
                      <div style={{fontSize:44,marginBottom:12}}>📅</div>
                      <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>Fill the League to See Your Schedule!</div>
                      <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6,marginBottom:20}}>
                        Schedule auto-generates when you reach {targetSize} members.
                      </div>
                      {/* Progress bar */}
                      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,height:8,overflow:"hidden",marginBottom:10}}>
                        <div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${IOS.blue},${IOS.teal})`,width:`${(currentSize/targetSize)*100}%`,transition:"width .4s"}}/>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:IOS.blue}}>{currentSize} / {targetSize} members</div>
                      {activeLeague.isCommissioner && (
                        <div style={{marginTop:14,fontSize:12,color:IOS.label3}}>Share invite code: <span style={{fontWeight:700,color:"#fff",letterSpacing:2}}>{activeLeague.invite_code||activeLeague.inviteCode}</span></div>
                      )}
                    </div>
                  );
                  return null;
                })()}
                {leagueMembers.length >= (activeLeague.target_size||activeLeague.max_members||8) && (
                  <>
                {/* Matchup detail overlay */}
                {selectedMatchup && (()=>{
                  const m = liveSchedule.find(x=>x.week===selectedMatchup);
                  if(!m) return null;
                  // Map liveSchedule format to what the overlay expects
                  const mDisplay = {
                    week: m.week, opp: m.opp,
                    result: m.result,
                    myPicks: [], oppPicks: [], // real pick detail not available yet
                  };
                  const slotColors = {Moneyline:IOS.blue, Prop:IOS.yellow, "Over/Under":IOS.orange, Spread:IOS.green, Parlay:IOS.pink};
                  const myTotal = parseFloat(calcMatchupScore(m.myPicks));
                  const oppTotal = parseFloat(calcMatchupScore(m.oppPicks));
                  return (
                    <div style={{position:"absolute",inset:0,background:IOS.bg,zIndex:30,overflowY:"auto",paddingBottom:40}}>
                      {/* Header */}
                      <div style={{padding:"52px 20px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <button onClick={()=>setSelectedMatchup(null)} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                          <div style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>Week {mDisplay.week} · {mDisplay.opp}</div>
                        </div>
                        {/* Score card with POINTS */}
                        <div style={{background:IOS.bg2,borderRadius:16,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:mDisplay.result==="W"?`linear-gradient(90deg,${IOS.green},${IOS.teal})`:`linear-gradient(90deg,${IOS.red},${IOS.orange})`}}/>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                            <div>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:IOS.blue}}>You</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {mDisplay.week}</div>
                            </div>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:m.result==="W"?IOS.green:IOS.red}}>{m.myPts} <span style={{fontSize:18,color:IOS.label3,fontWeight:400}}>–</span> {m.oppPts}</div>
                              <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:mDisplay.result==="W"?IOS.green:IOS.red,marginTop:2}}>{mDisplay.result==="W"?"Victory":"Defeat"}</div>
                              <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>pts</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{mDisplay.opp}</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {mDisplay.week}</div>
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
                                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,marginBottom:5}}>{mDisplay.opp}</div>
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
                  {liveSchedule.length === 0 ? (
                    <div style={{padding:"32px 24px",textAlign:"center",color:IOS.label3}}>
                      <div style={{fontSize:32,marginBottom:10}}>📅</div>
                      <div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:6}}>Schedule Coming Soon</div>
                      <div style={{fontSize:13}}>Join a full league to auto-generate your schedule.</div>
                    </div>
                  ) : liveSchedule.map(wk=>{
                    const live=wk.result==="live";const done=wk.result==="W"||wk.result==="L";
                    const myPts = wk.myPts > 0 ? wk.myPts : null;
                    const oppPts = wk.oppPts > 0 ? wk.oppPts : null;

                    // Calculate live/current score from weekPicks using scheduled opponent
                    const isCurrentWeek = wk.week === (activeLeague.current_week||activeLeague.week||1);
                    const showLive = live || (isCurrentWeek && !done);
                    const myLivePts = showLive ? parseFloat(weekPicks
                      .filter(p=>p.user_id===user?.id&&p.result==="W")
                      .reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1)) : null;
                    const oppLivePts = showLive ? parseFloat(weekPicks
                      .filter(p=>p.user_id===wk.oppId&&p.result==="W")
                      .reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1)) : null;

                    return (
                      <div key={wk.week} className="sch-item"
                        style={{...(live?{background:"rgba(10,132,255,0.06)"}:{}), ...(done?{cursor:"pointer"}:{})}}
                        onClick={()=>done&&setSelectedMatchup(wk.week)}
                      >
                        <div className={`sch-wk ${live?"live":""}`}>W{wk.week}</div>
                        <div className={`sch-opp ${live?"live":done?"done":"up"}`}>{live&&<span style={{color:IOS.blue,marginRight:6}}>●</span>}vs {wk.opp}</div>
                        <div className="sch-score" style={{width:70,fontSize:12}}>
                          {done&&myPts!==null
                            ? <span style={{color:wk.result==="W"?IOS.green:IOS.red,fontWeight:700}}>{myPts}–{oppPts}</span>
                            : showLive&&myLivePts!==null
                            ? <span style={{color:IOS.blue,fontWeight:700}}>{myLivePts}–{oppLivePts}</span>
                            : "—"}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className={`sch-badge ${showLive&&!done?"live":wk.result==="upcoming"?"up":wk.result}`}>{showLive&&!done?"LIVE":wk.result==="upcoming"?"—":wk.result}</div>
                          {done&&<div style={{fontSize:16,color:IOS.label3}}>›</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
                )}
                </>
              )}
            </div>
          </>
        )}

        {/* ══ CHAT ══ */}
        {screen==="chat"&&(
          <>
            <div style={{padding:"8px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
              <div>
                <div className="nav-title-large" style={{fontSize:22,marginBottom:0}}>{activeLeague.name}</div>
                <div className="nav-subtitle" style={{marginTop:0}}>{leagueMembers.length} members · League Chat</div>
              </div>
            </div>
            <div className="chat-bg">
              <div className="chat-msgs" ref={chatRef} style={{paddingBottom:12}}>
                {chatLoading && <div style={{textAlign:"center",color:IOS.label3,fontSize:13,padding:20}}>Loading messages...</div>}
                {!chatLoading && messages.length===0 && (
                  <div style={{textAlign:"center",color:IOS.label3,fontSize:13,padding:40}}>
                    <div style={{fontSize:32,marginBottom:8}}>💬</div>
                    <div>No messages yet. Start the conversation!</div>
                  </div>
                )}
                <div className="date-sep"><span>Today</span></div>
                {messages.map(msg=>{
                  const isMe = msg.user_id === user?.id;
                  const initial = (msg.username?.[0]||"?").toUpperCase();
                  const timeStr = new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
                  return (
                    <div key={msg.id} className={`msg-group ${isMe?"me":""}`}>
                      {!isMe&&<div className="msg-av" style={{background:acColor(initial)}}>{initial}</div>}
                      <div className="msg-col">
                        {!isMe&&<div className="msg-sender">{msg.username||"Unknown"}</div>}
                        <div className={`bubble ${isMe?"me":"them"}`}>{msg.message}</div>
                        <div className="msg-time">{timeStr}</div>
                      </div>
                    </div>
                  );
                })}
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
            <div className="body">
              <div className="prof-av-wrap">
                <div className="prof-av">{(userProfile?.username?.[0]||user?.email?.[0]||"J").toUpperCase()}</div>
                <div>
                  {editingUsername ? (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <input
                        value={usernameInput}
                        onChange={e=>{setUsernameInput(e.target.value);setUsernameError("");}}
                        placeholder="Enter username"
                        autoFocus
                        style={{background:"#2C2C2E",border:`1px solid ${usernameError?IOS.red:IOS.blue}`,borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:15,fontFamily:"'Manrope',sans-serif",outline:"none",width:180}}
                      />
                      {usernameError&&<div style={{fontSize:11,color:IOS.red}}>{usernameError}</div>}
                      <div style={{display:"flex",gap:10}}>
                        <div onClick={async()=>{
                          const val = usernameInput.trim();
                          if(!val){ setUsernameError("Can't be empty"); return; }
                          if(val.length<3){ setUsernameError("Min 3 characters"); return; }
                          if(!/^[a-zA-Z0-9_]+$/.test(val)){ setUsernameError("Letters, numbers, _ only"); return; }
                          setUsernameSaving(true);
                          const {data:existing}=await supabase.from("users").select("id").eq("username",val).maybeSingle();
                          if(existing && existing.id!==user.id){ setUsernameError("Already taken"); setUsernameSaving(false); return; }
                          await supabase.from("users").upsert({id:user.id, email:user.email, username:val},{onConflict:"id"});
                          setUserProfile(prev=>({...prev, username:val}));
                          setEditingUsername(false);
                          setUsernameSaving(false);
                        }} style={{fontSize:13,fontWeight:700,color:usernameSaving?IOS.label3:IOS.green,cursor:"pointer"}}>
                          {usernameSaving?"Saving...":"Save"}
                        </div>
                        <div onClick={()=>{setEditingUsername(false);setUsernameError("");}} style={{fontSize:13,fontWeight:600,color:IOS.label3,cursor:"pointer"}}>Cancel</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div className="prof-name">{userProfile?.username||user?.email?.split("@")[0]||"You"}</div>
                      <div onClick={()=>{setUsernameInput(userProfile?.username||"");setEditingUsername(true);}}
                        style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer",background:"rgba(10,132,255,0.12)",borderRadius:6,padding:"2px 8px"}}>
                        {userProfile?.username?"Edit":"Set"}
                      </div>
                    </div>
                  )}
                  <div className="prof-league">{realLeagues.length} active league{realLeagues.length!==1?"s":""}</div>
                  {!userProfile?.username&&<div style={{fontSize:11,color:IOS.orange,marginTop:2}}>⚠ Set a username so friends can find you</div>}
                  <div className="prof-rank-pill"><span>📊</span><span className="prof-rank-txt">All-league stats</span></div>
                </div>
              </div>

              <div className="seg-control">
                {["stats","power-ups"].map(t=><div key={t} className={`seg-item ${profTab===t?"on":""}`} onClick={()=>setProfTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
              </div>

              {profTab==="stats"&&(
                <>
                  <div className="stat-pills" style={{marginBottom:10}}>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.blue}}>{allMyStats?.wins||0}-{allMyStats?.losses||0}</div><div className="stat-pill-lbl">Record</div></div>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>{allMyStats?.winRate||"0%"}</div><div className="stat-pill-lbl">Win Rate</div></div>
                    <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>{allMyStats?.points||0}pts</div><div className="stat-pill-lbl">Total Pts</div></div>
                  </div>
                  <div className="perf-grid">
                    <div className="perf-card">
                      <div className="perf-lbl">Best Pick</div>
                      <div className="perf-val" style={{color:IOS.green,fontSize:14}}>{allMyStats?.bestBet?.pick_name||"—"}</div>
                    </div>
                    <div className="perf-card">
                      <div className="perf-lbl">Last Loss</div>
                      <div className="perf-val" style={{color:IOS.red,fontSize:14}}>{allMyStats?.worstBet?.pick_name||"—"}</div>
                    </div>
                  </div>
                  <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,overflow:"hidden"}}>
                    {[
                      ["Total Picks", allMyStats?.total||0, ""],
                      ["Wins", allMyStats?.wins||0, IOS.green],
                      ["Losses", allMyStats?.losses||0, IOS.red],
                      ["Win Rate", allMyStats?.winRate||"0%", IOS.blue],
                      ["Total Points", allMyStats?.points||0, IOS.green],
                      ["Active Leagues", realLeagues.length, IOS.blue],
                    ].map(([l,v,c],i,arr)=>(
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
                  {/* League toggle */}
                  {realLeagues.length > 1 && (
                    <div style={{overflowX:"auto",display:"flex",gap:8,padding:"10px 16px 4px",scrollbarWidth:"none"}}>
                      {realLeagues.map(lg=>{
                        const sp = SPORTS[lg.sport];
                        const isSelected = (puLeagueId||activeLeagueId)===lg.id;
                        return (
                          <div key={lg.id} onClick={()=>{
                            setPuLeagueId(lg.id);
                            if(user) fetchPuLeagueData(lg.id, user.id);
                          }} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,cursor:"pointer",transition:"all .15s",
                            background:isSelected?`${sp.color}20`:"rgba(255,255,255,0.06)",
                            border:`1px solid ${isSelected?sp.color+"60":"rgba(255,255,255,0.08)"}`,
                          }}>
                            <span style={{fontSize:14}}>{sp.icon}</span>
                            <span style={{fontSize:12,fontWeight:700,color:isSelected?sp.color:"rgba(255,255,255,0.6)"}}>{lg.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(()=>{
                    const viewLeagueId = puLeagueId||activeLeagueId;
                    const isActiveLeague = viewLeagueId===activeLeagueId;
                    const displayPUs = isActiveLeague ? myPUs : puLeaguePUs;
                    const displaySpins = isActiveLeague ? wheelSpins : puLeagueSpins;
                    return (
                      <>
                      <div style={{padding:"14px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:15,color:IOS.label3}}>{displayPUs.length} power-up{displayPUs.length!==1?"s":""} in inventory</div>
                        {displaySpins > 0 && isActiveLeague
                          ? <button onClick={()=>setShowWheel(true)} style={{background:`linear-gradient(135deg,${IOS.indigo},${IOS.purple})`,border:"none",borderRadius:10,padding:"8px 16px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                              🎰 Spin Wheel
                              <span style={{background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:800}}>{displaySpins}</span>
                            </button>
                          : <button disabled style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 16px",fontFamily:"Manrope,sans-serif",fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.25)",cursor:"not-allowed",display:"flex",alignItems:"center",gap:8}}>
                              🎰 Spin Wheel
                              <span style={{background:"rgba(255,255,255,0.08)",borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.25)"}}>{displaySpins}</span>
                            </button>
                        }
                      </div>
                      {displayPUs.length===0
                        ? <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,padding:24,textAlign:"center",color:IOS.label3,fontSize:15}}>No power-ups yet. Win a week to spin.</div>
                        : displayPUs.map((pu,i)=>(
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
                      </>
                    );
                  })()}
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

              {/* Notification Preferences */}
              <div style={{margin:"0 16px 12px"}}>
                <div style={{fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:1,textTransform:"uppercase",marginBottom:8,paddingLeft:4}}>Notifications</div>
                <div style={{background:IOS.bg2,borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
                  {[
                    {key:"notif_results",    label:"Weekly Results",      sub:"When your week is graded",         icon:"🏆"},
                    {key:"notif_grades",     label:"Picks Graded",        sub:"When a pick result comes in",      icon:"✅"},
                    {key:"notif_reminder",   label:"Pick Reminder",       sub:"Reminder before slip locks",       icon:"⏰"},
                    {key:"notif_league",     label:"League Activity",     sub:"New members, chat messages",       icon:"👥"},
                  ].map((pref,i,arr)=>{
                    const val = userProfile?.[pref.key] !== false; // default true
                    return (
                      <div key={pref.key} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:i<arr.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
                        <div style={{fontSize:18,marginRight:12}}>{pref.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{pref.label}</div>
                          <div style={{fontSize:12,color:IOS.label3,marginTop:1}}>{pref.sub}</div>
                        </div>
                        {/* Toggle */}
                        <div onClick={async()=>{
                          const newVal = !val;
                          setUserProfile(prev=>({...prev,[pref.key]:newVal}));
                          await supabase.from("users").update({[pref.key]:newVal}).eq("id",user.id);
                        }} style={{width:44,height:26,borderRadius:13,background:val?IOS.green:"rgba(255,255,255,0.15)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                          <div style={{position:"absolute",top:3,left:val?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
                        </div>
                      </div>
                    );
                  })}
                  {/* Master push toggle */}
                  <div style={{display:"flex",alignItems:"center",padding:"12px 16px",borderTop:`1px solid ${IOS.sep}`,background:"rgba(255,255,255,0.03)"}}>
                    <div style={{fontSize:18,marginRight:12}}>🔔</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Push Notifications</div>
                      <div style={{fontSize:12,color:IOS.orange,marginTop:1}}>Coming soon — iOS App Store</div>
                    </div>
                    <div style={{width:44,height:26,borderRadius:13,background:"rgba(255,255,255,0.1)",position:"relative",opacity:0.4}}>
                      <div style={{position:"absolute",top:3,left:3,width:20,height:20,borderRadius:"50%",background:"#fff"}}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Play */}
              <div style={{padding:"0 16px 4px"}}>
                <button onClick={()=>setTutorialStep(0)} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.7)",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>
                  ❓ How to Play
                </button>
              </div>

              {/* Sign Out + Delete Account */}
              <div style={{padding:"8px 16px 32px",display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={async()=>{
                  await supabase.auth.signOut();
                  setUser(null);
                  setUserProfile(null);
                  setRealLeagues([]);
                  setActiveLeagueId(null);
                  setSavedPicks(null);
                  setFlexPicks(EMPTY_FLEX);
                  setScreen("home");
                }} style={{width:"100%",background:"rgba(255,59,48,0.1)",border:"1px solid rgba(255,59,48,0.2)",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,color:IOS.red,cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>
                  Sign Out
                </button>
                <button onClick={async()=>{
                  const confirm1 = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
                  if(!confirm1) return;
                  const confirm2 = window.confirm("Last chance — this will permanently delete your account and all your picks.");
                  if(!confirm2) return;
                  // Delete user data from DB
                  await supabase.from("picks").delete().eq("user_id", user.id);
                  await supabase.from("league_members").delete().eq("user_id", user.id);
                  await supabase.from("users").delete().eq("id", user.id);
                  await supabase.auth.admin?.deleteUser(user.id).catch(()=>{});
                  await supabase.auth.signOut();
                  setUser(null);
                  setUserProfile(null);
                  setRealLeagues([]);
                  setActiveLeagueId(null);
                  setSavedPicks(null);
                  setFlexPicks(EMPTY_FLEX);
                  setScreen("home");
                  alert("Your account has been deleted.");
                }} style={{width:"100%",background:"transparent",border:"none",borderRadius:12,padding:"10px",fontSize:13,fontWeight:600,color:"rgba(255,59,48,0.5)",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>
                  Delete Account
                </button>
              </div>

            </div>
          </>
        )}

        {/* ══ WEEK RESULT MODAL ══ */}
        {weekResult && (
          <div style={{position:"fixed",inset:0,zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setWeekResult(null)}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)"}}/>
            <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#1C1C1E",borderRadius:28,padding:"36px 28px 28px",width:"100%",maxWidth:340,textAlign:"center",border:`1px solid ${weekResult.won?"rgba(48,209,88,0.3)":"rgba(255,69,58,0.3)"}`,boxShadow:`0 0 60px ${weekResult.won?"rgba(48,209,88,0.15)":"rgba(255,69,58,0.1)"}`}}>
              {/* Icon */}
              <div style={{fontSize:56,marginBottom:8}}>{weekResult.won ? "🏆" : "💀"}</div>
              {/* Result */}
              <div style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,color:weekResult.won?IOS.green:IOS.red,marginBottom:6}}>
                {weekResult.won ? "You Won!" : "You Lost"}
              </div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:24}}>
                Week {weekResult.week} Matchup Result
              </div>
              {/* Score */}
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"16px 20px",marginBottom:24}}>
                <div style={{fontSize:36,fontWeight:800,letterSpacing:-1,color:"#fff",marginBottom:4}}>
                  <span style={{color:weekResult.won?IOS.green:"#fff"}}>{weekResult.myPts}</span>
                  <span style={{fontSize:20,color:"rgba(255,255,255,0.3)",margin:"0 10px"}}>–</span>
                  <span style={{color:weekResult.won?"#fff":IOS.red}}>{weekResult.oppPts}</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>
                  You vs Opponent · Wk {weekResult.week}
                </div>
              </div>
              {/* CTA */}
              <button onClick={()=>setWeekResult(null)} style={{width:"100%",background:weekResult.won?IOS.green:IOS.blue,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,color:weekResult.won?"#000":"#fff",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>
                {weekResult.won ? "Let's Go! 🔥" : "Get 'Em Next Week"}
              </button>
            </div>
          </div>
        )}

        {/* ══ GAME DETAIL SHEET ══ */}
        {gameSheet && (
          <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setGameSheet(null)}>
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
            <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#1C1C1E",borderRadius:"24px 24px 0 0",maxHeight:"85vh",overflowY:"auto",paddingBottom:40}}>
              {/* Handle */}
              <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}>
                <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)"}}/>
              </div>

              {/* Teams header */}
              {(() => {
                const eg = gameSheet.espnGame;
                const tg = gameSheet.tickerGame;
                const away = eg?.awayTeam || tg?.away;
                const home = eg?.homeTeam || tg?.home;
                const awayRec = eg?.awayRecord;
                const homeRec = eg?.homeRecord;
                const awayLogo = eg?.awayLogo;
                const homeLogo = eg?.homeLogo;
                const gameTime = new Date(tg?.time).toLocaleTimeString([],{hour:"numeric",minute:"2-digit",timeZoneName:"short"});
                return (
                  <div style={{padding:"16px 20px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      {/* Away */}
                      <div style={{flex:1,textAlign:"center"}}>
                        {awayLogo && <img src={awayLogo} style={{width:52,height:52,objectFit:"contain",marginBottom:6}} onError={e=>e.target.style.display="none"}/>}
                        <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{away}</div>
                        {awayRec && <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{awayRec}</div>}
                      </div>
                      {/* VS */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:IOS.label3}}>VS</div>
                        <div style={{fontSize:11,color:IOS.label3,marginTop:4}}>{gameSheet.tickerGame.isLive ? <span style={{color:IOS.green,fontWeight:700}}>● LIVE</span> : gameTime}</div>
                      </div>
                      {/* Home */}
                      <div style={{flex:1,textAlign:"center"}}>
                        {homeLogo && <img src={homeLogo} style={{width:52,height:52,objectFit:"contain",marginBottom:6}} onError={e=>e.target.style.display="none"}/>}
                        <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{home}</div>
                        {homeRec && <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{homeRec}</div>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Odds */}
              {gameSheet.odds && (gameSheet.odds.ml?.length > 0 || gameSheet.odds.spread?.length > 0 || gameSheet.odds.ou?.length > 0) && (
                <div style={{margin:"0 16px 16px",background:"#2C2C2E",borderRadius:14,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.06)",fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:1,textTransform:"uppercase"}}>DraftKings Odds</div>
                  <div style={{display:"flex",gap:0}}>
                    {[
                      {label:"Moneyline", items: gameSheet.odds.ml.slice(0,2)},
                      {label:"Spread",    items: gameSheet.odds.spread.slice(0,2)},
                      {label:"Total",     items: gameSheet.odds.ou.slice(0,2)},
                    ].map((col,ci) => (
                      <div key={ci} style={{flex:1,borderRight:ci<2?"0.5px solid rgba(255,255,255,0.06)":"none"}}>
                        <div style={{fontSize:10,fontWeight:700,color:IOS.label3,textAlign:"center",padding:"6px 4px 4px",letterSpacing:0.5}}>{col.label}</div>
                        {col.items.map((item,ii) => (
                          <div key={ii} style={{textAlign:"center",padding:"4px 4px 8px"}}>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",padding:"0 4px"}}>{item.pick}</div>
                            <div style={{fontSize:14,fontWeight:800,color:item.odds?.startsWith("+")?IOS.green:IOS.blue}}>{item.odds}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {gameLoading && (
                <div style={{textAlign:"center",padding:"24px",color:IOS.label3,fontSize:13}}>Loading stats...</div>
              )}

              {/* Stat leaders */}
              {gameSheet.detail?.statLeaders?.length > 0 && (
                <div style={{margin:"0 16px 16px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Key Players</div>
                  {gameSheet.detail.statLeaders.slice(0,4).map((cat,ci) => (
                    <div key={ci} style={{background:"#2C2C2E",borderRadius:12,padding:"10px 14px",marginBottom:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:IOS.blue,letterSpacing:0.5,textTransform:"uppercase",marginBottom:8}}>{cat.category}</div>
                      {cat.leaders.map((l,li) => (
                        <div key={li} style={{display:"flex",alignItems:"center",gap:10,marginBottom:li<cat.leaders.length-1?8:0}}>
                          {l.photo && <img src={l.photo} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",background:"#3A3A3C"}} onError={e=>e.target.style.display="none"}/>}
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{l.name}</div>
                            <div style={{fontSize:11,color:IOS.label3}}>{l.team}</div>
                          </div>
                          <div style={{fontSize:14,fontWeight:800,color:IOS.green}}>{l.stat}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Team stats */}
              {gameSheet.detail?.teams?.length > 0 && (
                <div style={{margin:"0 16px 16px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Team Stats</div>
                  <div style={{background:"#2C2C2E",borderRadius:12,overflow:"hidden"}}>
                    <div style={{display:"flex",borderBottom:"0.5px solid rgba(255,255,255,0.06)"}}>
                      {gameSheet.detail.teams.map((t,ti)=>(
                        <div key={ti} style={{flex:1,textAlign:"center",padding:"8px 4px",fontSize:12,fontWeight:700,color:"#fff",borderRight:ti===0?"0.5px solid rgba(255,255,255,0.06)":"none"}}>{t.abbrev}</div>
                      ))}
                    </div>
                    {(gameSheet.detail.teams[0]?.stats||[]).map((stat,si)=>(
                      <div key={si} style={{display:"flex",borderBottom:si<gameSheet.detail.teams[0].stats.length-1?"0.5px solid rgba(255,255,255,0.04)":"none"}}>
                        <div style={{flex:1,textAlign:"center",padding:"7px 4px",fontSize:13,fontWeight:600,color:"#fff"}}>{gameSheet.detail.teams[0]?.stats[si]?.value||"—"}</div>
                        <div style={{flex:1,textAlign:"center",padding:"7px 4px",fontSize:11,color:IOS.label3,borderLeft:"0.5px solid rgba(255,255,255,0.06)",borderRight:"0.5px solid rgba(255,255,255,0.06)"}}>{stat.label}</div>
                        <div style={{flex:1,textAlign:"center",padding:"7px 4px",fontSize:13,fontWeight:600,color:"#fff"}}>{gameSheet.detail.teams[1]?.stats[si]?.value||"—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No detail fallback */}
              {!gameLoading && !gameSheet.detail && !gameSheet.espnGame && (
                <div style={{textAlign:"center",padding:"16px 24px",color:IOS.label3,fontSize:13,lineHeight:1.6}}>
                  Detailed stats not available yet — check back closer to game time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB BAR ══ */}
        <div className="tab-bar">
          {[
            {icon:"⚡",label:"Home",      id:"home"},
            {icon:"🎯",label:"Picks",     id:"picks"},
            {icon:"🏈",label:"Matchup",   id:"matchup"},
            {icon:"🏆",label:"Leagues",   id:"leagues"},
            {icon:"📊",label:"Standings", id:"league"},
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