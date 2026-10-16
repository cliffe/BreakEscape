# m03 Ghost in the Machine: engine regression playtest, 2026-10-16

Question answered: **plumbing and engine regression** (does the mission still work against this round's engine changes), plus a small amount of unexpected-behaviour play (a fight, two knockouts, two reloads). Not a blind run and not a solvability pass.

- Run type: regression, answers known. Route source: `TESTING_WALKTHROUGH.md` (pass 5), checked against the scenario and ink.
- Game id: **2589** (mission 47), keyless server :3001. Headless (other playtests were running). One session, stopped at the end.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m03-regression/session.jsonl` (1360 lines, 1359 commands). Screenshots are in the same folder (`s01`..`s07`).
- Flags XML: `tools/playtest/m03_ghost_in_the_machine-flags-game2589.xml`.
- **Credits reached: yes.** Terry was KO'd, Victoria arrested, Danny protected. Credits lines read from `#bv-cr-label` while they played (listed below). About 31 minutes of wall clock.

## verify-run.rb output (full)

```
game            2589  (mission 47)
created         2026-10-16 19:22:18 UTC
last write      2026-10-16 19:52:59 UTC
played for      1841s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office, danny_office
unlocked objs   4: victoria_computer, executive_office_suitcase_2, exec_filing_cabinet, wall_safe_server
inventory       12: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, CyberChef Workstation, Unsent email to the night team (raw source), Client Roster, Hidden USB Drive, Zero Day: A Brief History, Exploit Catalogue, Zero Day Transaction Log
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott, danny_foster
flags submitted 4: ..._vm_network_1_2ddd88, _2_a0807c, _3_c9844e, _4_cbbeaa
globals set     48 (includes guard_knocked_out, danny_fate, victoria_fate, victoria_choice_made, debrief_played, transaction_log_read, night_confrontation_ready)

VERDICT: progress recorded — 6 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Reception badge clone | (card) | Ffion Rees, "Lean in by her lanyard" choice, dictionary attack | before conference door | yes |
| Victoria's card clone | (card) | Whiteboard drift in her interview, Darkside attack | before night turn | yes |
| Founding year 2010 | read | Company Founding Plaque, reception | first minutes | yes |
| Executive Computer password | `Sterling2010` | Plaque (2010) + helpdesk slip text on the computer ("surname plus the year we were founded") | after the plaque | yes (a near miss `sterling2010` was tried first) |
| Executive office door | (lockpick) | Lock Pick Kit, `completeLockpick` | — | PASS (assisted) |
| Filing cabinet | (lockpick) | same | — | PASS (assisted) |
| Wall safe PIN | `5829` | The unsent email on the executive computer is Base64; I read the raw source but my attempt to decode it in the in-game CyberChef (URL hash into the iframe) did not produce output, so the PIN was typed from the walkthrough | step after the draft | **no: exercised, not earned** (the draft was found first, the decode step was not completed) |
| Flags 1-4 | `<flag:N>` | Drop-Site Terminal; VM Access Terminal opened and showed its instructions; no VM in standalone | server room | **no: exercised, not earned** (flag supplied by the harness) |
| Terry Mott KO | debugKO | — | after two fought knockouts | PASS (assisted) |

Everything downstream of the flags is exercised, not proven for a real VM build.

## Severity table

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | minor | After saving the receptionist clone in the first attempt, an empty dark `.minigame-container` stayed on screen with world input disabled and Esc refused; a page reload cleared it | **Unconfirmed, suspect harness race.** Not reproduced on the clean second attempt. See F1 |
| 2 | minor | After a hostile Terry's hits, the player's position changed by about 20 px westward each time and `room_entered main_hallway` fired with no movement command from me | Suspect engine (knockback or leash side effect). See F2 |
| 3 | minor | The toast for interacting with a hostile NPC reads "They're past talking." not "He's past talking." | Wording only, possibly intended. See F3 |
| 4 | minor (observation) | After a Restart, Terry is calm but on re-entry his ink still says "Right. I warned you." and he is hostile again within seconds, hitting four times (-40 HP) before the player can act | Likely working as designed (ink memory); noted for the design owner. See F4 |

No blockers. No majors.

## What passed

Engine changes exercised (all in game 2589):

| Change | Result | Evidence |
| --- | --- | --- |
| Leash: hostile NPC gives up at their room's door | **PASS.** Terry stayed in `executive_wing_hallway` while I stood in `main_hallway` for 10+ seconds, twice; no attack in the hall | room scans, HP constant at 70 then 40 |
| Attacks pause while the phone is open | **PASS.** With Terry about 24 px away (inside attackRange 32), HP stayed at 10 for 8 s with the phone open, no hit closed it. Closing the phone, the next hit KO'd me within about 2 s | brief reads, `s05` |
| Attacks pause during a conversation | **Partly.** In the Terry "Run" conversation no HP was lost until `conversation_closed:terry_mott`, then three hits in a row. Terry was about 85 px away, so not a tight test | drain log |
| Restart after a knockout resets non-KO'd hostile NPCs calm | **PASS.** Twice. After each Restart `npcHostileSystem` showed Terry `isHostile:false, currentHP:100`, and `guard_attacking` was `false` (it was `true` before the Restart) | state reads. I could not see the `reset:true` event itself because the page reloads on Restart and the bridge log is lost, so the global clearing could also come from the `game_loaded` backstop mapping |
| `guard_attacking` clears on Restart | **PASS** (as above) and sets again when Terry turns hostile on re-entry | drain log: `global_variable_changed:guard_attacking` |
| NPC HP saved with hostility over a reload | Terry had 80 HP when I was KO'd; after Restart he was at 100 and calm (reset behaviour, not a restore) | state reads |
| Interacting with a hostile NPC toasts | PASS (wording, F3) | `s05-hostile-interact.png` |
| No vision cone or health bar on KO'd NPC | **PASS.** Hostile Terry showed a green cone and red health bar (`s04`); KO'd Terry showed neither (`s06`) | screenshots |
| Per-NPC attack numbers | Terry hits for 10 (measured from player HP drops, not read from NPC state before he went hostile). Player jab did 10 per hit on Terry (100, 90, 80) | HP reads |
| Phone choices on number keys, "more choices" cue | **PASS.** Choice 1 selected with key `1`; the "▼ more choices" cue showed with the fourth choice hidden below the fold (`s02-phone-hub.png`). Choices have no visible numbers on screen | state and screenshot |
| PIN keypad title names the lock | **PASS.** "Enter PIN: Wall Safe" (`s03`) | state |
| Password keypad "case-sensitive" on a near miss | **PASS.** "Incorrect password. Passwords are case-sensitive. 2 attempts remaining." | state |
| RFID reader denies a wrong card | **PASS.** Staff badge at the server-room reader: "Card not accepted". (The empty-cloner case was not reachable: the cloner always held the receptionist badge) | state |
| Container header/description text variants | Seen on Executive Computer (slip text in header) and Wall Safe; no fault | state |
| Fists mode: click on floor walks | Not tested separately; jab mode `interact` on Terry punched | — |
| Long HUD captions wrap | Objectives panel wraps all task titles (`s04`, `s06`) | screenshots |
| "* required" key on aims | Shown on "Search Sterling's Office" (it has two required tasks and one optional). That aim is not in `concludeRequires`, so "required" here means score, not ending | `s06` |

Mission flow (all PASS):

1. Opening briefing played; Mission Brief note; tutorial declined.
2. Plaque 2010; receptionist sign-in; clone choice appeared in the reopened hub ("Lean in by her lanyard and let the cloner read her badge."); MIFARE default-keys dictionary attack; save; `clone_reception_badge` complete.
3. Conference door opened with the clone; Victoria's interview (eager recruit); whiteboard drift; Darkside attack ~30 s; save; "Do. The good ones always want a night on it."; `leave_until_dark` open.
4. Night turn on entering `main_hallway` (`clone_call_done`); HaX text thread incl. Danny hint; server-room door took the Executive Keycard.
5. Whiteboard (ROT13) read, `whiteboard_seen`; CyberChef Workstation taken (opens the real tool); VM terminal shows instructions; four flags accepted (`night_confrontation_ready` set after the fourth); Transaction Log given and read (`find_operational_logs` complete).
6. Terry spotted me ("Building's shut, mate."), maintenance excuse -> "I don't have time for this" -> hostile; Run option leads to fight.
7. Executive office (assisted pick), computer, draft, roster, hidden USB, filing cabinet, wall safe, catalogue; Danny's confrontation (testify, then "Sterling goes down").
8. Victoria's night confrontation (SAFETYNET, Ten thousand for target selection, "Consultancy. Is that what you'll call it in court?", arrest); debrief; bond visualiser credits.
9. Flags submitted before Restart persisted across both Restarts (4 of 4 still listed afterwards).

Credits read from `#bv-cr-label`: MISSION COMPLETE / GHOST IN THE MACHINE / ZERO DAY SYNDICATE: EXPOSED / ST. CATHERINE'S LINK: PROVEN / ZERO DAY CATALOGUE: IN SAFETYNET HANDS / PHASE 2 DIRECTIVE: RECOVERED BY THE AGENT, decoded at HQ / APPROACH: THOROUGH / STERLING'S NHS QUESTION: ASKED WHAT THE BUYER WANTED IT FOR / VICTORIA STERLING: ARRESTED / DANNY FOSTER: PROTECTED / TERRY MOTT, NIGHT GUARD: KNOCKED OUT ON SHIFT / THE ARCHITECT: identity still unknown / ENTROPY: Still operational. The debrief (HaX: "The guard caught you once, and then you put him on the floor.") agrees with the credits and with what I did.

Reloads: (a) mid-mission, in the reception lobby after the clone, game reloaded to the title screen, state restored (inventory, tasks), clone not yet saved so redone; (b) after all four flags and the transaction log, `sync` then reload: title screen, then the session-resume overlay appeared (Resume / Restart / New Session); Resume restored all tasks, inventory and `find_operational_logs` complete. Plus the two Restarts (each also a page reload).

## What failed or looked odd (repro)

**F1 (minor, unconfirmed): empty dark overlay after saving the RFID clone, first attempt.**
Repro as it happened: fresh game 2589, bootstrap, then `converse ffion_rees` with choices `["sign","Thank you"]`. It ran to its 60-turn limit and its choices included "Lean in by her lanyard...". Immediately after, I called `interact ffion_rees`. Two RFID screens appeared one after the other (first a MIFARE card, then an EM4100 card with Facility 65), I clicked Save, and the world went dark: `blockingUi` was `{classes:"minigame-container", text:""}`, `activeMinigame:null`, Esc refused with `blocking-ui`, `dismissBlockingUi` reported no buttons. It stayed for 15+ seconds (`s01-after-save.png`). A page reload cleared it. On a clean second attempt (open the conversation, choose the clone option once, continue, crack, save) the same step worked with no overlay. I suspect the harness's `converse` left a queued second clone event. Classification: could not complete step; suspect harness race; engine not ruled out. If it can be reproduced by a human who double-triggers the clone choice, a player could be soft-locked until reload.

**F2 (minor): player pushed west by hostile Terry's hits, crossing into `main_hallway`.**
Repro: night, Terry hostile (see F4), stand at the east edge of the executive wing near x 340. After the conversation closes, three or four hits land and the player ends at x 316-319 with `room: main_hallway`; the drain log shows `room_entered main_hallway` and `room_exited executive_wing_hallway` with no movement command from me (`s04-after-run.png` shows the player at the wing's west doorway). Repeated on the second visit (x 330 to 316). It could be knockback, or the leash pushing the player out. If knockback is new this round, it was not on the change list. Hits also removed the ability to approach Terry from the doorway without taking 20-40 damage.

**F3 (minor): toast wording.** Quoted on screen: "They're past talking." The task brief listed "He's past talking." I did not check which is intended.

**F4 (observation): Terry after a Restart.** Restart leaves him calm at his post, but `challengeOnSight` and his ink (`I warned you` knot) still fire when the player re-enters, and he is hostile again within seconds. The visible effect is that the executive wing (optional content) is not reachable after a fought knockout except by another fight or a KO. Not a blocker: the ending needs only the four flags and Victoria. This is probably the intended memory of the earlier incident; recording it so the owner can decide.

## Not exercised, and why

- Consumables (coffee, energy drinks, first-aid kits): none in m03 (grep of the scenario).
- Wheeled trolleys and office chairs rotating or colliding: the server-room chair did not move when I walked past it; not a pushable test.
- Room-emitter LEDs on racks, fire effect, hue of "above" glows: not looked at (no screenshot of the server room racks).
- Dotted-path conditions, `delayMs` on mappings, all-optional-aims completion, story-rate gameClock: no way to observe from outside; nothing visibly broken.
- Punch cone width: jab hits landed on Terry from an adjacent position only; the ±40 degree edge was not measured.
- Whether the first fought knockout balances: I started the second fight at 60 HP (after earlier hits), landed three jabs (Terry 100 to 80) and was KO'd. That is not a balance finding.
- Terry's "empty cloner just denies" variant: cloner was never empty.
- Harness notes (not game findings): `interact` on the plaque and directory reported `no-effect-confirmed` although their display dialogs opened (dismiss worked); `lock` with a PIN reported `ok:false` though the safe opened; `converse` on a long hub hits the 60-turn limit; `nearby` lists objects from the next room over (Company Founding Plaque showed up in the hallway and the exec wing at d 110-170).

## Counts

- Engine items exercised: 15. Passed: 13 (leash, phone pause, restart reset, `guard_attacking` clear, KO'd no cone, number keys, more-choices cue, PIN title, case-sensitive hint, RFID deny, per-NPC numbers, wrap, required key). Partly: 1 (conversation pause). Wording difference: 1 (toast).
- Not exercised: 8 (listed above).
- Findings: 0 blocker, 0 major, 4 minor (one unconfirmed harness-suspect).

## Fixes (2026-10-17)

Scenario/ink fixer. Engine items (knockback, toasts, vision cones, phone choice labels, dialog titles, seeded timestamps) went to the engine fixer at the same time and are not repeated here.

| # | Severity | Finding | Outcome |
|---|---|---|---|
| F1 | minor | Empty dark `.minigame-container` after saving the receptionist clone, first attempt only | **Deferred.** Suspect harness race (the `converse` 60-turn run left a second clone queued; the clean attempt had no overlay). No scenario cause found: the clone is one choice in Ffion's hub with one `#clone_keycard` tag. Re-check if a human reproduces it by double-triggering the choice |
| F2 | minor | Player pushed west by Terry's hits into `main_hallway` | **Engine (knockback), handed to the engine fixer.** Not scenario data |
| F3 | minor | "They're past talking." for Terry | **Fixed (231a7be6).** The engine reads `gender` (`combat-input.js` `pastTalkingMessage`). Added to Terry, Danny, Netherton (male) and Ffion, Victoria (female), from the ink's pronouns and voice notes. HaX, Nightshade and the narrators have none. The validator's NPC field list and the schema now know `gender` |
| F4 | minor | After a Restart Terry says "Right. I warned you." and is hostile again at once | **Fixed (231a7be6), the lead's Restart ruling.** The reset event (`npc_hostile_state_changed` with `reset: true`) now sets a new global, `terry_fight_reset`. Terry's ink checks it at `start`, `on_sighted` and the `guard_idle` re-entry, and diverts to a choice-free `fight_reset` knot. That knot clears his `guard_hostile` and `ordered_out` memory and the global, then routes through `start` as if the fight never happened. The challenge he made and the excuse he heard stay. `guard_detection_count` stays too, so the debrief still knows he caught the player. A player who had answered him gets one wary line ("Back on your feet, then. One wrong move and I'm on the radio."), then his hub. A player caught at a lock with no challenge first gets the first challenge ("You. The one with the picks."). `guard_attacking` already cleared on the reset (b2a394da), so HaX's hostile-guard hint and the lockpick catch follow the cleared latch. Route `r26_restart_resets_terry` covers both cases |

Checks: ink compiles (8 files); all 28 m03 routes run, r26 new and clean. r2's two "pick not found" misses (Victoria) predate this change; I checked against the stashed ink. dialoguelint: 2 warnings, both in Victoria's ink and unchanged. loopcheck: Terry at `start`, `on_sighted` and `guard_idle` with `terry_fight_reset=true` is clean. tagdiff on Terry: 18 structural differences, all from F4. Validator: schema passed, 0 errors, 9 issues (unchanged).

Browser check still owed: one Restart after a fight with Terry, then walk into his cone. Expect the wary line and no punches.

New spoken line (not voiced yet): Terry, "Back on your feet, then. One wrong move and I'm on the radio."
