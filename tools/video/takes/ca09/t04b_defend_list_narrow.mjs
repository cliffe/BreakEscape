// t04b_defend_list_narrow: t04_defend_list with the mail client capped at 560 px (injected NARROW_CSS) for the 9:16 and 1:1 edits.
// Same entry state, order and marks as t04_defend_list (see there). Check the row text and the reader/card are whole at 560 px.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 t04b_defend_list_narrow "--set episode_e9_passwords_state={\"done\":[\"brief\",\"osint\",\"guess\",\"flip\"]} --set guess_e9_landed=true" "--hide-hud --zoom-step 1"
import { makeSetup, makeRun } from './t04_defend_list.mjs';
export const setup = makeSetup(true);
export default makeRun();
