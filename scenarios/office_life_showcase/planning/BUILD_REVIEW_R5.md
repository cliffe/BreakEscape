# office_life_showcase: build review R5 (final)

Reviewed at `312a6e38c` (branch `plan/ol-showcase`). Part 1 is the delta `3f71b88cd..312a6e38c` (the R4 fixes). Part 2 is a final end-to-end read of the player-facing text in `scenario.json.erb` and `ink/*.ink`. Read-only; no servers started.

Checks run:
- `validate_scenario.rb --skip-ink --no-graph`: 0 errors, 17 warnings (the known baseline).
- `tools/playtest/showcase-lines-check.mjs`: PASS (every plan line matches the data word for word, caps hold).
- `dialoguelint.mjs scenarios/office_life_showcase/`: no rule hits ("Totals by rule: none"). Its only note is the known A7 text appearing on two source lines (`ama_owusu.ink:83, 88`), which is the intended reuse.

Severity: B blocker, M major, m minor.

## Part 1: R4 fixes

The diff touches three files: `scenario.json.erb` (one string), `tools/playtest/showcase-r2fix-proof.mjs` (three lines) and `BUILD_REPORT.md` (the check 1 row and a new "R4 fixes" section). No engine or ink change.

| R4 | Verdict | Notes |
|---|---|---|
| m1 (board mugs line) | Fixed | `scenario.json.erb:232` now reads "- Note the mugs, then go to the cooler." The order is back and agrees with Ama A8 (`ama_owusu.ink:86-88`: mugs first, then the kitchen and cooler). It is shorter than the line it replaces, so the R3 fit (no scroll) holds. |
| m2 (probe asserts old A31) | Fixed | `showcase-r2fix-proof.mjs:164-165` match and store "They won't be back once they've gone home. Seen everything you wanted?", identical to `ama_owusu.ink:120`. |
| m3 (check 1 PASS caveat) | Fixed | The probe check title (`:191`) and the `BUILD_REPORT.md` row now say the tick comes from `npc_left_post`, not the kitchen use. The caveat sits in the Evidence column rather than the Result column, which is acceptable. |

No new problem introduced. The board string is plain UI text (no spoken line changed in this delta).

## Part 2: final skim

Read against each other: the three aim descriptions, the nine task titles, the `tour_notice` board, the start-item note on the cake, the coffee socket hints, the object observations, and every Ama branch (`start`, `hub`, A1 to A33 equivalents, the recap).

Cross-checks that hold:
- Board "Watch the coffee run: one at a time" agrees with tasks `see_queue` and `hear_queue_chat` and Ama's "One person at a time; the rest queue."
- Board "Switch the coffee off at the socket" agrees with `see_coffee_off`, the "Wall socket" hints (`:196`, `:207`) and Ama's "at the wall socket".
- Board "Note the mugs, then go to the cooler" agrees with the mugs observation (`:219`), `hear_cooler_exchange` and Ama's mugs and cooler lines. The cooler follow-up "What was that at the cooler?" only appears after the exchange has been heard.
- Board "Ask Ama for lunch after the kitchen" agrees with the gate in the hub ("Have a look in the kitchen first") and with the midday aim. "Wait for the owner" and "drop the cake" agree with `see_caught`, `use_open_screen`, `see_cake_eaten`, Ama's midday hint and the cake's own note ("Choose Drop here in your inventory").
- Board "Call it a day, then see who stays" agrees with A31 and its two choices, `see_who_stays`, Ama's evening hint ("Everyone's gone home but one. See where she goes.") and the Evening aim ("nearly all of them, and they don't come back").
- Board "Walk into the kitchen; the lights follow you" agrees with Ama's evening hint and the recap line about the kitchen lights.
- Nothing the board or tasks name is missing from Ama's hub, and nothing Ama's hub promises is absent from the tasks or the board (the mugs and the kitchen lights are hints with no task, as designed).
- No em or en dashes in `scenario.json.erb` or `ink/*.ink` text. The `ama_owusu.ink` header comment and VAR comments match the current structure.

Nothing contradictory or out of date found.

## Spoken lines

No spoken line changed since R4. A31 ("They won't be back once they've gone home. Seen everything you wanted?") stays fine to voice as written; it still needs the user's yes before any TTS run. All other Ama lines were passed in earlier rounds and are unchanged.

## Findings

None.

## Counts and verdict

B 0, M 0, m 0.

The build review loop is closed. R4 m1 to m3 are fixed with no new problem, the final skim found no contradictions between the aims, tasks, board and Ama's hub, and the validator, lines check and dialogue lint are clean.
