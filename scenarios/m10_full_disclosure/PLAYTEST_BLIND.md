# m10 Full Disclosure: blind playtest (persona 1, "do your best")

Run type: blind run. It answers questions 1 and 2 (plumbing, plus what happens off the walkthrough). It does not answer question 3 and does not prove solvability past the four VM flag stations.

- Game id 3813, keyless server :3001, headless, no TTS.
- New game: `new-game.rb m10_full_disclosure --imports=latest`. The save held a full m01-m09 carry-over: m01 arrest, m02 no Ghost deal either way, m03 Sterling arrested, m04 Voltage captured and full disclosure, m05 public exposure and the Recruiter refused, m06 assets seized, m07 Mercer escaped and Elena turned, m08 Nightshade arrested, m09 Recruiter refused, Albion notified, `yes_albion` memo stance, raid-team answer Kowalczyk, HaX confession "afterwards", Noor told, Sorensen talked, Derek's file saved from the cage. All m01-m09 `_completed` flags true.
- Session logs, in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10-blind/`: `session-game3813.jsonl` (the real run, 12,969 commands), `session-replay.jsonl` and `session-mercer.jsonl` (two short follow-up sessions, see below), plus `credits_arrest.txt`, `globals.json`.
- Played for 3,984 s wall clock (about 66 minutes) on game 3813, including two knock-outs and the walk back each time. The in-game clock is scripted per scene (01:45 forward post, 02:30 tunnel, 03:15 power room, 04:00 gallery, 06:00 at the end), not real time.
- Tester caveats. I am a model, so "blind" means I read nothing under `scenarios/m10_full_disclosure/` (except to write this file), no planning notes, no field guides, no VM or SecGen documents, no earlier m10 reports. I did not take HaX's offered field guides (she offers three, see Flags). Three places where I stepped off the player's path, all listed again where they matter:
  1. `bootstrap` auto-picked option 1 in six opening cutscene choices, so I never read the opening briefing. I judged the opening from the table scene, the phone and the Mission Brief card that reappears after a reload.
  2. The margin strip is Base64. I decoded it with `base64 -d` because I could not get text into the CyberChef iframe from the harness.
  3. I missed the credits as they scrolled (my poll only caught the last label). After the run I rebuilt the credits sequence in the page, with the game's own `buildEndSequence` and the globals from game 3813, and read that. See "Credits".
- Only persona 1, one route. No wrong-answer run, no struggling-player run, no second ending. I saw the names of the other ending variants when I rebuilt the credits (`surrender`, `lethal`, `executed`, `scorched`, `joined`) but did not read them.

## verify-run.rb (tail)

```
game            3813  (mission 85)
current room    "forward_post"        (the page was reloaded after the credits; see F6)
unlocked rooms  8: forward_post, blast_tunnel, security_office, workshop_floor, power_room, server_hall, gallery, core
unlocked objs   3: model_terminal, records_cupboard, fitter_locker
flags submitted 4: flag{m10_monitoring_foothold}, flag{m10_staging_schedule}, flag{m10_container_escape}, flag{m10_core_host}
tasks           28 in objectivesState, 28 completed
tasks_completed 28
score           100

VERDICT: progress recorded — 7 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

## Flag stand-ins and the design rule

