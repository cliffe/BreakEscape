// t23_face_kowalczyk (m10, keyless, NOT YET RUN): ONE face flash on its own so the editor can place it anywhere EXCEPT straight after the "WREN Is on / the Team" card (the sleeper beat): Agent 0x5E 'Lantern' Kowalczyk (kowalczyk_post, shown on game_loaded while breach_open is unset). Hold 2.4 s, close before any menu.
// Entry (new-game): --imports=none --start-room forward_post --set briefing_played=true   Record: "--hide-hud --zoom-step 1"   (avatar mei_lin_chow)
// Record: MISSION=m10 run.sh mei_lin_chow t23_face_kowalczyk "<flags>" "--hide-hud --zoom-step 1"
// Marks: kowalczyk_post-open, kowalczyk_post-closed. EDITOR NOTE: keep this cut among other team faces in the crescendo, never next to the WREN card.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash } from './_c10.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(600); }
export default async (page, bridge, mark) => { await sleep(900); await faceFlash(page, bridge, mark, 'kowalczyk_post', 2600); };
