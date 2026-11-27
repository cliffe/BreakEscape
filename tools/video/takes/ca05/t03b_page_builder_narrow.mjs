// t03b_page_builder_narrow: t03_page_builder with the panel narrowed to 560 px (injected CSS, panes stacked) for the 9:16 and 1:1 cuts.
// Same entry state, marks and hazards as t03_page_builder. Frame on the address chooser and the padlock chip.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca05_signin_pages t03b_page_builder_narrow "" "--hide-hud --zoom-step 1"
import { setup, body } from './t03_page_builder.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
