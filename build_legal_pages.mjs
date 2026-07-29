/* Generates the two public legal pages from src/legal.js.
   Run after editing legal.js so the in-app copy and the web copy cannot drift:
     node build_legal_pages.mjs
   Output: public/terms.html, public/privacy.html                              */
import fs from "fs";
const src = fs.readFileSync("legal.js","utf8").replace("export const","const")+";module.exports={LEGAL};";
fs.writeFileSync("/tmp/_legal_build.cjs", src);
const { LEGAL } = await import("/tmp/_legal_build.cjs");

const esc = (t)=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const page = (key)=>{
  const d = LEGAL[key];
  const secs = d.secs.map(s=>{
    const h = s.lvl===1 ? `<h2>${esc(s.h)}</h2>` : `<h3>${esc(s.h)}</h3>`;
    return h + s.p.map(p=>`<p>${esc(p)}</p>`).join("\n");
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)} — PickLock</title>
<meta name="description" content="PickLock ${esc(d.title)}, effective ${esc(d.eff)}.">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0c;color:#fff;font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:0 20px 80px}
.wrap{max-width:720px;margin:0 auto}
header{padding:44px 0 28px;border-bottom:1px solid rgba(255,255,255,.09);margin-bottom:28px}
.brand{font-size:15px;font-weight:800;letter-spacing:-.3px;color:#7EA4F2;text-decoration:none}
h1{font-size:30px;font-weight:800;letter-spacing:-.7px;margin-top:14px}
.eff{font-size:13px;color:rgba(255,255,255,.42);font-weight:600;margin-top:6px}
h2{font-size:19px;font-weight:800;margin:34px 0 10px;letter-spacing:-.3px}
h3{font-size:15.5px;font-weight:700;margin:22px 0 8px;color:rgba(255,255,255,.72)}
p{color:rgba(255,255,255,.62);margin-bottom:12px}
footer{margin-top:44px;padding-top:22px;border-top:1px solid rgba(255,255,255,.09);font-size:13px;color:rgba(255,255,255,.32)}
footer a{color:#7EA4F2;text-decoration:none}
@media(max-width:520px){h1{font-size:25px}body{font-size:15px}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <a class="brand" href="https://picklockapp.com">PickLock</a>
  <h1>${esc(d.title)}</h1>
  <div class="eff">Effective ${esc(d.eff)}</div>
</header>
${d.intro.map(p=>`<p>${esc(p)}</p>`).join("\n")}
${secs}
<footer>
  PickLock LLC · Delaware ·
  <a href="/terms.html">Terms</a> ·
  <a href="/privacy.html">Privacy</a> ·
  <a href="mailto:joe@picklockapp.com">joe@picklockapp.com</a>
</footer>
</div>
</body>
</html>`;
};
fs.mkdirSync("public",{recursive:true});
for(const k of ["terms","privacy"]){
  fs.writeFileSync("public/"+k+".html", page(k));
  console.log("wrote public/"+k+".html");
}
