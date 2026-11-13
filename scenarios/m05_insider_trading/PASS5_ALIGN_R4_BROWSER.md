# m05 "Insider Trading": pass 5 alignment round 4, browser check (13 October 2026)

Question this run answers: do the round-4 fixes (R4-1 parked in-person reason menu, N2 first-call hub guard, N5 vault wording, routes r16 and r17) behave in the real game, and do the other nine items on the round-4 checklist (`ALIGNMENT_REVIEW_P5_R4.md`) still hold? It is a **targeted regression run**, not a blind one. The four VM flags were supplied by the harness ("flag supplied"); standalone has no VMs, so nothing here proves the VM stage is solvable. Any claim about VM content: needs checking against SecGen by the user.

- Server: keyless :3001 only, headless (load average 10 to 19 throughout, so timings are not representative). :3000 not touched. No game file edited.
- Harness: only the checked-in `session-start.sh`, `cmd.sh`, `session-stop.sh`, `new-game.rb` and `verify-run.rb`. My own shell wrappers (in the scratchpad, `m05-r4-browser/lib.sh`) only chain `cmd.sh` calls. The fight (items 6 and 7) used the page-side `eval` loop from the round-1 report (real `walk` key input and `clickAt` canvas clicks). Patricia and Owen were knocked out with the harness's `debugKO` command where marked "exercised, not earned".
- Sessions started and stopped: 2246, 2248, 2257, 2263, 2274, 2282, 2289, 2294, 2297 (each printed "session N stopped"). One other `playtest-session.js` process (game 2296) was running during my last check; it is not mine and I left it.
- Scratch and screenshots (all looked at): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-r4-browser/`.

## Games and session logs

| Game | Purpose | Session log (repo) | Lines |
| --- | --- | --- | --- |
| **2246** (A) | Item 3 first pass: parked in-person menu, phone naming, return to Patricia; also a stale-state read of the HaX hub | `tools/playtest/m05-r4-game2246.jsonl` | 1328 |
| **2248** (B) | Items 5, 4 (Patricia and HaX), 10 (vault-reader text), 8 (reload mid-debrief) | `tools/playtest/m05-r4-game2248.jsonl` | 968 |
| **2257** (C) | Item 1, honest early naming, full ending with credits read | `tools/playtest/m05-r4-game2257.jsonl` | 1110 |
| **2263** (D) | Item 2, Halloran's testimony then both halves then the disclosure | `tools/playtest/m05-r4-game2263.jsonl` | 998 |
| **2274** (E) | Items 7 and 6 (flags, call-in refusal, debrief, credits): real fight, reload on the post-KO choice, phone fate | `tools/playtest/m05-r4-game2274.jsonl` | 1396 |
| **2282** (F) | Item 6, the in-person lethal choice and the nag | `tools/playtest/m05-r4-game2282.jsonl` | 810 |
| **2289** (G) | Items 9 and 10 (Owen knocked out, relay text, late disclosure) | `tools/playtest/m05-r4-game2289.jsonl` | 756 |
| **2294** (H) | Item 3 again, end to end, with credits read | `tools/playtest/m05-r4-game2294.jsonl` | 1234 |
| **2297** (I) | Patricia's chat portrait check only | `tools/playtest/m05-r4-game2297.jsonl` | short |

Flags XML for each: `tools/playtest/m05_insider_trading-flags-game<id>.xml`. A page reload mid-mission happened in B (twice: after a wrong reason and mid-debrief), E (on the post-KO choice) and A (mid-debrief).

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Honest early naming (positive) | **Pass** |
| 2 | R3-1 negative (Halloran's testimony, then both halves, then the disclosure) | **Pass** |
| 3 | R4-1: parked in-person reason menu, naming by phone, back to Patricia | **Pass** (twice) |
| 4 | Retry lines, and the wrong-reason flag across a reload | **Pass** |
| 5 | N2: HaX's first call left unanswered | **Pass** |
| 6 | Lethal ending with flags 3 and 4 out | **Pass** |
| 7 | Phone-fate safety net after a reload on the post-KO choice | **Pass** |
| 8 | Reload mid-debrief; debrief opens off the phone call-in | **Pass**, with one note (below) |
| 9 | Owen knocked out, then the late disclosure | **Pass** |
| 10 | N5: both leads named | **Pass** for two of the three places; the third was not reachable in a normal run (note) |

Counts: **0 blockers, 0 majors, 0 minors that need a fix, 4 notes.**

## Item results

### 1. Honest early naming (game 2257, positive): pass

- Route: incident log, Owen (badge log and clone), password, Patricia in person "I think I know who it is", "David Torres.", "Check who comes in the front door just before the spare is used.". Then Owen's card, journal, mug print, flags 1 and 2, vault, schedule and manifest, then Patricia in person again, "I'll stop him.". Flag 3 not submitted.
- Globals before the scene: `torres_identified=true named_before_portal=true door_log_reasoned_first=true`, `flag3_submitted=false`.
- Scene (log line 707 onward): "20:02. The data centre.", "The transfer bar reads 88 per cent. Twenty-eight minutes to the window." and, at line 731, "You're early. Somebody read Owen's sheet properly.".
- Debrief (line 995): "You had him before the server did. The research portal only confirmed a name you'd already given us." and "You read the badge log properly.".
- Credits, read from `#bv-cr-label` by an observer set before the debrief (line 1101): "MISSION COMPLETE", "NAMED ON THE EVIDENCE — before the server confirmed it", "BORROWED BADGE — Halloran's spare traced back to Torres", "HANDED TO THE POLICE — talked to SAFETYNET first".
- Screenshot: `c_credits.png`.

