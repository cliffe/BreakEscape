# m01 office life: build review R1

Base: `git diff main...HEAD` on `plan/ol-m01` at 3591712d5. Read: PLAN.md, SPOKEN_LINES.md, BUILD_REPORT.md, tmp/handover/M01_BUILD_HANDOVER.md, the scenario and ink diffs, three screenshots. No server, no live checks.

Counts: B 0, M 0, m 3, n 7.

This round stopped early at the context limit, so the checks listed under "Not done in R1" carry over to R2.

## Checks run

- Validator: 0 errors, 26 warnings. The office-life ones: V4 for Fatima, Graham and Maya (see n5), Maya's cooler in another room and behind a locked door (both expected for her leash), and Fatima's bark and break sharing `room_entered:main_office_area` (expected: the bark is onceOnly, the break has a cooldown). V8: heard_ 2/8, onceOnly 1/10, small keys 3/64.
- Lock and key diff against `baseline_locks.json`: empty.
- `node scripts/ink_runtime_check/maya_routes.js`: all route checks pass.
- `bin/test-js`: still running when this round ended; the last lines seen were PASS. R2 should read the full result.
- Cheat resistance: no lock, key, PIN or item moved; the PC and cooler observations carry no secret; the new objects have no `lockType`, no contents and no `onPickup`.
- Spoken lines: pools, exchange knots and barks are all scenario data (NPC JSON or ink). The two HaX attacked texts are unvoiced timed messages, as for Maya's.
- Sync: every new global is a declared boolean. `maya_away` writes only on a change (conditions on all three mappings, `cooldown: 0`), and `maya_settled` changes at topic boundaries, so both go as deltas and neither grows. The new onceOnly mappings add a fixed number of `triggeredEvents` keys (11 at most, plan section 6); the `maya_away` mappings and the two breaks are not onceOnly and add none. The `npcVisibility` and `npcHostility` keys are at most one per extra.
- TTS key reuse for `not_here`: same text and `#delivery: low and wary` as the opener at `m01_npc_maya.ink:29`, and the handover says the key reproduces against the cached clip (M01_BUILD_HANDOVER.md:49).
- Exchanges heard once: `heard_ex_interns` and `heard_ex_biscuits` are declared false; BUILD_REPORT.md:56 shows each one heard once and not heard again after a reload.

## Rulings on the known items

1. **Graham's `_seat` truthy at the cooler**: this is a real sit, not a leftover desk seat. See m1.
2. **Maya parks with `no_source` until the main office loads**: n1. The only way to reach her office runs through the main office (main office north door to hallway_east), so the room has loaded before any first talk. She would park only in a start-room test or a debug head start (`--start-room maya_office`). No fix needed. Add a sentence to PLAN.md section 11 so a later reviewer does not raise it again.
3. **Standing NPCs stopping up to a tile short (npc-behavior.js:1402-1416)**: n2. That 32 px end belongs to scripted walks (`patrolOverride`, `moveToTile`). No needs NPC here has one; needs walks end on the needs approach cell. The measured cooler cells are (5.65, 7.82) against the planned (5.78, 7.93), 4 px off, and the seats are 0 px off (BUILD_REPORT.md:9, :15). Not visible in m01.
4. **Derek in the break room in the regression run**: withdrawn as an office-life finding. Derek is declared in the break room (`scenario.json.erb:1561`, PLAN.md:349 "break room") and gained no needs-layer key in this build. This is baseline behaviour. Any mismatch is in the walkthrough text and belongs to the m01 walkthrough, not to this build.
5. **V6 clip count**: confirmed. The office-life clips are 2 barks, 8 pool lines and 8 exchange lines, 18 in all. Adding the 4 ordinary talk lines in the two brush-off knots gives 22 for the mission (BUILD_REPORT.md:98-104; PLAN.md:371, :381 agree). The stale 22 in the handover is n3.
6. **KO of Maya before her first talk**: n4. It is low risk. Her break condition has `!globalVars.maya_ko` (`scenario.json.erb:2086`), a KO'd needs NPC stays where it fell (npc-needs.js:1235-1239), and before the first talk her thirst sits at 100 with decay 0.1/min, so the needs layer never starts a trip. The KO lands in her own office, as in the base game. Add it to the R2 live list as a single quick check: punch her before talking, KO her, confirm no trip and no console error. It does not block.

