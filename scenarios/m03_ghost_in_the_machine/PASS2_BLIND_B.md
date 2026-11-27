# m03 Ghost in the Machine: Pass 2 blind playtest B ("struggling player")

Blind run, persona "struggling player", headless (load average about 1 at start). Questions answered: 2 (unexpected behaviour) and 3 (can it be finished without doing the work). Flag policy `session` ("flag supplied").

Games: **2183** (full messy run to credits, 1241 commands) and **2185** (short second game: receptionist KO'd on day one, three reloads, cloning retry paths).
Session logs: `tools/playtest/m03-blindB-session.jsonl` (game 2183), `tools/playtest/m03-blindB2-session.jsonl` (game 2185). Flags XMLs: `tools/playtest/m03_ghost_in_the_machine-flags-game2183.xml`, `...game2185.xml`.
Combat was never played. Every KO (Ffion, Terry, Victoria) used `debugKO`: "exercised, not fought". `completeLockpick` used on the executive office door: "assisted".

## verify-run.rb output

Game 2183:

```
game            2183  (mission 47)
played for      902s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office
unlocked objs   2: victoria_computer, executive_office_suitcase_2
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log, Client Roster, Unsent email to the night team (raw source), Hidden USB Drive
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott
flags submitted 4: ..._1_45330b, ..._2_70e1b1, ..._3_91eabe, ..._4_1dad6b
globals set     37: briefing_played, clone_call_done, conference_reader_tried, danny_fate, debrief_played, draft_seen, engine_tutorial_declined, exec_office_entered, exec_wing_entered, exec_wing_night, ffion_night_story, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_knocked_out, knows_m2_connection, lockpicking_guide_offered, lore_directive_found, mission_phase, netexploit_guide_offered, night_confrontation_ready, night_explored, pc_call_done, player_approach, reception_badge_cloned, receptionist_ko, revelation_heard, roster_seen, usb_seen, victoria_card_cloned, victoria_choice_made, victoria_fate, victoria_ko, vm_flag1_reward, vm_flag2_reward, vm_flag3_reward
VERDICT: progress recorded — 5 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

Game 2185:

```
game            2185  (mission 47)
played for      346s of wall clock
unlocked rooms  3: reception_lobby, main_hallway, conference_room_01
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Staff Access Badge
flags submitted 0
globals set     11: briefing_played, clone_read_dropped, danny_fate, engine_tutorial_declined, ffion_night_story, mission_phase, player_approach, receptionist_ko, victoria_card_cloned, victoria_fate, victoria_trusts_player
VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

No soft-lock found. No flag silently dropped: all four submitted flags were accepted and each set its `flag_*_submitted` global (the 4th validated about 2 s after the first three, which looked briefly stuck on "Validating..."). The verifier does not list a conclusion state; I did not check `mission_concluded_at` on the game record.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Reception badge (cloned) | card `receptionist_badge` | Ffion, "Lean in by her lanyard" choice (appears after signing in), dictionary attack | 5 | yes |
| Victoria's keycard (cloned) | card `victoria_keycard_clone` | Whiteboard branch in Victoria's chat, Darkside | 7 | yes |
| Executive office door | (lockpick) | Lock Pick Kit | | assisted |
| Victoria's PC password | `Sterling2011` | Helpdesk slip says "surname plus year founded". Source is the reception Founding Plaque, which I never read | guess | **no: brute-forced** |
| `ghost_in_machine_vm_network:flag_1..4` | `<flag:1>` to `<flag:4>` | VM challenges (none in standalone); no in-game prerequisite was identified or checked | | **no: flag supplied** |

I never saw the VM terminal's prerequisites (CyberChef decode, pricing intel) so they were exercised only as "flag supplied". Everything downstream of the flags (HaX calls, transaction log item) is exercised, not tested against real VM work.

## Timeline (what I thought the goal was)

1. Briefing: skipped through with "Skip the background", "That's everything", "I move fast", "I'm ready". Goal as I understood it: get inside, clone Sterling's card, come back after dark, pull flags.
2. Declined the tutorial. Task panel: clone reception badge, meet Victoria, clone her card. Goal: meet Victoria.
3. Ffion: took "I'll just sign and go through". Got a Visitor Badge. Tried the conference door: RFID flipper opened with an empty Saved list. I thought the visitor badge was the key. Went back to Ffion.
4. Ffion again showed a new option, "Lean in by her lanyard", and the cloner narrated "Read it, then crack the keys". Dictionary attack, Save, emulate at the door. Opened.
5. Victoria: picked the blunt options ("advocating selling vulnerabilities") and left with "I've taken enough of your time". Task "Meet Victoria" done, but the clone task was open and I did not know how to clone her.
6. **Stuck (about 10 commands, 2 to 3 minutes of real play)**, see below. The objective panel ("Clone Victoria's keycard at her whiteboard") unstuck me.
7. Whiteboard branch, Darkside (about 30 s), Save. Leaving triggered an automatic cut to 11 pm. Panel switched to the flags tasks.
8. Server room with the Executive Keycard. Tried the Staff Badge first (silently rejected, back to list), then the Executive Keycard (opened). VM terminal gave SSH instructions only. Pasted flags 1 to 4 back to back. All accepted. Toasts piled up, phone had 11 messages. Called HaX through the phone, picked first options. "Where do I stand?" told me exactly what to do: Danny in the executive wing, then Sterling.
9. Reloaded here (reload 1). Inventory, tasks and globals restored. Player returned to the lobby start position (not the server room).
10. Ffion was still in the lobby at night. I took "Something like that. Night." then KO'd her. Went to the executive wing, found Terry patrolling, walked up to 24 px unnoticed, KO'd him. Skipped Danny's office.
11. Executive office door: lockpicked (assisted). PC: three wrong guesses, reopened and kept guessing, `Sterling2011` worked on the second year tried in the second batch. Took Client Roster, Unsent email, Hidden USB.
12. Walked to Victoria and KO'd her. The scene cut straight to the debrief. Debrief then credits.
13. Reloaded again after credits (reload 2): credits re-showed and this time were closable. `hear_debrief` was not open afterwards.
14. Game 2185: KO'd Ffion at once on day one (reload 3 with her items on the floor), then the physical Staff Access Badge opened the door. Victoria chat reload mid-conversation (reload 4), mid-read branch (reload 5).

## Every moment stuck

| # | Where | How long | What I tried | What unstuck me | Did the panel say what to do? |
| --- | --- | --- | --- | --- | --- |
| S1 | Conference door, before the badge | about 1 min, 6 commands | Saved list on the flipper, Read | Went back and talked to Ffion again; a new choice had appeared | The panel said "Find a way past the conference room's card reader" (not the how). The Notepad/phone HaX text does say "talk to the receptionist and lean in by her lanyard", but I had not opened the phone |
| S2 | Victoria's clone, first game | about 2 to 3 min, about 10 commands | Re-talked to her 3 times, picked "Sorry about earlier", read the whiteboard note | Opened the objectives panel (screenshot): "Clone Victoria's keycard at her whiteboard". Then picked "Is that your training lab on the whiteboard?" | Yes, after meeting her. The panel listed it only once "Meet Victoria" was ticked. A careless player who closed the panel could stay stuck |
| S3 | Victoria's clone after a dropped read (game 2185) | about 1 min | Re-talked, tried all options | The option "Drift back to the whiteboard" only appears after picking an unrelated line ("Nobody was at the desk, so I found my own way in") | No. See finding F2 |
| S4 | Victoria's PC | about 2 min | Guessed years, no lockout | `Sterling2011` | The helpdesk slip says what it is. The year is on the plaque I skipped |
| S5 | Server room objectives panel | about 30 s | Looking at the HUD | Toasts (4 stacked) cover the lower half of the objectives panel until dismissed | Panel partly hidden by toasts |

## Did the objectives panel say what to do next?

Mostly yes. It was the unstick for S2, it split the night into "Breach the Server Room", "Search Sterling's Office" and "Zero Day's Paper Trail" with ticked sub-tasks, and it said "Walk out with the visitors and come back after dark". It did not say anything about Danny, the guard or the paper-trail location order. It left "Read the recovered transaction log" open after everything else was done. When toasts stack up they hide the lower tasks.

## Debrief and credits for a messy run

Fair and accurate, and the best part of the run. Every claim matched what I did:
- "The guard never logged you ... spent most of the night unconscious" (I KO'd Terry).
- "Ffion Rees ... Concussed" (I KO'd her).
- "Sterling went down on site. She's in a guarded bed, not a boardroom" and the choices "She'd earned the file" / "We kept the case, lost the network".
- "You never found the consultant, Danny Foster" (I skipped him).
- "You left some of the paper behind. Their own history of the firm stayed in Sterling's filing cabinet. The exploit catalogue stayed in the wall safe." (I opened neither).
- "Your drive was Base64 over ROT13; our people had it off in ten minutes" covers my taking the USB without decoding.

Credits (read through `#bv-cr-label`): MISSION COMPLETE / GHOST IN THE MACHINE / ZERO DAY SYNDICATE: EXPOSED / ST. CATHERINE'S LINK: PROVEN / ZERO DAY CATALOGUE: NOT RECOVERED / PHASE 2 DIRECTIVE: RECOVERED BY THE AGENT, decoded at HQ / DECISIONS: VICTORIA STERLING: NEUTRALISED, DANNY FOSTER: NEVER FOUND, TERRY MOTT: KNOCKED OUT ON SHIFT, FFION REES: KNOCKED OUT AT HER OWN DESK / THE ARCHITECT: identity still unknown / ENTROPY: Still operational.

Things that read oddly:
- Victoria's KO ends the whole mission the instant it lands: the debrief cut in while 5 tasks were still open (transaction log, whiteboard, filing cabinet, wall safe, lore fragments). Nothing told me that this would close the paper trail. HaX does say "you left some of the paper behind", so it is fair afterwards, but the player gets no warning.
- Ffion "knocked out at her own desk": I knocked her out in the same room but stood beside the desk, fine. In game 2185 her body disappeared from the lobby after reload (only dropped items remained).
- Credits replayed after reload and were closable the second time (the skill says they do not replay).
- "Mind the guard in the executive wing" (HaX) and "the guard gets territorial" (Victoria) set up a threat that was never felt: Terry did not react at 24 px.
- The HaX toast about the lock ("keyed, not carded... pick only when his back's turned, or you're made") arrived after I had already KO'd Terry and picked the lock.

## Real decisions

| Decision | Arguable or obvious? | Did the consequence show? |
| --- | --- | --- |
| Sign-in: "Where do I sign?" / "I'll just sign and go through" | Obvious (both sign). | No difference seen. |
| Victoria opening answers (honest vs accusing "advocating selling vulnerabilities") | Arguable: reads as probing vs cover-blowing. | Yes: narration "A recruit wouldn't have said that"; later an "I've taken enough of your time" reply "You argue ... Brave. Not useful". The repair line "Sorry about earlier" is arguable and its effect ("stops watching your hands") showed. |
| Moral question "Take the forty / Report it / Ask what the buyer wanted" (game 2185) | Arguable. | Reply "I'll remember that", `victoria_trusts_player` set. No later consequence seen in my short run. |
| Lean in to clone Ffion's badge | Obvious (the only non-chat option, narrated). | Yes: tasks tick. |
| Keep her talking vs "How do students access the training network" (game 2185) | Not obvious: the read-drop is a silent trap in an innocuous line. | Yes: "read stalls halfway, then drops", but see F2. |
| KO Ffion / Terry / Victoria vs avoid | Arguable (nothing forbids it). | Yes, strongly: Victoria reacts to the missing receptionist, KO ends mission early, debrief and credits name each KO. |
| Skip Danny Foster | Arguable. | Yes: debrief and credits say NEVER FOUND. |
| "Read before you leave the paper" (filing cabinet, wall safe) | Obvious if you read the panel, easy to skip. | Yes: debrief names both. |
| Debrief choices (priced in / lost the network, move first vs Architect, "He wasn't my job") | Arguable, flavour only. | "He was somebody's. Now he's mine." |

## Five best lines

1. "The guard never logged you. Mind you, he spent most of the night unconscious, so I'm not calling it stealth." (HaX, debrief)
2. "The receptionist, Ffion Rees, is fine, before you ask. Concussed, and still trying to work out what she did to deserve it."
3. "Our receptionist isn't at her desk. You didn't pass her on the way in?" (Victoria, after Ffion's KO: the world reacted)
4. "You argue with the person interviewing you. Brave. Not useful."
5. "You left some of the paper behind. ... Enough to charge and enough to warn. Not everything. It never is."

## Five worst lines

1. "Go on." / "Was there something else?" / "Forgotten something?" (Victoria's loop barks are flat, and the first two give no hint that the whiteboard branch is the way forward).
2. The narrator "(Conversation ended - press ESC to close)" appearing as dialogue; the briefing end repeats it over 30 times to a scripted driver (engine, not a player-visible issue, but it appears as a System speaker).
3. "The cloner buzzes once against your leg. Card read. Now run Darkside on it." (nice, but it follows an automatic "Nearly there. Keep her talking." with no consequence for just not talking).
4. "Agent, I've got the distcc logs you just submitted." (HaX opens the call as if I had read the log; the transaction log task is still open).
5. Toast "Card's saved. Thank her, walk out with the visitors, and come back after dark." still on screen at 11 pm after the night cut (stale).

## Scores (1 to 5)

| Aspect | Score | Note |
| --- | --- | --- |
| Fun | 4 | The cloning conversation and the reactive world (Ffion's KO changes Victoria's opening) are good. The server-room section is a paste. |
| Pacing | 3 | Day one is dense with small stumbles; night is short and ends abruptly with a KO. |
| Clarity of goals | 3 | Panel was good once you open it; first beat (visitor badge vs cloner) and the whiteboard branch gate are weak. |
| Openness of decisions | 4 | KOs, skipped Danny and left paper all land in the debrief and credits. |
| Teaching | 3 | Cloner flow (read, crack, save, emulate) teaches well. VM and the paper-trail clues were not touched in this persona's run. |

## Severity table

| # | Severity | Finding | Repro (log lines in `m03-blindB-session.jsonl` / `m03-blindB2-session.jsonl`) |
| --- | --- | --- | --- |
| F1 | major | Victoria's KO ends the mission immediately with 5 tasks still open (paper trail, transaction log). Nothing in the panel warns it. The debrief is accurate but the player cannot go back to the safe or the cabinet | game 2183, `debugKO victoria_sterling` near the end (around line 1180 to 1190) |
| F2 | major | After "How do students access the training network?" drops the cloner read, the whiteboard option disappears. It only returns after an unrelated line ("Nobody was at the desk..."). Re-talking shows "Sorry. One more question" and no hint. Abandon read has a clear retry line; the drop does not | game 2185, Victoria chat after reload 4 |
| F3 | major | Executive PC password: no lockout (reopening resets 3 attempts) so the plaque clue can be skipped by guessing years. `Sterling2011` found in under 10 tries | game 2183, victoria_computer |
| F4 | minor | First stumble: visitor badge reads as the key to the conference door; flipper opens with an empty Saved list and nothing says "clone the receptionist's badge". The "Lean in" option only appears after signing in | game 2183, early lines |
| F5 | minor | Toast stack (4 stale HaX toasts, including the day-one "walk out with the visitors" at 11 pm) covers the lower half of the objectives panel | game 2183, server room screenshot |
| F6 | minor | Executive office door toast about the guard arrives after Terry is already KO'd; the guard did not react at 24 px, so the "mind the guard" warnings have no teeth | game 2183 |
| F7 | minor | After reload the player is back in the reception lobby, not where they were (server room at night). Inventory, globals and tasks survive. After a reload, a KO'd NPC's body is gone but items remain | game 2183 and 2185 reloads |
| F8 | minor | `Read the recovered transaction log` stays open in the panel after HaX's call already summarised it; completes only by reading the item | game 2183 |
| F9 | minor | Credits replay after a reload and are closable | game 2183, post-credits reload |
| F10 | minor | Picking up Client Roster silently completed `decode_client_roster` (task vanished after taking, with no decode). Possibly intended, but the roster is described as encoded | game 2183 |

0 blockers, 3 majors, 7 minors.

## Top three issues

1. F1: KOing Victoria closes the mission with the paper trail unread, without warning.
2. F2: the Victoria cloning retry after a dropped read is hidden behind an unrelated apology line.
3. F3: the executive PC password has no lockout so the founding-year clue is skippable by guessing.
