# Lab fix round 5: R3 findings + dialogue review C1

Sources: `R3.md` (this folder) and `../DIALOGUE_REVIEW_C1.md`. Do part A first, then part B.

## A. R3 findings
- **Door hint never reaches the client:** `filtered_scenario_for_bootstrap` (`app/models/break_escape/game.rb` ~770) whitelists room fields and drops `lockedHint`. Pass it through (and check any other field this build added to rooms/doors). Add a Ruby or Node test against the filtered payload, not the raw scenario.
- **H3 still wrong:** guest picking the own-From template gets "This account can only send as itself" (`header.forced` true for that case too, `phish-rules.js` ~198). Distinguish "account cannot spoof" from "spoof-capable account chose not to".
- **H1 unreachable in practice:** every required factor on Pierce and Lord has a keyed hint, so `hints[0]` never shows. Make the softest rung show on the first miss (factor hints from the second), or fold the soft line into the factor hint — pick one, log it.
- Link hint says "no site behind it" when a wrong-domain page is attached; distinguish missing from wrong.
- Dev bar "Last change" carries over to the next call; call outcome/lowest globals stale until the second call ends; report call row should say when there were two calls.
- Replies arrive for sends that missed — check against the plan (a miss may legitimately get a refusing reply); fix if unintended.
- Mail client: first Close after a miss returns to compose instead of closing.

## B. Dialogue review C1
Apply the 40 proposals in `DIALOGUE_REVIEW_C1.md`, judging each. The orchestrator has accepted item 6 (Dev names the portal; pick a fictional name consistent with the lab's Ledgerwell world and update Ruth's hint, the board and the composer to match). Check item 11's `senderTrust` flag against the triage chip set before using it. Keep the "X, not Y" slogan to about three uses. Skip any proposal that conflicts with the plan or a test, and log why.

## Done when
Node suite and validator green (all shipped scenarios unchanged), lab `--strict-social` green, all touched ink recompiled with committed `.json` matching, results logged in `SE_BUILD_LOG.md`, and you list every file touched.
