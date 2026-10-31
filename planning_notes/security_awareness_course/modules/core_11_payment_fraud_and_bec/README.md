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

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2; this matches the module's row in its coverage matrix):

- **PCI DSS 12.6.3.1** (phishing and related attacks, and social engineering), alongside core_01 and core_02, which together meet it. Training doesn't satisfy the technical anti-phishing control in PCI DSS 5.4.1, and the control doesn't satisfy the training.
- **CIS 14.2** (recognise social engineering attacks; business email compromise was added in v8.1).
- **NIST AT-2 and AT-2(3)** (social engineering and mining, including impersonation and thread-jacking).
- **ISO 27001 A.6.3.**
- **NCSC CAF B6.b**; **DSPT 3.2.1** (categories 3 and 4).
- **NIS2 Art 21(2)(g)**; **NIS2 IR 8.1** (only for the digital entity types the Implementing Regulation covers); **DORA Art 13(6)** (EU financial entities).
- US customers: **NYDFS 500.14(a)(3)** (annual training including social engineering); **FTC 314.4(e)**.

The module also gives staff outside Finance awareness of the organisation's segregation of duties (ISO 27001 A.5.3). That is a control, not a training requirement, so it is not listed in the mapping.

## Build status

**Company and host:** Brightwell Foods, a food manufacturer (`BRAND_SET.md`). Host Adaeze Okafor, finance manager (the built E1 host). The executive strand runs at Merrin & Sallow Architects. There is no recurring course mentor: each episode's host and its debrief carry the teaching.

This module is **largely built**. Its core is delivered by three shipped episodes in the attack-then-defend shape, plus the six finance pre and post check forms (`research/built_episodes_vs_plan.md` §2, and the scenario files under `scenarios/awareness_*`):

- **Built, E1** `awareness_e1_invoice_fraud` (Brightwell, finance): invoice and bank-detail fraud. Covers C11-LO1 to LO4: the warning pattern of money plus pressure, why a genuine-looking sender proves nothing, calling back on the number on record, and keeping to the controls. Its defend set `e1_payments_inbox` and the finance check forms (`finance_form_a`, `finance_form_b`) are the measured items.
- **Built, E7** `awareness_e7_voice_ceo` (Brightwell, everyone): the cloned-CEO-voice email beside the finance line. Reinforces LO1 and LO4 and the "verify, do not trust the ear" point (shared with core_15).
- **Built, E4** `awareness_e4_exec_whaling` (Merrin & Sallow, executive): the "about to board, pay this" whaling email. Reinforces LO1 and LO4 from the PA's side.
- **Built, checks:** `awareness_{pre,post}_finance_{ab,ba}`, four phish in ten, matched A and B forms (mirror pairs), `passPercent` 0, Verify off; the executive forms add the voicemail items.

**New (builds on E1 and the finance checks):** this plan adds only two things the build lacks, in the built shape:

- **Confirmation of Payee** (C11-LO5): read "no match" as stop and check, and "match" as the name only, added as defend items and check items with mirror pairs.
- **What to do once money has gone** (C11-LO6): the first steps (ring the bank first, then security, then Report Fraud), delivered as a short ordered debrief card and as check items.

The deeper finance treatment (the payment verification desk, two-person approval, the recovery scene) remains as plan for **role_02**, not as a separate all-staff module.

## Module flow

Recast in the built episode shape. The pre and post checks are separate finance check missions that bracket whichever episodes an organiser sets between them; only the defend half and the checks are scored.

| Stage | What happens | Format | Scored |
|---|---|---|---|
| Pre-check | The finance role check: one parallel form of 10 spot-the-item messages, no pass mark | Check mission (built) | Measured, not scored |
| Brief and scope | "Authorised exercise at Brightwell Foods (fictional). Scope: this inbox, these people." Host Adaeze Okafor welcomes the learner | Episode runner | No |
| Attack half | Look at two public sources, then compose one email "from" a known supplier asking to change bank details on an open invoice, blanks filled only from the facts found; red-flag meter on | OSINT browser, mail client in template mode | No (one artefact, capped) |
| Flip | The learner's own message arrives in a payments inbox with its tells highlighted | Flip view | No |
| Defend half | Triage the payments inbox with Trust, Report, Delete and Verify; the Confirmation of Payee results and the "money has gone" steps are the extension this plan adds | Inbox triage (awareness profile) | Scored |
| Debrief | Per-item reasoning cards, the team-protected tally, the shared habit to keep, the "On Monday" card, the customer reporting route, the no-blame line | Debrief view | Debrief |
| Post-check | The other finance form; shows the change from the pre-check | Check mission | Measured |

