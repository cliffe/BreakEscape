# Scenario format review: structure and consistency

Date: 2026-11-12. Base: main at 6a834437c. Scope: the scenario JSON format that authors write (`scenario.json.erb`), its schema (`scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`), the validators (`scripts/validate_*.rb`), the server code that reads and filters it, and the client that consumes it. A second review covers the access, networking and office-life additions in depth; they appear here only where they affect the whole.

Method: all 176 `scenarios/*/scenario.json.erb` were rendered with the validator's own ERB binding (all 176 render). Field usage was counted by script over the rendered JSON, the schema was run against every scenario, and the full validator ran on every scenario with `--no-graph --skip-ink --no-lint`. A mutated copy of m01 (outside the repo) tested which broken references and typos the validator catches. Counts below are "scenarios that use the field" unless they say otherwise. 66 of the 176 scenarios are `test*` fixtures.

## Verdict

The format works, and the two gold-standard missions validate clean (m01: 0 errors, 15 warnings; m02: 0 errors, 29 warnings). Its basic shape is sensible: a map of rooms, each holding arrays of objects and NPCs, with objectives beside them. It is not well designed as a format, though. It has grown feature by feature, and each feature added its own spellings, its own checks and its own server-side stripping, so the rules an author must follow are spread across a schema, a 13,000-line validator, two filters and the README.

The three biggest problems:

