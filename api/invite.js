/**
 * /api/invite.js — the ONE link every PickLock invite points at.
 *
 * The bug this replaces: the referral share built
 * "https://picklockapp.com/?ref=CODE" — the MARKETING host — while the ?ref=
 * reader lives in App.jsx on app.picklockapp.com. The code was dropped on every
 * signup. League invites were worse: plain text with a 6-char code and NO link
 * at all, so a friend without the app had no path to it.
 *
 * There are no iOS universal links yet (no apple-app-site-association is served,
 * and adding one needs an Xcode entitlement + a new build + review). So this
 * cannot silently open the installed native app. What it CAN do — and what
 * matters for Week 1 — is never lose the code and always offer a real way in.
 *
 * Usage:
 *   /api/invite?join=ABC123          league invite (code shown + carried)
 *   /api/invite?ref=XYZ789           referral invite
 *   /api/invite?join=ABC123&n=Gapers league name for the headline
 *
 * Behavior: a fast, self-contained page (no framework, no fetch) that shows the
 * code in text — so it survives even if every button is ignored — plus:
 *   iPhone/iPad -> App Store button first, "Open in browser" second
 *   Android     -> web app first (Play listing is still in review; when it's
 *                  live, flip PLAY_URL on and it becomes the primary button)
 *   Desktop     -> straight into the web app
 * Every path forwards the code to app.picklockapp.com as ?join=/?ref=, which
 * App.jsx stashes and applies after sign-in.
 *
 * NOTE: iOS drops query params across an App Store install, so the code is
 * ALSO printed as copyable text. That is not a fallback, it is the primary
 * guarantee — deferred deep linking is not free on iOS.
 */

const APP = "https://app.picklockapp.com";
const APPSTORE = "https://apps.apple.com/us/app/id6793371434";
const PLAY_URL = null; // set to the Play listing once Google approves

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export default function handler(req, res) {
  const q = req.query || {};
  const join = String(q.join || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const ref = String(q.ref || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const leagueName = String(q.n || "").slice(0, 60);
  const code = join || ref;
  const param = join ? `join=${join}` : (ref ? `ref=${ref}` : "");
  const appUrl = param ? `${APP}/?${param}` : APP;

  const ua = String(req.headers["user-agent"] || "");
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const headline = join
    ? (leagueName ? `You're invited to ${esc(leagueName)}` : "You're invited to a PickLock league")
    : "Join me on PickLock";
  const sub = join
    ? "Make picks on the real games each week. Head to head matchups, playoffs, someone wins the season. No money in it."
    : "Fantasy pick'em for group chats. No draft, no waivers, no money in it.";

  // Primary button differs by platform; the app link is always present.
  const primary = isIOS
    ? { href: APPSTORE, label: "Get PickLock on the App Store" }
    : (isAndroid && PLAY_URL)
      ? { href: PLAY_URL, label: "Get PickLock on Google Play" }
      : { href: appUrl, label: "Open PickLock" };
  const secondary = isIOS
    ? { href: appUrl, label: "Already have it? Open the app" }
    : (isAndroid && PLAY_URL)
      ? { href: appUrl, label: "Or open in your browser" }
      : null;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(headline)}</title>
<meta property="og:title" content="${esc(headline)}">
<meta property="og:description" content="${esc(sub)}">
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@600;700;800;900&family=Barlow+Semi+Condensed:wght@800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#000;color:#fff;font-family:Barlow,system-ui,sans-serif;min-height:100vh;
       display:flex;align-items:center;justify-content:center;padding:28px 20px}
  .wrap{width:100%;max-width:420px;text-align:center}
  .mark{font-size:13px;font-weight:900;letter-spacing:3px;color:#3B6FE0;margin-bottom:26px}
  h1{font-size:27px;font-weight:900;letter-spacing:-0.5px;line-height:1.15;margin-bottom:10px}
  p.sub{font-size:14.5px;line-height:1.5;color:rgba(255,255,255,0.6);margin-bottom:24px}
  .codebox{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);
           border-radius:16px;padding:16px;margin-bottom:12px}
  .codebox .k{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
              color:rgba(255,255,255,0.4);margin-bottom:7px}
  .codebox .v{font-family:'Barlow Semi Condensed',sans-serif;font-size:35px;font-weight:900;
              letter-spacing:7px;color:#fff}
  .copy{margin-top:11px;font-size:12px;font-weight:800;color:#3B6FE0;cursor:pointer;
        background:none;border:none;font-family:inherit;padding:6px}
  a.btn{display:block;text-decoration:none;border-radius:15px;padding:16px;font-size:15.5px;
        font-weight:800;margin-bottom:10px}
  a.primary{background:#3B6FE0;color:#fff}
  a.secondary{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.14)}
  .note{font-size:11.5px;color:rgba(255,255,255,0.35);line-height:1.55;margin-top:16px}
</style></head>
<body><div class="wrap">
  <div class="mark">PICKLOCK</div>
  <h1>${esc(headline)}</h1>
  <p class="sub">${esc(sub)}</p>
  ${code ? `<div class="codebox">
    <div class="k">${join ? "League code" : "Referral code"}</div>
    <div class="v" id="code">${esc(code)}</div>
    <button class="copy" id="copy">Copy code</button>
  </div>` : ""}
  <a class="btn primary" href="${esc(primary.href)}">${esc(primary.label)}</a>
  ${secondary ? `<a class="btn secondary" href="${esc(secondary.href)}">${esc(secondary.label)}</a>` : ""}
  ${code ? `<p class="note">Write the code down before you install${isIOS ? " — the App Store won't carry it over" : ""}. After you sign in, enter it under Leagues to join.</p>` : ""}
</div>
<script>
  var b=document.getElementById("copy");
  if(b){b.addEventListener("click",function(){
    var t=document.getElementById("code").textContent.trim();
    if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){b.textContent="Copied";},function(){});}
  });}
</script>
</body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).send(html);
}
