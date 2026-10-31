# m03 pass 2: blind playtest A4 ("do your best")

**Run type.** Blind run, persona "do your best" (one run; the "struggling player" persona was not run). It answers question 1 (does the plumbing work) and, as far as a blind player can, question 3 (does the mission teach what it needs). It does not answer question 2 (unexpected behaviour) beyond one reload and one cover-story choice with the guard. No off-path softlock runs.

**Tester notes.** Headless (load average about 9 at start). Fast speed. About 24 minutes of wall clock (1451 s), 2085 harness commands (many were state reads and screenshots). Reached the credits and the server-side conclusion globals were set.

- Game id: **2195**, mission 47, keyless server :3001. Never touched :3000.
- Session log: `tools/playtest/m03-blindA4-session.jsonl` (2086 lines). Flags XML: `tools/playtest/m03_ghost_in_the_machine-flags-game2195.xml`. Screenshots: scratchpad `m03-blindA4/` (33 images).
- Read only what the brief allowed. The harness `room` command lists hidden NPC ids (`closing_debrief`, `night_transition`, `briefing_cutscene`) with off-screen coordinates. I saw them and didn't use them.
- Harness-driven, not typed: the flipper menu items (DOM click on the visible `.flipper-menu-item`, as the skill documents), CyberChef input and recipe (iframe URL hash, so "assisted"), the inventory icons (DOM click on the icon), the tutorial's Skip button (DOM click). Lockpicks used `completeLockpick` ("assisted") three times: server filing cabinet (line 1064), Sterling's office door (1526), Sterling's filing cabinet (1622). So **the guard's stealth rule was never really tested** (see S4).

## verify-run.rb output (pasted in full)

```
game            2195  (mission 47)
created         2026-10-12 22:30:50 UTC
last write      2026-10-12 22:55:01 UTC
played for      1451s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, danny_office, executive_office
unlocked objs   6: server_filing_cabinet, danny_office_pc_2, executive_office_suitcase_2, victoria_computer, exec_filing_cabinet, wall_safe_server
inventory       15: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, CyberChef Workstation, Training Lab Runbook, SAFETYNET Field Guide: Reconnaissance and Network Mapping, Folder: GHOST -- Hospital Infrastructure Assessment, Personal notes (unsent), Hidden USB Drive, Unsent email to the night team (raw source), Client Roster, Zero Day: A Brief History, Exploit Catalogue, Zero Day Transaction Log
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott, danny_foster
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_6364ef}, ..._2_4ee338, ..._3_ba9109, ..._4_8c1f65
globals set     45: briefing_played, catalogue_seen, clone_call_done, cloner_explained, cyberchef_guide_offered, danny_evidence_seen, danny_fate, debrief_played, defended_danny, draft_seen, engine_tutorial_completed, exec_office_entered, exec_wing_entered, exec_wing_night, ffion_night_story, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_challenged, guard_waved_on, knows_m2_connection, lockpicking_guide_offered, lore_catalogue_found, lore_directive_found, lore_history_found, mission_phase, named_target_selection, netexploit_guide_offered, night_confrontation_ready, night_explored, pc_call_done, player_approach, reception_badge_cloned, roster_seen, sable_named, transaction_log_read, usb_seen, victoria_card_cloned, victoria_choice_made, victoria_fate, vm_flag1_reward, vm_flag2_reward, vm_flag3_reward, whiteboard_seen

VERDICT: progress recorded — 6 rooms beyond the first, 6 objects unlocked, 4 flags submitted.
```

