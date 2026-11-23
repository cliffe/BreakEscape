// t10b_dm_inbox_narrow: t10_dm_inbox with the inbox capped at 560 px by injected CSS (verdict buttons stacked), for the 9:16 and 1:1 edits. Same entry state, beats and marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca14_social_media t10b_dm_inbox_narrow <same flags as t10> "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t10_dm_inbox.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
