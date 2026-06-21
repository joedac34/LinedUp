import { useState, useEffect, useRef, Component } from "react";
import { supabase } from './supabase';

// iOS System Colors
const IOS = {
 blue: "#0A84FF",
 green: "#30D158",
 red: "#FF453A",
 orange: "#FF9F0A",
 purple: "#BF5AF2",
 teal: "#3A9EE0",
 yellow: "#FFD60A",
 pink: "#FF375F",
 indigo: "#5E5CE6",
 gray: "#8E8E93",
 gray2: "#636366",
 gray3: "#48484A",
 gray4: "#3A3A3C",
 gray5: "#2C2C2E",
 gray6: "#1C1C1E",
 bg: "#000000",
 bg2: "#1C1C1E",
 bg3: "#2C2C2E",
 label: "#FFFFFF",
 label2: "rgba(255,255,255,0.6)",
 label3: "rgba(255,255,255,0.3)",
 label4: "rgba(255,255,255,0.18)",
 sep: "rgba(255,255,255,0.1)",
 fill: "rgba(255,255,255,0.05)",
 fill2: "rgba(255,255,255,0.08)",
 fill3: "rgba(255,255,255,0.12)",
};

// ─── SPORT CONFIG ───────────────────────────────────────────────
const SPORTS = {
 nfl: {
 id:"nfl", label:"NFL", icon:"", color:"#0A84FF",
 season:"2024 NFL Season",
 slots:[
 { id:"ml", label:"Moneyline", mult:1, icon:"", color:"#0A84FF", bg:"rgba(10,132,255,0.15)", desc:"Pick a winner straight up" },
 { id:"prop", label:"Prop", mult:2, icon:"", color:"#FFD60A", bg:"rgba(255,214,10,0.15)", desc:"Player or game prop bet" },
 { id:"ou", label:"Over/Under", mult:3, icon:"", color:"#FF9F0A", bg:"rgba(255,159,10,0.15)", desc:"Total points over or under" },
 { id:"spread", label:"Spread", mult:4, icon:"", color:"#30D158", bg:"rgba(48,209,88,0.15)", desc:"Beat the point spread" },
 { id:"longshot", label:"Parlay", mult:5, icon:"", color:"#FF375F", bg:"rgba(255,55,95,0.15)", desc:"Build a mini parlay — pick 2+ bets" },
 ],
 bets:{
 ml:[
 { id:"ml1", game:"Raiders @ Chiefs", pick:"KC Chiefs", odds:"-280", impliedOdds:-280 },
 { id:"ml2", game:"Cowboys @ Eagles", pick:"Philadelphia Eagles",odds:"-165", impliedOdds:-165 },
 { id:"ml3", game:"Dolphins @ Bills", pick:"Buffalo Bills", odds:"-210", impliedOdds:-210 },
 { id:"ml4", game:"Rams @ 49ers", pick:"San Francisco 49ers",odds:"-195", impliedOdds:-195 },
 { id:"ml5", game:"Vikings @ Packers", pick:"Green Bay Packers", odds:"-125", impliedOdds:-125 },
 { id:"ml6", game:"Panthers @ Falcons", pick:"Atlanta Falcons", odds:"-245", impliedOdds:-245 },
 { id:"ml7", game:"Broncos @ Chargers", pick:"LA Chargers", odds:"-165", impliedOdds:-165 },
 { id:"ml8", game:"Giants @ Commanders", pick:"Washington Commanders",odds:"-170",impliedOdds:-170},
 { id:"ml9", game:"Bears @ Lions", pick:"Detroit Lions", odds:"-300", impliedOdds:-300 },
 { id:"ml10", game:"Bengals @ Ravens", pick:"Baltimore Ravens", odds:"-155", impliedOdds:-155 },
 { id:"ml11", game:"Seahawks @ Cardinals", pick:"Seattle Seahawks", odds:"-130", impliedOdds:-130 },
 { id:"ml12", game:"Saints @ Buccaneers", pick:"Tampa Bay Buccaneers",odds:"-120",impliedOdds:-120 },
 { id:"ml13", game:"Jets @ Patriots", pick:"NY Jets", odds:"-140", impliedOdds:-140 },
 { id:"ml14", game:"Steelers @ Browns", pick:"Pittsburgh Steelers",odds:"+110", impliedOdds:110 },
 { id:"ml15", game:"Colts @ Titans", pick:"Indianapolis Colts", odds:"-105", impliedOdds:-105 },
 { id:"ml16", game:"Raiders @ Chiefs", pick:"Las Vegas Raiders", odds:"+240", impliedOdds:240 },
 { id:"ml17", game:"Cowboys @ Eagles", pick:"Dallas Cowboys", odds:"+145", impliedOdds:145 },
 ],
 prop:[], // No hardcoded props — live data from /api/props only
 ou:[
 { id:"ou1", game:"Raiders @ Chiefs", pick:"Over 47.5", odds:"-110", impliedOdds:-110 },
 { id:"ou2", game:"Cowboys @ Eagles", pick:"Under 44", odds:"-110", impliedOdds:-110 },
 { id:"ou3", game:"Dolphins @ Bills", pick:"Over 48", odds:"-115", impliedOdds:-115 },
 { id:"ou4", game:"Rams @ 49ers", pick:"Under 45.5", odds:"-110", impliedOdds:-110 },
 { id:"ou5", game:"Vikings @ Packers", pick:"Over 43", odds:"-118", impliedOdds:-118 },
 { id:"ou6", game:"Panthers @ Falcons", pick:"Over 41", odds:"-112", impliedOdds:-112 },
 { id:"ou7", game:"Broncos @ Chargers", pick:"Under 44", odds:"-110", impliedOdds:-110 },
 { id:"ou8", game:"Giants @ Commanders", pick:"Under 40.5", odds:"-108", impliedOdds:-108 },
 { id:"ou9", game:"Bears @ Lions", pick:"Over 50.5", odds:"-115", impliedOdds:-115 },
 { id:"ou10", game:"Bengals @ Ravens", pick:"Over 46", odds:"-112", impliedOdds:-112 },
 { id:"ou11", game:"Seahawks @ Cardinals", pick:"Over 44.5", odds:"-110", impliedOdds:-110 },
 { id:"ou12", game:"Saints @ Buccaneers", pick:"Under 43", odds:"-110", impliedOdds:-110 },
 { id:"ou13", game:"Jets @ Patriots", pick:"Under 38.5", odds:"-115", impliedOdds:-115 },
 { id:"ou14", game:"Steelers @ Browns", pick:"Under 36.5", odds:"-110", impliedOdds:-110 },
 { id:"ou15", game:"Colts @ Titans", pick:"Over 42.5", odds:"-108", impliedOdds:-108 },
 ],
 spread:[
 { id:"sp1", game:"Raiders @ Chiefs", pick:"KC Chiefs -6.5", odds:"-110", impliedOdds:-110 },
 { id:"sp2", game:"Cowboys @ Eagles", pick:"Eagles -3", odds:"-110", impliedOdds:-110 },
 { id:"sp3", game:"Dolphins @ Bills", pick:"Bills -5", odds:"-115", impliedOdds:-115 },
 { id:"sp4", game:"Rams @ 49ers", pick:"49ers -4.5", odds:"-110", impliedOdds:-110 },
 { id:"sp5", game:"Panthers @ Falcons", pick:"Falcons -6", odds:"-108", impliedOdds:-108 },
 { id:"sp6", game:"Broncos @ Chargers", pick:"Chargers -3.5", odds:"-110", impliedOdds:-110 },
 { id:"sp7", game:"Giants @ Commanders", pick:"Commanders -3", odds:"-112", impliedOdds:-112 },
 { id:"sp8", game:"Bears @ Lions", pick:"Lions -8.5", odds:"-110", impliedOdds:-110 },
 { id:"sp9", game:"Bengals @ Ravens", pick:"Ravens -4", odds:"-115", impliedOdds:-115 },
 { id:"sp10", game:"Seahawks @ Cardinals", pick:"Seahawks -3", odds:"-110", impliedOdds:-110 },
 { id:"sp11", game:"Saints @ Buccaneers", pick:"Buccaneers -2.5", odds:"-110", impliedOdds:-110 },
 { id:"sp12", game:"Jets @ Patriots", pick:"Jets -3", odds:"-112", impliedOdds:-112 },
 { id:"sp13", game:"Steelers @ Browns", pick:"Browns +2.5", odds:"-110", impliedOdds:-110 },
 { id:"sp14", game:"Colts @ Titans", pick:"Colts -1", odds:"-110", impliedOdds:-110 },
 { id:"sp15", game:"Vikings @ Packers", pick:"Packers -2", odds:"-112", impliedOdds:-112 },
 { id:"sp16", game:"Raiders @ Chiefs", pick:"Raiders +6.5", odds:"-110", impliedOdds:-110 },
 { id:"sp17", game:"Cowboys @ Eagles", pick:"Cowboys +3", odds:"-110", impliedOdds:-110 },
 ],
 longshot:[
 { id:"ls1", game:"Raiders @ Chiefs", pick:"Raiders ML", odds:"+240", impliedOdds:240 },
 { id:"ls2", game:"Cowboys @ Eagles", pick:"Cowboys ML", odds:"+350", impliedOdds:350 },
 { id:"ls3", game:"Panthers @ Falcons", pick:"Panthers ML", odds:"+380", impliedOdds:380 },
 { id:"ls4", game:"Giants @ Commanders", pick:"Giants ML", odds:"+310", impliedOdds:310 },
 { id:"ls5", game:"Broncos @ Chargers", pick:"Broncos ML", odds:"+420", impliedOdds:420 },
 { id:"ls6", game:"Bears @ Lions", pick:"Bears ML", odds:"+460", impliedOdds:460 },
 { id:"ls7", game:"Jets @ Patriots", pick:"Patriots ML", odds:"+265", impliedOdds:265 },
 { id:"ls8", game:"Steelers @ Browns", pick:"Steelers ML", odds:"+185", impliedOdds:185 },
 { id:"ls9", game:"Seahawks @ Cardinals", pick:"Cardinals ML", odds:"+290", impliedOdds:290 },
 { id:"ls10", game:"Saints @ Buccaneers", pick:"Saints ML", odds:"+175", impliedOdds:175 },
 { id:"ls11", game:"Vikings @ Packers", pick:"Vikings +2 1H", odds:"+140", impliedOdds:140 },
 { id:"ls12", game:"Colts @ Titans", pick:"Titans ML", odds:"+195", impliedOdds:195 },
 { id:"ls13", game:"Patrick Mahomes", pick:"4+ TD Passes", odds:"+280", impliedOdds:280 },
 { id:"ls14", game:"Bengals @ Ravens", pick:"Bengals ML", odds:"+210", impliedOdds:210 },
 { id:"ls15", game:"Josh Allen", pick:"2+ Rush TDs", odds:"+340", impliedOdds:340 },
 ],
 },
 },
 nba: {
 id:"nba", label:"NBA", icon:"", color:"#FF6B35",
 season:"2024-25 NBA Season",
 slots:[
 { id:"ml", label:"Moneyline", mult:1, icon:"", color:"#FF6B35", bg:"rgba(255,107,53,0.15)", desc:"Pick a team to win straight up" },
 { id:"prop", label:"Player Prop",mult:2, icon:"", color:"#FFD60A", bg:"rgba(255,214,10,0.15)", desc:"Points, assists, rebounds prop" },
 { id:"ou", label:"Over/Under", mult:3, icon:"", color:"#30D158", bg:"rgba(48,209,88,0.15)", desc:"Total points scored" },
 { id:"spread", label:"Spread", mult:4, icon:"", color:"#BF5AF2", bg:"rgba(191,90,242,0.15)", desc:"Beat the point spread" },
 { id:"longshot", label:"Parlay", mult:5, icon:"", color:"#FF375F", bg:"rgba(255,55,95,0.15)", desc:"Build a same-game parlay" },
 ],
 bets:{
 ml:[
 { id:"ml1", game:"Celtics @ Lakers", pick:"Boston Celtics", odds:"-145", impliedOdds:-145 },
 { id:"ml2", game:"Warriors @ Nuggets", pick:"Golden State", odds:"+125", impliedOdds:125 },
 { id:"ml3", game:"Heat @ Bucks", pick:"Milwaukee Bucks", odds:"-165", impliedOdds:-165 },
 { id:"ml4", game:"Suns @ Clippers", pick:"LA Clippers", odds:"-110", impliedOdds:-110 },
 { id:"ml5", game:"Knicks @ 76ers", pick:"New York Knicks", odds:"+105", impliedOdds:105 },
 ],
 prop:[
 { id:"pr1", game:"LeBron James", pick:"25+ Points", odds:"-130", impliedOdds:-130 },
 { id:"pr2", game:"Steph Curry", pick:"5+ Three-Pointers", odds:"-115", impliedOdds:-115 },
 { id:"pr3", game:"Nikola Jokic", pick:"10+ Assists", odds:"+145", impliedOdds:145 },
 { id:"pr4", game:"Jayson Tatum", pick:"30+ Points", odds:"+175", impliedOdds:175 },
 { id:"pr5", game:"Giannis", pick:"12+ Rebounds", odds:"-120", impliedOdds:-120 },
 ],
 ou:[
 { id:"ou1", game:"Celtics @ Lakers", pick:"Over 224.5", odds:"-110", impliedOdds:-110 },
 { id:"ou2", game:"Warriors @ Nuggets", pick:"Over 232", odds:"-115", impliedOdds:-115 },
 { id:"ou3", game:"Heat @ Bucks", pick:"Under 218.5", odds:"-110", impliedOdds:-110 },
 { id:"ou4", game:"Suns @ Clippers", pick:"Over 228", odds:"-108", impliedOdds:-108 },
 { id:"ou5", game:"Knicks @ 76ers", pick:"Under 215", odds:"-112", impliedOdds:-112 },
 ],
 spread:[
 { id:"sp1", game:"Celtics @ Lakers", pick:"Celtics -3.5", odds:"-110", impliedOdds:-110 },
 { id:"sp2", game:"Warriors @ Nuggets", pick:"Nuggets -2", odds:"-110", impliedOdds:-110 },
 { id:"sp3", game:"Heat @ Bucks", pick:"Bucks -5.5", odds:"-115", impliedOdds:-115 },
 { id:"sp4", game:"Suns @ Clippers", pick:"Clippers -1.5", odds:"-110", impliedOdds:-110 },
 { id:"sp5", game:"Knicks @ 76ers", pick:"76ers -2", odds:"-108", impliedOdds:-108 },
 ],
 longshot:[
 { id:"ls1", game:"Warriors @ Nuggets", pick:"Warriors ML", odds:"+125", impliedOdds:125 },
 { id:"ls2", game:"Knicks @ 76ers", pick:"Knicks ML", odds:"+105", impliedOdds:105 },
 { id:"ls3", game:"Pistons @ Cavs", pick:"Pistons ML", odds:"+340", impliedOdds:340 },
 { id:"ls4", game:"Wizards @ Celtics", pick:"Wizards ML", odds:"+520", impliedOdds:520 },
 { id:"ls5", game:"Spurs @ Thunder", pick:"Spurs ML", odds:"+290", impliedOdds:290 },
 { id:"ls6", game:"Steph Curry", pick:"8+ Three-Pointers",odds:"+450",impliedOdds:450 },
 ],
 },
 },
 mlb: {
 id:"mlb", label:"MLB", icon:"", color:"#30D158",
 season:"2024 MLB Season",
 slots:[
 { id:"ml", label:"Moneyline", mult:1, icon:"", color:"#30D158", bg:"rgba(48,209,88,0.15)", desc:"Pick a team to win" },
 { id:"prop", label:"Player Prop",mult:2, icon:"", color:"#FFD60A", bg:"rgba(255,214,10,0.15)", desc:"Strikeouts, hits, RBI prop" },
 { id:"ou", label:"Over/Under", mult:3, icon:"", color:"#0A84FF", bg:"rgba(10,132,255,0.15)", desc:"Total runs scored" },
 { id:"spread", label:"Run Line", mult:4, icon:"", color:"#FF9F0A", bg:"rgba(255,159,10,0.15)", desc:"-1.5 or +1.5 run line" },
 { id:"longshot", label:"Parlay", mult:5, icon:"", color:"#FF375F", bg:"rgba(255,55,95,0.15)", desc:"Build a multi-game parlay" },
 ],
 bets:{
 ml:[
 { id:"ml1", game:"Yankees @ Red Sox", pick:"New York Yankees", odds:"-145", impliedOdds:-145 },
 { id:"ml2", game:"Dodgers @ Giants", pick:"LA Dodgers", odds:"-175", impliedOdds:-175 },
 { id:"ml3", game:"Cubs @ Cardinals", pick:"St. Louis Cardinals", odds:"-120", impliedOdds:-120 },
 { id:"ml4", game:"Astros @ Rangers", pick:"Houston Astros", odds:"-130", impliedOdds:-130 },
 { id:"ml5", game:"Braves @ Mets", pick:"Atlanta Braves", odds:"-115", impliedOdds:-115 },
 ],
 prop:[
 { id:"pr1", game:"Shohei Ohtani", pick:"2+ RBIs", odds:"+155", impliedOdds:155 },
 { id:"pr2", game:"Gerrit Cole", pick:"8+ Strikeouts", odds:"-125", impliedOdds:-125 },
 { id:"pr3", game:"Mookie Betts", pick:"Over 1.5 Hits", odds:"-140", impliedOdds:-140 },
 { id:"pr4", game:"Aaron Judge", pick:"Home Run", odds:"+280", impliedOdds:280 },
 { id:"pr5", game:"Freddie Freeman", pick:"Over 0.5 RBIs", odds:"-160", impliedOdds:-160 },
 ],
 ou:[
 { id:"ou1", game:"Yankees @ Red Sox", pick:"Over 8.5", odds:"-115", impliedOdds:-115 },
 { id:"ou2", game:"Dodgers @ Giants", pick:"Under 7.5", odds:"-110", impliedOdds:-110 },
 { id:"ou3", game:"Cubs @ Cardinals", pick:"Over 9", odds:"-108", impliedOdds:-108 },
 { id:"ou4", game:"Astros @ Rangers", pick:"Under 8", odds:"-112", impliedOdds:-112 },
 { id:"ou5", game:"Braves @ Mets", pick:"Over 8.5", odds:"-110", impliedOdds:-110 },
 ],
 spread:[
 { id:"sp1", game:"Yankees @ Red Sox", pick:"Yankees -1.5", odds:"+145", impliedOdds:145 },
 { id:"sp2", game:"Dodgers @ Giants", pick:"Dodgers -1.5", odds:"+125", impliedOdds:125 },
 { id:"sp3", game:"Cubs @ Cardinals", pick:"Cardinals -1.5",odds:"+135", impliedOdds:135 },
 { id:"sp4", game:"Astros @ Rangers", pick:"Astros -1.5", odds:"+140", impliedOdds:140 },
 { id:"sp5", game:"Braves @ Mets", pick:"Mets +1.5", odds:"-165", impliedOdds:-165 },
 ],
 longshot:[
 { id:"ls1", game:"Yankees @ Red Sox", pick:"Red Sox ML", odds:"+125", impliedOdds:125 },
 { id:"ls2", game:"Giants @ Dodgers", pick:"Giants ML", odds:"+155", impliedOdds:155 },
 { id:"ls3", game:"Cubs @ Cardinals", pick:"Cubs ML", odds:"+105", impliedOdds:105 },
 { id:"ls4", game:"Aaron Judge", pick:"2+ Home Runs", odds:"+450", impliedOdds:450 },
 { id:"ls5", game:"Reds @ Pirates", pick:"Reds ML", odds:"+210", impliedOdds:210 },
 { id:"ls6", game:"Athletics @ Astros", pick:"Athletics ML", odds:"+340", impliedOdds:340 },
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
 { name:"Joe", record:"7-3", units:"+12.5", roi:"+18%", streak:"W3", isYou:true, isCommissioner:true },
 { name:"Dave K.", record:"9-1", units:"+22.0", roi:"+32%", streak:"W5", isYou:false, isCommissioner:false },
 { name:"Mike D.", record:"6-4", units:"+4.2", roi:"+6%", streak:"L1", isYou:false, isCommissioner:false },
 { name:"Chris R.", record:"5-5", units:"-1.8", roi:"-3%", streak:"W1", isYou:false, isCommissioner:false },
 { name:"Tom B.", record:"3-7", units:"-9.4", roi:"-14%", streak:"L3", isYou:false, isCommissioner:false },
 { name:"Alex M.", record:"4-6", units:"-5.1", roi:"-8%", streak:"L2", isYou:false, isCommissioner:false },
 { name:"Ryan S.", record:"3-7", units:"-11.2", roi:"-17%", streak:"L4", isYou:false, isCommissioner:false },
 { name:"Jake P.", record:"2-8", units:"-15.8", roi:"-24%", streak:"L5", isYou:false, isCommissioner:false },
 ],
 // Week 6 picks awaiting grading
 weekPicks:[
 { member:"Joe", picks:[
 { slot:"Moneyline", mult:1, pick:"KC Chiefs", odds:"-280", result:"pending" },
 { slot:"Prop", mult:2, pick:"Mahomes 300+ Yds",odds:"-130", result:"pending" },
 { slot:"Over/Under",mult:3, pick:"Over 47.5", odds:"-110", result:"W" },
 { slot:"Spread", mult:4, pick:"Eagles -3", odds:"-110", result:"W" },
 { slot:"Parlay", mult:5, pick:"Raiders + Bears", odds:"+420", result:"pending" },
 ]},
 { member:"Mike D.", picks:[
 { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", result:"pending" },
 { slot:"Prop", mult:2, pick:"Allen 2+ TDs", odds:"-140", result:"L" },
 { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", result:"L" },
 { slot:"Spread", mult:4, pick:"49ers -4.5", odds:"-110", result:"pending" },
 { slot:"Parlay", mult:5, pick:"Panthers + Bears",odds:"+380", result:"pending" },
 ]},
 { member:"Dave K.", picks:[
 { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-165", result:"W" },
 { slot:"Prop", mult:2, pick:"Hurts 2+ TDs", odds:"+175", result:"pending" },
 { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", result:"W" },
 { slot:"Spread", mult:4, pick:"Bills -5", odds:"-115", result:"W" },
 { slot:"Parlay", mult:5, pick:"Cowboys + Giants",odds:"+510", result:"pending" },
 ]},
 { member:"Chris R.", picks:[
 { slot:"Moneyline", mult:1, pick:"Packers ML", odds:"-125", result:"L" },
 { slot:"Prop", mult:2, pick:"Love 250+ Yds", odds:"-115", result:"pending" },
 { slot:"Over/Under",mult:3, pick:"Over 43", odds:"-118", result:"L" },
 { slot:"Spread", mult:4, pick:"Falcons -6", odds:"-108", result:"W" },
 { slot:"Parlay", mult:5, pick:"Raiders + Jets", odds:"+580", result:"pending" },
 ]},
 { member:"Tom B.", picks:[
 { slot:"Moneyline", mult:1, pick:"Raiders ML", odds:"+240", result:"L" },
 { slot:"Prop", mult:2, pick:"CMC 90+ Yds", odds:"-110", result:"pending" },
 { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", result:"W" },
 { slot:"Spread", mult:4, pick:"Chiefs -6.5", odds:"-110", result:"pending" },
 { slot:"Parlay", mult:5, pick:"Browns + Cards", odds:"+460", result:"L" },
 ]},
 { member:"Alex M.", picks:[
 { slot:"Moneyline", mult:1, pick:"Cowboys ML", odds:"+350", result:"L" },
 { slot:"Prop", mult:2, pick:"Dak 300+ Yds", odds:"-120", result:"L" },
 { slot:"Over/Under",mult:3, pick:"Over 44", odds:"-110", result:"W" },
 { slot:"Spread", mult:4, pick:"Cowboys +3", odds:"-110", result:"L" },
 { slot:"Parlay", mult:5, pick:"Panthers + Bears",odds:"+420", result:"pending" },
 ]},
 { member:"Ryan S.", picks:[
 { slot:"Moneyline", mult:1, pick:"Chargers ML", odds:"-165", result:"W" },
 { slot:"Prop", mult:2, pick:"Herbert 280+ Yds",odds:"-115", result:"pending" },
 { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-108", result:"L" },
 { slot:"Spread", mult:4, pick:"Chargers -3.5", odds:"-110", result:"W" },
 { slot:"Parlay", mult:5, pick:"Colts + Saints", odds:"+390", result:"L" },
 ]},
 { member:"Jake P.", picks:[
 { slot:"Moneyline", mult:1, pick:"Giants ML", odds:"+310", result:"L" },
 { slot:"Prop", mult:2, pick:"Jones 220+ Yds", odds:"-110", result:"L" },
 { slot:"Over/Under",mult:3, pick:"Over 40.5", odds:"-112", result:"pending" },
 { slot:"Spread", mult:4, pick:"Giants +3.5", odds:"-110", result:"L" },
 { slot:"Parlay", mult:5, pick:"Giants + Raiders",odds:"+650", result:"L" },
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
 { name:"Joe", record:"9-3", units:"+18.2", roi:"+22%", streak:"W4", isYou:true, isCommissioner:false },
 { name:"Dave K.", record:"8-4", units:"+15.1", roi:"+18%", streak:"W2", isYou:false, isCommissioner:true },
 { name:"Mike D.", record:"7-5", units:"+8.4", roi:"+10%", streak:"L1", isYou:false, isCommissioner:false },
 { name:"Chris R.", record:"6-6", units:"+2.1", roi:"+3%", streak:"W1", isYou:false, isCommissioner:false },
 { name:"Tom B.", record:"4-8", units:"-6.2", roi:"-8%", streak:"L3", isYou:false, isCommissioner:false },
 { name:"Alex M.", record:"3-9", units:"-12.4", roi:"-15%", streak:"L4", isYou:false, isCommissioner:false },
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
 { name:"Joe", record:"6-2", units:"+9.4", roi:"+16%", streak:"W2", isYou:true, isCommissioner:true },
 { name:"Chris R.", record:"5-3", units:"+6.8", roi:"+12%", streak:"W1", isYou:false, isCommissioner:false },
 { name:"Ryan S.", record:"4-4", units:"+1.2", roi:"+2%", streak:"L1", isYou:false, isCommissioner:false },
 { name:"Jake P.", record:"3-5", units:"-3.4", roi:"-6%", streak:"L2", isYou:false, isCommissioner:false },
 { name:"Tom B.", record:"2-6", units:"-7.8", roi:"-13%", streak:"L4", isYou:false, isCommissioner:false },
 { name:"Alex M.", record:"1-7", units:"-11.2", roi:"-18%", streak:"L5", isYou:false, isCommissioner:false },
 ],
 weekPicks:[],
 },
];

const POWER_UPS = [
 { id:"enhance15", icon:"enhance", name:"Spread +1.5", desc:"Move your spread 1.5 pts in your favor", rarity:"common", color:IOS.blue, type:"offensive", tier:1.5 },
 { id:"enhance3", icon:"enhance", name:"Spread +3", desc:"Move your spread 3 pts in your favor", rarity:"rare", color:IOS.blue, type:"offensive", tier:3 },
 { id:"enhance45", icon:"enhance", name:"Spread +4.5", desc:"Move your spread 4.5 pts in your favor", rarity:"legendary", color:IOS.blue, type:"offensive", tier:4.5 },
 { id:"double", icon:"double", name:"Double Down", desc:"Double one pick's points this week (after its multiplier)", rarity:"rare", color:IOS.yellow, type:"offensive" },
 { id:"insurance", icon:"insurance", name:"Insurance", desc:"Parlay misses by one leg? Scores as if that leg wasn't in it", rarity:"common", color:IOS.green, type:"defensive" },
 { id:"second", icon:"clock", name:"Second Chance", desc:"While your pick's game is live, bail to an unstarted game for half points", rarity:"legendary", color:IOS.orange, type:"offensive" },
];

const TROPHIES = [
 { id:"sharp", icon:"", name:"Sharpshooter", desc:"Highest season win rate", holder:"Dave K.", yours:false, color:IOS.yellow },
 { id:"long", icon:"", name:"Longshot King", desc:"Most longshots hit", holder:"YOU", yours:true, color:IOS.pink },
 { id:"hot", icon:"", name:"Hot Hand", desc:"Longest win streak", holder:"Dave K.", yours:false, color:IOS.orange },
 { id:"upset", icon:"🃏", name:"Upset Artist", desc:"Most upsets correctly called", holder:"YOU", yours:true, color:IOS.purple },
 { id:"whale", icon:"", name:"The Whale", desc:"Most units won in a single week", holder:"Chris R.", yours:false, color:IOS.green },
 { id:"cold", icon:"", name:"Ice Cold", desc:"Worst ROI in the league", holder:"Jake P.", yours:false, color:IOS.teal },
 { id:"grind", icon:"", name:"The Grinder", desc:"Most picks submitted all season", holder:"Ryan S.", yours:false, color:IOS.gray },
 { id:"come", icon:"", name:"Comeback Kid", desc:"Biggest weekly points swing", holder:"Tom B.", yours:false, color:IOS.yellow },
 { id:"goat", icon:"", name:"GOAT", desc:"Season champion", holder:"???", yours:false, color:IOS.yellow },
];


const MATCHUP_HISTORY = []; // replaced by real Supabase data
const _UNUSED_MH = [
 {
 week:1, opp:"Jake P.", result:"W", myScore:3, oppScore:2,
 myPicks:[
 { slot:"Moneyline", mult:1, pick:"KC Chiefs", odds:"-180", impliedOdds:-180, result:"W" },
 { slot:"Prop", mult:2, pick:"Mahomes 300+ Yds", odds:"-130", impliedOdds:-130, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Over 47.5", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Spread", mult:4, pick:"Eagles -3", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Parlay", mult:5, pick:"Raiders ML + Cowboys +7", odds:"+420", impliedOdds:420, result:"L" },
 ],
 oppPicks:[
 { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", impliedOdds:-210, result:"W" },
 { slot:"Prop", mult:2, pick:"Josh Allen 2+ TDs", odds:"-140", impliedOdds:-140, result:"L" },
 { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Spread", mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Parlay", mult:5, pick:"Bears ML + Panthers ML", odds:"+380", impliedOdds:380, result:"L" },
 ],
 },
 {
 week:2, opp:"Ryan S.", result:"W", myScore:4, oppScore:1,
 myPicks:[
 { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-165", impliedOdds:-165, result:"W" },
 { slot:"Prop", mult:2, pick:"Jalen Hurts 2+ Rush TDs", odds:"+175", impliedOdds:175, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", impliedOdds:-115, result:"W" },
 { slot:"Spread", mult:4, pick:"Bills -5", odds:"-115", impliedOdds:-115, result:"W" },
 { slot:"Parlay", mult:5, pick:"Cowboys ML + Giants ML", odds:"+510", impliedOdds:510, result:"L" },
 ],
 oppPicks:[
 { slot:"Moneyline", mult:1, pick:"Cowboys ML", odds:"+350", impliedOdds:350, result:"L" },
 { slot:"Prop", mult:2, pick:"Dak 300+ Yds", odds:"-120", impliedOdds:-120, result:"L" },
 { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Spread", mult:4, pick:"Cowboys +3", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Parlay", mult:5, pick:"Panthers ML + Broncos ML", odds:"+640", impliedOdds:640, result:"L" },
 ],
 },
 {
 week:3, opp:"Alex M.", result:"L", myScore:2, oppScore:3,
 myPicks:[
 { slot:"Moneyline", mult:1, pick:"Packers ML", odds:"-125", impliedOdds:-125, result:"L" },
 { slot:"Prop", mult:2, pick:"Jordan Love 250+ Yds", odds:"-115", impliedOdds:-115, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Over 43", odds:"-118", impliedOdds:-118, result:"L" },
 { slot:"Spread", mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Parlay", mult:5, pick:"Jets ML + Raiders ML", odds:"+580", impliedOdds:580, result:"L" },
 ],
 oppPicks:[
 { slot:"Moneyline", mult:1, pick:"Vikings ML", odds:"+105", impliedOdds:105, result:"W" },
 { slot:"Prop", mult:2, pick:"Jefferson 100+ Yds", odds:"-130", impliedOdds:-130, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Spread", mult:4, pick:"Vikings +2", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Parlay", mult:5, pick:"Bears ML + Panthers ML", odds:"+420", impliedOdds:420, result:"L" },
 ],
 },
 {
 week:4, opp:"Chris R.", result:"W", myScore:3, oppScore:2,
 myPicks:[
 { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", impliedOdds:-210, result:"W" },
 { slot:"Prop", mult:2, pick:"Josh Allen 35+ Attempts", odds:"-115", impliedOdds:-115, result:"L" },
 { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", impliedOdds:-115, result:"W" },
 { slot:"Spread", mult:4, pick:"KC Chiefs -6.5", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Parlay", mult:5, pick:"Raiders ML + Giants ML", odds:"+490", impliedOdds:490, result:"L" },
 ],
 oppPicks:[
 { slot:"Moneyline", mult:1, pick:"Rams ML", odds:"+115", impliedOdds:115, result:"L" },
 { slot:"Prop", mult:2, pick:"Kupp 80+ Yds", odds:"-125", impliedOdds:-125, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Spread", mult:4, pick:"Rams +4.5", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Parlay", mult:5, pick:"Panthers ML + Bears ML", odds:"+520", impliedOdds:520, result:"L" },
 ],
 },
 {
 week:5, opp:"Tom B.", result:"L", myScore:2, oppScore:3,
 myPicks:[
 { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-155", impliedOdds:-155, result:"W" },
 { slot:"Prop", mult:2, pick:"Hurts Over 1.5 TDs", odds:"-140", impliedOdds:-140, result:"L" },
 { slot:"Over/Under",mult:3, pick:"Over 44", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Spread", mult:4, pick:"Cowboys +7", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Parlay", mult:5, pick:"Jets ML + Broncos ML", odds:"+610", impliedOdds:610, result:"L" },
 ],
 oppPicks:[
 { slot:"Moneyline", mult:1, pick:"49ers ML", odds:"-195", impliedOdds:-195, result:"W" },
 { slot:"Prop", mult:2, pick:"CMC 90+ Rush Yds", odds:"-110", impliedOdds:-110, result:"W" },
 { slot:"Over/Under",mult:3, pick:"Over 45.5", odds:"-115", impliedOdds:-115, result:"W" },
 { slot:"Spread", mult:4, pick:"49ers -4.5", odds:"-110", impliedOdds:-110, result:"L" },
 { slot:"Parlay", mult:5, pick:"Raiders ML + Panthers ML", odds:"+540", impliedOdds:540, result:"L" },
 ],
 },
];

const STANDINGS = [
 { rank:1, name:"Dave K.", record:"9-1", units:"+22.0", roi:"+32%", streak:"W5", wpct:"90%", wr:["W","W","W","L","W","W","W","W","W","W"] },
 { rank:2, name:"Joe", record:"7-3", units:"+12.5", roi:"+18%", streak:"W3", wpct:"70%", wr:["W","W","L","W","L","W","-","-","-","-"] },
 { rank:3, name:"Mike D.", record:"6-4", units:"+4.2", roi:"+6%", streak:"L1", wpct:"60%", wr:["W","L","W","W","L","L","-","-","-","-"] },
 { rank:4, name:"Chris R.", record:"5-5", units:"-1.8", roi:"-3%", streak:"W1", wpct:"50%", wr:["L","W","L","W","L","W","-","-","-","-"] },
 { rank:5, name:"Tom B.", record:"3-7", units:"-9.4", roi:"-14%", streak:"L3", wpct:"30%", wr:["W","L","L","L","W","L","-","-","-","-"] },
 { rank:6, name:"Alex M.", record:"4-6", units:"-5.1", roi:"-8%", streak:"L2", wpct:"40%", wr:["L","W","L","W","L","L","-","-","-","-"] },
 { rank:7, name:"Ryan S.", record:"3-7", units:"-11.2", roi:"-17%", streak:"L4", wpct:"30%", wr:["W","L","L","L","L","L","-","-","-","-"] },
 { rank:8, name:"Jake P.", record:"2-8", units:"-15.8", roi:"-24%", streak:"L5", wpct:"20%", wr:["L","L","L","W","L","L","-","-","-","-"] },
];

const GAPER_MEMBERS = ["joe", "mlaforte", "esoumekhian", "dyaffe", "aweinstock", "Player6"];

const SCHEDULE = []; // replaced by real Supabase data
const _UNUSED_SCHEDULE = [
 { week:1, opp:"mlaforte", ms:null, os:null, result:"live" },
 { week:2, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
 { week:3, opp:"dyaffe", ms:null, os:null, result:"upcoming" },
 { week:4, opp:"aweinstock", ms:null, os:null, result:"upcoming" },
 { week:5, opp:"Player6", ms:null, os:null, result:"upcoming" },
 { week:6, opp:"mlaforte", ms:null, os:null, result:"upcoming" },
 { week:7, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
 { week:8, opp:"dyaffe", ms:null, os:null, result:"upcoming" },
 { week:9, opp:"aweinstock", ms:null, os:null, result:"upcoming" },
 { week:10, opp:"Player6", ms:null, os:null, result:"upcoming" },
 { week:11, opp:"mlaforte", ms:null, os:null, result:"upcoming" },
 { week:12, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
 { week:13, opp:"dyaffe", ms:null, os:null, result:"upcoming" },
 { week:14, opp:"aweinstock", ms:null, os:null, result:"upcoming" },
 { week:15, opp:"Player6", ms:null, os:null, result:"upcoming" },
 { week:16, opp:"mlaforte", ms:null, os:null, result:"upcoming" },
 { week:17, opp:"esoumekhian", ms:null, os:null, result:"upcoming" },
 { week:18, opp:"dyaffe", ms:null, os:null, result:"upcoming" },
];

const CHAT = [
 { id:1, user:"Dave K.", init:"D", time:"2h", text:"lmaooo that KC cover was filthy ", me:false },
 { id:2, user:"Mike D.", init:"M", time:"2h", text:"bro refs saved KC again", me:false },
 { id:3, user:"Joe", init:"J", time:"1h 52", text:"I had Chiefs too, easy money ", me:true },
 { id:4, user:"Tom B.", init:"T", time:"1h 45", text:"nobody talk to me rn", me:false },
 { id:5, user:"Dave K.", init:"D", time:"1h 40", text:"standings lookin scary. someone stop me", me:false },
 { id:6, user:"Chris R.",init:"C", time:"1h 30", text:"Joe you're the only one who can catch Dave ", me:false },
 { id:7, user:"Joe", init:"J", time:"1h 20", text:"I got Dave week 7. it's on sight", me:true },
 { id:8, user:"Dave K.", init:"D", time:"1h 18", text:" prepare yourself", me:false },
 { id:9, user:"Ryan S.", init:"R", time:"45m", text:"MNF needs to hurry up I can't sit at the bottom", me:false },
 { id:10, user:"Joe", init:"J", time:"12m", text:"Bills -6.5 lock of the week. trust me ", me:true },
 { id:11, user:"Mike D.", init:"M", time:"10m", text:"last time you said that you took Cowboys +7 ", me:false },
 { id:12, user:"Tom B.", init:"T", time:"5m", text:"^^^ ", me:false },
];

const WHEEL_ITEMS = ["double","enhance15","insurance","second","enhance3","enhance45"].map(_id=>POWER_UPS.find(p=>p.id===_id)).filter(Boolean);

// ─── SPORT DETECTION (by team name) ───────────────────────────────
// Used to keep each league's bet list scoped to its own sport(s), even if an
// upstream odds feed returns games for the wrong sport. "cardinals"/"giants"/
// "rangers" are intentionally listed under multiple leagues (ambiguous) so we
// never wrongly drop a real game for those franchises.
const SPORT_NICKS = {
 nfl:["chiefs","eagles","49ers","niners","cowboys","bills","dolphins","patriots","jets","new york giants","ny giants","rams","chargers","raiders","seahawks","arizona cardinals","packers","bears","vikings","lions","falcons","saints","panthers","buccaneers","bucs","steelers","ravens","browns","bengals","titans","colts","texans","jaguars","jags","broncos","commanders","cardinals","giants"],
 nba:["lakers","warriors","celtics","bucks","suns","heat","nets","bulls","nuggets","grizzlies","mavericks","mavs","clippers","hawks","cavaliers","cavs","76ers","sixers","raptors","knicks","pacers","timberwolves","thunder","sacramento kings","trail blazers","blazers","jazz","pelicans","spurs","hornets","wizards","magic","pistons","rockets"],
 mlb:["dodgers","yankees","red sox","cubs","braves","astros","blue jays","mets","phillies","padres","brewers","reds","mariners","athletics","texas rangers","orioles","rays","marlins","nationals","pirates","rockies","diamondbacks","dbacks","angels","royals","guardians","twins","tigers","white sox","st. louis cardinals","st louis cardinals","san francisco giants","sf giants","cardinals","giants","rangers"],
};
function guessSports(text=""){
 const s = (text||"").toLowerCase();
 const hasNick = (nick) => {
 const esc = nick.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(s);
 };
 const out = [];
 for(const sp of Object.keys(SPORT_NICKS)){
 if(SPORT_NICKS[sp].some(hasNick)) out.push(sp);
 }
 return out;
}

function toDecimal(a){return a>=0?(a/100)+1:(100/Math.abs(a))+1;}function toAmerican(d){return d>=2?`+${Math.round((d-1)*100)}`:`${Math.round(-100/(d-1))}`;}
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
const rankMedal=r=>`${r}`;

const polarToCart=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

// Which power-ups may attach to which picks. Double = anything; Spread Enhancer
// = spreads only; Insurance = parlays only; Second Chance = single picks only.
function puAppliesTo(puId, category, isParlay) {
  if (!puId) return false;
  if (puId === "double") return true;
  if (puId.indexOf("enhance") === 0) return category === "spread";
  if (puId === "insurance") return !!isParlay || category === "longshot";
  if (puId === "second") return !isParlay && category !== "longshot";
  return true;
}

function PUBadge({ puId, size=16 }) {
  if (!puId) return null;
  const pu = POWER_UPS.find(p => p.id === puId);
  const color = pu ? pu.color : "#0A84FF";
  return (
    <span title={pu ? pu.name : ""} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,borderRadius:"50%",background:color+"26",border:"1px solid "+color+"66",flexShrink:0,overflow:"hidden"}}>
      <span style={{display:"inline-flex",transform:"scale("+(size/30)+")",transformOrigin:"center"}}>{puSVG(puId, color)}</span>
    </span>
  );
}

function Ticker({ value, decimals=0, prefix="", suffix="", className, style, dur=850 }){
  const [disp,setDisp]=useState(value||0);
  const fromRef=useRef(value||0);
  useEffect(()=>{
    const from=fromRef.current||0, to=Number(value)||0, t0=performance.now(); let raf;
    if(from===to){ setDisp(to); return; }
    const step=(t)=>{ const k=Math.min(1,(t-t0)/dur); const v=from+(to-from)*(1-Math.pow(1-k,3)); setDisp(v); if(k<1){ raf=requestAnimationFrame(step); } else { fromRef.current=to; } };
    raf=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(raf);
  },[value,dur]);
  const n = decimals>0 ? (Number(disp)||0).toFixed(decimals) : Math.round(Number(disp)||0);
  return <span className={className} style={style}>{prefix}{n}{suffix}</span>;
}
function StreakFlame({ count=0, size=18 }){
  if(!count || count<1) return null;
  const c=Math.min(count,10);
  const grow=1+c*0.07;
  const w=size, h=size*grow*1.35;
  const tip=c>=6?"#FF375F":(c>=3?"#FF6A00":"#FF9F0A");
  const gid="fl"+count+"_"+size;
  return (
    <svg className="flame-flicker" width={w} height={h} viewBox="0 0 24 34" style={{display:"block",overflow:"visible",filter:`drop-shadow(0 0 ${3+c}px ${tip}88)`}}>
      <defs><linearGradient id={gid} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#FFE08A"/><stop offset="45%" stopColor="#FF9F0A"/><stop offset="100%" stopColor={tip}/>
      </linearGradient></defs>
      <path d="M12 33C5.5 31 3 25 6.5 19.5c.8 2.6 2.6 2.8 2.6.6 0-3.2-2.2-5.4 1.1-9.6.6 2.8 2.2 4 3.8 5.6C18 19 18.5 22 18.5 25c0 4.2-3.2 7.2-6.5 8z" fill={`url(#${gid})`}/>
      {c>=6 && <path d="M12 30c-2.3-.8-3.3-3-2.1-5.1.5 1.3 1.5 1.4 1.5.1 0-1.4-.8-2.5.6-4.2.4 1.3 1.2 1.9 1.9 2.7.9.9 1.1 1.9 1.1 3 0 2.1-1.3 3.1-3 3.5z" fill="#64D2FF" opacity=".7"/>}
    </svg>
  );
}
function StatRadar({ axes=[], size=210, color="#0A84FF" }){
  if(!axes.length) return null;
  const n=axes.length, cx=size/2, cy=size/2, R=size/2-30;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r];};
  const poly=axes.map((ax,i)=>pt(i,R*Math.max(0.05,ax.value)).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block",margin:"0 auto"}}>
      {[0.25,0.5,0.75,1].map((g,gi)=><polygon key={"g"+gi} points={axes.map((_,i)=>pt(i,R*g).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>)}
      {axes.map((_,i)=>{const[x,y]=pt(i,R);return <line key={"l"+i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>;})}
      <polygon points={poly} fill={color+"30"} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {axes.map((ax,i)=>{const[x,y]=pt(i,R*Math.max(0.05,ax.value));return <circle key={"c"+i} cx={x} cy={y} r="3" fill={ax.color||color}/>;})}
      {axes.map((ax,i)=>{const[x,y]=pt(i,R+15);return <text key={"t"+i} x={x} y={y} fill="rgba(255,255,255,0.65)" fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{ax.tag}</text>;})}
    </svg>
  );
}
function Confetti({ show }){
  const ref=useRef(null);
  useEffect(()=>{
    if(!show||!ref.current) return;
    const cv=ref.current, ctx=cv.getContext("2d");
    const W=cv.width=cv.offsetWidth||window.innerWidth, H=cv.height=cv.offsetHeight||window.innerHeight;
    const colors=["#0A84FF","#30D158","#FFD60A","#FF375F","#BF5AF2","#64D2FF"];
    const parts=[];
    for(let i=0;i<100;i++) parts.push({x:W/2+(Math.random()-.5)*140, y:H*0.30, vx:(Math.random()-.5)*10, vy:Math.random()*-10-3, g:0.30+Math.random()*0.12, w:5+Math.random()*5, c:colors[i%colors.length], rot:Math.random()*6.28, vr:(Math.random()-.5)*.5});
    let raf, t0=performance.now();
    const tick=(t)=>{ const el=t-t0; ctx.clearRect(0,0,W,H);
      parts.forEach(p=>{ p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=Math.max(0,1-el/2600); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.w/2,p.w,p.w*0.55); ctx.restore(); });
      if(el<2600) raf=requestAnimationFrame(tick); else ctx.clearRect(0,0,W,H);
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[show]);
  if(!show) return null;
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:99990}}/>;
}
const PC_TIER_C = { bronze:"#d8965a", silver:"#cdd8e8", gold:"#f5d26e", legend:"#7aa8ff" };
const PC_TIER_BG = { bronze:["#5a3a22","#241509"], silver:["#5c6573","#202730"], gold:["#7c6320","#2a2009"], legend:["#16284f","#0a1030"] };
function pcDrawCard(data){
  const W=600,H=900,c=document.createElement("canvas"); c.width=W; c.height=H;
  const x=c.getContext("2d"); const BG=PC_TIER_BG[data.tier]||PC_TIER_BG.bronze; const AC=PC_TIER_C[data.tier]||"#fff";
  const rr=(a,b,w,h,r)=>{ if(x.roundRect){x.beginPath();x.roundRect(a,b,w,h,r);} else {x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();} };
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,BG[0]); g.addColorStop(1,BG[1]);
  rr(0,0,W,H,44); x.fillStyle=g; x.fill();
  x.lineWidth=4; x.strokeStyle=AC; rr(7,7,W-14,H-14,38); x.stroke();
  x.textBaseline="top"; x.textAlign="left";
  x.fillStyle="#fff"; x.font="900 118px Barlow, system-ui, sans-serif"; x.fillText(String(data.ovr),46,34);
  x.fillStyle="rgba(255,255,255,.85)"; x.font="800 22px Barlow, system-ui, sans-serif"; x.fillText("OVR",54,160);
  x.textAlign="right"; x.fillStyle=AC; x.font="900 22px Barlow, system-ui, sans-serif"; x.fillText((data.tier||"").toUpperCase(),W-50,54);
  x.font="800 24px Barlow, system-ui, sans-serif"; x.fillText((data.arch||"").toUpperCase(),W-50,92);
  x.beginPath(); x.arc(W/2,326,94,0,Math.PI*2); x.fillStyle="rgba(255,255,255,.1)"; x.fill(); x.lineWidth=2; x.strokeStyle="rgba(255,255,255,.3)"; x.stroke();
  x.fillStyle="#fff"; x.textAlign="center"; x.font="900 74px Barlow, system-ui, sans-serif"; x.fillText(data.initials,W/2,290);
  x.font="900 48px Barlow, system-ui, sans-serif"; x.fillText((data.name||"").toUpperCase(),W/2,448);
  x.fillStyle="rgba(255,255,255,.25)"; x.fillRect(82,532,W-164,2);
  const stat=(lbl,val,cx)=>{ x.fillStyle="#fff"; x.font="900 38px Barlow, system-ui, sans-serif"; x.fillText(String(val),cx,560); x.fillStyle="rgba(255,255,255,.6)"; x.font="800 17px Barlow, system-ui, sans-serif"; x.fillText(lbl.toUpperCase(),cx,610); };
  stat("Record",data.record,158); stat("Streak",(data.streak.count||0)+(data.streak.type||"W"),300); stat("Win",data.winPct,442);
  x.textAlign="left"; x.fillStyle="rgba(255,255,255,.6)"; x.font="800 20px Barlow, system-ui, sans-serif"; x.fillText(data.serial,48,H-54);
  x.textAlign="right"; x.fillText("PICKLOCK · 2026 S1",W-48,H-54);
  return c;
}
function PlayerCard({ data, IOS }){
  const cardRef=useRef(null), stageRef=useRef(null);
  const [flipped,setFlipped]=useState(false);
  const [badge,setBadge]=useState(null);
  const [toast,setToast]=useState("");
  const TC=PC_TIER_C[data.tier]||"#fff";
  useEffect(()=>{ if(cardRef.current && flipped) cardRef.current.style.transform=""; },[flipped]);
  const onMove=(e)=>{ const st=stageRef.current, cd=cardRef.current; if(!st||!cd) return;
    const r=st.getBoundingClientRect(); const px=((e.clientX-r.left)/r.width-.5)*2, py=((e.clientY-r.top)/r.height-.5)*2;
    if(!flipped) cd.style.transform="rotateX("+(-py*11).toFixed(2)+"deg) rotateY("+(px*11).toFixed(2)+"deg)";
    cd.style.setProperty("--mx",(50+px*60)+"%"); cd.style.setProperty("--my",(50+py*60)+"%");
    cd.style.setProperty("--gx",(50+px*50)+"%"); cd.style.setProperty("--gy",(50+py*50)+"%"); };
  const onEnter=()=>{ if(cardRef.current) cardRef.current.classList.add("act"); };
  const onLeave=()=>{ const cd=cardRef.current; if(!cd) return; cd.classList.remove("act"); if(!flipped) cd.style.transform="rotateX(0) rotateY(0)"; };
  const shareCard=async()=>{
    try{
      if(document.fonts&&document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
      const canvas=pcDrawCard(data);
      const url="https://lined-up-murex.vercel.app";
      const text=data.ovr+" OVR "+(data.tier||"").toUpperCase()+" — "+data.arch+". My PickLock card. Think you can beat me?";
      const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));
      const file=blob?new File([blob],"picklock-card.png",{type:"image/png"}):null;
      if(file && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],text,title:"My PickLock Card"});
      } else if(navigator.share){
        await navigator.share({text,url,title:"My PickLock Card"});
      } else {
        const a=document.createElement("a"); a.href=canvas.toDataURL("image/png"); a.download="picklock-card.png"; a.click();
        try{ await navigator.clipboard.writeText(text+" "+url); }catch(e){}
        setToast("Card saved — caption copied"); setTimeout(()=>setToast(""),2400);
      }
    }catch(e){ /* user cancelled */ }
  };
  return (
  <div style={{position:"relative"}}>
    <div className="pc-stage" ref={stageRef} onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={cardRef} className={"pc-card"+(flipped?" flip":"")} onClick={()=>{ if(window.matchMedia("(pointer:coarse)").matches) setFlipped(f=>!f); }}>
        <div className={"pc-face pc-front pc-skin-"+data.tier+" pc-bd-"+data.tier}>
          <div className={"pc-holo"+(data.tier==="legend"?" legend":"")}/><div className="pc-glare"/>
          <div className="pc-pad">
            <div className="pc-toprow">
              <div className="pc-ovr"><div className="pc-num"><Ticker value={data.ovr}/></div><div className="pc-lab">OVR</div></div>
              <div style={{textAlign:"right"}}>
                <div className="pc-tierbadge" style={{color:TC,borderColor:TC+"99"}}>{(data.tier||"").toUpperCase()}</div>
                <div className="pc-arch" style={{color:TC}}>{(data.arch||"").toUpperCase()}</div>
              </div>
            </div>
            <div className="pc-avatar">{data.initials}</div>
            <div className="pc-name">{data.name}</div>
            <div className="pc-divider"/>
            <div className="pc-stats">
              <div className="pc-stat"><div className="pc-v">{data.record}</div><div className="pc-k">Record</div></div>
              <div className="pc-stat"><div className="pc-v" style={{display:"inline-flex",alignItems:"center",gap:4}}>{(data.streak.count||0)}{data.streak.type||"W"} <svg width="10" height="12" viewBox="0 0 24 28" fill="#FF6B35"><path d="M12 0c2 6-3 7-3 12 0 2 1 3 2 3 2 0 2-3 1-5 4 2 6 6 6 9 0 5-4 9-9 9s-9-4-9-9c0-6 7-9 12-19z"/></svg></div><div className="pc-k">Streak</div></div>
              <div className="pc-stat"><div className="pc-v">{data.winPct}</div><div className="pc-k">Win rate</div></div>
            </div>
            <div className="pc-badges">
              {data.badges.map(b=>(
                <div key={b.id} className={"pc-bdg "+(b.unlocked?"on":"off")} onClick={(e)=>{e.stopPropagation();setBadge(b);}}>
                  <div className="pc-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={b.unlocked?TC:"#fff"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:b.svg}}/></div>
                  <div className="pc-nm" style={{color:b.unlocked?"#fff":"rgba(255,255,255,.7)"}}>{b.short}</div>
                </div>
              ))}
            </div>
            <div className="pc-footrow"><span>{data.serial}</span><span>PICKLOCK · 2026 S1</span></div>
          </div>
        </div>
        <div className={"pc-face pc-back pc-skin-"+data.tier+" pc-bd-"+data.tier}>
          <div className={"pc-holo"+(data.tier==="legend"?" legend":"")}/><div className="pc-glare"/>
          <div className="pc-pad">
            <div className="pc-bh">Season Card</div>
            {data.backRows.map((r,i)=>(<div key={i} className="pc-brow"><span className="pc-bk">{r[0]}</span><span className="pc-bv">{r[1]}</span></div>))}
          </div>
        </div>
      </div>
    </div>
    <div className="pc-actions">
      <button className="pc-btn share" onClick={shareCard}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>Share card</button>
      <button className="pc-btn flip" onClick={()=>setFlipped(f=>!f)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>Flip</button>
    </div>
    {badge && (
    <div className="pc-bsheet-bg" onClick={(e)=>{ if(e.currentTarget===e.target) setBadge(null); }}>
      <div className="pc-bsheet">
        <div className="pc-grip"/>
        <div className="pc-bs-top">
          <div className="pc-bs-ic" style={{background:badge.unlocked?TC+"22":"rgba(255,255,255,.06)",border:"1px solid "+(badge.unlocked?TC+"66":"rgba(255,255,255,.12)")}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={badge.unlocked?TC:"#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:badge.svg}}/>
          </div>
          <div><div className="pc-bs-nm">{badge.name}</div><div className="pc-bs-st" style={{color:badge.unlocked?IOS.green:"rgba(255,255,255,.4)"}}>{badge.unlocked?"Unlocked":"Locked"}</div></div>
        </div>
        <div className="pc-bs-desc">{badge.desc}</div>
        <div className="pc-bs-track"><div className="pc-bs-fill" style={{width:Math.round(Math.min((badge.cur||0)/badge.goal,1)*100)+"%",background:badge.unlocked?IOS.green:TC}}/></div>
        <div className="pc-bs-prog"><span>{badge.unlocked?"Complete":((badge.cur||0)+(badge.suffix||"")+" / "+badge.goal+(badge.suffix||""))}</span><span style={{opacity:.5}}>{badge.unlocked?"":(Math.max(0,badge.goal-(badge.cur||0))+(badge.suffix||"")+" to go")}</span></div>
      </div>
    </div>
    )}
    {toast && <div className="pc-toast">{toast}</div>}
  </div>
  );
}
// ── Weekly recap: superlatives, count-up, share card ──
const WREC_EMB = {
  trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  rocket:'<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.18 2.18 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/>',
  bolt:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  snow:'<line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
};
function wrecSuperlative(picks, wr, stats){
  picks = picks || [];
  const won = picks.filter(p=>p.result==="W"), lost = picks.filter(p=>p.result==="L");
  const total = picks.length, winRate = total ? won.length/total : 0;
  const lsHits = won.filter(p=>p.slot==="longshot").length;
  const myPts = parseFloat(wr&&wr.myPts)||0, oppPts = parseFloat(wr&&wr.oppPts)||0, margin = myPts-oppPts;
  const streak = (stats&&stats.currentStreak&&stats.currentStreak.type==="W") ? stats.currentStreak.count : 0;
  const avgMult = total ? picks.reduce((a,p)=>a+(parseFloat(p.multiplier)||1),0)/total : 1;
  const T=(title,desc,emblem,color)=>({title,desc,emblem,color});
  if(total>=3 && lost.length===0) return T("Perfect Week","Flawless. "+won.length+"-0 on the week.",WREC_EMB.trophy,"#FFD60A");
  if(lsHits>=2) return T("Longshot Legend","You cashed "+lsHits+" longshots at +400 or better.",WREC_EMB.rocket,"#BF5AF2");
  if(wr&&wr.won&&margin>0&&margin<=8) return T("The Closer","You took it by "+margin.toFixed(1)+" in the clutch.",WREC_EMB.bolt,"#0A84FF");
  if(total>=4 && winRate>=0.75) return T("Sharpshooter",Math.round(winRate*100)+"% of your picks cashed.",WREC_EMB.target,"#30D158");
  if(streak>=3) return T("On A Heater",streak+" weeks hot and climbing.",WREC_EMB.flame,"#FF6B35");
  if(avgMult>=2.2) return T("Big Swing","You swung big — "+avgMult.toFixed(1)+"x average multiplier.",WREC_EMB.layers,"#FFD60A");
  if(total>=8) return T("Volume Shooter",total+" picks this week. Nobody grinds like you.",WREC_EMB.layers,"#0A84FF");
  if(total>0 && winRate<0.4) return T("Cold Week","Rough one — "+won.length+"-"+lost.length+". Next week's yours.",WREC_EMB.snow,"#8a9098");
  return T("Mr. Consistent","Steady hand — "+won.length+"-"+lost.length+" on the week.",WREC_EMB.shield,"#0A84FF");
}
function WrecCount({ to, dur=900, dec=0, pre="", suf="" }){
  const [v,setV]=useState(0);
  useEffect(()=>{ const t0=performance.now(); let raf;
    const step=(t)=>{ const k=Math.min(1,(t-t0)/dur); setV(to*(1-Math.pow(1-k,3))); if(k<1) raf=requestAnimationFrame(step); else setV(to); };
    raf=requestAnimationFrame(step); return ()=>cancelAnimationFrame(raf);
  },[to,dur]);
  return <>{pre}{dec>0?v.toFixed(dec):Math.round(v)}{suf}</>;
}
function wrecDrawCard(d){
  const W=600,H=900,c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
  const rr=(a,b,w,h,r)=>{ if(x.roundRect){x.beginPath();x.roundRect(a,b,w,h,r);} else {x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();} };
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,"#15294f"); g.addColorStop(1,"#0a1230");
  rr(0,0,W,H,44); x.fillStyle=g; x.fill(); x.lineWidth=4; x.strokeStyle="#7aa8ff"; rr(7,7,W-14,H-14,38); x.stroke();
  x.textBaseline="top"; x.textAlign="left";
  x.fillStyle="rgba(255,255,255,.6)"; x.font="800 24px Barlow, system-ui, sans-serif"; x.fillText("WEEK "+d.week+" RECAP",48,48);
  x.fillStyle="#fff"; x.font="900 110px Barlow, system-ui, sans-serif"; x.fillText(d.record,46,92);
  x.font="800 22px Barlow, system-ui, sans-serif"; x.fillStyle="rgba(255,255,255,.7)"; x.fillText("RECORD",52,214);
  x.textAlign="right"; x.fillStyle="#30D158"; x.font="900 84px Barlow, system-ui, sans-serif"; x.fillText((d.points>=0?"+":"")+d.points.toFixed(0),W-48,108);
  x.fillStyle="rgba(255,255,255,.7)"; x.font="800 22px Barlow, system-ui, sans-serif"; x.fillText("POINTS",W-50,214);
  x.textAlign="left"; x.fillStyle="rgba(255,255,255,.25)"; x.fillRect(48,300,W-96,2);
  x.fillStyle=d.sup.color; x.font="900 26px Barlow, system-ui, sans-serif"; x.fillText(d.sup.title.toUpperCase(),48,340);
  x.fillStyle="rgba(255,255,255,.6)"; x.font="600 22px Barlow, system-ui, sans-serif";
  const words=d.sup.desc.split(" "); let line="",yy=384;
  for(const w of words){ if((line+w).length>34){ x.fillText(line,48,yy); line=w+" "; yy+=30; } else line+=w+" "; }
  x.fillText(line,48,yy);
  x.fillStyle="#fff"; x.font="900 56px Barlow, system-ui, sans-serif"; x.fillText((d.name||"YOU").toUpperCase(),48,560);
  x.fillStyle="rgba(255,255,255,.7)"; x.font="700 24px Barlow, system-ui, sans-serif"; x.fillText("League rank  #"+d.rank+"  ·  "+d.streakLabel,48,640);
  x.fillStyle="rgba(255,255,255,.5)"; x.font="800 20px Barlow, system-ui, sans-serif"; x.fillText("PICKLOCK · WEEK "+d.week,48,H-56);
  return c;
}
function soloDrawCard(d){
  const W=600,H=900,c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
  const P=50, AC="#BF5AF2", GR="#30D158", RD="#FF453A", MUT="rgba(255,255,255,.52)", MUT2="rgba(255,255,255,.32)";
  const rr=(a,b,w,h,r)=>{ if(x.roundRect){x.beginPath();x.roundRect(a,b,w,h,r);} else {x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();} };
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,"#141019"); g.addColorStop(.5,"#0c0a12"); g.addColorStop(1,"#08070c");
  rr(0,0,W,H,46); x.fillStyle=g; x.fill();
  x.lineWidth=3; x.strokeStyle="rgba(191,90,242,.4)"; rr(8,8,W-16,H-16,40); x.stroke();
  x.textBaseline="top";
  x.textAlign="left"; x.fillStyle="#fff"; x.font="800 23px Barlow, system-ui, sans-serif"; x.fillText("PICKLOCK",P,54);
  x.fillStyle=AC; x.font="800 23px Barlow, system-ui, sans-serif"; x.fillText(".",P+116,54);
  if(d.name){ x.textAlign="right"; x.fillStyle=MUT; x.font="600 17px Barlow, system-ui, sans-serif"; x.fillText("@"+String(d.name).slice(0,18),W-P,58); }
  x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(P,92,W-2*P,1);
  x.textAlign="left"; x.fillStyle=AC; x.font="800 15px Barlow, system-ui, sans-serif"; x.fillText("SLATE "+d.slate+"   ·   SOLO MODE",P,108);
  x.fillStyle=d.points>=0?GR:RD; x.font="900 128px Barlow, system-ui, sans-serif"; x.fillText((d.points>=0?"+":"")+Math.round(d.points),P-6,132);
  x.fillStyle=MUT; x.font="800 19px Barlow, system-ui, sans-serif"; x.fillText("POINTS THIS SLATE",P,278);
  let y=330;
  if(d.topPct){
    rr(P,y,W-2*P,90,18); x.fillStyle="rgba(191,90,242,.12)"; x.fill(); x.lineWidth=1.5; x.strokeStyle="rgba(191,90,242,.55)"; rr(P,y,W-2*P,90,18); x.stroke();
    x.textAlign="left"; x.fillStyle=AC; x.font="900 46px Barlow, system-ui, sans-serif"; x.fillText("TOP "+d.topPct+"%",P+22,y+20);
    x.textAlign="right"; x.fillStyle="rgba(255,255,255,.72)"; x.font="700 17px Barlow, system-ui, sans-serif"; x.fillText("OF ALL SOLO PICKERS",W-P-22,y+26);
    x.fillStyle=MUT2; x.font="600 13px Barlow, system-ui, sans-serif"; x.fillText("ranked by win rate",W-P-22,y+50);
    y+=116;
  }
  const cells=[["RECORD",d.record],["SLATE WIN",d.slateWinPct+"%"],["STREAK",d.streak>0?(d.streak+(d.streak===1?" slate":" slates")):"—"]];
  const cw=(W-2*P)/3;
  cells.forEach((cl,i)=>{ const cx=P+i*cw;
    x.textAlign="left"; x.fillStyle=MUT2; x.font="700 13px Barlow, system-ui, sans-serif"; x.fillText(cl[0],cx,y);
    x.fillStyle="#fff"; x.font="900 36px Barlow, system-ui, sans-serif"; x.fillText(String(cl[1]),cx,y+22);
  });
  y+=88;
  x.textAlign="left"; x.fillStyle=MUT; x.font="600 17px Barlow, system-ui, sans-serif"; x.fillText("All-time "+d.allTimeWinPct+"%   ·   "+d.picksN+" picks this slate",P,y);
  y+=38; x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(P,y,W-2*P,1); y+=34;
  if(d.bestPick){
    x.fillStyle=AC; x.font="800 13px Barlow, system-ui, sans-serif"; x.fillText("PLAY OF THE SLATE",P,y);
    let nm=String(d.bestPick.name||""); if(nm.length>26) nm=nm.slice(0,25)+"…";
    x.fillStyle="#fff"; x.font="800 27px Barlow, system-ui, sans-serif"; x.fillText(nm,P,y+24);
    x.fillStyle=MUT; x.font="600 16px Barlow, system-ui, sans-serif"; x.fillText((d.bestPick.odds||"")+"    ·    +"+Math.round(d.bestPick.pts)+" pts",P,y+58);
  } else {
    x.fillStyle=MUT2; x.font="600 16px Barlow, system-ui, sans-serif"; x.fillText("No winning picks this slate — next one is yours.",P,y+10);
  }
  x.textBaseline="alphabetic"; x.textAlign="left"; x.fillStyle=MUT2; x.font="800 17px Barlow, system-ui, sans-serif"; x.fillText("PICKLOCK",P,H-44);
  x.textAlign="right"; x.fillStyle=MUT2; x.font="600 15px Barlow, system-ui, sans-serif"; x.fillText("lined-up-murex.vercel.app",W-P,H-46);
  return c;
}
function leagueDrawCard(d){
  const W=600,H=900,c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
  const P=50, GR="#30D158", MUT="rgba(255,255,255,.55)", MUT2="rgba(255,255,255,.32)";
  const tw=(str,nn)=>{ str=String(str||""); return str.length>nn? str.slice(0,nn-1)+"…":str; };
  const rr=(a,b,w,h,r)=>{ if(x.roundRect){x.beginPath();x.roundRect(a,b,w,h,r);} else {x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();} };
  const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,"#16244d"); g.addColorStop(1,"#0a1024");
  rr(0,0,W,H,46); x.fillStyle=g; x.fill(); x.lineWidth=3; x.strokeStyle="rgba(122,168,255,.5)"; rr(8,8,W-16,H-16,40); x.stroke();
  x.textBaseline="top"; x.textAlign="left";
  x.fillStyle="#fff"; x.font="800 22px Barlow, system-ui, sans-serif"; x.fillText("PICKLOCK",P,52);
  x.fillStyle="#0A84FF"; x.font="800 22px Barlow, system-ui, sans-serif"; x.fillText(".",P+112,52);
  x.textAlign="right"; x.fillStyle=MUT; x.font="700 17px Barlow, system-ui, sans-serif"; x.fillText("WEEK "+d.week,W-P,56);
  x.textAlign="left"; x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(P,90,W-2*P,1);
  x.fillStyle="#7aa8ff"; x.font="800 15px Barlow, system-ui, sans-serif"; x.fillText(tw(String(d.leagueName||"League").toUpperCase(),24),P,108);
  const h2h = d.mode==="h2h" && d.matchups && d.matchups.length;
  x.fillStyle="#FFD60A"; x.font="900 14px Barlow, system-ui, sans-serif"; x.fillText(h2h?"TOP SCORER":"WINNER OF THE WEEK",P,142);
  let wn=String((d.winner&&d.winner.name)||"").toUpperCase(); if(wn.length>16) wn=wn.slice(0,15)+"…";
  x.fillStyle="#fff"; x.font="900 58px Barlow, system-ui, sans-serif"; x.fillText(wn,P-2,166);
  x.fillStyle=GR; x.font="900 40px Barlow, system-ui, sans-serif"; x.fillText("+"+(d.winner?d.winner.pts:0).toFixed(0)+" pts",P,234);
  x.fillStyle=MUT; x.font="700 18px Barlow, system-ui, sans-serif"; x.fillText((d.winner?d.winner.w:0)+"-"+(d.winner?d.winner.l:0)+" on the week",P,288);
  x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(P,320,W-2*P,1);
  let y;
  if(h2h){
    x.fillStyle=MUT2; x.font="800 13px Barlow, system-ui, sans-serif"; x.fillText("MATCHUPS",P,342);
    y=378;
    d.matchups.slice(0,6).forEach(m=>{
      const tie=!m.winId, aWin=m.winId===m.aId;
      const wName=tie?m.aName:(aWin?m.aName:m.bName), lName=tie?m.bName:(aWin?m.bName:m.aName);
      const wP=tie?m.aPts:(aWin?m.aPts:m.bPts), lP=tie?m.bPts:(aWin?m.bPts:m.aPts);
      x.textAlign="left"; x.fillStyle="#fff"; x.font="700 21px Barlow, system-ui, sans-serif";
      x.fillText(tw(wName,11)+(tie?"  tied  ":"  def.  ")+tw(lName,11),P,y);
      x.textAlign="right"; x.fillStyle=GR; x.font="800 21px Barlow, system-ui, sans-serif"; x.fillText(Math.round(wP)+"–"+Math.round(lP),W-P,y);
      y+=52;
    });
  } else {
    x.fillStyle=MUT2; x.font="800 13px Barlow, system-ui, sans-serif"; x.fillText("WEEKLY LEADERBOARD",P,342);
    y=378; const rows=(d.rows||[]).slice(0,5);
    rows.forEach((r,i)=>{
      x.textAlign="left"; x.fillStyle=i===0?"#FFD60A":MUT2; x.font="900 22px Barlow, system-ui, sans-serif"; x.fillText(String(i+1),P,y);
      x.fillStyle="#fff"; x.font="700 24px Barlow, system-ui, sans-serif"; x.fillText(tw(r.name,18),P+42,y);
      x.textAlign="right"; x.fillStyle=MUT; x.font="600 16px Barlow, system-ui, sans-serif"; x.fillText(r.w+"-"+r.l,W-P-118,y+4);
      x.fillStyle=GR; x.font="800 24px Barlow, system-ui, sans-serif"; x.fillText((r.pts>=0?"+":"")+r.pts.toFixed(0),W-P,y);
      y+=60;
    });
  }
  x.textAlign="left"; x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(P,y+4,W-2*P,1);
  x.fillStyle=MUT; x.font="600 18px Barlow, system-ui, sans-serif"; x.fillText("League hit "+d.hitPct+"%   ·   "+d.totalPicks+" picks this week",P,y+26);
  x.textBaseline="alphabetic"; x.fillStyle=MUT2; x.font="800 16px Barlow, system-ui, sans-serif"; x.fillText("PICKLOCK",P,H-42);
  x.textAlign="right"; x.fillStyle=MUT2; x.font="600 14px Barlow, system-ui, sans-serif"; x.fillText("lined-up-murex.vercel.app",W-P,H-44);
  return c;
}
function LeagueWeekRecap({ data, IOS, onClose }){
  const C=IOS; const [toast,setToast]=useState("");
  const weeks=data.weeks||[];
  const [idx,setIdx]=useState(Math.max(0,weeks.length-1));
  const week=weeks[idx];
  const cur=(data.byWeek&&data.byWeek[week]) || {rows:[],matchups:[],winner:{name:"—",pts:0,w:0,l:0},hitPct:0,totalPicks:0};
  const rows=(cur.rows||[]).slice(0,5); const w=cur.winner||{name:"—",pts:0,w:0,l:0};
  const isH2H=(cur.matchups&&cur.matchups.length>0);
  const GOLD=C.gold||"#FFD60A";
  const canPrev=idx>0, canNext=idx<weeks.length-1;
  const tw=(str,n)=>{ str=String(str||""); return str.length>n?str.slice(0,n-1)+"…":str; };
  const navBtn=(on)=>({width:26,height:26,borderRadius:7,border:"none",background:on?"rgba(255,255,255,.12)":"rgba(255,255,255,.04)",color:on?"#fff":"rgba(255,255,255,.22)",cursor:on?"pointer":"default",fontSize:15,fontWeight:800,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"Barlow,sans-serif"});
  const shareCard=async()=>{
    try{
      if(document.fonts&&document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
      const payload={ leagueName:data.leagueName, week, rows:cur.rows, matchups:cur.matchups, mode:isH2H?"h2h":"points", winner:cur.winner, hitPct:cur.hitPct, totalPicks:cur.totalPicks };
      const cv=leagueDrawCard(payload);
      const url="https://lined-up-murex.vercel.app";
      const text=data.leagueName+" — Week "+week+": "+w.name+(isH2H?" was top scorer with +":" took the week with +")+w.pts.toFixed(0)+" pts. "+cur.hitPct+"% league hit rate. My PickLock league.";
      const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
      const file=blob?new File([blob],"picklock-league-week.png",{type:"image/png"}):null;
      if(file && navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file],text,title:"League Week Recap"});
      else if(navigator.share) await navigator.share({text,url,title:"League Week Recap"});
      else { const a=document.createElement("a"); a.href=cv.toDataURL("image/png"); a.download="picklock-league-week.png"; a.click(); try{ await navigator.clipboard.writeText(text+" "+url); }catch(e){} setToast("Card saved — caption copied"); setTimeout(()=>setToast(""),2400); }
    }catch(e){}
  };
  const MatchRow=({m,i,last})=>{
    const tie=!m.winId, aWin=m.winId===m.aId;
    const wName=tie?m.aName:(aWin?m.aName:m.bName), lName=tie?m.bName:(aWin?m.bName:m.aName);
    const wP=tie?m.aPts:(aWin?m.aPts:m.bPts), lP=tie?m.bPts:(aWin?m.bPts:m.aPts);
    const wYou=tie?false:(aWin?m.youA:m.youB), lYou=tie?false:(aWin?m.youB:m.youA);
    return (
      <div style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:last?"none":"0.5px solid rgba(255,255,255,.06)"}}>
        <div style={{flex:1,fontSize:13.5,fontWeight:700}}>
          {tie
            ? <span><span style={{color:"#fff"}}>{tw(m.aName,12)}</span><span style={{color:"rgba(255,255,255,.4)",fontWeight:600}}> tied </span><span style={{color:"#fff"}}>{tw(m.bName,12)}</span></span>
            : <span><span style={{color:wYou?C.blue:"#fff"}}>{tw(wName,12)}{wYou?" (you)":""}</span><span style={{color:"rgba(255,255,255,.4)",fontWeight:600}}> def. </span><span style={{color:lYou?C.blue:"rgba(255,255,255,.5)"}}>{tw(lName,12)}{lYou?" (you)":""}</span></span>}
        </div>
        <div style={{fontSize:13.5,fontWeight:800,color:C.green,textAlign:"right"}}>{Math.round(wP)}–{Math.round(lP)}</div>
      </div>
    );
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,background:"radial-gradient(120% 80% at 50% 12%,rgba(10,132,255,.34),#04060c 68%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 18px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360,background:"linear-gradient(160deg,#16244d,#0a1024)",border:"1px solid rgba(122,168,255,.45)",borderRadius:24,padding:"22px 20px",position:"relative",overflow:"hidden",boxShadow:"0 30px 80px -20px rgba(0,0,0,.8)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>PickLock<span style={{color:C.blue}}>.</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>canPrev&&setIdx(idx-1)} disabled={!canPrev} style={navBtn(canPrev)}>‹</button>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.7)",minWidth:52,textAlign:"center"}}>Week {week}</div>
            <button onClick={()=>canNext&&setIdx(idx+1)} disabled={!canNext} style={navBtn(canNext)}>›</button>
          </div>
        </div>
        <div style={{height:1,background:"rgba(255,255,255,.1)",margin:"12px 0 14px"}}/>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:".08em",color:"#7aa8ff",textTransform:"uppercase"}}>{data.leagueName}</div>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:".12em",color:GOLD,marginTop:14}}>{isH2H?"TOP SCORER":"WINNER OF THE WEEK"}</div>
        <div style={{fontSize:34,fontWeight:900,letterSpacing:"-1px",color:"#fff",marginTop:2,lineHeight:1}}>{w.name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:9,marginTop:8}}>
          <div style={{fontSize:30,fontWeight:900,color:C.green}}>+{w.pts.toFixed(0)}</div>
          <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,.55)"}}>pts · {w.w}-{w.l} on the week</div>
        </div>
        <div style={{height:1,background:"rgba(255,255,255,.1)",margin:"16px 0 12px"}}/>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",color:"rgba(255,255,255,.35)",textTransform:"uppercase",marginBottom:8}}>{isH2H?"Matchups":"Weekly Leaderboard"}</div>
        {isH2H
          ? cur.matchups.slice(0,6).map((m,i)=><MatchRow key={i} m={m} i={i} last={i>=Math.min(cur.matchups.length,6)-1}/>)
          : rows.map((r,i)=>(
            <div key={r.userId||i} style={{display:"flex",alignItems:"center",padding:"7px 0",borderBottom:i<rows.length-1?"0.5px solid rgba(255,255,255,.06)":"none"}}>
              <div style={{width:22,fontSize:14,fontWeight:900,color:i===0?GOLD:"rgba(255,255,255,.4)"}}>{i+1}</div>
              <div style={{flex:1,fontSize:14,fontWeight:700,color:r.isYou?C.blue:"#fff"}}>{r.isYou?r.name+" (you)":r.name}</div>
              <div style={{width:46,fontSize:11,color:"rgba(255,255,255,.5)",textAlign:"right"}}>{r.w}-{r.l}</div>
              <div style={{width:54,fontSize:14,fontWeight:800,color:C.green,textAlign:"right"}}>{r.pts>=0?"+":""}{r.pts.toFixed(0)}</div>
            </div>
          ))}
        <div style={{height:1,background:"rgba(255,255,255,.1)",margin:"12px 0"}}/>
        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.55)"}}>League hit {cur.hitPct}% · {cur.totalPicks} picks this week</div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:18,width:"100%",maxWidth:360}}>
        <button onClick={shareCard} style={{flex:1,background:C.blue,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Barlow,sans-serif",boxShadow:"0 8px 24px -8px rgba(10,132,255,.7)"}}>Share</button>
        <button onClick={onClose} style={{flex:1,background:"rgba(255,255,255,.1)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Done</button>
      </div>
      {toast&&<div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,.7)"}}>{toast}</div>}
    </div>
  );
}
function WeeklyRecap({ data, picks, standings, league, stats, IOS, onClose, user }){
  const [i,setI]=useState(0);
  const [toast,setToast]=useState("");
  const N=8;
  const me=(standings||[]).find(z=>z.isYou)||{};
  const wins=(picks||[]).filter(p=>p.result==="W");
  const losses=(picks||[]).filter(p=>p.result==="L");
  const best=[...wins].sort((a,b)=>parseFloat(b.points_earned||0)-parseFloat(a.points_earned||0))[0];
  const worst=losses[0];
  const myPts=parseFloat(data.myPts)||0, oppPts=parseFloat(data.oppPts)||0;
  const won=!!data.won;
  const sup=wrecSuperlative(picks,data,stats);
  const streak=me.streak||{type:"W",count:0};
  const streakLabel=(streak.type||"W")+(streak.count||0);
  const rank=me.rank||"—";
  const name=me.name||"You";
  const [prevRank,setPrevRank]=useState(null);
  useEffect(()=>{ let alive=true; (async()=>{ try{ if(!user||!user.id||!league||!league.id||!data||!data.week) return; const {data:row}=await supabase.from("weekly_ranks").select("rank").eq("user_id",user.id).eq("league_id",league.id).eq("week",data.week-1).maybeSingle(); if(alive&&row&&typeof row.rank==="number") setPrevRank(row.rank); }catch(e){} })(); return ()=>{alive=false;}; },[]);
  const rankNum = typeof rank==="number"?rank:parseInt(rank);
  const moved = prevRank!=null && Number.isFinite(rankNum) && prevRank!==rankNum;
  const up = moved && rankNum < prevRank;
  const next=()=>setI(v=>Math.min(N-1,v+1));
  const prev=()=>setI(v=>Math.max(0,v-1));
  const C=IOS;
  const BG=["radial-gradient(120% 80% at 50% 10%,rgba(10,132,255,.35),#04060c 65%)",
    won?"radial-gradient(120% 80% at 50% 20%,rgba(48,209,88,.4),#04140a 65%)":"radial-gradient(120% 80% at 50% 20%,rgba(255,69,58,.4),#140404 65%)",
    "radial-gradient(120% 80% at 50% 15%,rgba(10,132,255,.4),#05101f 70%)",
    "radial-gradient(120% 80% at 50% 15%,rgba(255,214,10,.32),#140f04 70%)",
    "radial-gradient(120% 80% at 50% 15%,rgba(120,120,130,.3),#0c0c0e 70%)",
    "radial-gradient(120% 80% at 50% 15%,"+sup.color+"55,#140420 70%)",
    "radial-gradient(120% 80% at 50% 15%,rgba(10,132,255,.34),#04060c 68%)",
    "radial-gradient(120% 80% at 50% 0%,#11131c,#04060c 70%)"][i];
  const shareCard=async()=>{
    try{
      if(document.fonts&&document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
      const cv=wrecDrawCard({week:data.week,record:wins.length+"-"+losses.length,points:myPts,sup,name,rank,streakLabel});
      const url="https://lined-up-murex.vercel.app";
      const text="Week "+data.week+": "+wins.length+"-"+losses.length+", "+(myPts>=0?"+":"")+myPts.toFixed(0)+" pts — "+sup.title+". My PickLock week.";
      const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
      const file=blob?new File([blob],"picklock-week.png",{type:"image/png"}):null;
      if(file && navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file],text,title:"My PickLock Week"});
      else if(navigator.share) await navigator.share({text,url,title:"My PickLock Week"});
      else { const a=document.createElement("a"); a.href=cv.toDataURL("image/png"); a.download="picklock-week.png"; a.click(); try{ await navigator.clipboard.writeText(text+" "+url); }catch(e){} setToast("Card saved — caption copied"); setTimeout(()=>setToast(""),2400); }
    }catch(e){}
  };
  const Emb=({d,color})=>(<div className="wrec-emblem wrec-pop" style={{background:color+"22",border:"1px solid "+color+"66"}}><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:d}}/></div>);
  let body;
  if(i===0) body=(<><div className="wrec-kicker wrec-rise wrec-d1">PickLock</div><div className="wrec-huge wrec-rise wrec-d2" style={{marginTop:14}}>WEEK<br/>{data.week}</div><div className="wrec-sub wrec-rise wrec-d3" style={{marginTop:18}}>Your week is in.<br/>Let's see how it went.</div></>);
  else if(i===1) body=(<><div className="wrec-kicker wrec-rise wrec-d1">The verdict</div>{data.oppName?(<><div className="wrec-huge wrec-pop" style={{marginTop:10,color:won?C.green:C.red}}>{won?<>YOU<br/>WON</>:<>YOU<br/>LOST</>}</div><div className="wrec-mid wrec-rise wrec-d4" style={{marginTop:20}}><WrecCount to={myPts} dec={0}/> <span style={{opacity:.4}}>—</span> {oppPts.toFixed(0)}</div><div className="wrec-sub wrec-rise wrec-d5" style={{marginTop:6}}>{won?"def.":"vs"} {data.oppName}</div></>):(<><div className="wrec-huge wrec-pop" style={{marginTop:10,color:wins>losses?C.green:wins===losses?C.blue:C.orange}}>{wins>losses?<>BIG<br/>WEEK</>:wins===losses?<>EVEN<br/>WEEK</>:<>TOUGH<br/>WEEK</>}</div><div className="wrec-mid wrec-rise wrec-d4" style={{marginTop:20}}><WrecCount to={myPts} dec={1} pre={myPts>=0?"+":""}/> pts</div></>)}</>);
  else if(i===2) body=(<><div className="wrec-kicker wrec-rise wrec-d1">By the numbers</div><div className="wrec-nums wrec-rise wrec-d2" style={{marginTop:24}}><div className="wrec-ncell"><div className="v" style={{color:C.green}}><WrecCount to={wins.length} dur={700}/></div><div className="k">Wins</div></div><div className="wrec-ncell"><div className="v" style={{color:C.red}}><WrecCount to={losses.length} dur={700}/></div><div className="k">Losses</div></div><div className="wrec-ncell"><div className="v"><WrecCount to={myPts} dec={1} pre="+"/></div><div className="k">Points</div></div></div></>);
  else if(i===3) body=(best?<><Emb d={WREC_EMB.trophy} color="#FFD60A"/><div className="wrec-kicker wrec-rise wrec-d2">Play of the week</div><div className="wrec-pill wrec-rise wrec-d3" style={{marginTop:14}}><div className="nm">{best.pick_name}</div><div className="meta">{best.multiplier}x · {(best.slot||"").toUpperCase()} · {best.odds}</div></div><div className="wrec-rise wrec-d4" style={{marginTop:16}}><span className="wrec-ptsbadge" style={{background:"rgba(48,209,88,.16)",color:C.green}}>+<WrecCount to={parseFloat(best.points_earned||0)} dec={1}/> pts</span></div></>:<><div className="wrec-kicker wrec-rise wrec-d1">Play of the week</div><div className="wrec-sub wrec-rise wrec-d2" style={{marginTop:14}}>No wins this week — but that just sets up the comeback.</div></>);
  else if(i===4) body=(worst?<><div className="wrec-kicker wrec-rise wrec-d1">The one that got away</div><div className="wrec-pill wrec-rise wrec-d2" style={{marginTop:16}}><div className="nm">{worst.pick_name}</div><div className="meta">{worst.multiplier}x · {(worst.slot||"").toUpperCase()} · {worst.odds}</div></div><div className="wrec-sub wrec-rise wrec-d3" style={{marginTop:16}}>It happens. Shake it off.</div></>:<><div className="wrec-kicker wrec-rise wrec-d1">Clean sheet</div><div className="wrec-mid wrec-rise wrec-d2" style={{marginTop:14,color:C.green}}>No misses this week.</div></>);
  else if(i===5) body=(<><Emb d={sup.emblem} color={sup.color}/><div className="wrec-kicker wrec-rise wrec-d2">This week you were</div><div className="wrec-big wrec-rise wrec-d3" style={{marginTop:10,color:sup.color}}>{sup.title}</div><div className="wrec-sub wrec-rise wrec-d4" style={{marginTop:16}}>{sup.desc}</div></>);
  else if(i===6) body=(<><div className="wrec-kicker wrec-rise wrec-d1">{moved?(up?"You're climbing":"Holding on"):"Where you stand"}</div>{moved?(<div className="wrec-rise wrec-d2" style={{marginTop:18,display:"flex",alignItems:"center",justifyContent:"center",gap:16}}><div className="wrec-rank" style={{opacity:.32}}>#{prevRank}</div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={up?C.green:C.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{transform:up?"none":"rotate(180deg)"}}><path d="M5 12l7-7 7 7"/><path d="M12 5v14"/></svg><div className="wrec-rank wrec-pop" style={{color:up?C.green:(rankNum===1?"#FFD60A":"#fff")}}>#{rankNum}</div></div>):(<div className="wrec-rank wrec-pop" style={{marginTop:16,color:rankNum===1?"#FFD60A":"#fff"}}>#{rank}</div>)}<div className="wrec-sub wrec-rise wrec-d3" style={{marginTop:8}}>{moved?(up?("Up "+(prevRank-rankNum)+" spot"+((prevRank-rankNum)>1?"s":"")+" this week"):("Down "+(rankNum-prevRank)+" — bounce back")):(me.record||"")}</div>{streak.type==="W"&&streak.count>=2&&<div className="wrec-mid wrec-rise wrec-d4" style={{marginTop:18,display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}>W{streak.count}<svg width="22" height="26" viewBox="0 0 24 28" fill="#FF6B35"><path d="M12 0c2 6-3 7-3 12 0 2 1 3 2 3 2 0 2-3 1-5 4 2 6 6 6 9 0 5-4 9-9 9s-9-4-9-9c0-6 7-9 12-19z"/></svg></div>}</>);
  else body=(<><div className="wrec-kicker wrec-rise wrec-d1" style={{marginBottom:18}}>Week {data.week} · sealed</div><div className="wrec-card wrec-pop"><div className="holo"/><div style={{position:"relative",zIndex:2}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:40,fontWeight:900,letterSpacing:"-2px",lineHeight:.9}}>{wins.length}-{losses.length}</div><div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",opacity:.7,marginTop:4}}>RECORD</div></div><div style={{textAlign:"right"}}><div style={{fontSize:40,fontWeight:900,letterSpacing:"-2px",lineHeight:.9,color:C.green}}>{myPts>=0?"+":""}{myPts.toFixed(0)}</div><div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",opacity:.7,marginTop:4}}>POINTS</div></div></div><div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)",margin:"18px 0"}}/><div style={{fontSize:13,fontWeight:800,letterSpacing:".1em",color:sup.color,textTransform:"uppercase"}}>{sup.title}</div><div style={{fontSize:26,fontWeight:900,letterSpacing:"-1px",marginTop:6}}>{name.toUpperCase()}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:18,fontSize:13,fontWeight:700}}><span style={{opacity:.6}}>League rank</span><span>#{rank} · {streakLabel}</span></div><div style={{marginTop:14,fontSize:9,fontWeight:800,letterSpacing:".1em",opacity:.5,textAlign:"right"}}>PICKLOCK · WEEK {data.week}</div></div></div><div className="wrec-btn"><b className="share" style={{background:C.blue,color:"#fff",boxShadow:"0 8px 24px -8px rgba(10,132,255,.7)"}} onClick={shareCard}>Share</b><b className="done" style={{background:"rgba(255,255,255,.1)",color:"#fff"}} onClick={onClose}>Done</b></div></>);
  return (
  <div className="wrec-wrap">
    <div className="wrec-bars">{Array.from({length:N}).map((_,bi)=>(<div key={bi} className={"wrec-bar"+(bi<i?" done":bi===i?" cur":"")}><i/></div>))}</div>
    <div className="wrec-x" onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
    {i<N-1 && <div className="wrec-skip" onClick={()=>setI(N-1)}>Skip</div>}
    <div key={i} className="wrec-slide" style={{background:BG}}>
      <div className="wrec-grain"/>
      {i===1 && <Confetti show={true}/>}
      {body}
    </div>
    {i>0 && <div className="wrec-zone l" onClick={prev}/>}
    {i<N-1 && <div className="wrec-zone r" onClick={next}/>}
    {i<N-1 && <div className="wrec-tap">tap to continue ›</div>}
    {toast && <div className="pc-toast">{toast}</div>}
  </div>
  );
}
const BRK_LOCK = '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
function brkRoundName(count){ return count===1?"Final":count===2?"Semifinals":count===4?"Quarterfinals":count===8?"Round of 16":count===16?"Round of 32":("Round of "+count*2); }
function BracketView({ matchups, members, uid, IOS, onOpenMatch, live, onChampion }){
  const nameOf = (id)=>{ if(!id) return null; const m=(members||[]).find(x=>x.userId===id); return m?m.name:"Player"; };
  const byWeek = {};
  (matchups||[]).forEach(m=>{ (byWeek[m.week]=byWeek[m.week]||[]).push(m); });
  const weeks = Object.keys(byWeek).map(Number).sort((a,b)=>a-b);
  if(!weeks.length) return <div style={{padding:"44px 24px",textAlign:"center",color:IOS.label3,fontSize:14,lineHeight:1.6}}>The bracket appears once the league fills and the tournament starts.</div>;
  weeks.forEach(w=> byWeek[w].sort((a,b)=> (parseInt(((a.bracket_match_id||"").split("M")[1])||0)) - (parseInt(((b.bracket_match_id||"").split("M")[1])||0))));
  const H=500;
  const finalRound = byWeek[weeks[weeks.length-1]];
  const championId = (finalRound && finalRound.length===1) ? finalRound[0].winner_id : null;
  const seat = (uId, nm, pts, decided, isWin, pos, livePts, showLive)=>(
    <div className={"brk-seat"+(uId?"":" tbd")+(decided?(isWin?" win":" lose"):"")}>
      <span className="brk-sd">{pos||""}</span>
      <span className="brk-nm">{nm||"TBD"}</span>
      <span className="brk-pts">{decided&&pts!=null?Number(pts).toFixed(1):(showLive&&uId?<span style={{color:IOS.green,display:"inline-flex",alignItems:"center"}}><span className="brk-livedot"/><Ticker value={livePts||0} decimals={1}/></span>:"")}</span>
      {decided&&isWin?<svg className="brk-lock" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.6" dangerouslySetInnerHTML={{__html:BRK_LOCK}}/>:null}
    </div>
  );
  return (
    <div className="brk-scroll">
      <div className="brk-tree">
        {weeks.map((w,ri)=>{
          const ms = byWeek[w]; const m = ms.length; const elbow = H/(2*m);
          const isLast = ri===weeks.length-1;
          return (
            <div key={w} className="brk-round">
              <div className="brk-rhead">{brkRoundName(m)}</div>
              {ms.map((mu,mi)=>{
                const decided = !!mu.winner_id;
                const u1=mu.user1_id, u2=mu.user2_id;
                const both = u1 && u2;
                const youHere = uid && (u1===uid||u2===uid);
                const down = (mi % 2 === 0);
                const showLive = !decided && live && w===live.week && both;
                const lt = (live&&live.totals)||{};
                return (
                  <div key={mu.id||mi} className="brk-cell" style={{animationDelay:(ri*0.1 + mi*0.05)+"s"}}>
                    <div className={"brk-match"+(youHere?" you":"")+(both?"":" dead")+(showLive?" live":"")} onClick={()=>{ if(both) onOpenMatch(mu); }}>
                      {ri>0 && <div className="brk-stub"/>}
                      {seat(u1, nameOf(u1), mu.user1_points, decided, mu.winner_id===u1, ri===0?(mi*2+1):"", lt[u1], showLive)}
                      {seat(u2, nameOf(u2), mu.user2_points, decided, mu.winner_id===u2, ri===0?(mi*2+2):"", lt[u2], showLive)}
                    </div>
                    {!isLast && <div className={"brk-conn "+(down?"down":"up")} style={{height:elbow}}/>}
                    {isLast && <div className="brk-connf"/>}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="brk-champ">
          <div className="brk-rhead">Champion</div>
          <div className={"brk-cup"+(championId?" live":"")} onClick={()=>{ if(championId&&onChampion) onChampion(championId, nameOf(championId)); }}><div className="brk-stub"/>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFD60A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",margin:"0 auto"}}><path d="M2 18h20"/><path d="M3 8l4 4 5-7 5 7 4-4-2 10H5L3 8z"/></svg>
            <div className="lab">Champion</div>
            <div className={"cn"+(championId?"":" tbd")}>{championId?nameOf(championId):"TBD"}</div>
            {championId?<div className="tap">Tap to celebrate</div>:null}
          </div>
        </div>
      </div>
    </div>
  );
}
const BMD_CHIP = { ml:"ML", spread:"SPR", ou:"O/U", prop:"PROP", longshot:"LONG" };
function BracketMatchSheet({ d, IOS, onClose }){
  if(!d) return null;
  const resCell = (res, pts)=>{
    if(res==="W") return <div className="bmd-res"><div className="rp" style={{color:IOS.green}}>+{Number(pts).toFixed(1)}</div><div className="rl" style={{color:IOS.green}}>Win</div></div>;
    if(res==="L") return <div className="bmd-res"><div className="rp" style={{color:"rgba(255,255,255,.35)"}}>0.0</div><div className="rl" style={{color:IOS.red}}>Loss</div></div>;
    return <div className="bmd-res"><div className="rp" style={{color:"rgba(255,255,255,.3)"}}>—</div><div className="rl" style={{color:"rgba(255,255,255,.35)"}}>Pending</div></div>;
  };
  const section = (p, isWinner)=>(
    <div className="bmd-sec">
      <div className="bmd-sech">
        <span className="nm">{p.name}
          {p.you?<span className="bmd-tag" style={{background:"rgba(10,132,255,.18)",color:IOS.blue}}>YOU</span>:null}
          {isWinner?<span className="bmd-tag" style={{background:"rgba(48,209,88,.16)",color:IOS.green}}>ADV</span>:null}
        </span>
        <span className="tot">{Number(p.total).toFixed(1)} pts</span>
      </div>
      {p.picks.length===0 ? <div style={{fontSize:12,color:"rgba(255,255,255,.35)",padding:"6px 0 12px"}}>No slip submitted</div> :
        p.picks.map((pk,i)=>(
          <div key={i} className="bmd-row">
            <span className="bmd-chip">{BMD_CHIP[pk.slot]||(pk.slot||"").toUpperCase().slice(0,4)}</span>
            <div className="bmd-pk"><div className="pn">{pk.name}</div><div className="ps">{pk.sub}</div></div>
            {resCell(pk.res, pk.pts)}
          </div>
        ))
      }
    </div>
  );
  const aWin = d.winnerId && d.winnerId===d.u1;
  const bWin = d.winnerId && d.winnerId===d.u2;
  return (
    <div className="bmd-bg" onClick={(e)=>{ if(e.currentTarget===e.target) onClose(); }}>
      <div className="bmd">
        <div className="bmd-grip"/>
        <div className="bmd-rd">{d.round}</div>
        <div className="bmd-score">
          <div className={"bmd-side"+(aWin?" win":(d.winnerId?" lose":""))}><div className="n">{d.a.name}</div><div className="pp">{Number(d.a.total).toFixed(1)}</div></div>
          <div className="bmd-vs">{d.winnerId?"vs":"LIVE"}</div>
          <div className={"bmd-side"+(bWin?" win":(d.winnerId?" lose":""))}><div className="n">{d.b.name}</div><div className="pp">{Number(d.b.total).toFixed(1)}</div></div>
        </div>
        {section(d.a, aWin)}
        {section(d.b, bWin)}
      </div>
    </div>
  );
}
function brkDrawChampCard(name, leagueName){
  const W=600, H=760, c=document.createElement("canvas"); c.width=W; c.height=H;
  const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,"#2a2208"); g.addColorStop(.55,"#120f0a"); g.addColorStop(1,"#080609");
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle="rgba(255,214,10,.55)"; x.lineWidth=3; x.strokeRect(16,16,W-32,H-32);
  // crown
  x.fillStyle="#FFD60A"; x.beginPath();
  const cx=W/2, cy=210, s=70;
  x.moveTo(cx-s, cy+s*0.6); x.lineTo(cx-s, cy-s*0.2); x.lineTo(cx-s*0.45, cy+s*0.15);
  x.lineTo(cx, cy-s*0.7); x.lineTo(cx+s*0.45, cy+s*0.15); x.lineTo(cx+s, cy-s*0.2);
  x.lineTo(cx+s, cy+s*0.6); x.closePath(); x.fill();
  x.fillStyle="#1a1500"; x.fillRect(cx-s, cy+s*0.42, s*2, s*0.18);
  // labels
  x.textAlign="center"; x.fillStyle="#FFD60A"; x.font="800 26px Barlow, sans-serif";
  x.fillText("L E A G U E   C H A M P I O N", cx, 360);
  x.fillStyle="#ffffff"; x.font="900 64px Barlow, sans-serif";
  x.fillText((name||"Champion").slice(0,16), cx, 440);
  x.fillStyle="rgba(255,255,255,.55)"; x.font="700 22px Barlow, sans-serif";
  x.fillText(((leagueName||"Tournament")+" · Champion").slice(0,40), cx, 486);
  // divider + footer
  x.strokeStyle="rgba(255,214,10,.3)"; x.lineWidth=2; x.beginPath(); x.moveTo(cx-120,560); x.lineTo(cx+120,560); x.stroke();
  x.fillStyle="rgba(255,255,255,.4)"; x.font="800 20px Barlow, sans-serif"; x.fillText("PICKLOCK", cx, 660);
  x.fillStyle="rgba(255,255,255,.28)"; x.font="600 15px Barlow, sans-serif"; x.fillText("single elimination · last lock standing", cx, 690);
  return c;
}
async function champShare(name, leagueName){
  try{
    const c = brkDrawChampCard(name, leagueName);
    const blob = await new Promise(res=>c.toBlob(res,"image/png"));
    const file = new File([blob], "picklock-champion.png", {type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file], title:"PickLock Champion", text:(name||"")+" won the "+(leagueName||"league")+" on PickLock!"}); return; }
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="picklock-champion.png"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){}
}
function ChampCelebrate({ name, leagueName, isYou, IOS, onClose, onShare }){
  return (
    <div className="champ-bg">
      <Confetti show={true}/>
      <div className="champ-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></div>
      <svg className="champ-crown" width="92" height="92" viewBox="0 0 24 24" fill="none" stroke="#FFD60A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h20"/><path d="M3 8l4 4 5-7 5 7 4-4-2 10H5L3 8z"/></svg>
      <div className="champ-lab">{isYou?"You are the champion":"League Champion"}</div>
      <div className="champ-name">{name||"Champion"}</div>
      <div className="champ-sub">{leagueName||"Tournament"} · last lock standing</div>
      <button className="champ-share" onClick={onShare}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a1500" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        Share your title
      </button>
    </div>
  );
}
const BETSLIP_ENABLED = false; // flip on once affiliate + compliance (21+, geo, RG) are ready
function betslipAllowedHere(){ return true; } // TODO: geo-gate to legal states + 21+ age check
function BetslipButton({ bet, IOS }){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    if(!BETSLIP_ENABLED || !betslipAllowedHere() || !bet || !bet.game){ setLoading(false); return; }
    let alive = true; setLoading(true);
    fetch("/api/betslip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ sport:bet._sport||bet.sport, game:bet.game, category:bet.category, pick:bet.pick, point:bet.line })})
      .then(r=>r.json()).then(d=>{ if(alive){ setData(d); setLoading(false); } })
      .catch(()=>{ if(alive) setLoading(false); });
    return ()=>{ alive=false; };
  },[bet]);
  if(!BETSLIP_ENABLED || !betslipAllowedHere() || loading || !data || !data.best) return null;
  const b = data.best;
  return (
    <div className="ai-rise" style={{marginTop:8}}>
      <a href={b.link} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${IOS.blue}55`,background:`${IOS.blue}14`,color:IOS.blue,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxSizing:"border-box"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
        Bet on {b.title}{b.price!=null?("  ("+(b.price>0?"+":"")+b.price+")"):""}
      </a>
      <div style={{fontSize:9.5,color:"rgba(255,255,255,0.4)",textAlign:"center",marginTop:5,lineHeight:1.4}}>21+ · Gambling problem? Call 1-800-GAMBLER · Opens {b.title}</div>
    </div>
  );
}
class ErrorBoundary extends Component {
 constructor(props){ super(props); this.state={hasError:false}; }
 static getDerivedStateFromError(){ return {hasError:true}; }
 componentDidCatch(err){ try{ console.warn("Plok render error:", err); }catch(e){} }
 render(){ return this.state.hasError ? (this.props.fallback||null) : this.props.children; }
}
function AiInsightBubble({ item, IOS, onAddToSlip }) {
  const data = item.data;
  const [words, setWords] = useState(0);
  const [phase, setPhase] = useState(0);
  const summaryWords = data ? String(data.summary || "").split(/\s+/).filter(Boolean) : [];
  useEffect(() => {
    if (!data) return;
    setWords(0); setPhase(0);
    let w = 0;
    const iv = setInterval(() => {
      w += 1; setWords(w);
      if (w >= summaryWords.length) { clearInterval(iv); setTimeout(() => setPhase(1), 140); }
    }, 30);
    return () => clearInterval(iv);
  }, [data]);
  useEffect(() => {
    if (phase >= 1 && phase < 5) { const tm = setTimeout(() => setPhase(pp => pp + 1), 240); return () => clearTimeout(tm); }
  }, [phase]);
  const wrap = (children) => (
    <div style={{alignSelf:"flex-start",width:"100%",background:"linear-gradient(160deg,#16161B,#0C0C0F)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px 14px 14px 4px",padding:"13px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:"-0.2px",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</span>
      </div>
      {children}
    </div>
  );
  if (item.loading) return wrap(<div style={{display:"flex",gap:5,alignItems:"center",height:14}}><span className="ai-dot"/><span className="ai-dot" style={{animationDelay:"0.15s"}}/><span className="ai-dot" style={{animationDelay:"0.3s"}}/></div>);
  if (item.error || !data) return wrap(<div style={{fontSize:12.5,color:IOS.red,fontWeight:600}}>{item.error || "Couldn't load insight"}</div>);
  const shownSummary = summaryWords.slice(0, words).join(" ");
  const typing = words < summaryWords.length;
  return wrap(<div>
    <div style={{fontSize:13,lineHeight:1.5,color:"rgba(255,255,255,0.86)",marginBottom:(data.matchup||(data.keyStats&&data.keyStats.length))?11:8}}>
      {shownSummary}{typing && <span className="ai-caret"/>}
    </div>
    {phase>=1 && data.matchup && data.matchup.away && data.matchup.home && (
      <div className="ai-rise" style={{marginBottom:11,borderRadius:11,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.09)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:13,fontWeight:800,color:IOS.blue,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.matchup.away.abbr||data.matchup.away.name}</div>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em",padding:"0 8px"}}>VS</div>
          <div style={{fontSize:13,fontWeight:800,color:IOS.blue,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.matchup.home.abbr||data.matchup.home.name}</div>
        </div>
        {[
          {k:"Record",a:data.matchup.away.overall,h:data.matchup.home.overall},
          {k:"Home",a:data.matchup.away.home,h:data.matchup.home.home},
          {k:"Road",a:data.matchup.away.away,h:data.matchup.home.away},
          {k:data.matchup.scoredLabel||"Scored/game",a:data.matchup.away.scored,h:data.matchup.home.scored},
          {k:data.matchup.allowedLabel||"Allowed/game",a:data.matchup.away.allowed,h:data.matchup.home.allowed},
          {k:"Streak",a:data.matchup.away.streak,h:data.matchup.home.streak},
        ].filter(r=>r.a!=null||r.h!=null).map((r,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"7px 12px",borderTop:"0.5px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:13.5,fontWeight:800,color:"#fff",textAlign:"left"}}>{r.a!=null?r.a:"—"}</div>
            <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.42)",textTransform:"uppercase",letterSpacing:"0.03em",padding:"0 10px",textAlign:"center",whiteSpace:"nowrap"}}>{r.k}</div>
            <div style={{fontSize:13.5,fontWeight:800,color:"#fff",textAlign:"right"}}>{r.h!=null?r.h:"—"}</div>
          </div>
        ))}
        {data.matchup.h2h && (
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",padding:"7px 12px",borderTop:"0.5px solid rgba(255,255,255,0.09)",background:"rgba(10,132,255,0.06)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",textAlign:"left"}}>{data.matchup.h2h.away}</div>
            <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.03em",padding:"0 10px",textAlign:"center",whiteSpace:"nowrap"}}>{data.matchup.h2h.label}</div>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",textAlign:"right"}}>{data.matchup.h2h.home}</div>
          </div>
        )}
      </div>
    )}
    {phase>=1 && data.yourAngle && (
      <div className="ai-rise" style={{display:"flex",alignItems:"flex-start",gap:8,background:`linear-gradient(135deg,${IOS.blue}1f,${IOS.indigo}12)`,border:`0.5px solid ${IOS.blue}3a`,borderRadius:11,padding:"10px 12px",marginBottom:11}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/><path d="M17.5 7.5l1.5 1.5 3-3"/></svg>
        <div>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.blue,marginBottom:2}}>Your angle</div>
          <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.88)"}}>{data.yourAngle}</div>
        </div>
      </div>
    )}
    {phase>=1 && data.verdict && data.verdict!=="none" && (()=>{
      const v = data.verdict;
      const conv = Math.max(0, Math.min(100, data.conviction||0));
      const isPass = v==="pass"||v==="fade";
      const tc = v==="strong"?IOS.green : v==="lean"?IOS.blue : v==="fade"?IOS.red : IOS.label3;
      const vlabel = v==="strong"?"Strong lean" : v==="lean"?"Lean" : v==="fade"?"Fade" : "Pass";
      return (
        <div className="ai-rise" style={{background:"rgba(255,255,255,0.04)",border:`0.5px solid ${tc}3a`,borderRadius:11,padding:"11px 12px",marginBottom:11}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)"}}>Plok read</div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.04em",textTransform:"uppercase",color:tc,background:`${tc}1f`,borderRadius:6,padding:"3px 8px"}}>{vlabel}</div>
          </div>
          {!isPass ? (
            <div style={{display:"flex",alignItems:"center",gap:9,marginTop:8}}>
              <div style={{flex:1,height:7,borderRadius:5,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${conv}%`,borderRadius:5,background:`linear-gradient(90deg,${tc},${tc}aa)`,transition:"width .6s ease"}}/>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:tc,minWidth:28,textAlign:"right"}}>{conv}</div>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"flex-start",gap:7,marginTop:7}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="9"/>{v==="fade"?<path d="M15 9l-6 6M9 9l6 6"/>:<line x1="8" y1="12" x2="16" y2="12"/>}</svg>
              <div style={{fontSize:11.5,lineHeight:1.4,color:"rgba(255,255,255,0.72)"}}>{v==="fade"?"Plok leans the other way here — this side doesn't have the edge.":"Not enough here to love it. Save your slip for a better spot."}</div>
            </div>
          )}
        </div>
      );
    })()}
    {phase>=1 && !data.matchup && data.keyStats && data.keyStats.length>0 && (
      <div className="ai-rise" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
        {data.keyStats.slice(0,4).map((s,si)=>(
          <div key={si} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"8px 10px"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fff",lineHeight:1.1}}>{s.value}</div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>
    )}
    {phase>=2 && data.trends && data.trends.length>0 && (
      <div className="ai-rise" style={{display:"flex",flexDirection:"column",gap:5,marginBottom:11}}>
        {data.trends.map((tr,ti)=>(
          <div key={ti} style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:12,color:"rgba(255,255,255,0.7)"}}>
            <span style={{flexShrink:0,marginTop:2,display:"inline-flex"}}>{tr.dir==="up"
              ? <svg width="9" height="9" viewBox="0 0 10 10" fill={IOS.green}><path d="M5 1l4 8H1z"/></svg>
              : <svg width="9" height="9" viewBox="0 0 10 10" fill={IOS.red}><path d="M5 9L1 1h8z"/></svg>}</span>
            <span style={{lineHeight:1.4}}>{tr.text}</span>
          </div>
        ))}
      </div>
    )}
    {phase>=3 && data.bullCase && (
      <div className="ai-rise" style={{borderLeft:"3px solid "+IOS.green,paddingLeft:9,marginBottom:8}}>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.green,marginBottom:2}}>Bull case</div>
        <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.8)"}}>{data.bullCase}</div>
      </div>
    )}
    {phase>=4 && data.bearCase && (
      <div className="ai-rise" style={{borderLeft:"3px solid "+IOS.red,paddingLeft:9}}>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.red,marginBottom:2}}>Bear case</div>
        <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.8)"}}>{data.bearCase}</div>
      </div>
    )}
    {phase>=5 && item.bet && (
      <button className="ai-rise" onClick={onAddToSlip} disabled={item.added}
        style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:item.added?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:item.added?"rgba(48,209,88,0.18)":IOS.blue,color:item.added?IOS.green:"#fff",fontSize:13,fontWeight:800}}>
        {item.added && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        {item.added ? "Added to slip" : "Add to slip"}
      </button>
    )}
    {phase>=5 && item.bet && <BetslipButton bet={item.bet} IOS={IOS}/>}
  </div>);
}

function SoloHome({soloWeeks, soloLoading, isPro, IOS, setScreen, setShowNewLeague, setNewLeagueStep, setShowBrowse, fetchPublicLeagues, setIsSoloMode, setActiveLeagueId, getOrCreateSoloLeague, soloSavedPicks, setSoloSavedPicks, soloFlexPicks, setSoloFlexPicks, soloSport, setSoloSport, setShowSoloSportPicker, soloSubmitted, setSoloSubmitted, username, soloTopPct, onDeleteSlate, onJoinCode, setShowPaywall, tickerGames=[], espnGames=[]}) {
  const [shareToast,setShareToast]=useState("");
  const [openSlate,setOpenSlate]=useState(null);
  const [joinCode,setJoinCode]=useState("");
  const [dayPlay,setDayPlay]=useState(null); // Plok Play of the Day: {loading|data|error}
  const _MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const slateStamp=(w)=>{
    const ds=(w.picks||[]).map(p=>p.game_date||p.created_at).filter(Boolean).map(d=>new Date(d)).filter(d=>!isNaN(d));
    const gs=new Set((w.picks||[]).map(p=>(p.game||"").trim()).filter(Boolean));
    let dstr=""; if(ds.length){ const d=new Date(Math.min(...ds.map(x=>x.getTime()))); dstr=_MON[d.getMonth()]+" "+d.getDate(); }
    const gN=gs.size||0;
    return (dstr||"") + (gN?((dstr?" · ":"")+gN+" game"+(gN>1?"s":"")):"");
  };
  const totalWins = soloWeeks.reduce((s,w)=>s+w.wins,0);
  const totalLosses = soloWeeks.reduce((s,w)=>s+w.losses,0);
  const totalPts = soloWeeks.reduce((s,w)=>s+w.pts,0);
  const winPct = totalWins+totalLosses > 0 ? Math.round((totalWins/(totalWins+totalLosses))*100) : 0;
  const bestWeek = soloWeeks.length > 0 ? soloWeeks.reduce((b,w)=>w.pts>b.pts?w:b,soloWeeks[0]) : null;
  const freePicks = (soloSavedPicks && soloSavedPicks.freePicks) || null;
  const hasLockedSlip = soloSavedPicks && (soloSavedPicks.flexPicks || freePicks);
  const lockedPicks = (hasLockedSlip && soloSavedPicks.flexPicks) ? [...soloSavedPicks.flexPicks].filter(s=>s.mult!==null) : [];
  const currentWeekNum = (soloWeeks.length ? Math.max(...soloWeeks.map(w=>w.week)) : 0) + 1;

  // ── Today's slate live stats + featured game (replaces old Slate Challenge) ──
  const gradedSlates = soloWeeks.filter(w=>(w.wins+w.losses)>0);
  const _cur = (freePicks && freePicks.length ? freePicks : lockedPicks) || [];
  const curW = _cur.filter(p=>p && p.result==="W").length;
  const curL = _cur.filter(p=>p && p.result==="L").length;
  const curGraded = curW + curL;
  const curPending = _cur.length - curGraded;
  const curPts = _cur.reduce((s,p)=>s+parseFloat((p&&p.points_earned)||0),0);
  const buildingCount = (soloFlexPicks && soloFlexPicks.length) || 0;
  const featGame = (tickerGames||[]).find(g=>{ const t=g&&g.time?new Date(g.time):null; return t && t>new Date(); }) || (tickerGames && tickerGames[0]) || null;

  // ── Streaks & personal bests (#3) ──────────────────────────────────────────
  const gradedAsc = [...gradedSlates].sort((a,b)=>a.week-b.week);
  const isSlateHit = (w)=> w.wins > w.losses;
  let longestStreak=0, _run=0;
  gradedAsc.forEach(w=>{ if(isSlateHit(w)){ _run++; if(_run>longestStreak) longestStreak=_run; } else _run=0; });
  let currentStreak=0;
  for(let i=gradedAsc.length-1;i>=0;i--){ if(isSlateHit(gradedAsc[i])) currentStreak++; else break; }
  const bestSlatePts = gradedSlates.length ? Math.max(...gradedSlates.map(w=>w.pts)) : 0;
  const perfectSlates = gradedSlates.filter(w=>w.losses===0 && w.wins>0).length;
  const hasRecords = gradedSlates.length > 0;
  const shareSlate = async (w) => {
    try{
      if(document.fonts&&document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
      const winsArr=(w.picks||[]).filter(pk=>pk.result==="W");
      const bestPk = winsArr.length ? winsArr.reduce((a,b)=>(parseFloat(b.points_earned||0)>parseFloat(a.points_earned||0)?b:a)) : null;
      const slateWinPct=(w.wins+w.losses)>0?Math.round(w.wins/(w.wins+w.losses)*100):0;
      const cv = soloDrawCard({slate:w.week, points:w.pts, record:w.wins+"-"+w.losses, slateWinPct, streak:currentStreak, allTimeWinPct:winPct, picksN:(w.picks?w.picks.length:0), bestPick: bestPk?{name:bestPk.pick_name,odds:bestPk.odds,pts:parseFloat(bestPk.points_earned||0)}:null, topPct:soloTopPct, name:username||""});
      const url="https://lined-up-murex.vercel.app";
      const text="Slate "+w.week+": "+w.wins+"-"+w.losses+", "+(w.pts>=0?"+":"")+Math.round(w.pts)+" pts"+(soloTopPct?(" — top "+soloTopPct+"% of all pickers"):"")+" on PickLock Solo.";
      const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
      const file=blob?new File([blob],"picklock-slate.png",{type:"image/png"}):null;
      if(file && navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file],text,title:"My PickLock Slate"});
      else if(navigator.share) await navigator.share({text,url,title:"My PickLock Slate"});
      else { const a=document.createElement("a"); a.href=cv.toDataURL("image/png"); a.download="picklock-slate.png"; a.click(); try{ await navigator.clipboard.writeText(text+" "+url); }catch(e){} setShareToast("Card saved — caption copied"); setTimeout(()=>setShareToast(""),2400); }
    }catch(e){}
  };

  const sportLabels = {nfl:"NFL",nba:"NBA",mlb:"MLB"};
  const sportColors = {nfl:"#0A84FF",nba:"#FF6B35",mlb:"#30D158"};

  return (
    <div style={{padding:"0 16px 40px"}}>
      {/* Stats row */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={{flex:1,background:IOS.bg2,borderRadius:10,padding:"10px 12px",border:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:10,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Record</div>
          <div style={{fontSize:18,fontWeight:800,color:IOS.blue}}>{totalWins}-{totalLosses}</div>
        </div>
        <div style={{flex:1,background:IOS.bg2,borderRadius:10,padding:"10px 12px",border:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:10,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Win %</div>
          <div style={{fontSize:18,fontWeight:800,color:winPct>=60?IOS.green:winPct>=40?IOS.yellow:IOS.red}}>{winPct}%</div>
        </div>
        <div style={{flex:1,background:IOS.bg2,borderRadius:10,padding:"10px 12px",border:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:10,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Total Pts</div>
          <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{totalPts.toFixed(1)}</div>
        </div>
      </div>

      {/* Plok's Play of the Day */}
      {featGame && ((dayPlay && dayPlay.data) ? (
        <div style={{background:"linear-gradient(135deg,rgba(10,132,255,0.14),rgba(94,92,230,0.08))",border:"0.5px solid rgba(10,132,255,0.32)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>
            <span style={{fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:IOS.blue,flex:1}}>Plok's Play of the Day</span>
            {dayPlay.data.verdict && dayPlay.data.verdict!=="none" && <span style={{fontSize:9,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",color:dayPlay.data.verdict==="strong"?IOS.green:dayPlay.data.verdict==="fade"?IOS.red:IOS.blue,background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"3px 7px"}}>{dayPlay.data.verdict==="strong"?"Strong lean":dayPlay.data.verdict==="lean"?"Lean":dayPlay.data.verdict==="fade"?"Fade":"Pass"}</span>}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:IOS.label2,marginBottom:6}}>{(featGame.away||"").split(" ").pop()} @ {(featGame.home||"").split(" ").pop()}</div>
          <div style={{fontSize:13,lineHeight:1.5,color:"rgba(255,255,255,0.88)"}}>{dayPlay.data.summary}</div>
          <div onClick={async()=>{ if(setIsSoloMode) setIsSoloMode(true); const lgId=await getOrCreateSoloLeague(); if(setActiveLeagueId) setActiveLeagueId(lgId||"solo"); setScreen("picks"); }} style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,fontWeight:800,color:IOS.blue,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.3)",borderRadius:8,padding:"7px",cursor:"pointer"}}>Build today's slate →</div>
        </div>
      ) : (
        <div onClick={()=>{ if(!isPro){ if(setShowPaywall) setShowPaywall("ai"); return; } if(dayPlay&&dayPlay.loading) return; setDayPlay({loading:true}); fetch("/api/findbet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sport:soloSport, game:(featGame.away+" @ "+featGame.home)})}).then(async r=>{ const d=await r.json().catch(()=>null); setDayPlay((r.ok&&d&&d.summary)?{data:d}:{error:true}); }).catch(()=>setDayPlay({error:true})); }} style={{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.10))",border:"0.5px solid rgba(10,132,255,0.35)",borderRadius:12,padding:"12px 14px",marginBottom:12,cursor:"pointer"}}>
          <div style={{width:34,height:34,borderRadius:10,background:"rgba(10,132,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {dayPlay&&dayPlay.loading ? <div style={{display:"flex",gap:3}}><span className="ai-dot"/><span className="ai-dot" style={{animationDelay:"0.15s"}}/><span className="ai-dot" style={{animationDelay:"0.3s"}}/></div> : <svg width="18" height="18" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13.5,fontWeight:800,color:"#fff"}}>Plok's Play of the Day</div>
            <div style={{fontSize:11,color:IOS.label2,marginTop:1}}>{dayPlay&&dayPlay.loading?"Reading the matchup…":dayPlay&&dayPlay.error?"Couldn't load — tap to retry":("Plok's lean on "+((featGame.away||"").split(" ").pop())+" @ "+((featGame.home||"").split(" ").pop())+(isPro?"":" · Pro"))}</div>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </div>
      ))}

      {/* Today's Slate — live tracker */}
      <div onClick={async()=>{ if(setIsSoloMode) setIsSoloMode(true); const lgId=await getOrCreateSoloLeague(); if(setActiveLeagueId) setActiveLeagueId(lgId||"solo"); setScreen("picks"); }} style={{background:IOS.bg2,border:`0.5px solid ${hasLockedSlip?"rgba(48,209,88,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"12px 14px",marginBottom:12,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5}}>Today's Slate</div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff",marginTop:3}}>{hasLockedSlip ? ("Slate "+currentWeekNum+" locked") : buildingCount>0 ? ("Slate "+currentWeekNum+" · "+buildingCount+" pick"+(buildingCount>1?"s":"")) : ("Start Slate "+currentWeekNum)}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
            {hasLockedSlip ? <div style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:20,color:curGraded>0&&curPts>0?IOS.green:"#fff"}}>{curGraded>0?((curPts>=0?"+":"")+Math.round(curPts)):_cur.length}<span style={{fontSize:11,color:IOS.label3,fontWeight:700}}>{curGraded>0?" pts":" picks"}</span></div> : <div style={{fontSize:11,fontWeight:800,color:IOS.blue}}>{buildingCount>0?"Lock slate →":"Build slate →"}</div>}
          </div>
        </div>
        {hasLockedSlip && _cur.length>0 && (<>
          <div style={{height:5,background:"#1A1A1A",borderRadius:3,margin:"9px 0 6px",overflow:"hidden"}}>
            <div style={{width:`${Math.round(curGraded/_cur.length*100)}%`,height:"100%",background:curW>=curL?IOS.green:IOS.red,borderRadius:3,transition:"width .5s ease"}}/>
          </div>
          <div style={{fontSize:10,color:IOS.label3}}>{curGraded>0?(curW+"-"+curL+(curPending>0?(" · "+curPending+" live"):" · final")):(_cur.length+" picks locked · live as games settle")}</div>
        </>)}
      </div>

      {/* Your records — streaks & personal bests */}
      {hasRecords && (
      <div style={{background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Your Records</div>
        <div style={{display:"flex",alignItems:"stretch"}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
              {currentStreak>0
                ? <StreakFlame count={currentStreak} size={15}/>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="1.8" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
              <span style={{fontSize:17,fontWeight:800,color:currentStreak>0?"#FF9F0A":"#fff"}}>{currentStreak}</span>
            </div>
            <div style={{fontSize:9,color:IOS.label3,textTransform:"uppercase",letterSpacing:.3,marginTop:3}}>Streak</div>
          </div>
          <div style={{width:"0.5px",background:"rgba(255,255,255,0.08)",margin:"2px 0"}}/>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:800,color:IOS.green}}>{bestSlatePts>0?"+"+Math.round(bestSlatePts):"—"}</div>
            <div style={{fontSize:9,color:IOS.label3,textTransform:"uppercase",letterSpacing:.3,marginTop:3}}>Best Slate</div>
          </div>
          <div style={{width:"0.5px",background:"rgba(255,255,255,0.08)",margin:"2px 0"}}/>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{longestStreak}</div>
            <div style={{fontSize:9,color:IOS.label3,textTransform:"uppercase",letterSpacing:.3,marginTop:3}}>Longest</div>
          </div>
          <div style={{width:"0.5px",background:"rgba(255,255,255,0.08)",margin:"2px 0"}}/>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:800,color:perfectSlates>0?IOS.gold:"#fff"}}>{perfectSlates}</div>
            <div style={{fontSize:9,color:IOS.label3,textTransform:"uppercase",letterSpacing:.3,marginTop:3}}>Perfect</div>
          </div>
        </div>
      </div>
      )}

      {/* Today's games */}
      {tickerGames && tickerGames.length>0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Today’s Games</div>
          <div style={{display:"flex",gap:9,overflowX:"auto",paddingBottom:4}}>
            {tickerGames.slice(0,12).map((g,gi)=>{
              const away=(g.away||"").split(" ").pop(), home=(g.home||"").split(" ").pop();
              const espn=(espnGames||[]).find(e=>e.awayTeam?.toLowerCase().includes(away.toLowerCase())||e.homeTeam?.toLowerCase().includes(home.toLowerCase()));
              const t=g.time?new Date(g.time):null; const now=new Date();
              const isLive=!!t&&now>=t&&now<new Date(t.getTime()+4*60*60*1000);
              const isDone=!!espn&&espn.awayScore!=null&&espn.homeScore!=null&&!isLive&&!!t&&now>=t;
              const gameTime=t?t.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"";
              return (
                <div key={gi} onClick={async()=>{ if(setIsSoloMode) setIsSoloMode(true); const lgId=await getOrCreateSoloLeague(); if(setActiveLeagueId) setActiveLeagueId(lgId||"solo"); setScreen("picks"); }} style={{flexShrink:0,width:150,background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"10px 11px",cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:8.5,fontWeight:800,letterSpacing:.3,color:isLive?IOS.green:IOS.label3,textTransform:"uppercase"}}>{isLive?"● LIVE":isDone?"FINAL":gameTime}</span>
                    <span style={{fontSize:8.5,fontWeight:700,color:IOS.label3}}>{sportLabels[soloSport]||""}</span>
                  </div>
                  {[{nm:away,sc:espn?.awayScore},{nm:home,sc:espn?.homeScore}].map((tm,ti)=>(
                    <div key={ti} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"2px 0"}}>
                      <span style={{fontSize:12.5,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tm.nm}</span>
                      {(isLive||isDone)&&tm.sc!=null&&<span style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.8)",flexShrink:0,marginLeft:6}}>{tm.sc}</span>}
                    </div>
                  ))}
                  <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:10,fontWeight:800,color:IOS.blue,background:"rgba(10,132,255,0.1)",border:"0.5px solid rgba(10,132,255,0.25)",borderRadius:7,padding:"5px"}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add to slate
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* This week's slip card */}
      <div style={{background:IOS.bg2,border:`0.5px solid ${hasLockedSlip?"rgba(48,209,88,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:hasLockedSlip?10:4}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Slate {currentWeekNum}</div>
            {!hasLockedSlip && <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>Pick as many as you want. Just you vs the line.</div>}
          </div>
          {hasLockedSlip && (
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.3)",borderRadius:8,padding:"4px 9px"}}>
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#30D158"/></svg>
              <span style={{fontSize:10,fontWeight:700,color:IOS.green}}>LOCKED</span>
            </div>
          )}
        </div>

        {/* Locked slip mini preview */}
        {hasLockedSlip ? (
          <>
            <div style={{marginBottom:10}}>
              {freePicks ? freePicks.map((b,i)=>{
                const fcol = b.categoryColor || IOS.blue;
                const flabel = (b.categoryLabel||b.category||"PICK");
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<freePicks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
                    <div style={{minWidth:42,textAlign:"center",fontSize:8.5,fontWeight:800,letterSpacing:.3,textTransform:"uppercase",color:fcol,background:`${fcol}18`,borderRadius:5,padding:"2px 5px",flexShrink:0}}>{flabel}</div>
                    <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.75)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</div>
                    <div style={{fontSize:11,fontWeight:800,color:(b.odds||"").startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{b.odds}</div>
                  </div>
                );
              }) : lockedPicks.sort((a,b)=>a.mult-b.mult).map((slot,i)=>{
                const catColors = {ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};
                const catLabels = {ml:"ML",prop:"PROP",ou:"O/U",spread:"SPR",longshot:"PARLAY"};
                const isParlay = slot.isParlay && slot.parlayLegs?.length >= 2;
                const label = isParlay ? "PARLAY" : catLabels[slot.category] || "PICK";
                const col = isParlay ? IOS.pink : catColors[slot.category] || IOS.blue;
                const pickName = isParlay
                  ? `${slot.parlayLegs.length}-leg parlay`
                  : slot.bet?.pick || "—";
                const odds = isParlay
                  ? (() => { try { const d=slot.parlayLegs.reduce((a,b)=>{const dec=b.impliedOdds>0?(b.impliedOdds/100)+1:(100/Math.abs(b.impliedOdds))+1;return a*dec;},1); return d>=2?`+${Math.round((d-1)*100)}`:`${Math.round(-100/(d-1))}`; } catch(e){return "—";} })()
                  : slot.bet?.odds || "—";
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<lockedPicks.length-1?`0.5px solid rgba(255,255,255,0.05)`:"none"}}>
                    <div style={{width:28,textAlign:"center",fontSize:9,fontWeight:800,color:col,background:`${col}18`,borderRadius:5,padding:"2px 4px",flexShrink:0}}>{label}</div>
                    <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.75)",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pickName}</div>
                    <div style={{fontSize:11,fontWeight:800,color:odds.startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{odds}</div>
                    <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",width:16,textAlign:"right",flexShrink:0}}>{slot.mult}×</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={async()=>{
                if(setIsSoloMode) setIsSoloMode(true);
                const lgId = await getOrCreateSoloLeague();
                if(setActiveLeagueId) setActiveLeagueId(lgId||"solo");
                setScreen("picks");
              }} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
                View Slate
              </button>
            </div>
          </>
        ) : (
          <button onClick={async()=>{
            if(isPro) {
              // Pro: go straight to picks with current soloSport
              if(setIsSoloMode) setIsSoloMode(true);
              const lgId = await getOrCreateSoloLeague();
              if(setActiveLeagueId) setActiveLeagueId(lgId||"solo");
              setScreen("picks");
            } else {
              // Free: show sport picker first
              setShowSoloSportPicker(true);
            }
          }} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
            Build This Slate
          </button>
        )}
      </div>

      {/* Past weeks */}
      {soloLoading ? (
        <div style={{textAlign:"center",padding:"24px",color:IOS.label3,fontSize:13}}>Loading...</div>
      ) : soloWeeks.length === 0 ? (
        <div style={{textAlign:"center",padding:"24px 16px",background:IOS.bg2,borderRadius:12,border:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:6}}>No picks yet</div>
          <div style={{fontSize:12,color:IOS.label3}}>Lock in your first slip to start tracking your record.</div>
        </div>
      ) : (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Recent Slates</div>
          {soloWeeks.map((w)=>{
            const isOpen=openSlate===w.week;
            const isBest=bestWeek && bestWeek.week===w.week && bestWeek.pts>0 && soloWeeks.length>1;
            const stamp=slateStamp(w);
            return (
            <div key={w.week} style={{background:IOS.bg2,border:`0.5px solid ${isOpen?"rgba(255,255,255,0.16)":"rgba(255,255,255,0.07)"}`,borderRadius:10,marginBottom:6,overflow:"hidden"}}>
              <div onClick={()=>setOpenSlate(isOpen?null:w.week)} style={{padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2,display:"flex",alignItems:"center",gap:7}}>Slate {w.week}{isBest&&<span style={{fontSize:8,fontWeight:800,color:"#08110a",background:IOS.gold,borderRadius:4,padding:"1px 5px",letterSpacing:.3}}>BEST</span>}</div>
                  <div style={{fontSize:11,color:IOS.label3}}>{stamp?stamp+" · ":""}<span style={{color:w.wins>0?IOS.green:IOS.label3}}>{w.wins}W</span>-<span style={{color:w.losses>0?IOS.red:IOS.label3}}>{w.losses}L</span> · {w.picks.length} picks</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:800,color:w.pts>0?IOS.green:"#555"}}>{w.pts>0?"+"+w.pts:"0"} pts</div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              {isOpen && (
                <div style={{padding:"0 14px 12px",borderTop:"0.5px dashed rgba(255,255,255,0.08)"}}>
                  {(w.picks||[]).map((p,pi)=>{
                    const res=(p.result||"pending");
                    const rc=res==="W"?IOS.green:res==="L"?IOS.red:res==="P"?IOS.label3:"rgba(255,255,255,0.3)";
                    const rl=res==="W"?"WON":res==="L"?"LOST":res==="P"?"PUSH":"PENDING";
                    return (
                      <div key={pi} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:pi<w.picks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:rc,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.pick_name}</div>
                          {p.game && <div style={{fontSize:10,color:IOS.label3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.game}</div>}
                        </div>
                        <div style={{fontSize:11,fontWeight:800,color:String(p.odds||"").startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{p.odds}</div>
                        <div style={{fontSize:8.5,fontWeight:800,letterSpacing:.3,color:rc,minWidth:52,textAlign:"right",flexShrink:0}}>{rl}{res==="W"&&p.points_earned?` +${parseFloat(p.points_earned).toFixed(1)}`:""}</div>
                      </div>
                    );
                  })}
                  <div style={{display:"flex",gap:8,marginTop:11}}>
                    <button onClick={()=>shareSlate(w)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(191,90,242,0.12)",border:"0.5px solid rgba(191,90,242,0.3)",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,color:"#BF5AF2",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
                      Share
                    </button>
                    <button onClick={async()=>{ if(window.confirm("Delete Slate "+w.week+"? This removes its picks and updates your record.")){ if(onDeleteSlate) await onDeleteSlate(w.week); setOpenSlate(null); } }} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,69,58,0.1)",border:"0.5px solid rgba(255,69,58,0.3)",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,color:IOS.red,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
          {shareToast && <div style={{position:"fixed",left:"50%",bottom:96,transform:"translateX(-50%)",background:"rgba(20,20,26,0.96)",border:"0.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 16px",fontSize:12,fontWeight:700,color:"#fff",zIndex:99999,boxShadow:"0 8px 30px rgba(0,0,0,0.5)"}}>{shareToast}</div>}
        </div>
      )}

      {/* Convert to league CTA */}
      {soloWeeks.length >= 1 && (
        <div style={{marginTop:12,background:"rgba(10,132,255,0.08)",border:"0.5px solid rgba(10,132,255,0.2)",borderRadius:12,padding:"14px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>You&apos;re picking at {winPct}%</div>
          <div style={{fontSize:11,color:IOS.label3,marginBottom:12,lineHeight:1.5}}>Prove it against friends — create a league and see how you stack up.</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowNewLeague(true);setNewLeagueStep(0);}} style={{flex:1,background:IOS.blue,border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Create League</button>
            <button onClick={()=>{setShowBrowse(true);fetchPublicLeagues();}} style={{flex:1,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.3)",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,color:IOS.blue,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Browse Leagues</button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="Join with code" style={{flex:1,background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px",color:"#fff",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",outline:"none"}}/>
            <button onClick={async()=>{ const c=(joinCode||"").trim(); if(!c) return; if(onJoinCode) await onJoinCode(c); setJoinCode(""); }} style={{background:joinCode.trim()?IOS.blue:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:800,color:joinCode.trim()?"#fff":"rgba(255,255,255,0.35)",cursor:joinCode.trim()?"pointer":"default",fontFamily:"Barlow,sans-serif"}}>Join</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ICON HELPERS (SVG, no emoji) ────────────────────────────────
const puSVG = (id, color="#fff") => {
  const s = {width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons = {
    steal:    <svg {...s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    enhance:  <svg {...s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    insurance:<svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    lock:     <svg {...s}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    double:   <svg {...s}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
    peek:     <svg {...s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>,
    bomb:     <svg {...s}><circle cx="11" cy="13" r="8"/><path d="M14 2l4 4"/><path d="M18 2l-4 4"/><line x1="14" y1="6" x2="18" y2="2"/></svg>,
    clock:    <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    swap:     <svg {...s}><polyline points="16 3 21 8 16 13"/><path d="M21 8H9a4 4 0 0 0-4 4"/><polyline points="8 21 3 16 8 11"/><path d="M3 16h12a4 4 0 0 0 4-4"/></svg>,
    wildcard: <svg {...s}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill={color} stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill={color} stroke="none"/><circle cx="12" cy="12" r="1.4" fill={color} stroke="none"/></svg>,
  };
  const key = (id && id.indexOf("enhance")===0) ? "enhance" : (id==="second" ? "clock" : id);
  return icons[key] || <svg {...s}><circle cx="12" cy="12" r="10"/></svg>;
};

const catSVG = (id, color="#fff") => {
  const s = {width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons = {
    ml:       <svg {...s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    prop:     <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    ou:       <svg {...s}><polyline points="18 15 12 9 6 15"/><polyline points="18 19 12 13 6 19"/></svg>,
    spread:   <svg {...s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    longshot: <svg {...s}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  };
  return icons[id] || <svg {...s}><circle cx="12" cy="12" r="10"/></svg>;
};

const trophySVG = (id, color="#fff") => {
  const s = {width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons = {
    sharp:  <svg {...s}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    long:   <svg {...s}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    hot:    <svg {...s}><path d="M13 2c0 2.4-1.5 4.6-3 6 0-2-1.5-3-3-3 0 2.5-1.5 4.5-3 6.5-1 1.5-1 3.5 0 5a9 9 0 0 0 18 0c0-5-4-9.5-9-14.5z"/></svg>,
    upset:  <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    whale:  <svg {...s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    cold:   <svg {...s}><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    grind:  <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    come:   <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    goat:   <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  };
  return icons[id] || <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
};

const PERIOD_MARKETS = { ml_h1:"h2h_h1", spread_h1:"spreads_h1", ou_h1:"totals_h1", ml_f5:"h2h_1st_5_innings", spread_f5:"spreads_1st_5_innings", ou_f5:"totals_1st_5_innings", yrfi:"totals_1st_1_innings", nrfi:"totals_1st_1_innings" };
const PERIOD_CATS = ["ml_h1","spread_h1","ou_h1","ml_f5","spread_f5","ou_f5","yrfi","nrfi"];
export default function App() {
 const [screen, setScreen] = useState("home");
 const [tutorialStep, setTutorialStep] = useState(-1); // -1 = hidden; only shown on fresh signup
 const dismissTutorial = () => {
 try { localStorage.setItem('picklock_tutorial_done','1'); } catch {}
 setTutorialStep(-1);
 };
 const [user, setUser] = useState(null);
 const [userProfile, setUserProfile] = useState(null); // { username, email }
 const [editingUsername, setEditingUsername] = useState(false);
 const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
 const [usernamePromptInput, setUsernamePromptInput] = useState("");
 const [usernamePromptError, setUsernamePromptError] = useState("");
 const [usernamePromptSaving, setUsernamePromptSaving] = useState(false);
 const [usernameInput, setUsernameInput] = useState("");
 const [usernameSaving, setUsernameSaving] = useState(false);
 const [usernameError, setUsernameError] = useState("");
 const [authScreen, setAuthScreen] = useState("login");
 const [anim, setAnim] = useState(false);
 const [timeLeft, setTimeLeft] = useState({h:0,m:0,s:0});
 const [submitted, setSubmitted] = useState(false);
 const [leagueTab, setLeagueTab] = useState("standings");
 const [expanded, setExpanded] = useState(null);
 const [sortBy, setSortBy] = useState("rank");
 const [chatMsg, setChatMsg] = useState("");
 const [messages, setMessages] = useState([]);
 const [chatLoading, setChatLoading] = useState(false);
 const [activeLeagueId, setActiveLeagueId] = useState(()=>{ try{ return localStorage.getItem("picklock_active_league")||"lg1"; }catch(e){ return "lg1"; } });
 useEffect(()=>{ if(activeLeagueId && activeLeagueId!=="lg1" && activeLeagueId!=="solo"){ try{ localStorage.setItem("picklock_active_league", activeLeagueId); }catch(e){} } }, [activeLeagueId]);
 const [realLeagues, setRealLeagues] = useState([]);
 const [leaguesLoading, setLeaguesLoading] = useState(true);
 const [leagueMembers, setLeagueMembers] = useState([]);
 const [bracketMatchups, setBracketMatchups] = useState([]);
 const [bracketDetail, setBracketDetail] = useState(null);
 const [bracketLive, setBracketLive] = useState({week:0,totals:{}});
 const [champCelebrate, setChampCelebrate] = useState(null);
 const champSeenRef = useRef("");
 const [weekPicks, setWeekPicks] = useState([]);
 const [liveSchedule, setLiveSchedule] = useState([]);
 const [realStandings, setRealStandings] = useState([]);
 const [allMyStats, setAllMyStats] = useState(null);
 const [leagueTrophies, setLeagueTrophies] = useState([]);
 // solo weeks must be declared before activeLeague since activeLeague uses soloWeeks.length
 const [soloWeeks, setSoloWeeks] = useState([]);
 const [soloTopPct, setSoloTopPct] = useState(null);
 const [soloLoading, setSoloLoading] = useState(false);
 const [isSoloMode, setIsSoloMode] = useState(false);
 const isSoloModeRef = useRef(false);
 const setSoloModeWithRef = (val) => { isSoloModeRef.current = val; setIsSoloMode(val); };
 const [soloLeagueId, setSoloLeagueId] = useState(null);
 const [soloSport, setSoloSport] = useState(()=>{ try{return localStorage.getItem("picklock_solo_sport")||"nfl";}catch(e){return "nfl";} });
 const setSoloSportPersist = (sp) => { setSoloSport(sp); try{localStorage.setItem("picklock_solo_sport",sp);}catch(e){} };
 const [showSoloSportPicker, setShowSoloSportPicker] = useState(false); // sport selector before building
 const activeLeague = isSoloMode ? {id:soloLeagueId||"solo",name:"Solo Mode",sport:soloSport,current_week:(soloWeeks.length+1),season_weeks:99,max_members:1,target_size:1,isCommissioner:false} : ([...realLeagues].find(l=>l.id===activeLeagueId) || realLeagues[0] || {id:"",name:"",sport:"nfl",current_week:1,season_weeks:18,max_members:8,target_size:8,isCommissioner:false});
 const sport = SPORTS[activeLeague?.sport] || SPORTS["nfl"];
 const SLOTS = sport.slots;

 // ─── LIVE ODDS STATE ─────────────────────────────────────────────
 const [liveOdds, setLiveOdds] = useState({});
 const [homeTab, setHomeTab] = useState('home');
 const [homeMode, setHomeMode] = useState('leagues');
 const [leagueSubTab, setLeagueSubTab] = useState("overview");
 const [tickerGames, setTickerGames] = useState([]); // raw games for the ticker
 const [espnGames, setEspnGames] = useState([]); // ESPN scoreboard with IDs
 const [weekResult, setWeekResult] = useState(null);
 const [recapPicks, setRecapPicks] = useState([]); // {won, myPts, oppPts, oppName, week}
 const [leagueRecap, setLeagueRecap] = useState(null);
 const [strayPicks, setStrayPicks] = useState([]);
 const [leagueRecapLoading, setLeagueRecapLoading] = useState(false);
 const [gameSheet, setGameSheet] = useState(null); // { tickerGame, espnGame, detail }
 const [gameTeamTab, setGameTeamTab] = useState('matchup'); // 'matchup' | 'away' | 'home' 
 const [gameLoading, setGameLoading] = useState(false);
 const [gameRead, setGameRead] = useState({});
 const [oddsLoading, setOddsLoading] = useState(false);
 const [oddsError, setOddsError] = useState(false);
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
 console.log(`[odds] ${sportId} payload keys:`, Object.keys(payload), "games:", (payload.games||payload)?.length);
 const games = payload.games || payload; // handle both formats

 const ml = [], spread = [], ou = [], longshot = [];

 games.forEach((game, gi) => {
 const home = game.home_team;
 const away = game.away_team;
 const gameLabel = `${away} @ ${home}`;
 const dk = game.bookmakers?.[0];
 if(!dk) return;

 const h2h = dk.markets?.find(m=>m.key==="h2h");
 const spreads = dk.markets?.find(m=>m.key==="spreads");
 const totals = dk.markets?.find(m=>m.key==="totals");

 // Moneyline — both sides
 h2h?.outcomes?.forEach((o, oi) => {
 const american = o.price >= 0 ? `+${o.price}` : `${o.price}`;
 ml.push({
 id: `live_ml_${gi}_${oi}`,
 game: gameLabel,
 pick: o.name,
 odds: american,
 impliedOdds: o.price,
 edge: (o.edge!=null?o.edge:null),
 gameTime: game.commence_time,
 eventId: game.id, marketKey: "h2h", outcome: o.name, point: null,
 selKey: `${game.id}|h2h|${o.name}|`,
 });
 // Longshots: +400 or better
 if(o.price >= 400) {
 longshot.push({
 id: `live_ls_${gi}_${oi}`,
 game: gameLabel,
 pick: `${o.name} ML`,
 odds: american,
 impliedOdds: o.price,
 gameTime: game.commence_time,
 eventId: game.id, marketKey: "h2h", outcome: o.name, point: null,
 selKey: `${game.id}|h2h|${o.name}|`,
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
 edge: (o.edge!=null?o.edge:null),
 gameTime: game.commence_time,
 eventId: game.id, marketKey: "spreads", outcome: o.name, point: o.point,
 selKey: `${game.id}|spreads|${o.name}|${o.point}`,
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
 edge: (o.edge!=null?o.edge:null),
 gameTime: game.commence_time,
 eventId: game.id, marketKey: "totals", outcome: o.name, point: o.point,
 selKey: `${game.id}|totals|${o.name}|${o.point}`,
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

 // Lazy per-event period-odds fetch (1st half / first-5 / YRFI-NRFI). Only called for
 // games in a custom league that actually has a period slot. Cached: cats default to []
 // so a sport isn't re-fetched once attempted.
 const fetchPeriodOdds = async (sportId, eventIds, periodTypes) => {
 if(!eventIds.length || !periodTypes.length) return;
 const sportKey = SPORT_KEYS[sportId]; if(!sportKey) return;
 const marketKeys = [...new Set(periodTypes.map(t=>PERIOD_MARKETS[t]).filter(Boolean))];
 if(!marketKeys.length) return;
 try {
 const res = await fetch(`/api/eventodds?sport=${sportKey}&events=${eventIds.join(",")}&markets=${marketKeys.join(",")}`);
 if(!res.ok) return;
 const data = await res.json();
 const grouped = {}; periodTypes.forEach(t=>{ grouped[t]=[]; });
 (data.bets||[]).forEach(b=>{ if(grouped[b.category]) grouped[b.category].push(b); });
 setLiveOdds(prev=>({ ...prev, [sportId]: { ...(prev[sportId]||{}), ...grouped } }));
 } catch(e) { console.warn("period odds fetch failed", e); }
 };

 // Use live odds if available, else fall back to hardcoded
 // Multi-sport: merge bets from all sports in the league
 const leagueSports = (activeLeague.sports && activeLeague.sports.length > 0)
   ? activeLeague.sports
   : [activeLeague.sport || "nfl"];
 const BETS = (() => {
   const merged = {ml:[],spread:[],ou:[],prop:[],longshot:[],ml_h1:[],spread_h1:[],ou_h1:[],ml_f5:[],spread_f5:[],ou_f5:[],yrfi:[],nrfi:[]};
   const tag = (arr, sp) => (arr||[]).map(b=>({...b, _sport:sp}));
   leagueSports.forEach(sp => {
     const odds = liveOdds[sp];
     if(!odds) return; // not loaded yet for this sport
     merged.ml.push(...tag(odds.ml||[], sp));
     merged.spread.push(...tag(odds.spread||[], sp));
     merged.ou.push(...tag(odds.ou||[], sp));
     merged.prop.push(...tag(odds.prop||[], sp));
     merged.longshot.push(...tag(odds.longshot||[], sp));
     PERIOD_CATS.forEach(c=>{ merged[c].push(...tag(odds[c]||[], sp)); });
   });
   return merged;
 })();
 const isLiveOdds = leagueSports.some(sp => !!liveOdds[sp]);

 const [picks, setPicks] = useState({ml:null,prop:null,ou:null,spread:null});
 const [lsBets, setLsBets] = useState([]);

 // Flex multiplier system — 5 picks, user assigns mult 1-5, one must be parlay
 const EMPTY_FLEX = [
 {id:0, bet:null, mult:null, isParlay:false, parlayLegs:[]},
 {id:1, bet:null, mult:null, isParlay:false, parlayLegs:[]},
 {id:2, bet:null, mult:null, isParlay:false, parlayLegs:[]},
 {id:3, bet:null, mult:null, isParlay:false, parlayLegs:[]},
 {id:4, bet:null, mult:null, isParlay:false, parlayLegs:[]},
 ];
 const [flexPicks, setFlexPicks] = useState(EMPTY_FLEX);
 const [soloFlexPicks, setSoloFlexPicks] = useState(EMPTY_FLEX);
 const [soloFreePicks, setSoloFreePicks] = useState([]); // freeform solo slate (variable count)
 const [freeCat, setFreeCat] = useState("all");
 const parseSlotConfig=(raw)=>{ try{ const a=typeof raw==="string"?JSON.parse(raw):raw; return (Array.isArray(a)&&a.length)?a:null; }catch(e){ return null; } };
 const freshSlots=()=>{ const cfg = !isSoloMode ? parseSlotConfig(activeLeague&&activeLeague.slot_config) : null; return cfg ? cfg.map((c,i)=>({id:i,bet:null,mult:c.mult,category:c.type,market:c.market||null,isParlay:false,parlayLegs:[],locked:true})) : EMPTY_FLEX.map(s=>({...s})); };
 useEffect(()=>{ if(isSoloMode) return; setFlexPicks(freshSlots()); }, [activeLeagueId, isSoloMode, activeLeague&&activeLeague.slot_config]);
 const [soloSavedPicks, setSoloSavedPicks] = useState(null);
 const [soloSubmitted, setSoloSubmitted] = useState(false);
 const [isPro, setIsPro] = useState(()=>{ try { return localStorage.getItem("picklock_is_pro")==="true"; } catch(e){ return false; } });
 const [showPaywall, setShowPaywall] = useState(null);
 const [checkoutLoading, setCheckoutLoading] = useState(null);
 const [showPostLeagueUpsell, setShowPostLeagueUpsell] = useState(false);
 const [activeFlexSlot, setActiveFlexSlot] = useState(null); // index of slot being edited
 const [flexCategory, setFlexCategory] = useState(null); // category being browsed
 const [longshotMode, setLongshotMode] = useState("straight"); // "straight" | "parlay" — for longshot sheet
 const [betTypeFilter, setBetTypeFilter] = useState("all"); // "all" | "ml" | "spread" | "ou"
 const [propTypeFilter, setPropTypeFilter] = useState("all"); // prop sub-category filter
 const [betSportFilter, setBetSportFilter] = useState("all"); // sport filter in multi-sport leagues
 // ─── GRID BET BROWSER state ───────────────────────────────────────
 const [gridSport, setGridSport] = useState(null);     // null = follow league default sport
 const [gridType, setGridType] = useState("ml");        // ml | spread | ou | prop | longshot
 const [gridPropSub, setGridPropSub] = useState("all"); // prop sub-category filter
 const [gridTargetSlot, setGridTargetSlot] = useState(null); // which flex slot a tapped card fills
 const [gridSearch, setGridSearch] = useState("");
 const [sheetExpanded, setSheetExpanded] = useState(null); // line-sheet expanded game key
 const [lineMoves, setLineMoves] = useState({}); // opening line per sel_key (from /api/linemoves)
 const lineMovesRef = useRef("");
 useEffect(()=>{
 if(screen!=="browser") return;
 const ids=[...new Set((BETS.ml||[]).map(b=>b.eventId).filter(Boolean))].slice(0,40);
 if(!ids.length) return;
 const sig=ids.join(",");
 if(sig===lineMovesRef.current) return;
 lineMovesRef.current=sig;
 (async()=>{ try{ const r=await fetch(`/api/linemoves?events=${encodeURIComponent(sig)}`); if(r.ok){ const d=await r.json(); setLineMoves(d.moves||{}); } }catch(e){} })();
 }, [screen, BETS]);
 const [showSwitcher, setShowSwitcher] = useState(false);
 const [showMultPick, setShowMultPick] = useState(false); // bet-browser slot/multiplier picker
 const [gridFlexMult, setGridFlexMult] = useState(null); // flex leagues: multiplier-first picking
 const [gridParlayMult, setGridParlayMult] = useState(5); // flex: which multiplier is the parlay
 const [gridBuildMode, setGridBuildMode] = useState(false); // flex: building parlay legs in the browser
 useEffect(()=>{
 if(screen!=="browser"||isSoloMode){ if(gridBuildMode) setGridBuildMode(false); return; }
 const _cfg = parseSlotConfig(activeLeague&&activeLeague.slot_config);
 if(_cfg) return; // custom-slot leagues use the slot picker, not mult-first
 // keep the parlay multiplier in sync with an existing parlay slot
 const par = (flexPicks||[]).find(p=>p.isParlay && p.mult!=null);
 if(par && par.mult!==gridParlayMult) setGridParlayMult(par.mult);
 // default the single-target multiplier to the lowest open one that ISN'T the parlay
 const used = (flexPicks||[]).filter(p=>p.mult!=null).map(p=>p.mult);
 if(gridFlexMult===null || gridFlexMult===gridParlayMult || used.includes(gridFlexMult)){
 const nm=[1,2,3,4,5].find(m=>m!==gridParlayMult && !used.includes(m));
 setGridFlexMult(nm!=null?nm:([1,2,3,4,5].find(m=>m!==gridParlayMult)||1));
 }
 }, [screen, isSoloMode, activeLeagueId, flexPicks, gridFlexMult, gridParlayMult, gridBuildMode]);
 const [showAccountMenu, setShowAccountMenu] = useState(false);
 const [unreadByLeague, setUnreadByLeague] = useState({});
 const markLeagueRead = async (lid)=>{
   if(!lid || isSoloMode || !(user&&user.id)) return;
   try{ await supabase.from("chat_reads").upsert({user_id:user.id, league_id:lid, last_read_at:new Date().toISOString()},{onConflict:"user_id,league_id"}); }catch(e){}
 };
 const fetchUnreadAll = async ()=>{
   if(isSoloMode || !(user&&user.id) || realLeagues.length===0){ setUnreadByLeague({}); return; }
   try{
     const ids = realLeagues.map(l=>l.id);
     const {data:reads} = await supabase.from("chat_reads").select("league_id,last_read_at").eq("user_id",user.id).in("league_id",ids);
     const readMap={}; (reads||[]).forEach(r=>{ readMap[r.league_id]=r.last_read_at; });
     // First time we see a league (migration / freshly joined): baseline to now so the
     // user doesn't get flooded with the entire backlog as "unread".
     const missing = ids.filter(id=>!(id in readMap));
     if(missing.length){
       const nowIso=new Date().toISOString();
       try{ await supabase.from("chat_reads").upsert(missing.map(id=>({user_id:user.id,league_id:id,last_read_at:nowIso})),{onConflict:"user_id,league_id"}); }catch(e){}
       missing.forEach(id=>{ readMap[id]=nowIso; });
     }
     const entries = await Promise.all(ids.map(async (lid)=>{
       try{ const {count}=await supabase.from("league_messages").select("id",{count:"exact",head:true}).eq("league_id",lid).gt("created_at",readMap[lid]||"1970-01-01T00:00:00Z").neq("user_id",user.id); return [lid,count||0]; }
       catch(e){ return [lid,0]; }
     }));
     const map={}; entries.forEach(([lid,c])=>{ map[lid]=c; });
     setUnreadByLeague(map);
   }catch(e){}
 };
 // Mark the open league read (on enter + as new messages arrive while viewing)
 useEffect(()=>{ if(screen==="chat"&&activeLeagueId&&!isSoloMode){ markLeagueRead(activeLeagueId); setUnreadByLeague(prev=>({...prev,[activeLeagueId]:0})); } },[screen,activeLeagueId,isSoloMode,messages.length]);
 // Refresh per-league unread off the chat screen, on league/screen change
 useEffect(()=>{ if(screen!=="chat"&&!isSoloMode) fetchUnreadAll(); },[activeLeagueId,screen,isSoloMode,realLeagues]);
 // Refresh on app focus + a slow poll while active
 useEffect(()=>{
   if(isSoloMode) return;
   const onVis=()=>{ if(document.visibilityState==="visible"&&screen!=="chat") fetchUnreadAll(); };
   document.addEventListener("visibilitychange",onVis);
   const iv=setInterval(()=>{ if(document.visibilityState==="visible"&&screen!=="chat") fetchUnreadAll(); },30000);
   return ()=>{ document.removeEventListener("visibilitychange",onVis); clearInterval(iv); };
 },[isSoloMode,screen,realLeagues,user]);
 const [notifs, setNotifs] = useState([]);
 const [notifUnread, setNotifUnread] = useState(0);
 const [showNotifs, setShowNotifs] = useState(false);
 const [lockRitual, setLockRitual] = useState(false);
 useEffect(()=>{ if(lockRitual){ const _t=setTimeout(()=>setLockRitual(false),1700); return ()=>clearTimeout(_t); } },[lockRitual]);
 const [celebrate, setCelebrate] = useState(false);
 const notifSeen = useRef(null);
 const fireCelebration = ()=>{ setCelebrate(true); try{ if(navigator.vibrate) navigator.vibrate([0,40,30,40]); }catch(e){} setTimeout(()=>setCelebrate(false),2700); };
 const fetchNotifs = async ()=>{
   if(!(user&&user.id)){ setNotifs([]); setNotifUnread(0); return; }
   try{
     const {data} = await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
     setNotifs(data||[]);
     setNotifUnread((data||[]).filter(n=>!n.read_at).length);
     const _ids = new Set((data||[]).map(n=>n.id));
     if(notifSeen.current===null){ notifSeen.current=_ids; }
     else { const fresh=(data||[]).filter(n=>n.type==="pick_win"&&!notifSeen.current.has(n.id)); notifSeen.current=_ids; if(fresh.length>0) fireCelebration(); }
   }catch(e){}
 };
 const openNotifs = async ()=>{
   setShowNotifs(true);
   if(!(user&&user.id)) return;
   const nowIso=new Date().toISOString();
   try{ await supabase.from("notifications").update({read_at:nowIso}).eq("user_id",user.id).is("read_at",null); }catch(e){}
   setNotifs(prev=>prev.map(n=>n.read_at?n:{...n,read_at:nowIso}));
   setNotifUnread(0);
 };
 const openLeagueRecap = async (lgArg)=>{
   try{
     const lg = lgArg || activeLeague; if(!lg||!lg.id) return;
     setLeagueRecapLoading(true);
     const { data:members } = await supabase.from("league_members").select("user_id").eq("league_id", lg.id);
     const ids = (members||[]).map(m=>m.user_id);
     const { data:us } = await supabase.from("users").select("id,username,email").in("id", ids.length?ids:["00000000-0000-0000-0000-000000000000"]);
     const nameOf = (id)=>{ const u=(us||[]).find(z=>z.id===id); return (u&&u.username) || ((u&&u.email)||"").split("@")[0] || "Player"; };
     const { data:picks } = await supabase.from("picks").select("user_id,week,result,points_earned").eq("league_id", lg.id).neq("result","pending");
     if(!picks||!picks.length){ setLeagueRecapLoading(false); return; }
     const { data:mus } = await supabase.from("matchups").select("user1_id,user2_id,winner_id,week").eq("league_id", lg.id);
     const muByWeek = {}; (mus||[]).forEach(m=>{ const wk=m.week||0; (muByWeek[wk]=muByWeek[wk]||[]).push(m); });
     const weeks = [...new Set(picks.map(p=>p.week||0))].filter(w=>w>0).sort((a,b)=>a-b);
     if(!weeks.length){ setLeagueRecapLoading(false); return; }
     const byWeek = {};
     weeks.forEach(week=>{
       const wkPicks = picks.filter(p=>(p.week||0)===week);
       const byUser = {};
       wkPicks.forEach(p=>{ const b=byUser[p.user_id]||(byUser[p.user_id]={pts:0,w:0,l:0,n:0}); b.n++; if(p.result==="W"){ b.w++; b.pts+=parseFloat(p.points_earned||0); } else if(p.result==="L"){ b.l++; } });
       const rows = Object.keys(byUser).map(id=>({ userId:id, name:nameOf(id), pts:parseFloat(byUser[id].pts.toFixed(1)), w:byUser[id].w, l:byUser[id].l, picks:byUser[id].n, isYou:id===(user&&user.id) })).sort((a,b)=>b.pts-a.pts);
       const ptsOf = (id)=> (byUser[id]? parseFloat(byUser[id].pts.toFixed(1)) : 0);
       const matchups = (muByWeek[week]||[]).map(m=>{
         const aId=m.user1_id, bId=m.user2_id, aPts=ptsOf(aId), bPts=ptsOf(bId);
         let winId=m.winner_id; if(!winId){ winId = aPts===bPts ? null : (aPts>bPts?aId:bId); }
         return { aId, bId, aName:nameOf(aId), bName:nameOf(bId), aPts, bPts, winId, youA:aId===(user&&user.id), youB:bId===(user&&user.id) };
       });
       const correct = wkPicks.filter(p=>p.result==="W").length;
       byWeek[week] = { week, rows, winner: rows[0], matchups, hitPct: wkPicks.length?Math.round(correct/wkPicks.length*100):0, totalPicks: wkPicks.length };
     });
     setLeagueRecap({ leagueName: lg.name||"League", weeks, byWeek });
     setLeagueRecapLoading(false);
   }catch(e){ setLeagueRecapLoading(false); }
 };
 useEffect(()=>{
   let alive=true;
   (async()=>{
     try{
       if(isSoloMode||!user||!user.id||!activeLeague||!activeLeague.id||activeLeague.id==="solo"){ if(alive) setStrayPicks([]); return; }
       const ts=activeLeague.target_size||activeLeague.max_members||8;
       if(!(leagueMembers.length>0 && leagueMembers.length<ts)){ if(alive) setStrayPicks([]); return; }
       const { data } = await supabase.from("picks").select("id,pick_name,result,game").eq("league_id",activeLeague.id).eq("user_id",user.id);
       if(alive) setStrayPicks(data||[]);
     }catch(e){ if(alive) setStrayPicks([]); }
   })();
   return ()=>{ alive=false; };
 }, [activeLeagueId, isSoloMode, leagueMembers.length, user]);
 const clearStrayPicks = async ()=>{
   try{
     const ids=(strayPicks||[]).map(p=>p.id).filter(Boolean);
     if(ids.length) await supabase.from("picks").delete().in("id", ids);
   }catch(e){}
   setStrayPicks([]);
 };
 const openRecapFromNotif = async (n)=>{
   try{
     const week = n.data && n.data.week, lid = n.data && n.data.league_id;
     if(!week || !lid || !(user&&user.id)) return;
     const { data:wk } = await supabase.from("picks").select("*").eq("league_id",lid).eq("user_id",user.id).eq("week",week).in("result",["W","L"]);
     const arr = wk||[];
     const wins = arr.filter(p=>p.result==="W").length, losses = arr.filter(p=>p.result==="L").length;
     const pts = arr.reduce((a,p)=>a+(parseFloat(p.points_earned)||0),0);
     setRecapPicks(arr);
     // For head-to-head leagues, pull the opponent so the recap shows the real matchup verdict.
     let oppName = null, oppPts = 0, won = wins>losses;
     try{
       const lg = realLeagues.find(l=>l.id===lid);
       if(lg && lg.league_type==="h2h"){
         const { data:mus } = await supabase.from("matchups").select("*").eq("league_id",lid).eq("week",week).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
         const mu = (mus||[])[0];
         if(mu){
           const oppId = mu.user1_id===user.id ? mu.user2_id : mu.user1_id;
           if(oppId){
             const { data:op } = await supabase.from("picks").select("points_earned,result").eq("league_id",lid).eq("user_id",oppId).eq("week",week).in("result",["W","L"]);
             oppPts = (op||[]).reduce((a,pp)=>a+(parseFloat(pp.points_earned)||0),0);
             const mem = leagueMembers.find(x=>x.userId===oppId);
             if(mem){ oppName = mem.name; }
             else { const { data:u } = await supabase.from("users").select("username,email").eq("id",oppId).maybeSingle(); oppName = (u&&(u.username||(u.email||"").split("@")[0]))||"Opponent"; }
             won = pts > oppPts;
           }
         }
       }
     }catch(e){}
     setWeekResult({ week, myPts: parseFloat(pts.toFixed(1)), oppPts: parseFloat(oppPts.toFixed(1)), oppName, won });
   }catch(e){}
 };
 const handleNotifTap = (n)=>{
   setShowNotifs(false);
   const lid = n.data && n.data.league_id;
   if(lid && realLeagues.some(l=>l.id===lid)) setActiveLeagueId(lid);
   if(n.type==="pick_win"||n.type==="pick_loss") setScreen("picks");
   else if(n.type==="week_recap") openRecapFromNotif(n);
   else if(n.type==="plok_call"){ if(isPro){ setAiReturn(screen); setScreen("ai"); } else { setShowPaywall("ai"); } }
   else if(n.type==="league_recap_share"){ const _lg=(realLeagues||[]).find(l=>l.id===(n.data&&n.data.league_id)); if(_lg){ setActiveLeagueId(_lg.id); openLeagueRecap(_lg); } }
 };
 useEffect(()=>{
   if(!(user&&user.id)) return;
   fetchNotifs();
   const onVis=()=>{ if(document.visibilityState==="visible") fetchNotifs(); };
   document.addEventListener("visibilitychange",onVis);
   const iv=setInterval(()=>{ if(document.visibilityState==="visible") fetchNotifs(); },30000);
   return ()=>{ document.removeEventListener("visibilitychange",onVis); clearInterval(iv); };
 },[user]);
 useEffect(()=>{ if(screen!=="browser"||isSoloMode) return; const _cfg=parseSlotConfig(activeLeague&&activeLeague.slot_config); if(!_cfg) return; const _allowed=[...new Set(_cfg.map(s=>s.type))]; const _ts=flexPicks[gridTargetSlot]; const _tgt=(gridTargetSlot!=null&&_ts&&_ts.locked)?_ts.category:null; const _want=_tgt||(_allowed.includes(gridType)?gridType:_allowed[0]); if(_want&&_want!==gridType) setGridType(_want); const _mkt=(gridTargetSlot!=null&&_ts&&_ts.locked&&_ts.category==="prop")?(_ts.market||"all"):null; if(_mkt!==null) setGridPropSub(_mkt); }, [screen, gridTargetSlot, activeLeagueId, gridType]);

 // When a custom league has period slots, lazily pull their odds for the slate's games.
 useEffect(()=>{
 if(isSoloMode) return;
 const cfg = parseSlotConfig(activeLeague&&activeLeague.slot_config);
 if(!cfg) return;
 const periodTypes = [...new Set(cfg.map(x=>x.type).filter(t=>PERIOD_MARKETS[t]))];
 if(!periodTypes.length) return;
 const sp = activeLeague.sport;
 const base = liveOdds[sp];
 if(!base || !base.ml || !base.ml.length) return; // wait for base odds (carries event IDs)
 if(periodTypes.every(t=>Array.isArray(base[t]))) return; // already attempted
 const eventIds = [...new Set(base.ml.map(b=>b.eventId).filter(Boolean))].slice(0,30);
 if(eventIds.length) fetchPeriodOdds(sp, eventIds, periodTypes);
 }, [activeLeagueId, isSoloMode, liveOdds, activeLeague&&activeLeague.slot_config]);

 // All-user solo percentile for the share card ("Top X%"). Calls an optional Supabase
 // RPC (solo_top_pct); if it isn't created yet this just no-ops and the badge stays hidden.
 useEffect(()=>{
 if(!user||!user.id) return;
 if(homeMode!=="solo" && !isSoloMode) return;
 let alive=true;
 (async()=>{ try{ const {data,error}=await supabase.rpc("solo_top_pct",{uid:user.id}); if(!error && alive && typeof data==="number") setSoloTopPct(data); }catch(e){} })();
 return ()=>{ alive=false; };
 }, [user, homeMode, isSoloMode, soloWeeks.length]);
 const [gridJustAdded, setGridJustAdded] = useState(null);   // bet id flashing "added" feedback
 // usedMults / availableMults / hasLongshot / allFlexFilled are derived inside the picks IIFE
 // so they always read from the correct activePicks (solo vs league). Do NOT compute them here.
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
 // hasLongshot / hasParlay / allFlexFilled computed inside picks IIFE from activePicks
 const ALL_BETS = [
 ...BETS.ml.map(b=>({...b, category:"ml", categoryLabel:"Moneyline", categoryColor:IOS.blue})),
 ...BETS.prop.map(b=>({...b, category:"prop", categoryLabel:"Prop", categoryColor:IOS.yellow})),
 ...BETS.ou.map(b=>({...b, category:"ou", categoryLabel:"Over/Under", categoryColor:IOS.orange})),
 ...BETS.spread.map(b=>({...b, category:"spread", categoryLabel:"Spread", categoryColor:IOS.green})),
 ...BETS.longshot.map(b=>({...b, category:"longshot", categoryLabel:"Parlay Leg", categoryColor:IOS.pink})),
 ];

 // ─── AI INSIGHT (Ask AI) ──────────────────────────────────────────
  const [aiThread, setAiThread] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReturn, setAiReturn] = useState("home");
  const [plokRecord, setPlokRecord] = useState(null);
  const [plokPersona, setPlokPersona] = useState(null);
  const PLOK_PERSONAS = [
    { key:null, name:"Balanced" },
    { key:"sharp", name:"The Sharp" },
    { key:"degen", name:"The Degen" },
    { key:"contrarian", name:"The Contrarian" },
    { key:"professor", name:"The Professor" },
  ];
  const [plokBuild, setPlokBuild] = useState(null);
  const [plokBuilding, setPlokBuilding] = useState(false);
  const [plokSlate, setPlokSlate] = useState(null);   // freeform solo: {strategy,picks,reasons} | {error}
  const [plokSlateBusy, setPlokSlateBusy] = useState(false);
  const aiSuggestions = aiInput.trim().length>=2
    ? ALL_BETS.filter(b => ((b.pick||"")+" "+(b.game||"")).toLowerCase().includes(aiInput.trim().toLowerCase())).slice(0,6)
    : [];
  const SLOT_OF = { ml:"ml", moneyline:"ml", spread:"spread", ou:"ou", total:"ou", prop:"prop", longshot:"longshot", parlay:"longshot" };
  const plokUserStats = () => {
    const a = allMyStats; if(!a || !a.total) return null;
    return {
      archetype: (a.personality||"").replace(/^The /,""),
      record: `${a.wins}-${a.losses}`,
      winRate: a.winRate,
      streak: (a.currentStreak && a.currentStreak.count) ? `${a.currentStreak.type}${a.currentStreak.count}` : null,
      byType: a.byType ? Object.fromEntries(Object.entries(a.byType).filter(([k,v])=>(v.wins+v.losses)>0).map(([k,v])=>[k, {record:`${v.wins}-${v.losses}`, pct:v.pct}])) : {},
    };
  };
  const plokUserSlot = (category) => {
    const a = allMyStats; if(!a || !a.byType) return null;
    const key = SLOT_OF[(category||"").toLowerCase()] || category;
    const v = a.byType[key]; if(!v || (v.wins+v.losses)<3) return null;
    return { label: v.label || key, record:`${v.wins}-${v.losses}`, pct: v.pct };
  };
  const plokLeagueCtx = () => {
    try{
      if(isSoloMode) return null;
      const lg = activeLeague; if(!lg || !lg.id) return null;
      const fmt = lg.league_type || "points";
      const standings = realStandings || [];
      const idx = standings.findIndex(z=>z.isYou);
      const me = idx>=0 ? standings[idx] : null;
      const total = standings.length;
      const out = { format: fmt, week: lg.current_week||1, players: total||null };
      if(me){
        out.myRank = me.rank;
        const leader = standings[0];
        if(leader){ if(leader.isYou) out.leading = true; else out.leaderGap = parseFloat((Number(leader.points||0) - Number(me.points||0)).toFixed(1)); }
        if(idx>0) out.aboveGap = parseFloat((Number(standings[idx-1].points||0) - Number(me.points||0)).toFixed(1));
        if(idx>=0 && idx<total-1) out.belowGap = parseFloat((Number(me.points||0) - Number(standings[idx+1].points||0)).toFixed(1));
      }
      if(lg.season_weeks){ out.weeksLeft = Math.max(0, Number(lg.season_weeks) - (lg.current_week||1)); out.finalWeek = (lg.current_week||1) >= Number(lg.season_weeks); }
      if(fmt==="h2h"){
        const cw = lg.current_week||1;
        const wk = (liveSchedule||[]).find(w=>w.week===cw);
        if(wk){
          out.opponent = wk.opp || null;
          const myWk = (weekPicks||[]).filter(pp=>pp.user_id===(user&&user.id)).reduce((sm,pp)=>sm+parseFloat(pp.points_earned||0),0);
          const oppWk = Number(wk.oppPts||0);
          out.myWeekPts = parseFloat(myWk.toFixed(1));
          out.oppWeekPts = parseFloat(oppWk.toFixed(1));
          out.matchupGap = parseFloat((myWk - oppWk).toFixed(1));
        }
      }
      return out;
    }catch(e){ return null; }
  };
  const buildBetCtx = (bet, category) => ({
    sport: bet._sport || leagueSports[0] || "nfl",
    betType: category,
    selection: bet.pick,
    game: bet.game,
    odds: bet.odds,
    userId: user?.id,
    userStats: plokUserStats(),
    userSlot: plokUserSlot(category),
    persona: plokPersona,
    leagueCtx: plokLeagueCtx(),
  });
  const buildPlokSlip = async () => {
    if(!isPro){ setShowPaywall("ai"); return; }
    if(plokBuilding) return;
    const baseSlots = freshSlots();
    const hasCfg = baseSlots.every(sl=>sl.category);
    const slotSpec = hasCfg
      ? baseSlots.map((sl,i)=>({idx:i, category:sl.category, mult: sl.mult||null}))
      : [{idx:0,category:"ml",mult:null},{idx:1,category:"spread",mult:null},{idx:2,category:"ou",mult:null},{idx:3,category:"prop",mult:null},{idx:4,category:"longshot",mult:null}];
    const neededCats = [...new Set(slotSpec.map(z=>z.category))];
    const candidates = {}; let missing = false;
    neededCats.forEach(cat=>{
      const list = (ALL_BETS||[]).filter(b=>b.category===cat).slice(0,6).map(b=>({id:b.id, pick:b.pick, odds:b.odds, game:b.game}));
      if(!list.length) missing = true;
      candidates[cat] = list;
    });
    if(missing){ setPlokBuild({error:"Odds are still loading for this slate — try again in a moment."}); return; }
    const L = plokLeagueCtx();
    let strategy = "balanced";
    if(L){ if((L.matchupGap!=null&&L.matchupGap<0)||(L.finalWeek&&L.leaderGap!=null&&L.leaderGap>0)) strategy="ceiling"; else if((L.matchupGap!=null&&L.matchupGap>0)||L.leading) strategy="protect"; }
    setPlokBuilding(true); setPlokBuild(null);
    try{
      const r = await fetch("/api/buildslip", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ sport:(leagueSports[0]||"nfl"), userId:user?.id, persona:plokPersona, userStats:plokUserStats(), leagueCtx:L, strategy, slots:slotSpec, candidates })});
      const data = await r.json();
      if(!r.ok){ setPlokBuild({error:data.error||"Couldn't build a slip — try again."}); return; }
      const byId = {}; (ALL_BETS||[]).forEach(b=>{ byId[b.id]=b; });
      const flex = baseSlots.map(sl=>({...sl}));
      (data.picks||[]).forEach(pk=>{
        const idx = pk.idx; if(idx==null || !flex[idx]) return;
        const cat = slotSpec[idx]?.category;
        const mult = (slotSpec[idx]?.mult) || pk.mult || (idx+1);
        if(cat==="longshot"){
          const legs = (pk.ids||[]).map(id=>byId[id]).filter(Boolean).map(b=>({id:b.id,pick:b.pick,game:b.game||"",odds:b.odds,impliedOdds:b.impliedOdds}));
          if(legs.length>=2) flex[idx] = {...flex[idx], bet:null, isParlay:true, parlayLegs:legs, category:"longshot", mult, _reason:pk.reason};
        } else {
          const b = byId[(pk.ids||[])[0]];
          if(b) flex[idx] = {...flex[idx], bet:b, isParlay:false, parlayLegs:[], category:cat, mult, _reason:pk.reason};
        }
      });
      if(!hasCfg){
        const order = flex.map((sl,i)=>i).filter(i=> flex[i].bet || flex[i].isParlay);
        order.sort((a,b)=> (flex[b].mult||0)-(flex[a].mult||0));
        order.forEach((i,rank)=>{ flex[i] = {...flex[i], mult: 5-rank}; });
      }
      const CATMETA = { ml:{label:"Moneyline",color:IOS.blue}, spread:{label:"Spread",color:IOS.green}, ou:{label:"Over/Under",color:IOS.orange}, prop:{label:"Prop",color:IOS.yellow}, longshot:{label:"Parlay",color:IOS.pink} };
      const items = flex.map(sl=>({ filled: !!(sl.bet||sl.isParlay), meta: CATMETA[sl.category]||{label:sl.category,color:IOS.blue}, mult: sl.mult, reason: sl._reason||"", name: sl.isParlay ? sl.parlayLegs.map(l=>l.pick).join(" + ") : (sl.bet?.pick||"—"), odds: sl.isParlay ? "" : (sl.bet?.odds||"") }))
        .filter(it=>it.filled).sort((a,b)=> (b.mult||0)-(a.mult||0));
      const cleanFlex = flex.map(sl=>{ const c={...sl}; delete c._reason; return c; });
      if(!items.length){ setPlokBuild({error:"Plok couldn't fill the slip from this slate — try again."}); return; }
      setPlokBuild({ strategy: data.strategy, items, flex: cleanFlex });
    }catch(e){ setPlokBuild({error:"Network error — try again."}); }
    finally{ setPlokBuilding(false); }
  };
  const applyPlokSlip = () => {
    if(!plokBuild || !plokBuild.flex) return;
    if(isSoloMode) setSoloFlexPicks(plokBuild.flex); else setFlexPicks(plokBuild.flex);
    setPlokBuild(null);
    setScreen("picks");
  };
  // PLOK builds a freeform solo slate: reuse the buildslip engine, then flatten
  // the chosen bets into a flat list (no mults / no forced parlay).
  const buildPlokSlate = async () => {
    if(!isPro){ setShowPaywall("ai"); return; }
    if(plokSlateBusy) return;
    const cats = ["ml","spread","ou","prop","longshot"];
    const candidates = {}; let any=false;
    cats.forEach(cat=>{
      const list = (ALL_BETS||[]).filter(b=>b.category===cat).slice(0,6).map(b=>({id:b.id,pick:b.pick,odds:b.odds,game:b.game}));
      if(list.length) any=true;
      if(list.length) candidates[cat]=list;
    });
    if(!any){ setPlokSlate({error:"Odds are still loading for this slate — try again in a moment."}); return; }
    const slots = Object.keys(candidates).map((c,i)=>({idx:i,category:c,mult:null}));
    setPlokSlateBusy(true); setPlokSlate(null);
    try{
      const r = await fetch("/api/buildslip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ sport:soloSport, userId:user?.id, persona:plokPersona, userStats:plokUserStats(), leagueCtx:null, strategy:"balanced", slots, candidates })});
      const data = await r.json();
      if(!r.ok){ setPlokSlate({error:data.error||"Couldn't build a slate — try again."}); return; }
      const byId={}; (ALL_BETS||[]).forEach(b=>{byId[b.id]=b;});
      const picks=[]; const reasons={};
      (data.picks||[]).forEach(pk=>{
        (pk.ids||[]).forEach(id=>{ const b=byId[id]; if(b && !picks.some(x=>x.id===b.id)){ picks.push(b); reasons[b.id]=pk.reason; } });
      });
      if(!picks.length){ setPlokSlate({error:"Plok couldn't fill a slate from this board — try again."}); return; }
      setPlokSlate({ strategy:data.strategy, picks, reasons });
    }catch(e){ setPlokSlate({error:"Network error — try again."}); }
    finally{ setPlokSlateBusy(false); }
  };
  const applyPlokSlate = () => {
    if(!plokSlate || !plokSlate.picks) return;
    const merged=[...soloFreePicks];
    plokSlate.picks.forEach(b=>{ if(merged.length<12 && !merged.some(x=>x.id===b.id)) merged.push(b); });
    setSoloFreePicks(merged);
    setPlokSlate(null);
  };
  const aiAddToSlip = (bet, category) => {
    const picks = isSoloMode ? soloFlexPicks : flexPicks;
    const setPicks = isSoloMode ? setSoloFlexPicks : setFlexPicks;
    let dest = picks.findIndex(pp=>!pp.isParlay && pp.bet===null && (!pp.locked || pp.category===category));
    if(dest===-1) dest = picks.findIndex(pp=>!pp.isParlay && pp.bet!==null && pp.category===category);
    if(dest===-1) return false;
    setPicks(prev=>prev.map((pp,i)=> i===dest ? {...pp, bet, category, isParlay:false, parlayLegs:[]} : pp));
    return true;
  };
  const fetchPlokRecord = async () => {
    if(!user?.id) return;
    try{
      const { data } = await supabase.from("plok_calls").select("*").eq("user_id",user.id).in("result",["W","L"]).order("created_at",{ascending:false});
      const arr = data||[];
      let w=0,l=0,units=0;
      arr.forEach(c=>{
        const o = parseFloat(String(c.odds||"").replace("+",""));
        const dec = !isNaN(o) ? (o>0?o/100+1:100/Math.abs(o)+1) : 2;
        if(c.result==="W"){ w++; units += (dec-1); } else { l++; units -= 1; }
      });
      setPlokRecord({ wins:w, losses:l, units:parseFloat(units.toFixed(1)), recent:arr.slice(0,5) });
    }catch(e){}
  };
  useEffect(()=>{ if(screen==="ai" && user?.id) fetchPlokRecord(); },[screen, user]);
  // Load Find-a-bet data once per game on open (Pro, cached) -> powers Plok Read + The Tape.
  useEffect(()=>{
    const eg = gameSheet && gameSheet.espnGame; const gid = eg && eg.id;
    if(!gid || !isPro) return;
    if(gameRead[gid]) return;
    const tg = (gameSheet && gameSheet.tickerGame) || {};
    const away = eg.awayTeam || tg.away || "Away", home = eg.homeTeam || tg.home || "Home";
    const sp = (activeLeague && activeLeague.sport) || "nfl";
    setGameRead(prev=>({...prev,[gid]:{loading:true}}));
    fetch("/api/findbet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ sport:sp, game:(away+" @ "+home), userId:user&&user.id })})
      .then(async r=>{ const d=await r.json().catch(()=>null); setGameRead(prev=>({...prev,[gid]: (r.ok && d) ? {data:d} : {error:true}})); })
      .catch(()=> setGameRead(prev=>({...prev,[gid]:{error:true}})));
  },[gameSheet, isPro]);
  const askInsight = async (ctx, label, bet, category) => {
    const item = { role:"ai", label: label||ctx.selection, bet:bet||null, category:category||null, loading:true };
    setAiThread(prev=>[...prev, { role:"user", text: label||ctx.selection }, item]);
    setAiBusy(true);
    try{
      const r = await fetch("/api/insight", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(ctx) });
      const data = await r.json();
      setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, data: r.ok?data:null, error: r.ok?null:(data.error||"Couldn't load insight")} : x));
      if(r.ok && data && (data.verdict==="strong"||data.verdict==="lean") && ctx.betType!=="chat" && ctx.game && user?.id){
        try{
          const { data:dup } = await supabase.from("plok_calls").select("id").eq("user_id",user.id).eq("selection",ctx.selection).eq("game",ctx.game).eq("result","pending").limit(1);
          if(!dup || !dup.length){
            await supabase.from("plok_calls").insert({ user_id:user.id, sport:ctx.sport, bet_type:ctx.betType, selection:ctx.selection, game:ctx.game, line:ctx.line!=null?String(ctx.line):null, odds:ctx.odds||null, conviction:data.conviction||null, verdict:data.verdict, game_date:(bet&&bet.gameTime)||null });
          }
        }catch(e){}
      }
    }catch(e){
      setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, error:"Network error — try again"} : x));
    }finally{ setAiBusy(false); }
  };
  const askFromBet = (bet, category) => {
    if(!isPro){ setShowPaywall("ai"); return; }
    setAiReturn(screen); setScreen("ai");
    askInsight(buildBetCtx(bet, category), bet.pick, bet, category);
  };
  const [findBetOpen, setFindBetOpen] = useState(false);
  const [plokModel, setPlokModel] = useState("ev");
  const [modelPicker, setModelPicker] = useState(false);
  const findBetGames = (() => {
    const seen = new Map();
    const findTime = (away, home) => {
      const tg = (tickerGames||[]).find(t => (t.away&&away&&(t.away.includes(away)||away.includes(t.away))) || (t.home&&home&&(t.home.includes(home)||home.includes(t.home))));
      return tg ? tg.time : null;
    };
    for (const b of ALL_BETS) {
      if (!b.game || seen.has(b.game)) continue;
      const sp = b._sport || leagueSports[0] || "nfl";
      const parts = String(b.game).split("@");
      const away = (parts[0]||"").trim(), home = (parts[1]||"").trim();
      seen.set(b.game, { game:b.game, sport:sp, away, home, time: findTime(away, home) });
    }
    return [...seen.values()];
  })();
  const findBetGroups = (() => {
    const m = {};
    findBetGames.forEach(g=>{ (m[g.sport]=m[g.sport]||[]).push(g); });
    const sortT = (a,b)=>{ const ta=a.time?new Date(a.time).getTime():Infinity, tb=b.time?new Date(b.time).getTime():Infinity; return ta-tb; };
    return Object.keys(m).sort().map(sp=>({ sport:sp, games:m[sp].slice().sort(sortT) }));
  })();
  const askFindBet = (g) => {
    if(!isPro){ setShowPaywall("ai"); return; }
    setFindBetOpen(false);
    setAiReturn(screen); setScreen("ai");
    const _m = PLOK_MODELS.find(x=>x.id===plokModel) || PLOK_MODELS[0];
    const label = `${_m.name} · ${g.game}`;
    const item = { role:"ai", label, bet:null, category:null, loading:true };
    setAiThread(prev=>[...prev, { role:"user", text:`${_m.name} — ${g.game}` }, item]);
    setAiBusy(true);
    fetch(plokModel==="trends"?"/api/trends":"/api/findbet", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ sport:g.sport, game:g.game, userId:user?.id, model:plokModel }) })
      .then(async r=>{ const data=await r.json(); setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, data:r.ok?data:null, error:r.ok?null:(data.error||"Couldn't screen this game")} : x)); })
      .catch(()=> setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, error:"Network error — try again"} : x)))
      .finally(()=> setAiBusy(false));
  };
  const askPlok = (text) => {
    const q = (text||"").trim(); if(!q) return;
    if(!isPro){ setShowPaywall("ai"); return; }
    setAiReturn(screen); setScreen("ai");
    const item = { role:"ai", label:"Plok", bet:null, category:null, loading:true };
    setAiThread(prev=>[...prev, { role:"user", text:q }, item]);
    setAiBusy(true);
    fetch("/api/insight", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ sport:(leagueSports[0]||"nfl"), betType:"chat", selection:q, question:q, userId:user?.id, userStats:plokUserStats(), persona:plokPersona, leagueCtx:plokLeagueCtx() }) })
      .then(async r=>{ const data=await r.json(); setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, data:r.ok?data:null, error:r.ok?null:(data.error||"Couldn't reach Plok")} : x)); })
      .catch(()=> setAiThread(prev=>prev.map(x=> x===item ? {...x, loading:false, error:"Network error — try again"} : x)))
      .finally(()=> setAiBusy(false));
  };
  const sendAi = () => {
    const t = aiInput.trim(); if(!t || aiBusy) return;
    if(aiSuggestions.length>0){ const b=aiSuggestions[0]; setAiInput(""); askFromBet(b,b.category); }
    else { setAiInput(""); askPlok(t); }
  };
  useEffect(() => {
    const vv = window.visualViewport; if(!vv) return;
    const apply = () => {
      const kb = window.innerHeight - vv.height; // approximate keyboard height
      if (kb > 120) {
        document.body.style.height = vv.height + "px";
        document.body.style.transform = vv.offsetTop ? ("translateY(" + vv.offsetTop + "px)") : "none";
      } else {
        document.body.style.height = "";
        document.body.style.transform = "";
      }
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      document.body.style.height = ""; document.body.style.transform = "";
    };
  }, []);
  const renderAiItem = (item, i) => {
    if(item.role==="user"){
      return (<div key={i} style={{alignSelf:"flex-end",maxWidth:"82%",background:IOS.blue,color:"#fff",borderRadius:"14px 14px 4px 14px",padding:"8px 12px",fontSize:13,fontWeight:600,marginLeft:"auto"}}>{item.text}</div>);
    }
    return (<div key={i} style={{alignSelf:"flex-start",width:"100%",background:"linear-gradient(160deg,#16161B,#0C0C0F)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px 14px 14px 4px",padding:"13px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:"-0.2px",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</span>
      </div>
      {item.loading && (<div style={{fontSize:12.5,color:"rgba(255,255,255,0.5)",fontWeight:600}}>Analyzing the numbers…</div>)}
      {item.error && (<div style={{fontSize:12.5,color:IOS.red,fontWeight:600}}>{item.error}</div>)}
      {item.data && (<div>
        <div style={{fontSize:13,lineHeight:1.5,color:"rgba(255,255,255,0.86)",marginBottom:(item.data.keyStats&&item.data.keyStats.length)?11:8}}>{item.data.summary}</div>
        {item.data.keyStats && item.data.keyStats.length>0 && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
            {item.data.keyStats.slice(0,4).map((s,si)=>(
              <div key={si} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"8px 10px"}}>
                <div style={{fontSize:16,fontWeight:800,color:"#fff",lineHeight:1.1}}>{s.value}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {item.data.trends && item.data.trends.length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:11}}>
            {item.data.trends.map((tr,ti)=>(
              <div key={ti} style={{display:"flex",alignItems:"flex-start",gap:7,fontSize:12,color:"rgba(255,255,255,0.7)"}}>
                <span style={{flexShrink:0,marginTop:2,display:"inline-flex"}}>{tr.dir==="up"
                  ? <svg width="9" height="9" viewBox="0 0 10 10" fill={IOS.green}><path d="M5 1l4 8H1z"/></svg>
                  : <svg width="9" height="9" viewBox="0 0 10 10" fill={IOS.red}><path d="M5 9L1 1h8z"/></svg>}</span>
                <span style={{lineHeight:1.4}}>{tr.text}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{borderLeft:"3px solid "+IOS.green,paddingLeft:9,marginBottom:8}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.green,marginBottom:2}}>Bull case</div>
          <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.8)"}}>{item.data.bullCase}</div>
        </div>
        <div style={{borderLeft:"3px solid "+IOS.red,paddingLeft:9}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.red,marginBottom:2}}>Bear case</div>
          <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.8)"}}>{item.data.bearCase}</div>
        </div>
        {item.bet && (
          <button onClick={()=>{ if(aiAddToSlip(item.bet,item.category)){ setAiThread(prev=>prev.map(x=>x===item?{...x,added:true}:x)); } }} disabled={item.added}
            style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:item.added?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            background:item.added?"rgba(48,209,88,0.18)":IOS.blue,color:item.added?IOS.green:"#fff",fontSize:13,fontWeight:800}}>
            {item.added && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            {item.added?"Added to slip":"Add to slip"}
          </button>
        )}
      </div>)}
    </div>);
  };

  // Grading state — weekPicks per league, stored locally
 const [gradingData, setGradingData] = useState(() => {
 const init = {};
 LEAGUES_DATA.forEach(lg => { init[lg.id] = JSON.parse(JSON.stringify(lg.weekPicks||[])); });
 return init;
 });
 const currentWeekPicks = gradingData[activeLeagueId] || [];
 const [activeSlot, setActiveSlot] = useState(null);
 const [myPUs, setMyPUs] = useState([]); // loaded from league_power_ups table
 const [showPUModal, setShowPUModal] = useState(null); // {context:"picks"|"matchup", slotId, pickIdx}
 const [secondSwap, setSecondSwap] = useState(null); // {pick, category} — live Second Chance target
 const doSecondSwap = async (pick, bet) => {
   const puRow = myPUs.find(p=>p.id==="second");
   try {
     await supabase.from("picks").update({ pick_name: bet.pick, game: bet.game||"", odds: bet.odds, implied_odds: bet.impliedOdds, power_up_id: "second" }).eq("id", pick.id);
     if (puRow && puRow.dbId) await supabase.from("league_power_ups").update({used:true}).eq("id", puRow.dbId);
     setMyPUs(prev=>{ const i=prev.findIndex(x=>x.id==="second"); if(i<0) return prev; const n=[...prev]; n.splice(i,1); return n; });
     await fetchWeekPicks(activeLeague.id, activeLeague.current_week||activeLeague.week||1);
   } catch(e){ alert("Swap failed: "+(e.message||e)); }
   setSecondSwap(null);
 };
 const [activatedPUs,setActivatedPUs]= useState({}); // slotId -> pu applied on picks screen
 const [matchupPUs, setMatchupPUs] = useState({}); // pickIdx -> pu applied on live matchup
 const [profTab, setProfTab] = useState("stats");
 const [analyticsTab, setAnalyticsTab] = useState("Overview");
 const [puLeagueId, setPuLeagueId] = useState(null); // which league to view PUs for on profile
 const [puLeaguePUs, setPuLeaguePUs] = useState([]); // PUs for the viewed league
 const [puLeagueSpins, setPuLeagueSpins] = useState(0); // wheel spins for viewed league
 const [showWheel, setShowWheel] = useState(false);
 useEffect(()=>{
 const phone = document.querySelector('.phone');
 if(phone) phone.style.overflow = showWheel ? 'visible' : 'hidden';
 }, [showWheel]);
 const [spinning, setSpinning] = useState(false);
 const [wheelSpins, setWheelSpins] = useState(0); // earned by winning a week
 const [wheelAngle, setWheelAngle] = useState(0);
 const [wonPU, setWonPU] = useState(null);
 const [showWin, setShowWin] = useState(false);
 const [showTopScorer, setShowTopScorer] = useState(false);
 const [pickSearch, setPickSearch] = useState("");
 const [commishTab, setCommishTab] = useState("grade"); // grade | members | settings
 const [selectedGradeMember, setSelectedGradeMember] = useState(null); // userId of member being graded
 const [showLeaguesList, setShowLeaguesList] = useState(false);
 const [showNewLeague, setShowNewLeague] = useState(false);
 const [newLeagueSport, setNewLeagueSport] = useState(null); // kept for backwards compat
 const [newLeagueSports, setNewLeagueSports] = useState([]); // multi-sport array
 const toggleNewLeagueSport = (id) => {
 if(!isPro) {
 // Free: single sport only
 setNewLeagueSports(prev => prev.includes(id) ? [] : [id]);
 setNewLeagueSport(prev => prev === id ? null : id);
 } else {
 // Pro: toggle multi-select
 setNewLeagueSports(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev, id]);
 setNewLeagueSport(id); // track last selected as primary
 }
 };
 const [newLeagueName, setNewLeagueName] = useState("");
 const [newLeagueCreated, setNewLeagueCreated] = useState(null); // holds created league data for invite code screen
 const [newLeagueSize, setNewLeagueSize] = useState(8);
 const [newLeagueType, setNewLeagueType] = useState(null);
 const [showBrowse, setShowBrowse] = useState(false);
 const [publicLeagues, setPublicLeagues] = useState([]);
 const [browseFilter, setBrowseFilter] = useState({sport:"all", size:"all", type:"all"});
 const [browseLoading, setBrowseLoading] = useState(false);
 const [joiningLeagueId, setJoiningLeagueId] = useState(null); // 'h2h' | 'bracket' | 'points'
 const [newLeagueWeeks, setNewLeagueWeeks] = useState(18);
 const [newLeagueStep, setNewLeagueStep] = useState(0); // 0=type, 1=details
 const [newLeaguePrivacy, setNewLeaguePrivacy] = useState('private');
 const SLOT_TYPES=[
  {id:"ml",l:"Moneyline",scope:"Game line",color:"#0A84FF"},
  {id:"spread",l:"Spread",scope:"Game line",color:"#30D158"},
  {id:"ou",l:"Over / Under",scope:"Game line",color:"#FF9F0A"},
  {id:"prop",l:"Player Prop",scope:"Props",color:"#FFD60A"},
  {id:"longshot",l:"Longshot / Parlay",scope:"Exotic",color:"#FF375F"},
  {id:"ml_h1",l:"1st Half ML",scope:"1st Half",color:"#64D2FF",sports:["nfl","nba"]},
  {id:"spread_h1",l:"1st Half Spread",scope:"1st Half",color:"#64D2FF",sports:["nfl","nba"]},
  {id:"ou_h1",l:"1st Half O / U",scope:"1st Half",color:"#64D2FF",sports:["nfl","nba"]},
  {id:"ml_f5",l:"First 5 ML",scope:"First 5 innings",color:"#5E5CE6",sports:["mlb"]},
  {id:"spread_f5",l:"First 5 Spread",scope:"First 5 innings",color:"#5E5CE6",sports:["mlb"]},
  {id:"ou_f5",l:"First 5 O / U",scope:"First 5 innings",color:"#5E5CE6",sports:["mlb"]},
  {id:"yrfi",l:"YRFI",scope:"Yes Run 1st Inning",color:"#FF9F0A",sports:["mlb"]},
  {id:"nrfi",l:"NRFI",scope:"No Run 1st Inning",color:"#30D158",sports:["mlb"]},
 ];
 const PLOK_MODELS=[
  {id:"ev", name:"+EV Hunter", ready:true, color:IOS.green, desc:"De-vigs the market and flags where the best price beats the true line.", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>},
  {id:"livedog", name:"Live Dog", ready:true, color:IOS.orange, desc:"Hunts underdogs the model gives a better shot than the price implies.", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={IOS.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>},
  {id:"trends", name:"Trends & Form", ready:true, color:IOS.teal, desc:"Last-10 form, hot/cold streaks, home/road splits and situational edges.", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={IOS.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 4-5"/></svg>},
  {id:"projection", name:"The Projection", ready:true, color:IOS.blue, desc:"Projects the number from stats and shows it against the line.", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/></svg>},
  {id:"clv", name:"CLV Report Card", ready:false, color:IOS.purple, desc:"Did your locked picks beat the closing line? The pro's scorecard.", icon:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={IOS.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 13l-2 8 5-3 5 3-2-8"/></svg>},
 ];
 const PROP_SUBS_BY_SPORT = {
  nfl:[{id:"all",l:"All"},{id:"pass",l:"Pass"},{id:"rush",l:"Rush"},{id:"rec",l:"Receiving"},{id:"td",l:"TDs"}],
  nba:[{id:"all",l:"All"},{id:"pts",l:"Points"},{id:"reb",l:"Rebounds"},{id:"ast",l:"Assists"},{id:"3pt",l:"Threes"}],
  mlb:[{id:"all",l:"All"},{id:"k",l:"Strikeouts"},{id:"hits",l:"Hits"},{id:"hr",l:"Home Runs"},{id:"bases",l:"Bases"}],
 };
 const DEFAULT_SLOTS=[{type:"ml",mult:1},{type:"prop",mult:2},{type:"ou",mult:3},{type:"spread",mult:4},{type:"longshot",mult:5}];
 const LAYOUT_PRESETS=[
  {id:"classic", name:"Classic", desc:"The all-rounder — one of each, escalating multipliers.", slots:[{type:"ml",mult:1},{type:"spread",mult:2},{type:"ou",mult:3},{type:"prop",mult:4},{type:"longshot",mult:5}]},
  {id:"chalk", name:"Chalk", desc:"Pure game lines. No props, no parlays — just sides and totals.", slots:[{type:"ml",mult:1},{type:"spread",mult:2},{type:"ou",mult:3},{type:"ml",mult:4},{type:"spread",mult:5}]},
  {id:"props", name:"Prop Scramble", desc:"Five player props. Load up on HR, TD scorers, 3PM, goals — the splashy stuff.", slots:[{type:"prop",mult:1},{type:"prop",mult:2},{type:"prop",mult:3},{type:"prop",mult:4},{type:"prop",mult:5}]},
  {id:"longshot", name:"Longshot Lottery", desc:"Two safe props, then three swings at big-odds parlays and longshots.", slots:[{type:"prop",mult:1},{type:"prop",mult:2},{type:"longshot",mult:3},{type:"longshot",mult:4},{type:"longshot",mult:5}]},
  {id:"firsthalf", name:"First-Half Frenzy", desc:"1st-half lines, then a prop and a longshot to finish.", sports:["nfl","nba"], slots:[{type:"ml_h1",mult:1},{type:"spread_h1",mult:2},{type:"ou_h1",mult:3},{type:"prop",mult:4},{type:"longshot",mult:5}]},
  {id:"smallball", name:"Small Ball", desc:"A baseball special — first-5 innings, NRFI/YRFI, and a prop.", sports:["mlb"], slots:[{type:"nrfi",mult:1},{type:"yrfi",mult:2},{type:"ou_f5",mult:3},{type:"ml_f5",mult:4},{type:"prop",mult:5}]},
  {id:"endzone", name:"Find the End Zone", desc:"All scoring — TD scorers, receiving, rushing, passing yards.", sports:["nfl"], slots:[{type:"prop",mult:1,market:"td"},{type:"prop",mult:2,market:"td"},{type:"prop",mult:3,market:"rec"},{type:"prop",mult:4,market:"rush"},{type:"prop",mult:5,market:"pass"}]},
  {id:"buckets", name:"Bucket Getters", desc:"Points, threes, boards and dimes — a hooper's prop slate.", sports:["nba"], slots:[{type:"prop",mult:1,market:"pts"},{type:"prop",mult:2,market:"3pt"},{type:"prop",mult:3,market:"reb"},{type:"prop",mult:4,market:"ast"},{type:"prop",mult:5,market:"pts"}]},
  {id:"goingyard", name:"Going Yard", desc:"Home runs, hits, total bases and strikeouts — swing big.", sports:["mlb"], slots:[{type:"prop",mult:1,market:"hr"},{type:"prop",mult:2,market:"hr"},{type:"prop",mult:3,market:"hits"},{type:"prop",mult:4,market:"bases"},{type:"prop",mult:5,market:"k"}]},
 ];
 const [newLeagueSlots,setNewLeagueSlots]=useState([{type:"ml",mult:1},{type:"prop",mult:2},{type:"ou",mult:3},{type:"spread",mult:4},{type:"longshot",mult:5}]);
 const [presetSheet,setPresetSheet]=useState(false);
 const [marketSheet,setMarketSheet]=useState(null);
 const [slotSheetIdx,setSlotSheetIdx]=useState(null);
 const [advancingWeek, setAdvancingWeek] = useState(false);
 const [creatingLeague, setCreatingLeague] = useState(false);

 const shareInvite = async (code, leagueName) => {
 const text = `Join my PickLock league "${leagueName}"! Use invite code: ${code} `;
 if(navigator.share) {
 try { await navigator.share({ title: "Join my PickLock League", text }); return; } catch(e) {}
 }
 try { await navigator.clipboard.writeText(code); alert("Invite code copied! "); } catch(e) {
 alert(`Invite code: ${code}`);
 }
 };

 const createLeague = async (name, sportId) => {
 if(!user||!name||!sportId) return;
 setCreatingLeague(true);
 const inviteCode = Math.random().toString(36).substring(2,8).toUpperCase();
 const bracketWeeks = {4:2,8:3,16:4,32:5};
 const seasonWeeks = newLeagueType==='bracket' ? (bracketWeeks[newLeagueSize]||3) : newLeagueWeeks;
 const sportsArr = newLeagueSports.length > 0 ? newLeagueSports : [sportId];
 const {data,error} = await supabase.from("leagues").insert({
   name, sport:sportsArr[0], sports:sportsArr, commissioner_id:user.id, invite_code:inviteCode,
   max_members:newLeagueSize, target_size:newLeagueSize, pick_deadline:"Sun 1PM ET",
   season_weeks:seasonWeeks, current_week:1, privacy:newLeaguePrivacy||"private",
   scoring_type:"multiplier_odds", league_type:newLeagueType||"h2h",
 }).select().single();
 if(error){alert(`leagues error: ${error.message} | code: ${error.code} | details: ${error.details}`);setCreatingLeague(false);return;}
 const {error:memberError} = await supabase.from("league_members").insert({league_id:data.id,user_id:user.id,is_commissioner:true});
 if(memberError){alert(`league_members error: ${memberError.message} | code: ${memberError.code}`);setCreatingLeague(false);return;}
 // Best-effort: store custom per-slot config (Pro). Safe no-op until the column exists.
 if(isPro && Array.isArray(newLeagueSlots) && newLeagueSlots.length && newLeagueSlots.every(s=>s.type)){
 await supabase.from("leagues").update({slot_config: JSON.stringify(newLeagueSlots)}).eq("id", data.id);
 }
 await fetchLeagues(user.id);
 setNewLeagueCreated(data);
 setTimeout(()=>{ if(!isPro) setShowPostLeagueUpsell(true); }, 800);
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

 const fetchPastMatchupPicks = async (week, myId, oppId) => {
 setPastMatchupLoading(true);
 setPastMatchupPicks({my:[], opp:[]});
 const {data} = await supabase
 .from('picks')
 .select('*')
 .eq('league_id', activeLeagueId)
 .eq('week', week)
 .in('user_id', [myId, oppId]);
 if(data) {
 setPastMatchupPicks({
 my: data.filter(p=>p.user_id===myId),
 opp: data.filter(p=>p.user_id===oppId),
 });
 }
 setPastMatchupLoading(false);
 };

 const checkAutoAdvanceWeek = async (leagueId, league) => {
 if(league && (league.league_type||"h2h")==="bracket") return; // tournaments settle server-side (grade.js)
 const currentWeek = league.current_week || 1;
 // Get all picks for this week
 const {data:allPicks} = await supabase
 .from('picks')
 .select('user_id, result')
 .eq('league_id', leagueId)
 .eq('week', currentWeek);
 if(!allPicks || allPicks.length === 0) return;
 // Check if every pick is graded (not pending)
 const allGraded = allPicks.every(p => p.result !== 'pending');
 if(!allGraded) return;
 // All graded — auto advance
 const nextWeek = currentWeek + 1;
 // Tally points per user
 const {data:wonPicks} = await supabase
 .from('picks')
 .select('user_id, points_earned')
 .eq('league_id', leagueId)
 .eq('week', currentWeek)
 .eq('result', 'W');
 const totals = {};
 (wonPicks||[]).forEach(p => {
 totals[p.user_id] = (totals[p.user_id]||0) + parseFloat(p.points_earned||0);
 });
 // Write winner_id to matchups
 const {data:weekMatchups} = await supabase
 .from('matchups')
 .select('id,user1_id,user2_id')
 .eq('league_id', leagueId)
 .eq('week', currentWeek)
 .is('winner_id', null);
 for(const m of (weekMatchups||[])) {
 const p1 = totals[m.user1_id]||0;
 const p2 = totals[m.user2_id]||0;
 await supabase.from('matchups').update({
 winner_id: p1 >= p2 ? m.user1_id : m.user2_id,
 user1_points: parseFloat(p1.toFixed(1)),
 user2_points: parseFloat(p2.toFixed(1)),
 }).eq('id', m.id);
 // Store pending_result for each user
 for(const [uid, myPts, oppPts] of [[m.user1_id,p1,p2],[m.user2_id,p2,p1]]) {
 await supabase.from('users').update({
 pending_result: JSON.stringify({
 won: (p1>=p2?m.user1_id:m.user2_id)===uid,
 myPts: parseFloat(myPts.toFixed(1)),
 oppPts: parseFloat(oppPts.toFixed(1)),
 week: currentWeek,
 })
 }).eq('id', uid);
 }
 }
 // Advance week
 // Don't advance past the final week — a finished season stays on its last (graded) week.
 if(nextWeek <= (league.season_weeks||18)){
 await supabase.from('leagues').update({current_week: nextWeek}).eq('id', leagueId);
 console.log('Auto-advanced to week', nextWeek);
 } else {
 console.log('Season complete — final week graded; holding on week', currentWeek);
 }
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

 const getOrCreateSoloLeague = async () => {
 if(!user) return null;
 // Check if solo league already exists for this user
 const {data:existing} = await supabase
   .from("leagues")
   .select("id")
   .eq("commissioner_id", user.id)
   .eq("league_type", "solo")
   .single();
 if(existing?.id) {
   setSoloLeagueId(existing.id);
   try{ if(soloSport) await supabase.from("leagues").update({sport: soloSport}).eq("id", existing.id); }catch(e){}
   return existing.id;
 }
 // Create one
 const {data:created, error} = await supabase
   .from("leagues")
   .insert({
     name: "Solo",
     sport: soloSport || "nfl",
     commissioner_id: user.id,
     invite_code: Math.random().toString(36).substring(2,8).toUpperCase(),
     max_members: 1,
     target_size: 1,
     pick_deadline: "Sun 1PM ET",
     season_weeks: 99,
     current_week: 1,
     privacy: "private",
     scoring_type: "multiplier_odds",
     league_type: "solo",
   })
   .select()
   .single();
 if(created?.id) {
   // Add user as member
   await supabase.from("league_members").insert({league_id:created.id, user_id:user.id, is_commissioner:true});
   setSoloLeagueId(created.id);
   return created.id;
 }
 return null;
 };

 const fetchSoloWeeks = async () => {
 if(!user) return;
 setSoloLoading(true);
 try {
   const lgId = soloLeagueId || await getOrCreateSoloLeague();
   if(!lgId) { setSoloLoading(false); return; }
   const {data} = await supabase
     .from("picks")
     .select("*")
     .eq("user_id", user.id)
     .eq("league_id", lgId)
     .order("week", {ascending:false});
   if(data) {
     // Group by week
     const byWeek = {};
     data.forEach(p => {
       const w = p.week||1;
       if(!byWeek[w]) byWeek[w] = [];
       byWeek[w].push(p);
     });
     const weeks = Object.keys(byWeek).map(w => {
       const picks = byWeek[w];
       const wins = picks.filter(p=>p.result==='W').length;
       const losses = picks.filter(p=>p.result==='L').length;
       const pts = picks.reduce((s,p)=>s+parseFloat(p.points_earned||0),0);
       return {week:parseInt(w), picks, wins, losses, pts:parseFloat(pts.toFixed(1))};
     }).sort((a,b)=>b.week-a.week);
     setSoloWeeks(weeks);
   }
 } catch(e) { console.error(e); }
 setSoloLoading(false);
 };

 // Freeform solo: lock a variable-length slate. Each pick is an independent
 // straight bet at multiplier 1, so it scores purely on its own odds via the
 // shared grading engine (no parlay, no forced 5 slots).
 const lockSoloFreeSlate = async () => {
 if(!user || !soloFreePicks.length) return;
 const lgId = soloLeagueId || await getOrCreateSoloLeague();
 if(!lgId){ alert("Couldn't open your solo league."); return; }
 const week = (soloWeeks.length ? Math.max(...soloWeeks.map(w=>w.week)) : 0) + 1;
 try {
 await supabase.from("picks").delete().eq("league_id", lgId).eq("user_id", user.id).eq("week", week);
 const rows = soloFreePicks.map((b,i)=>({
 league_id: lgId, user_id: user.id, week,
 slot: `free_${i}`, multiplier: 1,
 pick_name: b.pick, game: b.game||"", odds: b.odds, implied_odds: b.impliedOdds,
 game_date: b.gameTime||null,
 event_id: b.eventId||null, market_key: b.marketKey||null, outcome: b.outcome||null, outcome_point: (b.point!=null?b.point:null), sel_key: b.selKey||null,
 result: "pending", points_earned: 0,
 }));
 const { error } = await supabase.from("picks").insert(rows);
 if(error){ alert("Error saving slate: " + error.message); return; }
 try{ await supabase.from("leagues").update({sport: soloSport}).eq("id", lgId); }catch(e){}
 const freeSnap = soloFreePicks.map(b=>({pick:b.pick, game:b.game||"", odds:b.odds, impliedOdds:b.impliedOdds, category:b.category, categoryLabel:b.categoryLabel, categoryColor:b.categoryColor}));
 const lockedAt = new Date().toISOString();
 setSoloSavedPicks({freePicks: freeSnap, lockedAt, week});
 setSoloSubmitted(true);
 try{ localStorage.setItem("picklock_solo_locked", JSON.stringify({freePicks: freeSnap, lockedAt, week})); }catch(e){}
 setSoloFreePicks([]);
 try{ if(navigator.vibrate) navigator.vibrate([0,30,40,30,60]); }catch(e){}
 setLockRitual(true);
 } catch(e) { alert("Error: " + e.message); }
 };
 const clearSoloSlate = async () => {
 if(!user) return;
 const lgId = soloLeagueId || activeLeague.id;
 const week = (soloWeeks.length ? Math.max(...soloWeeks.map(w=>w.week)) : 0) + 1;
 try{ if(lgId && lgId!=="solo") await supabase.from("picks").delete().eq("league_id", lgId).eq("user_id", user.id).eq("week", week); }catch(e){}
 setSoloSavedPicks(null); setSoloSubmitted(false);
 try{ localStorage.removeItem("picklock_solo_locked"); }catch(e){}
 };
 const deleteSoloSlate = async (week) => {
   if(!user) return;
   const lgId = soloLeagueId || await getOrCreateSoloLeague();
   if(!lgId) return;
   try { await supabase.from("picks").delete().eq("league_id", lgId).eq("user_id", user.id).eq("week", week); } catch(e){}
   if(soloSavedPicks && soloSavedPicks.week===week){ setSoloSavedPicks(null); setSoloSubmitted(false); try{ localStorage.removeItem("picklock_solo_locked"); }catch(e){} }
   await fetchSoloWeeks();
 };
 const handleJoinCode = async (code) => {
   if(!user || !code) return;
   const {data:league,error}=await supabase.from("leagues").select().eq("invite_code",String(code).toUpperCase().trim()).single();
   if(error||!league){alert("League not found.");return;}
   const {data:currentMembers}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
   const targetSize = league.target_size||league.max_members||8;
   if(currentMembers && currentMembers.length >= targetSize){alert("This league is already full ("+targetSize+"/"+targetSize+").");return;}
   const {error:joinError}=await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
   if(joinError){alert("Could not join — you may already be a member.");return;}
   const {data:allMembers}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
   if(allMembers && allMembers.length === targetSize){
     const memberIds=allMembers.map(m=>m.user_id);
     if((league.league_type||"h2h")==="bracket") await generateBracket(league.id, memberIds);
     else if((league.league_type||"h2h")==="h2h") await generateSchedule(league.id, memberIds, league.season_weeks||18);
     alert("Joined "+league.name+"! League is full — schedule generated.");
   } else {
     alert("Joined "+league.name+"! "+(targetSize-allMembers.length)+" more needed.");
   }
   fetchLeagues(user.id);
 };

 const fetchPublicLeagues = async () => {
 setBrowseLoading(true);
 try {
   const {data, error} = await supabase
     .from("leagues")
     .select("*")
     .eq("privacy", "public")
     .order("created_at", {ascending:false})
     .limit(50);
   if(data) {
     const myLeagueIds = realLeagues.map(l=>l.id);
     const withCounts = await Promise.all(data.map(async lg=>{
       const {count, error:cErr} = await supabase
         .from("league_members")
         .select("*", {count:"exact",head:true})
         .eq("league_id", lg.id);
       return {...lg, memberCount: count||0};
     }));
     const filtered = withCounts.filter(lg=>{
       const maxSize = lg.target_size||lg.max_members||8;
       const passes = lg.memberCount < maxSize && !myLeagueIds.includes(lg.id);
       return passes;
     });
     setPublicLeagues(filtered);
   }
 } catch(e) { /* browse error suppressed */ }
 setBrowseLoading(false);
 };

 const joinPublicLeague = async (league) => {
 if(joiningLeagueId) return;
 setJoiningLeagueId(league.id);
 try {
   const {data:currentMembers} = await supabase.from("league_members").select("user_id").eq("league_id",league.id);
   const targetSize = league.target_size||league.max_members||8;
   if(currentMembers && currentMembers.length >= targetSize) {
     alert("This league just filled up!");
     setJoiningLeagueId(null);
     fetchPublicLeagues();
     return;
   }
   const {error:joinError} = await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
   if(joinError) { alert("Error joining. You may already be a member."); setJoiningLeagueId(null); return; }
   const {data:allMembers} = await supabase.from("league_members").select("user_id").eq("league_id",league.id);
   if(allMembers && allMembers.length === targetSize) {
     const memberIds = allMembers.map(m=>m.user_id);
     if((league.league_type||"h2h")==="bracket") await generateBracket(league.id, memberIds);
     else if((league.league_type||"h2h")==="h2h") await generateSchedule(league.id, memberIds, league.season_weeks||18);
   }
   await fetchLeagues(user.id);
   setShowBrowse(false);
   alert(`Joined ${league.name}!`);
 } catch(e) { alert("Something went wrong."); }
 setJoiningLeagueId(null);
 };

 const generateBracket = async (leagueId, memberIds) => {
 // Pure single-elimination bracket — sizes: 4=2wks, 8=3wks, 16=4wks, 32=5wks
 const n = memberIds.length;
 if(![4,8,16,32].includes(n)) return;
 await supabase.from("matchups").delete().eq("league_id", leagueId);
 const shuffled = [...memberIds].sort(()=>Math.random()-0.5);
 const matchupsToInsert = [];
 let week = 1;
 let roundSize = n;
 while(roundSize > 1) {
   const matchesThisRound = roundSize / 2;
   for(let i = 0; i < matchesThisRound; i++) {
     matchupsToInsert.push({
       league_id: leagueId,
       week,
       user1_id: week === 1 ? shuffled[i*2] : null,
       user2_id: week === 1 ? shuffled[i*2+1] : null,
       user1_points: 0,
       user2_points: 0,
       winner_id: null,
       bracket_match_id: `W${week}M${i+1}`,
     });
   }
   roundSize = matchesThisRound;
   week++;
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
 { id:"whale", icon:"", name:"The Whale", desc:"Most total points", holder:getName(byPoints[0]), isYou:isMe(byPoints[0]), color:IOS.green },
 { id:"sharp", icon:"", name:"Sharpshooter", desc:"Highest win rate", holder:getName(byWinRate[0]), isYou:isMe(byWinRate[0]), color:IOS.yellow },
 { id:"hot", icon:"", name:"Hot Hand", desc:"Longest win streak", holder:getName(byStreak[0]), isYou:isMe(byStreak[0]), color:IOS.orange },
 { id:"longshot", icon:"", name:"Longshot King", desc:"Most points from longshots",holder:getName(byLongshot[0]), isYou:isMe(byLongshot[0]), color:IOS.pink },
 ];
 setLeagueTrophies(trophies);
 };

 const fetchUserProfile = async (uid) => {
 const {data} = await supabase.from("users").select("id,username,email,is_pro,push_enabled,notif_results,notif_grades,notif_reminder,notif_league,notif_plok").eq("id",uid).maybeSingle();
 if(data) {
 setUserProfile(data);
 // DB is source of truth for pro status
 const proVal = data.is_pro === true;
 setIsPro(proVal);
 try { localStorage.setItem("picklock_is_pro", proVal ? "true" : "false"); } catch(e) {}
 if(!data.username) {
 const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0;
 const ageSeconds = (Date.now() - createdAt) / 1000;
 if(ageSeconds > 30) setShowUsernamePrompt(true);
 }
 } else {
 // No user record yet — they just signed up, skip prompt
 }
 };

 // Write pro status to DB + local state
 const setProStatus = async (val) => {
 setIsPro(val);
 try { localStorage.setItem("picklock_is_pro", val ? "true" : "false"); } catch(e) {}
 if(user) {
 await supabase.from("users").update({is_pro: val}).eq("id", user.id);
 }
 };
 const startCheckout = async (plan) => {
 if(!user || !user.id){ setShowPaywall(null); setScreen("auth"); return; }
 try {
 setCheckoutLoading(plan);
 const r = await fetch("/api/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ plan, userId:user.id, email:(userProfile&&userProfile.email)||user.email||null }) });
 const d = await r.json();
 if(r.ok && d.url){ window.location.href = d.url; return; }
 setCheckoutLoading(null);
 console.warn("checkout error:", d && d.error);
 } catch(e){ setCheckoutLoading(null); console.warn("checkout failed:", e); }
 };

 const fetchAllMyStats = async (uid) => {
 const {data:picks} = await supabase.from("picks").select("*").eq("user_id", uid).neq("result", "pending");
 if(!picks||!picks.length){setAllMyStats({wins:0,losses:0,points:0,total:0,winRate:"0%",bestBet:null,worstBet:null,byType:{},bySport:{},byWeek:[],avgOdds:0,currentStreak:{count:0,type:"W"},maxStreak:0,bestWeek:null,personality:"The Rookie",personalityDesc:"Keep picking and your style will emerge.",longshotStats:[],byMult:[],oddsBands:[],clv:null});return;}
 const wins=picks.filter(p=>p.result==="W").length;
 const losses=picks.filter(p=>p.result==="L").length;
 const points=parseFloat(picks.filter(p=>p.result==="W").reduce((sum,p)=>sum+parseFloat(p.points_earned||0),0).toFixed(1));
 const total=wins+losses;
 const winRate=total>0?`${Math.round(wins/total*100)}%`:"0%";
 const bestBet=picks.filter(p=>p.result==="W").sort((a,b)=>parseFloat(b.points_earned||0)-parseFloat(a.points_earned||0))[0];
 const worstBet=picks.filter(p=>p.result==="L")[0];
 // By bet type
 const TYPE_COLORS={ml:"#0A84FF",prop:"#FFD60A",ou:"#FF9F0A",spread:"#30D158",longshot:"#FF375F"};
 const TYPE_LABELS={ml:"Moneyline",prop:"Prop",ou:"Over/Under",spread:"Spread",longshot:"Longshot"};
 const byType={};
 picks.forEach(p=>{const slot=p.slot?.startsWith("longshot")?"longshot":(p.slot||"ml").split("_")[0];if(!byType[slot])byType[slot]={wins:0,losses:0,pts:0,color:TYPE_COLORS[slot]||"#888",label:TYPE_LABELS[slot]||slot};if(p.result==="W"){byType[slot].wins++;byType[slot].pts+=parseFloat(p.points_earned||0);}else byType[slot].losses++;});
 Object.values(byType).forEach(t=>{const tot=t.wins+t.losses;t.pct=tot>0?Math.round(t.wins/tot*100):0;t.pts=parseFloat(t.pts.toFixed(1));});
 // By sport
 const leagueIds=[...new Set(picks.map(p=>p.league_id).filter(Boolean))];
 let sportMap={};
 if(leagueIds.length){const{data:lgs}=await supabase.from("leagues").select("id,sport").in("id",leagueIds);(lgs||[]).forEach(lg=>{sportMap[lg.id]=lg.sport;});}
 const SPORT_COLORS={nfl:"#0A84FF",nba:"#FF6B35",mlb:"#30D158"};
 const SPORT_LABELS={nfl:"NFL",nba:"NBA",mlb:"MLB"};
 const bySport={};
 picks.forEach(p=>{const sport=sportMap[p.league_id]||"nfl";if(!bySport[sport])bySport[sport]={wins:0,losses:0,pts:0,color:SPORT_COLORS[sport]||"#888",label:SPORT_LABELS[sport]||sport.toUpperCase()};if(p.result==="W"){bySport[sport].wins++;bySport[sport].pts+=parseFloat(p.points_earned||0);}else bySport[sport].losses++;});
 Object.values(bySport).forEach(s=>{const tot=s.wins+s.losses;s.pct=tot>0?Math.round(s.wins/tot*100):0;s.pts=parseFloat(s.pts.toFixed(1));});
 // By week trend
 const byWeekMap={};
 picks.forEach(p=>{const w=p.week||1;if(!byWeekMap[w])byWeekMap[w]={week:w,wins:0,losses:0,pts:0};if(p.result==="W"){byWeekMap[w].wins++;byWeekMap[w].pts+=parseFloat(p.points_earned||0);}else byWeekMap[w].losses++;});
 const byWeek=Object.values(byWeekMap).sort((a,b)=>a.week-b.week).map(w=>({...w,pts:parseFloat(w.pts.toFixed(1)),label:`Wk${w.week}`}));
 // Streak
 const sorted=[...picks].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
 let curStreak=0,curType=sorted[sorted.length-1]?.result||"W",maxStreak=0,tmpStreak=0,tmpType=sorted[0]?.result;
 for(let i=sorted.length-1;i>=0;i--){if(i===sorted.length-1){curStreak=1;curType=sorted[i].result;}else if(sorted[i].result===curType)curStreak++;else break;}
 sorted.forEach(p=>{if(p.result===tmpType){tmpStreak++;maxStreak=Math.max(maxStreak,tmpStreak);}else{tmpType=p.result;tmpStreak=1;}});
 // Avg odds
 const oddsVals=picks.filter(p=>!(p.slot&&p.slot.startsWith("longshot_"))).map(p=>p.implied_odds||0).filter(v=>v!==0);
 // Average odds properly: you can't arithmetic-mean American odds across the +/-100 gap.
 // Mean the implied probability instead (straight bets only — longshot legs would skew it), then convert back to American.
 const amToProb=a=>a>0?100/(a+100):Math.abs(a)/(Math.abs(a)+100);
 const avgProb=oddsVals.length?oddsVals.reduce((s,v)=>s+amToProb(v),0)/oddsVals.length:0;
 const avgOdds=avgProb>0?(avgProb>=0.5?-Math.round(100*avgProb/(1-avgProb)):Math.round(100*(1-avgProb)/avgProb)):0;
 const bestWeekObj=byWeek.length?byWeek.reduce((b,w)=>w.pts>b.pts?w:b,byWeek[0]):null;
 // Personality
 const lsT=byType["longshot"]||{wins:0,pct:0};const mlT=byType["ml"]||{wins:0,pct:0};const spT=byType["spread"]||{pct:0};const prT=byType["prop"]||{wins:0,pct:0};
 let personality="The Rookie",personalityDesc="You're just getting started. Keep picking and your style will emerge.";
 if(total>=5){if(lsT.wins>=2&&lsT.pct>=25){personality="The Gambler";personalityDesc="You're not afraid of big odds. Your longshot hit rate is turning heads.";}else if(mlT.pct>=65&&mlT.wins>=8){personality="The Chalk";personalityDesc="You ride favorites hard and it's working. Boring? Maybe. Profitable? Yes.";}else if(spT.pct>=60){personality="The Handicapper";personalityDesc="You beat the spread at an elite clip. Vegas should be worried.";}else if(prT.pct>=60&&prT.wins>=6){personality="The Analyst";personalityDesc="Player props are your bread and butter. You do your homework.";}else if(wins/total>=0.60){personality="The Sharpshooter";personalityDesc="Consistent, disciplined, winning across the board. Textbook sharp.";}else{personality="The Contrarian";personalityDesc="You pick against the grain. Your record proves it's not always wrong.";}}
 // Longshot deep stats
 const lsPicks=picks.filter(p=>p.slot?.startsWith("longshot_"));
 const lsByLegs={};
 lsPicks.forEach(p=>{const k=p.league_id+"_"+p.week+"_"+p.multiplier;if(!lsByLegs[k])lsByLegs[k]={legs:0,result:p.result};lsByLegs[k].legs++;});
 const parlayGroups=Object.values(lsByLegs);
 const parlayBySize={};
 parlayGroups.forEach(g=>{const s=Math.min(g.legs,5);if(!parlayBySize[s])parlayBySize[s]={legs:s,hit:0,total:0};parlayBySize[s].total++;if(g.result==="W")parlayBySize[s].hit++;});
 const longshotStats=Object.values(parlayBySize).sort((a,b)=>a.legs-b.legs).map(x=>({...x,pct:x.total>0?Math.round(x.hit/x.total*100):0}));
 // By multiplier (risk vs reward)
 const MULT_COLORS={1:"#0A84FF",2:"#2E8FE6",3:"#5E8FCC",4:"#8A7FB0",5:"#FF375F"};
 const byMultMap={};
 picks.forEach(p=>{const m=Math.max(1,Math.min(5,Math.round(p.multiplier||1)));if(!byMultMap[m])byMultMap[m]={mult:m,wins:0,losses:0,pts:0,color:MULT_COLORS[m]};if(p.result==="W"){byMultMap[m].wins++;byMultMap[m].pts+=parseFloat(p.points_earned||0);}else byMultMap[m].losses++;});
 const byMult=[1,2,3,4,5].map(m=>{const o=byMultMap[m]||{mult:m,wins:0,losses:0,pts:0,color:MULT_COLORS[m]};const tot=o.wins+o.losses;return{...o,pts:parseFloat(o.pts.toFixed(1)),pct:tot>0?Math.round(o.wins/tot*100):0,total:tot};});
 // Hit rate by odds band
 const bandDefs=[{key:"-200+",test:o=>o<=-200},{key:"-150",test:o=>o>-200&&o<=-140},{key:"-110",test:o=>o>-140&&o<100},{key:"+100",test:o=>o>=100&&o<200},{key:"+200",test:o=>o>=200&&o<400},{key:"+400+",test:o=>o>=400}];
 const bandColors=["#30D158","#5CC85A","#9FBE3E","#FFD60A","#FF9F0A","#FF375F"];
 const oddsBands=bandDefs.map((b,i)=>{const inB=picks.filter(p=>{const o=p.implied_odds||0;return o!==0&&b.test(o);});const w=inB.filter(p=>p.result==="W").length;return{key:b.key,color:bandColors[i],total:inB.length,wins:w,pct:inB.length>0?Math.round(w/inB.length*100):0};});
 const clvP=picks.filter(p=>p.clv!=null);
 const clvObj=clvP.length?{count:clvP.length,beatRate:Math.round(clvP.filter(p=>parseFloat(p.clv)>0).length/clvP.length*100),avgClv:parseFloat((clvP.reduce((a,p)=>a+parseFloat(p.clv||0),0)/clvP.length).toFixed(2))}:null;
 setAllMyStats({wins,losses,points,total,winRate,bestBet,worstBet,byType,bySport,byWeek,avgOdds,currentStreak:{count:curStreak,type:curType},maxStreak,bestWeek:bestWeekObj,personality,personalityDesc,longshotStats,byMult,oddsBands,clv:clvObj});
 };

 const fetchStandings = async (leagueId) => {
 // Get all members first — always needed regardless of picks
 const {data:members} = await supabase
 .from("league_members")
 .select("user_id, is_commissioner")
 .eq("league_id", leagueId);
 if(!members||!members.length) return;

 const userIds = members.map(m=>m.user_id);
 const {data:users} = await supabase
 .from("users")
 .select("id, username, email")
 .in("id", userIds);

 // Get all graded picks for this league (may be empty for new leagues)
 const {data:picks} = await supabase
 .from("picks")
 .select("*")
 .eq("league_id", leagueId)
 .neq("result", "pending");

 // Group picks by user and calculate stats
 const statsByUser = {};
 (picks||[]).forEach(p=>{
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
 .select("user1_id,user2_id,winner_id,week")
 .eq("league_id", leagueId)
 .not("winner_id", "is", null);

 const matchupRecord = {};
 (matchups||[]).forEach(m=>{
 if(!matchupRecord[m.user1_id]) matchupRecord[m.user1_id]={mw:0,ml:0};
 if(!matchupRecord[m.user2_id]) matchupRecord[m.user2_id]={mw:0,ml:0};
 if(m.winner_id===m.user1_id){ matchupRecord[m.user1_id].mw++; matchupRecord[m.user2_id].ml++; }
 else { matchupRecord[m.user2_id].mw++; matchupRecord[m.user1_id].ml++; }
 });

 // Calculate current streak per user from matchup history
 const streakByUser = {};
 const matchupsByWeek = {};
 (matchups||[]).forEach(m=>{
 const week = m.week || 0;
 if(!matchupsByWeek[week]) matchupsByWeek[week] = [];
 matchupsByWeek[week].push(m);
 });
 userIds.forEach(uid=>{
 // Get matchup results in week order
 const results = Object.keys(matchupsByWeek)
 .map(Number).sort((a,b)=>a-b)
 .map(w=>{
 const m = matchupsByWeek[w].find(x=>x.user1_id===uid||x.user2_id===uid);
 if(!m) return null;
 return m.winner_id===uid ? 'W' : 'L';
 }).filter(Boolean);
 if(!results.length){ streakByUser[uid]={count:0,type:'W'}; return; }
 const last = results[results.length-1];
 let count = 0;
 for(let i=results.length-1;i>=0;i--){
 if(results[i]===last) count++;
 else break;
 }
 streakByUser[uid] = {count, type:last};
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
 streak: streakByUser[uid] || {count:0, type:'W'},
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
 const groups = {}; const order = [];
 data.forEach(p=>{ const sl=p.slot||""; const key = sl.startsWith("longshot") ? ("longshot_"+p.multiplier) : ("m"+p.multiplier); if(!groups[key]){ groups[key]=[]; order.push(key); } groups[key].push(p); });
 const flexPicks = order.map((key,gi)=>{
 const picks = groups[key];
 const isParlay = key.startsWith("longshot");
 const cat = (picks[0].slot||"").split("_")[0];
 return {
 id: gi,
 mult: picks[0].multiplier,
 isParlay,
 parlayLegs: isParlay ? picks.map(pp=>({id:pp.id, pick:pp.pick_name, game:pp.game||"", odds:pp.odds, impliedOdds:pp.implied_odds, gameTime:pp.game_date||null})) : [],
 bet: isParlay ? null : {pick:picks[0].pick_name, game:picks[0].game||"", odds:picks[0].odds, impliedOdds:picks[0].implied_odds, gameTime:picks[0].game_date||null, eventId:picks[0].event_id||null, marketKey:picks[0].market_key||null, outcome:picks[0].outcome||null, point:(picks[0].outcome_point!=null?picks[0].outcome_point:null), selKey:picks[0].sel_key||null},
 power_up_id: picks[0].power_up_id||null,
 pu_tier: picks[0].pu_tier!=null?picks[0].pu_tier:null,
 category: cat,
 committed: true,
 commitIds: picks.map(pp=>pp.id),
 };
 });
 const _isCustom = data.some(pp=>{const s=pp.slot||""; return !s.startsWith("longshot") && /_\d+$/.test(s);});
 if(!_isCustom){ while(flexPicks.length < 5) flexPicks.push({id:flexPicks.length, bet:null, mult:null, isParlay:false, parlayLegs:[]}); }
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

 const fetchBracket = async (lid) => {
 try {
 const { data } = await supabase.from("matchups").select("*").eq("league_id", lid);
 const ms = data||[];
 setBracketMatchups(ms);
 const wks = [...new Set(ms.map(m=>m.week))].sort((a,b)=>a-b);
 const fin = ms.filter(m=>m.week===wks[wks.length-1]);
 const champ = (fin.length===1)?fin[0].winner_id:null;
 if(champ && user && champ===user.id && champSeenRef.current!==lid){ champSeenRef.current=lid; const me=leagueMembers.find(x=>x.userId===champ); setChampCelebrate({name: me?me.name:"You", leagueName: activeLeague.name, isYou:true}); }
 const cw = activeLeague.current_week||1;
 const { data:lp } = await supabase.from("picks").select("user_id,result,points_earned").eq("league_id",lid).eq("week",cw);
 const totals={}; (lp||[]).forEach(r=>{ if(r.result==="W") totals[r.user_id]=(totals[r.user_id]||0)+parseFloat(r.points_earned||0); });
 setBracketLive({week:cw, totals});
 } catch(e) { setBracketMatchups([]); }
 };

 const openBracketMatch = async (mu) => {
 try {
 const u1=mu.user1_id, u2=mu.user2_id; if(!u1||!u2) return;
 const { data } = await supabase.from("picks").select("user_id,slot,pick_name,odds,multiplier,result,points_earned").eq("league_id",activeLeague.id).eq("week",mu.week).in("user_id",[u1,u2]);
 const rows = data||[];
 const build = (id, storedPts) => {
 const ps = rows.filter(r=>r.user_id===id).map(r=>({ slot:(r.slot||"").split("_")[0], name:r.pick_name||"Pick", sub:(r.multiplier?r.multiplier+"x":"")+(r.odds!=null&&r.odds!==""?" · "+r.odds:""), res:r.result==="W"?"W":(r.result==="L"?"L":"pend"), pts:parseFloat(r.points_earned||0) }));
 const computed = ps.reduce((a,pk)=>a+(pk.res==="W"?pk.pts:0),0);
 const mem = leagueMembers.find(x=>x.userId===id);
 return { name: mem?mem.name:"Player", you:id===(user&&user.id), total:(mu.winner_id!=null && storedPts!=null)?Number(storedPts):computed, picks:ps };
 };
 const rn = brkRoundName(((bracketMatchups||[]).filter(x=>x.week===mu.week)).length||1);
 setBracketDetail({ round: rn+" · Week "+mu.week, week:mu.week, winnerId:mu.winner_id, u1, u2, a:build(u1, mu.user1_points), b:build(u2, mu.user2_points) });
 } catch(e) {}
 };

 useEffect(()=>{
 if(screen==="league" && activeLeague && activeLeague.league_type==="bracket" && (leagueTab==="bracket"||leagueTab==="schedule")){
 fetchBracket(activeLeague.id);
 const _iv=setInterval(()=>fetchBracket(activeLeague.id), 45000);
 return ()=>clearInterval(_iv);
 }
 }, [screen, leagueTab, activeLeagueId]);

 const fetchLeagues = async (uid) => {
 setLeaguesLoading(true);
 const {data:members} = await supabase.from("league_members").select("league_id, is_commissioner").eq("user_id", uid);
 if(!members || members.length===0) { setLeaguesLoading(false); return; }
 const ids = [...new Set(members.map(m=>m.league_id))];
 const {data:leagues} = await supabase.from("leagues").select("*").in("id", ids);
 if(leagues && leagues.length > 0) {
 const mapped = leagues.filter(lg=>lg.league_type!=="solo").map(lg=>({
 ...lg,
 isCommissioner: members.find(m=>m.league_id===lg.id)?.is_commissioner||false
 }));
 setRealLeagues(mapped);
 if(mapped.length>0){
 // Preserve the current / last-active league across re-fetches (auth refresh on
 // app re-focus was snapping the user back to whatever league sorted first).
 let savedId=null; try{ savedId=localStorage.getItem("picklock_active_league"); }catch(e){}
 const valid=(id)=>id&&mapped.some(l=>l.id===id);
 setActiveLeagueId(prev=>{
 const target = valid(prev) ? prev : (valid(savedId) ? savedId : mapped[0].id);
 const tl = mapped.find(l=>l.id===target) || mapped[0];
 fetchMyPicks(tl.id, tl.current_week||tl.week||1, uid);
 return target;
 });
 }
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
 const [savedPicks, setSavedPicks] = useState(null);
 const [selectedMatchup, setSelectedMatchup] = useState(null);
 const [pastMatchupPicks, setPastMatchupPicks] = useState({my:[], opp:[]});
 const [pastMatchupLoading, setPastMatchupLoading] = useState(false);
 useEffect(()=>{
 const phone = document.querySelector('.phone');
 if(phone) phone.style.overflow = selectedMatchup ? 'visible' : 'hidden';
 }, [selectedMatchup]); // week number of selected past matchup // locked picks for the week
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
 if(isSoloMode) return; // solo mode - no league data to fetch
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
 // Always fetch odds even if lg2 not loaded yet — fetch all sports
 const leagueSportsToFetch = lg2?.sports || (lg2?.sport ? [lg2.sport] : [activeLeague?.sport || "nfl"]);
 leagueSportsToFetch.forEach(sp => fetchLiveOdds(sp));
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

 // Rehydrate the solo home's locked-slip card after a reload (in-memory state is lost otherwise).
 // Guarded by week so a slip from a prior, already-graded week never shows as current.
 useEffect(()=>{
 if(isSoloMode && !soloSavedPicks){
 try{
 const _s = localStorage.getItem("picklock_solo_locked");
 if(_s){ const _p = JSON.parse(_s); if(_p && _p.week===(soloWeeks.length+1)){ if(_p.freePicks){ setSoloSavedPicks({freePicks:_p.freePicks, lockedAt:_p.lockedAt}); } else if(_p.flexPicks){ setSoloSavedPicks({flexPicks:_p.flexPicks, lockedAt:_p.lockedAt}); } } }
 }catch(e){}
 }
 },[isSoloMode, soloWeeks, soloSavedPicks]);

 useEffect(()=>{
 if(!activeLeagueId||!user) return;
 if(isSoloMode) return;
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
 streak: s.streak,
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
 if(sortBy==="roi") return parseFloat(b.roi)-parseFloat(a.roi);
 if(sortBy==="units") return parseFloat(b.units)-parseFloat(a.units);
 if(sortBy==="wpct") return parseFloat(b.wpct)-parseFloat(a.wpct);
 // Default: wins first, then points as tiebreaker
 const aWins = parseInt((a.record||"0-0").split("-")[0])||0;
 const bWins = parseInt((b.record||"0-0").split("-")[0])||0;
 if(bWins !== aWins) return bWins - aWins;
 return (b.points||0) - (a.points||0);
 });

 const W=280;const R=W/2;const segA=360/WHEEL_ITEMS.length;

 const css=`
 @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
 *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
 ::-webkit-scrollbar{display:none;}

 html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none;position:fixed;width:100%;top:0;left:0;} #root{height:100%;overflow:hidden;} .phone{width:100%;max-width:480px;margin:0 auto;height:100%;max-height:100%;background:#000;position:relative;overflow:hidden;display:flex;flex-direction:column;font-family:'Barlow',system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;padding-top:env(safe-area-inset-top,0px);box-sizing:border-box;}

 /* iOS Status Bar */


 /* Large Title Navigation (iOS style) */
 .nav-header{padding:env(safe-area-inset-top,44px) 20px 12px;position:relative;z-index:5;background:#000;}
 .nav-header.large{padding-bottom:8px;}
 .nav-title-small{font-size:17px;font-weight:600;letter-spacing:-0.4px;color:#fff;text-align:center;padding:12px 0 8px;}
 .nav-title-large{font-size:34px;font-weight:700;letter-spacing:-0.5px;color:#fff;line-height:1.35;padding:1px 0;}
 .nt-tg{width:54px;height:32px;border-radius:16px;background:#3a3a40;position:relative;cursor:pointer;flex-shrink:0;overflow:hidden;transition:background .3s;}
 .nt-fill{position:absolute;inset:0;border-radius:16px;background:linear-gradient(90deg,#0A84FF,#48a4ff);transform:scaleX(0);transform-origin:left center;transition:transform .42s cubic-bezier(.34,1.56,.64,1);}
 .nt-tg.on .nt-fill{transform:scaleX(1);}
 .nt-knob{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .44s cubic-bezier(.34,1.56,.64,1);display:flex;align-items:center;justify-content:center;z-index:2;}
 .nt-tg.on .nt-knob{transform:translateX(22px);}
 .nt-knob .lk-on{display:none;} .nt-knob .lk-off{display:block;}
 .nt-tg.on .nt-knob .lk-on{display:block;} .nt-tg.on .nt-knob .lk-off{display:none;}
 .wrec-wrap{position:fixed;inset:0;z-index:9500;background:#000;overflow:hidden;}
 .wrec-bars{position:absolute;top:14px;left:14px;right:14px;display:flex;gap:5px;z-index:30;}
 .wrec-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.25);overflow:hidden;}
 .wrec-bar i{display:block;height:100%;width:0;background:#fff;border-radius:2px;}
 .wrec-bar.done i{width:100%;}
 .wrec-bar.cur i{width:100%;transition:width .4s ease;}
 .wrec-x{position:absolute;top:28px;left:16px;z-index:31;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;}
 .wrec-skip{position:absolute;top:30px;right:16px;z-index:31;font-size:12.5px;font-weight:800;letter-spacing:.04em;color:rgba(255,255,255,.75);background:rgba(255,255,255,.12);border-radius:14px;padding:7px 15px;cursor:pointer;}
 .wrec-slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:64px 30px 80px;}
 .wrec-zone{position:absolute;top:70px;bottom:70px;width:38%;z-index:25;cursor:pointer;}
 .wrec-zone.l{left:0;} .wrec-zone.r{right:0;width:62%;}
 .wrec-grain{position:absolute;inset:0;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
 .wrec-kicker{font-size:13px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;opacity:.6;}
 .wrec-huge{font-size:68px;font-weight:900;letter-spacing:-3px;line-height:.9;}
 .wrec-big{font-size:46px;font-weight:900;letter-spacing:-2px;line-height:.95;}
 .wrec-mid{font-size:28px;font-weight:900;letter-spacing:-1px;}
 .wrec-sub{font-size:15.5px;font-weight:600;opacity:.7;line-height:1.4;}
 .wrec-rise{opacity:0;transform:translateY(22px);animation:wrecRise .55s cubic-bezier(.2,.8,.2,1) forwards;}
 .wrec-d1{animation-delay:.05s;}.wrec-d2{animation-delay:.18s;}.wrec-d3{animation-delay:.32s;}.wrec-d4{animation-delay:.46s;}.wrec-d5{animation-delay:.6s;}
 @keyframes wrecRise{to{opacity:1;transform:translateY(0);}}
 .wrec-pop{transform:scale(.6);opacity:0;animation:wrecPop .6s cubic-bezier(.34,1.56,.64,1) forwards;}
 @keyframes wrecPop{to{transform:scale(1);opacity:1;}}
 @keyframes flameFlick{0%,100%{transform:scaleY(1) scaleX(1);opacity:.95;}25%{transform:scaleY(1.09) scaleX(.95);opacity:1;}50%{transform:scaleY(.96) scaleX(1.04);opacity:.9;}75%{transform:scaleY(1.05) scaleX(.98);opacity:1;}}
 .flame-flicker{transform-origin:50% 100%;animation:flameFlick .85s ease-in-out infinite;}
 .wrec-emblem{width:86px;height:86px;border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;}
 .wrec-nums{display:flex;gap:14px;margin-top:8px;width:100%;}
 .wrec-ncell{flex:1;}
 .wrec-ncell .v{font-size:44px;font-weight:900;letter-spacing:-2px;}
 .wrec-ncell .k{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-top:2px;}
 .wrec-pill{display:inline-flex;flex-direction:column;align-items:flex-start;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:14px 18px;}
 .wrec-pill .nm{font-size:18px;font-weight:800;}
 .wrec-pill .meta{font-size:12px;opacity:.6;font-weight:600;margin-top:2px;}
 .wrec-ptsbadge{font-size:17px;font-weight:900;padding:7px 14px;border-radius:11px;}
 .wrec-rank{font-size:60px;font-weight:900;letter-spacing:-3px;}
 .wrec-card{width:282px;border-radius:24px;padding:26px 22px;position:relative;overflow:hidden;border:1.5px solid rgba(120,170,255,.6);box-shadow:0 0 40px -10px rgba(10,132,255,.6);background:linear-gradient(165deg,#15294f,#0a1230);}
 .wrec-card .holo{position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:.4;background:repeating-linear-gradient(115deg,rgba(255,0,128,.2) 0%,rgba(0,225,255,.2) 12%,rgba(120,255,120,.2) 24%,rgba(255,235,0,.2) 36%,rgba(255,0,128,.2) 48%);background-size:300% 300%;animation:wrecHolo 5s ease-in-out infinite alternate;}
 @keyframes wrecHolo{0%{background-position:10% 20%;}100%{background-position:90% 80%;}}
 .wrec-btn{margin-top:22px;display:flex;gap:10px;width:282px;}
 .wrec-btn b{flex:1;text-align:center;font-size:15px;font-weight:800;padding:14px;border-radius:14px;cursor:pointer;}
 .wrec-tap{position:absolute;bottom:24px;left:0;right:0;text-align:center;font-size:12px;font-weight:700;letter-spacing:.1em;opacity:.4;text-transform:uppercase;z-index:20;}
 .nav-subtitle{font-size:13px;color:${IOS.label3};margin-top:2px;}

 /* Scrollable body */
 .body{flex:1;min-height:0;overflow-y:auto;position:relative;z-index:1;padding-top:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
 .body-pad{padding-bottom:calc(100px + env(safe-area-inset-bottom,0px));}
 .app-header{flex-shrink:0;z-index:25;position:relative;display:flex;align-items:center;gap:8px;height:52px;padding:0 14px;background:linear-gradient(180deg,#10101a 0%,#0b0b0e 100%);border-bottom:0.5px solid rgba(255,255,255,0.08);box-shadow:0 6px 18px rgba(0,0,0,0.45);}
 .gh-left{display:flex;align-items:center;min-width:0;flex-shrink:0;}
 .gh-center{flex:1;min-width:0;}
 .gh-right{display:flex;align-items:center;gap:9px;flex-shrink:0;}
 .gh-switch{display:flex;align-items:center;gap:6px;background:rgba(10,132,255,0.12);border:0.5px solid rgba(10,132,255,0.32);border-radius:10px;padding:7px 11px;cursor:pointer;max-width:200px;}
 .gh-switch.solo{background:rgba(255,55,95,0.12);border-color:rgba(255,55,95,0.32);}
 .gh-nm{font-size:13px;font-weight:700;color:#cfe4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 .gh-switch.solo .gh-nm{color:#ffc4d2;}
 .gh-icon{position:relative;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;}
 .gh-badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:8px;background:${IOS.pink};color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #0b0b0e;}
 .gh-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,${IOS.blue},${IOS.indigo});display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;cursor:pointer;color:#fff;}
 .gh-sheet-bg{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9000;display:flex;flex-direction:column;justify-content:flex-end;}
 .gh-sheet{background:#0c0c10;border-top-left-radius:22px;border-top-right-radius:22px;border-top:0.5px solid rgba(255,255,255,0.09);padding:0 0 calc(14px + env(safe-area-inset-bottom,0px));max-height:75vh;overflow-y:auto;}
 .gh-grip{width:38px;height:4px;border-radius:2px;background:rgba(255,255,255,0.2);margin:10px auto 6px;}
 .gh-sheet-h{font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);padding:8px 20px 6px;}
 .gh-opt{display:flex;align-items:center;gap:12px;padding:13px 20px;cursor:pointer;}
 .gh-opt:active{background:rgba(255,255,255,0.04);}
 .gh-od{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
 .gh-on{font-size:15px;font-weight:700;color:#fff;}
 .gh-osub{font-size:11.5px;color:rgba(255,255,255,0.4);margin-top:1px;}

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
 .ios-btn{width:calc(100% - 32px);margin:4px 16px;border:none;border-radius:14px;padding:16px;font-family:'Barlow',sans-serif;font-size:17px;font-weight:600;cursor:pointer;transition:opacity .15s,transform .1s;letter-spacing:-0.2px;display:flex;align-items:center;justify-content:center;gap:8px;}
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
 .wr-hero{position:relative;overflow:hidden;border-radius:18px;margin:12px 0 0;padding:16px 16px 14px;background:linear-gradient(160deg,#0c1322,#0a0a0e);}
 .wr-hero .wr-aurora{position:absolute;inset:-60% -25% auto -25%;height:240px;z-index:0;filter:blur(42px);opacity:.5;background:radial-gradient(40% 50% at 25% 30%,#0a84ff,transparent 70%),radial-gradient(40% 50% at 75% 40%,#7a4dff,transparent 70%),radial-gradient(35% 45% at 55% 75%,#00d0a0,transparent 70%);animation:wrDrift 14s ease-in-out infinite alternate;}
 @keyframes wrDrift{0%{transform:translate(0,0) scale(1);}100%{transform:translate(-6%,4%) scale(1.15);}}
 .wr-hero>*{position:relative;z-index:1;}
 .wr-hlabel{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);}
 .wr-hbig{display:flex;align-items:flex-end;gap:9px;margin-top:1px;}
 .wr-pts{font-size:46px;font-weight:900;letter-spacing:-2px;line-height:.9;}
 .wr-u{font-size:12px;font-weight:800;color:rgba(255,255,255,.5);margin-bottom:7px;}
 .wr-chips{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
 .wr-chip{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);padding:6px 10px;border-radius:11px;}
 .wr-rival{margin:12px 0 0;background:linear-gradient(100deg,rgba(255,69,58,.1),rgba(10,132,255,.12));border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:11px 13px;}
 .wr-rt{display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:8px;}
 .wr-track{height:7px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;position:relative;}
 .wr-fill{position:absolute;top:0;bottom:0;left:0;border-radius:5px;background:linear-gradient(90deg,#0a84ff,#6cb6ff);transition:width 1s cubic-bezier(.2,.8,.2,1);}
 .wr-gap{font-size:11px;color:rgba(255,255,255,.55);margin-top:7px;}
 .wr-carousel{display:flex;gap:10px;overflow-x:auto;padding:2px 16px 6px;}
 .wr-carousel::-webkit-scrollbar{display:none;}
 .wr-gc{flex-shrink:0;width:214px;background:linear-gradient(165deg,#15151c,#0d0d11);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:11px;cursor:pointer;}
 .wr-gc.picked{border-color:rgba(10,132,255,.45);}
 .wr-gctop{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
 .wr-gtime{font-size:10px;font-weight:800;color:rgba(255,255,255,.5);}
 .wr-glive{font-size:9.5px;font-weight:900;color:#30D158;display:flex;align-items:center;gap:4px;}
 .wr-gsport{font-size:8.5px;font-weight:800;color:rgba(255,255,255,.35);background:rgba(255,255,255,.06);border-radius:5px;padding:2px 6px;}
 .wr-grow{display:flex;align-items:center;justify-content:space-between;padding:3px 0;}
 .wr-gl{display:flex;align-items:center;gap:8px;min-width:0;}
 .wr-glogo{width:22px;height:22px;border-radius:6px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;flex-shrink:0;overflow:hidden;}
 .wr-gn{font-size:13px;font-weight:800;}
 .wr-gsc{font-size:16px;font-weight:900;}
 .wr-pickbadge{margin-top:8px;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;color:#30D158;background:rgba(48,209,88,.1);border-radius:7px;padding:5px 8px;}
 .wr-dot{width:6px;height:6px;border-radius:50%;background:#30D158;box-shadow:0 0 0 0 rgba(48,209,88,.6);animation:wrPulse 1.6s infinite;}
 @keyframes wrPulse{0%{box-shadow:0 0 0 0 rgba(48,209,88,.6);}100%{box-shadow:0 0 0 7px rgba(48,209,88,0);}}
 .lr-bg{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(2,3,8,.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .25s;}
 .lr-bg.on{opacity:1;pointer-events:auto;}
 .lr-stage{position:relative;width:240px;height:240px;display:flex;align-items:center;justify-content:center;}
 .lr-vault{position:absolute;width:200px;height:200px;border-radius:24px;border:3px solid rgba(120,150,200,.28);background:radial-gradient(circle at 50% 40%,rgba(30,40,60,.6),rgba(8,10,16,.92));opacity:0;transform:scale(.85);transition:opacity .3s,transform .3s;}
 .lr-bg.on .lr-vault{opacity:1;transform:scale(1);}
 .lr-lock{position:absolute;opacity:0;transform:translateY(-30px) scale(.6);transition:opacity .3s,transform .35s cubic-bezier(.2,.8,.2,1);}
 .lr-bg.on .lr-lock{opacity:1;transform:translateY(0) scale(1);transition-delay:.25s;}
 .lr-shk{transform:translateY(-13px);transition:transform .35s cubic-bezier(.5,-0.4,.3,1.4);transition-delay:.55s;}
 .lr-bg.on .lr-shk{transform:translateY(0);}
 .lr-stamp{position:absolute;border:4px solid #30D158;color:#30D158;font-size:26px;font-weight:900;letter-spacing:3px;padding:5px 16px;border-radius:9px;text-transform:uppercase;opacity:0;transform:rotate(-15deg) scale(2.4);}
 .lr-bg.on .lr-stamp{animation:lrStamp .45s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.7s;}
 @keyframes lrStamp{0%{opacity:0;transform:rotate(-15deg) scale(2.4);}60%{opacity:1;transform:rotate(-15deg) scale(.92);}100%{opacity:1;transform:rotate(-15deg) scale(1);}}
 .lr-flash{position:absolute;inset:0;background:radial-gradient(circle,rgba(48,209,88,.45),transparent 60%);opacity:0;}
 .lr-bg.on .lr-flash{animation:lrFlash .5s ease-out;animation-delay:.68s;}
 @keyframes lrFlash{0%{opacity:.9;}100%{opacity:0;}}
 .pc-stage{perspective:1200px;width:300px;height:454px;margin:6px auto 0;}
 .pc-card{position:relative;width:100%;height:100%;border-radius:22px;transform-style:preserve-3d;transition:transform .12s ease-out;cursor:pointer;}
 .pc-card.flip{transition:transform .7s cubic-bezier(.2,.8,.2,1);transform:rotateY(180deg);}
 .pc-face{position:absolute;inset:0;border-radius:22px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;display:flex;flex-direction:column;transition:opacity 0s linear .35s;}
 .pc-front{opacity:1;}
 .pc-back{transform:rotateY(180deg);opacity:0;}
 .pc-card.flip .pc-front{opacity:0;}
 .pc-card.flip .pc-back{opacity:1;}
 .pc-skin-bronze{background:linear-gradient(160deg,#5a3a22,#241509);}
 .pc-skin-silver{background:linear-gradient(160deg,#5c6573,#202730);}
 .pc-skin-gold{background:linear-gradient(160deg,#7c6320,#2a2009);}
 .pc-skin-legend{background:linear-gradient(160deg,#16284f,#0a1030);}
 .pc-bd-bronze{border:1.5px solid rgba(220,150,90,.6);}
 .pc-bd-silver{border:1.5px solid rgba(205,216,232,.55);}
 .pc-bd-gold{border:1.5px solid rgba(245,210,110,.75);}
 .pc-bd-legend{border:1.5px solid rgba(120,170,255,.75);box-shadow:0 0 30px -6px rgba(10,132,255,.6);}
 .pc-holo{position:absolute;inset:0;border-radius:22px;pointer-events:none;mix-blend-mode:color-dodge;opacity:.5;background:repeating-linear-gradient(115deg,rgba(255,0,128,.22) 0%,rgba(0,225,255,.22) 12%,rgba(120,255,120,.22) 24%,rgba(255,235,0,.22) 36%,rgba(255,0,128,.22) 48%);background-size:300% 300%;background-position:0% 50%;animation:pcHolo 6s ease-in-out infinite alternate;}
 .pc-holo.legend{opacity:.62;}
 .pc-card.act .pc-holo{animation:none;background-position:calc(var(--mx,50%)) calc(var(--my,50%));}
 @keyframes pcHolo{0%{background-position:18% 30%;}100%{background-position:82% 70%;}}
 .pc-glare{position:absolute;inset:0;border-radius:22px;pointer-events:none;mix-blend-mode:overlay;opacity:0;transition:opacity .3s;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.5),transparent 45%);}
 .pc-card.act .pc-glare{opacity:1;}
 .pc-pad{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;padding:15px 16px 13px;}
 .pc-toprow{display:flex;justify-content:space-between;align-items:flex-start;}
 .pc-ovr{display:flex;flex-direction:column;align-items:center;line-height:.86;}
 .pc-num{font-size:46px;font-weight:900;letter-spacing:-2px;text-shadow:0 2px 10px rgba(0,0,0,.45);}
 .pc-lab{font-size:10px;font-weight:800;letter-spacing:.14em;opacity:.85;margin-top:3px;}
 .pc-tierbadge{font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:4px 9px;border-radius:6px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.28);display:inline-block;}
 .pc-arch{font-size:11px;font-weight:800;letter-spacing:.06em;opacity:.95;margin-top:6px;text-transform:uppercase;}
 .pc-avatar{margin:6px auto 0;width:104px;height:104px;border-radius:50%;background:radial-gradient(circle at 38% 30%,rgba(255,255,255,.22),rgba(0,0,0,.28));border:1px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900;letter-spacing:-1px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4);}
 .pc-name{text-align:center;font-size:23px;font-weight:900;letter-spacing:.04em;margin-top:6px;text-transform:uppercase;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4);}
 .pc-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);margin:8px 0;}
 .pc-stats{display:flex;justify-content:space-around;text-align:center;}
 .pc-v{font-size:17px;font-weight:900;letter-spacing:-.5px;color:#fff;}
 .pc-k{font-size:8px;font-weight:800;letter-spacing:.08em;opacity:.7;text-transform:uppercase;margin-top:1px;}
 .pc-badges{display:flex;justify-content:space-between;margin-top:13px;}
 .pc-bdg{display:flex;flex-direction:column;align-items:center;gap:4px;width:50px;cursor:pointer;}
 .pc-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
 .pc-bdg.on .pc-ic{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.32);}
 .pc-bdg.off .pc-ic{background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.08);}
 .pc-nm{font-size:7.5px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;text-align:center;line-height:1.05;}
 .pc-bdg.off{opacity:.4;}
 .pc-footrow{margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding-top:9px;font-size:9px;font-weight:800;letter-spacing:.08em;opacity:.6;color:#fff;}
 .pc-bh{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.85;text-align:center;margin:2px 0 10px;color:#fff;}
 .pc-brow{display:flex;justify-content:space-between;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.12);font-size:12.5px;color:#fff;}
 .pc-bk{font-weight:600;opacity:.8;} .pc-bv{font-weight:900;}
 .pc-actions{display:flex;gap:10px;margin:16px auto 0;width:300px;}
 .pc-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font-size:13px;font-weight:800;padding:11px;border-radius:12px;cursor:pointer;border:none;}
 .pc-btn.share{background:#0A84FF;color:#fff;box-shadow:0 8px 22px -8px rgba(10,132,255,.7);}
 .pc-btn.flip{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12);}
 .pc-bsheet-bg{position:fixed;inset:0;z-index:99998;background:rgba(2,3,8,.6);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center;}
 .pc-bsheet{width:390px;max-width:100vw;background:#15151b;border-top-left-radius:20px;border-top-right-radius:20px;border:1px solid rgba(255,255,255,.1);border-bottom:none;padding:8px 20px 30px;animation:pcSheetUp .25s cubic-bezier(.2,.8,.2,1);}
 @keyframes pcSheetUp{from{transform:translateY(40px);}to{transform:translateY(0);}}
 .pc-grip{width:38px;height:4px;border-radius:3px;background:rgba(255,255,255,.2);margin:6px auto 16px;}
 .pc-bs-top{display:flex;align-items:center;gap:14px;}
 .pc-bs-ic{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
 .pc-bs-nm{font-size:18px;font-weight:900;color:#fff;}
 .pc-bs-st{font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;}
 .pc-bs-desc{font-size:13.5px;color:rgba(255,255,255,.65);margin:16px 0 14px;line-height:1.45;}
 .pc-bs-track{height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;}
 .pc-bs-fill{height:100%;border-radius:5px;}
 .pc-bs-prog{display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;margin-top:8px;color:#fff;}
 .pc-toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1c1c22;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:11px 18px;font-size:13px;font-weight:700;color:#fff;z-index:99999;}
 .brk-scroll{overflow-x:auto;overflow-y:hidden;padding:4px 2px 10px;-webkit-overflow-scrolling:touch;}
 .brk-tree{display:flex;gap:36px;width:max-content;height:500px;}
 .brk-round{display:flex;flex-direction:column;justify-content:space-around;min-width:150px;position:relative;padding-top:18px;}
 .brk-rhead{position:absolute;top:0;left:0;right:0;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);}
 .brk-cell{position:relative;display:flex;align-items:center;}
 .brk-match{position:relative;width:100%;background:linear-gradient(160deg,#16161d,#0e0e13);border:1px solid rgba(255,255,255,.08);border-radius:11px;overflow:hidden;cursor:pointer;transition:transform .12s;}
 .brk-match:active{transform:scale(.97);}
 .brk-match.you{border-color:rgba(10,132,255,.55);box-shadow:0 0 16px -6px rgba(10,132,255,.6);}
 .brk-match.dead{cursor:default;}
 .brk-seat{display:flex;align-items:center;gap:6px;padding:8px 9px;}
 .brk-seat+.brk-seat{border-top:1px solid rgba(255,255,255,.07);}
 .brk-sd{font-size:9px;font-weight:800;color:rgba(255,255,255,.32);width:12px;flex-shrink:0;}
 .brk-nm{font-size:12px;font-weight:800;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 .brk-pts{font-size:11.5px;font-weight:800;font-variant-numeric:tabular-nums;}
 .brk-seat.win .brk-pts{color:#30D158;}
 .brk-seat.lose{opacity:.4;} .brk-seat.lose .brk-nm{text-decoration:line-through;text-decoration-color:rgba(255,255,255,.3);}
 .brk-seat.tbd .brk-nm{color:rgba(255,255,255,.3);font-style:italic;font-weight:700;}
 .brk-lock{margin-left:2px;flex-shrink:0;}
 .brk-conn{position:absolute;left:100%;width:18px;box-sizing:border-box;border-right:2px solid rgba(255,255,255,.16);}
 .brk-conn.down{top:50%;border-bottom:2px solid rgba(255,255,255,.16);}
 .brk-conn.up{bottom:50%;border-top:2px solid rgba(255,255,255,.16);}
 .brk-connf{position:absolute;left:100%;top:50%;width:18px;height:2px;background:rgba(255,255,255,.16);}
 .brk-stub{position:absolute;right:100%;top:50%;width:18px;height:2px;background:rgba(255,255,255,.16);}
 .brk-champ{display:flex;flex-direction:column;justify-content:center;min-width:150px;position:relative;padding-top:18px;}
 .brk-cup{position:relative;border-radius:15px;padding:18px 12px;text-align:center;border:1.5px solid rgba(255,214,10,.5);background:linear-gradient(165deg,#2a230a,#12100a);box-shadow:0 0 30px -10px rgba(255,214,10,.5);}
 .brk-cup .lab{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#FFD60A;margin-top:8px;}
 .brk-cup .cn{font-size:16px;font-weight:900;margin-top:5px;}
 .brk-cup .cn.tbd{color:rgba(255,255,255,.4);font-style:italic;}
 .bmd-bg{position:fixed;inset:0;z-index:9600;background:rgba(2,3,8,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;}
 .bmd{width:390px;max-width:100vw;max-height:88vh;overflow-y:auto;background:#111;border-radius:22px 22px 0 0;border:1px solid rgba(255,255,255,.1);animation:bmdUp .26s cubic-bezier(.2,.8,.2,1);padding-bottom:30px;}
 @keyframes bmdUp{from{transform:translateY(40px);}to{transform:translateY(0);}}
 .bmd-grip{width:38px;height:4px;border-radius:3px;background:rgba(255,255,255,.2);margin:10px auto 8px;}
 .bmd-rd{text-align:center;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:12px;}
 .bmd-score{display:flex;align-items:center;justify-content:center;gap:10px;padding:0 18px 16px;border-bottom:1px solid rgba(255,255,255,.08);}
 .bmd-side{flex:1;text-align:center;min-width:0;}
 .bmd-side .n{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 .bmd-side .pp{font-size:32px;font-weight:900;letter-spacing:-1px;margin-top:2px;}
 .bmd-side.win .pp{color:#30D158;} .bmd-side.lose{opacity:.45;}
 .bmd-vs{font-size:11px;font-weight:800;color:rgba(255,255,255,.3);flex-shrink:0;}
 .bmd-sec{padding:14px 16px 2px;}
 .bmd-sech{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
 .bmd-sech .nm{font-size:13px;font-weight:900;display:inline-flex;align-items:center;gap:6px;}
 .bmd-tag{font-size:8px;font-weight:900;letter-spacing:.06em;padding:2px 6px;border-radius:5px;}
 .bmd-sech .tot{font-size:14px;font-weight:900;}
 .bmd-row{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06);}
 .bmd-chip{font-size:8px;font-weight:800;padding:3px 0;border-radius:5px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.55);flex-shrink:0;width:42px;text-align:center;}
 .bmd-pk{flex:1;min-width:0;}
 .bmd-pk .pn{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 .bmd-pk .ps{font-size:10px;color:rgba(255,255,255,.38);margin-top:1px;}
 .bmd-res{text-align:right;flex-shrink:0;min-width:52px;}
 .bmd-res .rp{font-size:13px;font-weight:800;}
 .bmd-res .rl{font-size:8.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin-top:1px;}
 .bmd-empty{padding:30px 20px;text-align:center;color:rgba(255,255,255,.4);font-size:13px;}
 @keyframes brkPop{from{opacity:0;transform:translateY(10px) scale(.95);}to{opacity:1;transform:none;}}
 .brk-cell{animation:brkPop .5s both;}
 @keyframes brkLockPop{0%{transform:scale(0) rotate(-25deg);}60%{transform:scale(1.35);}100%{transform:scale(1) rotate(0);}}
 .brk-lock{animation:brkLockPop .55s .2s both;transform-origin:center;}
 .brk-match.live{border-color:rgba(48,209,88,.5);animation:brkLiveGlow 1.9s ease-in-out infinite;}
 @keyframes brkLiveGlow{0%,100%{box-shadow:0 0 0 0 rgba(48,209,88,0);}50%{box-shadow:0 0 15px -3px rgba(48,209,88,.6);}}
 .brk-livedot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#30D158;margin-right:4px;animation:brkPulse 1.2s infinite;}
 @keyframes brkPulse{0%,100%{opacity:1;}50%{opacity:.25;}}
 .brk-cup.live{cursor:pointer;animation:brkPop .5s both, brkCupGlow 2.2s ease-in-out infinite 1s;}
 @keyframes brkCupGlow{0%,100%{box-shadow:0 0 30px -10px rgba(255,214,10,.5);}50%{box-shadow:0 0 44px -6px rgba(255,214,10,.9);}}
 .brk-cup .tap{font-size:8px;font-weight:800;letter-spacing:.08em;color:rgba(255,214,10,.7);margin-top:7px;text-transform:uppercase;}
 .champ-bg{position:fixed;inset:0;z-index:9700;background:radial-gradient(120% 80% at 50% 0%,#241d06,#08060a 72%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;animation:bmdFade .3s;overflow:hidden;}
 @keyframes bmdFade{from{opacity:0;}to{opacity:1;}}
 .champ-x{position:absolute;top:18px;right:18px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;}
 @keyframes champRise{from{opacity:0;transform:translateY(22px) scale(.7);}to{opacity:1;transform:none;}}
 .champ-crown{animation:champRise .7s cubic-bezier(.2,.9,.3,1.5) both;}
 .champ-lab{font-size:13px;font-weight:900;letter-spacing:.22em;color:#FFD60A;text-transform:uppercase;margin-top:18px;animation:champRise .7s .12s both;}
 .champ-name{font-size:34px;font-weight:900;letter-spacing:-1px;margin-top:8px;animation:champRise .7s .22s both;}
 .champ-sub{font-size:13px;color:rgba(255,255,255,.5);margin-top:8px;animation:champRise .7s .32s both;}
 .champ-share{margin-top:32px;background:linear-gradient(90deg,#FFD60A,#ffb800);color:#1a1500;font-size:15px;font-weight:900;border:none;border-radius:14px;padding:14px 32px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;animation:champRise .7s .42s both;}
 .app-grain{position:absolute;inset:0;pointer-events:none;z-index:60;opacity:.04;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
 .app-glow{position:absolute;top:0;left:0;right:0;height:240px;pointer-events:none;z-index:0;background:radial-gradient(78% 150px at 50% -30px,rgba(10,132,255,0.12),transparent 72%);}
 .phone{background:radial-gradient(125% 72% at 50% -8%, #0c1426 0%, #060608 52%)!important;}
 .phone::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:46;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:170px 170px;}
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
 .sheet-search{width:100%;background:rgba(255,255,255,0.08);border:none;border-radius:10px;padding:9px 14px 9px 40px;font-family:'Barlow',sans-serif;font-size:15px;color:#fff;outline:none;}
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
 .ticker-item{display:inline-flex;align-items:center;gap:7px;padding:0 22px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.02em;font-family:'Barlow',sans-serif;}
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
 .pu-use-btn{background:${IOS.fill2};border:none;border-radius:8px;padding:7px 14px;font-family:'Barlow',sans-serif;font-size:13px;font-weight:600;color:${IOS.blue};cursor:pointer;white-space:nowrap;flex-shrink:0;}

 /* Wheel */
 .wheel-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.96);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;}
 .wheel-hdr{text-align:center;margin-bottom:24px;}
 .wheel-hdr-title{font-size:28px;font-weight:700;letter-spacing:-0.5px;}
 .wheel-hdr-sub{font-size:15px;color:${IOS.label3};margin-top:4px;}
 .wheel-wrap{position:relative;width:280px;height:280px;margin-bottom:28px;}
 .wheel-pointer{position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:22px solid #fff;z-index:10;filter:drop-shadow(0 2px 6px rgba(255,255,255,0.3));}
 .spin-ios-btn{background:${IOS.blue};color:#fff;border:none;border-radius:14px;padding:16px 48px;font-family:'Barlow',sans-serif;font-size:17px;font-weight:600;cursor:pointer;letter-spacing:-0.3px;transition:opacity .15s;}
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
 .chat-field{flex:1;background:${IOS.bg3};border:none;border-radius:20px;padding:10px 16px;font-family:'Barlow',sans-serif;font-size:15px;color:#fff;outline:none;letter-spacing:-0.2px;}
 .chat-field::placeholder{color:${IOS.label3};}
 .chat-send{width:34px;height:34px;border-radius:50%;background:${IOS.blue};border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
 .chat-send:active{opacity:0.8;}
 .chat-send:disabled{background:${IOS.bg3};cursor:default;}

 @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
 @keyframes spin{to{transform:rotate(360deg);}}
 @keyframes champSweep{0%{transform:translateX(-120%);}100%{transform:translateX(220%);}}
 @keyframes champGlow{0%,100%{box-shadow:0 4px 22px rgba(255,193,7,0.18);}50%{box-shadow:0 4px 30px rgba(255,193,7,0.34);}}

 /* iOS Tab Bar */
 .tab-bar{flex-shrink:0;background:rgba(28,28,30,0.92);backdrop-filter:blur(20px) saturate(180%);border-top:0.5px solid rgba(255,255,255,0.08);display:flex;padding:8px 0;padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));position:sticky;bottom:0;z-index:20;}
 .tab-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 0;transition:opacity .15s;}
 .tab-item:active{opacity:0.6;}
 .tab-icon{font-size:22px;line-height:1;}
 .tab-label{font-size:10px;font-weight:500;letter-spacing:-0.2px;color:${IOS.gray};}
 .tab-item.on .tab-label{color:${IOS.blue};}

 /* Auth screen */
 @keyframes authRise{0%{transform:translateY(0);opacity:0;}12%{opacity:0.55;}80%{opacity:0.5;}100%{transform:translateY(-130px);opacity:0;}}
 @keyframes authGlow{0%,100%{filter:drop-shadow(0 0 16px rgba(10,132,255,0.45));}50%{filter:drop-shadow(0 0 30px rgba(10,132,255,0.7));}}
 .auth-input{width:100%;background:rgba(255,255,255,0.045);border:0.5px solid rgba(255,255,255,0.12);border-radius:13px;padding:15px 16px;color:#fff;font-size:15px;font-family:'Barlow',sans-serif;outline:none;transition:border-color .18s, box-shadow .18s;box-sizing:border-box;}
 .auth-input::placeholder{color:rgba(255,255,255,0.32);}
 .auth-input:focus{border-color:rgba(10,132,255,0.7);box-shadow:0 0 0 3px rgba(10,132,255,0.14);}
 .auth-cta{width:100%;border:none;border-radius:13px;padding:16px;font-size:16px;font-weight:800;cursor:pointer;font-family:'Barlow',sans-serif;color:#fff;background:linear-gradient(135deg,#0A84FF,#5E5CE6);box-shadow:0 8px 26px rgba(10,132,255,0.4);transition:transform .12s, box-shadow .2s;letter-spacing:0.2px;}
 .auth-cta:active{transform:scale(0.985);box-shadow:0 4px 16px rgba(10,132,255,0.3);}
 .auth-chip{position:absolute;font-family:'Barlow',sans-serif;font-weight:800;font-size:13px;padding:6px 11px;border-radius:9px;white-space:nowrap;pointer-events:none;will-change:transform,opacity;}
 `;

 return (
 <div style={{minHeight:"100vh",background:"#111",display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
 <style>{css}</style>

 {/* ══ TUTORIAL OVERLAY ══ */}
 {user && tutorialStep >= 0 && (()=>{
 const isLast = tutorialStep === 3;
 const dismissOnboard = () => { setTutorialStep(-1); try{localStorage.setItem("picklock_onboarded","true");}catch(e){} };
 const SCREENS = [
 // Screen 1 — Welcome
 () => (
 <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"0 28px 48px"}}>
   <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
     <div style={{width:80,height:80,borderRadius:24,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
       <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
     </div>
     <div style={{fontSize:32,fontWeight:800,color:"#fff",letterSpacing:-1,marginBottom:12,lineHeight:1.1}}>Welcome to{"\n"}PickLock</div>
     <div style={{fontSize:15,color:"rgba(255,255,255,0.5)",lineHeight:1.7,maxWidth:300}}>The pick-em league app built for friends. Lock in picks every week and see who&apos;s really got the best calls.</div>
   </div>
   <div style={{width:"100%"}}>
     <button onClick={()=>setTutorialStep(1)} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif",marginBottom:10}}>Let&apos;s Go</button>
     <button onClick={dismissOnboard} style={{width:"100%",background:"none",border:"none",padding:"10px",fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.35)",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>I already have an account</button>
   </div>
 </div>
 ),
 // Screen 2 — The Slip
 () => (
 <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 24px 48px"}}>
   <div style={{textAlign:"center",marginBottom:24}}>
     <div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-.5,marginBottom:8}}>Build your slip every week</div>
     <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>5 picks. 5 bet types. Higher multiplier = more points if you win.</div>
   </div>
   <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
     {[
       {mult:"1×",cat:"Moneyline",pick:"Seattle Seahawks",odds:"-205",game:"NE @ SEA",pts:"+4.9 pts if win",catColor:"#0A84FF",highlight:false},
       {mult:"3×",cat:"Over/Under",pick:"Over 44.5",odds:"-110",game:"BUF @ MIA",pts:"+27.3 pts if win",catColor:"#FF9F0A",highlight:false},
       {mult:"5×",cat:"Longshot",pick:"3-leg parlay",odds:"+583",game:"Go big or go home",pts:"+291.5 pts if win",catColor:"#FF375F",highlight:true},
     ].map((s,i)=>(
       <div key={i} style={{background:s.highlight?"rgba(10,132,255,0.06)":"#0D1A2A",border:`0.5px solid ${s.highlight?"rgba(10,132,255,0.3)":"#1A3A5A"}`,borderRadius:12,padding:"12px 14px"}}>
         <div style={{fontSize:9,fontWeight:800,letterSpacing:.5,textTransform:"uppercase",color:s.catColor,marginBottom:4}}>{s.mult} · {s.cat}</div>
         <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
           <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{s.pick}</div>
           <div style={{fontSize:14,fontWeight:800,color:s.highlight?"#30D158":s.catColor}}>{s.odds}</div>
         </div>
         <div style={{display:"flex",justifyContent:"space-between"}}>
           <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{s.game}</div>
           <div style={{fontSize:10,color:s.highlight?"#30D158":s.catColor,fontWeight:700}}>{s.pts}</div>
         </div>
       </div>
     ))}
   </div>
   <button onClick={()=>setTutorialStep(2)} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Next</button>
 </div>
 ),
 // Screen 3 — Leagues
 () => (
 <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"0 28px 48px"}}>
   <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
     <div style={{width:80,height:80,borderRadius:24,background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.3)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
       <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
     </div>
     <div style={{fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-.5,marginBottom:12,lineHeight:1.15}}>Compete with your crew</div>
     <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.7,marginBottom:28}}>Create a private league or join a public one. Weekly matchups, standings, and a championship at the end.</div>
     <div style={{width:"100%",background:"#111",border:"0.5px solid #1E1E1E",borderRadius:12,padding:"14px 16px",textAlign:"left"}}>
       <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:.5,marginBottom:12}}>League formats</div>
       <div style={{display:"flex",flexDirection:"column",gap:10}}>
         {[
           {icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label:"Head-to-head + playoffs"},
           {icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label:"Total points all season"},
           {icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>, label:"Single elimination bracket"},
         ].map((f,i)=>(
           <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
             <div style={{width:28,height:28,borderRadius:8,background:"rgba(10,132,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{f.icon}</div>
             <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:600}}>{f.label}</div>
           </div>
         ))}
       </div>
     </div>
   </div>
   <div style={{width:"100%",marginTop:24}}>
     <button onClick={()=>setTutorialStep(3)} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"16px",fontSize:16,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Next</button>
   </div>
 </div>
 ),
 // Screen 4 — Get Started
 () => (
 <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"0 28px 48px"}}>
   <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
     <div style={{width:80,height:80,borderRadius:24,background:"rgba(255,159,10,0.1)",border:"0.5px solid rgba(255,159,10,0.3)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
       <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
     </div>
     <div style={{fontSize:28,fontWeight:800,color:"#fff",letterSpacing:-.5,marginBottom:12}}>Ready to lock in?</div>
     <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.7,maxWidth:300}}>Create a league with friends, join a public one, or go solo and track your own picks first.</div>
   </div>
   <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
     <button onClick={()=>{dismissOnboard();setScreen("leagues");setShowNewLeague(true);setNewLeagueCreated(null);setNewLeagueSport(null);setNewLeagueName("");setNewLeagueSize(8);setNewLeagueStep(0);}} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"15px",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Create a League</button>
     <button onClick={()=>{dismissOnboard();setShowBrowse(true);fetchPublicLeagues();}} style={{width:"100%",background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.3)",borderRadius:14,padding:"15px",fontSize:15,fontWeight:700,color:IOS.blue,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Browse Public Leagues</button>
     <button onClick={dismissOnboard} style={{width:"100%",background:"none",border:"none",padding:"12px",fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.35)",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Go Solo for now</button>
   </div>
 </div>
 ),
 ];
 const CurrentScreen = SCREENS[tutorialStep];
 return (
 <div style={{position:"fixed",inset:0,zIndex:9999,background:"#000",display:"flex",flexDirection:"column",fontFamily:"Barlow,sans-serif"}}>
   {/* Top bar — skip + dots */}
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"56px 24px 20px"}}>
     <div style={{display:"flex",gap:5}}>
       {[0,1,2,3].map(i=>(
         <div key={i} style={{width:i===tutorialStep?20:6,height:6,borderRadius:3,background:i===tutorialStep?IOS.blue:"rgba(255,255,255,0.15)",transition:"all 0.25s"}}/>
       ))}
     </div>
     {tutorialStep < 3 && (
       <div onClick={dismissOnboard} style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.35)",cursor:"pointer",padding:"6px 12px",background:"rgba(255,255,255,0.06)",borderRadius:10}}>Skip</div>
     )}
   </div>
   {/* Back button for steps 1-2 */}
   {tutorialStep > 0 && tutorialStep < 3 && (
     <div onClick={()=>setTutorialStep(s=>s-1)} style={{padding:"0 24px 12px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:13,fontWeight:600}}>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
       Back
     </div>
   )}
   <CurrentScreen/>
 </div>
 );
 })()}

 {/* ══ AUTH SCREEN ══ */}
 {!user && (
 <div style={{position:"relative",width:"100%",maxWidth:480,margin:"0 auto",boxSizing:"border-box",minHeight:"100dvh",overflowY:"auto",overflowX:"hidden",background:"radial-gradient(120% 70% at 50% -10%, rgba(10,132,255,0.18), transparent 55%), radial-gradient(85% 50% at 85% 112%, rgba(94,92,230,0.16), transparent 60%), #07070C",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"calc(env(safe-area-inset-top) + 30px) 28px calc(env(safe-area-inset-bottom) + 30px)",fontFamily:"'Barlow',sans-serif"}}>

 {/* Floating odds chips */}
 <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
 {[
 {l:"+150",c:"#0A84FF",x:"7%",d:0,t:11},{l:"KC -3.5",c:"#30D158",x:"24%",d:2.5,t:13},
 {l:"O 47.5",c:"#FF9F0A",x:"68%",d:1,t:12},{l:"PARLAY x5",c:"#FF375F",x:"83%",d:4,t:14},
 {l:"-110",c:"#0A84FF",x:"50%",d:6,t:10},{l:"LAD ML",c:"#30D158",x:"37%",d:3,t:13},
 {l:"U 8.5",c:"#FF9F0A",x:"13%",d:7.5,t:12},{l:"+650",c:"#FF375F",x:"60%",d:5,t:15},
 {l:"27 PTS",c:"#FFD60A",x:"90%",d:2,t:11},{l:"BUF -7",c:"#30D158",x:"3%",d:8.5,t:14},
 {l:"+200",c:"#0A84FF",x:"76%",d:9.5,t:12},{l:"LOCK",c:"#FFD60A",x:"45%",d:10.5,t:13}
 ].map((c,i)=>(
 <div key={i} className="auth-chip" style={{left:c.x,bottom:"-8%",color:c.c,background:c.c+"1A",border:"0.5px solid "+c.c+"44",animation:"authRise "+c.t+"s ease-in-out "+c.d+"s infinite"}}>{c.l}</div>
 ))}
 </div>

 {/* Scrolling odds ticker */}
 <div style={{position:"relative",width:"100%",marginBottom:22,overflow:"hidden",opacity:0.5,pointerEvents:"none",WebkitMaskImage:"linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)",maskImage:"linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)"}}>
 <div style={{display:"inline-flex",gap:24,whiteSpace:"nowrap",animation:"ticker-scroll 26s linear infinite"}}>
 {[{t:"NBA FINALS · NYK +120",c:"#0A84FF"},{t:"MLB · LAD -145",c:"#30D158"},{t:"NFL · KC -3.5",c:"#FF9F0A"},{t:"PARLAY HIT +1240",c:"#FF375F"},{t:"NHL · BOS ML -130",c:"#64D2FF"},{t:"O/U 47.5",c:"#FFD60A"},
 {t:"NBA FINALS · NYK +120",c:"#0A84FF"},{t:"MLB · LAD -145",c:"#30D158"},{t:"NFL · KC -3.5",c:"#FF9F0A"},{t:"PARLAY HIT +1240",c:"#FF375F"},{t:"NHL · BOS ML -130",c:"#64D2FF"},{t:"O/U 47.5",c:"#FFD60A"}
 ].map((s,i)=>(<span key={i} style={{fontSize:12,fontWeight:800,letterSpacing:"0.04em",color:s.c}}>{s.t}</span>))}
 </div>
 </div>

 {/* Brand */}
 <div style={{position:"relative",textAlign:"center",marginBottom:30}}>
 <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:9}}>
 <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 10px rgba(10,132,255,0.6))"}}><rect x="3" y="11" width="18" height="11" rx="2.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 <div style={{fontSize:40,fontWeight:900,letterSpacing:-1.5,lineHeight:1.1,display:"inline-block",padding:"6px 12px 12px",backgroundImage:"linear-gradient(135deg,#0A84FF,#64D2FF)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",animation:"authGlow 3.6s ease-in-out infinite"}}>PICKLOCK</div>
 </div>
 <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontWeight:500}}>Make your picks. Climb the board. Talk trash.</div>
 </div>

 {/* Glass form card */}
 <div style={{position:"relative",width:"100%",background:"linear-gradient(160deg,rgba(22,22,28,0.82),rgba(11,11,14,0.9))",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:22,boxShadow:"0 18px 50px rgba(0,0,0,0.55)",padding:"22px 20px"}}>
 <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:12,padding:3,marginBottom:18}}>
 {["login","signup"].map(t=>(
 <div key={t} onClick={()=>setAuthScreen(t)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:9,fontSize:14,fontWeight:800,cursor:"pointer",background:authScreen===t?"linear-gradient(135deg,rgba(10,132,255,0.95),rgba(94,92,230,0.85))":"transparent",color:authScreen===t?"#fff":"rgba(255,255,255,0.45)",boxShadow:authScreen===t?"0 4px 14px rgba(10,132,255,0.3)":"none",transition:"all .2s"}}>{t==="login"?"Sign In":"Sign Up"}</div>
 ))}
 </div>
 <input id="auth-email" className="auth-input" type="email" placeholder="Email" style={{marginBottom:11}}/>
 <input id="auth-password" className="auth-input" type="password" placeholder="Password" style={{marginBottom:11}}/>
 {authScreen==="signup"&&<input id="auth-username" className="auth-input" type="text" placeholder="Username (e.g. sharpshooter99)" style={{marginBottom:7}}/>}
 {authScreen==="signup"&&<div style={{fontSize:11,color:"rgba(255,255,255,0.32)",marginBottom:15,paddingLeft:4}}>This is how you'll appear to other players</div>}
 {authScreen==="login"&&<div style={{height:16}}/>}
 <button className="auth-cta" onClick={async()=>{
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
 const {data:existing}=await supabase.from("users").select("id").eq("username",username).maybeSingle();
 if(existing){ alert("That username is taken. Try another."); return; }
 const {data,error}=await supabase.auth.signUp({email,password});
 if(error){ alert(error.message); return; }
 const uid = data?.user?.id;
 if(uid){
 await supabase.from("users").upsert({id:uid, email, username}, {onConflict:"id"});
 }
 setTutorialStep(0);
 }}}>{authScreen==="login"?"Sign In":"Create Account"}</button>
 <div onClick={()=>setAuthScreen(authScreen==="login"?"signup":"login")} style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.4)",cursor:"pointer",marginTop:16}}>{authScreen==="login"?"No account? Sign up":"Already have an account? Sign in"}</div>
 </div>

 {/* Trust line */}
 <div style={{position:"relative",marginTop:22,display:"flex",alignItems:"center",gap:8,fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.32)"}}>
 <span style={{width:6,height:6,borderRadius:"50%",background:"#30D158",boxShadow:"0 0 8px #30D158"}}/>NFL · NBA · MLB · NHL <span style={{color:"rgba(255,255,255,0.2)"}}>·</span> Free to play
 </div>
 </div>
 )}

 {user && <div className="phone"><div className="app-glow"/><div className="app-grain"/><Confetti show={celebrate}/>
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
 {secondSwap && (
 <div className="pu-modal-bg" onClick={()=>setSecondSwap(null)}>
 <div className="pu-modal-sheet" onClick={e=>e.stopPropagation()}>
 <div className="pu-modal-handle"/>
 <div className="pu-modal-hdr">
 <div className="pu-modal-title">Second Chance</div>
 <div className="pu-modal-sub">Bail your live pick into an unstarted game — scores half points if it hits</div>
 </div>
 {(()=>{
 const cat = secondSwap.category||"ml";
 const cands = (BETS[cat]||[]).filter(b=> b.game !== secondSwap.pick.game).slice(0,40);
 return cands.length===0
 ? <div style={{padding:"28px 20px",textAlign:"center",color:IOS.label3,fontSize:15}}>No unstarted {cat.toUpperCase()} bets available right now</div>
 : <div style={{maxHeight:380,overflowY:"auto"}}>{cands.map((b,i)=>(
 <div key={i} className="pu-opt" onClick={()=>doSecondSwap(secondSwap.pick, b)}>
 <div style={{flex:1,minWidth:0}}>
 <div className="pu-opt-name">{b.pick}</div>
 <div className="pu-opt-desc">{b.game}</div>
 </div>
 <div style={{fontSize:13,fontWeight:800,color:(b.odds&&b.odds.startsWith("+"))?IOS.green:IOS.blue,flexShrink:0,marginLeft:8}}>{b.odds}</div>
 </div>
 ))}</div>;
 })()}
 <div style={{padding:"14px 20px 0"}}>
 <button onClick={()=>setSecondSwap(null)} style={{width:"100%",background:IOS.bg3,border:"none",borderRadius:12,padding:"14px",fontFamily:"Barlow,sans-serif",fontSize:15,fontWeight:600,color:IOS.label2,cursor:"pointer"}}>Cancel</button>
 </div>
 </div>
 </div>
 )}
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
 ? myPUs.filter(pu=>pu.id!=="second" && puAppliesTo(pu.id, showPUModal.category, showPUModal.isParlay))
 : myPUs;
 return filteredPUs.length===0
 ? <div style={{padding:"28px 20px",textAlign:"center",color:IOS.label3,fontSize:15}}>No power-ups apply to this pick</div>
 : filteredPUs.map((pu,i)=>(
 <div key={i} className="pu-opt" onClick={()=>usePU(pu, showPUModal.context, showPUModal.context==="picks"?showPUModal.slotId:showPUModal.pickIdx)}>
 <div className="pu-opt-icon" style={{background:`${pu.color}20`}}>{puSVG(pu.id,pu.color)}</div>
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
 <button onClick={()=>setShowPUModal(null)} style={{width:"100%",background:IOS.bg3,border:"none",borderRadius:12,padding:"14px",fontFamily:"Barlow,sans-serif",fontSize:15,fontWeight:600,color:IOS.label2,cursor:"pointer"}}>Cancel</button>
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
 fontFamily:"'Barlow',sans-serif",
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
 font-family: 'Barlow',sans-serif; font-size: 18px; font-weight: 800;
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
 <div className="ts-trophy" style={{fontSize:90,lineHeight:1,marginBottom:28}}></div>

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
 Spin the Wheel
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
 <div className="win-icon">{puSVG(wonPU.id,wonPU.color)}</div>
 <div className="win-got">You won a power-up</div>
 <div className="win-name">{wonPU.name}</div>
 <div className="win-rarity-pill" style={{background:`${wonPU.color}20`,color:wonPU.color,border:`1px solid ${wonPU.color}40`}}>
 {wonPU.rarity==="legendary"?" Legendary":wonPU.rarity==="rare"?" Rare":"● Common"}
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
 <div style={{fontSize:32,textAlign:"center",marginBottom:8}}></div>
 <div style={{fontSize:22,fontWeight:800,color:"#fff",textAlign:"center",marginBottom:6}}>Welcome to PickLock</div>
 <div style={{fontSize:14,color:IOS.label3,textAlign:"center",marginBottom:24,lineHeight:1.5}}>Set a username so your league mates can find you and see your picks.</div>
 <input
 value={usernamePromptInput}
 onChange={e=>{setUsernamePromptInput(e.target.value);setUsernamePromptError("");}}
 placeholder="Choose a username..."
 autoFocus
 style={{width:"100%",background:"#1C1C1E",border:`1.5px solid ${usernamePromptError?IOS.red:IOS.blue}`,borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Barlow,sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}
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
 }} style={{width:"100%",background:usernamePromptSaving?"rgba(255,255,255,0.1)":IOS.blue,border:"none",borderRadius:12,padding:"14px",fontSize:16,fontWeight:700,color:usernamePromptSaving?"rgba(255,255,255,0.3)":"#fff",cursor:usernamePromptSaving?"default":"pointer",fontFamily:"Barlow,sans-serif",marginBottom:10}}>
 {usernamePromptSaving?"Saving...":"Set Username"}
 </button>
 <div onClick={()=>setShowUsernamePrompt(false)} style={{textAlign:"center",fontSize:13,color:IOS.label3,cursor:"pointer"}}>Skip for now</div>
 </div>
 </div>
 )}

 {(()=>{
 const TAB_SCREENS = homeMode==="solo" ? ["home","picks","solohistory","solostats","profile"] : ["home","picks","matchup","leagues","profile"];
 if(!TAB_SCREENS.includes(screen)) return null;
 const initials = ((userProfile&&userProfile.username)||(user&&user.email)||"U").slice(0,2).toUpperCase();
 return (
 <div className="app-header">
 <div className="gh-left">
 <div className={"gh-switch"+(isSoloMode?" solo":"")} onClick={()=>setShowSwitcher(true)}>
 <span className="gh-nm">{isSoloMode?"Solo Mode":((activeLeague&&activeLeague.name)||"Select league")}</span>
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isSoloMode?"#ffc4d2":"#9fc8ff"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
 </div>
 </div>
 <div className="gh-center"></div>
 <div className="gh-right">
            <div onClick={()=>{ if(!isPro){setShowPaywall("ai");return;} setAiReturn(screen); setScreen("ai"); }} aria-label="Plok" style={{display:"inline-flex",alignItems:"center",gap:5,height:34,padding:"0 11px",borderRadius:17,background:`${IOS.blue}1f`,border:`1px solid ${IOS.blue}3a`,cursor:"pointer"}}><svg width="15" height="15" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg><span style={{fontSize:13,fontWeight:800,color:IOS.blue,letterSpacing:"-0.2px"}}>Plok</span></div>
 {!isSoloMode && <div className="gh-icon" onClick={()=>setScreen("chat")}>
 <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
 {unreadByLeague[activeLeagueId]>0 && <span className="gh-badge">{unreadByLeague[activeLeagueId]>9?"9+":unreadByLeague[activeLeagueId]}</span>}
 </div>}
 <div className="gh-icon" onClick={openNotifs} aria-label="Notifications">
 <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
 {notifUnread>0 && <span className="gh-badge">{notifUnread>9?"9+":notifUnread}</span>}
 </div>
 <div className="gh-avatar" onClick={()=>setShowAccountMenu(true)}>{initials}</div>
 </div>
 </div>
 );
 })()}
 {showSwitcher && (
 <div className="gh-sheet-bg" onClick={()=>setShowSwitcher(false)}>
 <div className="gh-sheet" onClick={e=>e.stopPropagation()}>
 <div className="gh-grip"/>
 <div className="gh-sheet-h">Switch</div>
 <div className="gh-opt" onClick={()=>{setHomeMode("solo");setIsSoloMode(true);try{fetchSoloWeeks();}catch(e){} setScreen("home");setShowSwitcher(false);}}>
 <div className="gh-od" style={{background:"rgba(255,55,95,0.12)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF375F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
 <div style={{flex:1}}><div className="gh-on">Solo Mode</div><div className="gh-osub">Just you, every week</div></div>
 {isSoloMode && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 {realLeagues.map(l=>(
 <div key={l.id} className="gh-opt" onClick={()=>{setHomeMode("leagues");setIsSoloMode(false);setActiveLeagueId(l.id);setScreen("home");setShowSwitcher(false);}}>
 <div className="gh-od" style={{background:"rgba(10,132,255,0.12)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
 <div style={{flex:1}}><div className="gh-on">{l.name}</div><div className="gh-osub">{(SPORTS[l.sport]&&SPORTS[l.sport].label)||"League"}</div></div>
 {!isSoloMode && activeLeagueId===l.id && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 ))}
 </div>
 </div>
 )}
 {showAccountMenu && (
 <div className="gh-sheet-bg" onClick={()=>setShowAccountMenu(false)}>
 <div className="gh-sheet" onClick={e=>e.stopPropagation()}>
 <div className="gh-grip"/>
 <div className="gh-sheet-h">Account</div>
 <div className="gh-opt" onClick={()=>{setScreen("profile");setShowAccountMenu(false);}}>
 <div className="gh-od" style={{background:"rgba(10,132,255,0.12)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
 <div style={{flex:1}}><div className="gh-on">Profile</div><div className="gh-osub">Your stats &amp; badges</div></div>
 </div>
 <div className="gh-opt" onClick={()=>{setScreen("profile");setShowAccountMenu(false);}}>
 <div className="gh-od" style={{background:"rgba(142,142,147,0.18)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
 <div style={{flex:1}}><div className="gh-on">Settings</div><div className="gh-osub">Notifications, season, members</div></div>
 </div>
 <div className="gh-opt" onClick={async()=>{setShowAccountMenu(false); await supabase.auth.signOut();}}>
 <div className="gh-od" style={{background:"rgba(255,55,95,0.12)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF375F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
 <div style={{flex:1}}><div className="gh-on" style={{color:"#FF375F"}}>Sign Out</div><div className="gh-osub">{(user&&user.email)||""}</div></div>
 </div>
 </div>
 </div>
 )}

 {showNotifs && (
 <div className="gh-sheet-bg" onClick={()=>setShowNotifs(false)}>
 <div className="gh-sheet" onClick={e=>e.stopPropagation()}>
 <div className="gh-grip"/>
 <div className="gh-sheet-h">Notifications</div>
 {notifs.length===0 ? (
 <div style={{padding:"26px 16px 30px",textAlign:"center",fontSize:13,color:IOS.label3,lineHeight:1.5}}>You're all caught up. Pick results and league activity show up here.</div>
 ) : (
 <div style={{maxHeight:"58vh",overflowY:"auto"}}>
 {notifs.map(n=>{
   const won=n.type==="pick_win", lost=n.type==="pick_loss";
   const accent=won?IOS.green:lost?IOS.red:IOS.blue;
   const t=n.created_at?new Date(n.created_at):null;
   const mins=t?Math.floor((Date.now()-t.getTime())/60000):0;
   const ago=!t?"":mins<1?"now":mins<60?(mins+"m"):mins<1440?(Math.floor(mins/60)+"h"):(Math.floor(mins/1440)+"d");
   return (
   <div key={n.id} onClick={()=>handleNotifTap(n)} className="gh-opt" style={{opacity:n.read_at?0.62:1}}>
   <div className="gh-od" style={{background:accent+"1f"}}>
   {won?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    :lost?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    :n.type==="plok_call"?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9"/></svg>
    :n.type==="league_recap_share"?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
    :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>}
   </div>
   <div style={{flex:1,minWidth:0}}>
   <div className="gh-on">{n.title}{!n.read_at&&<span style={{display:"inline-block",width:7,height:7,borderRadius:4,background:IOS.blue,marginLeft:6,verticalAlign:"middle"}}/>}</div>
   <div className="gh-osub" style={{whiteSpace:"normal"}}>{n.body}{(n.data&&n.data.league_name)?(" · "+n.data.league_name):""}{ago?(" · "+ago):""}</div>
   </div>
   </div>
   );
 })}
 </div>
 )}
 </div>
 </div>
 )}

 <div className={"lr-bg"+(lockRitual?" on":"")} onClick={()=>setLockRitual(false)}>
 <div className="lr-stage">
 <div className="lr-vault"/>
 <div className="lr-flash"/>
 <div className="lr-lock">
 <svg width="92" height="92" viewBox="0 0 100 100">
 <path className="lr-shk" d="M30 50 V38 a20 20 0 0 1 40 0 V50" fill="none" stroke="#cfd6e6" strokeWidth="9" strokeLinecap="round"/>
 <rect x="24" y="48" width="52" height="42" rx="9" fill="#e7ecf5"/>
 <circle cx="50" cy="66" r="6" fill="#0a84ff"/>
 <rect x="47.5" y="68" width="5" height="12" rx="2.5" fill="#0a84ff"/>
 </svg>
 </div>
 <div className="lr-stamp">Locked</div>
 </div>
 </div>

 {/* ══ HOME ══ */}
 {screen==="home"&&(
 <>
 <div className="body">
 {tickerGames.length > 0 && (() => {
 const now = new Date();
 // Only highlight games from LOCKED slip (weekPicks from DB)
 const myLockedPickNames = (weekPicks||[])
 .filter(p=>p.user_id===user?.id)
 .map(p=>(p.pick_name||'').toLowerCase());

 const gameHasPick = (away, home) => {
 const a = away.toLowerCase(); const h = home.toLowerCase();
 return myLockedPickNames.some(n => n.includes(a) || n.includes(h));
 };

 const items = tickerGames.map(g => {
 const t = new Date(g.time);
 const isLive = now >= t && now < new Date(t.getTime() + 4*60*60*1000);
 const isToday = t.toDateString() === now.toDateString();
 const timeStr = t.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
 const away = g.away.split(' ').pop();
 const home = g.home.split(' ').pop();
 const hasPick = gameHasPick(away, home);
 return {away, home, isLive, isToday, timeStr, hasPick};
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
 setGameTeamTab('matchup');
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
 <div className='ticker-wrap' style={{position:"sticky",top:0,zIndex:25,marginBottom:0}}>
 <div className='ticker-track' style={{animationDuration: Math.max(12, items.length * 5) + 's'}}>
 {doubled.map((g, i) => (
 <span key={i} className='ticker-item'
 onClick={e=>{e.stopPropagation();if(i<items.length)openGame(g);}}
 onTouchEnd={e=>{e.preventDefault();e.stopPropagation();if(i<items.length)openGame(g);}}
 style={{cursor:"pointer",WebkitTapHighlightColor:"rgba(255,255,255,0.1)",userSelect:"none",
 background: g.hasPick ? "rgba(10,132,255,0.18)" : "transparent",
 borderRadius: g.hasPick ? 8 : 0,
 padding: g.hasPick ? "2px 10px" : "0 22px",
 border: g.hasPick ? "1px solid rgba(10,132,255,0.35)" : "none",
 margin: g.hasPick ? "0 8px" : 0,
 }}>
 {g.hasPick && <span style={{fontSize:9,color:IOS.blue,fontWeight:800,marginRight:4,letterSpacing:0.5}}>MY PICK</span>}
 <span className='ti-teams' style={{color: g.hasPick ? "#fff" : undefined}}>{g.away} @ {g.home}</span>
 {g.isLive
 ? <span className='ti-live'>● LIVE</span>
 : <span className='ti-time'>{g.timeStr}</span>
 }
 {!g.hasPick && <span className='ticker-sep'>|</span>}
 </span>
 ))}
 </div>
 </div>
 );
 })()}
 <div className="nav-header large" style={{padding:"6px 20px 16px",background:"radial-gradient(130% 90% at 88% -10%, rgba(10,132,255,0.20), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 80%)"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
 <div className="nav-title-large">PICKLOCK</div>
 <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
 <div style={{display:"flex",background:"rgba(255,255,255,0.08)",borderRadius:9,padding:2}}>
 {[{id:"leagues",label:"Leagues"},{id:"solo",label:"Solo"}].map(m=>(
 <div key={m.id} onClick={()=>{setHomeMode(m.id);setScreen("home");if(m.id==="solo"){fetchSoloWeeks();}else{setIsSoloMode(false);}}}
 style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:700,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",
 background:homeMode===m.id?"rgba(255,255,255,0.14)":"transparent",
 color:homeMode===m.id?"#fff":"rgba(255,255,255,0.4)"}}>{m.label}</div>
 ))}
 </div>

 </div>
 </div>
 {/* Commish Pro soft banner */}
 {!isPro && realLeagues.some(lg=>lg.isCommissioner) && (
   <div style={{margin:"10px 0 0",background:"rgba(10,132,255,0.08)",border:"0.5px solid rgba(10,132,255,0.2)",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setShowPaywall("settings")}>
     <div>
       <div style={{fontSize:12,fontWeight:600,color:IOS.blue}}>Unlock Commish Pro</div>
       <div style={{fontSize:11,color:"#555",marginTop:1}}>Custom picks, multi-sport, power-ups</div>
     </div>
     <div style={{fontSize:11,fontWeight:700,color:IOS.blue,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.25)",borderRadius:6,padding:"4px 9px",whiteSpace:"nowrap"}}>$5/mo</div>
   </div>
 )}

 
 {/* League toggle - only show in leagues mode */}
 {homeMode==="leagues" && <div style={{display:"flex",gap:6,marginTop:0,marginBottom:2,overflowX:"auto",paddingBottom:2}}>
 {realLeagues.map(lg=>{
 const sp=SPORTS[lg.sport];
 const isActive=activeLeagueId===lg.id;
 return (
 <div key={lg.id} onClick={()=>{setActiveLeagueId(lg.id);setPicks({ml:null,prop:null,ou:null,spread:null});setLsBets([]);}}
 style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,cursor:"pointer",transition:"all .18s",
 background:isActive?"rgba(10,132,255,0.15)":"rgba(255,255,255,0.06)",
 border:`1px solid ${isActive?"rgba(10,132,255,0.4)":"rgba(255,255,255,0.08)"}`,
 }}>
 <div style={{color:isActive?IOS.blue:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",transition:"color .18s"}}>
 {lg.sport==="nfl"&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-35 12 12)"/><line x1="12" y1="7" x2="12" y2="17" transform="rotate(-35 12 12)"/><line x1="8.5" y1="10" x2="15.5" y2="10" transform="rotate(-35 12 12)"/><line x1="8.5" y1="14" x2="15.5" y2="14" transform="rotate(-35 12 12)"/></svg>}
 {lg.sport==="nba"&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/><path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>}
 {lg.sport==="mlb"&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M14.5 4.5c-1 2.5-1 5.5 0 8s2.5 5 2.5 7"/><path d="M9.5 4.5c1 2.5 1 5.5 0 8s-2.5 5-2.5 7"/></svg>}
 {lg.sport==="nhl"&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="17" rx="9" ry="3.5"/><rect x="7" y="4" width="10" height="13" rx="2"/></svg>}
 {!["nfl","nba","mlb","nhl"].includes(lg.sport)&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>}
 </div>
 <div>
 <div style={{fontSize:12,fontWeight:700,color:isActive?IOS.blue:"rgba(255,255,255,0.6)",letterSpacing:-0.2}}>{lg.name}</div>
 <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1}}>Wk {lg.current_week||lg.week||1} · {sp.label}{lg.privacy==="public"?" · Public":""}</div>
 </div>
 {isActive&&<div style={{width:6,height:6,borderRadius:"50%",background:IOS.blue,marginLeft:2}}/>}
 </div>
 );
 })}
 </div>}
 {homeMode==="leagues" && realLeagues.length>0 && baseStandings.length>0 && (()=>{
   const sorted=[...baseStandings].sort((a,b)=>{const aw=parseInt((a.record||"0-0").split("-")[0])||0;const bw=parseInt((b.record||"0-0").split("-")[0])||0;if(bw!==aw)return bw-aw;return (b.points||0)-(a.points||0);});
   const me=sorted.find(r=>r.isYou||r.name==="You");
   const myRank=sorted.findIndex(r=>r.isYou||r.name==="You")+1;
   const rec=me?.record||"0-0";
   const seasonPts=me?.points??0;
   const myPicks=(weekPicks||[]).filter(p=>p.user_id===user?.id);
   const weekPts=parseFloat(myPicks.filter(p=>p.result==="W").reduce((su,p)=>su+parseFloat(p.points_earned||0),0).toFixed(1));
   const hit=myPicks.filter(p=>p.result==="W").length;
   const total=myPicks.length;
   const liveCount=myPicks.filter(p=>p.result==="pending").length;
   const st=me&&me.streak;
   const leader=sorted[0];
   const isLeader=myRank===1;
   const gap=(leader&&me)?parseFloat(((leader.points||0)-(me.points||0)).toFixed(1)):0;
   const lpts=leader?(leader.points||0):0;
   const fillPct=isLeader?100:(lpts>0?Math.max(8,Math.min(98,((me?.points||0)/lpts)*100)):8);
   return (
   <>
   <div className="wr-hero">
     <div className="wr-aurora"/>
     <div className="wr-hlabel">Your points · Week {activeLeague.current_week||activeLeague.week||1}</div>
     <div className="wr-hbig"><div className="wr-pts">{total>0?<Ticker value={weekPts} decimals={1} prefix="+"/>:"+0"}</div><div className="wr-u">{total>0?`pts · ${hit} of ${total} hit`:"no picks yet"}</div></div>
     <div className="wr-chips">
       {liveCount>0 && <div className="wr-chip"><span className="wr-dot"/>{liveCount} live</div>}
       {st&&st.count>=1 && <div className="wr-chip">{st.type==="W"&&st.count>=2?`W${st.count} streak`:`${st.type}${st.count}`}</div>}
       <div className="wr-chip">{rec} · {seasonPts>=0?`+${seasonPts}`:seasonPts}</div>
       {myRank>0 && <div className="wr-chip">#{myRank} overall</div>}
     </div>
   </div>
   {sorted.length>1 && !isLeader && <div className="wr-rival">
     <div className="wr-rt"><span>{isLeader?"You lead the league":<>Chasing <span style={{color:"#fff"}}>{(leader.isYou||leader.name==="You")?"the leader":leader.name}</span></>}</span><span style={{color:IOS.blue}}>{myRank>0?`#${myRank}`:""}</span></div>
     <div className="wr-track"><div className="wr-fill" style={{width:fillPct+"%"}}/></div>
     <div className="wr-gap">{isLeader?"Top of the standings — keep it locked.":`${gap} pts back of ${(leader.isYou||leader.name==="You")?"1st":leader.name}.`}</div>
   </div>}
   </>
   );
 })()}
 </div>

 {/* ══ SOLO MODE HOME SCREEN ══ */}
 {homeMode==="solo" && <SoloHome soloWeeks={soloWeeks} soloLoading={soloLoading} isPro={isPro} IOS={IOS} setScreen={setScreen} setShowNewLeague={setShowNewLeague} setNewLeagueStep={setNewLeagueStep} setShowBrowse={setShowBrowse} fetchPublicLeagues={fetchPublicLeagues} setIsSoloMode={setIsSoloMode} setActiveLeagueId={setActiveLeagueId} getOrCreateSoloLeague={getOrCreateSoloLeague} soloSavedPicks={soloSavedPicks} setSoloSavedPicks={setSoloSavedPicks} soloFlexPicks={soloFlexPicks} setSoloFlexPicks={setSoloFlexPicks} soloSport={soloSport} setSoloSport={setSoloSportPersist} setShowSoloSportPicker={setShowSoloSportPicker} soloSubmitted={soloSubmitted} setSoloSubmitted={setSoloSubmitted} username={userProfile?.username||""} soloTopPct={soloTopPct} onDeleteSlate={deleteSoloSlate} onJoinCode={handleJoinCode} setShowPaywall={setShowPaywall} tickerGames={tickerGames} espnGames={espnGames}/>}

 {/* ══ LEAGUES MODE ══ */}
 <div style={{display:homeMode==="leagues"?"block":"none"}}>

 {/* Games Ticker */}
 {/* Home / Games tab switcher */}
 <div style={{display:"flex",gap:0,margin:"8px 16px 0",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:3}}>
 {[{id:"home",label:"Home"},{id:"games",label:"Games"}].map(t=>(
 <div key={t.id} onClick={()=>setHomeTab(t.id)} style={{flex:1,textAlign:"center",padding:"7px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",background:homeTab===t.id?"rgba(255,255,255,0.12)":"transparent",color:homeTab===t.id?"#fff":"rgba(255,255,255,0.4)"}}>
 {t.label}
 </div>
 ))}
 </div>


 {homeTab==='home' && tickerGames.length>0 && (()=>{
 const now=new Date();
 const myList=(weekPicks||[]).filter(p=>p.user_id===user?.id);
 const myPickNames=myList.map(p=>(p.pick_name||"").toLowerCase());
 const openG=async(g,away,home,espn,gameTime,isLive)=>{
 const so=liveOdds[activeLeague?.sport];
 const gameOdds={ml:(so?.ml||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home)),spread:(so?.spread||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home)),ou:(so?.ou||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home))};
 setGameSheet({tickerGame:{...g,away,home,isLive,timeStr:gameTime},espnGame:espn,detail:null,odds:gameOdds});
 setGameTeamTab("matchup");
 if(espn?.id){ setGameLoading(true); try{ const r=await fetch(`/api/espn?sport=${SPORT_KEYS[activeLeague?.sport]}&gameId=${espn.id}`); if(r.ok){const d=await r.json();setGameSheet(prev=>({...prev,detail:d}));} }catch(e){} finally{setGameLoading(false);} }
 };
 return (
 <>
 <div className="ios-section" style={{margin:"10px 16px 6px"}}>
 <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <span>Today's Games</span>
 <span onClick={()=>setHomeTab("games")} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
 </div>
 </div>
 <div className="wr-carousel">
 {tickerGames.slice(0,10).map((g,gi)=>{
 const away=g.away.split(" ").pop(), home=g.home.split(" ").pop();
 const espn=espnGames.find(e=>e.awayTeam?.toLowerCase().includes(away.toLowerCase())||e.homeTeam?.toLowerCase().includes(home.toLowerCase()));
 const t=new Date(g.time);
 const isLive=now>=t&&now<new Date(t.getTime()+4*60*60*1000);
 const isDone=espn?.awayScore!=null&&espn?.homeScore!=null&&!isLive&&!!t&&now>=t;
 const gameTime=t.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
 const so=liveOdds[activeLeague?.sport];
 const ml=(so?.ml||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 const sp2=(so?.spread||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 const ou=(so?.ou||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 const hasPick=myPickNames.some(n=>n.includes(away.toLowerCase())||n.includes(home.toLowerCase()));
 return (
 <div key={gi} className={"wr-gc"+(hasPick?" picked":"")} onClick={()=>openG(g,away,home,espn,gameTime,isLive)}>
 <div className="wr-gctop">{isLive?<span className="wr-glive"><span className="wr-dot"/>LIVE</span>:isDone?<span className="wr-gtime">Final</span>:<span className="wr-gtime">{gameTime}</span>}<span className="wr-gsport">{SPORTS[activeLeague?.sport]?.label||""}</span></div>
 {[{ab:away,logo:espn?.awayLogo,sc:espn?.awayScore,rec:espn?.awayRecord},{ab:home,logo:espn?.homeLogo,sc:espn?.homeScore,rec:espn?.homeRecord}].map((tm,ti)=>(
 <div key={ti} className="wr-grow">
 <div className="wr-gl"><div className="wr-glogo">{tm.logo?<img src={tm.logo} style={{width:22,height:22,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}}/>:tm.ab}</div><div style={{minWidth:0}}><div className="wr-gn">{tm.ab}</div>{tm.rec&&<div style={{fontSize:9.5,color:"rgba(255,255,255,0.4)"}}>{tm.rec}</div>}</div></div>
 {(isLive||isDone)&&tm.sc!=null&&<div className="wr-gsc">{tm.sc}</div>}
 </div>
 ))}
 {ml.length>0 ? <div style={{display:"flex",gap:5,marginTop:9}}>
 {[{k:"SP",it:sp2[0]},{k:"TOT",it:ou[0]},{k:"ML",it:ml[0]}].map((c,ci)=>c.it?(<div key={ci} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"5px 2px",minWidth:0}}><div style={{fontSize:8,fontWeight:800,color:"rgba(255,255,255,0.4)",textTransform:"uppercase"}}>{c.k}</div><div style={{fontSize:10.5,fontWeight:800,color:"#fff",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.it.pick?.split(" ").slice(-1)[0]} {c.it.odds}</div></div>):<div key={ci} style={{flex:1}}/>)}
 </div> : <div style={{marginTop:9,fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.38)",textAlign:"center"}}>Lines not posted yet</div>}
 {hasPick&&<div className="wr-pickbadge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>On your slip</div>}
 </div>
 );
 })}
 </div>
 </>
 );
 })()}

 {/* Matchup — compact card — only show if there's a real opponent */}
 {homeTab==='home' && (()=>{
 const myPicks = weekPicks.filter(p=>p.user_id===user?.id);
 const currentWeekNum = activeLeague.current_week||activeLeague.week||1;
 const currentOpp = liveSchedule.find(w=>w.week===currentWeekNum)?.opp;
 const oppId = liveSchedule.find(w=>w.week===currentWeekNum)?.oppId;
 const targetSize = activeLeague.target_size||activeLeague.max_members||8;
 const leagueIsFull = activeLeagueId==="solo" || leagueMembers.length >= targetSize;
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
 const accent = isTied?IOS.blue:isWinning?IOS.green:IOS.red;
 const tint = isTied?"#0A1628":isWinning?"#0A1606":"#160808";

 return (
 <>
 <div className="ios-section" style={{margin:"0 16px 6px"}}>
 <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <span>Wk {activeLeague.current_week||activeLeague.week||1} Matchup · Live</span>
 <span onClick={()=>setScreen("matchup")} style={{color:sport.color,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>View Details</span>
 </div>
 </div>
 <div onClick={()=>setScreen("matchup")} style={{margin:"0 16px 10px",background:`linear-gradient(155deg,${tint} 0%,#0B0B0E 72%)`,borderRadius:16,padding:"15px 16px",cursor:"pointer",position:"relative",overflow:"hidden",border:`1px solid ${accent}38`,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
 <div style={{position:"absolute",top:-28,right:-28,width:96,height:96,borderRadius:"50%",background:`radial-gradient(circle,${accent}26,transparent 70%)`,pointerEvents:"none"}}/>
 <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${accent},${accent}55)`}}/>
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

 {homeTab==='home' && (()=>{
 const _hasFilled=(arr)=>(arr||[]).some(s=>s.mult&&(s.isParlay?(s.parlayLegs||[]).length>0:!!s.bet));
 const slipSlots = _hasFilled(flexPicks) ? flexPicks : ((savedPicks&&savedPicks.flexPicks&&_hasFilled(savedPicks.flexPicks)) ? savedPicks.flexPicks : null);
 const catColors={ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};
 const catAbbr={ml:"ML",prop:"PROP",ou:"O/U",spread:"SPREAD",longshot:"LONG"};
 const wk=activeLeague.current_week||activeLeague.week||1;
 const doClear=async()=>{
 if(!window.confirm("Clear your unlocked picks? Picks from games that have already started are kept.")) return;
 if(user){
 const {data:rows}=await supabase.from("picks").select("id,game_date,result").eq("league_id",activeLeague.id).eq("user_id",user.id).eq("week",wk);
 const now=Date.now();
 const clearable=(rows||[]).filter(r=>(r.result==="pending"||!r.result)&&(!r.game_date||new Date(r.game_date).getTime()>now)).map(r=>r.id);
 if(clearable.length) await supabase.from("picks").delete().in("id",clearable);
 await fetchMyPicks(activeLeague.id, wk, user.id);
 fetchWeekPicks(activeLeague.id, wk);
 } else { setSavedPicks(null); }
 setFlexPicks(freshSlots());
 try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${wk}`); } catch(e) {}
 if(isSoloMode){ setSoloSavedPicks(null); try{ localStorage.removeItem("picklock_solo_locked"); }catch(e){} }
 };
 let card=null;
 if(slipSlots){
 const slots=[...slipSlots].filter(s=>s.mult&&(s.isParlay?(s.parlayLegs||[]).length>0:!!s.bet)).sort((a,b)=>a.mult-b.mult);
 const lockedN=slots.filter(s=>s.committed).length;
 const allLocked=slots.length>0&&lockedN===slots.length;
 const openN=slots.length-lockedN;
 const accent=allLocked?IOS.green:IOS.orange;
 let totalPossible=0;
 const pills=slots.map((slot,i)=>{
 const legs=slot.parlayLegs||[];
 const isParlay=slot.isParlay||legs.length>0;
 let cat,pts;
 if(isParlay&&legs.length>0){cat="longshot";const ls=calcLS(legs);const dec=ls?.decimal||1;pts=parseFloat((slot.mult*(dec-1)*10).toFixed(1));}
 else if(slot.bet){cat=slot.category||"ml";pts=parseFloat(calcPickPoints(slot.mult,slot.bet.impliedOdds,"W").toFixed(1));}
 else return null;
 totalPossible+=pts;
 const locked=!!slot.committed;
 const c=catColors[cat]||IOS.blue;
 return (
 <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 9px",borderRadius:8,background:locked?`${c}1a`:"rgba(255,255,255,0.03)",border:locked?`0.5px solid ${c}3d`:"0.5px dashed rgba(255,255,255,0.2)",flexShrink:0,opacity:locked?1:0.85}}>
 {locked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
 <span style={{fontSize:11,fontWeight:800,color:locked?c:"rgba(255,255,255,0.5)"}}>{slot.mult}×</span>
 <span style={{fontSize:10.5,fontWeight:700,color:locked?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.45)",letterSpacing:0.3}}>{catAbbr[cat]||"PICK"}{isParlay&&legs.length>0?` ${legs.length}`:""}</span>
 {!locked&&<span style={{fontSize:8.5,fontWeight:800,color:IOS.orange,letterSpacing:0.4}}>OPEN</span>}
 {slot.power_up_id&&<PUBadge puId={slot.power_up_id} size={14} />}
 </div>
 );
 });
 card=(
 <div style={{margin:"0 16px 10px",background:allLocked?"linear-gradient(160deg,#0A1606 0%,#0B0B0E 70%)":"linear-gradient(160deg,#16130A 0%,#0B0B0E 70%)",borderRadius:16,overflow:"hidden",border:`1px solid ${accent}4d`,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
 <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${IOS.sep}`}}>
 <div style={{display:"flex",alignItems:"center",gap:7}}>
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:accent}}>{allLocked?`Week ${wk} · Slip Locked`:`Week ${wk} · ${lockedN}/${slots.length} Locked`}</div>
 </div>
 <div style={{display:"flex",gap:12,alignItems:"center"}}>
 <div style={{fontSize:12,fontWeight:600,color:IOS.blue,cursor:"pointer"}} onClick={()=>setScreen("picks")}>{allLocked?"Edit":"Continue"}</div>
 <div style={{fontSize:12,fontWeight:600,color:IOS.red,cursor:"pointer"}} onClick={doClear}>Clear</div>
 </div>
 </div>
 <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"12px 16px 4px"}}>{pills}</div>
 <div onClick={()=>setScreen("picks")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",margin:"6px 12px 12px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
 <div style={{display:"flex",alignItems:"center",gap:8}}>
 <span style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>{allLocked?"View your picks":(openN+" open · tap to lock")}</span>
 <span style={{fontSize:11,fontWeight:700,color:IOS.green}}>+{totalPossible.toFixed(1)} pts</span>
 </div>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
 </div>
 </div>
 );
 }
 return (<>
 {!slipSlots &&
 <button className="ios-btn" style={{background:`linear-gradient(135deg,${sport.color},${IOS.indigo})`,color:"#fff",marginBottom:6,boxShadow:`0 6px 18px ${sport.color}33`}} onClick={()=>setScreen("picks")}>Build Your {leagueSports.length > 1 ? "Multi-Sport" : sport.label} Slip</button>
 }
 {card}
 </>);
 })()}

 {homeTab==='home' && <>
 <div className="ios-section" style={{margin:"12px 16px 6px"}}>
 <div className="ios-section-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <span>Power-Ups</span>
 <span onClick={()=>{setProfTab("power-ups");setScreen("profile");}} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
 </div>
 </div>
 <div className="pu-scroll" style={{paddingBottom:6}}>
 {myPUs.map((pu,i)=>(
 <div key={i} className="pu-chip">
 <div className="pu-chip-icon">{puSVG(pu.id,pu.color)}</div>
 <div><div className="pu-chip-name">{pu.name}</div><div className="pu-chip-rarity" style={{color:rarityColor(pu.rarity)}}>{pu.rarity}</div></div>
 </div>
 ))}
 {wheelSpins > 0 && (
 <div className="pu-spin-chip" onClick={()=>setShowWheel(true)}>
 <div style={{fontSize:20}}></div>
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
 <span style={{display:"inline-flex",alignItems:"center",gap:7}}>Standings <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,fontWeight:800,color:IOS.green,letterSpacing:"0.06em"}}><span className="wr-dot"/>LIVE</span></span>
 <span onClick={()=>setScreen("league")} style={{color:IOS.blue,fontSize:13,textTransform:"none",fontWeight:500,letterSpacing:0,cursor:"pointer"}}>See All</span>
 </div>
 </div>
 <div style={{margin:"0 16px"}}>
 {[...baseStandings].sort((a,b)=>{
 const aw=parseInt((a.record||"0-0").split("-")[0])||0;
 const bw=parseInt((b.record||"0-0").split("-")[0])||0;
 if(bw!==aw) return bw-aw;
 return (b.points||0)-(a.points||0);
 }).slice(0,5).map((r,i)=>{
 const isMe=r.isYou||r.name==="You";
 const nm=isMe?"You":(r.name||"Player");
 const inits=nm.trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
 const top=i===0;
 const big=i<3;
 const st=(r.streak&&r.streak.count>=1)?`${r.streak.type}${r.streak.count}`:"";
 return (
 <div key={r.rank} style={{display:"flex",alignItems:"center",gap:11,padding:"0 13px",height:big?60:52,marginBottom:8,borderRadius:14,
 background:isMe?"linear-gradient(180deg,#16223e,#0e1422)":"linear-gradient(180deg,#16161d,#0d0d11)",
 border:`1px solid ${isMe?"rgba(10,132,255,0.55)":top?"rgba(245,210,110,0.45)":"rgba(255,255,255,0.07)"}`,
 boxShadow:top?"0 4px 18px -6px rgba(245,210,110,0.28)":isMe?"0 4px 18px -8px rgba(10,132,255,0.4)":"none"}}>
 <div style={{fontSize:big?18:15,fontWeight:900,width:24,textAlign:"center",flexShrink:0,color:top?"#f5d26e":isMe?IOS.blue:"rgba(255,255,255,0.5)"}}>{i+1}</div>
 <div style={{width:big?36:30,height:big?36:30,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:big?13:11,fontWeight:900,color:"#fff",
 background:isMe?"rgba(10,132,255,0.3)":top?"rgba(245,210,110,0.22)":"rgba(255,255,255,0.1)",
 border:`1px solid ${isMe?"rgba(10,132,255,0.5)":top?"rgba(245,210,110,0.4)":"rgba(255,255,255,0.12)"}`}}>{inits}</div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:big?15:13.5,fontWeight:800,letterSpacing:"-0.2px",color:isMe?IOS.blue:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nm}</div>
 <div style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",marginTop:1}}>{r.record||"0-0"}{st?` · ${st}`:""}</div>
 </div>
 <div style={{textAlign:"right",flexShrink:0}}>
 <div style={{fontSize:big?18:16,fontWeight:900,letterSpacing:"-0.5px",color:"#fff",lineHeight:1}}>{r.points!==undefined?<Ticker value={r.points} decimals={1}/>:r.units}</div>
 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.06em",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginTop:2}}>pts</div>
 </div>
 </div>
 );
 })}
 </div>
 <div style={{height:16}}/>
 </>}
 {homeTab==="games" && (<>

 {/* ══ GAMES TAB ══ */}
 <div style={{padding:"12px 16px 0"}}>
 <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,marginBottom:12}}>
 {SPORTS[activeLeague?.sport]?.label||"NFL"} · This Week
 </div>
 </div>

 {tickerGames.length === 0 ? (
 <div style={{textAlign:"center",padding:"40px 24px",color:IOS.label3,fontSize:14}}>
 <div style={{fontSize:32,marginBottom:8}}></div>
 No games found. Check back closer to game day.
 </div>
 ) : tickerGames.map((g, gi) => {
 const away = g.away.split(" ").pop();
 const home = g.home.split(" ").pop();
 const espn = espnGames.find(e =>
 e.awayTeam?.toLowerCase().includes(away.toLowerCase()) ||
 e.homeTeam?.toLowerCase().includes(home.toLowerCase())
 );
 const t = new Date(g.time);
 const now = new Date();
 const isLive = now >= t && now < new Date(t.getTime() + 4*60*60*1000);
 const isDone = espn?.awayScore && espn?.homeScore && !isLive && !!t && now>=t;
 const gameTime = t.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
 // Get odds for this game
 const sportOdds = liveOdds[activeLeague?.sport];
 const mlOdds = (sportOdds?.ml||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 const spreadOdds = (sportOdds?.spread||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 const ouOdds = (sportOdds?.ou||[]).filter(o=>o.game?.includes(away)||o.game?.includes(home));
 // Check if user has a pick on this game
 const myPickNames = (weekPicks||[]).filter(p=>p.user_id===user?.id).map(p=>(p.pick_name||"").toLowerCase());
 const hasPick = myPickNames.some(n=>n.includes(away.toLowerCase())||n.includes(home.toLowerCase()));

 return (
 <div key={gi} onClick={async()=>{
 const gameOdds = {ml:mlOdds,spread:spreadOdds,ou:ouOdds};
 setGameSheet({tickerGame:{...g,away,home,isLive,timeStr:gameTime},espnGame:espn,detail:null,odds:gameOdds});
 setGameTeamTab("matchup");
 if(espn?.id){
 setGameLoading(true);
 try{
 const r=await fetch(`/api/espn?sport=${SPORT_KEYS[activeLeague?.sport]}&gameId=${espn.id}`);
 if(r.ok){const d=await r.json();setGameSheet(prev=>({...prev,detail:d}));}
 }catch(e){}
 finally{setGameLoading(false);}
 }
 }} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,overflow:"hidden",cursor:"pointer",border:hasPick?`1px solid ${IOS.blue}40`:"1px solid rgba(255,255,255,0.06)"}}>
 {/* Status bar */}
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderBottom:`0.5px solid ${IOS.sep}`}}>
 <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,color:isLive?IOS.green:IOS.label3,textTransform:"uppercase"}}>
 {isLive?"● LIVE":isDone?"Final":gameTime}
 </div>
 {hasPick && <div style={{fontSize:10,fontWeight:700,color:IOS.blue,letterSpacing:0.5}}>MY PICK</div>}
 </div>
 {/* Teams */}
 <div style={{padding:"10px 14px"}}>
 {[{name:g.away,abbr:away,logo:espn?.awayLogo,score:espn?.awayScore,record:espn?.awayRecord},
 {name:g.home,abbr:home,logo:espn?.homeLogo,score:espn?.homeScore,record:espn?.homeRecord}
 ].map((team,ti)=>(
 <div key={ti} style={{display:"flex",alignItems:"center",gap:10,marginBottom:ti===0?8:0}}>
 {team.logo
 ? <img src={team.logo} style={{width:28,height:28,objectFit:"contain",flexShrink:0}} onError={e=>e.target.style.display="none"}/>
 : <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.1)",flexShrink:0}}/>
 }
 <div style={{flex:1}}>
 <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{team.name}</div>
 {team.record && <div style={{fontSize:11,color:IOS.label3}}>{team.record}</div>}
 </div>
 {(isLive||isDone) && team.score!==undefined && (
 <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{team.score}</div>
 )}
 </div>
 ))}
 </div>
 {/* Odds strip */}
 {mlOdds.length > 0 && (
 <div style={{display:"flex",borderTop:`0.5px solid ${IOS.sep}`}}>
 {[
 {label:"ML", items:mlOdds.slice(0,2)},
 {label:"Spread", items:spreadOdds.slice(0,2)},
 {label:"O/U", items:ouOdds.slice(0,2)},
 ].map((col,ci)=>(
 <div key={ci} style={{flex:1,padding:"8px 6px",borderRight:ci<2?`0.5px solid ${IOS.sep}`:"none",textAlign:"center"}}>
 <div style={{fontSize:9,color:IOS.label3,fontWeight:600,letterSpacing:0.5,marginBottom:4}}>{col.label}</div>
 {col.items.map((o,oi)=>(
 <div key={oi} style={{fontSize:11,fontWeight:700,color:o.odds?.startsWith("+")?IOS.green:IOS.blue,lineHeight:1.4}}>{o.pick?.split(" ").slice(-1)[0]} {o.odds}</div>
 ))}
 </div>
 ))}
 </div>
 )}
 </div>
 );
 })}
 <div style={{height:16}}/>
 </>)}
 </div>
 {/* End leagues mode */}
 </div>
 </>
 )}

 {/* ══ PICKS ══ */}
 {screen==="picks"&&!isSoloMode&&(()=>{
 // Use separate state for solo mode vs league mode
 const activePicks = isSoloMode ? soloFlexPicks : flexPicks;
 const setActivePicks = isSoloMode ? setSoloFlexPicks : setFlexPicks;
 const openSlot=(i)=>{ const s=activePicks[i]; setActiveFlexSlot(i); if(s&&s.locked&&s.category) setFlexCategory(s.category); };
 const activeSubmitted = isSoloMode ? soloSubmitted : submitted;
 const activeSavedPicks = isSoloMode ? soloSavedPicks : savedPicks;
 const setActiveSavedPicks = isSoloMode ? setSoloSavedPicks : setSavedPicks;
 const setActiveSubmitted = isSoloMode ? setSoloSubmitted : setSubmitted;
 // ── Derived from activePicks (correct for both solo & league) ──
 const usedMults = activePicks.filter(p=>p.mult!==null).map(p=>p.mult);
 const availableMults = [1,2,3,4,5].filter(m=>!usedMults.includes(m));
 const hasLongshot = activePicks.some(p=> {
 if(p.category==="longshot" && p.bet && p.bet.impliedOdds >= 400) return true;
 if(p.isParlay && p.parlayLegs.length>=2) {
 const dec = calcParlayOddsDecimal(p.parlayLegs);
 return parlayAmericanOdds(dec) >= 400;
 }
 return false;
 });
 const hasParlay = hasLongshot;
 const allFlexFilled = activePicks.every(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null));
 const _ts = activeLeague.target_size||activeLeague.max_members||8;
 const leagueNotStarted = !isSoloMode && leagueMembers.length>0 && leagueMembers.length < _ts;
 const _need = Math.max(0, _ts - leagueMembers.length);
 if(leagueNotStarted){
   return (
     <div style={{padding:"16px 16px 90px"}}>
       <div style={{background:"linear-gradient(160deg,#16181d,#0c0d10)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"22px 18px",textAlign:"center"}}>
         <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,159,10,0.14)",border:"0.5px solid rgba(255,159,10,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={IOS.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
         </div>
         <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{activeLeague.name} hasn't started yet</div>
         <div style={{fontSize:13,color:IOS.label3,marginTop:6,lineHeight:1.45}}>Picks open once all {_ts} spots are filled. {_need} more {_need===1?"player":"players"} to go.</div>
         <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden",margin:"14px 0 6px"}}>
           <div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${IOS.orange},${IOS.yellow})`,width:`${Math.min(100,(leagueMembers.length/_ts)*100)}%`,transition:"width .4s"}}/>
         </div>
         <div style={{fontSize:11,color:IOS.label3}}>{leagueMembers.length}/{_ts} joined</div>
         {(activeLeague.invite_code||activeLeague.inviteCode) && <button onClick={()=>shareInvite(activeLeague.invite_code||activeLeague.inviteCode, activeLeague.name)} style={{marginTop:14,width:"100%",background:"rgba(255,255,255,0.08)",border:"0.5px solid rgba(255,255,255,0.14)",color:"#fff",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Invite players</button>}
       </div>
       <div style={{background:"linear-gradient(160deg,#161019,#0c0a12)",border:`0.5px solid ${(IOS.purple||"#BF5AF2")}4d`,borderRadius:16,padding:"18px",marginTop:12}}>
         <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Want to pick right now?</div>
         <div style={{fontSize:12.5,color:IOS.label3,marginTop:4,lineHeight:1.45}}>No need to wait for a full league. Solo Mode lets you build a slate against today's live lines right now.</div>
         <button onClick={async()=>{ setSoloModeWithRef(true); try{ const lid=await getOrCreateSoloLeague(); setActiveLeagueId(lid||"solo"); }catch(e){} setScreen("picks"); }} style={{marginTop:12,width:"100%",background:(IOS.purple||"#BF5AF2"),color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Make picks in Solo Mode</button>
       </div>
       {strayPicks.length>0 && (
         <div style={{background:IOS.bg2,border:"0.5px solid rgba(255,69,58,0.25)",borderRadius:16,padding:"16px",marginTop:12}}>
           <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Picks from before the league started</div>
           <div style={{fontSize:12,color:IOS.label3,marginTop:3,marginBottom:10,lineHeight:1.4}}>These were locked before {activeLeague.name} filled up, so they don't count toward anything. Clear them to tidy up.</div>
           {strayPicks.map((p,i)=>(
             <div key={p.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:i<strayPicks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
               <div style={{fontSize:12.5,color:"#ccc",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{p.pick_name}</div>
               <div style={{fontSize:11,fontWeight:800,color:p.result==="W"?IOS.green:p.result==="L"?IOS.red:IOS.label3}}>{p.result==="W"?"WON":p.result==="L"?"LOST":p.result==="PUSH"?"PUSH":"PENDING"}</div>
             </div>
           ))}
           <button onClick={clearStrayPicks} style={{marginTop:12,width:"100%",background:"rgba(255,69,58,0.12)",border:"0.5px solid rgba(255,69,58,0.3)",color:IOS.red,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Clear these picks</button>
         </div>
       )}
     </div>
   );
 }
 // ── Per-pick locking ─────────────────────────────────────────────
 const _weekNum = activeLeague.current_week||activeLeague.week||1;
 const slotGameTime = (slot)=>{
 if(!slot) return 0;
 if(slot.isParlay){ const ts=(slot.parlayLegs||[]).map(l=>l.gameTime?new Date(l.gameTime).getTime():0).filter(t=>t>0); return ts.length?Math.min(...ts):0; }
 return slot.bet&&slot.bet.gameTime?new Date(slot.bet.gameTime).getTime():0;
 };
 const slotStarted = (slot)=>{ const gt=slotGameTime(slot); return !!gt && gt<=Date.now(); };
 const buildSlotRows = (slot, slotIdx)=>{
 const _pu = activatedPUs[slotIdx] || null; const _puId=_pu?_pu.id:null; const _puTier=(_pu&&_pu.tier!=null)?_pu.tier:null;
 if(slot.isParlay){
 return (slot.parlayLegs||[]).map((b,legIdx)=>({ league_id:activeLeague.id, user_id:user.id, week:_weekNum, slot: isCustomSlip?`longshot_${slotIdx}_${legIdx}`:`longshot_${legIdx}`, multiplier:slot.mult, power_up_id:_puId, pu_tier:_puTier, pick_name:b.pick, game:b.game||"", odds:b.odds, implied_odds:b.impliedOdds, game_date:b.gameTime||null, result:"pending", points_earned:0 }));
 }
 return [{ league_id:activeLeague.id, user_id:user.id, week:_weekNum, slot: isCustomSlip?`${slot.category||"ml"}_${slotIdx}`:(slot.category||"ml"), multiplier:slot.mult, power_up_id:_puId, pu_tier:_puTier, pick_name:slot.bet.pick, game:slot.bet.game||"", odds:slot.bet.odds, implied_odds:slot.bet.impliedOdds, game_date:slot.bet.gameTime||null, event_id:slot.bet.eventId||null, market_key:slot.bet.marketKey||null, outcome:slot.bet.outcome||null, outcome_point:(slot.bet.point!=null?slot.bet.point:null), sel_key:slot.bet.selKey||null, result:"pending", points_earned:0 }];
 };
 const lockSlot = async (idx)=>{
 const slot = activePicks[idx];
 if(!slot||!slot.mult||slot.committed) return;
 { const _tsz=activeLeague.target_size||activeLeague.max_members||8; if(!isSoloMode && leagueMembers.length>0 && leagueMembers.length<_tsz){ alert("Your league hasn't started yet — it needs all "+_tsz+" players first. You can make picks in Solo Mode until then."); return; } }
 if(slot.isParlay ? (slot.parlayLegs||[]).length<2 : !slot.bet) return;
 if(slotStarted(slot)){ alert("That game has already started — this pick can no longer be locked."); return; }
 if(!user){ alert("Sign in to lock picks."); return; }
 const rows = buildSlotRows(slot, idx);
 const { data, error } = await supabase.from("picks").insert(rows).select("id");
 if(error){ alert("Couldn’t lock that pick: "+error.message); return; }
 const ids = (data||[]).map(r=>r.id);
 setActivePicks(prev=>prev.map((p,i)=> i===idx ? {...p, committed:true, commitIds:ids} : p));
 try{ fetchWeekPicks(activeLeague.id, _weekNum); }catch(e){}
 try{ if(navigator.vibrate) navigator.vibrate(20); }catch(e){}
 };
 const unlockSlot = async (idx)=>{
 const slot = activePicks[idx];
 if(!slot||!slot.committed) return;
 if(slotStarted(slot)){ alert("That game has started — this pick is locked in."); return; }
 const ids = slot.commitIds||[];
 if(ids.length){ const { error } = await supabase.from("picks").delete().in("id", ids); if(error){ alert("Couldn’t unlock: "+error.message); return; } }
 setActivePicks(prev=>prev.map((p,i)=> i===idx ? {...p, committed:false, commitIds:[]} : p));
 try{ fetchWeekPicks(activeLeague.id, _weekNum); }catch(e){}
 };
 const isCustomSlip = activePicks.some(p=>p.locked);
 return (
 <>

 {/* Bet picker sheet */}
 {activeFlexSlot!==null&&(
 <div className="sheet-bg" onClick={()=>{setActiveFlexSlot(null);setFlexCategory(null);setPickSearch("");setLongshotMode("straight");setBetTypeFilter("all");setPropTypeFilter("all");setBetSportFilter("all");}}>
 <div className="sheet" onClick={e=>e.stopPropagation()}>
 <div className="sheet-handle"/>
 <div className="sheet-hdr">
 <div>
 <div className="sheet-hdr-title">
 {activePicks[activeFlexSlot]?.isParlay ? "Parlay Legs" : flexCategory ? ["Moneyline","Prop","Over/Under","Spread","Longshot"][["ml","prop","ou","spread","longshot"].indexOf(flexCategory)] : "Choose a Bet"}
 </div>
 <div className="sheet-hdr-sub">
 {activePicks[activeFlexSlot]?.isParlay
 ? `${activePicks[activeFlexSlot]?.parlayLegs.length} legs selected — need 2+`
 : flexCategory ? "Tap to select" : "Pick a category first"}
 </div>
 </div>
 {(()=>{
 const slot = activeFlexSlot!==null ? activePicks[activeFlexSlot] : null;
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
 setActiveFlexSlot(null);setFlexCategory(null);setPickSearch("");setLongshotMode("straight");setPropTypeFilter("all");setBetSportFilter("all");
 }}>Done</div>
 {parlayBlocked && <div style={{fontSize:10,color:IOS.orange,textAlign:"right"}}>Need +400 odds</div>}
 {parlayNeedsLegs && <div style={{fontSize:10,color:IOS.orange,textAlign:"right"}}>Add 2+ legs</div>}
 </div>
 );
 })()}
 </div>

 {/* Category selector — show if not parlay and no category chosen yet */}
 {!activePicks[activeFlexSlot]?.isParlay && !flexCategory && (
 <div style={{padding:"12px 16px"}}>
 <div onClick={()=>{ const t=activeFlexSlot; setActiveFlexSlot(null); setFlexCategory(null); setGridTargetSlot(t); setGridType("ml"); setGridPropSub("all"); setScreen("browser"); }}
   style={{display:"flex",alignItems:"center",gap:14,padding:"12px 12px",marginBottom:6,borderRadius:12,cursor:"pointer",
     background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.10))",border:"0.5px solid rgba(10,132,255,0.3)"}}>
   <div style={{width:40,height:40,borderRadius:12,background:"rgba(10,132,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
   </div>
   <div style={{flex:1}}>
     <div style={{fontSize:16,fontWeight:600,color:"#fff"}}>Browse in Grid View</div>
     <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Big cards with stats &amp; recent form</div>
   </div>
   <div style={{fontSize:18,color:IOS.blue}}>›</div>
 </div>
 {(()=>{
 // Find categories already used by OTHER slots (not the current one being edited)
 const usedCats = activePicks
 .filter((_,i)=>i!==activeFlexSlot)
 .filter(p=>(p.bet&&p.category&&!p.isParlay)||(p.isParlay&&p.parlayLegs.length>=2))
 .map(p=>p.isParlay?"longshot":p.category);
 return [
 {id:"ml", label:"Moneyline", icon:"", color:IOS.blue, desc:"Pick a team to win"},
 {id:"prop", label:"Prop", icon:"", color:IOS.yellow, desc:"Player or game prop"},
 {id:"ou", label:"Over/Under", icon:"", color:IOS.orange, desc:"Total points scored"},
 {id:"spread", label:"Spread", icon:"", color:IOS.green, desc:"Beat the point spread"},
 {id:"longshot",label:"Longshot", icon:"", color:IOS.pink, desc:"High odds single bet"},
 ].map(cat=>{
 const taken = usedCats.includes(cat.id);
 return (
 <div key={cat.id} onClick={()=>{ if(!taken) setFlexCategory(cat.id); }}
 style={{display:"flex",alignItems:"center",gap:14,padding:"14px 4px",borderBottom:`0.5px solid ${IOS.sep}`,cursor:taken?"not-allowed":"pointer",opacity:taken?0.35:1}}>
 <div style={{width:40,height:40,borderRadius:12,background:`${cat.color}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{catSVG(cat.id,cat.color)}</div>
 <div style={{flex:1}}>
 <div style={{fontSize:16,fontWeight:600,color:taken?IOS.label3:"#fff"}}>{cat.label}</div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{taken?"Already in your slip":cat.desc}</div>
 </div>
 {taken
 ? <div style={{fontSize:12,fontWeight:700,color:IOS.label3}}> Used</div>
 : <div style={{fontSize:18,color:IOS.label3}}>›</div>
 }
 </div>
 );
 });
 })()}
 </div>
 )}

 {/* Back button when category chosen */}
 {!activePicks[activeFlexSlot]?.isParlay && flexCategory && !activePicks[activeFlexSlot]?.locked && (
 <div onClick={()=>{setFlexCategory(null);setPropTypeFilter("all");}} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",borderBottom:`0.5px solid ${IOS.sep}`}}>
 <span style={{color:IOS.blue,fontSize:14}}>‹</span>
 <span style={{color:IOS.blue,fontSize:14,fontWeight:600}}>Categories</span>
 </div>
 )}

 {/* Sport filter bar — only for multi-sport leagues */}
 {leagueSports.length > 1 && flexCategory && (
   <div style={{display:"flex",gap:6,padding:"6px 16px 2px",overflowX:"auto",scrollbarWidth:"none"}}>
     {["all", ...leagueSports].map(sp=>{
       const isAll = sp === "all";
       const label = isAll ? "All" : SPORTS[sp]?.label || sp.toUpperCase();
       const color = isAll ? IOS.blue : SPORTS[sp]?.color || IOS.blue;
       const isOn = betSportFilter === sp;
       return (
         <div key={sp} onClick={()=>{setBetSportFilter(sp);setPropTypeFilter("all");}}
         style={{flexShrink:0,padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",
           background:isOn?`${color}20`:"rgba(255,255,255,0.06)",
           color:isOn?color:"rgba(255,255,255,0.45)",
           border:`1px solid ${isOn?color+"50":"rgba(255,255,255,0.08)"}`,
         }}>{label}</div>
       );
     })}
   </div>
 )}

 {/* Prop type sub-filter bar — only when prop category is selected */}
 {flexCategory==="prop" && (()=>{
 // Use the active sport filter if set, otherwise primary league sport
 const sportId = (betSportFilter !== "all" ? betSportFilter : null)
   || activeLeague?.sport || "nfl";
 const propFilters = {
 nfl: [
 {id:"all", label:"All"},
 {id:"pass", label:"Pass"},
 {id:"rush", label:"Rush"},
 {id:"receiving", label:"Rec"},
 {id:"td", label:"TDs"},
 ],
 nba: [
 {id:"all", label:"All"},
 {id:"points", label:"Points"},
 {id:"rebounds", label:"Boards"},
 {id:"assists", label:"Assists"},
 {id:"threes", label:"3-Pointers"},
 ],
 mlb: [
 {id:"all", label:"All"},
 {id:"pitcher", label:"Pitcher"},
 {id:"batter", label:"Batter"},
 {id:"hr", label:"Home Runs"},
 ],
 };
 const filters = propFilters[sportId] || propFilters.nfl;
 return (
 <div style={{display:"flex",gap:6,padding:"8px 16px 4px",overflowX:"auto",scrollbarWidth:"none"}}>
 {filters.map(f=>(
 <div key={f.id} onClick={()=>setPropTypeFilter(f.id)}
 style={{flexShrink:0,padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
 background:propTypeFilter===f.id?"rgba(255,214,10,0.2)":"rgba(255,255,255,0.06)",
 color:propTypeFilter===f.id?IOS.yellow:"rgba(255,255,255,0.5)",
 border:`1px solid ${propTypeFilter===f.id?"rgba(255,214,10,0.5)":"rgba(255,255,255,0.08)"}`,
 }}>
 {f.label}
 </div>
 ))}
 </div>
 );
 })()}

 {/* Search */}
 {/* Straight / Parlay toggle — longshot only */}
 {flexCategory==="longshot" && (
 <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:2,margin:"8px 16px 4px",gap:2}}>
 {["straight","parlay"].map(mode=>(
 <div key={mode} onClick={()=>{
 setLongshotMode(mode);
 setBetTypeFilter("all");
 setPropTypeFilter("all");
 // sync isParlay on the active slot
 if(activeFlexSlot!==null) {
 setActivePicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{...p,isParlay:mode==="parlay",bet:null,parlayLegs:[]}:p));
 }
 }} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s",
 background:longshotMode===mode?(mode==="parlay"?IOS.pink:IOS.green):"transparent",
 color:longshotMode===mode?"#fff":"rgba(255,255,255,0.4)"}}>
 {mode==="straight"?" Straight Bet (+400 only)":" Parlay (build legs)"}
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

 {(flexCategory || activePicks[activeFlexSlot]?.isParlay) && (
 <div className="sheet-search-wrap" style={{top:0,position:"relative"}}>
 <div style={{position:"relative"}}>
 <input className="sheet-search" placeholder="Search..." value={pickSearch} onChange={e=>setPickSearch(e.target.value)} autoFocus={false} style={{paddingLeft:14}}/>
 {pickSearch&&<span onClick={()=>setPickSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"rgba(255,255,255,0.4)",cursor:"pointer"}}></span>}
 </div>
 </div>
 )}

 {/* Parlay legs selected bar */}
 {activePicks[activeFlexSlot]?.isParlay && activePicks[activeFlexSlot]?.parlayLegs.length >= 2 && (
 <div className="sheet-ls-bar">
 <span style={{fontSize:12,fontWeight:600,color:IOS.pink}}> Parlay odds</span>
 <span style={{fontSize:20,fontWeight:700,color:IOS.pink}}>{calcLS(activePicks[activeFlexSlot].parlayLegs)?.american}</span>
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
 {!oddsLoading && (flexCategory || activePicks[activeFlexSlot]?.isParlay) && (()=>{
 const allBets = activePicks[activeFlexSlot]?.isParlay ? ALL_BETS : (BETS[flexCategory]||[]);
 const filtered = allBets.filter(bet=>{
 const q = pickSearch.toLowerCase().trim();
 const textMatch = !q || bet.game.toLowerCase().includes(q) || bet.pick.toLowerCase().includes(q);
 // Sport filter for multi-sport leagues
 if(betSportFilter !== "all" && bet._sport && bet._sport !== betSportFilter) return false;
 // Prop sub-category filter
 if(flexCategory==="prop" && propTypeFilter!=="all") {
 const p = bet.pick.toLowerCase();
 const g = (bet.game||"").toLowerCase();
 const sportId = (betSportFilter !== "all" ? betSportFilter : null) || bet._sport || activeLeague?.sport || "nfl";
 let propMatch = true;
 if(sportId==="nfl") {
 if(propTypeFilter==="pass") propMatch = p.includes("pass") || p.includes("yard") && (p.includes("pass")||g.includes("qb")||["mahomes","allen","hurts","purdy","jackson","burrow","dak","herbert","stafford","cousins","fields","stroud","love","young","mills"].some(n=>g.includes(n)));
 if(propTypeFilter==="rush") propMatch = p.includes("rush") && !p.includes("rec");
 if(propTypeFilter==="receiving") propMatch = p.includes("rec") || (p.includes("yard") && !p.includes("rush") && !p.includes("pass"));
 if(propTypeFilter==="td") propMatch = p.includes("td") || p.includes("touchdown") || p.includes("touch");
 } else if(sportId==="nba") {
 if(propTypeFilter==="points") propMatch = p.includes("point") || p.includes("pts");
 if(propTypeFilter==="rebounds") propMatch = p.includes("rebound") || p.includes("reb");
 if(propTypeFilter==="assists") propMatch = p.includes("assist");
 if(propTypeFilter==="threes") propMatch = p.includes("three") || p.includes("3-point") || p.includes("3pt") || p.includes("threes");
 } else if(sportId==="mlb") {
 if(propTypeFilter==="pitcher") propMatch = p.includes("strikeout") || p.includes("out") || g.toLowerCase().includes("pitcher")||["cole","scherzer","verlander","degrom","alcantara","nola","kershaw","burnes","bieber","manoah","rodon","flaherty","castillo","ohtani","glasnow"].some(n=>g.includes(n));
 if(propTypeFilter==="batter") propMatch = p.includes("hit") || p.includes("rbi") || p.includes("base") || p.includes("walk") || p.includes("run");
 if(propTypeFilter==="hr") propMatch = p.includes("home run") || p.includes("hr") || p.includes("homer");
 }
 if(!propMatch) return false;
 }
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
 });
 if(filtered.length === 0) return (
   <div style={{padding:"40px 20px",textAlign:"center"}}>
     <div style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.25)",marginBottom:6}}>
       {flexCategory==="prop" ? "No props available yet" : "No bets available"}
     </div>
     <div style={{fontSize:12,color:"rgba(255,255,255,0.15)",lineHeight:1.5}}>
       {flexCategory==="prop"
         ? "Player props usually go live 2-3 days before game time. Check back closer to kickoff."
         : "Check back when games are scheduled."}
     </div>
   </div>
 );
 return <>{filtered.map(bet=>{
 const slot = activePicks[activeFlexSlot];
 const isCur = slot?.isParlay
 ? slot.parlayLegs.find(b=>b.id===bet.id)
 : slot?.bet?.id===bet.id;
 const pts = slot?.mult ? calcPickPoints(slot.mult, bet.impliedOdds, "W") : 0;
 return (
 <div key={bet.id} className="bet-row" style={isCur?{background:"rgba(10,132,255,0.06)"}:{}}
 onClick={()=>{
 if(slot?.isParlay) {
 setActivePicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{
 ...p,
 parlayLegs: p.parlayLegs.find(b=>b.id===bet.id)
 ? p.parlayLegs.filter(b=>b.id!==bet.id)
 : [...p.parlayLegs, bet]
 }:p));
 } else {
 setActivePicks(prev=>prev.map((p,i)=>i===activeFlexSlot?{...p,bet,category:flexCategory}:p));
 setActiveFlexSlot(null);
 setFlexCategory(null);
 }
 }}>
 <div className="bet-row-left">
 <div className="bet-row-game">{bet.game}</div>
 <div className="bet-row-pick">{bet.pick}</div>
 {bet._sport && leagueSports.length > 1 && (
   <div style={{display:"inline-block",fontSize:8,fontWeight:800,letterSpacing:.4,color:SPORTS[bet._sport]?.color||IOS.blue,background:`${SPORTS[bet._sport]?.color||IOS.blue}18`,borderRadius:4,padding:"1px 5px",marginTop:3,textTransform:"uppercase"}}>{bet._sport.toUpperCase()}</div>
 )}
 {slot?.mult&&<div style={{marginTop:5,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(48,209,88,0.1)",border:"1px solid rgba(48,209,88,0.2)",borderRadius:6,padding:"2px 8px"}}>
 <span style={{fontSize:10,fontWeight:700,color:IOS.green}}>+{pts} pts if win</span>
 </div>}
 </div>
 <div className="bet-row-right">
 <div className="bet-row-odds" style={{color:bet.odds.startsWith("+")?IOS.green:IOS.blue}}>{bet.odds}</div>
 <div className={`bet-check ${isCur?"on":"off"}`}>{isCur&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}></span>}</div>
 </div>
 </div>
 );
 })}</>
 })()}
 </div>
 </div>
 )}

 {/* Commish Pro: locked extra slot for non-pro users */}
 {!isPro && !activeSubmitted && (
   <div onClick={()=>setShowPaywall("picks")} style={{margin:"0 16px 8px",background:"#0A0A0A",border:"0.5px dashed #333",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",opacity:0.8}}>
     <div style={{fontSize:13,color:"#555"}}>Add more picks</div>
     <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(10,132,255,0.1)",border:"0.5px solid rgba(10,132,255,0.25)",borderRadius:6,padding:"3px 8px"}}>
       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
       <span style={{fontSize:10,fontWeight:700,color:IOS.blue}}>Commish Pro</span>
     </div>
   </div>
 )}

 {/* Submitted */}
 {(activeSubmitted || activeSavedPicks?.flexPicks)&&(()=>{
 const slots=[...(activeSavedPicks?.flexPicks||activePicks)].filter(x=>x.mult).sort((a,b)=>a.mult-b.mult);
 const wk=activeLeague.current_week||activeLeague.week||1;
 const catColors={ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};
 const catLabels={ml:"Moneyline",prop:"Prop",ou:"Over/Under",spread:"Spread",longshot:"Longshot"};
 const catTint={ml:"#0A1628",prop:"#16120A",ou:"#160E04",spread:"#0A1606",longshot:"#16060C"};
 const ptsFor=(slot)=>{const m=slot.mult||1;if(slot.isParlay){const ls=calcLS(slot.parlayLegs);return ls?calcPickPoints(m,ls.decimal>1?(ls.decimal-1)*100:0,"W"):0;}return slot.bet?calcPickPoints(m,slot.bet.impliedOdds,"W"):0;};
 const resultFor=(slot)=>slot.result||slot.bet?.result||null;
 const graded=slots.some(x=>resultFor(x));
 const projTotal=slots.reduce((a,x)=>a+ptsFor(x),0);
 const wonTotal=slots.reduce((a,x)=>a+(resultFor(x)==="W"?ptsFor(x):0),0);
 const wins=slots.filter(x=>resultFor(x)==="W").length;
 const losses=slots.filter(x=>resultFor(x)==="L").length;
 const lsSlot=slots.find(x=>x.category==="longshot"||(x.isParlay&&x.parlayLegs.length>=2));
 const lsOdds=lsSlot?(lsSlot.isParlay?calcLS(lsSlot.parlayLegs)?.american:lsSlot.bet?.odds):null;
 const onShare=()=>{try{const txt=`My ${activeLeague.name} Week ${wk} slip is locked — ${slots.length} picks, projected +${projTotal.toFixed(1)} pts.`;if(navigator.share){navigator.share({title:"PickLock slip",text:txt});}else if(navigator.clipboard){navigator.clipboard.writeText(txt);}}catch(e){}};
 const Tile=({val,lbl,color})=>(
 <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 8px",textAlign:"center"}}>
 <div style={{fontSize:19,fontWeight:800,letterSpacing:"-0.5px",color}}>{val}</div>
 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",color:"rgba(255,255,255,0.32)",marginTop:3}}>{lbl}</div>
 </div>
 );
 return (
 <div className="lsx-scroll" style={{position:"absolute",inset:0,zIndex:10,background:"#07070A",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingTop:"calc(env(safe-area-inset-top, 44px) + 52px)",paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 76px)"}}>
 <style>{`
 @keyframes lsxRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
 @keyframes lsxPulse{0%,100%{opacity:1}50%{opacity:.3}}
 @keyframes lsxShim{0%{background-position:-160px 0}100%{background-position:160px 0}}
 .lsx-card{transition:transform .12s ease}.lsx-card:active{transform:scale(.985)}
 .lsx-pending{background:linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.14),rgba(255,255,255,.03));background-size:240px 100%;animation:lsxShim 1.5s linear infinite}
 .lsx-scroll::-webkit-scrollbar{display:none}
 `}</style>

 {/* Hero */}
 <div style={{background:"linear-gradient(180deg,#0A1C12 0%,#07070A 100%)",position:"relative",overflow:"hidden"}}>
 <div style={{position:"absolute",top:-50,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(48,209,88,0.18),transparent 70%)",pointerEvents:"none"}}/>
 <div style={{padding:"22px 18px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"relative"}}>
 <div>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.38)"}}>{activeLeague.name} · Week {wk}</div>
 <div style={{fontSize:27,fontWeight:800,letterSpacing:"-0.7px",color:"#fff",marginTop:3,lineHeight:1}}>Your Slip</div>
 </div>
 <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(48,209,88,0.12)",border:"0.5px solid rgba(48,209,88,0.35)",borderRadius:20,padding:"6px 11px",flexShrink:0}}>
 <span style={{width:6,height:6,borderRadius:"50%",background:IOS.green,display:"inline-block",boxShadow:`0 0 7px ${IOS.green}`,animation:"lsxPulse 2s ease-in-out infinite"}}/>
 <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",color:IOS.green}}>LOCKED</span>
 </div>
 </div>
 <div style={{display:"flex",gap:8,padding:"0 16px 16px",position:"relative"}}>
 {graded
 ? <><Tile val={`${wins}-${losses}`} lbl="Record" color={IOS.blue}/><Tile val={`+${wonTotal.toFixed(1)}`} lbl="Pts Won" color={IOS.green}/><Tile val={lsOdds||"—"} lbl="Longshot" color={IOS.pink}/></>
 : <><Tile val={`${slots.length}/5`} lbl="Picks" color={IOS.blue}/><Tile val={`+${projTotal.toFixed(1)}`} lbl="Proj. Pts" color={IOS.green}/><Tile val={lsOdds||"—"} lbl="Longshot" color={IOS.pink}/></>
 }
 </div>
 </div>

 {/* Pick cards */}
 <div style={{padding:"10px 12px 0",display:"flex",flexDirection:"column",gap:8}}>
 {slots.map((slot,i)=>{
 const cat=slot.isParlay?"longshot":slot.category;
 const c=catColors[cat]||IOS.blue;
 const res=resultFor(slot);
 const pts=ptsFor(slot);
 const ls=slot.isParlay?calcLS(slot.parlayLegs):null;
 const odds=slot.isParlay?(ls?ls.american:""):(slot.bet?.odds||"");
 const oddsPos=odds.startsWith("+");
 const name=slot.isParlay?slot.parlayLegs.map(b=>b.pick).join("  ·  "):(slot.bet?.pick||"");
 const game=slot.isParlay?(slot.parlayLegs[0]?.game||""):(slot.bet?.game||"");
 return (
 <div key={i} className="lsx-card" style={{position:"relative",overflow:"hidden",borderRadius:14,
 background:`linear-gradient(155deg,${catTint[cat]} 0%,#0B0B0E 70%)`,border:`1px solid ${c}38`,
 boxShadow:res==="W"?`0 0 0 1px ${IOS.green}55`:res==="L"?`0 0 0 1px ${IOS.red}40`:"0 4px 14px rgba(0,0,0,0.4)",
 animation:`lsxRise .34s ease ${Math.min(i,6)*0.04}s both`}}>
 <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:c}}/>
 <div style={{position:"absolute",top:-26,right:-26,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${c}22,transparent 70%)`,pointerEvents:"none"}}/>
 <div style={{display:"flex",alignItems:"center",gap:11,padding:"12px 13px 11px 14px"}}>
 <div style={{width:30,height:30,borderRadius:9,background:`${c}1f`,border:`0.5px solid ${c}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:c,flexShrink:0}}>{slot.mult}×</div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:c,marginBottom:2}}>{catLabels[cat]}{slot.isParlay?` · ${slot.parlayLegs.length}-leg parlay`:""}</div>
 {slot.isParlay ? (
 <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:2}}>
 {slot.parlayLegs.map((b,li)=>(
 <div key={li} style={{display:"flex",alignItems:"baseline",gap:7}}>
 <span style={{fontSize:9,fontWeight:800,color:c,flexShrink:0,width:13}}>{li+1}.</span>
 <div style={{minWidth:0,flex:1}}>
 <div style={{fontSize:12.5,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.pick}{b.odds?<span style={{color:"rgba(255,255,255,0.42)",fontWeight:600,marginLeft:5}}>{b.odds}</span>:null}</div>
 {b.game&&<div style={{fontSize:9.5,color:"rgba(255,255,255,0.34)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.game}</div>}
 </div>
 </div>
 ))}
 </div>
 ) : (<>
 <div style={{fontSize:13.5,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
 {game&&<div style={{fontSize:10,color:"rgba(255,255,255,0.36)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{game}</div>}
 </>)}
 </div>
 <div style={{textAlign:"right",flexShrink:0}}>
 <div style={{fontSize:14.5,fontWeight:800,letterSpacing:"-0.3px",color:slot.isParlay?IOS.pink:oddsPos?IOS.green:IOS.blue}}>{odds}</div>
 <div style={{fontSize:10,fontWeight:700,marginTop:1,color:res==="L"?"rgba(255,69,58,0.7)":res==="W"?IOS.green:"rgba(255,255,255,0.4)"}}>+{res==="L"?0:pts} pts{!graded?" if win":""}</div>
 </div>
 </div>
 <div className={res?"":"lsx-pending"} style={{height:4,background:res==="W"?IOS.green:res==="L"?IOS.red:undefined}}/>
 </div>
 );
 })}
 </div>

 {/* Total */}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px 4px"}}>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.32)"}}>{graded?"Total pts earned":"Projected if all hit"}</div>
 <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px",color:IOS.green}}>+{(graded?wonTotal:projTotal).toFixed(1)}</div>
 </div>

 {/* Share CTA */}
 <div onClick={onShare} style={{margin:"12px 12px 0",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",
 background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.10))",border:"0.5px solid rgba(10,132,255,0.3)"}}>
 <div>
 <div style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>Share your slip</div>
 <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Let your league know you locked in</div>
 </div>
 <div style={{display:"flex",alignItems:"center",gap:7,background:IOS.blue,borderRadius:9,padding:"8px 14px"}}>
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
 <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>Share</span>
 </div>
 </div>

 <button className="ios-btn" style={{background:"rgba(255,255,255,0.07)",color:IOS.blue,marginTop:8}} onClick={()=>{setScreen("home");}}>Back to Home</button>
 </div>
 );
 })()}

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
 {!oddsLoading && isLiveOdds && <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:"rgba(48,209,88,0.1)",borderRadius:8,padding:"3px 8px",border:"1px solid rgba(48,209,88,0.2)"}}>
 <div style={{width:6,height:6,borderRadius:"50%",background:IOS.green}}/>
 <span style={{fontSize:11,fontWeight:700,color:IOS.green,letterSpacing:0.5}}>Live odds</span>
 </div>}
 {!oddsLoading && oddsError && <div style={{marginLeft:"auto",fontSize:11,color:IOS.orange}}> Static odds</div>}
 {savedPicks&&!oddsLoading&&<div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
 <div onClick={()=>{
 if(activeSavedPicks?.flexPicks) setActivePicks(activeSavedPicks.flexPicks);
 setActiveSavedPicks(null);
 }} style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Edit</div>
 <div onClick={async()=>{
 if(window.confirm("Clear your unlocked picks? Picks from games that have already started are kept.")){
 const week = activeLeague.current_week||activeLeague.week||1;
 if(user) {
 const {data:rows}=await supabase.from("picks").select("id,game_date,result").eq("league_id",activeLeague.id).eq("user_id",user.id).eq("week",week);
 const now=Date.now();
 const clearable=(rows||[]).filter(r=>(r.result==="pending"||!r.result)&&(!r.game_date||new Date(r.game_date).getTime()>now)).map(r=>r.id);
 if(clearable.length) await supabase.from("picks").delete().in("id",clearable);
 await fetchMyPicks(activeLeague.id, week, user.id);
 fetchWeekPicks(activeLeague.id, week);
 }
 // keep only started+committed slots locally; reset the rest
 setActivePicks(prev=>prev.map(p=> (p.committed && slotStarted(p)) ? p : (p.locked?{id:p.id,bet:null,mult:p.mult,category:p.category,isParlay:false,parlayLegs:[],locked:true}:{...EMPTY_FLEX[0],id:p.id})));
 setActiveSavedPicks(null);
 try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${activeLeague.current_week||activeLeague.week||1}`); } catch(e) {}
 }
 }} style={{fontSize:13,fontWeight:600,color:IOS.red,cursor:"pointer"}}>Clear</div>
 </div>}
 </div>

 {/* Locked picks view */}
 {activeSavedPicks && activeSavedPicks.flexPicks ? (
 <div>
 <div style={{padding:"0 16px 12px"}}>
 <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>Your Slip</div>
 <div style={{fontSize:14,color:IOS.label3,marginTop:4}}>{activeLeague.name} · Wk {activeLeague.current_week||activeLeague.week||1} · Locked </div>
 </div>
 {[...activeSavedPicks.flexPicks].sort((a,b)=>a.mult-b.mult).map((slot,i)=>{
 if(!slot.mult) return null;
 const multColors = {1:"#3A9EE0", 2:"#3A9EE0", 3:"#3A9EE0", 4:"#3A9EE0", 5:"#3A9EE0"};
 const col = multColors[slot.mult];
 if(slot.isParlay || (slot.parlayLegs && slot.parlayLegs.length > 0)) {
 const ls = calcLS(slot.parlayLegs);
 return (
 <div key={i} style={{margin:"0 16px 6px",background:IOS.bg2,borderRadius:12,padding:"11px 14px",border:"0.5px solid rgba(255,255,255,0.07)"}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:5}}>{slot.mult}× · LONGSHOT · {slot.parlayLegs.length} LEGS</div>
 <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBottom:6}}>
   <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.55)"}}>Parlay</div>
   <div style={{fontSize:15,fontWeight:800,color:IOS.green,flexShrink:0}}>{ls?.american}</div>
 </div>
 <div style={{borderTop:`0.5px solid rgba(255,255,255,0.06)`,paddingTop:6}}>
 {slot.parlayLegs.map((b,j)=>(
 <div key={j} style={{padding:"3px 0"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.75)",textAlign:"left"}}>{b.pick}</div>
     <div style={{fontSize:13,fontWeight:700,color:b.odds.startsWith("+")?IOS.green:IOS.blue,flexShrink:0,marginLeft:8}}>{b.odds}</div>
   </div>
   {b.game&&<div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1,textAlign:"left"}}>{b.game}</div>}
 </div>
 ))}
 </div>
 </div>
 );
 }
 if(!slot.bet) return null;
 const pts = calcPickPoints(slot.mult, slot.bet.impliedOdds, "W");
 const catLabel = slot.category ? {ml:"MONEYLINE",prop:"PROP",ou:"OVER/UNDER",spread:"SPREAD",longshot:"LONGSHOT"}[slot.category]||slot.category.toUpperCase() : "PICK";
 return (
 <div key={i} style={{margin:"0 16px 6px",background:IOS.bg2,borderRadius:12,padding:"11px 14px",border:`0.5px solid rgba(255,255,255,0.07)`}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:5}}>{slot.mult}× · {catLabel}</div>
 <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBottom:4}}>
   <div style={{fontSize:15,fontWeight:700,color:"#fff",minWidth:0}}>{slot.bet.pick}</div>
   <div style={{fontSize:15,fontWeight:800,color:slot.bet.odds.startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{slot.bet.odds}</div>
 </div>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
   <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{slot.bet.game||""}</div>
   <span style={{fontSize:10,fontWeight:700,color:IOS.green,background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.25)",borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",flexShrink:0}}>+{pts.toFixed(1)} pts if win</span>
 </div>
 </div>
 );
 })}
 <div style={{height:20}}/>
 </div>
 ) : (
 <>
 <div style={{padding:"2px 20px 16px",background:"radial-gradient(120% 90% at 90% -10%, rgba(10,132,255,0.18), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 82%)"}}>
 <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.42)"}}>{activeLeague.name} · Wk {activeLeague.current_week||activeLeague.week||1}</div>
 <div style={{fontSize:30,fontWeight:800,letterSpacing:"-0.7px",color:"#fff",lineHeight:1.05,marginTop:2}}>{leagueSports.length > 1 ? "Multi-Sport Slip" : `${sport.label} Slip`}</div>
 </div>

 {/* League filling banner */}
 {leagueMembers.length < (activeLeague.target_size||activeLeague.max_members||8) && (
 <div style={{margin:"0 16px 10px",background:"rgba(255,159,10,0.08)",borderRadius:10,padding:"9px 13px",border:"0.5px solid rgba(255,159,10,0.25)"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:7}}>
 <div style={{fontSize:12,fontWeight:700,color:IOS.orange,whiteSpace:"nowrap"}}>League still filling up</div>
 <div style={{fontSize:11,color:IOS.label3,whiteSpace:"nowrap"}}>{leagueMembers.length}/{activeLeague.target_size||activeLeague.max_members||8} joined</div>
 </div>
 <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
 <div style={{height:"100%",borderRadius:2,background:`linear-gradient(90deg,${IOS.orange},${IOS.yellow})`,width:`${Math.min(100,(leagueMembers.length/(activeLeague.target_size||activeLeague.max_members||8))*100)}%`,transition:"width .4s"}}/>
 </div>
 </div>
 )}

 {/* Status bar */}
 <div style={{margin:"0 16px 10px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 14px"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
 <div style={{fontSize:12,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)"}}>Your Slip</div>
 <div style={{fontSize:13,fontWeight:600,color:allFlexFilled?IOS.green:IOS.blue}}>
 {activePicks.filter(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null)).length}/{activePicks.length} picks
 </div>
 </div>
 <div style={{display:"flex",gap:6}}>
 {activePicks.map((slot,m)=>{
 const filled = slot && (slot.isParlay ? slot.parlayLegs.length>=2 : slot.bet!==null);
 return (
 <div key={m} style={{flex:1,height:6,borderRadius:3,background:filled?IOS.green:slot?"rgba(10,132,255,0.4)":"rgba(255,255,255,0.1)"}}/>
 );
 })}
 </div>
 {!hasParlay&&!isCustomSlip&&<div style={{fontSize:10.5,color:IOS.orange,marginTop:8,lineHeight:1.4}}>One pick must be a Longshot (+400 or better)</div>}
 </div>

 {/* Grid Bet Browser entry */}
 {!activeSubmitted && (()=>{
   const firstEmpty = activePicks.findIndex(p=>!p.isParlay && p.bet===null);
   const target = firstEmpty===-1 ? 0 : firstEmpty;
   return (
   <div onClick={()=>{ setGridTargetSlot(target); setGridType("ml"); setGridPropSub("all"); setScreen("browser"); }}
     style={{margin:"0 16px 12px",borderRadius:14,padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
       background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.10))",border:"0.5px solid rgba(10,132,255,0.35)"}}>
     <div style={{display:"flex",alignItems:"center",gap:11}}>
       <div style={{width:34,height:34,borderRadius:10,background:"rgba(10,132,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
         <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
       </div>
       <div>
         <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:"-0.2px"}}>Browse all bets</div>
         <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:1}}>Grid view with stats &amp; recent form</div>
       </div>
     </div>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
   </div>
   );
 })()}

 {/* Flex pick slots — compact card design */}
 {activePicks.map((slot, idx)=>{
 const parlayDec = slot.isParlay && slot.parlayLegs.length>=2 ? calcParlayOddsDecimal(slot.parlayLegs) : 1;
 const parlayAmerican = slot.isParlay && slot.parlayLegs.length>=2 ? parlayAmericanOdds(parlayDec) : 0;
 const parlayValid = slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican >= 400;
 const filled = slot.isParlay ? parlayValid : slot.bet!==null;
 const parlayOdds = slot.isParlay && slot.parlayLegs.length>=2 ? calcLS(slot.parlayLegs) : null;
 const multColors = {1:"#3A9EE0", 2:"#3A9EE0", 3:"#3A9EE0", 4:"#3A9EE0", 5:"#3A9EE0"};
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
 <div key={idx} style={{margin:"0 12px 8px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>

 {/* Main content row */}
 <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 13px 8px"}}>

 {/* Left: type label + legs */}
 <div style={{flex:1,minWidth:0}} onClick={()=>openSlot(idx)}>
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
 <span style={{fontSize:10,color:IOS.green,fontWeight:600}}> Longshot</span>
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
 <div onClick={()=>openSlot(idx)} style={{background:"#2a2a2a",borderRadius:7,color:"#bbb",fontSize:11,fontWeight:600,padding:"4px 10px",cursor:"pointer"}}>
 {filled?"Edit":"+ Pick"}
 </div>
 {filled&&!slot.committed&&<button onClick={e=>{e.stopPropagation();setActivePicks(prev=>prev.map((p,i)=>i===idx?(p.locked?{id:i,bet:null,mult:p.mult,category:p.category,isParlay:false,parlayLegs:[],locked:true}:{...EMPTY_FLEX[0],id:i}):p));}} style={{background:"#2a2a2a",border:"none",borderRadius:7,color:"#555",fontSize:14,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
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
 <div onClick={()=>setActivePicks(prev=>prev.map((p,i)=>i===idx?{...p,isParlay:!p.isParlay,bet:null,parlayLegs:[]}:p))}
 style={{width:40,height:24,borderRadius:12,background:slot.isParlay?IOS.pink:"rgba(255,255,255,0.1)",position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
 <div style={{position:"absolute",top:2,left:slot.isParlay?18:2,width:20,height:20,borderRadius:50,background:"#fff",transition:"left .2s"}}/>
 </div>
 </div>
 {slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican < 400 && (
 <div style={{padding:"4px 14px 8px"}}>
 <span style={{fontSize:11,color:IOS.orange}}> Need +400 combined · Currently {parlayAmerican>0?`+${parlayAmerican}`:parlayAmerican}</span>
 </div>
 )}
 {slot.isParlay && slot.parlayLegs.length>=2 && parlayAmerican >= 400 && (
 <div style={{padding:"4px 14px 8px"}}>
 <span style={{fontSize:11,color:IOS.green}}> Qualifies as Longshot · +{parlayAmerican}</span>
 </div>
 )}
 </>
 )}

 {/* Bottom bar: multipliers + pts if win */}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.25)",borderTop:"0.5px solid rgba(255,255,255,0.06)",padding:"6px 13px",gap:8}}>
 <div style={{display:"flex",gap:5}}>
 {(slot.locked||slot.committed) ? [(<div key="lk" style={{width:34,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:(multColors[slot.mult]||"#2a2a2a"),color:"#fff",fontSize:11,fontWeight:700}}>{slot.mult}×</div>)] : [1,2,3,4,5].map(m=>{
 const taken = usedMults.includes(m) && slot.mult!==m;
 const active = slot.mult===m;
 return (
 <div key={m} onClick={()=>{if(taken)return;setActivePicks(prev=>prev.map((p,i)=>i===idx?{...p,mult:active?null:m}:p));}}
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
 {slot.mult&&filled&&(()=>{
 const started=slotStarted(slot);
 if(slot.committed) return (<div style={{display:"flex",alignItems:"center",gap:7}}>
 <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:800,color:IOS.green,background:"rgba(48,209,88,0.12)",border:"1px solid rgba(48,209,88,0.3)",borderRadius:7,padding:"4px 8px"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>LOCKED</span>
 {!started && <span onClick={(e)=>{e.stopPropagation();unlockSlot(idx);}} style={{fontSize:10.5,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Unlock</span>}
 </div>);
 if(started) return (<span style={{fontSize:10,fontWeight:700,color:IOS.label3}}>Game started</span>);
 return (<button onClick={(e)=>{e.stopPropagation();lockSlot(idx);}} style={{fontFamily:"Barlow",display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:800,color:"#08080B",background:IOS.green,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#08080B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Lock</button>);
 })()}
 {slot.mult&&filled&&<div style={{fontSize:12,fontWeight:700,color:IOS.green,flexShrink:0}}>
 {isDouble?`+${pts} pts (2⃣ doubled!)`:isEnhance&&slot.bet?`+${pts} pts `:`+${pts} pts if win`}
 </div>}
 {(myPUs.filter(p=>p.type==="offensive").length>0||appliedPU)&&slot.mult&&filled&&(
 appliedPU ? (
 <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,background:`${appliedPU.color}15`,border:`1px solid ${appliedPU.color}30`,cursor:"pointer"}}
 onClick={e=>{e.stopPropagation();const r=appliedPU;if(r?.dbId)supabase.from("league_power_ups").update({used:false}).eq("id",r.dbId);setMyPUs(p=>[...p,r]);setActivatedPUs(p=>{const n={...p};delete n[idx];return n;});}}>
 <span style={{fontSize:10}}>{appliedPU.icon}</span>
 <span style={{fontSize:10,fontWeight:700,color:appliedPU.color}}>{appliedPU.name}</span>
 <span style={{fontSize:9,color:IOS.label3,marginLeft:2}}></span>
 </div>
 ) : (
 <div onClick={e=>{e.stopPropagation();setShowPUModal({context:"picks",slotId:idx,slotLabel:slot.isParlay?"Parlay":slot.bet?.pick||"Pick",category:slot.category||"ml",isParlay:!!slot.isParlay});}}
 style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.12)",cursor:"pointer"}}>
 <span style={{fontSize:10}}></span>
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
 const leagueIsFull = activeLeagueId==="solo" || leagueMembers.length >= targetSize;
 if(!leagueIsFull) return (
 <div style={{margin:"0 16px",background:"rgba(255,159,10,0.06)",borderRadius:12,padding:"11px 14px",border:"0.5px solid rgba(255,159,10,0.2)",display:"flex",alignItems:"center",gap:11}}>
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={IOS.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:12.5,fontWeight:700,color:IOS.orange}}>Submit picks when the league fills</div>
 <div style={{fontSize:11,color:IOS.label3,marginTop:1}}>{leagueMembers.length}/{targetSize} members joined</div>
 </div>
 </div>
 );
 return null;
 })()}
 {(()=>{
 const targetSize = activeLeague.target_size||activeLeague.max_members||8;
 const leagueIsFull = activeLeagueId==="solo" || leagueMembers.length >= targetSize;
 if(!leagueIsFull) return null;
 return allFlexFilled && (hasParlay||isCustomSlip)
 ? <button className="ios-btn green" onClick={async()=>{
 if(user) {
 const week = activeLeague.current_week||activeLeague.week||1;
 // Solo is a full resubmit; leagues lock ADDITIVELY so already-locked picks
 // (whose games may have started/graded) are never wiped or re-graded.
 if(isSoloMode){ await supabase.from("picks").delete().eq("league_id", activeLeague.id).eq("user_id", user.id).eq("week", week); }
 const picksToSave = []; const lockedIdx = [];
 activePicks.forEach((slot, slotIdx)=>{
 if(!slot.mult) return;
 if(!isSoloMode && slot.committed) return; // already locked
 const filledOk = slot.isParlay ? (slot.parlayLegs||[]).length>=2 : !!slot.bet;
 if(!filledOk) return;
 if(!isSoloMode && slotStarted(slot)) return; // can’t lock a started game
 buildSlotRows(slot, slotIdx).forEach(r=>picksToSave.push(r));
 lockedIdx.push(slotIdx);
 });
 if(picksToSave.length) {
 const {data:ins, error:insertError} = await supabase.from("picks").insert(picksToSave).select("id,multiplier");
 if(insertError) { alert("Error saving picks: " + insertError.message); return; }
 if(!isSoloMode){ setActivePicks(prev=>prev.map((p,i)=>{ if(!lockedIdx.includes(i)) return p; const mine=(ins||[]).filter(r=>r.multiplier===p.mult).map(r=>r.id); return {...p, committed:true, commitIds:mine}; })); }
 }
 if(isSoloMode){ const _slid = soloLeagueId || activeLeague.id; if(_slid && _slid!=="solo"){ try{ await supabase.from("leagues").update({sport: soloSport}).eq("id", _slid); }catch(e){} } }
 }
 const weekNum = activeLeague.current_week||activeLeague.week||1;
 const locked = {flexPicks: activePicks, lockedAt: new Date().toISOString()};
 const storageKey = `linedup_picks_${activeLeague.id}_wk${weekNum}`;
 try { localStorage.setItem(storageKey, JSON.stringify(locked)); } catch(e) {}
 if(isSoloMode) { setSoloSavedPicks(locked); setSoloSubmitted(true); try{ localStorage.setItem("picklock_solo_locked", JSON.stringify({flexPicks:activePicks, lockedAt:locked.lockedAt, week:weekNum})); }catch(e){} }
 else { setActiveSavedPicks(locked); setActiveSubmitted(true); }
 try{ if(navigator.vibrate) navigator.vibrate([0,30,40,30,60]); }catch(e){}
 setLockRitual(true);
 }}> Lock Your Slip </button>
 : <button className="ios-btn disabled" disabled>
 {(!hasParlay&&!isCustomSlip) ? " Need a Longshot (+400 straight or +400 parlay)" : (activePicks.filter(p=>p.mult!==null&&(p.isParlay?p.parlayLegs.length>=2:p.bet!==null)).length + " / " + activePicks.length + " Slots Filled")}
 </button>;
 })()}
 <div style={{height:20}}/>
 </>
 )}
 </div>
 </>
 );})()
 }

 {/* ══ SOLO FREEFORM SLATE BUILDER ══ */}
 {screen==="picks"&&isSoloMode&&(()=>{
 const ptsFor=(io)=>{ if(io==null) return 0; const d = io>0 ? (io/100)+1 : (100/Math.abs(io))+1; return parseFloat(((d-1)*10).toFixed(1)); };
 const locked = (soloSavedPicks && soloSavedPicks.freePicks) ? soloSavedPicks : null;
 const slateNum = soloWeeks.length + 1;
 const CATS = [{k:"all",l:"All"},{k:"ml",l:"ML"},{k:"spread",l:"Spread"},{k:"ou",l:"O/U"},{k:"prop",l:"Prop"},{k:"longshot",l:"Longshot"}];
 const board = (freeCat==="all" ? ALL_BETS : ALL_BETS.filter(b=>b.category===freeCat)).filter(b=>!soloFreePicks.some(p=>p.id===b.id)).slice(0,40);
 const projTotal = soloFreePicks.reduce((s2,b)=>s2+ptsFor(b.impliedOdds),0);
 const CAP = 12;
 const atCap = soloFreePicks.length>=CAP;
 return (
 <div className="body" style={{padding:"0 16px 40px"}}>
   <div style={{padding:"18px 0 12px",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
     <div>
       <div style={{fontSize:23,fontWeight:800,color:"#fff",letterSpacing:-0.5}}>{locked?`Slate ${slateNum}`:"Build Your Slate"}</div>
       <div style={{fontSize:12.5,color:IOS.label3,marginTop:2}}>{locked?"Locked — pending results":"Pick as many as you want. Each scores on its own odds."}</div>
       {!locked && <div onClick={()=>setShowSoloSportPicker(true)} style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"5px 10px",cursor:"pointer"}}><span style={{width:7,height:7,borderRadius:2,background:(SPORTS[soloSport]&&SPORTS[soloSport].color)||IOS.blue}}/><span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{(SPORTS[soloSport]&&SPORTS[soloSport].label)||String(soloSport).toUpperCase()}</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>}
     </div>
     <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
       <div style={{fontSize:9.5,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5}}>Slate</div>
       <div style={{fontSize:20,fontWeight:800,color:IOS.blue,lineHeight:1.1}}>{slateNum}</div>
     </div>
   </div>

   {locked ? (
     <>
       <div style={{background:IOS.bg2,border:"0.5px solid rgba(48,209,88,0.25)",borderRadius:14,padding:"6px 14px 8px",marginBottom:14}}>
         {locked.freePicks.map((b,i)=>{
           const col=b.categoryColor||IOS.blue;
           return (
           <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:i<locked.freePicks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
             <div style={{fontSize:8.5,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",color:col,background:`${col}1c`,borderRadius:5,padding:"3px 6px",flexShrink:0}}>{b.categoryLabel||b.category}</div>
             <div style={{flex:1,minWidth:0,fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</div>
             <div style={{fontSize:12.5,fontWeight:800,color:(b.odds||"").startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{b.odds}</div>
           </div>
           );
         })}
       </div>
       <div style={{display:"flex",gap:9}}>
         <button onClick={()=>setScreen("home")} style={{flex:1,background:IOS.blue,border:"none",borderRadius:11,padding:"13px",fontSize:14,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Back to Home</button>
         <button onClick={clearSoloSlate} style={{background:"rgba(255,69,58,0.12)",border:`0.5px solid ${IOS.red}40`,borderRadius:11,padding:"13px 16px",fontSize:14,fontWeight:800,color:IOS.red,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Clear</button>
       </div>
     </>
   ) : (
     <>
       {plokSlateBusy ? (
         <div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,0.04)",border:`0.5px solid ${IOS.blue}33`,borderRadius:12,padding:"13px 14px",marginBottom:12}}>
           <span className="ai-dot"/><span className="ai-dot" style={{animationDelay:".15s"}}/><span className="ai-dot" style={{animationDelay:".3s"}}/>
           <span style={{fontSize:12.5,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>Plok is building your slate…</span>
         </div>
       ) : plokSlate && plokSlate.error ? (
         <div style={{background:"rgba(255,69,58,0.08)",border:`0.5px solid ${IOS.red}33`,borderRadius:12,padding:"11px 14px",marginBottom:12,fontSize:12.5,color:"rgba(255,255,255,0.75)"}}>{plokSlate.error}</div>
       ) : plokSlate && plokSlate.picks ? (
         <div style={{background:`linear-gradient(135deg,${IOS.blue}1a,rgba(255,255,255,0.03))`,border:`0.5px solid ${IOS.blue}33`,borderRadius:14,padding:"13px 14px",marginBottom:12}}>
           <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
             <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.blue}}>Plok built a slate</div>
             <div onClick={()=>setPlokSlate(null)} style={{cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:17,lineHeight:1}}>×</div>
           </div>
           {plokSlate.strategy && <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.82)",marginBottom:11}}>{plokSlate.strategy}</div>}
           <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:12}}>
             {plokSlate.picks.map((b,i)=>{
               const col=b.categoryColor||IOS.blue;
               return (
               <div key={i} style={{display:"flex",alignItems:"flex-start",gap:9}}>
                 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",color:col,background:`${col}1c`,borderRadius:5,padding:"3px 6px",flexShrink:0,marginTop:1}}>{b.categoryLabel||b.category}</div>
                 <div style={{flex:1,minWidth:0}}>
                   <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                     <span style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</span>
                     <span style={{fontSize:11.5,fontWeight:800,color:(b.odds||"").startsWith("+")?IOS.green:IOS.blue,flexShrink:0}}>{b.odds}</span>
                   </div>
                   {plokSlate.reasons&&plokSlate.reasons[b.id] && <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1,lineHeight:1.35}}>{plokSlate.reasons[b.id]}</div>}
                 </div>
               </div>
               );
             })}
           </div>
           <button onClick={applyPlokSlate} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:11,padding:"11px",fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Add to my slate</button>
         </div>
       ) : (
         <button onClick={buildPlokSlate} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(255,255,255,0.05)",border:`1px solid ${IOS.blue}40`,borderRadius:12,padding:"12px",fontSize:13.5,fontWeight:800,color:IOS.blue,cursor:"pointer",fontFamily:"Barlow,sans-serif",marginBottom:12}}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill={IOS.blue} stroke="none"><path d="M12 2l1.7 5.4L19 9l-5.3 1.6L12 16l-1.7-5.4L5 9l5.3-1.6z"/></svg>
           Let Plok build my slate
         </button>
       )}
       <div style={{marginBottom:12}}>
         {soloFreePicks.length===0 ? (
           <div style={{background:IOS.bg2,border:"0.5px dashed rgba(255,255,255,0.14)",borderRadius:12,padding:"20px 16px",textAlign:"center"}}>
             <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>No picks yet</div>
             <div style={{fontSize:11.5,color:IOS.label3,marginTop:3}}>Tap bets below to add them to your slate.</div>
           </div>
         ) : (
           <div style={{background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"4px 12px"}}>
             {soloFreePicks.map((b,i)=>{
               const col=b.categoryColor||IOS.blue;
               return (
               <div key={b.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:i<soloFreePicks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
                 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",color:col,background:`${col}1c`,borderRadius:5,padding:"3px 6px",flexShrink:0}}>{b.categoryLabel||b.category}</div>
                 <div style={{flex:1,minWidth:0}}>
                   <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</div>
                   <div style={{fontSize:10.5,color:IOS.label3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.game}</div>
                 </div>
                 <div style={{textAlign:"right",flexShrink:0}}>
                   <div style={{fontSize:12.5,fontWeight:800,color:(b.odds||"").startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</div>
                   <div style={{fontSize:9.5,color:IOS.label3}}>+{ptsFor(b.impliedOdds)} pts</div>
                 </div>
                 <div onClick={()=>setSoloFreePicks(soloFreePicks.filter(x=>x.id!==b.id))} style={{width:24,height:24,borderRadius:7,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.5)",fontSize:15,cursor:"pointer",flexShrink:0}}>×</div>
               </div>
               );
             })}
           </div>
         )}
       </div>

       <button onClick={lockSoloFreeSlate} disabled={soloFreePicks.length===0} style={{width:"100%",background:soloFreePicks.length?IOS.green:"rgba(255,255,255,0.08)",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:800,color:soloFreePicks.length?"#fff":"rgba(255,255,255,0.35)",cursor:soloFreePicks.length?"pointer":"default",fontFamily:"Barlow,sans-serif",marginBottom:16}}>
         {soloFreePicks.length ? `Lock Slate · ${soloFreePicks.length} pick${soloFreePicks.length>1?"s":""} · up to ${projTotal.toFixed(1)} pts` : "Add at least 1 pick"}
       </button>

       <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:10,marginBottom:4}}>
         {CATS.map(c=>(
           <div key={c.k} onClick={()=>setFreeCat(c.k)} style={{flexShrink:0,padding:"7px 14px",borderRadius:9,fontSize:12.5,fontWeight:700,cursor:"pointer",background:freeCat===c.k?IOS.blue:"rgba(255,255,255,0.06)",color:freeCat===c.k?"#fff":"rgba(255,255,255,0.6)"}}>{c.l}</div>
         ))}
       </div>

       {!isLiveOdds ? (
         <div style={{textAlign:"center",padding:"30px 16px",color:IOS.label3,fontSize:13}}>Odds are still loading for this slate…</div>
       ) : board.length===0 ? (
         <div style={{textAlign:"center",padding:"30px 16px",color:IOS.label3,fontSize:13}}>No more bets in this category.</div>
       ) : (
         <div style={{display:"flex",flexDirection:"column",gap:7}}>
           {board.map(b=>{
             const col=b.categoryColor||IOS.blue;
             return (
             <div key={b.id} onClick={()=>{ if(atCap) return; setSoloFreePicks([...soloFreePicks, b]); }} style={{display:"flex",alignItems:"center",gap:10,background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 13px",cursor:atCap?"default":"pointer",opacity:atCap?0.5:1}}>
               <div style={{fontSize:8.5,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",color:col,background:`${col}1c`,borderRadius:5,padding:"3px 6px",flexShrink:0}}>{b.categoryLabel||b.category}</div>
               <div style={{flex:1,minWidth:0}}>
                 <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</div>
                 <div style={{fontSize:10.5,color:IOS.label3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.game}</div>
               </div>
               <div style={{textAlign:"right",flexShrink:0}}>
                 <div style={{fontSize:13,fontWeight:800,color:(b.odds||"").startsWith("+")?IOS.green:IOS.blue}}>{b.odds}</div>
                 <div style={{fontSize:9.5,color:IOS.label3}}>+{ptsFor(b.impliedOdds)} pts</div>
               </div>
               <div style={{width:26,height:26,borderRadius:8,background:atCap?"rgba(255,255,255,0.05)":`${IOS.blue}1f`,border:`0.5px solid ${IOS.blue}40`,display:"flex",alignItems:"center",justifyContent:"center",color:IOS.blue,fontSize:18,fontWeight:700,flexShrink:0}}>+</div>
             </div>
             );
           })}
           {atCap && <div style={{textAlign:"center",fontSize:11,color:IOS.label3,padding:"8px"}}>Slate cap reached ({CAP}). Remove one to add more.</div>}
         </div>
       )}
     </>
   )}
 </div>
 );})()
 }

 {/* ══ GRID BET BROWSER ══ */}
 {screen==="browser"&&(()=>{
 const activePicks = isSoloMode ? soloFlexPicks : flexPicks;
 const setActivePicks = isSoloMode ? setSoloFlexPicks : setFlexPicks;

 // Per-bet-type accent — the screen's accent shifts with the selected type
 const ACC = { ml:IOS.blue, spread:IOS.green, ou:IOS.orange, prop:IOS.yellow, longshot:IOS.pink, ml_h1:"#64D2FF", spread_h1:"#64D2FF", ou_h1:"#64D2FF", ml_f5:"#5E5CE6", spread_f5:"#5E5CE6", ou_f5:"#5E5CE6", yrfi:"#FF9F0A", nrfi:"#30D158" };
 const TYPE_LABELS = { ml:"Moneyline", spread:"Spread", ou:"Over/Under", prop:"Prop", longshot:"Longshot", ml_h1:"1H Moneyline", spread_h1:"1H Spread", ou_h1:"1H Over/Under", ml_f5:"F5 Moneyline", spread_f5:"F5 Spread", ou_f5:"F5 Over/Under", yrfi:"YRFI", nrfi:"NRFI" };
 const acc = ACC[gridType] || IOS.blue;
 const gridCfg = !isSoloMode ? parseSlotConfig(activeLeague&&activeLeague.slot_config) : null;
 const allowedTypes = gridCfg ? [...new Set(gridCfg.map(s=>s.type))] : ["ml","spread","ou","prop","longshot"];

 // Resolve active sport (default to league's first sport)
 const sportsList = leagueSports && leagueSports.length ? leagueSports : ["nfl"];
 const gSport = (gridSport && sportsList.includes(gridSport)) ? gridSport : sportsList[0];

 // Resolve which slot a tapped card fills
 const resolveTarget = () => {
 if(gridTargetSlot!==null && activePicks[gridTargetSlot] && !activePicks[gridTargetSlot].isParlay && activePicks[gridTargetSlot].bet===null) return gridTargetSlot;
 const firstEmpty = activePicks.findIndex(p=>!p.isParlay && p.bet===null);
 return firstEmpty===-1 ? (gridTargetSlot!==null?gridTargetSlot:0) : firstEmpty;
 };
 const target = resolveTarget();
 const targetMult = activePicks[target]?.mult || null;
 const slotsLeft = activePicks.filter(p=>!p.isParlay && p.bet===null).length;

 // ─── ACCURATE DERIVED HELPERS (from real odds) ───
 const impliedPct = (o) => o<0 ? Math.round((-o)/((-o)+100)*100) : Math.round(100/(o+100)*100);
 const decReturn = (o) => o<0 ? (100/Math.abs(o))+1 : (o/100)+1; // payout multiple incl. stake
 const readFor = (pct) => {
 if(gridType==="ou"||gridType==="prop") {
 if(pct>=62) return {t:"Strong lean",c:IOS.green};
 if(pct>=52) return {t:"Slight lean",c:acc};
 if(pct>=48) return {t:"Coin flip",c:IOS.label2};
 return {t:"Live dog",c:IOS.orange};
 }
 if(pct>=70) return {t:"Heavy favorite",c:IOS.green};
 if(pct>=58) return {t:"Favored",c:acc};
 if(pct>=50) return {t:"Slight edge",c:IOS.label2};
 if(pct>=42) return {t:"Slight dog",c:IOS.orange};
 return {t:"Underdog",c:IOS.pink};
 };

 // Parse "Away @ Home"
 const parseGame = (g="") => {
 const parts = g.includes(" @ ") ? g.split(" @ ") : g.includes(" vs ") ? g.split(" vs ") : [g];
 return { away:(parts[0]||"").trim(), home:(parts[1]||"").trim() };
 };
 // Strip trailing line/suffix from a pick to recover the team name
 const teamFromSpread = (pick="") => pick.replace(/\s*[+\-]?\d+(\.\d+)?\s*$/,"").trim();
 const teamFromLongshot = (pick="") => pick.replace(/\s*ML$/i,"").replace(/\s*[+\-]?\d+(\.\d+)?\s*$/,"").trim();
 const lineFromSpread = (pick="") => { const m=pick.match(/[+\-]?\d+(\.\d+)?\s*$/); return m?m[0].trim():""; };
 const sideOf = (teamName, g) => { // "HOME" | "AWAY" | null
 const { away, home } = parseGame(g);
 if(!teamName) return null;
 const ta = getAcronym(teamName,false);
 if(ta && getAcronym(home,false)===ta) return "HOME";
 if(ta && getAcronym(away,false)===ta) return "AWAY";
 if(home && home.includes(teamName)) return "HOME";
 if(away && away.includes(teamName)) return "AWAY";
 return null;
 };

 // ─── RECENT FORM (placeholder until ESPN game logs are wired) ───
 // Deterministic from a seed so it's stable per team/bet (not random flicker).
 // Replace `formFor` with real last-3 results from your ESPN feed when ready.
 const recordFor = (teamName, g) => { const pg=parseGame(g); const aw=(pg.away||"").toLowerCase(), hm=(pg.home||"").toLowerCase(); const e=(espnGames||[]).find(x=> (x.awayTeam&&aw&&x.awayTeam.toLowerCase().includes(aw)) || (x.homeTeam&&hm&&x.homeTeam.toLowerCase().includes(hm)) ); if(!e) return null; const side=sideOf(teamName,g); return side==="HOME"?(e.homeRecord||null):side==="AWAY"?(e.awayRecord||null):null; };
 const GRID_SHOW_FORM = true;
 const formFor = (seed="") => {
 let h=0; for(let i=0;i<seed.length;i++){ h=(h*31 + seed.charCodeAt(i))>>>0; }
 return [0,1,2].map(i => ((h>>(i*3)) & 3) === 0 ? "L" : "W");
 };

 // ─── Build the bet list for the selected sport + type ───
 let list = [];
 if(gridType==="longshot") {
 list = gridBuildMode ? (ALL_BETS||[]).filter(b=> b._sport===gSport) : (ALL_BETS||[]).filter(b=> b._sport===gSport && b.impliedOdds>=400);
 } else {
 list = (BETS[gridType]||[]).filter(b=> b._sport===gSport);
 }
 { const _seen=new Set(); list = list.filter(b=>{ const k=(b.game||"")+"|"+(b.pick||b.label||b.id||""); if(_seen.has(k)) return false; _seen.add(k); return true; }); }

 // Prop sub-category filter
 const propSubsBySport = PROP_SUBS_BY_SPORT;
 const propSubs = propSubsBySport[gSport] || [{id:"all",l:"All"}];
 if(gridType==="prop" && gridPropSub!=="all") {
 list = list.filter(b=>{
 const s = ((b.pick||"")+" "+(b.game||"")).toLowerCase();
 switch(gridPropSub){
 case "pass": return s.includes("pass");
 case "rush": return s.includes("rush")&&!s.includes("rec");
 case "rec": return s.includes("rec")||s.includes("receiv");
 case "td": return s.includes("td")||s.includes("touchdown");
 case "pts": return s.includes("point")||s.includes("pts");
 case "reb": return s.includes("rebound")||s.includes("reb");
 case "ast": return s.includes("assist")||s.includes("ast");
 case "3pt": return s.includes("three")||s.includes("3pt")||s.includes("3-point");
 case "k": return s.includes("strikeout")||s.includes(" k");
 case "hits": return s.includes("hit");
 case "hr": return s.includes("home run")||s.includes("hr")||s.includes("homer");
 case "bases": return s.includes("base");
 default: return true;
 }
 });
 }

 if(gridSearch.trim()){ const _q=gridSearch.toLowerCase().trim(); list = list.filter(b=>((b.pick||"")+" "+(b.game||"")).toLowerCase().includes(_q)); }
 // ── Folded parlay (flex leagues): one multiplier holds a parlay built right here ──
 const _parIdx = activePicks.findIndex(p=>p.isParlay);
 const parlayLegs = _parIdx!==-1 ? (activePicks[_parIdx].parlayLegs||[]) : [];
 const isLeg = (b)=> !!b && parlayLegs.some(l=>String(l.id)===String(b.id)||l.pick===b.pick);
 const flagParlay = (M)=>{
 const prior = activePicks.find(p=>p.isParlay);
 if(prior && prior.mult!==M && (prior.parlayLegs||[]).length>=2){
 if(typeof window!=="undefined" && !window.confirm("Move the parlay to "+M+"x? This clears the "+prior.parlayLegs.length+" legs on your "+prior.mult+"x slot.")) return;
 }
 setActivePicks(prev=>{
 const next = prev.map(p=> p.isParlay ? {...p, isParlay:false, parlayLegs:[], bet:null, category:undefined} : p);
 let idx = next.findIndex(p=>p.mult===M);
 if(idx===-1) idx = next.findIndex(p=>!p.isParlay && p.bet===null && p.mult==null);
 if(idx===-1) idx = next.findIndex(p=>!p.isParlay && p.bet===null);
 if(idx===-1) idx = 0;
 next[idx] = {...next[idx], isParlay:true, bet:null, category:"longshot", mult:M, parlayLegs:(next[idx].parlayLegs||[])};
 return next;
 });
 setGridParlayMult(M);
 if((gridFlexMult||1)===M){ const nm=[1,2,3,4,5].find(m=>m!==M); if(nm) setGridFlexMult(nm); }
 };
 const toggleLeg = (bet)=>{
 const leg = {id:bet.id, pick:bet.pick, game:bet.game||"", odds:bet.odds, impliedOdds:bet.impliedOdds};
 setActivePicks(prev=>{
 let found=false;
 let next = prev.map(p=>{
 if(!p.isParlay) return p;
 found=true;
 const legs=p.parlayLegs||[];
 const has=legs.some(l=>String(l.id)===String(bet.id)||l.pick===bet.pick);
 return {...p, parlayLegs: has ? legs.filter(l=>!(String(l.id)===String(bet.id)||l.pick===bet.pick)) : [...legs, leg]};
 });
 if(!found){
 const M=gridParlayMult;
 let idx = next.findIndex(p=>p.mult===M);
 if(idx===-1) idx = next.findIndex(p=>!p.isParlay && p.bet===null);
 if(idx===-1) idx = next.length-1;
 next = next.map((p,i)=> i===idx ? {...p, isParlay:true, bet:null, category:"longshot", mult:M, parlayLegs:[leg]} : p);
 }
 return next;
 });
 setGridJustAdded(bet.id);
 setTimeout(()=>setGridJustAdded(null), 300);
 };
 const enterBuild = ()=>{
 if(gridCfg && !isSoloMode){
 const ti = (gridTargetSlot!=null && activePicks[gridTargetSlot] && activePicks[gridTargetSlot].category==="longshot") ? gridTargetSlot : activePicks.findIndex(p=>p.category==="longshot");
 if(ti!==-1) setActivePicks(prev=>prev.map((p,i)=> i===ti ? {...p, isParlay:true, bet:null, parlayLegs:(p.parlayLegs||[])} : p));
 } else if(activePicks.findIndex(p=>p.isParlay)===-1){ flagParlay(gridParlayMult); }
 setGridBuildMode(true); setShowMultPick(false);
 };
 const addCard = (bet, catOverride) => {
 const cat = catOverride || (gridType==="longshot" ? "longshot" : gridType);
 if(gridBuildMode && !isSoloMode){ toggleLeg(bet); return; }
 // One bet per type (longshot legs excepted): if this type is already in the
 // slip, replace that slot instead of stacking a second bet of the same type.
 let dest = target;
 if(gridCfg){
 // Custom league: each slot has a fixed category. Route the tapped bet to a
 // slot that accepts THIS market (prefer the active target, else first empty).
 const tgt = activePicks[target];
 if(!tgt || tgt.isParlay || tgt.category!==cat){
 let idx = activePicks.findIndex(p=>!p.isParlay && p.category===cat && p.bet===null);
 if(idx===-1) idx = activePicks.findIndex(p=>!p.isParlay && p.category===cat);
 if(idx===-1) return;
 dest = idx;
 }
 } else if(!isSoloMode && gridFlexMult!=null && cat!=="longshot"){
 // Flex league, multiplier-first: fill the chosen mult slot (replace if taken),
 // else the first empty slot. Lets you stack two of a type at different mults.
 let mi = activePicks.findIndex(p=>!p.isParlay && p.mult===gridFlexMult);
 if(mi===-1) mi = activePicks.findIndex(p=>!p.isParlay && p.bet===null);
 if(mi!==-1) dest = mi;
 } else if(cat!=="longshot"){
 const existingIdx = activePicks.findIndex(p=>!p.isParlay && p.bet!==null && p.category===cat);
 if(existingIdx!==-1) dest = existingIdx;
 }
 setActivePicks(prev=>prev.map((p,i)=> i===dest ? {...p, bet, category:cat, isParlay:false, parlayLegs:[], mult:((!gridCfg && !isSoloMode && gridFlexMult!=null && cat!=="longshot") ? gridFlexMult : p.mult)} : p));
 setGridJustAdded(bet.id);
 // Advance to next empty slot, or bounce back to the slip if full
 const nextEmpty = activePicks.findIndex((p,i)=> i!==dest && !p.isParlay && p.bet===null);
 const flexMode = !gridCfg && !isSoloMode && gridFlexMult!=null && cat!=="longshot";
 let nextMult = null;
 if(flexMode){
 const used = activePicks.map((p,i)=> i===dest ? gridFlexMult : p.mult).filter(m=>m!=null);
 nextMult = [1,2,3,4,5].find(m=>!used.includes(m));
 }
 setTimeout(()=>{
 if(flexMode){
 if(nextMult!=null){ setGridFlexMult(nextMult); if(nextEmpty!==-1) setGridTargetSlot(nextEmpty); }
 else { setScreen("picks"); }
 } else if(nextEmpty===-1){ setScreen("picks"); }
 else { setGridTargetSlot(nextEmpty); }
 setGridJustAdded(null);
 }, 480);
 };

 const FormDots = ({seed}) => GRID_SHOW_FORM ? (
 <div style={{display:"flex",gap:3,alignItems:"center"}}>
 {formFor(seed).map((r,i)=>(
 <div key={i} style={{width:15,height:15,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,
 background:r==="W"?"rgba(48,209,88,0.18)":"rgba(255,69,58,0.16)", color:r==="W"?IOS.green:IOS.red}}>{r}</div>
 ))}
 </div>
 ) : null;

 const Meter = ({pct}) => (
 <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.07)",overflow:"hidden",width:"100%"}}>
 <div style={{height:"100%",width:`${Math.max(6,Math.min(100,pct))}%`,borderRadius:3,background:`linear-gradient(90deg,${acc},${acc}88)`}}/>
 </div>
 );

 const StatLabel = ({children}) => (<div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.32)",marginBottom:3}}>{children}</div>);

 const renderCard = (bet, idx) => {
 const selected = activePicks.some(p=>p.bet?.id===bet.id) || isLeg(bet);
 const added = gridJustAdded===bet.id;
 const pct = impliedPct(bet.impliedOdds);
 const read = readFor(pct);
 const pos = bet.odds?.startsWith("+");
 const pts = calcPickPoints(targetMult||1, bet.impliedOdds, "W");
 const ret = decReturn(bet.impliedOdds);

 // Header line + body vary by type
 let topLabel = `${gSport.toUpperCase()} · ${TYPE_LABELS[gridType]}`;
 let title, subtitle, sideChip=null, formSeed=bet.id;

 if(gridType==="ml"){
 const side = sideOf(bet.pick, bet.game); const {away,home}=parseGame(bet.game);
 const opp = side==="HOME"?away:home;
 title = bet.pick; subtitle = opp?`vs ${opp}`:bet.game; sideChip = side; formSeed = bet.pick;
 } else if(gridType==="spread"){
 const team = teamFromSpread(bet.pick); const line = lineFromSpread(bet.pick);
 const side = sideOf(team, bet.game); const {away,home}=parseGame(bet.game);
 const opp = side==="HOME"?away:home;
 title = team; subtitle = `${line}${opp?`  ·  vs ${opp}`:""}`; sideChip = side; formSeed = team;
 } else if(gridType==="ou"){
 title = bet.game; subtitle = bet.pick; sideChip = bet.pick?.toLowerCase().startsWith("over")?"OVER":bet.pick?.toLowerCase().startsWith("under")?"UNDER":null; formSeed = bet.game;
 } else if(gridType==="prop"){
 title = bet.game || bet.pick; subtitle = bet.pick; sideChip = bet.pick?.toLowerCase().includes("over")?"OVER":bet.pick?.toLowerCase().includes("under")?"UNDER":null; formSeed = (bet.game||"")+bet.pick;
 } else { // longshot
 title = teamFromLongshot(bet.pick)||bet.pick; subtitle = bet.game; formSeed = bet.pick;
 }

 return (
 <div key={bet.id} className="gbx-card" onClick={()=>addCard(bet)} style={{
 position:"relative", overflow:"hidden", cursor:"pointer", borderRadius:16, padding:"13px 13px 12px",
 background:"linear-gradient(160deg,#17171B 0%,#0D0D10 100%)",
 border:`1px solid ${selected||added?acc:"rgba(255,255,255,0.07)"}`,
 boxShadow:selected||added?`0 0 0 1px ${acc}, 0 8px 24px ${acc}22`:"0 4px 14px rgba(0,0,0,0.4)",
 animation:`gbxRise .35s ease ${Math.min(idx,8)*0.035}s both`,
 }}>
 {/* accent glow top-right */}
 <div style={{position:"absolute",top:-30,right:-30,width:90,height:90,borderRadius:"50%",background:`radial-gradient(circle,${acc}26,transparent 70%)`,pointerEvents:"none"}}/>
 {/* odds badge */}
 <div style={{position:"absolute",top:11,right:11,fontSize:12,fontWeight:800,letterSpacing:"-0.2px",
 color:pos?IOS.green:"rgba(255,255,255,0.55)"}}>{bet.odds}</div>

 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase",color:acc,marginBottom:7,paddingRight:42}}>{topLabel}</div>

 <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,paddingRight:6}}>
 <div style={{fontSize:gridType==="longshot"||gridType==="ou"?12.5:14.5,fontWeight:800,color:"#fff",lineHeight:1.15,letterSpacing:"-0.3px",
 display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{title}</div>
 </div>
 {sideChip && (
 <div style={{display:"inline-flex",marginTop:2,marginBottom:4,fontSize:8,fontWeight:800,letterSpacing:"0.05em",
 color:sideChip==="HOME"||sideChip==="OVER"?acc:"rgba(255,255,255,0.5)",
 background:sideChip==="HOME"||sideChip==="OVER"?`${acc}1f`:"rgba(255,255,255,0.06)",
 borderRadius:4,padding:"1px 6px"}}>{sideChip}</div>
 )}
 <div style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",marginBottom:9,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{subtitle}</div>

 {/* Implied probability — accurate, derived from the line */}
 <StatLabel>Implied chance</StatLabel>
 <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
 <Meter pct={pct}/>
 <div style={{fontSize:12,fontWeight:800,color:"#fff",flexShrink:0,minWidth:30,textAlign:"right"}}>{pct}%</div>
 </div>
 <div style={{fontSize:10,fontWeight:700,color:read.c,marginBottom:10}}>{read.t}</div>

 {/* Bottom row: recent form + reward */}
 <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:6}}>
 <button onClick={(e)=>{e.stopPropagation(); askFromBet(bet, gridType==="longshot"?"longshot":gridType);}} aria-label="Ask AI" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:8,background:`${acc}1a`,border:`1px solid ${acc}33`,color:acc,fontSize:9.5,fontWeight:800,cursor:"pointer",flexShrink:0,alignSelf:"flex-end"}}><svg width="11" height="11" viewBox="0 0 24 24" fill={acc}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>AI</button>
 <div>
 
 {(()=>{ const _rec=recordFor(formSeed, bet.game); return _rec ? (<><StatLabel>Record</StatLabel><div style={{fontSize:12.5,fontWeight:800,color:"#fff",lineHeight:1}}>{_rec}</div></>) : null; })()}
 </div>
 <div style={{textAlign:"right"}}>
 <StatLabel>{gridType==="longshot"?`${ret.toFixed(1)}× return`:"If win"}</StatLabel>
 <div style={{fontSize:13,fontWeight:800,color:IOS.green,lineHeight:1}}>+{pts}<span style={{fontSize:9,fontWeight:700,color:"rgba(48,209,88,0.6)",marginLeft:2}}>pts</span></div>
 </div>
 </div>

 {/* added flash */}
 {added && (
 <div style={{position:"absolute",inset:0,background:`${acc}1a`,backdropFilter:"blur(1px)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:16}}>
 <div style={{display:"flex",alignItems:"center",gap:6,background:acc,color:"#fff",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:800,boxShadow:`0 4px 16px ${acc}66`}}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
 Added
 </div>
 </div>
 )}
 </div>
 );
 };


 // --- LINE SHEET (spiced) -- ml/spread/ou grouped by game ---
 const isGameLine = gridType==="ml"||gridType==="spread"||gridType==="ou";
 const impFrac = (o)=>{ const p=impliedPct(o); return p?p/100:0; };
 const ptsOf = (b)=> b ? calcPickPoints(targetMult||1, b.impliedOdds, "W") : 0;
 const nick = (nm="")=>{ const w=String(nm).trim().split(/\s+/); return w.length>1 ? w[w.length-1] : nm; };
 const _bg = {};
 const _ens = (g,t)=>{ if(!_bg[g]){ const pg=parseGame(g); _bg[g]={ game:g, away:pg.away, home:pg.home, time:t||"", ml:{}, spread:{}, ou:{} }; } if(t&&!_bg[g].time)_bg[g].time=t; return _bg[g]; };
 (BETS.ml||[]).filter(b=>b._sport===gSport).forEach(b=>{ const e=_ens(b.game,b.gameTime); const sd=sideOf(b.outcome||b.pick,b.game); if(sd==="AWAY")e.ml.away=b; else if(sd==="HOME")e.ml.home=b; });
 (BETS.spread||[]).filter(b=>b._sport===gSport).forEach(b=>{ const e=_ens(b.game,b.gameTime); const sd=sideOf(b.outcome||teamFromSpread(b.pick),b.game); if(sd==="AWAY")e.spread.away=b; else if(sd==="HOME")e.spread.home=b; });
 (BETS.ou||[]).filter(b=>b._sport===gSport).forEach(b=>{ const e=_ens(b.game,b.gameTime); const o=String(b.outcome||b.pick||"").toLowerCase(); if(o.indexOf("over")===0)e.ou.over=b; else if(o.indexOf("under")===0)e.ou.under=b; });
 let sheetGames = Object.values(_bg);
 if(gridSearch.trim()){ const q=gridSearch.toLowerCase().trim(); sheetGames=sheetGames.filter(g=>String(g.game).toLowerCase().includes(q)); }
 sheetGames.sort((a,b)=> (new Date(a.time||0)) - (new Date(b.time||0)) );
 const mkOver = (x,y)=>{ if(!x||!y) return 2; return impFrac(x.impliedOdds)+impFrac(y.impliedOdds); };
 sheetGames.forEach(g=>{ g._ov={ ml:mkOver(g.ml.away,g.ml.home), spread:mkOver(g.spread.away,g.spread.home), ou:mkOver(g.ou.over,g.ou.under) }; g._best=Math.min(g._ov.ml,g._ov.spread,g._ov.ou); });
 const EDGE_MIN = 0.01; // 1%+ true edge: best price beats the de-vigged consensus (from /api/odds)
 const fmtAm = (o)=> (o>0?("+"+o):(""+o));
 const _chips = (g)=>[g.ml.away,g.ml.home,g.spread.away,g.spread.home,g.ou.over,g.ou.under];
 const haveEdge = sheetGames.some(g=>_chips(g).some(b=>b&&b.edge!=null));
 const isVal = (b, mktVig)=> !b ? false : (haveEdge ? (b.edge!=null && b.edge>=EDGE_MIN) : (mktVig<1));
 sheetGames.forEach(g=>{ g._edge = Math.max(-1, ..._chips(g).map(b=>(b&&b.edge!=null)?b.edge:-1)); });
 let plokGame=null;
 if(haveEdge){ let mx=EDGE_MIN; sheetGames.forEach(g=>{ if(g._edge>mx){ mx=g._edge; plokGame=g.game; } }); }
 else { let plokBestOv=1.0; sheetGames.forEach(g=>{ if(g._best<plokBestOv){ plokBestOv=g._best; plokGame=g.game; } }); }
 const _now=Date.now();
 const dayLabel=(t)=>{ if(!t) return ""; const d=new Date(t); const n=new Date(); if(d.toDateString()===n.toDateString()) return d.getHours()<17?"Today":"Tonight"; const tmr=new Date(n.getTime()+864e5); if(d.toDateString()===tmr.toDateString()) return "Tomorrow"; return d.toLocaleDateString([], {weekday:"short"}); };
 const clockLabel=(t)=>{ if(!t) return ""; return new Date(t).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})+" ET"; };
 const blockLabel=(t)=>{ if(!t) return "Upcoming"; const d=new Date(t); const h=d.getHours(); const hr=((h+11)%12)+1; const ap=h<12?"AM":"PM"; return hr+":00 "+ap+" ET"; };
 const countdown=(t)=>{ if(!t) return ""; const ms=new Date(t).getTime()-_now; if(ms<=0) return "Live / started"; const m=Math.floor(ms/60000); const h=Math.floor(m/60); const mm=m%60; return h>0?("starts in "+h+"h "+mm+"m"):("starts in "+mm+"m"); };
 const lineAllowed = (cat)=> !gridCfg ? true : allowedTypes.includes(cat);
 const Chip = ({b, cat, line, value, mv}) => {
 if(!b) return <div style={{borderRadius:10,border:"1px dashed rgba(255,255,255,0.08)",minHeight:46}}/>;
 const enabled = lineAllowed(cat);
 const sel = (activePicks.some(p=>p.bet&&p.bet.id===b.id)) || isLeg(b);
 const pts = ptsOf(b);
 return (
 <div onClick={()=>{ if(enabled) addCard(b,cat); }} style={{position:"relative",borderRadius:10,cursor:enabled?"pointer":"default",textAlign:"center",padding:"6px 3px",opacity:enabled?1:0.4,
 border:"1px solid "+(sel?IOS.blue+"a6":value?"rgba(48,209,88,0.55)":"rgba(255,255,255,0.1)"),
 background:sel?"linear-gradient(160deg,rgba(10,132,255,0.24),rgba(10,132,255,0.05))":value?"linear-gradient(160deg,rgba(48,209,88,0.2),rgba(48,209,88,0.04))":"rgba(255,255,255,0.04)",transition:"all .13s"}}>
 {value && <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round"><polyline points="6 14 12 8 18 14"/></svg></div>}
 {line ? <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)"}}>{line}</div> : null}
 <div style={{fontSize:13,fontWeight:900,color:sel?IOS.blue:"#fff",fontVariantNumeric:"tabular-nums",lineHeight:1.1}}>{b.odds}</div>
 <div style={{fontSize:8,fontWeight:700,color:IOS.green}}>+{pts}</div>
 {mv && mv.implied!=null && (()=>{ const cur=impFrac(b.impliedOdds); const op=Number(mv.implied); if(!op) return null; const yy=(v)=>(7-Math.max(0,Math.min(1,v))*6).toFixed(1); const up=cur>op+0.003, dn=cur<op-0.003; const col=up?IOS.green:dn?IOS.red:"rgba(255,255,255,0.3)"; return (<svg viewBox="0 0 40 8" preserveAspectRatio="none" style={{position:"absolute",bottom:1,left:6,width:"calc(100% - 12px)",height:5,opacity:0.55}}><polyline points={"0,"+yy(op)+" 40,"+yy(cur)} fill="none" stroke={col} strokeWidth="1.5"/></svg>); })()}
 </div>
 );
 };
 const renderLineSheet = () => {
 if(sheetGames.length===0) return (
 <div style={{padding:"50px 28px",textAlign:"center"}}>
 <div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.45)",marginBottom:6}}>No game lines right now</div>
 <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.5}}>Check back when games are scheduled for this sport.</div>
 </div>
 );
 let lastBlock=null;
 return (
 <div style={{padding:"4px 14px 28px"}}>
 {sheetGames.map((g,gi)=>{
 const blk=blockLabel(g.time);
 const showHead = blk!==lastBlock; const headFirst = lastBlock===null; lastBlock=blk;
 const blockCount = sheetGames.filter(x=>blockLabel(x.time)===blk).length;
 const isPlok = g.game===plokGame;
 const exp = sheetExpanded===g.game;
 const awayRec=recordFor(g.away,g.game), homeRec=recordFor(g.home,g.game);
 const spLineA=g.spread.away?(lineFromSpread(g.spread.away.pick)||(g.spread.away.point!=null?String(g.spread.away.point):"")):"";
 const spLineH=g.spread.home?(lineFromSpread(g.spread.home.pick)||(g.spread.home.point!=null?String(g.spread.home.point):"")):"";
 const totPt=(g.ou.over&&g.ou.over.point!=null)?g.ou.over.point:((g.ou.under&&g.ou.under.point!=null)?g.ou.under.point:"");
 const gv = isVal(g.ml.away,g._ov.ml)||isVal(g.ml.home,g._ov.ml)||isVal(g.spread.away,g._ov.spread)||isVal(g.spread.home,g._ov.spread)||isVal(g.ou.over,g._ov.ou)||isVal(g.ou.under,g._ov.ou);
 return (
 <div key={g.game}>
 {showHead && (
 <div style={{position:"sticky",top:0,zIndex:4,display:"flex",alignItems:"center",gap:8,padding:"8px 2px 7px",background:"linear-gradient(180deg,#08080A,rgba(8,8,10,0.7))",backdropFilter:"blur(6px)"}}>
 <span style={{width:6,height:6,borderRadius:"50%",background:headFirst?IOS.orange:"rgba(255,255,255,0.3)",boxShadow:headFirst?"0 0 7px "+IOS.orange:"none"}}/>
 <span style={{fontSize:12,fontWeight:800}}>{blk} block</span>
 <span style={{fontSize:10,color:"rgba(255,255,255,0.32)",fontWeight:700,marginLeft:"auto"}}>{blockCount} game{blockCount>1?"s":""}</span>
 </div>
 )}
 <div style={{border:"1px solid "+(isPlok?"rgba(255,214,10,0.4)":"rgba(255,255,255,0.09)"),borderRadius:16,background:"linear-gradient(165deg,#15151A,#0B0B0E 80%)",overflow:"hidden",margin:"10px 0",boxShadow:isPlok?"0 0 0 1px rgba(255,214,10,0.15),0 10px 28px rgba(0,0,0,0.4)":"0 6px 18px rgba(0,0,0,0.35)"}}>
 {isPlok && (
 <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 13px",background:"rgba(255,214,10,0.1)",borderBottom:"1px solid rgba(255,214,10,0.2)",fontSize:10,fontWeight:800,color:IOS.yellow}}>
 <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>PLOK'S BEST · sharpest price on the board
 </div>
 )}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px 4px"}}>
 <div style={{fontSize:11,fontWeight:800}}>{dayLabel(g.time)} · <span style={{color:IOS.teal}}>{clockLabel(g.time)}</span></div>
 <div style={{fontSize:10,fontWeight:700,color:IOS.orange}}>{countdown(g.time)}</div>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1.45fr 1fr 1fr 1fr",padding:"4px 13px 2px"}}>
 {["Team","Spread","Total","Money"].map((h,hi)=>(<span key={h} style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",color:"rgba(255,255,255,0.32)",textAlign:hi===0?"left":"center"}}>{h}</span>))}
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1.45fr 1fr 1fr 1fr",alignItems:"stretch"}}>
 <div style={{padding:"8px 13px",display:"flex",flexDirection:"column",justifyContent:"center",gap:9}}>
 {[{nm:g.away,badge:"away",rec:awayRec},{nm:g.home,badge:"home",rec:homeRec}].map((tm,ti)=>(
 <div key={ti} style={{display:"flex",alignItems:"center",gap:8}}>
 <div style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,background:tm.badge==="home"?"rgba(10,132,255,0.16)":"rgba(255,255,255,0.08)",color:tm.badge==="home"?IOS.teal:"rgba(255,255,255,0.6)"}}>{getAcronym(tm.nm,false)}</div>
 <div style={{minWidth:0}}>
 <div style={{fontSize:13.5,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nick(tm.nm)} <span style={{fontSize:8,fontWeight:800,letterSpacing:"0.05em",padding:"1px 5px",borderRadius:4,background:tm.badge==="home"?"rgba(10,132,255,0.18)":"rgba(255,255,255,0.08)",color:tm.badge==="home"?IOS.teal:"rgba(255,255,255,0.5)"}}>{tm.badge==="home"?"HOME":"AWAY"}</span></div>
 {tm.rec ? <div style={{fontSize:9.5,color:"rgba(255,255,255,0.34)",fontWeight:600,marginTop:1}}>{tm.rec}</div> : null}
 </div>
 </div>
 ))}
 </div>
 <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:6,padding:"8px 4px"}}>
 <Chip b={g.spread.away} cat="spread" line={spLineA} value={isVal(g.spread.away,g._ov.spread)}/>
 <Chip b={g.spread.home} cat="spread" line={spLineH} value={isVal(g.spread.home,g._ov.spread)}/>
 </div>
 <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:6,padding:"8px 4px"}}>
 <Chip b={g.ou.over} cat="ou" line={totPt!==""?("O "+totPt):""} value={isVal(g.ou.over,g._ov.ou)}/>
 <Chip b={g.ou.under} cat="ou" line={totPt!==""?("U "+totPt):""} value={isVal(g.ou.under,g._ov.ou)}/>
 </div>
 <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gap:6,padding:"8px 4px"}}>
 <Chip b={g.ml.away} cat="ml" line="" value={isVal(g.ml.away,g._ov.ml)} mv={g.ml.away?lineMoves[g.ml.away.selKey]:null}/>
 <Chip b={g.ml.home} cat="ml" line="" value={isVal(g.ml.home,g._ov.ml)} mv={g.ml.home?lineMoves[g.ml.home.selKey]:null}/>
 </div>
 </div>
 <div onClick={()=>setSheetExpanded(exp?null:g.game)} style={{borderTop:"1px solid rgba(255,255,255,0.07)",padding:"7px 14px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",background:"rgba(255,255,255,0.015)"}}>
 <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)"}}>{exp?"Hide detail":"Tap for implied % + read"}</span>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" style={{marginLeft:"auto",transform:exp?"rotate(180deg)":"none",transition:"transform .15s"}}><polyline points="6 9 12 15 18 9"/></svg>
 </div>
 {exp && (
 <div style={{padding:"4px 14px 12px",display:"flex",flexWrap:"wrap",gap:"6px 16px",fontSize:10.5,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>
 {g.ml.away && <div>Implied <b style={{color:"#fff"}}>{impliedPct(g.ml.away.impliedOdds)}%</b> {nick(g.away)}</div>}
 {g.ml.home && <div>Implied <b style={{color:"#fff"}}>{impliedPct(g.ml.home.impliedOdds)}%</b> {nick(g.home)}</div>}
 {g.ml.away && lineMoves[g.ml.away.selKey] && <div>{nick(g.away)} <b style={{color:"#fff"}}>{fmtAm(lineMoves[g.ml.away.selKey].odds)} → {g.ml.away.odds}</b></div>}
 {g.ml.home && lineMoves[g.ml.home.selKey] && <div>{nick(g.home)} <b style={{color:"#fff"}}>{fmtAm(lineMoves[g.ml.home.selKey].odds)} → {g.ml.home.odds}</b></div>}
 {gv ? <div style={{color:IOS.green,fontWeight:700}}>+EV — best price beats the consensus</div> : <div style={{color:"rgba(255,255,255,0.34)"}}>No standout edge</div>}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
 };

 const pillBase = {padding:"7px 13px",borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",border:"1px solid",transition:"all .15s",flexShrink:0};

 return (
 <div className="body" style={{background:"#08080A"}}>
 <style>{`
 @keyframes gbxRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
 .gbx-card{ transition:transform .12s ease, border-color .15s ease, box-shadow .15s ease; will-change:transform; }
 .gbx-card:active{ transform:scale(0.965); }
 .gbx-scroll::-webkit-scrollbar{ display:none; }
 `}</style>

 {/* Header */}
 <div style={{position:"sticky",top:0,zIndex:10,background:"linear-gradient(180deg,#08080A 70%,rgba(8,8,10,0))",paddingBottom:6}}>
 <div style={{display:"flex",alignItems:"center",gap:11,padding:"10px 16px 8px"}}>
 <div onClick={()=>setScreen("picks")} style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:acc,fontSize:18,flexShrink:0}}>‹</div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:21,fontWeight:800,letterSpacing:"-0.6px",color:"#fff",lineHeight:1}}>Bet Browser</div>
 <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
 <span style={{width:6,height:6,borderRadius:"50%",background:isLiveOdds?IOS.green:IOS.orange,display:"inline-block",boxShadow:isLiveOdds?`0 0 6px ${IOS.green}`:"none"}}/>
 {isLiveOdds?"Live odds":"Sample odds"} · Filling Pick {target+1}{targetMult?` (${targetMult}×)`:""}
 </div>
 </div>
 {gridCfg && (()=>{
 const slots = activePicks.map((p,i)=>({i, mult:p.mult, category:p.category, bet:p.bet, isParlay:p.isParlay, parlayLegs:p.parlayLegs}));
 const tgt = activePicks[target] || {};
 const tCol = ACC[tgt.category] || acc;
 return (
 <div style={{position:"relative",flexShrink:0}}>
 <div onClick={()=>setShowMultPick(v=>!v)} style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1,background:"rgba(255,255,255,0.05)",border:"1px solid "+(showMultPick?tCol+"80":"rgba(255,255,255,0.1)"),borderRadius:10,padding:"5px 10px",cursor:"pointer",minWidth:60}}>
 <div style={{fontSize:7.5,fontWeight:800,letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)"}}>MULTIPLIER</div>
 <div style={{display:"flex",alignItems:"center",gap:5}}>
 <span style={{fontSize:15,fontWeight:900,color:tCol,letterSpacing:"-0.3px"}}>{tgt.mult?(tgt.mult+"×"):("P"+(target+1))}</span>
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.6" strokeLinecap="round" style={{transform:showMultPick?"rotate(180deg)":"none",transition:"transform .15s"}}><polyline points="6 9 12 15 18 9"/></svg>
 </div>
 </div>
 {showMultPick && (<>
 <div onClick={()=>setShowMultPick(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
 <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:41,width:212,background:"#15151c",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:6,boxShadow:"0 16px 40px rgba(0,0,0,0.6)"}}>
 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.08em",color:"rgba(255,255,255,0.35)",padding:"5px 8px 6px"}}>PICK A SLOT TO FILL</div>
 {slots.map(sl=>{
 const sc = ACC[sl.category] || acc;
 const isT = sl.i===target;
 const filled = sl.isParlay ? (sl.parlayLegs&&sl.parlayLegs.length>=2) : !!sl.bet;
 const nm = sl.isParlay ? ((sl.parlayLegs||[]).length+"-leg parlay") : (sl.bet ? sl.bet.pick : "Empty");
 return (
 <div key={sl.i} onClick={()=>{ setGridTargetSlot(sl.i); if(sl.category) setGridType(sl.category); setShowMultPick(false); }} style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:10,cursor:"pointer",background:isT?(sc+"1f"):"transparent",border:"1px solid "+(isT?sc+"66":"transparent"),marginBottom:2}}>
 <span style={{minWidth:30,textAlign:"center",fontSize:13,fontWeight:900,color:sc}}>{sl.mult?(sl.mult+"×"):("P"+(sl.i+1))}</span>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.03em",color:sc,textTransform:"uppercase"}}>{sl.category?TYPE_LABELS[sl.category]:"Any type"}</div>
 <div style={{fontSize:11,fontWeight:600,color:filled?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nm}</div>
 </div>
 {filled && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 );
 })}
 </div>
 </>)}
 </div>
 );
 })()}
 {!gridCfg && !isSoloMode && (()=>{
 const MC = {1:IOS.blue,2:IOS.yellow,3:IOS.orange,4:IOS.green,5:IOS.pink};
 const cur = gridBuildMode ? gridParlayMult : (gridFlexMult || 1);
 const curCol = MC[cur] || acc;
 return (
 <div style={{position:"relative",flexShrink:0}}>
 <div onClick={()=>setShowMultPick(v=>!v)} style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1,background:"rgba(255,255,255,0.05)",border:"1px solid "+(showMultPick?curCol+"80":"rgba(255,255,255,0.1)"),borderRadius:10,padding:"5px 10px",cursor:"pointer",minWidth:60}}>
 <div style={{fontSize:7.5,fontWeight:800,letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)"}}>MULTIPLIER</div>
 <div style={{display:"flex",alignItems:"center",gap:5}}>
 <span style={{fontSize:15,fontWeight:900,color:curCol,letterSpacing:"-0.3px"}}>{cur+"×"}</span>
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.6" strokeLinecap="round" style={{transform:showMultPick?"rotate(180deg)":"none",transition:"transform .15s"}}><polyline points="6 9 12 15 18 9"/></svg>
 </div>
 </div>
 {showMultPick && (<>
 <div onClick={()=>setShowMultPick(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
 <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:41,width:212,background:"#15151c",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:6,boxShadow:"0 16px 40px rgba(0,0,0,0.6)"}}>
 <div style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.08em",color:"rgba(255,255,255,0.35)",padding:"5px 8px 6px"}}>CHOOSE A MULTIPLIER</div>
 {[1,2,3,4,5].map(M=>{
 const sc = MC[M];
 if(M===gridParlayMult){
 const par = activePicks.find(p=>p.isParlay);
 const legs = (par&&par.parlayLegs)||[];
 const lsd = legs.length>=2 ? calcLS(legs) : null;
 const am = lsd ? (lsd.decimal>=2?("+"+Math.round((lsd.decimal-1)*100)):(""+Math.round(-100/(lsd.decimal-1)))) : "";
 return (
 <div key={M} style={{background:IOS.pink+"14",border:"1px solid "+IOS.pink+"55",borderRadius:11,padding:"8px",marginBottom:3}}>
 <div onClick={()=>enterBuild()} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}}>
 <span style={{minWidth:30,textAlign:"center",fontSize:13,fontWeight:900,color:IOS.pink}}>{M+"×"}</span>
 <div style={{flex:1,minWidth:0}}>
 <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9.5,fontWeight:900,letterSpacing:"0.03em",color:IOS.pink}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={IOS.pink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>PARLAY</div>
 <div style={{fontSize:11,fontWeight:600,color:legs.length?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.3)"}}>{legs.length>=2?(legs.length+" legs · "+am):(legs.length===1?"1 leg · need 2+":"Tap to add legs")}</div>
 </div>
 {legs.length>=2 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 {legs.length>0 && (
 <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingTop:7,marginTop:6,borderTop:"1px dashed "+IOS.pink+"33"}}>
 {legs.map((l,i)=>(<span key={i} style={{fontSize:10,fontWeight:700,padding:"4px 8px",borderRadius:7,background:IOS.pink+"22",color:"#ff8aa6"}}>{l.pick}</span>))}
 </div>
 )}
 <div onClick={()=>enterBuild()} style={{marginTop:7,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,fontWeight:800,color:IOS.pink,background:IOS.pink+"1a",border:"1px dashed "+IOS.pink+"80",borderRadius:9,padding:"7px",cursor:"pointer"}}>+ {legs.length?"Add legs":"Build parlay"}</div>
 </div>
 );
 }
 const slot = activePicks.find(p=>p.mult===M && !p.isParlay);
 const filled = !!(slot&&slot.bet);
 const nm = slot&&slot.bet ? slot.bet.pick : "Open";
 const isT = (gridFlexMult||1)===M && !gridBuildMode;
 return (
 <div key={M} onClick={()=>{ setGridFlexMult(M); setGridBuildMode(false); const mi=activePicks.findIndex(p=>!p.isParlay&&p.mult===M); const ei=activePicks.findIndex(p=>!p.isParlay&&p.bet===null); setGridTargetSlot(mi!==-1?mi:(ei!==-1?ei:0)); setShowMultPick(false); }} style={{display:"flex",alignItems:"center",gap:9,padding:"8px",borderRadius:10,cursor:"pointer",background:isT?(sc+"1f"):"transparent",border:"1px solid "+(isT?sc+"66":"transparent"),marginBottom:3}}>
 <span style={{minWidth:30,textAlign:"center",fontSize:13,fontWeight:900,color:sc}}>{M+"×"}</span>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.03em",color:sc,textTransform:"uppercase"}}>{slot&&slot.category?TYPE_LABELS[slot.category]:"Any type"}</div>
 <div style={{fontSize:11,fontWeight:600,color:filled?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nm}</div>
 </div>
 {filled && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 <div onClick={(e)=>{ e.stopPropagation(); flagParlay(M); }} title="Make this the parlay" style={{flexShrink:0,width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.12)"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
 </div>
 );
 })}
 </div>
 </>)}
 </div>
 );
 })()}
 </div>

 {/* Sport switcher */}
 {sportsList.length>1 && (
 <div className="gbx-scroll" style={{display:"flex",gap:7,padding:"2px 16px 8px",overflowX:"auto"}}>
 {sportsList.map(sp=>{
 const on = sp===gSport; const sc = SPORTS[sp]?.color || IOS.blue;
 return (
 <div key={sp} onClick={()=>setGridSport(sp)} style={{...pillBase,
 background:on?`${sc}26`:"rgba(255,255,255,0.05)", borderColor:on?`${sc}80`:"rgba(255,255,255,0.1)", color:on?sc:"rgba(255,255,255,0.45)"}}>
 {SPORTS[sp]?.label || sp.toUpperCase()}
 </div>
 );
 })}
 </div>
 )}

 {/* Bet type switcher */}
 <div className="gbx-scroll" style={{display:"flex",gap:7,padding:`${sportsList.length>1?0:6}px 16px 9px`,overflowX:"auto"}}>
 {allowedTypes.map(t=>{
 const on = t===gridType; const tc = ACC[t];
 return (
 <div key={t} onClick={()=>{ setGridType(t); setGridPropSub("all"); if(gridCfg){ let _i=activePicks.findIndex(p=>!p.isParlay && p.category===t && p.bet===null); if(_i===-1) _i=activePicks.findIndex(p=>!p.isParlay && p.category===t); if(_i!==-1) setGridTargetSlot(_i); } }} style={{...pillBase,
 background:on?`${tc}26`:"rgba(255,255,255,0.05)", borderColor:on?`${tc}80`:"rgba(255,255,255,0.1)", color:on?tc:"rgba(255,255,255,0.45)"}}>
 {TYPE_LABELS[t]}
 </div>
 );
 })}
 </div>

 <div style={{padding:"0 16px 9px"}}>
 <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"9px 12px"}}>
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
 <input value={gridSearch} onChange={e=>setGridSearch(e.target.value)} placeholder="Search teams, players, bets" style={{flex:1,background:"none",border:"none",outline:"none",color:"#fff",fontSize:13,fontFamily:"Barlow,sans-serif"}}/>
 {gridSearch&&<div onClick={()=>setGridSearch("")} style={{color:"rgba(255,255,255,0.4)",fontSize:16,cursor:"pointer",lineHeight:1}}>×</div>}
 </div>
</div>
 {/* Prop sub-filter */}
 {gridType==="prop" && (()=>{
 const _tslot=(gridTargetSlot!=null)?activePicks[gridTargetSlot]:null;
 const _lockMkt=(_tslot&&_tslot.locked&&_tslot.category==="prop"&&_tslot.market)?_tslot.market:null;
 if(_lockMkt){ const _ml=(propSubs.find(x=>x.id===_lockMkt)||{l:_lockMkt}).l; return (
 <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px 10px"}}>
 <div style={{padding:"5px 11px",borderRadius:16,fontSize:11,fontWeight:800,whiteSpace:"nowrap",border:"1px solid",background:`${acc}1f`,borderColor:`${acc}66`,color:acc}}>{_ml}</div>
 <span style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",fontWeight:600}}>locked by this slot</span>
 </div>
 ); }
 return (
 <div className="gbx-scroll" style={{display:"flex",gap:6,padding:"0 16px 10px",overflowX:"auto"}}>
 {propSubs.map(s=>{ const on = s.id===gridPropSub; return (
 <div key={s.id} onClick={()=>setGridPropSub(s.id)} style={{padding:"5px 11px",borderRadius:16,fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",border:"1px solid",flexShrink:0, background:on?`${acc}1f`:"rgba(255,255,255,0.04)", borderColor:on?`${acc}66`:"rgba(255,255,255,0.08)", color:on?acc:"rgba(255,255,255,0.35)"}}>{s.l}</div>
 );})}
 </div>
 );
 })()}
 {gridBuildMode && (()=>{
 const lsd = parlayLegs.length>=2 ? calcLS(parlayLegs) : null;
 const am = lsd ? (lsd.decimal>=2?("+"+Math.round((lsd.decimal-1)*100)):(""+Math.round(-100/(lsd.decimal-1)))) : "";
 const ready = parlayLegs.length>=2;
 return (
 <div style={{margin:"2px 16px 10px",background:"linear-gradient(135deg,rgba(255,55,95,0.18),rgba(255,55,95,0.06))",border:"1px solid rgba(255,55,95,0.45)",borderRadius:14,padding:"10px 12px"}}>
 <div style={{display:"flex",alignItems:"center",gap:10}}>
 <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,55,95,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
 <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={IOS.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
 </div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:8.5,fontWeight:900,letterSpacing:"0.08em",color:IOS.pink}}>{((activePicks.find(p=>p.isParlay)||{}).mult)||gridParlayMult}× PARLAY · {parlayLegs.length} {parlayLegs.length===1?"LEG":"LEGS"}{ready?(" · "+am):""}</div>
 <div style={{fontSize:10.5,fontWeight:600,color:"rgba(255,255,255,0.5)",marginTop:1}}>{ready?"Tap more to add, or a leg below to remove":"Tap bets below to add legs — need 2+"}</div>
 </div>
 <div onClick={()=>setGridBuildMode(false)} style={{fontFamily:"Barlow",fontSize:12,fontWeight:800,color:ready?"#08080B":"rgba(255,255,255,0.4)",background:ready?IOS.pink:"rgba(255,255,255,0.08)",borderRadius:9,padding:"8px 14px",cursor:"pointer",flexShrink:0}}>Done</div>
 </div>
 {parlayLegs.length>0 && (
 <div className="gbx-scroll" style={{display:"flex",gap:6,marginTop:9,overflowX:"auto"}}>
 {parlayLegs.map((l,i)=>(<div key={i} onClick={()=>toggleLeg(l)} style={{flexShrink:0,fontSize:10.5,fontWeight:700,padding:"5px 9px",borderRadius:8,background:"rgba(255,55,95,0.14)",color:"#ff8aa6",display:"flex",alignItems:"center",gap:6,cursor:"pointer",whiteSpace:"nowrap"}}>{l.pick} <span style={{opacity:0.7,fontWeight:900}}>×</span></div>))}
 </div>
 )}
 </div>
 );
 })()}
 <div style={{height:0.5,background:"rgba(255,255,255,0.07)",margin:"0 16px"}}/>
 </div>

 {/* Slot-full banner */}
 {slotsLeft===0 && (
 <div style={{margin:"10px 16px 0",background:"rgba(255,159,10,0.1)",border:"0.5px solid rgba(255,159,10,0.3)",borderRadius:12,padding:"10px 14px",fontSize:11.5,color:IOS.orange,lineHeight:1.5}}>
 All slots filled — tapping a card replaces Pick {target+1}. Manage picks from your slip.
 </div>
 )}

 {gridType==="longshot" && !isSoloMode && (
 <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:2,margin:"4px 16px 0",gap:2}}>
 {[{m:"straight",l:"Straight (+400)"},{m:"parlay",l:"Parlay · build legs"}].map(o=>{
 const on=(o.m==="parlay")===gridBuildMode;
 return (<div key={o.m} onClick={()=>{ if(o.m==="parlay") enterBuild(); else { setGridBuildMode(false); if(gridCfg) setActivePicks(prev=>prev.map(p=> (p.category==="longshot"&&p.isParlay) ? {...p, isParlay:false, parlayLegs:[]} : p)); } }} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,fontSize:12.5,fontWeight:800,cursor:"pointer",transition:"all .15s",background:on?(o.m==="parlay"?IOS.pink:IOS.green):"transparent",color:on?"#fff":"rgba(255,255,255,0.45)"}}>{o.l}</div>);
 })}
 </div>
 )}

 {/* Card grid */}
 {oddsLoading ? (
 <div style={{padding:"60px 20px",textAlign:"center"}}>
 <div style={{width:26,height:26,border:`2.5px solid ${acc}33`,borderTopColor:acc,borderRadius:"50%",margin:"0 auto 14px",animation:"spin .7s linear infinite"}}/>
 <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Loading live odds…</div>
 </div>
 ) : isGameLine ? renderLineSheet() : list.length===0 ? (
 <div style={{padding:"50px 28px",textAlign:"center"}}>
 <div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.45)",marginBottom:6}}>
 {gridType==="prop"?"No props live yet":`No ${TYPE_LABELS[gridType]} bets right now`}
 </div>
 <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.5}}>
 {gridType==="prop"?"Player props usually post 2–3 days before kickoff. Check back closer to game time."
 :gridType==="longshot"?"No +400-or-better singles on the board right now. Build a parlay from your slip instead."
 :"Check back when games are scheduled for this sport."}
 </div>
 </div>
 ) : (
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"12px 16px 28px"}}>
 {list.map((bet,idx)=>renderCard(bet,idx))}
 </div>
 )}
 </div>
 );
 })()
 }

 {/* ══ MATCHUP ══ */}
 {screen==="matchup"&&(
 <>
 <div className="body">
 {/* Header */}
 <div style={{padding:"10px 20px 14px",background:"radial-gradient(120% 90% at 90% -10%, rgba(10,132,255,0.18), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 80%)"}}>
 <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.42)"}}>Week {activeLeague.current_week||activeLeague.week||1} · {activeLeague.name} · Live</div>
 <div style={{fontSize:30,fontWeight:800,letterSpacing:"-0.7px",color:"#fff",lineHeight:1.05,marginTop:2}}>Matchup</div>
 </div>

 {(()=>{
 const targetSize = activeLeague.target_size||activeLeague.max_members||8;
 const leagueIsFull = activeLeagueId==="solo" || leagueMembers.length >= targetSize;
 const hasOpponent = leagueMembers.filter(m=>!m.isYou).length > 0;

 // League not full yet — no schedule, no matchup
 if(!leagueIsFull) return (
 <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center",gap:12}}>
 <div style={{fontSize:56,marginBottom:4}}></div>
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
 style={{flex:1,background:IOS.blue,border:"none",borderRadius:10,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Share
 </button>
 <button onClick={async()=>{const c=activeLeague.invite_code||activeLeague.inviteCode;try{await navigator.clipboard.writeText(c);alert("Copied! ");}catch(e){alert(c);}}}
 style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Copy
 </button>
 </div>
 </div>
 )}
 </div>
 );

 // No opponent — show empty state
 if(!hasOpponent) return (
 <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 32px",textAlign:"center",gap:16}}>
 <div style={{fontSize:56}}></div>
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

 const multColors = {1:"#3A9EE0", 2:"#3A9EE0", 3:"#3A9EE0", 4:"#3A9EE0", 5:"#3A9EE0"};
 const slotLabels = {ml:"Moneyline", prop:"Prop", ou:"Over/Under", spread:"Spread", longshot:"Longshot"};
 const catColors = {ml:IOS.blue, prop:IOS.yellow, ou:IOS.orange, spread:IOS.green, longshot:IOS.pink};
 const rColor = r=>r==="W"?IOS.green:r==="L"?IOS.red:IOS.label3;
 const rLabel = r=>r==="W"?" Win":r==="L"?" Loss":"● Pending";

 return (
 <>
 {/* ── Score card ── */}
 {(()=>{
 const accent = isTied?IOS.blue:isWinning?IOS.green:IOS.red;
 const tint = isTied?"#0A1628":isWinning?"#0A1606":"#160808";
 const statusTxt = isTied?"You're Tied":isWinning?"You're Winning":"You're Trailing";
 return (
 <div style={{position:"sticky",top:0,zIndex:10,background:"#000",padding:"6px 0 8px"}}>
 <div style={{margin:"0 16px",borderRadius:16,padding:"14px 16px",position:"relative",overflow:"hidden",background:`linear-gradient(155deg,${tint} 0%,#0B0B0E 72%)`,border:`1px solid ${accent}38`,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
 <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${accent},${accent}55)`}}/>
 <div style={{position:"absolute",top:-28,right:-28,width:96,height:96,borderRadius:"50%",background:`radial-gradient(circle,${accent}26,transparent 70%)`,pointerEvents:"none"}}/>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
 <div style={{minWidth:0,flex:1}}>
 <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.04em",textTransform:"uppercase",color:IOS.blue}}>You</div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{myTotal} pts</div>
 </div>
 <div style={{textAlign:"center",flexShrink:0}}>
 <div style={{fontSize:26,fontWeight:800,letterSpacing:"-1px",color:"#fff"}}>{myTotal} <span style={{fontSize:15,color:IOS.label3,fontWeight:500}}>–</span> {oppTotal}</div>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:accent,marginTop:2}}>{statusTxt}</div>
 </div>
 <div style={{textAlign:"right",minWidth:0,flex:1}}>
 <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.04em",textTransform:"uppercase",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{oppName}</div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{oppTotal} pts</div>
 </div>
 </div>
 <div style={{display:"flex",gap:6,marginTop:11,paddingTop:9,borderTop:`0.5px solid ${IOS.sep}`,alignItems:"center",justifyContent:"space-between"}}>
 <div style={{display:"flex",gap:5}}>
 {myPicks.slice(0,6).map((pp,ii)=>(
 <div key={ii} style={{width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,background:pp.result==="W"?"rgba(48,209,88,0.15)":pp.result==="L"?"rgba(255,69,58,0.12)":"rgba(255,255,255,0.06)",color:pp.result==="W"?IOS.green:pp.result==="L"?IOS.red:IOS.label3}}>{pp.result==="W"?"W":pp.result==="L"?"L":"·"}</div>
 ))}
 </div>
 {myPending>0&&<div style={{fontSize:11,color:accent,fontWeight:700}}>{myPending} pending</div>}
 </div>
 </div>
 </div>
 );
 })()}
{/* ── SIDE-BY-SIDE PICKS ── */}
 {(()=>{
 const oppPicksByMult = {};
 oppUserPicks.forEach(p=>{
 if(!oppPicksByMult[p.multiplier]) oppPicksByMult[p.multiplier]=[];
 oppPicksByMult[p.multiplier].push(p);
 });
 const allMults = [...new Set([
 ...Object.keys(myPicksByMult),
 ...Object.keys(oppPicksByMult),
 ])].map(Number).sort((a,b)=>a-b);

 if(allMults.length===0) return (
 <div style={{margin:"0 16px 16px",background:IOS.bg2,borderRadius:14,padding:"20px 16px",textAlign:"center",color:IOS.label3,fontSize:14}}>
 No picks submitted yet this week
 </div>
 );

 const renderCard = (picks, isMe, expandId) => {
 if(!picks || picks.length===0) return (
 <div style={{flex:1,borderRadius:12,minHeight:68,background:"#0A0A0A",border:"0.5px dashed #1E1E1E",display:"flex",alignItems:"center",justifyContent:"center"}}>
 <span style={{fontSize:9,color:"#333"}}>No pick</span>
 </div>
 );
 // Opponent picks stay hidden ("Locked") until their game starts — revealed at kickoff (or once graded).
 if(!isMe){
 const _now=Date.now();
 const _gd=picks.map(p=>p.game_date?new Date(p.game_date).getTime():0).filter(t=>t>0);
 const _earliest=_gd.length?Math.min(..._gd):0;
 const _graded=picks.some(p=>p.result&&p.result!=="pending");
 const _started=_graded || _earliest===0 || _earliest<=_now; // unknown kickoff -> reveal (never hide forever)
 if(!_started) return (
 <div style={{flex:1,position:"relative",overflow:"hidden",borderRadius:12,minHeight:68,background:"linear-gradient(155deg,#16121A,#0B0B0E 75%)",border:`1px solid ${IOS.pink}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
 <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:IOS.pink}}/>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 <span style={{fontSize:9.5,fontWeight:800,color:IOS.pink,letterSpacing:0.4}}>LOCKED</span>
 <span style={{fontSize:8,fontWeight:600,color:"#666"}}>Reveals at kickoff</span>
 </div>
 );
 }
 const isParlay = picks[0]?.slot?.startsWith("longshot_");
 const insured = picks[0]?.power_up_id === "insurance";
 const lostLegs = picks.filter(p=>p.result==="L").length;
 const result = isParlay
 ? picks.some(p=>p.result==="pending") ? "pending"
 : (insured && lostLegs===1) ? "W"
 : picks.some(p=>p.result==="L") ? "L"
 : "W"
 : picks[0]?.result;
 const won = result==="W";
 const lost = result==="L";
 const pts = won ? parseFloat(picks.reduce((s,p)=>s+parseFloat(p.points_earned||0),0).toFixed(1)) : 0;
 const oddsVal = isParlay
 ? (()=>{const legs=picks.map(p=>({impliedOdds:p.implied_odds||0}));return calcLS(legs)?.american||"—";})()
 : picks[0]?.odds;
 const cat = isParlay?"longshot":(picks[0]?.slot||"ml");
 const c = catColors[cat]||IOS.blue;
 const typeLabel = isParlay ? `Longshot · ${picks.length} legs` : slotLabels[picks[0]?.slot]||picks[0]?.slot||"Pick";
 const pickName = isParlay ? `${picks.length}-leg parlay` : (picks[0]?.pick_name||"");
 const gameCtx = !isParlay ? (picks[0]?.game||"") : "";
 const strip = won?IOS.green:lost?IOS.red:c;
 const bg = won?"linear-gradient(155deg,#0A1A0E,#0B0B0E 75%)":lost?"linear-gradient(155deg,#1A0A0A,#0B0B0E 75%)":"linear-gradient(155deg,#141418,#0B0B0E 75%)";
 const border = won?IOS.green:lost?IOS.red:`${c}40`;
 const badgeColor = won?IOS.green:lost?IOS.red:"#555";
 const badgeBg = won?"rgba(48,209,88,0.15)":lost?"rgba(255,59,48,0.12)":"rgba(255,255,255,0.05)";
 const oddsColor = isParlay?IOS.pink:(oddsVal?.startsWith("+")?IOS.green:IOS.blue);
 const ptsBg = won?"rgba(48,209,88,0.1)":lost?"rgba(255,59,48,0.1)":"rgba(255,255,255,0.04)";
 const ptsColor = won?IOS.green:lost?IOS.red:"#555";
 const ptsLabel = won?`+${pts}pts`:lost?"+0pts":"pending";

 return (
 <div style={{flex:1,position:"relative",overflow:"hidden",borderRadius:12,padding:"9px 10px 8px 12px",minHeight:68,background:bg,border:`1px solid ${border}`,display:"flex",flexDirection:"column",justifyContent:"space-between",cursor:isParlay?"pointer":undefined}}
 onClick={isParlay?()=>{const el=document.getElementById(expandId);if(el)el.style.display=el.style.display==="block"?"none":"block";}:undefined}>
 <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:strip}}/>
 <div style={{position:"absolute",top:-20,right:-20,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${strip}1f,transparent 70%)`,pointerEvents:"none"}}/>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0}}><span style={{fontSize:8,fontWeight:800,color:c,letterSpacing:.4,textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{typeLabel}</span>{picks[0]?.power_up_id&&<PUBadge puId={picks[0].power_up_id} size={13} />}</div>
 <span style={{fontSize:8,fontWeight:800,padding:"2px 5px",borderRadius:4,background:badgeBg,color:badgeColor,flexShrink:0,marginLeft:4}}>{won?"W":lost?"L":"–"}</span>
 </div>
 <div style={{fontSize:11,fontWeight:700,color:"#fff",lineHeight:1.25,marginTop:3,textAlign:"left",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pickName}</div>
 {gameCtx&&<div style={{fontSize:9,color:"#666",marginTop:1,textAlign:"left",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gameCtx}</div>}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:5}}>
 <span style={{fontSize:11,fontWeight:800,color:oddsColor}}>{oddsVal}</span>
 <span style={{fontSize:8.5,fontWeight:700,padding:"2px 5px",borderRadius:5,whiteSpace:"nowrap",background:ptsBg,color:ptsColor}}>{ptsLabel}</span>
 </div>
 {isMe && !isParlay && result==="pending" && myPUs.some(p=>p.id==="second") && (
 <button onClick={(e)=>{e.stopPropagation(); setSecondSwap({pick:picks[0], category:(picks[0].slot||"ml").split("_")[0]});}} style={{marginTop:5,width:"100%",padding:"4px",borderRadius:6,border:`1px solid ${IOS.orange}55`,background:`${IOS.orange}1a`,color:IOS.orange,fontSize:8.5,fontWeight:800,letterSpacing:0.3,cursor:"pointer"}}>SECOND CHANCE</button>
 )}
 {isParlay&&<div style={{fontSize:8,color:c,marginTop:3}}>▾ tap to see legs</div>}
 {isParlay&&(
 <div id={expandId} style={{display:"none",marginTop:6,borderTop:"0.5px solid rgba(255,255,255,0.08)",paddingTop:5}}>
 {picks.map((leg,li)=>(
 <div key={li} style={{display:"flex",alignItems:"flex-start",padding:"3px 0",borderBottom:li<picks.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
 <div style={{minWidth:0,textAlign:"left"}}>
 <div style={{fontSize:9.5,fontWeight:600,color:"#bbb",lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{leg.pick_name}</div>
 {leg.game&&<div style={{fontSize:8.5,color:"#555",textAlign:"left",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{leg.game}</div>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 };

 return (
 <>
 <div style={{display:"grid",gridTemplateColumns:"1fr 28px 1fr",gap:4,padding:"4px 16px 4px"}}>
 <div style={{fontSize:9,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",color:IOS.blue}}>Your Picks</div>
 <div/>
 <div style={{fontSize:9,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",color:"#555",textAlign:"right"}}>Their Picks</div>
 </div>
 <div style={{padding:"0 10px 8px"}}>
 {allMults.map(mult=>(
 <div key={mult} style={{display:"grid",gridTemplateColumns:"1fr 28px 1fr",gap:4,marginBottom:5,alignItems:"start"}}>
 {renderCard(myPicksByMult[mult]||null, true, `mexp-my-${mult}`)}
 <div style={{display:"flex",alignItems:"center",justifyContent:"center",paddingTop:22}}>
 <span style={{fontSize:9,fontWeight:800,color:"#333"}}>{mult}×</span>
 </div>
 {renderCard(oppPicksByMult[mult]||null, false, `mexp-opp-${mult}`)}
 </div>
 ))}
 </div>
  </>
 );
 })()}

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
 onClick={()=>{if(!newLeagueCreated){setShowNewLeague(false);setNewLeagueSport(null);setNewLeagueSports([]);setNewLeagueName("");setNewLeagueSize(8);setNewLeagueType(null);setNewLeagueStep(0);setNewLeagueWeeks(18);
 setNewLeagueSlots(DEFAULT_SLOTS); setSlotSheetIdx(null);setNewLeaguePrivacy('private');}}}>
 <div style={{background:IOS.bg2,borderRadius:"20px 20px 0 0",padding:"0 0 40px"}} onClick={e=>e.stopPropagation()}>
 <div style={{width:36,height:5,borderRadius:3,background:"rgba(255,255,255,0.2)",margin:"10px auto 0"}}/>

 {/* Success screen — league created */}
 {newLeagueCreated ? (
 <div style={{padding:"24px 24px 8px",textAlign:"center"}}>
 <div style={{fontSize:48,marginBottom:12}}></div>
 <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff",marginBottom:6}}>{newLeagueCreated.name}</div>
 <div style={{fontSize:14,color:IOS.label3,marginBottom:28}}>Your league is live. Share the invite code.</div>
 <div style={{background:IOS.bg3,borderRadius:16,padding:"20px 24px",marginBottom:20,border:`1px solid ${IOS.blue}30`}}>
 <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:IOS.blue,marginBottom:8}}>Invite Code</div>
 <div style={{fontSize:40,fontWeight:800,letterSpacing:6,color:"#fff"}}>{newLeagueCreated.invite_code}</div>
 <div style={{display:"flex",gap:10,marginTop:16}}>
 <button onClick={()=>shareInvite(newLeagueCreated.invite_code, newLeagueCreated.name)}
 style={{flex:1,background:IOS.blue,border:"none",borderRadius:12,padding:"12px",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Share Invite
 </button>
 <button onClick={async()=>{try{await navigator.clipboard.writeText(newLeagueCreated.invite_code);alert("Copied! ");}catch(e){alert(newLeagueCreated.invite_code);}}}
 style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Copy Code
 </button>
 </div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:6}}>Share with friends to join</div>
 </div>
 <button onClick={()=>{
 setActiveLeagueId(newLeagueCreated.id);
 setShowNewLeague(false);
 setNewLeagueCreated(null);
 setNewLeagueSport(null);
 setNewLeagueSports([]);
 setNewLeagueName("");
 setNewLeagueSize(8);
 setNewLeagueType(null);
 setNewLeagueStep(0);
 setNewLeagueWeeks(18);
 }} style={{width:"100%",background:IOS.blue,border:"none",borderRadius:14,padding:"16px",fontFamily:"Barlow,sans-serif",fontSize:17,fontWeight:600,color:"#fff",cursor:"pointer"}}>
 Go to My League →
 </button>
 </div>
 ) : (
 <div style={{padding:"20px 20px 0"}}>
 {/* Step indicator */}
 <div style={{display:"flex",gap:5,marginBottom:16}}>
   {(isPro?[0,1,2]:[0,1]).map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:newLeagueStep>=i?IOS.blue:"#1E1E1E",transition:"background .2s"}}/>)}
 </div>

 {/* ── STEP 0: League type ── */}
 {newLeagueStep===0&&(
   <>
   <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:4}}>What kind of league?</div>
   <div style={{fontSize:13,color:"#555",marginBottom:16}}>Choose a format for your league</div>
   {[
     {id:"h2h",icon:"ti-users",label:"Head-to-head",desc:"Weekly matchups + seeded playoffs"},
     {id:"points",icon:"ti-chart-bar",label:"Total points",desc:"Everyone competes simultaneously, ranked by cumulative points"},
     {id:"bracket",icon:"ti-tournament",label:"Tournament",desc:"Single-elimination bracket. 4, 8, 16, or 32 players only.",badge:"New"},
   ].map(t=>(
     <div key={t.id} onClick={()=>{
       setNewLeagueType(t.id);
       if(t.id==='h2h'&&![6,8,10,12].includes(newLeagueSize)) setNewLeagueSize(8);
       if(t.id==='bracket'&&![4,8,16,32].includes(newLeagueSize)) setNewLeagueSize(8);
     }} style={{
       display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",
       borderRadius:10,padding:"16px 14px",
       marginBottom:8,cursor:"pointer",transition:"all .15s",
       background:newLeagueType===t.id?"rgba(10,132,255,0.08)":"#111",
       border:`0.5px solid ${newLeagueType===t.id?"rgba(10,132,255,0.35)":"#1E1E1E"}`,
     }}>
       <div style={{width:40,height:40,borderRadius:10,background:newLeagueType===t.id?"rgba(10,132,255,0.15)":"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,transition:"background .15s"}}>
         {t.id==="h2h"&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newLeagueType===t.id?IOS.blue:"#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
         {t.id==="points"&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newLeagueType===t.id?IOS.blue:"#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
         {t.id==="bracket"&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newLeagueType===t.id?IOS.blue:"#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>}
       </div>
       <div>
         <div style={{fontSize:14,fontWeight:700,color:newLeagueType===t.id?"#fff":"#888",marginBottom:3,textAlign:"center"}}>
           {t.label}
           {t.badge&&<span style={{display:"inline-flex",alignItems:"center",background:"rgba(255,159,10,0.12)",border:"0.5px solid rgba(255,159,10,0.3)",borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,color:"#FF9F0A",marginLeft:7}}>{t.badge}</span>}
         </div>
         <div style={{fontSize:11,color:"#555",lineHeight:1.4,textAlign:"center"}}>{t.desc}</div>
       </div>
     </div>
   ))}
   <button
     disabled={!newLeagueType}
     onClick={()=>{if(newLeagueType) setNewLeagueStep(1);}}
     style={{width:"100%",background:newLeagueType?IOS.blue:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,padding:"13px",fontFamily:"Barlow,sans-serif",fontSize:15,fontWeight:700,color:newLeagueType?"#fff":"rgba(255,255,255,0.25)",cursor:newLeagueType?"pointer":"default",marginTop:8,marginBottom:4,transition:"all .2s"}}
   >
     Continue
   </button>
   </>
 )}

 {/* ── STEP 1: Details ── */}
 {newLeagueStep===2&&(
 <>
 <button onClick={()=>setNewLeagueStep(1)} style={{background:"none",border:"none",color:"#555",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Barlow,sans-serif",padding:"0 0 14px",display:"flex",alignItems:"center",gap:4}}>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Back
 </button>
 <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:4}}>Design the slip</div>
 <div style={{fontSize:13,color:"#555",marginBottom:16}}>Set each player's weekly picks — how many, what type, and the points multiplier.</div>

 <div onClick={()=>setPresetSheet(true)} style={{display:"flex",alignItems:"center",gap:11,background:"linear-gradient(135deg,rgba(10,132,255,0.14),rgba(100,210,255,0.08))",border:"0.5px solid rgba(10,132,255,0.32)",borderRadius:13,padding:"12px 14px",marginBottom:14,cursor:"pointer"}}>
 <div style={{width:32,height:32,borderRadius:9,background:"rgba(10,132,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
 <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Start from a layout</div><div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:1}}>Pick a preset, then tweak</div></div>
 <div style={{color:"#555",fontSize:18}}>›</div>
 </div>

 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(160deg,#15151A,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"13px 15px",marginBottom:14}}>
 <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Picks per week<div style={{fontSize:11,color:"#555",fontWeight:600,marginTop:2}}>How many slots in the slip</div></div>
 <div style={{display:"flex",alignItems:"center",gap:12}}>
 <div onClick={()=>setNewLeagueSlots(s=>s.length>1?s.slice(0,-1):s)} style={{width:32,height:32,borderRadius:9,background:newLeagueSlots.length>1?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",cursor:newLeagueSlots.length>1?"pointer":"default",fontSize:19,fontWeight:700,color:newLeagueSlots.length>1?"#fff":"#444"}}>−</div>
 <div style={{fontSize:20,fontWeight:800,color:"#fff",minWidth:20,textAlign:"center"}}>{newLeagueSlots.length}</div>
 <div onClick={()=>setNewLeagueSlots(s=>s.length<10?[...s,{type:null,mult:1}]:s)} style={{width:32,height:32,borderRadius:9,background:newLeagueSlots.length<10?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",cursor:newLeagueSlots.length<10?"pointer":"default",fontSize:19,fontWeight:700,color:newLeagueSlots.length<10?"#fff":"#444"}}>+</div>
 </div>
 </div>

 <div onClick={()=>setSlotSheetIdx(-1)} style={{display:"flex",alignItems:"center",gap:11,background:"linear-gradient(135deg,rgba(255,55,95,0.14),rgba(191,90,242,0.08))",border:"0.5px solid rgba(255,55,95,0.32)",borderRadius:13,padding:"12px 14px",marginBottom:14,cursor:"pointer"}}>
 <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,55,95,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF375F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
 <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Single-type league</div><div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:1}}>Make every slot the same type</div></div>
 <div style={{color:"#555",fontSize:18}}>›</div>
 </div>

 {newLeagueSlots.map((s,i)=>{const tt=SLOT_TYPES.find(x=>x.id===s.type);return (
 <div key={i} onClick={()=>setSlotSheetIdx(i)} style={{display:"flex",alignItems:"center",gap:11,background:"linear-gradient(160deg,#15151A,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.09)",borderRadius:13,padding:"12px 12px",marginBottom:9,cursor:"pointer"}}>
 <div style={{width:26,height:26,borderRadius:8,background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.55)",flexShrink:0}}>{i+1}</div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:15,fontWeight:800,color:tt?"#fff":"#666",display:"flex",alignItems:"center",gap:8}}>{tt&&<span style={{width:9,height:9,borderRadius:3,background:tt.color}}/>}{tt?tt.l:"Tap to choose type"}</div>
 <div style={{fontSize:11,color:"#555",fontWeight:600,marginTop:2}}>{tt?tt.scope:"any bet type"}</div>
 {s.type==="prop" && (()=>{ let _lbl="Any prop"; if(s.market){ for(const sp of newLeagueSports){ const f=(PROP_SUBS_BY_SPORT[sp]||[]).find(x=>x.id===s.market); if(f){ _lbl=f.l; break; } } } return (<div onClick={(e)=>{e.stopPropagation(); setMarketSheet(i);}} style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:6,background:"rgba(255,214,10,0.12)",border:"0.5px solid rgba(255,214,10,0.3)",borderRadius:7,padding:"3px 8px",cursor:"pointer"}}><span style={{fontSize:10.5,fontWeight:700,color:"#FFD60A"}}>{_lbl}</span><span style={{fontSize:9,color:"#FFD60A"}}>▾</span></div>); })()}
 </div>
 <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
 <div onClick={()=>setNewLeagueSlots(arr=>arr.map((p,j)=>j===i?{...p,mult:Math.max(1,p.mult-1)}:p))} style={{width:24,height:24,borderRadius:7,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer"}}>−</div>
 <div style={{fontSize:14,fontWeight:800,color:"#FFD60A",minWidth:24,textAlign:"center"}}>{s.mult}×</div>
 <div onClick={()=>setNewLeagueSlots(arr=>arr.map((p,j)=>j===i?{...p,mult:Math.min(5,p.mult+1)}:p))} style={{width:24,height:24,borderRadius:7,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer"}}>+</div>
 </div>
 <div style={{color:"#555",fontSize:18,flexShrink:0}}>›</div>
 </div>
 );})}

 {(()=>{const ready=newLeagueSlots.every(s=>s.type)&&!creatingLeague;const tot=newLeagueSlots.reduce((a,b)=>a+b.mult,0);const uniq=new Set(newLeagueSlots.map(s=>s.type)).size;return (<>
 <div style={{textAlign:"center",fontSize:11,color:"#555",fontWeight:600,margin:"6px 0 9px"}}>{newLeagueSlots.length} picks · {tot} max multiplier{uniq===1&&newLeagueSlots.length>1?" · single-type league":""}</div>
 <button disabled={!ready} onClick={()=>{if(ready)createLeague(newLeagueName.trim(), newLeagueSports[0]);}} style={{width:"100%",background:ready?IOS.blue:"rgba(255,255,255,0.08)",border:"none",borderRadius:12,padding:"15px",fontFamily:"Barlow,sans-serif",fontSize:16,fontWeight:800,color:ready?"#fff":"rgba(255,255,255,0.25)",cursor:ready?"pointer":"default",marginBottom:4}}>{creatingLeague?"Creating...":"Create League"}</button>
 </>);})()}

 {presetSheet&&(
 <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
 <div onClick={()=>setPresetSheet(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}}/>
 <div style={{position:"relative",background:"#0C0C10",borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid rgba(255,255,255,0.09)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
 <div style={{width:38,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"10px auto 4px"}}/>
 <div style={{padding:"6px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>Slip layouts</div>
 <div onClick={()=>setPresetSheet(false)} style={{fontSize:13,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Done</div>
 </div>
 <div style={{overflowY:"auto",padding:"0 16px 26px"}}>
 {LAYOUT_PRESETS.filter(p=>!p.sports||p.sports.some(sp=>newLeagueSports.includes(sp))).map(p=>{const tot=p.slots.reduce((a,b)=>a+b.mult,0);return (
 <div key={p.id} onClick={()=>{ setNewLeagueSlots(p.slots.map(x=>({...x}))); setPresetSheet(false); }} style={{background:"linear-gradient(160deg,#15151A,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.09)",borderRadius:13,padding:"13px 14px",marginBottom:9,cursor:"pointer"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{p.name}</div>
 <div style={{fontSize:11,fontWeight:700,color:"#555"}}>{p.slots.length} picks · {tot}× max</div>
 </div>
 <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:3,lineHeight:1.4}}>{p.desc}</div>
 <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:9}}>
 {p.slots.map((sl,i)=>{const tt=SLOT_TYPES.find(x=>x.id===sl.type);return (
 <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"3px 7px"}}>
 <span style={{width:7,height:7,borderRadius:2,background:tt?tt.color:"#555"}}/>
 <span style={{fontSize:10.5,fontWeight:700,color:"#ccc"}}>{tt?tt.l:sl.type}</span>
 <span style={{fontSize:10.5,fontWeight:800,color:"#FFD60A"}}>{sl.mult}×</span>
 </div>
 );})}
 </div>
 </div>
 );})}
 </div>
 </div>
 </div>
 )}

 {marketSheet!==null&&(()=>{ const _opts=[{id:null,l:"Any prop"}, ...[...new Map(newLeagueSports.flatMap(sp=>(PROP_SUBS_BY_SPORT[sp]||[]).filter(x=>x.id!=="all").map(x=>[x.id,x]))).values()]]; return (
 <div style={{position:"fixed",inset:0,zIndex:210,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
 <div onClick={()=>setMarketSheet(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}}/>
 <div style={{position:"relative",background:"#0C0C10",borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid rgba(255,255,255,0.09)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
 <div style={{width:38,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"10px auto 4px"}}/>
 <div style={{padding:"6px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>Prop market</div>
 <div onClick={()=>setMarketSheet(null)} style={{fontSize:13,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Done</div>
 </div>
 <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",padding:"0 18px 12px",lineHeight:1.4}}>Lock this slot to a specific prop. Players only see that market when filling it.</div>
 <div style={{overflowY:"auto",padding:"0 16px 26px"}}>
 {_opts.map(o=>{ const sel=(newLeagueSlots[marketSheet]&&(newLeagueSlots[marketSheet].market||null))===o.id; return (
 <div key={o.id||"any"} onClick={()=>{ setNewLeagueSlots(arr=>arr.map((p,j)=>j===marketSheet?{...p,market:o.id}:p)); setMarketSheet(null); }} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:sel?"rgba(10,132,255,0.1)":"linear-gradient(160deg,#15151A,#0B0B0E 80%)",border:"0.5px solid "+(sel?"rgba(10,132,255,0.6)":"rgba(255,255,255,0.09)"),borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer"}}>
 <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>{o.l}</span>
 {sel&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 );})}
 </div>
 </div>
 </div>
 );})()}

 {slotSheetIdx!==null&&(
 <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
 <div onClick={()=>setSlotSheetIdx(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}}/>
 <div style={{position:"relative",background:"#0C0C10",borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid rgba(255,255,255,0.09)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
 <div style={{width:38,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"10px auto 4px"}}/>
 <div style={{padding:"6px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{slotSheetIdx===-1?"Single-type league":"Slot "+(slotSheetIdx+1)+" · pick type"}</div>
 <div onClick={()=>setSlotSheetIdx(null)} style={{fontSize:13,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Done</div>
 </div>
 <div style={{overflowY:"auto",padding:"0 16px 26px"}}>
 {slotSheetIdx===-1&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12,lineHeight:1.4}}>Pick one type and every slot becomes that type.</div>}
 {SLOT_TYPES.filter(tp=>!tp.sports||tp.sports.some(sp=>newLeagueSports.includes(sp))).map(tp=>{const sel=slotSheetIdx>=0&&newLeagueSlots[slotSheetIdx]&&newLeagueSlots[slotSheetIdx].type===tp.id;return (
 <div key={tp.id} onClick={()=>{ if(slotSheetIdx===-1){setNewLeagueSlots(arr=>arr.map(p=>({...p,type:tp.id,market:tp.id==="prop"?p.market:null})));} else {setNewLeagueSlots(arr=>arr.map((p,j)=>j===slotSheetIdx?{...p,type:tp.id,market:tp.id==="prop"?p.market:null}:p));} setSlotSheetIdx(null); }} style={{display:"flex",alignItems:"center",gap:11,background:sel?"rgba(10,132,255,0.1)":"linear-gradient(160deg,#15151A,#0B0B0E 80%)",border:"0.5px solid "+(sel?"rgba(10,132,255,0.6)":"rgba(255,255,255,0.09)"),borderRadius:12,padding:"13px 14px",marginBottom:8,cursor:"pointer"}}>
 <span style={{width:10,height:10,borderRadius:3,background:tp.color,flexShrink:0}}/>
 <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{tp.l}</div><div style={{fontSize:11,color:"#555",marginTop:1}}>{tp.scope}</div></div>
 {sel&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
 </div>
 );})}
 </div>
 </div>
 </div>
 )}
 </>
)}
 {newLeagueStep===1&&(
   <>
   <button onClick={()=>setNewLeagueStep(0)} style={{background:"none",border:"none",color:"#555",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Barlow,sans-serif",padding:"0 0 14px",display:"flex",alignItems:"center",gap:4}}>
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Back
   </button>

   {/* Sports */}
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
     <div style={{fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",color:"#555"}}>Sport{isPro?" (select all that apply)":""}</div>
     {isPro && <div style={{fontSize:9,fontWeight:700,color:IOS.blue,background:"rgba(10,132,255,0.1)",border:"0.5px solid rgba(10,132,255,0.25)",borderRadius:4,padding:"2px 6px"}}>MULTI-SPORT</div>}
   </div>
   <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:isPro?4:16}}>
   {[
     {id:"nfl",label:"NFL"},{id:"nba",label:"NBA"},{id:"mlb",label:"MLB"},{id:"nhl",label:"NHL"},
   ].map(sp=>{
     const isSelected = newLeagueSports.includes(sp.id);
     return (
     <div key={sp.id} onClick={()=>toggleNewLeagueSport(sp.id)}
     style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
       background:isSelected?"rgba(10,132,255,0.12)":"#111",
       border:`0.5px solid ${isSelected?"rgba(10,132,255,0.4)":"#222"}`,
       color:isSelected?IOS.blue:"#666",
       display:"flex",alignItems:"center",gap:5,
     }}>
       {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
       {sp.label}
     </div>
   );})}
   </div>
   {!isPro && (
     <div onClick={()=>setShowPaywall("sport")} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(191,90,242,0.06)",border:"0.5px solid rgba(191,90,242,0.2)",borderRadius:8,marginBottom:16,cursor:"pointer"}}>
       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
       <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Mix NFL, NBA, MLB & NHL picks in one league</div>
       <div style={{marginLeft:"auto",fontSize:9,fontWeight:700,color:"#BF5AF2",background:"rgba(191,90,242,0.12)",border:"0.5px solid rgba(191,90,242,0.3)",borderRadius:4,padding:"2px 6px",flexShrink:0}}>Pro</div>
     </div>
   )}
   {isPro && newLeagueSports.length > 1 && (
     <div style={{fontSize:10,color:IOS.label3,marginBottom:16,padding:"0 2px"}}>Each pick slot can pull from any of your selected sports every week.</div>
   )}

   {/* League name */}
   <div style={{fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",color:"#555",marginBottom:8}}>League name</div>
   <input
     value={newLeagueName}
     onChange={e=>setNewLeagueName(e.target.value)}
     placeholder="e.g. The Boys League"
     style={{width:"100%",background:"#111",border:"0.5px solid #222",borderRadius:8,padding:"11px 13px",color:"#fff",fontSize:14,fontFamily:"Barlow,sans-serif",outline:"none",marginBottom:16,boxSizing:"border-box"}}
   />

   {/* Size */}
   <div style={{fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",color:"#555",marginBottom:8}}>
     {newLeagueType==="bracket"?"Tournament size":"League size"}
   </div>
   {newLeagueType==="points"?(
     <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
       <div onClick={()=>setNewLeagueSize(s=>Math.max(2,s-1))} style={{width:28,height:28,borderRadius:6,background:"#1A1A1A",border:"0.5px solid #2A2A2A",color:"#ccc",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>−</div>
       <div style={{fontSize:16,fontWeight:700,color:"#fff",minWidth:28,textAlign:"center"}}>{newLeagueSize}</div>
       <div onClick={()=>setNewLeagueSize(s=>Math.min(32,s+1))} style={{width:28,height:28,borderRadius:6,background:"#1A1A1A",border:"0.5px solid #2A2A2A",color:"#ccc",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>+</div>
       <div style={{fontSize:12,color:"#555",marginLeft:4}}>players (2–32)</div>
     </div>
   ):(
     <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
     {(newLeagueType==="bracket"?[4,8,16,32]:[6,8,10,12]).map(sz=>(
       <div key={sz} onClick={()=>setNewLeagueSize(sz)} style={{
         flex:1,minWidth:52,borderRadius:8,padding:"10px 4px",textAlign:"center",cursor:"pointer",transition:"all .15s",
         background:newLeagueSize===sz?"rgba(10,132,255,0.12)":"#111",
         border:`0.5px solid ${newLeagueSize===sz?"rgba(10,132,255,0.4)":"#222"}`,
       }}>
         <div style={{fontSize:18,fontWeight:800,color:newLeagueSize===sz?IOS.blue:"#666"}}>{sz}</div>
         <div style={{fontSize:10,color:"#555",marginTop:2}}>players</div>
       </div>
     ))}
     </div>
   )}
   {newLeagueType==="bracket"&&(
     <div style={{background:"rgba(255,159,10,0.07)",border:"0.5px solid rgba(255,159,10,0.2)",borderRadius:8,padding:"9px 12px",marginBottom:12,marginTop:8}}>
       <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}><span style={{color:"rgba(255,159,10,0.7)"}}>Duration</span><span style={{fontWeight:700,color:"#FF9F0A"}}>{({4:2,8:3,16:4,32:5})[newLeagueSize]||3} weeks</span></div>
       <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}><span style={{color:"rgba(255,159,10,0.7)"}}>Format</span><span style={{fontWeight:700,color:"#FF9F0A"}}>Single elimination</span></div>
       <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}><span style={{color:"rgba(255,159,10,0.7)"}}>Byes</span><span style={{fontWeight:700,color:"#FF9F0A"}}>None</span></div>
     </div>
   )}

   {/* Season weeks — h2h and points only */}
   {newLeagueType!=="bracket"&&(
     <>
     <div style={{fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",color:"#555",marginBottom:8,marginTop:12}}>Season length</div>
     <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
       <div onClick={()=>setNewLeagueWeeks(w=>Math.max(1,w-1))} style={{width:28,height:28,borderRadius:6,background:"#1A1A1A",border:"0.5px solid #2A2A2A",color:"#ccc",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>−</div>
       <div style={{fontSize:16,fontWeight:700,color:"#fff",minWidth:28,textAlign:"center"}}>{newLeagueWeeks}</div>
       <div onClick={()=>setNewLeagueWeeks(w=>Math.min(30,w+1))} style={{width:28,height:28,borderRadius:6,background:"#1A1A1A",border:"0.5px solid #2A2A2A",color:"#ccc",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>+</div>
       <div style={{fontSize:12,color:"#555",marginLeft:4}}>weeks</div>
     </div>
     <div style={{fontSize:11,color:"#444",marginBottom:16}}>{newLeagueType==="points"?"Ranked by total points at the end":"NFL regular season is 18 weeks"}</div>
     </>
   )}

   {/* Visibility */}
   <div style={{fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",color:"#555",marginBottom:8}}>Visibility</div>
   <div style={{display:"flex",gap:6,marginBottom:16}}>
   {[{id:"private",l:"Private",d:"Invite code only"},{id:"public",l:"Public",d:"Anyone can find & join"}].map(v=>(
     <div key={v.id} onClick={()=>setNewLeaguePrivacy(v.id)}
     style={{flex:1,borderRadius:8,padding:"11px 10px",border:`0.5px solid ${newLeaguePrivacy===v.id?"rgba(10,132,255,0.4)":"#222"}`,background:newLeaguePrivacy===v.id?"rgba(10,132,255,0.1)":"#111",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
       {v.id==="private"
         ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={newLeaguePrivacy===v.id?IOS.blue:"#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",marginBottom:4}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
         : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={newLeaguePrivacy===v.id?IOS.blue:"#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",marginBottom:4}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
       }
       <div style={{fontSize:12,fontWeight:700,color:newLeaguePrivacy===v.id?IOS.blue:"#555"}}>{v.l}</div>
       <div style={{fontSize:10,color:"#444",marginTop:2}}>{v.d}</div>
     </div>
   ))}
   </div>

   {/* Commish Pro toggle */}
   <div style={{background:"#111",borderRadius:10,padding:"11px 13px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",border:"0.5px solid #1E1E1E"}}>
     <div>
       <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Commish Pro</div>
       <div style={{fontSize:11,color:"#555",marginTop:2}}>Custom picks, multi-sport, power-ups</div>
     </div>
     <div onClick={()=>isPro?setProStatus(false):setShowPaywall("settings")} style={{width:44,height:26,borderRadius:13,background:isPro?IOS.blue:"#2A2A2A",border:`1px solid ${isPro?IOS.blue:"#3A3A3A"}`,position:"relative",cursor:"pointer",transition:"background .2s"}}>
       <div style={{position:"absolute",top:2,left:isPro?18:2,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
     </div>
   </div>

   {/* Create button */}
   <button
     disabled={!newLeagueSports.length||!newLeagueName.trim()||creatingLeague}
     onClick={()=>{ if(!newLeagueSports.length||!newLeagueName.trim()) return; if(isPro){ setNewLeagueStep(2); } else { createLeague(newLeagueName.trim(), newLeagueSports[0]); } }}
     style={{width:"100%",background:newLeagueSports.length&&newLeagueName.trim()?IOS.blue:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,padding:"13px",fontFamily:"Barlow,sans-serif",fontSize:15,fontWeight:700,color:newLeagueSports.length&&newLeagueName.trim()?"#fff":"rgba(255,255,255,0.25)",cursor:newLeagueSports.length&&newLeagueName.trim()?"pointer":"default",transition:"all .2s",marginBottom:4}}
   >
     {isPro?"Continue →":(creatingLeague?"Creating...":"Create League")}
   </button>
   </>
 )}
 </div>
 )}
 </div>
 </div>
 )}

 <div style={{padding:"10px 20px 16px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",background:"radial-gradient(120% 90% at 90% -10%, rgba(10,132,255,0.18), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 80%)"}}>
 <div>
 <div style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#fff",lineHeight:1.05}}>My Leagues</div>
 <div style={{fontSize:14,fontWeight:500,color:IOS.label3,marginTop:3}}>{realLeagues.length} active league{realLeagues.length!==1?"s":""}</div>
 </div>
 <div onClick={()=>{setShowNewLeague(true);setNewLeagueCreated(null);setNewLeagueSport(null);setNewLeagueName("");}}
 style={{background:`linear-gradient(135deg,${IOS.blue},${IOS.indigo})`,borderRadius:10,padding:"9px 15px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",boxShadow:`0 4px 14px ${IOS.blue}44`}}>+ New</div>
 </div>

 {/* League cards */}
 {leaguesLoading ? (
 <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center",gap:10}}>
 <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${IOS.blue}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
 <div style={{fontSize:14,color:IOS.label3}}>Loading your leagues...</div>
 </div>
 ) : realLeagues.length === 0 ? (
 <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 32px",textAlign:"center",gap:12}}>
 <div style={{fontSize:56,marginBottom:4}}></div>
 <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff"}}>No Leagues Yet</div>
 <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6,maxWidth:260}}>Create your first league and invite your friends to get started.</div>
 <button onClick={()=>{setShowNewLeague(true);setNewLeagueCreated(null);setNewLeagueSport(null);setNewLeagueName("");setNewLeagueSize(8);}}
 style={{marginTop:8,background:IOS.blue,border:"none",borderRadius:14,padding:"14px 32px",fontFamily:"Barlow,sans-serif",fontSize:16,fontWeight:700,color:"#fff",cursor:"pointer"}}>
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
 const memberIds = allMembers.map(m=>m.user_id);
   if((league.league_type||'h2h')==='bracket') {
     await generateBracket(league.id, memberIds);
   } else if((league.league_type||'h2h')==='h2h') {
     await generateSchedule(league.id, memberIds, league.season_weeks||18);
   }
   // points-only: no schedule generated
 alert(`Joined ${league.name}! League is full — schedule generated!`);
 } else {
 alert(`Joined ${league.name}! Welcome. ${targetSize-allMembers.length} more player${targetSize-allMembers.length!==1?"s":""} needed.`);
 }
 fetchLeagues(user.id);
 }} style={{fontSize:14,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Join with Invite Code</div>
 </div>
 ) : (()=>{
 /* ── VERSION B: Dropdown + sub-tabs leagues tab ── */
 const lg = realLeagues.find(l=>l.id===activeLeagueId) || realLeagues[0];
 const sp = lg ? SPORTS[lg.sport] : {label:"NFL",color:IOS.blue};
 const myStanding = realStandings.find(s=>s.isYou);
 const myRank = myStanding?.rank||"—";
 const myRecord = myStanding?.record||"—";
 const myPts = myStanding?.points||0;
 const myWinPct = myStanding ? Math.round((myStanding.wins/(myStanding.wins+myStanding.losses||1))*100)||0 : 0;
 const pendingPicks = lg ? (gradingData[lg.id]||[]).reduce((acc,m)=>acc+m.picks.filter(p=>p.result==="pending").length,0) : 0;
 const myPicksThisWeek = weekPicks.filter(p=>p.user_id===user?.id);
 return (
 <div>
 {/* Dropdown league switcher */}
 <div style={{padding:"12px 16px 0"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
     <div style={{fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:.5,textTransform:"uppercase"}}>Switch League</div>
     <div style={{display:"flex",gap:6}}>
       <div onClick={()=>{setShowBrowse(true);fetchPublicLeagues();}} style={{width:28,height:28,borderRadius:8,background:IOS.bg2,border:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
       </div>
       <div onClick={()=>setShowNewLeague(true)} style={{width:28,height:28,borderRadius:8,background:IOS.bg2,border:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
       </div>
     </div>
   </div>
   {/* Dropdown */}
   {lg ? (
   <>
   <div onClick={()=>setLeagueSubTab(leagueSubTab==="dropdown"?"overview":"dropdown")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(160deg,#16161A,#0C0C0F)",border:`0.5px solid ${leagueSubTab==="dropdown"?"rgba(10,132,255,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",marginBottom:0,boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
     <div>
       <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{lg.name}</div>
       <div style={{fontSize:10,color:IOS.label3,marginTop:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
         <span>{(lg.sports||[lg.sport]).map(s=>SPORTS[s]?.label||s.toUpperCase()).join(" · ")} · {(lg.league_type||"h2h")==="h2h"?"H2H":(lg.league_type||"h2h")==="bracket"?"Tournament":"Points"} · #{myRank} of {lg.target_size||lg.max_members||"?"}</span>
         {lg.privacy==="public"
           ? <span style={{fontSize:8,fontWeight:700,color:"#30D158",background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.25)",borderRadius:4,padding:"1px 5px",letterSpacing:.3}}>PUBLIC</span>
           : <span style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"1px 5px",letterSpacing:.3}}>PRIVATE</span>
         }
       </div>
     </div>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
       {lg.isCommissioner&&<div style={{background:"rgba(255,214,10,0.15)",border:"0.5px solid rgba(255,214,10,0.3)",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700,color:IOS.yellow}}>COMMISH</div>}
       {leagueSubTab==="dropdown"
         ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
         : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
       }
     </div>
   </div>
   {/* Dropdown list */}
   {leagueSubTab==="dropdown"&&(
   <div style={{background:IOS.bg2,border:`0.5px solid rgba(10,132,255,0.3)`,borderRadius:10,overflow:"hidden",marginTop:4}}>
     {realLeagues.map((l,i)=>{
       const lsp=SPORTS[l.sport];
       const isSelected=l.id===activeLeagueId;
       return (
       <div key={l.id} onClick={()=>{setActiveLeagueId(l.id);setLeagueSubTab("overview");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",borderBottom:i<realLeagues.length-1?`0.5px solid ${IOS.sep}`:"none",background:isSelected?"rgba(10,132,255,0.08)":"transparent",cursor:"pointer"}}>
         <div>
           <div style={{display:"flex",alignItems:"center",gap:6}}>
             <div style={{fontSize:13,fontWeight:700,color:isSelected?IOS.blue:"#fff"}}>{l.name}</div>{unreadByLeague[l.id]>0&&<span style={{minWidth:16,height:16,borderRadius:8,background:IOS.pink,color:"#fff",fontSize:10,fontWeight:800,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{unreadByLeague[l.id]>9?"9+":unreadByLeague[l.id]}</span>}
             {l.privacy==="public"&&<div style={{fontSize:8,fontWeight:700,color:"#30D158",background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.25)",borderRadius:4,padding:"1px 5px",letterSpacing:.3}}>PUBLIC</div>}
             {l.privacy!=="public"&&<div style={{fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"1px 5px",letterSpacing:.3}}>PRIVATE</div>}
           </div>
           <div style={{fontSize:10,color:IOS.label3,marginTop:1}}>{lsp.label} · Wk {l.current_week||1}</div>
         </div>
         {isSelected&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
       </div>
       );
     })}
   </div>
   )}
   </>
   ) : (
   <div style={{background:IOS.bg2,border:`0.5px solid ${IOS.sep}`,borderRadius:10,padding:"10px 14px",marginBottom:0,color:IOS.label3,fontSize:13}}>No leagues yet</div>
   )}
 </div>

 {/* Sub-tabs - hide when dropdown is open */}
 {lg && leagueSubTab!=="dropdown" && (
 <div style={{display:"flex",borderBottom:`0.5px solid ${IOS.sep}`,margin:"10px 0 0"}}>
   {["overview","standings",(lg.league_type||"h2h")==="bracket"?"bracket":"schedule"].map(t=>(
     <div key={t} onClick={()=>setLeagueSubTab(t)} style={{flex:1,textAlign:"center",padding:"9px 4px",fontSize:11,fontWeight:700,textTransform:"capitalize",cursor:"pointer",
       color:leagueSubTab===t?IOS.blue:"rgba(255,255,255,0.4)",
       borderBottom:leagueSubTab===t?`2px solid ${IOS.blue}`:"2px solid transparent",transition:"all .15s"}}>
       {t}
     </div>
   ))}
 </div>
 )}

 {/* ── OVERVIEW TAB ── */}
 {lg && leagueSubTab==="overview" && (
 <div style={{padding:"12px 16px 20px"}}>
   {/* My rank card */}
   <div style={{background:`linear-gradient(135deg,rgba(10,132,255,0.1),rgba(94,92,230,0.07))`,border:`0.5px solid rgba(10,132,255,0.25)`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
     <div style={{fontSize:10,fontWeight:700,color:IOS.blue,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Your Rank — #{myRank} of {lg.target_size||lg.max_members||"?"}</div>
     <div style={{display:"flex",gap:8,marginBottom:0}}>
       {[{l:"Record",v:myRecord,c:IOS.blue},{l:"Win %",v:myWinPct+"%",c:IOS.green},{l:"Points",v:myPts.toFixed?myPts.toFixed(1):myPts,c:"#fff"}].map((s,i)=>(
         <div key={i} style={{flex:1,background:"rgba(0,0,0,0.3)",borderRadius:7,padding:"7px 6px",textAlign:"center"}}>
           <div style={{fontSize:14,fontWeight:800,color:s.c}}>{s.v}</div>
           <div style={{fontSize:8,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,marginTop:1}}>{s.l}</div>
         </div>
       ))}
     </div>
   </div>

   {/* Current matchup */}
   {(()=>{
     const currentWeekNum = lg.current_week||1;
     const currentMatchup = liveSchedule.find(w=>w.week===currentWeekNum);
     const oppName = currentMatchup?.opp;
     const myWkPts = myPicksThisWeek.reduce((s,p)=>s+parseFloat(p.points_earned||0),0);
     const oppWkPts = currentMatchup?.oppPts||0;
     const pendingCount = myPicksThisWeek.filter(p=>p.result==="pending").length;
     return (
     <div style={{position:"relative",overflow:"hidden",background:myWkPts>oppWkPts?"linear-gradient(155deg,#0A1606,#0B0B0E 72%)":myWkPts<oppWkPts?"linear-gradient(155deg,#160808,#0B0B0E 72%)":"linear-gradient(155deg,#0A1628,#0B0B0E 72%)",border:`0.5px solid ${myWkPts>oppWkPts?"rgba(48,209,88,0.35)":myWkPts<oppWkPts?"rgba(255,69,58,0.3)":"rgba(10,132,255,0.3)"}`,borderRadius:12,padding:"12px 14px",marginBottom:10,boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
       <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Wk {currentWeekNum} Matchup</div>
       {!oppName ? (
         <div style={{textAlign:"center",padding:"8px 0",fontSize:12,color:IOS.label3}}>Fill up league to get a schedule!</div>
       ) : (
       <>
       <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
         <div><div style={{fontSize:13,fontWeight:800,color:IOS.blue}}>You</div><div style={{fontSize:22,fontWeight:800,color:IOS.blue,letterSpacing:-1}}>{myWkPts.toFixed(1)}</div></div>
         <div style={{fontSize:11,color:"#333",fontWeight:700}}>vs</div>
         <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:800,color:"#ccc"}}>{oppName}</div><div style={{fontSize:22,fontWeight:800,color:"#ccc",letterSpacing:-1}}>{oppWkPts.toFixed(1)}</div></div>
       </div>
       <div style={{fontSize:9,fontWeight:700,color:myWkPts>oppWkPts?IOS.green:"#555",textAlign:"center"}}>{myWkPts>oppWkPts?"WINNING — ":"TRAILING — "}{pendingCount} picks pending</div>
       </>
       )}
     </div>
     );
   })()}

   {/* This week picks preview */}
   <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>This week</div>
   {myPicksThisWeek.length===0 ? (
     <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:12,padding:"12px 14px",marginBottom:10,border:"0.5px solid rgba(255,255,255,0.08)"}}>
       <div style={{fontSize:12,color:IOS.label3,textAlign:"center"}}>No picks locked yet</div>
       <button onClick={()=>setScreen("picks")} style={{width:"100%",background:`linear-gradient(135deg,${IOS.blue},${IOS.indigo})`,border:"none",borderRadius:9,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer",marginTop:10,boxShadow:`0 4px 14px ${IOS.blue}33`}}>Build My Slip</button>
     </div>
   ) : (
   <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,overflow:"hidden",marginBottom:10}}>
     {myPicksThisWeek.slice(0,5).map((p,i)=>{
       const won=p.result==="W", lost=p.result==="L";
       return (
       <div key={p.id||i} style={{display:"flex",alignItems:"center",padding:"7px 12px",borderBottom:i<Math.min(myPicksThisWeek.length,5)-1?`0.5px solid ${IOS.sep}`:"none",background:won?"rgba(48,209,88,0.04)":lost?"rgba(255,59,48,0.04)":"transparent"}}>
         {(()=>{const cc={ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green,longshot:IOS.pink};const k=(p.slot||"ml").split("_")[0];return <div style={{fontSize:8,fontWeight:800,color:cc[k]||IOS.blue,textTransform:"uppercase",width:30,flexShrink:0}}>{p.slot?.replace("_0","")?.replace("longshot","LS")||"ML"}</div>;})()}
         <div style={{flex:1,fontSize:11,color:"#ccc",padding:"0 8px"}}>{p.pick_name}</div>
         <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,whiteSpace:"nowrap",fontSize:10,fontWeight:700,color:won?IOS.green:lost?IOS.red:"#555"}}>{won?(<><span>+{parseFloat(p.points_earned||0).toFixed(1)} pts</span><span style={{fontSize:8,fontWeight:800,color:IOS.green,background:"rgba(48,209,88,0.16)",borderRadius:4,padding:"1px 4px",letterSpacing:"0.03em"}}>W</span></>):lost?(<span>0 pts</span>):(<span>pending</span>)}</div>
       </div>
       );
     })}
   </div>
   )}

   {/* Standings mini */}
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
     <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5}}>Standings</div>
     {realStandings.length>0 && <button onClick={()=>openLeagueRecap()} disabled={leagueRecapLoading} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.3)",color:IOS.blue,fontSize:10,fontWeight:700,padding:"4px 9px",borderRadius:7,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>{leagueRecapLoading?"…":"Week recap"}</button>}
   </div>
   <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,overflow:"hidden",marginBottom:10}}>
     <div style={{display:"flex",padding:"5px 12px",borderBottom:`0.5px solid ${IOS.sep}`}}>
       <div style={{width:22}}/>
       <div style={{flex:1,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4}}/>
       <div style={{width:34,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,textAlign:"right"}}>W/L</div>
       <div style={{width:52,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,textAlign:"right"}}>PTS</div>
     </div>
     {realStandings.slice(0,4).map((s,i)=>(
       <div key={s.userId||i} style={{display:"flex",alignItems:"center",padding:"8px 12px",borderBottom:i<Math.min(realStandings.length,4)-1?`0.5px solid rgba(255,255,255,0.04)`:"none",background:s.isYou?"rgba(10,132,255,0.06)":"transparent"}}>
         <div style={{width:22,fontSize:12,fontWeight:700,color:i===0?IOS.blue:IOS.label3}}>{i+1}</div>
         <div style={{flex:1}}>
           <div style={{fontSize:12,fontWeight:700,color:s.isYou?IOS.blue:"#ccc"}}>{s.isYou?"You":(s.name||s.username||"Unknown")}</div>
           <div style={{fontSize:9,color:IOS.label3,marginTop:1}}>{s.wpct||"0%"} win rate</div>
         </div>
         <div style={{width:34,fontSize:11,color:IOS.label3,textAlign:"right"}}>{s.record}</div>
         <div style={{width:52,fontSize:12,fontWeight:800,color:parseFloat(s.points)>0?IOS.green:"#555",textAlign:"right"}}>{parseFloat(s.points||0).toFixed(1)}</div>
       </div>
     ))}
     {realStandings.length>4&&(
       <div onClick={()=>setLeagueSubTab("standings")} style={{padding:"8px 12px",textAlign:"center",borderTop:`0.5px solid ${IOS.sep}`}}>
         <div style={{fontSize:10,color:IOS.blue,fontWeight:600}}>See full standings</div>
       </div>
     )}
   </div>

   {/* Quick actions */}
   <div style={{display:"flex",gap:8}}>
     <button onClick={()=>setScreen("picks")} style={{flex:1,background:`linear-gradient(135deg,${IOS.blue},${IOS.indigo})`,border:"none",borderRadius:10,padding:"11px",fontFamily:"Barlow,sans-serif",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer",boxShadow:`0 4px 14px ${IOS.blue}33`}}>My Picks</button>
     <button onClick={e=>{e.stopPropagation();setActiveLeagueId(lg.id);setScreen(lg.isCommissioner?"commissioner":"league");}} style={{flex:1,background:IOS.bg2,border:`0.5px solid ${IOS.sep}`,borderRadius:8,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:12,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>{lg.isCommissioner?"Commish Panel":"League Detail"}</button>
   </div>
 </div>
 )}

 {/* ── STANDINGS TAB ── */}
 {lg && leagueSubTab==="standings" && (
 <div style={{padding:"12px 16px 20px"}}>
   <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:10}}>Season Standings</div>
   <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,overflow:"hidden"}}>
     <div style={{display:"flex",padding:"6px 12px",borderBottom:`0.5px solid ${IOS.sep}`}}>
       <div style={{width:24}}/>
       <div style={{flex:1,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4}}>Player</div>
       <div style={{width:36,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,textAlign:"right"}}>W/L</div>
       <div style={{width:56,fontSize:8,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,textAlign:"right"}}>Total Pts</div>
     </div>
     {realStandings.map((s,i)=>(
       <div key={s.userId||i} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderBottom:i<realStandings.length-1?`0.5px solid rgba(255,255,255,0.04)`:"none",background:s.isYou?"rgba(10,132,255,0.06)":"transparent"}}>
         <div style={{width:24,fontSize:13,fontWeight:700,color:i===0?IOS.blue:IOS.label3}}>{i+1}</div>
         <div style={{flex:1}}>
           <div style={{fontSize:12,fontWeight:700,color:s.isYou?IOS.blue:"#ccc"}}>{s.isYou?"You":(s.name||s.username||"Unknown")}</div>
           <div style={{fontSize:9,color:IOS.label3,marginTop:1}}>{s.wpct||"0%"} win rate</div>
         </div>
         <div style={{width:36,fontSize:11,color:IOS.label3,textAlign:"right"}}>{s.record}</div>
         <div style={{width:56,fontSize:13,fontWeight:800,color:parseFloat(s.points)>0?IOS.green:"#555",textAlign:"right"}}>{parseFloat(s.points||0).toFixed(1)}</div>
       </div>
     ))}
   </div>
 </div>
 )}

 {/* ── SCHEDULE TAB ── */}
 {lg && (leagueSubTab==="schedule"||leagueSubTab==="bracket") && (
 <div style={{padding:"12px 16px 20px"}}>
   <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:10}}>Season Schedule</div>
   {liveSchedule.length===0 ? (
     <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"20px",textAlign:"center"}}>
       <div style={{fontSize:13,color:"#fff",fontWeight:700,marginBottom:4}}>No schedule yet</div>
       <div style={{fontSize:11,color:IOS.label3}}>Fill up the league to generate the schedule</div>
     </div>
   ) : (
   <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:12,overflow:"hidden"}}>
     {liveSchedule.map((m,i)=>{
       const isCurrentWk = m.week===(lg.current_week||1);
       const won=m.result==="W", lost=m.result==="L", live=m.result==="live";
       return (
       <div key={i} onClick={()=>{ if(won||lost){ setActiveLeagueId(lg.id); setSelectedMatchup(m.week); fetchPastMatchupPicks(m.week, user.id, m.oppId); } }} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<liveSchedule.length-1?`0.5px solid ${IOS.sep}`:"none",background:isCurrentWk?"rgba(10,132,255,0.05)":"transparent",cursor:(won||lost)?"pointer":"default"}}>
         <div style={{width:32,fontSize:11,fontWeight:700,color:isCurrentWk?IOS.blue:IOS.label3,flexShrink:0}}>Wk {m.week}</div>
         <div style={{flex:1,fontSize:12,color:"#ccc"}}>vs {m.opp}</div>
         <div style={{display:"flex",alignItems:"center",gap:6}}>
           {(m.myPts>0||m.oppPts>0)&&<div style={{fontSize:11,color:IOS.label3}}>{m.myPts.toFixed(1)} - {m.oppPts.toFixed(1)}</div>}
           <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,
             background:won?"rgba(48,209,88,0.1)":lost?"rgba(255,59,48,0.08)":live?"rgba(255,159,10,0.1)":"rgba(255,255,255,0.06)",
             color:won?IOS.green:lost?IOS.red:live?IOS.orange:IOS.label3}}>
             {won?"W":lost?"L":live?"Live":isCurrentWk?"Now":"—"}
           </div>
           {(won||lost)&&<div style={{fontSize:14,color:IOS.label3,marginLeft:2}}>›</div>}
         </div>
       </div>
       );
     })}
   </div>
   )}
 </div>
 )}



 {/* Action buttons */}
 <div style={{padding:"2px 16px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
   <div onClick={async()=>{
     const code=prompt("Enter invite code:");
     if(!code) return;
     const {data:league,error}=await supabase.from("leagues").select().eq("invite_code",code.toUpperCase().trim()).single();
     if(error||!league){alert("League not found.");return;}
     const {data:currentMems}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
     const targetSize=league.target_size||league.max_members||8;
     if(currentMems&&currentMems.length>=targetSize){alert("League is full.");return;}
     const {error:joinError}=await supabase.from("league_members").insert({league_id:league.id,user_id:user.id,is_commissioner:false});
     if(joinError){alert("Error joining.");return;}
     const {data:allMems2}=await supabase.from("league_members").select("user_id").eq("league_id",league.id);
     if(allMems2 && allMems2.length >= targetSize) {
       const memberIds = allMems2.map(m=>m.user_id);
       if((league.league_type||'h2h')==='bracket') await generateBracket(league.id, memberIds);
       else if((league.league_type||'h2h')==='h2h') await generateSchedule(league.id, memberIds, league.season_weeks||18);
       alert("Joined "+league.name+"! League is full — schedule generated!");
     } else {
       alert("Joined "+league.name+"!");
     }
     await fetchLeagues(user.id);
   }} style={{cursor:"pointer",padding:"6px 4px"}}>
     <div style={{fontSize:12.5,fontWeight:600,color:IOS.blue}}>Join with code</div>
   </div>
   <div style={{width:3,height:3,borderRadius:"50%",background:"rgba(255,255,255,0.25)"}}/>
   <div onClick={()=>{setShowBrowse(true);fetchPublicLeagues();}} style={{cursor:"pointer",padding:"6px 4px"}}>
     <div style={{fontSize:12.5,fontWeight:600,color:IOS.blue}}>Browse public</div>
   </div>
 </div>
 </div>
 );
 })()}

 </div>
 </>
 )}

 {/* ══ COMMISSIONER ══ */}
 {screen==="commissioner"&&(
 <>
 <div className="body">
 {/* Header */}
 <div style={{padding:"10px 20px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:14,background:"radial-gradient(120% 90% at 90% -10%, rgba(255,214,10,0.12), transparent 55%), linear-gradient(180deg,#15130B 0%,#000 82%)"}}>
 <button onClick={()=>setScreen("leagues")} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
 <div>
 <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.3,color:"#fff"}}>{activeLeague.name}</div>
 <div style={{fontSize:12,color:IOS.yellow}}> Commissioner Panel</div>
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
 <div style={{margin:"0 16px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"24px 16px",textAlign:"center",color:IOS.label3,fontSize:15}}>
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
 {allGraded&&<span style={{fontSize:10}}></span>}
 </div>
 );
 })}
 </div>

 {/* Active member picks */}
 {activeMemberData&&(()=>{
 const slotColors={ml:"#3A9EE0",prop:"#3A9EE0",ou:"#3A9EE0",spread:"#3A9EE0",longshot:"#3A9EE0"};
 const memberTotal = activeMemberData.picks.filter(p=>p.result==="W").reduce((sum,p)=>{
 const dec = p.implied_odds?(p.implied_odds>0?p.implied_odds/100:100/Math.abs(p.implied_odds)):0.91;
 return sum+parseFloat((p.multiplier*dec*10).toFixed(1));
 },0).toFixed(1);
 const isYou = activeMemberId===user?.id;
 const pendingCount = activeMemberData.picks.filter(p=>p.result==="pending").length;
 const uid = activeMemberId;
 const memberData = activeMemberData;
 return (
 <div style={{margin:"0 16px 12px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:14,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
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
 }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="W"?IOS.green:"rgba(48,209,88,0.12)",color:pick.result==="W"?"#000":IOS.green,fontSize:12,fontWeight:700,cursor:"pointer"}}> Win</button>
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
 }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:pick.result==="L"?IOS.red:"rgba(255,69,58,0.12)",color:pick.result==="L"?"#fff":IOS.red,fontSize:12,fontWeight:700,cursor:"pointer"}}> Loss</button>
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
 }} style={{flex:1,background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.2)",borderRadius:8,padding:"8px",fontFamily:"Barlow,sans-serif",fontSize:12,fontWeight:700,color:IOS.red,cursor:"pointer"}}>
 Mark {pendingCount} pending as Loss
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
 // PUSH TRIGGER: notif_grades — notify user their picks were graded
 // await fetch('/api/notify', {method:'POST',headers:{'Content-Type':'application/json'},
 // body:JSON.stringify({userId:uid, title:'Picks Graded!',
 // body:`Your Week ${week} picks have been graded. Check your results!`,
 // data:{screen:'matchup'}})});
 // Check if all picks are graded and auto-advance if so
 await checkAutoAdvanceWeek(activeLeague.id, activeLeague);
 await fetchLeagues(user.id);
 await fetchSchedule(activeLeague.id, user.id);
 alert(memberData.name+"'s picks submitted!");
 }} style={{width:"100%",background:"linear-gradient(135deg,"+IOS.blue+","+IOS.indigo+")",border:"none",borderRadius:10,padding:"12px",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",letterSpacing:-0.2}}>
 Submit Picks for {memberData.name}
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
 <div style={{margin:"0 16px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>
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
 style={{flex:1,background:IOS.blue,border:"none",borderRadius:10,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Share
 </button>
 <button onClick={async()=>{const c=activeLeague.invite_code||activeLeague.inviteCode;try{await navigator.clipboard.writeText(c);alert("Copied! ");}catch(e){alert(c);}}}
 style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>
 Copy
 </button>
 </div>
 </div>
 </>
 )}

 {/* SETTINGS tab */}
 {commishTab==="settings"&&(
 <>
 {/* ── Commish Pro toggle ── */}
 <div style={{margin:"0 16px 12px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
   <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div>
       <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Commish Pro</div>
       <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>{isPro?"Active — full league control":"Unlock custom picks, sports, and more"}</div>
     </div>
     <div onClick={()=>isPro?setProStatus(false):setShowPaywall("settings")} style={{width:51,height:31,borderRadius:16,background:isPro?IOS.blue:"#2A2A2A",border:`1px solid ${isPro?IOS.blue:"#3A3A3A"}`,position:"relative",cursor:"pointer",transition:"background .2s"}}>
       <div style={{position:"absolute",top:3,left:isPro?22:3,width:25,height:25,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}/>
     </div>
   </div>
   {isPro&&(
     <div style={{padding:"0 16px 12px",borderTop:`0.5px solid ${IOS.sep}`}}>
       {[{label:"Max picks per week",val:"Unlimited"},
         {label:"Sports",val:"NFL, NBA, MLB, NHL"},
         {label:"Multiplier range",val:"Custom"},
         {label:"Power-ups",val:"Enabled"},
       ].map((r,i)=>(
         <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<3?`0.5px solid ${IOS.sep}`:"none"}}>
           <div style={{fontSize:13,color:IOS.label3}}>{r.label}</div>
           <div style={{fontSize:13,fontWeight:600,color:IOS.blue}}>{r.val}</div>
         </div>
       ))}
     </div>
   )}
 </div>

 {/* ── Generate Schedule (if league full but no schedule yet) ── */}
 {leagueMembers.length >= (activeLeague.target_size||activeLeague.max_members||8) && liveSchedule.length === 0 && (
   <div style={{margin:"0 16px 12px",background:"rgba(48,209,88,0.08)",borderRadius:16,padding:"14px 16px",border:"0.5px solid rgba(48,209,88,0.25)"}}>
     <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>League is full — no schedule yet</div>
     <div style={{fontSize:12,color:IOS.label3,marginBottom:12}}>Generate matchups for all {activeLeague.season_weeks||18} weeks of the season.</div>
     <button onClick={async()=>{
       const memberIds = leagueMembers.map(m=>m.userId).filter(Boolean);
       if(memberIds.length === 0) { alert("Could not load member IDs. Try refreshing."); return; }
       if((activeLeague.league_type||"h2h")==="bracket") {
         await generateBracket(activeLeague.id, memberIds);
       } else {
         await generateSchedule(activeLeague.id, memberIds, activeLeague.season_weeks||18);
       }
       await fetchSchedule(activeLeague.id, user.id);
       await fetchStandings(activeLeague.id);
       alert("Schedule generated!");
     }} style={{width:"100%",background:IOS.green,border:"none",borderRadius:10,padding:"12px",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer"}}>
       Generate Schedule Now
     </button>
   </div>
 )}

 {/* ── Season Length ── */}
 <div style={{margin:"0 16px 12px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
   <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div>
       <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Season Length</div>
       <div style={{fontSize:12,color:IOS.label3,marginTop:1}}>Total weeks in this league's season</div>
     </div>
     <div style={{display:"flex",alignItems:"center",gap:10}}>
       <div onClick={async(e)=>{
         e.stopPropagation();
         const newVal = Math.min(52, Math.max(1,(activeLeague.season_weeks||18)-1));
         await supabase.from("leagues").update({season_weeks:newVal}).eq("id",activeLeague.id);
         await fetchLeagues(user.id);
       }} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#fff",fontWeight:700}}>−</div>
       <div style={{fontSize:18,fontWeight:800,color:IOS.blue,minWidth:28,textAlign:"center"}}>{activeLeague.season_weeks||18}</div>
       <div onClick={async(e)=>{
         e.stopPropagation();
         const newVal = Math.min(52,(activeLeague.season_weeks||18)+1);
         await supabase.from("leagues").update({season_weeks:newVal}).eq("id",activeLeague.id);
         await fetchLeagues(user.id);
       }} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#fff",fontWeight:700}}>+</div>
     </div>
   </div>
 </div>

 {/* ── Week Management ── */}
 <div style={{margin:"0 16px 12px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
 <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>Week Management</div>
 <div style={{fontSize:22,fontWeight:800,color:IOS.blue}}>Wk {activeLeague.current_week||1}</div>
 </div>
 <div style={{padding:"14px 16px"}}>
 <div style={{fontSize:14,color:"#fff",marginBottom:4}}>Week {activeLeague.current_week||1} of {activeLeague.season_weeks||18}</div>
 <div style={{fontSize:12,color:IOS.orange,marginBottom:14}}> Auto-grade runs daily at 10am. You can also trigger it manually below.</div>
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
 alert(`Auto-grade: graded ${d.graded}, skipped ${d.skipped}\n\nReasons: ${JSON.stringify(d.reasons||{})}\n\nCompleted games seen (${d.debug?.scoresTotal||0} total): ${(d.debug?.scoresCompleted||[]).join(" | ")||"NONE"}\n\nPlayers indexed: ${d.debug?.indexedPlayers??0}\n\n${(d.samples||[]).map(s=>`${s.slot} "${s.name}" [${s.game}] -> ${s.reason}`).join("\n")}`);
 } else {
 alert("Grade error: " + (d.error||"Unknown"));
 }
 } catch(e) { alert("Failed to reach grade API: " + e.message); }
 }} style={{width:"100%",background:"rgba(10,132,255,0.15)",border:"1px solid rgba(10,132,255,0.3)",borderRadius:12,padding:"12px",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:700,color:IOS.blue,cursor:"pointer",marginBottom:10}}>
 Run Auto-Grade Now
 </button>
 <button onClick={async()=>{
 if((activeLeague.league_type||"h2h")==="bracket"){ alert("Tournament rounds advance automatically once all games finish — no manual advance needed."); return; }
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

 // Advance week — but never past the final week of the season.
 const _seasonWeeks = activeLeague.season_weeks||18;
 if(nextWeek > _seasonWeeks){
 alert("This was the final week — the season is complete! Final standings are locked in.");
 } else {
 await supabase.from("leagues").update({current_week: nextWeek}).eq("id", activeLeague.id);
 }

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
 alert(` Advanced to Week ${nextWeek}! You were the top scorer — you earned a Wheel Spin!`);
 } else {
 alert(` Advanced to Week ${nextWeek}! Slips have been reset.`);
 }
 } else {
 alert(` Advanced to Week ${nextWeek}! Slips have been reset.`);
 }

 // PUSH TRIGGER: notif_results — notify all users of weekly result
 // for(const m of (weekMatchups||[])) {
 // for(const uid of [m.user1_id, m.user2_id]) {
 // const won = (totals[uid]||0) >= (totals[uid===m.user1_id?m.user2_id:m.user1_id]||0);
 // await fetch('/api/notify', {method:'POST',headers:{'Content-Type':'application/json'},
 // body:JSON.stringify({userId:uid,
 // title: won ? 'You Won This Week! ' : 'Week Result',
 // body: won ? `You won Week ${currentWeek}! Check your standings.`
 // : `Week ${currentWeek} is over. Better luck next week!`,
 // data:{screen:'matchup'}})});
 // }
 // }
 await fetchLeagues(user.id);
 await fetchStandings(activeLeague.id);
 await fetchSchedule(activeLeague.id, user.id);
 setSavedPicks(null);
 setFlexPicks(freshSlots());
 try { localStorage.removeItem(`linedup_picks_${activeLeague.id}_wk${currentWeek}`); } catch(e) {}
 setAdvancingWeek(false);
 }} style={{width:"100%",background:advancingWeek?"rgba(255,255,255,0.08)":IOS.green,border:"none",borderRadius:12,padding:"14px",fontFamily:"Barlow,sans-serif",fontSize:15,fontWeight:700,color:advancingWeek?"rgba(255,255,255,0.3)":"#000",cursor:advancingWeek?"default":"pointer"}}>
 {advancingWeek ? "Advancing..." : `⏭ End Week ${activeLeague.current_week||1} · Start Week ${(activeLeague.current_week||1)+1}`}
 </button>
 </div>
 </div>

 {/* ── League Size ── */}
 <div style={{margin:"0 16px 12px",background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)",boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
 <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
 <div style={{fontSize:13,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3}}>League Size</div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:4}}>
 {leagueMembers.length} / {activeLeague.target_size||activeLeague.max_members||8} members
 {leagueMembers.length >= (activeLeague.target_size||activeLeague.max_members||8)
 ? <span style={{color:IOS.green,fontWeight:700}}> · Full </span>
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
 <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>
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

 {/* Season Complete banner */}
 {(()=>{
 const _sw=activeLeague.season_weeks||18;
 const _cw=activeLeague.current_week||activeLeague.week||1;
 const finalPicks=weekPicks.filter(p=>p.week===_cw);
 const done=!isSoloMode && _cw>=_sw && finalPicks.length>0 && finalPicks.every(p=>p.result&&p.result!=="pending");
 if(!done) return null;
 const champ=realStandings[0];
 const champName=champ?(champ.isYou?"You":(champ.name||champ.username||"Champion")):null;
 const youWon=champ&&champ.isYou;
 return (
 <div style={{margin:"0 16px 14px",borderRadius:16,overflow:"hidden",position:"relative",background:"linear-gradient(135deg,#1A1606 0%,#0B0B0E 70%)",border:"0.5px solid rgba(255,193,7,0.35)",animation:"champGlow 3.2s ease-in-out infinite"}}>
 <div style={{position:"absolute",top:0,bottom:0,width:"45%",background:"linear-gradient(100deg,transparent,rgba(255,214,10,0.16),transparent)",animation:"champSweep 3.8s ease-in-out infinite",pointerEvents:"none"}}/>
 <div style={{position:"relative",display:"flex",alignItems:"center",gap:13,padding:"14px 16px"}}>
 <div style={{width:42,height:42,borderRadius:12,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 50% 35%,rgba(255,214,10,0.28),rgba(255,159,10,0.1))",border:"0.5px solid rgba(255,214,10,0.4)"}}>
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD60A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
 </div>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"#FFD60A",marginBottom:2}}>Season Complete</div>
 <div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.15}}>{youWon?"You took the crown":(champName?champName+" wins the league":"Final standings are in")}</div>
 <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.45)",marginTop:2}}>{champ?champ.record+" · "+parseFloat(champ.points||0).toFixed(1)+" pts":"Tap Standings for the final board"}</div>
 </div>
 {youWon&&<div style={{fontSize:9,fontWeight:800,letterSpacing:"0.08em",color:"#0B0B0E",background:"linear-gradient(135deg,#FFD60A,#FF9F0A)",borderRadius:7,padding:"4px 8px",flexShrink:0}}>CHAMPION</div>}
 </div>
 </div>
 );
 })()}

 {/* Tabs */}
 <div className="seg-control" style={{marginBottom:14}}>
 {(activeLeague.league_type==="bracket"?["standings","trophies","bracket"]:["standings","trophies","schedule"]).map(t=><div key={t} className={`seg-item ${leagueTab===t?"on":""}`} onClick={()=>setLeagueTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
 </div>

 {(leagueTab==="bracket"||(leagueTab==="schedule"&&activeLeague.league_type==="bracket"))&&(
 <>
 {(()=>{
 const targetSize = activeLeague.target_size||activeLeague.max_members||8;
 const isFull = leagueMembers.length >= targetSize;
 if(!isFull) return (
 <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,padding:"36px 24px",textAlign:"center"}}>
 <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>Bracket Locks When Full</div>
 <div style={{fontSize:14,color:IOS.label3,lineHeight:1.6,marginBottom:20}}>The tournament bracket generates once you reach {targetSize} players.</div>
 <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,height:8,overflow:"hidden",marginBottom:10}}>
 <div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${IOS.blue},${IOS.purple})`,width:`${(leagueMembers.length/targetSize)*100}%`,transition:"width .4s"}}/>
 </div>
 <div style={{fontSize:13,fontWeight:700,color:IOS.blue}}>{leagueMembers.length} / {targetSize} players</div>
 {activeLeague.isCommissioner && <div style={{marginTop:14,fontSize:12,color:IOS.label3}}>Invite code: <span style={{fontWeight:700,color:"#fff",letterSpacing:2}}>{activeLeague.invite_code||activeLeague.inviteCode}</span></div>}
 </div>
 );
 return (<>
 {bracketMatchups.some(mm=>mm.week===bracketLive.week && !mm.winner_id) && <div style={{margin:"0 16px 10px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"rgba(48,209,88,.1)",border:"1px solid rgba(48,209,88,.3)",borderRadius:12,padding:"9px 14px"}}><span className="brk-livedot"/><span style={{fontSize:11,fontWeight:900,letterSpacing:".12em",color:IOS.green}}>WIN OR GO HOME · LIVE ROUND</span></div>}
 <BracketView matchups={bracketMatchups} members={leagueMembers} uid={user&&user.id} IOS={IOS} onOpenMatch={openBracketMatch} live={bracketLive} onChampion={(id,nm)=>setChampCelebrate({name:nm, leagueName:activeLeague.name, isYou:id===(user&&user.id)})}/>
 </>);
 })()}
 {bracketDetail && <BracketMatchSheet d={bracketDetail} IOS={IOS} onClose={()=>setBracketDetail(null)}/>}
 {champCelebrate && <ChampCelebrate name={champCelebrate.name} leagueName={champCelebrate.leagueName} isYou={champCelebrate.isYou} IOS={IOS} onClose={()=>setChampCelebrate(null)} onShare={()=>champShare(champCelebrate.name, champCelebrate.leagueName)}/>}
 </>
 )}

 {leagueTab==="standings"&&(
 <>
 {/* Hero — your stats */}
 <div className="league-hero">
 <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.indigo})`}}/>
 <div className="lh-rank"> Your Rank — #{realStandings.find(s=>s.isYou)?.rank||"?"} of {activeLeague.target_size||activeLeague.max_members||8}</div>
 <div className="lh-name">You</div>
 <div className="lh-stats">
 <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.blue}}>{realStandings.find(s=>s.isYou)?.record||"0-0"}</div><div className="lh-stat-lbl">Record</div></div>
 <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>{realStandings.find(s=>s.isYou)?.wpct||"0%"}</div><div className="lh-stat-lbl">Win %</div></div>
 <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>{realStandings.find(s=>s.isYou)?.points||0}pts</div><div className="lh-stat-lbl">Points</div></div>
 <div className="lh-stat"><div className="lh-stat-val" style={{color:IOS.green}}>Wk {activeLeague.current_week||activeLeague.week||1}</div><div className="lh-stat-lbl">Current</div></div>
 </div>
 </div>

 {/* This Week section */}
 <div style={{padding:"16px 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{display:"flex",alignItems:"center",gap:8}}>
 <div style={{fontSize:18}}></div>
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
 {i===0?"":i===1?"":i===2?"":`${i+1}`}
 </div>
 <div style={{flex:1}}>
 <div style={{fontSize:15,fontWeight:600,color:isMe?IOS.blue:"#fff"}}>{isMe?"You ":row.name}</div>
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
 <div style={{fontSize:18}}></div>
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
 <div className={`st-name ${isMe?"me":""}`}>{isMe?"You ":row.name}</div>
 {row.streak?.count >= 1 && (
 <div style={{fontSize:11,fontWeight:700,color:row.streak.type==='W'?IOS.green:IOS.red,marginTop:2}}>
 {row.streak.type==='W' && row.streak.count >= 2 ? ` W${row.streak.count}` : `${row.streak.type}${row.streak.count}`}
 </div>
 )}
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
 <div style={{fontSize:48,marginBottom:12}}></div>
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
 <div style={{width:48,height:48,borderRadius:14,background:`${t.color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{trophySVG(t.id,t.color)}</div>
 <div style={{flex:1}}>
 <div style={{fontSize:16,fontWeight:700,color:t.isYou?t.color:"#fff",marginBottom:3}}>{t.name}</div>
 <div style={{fontSize:12,color:IOS.label3,marginBottom:4}}>{t.desc}</div>
 <div style={{fontSize:12,fontWeight:600,color:t.isYou?t.color:IOS.label2}}>{t.isYou?" Currently yours":`Held by ${t.holder}`}</div>
 </div>
 {t.isYou&&<div style={{background:`${t.color}18`,border:`1px solid ${t.color}40`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:t.color,flexShrink:0}}>YOURS</div>}
 </div>
 ))}
 </>
 )}
 </div>
 )}

 {leagueTab==="schedule"&&activeLeague.league_type!=="bracket"&&(
 <>
 {(()=>{
 const targetSize = activeLeague.target_size||activeLeague.max_members||8;
 const currentSize = leagueMembers.length;
 const isFull = currentSize >= targetSize;
 if(!isFull) return (
 <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:16,padding:"36px 24px",textAlign:"center"}}>
 <div style={{fontSize:44,marginBottom:12}}></div>
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
 <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px",overflow:"hidden"}}>
 {liveSchedule.length === 0 ? (
 <div style={{padding:"32px 24px",textAlign:"center",color:IOS.label3}}>
 <div style={{fontSize:32,marginBottom:10}}></div>
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
 onClick={()=>{
 if(done) {
 setSelectedMatchup(wk.week);
 fetchPastMatchupPicks(wk.week, user.id, wk.oppId);
 }
 }}
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
 {screen==="ai"&&(
          <div className="body" style={{display:"flex",flexDirection:"column",height:"100%",background:"#08080A",overflow:"hidden",position:"relative"}}>
            <style>{`@keyframes aiRise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}} .ai-rise{animation:aiRise .28s ease both;} @keyframes aiBlink{0%,100%{opacity:1}50%{opacity:0}} .ai-caret{display:inline-block;width:2px;height:0.95em;background:#0A84FF;margin-left:2px;vertical-align:-1px;border-radius:1px;animation:aiBlink .8s steps(1) infinite;} @keyframes aiPulse{0%,100%{opacity:0.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}} .ai-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.6);display:inline-block;animation:aiPulse .9s ease-in-out infinite;}`}</style>
            <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:11,padding:"12px 16px 10px",borderBottom:"0.5px solid rgba(255,255,255,0.08)"}}>
              <div onClick={()=>setScreen(aiReturn||"home")} style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:18,flexShrink:0}}>‹</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>
                <div>
                  <div style={{fontSize:18,fontWeight:800,letterSpacing:"-0.4px",color:"#fff",lineHeight:1}}>Plok</div>
                  <div style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",marginTop:2}}>Screening, not advice</div>
                </div>
              </div>
              <button onClick={()=>{ if(!isPro){setShowPaywall("ai");return;} setModelPicker(true); }} style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:5,padding:"7px 11px",borderRadius:10,background:`${IOS.blue}1a`,border:`1px solid ${IOS.blue}40`,color:IOS.blue,fontSize:11.5,fontWeight:800,cursor:"pointer"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Plok Models</button>
            </div>
            <div className="gbx-scroll" style={{flexShrink:0,display:"flex",gap:6,overflowX:"auto",padding:"9px 12px 10px",borderBottom:"0.5px solid rgba(255,255,255,0.06)"}}>
              {PLOK_PERSONAS.map(pz=>{
                const on = plokPersona===pz.key;
                return (
                  <button key={pz.name} onClick={()=>setPlokPersona(pz.key)} style={{flexShrink:0,padding:"6px 11px",borderRadius:18,border:on?`1px solid ${IOS.blue}`:"0.5px solid rgba(255,255,255,0.12)",background:on?`${IOS.blue}22`:"rgba(255,255,255,0.04)",color:on?IOS.blue:"rgba(255,255,255,0.6)",fontSize:11.5,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Barlow,sans-serif"}}>{pz.name}</button>
                );
              })}
            </div>
            <div className="gbx-scroll" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"14px 14px 16px"}}>
              {plokBuilding && (
                <div className="ai-rise" style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,0.04)",border:`0.5px solid ${IOS.blue}33`,borderRadius:12,padding:"14px"}}>
                  <span className="ai-dot"/><span className="ai-dot" style={{animationDelay:".15s"}}/><span className="ai-dot" style={{animationDelay:".3s"}}/>
                  <span style={{fontSize:12.5,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>Plok is building your slip…</span>
                </div>
              )}
              {plokBuild && plokBuild.error && (
                <div className="ai-rise" style={{background:"rgba(255,69,58,0.08)",border:`0.5px solid ${IOS.red}33`,borderRadius:12,padding:"12px 14px",fontSize:12.5,color:"rgba(255,255,255,0.75)"}}>{plokBuild.error}</div>
              )}
              {plokBuild && plokBuild.items && (
                <div className="ai-rise" style={{background:`linear-gradient(135deg,${IOS.blue}1a,rgba(255,255,255,0.03))`,border:`0.5px solid ${IOS.blue}33`,borderRadius:14,padding:"13px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:IOS.blue}}>Plok built your slip</div>
                    <div onClick={()=>setPlokBuild(null)} style={{cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:17,lineHeight:1}}>×</div>
                  </div>
                  {plokBuild.strategy && <div style={{fontSize:12.5,lineHeight:1.45,color:"rgba(255,255,255,0.82)",marginBottom:12}}>{plokBuild.strategy}</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {plokBuild.items.map((it,ii)=>(
                      <div key={ii} style={{display:"flex",alignItems:"flex-start",gap:9}}>
                        <div style={{width:30,height:30,flexShrink:0,borderRadius:8,background:`${it.meta.color}1f`,border:`0.5px solid ${it.meta.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:it.meta.color}}>{it.mult}×</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                            <span style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.04em",textTransform:"uppercase",color:it.meta.color,flexShrink:0}}>{it.meta.label}</span>
                            <span style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.name}{it.odds?<span style={{color:"rgba(255,255,255,0.4)",fontWeight:600,marginLeft:5}}>{it.odds}</span>:null}</span>
                          </div>
                          {it.reason && <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2,lineHeight:1.35}}>{it.reason}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:13}}>
                    <button onClick={applyPlokSlip} style={{flex:1,background:IOS.blue,border:"none",borderRadius:11,padding:"11px",fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Review &amp; lock in slip</button>
                    <button onClick={buildPlokSlip} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:11,padding:"11px 14px",fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.8)",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Rebuild</button>
                  </div>
                </div>
              )}
              {aiThread.length===0 && plokRecord && (plokRecord.wins+plokRecord.losses)>0 && (()=>{
                const w=plokRecord.wins, l=plokRecord.losses, u=plokRecord.units;
                const pct = (w+l)>0 ? Math.round(w/(w+l)*100) : 0; const up = u>=0;
                const stat = (val,lab,col)=>(<div><div style={{fontSize:23,fontWeight:900,color:col||"#fff",letterSpacing:-0.5,lineHeight:1}}>{val}</div><div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",marginTop:3,textTransform:"uppercase",letterSpacing:"0.04em"}}>{lab}</div></div>);
                return (
                  <div className="ai-rise" style={{background:`linear-gradient(135deg,${IOS.blue}1a,rgba(255,255,255,0.03))`,border:`0.5px solid ${IOS.blue}33`,borderRadius:14,padding:"13px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)"}}>Plok's track record</div>
                      <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,0.35)"}}>graded calls</div>
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:18}}>
                      {stat(`${w}-${l}`,"Record")}
                      {stat(`${pct}%`,"Hit rate")}
                      {stat(`${up?"+":""}${u}u`,"Units",up?IOS.green:IOS.red)}
                    </div>
                    {plokRecord.recent && plokRecord.recent.length>0 && (
                      <div style={{marginTop:11,paddingTop:10,borderTop:"0.5px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",gap:6}}>
                        {plokRecord.recent.slice(0,3).map((c,ci)=>(
                          <div key={ci} style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5}}>
                            <span style={{width:16,height:16,borderRadius:4,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:c.result==="W"?IOS.green:IOS.red,background:c.result==="W"?`${IOS.green}1f`:`${IOS.red}1f`}}>{c.result}</span>
                            <span style={{flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:"rgba(255,255,255,0.75)",fontWeight:600}}>{c.selection}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {aiThread.length===0 && (
                <div style={{margin:"auto 0",textAlign:"center",padding:"20px 10px"}}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)" style={{marginBottom:12}}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg>
                  <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:6}}>Break down any bet</div>
                  <div style={{fontSize:12.5,color:"rgba(255,255,255,0.45)",lineHeight:1.5,maxWidth:260,margin:"0 auto 16px"}}>Tap a bet below, or search a player or team that's on your board.</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center"}}>
                    {ALL_BETS.slice(0,5).map((b,bi)=>(
                      <button key={bi} onClick={()=>askFromBet(b,b.category)} style={{padding:"7px 12px",borderRadius:18,background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.85)",fontSize:11.5,fontWeight:700,cursor:"pointer",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</button>
                    ))}
                  </div>
                  <div style={{marginTop:16,paddingTop:16,borderTop:"0.5px solid rgba(255,255,255,0.07)"}}>
                    <button onClick={()=>{ if(!isPro){setShowPaywall("ai");return;} setFindBetOpen(true); }} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:IOS.blue,border:"none",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Find a +EV bet</button>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:8}}>Plok scans the books for the best price on a game.</div>
                    <div style={{marginTop:12}}>
                      <button onClick={buildPlokSlip} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:`1px solid ${IOS.blue}40`,color:IOS.blue,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>Build my whole slip</button>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:8}}>Plok fills all 5 slots, tuned to your league spot.</div>
                    </div>
                  </div>
                </div>
              )}
              {aiThread.map((item,i)=> item.role==="user"
                ? (<div key={i} style={{alignSelf:"flex-end",maxWidth:"82%",background:IOS.blue,color:"#fff",borderRadius:"14px 14px 4px 14px",padding:"8px 12px",fontSize:13,fontWeight:600,marginLeft:"auto"}}>{item.text}</div>)
                : (<ErrorBoundary key={i} fallback={<div style={{alignSelf:"flex-start",width:"100%",background:"linear-gradient(160deg,#16161B,#0C0C0F)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px 14px 14px 4px",padding:"13px 14px",fontSize:12.5,color:IOS.red,fontWeight:600}}>Couldn't load this read.</div>}><AiInsightBubble item={item} IOS={IOS} onAddToSlip={()=>{ if(aiAddToSlip(item.bet,item.category)){ setAiThread(prev=>prev.map(x=>x===item?{...x,added:true}:x)); } }} /></ErrorBoundary>)
              )}
            </div>
            {modelPicker && (
              <div onClick={()=>setModelPicker(false)} style={{position:"absolute",inset:0,zIndex:41,background:"rgba(0,0,0,0.55)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                <div onClick={(e)=>e.stopPropagation()} style={{background:"#101015",borderTopLeftRadius:18,borderTopRightRadius:18,borderTop:"0.5px solid rgba(255,255,255,0.12)",maxHeight:"80%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"14px 16px 11px",flexShrink:0,borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Plok Models</div>
                      <div onClick={()=>setModelPicker(false)} style={{fontSize:13,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Cancel</div>
                    </div>
                    <div style={{fontSize:11.5,color:"rgba(255,255,255,0.45)",marginTop:3,lineHeight:1.4}}>Pick a lens. Each one reads the same games a different way.</div>
                  </div>
                  <div style={{overflowY:"auto",padding:"10px 12px 16px"}}>
                    {PLOK_MODELS.map(m=>(
                      <div key={m.id} onClick={()=>{ if(!m.ready) return; setPlokModel(m.id); setModelPicker(false); setFindBetOpen(true); }} style={{display:"flex",alignItems:"center",gap:12,background:m.ready?"linear-gradient(160deg,#15151A,#0B0B0E 80%)":"rgba(255,255,255,0.02)",border:"0.5px solid "+(m.ready?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.05)"),borderRadius:13,padding:"13px 14px",marginBottom:9,cursor:m.ready?"pointer":"default",opacity:m.ready?1:0.6}}>
                        <div style={{width:38,height:38,borderRadius:11,background:m.color+"1f",border:"0.5px solid "+m.color+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{m.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:15,fontWeight:800,color:"#fff"}}>{m.name}</span>{!m.ready && <span style={{fontSize:9,fontWeight:800,letterSpacing:"0.06em",color:m.color,background:m.color+"22",borderRadius:5,padding:"2px 6px"}}>SOON</span>}</div>
                          <div style={{fontSize:11.5,color:"rgba(255,255,255,0.5)",marginTop:2,lineHeight:1.35}}>{m.desc}</div>
                        </div>
                        {m.ready && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {findBetOpen && (
              <div onClick={()=>setFindBetOpen(false)} style={{position:"absolute",inset:0,zIndex:40,background:"rgba(0,0,0,0.55)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                <div onClick={(e)=>e.stopPropagation()} style={{background:"#101015",borderTopLeftRadius:18,borderTopRightRadius:18,borderTop:"0.5px solid rgba(255,255,255,0.12)",maxHeight:"70%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"14px 16px 11px",flexShrink:0,borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{(PLOK_MODELS.find(x=>x.id===plokModel)||{}).name||"Find a bet"} · pick a game</div>
                      <div onClick={()=>setFindBetOpen(false)} style={{fontSize:13,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>Cancel</div>
                    </div>
                    <div style={{fontSize:11.5,color:"rgba(255,255,255,0.45)",marginTop:3,lineHeight:1.4}}>{(PLOK_MODELS.find(x=>x.id===plokModel)||{}).desc||"Plok scans the game and flags the best value."}</div>
                  </div>
                  <div style={{overflowY:"auto",padding:"0 0 10px"}}>
                    {findBetGames.length===0 && (<div style={{padding:"24px 16px",textAlign:"center",fontSize:12.5,color:"rgba(255,255,255,0.45)"}}>No games on your board right now.</div>)}
                    {findBetGroups.map((grp,si)=>(
                      <div key={si}>
                        <div style={{padding:"12px 16px 5px",fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)"}}>{({nfl:"NFL",nba:"NBA",mlb:"MLB"})[grp.sport]||String(grp.sport).toUpperCase()}</div>
                        {grp.games.map((g,gi)=>{
                          const tm = g.time ? new Date(g.time) : null;
                          const tstr = tm && !isNaN(tm.getTime()) ? tm.toLocaleString([],{weekday:"short",hour:"numeric",minute:"2-digit"}) : null;
                          return (
                            <div key={gi} onClick={()=>askFindBet(g)} style={{padding:"11px 16px",borderTop:"0.5px solid rgba(255,255,255,0.05)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:14,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.away||g.game}</div>
                                {g.home && <div style={{fontSize:14,fontWeight:800,color:"rgba(255,255,255,0.85)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.home}</div>}
                                {tstr && <div style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",marginTop:3}}>{tstr}</div>}
                              </div>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{flexShrink:0,position:"relative",borderTop:"0.5px solid rgba(255,255,255,0.08)",background:"#0B0B0E",padding:"10px 12px"}}>
              {aiSuggestions.length>0 && (
                <div style={{position:"absolute",left:12,right:12,bottom:"100%",marginBottom:8,background:"#15151A",border:"0.5px solid rgba(255,255,255,0.12)",borderRadius:12,overflow:"hidden",boxShadow:"0 -8px 24px rgba(0,0,0,0.5)"}}>
                  {aiSuggestions.map((b,bi)=>(
                    <div key={bi} onClick={()=>{ setAiInput(""); askFromBet(b,b.category); }} style={{padding:"10px 13px",borderBottom:bi<aiSuggestions.length-1?"0.5px solid rgba(255,255,255,0.06)":"none",cursor:"pointer"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.pick}</div>
                      <div style={{fontSize:10.5,color:"rgba(255,255,255,0.4)",marginTop:1}}>{b.categoryLabel} · {b.game}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input value={aiInput} onChange={(e)=>setAiInput(e.target.value)} placeholder="Ask Plok anything, or search a bet…"
                  onKeyDown={(e)=>{ if(e.key==="Enter"){ sendAi(); } }}
                  style={{flex:1,background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.12)",borderRadius:11,padding:"11px 13px",color:"#fff",fontSize:13.5,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={sendAi} disabled={aiBusy||!aiInput.trim()}
                  style={{width:42,height:42,flexShrink:0,borderRadius:11,border:"none",background:(aiInput.trim()&&!aiBusy)?IOS.blue:"rgba(255,255,255,0.08)",color:"#fff",cursor:(aiInput.trim()&&!aiBusy)?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
        {screen==="chat"&&(
 <>
 <div style={{padding:"10px 20px 14px",display:"flex",alignItems:"center",gap:12,background:"radial-gradient(120% 90% at 90% -10%, rgba(10,132,255,0.18), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 82%)"}}>
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
 <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
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
 {(()=>{
 const st=allMyStats||{};
 const wins=st.wins||0, losses=st.losses||0, total=st.total||0;
 const winFrac=(wins+losses)>0?wins/(wins+losses):0;
 const cs=st.currentStreak||{count:0,type:"W"};
 const lsW=(st.byType&&st.byType.longshot&&st.byType.longshot.wins)||0;
 const lsRate=((st.byType&&st.byType.longshot&&st.byType.longshot.pct)||0)/100;
 const mx=st.maxStreak||0;
 let ovr=40+winFrac*46+Math.min(total/180,1)*7+(cs.type==="W"?Math.min(cs.count,7):0)+lsRate*5;
 ovr=Math.round(Math.max(40,Math.min(99,ovr)));
 const tier=ovr<64?"bronze":ovr<77?"silver":ovr<89?"gold":"legend";
 const arch=(st.personality||"The Rookie").replace(/^The\s+/,"");
 const uname=userProfile?.username||user?.email?.split("@")[0]||"You";
 const initials=(uname||"JD").slice(0,2).toUpperCase();
 const serial="#"+String(1000+Math.round(st.points||0)).slice(-4);
 const badges=[
 {id:"hot",name:"Hot Hand",short:"Hot Hand",desc:"Win 5 picks in a row.",svg:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',cur:cs.type==="W"?cs.count:0,goal:5,unlocked:cs.type==="W"&&cs.count>=5},
 {id:"long",name:"Longshot King",short:"Longshot",desc:"Hit 5 longshot bets (+400 or better).",svg:'<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.18 2.18 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/>',cur:lsW,goal:5,unlocked:lsW>=5},
 {id:"sharp",name:"Sharp",short:"Sharp",desc:"Hold a 60%+ win rate over 40+ graded picks.",svg:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',cur:Math.round(winFrac*100),goal:60,suffix:"%",unlocked:winFrac>=0.6&&total>=40},
 {id:"cent",name:"Centurion",short:"Centurion",desc:"Lock in 100 career picks.",svg:'<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',cur:total,goal:100,unlocked:total>=100},
 {id:"iron",name:"Unstoppable",short:"Unstoppable",desc:"Build a 10-pick win streak.",svg:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',cur:mx,goal:10,unlocked:mx>=10},
 ];
 const backRows=[["Playstyle",arch],["Win rate",st.winRate||"0%"],["Total picks",total],["Longshot rate",Math.round(lsRate*100)+"%"],["Longest streak","W"+mx],["Season points",Math.round(st.points||0)],["Best pick",(st.bestBet&&st.bestBet.pick_name)||"—"]];
 const cardData={ovr,tier,arch,record:wins+"-"+losses,winPct:st.winRate||"0%",streak:cs,name:uname,initials,serial,badges,backRows};
 if(editingUsername){
 return (
 <div className="prof-av-wrap" style={{background:"radial-gradient(120% 120% at 90% -20%, rgba(10,132,255,0.18), transparent 55%), linear-gradient(180deg,#0B1A2E 0%,#000 85%)"}}>
 <div className="prof-av">{(userProfile?.username?.[0]||user?.email?.[0]||"J").toUpperCase()}</div>
 <div>
 <div style={{display:"flex",flexDirection:"column",gap:6}}>
 <input value={usernameInput} onChange={e=>{setUsernameInput(e.target.value);setUsernameError("");}} placeholder="Enter username" autoFocus
 style={{background:"#2C2C2E",border:`1px solid ${usernameError?IOS.red:IOS.blue}`,borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:15,fontFamily:"'Barlow',sans-serif",outline:"none",width:180}}/>
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
 setEditingUsername(false); setUsernameSaving(false);
 }} style={{fontSize:13,fontWeight:700,color:usernameSaving?IOS.label3:IOS.green,cursor:"pointer"}}>{usernameSaving?"Saving...":"Save"}</div>
 <div onClick={()=>{setEditingUsername(false);setUsernameError("");}} style={{fontSize:13,fontWeight:600,color:IOS.label3,cursor:"pointer"}}>Cancel</div>
 </div>
 </div>
 <div className="prof-league" style={{marginTop:8}}>{realLeagues.length} active league{realLeagues.length!==1?"s":""}</div>
 </div>
 </div>
 );
 }
 return (
 <div style={{padding:"8px 0 4px"}}>
 <PlayerCard data={cardData} IOS={IOS}/>
 <div style={{textAlign:"center",marginTop:12}}>
 <span onClick={()=>{setUsernameInput(userProfile?.username||"");setEditingUsername(true);}} style={{fontSize:12.5,fontWeight:700,color:IOS.blue,cursor:"pointer"}}>{userProfile?.username?"Edit name":"Set username"}</span>
 <span style={{fontSize:12.5,color:IOS.label3,marginLeft:12}}>{realLeagues.length} league{realLeagues.length!==1?"s":""}</span>
 </div>
 {!userProfile?.username&&<div style={{fontSize:11,color:IOS.orange,textAlign:"center",marginTop:5}}>Set a username so friends can find you</div>}
 </div>
 );
 })()}

 <div className="seg-control">
 {["stats","power-ups"].map(t=><div key={t} className={`seg-item ${profTab===t?"on":""}`} onClick={()=>setProfTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>)}
 </div>

 {profTab==="stats"&&(
 <>
 {(()=>{
   const s = allMyStats||{};
   const types = Object.values(s.byType||{}).filter(t=>(t.wins+t.losses)>0);
   const bestType = types.length ? [...types].sort((a,b)=>(b.pct-a.pct)||(b.wins-a.wins))[0] : null;
   const ls = (s.byType||{}).longshot;
   const streak = s.currentStreak||{count:0,type:"W"};
   const SURF = {background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:14};
   return (
   <div style={{padding:"4px 16px 0"}}>
     <div style={{...SURF,padding:"14px",marginBottom:10,boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}>
       <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:10}}>Career</div>
       <div style={{display:"flex",gap:8}}>
         {[{l:"Record",v:`${s.wins||0}-${s.losses||0}`,c:IOS.blue},{l:"Win %",v:s.winRate||"0%",c:IOS.green,tick:parseInt(s.winRate)||0,suffix:"%"},{l:"Total Pts",v:(s.points||0),c:"#fff",tick:(s.points||0),dec:1}].map((tile,i)=>(
           <div key={i} style={{flex:1,background:"rgba(0,0,0,0.3)",borderRadius:9,padding:"10px 6px",textAlign:"center"}}>
             <div style={{fontSize:18,fontWeight:800,color:tile.c,letterSpacing:"-0.5px"}}>{tile.tick!==undefined?<Ticker value={tile.tick} decimals={tile.dec||0} suffix={tile.suffix||""}/>:tile.v}</div>
             <div style={{fontSize:8.5,color:IOS.label3,textTransform:"uppercase",letterSpacing:".4px",marginTop:2}}>{tile.l}</div>
           </div>
         ))}
       </div>
     </div>
     <div style={{display:"flex",gap:8,marginBottom:10}}>
       <div style={{flex:1,...SURF,padding:"12px 14px"}}>
         <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Best Bet Type</div>
         <div style={{fontSize:15,fontWeight:800,color:bestType?bestType.color:"#fff"}}>{bestType?bestType.label:"—"}</div>
         <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>{bestType?`${bestType.pct}% · ${bestType.wins}-${bestType.losses}`:"No graded picks yet"}</div>
       </div>
       <div style={{flex:1,...SURF,padding:"12px 14px"}}>
         <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Longshot Hit Rate</div>
         <div style={{fontSize:15,fontWeight:800,color:IOS.pink}}>{ls?`${ls.pct}%`:"—"}</div>
         <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>{ls?`${ls.wins}-${ls.losses} longshots`:"No longshots yet"}</div>
       </div>
     </div>
     <div style={{display:"flex",gap:8,marginBottom:10}}>
       <div style={{flex:1,...SURF,padding:"12px 14px"}}>
         <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Current Streak</div>
         <div style={{fontSize:15,fontWeight:800,color:streak.type==="W"?IOS.green:IOS.red}}>{streak.count>0?`${streak.count}${streak.type}`:"—"}</div>
         <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>{s.total||0} total picks</div>
       </div>
       <div style={{flex:1,...SURF,padding:"12px 14px"}}>
         <div style={{fontSize:9,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Best Pick</div>
         <div style={{fontSize:13,fontWeight:700,color:IOS.green,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.bestBet?.pick_name||"—"}</div>
         <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>{s.bestBet?`+${parseFloat(s.bestBet.points_earned||0).toFixed(1)} pts`:"—"}</div>
       </div>
     </div>
   </div>
   );
 })()}
 <div onClick={()=>setScreen("analytics")} style={{margin:"0 16px",background:isPro?"rgba(10,132,255,0.1)":"rgba(191,90,242,0.08)",border:`0.5px solid ${isPro?"rgba(10,132,255,0.3)":"rgba(191,90,242,0.3)"}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
   <div>
     <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>Full Analytics</div>
     <div style={{fontSize:11,color:IOS.label3}}>{isPro?"Bet types, sports, longshot, season recap":"5 analytics tabs — unlock with Pro"}</div>
   </div>
   <div style={{display:"flex",alignItems:"center",gap:6}}>
     {!isPro&&<div style={{background:"rgba(191,90,242,0.15)",border:"0.5px solid rgba(191,90,242,0.3)",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700,color:"#BF5AF2"}}>PRO</div>}
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
   </div>
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
 <div className="trophy-holder" style={{color:t.yours?t.color:IOS.label3}}>{t.holder==="???"?"Awarded at season end":t.yours?" Currently yours":`Held by ${t.holder}`}</div>
 </div>
 {t.yours&&<div className="trophy-mine-pill">YOURS</div>}
 </div>
 ))}
 </div>
 )}

 {profTab==="power-ups"&&(
 <div style={{paddingBottom:24}}>
 {!isPro && (
   <div style={{margin:"16px 16px 0",background:"#0A0A0A",border:"0.5px solid #1E1E1E",borderRadius:14,padding:"24px 20px",textAlign:"center"}}>
     <div style={{width:48,height:48,borderRadius:12,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
     </div>
     <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>Power-ups are a Pro feature</div>
     <div style={{fontSize:13,color:"#666",marginBottom:16,lineHeight:1.5}}>Upgrade to Commish Pro to unlock Double Down, Spread Enhancer, Insurance, and more.</div>
     <button onClick={()=>setShowPaywall("powerups")} style={{background:IOS.blue,color:"#fff",border:"none",borderRadius:8,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
       Unlock Power-ups
     </button>
   </div>
 )}
 {isPro&&(
 <>
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
 <span style={{fontSize:14}}></span>
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
 ? <button onClick={()=>setShowWheel(true)} style={{background:`linear-gradient(135deg,${IOS.indigo},${IOS.purple})`,border:"none",borderRadius:10,padding:"8px 16px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
 Spin Wheel
 <span style={{background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:800}}>{displaySpins}</span>
 </button>
 : <button disabled style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 16px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.25)",cursor:"not-allowed",display:"flex",alignItems:"center",gap:8}}>
 Spin Wheel
 <span style={{background:"rgba(255,255,255,0.08)",borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.25)"}}>{displaySpins}</span>
 </button>
 }
 </div>
 {displayPUs.length===0
 ? <div style={{margin:"0 16px",background:IOS.bg2,borderRadius:14,padding:24,textAlign:"center",color:IOS.label3,fontSize:15}}>No power-ups yet. Win a week to spin.</div>
 : displayPUs.map((pu,i)=>(
 <div key={i} className="pu-card" style={{borderWidth:1,borderStyle:"solid",borderColor:`${pu.color}30`}}>
 <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:pu.color}}/>
 <div className="pu-card-icon" style={{background:`${pu.color}15`}}>{puSVG(pu.id,pu.color)}</div>
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
 <div style={{width:38,height:38,borderRadius:10,background:`${pu.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{puSVG(pu.id,pu.color)}</div>
 <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2}}>{pu.name}</div><div style={{fontSize:12,color:IOS.label3}}>{pu.desc}</div></div>
 <div style={{fontSize:10,fontWeight:700,color:rarityColor(pu.rarity),background:`${rarityColor(pu.rarity)}15`,border:`1px solid ${rarityColor(pu.rarity)}30`,padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{pu.rarity}</div>
 </div>
 ))}
 </>
 )}
 </div>
 )}

 {/* Notification Preferences */}
 <div style={{margin:"0 16px 12px"}}>
 <div style={{fontSize:11,fontWeight:700,color:IOS.label3,letterSpacing:1,textTransform:"uppercase",marginBottom:8,paddingLeft:4}}>Notifications</div>
 <div style={{background:"linear-gradient(160deg,#141418,#0B0B0E 80%)",borderRadius:14,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.08)"}}>
 {[
 {key:"notif_results", label:"Weekly Results", sub:"When your week is graded", emblem:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>'},
 {key:"notif_grades", label:"Picks Graded", sub:"When a pick result comes in", emblem:'<polyline points="20 6 9 17 4 12"/>'},
 {key:"notif_reminder", label:"Pick Reminder", sub:"Reminder before slip locks", emblem:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'},
 {key:"notif_league", label:"League Activity", sub:"New members, chat messages", emblem:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 0 1 10 0v2"/><circle cx="17" cy="9" r="2.5"/>'},
 {key:"notif_plok", label:"Plok's Calls", sub:"When Plok finds a high-value bet", emblem:'<polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9"/>'},
 ].map((pref,i,arr)=>{
 const val = userProfile?.[pref.key] !== false; // default true
 return (
 <div key={pref.key} style={{display:"flex",alignItems:"center",padding:"13px 16px",borderBottom:i<arr.length-1?`0.5px solid ${IOS.sep}`:"none"}}>
 <div style={{width:36,height:36,borderRadius:10,background:"rgba(10,132,255,0.14)",display:"flex",alignItems:"center",justifyContent:"center",marginRight:12,flexShrink:0}}>
 <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:pref.emblem}}/>
 </div>
 <div style={{flex:1}}>
 <div style={{fontSize:14.5,fontWeight:800,color:"#fff"}}>{pref.label}</div>
 <div style={{fontSize:11.5,color:IOS.label3,marginTop:1}}>{pref.sub}</div>
 </div>
 <div className={"nt-tg"+(val?" on":"")} onClick={async()=>{
 const newVal = !val;
 setUserProfile(prev=>({...prev,[pref.key]:newVal}));
 try{ if(navigator.vibrate) navigator.vibrate(newVal?12:8); }catch(e){}
 await supabase.from("users").update({[pref.key]:newVal}).eq("id",user.id);
 }}>
 <div className="nt-fill"/>
 <div className="nt-knob">
 <svg className="lk-on" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
 <svg className="lk-off" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1.5"/></svg>
 </div>
 </div>
 </div>
 );
 })}
 {/* Master push toggle */}
 <div style={{display:"flex",alignItems:"center",padding:"13px 16px",borderTop:`1px solid ${IOS.sep}`,background:"rgba(255,255,255,0.03)"}}>
 <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",marginRight:12,flexShrink:0}}>
 <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
 </div>
 <div style={{flex:1}}>
 <div style={{fontSize:14.5,fontWeight:800,color:"#fff"}}>Push Notifications</div>
 <div style={{fontSize:11.5,color:IOS.orange,marginTop:1}}>Coming soon — iOS App Store</div>
 </div>
 <div className="nt-tg" style={{opacity:0.4,pointerEvents:"none"}}>
 <div className="nt-fill"/>
 <div className="nt-knob">
 <svg className="lk-off" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1.5"/></svg>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* How to Play */}
 <div style={{padding:"0 16px 4px"}}>
 <button onClick={()=>setTutorialStep(0)} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.7)",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
 How to Play
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
 setFlexPicks(freshSlots());
 setScreen("home");
 }} style={{width:"100%",background:"rgba(255,59,48,0.1)",border:"1px solid rgba(255,59,48,0.2)",borderRadius:12,padding:"14px",fontSize:15,fontWeight:600,color:IOS.red,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
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
 setFlexPicks(freshSlots());
 setScreen("home");
 alert("Your account has been deleted.");
 }} style={{width:"100%",background:"transparent",border:"none",borderRadius:12,padding:"10px",fontSize:13,fontWeight:600,color:"rgba(255,59,48,0.5)",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
 Delete Account
 </button>
 </div>

 </div>
 </>
 )}

 {/* ══ WEEKLY RECAP ══ */}
      {weekResult && <WeeklyRecap data={weekResult} picks={recapPicks} standings={realStandings} league={activeLeague} stats={allMyStats} IOS={IOS} user={user} onClose={()=>setWeekResult(null)}/>}
      {leagueRecap && <LeagueWeekRecap data={leagueRecap} IOS={IOS} onClose={()=>setLeagueRecap(null)}/>}

      {/* ══ GAME DETAIL SHEET ══ */}
 {gameSheet && (
 <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setGameSheet(null)}>
 <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
 <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#1C1C1E",borderRadius:"24px 24px 0 0",maxHeight:"85vh",overflowY:"auto",paddingBottom:40}}>
 {/* Close — always visible, clears the notch */}
 <div onClick={()=>setGameSheet(null)} style={{position:"absolute",top:12,right:14,zIndex:20,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.14)",border:"0.5px solid rgba(255,255,255,0.16)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
 </div>
 {/* Handle */}
 <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}>
 <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)"}}/>
 </div>

 {(()=>{
 const eg=gameSheet.espnGame; const tg=gameSheet.tickerGame||{}; const det=gameSheet.detail||{};
 const T0=det.teams&&det.teams[0]; const T1=det.teams&&det.teams[1];
 const away=eg?.awayTeam||tg.away||(T0&&T0.abbrev)||"Away";
 const home=eg?.homeTeam||tg.home||(T1&&T1.abbrev)||"Home";
 const awayAbbr=(T0&&T0.abbrev)||String(away).slice(0,3).toUpperCase();
 const homeAbbr=(T1&&T1.abbrev)||String(home).slice(0,3).toUpperCase();
 const awayNick=String(away).split(" ").pop(); const homeNick=String(home).split(" ").pop();
 const awayRec=eg?.awayRecord||(T0&&T0.record)||""; const homeRec=eg?.homeRecord||(T1&&T1.record)||"";
 const awaySt=((T0&&T0.standing)||"").replace(" in "," "); const homeSt=((T1&&T1.standing)||"").replace(" in "," ");
 const awayLogo=eg?.awayLogo; const homeLogo=eg?.homeLogo;
 const awayColor=(T0&&T0.color)||IOS.blue; const homeColor=(T1&&T1.color)||IOS.orange;
 const AC=IOS.red; const HC=IOS.green;
 const venue=det.venue||""; const tv=det.broadcast||""; const wx=det.weather||null;
 const gid=eg&&eg.id; const read=(gid&&gameRead[gid])||null;
 const tint=(c,a)=>{ try{ let h=String(c||"").replace("#",""); if(h.length===3) h=h.split("").map(x=>x+x).join(""); if(h.length!==6) return "rgba(255,255,255,"+a+")"; return "rgba("+parseInt(h.slice(0,2),16)+","+parseInt(h.slice(2,4),16)+","+parseInt(h.slice(4,6),16)+","+a+")"; }catch(e){ return "rgba(255,255,255,"+a+")"; } };
 const gameTime=(()=>{ if(!tg.time) return ""; const d=new Date(tg.time); if(isNaN(d.getTime())) return tg.time||""; return d.toLocaleDateString([],{weekday:"short"})+" "+d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit",timeZoneName:"short"}); })();
 const odds=gameSheet.odds||det.odds||{};
 const impl=(o)=>{ const n=parseFloat(String(o==null?"":o).replace("+","")); if(isNaN(n)) return null; return n>0?100/(n+100):(-n)/((-n)+100); };
 const pa=impl(odds.ml&&odds.ml[0]&&odds.ml[0].odds); const ph=impl(odds.ml&&odds.ml[1]&&odds.ml[1].odds);
 const probAway=(pa!=null&&ph!=null)?Math.round(pa/(pa+ph)*100):null; const probHome=probAway!=null?100-probAway:null;
 const ss0=(T0&&T0.seasonStats)||[]; const ss1=(T1&&T1.seasonStats)||[];
 const fbData=(read&&read.data)||null;
 const mu=(fbData&&fbData.matchup&&fbData.matchup.away&&fbData.matchup.home)?fbData.matchup:null;
 const tapeRows=mu ? [{k:"Record",a:mu.away.overall,h:mu.home.overall,bar:false},{k:"Home",a:mu.away.home,h:mu.home.home,bar:false},{k:"Road",a:mu.away.away,h:mu.home.away,bar:false},{k:(mu.scoredLabel||"Scored / Game"),a:mu.away.scored,h:mu.home.scored,bar:true},{k:(mu.allowedLabel||"Allowed / Game"),a:mu.away.allowed,h:mu.home.allowed,bar:true},{k:"Streak",a:mu.away.streak,h:mu.home.streak,bar:false}].filter(r=>(r.a!=null&&r.a!=="")||(r.h!=null&&r.h!=="")) : ss0.map((st,i)=>({k:st.label,a:st.value,h:(ss1[i]&&ss1[i].value)||"",bar:true}));
 const leaders=det.statLeaders||[]; const injuries=det.injuries||[];
 const normForm=(arr)=>(arr||[]).slice(0,5).map(x=> typeof x==="string"?{r:x}:(x||{}));
 const form0=normForm((T0&&T0.form)||(det.form&&det.form.away)); const form1=normForm((T1&&T1.form)||(det.form&&det.form.home));
 const h2h=det.h2h||det.seasonSeries||[]; const h2hSummary=det.h2hSummary||"";
 const injAway=injuries.filter(p=>{ const t=(p.team||"").toUpperCase(); return t.includes(String(awayAbbr).toUpperCase())||t.includes(String(away).toUpperCase().split(" ").pop()); });
 const injHome=injuries.filter(p=>injAway.indexOf(p)===-1);
 const injTag=(st)=>{ const x=(st||"").toLowerCase(); const out=x.includes("out")||x.includes("ir")||x.includes("reserve"); const q=x.includes("quest")||x.includes("doubt"); return {bg:out?"rgba(255,69,58,0.16)":q?"rgba(255,159,10,0.16)":"rgba(48,209,88,0.14)",col:out?IOS.red:q?IOS.orange:IOS.green}; };
 const Logo=({src,abbr,color})=> src
 ? <img src={src} style={{width:58,height:58,objectFit:"contain",margin:"0 auto 9px",display:"block",filter:"drop-shadow(0 8px 18px rgba(0,0,0,0.6))"}} onError={e=>{e.target.style.display="none";}}/>
 : <div style={{width:58,height:58,borderRadius:16,margin:"0 auto 9px",background:tint(color,0.9),display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:22,color:"#fff"}}>{abbr}</div>;
 const InjCol=({list,color,abbr})=> (
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:10,fontWeight:800,letterSpacing:0.6,textTransform:"uppercase",color:color,marginBottom:7,textAlign:"center"}}>{abbr}</div>
 {list.length===0 ? <div style={{fontSize:11,color:IOS.label3,textAlign:"center",padding:"10px 0"}}>No injuries</div>
 : list.map((p,pi)=>{ const tg2=injTag(p.status); return (
 <div key={pi} style={{padding:"8px 6px",borderTop:pi>0?"0.5px solid rgba(255,255,255,0.05)":"none",textAlign:"center"}}>
 <div style={{fontSize:12.5,fontWeight:700,color:"#fff",lineHeight:1.15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
 {p.detail && <div style={{fontSize:10,color:IOS.label3,marginTop:1}}>{p.detail}</div>}
 <div style={{display:"inline-block",marginTop:5,fontSize:9,fontWeight:800,letterSpacing:0.3,textTransform:"uppercase",padding:"3px 7px",borderRadius:6,background:tg2.bg,color:tg2.col}}>{p.status}</div>
 </div>
 ); })}
 </div>
 );
 return (
 <div>
 {/* Tale of the Tape hero */}
 <div style={{position:"relative",padding:"2px 16px 18px",overflow:"hidden"}}>
 <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,"+tint(AC,0.30)+" 0%,transparent 40%,transparent 60%,"+tint(HC,0.30)+" 100%)"}}/>
 <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 35%,#1C1C1E 100%)"}}/>
 <div style={{position:"relative",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
 <div style={{flex:1,textAlign:"center"}}>
 <div style={{width:64,height:64,borderRadius:18,margin:"0 auto 10px",background:awayColor,border:"1px solid rgba(255,255,255,0.14)",boxShadow:"0 8px 20px -6px rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:21,color:"#fff",letterSpacing:0.5}}>{awayAbbr}</div>
 <div style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:23,letterSpacing:0.3,lineHeight:0.95,color:"#fff",textTransform:"uppercase"}}>{awayNick}</div>
 {(awayRec||awaySt) && <div style={{fontSize:11,fontWeight:700,color:IOS.label2,marginTop:3}}>{[awayRec,awaySt].filter(Boolean).join(" · ")}</div>}
 </div>
 <div style={{textAlign:"center",paddingTop:20}}>
 <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:15,color:IOS.label3}}>{tg.isLive?"":"AT"}</div>
 {tg.isLive && <div style={{fontSize:11,fontWeight:800,color:IOS.green}}>\u25cf LIVE</div>}
 </div>
 <div style={{flex:1,textAlign:"center"}}>
 <div style={{width:64,height:64,borderRadius:18,margin:"0 auto 10px",background:homeColor,border:"1px solid rgba(255,255,255,0.14)",boxShadow:"0 8px 20px -6px rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:21,color:"#fff",letterSpacing:0.5}}>{homeAbbr}</div>
 <div style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:23,letterSpacing:0.3,lineHeight:0.95,color:"#fff",textTransform:"uppercase"}}>{homeNick}</div>
 {(homeRec||homeSt) && <div style={{fontSize:11,fontWeight:700,color:IOS.label2,marginTop:3}}>{[homeRec,homeSt].filter(Boolean).join(" · ")}</div>}
 </div>
 </div>
 {(gameTime||venue||tv) && <div style={{position:"relative",textAlign:"center",marginTop:15,fontSize:12.5,fontWeight:700,color:"#fff"}}>{[gameTime,venue,tv].filter(Boolean).join("  ·  ")}</div>}
 {wx && (wx.temp!=null||wx.summary) && <div style={{position:"relative",textAlign:"center",marginTop:5,fontSize:11.5,fontWeight:600,color:IOS.label2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={IOS.label2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>{[wx.temp!=null?(wx.temp+"°F"):"",wx.summary].filter(Boolean).join(" · ")}</div>}
 </div>

 <div style={{padding:"0 16px"}}>
 {/* Plok read + matchup data (auto-loaded once per game for Pro, cached) */}
 {(read && (read.loading || (read.data && read.data.summary))) ? (
 <div onClick={()=>{ if(read.loading) return; setGameSheet(null); askFindBet({sport:(activeLeague&&activeLeague.sport)||"nfl", game:away+" @ "+home}); }} style={{background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.08))",border:"0.5px solid rgba(10,132,255,0.34)",borderRadius:16,padding:"13px 15px",marginBottom:2,cursor:"pointer"}}>
 <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:read.loading?6:8}}>
 <div style={{width:28,height:28,borderRadius:9,background:"rgba(10,132,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg></div>
 <span style={{fontSize:11,fontWeight:800,letterSpacing:1.4,textTransform:"uppercase",color:IOS.blue}}>Plok Read</span>
 </div>
 {read.loading
 ? <div style={{display:"flex",gap:5,alignItems:"center",height:16,paddingLeft:2}}><span className="ai-dot"/><span className="ai-dot" style={{animationDelay:"0.15s"}}/><span className="ai-dot" style={{animationDelay:"0.3s"}}/></div>
 : <div><div style={{fontSize:13.5,lineHeight:1.5,color:"rgba(255,255,255,0.88)"}}>{read.data.summary}</div><div style={{fontSize:11,fontWeight:700,color:IOS.blue,marginTop:9}}>See full breakdown ›</div></div>}
 </div>
 ) : (
 <div onClick={()=>{ if(!isPro){ setShowPaywall("ai"); return; } if(read&&read.loading) return; const sp=(activeLeague&&activeLeague.sport)||"nfl"; setGameRead(prev=>({...prev,[gid]:{loading:true}})); fetch("/api/findbet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sport:sp,game:away+" @ "+home,userId:user&&user.id})}).then(async r=>{ const d=await r.json().catch(()=>null); setGameRead(prev=>({...prev,[gid]: (r.ok&&d)?{data:d}:{error:true}})); }).catch(()=> setGameRead(prev=>({...prev,[gid]:{error:true}}))); }} style={{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,rgba(10,132,255,0.16),rgba(94,92,230,0.10))",border:"0.5px solid rgba(10,132,255,0.35)",borderRadius:16,padding:"13px 15px",marginBottom:2,cursor:"pointer"}}>
 <div style={{width:36,height:36,borderRadius:11,background:"rgba(10,132,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="19" height="19" viewBox="0 0 24 24" fill={IOS.blue}><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z"/></svg></div>
 <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{read&&read.error?"Read unavailable — tap to retry":"Get Plok's read on this matchup"}</div><div style={{fontSize:11.5,color:IOS.label2,marginTop:1}}>Data-backed matchup read{isPro?"":" · Pro"}</div></div>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={IOS.label3} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
 </div>
 )}

 {tapeRows.length>0 && (<>
 <div style={{display:"flex",alignItems:"center",gap:12,margin:"22px 4px 12px"}}><span style={{fontSize:11,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:IOS.label3}}>The Tape</span><div style={{flex:1,height:1,background:"rgba(255,255,255,0.09)"}}/></div>
 <div style={{background:"#2C2C2E",border:"0.5px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"4px 14px"}}>
 {tapeRows.map((row,i)=>{ const v0=(row.a==null||row.a==="")?"—":String(row.a), v1=(row.h==null||row.h==="")?"—":String(row.h); const n0=parseFloat(v0), n1=parseFloat(v1); const showBar=row.bar && !isNaN(n0) && !isNaN(n1); const a=isNaN(n0)?0:n0, b=isNaN(n1)?0:n1; const sum=(a+b)||1; const w0=Math.max(4,Math.round(a/sum*100)), w1=Math.max(4,Math.round(b/sum*100)); return (
 <div key={i} style={{padding:"11px 0",borderBottom:i<tapeRows.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:showBar?7:0}}>
 <span style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:15,color:AC,minWidth:52,textAlign:"left"}}>{v0}</span>
 <span style={{fontSize:9.5,fontWeight:800,letterSpacing:1,textTransform:"uppercase",color:IOS.label3,textAlign:"center",flex:1,padding:"0 8px"}}>{row.k}</span>
 <span style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:15,color:HC,minWidth:52,textAlign:"right"}}>{v1}</span>
 </div>
 {showBar && <div style={{display:"flex",height:7,borderRadius:4,overflow:"hidden",background:"rgba(255,255,255,0.05)",gap:2}}>
 <div style={{width:w0+"%",background:AC,borderRadius:"4px 0 0 4px"}}/>
 <div style={{width:w1+"%",background:HC,borderRadius:"0 4px 4px 0",marginLeft:"auto"}}/>
 </div>}
 </div>
 ); })}
 </div>
 </>)}

 {/* Form · Last 5 */}
 {(form0.length>0||form1.length>0) && (<>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:IOS.label3,margin:"20px 4px 10px"}}>Form · Last 5</div>
 <div style={{background:"#2C2C2E",border:"0.5px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"8px 14px"}}>
 {[{abbr:awayAbbr,color:awayColor,f:form0},{abbr:homeAbbr,color:homeColor,f:form1}].map((t,ti)=>(
 <div key={ti} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderTop:ti>0?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
 <div style={{width:38,fontFamily:"'Barlow Semi Condensed',sans-serif",fontSize:14,fontWeight:800,color:t.color,flexShrink:0}}>{t.abbr}</div>
 <div style={{display:"flex",gap:5,flex:1,flexWrap:"wrap"}}>
 {t.f.length===0 ? <span style={{fontSize:11,color:IOS.label3}}>No recent games</span> : t.f.map((g,gi)=>{ const r=String(g.r||"").toUpperCase(); const win=r==="W"; const loss=r==="L"; return (
 <div key={gi} title={g.opp?(((g.home?"vs ":"@ ")+g.opp)+(g.score?(" "+g.score):"")):""} style={{width:22,height:22,borderRadius:7,background:win?"rgba(48,209,88,0.16)":loss?"rgba(255,69,58,0.16)":"rgba(255,255,255,0.08)",color:win?IOS.green:loss?IOS.red:IOS.label3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{r||"·"}</div>
 ); })}
 </div>
 </div>
 ))}
 </div>
 </>)}

 {/* Head to Head */}
 {(h2h.length>0||h2hSummary) && (<>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:IOS.label3,margin:"20px 4px 10px"}}>Head to Head</div>
 <div style={{background:"#2C2C2E",border:"0.5px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"4px 14px"}}>
 {h2hSummary && <div style={{fontSize:11.5,color:IOS.label2,fontWeight:700,padding:"9px 0 7px",textAlign:"center"}}>{h2hSummary}</div>}
 {h2h.slice(0,4).map((m,mi)=>{ const as=parseFloat(m.as), hs=parseFloat(m.hs); const aWon=!isNaN(as)&&!isNaN(hs)&&as>hs; const hWon=!isNaN(as)&&!isNaN(hs)&&hs>as; return (
 <div key={mi} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderTop:(mi>0||h2hSummary)?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
 <div style={{fontSize:11,color:IOS.label3,width:54,flexShrink:0}}>{m.date||""}</div>
 <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'Barlow Semi Condensed',sans-serif",fontSize:14,fontWeight:700}}>
 <span style={{color:aWon?"#fff":IOS.label3,fontWeight:aWon?800:700}}>{m.a||awayAbbr} {!isNaN(as)?as:""}</span>
 <span style={{color:IOS.label3,fontSize:10}}>—</span>
 <span style={{color:hWon?"#fff":IOS.label3,fontWeight:hWon?800:700}}>{!isNaN(hs)?hs:""} {m.h||homeAbbr}</span>
 </div>
 </div>
 ); })}
 </div>
 </>)}

 {((odds.ml&&odds.ml.length>0)||(odds.spread&&odds.spread.length>0)||(odds.ou&&odds.ou.length>0)) && (<>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:IOS.label3,margin:"20px 4px 10px"}}>DraftKings Odds</div>
 <div style={{background:"#2C2C2E",border:"0.5px solid rgba(255,255,255,0.06)",borderRadius:16,overflow:"hidden",display:"flex"}}>
 {[{label:"Moneyline",items:(odds.ml||[]).slice(0,2)},{label:"Spread",items:(odds.spread||[]).slice(0,2)},{label:"Total",items:(odds.ou||[]).slice(0,2)}].map((col,ci)=>(
 <div key={ci} style={{flex:1,borderRight:ci<2?"0.5px solid rgba(255,255,255,0.06)":"none"}}>
 <div style={{fontSize:9.5,fontWeight:800,color:IOS.label3,textAlign:"center",padding:"9px 4px 5px",letterSpacing:0.5,textTransform:"uppercase"}}>{col.label}</div>
 {col.items.map((it,ii)=>(
 <div key={ii} style={{textAlign:"center",padding:"3px 4px 9px"}}>
 <div style={{fontSize:10.5,color:IOS.label2,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",padding:"0 4px"}}>{it.pick}</div>
 <div style={{fontFamily:"'Barlow Semi Condensed',sans-serif",fontWeight:800,fontSize:14,color:(it.odds||"").startsWith("+")?IOS.green:IOS.blue}}>{it.odds}</div>
 </div>
 ))}
 </div>
 ))}
 </div>
 </>)}


 {injuries.length>0 && (<>
 <div style={{fontSize:10.5,fontWeight:800,letterSpacing:1.8,textTransform:"uppercase",color:IOS.label3,margin:"20px 4px 10px"}}>Injury Report</div>
 <div style={{background:"#2C2C2E",border:"0.5px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"12px 8px",display:"flex",gap:4,marginBottom:8}}>
 <InjCol list={injAway} color={awayColor} abbr={awayAbbr}/>
 <div style={{width:"0.5px",background:"rgba(255,255,255,0.08)",alignSelf:"stretch"}}/>
 <InjCol list={injHome} color={homeColor} abbr={homeAbbr}/>
 </div>
 </>)}

 {gameLoading && <div style={{textAlign:"center",padding:"24px",color:IOS.label3,fontSize:13}}>Loading stats\u2026</div>}
 {!gameLoading && !det.teams && !eg && <div style={{textAlign:"center",padding:"16px 8px 8px",color:IOS.label3,fontSize:13,lineHeight:1.6}}>Detailed stats not available yet \u2014 check back closer to game time.</div>}
 </div>

 {/* Footer CTA */}
 <div style={{padding:"16px 16px calc(20px + env(safe-area-inset-bottom))"}}>
 <div onClick={()=>{ setGameSheet(null); setScreen("picks"); }} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"linear-gradient(135deg,"+IOS.blue+",#5e5ce6)",borderRadius:14,padding:14,fontWeight:800,fontSize:15,color:"#fff",cursor:"pointer",boxShadow:"0 10px 26px -8px rgba(10,132,255,0.6)"}}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> Add a pick from this game
 </div>
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 {/* ══ SOLO SPORT PICKER ══ */}
 {showSoloSportPicker && (
 <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setShowSoloSportPicker(false)}>
   <div style={{background:"#111",borderRadius:"20px 20px 0 0",padding:"0 0 40px",border:"0.5px solid #1E1E1E"}} onClick={e=>e.stopPropagation()}>
     <div style={{width:36,height:4,background:"#2A2A2A",borderRadius:2,margin:"12px auto 16px"}}/>
     <div style={{padding:"0 20px 20px"}}>
       <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:"#fff",marginBottom:4}}>Pick a Sport</div>
       <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:24}}>Your whole slip will be this sport. Upgrade to Pro for multi-sport slips.</div>
       {[
         {id:"nfl", label:"NFL", sub:"Football", color:"#0A84FF", icon:(
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" strokeWidth="1.8"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="7.5" x2="8" y2="16.5" stroke="currentColor" strokeWidth="1.2"/><line x1="16" y1="7.5" x2="16" y2="16.5" stroke="currentColor" strokeWidth="1.2"/></svg>
         )},
         {id:"nba", label:"NBA", sub:"Basketball", color:"#FF6B35", icon:(
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><line x1="3.5" y1="8.5" x2="20.5" y2="8.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3.5" y1="15.5" x2="20.5" y2="15.5" stroke="currentColor" strokeWidth="1.2"/><path d="M12 3 Q16 8 16 12 Q16 16 12 21" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M12 3 Q8 8 8 12 Q8 16 12 21" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
         )},
         {id:"mlb", label:"MLB", sub:"Baseball", color:"#30D158", icon:(
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M7 5.5 Q10 12 7 18.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M17 5.5 Q14 12 17 18.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
         )},
       ].map(s=>(
         <div key={s.id} onClick={async()=>{
           setSoloSportPersist(s.id);
           setShowSoloSportPicker(false);
           setIsSoloMode(true);
           const lgId = await getOrCreateSoloLeague();
           setActiveLeagueId(lgId||"solo");
           // Fetch odds for selected sport
           fetchLiveOdds(s.id);
           setScreen("picks");
         }} style={{display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10,background:"#1A1A1A",borderRadius:14,cursor:"pointer",border:`1px solid ${soloSport===s.id?s.color+"60":"rgba(255,255,255,0.06)"}`}}>
           <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",color:s.color,flexShrink:0}}>{s.icon}</div>
           <div style={{flex:1}}>
             <div style={{fontSize:17,fontWeight:700,color:"#fff"}}>{s.label}</div>
             <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:1}}>{s.sub}</div>
           </div>
           <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${soloSport===s.id?s.color:"rgba(255,255,255,0.15)"}`,background:soloSport===s.id?s.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
             {soloSport===s.id && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
           </div>
         </div>
       ))}
       {/* Pro upsell */}
       <div onClick={()=>{setShowSoloSportPicker(false);setShowPaywall("solo_sport");}} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:"rgba(191,90,242,0.08)",border:"1px solid rgba(191,90,242,0.25)",borderRadius:14,cursor:"pointer",marginTop:4}}>
         <div style={{width:44,height:44,borderRadius:12,background:"rgba(191,90,242,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6L3 8h6l3-6z" stroke="#BF5AF2" strokeWidth="1.8" strokeLinejoin="round"/></svg>
         </div>
         <div style={{flex:1}}>
           <div style={{fontSize:14,fontWeight:700,color:"#BF5AF2"}}>Multi-Sport Slips</div>
           <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Mix NFL, NBA & MLB picks in one slip</div>
         </div>
         <div style={{fontSize:11,fontWeight:700,color:"#BF5AF2",background:"rgba(191,90,242,0.15)",borderRadius:6,padding:"3px 8px",flexShrink:0}}>Pro</div>
       </div>
     </div>
   </div>
 </div>
 )}

 {/* ══ PAST MATCHUP HISTORY (global overlay) ══ */}
 {selectedMatchup && (()=>{
 const m = liveSchedule.find(x=>x.week===selectedMatchup);
 if(!m) return null;
 // Map liveSchedule format to what the overlay expects
 const mDisplay = {
 week: m.week, opp: m.opp,
 result: m.result,
 myPicks: pastMatchupPicks.my,
 oppPicks: pastMatchupPicks.opp,
 };
 const slotColors = {Moneyline:"#3A9EE0", Prop:"#3A9EE0", "Over/Under":"#3A9EE0", Spread:"#3A9EE0", Parlay:"#3A9EE0"};
 const myTotal = m.myPts || 0;
 const oppTotal = m.oppPts || 0;
 return (
 <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#111",zIndex:500,overflowY:"auto",paddingBottom:100,WebkitOverflowScrolling:"touch"}}>
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
 <div style={{fontSize:16,fontWeight:800,letterSpacing:-0.3,color:IOS.blue}}>You</div>
 <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {mDisplay.week}</div>
 </div>
 <div style={{textAlign:"center"}}>
 <div style={{fontSize:24,fontWeight:800,letterSpacing:-0.5,color:m.result==="W"?IOS.green:IOS.red}}>{m.myPts} <span style={{fontSize:14,color:IOS.label3,fontWeight:400}}>–</span> {m.oppPts}</div>
 <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:mDisplay.result==="W"?IOS.green:IOS.red,marginTop:2}}>{mDisplay.result==="W"?"Victory":"Defeat"}</div>
 <div style={{fontSize:10,color:IOS.label3,marginTop:2}}>pts</div>
 </div>
 <div style={{textAlign:"right"}}>
 <div style={{fontSize:16,fontWeight:800,letterSpacing:-0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{mDisplay.opp}</div>
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
 <div style={{fontSize:11,fontWeight:700,color:IOS.blue}}>You: {m.myPts}pts</div>
 <div style={{fontSize:11,color:IOS.label3}}>{m.opp}: {m.oppPts}pts</div>
 </div>
 </div>

 {pastMatchupLoading && (
 <div style={{textAlign:"center",padding:24,color:IOS.label3,fontSize:13}}>Loading picks...</div>
 )}

 {!pastMatchupLoading && pastMatchupPicks.my.length === 0 && (
 <div style={{textAlign:"center",padding:24,color:IOS.label3,fontSize:13}}>No picks found for this week.</div>
 )}

 {!pastMatchupLoading && pastMatchupPicks.my.map((myP, i) => {
 const oppP = pastMatchupPicks.opp[i];
 const slotLabel = {ml:"Moneyline",prop:"Prop",ou:"Over/Under",spread:"Spread"}[myP.slot] || myP.slot || "Pick";
 const col = {ml:IOS.blue,prop:IOS.yellow,ou:IOS.orange,spread:IOS.green}[myP.slot] || IOS.blue;
 return (
 <div key={i} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}>
 <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",gap:8}}>
 <div style={{fontSize:11,fontWeight:700,color:col,letterSpacing:0.5,textTransform:"uppercase"}}>{myP.multiplier}× · {slotLabel}</div>
 </div>
 <div style={{display:"flex"}}>
 {/* My pick */}
 <div style={{flex:1,padding:"10px 14px",borderRight:`0.5px solid ${IOS.sep}`}}>
 <div style={{fontSize:11,color:IOS.blue,fontWeight:600,marginBottom:4}}>You</div>
 <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>{myP.pick_name}</div>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:12,color:myP.odds?.startsWith("+")?IOS.green:IOS.blue}}>{myP.odds}</div>
 <div style={{fontSize:12,fontWeight:700,color:myP.result==="W"?IOS.green:myP.result==="L"?IOS.red:IOS.label3}}>
 {myP.result==="W"?`+${parseFloat(myP.points_earned||0).toFixed(1)}pts`:myP.result==="L"?"0pts":"—"}
 </div>
 </div>
 </div>
 {/* Opp pick */}
 {oppP && (
 <div style={{flex:1,padding:"10px 14px"}}>
 <div style={{fontSize:11,color:IOS.label3,fontWeight:600,marginBottom:4}}>{m.opp}</div>
 <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>{oppP.pick_name}</div>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{fontSize:12,color:oppP.odds?.startsWith("+")?IOS.green:IOS.blue}}>{oppP.odds}</div>
 <div style={{fontSize:12,fontWeight:700,color:oppP.result==="W"?IOS.green:oppP.result==="L"?IOS.red:IOS.label3}}>
 {oppP.result==="W"?`+${parseFloat(oppP.points_earned||0).toFixed(1)}pts`:oppP.result==="L"?"0pts":"—"}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })}

 </div>
 );
 })()}

 {/* ══ BROWSE PUBLIC LEAGUES SHEET ══ */}
 {showBrowse&&(
 <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9998,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setShowBrowse(false)}>
   <div style={{background:"#111",borderRadius:"20px 20px 0 0",maxHeight:"85vh",display:"flex",flexDirection:"column",border:"0.5px solid #1E1E1E"}} onClick={e=>e.stopPropagation()}>
     <div style={{width:36,height:4,background:"#2A2A2A",borderRadius:2,margin:"12px auto 0"}}/>

     {/* Header */}
     <div style={{padding:"12px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid #1A1A1A",flexShrink:0}}>
       <div style={{fontSize:17,fontWeight:700,color:"#fff"}}>Browse Leagues</div>
       <div onClick={()=>setShowBrowse(false)} style={{fontSize:13,fontWeight:600,color:IOS.blue,cursor:"pointer"}}>Done</div>
     </div>

     {/* Filters */}
     <div style={{padding:"10px 16px 8px",borderBottom:"0.5px solid #1A1A1A",flexShrink:0}}>
       <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
         {/* Sport filter */}
         {[{id:"all",l:"All Sports"},{id:"nfl",l:"NFL"},{id:"nba",l:"NBA"},{id:"mlb",l:"MLB"},{id:"nhl",l:"NHL"}].map(f=>(
           <div key={f.id} onClick={()=>setBrowseFilter(prev=>({...prev,sport:f.id}))}
           style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,
             background:browseFilter.sport===f.id?"rgba(10,132,255,0.15)":"#1A1A1A",
             border:`0.5px solid ${browseFilter.sport===f.id?"rgba(10,132,255,0.4)":"#2A2A2A"}`,
             color:browseFilter.sport===f.id?IOS.blue:"#666"}}>{f.l}</div>
         ))}
       </div>
       <div style={{display:"flex",gap:6,marginTop:6,overflowX:"auto",scrollbarWidth:"none"}}>
         {/* League type filter */}
         {[{id:"all",l:"Any Type"},{id:"h2h",l:"Head-to-head"},{id:"bracket",l:"Tournament"},{id:"points",l:"Total Points"}].map(f=>(
           <div key={f.id} onClick={()=>setBrowseFilter(prev=>({...prev,type:f.id}))}
           style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,
             background:browseFilter.type===f.id?"rgba(10,132,255,0.15)":"#1A1A1A",
             border:`0.5px solid ${browseFilter.type===f.id?"rgba(10,132,255,0.4)":"#2A2A2A"}`,
             color:browseFilter.type===f.id?IOS.blue:"#666"}}>{f.l}</div>
         ))}
       </div>
       <div style={{display:"flex",gap:6,marginTop:6,overflowX:"auto",scrollbarWidth:"none"}}>
         {/* League size filter */}
         {[{id:"all",l:"Any Size"},{id:"small",l:"Small (4-8)"},{id:"medium",l:"Medium (10-12)"},{id:"large",l:"Large (16+)"}].map(f=>(
           <div key={f.id} onClick={()=>setBrowseFilter(prev=>({...prev,size:f.id}))}
           style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,
             background:browseFilter.size===f.id?"rgba(10,132,255,0.15)":"#1A1A1A",
             border:`0.5px solid ${browseFilter.size===f.id?"rgba(10,132,255,0.4)":"#2A2A2A"}`,
             color:browseFilter.size===f.id?IOS.blue:"#666"}}>{f.l}</div>
         ))}
       </div>
     </div>

     {/* League list */}
     <div style={{overflowY:"auto",flex:1,padding:"8px 0 40px"}}>
       {browseLoading ? (
         <div style={{padding:"40px 20px",textAlign:"center",color:"#555",fontSize:14}}>Loading leagues...</div>
       ) : publicLeagues.length===0 ? (
         <div style={{padding:"40px 20px",textAlign:"center"}}>
           <div style={{fontSize:14,color:"#555",marginBottom:8}}>No public leagues available</div>
           <div style={{fontSize:12,color:"#333"}}>Be the first — create a public league</div>
         </div>
       ) : (()=>{
         const filtered = publicLeagues.filter(lg=>{
           if(browseFilter.sport!=="all" && lg.sport!==browseFilter.sport) return false;
           if(browseFilter.type!=="all" && (lg.league_type||"h2h")!==browseFilter.type) return false;
           const sz = lg.target_size||lg.max_members||8;
           if(browseFilter.size==="small" && sz>8) return false;
           if(browseFilter.size==="medium" && (sz<10||sz>12)) return false;
           if(browseFilter.size==="large" && sz<16) return false;
           return true;
         });
         if(!filtered.length) return (
           <div style={{padding:"40px 20px",textAlign:"center"}}>
             <div style={{fontSize:14,color:"#555",marginBottom:8}}>No open leagues found</div>
             <div style={{fontSize:12,color:"#333"}}>Try different filters or create your own</div>
           </div>
         );
         return filtered.map(lg=>{
           const memberCount = lg.memberCount||0;
           const maxSize = lg.target_size||lg.max_members||8;
           const spotsLeft = Math.max(0, maxSize - memberCount);
           const typeLabels = {h2h:"Head-to-head",bracket:"Tournament",points:"Total points"};
           const sport = SPORTS[lg.sport]||{label:lg.sport?.toUpperCase()||"?",color:IOS.blue};
           const isJoining = joiningLeagueId===lg.id;
           return (
             <div key={lg.id} style={{margin:"0 16px 8px",background:"#0D0D0D",borderRadius:12,padding:"13px 14px",border:"0.5px solid #1E1E1E",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
               <div style={{flex:1,minWidth:0}}>
                 <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:3}}>{lg.name}</div>
                 <div style={{fontSize:11,color:"#555",marginBottom:4}}>
                   {sport.label} · {typeLabels[lg.league_type||"h2h"]||"H2H"} · Wk {lg.season_weeks||18} season
                 </div>
                 <div style={{display:"flex",alignItems:"center",gap:8}}>
                   <div style={{fontSize:10,fontWeight:700,color:IOS.green,background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.25)",borderRadius:5,padding:"2px 7px"}}>
                     {spotsLeft} spot{spotsLeft!==1?"s":""} left
                   </div>
                   <div style={{fontSize:10,color:"#444"}}>{memberCount}/{maxSize} members</div>
                 </div>
               </div>
               <button onClick={()=>joinPublicLeague(lg)} disabled={isJoining}
               style={{background:isJoining?"#1A1A1A":IOS.blue,border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,color:isJoining?"#555":"#fff",cursor:isJoining?"default":"pointer",fontFamily:"Barlow,sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>
                 {isJoining?"Joining...":"Join"}
               </button>
             </div>
           );
         });
       })()}
     </div>
   </div>
 </div>
 )}

 {/* ══ PAYWALL SHEET ══ */}
 {showPaywall && (()=>{
   const configs = {
     ai:{icon:"star",title:"Unlock Plok + Pro",sub:"Plok is your AI betting analyst — data-backed reads on every game and prop, a +EV bet finder, and unlimited insights.",features:["Plok AI analyst on every bet & prop","+EV bet finder","Recent form, splits, matchup & injuries","Multi-sport leagues & custom settings"]},
     picks:{icon:"ti-plus",title:"Unlimited picks",sub:"Commish Pro lets you add as many pick slots as you want each week.",features:["Unlimited pick slots per week","Custom multipliers on any slot","NFL, NBA, MLB, NHL","Power-ups and custom bet types"]},
     settings:{icon:"settings",title:"Custom league settings",sub:"Set your own pick counts, multiplier ranges, and allowed bet types.",features:["Custom pick count per week","Custom multiplier ranges","Restrict or expand bet types","Multi-sport leagues"]},
     sport:{icon:"world",title:"Multi-sport leagues",sub:"Run your league across NFL, NBA, MLB, and NHL — all in one place.",features:["NFL, NBA, MLB, NHL support","Custom pick counts and bet types","Custom multiplier ranges","Power-ups for your league"]},
     powerups:{icon:"bolt",title:"Power-ups are a Pro feature",sub:"Double Down, Spread Enhancer, Insurance and more are unlocked with Commish Pro.",features:["All current and future power-ups","Unlimited picks and custom settings","Multi-sport league support"]},
   };
   const cfg = configs[showPaywall]||configs.picks;
   return (
     <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setShowPaywall(null)}>
       <div style={{background:"#111",borderRadius:"20px 20px 0 0",padding:"0 0 40px",border:"0.5px solid #1E1E1E"}} onClick={e=>e.stopPropagation()}>
         <div style={{width:36,height:4,background:"#2A2A2A",borderRadius:2,margin:"12px auto 20px"}}/>
         <div style={{padding:"0 20px"}}>
           <div style={{width:44,height:44,borderRadius:10,background:"rgba(10,132,255,0.12)",border:"0.5px solid rgba(10,132,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
             {cfg.icon==="bolt"&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
             {cfg.icon==="settings"&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
             {cfg.icon==="world"&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
             {!["bolt","settings","world"].includes(cfg.icon)&&<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={IOS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
           </div>
           <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:4}}>{cfg.title}</div>
           <div style={{fontSize:13,color:"#666",marginBottom:16,lineHeight:1.5}}>{cfg.sub}</div>
           {cfg.features.map((f,i)=>(
             <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"0.5px solid #1A1A1A"}}>
               <div style={{width:6,height:6,borderRadius:"50%",background:IOS.blue,flexShrink:0}}/>
               <div style={{fontSize:13,color:"#ccc"}}>{f}</div>
             </div>
           ))}
          <button onClick={()=>{setProStatus(true);setShowPaywall(null);}} style={{display:"block",width:"100%",background:IOS.blue,color:"#fff",border:"none",borderRadius:8,padding:13,fontSize:14,fontWeight:700,textAlign:"center",marginTop:16,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
             Unlock Pro
           </button>
           <button onClick={()=>setShowPaywall(null)} style={{display:"block",width:"100%",background:"none",border:"none",color:"#555",fontSize:12,textAlign:"center",marginTop:10,cursor:"pointer",fontFamily:"Barlow,sans-serif",padding:4}}>
             Not now
           </button>
         </div>
       </div>
     </div>
   );
 })()}

 {/* ══ POST LEAGUE UPSELL ══ */}
 {showPostLeagueUpsell && (
   <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setShowPostLeagueUpsell(false)}>
     <div style={{background:"#111",borderRadius:"20px 20px 0 0",padding:"0 0 40px",border:"0.5px solid #1E1E1E"}} onClick={e=>e.stopPropagation()}>
       <div style={{width:36,height:4,background:"#2A2A2A",borderRadius:2,margin:"12px auto 20px"}}/>
       <div style={{padding:"0 20px"}}>
         <div style={{width:44,height:44,borderRadius:10,background:"rgba(48,209,88,0.12)",border:"0.5px solid rgba(48,209,88,0.25)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
         </div>
         <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:4}}>Your league is live</div>
         <div style={{fontSize:13,color:"#666",marginBottom:16,lineHeight:1.5}}>Want more control over how your league works?</div>
         <div style={{background:"#0A0A0A",border:"0.5px solid #1E1E1E",borderRadius:8,padding:"12px",marginBottom:16}}>
           <div style={{fontSize:10,fontWeight:700,color:IOS.blue,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Commish Pro unlocks</div>
           {["Set custom pick counts per week","Add NBA, MLB, or NHL picks","Unlock power-ups for your league"].map((f,i)=>(
             <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<2?"0.5px solid #1A1A1A":"none"}}>
               <div style={{width:6,height:6,borderRadius:"50%",background:IOS.blue,flexShrink:0}}/>
               <div style={{fontSize:13,color:"#ccc"}}>{f}</div>
             </div>
           ))}
         </div>
         <button onClick={()=>{setProStatus(true);setShowPostLeagueUpsell(false);}} style={{display:"block",width:"100%",background:IOS.blue,color:"#fff",border:"none",borderRadius:8,padding:13,fontSize:14,fontWeight:700,textAlign:"center",marginBottom:10,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
           Upgrade to Commish Pro — $5/mo
         </button>
         <button onClick={()=>setShowPostLeagueUpsell(false)} style={{display:"block",width:"100%",background:"none",border:"none",color:"#555",fontSize:12,textAlign:"center",cursor:"pointer",fontFamily:"Barlow,sans-serif",padding:4}}>
           I'm good with free for now
         </button>
       </div>
     </div>
   </div>
 )}

 {/* ══ TAB BAR ══ */}
 {/* ══ SOLO HISTORY ══ */}
 {screen==="solohistory"&&(
 <div className="body" style={{padding:"0 16px 40px"}}>
 <div style={{padding:"20px 0 14px"}}>
 <div style={{fontSize:24,fontWeight:800,color:"#fff",letterSpacing:-0.5}}>History</div>
 <div style={{fontSize:13,color:IOS.label3,marginTop:2}}>Your solo slate record</div>
 </div>
 {soloWeeks.length===0 ? (
 <div style={{textAlign:"center",padding:"40px 20px",background:IOS.bg2,borderRadius:12,border:"0.5px solid rgba(255,255,255,0.07)"}}>
   <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:6}}>No history yet</div>
   <div style={{fontSize:12,color:IOS.label3}}>Lock in your first solo slip to start building your record.</div>
   <button onClick={()=>setScreen("picks")} style={{marginTop:14,background:IOS.blue,border:"none",borderRadius:8,padding:"10px 24px",fontFamily:"Barlow,sans-serif",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer"}}>Build First Slip</button>
 </div>
 ) : (
 <>
 {/* Summary stats */}
 <div style={{display:"flex",gap:8,marginBottom:16}}>
   {[
     {l:"Record",v:soloWeeks.reduce((s,w)=>s+w.wins,0)+"-"+soloWeeks.reduce((s,w)=>s+w.losses,0),c:IOS.blue},
     {l:"Win %",v:Math.round((soloWeeks.reduce((s,w)=>s+w.wins,0)/(soloWeeks.reduce((s,w)=>s+w.wins+w.losses,0)||1))*100)+"%",c:IOS.green},
     {l:"Total Pts",v:soloWeeks.reduce((s,w)=>s+w.pts,0).toFixed(1),c:"#fff"},
   ].map((s,i)=>(
   <div key={i} style={{flex:1,background:IOS.bg2,borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid rgba(255,255,255,0.07)"}}>
     <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
     <div style={{fontSize:9,color:IOS.label3,textTransform:"uppercase",letterSpacing:.4,marginTop:2}}>{s.l}</div>
   </div>
   ))}
 </div>
 {/* Week list */}
 <div style={{fontSize:11,fontWeight:700,color:IOS.label3,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>All Slates</div>
 {soloWeeks.map((w,i)=>{
   const isBest = soloWeeks.length>1 && w.pts===Math.max(...soloWeeks.map(x=>x.pts));
   return (
   <div key={w.week} style={{background:IOS.bg2,border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
       <div>
         <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Slate {w.week}</div>
         <div style={{fontSize:11,color:IOS.label3,marginTop:2}}>{w.wins}W · {w.losses}L · {w.picks.length} picks</div>
       </div>
       <div style={{textAlign:"right"}}>
         <div style={{fontSize:18,fontWeight:800,color:w.pts>0?IOS.green:"#555"}}>{w.pts>0?"+"+w.pts:"0"} pts</div>
         {isBest&&<div style={{fontSize:8,fontWeight:700,color:IOS.green,background:"rgba(48,209,88,0.1)",border:"0.5px solid rgba(48,209,88,0.2)",borderRadius:4,padding:"1px 5px",marginTop:2}}>BEST SLATE</div>}
       </div>
     </div>
     {/* Pick breakdown */}
     <div style={{borderTop:"0.5px solid rgba(255,255,255,0.06)",paddingTop:8}}>
       {w.picks.map((p,j)=>{
         const won=p.result==="W",lost=p.result==="L";
         return (
         <div key={j} style={{display:"flex",alignItems:"center",padding:"3px 0"}}>
           <div style={{width:8,height:8,borderRadius:"50%",background:won?IOS.green:lost?IOS.red:"#444",flexShrink:0,marginRight:8}}/>
           <div style={{flex:1,fontSize:11,color:"#ccc"}}>{p.pick_name}</div>
           <div style={{fontSize:11,fontWeight:700,color:won?IOS.green:lost?IOS.red:"#555"}}>{won?"+"+parseFloat(p.points_earned||0).toFixed(1)+"pts":lost?"L":"—"}</div>
         </div>
         );
       })}
     </div>
   </div>
   );
 })}
 </>
 )}
 </div>
 )}

 {/* ══ SOLO STATS ══ */}
 {(screen==="solostats"||screen==="analytics")&&(()=>{
 const s = allMyStats||{};
 const CC={blue:"#0A84FF",green:"#30D158",red:"#FF453A",orange:"#FF9F0A",yellow:"#FFD60A",pink:"#FF375F",purple:"#BF5AF2",teal:"#64D2FF",indigo:"#5E5CE6",l3:"rgba(255,255,255,0.34)",l2:"rgba(255,255,255,0.55)"};
 const SURF={background:"linear-gradient(160deg,#15151A,#0B0B0E 78%)",border:"0.5px solid rgba(255,255,255,0.09)",borderRadius:18,boxShadow:"0 6px 22px rgba(0,0,0,0.5)"};
 const byTypeArr=Object.values(s.byType||{}).filter(t=>t.wins+t.losses>0).sort((a,b)=>b.pts-a.pts);
 const bySportArr=Object.values(s.bySport||{}).filter(t=>t.wins+t.losses>0).sort((a,b)=>b.pts-a.pts);
 const byWeek=s.byWeek||[];
 const byMult=(s.byMult||[]).filter(m=>m.total>0);
 const oddsBands=(s.oddsBands||[]).filter(b=>b.total>0);
 const ls=(s.byType||{}).longshot;
 const streak=s.currentStreak||{count:0,type:"W"};
 const noData=!s.total;
 const fmtOdds=o=>!o?"—":(o>0?"+"+o:""+o);
 let run=0; const cumVals=[0]; byWeek.forEach(w=>{run+=w.pts; cumVals.push(parseFloat(run.toFixed(1)));});
 const ATABS=["Overview","Bet Types","Sports","Multiplier","Longshots"];
 const TDOT={Overview:CC.blue,"Bet Types":CC.green,Sports:CC.indigo,Multiplier:CC.yellow,Longshots:CC.pink};
 const TAGMAP={Moneyline:"ML",Spread:"SPR","Over/Under":"O/U",Prop:"PROP",Longshot:"LS"};
 const sweet=byMult.length?byMult.reduce((a,b)=>b.pts>a.pts?b:a):null;

 const ProBlur=({children,label="Unlock with Pro"})=>(
  <div style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:12}}>
   {children}
   {!isPro&&(
    <div onClick={()=>setShowPaywall("analytics")} style={{position:"absolute",inset:0,backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",background:"rgba(0,0,0,0.55)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:18,zIndex:10}}>
     <div style={{width:38,height:38,borderRadius:11,background:"rgba(10,132,255,0.2)",border:"1px solid rgba(10,132,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CC.blue} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
     </div>
     <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>{label}</div>
     <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Upgrade to Pro</div>
    </div>
   )}
  </div>
 );

 const LineChartSVG=({vals})=>{
  if(!vals||vals.length<2) return <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:CC.l3,fontSize:13}}>{isSoloMode?"Not enough graded slates yet":"Not enough graded weeks yet"}</div>;
  const W=320,H=150,pad=18; const max=Math.max(...vals,1);
  const xs=i=>pad+(i*(W-pad*2)/(vals.length-1));
  const ys=v=>H-pad-(v/max)*(H-pad*2);
  const line=vals.map((v,i)=>(i?"L":"M")+xs(i).toFixed(1)+" "+ys(v).toFixed(1)).join(" ");
  const area=line+" L"+xs(vals.length-1).toFixed(1)+" "+(H-pad)+" L"+xs(0).toFixed(1)+" "+(H-pad)+" Z";
  return (<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto",display:"block"}}>
   <defs><linearGradient id="plg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(48,209,88,0.35)"/><stop offset="100%" stopColor="rgba(48,209,88,0)"/></linearGradient></defs>
   {[0.25,0.5,0.75].map((g,i)=><line key={i} x1={pad} x2={W-pad} y1={pad+(H-pad*2)*g} y2={pad+(H-pad*2)*g} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
   <path d={area} fill="url(#plg)"/>
   <path d={line} fill="none" stroke={CC.green} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
   <circle cx={xs(vals.length-1)} cy={ys(vals[vals.length-1])} r="3.5" fill={CC.green}/>
  </svg>);
 };

 const WeeklyBarsSVG=({weeks})=>{
  if(!weeks||weeks.length<1) return <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:CC.l3,fontSize:13}}>{isSoloMode?"Not enough graded slates yet":"Not enough graded weeks yet"}</div>;
  const W=320,H=150,pad=16,bpad=24; const vals=weeks.map(w=>Math.max(0,w.pts||0)); const max=Math.max(...vals,1);
  const n=weeks.length; const slot=(W-pad*2)/n; const bw=Math.min(34,slot*0.62);
  const avg=vals.reduce((a,b)=>a+b,0)/n; const ay=H-bpad-(avg/max)*(H-bpad-pad);
  const showLbl=n<=14;
  return (<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto",display:"block"}}>
   <defs><linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CC.blue}/><stop offset="100%" stopColor="rgba(10,132,255,0.4)"/></linearGradient></defs>
   {[0.5,1].map((g,i)=><line key={i} x1={pad} x2={W-pad} y1={pad+(H-bpad-pad)*(1-g)} y2={pad+(H-bpad-pad)*(1-g)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
   {avg>0&&<line x1={pad} x2={W-pad} y1={ay} y2={ay} stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="4 4"/>}
   {avg>0&&<text x={W-pad} y={ay-4} textAnchor="end" fontSize="8.5" fill={CC.l3} fontWeight="700">{"avg "+avg.toFixed(1)}</text>}
   {weeks.map((w,i)=>{
    const v=Math.max(0,w.pts||0); const bh=(v/max)*(H-bpad-pad); const x=pad+i*slot+(slot-bw)/2; const y=H-bpad-bh;
    const best=v===max&&v>0;
    return (<g key={i}>
     <rect x={x} y={y} width={bw} height={Math.max(bh,1.5)} rx="3" fill={best?CC.green:"url(#wbg)"}/>
     {bw>=15&&v>0&&<text x={x+bw/2} y={y-3} textAnchor="middle" fontSize="8.5" fill={best?CC.green:CC.l2} fontWeight="800">{v.toFixed(0)}</text>}
     {showLbl&&<text x={x+bw/2} y={H-bpad+12} textAnchor="middle" fontSize="8" fill={CC.l3} fontWeight="700">{String(w.label||("W"+(i+1))).replace(/^Week\s*/i,"W").slice(0,4)}</text>}
    </g>);
   })}
  </svg>);
 };

 const Donut=({segs})=>{
  const tot=segs.reduce((a,b)=>a+Math.max(0,b.value),0)||1;
  const r=58,cx=80,cy=80,sw=22,c=2*Math.PI*r; let acc=0;
  return (<svg viewBox="0 0 160 160" style={{width:172,height:172}}>
   <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw}/>
   {segs.map((sg,i)=>{const frac=Math.max(0,sg.value)/tot;const dash=frac*c;const el=(<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sg.color} strokeWidth={sw} strokeDasharray={dash+" "+(c-dash)} strokeDashoffset={-acc} transform={"rotate(-90 "+cx+" "+cy+")"}/>);acc+=dash;return el;})}
  </svg>);
 };

 const MultChart=({rows})=>{
  if(!rows.length) return <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:CC.l3,fontSize:13}}>No graded picks yet</div>;
  const W=320,H=150,pad=22,bw=26; const n=rows.length; const slot=(W-pad*2)/n; const maxPts=Math.max(...rows.map(r=>r.pts),1);
  return (<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
   {rows.map((r,i)=>{const h=(r.pct/100)*(H-pad*2);const x=pad+i*slot+slot/2-bw/2;return <rect key={i} x={x} y={H-pad-h} width={bw} height={h} rx="5" fill={r.color}/>;})}
   <polyline fill="none" stroke={CC.yellow} strokeWidth="2" points={rows.map((r,i)=>{const x=pad+i*slot+slot/2;const y=H-pad-(r.pts/maxPts)*(H-pad*2);return x+","+y;}).join(" ")}/>
   {rows.map((r,i)=>{const x=pad+i*slot+slot/2;const y=H-pad-(r.pts/maxPts)*(H-pad*2);return <circle key={"d"+i} cx={x} cy={y} r="3" fill={CC.yellow}/>;})}
   {rows.map((r,i)=>{const x=pad+i*slot+slot/2;return <text key={"t"+i} x={x} y={H-6} fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="700" textAnchor="middle">{r.mult}×</text>;})}
  </svg>);
 };

 const OddsChart=({bands})=>{
  if(!bands.length) return <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:CC.l3,fontSize:13}}>No graded picks yet</div>;
  const W=320,H=140,pad=18,n=bands.length; const slot=(W-pad*2)/n; const bw=Math.min(34,slot*0.62);
  return (<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto"}}>
   {bands.map((b,i)=>{const h=(b.pct/100)*(H-pad*2-10);const x=pad+i*slot+slot/2-bw/2;const y=H-pad-h;return (<g key={i}>
     <rect x={x} y={y} width={bw} height={h} rx="5" fill={b.color}/>
     <text x={x+bw/2} y={y-4} fill="#fff" fontSize="10" fontWeight="800" textAnchor="middle">{b.pct}%</text>
     <text x={x+bw/2} y={H-5} fill="rgba(255,255,255,0.5)" fontSize="9.5" fontWeight="700" textAnchor="middle">{b.key}</text>
    </g>);})}
  </svg>);
 };

 const Tile=({lbl,val,meta,glow,vcolor})=>(
  <div style={{...SURF,borderRadius:16,padding:"14px 15px",position:"relative",overflow:"hidden"}}>
   <div style={{position:"absolute",top:-30,right:-30,width:90,height:90,borderRadius:"50%",filter:"blur(26px)",opacity:0.5,background:glow}}/>
   <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:CC.l3,marginBottom:7}}>{lbl}</div>
   <div style={{fontSize:28,fontWeight:800,lineHeight:1,color:vcolor||"#fff",fontVariantNumeric:"tabular-nums"}}>{val}</div>
   <div style={{fontSize:11,fontWeight:700,marginTop:6,color:CC.l2}}>{meta}</div>
  </div>
 );

 const BreakRow=({tag,nm,color,rec,pct,pts,first})=>(
  <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderTop:first?"none":"0.5px solid rgba(255,255,255,0.05)"}}>
   <div style={{width:46,flexShrink:0,fontSize:11,fontWeight:800,textTransform:"uppercase",color}}>{tag}</div>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>{nm}<span style={{fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:5,color,background:color+"22"}}>{pct}%</span><span style={{fontSize:11,color:CC.l3,fontWeight:600}}>{rec}</span></div>
    <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.07)",marginTop:7,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:color}}/></div>
   </div>
   <div style={{textAlign:"right",flexShrink:0,width:64}}><div style={{fontSize:15,fontWeight:800,color:pts>=0?CC.green:CC.red}}>{pts>=0?"+":""}{pts}</div><div style={{fontSize:10,color:CC.l3,fontWeight:600,marginTop:1}}>pts</div></div>
  </div>
 );

 const SecH=({t,sub})=>(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"4px 4px 11px"}}><div style={{fontSize:16,fontWeight:800,letterSpacing:"-0.2px"}}>{t}</div><div style={{fontSize:11,color:CC.l3,fontWeight:600}}>{sub}</div></div>);

 return (
 <div className="body">
  {/* Gradient hero */}
  <div style={{padding:"46px 20px 16px",background:"radial-gradient(120% 90% at 88% -10%, rgba(10,132,255,0.22), transparent 55%),linear-gradient(180deg,#0A1A2E 0%,#000 92%)"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div onClick={()=>setScreen(homeMode==="solo"?"home":"profile")} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:CC.blue,fontSize:18}}>‹</div>
    {isPro
     ? <div style={{background:"rgba(10,132,255,0.14)",border:"0.5px solid rgba(10,132,255,0.35)",borderRadius:7,padding:"4px 11px",fontSize:10,fontWeight:800,letterSpacing:"0.06em",color:CC.blue}}>PRO</div>
     : <div onClick={()=>setShowPaywall("analytics")} style={{background:"rgba(191,90,242,0.16)",border:"0.5px solid rgba(191,90,242,0.4)",borderRadius:7,padding:"4px 11px",fontSize:10,fontWeight:800,letterSpacing:"0.06em",color:CC.purple,cursor:"pointer"}}>UPGRADE</div>}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:7,marginTop:14,marginBottom:8}}><span style={{width:6,height:6,borderRadius:"50%",background:CC.blue,boxShadow:"0 0 10px "+CC.blue}}/><span style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:CC.blue}}>Pro Analytics</span></div>
   <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
    <div>
     <div style={{fontSize:46,fontWeight:800,lineHeight:0.9,color:CC.green,textShadow:"0 0 30px rgba(48,209,88,0.35)",fontVariantNumeric:"tabular-nums"}}>{s.points||0}<span style={{fontSize:20,marginLeft:5,fontWeight:700}}>pts</span></div>
     <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:CC.l3,marginTop:9}}>{s.total||0} picks · {s.wins||0}-{s.losses||0}</div>
    </div>
    <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:800,color:CC.green}}>{s.winRate||"0%"}</div><div style={{fontSize:9,color:CC.l3,textTransform:"uppercase",letterSpacing:"0.1em",marginTop:2}}>Win Rate</div></div>
   </div>
  </div>

  {/* Sticky category pills */}
  <div style={{position:"sticky",top:0,zIndex:20,display:"flex",gap:7,overflowX:"auto",scrollbarWidth:"none",padding:"12px 16px",background:"rgba(5,5,7,0.82)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",borderBottom:"0.5px solid rgba(255,255,255,0.09)"}}>
   {ATABS.map(t=>{const on=analyticsTab===t;return (
    <div key={t} onClick={()=>setAnalyticsTab(t)} style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:800,whiteSpace:"nowrap",cursor:"pointer",color:on?"#fff":CC.l2,background:on?"linear-gradient(135deg,rgba(10,132,255,0.28),rgba(94,92,230,0.18))":"rgba(255,255,255,0.05)",border:on?"0.5px solid rgba(10,132,255,0.55)":"0.5px solid rgba(255,255,255,0.09)",borderRadius:20,padding:"8px 14px",boxShadow:on?"0 3px 12px rgba(10,132,255,0.25)":"none",transition:"all .18s"}}>
     <span style={{width:6,height:6,borderRadius:"50%",background:TDOT[t]}}/>{t}{!isPro&&t!=="Overview"&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={CC.purple} strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
    </div>);})}
  </div>

  <div style={{padding:"14px 16px 90px"}}>
   {noData ? (
    <div style={{...SURF,padding:"40px 20px",textAlign:"center"}}>
     <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>No graded picks yet</div>
     <div style={{fontSize:13,color:CC.l3,lineHeight:1.5}}>Once your slips start grading, your full performance breakdown shows up here.</div>
    </div>
   ) : (<>

    {/* OVERVIEW */}
    {analyticsTab==="Overview"&&(<>
     {streak.type==="W" && streak.count>=2 && (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:14,padding:"12px 14px",borderRadius:16,background:"linear-gradient(135deg,rgba(255,106,0,0.15),rgba(255,55,95,0.05))",border:"0.5px solid rgba(255,106,0,0.32)"}}>
       <StreakFlame count={streak.count} size={26}/>
       <div>
        <div style={{fontSize:17,fontWeight:800,color:"#FF6A00",lineHeight:1.1}}>{streak.count} pick win streak</div>
        <div style={{fontSize:11,color:CC.l3,marginTop:2}}>Best ever: {Math.max(s.maxStreak||0,streak.count)}</div>
       </div>
      </div>
     )}
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      <Tile lbl="Record" val={(s.wins||0)+"-"+(s.losses||0)} meta={(s.winRate||"0%")+" win"} glow={CC.blue} vcolor="#fff"/>
      <Tile lbl="Avg Odds" val={fmtOdds(s.avgOdds)} meta="across all picks" glow={CC.teal} vcolor={CC.teal}/>
      <Tile lbl={isSoloMode?"Best Slate":"Best Week"} val={s.bestWeek?(s.bestWeek.pts+" pts"):"—"} meta={s.bestWeek?s.bestWeek.label:"—"} glow={CC.yellow} vcolor={CC.green}/>
      <Tile lbl="Streak" val={streak.type+streak.count} meta={"best "+(s.maxStreak||0)} glow={CC.pink} vcolor={streak.type==="W"?CC.green:CC.red}/>
     </div>
     {(()=>{
      const RT=[["ml","ML"],["spread","SPR"],["ou","O/U"],["prop","PROP"],["longshot","LS"]];
      const cnts=RT.map(([k])=>{const t=(s.byType||{})[k];return t?(t.wins+t.losses):0;});
      const mx=Math.max(...cnts,1); const tot=cnts.reduce((a,b)=>a+b,0);
      if(!tot) return null;
      const axes=RT.map(([k,tag],i)=>({tag,value:cnts[i]/mx,color:((s.byType||{})[k]||{}).color||CC.blue}));
      return (<>
       <SecH t="Betting Fingerprint" sub={s.personality||""}/>
       <div style={{...SURF,padding:"12px 12px 16px",marginBottom:14}}>
        <StatRadar axes={axes} size={210} color={CC.blue}/>
        {s.personalityDesc && <div style={{textAlign:"center",fontSize:11.5,color:CC.l2,marginTop:4,padding:"0 18px",lineHeight:1.45}}>{s.personalityDesc}</div>}
       </div>
      </>);
     })()}
     {s.clv && s.clv.count>0 && (<>
      <SecH t="Closing Line Value" sub={s.clv.count+" graded picks"}/>
      <div style={{...SURF,padding:"16px",marginBottom:14}}>
       <div style={{display:"flex",alignItems:"stretch",justifyContent:"space-around"}}>
        <div style={{textAlign:"center",flex:1}}>
         <div style={{fontSize:30,fontWeight:800,color:s.clv.beatRate>=50?CC.green:CC.l2,fontVariantNumeric:"tabular-nums"}}>{s.clv.beatRate}%</div>
         <div style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:"0.08em",color:CC.l3,marginTop:4}}>beat the close</div>
        </div>
        <div style={{width:"0.5px",background:"rgba(255,255,255,0.1)",margin:"2px 0"}}/>
        <div style={{textAlign:"center",flex:1}}>
         <div style={{fontSize:30,fontWeight:800,color:s.clv.avgClv>0?CC.green:(s.clv.avgClv<0?CC.red:CC.l2),fontVariantNumeric:"tabular-nums"}}>{s.clv.avgClv>0?"+":""}{s.clv.avgClv}%</div>
         <div style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:"0.08em",color:CC.l3,marginTop:4}}>avg CLV</div>
        </div>
       </div>
       <div style={{fontSize:11,color:CC.l3,marginTop:13,lineHeight:1.45,textAlign:"center"}}>CLV measures whether you locked a better price than the closing line. Consistently positive CLV is the strongest sign you are finding real value.</div>
      </div>
     </>)}
     <SecH t="Points by Week" sub={byWeek.length+(isSoloMode?" graded slates":" graded wks")}/>
     <div style={{...SURF,padding:"16px 16px 14px"}}><WeeklyBarsSVG weeks={byWeek}/></div>
    </>)}

    {/* BET TYPES */}
    {analyticsTab==="Bet Types"&&(
     <ProBlur label="Unlock Bet Type Breakdown">
      <div style={SURF}>
       <div style={{padding:"16px 16px 4px",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Donut segs={byTypeArr.map(t=>({value:t.pts,color:t.color}))}/>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
         <div style={{fontSize:28,fontWeight:800,color:CC.green,fontVariantNumeric:"tabular-nums"}}>{s.points||0}</div>
         <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",color:CC.l3,marginTop:3}}>total pts</div>
        </div>
       </div>
       <div style={{display:"flex",flexWrap:"wrap",gap:"9px 15px",padding:"6px 16px 14px"}}>
        {byTypeArr.map((t,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:CC.l2}}><span style={{width:9,height:9,borderRadius:3,background:t.color}}/>{t.label}</div>))}
       </div>
       {byTypeArr.map((t,i)=>(<BreakRow key={i} first={i===0} tag={TAGMAP[t.label]||t.label.slice(0,3).toUpperCase()} nm={t.label} color={t.color} rec={t.wins+"-"+t.losses} pct={t.pct} pts={t.pts}/>))}
      </div>
     </ProBlur>
    )}

    {/* SPORTS */}
    {analyticsTab==="Sports"&&(
     <ProBlur label="Unlock Sport Breakdown">
      <div style={SURF}>
       {bySportArr.map((t,i)=>(<BreakRow key={i} first={i===0} tag={t.label} nm={t.label+" picks"} color={t.color} rec={t.wins+"-"+t.losses} pct={t.pct} pts={t.pts}/>))}
      </div>
     </ProBlur>
    )}

    {/* MULTIPLIER */}
    {analyticsTab==="Multiplier"&&(
     <ProBlur label="Unlock Multiplier Analysis">
      <div style={{...SURF,padding:"16px"}}>
       <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:CC.l3,marginBottom:10}}>Win % (bars) · Points (line)</div>
       <MultChart rows={byMult}/>
       {sweet&&<div style={{fontSize:12,color:CC.l2,lineHeight:1.55,marginTop:12,paddingTop:12,borderTop:"0.5px solid rgba(255,255,255,0.06)"}}>Your most profitable multiplier is <b style={{color:"#fff"}}>{sweet.mult}×</b> at <b style={{color:CC.green}}>+{sweet.pts} pts</b>. Higher multipliers pay more but hit less — the line shows where your points actually come from.</div>}
      </div>
     </ProBlur>
    )}

    {/* LONGSHOTS */}
    {analyticsTab==="Longshots"&&(
     <ProBlur label="Unlock Longshot Insights">
      <div>
       <div style={{...SURF,padding:"16px"}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:CC.l3,marginBottom:10}}>Hit rate by odds band</div>
        <OddsChart bands={oddsBands}/>
       </div>
       <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
        <div style={{...SURF,borderRadius:14,padding:"13px 14px"}}><div style={{fontSize:20,fontWeight:800,color:CC.pink,fontVariantNumeric:"tabular-nums"}}>{ls?(ls.pts>=0?"+":"")+ls.pts:"—"}</div><div style={{fontSize:10,color:CC.l3,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,marginTop:4}}>Longshot Pts</div></div>
        <div style={{...SURF,borderRadius:14,padding:"13px 14px"}}><div style={{fontSize:20,fontWeight:800,color:CC.yellow}}>{ls?ls.pct+"%":"—"}</div><div style={{fontSize:10,color:CC.l3,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,marginTop:4}}>Longshot Hit Rate</div></div>
        <div style={{...SURF,borderRadius:14,padding:"13px 14px"}}><div style={{fontSize:20,fontWeight:800,color:CC.green,fontVariantNumeric:"tabular-nums"}}>{s.bestBet?"+"+parseFloat(s.bestBet.points_earned||0).toFixed(1):"—"}</div><div style={{fontSize:10,color:CC.l3,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,marginTop:4}}>Biggest Single Hit</div></div>
        <div style={{...SURF,borderRadius:14,padding:"13px 14px"}}><div style={{fontSize:20,fontWeight:800,color:CC.teal}}>{s.bestBet&&s.bestBet.odds?s.bestBet.odds:fmtOdds(s.avgOdds)}</div><div style={{fontSize:10,color:CC.l3,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,marginTop:4}}>Best Pick Odds</div></div>
       </div>
      </div>
     </ProBlur>
    )}

   </>)}
  </div>
 </div>
 );})()}


 <div className="tab-bar">
 {(homeMode==="solo" ? [
 {icon:"home",label:"Home",id:"home"},
 {icon:"picks",label:"Picks",id:"picks"},
 {icon:"history",label:"History",id:"solohistory"},
 {icon:"stats",label:"Stats",id:"solostats"},
 {icon:"profile",label:"Profile",id:"profile"},
 ] : [
 {icon:"home",label:"Home",id:"home"},
 {icon:"picks",label:"Picks",id:"picks"},
 {icon:"matchup",label:"Matchup",id:"matchup"},
 {icon:"leagues",label:"Leagues",id:"leagues"},
 {icon:"profile",label:"Profile",id:"profile"},
 ]).map(t=>{
 const isOn=screen===t.id;
 const col=isOn?IOS.blue:"rgba(255,255,255,0.3)";
 const svgs={
 home:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
 picks:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
 matchup:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="18 13 12 19 6 13"/><polyline points="18 11 12 5 6 11"/></svg>,
 leagues:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
 standings:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
 history:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
 stats:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
 profile:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
 };
 return (
 <div key={t.id} className={"tab-item "+(isOn?"on":"")} onClick={()=>setScreen(t.id)}>
 <div className="tab-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{svgs[t.icon]}</div>
 <div className="tab-label" style={isOn?{color:IOS.blue}:{}}>{t.label}</div>
 </div>
 );})}
 </div>
 </div>}
 </div>
 );
}