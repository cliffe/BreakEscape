# E12 Visitor and tailgater: blind playtest B2

Second blind round, fresh tester (Sonnet). Scenario `awareness_e12_visitor_tailgater` (full) and `awareness_e12_visitor_tailgater_defend`. Server :3001 (keyless), headless. Question answered: **solvability and unexpected behaviour from a player's seat** (blind run; plumbing is covered by scripted runs).

Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e12-b2/` (`r1-*` run 1, `r2-*` run 2, `r3-*` defend-only).

| Run | Persona | Game | Session log |
| --- | --- | --- | --- |
| 1 | Do your best (full), reload mid-round | 5205 | `.../blind-e12-b2/run1.jsonl` |
| 2 | Struggling player (full) | 5218 | `.../blind-e12-b2/run2.jsonl` |
| 3 | Do your best (defend-only) | 5221 | `.../blind-e12-b2/run3.jsonl` |

Blind rules kept: I read only the playtest skill, AGENTS.md Housekeeping and what the screen showed. Where the harness could not drive a visible control I used a DOM click on that visible control (the Resume button after the reload, as the skill documents). `mg getState` also prints some episode internals; I did not use them to choose answers.

## verify-run.rb output (abridged to the lines that matter, all three exit "progress recorded")

Run 1 (game 5205): rooms unlocked training_room, lobby; NPCs met lorna_easton, delphine_reception; tasks `work_reception_desk` and `run_front_desk_pretext` completed; globals include `episode_e12_visitor_tailgater_defend_done`, `..._defend_pass`, `pretext_merrin_front_desk_outcome`; `VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.`

Run 2 (game 5218): same two tasks completed (01:38:10Z and 01:39:09Z); globals include `delphine_wary`, `delphine_refusing`, `episode_e12_visitor_tailgater_defend_done`, `episode_e12_visitor_tailgater_defend_pass`; `VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.`

Run 3 (game 5221): room training_room only; NPC lorna_easton; task `work_reception_desk` completed; globals `episode_e12_visitor_tailgater_defend_defend_done`, `..._defend_defend_pass`; `VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.`

## Earned-secrets table

No keys, PINs or flags in this episode. The only "secrets" are the facts the player finds in research and uses on the call.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Badge door is buzzed by reception | used on prep card | Company site, Visit us | Run 1 research | yes |
| Partner Catherine Merrin is often out, parcels pile up | recipient blank "Catherine Merrin" | Friendface profile | Run 1 research | yes |
| Desk signs couriers in, frequent sample deliveries | used on prep card | Company site, Visit us | Run 1 research | yes |
| Recipient name (run 2) | none (found nothing) | n/a | n/a | not used; call had no name to give |

## Timeline (what I thought the goal was)

Run 1, full, careful.
- 01:24 Start in a training room. Objectives panel: "Run the front-desk pretext: Approach the front desk as the courier" and "Cover the reception desk". I thought: go to the front desk. There is no front desk in this room; the white stand on the right is the kiosk. The panel never says "use the kiosk" (see S1).
- Kiosk opens a six-step bar (Brief, Research, Write, The call, Defend, Debrief). Brief is clear: I'm on a red team with Jo, then I swap to reception, only reception is scored. Goal understood: get past the desk in a hi-vis, then defend the desk.
- Research: browser with the practice's site and "Friendface". I pinned the badge-door and delivery lines and Catherine Merrin's "sample boxes stacking up at reception" post. Goal: collect details for a story.
- Write: prep card with three facts and five pretext lines plus a Recipient blank with one option (Catherine Merrin). Goal: sound plausible using only found facts.
- The call with Delphine: seven lines on offer, an Influence meter with Wary, Refuses and Reports thresholds. Goal I assumed: get her to buzz me through. I never got the ask to land; the call ended early (see C1). Interstitial: "The door stayed shut ... exactly the move that beats this."
- Defend: seven callers in an inbox, verdict (Let in, Report, Turn away, Check first) then tick what I noticed, with feedback after each. Reloaded at 6 of 7 sorted.
- Debrief with "What happened", then Finish gives the new "Episode finished" panel and Close closes it. Both worked.

Run 2, rushed. Skipped all research (closed the browser with nothing), the prep card then showed only two pressure lines and "Recipient: nothing held yet". Called, asked to be buzzed through, was asked "who exactly is the parcel for?", had no name, pushed with hurry lines, got refused and wary, then "leave it at the desk". Let in all seven callers without ticking anything. Score 0%.

Run 3, defend-only. Lorna's line tells you the job in two sentences. Intro screen, queue, seven callers, 96%, debrief, Episode finished panel, Close. Made sense without seeing the full episode.

## "Didn't know what to do" moments

| # | Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- | --- |
| S1 | Start of run 1, find the kiosk | about 1 min (a real player maybe 1 to 2) | Objectives say "front desk"; looked for a desk; the nearby list showed a "Training kiosk" and Lorna | Walking to the stand; Lorna's welcome (only if you speak to her) says to try the front desk in the hi-vis |
| S2 | Call, run 1 | about 1 min | After a few lines the call ended with a pop-up "You rang off." I had not said goodbye. | Read the pop-up; it does not say why it ended (C1) |
| S3 | Call, run 2, "who exactly is the parcel for?" | seconds | No line gives a name (I had found nothing) | Pushing on; it is a fair dead end for a player who skipped research |
| S4 | Reload of run 1 | 5 min of harness stall (bootstrap looped on the title screen). Not a game finding. | `bootstrap` with resume | DOM click on the visible Resume button |
| S5 | Browser profile link | 1 min of harness (my `clickText` on "Catherine Merrin" did nothing; `clickControl` on the link worked) | | Not a game finding |

## Reload at a risky moment (run 1)

Reloaded at 6 of 7 callers sorted in the defend queue. Result: the stage list was kept (Brief to The call all done, reopened at "Take the calls"), the research and call outcome were kept, but **the round in progress restarted from the first caller**. I lost six answers (about 3 minutes of play, a real reader more like 5). The Brief screen of the queue says this plainly ("Closing or reloading before the end restarts this round from the first message"), so it was no surprise, but a mid-round reload is exactly when a person would be annoyed (F4). I replayed with the same answers and nothing else was lost; tasks were unaffected.

## Decisions

| Decision | Wording or colour gives it away? | Did the consequence show later? |
| --- | --- | --- |
| Which research lines to pin | Every line is a plain fact; nothing misleading. Not arguable, you can pin all. | Yes: the prep card lists exactly what I pinned. |
| Recipient blank (call) | Only one option offered (Catherine Merrin), so no decision. | Yes, Delphine reacts to it. |
| Which pretext line to say, in what order | Six lines plus "leave it at the desk" and "buzz me through"; arguable, order matters. The Influence meter explains each hit ("Urgency is the oldest line for skipping a check"). | Yes, immediately, in numbers. |
| Caller 1, tailgater | Card title states it: "A visitor, no badge, following a staff member in". Obvious. | Yes. |
| Caller 2, expected client | "ten o'clock with Yasmin", "happy to sign in". Obvious the other way. | Yes. |
| Caller 3, fire-safety inspector | The queue title puts "Fire-safety inspector" in quotes, and he says "I can let myself in, no need to trouble anyone". Given away by punctuation and wording. | Yes. |
| Caller 4, courier | Quotes round 'in the van', "Don't worry about signing me in". Given away. The one genuinely arguable choice (Turn away vs Report vs Check) is the one the scoring punishes most (F1). | Yes, harshly. |
| Caller 5, colleague back from leave | "You can check me on the staff list, I don't mind waiting" gives away Check first. | Yes, but mixed feedback (F6). |
| Caller 6, visitor at an unlocked desk | The card says the screen is open and they're "having a good look". Obvious. | Yes. |
| Caller 7, colleague locking the screen | "Back in five, just locking this". Obvious. | Yes. |

Across the board the "unsure, check or report is always fine" line in both briefs makes Check first the safe default, so only the confidence of the ticks is really tested.

## What I learned (own words)

A friendly hi-vis, a parcel, a partner's name and a hurry are all things anyone can say, and none of them prove the delivery was expected. If someone asks you to skip signing in, that is the cue to report or check, not to be polite. Follow the person in behind a badge-holder is tailgating. A visitor on their own near an open screen should be reported, and a locked screen is fine. Genuine visitors are happy to be signed in and walked up. I also learned from my own call that the hurry and "don't bother signing me in" lines make the receptionist wary fast.

Lab-sheet questions: none were available to me (blind), so I cannot say which ones play answered.

## Five best lines

1. "Cheers, I'm with them." (tailgater caller; short and exactly how it happens)
2. "I can see your hands are full. Even so, I'd rather sign you in." (Delphine, call)
3. "Right, a parcel for upstairs. Let me see who's expecting it." (Delphine)
4. IT Security: "Thanks, we locked it and had a quiet word; nobody's in trouble." (no-blame ending to the unlocked-desk caller)
5. "A parcel, a familiar name and a bit of hurry are all easy to supply, and none of them proves the delivery was expected." (debrief, ties your own pretext to what the callers used)

## Five worst lines

1. "Not this time. That visitor was not who they said, or not allowed where they were going." (shown for a genuine colleague as well, run 2 caller 5, where it then says "That visitor was genuine")
2. "That visitor was genuine. Letting someone in is fine ... The right call was Check first or Report." and 70/100 (caller 5, run 2: contradicts itself and "Report" for a real colleague is odd)
3. "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." (still on screen after the verdict was locked and scored)
4. "(No entry on today's list and the firm on his order isn't the one on the maintenance contract.)" (refers to a list and paperwork the player never saw)
5. "Safe, but nobody was told." beside "Missed: Someone followed an authorised person through a secure door ... A stranger is through the badge door and onto the studio floor." and a score of 43 (describes something that did not happen after you turned the courier away)

## Scores (1 to 5)

Fun 3. Pacing 3. Clarity of goals 3. Openness of decisions 2. Teaching 4.

Fun: the research and the call are the best part; the queue is a clean quiz after a while. Pacing: the red-team half is short, the seven-caller round with feedback after each is the long part. Goals: bar and Brief are clear; the first minute in the room and the end of the call are not. Openness: most callers carry their answer in their own title or lines. Teaching: the debrief is specific and mostly fair, and it echoes the player's own pretext.

## Times (a real person's reading pace, estimated)

| Run | Machine time | Real person estimate |
| --- | --- | --- |
| 1 full (careful) | 12 min wall, including a 5 min harness stall and replaying a round | about 16 to 18 min with reading, and about 4 min more if you reload mid-round |
| 2 full (rushed) | 2.5 min | about 8 to 10 min with the call and feedback skimmed |
| 3 defend-only | 0.8 min | about 7 to 8 min |

Target is about 15 min full and 8 min defend-only: on target.

## Findings

Tags: content or engine. Per the skill I do not classify as game bugs; "suspect" marks where I could not rule it out.

| # | Severity | Finding | Tag | Repro |
| --- | --- | --- | --- | --- |
| F1 | major | Turning the courier away scores 43/100 and the feedback lists "Missed" items and consequences that describe a visitor who was let through ("Buzzing the door without a badge is letting them tailgate", "A stranger is through the badge door and onto the studio floor"). It contradicts what the player did and reads as blame; the review then says "Risky visitors caught 4 of 4" and names "unescorted" as weakest skill. | content | run 1 caller 4, screenshot r1-19; run1.jsonl |
| F2 | major | "Check first" says "check the day's list or call the host", but the player is never shown a list or any paperwork, and feedback cites them ("a quick glance at the list confirms it", "No entry on today's list and the firm on his order isn't the one on the maintenance contract"). Facts the player cannot see are used to mark answers. | content | callers 2, 3, 4 in all runs |
| F3 | major | The reload loses the whole round in progress (six of seven sorted). Disclosed on the queue's Brief, but it is the biggest cost of any reload in the episode. Stages before it were kept. Keep as major unless the owner accepts it. | engine | run 1, `r1-21`, `r1-22` |
| F4 | minor | After Confirm with no ticks, the verdict locks and is scored, but "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." stays on screen with Next visitor offered. Rushed players read this as an error. | engine or content | run 2 caller 1, `r2-05` |
| F5 | minor | Call ends with a "You rang off." pop-up without saying why. In run 1 the call stopped after the receptionist said "Give me a moment and I'll do it the right way" (influence -25, no threshold reached), before I had made the actual ask. In run 2 it ended on "leave it at the desk". The red-team ask was never possible to land in either run, and the outcome in both was "The door stayed shut". I cannot tell if it is winnable. | content (suspect engine) | run1.jsonl seq near 01:27, `r1-11` |
| F6 | minor | Caller 5 (genuine colleague back from leave) feedback contradicts itself when you Let them in: "That visitor was genuine. Letting someone in is fine ... The right call was Check first or Report." and 70/100. Report as right call for a real colleague is confusing. | content | run 2 caller 5 |
| F7 | minor | Queue titles put the lie in quotes ('Fire-safety inspector', badge 'in the van') and the callers say the tell outright ("I can let myself in", "Don't worry about signing me in"). Decisions are given away. The defend-only intro also says "the one who pushes to skip a check is the one to report". | content | all runs |
| F8 | minor | Round score is 0% for a rushed player who got one caller right, with 15 points off per bad let-in. A new player sees "0%" as a verdict on them. Wording ("Worth practising", "Not this time") is kind; the number is not. | content | run 2 `r2-06` |
| F9 | minor | `defend_pass` is recorded (verify-run) after a 0% round in run 2. Cannot tell if that is meant to mean "finished". Suspect engine or just naming. | engine (suspect) | game 5218 verify-run globals |
| F10 | minor | Delphine's portrait shows her in a red hi-vis vest in run 2 (call went Wary and Refusing) and in a white blouse in run 1 (calm). Looks like a different outfit between states. | engine or art | `r1-09` vs `r2-02` |
| F11 | minor | Call's recipient blank has a single option, so it is not a choice. | content | `r1-08` |
| F12 | minor | "Weakest skill" advice is generic phone advice ("If a caller, prompt or voicemail pushes you ...") under a door-and-visitor skill; "Reported rather than just turned away: 2 of 4, and 1 more checked by another route" is hard to parse. | content | run 1 `r1-24` |
| F13 | minor | Objectives panel names "the front desk" but the thing to use is the kiosk; only Lorna's welcome (optional) says to try the desk after the kiosk. First-minute confusion (S1). | content | run 1 start, `r1-00` |
| F14 | nit | Run 1 call: "she's expecting it today" is a line the player says, then Delphine says Catherine is away this week. Intended tell, but the prep card does not hint the contradiction. | content | `r1-09` |
| F15 | nit | Defend-only Brief repeats "Checking or reporting when you're unsure is always fine and never marked down" twice; "Take the calls" heading for a visitor queue. | content | `r3-01` |
| F16 | nit | Caller 7 and caller 5 feedback say "That visitor was genuine" for colleagues. | content | run 1 caller 7 |

Counts: 0 blockers, 3 majors, 10 minors, 3 nits.

Not findings (as instructed): the Mission Brief popup on reload and the "Resume session?" overlay. The Finish to "Episode finished" panel and the bar's Close closing it worked in all three runs.

## Harness notes (not game findings)

- `converse` with a pattern that stays on screen repeats the same line (it picked the same pretext four times in run 1). Use `mg chooseIndex` or the key form for single picks. This also slightly tainted run 1's call: it logged four "open parcel" lines before my deliberate picks.
- `mg clickText` on a profile name did nothing; `clickControl` on the control worked.
- `bootstrap` with `resume:"resume"` looped on the title screen for 5 min under load (load average 32); the DOM Resume click worked, as the skill says.
- Session tag for a URL with `?skip_resume=1` is `1`, not the game id; I stopped it straight away.

All three of my sessions were stopped (`session-stop.sh`); no playtest-session processes of mine remain.
