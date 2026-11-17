# m01 office-life plan review, round 1

Counts: B 1, M 2, m 5

Reviewed: PLAN.md, ANALYSIS.md, BASELINE.md, SPOKEN_LINES.md, DIALOGUE_SAMPLE.md at 1efb3b9ef (worktree p-ol-m01). Engine paths are under `public/break_escape/js/` in that worktree. Stopped at the context limit; the "Not checked" list at the end says what is still open for round 2.

## B1. Desk PCs declared as `pc6` and `pc8` match no Tiled sprite (PLAN.md:58-81)

Evidence: the Tiled item pool is keyed by base type with trailing digits stripped (`core/rooms.js:186-192` extractBaseTypeFromImageName, indexed at `:229-241`). `findMatchFor` looks up `indexedItems[scenarioObj.type]` with the exact type (`:261-279`; `objType = scenarioObj.type` at about `:2254`). The key in room_office.json is `pc`, so `pc6` and `pc8` find nothing and fall to `createSpriteAtRandomPosition` (`:2502-2512`). With no `position`, each load draws a second PC at a random spot, the Tiled pc6/pc8 stay as unreserved decor, and the extras' `work` walks go to the random PC. This is the GO 7 trap the m03 R1 blocker hit. Every exact-digit precedent in the repo carries a `position` (test_npc_needs `pc3`, m03 `laptop1`). The claim "declared by its exact Tiled sprite type so it claims one existing sprite" is wrong, and tier 1 (the default) is built on it. The hedge at :81 ("if the exact sprite types turn out to differ") does not name the fix.

Fix: declare both as `"type": "pc"` with no `position`. A `pc` claims the first unreserved `pc` in table_items layer order, which in room_office.json is pc8 (6.62, 4.08), then pc6 (2.25, 5.62), then pc11 (2.41, 4.14). So declare `graham_pc` first and `fatima_pc` second, and note in the ERB comment that the order decides the claim. With presets off, `pc` takes no preset. Keep the MR 2 double-load check and make it assert one sprite per PC position and no PC anywhere else.

## M1. `leash: true` is in the wrong block, and there is no `chaseRange` (PLAN.md:99-104, :118)

Evidence: the engine reads `config.hostile?.leash` and `config.hostile?.chaseRange` (`systems/npc-behavior.js:667-668`, used at `:1056-1060`). m01's Sarah puts `leash` inside `hostile` (scenario.json.erb:601-607). The plan puts `"leash": true` directly under `behavior`, where nothing reads it, so the extras are unleashed. SK 97 asks for hostile ambient staff to get `leash: true` with `chaseRange`. The cower style keeps a fleeing NPC in its room (`npc-behavior.js:2801-2835`), which lowers the risk, but the field is dead config and the rule is not met.

Fix: `"hostile": { "fightStyle": "cower", ..., "leash": true, "chaseRange": <px> }` and remove the stray `behavior.leash`. Name a starting `chaseRange` (for example 160 px, five tiles) and tune it in the build. Test 10 should check that a hostile extra does not follow the player out of the main office.

## M2. Tier 2 cooler puts `offWhen` inside `affordance` (PLAN.md:180, :185)

Evidence: format 1 moved `offWhen` to the object (`lib/break_escape/format_upgrade.rb:42`, `:247`; schema object `offWhen` at `scripts/scenario-schema.json:5480`, "was affordance.offWhen"). The validator's retired-key check (`scripts/validate_scenario.rb:260-301`) reports `affordance.offWhen`, and the needs world reads the object-level key (`systems/npc-needs.js:830-837`). The plan says the form "follows the preset values the cooler preset uses", but the cooler preset has no `offWhen` (`data/office-presets.json`, `cooler`).

Fix: put `"offWhen": "m01_staff_alarmed"` at object level, declared false in globalVariables (`validate_npc_needs.rb:445-462` errors otherwise). With presets off the hand-written affordance also loses the preset's `"useSound": "drink_gulp"`, so add it. The rest of the cooler is sound: an object with its own `position` and no Tiled match is placed at that position (`core/rooms.js:2502-2509`), as test_needs_leash does (`scenarios/test_needs_leash/scenario.json.erb:95-101`).

## m1. "Other rooms stay unmapped" is not what happens (PLAN.md:51)

Evidence: `profileIdFor` falls back to the table's type map when `roomToneTypes` has no entry (`systems/office-room-tone.js:42-47`). `data/room-tones.json` maps `room_it` to `it` (office_ambient bed at 0.8, typing on), `room_meeting` to `meeting` (no bed) and `room_servers` to `server`. So Kevin's IT room and the conference room get stock profiles. The other cites are right: `roomToneTypes` is keyed by room type (`:50-51`), only `deskPhone: true` suppresses `distant_phone` (`:105-113`), and the `it` profile has no spots.

