# m05 "Insider Trading": pass 5 puzzle chains round 2, browser check (13 October 2026)

Questions this run answers: do the nine browser checks listed in `PUZZLE_CHAINS_REVIEW_P5_R2.md` hold in the real game (plumbing), plus one engine question for the coordinator: does the engine keep ink-local variables across a page reload? It is a targeted regression run, not a blind one. The four VM flags were supplied by the harness ("flag supplied"); standalone has no VMs, so nothing here proves the VM stage is solvable. Any claim about VM content: needs checking against SecGen by the user.

- Build tested: working tree after commit `1c91f4c6` (puzzle round 2 fixes).
- Server: keyless :3001 only. :3000 not touched. Headless (load average 15 at the start, so timings are not representative). No game file edited.
- Harness: only the checked-in `new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`. My own shell helpers (scratchpad `m05-puzzle-r2-browser/lib.sh`) only chain `cmd.sh` calls. The dusting drags replay the saved drag paths from the earlier round-4 report's `dust.txt`. Assisted steps: the briefcase pick (`completeLockpick`, the player carries a real Lock Pick Kit, so PASS (assisted)).
- Sessions started and stopped: 2307, 2318, 2321 (each printed "session N stopped"). The chromium processes still listed by `ps` are headed Wayland ones that are not mine.
- Screenshots (all looked at where the check turns on them): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-puzzle-r2-browser/`.

## Games and session logs

| Game | Used for | Session log (repo) | Lines |
| --- | --- | --- | --- |
| **2307** (A) | checks 1, 3, 5, 6 (unidentified lift), 7 (notice), full ending and credits | `tools/playtest/m05-p5r2-game2307.jsonl` | 1536 |
| **2318** (B) | checks 2, 7 (vault reader, then Halloran's gloves topic), 8, the reload question, ending without the reward | `tools/playtest/m05-p5r2-game2318.jsonl` | 1334 |
| **2321** (C) | checks 4, 6 (wrong name then unidentified), 9, the reload question again (Owen, Patricia, HaX) | `tools/playtest/m05-p5r2-game2321.jsonl` | 703 |

Flags XML: `tools/playtest/m05_insider_trading-flags-game<id>.xml`. Mid-mission page reloads: B (lines 274-275) and C (lines 607-608).

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Reward kept after hint rungs 1-2 | **Pass** (A) |
| 2 | No reward after the method rung | **Pass** (B) |
| 3 | Journal from the locked briefcase ticks `find_journal`; HaX's text fires | **Pass** (A) |
| 4 | No-picks, VM-first motive: vetting files on suspicion | **Pass**, with a same-conversation catch (F2) (C) |
| 5 | Patricia's sign-off only after Owen refuses; HaX status matches | **Pass** (A) |
| 6 | Unidentified lift: HaX's text, vault still opens | **Pass** (A, C; identified path also seen in B) |
| 7 | Second print: gloves topic and the Lab Rules notice, no hook | **Pass**, with stale "hangs" wording elsewhere (F1) (A, B) |
| 8 | Visitor spare across a reload | **Pass** (B) |
| 9 | Typed password without Owen's note | **Pass** (C) |
| Q | Ink-local variables across a reload | **Kept.** See "The reload answer" |

Counts: **0 blockers, 0 majors, 3 minors**, plus four notes.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Server hallway badge (A) | cloned card | Owen's lanyard, RFID cloner via "Lean over" | A line 341 | yes |
| Server hallway badge (B) | Visitor Spare #4471 | Dr Halloran, once her influence is 25+ | B line 211 | yes |
| Server hallway badge (C) | cloned card | Owen's lanyard | C line 159 | yes |
| Server-room password | `quantum2024` | Owen's sticky note, after the incident-log reason (B) or Patricia's sign-off (A) | A line 775; B | yes (A, B) |
| Server-room password (C) | `quantum2024` | **typed without Owen's note** | n/a | **no, exercised on purpose** for check 9 |
| Badge log | item | Owen, "Whose?" after the incident log | A, B | yes |
| Torres' office card | item | Owen, after Patricia's sign-off / suspicion | A, B, C | yes |
| Briefcase contents | journal, bills | pick lock (assisted) | A line 848, B | yes (assisted) |
| Torres' print | lift | mug in Torres' office, dusting kit | A line ~921, B, C | yes |
| Vetting files | items | Patricia, on suspicion only (C) | C line 322 | yes |
| `<flag:1>` to `<flag:4>` | harness values | Bludit terminal station | A, B (1-4); C (1-3) | **no, flag supplied** |

Prerequisites for the flags (the server room, its password, the research-portal task) were earned in-game. The flag values themselves cannot be earned in standalone, so the VM stage is exercised, not tested.

## verify-run.rb output

Game 2307:

```
game            2307  (mission 49)
created         2026-10-13 18:41:37 UTC
last write      2026-10-13 19:02:21 UTC
played for      1244s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Upload Schedule, Data Package Manifest
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_c711cb}, ..._2_61dc45, ..._3_2e9a4b, ..._4_4a44ae
globals set     49: (includes door_log_reasoned_first, found_torres_journal, mission_complete, debrief_played, torres_identified, named_before_portal; no torres_reason_guessed, no door_log_hinted)

VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2318:

```
game            2318  (mission 49)
created         2026-10-13 19:04:08 UTC
last write      2026-10-13 19:18:03 UTC
played for      835s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, Visitor Spare (#4471), Server Password Sticky Note, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest
NPCs met        11: (as above)
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_09ebcf}, ..._2_634d1e, ..._3_03b634, ..._4_2d8407
globals set     51: (includes door_log_hinted, spare_badge_taken, torres_reason_guessed, door_log_reasoned_first, mission_complete)

VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2321 (stopped at the office, mid-mission by design):

```
VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 3 flags submitted.
```

Full output files: scratchpad `m05-puzzle-r2-browser/verify-2307.txt`, `verify-2318.txt`, `verify-2321.txt`.

## Check results

### 1. Reward kept after rungs 1-2 (game 2307): pass

- Badge log from Owen (global `door_log_held`, `found_door_log` true). HaX "Where do I stand?" (line 145): "That log says Halloran's spare. Ask her where it lives." No front-door words. (The old "The badge log's in your kit. Read it." rung is gone, as the fixer logged.)
- Halloran asked about her spare (`halloran_questioned`, `found_halloran_alibi`). Status again (line 305): "You've got a pattern on that sheet. Take it to Patricia, or ask her for the vetting files on the names in it." `door_log_hinted=false`, `torres_reason_guessed=false`.
- Patricia in person: "David Torres.", reason menu "David. Why?", front-door reason first time. `door_log_reasoned_first=true`. Later both halves named (journal, bills not needed: journal picked, upload schedule and manifest read, flags 1-2 in, flag 3 left out): `torres_identified=true named_before_portal=true`.
- Scene (line 1137): "You're early. Somebody read Owen's sheet properly." Debrief (line 1407): "You had him before the server did." and "You read the badge log properly." Credits (read from `#bv-cr-label`, line 1525): "NAMED ON THE EVIDENCE — before the server confirmed it", "BORROWED BADGE — Halloran's spare traced back to Torres", "HANDED TO THE POLICE — said nothing". Screenshots: `a_hax_status_prerefusal.png`, `a_credits.png`.

### 2. No reward after the method rung (game 2318): pass

- Badge log, Halloran asked (alibi), then Patricia "David Torres." with the wrong reason "He's been under strain. His wife's ill.": "Half this building has someone ill at home. That's not evidence." `torres_reason_guessed=true`, `door_log_hinted=false`.
- HaX status (line 417): "Her spare goes in at night. Look at who comes through the front door just before it." `door_log_hinted=true`. Screenshot `b_rung3.png`.
- Patricia again, front-door reason (line 453): "Again? Fine. Convince me this time." Then `door_log_reasoned_first=true` but `torres_reason_guessed=true` and `door_log_hinted=true`.
- Both halves named early (`named_before_portal=true`). Scene (`b_scene.txt`): no "You're early". Debrief: "You got to the front-door times in the end. It took a couple of goes." and no "before the server did". Credits (line 1323): "RECRUITMENT PIPELINE", "BORROWED BADGE", "HANDED TO THE POLICE", and **no** "NAMED ON THE EVIDENCE". Screenshot `b_credits.png`.

