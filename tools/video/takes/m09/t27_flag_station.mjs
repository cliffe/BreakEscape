// t27_flag_station (m09, keyless, NOT YET RUN): reading_room. The Drop Terminal flag station (drop_terminal, flag-station), left EMPTY, held 2.6 s, closed. The field laptop and the login slip are not touched.
// Entry state (new-game): --imports=none --start-room reading_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh lucia_moreno t27_flag_station "<flags>" "--hide-hud --zoom-step 1"
// Marks: station-open, station-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('drop_terminal', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => { await sleep(1000); await openMg(bridge, 'drop_terminal', 'station', mark); await sleep(2600); await closeAll(page, bridge); mark('station-closed'); await sleep(1000); };
