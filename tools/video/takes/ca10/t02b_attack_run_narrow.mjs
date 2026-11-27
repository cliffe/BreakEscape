// t02b_attack_run_narrow: t02_attack_run with the mail client narrowed to 560 px (injected CSS) and the builder narrowed as t03b, for the 9:16 and 1:1 cuts, so the compose To line and the
// green result panel are not cut by the 607 px crop. Same entry state, marks and hazards as t02_attack_run.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t02b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { setup, body } from './t02_attack_run.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
