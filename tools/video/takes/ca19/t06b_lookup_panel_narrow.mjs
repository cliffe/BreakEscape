// t06b_lookup_panel_narrow: narrowed-panel variant of t06_lookup_panel for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state (step-away seed), body, marks.
//   run-take.sh ca19_malware_and_updates t06b_lookup_panel_narrow "<t06 seed>" "--hide-hud --zoom-step 1"
import { run, setup as setup6 } from './t06_lookup_panel.mjs';
export const setup = setup6;
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
