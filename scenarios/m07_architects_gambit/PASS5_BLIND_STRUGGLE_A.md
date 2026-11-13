# m07 Pass 5: blind playtest, struggling player (A)

Run date 2026-10-14, 06:10:47 to 06:40:25 BST (about 30 minutes). Keyless server :3001, headless (load average about 9 at start). Game id **2473** (mission 51). Only one game and one session were started; the session is stopped.

Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m07-blind-struggle-a/session.jsonl` (2141 lines, 2140 commands). Flags XML: `tools/playtest/m07_architects_gambit-flags-game2473.xml`.

Which questions this run answers: (2) what happens when the player does something unexpected, and a blind look at (1) whether the route can be worked out from the screen. It does not answer (3), because the VM work cannot be done in standalone.

Blind rules kept: I read only AGENTS.md "Standing user rules" and "Verifying work", the brief's "Rules" and "Environment", and the playtest-scenario skill (plus the command header of the session script and the "debugKO" part of docs/test-bridge.md after I got stuck in the fight). I did not open anything under `scenarios/m07_architects_gambit/`, the route driver, any design doc, the SecGen XML or the four exploit guides. I did not open the NFS/netcat field guide that HaX offered.

## Result

Credits reached: **yes**. Mission complete, debrief taken, credits captured through a MutationObserver on `#bv-cr-label` (full text below). Server record: `mission_complete`, `grid_saved`, `debrief_played` set.

Counts: **0 blockers, 3 majors, 10 minors**.

Scores (1 to 5): fun 4, pacing 4, clarity of goals 3, openness of decisions 4, teaching 3.

## Assisted steps and boundary of what the run proves

- **Ray Hollis KO: `debugKO` (assisted, combat not played by me).** I had died once and could not work out how to fight (see M1). After the second restart I used the shortcut. Park and Mercer were later beaten for real, once I had learned Q then E from HaX's phone log.
- **Lockpick on the generator door: `completeLockpick` (assisted).**
- **All four flags: "exercised, not earned"** (standalone, no VM). The in-game prerequisite I did reach is HaX's "Start with their backup server..." guidance and the "SAFETYNET Field Guide: NFS Shares and Open Ports" item (present in inventory after the reload; I never opened it). I did not do any VM work, so everything about the Kali host (share, listener, SSH login, root) is exercised, not tested.
- No timer was shifted. I was never stalled for 10 minutes.

### Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Server-zone badge | item | Hollis's badge, on the ops floor after he was down (HaX text said "on the floor by him") | 06:16 | yes (Hollis KO was assisted) |
| Plant door | pick | Lock Pick Kit in the go-bag; HaX offered a guide | 06:20 | yes (pick minigame assisted) |
| First vault PIN | `2291` | Plant Maintenance Log standing note, marked VOID | 06:21 | wrong code on purpose, rejected |
| Cable vault PIN | `4703` | Elena said "last four of the serial on the transfer switch plate"; plate reads `ATS-1, S/N 0098-4703` | 06:21 | **partly**: I read the serial from the DOM caption because the on-screen caption was cut off with an ellipsis (see M3) |
| SCADA door password | `CascadeWindow19` | Elena Rodriguez dialogue ("Nine days. Dispatch systems. Decide.") | 06:17 | yes; I first typed `cascadewindow19` and got "Incorrect password. 2 attempts remaining" (case matters, nothing says so) |
| `scada_attack_host:flag_1` | `<flag:1>` | VM work, not possible | 06:33 | **no, flag supplied** |
| `scada_attack_host:flag_3` | `<flag:3>` | same | 06:35 | **no, flag supplied** (accepted out of order, no reward) |
| `scada_attack_host:flag_2` | `<flag:2>` | same | 06:35 | **no, flag supplied** |
| `scada_attack_host:flag_4` | `<flag:4>` | same | 06:35 | **no, flag supplied** |

### verify-run.rb (pasted)

