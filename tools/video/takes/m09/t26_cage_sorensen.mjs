// t26_cage_sorensen (m09, keyless, NOT YET RUN): restricted_cage. (1) THE UI-FREE OVERWORLD SHOT: Sorensen at the shredder's feed, no dialogue opened, the player walks near (moveToNear cage_shredder, not into her) and holds 7 s (zoom-step 1 is the 3x overworld scale). (2) the biometric reader on the Plan Cabinet (plan_cabinet, biometric): one unnamed lift injected off camera, held 3 s, nothing presented, closed.
// Entry state (new-game): --imports=none --start-room restricted_cage --unlock restricted_cage --set briefing_played=true --set bin_chosen=true --set hatch_talked=true   Record: "--hide-hud --zoom-step 1"   (same seeds as t18: no bin scene on entry)
// Record: MISSION=m09 run.sh marcus_hale t26_cage_sorensen "<flags>" "--hide-hud --zoom-step 1"
// Marks: wide-start, wide-end, cabinet-open, cabinet-held, cabinet-closed. Check no HaX toast/task panel from the seeded globals and that she is at the feed, facing the shredder.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, closeAll, injectLift } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await injectLift(page, 'restricted_cage'); await sleep(600); }
export default async (page, bridge, mark) => {
  await sleep(1200); await bridge.moveToNear('cage_shredder', { timeoutMs: 25000 }).catch(() => {}); await sleep(600);
  mark('wide-start', (await bridge.getState()).player); await sleep(7000); mark('wide-end');
  await bridge.moveToNear('plan_cabinet', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'plan_cabinet', 'cabinet', mark); await sleep(3000); mark('cabinet-held');
  await closeAll(page, bridge); mark('cabinet-closed'); await sleep(900);
};
