// t06b_lookup_panel_narrow: narrowed-panel variant of t06_lookup_panel for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state and marks; both buttons must stay in frame.
// "Look up" and "Carry on" are never clicked.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk t06b_lookup_panel_narrow "<STEP_AWAY_FLAGS>" "--hide-hud --zoom-step 1"
import { run, setup } from './t06_lookup_panel.mjs';
export { setup };
export default (page, bridge, mark) => run(page, bridge, mark, { narrowed: true });
