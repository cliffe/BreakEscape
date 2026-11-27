// t19_floor_props (m06, keyless, NOT YET RUN): trading_floor. (1) the PC desktop on trading_workstation (pc, no lock; shows its desktop, nothing opened; check frames for any login or code). (2) the spare desk phone (floor_spare_phone): interact emits desk_phone_ring:lerato_phone, Lerato's desk phone rings and she goes to answer (office-life needs must be running). Hold 5 s on the floor.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room trading_floor --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh ngozi_adeyemi t19_floor_props "<flags above>" "--hide-hud --zoom-step 1"
// Marks: pc-open, pc-held, pc-closed, phone-interact, phone-held (activeMinigame noted), linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_cres.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(900);
  await bridge.moveToNear('trading_workstation', { timeoutMs: 20000 }); await sleep(700);
  const r = await bridge.interact('trading_workstation', { timeoutMs: 20000, approach: false }); await sleep(1500);
  mark('pc-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(2600); mark('pc-held'); await closeAll(page, bridge); mark('pc-closed'); await sleep(800);
  await bridge.moveToNear('floor_spare_phone', { timeoutMs: 20000 }); await sleep(700);
  mark('phone-interact');
  const r2 = await bridge.interact('floor_spare_phone', { timeoutMs: 20000, approach: false });
  await sleep(1200);
  mark('phone-state', { ok: r2 && r2.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await closeAll(page, bridge);
  await sleep(5000); mark('phone-held'); mark('linger-end');
};
