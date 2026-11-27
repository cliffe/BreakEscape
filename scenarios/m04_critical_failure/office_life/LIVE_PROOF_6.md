# m04 office life: live proof 6

Keyless server :3097, headless, 20 fps fixed step, a fresh game per run from `new-game.rb` through the scratchpad wrapper (no `--set`, no row edits, no globals set in the page, no `needs.set`). HEAD is bdef33347 (kettle `useFrom` dx 1.5). Scripts are `lp6_*.mjs` in the session scratchpad, not committed. Strikes use the real punch path (`window.playerCombat.attack`).

Summary: check 1 (R2 M1) PASS, no data fix needed. Check 2 (L8) PASS on a fresh game, with one finding: a second talk to either newcomer plays "(End of conversation - press ESC to exit)", not the line, so a player who chatted before trouble never hears the curt line. Check 3 (L6 vent case) NOT RUN.

## 1. R2 M1: the SCADA door against the kettle cells. PASS

**Door position (live sprite).** Ops office origin (0, 256). `door_side_sheet_32` for `scada_control_room`: centre (304, 336), 32 x 32, so the gap spans x 288 to 320, y 320 to 352. The south door (`door_32`, 48, 544) and the north door (48, 288) are elsewhere. R2's estimate (304, 336) was right.

**Distances to the cells.** Ibrahim's using cell reads 253.9 to 257.0 x, 372 y (body); Joanne's 214 to 225 x, 372 y. Door centre to Ibrahim 60 px (dx 48, dy 36); to Joanne about 90 px. The kettle strip (y 352 to 408) starts at the door's southern edge, so Ibrahim stands 20 px below the gap's lower edge and 33 px west of the wall's inner face (wall at x 288). Player arrival from the SCADA room is (297 to 300, 305), north of the gap's line, 67 px above Ibrahim's cell.

**Method (each run, fresh game).** Vance's card cloned in play, SCADA room by `enterRoom`, back by `enterRoom` (fires B2: both newcomers start walking at once, from their sofa and desk cells). The player then, with the pair walking and using: walked (`moveTo`) 150,385 then 280,385 (arrival leg), waited for Ibrahim `using`, walked 120,385 (west, past Ibrahim), 275,385 (east, back beside him), 296,340 (the door mouth), then `enterRoom` SCADA and back. Samples every 250 ms (player, both bodies, phases). Events filtered for stuck, reroute, job_failed, pair and use events.

| Game | min dist to Ibrahim / Joanne (px) | longest leg (s) | door leg end | SCADA there and back (s) | npc_use_started (Ibrahim, Joanne) | walk_stuck / job_failed / reroute | player stopped |
|---|---|---|---|---|---|---|---|
| 7992 | 18 / 74 | 1.4 | (279, 337) | 1.7 / 0.9 | 44.1, 49.7 (page clock) | none | no |
| 8003 | 26 / 79 | 1.4 | (301.5, 304.5) | 1.0 / 1.2 | 46.9, 53.7 | none | no |
| 8005 | 19 / 79 | 1.6 | (301.5, 312) | 1.1 / 0.9 | 46.3, 53.0 | none | no |
| 8008 | 18 / 74 | 1.4 | (301.5, 304.7) | 1.0 / 1.1 | 46.0, 51.5 | none | no |
| 8011 | 23 / 72 | 1.6 | (301.5, 311.8) | 1.3 / 0.9 | 44.4, 49.9 | none | no |

Five of five clean. Every `moveTo` returned `ok: true`; the same legs with no newcomer take 1.1 to 1.5 s west and 0.9 to 1.3 s east (arrival leg). Both newcomers reached `using` in all five (Ibrahim first, Joanne 5 to 7 s later, both y 372). Neither blocked the player, and the player never held a newcomer: Joanne arrived on her cell 35 px west of Ibrahim while the player stood at (279, 337) in 7992 (screenshot) with no event. The closest the player got to a user's body is 18 px, walking the strip past him (the strip is 56 px wide; the player's y clamps near 353 and the user stands at 372, a clear 19 px lane). SCADA there-and-back with both using took 1.0 to 1.7 s (a no-pair `enterRoom` took 0.9 s in the first probe on game 7984, which was reused for a script retry so it is not counted), so the door is not slowed in any practical sense. The door leg's end point differs by run (279,337 in 7992, about (301, 305 to 312) in the others) because the pathing target (296, 340) sits at the door's collider; no run stalled and none shows an NPC cause.

Screenshot `screenshots/lp6_c1_b_door.png` (game 7992): both newcomers at the kettle, the player at the door mouth beside them, the black door gap to the player's right. Three figures fit in the strip; the player can still turn into the door.

Verdict: the R2 M1 clearance is acceptable as built. No data fix recommended. If the user wants more room, the R2 fallback `useFrom { dx: 1.5, dy: 2.5 }` is available, but nothing measured needs it. Suggested wording for L4: add "no door lane of the machine's room".

## 2. L8: curt line after trouble and "past talking". PASS

Game 8025 (fresh; no talk before trouble). Reception at the start: Ibrahim and Joanne seated, guard in range.
- One swing at the guard (punch distance 27 px): guard hostile, `aes_staff_off` true. Neither newcomer hostile (checked straight after).
- Talk to Ibrahim (`moveToNear`, chat opens): "I'll keep to my work, if it's all the same to you." (the curt variant, not "Morning. I'm swapping the office desktops..."). Talk to Joanne: "I'd rather you kept your distance, love." Both are the `aes_staff_off` lines, one line each, 381 ms and 739 ms after the chat opened.
- Struck Joanne (hostile, one swing) and Ibrahim (hostile, one swing); E (the `interact` path) on each: toasts "She's past talking." and "He's past talking.", no chat opened, player HP 100 to 84 and to 56 or 60 (the hostiles hit back, as designed). Screenshots `screenshots/lp6_c2_past_joanne_pell.png` and `screenshots/lp6_c2_past_ibrahim_diallo.png`.

