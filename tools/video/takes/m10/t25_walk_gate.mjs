// t25_walk_gate (m10, keyless, NOT YET RUN): walking shot at forward_post, straight key legs towards the Field Console (Gate) (gate_console, vm-launcher) and STOP before it opens (its panel carries a login post-it: no minigame must open). Throws if one does. Real-hacking lead-in: cut at walk-end.
// Entry (new-game): --imports=none --start-room forward_post --set briefing_played=true --set breach_open=true   Record: "--hide-hud --zoom-step 1"   (avatar marcus_hale)
// Record: MISSION=m10 run.sh marcus_hale t25_walk_gate "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, leg:*, walk-end. breach_open hides Kowalczyk's post copy (so no face in the walk; the raid copies only show on room entry). If gate_console is not in nearby from the spawn the take throws: then walk part-way first (not scripted).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1500); console.error('SETUP', JSON.stringify((await bridge.getState()).player)); }
export default async (page, bridge, mark) => {
  await sleep(1000); const s = await bridge.getState();
  // gate_console is outside the bridge's nearby scan from the spawn; read its position from the room objects instead.
  const vm = await page.evaluate(() => { const o = window.rooms && window.rooms.forward_post && window.rooms.forward_post.objects && window.rooms.forward_post.objects.gate_console; return o ? { x: o.x, y: o.y } : null; });
  if (!vm) throw new Error('gate_console not in room objects');
  mark('walk-start', { vm: [vm.x, vm.y], player: s.player });
  await keyLegs(bridge, [['up', vm.y + 34], ['right', vm.x - 70]], 145, mark);
  mark('walk-end', { player: (await bridge.getState()).player }); await sleep(6000);
  if ((await bridge.getState()).activeMinigame) throw new Error('a minigame opened on the walk');
};
