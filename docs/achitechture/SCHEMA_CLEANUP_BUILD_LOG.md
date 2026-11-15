# Scenario schema cleanup: build log

Branch `build/schema-slice1`, from main 97b8dbb25. User decision D14: slice 1 now, slices 2 and 3 after the release. Slice 1 makes no scenario file edits and turns no warning into an error.

## Slice 1: what changed

### The schema is the one list of known keys

`check_unknown_fields` (`scripts/validate_scenario.rb`) no longer keeps hand-written `%w[]` lists of known top-level, room, NPC, behaviour, item and event mapping fields. It walks the scenario with the schema walker (`BreakEscape::SchemaWalk`, the same resolver the server and the step-2 checks use) and, for every value the schema describes as an open block, warns about each key the schema does not declare there (`schema_unknown_key_warnings`). The rules:

- A closed block (`additionalProperties: false`) is skipped: json-schema already reports its unknown keys as errors.
- A `_` author note, an id-map key and anything in free data are never unknown (`AuthorNotes.note?`, the same test the server uses to strip notes).
- A retired key (FormatUpgrade) gets only its rename line, as before. `fingerprintQuality` gets only its own "ignored" line, as before.
- A `grant_foothold` action is left to its closed definition (`validate_grant_foothold_actions`), so one slip prints one line.
- Declared grants and account-profile items, which sit in no room, are walked first with the item definition, so their warnings name the grant path as before; a hash reached twice is checked once.
- The messages keep their old wording and `did you mean` hint (`unknown_key_message`), but the path labels changed: items under `contents` and `itemsHeld` are labelled `id || name || type` (the old text used only one of those), so a few warning lines read differently from before. The corpus ERROR lines are unchanged.

Where the old code worded its own message for a closed block (NPC `los`, `los.challengeOnSight`, `behavior.personalSpace`), the known keys now come from the schema (`schema_keys_at`), not a list.

The check now reaches blocks the hand lists never covered: timers and their actions, music events, `triggerOnInteract` actions, objectives and tasks, `player`, `narrator`, `hostile`, `patrol`, `timedConversation`, `timedMessages`, scenario-level NPCs, and every item inside `contents` and `itemsHeld`. Unknown keys stay warnings.

### Keys declared

123 keys added to `scripts/scenario-schema.json`, each with a short description naming its reader. Every one was checked against a reader in `public/break_escape/js`, `app/` or `lib/` (or, for `dimensions` and the `puzzle_graph_*` keys, the tools that read them).

- Top level: `npcs` (legacy scenario-level NPC list).
- Room: `chatBackground`, `dimensions` (read by the layout tools only), `name`.
- NPC: `call`, `callLabel`, `chatBackground`, `voiced`, `puzzle_graph_actions`; `spriteConfig.idleFrame`; `timedConversation.disableClose`, `.voiced`, `.ring`; `timedMessages[].skipIfGlobal`.
- Behaviour: `facePlayer`, `staticSprite`; `patrol.bounds`, `patrol.multiRoom`; `hostile` (object form) `startHostile`, `influenceThreshold`, `fleeSpeed`, `aggroDistance`, `maxHP`, `attackCooldown`, `attackRange`, `leash`, `chaseRange`, `chaseAcrossRooms`, `fightStyle` (all read by `npc-behavior.js parseConfig`).
- Event mapping: `endingCheck`, `resume`, `voiced`, `ring`, `unlockDoor`, `emitEvent`, `emitEventData`; `addCapture.kind`, `.roleLabel`, `.address`, `.host`, `.note` (read by `capture_model.rb`).
- Item: `puzzle_graph_role`, `_unlocks`, `_reveals`, `_optional`, `_note`, `_aim`, `_and_with`, `_links` (author metadata), `labUrl`, `acceptsVmLabels`, `important`, `rfid_protocol`, `rfid_hex`, `rfid_facility`, `rfid_card_number`, `saved_cards`, `tableItems`, `uuids`, `allowedPins`, `maxPinAttempts`, `handshakeFingerprint`, `completesTask`, `completesTaskOnOpen`, `gateVar`, `sealedMessage`, `openableReadyMessage`, `interactionType`, `pinLength`, `onOwnerNoticesMissing`, `hasContents`, `actions`, `storyPath`, `screenLocked`, `onInteract` (described as deprecated); `onAbort.emitEvent`, `onLaunch.emitEvent`; `flagRewards[].label`.
- `triggerOnInteract[]`: `taskId`, `capture`, `costume`, `card_id`.
- Timers: `id`, `delayMs`, `startOnGlobal`, `cancelOnGlobal`, `condition`, `label`, `showCountdown`, `countdownHours`; `actions[]` `type`, `title`, `message`, `condition`, `roomId`, `textureKey`, `color`, `pulse`.
- Music events: see below.
- Objectives: `unlockCondition.globalVariable`, `.equals`; task `description` (read only by the test bridge, as a title fallback), `puzzle_graph_unlocks`.
- Narrator: `skipTextValidation` (read by `tts_line_resolver.rb`).
- Social: `flipAftermath.items[]` `folder`, `from`, `to`, `subject`, `time`, `body`, `sender`, `push` (read by `flip-view.js`); `emailRecord.unlockable` in both emailRecord definitions (the server checks it for a headless correspondent, `game.rb`).

