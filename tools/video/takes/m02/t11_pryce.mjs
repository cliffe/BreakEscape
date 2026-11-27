// t11_pryce (m02): Mr Pryce (patient_bed4) in hospital_ward (dialogue view, portrait, game subtitle bar). Target: pryce_1 "The machines still run. Nobody's watching them."  (scout 3.70 s, m02_npc_patient_bed4.ink stakes)
// Entry state: head-start in the ward (patient timers run from game start: shoot early): new-game.rb m02_ransomed_trust --start-room hospital_ward --set briefing_played=true
// Record: tools/video/takes/run-take.sh m02 t11_pryce "--start-room hospital_ward --set briefing_played=true" ""
// Path: start > "I am. How are you doing, Mr Pryce?" > "Breathing. Machine's doing it." (skipped) > target plays in full. The next line ("...never trusted a thing with no gauge on it.") is never played.
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {});
  await bridge.moveToNear('patient_bed4', { timeoutMs: 20000 });   // the ventilator panel overlaps Pryce: a click raises the disambiguation menu
  await sleep(800);
}
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  await sleep(800);
  mark('interact-pryce');
  // interact() would pick the menu entry whose text merely CONTAINS "Mr Pryce" (the ventilator panel's description does): click him and pick the entry that starts with his name
  const n = (await bridge.getState()).nearby.find(x => x.id === 'patient_bed4');
  await bridge.clickAt(n.x, n.y);
  await sleep(500);
  const idx = await page.evaluate(() => Array.from(document.querySelectorAll('.be-im-item')).findIndex(i => /^\s*Mr Pryce/i.test(i.innerText || '')));
  mark('menu', { idx });
  let r = { ok: true };
  if (idx >= 0) r = await bridge.chooseInteractionMenu(idx);
  mark('interact-result', { ok: r && r.ok, reason: r && r.reason, chose: r && r.chose });
  const w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 });
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^I am\. How are you doing, Mr Pryce/i],
    targets: [{ name: 'pryce_1', re: /Forty years I fixed buses/i }],
    dwellMs: 900,
  });
  await sleep(400);
};
