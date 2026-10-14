# role_02: Finance and payments

**Working game title:** Payment Run
**Pitch:** Run month-end payments with your manager off sick and the cut-off coming, find the four payments in thirty that mustn't go, and lead the first hour when a colleague's pay goes to the wrong account.

| | |
|---|---|
| Audience | Finance, payroll and accounts payable staff; anyone who sets up suppliers, changes bank details, approves payments or takes card payments |
| Prerequisites | core_11 recommended (or its test-out): this module assumes its basics and goes deeper |
| Full module | 25 minutes |
| Micro-drill | 4 minutes ("Run Review": find the problem rows in a ten-line payment run) |
| Text route | 15 minutes |
| Priority | Phase 2 |
| Build size | M, driven by MG-15's payment-run view and the reworked `dual-auth` panel; the rest reuses core_11's desk and existing minigames |

## Why this module

Finance teams are targeted because they can move money. In 2025, UK businesses lost £28.0 million to invoice and mandate scams, 68% of all such losses, and only about £10.6 million of it was returned. UK Finance's explanation is the finance team's daily reality: businesses make genuine high-value payments so often that a fraudulent one is harder to spot and stop. CEO fraud cost £5.6 million at an average of just over £28,000 a case (UK Finance, *Annual Fraud Report 2026*). The UK's mandatory reimbursement rules cover individuals, micro-enterprises and small charities, not organisations of Larkspur's size (Payment Systems Regulator), so the finance team's checks are the protection.

The risks cluster where finance work is busiest: month end, holiday cover and sickness, cut-off times, and changes nobody has time to check properly. They come through suppliers (bank detail changes, fake and duplicate invoices), through "the boss", through payroll (staff pay diverted by email requests or phished self-service logins) and through refunds. Staff who take card payments also carry duties under PCI DSS.

- **Google and Facebook, 2013 to 2015:** more than US$100 million paid to a fraudster posing as a real supplier, using lookalike addresses and fake invoices (US Department of Justice, 2019; see core_01's concepts).
- **Payroll diversion, 2018:** the FBI warned that criminals were phishing employees' payroll logins and changing where their salaries went, hitting education, healthcare and airlines first (IC3 I-091818-PSA).
- **Councils' own advice:** the Local Government Transparency Code 2015 makes councils in England publish every payment over £500, and its Annex B suggests the controls this module teaches: accept bank changes only in writing, verify them using existing contact details, and keep the people who authorise apart from the people who make changes.

## Target behaviours

1. **Verifies** every new payee and every change of bank details independently: a call to a number held before the request, a second person, and no action on an email, letter, portal change or phone call alone.
2. **Reviews the run and holds** anything that doesn't add up, even at the cut-off, and **never bypasses dual control** (no approving your own work, no one else's login or leftover access, no splitting, no "pay now, approve later").
3. **Starts recovery at once** when a payment may have gone wrong, with the bank's fraud line first, and **handles card data safely**.

## Learning outcomes

After this module, finance staff can:

- **R02-LO1** Apply the supplier set-up and bank detail change process: verification on a number held before the request, a second person, Confirmation of Payee, and a confirmation to the supplier's known contact; and recognise when the "number on record" itself can't be trusted.
- **R02-LO2** Review a payment run and identify red flags in the data: a first payment to recently changed details, a no match, a payee without an order, a duplicate invoice, two suppliers sharing an account, a payee set up at an odd time or by an odd user.
- **R02-LO3** Keep dual control and segregation of duties under pressure (month end, sickness cover, senior requests, cut-offs) and say no to bypasses.
- **R02-LO4** Handle payroll and refund changes safely: staff bank details only through HR's route with direct confirmation, and refunds only to the original account after checking.
- **R02-LO5** Lead the first hour after a suspected fraudulent payment: the bank's fraud line, evidence, the security team (and the DPO where staff data changed), the person or supplier affected, Report Fraud.
- **R02-LO6** Handle payment card data within the PCI DSS basics: never keep the security code, never send or accept card numbers by email or chat, keep numbers masked, and use the approved payment route.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2; this matches the module's row in its coverage matrix, plus PCI DSS 9.5.1.3):

