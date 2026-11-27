# Scenario format hardening plan, amendment 1: review round 4

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` on build/harden-amend at 4e2fad76f. Code read on build/sync-deltas (worktree p-sync-build, fd6dbaa58) and the schema and validator at e13392d17 (worktree p-harden-2). Hacktivity was read only (Gemfile, Gemfile.lock, environment files). No code or plan was changed.

Method for the schema checks: a throwaway script outside the repo implements the resolver exactly as step 2b item 1 states it (local `$ref` followed, `allOf`/`anyOf`/`oneOf` flattened into branches, branches filtered by kind at the `child` or `item` call, a key is a property when a branch declares it in `properties` or matches a `patternProperties` pattern, else an id when a branch has an `additionalProperties` schema or `x-id-map: true`, else undeclared and nil), with the plan's `x-id-map` true and false lists applied in memory to the e13392d17 schema. It explores the schema from the root and from the plan's `at` pointers, then walks all 177 rendered templates of that commit beside the data.

## Round 3 findings

| R3 | Resolved | Where |
|---|---|---|
| M1 run-time context misses 13 maps and the open maps | mostly: the name lists are gone and the resolver stands at schema locations, so 10 of the 13 are reached as id maps and every open global, variable and VM map is marked; 3 of the 13 and 15 more maps still read `_` keys as notes, through a rule the plan added (M1 below) | step 2b item 1 |
| m1 ambiguous names | moot: no name list remains | |
| m2 first-match shape | yes | step 2b Tests |
| m3 CSRF JSON-only answer | yes, with the HTML re-raise and its test | step 7 "The header", Tests |
| n1 TTS | yes | step 7 |
| n2 runner recipe | yes | section 2 |
| n3 static controller exempt | yes, with the absence asserted | step 7 Tests |
| n4 `OwnerClaim.mappings` key path | yes | step 2b item 1 |
| n5 `enum_for` keyword | yes, with a test of the enumerator form | step 2b item 5, Tests |
| n6 `accounts` grouping | moot | |

## What the script confirmed

- **Map locations reached.** The schema has 90 map locations once the plan's 17 `x-id-map: true` marks are applied (73 `additionalProperties` schemas and 17 marks). With a plain probe key as well as `_probe`, all 90 lie in a reached Node. Every pointer in the plan's two mark lists exists, and after marking, no typed open object is left unmarked, so the lists are complete for test part 4 as it is worded.
- **R3's 13 maps.** `eventMapping.needs.set`, the five `socialTriageSet.labels.*` maps, `strings.stages`, `strings.stepLabels` and `socialPretextCall.tells.techniques` read a `_` key as an id. `strings.flipDefenderLineByChoice`, `strings.flipMontageByChoice` (and its values) and `socialPhishTarget.replies.byChoice` do not (M1).
- **Open maps.** Top-level `flags`, every marked `setGlobal` and `setVariable`, NPC `externalVariables` and `persistentVariables`, and the five requireGlobal object forms read a `_` key as an id.
- **Map and object at once.** Exactly three Nodes mix a map with declared properties (`replies`, `tells`, `socialPretextCall.labels`), as the plan says. No Node mixes a map branch with a sibling branch that declares properties, so a map key can never be captured by a sibling branch's property of the same name.
- **Combinators and refs.** The schema uses `oneOf` (68), `anyOf` (3), no `allOf`, no tuple `items`, no `additionalItems`, `if`, `not` or `propertyNames`, one property `dependencies` (array form, no schema, on `socialAwarenessEpisode.mfa`), and only `^_` as a pattern (302 places). One `$ref` has siblings (`item.affordance`: `type`, `description`), which the resolver ignores (n7).
- **Loader keys.** No `_`-prefixed key is written anywhere in `app/` or `lib/` on fd6dbaa58, so the loader adds no `_` key, as the plan expects.
- **Corpus under the resolver.** 618 `_` keys are skipped as notes (606 `_comment`, 8 `_note`, `_worked`, `_client`, `_comment_hints`, `_comment_r39`), 9 more `_comment` sit under nil, and no `_` key is an id. No corpus `_` key sits directly in any map, so M1 breaks nothing today.
- **`savedGlobalVariables` ordering.** The strip goes on `filtered` after `filter_requires_recursive` (games_controller.rb:288-291 on fd6dbaa58) and before `savedGlobalVariables` is attached (about :316), so a `_` global the player holds ships as the plan's test says. `player_state['globalVariables']` starts as `{}` (game.rb:5529), so on a new game the client's globals come only from the stripped `globalVariables`; that matters only for object-valued globals (m3).
- **Boot and packaging.** Hacktivity loads the engine by path (`gem "break_escape", path: "../BreakEscape"`, Gemfile:15), so `scripts/scenario-schema.json` is read from the source tree, as `OwnerClaim::STORY_ROOT` already reads `scenarios/` and `TtsExpectedLines` reads `scripts/ink_runtime_check/voicelines.mjs`. Hacktivity has `eager_load` true in production, `ENV["CI"]` in test and false in development; Rails 7.0 sets `eager_load` to `rake_eager_load` (default false) for rake tasks, so `assets:precompile` and other rake tasks do not run the boot check. A missing schema fails Puma boot in production and in CI, and the first resolver use in development.

## Findings

### Blockers

None.

### Majors

**M1. Step 2b item 1: the `^_` pattern on 18 map nodes makes their `_` keys notes, against section 2, the guards and step 2's validator.**
- *Problem.* The rule "`k` is a property when any branch ... matches it by a `patternProperties` pattern" is checked before the map rule. On e13392d17, 18 map nodes (`additionalProperties` a schema) also carry `"patternProperties": { "^_": {} }`, a convention from before step 2 (the same 18 exist at 22e29b9db). On each of them a `_` key is read as a property, so it is a note: skipped by granting walkers, deleted by `strip_notes!`. The 18:
  - `social.characters`, `social.intelFacts`, `social.templates`, `social.landingPages[].targets`;
  - `socialPhishTarget.replies`, `.replies.byChoice`, `.sentLines`, `.outcome.byChoice`;
  - `socialPrivacyPanel.facts`, `socialAssistant.summarise.byChoice`, `socialTriageSet.criticalWhat` (oneOf/1);
  - `socialAwarenessEpisode.strings.flipDefenderLineByChoice`, `.flipMontageByChoice` and `.flipMontageByChoice` values;
  - `socialPretextCall.lines`, `.asks`, `.tells`, `.labels`.
- *Where it contradicts the plan.* Section 2 says "a key of an id map ... is an id and never a note, whatever its first character". The guards in Tests expect "a `_` key under ... `flipMontageByChoice.<choice>`" and "a `_` key in a `socialPhishTarget.replies` map beside its declared `byChoice`" to ship and work; under the stated rule both are stripped, so both guards fail on a correct build of the rule. The unit case "an undeclared `_` key in `socialPhishTarget.replies`" has no stated expectation. Step 2's validator (`validate_grant_foothold_actions`, validate_scenario.rb:256-266 on e13392d17) takes only `properties` keys as declared, so it walks these `_` keys as ids; moving it onto the resolver silently changes that, while item 1 says step 2's node tests "stay green" and only suggestion lists can change.
- *Knock-on in the schema walk test.* Explore probes declared names and `_probe` only. In these 18 maps `_probe` resolves to the `{}` pattern node, so the map's value schema is never explored and Reach fails on four maps: `socialCharacter.emailKnots`, `flipMontageByChoice` values, `socialPretextLine.blanks` and `socialPretextAsk.grants.setGlobal`. Part 3 ("Where the Node has a map branch and does not declare `_probe`") passes or fails on these 18 depending on whether a pattern match counts as declaring, which the plan does not say.
- *Why it matters.* The plan's central rule and its own guards disagree in 18 places, and a builder cannot satisfy both. Nothing in the corpus breaks (no `_` key sits directly in a map), so the choice is free now and costly later.
- *Suggested change.* Keep the section 2 rule and change item 1's: a `patternProperties` match makes `k` a property only on a branch that is not a map; on a map branch (an `additionalProperties` schema or `x-id-map: true`) every undeclared key is an id. Optionally also remove `^_` from the 18 map nodes so json-schema agrees (the corpus has no `_` key there to break). With that rule the script finds 0 maps reading `_` as a note and all 90 map locations reached with `_probe` alone. Add one unit case on `social.characters` (a `_` character id is an id). If the other reading is wanted instead, section 2, the two guards and the validator note all have to say so.

### Minors

**m1. Global-name maps the marks cannot reach: timers, `onAbort`, `onLaunch`, `onPairSetGlobal`.**
- The walk of the corpus leaves the schema (nil) at four maps keyed by global names, because their parent is open and marked `false` or the field is undeclared:
  - `timers[].setGlobal`, 28 timers with a `setGlobal` (for example lab_physical_pentest `#/timers/5/setGlobal`); `timers` items are on the plan's `false` list and declare no properties;
  - `item.onAbort.setGlobal` and `item.onLaunch.setGlobal` (m01 `break_room` itemsHeld); both parents are on the `false` list;
  - `item.onPairSetGlobal` (test-ble-scanner), undeclared on `item`.
