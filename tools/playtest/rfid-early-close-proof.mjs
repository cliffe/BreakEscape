// Live proof: closing a minigame during its success hold commits the unlock (fix/rfid-early-close).
// Keyless server, headless, throttled to 20 fps. Never touches :3000/:3001.
//   node tools/playtest/rfid-early-close-proof.mjs <gameId> <port> <outdir> [step]
// Cases (m04, start room battery_hall_1, door battery_hall_1 -> battery_hall_2, RFID Level 1):
//   early   - cloner Saved > Emulate, close the minigame ~250 ms after "Access Granted": POST /unlock 200, door open after reload
//   control - same, wait out the full hold: unlocks exactly once
import { createRequire } from 'node:module';
import fs from 'node:fs';
const REPO_ROOT = new URL('../../', import.meta.url).pathname;
const require = createRequire(`${REPO_ROOT}node_modules/`);
const { chromium } = require('playwright-core');
const EXEC = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`;
const [gid, port, OUT, only = 'all'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}`;
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const browser = await chromium.launch({ headless: true, executablePath: EXEC });

async function clearUi(page) {
  let clean = 0;
  for (let i = 0; i < 30 && clean < 2; i++) {
    const st = await page.evaluate(() => { const s = window.__test.getState(); return { mg: s.activeMinigame?.id || null, blk: !!(s.blockingUi || s.player?.blocking) }; }).catch(() => ({ mg: 'x', blk: false }));
    if (!st.mg && !st.blk) { clean++; await sleep(300); continue; }
    clean = 0;
    if (st.mg === 'title-screen') await page.keyboard.press('Enter').catch(() => {});
    else if (st.mg) await page.evaluate(() => window.__test.minigame.close()).catch(() => {});
    else {
      let d = await page.evaluate(() => window.__test.dismissBlockingUi('Resume')).catch(() => null);
      if (!d || d.ok === false) d = await page.evaluate(() => window.__test.dismissBlockingUi()).catch(() => null);
    }
    await sleep(600);
  }
}

