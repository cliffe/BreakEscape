# m05 "Insider Trading": pass 5 regression playtest A (13 October 2026)

Which question this run answers: plumbing (does every step still fire on today's engine) and one off-path check (reload at three risky moments). It is a **regression run**, not a blind one. It does not answer solvability, because the four VM flags were supplied.

- Step source: `TESTING_WALKTHROUGH.md` (with `PASS4_PLAYTEST.md` for the whodunnit gates).
- Game id: **2222** (mission 49), keyless server :3001, headless (load was 9 to 20 while three agents played, so timings are not representative).
- Session log: `tools/playtest/m05-regA-game2222.jsonl` (2022 lines, 14:46:37 to 15:17:47 UTC). Flags XML: `tools/playtest/m05_insider_trading-flags-game2222.xml`.
- Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-stage1-regA/` (36 files, `01-` to `36-`, all looked at).
- Session stopped (`session-stop.sh 2222`, "session 2222 stopped"). No game file edited.

## verify-run.rb output

```
game            2222  (mission 49)
created         2026-10-13 14:46:21 UTC
last write      2026-10-13 15:16:28 UTC
played for      1806s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       17: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, Conference Lanyard, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_f4dff6}, flag{m05_insider_trading_qdc_research_server_2_ad93c0}, flag{m05_insider_trading_qdc_research_server_3_ba93a6}, flag{m05_insider_trading_qdc_research_server_4_7edbe2}
globals set     49: architect_approval_confirmed, bludit_guide_offered, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, debrief_played, door_log_reasoned, engine_tutorial_declined, final_choice, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_door_log, found_halloran_alibi, found_incident_log, found_manifest, found_medical_bills, found_pipeline_list, found_torres_journal, found_upload_schedule, halloran_questioned, it_notice_read, knows_full_stakes, lockpicking_guide_offered, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recon_guide_offered, recruiter_contacted_player, recruiter_deal_decided, recruiter_deal_offered, recruiter_texted, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, torres_arrested, torres_fate_by_phone, torres_identified, torres_ko, torres_print_collected, torres_suspected, vault_reader_seen

VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

