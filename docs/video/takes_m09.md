# m09 trailer takes (23 Nov, scripts only)

Scripts written and `node --check`ed, none run (no server, game, browser or capture used). Picks: `docs/video/edits/M09_TRAILER60_PICKS.md`. Run line for all: `MISSION=m09 .../run.sh <avatar> <take> "<flags>" "<record flags>"`. No PIN, password, code or flag value is in any file; no keypad is typed in these takes, so there is no digit check to run.

Older scripts `t01`..`t08` (`_live.mjs` and the live-mode keyed takes from 20 Nov) are superseded for the trailer (they film the VM approach, the Nightshade file, the identity scene, the final call and the ending, which the picks leave out) and kept untouched.

| id | what | avatar | entry flags | status |
|---|---|---|---|---|
| t10_hook_briefing | Netherton hook line, whole (9.10 s) | n/a | `--imports=none` | script written, not yet run |
| t11_team_faces | four Citadel portraits (Anchor, Malhotra, Arakawa, Lantern) | n/a | `--imports=none` | script written, not yet run |
| t12_noor_cover | Noor "We're closed..." (3.89 s) | ngozi_adeyemi | `--imports=none --start-room front_desk --unlock front_desk --set briefing_played=true` | script written, not yet run |
| t13_wipe_running | console WIPE IN PROGRESS then Jesse "Paper..." (4.25 s) | daniel_seo | `--imports=none --start-room server_closet --set briefing_played=true` | script written, not yet run |
| t14_wipe_halted | console WIPE HALTED, Jesse hidden | lucia_moreno | same plus `--set tran_outcome=talked` | script written, not yet run |
| t15_vigenere_chart | Shelf Marks chart (blurred) then salvage password screen (hint only) | harjit_singh | `--imports=none --start-room tape_room --unlock tape_room --set briefing_played=true` | script written, not yet run |
| t16_cyberchef_vigenere | CyberChef Vigenere Decode on a textbook example | mei_lin_chow | `--imports=none --start-room reading_room --set briefing_played=true` | script written, not yet run |
| t17_dillard_stacks | dark open_stacks, lights strike, Dillard line, chase hold | vivian_ashby | `--imports=none --start-room loading_dock --set briefing_played=true` | script written, not yet run |
| t18_sorensen_ending | Sorensen ending line, whole (10.01 s) | mei_lin_chow (vary) | `--imports=none --start-room restricted_cage --unlock restricted_cage --set briefing_played=true --set bin_chosen=true --set hatch_talked=true` | script written, not yet run |

Record flags `--hide-hud --zoom-step 1` for every take except t10 and t11 (`""`). Helpers: `_c9.mjs` (re-exports m05/m06/m07 helpers; `setGlobal` via a dynamic import of `global-writer.js`, `blurShelfText`).

## Risks to check on the first run

- t10/t11: the briefing must open by itself (no `clearScreen`). t11 assumes `dialogue.speaker` holds the display names ("Agent 0x2D 'Anchor'" etc.) and that `continue_` skips voiced lines.
- t12/t13/t18: `makeBeat` start/stop offsets are copied from m07's Park take; tune from the SETUP log. Picks wanted Noor's walk in from `loading_dock`; this starts in the room.
- t13: Jesse's sight challenge stays off with `m01_maya_ko` unset; the LOS cone is drawn (`visualize: true`), check it is not distracting. Console default text is "IN PROGRESS" (default `tran_outcome` is "left", verified in the scenario).
- t14: Jesse hidden by his `room_entered` mapping when the start room is the closet; amber light only when `tran_outcome !== 'left'`.
- t15: the Shelf Marks chart prints the key word and the other bays' words. The blur is heuristic (30 ms interval on matching elements); check every frame and drop the chart shot if it leaks. Door id `door:tape_room->salvage_cage` assumed from the m07 pattern.
- t16: the accented recipe name; the fallback is the plain spelling. The textbook example is not the mission's ciphertext.
- t17: `writeGlobal` import path `/break_escape/js/systems/global-writer.js` (as `tools/playtest/m05-ol-*.mjs`); `currentRoom` field name in `getState()` unchecked; chase under headless physics.
- t18: no bin scene fires with both globals set; check no task panel or HaX toast from the seeded globals; the cage chat background is split at x 0.55.
- Sorensen's office lock is a password lock; the biometric reader is the cage's Plan Cabinet (confirmed in the scenario, `plan_cabinet`, `lockType: biometric`).

## Part 2: crescendo, flashes, walks, Drop, Sorensen (23 Nov, scripts only, `node --check` clean, none run)

