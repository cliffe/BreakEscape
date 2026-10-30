# E12 Visitor and tailgater: blind playtest B3

Third blind round. Question answered: unexpected behaviour for a first-time player (blind), plus the reload check. Not a plumbing or solvability run. Headless (machine load about 10), speed `fast`, keyless server :3001.

Evidence (scratchpad `aw2/blind-e12-b3/`):

| Run | Game | Session log | Wall clock in harness | Screenshots |
| --- | --- | --- | --- | --- |
| Persona 1, full, "do your best" | 109 | `p1.jsonl` (386 lines) | 427 s | `p1-01` to `p1-15` |
| Persona 2, full, "struggling" | 113 | `p2.jsonl` (352 lines) | 248 s | `p2-01` to `p2-05` |
| Defend-only, persona 1 | 117 | `p3.jsonl` (202 lines) | 137 s | `p3-01`, `p3-02` |

verify-run.rb (key lines; all three exit with "progress recorded"):

- Game 109: unlocked rooms training_room, lobby; NPCs met lorna_easton, delphine_reception; tasks_completed 2 (run_front_desk_pretext, work_reception_desk); score 100. VERDICT: progress recorded, 1 room beyond the first, 2 tasks completed.
- Game 113: same rooms and NPCs; tasks_completed 2; score 100. VERDICT: progress recorded.
- Game 117 (defend-only, mission 131): training_room only; lorna_easton; tasks_completed 1; score 100. VERDICT: progress recorded, 1 task completed.

## Assumptions

- Assumption: the harness `mg continue` (sends Space to the open minigame) counts as "the keyboard" for the Continue? card, because the harness `pressKey` is refused while a minigame is open.
- Assumption: persona 2 tried "Turn away" on the genuine client and on the colleague to show both failure directions, not only "Let them in".
- Assumption: estimated times are at a reading pace, not the harness wall clock.

## Reload (persona 1), the specific check

I reloaded after sorting **five** of seven (I overshot the "three or four" by one, since I only counted after the fifth).

What I saw, in order:

1. The "Resume session?" overlay (ignored per brief). I clicked Resume with `dismiss`.
2. The "Continue?" title card ("Awareness E12: Visitor and tailgater (full episode)", "Click, or press Space or Enter"). The harness `pressKey Enter` was refused (`minigame-active`, harness limit, not a game fault). I then sent Space through `mg continue`. **That worked on the first try; no click was needed.** It is a harness-sent key, not a physical keypress, so a real keyboard is unproven but the card advanced.
3. The Mission Brief popup (not reported). I cleared it with `bootstrap`.
4. I was back in the training room at the spawn point (192,198), not beside the kiosk where I had been standing. Normal, but I had to walk back.
5. Kiosk: it opened straight on "Take the calls" with stages 1 to 4 ticked, not on the brief. "Open the queue" showed **5 of 7 sorted** with every earlier answer still there: Unknown visitor "Reported", Expected client "Let in", Visitor with a clipboard "Reported", Courier "Checked", Colleague back from leave "Checked". It selected the next unread message (the 16:10 visitor at the unlocked desk) by itself.
6. I lost nothing of the answers. I did not have to redo the call stage. The final Review screen still held the per-visitor feedback for the five answered before the reload.

One oddity: the counter read "Visitors reported for the team: 3", but only two messages are labelled "Reported" before the third (the 16:10 one) was sorted. The third "reported" may be counting the "Checked" courier. See finding F4.

## Persona 1 timeline (careful, non-technical)

| Point | What I thought the goal was |
| --- | --- |
| Kiosk, Brief | "Learn what the exercise is." The brief says: red team with Jo for the call, then swap to reception. Clear. |
| Research | "Read the browser, click lines to keep notes." I added the two company lines and Catherine's post. |
| Make the call | "Fill in a pretext card and ring the desk." The card was built only from lines I had noted, with a single recipient choice (Catherine Merrin). |
| Call | "Get Delphine to buzz me through." Tried six lines. The influence meter fell from 0 to -60 and each line showed a short reason ("Urgency", "Dodging the check"). I gave up and chose "I'll leave it at the desk". |
| Call debrief | Read "She took the parcel at the desk and rang facilities rather than buzzing you through, which is exactly the move that beats this." Understood the point: the exercise is to see the defence work. |
| Queue, visitors 1 to 5 | "Decide for each, then tick what I noticed." |
| Reload at 5/7 | Described above. |
| Visitors 6 and 7, result, debrief | Result 95 percent, "Sharp". Debrief listed each visitor with Spotted / Look for. |
| End | "Episode finished" panel, Close closed it; a "Visitor and tailgater: finished" panel with Return to missions and Close appeared. Intended. |

## Persona 2 timeline (rushed, trusts what looks official)

