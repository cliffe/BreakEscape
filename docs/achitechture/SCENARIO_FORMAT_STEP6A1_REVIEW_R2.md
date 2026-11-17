# Scenario format hardening step 6a-1 review R2

Date: 2026-11-14. Reviewer branch `build/hard-6a1`, tip `57a31d85c`.
Scope: R1's four closures over `379234230..57a31d85c`, then a fresh full pass over
`cb259dbdf..57a31d85c`, then a merge check against `build/hard-step4` and `build/hard-step5`.
Review only. The full fresh-state corpus scan is still held for step 3 and is out of scope.

Reviewed against plan `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` sections 1, 2 and 6a-1,
the engine filters in `app/models/break_escape/game.rb`, the schema resolver in
`lib/break_escape/scenario_schema.rb`, the client JS under `public/break_escape/js/`, and the prior
round `SCENARIO_FORMAT_STEP6A1_REVIEW_R1.md` (0 blockers, 1 major, 4 minors).

## Counts

- Blockers: 0
- Majors: 1
- Minors: 1
- Observations (not counted): 3

Verdict: **SHIP once the one Major is resolved.** R1's major and four minors are all closed. The new
Major is the same class of gap R1 found for capture secrets, on a different secret: the flag answer
(`targetFlags`) is a section-2 secret that the server strips but that carries no `x-serverOnly` mark,
so a filter regression that leaks it is classed 3 and passes the scan. The fix is one line (mark it,
served by no route, like `flags`), or a recorded deferral the way capture secrets' decision was
recorded. No live leak exists today, and every other mark, declaration, test and the step-5 merge
are clean outside the build log.

## R1 closures (verified over 379234230..57a31d85c)

- **MA1 closed.** The three capture secrets now carry `x-serverOnly: true` and
  `x-servedBy "GET /capture_secrets"`: `social.landingPages[].capture.secret`
  (`scenario-schema.json:612`), `usePayload.secret` (`:4873`, declared under the `x-free-data`
  `usePayload` node) and `addCapture.secret` (`:5042`). The unconditional mark is correct, not the
  conditional R1 floated: `Game.strip_capture_secrets!` (`game.rb:6100`, `CAPTURE_SECRET_KEYS` =
  `capture addCapture usePayload`) runs on every bootstrap path regardless of `revealSecret`, at
  `game.rb:1842` (bootstrap), `:1338` (inventory) and `:6121` (room/container), so the secret never
  ships there; `reveal_capture_secret?` (`game.rb:1855`) gates only `GET /capture_secrets`, which the
  mark names. `usePayload.secret` resolves through the resolver's declared-property rule (rule 1,
  `scenario_schema.rb:326-338`) before the `x-free-data` branch (rule 3, `:348`); the classifier
  tests prove it (class 1 for `usePayload.secret`, class 4 for an arbitrary `usePayload` key).
- **MI1 closed.** `creds.password` `x-servedBy` is now the array
  `[{route: "GET /login_accounts", key: "postitNote"}, "GET /capture_secrets"]`
  (`scenario-schema.json:4351`); `served_routes` flattens the hash entry to its route
  (`payload_scan_fresh_state_test.rb:47`), and both the Rails unit test and the node test assert both
  routes. Matches `captureProof` (`scenario-schema.json:4873`).
- **MI2 closed.** The held scan self-activates: `skip SCAN_PENDING unless
  schema_declares_acknowledged_clues?` then `flunk SCAN_READY`
  (`payload_scan_fresh_state_test.rb:233-241`). `acknowledgedClues` is not declared in the schema on
  this branch (only `formatVersion` is), so the skip still holds and the file runs green now (ran it:
  11 runs, 32 assertions, 1 skip); once step 3 declares `acknowledgedClues` the skip lifts and the
  empty-body test fails, so the scan cannot be forgotten.
- **MI3 closed.** The build log's "Left for after step 3" gains item 5: wire `acknowledgedClues` as
  the third list into the node test's `otherApproved` readers
  (`validator-known-failures.test.mjs:130-138`).
- **Extra hunk, `cryptexConfig.answer` gains `"type": "string"`** on both `definitions/room`
  (`scenario-schema.json:5198`) and `definitions/item` (`:4190`). No corpus scenario authors a
  `cryptexConfig.answer`, so the type constraint rejects nothing; it matches the declared-leaf shape
  that lets the resolver reach the marked node. `addCapture.secret`'s `type: string` accepts
  lab_physical_pentest's string (`4471`), and `capture.secret`'s accepts lab_social_engineering's
  string (`Sofia2026!`). ca13_ai_assistant's `"secret": true` (`scenario.json.erb:511`) sits on an
  intel-post object (`id`/`text`/`safe`/`secret`), a different schema path the three capture marks do
  not reach, so the boolean is unaffected.

## Fresh pass (cb259dbdf..57a31d85c)

### Major

