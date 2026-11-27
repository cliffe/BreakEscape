// t05b_pages_list_narrow: t05_pages_list with the mail client at 760 px (injected CSS, panes stacked) for the 9:16 and 1:1 cuts; the opened genuine card is framed on its address bar and tick.
// Same entry state, marks and hazards.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t05b_pages_list_narrow "--set episode_e10_downloads_and_fake_checks_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_order_colleague_attempts=1" "--hide-hud --zoom-step 1"
import { setup, body } from './t05_pages_list.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
