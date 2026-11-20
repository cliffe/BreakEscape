# m03 pass 2: re-walk of the cycle-3 room interaction fixes

Tester: Sonnet-class subagent, 2026-10-12, headless (load about 1), speed fast, keyless server :3001. Question answered: plumbing only (do the F-1, F-2, F-3 fixes hold). Not a solvability run.

- **Run A**, game 2107, session log `tools/playtest/m03-rewalkC3-session.jsonl`. Day state, played for real: lobby, conference room (badge cloned from Ffion's lanyard with the dictionary attack, Save, Emulate at the conference reader), hallways, Danny's office by day.
- **Run B**, game 2109, session log `tools/playtest/m03-rewalkC3-night-session.jsonl`. **Exercised, not earned**: all seven rooms unlocked server-side with `tools/playtest/unlock-all-rooms.rb`, and `mission_phase` set to `act2_infiltration` through the console so the night scene and Danny appear. No keys, picks, Victoria clone or flags were earned in this run. Executive Computer password `Sterling2010` was typed from memory of the brief, not found in-game.
- Maps were being edited by another agent during the run (git showed modified `room_zds_*` files). I opened each game once and did not reload, so each run saw one consistent map snapshot; no mid-run map change was noticed.
- No tool call was refused.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Staff Access Badge clone | cloned card | Ffion's lanyard, clone choice, dictionary attack (run A) | yes |
| Server room, exec office, Victoria clone | unlocked server-side | none | **no (exercised, not earned)** |
| Executive Computer password | `Sterling2010` | helpdesk slip, plaque year | no (only typed; the lock result was not the point) |
| Flags | none used | n/a | n/a |

Everything past the conference door and the exec/server doors is exercised, not tested.

## Per-room results

"Menu" means the "INTERACT WITH..." pick-one list. Every interact reported `mode: direct`, with no menu element visible afterwards, unless noted.

### reception_lobby (run A)

| Object | Result |
|---|---|
| Company Founding Plaque (230,35) | `moveToNear` stopped at (217,55), 23 px away, on the floor in front of it. Opens the read-in-place display ("A brass plaque behind the desk... Founded 2010 by Victoria Sterling"). No menu. PASS |
| Building Directory (14,119) | Opens the display. Approach stops 31.3 px away, just inside the 32 px range (same as before, harness-sensitive). PASS |
| Ffion Rees (241,120) | Chat opens where she stands. Full hub transcript (59 turns). On the second visit the clone choice appears, the flipper opens over the chat. PASS |
| North exit door (48,32) | Walked to the door (arrived 27 px from it): no menu, `enter` crossed on the first call, both ways, no pick-one. F-1 PASS |

### conference_room_01 (run A)

| Object | Result |
|---|---|
| Presentation Materials (-240,99) | Opens directly (`mode: direct`, notes minigame). No menu. F-3 PASS for this object |
| Conference Whiteboard (-224,-104) | Opens the display directly. PASS (harness reports `no-effect-confirmed`; the display dialog was up, as in B2) |
| Chairs (5 `exec_chair_*` sprites) | Not in the `room` scan, not scenario objects, no `interactable` flag. I did not make a physical canvas click on one, so this rests on the inspection plus the room scan. PASS (by inspection) |
| Victoria Sterling | Not driven this run (not in scope). |
| Door to main_hallway | Walks both ways. PASS |

### main_hallway and executive_wing_hallway

| Check | Result |
|---|---|
| main_hallway to lobby, conference, server room, exec hall | All walk both ways. Conference was opened for real with the cloned badge; the server room and exec hall via the server-side unlock. |
| executive_wing_hallway to danny_office, executive_office, main_hallway | All walk both ways. Terry Mott present, patrolling (504,-59). |

### danny_office (runs A and B)

| Object | Result |
|---|---|
| Performance Review (460,141) | Opens directly. PASS |
| Family Photo (418,142) | Display dialog opens (harness says `no-effect-confirmed`, dialog up). PASS |
| Danny's Workstation (366,131) | Container opens directly. `moveToNear` still warns `viaMenu` with the Family Photo (26 px apart) but no menu appeared in either run. PASS, borderline geometry |
| Danny Foster (528,97) | Night only, appears in run B. Chat opens where he stands. PASS |

### server_room (run B, exercised not earned)

| Object | Result |
|---|---|
| Server Room Whiteboard (244,-358) | Opens, direct. PASS |
| VM Access Terminal (215,-256) | Opens, direct. PASS |
| Drop-Site Terminal (149,-182) | Opens flag-station, direct. PASS |
| CyberChef Workstation (98,-181) | Laptop screen opens, direct; closed with the x button. PASS |
| Filing Cabinet (36,-359) | Lockpick minigame opens, direct (not picked). PASS |
| Wall Safe (214,-354) | PIN dialog opens, direct (title "Enter PIN for item", bridge flags it as a mismatch: F-4 from B2, wording only). Whiteboard 30 px away did not intrude. PASS |
| Door | Walks both ways. PASS |

### executive_office (run B, exercised not earned)

| Object | Result |
|---|---|
| Desk Drawer (493,-242) | Opens directly, contents "Hidden USB Drive". Reopened a second time: still direct, no menu. F-2 PASS |
| Executive Computer (450,-281) | Password dialog opens (bridge mismatch on title, as F-4). `lock` with `Sterling2010` opened the container with the unsent email, client roster and the helpdesk slip. PASS |
| Filing Cabinet (576,-361) | Lockpick minigame opens, direct (not picked). PASS |
| Chairs (444,-230), (480,-230) | Now `exec_chair_back1`: not scenario objects, no swivel flag, absent from the `room` scan. The (480,-230) chair no longer joins the drawer's menu. PASS (by inspection; no physical click) |
| Door | Walks both ways. PASS |

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| R-1 | observation | F-1, F-2, F-3 from `PASS2_REGRESSION_B2.md` hold: no pick-one menu at the lobby exit, the plaque (23 px away) and drawer open directly, conference Presentation Materials opens directly, chairs are not interactable by data. The chairs were not clicked physically. | Run A lines for the lobby, run B for the CEO office |
| R-2 | minor (carried) | Building Directory is reachable only at 31.3 px plain distance, 0.7 px inside the 32 px range. A player who stops slightly short will get no response. Same as B2. | Game 2107, `moveToNear reception_lobby_notes_0` |
| R-3 | minor (carried, wording) | Wall safe and Executive Computer dialogs are titled "Enter PIN/password for item" (F-4). | Game 2109, interact `wall_safe_server`, `victoria_computer` |
| R-4 | observation | Danny's Workstation and the Family Photo are 26 px apart; `moveToNear` predicts a menu, none appeared. Worth keeping apart if the room is re-dressed. | Game 2107/2109 danny_office |
| R-5 | observation | Setting `mission_phase` from the console with `window.gameState.globalVariables` fires the night-transition events (a narration chat opened at once). Harmless; mentioned for anyone repeating the shortcut. | Game 2109 |

No visual problems (floating, overlapping, walking through furniture) were noticed in passing; I took no screenshots, and only watched positions through the room scan.

Counts: 0 blockers, 0 majors, 2 minors (both carried), 3 observations.

## verify-run.rb output

Game 2107:

```
game            2107  (mission 47)
played for      277s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, danny_office
unlocked objs   1: danny_office_pc_2
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott, danny_foster
flags submitted 0:
globals set     11: briefing_played, conference_reader_tried, danny_fate, engine_tutorial_declined, exec_wing_entered, ffion_night_story, lockpicking_guide_offered, mission_phase, player_approach, reception_badge_cloned, victoria_fate
VERDICT: progress recorded — 4 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```

Game 2109 (rooms unlocked by script, night state console-set):

```
game            2109  (mission 47)
played for      223s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, server_room, danny_office, main_hallway, executive_office, conference_room_01, executive_wing_hallway
unlocked objs   3: executive_office_suitcase_2, victoria_computer, danny_office_pc_2
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, CyberChef Workstation
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, terry_mott, danny_foster, victoria_sterling
flags submitted 0:
globals set     16: briefing_played, clone_call_done, cyberchef_guide_offered, danny_fate, engine_tutorial_declined, exec_office_entered, exec_wing_entered, exec_wing_night, ffion_night_story, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_explored, player_approach, victoria_fate, whiteboard_seen
VERDICT: progress recorded — 6 rooms beyond the first, 3 objects unlocked, 0 flags submitted.
```
