// t02b_assist_window_narrow: t02_assist_window with .ac-root narrowed to 560 px (injected CSS) for the 9:16 and 1:1 cuts. Same entry state and marks; the reply wraps to more lines.
//   tools/video/takes/run-take.sh ca13_ai_assistant t02b_assist_window_narrow "<t02 seed>" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca13.mjs';
import { body } from './t02_assist_window.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => body(page, bridge, mark, true);