- A `_` global name in any of them is a note under nil and is deleted from the bootstrap (timers ship there), so the timer would never set it. The plan's section 2 rule and the "Data the schema does not describe" paragraph ("fail to show, never leak") disagree on whether this is acceptable, and the guard list tests only `globalVariables` and `task.onComplete.setGlobal`.
- *Change:* declare `setGlobal` on the timers entry, on `onAbort` and on `onLaunch`, and `onPairSetGlobal` on `item`, each with `x-id-map: true` (the parents stay `false` for their other keys); add a timer `setGlobal` with a `_` global to the guards. Timer `actions` lists (`hint`, `tint_objects`, `give_item` in the corpus) also walk under nil; granting walkers still see them, so they need nothing.

**m2. Step 2b item 3: two scenario-derived payloads are not on the strip list.**
- `POST unlock` answers a door with `roomData: serve_opened_room(target_id)` (games_controller.rb:2131-2137 on fd6dbaa58), which calls `Game#filtered_room_data` directly, not the `room` action. A strip placed on `room_data` inside `room` (as item 3 words it, "before it is wrapped in `{ room_id, room }`") leaves notes in every room opened by a door unlock.
- The bootstrap attaches `commandBoard` from `Game#command_board_config` (game.rb:4180-4190) after the strip point; it is the authored `commandBoard` of a `command_board` object, so its notes ship.
- *Change:* put the room strip at the end of `Game#filtered_room_data` (Node `#/definitions/room`), which covers both routes; strip the command-board config with its own Node (or nil); add the unlock route's `roomData` to the notes-never-ship test; and have the builder grep every `render json:` in the engine controllers for scenario-derived values and list them in the build log beside the `filter_inventory_for_client!` callers.

