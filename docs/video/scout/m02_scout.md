# m02 "Ransomed Trust": trailer scout

Stage 1 of the 60 s mission trailer (`docs/video/recipes/mission-trailer.md`), by the method of `.claude/skills/video-scout/SKILL.md`, in the shape of `docs/video/scout/m01_scout_v2.md`. Nothing recorded, nothing changed in the repo. Scratch files: `/tmp/claude-0/-home-user/4ad0f0fc-9167-59c4-a9ed-f5bc845c2a2d/scratchpad/video-scout-m02/` (`lines.json`, `picked.json`, `tts_run1.txt`, the saved clips in `clips/`).

## 1. Headline

- **Part A, lines.** 36 lines were tested live on a fresh m02 game (game 114) through the real `/tts` endpoint. All 36 returned 200 `audio/mpeg`, with durations from ffprobe. The control line was refused with 403, so the check is live.
- **Top hook (Agent HaX):** "If they refuse and you're too slow, people die on the ward." (3.94 s, cached, 2 choices from the start). The no-choice alternative is the cold-open line "Agent. I'll be quick. The hospital can't afford slow." (3.94 s, fresh start).
- **Top NPC lines (4.5 s or less):**
  - Val Okonkwo: "So. Who are you and who says you're allowed?" (4.18 s, no choice, a walk-up line).
  - Sister Doyle: "The machines still run. Nobody's watching them." (3.70 s, 1 choice).
  - Mr Pryce: "Forty years I fixed buses." (3.41 s, 1 choice).
  - Bernie Nwosu: "Not answering. She hasn't answered since three." (3.82 s, 2 choices).
  - Dr Kim: "A replacement scanner. Three point two million." (4.30 s, 2 choices).
  - Val: "Alright. Stop there a sec." (2.09 s, no choice).
  - Bernie: "It matters to me. Somebody's been at my book." (3.50 s, 3 choices).
