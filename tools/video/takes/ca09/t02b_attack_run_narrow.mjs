// t02b_attack_run_narrow: t02_attack_run with the browser frame, the guesser card capped at 560 px (injected NARROW_CSS) for the 9:16 and 1:1 edits.
// Same entry state, beats, hides and marks as t02_attack_run (see there); only the panel width differs. Check each frame: the "did not work" status at the
// right edge of the guesser rows and the Friendface post text must still be whole, and the browser's "Click to note" buttons must not be clipped.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t02b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t02_attack_run.mjs';
export const setup = makeSetup(true);
export default makeRun();
