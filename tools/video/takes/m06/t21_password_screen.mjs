// t21_password_screen (m06, keyless, NOT YET RUN): the password panel on door:trading_floor->server_room (lockType password). Opens, held, three wrong characters (z, q, x), never Enter, closed.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room trading_floor --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh frank_callahan t21_password_screen "<flags above>" "--hide-hud --zoom-step 1"
// Marks: panel-open, panel-typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll } from './_cres.mjs';
const DOOR = 'door:trading_floor->server_room';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, DOOR, 'panel', mark); await sleep(2200);
  await typeKeys(page, ['z', 'q', 'x'], mark, 'panel', 350); await sleep(1500);
  await closeAll(page, bridge); mark('closed'); await sleep(1200);
};
