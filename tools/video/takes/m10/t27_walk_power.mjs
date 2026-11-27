// t27_walk_power (m10, keyless, NOT YET RUN): walking shot from workshop_floor east into the dark power_room (motion lights strike on entry). No cut flags are seeded, so the HaX call should not ring in the shot (if it does, the editor cuts before the ring; the call take is t12). Ends 1.5 s after entering.
// Entry (new-game): --imports=none --start-room workshop_floor --unlock workshop_floor --unlock power_room --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar ngozi_adeyemi)
// Record: MISSION=m10 run.sh ngozi_adeyemi t27_walk_power "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, entered, walk-end. Risk: Imran/Gary may open a chat in the workshop on spawn; the take closes any dialogue after the walk.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1200); }
export default async (page, bridge, mark) => {
  await sleep(2500); for (let i = 0; i < 3; i++) { await clearScreen(page, bridge, () => {}); await sleep(700); }
  mark('walk-start', (await bridge.getState()).player);
  const e = await bridge.enterRoom('power_room', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok, e: JSON.stringify(e).slice(0, 400) }); await sleep(1500);
  mark('walk-end', (await bridge.getState()).player); await closeAll(page, bridge);
};
