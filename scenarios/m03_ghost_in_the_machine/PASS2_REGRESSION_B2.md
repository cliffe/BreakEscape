# m03 pass 2 regression B2 (night to the end) plus the five new ZDS rooms

Tester: Sonnet subagent, 2026-10-12, headless, speed fast, keyless server :3001. Load was low (about 4.6) at start.

- **Run 1 (full run)**: game 2096. Day played for real, night played to the end. Session log `tools/playtest/m03-regB2-session.jsonl`. Nothing console-set for story state. Ending reached, but I overran the C10 reload window (see C10), so the ending checks were repeated in run 2.
- **Run 2 (ending only)**: game 2099. Session log `tools/playtest/m03-regB2-ending-session.jsonl`. Reception badge cloned for real (to open the conference door), then **console-set (exercised, not earned)**: `mission_phase=act2_infiltration`, `clone_call_done`, `victoria_card_cloned`, `night_confrontation_ready`, `exec_wing_entered`, `exec_office_entered`, `transaction_log_read`. Used only for C10, C9, C18, R1-3 and the debrief text. Credits did not roll in run 2 because the other `concludeRequires` tasks were never done (expected).
- The receptionist is "Receptionist" in run 1 and "Ffion Rees" (id `ffion_rees`) in run 2: the dialogue writer renamed her mid-run. Her id was `receptionist_npc` before. The lobby plaque also moved between the runs (see F-1).

## Earned-secrets table (run 1)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Staff Access Badge | cloned card | Receptionist's lanyard, clone choice, dictionary attack | day step 4 | yes |
| Executive Keycard | cloned card | Victoria's card, whiteboard choice, Darkside | day step 5 | yes |
| Founding year | 2010 | Company Founding Plaque | day step 2 | yes |
| Office PC password | `Sterling2010` | helpdesk slip in the password dialog, surname from Victoria, year from the plaque | night | yes |
| Wall-safe PIN | `5829` | unsent email on the exec PC (base64), decoded in the CyberChef iframe | night | yes (decoded via iframe URL hash, in-game tool) |
| Drive text | "Grid storage and substations first..." | drive in desk drawer, base64 then ROT13 in CyberChef | night | yes |
| `<flag:1..4>` | tokens | VM terminal opened first (192.168.100.3), then drop-site | night | flag supplied, prerequisite earned |

## Step results

