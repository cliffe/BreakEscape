// t28_bernie_premise (m02): Bernie Nwosu at reception (dialogue view: portrait, game subtitle bar). Path: opening narration + rattled-off lines > choice "I'm the security consultant Dr. Kim called in. It's about the ransomware." > route_consultant > target line "The cardiac ward's monitoring is down. Nobody's watching those hearts but us."
// SILENT (no TTS clip exists for the new line yet; keyless :3001 never generates). STOP on the target line: never press continue on it (next is "So. Security consultant. Convince me." then a choice).
// Entry: new-game.rb m02_ransomed_trust (reception_lobby is the start room)   Record: tools/video/takes/run-take.sh m02 t28_bernie_premise "" ""
// Marks: interact, conversation-open, choices-shown, choice:<text>, line:<text>, premise-shown, hold-end, closed.
import { sleep, clearScreen, awaitChoice } from '../lib/lib.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }
export default async (page, bridge, mark) => {
  await sleep(1000);
  mark('interact');
  let r = await bridge.interact('receptionist', { timeoutMs: 20000 });
  let w = await bridge.waitForMinigame('person-chat', { timeoutMs: 5000 });
  if (!w || w.ok === false) { r = await bridge.interact('receptionist', { timeoutMs: 20000 }); w = await bridge.waitForMinigame('person-chat', { timeoutMs: 10000 }); }
  if (!w || w.ok === false) throw new Error('person-chat did not open ' + JSON.stringify(r).slice(0, 300));
  mark('conversation-open');
  let last = '', picked = false; const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    if (d.awaitingChoice) {
      if (picked) throw new Error('a second choice menu appeared: stopped too late');
      mark('choices-shown', { choices: d.choices.map(c => c.text) });
      await sleep(1200);
      const ch = await bridge.minigame.choose(/^I'm the security consultant Dr\. Kim called in/i);
      if (!ch || !ch.ok) throw new Error('choose failed ' + JSON.stringify(ch).slice(0, 200));
      mark('choice:' + ch.chose); picked = true; await sleep(400); continue;
    }
    const txt = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (txt !== last) { last = txt; mark('line', { text: txt.slice(0, 160) }); }
    if (/Nobody's watching those hearts/i.test(txt)) { mark('premise-shown'); break; }
    if (picked && /Convince me/i.test(txt)) throw new Error('overshot the premise line');
    if (d.canContinue) { await sleep(picked ? 1800 : 900); await bridge.minigame.continue_(); }
    else await sleep(120);
  }
  if (!/Nobody's watching those hearts/i.test(last)) throw new Error('premise line never reached; last=' + last);
  await sleep(4200);
  mark('hold-end');
  for (let i = 0; i < 4 && (await bridge.getState()).activeMinigame; i++) { await bridge.minigame.close().catch(() => {}); await sleep(500); }
  mark('closed');
  await sleep(600);
};
