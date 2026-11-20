# m06 Follow the Money: pass-5 regression playtest A (engine regression)

**Which question:** plumbing against today's engine (question 1), plus a little unexpected behaviour (fights, KO, reloads). This is a regression run, not blind. The route and the slot were known in advance; every secret was still fetched in game before use (table below).
**Sources used for the checklist:** `TESTING_WALKTHROUGH.md` and `PASS4_PLAYTEST.md` (numbered steps from the walkthrough).
**Environment:** keyless server :3001 only, headless (load was low, 2.6; headless because other agents were playtesting). Own game ids only. Both sessions stopped with `session-stop.sh`.

| Game | Purpose | Session log | Flags XML | Commands |
| --- | --- | --- | --- | --- |
| 2223 | main run: briefing to credits, four fights, three reloads | `tools/playtest/m06-pass5-regress-A-session.jsonl` (1924 lines) | `tools/playtest/m06_follow_the_money-flags-game2223.xml` | 1923 |
| 2231 | short: other briefing route, RFID door, a won fight | `tools/playtest/m06-pass5-regress-A-session-B.jsonl` (270 lines) | `tools/playtest/m06_follow_the_money-flags-game2231.xml` | 269 |

Screenshots: session scratchpad `m06-regress-A/` (00 to 45). Wall clock for game 2223: 1550 s played, 14:46 to 15:12 UTC, including about 9 minutes of fighting and restarts.

**The files moved under me.** The guard greeting read "Afternoon" in game 2223 and "Evening" in game 2231 (the `.ink` source now says only "Evening"), and the HaX phone contact avatar changed in `scenario.json.erb` between my two greps. Someone is editing m06 while I test. Findings that name these are marked "(since edited)".

## verify-run.rb output (both run after `sync` and `session-stop.sh`)

Game 2223:

