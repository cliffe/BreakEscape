// t25_office_pin (m09, keyless, NOT YET RUN): sorensen_office. The Floor Safe PIN pad (director_safe, pin) with the PIN cracker fitted (starting item): pad opens with the "PIN cracker lights" toggle and help text, PAD.safe (3 wrong digits, check_digits.rb) typed, NEVER ENTER, so no result lights ever show; closed.
// Entry state (new-game): --imports=none --start-room sorensen_office --unlock sorensen_office --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh ngozi_adeyemi t25_office_pin "<flags>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed. Do not open the notes on the desk (rent_book etc.). Check the first and last frames for room text.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, PAD } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('director_safe', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, 'director_safe', 'pad', mark); await sleep(2200);
  await typeKeys(page, PAD.safe, mark, 'pad', 550); await sleep(1800);
  await closeAll(page, bridge); mark('closed'); await sleep(1000);
};
