// t05b_inbox_list_narrow: t05_inbox_list with the mail client narrowed to 760 px (NARROW_760, injected CSS) for the 9:16 and 1:1 cuts. Same entry state, marks and proofs; run A with CA13_LIST_ONLY=1.
//   tools/video/takes/run-take.sh ca13_ai_assistant t05b_inbox_list_narrow "<t05 seed>" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca13.mjs';
import { body } from './t05_inbox_list.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => body(page, bridge, mark, true);
