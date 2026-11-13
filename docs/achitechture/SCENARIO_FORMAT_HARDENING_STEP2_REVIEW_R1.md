# Scenario format hardening, step 2: code review, round 1

Date: 2026-11-12. Branch `build/harden-step2` at 2a49c4341 (3f80b61cb and 2a49c4341 on main b7d500ccf). Plan: `SCENARIO_FORMAT_HARDENING_PLAN.md` step 2. Build log: its "Step 2" section.

Open: B=0 M=3 m=6

## What I checked

- **Closed set against the plan.** Every block the plan names is closed with `additionalProperties: false` and `patternProperties: { "^_": {} }`: resources, networks, wifi, policies, accountProfiles, roles (with their workarounds and frustration), `accessList`, NPC workarounds, feed and posts, creds, habits, screenHabit, printHabit, usbHabit, frustration, needs entries, `#/definitions/affordance` and `#/definitions/grantFootholdAction`. No `$ref` to item, npc, room, accessList or affordance sits under a combinator, so no unknown key is hidden inside a `oneOf` message.
- **Keys the engine reads against the declared keys.** I grepped `lib/`, `app/` and `public/break_escape/js` for the keys read from resources, networks and wifi, policies (`pc-policy.js`, `access_work.rb`), accountProfiles, roles (`npc_habits.rb`, `access_work.rb`), workarounds (`w['…']`), feed and posts, access lists (`acl_admits?`, `unlock-system.js`), affordance (`npc-needs.js` and friends, `access_work.rb`) and grant_foothold (`network_model.rb`, `network_access.rb`, `apply-actions.js`). Every key read is declared. The only read key a closed block now rejects is `action.path` on a grant_foothold (`apply-actions.js:453`), which `network_access.rb:381-384` documents as not authored and not load-bearing; rejecting it is correct.
- **affordance.** `false` passes, `true` passes (the type list allows it), a string fails on type, `owner` fails with a `did you mean 'owners'?` hint on a room object, an object inside `contents`, an NPC's `itemsHeld`, `startItemsInInventory` and a resource's `contents`. A bad key in the nested `useFrom` still fails.
- **grant_foothold walker.** It reaches actions in `triggerOnInteract`, `onConfirm`, `timers[].actions`, `conditionalActions[].actions` and `eventMappings[].actions` (the last also gets validate_network's "not run server-side" error, which is right). It also reaches actions under `_` keys (m2).
- **Corpus.** All 177 `scenarios/*/scenario.json.erb` with `--skip-ink --no-graph`, default known-failures list, once with the branch schema and once with `-s` main's schema: all 177 exit 0 on the branch and the `Result:` lines are identical. m01 to m10 with ink on and `--no-graph`: all exit 0 with 0 `❌` lines. No known-failures entry was added (`scripts/validator_known_failures.json` is not in the diff). `git status` clean after every run.
- **Tests.** `test/js/validator-strict-keys.test.mjs`: 8 pass. Run without the lock with plain `node` (as `bin/test-js` does): validator-exit-code 30, validator-known-failures 15, validator-social-schema, -mistake, -triage, -triage-wifi-list, -p7n, -p7x, -followups, -x2, -awareness, validator-give-item-collectible, -action-condition, -behavior-fields, -portrait-variants, npc-office-visuals and event-mapping-unlock-door: all pass. (event-mapping-unlock-door fails under `node --test` with "Unable to deserialize cloned data"; it passes under plain `node`, so that is the runner, not this branch.)
- **Crafted slips.** Fixtures built from the test's base scenario, in the scratchpad, run both through `format_schema_errors(validate_json(...))` and through the full validator (`--no-graph --skip-ink --no-known-failures`), compared line by line with the clean fixture. The findings below come from these runs.

## Findings

### M1. One slip still prints two lines in the full validator for habits, screenHabit and printHabit

- **Where.** `scripts/validate_npc_habits.rb:119-126` (`unknown habit`), `scripts/validate_npc_needs.rb:398` (`printHabit has unknown key`), `scripts/validate_npc_needs.rb:538` (`screenHabit has unknown field`).
- **Failure.** The step's promise is one line per slip, but the claim was tested only at the schema formatter. In a full run:
  - `habits: { "writesdown": false }` prints `❌ ERROR: schema: …/habits: unknown key 'writesdown', did you mean 'writesDown'?` and also `❌ ERROR: habits: NPC 'dana' has unknown habit 'writesdown' (…)`. Two errors for one slip, so a known-failures `count` for it would be 2.
  - `screenHabit: { "lockchance": 0.5 }` (the plan's own example) prints the schema error and also `⚠️ WARNING: NPC 'dana' screenHabit has unknown field 'lockchance' (…)`.
  - `printHabit: { "forgetChanse": … }` prints the schema error and `⚠️ WARNING: … printHabit has unknown key 'forgetChanse'.`
- **Fix.** Now that the schema owns these key lists, drop the three hand-kept unknown-key checks (keep the value checks in validate_npc_habits). Add a full-validator test that, for each slip in `SLIPS`, counts every output line naming the key and expects 1.

### M2. `_` keys do not "always pass": habits errors on them, screenHabit and printHabit warn

- **Where.** The README claim at `README_scenario_design.md:56` ("Keys starting with `_` (such as `_comment`) always pass"); the cause is the same three hand checks as M1. `validate_npc_habits.rb:120` skips only `_comment`; `validate_npc_needs.rb:398` and `:538` skip nothing.
- **Failure.** The test's base fixture puts `_why` in every block and passes, because it only runs the schema. The same fixture through the full validator prints `❌ ERROR: habits: NPC 'dana' has unknown habit '_why'` (exit 1), `⚠️ WARNING: NPC 'dana' screenHabit has unknown field '_why'` and `⚠️ WARNING: NPC 'dana' printHabit has unknown key '_why'`. An author who follows the README and writes `_note` in `habits` gets a failing scenario.
- **Fix.** Fixed by M1's removal; if any hand check stays, skip keys matching `^_`. Extend the base-fixture test to run the full validator and assert no line names `_why`.

### M3. A type slip in a grant_foothold action in `triggerOnInteract` prints twice

- **Where.** `scripts/validate_scenario.rb:227` (`errors + validate_grant_foothold_actions(...)`) with `scripts/scenario-schema.json:5246-5251`, where `triggerOnInteract` items declare `pc`, `needsDropped`, `needsSession`, `needsHeld`, `name` and `condition` with the same types as `grantFootholdAction`.
- **Failure.** `triggerOnInteract: [{ "type": "grant_foothold", "pc": 5, … }]` prints `❌ ERROR: schema: #/rooms/r1/objects/0/triggerOnInteract/0/pc (…): of type integer did not match the following type: string` twice, once from the main schema and once from the walker; `"condition": ""` does the same. The full validator counts 2 errors for one slip. Timers and `onConfirm` print once, because their items are untyped.
- **Fix.** De-duplicate after formatting (`out.uniq` at the end of `format_schema_errors`, since the raw messages differ in their `in schema <id>` suffix), and add a test for one type slip in `triggerOnInteract`.

### m1. Transposed short keys get no hint, and a transposed required key prints two lines

- **Where.** `scripts/validate_scenario.rb:377` (limit 1 under five characters) with `key_edit_distance` at `:386` (plain Levenshtein, a transposition costs 2).
- **Failure.** `wifi: { "ssdi": "CorpNet" }` prints `unknown key 'ssdi'` with no hint and also `did not contain a required property of 'ssid'`, because the required line is dropped only when a hint names it. The same goes for `"od"` for `"do"` in a workaround.
- **Fix.** Use the optimal string alignment distance (a swap of two adjacent letters costs 1). The tie rule still guards against bad guesses.

### m2. The grant_foothold walker checks actions under `_` keys

- **Where.** `scripts/validate_scenario.rb:253` (the walk descends every key).
- **Failure.** `"_example": { "type": "grant_foothold", "pcc": "x" }` at any level prints `❌ ERROR: schema: #/_example: unknown key 'pcc', did you mean 'pc'?`, which contradicts "keys starting with `_` always pass". (validate_network's walk also visits it, so a second unrelated error may follow.)
- **Fix.** Skip a hash entry whose key starts with `_` in the walker, and say in the README that a `_` key's value is not checked.

### m3. The README's "one slip prints one line" holds only for the schema stage

- **Where.** `README_scenario_design.md:56`.
- **Failure.** A misspelt required or defaulted key still prints the schema line plus the downstream check that misses the key: `"At"` for `at` in an NPC workaround adds `❌ ERROR: work: dana.workarounds[0].at is nil; …` (`validate_access_work.rb:967`); `"urgentat"` adds `urgentAt must be a number from 1 to 99`; `"needDropped"` adds validate_network's "sets neither needsDropped nor needsSession"; `"passwrd"` in creds adds two errors. These are fair consequences, but the README promises one line.
- **Fix.** Reword to "one slip prints one schema line" (and say later checks may report what the missing key breaks), or suppress a later check's line when the schema has already reported an unknown key at the same pointer. Rewording is enough for this step.

### m4. A `_comment` at the map level of networks, resources, policies, accountProfiles or roles fails

- **Where.** `scripts/scenario-schema.json`, the five top-level maps (`properties.networks`, `.resources`, `.policies`, `.accountProfiles`, `.roles`), whose `additionalProperties` requires an object for every key.
- **Failure.** `"roles": { "_comment": "…" }` prints `❌ ERROR: schema: #/roles/_comment: of type string did not match the following type: object`; the same for `networks`. Not new (main does the same), but the README now says `_` keys always pass, and `validate_npc_habits.rb:92` already skips `_` role names, so one module expects them.
- **Fix.** Add `"patternProperties": { "^_": {} }` to those five maps, or limit the README sentence to keys inside the closed blocks.

### m5. `comment` gets no hint towards `_comment`

- **Where.** `scripts/validate_scenario.rb:360` and `:365` drop `_` keys from the candidates.
- **Failure.** `"comment": "why"` in a closed block is likely the commonest slip of all and prints a bare `unknown key 'comment'`.
- **Fix.** When the unknown key does not start with `_` and `_<key>` is declared (or matches `^_`), suggest `_<key>`.

### m6. Test gaps

- **Where.** `test/js/validator-strict-keys.test.mjs`.
- **Failure.**
  - The tests at lines 119 and 125 check the schema formatter only, which is how M1 and M2 got through. Line 206 asserts one `'PSK'` line in a full run, but for one slip only.
  - No test covers a type slip in a grant_foothold action (M3), a transposition (m1), or an action under a `_` key (m2).
  - The corpus test (line 239) renders with `rescue StandardError; next`, so a scenario that stops rendering is silently skipped; only `scenarios > 150` guards it.
- **Fix.** Run every `SLIPS` fixture and the base fixture through the full validator too (one process per fixture is about 1 s each; or batch them through `run_validation`), assert exactly one line naming the key, and assert the base fixture has no line naming `_why`. In the corpus test, collect render failures and assert the list is empty.

## Not findings

- `path` on a grant_foothold is now rejected though `apply-actions.js:453` reads `action.path`: the server ignores it unless forwarded and nothing authors it (`network_access.rb:381-384`). Rejecting it is right; the client read is dead code for authored scenarios.
- Door entries' `access` (read client-side at `doors.js:530`) is not an access list in the schema, but the schema's doors description says lock fields belong on the room, and the plan's "wherever it appears" means `access` and `for` as declared. Left alone.
- The NPC `feed.posts[].when` object stays open; `validate_access_work.rb:1740` already errors on an unknown predicate.
- Sync size: no runtime change, nothing in player_state.
