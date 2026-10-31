# Lab fix round 6: R4 findings + dialogue review C2

Sources: `R4.md` in this folder and `../DIALOGUE_REVIEW_C2.md`.

Several of the items round 5 reported as fixed did not land in the live game:
- the door hint;
- `linkCredible` (still a bare string at `scenario.json.erb:758`);
- Dev's "Last change" line;
- Pierce's `ownFrom` hint (C2 item 12).

This round, every fix must be proven on the path the game actually runs: a bridge check (`tools/playtest/se/`), or a test that drives the real data and the real engine module. A unit test of the helper on its own is not enough.

## A. R4 findings
- **Door hint (check 1).** `doors.js:504-525` builds `doorProperties` without `lockedHint`, so `unlock-system.js` never sees it. Pass it through. Doors without the field must behave exactly as before.
- **Wrong-page link hint (check 4).** Change Lord's `linkCredible` hint in the scenario to `{missing, wrong}`.
- **Lord's hint ladder (check 3).** On the second miss, Lord's ladder says "only trusts the portal's own notices" even though her sender passed and the link was what failed. The rung must fit the factor that failed.
- **Dev's "Last change" (check 5).** It still carries over into the second call. Find out why the round-5 `new_call` boundary isn't seen.
- **Close behaviour (check 6).** After a miss, × and Esc go back to the inbox, and the client needs a second press to close. Make × and Esc behave like the client's Close button, unless that breaks a test.
- **Fairbairn reopens at his hub (D1).** He resumes at his hub, not `start`, so the `sign` and `payoff` knots only play on a fresh open. This is the same pattern as Ruth's keys in round 2: route the stage checks through his hub.
- **Audit every lab ink file for this pattern.** Any content reachable only from `start` must also be reachable from the hub. Add a Node test per NPC that drives a hub reopen at each stage.
- **Dev's second call (D4, D5, D7).**
  - It opens silently, because `team_checked` persists from the first call. Reset per-call state at the start of each call.
  - "Who is she?" comes straight after the student has named Sofia.
  - Tomasz's debrief says "And Dev reported you" even when a later call recovered everything.
- **The report names people (D3).** The report table lists Chris, Melanie and Sofia by name, while Fairbairn and Tomasz both say the report names nobody. Use roles in the report, or change the lines. The no-blame lesson favours roles.
- **Everything else in R4.md:** F5 to F9, D2 (the CMA line wording), D6 and D8 to D15.

## B. Dialogue review C2
Apply the 30 proposals, using your judgement on each. The orchestrator has decided:
- item 2: the reason for the throwaway address is that real applicants write from webmail;
- item 23: this lab's `mission.json` may be edited;
- item 27: check in the engine that the candour and repair tells can show on the same turn before applying it.

Where B overlaps with A, for example D2 and the CMA line, write one combined change. Log every skip and why.

## Done when
- The Node suite and the validator are green, with all shipped scenarios unchanged.
- The lab passes `--strict-social`.
- Every touched ink file is recompiled.
- The live-path proofs for the A items are in place.
- The results are logged in `SE_BUILD_LOG.md`, with a correction for each round-5 claim that didn't land.
- You report every file you touched.
