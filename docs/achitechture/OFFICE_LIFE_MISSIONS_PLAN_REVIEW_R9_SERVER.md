# Office Life Missions Plan: server correctness, cheat resistance and sync review (R9)

Scope: sections 4, 6, 7, 9, 10, weighted to the validators (V5 lists and the V5 fixture, V6, V9, V10), the m02 pilot wiring, and the sync budget. Every claim below was checked against the engine under `public/break_escape/js/`, the server (`games_controller.rb`, `game.rb`, `tts_line_extractor.rb`, the `break_escape:tts` rake namespace, `generate_dungeon_graph.rb`), the schema, and `scenarios/m02_ransomed_trust/scenario.json.erb`. Read-only; no servers started, no database tasks run.

## Verdict

The plan's cheat-resistance and sync claims hold up. I regenerated the office-life-stem literal set from the engine and compared it both ways against V5's stems, names, exclusions and ignore list: every emitted literal is accounted for, and no listed stem/name/exclusion/ignore entry is a phantom, with one exception (`item_dropped`, below). The m02 event wiring is sound: `objective_task_completed:<task>`, `room_entered:<room>`, `npc_left_post:<id>` (payload carries `targetId`), `item_picked_up:id_badge` (payload carries `itemId`), `emitEvent`/`desk_phone_ring:<id>`, and the `needs:{print}`/`needs:{set}` commands all exist and behave as the plan describes. The KO ordering claim (`gary_ko` set before `talk_to_gary` completes) is correct at `npc-hostile.js:362-387`, so a knock-out prints nothing. The printout slot passes the server collectible check as an inert takeable `notes` item, and because it carries no hard-rule secret and no required global reads it, forging its reveal global reaches nothing. KO globals, `heard_<knot>` globals and the new `onceOnly` mappings all sync as bounded, set-once deltas; the coupling mappings write nothing; nothing grows with play time; and the section 6.9 counts (5 `heard_`, 1 reveal, 2 KO, 5 `onceOnly`, 1 item = 13 keys + 1 item) are right. Two things do not hold: the V5 fixture as specified is not green against today's tree, and V6 cannot see or price the one eventMapping `bark` line it claims to. Both are tooling defects with clear fixes; neither is a game or cheat defect.

## Blockers

None.

## Majors

### M1. The V5 fixture test is not green as specified: `item_dropped` is a listed name with no matching stem literal (section 4)

Evidence: section 4 lists `item_dropped` under "Names (match exactly, alone or before `:`)". The same section says the fixture "collects every string or template literal under `public/break_escape/js/` that begins with an office-life stem (`npc_`, `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`, `object_revealed`, `door_propped`)" and "also fails on an entry that no literal matches, so a phantom name cannot sit in the list." `item_dropped` is emitted as `item_dropped:${obj.objectId}` at `public/break_escape/js/systems/item-drop.js:515`, but it begins with `item_`, which is not an office-life stem, so the fixture never collects it. The "fails on an entry that no literal matches" rule therefore trips on the `item_dropped` entry.

Failure scenario: the fixture is run once against the tree before the pilot's stage 4 (section 4, "the source of truth"; section 13 step 2). As written it fails on `item_dropped`, so V5 cannot be committed with its own list intact, and the plan's assertion that the fixture is green against today's tree is wrong.

Fix: pick one. (a) Add `item_` to the fixture's stem-collection set so `item_dropped` is collected and matches its name entry. (b) Exempt `item_dropped` from the "entry with no literal matches" failure, with a comment that it is an `item_`-stem event the magnet lever reads. (c) Drop `item_dropped` from the name list and handle magnet/`interests` drops through the `magnet_` stems already listed, if those cover the required-task case. Option (a) is cleanest and keeps the list honest.

### M2. V6 cannot list, price or gate the one eventMapping `bark` clip it claims to (sections 4, 6.8, 10)