### 2. R3-1 negative (game 2263): pass

- Route as item 1 but the reason on Patricia's phone was "Halloran says he's in her lab after hours, where the spare hangs." (partial naming, `torres_suspected=true`, `door_log_reasoned=false`). Both halves then named on her phone, and the late disclosure "And the badge log. Look at the main-entrance times." clicked.
- Globals (lines 595 to 601): before the click `door_log_reasoned=false door_log_reasoned_first=false`; after it `door_log_reasoned=true door_log_reasoned_first=false`. Patricia: "...Six minutes before her spare, every night. You did read it properly.".
- Scene: no "You're early" line (a grep of the saved scene text finds none). Debrief (line 891): "You read the badge log properly..." and no "before the server did". Credits: "RECRUITMENT PIPELINE", "BORROWED BADGE — Halloran's spare traced back to Torres", no "NAMED ON THE EVIDENCE".

### 3. R4-1: parked in-person reason menu (games 2246 and 2294): pass

Game 2246, log lines in `m05-r4-game2246.jsonl`:
1. Badge log read (Owen). Patricia in person: "I think I know who it is." then "David Torres." The reason menu appears, "David. Why?" with four choices including "Check who comes in the front door just before the spare is used." (line 517). Pressed **End Conversation** with the menu showing (line 524). Screenshot `a_menu_parked.png`.
2. Halloran, then Patricia's phone: "David Torres." with "Halloran says..." as the reason, so `torres_suspected=true`, `door_log_reasoned_first=false`.
3. Office, journal, mug print, flags 1 and 2, vault, schedule, manifest. Patricia's phone: "I know who it is." then "David Torres." with both halves: `torres_identified=true named_before_portal=true door_log_reasoned_first=false`. HaX's thread: "That's both halves: why he'd do it, and proof it's leaving the building.". I did **not** click the late disclosure.
4. Walked back to Patricia in person. Result (line 935): she opens on "What now?" with the hub choices: "How far did your own investigation get?", "Who's on the suspect list?", "Why did management shut you down?", "I need your help with something.", "Anything else I should know before I go in?", "That's everything for now. I'll keep you posted.". **No "David. Why?" and no reason menu.** Screenshot `a_item3_hub.png`.
5. After the hub: `door_log_reasoned=false door_log_reasoned_first=false torres_reason_guessed=false`.

Game 2294 repeated it end to end with the same result (hub at line 799, screenshot `h_item3_hub.png`, parked menu `h_parked.png`). To the end:
- Scene: no "Somebody read Owen's sheet".
- Debrief: no "before the server did".
- Credits: "RECRUITMENT PIPELINE", then "HANDED TO THE POLICE"; no "NAMED ON THE EVIDENCE".
- Final globals (line 1229): `door_log_reasoned=false door_log_reasoned_first=false named_before_portal=true torres_reason_guessed=false`.

