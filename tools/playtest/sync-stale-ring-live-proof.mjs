// Live browser proof for the stale-but-recent sync ring plus the client re-stamp
// (docs/achitechture/SYNC_STALE_RING_PLAN.md, section 10 "Live browser proof", chunk 5).
//
// It drives the REAL flush path on a keyless server so the client itself stamps the reduced
// pagehide body D above the hidden flush H (nextClientTs), then holds both PUT /sync_state
// requests at the network layer (Playwright route) and releases the two in each order against
// the real controller. It reproduces:
//   gap 2 (playerHealth): H carries the pre-hit health, D the post-hit health; the newer
//                         health must win in both landing orders.
//   gap 3 (a global changed twice): H carries the older value of g, D the newer; the newer
//                                   value must win in both landing orders.
//   reload: page A's flush is held, the game is reloaded into page B, B syncs a newer value,
//           then A's older flush is released; B's value must stand.
// Each case asserts the persisted player_state through a fresh bootstrap (GET /scenario),
// never the page's own view.
//
// It drives the real re-stamp (it reads the stamps the client produced, never hand-picked
// stamps), so it proves the shipped client change, not a helper. Games are created only
// through the app's normal route (tools/playtest/new-game.rb).
//
//   node tools/playtest/sync-stale-ring-live-proof.mjs [--port 3670] [--mission test_simple_success]
//
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (or CHROMIUM) picks the browser; HEADED=1 shows it.
// The server must already be keyless and headless on the given port; this tool does not start
// or stop it. Exit 0 if every case passed, 1 otherwise.

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BIG = 'x'.repeat(45000);           // forces the pagehide body to go reduced beside H

function parseArgs(argv) {
  const opts = { port: 3670, mission: 'test_simple_success' };
  const a = [...argv];
  while (a.length) {
    const [name, inline] = a.shift().split('=', 2);
    const take = () => (inline !== undefined ? inline : a.shift());
    if (name === '--port') opts.port = Number(take());
    else if (name === '--mission') opts.mission = take();
  }
  return opts;
}

// Create a fresh game through the normal creation route and return its numeric id.
function newGame(mission, port) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/new-game.rb', mission], {
    env: { ...process.env, RBENV_VERSION: '2.7.8', PLAYTEST_PORT: String(port), BREAK_ESCAPE_STANDALONE: 'true' },
    encoding: 'utf8'
  });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error(`new-game.rb gave no GAME_ID:\n${out}`);
  return Number(m[1]);
}