1. **Secrecy is implicit.** Nothing in the format says which values are secret. The server decides by field name and `lockType` in two hand-kept denylists, so an author can leak an answer by putting it anywhere those lists do not reach. One shipped mission already does (m08's door PIN is a global, and globals go to the browser at game start).
2. **There is no single definition, and the validator does not enforce its own errors.** The schema leaves the core kinds (room, object, NPC, event mapping) open, the validator keeps separate hand-written lists of known fields, and the engine reads fields neither knows. The validator exits 0 on everything except schema errors: 16 scenarios pass while printing 62 `❌` lines, and a task completion that names a task that does not exist is not reported at all.
3. **The same idea is spelt several ways.** Setting a global alone has five spellings across JSON and ink, the action fields mix `room_id`, `roomId` and `target_room`, `requires` means seven different things depending on `lockType`, and there is no format version or load-time upgrader to retire the old forms.

Counts: **2 blockers, 7 majors, 10 minors, 5 nits.**

## Findings

### Blockers

**B1. Which values are secret is decided by server denylists, not by the format.**
- The bootstrap starts from a deep copy of the whole scenario and deletes named keys: `flags`, `accountProfiles`, `roles`, network keys, feed facts, capture secrets, `targetFlags` (app/models/break_escape/game.rb:1094-1185). Room data is then sent through a second list of kept fields that includes `requires` (game.rb:1121-1125); the PIN is only removed later by the controller's pass (app/controllers/break_escape/games_controller.rb:1917-1938).
- Lazy room payloads go through a near-copy of that pass (game.rb:4551-4650). The rule for `requires` is written twice, identically: delete it when `lockType` is present and is not biometric, bluetooth or rfid (game.rb:4578, games_controller.rb:1930). A `requires` on an object with **no** `lockType` is kept. 15 objects in the corpus have `requires` without `lockType` (all legacy, all the literal word `"password"`, e.g. scenarios/ceo_exfil/scenario.json.erb:240), so nothing leaks today. An author who writes `"locked": true, "requires": "4821"` and forgets `lockType` would ship the PIN.
- Every other hiding rule is a separate per-feature list: `WITHHELD_NPC_KEYS`, `WITHHELD_WORK_NPC_KEYS` (game.rb:4660-4665), `NetworkAccess::WITHHELD_OBJECT_FIELDS` (app/models/break_escape/network_access.rb:21), `hintOnlyFlags`, station `flags`, grant contents (lib/break_escape/declared_grants.rb), `puzzle_graph_*` except two keys the client reads (game.rb:4531-4538).
- `globalVariables` and `minigameData` are never stripped. m08 needs a door PIN in voiced ink, and the only way for ink to see an ERB value is a global, so `suite_code` (scenarios/m08_the_mole/scenario.json.erb:117) ships to the browser from game start: a console read opens the interrogation suite. A disabled block in sis01 shows the same path for `minigameData` (scenarios/sis01_healthcare/scenario.json.erb:2797-2800).
- Of the schema's 850 descriptions, 33 mention the browser or client in prose ("Never sent to the browser", "stripped from the client scenario"). There is no machine-readable marker, so neither the validator nor the server can check that a secret field is covered.

**B2. Three definitions of the format, and the validator's errors do not fail the run.**
- The JSON schema is used only by the validator (scripts/validate_scenario.rb:216-227) and by node tests that call it. The server never validates against it; `Mission#generate_scenario_data` only parses the JSON (app/models/break_escape/mission.rb:205-216).
- Unknown fields are caught not by the schema but by hand-kept lists in the validator (validate_scenario.rb:400-470), which already disagree with the schema (M2).
- The validator exits 1 only for directory, structure, ink-compile and schema failures. Every other `❌ ERROR` or `❌ INVALID` is printed and the run exits 0 ("warnings don't cause failure", validate_scenario.rb:7021-7023). Across the corpus, 16 scenarios exit 0 while printing 62 `❌` lines (ceo_exfil 10, biometric_breach 5, sis02_energy 3, the rest test layouts). The orchestration rules compensate by telling every agent to count `❌` lines by hand.
- When the schema does fail, the run exits before the common issues are printed (validate_scenario.rb:6919-6935), so an author fixing a schema error then meets a second wave of errors that had already been computed.
- Mutation test on a copy of m01: a misspelt room field (`lockedd`), a misspelt `requries` on a PIN safe, `onRead.setGlobal` (should be `setVariable`), an eventMapping `completeTask` naming a missing task, a `triggerOnInteract` `unlock_door` to a missing room, and a task `targetRoom` to a missing room. Result: exit 0. Two `❌` lines (unlockDoor and targetRoom), two warnings (the two typos), and nothing at all for `completeTask`, the action's `room_id` or `onRead.setGlobal`.

### Majors

**M1. The core kinds are open, the newest blocks are closed.** `room`, `item`, `npc`, `eventMapping`, `objective` and `task` (scenario-schema.json:3704, 3783, 3839, 4165, 4750, 4907) have no `additionalProperties: false`, and neither has the top level. The `social` subtree has 323 closed objects, and the README's social section says the schema "closes every block" (README_scenario_design.md:2485); the core kinds do not follow that rule. So a typo in the most common fields is a warning at best, while a typo in a rarely used social block is a hard failure.

**M2. Schema, validator lists and engine disagree.** Fields scenarios use that the schema does not know:

| Kind | Field | Scenarios | Engine reads it? |
|---|---|---|---|
| top | `scenario_id`, `scenario_name` | 94 each | `scenario_name` yes, `scenario_id` no |
| top | `importGlobals`, `exportGlobals` | 23, 24 | yes (carry-over) |
| room | `chatBackground` | 78 | yes |
| room | `name`, `dimensions`, `exits`, `items` | 10, 3, 2, 1 | no |
| object | `minigameData` | 91 | yes (own schema file) |
| object | `labUrl`, `scenarioData`, `isEndGoal`, `important` | 19, 7, 8, 10 | partly; `isEndGoal` no |
| object | `puzzle_graph_*` (8 keys) | up to 17 | 2 keys, rest generator-only |
| eventMapping | `unlockDoor`, `endingCheck`, `skipTask`, `resume`, `voiced` | 7, 8, 3, 3, 4 | yes |
| eventMapping | `autoTrigger` | 7 | no |
| task | `description`, `targetGlobal`, `targetValue` | 8, 1, 1 | |
| flagReward | `item_type`, `room_id`, `label` | read by games_controller.rb:2927 and nearby | yes |

The other way round, schema properties no scenario uses: 5 top-level (`lockCues`, `officeVisuals`, `roomToneTypes`, `showNpcIntentBubbles`, `ttsPregenerateChatter`), 11 object (including the deprecated `key_id`), 5 NPC, 3 eventMapping (`callLabel`, `message`, `participantTag`). Some are new features waiting for content. The validator's own known list for eventMappings (validate_scenario.rb:460-468) has `unlockDoor`, `skipTask`, `endingCheck`, `emitEvent`, `emitEventData` and `resume`, which the schema's eventMapping lacks, so the two definitions have already drifted apart. Six scenarios fail the schema outright (basic_mission, vm_free_mission, test_table_items, test-ble-scanner, test-blockchain-explorer, test_desk_seating), mostly old fixtures and a room type missing from the 145-entry enum.

**M3. No general model of ids and references.**
- Rooms are a map keyed by id; NPCs, objects, aims and tasks are arrays whose id field is spelt `id`, `aimId` or `taskId`. Objects may omit `id`: 486 of 1,653 objects (29%) have none, and the server's unlock lookup then matches `id` **or** `name`, first hit (scripts/validate_social.rb:166-171 documents this).
- Uniqueness is checked only for objects directly in `rooms[*].objects` (validate_social.rb:144-160). Duplicates inside `contents` or `itemsHeld` pass: m09 (`derek_file`, `letters`, `nightshade_copy`), m10 (`nightshade_payment`) and lab_tesseract_trials; npc-hub-demo-ghost-protocol repeats three NPC ids. Ids are not unique across kinds either (a task and a global both named `victoria_choice_made` in m03; an NPC and a global `victoria_gallery` in m10), which matters because events and conditions name them as bare strings.
- Reference checks exist one by one (connections, `targetRoom`, `targetNPC`, `targetObject`, `globalVarOnKO`, `taskOnKO`, `unlockDoor` on mappings) but there is no declared list of "this field names a task / room / global", so new fields arrive unchecked (B2's mutation test). An `opens_lock` that no lock `requires`, or a key lock nothing opens, is only a warning (30 such warnings across the corpus).

**M4. One idea, several spellings.** See the table below. The worst is setting a global: `setGlobal` (object, 707 uses), `setVariable` (only in `onRead` and `onPickup`, 187 uses in 22 scenarios), `{type: "set_global", key, value}` in actions and flag rewards (118), and in ink `#set_global:name:value` (486) beside `#set_variable:name=value` (74), with different separators (public/break_escape/js/minigames/helpers/chat-helpers.js:552, 647). `onUse.setGlobal` is a different shape again (a string, set to true; scenario-schema.json:4733-4740). Writing `setGlobal` in `onRead` is accepted silently and does nothing.

**M5. `requires` and `type` each carry too many meanings.** `requires` is a string or an array and means, by `lockType`: a lock name matched to a key's `opens_lock` (key), the answer itself (pin, password), a card id (rfid), a MAC address (bluetooth), a person's display name (biometric), a flag reference (flag), and in 15 legacy objects the lock kind (`"password"`). The answer and the reference share one field, which is exactly why B1's stripping has to switch on `lockType`. `type` picks the sprite (checked against 1,178 PNGs), picks engine behaviour (README_scenario_design.md:513), is the first selector for `#give_item`, and is the payload of `item_picked_up:` events, so changing a prop's art changes its behaviour and its events. A separate `sprite` field exists for overriding the art; I did not check every path that reads `type` for whether it also honours `sprite`.

**M6. No format version and no upgrader.** `version` is in the schema as an optional string (scenario-schema.json:15); 86 scenarios say `"1.0"`, one says `"2.0"`, and nothing reads it. A game stores the rendered scenario at creation (game.rb:4716-4737), so every rename has to be read in both spellings forever. The `key_id` to `opens_lock` rename shows the cost: fallbacks in `window.lockRef` (js/utils/helpers.js) and `lib/break_escape/item_identity.rb`, a deprecated schema entry (scenario-schema.json:5051) and a validator error. Aliases such as `target_room`/`room_id` (games_controller.rb:2927) and `room_id`/`roomId` (scenario-schema.json:5207-5209) are scattered through readers with no list of which form is current.

**M7. Fields with no consumer.** `endGoal` is in 146 scenarios and `scenario_id` in 94, and nothing in app, lib or the client reads either. `version` (87) likewise. Object `isEndGoal` (9), eventMapping `autoTrigger` (7) and `note_title`/`note_content` (2) are read by nothing. Authors copy them from older scenarios because the format gives no sign they are inert, and `check_unknown_fields` lists `endGoal`, `version` and `scenario_id` as known (validate_scenario.rb:404-406), so they never draw a warning.

### Minors

**m1. snake_case and camelCase mixed.** The schema has 665 camelCase keys and 19 snake_case ones. The snake_case ones are among the most used: `scenario_brief` (174), `door_sign` (127), `opens_lock` (23), `card_id` (18), `show_scenario_brief` (24), `collection_group`, `rfid_protocol`, and the generator's `puzzle_graph_*`. Action objects accept `task_id` and `aim_id` beside `taskId` and `aimId` (scenario-schema.json:5194-5195). `mission.json` mixes `difficulty_level` and `estimated_duration_minutes` with `resultGlobal` and `estimatedDuration`.

**m2. Units are not in names consistently.** `delayMs` and `npcWindupMs` say milliseconds; `barkDelay` is also milliseconds but does not say so; `cooldown` is an untyped-unit integer; `chatterCooldownMin` and `needsDeferMin` are needs-clock minutes; `autoLockSeconds` is seconds. `startPosition` is in tiles (scenario-schema.json description); NPC and object `position` give no unit.

**m3. Enums disagree between places that mean the same thing.** Object `lockType` includes `login`; room `lockType` does not (scenario-schema.json:4040-4043 against 5040-5043). The room `type` enum is a hard-coded list of 145 map names, so every new room map needs a schema edit (test_desk_seating fails on this). The task `type` enum does not include `set_global`, which a demo uses.

**m4. Untyped and open fields inside the core.** eventMapping `completeTask`, `unlockTask` and `unlockAim` are `{}` (scenario-schema.json:4901-4903), so any value passes; `timers` items, `onLaunch`, `onAbort` and `onRead.setVariable` accept any object.

**m5. Defaults live in prose.** Three properties use the `default` keyword; 225 descriptions state a default in words. Neither the validator nor the engine can read them from one place, and the engine's defaults are scattered through readers.

**m6. ERB is free Ruby and its binding is copied.** 145 of 176 scenarios use no ERB. 31 use helpers; 10 (m02 to m10, lab_tesseract_trials) run Ruby blocks with loops and local variables. The `ScenarioBinding` in the validator "replicates" the server's (validate_scenario.rb:55, mission.rb:337-415) and must be kept in step by hand. Values are pasted into JSON text, so a string with a quote breaks the render unless the author remembers `.to_json` (used in 9 scenarios). Whole JSON blocks are switched off by wrapping them in ERB comments with the inner tags defaced (sis01:2789-2800), and `@random_pin` gives a value per game that the validator never sees.

**m7. Metadata split over two files with no schema for one.** `mission.json` (177 files, 66 distinct keys, many used by 1 to 4 files) holds the display name, scoring, `endingCheck` and result global; the scenario holds `scenario_name`, `titleScreenName` and `scenario_brief`. The title can be set in three places.

**m8. `minigameData` has its own schema dialect.** scripts/minigame-data-schemas.json lists only `required`/`optional` names (no types) for 34 entries, dispatched by `type`, `lockType`, `id` or `interactionType` (its `_comment`). An undeclared `minigameData` key is an error; an undeclared object key is a warning.

**m9. Validator messages are uneven.** Schema errors end in an opaque schema UUID ("in schema 62cb4d61-...") and a JSON pointer, without the object's name. Error labels vary: `❌ INVALID` (108 sites), `❌ ERROR` (53 in validate_scenario.rb, 117 in validate_npc_needs.rb), `❌ SOCIAL` (31). The hand-written checks are good: they name the object, say what the engine will do, and suggest the fix (for example the PIN-lock and unlockDoor messages in the mutation test).

**m10. Comments by convention.** JSON has no comments, so 26 scenarios use `_comment` keys (494 in all, with variants such as `_comment_hints` and `_comment_r39`); the schema allows `_comment` in some blocks only, and long Ruby comment blocks in ERB carry most design notes.

### Nits

- n1. The schema's title says it validates `scenario.json.erb` files; it validates the rendered JSON.
- n2. 74 schema descriptions cite internal plan ids ("slice 9.3b I", "P3 N15", "OFFICE_LIFE_PLAN 10"), which mean nothing to an author.
- n3. 1,412 of 2,234 schema properties have no description.
- n4. Display names are `name` (object), `displayName` (NPC), `door_sign` (room), `title` (aim, task); 10 scenarios add a room `name` that nothing reads.
- n5. The schema allows `requires` as a string or an array everywhere, but only rfid and biometric use arrays (7 of 236 locks).

### Inconsistency table

| Idea | Spellings and where | Notes |
|---|---|---|
| Set a global | `setGlobal: {name: value}` (eventMapping, task `onComplete`); `setVariable: {...}` (object `onRead`, `onPickup`); `setGlobal: "name"` sets true (NPC `onUse`); `{type: "set_global", key, value}` (actions, flag rewards); ink `#set_global:name:value` and `#set_variable:name=value` | five forms, two separators |
| Unlock a door | `unlockDoor` (eventMapping); `{type: "unlock_door", room_id}` (actions, apply-actions.js:228); `{type: "unlock_door", target_room}` (flag rewards, server also takes `room_id`); ink `#unlock_door` | |
| Complete a task | `completeTask` (eventMapping), `taskOnKO` (NPC), `{type: "complete_task", taskId}` (actions; schema also allows `task_id`), `completesTask` (object, not in schema), `#complete_task` | |
| Emit an event | `emitEvent` (eventMapping, `onUse`), `{type: "emit_event", event_name}` (actions, flag rewards) | |
| Give an item | `{type: "give_item", item: {...}}` or `name` (actions), `item_name` plus `item_type` (flag rewards), `#give_item:<type>` (ink) | selector differs by place |
| Room reference | map key; `room_id`, `roomId`, `target_room`, `targetRoom`, `startRoom`, `connections` values | |
| Id field | `id` (object, NPC), `aimId`, `taskId`, map key (room), `phoneId`, `callId` | |
| Lock opener | `opens_lock` (snake), `card_id` (rfid card), `rfidCard`, `creds.card` (NPC), deprecated `key_id` | |
| Lock answer | `requires` (pin, password), `targetFlags` (task), `flags` (station, top level twice) | |
| Delay or cooldown | `delayMs`, `barkDelay` (ms), `cooldown` (unstated), `chatterCooldownMin`, `autoLockSeconds`, `npcWindupMs` | |
| Show a title | `scenario_name`, `titleScreenName`, `mission.json` `display_name` | |
| Booleans | mostly bare adjectives (`locked`, `takeable`, `readable`), some `is`/`has`/`show` prefixes (`isEndGoal`, `hasFingerprint`, `showKeyboard`), one string-or-flag (`show_scenario_brief: "on_resume"`) | |

## Recommendations, by value for cost

1. **Make the validator's exit code match its output.** Exit 1 on any `❌` line, use one label (`❌ ERROR`), and print every section before exiting, including after a schema failure. Safe now (validator only). 16 scenarios would start failing until their 62 errors are fixed or downgraded; m01 and m02 are unaffected.
2. **Add a secret-leak check to the validator.** Error when a pin or password answer, a `targetFlags` value or a station flag also appears in `globalVariables`, `minigameData`, `scenarioData` or any client-shipped field; error on `requires` or `locked: true` without `lockType`. Safe now. 1 scenario is flagged (m08 `suite_code`), which needs a design call (a server-side "speak this secret" route for ink, or accept the leak in the cheat policy); 15 legacy objects get the missing-`lockType` error.
3. **Generic reference and uniqueness checking.** Annotate reference fields in the schema (for example `"x-ref": "task"`, `"room"`, `"global"`, `"npc"`, `"object"`) and resolve every annotated field in one validator pass; check id uniqueness across all objects, including `contents` and `itemsHeld`. Safe now if new findings start as warnings. 5 scenarios have duplicate ids today (m09, m10, lab_tesseract_trials, npc-hub-demo-ghost-protocol, test_access_social).
4. **One `ScenarioBinding`.** Move the class into `lib/break_escape/` and have the validator require it, and add a `json(value)` helper that escapes strings. Safe now; no scenario changes.
5. **Mark server-only fields in the schema and serialise by them.** Annotate each secret field (`"x-server-only": true`) and have one server function build the client copy from the annotations, replacing the two `filter_requires` copies and the per-feature lists. A node or Rails test then asserts that every annotated field is absent from the bootstrap and room payloads. Safe now for scenarios (no file changes); an engine change with live-path proof.
6. **Add `formatVersion` and a load-time normaliser.** The server reads it (absent means 1), and one Ruby normaliser rewrites old spellings (`key_id`, `target_room`, `roomId`, `task_id`, `setVariable`, `requires` without `lockType`) to the current form before filtering and before the client sees them; the client fallbacks can then go. Safe now; 0 scenarios need changing, and stored games are upgraded on load.
7. **Close the core kinds.** Add the missing fields from M2 to the schema, then set `additionalProperties: false` with `patternProperties: {"^_": {}}` on room, object, NPC, eventMapping, objective and task, and delete the hand-kept lists in `check_unknown_fields`. Needs a migration: 37 scenarios currently carry unknown-field warnings, and the dead fields (rec. 9) must be removed or declared first.
8. **One action vocabulary.** Accept the same `{type, ...}` action list in eventMappings, `onRead`, `onPickup`, `onComplete`, `onUse` and flag rewards, with the camelCase shortcuts kept as aliases in the normaliser (rec. 6). Needs a migration only if the aliases are later removed: 22 scenarios use `setVariable`, 5 use `item_name`, 2 use `target_room`, 14 use `event_name`.
9. **Drop or move dead fields.** Remove `endGoal` (146 scenarios), `version` (87, replaced by `formatVersion`), `scenario_id` (94), `isEndGoal` (9), `autoTrigger` (7), `note_title`/`note_content` (2); move the title fields to `mission.json`. Needs a mechanical migration of up to 146 scenarios. For missions with cached audio, the change does not touch spoken text.
10. **Split `requires` by meaning in new locks.** Add `answer` (secret: pin, password) beside `requires` (reference: key, rfid, biometric, bluetooth, flag) and have the normaliser map old pin and password locks. Needs a migration if the old form is ever removed: 32 scenarios with pin or password locks.
11. **Write the naming rules down and hold new fields to them.** camelCase only, units as suffixes (`Ms`, `Sec`, `Min`, `Tiles`), booleans as bare adjectives, ids as `<kind>Id` when referencing. Safe now (convention, enforced in review); renaming existing snake_case keys is not worth the migration (`door_sign` alone is in 127 scenarios).
12. **Give `mission.json` a schema and type `minigameData`.** Convert minigame-data-schemas.json to JSON Schema fragments per entry and add a `mission-schema.json`. Safe now as warnings; most `mission.json` files use a common core of about 15 keys, and the outliers (3 to 5 files) need a decision each.
13. **Stop hard-coding room types in the schema.** Check `room.type` against the room map files as the validator already does for object sprites. Safe now; fixes test_desk_seating.
