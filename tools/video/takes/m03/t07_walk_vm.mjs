// t07_walk_vm (m03): the player walks up to the Training Lab Terminal (vm_launcher_zero_day) in server_room and stands at it. The terminal is NEVER opened (its panel shows a login post-it).
// Entry state: head-start in server_room: new-game.rb m03_ghost_in_the_machine --start-room server_room --unlock server_room --set briefing_played=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m03 t07_walk_vm "--start-room server_room --unlock server_room --set briefing_played=true" "--hide-hud --zoom-step 1"
// setup(): stand below and to the side of the terminal. Take: 0.8 s hold, arrow-key walk (left, then up) to it, 2 s hold. Marks: walk-start, leg:*, walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
let vm = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  vm = s.nearby.find(n => n.id === 'vm_launcher_zero_day');
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player));
  if (!vm) throw new Error('terminal not found');
  const OFFX = Number(process.env.M03_OFFX || 75), OFFY = Number(process.env.M03_OFFY || 125);
  await bridge.moveTo(vm.x + OFFX, vm.y + OFFY, { timeoutMs: 20000 });
  await sleep(300);
  let p = (await bridge.getState()).player;
  await keyLegs(bridge, [['down', vm.y + OFFY]], SPEED);
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
