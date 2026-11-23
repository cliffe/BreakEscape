// t05b_inbox_list_narrow: narrowed mail client (760 px, as ca13 and ca18) for the 9:16 and 1:1 crops. Same entry state (defend seed), body, marks as t05_inbox_list.
//   tools/video/takes/run-take.sh ca19_malware_and_updates t05b_inbox_list_narrow "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca19.mjs';
import { body } from './t05_inbox_list.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => body(page, bridge, mark, true);