```
game            2223  (mission 50)
created         2026-10-13 14:46:39 UTC
last write      2026-10-13 15:12:29 UTC
played for      1550s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, server_room, blockchain_lab, data_center, executive_wing, satoshi_office
unlocked objs   3: transaction_server, cold_storage_console, executive_safe
inventory       17: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, SAFETYNET Field Guide: Reconnaissance and Network Mapping, Door Controller Export, mixer_settlements.log, mixer_pool_config.yml, custody_index.csv, The Architect's Fund Allocation, Executive Access Badge, The Architect's Identity File, Cold Storage Recovery Keys
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_145386}, ..._2_3be49a, ..._3_e85ba9, ..._4_a34e92
globals set     43: analyst_spoken, architect_identity_found, assets_decided, assets_seized, blockchain_debrief_available, briefing_played, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_caught, guard_resolved, guard_waved_through, irina_badge_cloned, irina_exec_badge_given, irina_fate_decided, irina_recruited, player_name, privesc_guide_offered, read_settlement_log, recon_guide_hint_given, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_stance, server_passphrase_known, start_debrief_cutscene, trader_heard_out, trader_ko, trader_spoken

VERDICT: progress recorded — 7 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

Game 2231: `VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.` (globals: briefing_played, cover_strained, guard_resolved, guard_waved_through, rfid_guide_offered, lockpick_guide_offered, trader_heard_out, trader_ko, ...). Full text in scratchpad `m06-regress-A/verify-2231.txt`.

Mission conclusion is decided server-side and the verifier does not print it. After credits a plain reload of 2223 showed the "MISSION COMPLETE // AUDIO INTEL" overlay again with `room: null` and no open tasks, which is the terminal state. I did not wait on the screen.

## Earned-secrets table (game 2223)

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Server room passphrase | `bitcoin2025` | year from the IT New Starter Checklist (read, log 100-ish, step 3); term `bitcoin` top of Irina's Password Dictionary List (taken from her at trust, opened in game before the lock) | wordlist step 9, checklist step 3, lock step 11 | yes |
| Irina's wordlist | (item) | Irina, "test your password strength" hub option | step 9 | yes |
| Irina's CTO badge clone | EM4100 card | cloner read during her conversation (Save) | step 10 | yes (not used on a door) |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | in-game prerequisites reached: server room opened, terminal launched (`access_hackme_vm`), recon guide taken from HaX. Cracking and distcc guides offered but not taken | flags at steps 24, 25, 26, 38 | **no, flag supplied** (session policy). VM work is not possible in standalone. |
| Data centre PIN | `3110` | Door Controller Export (flag-3 reward), row DC-02 and the "31/10" note | after flag 3, step 27 | yes, **but only downstream of a supplied flag** |
| Custody slot | `4471` | Priya's write-up (three deposits, amount less fee, after the hold) + `mixer_pool_config.yml` (1.5%, 6 h) + `mixer_settlements.log`. Decoy `3815` tried first and refused | data centre, step 29 | yes (worked from the three files by hand: 2,364,000 at 04:20, 6 h 40 after the 21:40 deposit). Not blind: I knew the number. |
| Executive badge | (item) | Irina hub option "Satoshi's wing. You've a badge for it" after the fund was found | step 31 | yes |
| Executive safe PIN | `2140` | Irina said it on recruiting ("the year the last bitcoin is mined") | step 31, used step 33 | yes |

**Boundary of what the run proves.** Flags 1 to 4 were handed over, not earned, so everything downstream of flag 3 (export, `3110`, data centre, fund, wing, ending) is exercised, not proven. Everything upstream (guard, Irina, wordlist, passphrase, lab, write-up, terminal launch) is a genuine solvability pass.

## Timeline (game 2223, UTC; line numbers in the session log)

| # | Time | Step | Result |
| --- | --- | --- | --- |
| 1 | 14:46 | Opening cutscene: HaX bust and briefing-room background. Picked "Which exchange?", "How do I get in?", "I'm ready." | PASS. About 10 lines, FCA cover and kit line heard. `receive_briefing` completed at the top. `bootstrap` not used. |
| 2 | 14:47 | Tutorial prompt in reception; declined | PASS (`engine_tutorial_declined`). |
| 3 | 14:48 | Checkpoint: read IT checklist, then picked the trading-floor door in the guard's cone (log 132) | PASS. `on_lockpick_seen` plays, sets `guard_grace`, `guard_caught`; re-entering the lobby clears `guard_grace` and the talk route then works. |
| 4 | 14:49 | Guard talk: FCA, Volkova | PASS. `guard_waved_through`, door opened. |
| 5 | 14:50 | Irina: papers, surveillance, wordlist, cloner read | PASS. `meet_irina`, wordlist item, `irina_badge_cloned`. Toasts Task Complete, Mission Updated, Objective Complete stack at top right. |
| 6 | 14:51 | Server room: `bitcoin2025` (log 382) | PASS. `access_server_room`, aim "Crack The Backend" opened. |
| 7 | 14:52 | Lab: Priya (mixer method), write-up | PASS. Three deposits with amounts and times, no slot. |
| 8 | 14:53 | Dani first meeting | PASS (intro only, no hub). |
| 9 | 14:53-14:59 | **Four fights with Dani** (see Fights) and four KO restarts | see below |
| 10 | 14:59 | `debugKO trader_npc` (log 944, assisted) to get on with the run | PASS (assisted). |
| 11 | 15:00 | Plain `location.reload()`, Resume overlay clicked via DOM (log 1024-1025) | PASS. Dani still KO and on his death frame. |
| 12 | 15:01 | Server room terminal, HaX recon guide | PASS (`access_hackme_vm`, guides offered). |
| 13 | 15:02 | Flags 1-3 submitted, "flag supplied" | PASS. Flag 3 gave the Door Controller Export, `Map The Money` opened. |
| 14 | 15:04 | Data centre `3110`; transaction server, three files taken | PASS. |
| 15 | 15:06 | Custody console: `3815` refused, `4471` opens; fund document taken | PASS. HaX text on the fund arrived. |
| 16 | 15:07 | Irina: executive badge, then evidence-first recruit; she gave `2140` | PASS. |
| 17 | 15:08 | Exec wing door opened with the badge (no reader), HaX "Hold on. You haven't got the vault account yet" text arrived (no flag 4) | PASS (text read from the phone thread DOM). |
| 18 | 15:08 | Satoshi's office, safe `2140`, identity file | PASS. |
| 19 | 15:09 | Flag 4 supplied; Cold Storage Recovery Keys given | PASS. |
| 20 | 15:10 | Satoshi: Ghost, nothing justifies, bankroll, freeze, "stays put", "No." | PASS. `satoshi_confronted`, `assets_decided`, debrief opened. |
| 21 | 15:11 | Debrief: fund, Volkova (clone line), Okonkwo knocked down, flags, FCA letter (picked house rule, shared password, Monero) | PASS. HaX corrected Monero, "Two good ones". |
| 22 | 15:12 | Credits read from `#bv-cr-label` (MutationObserver) | PASS. Lines: FROZEN, GUARD waved through, IRINA turned, SATOSHI detained "handed to the police", DANI "Knocked out, had done nothing wrong", PRIYA neutral, IDENTITY 87% Tesseract, "72 hours. Six cells. Some of them were already paid." |
| 23 | 15:12 | Reload after credits | conclusion overlay shown again, `room: null`. Terminal state. |