Fix: say which stock profiles the unmapped rooms take (IT room `it`, conference `meeting`, server room's own `ambientSound` wins). Add the IT room to test 5, or map `room_it` to `quiet_office` if an office bed in Kevin's room is unwanted.

## m2. Sync budget leaves out npcVisibility and npcHostility (PLAN.md:227-233)

Evidence: `setVisible` writes `npcManager._npcVisibility`, which is saved as `npcVisibility` and restored on register (`state-sync.js:548-550`; `systems/npc-manager.js:2205-2237`). A KO or attack goes into `npcHostility` (`state-sync.js:552-554`). Both grow by at most two keys (one per extra) and are bounded, but section 6 says "No player_state growth".

Fix: list them in section 6 (npcVisibility 2 keys, npcHostility up to 2). Also record that the evening hide survives a reload through npcVisibility, so the room-entry re-hides are a second guard and not the main one. Test 9's reload step should confirm both are hidden before any re-hide fires.

## m3. Chair-to-PC pairing is not shown (PLAN.md:58, :92, :118)

Evidence: room_office.json places Fatima's chair (chair-white-2-rotate6, 0.87, 5.41) between the two west desks. pc6 (2.25, 5.62) sits on the south desk; pc11 (2.41, 4.14) and laptop6 sit on the north desk. Graham's chair (6.81, 5.39) sits between the east desks, and pc8 (6.62, 4.08) is on the north one. A `work` use defaults to the `fetch` seat (`systems/seating.js:2103-2115`), so the NPC may pull whichever chair is nearest the use cell. The NPC `position` is set on the chair, not on the PC's use cell.

Fix: give each PC a `useFrom` aimed at the intended chair's body-centre cell (HOME_EPS 12 px, SK 112) and record the measured seat in the build. If the render shows Fatima's chair belongs to the north desk, use pc11 and adjust the claim order in B1.

## m4. The critical-path recycling bin sits at Graham's desk row (ANALYSIS.md:84, PLAN.md test 13)

Evidence: the Office Recycling Bin (scenario.json.erb:1312-1331, `type: "bin"`, no position) claims the first Tiled `bin` in the items layer, bin11 at (8.42, 4.77). That is at the east end of the north-east desk, about 1.6 tiles from Graham's chair. It holds the IT-room clue. The extras do not block it on paper, but nothing measures the approach with Graham seated or fetching a chair.

Fix: add to test 7 or 13: with Graham seated and mid-`work`, walk to the bin, open it and read the checklist. Confirm his use cell and any fetched chair stay off the bin's approach cells. Do the same for the filing cabinet (5.49, 0.72) against the tier 2 cooler queue.

## m5. Test 9 does not say how to reach `entropy_reveal_read` on a keyless server (PLAN.md:254)

Evidence: the global turns in the server-room archive safe's `onPickup` (scenario.json.erb:2205). That point sits past the RFID door, the VM flags and the decrypt step. The plan forbids setting globals in the page (correctly), but does not say how the run gets there.

Fix: name the route: seed the VM flags through `new-game.rb` FLAGS_XML with `session-start.sh --flags` (the method used for VM playtests here), then play the real path to the safe on port 3094, keyless. Run the reload half on the same game.

## Checked and sound

- Typing needs a `work` need in its `using` phase (`systems/seating.js:1192-1196`; typists published at `:2338-2340`, read at `office-room-tone.js:136`). Correct.
- officePresets off: an object's own affordance is used as written (`systems/office-presets.js:66-69`, `:85-87`), and presets on would match `pc` and `pc3` objects to `desk_pc`. Correct.
- The swivel chair families at `seating.js:133-140` include chair-white-2-rotate. Correct.
- `setVisible` is a valid mapping key (schema :5075; `npc-manager.js:1245`, `:1656-1660`).
- Shared map: the plan edits no Tiled file. Every addition is scenario data, and the cooler is a positioned scenario object.
- Secrets: no new object, line or observation carries a PIN, password, code, key or flag. The observations are flavour only.
- Spoken lines: the pool barks are 31 to 39 characters. Tier 1 barks are 37 and 33 (one-off barks, under 40 anyway). No line names a plot person or place. Vindemiatrix and Umbriel are not among m01's voices (Algenib, Aoede, Kore, Charon, Leda, Algieba).
- KO globals, HaX texts appended at the end of agent_0x99's mappings, and credits lines follow the Maya pattern (scenario.json.erb:701-715). Credits wording names no place.
- Story NPCs do not move and none gains needs.

## Not checked (for round 2)

- The PERSONNEL credits block's condition form (:133-145) against the two new lines.
- Ink for the step-0 proof: whether a one-knot ink with `#exit_conversation` alone passes the validator's person-NPC rules.
- Whether the Fatima bark at 2 s and HaX's ring at 6 s leave a 4 s gap (GO 66), and whether a bark on screen during the ring is acceptable.
- The tier 2 cooler at (8.5, 2) against the north-east hallway door gap (door geometry from `systems/doors.js:328`), and the `useFrom` cell (8.5, 3).
- The awareness-cast art (seated and pose frames) and the voice register against VOICE_CAST.md.

## Outcomes

Fixes applied in PLAN.md (and one line in DIALOGUE_SAMPLE.md). Open items checked against the files. No server, db task or SecGen file was touched.

Findings

- B1 fixed: both desk PCs are now `"type": "pc"` with no `position`, `graham_pc` declared first (claims pc8, east) and `fatima_pc` second (claims pc6, west). Section 4.2 explains the claim order, the ERB comment carries it, and the MR 2 double-load check now asserts one sprite per PC position and no `pc` elsewhere.
- M1 fixed: `leash: true` and `chaseRange: 160` moved inside `behavior.hostile` for both extras; the stray `behavior.leash` is gone. Test 10 now checks a hostile extra does not follow the player out of the main office.
- M2 fixed: the cooler's `offWhen` is at object level, `m01_staff_alarmed` is noted as needing a false declaration, and `"useSound": "drink_gulp"` is written by hand.
- m1 fixed: section 4.1 lists what each unmapped room plays under the stock table. IT room `it` (bed 0.8, no spots), conference `meeting` (no bed), server room's own `ambientSound` wins, closet, halls and small offices have no tone. Only `office` and `reception` carry spots and both are mapped, so no phone-clue room needed re-mapping; the IT room stays on stock `it`, with test 5 covering it.
- m2 fixed: section 6 now lists `npcVisibility` (2 keys) and `npcHostility` (up to 2), and says the evening hide survives a reload through `npcVisibility`. Test 9's reload step checks both are hidden before any re-hide fires.
- m3 fixed: each PC has a `useFrom` toward its chair (Graham dy 1.3, Fatima dx -1.4, dy -0.2, tile offsets, tuned in the build to 12 px), with a render check in 4.2 and test 7 and a spare-`pc` fallback if Fatima's chair belongs to pc11.
- m4 fixed: test 7 now opens the recycling bin with Graham seated and mid-`work` and repeats for the filing cabinet against the cooler queue.
- m5 fixed: test 9 names the route: seed VM flags through `tools/playtest/new-game.rb` FLAGS_XML and `session-start.sh --flags`, play the real path on port 3094 keyless, reload on the same game.

Open items

- Credits condition form: confirmed. The block uses `{ "text", "style": "entry", "condition": "globalVars.<name>" }`; the two new lines are written in exactly that form in 4.7. The existing lines put a long dash in their text; the new ones use a comma.
- One-knot brush-off ink: the validator accepts it. It only compiles the ink and runs the advisory dialogue lint, and has no knot-count, hub or choices check for a person NPC's storyPath. Evidence: m03 validated read-only (0 errors, 12 warnings, no ink complaint, the working tree stayed clean); a scratch one-knot ink with one `+` choice and `#exit_conversation` compiled and linted clean. The m03 extras are three-knot hubs, so there is no one-knot precedent: whether the engine copes stays a step 0 live proof, and step 0 now has the ink shape written out with the `-> start` root divert.
- Gap between Fatima's bark and HaX's ring: 4 s start to start. The toast stays up 5.1 s (7 words), so it is still showing at the ring, which is fine because the ring hold only defers barks that arrive during the call. A voiced clip of about 2.5 s ends about 1.5 s before the ring; if the build measures over 3.5 s, `delayMs` drops to 1000. Recorded in 4.4.
- Cooler position: failed, plan fixed. The doors layer and `placeNorthDoorsMultiple` put the north-east door in column 8 (x 8.5, y 1), so (8.5, 2) sat directly in front of it and crowded the east door at (9.5, 2.5). Moved to (5.4, 8.2), against the south wall, `useFrom` dy -1, free on the occupancy map of tables, chairs and items. The render must still confirm it and the aisle width, and the south door's x (expected 1.5 or 8.5 by the snapping rule, not read from the layout).
- Cast atlases and voices: pass. `fatima_begum.json` and `graham_whitfield.json` each have `sit`, `pose_use`, `pose_drink` and `pose_phone` frames in all eight directions. VOICE_CAST.md has Fatima on Vindemiatrix (friendly, organised, Yorkshire) and Graham on Umbriel (unhurried, kind, Halifax), which fit a brisk brush-off and a dry one. The cast files name other employers (Tarrowby, Brightwell); the m01 lines name no company, so no clash.
