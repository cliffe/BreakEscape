# m08 office-life build review, round 1

B 0 / M 0 / m 4

Scope: worktree `.claude/worktrees/p-ol-m08`, branch plan/ol-m08 at a055c3d5f. Build commits 7daa0c633 (room tone), a0f709af1 (bark), 0b04703ad (BUILD_REPORT.md). Compared against office_life/PLAN.md (frozen after R5) and SPOKEN_LINES.md, with D76 and D83 b taken as settled.

## What I checked and found clean

### 1. Scenario diff against the plan

`git diff dc3bd7d60 a0f709af1 -- scenarios/m08_the_mole/scenario.json.erb` is 11 added lines in two hunks and nothing else: no removals, no other field touched. The main merge (a0f709af1..a055c3d5f) changes only BUILD_REPORT.md under scenarios/m08_the_mole/.

- roomToneTypes keys are room types, not ids. Every key matches a `"type"` in the scenario: room_hq_lobby (main_lobby, :618), room_hq_director (director_office, :1454), room_hq_ops (operations_floor, :1632), room_hq_intel (intel_analysis, :1769), room_hq_servers (server_room, :1896), room_hq_crypto (cryptography_lab, :2051), room_hq_break (break_room, :2335). room_hq_archives and room_hq_interview are left out, as the plan says. Profiles match PLAN.md section 2 row for row, and the rendered JSON holds exactly that map with `roomTone: true`. The profiles in public/break_escape/js/data/room-tones.json give quiet_office office_ambient 0.35, it office_ambient 0.8, server server_room_ventilation 0.6, kitchen kitchen_tone 1.0, all with empty spots. No m08 room authors an `ambientSound`, so step 1 of chooseAmbient never overrides a profile.
- The bark sits on background_analyst (:1707), whose room is operations_floor (the room block that opens at :1631 and ends before intel_analysis at :1768). Fields: `eventPattern "room_entered:operations_floor"`, `condition "!globalVars.analyst_ko"`, `onceOnly: true`, `delayMs: 3500`, `bark`. These are the planned fields. The text matches SPOKEN_LINES.md byte for byte and is plain ASCII (straight apostrophe). `analyst_ko` is the NPC's own `globalVarOnKO` and is declared false at :2815. The emitter is core/rooms.js:3236 (`room_entered:${detectedRoom}`); `!globalVars.x` is a supported form in safeEvaluateCondition (npc-manager.js negation branch); `onceOnly` maps to `config.once` (:1213), and the handler key is `background_analyst:room_entered:operations_floor:0` (:1262-1264), which is what the report saw.

### 2. BUILD_REPORT.md, measured or asserted

Tests 1, 2a, 2b, 2c, 3, 5 and 6 report raw readings (result lines, per-room key, level and step, read-back loop volumes, lastSlot deltas with a positive control and `ambienceSuppressed` ruled out). I re-ran the reproducible ones:

- Validator (`--office-summary --no-graph`): `Result: 0 errors (0 known), 4 warnings`; output identical to v1_summary_base.txt apart from the graph lines I suppressed; the single info line matches validator_info_lines.txt. background_analyst still reads `class=fights,attackable ... chatter=0 exchanges=0`.
- V6: `Total: 1 office-life clip(s), 1 uncached (58 characters uncached of 58)`, one Vindemiatrix en-GB clip for background_analyst, keyless boot warning seen. Matches the report.
- No engine file the proof relied on (core/rooms.js, npc-manager.js, npc-barks.js, office-room-tone.js, ambient-choice.js, room-tones.json, validate_npc_needs.rb) changed in the main merge, so the live proof still stands for HEAD.

Wrong-reason risks the plan named are closed: audio was confirmed loaded before any reading (test 3), quiet_office and it were told apart by level, not by `currentAmbient` (test 5), and the dwell's zero-spot result has its lastSlot control (test 6). The report uses only the per-room ids and no codes.

### 3. Bark: onceOnly key and sync

Evidenced by measurement: `exportTriggeredEvents()` held the key after firing; of 11 `/sync_state` PUTs the key appeared in exactly one (a triggeredEvents delta with that key and currentRoom only) and in no later PUT; after a reload, re-entering ops gave no `say` call and no toast. That meets PLAN.md section 4 (one bounded keyed delta, sent once). `ValidateOfficeLife.sync_budget` counts 0 office-life onceOnly mappings for m08 (cap 10): it does not class this story-NPC mapping as office life, which is harmless at one key.

### 4. Train-check exposure