Objects and lists declared without a shape of their own carry `"x-id-map": false`, so a `_` key inside them is still a note the server strips, exactly as before, and the schema walk test's marks rule holds.

### Wrong names fixed

- `triggerOnInteract[]`: `task_id` and `aim_id` removed (nothing reads either; no scenario uses them); `taskId`, which `apply-actions.js` reads for `complete_task`, declared.
- `music.events[]` rewritten to the shape `music/scenario-music-events.js`, `music/closing-sequence.js` and `music/ending-audio.js` read: `trigger`, `playlist`, `track`, `fade`, `condition`, `autoStop`, `stopAfterTrack`, `disableClose`, `headerText`, `statusText`, `credits`, `closingCard`. `volume`, `loop`, `fadeIn` and `fadeOut` removed: nothing reads them and no scenario uses them.

No other declared key was dropped. The schema's own text calls four social keys "reserved, not read" (`showRedFlagMeter`, `reportAlwaysVisible`, `noBlameLine`, `maxMessages`), but they sit in closed blocks and scenarios use them (17, 69, 41 and 11 files), so dropping them would turn into errors; and `maxMessages` is still read by the validator. They are left for slice 2.

### Tests

- New `test/js/validator-schema-known-keys.test.mjs`: `check_unknown_fields` holds no `known_... = %w[...]` list and drives the check from `ScenarioSchema.root`; the old false warnings (`name`, `description`, `timedMessages`, `validSprites`, `showTitleScreen`, `labUrl`, `combination`, `lockedHint`, `blocksSight`, `onPairSetGlobal`) and the old unchecked keys print nothing; an undeclared key in each open block (top level, room, object, NPC, behaviour, event mapping, timer, music event, action) is exactly one warning naming it; and every declared key appears in engine, server or tools source, is `puzzle_graph_*` author metadata, or is on a short no-reader list (below), with a stale entry failing too.
- `validator-title-screen-name.test.mjs` and `validator-portrait-variants.test.mjs` grepped the hand lists; they now run `check_unknown_fields` and assert no warning.

Results: `bin/test-js test/js/validator-*.test.mjs` plus the unlock-door, phone-ring and phish-send tests, 83 files passed, 0 failed. Ruby, under the shared test lock: `bin/rails test` over `scenario_schema_test`, `schema_walk_test`, `author_notes_test`, `format_8a_corpus_test`, `scenario_schema_boot_test`, `carry_over_server_owned_globals_test`, `author_notes_sentinel_test` and both payload scans (`RUN_OPENED_SCAN=1`), 90 runs, 0 failures, 0 errors. `bin/rubocop scripts/validate_scenario.rb`: no offences.

### Corpus, before and after

The validator over all 181 `scenarios/*/scenario.json.erb`, with `--no-graph` (so no `dungeon_graph.*` file was rewritten), before (97b8dbb25) and after:

