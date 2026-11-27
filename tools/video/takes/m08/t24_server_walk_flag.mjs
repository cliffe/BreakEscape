// t24_server_walk_flag (m08, keyless, NOT YET RUN): (1) the walk to the VM: from operations_floor through the (pre-unlocked) server-room door (motion lights strike on entry), then to the Field Console launcher (vm_launcher_gitlist), stopping before it opens (throws if a minigame opens). (2) the flag station (flag_station_evidence_relay), empty, held 2.6 s, closed. The reader on this door is filmed in t25. The VM launcher's own panel (post-it, login) is never opened.
// Entry state (new-game): --imports=none --unlock server_room --start-room operations_floor --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh lucia_moreno t24_server_walk_flag "<flags>" "--hide-hud --zoom-step 1"
// Marks: room-entering, room-entered, walk-start, walk-end, station-open, station-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, openMg, closeAll } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('room-entering'); await goRoom(page, bridge, ['server_room']); mark('room-entered'); await sleep(1000);
  mark('walk-start'); await bridge.moveToNear('vm_launcher_gitlist', { timeoutMs: 25000 }); mark('walk-end');
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk'); await sleep(900);
  await bridge.moveToNear('flag_station_evidence_relay', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'flag_station_evidence_relay', 'station', mark); await sleep(2600); await closeAll(page, bridge); mark('station-closed'); await sleep(900);
};
