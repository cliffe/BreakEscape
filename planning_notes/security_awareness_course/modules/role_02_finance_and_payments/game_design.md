# role_02 game design: Payment Run

## Concept

Friday afternoon, month end. The player is a finance officer in Larkspur's accounts payable team. Hassan has been off sick since Wednesday; his handover note says the run is prepared in Ledger, Eleni Markou (Financial Controller) is second approver while he's away, the cut-off is 16:00, and "don't let anyone rush you". The work is to review the thirty payments in the run, resolve anything odd and get two approvals in time. Four of the thirty must not go.

While the player works, the requests that target finance teams arrive one after another: "Hassan" writing from a personal email address, a "supplier" ringing to check its new details, a voicemail in the chief executive's voice, a customer emailing a photo of a card, and, worst of all, Bea in payroll realising that Kev's wages went to a fraudster because of an email she acted on on Tuesday. The module ends on Monday morning, with Hassan back and everyone seeing where Friday's decisions led.

It's a detective game with a clock: find the four in thirty, using the red flags Eleni teaches. The stories a player takes to lunch: "The voicemail was Gillian's voice. It wasn't Gillian." "The only password I typed all day was Hassan's, and Ledger believed it." "Kev got his money that night because Bea said 'I did that' straight away."

## Setting and cast

