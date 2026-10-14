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

<!-- continue -->
