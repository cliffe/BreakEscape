// live04_flag1_ssh_payoff (m02): flag 1 (SSH foothold, submit_ssh_flag) payoff: the drop-site prints Gary's Recovery Crib Sheet, lifted from his account. Opened from the inventory and held.
// Entry state: LIVE game 93 (playtest03, m02, set 931) with the flag already submitted at the drop-site (off camera,
// in the playtest session); the reward is in the inventory. Replayable (the item stays carried).
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live04_flag1_ssh_payoff "" ""      (no --hide-hud: the item opens from the inventory tray)
// Marks: open:gary_recovery_crib, hold-end:gary_recovery_crib, closed:gary_recovery_crib.
import { payoffSetup, payoffRun } from './_payoff.mjs';

const ID = 'gary_recovery_crib';
export async function setup(page, bridge) { await payoffSetup(page, bridge, [ID]); }
export default async (page, bridge, mark) => { await payoffRun(bridge, mark, ID, 6000, page); };
