// t07_walk_vm (m02): the player walks up to the SAFETYNET Field Console (vm_launcher_rooting_for_a_win) in server_room and stands at it. The console is NEVER opened.
// Entry state: head-start in server_room: new-game.rb m02_ransomed_trust --start-room server_room --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t07_walk_vm "--start-room server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand about 100 px below the console (as far as the room allows). Take: 0.8 s hold, arrow-key walk (left, then up) to it, 2 s hold. Marks: walk-start, leg:*, walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;   // measured on this take: 105 overshoots by about 35 percent in server_room
let vm = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  vm = s.nearby.find(n => n.id === 'vm_launcher_rooting_for_a_win');
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player));
  if (!vm) throw new Error('console not found');
  const OFFX = 75;   // start this far right of the console so the walk has an L-shaped approach (about 2 s of motion)
  await bridge.moveTo(vm.x + OFFX, vm.y + 125, { timeoutMs: 20000 });
  await sleep(300);
  let p = (await bridge.getState()).player;
  await keyLegs(bridge, [['down', vm.y + 125]], SPEED);
  p = (await bridge.getState()).player;
  if (Math.abs(p.x - (vm.x + OFFX)) > 4) await keyLegs(bridge, [[p.x < vm.x + OFFX ? 'right' : 'left', vm.x + OFFX]], SPEED);
  await sleep(1000);
  console.error('SETUP', JSON.stringify({ vm, player: (await bridge.getState()).player }));
}
export default async (page, bridge, mark) => {
  await sleep(800);
  mark('walk-start', { vm });
  await keyLegs(bridge, [['left', vm.x], ['up', vm.y + 34]], SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(2000);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened');
  mark('linger-end');
};