Game 2231 (16:11 to 16:15): other briefing route ("Which payments?", "Why would Volkova help us?", "What am I looking for?") plays and sets `briefing_played`; the cover is heard on that route. Guard talk, trading floor, CTO office RFID door opens the flipper (Read / Saved, "No saved cards"). Real fight won (below).

## Fights (HP and time)

Combat is optional in m06 (KO paths only). I fought Dani Okonkwo, who turns hostile when punched. The player starts at 100 HP, Dani at 100 HP, attack 10 per 2 s.

| # | Game | Mode | Start to end | Outcome | Notes |
| --- | --- | --- | --- | --- | --- |
| F1 | 2223 | jab (HUD toggle clicked in DOM) | 15:53:12 to about 15:53:50 | **lost**, player 100 to 0 | seven jabs landed, Dani 100 to 30. My `interact` loop punched every 2 s, the same rate he hit. |
| F2 | 2223 | cross | 15:55:10 to 15:55:14 | lost | zero hits landed (Dani 100). Not facing him after the reload (spawn facing). |
| F3 | 2223 | interact (auto-jab) | 15:57:21 to 15:57:44 | lost | zero hits landed; Dani stayed at 100. |
| F4 | 2223 | interact + 40 ms walk toward him | 15:58:30 to 15:59:00 | lost | zero hits; Dani sat diagonal behind the facing direction. |
| F5 | 2231 | cross, set after `moveToNear` | 16:14:51 to 16:15:01 | **won**, player 100 to 70 | four cross hits, Dani 100, 75, 50, 25, 0. `npc_ko`, `trader_ko` set. About 10 s. |

F2 to F4 are harness limits, not engine faults: `interact` does not turn the player to face the target, and a punch only lands inside the 32 px cone in the facing direction (`player-combat.js` `checkForHits`). Evidence for that reading: F5 landed all four hits once I was positioned with `moveToNear` first.

## What the brief asked me to check

| Area | Result |
| --- | --- |
| Player KO and Restart | Works four times. "KNOCKED OUT / You have been defeated", Restart reloads with `skip_resume=1`, title screen "Continue?", then the Mission Brief notes popup. The player returns to `reception_lobby` at full HP. |
| KO'd NPC on reload (dda42a45) | **PASS.** Dani was `isKO: true`, anim `npc-trader_npc-death-down`, lying down after a reload (screenshot 23b). |
| Hostile NPC on reload | Hostility restores but HP does not: Dani went 30 to 100 on reload and attacked again. Engine, minor. |
| Reload at a risky moment | Done three times: after a KO (four restarts), a plain reload with Resume, and after the credits. Progress, globals and the guard's unlocked door survived. |
| Toasts (bark lifetime) | HaX toasts read fine (green, wrapped, readable), cleared themselves, stayed below the objectives panel in every screenshot (07, 09, 25, 32, 45). Task notifications are separate and stack to four at the top right (screenshot 36); they cover the speaker's face during a conversation (screenshot 07). |
| Required-task `*` marker | Works. `*` appears only in aims that also have optional tasks (Work The Floor, Map The Money, Reach The Top Floor), "* required" key in the header. Not shown in aims with no optional task (Establish Cover, Crack The Backend), as the commit says. |
| Sight challenge | Works (row 3 above). Cone drawn, lockpick seen opens the cutscene, grace until re-entry. |
| Tutorial hold | Not exercised: the tutorial prompt opened in reception, away from the guard. |
| RFID denial hold | **Not exercised.** The exec-wing door opened straight from the badge in inventory with no reader. The CTO door opens the flipper but I held no wrong card (the only card I could make was the right one). |
| Renamed sprites and HaX bust | HaX's new bust renders in the briefing and debrief (screenshots 01, 39). Guard, Irina, Priya, Dani and Satoshi portraits render. Nightshade and Netherton were heard in the briefing text only, no screenshot of their busts. In-world player sprite and NPC sprites render. |
| Lighting variants | Not applicable yet: every room is fully lit in every screenshot (no dark or motion-sensor rooms in m06 so far). Not a regression. |
| Conversation backgrounds | Do **not** match the room. See M2. |

## Findings

0 blockers, 0 majors, 12 minors.

