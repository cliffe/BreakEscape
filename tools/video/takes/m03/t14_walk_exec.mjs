// t14_walk_exec (m03): NIGHT, executive_wing_hallway. The player walks along the hallway past furniture, heading somewhere; no wall or door bump; Terry's guard_told_safetynet is set so he never catches the player.
// Entry state: new-game.rb ... --start-room executive_wing_hallway --set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration --set guard_told_safetynet=true
// Record: BE_SPRITE=ngozi_adeyemi tools/video/takes/run-take.sh m03 t14_walk_exec "<flags above>" "--hide-hud --zoom-step 1"
// env M03_X0,M03_Y0 start; M03_X1 end x (key walk along x, then optional M03_Y1). Marks: walk-start, leg:*, walk-end, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 145;
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  console.error('NEARBY', JSON.stringify(s.nearby.map(n => [n.id, Math.round(n.x), Math.round(n.y), n.room])), 'player', JSON.stringify(s.player));
  if (process.env.M03_X0) await bridge.moveTo(Number(process.env.M03_X0), Number(process.env.M03_Y0 || s.player.y), { timeoutMs: 20000 });
  await sleep(900);
  console.error('SETUP', JSON.stringify((await bridge.getState()).player));
}
export default async (page, bridge, mark) => {
  await sleep(1200);
  mark('walk-start');
  const legs = [['right', Number(process.env.M03_X1 || 300)]];
  if (process.env.M03_Y1) legs.push(['up', Number(process.env.M03_Y1)]);
  await keyLegs(bridge, legs, SPEED, mark);
  mark('walk-end', { player: (await bridge.getState()).player });
  await sleep(2500);
  mark('linger-end');
};