// BASE=<commit> serves the pre-fix framework and RFID files from git, so the same script can show
// the lost unlock without editing any tracked file (negative control).
const BASE_COMMIT = process.env.BASE_COMMIT || '';
const BASE_FILES = ['base-minigame.js', 'minigame-manager.js', 'rfid-minigame.js'];
async function open(tag) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {} });
  // Block only POST /tts, by pathname.
  await page.route(u => /\/tts$/.test(new URL(u).pathname), r => r.request().method() === 'POST' ? r.abort() : r.continue());
  if (BASE_COMMIT) {
    const { execFileSync } = await import('node:child_process');
    await page.route(u => BASE_FILES.some(f => new URL(u).pathname.endsWith('/minigames/' + (f === 'rfid-minigame.js' ? 'rfid/' : 'framework/') + f)), route => {
      const pth = new URL(route.request().url()).pathname.replace(/^.*\/public\//, 'public/').replace(/^\/?break_escape\//, 'public/break_escape/');
      const body = execFileSync('git', ['show', `${BASE_COMMIT}:${pth.replace(/^\//, '')}`], { cwd: REPO_ROOT, maxBuffer: 1 << 26 });
      log('served base', pth);
      route.fulfill({ status: 200, contentType: 'text/javascript', body });
    });
  }
  page.net = [];
  page.on('response', async r => {
    const u = new URL(r.url());
    if (/\/(unlock|sync_state)$/.test(u.pathname) || /unlock/.test(u.pathname))
      page.net.push({ t: Date.now(), m: r.request().method(), path: u.pathname, status: r.status(), body: (r.request().postData() || '').slice(0, 300) });
  });
  page.errs = []; page.on('pageerror', e => page.errs.push(String(e).slice(0, 300)));
  await page.goto(`${BASE}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await page.waitForFunction(() => !!window.__test, null, { timeout: 300000 });
  await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 120000 }));
  await page.evaluate(() => window.__test.throttleFps(20));
  await clearUi(page);
  log(tag, 'loaded');
  return page;
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

const J = x => JSON.stringify(x);
const mgState = page => ev(page, () => window.__test.minigame.getState());
async function waitText(page, re, ms = 60000) {
  const t0 = Date.now(); let last = null;
  while (Date.now() - t0 < ms) {
    const st = await mgState(page).catch(() => null);
    if (st && re.test(st.text || '')) return st;
    last = st; await sleep(300);
  }
  try { await page.screenshot({ path: `${OUT}/fail.png` }); } catch (e) {}
  throw new Error('timeout waiting for ' + re + ' last=' + J(last).slice(0, 800));
}
const serverRoom = async (room) => {
  const r = await fetch(`${BASE}/break_escape/games/${gid}/scenario_map`);
  const j = await r.json();
  return j.rooms?.[room];
};
const doorState = page => ev(page, () => (window.__test.doorways() || []).find(d => d.id === 'door:battery_hall_1->battery_hall_2')?.sprite);

// Case: gameId must be a fresh m04 game (start room battery_hall_1, vance_level1_keycard in inventory).
async function rfidCase(mode) {
  const rec = { mode, gameId: gid, steps: [] };
  const step = (n, v) => { rec.steps.push({ n, ...(v === undefined ? {} : { v }) }); log(mode, n, v === undefined ? '' : J(v).slice(0, 300)); };
  rec.serverBefore = await serverRoom('battery_hall_2');
  step('server before: battery_hall_2', rec.serverBefore);
  const page = await open(mode);
  // Walk to the door; Cipher's scripted conversation interrupts hall 1, close it and walk again.
  let mv = await ev(page, () => window.__test.moveTo(590, 80));
  for (let i = 0; i < 4 && !mv.reachedTarget; i++) {
    const st = await ev(page, () => window.__test.getState().activeMinigame);
    step('interrupted by', st?.id || mv.reason);
    if (st) await ev(page, () => window.__test.minigame.close());
    await sleep(500);
    mv = await ev(page, () => window.__test.moveTo(590, 80));
  }
  step('moveTo', { ok: mv.ok, reached: mv.reachedTarget, feetAt: mv.feetAt });
  // Make the cloner copy: open it from the inventory, Read, pick the card, Save.
  await ev(page, () => { const k = window.inventory.items.find(i => i.scenarioData?.id === 'vance_level1_keycard'); k.scenarioData.rfid_hex = '1A2B3C4D5E'; });
  step('open cloner', (await ev(page, () => window.__test.interactInventory('RFID Cloner'))).opened);
  await waitText(page, /Saved/);
  await ev(page, () => window.__test.minigame.clickControl('Read'));
  await waitText(page, /Place card near reader/);
  await ev(page, () => window.__test.minigame.clickControl('Facility'));
  await waitText(page, /HEX: /);
  step('read ok', (await mgState(page)).text.split('\n').filter(l => /HEX|EM4100/.test(l)));
  await shot(page, `${mode}-1-read`);
  await ev(page, () => window.__test.minigame.clickControl('Save'));
  await sleep(1500);
  step('after save', (await mgState(page))?.text?.slice(0, 200));
  await ev(page, () => window.__test.minigame.close());
  await sleep(800);
  // Remove the physical keycard client-side so the door must be opened by the clone.
  await ev(page, () => { const k = window.inventory.items.findIndex(i => i.scenarioData?.id === 'vance_level1_keycard'); window.inventory.items.splice(k, 1); });
  step('inventory keycard removed (client only)', await ev(page, () => window.inventory.items.map(i => i.scenarioData?.id || i.scenarioData?.type)));
  rec.doorBefore = await doorState(page);
  step('door before', rec.doorBefore);
  // Install the timer in the page: it sees "Access Granted" and (early) closes 250 ms later.
  await ev(page, (m) => {
    window.__ph = { mode: m };
    setInterval(() => { if (window.__ph.seenAt && !window.__ph.goneWall && !window.MinigameFramework?.currentMinigame) window.__ph.goneWall = Date.now(); }, 15);
    const check = () => {
      if (window.__ph.seenAt || !document.body.innerText.includes('Access Granted')) return;
      window.__ph.seenAt = performance.now();
      window.__ph.seenWall = Date.now();
      if (m.startsWith('early')) setTimeout(async () => {
        window.__ph.closeAt = performance.now(); window.__ph.closeWall = Date.now();
        try { window.__ph.closeRes = await window.__test.minigame.close(); } catch (e) { window.__ph.closeRes = 'err ' + e; }
      }, 250);
    };
    new MutationObserver(check).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, mode);
  const net0 = page.net.length;
  const ir = await ev(page, () => window.__test.interact('door:battery_hall_1->battery_hall_2'));
  step('interact door', { ok: ir.ok, mode: ir.mode, reason: ir.reason, opened: ir.opened });
  await waitText(page, /Emulate Facility/);
  await shot(page, `${mode}-2-reader`);
  step('reader menu', (await mgState(page)).controls.map(c => c.label));
  await ev(page, () => window.__test.minigame.clickControl('Emulate'));
  // Wait for Access Granted to be seen by the page timer, then take a screenshot ~120 ms in.
  const t0 = Date.now();
  while (Date.now() - t0 < 60000 && !(await ev(page, () => window.__ph.seenAt))) await sleep(40);
  await sleep(120);
  await shot(page, `${mode}-4-access-granted`);
  step('mid-hold minigame', await ev(page, () => ({ active: window.__test.getState().activeMinigame?.id || null, ph: window.__ph })));
  // Let everything settle: early closes at +250 ms, control waits out the 2000 ms hold.
  await sleep(mode.startsWith('early') ? 1500 : 4000);
  rec.ph = await ev(page, () => window.__ph);
  step('timers', { seenToCloseMs: rec.ph.closeWall ? rec.ph.closeWall - rec.ph.seenWall : null, seenToGoneMs: rec.ph.goneWall ? rec.ph.goneWall - rec.ph.seenWall : null, closeRes: rec.ph.closeRes });
  step('minigame after', await ev(page, () => window.__test.getState().activeMinigame?.id || null));
  await sleep(1500);
  rec.net = page.net.slice(net0).map(n => ({ m: n.m, path: n.path.replace(/.*games\/\d+/, ''), status: n.status, body: n.path.endsWith('unlock') ? n.body : undefined }));
  step('network', rec.net.filter(n => !/sync_state/.test(n.path)));
  rec.unlockPosts = rec.net.filter(n => n.m === 'POST' && n.path === '/unlock');
  step('POST /unlock count', rec.unlockPosts.map(n => n.status));
  rec.doorAfter = await doorState(page);
  step('door in-page after', rec.doorAfter);
  await shot(page, `${mode}-5-after`);
  // Server truth: flush, then read the server's own view and reload.
  await ev(page, () => window.stateSync?.sync?.());
  rec.serverAfter = await serverRoom('battery_hall_2');
  step('server after: battery_hall_2', rec.serverAfter);
  await page.close();
  const page2 = await open(mode + '-reload');
  rec.doorReload = await doorState(page2);
  step('door after reload', rec.doorReload);
  await shot(page2, `${mode}-6-reload`);
  rec.errs = page.errs.concat(page2.errs);
  await page2.close();
  const ok = rec.unlockPosts.length === 1 && rec.unlockPosts[0].status === 200 && rec.serverAfter?.accessible === true && rec.doorReload && rec.doorReload.locked === false;
  rec.pass = !!ok;
  fs.writeFileSync(`${OUT}/${mode}.json`, J(rec, null, 1));
  log(mode, ok ? 'PASS' : 'FAIL');
  return rec;
}

// Case: PIN door in test_objectives (reception -> office1, PIN 1234). Esc during the 2 s "Access Granted" hold.
//   node tools/playtest/rfid-early-close-proof.mjs <testObjectivesGameId> <port> <outdir> pin-early   (BASE_COMMIT=<sha> for the pre-fix files)
const PIN_CLOSE = process.env.PIN_CLOSE || 'x'; // 'x' clicks the minigame's X, 'esc' sends an Escape keydown
async function pinCase(mode) {
  const rec = { mode, gameId: gid, steps: [] };
  const step = (n, v) => { rec.steps.push({ n, ...(v === undefined ? {} : { v }) }); log(mode, n, v === undefined ? '' : J(v).slice(0, 300)); };
  const room = async () => (await (await fetch(`${BASE}/break_escape/games/${gid}/scenario_map`)).json()).rooms?.office1;
  rec.serverBefore = await room();
  step('server before: office1', rec.serverBefore);
  const page = await open(mode);
  const door = 'door:reception->office1';
  const dstate = () => ev(page, () => (window.__test.doorways() || []).find(d => d.id === 'door:reception->office1')?.sprite);
  step('door before', await dstate());
  step('moveToNear', (await ev(page, () => window.__test.moveToNear('door:reception->office1'))).ok);
  await ev(page, (k) => {
    window.__ph = {};
    setInterval(() => { if (window.__ph.seenAt && !window.__ph.goneWall && !window.MinigameFramework?.currentMinigame) window.__ph.goneWall = Date.now(); }, 15);
    new MutationObserver(() => {
      if (window.__ph.seenAt || !document.body.innerText.includes('Access Granted')) return;
      window.__ph.seenAt = performance.now(); window.__ph.seenWall = Date.now();
      setTimeout(async () => { window.__ph.closeWall = Date.now(); window.__ph.closeKey = k; if (k === 'esc') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })); else window.__ph.closeRes = await window.__test.minigame.close(); }, 250);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, PIN_CLOSE);
  const net0 = page.net.length;
  const ir = await ev(page, () => window.__test.interact('door:reception->office1'));
  step('interact door', { ok: ir.ok, opened: ir.opened, reason: ir.reason });
  const st = await waitText(page, /PIN|\d/, 30000);
  step('pin pad', st.controls.map(c => c.label));
  await shot(page, `${mode}-1-pad`);
  for (const d of '1234') await ev(page, (c) => window.__test.minigame.clickControl(c), d);
  step('typed 1234', (await mgState(page)).text.slice(0, 120));
  const submit = (await mgState(page)).controls.find(c => /enter|ok|submit|unlock/i.test(c.label));
  step('submit control', submit && submit.label);
  if (submit) await ev(page, (l) => window.__test.minigame.clickControl(l), submit.label);
  else await page.keyboard.press('Enter');
  const t0 = Date.now();
  while (Date.now() - t0 < 60000 && !(await ev(page, () => window.__ph.seenAt))) await sleep(40);
  await sleep(3000);
  rec.ph = await ev(page, () => window.__ph);
  step('timers', { seenToEscMs: rec.ph.closeWall ? rec.ph.closeWall - rec.ph.seenWall : null, seenToGoneMs: rec.ph.goneWall ? rec.ph.goneWall - rec.ph.seenWall : null });
  step('minigame after', await ev(page, () => window.__test.getState().activeMinigame?.id || null));
  await sleep(1500);
  rec.net = page.net.slice(net0).map(n => ({ m: n.m, path: n.path.replace(/.*games\/\d+/, ''), status: n.status, body: n.path.endsWith('unlock') ? n.body : undefined }));
  rec.unlockPosts = rec.net.filter(n => n.m === 'POST' && n.path === '/unlock');
  step('POST /unlock', rec.unlockPosts);
  rec.doorAfter = await dstate();
  step('door in-page after', rec.doorAfter);
  await shot(page, `${mode}-2-after`);
  await ev(page, () => window.stateSync?.sync?.());
  rec.serverAfter = await room();
  step('server after: office1', rec.serverAfter);
  await page.close();
  const page2 = await open(mode + '-reload');
  rec.doorReload = await ev(page2, () => (window.__test.doorways() || []).find(d => d.id === 'door:reception->office1')?.sprite);
  step('door after reload', rec.doorReload);
  await shot(page2, `${mode}-3-reload`);
  await page2.close();
  rec.pass = rec.unlockPosts.length === 1 && rec.unlockPosts[0].status === 200 && rec.serverAfter?.accessible === true && rec.doorReload?.locked === false;
  fs.writeFileSync(`${OUT}/${mode}.json`, J(rec, null, 1));
  log(mode, rec.pass ? 'PASS' : 'FAIL');
  return rec;
}
if (only === 'pin-early') { const r = await pinCase(`pin-${PIN_CLOSE}` + (process.env.BASE_COMMIT ? '-base' : '')); await browser.close(); process.exit(r.pass ? 0 : 1); }

if (only === 'early' || only === 'control' || only === 'early-base') { const r = await rfidCase(only === 'early-base' ? 'early-base' : only); await browser.close(); process.exit(r.pass ? 0 : 1); }
if (only === 'lib') { /* imported by scratch scripts */ }
export { browser, open, ev, shot, sleep, log, OUT, gid, BASE, clearUi, rfidCase };
