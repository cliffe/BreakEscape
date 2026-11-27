# Scenario format hardening plan, amendment 1: review round 5

Reviewed: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` on build/harden-amend at 2fecbe9cd. Code read on main 406fa7791 (`git show 406fa7791:<path>`); Hacktivity read only, for one line reference. No code or plan was changed.

Method: the planner's throwaway checker (`a1r5/check.py`) was rerun against the schema of 406fa7791 and the 175 renders in `a1r5/rendered`, and read line by line against step 2b's text. Separate throwaway scripts counted map nodes that carry patterns, untyped schema locations, the action types inside item `minigameData`, and every `_`-by-name skip in `app/`, `lib/`, `scripts/` and `tools/`. 40 line references were checked against 406fa7791.

## Round 4 findings

| R4 | Resolved | Where |
|---|---|---|
| M1 `^_` on 18 map nodes made `_` ids notes | yes: rule 1 consults patterns only on branches that are not maps, the 18 patterns are removed, part 4 fails on a map with a pattern, unit case on `social.characters` and the fixture map with `^_` | step 2b item 1 "The rules", "The `^_` pattern on map nodes goes", Tests |
| m1 timer, `onAbort`, `onLaunch`, `onPairSetGlobal` maps under nil | yes: all four declared with `x-id-map: true`, a timer `setGlobal` guard added, corpus part 6 checks `*SetGlobal` names | "Open nodes carry a mark", Tests |
| m2 unlock `roomData` and `commandBoard` not stripped | yes: strip at the end of `Game#filtered_room_data` and `filter_container_contents`, `command_board_config` strips its copy, and a route audit of every `render json:` | item 3, "The route audit" |
| m3 `x-id-map: false` on free data | yes: a third kind, `x-free-data`, never stripped and not searched for grants; README wording | "Three kinds of key", item 8 |
| m4 boot test not writable | yes: `boot_check!(app, path:)` and its three cases; rake tasks stated | "The boot check", Tests |
| n1 to n7 | yes, each | item 1 (node kinds, eager compile and `STARTS`, two probe keys, gemspec left alone, `--schema` only for json-schema, open objects with properties, `$ref` siblings) |

## What the checker confirmed, and what it does not test

Rerun, it prints what the plan states: 2,539 Nodes, 94 map locations, all reached, none reading `_` as a note; 21, 15 and 15 marks, every open location carrying exactly one; 618 notes skipped (606 `_comment`, 8 `_note`, 4 others), 9 `_comment` under nil, no `_` key resolved as an id or as free data; no `setGlobal`-like key under nil; no grant-shaped key inside free data; 101 Hashes with an `id` inside item `minigameData`. A separate count confirms the 18 patterned map nodes are exactly the plan's list and that none of the 21 `x-id-map: true` nodes carries a pattern.

Its rules match item 1 for rules 1 to 4, with one difference that matters: its `note` is "`_` key and the rule kind is not id and not free". The plan's `note?` says something else (M1). It does not implement test part 3 (the run-time walk with the four walkers), the "map node carries a pattern" half of part 4, part 5, or the plain `probe` key; its Explore uses `_probe` only. Its part 4 leaves out `$ref`, combinator, `enum` and `const` nodes, which the plan's wording does not (m1). Its starts are the six the plan names. So the checker shows the rules give the stated numbers; it does not show that part 3 and the free-data guards can both pass.

## The planner's flagged calls

- **`WearableModel.global_writers` visits free data.** Right. It feeds only `scripts/validate_wearable.rb:124` (grep), and item `minigameData` holds 32 `set_global` actions that the engine runs (`esd-pushbutton-minigame.js:225` passes `completionActions` to `applyActions`). Skipping free data there would hide real writers. Skipping notes makes the check see fewer writers, which is the dead-code reading.
- **`OwnerClaim.scenario_objects` drops 101 minigame rows.** Acceptable. Its only callers are `leave_route` and `precise_route` (owner_claim.rb), read by `Game` (game.rb:2179) and the validator (validate_scenario.rb:6839). The rows are minigame data that play never places in a room, so the server's list moves closer to the client's loaded-object list. The plan's reason ("none carries an `affordance`, `needsTag` or phone owner") is not complete (n3), but the per-owner corpus check of `leave_route` before and after is the real guard and is in the plan.
- **Removing `^_` from the 18 maps.** Nothing in step 2 relies on it. `test/js/validator-strict-keys.test.mjs:265-295` asserts `patternProperties: { '^_': {} }` only on the closed step 2 blocks (`additionalProperties: false`), none of which is a map. Step 2's grant walker (`validate_grant_foothold_actions`, validate_scenario.rb:236-270) takes `properties` keys as declared and walks every other key of a map as an id before it looks at `_`, so it already reads these maps as the new rule does; `schema_resolve`'s pattern branch (:377) affects only suggestion lists. json-schema will now check a `_` key placed directly in one of these maps as a map value; the corpus has none. Several validators skip `_` keys of maps by name (m3), which is a separate disagreement.
- **Line references.** 40 checked on 406fa7791, all correct: game.rb 193-199, 394, 776, 843, 853-855, 1199-1205, 1425, 1441, 1454-1475, 1548-1569, 1955, 2013, 4180-4190, 5161, 5207, 5323, 5327, 5529; games_controller.rb 278, 291, 317, 372, 478, 532, 589, 597, 617, 658, 1099, 1125, 1396, 2131-2137, 2345, 2357; capture_model.rb 50-51, 70, 80, 119, 135, 143, 150, 170, 199, 295, 385; network_access.rb 18-21, 423 and 450, 491-492, 783; owner_claim.rb 183-195, 322; declared_grants.rb 84, 96, 114; network_model.rb 136, 254; wearable_model.rb 32, 54; validate_network.rb 535; validate_capture_log.rb 27; capture_proofs.rb 89-90; core/game.js 1667; main.js 186; core/player.js 206; npc-needs-chatter.js 134; mail-runner.js 314; flag-station-minigame.js 745; npc-needs.js 5234; `bond-visualiser.js:1747` (in `js/music/`); Hacktivity `event_progress.rb:338`.

