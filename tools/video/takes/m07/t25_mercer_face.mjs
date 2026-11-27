// t25_mercer_face (m07, keyless, NOT YET RUN): scada_control face flash for Dr James Mercer (james_mercer): walk near, open, hold the portrait 2.4 s, close before any menu. Same room as t16 (clock); run separately.
// Entry state (new-game): --imports=none --unlock scada_control --start-room scada_control --set briefing_played=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m07 run.sh vivian_ashby t25_mercer_face "<flags>" "--hide-hud --zoom-step 1"     (avatar: any but t16's)
// Marks: james_mercer-open, james_mercer-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { faceFlash } from './_c7.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(800); }
export default async (page, bridge, mark) => { await sleep(900); await faceFlash(page, bridge, mark, 'james_mercer', 2600); await sleep(600); };