| # | Severity | Class | Finding | Repro and log lines |
| --- | --- | --- | --- | --- |
| M1 | minor | mission (asset) | HaX's toast and phone avatar is `assets/characters/agent_hax_headshot.png` (file dated 2 Mar 2026), a small dark hooded figure. The new bust is a woman in a trench coat and fedora. In game 2223 the phone contact used the generic green `npc_helper.png` face (since edited on disk to the headshot; the headshot itself still does not match the bust). | Game 2231 screenshot 45 (toast avatar); game 2223 screenshots 09, 26. Session log 2223 around line 1131 (phone open). |
| M2 | minor | mission (known, stage 4 pending) | Conversation backgrounds are plain black for the guard, Irina, Priya, Dani and Satoshi. The lockpick-seen cutscene uses a magenta matrix pattern. Only the briefing and debrief have a room (the briefing room). None match the room the conversation happens in. | Screenshots 04b, 05, 07, 13, 14, 38. |
| M3 | minor | mission (art placeholder) | Satoshi's portrait and world sprite are a faceless hooded figure, close to the player's own hood sprite, while the narration describes "a man in his early forties" with a framed whitepaper. Priya's portrait is a blonde woman (cast diversity, characters stage parked). | Screenshots 36, 38, 13. |
| M4 | minor | mission | HaX's "Remind me where we are" still gives the server-room door lines ("The server room door takes a crypto term and a year…") after the door is open and the terminal launched, until flag 1 is submitted. The condition is `(found_password_lists or server_passphrase_known) and not flag1_submitted` with no "door opened" test. | Game 2223, phone hub, log near 1055-1100; `m06_phone_agent_0x99.ink` `=== recap ===`. |
| M5 | minor | mission (canon) | Satoshi: "The police are on their way up", the debrief says "handed him to the police", credits "Detained, handed to the police". The brief says SAFETYNET detains and hands over; `docs/IDEAS_BACKLOG.md` lists the fix. | Game 2223, Satoshi `aftermath`, debrief, credits (`window.__cr`). |
| M6 | minor | mission (doc) | `TESTING_WALKTHROUGH.md` says the custody console gives three tries per opening. The PIN log showed five wrong attempts in one opening with no lockout (the harness retried five times). Either the limit is not enforced on this lock or the doc is out of date. | Game 2223, `lock` code `3815`, log near 1131; screenshot 30b. |
| E1 | minor | engine | A hostile NPC's HP is not saved: Dani 30 HP before a reload, 100 after, still hostile. | Game 2223 around log 653 to 694. |
| E2 | minor | engine (UI) | The objectives panel clips later tasks once three or four aims are open: `max-height 560`, `overflow-y auto`, content 666 px, so the last required tasks are cut off at the bottom and no scrollbar is visible. It also covers the left edge of the room. | Screenshots 11, 32 (panel content clipped at "flag (0/1)", "Crack the CEO's safe"). |
| E3 | minor | engine (cosmetic) | The guard's green line-of-sight circle and cone keep drawing across the other rooms after he has waved the player through, tinting the player and the desks green on the trading floor. | Screenshots 06, 09, 19, 45. |
| E4 | minor | engine (cosmetic) | The hearts row sits on top of the inventory bar, hiding part of the third and fourth slots. | Present in every in-game screenshot (03, 06, 11, 45). |
| H1 | minor | harness | `interact` on the custody console reports `ok:false, mismatch:true, wrong-target-opened` because the PIN minigame is titled "Enter PIN for item". It is the right lock. | Game 2223 log around 1131; interact result `reason: wrong-target-opened`. |
| H2 | minor | harness | `interact` does not face the target, so punches miss (F2 to F4). `moveTo`/`enter` pointer movement also does nothing while the HUD is in jab or cross mode (clicks punch instead). Switch to interact mode to travel. Also `lock` retried five times on a failing PIN. | Game 2223 log 646-770 (F2 to F4); screenshot 20. |

Notes that are not findings:
- Both RFID checks and the tutorial hold are listed as "not exercised" above, not as passes.
- "Evening" and "Afternoon" for the guard are the file being edited (see top), not a time-of-day feature.
- A plain reload shows the "Resume session?" overlay (with "Load session #N" buttons for other games). I clicked Resume by exact text through the DOM, as the skill says.
- After a plain reload and Resume the player always returns to `reception_lobby`.
- The briefing's Nightshade and Netherton lines read fine; no sprite check on them.

## Top issues for the caller

1. No blocker or major. The critical path, guard sight challenge, KO and Restart, KO persistence, three reloads, debrief and credits all work on today's engine.
2. M1: HaX's headshot (toasts, phone) is the old hooded asset and does not match the new bust, in every mission that uses it.
3. M2: all person-chat backgrounds are black, apart from the briefing and debrief; room POV backgrounds are the pending stage.
4. M4, M5: recap staleness and the "police" wording are cheap fixes.
5. Not covered: RFID denial hold (needs a wrong card at a reader; the exec-wing door never opens the reader when the badge is carried), tutorial hold, lighting variants (none in m06 yet), and any solvability past flag 3 (flags supplied).
