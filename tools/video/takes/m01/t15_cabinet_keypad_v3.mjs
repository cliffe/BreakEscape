// t15_cabinet_keypad_v3 (v3, three digits at 0.6 s pace, 1 s linger on the 3-digit display; replaces t15_cabinet_keypad): the Main Filing Cabinet keypad (PIN minigame, main_office_area_safe_0). Three digits only, then back off (Cancel).
// The digits (7, 2, 5) are deliberately not digits of the real code, so nothing of the PIN appears on screen. No ENTER, the attempts log stays empty.
// Entry state: head-start in main_office_area:
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room main_office_area --set briefing_played=true
// Record: run-take.sh t15_cabinet_keypad_v3 "--start-room main_office_area --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: cabinet-click, minigame-open, digit:1, digit:2, digit:3 (payoff), back-off, minigame-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';

export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('cabinet-click');
  const r = await bridge.interact('main_office_area_safe_0', { timeoutMs: 20000 });
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason });
  const w = await bridge.waitForMinigame('pin', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('pin minigame did not open ' + JSON.stringify(r).slice(0, 300));
  mark('minigame-open');
  await sleep(1400);
  for (const [i, d] of ['7', '2', '5'].entries()) {
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
