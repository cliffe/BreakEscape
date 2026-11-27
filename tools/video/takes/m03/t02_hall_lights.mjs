// t02_hall_lights (m03): the player walks north from reception into main_hallway; its motion-sensor lights strike on entry (the trailer's drop).
// Entry state: DAY variant (the night variant of main_hallway is mode "on", dim, no strike): fresh game with the briefing gate:
//   new-game.rb m03_ghost_in_the_machine --set briefing_played=true     (the 'night' flags are only for the Ffion beats)
// Record: BE_SPRITE=vivian_ashby tools/video/takes/run-take.sh m03 t02_hall_lights "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: walk-start, door-open, lights-on:main_hallway (the payoff), lights-seen, walk-end, linger-end (1.5 s hold after steady).
import { sleep, clearScreen, watchLights } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 105;
const NIGHT = process.env.M03_NIGHT === '1';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'main_hallway');
  await sleep(1200);
  mark('walk-start', (await bridge.getState()).player);
  const r = await bridge.interact('door:reception_lobby->main_hallway', { timeoutMs: 20000 });
  mark('door-open', { ok: r && r.ok, mode: r && r.mode });
  await sleep(700);
  mark('after-door', (await bridge.getState()).player);
  await keyLegs(bridge, [['up', Number(process.env.M03_WALK_Y || 0) || (await bridge.getState()).player.y - 120]], SPEED, mark);
  const ok = await lights.waitOn(6000);
  mark('lights-seen', { ok });
  await lights.drain();
  await sleep(2200);
  mark('walk-end', (await bridge.getState()).player);
  await lights.drain();
  await sleep(1500);
  mark('linger-end');
};