- **Rooms:** the finance office (`small_office_room2_1x1gu`, redressed as in core_11, with a cabinet and Hassan's empty desk); the meeting room (`room_meeting`) seen through glass, where Eleni's board pre-meeting runs from 15:00 and overruns.
- **The player:** a finance officer in accounts payable, with their own name and avatar.
- **Eleni Markou** (new; Financial Controller) is this module's mentor and the delegated second approver. 50s, Greek Cypriot British, dark hair with grey streaks held in a clip, reading glasses on a cord, navy cardigan, walks with a stick. Brisk, dry and kind: *"Late, I can explain. Lost, I can't."* She is on screen here, so she needs a full sprite.
- **Bea Thornton** (new; Payroll Supervisor, who leads the small payroll team; core_05's payroll officer, Sam Whitaker, works for her). 60s, white English from Lancashire, short silver hair, bright red reading glasses, thirty years at Larkspur. Warm, funny, knows everyone's birthday, a little old-school about email. She is the colleague who slips: on Tuesday she changed Kev's bank details because of an email that said it was from him. She owns up the moment she realises.
- **Hassan Qureshi** (Finance Manager) is off sick: he answers a text if the player checks, and is back on Monday for the debrief.
- **Kev Sutcliffe** (Warehouse Supervisor) rings Bea when his wages don't arrive, and drops into Monday's debrief. Gracious: *"It's not your fault, love. Somebody's a crook."*
- **Ama Owusu** gives one short explainer (card data, and "ring us").
- **Gillian Marsh**'s voice is cloned for a voicemail; the real Gillian answers on the company chat.
- **On chat:** Kai Murray (security), Tomasz Wiśniewski (DPO), Mei Lin Zhou (HR, who arranges Kev's emergency pay).
- **Voices on the phone only:** Lorna at Brackenfold Hygiene (as in core_11), "Paul from Brackenfold" (a fraudster), and the bank's fraud team.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Off sick, still emailing" (2 minutes)

- **(CP)** 14:20. On the desk: Hassan's handover note (`notes`). In the inbox (MG-01): an automatic reply from Hassan's work address to a query the player sent that morning (*"I'm off until Monday. For urgent payments please contact accounts payable."*), and a new email from "Hassan Qureshi" at a free webmail address:
- *"Hi, still off and my laptop's dead, so I'm on my personal email. Could you add the attached invoice to today's run? New supplier, Greyholme Facilities, £7,850 for the west depot deep clean. I've approved it and it has to go today or we lose the slot. Eleni knows. Don't ring, I've lost my voice! H"*
- The player can: set Greyholme up and add it to the run; reply to ask; text Hassan on his mobile from the staff directory; ask Eleni (in her office until 15:00); report it; or leave it. The response is the **baseline** for R02-B1.
- **Texts Hassan's known mobile:** two minutes later: *"Not me! In bed with a temperature. Please report it. Eleni's got you for the run."*
- **Asks Eleni:** *"Greyholme? Never heard of them. And Hassan doesn't approve anything from his personal email. Report it, please."*
- **Replies to the email:** *"Yes it's me, sorry, it really has to go today. Can't talk, voice is gone."*
- **Adds it to the run:** Greyholme sits in the run until Eleni's approval, where she asks *"Who set up Greyholme?"* (the control works; the decision is recorded).
- **Reports it:** Kai: *"Thanks. Hassan's name on a free-mail account, and his out-of-office told them who to write to. Blocked."*

### 2. Learn: "Two people, both checking" (4 minutes)

- **(CP)** Eleni comes to the player's desk (EX-01). Her opening follows the hook: *"You texted Hassan. Good. One text beats one mistake."* / *"You asked me. Exactly right."* / *"You added Greyholme. I'd have asked, and you'd have found out at four. Let's find out now instead."* / *"You reported it. Good. Now let's see why it nearly works."*
- Visual aids (BE-08), stepped:
  1. **The hook email,** annotated: the personal address; "I've approved it"; "Eleni knows"; and "don't ring", which blocks the check: *"When a message tells you not to check, check."* Then Hassan's automatic reply: *"That told them who to write to."*
  2. **The change process:** log it; ring the number held before the request; a second person approves; confirm to the known contact; watch the first payment.
  3. **Red flags in a run:** the table from `concepts.md` as a card she leaves on the player's desk for the Apply beat.
  4. **Two people, both checking:** *"Your login is yours. Nobody splits, nobody rushes, nobody approves their own. Late, I can explain. Lost, I can't."*
  5. **The first hour:** bank first, then evidence, security, the person affected, Report Fraud.
- **Ama** (one minute, at the door): *"Card numbers never by email or chat, and we never keep the security code. If anything feels off today, ring us. We'd rather take ten calls than miss one."*
- **Check question** (MG-20, opened with `#trigger_minigame:knowledge_check|r02_q_portal_change`): *"A supplier changed its bank details through the portal on Sunday night. Today is the first payment, and the name check says no match. What do you do?"* Hold it and ring the number from before the change / pay it, the change is in the system / email the supplier / retype the name until it matches.
- **Skip:** *"I've run payments for years."* Eleni: *"Then you'll enjoy the questions,"* and goes to the check question.
- **Optional topics:** *"What's a poisoned record?"*, *"What do I tell the bank?"*, *"Can I ever approve my own payment?"*, *"What if someone uses Larkspur's name?"*

### 3. Practise: "Desk Check" (4 minutes)

- **(CP)** Eleni opens the verification desk (MG-15 practice mode, from her conversation with a BE-19 tag; BE-07 for the stand-alone drill). Eight requests, harder than core_11's, with immediate feedback. In some, the player is the **second approver** and must challenge a colleague's evidence rather than gather their own.
  1. **New supplier set-up.** A colleague asks for a supplier to be added, with the bank details typed in the email. *Check the company exists; confirm the details by phone on a number from the contract; run the name check; then pass it to the second approver.*
  2. **The poisoned record** (second approver). Bea has prepared a bank change: *"Rang the number on our record, all fine."* The change history shows the record's phone number was itself changed nine days ago, "at the supplier's request by email". *Challenge it: ring the number from the set-up file. The supplier knows nothing about either change. Refuse, report, and repair the record.*
  3. **The friendly call.** "Brackenfold accounts" rings to "confirm the new details so the payment doesn't bounce". *Don't confirm or read out anything; say you'll ring back on the number you hold; report it.*
  4. **Payroll by email.** A member of staff emails from a personal address: new bank, please update before payday. *Refuse; they change it in the HR system; confirm with them directly; report it.*
  5. **The refund.** A care home says it paid an invoice twice and asks for the refund "to our new account". *Check the ledger (it did pay twice); refund only to the account the money came from; confirm with the customer on the number on record.*
  6. **Close match.** "Millrace Uniforms Limited" for "Millrace Uniforms Ltd". *The full registered name: pass it to the second approver* (calibration).
  7. **The test payment.** "Send a pound to our new account and we'll email to say it arrived." *An email confirmation proves nothing: ring the known contact on the number held before the request.*
  8. **A genuine change** (second approver). The letter came by post; the preparer rang the number from before, the known contact read the details back, a confirmation went to the address on record, and the name check matches. *Approve it* (calibration: the process ends in a yes).
- Two wrong answers in a row bring Eleni's one-line nudge: *"Which number, and from when?"*

### 4. Apply: "Find the four" (10 minutes)

- **(CP)** 14:35. A work task bar appears (BE-18): **Review the run**, then **Resolve the holds**, then **Two approvals by 16:00**. Ledger's run view (MG-15) on the desk computer (MG-27) lists thirty payments with columns for payee, amount, invoice, purchase order, bank details last changed (when, how and by whom), name check result and notes. Selecting a row opens the supplier record, its change history and the invoice (MG-25). Each row has a **Hold** button. Eleni's red-flag card sits beside the keyboard.
- **The four that mustn't go** (BE-13 draws variants each play; the four shapes stay):

| Row | What the data shows | What it is | Best response |
|---|---|---|---|
| Brackenfold Hygiene, £6,240 | Bank details changed on Sunday at 23:12 through the supplier portal; first payment to the new account; name check: no match | A taken-over supplier portal login | Hold it. Ring Brackenfold on the number from the set-up file: Lorna says they've changed nothing. Report it; repair the record |
| Millrace Uniforms, invoice 20817A, £3,412.50 | Same amount and order as invoice 20817, paid last week | A duplicate | Hold the duplicate; check with the budget holder |
| Ravensworth Advisory Ltd, £9,800 | Set up yesterday at 19:42 by s.kaur, who is on annual leave; no purchase order; £200 under the Financial Controller's limit | A colleague's account misused | Hold it; tell the security team now: an account may be compromised |
| Moorgate Print Ltd, £2,150 | New this month; the same bank account as Tarnside Paper Co | One payee is fake | Hold the newer one; check both |

- **Three that look odd but are fine** (calibration): Northbeck Supplies (no change, paid monthly for years); Holmeside Van Hire (bank changed last month, with the call to the number from before recorded by Bea and the change approved by Hassan; name check matches); Millrace Uniforms Limited (a close match that is its registered name). Holding one of these is never Not yet; Eleni explains why it's fine.
- **The interruptions**, scheduled through the afternoon:

| Time | What happens | What it tests | Best response |
|---|---|---|---|
| 14:40 | The desk phone (MG-04): *"Hi, it's Paul in accounts at Brackenfold. Just checking you've got our new bank details for today's payment? Can you read me what you've got?"* | R02-LO1 | Don't confirm or read out anything: *"I'll ring you back on the number we hold."* Report it |
| 14:55 | Kev rings Bea: his wages haven't arrived. Bea checks: his bank details were changed on Tuesday, after an email "from Kev" sent from a personal address. She turns to the player: *"I did that, on Tuesday. The email said it was him. Oh, Kev. What do I do?"* | R02-LO4, R02-LO5 | Lead the first hour (below) |
| 15:10 | A voicemail in Gillian's voice: *"It's Gillian. The Greyholme payment needs to go today. I've approved it. Don't wait for Eleni."* | R02-LO3 | Don't act on a voicemail. Check with Gillian on the company chat (her known account): *"Not me. I'm in the board meeting."* Report it |
| 15:20 | A care home's manager emails a photo of the home's card, front and back, to pay an overdue invoice: *"The security code's on the back."* | R02-LO6 | Don't use it. Delete it by the card data procedure (inbox and deleted items), reply without the card details with the secure payment link, and tell the security team as the procedure says |
| 15:45 | Eleni's meeting overruns; the cut-off is 16:00 | R02-LO3 | The approval decision (below) |

- **The first hour** (Kev's pay). The `command-board` timeline opens on the second screen and stamps each step with the game time as the player chooses it:
  - **Ring the bank's fraud line now.** The number is on the bank's contact card in Hassan's drawer (`container`), not on any message. The player reads the bank the details from the recovery pack (`forensic-data-platform`: payment, the email, a timeline tab), and the bank starts a recall.
  - **Keep the email; tell the security team.** Kai: *"Don't delete anything. We'll look at how it got in."*
  - **Tell the DPO.** Tomasz: *"A staff record changed without his say-so. I'll assess it. Thank you for telling me now."*
  - **Make sure Kev is paid today.** Mei Lin arranges an emergency payment.
  - **Check for other changes made the same way:** the run view filtered to "bank details changed by email this month" shows none left to pay.
  - **Report Fraud,** and note the reference for the bank.
  - Choices that look sensible and aren't: *"Kev should ring his own bank"* (his bank can't recall Larkspur's payment); *"Wait for Hassan on Monday"*; *"Delete the email so nobody else falls for it."*
  - A recovery bar labelled "illustrative" falls with game time: ringing the bank first, and fast, keeps more of it. Bea: *"Thank you for not making it worse."* One of the player's lines: *"You told us straight away. That's what gives Kev a chance."*
- **The approval** (15:45 to 16:00). The player signs the first panel of the reworked `dual-auth` panel ("Approver 1: accounts payable", with a checklist: holds resolved, name checks reviewed). The second panel reads "Approver 2: Financial Controller (delegate)". The choices:
  - **Message Eleni:** *"Run's ready. Two minutes?"* She steps out at 15:52, looks at the holds and signs. *Best.*
  - **Hold the run until Monday** and email the suppliers that payment will be a day late. *Also right: late is better than lost.*
  - **Sign in as Hassan** on his PC with the password from the sticky note in his drawer (`password`) and sign the second panel in his name. Ledger accepts it. *Not yet.*
  - **Take Bea's offer:** *"I've still got approver access from when I covered in 2023. I can press it."* *Not yet;* declining and asking IT to remove that leftover access is recorded as extra credit.
- **(CP)** The run is released at about 15:52 or held until Monday; either way the module moves on.

### 5. Debrief: "Monday morning" (2 to 3 minutes)

- **(CP)** A BE-16 time skip to Monday at 09:00. Hassan is back. The debrief screen (BE-02), then Hassan, Eleni and Bea at the finance desk, with Kev dropping in.
- For each of the four rows: found or missed, what it was, what checking looked like. For the call, the voicemail and the card email: what the player did and what good looks like.
- **Kev's timeline** from the command board: when each step happened, how much the bank froze (illustrative), and that Kev was paid on Friday. Kev: *"Got my money Friday night. Bea, you're a star for owning up."*
- **The approval.** If the player signed in as Hassan: Hassan: *"Ledger says I approved the run at two minutes to four on Friday. I was asleep. The system believes whoever types the password."* Then: *"And that sticky note was mine. It's gone, and the password's changed."* If the player reported the note instead: *"Thanks for telling me about the note. Embarrassing, and fixed."* If the player got Eleni or held the run: *"Late would have been fine. You did better than fine."*
- Per-outcome results, and **the line to remember:** *"Check the change, not the paperwork. Two people, both checking."*

### 6. Check (2 minutes)

- **(CP)** Kai's "spot check" on The Lark (MG-20): six items from the bank in `assessment.md`, one per learning outcome.

### 7. Reference

- **(CP)** The finance team card on The Lark (BE-09): the change process, the run red flags, approving, payroll and refunds, the first hour, card data; with the organisation's own approval rules, cut-off and card payment route (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| "Hassan's" personal email (hook) | Text Hassan's known mobile / ask Eleni / report / reply / add Greyholme to the run / leave it | R02-LO1, R02-LO3 (baseline) | Hassan's "Not me!"; Eleni's answer; or the attacker's reply; or Eleni's question at approval time |
| The four problem rows | Hold and resolve each / pay | R02-LO2 | Each held row opens its resolution (a call, a check with a budget holder, a security alert); a missed row is shown on Monday with what it cost |
| The calibration rows | Pay / hold | R02-LO2 | Holding one is thanked and explained, never marked Not yet |
| Brackenfold's "Paul" | Ring back on the number held / confirm the details / read them out | R02-LO1 | Reporting it lets Kai warn Brackenfold; confirming tells the fraudster the payment is due (the hold still protects it) |
| The voicemail | Check with Gillian through a channel already held and report / release Greyholme / ignore it | R02-LO3 | The real Gillian's "Not me"; or Eleni stops Greyholme at approval |
| The card photo | Delete by procedure, reply without the card details, send the payment link / take the payment from the photo / keep it "for next time" | R02-LO6 | Kai thanks the player and clears the mail system; the debrief explains what keeping it would have meant |
| Kev's pay: the first hour | Bank first, then the rest / the right steps in a slower order / "Kev should ring his bank" / wait for Monday | R02-LO4, R02-LO5 | The command board's timestamps and the illustrative recovery bar; Monday's scene |
| The approval | Fetch Eleni / hold until Monday / sign in as Hassan / take Bea's leftover access | R02-LO3 | Eleni's sign-off; or suppliers told it's late; or Monday's audit line in Hassan's name |

No option shames the player. Bea's slip is met with thanks for owning up, Hassan's sticky note is his own slip, and the worst approval choice is handled by Hassan with a dry joke and a fix.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-15 Payment verification desk**, run view | new (P2) | The thirty-row run: columns as above, a Hold per row, the selected row's record and change history, the name check column, and a release step. Configured with `run[]` and `anomalies[]` (its catalogue entry), drawn from BE-13. Practice mode for "Desk Check", with a "second approver" variant that shows a colleague's evidence to challenge |
| **MG-25 Document inspector** | new (P2) | Invoices against purchase orders and delivery notes (the duplicate), and letters against the record |
| **MG-04 Voice calls** | new (P2) | The inbound "Paul" call, Gillian's cloned voicemail, Lorna on the set-up number, the bank's fraud team |
| **MG-27 Work desktop** | new (MVP) | The player's computer: inbox, Ledger, The Lark |
| **MG-01 Inbox** | new | "Hassan's" email, Hassan's automatic reply, the card photo |
| **MG-20 Knowledge check** | new | Eleni's check question and the final check |
| `dual-auth` | existing; not registered or dispatched yet | The approval, after the rework in `features/minigames.md` section 4: two named sign-off panels with checklists, globals from data, no timer. The second panel completes on Eleni's event, or on a sign-off by whichever account is signed in (Hassan's, if the player uses the sticky note), and records which |
| `password` | existing | Hassan's PC: the temptation to sign in with the password from his drawer |
| `command-board` | existing | The first-hour timeline, configured through `commandBoard`, stamping entries as the globals for each step are set |
| `forensic-data-platform` | existing | The recovery pack read to the bank: tabs "Payment", "The email", "Timeline"; `confirmGateTab` on the payment tab; `confirmLabel` "Ring the bank's fraud line with these details"; `confirmedVar` `r02_bank_called`. Its completion actions need the `applyActions` fix in `features/minigames.md` section 4 to send a BE-01 record |
| `container` | existing | Hassan's drawer: the bank's contact card and the sticky note |
| `esd-pushbutton` | existing | A guarded **HOLD THIS PAYMENT** button per row in the text route (`authVar`, `activatedVar`, `completionActions`), with the plain office look the catalogue proposes |
| `notes` / `text-file` | existing | Hassan's handover note, the change procedure, the card data procedure |
| `phone-chat` / `person-chat` | existing | Hassan's text, the company chat with Gillian, Kai, Tomasz, Mei Lin; Eleni, Bea, Ama and Kev in person |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Two people, both checking | Eleni (EX-01) | 2 minutes | The annotated hook email and Hassan's automatic reply; the five-step change process; the red-flag card | "The portal change and the no match: what do you do?" |
| The first hour | Eleni | 45 seconds | The seven steps, bank first | Practise and Apply |
| Card data and "ring us" | Ama (EX-01) | 1 minute | Do and don't card: email, chat, security codes, the payment link | none (assessed in Apply) |
| Optional: "What is a poisoned record?" | Eleni | 30 seconds | A change history with the phone number edited nine days before the bank change | Practise item 2 |
| Optional video: "The month-end fraud in 60 seconds" | Recorded in engine (EX-02) | 60 seconds | Plays on the meeting room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Hassan, Eleni and Bea on Monday morning:

1. The four rows, found or missed, each with what it was and what checking looked like; the calibration rows the player held, if any, with why they were fine.
2. The call, the voicemail and the card photo: what the player did and what good looks like.
3. Kev's timeline from the command board, and that he was paid on Friday.
4. The approval: the audit line if someone else's name was used; thanks if the player fetched Eleni or held the run.
5. The before and after: "Hassan's" email against Gillian's voicemail, both pushing the same Greyholme payment.
6. Per-outcome results and the line to remember: *"Check the change, not the paperwork. Two people, both checking."*

## Variants

- **Micro-drill:** "Run Review" (BE-07): a ten-row run with one or two problem rows drawn from the bank (a changed account with a first payment, a duplicate, an odd set-up, a shared account, an amount split under a limit, a changed remittance email). About 4 minutes, monthly (HA-21).
- **Text route:** the run as an accessible table with row headers, filters as buttons and a Hold button per row (`esd-pushbutton`); row details as text; calls and the voicemail as dialogue with transcripts; the first hour as a sequence of choices with the clock shown as text (BE-03).
- **Facilitated session:** the run on a shared screen, with the team deciding each hold. Pause points: after the hook (*"Would you text a colleague who's off sick? When is that the right call?"*), after the run (*"Which row would we have missed here, and why?"*), after Bea's slip (*"What would make it easy for anyone here to say 'I did that' straight away?"*), after the approval (*"Who here has access they no longer need?"*). About 60 minutes.
- **Replay and randomisation:** BE-13 draws the run's thirty rows, which supplier carries each anomaly, the anomaly variants, the interruption order, the colleague's slip (a payroll change, a refund, a duplicate already paid) and the voicemail's sender. Suppliers, amounts, names and numbers are generated per game.

## Alternative concepts

1. **The Auditor (investigation).** A payment went wrong last month. Like an air accident investigator, the player rebuilds the timeline from Ledger's logs, emails, call records and the change history (`forensic-data-platform`, `command-board`), finds the three moments a check would have stopped it, and recommends fixes to Hassan and Eleni. Strong on why each control exists; less practice of the habit under time pressure.
2. **Month End Rush (arcade drill).** In the style of *Papers, Please*: payment requests slide in on a conveyor, the supplier register and the red-flag card are pinned to the wall, and the player stamps PAY or HOLD. It speeds up as the shift goes on. A fun micro-drill, but too far from a real finance screen for the main module.
3. **Red Team Finance (attacker view, EX-06, BE-11).** Jo Fairweather shows what an outsider can see about Larkspur's finance team: councils' published spending lists, a job advert naming Ledger, an automatic reply naming who covers payments. The player helps plan the authorised test's timing and pretext, then defends against it in a replay of the run. It shows how little a fraudster needs; never a how-to.

## Art and audio

- **Rooms:** the finance office (shared with core_11), the meeting room seen through glass.
- **Characters:** Eleni and Bea are new and on screen: full sprites and talk sheets. Hassan, Kev, Ama and Gillian need art (shared with other modules). Lorna, "Paul" and the bank's fraud team are voice only, with the `voice.fx` phone filter.
- **The voicemail** uses Gillian's own course voice, lightly phone-filtered: the lesson is that it sounds exactly like her.
- **Props:** Ledger's run screen, Hassan's drawer (the sticky note and the bank's contact card), the approval panel (`objects/dual_auth.png`, a placeholder already loaded in `public/break_escape/js/core/game.js:800`), Eleni's red-flag card, a card photo that is plainly fictional and mostly masked.
- **Voice:** about 40 lines for Eleni, 20 for Bea, 10 for Hassan, 6 for Kev, 5 for Ama, 4 for "Paul", 3 for Lorna and 1 voicemail. No voiced line prints a variable: amounts, payee names, account details and the player's name stay on screen.

## Pitfalls

- **Never use real card or bank numbers,** including published test card numbers: the card photo is a fictional design with most digits masked.
- **Keep the review fun, not a slog.** Thirty clear rows, filters, Eleni's card and a gentle nudge after four minutes. Every problem row is findable with the red flags taught in Learn (the standing rule: minigames should be fun and educational, not hard).
- **Late is a good outcome.** Holding the run until Monday is Secure; the game never treats a late payment as a failure.
- **No blame.** Bea is thanked for owning up, Kev is warm, and Hassan's sticky note is his own slip.
- **Don't teach voice-spotting.** The voicemail is meant to sound right; the lesson is the process (core_15 covers deepfakes).
- **Get the recovery facts right:** the paying organisation's bank starts a recall, and the employee's bank can't; the recovery bar is illustrative, never a statistic.
- **Card data at awareness level:** the organisation's procedure, not a QSA's checklist; phone payments belong to role_06.
- **Don't let anyone type a real credential.** The only password in the module is Hassan's fictional one on the sticky note.