- Validator over the scenario: 0 errors, same 4 warnings, no V2/V4/V5 lines (test/js/validator-office-life.test.mjs corpus test asserts no V5 errors on m08: holds).
- ERB render and JSON parse: clean (the validator's render_erb_to_json and a direct render both succeed).
- tts office_lines: 1 clip, 1 uncached. The train check does not gate on uncached clips; keyless `/tts` misses are allowed by train-smoke, and m08 is not one of the three smoke games.
- test/js/gnf-scenario-glyphs.test.mjs reads bark fields: the line is ASCII, so no glyph risk.
- test/unit/break_escape/tts_mission_lines_test.rb checks every m01-m10 bark through TtsLineResolver. Not run here (it needs the test database); the line prints no variable and has no speaker prefix, so I expect it to pass, but the train's Rails run is the first real check.
- Lab sheet: HacktivityLabSheets/_labs/safetynet/m08_the_mole.md never mentions the analyst's speech, ambient sound or silence (only the warning about knocking out bystanders, :93, :554). The report's "no walkthrough edit" line is right.

## Findings

### m1. Test 7: the N/S pass criterion names a code path this map cannot reach, and the evidence is summarised rather than shown

Evidence: PLAN.md section 5 item 7 makes `ambientChoice.keep` in the doorway the N/S pass criterion. updatePlayerRoom (core/rooms.js:3193-3214) sets `window.currentPlayerRoom` to `detectedRoom` including null, so a per-frame sampler of that variable would see a roomless strip if one existed: at 20 FPS a walk across a 64 px wall band would show several null frames. The report saw none in four crossings and eleven doorway stops, so on m08 the floor rectangles meet and `chooseAmbient` is never called with a null room. The keep branch is covered by test/js/room-tone.test.mjs:56-68.

Judgement: the plan's intent is met. What a player hears in a north or south doorway is the previous room's bed until the feet cross into the next room, then a 400 ms crossfade (or fade to silence for the archives) with no gap. That is the experience the keep branch exists to protect on maps that do have a roomless doorway; m08 just never needs it. The report is right to flag it rather than claim a pass.

Weakness: the Test 7 table gives prose ("no gap, no stop of the loop", "crossfades at the threshold") rather than the sampler's numbers, so a reader cannot check that a crossfade happened rather than a cut.

Fix (report only, plan stays frozen):
- In BUILD_REPORT.md Test 7, add per crossing: frames sampled, frames with `window.currentPlayerRoom === null` (0), and the `currentAmbient` and loop volume on the last frame before and the first few frames after the switch, which shows the 400 ms ramp.
- Reword the N/S verdict to: "Pass on intent. m08's N/S doorways have no roomless strip (0 null frames in N crossings), so `keep` cannot occur; the previous bed plays until the room switches, then crossfades. The keep branch is covered by test/js/room-tone.test.mjs:56-68."
- For future missions, the skill's door-listen line (mission-office-life, the line the plan cites as 217) could say: first check for a roomless doorway; if there is none, the N/S criterion is "no silence and a crossfade at the switch". That is a skill note for the orchestrator, not a change to this plan.

### m2. The 3.5 s bark delay is inferred, not measured

Evidence: the report says `say` fired "about 3.5 s after the room change", but the only measured interval is 6.1 s from before the entry call, which mixes walk time and a 2 s settle whose order relative to the room change is not stated.

Fix: give the interval between the sampler's room-switch frame (or the `room_entered:operations_floor` dispatch) and the `say` call, or quote the engine's `⏳ room_entered:operations_floor for background_analyst fires in 3500ms` console line with timestamps from the same run. If the run's console log is kept, this is a report edit, not a rerun.

### m3. The toast fallback is not evidenced in this build

Evidence: the report proves the bubble case only (player stayed). SPOKEN_LINES.md accepts that a player who leaves the ops floor within 3.5 s gets a toast instead, and that the onceOnly key is spent. Nothing in the build exercised that path. The engine route is unit-tested (test/js/ux-bark-bubbles.test.mjs:103-107, routeBark gives toast out of view), and _renderBark sends the line to TTS on both routes (npc-barks.js:449-466), so the risk is low.

Fix: either cite that test in the report's Bark section as the evidence for the fallback, or, if a live run happens anyway, cross the ops floor to another door inside 3.5 s on a fresh game and record the toast text and the key in the one PUT.

### m4. Plan test 8 (scripted critical-path regression) skipped without a recorded reason or decider

Evidence: BUILD_REPORT.md says "Test 8 ... was skipped this time, by instruction." PLAN.md section 5 item 8 lists it as a test, and the report does not say whose instruction or why the risk is covered.

Fix: name the decision (who, when) and the cover in one line, for example: "Skipped on the orchestrator's instruction: the lock and key diff is empty, the bark sets no global and runs no action, and the room-tone change has no gameplay effect." Or run it before the train. My reading is that the cover argument holds: the mapping is bark-only, waits behind open minigames (npc-manager.js:925-933) and cannot block Vector's or ATHENA's conversations.

### Nits (not counted)

- scenario.json.erb: the new `<%# Office life ... %>` comment above roomTone starts at column 0, where the lighting comment two lines up is indented two spaces. Cosmetic.
- SPOKEN_LINES.md Notes still read as planning text ("Add `"delayMs": 3500` ... so she usually says it") and quote the line a second time under the table. Could be trimmed to past tense, "delayMs 3500, so she usually...". Not worth a commit on its own.

## Verdict

Clean of blockers and majors. The scenario change is exactly what the plan and D76/D83 b ask for, and nothing else moved. The validator, V6 count, ERB render and lab-sheet claims reproduce. The report's results are measured, and the wrong-reason traps the plan named are closed. The four minors are report-evidence gaps (m1 to m3) and one undocumented skip (m4); all are fixed by editing BUILD_REPORT.md, with no scenario or engine change. Test 7's N/S case meets the plan's intent and should be recorded as "pass on intent, `keep` unreachable on this map". Ready to train once the report edits are in, or now if the orchestrator accepts the minors as report debt; the train's Rails run is the first execution of tts_mission_lines_test.rb against the new bark.

## Outcomes

- m1 to m4: recorded in BUILD_REPORT.md, "Notes after build review round 1".
- Nit: ERB comment indented. SPOKEN_LINES.md wording left as is.