Note "current room reception_lobby": the persisted room is the start room, not where I finished (conference room). See S1.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Receptionist badge clone | (item, UID DB 7F A6 3A) | Ffion Rees, dialogue option "Lean in by her lanyard…", cloner, dictionary attack | step 6 | yes |
| Sterling executive keycard clone | (item, UID FD 17 1D B9) | Victoria in the conference room, whiteboard option starts the read; Darkside ~30 s | step 11 | yes |
| Whiteboard note (ROT13) | `ROT13` | Server room whiteboard text ("the decoding laptop will read it"), CyberChef | step 17 | yes, but input and recipe set by URL hash (assisted) |
| USB drive (Base64 then ROT13) | `From Base64`, `ROT13` | Desk drawer in Sterling's office, observation text on the file; HaX "layered, so decode again" | step 31 | yes, assisted as above |
| Client roster (hex) | `From Hex` | Sterling's computer, observation text says digits and a–f in pairs | step 36 | yes, assisted as above |
| Sterling's computer password | `Sterling2010` | Helpdesk slip on the screen ("surname plus the year we were founded") + HaX briefing ("Founded WhiteHat in 2010") | step 33 | yes. The plaque in the lobby, the other designed source, was never read in this run; the briefing gave the year. Confirmed afterwards by the "Brief History" document |
| Wall safe PIN | `5829` | Server-room whiteboard ("Sable has changed the code… mailing the new one from her office") → Sterling's computer → unsent email (Base64) | step 37 | yes |
| `ghost_in_machine_vm_network:flag_1..4` | `<flag:1>`…`<flag:4>` | Drop-site terminal. **No VM work done: standalone has no VMs** | step 41 | **no — flag supplied.** Prerequisites reached: VM terminal opened (it shows 192.168.100.3 and VirtualBox instructions only), Training Lab Runbook read, recon guide requested |

**What the "no" rows mean.** Everything up to and including reaching the VM terminal and the drop-site was played. The VM challenges (scan, FTP, price list decode, distcc) were exercised through supplied flags, so they are *not tested*. The Transaction Log, the opening of `find_operational_logs` and the whole "Settle Accounts" stage are downstream of supplied flags, so they are exercised but unproven for solvability. The price-list decode ("Decode the pricing intel") lives on the VM, so I never saw what the player decodes there.

## Timeline: what I thought the goal was

1. **Briefing (HaX hub).** Goal: get into WhiteHat as a recruit, clone Sterling's card, come back after dark, pull four flags, find the paper trail. Asked every topic, chose "thorough" as the approach. HaX's "Ask me whatever you need" hub was clear. The approach choice had no stated effect.
2. **Mission Brief notes + tutorial prompt.** The notes window opens by itself after the briefing, which is a good "what am I doing" anchor. Tutorial skipped by harness.
3. **Reception (Ffion).** Goal: get past the conference-room reader. The lanyard option is in the first menu, so I never had to work out that I could clone her. Read, dictionary attack, save, emulate at the reader. Worked first time.
4. **Conference room.** Read the whiteboard (training lab diagram: "students do NOT touch the legacy build after hours"), met Victoria. NHS question, then the whiteboard option started the Darkside read; Sterling noticed the cloner's glow ("Her eyes drop to your pocket") and I deflected with flattery. Card saved.
5. **Day ends.** The HaX toast told me stepping into the hallway ends the day. Good warning. Cut to 11 pm: "Eleven o'clock that night, you're back. The staff entrance takes the receptionist's badge without a murmur."
6. **Server room.** Goal now: four flags, but I looked for the paper trail first. Whiteboard ROT13, runbook, VM terminal (no VM), CyberChef.
7. **Phone.** Opened HaX's hub myself. Learned about Danny and requested the recon guide. Not read in full.
8. **Executive wing.** Terry spotted me while I was standing still in his corridor (I was reading a screenshot); cover-story conversation (see decisions). Reload here.
9. **Danny.** Read his files, talked to him.
10. **Sterling's office.** Lock, USB drive, computer, filing cabinet. Learned the safe code and the Phase 2 directive.
11. **Safe, flags, transaction log.** Four flags accepted in a row. The Transaction Log arrived as a reward.
12. **Confrontation, debrief, credits.** Offered Sterling a deal. Debrief reacted to the guard, the flip, Danny and the paper trail.

## "Didn't know what to do" moments

| # | Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- | --- |
| 1 | Ffion's hub (my mistake) | ~30 s | I picked "Thanks…" by regex and it matched the *leave* option, so I walked out without cloning | The objective still listed `clone_reception_badge`, so I went back. Nothing wrong with the game, but the "Thanks" / "Thanks. I'll head through" wording sits close |
| 2 | Danny's workstation and other computers | ~2 min | Took a file expecting a viewer. The harness `take` on a "view" item gave no viewer and the file went straight to the inventory | Opened the file from the inventory icon. A player clicking the item would probably get the viewer; **I can't tell whether that's a real player issue** (S5) |
| 3 | Terry: "Why d'you want to know my route?" | ~10 s | Looked for a reply to his direct question; the menu only offers other topics | Took "I'll let you get on". Minor |
| 4 | Where the safe code is | none | The server-room whiteboard says it, and HaX's phone hub has "I can't get the server room wall safe open", which I did not need | n/a. The chain was clear enough on its own |

Nothing stuck me for minutes. The only real "no way out" candidate was number 2 and it comes from how the harness drives containers.

## Decisions

| Decision | Felt | Consequence seen later? |
| --- | --- | --- |
| **Approach** ("I'll be thorough" / "I move fast…" / "I'll stay flexible") | Arguable only as a persona label. Nothing in the wording says what it changes | Weak. The debrief says "you brought the whole paper trail out" and HaX's reply to the choice ("Zero Day leaves paper. Find it, connect it", "Stealth counts") sets up the guard. The credits don't mention it. I couldn't tell whether choosing "fast" would have removed anything |
| **Sterling cover-story, NHS question** ("Take the forty" / "Report it, then invoice" / "I'd want to know what the buyer wanted it for") | Genuinely arguable: greedy, principled-wry, curious. I chose curious | **Yes, immediately.** In the confrontation: "You asked what the buyer wanted it for. I should have ended the interview there." Not in the debrief or credits |
| **Guard cover story** (research / Sterling asked / maintenance / SAFETYNET) | Arguable, mostly through who Terry can check with. The SAFETYNET option was obviously the dumb one | Partly. Terry gives "Ten minutes", then "I've got your face now". HaX in the debrief: "The guard stopped you once. He never caught you at a lock". The ten minutes never came due in my run (S4) |
| **Danny** (come in and testify / you'll answer for it / decide it yourself), then "Sterling goes down… you tell them everything" | Arguable. A second prompt lets you reverse ("Don't thank me yet") | **Strong.** HaX: "Danny thinks Sterling's going down. She isn't… Somebody has to tell him she's walking. It should be you." Credits: "DANNY FOSTER: PROTECTED". I did not tell Danny (the debrief hands you three replies but nothing happens in play afterwards) |
| **Sterling** (a deal / arrest / let her go) | Arguable. HaX had hinted "a source inside beats a cell we can't see" and the line "Not immunity" makes the deal feel honest | Strong. Debrief: "Counter-intelligence is running her now", "a win with its teeth showing". Credits: "TURNED — a cold asset now, not a convert" |
| **Debrief replies** ("She's worth more as a source…" etc.) | Obvious: every option agrees with HaX | None needed |

## What I learned, in my own words

- A Classic MIFARE badge with default keys falls to a dictionary attack in seconds; a badge with custom keys needs Darkside (about half a minute) and you must keep the target talking while it reads. A card that anyone can read from an arm's length away is a key you've handed out.
- ROT13 is a substitution, and "encoding isn't encryption": data in Base64 or hex is just a different alphabet. Messages can be layered (Base64 over ROT13), so if the output still looks wrong, decode again.
- Real-world weak spots here: a house default password printed on a slip stuck to a monitor, a vulnerable service left running because it's useful, a code written on a whiteboard.
- Sequence for a network job, from the runbook and HaX: scan first, work through the services, treat the legacy box as the dangerous one and the case.
- Lab-sheet question coverage can't be judged: I didn't read the lab sheet (only the field guide title page loaded).

## Five best lines

1. Terry Mott: "I've got your face now. Don't make me use it."
2. Victoria Sterling: "You asked what the buyer wanted it for. I should have ended the interview there." (the NHS payoff)
3. Victoria Sterling: "You didn't move me. You're simply a better bet than a shallow grave."
4. Danny's unsent notes: "I should go to someone. But if I do, I'm the man who drew the map. What happens to them? To me?" with the framed crayon sign "MY DAD IS A GOOD HACKER".
5. Agent HaX: "Whether she stays turned is anyone's guess. Today, it's a win with its teeth showing." and Netherton's cover sheet: "she priced a hospital".

## Five worst lines

1. Terry Mott: "Why d'you want to know my route? … Well?" The menu can't answer him.
2. Player option: "That's murder with an invoice attached." Reads like a slogan, not something said to a handler.
3. Agent HaX: "Smart. Zero Day leaves paper. Find it, connect it." (reply to the approach choice) Flat and generic for the first decision of the mission.
4. Agent HaX: "He knows you spoke up for him in front of Sterling." In the confrontation I accused Sterling over Danny; "spoke up for him" overstates it, and it depends on a line the player might not have picked.
5. Danny Foster: "Everything. Yes. God, yes." A touch overwrought after the quiet scene before it.

## Scores (1–5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
| --- | --- | --- | --- | --- |
| 4 | 4 | 4 | 3 | 4 |

Reasons in brief: fun and pacing are carried by the Sterling and Danny scenes. Goals were clear at every stage (objectives panel, toasts, phone hub). Decisions are open where they matter (Sterling, Danny) but the approach choice does nothing visible, and the debrief hub choices all agree. Teaching is strong for RFID and encoding; the network side is on the VM, which I couldn't test.

## Severity table

I can't classify anything as a game bug; items below say what I saw and what I suspect.

| # | Severity | Finding | Repro (log lines) |
| --- | --- | --- | --- |
| S1 | minor | After a page reload the player is put back in the reception lobby (start position), not the room they left. Tasks, globals and inventory all survive. verify-run.rb also reports the current room as `reception_lobby`. Suspect engine. Harmless here because the doors stay open, but a player at 11 pm in the executive wing has to walk back | game 2195, reload at line 1302, `brief` after it |
| S2 | minor | Credits ticker reads "GHOST IN THE WIRE · VICTORY", but the mission is "Ghost in the Machine" | game 2195, lines 2074 ff. (screenshot `33-credits.png`) |
| S3 | minor | Weak payoffs: the approach choice and the NHS answer don't appear in the debrief or credits (the NHS answer shows only in the confrontation line). The credits list Sterling and Danny only | lines 1869 ff. debrief; credits log in this report |
| S4 | minor | The guard's "ten minutes" and "see you picking, he won't stop at talking" rules never came due. I stood in his cone, was challenged, talked my way through and then picked locks with the assisted solver. Stealth consequences are untested here | game 2195, lines 1205 ff. |
| S5 | minor | Containers on Sterling's and Danny's computers list files as "view" items, but taking one in the harness gives no viewer: the file goes straight to the inventory. Suspect harness, not the game; a human player should check that clicking the file opens it | game 2195, Danny's workstation, lines 1357 ff. |
| S6 | minor | Terry asks "Why d'you want to know my route?" and the menu has no answer | game 2195, line 1273 |
| S7 | minor | At 11 pm Ffion is still at the reception desk and Victoria is still standing in the conference room (see screenshots `12b-night.png`, `23-reload2.png`). Victoria is in the conference room on purpose for the confrontation; Ffion at the desk at 11 pm looks like a daytime leftover | `12b-night.png`, `23-reload2.png` |
| S8 | minor | Victoria's NHS answer is acknowledged in the confrontation, but "She noticed the cloner" (her eyes drop to my pocket) has no later reaction either way | lines 893 ff. |

**Counts: 0 blockers, 0 majors, 8 minors.**

## Top three issues

1. Weak or missing payoff for two openers (the approach choice and the NHS answer) in the debrief and credits (S3).
2. Reload drops you in the start room mid-mission (S1).
3. Credits ticker names the wrong mission ("Ghost in the Wire") (S2).

## Not covered

- "Struggling player" persona, off-path softlocks, a second reload, the VM-side work (scan, FTP, price list decode, distcc).
- Whether picking a lock in view of the guard really stops the player.
- Whether the lobby plaque and the other optional notes carry the same year as the briefing (I never read the plaque).
