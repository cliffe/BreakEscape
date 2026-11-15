# Scenario format hardening, step 3, review R1

Reviewed range `896ec3cd8..9c05765e0` on `build/hard-step3` (tip `9c05765e0`, items 1 to 5 of
step 3; the live proof, item 6, is being built separately and is out of scope). Read the step 3
plan (`SCENARIO_FORMAT_HARDENING_PLAN.md`) and the step 3 build-log sections. Review only; no code
was changed. Focused checks were run (node suites, the validator on key scenarios, a direct
`SecretLeaks.check` probe, a merge-tree against 6a-1); the live browser proof and the full Rails
and corpus suites were left to the separate live-proof run.

- Blocker: 0
- Major: 1
- Minor: 2

Verdict: **FIX** (one Major: the step-3 leak check does not cover the door-entry case the plan's
own item 4 names as an error, which is the one genuinely new client-leak path step 3 set out to
close).

---

## Major

### M1. A door entry with a secret `requires` and no own `lockType` ships that value, and the step-3 check does not catch it

Evidence. The plan's item 4 lists, as a distinct **error**, "resolved to a secret kind on a door
entry that has no `lockType` of its own", with the message "this door entry ships its `requires`
because the server filter reads the entry's own `lockType`; set `lockType` on the entry or remove
`requires`". The plan's node-test list repeats it: "a door entry with a PIN and no `lockType` whose
connected room is pin (error)". This is the leak the plan's "Why" and "How a lock type is resolved"
sections build up at length: `GamesController#filter_requires_recursive`
(`app/controllers/break_escape/games_controller.rb:2619-2631`) and `Game#filter_inventory_for_client!`
(`app/models/break_escape/game.rb:1322`) delete `requires` only when the node carries its **own**
`lockType`. A `rooms.*.doors[]` entry such as `{ "connectedRoom": "vault", "requires": "4821" }`
has no `lockType`, so its `requires` is not stripped and ships in the room's lazy-loaded payload. If
that value equals the connected pin room's real answer, the player reads the room PIN off the door
entry.

`SecretLeaks` collects the resolved door-entry answer (`collect_answers`, lines 61 to 66) but only
compares it against `globalVariables` / `minigameData` / `scenarioData` leaves. The door entry's own
`requires` is none of those, so it is never reported. `lock_type_issues` (lines 307 to 333) skips
door entries entirely (`unless in_doors`, line 316). I confirmed this with a direct probe: a door
entry `requires: "4821"` with no `lockType`, connected to a pin room whose own `requires` is also
`4821`, produced **0 issues** from `SecretLeaks.check`. There is no server-side strip for this
field and no existing validator check covers it (the one at `validate_scenario.rb:6764` is for
`doorway_problem`-flagged entries; a well-formed entry clears `doorway_problem` and is resolved as a
pin answer instead). The build log's "Item 4 lock-type rules" note describes only the room, object
and item cases and does not flag this omission.

Impact. No corpus scenario triggers it today (both corpus door entries with a bare `requires` are
rfid cards, correctly ignored), so nothing ships now. But the central deliverable of step 3, the
leak check, has a hole in exactly the door-entry case the plan dwelt on, so a future author's
mistake would pass validation and leak a room's answer to the browser. The comparator change and the
serving predicates are unaffected, so this is a missing guard, not a regression.

Suggested fix. In `lock_type_issues`, resolve door entries through `CaptureModel.each_lock_answer`
(or walk `rooms.*.doors[]` as `collect_answers` does) and, for an entry whose resolved lock type is a
secret kind (pin, password, combination, cryptex) but whose own `lockType` is absent, emit the error
the plan names. Add the plan's node fixture for it. Re-run the full validator over a crafted
scenario to confirm nothing else already reports it.

---

## Minor

### m1. The array form of a combination answer under `minigameData` is not caught; the array branch of `answer_matches_leaf?` is unreachable

Evidence. The plan's item 2 and its node-fixture list both name "a combination as `12-30-5` in a
global and as an equal array in `minigameData`" as a leak to catch, and the compare rule says a
combination answer "matches an equal array". `answer_matches_leaf?` has the array branch for it
(`validate_secret_leaks.rb:161-163`), but `collect_leaves` / `collect_scalars` (lines 112 to 149)
flattens every array into its scalar elements before matching, so an array leaf never reaches that
branch: `[12, 30, 5]` becomes the three integers 12, 30 and 5, none of which matches the combination
answer. The array branch is therefore dead code, and the array-form leak is missed. The build log
discloses this honestly ("recorded rather than changed").

Impact. Low. The realistic leak (a hint typed into a global as a string) is caught; writing a raw
JSON array of the answer into `minigameData` is an unusual authoring shape, and the server still
withholds a capture secret or account password equal to the answer. But this is the one plan-named
fixture the build dropped, and it leaves a security check with an unreachable branch and a documented
blind spot.

Suggested fix. Either yield arrays as whole leaves to the combination branch (collect the array
before flattening, keyed by its path), or, if the decision stands that string forms are enough,
delete the now-dead array branch in `answer_matches_leaf?` and have the build log and the plan record
the narrowed scope, so no later reader assumes the array case is covered.

