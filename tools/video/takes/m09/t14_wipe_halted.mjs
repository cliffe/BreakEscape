// t14_wipe_halted (m09, keyless, NOT YET RUN): server_closet with tran_outcome=talked: Jesse is hidden (his room_entered mapping) and the console reads "WIPE HALTED ... 97 of 212 reels intact." under the amber light. Console opened, held 2.6 s, closed.
// Entry state (new-game): --imports=none --start-room server_closet --set briefing_played=true --set tran_outcome=talked   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh lucia_moreno t14_wipe_halted "<flags>" "--hide-hud --zoom-step 1"
// Marks: console-open, console-closed. First run: confirm Jesse is not in frame and the amber light shows.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll } from './_c9.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('tape_side_console', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => { await sleep(1200); await openMg(bridge, 'tape_side_console', 'console', mark); await sleep(2600); await closeAll(page, bridge); mark('console-closed'); await sleep(1000); };
