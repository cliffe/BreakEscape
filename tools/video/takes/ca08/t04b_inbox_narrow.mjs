// t04b_inbox_narrow: the narrowed-panel variant of t04_ayaan_inbox for the 9:16 and 1:1 crops (script "Cut notes"): same entry state, body and marks, the mail client capped at 760 px (560 px squeezes the four verdict cards into unreadable slivers; dry run).
// Entry state: as t04_ayaan_inbox.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca08_after_the_click t04b_inbox_narrow \
//     "--set episode_e8_after_the_click_state={\"done\":[\"brief\",\"osint\",\"write\",\"flip\"]} --set phish_takeover_victim_attempts=1" "--hide-hud --zoom-step 1"
import { run, setup } from './t04_ayaan_inbox.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true, px: 760 });
