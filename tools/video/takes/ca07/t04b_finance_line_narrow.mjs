// t04b_finance_line_narrow: t04_finance_line with the mail client narrowed to 560 px (NARROW_MAIL) for the 9:16 and 1:1 cuts of the topic list (CA07_LIST_ONLY=1) and the triage card.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca07_voice_ceo t04b_finance_line_narrow "--set episode_e7_voice_ceo_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_ceo_voice_target_attempts=1" "--hide-hud --zoom-step 1"
import { setup, body } from './t04_finance_line.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
