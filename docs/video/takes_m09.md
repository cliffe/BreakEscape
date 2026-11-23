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

## Not done

- Crescendo close-ups: RFID clone (Noor's belt card), RFID door reader, lockpick (`enrolment_crate`, key lock, start-item pick kit), front desk key lock (needs `dock_office_key`, held by Cody Old Coyote; inject into inventory), PIN cracker on `director_safe` (sorensen_office, cut before result), H&L box password screen (`hl_box`, open_stacks), fingerprint dusting (`sorensen_stamp`, restricted_stacks), biometric reader on `plan_cabinet` (needs a lift in `gameState.biometricSamples`), safe dial, notes pick, empty flag station (`drop_terminal`, reading_room), phone chat (Gary or Torres, `BE_KEEP_RING=1`, subtitle observer).
- Face flashes: Cody Old Coyote (open_stacks), Sorensen behind the hatch mesh (`sorensen_hatch`, restricted_stacks), phone contact cards (Gary, Torres, Recruiter, Agent 0x99; Nightshade left out).
- Walks: to Noor's desk, into the server closet, into the open stacks, to `field_laptop` (out before the launcher).
- Sorensen 3x UI-free overworld shot at the shredder; the "Drop" shot (motion lights in `staff_passage`, `--unlock staff_passage`).
- No digit check (no keypad take written yet; when written, copy `m07/check_digits.rb` and read PAD from `_c9.mjs`).

## Orchestrator decision (23 Nov)
- The Shelf Marks chart prints the Vigenère key word (a puzzle answer). Drop the chart from every window; the `Vigenère / Cipher` card uses t16 (CyberChef on a neutral textbook example) and the salvage password screen with its hint only. t15 may still be run for the password screen; cut before or after any chart frame.
