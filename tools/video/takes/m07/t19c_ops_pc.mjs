// t19c_ops_pc (m07, keyless, NOT YET RUN): operations_floor, the Abandoned Operator Workstation (ops_floor_workstation, pc, no lock, read-only grid view). Held 2.6 s, closed. Its text has no code. Call suppressed by architect_t20_played.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set inside_reached=true --set architect_t20_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh vivian_ashby t19c_ops_pc "<flags>" "--hide-hud --zoom-step 1"
// Marks: pc-open, pc-held, pc-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_c7.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('ops_floor_workstation', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.interact('ops_floor_workstation', { timeoutMs: 20000, approach: false }); await sleep(1500);
  mark('pc-open', { ok: r && r.ok, mg: JSON.stringify((await bridge.getState()).activeMinigame).slice(0, 120) });
  await sleep(2600); mark('pc-held'); await closeAll(page, bridge); mark('pc-closed'); await sleep(1000);
};
