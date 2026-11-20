# m05 "Insider Trading": blind playtest A, persona "do your best"

Run type: blind run, solvability question for everything up to the VM boundary (the four flags were supplied, so the VM work itself is unproven). Game id 2595, standalone keyless server on :3001, headless harness, one fresh game, one page reload.

- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d5a9522a-d714-4f83-a327-405305dc7311/scratchpad/m05-blind/m05-session.jsonl` (2518 commands, 4 flag substitutions)
- Screenshots: same folder, `s01.png` to `s17.png`
- Wall clock about 30 minutes. Ended on the credits ("OPERATION SCHRÖDINGER STOPPED").
- I read only what the brief allowed. No scenario folder, ink, JS or SecGen files. Where I used the DOM or the harness's `eval` it is marked below.

## Harness and method notes (said up front)

- `bootstrap` clicked through the opening cutscene by itself ("cutscene choice 1 of N", about a dozen times, then declined the tutorial). I never saw the opening briefing on screen. I recovered its content from the Notepad's first page and Agent HaX's phone thread. Anything the opening cutscene says that is not repeated in those two places, I did not read.
- Several controls the harness cannot see, so I used a DOM click on a visible control (stated each time): the RFID Flipper rows ("Saved", the card name, "Emulate"), and the phone icon in the inventory bar (`.inventory-item` click). I used the harness's `eval` to read the phone message list text and to drive the dusting canvas drag (the documented `__test.minigame.drag`).
- Lockpicks: `completeLockpick`, marked **assisted**, twice (Patricia's filing cabinet, Torres's briefcase).
- Flags: `<flag:1>` to `<flag:4>` submitted at the flag station, marked **flag supplied**. I reached the VM terminal in the server room first (it opened a "launch your VM" panel; standalone has no VM).
- Dusting: the "Find" step needs the sheen location. In the screenshot I could not see a sheen. I used `debug.printCentre` from the minigame state to place the click, so whether a human can find the print is **not proven by this run**.

## Timeline (what I thought the goal was)

| # | Where / what | My understanding of the goal |
|---|---|---|
| 1 | Reception. Objectives panel: meet Patricia Morgan, get a visitor badge. Read the Building Directory (all eight crypto staff, "Server hallway: staff badge only"). | Get in, find an insider. |
| 2 | Patricia's office. Briefing: 4.2 TB leaving in six weeks, Project Heisenberg keys, 999 dispatch rollout. Visitor badge. Incident log: crypto badge in the server hallway 23:47, uploads 02:00-04:00. "Your who starts there." Pencilled: "Owen keeps the reader logs. Ask him whose badge." | Work out whose badge it is. Then servers. |
| 3 | Corridor flyer (a colleague's family, a collection tin). Break room: TalentStack leaflet with "R. CALLED AGAIN. RETAINER + THE DEBT, ALL OF IT. SAY YES BY THURS." Lisa Park told me about David Torres: wife Elena ill, $380,000, crying in the car park, secret phone calls. | The recruiter has someone. Strong feeling it is Torres already (see finding M1). |
| 4 | Open-plan office. Owen: reader logs gave "Halloran's spare" at the server hallway. Asked for access. He wanted "a reason I can write in the log". I could not give one yet. Chose the cloner option, read his lanyard, he noticed, I apologised. | Get through the server hallway reader. |
| 5 | Server hallway door opened with the cloned card (RFID Flipper, DOM clicks). Hallway notice: password door, "contact O. Gallagher". Research lab: Halloran, her lab rules (spare #4471 signed out through her), Zürich lanyard (alibi). | Halloran looks framed. Someone is using her spare. |
| 6 | Patricia: asked for vetting files (got Torres and Halloran). Picked her filing cabinet on my own first (CEO "stand this down" email). Compared file contents with reader logs. | Pattern: Torres's own badge comes in the front door about six minutes before Halloran's spare appears in the server hallway, every night. |
| 7 | Went back to Owen after reading the door notice. A new option appeared ("The server room wants a password."). Gave "Patricia's log: a crypto badge ... never logged with you." He handed over the sticky note. | Server room next. |
| 8 | Server room: typed the password. Bludit terminal (VM launcher), flag station. Submitted four flags. HaX texted after each one, culminating in the Architect's casualty projection. | The VM chain is the "proof it's leaving". |
| 9 | **Page reload** while talking to Owen (see below). Resumed with inventory and tasks intact. | Need Torres's office and vault. |
| 10 | Told Patricia "David Torres", reason "his badge comes in the front door six minutes before her spare." She said "I'll tell Owen you can have the spare." Went to Owen: "I need into David Torres' office." Got the IT spare card. | Get evidence from his office. |
| 11 | Torres's office: lifted his print from the "World's Best Dad" mug (dusting minigame), picked the briefcase (assisted): journal and medical bills. | Motive and means found. |
| 12 | Key vault: presented the lift to the fingerprint reader. Data centre: upload schedule (20:30 tonight, "Operator on site: D. Torres"), manifest ("Staged by: D. Torres"), TalentStack envelope (47-row target list), transfer_queue.log. | Prove it and stop it before 20:30. |
| 13 | Back to Patricia: Torres, why = money, proof = the manifest naming "D. Torres". She said to keep him there and call her. | Confront him. |
| 14 | Data centre, 20:14, 94 percent transferred. Confronted Torres, chose the turn-him route. He cancelled the transfer himself. HaX debrief. Credits. | Done. |

## "Didn't know what to do" moments

| # | Where | How long | What I tried | What unstuck me |
|---|---|---|---|---|
| S1 | Owen, first visit. He wanted "a reason I can write in the log" and no option gave one. | about 3 minutes | Re-read the dialogue, asked every branch, tried Patricia's phone thread ("Just checking in"). | Only the lanyard-clone option moved it. A "reason" option appeared later, only after I had read the hallway door notice (global `it_notice_read`/`server_door_seen`). The first Owen visit gives no signal that the reason option unlocks after you see the door. |
| S2 | Server room door (password). | about 2 minutes | Read the notice, did not guess (3 attempts). | Went back to Owen after seeing the notice. HaX's thread said the notice by the door says who. Fine. |
| S3 | Torres's office door rejected Owen's cloned badge ("Card not accepted"). | about 2 minutes | Tried the cloned card. | Phone/HaX said "office keycard, you'd need a reason Owen can write in his log". Patricia only authorised it after I named a suspect with a reason. The order (name Torres to Patricia first) is not signposted before you try. |
| S4 | Dusting minigame, "Find the print". | about 4 minutes | The screenshot showed no visible sheen. | Used the harness-exposed print centre. **Unproven for a human.** |
| S5 | End of the Patricia conversation: "keep him there and call me." | about 1 minute | Opened her thread. The only option is "Just checking in." | Gave up. Nothing is wrong in the end because the debrief does not need her call. |
| S6 | Recruiter's text after the upload: "Ring the TalentStack number back." | about 1 minute | Chose the option three times and waited. The phone closes. Nothing happens. | Nothing. Left it. |

## Decisions

| Decision | Arguable or obvious? | Consequence shown later? |
|---|---|---|
| Clone Owen's lanyard (versus wait for a reason I could not yet give). | Arguable. The game offers it and HaX recommends it. | Owen noticed: "Don't be. Just don't try it on Security." Debrief line "Every locked door in that building, you opened on someone else's trust. A colleague's badge, a colleague's password, his thumbprint." Yes, shown. |
| Apologised for the clone ("Sorry. Habit." versus "Better me than them."). | Arguable. | Not visible later. I did not test the other line. |
| Picked Patricia's filing cabinet myself, then she handed me the vetting files anyway. | Obvious (it was there). | Debrief: "Patricia's copy of the CEO's email went to the Home Office review." Yes, shown. I did not test not picking it. |
| Asked Owen for the password using Patricia's log as the reason (rather than "Fair enough, I'll be back"). | Obvious once offered. | Owen: "please don't put that in your report." Debrief says "Whose job was it to fix that? Owen's, on paper." Partly shown (Owen is blamed, but gently). |
| Named Torres to Patricia with "his badge comes in six minutes before her spare" and then "the manifest naming D. Torres" as proof. | The answer was obvious by then (see M1). The wrong "why" options (his own badge at the hallway, "He'd know how") were distinguishable by the notes. | Patricia: "That's a pattern... Now I need a reason." Task chain advanced. Shown. |
| Told Patricia "I'll stop him" (versus "Whatever happens next is on me, not you"). | Arguable. | Patricia's police plan never happened and she never hears of Torres's fate, and the debrief does not mention her reaction at all. Not shown. |
| Confrontation: "I've seen what you've been staging", then "They lied to you", then "You knew people would die. Why did you keep going?", then "You're not too far gone. Help us, and we'll help Elena", then "Go back to your desk. Feed them our data" and "Cancel it, David. Your hand, not mine." | The final four-way choice (help, arrest, fight, go public) is really arguable. After picking it, the conversation funnels down single-option lines. | Strongly shown. Debrief: "You turned him. The riskiest thing you could have done, and the most useful. Elena starts the trial on Monday." Global `elena_treatment_funded`. The only line that is not a funnel is the last ("Cancel it, David" versus "Pull the drive myself"), and I never saw what that changes. |
| Did not call Patricia after the confrontation (no way to). | n/a | Debrief ignores her. |

## What I learned, in my own words

- Badge readers and cards: a staff prox card can be cloned if you stand close while someone is talking, and cloned cards open some doors (hallway) but not others (the office door needs the IT spare).
- After-hours reader logs show who passes where; a "spare" badge with no signing out is an untraceable identity. The tell is the order: his own front-door swipe, then the spare six minutes later.
- A sticky-note password, a temporary password "for a year", an admin login in a handover note, and an unpatched portal were the weaknesses. HaX's debrief names them.
- Pin tumbler locks (cabinet, briefcase) are easy. A fingerprint reader can be fooled with a lifted print (the reader panel quotes the Chaos Computer Club iPhone 5s story).
- Fingerprint lifting: pale smooth surface means black granular powder, loops, whorls and arches, over-brushing blurs it.
- The human side: the insider here was pushed by debt and a sick wife, was recruited, then found out the real use and carried on. The game wants you to see that and decide.

## Five best lines

1. Patricia: "I want it done properly. She wants it done quietly. Tonight we find out which of us wins."
2. Owen: "It's on my monitor. It's been on my monitor for a year. Take it, and please don't put that in your report."
3. Torres: "You read it. 'Collateral damage for the greater good.' I wrote that about strangers so I wouldn't have to think of them as people."
4. Owen: "The server room has a password on the door, which I'm told is 'temporary'. It's been temporary for a year."
5. Owen on the vault: "Board bought it because you can't write a thumb on a sticky note. Course, you can't change one either, once it's out."

## Five worst lines

1. HaX (phone, after flag 4): "It's the strongest thing you'll find tonight. It puts this above Torres." It names the culprit before I have (see M1).
2. Lisa: "I saw him crying in the car park last month. I pretended I hadn't. Still feel awful." Heavy-handed signposting, and she then gives the $380,000 figure and his wife's name. It reads as a clue delivered by the author.
3. Patricia: "*runs a finger down the sheet* ...Every night." A stage direction typed into the spoken line.
4. HaX (debrief): "Without those, what they have is a very expensive paperweight." A cliché that adds nothing.
5. Patricia: "Be careful. Down there, you're on your own." Generic, and then "call me" cannot be acted on.

## Lighting and conversation backgrounds

| Scene | Match? | Note |
|---|---|---|
| Patricia's office (conversation) | Yes. Corkboard, coat on a hook. | Her portrait looks mid-thirties, the narration says "early fifties". |
| Break room, Lisa | Yes. Microwave, sink, coffee machine. | At first screenshot (taken right after opening the chat) the background was black for about a second, then loaded. |
| Open-plan office, Owen | Yes. Whiteboard, monitors. | Owen is drawn in hi-vis site clothing, which reads as a contractor, not a sysadmin. |
| Research lab, Halloran | Yes. Fume cupboard, safety shower. | |
| Data centre, Torres (20:14) | Yes. "TWO-PERSON RULE" sign, dark purple racks, night feel. | Narration gives 20:14. |
| SAFETYNET HQ debrief (HaX) | Yes, a moody night office. | Narration says "Thursday, nine o'clock" with no am/pm; the window is dark, so it reads as night. |
| Overworld lighting | Reception, offices and corridor are all evenly bright. The vault and the server room are dark purple/blue. | The bright corridor and offices did not change between the afternoon phase and 20:14, so there is no visible night shift in the rest of the building. I cannot tell whether that was intended. |

## Scores (1 to 5)

| Area | Score | Why |
|---|---|---|
| Fun | 3 | The documents are good, the confrontation lands, the middle (cloner and DOM-driven RFID menus, a clipboard of notes) is a lot of fetch-and-read. |
| Pacing | 4 | About 30 minutes; no dead stretches except S1 and S4. The 20:14 time jump arrives without any on-screen clock. |
| Clarity of goals | 4 | The Objectives panel, HaX's thread and Patricia's log all point the same way. Two gates (S1, S3) were not signposted. |
| Openness of decisions | 3 | Real decisions at the cloner, the confrontation and the vault. Who the culprit is, is not open (M1), and the confrontation funnels into single-option lines after the big choice. |
| Teaching | 4 | Cloning, reader-log reading, fingerprint powder and loops, sticky-note passwords, over-privileged accounts, all named in the debrief. |

## Severity table

| # | Severity | Finding | Repro (session log) |
|---|---|---|---|
| M1 | major | The culprit's identity is handed over, so the "who" is not a deduction: Lisa names Torres, his wife, the cost and the car park, within the first ten minutes; HaX says "It puts this above Torres" and "Then Torres is the only thread we've got" before the player names anyone; the leaflet's "R. CALLED AGAIN" plus Lisa's tin makes it a one-step guess. The only real deduction left is the badge-order pattern. | Lisa chat (break room, early); HaX thread after flag 4 (around 17:05-17:06 in phone time). |
| M2 | major | Possible dead end for a player who does not read the door: the Owen "reason" option only appears after the server-door notice has been read (`it_notice_read`/`server_door_seen`); before that, the only visible escalation is the lanyard clone. A player who talks to Owen first gets no hint that a reason option will appear later. (Not a blocker here because the clone is available.) | Owen chat, first visit, branch "I'll need your help with access", then second visit after the notice. |
| m1 | minor | Patricia: "keep him there and call me" has no matching control. Her phone thread only offers "Just checking in." Her plan (police) never happens and the debrief never mentions her. | Phone thread, Patricia, after the Torres confrontation. |
| m2 | minor | The Recruiter's text offers "Ring the TalentStack number back." Choosing it closes the phone with no reply and no visible effect (global `recruiter_contacted_player` is set). | Phone thread, The Recruiter. |
| m3 | minor | After a page reload mid-conversation the player is placed in the reception lobby (the starting room), not the room they were in. Inventory, tasks and globals are intact. Server record at the end shows `current room reception_lobby` although the run finished in the data centre. | Reload at Owen's chat in the open-plan; `verify-run.rb` below. |
| m4 | minor | After the cloner conversation the RFID Flipper stays on screen ("RFID > Saved") over the world until you press Cancel, and `moveToNear` etc. then fail with `minigame-active`. A human would press Cancel. The harness cannot see the Flipper's rows, so the clone, selection and "Emulate" needed DOM clicks. | Owen lanyard clone, then the server-hallway door. |
| m5 | minor | Global `owen_refused_password` is set although Owen never refused me (I got the password). Probably set on entering the branch. Harmless unless a later check reads it. | End-of-run `verify-run.rb` globals list. |
| m6 | minor | Credits footer reads "INTEL CIPHER TIDE · VICTORY", a name from another mission. | Credits screen, bottom bar (`s17.png`). |
| m7 | minor | Portraits do not match the narration (Patricia "early fifties", Owen "sysadmin" in hi-vis worker kit). | `s02.png`, `s04.png`. |
| m8 | minor | Dusting "Find the print": no visible sheen in the screenshot at that step, so a player may not find the print without the keyboard sweep. Unproven either way. | `s09.png`. |
| m9 | minor | Spoken line contains a stage direction ("*runs a finger down the sheet*") and some lines print twice in the transcript (probably the harness showing the last line before choices). | Patricia, after "the manifest in the data centre". |
| m10 | minor | The player never sees a clock. Phone timestamps run 15:30 to 17:09, then narration jumps to 20:14 with 16 minutes to go. | Phone thread versus the data-centre narration. |

0 blockers, 2 majors, 10 minors.

## Earned-secrets table

| Secret | Fetched in-game from | Value correct? |
|---|---|---|
| Whose badge was in the hallway | Patricia's incident log, then Owen's reader-log chat | Yes ("Halloran's spare", #4471) |
| Server hallway reader access | Owen's lanyard, cloned at his desk | Yes |
| Server room password | Owen's sticky note, after naming Patricia's log as the reason | Yes (`quantum2024`, accepted) |
| Torres's office | IT spare office card from Owen after Patricia authorised it | Yes |
| Torres's print | Mug, dusted and compared | Yes (68 percent lift, accepted by the vault) |
| Key vault | Fingerprint reader | Yes |
| Four flags | **Flag supplied** at the flag station after reaching the server-room VM terminal | Not earned. The VM work itself is unproven. |

## verify-run.rb output (game 2595)

```
game            2595  (mission 49)
created         2026-10-16 19:24:42 UTC
last write      2026-10-16 19:55:02 UTC
played for      1820s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, break_room, open_office_area, server_hallway, research_lab, server_room, torres_office, data_center
unlocked objs   3: patricia_filing_cabinet, torres_briefcase, data_center_pc_0
inventory       23: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Building Directory, Visitor Badge, Security Incident Log, Noticeboard Flyer, TalentStack Leaflet, Server Hallway Badge Log, IT Notice: Server Room Access, Conference Lanyard, Printed Email from the CEO's Office, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        12: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, lisa_park, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_cc0bdc}, flag{m05_insider_trading_qdc_research_server_2_aaafd4}, flag{m05_insider_trading_qdc_research_server_3_a6d406}, flag{m05_insider_trading_qdc_research_server_4_9488be}
globals set     64: architect_approval_confirmed, architect_discussed, bludit_guide_offered, briefing_played, case_exfil, case_motive, case_ready_notified, confront_stance, data_center_entered, debrief_played, door_log_held, door_log_reasoned, door_log_reasoned_first, elena_treatment_funded, engine_tutorial_declined, final_choice, flag1_discussed, flag1_submitted, flag2_discussed, flag2_submitted, flag3_discussed, flag3_submitted, flag4_discussed, flag4_submitted, found_door_log, found_halloran_alibi, found_halloran_vetting, found_incident_log, found_manifest, found_medical_bills, found_pamphlet, found_pipeline_list, found_stand_down_email, found_torres_journal, found_upload_schedule, found_vetting_file, halloran_questioned, it_notice_read, journal_discussed, knows_full_stakes, knows_insider_profile, lockpicking_guide_offered, mission_complete, office_card_obtained, owen_refused_password, patricia_authorised_office, patricia_phone_available, player_approach, player_name, privesc_guide_offered, recon_guide_offered, recruiter_contacted_player, recruiter_texted, recruitment_method_discussed, rfid_guide_offered, server_badge_obtained, server_door_seen, server_password_obtained, server_room_entered, torres_identified, torres_print_collected, torres_suspected, torres_turned, vault_reader_seen

VERDICT: progress recorded - 9 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

The harness's end-of-mission screen reported `creditsShowing: true, closable: false` (credits reached); the hint said the server-side status and `mission_concluded_at` should be checked on the game record, which I did not do (outside the allowed scripts).

## Not tested

- The other three confrontation outcomes (arrest, fight, go public), the "Pull the drive myself" line, and the "Better me than them" line.
- Not picking Patricia's cabinet, and whether the debrief still mentions the CEO email.
- Whether a human can find the print in the dusting minigame without the harness's print centre.
- Any VM content. Standalone has no VMs.
- The struggling-player persona (this run was "do your best" only).

## Top three issues

1. The "who" is given away (M1): Lisa, the leaflet and HaX all point at Torres long before the evidence does. Consider letting Halloran and Ben stay credible through the middle, and having HaX avoid naming Torres until the player does.
2. The Owen "reason" gate is invisible on the first visit (M2) and Torres's office needs a specific order (name Torres to Patricia, then ask Owen). A short signpost in the objectives would stop the loop that cost me about five minutes.
3. Patricia's "call me" and the Recruiter's "ring back" have no working control (m1, m2), and the debrief never mentions Patricia's reaction to the choice the player made.
