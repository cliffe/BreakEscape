# m03 pass 2 regression, Run B (night): PARTIAL, stopped at step 5

Tester: Sonnet subagent. Game id 2083, keyless server :3001, headless, speed fast. Session log: `tools/playtest/m03-regB-session.jsonl`. Date 2026-10-12.

**This run is incomplete.** Auto mode's safety check began refusing every Bash command partway through step 5 (decoding the drive in CyberChef), so the game session was left open at game 2083 and could not be driven further, synced or verified. `verify-run.rb` was NOT run (no output to paste). Steps 5 (decode and tell HaX), 6, 7, 8 and 9 (Danny, guard, Victoria, debrief, credits) were not played, and the mid-fate reload (C10) was not exercised. The session process (pid 2797750, tag 2083) is probably still running; stop it with `tools/playtest/session-stop.sh 2083` and then run `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 2083`.

Route: the day steps were played for real (nothing console-set, so no "exercised, not earned" globals; the night state was reached by play). Pick-lock step used `mg completeLockpick` (PASS, assisted).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Staff Access Badge | cloned card | Receptionist's lanyard, clone choice, Dictionary attack | day step 4 | yes |
| Executive Keycard | cloned card | Victoria's card at whiteboard, Darkside | day step 5 | yes |
| Founding year | 2010 | Company Founding Plaque in reception | day step 2 | yes |
| Office PC password | `Sterling2010` | helpdesk post-it inside the PC password minigame, surname from Victoria, year from the plaque | night step 3 | yes |
| Wall-safe PIN | `5829` | Unsent email on office PC, base64, decoded in CyberChef iframe | night step 3 | yes (found; the safe itself not yet opened) |
| `<flag:1..4>` | tokens | VM terminal opened first (192.168.100.3), then drop-site | night step 1 | flag supplied, prerequisite earned |

## Step results

| Step | Result | Evidence |
|---|---|---|
| A1 Brief | PASS with notes | Briefing played as a person-chat; `mg pressKey Escape` closed it. Tutorial prompt then appeared; the "Mission Brief" notes panel popped once. HaX's first text matches R1-7 ("Your interview's with Victoria Sterling in the conference room, behind a staff card reader..."). |
| A2 Reception | PASS | Plaque read (2010); receptionist "Afternoon! You'll be the three o'clock, is it?" (voice rule OK); visitor badge given; clone choice not offered on the first visit. |
| A3 Conference reader first (C6, B-2) | PASS | RFID reader opens the flipper, HaX text "That reader wants a staff badge. The cloner in your kit copies one from arm's length..." and the optional task "Copy the receptionist's staff badge with your cloner" appear. **Reload here**: brief did not pop again, inventory and `conference_reader_tried` held. |
| A4 Clone choice after reload | PASS | Receptionist "Back again? Forgotten something?" and the lanyard choice offered. Dictionary attack, Save: `clone_reception_badge` and `copy_staff_badge` complete. Badge opens the conference door via Saved > Staff Access Badge > Emulate. |
| A5 Victoria, whiteboard (B-4) | PASS | Chose recruit-friendly options; cloner buzz; the flipper opened by itself over the chat, Darkside ~30 s, Save: `victoria_card_cloned`, `clone_rfid_card` complete, `mission_phase` -> `act2_infiltration`. Task "Walk out with the visitors and come back after dark" present on the panel (R1-1). |
| A5b Reload before leaving | PASS (see finding M-1) | Resume overlay appeared (click Resume). Night cutscene had not played; progress, globals and inventory held. |
| A6 Night turn | PASS | Entering the main hallway played the night narration on a magenta matrix backdrop with the player portrait; HaX text "You're in. Server room's at the north end of the main hallway..." Only "Breach The Server Room" is new. |
| B1 Server room, VM, flags | PASS | Executive Keycard opens the server room; "Zero Day's Paper Trail" aim arrives on entry (C1). VM terminal shows **192.168.100.3** (R1-12). Flags 1-4 submitted one at a time, each "Flag accepted"; flags 1-3 gave no reward panel, flag 4 gave "Rewards Unlocked: Zero Day Transaction Log" (C8). Drop-site stayed open after flag 4 (C11). `night_confrontation_ready` set. |
| B1b Reload after flag 4 | PASS (see M-1) | Progress, inventory (log item), globals held; server room reopened without re-picking the card. |
| B1c Read the transaction log | PASS | `transaction_log_read` set; `find_operational_logs` complete. |
| B2 Whiteboard + CyberChef | PASS | Whiteboard shows ROT13; CyberChef workstation opens the crypto laptop; ROT13 output reads as expected; `decode_whiteboard` complete. |
| B3 Office | PASS (assisted) | Exec office door picked via `completeLockpick` (guard timing R1-20/R1-21 NOT tested: pick is not machine-playable). `Sterling2010` accepted; email and roster taken; email decodes to the PIN `5829`. |
| B4 Wall safe | NOT RUN | |
| B5 Drive | PARTIAL | Drive taken from the desk drawer and read (`decode_directive` no longer in the locked list). Decode, wrong answer then right answer to HaX (C3, C7) NOT run. |
| B6-B9 Danny, guard, Victoria, debrief, credits | NOT RUN | C2, C9, C10, C14, C18, R1-3, R1-11 (partly), R1-21 untested. |

## Findings

| # | Severity | Finding | Reproduction |
|---|---|---|---|
| M-1 | minor | After every reload the player is placed back at the lobby spawn (160,144) in `reception_lobby`, not in the room they were in (server room, conference room). State is otherwise kept. May be intended with the new save state; check before treating as fine. | Play to any room beyond the lobby, `location.reload()`, Enter on title, Resume. |
| M-2 | minor (harness, not game) | `lock {code}` on the PC password reported `ok:false` although the lock opened (container appeared). `converse` closes a flipper opened mid-chat, so `converse` cannot be used on the clone choice (it lost the read; reopening via the hub worked). | Harness only. |
| M-3 | observation | Rooms render fully lit at night ("main hallway is on its night lights" is narrated). No m03 lighting is set yet, so not a regression; the lighting stage will change this. | Enter hallway after the night turn. |
| M-4 | observation | No console errors were observed in the steps run (console log not systematically captured). The viewport shows the room map in the right half of a black canvas, with rooms stacked; probably layout/camera of the headless viewport, not checked against a headed run. | Screenshots in session scratchpad `m03-regB/`. |

No blocker, softlock or major findings in the portion that ran.

Checks not reached: C3, C4 (night music after reload: not measurable headless), C7, C9, C10, C12, C18, R1-3, R1-10, R1-11, R1-20, R1-21, conversation backgrounds (the person-chat screens with NPCs were not screenshotted, so conversation background behaviour is unverified; the night cutscene and flag-station screens looked right).

## verify-run.rb output

Not run (Bash blocked by the safety check). Command to run: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 2083`.
