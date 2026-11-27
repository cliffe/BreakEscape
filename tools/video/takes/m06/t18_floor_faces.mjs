// t18_floor_faces (m06, keyless, NOT YET RUN): trading_floor face flashes for Dani Okonkwo (trader_npc), Lerato Dlamini (lerato_dlamini), Tomasz Wisniewski (tomasz_wisniewski): walk near, open, hold the portrait 2.4 s, close before any menu. Never reads past the opener. The three wander (office life): moveToNear follows their live position.
// Entry state (new-game): --imports=none --unlock trading_floor --start-room trading_floor --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh lucia_moreno t18_floor_faces "<flags above>" "--hide-hud --zoom-step 1"
// Marks: <id>-open, <id>-closed, <id>-error.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash } from './_cres.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(900);
  for (const id of ['trader_npc', 'tomasz_wisniewski', 'lerato_dlamini']) { try { await faceFlash(page, bridge, mark, id); } catch (e) { mark(id + '-error', { e: String(e).slice(0, 150) }); } }
};
