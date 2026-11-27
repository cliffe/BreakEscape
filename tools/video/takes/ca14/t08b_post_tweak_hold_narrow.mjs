// t08b_post_tweak_hold_narrow: t08_post_tweak_hold with the drill frame capped at 600 px (panel 560 px) by injected CSS, for the 9:16 and 1:1 edits. Same entry state, beats and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t08b_post_tweak_hold_narrow <same flags as t08> "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t08_post_tweak_hold.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
