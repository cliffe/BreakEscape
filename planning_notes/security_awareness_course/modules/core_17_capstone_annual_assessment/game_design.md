# core_17 game design: Year End

## Concept

It's Thursday, the last working day before Larkspur's year-end close, and the office shuts for a four-day weekend at five. The player is no longer new: they have a year behind them, a task list that runs across the building, and Ellie, a nervous first-week apprentice, shadowing them all day. Finish the year-end report for Calderbrook Borough Council, Larkspur's biggest client (core_06's bid was for its contract). Cover reception while Maureen takes her break. Approve the cost centre's invoices before Finance's 14:00 cut-off. Hand over to Leo, who's covering next week. Clear the desk and go home.

Into that day the edition drops twelve moments after the Hook, unannounced, eleven of them threats and one a genuine request, each from a different part of the year's training, and links them: a sign-in prompt approved at 08:58 can turn into a bank detail change "from you" at 13:40; a man let in with crates of party supplies can mean an empty laptop dock at 16:35. Every chain can be broken at any point by reporting, and the debrief shows where the player broke it. Some of the day's visitors and callers turn out to be Jo Fairweather's authorised annual test, revealed over a cup of tea at the end.

The lunchtime story: "Ellie asked me why I wouldn't let the party delivery man in, and I heard myself giving Maureen's speech." The capstone tests whether a year's habits hold under pressure, and turns the player into the person a new starter learns from.

## Setting and cast

- **Rooms:** the player's desk on the Operations floor (`room_office`); reception (`room_reception`); the meeting room with its wall screen for Ama's huddle and Kai's warm-up (`room_meeting`); the kitchen, half decorated for the year-end party (`room_break`); the security office for the debrief (`room_security`); the car park at the very end (the new car park room planned for core_10 and core_13, or the reception door until it exists).
- **The recurring cast:** Ama (the huddle and the debrief), Kai (the warm-up and the live report board), Maureen (hands over reception), Martin (signs off the council report), Leo (takes the handover), Hassan (rings from the auditors about invoices), Tomasz (the visitor's request; a misdirected email), Owain (IT, delegated access), Precious (the desk sweep at five), Kev (loses his badge), Jo Fairweather (the reveal), Lena (by chat), Gillian (her voice is faked in a voice note; her real end-of-year message is on screen).
- **New characters:**
  - **Ellie Nguyen**, 19, British Vietnamese, a business administration apprentice in her first week, lanyard on, notebook out, asks about everything. She shadows the player all day. She needs art (PixelLab pipeline) and can return in later editions as she grows in the job.
  - **Peter Lindqvist**, 70s, white, Swedish-born, walks with a stick; his wife lives in one of the care homes Larkspur services. A genuine visitor with a genuine request. Generic elderly sprite and his own voice.
  - **Ade**, 30s, Black British, Jo's colleague at Northlight Security, the "party supplies" delivery man in a hi-vis vest. Generic sprite; named only in the reveal.
- **Voices without bodies:** the "kiosk company" caller (Jo, using a different voice, which the reveal admits), and the voice note in Gillian's cloned voice.

## Structure

The critical path is marked **(CP)**. Every threat moment is on the critical path, because it arrives inside a task the player must finish; how they handle it is up to them.

### 0. Before the day

- **(CP)** The title screen (BE-20): the organisation's logo, "Year End 2027", "About 35 minutes. You can stop at lunch and come back." **Start**, **Settings**, **Use the text version**.

### 1. Hook: "Approve sign-in?" (1 minute)

- **(CP)** 08:58 at the desk. The laptop's work desktop (MG-27) is still starting up when the phone lights up (MG-07): *"Larkspur sign-in request. Is this you trying to sign in? Location: Leeds."* with **Yes, approve**, **No, it's not me** and a small **Report** link.
- The player can approve it, deny it, deny and report it, or leave it. Whatever they do is this year's **baseline** (C17-B1), compared with the counterpart at 15:40 and with last year's hook.
- No one comments yet. If they approved, nothing visible happens until the afternoon (chain A). If they reported it, Kai messages at 09:05: *"Thanks. Someone had your password from an old breach, so I've reset it. Pick a new one from the link on The Lark."* (on screen).

### 2. Learn: Ama's year-end huddle (3 minutes)

- **(CP)** 09:00 in the meeting room, standing room only, a tin of biscuits going round. Ama (EX-01), with three visual aids (BE-08):
  1. *"Three things changed this year."* The edition's headline changes from `concepts.md`, one aid each: *"Scams switch channels. A text, then a call, then an email."* / *"A voice isn't proof. Call back on the number you know."* / *"Your login is the prize. A prompt, a code, a password: same request."*
  2. *"Our year, in numbers."* The organisation's own figures on the wall screen (on screen only, optional: reports this year, median time to first report). Ama's line is fixed: *"That's you lot. Thank you."*
  3. *"Today's a busy one. Busy days are when it matters. Pause. Check. Report."*
- If the player reported the 08:58 prompt, Ama adds: *"And someone reported a sign-in they didn't start, at two minutes to nine. That's the job."* Otherwise: *"Kai's seen a few odd sign-in prompts this morning. If you had one, tell him."* (A second chance; reporting now counts as Developing for C17-B1 and still breaks chain A.)

### 3. Practise: Kai's warm-up (2 minutes)

- **(CP)** Kai on the wall screen: *"Two minutes, five questions, then you can have your coffee."* MG-20 in drill presentation (BE-07 items), instant feedback after each:
  - two items from the learner's weakest areas in last year's profile (or, in their first year, from the induction modules);
  - three items on this year's headline changes.
- Optional for organisations running the team event, where the facilitator does it with the room.

### 4. Apply: the day (20 minutes)

- **(CP)** Lena's chat (on screen): *"Last day before the close! Ellie's shadowing you today. Your list's on the board."* The task bar (BE-18) has five steps: **Finish the council report**, **Cover reception (11:00)**, **Approve your invoices by 14:00**, **Hand over to Leo**, **Clear your desk and go**. Game time runs from 09:15 to 17:00 over about twenty real minutes; threats never arrive two at once (BE-18's busy gate), and none needs fast reactions.
- Ellie arrives at the desk: *"Hi! Lena said I'm with you today. Sorry in advance for all the questions."*

