// t07c_stepaway_panel_narrow: narrowed-panel variant of t07b_stepaway_panel for the 9:16 and 1:1 crops (.epr-kiosk-bezel capped at 560 px, centred). Same entry state and marks; both buttons must be in frame.
// "Look up" and "Carry on" are never clicked.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca11_misdirected_data t07c_stepaway_panel_narrow \
//     "<same --set flags as t07b>" "--hide-hud --zoom-step 1"
import { prepare } from './_ca11.mjs';
import { run } from './t07b_stepaway_panel.mjs';
export async function setup(page, bridge) {
  await prepare(page, bridge);
  const g = (await bridge.getState()).globals || {};
  if (g.kit_defend_done !== true || g.kit_caught === true || g.kit_quiet !== true) throw new Error('entry state wrong');
}
export default (page, bridge, mark) => run(page, bridge, mark, { narrow: true });
