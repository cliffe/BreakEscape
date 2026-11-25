# demo_ops_recon: implementation review R3 (delta)

Reviewer: Sonnet, delta review of 35eddb80d ("Ops showcase recon fix: round 2") against IMPL_REVIEW_R2. No code changed. Nothing here touches what the server sends or access checks, so nothing is marked "needs Opus".

**Verdict: clean.** 0 blockers, 0 majors, 2 minors (both partial closures of R2 findings, listed below).

## Run
- Validator: 0 errors, 24 warnings (same as R2).
- Ink compile: 6 compiled, 0 failed (usual END notes). No `.json` drift beyond the committed one.
- `flock ... rails test demo_ops_recon_scenario_test.rb`: 19 runs, 282 assertions, 0 failures.
- No browser run; client claims are from code reading.

## R2 items

| Item | Outcome | Evidence |
|---|---|---|
| n1 resume | Closed, browser check still advised | `scenario.json.erb:482` `game_loaded` mapping on Ama clears `kitchen_seen` and `server_room_seen`. Ama is in the start room, loaded at `game.js:2239`, before `game_loaded` is emitted (`game.js:2656`), so the mapping is registered in time. Ama then refuses day end until both rooms are re-entered. PLAYTEST A6 and C0 now say so. Not run live: confirm the flags really read false after a resume. |
| n2 Zainab relay | Partly closed (m1) | `:781` now also needs `zainab_card_given !== true`. Fine after the card. Before the card in the evening it still re-fires on every server room entry (60 s cooldown). Day-end is gated on both rooms seen, so `:780` already sent her once. Harmless. |
| n3 Graham lunch | Partly closed (m2) | `:854` adds `act_evening !== true`, which fixes the evening log visit. During midday each IT room entry (60 s cooldown) still resets hunger to 62. R2 asked for `onceOnly`. Low impact. |
| n4 levers after day end | Closed | `ama_owusu.ink` coffee gated `not act_evening`, lunch `not act_midday and not act_evening`. "They only go the once." added. |
| n5 file server bark | Closed | `:501` now says "Try it in the Terminal too, then tell me what it said." |
| n6 loose refusal test | Closed | Now `assert_response :unprocessable_entity`. Test also clears `travel_back`, `OpsLog::Current` and the overlay in setup and teardown, which fixes order dependence. |
| Jun repeated bark | Closed | Both mappings at 90 s cooldown (`:561`, `:562`); `jun_caught` guard still stops the double bark. PLAYTEST R1a records it. Re-running R1b within 90 s may give no bark; PLAYTEST says the check is optional. |
| Empty Agnieszka desktop | Closed | `agnieszka_pc` now holds `agnieszka_print_note` (text_file, readable). Validator is clean for it. |

## Minors
- m1: Zainab evening relay still repeats before the card is given (n2 residue).
- m2: Graham midday lunch reset still repeats on each IT room entry (n3 residue). A `onceOnly` would close both.

## New faults
None found in the delta.
