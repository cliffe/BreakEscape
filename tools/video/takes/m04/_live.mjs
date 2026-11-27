// Shared by the m04 takes. They run in LIVE mode against the keyed dev Hacktivity server (game 83, playtest04, set 922,
// all four flags submitted), so a take drives the game as it stands. t01 to t03 are replayable or one-shot story beats that
// do not finish the mission; t04_plant_room and t05_ending play the mission's end (the ESD, the call-in, the debrief and
// the credits) and are one-shot: record them only when the brief says the ending is to be filmed.
import { sleep } from '../lib/lib.mjs';
export { watchTts, goRoom } from '../m03/_live.mjs';

/** The m04 route from the entrance to the plant room, through doors the game already holds open. */
export const ROUTE = ['operations_office', 'scada_control_room', 'battery_hall_1', 'battery_hall_2', 'plant_room'];
export const routeTo = (room) => ROUTE.slice(0, ROUTE.indexOf(room) + 1);

export const globals = (page, keys) => page.evaluate((ks) => {
  const g = (window.gameState && window.gameState.globalVariables) || {};
  return Object.fromEntries(ks.map(k => [k, g[k]]));
}, keys);

/** True while a voiced line is playing, in a person chat (mg.ttsManager) or a phone chat (mg.ui.ttsManager). */
export const ttsBusy = (page) => page.evaluate(() => {
  const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  const t = mg && (mg.ttsManager || (mg.ui && mg.ui.ttsManager));
  return !!(t && t.playing);
}).catch(() => false);

/**
 * Plays a person or phone conversation with every voiced line heard in full. At each choice menu it picks the first
 * `prefer` regex that matches an offered choice, else the first choice that matches none of `avoid`; `stopAt` (a regex)
 * ends the loop when a menu offers it (so the caller can choose it itself). Ends when the conversation closes.
 */
export async function playChat(page, bridge, mark, { prefer = [], avoid = [], stopAt = null, donePicks = Infinity, dwellMs = 1500, settleMs = 900, timeoutMs = 300000 } = {}) {
  let lastText = null, quietSince = Date.now(), picks = 0, noDlg = null;
  const t0 = Date.now();
  let mgId = null;
  while (Date.now() - t0 < timeoutMs) {
    const s = await bridge.getState();
    const d = s.dialogue;
    const id = s.activeMinigame && s.activeMinigame.id;
    if (id && !mgId) mgId = id;
    // Another screen took over (the debrief after the call-in, the credits after the debrief).
    if (mgId && id && id !== mgId) { mark('chat-closed', { picks, next: id }); return { closed: true, picks, next: id }; }
    if (!d) {
      if (!s.activeMinigame) { mark('chat-closed', { picks }); return { closed: true, picks }; }
      // A phone chat that exits goes back to the contact list (no dialogue, phone still open).
      noDlg = noDlg || Date.now();
      if (picks >= donePicks && !(await ttsBusy(page)) && Date.now() - noDlg > 3000) { mark('chat-closed', { picks, phoneOpen: true }); return { closed: true, picks }; }
      await sleep(150); continue;
    }
    noDlg = null;
    if (await ttsBusy(page)) { quietSince = Date.now(); await sleep(100); continue; }
    if (d.awaitingChoice) {
      const texts = d.choices.map(c => c.text);
      if (stopAt && texts.some(t => stopAt.test(t))) { mark('stop-menu', { choices: texts }); return { closed: false, picks, choices: texts }; }
      let pick = null;
      for (const re of prefer) { pick = texts.find(t => re.test(t)); if (pick) break; }
      if (!pick) pick = texts.find(t => !avoid.some(re => re.test(t)));
      if (!pick) throw new Error('no acceptable choice in ' + JSON.stringify(texts));
      mark('choices-shown', { choices: texts });
      await sleep(dwellMs);
      const n = texts.indexOf(pick) + 1;
      const ch = await bridge.minigame.choose(n);
      if (!ch || !ch.ok) throw new Error('choose failed ' + pick + ' ' + JSON.stringify(ch).slice(0, 300));
      mark('choice:' + pick, { number: n });
      picks++; quietSince = Date.now(); await sleep(300); continue;
    }
    const txt = d.text || '';
    if (txt !== lastText) { lastText = txt; quietSince = Date.now(); mark('line', { speaker: d.speaker, text: txt.slice(0, 100) }); }
    if (d.canContinue && Date.now() - quietSince > settleMs) { await bridge.minigame.continue_().catch(() => {}); quietSince = Date.now(); }
    await sleep(120);
  }
  throw new Error('conversation did not finish in ' + timeoutMs + ' ms');
}

/** Closes whatever minigame is open (a few tries). */
export async function closeAll(bridge) {
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(600); }
}

/** Flushes the state sync now (globals otherwise go on a 30 s timer, and a take's page closes right after its end slate). */
export const syncNow = (page) => page.evaluate(async () => { if (!window.stateSync) return false; await window.stateSync.sync(); return true; }).catch(() => false);
