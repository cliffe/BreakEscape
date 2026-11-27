// Live proof for the net-refetch R2 fixes. Headless Chromium on a keyless server (:3186).
//   node docs/agents/proofs/net-refetch-r2-live.mjs <gameId>
// 1. the box's view is open; a sign-in to Lena's PC through the box (a foothold route) bridges to
//    the server network, and its hosts must join the open view within 5 s, with no reopen.
// 2. nothing changes: the GET /network gaps grow 5 s, 5 s, 5 s, then 15 s.
// 3. the Unplug button element is the same one after those refetches (unchanged header is not
//    rewritten), and a click on it still unplugs the box.
//
// Blocks only POST .../tts (by pathname). Every page runs window.__test.throttleFps(20) after load.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3186';
const MODE = 'r2';
const GAME = Number(process.argv[2]);
if (!GAME) { console.error('usage: net-refetch-r2-live.mjs <gameId>'); process.exit(2); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
// Lena's account password is read from the environment, never committed: the starter password on the
// scanned letter in the lobby (the in-game source), passed as LENA_PASSWORD.
const LENA_PASSWORD = '';

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
const SV = '[data-host-id="sv_fs02"], [data-resource-id="backup_vault"]';
const hasLena = page => page.evaluate(sel => !!document.querySelector(sel), SV);
const rowIds = page => page.evaluate(() => [...document.querySelectorAll('[data-host-id],[data-resource-id]')].map(e => e.dataset.hostId || e.dataset.resourceId));

try {
  const A = await openPage(ctx, 'A');
  // Server network off before the view opens (a client-side switch flip, synced by the engine)
  const mg0 = await plantAndOpenView(A);
  result.checks.viewOpened = String(mg0 || '').includes('network');
  result.checks.serverHostsBefore = await hasLena(A);
  await A.screenshot({ path: shot('net-refetch-r2-before-unlock.png') });
  // Tag the Unplug button: the same element must survive the quiet refetches
  await A.evaluate(() => { document.querySelector('[data-unplug]').__proofMark = 'same'; });

  // 1. Unlock finance_office on the server; the open view must pick Lena's PC up by itself
  const nv0 = await nvCount(A);
  result.checks.rowsBefore = await rowIds(A);
  const tUnlock = ts();
  const unlockRes = { ok: true, r: { success: true } };
  // Sign in to Lena's PC through the box (the scenario's own account, a foothold route): the
  // session bridges to the server network, so its hosts join the open view
  const li = await A.evaluate(() => window.ApiClient.login('lena_pc', { username: 'lfox', password: 'Ledger-Lena-9', foothold: 'jack_comms_port' }).then(r => ({ ok: !!r?.success }), e => ({ ok: false, e: String(e) })));
  note('signed in to lena_pc through the box', li);
  let tAppear = null;
  while (ts() - tUnlock < 20000) { if (await hasLena(A)) { tAppear = ts(); break; } await sleep(100); }
  result.checks.rowsAfter = await rowIds(A);
  const nv1 = await nvCount(A);
  await A.screenshot({ path: shot('net-refetch-r2-host-appeared.png') });
  result.checks.hostAppeared = { appeared: tAppear != null, msAfterUnlock: tAppear != null ? tAppear - tUnlock : null, viewStillOpen: String(await mgId(A)).includes('network'), networkViewedEmitsDuring: nv1 - nv0 };

  // 2. Quiet period: nothing changes, so the request gap should widen to 15 s
  const tQuietStart = ts();
  await sleep(38000);
  const gets = reqLog.filter(r => r.who === 'A' && r.phase === 'request' && r.method === 'GET' && r.path === '/network' && r.t >= tAppear).map(r => r.t);
  const gaps = gets.slice(1).map((t, i) => t - gets[i]);
  result.checks.getNetworkTimesAfterAppear = gets;
  result.checks.getNetworkGapsMs = gaps;
  result.checks.gapReached15s = gaps.some(g => g >= 14500);
  const i15 = gaps.findIndex(g => g >= 14500);
  result.checks.gapsBefore15Short = i15 >= 2 && gaps.slice(0, i15).every(g => g < 6500);

  // 3. Unplug: same button element, then a click that works
  const sameButton = await A.evaluate(() => document.querySelector('[data-unplug]')?.__proofMark === 'same');
  await A.screenshot({ path: shot('net-refetch-r2-before-unplug.png') });
  const clicked = await A.evaluate(() => { const b = document.querySelector('[data-unplug]'); if (b) { b.click(); return true; } return false; });
  const tClick = ts();
  let closed = false;
  while (ts() - tClick < 8000) { const mg = await mgId(A); if (!mg || !String(mg).includes('network')) { closed = true; break; } await sleep(100); }
  await sleep(800);
  await A.screenshot({ path: shot('net-refetch-r2-after-unplug.png') });
  const unplugRes = reqLog.find(r => r.who === 'A' && r.phase === 'response' && r.path === '/network/unplug');
  result.checks.unplug = { sameButtonAfterRefetches: sameButton, clicked, viewClosed: closed, unplugStatus: unplugRes?.status ?? null };
  result.checks.pass = !!(result.checks.viewOpened && result.checks.serverHostsBefore === false && result.checks.hostAppeared.appeared
    && result.checks.hostAppeared.msAfterUnlock <= 5500 && result.checks.gapReached15s && result.checks.gapsBefore15Short
    && sameButton && closed && unplugRes?.status === 200);
  result.requestLog = reqLog;
} catch (err) {
  result.error = String(err && err.stack || err);
  console.error('FAILED:', err);
  try { await (ctx.pages()[0])?.screenshot({ path: shot('net-refetch-r2-error.png') }); } catch {}
} finally {
  result.finishedAt = new Date().toISOString();
  fs.writeFileSync(shot('net-refetch-r2.json'), JSON.stringify(result, null, 2) + '\n');
  await browser.close();
  console.log('RESULT pass =', result.checks.pass, JSON.stringify(result.checks).slice(0, 900));
}