## Findings

### Blockers

None.

### Majors

**M1. Step 2b item 1: `note?` calls a `_` key of free data a note, so the free-data guards and test part 3 cannot both pass.**
- *Problem.* "The calls" defines `AuthorNotes.note?(node, key)` as true when `key` starts with `_`, `node` is not `FREE` and `id_key?(node, key)` is false, and `free?(node)` as true only for `FREE`. Rule 3 makes the *keys* of a Node with an `x-free-data` branch free (their `child` is `FREE`), but the Node itself is an ordinary Node, never `FREE`. So at the Node of item `minigameData`, of `usePayload`, of `socialExercise.config` or of a global's value (the `oneOf` that holds the free object branch), a `_` key is a note by `note?`: `strip_notes!` deletes it and `each_live` skips it. Only keys two levels down are kept.
- *What breaks.* The guards "an object-valued global whose default holds a `_` key reaches the client ... with the key" and "a `_` key inside an item's `minigameData` and inside an NPC's `usePayload` ships unchanged", the unit case "a `_` key ... in an `x-free-data` node (data)", the live proof's "an object-valued global with a `_` key arrives intact", and "Three kinds of key" all expect the key kept. With `note?` as written they fail; with `note?` fixed to keep it, test part 3 fails, because part 3 knows only two cases ("Where the Node has a map branch, all four must see the probe; where `_probe` is a declared property or the Node has no map branch, none may"), and at a free Node `strip_notes!` keeps the probe. Explore reaches about 15 such Nodes. Either way a correct build fails one of the plan's own tests. The checker sidesteps this: its `note` excludes the free kind, and it does not run part 3.
- *A second gap in the same place.* `each_live` with `free: :skip` "does not descend into a value whose Node is `FREE`", but it "yields every value outside a note". Whether a direct child of `minigameData` (Node `FREE`) is yielded is not said; if it is, `grant_foothold_actions` and `DeclaredGrants.collect`, which test each yielded Hash's `type`, would see a grant one level inside free data, against "the granting walkers do not look inside free data".
- *Change.* Define `note?` from the rules: true when `key` starts with `_` and either `node` is nil or the rules give the key as a property through a pattern or as undeclared (rule 1 by pattern, or rule 4); false for an id (rule 2), free data (rule 3), a declared name, or under `FREE`. Say `each_live` with `free: :skip` neither yields nor descends into a value whose Node is `FREE`. Give part 3 a third case: where the Node has no map branch and `_probe` is free data, `strip_notes!` keeps it and `each_live` (default), `scenario_objects` and `each_capture_writer` do not see it. Add a unit case for a `_` key directly under a free-marked node (`minigameData._x` kept, and `note?` false), beside the existing one.

### Minors

**m1. Test part 4: "a location with no type" literally includes every `$ref`, combinator and `enum` node.**
- On 406fa7791 the schema has 179 untyped locations outside note patterns: 104 `$ref`, 66 `oneOf`, 3 `anyOf`, 6 `enum` and 17 bare. Only the bare ones need a mark (15 are marked; the two `needsCompany.avoids` branches are exempt). Read as written, part 4 fails on 179 locations; the checker excludes `$ref`, combinator, `enum` and `const` nodes, which is the sensible reading.
- *Change:* in part 4 and in "Open nodes carry a mark", say a location with no type counts only when it has no `$ref`, no `allOf`, `anyOf` or `oneOf`, and no `enum` or `const` (a `$ref` target and each combinator branch are checked as locations of their own).

