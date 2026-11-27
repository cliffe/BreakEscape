// t02b_attack_run_narrow: t02_attack_run with the mail client (writer, result panel) and the OSINT browser frame narrowed to about 560 px (NARROW_MAIL + NARROW_BROWSER, injected CSS)
// for the 9:16 and 1:1 cuts of research, write and lands. Same entry state, marks and hazards. See takes_ca06.md for what the dry run measured (the notices page frame).
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr t02b_attack_run_narrow "" "--hide-hud --zoom-step 1"
import { setup, body } from './t02_attack_run.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
