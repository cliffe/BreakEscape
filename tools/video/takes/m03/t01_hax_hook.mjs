// t01_hax_hook (m03): Agent HaX's opening briefing, both hook lines in one take:
//   hook_1 "They don't run the attacks. They arm the cells that do."  (scout 3.62 s, knot briefing_main)
//   hook_2 "You worked St. Catherine's last month. The hospital that went dark."  (scout 3.77 s, knot st_catherines_connection)
// Entry state: fresh game, NO briefing_played gate (the briefing opens itself on load):
//   PLAYTEST_PORT=3017 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m03_ghost_in_the_machine
// Record: BE_SPRITE=<hood or any> tools/video/takes/run-take.sh m03 t01_hax_hook "" ""
// Path: start > "Remind me what their deal is." > long HaX line > hook_1 > "What are they dealing in?" (the other two choices raise a HaX Influence toast) > reply > hook_2; stops there (no further choices).
// Marks: briefing-open, choices-shown, choice:*, line-start:/line-end: for every voiced line, hook_1-done, hook_2-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open', { speaker: d.speaker });
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^Remind me what their deal/i, /^What are they dealing in/i],
    targets: [
      { name: 'hook_1', re: /They don't run the attacks\. They arm the cells that do/i },
      { name: 'hook_2', re: /You worked St\. Catherine's last month\. The hospital that went dark/i },
    ],
    dwellMs: 900,
  });
  await sleep(300);
};
