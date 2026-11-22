// t02_two_rooms (ca12, beat 1 or 8): the studio and Delphine's lobby desk in one frame. Player at the studio/lobby doorway (setup moves
// there from the start spot); 4 s hold, then a 2 s straight walk toward the lobby (key-driven, stopping by distance not time, so a throttled
// dry run and the real 30 fps capture end at the same place). Fresh game, nothing spoilery on screen. Needs the avatar window (player visible).
// Entry state: PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater
// Record: run-take.sh ca12_visitor_tailgater t02_two_rooms "" "--hide-hud --zoom-step 1"
// Marks: hold-start, frame:hold, walk-start, leg:*, frame:walking, walk-end.
import { sleep, prepare } from './_ca12.mjs';
import { keyLegs } from '../lib/walklib.mjs';

const DOOR = { x: 296, y: 80 };   // just inside the studio/lobby door (door sits at 304,80)
export async function setup(page, bridge) {
  await prepare(page, bridge);
  await bridge.moveTo(DOOR.x - 20, DOOR.y, { timeoutMs: 15000 }).catch(() => {});
  await sleep(800);
}

export default async (page, bridge, mark) => {
  mark('hold-start');
  await sleep(2000);
  mark('frame:hold');
  await sleep(2000);
  mark('walk-start', { player: (await bridge.getState()).player });
  await keyLegs(bridge, [['right', DOOR.x + 12]], 60, mark);   // about 2 s at 60 px/s ... the stop is by distance
  mark('frame:walking');
  await sleep(300);
  mark('walk-end', { player: (await bridge.getState()).player });
};
