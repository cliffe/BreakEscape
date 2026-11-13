// live03_vault_payoff (m01): the flag-1 payoff - the ENTROPY Encrypted Archive opening. Submitting the Decryption Key
// (shatter_server:flag_1) at the archive unlocks it; this take opens the ruggedised drive case in server_room and holds
// on the recovered intelligence - the Architect's final authorization for Operation Shatter and the ENTROPY command
// architecture (THE ARCHITECT REVEAL: the network is bigger than one cell). This is the "vault opening" beat.
// No flag value or password is on these pages (story text only). Replayable once flag_1 is submitted: the case stays
// unlocked and the documents stay readable. NEVER film the drop-site / archive flag-entry screen (it lists flag strings)
// - this take opens the ALREADY-UNLOCKED case, it does not submit anything.
// Entry state: LIVE game 90 (playtest04, m01, set 930) with shatter_server:flag_1 already submitted at the archive
// (ssh_flag_submitted / entropy_archive_opened path). Player in or able to reach server_room.
// Record (LIVE mode):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/90 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m01 live03_vault_payoff "" "--hide-hud --zoom-step 1"
// Marks: approach, vault-open {minigame}, read:<doc>, hold-end:<doc>, closed.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { goRoom } from './_live.mjs';

const ARCHIVE_ID = 'entropy_encrypted_archive';
const ROUTE = ['main_office_area', 'it_room', 'server_room'];
// The payoff documents inside, in reading order. The Architect's Authorization is the dramatic beat; the Network
// Architecture file is the reveal (reading it sets entropy_reveal_read, which gates the Derek confrontation).
const DOCS = ['Operation Shatter: Architect\'s Authorization', 'ENTROPY Network Architecture'];
const HOLD_MS = { 'Operation Shatter: Architect\'s Authorization': 6500, 'ENTROPY Network Architecture': 5500 };

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await bridge.getState();
  if (!s.player || s.player.room !== 'server_room') await goRoom(page, bridge, ROUTE);
  await sleep(500);
}

export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('approach');
  const r = await bridge.interact(ARCHIVE_ID, { timeoutMs: 20000 });
  if (!r || r.ok === false) throw new Error('could not open archive ' + JSON.stringify(r).slice(0, 300));
  await bridge.waitForMinigame(null, { timeoutMs: 10000 }).catch(() => {});
  const mg = (await bridge.getState()).activeMinigame;
  mark('vault-open', { minigame: mg && mg.id });
  await sleep(3000); // hold on the opened case: EYES ONLY stamp, the recovered documents list
  // The container lists its documents as take-able items; open each by index (clickText does not match
  // the control labels). Read the item list, then open the view items in turn.
  const mgState = await bridge.minigame.getState().catch(() => ({}));
  const items = (mgState && Array.isArray(mgState.items)) ? mgState.items : [];
  mark('items', { names: items.map(i => (i && (i.name || i.label || i.title)) || i).slice(0, 6), count: items.length });
  const viewIdx = items.map((it, i) => ({ it, i })).filter(({ it }) => !it || it.kind === undefined || it.kind === 'view' || /document|architect|architecture|authoriz/i.test(JSON.stringify(it)));
  const toOpen = (viewIdx.length ? viewIdx : items.map((it, i) => ({ it, i }))).slice(0, 2);
  for (const { it, i } of toOpen) {
    const nm = (it && (it.name || it.label || it.title)) || ('item ' + i);
    const c = await bridge.minigame.take(i).catch(() => ({ ok: false }));
    if (c && c.ok !== false) {
      await sleep(500);
      mark('read:' + nm, { minigame: (await bridge.getState()).activeMinigame?.id });
      const hold = HOLD_MS[nm] || (/architecture/i.test(nm) ? 5500 : 6500);
      await sleep(hold);
      mark('hold-end:' + nm);
      for (let k = 0; k < 2; k++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
      if (!(await bridge.getState()).activeMinigame) { await bridge.interact(ARCHIVE_ID, { timeoutMs: 15000 }).catch(() => {}); await sleep(1200); }
    } else {
      mark('read-skip:' + nm, { why: JSON.stringify(c).slice(0, 120) });
    }
  }
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
