// t10_hax_hook: Agent HaX's opening briefing (dialogue view, portrait, game subtitle bar) to the hook line
//   hax_v2_1 "Whatever they're building, it's targeted and sophisticated."  (scout: 3.77 s, m01_opening_briefing.ink:71)
// Entry state: fresh game (the briefing opens itself on load; the take starts at the first menu):
//   PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact
// Record: run-take.sh t10_hax_hook "" ""
// Path: 'What are they doing?' > (briefing_threat lines skipped) 'What kind of data?' > data_concerns: "Large-scale data aggregation..." (skipped)
// > the target line plays in full. Marks: line-start:/line-end: for every voiced line, hax_v2_1-done, targets-done.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 300; i++) { d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice) break; await sleep(100); }
  if (!d || !d.awaitingChoice) throw new Error('briefing menu never appeared');
  mark('menu-shown', { choices: d.choices.map(c => c.text) });
  await sleep(900);
  await runDialogue(page, bridge, mark, vw, {
    steps: [/^What are they doing/i, /^What kind of data/i],
    targets: [{ name: 'hax_v2_1', re: /Whatever they're building, it's targeted and sophisticated/i }],
    dwellMs: 900,
  });
  await sleep(300);
};
