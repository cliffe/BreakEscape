// GAP-3 (S30 flag_accepted 3.2 s, required), PRIMARY version: the SAFETYNET Drop-Site Terminal accepts a flag and the story reacts. m01_first_contact.
// Port 3187, display :97. --music 0, no voice. Record with no extra flags (keep the HUD: the objectives panel shows "Task Complete" context).
// Entry state (probed headless, game 13413): run.sh gap3_flag_station = new-game m01 --start-room server_room --set briefing_played=true
//   (server_room is the start room: unlocked, the station is in it; no VM needed).
// FLAG VALUE: never exists on screen or in logs. The take types the dev stand-in "test:flag:1" (server resolves it to the station's first real flag,
//   then every normal check runs; docs/test-bridge.md "VM-backed flags"). Even so the take masks it: the input becomes type=password (bullets) and a
//   MutationObserver replaces the history entry text "test:flag:N" with bullets. Mask regions for the editor if still wanted: input box about
//   x 686-1106, y 455-518; SUBMITTED FLAGS list row about x 686-1234, y 785-820 (1920x1080). Marks 'masked' and 'submitted' give the times.
// Actions: wait for toasts to clear -> interact flag_station_dropsite -> mask -> type -> click SUBMIT -> "Flag accepted!" + reward panel
//   ("Directory-traversal evidence secured") -> hold -> close -> after the minigame closes the game shows "Task Complete: Submit directory
//   traversal evidence" and the Agent HaX toast "Directory traversal evidence secured. ... Check what derek can do with sudo." (probe frame: both toasts, top right).
// The reaction is the m01 linux_flag_submitted line, neutral (no answer). NOTE: the brief asked for "archive decryption key confirmed"; at the station that
//   key flag is NOT accepted (hint-only: it is entered at the archive), so see gap3_archive_key.mjs for that exact line. Use this one if a station shot matters most.
// Marks: terminal-open, masked, typed, submitted, accepted (result text), closed, reaction-toasts (editor out point about 3 s after).
// Expected length about 16 s; shot uses 3.2 s: typing + "Flag accepted!" + the toasts. Leftover: the object description bubble at the bottom after close (editor crops or cuts before it).
import { sleep, clearScreen } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(9000); }   // the "server room" arrival toast from HaX lingers about 8 s in frame
export default async (page, bridge, mark) => {
  const r = await bridge.interact('flag_station_dropsite', { timeoutMs: 25000 });
  if (!r || r.ok === false) throw new Error('interact failed ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('flag-station', { timeoutMs: 8000 }); mark('terminal-open');
  await page.evaluate(() => {
    document.querySelector('#flag-input').type = 'password';
    const list = document.querySelector('#flag-history-list');
    const scrub = () => { const w = document.createTreeWalker(list, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) if (/test:flag|flag\{/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\S*(test:flag:\d+|flag\{[^}]*\})\S*/gi, '••••••••••'); };
    new MutationObserver(scrub).observe(list, { childList: true, subtree: true, characterData: true });
  });
  mark('masked'); await sleep(1800);
  await bridge.minigame.type(0, 'test:flag:1', { submit: false }); mark('typed'); await sleep(1000);
  await page.evaluate(() => document.querySelector('#flag-submit-btn').click()); mark('submitted');
  await sleep(2200);
  const res = await page.evaluate(() => (document.querySelector('#flag-result') || {}).innerText || '');
  if (!/accepted/i.test(res) || /not accepted/i.test(res)) throw new Error('flag not accepted: ' + res.slice(0, 80));
  mark('accepted', { result: res.slice(0, 40) });
  await sleep(1500);
  await bridge.minigame.close(); mark('closed');
  await sleep(4500); mark('reaction-toasts');
  await sleep(800);
};
