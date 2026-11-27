// GAP-2 (S31 phone_ask 1.6 s + S32 field_guide 1.8 s) for the LTH whole-game trailer. Mission m01_first_contact (the earliest with the handler phone).
// Port: 3187 (keyless, BE_PORT=3187). Display: :97 (tools default; never :147). No voice needed (phone lines are silent), --music 0.
// Entry state (probed headless on game 13411, 2026-11-25): fresh m01 game, opening briefing gated off, and the lockpicking guide choice offered
//   (in play it appears after picking up Kevin's lockpick; the global is the same one the pickup sets):
//   run.sh gap2_field_guide   (= new-game m01 --set briefing_played=true --set lockpicking_guide_offered=true; record flags none: HUD ON, the phone opens from the tray)
// Guide: "SAFETYNET Field Guide: Lockpicking" (a technique guide, not an answer). Choice text on screen: "Send me the lockpicking field guide".
// Actions: close the Mission Brief (setup) -> open the phone from the inventory -> pick Agent HaX -> choices shown (hold 1.4 s) -> choose the
//   guide -> HaX replies and the guide is given to the inventory -> pick "Thanks, I'll use it" -> close the phone -> open the guide item
//   (bridge.openInventoryItem) -> the LAB SHEET popup loads https://cliffe.github.io/... (needs network, 200 in ~0.35 s). Popup shows
//   "Handler Note - Agent HaX" then "SAFETYNET Field Guide Extract: Lockpicking" at 1920x1080 (frame-checked in the probe screenshot).
//   Optional small wheel scroll over the iframe brings the guide heading to mid-frame.
// Marks: phone-open, contact-picked, choices-shown (choice texts), choice:<text>, reply-settled, phone-closed, guide-open-click, guide-visible (editor's in point), linger-end.
// Expected length: about 22 s raw; shot needs 1.6 s (choices + choose) and 1.8 s (guide visible). Cut on marks, frame-check.
// Spoiler: low. The guide text is lockpicking technique. Do not scroll further than the first screen. No flag or code is on screen.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 }); mark('phone-open');
  await sleep(1300);
  const c = await bridge.minigame.clickText('Agent HaX'); mark('contact-picked', { ok: c && c.ok });
  const d = await awaitChoice(bridge, 45000);
  if (!d) throw new Error('no choices');
  const texts = d.choices.map(x => x.text);
  if (!texts.some(t => /lockpicking field guide/i.test(t))) throw new Error('guide choice not offered: ' + texts.join(' | '));
  mark('choices-shown', { choices: texts });
  await sleep(1400);
  const ch = await bridge.minigame.choose(/lockpicking field guide/i);
  if (!ch || !ch.ok) throw new Error('choose failed');
  mark('choice:' + ch.chose);
  await sleep(4500);                                   // HaX's reply prints
  await awaitChoice(bridge, 20000); mark('reply-settled');
  await bridge.minigame.choose(/Thanks/i); await sleep(2200);
  await bridge.minigame.close().catch(() => {}); await sleep(900); mark('phone-closed');
  mark('guide-open-click');
  const g = await bridge.openInventoryItem('safetynet_field_guide_lockpicking');
  if (!g || !g.ok) throw new Error('guide did not open ' + JSON.stringify(g).slice(0, 200));
  await sleep(2500); mark('guide-visible');
  await page.mouse.move(960, 600); await page.mouse.wheel(0, 260);   // optional: guide heading to mid-frame
  await sleep(2200); mark('linger-end');
};