- Opened the browser and closed it at once with no notes, then clicked Prepare the call. The panel said "You haven't found anything to use yet", "Go back to the research first. You need a name at the studio to ask for." and offered only Close.
- Went back, found Catherine Merrin, clicked her post, and the card now offered a recipient. Approached.
- On the call I used the quickest lines: buzz me through, no need to sign me in, sample box for Catherine, double-parked. Delphine kept asking "who is it for" even after I named Catherine (see F3). I left at "I'll leave it at the desk".
- Queue: "Let them in" for the gate visitor, hi-vis inspector, courier and the signed-in visitor at the desk; "Turn away" for the expected client and the colleague who locked the screen; "Let them in" for the colleague without a badge. Ticked "Nothing looks wrong" every time.
- Result: 0 percent, "Worth practising: here's where to look first". Four answers marked as letting an attacker straight in (15 points each off the round); two genuine visitors turned away (70 each); one genuine let in (100).
- Debrief: lists every visitor with "Look for" bullets and a "What could have happened" line, then the weakest skill. Fair, plain, no blame wording. Details in the scoring findings below.

## "Didn't know what to do" moments

| Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- |
| P2, Prepare the call with no research notes | about 1 minute (3 clicks) | Close, then Back to research (which did nothing while the panel was open); the panel's only control was Close | Closing the panel with Close, then Back to research, then clicking a line on Catherine's profile (not just opening the page) |
| P2, "Add to notes" label on research pages | seconds | The pages show a faint "Add to notes" under each line; I first opened the Friendface profile and closed without clicking a line | The instruction "Click a line that looks useful" on the first screen |
| P1, call stage | about 1 minute | Tried the six options in a different order, expecting one to work | Seeing "ASK REFUSED needs -10 or better" in the meter text, then leaving |
| P1, after reload | about 20 s | Waited on the Resume overlay and Continue? card | Resume, then Space |
| P1 and P2, "who it's for" loop | seconds | Delphine asked "who is it for" twice after I named Catherine | Moved on (F3) |

No blocker-level stuck moment.

## Real decisions

| Decision | Arguable or obvious? | Given away by wording or colour? |
| --- | --- | --- |
| Pretext lines on the call | Arguable at first. Every line cost influence | The meter colours and "Last change" text show the cost straight after each line, so you learn by the second line. Not given away beforehand. |
| Visitor 1 (gate, no badge, "slips in behind a badge-holder... heads for the stairs") | Fairly obvious: the stage direction says he tailgated | The parenthetical stage direction gives it away. Also the only option that makes sense after he is already in is Report. |
| Visitor 2 (expected client) | Obvious: "Today's list: Expected" shown | Given away by the list line. A quick pass. |
| Visitor 3 (hi-vis, comms room) | Obvious | The list line names a different firm than the paperwork, which is the tell, shown in full. |
| Visitor 4 (courier) | Arguable | "No parcels booked, no courier expected" is shown but the best answer is not obvious (Report vs Check first). Check first scored 73 or 100 depending on flags ticked. |
| Visitor 5 (colleague, no badge, "check me on the staff list") | Arguable | The line "You can check me on the staff list, I don't mind waiting" nudges to Check first. |
| Visitor 6 (visitor at an empty unlocked desk) | Obvious | Stage direction "the screen's open and they're having a good look". |
| Visitor 7 (colleague who locks) | Obvious as safe | "Back in five, just locking this." |

The set is more "spot the stage direction" than weighing: five of seven decisions are settled by a parenthetical or a list line. The courier and the badge-less colleague are the two real judgement calls.

## What I learned (own words)

A badge-less person at the door gets signed in and walked up, not buzzed through. Hi-vis, a clipboard and a partner's name on a box prove nothing. If someone asks you to skip the sign-in or say they will "let themselves in", that request is itself the warning. Look at today's list, and if it doesn't match, check or report, which costs nothing. A locked screen is the good habit, an open one is a risk. Reporting is better than turning someone away because it warns the building.

## Five best lines

1. "A genuine courier is happy to sign in and be walked up; trying to skip that is the tell." (call coaching)
2. "Being in a hurry is the oldest line for skipping a check." (call coaching)
3. "IT Security: Thanks, we locked it and had a quiet word; nobody's in trouble." (no blame)
4. "Checking or reporting when you're unsure is always fine and never marked down." (brief)
5. "A glance at the day's list and walking the visitor to the desk instead of buzzing the door blind" (call debrief, the main habit in one line)

## Five worst lines

1. Delphine's "I still need to know who it's for" / "who exactly is the parcel for?" after the caller has already named Catherine (F3).
2. "That's grand, I'll take it here and let them know." after "I'll leave it at the desk" works as a closing line but reads oddly next to the "Refuses" meter, as if she had been persuaded (F6).
3. "Turning them away without a way to check left them stuck" on a *colleague who has just locked their screen* (F5): nobody was turned away from anything.
4. "That visitor was not who they said, or not allowed where they were going" for the tailgater, who said nothing at all (F7).
5. "The debrief goes through each one." on the finished panel, after the debrief has already been read (F9).

