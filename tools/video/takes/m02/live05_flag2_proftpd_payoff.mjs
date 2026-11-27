// live05_flag2_proftpd_payoff (m02): flag 2 (ProFTPD backdoor, submit_proftpd_flag) payoff: the drop-site prints Ghost's Equipment Deployment Log recovered from root. Opened from the inventory and held.
// Entry state: LIVE game 93 (playtest03, m02, set 931) with the flag already submitted at the drop-site (off camera,
// in the playtest session); the reward is in the inventory. Replayable (the item stays carried).
// Record (LIVE mode, see tools/video/takes/run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/93 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m02 live05_flag2_proftpd_payoff "" ""      (no --hide-hud: the item opens from the inventory tray)
// Marks: open:equipment_deployment_log, hold-end:equipment_deployment_log, closed:equipment_deployment_log.
import { payoffSetup, payoffRun } from './_payoff.mjs';

const ID = 'equipment_deployment_log';
export async function setup(page, bridge) { await payoffSetup(page, bridge, [ID]); }
export default async (page, bridge, mark) => { await payoffRun(bridge, mark, ID, 6500, page); };
