// t04e_conclusion (m06): recovers and films the mission conclusion after an interrupted debrief.
// State: start_debrief_cutscene=true, debrief_played=true, mission_complete=false (the debrief already
// ran its opening and set debrief_played; the Playtest-D2 backstop completes hear_debrief on the next
// room entry, which lets the conclusion aim finish -> credits / bond_visualiser -> mission_complete).
// The take walks the player through a door to fire room_entered, then clicks "End the mission now" on
// the ending-check overlay if it appears, and holds on the credits / conclusion.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { passTitle, playThrough, watchTts, globals, goRoom } from './_live.mjs';

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
  const g = await globals(page, ['start_debrief_cutscene', 'debrief_played', 'mission_complete']);
  console.error('GLOBALS', JSON.stringify(g));
  if (g.mission_complete === true) throw new Error('mission already complete');
  if (g.debrief_played !== true) throw new Error('debrief not played yet (run the debrief take first): ' + JSON.stringify(g));
  await clearScreen(page, bridge, () => {});
}

export default async (page, bridge, mark) => {
  const tts = watchTts(page, mark);
  const vw = await watchVoice(page, mark);
  await sleep(1500);
  mark('walk-start');
  try { await goRoom(page, bridge, ['security_checkpoint']); mark('room-entered', { room: 'security_checkpoint' }); }
  catch (e) { mark('walk-err', { e: String(e).slice(0, 160) }); }
  const t0 = Date.now();
  let endNowClicked = false, concluded = false;
  while (Date.now() - t0 < 140000) {
    const s = await bridge.getState();
    if (s.activeMinigame && /person-chat/.test(s.activeMinigame.id)) {
      mark('closing-chat-open');
      const lines = await playThrough(page, bridge, mark, vw, { steps: [1, 1, 1, 1, 1, 1], dwellMs: 1300, timeoutMs: 90000 });
      mark('closing-chat-done', { lines: lines.length }); await sleep(1500); continue;
    }
    const endNow = await clickByText(page, 'End the mission now');
    if (endNow) { mark('ending-check-end', { label: endNow }); endNowClicked = true; await sleep(2500); continue; }
    const g = await globals(page, ['mission_complete']);
    if (g.mission_complete === true) { concluded = true; mark('mission-complete'); break; }
    await sleep(800);
  }
  await sleep(5000);
  mark('conclusion', { screen: await screenText(page), endNowClicked, concluded });
  await sleep(4000);
  mark('linger-end', { tts });
};
