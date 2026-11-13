// t04_printouts (m03): the flag payoffs as the drop-site printed them. Each submitted VM flag printed a carried
// artefact; the take opens each from the inventory in submission-story order and holds on it:
//   Training Network Map (scan flag), FTP Rehearsal Note (FTP flag), Zero Day Price List (pricing flag),
//   Zero Day Transaction Log (distcc flag: invoice ZDS-2024-0847, St. Catherine's, Sable's approval).
// No flag values or passwords are on these pages (story text only). Replayable: the items stay in the inventory.
// Reading the log sets transaction_log_read (its task is already done once the revelation call is heard).
// Entry state: LIVE game 82 (playtest03, m03, set 921, all flags in); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/82 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m03 t04_printouts "" ""      (no --hide-hud: the items open from the inventory tray)
// Marks: open:<id> {minigame}, hold-end:<id>, closed:<id>.
import { sleep, clearScreen } from '../lib/lib.mjs';

const ITEMS = ['training_network_map', 'ftp_rehearsal_note', 'zero_day_price_list', 'zero_day_transaction_log'];
const HOLD_MS = { zero_day_transaction_log: 6500 };

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const inv = ((await bridge.getState()).inventory || []).map(i => i.id || i.name);
  const missing = ITEMS.filter(id => !inv.includes(id));
  if (missing.length) throw new Error('not in the inventory: ' + missing.join(', ') + ' (have ' + inv.join(', ') + ')');
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await sleep(1200);
  for (const id of ITEMS) {
    const r = await bridge.openInventoryItem(id);
    if (!r || !r.ok) throw new Error('could not open ' + id + ' ' + JSON.stringify(r).slice(0, 300));
    await sleep(300);
    const mg = (await bridge.getState()).activeMinigame;
    mark('open:' + id, { minigame: mg && mg.id });
    await sleep(HOLD_MS[id] || 4000);
    mark('hold-end:' + id);
    for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
    mark('closed:' + id);
    await sleep(900);
  }
};
