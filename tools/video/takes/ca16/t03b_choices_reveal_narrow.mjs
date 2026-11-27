// t03b_choices_reveal_narrow: narrowed-panel variant of t03_choices_reveal for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state, body, marks.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t03b_choices_reveal_narrow "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca16.mjs';
import { run } from './t03_choices_reveal.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await sleep(500); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
