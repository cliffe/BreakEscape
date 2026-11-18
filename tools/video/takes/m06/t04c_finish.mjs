// t04c_finish (m06): completes the ending after the call-in has already fired (start_debrief_cutscene
// is already true and persisted). The ending is HELD because optional objectives are open, so the
// objectives panel shows an "End the mission" button and the ending-check overlay offers
// "End the mission now" / "Keep going". This take dismisses the Mission Brief, plays the voiced closing
// debrief (person-chat) whenever it is up, and clicks "End the mission now" (then the panel
// "End the mission") on camera to run the ending through to the conclusion. Adaptive order: it handles
// debrief-first or check-first. Voiced: the debrief (Netherton + HaX).
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { passTitle, playThrough, watchTts, globals } from './_live.mjs';

const screenText = (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)).catch(() => '');
const clickByText = (page, text) => page.evaluate((t) => {
  const els = Array.from(document.querySelectorAll('button,[role="button"],.clickable,.choice-button,.menu-item'))
    .filter((e) => e.offsetParent !== null);
  const needle = t.toLowerCase();
  const el = els.find((e) => (e.innerText || '').trim().toLowerCase() === needle)
          || els.find((e) => (e.innerText || '').trim().toLowerCase().includes(needle));
  if (el) { el.click(); return (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60); }
  return null;
}, text);

export async function setup(page, bridge) {
  await passTitle(page, bridge); await sleep(1500);
  const g = await globals(page, ['start_debrief_cutscene', 'mission_complete', 'debrief_played', 'ready_to_extract']);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.start_debrief_cutscene !== true) throw new Error('call-in not fired yet (start_debrief_cutscene != true): ' + JSON.stringify(g));
  await clearScreen(page, bridge, () => {});
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await sleep(1500);
  const t0 = Date.now();
  let endNowClicked = false, endPanelClicked = false, debriefPlayed = false;
  while (Date.now() - t0 < 210000) {
    const s = await bridge.getState();
    // 1) voiced closing debrief person-chat
    if (s.activeMinigame && /person-chat/.test(s.activeMinigame.id)) {
      mark('debrief-open');
      const lines = await playThrough(page, bridge, mark, vw, { steps: [1, 1, 1, 1, 1, 1, 1, 1], dwellMs: 1400, timeoutMs: 160000 });
      mark('debrief-done', { lines: lines.length });
      debriefPlayed = true; await sleep(2000); continue;
    }
    // 2) ending-check overlay: "End the mission now"
    const endNow = await clickByText(page, 'End the mission now');
    if (endNow) { mark('ending-check-end', { label: endNow }); endNowClicked = true; await sleep(2500); continue; }
    // 3) objectives panel button: "End the mission"
    const endPanel = await clickByText(page, 'End the mission');
    if (endPanel) { mark('end-mission-panel', { label: endPanel }); endPanelClicked = true; await sleep(2500); continue; }
    // 4) done?
    const gv = await globals(page, ['mission_complete', 'debrief_played']);
    if (gv.mission_complete === true && debriefPlayed) break;
    await sleep(800);
  }
  await sleep(4000);
  mark('conclusion', { screen: await screenText(page), endNowClicked, endPanelClicked, debriefPlayed });
  await sleep(4000);
  mark('linger-end', { tts });
};
