// t04_naming_call (m05 Insider Trading), ONE-SHOT, the first phone-driven conclusion beat. With the badge log
// in hand (found_door_log) and nobody suspected yet, the player rings Patricia Morgan from the phone: "I know who
// it is." -> "David Torres." -> the front-door reason ("His badge comes in the front door six minutes before her
// spare. Every night."). She checks the pattern against her own log (door_log_reasoned_first), ties it to the
// staging manifest, and says it's enough to look in his office (torres_suspected, name_a_suspect completes, the
// "Find Out Why" aim opens, Owen may hand over the office spare). Plays every voiced line in full, then holds on
// her hub and hangs up.
//
// One-shot: the reason menu retires once torres_suspected is set. setup() refuses unless found_door_log is true
// and torres_suspected / torres_identified are false. Recorded once, live, as it happens.
// NOTE (2026-11-13): the recorded take's state did not persist (no sync before the take browser closed); the call was
// re-driven headless with the same three choices, so footage and game state agree. The script now syncs at the end.
// No flag value, password or code appears: Patricia speaks story only.
// Entry state: LIVE game 86 (playtest01, m05, set 924): all four flags in, found_door_log true, torres_suspected false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/86 STORAGE_STATE=<playtest01 login.mjs state> \
//   tools/video/takes/run-take.sh m05 t04_naming_call "" ""
// Marks: phone-open, contact-picked, choices-shown, choice:*, menu-reached, linger-end, closed, tts-response.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, playThrough } from './_live.mjs';

const g = (page, keys) => page.evaluate((ks) => { const v = (window.gameState && window.gameState.globalVariables) || {}; const o = {}; ks.forEach(k => { o[k] = v[k]; }); return o; }, keys);

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  const s = await g(page, ['found_door_log', 'torres_suspected', 'torres_identified', 'patricia_phone_available', 'patricia_ko']);
  console.error('SETUP GLOBALS', JSON.stringify(s));
  if (s.found_door_log !== true || s.torres_suspected === true || s.torres_identified === true || s.patricia_phone_available !== true || s.patricia_ko === true)
    throw new Error('not at the naming threshold: ' + JSON.stringify(s));
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
    steps: [/^I know who it is/i, /^David Torres/i, /front door six minutes before her spare/i],
    dwellMs: 1800, settleMs: 1000, timeoutMs: 150000,
  });
  await sleep(3000);
  mark('linger-end', await g(page, ['torres_suspected', 'door_log_reasoned_first', 'patricia_authorised_office']));
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
  mark('closed');
  await sleep(2500);
  mark('synced', { ok: await page.evaluate(async () => { if (!window.stateSync) return false; return await window.stateSync.syncConfirmed(); }).catch(e => String(e)) });
};
