# M8 review, round 5 (m01 first ring and bring-in, after engine R2 fixes)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `ba1300ab1` (validator grammar check for `ringWhile`/`callbackWhen`, safer latch restore, call caption resolved at first paint). The tree had no uncommitted engine or m01 change, only regenerated dungeon graphs elsewhere. Inputs: `REVIEW_M8_R4.md`.

**Verdict: accept, slice closed. 0 B, 0 M, 0 m, 2 n.**

## Validators

- `scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb`: exit 0, schema passes, no errors. The warnings are the long-standing timed-text spacing ones (flag events), nothing about calls.
- Phone-call check (`check_phone_calls` from `scripts/validate_phone_calls.rb`, run on its own): **0 issues**. m01 has no `ringWhile` or `callbackWhen`, so the new grammar check has nothing to reject.

## Live smoke (keyless :3023, headless, server stopped afterwards)

Route `tools/phone_calls/routes/m08_live.sh ring_decline`. Output `proofs/R5_m01_m03_m04_m05/m01_ring_decline.txt`, screenshots `ring_decline_*`.

| Case | Game | Result |
|---|---|---|
| First ring, decline, call back | 2353 | Entering the main office rings: banner "Agent HaX \| SAFETYNET secure line \| Incoming call \| Answer \| Decline", knot `first_ring`. Decline leaves one "Missed call" row, "Call back" in the header and the tour text once. Call back opens "You rang back. Good habit." and plays to "Good. Off you go." Rows afterwards: "Missed call", "Outgoing call, 0:10". Events: one declined, one answered, one `conversation_closed:agent_0x99`. |

## Voiced lines re-read

`ink/m01_phone_agent0x99.ink` `first_ring` (:107) and `closing_debrief` (:979). No typos, no printed variables, no stage directions in spoken text. The three openers (callback, slow answer, plain) each lead cleanly into "One test call before it's texts only." The two bring-in openers both fit the shared "On my way" reply. Nothing to change before audio.

## Findings

### n1. The idle-tutorial case still lives outside the route
Carried from R4 n1. Fold `proofs/PS_m01_m03/tut_idle.sh` into `m08_live.sh` if the route is edited again.

### n2. R4's proof-name clash
R4 n2 is avoided here: every case in `proofs/R5_m01_m03_m04_m05/` has its own label. The R4 folder still holds the mixed m01/m04 `bring_*` files. No action.
