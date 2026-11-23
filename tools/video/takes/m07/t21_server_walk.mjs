// t21_server_walk (m07, keyless, NOT YET RUN): walk towards vm_launcher_attack_terminal in server_room along straight key legs and STOP before it opens (its panel carries a login post-it: no minigame must open). Throws if one opens. Lines up two legs from the player's spawn: y to the terminal's row +34, then x.
// Entry state (new-game): --imports=none --unlock server_room --start-room server_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh ngozi_adeyemi t21_server_walk "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end. Cut at walk-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const s = await bridge.getState(); const vm = s.nearby.find(n => n.id === 'vm_launcher_attack_terminal');
  if (!vm) throw new Error('launcher not in nearby: ' + JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y)])));
  mark('walk-start', { vm: [vm.x, vm.y], player: s.player });
  await keyLegs(bridge, [['up', vm.y + 34], ['left', vm.x]], 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player }); await sleep(1500);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
};
