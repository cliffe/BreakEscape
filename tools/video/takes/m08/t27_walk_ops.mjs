// t27_walk_ops (m08, keyless, NOT YET RUN): walking shot, operations_floor: a straight key-driven walk across the floor past the water cooler (ops_cooler), 150 px along x then held 1 s. M08_WALK overrides the length. Check the walk is straight and nobody is pushed.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh harjit_singh t27_walk_ops "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { walkRel } from './_c8.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('walk-start', (await bridge.getState()).player);
  await walkRel(bridge, mark, Number(process.env.M08_WALK || 150), 0); mark('walk-end', (await bridge.getState()).player); await sleep(1000);
};
