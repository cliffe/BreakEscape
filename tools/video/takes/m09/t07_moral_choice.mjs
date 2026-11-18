// t07_moral_choice (m09), ONE-SHOT, the moral choice: his vendor notice. The player calls Agent HaX and picks
// "His notice." (the coordinated-disclosure notice Tesseract wrote and never sent), then "Send it." HaX: "Gone. Vendor's
// acknowledged. They're saying ninety days for a fix..." and the watch comes down. Then "That's all for now."
// Chosen option: "Send it" (mission.json moralChoices "His vendor notice"; no option is marked recommended, so the one with
// the strongest story payoff: the vendor starts a fix for four hundred sites, and the debrief reads albion_notified).
// Voiced: Agent HaX's hub lines (phone chat; the hub is text on the phone unless the line is voiced).
// One-shot: sets albion_notified (send_the_notice done).
// Entry state: LIVE game 87 (playtest04, m09, set 918): identity_scene_done and tesseract_call_done true, albion_notified false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t07_moral_choice "" ""
// Marks: contact-picked, line, choices-shown, choice:*, chat-closed, sent {albion_notified}, synced, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, globals, endgameGlobals, playChat, syncNow, closeAll, openHax, passTitle } from './_live.mjs';

export async function setup(page, bridge) {
  await passTitle(page, bridge);
  await sleep(2000);
  const g = await endgameGlobals(page);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.tesseract_call_done !== true || g.albion_notified === true || g.start_debrief === true) throw new Error('wrong entry state: ' + JSON.stringify(g));
  await clearScreen(page, bridge, () => {});
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  const c = await openHax(bridge);
  mark('contact-picked', { ok: c && c.ok });
  const r = await playChat(page, bridge, mark, {
    prefer: [/^His notice/i, /^Send it/i, /^That's all for now/i], avoid: [/.*/], donePicks: 3, dwellMs: 1800, timeoutMs: 120000
  }).catch(e => ({ error: String(e).slice(0, 200) }));
  mark('notice-chat', r);
  const g = await globals(page, ['albion_notified']);
  mark('sent', { ...g, voiced: tts.filter(x => x.status === 200 && /audio/.test(x.type)).length, ttsAll: tts.length });
  mark('synced', { ok: await syncNow(page) });
  await sleep(1500);
  await closeAll(bridge);
  await sleep(1500);
  mark('linger-end');
  if (g.albion_notified !== true) throw new Error('notice not sent');
};