Helpers: `_c9x.mjs` (door id resolved from the nearby list, `meetNpc`, `openCloneNpc`, `injectLift`, brushing-only `dustBrush`, `PAD`; re-exports the m05/m06 helpers). Digit check: `ruby tools/video/takes/m09/check_digits.rb` gives `safe: 3 digits; prefix of any PIN: no; same digit at same position as any PIN: no (1 PIN locks checked)`. `PAD.safe` is the only keypad typing (t25), never ENTER; the hl_box password screen gets z/q/x only. Run line as above (`MISSION=m09 .../run.sh <avatar> <take> "<flags>" "--hide-hud --zoom-step 1"`; t28 and t29 record flags `""`).

| id | what | avatar | entry flags | status |
|---|---|---|---|---|
| t19_dock_closeups | notes pick (Incident Log, no code) then key lock on the front desk door | frank_callahan | `--imports=none --start-room loading_dock --give dock_office_key --set briefing_played=true` | script written, not yet run |
| t20_frontdesk_rfid | RFID clone of Noor's card (blurred) then RFID door reader on the staff_passage door, Emulate | harjit_singh | `--imports=none --start-room front_desk --unlock front_desk --set briefing_played=true` | script written, not yet run |
| t21_drop_staff_passage | the Drop: walk into staff_passage, motion lights strike | lucia_moreno | `--imports=none --start-room front_desk --unlock front_desk --unlock staff_passage --set briefing_played=true` | script written, not yet run |
| t22_stacks_closeups | H&L box password screen (z/q/x, no ENTER) then Cody Old Coyote face flash | mei_lin_chow | `--imports=none --start-room open_stacks --set old_coyote_quiet=true --set briefing_played=true` | script written, not yet run |
| t23_crate_lockpick | real lockpicking of `enrolment_crate` with the starting kit | daniel_seo | `--imports=none --start-room salvage_cage --unlock salvage_cage --set briefing_played=true` | script written, not yet run |
| t24_stamp_hatch | fingerprint dusting (brush only) on `sorensen_stamp`, then Sorensen hatch face flash | vivian_ashby | `--imports=none --start-room restricted_stacks --unlock restricted_stacks --set briefing_played=true` | script written, not yet run |
| t25_office_pin | `director_safe` PIN pad with the cracker fitted, 3 wrong digits, no ENTER (no result lights) | ngozi_adeyemi | `--imports=none --start-room sorensen_office --unlock sorensen_office --set briefing_played=true` | script written, not yet run |
| t26_cage_sorensen | UI-free overworld shot of Sorensen at the shredder (7 s hold), then the biometric reader on `plan_cabinet` (injected lift, nothing presented) | marcus_hale | same seeds as t18 (`--start-room restricted_cage --unlock restricted_cage --set bin_chosen=true --set hatch_talked=true`) | script written, not yet run |
| t27_flag_station | empty flag station `drop_terminal` | lucia_moreno (vary if run next to t21) | `--imports=none --start-room reading_room --set briefing_played=true` | script written, not yet run |
| t28_phone_contacts | phone contact list as the card flash: Gary, Torres, Recruiter, Agent 0x99; Nightshade row and previews hidden by a DOM interval | mei_lin_chow | `--imports=none --start-room loading_dock --set briefing_played=true` | script written, not yet run |
| t29_phone_gary | Gary's voiced call (rings after a first try at the salvage keypad), subtitle observer, stops at the reply menu, nothing picked | vivian_ashby | `--imports=none --start-room tape_room --unlock tape_room --set briefing_played=true --set m02_gary_protected=true`, `BE_KEEP_RING=1` | script written, not yet run |
| t30_walks | env `M09_WALK`: noor, closet, stacks, laptop (four walk shots, one script) | see script header | see script header | script written, not yet run |