(Game 2246's own credits were not captured: I stepped through the debrief with a helper that ran past the credits before the observer was in place. Game 2294 is the item-3 evidence for the ending.)

### 4. Retry lines and reload (game 2248): pass

- Patricia's phone, "David Torres." then the wrong reason "He's been under strain. His wife's ill.": "Half this building has someone ill at home. That's not evidence." The phone hung up. `torres_reason_guessed=true`.
- **Reloaded the page straight after** (`location.reload()` at line 407, no `sync`, title screen then Enter). After the reload, line 415: `torres_reason_guessed=true server_door_seen=true vault_reader_seen=true`. The flag survived.
- Named again on her phone (line 427): "**Again? Fine. Convince me this time.**". Screenshot `b_item4_retry.png`.
- HaX: Patricia was knocked out with `debugKO` (line 434, exercised, not earned) so that HaX offers "Patricia's down. I'll give you the name instead.". "David Torres." then (line 463): "**Second go. Make it count.**". Screenshot `b_item4_hax.png`. (The shared flag was already true from Patricia's wrong reason, so this also shows the flag is shared across surfaces.)
- Then "Check who comes in the front door..." on HaX: "His badge at the front door, her spare six minutes on, every night. Good. That's a pattern." `torres_suspected=true`, `door_log_reasoned_first=true`, `torres_reason_guessed=true`. The full naming that followed gave a scene **without** "You're early" (the reward stays off after a wrong reason, as r9 expects).

### 5. N2: first call left unanswered (game 2248): pass

- Right after the briefing, phone, Agent HaX: the first call showed its three choices, "I'll get to work.", "What should I know going in?", "Anything I should be careful of?" (screenshot `b_first_call.png`). Closed the phone with **Close**, answering nothing.
- Played on: Patricia, incident log, Owen (badge log, clone), the server hallway, the IT notice, the server-room door (`server_door_seen=true it_notice_read=true`).
- Reopened the phone, Agent HaX (log lines 245 to 262): the thread shows the field-guide text and the password-lock text, and the choices are the hub: "Send me a field guide.", "Where do I stand?", "Nothing right now.". The first-call choices are gone. "Where do I stand?" answers "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." Screenshot `b_item5_reopen.png`.
- After the fate (game 2248, line 885): the hub has "**I'm done here. Bring me in.**" first (screenshot `b_item5_bring_me_in.png`), and Bring me in then runs to the debrief (line 919, "SAFETYNET headquarters. Thursday morning, nine o'clock.").
- Also seen, never opening the first call at all (games 2257 and 2246): the phone opens on the hub, not the first-call choices, once the night has moved on. That is the existing late-reload branch and it works.

### 6. Lethal ending with flags 3 and 4 out (games 2282 and 2274): pass

- **Nag, fate set in person (game 2282):** fight won (Torres KO at about 10 s), "Kill the upload and walk out. Leave him bleeding on the floor.", chat closed. `final_choice="combat_lethal"` (line 791). HaX (line 801): "**The upload's dead. He's still on that floor. The research server isn't finished: all four flags in the drop-site, then call me.**", `flags_nag_sent=true` (line 803). No "Good." and no "sweep". Screenshot `f_nag.png`.
- **Where do I stand, call-in refusal, last flag (game 2274):**
  - "Where do I stand?" (lines 1135 to 1137): "The upload's dead and he's still on that floor. The research server isn't. All four flags, then call me."
  - "I'm done here. Bring me in." (line 1147): "Not yet. The research server isn't finished: all four flags in the drop-site, then I'll pull you out." (screenshot `e_refused.png`)
  - After flags 3 and 4 (line 1207): "Third flag verified..." then "**That's the last flag. Call me.**" (screenshot `e_last_flag.png`). No "Sweep the vault".
  - Call-in, then the debrief says "David Torres is dead." (line 1289) and "The pathologist thinks twenty minutes would have been enough.".
- **Ending:** credits (line 1391): "**MISSION COMPLETE — AT A COST**", "DEAD — left injured on the data-centre floor", "Widowed — still fighting Stage 3 cancer, alone", "Father dead — and, without treatment, they may lose their mother too", and no Owen line (Owen was not hurt in that game). Music read through `MusicController.getState()`: playlist `end` ("Steel Shadows in E Minor (Remastered)") from the lethal choice, `victory` ("Cipher Tide") once the credits had run for a while.
- Note on the harness: on a long phone hub `mg choose 7` did nothing; `mg clickText "Where do I stand?"` worked. Known gotcha, not a game defect.

### 7. Phone-fate safety net after a reload (game 2274): pass

- Fought and won; the person-chat opened on the post-KO choice ("Kill the upload, then stay with him..." or "...walk out", screenshot `e_post_ko_choice.png`, `final_choice=""`). **Reloaded on that choice** (line 1095). After the reload: `final_choice="" torres_fate_by_phone=false`.
- Walked back and entered the data centre. The phone opened by itself with the two choices (line 1111, screenshot `e_reentered.png`): "I'm staying with him. Get an ambulance down here." and "I'm leaving him. He's not my problem.".
- Picked the lethal one: `final_choice="combat_lethal" torres_fate_by_phone=true`; the thread then reads "...Understood. I'll note the time." and, at line 1129, "**He's still on that floor, and the upload's dead. Finish the research server: all four flags in the drop-site, then call me.**" (screenshot `e_hax_lethal.png`). That is the `post_ko_safety_net_sweep` lethal-and-flags-out wording. The in-person nag did not fire here, as designed (the fate was not set in person).

### 8. Reload mid-debrief, and the debrief off the call-in: pass, with a note

- Both of these opened the debrief person-chat straight off the phone "On my way." with no extra step: "SAFETYNET headquarters. Thursday morning, nine o'clock." (game 2246 log line 1247, 2248 line 919, 2257 line 959, 2263 line 855, 2274 line 1225, 2289 line 609, 2294 line 1085). Screenshot `a_debrief_open.png`.
- Reloaded **mid-debrief** in game 2248 (after "You said you'd be methodical. The file says you were.") and in game 2246. After the reload and Enter on the title screen the page goes straight to the end-of-mission credits visualiser (`b_item8_credits.png`), `openTasks` is empty (`call_in_after_sweep` and `hear_debrief` both closed), `mission_complete=true` and `debrief_played=true`. The game record shows the mission concluded (`verify-run.rb` below).
- Note (N-8): the debrief is **not resumed**. A player who reloads half-way never hears the rest of it and the credits are not preceded by the remaining lines. The task is closed by the backstop, so nothing is stuck. If the intended behaviour is to re-open the debrief, that did not happen; if the intended behaviour is "complete and show the credits", it did.

### 9. Owen knocked out, then the late disclosure (game 2289): pass

- `debugKO` on Owen after the incident log (exercised, not earned). HaX's relay arrived on its own with the phone (screenshot `g_owen_ko_relay.png`).
- Picked up the dropped IT spare card and read the dropped badge log from the floor (`found_door_log=true door_log_held=true office_card_obtained=true`, `torres_suspected=false`). Journal read (`torres_suspected=true`), mug print, server door (relayed badge opened the hallway door; password from the relay note), flags 1 and 2, vault, schedule and manifest.
- Patricia in person, "David Torres." with both halves, then "And the badge log. Look at the main-entrance times." (line 333): `door_log_reasoned=true door_log_reasoned_first=false torres_identified=true named_before_portal=true torres_reason_guessed=false`.
- Scene without "Somebody read Owen's sheet". Debrief: "You read the badge log properly." only, no "before the server did". Credits (line 751): "BORROWED BADGE — Halloran's spare traced back to Torres", "HANDED TO THE POLICE", "OWEN GALLAGHER: concussion, on your account"; **no "NAMED ON THE EVIDENCE"**.
- D9 (Owen's physical spare before suspicion) was not part of this check and stays open as logged. The spare was lootable before suspicion here too (`office_card_obtained=true` while `torres_suspected=false`).

### 10. N5 wording: pass for two places, one place not reachable in a normal run

- **Vault-reader text** (game 2248, line 375): "Fingerprint reader on the key vault. Two prints enrolled: **Dr Halloran's and David Torres'**. You've got the kit." Screenshot `b_vault_text.png`.
- **Owen-KO relay** (game 2289, line 39): "Past the server room is the key vault. Fingerprint reader, two prints enrolled: **Dr Halloran's and David Torres'**." Screenshot `g_owen_ko_relay.png`.
- Owen's own line still reads "Two thumbs enrolled, Ruth Halloran's and David's, and nobody else's." (game 2246).
- **"Where do I stand?" vault hint** (phone.ink:949, "The vault takes one of two prints, Halloran's or Torres'..."): not seen. In every game the progress read took an earlier branch ("You've got the password. The server room is north of the server hallway.", then "You're on the research subnet..."). Reading the branch order, that line needs `server_password_obtained`, no suspicion, no incident log read, no door log and `patricia_ko`. I did not build that state. Marked "not exercised".

## Observations (no fix needed)

| # | Sev. | Observation | Repro |
| --- | --- | --- | --- |
| N-8 | note | A reload mid-debrief skips the rest of the debrief and goes to the credits; tasks are closed and the mission concludes. Decide whether that is the intended behaviour. | Finish the call-in, let the debrief open and read three or four lines, reload, Enter on the title screen |
| N-10 | note | The "Where do I stand?" vault hint at phone.ink:949 is reachable only with Patricia knocked out before the incident log, the badge log and any suspicion, and the password in hand. Not exercised. Low value; leave it unless you want the corner tested. | Knock Patricia out right after the briefing, get the password via HaX's relay, ask "Where do I stand?" |
| N-3 | note | After the fate is set by phone (the reload route, item 7) the in-person flags nag does not fire, because it hangs off `conversation_closed:david_torres`. The safety-net sweep line covers the same ground, so the player is told. No change needed. | Item 7 route |
| N-P | note | Behind Patricia's choice menus the chat shows the player's own hooded portrait (screenshots `a_menu_parked.png`, `a_item3_hub.png`, `h_item3_hub.png`), while her first line shows her own bust (`i_patricia_chat.png`). Torres' menu keeps his bust (`e_post_ko_choice.png`). Looks like the engine's per-speaker portrait choice, not a content error. Left for the character stage. | Open Patricia in person, read to the first choice list |

Harness points, not game defects: the tutorial prompt appears about 4 to 5 seconds after the briefing notes close and blocks `enter` and `interact` until dismissed; an `interact` fired straight after an `enter` sometimes opens nothing, and a 2 second wait fixes it; `converse` closes an RFID minigame opened from a chat, so the Owen "Lean over" step has to be driven by hand; the cloner needs about 5 seconds before "Save" exists.

## Severity table

| # | Sev. | Finding | Repro |
| --- | --- | --- | --- |
| none | blocker | No blockers. | |
| none | major | No majors. R4-1 and N2 are fixed in the browser. | |
| N-8, N-10, N-3, N-P | note | See Observations. None needs a code change to close the alignment phase. | See Observations |

## Not covered

- The VM stage (standalone). All four flags were supplied ("flag supplied"), so flag 1 to 4 rows are exercised, not earned. The in-game prerequisites were earned: the server password came from Owen's note (or HaX's relay), Torres' print came from the mug in his office, the vault opened with that lift, and the schedule and manifest were read in the data centre before naming.
- The Owen-KO route used `debugKO` (items 4 and 9) and the Patricia KO in item 4, so those knock-outs are exercised, not earned.
- Items 1, 2, 3 and 9 end with the arrest or hand-over fate. The Recruiter deal, the turn and the public-exposure endings were not played here.

## verify-run.rb output

### Game 2246 (A)

```
game            2246  (mission 49)
created         2026-10-13 16:21:37 UTC
last write      2026-10-13 16:36:40 UTC
played for      903s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_fbc1ea}, flag{m05_insider_trading_qdc_research_server_2_264f7c}, flag{m05_insider_trading_qdc_research_server_3_654a58}, flag{m05_insider_trading_qdc_research_server_4_a6ffb6}
globals set     44: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_halloran_alibi, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, halloran_questioned, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2248 (B)

```
game            2248  (mission 49)
created         2026-10-13 16:38:28 UTC
last write      2026-10-13 16:49:56 UTC
played for      688s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   0: 
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, Contractor Pass, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_9a7418}, flag{m05_insider_trading_qdc_research_server_2_04b46c}, flag{m05_insider_trading_qdc_research_server_3_11fbdc}, flag{m05_insider_trading_qdc_research_server_4_7da474}
globals set     47: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_authorised_server, patricia_ko, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_reason_guessed, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2257 (C)

```
game            2257  (mission 49)
created         2026-10-13 16:50:14 UTC
last write      2026-10-13 17:00:28 UTC
played for      614s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_7c78cc}, flag{m05_insider_trading_qdc_research_server_2_9158bb}, flag{m05_insider_trading_qdc_research_server_3_71e951}, flag{m05_insider_trading_qdc_research_server_4_016a1c}
globals set     44: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2263 (D)

```
game            2263  (mission 49)
created         2026-10-13 17:01:29 UTC
last write      2026-10-13 17:10:14 UTC
played for      524s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_d5d071}, flag{m05_insider_trading_qdc_research_server_2_b4a30b}, flag{m05_insider_trading_qdc_research_server_3_8f71fc}, flag{m05_insider_trading_qdc_research_server_4_7f15a5}
globals set     45: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_halloran_alibi, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, halloran_questioned, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2274 (E)

