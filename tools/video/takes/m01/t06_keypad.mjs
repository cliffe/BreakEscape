// t06_keypad: the IT Department door keypad (PIN minigame). Two digits only, then back off (Cancel). The digits are deliberately NOT digits of the real
// code, so no part of the PIN appears on screen. The attempts log stays empty (no ENTER).
// Entry state: head-start in main_office_area (the IT door is on its east wall):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room main_office_area --set briefing_played=true
// Record: run-take.sh t06_keypad "--start-room main_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: door-click, minigame-open, digit:1, digit:2 (the payoff: "19__" on the keypad), back-off, minigame-closed.
import { sleep, clearScreen } from './lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('door-click');   // the game walks the player to the door itself (a click-to-move waypoint can land on a chair and pop its text box)
  const r = await bridge.interact('door:main_office_area->it_room');
  if (!r || r.ok === false) throw new Error('door interact failed ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('pin', { timeoutMs: 8000 });
  mark('minigame-open');
  await sleep(1400);
  for (const [i, d] of ['1', '9'].entries()) {
    const c = await bridge.minigame.clickText(d, { exact: true });
    mark('digit:' + (i + 1), { ok: c && c.ok });
    await sleep(750);
  }
  const st = await bridge.minigame.getState();
  mark('entered-length', { n: st.enteredLength, attempts: st.attemptsUsed });
  await sleep(1300);                                  // linger on the half-entered keypad
  mark('back-off');
  await bridge.minigame.clickText('Cancel');
  await bridge.waitForMinigameClosed({ timeoutMs: 5000 });
  mark('minigame-closed');
  await sleep(1200);
};