Finding F1 (data or engine, not fixed here): a talk that follows an earlier talk plays "(End of conversation - press ESC to exit)". Game 8027 (no trouble): first talk plays the first line, second talk to the same newcomer shows only the End line, both newcomers. Games 8019 and 8022 (first talk, then strike the guard, then talk): the curt line did not play, End did. Cause is the person-chat resuming the ended story, since `start` has no loop. The curt line therefore only reaches a player who has not talked to that newcomer before trouble. The L8 wording "after trouble, the curt line" holds only on a first talk. Possible fix: have the engine restart an ink story that ended with `#exit_conversation` on the next talk (check how other one-line NPCs behave first), or give each newcomer's `start` a loop back to itself. Not applied (the scenario is not edited in this pass).

## 3. L6 vent case. NOT RUN

`racks_vent` (scenario `delayMs` 840000) starts on `attack_mechanism_known`, which only comes from the mission's VM flag chain. With no `--set`, no global writes and no VM here, the route to it plus the 14 minute timer is well over 20 real minutes. The hide-on-next-entry mapping itself (`global_variable_changed:racks_vented` sets `aes_staff_off` and `aes_staff_evacuated`, scenario line 1551) is the same switch the phone evacuation proved in LIVE_PROOF_4.

## Games

Check 1: 7992, 8003, 8005, 8008, 8011 (7984 was used for the first script run and reused once; 7988 and 7991 crashed at a screenshot call, no data used). Check 2: 8025 (pass), 8019 and 8022 (curt line missed: talk before trouble), 8027 (no trouble, second talk), 8017 (first script version). Ids were each printed by the wrapper and matched to a new `tools/playtest/*-flags-game<id>.xml` before use.

## Bugs

None in the kettle cells. F1 above (second talk to a one-line newcomer plays only the End line).

## F1. Re-talk to a one-line newcomer. FIXED AND PROVEN

Cause (confirmed from code and a live console trace on game 8039, before the fix): `start` ended `#exit_conversation` then `-> DONE`. The chat closes as soon as the tagged line has been shown, and `saveNPCState` runs at that moment, so the saved story still has the `-> DONE` unread: `canContinue` is true, the saved state is a full story state (`restoreNPCState` returns `true`, not `'variables-only'`), and `person-chat-minigame.js` (about lines 530 to 556) takes the "Continuing previous conversation" branch instead of `restartAfterEnd`. The next `Continue()` runs into DONE, the engine logs "Story has ended" and shows "(End of conversation - press ESC to exit)". So the lead was right: the restart never fires because the saved state looks mid-knot. No engine change; the engine path is fine for stories that really end.

Fix: in `ink/m04_npc_ibrahim_diallo.ink` and `ink/m04_npc_joanne_pell.ink` the `start` knot now ends `#exit_conversation` then `-> start` (loop to itself) instead of `-> DONE`, with a comment. This is the house pattern (m03 exits divert back to the hub with `-> hub` after `#exit_conversation`). The unread divert is now a loop, so a re-talk continues into `start` and re-evaluates `aes_staff_off` with the freshly synced globals. The spoken words are unchanged. Ibrahim's three exchange knots are untouched (still `-> DONE`, played by the needs system, not through `start`), so no kettle re-check was needed. Recompiled by `validate_scenario.rb` (0 errors); `dialoguelint.mjs` reports no new finding on either file (its 1 line-len and 2 blank-reentry are in other files, unchanged). Commit `abcb3f683`.

Live proof, keyless server :3097, headless, loop at 20 fps with Phaser TimeStep `smoothStep=false`, `minFps=1` and the physics world `setFPS(20)` (fixed steps left on, `fixedStep` never touched), `/tts` aborted. Games created for this run: 8039 (cause trace, pre-fix), 8041 (case a), 8042 (cases b and c).

| Case | Game | Talk | Ibrahim | Joanne |
|---|---|---|---|---|
| a, no trouble | 8041 | 1st | "Morning. I'm swapping the office desktops while nobody needs them. It was booked late, so I won't be on tonight's list." | "Hiya, duck. I've a dozen inductions at six, so I came in early to set the room up. Don't mind me." |
| a, no trouble | 8041 | 2nd | same normal line | same normal line |
| b, talk, then one punch at the guard (`aes_staff_off` true, newcomers not hostile) | 8042 | 1st (before trouble) | normal line | normal line |
| b | 8042 | 2nd (after trouble) | "I'll keep to my work, if it's all the same to you." | "I'd rather you kept your distance, love." |
| c, reload (new page, same game, Resume chosen on the resume overlay), `aes_staff_off` still true | 8042 | 3rd | "I'll keep to my work, if it's all the same to you." | "I'd rather you kept your distance, love." |

Before the fix the 2nd talk in a and the 2nd talk in b showed only the End line (games 8027, 8019, 8022, 8039). No page errors in any run. Screenshots (each is the last talk of its case, so a is the 2nd talk, b the curt talk, c the post-reload curt talk): `screenshots/f1_a_ibrahim_diallo.png`, `f1_a_joanne_pell.png`, `f1_b_ibrahim_diallo.png`, `f1_b_joanne_pell.png`, `f1_c_ibrahim_diallo.png`, `f1_c_joanne_pell.png`.

Note on case c: a reload via the page needs the "Resume" button on the session overlay (the first attempt without it showed the title screen and no chat; that was the harness, not the game).
