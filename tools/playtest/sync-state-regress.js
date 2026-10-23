// Browser regression for the change-only state sync (state-sync.js).
//   node tools/playtest/sync-state-regress.js <game url> <server log> [idleMs]
// e.g. node tools/playtest/sync-state-regress.js http://127.0.0.1:3001/break_escape/games/602 tmp/keyless-3001.log
// Set OUT=<file> to keep the results as JSON, CHROMIUM=<path> to choose the browser.
// 1. play the opening and one conversation; 2. force a sync, snapshot state;
// 3. reload; compare globals, notes, phone threads, clock, fired handlers;
// 4. idle, count sync_state requests (page and server log); 5. change one
// global and check the next request carries only that key.
const { chromium } = require('playwright');
const fs = require('fs');
const [url, serverLog, idleArg] = process.argv.slice(2);
const IDLE_MS = Number(idleArg || 120000);
const out = { steps: [] };
const step = (name, data) => { out.steps.push({ name, ...data }); console.log(name, JSON.stringify(data).slice(0, 600)); };

async function clearOverlays(page, rounds = 250) {
  for (let i = 0; i < rounds; i++) {
    const mg = await page.evaluate(() => window.__test.getState().activeMinigame);
    if (mg) {
      const d = await page.evaluate(() => window.__test.minigame.getState()?.dialogue);
      if (d) {
        await page.evaluate(() => { const s = window.__test.minigame.getState().dialogue;
          return s.awaitingChoice ? window.__test.minigame.choose(1) : window.__test.minigame.continue(); });
        await page.evaluate(() => window.__test.waitForDialogue({ timeoutMs: 8000 })).catch(() => {});
      } else {
        await page.evaluate(() => window.__test.minigame.close());
        await page.waitForTimeout(600);
      }
      continue;
    }
    const bl = await page.evaluate(() => window.__test.getState().blockingUi);
    if (bl) {
      const pick = bl.buttons.map(x => x.label).find(l => /^resume$|no,|figure it out|continue|start/i.test(l)) || bl.buttons[0].label;
      await page.evaluate(l => window.__test.dismissBlockingUi(l), pick);
      await page.waitForTimeout(900);
      continue;
    }
    return i;
  }
  return rounds;
}

const snapshot = page => page.evaluate(() => ({
  globals: { ...window.gameState.globalVariables },
  notes: (window.gameState.notes || []).map(n => n.id),
  phone: Object.fromEntries(Object.entries(window.npcManager.exportPhoneState()).map(([k, v]) => [k, v.history.length])),
  clock: window.gameClock?.exportState?.().elapsedMs,
  timersFired: window.scenarioTimerDispatcher?.exportState?.().fired || [],
  triggered: Object.keys(window.npcManager.exportTriggeredEvents()),
  room: window.currentRoom?.name
}));

const syncLines = () => fs.readFileSync(serverLog, 'utf8').split('\n').filter(l => /Started PUT "\/break_escape\/games\/\d+\/sync_state"/.test(l)).length;

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const syncs = [];
  page.on('request', r => { if (r.url().includes('/sync_state')) syncs.push({ t: Date.now(), body: JSON.parse(r.postData() || '{}') }); });
  page.on('pageerror', e => console.log('PAGEERROR', String(e))); page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });

  const open = async () => {
    await page.goto(url + '?skip_resume=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.waitForTimeout(5000);
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
  };
  page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('NAVIGATED', f.url()); });

  await open();
  step('opening cleared', { rounds: await clearOverlays(page) });

  // One conversation with the nearest NPC, and any note nearby
  const npc = await page.evaluate(() => window.__test.getState().nearby.find(e => e.kind === 'npc') || null);
  if (npc) {
    await page.evaluate(id => window.__test.interact(id), npc.id);
    await page.evaluate(() => window.__test.waitForMinigame(null, { timeoutMs: 15000 })).catch(() => {});
    step('talked', { npc: npc.id, rounds: await clearOverlays(page) });
  }
  await page.evaluate(() => { window.gameState.globalVariables.regress_marker = 'before-reload'; });
  await page.waitForTimeout(2000);

  await page.evaluate(() => window.stateSync.sync());
  const before = await snapshot(page);
  step('before reload', before);

  // Change something after the last confirmed sync, so only the unload flush carries it
  await page.evaluate(() => { window.gameState.globalVariables.regress_flush_only = 7; });
  const syncsBeforeReload = syncs.length;
  await open();
  const flush = syncs.slice(syncsBeforeReload).find(s => s.body.globalVariables?.regress_flush_only === 7);
  step('flush on reload', { sent: !!flush, keys: flush && Object.keys(flush.body), globals: flush && flush.body.globalVariables });
  await clearOverlays(page, 40);
  const after = await snapshot(page);
  const lostGlobals = Object.keys(before.globals).filter(k => JSON.stringify(before.globals[k]) !== JSON.stringify(after.globals[k]));
  step('after reload', {
    lostOrChangedGlobals: lostGlobals.map(k => [k, before.globals[k], after.globals[k]]),
    flushOnlyGlobal: after.globals.regress_flush_only,
    notesKept: before.notes.every(id => after.notes.includes(id)),
    phone: { before: before.phone, after: after.phone },
    clock: { before: before.clock, after: after.clock },
    timersFired: { before: before.timersFired, after: after.timersFired },
    triggeredKept: before.triggered.every(k => after.triggered.includes(k)),
    triggeredCount: [before.triggered.length, after.triggered.length]
  });

  // First sync after the reload: a full snapshot. Then idle.
  await page.evaluate(() => window.stateSync.sync());
  const first = syncs[syncs.length - 1];
  step('first sync after reload', { keys: Object.keys(first.body), globalCount: Object.keys(first.body.globalVariables || {}).length });
  const pageCount = syncs.length;
  const logCount = syncLines();
  await page.waitForTimeout(IDLE_MS);
  step('idle', { ms: IDLE_MS, pageRequests: syncs.length - pageCount, serverLogRequests: syncLines() - logCount,
                 bodies: syncs.slice(pageCount).map(s => s.body) });

  // One global changed: the next request carries only that key
  const n = syncs.length;
  await page.evaluate(() => { window.gameState.globalVariables.regress_one = 1; });
  await page.waitForTimeout(31000); // the 30 s interval, not a forced sync
  const next = syncs.slice(n);
  step('one global changed', { requests: next.length, bodies: next.map(s => s.body) });

  fs.writeFileSync(process.env.OUT || '/dev/null', JSON.stringify(out, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