Risks to check on the first run (part 2):
- Door ids come from the nearby list (either direction); confirm `door:loading_dock->front_desk`, `front_desk->staff_passage`, `tape_room->salvage_cage` resolve.
- t19: `--give dock_office_key` (an NPC-held item) puts the key in the inventory; the key-selection label regex is a guess (falls back to the first key). The pick kit is also held, so the minigame may open in key mode or offer both.
- t20: Noor is met by opening and closing her chat in setup; confirm the server accepts the clone. HaX `card_cloned` texts or toasts may show.
- t22: with `old_coyote_quiet` set his sight challenge is skipped; the room_entered mapping re-sets it. His first line is followed by a menu: the 1.6 s hold may not clear it, so cut at the line. Check the password screen shows no hint text that is an answer.
- t23: what the crate shows after the pick is unread; `closeAll` runs at once, but check the frames after `lock-open`.
- t24: the hatch opener starts with narrator lines before Sorensen speaks; the menu comes after three lines.
- t25: the cracker toggle and its help text show; no lights until an attempt, so none. Confirm `director_safe` is reachable from the spawn (sorensen_office).
- t26: confirm no bin scene or HaX toast from the seeded globals, and Sorensen is at the feed (3.6, 4.6) facing the shredder. Whether the plan cabinet's reader prints its required owner name before a scan (check frames; the scenario's `requires` is a name).
- t28: `.contact-item`, `.contact-name`, `.contact-last-message` class names read from `phone-chat-ui.js`; the list is every phone NPC of `player_phone`, so Nightshade's row exists and is hidden by script only (check every frame).
- t29: Gary's call explains the cipher kind (a hint, no answer): use the reply menu frames only. `door_unlock_attempt` may not fire from the keypad opening (add a second interact if no ring).
- t30: moveToNear paths are visible walks, not key legs; check no click marker.

## Not done

- Safe dial: m09 has no dial lock (locks in the scenario: key, RFID, password, PIN, biometric only), so no take was written; the crescendo can use another type or drop it.
- Shelf Marks chart: never filmed (orchestrator decision below). The tape_room `shelf_code_legend` is not touched by any script.
- Nothing from part 2 has been run: no capture, no frame check, no A/V offsets.

## Orchestrator decision (23 Nov)
- The Shelf Marks chart prints the Vigenère key word (a puzzle answer). Drop the chart from every window; the `Vigenère / Cipher` card uses t16 (CyberChef on a neutral textbook example) and the salvage password screen with its hint only. t15 may still be run for the password screen; cut before or after any chart frame.

## Run 1 (24 Nov, keyless :3025, display :113, `FOOTAGE_ROOT=$HOME/video-takes-local`, footage in `~/video-takes-local/m09/takes`)

All 1920x1080, 30 fps, `--music 0`. Avatar reading before the first take: `female_hacker_hood_v2`. Marks are trimmed-file seconds. **Every Helena take needs `--set dock_done=true`**: with `briefing_played` set and `dock_done` unset, HaX's dock call rings 2 s after load and opens the phone over the take (t12 first run failed on it). The flags below include it. Round-2 lines were checked against the ink: t10 quotes "We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it." (7.7 s, not the picks' older wording) and t18 "Everyone ENTROPY ever placed is filed in this room, dear. By morning, I'll be the only index you can ask." (9.77 s); the scripts already had both.

