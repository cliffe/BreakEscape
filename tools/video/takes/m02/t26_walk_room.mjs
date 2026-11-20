// t26_walk_room (m02, v2): a purposeful key-driven walk in staff_room (not the ward, not the corridor): from the lower right, left along the open bottom row, then UP the gap between the two tables toward the clerk's desk and the Night Handover whiteboard on the north wall. No NPC, no dialogue, no item touched (the contractor lanyard is at (84,211), well to the left of the path).
// Entry: new-game.rb m02_ransomed_trust --start-room staff_room   Record: tools/video/takes/run-take.sh m02 t26_walk_room "--start-room staff_room" "--hide-hud --zoom-step 2"
// setup(): walk off camera to the start point (290,262). Marks: walk-start, leg:left, leg:up, walk-end (stops at the desk; recording ends 0.4 s later, no idle tail).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveTo(290, 262, { timeoutMs: 20000 }).catch(() => {});
  const pulse = async (axis, target, tol) => {
    for (let i = 0; i < 10; i++) {
      const p = (await bridge.getState()).player; const d = target - p[axis];
      if (Math.abs(d) <= tol) return;
      await bridge.walk(axis === 'y' ? (d > 0 ? 'down' : 'up') : (d > 0 ? 'right' : 'left'), Math.max(25, Math.round(Math.abs(d) / SPEED * 1000 * 0.85)));
      await sleep(150);
    }
  };
  await pulse('x', 290, 4); await pulse('y', 262, 4);
  await sleep(700);
  console.error('SETUP', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  await sleep(700);
  const s0 = (await bridge.getState()).player;
  mark('walk-start', { player: { x: s0.x, y: s0.y } });
  await keyLegs(bridge, [['left', 155], ['up', 140]], SPEED, mark);
  const s1 = (await bridge.getState()).player;
  mark('walk-end', { player: { x: s1.x, y: s1.y } });
  await sleep(400);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened');
};
