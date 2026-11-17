# Scenario format hardening step 6a-1 review R1

Date: 2026-11-14. Reviewer branch `build/hard-6a1`, range `cb259dbdf..d90903a2f` (5 commits).
Scope: the schema marks, the nine top-level declarations plus `combination`/`cryptexConfig.answer`,
the declared top-level test, the empty exceptions file and its decisions wiring, and the leaf
classifier. The full fresh-state corpus scan is held for step 3 and is out of scope here.

Reviewed against plan `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` section 1 (cheat policy),
section 2 (secret list), step 6a-1 (plan line 420) and the 6a-2 / 6b outlines, and against the
engine filters in `app/models/break_escape/game.rb`, `lib/break_escape/`, and the client JS under
`public/break_escape/js/`.

## Counts

- Blockers: 0
- Majors: 1
- Minors: 4
- Observations (not counted): 2

Verdict: **SHIP** once the one Major is resolved. The Major is a one-line decision (mark the
capture secret, or record its deferral in the build log the way `social.intelFacts` is already
deferred). No live leak exists today, the held scan is not active, and every other mark, declaration
and wiring check passes.

## What is correct (verified, not assumed)

- Top-level whole-record marks match `filtered_scenario_for_bootstrap` exactly: `flags` and `roles`
  (served by none), `accountProfiles` (`GET /container`), `networks`/`networkLinks`/`resources`
  (`GET /network`, `GET /container`). Confirmed against the deletes at `game.rb:1816-1842`
  (`flags`, `accountProfiles`, `roles`, `withhold_network_keys!`). `targetFlags` is nested under
  objectives, not a top-level key, so its absence from the whole-record list is right.
- NPC record marks match what the server withholds: `role, creds, awareness, workarounds`
  (`WITHHELD_NPC_KEYS`, `game.rb:6227`) and `workNeeds, frustration, feed` (`WITHHELD_WORK_NPC_KEYS`,
  `game.rb:6231`), all seven `x-serverOnly`. `creds.password` carries
  `x-servedBy {route: "GET /login_accounts", key: "postitNote"}`, matching `written_down?`.
- Habits are per-leaf: the six non-shipping leaves (`locksScreen, writesDown, password,
  passwordPattern, holdsDoors, usb`) are `x-serverOnly`; `screen` and `print` are unmarked. Matches
  the allow-list filter `SHIPPED_HABIT_KEYS = %w[screen print]` (`game.rb:6239`, filter at
  `withhold_npc_secrets!` `game.rb:6276-6282`). The build log's rejection of a whole-block mark is
  sound (a whole-block `x-serverOnly` + `x-servedBy` would, under the precedence rule, let the other
  habit leaves pass on the shipping route).
- Conditional `requires` and `combination`, fail-closed rule: classifier
  (`test/models/break_escape/payload_scan_fresh_state_test.rb:58-75`) returns `:class1` for
  `requires` with `lock_type: nil` (fail closed), `:not_secret` for `rfid`/`bluetooth`/`biometric`,
  `:class1` for `combination` under a combination lock and `:not_secret` otherwise. Unit tests at
  `:139-154` confirm, on both room and item.
- `cryptexConfig.answer` under an `x-free-data` node is reached by a declared property. The
  `ScenarioSchema` resolver's rule 1 (`lib/break_escape/scenario_schema.rb:317-339`) checks declared
  `properties` before the free-data branch (rule 3 at `:349`), so `child(cryptexConfig, 'answer')`
  resolves to the marked `answer` node, not to free data. Verified in code and by the passing unit
  test at `payload_scan_fresh_state_test.rb:131-137`.
- Client-visible verdicts hold. `needs`, `needsHome`, `chatter`, barks (`bark`/`message`/`barkDelay`),
  `exchanges` (incl. `requireGlobal`) and `habits.screen`/`habits.print` are unmarked and are read
  client-side from `window.gameScenario` (`npc-needs.js`, `workstation-state.js:124`). Nothing the
  client reads is marked server-only: the client reads of `role`/`creds`/`frustration` found in the
  JS sweep are runtime state (`s.frustration`) or server-constructed contact/target records, never
  the withheld authored NPC fields.
- Declarations accept every corpus value. Ran `node test/js/validator-declared-top-level.test.mjs`:
  6/6 pass, including the render of all 150+ scenarios with zero undeclared top-level keys. The
  corpus declared-key test fails on any undeclared key (`hits << ... unless declared.include?(k)`;
  `assert.deepEqual(hits, [])`, `validator-declared-top-level.test.mjs:41-52`).
- Exceptions file and decisions wiring: the file is an empty array; `checkPayloadScanExceptions`
  (`validator-known-failures.test.mjs:87-122`) enforces fields, dates, the one-json-block-per-heading
  rule and no shared heading across lists, cross-checking both ways (known failures carry
  `otherApproved()` reading the exceptions file; exceptions carry `knownFailureApproved()`). Ran
  `node test/js/validator-known-failures.test.mjs`: 21/21 pass.
- Standing rules clean: no em/en dashes, no model names, no new gems or npm packages in the diff
  (the test files use only `node:*` builtins and `ruby`). The box-drawing `──` in the Ruby comments
  is U+2500, not a dash.

## Findings