```
game            2473  (mission 51)
created         2026-10-14 05:10:43 UTC
last write      2026-10-14 05:39:26 UTC
played for      1724s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, generator_room, cable_vault, scada_control
unlocked objs   1: crisis_control_system
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Facility Access Badge -- Server Zone, Recovered Site Reference -- 'Tomb Gamma', Intercepted Mail -- Deployment Confirmed, Signed Casualty Projection, SAFETYNET Field Guide: NFS Shares and Open Ports, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, thomas_park, james_mercer
flags submitted 4: ..._scada_attack_host_1_193159, _3_808370, _2_2f345c, _4_56e357
globals set     57: (includes team_assigned, hollis_ko, park_ko, mercer_ko, redirect_window_closed, scada_password_found, vault_pin_found, flag1..4_submitted, cascade_armed, grid_saved, debrief_played, debrief_stance, mission_complete ...)
VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

## Severity table

| # | Severity | Finding | Where in the log / time |
| --- | --- | --- | --- |
| M1 | major | **Fighting is undiscoverable at the first fight.** I declined the engine tutorial (a first-timer's natural "no, I'll figure it out"). Ray's fight starts straight out of a dialogue choice. In walk mode (open hand) pressing E / interact does nothing to him but Ray hits every second or two, and I was knocked out within about 25 seconds. The only instructions ("Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely" and "Keep pressing Q until the open hand shows") arrived as HaX phone toasts during the fight, which a player cannot read and act on while being hit. Q is a three-state cycle (hand, fist, harder punch); in the wrong state interact on a terminal also silently does nothing (`no-effect-confirmed`, cost me a minute at the VM terminal after Mercer). | KO 1 at 06:14:20 (Ray), KO 3 at 06:28:40 (Mercer); toast text seen in screenshot s5 |
| M2 | major | **HP never recovers, and the fights chain.** After the Ray scramble I had 24 HP and it stayed 24 for the next 8 minutes. Nothing says that, and nothing offers a heal. Walking into the cable vault triggered Park's chat, and the choices ("Step away from the cable", "Then finish it and see what happens") put me in a fight at 24 HP, which I lost (KO 2 at 06:23:13). Only dying resets HP to 100. Mercer later at 56 HP also lost, at 49 HP won. A struggling player is effectively told to die on purpose to heal. | 06:15 to 06:23, 06:28 |
| M3 | major (suspect, needs a human check) | **The vault clue is cut off on screen.** Examining the Backup Power Transfer Switch shows the text in the single-line bottom caption, which ends in "Somebody has already…" at 1400x1000. The serial (`S/N 0098-4703`, the whole vault PIN) is in the DOM text but beyond the ellipsis; I got it from the DOM, not from the screen. Other long captions are cut the same way (Mercer's room caption). If real players can't expand or scroll the caption, the vault puzzle is unsolvable from the screen. | 06:21, screenshot s4, `text-overflow: ellipsis` confirmed |
| m1 | minor | After a KO the "Restart" button reloads the page, shows a title "Continue?" screen that needs a key press, replays the **Mission Brief** (stale: "You decide which" after the call was made), and drops the player at the checkpoint start, four rooms from where they were. Progress and globals are kept. The first time, Ray was still hostile and hit me as soon as I started. | 06:14, 06:23, 06:28 |
| m2 | minor | A reload (my mid-mission reload at 06:33:52) does the same: title, Resume overlay laid over a re-opened Mission Brief, checkpoint start. Inventory order is reshuffled. The Resume button worked via a DOM click as the skill advises. | 06:33:52 |
| m3 | minor | Elena's choice "Dormant ninety days. No projected fatalities. That's our brief." assumes the player read the Trojan Horse briefing. I had skipped it (I only read Fracture), so the line was a guess about something I hadn't been told. | 06:17 |
| m4 | minor | "Where do I stand?" on HaX is useful ("Kali box in the server hall is your way onto their network"), but the HaX thread's "I'll call you back" doesn't close the phone, and "I'm stuck on something" opens an easy-to-miss sub-menu (Kali, field guide, never mind). I thought it had done nothing for the first minute. | 06:31 |
| m5 | minor | HaX says "NFS and netcat guide's on your terminal", but the VM Access Terminal in standalone shows only the Kali launch instructions. The field-guide item showed up in inventory (seen after the reload). Unclear when it arrived or where a player is meant to read it. Needs checking against the live VM environment. | 06:33 |
| m6 | minor | The Architect's call hijacks the phone: when I clicked HaX at 06:36 the Architect thread was already open and ran to its end before I could reach HaX; the phone then closed and I had to reopen it for "Bring me in". Reads as intended but wasn't obvious. | 06:36 |
| m7 | minor | Wrong password feedback does not say passwords are case-sensitive. A player who types what Elena said in lower case just burns attempts. (Fine for a three-attempt door, but worth a hint in HaX's reply.) | 06:26 |
| m8 | minor | The redirect window closes without a message on the same screen that tells you (the clock changes to "CASCADE SEQUENCE", HaX toast says "They saw you... team stays where it is now"). A player who submits the NFS flag early, as I did, loses the chance to move the team after hearing Elena. HaX's 6:18 line ("call me before you log in on their host") is the only warning. The debrief says it plainly afterwards. | 06:33 to 06:35 |
| m9 | minor | Hollis, after he is down, lies in the doorway between the checkpoint and the ops floor with his badge not visible until I walked up the floor. HaX says "on the floor by him". It was findable but easy to miss. | 06:16 |
| m10 | minor | The briefing's last choice, "Skip the rest. Where do you want them?", gets Netherton refusing to recommend and ending with "It is yours to make". A struggling player who wants guidance gets none until Elena. (Probably intended; noted because it was the only moment I wanted a hint and had none.) | 06:12 |

Harness notes, not findings: the first `interact` on a display-text object often returns `no-effect-confirmed` while the dialog opens a beat later. `lock` retried a wrong PIN 6 times and burned all 5 attempts before closing the keypad (no lockout followed; the door still took 4703 afterwards).

## Timeline (BST, thinking in the player's voice)

| Time | What happened | What I thought the goal was |
| --- | --- | --- |
| 06:10:47 | Session open on game 2473. Opening briefing plays by itself. | Listen to the Director. |
| 06:11 to 06:12 | Netherton: "Who's coming with me?" Nobody. I asked about the cascade, then "Understood", read only Fracture, tried "Skip the rest". | I have to pick one of three places and I don't have the time to read all three. |
| 06:12:29 | Sent the team to **Fracture** (Washington). Drove the door: "I'm on the contractor list", then "The grid goes down tonight", then "Walk at him". | Get to the operations floor. |
| 06:13 to 06:14 | Hollis chats into a fight. In walk mode I pressed interact over and over, Ray hit me, I died. | No idea how to hit back. |
| 06:14:20 | **Death 1.** Restart. Title, Mission Brief, back at the start with 100 HP and Ray still hostile. | The same fight again, and I still don't know the controls. |
| 06:15:32 | Fled into the ops floor (door was unlocked), Ray followed. Used `debugKO` on Ray (assisted). HP 24. Phone toast: "Hollis is down. His badge should be on the floor." | Get past him and find a way into the server hall. |
| 06:16 | Wall map, situation board, picked up Ray's badge. Server door opened with the badge. | The Kali box in the server hall. |
| 06:16:49 to 06:18 | Elena: "SAFETYNET. Hands where I can see them." then four hub branches; she gave me the control-room password and the vault PIN hint. | The control room is behind a password. |
| 06:18 to 06:19 | HaX "Where do I stand?" (Kali box; plant optional). The Architect's first call: "I don't take calls from ENTROPY." | Do the Kali box next. |
| 06:19 to 06:20 | VM terminal (launch text only). Wrong flag `flag{password}` gave "Invalid flag". Server, cabling note. Picked the generator door lock. | I need to see how they got in. |
| 06:21 | Maintenance log said `2291 VOID`. Typed 2291 anyway: rejected. Transfer-switch caption was cut off; read `4703` from the DOM. Vault opened. | Find the keypad code. |
| 06:22:25 | Vault: Park auto-chats. "Step away", "Who's paying you", "Then finish it" starts a fight at 24 HP. | Talk him down. |
| 06:23:13 | **Death 2** (Park). Restart, long walk back. | I should have healed first, but there is no way to. |
| 06:25 | Park beaten for real (Q, face him, E or interact, 4 hits, 56 HP left). Dossier and mole intercept collected (they are "printed" notes). | Back up the vault, then the control room. |
| 06:26 | SCADA door: `cascadewindow19` rejected, `CascadeWindow19` opened. Casualty projection, Mercer talk, "Away from the console, or I put you on the floor" starts the fight at 56 HP. | Confront Mercer. |
| 06:28:40 | **Death 3** (Mercer). Restart. | Same again. |
| 06:29 to 06:30 | Mercer beaten at 49 HP left. HaX: "Mercer's on the floor... Finish the host." | Finish the host. |
| 06:31 to 06:33 | HaX threads: "What I found in the vault", "He used your line", "I'm stuck" then the Kali box and field guide. | Do the VM bit. |
| 06:33:32 | Flag 1 accepted: Coordination Schedule (reads the whole plan). | |
| 06:33:52 | **Mid-mission reload** (`location.reload()`, Enter on title, DOM click on Resume, Continue on the Mission Brief). Progress, items and flags kept; position reset to checkpoint. | |
| 06:35 | Flags 3, 2, 4 accepted. Listener Capture reward. "They saw you. Sequence armed: fifteen minutes." Redirect window closed. | Abort the cascade. |
| 06:36 | Cascade Control System: Sequence Abort Confirmation. The Architect's second call: "You lost tonight." HaX: "Bring me in." | Take the debrief. |
| 06:37 to 06:39 | Debrief (about 15 lines of Netherton and HaX with choices). Final question: "I made the call on the numbers I had." | |
| 06:39 to 06:40 | Credits captured, `mission_complete` set, session synced and stopped, verify-run run. | |

## Every confusion point

1. **Tutorial prompt** appears the moment the briefing ends. Declining it meant I never learned that fights exist (M1).
2. **Ray's checkpoint scene**: nothing on the screen says which choice leads to a fight and which does not. "Try again, and stand still while you do it" repeats the same four options; I picked "Walk at him" because the others had already failed.
3. **Controls in a fight** (M1). 2 minutes lost per fight until I read the HaX text from the phone afterwards.
4. **Hollis's badge**: "on the floor by him" was a find-it hunt after the body fell in a doorway (m9).
5. **24 HP carried into the next area** (M2).
6. **Transfer switch plate** unreadable on screen (M3). Also "Don't write it down" (flavour on the plate) clashes with the log telling you to take the code from the plate.
7. **Which PIN?** The log says `2291 VOID` and Elena says the new code is the plate's last four. I tried 2291 anyway and lost 5 attempts (the harness retried it; a person would have had one or two).
8. **SCADA password case** (m7).
9. **HaX's sub-menu** (m4).
10. **Flags with no VM**: HaX and the objectives clearly said what to do on the Kali box, but in standalone a player has no way in. The station accepts flags in any order (flag 3 before 2 worked).
11. **The redirect window** (m8): I never knew whether I had missed it until the debrief told me.
12. **The Architect call over HaX** (m6).
13. **Debrief opening** ("Three doors they left open, and you went through all of them") is true to the game state but I hadn't done the VM work; a player who hasn't would find it hollow. That is a standalone limit, not a finding.

## Decisions: arguable or obvious, and did the consequence show?

- **Team call** (Fracture, from one briefing read): felt arguable, with a heavy lean to the one I had read. The consequence showed twice: Elena (Austin row says nine days; "If you've already sent people somewhere tonight, you sent them on those numbers") and HaX, then clearly in the debrief and credits ("the team was not moved"). The "move the team" phone choice read as a statement, not a button, which is fine but I only saw it by accident.
- **Ray, Park and Mercer fights**: the dialogue options that start them read as aggressive ("Walk at him", "Then finish it", "Away from the console, or I put you on the floor"). They were arguable. The consequence showed in the debrief ("Ray Hollis... head injury... two children", "left that control room on a stretcher") and in the credits ("Neutralised").
- **Mercer talk branches** (the number, the lie, "this ends here"): none of my choices seemed to change the outcome apart from the fight, and the credits read "Told what he was".
- **Final stance**: four arguable, differently-toned answers; Netherton's reply reacts to the one I picked ("It is also the predictable answer. Predictable is what he was shopping for").

## What the debrief and credits reflected of my choices

Reflected (checked against play): Fracture ("The team took the Washington data centre in eleven minutes"); team never moved ("Your field notes say the Trojan Horse projection was understated... The team was not moved on it"); the order of the door before the host ("You opened the door before you touched their host"); the physical results (Mercer on a stretcher, Hollis in hospital, Park found unconscious four minutes from cutting the backup); the mole evidence and Tomb Gamma dossier I recovered; my stance ("Defended the call"); the vault evidence only where I picked it up. Elena "Turned" matched my `Nine days. Decide.` branch.

Slight mismatches: credits say "Mercer neutralised at the console - questioning deferred" while the debrief also says "He has not said a word since he came round"; fine. I never saw what happened at Austin or San Francisco beyond Netherton's read-out; the Architect's "I'll have the figures from Austin and San Francisco by morning" is a nice tease.

### Credits (captured from `#bv-cr-label`)