#### The moments (Edition 2027): the Hook and twelve more

| Slot | Time and task | What arrives | Best response | Re-tests |
|---|---|---|---|---|
| H | 08:58, the desk | A sign-in approval you didn't start (the Hook) | Deny and report | C03-LO5 |
| T1 | 09:40, the council report | Email from "HR": *"Unused annual leave is lost at midnight tonight. Confirm your carry-over"*, with a sign-in link | Report it; check leave in the HR system yourself | C01-LO3, C01-LO5 |
| T2 | 10:10, the council report | Ellie: *"The complaint log's massive. Shall I paste it into ChatHelper? I use it for college."* (a fictional free public chatbot; check the name isn't a real product before build) | Use the approved assistant without names, or summarise it yourselves; explain why | C15-LO1, C15-LO2, C16-LO2 |
| T3 | 11:05, reception | A man in hi-vis with crates: *"Party supplies for upstairs. Hands full. Badge me through?"* Ellie reaches for her badge | Ask who it's for, ring them down or sign him in; stop Ellie kindly | C10-LO1, C10-LO2 |
| T4 | 11:10, reception | A call from "the visitor kiosk company": a year-end software update for the visitor sign-in kiosk, and could they connect to the reception PC; *"a USB's coming by courier too"* | Decline; ring Owain on the number you know; report | C02-LO3, C02-LO4 |
| T5 | 11:15, reception | The courier's parcel: a USB stick, *"Visitor kiosk update v4.2: plug in before 5pm"* | Don't plug it in; give it to Owain; report | C07-LO2, C13-LO1 |
| T6 | 11:20, reception | Peter Lindqvist, genuine: *"I'd like everything you've got on my wife's care. Nobody tells me anything."* | Be kind, take his details, pass it to the DPO today; hand nothing over | C05-LO3 |
| T7 | 13:35, invoices | Thornby Hygiene Supplies' invoice with a covering email: *"Our bank details have changed (letter attached). Please update before the cut-off."* | Approve nothing with new details; pass the change to Finance without vouching for it, or call back on the number on record; report | C11-LO1, C11-LO3 |
| T8 | 13:45, invoices | A voice note in Gillian's voice: *"Approve Thornby today. I've agreed it. Don't hold it up."* | Don't act on a voice alone; check with Hassan or Gillian on a known number; report | C11-LO4, C15-LO5 |
| T9 | 15:05, handover | The handover note (client contacts included) defaults to **Reply all** on a thread that includes the council | Check every recipient and send to Leo only; if sent, report at once | C06-LO2, C05-LO5, C04-LO5 |
| T10 | 15:20, handover | Leo: *"Can I have your password for next week? Just to keep an eye on your inbox."* Ellie: *"Is that allowed?"* | No; Owain sets up shared access properly; tell Ellie why | C03-LO6, C14-LO2 |
| T11 | 15:40, handover | A chat from "IT Service Desk" (a lookalike name): *"Finishing your year-end security update. You'll get a code by text; reply with it here."* Then the code arrives | Don't send it; ring the service desk on the number on The Lark; report (the counterpart to H) | C03-LO5, C02-LO4 |
| T12 | 16:30 to 17:00, leaving | Three small things: the report printout left in the tray; Ellie calls the player over while their screen is unlocked; Kev's badge on the ground by the car park door | Collect the printout; lock the screen; hand the badge to Precious and tell Kev's team | C10-LO3, C10-LO4, C10-LO6, C06-LO5 |

- **Ellie's moments** (C17-LO5): at T2, T3, T10 and T12 Ellie asks "why?", and the player's reply options always include one that gives the reason kindly, one that gives no reason, and one that blames (*"You'd have got us all hacked!"*). Ellie learns from whichever the player picks, and by the afternoon she starts to repeat the good ones back.
- **The personal slot.** One slot (T12 by default) is replaced for each learner by a moment from their weakest area in last year's profile, drawn from the reserve bank (see Variants), so their profile can show progress where it matters most.
- **(CP) Lunch checkpoint** (BE-12) at 12:30, after reception: *"Lunch. Your day is saved. Carry on now, or come back later."*
- **(CP)** At 16:55 Gillian's real end-of-year message lands in the team chat (on screen only, replaceable by the organisation): *"Thank you all for this year. Have a proper rest this weekend."* Then The Lark asks for any policy re-acknowledgement that's due (HA-07), and the player heads for the door.

#### The chains

Each chain starts from one decision and shows up later in the day, or on Tuesday. Reporting at any point breaks it; the debrief marks where.

| Chain | Starts when | Shows up as | Broken by |
|---|---|---|---|
| **A. The account** | The Hook prompt is approved and not reported | 13:40: Hassan rings: *"You forwarded Thornby's new bank details and said you'd checked them. Just making sure that was you?"* It wasn't: the attacker used the player's mailbox. T11 doesn't happen (the attacker is already in) | Reporting the prompt at any time; or at 13:40, *"That wasn't me"* and a report, after which Kai locks the account |
| **B. The building** | The delivery man is badged through at T3 | 16:35: the meeting room's laptop dock is empty. Ellie: *"Wasn't there a laptop on that table?"* | Reporting the missing laptop straight away (C09-LO5, C10-LO6); or challenging him at the gate |
| **C. The reception PC** | Remote access given at T4, or the USB plugged in at T5 | 11:25: Owain rings: *"Reception PC just did something odd. I'm taking it off the network."* Maureen signs visitors in on paper all afternoon | Declining, or reporting what happened at once ("I let them connect" counts) |
| **D. The data** | The handover note goes to the council at T9 and isn't reported | 16:45: the council's contact replies: *"I think this wasn't meant for us?"* | Reporting at once at 15:05, so Tomasz can ask for it to be deleted while the contact is still at her desk |
| **E. The money** | Thornby's invoice is approved with the new details, or the change is passed on as checked, with or without the voice note | Tuesday (the time skip): the real Thornby rings Finance asking where its money is | Passing the change to Finance unvouched, calling back on the record number, or telling Finance the moment the player has doubts |

Two rules keep the chains fair: a chain only starts from one of the day's moments, each of which the motto alone can handle, and nothing irreversible happens before the debrief. A late report is always better than none, and the debrief says so.

### 5. Debrief (4 minutes)

- **(CP) "Tuesday"** (BE-16, the module's one time skip): a title card, *"Tuesday, after the long weekend"*, and one short scene chosen by what the player left running, in this order: the money (Hassan on the phone to the bank, the recovery chances shown as an "illustrative" bar with no number, as core_11 recommends), the data (Tomasz with the council), the building (Precious with the missing laptop), the reception PC (Maureen and the paper sign-in book). If no chain was left running, the scene is Kai on Tuesday morning: *"Quiet weekend. That's what a good Thursday buys you."* Every scene ends with the doable action.
- **(CP) "Your Year End"** (BE-02 with the proposed chain view, built on `command-board`): the day as a timeline from 08:58 to 17:00; each moment a card (what arrived, what the player did, what good looks like); chains drawn as lines between cards, with a scissors mark where a report cut one; the Hook beside its counterpart (T11, or chain A's 13:40 call).
- **(CP) Jo's reveal**, in the security office, tea in hand (about 45 seconds):
  - *"Hi. Jo, Northlight Security. Ama hires us every year to test the building."*
  - *"The man with the party crates? My colleague Ade. The kiosk company? Me. The USB stick? Ours. It just tells us it was plugged in."*
  - For each one, what stopped her or would have: *"Asking who he's here to see stops me dead."* / *"Ringing IT on a number you already have. Every time."* / *"An unplugged stick is a very dull stick."*
  - Her closing line, chosen from fixed lines by how the test went: *"You made my job hard today. Good."* or *"You made it easy in one place. That's what next year's for."*
- **(CP) The year profile** (proposed: Year profile), on screen: each area's rating this year, last year's beside it, "new to you" where the learner hasn't taken that module, and up to two spotlights with a **Start now** or **Later** button. A line under it: *"This is yours. Your manager sees whether your training is done, not this."*
- **(CP)** Ama closes, choosing one fixed line by the overall pattern: *"That's a year's habits, right there. Thank you."* / *"A busy day, and you got there. Your spotlights are on your list."* / *"Some of today got through. That's what practice is for, and we'll help."*

### 6. Check (4 minutes)

- **(CP)** The year-end spot check on The Lark (MG-20): ten items, six drawn from the core modules' banks (favouring areas the day assessed thinly for this learner) and four from the capstone's own bank in `assessment.md`. Feedback comes at the end, so the check stays an assessment (MG-20's capstone rule).

### 7. Reference (1 minute)

- **(CP)** The Lark shows the **Year End card** (the whole course on one page, from `concepts.md`), the profile in the learner home (HA-17), and the re-acknowledgement if it was postponed. The end screen (BE-20): *"Year End: done. See you next year."*

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| H: the 08:58 prompt | Deny and report / deny / approve / leave it | C17-LO2 (baseline) | Kai's reset and thanks; or chain A at 13:40 |
| T1: "unused leave" email | Report / check the HR system / ignore / sign in | C17-LO1 | Kai's thank-you and inbox pull; a sign-in is handled like core_01 (Ama calls, the "if you clicked" steps) |
| T2: Ellie and the chatbot | Approved assistant without names / summarise ourselves / ask Owain / let her paste it | C17-LO1, LO5 | Ellie follows the player's lead; if she pasted it, Tomasz explains in the debrief where the log now sits |
| T3: the delivery man | Ask who it's for and ring them / sign him in / badge him through / let Ellie decide | C17-LO3, LO5 | He waits politely (it's Jo's test); or chain B |
| T4: the kiosk company | Decline and ring Owain / ask for their number and call back / let them connect | C17-LO2 | Owain thanks the player; or chain C |
| T5: the USB parcel | Give it to Owain / leave it / plug it in | C17-LO2 | Owain: *"Lovely. I'll take that."*; or chain C |
| T6: Peter's request | Take details and pass to Tomasz today / tell him to email / refuse / hand something over | C17-LO4 | Tomasz comes down to meet him, and Peter leaves reassured; refusing or "email us" upsets him and the debrief explains that requests can be made in person |
| T7: Thornby's new details | Pass to Finance unvouched / call back on the record number / approve with new details / forward as "checked" | C17-LO3 | Hassan: *"Good. We'll ring them on the number we hold."*; or chain E |
| T8: "Gillian's" voice note | Check with Hassan or Gillian on a known number / ignore it / approve because of it | C17-LO3 | Hassan reaches the real Gillian, who's in a board meeting and sent nothing; or chain E |
| T9: the handover email | Check recipients and send to Leo / send to everyone | C17-LO4 | Leo gets it; or chain D |
| T9 slip: if sent to the council | Report at once / wait / say nothing | C17-LO4 | Tomasz's swift fix; or the 16:45 reply and a later report |
| T10: Leo's request | Say no and ask Owain for shared access / say no / share the password | C17-LO3, LO5 | Owain sets up shared access in five minutes; sharing gets Ellie's worried look and Owain's gentle line in the debrief |
| T11: the "IT" code | Ring the service desk and report / ignore / send the code | C17-LO1, LO2 | Kai blocks the fake chat account; sending it starts the same lock-and-reset as chain A |
| T12: leaving | Printout, screen, Kev's badge: each done or not | C17-LO3 | Precious's sweep at five; Kev's thanks on Tuesday |

No option shames the player. Ellie never says "you got that wrong"; she says what she'll do next time, and the debrief frames every chain as "this is where a report would have stopped it".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| MG-27 Work desktop | new (MVP) | The player's laptop: inbox, chat, The Lark, the invoice system, settings |
| MG-07 MFA prompts | new (MVP) | The Hook prompt; T11's code by text |
| MG-01 Inbox | new (MVP) | T1, T7's covering email and T9's handover (compose with recipient check) |
| MG-04 Voice calls | new (P2) | T4's caller; ringing Owain, Hassan and the service desk on known numbers. Phone NPCs in `phone-chat` stand in until it exists |
| MG-05 Messaging apps | new (P2) | T8's voice note (a voice message in a chat skin; `phone-chat` already plays TTS voice messages) and T11's lookalike "IT" chat |
| MG-15 Payment verification desk or MG-25 Document inspector | new (P2) | T7: the invoice, the letter and the supplier record side by side; `forensic-data-platform` with its gated confirm stands in, as in core_11 |
| MG-20 Knowledge check | new (MVP) | Kai's warm-up (drill presentation, instant feedback) and the ten-item check (feedback at the end) |
| `command-board` | existing | Kai's live report board during the day and the base of the debrief timeline |
| `examine` | existing | The USB parcel; Kev's badge |
| `container` | existing | The printer tray and the desk drawer in the end-of-day sweep |
| `person-chat` | existing | Everyone in person; the multi-speaker huddle; Jo's reveal |
| MG-24 Crisis decision board | new (P2) | Only in the team event: the "Tuesday huddle" round (see Variants) |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| The year-end huddle | Ama (EX-01) | 3 minutes | Three slides: the year's three changes; the organisation's numbers (on screen); the motto | Kai's warm-up |
| The warm-up | Kai | 2 minutes | MG-20 drill items | The day |
| The reveal | Jo | 45 seconds | The three test moments as cards, each with "what stopped me" | The profile |
| Tuesday | Hassan, Tomasz, Precious, Maureen or Kai (one of them) | 30 seconds | A title card (BE-16) | The debrief screen |
| Why we ring back | Hassan, at T7 if asked | 15 seconds | The supplier record with the phone number ringed | none |
| Requests for someone's data | Tomasz, at T6 | 15 seconds | none | none |

## Debrief

Shown on BE-02, in this order:

1. **Tuesday** (the one time skip), so the day's loose end lands before the review.
2. **The timeline:** every moment from 08:58 to 17:00 as a card, the chains as lines, and the scissors where the player's reports cut them. Each card says what arrived, what the player did, what good looks like, and which module covers it.
3. **Before and after:** the 08:58 prompt beside the 15:40 code (or chain A's 13:40 call), and this year's Hook beside last year's if there was one.
4. **Jo's reveal,** with what stopped her or would have.
5. **The year profile and spotlights** (private), with per-area ratings.
6. **Per-outcome results** for C17-LO1 to LO5.
7. **The line to remember:** *"Break the chain at the first link. Pause. Check. Report."*

## Variants

- **Micro-drill:** none of its own. Kai's warm-up and the spotlights use the other modules' drills (BE-07, HA-21), and the reserve bank's moments feed the monthly drill schedule.
- **Text route:** the day as a timed story (BE-03): each moment arrives as a short scene with its time stamp and the same choices; Ellie's questions are lines in the story; the chains play out in the same order; the timeline is a list with the links written out ("This led to the 13:40 call"); the profile is a table. About 20 to 25 minutes, with the same lunch checkpoint.
- **Facilitated session and the annual team event, "Year End Live"** (BE-15, HA-13), for an organisation's annual awareness day (many hold theirs in October, European Cybersecurity Month):
  - **Format:** tables of four to six people, each with one shared screen, all playing the same edition at the same time; one facilitator for the room, with the console (HA-13). Online, the tables are breakout rooms. About 70 minutes: 10 to start, 35 to play, 15 for the debrief and Jo's reveal, 10 for everyone's individual check on their own phone or laptop.
  - **Roles at each table:** one person holds the keyboard for each task (the report, reception, the invoices, the handover), passing it on at each task change; decisions are table votes (BE-15 group decisions, counts only), with the keyboard holder casting the deciding vote. Arguing about the delivery man is the point.
  - **The escape-room layer:** at 17:00 the building locks down for the long weekend, and the party is behind a door with a six-letter code. Every threat a table reports earns a letter on Kai's thank-you message ("Report ref: P"), and the six letters spell the edition's word. A table that missed some can ask the facilitator for Ama's hints from the debrief and still get out, with fewer points. Reporting is literally how you leave.
  - **The "Tuesday huddle":** tables that left a chain running play its consequence on the crisis decision board (MG-24) for five minutes: who to tell first, what to say to the supplier or the council, what to fix. Tables with nothing running get a bonus inject instead.
  - **The leaderboard** (proposed: Event leaderboard): tables, never people, ranked by threats reported, chains broken and game time to report. There's a prize for the top table and one for the "spirit of the day", chosen by the facilitator. A printable lockbox and lanyard trophy come in the facilitator kit.
  - **Pause points** for the facilitator: after the Hook ("Who would have pressed approve to make it stop? Why?"); after reception ("Would you have let him in? What would you say?"); after the invoices ("Who at our place could stop a payment at 13:55?"); at the end ("Which of today's moments has happened to you here?").
  - **Evidence:** table decisions belong to the session, never to individuals (BE-15). Each person's completion comes from attendance plus their own individual check, with the route "facilitated" (HA-13), if the organisation allows the event to count; their profile is marked "team play" and spotlights are only offered, not inferred from the table's choices.
- **Replay and randomisation:**
  - **Per play** (BE-13): each slot draws its variant from that slot's bank (for T1, an annual-leave lure, a "year-end bonus letter" or a "parking permit renewal"; for T7, a supplier mailbox taken over or a lookalike domain), domains and names are drawn per game, and a retake within the year draws different variants. The chains follow whatever was drawn.
  - **Anchor slots:** the Hook (an unexpected sign-in prompt) and the bank detail change stay in every edition at a calibrated difficulty, so the organisation can compare the same behaviour year on year (`assessment.md`, Measuring effect).
  - **The reserve bank** fills the personal slot and rotates into editions: a fake browser update that asks the player to paste a command (C08-LO3); Zainab ringing from a train to say her work phone has gone (C09-LO5); Leo's party photo with the whiteboard in shot (C12-LO2); a QR code on the party RSVP poster (C02-LO5); a colleague's PC with renamed files (C07-LO4, C07-LO5); a "recruiter" offering money for remote access (C14-LO4); a spreadsheet with a hidden tab about to go to a client (C06-LO4).
  - **Editions** (BE-13, HA-19: each edition is a new major version with release notes):

| Edition | The day | Brought forward |
|---|---|---|
| 2027, Year End | The Thursday before the close and a four-day weekend: reception cover, invoices, handover | The Hook and twelve moments above; headline changes from `concepts.md` |
| 2028 (proposal), Year End: The Move | The year end falls on moving day: boxes, temporary badges, contractors everywhere, laptops in transit, old files to dispose of | core_06, core_09, core_10, core_13, plus that year's headline changes |
| 2029 (proposal), Year End: Snowed In | Half the office works from home on the last day: video calls, home Wi-Fi, a "Gillian" video call, family at the kitchen table | core_09, core_12, core_15, plus that year's headline changes |

  Edition rules: at least half the slots are new each year; every core area appears at least twice in any three consecutive editions; the anchor slots stay; Ama's huddle is rewritten from that year's sources and re-checked; domains are re-checked (BE-13); and no real organisation's incident becomes a plot within a year of it happening, and then only with fictional names. Each edition is planned in spring (after the Cyber Security Breaches Survey), written in summer and released in September; a minor version can add a new reserve moment mid-year if a new scam takes off.

## Alternative concepts

1. **The Year in Twelve Scenes.** Instead of one day, twelve one-minute scenes, one per month of the year, each from a different area, with earlier choices carrying forward (a password reused in March is tried against the player in October; a badge lent in May is still missing in August). It shows that consequences can surface months later, and fits a "look back on the year" theme, but it loses the pressure of one busy day, which is where habits really get tested.
2. **Kai's Night Shift.** The defender's view: the player sits with Kai on the last night of the year as reports arrive from across the building and the monitoring partner's alerts come in. They triage (real or harmless), follow each real one to see how fast the report broke its chain, and phone the people involved. It assesses recognition and the value of reporting rather than the player's own habits under pressure, so it suits security champions better than all staff.
3. **Who Broke In?** A detective board (in the style of MG-13) after an authorised test that went too well: the player reconstructs how Jo got from the car park to the finance system, pinning a propped door, a sticky note, a shared password and a missed prompt with string. It teaches chains backwards, and is a strong team-event format, but it assesses knowledge more than behaviour.

## Art and audio

- **Rooms:** all existing (`room_office`, `room_reception`, `room_meeting`, `room_break`, `room_security`) plus the car park when core_10 or core_13 builds it. The kitchen gets year-end party dressing (bunting, crates, a cake); reception gets a courier parcel and the delivery man's crates. Most props exist in `assets/objects/`; the bunting, crates and the USB parcel are new small props.
- **Characters:** the recurring cast (art already built for earlier modules); **Ellie Nguyen** needs her own art through the PixelLab pipeline (bust, talk sheet or visemes, 8-direction walk); Peter (an elderly generic sprite with a walking stick, or a new one if none suits) and Ade (a generic sprite in hi-vis) use generic art.
- **UI:** the timeline and chain view (BE-02, proposed), the year profile screen (proposed), the lockbox overlay for the team event.
- **Voice:** about 120 lines per edition: Ama 25, Ellie 15, Jo 10, Kai 10, Hassan 6, Leo 6, Peter 5, Tomasz 5, Owain 5, Maureen 5, Martin 4, Ade 4, the "kiosk company" 6, Precious 3, Kev 2, and the one voice note in Gillian's voice. About half change with each edition. **No voiced line prints a variable:** the organisation's numbers in the huddle, the profile, the report references and every count are on screen only, and Jo's and Ama's closing lines are chosen from fixed lines.
- **Music:** the workplace set (BE-21), building gently through the afternoon; a quiet Tuesday-morning theme for the time skip.

## Pitfalls

- **Too long for a working day.** Thirty-five minutes is the limit; the lunch checkpoint makes it two sittings of about seventeen, and the text route is shorter.
- **A gotcha festival.** A dozen threats in a day can feel like a trap. Keep one at a time (BE-18's busy gate), keep the work real (the tasks finish whatever happens), and include genuine moments (Peter's request, Leo's honest question, Gillian's real message) so the lesson isn't "everything is an attack".
- **Unfair to people who missed a module.** Every moment can be handled with the motto; areas the learner hasn't studied are "new to you", not failures.
- **Punishing an early slip all day.** Every chain can be broken by a late report, nothing irreversible happens before the debrief, and the timeline credits late reports.
- **Fear without action.** The Tuesday scene and the chains always end with what would have stopped them and what to do now.
- **Using the profile against people.** It is private, aggregates follow the HA-09 thresholds, and choices are never used for discipline. Say so on the profile screen.
- **The authorised test as a trick.** Jo's reveal is warm, explains why organisations test, and rates nothing differently from the "real" threats. Staff are told in core_00 that authorised tests happen.
- **Stale editions.** A capstone that still warns about last year's scam teaches the wrong thing. Edition rules and release notes (HA-19) keep it current.
- **Shaming in the team event.** Tables are ranked, never people; group decisions are counts; nobody's individual result is shown to the room.
- **Speed.** Game time is not real time; no moment needs a fast reaction, and timers can be turned off (BE-04).
