// t02b_attack_narrow: narrowed-panel variant of t02_attack_run (research browser .ob-root and prepare panel .pretext-prep, 640 px, capped at 560 px). Dry-run proven 23 Nov (research + prepare frames viewed); the call phone is 400 px and the prompts panel .auth-root 420 px wide already, so only research and prepare need it.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca03_helpdesk_reset t02b_attack_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca03.mjs';
import { run } from './t02_attack_run.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
