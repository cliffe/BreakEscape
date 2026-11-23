// t22_stacks_closeups (m09, keyless, NOT YET RUN): open_stacks. (1) the H&L box password screen (hl_box, safe, password, showKeyboard): opened, held 2.4 s, three wrong letters z/q/x, never ENTER, closed. (2) face flash Cody Old Coyote (old_coyote): portrait 1.6 s, closed before his hub menu (his first line is "Hey. Building's closed. You lost?" then a menu).
// Entry state (new-game): --imports=none --start-room open_stacks --set old_coyote_quiet=true --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (old_coyote_quiet is the scenario's own skipIfGlobal for his sight challenge)
// Record: MISSION=m09 run.sh mei_lin_chow t22_stacks_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: box-open, box-typed, box-closed, old_coyote-open, old_coyote-closed. Torres' ring (hl_box lid) needs globals not set here. Check no hint/answer on the password screen.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll, faceFlash } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  await bridge.moveToNear('hl_box', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'hl_box', 'box', mark); await sleep(2400);
  for (const k of ['z', 'q', 'x']) { await page.keyboard.press(k); await sleep(400); } mark('box-typed'); await sleep(1300);
  await closeAll(page, bridge); mark('box-closed'); await sleep(900);
  await faceFlash(page, bridge, mark, 'old_coyote', 1600); await sleep(600);
};
