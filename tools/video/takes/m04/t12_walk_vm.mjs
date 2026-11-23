// t12_walk_vm (m04): the player walks straight up to the BMS jump-server launcher (vm_launcher_bms_jump_server) in the workshop and stands at it. NEVER opened (its panel shows a post-it with a login).
// Entry state: new-game.rb m04_critical_failure --imports=none --start-room engineering_workshop --unlock engineering_workshop --set briefing_played=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m04 t12_walk_vm "<same flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end, linger-end. Offsets via M04_OFFX/M04_OFFY (default 75,125 as m03).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
let vm = null;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  vm = s.nearby.find(n => n.id === 'vm_launcher_bms_jump_server');
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])), 'player', JSON.stringify(s.player));
  if (!vm) throw new Error('launcher not found');
  const OFFX = Number(process.env.M04_OFFX || 75), OFFY = Number(process.env.M04_OFFY || 125);
  await bridge.moveTo(vm.x + OFFX, vm.y + OFFY, { timeoutMs: 20000 });
  await sleep(300);
  await keyLegs(bridge, [['down', vm.y + OFFY]], SPEED);
  const p = (await bridge.getState()).player;
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
