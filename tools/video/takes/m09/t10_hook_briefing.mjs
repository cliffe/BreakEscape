// t10_hook_briefing (m09, keyless, NOT YET RUN): the opening briefing cutscene (opens by itself on game_loaded, gate briefing_played unset). HOOK = Netherton, m09_briefing.ink:62 "Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it." (#delivery: level and grave, 9.10 s, placeholder voiced line, plays whole). No choices before it. Picture-in only on :62; earlier lines (narrator, courier line, the else-branch "traitor" line) are skipped after a short dwell.
// Entry state (new-game): --imports=none    (no setup(): the briefing must not be closed)   Record flags: ""
// Record: MISSION=m09 run.sh marcus_hale t10_hook_briefing "--imports=none" ""
// Marks: briefing-open, line-start:/line-end:, hook-done, targets-done. Edit starts the voice about 3 s into the held title.
import { sleep, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null; for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open');
  await runDialogue(page, bridge, mark, vw, { steps: [], targets: [{ name: 'hook', re: /Whatever ENTROPY cannot afford to keep/i }], lingerMs: 1200, timeoutMs: 120000, dwellMs: 600 });
};
