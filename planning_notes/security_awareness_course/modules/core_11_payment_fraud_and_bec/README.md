# core_11: Payment fraud and business email compromise

**Working game title:** Change of Details
**Pitch:** Lend a hand in Finance on payment-run day, while convincing requests to change bank details, rush a payment or pay an invoice nobody ordered arrive among the real ones, and learn the habit that stops payment fraud: check on a number you already have.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended; core_01 helps (Northbeck and Dawn appear there) but isn't needed |
| Full module | 15 minutes |
| Micro-drill | 4 minutes ("Change or No Change?") |
| Text route | 10 to 12 minutes |
| Priority | Phase 2 |
| Build size | M, driven by MG-15 (payment verification desk) and MG-25 (document inspector), which role_02 reuses in depth, plus registering the existing `dual-auth` minigame |

## Why this module

Payment fraud needs no malware and no stolen password: it needs one person to believe one message. In 2025, customers of UK banks lost £41.3 million to invoice and mandate scams (2,305 cases), 68% of it (£28.0 million) from business accounts, and only about £10.6 million of the business losses was returned. CEO fraud cost £5.6 million, and at just over £28,000 per case it had the highest average loss of any scam type (UK Finance, *Annual Fraud Report 2026*). In the US, the FBI received 24,768 business email compromise complaints in 2025, with reported losses of just over US$3 billion (IC3, *2025 Internet Crime Report*). These count only what is reported.

The UK's mandatory reimbursement rules for this kind of fraud protect individuals, micro-enterprises (fewer than ten staff) and charities with an income under £1 million (Payment Systems Regulator). Most organisations taking this course are not covered: once the money has gone, it comes back only if the bank can recover it quickly.

These requests rarely land in Finance first. They reach whoever knows the supplier, whoever covers the inbox, or a manager approving invoices between meetings. That is why this is an all-staff module.

- **Google and Facebook, 2013 to 2015.** A fraudster posing as a real hardware supplier, with lookalike email addresses and fake invoices, was paid more than US$100 million (US Department of Justice, 2019 guilty plea; see core_01's concepts).
- **Published payments as a fraudster's map.** Councils in England publish every payment over £500 with the payee's name (Local Government Transparency Code 2015). The code itself warns councils about payment fraud and advises them to verify bank detail changes using existing contact details. Public information tells fraudsters who pays whom.

## Target behaviours

1. **Checks** any change of bank details, or any unusual payment request, by calling back on a number already on record (the supplier record or the staff directory). Never uses the contact details in the request, and never vouches for a change they haven't checked.
2. **Keeps to the payment process** whoever is asking: two people approve, no splitting a payment to get under a limit, no "pay now, approve later". Reports the attempt.
3. **Raises the alarm straight away** if money may have gone to the wrong place, including after their own or a colleague's mistake, so Finance can ring the bank while there is still a chance of recovery.

## Learning outcomes

After this module, staff can:

- **C11-LO1** Recognise the common forms of payment fraud (bank detail changes, fake invoices, chief executive fraud, gift card requests, payroll diversion) and the warning pattern: money or a change of payment details, plus urgency, secrecy or a request to skip the usual process.
- **C11-LO2** Explain why a genuine-looking sender, letterhead or phone call proves nothing: mailboxes are taken over, addresses are faked, letterhead is copied, and the number in the request may be the fraudster's.
- **C11-LO3** Check a payment request or a change of details by calling back on a number already on record, and pass changes to Finance without vouching for them.
- **C11-LO4** Keep to the payment controls under pressure, including from senior names, approve only invoices for things they know were ordered, and say no politely.
- **C11-LO5** Read Confirmation of Payee results correctly: "no match" means stop and check; "match" only means the name fits the account, not that the request is genuine.
- **C11-LO6** Act fast if money may have gone (tell Finance at once so they ring the bank, then the security team), and report attempts even when nothing was paid.

## Compliance coverage

Contributes to (short references follow core_01; `02_COMPLIANCE_MAPPING.md` was not yet present when this was written):

- **PCI DSS v4.0.1** 12.6.3.1 (awareness of phishing and related attacks and social engineering) and 12.6.3 (training on hire and at least every 12 months). PCI notes that training does not meet the technical anti-phishing requirement in 5.4.1.
- **ISO/IEC 27001** clause 7.3 and Annex A 6.3; Annex A 5.3 (segregation of duties) at awareness level.
- **NIST SP 800-53** AT-2 and AT-2(3) (social engineering).
- **CIS Controls v8.1** 14.2 (recognise social engineering attacks, which since v8.1 names business email compromise).
- **NIS2** Article 21(2)(g) (basic cyber hygiene practices and training).
- **NCSC CAF** B6 (staff awareness and training).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | At the player's Operations desk, "Dawn at Northbeck" emails new bank details and asks the player to pass them to accounts before this week's run. Their response is the baseline | Game (MG-01, MG-04) | 1 to 2 |
| Learn | Hassan takes the email apart, tells his near miss, and gives the rule: call back on the number on record, two people approve, report; Confirmation of Payee; if money's gone, ring the bank | NPC explainer with visual aids (EX-01, BE-08) | 2 to 3 |
| Practise | "Change or No Change?": six requests at the verification desk, getting harder | Minigame (MG-15, MG-25) | 2 to 3 |
| Apply | Holiday cover in Finance: prepare the afternoon's payment list while another supplier's bank change, an urgent "chief executive" payment and Lena's message about an invoice she shouldn't have approved arrive | Game (BE-18, MG-01, MG-15, MG-25, MG-04) | 5 to 6 |
| Debrief | Each request, the clue, what checking looked like, what happened; the real chief executive says thank you | Debrief screen (BE-02), Hassan and Ama | 1 to 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | "Change of details? Call the number you already have." card on The Lark | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations desk, shared with core_01); `small_office_room2_1x1gu` redressed as the finance office (behind the badge door described in `03_WORLD_AND_CAST.md`), shared with role_02; `room_ceo` seen through the glass, empty, because the chief executive is at a conference.
- **Conversations:** `person-chat` for Hassan, Ama and Lena; `phone-chat` for the team chat, Lena's message and the company chat with the chief executive; `person-chat` video-call mode (`person-chat-ui.js`) for Eleni approving remotely and the real Gillian's thank-you. Its status bar says "SECURE VIDEO LINK" (hard-coded at `person-chat-ui.js:253`) and needs to read "Larkspur Meet" or similar.
- **Documents:** `notes` and `text-file` for the supplier directory, Hassan's desk card, the payment list and the delivery notes.
- **`dual-auth`** (`public/break_escape/js/minigames/dual-auth/`): two named PIN pads and an AUTHORISE button, used here as the run's two-person approval, which the player watches Hassan and Eleni complete. It exists but is not exported or registered in `minigames/index.js`, sis01's object is commented out (`scenarios/sis01_healthcare/scenario.json.erb`, the "DISABLED" block after the MG-11 note), and on AUTHORISE it writes sis01's globals (`network_isolation_authorised`, `network_isolated`) and runs a fixed five-minute countdown. Its labels can already be set through `minigameData` (`dual-auth-text.js`). See New features needed.
- **`forensic-data-platform`**: tabs of typed blocks with a gated confirm (`confirmGateTab`, `confirmLabel`, `confirmedVar`). Until MG-15 exists it can show a change request as "The email", "The letter", "Supplier record" and "Change history" tabs, with "Hold this change and report it" enabled once the record tab has been read.
- **Patterns:** sis02's managed security provider refusing a change on someone's say-so and ringing back on the number it holds (`scenarios/sis02_energy/ink/npc_tom_hadley.ink:136-171`), the model for Hassan's rule; timed arrivals as in `scenarios/timed_messages_example`; event mappings for Lena's message.
- **Systems:** the game clock (`systems/game-clock.js`) for the 15:30 payment run; objectives (`systems/objectives-manager.js`) for the work task bar; `voice.fx` phone filtering (`README_scenario_design.md`, "Voice FX") for callers.

