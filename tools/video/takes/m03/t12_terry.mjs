// t12_terry (m03): NIGHT, executive_wing_hallway. Terry patrols with his torch/sight cone; the player stands at a safe distance in view of it, no catch, no hostile state.
// Entry state: new-game.rb ... --start-room executive_wing_hallway --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration --set guard_told_safetynet=true
// Record: BE_SPRITE=daniel_seo tools/video/takes/run-take.sh m03 t12_terry "--start-room executive_wing_hallway --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration --set guard_told_safetynet=true" "--hide-hud --zoom-step 1"
// setup(): optional move to M03_PX,M03_PY (map coords). Take: holds M03_HOLD s (default 12), sampling Terry's position and hostile state every 0.5 s. Marks: terry:<x>,<y>,<hostile>.
import { sleep, clearScreen } from '../lib/lib.mjs';
const find = async (bridge) => (await bridge.getState()).nearby.find(n => /terry/i.test(n.id));
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y), n.room])), 'player', JSON.stringify(s.player));
  if (process.env.M03_PX) { await bridge.moveTo(Number(process.env.M03_PX), Number(process.env.M03_PY), { timeoutMs: 20000 }); }
  await sleep(900);
  console.error('SETUP player', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  const hold = Number(process.env.M03_HOLD || 12);
  for (let i = 0; i < hold * 2; i++) {
    const t = await find(bridge); const p = (await bridge.getState()).player;
    mark('terry', { t: t && [Math.round(t.x), Math.round(t.y), t.state && t.state.hostile, Math.round(t.distance)], p: [Math.round(p.x), Math.round(p.y)] });
    await sleep(500);
  }
};
