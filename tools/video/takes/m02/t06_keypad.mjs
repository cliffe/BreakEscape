// t06_keypad (m02): the emergency storage safe keypad (emergency_storage_safe, PIN minigame). Three digits only, then Cancel. The digits (2, 5, 6) differ position by
// position from the real code and from every other PIN in m02 (checked against the scenario; nothing is written down here). ENTER is never pressed: the attempts log stays empty.
// Entry state: head-start in emergency_equipment_storage: new-game.rb m02_ransomed_trust --start-room emergency_equipment_storage --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t06_keypad "--start-room emergency_equipment_storage --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact, minigame-open, digit:1..3, entered-length, back-off, minigame-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('emergency_storage_safe', { timeoutMs: 20000 });
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('emergency_storage_safe', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('pin', { timeoutMs: 8000 });
  mark('minigame-open');
  await sleep(1400);
  for (const [i, d] of ['2', '5', '6'].entries()) {
    const c = await bridge.minigame.clickText(d, { exact: true });
    mark('digit:' + (i + 1), { ok: c && c.ok });
    await sleep(600);
  }
  const st = await bridge.minigame.getState();
  mark('entered-length', { n: st.enteredLength, attempts: st.attemptsUsed });
  await sleep(1000);
  mark('back-off');
  await bridge.minigame.clickText('Cancel');
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('minigame-closed');
  await sleep(1200);
};
