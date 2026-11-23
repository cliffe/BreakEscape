// t10_athena_hook (m08, keyless, NOT YET RUN): the opening briefing cutscene (opens by itself on game_loaded). One ATHENA clip carries BOTH the hook and the stakes: "The leak came from inside this building. Director Netherton has three names, and one of them got two of your colleagues killed." (8.9 s whole; edit keeps first ~2.8 s as hook, rest as stakes; cut points by ear). Earlier lines are skipped by runDialogue after ~450 ms (partly audible; use the marks).
// Entry state (new-game): --imports=none (the else branch of the carry-over line)   Record flags: ""
// Record: MISSION=m08 run.sh ngozi_adeyemi t10_athena_hook "--imports=none" ""
// Marks: briefing-open, line-start:/line-end:, hook-stakes-done, targets-done. Stops before "A word of advice..." (the Be Quiet card).
import { watchVoice, sleep } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null; for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened');
  mark('briefing-open');
  await runDialogue(page, bridge, mark, vw, { steps: [], targets: [{ name: 'hook-stakes', re: /The leak came from inside this building/i }], lingerMs: 700, timeoutMs: 200000 });
};
