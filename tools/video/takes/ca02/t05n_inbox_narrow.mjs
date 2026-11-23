// t05n_inbox_narrow: narrowed-panel variant of t05_inbox_list run B (the list, then the Tendai Shava card) for the 9:16 and 1:1 crops. Same entry state, body and marks;
// the inbox frame (.mail-client, 960 px) is capped at 760 px by injected CSS (560 px clips the verdict buttons and wraps the card badly), centred.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca02_cv_lures t05n_inbox_narrow "--set episode_e2_cv_lures_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_recruiter_contact_attempts=1" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca02.mjs';
import { run } from './t05_inbox_list.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(300); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true, runId: 'B' });
