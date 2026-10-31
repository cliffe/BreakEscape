# role_02: Finance and payments

**Working game title:** Payment Run
**Pitch:** Finance staff defend the payments inbox against supplier bank-change fraud and a cloned chief executive, then learn the extras their role needs: payroll diversion, Confirmation of Payee and the first hour after money has gone.

| | |
|---|---|
| Audience | Finance, payroll and accounts payable staff; anyone who sets up suppliers, changes bank details, approves payments or takes card payments |
| Built foundation | Episodes E1 (invoice and bank-detail fraud) and E7 (cloned CEO voice), and the finance check pair, all at Brightwell Foods |
| Company | Brightwell Foods (`brightwellfoods.example`); E1 host Adaeze Okafor, E7 host Agnieszka Duda |
| Prerequisites | core_11 recommended: this module assumes its basics and goes deeper |
| Full episode (each) | About 15 minutes (E1), about 16 (E7) |
| Defend-only variant | About 8 minutes |
| Pre and post check | about 9 minutes each (the finance pair) |
| Priority | Phase 2 |
| Build size | S to M. Most is built (E1, E7, the finance checks); the role extension is one new episode in the built shape plus concept cards and defend items |

## Build status

- **Built, this module builds on it:**
  - **E1 *Invoice and bank-detail fraud*** (`scenarios/awareness_e1_invoice_fraud`), Brightwell Foods, host Adaeze Okafor. The learner researches two sites, composes one "change our bank details on INV-2217" email as a supplier, sees it flipped, then defends the payments inbox (per the scenario file: 6 emails, 3 phish, Verify on). Covers R02-LO1 and LO2 in part.
  - **E7 *Cloned CEO voice*** (`scenarios/awareness_e7_voice_ceo`), Brightwell Foods, host Agnieszka Duda. One email in the chief executive's name plus the finance line (3 voicemails and 2 emails, 2 phish, Verify on, voice panel). Covers R02-LO3 in part (an urgent "pay this" from the top).
  - **Finance check pair** (`awareness_{pre,post}_finance_{ab,ba}`): 10 items, 4 phish, matched flag multisets, look-alike bank changes paired with the real supplier's invoice (mirror pairs). The scenario files set Verify on in these forms, which differs from `BRAND_SET.md` §6 ("Verify is off"); the scenario file wins, so Verify is on.
- **Builds on E1, E7 and the finance checks:** supplier bank-change fraud, chief executive fraud, a genuine-looking sender proving nothing, and ring-back on the number held are all taught and measured today.
- **New (role extension this plan adds):** payroll diversion, Confirmation of Payee, PCI card data handling and the first hour after a suspected fraud. Delivered as one new finance episode in the built shape plus concept cards and defend items; see `game_design.md`.
- The awareness product is "Incident Simulations: Critical Cases", held from 2026-10-23 and resumed on 2026-10-27 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). The remaining built-product items are host character art after the PixelLab reset (3 Nov, all 19 concepts approved), human timing runs (postponed) and one facilitator guide for the course, written last.

## Why this module

Finance teams are targeted because they can move money. In 2025, UK businesses lost £28.0 million to invoice and mandate scams, 68% of all such losses, and only about £10.6 million of it was returned. UK Finance's explanation is the finance team's daily reality: businesses make genuine high-value payments so often that a fraudulent one is harder to spot and stop. CEO fraud cost £5.6 million at an average of just over £28,000 a case (UK Finance, *Annual Fraud Report 2026*). The UK's mandatory reimbursement rules cover individuals, micro-enterprises and small charities, not an organisation of Brightwell's size (Payment Systems Regulator), so the finance team's checks are the protection.

The risks cluster where finance work is busiest: month end, holiday cover and sickness, cut-off times, and changes nobody has time to check properly. They come through suppliers (bank detail changes, fake and duplicate invoices), through "the boss", through payroll (staff pay diverted by email requests or phished self-service logins) and through refunds. Staff who take card payments also carry duties under PCI DSS.