### Major

**MA1 — a section-2 secret class (capture secrets) is unmarked, with no recorded decision.**
`scripts/scenario-schema.json:612` (`social.landingPages[].capture.secret`, `type: string`) and the
`usePayload`/`addCapture` capture secrets are listed in section 2's secret list ("capture secret")
and are actively stripped from the bootstrap by `strip_capture_secrets!` (`game.rb:1835-1842`: "The
browser must not hold one until the capture is earned"; paths enumerated at
`lib/break_escape/npc_habits/clues.rb:344-363`). None of them carries `x-serverOnly`, and no node in
the schema carries `x-servedBy "GET /capture_secrets"` even though step 6a-1's marks bullet
(plan line 421) names that route as one that serves a secret once earned.
*Failure scenario:* when the held fresh-state scan is built, a regression in `strip_capture_secrets!`
that leaves `capture.secret` in an awareness lab's room/object payload (a scanned subtree route,
`GET scenario`/`GET room/:id`) is classed 3 (declared field, no mark) and **passes** — the one class
of leak this mark set exists to catch is invisible. The nuance that makes this a decision rather than
a straight add: `capture.secret` legitimately ships when `social.captures.revealSecret` is true
(`capture_model.rb:296-302`), so an unconditional `x-serverOnly` would false-positive those labs; it
needs a conditional form (like `requires`' `unlessLockType`) or a documented deferral. The build log
deferred the structurally identical `social.intelFacts` case ("Left for after step 3", item 3) but
is silent on capture secrets. Fix: add the capture-secret mark decision to the build log's deferral
list, or mark it conditionally. (Grant contents, the other section-2 secret not individually marked,
are `x-free-data` item `contents` and are correctly left to the scan's value check, so they are an
observation below, not part of this finding.)

### Minor

**MI1 — `creds.password` `x-servedBy` omits a real serving route.** `scenario-schema.json:145`:
`GET /capture_secrets` serves the account password once a capture proof holds
(`captureProof` description, `scenario-schema.json:4874`: "any one holding lets GET /capture_secrets
serve the password"), but `creds.password` lists only `GET /login_accounts`. Latent today because
the scan excludes `GET /capture_secrets` (covered by `capture_payload_secret_test.rb`); it would bite
if that route ever joins the scan. *Failure scenario:* a future reviewer adds `GET /capture_secrets`
to the scan and the legitimately-served password is flagged class 4.

**MI2 — the held scan's reactivation relies on a human remembering.** `payload_scan_fresh_state_test.rb:173-175`
is a single `skip SCAN_PENDING` test; nothing ties the skip to the presence of `acknowledgedClues`,
so after step 3 lands the scan stays skipped until someone reads the build log. *Failure scenario:*
step 3 merges, the scan is never built, and a leak the scan would catch ships silently. Low cost fix:
make the skip conditional on `acknowledgedClues` support being absent so it self-activates, or add a
failing guard test. The build log's "Left for after step 3" handover is otherwise complete and
accurate (the 4-point list matches the deferred code).

**MI3 — handover omits one step-3 wiring task.** The build log's "Left for after step 3" does not
mention adding the `acknowledgedClues` list as the third list to the node test's `otherApproved`
readers (`validator-known-failures.test.mjs:130-138` currently reads only the exceptions file; the
plan's shared-heading rule covers "every acknowledgedClues list" too). *Failure scenario:* step 3
adds `acknowledgedClues` headings that collide with an exceptions or known-failure heading and the
node test does not catch it.

**MI4 — merge risk with step 4 and step 5.** Both `build/hard-step4` (edits
`scripts/scenario-schema.json` +38 and the build log) and `build/hard-step5` (edits the build log)
append their step section to the end of `docs/achitechture/SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`,
so whichever lands after 6a-1 conflicts at EOF (all three branches). `build/hard-step4` also edits
`scripts/scenario-schema.json`; its `x-ref` marks land near 6a-1's `x-serverOnly` marks and new
declarations, so expect conflicts in `definitions/npc`, `definitions/item`, `definitions/room` and
the top-level `properties` block. `build/hard-step5` touches `lib/`, `scripts/validate_scenario.rb`,
`app/models/break_escape/mission.rb` and tools, none of which 6a-1 touches, so its only overlap is
the build-log append. The plan already states "whichever lands second adds them" (plan line 698);
resolve by re-applying the later branch's hunks on top.

## Observations (not counted)

- **O1 — declared grant contents are not individually marked, by design.** `strip_grant_contents!`
  (`lib/break_escape/declared_grants.rb:73-79`) deletes item `contents`, which is `x-free-data`
  (`scenario_schema.rb:36`) and sometimes ships (an unlocked container). A single `x-serverOnly`
  cannot express that; the scan's class-2/class-4 value checks and the live `DeclaredGrants` strip
  cover it. Correct as-is; noted only because section 2 lists "declared grant's contents" as a secret.
- **O2 — the declared top level does not close the schema.** The top-level `properties` sets no
  `additionalProperties: false` (out of scope until section 7's closure), so a new undeclared
  top-level block passes JSON-schema validation; the guard is the node corpus test, which only fires
  once a scenario uses the key. This matches the plan's intent and is called out so the limit is
  understood.
