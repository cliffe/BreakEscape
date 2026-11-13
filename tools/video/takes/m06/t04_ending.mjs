// t04_ending (m06), ONE-SHOT, the mission ending. The player opens the phone on Agent HaX (agent_0x99) and calls the
// extraction in: "I'm done here. Bring me in." -> "Bring me in." -> "On my way." (#set start_debrief_cutscene). If the
// "optional objectives still open" warning comes up, the take presses "End the mission" on camera. The closing debrief
// (Director Netherton and HaX, voiced person chat) plays through with every line heard and the first offered choice at
// each menu; when it closes the mission concludes (the victory cue, the closing card / credits, the conclusion screen).
// Holds on the conclusion.
//
// ENTRY STATE (hard requirement): the "Bring me in" option is gated on `ready_to_extract`, which the engine sets only
// once BOTH story decisions and all four flags are in:
//   assets_decided === true   (the cold-storage freeze decision, data centre -> custody console -> exec wing)
//   irina_fate_decided === true (Dr Volkova recruited or detained)
//   flag1_submitted..flag4_submitted === true
// So the game must be progressed to the end BEFORE this take (drive it with the playtest session, or on camera with the
// other beats). The take refuses if ready_to_extract is false, naming what is missing.
//
// One-shot: sets start_debrief_cutscene, debrief_played; the game concludes. Run it LAST, right before --finish.
// Voiced: the debrief (keyed dev server voices Netherton and HaX). The call-in itself is a phone text chat.
// Record (LIVE mode, see run-take.sh):
//   LIVE_URL=https://localhost:3000/hacktivities/61/play/mission/89 STORAGE_STATE=<playtest03 login.mjs state> \
//   tools/video/takes/run-take.sh m06 t04_ending "" ""      (HUD kept: the phone opens from the inventory tray)
// Marks: ready {globals}, contact-picked, choices-shown, choice:*, ending-check-shown, ending-check-end, debrief-open,
//   line {speaker}, tts-response, debrief-done, credits-on, conclusion, linger-end.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { watchTts, openHax, passTitle, playThrough, globals } from './_live.mjs';

export async function setup(page, bridge) {
  await passTitle(page, bridge);
  await sleep(1500);
  const g = await globals(page, ['ready_to_extract', 'assets_decided', 'irina_fate_decided',
    'flag1_submitted', 'flag2_submitted', 'flag3_submitted', 'flag4_submitted', 'start_debrief_cutscene']);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.ready_to_extract !== true || g.start_debrief_cutscene === true) {
    const missing = Object.entries(g).filter(([k, v]) => k !== 'ready_to_extract' && k !== 'start_debrief_cutscene' && v !== true).map(([k]) => k);
    throw new Error('not at the ending (ready_to_extract=' + g.ready_to_extract + '); missing: ' + (missing.join(', ') || 'none') + ' ' + JSON.stringify(g));
  }
  await clearScreen(page, bridge, () => {});
}

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)).catch(() => '');

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await sleep(1500);
  const c = await openHax(bridge);
  mark('contact-picked', { ok: c && c.ok });
  // Call the extraction in. The exact option texts: "I'm done here. Bring me in." then "Bring me in." then "On my way."
  for (const re of [/Bring me in/i, /Bring me in/i, /On my way/i]) {
    const s = await bridge.getState();
    if (!(s.activeMinigame && /person-chat|phone-chat/.test(s.activeMinigame.id))) break;
    await sleep(1600);
    const ch = await bridge.minigame.choose(re).catch(() => null);
    if (ch && ch.ok) mark('choice:' + (ch.chose || re.source), { number: ch.number });
    await sleep(600);
  }
  // Close the phone; the ending-check overlay or the debrief follows.
  for (let i = 0; i < 3 && (await bridge.getState()).activeMinigame && /phone-chat/.test((await bridge.getState()).activeMinigame.id); i++) {
    await bridge.minigame.close().catch(() => {}); await sleep(600);
  }
  // Press "End the mission" if the optional-objectives warning appears (poll the canvas for the button text).
  let pressed = false;
  for (let i = 0; i < 20 && !pressed; i++) {
    const r = await bridge.minigame.clickText('End the mission').catch(() => null);
    if (r && r.ok) { pressed = true; mark('ending-check-end'); }
    else { const r2 = await bridge.minigame.clickText('End now').catch(() => null); if (r2 && r2.ok) { pressed = true; mark('ending-check-end'); } }
    if (!pressed) await sleep(800);
    if ((await bridge.getState()).activeMinigame && /person-chat/.test((await bridge.getState()).activeMinigame.id)) break; // debrief opened directly
  }
  mark('ending-check-shown', { pressed });
  // Play the closing debrief: a voiced person-chat. Hear every line; take the first choice at each menu.
  await bridge.waitForMinigame('person-chat', { timeoutMs: 20000 }).catch(() => {});
  mark('debrief-open');
  const lines = await playThrough(page, bridge, mark, vw, { steps: [0, 0, 0, 0, 0, 0], dwellMs: 1400, timeoutMs: 180000 });
  mark('debrief-done', { lines: lines.length });
  // Hold on the conclusion (credits / conclusion screen).
  await sleep(4000);
  mark('conclusion', { screen: await screenText(page) });
  await sleep(4000);
  mark('linger-end', { tts });
};