No flags XML was written ("FLAG_SOURCE=none", `VALID_FLAGS=4`), so the stand-in was `test:flag:N`, which the server resolves to the Nth flag of the station you are standing at. Every station therefore took `test:flag:1`. (`test:flag:2` at the release console was refused: "Flag not accepted". That is the alias working as documented, but the tooling doc's "N = 1..4" reads as a mission-wide number.)

All four stations had an in-game find that comes before the station and gives a login, a host name or a code. No station asked for a flag before the game had handed me the means to start that step. The one gap is in the table notes below: none of the finds gives a target address.

## Earned-secrets table

"Obtained at" is my own order of play, not log line numbers.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Blast door | badge reader, "OPENED FOR: AGENT 0x00" | Unlocks after flag 1 | step 8 | yes |
| `bunker_monitor` flag 1 (gate terminal) | `test:flag:1` | Maintenance Tag on the gate terminal's power lead, forward post: user `secmon`, password `Bunker!Monitor59`, "Host: the monitoring host on your VM list". Read before the terminal. | step 7 | **no, flag supplied (prerequisite held)** |
| Tunnel inner door | HaX throws the release after the ladder | Guard Post Ladder in the tunnel; HaX phone: "Up the shaft. The release is on the corridor wall." | step 9 | yes (HaX does the work; see F5) |
| Margin strip on the casualty sheet | Base64 text | Casualty Sheet and Margin Strip, workshop floor; HaX: "Not plain English. Copy just the code." | step 15 | yes, but decoded by hand-run `base64 -d`, not in the game's CyberChef |
| Bench terminal password | `DOUBLECOUNT` | Decoded margin strip ("key DOUBLECOUNT") | step 16 | yes |
| Power room door | Gary's word ("Power room's open") | Talk Gary round at the workshop bench (option "Walk out with us") | step 17 | yes. The spare card in the Fitter's Locker (lockpick, assisted) is the other route; I opened it later |
| Fitter's Locker | lockpick, assisted | `completeLockpick` | step 29 | yes (dexterity assisted). Holds a spare power room card |
| Records Cupboard PIN | `2817` | PIN cracker lights, 7 guesses. I used a Mastermind solver script to pick guesses. Vector also adds a "Records cupboard: Vector's code" note; I did not read it | step 26 | yes (cracker feedback is the in-game source; my solver is a harness aid) |
| Shutter isolator | key and breaker, by conversation | Voltage's walk-through; no world action does it (F4) | step 20 | yes |
| Bypass panel print | whorl, "Unknown fitter" | Dusting minigame, black granular, 86% lift, matched card 1 | step 19 | yes (played through harness drags; the match is clear on screen) |
| `bunker_monitor` flag 2 (release console) | `test:flag:1` | Schedule Copy Sign-in Card, server hall: user `staging`, password `Staging!Copy25`, "Host: the monitoring host on your VM list". Under the console's edge | step 22 | **no, flag supplied (prerequisite held)** |
| `release_host` flag 3 (sealed hatch) | `test:flag:1` | Operator's Duty Sheet by the east racks, server hall: user `relops`, password `Release!Shift25`, "Host: the release host on your VM list" | step 22 | **no, flag supplied (prerequisite held)** |
| Release console head start | "Kill Zero Day's" | HaX, console controls | step 23 | yes (choice) |
| Gallery outer lock | no code used | Pieter Vos opened it after I used Victoria Sterling's tip ("Your second buyer. The one you skim from."). The keypad plate and the shift-code card were never needed | step 25 | yes by conversation; the keypad route was not tested (F7) |
| WREN | Kowalczyk | Bench log (cloner, packed with case 2, badge D. MALHOTRA read 01:58), sign-out sheet (packed by H.K., K.A.), Phantom's count, door log (Malhotra's badge, 02:10), HaX's alibi list | step 27 | yes (deduction; confirmed at the core: "You found her") |
| `core_host` flag 4 (core host terminal) | `test:flag:1` | Core Access Code envelope in the core: `TSRCT-CORE-9F21`, "Host: the core host on your VM list" | step 31 | **no, flag supplied (prerequisite held)** |

No target address for any of the three VM hosts appears in any item. The only address the game gives is my Kali box (172.16.0.3, on the three Field Consoles). Each login says "on your VM list". HaX offers a field guide for the monitoring host, one for the staging copy and one for the container escape ("Ask me"); I did not take them, so I cannot say whether the address is there. Judged as a student without the guide, I would have the login but not know where to point it.

## Timeline: where I was unsure

| # | Where | Length | What I thought | What moved me |
| --- | --- | --- | --- | --- |
| T1 | Table, Nightshade's deal | about 1 min | "Name them. You'll get your deal." The terms are not stated. | HaX: "He's only as right as the man who briefed him." I took it anyway. |
| T2 | Tunnel, two maps disagree | about 1 min | Helena's plans say the inner door is interlocked; Nightshade's note says plain steel, open by hand. | HaX said "locked from their side" and pointed at the ladder. |
| T3 | Power room, Voltage's "Key's turned" | about 2 min | Nothing in the room turns a key. | I answered, then looked again; the isolator text had changed (F4). |
| T4 | Server hall, Mercer | n/a | "(Back off.)" sounded safe. | It started a fight (F1). |
| T5 | Naming WREN | about 3 min | Kowalczyk or Quintero, both "in the tunnel". | Bench log plus sign-out sheet (H.K. packed the case) split them. Arakawa and Malhotra had alibis I had seen. |
| T6 | Gate: the PIN cupboard | about 3 min | Mastermind by hand. | Fine with the cracker lights, 7 guesses with a solver. |

