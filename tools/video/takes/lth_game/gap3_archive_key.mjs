// GAP-3 ALTERNATIVE (S30): the exact reaction asked for, "ENTROPY archive decryption key confirmed", via the ENTROPY Encrypted Archive (NOT the
//   station: the station only recognises that key and sends the player to the archive). m01_first_contact, port 3187, display :97, --music 0.
// Entry state (probed, game 13415): run.sh gap3_archive_key = new-game m01 --start-room server_room --set briefing_played=true. new-game.rb writes
//   tools/playtest/m01_first_contact-flags-game<ID>.xml (gitignored; stand-in values, not SecGen's). The take reads the first <flag> from it IN MEMORY
//   (the decryption key = shatter_server flag_1) and types it. NEVER log or mark it; the take marks only counts. test:flag:N does not work here (no station context).
//   run.sh exports GAME_ID so the take finds the xml.
// Masking: the input becomes type=password (bullets) before typing; the archive's panel has no history list. The typed value is never visible.
// Actions: interact entropy_encrypted_archive (opens a "Flag Submission Terminal") -> mask -> type -> SUBMIT -> the archive opens to its CONTENTS screen
//   (titles incl. "Operation Shatter: Architect's Authorisation": spoiler, the editor must cut it before 1 s or crop) -> close -> toasts: "Task Complete: Open
//   the ENTROPY encrypted archive", "Objective Updated", an "Agent HaX: You have SSH access ... privilege escalation guide" toast and, 6 s after the
//   submit, "Agent HaX: ENTROPY archive decryption key confirmed. The archive is unlocked ..." (probe frame at about 9 s after the submit).
// Marks: terminal-open, masked, typed, submitted, container-open (cut before this), closed, reaction-toasts (the 6 s message; frame-check it).
// Expected length about 20 s. Spoiler: medium (contents titles, SSH toast); prefer gap3_flag_station unless the exact line is required.
import fs from 'node:fs';
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(9000); }   // the "server room" arrival toast from HaX lingers about 8 s in frame
export default async (page, bridge, mark) => {
  const gid = process.env.GAME_ID || (page.url().match(/games\/(\d+)/) || [])[1];
  const xml = fs.readFileSync(`${process.env.BE_ROOT || process.cwd()}/tools/playtest/m01_first_contact-flags-game${gid}.xml`, 'utf8');
  const flags = [...xml.matchAll(/<flag>([^<]*)<\/flag>/g)].map(m => m[1]);
  if (flags.length < 1) throw new Error('no flags in the seed xml');
  await bridge.interact('entropy_encrypted_archive', { timeoutMs: 25000 });
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 }); mark('terminal-open');
  await page.evaluate(() => { document.querySelector('#flag-input').type = 'password'; }); mark('masked'); await sleep(1500);
  await bridge.minigame.type(0, flags[0], { submit: false }); mark('typed'); await sleep(1000);
  await page.evaluate(() => document.querySelector('#flag-submit-btn').click()); mark('submitted');
  for (let i = 0; i < 30; i++) { await sleep(200); const m = (await bridge.getState()).activeMinigame; if (m && m.id === 'container') break; }
  mark('container-open'); await sleep(900);
  await bridge.minigame.close(); mark('closed');
  await sleep(7000); mark('reaction-toasts'); await sleep(1500);
};
