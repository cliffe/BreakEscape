// t24_vault_pad (m07, keyless, NOT YET RUN): the cable vault PIN pad on door:generator_room->cable_vault, PAD.vault typed (3 wrong digits), never ENTER, closed. The ATS-1 plate (backup_transfer_switch, in this room) is NEVER interacted with: the overlay covers the room while the pad is open, and the in/out points must keep the room clear of it (check first and last frames; crop if the batrack sprite shows a plate).
// Entry state (new-game): --imports=none --unlock server_room --unlock generator_room --start-room generator_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh daniel_seo t24_vault_pad "<flags>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, PAD } from './_c7.mjs';
const DOOR = 'door:generator_room->cable_vault';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(DOOR, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, DOOR, 'pad', mark); await sleep(1800);
  await typeKeys(page, PAD.vault, mark, 'pad', 500); await sleep(1500);
  await closeAll(page, bridge); mark('closed'); await sleep(1200);
};