| Step | Result | Evidence |
|---|---|---|
| Brief | PASS | Briefing person-chat closed by `mg pressKey Escape`; Mission Brief notes panel closed with `mg close`; tutorial declined. |
| Day: reception | PASS | Plaque (2010) and directory read; receptionist greeting has no player name; visitor badge given; clone choice not offered on the first visit. |
| Day: conference reader first (C6) | PASS | RFID flipper opens, HaX text and optional task appear. Clone choice "Lean in by her lanyard..." offered on the return visit ("Anything else, love?"). Not reloaded here (reload was covered in B). |
| Day: clone receptionist badge | PASS | Dictionary attack, Save; `reception_badge_cloned`; badge opens conference door via Saved > Staff Access Badge > Emulate. |
| Day: Victoria and whiteboard | PASS | Whiteboard choice appeared in her hub; cloner buzzed; flipper opened by itself over the chat; Darkside finished well inside the wait; Save; `victoria_card_cloned`. |
| Night turn | PASS | Leaving the room played the night narration ("Eleven o'clock that night...", "night lights"), then the five VM flag tasks and `find_operational_logs` were the open list. |
| Server room: VM terminal, flags 1-4 | PASS | VM terminal shows 192.168.100.3 (R1-12). Each flag showed a tick in the drop-site list. After flag 4: Zero Day Transaction Log in inventory, `night_confrontation_ready` set, drop-site still open (C11). |
| Read transaction log | PASS | `interactInventory`; `find_operational_logs` left the task list. |
| Whiteboard and CyberChef | PASS | Whiteboard text says "...word lengths and punctuation hold: each letter swapped..." (R1-11). CyberChef workstation opens. |
| Exec office door, guard timing (R1-20) | PASS | Sampled the guard over about 20 s: west post (427,-27) for about 4.5 s, then east to (510,-59) near the door, then back. Opened the pick as he walked west (x about 458): not caught, first try. `completeLockpick` used to finish the pick (assisted; the picking itself is not machine-playable). `guard_detection_count` stayed 0. |
| Exec PC | PASS | `Sterling2010` accepted; unsent email and client roster taken. |
| Email decode / wall safe | PASS | Base64 decoded in the CyberChef iframe to "...Catalogue safe re-coded to 5829...". Safe opened with 5829 (`lock {code}` reported ok:false but the container appeared, the known harness quirk); Exploit Catalogue taken. |
| Drive and HaX (C3, C7) | PASS | Drawer gave the drive and `decode_directive` appeared. Text decoded in CyberChef (base64 then ROT13) to the PHASE 2 directive. Wrong answer ("Substations first... Spring.") answered "That's not what's on there. I'm logging that one as a guess. Run it again." Right answer completed the task ("Task Complete" toast; `directive_decoded` and `directive_guessed` both true). |
| Danny | PASS | Chat opens where he now stands (528,97). Picked "Come in and testify. You were deceived. I'll put that in the report myself." (R1-11 wording present), then "Sterling goes down for her part..."; `danny_fate=protected`. Second visit restarted the chat from its opening, as expected. |
| Guard | PASS (avoided) | Never spoken to; `perfect_stealth_earned` was **false** when I read globals after the reload (see F-5). |
| Victoria confrontation (arrest) | PASS | Night knot: "You came back after hours. Recruits don't do that." Arrest ending shown through to "...Enjoy the paperwork." |
| C10 reload mid-fate | run 1 MISSED, run 2 PASS | Run 1: my stepping script clicked Continue past her last line, so the debrief had already started and I reloaded during the debrief's first line. Run 2: reloaded with her last line on screen (`victoria_fate` read `""` and `victoria_choice_made` false locally at that moment). After reload and Resume: `victoria_fate=arrested`, `victoria_choice_made=true`, `debrief_played=true`, and the debrief person-chat **opened by itself on resume** (player back at the lobby spawn, no room entry needed). It played once, start to finish. |
| C9 | PASS | Victoria's final lines show in full, then the chat closes, then the debrief. |
| C18, R1-3 (run 2 text) | PASS | See debrief transcript below. No three-in-a-row "now we have the proof". "You left some of the paper behind" form named the drive-line variant plus history and catalogue ("The drive wasn't the only paper you left behind. / Their own history of the firm stayed in Sterling's filing cabinet. / The exploit catalogue stayed in the wall safe."). Gate text "It's done. Get some rest. We'll need you soon." (not "Clean enough") for middling trust. Drive line "The search team went through Sterling's desk this morning and found a drive." with the player choice "So that drive is the map to their whole operation." was offered (second choice), and I took choice 1. Console-set state, so the drive/cabinet/safe were genuinely unseen. |
| C2 | PARTIAL | Run 2: `perfect_stealth_earned=true` after the debrief (detection count 0, `exec_office_entered` set). Run 1: false when read after a reload during the debrief. I did not see the Perfect Stealth line or the credit text on screen in either run. |
| Credits | NOT OBSERVED | Run 1: after the reload the credits overlay (`creditsShowing: true`) was up but the `#bv-credits-overlay` scroll was empty (they do not replay after reload). Run 2: credits did not start because other tasks were left open. The credit lines (C2, PERFECT STEALTH, "PHASE 2 DIRECTIVE...") are unchecked. |
| R1-21 grace line | NOT RUN | I stayed clean to keep C2 meaningful. |
| C4, C5, C12, C13, C14, C16, R1-1, R1-2 | NOT RUN | Night music not measurable headless; struggling-run items not in scope. |

### Debrief transcript (run 2, arrested, console-set night state)

Lines I captured, after "There you are..." (earlier opening lines went by unrecorded):

- Let's go through it. / The network first. All four flags, and the distcc logs are the case. / The ProFTPD backdoor, sold to Ghost, invoice ZDS-2024-0847, St. Catherine's on the target line, Sable's sign-off on the approval. / Now it's in their own books.
- Victoria Sterling. Sable. / In custody. The CPS are looking at conspiracy... / Not with "target selection, ten thousand" on her own invoice. And you got her to call it consultancy on an open line. (choices: survey / people died / arms dealer)
- Phase 2: "The search team went through Sterling's desk this morning and found a drive..." then the directive substance, Architect lines, a Danny line for "no fate" ("You never found the consultant, Danny Foster...").
- What let you in; "The drive wasn't the only paper you left behind." (history, catalogue); "It's done. Get some rest. We'll need you soon."; where it stands; next-assignment choice; "Go home and get some sleep. We'll brief the next one when you're ready."