Evidence: section 4's V6 row says V6 "lists every chatter, exchange, call and bark clip per voice," and section 10's merge gate is "V6 (0 uncached office-life clips)." V6 "uses `TtsLineExtractor` with `chatter: true`" (section 4). The extractor builds its entries only from host ink lines, pretext outcomes, room-object voices and chatter pools (`app/services/break_escape/tts_line_extractor.rb:545-558`, `extract`); it never reads eventMapping `bark` fields, and its own header states "Barks and phone conversations are not voiced by the batch" (`tts_line_extractor.rb:13-14`). `TtsBatchProcessor` (stage 7 voicing) also drives off the extractor (`app/services/break_escape/tts_batch_processor.rb:159`), so the batch never pre-generates a bark either. Barks are voiced live through `TTSManager` at play time (`public/break_escape/js/systems/npc-barks.js:6,143-146`). Section 6.8 nonetheless counts the domestic's lanyard bark ("1 bark") among the "about 72 new clips," and rules 6 and section 2 name eventMapping `bark` fields as a first-class office-life speech source.

Failure scenario: the lanyard bark (`item_picked_up:id_badge`, `data.itemId === 'contractor_lanyard'`, domestic's voice) is a voiced office-life line. V6 does not count it, so stage 2 under-prices by one clip, and the merge gate's "0 uncached office-life clips" passes while that clip is still uncached. On first play on any keyed server it is generated live, which is exactly the stray-clip outcome section 10 is built to prevent. Any later mission that voices office-life lines through eventMapping barks hits the same gap at larger scale.

Fix: either (a) state in sections 4, 6.8 and 10 that eventMapping bark lines voice live and are out of V6's scope and the merge gate, and remove the bark from the pregeneratable clip budget; or (b) extend V6 with a separate scan of office-life eventMapping `bark` fields (per voice, deduped by cache key) and give the batch a path to pregenerate them. Pick (b) if the merge gate is to mean what it says.

## Minors

### m1. V5's `item_dropped` qualifier "only for an item with an interests tag" is not expressible in a name/prefix constant (section 4)

Evidence: `item_dropped:${obj.objectId}` is emitted for every dropped object with payload `{ itemId, tag, roomId, x, y, onTable }` (`item-drop.js:512-515`); the `interests` discrimination happens later at the magnet consumer (`npc-needs.js:5335`), not at the emit site. `OFFICE_LIFE_EVENT_PREFIXES` is a static list of names and prefixes, so V5 can only ask whether a required task's trigger event name is `item_dropped` (or `item_dropped:<id>`); it cannot know whether the dropped item carries an `interests` tag.

Failure scenario: a required task keyed on `item_dropped:<some_non_interest_item>` would be flagged as office-life (false positive), or the qualifier is quietly ignored and the "interests only" wording in the plan is misleading to the skill author.

Fix: drop the "only for an item with an interests tag" qualifier from the name constant and treat any `item_dropped` trigger on a required task as a V5 error (conservative, matches rule 1), or document that V5 does not inspect the item tag and the author must not gate required content on any `item_dropped`.

## Nits

### n1. The V5 fixture should scope to `*.js` and skip the committed `.bak` (section 4)

Evidence: `public/break_escape/js/systems/npc-behavior.js.bak` is committed in the tree and contains the stem literal `'npc_hostile_changed'`. The fixture is described as collecting literals "under `public/break_escape/js/`" with no file-type scope. Today the only stem literal in the `.bak` is an exclusion, so the fixture would still pass if it read the file.

Failure scenario: a future `.bak` (or a stale one after a rename) holds a stem literal not on any list, and the fixture fails on a file that is not live engine code.

Fix: scope the fixture's collection to `Dir.glob("public/break_escape/js/**/*.js")`, or delete `npc-behavior.js.bak` (move to `tmp/delete/` per house rule). State the `*.js` scope in section 4 so the implementer does not glob all files.

## Counts: B=0 M=2 m=1 n=1
