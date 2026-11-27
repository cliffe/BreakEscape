// t07c_lookup_panel_narrow: t07b_lookup_panel with the panel narrowed to 560 px for the 9:16 and 1:1 cuts (heading and strip, Look up button in frame). Same entry state and hazards (never clicks).
import { setup, body } from './t07b_lookup_panel.mjs';
export { setup };
export default (page, bridge, mark) => body(page, bridge, mark, true);
