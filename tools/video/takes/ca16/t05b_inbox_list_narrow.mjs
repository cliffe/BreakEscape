// t05b_inbox_list_narrow: narrowed-panel variant of t05_inbox_list for the 9:16 and 1:1 crops (.mail-client capped at 560 px, centred). Same entry state, setup and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t05b_inbox_list_narrow \
//     "--set episode_e16_insider_risk_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { run, setup } from './t05_inbox_list.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
