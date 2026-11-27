// t02n_attack_run: the narrowed-panel variant of t02_attack_run for the 9:16 and 1:1 crops (OSINT page, builder, the green It landed panel, Tomás's reply). Same entry state,
// body and marks; the mail client is capped at 560 px by injected CSS once it opens (text wraps inside), and the hook uses the same panel.
// Entry state: fresh game, no flags.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca04_exec_whaling t02n_attack_run "" "--hide-hud --zoom-step 1"
import { sleep, prepare } from './_ca04.mjs';
import { run } from './t02_attack_run.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await sleep(400); }
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
