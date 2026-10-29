// t03_lights_on: walk from the lit reception through the door into the dark motion-sensor main_office_area; the lights strike on.
// Entry state: head-start (skips the HaX briefing cutscene; the Main Office door is unlocked, so no Sarah/key detour; the office stays dark until entered):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact --set briefing_played=true --unlock main_office_area
// Record: run-take.sh t03_lights_on "--set briefing_played=true --unlock main_office_area" "--hide-hud --zoom-step 1"
// Marks: door-open, lights-on:main_office_area (the payoff), linger-end.
import { sleep, clearScreen, walk, watchLights } from './lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); }   // off camera: Mission Brief notes + tutorial prompt
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'main_office_area');
  await sleep(1200);                                   // establishing: lit reception
  await walk(bridge, mark, [[96, 120], [52, 92]], 'to-door');
  mark('door-open-start');
  const r = await bridge.interact('door:reception_area->main_office_area');
  mark('door-open', { ok: r && r.ok });
  await sleep(900);                                    // the dark office is visible through the open door
  await walk(bridge, mark, [[48, 20], [48, -40]], 'into-office');
  const ok = await lights.waitOn(6000);
  if (!ok) throw new Error('lights never came on');
  await walk(bridge, mark, [[160, -70], [160, -110]], 'deeper');   // centre aisle: no object under the click
  await sleep(1800);                                   // linger on the lit office
  mark('linger-end');
  await lights.drain();
};
