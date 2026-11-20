// t19_minigames: a run of short minigame beats for the trailer's minigame crescendo (one take, several minigames, a mark at each):
//   1. Patricia's Briefcase, already picked, opened again: the container view with its contents.
//   2. Patricia's Note from the briefcase in the notes reader (the CyberChef worked example; no mission answer).
//   3. Derek's office door opened with Derek's Office Key (the key-lock minigame: the key goes in and turns).
//   4. Derek's Computer: the password screen, three wrong letters typed, never submitted (the answer is a 4-digit number; no digit is typed).
// SPOILER NOTE: Derek's password screen shows the post-it "Anniversary" (a hint, not the password). The editor uses a few frames only.
// Entry state: as t04 / t14:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --unlock main_office_area --unlock hallway_west --set briefing_played=true
// Record: run-take.sh t19_minigames "<the flags above>" "--hide-hud --zoom-step 1"
// setup() (before recording): t14's setup up to the picked briefcase (Kevin's kit, walk, pick the lock with synthetic keys), then close it.
// Marks: container-open, note-open, note-closed, door-start, key-mode, key-turn, door-open, password-open, typed, password-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { setup as t04Setup } from './t04_lockpick.mjs';

async function closeAll(bridge) {
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
}

async function pickBriefcase(page, bridge) {
  const r = await bridge.interact('patricia_briefcase', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  await sleep(400);
  const st0 = await page.evaluate(() => window.MinigameFramework.currentMinigame.pins.map(p => ({ i: p.index, binding: p.binding })));
  await page.evaluate(() => { for (const t of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(t, { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true })); });
  await sleep(500);
  for (const idx of [...st0].sort((a, b) => a.binding - b.binding).map(p => p.i)) {
    const res = await page.evaluate(async (idx) => {
      const mg = window.MinigameFramework.currentMinigame; const pin = mg.pins[idx];
      const ev = (t) => window.dispatchEvent(new KeyboardEvent(t, { key: String(idx + 1), code: 'Digit' + (idx + 1), keyCode: 49 + idx, which: 49 + idx, bubbles: true }));
      const dist = () => Math.abs((-50 + pin.driverPinLength - pin.currentHeight) - (-45));
      ev('keydown'); const t0 = performance.now();
      while (performance.now() - t0 < 8000 && dist() > 1.2 && !pin.isOverpicked) await new Promise(r => requestAnimationFrame(r));
      ev('keyup'); await new Promise(r => setTimeout(r, 120));
      return { set: !!pin.isSet };
    }, idx);
    if (!res.set) throw new Error('pin ' + (idx + 1) + ' did not set');
    await sleep(300);
  }
  await bridge.waitForMinigameClosed({ timeoutMs: 8000 });
  await sleep(1200);
}

export async function setup(page, bridge) {
  await t04Setup(page, bridge);
  await pickBriefcase(page, bridge);
  await closeAll(bridge);
  await clearScreen(page, bridge, () => {});
  await sleep(600);
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  // 1. the briefcase contents
  const r = await bridge.interact('patricia_briefcase', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('briefcase interact failed ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame('container', { timeoutMs: 8000 });
  mark('container-open', await bridge.minigame.getState().catch(e => String(e)));
  await sleep(2200);
  const k = await bridge.minigame.take("Derek's Office Key");
  mark('key-taken', { ok: k && k.ok });
  await sleep(900);
  // 2. Patricia's note (taking a note from a container opens the notes reader)
  const n = await bridge.minigame.take("Patricia's Note — CyberChef");
  mark('note-take', { ok: n && n.ok, r: JSON.stringify(n).slice(0, 200) });
  await sleep(600);
  mark('note-open', { which: (await bridge.getState()).activeMinigame });
  await sleep(2500);
  await closeAll(bridge);
  mark('note-closed');
  await sleep(600);
  // 3. Derek's office door with his key
  for (const room of ['hallway_west', 'hallway_east']) {
    const e = await bridge.enterRoom(room, { timeoutMs: 30000 });
    if (!e || e.ok === false) throw new Error('enterRoom ' + room + ' ' + JSON.stringify(e).slice(0, 200));
    await sleep(300);
  }
  mark('door-start');
  const d = await bridge.enterRoom('derek_office', { timeoutMs: 30000 });
  mark('door-call', { r: JSON.stringify(d).slice(0, 300) });
  if (d && d.reason === 'door-locked') {          // a locked door: walk up to it and use it, as a player does
    const id = d.doorway.id;
    await bridge.moveToNear(id, { timeoutMs: 20000 });
    await sleep(300);
    const di = await bridge.interact(id, { timeoutMs: 20000 });
    mark('door-interact', { r: JSON.stringify(di).slice(0, 300) });
  }
  await bridge.waitForMinigame('lockpicking', { timeoutMs: 10000 });
  await sleep(300);
  let ks = await bridge.minigame.getState();
  mark('key-mode', { keyMode: ks && ks.keyMode, keyTarget: ks && ks.keyTarget });
  await sleep(1200);
  ks = await bridge.minigame.getState();
  const sel = ks && (ks.keySelection || (ks.state && ks.state.keySelection));
  if (sel && sel.length) {                          // the key selection screen comes first: pick Derek's key
    const pick = sel.find(s => /derek/i.test(s.label || '')) || sel[0];
    await bridge.minigame.clickCanvas(pick.x, pick.y);
    mark('key-selected', { label: pick.label, n: sel.length });
    await sleep(1200);
    ks = await bridge.minigame.getState();
  }
  const kt = ks && (ks.keyTarget || (ks.state && ks.state.keyTarget));
  if (!kt) throw new Error('no keyTarget ' + JSON.stringify(ks).slice(0, 600));
  await bridge.minigame.clickCanvas(kt.x, kt.y);
  mark('key-turn');
  await bridge.waitForMinigameClosed({ timeoutMs: 10000 });
  mark('door-open');
  await sleep(800);
  const e2 = await bridge.enterRoom('derek_office', { timeoutMs: 30000 });
  if (!e2 || e2.ok === false) throw new Error('enter derek_office ' + JSON.stringify(e2).slice(0, 200));
  await sleep(600);
  // 4. Derek's password screen
  const pc = (await bridge.getState()).nearby.find(x => x.name === "Derek's Computer");
  if (!pc) throw new Error("Derek's Computer not found");
  const p = await bridge.interact(pc.id, { timeoutMs: 20000 });
  if (!p || p.ok === false) throw new Error('pc interact failed ' + JSON.stringify(p).slice(0, 300));
  await bridge.waitForMinigame('password', { timeoutMs: 8000 });
  mark('password-open');
  await sleep(1200);
  for (const ch of ['d', 'e', 'r']) {
    const t = await bridge.minigame.type(0, ch, { submit: false, clear: false });
    if (t && t.ok === false) mark('type-fail', t);
    await sleep(260);
  }
  mark('typed');
  await sleep(1500);
  await closeAll(bridge);
  mark('password-closed');
  await sleep(800);
};
