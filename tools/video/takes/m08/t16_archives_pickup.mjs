// t16_archives_pickup (m08, keyless, NOT YET RUN): the evidence mechanic. Walk through the (pre-unlocked) archives door, the motion lights strike, walk to the badge audit printout and pick it up (interact). OUT BEFORE THE TEXT PANEL: its text names who was behind the lab door. The take closes any panel within 0.4 s; the edit uses only up to the 'pickup' mark. Check frames for any readable text.
// Entry state (new-game): --imports=none --unlock security_archives --start-room operations_floor --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh mei_lin_chow t16_archives_pickup "<flags>" "--hide-hud --zoom-step 1"
// Marks: room-entering, room-entered, near-printout, pickup, panel-closed. Cut after 'pickup' minus 0.1 s.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, closeAll } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('room-entering'); await goRoom(page, bridge, ['security_archives']); mark('room-entered'); await sleep(1200);
  await bridge.moveToNear('badge_audit_printout', { timeoutMs: 25000 }); mark('near-printout'); await sleep(700);
  await bridge.interact('badge_audit_printout', { timeoutMs: 15000, approach: false }); mark('pickup'); await sleep(350);
  await closeAll(page, bridge); mark('panel-closed'); await sleep(600);
};
