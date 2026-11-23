// t22_ops_faces (m08, keyless, NOT YET RUN): operations_floor face flashes (portrait held 2.4 s, closed before any menu) for the Junior Analyst, Julian Sallow and Agnieszka Duda. Julian and Agnieszka appear only after found_badge_audit (global_variable_changed event), so setup (off camera) picks up the real printout in the archives (panel closed at once) and walks back. Vector, Phantom, Nightshade, ATHENA, Netherton are NOT here (they have lines).
// Entry state (new-game): --imports=none --unlock security_archives --start-room operations_floor --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh mei_lin_chow t22_ops_faces "<flags>" "--hide-hud --zoom-step 1"
// Marks: background_analyst-open/-closed, julian_sallow-open/-closed, agnieszka_duda-open/-closed. If the pair never appears, the take throws on moveToNear: fall back to the analyst alone.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom, closeAll, faceFlash } from './_c8.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await goRoom(page, bridge, ['security_archives']);
  await bridge.moveToNear('badge_audit_printout', { timeoutMs: 25000 }); await bridge.interact('badge_audit_printout', { timeoutMs: 15000, approach: false }); await sleep(1500); await closeAll(page, bridge);
  await goRoom(page, bridge, ['operations_floor']); await sleep(2500);
}
export default async (page, bridge, mark) => {
  await sleep(900);
  for (const id of ['background_analyst', 'julian_sallow', 'agnieszka_duda']) await faceFlash(page, bridge, mark, id, 2400);
  await sleep(500);
};