async function openPage(browser, baseUrl, gameId) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', e => console.log('  PAGEERROR', String(e).slice(0, 160)));
  await page.goto(`${baseUrl}/break_escape/games/${gameId}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => {
    try { window.game?.physics?.world?.setFPS?.(20); } catch { /* ignore */ }
  });
  return page;
}

// Install a route that HOLDS every PUT /sync_state, collecting the held routes in order of
// arrival. Nothing is forwarded until releaseAndWait is called, so the test controls the order
// the server sees the two overlapping requests in.
function holdSyncState(page) {
  const held = [];
  page.route('**/sync_state', route => { held.push(route); });
  return held;
}

// Forward one held request to the real server and wait for the full response before returning,
// so the next release is strictly after this one committed (the server also serialises under
// Game.lock, but this pins the order the lock is taken in).
async function releaseAndWait(route) {
  const resp = await route.fetch();
  await route.fulfill({ response: resp });
  return resp;
}

async function waitFor(pred, ms = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (pred()) return true;
    await new Promise(r => setTimeout(r, 25));
  }
  return false;
}

// A fresh bootstrap read of the persisted player_state (not the page's view).
async function bootstrap(baseUrl, gameId) {
  const r = await fetch(`${baseUrl}/break_escape/games/${gameId}/scenario`);
  if (!r.ok) throw new Error(`bootstrap GET failed: ${r.status}`);
  return r.json();
}

// Baseline: set a seed global and sync it, so the server holds a ring entry below the flushes
// that follow (the completeness guard then holds when H lands stale-but-recent). Then stop the
// auto-sync so only the explicit hidden/pagehide flushes produce PUTs.
async function baseline(page) {
  await page.evaluate(() => { window.gameState.globalVariables.seed = 1; });
  await page.evaluate(() => window.stateSync.sync());
  await page.evaluate(() => window.stateSync.stop());
}

// Reproduce one gap. kind 'health' uses playerHealth (a whole-section claim); kind 'global'
// uses the global g (a per-key claim). order 'Dfirst' releases the newer body D first, 'Hfirst'
// releases the older hidden flush H first. Returns { tsH, tsD, result } where result is the
// persisted value the assertion checks.
async function driveGap(browser, baseUrl, mission, port, { kind, order }) {
  const gameId = newGame(mission, port);
  const page = await openPage(browser, baseUrl, gameId);
  await baseline(page);

  const held = holdSyncState(page);

  // H: a big blob (so the pagehide body cannot fit beside it and goes reduced) plus the OLD
  // value of the contested section.
  await page.evaluate(b => { window.gameState.globalVariables.blob = b; }, BIG);
  if (kind === 'health') await page.evaluate(() => window.playerHealth.damage(10)); // 100 -> 90 (old)
  else await page.evaluate(() => { window.gameState.globalVariables.g = 5; });       // old
  await page.evaluate(() => window.stateSync.flush({ reason: 'hidden' }));
  await waitFor(() => held.length >= 1);

  // D: the NEW value. The pagehide body is re-stamped ABOVE H by the client.
  if (kind === 'health') await page.evaluate(() => window.playerHealth.damage(20)); // 90 -> 70 (new)
  else await page.evaluate(() => { window.gameState.globalVariables.g = 7; });        // new
  await page.evaluate(() => window.stateSync.flush({ reason: 'pagehide' }));
  await waitFor(() => held.length >= 2);

  const [H, D] = held;
  const tsH = H.request().postDataJSON().clientTs;
  const tsD = D.request().postDataJSON().clientTs;

  if (order === 'Dfirst') { await releaseAndWait(D); await releaseAndWait(H); }
  else { await releaseAndWait(H); await releaseAndWait(D); }

  await page.close();
  const boot = await bootstrap(baseUrl, gameId);
  const result = kind === 'health' ? boot.savedPlayerHealth?.hp : boot.savedGlobalVariables?.g;
  const blob = boot.savedGlobalVariables?.blob;
  return { gameId, tsH, tsD, result, blobPresent: blob === BIG };
}

// The reload case: page A holds its flush (older stamp), the game reloads into page B which
// syncs a newer value for the same key, then A's older flush is released. B's value must stand.
async function driveReload(browser, baseUrl, mission, port) {
  const gameId = newGame(mission, port);
  const pageA = await openPage(browser, baseUrl, gameId);
  await baseline(pageA);

  const held = holdSyncState(pageA);
  await pageA.evaluate(() => { window.gameState.globalVariables.g = 'A'; });
  await pageA.evaluate(() => window.stateSync.flush({ reason: 'hidden' })); // A's flush, held
  await waitFor(() => held.length >= 1);
  const tsA = held[0].request().postDataJSON().clientTs;

  // Reload into page B (a fresh page on the same game). It bootstraps from the server (A's
  // flush has not landed), sets a newer value and syncs it.
  const pageB = await openPage(browser, baseUrl, gameId);
  await pageB.evaluate(() => { window.gameState.globalVariables.g = 'B'; });
  await pageB.evaluate(() => window.stateSync.sync());
  const tsB = await pageB.evaluate(() => window.stateSync.lastClientTs);
  await pageB.close();

  // Release A's older flush: it lands stale-but-recent, B claimed g, so A's g is skipped.
  await releaseAndWait(held[0]);
  await pageA.close();

  const boot = await bootstrap(baseUrl, gameId);
  return { gameId, tsA, tsB, result: boot.savedGlobalVariables?.g };
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = `http://127.0.0.1:${opts.port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM;
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1', ...(exe ? { executablePath: exe } : {}) });

  const checks = [];
  const record = (name, pass, detail) => { checks.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

  try {
    for (const order of ['Dfirst', 'Hfirst']) {
      const g2 = await driveGap(browser, baseUrl, opts.mission, opts.port, { kind: 'health', order });
      record(`gap2 health, ${order}`, g2.result === 70 && g2.tsD > g2.tsH && g2.blobPresent,
        `game ${g2.gameId} tsH=${g2.tsH} tsD=${g2.tsD} (D>H ${g2.tsD > g2.tsH}) health=${g2.result} blob=${g2.blobPresent}`);

      const g3 = await driveGap(browser, baseUrl, opts.mission, opts.port, { kind: 'global', order });
      record(`gap3 global g, ${order}`, g3.result === 7 && g3.tsD > g3.tsH && g3.blobPresent,
        `game ${g3.gameId} tsH=${g3.tsH} tsD=${g3.tsD} (D>H ${g3.tsD > g3.tsH}) g=${g3.result} blob=${g3.blobPresent}`);
    }
    const rl = await driveReload(browser, baseUrl, opts.mission, opts.port);
    record('reload A held, B wins', rl.result === 'B' && rl.tsB > rl.tsA,
      `game ${rl.gameId} tsA=${rl.tsA} tsB=${rl.tsB} (B>A ${rl.tsB > rl.tsA}) g=${rl.result}`);
  } finally {
    await browser.close();
  }

  const failed = checks.filter(c => !c.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(e => { console.error(e); process.exit(1); });
}
