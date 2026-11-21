// t06_keypad (m03): the server-room wall safe (wall_safe_server, PIN minigame). Three digits only, then Cancel. The digits (1, 3, 7) differ position by position from the real code
// (checked against the scenario; the code is not written down here). ENTER is never pressed: the attempts log stays empty.
// Entry state: head-start in server_room (RFID-locked, so unlock it): new-game.rb m03_ghost_in_the_machine --start-room server_room --unlock server_room --set briefing_played=true
// Record: BE_SPRITE=daniel_seo tools/video/takes/run-take.sh m03 t06_keypad "--start-room server_room --unlock server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: interact, minigame-open, digit:1..3, entered-length, back-off, minigame-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('wall_safe_server', { timeoutMs: 20000 });
  await sleep(800);
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  const r = await bridge.interact('wall_safe_server', { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('pin', { timeoutMs: 8000 });
  mark('minigame-open');
  await sleep(1400);
  for (const [i, d] of ['1', '3', '7'].entries()) {
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
