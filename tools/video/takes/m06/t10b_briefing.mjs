// t10_briefing (m06, keyless): the opening briefing, a timed conversation that opens by itself. Hook = Netherton "Agent 0x00. Every cell we have hit is being paid by someone. Tonight we chase the money. HaX."
// (edit cuts to the pause after "money."); Nightshade's line is held 1.4 s for a face flash; threat = HaX "HashChain Exchange. A trading platform on paper. In practice, the bank for every ENTROPY cell we know."
// Path: start (Netherton, Nightshade, HaX "Two payments...") > [Which exchange?] > hashchain first line. No later menu.
// Entry state (new-game): --imports=none   (no gate: the briefing opens at once)   Record flags: ""
// Record: MISSION=m06 run.sh <avatar> t10_briefing "--imports=none" ""
// Marks: briefing-open, line-start:/line-end:, nightshade-hold, choices-shown, choice:*, hook-done, threat-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { ttsPlaying } from './_conv.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker, text: (d.text || '').slice(0, 80) });
  let hook = false, nsDone = false, picked = false, t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    d = (await bridge.getState()).dialogue;
    if (!d) { await sleep(150); continue; }
    const last = (d.text || '').split('\n').filter(Boolean).pop() || '';
    if (d.awaitingChoice) {
      for (let i = 0; i < 100 && await ttsPlaying(page); i++) await sleep(100);
      await vw.drain();
      if (picked) break;
      mark('choices-shown', { choices: d.choices.map(c => c.text) }); await sleep(900);
      const ch = await bridge.minigame.choose(/Which exchange/i); if (!ch || !ch.ok) throw new Error('choose failed');
      mark('choice:' + ch.chose); picked = true; await sleep(300); continue;
    }
    if (/Tonight we chase the money/i.test(last) && !hook) { const l = await vw.waitForLine(/Tonight we chase the money/i, 20000); if (!l) throw new Error('hook never voiced'); mark('hook-done', { durMs: l.durMs }); hook = true; await sleep(500); if (d.canContinue) await bridge.minigame.continue_().catch(() => {}); continue; }
    if (/another protocol/i.test(last) && !nsDone) { mark('nightshade-hold'); await sleep(1400); nsDone = true; if (d.canContinue) await bridge.minigame.continue_().catch(() => {}); continue; }
    if (picked && /bank for every ENTROPY cell/i.test(last)) { const l = await vw.waitForLine(/bank for every ENTROPY cell/i, 20000); if (!l) throw new Error('threat never voiced'); mark('threat-done', { durMs: l.durMs }); await sleep(900); break; }
    if (d.canContinue && !(await ttsPlaying(page))) { await sleep(450); await bridge.minigame.continue_().catch(() => {}); }
    await sleep(120);
  }
  if (!hook || !picked) throw new Error('did not reach hook/threat');
  await vw.stop(); mark('targets-done');
};
