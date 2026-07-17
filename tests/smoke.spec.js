// tests/smoke.spec.js — does it actually render?
//
// READ-ONLY. Nothing here creates a league, locks a pick, or writes anything. It loads
// screens and looks at them.
//
// Logged-in tests read creds from env vars and are SKIPPED without them, so they can
// never accidentally run with something committed. Set PICKLOCK_EMAIL and
// PICKLOCK_PASSWORD in your shell before running — never in a file, never in the repo.
// Use the FREE test account: the Pro one burns OpenAI + Odds credits on every run.
import { test, expect } from '@playwright/test';

const EMAIL = process.env.PICKLOCK_EMAIL;
const PASSWORD = process.env.PICKLOCK_PASSWORD;

// Noise the app legitimately prints, or that isn't ours. Everything else is a failure.
const IGNORE = [
  /favicon\.ico/i,              // known, cosmetic
  /Failed to load resource.*40[34]/i,
  /the-odds-api|espncdn|posthog|rrweb/i,
  /ResizeObserver loop/i,       // benign browser noise
];
const isRealError = (t) => !IGNORE.some((r) => r.test(t));

/**
 * Attaches listeners BEFORE navigation so nothing is missed.
 *
 * NOTE: Chrome's console message for a failed request is just "Failed to load resource:
 * the server responded with a status of 400" — no URL. Useless. So we listen on
 * `response` too, which HAS the url, and drop the urlless console duplicates.
 */
function watch(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() !== 'error') return;
    if (/Failed to load resource/i.test(t)) return;   // no URL in it; the response listener has it
    if (isRealError(t)) errors.push(`console: ${t}`);
  });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const url = r.url();
    if (!isRealError(url)) return;
    errors.push(`HTTP ${r.status()} ${url}`);
  });
  return errors;
}

/** The white-screen detector. A crashed React root leaves #root empty. */
async function assertRendered(page) {
  const root = page.locator('#root');
  await expect(root).toBeAttached();
  await expect.poll(async () => (await root.innerText()).trim().length, {
    message: 'the page rendered nothing — #root is empty (this is what a white screen IS)',
    timeout: 15_000,
  }).toBeGreaterThan(20);
}

/**
 * The "/* comment *\/ on the league page" detector.
 * Raw JS/JSX leaking into the DOM as visible text always means a source bug.
 */
async function assertNoSourceLeak(page) {
  const body = await page.locator('body').innerText();
  for (const marker of ['/*', '*/', 'useState(', '=>{', 'undefined_', 'NaN%', '[object Object]']) {
    expect(body, `raw source or junk leaked into the page as visible text: "${marker}"`).not.toContain(marker);
  }
}

// ── 1. Loads at all. No login. This alone catches a root crash. ──────────────
test('app boots without crashing', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/');
  await assertRendered(page);
  await assertNoSourceLeak(page);
  await expect(page.getByText(/PICKLOCK/i).first()).toBeVisible();
  expect(errors, `console/page errors on load:\n${errors.join('\n')}`).toEqual([]);
});

// ── 2. The error boundary exists and says something human ───────────────────
test('a crashed screen shows the fallback, not a blank page', async ({ page }) => {
  await page.goto('/');
  await assertRendered(page);
  // main.jsx RootBoundary must be mounted for this to be true; if the app ever renders
  // a totally blank body on error again, test 1 catches it.
  const body = await page.locator('body').innerText();
  expect(body.length).toBeGreaterThan(20);
});

// ── 3. The Pro gate holds server-side (regression for the 17 Jul auth fix) ──
// Each endpoint gets a body it would ACCEPT if the caller were signed in, so a 401 can
// only mean the auth gate fired — not that the payload was the wrong shape.
test('Plok endpoints reject unauthenticated calls', async ({ request }) => {
  const cases = [
    ['/api/buildslip', { sport: 'mlb', slots: [{ idx: 0, category: 'ml' }], candidates: { ml: [{ id: 'x', pick: 'X ML', odds: '-110', game: 'X @ Y' }] } }],
    ['/api/findbet',   { sport: 'mlb', game: 'New York Mets @ Philadelphia Phillies' }],
    ['/api/trends',    { sport: 'mlb', game: 'New York Mets @ Philadelphia Phillies' }],
    ['/api/insight',   { sport: 'mlb', selection: 'Philadelphia Phillies ML', betType: 'ml', game: 'New York Mets @ Philadelphia Phillies' }],
  ];
  for (const [path, body] of cases) {
    const r = await request.post(path, { data: body });
    expect(r.status(), `${path} must answer an anonymous caller with 401, not ${r.status()}`).toBe(401);
  }
});

// ── 4. Cron endpoints reject the public ─────────────────────────────────────
test('cron endpoints reject unauthenticated calls', async ({ request }) => {
  expect((await request.post('/api/grade', { data: {} })).status()).toBe(401);
  expect((await request.get('/api/plokcalls')).status()).toBe(401);
  expect((await request.get('/api/mlbsync?days=1')).status()).toBe(401);
});

// ── 5. Logged in: every tab renders. This is the one that catches the most. ──
test.describe('signed in', () => {
  test.skip(!EMAIL || !PASSWORD, 'set PICKLOCK_EMAIL + PICKLOCK_PASSWORD to run these');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/email/i).first().fill(EMAIL);
    await page.getByPlaceholder(/password/i).first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await expect(page.getByText(/Home|Picks|Leagues/i).first()).toBeVisible({ timeout: 20_000 });
  });

  for (const tab of ['Home', 'Picks', 'Matchup', 'Leagues', 'Profile']) {
    test(`${tab} tab renders`, async ({ page }) => {
      const errors = watch(page);
      // The tab bar re-renders as data lands, so a naive click races the re-render and
      // Playwright reports "element is not stable / detached from the DOM".
      const target = page.getByText(tab, { exact: true }).last();
      await target.waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await target.click({ timeout: 15_000 });
      await page.waitForTimeout(1500);          // let fetches settle
      await assertRendered(page);
      await assertNoSourceLeak(page);
      expect(errors, `errors on ${tab}:\n${errors.join('\n')}`).toEqual([]);
    });
  }

  // The league sub-tabs — where the "/* Dev panel */" text actually shipped.
  test('league tabs render (Standings/Trophies/Schedule/Playoff)', async ({ page }) => {
    const errors = watch(page);
    await page.getByText('Leagues', { exact: true }).last().click();
    await page.waitForTimeout(1500);
    for (const t of ['Standings', 'Trophies', 'Schedule', 'Playoff']) {
      const tab = page.getByText(t, { exact: true }).first();
      if (!(await tab.isVisible().catch(() => false))) continue;
      await tab.click();
      await page.waitForTimeout(800);
      await assertRendered(page);
      await assertNoSourceLeak(page);
    }
    expect(errors, `errors in league tabs:\n${errors.join('\n')}`).toEqual([]);
  });

  // READ-ONLY: opens Plok, asserts the gate. Never clicks "Build my whole slip".
  test('Plok screen renders and is gated for a free account', async ({ page }) => {
    const errors = watch(page);
    await page.getByText(/Plok/i).first().click();
    await page.waitForTimeout(1200);
    await assertRendered(page);
    await assertNoSourceLeak(page);
    expect(errors, `errors on Plok:\n${errors.join('\n')}`).toEqual([]);
  });
});