- **Antagonist (needs the user's say-so):** Graham Reeves, night security supervisor, the ENTROPY inside asset. Best line: "So you did the work." (2.33 s). Mid-line beat: "Money. That's the first guess, always." (3.50 s).
- **Minigame inventory:** 13 distinct minigame types, plus the PIN-cracker item and the field-guide viewers (section 4). The m02-specific ones are the ransomware display (six screens), the backup-recovery console and the CyberChef workstation.
- **Corrections for the orchestrator:**
  - Agent HaX's NPC id is `opening_briefing_cutscene`, not `agent_0x99`. `agent_0x99` is his phone.
  - The opening gate is `briefing_played`.
  - The recipe's "no room shows two NPCs" holds for most rooms but not for `hospital_ward`, which shows five NPCs at once (section 5).

## 2. Environment notes

- Found running: Postgres 16 `main` online. The keyless Rails server answered on 127.0.0.1:3001 (HTTP 301 on `/`). Nothing answered on :3000 (not touched).
- Started nothing and stopped nothing. Nothing needs restarting.
- Games created in the dev DB: 113 (first check), 114 (the fresh game used for the live test), 115 (confrontation head-start), 116 (office_corridor head-start), 117 (IT room with the Gary email flag), 120 (server room with a flag submitted). Runs 118 and 119 were aborted attempts (the `--submit-flag` shorthand in section 6).
- `new-game.rb` wrote `tools/playtest/m02_ransomed_trust-flags-game*.xml`. Those files are gitignored. `git status` is clean.
- `scenarios/m02_ransomed_trust/SOLUTION_GUIDE.md` does not exist. Only `stale_SOLUTION_GUIDE.md` is present, and I did not read it. The scenario and ink gave the spoiler list.
- `scenarios/m02_ransomed_trust/VM_FILES_TO_ADD.md` is stale. It still carries the superseded story (an "Asset #47" and a PIN-cracker recovery code). `VM_INTEGRATION.md` says that story was corrected on 2026-10-04. Do not use the stale file for any shot or caption.

## 3. Entry-state facts

- **Opening gate.** Global `briefing_played`. The briefing is a `timedConversation` on `opening_briefing_cutscene` with `skipIfGlobal: briefing_played`. To skip it: `--set briefing_played=true`. Side effect: the music switches to the `noir` playlist (the cold open plays the `cutscene` playlist). Verified: game 115 accepted the flag and the head-start list shows `set briefing_played=true`.
- **Start inventory.** The Lock Pick Kit and the player's phone (`player_phone`, which holds the HaX phone NPC) are in `startItemsInInventory`. No `--give` is needed for the lockpick shots.
- **`--start-room`** unlocks the start room and `reception_lobby`, and it moves the two phone NPCs (`agent_0x99` and `ghost`) into the new start room. Verified in games 115, 116, 117 and 120.
- **Confrontation flags.** `insider_identified`, `cover_burned`, `gary_evidence_recovered`, `awaiting_ambush` and `ransomware_deployed` are real scenario globals. `ransomware_deployed` defaults to true, so the ransom screens are live. `gave_key` is ink-local, so it cannot be set with `--set` (Bernie's returning-visitor path is not reachable by head-start).
- **VM flags.** `--submit-flag` needs the full id, `hospital_backup_server:flag_N`. The help text's `vm:flag_N` form was rejected in test 120. Standalone flags are fallback strings, not the real VM values.

## 4. Part A: voiced lines

### Method

- **Pool.** `tools/video/scout/dump-lines.rb m02_ransomed_trust --max-words 12` gave 476 lines (`lines.json`). Per speaker: receptionist 50, gary_whitlock 76, dr_sarah_kim 41, security_guard_patrol 66, ward_nurse 30, roaming_ward_nurse 9, night_security_supervisor 32, patient_bed2/4/5 11/15/7, narrator 40, opening_briefing_cutscene 16, director_netherton 1, agent_nightshade 3 (all debrief), closing_debrief_trigger 79 (ending).
- **Excluded on purpose:** the closing debrief and `agent_nightshade` (ending). Any line naming Reeves. Dr Kim's `boardroom_code` line (a code). Fight branches. Lines that name or hint the culprit by name. Patient lines with state-dependent (`deceased`) context were kept off the candidate list.
- **Live test.** `node tools/video/scout/tts-test.mjs --server http://127.0.0.1:3001 --game 114 --lines picked.json --out clips`. Control refused 403.
- **Paths.** Read from the ink. Choice counts are clicks from the NPC's start knot. "Fresh" means a new game with no flags. Ink file:line is the `=== knot ===` line's text line.
- **Not tested:** HaX phone lines (`agent_0x99`, no pool entries, no cached audio expected) and the Ghost phone.

### Summary

| Speaker | Lines tested | 200 audio/mpeg | Under 4.5 s | Notes |
|---|---|---|---|---|
| Agent HaX (briefing) | 16 (all pool lines) | 16 | 8 | Hub filler "What else?", "Anything else?", "Go on." are not hooks (0.9 to 1.2 s) |
| Bernie Nwosu (receptionist) | 4 | 4 | 4 | |
| Gary Whitlock (IT) | 2 | 2 | 1 | "After that it was..." is 4.90 s (over) |
| Dr Sarah Kim | 1 | 1 | 1 | |
| Val Okonkwo (security guard) | 3 | 3 | 3 | "Oi!" is event-driven |
| Sister Doyle (ward nurse) | 2 | 2 | 1 | "Twenty years..." is 5.21 s (over) |
| Mr Pryce (patient bed 4) | 2 | 2 | 1 | "...never trusted..." is 4.54 s (over by 0.04) |
| Graham Reeves (antagonist) | 6 | 6 | 5 | Finale only; user's say-so |
| Control (in no ink) | 1 | refused 403 | n/a | Check is live |

### Agent HaX (briefing)

Voice `Aoede`. Ink `m02_opening_briefing.ink`. NPC id `opening_briefing_cutscene`.

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **hax_1** (top) | If they refuse and you're too slow, people die on the ward. | 178 | `q_stakes` (3rd line of 4) | start > "Who did this?" > briefing_hub > "Walk me through the stakes. What happens if I'm too slow?". 2 choices. Fresh | 12 | 3.94 s | 200 |
| **hax_2** (alt, no choice) | Agent. I'll be quick. The hospital can't afford slow. | 40 | `start` (cold open) | none. First HaX line after Netherton's intro. Fresh | 9 | 3.94 s | 200 |
| hax_3 | Ask me on the way, then. The car's downstairs. | 59 | `start.c-2` | start > "Then we shouldn't be standing here. What do you need?" > Netherton's "Good." 1 choice. Fresh | 9 | 2.66 s | 200 |
| hax_4 | Here's what everyone gets wrong about this one. | 226 | `security_warning` | start > "Then we shouldn't be standing here. What do you need?" > briefing_hub > "Enough background. Give me my objectives." > mission_objectives > "What am I walking into? Security?" (3 choices). Fresh | 8 | 2.66 s | 200 |
| hax_5 | Tonight? Less than it's ever bought anybody. | 220 | `cover_story.c-1` | as hax_4 > "What's my cover?" > "So how much access does being expected buy me?" (4 choices). Fresh | 7 | 2.86 s | 200 |
| hax_6 | Or get hold of a physical credential that already exists. | 248 | `security_routes` | behind `security_warning` (4+ choices, not traced). **Hints an inside route; decide with the user** | 10 | 3.50 s | 200 |
| hax_7 | You don't find that with a scanner. Somebody tells you. | 279 | `final_instructions` | deep in the briefing (not traced). **Implies an inside contact; decide with the user** | 10 | 3.38 s | 200 |
| hax_8 | One entry in it matches this attack almost exactly. This is them. | 73 | `why_us` | start > "Why is SAFETYNET on a ransomware call?" (1 choice) | 12 | 4.46 s | 200 |
| hax_9 | Monitoring, medication records, imaging. All of it behind a ransom screen. | 41 | `start` | none (cold open, 2nd line) | 11 | 5.18 s | 200 (over) |
| hax_10 | After that, the machines keeping them breathing start going quiet. | 43 | `start` | none (cold open) | 10 | 4.13 s | 200 (over) |
| hax_11 | A cell we hadn't confirmed until Derek's notes named them. Ransomware Incorporated. | 153 | `q_ransomware` | start > "Who did this?" > "So who actually pulled the trigger on this?" | 12 | 5.74 s | 200 (over) |
| hax_12 | Ransomware Incorporated encrypted the access control server along with everything else. | 227 | `security_warning` | behind `security_warning` (3 choices) | 11 | 5.50 s | 200 (over) |
| hax_13 | Good luck, Agent. Forty-seven lives, twelve hours. Go. | (final) | `final_instructions` | deep in the briefing. Stake figure, not a casualty | 8 | 4.54 s | 200 (over) |
| hax_14 | What else? / Anything else? / Go on. | hub | `briefing_hub` | hub filler; not hooks | 2 | 0.94 to 1.22 s | 200 (not candidates) |

### Bernie Nwosu (receptionist)

Voice from the scenario. Ink `m02_npc_receptionist.ink`. NPC id `receptionist`. Visible at (6,5) in `reception_lobby` (start room).

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **rec_1** (top) | Not answering. She hasn't answered since three. | 118 | `route_consultant` | start > "I'm the security consultant Dr. Kim called in. It's about the ransomware." > "I can't. Ring her extension and ask her yourself." (2 choices). Fresh | 7 | 3.82 s | 200 |
| **rec_2** (top) | It matters to me. Somebody's been at my book. | 195 | `the_struck_entry` | start > consultant > "Dr. Kim called for emergency incident response..." > "Does it matter? You know I'm expected." (3 choices). Fresh | 9 | 3.50 s | 200 |
| rec_3 | Honestly? Nobody knows anything about anybody. | 385 | `ask_situation` | start > consultant > route > the_struck_entry choice > hub > "How bad is it upstairs, honestly?" (4 choices). Fresh | 6 | 3.70 s | 200 |
| rec_4 | Vending machine's broken, so it's not the caffeine. | 396 | `ask_situation.c-0` | as rec_3 > "How are you still standing?" (5 choices). Fresh | 8 | 3.17 s | 200 |

rec_2 hints at the struck booking (the insider's sabotage), without naming anybody. Keep the struck log in shot only as a blur if rec_2 is used.

### Gary Whitlock (IT)

Voice from the scenario. Ink `m02_npc_gary_whitlock.ink`. NPC id `gary_whitlock`. Visible at (6.3,5.8) in `it_department` (locked; the lockpick kit opens the room door from `staff_room`).

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| gary_1 | Fair enough. At least you're honest about it. | 373 | `email_reaction.c-1` | needs `gary_evidence_recovered` (the IT filing cabinet's `onPickup`). Then hub "Gary. Look at this." > "Your filing cabinet..." > "I need the same thing..." (about 4 choices). Head-start: `--start-room it_department --set gary_evidence_recovered=true` (accepted, game 117). **Expensive** | 8 | 3.70 s | 200 |
| gary_2 | After that it was "noted", and "noted", and "noted". | 120 | `open_solidarity` | start > "Seven times. I know." (1 choice). Fresh. Hook strong | 9 | 4.90 s | 200 (**over 4.5**) |

### Dr Sarah Kim (CTO)

Voice from the scenario. Ink `m02_npc_sarah_kim.ink`. NPC id `dr_sarah_kim`. Visible at (7.0,3.3) in `dr_kim_office` (unlocked, north of `staff_room`).

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| kim_1 | A replacement scanner. Three point two million. | 120 | `the_deferral` | start > "Then let's not waste any of it. Tell me how they got in." > explain_attack > "And you deferred it." (2 choices). Fresh; or `--start-room dr_kim_office` and walk up | 7 | 4.30 s | 200 |

The line implies Dr Kim's deferral (a board decision). It does not name the insider, but do not put it next to the Reeves beat.

### Val Okonkwo (security guard)

Voice from the scenario. Ink `m02_npc_security_guard.ink`. NPC id `security_guard_patrol`. Visible at (3,3.5) in `office_corridor`.

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **val_1** (top) | So. Who are you and who says you're allowed? | 107 | `first_encounter` | none: she stops you on the walk-up, before any choice. Fresh, walk into `office_corridor`, or `--start-room office_corridor` | 9 | 4.18 s | 200 |
| **val_2** (top, walk) | Alright. Stop there a sec. | 103 | `first_encounter` | none (first line of the walk-up). Fresh | 5 | 2.09 s | 200 |
| val_3 | Oi! I said authorised only! | 703 | `on_server_room_access.c-2` | event-driven: entering the server room without the card, then "Say nothing and walk past". Not walked. `--start-room server_room` does not reproduce it (not tested). Cover-restored (vouched) branch does not play it | 5 | 3.34 s | 200 |

Do not use "Don't you dare. Not in here, not tonight--" (the fight branch, `cover_challenge_options`). It starts a guard fight and sets `attacked_guard`.

### Sister Doyle (ward nurse)

Voice from the scenario. Ink `m02_npc_ward_nurse.ink`. NPC id `ward_nurse`. Visible at (10.5,4.2) in `hospital_ward`.

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **doyle_1** (top) | The machines still run. Nobody's watching them. | 144 | `stakes` | start > "Security consultant. I'm here to get your monitoring back." (1 choice). Fresh | 7 | 3.70 s | 200 |
| doyle_2 | Twenty years of training, and tonight I'm an alarm. | 98 | `ward_tour.c-0` | start > "What am I looking at? Talk me through the ward." > "Four minutes. And no alarm." (2 choices). Fresh. Strong hook | 9 | 5.21 s | 200 (**over 4.5**) |

### Mr Pryce (patient, bed 4)

Voice from the scenario. Ink `m02_npc_patient_bed4.ink`. NPC id `patient_bed4`. Visible at (3.1,6.6) in `hospital_ward`. His bed can change state with the ward timers (`emergency`, `deceased`): shoot early.

| ID | Exact text | Ink line | Knot | Path from start / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **pryce_1** (top) | Forty years I fixed buses. | 57 | `start.c-1` | start > "I am. How are you doing, Mr Pryce?" (1 choice). Fresh | 5 | 3.41 s | 200 |
| pryce_2 | ...never trusted a thing with no gauge on it. | 58 | `start.c-1` | as pryce_1. Leading silence | 9 | 4.54 s | 200 (borderline over) |

### Graham Reeves (antagonist; finale)

Voice `Enceladus`. Ink `m02_npc_asset.ink`. NPC id `night_security_supervisor`. Visible at (6,3) in `conference_room` (pin-locked room; start there with `--start-room conference_room`).

Who he is: the night security supervisor, the ENTROPY inside asset. He sabotaged the drill and the phone line, and he is the insider. The confrontation starts when the player names his badge from Ghost's log (the flag puzzle; the badge number is not copied here). A head-start can skip the puzzle: `--start-room conference_room --set insider_identified=true --set cover_burned=true` (accepted, game 115). Expected, not played.

| ID | Exact text | Ink line | Knot | Path / entry state | Words | Spoken | Live |
|---|---|---|---|---|---|---|---|
| **reeves_1** (top, clean) | So you did the work. | 171 | `confrontation` | entry: `insider_identified=true`. No choice before it (narration first). | 5 | 2.33 s | 200 |
| **reeves_2** (beat) | Money. That's the first guess, always. | 227 | `monologue_1` | entry as reeves_1 > confrontation_why > "You held the door open for people who put a ward on generators." (1 choice). **Mid-line beat: the full stop after "Money."** (no ellipsis) | 6 | 3.50 s | 200 |
| reeves_3 | Twenty minutes. On a twelve-hour generator. | 195 | `confrontation_the_call.c-0` | entry + `cover_burned=true` > "It cost me twenty minutes." (1 choice) | 6 | 3.86 s | 200 |
| reeves_4 | Everyone always is. Right up until the lights go out. | 335 | `choice_hostile` | fight branch: why > monologue_1 > "You don't walk out of here." Sets `insider_hostile`. **Use only if the user wants the hostile ending** | 10 | 4.10 s | 200 |
| reeves_5 | Good. Otherwise I'd have sat here another six hours being helpful, and that's far more tiring than this. | 173 | `confrontation` | entry as reeves_1. Beat after "Good." | 18 | 8.26 s | 200 (**over**; too long for a line, kept for the pause) |
| reeves_6 | You should have looked harder. | 373 | `press_terminal_ambush` | ambush: insider never identified, terminal closed. **Sets `mission_complete`: ending. Do not use** | 5 | 1.78 s | 200 |

Pause for the antagonist shot: reeves_2 has the beat built in (after "Money."), and the wide can play to it before the hard cut. There is no ellipsis in any Reeves line of 12 words or fewer.

## 5. Rooms with several NPCs visible together

| Room | Visible NPCs (tile x,y) |
|---|---|
| `hospital_ward` | **five**: Sister Doyle (10.5,4.2), Nurse Raval (4,5), Mr Pryce (3.1,6.6), Mrs Hargreaves (8.1,3), Ms Chen (7.7,6.6) |
| `reception_lobby` | Bernie Nwosu (6,5). The briefing trio sits at (480-520,500), off the map |
| all others | one NPC or none |

So the recipe's "no room shows two NPCs" does not hold for `hospital_ward`. Use it for a crowd or establishing shot. Walking shots need one NPC per room (Val, Gary, Kim, Reeves, Bernie).

## 6. Part B: set pieces and the minigame inventory

### 6a. Minigame inventory (every distinct type)

Answer column: "yes" means something on screen gives the answer, or a login, to a player who reads it. Values are never copied.

| Type (engine) | Object ids and room | Entry state | Answer or post-it on screen? |
|---|---|---|---|
| **lockpicking** (key lock; keyPins) | `it_department` (room door, from `staff_room`); `security_office` (room door, from `office_corridor`); `it_filing_cabinet` (safe, IT room); `entropy_field_case` (safe, server room, behind the rack legs) | Fresh, with the Lock Pick Kit in the start inventory. `--start-room staff_room` for the IT door; `--start-room it_department` for the cabinet; `--start-room server_room` for the field case | No. The security-office pick draws Val's catch (`lockpick_first`): do not show that one |
| **pin** (keypad) | `conference_room` (room door); `emergency_storage_safe` (`emergency_equipment_storage`); `dr_kim_safe` (`dr_kim_office`) | `--start-room staff_room` then west; `--start-room emergency_equipment_storage`; `--start-room dr_kim_office` | **Keypads show no digits.** But: the emergency and Dr Kim safes take the same four-digit code (scenario `requires` on both), which VM_INTEGRATION says is the hospital's founding year, and the reception plaque shows that year. The conference-room code is spoken aloud in Dr Kim's `boardroom_code` knot. Keep the plaque and subtitles out of frame |
| **password** | `gary_workstation` (`it_department`, pc, password lock) | `--start-room it_department` | **Yes.** A post-it on the monitor bezel (`showPostit`) lists login hints, and Gary's SSH notes file (text_file, opened from his workstation) also carries a login. Crop or drop |
| **ransomware-display** (6 screens) | `reception_terminal`, `reception_kiosk_1`, `reception_kiosk_2` (`reception_lobby`, fresh); `ehr_terminal_ward` (`hospital_ward`); `infected_terminal` (`it_department`, locked); `kim_office_terminal` (`dr_kim_office`); `security_desk_terminal` (`security_office`, locked) | Fresh for reception and the ward; head-start for the others (`it_department` and `security_office` are locked, so the room must open first) | No answer. Shows the ransom sum, a wallet address, a host line, and a patient count. Stake figures, not casualty figures. Timer live (`ransomware_deployed` defaults true) |
| **container** (safes, cabinets) | `it_filing_cabinet` (email and deferral notes: story, keep contents off screen); `entropy_field_case` (holds the PIN cracker); `entropy_staging_cache` (flag lock, server room); `emergency_supply_cabinet` (`emergency_equipment_storage`, medical cabinet); `dr_kim_safe`, `emergency_storage_safe` (pin, above) | As above. The staging cache needs `--submit-flag hospital_backup_server:flag_4` (not tested) | No. Contents are spoilers (ENTROPY key material, a manifesto, offline keys) |
| **backup-recovery** (m02-specific) | `hospital_recovery_console` (`server_room`, no lock) | `--start-room server_room --submit-flag hospital_backup_server:flag_3` (accepted, game 120). Source list gated by the restore manifest and key sets | No codes. Source names and requirement labels only. The restore hours appear in the ROT note (6c) |
| **workstation** (CyberChef, real tool) | `cyberchef_workstation` (`server_room`, no lock) | `--start-room server_room` | Input note `operator_site_note` (taped inside the rack door) is ROT-encoded. Decoded it gives restore-time hours and a line about paying. No PIN or login, but the output pane is a spoiler: **crop to the input pane** |
| **flag-station** | `flag_station_dropsite` (`server_room`) | `--start-room server_room --submit-flag hospital_backup_server:flag_3` | Not verified on screen. Real flags need the VM. Standalone flags are fallback strings |
| **vm-launcher** | `vm_launcher_rooting_for_a_win` ("SAFETYNET Field Console", `server_room`, `attack_vm`) | **Needs a SecGen VM. None in this container: cannot run here** | Not verified. The field-box text says it is the Kali kit (the "walk up to the VM" shot) |
| **rfid** (keycard reader) | `server_room` door (room lock `rfid`; keycard from Gary) | Start in `server_room`, or Gary's keycard | No |
| **phone-chat** | Player phone (start inventory; `agent_0x99`, the HaX phone); `ghost_terminal_device` (`it_department`, Ghost's planted device); `press_terminal` (`conference_room`, hospital comms) | Fresh for the HaX phone. Ghost's device and the press terminal are later | HaX phone: no answer; no cached audio (not in pool). Ghost and press terminal carry the ransom offers and the exposure decision: **spoilers, not for the trailer** |
| **person-chat** | Bernie, Gary, Kim, Val, Sister Doyle, Nurse Raval, Pryce, Hargreaves, Chen, Reeves | Section 4 | No |
| **notes / text-file** | About 42 notes and 5 text files. Read for this inventory: the reception plaque (the year: yes), Gary's password sticky note (IT room: yes), Gary's SSH notes file (yes), the ROT site note (6c). Others not read | Fresh and head-starts | See rows above |
| **pin-cracker** (item, not a screen) | Inside `entropy_field_case` | Takeable after the case opens | No. In the inventory it changes the PIN minigame (`hasPinCracker`) |
| lab-workstation (field guides, 9 objects) | `m02_*_field_guide` objects (reference pages with lab links) | Fresh | Not minigames. Reference only |

13 distinct minigame types (lockpicking, pin, password, ransomware-display, container, backup-recovery, workstation, flag-station, vm-launcher, rfid, phone-chat, person-chat, notes/text-file), plus the PIN-cracker item and the field-guide viewers. There is no plain desktop (`pc`) minigame: every `pc` in m02 is a password or ransomware screen.

Answer-free crops for the crescendo (in order of ease): the ransomware screen (crop to the title and the amount), the RFID card tap, the pin keypad (no digits), the backup-recovery console (source names only), the flag station (not verified: check). Not usable: Gary's workstation (post-it), the CyberChef input pane until cropped, the reception plaque.

### 6b. Real tools on the mission's VM (for the "walk up to the VM" shot)

- **Station.** `vm_launcher_rooting_for_a_win` ("SAFETYNET Field Console") in `server_room`. `vm_object('attack_vm', {"title":"kali","ip":"172.16.0.2"})`. The attacker box is `attack_vm` (SecGen base Kali, MSF).
- **Attacker box modules (SecGen XML).** `parameterised_accounts`, `iceweasel` (browser), `kali_top10`, `kali_web`. The contents of the last two are not in the repo and could not be checked here.
- **Target** (`hospital_backup_server`, Debian 12 KDE): `proftpd_133c_backdoor` (ProFTPD 1.3.3c backdoor, root post-exploit), anonymous FTP leaks (`strings_to_pre_leak`), `ssh_root_login`, the `gary` account, `handy_cli_tools`.
- **Story path the trailer can show:** anonymous FTP (flags 3 and 4, pre-login), the ProFTPD backdoor (flag 2), SSH login as Gary (flag 1), and CyberChef decode for flag 4. This is not Hydra (m01's tool). Show only these, not the m01 footage.
- **Placeholder rule.** Until in-game VM capture exists, the real-hacking slot stays a marked placeholder, as the recipe says.

### 6c. Other set pieces (not on the recorded list)

| Set piece | Room and id | Entry state | Answer on screen? | Visual |
|---|---|---|---|---|
| Ransom screen (reception) | `reception_lobby`, `reception_terminal` | Fresh | No | Good, red glow (`ransomware_display` lighting) |
| EHR ransom screen (ward) | `hospital_ward`, `ehr_terminal_ward` | Fresh, lit | No | Good, cool blue glow |
| Server rack, CyberChef | `server_room`, `cyberchef_workstation` | `--start-room server_room` | Crop the input (6a) | Strong, dark motion-lit room |
| Backup recovery console | `server_room`, `hospital_recovery_console` | As above, with the flag | No | Strong: a clinical console |
| Gary's workstation (post-it) | `it_department`, `gary_workstation` | `--start-room it_department` | Yes | Dark-ish IT office, one screen. Crop only |

## 7. Lighting and the drop

From `ruby scripts/lighting_lookup.rb scenarios/m02_ransomed_trust/scenario.json.erb`. Rooms that start dark and strike on entry (`mode: motion`):

| Room | Config | Cheapest entry |
|---|---|---|
| `ward_vestibule` | motion, flicker | **Fresh, one step east of reception.** Best drop |
| `staff_room` | motion, unlocked | `--start-room office_corridor`, one step north. Good atmosphere (whiteboard, lanyard) |
| `server_room` | motion, dark ambient, racks glow on entry; rfid door | `--start-room server_room` (already unlocked as start room) |
| `security_office` | motion, key lock | Locked; lockpick from `office_corridor`. Val catches picks here |
| `ward_hall` | motion, `offAfter` 75 (lights go off 75 s after the player leaves) | Route from `hospital_ward` west |
| `ward_approach` | motion, `offAfter` 75 (as above) | Route from `ward_vestibule` east |
| `emergency_equipment_storage` | motion, flicker | Route from `hospital_ward` east |

Lit at start: reception, hospital_ward, it_department, conference_room, dr_kim_office, office_corridor.

## 8. Swivel chairs and props near a door (walking shots)

Engine check (`public/break_escape/js/core/rooms.js`): a swivel prop is a `chair-*` image, a `*-rotate*` image, or a static swivel prop (`crash_cart1`, `wheelchair1`, `linen_cart1`, `iv_stand1`, `bed_empty`, `drug_trolley1`). The plain `hospital_chair_*` sprites are **static**, not swivel. Door tile positions come from the `doors` layer of the room template. Approximate.

| Shot | Where | Notes |
|---|---|---|
| Walk to the storage door, knock the chair on the way | `hospital_ward`: `chair-white-2-rotate3` (16.8,3.8) and `rotate5` (15.1,3.7) | Chairs about 2 tiles from the east door (19,2) to `emergency_equipment_storage`. The ward is lit, so the walk is clean |
| Walk past a cart | `hospital_ward`: `linen_cart1` (13.7,7.4) | Swivel prop, about 5 tiles from the east door row (19,7): a walk-past, not a door knock |
| Walk past a wheelchair | `ward_hall`: `wheelchair1` (3.9,3.9); `crash_cart1` (1.1,3.9) | Swivel props; the room is motion-lit |
| Walk beside an NPC | `hospital_ward`, Sister Doyle (10.5,4.2) | One NPC in shot; ward has five NPCs |

No pushable objects were found in the m02 maps.

## 9. Music

The m01 track is "Midnight Cipher Chase" (120 BPM, `Noir/`). `docs/video/recipes/README.md` lists m02 as "unassigned". Analysed candidates (`tools/video/edits/music/summary.json` and the per-track JSON):

| Track | Folder | BPM (analysed) | Analysed window | Used by another mission? | Note |
|---|---|---|---|---|---|
| Midnight Trigger | SpyAction | 114.69 | 92.994 to 122.29 s | No (no scenario uses it) | Weak end hit |
| Shadow Code 1 | CutScene | 118.65 | 114.322 to 144.662 s | No (not in any mission's track list) | It is in the game's shared `cutscene` playlist (sequential, with Shadow Codes 0 and 2), which plays on m02's cold open. A flat build |
| Cold Bond Circuit | SpyAction | 85.98 | 53.847 to 84.55 s | **Yes: `lab_tesseract_trials`** | Avoid |
| Steel Shadows in E Minor (Remastered) | Noir | 156.01 | 60 s analysis | **Yes: `m10_full_disclosure`** | Avoid |

Not recommended: "Shadow Protocol (Remastered)" (140 BPM, too frantic). Do not use "Midnight Cipher Chase (1)/(2)/(3)" (copies of the m01 track by name).

None of the candidates is exactly 120 BPM, so the 0.5 s beat grid needs a re-grid in `video-edit` (or a pick by ear). The orchestrator decides.

## 10. Candidate sets for the recipe slots

| Slot | Pick | Fallback |
|---|---|---|
| Hook (HaX) | hax_1: "If they refuse..." (3.94 s, 2 choices) | hax_2: "Agent. I'll be quick..." (3.94 s, no choice) |
| Drop (lights) | `ward_vestibule`, fresh, one step east of reception | `staff_room`, from `office_corridor` |
| Lockpicking | `it_filing_cabinet` from `--start-room it_department` (no answer) | `it_department` door from `staff_room` |
| Phone chat | HaX phone (`agent_0x99`), fresh; hold 0.5 s longer | Ghost's device (spoiler: check first) |
| Keypad | `emergency_storage_safe` (3 digits, not the code; crop the plaque) | `dr_kim_safe` |
| Server or lab set piece | `hospital_recovery_console` with `--submit-flag hospital_backup_server:flag_3` | `cyberchef_workstation` (crop) |
| Real tool | `cyberchef_workstation`, input pane only | (none) |
| Minigame crescendo | ransomware screen, PIN pad, backup-recovery console, RFID card tap, lockpicking, phone chat, CyberChef (crop), flag station (check) | the password screen only if cropped |
| NPC lines (3) | Val "So. Who are you..." (4.18 s); Doyle "The machines still run..." (3.70 s); Pryce "Forty years I fixed buses." (3.41 s) | Bernie "Not answering..." (3.82 s); Kim "A replacement scanner..." (4.30 s) |
| Walking shots (3) | W1: walk up to Val, "Alright. Stop there a sec." (2.09 s); W2: `hospital_ward` east, knock the chair at (16.8,3.8); W3: beside Sister Doyle | Walk past the `ward_hall` wheelchair |
| Antagonist | "So you did the work." (2.33 s), entry `--start-room conference_room --set insider_identified=true` | "Money. That's the first guess, always." (3.50 s, the beat) |

The NPC picks come from three NPCs (Val, Doyle, Pryce), with Bernie and Kim as backup.

## 11. Spoiler judgements

- **Keep off screen:** every code, PIN, password and login (the plaque, Gary's notes, the keypad answers); the Ghost phone (the offers); the press terminal (the ransom decision); the ROT note output; the closing debrief; the Reeves ambush (sets `mission_complete`); Reeves's own culprit reveal; the night log that names Reeves; the Gary email contents; the IT filing cabinet's contents.
- **Usable with care:** the ransom sums and the patient count (stakes, not casualty figures); "Forty-seven" (a stake, not a death toll); the hint lines hax_6 and hax_7 (they imply an inside route; decide with the user); "Somebody's been at my book" (rec_2, a hint at the struck booking).
- **User's say-so:** the antagonist (Reeves) and the "pause" line; the hostile line reeves_4 (a fight); and anything that names him.

## 12. What was not verified

- **Nothing played in a browser.** Entry states come from the ink, the scenario and `new-game.rb`, which accepted each one (games 114 to 117 and 120; game 115 for the confrontation). The takes stage proves them.
- **Live lines:** the 36 `/tts` results are the evidence. Every Part A duration is the ffprobe value on the cached clip.
- **Paths** were read from the ink and not played. Hub choice counts can be off by one where a knot has a conditional choice.
- **Walking coordinates and door positions** come from the map JSON and the room template (door tiles are the same in each room type). Not checked on screen.
- **Minigame visuals:** no screenshots were taken. The "answer on screen" column is from the scenario data and the engine source, and is marked "not verified" where the screen was not read.
- **VM content** (`kali_top10`, `kali_web`, the flag-station display, the vm-launcher screen) cannot be checked in this container. The SecGen modules are not in the repo, and no VM runs here.
- **CyberChef licence** not re-checked (m01 checked it).
- **Patient states** (`emergency`, `deceased`) can change the ward shots over time. Shoot early.
- **Stale files** (`VM_FILES_TO_ADD.md`, `stale_SOLUTION_GUIDE.md`) were not used for any fact in this report.
- **Restart commands:** none needed. The server on :3001 and Postgres were up when the scout began and are still up.