**m3. `x-id-map: false` on free data strips data, not notes.**
- The `false` list mixes fixed-field objects (`narrator.voice`, `creds.card`) with free data: the object branch of `globalVariables` entries, `minigameData`, `socialExercise.config`, `cryptexConfig`. Free data is game state or minigame input, not authored structure; a `_` key in it is data. Untyped "any value" schemas are the same case and are outside test part 4 as worded ("object-shaped"): 11 of them, and NPC `usePayload` holds objects in the corpus (lab_physical_pentest, 9 NPCs), cloned onto every `npc_used` event.
- For globals the effect is a split: the client's initial value (from the stripped bootstrap, since `player_state['globalVariables']` starts empty) lacks the key, while the server's default keeps it. No corpus global holds a non-empty object today (184 object or array globals, all `{}` or `[]`).
- *Change:* say in section 2 and the README note that a `_` key inside free data is a note and is stripped, so free data must not use `_` keys, and have item 7's validator warning also fire on a `_` key inside a `false`-marked or untyped node; or exempt `globalVariables` values from the strip. Either way, word part 4 to say whether untyped schemas need a mark.

**m4. The boot-failure test cannot be written from the plan's text.**
- The schema path is found from `__dir__` with no override, so "the schema path pointed at a missing file" has no mechanism, and a Rails test cannot re-run engine initialisation.
- *Change:* the initializer body is one method, for example `ScenarioSchema.boot_check!(app)`, that calls `root` when `app.config.eager_load` is true; the test calls it with a stub config and `ScenarioSchema` pointed at a missing path through an argument (`ScenarioSchema.load(path)` raising is already in the unit tests), plus one assertion that it does nothing with `eager_load` false. State that rake tasks, asset precompile among them, run with `eager_load` false under `rake_eager_load`, so they never load the schema.

