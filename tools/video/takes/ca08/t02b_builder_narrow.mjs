// t02b_builder_narrow: the narrowed-panel variant of t02_attack_run for the 9:16 and 1:1 crops (script "Cut notes", 9:16 and 1:1). Same entry state, same body, same marks;
// the mail client (.mail-client, 960 px wide in the 1920 frame) is capped at 560 px by injected CSS once it opens, centred, so slots and the Red flags counter fit a 607 px window.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t02b_builder_narrow "" "--hide-hud --zoom-step 1"
// Only the builder segment (mail-open to slot3/redflags-final) is meant to be used from this take.
import { sleep, prepare } from './_ca08.mjs';
import { run } from './t02_attack_run.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
