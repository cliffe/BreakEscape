// t02b_attack_run_narrow: t02_attack_run with the mail client narrowed to 560 px (NARROW_MAIL) for the 9:16 and 1:1 cuts of build and lands. Same entry state, marks and hazards.
// The OSINT browser frame is narrowed too if CA07_NARROW_BROWSER_CSS holds extra CSS (set after measuring in the dry run; see takes_ca07.md).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t02b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { setup, body } from './t02_attack_run.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
