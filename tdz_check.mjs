/**
 * tdz_check.mjs — catches the one bug class esbuild and eslint no-undef both miss.
 *
 * `const X = (()=>{...})()` in a component body runs DURING RENDER. If it reads a
 * const/let declared further down that same body you get:
 *     Uncaught ReferenceError: Cannot access 'Ea' before initialization
 * ...and a white screen. esbuild sees valid syntax. no-undef sees a defined name.
 * eslint no-use-before-define can't gate it (48 pre-existing benign hits in App.jsx —
 * callbacks that reference later declarations but only run after mount).
 *
 * Real scope analysis via acorn. Only flags an IIFE that reads a later declaration
 * from an ENCLOSING function scope — the case that actually throws.
 *
 * Usage: node tdz_check.mjs App.jsx     (exit 1 on risk)
 */
import fs from "fs";
import * as acorn from "acorn";
import jsx from "acorn-jsx";
import * as walk from "acorn-walk";
import { extend } from "acorn-jsx-walk";

const file = process.argv[2] || "App.jsx";
const src = fs.readFileSync(file, "utf8");
const Parser = acorn.Parser.extend(jsx());
extend(walk.base);
const ast = Parser.parse(src, { ecmaVersion: 2022, sourceType: "module", locations: true });

const isIIFE = (n) => n && n.type === "CallExpression" && !n.arguments.length &&
  (n.callee.type === "ArrowFunctionExpression" || n.callee.type === "FunctionExpression");
const FN = new Set(["FunctionDeclaration","FunctionExpression","ArrowFunctionExpression"]);

// Collect const/let declarations per function scope, with their start offsets.
const scopes = new Map(); // fnNode -> Map(name -> start)
function bindName(map, id, start) {
  if (!id) return;
  if (id.type === "Identifier") { if (!map.has(id.name)) map.set(id.name, start); }
  else if (id.type === "ObjectPattern") id.properties.forEach(p => bindName(map, p.value || p.argument, start));
  else if (id.type === "ArrayPattern") id.elements.forEach(e => e && bindName(map, e, start));
  else if (id.type === "AssignmentPattern") bindName(map, id.left, start);
  else if (id.type === "RestElement") bindName(map, id.argument, start);
}
const stack = [];
walk.ancestor(ast, {}, undefined, undefined);
(function collect(node, fn) {
  if (!node || typeof node.type !== "string") return;
  if (FN.has(node.type)) { fn = node; if (!scopes.has(fn)) scopes.set(fn, new Map()); }
  if (node.type === "VariableDeclaration" && node.kind !== "var" && fn) {
    for (const d of node.declarations) bindName(scopes.get(fn), d.id, d.start);
  }
  for (const k in node) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === "string" && collect(c, fn));
    else if (v && typeof v.type === "string") collect(v, fn);
  }
})(ast, null);

// Find IIFEs, walk their bodies, compare references to enclosing-scope declarations.
const problems = [];
(function scan(node, fnChain) {
  if (!node || typeof node.type !== "string") return;
  const nextChain = FN.has(node.type) ? [...fnChain, node] : fnChain;
  if (node.type === "VariableDeclarator" && isIIFE(node.init)) {
    const at = node.start;
    const name = node.id.name || "(destructured)";
    const inner = new Set();
    (function locals(n) {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "VariableDeclarator") bindName({ set:(k)=>inner.add(k), has:()=>false }, n.id, 0);
      if (FN.has(n.type)) (n.params||[]).forEach(p => bindName({ set:(k)=>inner.add(k), has:()=>false }, p, 0));
      for (const k in n) { const v = n[k];
        if (Array.isArray(v)) v.forEach(c => c && typeof c.type === "string" && locals(c));
        else if (v && typeof v.type === "string") locals(v); }
    })(node.init);
    (function refs(n) {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "MemberExpression" && !n.computed) { refs(n.object); return; }
      if (n.type === "Property" && !n.computed) { refs(n.value); return; }
      if (n.type === "Identifier" && !inner.has(n.name)) {
        for (const fn of fnChain) {
          const d = scopes.get(fn);
          if (d && d.has(n.name) && d.get(n.name) > at) {
            problems.push({ line: src.slice(0, at).split("\n").length, name, ident: n.name,
                            declLine: src.slice(0, d.get(n.name)).split("\n").length });
          }
        }
      }
      for (const k in n) { const v = n[k];
        if (Array.isArray(v)) v.forEach(c => c && typeof c.type === "string" && refs(c));
        else if (v && typeof v.type === "string") refs(v); }
    })(node.init);
  }
  for (const k in node) { const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === "string" && scan(c, nextChain));
    else if (v && typeof v.type === "string") scan(v, nextChain); }
})(ast, []);

const uniq = [...new Map(problems.map(p => [`${p.name}|${p.ident}`, p])).values()];
if (uniq.length) {
  console.log(`TDZ RISK in ${file} — render-time IIFE reads a later declaration:\n`);
  for (const p of uniq.sort((a,b)=>a.line-b.line))
    console.log(`  line ${p.line}: const ${p.name} = (()=>{...})()  reads '${p.ident}' declared at line ${p.declLine}`);
  console.log("\nFix: move the IIFE below the declaration it reads.");
  process.exit(1);
}
console.log(`TDZ check clean (${file})`);
