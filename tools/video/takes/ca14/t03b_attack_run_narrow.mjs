// t03b_attack_run_narrow: t03_attack_run with the browser frame and mail client capped at 560 px (injected NARROW_CSS) for the 9:16 and 1:1 edits.
// Same entry state, beats, hides and marks as t03_attack_run; only the panel width differs. Check each frame: the post text and "Pin" buttons whole, the slots and
// the Red flags counter whole, the landed panel whole.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t03b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t03_attack_run.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
