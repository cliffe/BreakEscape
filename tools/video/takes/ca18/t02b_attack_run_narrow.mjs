// t02b_attack_run_narrow: t02_attack_run with the OSINT browser and the spray console narrowed to about 560 px (NARROW_CSS) for the 9:16 and 1:1 cuts; the flip heading and strip are
// framed at the end (mark `flip-up-narrow`, the same moment as `flip-up`). Same entry state, beats, hides and marks as t02 (see there). Check the browser's Pin buttons and the console's status words stay whole.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca18 t02b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t02_attack_run.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
