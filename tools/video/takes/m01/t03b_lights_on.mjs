// t03b_lights_on: the player steps from hallway_east into the NPC-free, dark motion-sensor storage_closet; the lights strike on.
// (t03_lights_on used main_office_area, which starts lit now office-life staff sit in it, so no strike is visible there.)
// Entry state: head-start in hallway_east (storage_closet is unlocked):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room hallway_east --set briefing_played=true
// Record: BE_SPRITE=ngozi_adeyemi run-take.sh m01 t03b_lights_on "--start-room hallway_east --set briefing_played=true" "--hide-hud --zoom-step 1"
// Marks: enter-room, room-entered, lights-on:storage_closet (the payoff), walk-start, walk-end, linger-end.
import { sleep, clearScreen, watchLights } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'storage_closet');
  await sleep(1200);
  mark('enter-room');
  const r = await bridge.enterRoom('storage_closet', { timeoutMs: 20000 });
  mark('room-entered', { ok: r && r.ok, player: (await bridge.getState()).player });
  if (!r || r.ok === false) throw new Error('enterRoom failed ' + JSON.stringify(r).slice(0, 200));
  const ok = await lights.waitOn(6000);
  if (!ok) throw new Error('lights never came on');
  await sleep(700);
  const me = (await bridge.getState()).player;
  mark('walk-start', { player: [me.x, me.y] });
  const w = await bridge.moveTo(me.x + 40, me.y - 30, { timeoutMs: 8000 });
  mark('walk-end', { ok: w && w.ok, player: (await bridge.getState()).player });
  await sleep(1800);
  mark('linger-end');
  await lights.drain();
};
