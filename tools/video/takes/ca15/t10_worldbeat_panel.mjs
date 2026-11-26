// t10_worldbeat_panel: beat 6 of the ca15 r3 trailer. The runner on the "One from the red-team kit" panel (Look up and Carry on visible), nothing pressed.
// Entry state: fresh game, no flags. setup() plays the four picks off camera (about 12 s) and asserts the heading.
//   BE_SPRITE=female_office_worker_v2 run-take.sh ca15_shadow_it t10_worldbeat_panel "" "--hide-hud --zoom-step 1"
// Marks: worldbeat_visible (the edit's in = +0.3), end. Never presses Look up / Carry on.
import { sleep, prepare, toWorldBeatPanel } from './_ca15.mjs';

export async function setup(page, bridge) { await prepare(page, bridge); await toWorldBeatPanel(page, bridge); await sleep(300); await page.mouse.move(1500, 1000); }

export default async (page, bridge, mark) => {
  mark('worldbeat_visible'); await sleep(4500);
  mark('end');
};
