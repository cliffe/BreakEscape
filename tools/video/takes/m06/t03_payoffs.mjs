// t03_payoffs (m06): the flag payoffs as the backend handed them over. Each submitted VM flag printed a carried
// artefact; the take opens each from the inventory in submission-story order and holds on it:
//   Ledger Hold Log (flag 2, credential reuse / the ledger account): Volkova held each ENTROPY deposit herself, then
//     released it on the CEO override - the leverage hook for her recruitment.
//   Door Controller Export (flag 3, the financial database): the data-centre door PIN (3110).
//   Cold Storage Recovery Keys (flag 4, full estate access via privesc): the custody console code and the cold-storage
//     procedure.
// No flag values or passwords are on these pages (story text and in-world puzzle codes only). Replayable: the items
// stay in the inventory. NOTE: VM-flag numbering on this build is shuffled relative to the story (the privesc value is
// credited to the game's flag-1 task); the carried items are keyed by the game task, not by VM flag number, so the
// items themselves read correctly - see handover_m06_film.md "Flag-order story mismatch".
// Entry state: LIVE game 89 (playtest03, m06, set 915, all four flags submitted); no new game.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/89 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m06 t03_payoffs "" ""      (no --hide-hud: the items open from the inventory tray)
// Marks: open:<id> {minigame}, hold-end:<id>, closed:<id>.
import { sleep, clearScreen } from '../lib/lib.mjs';

const ITEMS = ['ledger_hold_log', 'door_controller_export', 'cold_storage_recovery_keys'];
const HOLD_MS = { ledger_hold_log: 6500, cold_storage_recovery_keys: 5500 };

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
