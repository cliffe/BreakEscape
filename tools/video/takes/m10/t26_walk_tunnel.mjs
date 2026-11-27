// t26_walk_tunnel (m10, keyless, NOT YET RUN): walking shot east from forward_post through the blast door into blast_tunnel (enterRoom does the path). The tunnel guard appears on room_entered and challenges on sight within seconds: the take ends 1.5 s after entering and closes any chat that opened; the editor cuts at 'entered' plus about 1 s. (The guard exchange is t13.)
// Entry (new-game): --imports=none --start-room forward_post --unlock blast_tunnel --set briefing_played=true --set breach_open=true   Record: "--hide-hud --zoom-step 1"   (avatar harjit_singh)
// Record: MISSION=m10 run.sh harjit_singh t26_walk_tunnel "<flags>" "--hide-hud --zoom-step 1"
// Marks: walk-start, entered, walk-end. Risk: enterRoom may click-to-move (marker); if the marker shows, rebuild with keyLegs once the door x is known from a run.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { closeAll } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(1200); }
export default async (page, bridge, mark) => {
  await sleep(1000); mark('walk-start', (await bridge.getState()).player);
  const e = await bridge.enterRoom('blast_tunnel', { timeoutMs: 45000 }); mark('entered', { ok: e && e.ok }); await sleep(1500);
  mark('walk-end', (await bridge.getState()).player); await closeAll(page, bridge);
};
