// t20b_server_closeups (m07, keyless, NOT YET RUN): server_room close-ups in one take: (1) the SCADA password panel on door:server_room->scada_control, left EMPTY (nothing typed), held 2.2 s, closed. (2) the cabling note (rack_cabling_note, notes; says where a code is kept, no code; spoiler call is the orchestrator's), held 2.5 s, closed. (3) the flag station (flag_station_safetynet_relay), empty, held 2.6 s, closed.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh lucia_moreno t20b_server_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: panel-open, panel-closed, note-open, note-closed, station-open, station-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll } from './_c7.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  const D = 'door:server_room->scada_control';
  await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, D, 'panel', mark); await sleep(2200); await closeAll(page, bridge); mark('panel-closed'); await sleep(900);
  await bridge.moveToNear('flag_station_safetynet_relay', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'flag_station_safetynet_relay', 'station', mark); await sleep(2600); await closeAll(page, bridge); mark('station-closed'); await sleep(1000);
};