### m2. The "door entry whose `requires` or lock type differs from its connected room" warning (plan item 4) is not implemented

Evidence. The plan's item 4 lists a **warning** for "a door entry whose resolved lock type or
`requires` differs from its connected room's", with the message "the server checks the room's lock,
so the player sees one lock and the server checks another". `lock_type_issues` skips door entries, so
this is not emitted. I confirmed it: a door entry `requires: "9999"` against a pin room whose answer
is `4821` produced 0 issues. The plan notes both corpus entries match their rooms, so there is no
corpus line either way, and the build log does not mention the omission.

Impact. Low. The mismatch opens nothing on the server (the server checks the room), so it is a
display and clarity smell rather than a secret leak, but it is a named plan deliverable that is
absent.

Suggested fix. Add the warning alongside the M1 fix, in the same door-entry pass.

---

## What I checked and found sound

- **Comparator equivalence (concern 1).** `Game.lock_answer_matches?` now routes combination and
  cryptex through `CaptureModel.answer_key`. For combination the moved lambda and the
  `nums.empty? ? nil` guard reproduce the old `present?` refusals exactly; equal arrays and the
  written forms (`12-30-05`, `12 30 5`, `L12 R30 L5`) canonicalise to the same key. For cryptex,
  `downcase(:fold)` is the folding `casecmp?` applies, and a non-String attempt gives nil so it is
  refused as before. The four named blank/nil refusals and the non-String cryptex refusal stay. A
  blank, nil or malformed value opens nothing. No legitimate unlock that worked before is refused;
  the change to serving is a widening of withholding (cheat policy) for capture secrets and account
  passwords, gated by proof, not a change to what a player can unlock.
- **Bootstrap strip (concern 1).** `filtered.delete('acknowledgedClues')` is in
  `filtered_scenario_for_bootstrap`; the `doors` array is not in the lazy room keep-list at all, so a
  door entry ships only through the per-room route (the M1 path). The Rails route test asserts both
  the key and a sentinel `reason` string are absent from `GET /games/:id/scenario`.
- **Predicate change, no served capture or password moves (concern 1).** The build log's one-off
  harness (old `capture_model.rb` at the merge base under a second module name, 179 templates)
  reports an empty diff. I did not re-run it; the live-proof run owns the live side.
- **Validator false positives and negatives (concern 3).** Verified live: m06 gives 3
  `ℹ️ acknowledged clue` info lines and 0 errors, m08 gives the one `⚠️ WARNING: acknowledged clue
  in a global`, test_secret_leaks validates clean, crypto2 gives the 5 inert-`requires` warnings
  (unlocked PCs with literal `"requires": "password"`, correctly warnings not errors). The 15 legacy
  inert warnings and the m06/m08 markers are right. The markers' `lock`/`in`/`reason` match the
  `VALIDATOR_DECISIONS.md` json blocks and each heading is unique.
- **Acknowledged-clue plumbing.** `validator_report.rb` counts only the `ℹ️` info lines; the global
  form matches `WARNING_RE` first and counts as a warning, as intended. The schema entry is a closed
  object with the four required strings, and the key is added to the known-top-level list.
- **Test quality and real paths (concern 4).** `secret_leak_withholding_test.rb` drives the real
  server methods (`authored_capture_secret`, `account_capture_served?`,
  `account_password_opens_something?`) and the real `GET /games/:id/scenario` route, not
  reimplementations; the comparator's real POST route is left to the live proof (item 6). Node suites
  pass here (`validator-secret-leaks` 18/0, `validator-acknowledged-clues` 10/0).
- **6a-1 merge wiring (concern 4).** `git merge-tree --write-tree` of `9c05765e0` against main's
  6a-1 tip `e1303fc0c` is clean (no conflicting files). The shared-heading cross-check between the
  acknowledgedClues markers and the known-failures list already runs on this branch inside
  `validator-acknowledged-clues.test.mjs` (which joins `payload_scan_exceptions.json` when present),
  so the markers are covered even before 6a-1's own `otherApproved()` imports `acknowledgedApproved`;
  that import (6a-1 handover item 5) remains a to-do on the 6a-1 side but is redundant belt and
  braces, not a gap.
- **Playtest scanner (concern, plan item 7).** The `capture_secret` rule collects non-account
  capture secrets the way `build_authored_capture_secrets` does (skipping account holders), reports
  them anywhere but a `GET /capture_secrets` answer or a capture page (`ctx[:capture_secrets]` set at
  `games_controller`-equivalent response context), names the target id not the value, and adds the
  secret to the redaction set. Correct.

## Notes and things I was unsure of

- The build-log corpus table is ink-on; my spot checks were `--skip-ink`, so warning totals differ by
  one or two (for example m08 shows 5 with ink off vs 6 in the table). The step-3-added lines match
  exactly, so this is only the flag difference, not a discrepancy in step 3's output.
- I did not re-run the predicate diff or the full Rails suite; both are the live-proof run's job. M1
  is a validator-coverage gap, not a change to serving, so the empty predicate diff is consistent
  with M1 standing.
- M1 and m2 could be fixed together in one door-entry pass in `lock_type_issues`; I kept them
  separate because one is a plan-named error (a real leak path) and the other a plan-named warning.
