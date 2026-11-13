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
  // Read each payoff document in turn (best-effort: the container lists them by name).
  for (const name of DOCS) {
    const c = await bridge.minigame.clickText(name).catch(() => ({ ok: false }));
    if (c && c.ok) {
      await sleep(400);
      mark('read:' + name, { minigame: (await bridge.getState()).activeMinigame?.id });
      await sleep(HOLD_MS[name] || 5000);
      mark('hold-end:' + name);
      // back out of the document to the container (or close if it closed the container)
      for (let i = 0; i < 2; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
      // re-open the archive if closing the doc also closed the case
      if (!(await bridge.getState()).activeMinigame) { await bridge.interact(ARCHIVE_ID, { timeoutMs: 15000 }).catch(() => {}); await sleep(1200); }
    } else {
      mark('read-skip:' + name, { why: JSON.stringify(c).slice(0, 120) });
    }
  }
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(800);
};