`debrief_played` is set and the credits ran to the last line, so the mission concluded server-side.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (log line) | Earned? |
| --- | --- | --- | --- | --- |
| Security Incident Log | (note) | Patricia's desk, patricia_office | line 456, before the Owen ask | yes |
| Server Hallway Badge Log | (note) | Owen, "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" (needs the incident log) | given about line 540; read in the notepad (pages 1 to 6) about line 1090 | yes |
| Gallagher's staff badge | cloned EM4100 (28 CC 48 EF 47) | Owen, "(Lean over his log screen...)" then RFID clone and Save | line 512 onward | yes |
| Server hallway RFID door | emulated clone | Flipper > Saved > Staff Badge > Emulate | after the clone, "Access Granted" | yes |
| Server room password | `quantum2024` | Owen's sticky note, given after the badge-log leverage (seen the IT notice and the door first) | before line 1120 | yes |
| Torres' office card | (item) | Patricia's phone authorisation, then Owen | before the Torres office entry | yes |
| Name "David Torres" / reason | front-door times | Badge Log main-entrance lines, then Patricia's phone menu | line 908 (phone menu), `door_log_reasoned` set | yes |
| Torres' print | lift of the mug | Mug in torres_office, dusting (find, black powder, dust, lift, compare) | lines 1044 to 1060 | yes (print identified in the minigame; I used `debug.pattern` to classify the loop, which a player does by eye) |
| Vault fingerprint reader | Torres' lift, Quality 94% | as above | after 1060 | yes |
| Briefcase (pins 35/60/45/30) | pick | `mg completeLockpick` (dexterity not drivable) | line 1070 | **PASS (assisted)** |
| `qdc_research_server:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | Drop-site terminal. In-game prerequisites reached: server-room password, HaX's recon, Bludit and sudo guide offers (`recon_guide_offered`, `bludit_guide_offered`, `privesc_guide_offered`) | lines 1144 to 1155 | **flag supplied (no): VM work not possible in standalone** |
| Torres confrontation outcome | "Drop the philosophy" then fight, then `debugKO` | Torres at the upload terminal | 1434, 1800 | **no: fight not played, KO assisted** |

Rows marked "no" are the boundary of what this run proves. The four flag submissions, the combat and everything gated on the KO (the post-KO choice, the "detained after a fight" debrief branch) were exercised, not tested. Solvability of the VM stage is unproven past the point where the flags were handed over. Any claim about VM content: needs checking against SecGen by the user.

## Timeline

| Step | What happened | Log |
| --- | --- | --- |
| Opening | Title, Netherton and HaX briefing driven by hand (not bootstrap). HaX bust, Netherton sprite, office background all render. Tutorial declined. Patricia "Task Complete" toast readable. | 2 to 340 |
| 1 | Patricia: met, badge, incident log read, pencilled note points at Owen. | 360 to 460 |
| 2 | Owen: clone, then badge log (needs the incident log), Halloran's spare named. Server hallway door opened with the cloned card. IT notice, password door seen, sticky note after leverage. | 460 to 700 |
| 3 | Halloran: lanyard read, spare-badge ask, alibi. `torres_suspected` is NOT set here (see M5). Phone naming to Patricia, front-door reason accepted, office authorised. Office card from Owen. | 700 to 940 |
| 4 | Torres office: journal, mug dusted (about 12 commands), briefcase picked (assisted), medical bills. | 940 to 1075 |
| Reload 1 | `sync` then `location.reload()` at line 1086, with the print collected and the vault not yet opened. Title "Continue?", Mission Brief note reopens, player is back in reception_lobby. Inventory, globals, tasks all persisted, `torres_print_collected` held, vault later opened. | 1084 to 1110 |
| 5 | Server room by password, VM launcher, four flags (each toast "Task Complete"), vault opened with the lift, data centre docs read, 18 unread HaX texts. | 1110 to 1230 |
| 6 | Named Torres by phone with both halves: "Slowly. I'm writing this down." Recruiter text arrived about 6 s later; rang her, heard the offer, refused. | 1230 to 1310 |
| 7 | Confrontation at 20:14. Chose "Drop the philosophy" (fight). Four real fight attempts, all lost, then `debugKO`. | 1434 to 1800 |
| Reload 2 | At the post-KO choice (line 1814): Torres still KO'd (`currentHP 0, isKO true, isHostile true`), the choice came back as a HaX phone prompt (safety net), a "Resume session?" overlay appeared (resumed by exact-text DOM click). | 1812 to 1848 |
| 8 | Chose to stay with Torres, debrief (22 lines plus a choice), credits rolled to the last line, observed with a MutationObserver on `#bv-cr-label` (lines 1892+). | 1848 to 2016 |