- **ISO 27001 cl. 7.2** (competence for people whose work affects information security) and **ISO 27001 A.6.3**.
- **NIST AT-3** (role-based training) and **NIST AT-2(3)** (social engineering, including impersonation and thread-jacking).
- **CIS 14.9** (role-specific awareness and skills training; IG2 and IG3), building on CIS 14.2 from core_11.
- **PCI DSS 12.6.1** (staff aware of their role in protecting card data) and **PCI DSS 12.6.3.1**; **PCI DSS 9.5.1.3** in part, for staff who use card terminals.
- **NCSC CAF B6.b.**
- **NIS2 IR 8.2** (role training, for the digital entity types the Implementing Regulation covers); **DORA Art 13(6)** (training that fits the role, for EU financial entities).
- US customers: **NYDFS 500.14(a)(3)**; **SOC 2 CC1.4**.

The card data beat teaches the staff behaviours behind three technical requirements: card security codes not kept after authorisation (PCI DSS 3.3.1.2), card numbers masked when displayed (PCI DSS 3.4.1) and no unprotected card numbers sent by end-user messaging (PCI DSS 4.2.2). Training supports these; it doesn't meet them, and they aren't training requirements, so they aren't in the mapping. The same goes for segregation of duties (ISO 27001 A.5.3). For council customers, the module teaches the payment controls in Annex B of the Local Government Transparency Code 2015.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Friday 14:20, month end. "Hassan", off sick, emails from his personal address: add a new supplier's invoice to today's run, "I've approved it", "don't ring, I've lost my voice". The player's response is the baseline | Game (MG-27, MG-01) | 2 |
| Learn | Eleni (Financial Controller) takes the email apart, with Hassan's out-of-office reply that told the fraudster whom to target; the change process, red flags in a run, dual control, Confirmation of Payee in a run, the first hour; Ama on card data | NPC explainer with visual aids (EX-01, BE-08) | 4 |
| Practise | "Desk Check": eight requests at the verification desk, including a "poisoned" supplier record, a refund to a new account and a payroll change | Minigame (MG-15, MG-25) | 4 |
| Apply | The month-end run: thirty payments, four that mustn't go. A "supplier" rings to check today's payment; a voicemail "from the chief executive"; a customer emails a photo of a card; Bea realises Kev's pay went to a fraudster; Eleni is in a meeting as the 16:00 cut-off nears | Game (BE-18, MG-15 run view, MG-04, `dual-auth`, `command-board`) | 10 |
| Debrief | Monday morning: Hassan is back; the four rows, the calls, the approval, Kev's recovery timeline | Debrief screen (BE-02), Hassan, Eleni and Bea | 2 to 3 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The finance team card: the change process, run red flags, approving, the first hour, card data | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** the finance office (`small_office_room2_1x1gu`, redressed as in core_11); `room_meeting` seen through glass, where Eleni's board pre-meeting runs over.
- **The existing `dual-auth` minigame** (`public/break_escape/js/minigames/dual-auth/`): the run's two-person approval. It exists but is not registered in `minigames/index.js` or dispatched; today it takes PINs, writes sis01's globals and runs a fixed five-minute countdown. After the rework in `features/minigames.md` section 4, each panel is a named sign-off by whoever is signed in to Ledger, with a short checklist: the player signs the first; the delegated approver signs the second. sis01's scenario already states the principle the module tests: two approvers only count if they are two different people (its codes "must be distinct so the dual-auth panel cannot be solved with one shared code", `scenarios/sis01_healthcare/scenario.json.erb`, line 123).
- **`password`**: Hassan's PC. The sticky note in his drawer holds his Ledger password; typing it would sign the player in as Hassan, and the second panel would then show his name.
- **`log-filter`**: the nearest existing pattern for the payment-run table: filter chips, a table, and lookups that follow the selected row (`threatIntel` and `accountHistory`, which here become the supplier record and its change history). Today its columns are fixed (`vpn`, `ics_rdp`) and only one anomaly row can be flagged, so MG-15's run view extends rather than reuses it.
- **`command-board`**: the recovery hour as a timeline that stamps entries when globals change ("15:02 bank fraud line called", "15:09 security told"). Its defaults are sis01's, overridden through the scenario's `commandBoard` key; no injects or decision cards are needed here, so this doesn't wait for MG-24.
- **`esd-pushbutton`**: a guarded **HOLD THIS PAYMENT** button with a confirm modal (`authVar`, `activatedVar`, `completionActions`) for the row holds in the text route.
- **`forensic-data-platform`**: the "recovery pack" Bea and the player read to the bank (payment, email and timeline tabs), with a gated confirm.
- **`container`**: Hassan's desk drawer, holding the bank's contact card (needed for the recovery hour) and a sticky note with his Ledger password (a temptation, and a finding to report).
- **`notes`** and **`text-file`**: Hassan's handover note, the change procedure, the emails.
- **Patterns:** sis02's call-back refusal (`scenarios/sis02_energy/ink/npc_tom_hadley.ink:136-171`); core_11's verification desk and characters.
- **Systems:** the game clock (`systems/game-clock.js`) and `timers[]` for the 16:00 cut-off and the scheduled interruptions; objectives for the work task.

