// t26_walk_room (m02): a clean key-driven walk in a room that is not the ward or the office corridor. Room: ROOM below. No NPC touched, no dialogue.
// Entry: new-game.rb m02_ransomed_trust --start-room staff_room   Record: tools/video/takes/run-take.sh m02 t26_walk_room "--start-room staff_room" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end, linger-end. setup() logs the player and NPC positions (SETUP on stderr).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
const ROOM = process.env.WALK_ROOM || 'staff_room';
let start = null, dest = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  start = { x: s.player.x, y: s.player.y };
  console.error('SETUP', JSON.stringify({ room: s.player.room, player: start, npcs: s.nearby.filter(n => n.kind === 'npc').map(n => [n.id, Math.round(n.x), Math.round(n.y)]) }));
  await sleep(500);
}
export default async (page, bridge, mark) => {
  await sleep(900);
  const s0 = (await bridge.getState()).player;
  mark('walk-start', { player: { x: s0.x, y: s0.y }, room: s0.room });
  // first run: a 175 px right leg ran into the water cooler and stalled for 2.5 s. Now: down 100 px along the clear column, then right 110 px along the bottom row (about 1.7 s of motion).
  await keyLegs(bridge, [['down', s0.y + 100], ['right', s0.x + 110]], SPEED, mark);
  const s1 = (await bridge.getState()).player;
  mark('walk-end', { player: { x: s1.x, y: s1.y } });
  await sleep(1200);
  if ((await bridge.getState()).dialogue) throw new Error('a dialogue opened');
  mark('linger-end');
};
