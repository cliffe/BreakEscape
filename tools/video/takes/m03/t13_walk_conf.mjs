// t13_walk_conf (m03): DAY. The player walks along main_hallway to the west door of conference_room_01 (Victoria's) and stops in front of it; the door is NEVER opened.
// Entry state: new-game.rb ... --start-room main_hallway --set briefing_played=true (day lights: motion sensor strikes on as the player is present)
// Record: BE_SPRITE=lucia_moreno tools/video/takes/run-take.sh m03 t13_walk_conf "--start-room main_hallway --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand M03_OFFX px right of the door (default 150), at y 96 (open floor). Take: 1 s hold, arrow-key walk left to (door.x + M03_STOP, default 40), then up to the door's y, 3.5 s hold. Marks: walk-start, leg:*, walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
let door = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y), n.room])), 'player', JSON.stringify(s.player));
  door = s.nearby.find(n => /conference/.test(n.id) && /door/.test(n.id + n.kind));
  if (!door) throw new Error('conference door not found');
  const OFFX = Number(process.env.M03_OFFX || 250);
  await bridge.moveTo(door.x + OFFX, Number(process.env.M03_Y || 96), { timeoutMs: 20000 });
  await keyLegs(bridge, [['down', Number(process.env.M03_Y || 100)]], SPEED);
  await sleep(900);
  console.error('SETUP', JSON.stringify({ door, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('walk-start', { door });
  await keyLegs(bridge, [['left', door.x + Number(process.env.M03_STOP || 40)], ['up', door.y]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(3500);
  const st = await bridge.getState();
  if (st.activeMinigame || st.player.room !== 'main_hallway') throw new Error('left hallway / minigame opened');
  mark('linger-end');
};
