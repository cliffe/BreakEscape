# core_11 game design: Change of Details

## Concept

It's the last Thursday of the month, which means payment-run day, and half of Finance is away for half-term. Hassan Qureshi, the Finance Manager, has borrowed the player for the afternoon: as an operations coordinator they know the suppliers and the deliveries, so they can match this week's invoices to delivery notes and build the list for Hassan's 15:30 payment run. The morning starts at the player's own desk, where Dawn from Northbeck Supplies sends new bank details with a polite request to pass them on. The afternoon brings the same trick in a different costume, an urgent payment "from" the chief executive, and the player's own manager worrying about an invoice she approved on her phone between meetings.

The module teaches through how ordinary these requests feel. None of them needs technical knowledge to stop: the defence is a phone call to a number already on record, two people approving, and speaking up quickly when a payment may have gone wrong. The player never approves a payment (a helper from Operations wouldn't); they prepare, check, pass things on with honest notes and report, and they see Hassan and Eleni's controls work because each person did their part. The story a player takes to lunch: "The number on the letter answered, and she was lovely. The number on our records said they'd never changed banks."

## Setting and cast

- **Rooms:**
  - The Operations area of the open-plan office (`room_office`): the player's desk and monitor, as in core_01.
  - The finance office (`small_office_room2_1x1gu`, redressed) behind the badge door: two desks, a locked cabinet, a wall planner reading "PAYMENT RUN THU 15:30", and Hassan's desk card: "Change of details? Call the number on record."
  - The chief executive's office (`room_ceo`), seen through its glass wall, empty: Gillian is at a conference, which she posted about publicly.
- **Hassan Qureshi** (Finance Manager) is this module's mentor: calm, methodical, tells his near miss.
- **Ama Owusu** (Information Security Manager) appears briefly: one optional explainer and the debrief.
- **Lena Fischer** (Operations Manager, the player's manager) appears by chat. She is the colleague who slips (she approved a fake invoice on her phone) and reports it quickly. Chat only, so she still needs no art.
- **Gillian Marsh** (Chief Executive) is impersonated by email; the real Gillian answers on the company chat and thanks the player by video call in the debrief.
- **Eleni Markou** (new; Financial Controller, the second approver) joins the 15:30 run by video call. 50s, Greek Cypriot British, dark hair with grey streaks held in a clip, reading glasses on a cord, navy cardigan, walks with a stick. Brisk, dry and kind. Shared with role_02, where she is on screen.
- **Kai Murray** (security analyst) thanks reporters in the team chat.
- **Voices on the phone only:** Dawn at Northbeck Supplies (core_01's supplier contact); Lorna in accounts at Brackenfold Hygiene (a fictional cleaning-chemicals supplier); and the fraudsters who answer the numbers printed on the letters, played by generic voices with the `voice.fx` phone filter.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Please pass this on" (1 to 2 minutes)

- **(CP)** 09:10 at the player's desk. On the desk computer (MG-27), the inbox (MG-01) shows Lena's note ("Hassan's borrowing you this afternoon for the payment run, 13:00 in Finance. Thank you!"), the canteen menu, and an email from **Dawn (Northbeck Supplies)**: "New bank details: please pass to your accounts team". Per play (BE-13) it comes either from Dawn's real address (her mailbox has been taken over) or from a lookalike domain. Attached is a letter on Northbeck letterhead, signed by Northbeck's "Finance Director", with new bank details and "Any questions, call our finance office" on a mobile number.
- The email: *"Hi! You're my main contact at Larkspur, so I hope you don't mind me sending this your way. We've moved banks and the new details are on the letter. Could you pass it to whoever pays us? It needs to be in place before your payment run this week, as the old account closes on Friday. Thanks so much, Dawn"*
- The player can: forward it to Finance with a note of their choice ("It's from Dawn at Northbeck, it's genuine" / "Received this, I haven't checked it" / no note); reply to ask if it's really her; ring the number on the letter; ring Northbeck on the number in the supplier directory on The Lark (MG-04); report it; or delete or ignore it. Their response is the **baseline** for C11-B1.
- **Rings the directory number:** Dawn answers: *"Northbeck, Dawn speaking. New bank details? No, love. We've been with the same bank for twenty years."* Then, in the real-domain play: *"Has someone got into my email? I'll ring our IT people now. Thanks for checking."* (In the lookalike play: *"That's not even our address. Thanks for checking."*) If the player doesn't report it next, Dawn adds: *"You'll want to tell your security lot too."*
- **Rings the number on the letter:** *"Northbeck finance, Rob speaking. Yes, that's right, we've moved banks. Dawn said she'd send it over. Anything else I can help with?"* Smooth and friendly. The player may then forward it as "verified by phone".
- **Replies to the email:** "Dawn" answers within a minute: *"Yes, it's me! Sorry for the rush. Could you get it to accounts today?"*
- **Reports it:** at 09:40 Kai posts in the team chat: *"Thanks for the report. Fake bank change in Northbeck's name going round. Finance have it, and they've rung Northbeck on our number."*
- A short time skip (BE-16): *"That afternoon."* The player walks to the finance office.

### 2. Learn: "The number you already have" (2 to 3 minutes)

- **(CP)** Hassan at his desk (EX-01). His opening line follows the hook (fixed lines, chosen by branch):
  - **Rang the directory number:** *"Dawn says you rang her on our directory number. That's the whole trick, right there."*
  - **Reported it:** *"Kai passed me your report this morning. Good shout. Three of us got that one."*
  - **Forwarded it, unchecked:** *"Thanks for sending Dawn's letter to us rather than acting on it. I rang her on our number. It isn't her."*
  - **Forwarded it as genuine or "verified":** *"You told us Dawn's letter was genuine. I can see why: her address, her letterhead. I rang her on our number. It isn't her."* Calm, then: *"Which number did you ring? That's the only question that matters."*
  - **Replied to it:** *"You asked 'Dawn' if it was real, and she said yes. If someone's in her mailbox, that's who answers."*
  - **Ignored it:** *"You left it alone, which is safe. But three of us got it, so reporting it helps everyone."*
- He explains with the hook as the worked example, shown in the conversation panel with highlights stepped through (BE-08):
  1. **The ask and the push:** a change of bank details, "before your payment run", "the old account closes on Friday".
  2. **The route:** a mobile on the letter, a reply to the same email. *"Everything in that email could be real or copied. Letterhead's on every invoice they've ever seen."*
  3. **Five shapes of payment fraud:** a card with five icons: new bank details, an invoice nobody ordered, the boss in a hurry, gift cards, a change to someone's pay.
  4. **The rule:** Pause. Don't use anything in the message. Ring the number on record. Two people approve. Report it.
- **His near miss** (30 seconds, short spoken lines):
  - *"Years ago, a supplier we'd used for ages sent a letter. New bank, proper letterhead."*
  - *"I rang the number on the letter. Lovely woman. Confirmed everything."*
  - *"Eleni was checking my changes. She asked one question: which number did you ring?"*
  - *"I rang the number on our records. They'd never heard of the letter. That's all two-person approval is: two people, both checking."*
- **Check question** (MG-20 single item, opened with `#trigger_minigame:knowledge_check|c11_q_which_number`): *"A supplier emails new bank details and gives a mobile number for any questions. Which number do you ring to check?"* The mobile in the email / the number in our supplier record / reply and ask them to ring you. A wrong answer brings back the "route" highlight.
- **Skip:** players can say *"I deal with payments already."* Hassan: *"Then this is a two-minute refresher,"* and goes straight to the check question.
- **Optional topics** in Hassan's hub (each under a minute): *"What's Confirmation of Payee?"* (the four results); *"What if money's already gone?"* (Finance rings the bank, then security, then Report Fraud); *"How do they know so much?"* (Ama's explainer: taken-over mailboxes, out-of-office replies, published spending); *"What about gift cards?"* (they're as good as cash and hard to get back; check with the person another way; core_02 plays this one).

### 3. Practise: "Change or No Change?" (2 to 3 minutes)

- **(CP)** Hassan opens the verification desk on his second screen (MG-15 practice mode, opened from his conversation with a BE-19 tag, `#trigger_minigame:<MG-15 scene>|c11_desk_practice`; BE-07 for the stand-alone drill). Six requests, one at a time. For each, the request is on the left, the Ledger record or staff record on the right, and the player chooses **Ring the number on record**, **Pass to the second approver**, or **Refuse and report**. Feedback is immediate: the clue highlighted, the right route, one line of why.
- The six get harder:
  1. Bank change from a lookalike domain, "needed today". *Refuse and report.*
  2. A supplier's usual monthly statement, nothing changed. *Deal with it normally* (calibration).
  3. Bank change from the supplier's **real** address, on letterhead, with a mobile on the letter. *Ring the number on record:* "We've sent nothing." *Refuse and report.*
  4. "Zainab Hussain" emails payroll from a personal address: *"New bank, please update before payday."* *Refuse; she changes it in the HR system herself; check with her on the directory number; report.*
  5. A new supplier, checked at set-up on the number from its contract. Confirmation of Payee says **close match**: "Tarnside Paper Company Ltd" for "Tarnside Paper Co". *The suggested name is its full registered name and matches the contract: pass it to the second approver* (calibration: close match means look, not panic).
  6. Ordering: *"A payment you prepared twenty minutes ago went to an account the supplier says isn't theirs."* Order: tell Finance to ring the bank now; tell the security team; keep the emails; Finance reports it to Report Fraud; tell the real supplier on the number on record. Feedback: *"Bank first. Minutes matter."*
- Two wrong answers in a row bring Ama to the door with a one-line nudge: *"Don't judge the letter. Judge the route. Which number did you ring?"*

### 4. Apply: "Payment run, 15:30" (5 to 6 minutes)

- **(CP)** 13:30. A work task bar appears (BE-18): **Match the invoices to delivery notes**, then **Build the payment list**, then **Hassan's run at 15:30**. Six ordinary invoices (Northbeck, a uniform supplier, a paper supplier, a van hire firm, the window cleaner, the canteen supplier) are matched to their delivery notes with a click each: this is the real work, and it keeps moving while the requests arrive.
- Hassan leaves for a meeting from 14:30 to 15:15: *"Anything odd, put it on my desk with a note saying what you checked, or ring me."* The player has the Finance shared inbox (MG-01), the desk phone (MG-04) and the company chat (`phone-chat`).
- The requests arrive as scheduled interruptions:

| Time | Slot | What arrives | What it tests | Best response |
|---|---|---|---|---|
| 13:50 | **Bank change by letter** (the hook's "after") | Brackenfold Hygiene, a cleaning-chemicals supplier, emails a letter on its letterhead: new bank, "please update before today's run", and a mobile for "our finance manager". From Brackenfold's real domain or a lookalike (BE-13) | C11-LO2, C11-LO3 | Compare it with the Ledger record (MG-25: a mobile where the record has a landline, a new bank, the deadline). Ring Brackenfold on the record number (MG-04): Lorna in accounts says they've changed nothing. Put it on Hassan's desk marked "Rang our record number: not them" and report it |
| 14:10 | **A colleague's slip** | Lena on chat: *"Bit embarrassing. I approved an invoice on my phone this morning, a 'directory listing renewal'. Now I can't remember us ever using them. Is it in today's run?"* | C11-LO4, C11-LO6 | Find it in the list (£1,180, approved by L. Fischer), hold it, tell Hassan, report it, and thank Lena |
| 14:40 | **The boss in a hurry** | "Gillian Marsh", from a lookalike Larkspur domain and "sent from my phone", to the Finance inbox: £18,450 to "Brightwater Advisory LLP" today, a confidential deposit, *"I've cleared it with Eleni. Please don't discuss it. If it needs splitting to get through, do that."* | C11-LO1, C11-LO4 | Don't add it and don't split it. Check with Gillian on the company chat (her known account): *"Not me! About to go on stage. Please report it."* Tell Hassan; report it |
| 15:30 | **The run** | Hassan reviews the list; Ledger checks the names of new payees (Confirmation of Payee); Hassan signs off on his panel; Eleni signs off on hers from a video call (`dual-auth`, watched) | C11-LO5 | Read the results: Tarnside's close match is its registered name (fine); any no match is held |

- **Who decides what.** The player never changes bank details or approves a payment. They prepare, check, leave honest notes and report. Hassan and Eleni are the controls, and the game lets the player see them work.
- **Consequences**, shown inside the module:
  - **Brackenfold:** if the player's note says "verified by phone" after ringing the letter's number, Hassan reads it at 15:15 and asks, *"Which number did you ring?"* He rings the record number himself and the change is stopped. The debrief shows what would have happened without his second check.
  - **Lena's invoice:** if the player holds it, Hassan says *"Good catch, both of you,"* and Lena replies on chat: *"Thanks for not making me feel daft."* If the player tells Lena *"It's approved, it'll be fine,"* or does nothing, the invoice goes in the 15:30 run. At 16:05 Lena writes again: *"I've looked them up. I can't find them anywhere."* The player still has a choice: tell Hassan now (he rings the bank's fraud line at once; a BE-16 "next morning" scene shows part of the money frozen in time) or leave it until tomorrow (the money has already been moved on). A recovery bar, labelled "illustrative", falls as the clock moves.
  - **"Gillian":** if the player adds or splits the payment, Hassan at 15:15 asks, *"Who asked for this one?"* He checks with Gillian on chat and takes it out. Caught, and recorded. If the player replied to the email instead of checking, "Gillian" pushed harder (*"I'm boarding. Please just do it."*), which the debrief explains.
  - **Reports** are thanked by Kai in the team chat with what they achieved ("blocked the lookalike domain", "warned Brackenfold's other customers").
- **(CP)** The run goes at 15:30 whatever the player did; the debrief shows the rest.

### 5. Debrief (1 to 2 minutes)

- **(CP)** The debrief screen (BE-02), then Hassan and Ama at the finance desk (or in the conversation panel for the text route).
- For each request: a thumbnail, what it was, the clue, what the player did, what checking another way looked like, and the outcome.
- **Before and after:** Dawn's email from the hook beside Brackenfold's letter.
- **The call that felt like a check.** If the player rang a number from either letter, a 20-second replay of the friendly "confirmation", with Hassan: *"That was the fraudster. It felt like a check. It wasn't."*
- **Lena's outcome,** and why her quick message mattered more than her slip.
- **The real Gillian** joins by video call from the conference (20 seconds): *"I hear someone used my name today. Thank you for checking. If it's ever really me, check anyway. I'll wait."*
- Per-outcome results: Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"Change of details or an odd payment? Call the number you already have."*

### 6. Check (2 minutes)

- **(CP)** Kai's "spot check" on The Lark (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09): the six-step procedure from `concepts.md`, the organisation's own change procedure and urgent Finance contact (BE-05), and the police reporting route for the learner's nation.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Dawn's email (hook) | Ring the directory number / report / forward unchecked / forward as genuine / ring the letter's number / reply / ignore | C11-LO2, C11-LO3, C11-LO6 (baseline) | Dawn's answer; Kai's chat; Hassan's opening line differs; a "verified" forward is met with "Which number did you ring?" |
| Brackenfold's letter | Ring the record number and report / pass it on unchecked / ring the letter's number and pass it on as verified / reply | C11-LO2, C11-LO3 | Lorna's answer; or Hassan's second check catches it, and the debrief replays the fraudster's "confirmation" |
| Lena's invoice | Hold it, tell Hassan and report / "it's approved, it's fine" / do nothing | C11-LO4, C11-LO6 | Hassan's thanks; or the 16:05 message and a last chance to raise it, then the next-morning scene |
| Late raise (only if the invoice was paid) | Tell Hassan now / leave it until tomorrow | C11-LO6 | Part of the money frozen; or the money moved on |
| "Gillian's" payment | Check on the company chat and report / tell Hassan / reply to the email / add it / split it | C11-LO1, C11-LO4 | The real Gillian's "Not me!"; or Hassan removes it at 15:15 |
| The run's name checks | Hold any no match / accept the close match that is the registered name / wave a no match through | C11-LO5 | Hassan asks what the player makes of each result, and agrees or explains |

No option shames the player. The worst branches (vouching for a fake change, waving through Lena's invoice) end with a colleague helping and the debrief framing it as "this is how most real losses happen; this is what one call would have changed". Lena, a manager, is the one who slips, and she is thanked for saying so.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-15 Payment verification desk** | new | Practise and Apply. The request (email, letter or form) beside the record: name, address, phone on record with the date it was added, bank details shown only as the last four digits, and the change history. Actions: **Ring the number on record** (opens MG-04 with that number), **Pass to the second approver**, **Refuse and report**. A Confirmation of Payee result per payee. Feedback on in practice, off in Apply. Emits an event for every action |
| **MG-25 Document inspector** | new | The two letters against the Ledger record: tap the fields that differ (phone, bank, deadline wording). It closes with a note that matching letterhead proves nothing, and at least one request per play has no visible difference |
| **MG-04 Voice calls** | new (P2) | Directory and Ledger numbers reach Dawn and Lorna; the numbers printed on the letters reach the fraudster. Until MG-04 exists, phone NPCs in `phone-chat` stand in |
| **MG-01 Inbox** | new | The player's inbox in the hook (forward with a chosen note, reply, report) and the Finance shared inbox in Apply |
| **MG-20 Knowledge check** | new | Hassan's check question and the final check |
| `dual-auth` | existing; not registered or dispatched yet | The 15:30 approval, watched. After the rework in `features/minigames.md` section 4: heading "LEDGER PAYMENT RUN: TWO APPROVALS REQUIRED"; panel 1 "Finance Manager: Hassan Qureshi", panel 2 "Financial Controller: Eleni Markou"; each panel a named sign-off with a short checklist ("holds resolved", "name checks reviewed") instead of a PIN; the action label "RELEASE PAYMENT RUN"; globals from data; no timer. Panel 2 completes on Eleni's own event from her video call |
| `forensic-data-platform` | existing | Stand-in for MG-15 in Apply and in the text route: tabs "Email", "Letter", "Ledger record", "Change history"; `confirmGateTab` set to the record tab; `confirmLabel` "Hold this change and report it"; `confirmedVar` `brackenfold_change_held`. The other choices (pass it on, pass it on as verified) run in Hassan's desk-tray conversation in ink |
| `phone-chat` | existing | The team chat, Lena, and the company chat with the real Gillian |
| `person-chat` | existing | Hassan and Ama; video-call mode for Eleni and the real Gillian |
| `notes` / `text-file` | existing | The supplier directory on The Lark, Hassan's desk card, the payment list, the delivery notes |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| The number you already have | Hassan (EX-01) | 90 seconds | The hook email and letter with highlights; the five shapes card; the rule card | "Which number do you ring?" |
| Hassan's near miss | Hassan | 30 seconds | A photo of a letter on a desk | none |
| Confirmation of Payee | Hassan | 30 seconds | The four results, each with what to do | Practise item 5 |
| If money's gone | Hassan | 30 seconds | Three steps: Finance rings the bank, tell security, Report Fraud | Practise item 6 |
| How do they know so much? | Ama (EX-01) | 40 seconds | An out-of-office reply naming who covers payments; a published spending line; a taken-over mailbox | none |
| Optional video: "Sixty seconds on payment fraud" | Recorded in engine (EX-02) | 60 seconds | Plays on the meeting room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Hassan and Ama:

1. The four requests (Dawn, Brackenfold, Lena's invoice, "Gillian"), each with what it was, the clue, what the player did, what checking looked like and the outcome.
2. The before and after: Dawn's email against Brackenfold's letter.
3. Any call the player made to a number from a letter, replayed, with Hassan's line.
4. Lena's outcome, and the real Gillian's thank-you.
5. Per-outcome results, and the line to remember: *"Change of details or an odd payment? Call the number you already have."*

## Variants

- **Micro-drill:** "Change or No Change?" on its own (BE-07): eight requests drawn from the bank, including kinds the full module only teaches: a gift card request from "the boss", a refund to a "new" account, a duplicate invoice with different bank details in the footer, a payroll change. About 4 minutes, with a new theme each month (BE-13, HA-21).
- **Text route:** each email and letter shown as accessible text with the record beside it; "ring the number on record" and "ring the number on the letter" as choices that play the call as dialogue; Confirmation of Payee results as text; the same decisions, chat messages and debrief (BE-03).
- **Facilitated session:** the finance desk on a shared screen; the team votes on each request. Pause points: after the hook (*"Who would have passed it on? What would you have written?"*), after Lena's message (*"How easy is it here to admit you approved something you shouldn't have?"*), after "Gillian" (*"Who in this room would feel able to say no to the chief executive? What would help?"*). About 45 minutes with discussion.
- **Replay and randomisation:** the bank holds suppliers, letter variants (real domain, lookalike, a scanned letter "sent by post"), senior names (chief executive, Financial Controller, a director), the colleague's slip (a "renewal", a duplicate, a "subscription") and Confirmation of Payee results. Names, domains and phone numbers are generated per game. The annual edition swaps in the year's common lures.

## Alternative concepts

1. **Follow the Money (detective board).** After the fact: Northbeck rings to chase a payment that never arrived. On a corkboard (MG-13's board), the player reconstructs how a change of bank details got through: an out-of-office reply naming who covers payments, a taken-over mailbox, a call to the number on the letter, a rushed approval. Each pin reveals where one check would have stopped it, and Hassan rings the bank as the board fills in. Strong on the chain and the stopping points; less practice of the in-the-moment habit.
2. **The Long Con (attacker view, EX-06, BE-11).** Jo Fairweather runs an authorised fraud test for Larkspur and shows the player what is already public: a council's published spending list naming Larkspur's suppliers, the chief executive's conference post, an out-of-office reply. The player predicts which request would land with whom, then switches back to Finance as Jo's test arrives. It shows how little a fraudster needs, never how to do it.
3. **Groundhog Thursday (time loop).** The same payment-run afternoon replays three times. Each loop the fraudster adapts to the player's last defence (a lookalike domain, then the real mailbox, then a friendly call to "confirm"), until the player's process (ring the number on record, two people, report) beats every version. Memorable and squarely "process over cues", but longer to build and to play.

## Art and audio

- **Rooms:** the existing office, a redressed small office as the finance office (shared with role_02), and the CEO office.
- **Characters:** Hassan (shared with role_02), Ama and Gillian (shared with core_15 and role_01) need their own art. Eleni Markou is new: a portrait and talk sheet for video calls here, and a full sprite for role_02. Lena appears by chat only. Dawn, Lorna and the fraudsters are voice only, using generic voices with the `voice.fx` phone filter.
- **Props:** fictional Northbeck and Brackenfold letterheads, the wall planner, Hassan's desk card, the approval panel (a placeholder `objects/dual_auth.png` is already loaded in `public/break_escape/js/core/game.js:800`).
- **Voice:** about 35 lines for Hassan, 8 for Ama, 6 for Dawn, 4 for Lorna, 6 for the fraudsters, 4 for Eleni, 3 for Gillian. Emails, letters and chat messages are on-screen text. No voiced line prints a variable: amounts, account details, the player's or organisation's name and counts stay on screen.

## Pitfalls

- **Never ask for real bank details.** Letters show fictional bank names and partial account numbers; nothing the player types is real.
- **Never use a real company, domain or phone number.** Domains are generated per game and checked as unregistered; phone numbers come from Ofcom's ranges reserved for drama (check the current list).
- **Don't teach "spot the fake letterhead" as the defence.** MG-25 gives hints; the call back is the defence. At least one request per play has no visible flaw, so the player learns the route, not the cues.
- **Don't make the player an approver.** A helper from Operations wouldn't approve payments, and pretending otherwise would teach the wrong thing about roles. role_02 is where approvals are played.
- **No blame.** Lena slips and is thanked; the player who vouched for a fake is met calmly; Hassan tells his own near miss first.
- **No fear without action.** Every loss scene ends with what to do and with the action helping.
- **Don't overstate the safety nets.** Confirmation of Payee and the bank's reimbursement rules are described exactly as in `concepts.md`: a match isn't proof, and most organisations aren't covered.
- **Keep the chief executive sympathetic.** The real Gillian thanks the player for checking; fraudsters borrow leaders' names, and leaders want the check.
- **Keep the clock gentle.** The run can't be failed, and BE-04 lets players hide the clock.
- **Don't duplicate core_02.** Gift card requests stay in this module's concepts, check and micro-drill; core_02 plays the "chief executive on a new number" chat.