### 3. Journal from the briefcase (game 2307): pass

- Torres' office has no journal on the desk (`room` lists only the mug and briefcase). Briefcase: "A scuffed leather briefcase under the desk, locked and heavy with papers. Pin tumbler." Real Lock Pick Kit in the kit: the pin-tumbler minigame opened, `completeLockpick` (line 848, assisted). Contents: Personal Journal, Medical Bills.
- Took the journal: `found_torres_journal=true`; the objective state read from `state`: `find_journal completed (optional)`, `find_medical_bills active (optional)`, `access_torres_office completed`.
- HaX (line 873): "Pin tumbler. Your picks will do it. Want the guide?" (on the first try at the lock) then "A personal journal. Call me once you've read it." Screenshot `a_hax_journal.png`, `a_briefcase_open.png`.
- In the scene Torres says "Did you read my journal as well?" so the journal reaches the confrontation.

### 4. No-picks, VM-first motive (game 2321): pass, with F2

- Start: Patricia met, incident log read; Owen's badge cloned; badge log never fetched; Halloran never visited; briefcase never touched. Flags 1-3 submitted (flag 3 sets `torres_suspected`, `case_exfil`; `case_motive=false`, `found_door_log=false`, `halloran_questioned=false`).
- HaX status (line 280): "Root's the last door. Start with what that account is allowed to run." then "You can see it leaving under his name. Now find out why: what he keeps in his office, or Patricia's vetting files." (new R2-1 wording). Screenshot `c_status_after_flag3.png`.
- Patricia in person, "I need your help with something" now offers the files (and Torres' office): "That's what vetting will let me give you. Read them properly." (line 322). `found_vetting_file=true case_motive=true`.
- Naming. See F2: in the same conversation Patricia still says "That's how. I need why." (line 372). After leaving and talking again, "David Torres." names him at once ("Right. Your call from here…", `torres_identified=true`, `named_before_portal=false`, no reason menu, line 452).

### 5. Patricia's sign-off only after Owen refuses (game 2307): pass

- Before Owen is asked (notice read, door seen): HaX (line 447): "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one." No sign-off mention. Patricia "I need your help with something": only "I need the vetting files…" and "Actually, it can wait." (`a_patricia_menu_prerefusal.png`).
- Owen asked "The server room wants a password.", declined with "Fair enough. I'll be back." `owen_refused_password=true`. HaX (line 591): "Owen wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." Patricia's menu now has "The server room wants a password Owen won't give me." (line 623, `a_patricia_menu_postrefusal.png`). Taking it set `patricia_authorised_server`; Owen then handed over the note ("Security's signed it off").

### 6. Unidentified lift (games 2307, 2321, with B for the identified path): pass

- Game 2307: reference-card screen offers "Owen Gallagher / David Torres / Log as unidentified". Clicked "Log as unidentified". Toast and thread (line 921): "Print's lifted off his mug. You didn't match it, but the vault reader will tell you whose it is. North of the server room." `torres_print_collected=true`. Screenshot `a_unidentified_after.png` (toast on screen, objectives panel visible).
- Vault reader with the unidentified lift: the reader lists "Print from Mug, loop, Quality 89%, ? Not identified"; presenting it opened the door (`data_center` entered; `a_vault_reader.png`).
- Game 2321: picked the wrong name first ("1. Owen Gallagher (not a match)", `c_wrong_name.png`), then "Log as unidentified": same HaX text.
- Game 2318: the correct card gave "That's Torres' print. The vault's north of the server room." (the identified branch still works).

### 7. Second print: gloves topic and the Lab Rules notice (games 2318, 2307): pass, with F1

- Game 2318: vault reader seen first (`vault_reader_seen=true`, reader lists one identified print), then the lab. Halloran's hub gained "The key vault takes your thumbprint. Could someone have lifted it?" . Answer (line 745): "Off me? Not in this lab. Gloves at the bench, always; it's the first rule I wrote." / "You'll not lift anything of mine in here. Try it if you like." Screenshot `b_gloves.png`.
- Game 2307: the Lab Rules notice (read from the Notepad, because a read note leaves the room): "1. Gloves at the bench. Always. No exceptions for leads. 2. Nothing leaves this lab on removable media. 3. The visitor spare (#4471) is signed out through me. Visitors only." No hook anywhere. Screenshot `a_lab_rules_notepad.png`.
- The bark text (the reader's "Two prints enrolled…") is unchanged from the round-4 report; not re-read here.

### 8. Visitor spare across a reload (game 2318): pass

- Halloran: Heisenberg, team, then "I need into the server hallway." Hand-over (line 211): "You've been straight with me. Here, the visitor spare. It's signed out through me, and I'm signing it out to you." Inventory: "Visitor Spare (#4471)". `spare_badge_taken=true server_badge_obtained=true`.
- Reloaded (lines 274-275), Enter on the title screen, back to the lab. After the reload the hub opens on "What else?" with no opener. "Your spare badge has been through the server hallway at night. Four times." (line 307): "**The one you're carrying.** It's signed out through me, and I've never signed it out at night." Screenshot `b_halloran_spare_line.png`.
- The spare opened the hallway door without a minigame in the same game.

### 9. Typed password without Owen's note (game 2321): pass

- Cloned Owen's badge, door seen, notice read, typed `quantum2024` into the server-room door (exercised, not earned): `server_room_entered=true server_password_obtained=false`.
- HaX "Where do I stand?" (line 276): "You're on the research subnet. Map it, then find the login someone left lying about." It does not send the player back to Owen. Screenshot `c_typed_password_status.png`. (Its second line, "Patricia's log has a cryptography badge at 23:47. Owen keeps the reader logs. Ask him whose.", is the badge-log nudge, a different thread.)

## The reload answer

**Yes: the engine keeps ink-local variables across a page reload. No ink-local opener replayed.**

How it was read: `window.npcConversationStateManager.conversationStates.get(<npc id>)` through the harness `eval`, before and after the reload. The source agrees: `exportNpcInkVariables` sends each NPC's saved variables with the state sync, the server keeps them in `player_state['npcInkVariables']`, `games_controller.rb:307` returns them as `savedNpcInkVariables` and `game.js:1122` calls `importNpcInkVariables` on load (engine commit `1de257bb`, "Reload keeps cloner cards, aim states, ink variables and one-shot events").

Game 2318, Dr Halloran, after she handed over the spare and the conversation had closed, immediately before `location.reload()`:

```
halloran_influence 40, topic_heisenberg true, topic_team true, first_meeting false,
asked_vault false, hub_quiet false, topic_torres_defense false, told_about_torres false, accused_acknowledged false
```

Straight after the reload and Enter on the title screen (the state manager rebuilt from the server, `ts 0`, `ended true`, no story position):

```
halloran_influence 40, topic_heisenberg true, topic_team true, first_meeting false,
asked_vault false, hub_quiet false, topic_torres_defense false, told_about_torres false, accused_acknowledged false
```

- Talking to her again: no "You're the consultant. Ruth Halloran. I run Heisenberg." opener, no narrator line. She opens on "What else?" (`b_halloran_after_reload.txt`, screenshot `b_halloran_after_reload.png`).
- Her hub follows the saved state: "Tell me about your team" and "What exactly is Heisenberg?" are gone (topics kept), the hand-over option is gone (synced global), her spare answer is the variant for a player carrying the badge.
- Game 2321, same test on Owen (`first_meeting false`, `owen_influence 20`, `card_handed true`), Patricia (`first_meeting false`, `gave_vetting_file true`, `patricia_influence 10`) and HaX's phone (`first_contact false`): all kept after the reload, no opener replayed (Owen and Patricia open on "What else?" / "Go on." and the HaX hub, not the first-call choices).
- What a reload does lose: the story position. After the reload a person-chat restarts at its start knot with the saved variables (`hasStory false`), which for these inks means the hub. Also, in game 2321 Owen's chat reopened mid-branch once without a reload ("I thought it was remote work at first…" menu) because the saved story state is restored for an unfinished conversation; that is the same-session path, not the reload path.
- Consequence for earlier notes: `PUZZLE_CHAINS_REVIEW_P5_R2.md` ("NPC story state is held in memory only", "`gave_spare` resetting brings back the line P8 removed") describes the engine before `1de257bb`. R2-2's synced `spare_badge_taken` is harmless and still correct, but a reload would not have reset `gave_spare` on this build. `asked_vault` was not asked before the reload in these games, so its persistence was read only as "false and kept", not as "true and kept".

## Findings

| # | Severity | Finding | Repro (log lines) |
| --- | --- | --- | --- |
| F1 | minor | The "where the spare hangs" wording survives in three player choices and one debrief line, although Halloran no longer says where it hangs (R2-2). Patricia's reason menu option 3 reads "Halloran says he's in her lab after hours, where the spare hangs." (`m05_npc_patricia_morgan.ink:384`, `m05_phone_patricia.ink:195`, `m05_phone_agent_0x99.ink:515`); the debrief says "Halloran told you where her spare hangs." (`m05_closing_debrief.ink:279`). The notice and Halloran now say "signed out through me" | game 2307, `a_reason_menu.png`; game 2318, line 453 |
| F2 | minor | Patricia hands over the vetting files, then "I think I know who it is" in the same conversation still takes the "I need why" path (a reason menu, then "That's how. I need why."), although `found_vetting_file` and `case_motive` are already true. The ink reads `found_vetting_file` from its start-of-conversation sync, and the handover's `onRead` changes the global mid-conversation. Leaving and talking again works at once. Not a softlock, but the first naming attempt after the files wastes a turn and `torres_suspected` is set by it | game 2321, lines 322 and 372, then a clean naming at line 452 |
| F3 | minor | In the same conversation, Halloran's hub keeps offering "I need into the server hallway. Your badge opens it." after she has handed over the spare. Choosing it again repeats the hand-over speech and adds influence (25 to 35 to 40) but no second item (inventory stays one "Visitor Spare (#4471)"). After the conversation closes the option is gone | game 2318, lines 211 and 235 |

Counts: **0 blockers, 0 majors, 3 minors.**

Notes (no fix needed):

- N-A. The Lab Rules notice, like other readable notes, leaves the room after it is read (it goes to the Notepad). A player who closes it without reading the third rule has to find it in the Notepad. Normal for the engine.
- N-B. The HaX phone thread, opened a while after flags arrive, did not always show the newest messages (the 2307 thread showed up to 7:56 although flag texts had arrived; the "Manifest flag verified…" and "That's the last flag…" texts reached the toast and the log, and the thread showed "Manifest flag verified" on a later open in game 2321). Reading from the thread right after a text can look stale. Not investigated further.
- N-C. `final_choice` is `"arrest"` and the global `torres_arrested` is set on the hand-over route (internal names, not player-facing). The brief says SAFETYNET detains and hands over, so this is only a naming question for the next dialogue/state pass.
- N-D. Loading the scenario prints a JSON duplicate-key warning from `app/models/break_escape/mission.rb:118` ("duplicate key `_comment`… at line 2106 column 9" of the rendered JSON). The fixer said the badge item's duplicate was merged, so this is another object. I did not locate it (reading the rendered JSON would have meant another render); the same warning may predate this pass.

## Not exercised

- The lethal and fight endings, Patricia KO and Owen KO relays, the Recruiter's call: none touched by round 2.
- The vault reader's own bark text and the out-of-order flags (P3): not part of the nine checks.
- Anything about the VM (flags 1-4 were supplied): needs checking against SecGen by the user.