## Scores (1 to 5)

| | P1 | P2 |
| --- | --- | --- |
| Fun | 3 | 3 |
| Pacing | 4 | 4 |
| Clarity of goals | 4 | 3 |
| Openness of decisions | 3 | 3 |
| Teaching | 4 | 4 |

## Times at a real reading pace (estimates)

- Persona 1 full: about 14 minutes (brief 1, research 2, prepare and call 3, queue 6, debrief and end 2).
- Persona 2 full: about 8 minutes (skipped reading; the call and the debrief were the bulk).
- Defend-only, persona 1: about 7 minutes.

Target was about 15 and 8, so the full run is on target and defend-only is just under.

## Defend-only run (persona 1)

A person who never saw the full episode gets a brief that says exactly what the exercise is ("authorised exercise... fictional architecture practice... you're covering the reception desk") and a queue brief that defines all four buttons. It makes sense on its own. Score 95 percent, same as the full run. The debrief opens with "These visitors were played by people whose job is to look like they belong... Any you were caught out by are shown below" even though I caught all four risky ones and the page lists only the hi-vis and the courier (F8). It also adds a "What these visitors relied on" summary (a parcel, a familiar name, a bit of hurry) which is a neat recap for someone who skipped the call.

## Findings

| # | Severity | Finding | Tag | Repro |
| --- | --- | --- | --- | --- |
| F1 | minor | Prepare the call with no research notes: the panel offers only Close, and "Back to research" (shown behind it) does nothing while the panel is open. First reading is "I'm stuck". The text does say to go back to research. | engine | Game 113, `p2.jsonl` first Prepare the call; `p2-01-noresearch.png` |
| F2 | minor | The harness `pressKey` is refused on the Continue? card (`minigame-active`). Space through `mg continue` works. A real keyboard is unproven here. | engine (harness) | Game 109, reload |
| F3 | minor | On the call Delphine keeps asking "who is it for" after the caller named Catherine, and says "who exactly is the parcel for?" as an opener on a different route. The wary lines are not tied to what was said. | content | Games 109, 113; `p1-04-call.png` |
| F4 | minor | "Visitors reported for the team: 3" after reload showed only two items marked "Reported" before the sixth was sorted; likely counts "Checked" or the count includes the unsorted one. | engine | Game 109 after reload, `p1-11-queue-after-reload.png` |
| F5 | minor | Wrong-answer wording for the colleague who locks the screen: "That visitor was genuine. Turning them away without a way to check left them stuck." Nobody checked or got stuck. Also "visitor" is used for a colleague. | content | Game 113, visitor 7 |
| F6 | nit | After the call is lost the closing line "That's grand, I'll take it here" reads as persuasion, while the meter says Refuses. | content | Games 109, 113 |
| F7 | minor | Gate visitor, wrong answer "Let them in": "not who they said", but the visitor never claimed anything and has already slipped in, so "Let them in" cannot happen. The right-call lines (Report) fit; the wrong-call one doesn't. | content | Game 113, visitor 1 |
| F8 | nit | Defend-only debrief says "Any you were caught out by are shown below" while listing the visitors caught correctly with "Spotted" ticks. Reads as if I was caught. | content | Game 117, `p3-02-debrief.png` |
| F9 | nit | "The debrief goes through each one." on the "finished" end panel after the debrief has been read. | content | Game 109, `p1-15-afterclose.png` |
| F10 | minor | Scoring: Check first on the courier gives 73 (only two flags ticked) while Report would score higher, yet the visible text says Check first is "Right call". A careful player reads "right" then sees 73 with no reason why it is below 100 except unticked flags. The result page also lists "Borrowed authority: caught 0 of 1" as the weakest skill, from an item where the call was right. | content | Game 117, `p3-02-debrief.png` |
| F11 | minor | Colleague back from leave: "Let them in" scores 100 with the note "The safe answer is a temporary pass", i.e. rewards entry with no check at all as much as Check first. A rushed player learns nothing here. | content | Game 113 |
| F12 | nit | After a reload the player is back at the spawn point, not at the kiosk. | engine | Game 109 |
| F13 | nit | The result card for a 0 percent round says "The round score stops at 0%, so the points taken off do not show below it." Accurate but a lot of arithmetic for a training kiosk. | content | Game 113, `p2-04-result.png` |

Counts: 0 blockers, 0 majors, 8 minors, 5 nits.

Not reported per the brief: the Mission Brief popup after reload, and the "Resume session?" overlay.

Harness limits worth knowing: the harness text read truncates the long debrief; I read the rest from screenshots. The three play sessions were stopped and `ps` shows no playtest-session processes left.
