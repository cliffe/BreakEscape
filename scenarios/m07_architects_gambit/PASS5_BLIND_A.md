# m07 "The Architect's Gambit": pass 5 blind playtest A ("do your best")

Blind run, persona "do your best". Question answered: solvability and decisions (can a player work it out, and do the choices show later). VM steps are not earned: no VM exists on the keyless server, so flags 1 to 4 were supplied.

- Game id 2594, keyless server :3001, headless session tag 2594.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d5a9522a-d714-4f83-a327-405305dc7311/scratchpad/m07-blind/session.jsonl`
- Wall clock about 48 minutes of play (game record 19:24 to 20:12 UTC), then about 20 minutes on the credits screen.
- Read only what the brief allowed. One slip: I ran `ls` on the scenario folder to see whether a report file already existed, which printed filenames (including two other PASS5_* names). I did not open any of them.
- Harness limits, said once: the Close button on text popups and some minigames needed `dismiss` or `mg clickText`; text-only objects (wall map, workstation) report `no-effect-confirmed` although the text shows; the phone `getState().text` lags behind the bubbles, so I read the DOM bubbles (visible text only) and screenshots.

## verify-run.rb output (game 2594, run after the credits)

```
game            2594  (mission 51)
created         2026-10-16 19:24:42 UTC
last write      2026-10-16 20:12:48 UTC
played for      2886s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, generator_room, cable_vault, scada_control
unlocked objs   1: crisis_control_system
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Shift Handover Sheet, Plant Maintenance Key, Facility Access Badge -- Server Zone, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Recovered Site Reference -- 'Tomb Gamma', Intercepted Mail -- Deployment Confirmed, Signed Casualty Projection, Sequence Abort Confirmation
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, thomas_park, james_mercer
flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_5df11e}, ..._2_55598e, ..._3_d3766f, ..._4_24d169
globals set     63 (includes team_assigned, team_redirected, redirect_declined, redirect_window_closed, park_ko, mercer_fate, elena_outcome, debrief_stance, mission_complete, grid_saved)
VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Server record: `status = completed`, `mission_concluded_at = 2026-10-16 20:07:03 UTC`. (`current room` reads security_checkpoint because the KO restart and the later reload reset the saved room; see finding M5.)

## Earned-secrets table

| Secret | Where I got it in play | Earned? |
| --- | --- | --- |
| Server-zone badge | Ray Hollis handed it over after I put his own login against Mercer's renewal (handover sheet + visitor log). I never used the printer PIN (0616, on the handover sheet) | yes |
| Plant maintenance key | On the ops floor, supervisor's desk | yes |
| Control room password CascadeWindow19 | Elena (after I told her honestly there was no version of her life that avoided a courtroom), and again in the listener capture | yes (dialogue), capture row is "flag supplied" |
| Cable vault PIN 4703 | Maintenance log marks 2291 void; transfer switch plate S/N 0098-4703; Ray, Elena and the schedule all say "last four of the plate" | yes |
| Flag 1 (NFS) / 2 (listener) / 3 (account) / 4 (root) | Submitted from the seeded set at the SAFETYNET relay terminal | **no, "flag supplied"**. Everything downstream (the coordination schedule, listener capture, cascade timer, abort) was exercised but the VM work is unproven |
| Abort | Took "Sequence Abort Confirmation" from the cascade console desktop after flag 4 | yes, given the flags |

## Timeline (what I thought the goal was)