### Nits

**n1. "A Node" and kind.** A Node is interned by its set of locations, but item 1 says it keeps "the branches that can hold the value's kind", and `child(node, key)` takes no value. Say that `child` uses the object-capable branches and `item` the array-capable ones at the call, which is what the walk needs.

**n2. "A frozen table that is never written afterwards" and interning.** Interning on demand writes; `at(pointer)` takes any pointer. Say the compile is eager over every Node reachable from the root and from the `at` pointers in the code (the script reaches about 2,800), and that `at` on any other pointer raises; or allow interning under the Mutex.

**n3. Explore's probe keys.** Probe a plain key (`probe`) as well as `_probe` at each map, so a map is explored whatever a later rule decides about `_` keys there. With M1's change `_probe` alone suffices, but the second probe keeps Reach independent of the note rule.

**n4. The gemspec line.** `spec.files` already leaves out `scenarios/` and `scripts/ink_runtime_check/`, which the engine reads at run time, so adding the schema does not make a packaged gem work. Keep the line for consistency and say so, or drop the claim.

**n5. The validator's `--schema` table.** The lib walkers the validator calls (`NetworkModel.grant_foothold_actions`, `CaptureModel.capture_writers`, the wearable walkers) start at `ScenarioSchema.root`, not at the table `ScenarioSchema.load(path)` builds, so a `--schema` file would change only part of the validator. No test passes `--schema`. Either drop the separate table or have the walkers take the root Node as an argument.

**n6. Open objects with properties.** Item 1 says a node with `additionalProperties: true` is open and "every open object carries the mark"; test part 4 requires the mark only where there are no `properties`. Five nodes have both (`socialCharacter.emailRecord`, `socialMailContact.emailRecord`, `socialSeededMessage.from` oneOf/1, `flipAftermath.items` items, NPC `rfidCard`). Align the prose with part 4.

**n7. `$ref` siblings.** Say that keywords beside a `$ref` are ignored (draft-04 behaviour); `item.affordance` is the one case, and its siblings change nothing.

## Tests that fail without their step

Step 2b: the implant, first-match, plant, granted-item, fingerprint, wearable, owner-claim, capture (including the enumerator case) and notes-never-ship tests each fail with the skip, keyword or strip removed. The schema walk test fails today on part 4 (no mark exists yet) and on part 3 without the resolver; part 5 shows it catches the parent-name class of error. The `replies` and `flipMontageByChoice` guards fail on a correct build of the rule as written (M1). The boot test needs m4's hook. Step 7's tests are as R3 found them, with R3's m3 and n3 folded in.

## Sync

Step 2b adds nothing to player_state and no traffic; every payload that carried notes shrinks. With m2, the unlock route's `roomData` shrinks too.

Counts: 0 blockers, 1 major, 4 minors, 7 nits.
