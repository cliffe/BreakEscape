// t12_lockpick (m05), keyless: real lockpicking of the patricia_filing_cabinet (easy key lock, patricia_office), synthetic key events as m03 t03. The take stops as the lock springs; the locker's contents are closed at once (marked: the edit's out point must be earlier).
// Entry state: new-game.rb m05_insider_trading --imports=none --start-room patricia_office --set briefing_played=true --set briefing_played=true
// Record: BE_SPRITE=harjit_singh tools/video/takes/run-take.sh m05 t12_lockpick "--imports=none --start-room patricia_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact-door (the locker), minigame-open, pins, tension, pin-set:N, lock-open, contents-first-seen, contents-closed, linger-end.
// Lock Pick Kit is a starting item.
import { sleep, clearScreen } from '../lib/lib.mjs';
const DOOR = 'patricia_filing_cabinet';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear(DOOR, { timeoutMs: 20000 }).catch(e => console.error('moveToNear', String(e).slice(0, 200)));
  await sleep(800);
  const s = await bridge.getState();
  console.error('SETUP', JSON.stringify({ p: s.player, near: s.nearby.map(n => [n.id, n.inRange, Math.round(n.distance)]).slice(0, 10) }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('interact-door');
  const r = await bridge.interact(DOOR, { timeoutMs: 20000 });
  console.error('INTERACT', JSON.stringify(r).slice(0, 300), JSON.stringify((await bridge.getState()).activeMinigame));
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  mark('minigame-open');
  await sleep(1800);
  const pins = () => page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return m && m.pins ? m.pins.map(p => ({ i: p.index, binding: p.binding, set: !!p.isSet, over: !!p.isOverpicked })) : null; });
  const st0 = await pins();
  if (!st0) { const ks = await bridge.minigame.getState(); console.error('KEYSTATE', JSON.stringify(ks).slice(0, 1500)); throw new Error('no pins state (keyMode?)'); }
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
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isSet && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
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
  while (Date.now() - t1 < 1500) { cont = (await bridge.getState()).activeMinigame; if (cont) break; await sleep(20); }
  mark('contents-first-seen', { which: JSON.stringify(cont).slice(0, 80) });
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(150); }
  mark('contents-closed');
  await sleep(1200);
  mark('linger-end');
};

