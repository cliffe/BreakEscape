// t01_hax_hook (m02): Agent HaX's opening briefing (dialogue view, portrait, game subtitle bar) to the hook line
//   hax_1 "If they refuse and you're too slow, people die on the ward."  (scout: 3.94 s, m02_opening_briefing.ink q_stakes)
// Entry state: fresh game, NO briefing_played gate (the briefing opens itself on load; the take starts at the first menu):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust
// Record: tools/video/takes/run-take.sh m02 t01_hax_hook "" ""
// Path: start > "Who did this?" > briefing_hub > "Walk me through the stakes..." > q_stakes (lines before the target skipped) > target plays in full.
// Marks: menu-shown, line-start:/line-end: for every voiced line, hax_1-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker });
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^Who did this/i, /^Walk me through the stakes/i],
    targets: [{ name: 'hax_1', re: /If they refuse and you're too slow, people die on the ward/i }],
    dwellMs: 900,
  });
  await sleep(300);
};
