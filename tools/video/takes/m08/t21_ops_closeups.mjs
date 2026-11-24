// t21_ops_closeups (m08, keyless, NOT YET RUN): operations_floor. (1) the archives door password screen (door:operations_floor->security_archives, lockType password): opened, three WRONG characters z q x, never ENTER, closed; (2) the clean note: operations_board (smartscreen "SAFETYNET GLOBAL OPERATIONS -- LIVE ... We are not running operations. We are running a search of ourselves."), no credential, held 2.5 s. The break-room post-it stays off every crop.
// Entry state (new-game): --imports=none --start-room operations_floor --set briefing_played=true --set brief_taken=true   Record: "--hide-hud --zoom-step 1"
// Record: MISSION=m08 run.sh harjit_singh t21_ops_closeups "<flags>" "--hide-hud --zoom-step 1"
// Marks: panel-open, panel-typed, closed, board-open, board-closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { openMg, typeKeys, closeAll } from './_c8.mjs';
const D = 'door:operations_floor->security_archives';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await bridge.moveToNear(D, { timeoutMs: 25000 }); await sleep(900); }
export default async (page, bridge, mark) => {
  await sleep(1200); await openMg(bridge, D, 'panel', mark); await sleep(2000);
  await typeKeys(page, ['z', 'q', 'x'], mark, 'panel', 350); await sleep(1500); await page.evaluate(() => document.querySelectorAll('input').forEach(i => { i.value = ''; i.type = 'text'; i.setAttribute('autocomplete', 'off'); })); await sleep(200); await closeAll(page, bridge); mark('closed'); await sleep(1000);
  await bridge.moveToNear('operations_board', { timeoutMs: 25000 }); await sleep(800);
  await openMg(bridge, 'operations_board', 'board', mark); await sleep(2500); await closeAll(page, bridge); mark('board-closed'); await sleep(800);
};
