// t17_walk_kevin: short walking shot, the player crosses the IT room towards Kevin Park with the arrow keys (no click marker) and stops before any dialogue opens (no interaction, no voice).
// Entry state: head-start in it_room; Kevin at (166,132), player starts beside him at (160,144)
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room --set briefing_played=true
// Record: run-take.sh t17_walk_kevin "--start-room it_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup() (before recording): move the player to the far start point (250, 235; the player stops where the path ends). The take: 1.2 s establishing hold, walk the legs, 3.2 s hold.
// Marks: walk-start, leg:<dir>, walk-end.
import { sleep, clearScreen } from './lib.mjs';
import { keyLegs } from './walklib.mjs';
const SPEED = 105;   // px/s, measured from the leg timings of earlier runs (a 400 ms probe walk is unreliable)
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const r = await bridge.moveTo(250, 235, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('setup move failed ' + JSON.stringify(r).slice(0, 200));   // moveTo stops where it can: the shot starts wherever the player ends up
  await sleep(1200);
}
export default async (page, bridge, mark) => {
  mark('speed', { pxPerS: SPEED });
  await sleep(1200);
  mark('walk-start', (await bridge.getState()).player);
  await keyLegs(bridge, [['up', 150], ['left', 195]], SPEED, mark);
  mark('walk-end', (await bridge.getState()).player);
  await sleep(3200);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened during the walk');
};