E7 and E4 are sibling episodes delivering the same outcomes with cloned voice and executive whaling.

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations desk, shared with core_01); `small_office_room2_1x1gu` redressed as the finance office (behind the badge door described in `03_WORLD_AND_CAST.md`), shared with role_02; `room_ceo` seen through the glass, empty, because the chief executive is at a conference.
- **Conversations:** `person-chat` for Hassan and Ama; `phone-chat` for the team chat, Lena's message and the company chat with the chief executive; `person-chat` video-call mode (`person-chat-ui.js`) for Eleni approving remotely and the real Gillian's thank-you. Its status bar says "SECURE VIDEO LINK" (hard-coded at `person-chat-ui.js:253`) and needs to read "Brightwell Meet" or similar.
- **Documents:** `notes` and `text-file` for the supplier directory, Hassan's desk card, the payment list and the delivery notes.
- **The existing `dual-auth` minigame** (`public/break_escape/js/minigames/dual-auth/`): two named approver panels and an AUTHORISE button, used here as the payment run's two-person approval, which the player watches Hassan and Eleni complete. It exists but is not registered in `minigames/index.js` or dispatched, and sis01's only object for it is commented out. Today it takes a PIN on each panel, writes sis01's globals (`network_isolation_authorised`, `network_isolated` and others) and runs a fixed five-minute countdown; its labels can already be set through `minigameData` (`dual-auth-text.js`). This module relies on the rework in `features/minigames.md` section 4 (see New features needed).
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
- **BE-19 Open minigames from conversations and events:** Hassan opens his check question (`#trigger_minigame:knowledge_check|c11_q_which_number`) and the drill (the same tag naming MG-15's scene) from his explanation.
- **BE-07 Micro-drill launcher:** "Change or No Change?" (P2).
- **MG-27 Work desktop:** the player's computer at both desks, launching the inbox, Ledger (MG-15), the company chat and the staff intranet.
- **The `dual-auth` rework** (`features/minigames.md` section 4; it has no id): register and dispatch the existing minigame, named approver panels with a checklist instead of PINs, globals from data, and no timer by default. This module also needs the second panel to complete on the approver's own event (Eleni signing off on her video call), since the player never approves here.

## Organisation-specific content

- The payment change procedure: who verifies, how, and who approves.
- Approval rules: the two-person rule and any thresholds.
- Who staff tell if money may have gone (Brightwell: the Finance Manager, or the 24/7 service desk out of hours). Staff don't need the bank's number: Finance holds it.
- How staff change their own bank details for pay (Brightwell: only in the HR system, signed in from the staff intranet).
- Whether staff ever buy gift cards for work, and how (Brightwell: never because of an email or message; only through procurement).
- Who can approve invoices, and what they must check (Brightwell: the budget holder confirms the goods or service was ordered and received).
- The reporting route (Report suspicious button; security team on 4444) and the police route by nation: Report Fraud in England, Wales and Northern Ireland; Police Scotland on 101.

These belong in the organisation's HA-26 setup checklist, so the reference card never shows Brightwell's defaults to a customer's staff by mistake.

## Open questions

1. **Gift cards.** core_02 already plays a "chief executive" chat asking for gift cards. *Recommendation: keep gift cards out of this module's game and in its concepts, check and micro-drill bank, so the two modules don't stage the same scene.*
2. **Does the player approve payments?** *Recommendation: no. A helper from Operations would not be an approver; here the player prepares the list and watches Hassan and Eleni approve. role_02 makes the player an approver.*
3. **The recovery meter.** If Lena's invoice is paid, should the next-morning scene show a percentage? *Recommendation: no number; a bar labelled "illustrative", so nobody quotes it as data.*
4. **The hook sender.** Real Northbeck domain (a taken-over mailbox) or a lookalike? *Recommendation: draw either per play (BE-13) and say which in the debrief: the check is the same.*

