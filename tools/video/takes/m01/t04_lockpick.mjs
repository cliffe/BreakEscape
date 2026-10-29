// t04_lockpick: the lockpicking minigame on Patricia's Briefcase (manager_office), from opening the minigame to the lock springing.
// Entry state: head-start in it_room (Kevin gives the Lock Pick Kit in setup, off camera; --give cannot supply it because it has no id):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --unlock main_office_area --unlock hallway_west --set briefing_played=true
// Record: run-take.sh t04_lockpick "<the flags above>" "--hide-hud --zoom-step 1"
// setup() (before recording): close Mission Brief, talk to Kevin (take all tools), walk it_room -> main_office_area -> hallway_west -> manager_office.
// The take: interact with the briefcase, then PICK THE LOCK FOR REAL with synthetic keys (space = tension, hold a pin digit until that pin sets, in the lock's binding order):
// the pin states are only read to know when to release; nothing is completed through the bridge shortcut. Marks: minigame-open, tension, pin-set:N, lock-open.
import { sleep, clearScreen, pickChoice, awaitChoice } from './lib.mjs';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.interact('kevin_park', { timeoutMs: 20000 });
  await pickChoice(bridge, /^I'll need access to secure areas/i);
  await pickChoice(bridge, /^I'll take all of it/i);
  await pickChoice(bridge, /^I'll keep investigating/i);
  for (let i = 0; i < 80 && (await bridge.getState()).activeMinigame; i++) { await sleep(250); if (i > 8 && (await bridge.getState()).activeMinigame) await bridge.minigame.close().catch(() => {}); }
  const inv = (await bridge.getState()).inventory.map(x => x.name);
  if (!inv.some(n => /lock pick/i.test(n))) throw new Error('no lockpick kit after Kevin: ' + inv.join(','));
  for (const room of ['main_office_area', 'hallway_west', 'manager_office']) {
    const r = await bridge.enterRoom(room, { timeoutMs: 30000 });
    if (!r || r.ok === false) throw new Error('enterRoom ' + room + ' ' + JSON.stringify(r).slice(0, 200));
    await sleep(400);
  }
  await bridge.moveToNear('patricia_briefcase', { timeoutMs: 20000 });
  await sleep(1500);
}

export default async (page, bridge, mark) => {
  await sleep(800);
  mark('interact-briefcase');
  const r = await bridge.interact('patricia_briefcase', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  mark('minigame-open');
  await sleep(1800);                                       // let the viewer take in the lock
  const pins = () => page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return m && m.pins ? m.pins.map(p => ({ i: p.index, binding: p.binding, set: !!p.isSet, over: !!p.isOverpicked, h: p.currentHeight })) : null; });
  const st0 = await pins();
  if (!st0) throw new Error('no pins state (keyMode?)');
  mark('pins', st0);
  await page.evaluate(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true })); });   // tension wrench on
  mark('tension');
  await sleep(700);
  const order = [...st0].sort((a, b) => a.binding - b.binding).map(p => p.i);
  for (const idx of order) {
    // hold the pin key until this pin's key/driver boundary reaches the shear line (read each frame in the page), then release: the game's own
    // keyup handler (checkPinSet) decides whether it sets. Events go to window with keyCode, as Phaser's keyboard plugin needs it.
    const res = await page.evaluate(async (idx) => {
      const mg = window.MinigameFramework.currentMinigame;
      const pin = mg.pins[idx];
      const ev = (t) => window.dispatchEvent(new KeyboardEvent(t, { key: String(idx + 1), code: 'Digit' + (idx + 1), keyCode: 49 + idx, which: 49 + idx, bubbles: true }));
      const dist = () => Math.abs((-50 + pin.driverPinLength - pin.currentHeight) - (-45));
      ev('keydown');
      const t0 = performance.now();
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
      const d = dist();
      ev('keyup');
      await new Promise(r => setTimeout(r, 120));
      return { set: !!pin.isSet, over: !!pin.isOverpicked, ms: Math.round(performance.now() - t0), dist: +d.toFixed(2), epoch: performance.timeOrigin + performance.now() };
    }, idx);
    mark('pin-set:' + (idx + 1), res, res.epoch);
    if (!res.set) throw new Error('pin ' + (idx + 1) + ' did not set: ' + JSON.stringify(res));
    await sleep(450);
  }
  const done = await bridge.waitForMinigameClosed({ timeoutMs: 8000 });
  mark('lock-open', done);
  await sleep(1800);                                        // payoff: the briefcase opens
  mark('linger-end');
};
