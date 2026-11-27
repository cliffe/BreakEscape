// m09 gate minors m1/m3: count "Task Complete" toasts for a task with a DOM observer.
// usage: node m09fix-toast.mjs <mode> <gameId> <port> <outDir>
//   mode "talk"  : game seeded at the cage with nightshade_file_held; talk Sorensen down (sorensen_fate talked)
//   mode "ko"    : same seed; knock Sorensen out (debugKO), the npc_ko mapping sets sorensen_fate ko
//   mode "notice": game seeded past the Tesseract call; open HaX thread, "His notice", "Not yet." then (later) "Send it."
import { createRequire } from 'node:module';
import { EXEC } from './m01-ol-lib.mjs';
const require = createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/');
const { chromium } = require('playwright-core');
const [mode, gid, port = '3172', out = '/tmp'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await page.addInitScript(() => {
  try { localStorage.setItem('tutorial_declined', 'true'); } catch (e) {}
  window.__toasts = [];
  const start = Date.now();
  const watch = () => {
    const c = document.body;
    if (!c) return setTimeout(watch, 20);
    new MutationObserver(ms => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        const nodes = [n, ...n.querySelectorAll('*')];
        for (const x of nodes) if (/notification/.test(x.className || '') && /Task Complete|Stop Sorensen|vendor notice/.test(x.textContent || '') && !x.__seen && x.children.length) {
          x.__seen = true; window.__toasts.push({ t: Date.now() - start, text: x.textContent.trim().replace(/\s+/g, ' ').slice(0, 120) });
        }
      }
    }).observe(c, { childList: true, subtree: true });
  };
  watch();
});
await page.goto(`http://127.0.0.1:${port}/break_escape/games/${gid}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body, null, { timeout: 90000 });
const ev = (fn, a) => page.evaluate(fn, a);
const t = ms => page.waitForTimeout(ms);
await ev(() => { window.__test.throttleFps(20); });
const log = (k, v) => console.log(k, JSON.stringify(v));
const shot = n => page.screenshot({ path: `${out}/${n}.png` });
const dlg = () => ev(() => window.__test.minigame.getState()?.dialogue || null);
const toasts = () => ev(() => window.__toasts);
const task = id => ev(i => { const x = window.objectivesManager?.taskIndex?.[i]; return x && x.status; }, id);
log('start', await ev(() => ({ room: window.__test.getState().currentRoom, fate: window.gameState.globalVariables.sorensen_fate })));
// close the opening Mission Brief (it shows on load by design)
for (let i = 0, quiet = 0; i < 12 && quiet < 3; i++) { const a = await ev(() => window.__test.getState().activeMinigame); if (a && a.type === 'PersonChatMinigame') break; if (!a) { quiet++; await t(1000); continue; } quiet = 0; log('closing', a); await ev(() => window.__test.minigame.close()); await t(800); }
if (mode === 'ko' || mode === 'talk' || mode === 'cabinet') {
  // cage_opened is flipped through the engine's own setter so the real mapping unlocks stop_the_shredding
  await ev(() => { const old = window.gameState.globalVariables.cage_opened; window.gameState.globalVariables.cage_opened = true; window.npcConversationStateManager?.broadcastGlobalVariableChange('cage_opened', true, null); window.eventDispatcher.emit('global_variable_changed:cage_opened', { name: 'cage_opened', value: true, oldValue: old }); });
  await t(3000);
  log('task after cage_opened', await task('stop_the_shredding'));
  await ev(() => { window.__toasts.length = 0; });
}
if (mode === 'cabinet') {
  await ev(() => window.__test.dismissBlockingUi());
  // head start: plan_cabinet seeded as unlocked on this fresh game (Game#unlock_object!), no biometric play
  await t(2500); log('dismiss', await ev(() => window.__test.dismissBlockingUi())); const mv2 = await ev(() => window.__test.moveToNear('plan_cabinet')); log('move', mv2.ok ? 'ok' : mv2);
  // a lifted print of Margaret Sorensen (the stamp's owner), as dusting would store it; the server merges known owners
  log('sample', await ev(async () => { const m = await import('/break_escape/js/systems/biometric-samples.js'); const r = m.addBiometricSample({ owner: 'Margaret Sorensen', quality: 0.8, identified: true, sourceObjectId: 'sorensen_stamp', sourceName: 'Rubber Stamp' }); await new Promise(r => setTimeout(r, 1500)); return !!r; }));
  log('interact', await ev(() => window.__test.interact('plan_cabinet')));
  await t(1500);
  log('mg', await ev(() => window.__test.getState().activeMinigame));
  if (await ev(() => !!document.querySelector('.fpr-card'))) { await ev(() => { window.__tl = []; const t0 = Date.now(); let last = ''; window.__tlTimer = setInterval(() => { const a = window.__test.getState().activeMinigame; const k = (a && a.id) + '|' + window.__toasts.length + '|' + document.querySelectorAll('#notification-container .notification').length; if (k !== last) { last = k; window.__tl.push([Date.now() - t0, k]); } }, 50); document.querySelector('.fpr-card').click(); }); await t(4000); log('timeline', await ev(() => window.__tl)); log('mg after present', await ev(() => window.__test.getState().activeMinigame)); log('toasts@present', await toasts()); }
  log('take', await ev(() => window.__test.minigame.take('Candidate Assessment, Intake 2011')));
  await t(500);
  log('held', await ev(() => window.gameState.globalVariables.nightshade_file_held));
  await t(800); log('close viewer', await ev(() => window.__test.minigame.close()));
  await t(300); log('after viewer', await ev(() => window.__test.getState().activeMinigame));
  log('close container', await ev(() => window.__test.minigame.close()));
  // her conversation opens 1.5 s after the pickup; talk her down
  await t(3500);
  for (let i = 0; i < 40; i++) {
    const d = await dlg(); if (!d) { if (i % 5 === 0) log('nodlg', await ev(() => window.__test.getState().activeMinigame)); await t(500); continue; }
    if (d.awaitingChoice) {
      const texts = d.choices.map(c => (c && c.text) || String(c));
      log('choices', texts);
      const idx = texts.findIndex(x => /Your Architect kept/.test(x));
      if (idx >= 0) { await ev(n => window.__test.minigame.chooseIndex(n), idx + 1); await t(500); continue; }
      const done = texts.findIndex(x => /done here/.test(x));
      await ev(n => window.__test.minigame.chooseIndex(n), done + 1); await t(1500); break;
    } else if (d.canContinue) await ev(() => window.__test.minigame.continue());
    await t(500);
  }
  log('after talk', await ev(() => window.__test.getState().activeMinigame));
  await t(1500); log('close chat', await ev(() => window.__test.minigame.close()));
  log('toasts@close', await toasts());
  await t(10000);
}
if (mode === 'ko') {
  await ev(() => window.__test.dismissBlockingUi()); log('ko', await ev(() => window.__test.debugKO('sorensen')));
  await t(8000);
} else if (mode === 'talk') {
  // her conversation opens by itself on cage_opened (scenario mapping); if not, talk to her
  if (!(await dlg())) { await ev(() => window.__test.dismissBlockingUi()); const mv = await ev(() => window.__test.moveToNear('sorensen')); log('move', mv); log('interact', await ev(() => window.__test.interact('sorensen')).then(r => r && r.ok)); }
  await t(1500);
  for (let i = 0; i < 40; i++) {
    const d = await dlg(); if (!d) { await t(500); continue; }
    if (d.awaitingChoice) {
      const texts = d.choices.map(c => (c && c.text) || String(c));
      log('choices', texts);
      const idx = texts.findIndex(x => /Your Architect kept/.test(x));
      if (idx >= 0) { await ev(n => window.__test.minigame.chooseIndex(n), idx + 1); await t(500); continue; }
      const done = texts.findIndex(x => /done here/.test(x));
      await ev(n => window.__test.minigame.chooseIndex(n), done + 1); await t(1500); break;
    } else if (d.canContinue) await ev(() => window.__test.minigame.continue());
    await t(500);
  }
  await t(8000);
}
if (mode === 'notice') {
  log('task0', await task('send_the_notice'));
  if ((await task('send_the_notice')) === 'locked') await ev(() => window.objectivesManager.unlockTask?.('send_the_notice'));
  await t(1000); log('task1', await task('send_the_notice'));
  const tl = (name) => ev(n => window.__test.getState().activeMinigame?.type || null);
  await t(8000);
  let op; for (let i = 0; i < 6; i++) { await ev(() => window.__test.dismissBlockingUi()); op = await ev(() => window.__test.openInventoryItem?.('phone')); if (op && op.ok) break; await t(1500); }
  log('open phone', op);
  await t(1500); log('click HaX', await ev(() => window.__test.minigame.clickText('Agent HaX')));
  const pickChoice = async (rx, maxs = 60) => { for (let i = 0; i < maxs * 2; i++) { const d = await dlg(); if (d && d.awaitingChoice) { const texts = d.choices.map(c => (c && c.text) || String(c)); const k = texts.findIndex(x => rx.test(x)); log('choices', texts); if (k >= 0) { await ev(n => window.__test.minigame.chooseIndex(n), k + 1); return true; } return false; } if (d && d.canContinue) await ev(() => window.__test.minigame.continue()); await t(500); } return false; };
  // The ink tag #complete_task:send_the_notice runs this same call; the HaX thread's resting knot is gated by story state we do not replay here.
  log('complete while phone open', await ev(() => { window.__toasts.length = 0; return window.objectivesManager.completeTask('send_the_notice'); }));
  await t(500); log('phone-open check', await ev(() => ({ mg: window.__test.getState().activeMinigame?.type, shown: document.querySelectorAll('#notification-container .notification').length })));
  log('toasts@notyet', await toasts()); await t(6000); log('toasts@+6s', await toasts());
  log('phone state', await ev(() => window.__test.getState().activeMinigame));
  log('task2', await task('send_the_notice'));
  log('close phone', await ev(() => { window.__tclose = Date.now(); return window.__test.minigame.close(); })); await t(500);
  log('close phone2', await ev(() => window.__test.minigame.close()));
  await t(6000);
}
log('fate', await ev(() => window.gameState.globalVariables.sorensen_fate));
log('task', await task('stop_the_shredding'));
log('toasts', await toasts());
await shot(`m1-${mode}`);
log('errs', errs.filter(e => !/503/.test(e)));
await browser.close();
