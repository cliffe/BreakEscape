# m05 "Insider Trading": scenario design round 2, browser check (13 October 2026)

Question this run answers: do the six browser checks listed in `SCENARIO_DESIGN_REVIEW_P5_R2.md` hold in the real game (plumbing). It is a targeted regression run, not a blind one. The four VM flags were supplied by the harness ("flag supplied"); standalone has no VMs, so nothing here proves the VM stage is solvable. Any claim about VM content: needs checking against SecGen by the user.

- Build tested: working tree at the latest m05 commit (`8f2e512c`, "m05 pass 5, scenario design round 2"). No game file edited.
- Server: keyless :3001 only. :3000 not touched. Headless (load average 18 to 22, so timings are not representative).
- Harness: only the checked-in `new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`, plus the bridge commands. My shell helpers (scratchpad `m05-p5r2d-browser/lib.sh`) only chain `cmd.sh` calls. The dusting drags replay saved paths from an earlier report. Assisted steps: the briefcase pick (`completeLockpick`, real Lock Pick Kit carried: PASS (assisted)) and every Torres KO (`debugKO`, "combat not played"; the fight itself is not exercised).
- Sessions started and stopped: 2329, 2333, 2342, 2350, 2356 (each printed "session N stopped"; `ps` shows no playtest-session left).
- Screenshots (looked at where a check turns on them): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-p5r2d-browser/`.

## Games and session logs

| Game | Used for | Session log (repo) |
| --- | --- | --- |
| **2329** (A) | check 1 (met, accused, visited, named, visited), check 2 (yes), check 4 (deal fate, handed over), motive on the journal route | `tools/playtest/m05-p5r2d-game2329.jsonl` |
| **2333** (B) | check 1 (never met, accused, named, first meeting), check 2 (no), check 3 (vetting route), check 4 and 5 (unprovoked KO) | `tools/playtest/m05-p5r2d-game2333.jsonl` |
| **2342** (C) | check 3 (VM-first), check 4 and 5 (fight-line KO), one mid-mission page reload | `tools/playtest/m05-p5r2d-game2342.jsonl` |
| **2350** (D) | check 3 (KO route, no motive item), check 6 (Halloran KO'd), check 4 (third fate) | `tools/playtest/m05-p5r2d-game2350.jsonl` |
| **2356** (E) | check 1, the exact R2-M1 order (met, accused, named, first revisit) | `tools/playtest/m05-p5r2d-game2356.jsonl` |

Flags XML: `tools/playtest/m05_insider_trading-flags-game<id>.xml`. Mid-mission reload: C only.

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Halloran: reinstatement lines once, no suspension claim after the naming; first meeting after reinstatement; suspension greeting before it | **Pass** (A, B, E) |
| 2 | Recruiter ring-back after yes and after no ends "She hangs up first.", no "Think it over" | **Pass** (A yes, B no) |
| 3 | "Find out why he'd do it" ticks on the vetting route and the VM-first route, stays open on a KO route with no motive item | **Pass** (B, C, D; also ticks on the journal, A) |
| 4 | Debrief technical beat and fix line play once after "It's why nobody saw him", on any fate | **Pass** (A deal fate, B, C, D) |
| 5 | Debrief choices: unprovoked KO versus fight-line KO | **Pass** (B, D unprovoked; C fight line) |
| 6 | HaX "Where do I stand?" after Halloran's KO points at her desk | **Pass**, with a wording note (F1) (D) |

Counts: **0 blockers, 0 majors, 2 minors**, plus three notes.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
| --- | --- | --- | --- |
| Server hallway badge | cloned card (all five games) | Owen's lanyard, RFID cloner via "Lean over" | yes |
| Server-room password | `quantum2024` | Owen's sticky note after the incident-log reason (A, B, D, E: "Patricia's log has a crypto badge..."), or after Owen refused and Patricia signed it off (C) | yes |
| Badge log | item | Owen, "Whose?" (A, B, D, E; not C) | yes |
| Torres' office card | item | Owen after suspicion | yes |
| Briefcase contents (A only) | journal | pick lock, assisted | yes (assisted) |
| Vetting file (B, C, E) | item | Patricia | yes |
| Torres' print | lift | mug, dusting kit (replayed drags) | yes |
| `<flag:1>` to `<flag:4>` | harness values | Bludit terminal station | **no, flag supplied** |

The prerequisites for the flags (the server room, its password, the research-portal task) were earned in-game; the flag values cannot be earned in standalone, so the VM stage was exercised, not tested.

## verify-run.rb output

Game 2329:

```
game            2329  (mission 49)
created         2026-10-13 20:10:46 UTC
last write      2026-10-13 20:26:22 UTC
played for      936s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Upload Schedule, Data Package Manifest, Personal Journal
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_ffc714}, flag{m05_insider_trading_qdc_research_server_2_fbb895}, flag{m05_insider_trading_qdc_research_server_3_3df030}, flag{m05_insider_trading_qdc_research_server_4_87ef22}
globals set     52: architect_approval_confirmed, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, halloran_accused, it_notice_read, knows_full_stakes, knows_insider_profile, lockpicking_guide_offered, mission_complete, office_card_obtained, owen_refused_password, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_contacted_player, recruiter_deal_accepted, recruiter_deal_confessed, recruiter_deal_decided, recruiter_deal_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2333:

```
game            2333  (mission 49)
created         2026-10-13 20:26:28 UTC
last write      2026-10-13 20:37:21 UTC
played for      652s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, torres_office, server_room, data_center, research_lab
unlocked objs   0: 
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Upload Schedule, Data Package Manifest
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres, dr_halloran
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_7bb80c}, flag{m05_insider_trading_qdc_research_server_2_661adb}, flag{m05_insider_trading_qdc_research_server_3_dadb5a}, flag{m05_insider_trading_qdc_research_server_4_7dd6be}
globals set     50: architect_approval_confirmed, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_door_log, found_halloran_vetting, found_incident_log, found_manifest, found_upload_schedule, found_vetting_file, halloran_accused, it_notice_read, knows_full_stakes, knows_insider_profile, mission_complete, office_card_obtained, owen_refused_password, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_contacted_player, recruiter_deal_decided, recruiter_deal_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2342:

```
game            2342  (mission 49)
created         2026-10-13 20:37:34 UTC
last write      2026-10-13 20:48:02 UTC
played for      628s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   0: 
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, IT Notice: Server Room Access, Server Password Sticky Note, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, IT Spare Office Card
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_4736fc}, flag{m05_insider_trading_qdc_research_server_2_9ffb80}, flag{m05_insider_trading_qdc_research_server_3_0060a6}, flag{m05_insider_trading_qdc_research_server_4_67f043}
globals set     42: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_halloran_vetting, found_incident_log, found_vetting_file, it_notice_read, knows_full_stakes, knows_insider_profile, mission_complete, office_card_obtained, owen_refused_password, patricia_authorised_office, patricia_authorised_server, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_fight_offered, torres_identified, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2350:

```
game            2350  (mission 49)
created         2026-10-13 20:48:35 UTC
last write      2026-10-13 20:56:15 UTC
played for      460s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, server_room, torres_office, data_center
unlocked objs   0: 
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_1a62c0}, flag{m05_insider_trading_qdc_research_server_2_672792}, flag{m05_insider_trading_qdc_research_server_3_38e8bd}, flag{m05_insider_trading_qdc_research_server_4_bae2df}
globals set     36: architect_approval_confirmed, briefing_played, case_exfil, confront_stance, data_center_entered, debrief_played, door_log_held, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_door_log, found_incident_log, halloran_ko, it_notice_read, knows_full_stakes, knows_insider_profile, mission_complete, office_card_obtained, owen_refused_password, patricia_phone_available, player_approach, player_name, privesc_guide_offered, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2356:

```
game            2356  (mission 49)
created         2026-10-13 20:56:59 UTC
last write      2026-10-13 21:02:40 UTC
played for      341s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, server_room
unlocked objs   0: 
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, IT Notice: Server Room Access, Server Password Sticky Note
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran
flags submitted 3: flag{m05_insider_trading_qdc_research_server_1_a80735}, flag{m05_insider_trading_qdc_research_server_2_25887b}, flag{m05_insider_trading_qdc_research_server_3_4a1a45}
globals set     33: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, door_log_held, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, found_door_log, found_halloran_vetting, found_incident_log, found_vetting_file, halloran_accused, it_notice_read, knows_full_stakes, knows_insider_profile, owen_refused_password, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_identified, torres_suspected

VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 3 flags submitted.
Cross-check the specifics above against the report.
```

## Check results

Log line numbers are approximate (the nearest line carrying the text) and refer to the session logs above.

### 1. Halloran (games 2329, 2333, 2356): pass

- **Met, accused, visited again before the naming (A, log ~189).** Opening lines: "Security have suspended my access. I'm to wait here for the police. On your say-so, I gather." / "Ask what you came to ask." No "What else?". Screenshot `a_halloran_accused.png` (HaX's text on screen asking where she was on the twenty-third).
- **Met, accused, named, visited (A, ~441).** Her greeting was the plain hub line ("Go on, so."); the choice "It's David." gave "Patricia's given me my access back. I'll want an apology from you. Not tonight." once, then "I should have seen it...". After "He made his choice." and "That's all for now.", a third visit gave only "Quickly, please. I've work to do." No "suspended my access" anywhere after the naming. See note N1 for why the access-back line sat inside "It's David." in this game.
- **Met, accused, named, first revisit with no earlier revisit (E, ~206-228): the exact R2-M1 order.** She opened with "Patricia's given me my access back. I'll want an apology from you. Not tonight." Then "It's David." went straight to "I should have seen it. He was pulling away..." with no repeat. A later visit opened "Go on, so." Screenshot `e_halloran_hub_after_naming.png` shows the hub with that opening line and "5. It's David." still offered.
- **First meeting after reinstatement (B, ~329; accused on the vetting file, never met):** she opened with the same access-back line, then "It's David." continued into the guilt lines with no repeat, no narrator "coat on" line and no "suspended".

### 2. The Recruiter ring-back (games 2329, 2333): pass

- **After a yes (A, ~561).** Thread text: "Ring the TalentStack number back." / "We have an arrangement. Don't ring this number again." / narrator "She hangs up first." No "Think it over". Screenshot `a_recruiter_thread_yes.png`.
- **After a no (B, ~358).** "Ring the TalentStack number back." / "You said no once. I heard you." / "She hangs up first." No "Think it over", no "Still deciding?". Screenshot `b_recruiter_thread_no.png` (read it: both lines and the narrator line are there).
- After the hang-up the thread still lists "Ring the TalentStack number back." and "Leave it." as options; ringing again repeats the same one-line answer.

### 3. "Find out why he'd do it" (games 2350, 2333, 2342, 2329): pass

- **Vetting route, no picks (B).** Vetting file taken from Patricia before any suspicion (`found_vetting_file`, `case_motive` true), Halloran wrongly accused, then the front-door reason on Patricia's mobile. Task state read from `state`: `establish_motive` "active" until `torres_suspected` became true, then "completed" the moment the aim opened. Screenshot `b_motive_after_suspicion.png`: under "Find Out Why" the line is struck through and the aim's other tasks are open.
- **VM-first route, no picks (C).** Badge cloned, no log, no Halloran; Owen refused the password, Patricia signed it off, flags 1 to 3 in. After flag 3: `torres_suspected` true, `case_motive` false, task "active" (screenshot `c_motive_open_after_flag3.png`). Patricia "I need your help with something" then the vetting files: `found_vetting_file` and `case_motive` true, task "completed". The state held across the mid-mission reload (C ~255): globals and the completed task were kept.
- **Journal route (A, ~347).** With suspicion in and the vault paperwork read, the task stayed "active"; taking the journal from the picked briefcase completed it.
- **KO route, no motive item (D).** Badge log, Halloran KO'd, flags 1 to 4, office, print, vault; no vetting file, no briefcase, Torres struck before any conversation. After flag 3 (`torres_suspected` true, `case_motive` false) and at the vault, the task stayed "active" and is flagged required in the panel (screenshot `d_motive_open.png`: "Find out why he'd do it" with the required marker, every other task in the aims ticked). After the call-in the debrief and credits played and `mission_complete` and `debrief_played` were true; the task was still open at the end, as the reviewer expected.

### 4. The debrief's new beat (games 2329, 2333, 2342, 2350): pass

The three lines play once, straight after "In the logs, that looks exactly like an insider. It's why nobody saw him.", on four different endings:

- A (handed over, deal taken, ~699-707), B (unprovoked KO, stayed, ~493), C (fight-line KO, stayed, ~471), D (KO-first, stayed, ~417).
- "And the research portal. Old software with a known flaw nobody had patched, and an admin login sitting in a handover note." / "Once you were in, one account was allowed to run far more than its job needed. That's how you reached the Architect's sign-off." / "Patch it, rotate the logins, trim the rights. QDC's own staff could have done all three." Each appears once per debrief. Full debrief text: scratchpad `a_debrief.txt`, `b_debrief.txt`, `c_debrief.txt`, `d_debrief.txt`.
- The borrowed-trust line now reads "A colleague's badge, a colleague's password, his thumbprint." (no admin login), as R2-m3 intended.

### 5. Debrief choices after an unprovoked KO versus a fight-line KO (games 2333, 2350, 2342): pass

- **Unprovoked (B ~533, D ~445).** `torres_fight_offered` false at the KO. After "Elena's treatment is unfunded. He never talked to us, so there's no deal to hang it on." the choices were "1. I didn't give him the chance. The upload was running." and "2. Is there any way back to a cooperation deal?". No "He chose to fight". HaX's reply: "No. And he'll say so, if anyone ever asks him." The subdued line had no "Textbook, once it came to that." Screenshot `b_debrief_choices.png` (looked at).
- **Fight line (C ~499-515).** Torres taken through "It's over, David" to "Drop the philosophy. Step away, or I make you." and his "comes at you" line; `torres_fight_offered` true. The debrief line carried "Textbook, once it came to that." and the choices were "1. He chose to fight. I gave him the chance to step away." and "2. Is there any way back to a cooperation deal?". HaX: "You did. And now we're both living with what came after." Screenshot `c_debrief_choices.png`. The KO itself was `debugKO`, so the combat is not exercised.

### 6. HaX after Halloran's KO (game 2350): pass, with F1

With the badge log held (`found_door_log`, `door_log_held` true) and `halloran_ko` true, HaX's "Where do I stand?" (log ~143) returned two lines: "Get to the server-room door, off the server hallway. The notice beside it says who holds the password." then "She's in no state to answer. Her desk in the lab might." It points at her desk and does not send the player to ask her. Screenshot `d_hax_after_halloran_ko.png`. See F1 for the wording.

## Findings

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| F1 | minor | In the HaX status above, "She's in no state to answer." follows a line about the server-room password holder and names nobody, so "she" reads as the password holder (Owen is "he"; the nearest woman named is Patricia, called earlier in the thread). The line only makes sense if the player remembers the badge log. Suggest "Halloran's in no state to answer." | game 2350, log ~143, `d_hax_after_halloran_ko.png` |
| F2 | minor | The unprovoked-KO debrief still says "Detained after a fight." (and the credits "DETAINED AFTER A FIGHT — handed to the police", seen in B) while the player's own choice a few lines later is "I didn't give him the chance." R2-m2 removed only "Textbook, once it came to that." The word "fight" is the one claim that remains. Suggest "Detained at the terminal." on the `torres_fight_offered` false path. | game 2333 ~493 and credits; game 2350 ~417 |

Counts: **0 blockers, 0 majors, 2 minors.**

## Notes (not findings)

- **N1.** If the player visits Halloran after the accusation and before the naming (suspension greeting acknowledged, as in A), the access-back line is not in her greeting after the naming. It plays inside "It's David." instead. A player who never picks that choice never hears she was reinstated, though nothing she says is false. The reviewer's order (E) opens with it. Design choice for the coordinator, not a regression.
- **N2.** In C I reloaded the page without sending `sync` first. The session came back with the starting kit only (the incident log and the vetting file were missing from the inventory) while globals, tasks and unlocked rooms were intact. This is the documented "resume can rewind inventory" trap in the playtest skill, and the missing sync was mine. I have not classified it as a game bug. Nothing I needed later was lost.
- **N3.** In game A, entering the data centre from the vault door left the player behind a desk, 36 px from Torres; `moveToNear` and `interact` both returned "arrived-but-outside-plain-range" until I walked round the desk. In the earlier 2307 run the same room put the player at 29 px. Possibly a spawn-point or desk-collision quirk. Suspect layout, evidence: game 2329 log near the first Torres `interact` (~710-760), `a_torres_noeffect.png`; not confirmed, needs a human to rule on it.
- Not covered: real combat (all KOs used `debugKO`), Torres's talk-down fate branches, the credits beyond the first lines, any VM content. No audio was checked; the new lines have no voiced audio per the round-2 log.

## Housekeeping

All five sessions stopped by `session-stop.sh`; no browser of mine is left. The stray root `lib.sh` in the repo (`git status`) was there before this run and is not mine. Session logs, flags XML files and scratch are in `tools/playtest/` (gitignored scratch aside from the logs). No game, ink or scenario file was edited.