| id | avatar | result | len | drop % | A/V off (ms) | marks (s) | frame notes and spoiler cut points | suggested window |
|---|---|---|---|---|---|---|---|---|
| t10_hook_briefing | marcus_hale | pass | 13.87 | 0.21 | -47 / -63 | line-start hook 4.39, line-end 12.08 (7.69 s), hook-done 12.15; next (HaX "Sorry about the leave") starts 12.94 | Frames viewed. Netherton portrait with the subtitle bar, no player portrait, no toast. Lines before the hook (narrator, courier quote, traitor line) are skipped fast and partly audible: cut to the hook marks only. | in 4.3 out 12.1 |
| t11_team_faces | marcus_hale | pass | 30.4 | 0.10 | -93 / -73 | face:Anchor 18.56, Malhotra 22.09, Arakawa 25.62, Lantern 28.26, team-done 29.66; choices at 10.67 and 17.1 | Frames viewed: four clear portraits (Anchor, Malhotra, Arakawa, Lantern), HaX also shows around 23.5. Subtitle bars show the line text. **Spoiler:** Lantern's subtitle mentions Nightshade: crop to the portrait or cut before the subtitle. Netherton's "I will read those two myself. Later." shows at 11. | faces: Anchor 18.7-19.6, Malhotra 22.2-23.0, Arakawa 25.7-26.5, Lantern 28.3-29.0 (crop the subtitle bar) |
| t12_noor_cover | ngozi_adeyemi | pass | 8.74 | 0.91 | -77 / -42 | walk-start 1.45, walk-end 2.11, interact 2.61, line-start 3.18, line-end 7.01 (3.84 s), closed-done 7.08 | Frames viewed. Map shows the room small with black margins (crop in). The walk is 0.7 s (she is close to the spawn). Noor portrait and bar clean. The reply menu is on screen from about 7.8: out at 7.1. First run failed on the HaX dock call (see top). | walk 1.5-2.2 (map), line in 3.2 out 7.1 |
| t13_wipe_running | daniel_seo | pass | 25.14 | 0.37 | -73 / -78 | console-open 2.85, console-closed 5.49, walk-start 9.46, interact 11.46, interact-retry 18.32 (7 s lost to the NPC), line-start 19.35, line-end 23.61 (4.26 s), jesse-done 23.66 | Frames viewed. Wipe Console panel shows "WIPE IN PROGRESS ... 212 reels ... J. Tran" as text only (no red blink seen); the green sight cone of Jesse is drawn on the map, and a speech-bubble icon shows from about 14 s. Jesse portrait and line clean (no player portrait). | console 3.2-5.3; Jesse line in 19.3 out 23.7 |
| t14_wipe_halted | lucia_moreno | pass on re-run (first run dropped 1.11%) | 6.84 | 0.37 | -25 / -43 | console-open 2.75, console-closed 5.36 | **Frames not yet viewed** (rig paused). Needs a check for "WIPE HALTED ... 97 of 212 reels intact", the amber light, and that Jesse is not in the room frame. | check |
| t15_vigenere_chart | harjit_singh | pass (check only) | 10.57 | 0.26 | -30 / -48 | chart-open 2.56, chart-closed 4.38, pw-open 6.79, pw-closed 9.2 | **Frames not yet viewed.** **Spoiler:** 2.56-4.38 is the Shelf Marks chart (key word; orchestrator decision: drop). Use only the password screen 6.8-9.2, hint only, after checking no typed characters. | pw 6.9-9.1 (after frame check) |
| t17_dillard_stacks | vivian_ashby | pass | 22.1 | 0.14 | -35 / -22 | door-open 1.85, lights-held 13.98 (12 s to walk in under the 20 fps throttle), alerted 13.99, line-start 15.28, line-end 19.6 (4.32 s), chase-held 21.65 | **Frames not yet viewed.** Check: strike, Dillard line, whether he comes down the aisle, Cody Old Coyote in frame. | check, line 15.2-19.7 |
| t18_sorensen_ending | mei_lin_chow | pass | 21.77 | 0.14 | -43 / -42 | walk-start 1.45, walk-end 2.04, interact 2.64, narrator line 3.77-9.61 ("She feeds another sheaf into the shredder..."), line-start 10.13, line-end 19.9 (9.77 s), ending-done 19.99, next line (Paper was the only thing...) starts 20.45 | Frames viewed. Cage map small with black margins (crop). Sorensen portrait, cage background, no task panel, no HaX toast. The seeded globals show nothing. The pause after "dear." was not found by silencedetect (quiet voice, no gap under -55 dB); by ear it is a few seconds in. The narrator line precedes her (skipping it plays it: start the line view at 10.1). | line in 10.1 out 19.95 |
| t20_frontdesk_rfid | harjit_singh | pass | 19.87 | 0.45 | -93 / -73 | cloner-open 1.55, step Save 4.1, saved 7.0, cloner-closed 7.03, door-interact 9.95, reader-open 12.01, step Emulate 13.51, door-open 17.92 | **Frames not yet viewed.** Check the card UID is blurred in the cloner, no HaX toast, and the reader shows "Staff Card, N. Haddad" (a name, fine). | check |
| t21_drop_staff_passage | lucia_moreno | **fail (logic)**: check passed but the player never left front_desk (lights-seen false) | 20.27 | 0.45 | -63 / -98 | door-open 3.85 | keyLegs up stopped at the wall beside the doorway. Script fixed (walk with moveTo to a point beyond the doorway); re-run needed. | none |
| t16_cyberchef_vigenere | mei_lin_chow | **fail (check)**: only 1 tone slate, end audio suspended (transient) | 13.87 | 0.24 | n/a | not read | Re-run; frames not viewed. | none |
| t19_dock_closeups | frank_callahan | **fail**: the lockpicking minigame never opened on the front desk door after the note beat | n/a | 0.15 | n/a | note-open 4.59, note-closed 7.2, interact-door 9.01 | Cause unknown. Script now logs the interact result and retries the interact once; read `interact-result` markers on the re-run. Check the note frames (Incident Log, no code) after the re-run. | none |

## Not done (at pause, 24 Nov)

- Not run yet: t22 to t30 (stacks close-ups, crate lockpick, stamp/hatch, office PIN pad, cage Sorensen, flag station, phone contacts, Gary call, walks).
- Re-runs needed: t16, t19 (script edited), t21 (script edited).
- Frame checks still owed: t14, t15, t17, t20 (takes passed their A/V checks, frames not viewed because the rig was paused by the orchestrator for another job).
- Avatar reading after the last take: not taken yet (before-reading `female_hacker_hood_v2`; the wrapper restores after every take).
