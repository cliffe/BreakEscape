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
  // first run: keyLegs up stopped at the wall beside the doorway (never left front_desk). Walk to a point beyond the doorway instead.
  const dd = ((await bridge.getState()).nearby || []).find(n => n.id === D) || {}; mark('door-pos', { x: dd.x, y: dd.y });
  const pl = (await bridge.getState()).player; const mv = await bridge.moveTo(pl.x, pl.y - 110, { timeoutMs: 20000 }).catch(e => ({ err: String(e).slice(0, 100) })); mark('moveto-result', { r: JSON.stringify(mv).slice(0, 200) });
  for (let i = 0; i < 20 && (await bridge.getState()).currentRoom !== 'staff_passage'; i++) await sleep(250);
  const ok = await lights.waitOn(6000); mark('lights-seen', { ok }); await lights.drain(); await sleep(2200); mark('walk-end', (await bridge.getState()).player); await lights.drain(); await sleep(1500); mark('linger-end');
};