**m2. Grants inside item `minigameData` run on the client but are refused by the server, and only the Rails suite notices.**
- `minigameData` action lists are live: `esd-pushbutton` runs `completionActions` through `applyActions` (`esd-pushbutton-minigame.js:225`), which handles `give_item` (`apply-actions.js:249`), and the minigame's own header comment invites "set_global, complete_task, etc.". Today `DeclaredGrants.collect` walks every key, so such a `give_item` is declared. After 2b it is not (the plan adds a plant test asserting the refusal), so a future author's `give_item` there puts an item in the inventory that the server will not accept.
- The plan keeps the corpus clean through part 6 of the schema walk test, a Rails test, so the author finds out at the merge batch. The validator says nothing and the README note does not mention action lists in `minigameData`.
- *Change:* have item 7's validator check also print a `❌` (or a warning) for a grant-shaped Hash (`type` `grant_foothold` or `give_item`, or an `addCapture`, `wearable` or `fingerprintOwner` key) reached inside free data, with a node test; and have the README note say that a grant inside `minigameData` or other free data is never honoured, so it goes in a declared action list instead.

**m3. About 20 `_`-by-name skips over map keys sit outside the resolver and outside item 6's audit.**
- Section 2 says whether a `_` key is a note is decided by the schema, and item 1 says every walker in `app/`, `lib/` and `scripts/` that decides "note, id or data" asks the resolver. On 406fa7791 these skip `_` keys by name, several of them keys of maps the plan now calls ids:
  - `lib/break_escape/npc_habits/clues.rb:204` (`social.intelFacts`, one of the 18 maps; authoring-time only, used by the validator, `validate_network.rb` and the dungeon graph);
  - `scripts/validate_npc_habits.rb:92` (`roles`, a map) and `:122` (`habits`, closed: correct);
  - `scripts/validate_social/awareness.rb:463` (`stepLabels`), `:550`, `:686` and `:697` (`flipMontageByChoice` and its values), `:524`, `:1574`, `:1594`;
  - `scripts/validate_social/triage.rb:155`, `:419` (`labels.verdictFeedback`), `:425`, `:628`, `:707`, `:718`; `mail.rb:269`; `options.rb:94` and `:122`; `dm_app.rb:65` and `:131`; `scripts/validate_social.rb:130`.
- After 2b, a `_` id in one of these maps is checked by json-schema as a map value and used by the engine, while the named validator ignores it (and `Clues` leaves its text out of the readable texts). Nothing in the corpus is affected. Item 6's grep (`node.each`, `each_value`, `each_with_index` inside a recursive walk) does not find these one-level loops.
- *Change:* add `start_with?('_')` (and `startsWith('_')` in engine JS, which has none today) to item 6's grep; list each hit in the build log with the schema's answer for that location; move the ones over map keys onto `AuthorNotes.note?` with the location's Node (`ScenarioSchema.at` pointers added to `STARTS`), or record why the skip stays. The closed-block skips (`habits`, the fixed-key `unlockCondition` and profile checks) can stay as they are.

### Nits

**n1. Fixture schemas and `STARTS`.** `load(path)` compiles "from each pointer in `ScenarioSchema::STARTS`". The unit tests load small fixture schemas (a map with `^_`, a broken `$ref`) that hold none of those pointers. Say that `load` takes `starts:` (default `STARTS`) or skips a start the file does not hold, and how a Node knows its table, so the module calls work on a fixture's Nodes.

**n2. `strip_notes!`'s return value.** `command_board_config` returns `AuthorNotes.strip_notes!(config.deep_dup, nil)`, so `strip_notes!` must return its argument. Say so.

**n3. The 101 rows' reason.** `AccessWork.affordance` also takes a preset affordance by `type` when `officePresets` is on (`preset_id`, access_work.rb:223-230), and `prints?` matches a `needsHome` against any listed object's `id` (owner_claim.rb:252). The sentence "None carries an `affordance`, `needsTag` or phone owner" should add "and none takes a preset affordance or shares an id with an NPC's `needsHome`", or simply rest on the per-owner corpus check.

## Tests that fail without their step

Step 2b: the implant, first-match, plant (note and free data), granted-item, fingerprint, wearable, owner-claim, capture (with the enumerator case), notes-never-ship (per route), boot-check and unit tests each fail with the skip, keyword, strip, method or resolver removed. Schema walk test: part 4 fails today (no marks, 18 patterned maps), part 2 and 3 fail without the resolver, part 5 shows the parent-name class is caught, part 6 fails with the four new `setGlobal` declarations removed. The guards pass before and after, as guards should, except that the free-data guards and part 3 cannot both pass on a build of the text (M1). The node test fails today, since the server honours `_draft`. Step 7's tests are as R3 and R4 found them.

## Sync

Step 2b adds nothing to player_state and no traffic. Every payload that carried notes shrinks (bootstrap, room including the unlock and workaround `roomData`, container, command board, inventory); free data ships as before. With M1 fixed, object-valued globals reach the client unchanged, so the client's initial globals equal the server's defaults as today.

Counts: 0 blockers, 1 major, 3 minors, 3 nits.

Verdict: not ready to build as written; ready once M1 is applied (a definition and one test case, checkable by diff without another round), with m1 to m3 folded in by the builder.
