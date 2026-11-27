// t05_case_call (m05 Insider Trading), ONE-SHOT, the second phone-driven conclusion beat: the naming. With the
// suspicion set by the first call (t04) and both halves of the case in hand (case_motive from the journal and the
// medical bills in his briefcase, case_exfil from the staging manifest tied to his front-door swipe), the player
// rings Patricia again: "I know who it is." -> "David Torres." -> WHY: "His own journal. He knows what it costs,
// and he's doing it anyway." -> PROOF: "The staging manifest. Badge 4471 staged it, and his swipe lets that spare
// in." She takes it ("...Damn. His kids drew on the tablecloth at our Christmas party."), names him
// (identify_torres, torres_identified), and says he is at the upload terminal; "On my way." ends the call. Holds
// a few seconds after (the Recruiter's text may land), then syncs so the naming persists.
//
// Patricia's phone hub is a text thread, not a voiced call (phone-call-voice.js voices only event-driven calls),
// so this beat has no speech by design. One-shot: setup() refuses unless torres_suspected, case_motive and
// case_exfil are true and torres_identified is false. Recorded once, live, as it happens.
// No flag value, password or code appears (the badge number 4471 is story text on the printed manifest).
// Entry state: LIVE game 86 (playtest01, m05, set 924): all four flags in; t04 played; journal, bills and
// Torres' print collected off camera.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/86 STORAGE_STATE=<playtest01 login.mjs state> \
//   tools/video/takes/run-take.sh m05 t05_case_call "" ""
// Marks: phone-open, contact-picked, choices-shown, choice:*, menu-reached, linger-end, closed, synced, tts-response.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough } from './_live.mjs';

const g = (page, keys) => page.evaluate((ks) => { const v = (window.gameState && window.gameState.globalVariables) || {}; const o = {}; ks.forEach(k => { o[k] = v[k]; }); return o; }, keys);

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await g(page, ['torres_suspected', 'case_motive', 'case_exfil', 'torres_identified', 'found_torres_journal', 'patricia_ko']);
  console.error('SETUP GLOBALS', JSON.stringify(s));
  if (s.torres_suspected !== true || s.case_motive !== true || s.case_exfil !== true || s.torres_identified === true || s.found_torres_journal !== true || s.patricia_ko === true)
    throw new Error('not at the case threshold: ' + JSON.stringify(s));
  await sleep(500);
}

export default async (page, bridge, mark) => {
  const vw = { lines: [], drain: async () => {} };
  watchTts(page, mark);
  await sleep(1200);
  const r = await bridge.openInventoryItem('phone');
  if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
  await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
  mark('phone-open');
  await sleep(1700);
  const c = await bridge.minigame.clickText('Patricia Morgan');
  mark('contact-picked', { ok: c && c.ok });
  await sleep(800);
  await playThrough(page, bridge, mark, vw, {
    steps: [/^I know who it is/i, /^David Torres/i, /^His own journal/i, /^The staging manifest/i, /^On my way/i],
    dwellMs: 1900, settleMs: 1100, timeoutMs: 180000,
  });
  await sleep(2500);
  mark('linger-end', await g(page, ['torres_identified', 'torres_reason_guessed', 'door_log_reasoned_first']));
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(7000);
  mark('synced', { ok: await page.evaluate(async () => { if (!window.stateSync) return false; return await window.stateSync.syncConfirmed(); }).catch(e => String(e)) });
  await sleep(800);
};