## New features needed

- **MG-15 Payment verification desk:** the core of Practise and Apply: the request beside the supplier or staff record, a "call the number on record" action, Confirmation of Payee results, and hand-off to a second approver.
- **MG-25 Document inspector:** the letterhead letter against the supplier record, with differences marked and a note that a perfect match proves nothing.
- **MG-04 Voice calls:** calling Northbeck and Brackenfold on the record numbers, and the numbers in the letters, which reach a smooth fraudster. Until MG-04 exists, phone NPCs in `phone-chat` can stand in.
- **MG-01 Inbox:** the player's own inbox in the hook and the Finance shared inbox in Apply.
- **MG-20 Knowledge check**, **BE-01 Assessed decisions** and **BE-02 Debrief screen**.
- **BE-08 Visual aids:** the annotated hook email and letter, the Confirmation of Payee strip.
- **BE-09 Intranet terminal:** the supplier directory and the reference card.
- **BE-05 Organisation profile:** the change procedure, approval rules and urgent Finance contact on screen.
- **BE-13 Content banks:** request variants, real-domain and lookalike plays, Confirmation of Payee results, per-game names and domains.
- **BE-16 Time skips:** the next morning, if Lena's invoice is paid.
- **BE-18 Work task and interruptions:** the payment list and its timed arrivals.
- **BE-19 Open minigames from conversations and events:** Hassan opens the drill from his explanation.
- **BE-07 Micro-drill launcher:** "Change or No Change?" (P2).
- **proposed:** Dual authorisation panel, register and generalise the existing `dual-auth` minigame: export and dispatch it, make the globals it writes and its status texts configurable (today they are sis01's), make the countdown optional and off under BE-04, rename the `itsec`/`clinical` keys to first and second approver, and add a mode where the second panel is completed by an event (a remote approver) rather than typed in by the player. A small task; role_02 needs the same.

## Organisation-specific content

- The payment change procedure: who verifies, how, and who approves.
- Approval rules: the two-person rule and any thresholds.
- Who staff tell if money may have gone (Larkspur: the Finance Manager, or the 24/7 service desk out of hours). Staff don't need the bank's number: Finance holds it.
- How staff change their own bank details for pay (Larkspur: only in the HR system, signed in from The Lark).
- Whether staff ever buy gift cards for work, and how (Larkspur: never because of an email or message; only through procurement).
- Who can approve invoices, and what they must check (Larkspur: the budget holder confirms the goods or service was ordered and received).
- The reporting route (Report suspicious button; security team on 4444) and the police route by nation: Report Fraud in England, Wales and Northern Ireland; Police Scotland on 101.

## Open questions

1. **Gift cards.** core_02 already plays a "chief executive" chat asking for gift cards. *Recommendation: keep gift cards out of this module's game and in its concepts, check and micro-drill bank, so the two modules don't stage the same scene.*
2. **Does the player approve payments?** *Recommendation: no. A helper from Operations would not be an approver; here the player prepares the list and watches Hassan and Eleni approve. role_02 makes the player an approver.*
3. **The recovery meter.** If Lena's invoice is paid, should the next-morning scene show a percentage? *Recommendation: no number; a bar labelled "illustrative", so nobody quotes it as data.*
4. **The hook sender.** Real Northbeck domain (a taken-over mailbox) or a lookalike? *Recommendation: draw either per play (BE-13) and say which in the debrief: the check is the same.*

