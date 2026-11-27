// t05b_pages_list_narrow: t05_pages_list with the panel narrowed to 560 px (injected CSS) for the 9:16 and 1:1 cuts. Same entry state, marks and hazards.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t05b_pages_list_narrow "--set episode_e5_signin_pages_state={\"done\":[\"brief\",\"osint\",\"build\",\"write\",\"flip\"]} --set phish_sso_staff_attempts=1" "--hide-hud --zoom-step 1"
import { setup, body } from './t05_pages_list.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
