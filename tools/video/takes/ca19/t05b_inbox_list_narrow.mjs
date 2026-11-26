// t05b_inbox_list_narrow: narrowed mail client for the 9:16 and 1:1 crops. The panel width is BE_NARROW_PX (default 520), read as narrow() does in ca16. Same entry state (defend seed), body, marks as t05_inbox_list.
//   BE_NARROW_PX=520 tools/video/takes/run-take.sh ca19_malware_and_updates t05b_inbox_list_narrow "..." "--hide-hud --zoom-step 1"
//   tools/video/takes/run-take.sh ca19_malware_and_updates t05b_inbox_list_narrow "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\",\"flip\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca19.mjs';
import { body } from './t05_inbox_list.mjs';
import { NARROW_MAIL } from '../ca13/_ca13.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
const W = Number(process.env.BE_NARROW_PX) || 520;
const NARROW = NARROW_MAIL.replace(/560px/g, `${W}px`);
export default (page, bridge, mark) => body(page, bridge, mark, NARROW);
