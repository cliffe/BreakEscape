// live06_flag3_database_payoff (m02): flag 3 (database backup located, submit_database_flag) payoff: the drop-site cuts the Verified Restore Manifest from the recovered catalogue. Opened from the inventory and held.
// Entry state: LIVE game 93 (playtest03, m02, set 931) with the flag already submitted at the drop-site (off camera,
// in the playtest session); the reward is in the inventory. Replayable (the item stays carried).
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live06_flag3_database_payoff "" ""      (no --hide-hud: the item opens from the inventory tray)
// Marks: open:verified_restore_manifest, hold-end:verified_restore_manifest, closed:verified_restore_manifest.
import { payoffSetup, payoffRun } from './_payoff.mjs';

const ID = 'verified_restore_manifest';
export async function setup(page, bridge) { await payoffSetup(page, bridge, [ID]); }
export default async (page, bridge, mark) => { await payoffRun(bridge, mark, ID, 6500, page); };