I was not stuck for more than about three minutes anywhere except the two knock-outs.

## Did my earlier choices matter?

Yes, in more than a dozen places, and most of them are lines said to me by the people they concern:

- m01 (Derek arrested): Tesseract, "You handed Derek over. He kept his promise to me and said nothing." Credits: "Derek Lawson: serving. He still hasn't said who."
- m02 (Ghost's deal left on the table): the duty handset opens with "You left my last offer on the table." Ghost's text at the end: "First sale I ever turned down. Clean exit." Gary Whitlock and Imran Siddiqui from St. Catherine's are the workshop fitters.
- m03 (Sterling arrested): she rings from her cell with a tip about Vos; the tip opens the gallery lock.
- m04 (Voltage captured, full disclosure): Voltage is in cuffs, and walks me through the switchgear; Tesseract, "You told them the truth, and they audited every site. That was my lesson, delivered by you."
- m05 (Recruiter refused): "My Recruiter offered you a name. You wouldn't buy it. I would have." Credits: "David Torres: named in the papers. Out of work."
- m06 (assets seized): "You froze my bank. I had to economise on guards." The duty board has "Gate: none. STOOD DOWN, BUDGET: R. HOLLIS." Credits: "The twelve point eight million: frozen in a SAFETYNET wallet."
- m07 (Mercer escaped): Mercer is in the server hall.
- m08 (Nightshade arrested): he trades his map for a reduced sentence. Credits: "Gave up the map. Sentence reduced."
- m09: "You told Magnus I was right about Albion. Say it to me." (memo stance). Kowalczyk at the end: "You took my side in Helena, in front of Quintero." HaX: "It's afterwards... The night he left, he asked me to go with him." Credits: Noor, Sorensen, Hollis, the 47 not warned.

The choices made inside m10 carry too: the head start I killed (`share_zero_day`), Gary and Imran (credits), Vos, WREN, Mercer, the arrest.

## Was the ending earned, and does it wrap the season?

Yes. The Tesseract scene is a real argument and the evidence you hold is the move: Asante's corrected model (2,100 to 3,600, against his signed 1,100 to 2,600), the notice from Helena, Albion, the first day, Derek. He concedes "I knew" at the Asante point. The coordinated-disclosure option is a lesson in itself (Netherton and HaX each state what a choice costs before you pick, and HaX refuses to choose for you). The arrest option is the m01 choice come round again. The epilogue at the forward post pays off WREN (Kowalczyk), HaX's confession, Voltage, Ghost's text and the telescope for Arakawa's daughter, and then the credits name every season thread. "Ten operations. Still answering for every one." is the right closing line for the agent.

What it asks of the player at the end is mostly choosing, not doing: the last 15 minutes are conversation. That works after a long middle of puzzles, but a player who wants a last action beat gets none. The one fight (Mercer) is optional and comes earlier.

## Credits

I did not read the credits as they ran (F6 explains why, and why I could not replay them). I rebuilt the sequence from the game's own `closing-sequence.js` with game 3813's globals and read that. The full text is in `credits_arrest.txt` beside the session logs. Order: a card (Tesseract in a cell, forty vendors answered, nothing went at four, one cell broken: Michael Reeves's people, callers in eleven counties), MISSION COMPLETE / FULL DISCLOSURE, IN THIS OPERATION (13 lines from Agent 0x00 to Tesseract), THE CELLS, ELSEWHERE (Hollis, Derek, Torres, Sorensen, Noor, Zero Day and Vos, three water utilities, the Albion inquiry, the 12.8 million, the 47 not warned, "In Billings, a girl turns nine on Saturday. Her father is bringing a telescope."), SAFETYNET (Netherton, HaX, Anchor, Arakawa, Malhotra, Vector, Phantom, "HALINA KOWALCZYK, 'WREN': ... Badge handed in."), IN MEMORY (Callum Fraser, Ana Lúcia Ferreira). It reads well and wraps the season. In the live run I saw the last label ("Agent 0x6B Ana Lúcia Ferreira.") and one mid-run frame ("DIRECTOR MAGNUS NETHERTON: Director. Ran the raid from the forward post.").

## Findings

Severity counts: **0 blockers, 1 major, 7 minor, 6 nits** (plus 3 harness notes and 1 observation, not counted).

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| F1 | major | Dr James Mercer's only option, "(Back off.)", turns him hostile. He then hits for 10 every 1.7 s while the player is in dialogue, a phone call or a flag station (the world does not pause for any of them). In game 3813 I lost 100 HP in about 40 s across a Victoria Sterling call, a flag submission and two HaX chats and was knocked out; the first anyone sees of it is the HP bar. The label reads as de-escalation, nothing warns of a fight, and Esc does not stop it. The fight is winnable (in game 3891, 10 F presses with correct facing knocked him out, leaving me on 31 HP), but a student who is not watching the HP bar does not know to start it. Knock-out costs the walk back from the forward post through five rooms (known respawn issue). | Server hall, talk to Mercer, choose "(Back off.)", then keep any minigame open for 20 s. Watch `player_hp_changed` in the event log (10 per hit). |
| F2 | minor | The optional task "Read the bench log on the workshop floor" completes at the forward post when the Vector chat opens (`clue_bench_log`), before the player has been near the workshop. The log is still readable later. The task list shows it ticked with no content seen. | New game, talk to Vector at the table (first line only). Check toasts. |
| F3 | minor | After a reload (here after each knock-out) a toast "Invalid Action: NPC not encountered: nightshade_lock" appears. Also the NPCs that walked with the team (Quintero, Kowalczyk, Arakawa) are back at the forward post table while the player keeps every earlier task and room. The known "respawn at the forward post" issue is unchanged and not counted. | Get knocked out, Restart, Continue past the Mission Brief, read toasts. |
| F4 | minor | The shutter step has no world action. Voltage tells you to turn the key a quarter right and pull the third breaker ("Key's turned." is a dialogue option); the isolator object says only "The key is in it." until after the dialogue, and then reports the breaker pulled and the camera off. Voltage then says "Go and pull it yourself. I'll watch." and HaX says "Go and pull it" when the task is already done. A player will look for something to click. | Power room, talk to Voltage, "I'll do it. Talk me through it.", "Key's turned.", then examine the isolator before and after. |
| F5 | minor | Examining the tunnel ladder (a description object, "The inner door's manual release is up there somewhere") counts as using it. One examine fired `ladder_used`, `security_alerted`, `tripwire_tripped` and `wren_warned` together, with no toast. The only trace is the alarm board in the security office reading "TUNNEL INNER DOOR: FORCED. LOWER LEVELS TOLD". It reads as a cost of taking Nightshade's deal, but nothing says so, and the board appears to say the opposite of HaX's quiet route. | Take Nightshade's deal, enter the tunnel, examine the ladder, read the alarm board upstairs. |
| F6 | minor | After the credits end, a reload (title screen, Enter) shows the credits screen with the visualiser only: "AWAITING SIGNAL", a CLOSE button, no credit lines. Close, and the title screen comes straight back; Enter again gives the Mission Brief, then the finished game at the forward post. A player who misses a line cannot re-read the credits. (The simple success screen is documented to reshow itself after a reload; the story credits do not.) | Finish the mission, reload the page, press Enter on the title screen. |
| F7 | minor | The gallery keypad route (dust the four dull keys, take the shift code from Sione Fonoti) was bypassed. After Victoria's tip, Vos says "The door is open" and Fonoti says "Door's open, so I guess my shift's done." The task "Get through the core's outer lock" completed with no keypad. I did not test the keypad route itself, so this may be intended, but a player who earned the tip skips a puzzle and one who did not has no sign the puzzle exists. | Take the m03 tip into the gallery, say "Your second buyer. The one you skim from." to Vos. |
| F8 | minor | The shut-in hint chain is long and partly stale: HaX's "Where are we?" still answers "Third from the left in the power room. Go and pull it." in the same call where the shutter is done, and the phone shows 9+ unread HaX bubbles after the power room. Not blocking, but the hub is the only place that says what to do next. | Open HaX's chat after the power room. |
| F9 | nit | "Give me a minute" at the table sets `nightshade_deal` to `refused` (it flipped to `taken` when I did take the deal). A deferral is recorded as a refusal while the conversation is open. | Table, Nightshade, "Give me a minute", check globals. |
| F10 | nit | Credits say "The twelve point eight million: frozen in a SAFETYNET wallet. It never reached the cells." Netherton at the forward post says "goes back to the victims' fund. I have signed for that as well." Probably both true in sequence, but they read as two different outcomes. | End of mission. |
| F11 | nit | Credits give lines for events I did not do: "DR JAMES MERCER: Arrested in the server hall" (I left him knocked out only in a second game), "SIONE FONOTI: Swept up at six", "DR ABENA ASANTE: Off the floor all night, on the uplink" (I never met her; the corrected model was my only sign of her). Reads as the raid team's sweep, and the Asante line is the only one a student may not place. | Finish the mission. |
| F12 | nit | The Welcome to Hacktivity Games tutorial prompt appears on the first load, at mission 10. Same as m09 F8. | New game. |
| F13 | nit | "Task Complete: Decode the note in the casualty sheet's margin" toasts twice on one password acceptance; "Asante's Corrected Model has been noted" twice. | Bench terminal, `DOUBLECOUNT`. |
| F14 | nit | The dusting match names the print "Unknown fitter's print", which is not a name; the lift toast says the same. It is correct (m04 left no Voltage print on the panel), but "an unidentified fitter" would read better, and nothing later uses the lift that I saw (`voltage_print_lifted` stayed false). | Power room bypass panel, dusting, match card 1. |
| H1 | harness, not game | `interact` returns `no-effect-confirmed` for notes and examine objects that did open (Citadel Incident File, Table Screen, Wanted photo's toast); `moveToNear` then `E` worked. `moveToNear` for `arakawa_gate` and `hax_post` lands next to another NPC and `E` picks that one; `interact` by id is the fix. | n/a |
| H2 | harness, not game | CyberChef iframe: setting the hash or typing through `execCommand` left the input empty, so I decoded Base64 outside the game. | Open the Workstation, try to set input from the page. |
| H3 | harness, not game | `bootstrap` auto-advances the opening briefing with option 1 each time. | New game, `bootstrap`. |
| O1 | observation | No item gives a target address for any VM host; see the earned-secrets notes. The `Field Console (Gate)`, `(Server Hall)` and `(Core)` show only the Kali box's address. | Read the three field consoles and the four login items. |

Counts: 0 blockers, 1 major (F1), 7 minors (F2-F8), 6 nits (F9-F14), plus H1-H3 and O1.

## Player ratings (1-5)

| Category | Score | Why |
| --- | --- | --- |
| Fun | 4 | The table scene, the casualty-sheet/Asante thread, Voltage in the power room, the Tesseract argument and the epilogue are very good. The middle is slightly thin on actions after the workshop. |
| Pacing | 4 | Five rooms, four stations, a long closing conversation. The knock-out walk-back (F1) is the only drag. |
| Goals | 4 | The task panel and HaX's hub kept me oriented. The VM half is where I would be lost without the guide: logins but no addresses (O1). |
| Decisions | 5 | Nightshade's deal, Gary, Voltage, the head start, WREN, the argument, the database and Tesseract's fate all change something I later saw, and the game lets you not choose ("Not yet") on WREN. |
| Teaching | 3 | Coordinated disclosure, evidence against a claim, Base64, fingerprint comparison and a Mastermind-style PIN all land. I cannot judge the VM steps. |

As a player: I would finish this feeling it was the right shape for a season finale. It keeps handing me things I had done before (a frozen bank, Derek, Albion, the Recruiter, a name on a list) and asks me to use them on the man who has watched me since day one. The best moment is the casualty model: a reader of the bench who spots the mistake, writes the right figure in a margin in Base64 for "whoever checks his sums", and I then say it to his face. The worst moment was dying to a man I had just said "(Back off.)" to.