## Findings

### m1. Graham sits in a desk chair beside the cooler
`scenario.json.erb:1386-1390` (office_cooler affordance). The cooler has no `seat` key, so `seatPreference` returns `near` for a non-work object (`seating.js:2104-2116`). Graham's beside cell (6.87, 7.64) is within `NEAR_CHAIR` (36 px) of chair 155's foot point, so he sits down on it while he drinks and chats. You can see it in `screenshots/cooler-in-use.png`: he sits at the cooler while Fatima stands. Fatima's cell has no chair in range, which is why only Graham's `_seat` is truthy. The look is odd: one person standing at a cooler and one sitting in someone else's swivel chair. That chair also belongs to a desk.
Fix: add `"seat": "stand"` to the office_cooler affordance. Re-measure Graham's beside cell and check chair 155 is no longer reserved while he uses the cooler.

### m2. Fatima may face away from the cooler while drinking
BUILD_REPORT.md:15 records "pose_drink facing up" at (5.65, 7.82). The cooler sits south of that cell (sprite centre (5.78, 8.93)), and PLAN.md:213 expects her to face south with the cooler between her and the camera. In `screenshots/cooler-in-use.png` she shows her back to the camera, so she is facing north, away from the cooler. Either the report's wording or the facing is wrong.
Fix: render her at the cooler and read her facing from the sprite frame. If she faces north, give the cooler `useFrom` a small `dx` so the face point resolves south, or check how the drink pose picks its direction. Then record the measured facing in BUILD_REPORT.md.

### m3. "Not here" closes with no reply from Maya
`m01_npc_maya.ink:40-42`. The player's line shows as a bubble and the chat closes with no answer from her (dialoguelint `exit-no-reply`). The plan accepts this because it adds no new voiced line. Still, the player reads their own words and then the chat closes on them. When she is back at her desk the resume goes into the hub with no line first (the saved position sits just after the exit tag, before `-> hub`), which reads well.
Fix: keep it for this build (it needs no clip). Record it as an accepted lint warning in BUILD_LOG or PLAN section 11. If a reply is wanted later, reuse an existing cached Maya line word for word rather than adding one.

### n1. Maya's `no_source` park
Covered in item 2 above. Fix: one sentence in PLAN.md section 11.

### n2. One-tile-short stop
Covered in item 3 above. No change.

### n3. Stale clip count in the handover
`tmp/handover/M01_BUILD_HANDOVER.md:15` and `:40` still say "expected 22" for V6. Fix: change both to "18 (22 with the 4 talk lines)".

### n4. KO before the first talk not tested
Covered in item 6 above. Fix: one live check in R2.

### n5. V4 warnings after the attack probe passed
`scripts/validate_office_life.rb:42` keeps `E1_PROBE_PASSED = false`, a global constant shared by every mission, so the three V4 warnings stay for m01 even though BUILD_REPORT.md:44-49 and route d pass. Fix: none in this build. Note in the log that V4 is cleared by the probe results, not by the validator.

### n6. The validator's needs timing line names the wrong PC for Fatima
Validator info line: "fatima_begum.work ... via 'graham_pc'". The live runs show her using her own PC (BUILD_REPORT.md:9; her `needsHome` is `fatima_pc`, and a post object that satisfies a need is picked first). This is a validator display quirk (it takes the first matching source). Fix: none here. Mention it in the log so nobody reads it as a desk swap.

### n7. HaX's Graham text trips the "not X, but Y" lint
`scenario.json.erb:1164`: "That's an accountant, Agent. Not a target. Stand down." It is unvoiced and short, and the lint is advisory. Fix (optional): "That's an accountant, Agent. Stand down." Leave the Fatima text as it is.

## Not done in R1 (carry to R2)

- The full `bin/test-js` result.
- The positions diff against `positions_base.txt` (measurement-recipes section 9) and the `--office-summary` diff against `v1_summary_base.txt`.
- Read the reopen path in `person-chat-reopen.js` for the case where she is away and the story was saved at the hub exit line (`m01_npc_maya.ink:173-175`). Confirm the Derek line at :174 is not re-displayed above `not_here`. The route script covers it in ink, but the engine's re-display (PLAN.md:280) has not been read against this case.
- Check that the plan's `room_entered` hide on `it_room` never fires in view (the render check named in PLAN.md:151).
