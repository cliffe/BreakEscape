// t23_pin_door (m06, keyless, NOT YET RUN): the PIN pad on door:server_room->data_center. Three wrong digits (DIGITS from _conv.mjs), never ENTER, cancelled out.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true   (data_center stays locked)   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh harjit_singh t23_pin_door "<flags above>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, DIGITS } from './_cres.mjs';
const DOOR = 'door:server_room->data_center';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, DOOR, 'pad', mark); await sleep(1800);
  await typeKeys(page, DIGITS, mark, 'pad', 500); await sleep(1500);
  await closeAll(page, bridge); mark('closed'); await sleep(1200);
};
