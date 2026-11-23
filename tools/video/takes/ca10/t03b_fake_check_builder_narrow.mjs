// t03b_fake_check_builder_narrow: t03_fake_check_builder with the panel narrowed to 560 px (injected CSS, panes stacked) for the 9:16 and 1:1 cuts. Same entry state, marks and hazards.
// Frame on the host chips, the address bar, padlock and heading.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca10_downloads_and_fake_checks t03b_fake_check_builder_narrow "" "--hide-hud --zoom-step 1"
import { setup, body } from './t03_fake_check_builder.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
