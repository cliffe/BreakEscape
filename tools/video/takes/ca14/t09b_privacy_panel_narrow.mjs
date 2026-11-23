// t09b_privacy_panel_narrow: t09_privacy_panel with the panel frame capped at 600 px (panel 560 px) by injected CSS, for the 9:16 and 1:1 edits. Same entry state, beats and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t09b_privacy_panel_narrow <same flags as t09> "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t09_privacy_panel.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
