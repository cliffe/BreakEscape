# m08 The Mole: office-life build report

Built from PLAN.md section 2 with Q5 b (D83): room tone in seven rooms plus one once-only bark. Commits: `7daa0c633` (room tone), `a0f709af1` (bark, not voiced). The bark was first built as Q5 a (room tone only), tests 1 and 2 were run on that, then the bark was added and tests 1 and 2 re-run.

## Changes

- `scenario.json.erb`: `"roomTone": true` and `roomToneTypes` (room_hq_lobby, room_hq_director, room_hq_intel to quiet_office; room_hq_ops, room_hq_crypto to it; room_hq_servers to server; room_hq_break to kitchen). Archives and interrogation suite are unmapped, so silent.
- `scenario.json.erb`: one eventMapping on `background_analyst`: `room_entered:operations_floor`, `!globalVars.analyst_ko`, `onceOnly`, `delayMs` 3500, bark "Nobody's said a word on this floor for an hour. I counted."
- `SPOKEN_LINES.md`: bark moved into the main list, "None planned" line replaced.
- No engine code touched. The line is not voiced.

## Tests

Test 8 (scripted critical-path run) was skipped this time, by instruction. Test 9 (the listen check) is left for the user.

| # | Test | Command | Result |
|---|---|---|---|
| 1 | Validator | `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb --office-summary` | Pass, run before and after the bark. `Result: 0 errors (0 known), 4 warnings`, the same four. Info lines identical to `validator_info_lines.txt`. roomToneTypes accepted, no new info or warning line. |
| 2a | Lock and key diff | `ruby scripts/lock_key_diff.rb scenarios/m08_the_mole/scenario.json.erb scenarios/m08_the_mole/office_life/baseline_locks.json` | Pass. `lock and key diff: empty` (both runs). |
| 2b | V1 summary | same validator run, tail diffed against `v1_summary_base.txt` | Pass. No difference, 84 lines both. A bark adds no field to the summary (chatter and exchanges stay 0). |
| 2c | V6 clips | `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m08_the_mole]"` | Pass. Room tone only: `Total: 0 office-life clip(s), 0 uncached`. With the bark: `Vindemiatrix en-GB ... [background_analyst]: 1 clip(s), 1 uncached, 58 characters` and `Total: 1 office-life clip(s), 1 uncached (58 characters uncached of 58)`. Boot warning showed no key. |
| 3 | Audio loaded | headless Chromium, `--autoplay-policy=no-user-gesture-required`, setFPS(20), `fixedStep` true (read back) | Pass. `soundManager.sounds` held office_ambient, kitchen_tone, server_room_ventilation and typing_loop before any reading. |
| 5 | Nine rooms | game 6885, `__test.enterRoom`, 2 s settle, read `ambientChoice`, `currentAmbient`, `officeRoomTone.log` | Pass, table below. One reload also done (below). |
| 6 | Dwell 62 s | same game, `officeRoomTone.lastSlot` read at the start and end | Pass, table below. |
| 7 | Door listen | per-frame sampler on the scene postupdate, four pairs | Pass on crossfades; the "doorway keeps the bed" case could not be observed (below). |

Server: keyless, port 3091 only, boot warning seen, puma PID 641331, killed by that PID, port confirmed free. Games created with `tools/playtest/new-game.rb`: 6867 and 6871 (route exploration, discarded) and 6885 (the proof game). No game row edited. Locked doors were opened through the real interaction path: the lobby printer PIN gave the server-zone badge and the badge opened the server door; the archives password minigame took the archives password; the interrogation PIN pad took the suite code. The suite code and password were typed from the playtest docs, not earned by walking the clue route, so those three opens are assisted shortcuts. They do not affect room tone.

### Test 5: per-room key and level

| Room | Profile | currentAmbient | key and level (ambientChoice) | started entry | Expected |
|---|---|---|---|---|---|
| main_lobby | quiet_office | office_ambient | office_ambient 0.35, step 2 | yes | match |
| operations_floor | it | office_ambient | office_ambient 0.8, step 2 | yes | match |
| intel_analysis | quiet_office | office_ambient | office_ambient 0.35, step 2 | yes | match |
| director_office | quiet_office | office_ambient | office_ambient 0.35, step 2 | yes | match |
| cryptography_lab | it | office_ambient | office_ambient 0.8, step 2 | yes | match |
| break_room | kitchen | kitchen_tone | kitchen_tone 1.0, step 2 | yes | match |
| server_room | server | server_room_ventilation | server_room_ventilation 0.6, step 2 | yes | match |
| security_archives | unmapped | null | key null, step 4 (silence) | none | match |
| interrogation_room | unmapped | null | key null, step 4 (silence) | none | match |

Sound volume read back from the playing loop: 0.175 at level 0.35, 0.4 at 0.8, 0.5 for the kitchen at 1.0, 0.3 for the server room at 0.6.

Reload: the player respawns in the lobby, the table loads, `started` fires again for main_lobby at office_ambient 0.35, `fixedStep` still true.