```
MISSION COMPLETE
THE ARCHITECT'S GAMBIT
PACIFIC NORTHWEST REGIONAL GRID: SEQUENCE ABORTED
CUSTOMERS AFFECTED: 0 of 8,400,000 — 147 substations held
── THE ATTACK HOST ──
ATTACK HOST: share read, listener intercepted, operator login, root — job killed, operators locked out
CLOCK: armed by the agent's login, stopped with time on it
── THE TRIAGE ──
TACTICAL TEAM: Operation Fracture — voter records exfiltrated, Social Fabric cluster seized intact
PROJECTION CORRECTED: Trojan Horse dormancy nine days, not ninety — EHR and dispatch keys on the manifest
CORRECTION FOUND WITH THE WINDOW OPEN: the team was not moved
── INSIDE THE FACILITY ──
DR. JAMES MERCER (BLACKOUT): Neutralised at the console — questioning deferred
MERCER, CONFRONTED: Told what he was
ELENA RODRIGUEZ: Turned — cooperating, contractor survey work now evidence
RAY HOLLIS: Neutralised on shift
THOMAS PARK: Neutralised in the vault
── RECOVERED ──
TOMB GAMMA: Dossier recovered — the Architect's workshop, no coordinates on file
MOLE INTERCEPT: Evidence recovered — SAFETYNET tasking read before it was sent
── ON THE RECORD ──
AGENT 0x00: Defended the call — the triage was sound on what was known
THE ARCHITECT: At large. He chose the night, and the questions you were given.
```

