// t24_custody_console (m06, keyless, NOT YET RUN): the custody console PIN pad (cold_storage_console, pc, lockType pin, maxAttempts 1) in data_center. Three wrong digits (DIGITS), never ENTER, closed. A wrong submit would trip console_tripped: never submit.
// Entry state (new-game): --imports=none --unlock data_center --start-room data_center --set briefing_played=true   Record flags: "--hide-hud --zoom-step 1"
// Record: MISSION=m06 run.sh vivian_ashby t24_custody_console "<flags above>" "--hide-hud --zoom-step 1"
// Marks: pad-open, pad-typed, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll, DIGITS } from './_cres.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear('cold_storage_console', { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, 'cold_storage_console', 'pad', mark); await sleep(1800);
  await typeKeys(page, DIGITS, mark, 'pad', 500); await sleep(1500);
  await closeAll(page, bridge); mark('closed'); await sleep(1200);
};
