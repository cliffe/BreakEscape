// t02_lights (m02): the player walks east from reception into ward_vestibule; its motion-sensor lights strike on entry (the trailer's drop).
// Entry state: fresh game with the briefing gate: PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t02_lights "--set briefing_played=true" "--hide-hud --zoom-step 1"
// Take: 1.2 s hold in lit reception, the door opens (interact walks the player to it), then arrow-key walk east through the doorway into the dark vestibule and on.
// Marks: walk-start, door-open, lights-on:ward_vestibule (the payoff), walk-end, linger-end. Dark lead-in is door-open to lights-on.
import { sleep, clearScreen, watchLights } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
const SPEED = 105;
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'ward_vestibule');
  await sleep(1200);
  mark('walk-start', (await bridge.getState()).player);
  const r = await bridge.interact('door:reception_lobby->ward_vestibule', { timeoutMs: 20000 });
  mark('door-open', { ok: r && r.ok, mode: r && r.mode });
  await sleep(700);
  const p = (await bridge.getState()).player;
  mark('after-door', p);
  await keyLegs(bridge, [['right', 420]], SPEED, mark);
  const ok = await lights.waitOn(6000);
  mark('lights-seen', { ok });
  await lights.drain();
  await sleep(1800);
  mark('walk-end', (await bridge.getState()).player);
  await lights.drain();
  mark('linger-end');
};
