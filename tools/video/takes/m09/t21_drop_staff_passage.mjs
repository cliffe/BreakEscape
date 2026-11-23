// t21_drop_staff_passage (m09, keyless, NOT YET RUN): the Drop. From front_desk the player walks north through the (unlocked) door into staff_passage; the motion lights strike (flicker). Dark lead-in: start recording on the dark door. Nothing opened, no NPC.
// Entry state (new-game): --imports=none --start-room front_desk --unlock front_desk --unlock staff_passage --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m09 run.sh lucia_moreno t21_drop_staff_passage "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, door-open, lights-on:staff_passage (the payoff), lights-seen, walk-end, linger-end. Noor is in front_desk (frame her out or accept).
import { sleep, clearScreen, watchLights } from '../lib/lib.mjs';
import { keyLegs } from '../lib/walklib.mjs';
import { doorId } from './_c9x.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  const lights = await watchLights(page, mark, 'staff_passage'); await sleep(1200);
  const D = await doorId(bridge, 'front_desk', 'staff_passage');
  await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(700); mark('walk-start', (await bridge.getState()).player);
  const r = await bridge.interact(D, { timeoutMs: 20000 }); mark('door-open', { ok: r && r.ok, D }); await sleep(700);
  await keyLegs(bridge, [['up', (await bridge.getState()).player.y - 110]], 105, mark);
  const ok = await lights.waitOn(6000); mark('lights-seen', { ok }); await lights.drain(); await sleep(2200); mark('walk-end', (await bridge.getState()).player); await lights.drain(); await sleep(1500); mark('linger-end');
};