### Test 6: dwell

| Room | Seconds | Needs clock (s) | lastSlot start to end | Delta | `spot` entries | `typing` entries with count > 0 |
|---|---|---|---|---|---|---|
| main_lobby | 62 | 65.5 | 0 to 3 | 3 | 0 | 0 |
| operations_floor | 62 | 65.3 | 4 to 7 | 3 | 0 | 0 |
| intel_analysis | 62 | 65.5 | 7 to 10 | 3 | 0 | 0 |
| director_office | 62 | 65.5 | 11 to 14 | 3 | 0 | 0 |
| cryptography_lab | 62 | 65.3 | 15 to 18 | 3 | 0 | 0 |
| break_room | 62 | 65.5 | 18 to 21 | 3 | 0 | 0 |
| server_room | 62 | 65.3 | 0 to 4 | 4 | 0 | 0 |

The control (delta of at least 2) held in every room, `ambienceSuppressed` was false, so the zero-spot result is not a stalled clock. The server room dwell ran in a second pass of the same game after a page load, which is why its lastSlot restarts at 0. (The first pass reached the server room too late to dwell: its badge step needed a longer wait for the printer's container, fixed in the second script. No tone behaviour was involved.)

### Test 7: door listen

Sampled every frame. In all four pairs the room changes straight from the previous room to the next with no frame where `currentPlayerRoom` is null, so the "doorway keeps the bed" branch (`ambientChoice.keep`) never occurs in this layout: moveTo targets inside the doorway ended either still in the previous room or already in the next. I tried six stops along the north doorway and five along the south; none left the player roomless.

| Pair | Direction | Sequence seen | Result |
|---|---|---|---|
| operations_floor to intel_analysis | north | office_ambient 0.8 to office_ambient 0.35, no gap, no stop of the loop | bed carries until the feet cross, then the level changes |
| operations_floor to security_archives | south | office_ambient 0.8 to key null (silence) | bed carries until the feet cross, then fades out |
| operations_floor to server_room | east | office_ambient 0.8 to server_room_ventilation 0.6 | crossfades at the threshold |
| cryptography_lab to break_room | west | office_ambient 0.8 to kitchen_tone 1.0 | crossfades at the threshold |

So E/W pass as planned. For N/S the effective behaviour is the intended one (previous bed continues until entry, then changes), but it is not the `keep` code path the plan named. Flag for the reviewer: the plan's wording expects an observable `keep` in the doorway, and this map does not produce one.

### Bark (Q5 b)

Game 6885, first entry to the operations floor, player stayed:

- `npcWorldBubbles.say` called once for `background_analyst` with the exact line, about 3.5 s after the room change (the measured gap from just before the entry call was 6.1 s, which includes a 2 s settle and the walk). `showsBubble('background_analyst')` was true while the player stayed, so it played as a bubble, not a toast. No toast text appeared in the page.
- `exportTriggeredEvents()` held `background_analyst:room_entered:operations_floor:0` after it fired.
- Sync: 11 PUTs to `/sync_state` across the run, including after the reload. The key appeared in exactly one (the second, a `triggeredEvents` delta carrying only that key and `currentRoom`). Later PUTs carried no `triggeredEvents` section at all (keys null), so it is not re-sent. The first PUT carried the briefing cutscene key only.
- After the reload, going to the operations floor again: no `say` call, no toast, and the key still present in the client's triggered events. It fires once.
- V6 reads 1 clip, 1 uncached. Not voiced.

## Odd findings

- The dwell script reported `roomAtEnd` for server_room as operations_floor in the first pass (the room was never entered); the second pass fixed it. Counts above are from the passes that were in the right room.
- Page-side sampling needed `window.officeRoomTone.scene` for the frame hook; `window.game.scene.getScenes` does not exist on this wrapper.

## Lab sheet line

Room tone changes nothing a student does: no lock, key, clue, NPC position or objective changed, the lock and key diff is empty, and the sound only varies by room. The bark holds no clue or suspect name and plays once; the m08 walkthrough needs no edit.

## Notes after build review round 1

- Test 7, north/south doorways: pass on intent. m08's N/S doorways have no roomless strip: `window.currentPlayerRoom` was never null in the N/S crossings or the eleven doorway stops (six north, five south), so `ambientChoice.keep` cannot occur on this map. The previous bed plays until the room switches, then crossfades. The `keep` branch itself is covered by test/js/room-tone.test.mjs:56-68.
- Bark delay: "about 3.5 s" is the configured `delayMs` (3500); the measured 6.1 s gap included the walk and settle, so it is not a precise timing measurement.
- Toast fallback (player leaves the ops floor within 3.5 s): not tested live on m08; the engine path is covered by test/js/ux-bark-bubbles.test.mjs:103-129 (routing, then the toast text).
- Plan test 8 (scripted critical-path run): skipped by the orchestrator. Reason: the build adds room tone and one once-only bark, neither of which can block or change any lock, item or conversation; the lock/key diff is empty. The train's Rails run checks the bark line (tts_mission_lines_test.rb).
