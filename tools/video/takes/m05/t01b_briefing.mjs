// t01_briefing (m05), keyless: the opening briefing, a timed conversation that opens by itself on a fresh game.
//   hook   Director Netherton "Agent 0x00. This one is close to home in a way I dislike. Someone inside a Home Office contractor is handing ENTROPY the crown jewels."
//          (edit cuts the audio to the third sentence, "Someone inside...")
//   stakes Agent HaX "Every ambulance, fire and police call through it runs six to eleven minutes slower."
// Path: Netherton's first menu [Bought with what?], HaX's menu [Who's this going to?] -> buyers_and_stakes. No later menu is shown or picked.
// Entry state: fresh game, `--imports=none`; no gate needed.
// Record: MISSION=m05 run.sh <avatar> t01_briefing "--imports=none" ""
// Marks: briefing-open, line-start:/line-end: for voiced lines, choices-shown, choice:*, hook-done, stakes-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker, text: (d.text || '').slice(0, 80) });
  await runDialogue(page, bridge, mark, vw, {
    steps: [/Bought with what/i, /damage so far/i, /Who's this going to/i],
    targets: [
      { name: 'hook', re: /handing ENTROPY the crown jewels/i },
      { name: 'stakes', re: /six to eleven minutes slower/i },
    ],
    dwellMs: 900,
  });
  await sleep(300);
};
