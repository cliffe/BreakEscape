# Lab fix round 8: R6 findings

Source: `R6.md` in this folder. R6 passed 5 of its 6 checks, and everything it found is minor. As before, prove each logic fix on the path the game actually runs.

- **F5: Gareth's signature can be skipped.** "Get it in writing" completes before Gareth signs, and nothing sends the student back to him. Make the signing (his sign scene, `fairbairn_condition_heard`) part of what completes that task, or gate the next stage on it. Check against the plan's task list, and keep 23 tasks unless the plan says otherwise.
- **F6: dead wait after the Lord send.** The send says "It landed", but `phish_lord_landed` sets about 20 seconds later, and nothing on screen tells the student to wait. Either set the global at the moment the result is decided, or make the checklist say a reply is on its way. Do the same for every target if they share the pattern.
- **F2:** Ruth's phone `stage_done` still points to Tomasz after `closing_debrief`. Gate it.
- **F3:** Ruth's phone repeats the Blue Team key line five times in one thread, even with the key held. Stop it repeating.
- **F1:** Dev's bar "Last change" disagrees with the log beside it (-30 against -20, +10 against +20). Make the two agree. The bar can show the turn total, as the log does.
- **F4:** the plan board's success text reuses the report's wording. Rewrite it so it's about the plan.
- **F7:** a correct triage verdict with no flags ticked scores 60 of 100. Check against the triage design doc, and change it only if it contradicts that.
- **Report:**
  - The two "Finance" rows can't be told apart. Use distinct roles, for example "Finance (manager)" and "Finance (new starter)", without naming anyone.
  - The pairing feedback still says "Sofia" and "Dev". Switch it to roles.
- **Triage card:** with no flags named, the four "caught 0 of N" lines still print above the "nothing to grade" line. Hide them in that case.
- **Gareth's "the one who nearly paid that invoice":** R6 found it jarring after a balance-sheet spoof. Make sure the line clearly refers to the woman from the opening, not to the student's send.

## Done when
- The Node suite and the validator are green, with all shipped scenarios unchanged.
- The lab passes `--strict-social`.
- Every touched ink file is recompiled.
- Each logic fix has a test on the real path.
- The results are logged in `SE_BUILD_LOG.md`.
- You report every file you touched.
