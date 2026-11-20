// t03_lockpick (m02): real lockpicking of the IT filing cabinet (it_filing_cabinet, it_department), synthetic key events as m01 t04. Contents are never shown:
// the take closes whatever opens after the lock springs as soon as it appears (contents are story spoilers).
// Entry state: head-start in the IT room (the Lock Pick Kit is a start item):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust --start-room it_department --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t03_lockpick "--start-room it_department --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): close the Mission Brief, spend Gary's one-off catch (off camera), walk to the cabinet. Marks: minigame-open, tension, pin-set:N, lock-open (minigame closed), contents-closed, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('it_filing_cabinet', { timeoutMs: 20000 });
  await sleep(800);
  // Gary's one-off catch ("Behind you, a chair creaks round", lockpick used in view) fires on the first attempt: spend it here, off camera; the next attempt picks.
  await bridge.interact('it_filing_cabinet', { timeoutMs: 20000 });
  await bridge.waitForMinigame('person-chat', { timeoutMs: 8000 }).catch(() => {});
  await sleep(1000);
  for (let i = 0; i < 6 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(900); }
  await clearScreen(page, bridge, () => {});
  const g = (await bridge.getState()).globals;
  console.error('AFTER-CATCH', JSON.stringify({ active: (await bridge.getState()).activeMinigame, p: (await bridge.getState()).player }));
  await sleep(800);
  console.error('SETUP', JSON.stringify({ p: (await bridge.getState()).player, near: (await bridge.getState()).nearby.map(n => [n.id, n.inRange, Math.round(n.distance)]).slice(0, 8) }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('interact-cabinet');
  const r = await bridge.interact('it_filing_cabinet', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  mark('minigame-open');
  await sleep(1800);
  const pins = () => page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return m && m.pins ? m.pins.map(p => ({ i: p.index, binding: p.binding, set: !!p.isSet, over: !!p.isOverpicked })) : null; });
  const st0 = await pins();
  if (!st0) throw new Error('no pins state (keyMode?)');
  mark('pins', st0);
  await page.evaluate(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true })); });
  mark('tension');
  await sleep(700);
  for (const idx of [...st0].sort((a, b) => a.binding - b.binding).map(p => p.i)) {
    const res = await page.evaluate(async (idx) => {
      const mg = window.MinigameFramework.currentMinigame; const pin = mg.pins[idx];
      const ev = (t) => window.dispatchEvent(new KeyboardEvent(t, { key: String(idx + 1), code: 'Digit' + (idx + 1), keyCode: 49 + idx, which: 49 + idx, bubbles: true }));
      const dist = () => Math.abs((-50 + pin.driverPinLength - pin.currentHeight) - (-45));
      ev('keydown'); const t0 = performance.now();
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
      const d = dist(); ev('keyup'); await new Promise(r => setTimeout(r, 120));
      return { set: !!pin.isSet, over: !!pin.isOverpicked, ms: Math.round(performance.now() - t0), dist: +d.toFixed(2), epoch: performance.timeOrigin + performance.now() };
    }, idx);
    mark('pin-set:' + (idx + 1), res, res.epoch);
    if (!res.set) throw new Error('pin ' + (idx + 1) + ' did not set: ' + JSON.stringify(res));
    await sleep(450);
  }
  // the lock springs: poll for the lockpicking overlay to go away; whatever replaces it (a container) is closed at once
  const t0 = Date.now(); let which = null;
  while (Date.now() - t0 < 8000) { which = (await bridge.getState()).activeMinigame; if (!which || !/lockpick/i.test(JSON.stringify(which))) break; await sleep(30); }
  mark('lock-open', { which: JSON.stringify(which).slice(0, 80) });
  // the container (contents: spoilers) opens a moment AFTER the lockpicking overlay closes: wait for it, mark its first appearance (the edit's out point must be earlier), close it at once
  const t1 = Date.now(); let cont = null;
  while (Date.now() - t1 < 5000) { cont = (await bridge.getState()).activeMinigame; if (cont) break; await sleep(20); }
  mark('contents-first-seen', { which: JSON.stringify(cont).slice(0, 80) });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(150); }
  mark('contents-closed');
  await sleep(1200);
  mark('linger-end');
};