## Per-room object interaction table

"Pick-one menu" means the engine's "INTERACT WITH..." disambiguation menu appeared. Positions are world coordinates from `room`.

### reception_lobby

| Object | Result |
|---|---|
| Company Founding Plaque (70,35 in run 2; 120,33 in run 1) | Opens. In run 2 it is 22 px from the exit door at (48,32): a pick-one menu (Plaque / Door) appeared when the player stopped by the door (F-1). |
| Building Directory (14,119) | Opens (the approach stopped 31.3 px away, just inside range). |
| Receptionist / Ffion Rees | Chat opens at her desk (227,126). Hub with clone choice works. |
| Door to main_hallway | Walks (`enter` crossed both ways). |

### conference_room_01

| Object | Result |
|---|---|
| Presentation Materials (-240,99) | Opens, via a pick-one menu (rival: chair). Chose the portfolio from the menu. |
| Conference Whiteboard (-224,-104) | Opens (Training Lab notes). Harness reported no-effect but the dialog was up. |
| Chairs x2 (-242,114 / -168,114) | No window or toast. Harness reports `no-effect-confirmed`. Decor, as far as I can tell. |
| Victoria Sterling (-160,-31) | Chat opens (day and night knots). |
| Door to main_hallway | Walks. |

### server_room

| Object | Result |
|---|---|
| Server Room Whiteboard (244,-358) | Opens, ROT13 text. Taken into notepad on reading. |
| CyberChef Workstation (98,-181) | Opens the laptop; then sits in inventory as an item and can be reopened. |
| VM Access Terminal (215,-256) | Opens with 192.168.100.3. |
| Drop-Site Terminal (149,-182) | Opens (flag-station); accepted all four flags. |
| Filing Cabinet (36,-359) | Reached from the front; opens the lockpick (not picked). |
| Wall Safe (214,-354) | PIN dialog opens, 5829 opens it. The wall safe and whiteboard are 30 px apart; no pick-one menu appeared. |
| Door to main_hallway | Walks. |

No object called an "ops bench" exists in this room; the VM terminal and drop-site are 85 px apart and open without a menu.

### executive_wing_hallway

| Object | Result |
|---|---|
| Door to executive_office (592,-96) | Locked (key), pick needed. Walks after the pick. |
| Door to danny_office (368,32) | Walks. |
| Security Guard (patrol 427..510, -27..-59) | Patrols; not spoken to. |

### executive_office (CEO)

| Object | Result |
|---|---|
| Executive Computer (450,-281) | Password dialog opens (title "Enter password for item"); container with email and roster after the password. |
| Desk Drawer (493,-242) | Opens (container with the drive). Reached 31.3 px away, at the edge of range. |
| Chair (444,-230) | No effect. |
| Chair (480,-230) | Pick-one menu (rival: Desk Drawer, 18 px away); chose chair, no effect (F-2). |
| Filing Cabinet (576,-361) | Reached; opens the lockpick (not picked). |

### danny_office

| Object | Result |
|---|---|
| Performance Review (460,141) | Opens. |
| Family Photo (418,142) | Opens (dialog). |
| Danny's Workstation (366,131) | Container opens about a second after the click (the harness reports `opened: null` at first). `moveToNear` warns viaMenu with the Family Photo (about 26 px from the standing spot), but no menu appeared in play and the PC opened directly. Two files; one taken, the other still listed on the second visit (B-12). |
| Danny Foster (528,97) | Chat opens where he stands. |

## Findings

