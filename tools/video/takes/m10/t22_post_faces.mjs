// t22_post_faces (m10, keyless, NOT YET RUN): forward_post face flashes (walk near, open, hold 2.4 s, close before any menu): Officer Kenji Arakawa (arakawa_post), Officer Dev Malhotra (malhotra_post), Darren Price (darren_price), Sofia Marchetti (sofia_marchetti), Agent 0x47 Nightshade (nightshade_table, only shown with an m08 import). Kowalczyk is NOT here (t23, kept out of the run after the WREN card).
// Entry (new-game): --imports=<file {"m08_nightshade_arrested": true}> --start-room forward_post --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar vivian_ashby)
// Record: MISSION=m10 run.sh vivian_ashby t22_post_faces "<flags>" "--hide-hud --zoom-step 1"
// Marks: <id>-open, <id>-closed, <id>-error. Risks: nightshade_table shows only if m08_nightshade_arrested (or triple_agent) and not taken_in (condition read, game_loaded); if he is missing the mark says so and the editor drops him. The office-life staff wander; moveToNear follows them. Kowalczyk stands at x 10 and Nightshade near x 8: keep her out of the flashes' frames (she is on the board of the take, say so to the editor).
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(600); }
export default async (page, bridge, mark) => {
  await sleep(900);
  for (const id of ['arakawa_post', 'malhotra_post', 'darren_price', 'sofia_marchetti', 'nightshade_table']) { try { await faceFlash(page, bridge, mark, id); } catch (e) { mark(id + '-error', { e: String(e).slice(0, 150) }); } }
};
