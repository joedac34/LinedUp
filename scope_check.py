"""Catch undefined identifiers inside screen/tab IIFE blocks — the class of bug
esbuild compiles happily and that then throws at runtime (SIDE_A, _sA, lg).
For each `{cond && (()=>{ ... })()}` block, check that every bare identifier it
references is either declared inside the block, declared at module level, or
declared in the App component before the block starts."""
import io, re, sys

s = io.open('App.jsx', newline='').read()

def depth(idx, _cache={}):
    d = 0
    for ch in s[:idx]:
        if ch == '{': d += 1
        elif ch == '}': d -= 1
    return d

# every declaration in the file, with its position and brace depth
decls = {}
for m in re.finditer(r'\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)', s):
    decls.setdefault(m.group(1), []).append(m.start())
for m in re.finditer(r'\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\]\s*=\s*useState', s):
    decls.setdefault(m.group(1), []).append(m.start())
    decls.setdefault(m.group(2), []).append(m.start())

BUILTIN = set("""if for while return typeof catch switch new delete void in of do else try finally
throw class extends super this null true false undefined async await function const let var
String Number Boolean Array Object JSON Math Date RegExp Map Set Promise Error fetch console
window document localStorage navigator setTimeout setInterval clearInterval clearTimeout
parseInt parseFloat isNaN encodeURIComponent decodeURIComponent URL Blob File FormData
React Fragment key style className children props
alert confirm prompt isFinite supabase posthog Intl crypto performance location
requestAnimationFrame cancelAnimationFrame structuredClone URLSearchParams AbortController""".split())

blocks = []
for m in re.finditer(r'\{(screen|leagueTab|leagueSubTab|homeMode|homeTab)===("[^"]+")[^\n]{0,120}?\(\(\)=>\{', s):
    start = m.start()
    d0 = depth(start)
    i = m.end(); d = 1
    while i < len(s) and d > 0:
        if s[i] == '{': d += 1
        elif s[i] == '}': d -= 1
        i += 1
    blocks.append((m.group(1)+'==='+m.group(2), start, i))

problems = []
for name, start, end in blocks:
    blk = s[start:end]
    # strip comments and strings so prose and JSX text don't create false hits
    st = re.sub(r'//[^\r\n]*', '', blk)
    st = re.sub(r'/\*.*?\*/', '', st, flags=re.S)
    st = re.sub(r'"(?:[^"\\]|\\.)*"', '""', st)
    st = re.sub(r"'(?:[^'\\]|\\.)*'", "''", st)
    st = re.sub(r'`(?:[^`\\]|\\.)*`', '``', st)
    # ignore JSX tag names and object keys
    st = re.sub(r'>[^<>{}]{2,}<', '><', st)      # JSX text nodes are prose, not code
    st = re.sub(r'<\/?[A-Za-z][\w.]*', ' ', st)
    st = re.sub(r'([A-Za-z_$][\w$]*)\s*:', ' ', st)

    inside = set(re.findall(r'\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)', blk))
    inside |= set(re.findall(r'\(\s*([a-z_$][\w$]*)\s*(?:,|\))', blk))
    inside |= set(re.findall(r'\(\s*\[?\s*([a-z_$][\w$]*)\s*,\s*([a-z_$][\w$]*)', blk) and
                  [x for t in re.findall(r'\(\s*([a-z_$][\w$]*)\s*,\s*([a-z_$][\w$]*)(?:\s*,\s*([a-z_$][\w$]*))?\s*\)\s*=>', blk) for x in t if x])
    inside |= set(re.findall(r'\{\s*([A-Za-z_$][\w$]*)\s*\}\s*=', blk))

    for m2 in re.finditer(r'(?<![\w$.])([a-z_$][\w$]*)(?=\s*[.\[(])', st):
        ident = m2.group(1)
        if ident in BUILTIN or ident in inside:
            continue
        pos = decls.get(ident)
        if not pos:
            problems.append((name, ident, 'NEVER DECLARED', s[:start+m2.start()].count('\n')+1))
            continue
        # must be declared at module level, or earlier in an enclosing scope
        ok = any(p < start and depth(p) <= depth(start) for p in pos)
        if not ok:
            ln = s[:start+m2.start()].count('\n')+1
            problems.append((name, ident, 'OUT OF SCOPE', ln))

seen=set(); out=[]
for p in problems:
    k=(p[0],p[1])
    if k in seen: continue
    seen.add(k); out.append(p)

if out:
    print("PROBLEMS (%d):" % len(out))
    for blk, ident, why, ln in out:
        print("  %-34s %-18s %-14s line %d" % (blk, ident, why, ln))
    sys.exit(1)
print("scope check clean across %d screen/tab blocks" % len(blocks))