Credits, as read: MISSION COMPLETE, INSIDER TRADING, OPERATION SCHRÖDINGER: STOPPED, CIVILIAN LIVES SAVED 30-45, THE CASE (BORROWED BADGE: Halloran's spare traced back to Torres), DAVID TORRES (DETAINED AFTER A FIGHT, handed to the police), ELENA TORRES (treatment unfunded), SOFIA (11) AND MIGUEL (8) TORRES, THE RECRUITER (OFFER REFUSED), QUANTUM DYNAMICS (WHO STOPPED THE INTERVIEW: never asked), "The Architect remains at large...". They match what was played.

## Combat: HP and time

Four attempts, none played "for real" in the sense of landing a hit.

| Attempt | Method | Result |
| --- | --- | --- |
| 1 | Chose the fight line, then 6 `pressKey` space presses | HP 100 to 40 within about 3 s of the dialogue ending, 0 by about 20 s (line 1461). The bridge refuses `pressKey` once the KNOCKED OUT overlay is up. |
| 2 | 8 `interact` calls (default "interact" HUD mode) | HP 100 to 0 in about 8 s (16:08:21 to 16:08:30), Torres HP unchanged. |
| 3 | In-page `playerCombat.punch()` every 300 ms with assisted facing, still in interact mode | HP 100 to 0 by 11.1 s, Torres 100 HP throughout. The punch was blocked by `canPunch()` because the default mode is `interact`. |
| 4 | Switched the HUD toggle (`#hud-mode-toggle-button`) to `jab`, then harness `interact` on Torres | Three `interact` calls returned `ok:true, mode:direct`, HP 40, 20, 0; Torres HP stayed 100 (lines 1740 onward). |

Torres' damage per `scenario.json.erb:1660`: `attackDamage: 20`, so five hits kill a 100 HP player. Observed rate after first contact: one hit about every 2.1 s, first hit about 3 s after the room loads. A player has about 10 s from entering. Torres' health after every "Restart" was back at 100 (only hostility and KO persist). So the fight is a race of roughly five landed punches in ten seconds; I could not judge it from a human seat. `debugKO` was then used (PASS (assisted); `convertedFromPeaceful:false, hpBefore:100`, player HP 100 at that point).

## What the brief asked to check

| Item | Result |
| --- | --- |
| Sprites and portraits | Pass. Patricia, Owen, Torres busts render at full size (screenshots 05, 08, 28). Netherton and HaX busts render in the briefing and debrief (01, 02, 35). Room sprites distinct (14, 25). |
| HaX's new bust | Pass in the briefing and debrief. **Fails on the phone**: the contact list and chat show the old generic bald face (M1). |
| Lighting and darkness | Not exercised: `scenario.json.erb` has no `lighting`, no sight challenge and no `disableAttacks`. Every room renders lit. Fight area shows a faint vignette around the player only. |
| Toasts | "Task Complete", "Access Granted", "Biometric Unlock Successful" and HaX text bubbles are readable. Two cosmetic points (M8). |
| Conversation backgrounds vs room | Patricia, Owen and Torres sit on solid black (`chatBackground` is not set anywhere). Briefing and debrief use the SAFETYNET office. The post-KO choice shows a generic purple matrix. Expected until stage 4 (POV backgrounds). |
| RFID denial hold | Not exercised (the correct card was used; no wrong-card attempt). |
| Tutorial hold | Declined only. |
| Required-task `*` marker | Visible: small orange mark after required tasks (08 "Interview Owen Gallagher (IT Admin) x", "Find the server room password x") and a "required" label on the aim header (07). |
| KO on reload | Pass: Torres stayed KO'd after reload (`[100, 0, true, true]`). |
| Mid-mission reload | Pass, inventory, globals and tasks persisted. The `torres_print_collected` global survived, so the vault still opened. |
| Credits | Played through, all lines captured. |

## Severity table

Classification is mine only where the evidence is clear; otherwise "suspect" and left for a human ruling.

| # | Severity | Class | Finding | Repro and log lines |
| --- | --- | --- | --- | --- |
| M1 | minor | mission | HaX's phone contact uses the generic bald avatar `assets/npc/avatars/npc_helper.png` (`scenario.json.erb:712`), while the briefing, debrief and the HaX entry at line 1117 use `agent_hax_headshot.png`. Seen in the contact list and chat. The Recruiter contact likewise uses `npc_hacker.png` (line 1071). | Open the phone at any point: screenshots 15, 26, 27, 33; log 1100 to 1110, 1228 |
| M2 | minor | mission (stage 4 pending) | No `chatBackground` on any room: Patricia, Owen, Torres, Halloran talk on solid black. Post-KO scene uses a purple generic background that does not match the data centre. | screenshots 05, 08, 28, 31; log 360, 520, 1440, 1804 |
| M3 | minor | mission | Torres' bust stands relaxed, hands in pockets, while the narration says he is down and bleeding on the floor. | screenshot 31, log 1804 |
| M4 | minor | mission | Two HaX bark texts arrive after the player has already done the thing and then read wrong: "Torres' office. IT holds a spare for every office, and Owen won't part with it without a reason" arrives on entering the office with the card in hand; "That's the vault reader. You've already lifted his print. Use it." arrives after the vault is already open. Both are in the HaX chat transcript. | log 1219 (transcript), toast in screenshots 16 and 25 |
| M5 | minor | doc | `TESTING_WALKTHROUGH.md` step 10 still says the Halloran interview sets `torres_suspected` and opens "Find Out Why". It does not (round 2 removed it; `torres_suspected` only came from the phone naming with the front-door reason). The path works, the walkthrough is stale. | `torres_suspected` absent after the Halloran chat (log 800), present after the phone naming (log 908) |
| M6 | minor | mission (content) | Vault label and Owen: "Cryptography Lead Only" and "the cryptography lead's thumb". Patricia and Halloran both say Dr Halloran leads the team and the cryptography division; Torres' print opens the vault. The phone naming also offers "He's the cryptography lead. He'd know how." (a decoy). A player can read the vault sign as pointing at Halloran. Needs a decision on Torres' title, or on the sign. | door name in `room` output, log 1120; Owen's vault line at the password reveal (about log 700); Patricia "Dr Ruth Halloran leads the team" (about log 400) |
| M7 | major (suspect, needs a human ruling) | mission design / suspect engine | After choosing the fight line the talk endings are gone. Re-interacting with Torres only punches. A player who loses has "Restart" as the only option, which reloads to reception_lobby (Torres hostile at full HP, a long walk back) and repeats. Combined with the 5-hit, about 10 s kill rate, a non-fighter has no way to the post-KO choice or the debrief. Could not tell if the fight is winnable by a human, because synthetic input never landed a hit. | log 1434 to 1800 (attempts 1 to 4); `unknown-entity:david_torres` at 1621 |
| M8 | minor | engine | Cosmetics: (a) HaX bubble toasts persist until cleared and wrap into a narrow column (screenshots 12, 16, 25); (b) the Task Complete toast sits over the minigame close button and the flag station intro text (screenshot 23). | screenshots 12, 16, 23, 25 |
| M9 | minor | engine | Player position is not persisted on reload or "Restart": always back in reception_lobby (160,144). The Mission Brief note also reopens after every reload (not an intro replay, but the player has to dismiss it). The "Resume session?" overlay (with "OTHER SESSIONS") appeared on the second reload but not the first. | log 1086 to 1110, 1486, 1823 |
| M10 | minor | harness | `enter` answers `door-locked` or `door-did-not-open` when a minigame (Mission Brief) or punch mode is blocking input, which reads like a locked door; `pressKey` is refused on the title screen (`minigame-active`), only `mg continue` advances it; `mg clickText "The Recruiter"` matches a line in HaX's transcript, not the contact (use the contact's preview text); dusting `debug.printCentre` (48,53) does not cover the print: coverage stalls at 32% unless the whole 128 px canvas is swept (stepMs 25, rows of 4 px) because the brush is tick-limited. | log 603, 1551, 1619, 1679; session notes |
| M11 | minor | harness / unattributed | A 404 for `assets/characters/female_hacker_hood_v2_talk.png` appears 82 times in the shared :3001 log. m05's player uses `male_hacker_hood_down`, so it is probably m04 or m06, not m05. No m05 asset 404 found that I could attribute to game 2222. | `tmp/keyless-3001.log` |

