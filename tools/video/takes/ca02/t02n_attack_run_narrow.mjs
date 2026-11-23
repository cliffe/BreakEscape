// t02n_attack_run_narrow: narrowed-panel variant of t02_attack_run for the 9:16 and 1:1 crops. Same entry state, body and marks; the open-source browser
// (.osint-browser-game-container) and the mail client (.mail-client, builder and result panel) are capped at 560 px by injected CSS, centred.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t02n_attack_run_narrow "" "--hide-hud --zoom-step 1"
// Frame on the vacancy block, the slot pickers with the CV label, the result ticks (check each key frame: nothing may be clipped).
import { sleep, prepare } from './_ca02.mjs';
import { run } from './t02_attack_run.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