## New features needed

- **MG-15 Payment verification desk**, with a **payment-run view**: a table of payments with a hold per row, a lookup to the supplier record and change history for the selected row, a Confirmation of Payee column, and a release step. The catalogue line covers single requests; the run view should be added to its description.
- **MG-25 Document inspector:** invoices against orders and delivery notes; letters against the supplier record.
- **MG-04 Voice calls:** the inbound "supplier" call, the voicemail, ringing record numbers, ringing the bank's fraud line.
- **MG-01 Inbox**, **MG-20 Knowledge check**, **BE-01** and **BE-02**.
- **BE-08 Visual aids:** the annotated hook email, the change process, the run red flags.
- **MG-27 Work desktop:** the player's computer, launching the inbox, Ledger and The Lark.
- **BE-09 Intranet terminal**, **BE-05 Organisation profile** (approval rules, cut-offs, the card payment route), **BE-13 Content banks** (run data, anomalies, requests), **BE-16 Time skips** (Monday), **BE-18 Work task and interruptions**, **BE-19 Open minigames from conversations and events** (Eleni's check question, `#trigger_minigame:knowledge_check|r02_q_portal_change`, and the drill), **BE-07 Micro-drill launcher** ("Run Review").
- **The `dual-auth` rework** (`features/minigames.md` section 4; no id): register and dispatch it, named approver panels with a checklist instead of PINs, globals from data, no timer by default. This module also needs the second panel to complete on the approver's own event (Eleni signing off), and to record which account signed each panel and at whose keyboard, so the debrief can show a sign-off made in someone else's name.

## Organisation-specific content

- Approval limits, delegations, and who approves when the usual approver is away.
- Payment cut-off times, and how to tell suppliers about a late payment.
- The bank detail change procedure: who verifies, what evidence is kept, whether a confirmation goes to the supplier's known contact.
- Whether suppliers can change details through a portal, and what alerts that raises.
- The payroll change route, and how payroll confirms a change with the employee.
- The refund policy.
- Whether the organisation takes card payments, the approved route (for example a payment link or terminal), and the procedure for card details received by email.
- Who holds the bank's fraud line details; the security team, DPO and HR contacts for an incident; the police route by nation.

These go in the organisation's HA-26 setup checklist alongside core_11's slots.

## Open questions

1. **Signing off in someone else's name.** Should the player be able to sign in as Hassan with the password from the sticky note, or accept Bea's leftover approver access? *Recommendation: yes, as an ethical choice with a consequence; Ledger can't tell who was at the keyboard, which is the lesson.*
2. **Card data beat.** *Recommendation: on by default, with an organisation switch (HA-11) for organisations that take no card payments, which swaps in a second refund or payroll item.*
3. **Thirty rows on small screens.** *Recommendation: thirty on desktop; fifteen on small screens with the same four problem rows.*
4. **Kev as the payroll victim.** Kev Sutcliffe is recurring cast. *Recommendation: yes: he is warm about it, and it shows the human cost without anyone being the villain.*
5. **A supplier portal in Ledger.** *Recommendation: yes in the fiction; it is common at Larkspur's size and shows a fraudulent change with no Larkspur person at fault.*