| # | Severity | Finding | Reproduction |
|---|---|---|---|
| F-1 | minor | In `reception_lobby` the Company Founding Plaque now sits at (70,35), 22 px from the exit door at (48,32). Standing at the door raises an "INTERACT WITH..." pick-one menu (Plaque / Door) and the menu blocked `enter` until I chose "Door". In run 1 the plaque was at (120,33) and there was no problem, so it was moved during the run. | Start a new game, close the briefing, walk to the lobby exit; or `enter main_hallway` from beside the desk. |
| F-2 | minor | CEO office: the second chair (480,-230) is 18 px from the Desk Drawer (493,-242). Clicking the chair raises a pick-one menu with the drawer in it; the drawer is the thing the player wants (it holds the drive). The drawer itself opened directly when targeted. | In `executive_office`, interact with `executive_office_chair-exec-rotate5_11`. |
| F-3 | minor | The chairs in the conference room and CEO office are listed as interactables but do nothing when used (no window, toast or text). They also feed the pick-one menus in F-2 and the Presentation Materials menu. | Interact with any chair. |
| F-4 | minor (wording) | PIN and password dialogs for the wall safe and the Executive Computer are titled "Enter PIN for item" / "Enter password for item". The test bridge treats that as `wrong-target-opened` (mismatch) because the title does not name the object. The dialogs were the right ones. | Interact with `wall_safe_server` or `victoria_computer`. |
| F-5 | minor / unverified | Run 1: reload while the debrief's first line was on screen. After Resume the mission showed as concluded (`hear_debrief` gone from tasks, credits overlay up) but `perfect_stealth_earned` was **false** with `guard_detection_count` 0 and `exec_office_entered` true, so the clean-run credit may have been lost. In run 2 (no reload during the debrief) it was true. Not reproduced deliberately; the debrief is not reload-safe by a few seconds. | Reach the debrief on a clean run, reload on its first line, Resume, read `perfect_stealth_earned`. |
| M-1 (carried) | minor | After every reload the player is placed back at the lobby spawn (160,144) in `reception_lobby` whatever room they were in (seen again in run 2 from the conference room). State is kept. | Reload anywhere, Enter, Resume. |
| F-6 | observation | Console showed several `503 (Service Unavailable)` resource loads and a CSP "Refused to frame ''" message while the CyberChef laptop was opening. The workstation worked. URLs not captured; probably TTS or other keyless-server assets. | Open the CyberChef Workstation with the console drained beforehand. |
| F-7 | observation | Lighting still absent: night rooms are fully lit (carried M-3). Not a regression. | n/a |

No blocker, softlock or major finding. Every door in the five new rooms walks both ways, and every scenario object opens the right thing. No "pick one" problem at the CEO desk beyond F-2, none at the server-room bench or Danny's desk.

## Checks run

| Check | Result |
|---|---|
| C3 decode_directive unlocks on reading drive, completes on right answer | PASS |
| C6 reader first, then clone choice | PASS |
| C7 wrong-then-right directive, guess logged | PASS (`directive_guessed=true`; the debrief line changed to "Our people had it read..." in run 1's globals is plausible but the run 1 debrief was not read) |
| C8 flags 1-3 no reward panel | PASS by state (no blocking UI), not screenshotted |
| C9 Victoria's full final lines, chat closes, then debrief | PASS |
| C10 reload on her last line | PASS (run 2) |
| C11 drop-site stays open after flag 4 | PASS |
| C18 debrief wording | PASS (run 2, arrested branch only; recruited branch not run) |
| R1-3 gated debrief text | PASS for the drive-unseen / catalogue-unseen / trust-middling variant |
| R1-11 three dashes | 2 of 3 seen: whiteboard "punctuation hold", Danny "You were deceived. I'll put that in the report myself." HaX's all-flags text not read |
| R1-12 VM address | PASS (192.168.100.3) |
| R1-20 guard timing | PASS, first clean pick on the first try |
| B-10 filing cabinet reachable from the front | PASS |
| B-12 Danny's PC second file | PASS (still listed) |
| C2 | partial, see above |
| C4, C5, C12, C13, C14 (not reachable), C16, R1-1, R1-2, R1-10, R1-21, credits text | NOT RUN or not observed |

## verify-run.rb output

Run 1 (game 2096):

```
game            2096  (mission 47)
created         2026-10-12 15:15:46 UTC
last write      2026-10-12 15:32:17 UTC
played for      991s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, danny_office, executive_office
unlocked objs   4: danny_office_pc_2, victoria_computer, executive_office_suitcase_2, wall_safe_server
inventory       12: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, CyberChef Workstation, Zero Day Transaction Log, Personal notes (unsent), Unsent email to the night team (raw source), Client Roster, Hidden USB Drive, Exploit Catalogue
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, night_transition, victoria_sterling, night_guard, danny_foster
flags submitted 4: flag{...vm_network_1_ea2439}, ..._2_6f154b, ..._3_58e392, ..._4_8d71ea
globals set     40: (briefing_played ... whiteboard_seen; includes debrief_played, directive_decoded, directive_guessed, danny_fate, victoria_fate, victoria_choice_made)

VERDICT: progress recorded — 6 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
```

Run 2 (game 2099, ending-only, console-set night state):

```
unlocked objs   0:
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling
flags submitted 0:
VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```
