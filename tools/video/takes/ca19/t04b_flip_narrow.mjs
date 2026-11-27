// t04b_flip_narrow: narrowed-panel variant of t04_flip for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state (flip seed), body, marks.
//   tools/video/takes/run-take.sh ca19_malware_and_updates t04b_flip_narrow "--set episode_e19_malware_and_updates_state={\"done\":[\"brief\",\"mistake\"]}" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca19.mjs';
import { run } from './t04_flip.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
