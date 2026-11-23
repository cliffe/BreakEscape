// t03b_choices_reveal_narrow: narrowed-panel variant of t03_choices_reveal for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state, body, marks.
//   tools/video/takes/run-take.sh ca19_malware_and_updates t03b_choices_reveal_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca19.mjs';
import { run } from './t03_choices_reveal.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
