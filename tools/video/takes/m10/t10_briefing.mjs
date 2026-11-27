// t10_briefing (m10, keyless, NOT YET RUN; supersedes the LIVE-mode t02_briefing for the trailer): the opening briefing (timed cutscene, opens on game_loaded, gate briefing_played). One take for the HOOK and the SLEEPER:
//   hook   Netherton briefing_stakes line 1 "At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone." (10.82 s whole; cut after "catalogued." by ear)
//   sleeper Netherton aside, not-m09 arm "Their ledger calls that person WREN. Placed eleven years ago. It puts WREN on this team." (8.98 s; keep the last sentence). Picture must be Netherton's portrait, NOT the team (Kowalczyk off screen).
// Path: [Go on.] > briefing_facts > briefing_name (cold start) > [You knew him well, then.] > HaX "Well enough to know he's expecting us." (short fallback) > briefing_stakes > [Has he costed it?] (the figure line plays: cut it in the edit)
//       > briefing_invite [It's a trap.] > objection [(Say nothing.)] > team [What do you need from me first?] > "HaX. Go." > aside narrator > the sleeper line. Stops before [Then bench the team.].
// Entry (new-game): --imports=none   Record: ""     MISSION=m10 run.sh harjit_singh t10_briefing "--imports=none" ""
// Marks: briefing-open, line-start:/line-end:, choices-shown, choice:*, hook-done, expecting-done, sleeper-done, choices-visible-after-here, targets-done.
import { watchVoice, sleep } from '../lib/lib.mjs';
import { driveTargets } from './_c10.mjs';
export default async (page, bridge, mark) => {
  const vw = await watchVoice(page, mark);
  let d = null; for (let i = 0; i < 200; i++) { d = (await bridge.getState()).dialogue; if (d) break; await sleep(100); }
  if (!d) throw new Error('briefing never opened (Mission Brief notes open instead? check)');
  mark('briefing-open');
  await driveTargets(page, bridge, mark, vw, {
    steps: [/^Go on/i, /You knew him well/i, /Has he costed it/i, /It.s a trap/i, /Say nothing/i, /What do you need from me first/i],
    targets: [{ name: 'hook', re: /At six he publishes everything we ever catalogued/i }, { name: 'expecting', re: /Well enough to know he.s expecting us/i }, { name: 'sleeper', re: /Their ledger calls that person WREN/i }],
    lingerMs: 700, timeoutMs: 300000 });
};