| | before | after |
|---|---|---|
| exit 0 | 181 | 181 |
| `❌ ERROR` lines | 73 | 73, identical per scenario |
| unknown-key warning lines | 109 | 120 |
| all `⚠️ WARNING` lines | 727 | 738 |
| scenarios with an unknown-key warning | 42 | 39 |
| uses of an undeclared key (the audit's corpus scan) | 2,967 (153 parent.key pairs) | 120 (20 pairs) |

The printed count went up slightly, not down. Of the 109 old warnings, 66 were false (`name`, `validSprites`, `labUrl`, `tableItems`, the BLE and RFID test fields, `onPairSetGlobal`, `timedMessages`, `showTitleScreen`, top-level `description`, two `_comment_*` notes) and are gone; 43 were real and remain. The schema-driven check also reaches blocks the hand lists never looked at, and finds 77 real ones there (`timers[].onceOnly` 29, `music.events[].comment` 25, and a few in `player`, `patrol` and `doors`). Of the 2,967 uses of an undeclared key, about half used to pass in silence; now all 120 left are warned about, and each has no reader.

The 20 keys still warned about, none with a reader (left for slice 2 to fix in the scenarios or retire):

- `timers[].onceOnly` (29 uses, 6 scenarios: timers are one-shot anyway), `music.events[].comment` (25, 5: a note without its `_`, so it ships to the client), `eventMappings[].autoTrigger` (8, 7), `objects.scenarioData` (8, 7: a nested copy nothing reads), `isEndGoal` (8, 8: the README still documents it), `note_title` / `note_content` (7 each, test-rfid scenarios);
- `player.startX`, `.startY`, `.sprite`, `.spriteVisemes` (the player's viseme sheet is ignored on purpose, `person-chat-portraits.js`);
- room `description` and `items` (npc-hub-demo-ghost-protocol);
- `doors[].requires` (2: the schema says lock fields on a door entry are never read; slice 2 makes it an error);
- `patrol.pauseTime`, `patrol.route[].x` / `.y` (npc-patrol-lockpick), an authored NPC `roomId` (the lazy loader overwrites it), `eventMappings[].handlerIndex` (an internal field, never read from the scenario).

## Deferred to slice 2

- Declared keys with no reader anywhere (the test's no-reader list): `canScanBluetooth` (item), `durationTargetMin` (awareness episode), `externalVariables` and `persistentVariables` (NPC), `genericValues` (phish target `primedFor`), `reportAlwaysVisible` (awareness `defend`), `showTitleScreen` (top level), `walkFrameStart` / `walkFrameEnd` (player and NPC `spriteConfig`). Also `formal` (social person `forms`), which no code names as a key but the word appears in comments, so the test cannot pin it. The audit's `scenario_id` and top-level `description` are named only by the validator and tools.
- The four "reserved, not read" social keys above.
- `triggerOnInteract.type` enum lists `unlock_task` and `unlock_aim`, which `apply-actions.js` has no case for.
- `onInteract`: declared as deprecated in slice 1 because the page still runs it (`interactions.js` handles `setVariable`, `actions`, `display` and `confirmationText`, and `DeclaredGrants` treats `onInteract.actions` as a run path). No scenario uses it. Retire it with the other aliases.
- Other hand key lists outside `check_unknown_fields`: `known_actions` (about line 2900), `known_variant_fields` (portraitVariants) and `known_style_fields` (object style) in `validate_scenario.rb`, and `RING_KEYS` / `CALL_KEYS` in `validate_phone_calls.rb`.
- No test blocks the slice 2 sweep: the review grepped `test/`, `scripts/`, `tools/` and `.claude/skills` for the keys slice 2 retires and found none pinned.
- Unknown-key message wording still uses an em dash (kept from the old text so the output reads the same); change it with the messages in slice 2 or 3.
- Everything in the audit's slice 2 and 3 plans: one spelling per verb, aliases retired, locks on `doors[]` an error, `x-ref` on every reference (slice 1 declared `triggerOnInteract.taskId` without one, so no new reference warning appears), then closing the core blocks.

## Handover

Status: slice 1 built and committed on `build/schema-slice1`, ready for review and a train. Not run: the full `bin/test-js` batch and the full Rails suite (the train check runs both). Next: slice 2, after the release, from the list above.

Working files (session scratchpad, not in the repo): `schema1/corpus.sh` (corpus run), `schema1/before`, `schema1/after` (validator output per scenario), `schema1/edit_schema.py` and `schema1/jspan.py` (the schema edit, made by text insertion so the file keeps its layout).

## R1 review outcomes

Fixes for the first review of slice 1 (1 M, 5 m).

- M1: the `triggerOnInteract` item schema moved to `#/definitions/action` (open, `additionalProperties: true`) and both `triggerOnInteract[].items` and `timers[].actions[].items` `$ref` it. Timer actions now accept every action key, so `emit_event`/`event_name`, `complete_task`/`taskId`, `set_global` `key` and `value`, `lighting_dip` `level` and `ms`, and `unlock_door` `room_id` give no warning, and the `roomId` suggestion for `unlock_door` is gone. The timer `item` is now the shared plain-object form, not the full item definition. The test fixture's timer carries one action of each of those types and asserts no warning.
- m1: top-level `phoneNPCs` is declared as legacy (like `npcs`), so a scenario using it gets only the existing ERROR. A test asserts it.
- m2: the reader-name check no longer reads `scripts/validate_scenario.rb`. That exposed two declared keys only the validator names, `fireOnlyWhenLoaded` (event mapping) and `mutuallyExclusiveGlobals` (top level); both are on the no-reader list for slice 2. For the blocks slice 1 rewrote (music events, `triggerOnInteract` actions, timers, `behavior.hostile`) every declared key must now be read as a property access (`entry.key`, `action.key`, `timer.key`, `hostile?.key`) in that block's reader files, comments removed. A second test proves `task_id`, `aim_id`, `volume`, `loop`, `fadeIn` and `fadeOut` fail it. The header states what is and is not proven.
- m3: `revoke_card` and `remove_item` are real cases in `apply-actions.js`, so both are in the action type enum. `set_costume` reads `costume ?? id ?? value`, so `id` is declared too (`value` already was).
- m4: the fixture's blocks loop now also covers declared grant items, account profile contents, `startItemsInInventory`, `contents`, `itemsHeld`, objectives, tasks, `doors[]`, `hostile`, `patrol` and timer actions, each with one undeclared key giving exactly one warning.
- m5: the build log line about message wording corrected (above); the new labels stay.
- m6: em dashes in the validator messages left as they are; the slice 2 note about test coverage added.

Corpus after R1 (`--no-graph`, 181 scenarios): all exit 0, 73 ERROR lines identical per scenario to before, unknown-key warning lines 120, all WARNING lines 738 (identical to the pre-fix output).
