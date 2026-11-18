// Live proof for build/net-refetch-sync (plan 9.3b 5.2): the five-second network view refetch and
// the state sync sent before a remote sign-in. Headless Chromium on a keyless server.
//
// Usage (from the worktree, so playwright resolves its node_modules):
//   node docs/agents/proofs/net-refetch-sync-live.mjs refetch <gameId>
//   node docs/agents/proofs/net-refetch-sync-live.mjs signin  <gameId>
//
// refetch: page A holds the drop box's view on jack_comms_port. Page B (same browser context,
//          so same session) unplugs the box. Page A must drop the view within about 5 s, without
//          a reopen and without a second network_viewed.
// signin:  page A flips a global client-side, then signs in to lena_pc through the box (a foothold
//          route). The PUT sync_state carrying the flip must reach the server before POST login.
//
// Blocks only POST .../tts (by pathname). Every page runs window.__test.throttleFps(20) after load.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3186';
const MODE = process.argv[2];
const GAME = Number(process.argv[3]);
if (!['refetch', 'signin'].includes(MODE) || !GAME) {
  console.error('usage: net-refetch-sync-live.mjs refetch|signin <gameId>');
  process.exit(2);
}
const HERE = path.dirname(new URL(import.meta.url).pathname);
// Lena's account password is read from the environment, never committed: the starter password on the
// scanned letter in the lobby (the in-game source), passed as LENA_PASSWORD.
const LENA_PASSWORD = process.env.LENA_PASSWORD || '';
if (MODE === 'signin' && !LENA_PASSWORD) { console.error('signin needs LENA_PASSWORD in the environment'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const ts = () => Date.now() - t0;
const reqLog = []; // every game request in order: { t, phase, method, path, body, status }
const steps = [];
const result = { mode: MODE, gameId: GAME, base: BASE, startedAt: new Date().toISOString(), steps, checks: {} };
const note = (step, data = {}) => { steps.push({ t: ts(), step, ...data }); console.log(`[${ts()}ms] ${step}`, Object.keys(data).length ? JSON.stringify(data).slice(0, 300) : ''); };

async function clearUi(page) {
  for (let i = 0; i < 20; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
    if (!st.mg && !st.blk) break;
    if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
    else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
    else {
      let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
      if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
    }
    await sleep(600);
  }
}

function watch(page, who) {
  const keep = u => u.includes(`/break_escape/games/${GAME}`) && /\/(network|login|sync_state|unplug|plant|logout)(\?|$)/.test(u.replace(/^.*\/break_escape\/games\/\d+/, ''));
  page.on('request', req => {
    if (!keep(req.url())) return;
    reqLog.push({ t: ts(), who, phase: 'request', method: req.method(), path: new URL(req.url()).pathname.replace(/^.*\/games\/\d+/, ''), body: (req.postData() || '').slice(0, 400) });
  });
  page.on('response', res => {
    if (!keep(res.url())) return;
    const entry = { t: ts(), who, phase: 'response', method: res.request().method(), path: new URL(res.url()).pathname.replace(/^.*\/games\/\d+/, ''), status: res.status() };
    reqLog.push(entry);
    if (entry.path === '/login') res.text().then(b => { entry.answer = b.slice(0, 300); }).catch(() => {});
  });
}

async function openPage(ctx, who) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch {} });
  // Block only the TTS POST (keyless server: no TTS anyway)
  await page.route(u => new URL(u).pathname.endsWith('/tts'), r => (r.request().method() === 'POST' ? r.abort() : r.continue()));
  watch(page, who);
  await page.goto(`${BASE}/break_escape/games/${GAME}?skip_resume=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 180000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  await page.evaluate(() => window.__test.throttleFps(20));
  // Count network_viewed emits from here on (the view emits through window.eventDispatcher)
  await page.evaluate(() => {
    window.__nv = [];
    const d = window.eventDispatcher;
    if (d && typeof d.emit === 'function' && !d.__nvWrapped) {
      const o = d.emit.bind(d);
      d.emit = (name, data) => { if (name === 'network_viewed') window.__nv.push({ name, at: performance.now() }); return o(name, data); };
      d.__nvWrapped = true;
    }
  });
  await clearUi(page);
  return page;
}

const mgId = page => page.evaluate(() => window.__test.getState().activeMinigame?.id || null);
const nvCount = page => page.evaluate(() => (window.__nv || []).length);

// Walk to the comms room, plant the box in the port, and make sure the box's network view is open.
async function plantAndOpenView(page) {
  const e = await page.evaluate(() => window.__test.enterRoom('comms_room'));
  note('enter comms_room', { ok: e?.ok });
  const i = await page.evaluate(() => window.__test.interact('comms_port'));
  note('interact comms_port (plant)', { confirmed: i?.confirmed, via: i?.via });
  await sleep(800);
  const d = await page.evaluate(() => window.__test.dismissBlockingUi('Plug it in'));
  note('confirm "Plug it in"', { ok: d?.ok });
  await sleep(2000);
  let mg = await mgId(page);
  if (mg !== 'network-view' && !String(mg || '').includes('network')) {
    await page.evaluate(() => window.__test.interact('comms_port'));
    await sleep(1500);
    mg = await mgId(page);
  }
  note('view open', { minigame: mg });
  return mg;
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const shot = name => path.join(HERE, name);

try {
  const A = await openPage(ctx, 'A');
  note('page A loaded');
  const mg0 = await plantAndOpenView(A);
  result.checks.viewOpenedInA = String(mg0 || '').includes('network');

  if (MODE === 'refetch') {
    // Let the view run a while with nothing changing: its own refetches must go out on a cadence.
    const nvBefore = await nvCount(A);
    await sleep(12000);
    const nvAfterQuiet = await nvCount(A);
    await A.screenshot({ path: shot('net-refetch-sync-before.png') });
    note('quiet period', { nvBefore, nvAfterQuiet });

    // Page B: same session, same game. Unplug the box from its own view.
    const B = await openPage(ctx, 'B');
    await B.evaluate(() => window.__test.enterRoom('comms_room'));
    await B.evaluate(() => window.__test.interact('comms_port'));
    await sleep(1500);
    const mgB = await mgId(B);
    note('page B view', { minigame: mgB });
    const tUnplugClick = ts();
    const clicked = await B.evaluate(() => { const b = document.querySelector('[data-unplug]'); if (b) { b.click(); return true; } return false; });
    note('page B clicks Unplug', { clicked, at: tUnplugClick });
    await sleep(1500);
    await B.close();

    // Page A: wait for its view to drop, polling the DOM and the minigame state
    let tClose = null, closeReason = null, toast = null;
    const deadline = ts() + 20000;
    while (ts() < deadline) {
      const mg = await mgId(A);
      if (!mg || !String(mg).includes('network')) {
        tClose = ts();
        closeReason = mg ? `minigame now ${mg}` : 'minigame closed';
        break;
      }
      await sleep(100);
    }
    toast = await A.evaluate(() => (document.body.innerText || '').match(/[^\n]*link is gone[^\n]*/i)?.[0] || null).catch(() => null);
    await A.screenshot({ path: shot('net-refetch-sync-after.png') }).catch(() => {});
    const nvEnd = await nvCount(A);
    const getNetwork = reqLog.filter(r => r.who === 'A' && r.phase === 'request' && r.method === 'GET' && r.path === '/network').map(r => r.t);
    const unplugRes = reqLog.find(r => r.who === 'B' && r.phase === 'response' && r.path === '/network/unplug');
    const latency = tClose != null ? tClose - unplugRes?.t : null;
    result.checks.pageBUnplugResponded = { status: unplugRes?.status ?? null, t: unplugRes?.t ?? null };
    result.checks.viewDroppedInA = { closed: tClose != null, reason: closeReason, toast, msAfterUnplugResponse: latency };
    result.checks.withinFiveSeconds = latency != null && latency <= 5000 + 500;
    result.checks.networkViewedEmits = { atStart: nvBefore, endOfRun: nvEnd, secondEmitWhileOpen: nvEnd > nvBefore };
    result.checks.getNetworkA = getNetwork.map(t => t);
    result.checks.getNetworkGapsMs = getNetwork.slice(1).map((t, i) => t - getNetwork[i]);
    result.checks.pass = result.checks.viewOpenedInA && result.checks.withinFiveSeconds && tClose != null && !result.checks.networkViewedEmits.secondEmitWhileOpen && nvBefore === 1;
  }

  if (MODE === 'signin') {
    const nvBefore = await nvCount(A);
    // Flip a global client side (what a switch's set_global does), then sign in right away.
    await A.evaluate(() => { window.gameState.globalVariables.live_proof_flip = true; });
    const tFlip = ts();
    note('flipped global live_proof_flip client side', { at: tFlip });
    const clickedSignIn = await A.evaluate(() => { const b = document.querySelector('[data-host-id="lena_pc"] [data-action="sign-in"]'); if (b) { b.click(); return true; } return false; });
    note('clicked lena_pc sign-in row', { clickedSignIn });
    await sleep(1500);
    const screen = await A.evaluate(() => ({ mg: window.__test.getState().activeMinigame?.id || null, tiles: document.querySelectorAll('.signin-tile').length, other: !!document.querySelector('.signin-other') }));
    note('remote sign-in screen', screen);
    if (screen.other) await A.evaluate(() => window.__test.minigame.clickText('Other user')).catch(() => {});
    await sleep(400);
    await A.evaluate(() => window.__test.minigame.type(0, 'lfox')).catch(e => note('type username failed', { e: String(e) }));
    await sleep(300);
    await A.evaluate(p => window.__test.minigame.type(1, p, { submit: true }), LENA_PASSWORD).catch(e => note('type password failed', { e: String(e) }));
    await sleep(3000);
    await A.screenshot({ path: shot('net-refetch-sync-signin.png') }).catch(() => {});
    const sessions = await A.evaluate(() => window.__test.access?.sessions?.() ?? null).catch(() => null);
    const syncs = reqLog.filter(r => r.who === 'A' && r.phase === 'request' && r.method === 'PUT' && r.path === '/sync_state');
    const flipSync = syncs.find(r => r.body.includes('live_proof_flip'));
    const logins = reqLog.filter(r => r.who === 'A' && r.phase === 'request' && r.path === '/login');
    const login = logins.find(r => r.body.includes('lfox')) || logins[0];
    const loginRes = reqLog.find(r => r.who === 'A' && r.phase === 'response' && r.path === '/login');
    result.checks.syncWithFlip = flipSync ? { t: flipSync.t, bodyHasFlip: true } : { t: null, bodyHasFlip: false };
    result.checks.loginRequest = login ? { t: login.t, foothold: login.body.includes('foothold'), body: login.body.split(LENA_PASSWORD).join('<redacted>') } : null;
    result.checks.loginResponseStatus = loginRes?.status ?? null;
    result.checks.syncBeforeLogin = !!(flipSync && login && flipSync.t <= login.t);
    result.checks.sessionsAfter = sessions;
    result.checks.networkViewedEmitsDuringSignin = (await nvCount(A)) - nvBefore;
    result.checks.pass = result.checks.syncBeforeLogin && result.checks.loginResponseStatus === 200 && result.checks.loginRequest?.foothold === true;
  }

  result.requestLog = reqLog;
} catch (err) {
  result.error = String(err && err.stack || err);
  console.error('FAILED:', err);
  try { await (ctx.pages()[0])?.screenshot({ path: shot(`net-refetch-sync-${MODE}-error.png`) }); } catch {}
} finally {
  result.finishedAt = new Date().toISOString();
  // Never write the account password: redact it from every logged body first
  let text = JSON.stringify(result, null, 2) + '\n';
  if (LENA_PASSWORD) text = text.split(LENA_PASSWORD).join('<redacted>');
  fs.writeFileSync(shot(`net-refetch-sync-${MODE}.json`), text);
  await browser.close();
  console.log('RESULT pass =', result.checks.pass, '->', shot(`net-refetch-sync-${MODE}.json`));
}