- **Google and Facebook, 2013 to 2015:** more than US$100 million paid to a fraudster posing as a real supplier, using look-alike addresses and fake invoices (US Department of Justice, 2019; see core_01's concepts).
- **Payroll diversion, 2018:** the FBI warned that criminals were phishing employees' payroll logins and changing where their salaries went, hitting education, healthcare and airlines first (IC3 I-091818-PSA).
- **Councils' own advice:** the Local Government Transparency Code 2015 makes councils in England publish every payment over £500, and its Annex B suggests the controls this module teaches: accept bank changes only in writing, verify them using existing contact details, and keep the people who authorise apart from the people who make changes.

## Target behaviours

1. **Verifies** every new payee and every change of bank details independently: a call to a number held before the request, a second person, and no action on an email, letter, portal change or phone call alone. **Built: E1 and the finance checks.**
2. **Reviews the run and holds** anything that doesn't add up, even at the cut-off, and **never bypasses dual control**.
3. **Starts recovery at once** when a payment may have gone wrong, with the bank's fraud line first, and **handles card data safely**. **New: the role extension.**

## Learning outcomes

After this module, finance staff can:

- **R02-LO1** Apply the supplier set-up and bank detail change process: verification on a number held before the request, a second person, Confirmation of Payee, and a confirmation to the supplier's known contact; and recognise when the "number on record" itself can't be trusted. **Built in part: E1 and the finance checks.**
- **R02-LO2** Review a payment run and identify red flags in the data: a first payment to recently changed details, a no match, a payee without an order, a duplicate invoice, two suppliers sharing an account, a payee set up at an odd time or by an odd user.
- **R02-LO3** Keep dual control and segregation of duties under pressure (month end, sickness cover, senior requests, cut-offs) and say no to bypasses. **Built in part: E7's "don't wait for the second approver" pressure.**
- **R02-LO4** Handle payroll and refund changes safely: staff bank details only through HR's route with direct confirmation, and refunds only to the original account after checking. **New.**
- **R02-LO5** Lead the first hour after a suspected fraudulent payment: the bank's fraud line, evidence, the security team (and the DPO where staff data changed), the person or supplier affected, Report Fraud. **New.**
- **R02-LO6** Handle payment card data within the PCI DSS basics: never keep the security code, never send or accept card numbers by email or chat, keep numbers masked, and use the approved payment route. **New.**

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2; this matches the module's coverage matrix row, plus PCI DSS 9.5.1.3):

- **ISO 27001 cl. 7.2** (competence for people whose work affects information security) and **ISO 27001 A.6.3**.
- **NIST AT-3** (role-based training) and **NIST AT-2(3)** (social engineering, including impersonation and thread-jacking).
- **CIS 14.9** (role-specific awareness and skills training; IG2 and IG3), building on CIS 14.2 from core_11.
- **PCI DSS 12.6.1** (staff aware of their role in protecting card data) and **PCI DSS 12.6.3.1**; **PCI DSS 9.5.1.3** in part, for staff who use card terminals.
- **NCSC CAF B6.b.**
- **NIS2 IR 8.2** (role training, for the digital entity types the Implementing Regulation covers); **DORA Art 13(6)** (training that fits the role, for EU financial entities).
- US customers: **NYDFS 500.14(a)(3)**; **SOC 2 CC1.4**.

The card data beat teaches the staff behaviours behind three technical requirements: card security codes not kept after authorisation (PCI DSS 3.3.1.2), card numbers masked when displayed (PCI DSS 3.4.1) and no unprotected card numbers sent by end-user messaging (PCI DSS 4.2.2). Training supports these; it doesn't meet them, and they aren't training requirements, so they aren't in the mapping. The same goes for segregation of duties (ISO 27001 A.5.3). For council customers, the module teaches the payment controls in Annex B of the Local Government Transparency Code 2015.

## Module flow

The module is two built episodes plus one new episode, all in the built shape. E1 played in the episode shape:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | Adaeze welcomes the learner to an authorised exercise; the learner is in accounts payable at Brightwell | no | under 1 |
| Attack half | OSINT on two sites, then compose one "change our bank details on INV-2217" email as the supplier, from blanks filled by found facts | no | about 4 |
| Flip | The learner's own email lands in the payments inbox with its tells named | no | 1 |
| Defend half | The payments inbox (6 emails, 3 phish), Verify on, mirror pairs (a look-alike bank change against the genuine "confirmed by phone" change) | yes | about 5 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card and the reporting route | no | about 2 |

E7 (cloned CEO voice) runs the same shape on the finance line, adding voicemails and the voice concept panel. The new **finance role episode** (payroll diversion, Confirmation of Payee and the first hour) runs the same stages. The finance pre and post checks bracket the episodes, sequenced by the organiser.

## Reuse from existing Break Escape content

- **Episode runner** for all stages; `variant: "full"` or `"defendOnly"`.
- **OSINT browser** and **intel facts** for the research stage; **mail client in template mode** with the red-flag meter and `systems/phish-rules.js` for the write stage; **flip view** for the flip.
- **Inbox triage** with the Verify verdict and the `voicemail` kind (E7), the SPF/DKIM/DMARC header panel, and **mirror pairs** (aw5) in the defend sets and the finance checks.
- **The finance defend set** `e1_payments_inbox` and the **finance check forms** `finance_form_a` and `finance_form_b`, with the look-alike-vs-real-supplier contrast (`changed_bank_details`, `lookalike_domain`, `reply_to_differs`, `senderAuth`, `pretextRelevant`).
- **Debrief view** (per-item cards, the habit, the On Monday card, the reporting route, the no-blame line).
- **Concept cards** for Confirmation of Payee, the first hour and card data; the **voice panel** for E7.
- **Awareness measurement** for the finance checks; the comparison panel shows pre against post when a baseline exists.
- **Rooms:** `room_aw_brightwell` for E1 and E7; the new episode reuses it.

## New features needed

- **A new finance episode** in the runner at Brightwell, covering the gaps E1 and E7 do not: payroll diversion (a "new bank, update before payday" email against the genuine HR route), Confirmation of Payee (a no-match against a match), a refund to a changed account, and PCI card data (a card photo by email). Attack half, flip, defend set with mirror pairs, debrief cards. No new minigame.
- **Concept cards:** Confirmation of Payee; the first hour after a fraud (bank's fraud line first); card data do and don't.
- **BE-05 Organisation profile** (partly built): the approval rules, cut-offs and the card payment route shown in the debrief cards; the reporting-route slot in the debrief (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays: gaps in the build.
- Not pursued (would redesign beyond the build): the MG-15 payment-run desk, the `dual-auth` rework, the `command-board` first-hour timeline and MG-25 document inspector. The thirty-row run and the two-approver panel are a larger later idea in the `features/minigames.md` catalogue (build status "not built"); the first hour is taught as a concept card and a defend item, not a scored timeline.

## Organisation-specific content

- Approval limits, delegations, and who approves when the usual approver is away.
- Payment cut-off times, and how to tell suppliers about a late payment.
- The bank detail change procedure: who verifies, what evidence is kept, whether a confirmation goes to the supplier's known contact.
- Whether suppliers can change details through a portal, and what alerts that raises.
- The payroll change route, and how payroll confirms a change with the employee.
- The refund policy.
- Whether the organisation takes card payments, the approved route, and the procedure for card details received by email.
- Who holds the bank's fraud line details; the security team, DPO and HR contacts for an incident; the police route by nation.
- The reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **Verify in the finance checks.** The scenario files set Verify on in the finance forms, against `BRAND_SET.md` §6. *Resolved per the reconciliation rule (scenario file wins): Verify is on. Flag to the build owner as a brand-set doc to correct. Candidate for DECISIONS_PENDING.*
2. **Card data beat.** *Recommendation: on by default, with an organisation switch for organisations that take no card payments, which swaps in a second refund or payroll item.*
3. **The first hour as content, not a minigame.** The build has no scored recovery timeline. *Recommendation: teach it as a concept card and one defend item, and keep the richer timeline idea in the backlog.*
