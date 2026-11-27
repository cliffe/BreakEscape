# m05_insider_trading regression playtest

Question answered: **plumbing + unexpected behaviour** (regression of the engine changes in REGRESSION_BRIEF). Source: scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md. Standalone, headless. KOs and the fight used `debugKO` (assisted, combat not played). The briefcase lock used `completeLockpick` (PASS (assisted)).

Games and session logs
- Game 1198, main run (normal path, Turn ending, status=completed): `tools/playtest/m05-regress-session.jsonl`
- Game 1204, Patricia KO + Kevin KO route, Turn ending, status=completed: `tools/playtest/m05-regress-c-session.jsonl`
- Game 1207, Patricia KO + Kevin KO route, Fight -> KO -> post-KO choice, status=completed: `tools/playtest/m05-regress-d-session.jsonl`
- Server record: 1198 completed, concluded_at 2026-10-01 07:00:33 UTC; 1204 completed, 07:11:35; 1207 completed, 07:18:31.

## verify-run.rb output
```
1198
game            1198  (mission 49)
created         2026-10-01 06:50:42 UTC
last write      2026-10-01 07:00:33 UTC
played for      591s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, main_corridor, open_office_area, patricia_office, torres_office, server_hallway, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       13: Your Phone, Notepad, Server Password Sticky Note, Visitor Badge, Vetting Aftercare File: D. Torres, Cloned Staff Badge, Torres Office Keycard, Lockpick Set, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        9: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, closing_debrief_trigger, kevin_park, patricia_morgan, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_43850e}, flag{m05_insider_trading_qdc_research_server_2_d9f512}, flag{m05_insider_trading_qdc_research_server_3_141abc}, flag{m05_insider_trading_qdc_research_server_4_334f85}
globals set     34: architect_approval_confirmed, bludit_guide_offered, bludit_server_discovered, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, debrief_played, elena_treatment_funded, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_manifest, found_medical_bills, found_pipeline_list, found_torres_journal, found_upload_schedule, found_vetting_file, lockpick_obtained, lockpicking_guide_offered, mission_priority, office_card_obtained, patricia_authorised_office, player_approach, player_name, recon_guide_offered, recruiter_contacted_player, recruiter_deal_offered, server_badge_obtained, torres_identified, torres_turned

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.

1204
game            1204  (mission 49)
created         2026-10-01 07:00:59 UTC
last write      2026-10-01 07:11:38 UTC
played for      640s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, torres_office, server_hallway, server_room, data_center
unlocked objs   0: 
inventory       10: Your Phone, Notepad, Contractor Pass, Staff Badge (relayed copy), Torres Office Card (relayed copy), Lockpick Set, Cloned Staff Badge, Torres Office Keycard, Personal Journal, Server Password Sticky Note
NPCs met        9: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, closing_debrief_trigger, patricia_morgan, kevin_park, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_f9b71e}, flag{m05_insider_trading_qdc_research_server_2_67ea07}, flag{m05_insider_trading_qdc_research_server_3_b2de98}, flag{m05_insider_trading_qdc_research_server_4_5cf9f3}
globals set     27: architect_approval_confirmed, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, debrief_played, elena_treatment_funded, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_torres_journal, kevin_ko, knows_full_stakes, knows_insider_profile, lockpick_obtained, mission_priority, office_card_obtained, patricia_authorised_office, patricia_ko, player_approach, player_name, server_badge_obtained, torres_identified, torres_turned

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.

1207
game            1207  (mission 49)
created         2026-10-01 07:11:53 UTC
last write      2026-10-01 07:18:36 UTC
played for      403s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, torres_office, server_hallway, server_room, data_center
unlocked objs   0: 
inventory       7: Your Phone, Notepad, Contractor Pass, Server Password Sticky Note, Staff Badge (relayed copy), Torres Office Card (relayed copy), Personal Journal
NPCs met        9: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, closing_debrief_trigger, patricia_morgan, kevin_park, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_534365}, flag{m05_insider_trading_qdc_research_server_2_98c036}, flag{m05_insider_trading_qdc_research_server_3_42d2b2}, flag{m05_insider_trading_qdc_research_server_4_982b1e}
globals set     24: architect_approval_confirmed, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, debrief_played, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_torres_journal, kevin_ko, mission_priority, office_card_obtained, patricia_authorised_office, patricia_ko, player_approach, player_name, server_badge_obtained, torres_arrested, torres_identified, torres_ko

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Visitor Badge | (item) | Patricia Morgan dialogue (game 1198) | before aim 2 | yes |
| Server password | `quantum2024` | Server Password Sticky Note, Kevin's desk (read in-game, game 1198 before talking to Kevin) | before server room | yes |
| Cloned staff badge, office keycard, lockpick | (items) | Kevin Park dialogue (1198); KO drop plus HaX relayed copy (1204, 1207) | before hallway / Torres office | yes |
| Torres office access | (item) | Patricia authorises (1198), Kevin gives card | before Torres office | yes |
| Briefcase (medical bills) | pick lock | lockpick from Kevin; `completeLockpick` | game 1198 | yes (assisted) |
| `qdc_research_server` flags 1-4 | `<flag:1>`..`<flag:4>` | VM challenge, not possible in standalone. Prerequisites reached (server room, VM launcher opened in 1198) | game 1198 | **no, flags handed over** |
| Torres's name | David Torres | journal + medical bills + manifest/flag evidence | before naming | yes |

Flag rows are "no": the Bludit exploit chain and everything gated on the flags (`concludeRequires`, debrief trigger) was exercised, not earned. Solvability past the VM is unproven here.

## Checks
| # | Check | Result | Evidence |
|---|---|---|---|
| 6 | Critical path to status=completed | PASS | game 1198: all 5 aims completed incl. `hear_debrief`; status=completed, concluded_at set; `missionEnd.creditsShowing=true` |
| 7a | Fight -> KO -> post-KO choice has no "End Conversation" | PASS | game 1207: after `debugKO david_torres` (seq 408) the person-chat controls were only the two choice buttons ("Kill the upload, then stay with him..." / "...walk out"); no End/Close control in the DOM |
| 7b | Can't close it before choosing | PASS | `mg close` returned `stillOpen:true`; a dispatched Escape keydown on document and window left the minigame open |
| 7c | After the choice | PASS | `final_choice=combat_nonlethal`, scene auto-closed after ~2 s, debrief fired and completed (flags were in), status=completed |
| 8a | Patricia KO -> contractor pass route | PASS | games 1204/1207: HaX phone chat opened on KO ("Patricia's down ... I've printed you a contractor pass"), inventory gained "Contractor Pass", `patricia_authorised_office` set, aim 1 completed |
| 8b | Kevin KO drops his badge | PASS | after `debugKO kevin_park` the room listed `cloned_employee_badge`, `torres_office_keycard`, `kevin_lockpick` as floor items next to Kevin (open_office_area, a later-loaded room) and I picked up the badge and card; HaX also relayed "Staff Badge (relayed copy)" and "Torres Office Card (relayed copy)" |
| 8c | Naming moves to HaX | PASS | phone hub option "Patricia's down. I'll give you the name instead", HaX answers "That's enough for me. I'm flagging him now", Torres appears in the data centre |
| 9 | Aims in order; early task in a locked aim hidden then shown done | PASS | game 1198: `find_server_password` completed (state) while `investigate_employees` was `locked`; the Objectives panel text listed only "Get Inside Quantum Dynamics". After meeting Patricia the panel showed the new aim with "Find the server room password" already ticked. Aims 3, 4, 5 appeared in order. Nothing stalled |
| 10 | Debrief then credits | PASS | all three games: debrief person-chat ran to the end (no close control, auto-closed), `missionEnd.creditsShowing=true`, `closable:false` (bv-stage overlay) in 1198 |
| other | Recruiter call | PASS | after naming Torres to Patricia, the Recruiter phone chat opened on its own when Patricia's conversation closed (1198) and ran to its end |
| other | Re-talking Patricia | OBSERVED | on re-talk her conversation resumed in the hub (first line "What do you need?"), not at `start`. Her story had not ended, so this does not contradict the restart-at-start rule |

## Observations (not classed as defects)
- Phone-chat choices appear to do nothing for about 1-2 s after `choose` (`brief` still showed the old list, which made my driver loop re-choose the same option 100+ times). Selecting once and waiting settled it. Looks like the typing delay; harness-side, noted for anyone scripting phone chats.
- The first HaX KO-relay phone chat ends after the single "I'll manage." choice; the hub (with "Patricia's down...") only appears on the next open of the HaX contact.
- Two runs (1198, 1204) took the Turn ending because my driver picked the first unseen option; no defect.
- Doors: several reverse-direction `enter` calls return `no-known-doorway` and a closed (unlocked) door blocks `walk` until `interact`; harness-level.
- Intro replays after reload not checked (known).
- **Regressions: none found in m05.**
