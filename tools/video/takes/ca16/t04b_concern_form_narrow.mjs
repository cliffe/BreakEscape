// t04b_concern_form_narrow: narrowed-panel variant of t04_concern_form for the 9:16 and 1:1 crops (.epr-kiosk-bezel and .cf-root capped at 560 px, centred). Same entry state and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t04b_concern_form_narrow \
//     "--set episode_e16_insider_risk_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca16.mjs';
import { run } from './t04_concern_form.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
