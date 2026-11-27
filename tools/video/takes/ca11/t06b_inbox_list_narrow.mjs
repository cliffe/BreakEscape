// t06b_inbox_list_narrow: narrowed-panel variant of t06_inbox_list for the 9:16 and 1:1 crops (.mail-client capped at 560 px, centred). Same entry state, body and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t06b_inbox_list_narrow \
//     "--set episode_e11_misdirected_data_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca11.mjs';
import { run } from './t06_inbox_list.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
