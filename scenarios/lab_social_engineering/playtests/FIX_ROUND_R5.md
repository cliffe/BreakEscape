# Lab fix round 7: R5 + dialogue review C3

Sources: `R5.md` in this folder and `../DIALOGUE_REVIEW_C3.md`.

R5 passed 5 of its 6 checks, and every reopen-order test passed. This round is polish. As in round 6, prove each logic fix on the path the game actually runs.

## A. R5 findings
- **Dev's bar shows a stale "Last change" (check 4).** When the first call ends at net 0, the second call opens showing "Last change: +10 candour" from the first call. R5's reading is that resetting influence from 0 to 0 isn't logged, so the bar's log scan runs back into the previous call (`influence-bar.js` 138-155). Make the call boundary explicit, whatever the value. Add a test that starts with a net-0 first call.
- **Bar and log disagree.** The bar says "Last change: +10 candour" while the log says "+20 CALM ✓ Corrected".
- **The call debrief says "You got what you came for." when the ask was refused.**
- **Ruth's phone-list preview** shows an old line rather than her newest.
- **Stale guidance after the payoff (J1, J2; overlaps C3 item 5):**
  - Ruth still sends the student to Gareth after his payoff has played.
  - Her phone still sends the student to Tomasz after the engagement has closed.
  - Gate each line on `fairbairn_payoff_heard` or `closing_debrief`.
- **J3:** the end card says "his staff keep reporting", but the report says the test can't see whether staff reported anything. Reword the end card.
- **J4:** the "Finance intern" row still identifies Sofia, since she is the only intern. Use a broader role.
- **J8:** Ruth gives away Melanie's pretext in answer to "Why a throwaway address?". Remove the spoiler.
- **J10:** the triage Result card says "Sender address (caught 0 of 3)" when the student named no flags. Show this only when it means something, or word it for that case.
- **J5–J7 and J9:** see R5.md.

## B. Dialogue review C3
Apply the 16 proposals, using your judgement. Where B overlaps with A, write one combined change. Log every skip and why.

## Done when
- The Node suite and the validator are green, with all shipped scenarios unchanged.
- The lab passes `--strict-social`.
- Every touched ink file is recompiled.
- Each logic fix has a test on the real path.
- The results are logged in `SE_BUILD_LOG.md`.
- You report every file you touched.