1. Opening: the cutscene went straight into the briefing hub (bootstrap timed out on it, see M6). Goal as I understood it: send the one tactical team to one of Fracture, Trojan Horse, Meltdown. I read all three briefings and the side-by-side. Chose Meltdown (80 to 140 dead this week, the only one killing people tonight).
2. Checkpoint: goal "get to the operations floor". Ray Hollis cutscene (flashlight caught me at the evacuation board). Told him the grid goes down, asked how much, walked at him, stepped back. Read the visitor log and board. Page reload mid-conversation with Ray (see M5).
3. Ops floor: wall map, situation board (four-step sequence), handover sheet, workstation, maintenance key. Phone: HaX (layout, "Hollis has a badge, the desk prints them with a PIN") and an unprompted call from The Architect. Goal now: server hall badge.
4. Back at the checkpoint: second Ray conversation with the log evidence (see decisions). Got the badge, Ray left by the muster door and gave the vault clue.
5. Server hall: Elena. Learned the Trojan Horse manifest was full of EHR/CAD (health record and dispatch) keys and the desk's "ninety days" was nine. Got the control room password and the vault code. A "Team redirect window" timer (about 28 minutes) appeared.
6. HaX said the redirect is "now or never, once you log in". I declined first, submitted flag 1 (decoded schedule confirmed Elena), HaX said the window was still open, and I moved the team to Trojan Horse.
7. Flag 2 (listener) confirmed the password. Optional plant branch: generator hall, plate serial, vault, trunk splice, Tomb Gamma dossier, intercepted mail (a SAFETYNET address told the Architect "0x00 to Portland" before the order went out). Park fight.
8. Control room: Mercer. Arrested on the record. Then flag 3 (cascade armed, 15 minutes, redirect window shut), flag 4 (root), abort at the console, Architect sign-off call, HaX, debrief, credits.

## "Didn't know what to do" moments

| Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Opening, first bootstrap | about 2 min | `bootstrap` returned TIMEOUT twice because the briefing conversation was open and the harness kept clicking "cutscene choice" | Stepping the briefing by hand. Not a player problem |
| Server hall, "when does the clock start?" | about 4 min | HaX said "no clock yet", but a redirect timer was already on screen from Elena's reveal; HaX also said "once you log in" while I had not logged in | Reading the timer, then asking HaX again; the window stayed open until flag 3 |
| Park conversation | about 3 min | "Step away from the cable" and "Who's paying you" both loop with identical replies; nothing reflected the intercept or the splice I had found | Choosing Fight |
| Park fight (first attempt) | about 4 min, ended in a KO | Q for fists then E; my HP went 100, 80, 72, 52, 20, 0 in about 25 seconds. I could not tell whether my punches landed (no health bar over Park; the bar over my head was mine; a red "4" popup) | Restart, then a second attempt with a first aid kit. Won with HP 100, 84, 76, 56 |
| After the fight, control room | about 1 min | Interacting with the casualty projection gave only the flavour line. Fists were still up (HaX's "Hands down: press Q until the open hand shows" toast came after) | Pressing Q again |
| Credits screen | about 12 minutes | No visible way to leave; the visible controls were only the visualiser tabs. A "✕ CLOSE" button exists but was `display:none` for the first 12 minutes or so, and the right-hand panel is clipped at 1400 px wide | Waiting. I reloaded before I clicked it, so I did not use it (see M1) |

## Decisions: arguable or obvious, and did the consequence show

| Decision | Felt | Showed later? |
| --- | --- | --- |
| Which op for the team (Meltdown) | Arguable. The briefing is fair and flat ("A life, a vote and a decade do not convert") | Yes, in the debrief, per op, in numbers |
| Ray: truth, "How much?", then the log evidence, "wait for the police", then "badge, then you're gone" | Arguable. "Sit down, Ray" and "wait for police" collapse into "badge then go", so the hold option felt like a bluff the writing let him call | Yes. Debrief: "The police picked Ray Hollis up at the gate. He told you more about the vault than he has told us." |
| Elena: honest ("there isn't a courtroom-free version") over the deal or the threat; "stay on the load-shed tables" | Arguable; honesty reads as the intended, warm choice (her reply thanks me for "not making it sound like a deal") | Partly. Debrief gives her "a statement without being asked twice" but I never saw what the tables achieved |
| Redirect the team to Trojan Horse (decline first, move after the schedule confirmed Elena) | Genuinely arguable. HaX states the cost straight (40 minutes late, a third stopped, Meltdown dark) | Yes, strongly. "They stopped it at roughly thirty per cent. Fourteen million systems took the backdoor first", plus Meltdown's 80 to 140 and two of ours dead |
| Park: fight (the only way forward) | Obvious, since both talk options loop | Yes: "found unconscious in the cable vault, four minutes from cutting the backup power" |
| Mercer: "On the record" over police on the stairs, fight, or "walk out" | Arguable, and the most satisfying line in the mission ("You'd let me be quoted") | Yes: "in custody and talking... you read as the only person who thought he was worth arguing with" and "also heard from you that he was scenery" |
| Telling HaX about the intercept ("they leaked me") | Obvious once HaX offered it | Yes: HaX takes it to the Director and the Director counts level five |
| Closing stance ("mine to carry") | Arguable; four fair options | Yes: "Carry it accurately... The choice was yours. The menu was his." |

## What I learned, in my own words

The Director's brief was cooked. Every figure came from material ENTROPY let SAFETYNET capture, and the one agent assigned to Portland was named to the Architect 51 minutes before the order existed. The Portland cascade was a diversion in a four-way schedule run by one authority ("A."), and Mercer was the engineer's engineer who had run out of ways to be heard: three submissions, costed and declined. Elena was lied to by omission (the human-cost annex), and the physical half of the attack ran through a spliced trunk run and a half-cut transfer switch. The attack host leaks its own secrets (open NFS, a listener that sends the operator password in clear, an account that can become root). There is a mole at level five. On the VM side I only touched what the relay gave back: the coordination schedule, the listener capture and the abort.

## Five best lines

1. Ray Hollis: "Six months I've been waiting for somebody to come and ask. Turns out I just wanted the asking over with."
2. Mercer: "No. I wanted to be listened to for eight years. Being right was what I had left."
3. Mercer on being arrested on the record: "You'd let me speak. ... No. You'd let me be quoted. I know the difference."
4. The Architect at the end: "I wasn't playing for tonight. You'll have the figures too. Then we'll both know the same thing about you."
5. Director Netherton: "So carry it accurately, which is harder than carrying it heavily. The choice was yours. The menu was his." (Runner-up: Elena on page forty, "That's how they get people like me. You'd think it was money.")

## Five worst lines or text

1. The credits ticker and header: "OPERTN: OPERATION: IRONSEAL", "ENTROPY CONTAINED", "THREAT ASSESSMENT: NOMINAL", "INTEL: ENTROPY FAILSAFE · VICTORY", "WELL PLAYED, AGENT". It contradicts a debrief that ends on a mole and a free Architect.
2. HaX, twice: "And it's now or never. Once you log in on their host, the team stays where it is." The window stayed open through flags 1 and 2 and shut at flag 3. A player reading it literally would decide before reading the evidence that settles it.
3. Park, both loops: "I lean four inches and this building goes to candles. Talk quieter." Strong the first time, flat as the fifth identical reply when none of the evidence I carry changes it.
4. Director: "The other three operations went ahead on schedule." One of them (Austin) was stopped at about thirty per cent on my order.
5. Mercer's "Not yet. I've something else to ask you." leads back to the same two options with no new question; Elena's second visit offers "Give me the control room door and the vault code again" after she gave both.

## Lighting and conversation backgrounds

I screenshotted Ray, Park and the Director conversations. I did not screenshot Elena, Mercer or the phone chats, so those backgrounds are unchecked.

| Room / phase | Lighting seen | Match? |
| --- | --- | --- |
| Security checkpoint | Bright, flat office light, guard cone shown in green | Matches a day-lit desk, a little bright for 03:00 |
| Operations floor | Dim blue night shift, amber tint over the board wall | Matches |
| Server hall | Bright cool white | Matches (plausible) |
| Generator hall / cable vault | Grey industrial; vault flat grey with a green status lamp | Matches |
| SCADA control | Purple and red tint, "SEQUENCE LOADED / AWAITING HOST" | Matches, and reads as the threat room |
| Ray conversation background | Guard booth: desk, phone, radio, extinguisher. The notice reads "TIME CLIP-SON SCLINT REQUIRED" (garbled text) | Matches the room; garbled sign is a minor art fault |
| Park conversation background | Cable vault: trunk cables, junction box, printer on a bench | Matches |
| Director debrief | Night city skyline from a high office with lamps | Matches a remote Director at night; no check was possible against a "morning" phase |

## Scores (1 to 5)

- Fun 4. The conversations are the best part; the fight and the credits wait cost it.
- Pacing 3. The first hour moves well. The KO restart drops you at the checkpoint spawn (a long walk) and the credits wait is about 12 minutes.
- Clarity of goals 4. The objectives panel is clear; the clock and the redirect wording are not (G2 below).
- Openness of decisions 4. Real choices with named costs, and the debrief names almost every one back.
- Teaching 3. I could judge only the in-game half (reading a schedule against a brief, checking a claim before acting on it, plate serial to PIN). The NFS, listener and privilege work is untested here.

## Severity table

I do not classify any item as a game bug. "Suspect" means I believe the cause is on the game side but have not ruled out my driving.

| #  | Severity | Finding | Repro |
| -- | -------- | ------- | ----- |
| M1 | major | Credits screen ("Mission complete // Audio intel") gave no visible exit. The `✕ CLOSE` control was `display:none` for about 12 minutes, and the right panel is clipped at 1400 px. Suspect headless or audio-length behaviour (the headless browser may never play the track); a headed player may see it sooner | Finish the debrief in game 2594, wait; session log from the debrief to the end |
| M2 | major | Redirect framing contradicts itself. HaX says "now or never, once you log in", but the window stays open after the NFS and listener flags and shuts at flag 3. The decoded schedule that proves Elena is the reward for flag 1, i.e. it arrives after the point HaX says the choice ends. "Then they stay. That's a decision too" is followed by the same option still listed | Game 2594: decline in HaX chat, submit flag 1, re-open HaX |
| M3 | major | Credits text names the wrong operation and the wrong outcome: "OPERATION: IRONSEAL", "ENTROPY CONTAINED", "THREAT ASSESSMENT: NOMINAL", "VICTORY", "WELL PLAYED" | Game 2594, credits screen |
| M4 | major | Park fight is unreadable for a first-timer: no health bar over Park, the bar and a red "4" appear over the player, HP fell 100 to 0 in about 25 s while I could not tell if I hit; the controls only reach me through HaX toasts that arrive after the first trouble. Second attempt won only after I had worked out position and a first aid kit | Game 2594, vault, "Then finish it". HP samples: 100, 80, 72, 52, 20, 0, then 100, 84, 76, 56 |
| M5 | major | Position resets on reload and restart. A reload mid-Ray-conversation put me at the spawn (160,144) and replayed the hub; the KO "Restart" reloaded to the title screen and put me at the checkpoint spawn with all items and globals kept, so it is a long walk back to the vault (progress itself survives) | Game 2594, reload while Ray talks; KO in the vault, Restart |
| m1 | minor | Fists-up state silently blocks object interaction ("no effect"); the "hands down" toast comes only after the fact | Game 2594, after Park, interact with the casualty projection |
| m2 | minor | Park talk options loop with identical replies; nothing reflects the intercept or the splice | Vault, choose "Step away" twice |
| m3 | minor | Mercer "Not yet. I've something else to ask you." returns to the same two options | Control room, Mercer |
| m4 | minor | Elena's second visit repeats the hub, including "Give me the control room door and the vault code again" after both were given | Server hall, after flag 3 |
| m5 | minor | "Back off. I'm leaving." with Ray reuses the narration "You give him the corner and the corner gives you his blind side" though I never cornered him | Checkpoint, Ray, option 4 after reload |
| m6 | minor | Opening: the harness `bootstrap` times out on the opening briefing conversation (not a player issue, but a tester needs to step the briefing by hand) | Game 2594 start |
| m7 | minor | Both `redirect_declined` and `team_redirected` are true after I declined then moved the team (stale global in `verify-run.rb`) | verify output |
| m8 | minor | Debrief: "The other three operations went ahead on schedule" although one of them was stopped at about thirty per cent | Debrief, "How close was it?" |
| m9 | minor | Garbled sign in the Ray conversation background ("TIME CLIP-SON SCLINT REQUIRED") | Checkpoint conversation |

Counts: 0 blockers, 5 majors, 9 minors.

## Top three issues

1. Credits screen exit and wording (M1, M3): hidden Close for about 12 minutes, clipped panel, and a ticker that says IRONSEAL, CONTAINED, NOMINAL and VICTORY over a grim debrief.
2. The redirect decision's framing (M2): the literal reading ("now or never, before login") hides the document that settles it.
3. The Park fight and the restart cost (M4, M5): unreadable combat feedback and a restart that sends you to the start of the map.

## Stopped sessions and leftovers

Session 2594 stopped with `session-stop.sh`. The flags XML `tools/playtest/m07_architects_gambit-flags-game2594.xml` was left in place (written by `new-game.rb`).
