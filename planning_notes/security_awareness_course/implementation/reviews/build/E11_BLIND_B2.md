# E11 Misdirected Data: blind playtest B2

Second blind round. Fresh tester, keyless server on :3001, headless browser (no display, shared machine), three fresh games: full as "Do your best" (game 5204), full as "Struggling player" (5214), defend-only as "Do your best" (5216). Screenshots: scratchpad `aw2/blind-e11-b2/`. Tester read only the playtest skill, AGENTS.md Housekeeping and what is on screen.

Harness notes (not game findings): radio buttons and checkboxes cannot be driven by `mg clickText`, so I clicked the visible label with a DOM click. `clickText "Confirm"` hit a message titled "Confirm your bank..." sitting behind the modal; I used an exact DOM click on the Confirm button instead. `bootstrap` with `resume:"resume"` hung after the reload (the known overlay loop), so I stopped the session and opened the same game URL in a new browser, which is what a returning player does.

## Run 1: full episode, "Do your best"

Timeline and what I thought the goal was:

1. Opened in the training room with the task "sort_desk_inbox" (I did not understand "sort" yet). Walked to the training kiosk, the only obvious interactive thing. Goal: do whatever the kiosk says.
2. Brief: "authorised exercise at Carrholme Services, a fictional firm... you are covering the Care Laundry desk... first some ordinary choices, then where each led, then the inbox. Only the inbox is scored." Clear. Goal: get through four choices, then a scored inbox.
3. Four everyday choices (Carol's birthday call, the overtime sheet and two Sams, Martin's marketing export, the incident report for Mr Hale). Picked the cautious option each time. Goal: choose what I would really do.
4. "Six months later": each choice's outcome, labelled "Your call: the safe route". Goal: read, continue.
5. Defend: inbox of six items. Goal: for each, Trust, Report, Delete or Verify, then tick what I noticed.
6. Verdicts: Sam 08:52 (misdirected spreadsheet) Report, breach ticked; Payroll 09:35 Report, look-alike domain and hurry ticked; Gareth Hale 10:04 Report, data-request ticked; DC Rowley call Ring back, "senior invoked" ticked (the "caller discourages calling back" box was offered and I did tick it in the second pass, see below); Kestrel Court 10:48 Report, attachment and data ticked; Sam 11:15 (new mobile, cardigan found) Verify, data-request ticked.
7. Reload at 5 of 6 sorted (the risky moment). Came back to the training room at the start position, kiosk still available, stage progress kept (Brief, Choices, Where it led and Defend intro all marked done) but the inbox restarted at 0 of 6, as the inbox intro warns ("Closing or reloading before the end restarts this round"). I redid the six items. Lost progress: yes, the five verdicts (about 3 minutes of real reading); the earlier stages were not lost.
8. Result: 100 percent, "Sharp". Per-skill list. Finish, then Debrief, then Finish, then "Episode finished" panel, then Close, then a "Misdirected data: finished" screen with Return to missions / Close. All as intended.

Stuck moments:

- Start of the room, about 20 seconds: task "sort_desk_inbox" gave no hint where to go. The kiosk was the only candidate and its name explains itself. Minor.
- After my first verdict, about 10 seconds: the inbox intro says "You'll get feedback after each message", but after a verdict you only get "Verdict locked: Report." and a Next message button. All feedback arrives at the end. Unstuck by clicking on. Wording mismatch (content).
- After the reload, about 15 seconds: no sign that the inbox would restart until I opened it. The warning was on the intro screen only, and I had already read past it. A real player resuming would reasonably expect to land mid-inbox.
- Item 4 (DC Rowley call), about 10 seconds: "Next message" skipped the call and went from Payroll to Gareth Hale, leaving the call unread. I came back to it by clicking. Could be intended (Next goes to the next unsorted in some order) but a player may miss that the call is still waiting.

Decisions and whether they were given away:

- Carol's call, overtime sheet, marketing export, incident report: each pair is "do the careful thing" against "do the quick, wrong thing" and the wrong one is written to sound plainly worse ("Tell her... as it is a surprise", "to save time", "since he is the Sales Director", "as it is"). The options also name the reason for the wrong one, which makes the answer obvious to anyone who reads. Obvious, not arguable. Nothing is scored there, so it works as a warm-up, but nobody would pick the wrong one unless rushing.
- Colour: the two options look the same, no colour tell.
- Inbox: Sam 08:52 is arguable (he asks "do you want me to delete it?" and the first instinct is yes, delete). Payroll is a clear phish (domain differs, threat to pay). Gareth Hale's angry email is a good one: nothing says "subject access", and "EVERYTHING you hold on Mum and on me" is the cue. Rowley: withheld number and "no time" are the cues, the Ring back button is next to Comply with a plain description. Kestrel Court: a real sender, wrong attachment, one tick away from "Nothing looks wrong". Sam 11:15 is the subtle one: Trust is scored right and Verify is accepted as "just as right".
- Consequences showed later: yes. "Where it led" links the four choices to results; the inbox debrief names each item's real issue.

What I learned (own words):

- A misdirected spreadsheet counts as a data breach, and I tell the data protection lead the same day, even if the other person offers to delete it.
- A request to see or correct data does not have to say "subject access", and an angry complaint can hide one.
- A caller who won't let me ring back and leans on police authority is the cue to hang up and ring a number I already hold.
- A real supplier can still send data I should not hold; report it, do not open or forward it.
- Look-alike domains and "do it today or lose your pay" are the payroll tell.

Lab-sheet questions answered: not applicable for this product (no lab sheet seen).

Best lines:

1. "Behind every row is a person" (debrief heading).
2. "Reporting fast is what limits the harm."
3. "A caller cannot prove who they are by phone." (debrief, on Rowley)
4. "These messages are built to fool careful people, so a miss here says more about the attack than about you."
5. "Both halves matter: passing on the data issues and the fakes protects people, and handling the routine ones yourself leaves the DPO time for what needs them."

Worst lines:

1. "You'll get feedback after each message." (inbox intro; there is none until the end)
2. "Items you reported, checked or deleted: 5 of 5" with 6 messages on screen (the sixth is the genuine one; the count is correct but reads like an arithmetic error)
3. "Reported rather than just deleted: 4 of 5, and 1 more checked by another route" (same confusion, hard to parse)
4. "You read every one of these the right way. Nothing to pick over here." next to a debrief that still prints the full "The habit to keep" block, so it is not nothing.
5. Option wording such as "Tell her it is Ashgrove Primary... as it is a surprise" and "to save time": the justification gives the answer away.

Scores (1-5): fun 3, pacing 3, clarity of goals 4, openness of decisions 3, teaching 4.

Time, at a real reading pace: about 14 minutes without the reload, about 18 with the reload and the redone inbox. On target for the full episode; the reload penalty is what pushes it over.

## Run 2: full episode, "Struggling player"

Took the first-looking quick option everywhere: all four wrong everyday choices; then Trust on Sam 08:52, Comply on Rowley, Trust on Payroll, Gareth, Kestrel and Sam 11:15, ticked nothing.

- "Where it led" showed each bad outcome plainly and vividly: "a stranger was waiting for Bernadette outside her school", the overtime sheet "sat in a care home manager's inbox for three days", three families complained and one wrote to the regulator, Mr Hale "read another resident's continence-care note and a driver's mobile number". It is direct, but there is no blame wording ("Your call" only), and it says what the choice was ("Your call", without "safe route").
- Confirm with no ticks was accepted. No nudge to tick anything before confirming.
- Result screen: 0 percent, "Worth practising: here's where to look first". It explains "5 answers let a data issue go unseen ... That costs 15 points off the round each, on top of the item itself." The 15-point penalty stacks to a clamped 0 and the screen does not say it was clamped. A struggling player who got one real call right (the Sam 11:15 Trust) still sees 0.
- Debrief: per item, "You chose X", what was really happening, "Look for" with the specific clue (carrholme-payroll.example, "Police, and it's urgent"), what could have happened, "Score for this message: 0 of 100". Fair and specific, and the closing line is blame-free ("a miss here says more about the attack than about you").
- Things that didn't land for a rushed player: the debrief never refers back to the four everyday choices they got wrong, so the link between "I sent the report as it was" and the inbox lesson is left to the player. The "Right call. You trusted this real one" line on the last item reads as the only credit in a wall of 0s, which feels both fair and slightly odd.
- Debrief was long. A skimmer would get the "The reason most often missed: Spotting a data breach (caught 0 of 2)" line and little more.

