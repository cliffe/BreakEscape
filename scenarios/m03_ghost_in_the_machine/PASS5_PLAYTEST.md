# m03 Ghost in the Machine: Pass 5 regression playtest script

> Written 2026-10-04 against HEAD 86675b6. For a Sonnet tester. Read `.claude/skills/playtest-scenario/SKILL.md` first (Steps 2-5, "Blind runs and regression runs"). These are **regression** runs: you know the answers; the earned-secrets table keeps it honest. Fetch every secret from its in-game source before you use it. Flags use the `session` policy: submit `<flag:N>` at the drop-site, and earn the in-game prerequisite (reach the server-room VM terminal) first.

Environment and commands are in `docs/agents/M03_LOOP_BRIEF.md` ("Browser playtests"): keyless server on :3001, `--headless true` required, `new-game.rb m03_ghost_in_the_machine`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`. Keep each run to 10-15 minutes. One report per run in your scratch folder; put the whole report in the final message if a Write is refused.

## Secrets and their in-game sources (fetch before use)

| Secret | Value | In-game source (reach this first) |
|---|---|---|
| Staff Access Badge | (cloned card) | Receptionist's lanyard, via the clone choice in her hub |
| Executive Keycard | (cloned card) | Victoria's card, cloned at the conference whiteboard |
| Office PC password | `Sterling2010` | Format from the IT reset post-it on the monitor; surname Sterling; year 2010 from the reception plaque (or the receptionist) |
| Wall-safe PIN | `5829` | Server-room whiteboard says Sable mailed it; her unsent draft on the office PC carries it; decode the draft at the CyberChef workstation |
| Four VM flags | `<flag:1..4>` | The VM terminal and drop-site in the server room (prerequisite: reach the server room at night) |

## Run A: day (10-15 min)

New game. Goal: act 1, the night turn, and one risky reload.

1. **Briefing** plays on load. Read a topic or two, pick an approach, deploy. Expect the brief panel once (`show_scenario_brief: once`), HaX's text "Your interview's with Victoria Sterling in the conference room…" (reworded in round 1).
2. **Reception**: read the plaque (note 2010), talk to the receptionist, sign in (visitor badge). Confirm the clone choice is **not** offered yet.
3. **Conference reader first**: go to the conference door and try it. Expect HaX's text that it wants a staff badge and the cloner copies one. **Reload here** (the refusal is a risky moment). After reload, confirm the brief does not pop again and the state held.
4. **Back to reception**: the clone choice "[Lean in by her lanyard and let the cloner read her badge.]" is now offered. Clone and **save** the badge → task "Find a way past the conference room's card reader" completes.
5. **Conference room**: emulate the badge, enter, talk to Victoria (task "Meet Victoria Sterling"). Play the recruit; build to the whiteboard; clone and **save** her executive card → task "Clone Victoria's executive keycard" completes. (If she grows suspicious, the read drops once; walk it back and retry.)
6. **Leave to the main hallway**: the night-transition cutscene plays (player portrait on a plain backdrop), then HaX's "You're in… use Sterling's card at the reader." Confirm "Breach The Server Room" is the only new objective.
   - *Alternative reload point if step 3's didn't exercise it*: reload right after saving Victoria's card, before leaving the room; confirm the cutscene has not played and she still talks as in the afternoon, then leave and confirm it plays once.

Record the earned-secrets rows for the two cloned cards (both earned in this run). Stop.

## Run B: night (10-15 min)

New game, then set the day-end state by console. **Mark every console-set value "exercised, not earned"** in the report.

Set these globals: `mission_phase = "act2_infiltration"`, `clone_call_done = true`, `reception_badge_cloned = true`, `victoria_card_cloned = true`. Write both cloned cards into the cloner's `saved_cards` (receptionist_badge weak-defaults, victoria_keycard_clone custom-keys) so the readers open through the real flipper UI. Do **not** set any flag global, the office/safe/drive globals, or `victoria_choice_made`: those are earned in this run.

1. **Server room**: emulate Victoria's card, enter. Launch the VM terminal (this is the in-game prerequisite for the flags). Submit `<flag:1>`, `<flag:2>`, `<flag:3>`, `<flag:4>` at the drop-site, **one at a time, waiting for each result** (see the struggling-player note). After flag 4: the revelation call text arrives, the drop-site stays open, "Read the recovered transaction log" is on the list, "Settle Accounts" unlocks. Read the printed Transaction Log → that task completes. **Reload after the 4th flag**; confirm progress held and the confrontation is still available.
2. **Whiteboard**: read it (ROT13); take the CyberChef workstation.
3. **Office** (executive wing, north; pick the door when the guard's back is turned): crack the PC with `Sterling2010` (format from the post-it, year from the plaque). Read the unsent draft; decode it at CyberChef → `5829`.
4. **Wall safe** (server room): open with `5829` → catalogue.
5. **Drive** (office desk): read it; decode the layered text at CyberChef; tell HaX the right answer → decode_directive completes.
6. **Danny** (executive wing, south): talk to him; pick protect / expose / leave.
7. **Guard**: for this run, get past him cleanly (round 1 patrol: start the pick as he turns his back on the door and walks west). Note whether Perfect Stealth is earned at the debrief.
8. **Victoria** (conference room): confront her; pick **one** ending (say, arrest, since Phase 3's probe only played recruit). **Reload between her choice and the debrief's first line** if you can catch the window; confirm a room entry opens the debrief and she can't be re-KO'd into a different ending.
9. **Debrief and credits**: confirm the ending, Danny fate and stealth state all read correctly, and the credits roll after the debrief's last line.

Record earned rows: password, safe PIN, each `<flag:N>` marked "flag supplied, prerequisite earned". Run `verify-run.rb` and paste it. Stop.

## Carried browser checks (Phases 1-4)

Each with its expected result and the run that covers it.

| # | Check | Expected | Run |
|---|---|---|---|
| C1 (P1 stagger) | Night aims arrive one per beat | server room at the turn; office on wing entry; paper trail on server/wing entry | B |
| C2 (P1 stealth) | Perfect Stealth hidden until earned | never on the panel during play; appears completed in the debrief on a clean run | B (clean run step 7) |
| C3 (P1 decode task) | decode_directive | unlocks on reading the drive; completes on the right answer as a toast | B |
| C4 (P1 music reload) | Night music after reload | reload at night resumes the night/cutscene playlist, not day noir | B (step 1 reload) |
| C5 (P1 hostile-guard hint) | Fight the guard | HaX offers "The guard's coming for me"; "Where do I stand?" says he's after you | struggling run |
| C6 (P2-16) | Conference reader then clone choice | reader refusal first; clone choice appears after; also after a reload | A (steps 3-4) |
| C7 (P2-7) | Wrong-then-right directive | wrong answer logged as a guess; right one completes the task; guesser loses the "decoded by the agent" credit and the debrief line | B (step 5, do a wrong answer first) |
| C8 (P2-15) | Flag rewards 1-3 | no "Event triggered" panel; only the distcc flag gives an item | B (step 1) |
| C9 (P3-1) | Victoria's endings | each ending shows her full final lines, then the chat closes, then the debrief; arrest and escape not yet browser-tested | B (step 8, arrest) |
| C10 (P3-1 backstop) | Reload mid-fate (on her last line) | fate kept; the first room entry after the reload opens the debrief once | B (step 8 reload; see "Reload window" below) |
| C11 (P3-3) | Calls as texts | nothing open is closed; the drop-site stays open after flag 4 | B (step 1) |
| C12 (P3-19) | Missed call replay | dismiss the distcc text, open HaX, the hub re-offers the call; a lingering toast clicked after a hub replay lands on the hub | B (step 1) |
| C13 (P3-10) | Guard after player KO and reload | "You again…", not the police line; no hostile-guard hint for a peaceful guard | struggling run |
| C14 (P3-25) | Reload mid-fate re-KO | not reachable: the debrief opens on the first room entry, before a KO is possible | none |
| C15 (P4 receptionist) | First vs return visit | distinct greetings; return greeting doesn't assume she's been seen Sterling | A (steps 2, 4) |
| C16 (P4 guard) | Bribe and police routes | one police threat per route, no contradiction; the bribe line makes no "one hour" promise | struggling run |
| C17 (P4 briefing) | Briefing hub | no "what will I learn" topic; one reaction per approach; Nightshade's "our badge somebody clones" line present | A (step 1) |
| C18 (P4 debrief) | Debrief on an ending | no three-in-a-row "now we have the proof"; recruited branch consistent; "You left some of the paper behind" always names something | B (step 9); a second run on the recruited branch is worth it |

## Struggling-player brief (no answers named)

A second persona, fresh game, rushed and careless. Do not read this script's answers to yourself as the character; play as someone who hasn't.

- Takes the quickest-looking option, trusts the phone and the devices over paperwork, skips side rooms and readables.
- At the drop-site, types flags fast and back to back without waiting for each result (this is also C8's stress: watch whether a flag is silently dropped; resubmitting should work).
- Fights or knocks out the guard rather than timing him; tries to knock out the receptionist or Victoria.
- Ignores HaX's texts and the toasts; never opens the drive; never cracks the office PC.
- Lets things sit; reloads at awkward moments.

Record: every moment stuck and for how long, what they tried, what unstuck them; whether the objectives panel ever told them what to do next; whether the debrief and credits still read fairly for a messy run (guard KO'd, someone concussed, paper left behind, Victoria knocked out instead of confronted); and anything that soft-locked or contradicted what they did. Note whether a dropped flag ever had no on-screen feedback.

## Round 1 fixes: confirm

Added after round 1 (fixes on top of HEAD 3d2d990; m03 content last changed at 86675b6). Confirm each in the run named; one line in the report per row.

| Row | Change | How to see it | Expected |
|---|---|---|---|
| R1-1 | New task "Walk out with the visitors and come back after dark"; the "Card's saved" text now comes from HaX's phone | Run A step 5: save Victoria's card. Struggling run: knock Victoria out in the afternoon | A "New task" toast and the task on the panel in both cases; on the clone route HaX texts "Card's saved…" (phone beep, not a voice; clicking it opens HaX's thread); on the KO route HaX's handover call ends "Walk out with the visitors before anyone finds her. Come back after dark." The task ticks when the night scene closes, and "Get Inside WhiteHat" completes then |
| R1-2 | KO-aware night narration | Struggling run: KO Victoria in the afternoon, step into the main hallway | "Sterling is out cold on the conference room floor. You pull the door shut behind you." then "You walk out with the last of the afternoon's visitors…" |
| R1-3 | Debrief gated on what the player did | Struggling run (receptionist or guard KO'd, drive never opened) | No "Clean enough" and no "You did the technical work and still saw the people in it": instead "It got done. Not cleanly…". Drive line: "The search team went through Sterling's desk this morning and found a drive…". The player choice reads "So that drive is the map to their whole operation." with "It is. Next time, bring it out yourself." Credits: "PHASE 2 DIRECTIVE: FOUND IN STERLING'S DESK BY THE SEARCH TEAM". A run that opened the drive still gets "This is the map…" / "You handed us the shape of the thing." |
| R1-7 | HaX's first text reworded | Run A step 1 | "Your interview's with Victoria Sterling in the conference room, behind a staff card reader. Reception will sign you in. Message me if you get stuck." Reads true whenever it is opened |
| R1-8 | Briefing line | Run A step 1, ask "Did Zero Day sell Ghost the way in?" | "…Now we go after the seller's own ledger." (no "Tonight") |
| R1-10 | No change: the on-screen panel hides locked tasks (objectives-panel.js:131); the harness `openTasks` lists them | Run B: enter the server room before opening the drive | `decode_directive` is **not** on the on-screen panel (check the panel, not `openTasks`); it appears with a toast after the drive is read |
| R1-11 | Three dashes removed | Run B: whiteboard observation; HaX's all-flags text; Danny's protect choice | "…punctuation hold: each letter…"; "And be careful. Reasonable as she sounds…"; "You were deceived. I'll put that in the report myself." |
| R1-12 | VM fallback address | Run B: open the VM terminal | "192.168.100.3" (the target host in the proposed SecGen XML), not a /24 subnet |
| R1-16 | Clone choice in the first chat | Run A variant: in the briefing ask HaX about cloning; at reception sign in and answer her "first time" question | A fourth choice "[Lean in by her lanyard and let the cloner read her badge.]" is offered there; without the briefing topic it still waits for the reader (C6) |
| R1-20 | Guard patrol | Run B step 3: watch him for one loop before picking | He stands below and left of the office door looking at it for about 2 s, walks west with his back to it, stands near the west end for about 5 s, then walks back. Start the pick as he turns away: no catch. Start it while he stands at his post: caught. Report how many tries the first clean pick took |
| R1-21 | Grace line | Run B: get caught once ("Wrong door"), then try again in his sight | "I can still see you, you know. Away from the door." then "Step back from the door. Wait until his back's turned, then try again." (round 2 wording); he keeps walking; a try once his back is turned goes through |
| Voice rule | No printed values in voiced lines | Any run | No player name in spoken lines: receptionist "Afternoon! You'll be the three o'clock, is it?"; Victoria "You must be the candidate…"; HaX "Right. Zero Day Syndicate…"; debrief "There you are…" and "Go home and get some sleep…". Caught two or more times: "The guard clocked you twice." / "…more than twice." |

**Reload window (C10, C14), as observed in the round 1 confirmation runs.** The debrief starts within a moment of `victoria_choice_made`, so the window to use is earlier: after you pick her fate and **while her final lines are still on screen**, before the last Continue closes the chat. Reload there.
- C10, expected: her fate survives the reload (her fate tag runs as her last batch opens, and it reaches the saved globals even though the local state doesn't show it yet). The debrief opens once, on the **first room entry** after the reload, without talking to her again; the credits follow its last line. Record if it opens twice, never, or with a different ending.
- C14 (re-KO into a different ending): **not reachable** in play. The debrief opens on that first room entry, before there is a chance to knock her out, so there is no moment to test. Record it as not reachable; nothing to run.

## Blind fixes: targeted browser check (one 10-15 minute run)

New game. Console-set state only where noted; mark it "exercised, not earned".

| # | Change | Where to see it | Expected |
|---|---|---|---|
| B-2 | Reader pointer task | Skip the briefing topics; sign in; try the conference reader | Toast and panel task "Copy the receptionist's staff badge with your cloner", plus HaX's text; it ticks once her badge is saved |
| B-1 | Whiteboard reachable from any branch | In Victoria's first chat pick the blunt or accusing options, then "Thank you. I've taken enough of your time." ("not the right fit"); talk to her again | Panel task reads "Clone Victoria's keycard at her whiteboard"; her hub (first chat and after the rebuff) offers "[Is that your training lab on the whiteboard?]"; with low influence she answers "The training lab. Since you're so interested." and the read starts |
| B-4 | No change (engine) | When the cloner buzzes ("Card read. Now run Darkside on it."), press Continue once | The flipper opens at once over the chat; finish Darkside and Save inside it. Do not click the cloner in the inventory while it is open (that restarts it and loses the read) |
| B-3 | Sterling's room named | Console: `night_confrontation_ready = true`, `clone_call_done = true`; open HaX | Hub choice "[Sterling's still in the conference room. How do I play this?]"; the answer starts "…You've got the logs, and she's still in the conference room." The panel task reads "Settle Victoria's fate in the conference room" |
| B-11 | "Sable" only once heard | Same console state, briefing Victoria topic not heard, log unread: confront her | First choice reads "[SAFETYNET. And I've read your approvals.]" with "Then you've read more than most of my staff…"; after hearing the briefing's Victoria topic (or reading the transaction log) it reads "…Sable." |
| B-9 | Flag 3 text | Submit `<flag:3>` | "Price list's in. Read the healthcare tier and you'll see why we're here." |
| B-5, B-6, B-7, B-8 | Debrief and credits | Finish without the drive, cabinet or safe (handler trust middling) | "The drive wasn't the only paper you left behind." after the search-team drive line; "It's done. Get some rest. We'll need you soon." instead of "Clean enough". On a clean-stealth run the credit reads "PERFECT STEALTH: past the night guard unseen, with no excuses and no bribes"; a recruited run with the catalogue reads "…folded into routine advisories over the coming months", matching HaX |
| B-10, B-12 | No change | Server-room filing cabinet; Danny's PC second file | Note only: can you reach the cabinet from its front (the blind tester got in range from one side)? After taking one file from Danny's PC, is the second still listed? Report what you see |