**MA1-R2 (major): the flag answer (`targetFlags`) is a section-2 secret with no server-only mark.**
`scripts/scenario-schema.json:3936`, the `targetFlags` property of `#/definitions/task` (the block
at `:3902`), is declared with no `x-serverOnly`. It is the live flag answer: `filter_target_flags`
(`game.rb:6065`) deletes `tasks[].targetFlags` from the bootstrap (called at `game.rb:1811` inside
`filtered_scenario_for_bootstrap`), and the method's own comment calls these "the expected flag
answers used server-side for validation; they must never reach the client". Section 2 lists "flag
answer" as a secret, and the 6a-1 marks bullet requires `x-serverOnly` on "every secret property
(section 2's list)". The top-level `flags` key, stripped in the same bootstrap method, carries
`x-serverOnly` (`scenario-schema.json:150`); `targetFlags`, its per-task equivalent, does not. The
plan's 6a-1 enumeration (plan lines 423 to 445) names `requires`, `combination`,
`cryptexConfig.answer`, the top-level whole-record keys, the NPC records, `feed` and `creds.password`
but omits `targetFlags`, so the build followed the enumeration and missed it under the generic rule.
*Failure scenario:* when the held scan is built, a regression in `filter_target_flags` that leaves
`targetFlags` on a task in the bootstrap objectives subtree (part of the scanned `GET scenario` top
level) is classed 3 by `PayloadLeafClassifier.classify` (declared field, no mark, the final
`:class3` return at `payload_scan_fresh_state_test.rb:78`), and class 3 passes. The value sits in
step 3's answer set (plan line 286), but the path-based class 3 verdict short-circuits before any
value check, so the leak of the completion-bypass answer is invisible, which is the one class of leak
this mark set exists to catch. Fix: mark `targetFlags` `x-serverOnly: true` with no `x-servedBy`
(served by no route, like `flags`), or record a deferral decision in the build log the way the
capture-secret decision is now recorded.

### Minor

**MI1-R2 (minor): the committed R1 review file carries em dashes on added lines.**
`docs/achitechture/SCENARIO_FORMAT_STEP6A1_REVIEW_R1.md` uses em dashes in its finding headers
(after each finding code such as `MA1` and `MI1`, lines 356 onward in the range diff), and that file is an added file in
`cb259dbdf..57a31d85c`. The standing rule is "no em or en dashes on added lines", and the stream
enforces it (commit `f45049efc`). Every shippable build file (schema, tests, build log) is dash
clean on its added lines; only the prior review artifact's prose carries them. *Failure scenario:* a
strict dash check over the branch range flags the review file. Resolution is the orchestrator's call:
leave review prose as prose, or restyle the headers. Noted so the check is not silently skipped.

## Merge check (git merge-tree, no branch changed)

- **vs `build/hard-step4`:** conflicts in `docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`
  (the step section append, expected) **and in `scripts/scenario-schema.json` (outside the build
  log)**. The schema conflict is in the `eventMapping` block (`scenario-schema.json:5049-5060`):
  6a-1 adds `addCapture.secret` while step 4 adds `x-ref` marks to the neighbouring `completeTask`,
  `unlockTask` and related keys, so the adjacent edits collide textually. Both changes are
  compatible; the resolution keeps both. This is the concrete form of R1's MI4, left as-is per this
  round's brief.
- **vs `build/hard-step5`:** conflict in
  `docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md` only (the step section append). Nothing
  conflicts outside the build log; step 5 touches `lib/`, the validator, `mission.rb` and tools,
  none of which 6a-1 touches.

## Observations (not counted)

- **O1: the `targetFlags` gap is also a gap in the plan's 6a-1 enumeration.** The generic "every
  section-2 secret" rule covers it, but the explicit mark list does not name it, so resolving MA1-R2
  may want a one-line plan amendment alongside the schema mark, so 6a-2's opened-state scan (which
  can fetch answer-bearing routes) is not relied on to cover a fresh-state subtree leak.
- **O2: the step-4 schema merge conflict confirms R1's MI4.** It is real and benign; the merge-batch
  resolves it by applying both branches' hunks. Reported here because the brief asks for any conflict
  outside the build log.
- **O3: the client reads capture secrets defensively, and the new marks match that.**
  `mail-bridge.js:436` and `captures.js:55,97` read `cap.secret` / `entry.secret`, but the server
  already strips these from the bootstrap (pre-6a-1), so `window.gameScenario` carries none; the
  client reads null there and falls back to the server-served `secretsById` map. Marking the three
  nodes `x-serverOnly` reflects the real data flow and introduces no client-read contradiction. The
  same holds for `usePayload.secret`: the capture is recorded through `window.recordSECapture` and the
  server reads the authored secret from unfiltered `scenario_data`, so the client never needs the
  stripped value.

## What else is clean (verified, not assumed)

- Node `validator-declared-top-level.test.mjs`: 7 pass (ran it), including the corpus render with zero
  undeclared top-level keys and the new capture-secret marks test.
- Rails `payload_scan_fresh_state_test.rb`: 11 runs, 32 assertions, 1 skip (ran it); the new
  capture-secret and two-route classifier tests pass, the corpus scan stays skipped.
- `requires` carries the conditional `{unlessLockType: [biometric, bluetooth, rfid]}` on both room
  and item (`scenario-schema.json:4179`, `:5187`); `combination` carries `{whenLockType:
  [combination]}` on both. `networks.*.wifi.psk` (`:279`) sits under the whole-record `networks` mark.
  The capture secrets, `creds.password`, `flags`, `roles`, `accountProfiles`, `networks`,
  `networkLinks` and `resources` all carry marks matching their bootstrap strips.
- Standing rules on shippable build content: no em or en dashes on added lines, no model names, no new
  gems or npm packages (no `package.json`/`Gemfile` change), UK English in the build log prose.
