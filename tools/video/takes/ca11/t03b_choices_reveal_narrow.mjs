// t03b_choices_reveal_narrow: narrowed-panel variant of t03_choices_reveal for the 9:16 and 1:1 crops. Same entry state, body and marks; the kiosk bezel
// (.epr-kiosk-bezel) and the montage panel are capped at 560 px by injected CSS, centred. Ends on Continue, so it also holds the flip heading and strip.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t03b_choices_reveal_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca11.mjs';
import { run } from './t03_choices_reveal.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
