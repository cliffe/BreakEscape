// t08_ending (m09), ONE-SHOT, the mission ending: the player calls Agent HaX and picks "Bring me in." -> "Bring me in."
// (#ending_check). If optional objectives are still open the ending warning comes up and the take presses "End the
// mission" on camera (#ending-check-end; or the objectives panel's held-ending button). start_debrief opens the closing
// debrief in the hangar (Director Netherton and HaX, voiced person chat), played through with every line heard and the
// first offered choice at each menu. When it closes (report_done) the mission concludes: the victory cue, the closing
// card and the credits, then the conclusion screen. Holds on it.
// Voiced: the debrief (Netherton, HaX and co-speakers; keyed dev server). The call-in is a phone text chat.
// One-shot: sets start_debrief, debrief_played, report_done; the game concludes. The last take before --finish.
// Entry state: LIVE game 87 (playtest04, m09, set 918): tesseract_call_done true, start_debrief false.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/87 STORAGE_STATE=<playtest04 login.mjs state> \
//   tools/video/takes/run-take.sh m09 t08_ending "" ""      (HUD kept: the phone opens from the inventory tray)
// Recorded 2026-11-13 06:02 (game 87): warning shown, "End the mission" pressed on camera, debrief played (7 choices,
// 30 of 33 lines voiced; 3 long Netherton lines got TTS 500), report_done, the victory map and credits played (the screen
// detector below misses them: they are not body text). check-take: picture 0% drop, audio drifts to ~0.67 s by the end
// (10 min take), so the end needs a manual resync; raw kept.
// Marks: contact-picked, line {speaker}, choices-shown, choice:*, ending-check-shown, ending-check-end, end-held,
// debrief-open, tts-response, debrief-done, credits-on, screen, conclusion, synced, linger-end.
import { sleep, clearScreen } from '../lib/lib.mjs';
import { watchTts, globals, endgameGlobals, playChat, syncNow, closeAll, openHax, passTitle } from './_live.mjs';

export async function setup(page, bridge) {
  await passTitle(page, bridge);
  await sleep(2000);
  const g = await endgameGlobals(page);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.tesseract_call_done !== true || g.start_debrief === true) throw new Error('wrong entry state: ' + JSON.stringify(g));
  await clearScreen(page, bridge, () => {});
}

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400)).catch(() => '');
const debriefOpen = async (bridge) => { const s = await bridge.getState(); return !!(s.activeMinigame && s.activeMinigame.id === 'person-chat'); };

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  await sleep(1500);
  const c = await openHax(bridge);
  mark('contact-picked', { ok: c && c.ok });
  // Press "End the mission" when the ending warning shows (in parallel with the chat loop).
  let stop = false, pressed = false;
  const watcher = (async () => {
    while (!stop) {
      if (!pressed && await page.$('#ending-check-end')) {
        mark('ending-check-shown', { text: (await screenText(page)).slice(0, 300) });
        await sleep(3500);
        await page.click('#ending-check-end').catch(() => {});
        pressed = true; mark('ending-check-end');
      }
      await sleep(300);
    }
  })();
  const r = await playChat(page, bridge, mark, {
    prefer: [/^Bring me in\.?$/i], avoid: [/.*/], donePicks: 2, dwellMs: 1800, timeoutMs: 120000
  }).catch(e => ({ error: String(e).slice(0, 200) }));
  mark('callin-chat', r);
  let open = false;
  for (let i = 0; i < 40 && !open; i++) { open = await debriefOpen(bridge); if (!open) await sleep(500); }
  // A held ending (the warning answered "Keep going" by a stray Esc): press the panel's "End the mission".
  if (!open && await page.evaluate(() => !!(window.endingCheck && window.endingCheck.hasHeld && window.endingCheck.hasHeld()))) {
    await closeAll(bridge); await sleep(1000);
    // The button sits in the panel's list, which a folded panel hides: open it, and fall back to endHeld
    await page.evaluate(() => { const p = window.objectivesPanel; if (p && p.isCollapsed) p.setCollapsed(false); });
    await sleep(500);
    const b = await page.$('.objectives-end-button');
    const shown = b ? await b.isVisible().catch(() => false) : false;
    if (shown) await b.click({ timeout: 5000 }).catch(() => {}); else await page.evaluate(() => window.endingCheck.endHeld());
    mark('end-held', { how: shown ? 'button' : 'endHeld' });
    for (let i = 0; i < 40 && !open; i++) {
      if (!pressed && await page.$('#ending-check-end')) { await sleep(1500); await page.click('#ending-check-end').catch(() => {}); pressed = true; mark('ending-check-end'); }
      open = await debriefOpen(bridge); if (!open) await sleep(500);
    }
  }
  stop = true; await watcher;
  mark('debrief-open', { open, g: await globals(page, ['start_debrief']) });
  if (!open) throw new Error('the debrief did not open');
  const d = await playChat(page, bridge, mark, { prefer: [], avoid: [], dwellMs: 1700, timeoutMs: 900000 }).catch(e => ({ error: String(e).slice(0, 200) }));
  mark('debrief-done', { ...d, voiced: tts.filter(t => t.status === 200 && /audio/.test(t.type)).length, ttsAll: tts.length,
    bad: tts.filter(t => t.status !== 200).map(t => t.status + ' ' + (t.text || '').slice(0, 50)) });
  const t0 = Date.now();
  let lastTxt = '', conclusionAt = null;
  while (Date.now() - t0 < 180000) {
    const s = await bridge.getState();
    const txt = await screenText(page);
    if (/MISSION COMPLETE|COSTLY SUCCESS/i.test(txt) && !/MISSION COMPLETE|COSTLY SUCCESS/i.test(lastTxt)) mark('credits-on', { mg: s.activeMinigame && s.activeMinigame.id });
    if (txt.slice(0, 60) !== lastTxt.slice(0, 60)) mark('screen', { mg: s.activeMinigame && s.activeMinigame.id, text: txt.slice(0, 160) });
    lastTxt = txt;
    if (!conclusionAt && s.activeMinigame && /conclusion|bond|engagement|report/i.test((s.activeMinigame.id || '') + ' ' + (s.activeMinigame.type || ''))) { conclusionAt = Date.now(); mark('conclusion', { mg: s.activeMinigame }); }
    if (conclusionAt && Date.now() - conclusionAt > 12000) break;
    await sleep(1000);
  }
  mark('synced', { ok: await syncNow(page) });
  mark('linger-end', { g: await globals(page, ['start_debrief', 'report_done', 'albion_notified']) });
  await sleep(1500);
};