Scores (1-5): fun 2, pacing 4, clarity of goals 4, openness of decisions 2 (nothing nudged me to stop and think), teaching 4.

Time: about 6 minutes at a rushed pace.

## Run 3: defend-only, "Do your best"

- Brief says "authorised exercise... covering the Care Laundry desk... Items are waiting in the inbox: some routine, some for someone else to handle, one or two made to trick you." Makes sense to someone who skipped the full episode. Three stages (Brief, Defend, Debrief) rather than five.
- Defend text introduces the DPO ("the data protection officer, who handles personal data mistakes"), good for a cold start. The inbox intro defines Trust, Report, Delete and Verify and the call verdicts (Comply, Escalate, Refuse, Ring back).
- Same inbox, same scores, same debrief (100 percent). It works standalone. One gap: the "Where it led" outcomes are not there, so the debrief's lines about "Behind every row is a person" land with less weight, but nothing in the debrief refers to the missing stage.
- Ended with the "Episode finished" panel, then Close, then the "Desk inbox done" success screen. As intended.

Scores (1-5): fun 3, pacing 4, clarity of goals 4, openness of decisions 3, teaching 4.

Time: about 8 minutes at a real pace.

## Severity table

| # | Severity | Tag | Finding |
| - | -------- | --- | ------- |
| 1 | minor | content | Inbox intro says "You'll get feedback after each message" but feedback only comes at the end. Either remove the line or show one line after each verdict. |
| 2 | minor | engine | Reload mid-inbox restarts the round (documented on the intro screen, but the warning is only there). Consider repeating the warning on the Sort screen, or keeping per-item verdicts across a reload. |
| 3 | minor | content | The Choices options give the reason for the wrong answer ("to save time", "since he is the Sales Director", "as it is"), so the answer is given away by wording. Nothing is scored there, but it reads as a quiz with one plain answer. |
| 4 | minor | content | Score counts read oddly: "5 of 5" and "4 of 5, and 1 more checked" with six messages on screen. Say "of the 5 that needed passing on" or include the genuine one. |
| 5 | minor | content | Struggling-player debrief never refers back to the four everyday choices the player got wrong, though the "Where it led" screen was memorable. A one-line bridge per mistaken choice would connect them. |
| 6 | minor | engine | "Next message" skipped the DC Rowley call and left it unread; the call can be missed unless the player clicks it. |
| 7 | minor | engine | Confirm with no ticks is accepted; the struggling player was told afterwards "Next time, tick what you noticed" but was not prompted at the time. |
| 8 | nit | engine | The 15-point penalties clamp the score at 0 and the screen does not say so; "0 percent" next to one right answer feels harsh. |
| 9 | nit | content | "Nothing to pick over here" on a 100 percent debrief that still prints the full habit block. |
| 10 | nit | content | Task name "sort_desk_inbox" / objective gives no hint to go to the kiosk at the start; the room is small, so the kiosk is found quickly. |
| 11 | nit | engine | The success screen's text ("The debrief goes through each one") appears after the debrief, so it reads slightly out of order. |

Counts: blocker 0, major 0, minor 7, nit 4.

No blockers or majors. The Episode finished panel appeared after Finish on the debrief in all three runs and Close closed it, as intended.

## Processes

All three session processes (games 5204, 5214, 5216) were stopped with `session-stop.sh`. Four other `playtest-session.js` processes remain on games 5205, 5212, 5213 and 5215. They belong to other agents and were left alone.
