// Shared by the m06 crescendo/flash takes t17..t29 (23 Nov, written, NOT run). Never types a PIN/password/code: only DIGITS (wrong everywhere, see _conv.mjs) or z/q/x, never ENTER.
import { sleep } from '../lib/lib.mjs';
import { ttsPlaying, openChat, closeAll } from './_conv.mjs';
export { DIGITS, closeAll, openChat, ttsPlaying } from './_conv.mjs';
export const state = (bridge) => bridge.getState();
/** Walk near a person, open the chat, hold the portrait, close before any menu choice. Marks <id>-open / <id>-closed. */
export async function faceFlash(page, bridge, mark, id, holdMs = 2400) {
  await bridge.moveToNear(id, { timeoutMs: 20000 }); await sleep(500);
  await openChat(bridge, id); mark(id + '-open'); await sleep(holdMs);
  await closeAll(page, bridge); mark(id + '-closed'); await sleep(600);
}
/** Interact with a lock/object and wait for a minigame; marks <tag>-open. */
export async function openMg(bridge, id, tag, mark, name) {
  const r = await bridge.interact(id, { timeoutMs: 20000, approach: false });
  if (name) { const w = await bridge.waitForMinigame(name, { timeoutMs: 8000 }).catch(() => null); if (!w || w.ok === false) throw new Error(tag + ' did not open ' + JSON.stringify(r).slice(0, 200)); } else await sleep(900);
  mark(tag + '-open', { mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 100) });
}
export async function typeKeys(page, keys, mark, tag, paceMs = 450) { for (const k of keys) { await page.keyboard.press(k); await sleep(paceMs); } mark(tag + '-typed'); }
/** Real lockpicking with synthetic keys (m05 t12): tension, each pin in binding order, stops at the spring. No container opens on a door. */
export async function pickLock(page, bridge, mark) {
  const pins = () => page.evaluate(() => { const m = window.MinigameFramework.currentMinigame; return m && m.pins ? m.pins.map(p => ({ i: p.index, binding: p.binding })) : null; });
  const st0 = await pins(); if (!st0) throw new Error('no pins state (key mode?)');
  mark('pins', st0);
  await page.evaluate(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true })); });
  mark('tension'); await sleep(700);
  for (const idx of [...st0].sort((a, b) => a.binding - b.binding).map(p => p.i)) {
    const res = await page.evaluate(async (idx) => {
      const mg = window.MinigameFramework.currentMinigame; const pin = mg.pins[idx];
      const ev = (t) => window.dispatchEvent(new KeyboardEvent(t, { key: String(idx + 1), code: 'Digit' + (idx + 1), keyCode: 49 + idx, which: 49 + idx, bubbles: true }));
      const dist = () => Math.abs((-50 + pin.driverPinLength - pin.currentHeight) - (-45));
      ev('keydown'); const t0 = performance.now();
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isSet && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
      ev('keyup'); await new Promise(r => setTimeout(r, 120));
      return { set: !!pin.isSet, over: !!pin.isOverpicked, ms: Math.round(performance.now() - t0), epoch: performance.timeOrigin + performance.now() };
    }, idx);
    mark('pin-set:' + (idx + 1), res, res.epoch);
    if (!res.set) throw new Error('pin ' + (idx + 1) + ' did not set');
    await sleep(450);
  }
  const t0 = Date.now(); let which = null;
  while (Date.now() - t0 < 8000) { which = (await bridge.getState()).activeMinigame; if (!which || !/lockpick/i.test(JSON.stringify(which))) break; await sleep(30); }
  mark('lock-open', { which: JSON.stringify(which).slice(0, 80) });
}
/** Press Continue (when no line is playing) until a menu with a choice matching re shows; pick it. Used where lines auto-wait on Continue. */
export async function driveToMenu(page, bridge, re, mark, ms = 90000) {
  const t0 = Date.now(); let quiet = Date.now(), last = null;
  while (Date.now() - t0 < ms) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (await ttsPlaying(page)) { quiet = Date.now(); await sleep(100); continue; }
    if (d.awaitingChoice) { if (d.choices.some(c => re.test(c.text))) { mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(700); const ch = await bridge.minigame.choose(re); if (!ch || !ch.ok) throw new Error('choose failed ' + re); mark('choice:' + ch.chose); return; } throw new Error('menu without ' + re + ': ' + JSON.stringify(d.choices.map(c => c.text))); }
    if ((d.text || '') !== last) { last = d.text || ''; quiet = Date.now(); }
    if (d.canContinue && Date.now() - quiet > 900) { await bridge.minigame.continue_().catch(() => {}); quiet = Date.now(); }
    await sleep(120);
  }
  throw new Error('menu ' + re + ' never showed');
}
