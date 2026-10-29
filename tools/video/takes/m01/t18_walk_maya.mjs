// t18_walk_maya: short walking shot, the player crosses her office towards Maya Chen with the arrow keys (no click marker) and stops before any dialogue opens (no interaction, no voice).
// Entry state: head-start in maya_office; Maya at (64,97), player starts beside her at (80,96)
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room maya_office --set briefing_played=true
// Record: run-take.sh t18_walk_maya "--start-room maya_office --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup() (before recording): measure the walking speed, then move the player to the far start point (110, 178). The take: 1.2 s establishing hold, walk the legs, 3.2 s hold.
// Marks: walk-start, leg:<dir>, walk-end.
import { sleep, clearScreen } from './lib.mjs';
import { measureSpeed, keyLegs } from './walklib.mjs';
let speed = 150;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  speed = (await measureSpeed(bridge, 'up')) || speed;
  const r = await bridge.moveTo(110, 178, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('setup move failed ' + JSON.stringify(r).slice(0, 200));
  await sleep(1200);
}
export default async (page, bridge, mark) => {
  mark('speed', { pxPerS: speed });
  await sleep(1200);
  mark('walk-start', (await bridge.getState()).player);
  await keyLegs(bridge, [['up', 120], ['left', 90]], speed, mark);
  mark('walk-end', (await bridge.getState()).player);
  await sleep(3200);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened during the walk');
};