Counts: **0 blockers, 1 major (suspect), 10 minors.** No finding classed "engine" with certainty beyond M8 and M9 (cosmetic or known behaviour).

## Observations worth keeping (not findings)

- Whodunnit gates held: before evidence, nothing in the to-do list or HaX texts names Torres; "Find Out Why" opened only on the phone naming with the front-door reason; Patricia's text ("a pattern, not a reason, and not proof the data's going anywhere") is a fair partial acceptance.
- The Recruiter text arrived after the naming conversation closed; the debrief and credits both reflect "refused the offer", "detained after a fight", "never asked who cancelled the interview" (no stand-down email was taken).
- Debrief ties the Task Force Null wall into the Architect's authorisation, as the brief wanted.
- Debrief opens with "SAFETYNET headquarters. Thursday morning, nine o'clock." There is no "arrest" in the debrief or credits. The global `torres_arrested` is still named that way (internal only).
- The credits visualiser clips its right-hand panel at 1400 px width. Probably harness viewport only.
- Not exercised in this run: the talk endings, the Patricia-KO and Owen-KO fallbacks, wrong accusation (Halloran), the stand-down email, the tutorial accept path, the RFID wrong-card denial. A struggling-player run (stage 6) should cover them.

## What the run did not do

No VM work (flags supplied); no real combat (KO assisted); the briefcase pick was assisted; fingerprint pattern classification used the harness's `debug.pattern`.
