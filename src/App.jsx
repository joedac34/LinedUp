import { useState, useEffect, useRef } from "react";

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

const SLOTS = [
  { id:"ml",       label:"Moneyline",  mult:1, icon:"🎯", color:IOS.blue,   bg:`rgba(10,132,255,0.15)`,   desc:"Pick a winner straight up" },
  { id:"prop",     label:"Prop",       mult:2, icon:"⭐", color:IOS.yellow, bg:`rgba(255,214,10,0.15)`,   desc:"Player or game prop bet" },
  { id:"ou",       label:"Over/Under", mult:3, icon:"📊", color:IOS.orange, bg:`rgba(255,159,10,0.15)`,   desc:"Total points over or under" },
  { id:"spread",   label:"Spread",     mult:4, icon:"📐", color:IOS.green,  bg:`rgba(48,209,88,0.15)`,    desc:"Beat the point spread" },
  { id:"longshot", label:"Parlay",     mult:5, icon:"🚀", color:IOS.pink,   bg:`rgba(255,55,95,0.15)`,    desc:"Build a mini parlay — pick 2+ bets" },
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

const BETS = {
  ml: [
    { id:"ml1", game:"Raiders @ Chiefs",    pick:"KC Chiefs",         odds:"-280", impliedOdds:-280 },
    { id:"ml2", game:"Cowboys @ Eagles",    pick:"Philadelphia",      odds:"-165", impliedOdds:-165 },
    { id:"ml3", game:"Dolphins @ Bills",    pick:"Buffalo Bills",     odds:"-210", impliedOdds:-210 },
    { id:"ml4", game:"Rams @ 49ers",        pick:"San Francisco",     odds:"-195", impliedOdds:-195 },
    { id:"ml5", game:"Vikings @ Packers",   pick:"Green Bay",         odds:"-125", impliedOdds:-125 },
  ],
  spread: [
    { id:"sp1", game:"Raiders @ Chiefs",    pick:"KC Chiefs -6.5",   odds:"-110", impliedOdds:-110 },
    { id:"sp2", game:"Cowboys @ Eagles",    pick:"Eagles -3",        odds:"-110", impliedOdds:-110 },
    { id:"sp3", game:"Dolphins @ Bills",    pick:"Bills -5",         odds:"-115", impliedOdds:-115 },
    { id:"sp4", game:"Rams @ 49ers",        pick:"49ers -4.5",       odds:"-110", impliedOdds:-110 },
    { id:"sp5", game:"Panthers @ Falcons",  pick:"Falcons -6",       odds:"-108", impliedOdds:-108 },
  ],
  prop: [
    { id:"pr1", game:"Patrick Mahomes",     pick:"300+ Pass Yards",  odds:"-130", impliedOdds:-130 },
    { id:"pr2", game:"Jalen Hurts",         pick:"2+ Rush TDs",      odds:"+175", impliedOdds:175  },
    { id:"pr3", game:"Josh Allen",          pick:"35+ Pass Attempts",odds:"-115", impliedOdds:-115 },
    { id:"pr4", game:"Brock Purdy",         pick:"Over 1.5 TDs",     odds:"-140", impliedOdds:-140 },
    { id:"pr5", game:"C. McCaffrey",        pick:"Over 90.5 Rush Yds",odds:"-110",impliedOdds:-110 },
  ],
  ou: [
    { id:"ou1", game:"Raiders @ Chiefs",    pick:"Over 47.5",        odds:"-110", impliedOdds:-110 },
    { id:"ou2", game:"Cowboys @ Eagles",    pick:"Under 44",         odds:"-110", impliedOdds:-110 },
    { id:"ou3", game:"Dolphins @ Bills",    pick:"Over 48",          odds:"-115", impliedOdds:-115 },
    { id:"ou4", game:"Rams @ 49ers",        pick:"Under 45.5",       odds:"-110", impliedOdds:-110 },
    { id:"ou5", game:"Vikings @ Packers",   pick:"Over 43",          odds:"-118", impliedOdds:-118 },
  ],
  longshot: [
    { id:"ls1", game:"Raiders @ Chiefs",    pick:"Raiders ML",        odds:"+240", impliedOdds:240  },
    { id:"ls2", game:"Cowboys @ Eagles",    pick:"Cowboys ML",        odds:"+350", impliedOdds:350  },
    { id:"ls3", game:"Panthers @ Falcons",  pick:"Panthers ML",       odds:"+380", impliedOdds:380  },
    { id:"ls4", game:"Giants @ Commanders", pick:"Giants ML",         odds:"+310", impliedOdds:310  },
    { id:"ls5", game:"Broncos @ Chargers",  pick:"Broncos ML",        odds:"+420", impliedOdds:420  },
    { id:"ls6", game:"Bears @ Lions",       pick:"Bears ML",          odds:"+290", impliedOdds:290  },
    { id:"ls7", game:"Cowboys @ Eagles",    pick:"Cowboys +3 1H",     odds:"+145", impliedOdds:145  },
    { id:"ls8", game:"Raiders @ Chiefs",    pick:"Raiders cover +6.5",odds:"+105", impliedOdds:105  },
    { id:"ls9", game:"Jets @ Patriots",     pick:"Jets ML",           odds:"+265", impliedOdds:265  },
    { id:"ls10",game:"Panthers @ Falcons",  pick:"Panthers +6 cover", odds:"-108", impliedOdds:-108 },
  ],
};

const MATCHUP_HISTORY = [
  {
    week:1, opp:"Jake P.", result:"W", myScore:3, oppScore:2,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"KC Chiefs", odds:"-180", result:"W" },
      { slot:"Prop",      mult:2, pick:"Mahomes 300+ Yds", odds:"-130", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 47.5", odds:"-110", result:"L" },
      { slot:"Spread",    mult:4, pick:"Eagles -3", odds:"-110", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Cowboys +7", odds:"+420", result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", result:"W" },
      { slot:"Prop",      mult:2, pick:"Josh Allen 2+ TDs", odds:"-140", result:"L" },
      { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", result:"W" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", result:"L" },
      { slot:"Parlay",    mult:5, pick:"Bears ML + Panthers ML", odds:"+380", result:"L" },
    ],
  },
  {
    week:2, opp:"Ryan S.", result:"W", myScore:4, oppScore:1,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-165", result:"W" },
      { slot:"Prop",      mult:2, pick:"Jalen Hurts 2+ Rush TDs", odds:"+175", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", result:"W" },
      { slot:"Spread",    mult:4, pick:"Bills -5", odds:"-115", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Cowboys ML + Giants ML", odds:"+510", result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Cowboys ML", odds:"+350", result:"L" },
      { slot:"Prop",      mult:2, pick:"Dak 300+ Yds", odds:"-120", result:"L" },
      { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", result:"W" },
      { slot:"Spread",    mult:4, pick:"Cowboys +3", odds:"-110", result:"L" },
      { slot:"Parlay",    mult:5, pick:"Panthers ML + Broncos ML", odds:"+640", result:"L" },
    ],
  },
  {
    week:3, opp:"Alex M.", result:"L", myScore:2, oppScore:3,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Packers ML", odds:"-125", result:"L" },
      { slot:"Prop",      mult:2, pick:"Jordan Love 250+ Yds", odds:"-115", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 43", odds:"-118", result:"L" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Jets ML + Raiders ML", odds:"+580", result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Vikings ML", odds:"+105", result:"W" },
      { slot:"Prop",      mult:2, pick:"Jefferson 100+ Yds", odds:"-130", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Under 44", odds:"-110", result:"W" },
      { slot:"Spread",    mult:4, pick:"Vikings +2", odds:"-110", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Bears ML + Panthers ML", odds:"+420", result:"L" },
    ],
  },
  {
    week:4, opp:"Chris R.", result:"W", myScore:3, oppScore:2,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Bills ML", odds:"-210", result:"W" },
      { slot:"Prop",      mult:2, pick:"Josh Allen 35+ Attempts", odds:"-115", result:"L" },
      { slot:"Over/Under",mult:3, pick:"Over 48", odds:"-115", result:"W" },
      { slot:"Spread",    mult:4, pick:"KC Chiefs -6.5", odds:"-110", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Giants ML", odds:"+490", result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"Rams ML", odds:"+115", result:"L" },
      { slot:"Prop",      mult:2, pick:"Kupp 80+ Yds", odds:"-125", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Under 45.5", odds:"-110", result:"W" },
      { slot:"Spread",    mult:4, pick:"Rams +4.5", odds:"-110", result:"L" },
      { slot:"Parlay",    mult:5, pick:"Panthers ML + Bears ML", odds:"+520", result:"L" },
    ],
  },
  {
    week:5, opp:"Tom B.", result:"L", myScore:2, oppScore:3,
    myPicks:[
      { slot:"Moneyline", mult:1, pick:"Eagles ML", odds:"-155", result:"W" },
      { slot:"Prop",      mult:2, pick:"Hurts Over 1.5 TDs", odds:"-140", result:"L" },
      { slot:"Over/Under",mult:3, pick:"Over 44", odds:"-110", result:"L" },
      { slot:"Spread",    mult:4, pick:"Cowboys +7", odds:"-110", result:"W" },
      { slot:"Parlay",    mult:5, pick:"Jets ML + Broncos ML", odds:"+610", result:"L" },
    ],
    oppPicks:[
      { slot:"Moneyline", mult:1, pick:"49ers ML", odds:"-195", result:"W" },
      { slot:"Prop",      mult:2, pick:"CMC 90+ Rush Yds", odds:"-110", result:"W" },
      { slot:"Over/Under",mult:3, pick:"Over 45.5", odds:"-115", result:"W" },
      { slot:"Spread",    mult:4, pick:"49ers -4.5", odds:"-110", result:"L" },
      { slot:"Parlay",    mult:5, pick:"Raiders ML + Panthers ML", odds:"+540", result:"L" },
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
function calcParlay(picks,ls){
  const singles=SLOTS.filter(s=>s.id!=="longshot").map(s=>([s.id,picks[s.id]])).filter(([,v])=>v);
  const lsO=calcLS(ls);
  const all=[...singles,...(lsO?[["ls_compiled",{_d:lsO.decimal}]]:[])];
  if(!all.length)return null;
  const d=all.reduce((acc,[id,bet])=>{
    if(id==="ls_compiled"){return acc*(1+(bet._d-1)*5);}
    const slot=SLOTS.find(s=>s.id===id);
    return acc*(1+(toDecimal(bet.impliedOdds)-1)*slot.mult);
  },1);
  return{american:toAmerican(d),payout:Math.round((d-1)*100)};
}

const pad=n=>String(n).padStart(2,"0");
const acColor=i=>({D:"#5E5CE6",M:"#0A84FF",T:"#FF453A",C:"#30D158",A:"#FF9F0A",R:"#FF375F"}[i]||IOS.purple);
const rarityColor=r=>r==="legendary"?IOS.pink:r==="rare"?IOS.purple:IOS.green;
const rankMedal=r=>r===1?"🥇":r===2?"🥈":r===3?"🥉":`${r}`;

const polarToCart=(cx,cy,r,deg)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

export default function App() {
  const [screen,      setScreen]      = useState("home");
  const [anim,        setAnim]        = useState(false);
  const [timeLeft,    setTimeLeft]    = useState({h:1,m:47,s:32});
  const [submitted,   setSubmitted]   = useState(false);
  const [leagueTab,   setLeagueTab]   = useState("standings");
  const [expanded,    setExpanded]    = useState(null);
  const [sortBy,      setSortBy]      = useState("rank");
  const [chatMsg,     setChatMsg]     = useState("");
  const [messages,    setMessages]    = useState(CHAT);
  const [picks,       setPicks]       = useState({ml:null,prop:null,ou:null,spread:null});
  const [lsBets,      setLsBets]      = useState([]);
  const [activeSlot,  setActiveSlot]  = useState(null);
  const [myPUs,       setMyPUs]       = useState([POWER_UPS[1],POWER_UPS[4]]);
  const [profTab,     setProfTab]     = useState("stats");
  const [showWheel,   setShowWheel]   = useState(false);
  const [spinning,    setSpinning]    = useState(false);
  const [wheelAngle,  setWheelAngle]  = useState(0);
  const [wonPU,       setWonPU]       = useState(null);
  const [showWin,     setShowWin]     = useState(false);
  const [showTopScorer, setShowTopScorer] = useState(false);
  const [savedPicks,  setSavedPicks]  = useState(null);
  const [selectedMatchup, setSelectedMatchup] = useState(null); // week number of selected past matchup // locked picks for the week
  const chatRef=useRef(null);

  useEffect(()=>{
    setTimeout(()=>setAnim(true),80);
    const t=setInterval(()=>setTimeLeft(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--;}if(m<0){m=59;h--;}if(h<0){h=0;m=0;s=0;}return{h,m,s};}),1000);
    // Load saved picks from localStorage
    try {
      const stored = localStorage.getItem("linedup_picks_wk6");
      if(stored) setSavedPicks(JSON.parse(stored));
    } catch(e) {}
    return()=>clearInterval(t);
  },[]);

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
  const selectBet=(slotId,bet)=>{
    if(slotId==="longshot"){setLsBets(p=>p.find(b=>b.id===bet.id)?p.filter(b=>b.id!==bet.id):[...p,bet]);}
    else{setPicks(p=>({...p,[slotId]:bet}));setActiveSlot(null);}
  };
  const clearPick=slotId=>{if(slotId==="longshot")setLsBets([]);else setPicks(p=>({...p,[slotId]:null}));};
  const sendMsg=()=>{if(!chatMsg.trim())return;setMessages(p=>[...p,{id:Date.now(),user:"Joe",init:"J",time:"now",text:chatMsg.trim(),me:true}]);setChatMsg("");setTimeout(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},50);};

  const parlay=calcParlay(picks,lsBets);
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

      <div className="phone">

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
                <div className="nav-title-large">LINEDUP</div>
                <div className="nav-subtitle">Week 6 · The Boys League</div>
              </div>

              {/* Stat pills */}
              <div className="stat-pills">
                <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.blue}}>7-3</div><div className="stat-pill-lbl">Record</div></div>
                <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>+18.4%</div><div className="stat-pill-lbl">ROI</div></div>
                <div className="stat-pill"><div className="stat-pill-val" style={{color:IOS.green}}>+12.5u</div><div className="stat-pill-lbl">Units</div></div>
              </div>

              {/* Matchup */}
              <div className="ios-section" style={{margin:"0 16px 10px"}}>
                <div className="ios-section-header">Week 6 Matchup · Live</div>
              </div>
              <div className="matchup-widget">
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${IOS.blue},${IOS.indigo})`}}/>
                <div className="mw-top">THE BOYS LEAGUE · WEEK 6</div>
                <div className="mw-teams">
                  <div className="mw-player">
                    <div className="mw-name" style={{color:IOS.blue}}>YOU</div>
                    <div className="mw-rec">7-3</div>
                  </div>
                  <div className="mw-vs">VS</div>
                  <div className="mw-player right">
                    <div className="mw-name">Mike D.</div>
                    <div className="mw-rec">6-4</div>
                  </div>
                </div>
                <div className="mw-scores">
                  <div className="mw-score-item"><div className="mw-score-num" style={{color:IOS.green}}>3</div><div className="mw-score-lbl">Your Wins</div></div>
                  <div className="mw-score-item"><div className="mw-score-num" style={{color:IOS.label3}}>1</div><div className="mw-score-lbl">Pushes</div></div>
                  <div className="mw-score-item"><div className="mw-score-num" style={{color:IOS.red}}>1</div><div className="mw-score-lbl">Their Wins</div></div>
                  <div className="mw-score-item"><div className="mw-score-num" style={{color:IOS.blue}}>2</div><div className="mw-score-lbl">Pending</div></div>
                </div>
              </div>

              {/* Timer */}
              <div className="countdown-bar">
                <div className="cd-label">Lineup locks in</div>
                <div className="cd-time">{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</div>
              </div>
              {savedPicks
                ? <button className="ios-btn" style={{background:IOS.green,color:"#000",marginBottom:6}} onClick={()=>setScreen("picks")}>✓ Picks Locked — View or Edit</button>
                : <button className="ios-btn blue" onClick={()=>setScreen("picks")} style={{marginBottom:6}}>+ Make Your Picks</button>
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
                    <div className="sheet-done" onClick={()=>setActiveSlot(null)}>Done</div>
                  </div>
                  {activeSlot==="longshot"&&lsBets.length>=2&&(
                    <div className="sheet-ls-bar">
                      <span style={{fontSize:12,fontWeight:600,color:IOS.pink}}>🚀 Mini-parlay odds</span>
                      <span style={{fontSize:20,fontWeight:700,color:IOS.pink,letterSpacing:-0.5}}>{lsO?.american}</span>
                    </div>
                  )}
                  {BETS[activeSlot]?.map(bet=>{
                    const pos=!bet.odds.startsWith("-");
                    const cur=activeSlot==="longshot"?lsBets.find(b=>b.id===bet.id):picks[activeSlot]?.id===bet.id;
                    return (
                      <div key={bet.id} className="bet-row" style={cur?{background:"rgba(10,132,255,0.06)"}:{}} onClick={()=>selectBet(activeSlot,bet)}>
                        <div className="bet-row-left">
                          <div className="bet-row-game">{bet.game}</div>
                          <div className="bet-row-pick">{bet.pick}</div>
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
                <div className="pb-title">Make Your 5 Picks</div>
                <div className="pb-sub">Week 6 · Moneyline · Prop · O/U · Spread · Parlay</div>
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
                  </div>
                );
              })}

              <div style={{height:12}}/>
              {allFilled
                ? <button className="ios-btn green" onClick={()=>{
                    const locked = { picks, lsBets, parlay, lockedAt: new Date().toISOString() };
                    try { localStorage.setItem("linedup_picks_wk6", JSON.stringify(locked)); } catch(e) {}
                    setSavedPicks(locked);
                    setSubmitted(true);
                  }}>🔒 Lock In My Picks · {parlay?.american}</button>
                : <button className="ios-btn disabled" disabled>{Object.values(picks).filter(v=>v).length+(lsBets.length>=2?1:0)} / 5 Picks Filled</button>
              }
              <div style={{height:20}}/>
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
                  return (
                    <div style={{position:"absolute",inset:0,background:IOS.bg,zIndex:30,overflowY:"auto",paddingBottom:40}}>
                      {/* Header */}
                      <div style={{padding:"52px 20px 16px",borderBottom:`0.5px solid ${IOS.sep}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <button onClick={()=>setSelectedMatchup(null)} style={{background:IOS.fill2,border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:IOS.blue,fontSize:17,flexShrink:0}}>‹</button>
                          <div style={{fontSize:17,fontWeight:600,letterSpacing:-0.3}}>Week {m.week} Matchup</div>
                        </div>
                        {/* Score card */}
                        <div style={{background:IOS.bg2,borderRadius:16,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:m.result==="W"?`linear-gradient(90deg,${IOS.green},${IOS.teal})`:`linear-gradient(90deg,${IOS.red},${IOS.orange})`}}/>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                            <div>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,color:IOS.blue}}>You</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {m.week}</div>
                            </div>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:m.result==="W"?IOS.green:IOS.red}}>{m.myScore}–{m.oppScore}</div>
                              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:m.result==="W"?IOS.green:IOS.red,marginTop:2}}>{m.result==="W"?"Victory":"Defeat"}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{m.opp}</div>
                              <div style={{fontSize:12,color:IOS.label3,marginTop:2}}>Week {m.week}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Head to head picks */}
                      <div style={{padding:"16px 20px 8px"}}>
                        <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,marginBottom:12}}>Head to Head Picks</div>
                      </div>

                      {m.myPicks.map((myP, i)=>{
                        const oppP = m.oppPicks[i];
                        const col = slotColors[myP.slot]||IOS.blue;
                        return (
                          <div key={i} style={{margin:"0 16px 10px",background:IOS.bg2,borderRadius:14,overflow:"hidden",border:`1px solid rgba(255,255,255,0.06)`}}>
                            {/* Slot label */}
                            <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${IOS.sep}`,display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:28,height:28,borderRadius:8,background:`${col}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{myP.mult}×</div>
                              <div style={{fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:col}}>{myP.slot}</div>
                            </div>
                            {/* Your pick vs their pick */}
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                              {/* Your pick */}
                              <div style={{padding:"12px 14px",borderRight:`0.5px solid ${IOS.sep}`,background:myP.result==="W"?"rgba(48,209,88,0.05)":"rgba(255,69,58,0.04)"}}>
                                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.blue,marginBottom:6}}>You</div>
                                <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4,lineHeight:1.3}}>{myP.pick}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <div style={{fontSize:14,fontWeight:800,letterSpacing:-0.3,color:myP.odds.startsWith("+")?IOS.green:IOS.blue}}>{myP.odds}</div>
                                  <div style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:myP.result==="W"?"rgba(48,209,88,0.15)":"rgba(255,69,58,0.15)",color:myP.result==="W"?IOS.green:IOS.red}}>{myP.result==="W"?"✓ Win":"✗ Loss"}</div>
                                </div>
                              </div>
                              {/* Opp pick */}
                              <div style={{padding:"12px 14px",background:oppP.result==="W"?"rgba(48,209,88,0.05)":"rgba(255,69,58,0.04)"}}>
                                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:IOS.label3,marginBottom:6}}>{m.opp}</div>
                                <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4,lineHeight:1.3}}>{oppP.pick}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <div style={{fontSize:14,fontWeight:800,letterSpacing:-0.3,color:oppP.odds.startsWith("+")?IOS.green:IOS.blue}}>{oppP.odds}</div>
                                  <div style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:oppP.result==="W"?"rgba(48,209,88,0.15)":"rgba(255,69,58,0.15)",color:oppP.result==="W"?IOS.green:IOS.red}}>{oppP.result==="W"?"✓ Win":"✗ Loss"}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{background:IOS.bg2,borderRadius:16,margin:"0 16px",overflow:"hidden"}}>
                  {SCHEDULE.map(wk=>{
                    const live=wk.result==="live";const done=wk.result==="W"||wk.result==="L";
                    const hasMH = MATCHUP_HISTORY.find(x=>x.week===wk.week);
                    return (
                      <div key={wk.week} className="sch-item"
                        style={{...( live?{background:"rgba(10,132,255,0.06)"}:{}), ...(done?{cursor:"pointer"}:{})}}
                        onClick={()=>done&&hasMH&&setSelectedMatchup(wk.week)}
                      >
                        <div className={`sch-wk ${live?"live":""}`}>W{wk.week}</div>
                        <div className={`sch-opp ${live?"live":done?"done":"up"}`}>{live&&<span style={{color:IOS.blue,marginRight:6}}>●</span>}vs {wk.opp}</div>
                        <div className="sch-score">{done?`${wk.ms}-${wk.os}`:live?"Live":"—"}</div>
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
            {icon:"⚡",label:"Home",   id:"home"},
            {icon:"🎯",label:"Picks",  id:"picks"},
            {icon:"📊",label:"League", id:"league"},
            {icon:"💬",label:"Chat",   id:"chat"},
            {icon:"👤",label:"Profile",id:"profile"},
          ].map(t=>(
            <div key={t.id} className={`tab-item ${screen===t.id?"on":""}`} onClick={()=>setScreen(t.id)}>
              <div className="tab-icon" style={{filter:screen===t.id?"none":"grayscale(1) opacity(0.5)"}}>{t.icon}</div>
              <div className="tab-label" style={screen===t.id?{color:IOS.blue}:{}}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}