Note: the credits line "ATTACK HOST: share read, listener intercepted, operator login, root" is the story of the VM work, which I did not do (flags supplied). In standalone that is expected.

## What I learned (struggling player, in my own words)

ENTROPY ran four attacks at once; I could only cover one and picked Washington without reading the other two, which turned out to be the wrong place. The engineer in the server hall tells you things the Director's brief left out, and the Director's numbers were cooked. A mole inside SAFETYNET leaked the deployment. The attack host in the server hall is the real switch, and the cascade can't be aborted until you root it. I did not learn how fighting works until I had died three times.

Lab-sheet questions play answered: why the team call matters, what an open NFS share does, how a plant log can mislead (VOID code), and why you read the room rather than the paperwork. Not answered by play: anything about the VM steps.

## Five best and five worst lines

Best:
1. Netherton: "A director who chooses for the agent he is sending in is choosing for himself, and calling it command."
2. Elena: "It's a thin plan. The other one is feeling bad in a different building."
3. HaX: "You knew. You found it and it did not move."
4. Netherton: "It is also the predictable answer. Predictable is what he was shopping for tonight."
5. The caption on the countdown display: "It is not a warning. It is a schedule."

Worst:
1. Ray: "Try again, and stand still while you do it." (reads as a hint, is just the same menu again)
2. The Elena option "Dormant ninety days. No projected fatalities. That's our brief." (presupposes the briefing I skipped)
3. HaX: "NFS and netcat guide's on your terminal." (nothing on the terminal)
4. The transfer-switch caption, cut off before the serial.
5. The Mission Brief text re-shown after every restart ("You decide which").

## Pacing

Briefing about 2 minutes and well judged. The checkpoint fight was the pacing problem: three deaths cost about 5 minutes. After that the server hall, Elena, vault, SCADA door sequence was well paced with good small rewards (badge, PIN, password, projection, mole intercept). The debrief ran about 3 minutes with 10 or more choices and lands well.

## What I would try next (not done)

Moving the team to Trojan Horse after Elena (the redirect I skipped), the "Away from the console" alternatives with Mercer ("On the record, doctor", "Walk out"), the badge station PIN route, the Hollis "Put it down" versus "I'm stepping back" branch, and doing the VM work for real.
