// t14_cyberchef: Patricia's CyberChef workstation (the real CyberChef v10.19.4 in the in-game laptop overlay) decoding the worked Base64 example from
// Patricia's own notes ("Meet at the server room" = TWVldCBhdCB0aGUgc2VydmVyIHJvb20=). No mission answer is shown.
// Entry state: as t04 (head-start in it_room; Kevin's lock pick kit comes from his conversation in setup, off camera):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --unlock main_office_area --unlock hallway_west --set briefing_played=true
// Record: run-take.sh t14_cyberchef "<the flags above>" "--hide-hud --zoom-step 1"
// setup() (before recording): t04's setup (Kevin's kit, walk to the briefcase), pick the briefcase lock with synthetic keys, take the CyberChef Workstation
// from the opened briefcase, close the container. The take: open the workstation from the inventory, paste the Base64 text with the recipe From Base64, linger on the decoded output.
// Marks: workstation-open, cyberchef-ready, input-set (paste route), output-shown, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { setup as t04Setup } from './t04_lockpick.mjs';

async function pickLock(page, bridge) {
  const r = await bridge.interact('patricia_briefcase', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  await sleep(500);
  const st0 = await page.evaluate(() => window.MinigameFramework.currentMinigame.pins.map(p => ({ i: p.index, binding: p.binding })));
  await page.evaluate(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true })); });
  await sleep(600);
  for (const idx of [...st0].sort((a, b) => a.binding - b.binding).map(p => p.i)) {
    const res = await page.evaluate(async (idx) => {
      const mg = window.MinigameFramework.currentMinigame; const pin = mg.pins[idx];
      const ev = (t) => window.dispatchEvent(new KeyboardEvent(t, { key: String(idx + 1), code: 'Digit' + (idx + 1), keyCode: 49 + idx, which: 49 + idx, bubbles: true }));
      const dist = () => Math.abs((-50 + pin.driverPinLength - pin.currentHeight) - (-45));
      ev('keydown'); const t0 = performance.now();
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
      ev('keyup'); await new Promise(r => setTimeout(r, 120));
      return { set: !!pin.isSet, over: !!pin.isOverpicked };
    }, idx);
    if (!res.set) throw new Error('pin ' + (idx + 1) + ' did not set');
    await sleep(450);
  }
  await bridge.waitForMinigameClosed({ timeoutMs: 8000 });
  await sleep(1500);
}

export async function setup(page, bridge) {
  await t04Setup(page, bridge);
  await pickLock(page, bridge);
  const s = await bridge.getState();
  const mg = await bridge.minigame.getState().catch(e => String(e));
  console.error('AFTER-LOCK', JSON.stringify({ active: s.activeMinigame, mg }).slice(0, 1500));
  const t = await bridge.minigame.take('CyberChef Workstation').catch(e => ({ err: String(e) }));
  console.error('TAKE', JSON.stringify(t).slice(0, 500));
  await sleep(800);
  await clearScreen(page, bridge, () => {});
  const inv = (await bridge.getState()).inventory.map(x => x.name);
  console.error('INV', inv.join(','));
  if (!inv.some(n => /cyberchef/i.test(n))) throw new Error('workstation not in inventory: ' + inv.join(','));
}

export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('workstation-open-start');
  // --hide-hud hides the inventory tray, so the tray click is not available: call the same handler the item's click uses (interactions.js)
  const o = await page.evaluate(() => { if (!window.openCryptoWorkstation) return false; window.openCryptoWorkstation(); return true; });
  mark('workstation-open', { ok: o });
  if (!o) throw new Error('openCryptoWorkstation not available');
  await sleep(4000);                                      // CyberChef finishes loading, viewer sees the real UI
  mark('cyberchef-ready');
  const r = await bridge.setCyberChefInput('TWVldCBhdCB0aGUgc2VydmVyIHJvb20=', { recipe: "From_Base64('A-Za-z0-9+/=',true,false)" });
  mark('input-set', { ok: r && r.ok, via: r && r.via, output: r && r.output });
  if (!r || r.ok === false) throw new Error('setCyberChefInput failed ' + JSON.stringify(r).slice(0, 300));
  if (!/Meet at the server room/.test(r.output || '')) throw new Error('unexpected output ' + JSON.stringify(r.output));
  mark('output-shown');
  await sleep(3500);
  mark('linger-end');
};
