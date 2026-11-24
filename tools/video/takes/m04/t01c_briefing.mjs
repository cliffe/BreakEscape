// 24 Nov re-take (new id, same path as the original): new mouth-only visemes / new bust.
// t01c_briefing (m04), keyless: the opening briefing (a timed conversation that opens by itself on load), the hook and stakes lines:
//   hook   Netherton "Agent 0x00. ENTROPY used to steal. Now they break the things people can't live without."  (scout 9.14 s)
//   stakes Nightshade "The physics doesn't lie and neither do I. If they reach the safety interlocks, ..."      (scout 8.90 s)
// Entry state: fresh game, no flags: `new-game.rb m04_critical_failure --imports=none` (the briefing plays at once; m04 has no briefing_played gate).
// Record: BE_SPRITE=vivian_ashby tools/video/takes/run-take.sh m04 t01c_briefing "--imports=none" ""
// Marks: briefing-open, line-start:/line-end: for every voiced line, hook-done, stakes-done, targets-done. No choice is picked.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker, text: (d.text || '').slice(0, 80) });
  await runDialogue(page, bridge, mark, vw, {
    steps: [],
    targets: [
      { name: 'hook', re: /ENTROPY used to steal\. Now they break the things people can't live without/i },
      { name: 'stakes', re: /If they reach the safety interlocks, this stops being a hack and starts being a body count/i },
    ],
    dwellMs: 900,
  });
  await sleep(300);
};
