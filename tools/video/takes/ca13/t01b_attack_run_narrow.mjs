// t01b_attack_run_narrow: t01_attack_run with the mail client narrowed to about 560 px (injected CSS, NARROW) for the 9:16 and 1:1 cuts. Same entry state, marks and proofs
// (hidden-lines, hidden-crop, address-line: at 560 px the hidden line wraps earlier, so the take re-measures where the address falls and throws if it is on line 1).
//   tools/video/takes/run-take.sh ca13_ai_assistant t01b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca13.mjs';
import { body } from './t01_attack_run.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => body(page, bridge, mark, true);
