// t10_briefing (m07, keyless, NOT YET RUN): the opening briefing (timed cutscene, opens by itself on game_loaded). Path: start > briefing_questions hub [Understood. Talk to me about the other three.] > delegation_intro (HOOK "We are faced with an impossible decision, Agent.", 4.10 s, tagged) > delegation_hub [I've made the call.] > commit_menu [Send them to Fracture. Washington.] > handoff (STAKES "Eight point four million people, Agent. Go and do the part you can reach.", 6.22 s).
// The hub and commit menus are on screen for about 1.1 s each: the edit uses only the line windows (marks). Team pick does not matter for the lines.
// Entry state (new-game): --imports=none   (briefing is the opening: no gate)   Record flags: ""
// Record: MISSION=m07 run.sh <avatar> t10_briefing "--imports=none" ""     (avatar: marcus_hale)
// Marks: line-start:/line-end:, choices-shown, choice:*, hook-done, stakes-done, targets-done.
import { watchVoice } from '../lib/lib.mjs';
import { sleep } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null;
  for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open');
  await runDialogue(page, bridge, mark, vw, {
    steps: [/Understood\. Talk to me about the other three/i, /I.ve made the call/i, /Send them to Fracture/i],
    targets: [{ name: 'hook', re: /impossible decision/i }, { name: 'stakes', re: /Eight point four million people, Agent/i }],
    lingerMs: 1300, timeoutMs: 240000 });
};