```
game            2274  (mission 49)
created         2026-10-13 17:11:34 UTC
last write      2026-10-13 17:25:35 UTC
played for      841s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_6f55a9}, flag{m05_insider_trading_qdc_research_server_2_a9e775}, flag{m05_insider_trading_qdc_research_server_3_a84fea}, flag{m05_insider_trading_qdc_research_server_4_294c45}
globals set     43: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_fate_by_phone, torres_identified, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2282 (F)

```
game            2282  (mission 49)
created         2026-10-13 17:26:53 UTC
last write      2026-10-13 17:33:57 UTC
played for      425s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 2: flag{m05_insider_trading_qdc_research_server_1_6d1540}, flag{m05_insider_trading_qdc_research_server_2_20c636}
globals set     38: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, door_log_held, door_log_reasoned, door_log_reasoned_first, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flags_nag_sent, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, it_notice_read, knows_full_stakes, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_identified, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 2 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2289 (G)

```
game            2289  (mission 49)
created         2026-10-13 17:34:12 UTC
last write      2026-10-13 17:41:20 UTC
played for      429s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, torres_office, server_hallway, server_room, data_center
unlocked objs   0: 
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Staff Badge (relayed copy), Server-Room Password (from IT's ticket queue), Badge-Reader Log (from IT's archive), IT Spare Office Card, Server Hallway Badge Log, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_d0ad3c}, flag{m05_insider_trading_qdc_research_server_2_3d2b92}, flag{m05_insider_trading_qdc_research_server_3_d0c575}, flag{m05_insider_trading_qdc_research_server_4_d64bfa}
globals set     43: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, owen_ko, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2294 (H)

```
game            2294  (mission 49)
created         2026-10-13 17:42:36 UTC
last write      2026-10-13 17:53:15 UTC
played for      639s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, torres_office, server_room, data_center
unlocked objs   0: 
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_02ea7c}, flag{m05_insider_trading_qdc_research_server_2_8b3165}, flag{m05_insider_trading_qdc_research_server_3_87a3eb}, flag{m05_insider_trading_qdc_research_server_4_2ef5d4}
globals set     44: briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_door_log, found_halloran_alibi, found_incident_log, found_manifest, found_torres_journal, found_upload_schedule, halloran_questioned, it_notice_read, knows_full_stakes, mission_complete, named_before_portal, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_arrested, torres_identified, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game 2297 (I)

```
game            2297  (mission 49)
created         2026-10-13 17:54:20 UTC
last write      2026-10-13 17:55:30 UTC
played for      69s of wall clock
current room    "reception_lobby"
unlocked rooms  2: reception_lobby, patricia_office
unlocked objs   0: 
inventory       5: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad
NPCs met        8: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan
flags submitted 0: 
globals set     7: briefing_played, confront_stance, engine_tutorial_declined, final_choice, knows_full_stakes, player_approach, player_name

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

