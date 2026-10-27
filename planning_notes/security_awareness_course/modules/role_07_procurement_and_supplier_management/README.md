# role_07: Procurement and supplier management

**Working game title:** Due Diligence
**Pitch:** Tell a supplier's evidence from its claims, spot the impersonation that borrows a supplier's name, write security into the contract, and close every account when it ends.

| | |
|---|---|
| Audience | Procurement staff, contract owners and anyone who buys or manages a supplier that holds the organisation's data, connects to its systems or runs a service it depends on |
| Built foundation | None yet: role_07 is a new role. It extends the built episode E1's supplier impersonation and reuses the inbox-triage engine |
| Company | Brightwell Foods (`brightwellfoods.example`), host Mei Lin Chau (procurement buyer) |
| New check pair | A supplier-and-procurement check-form pair (`awareness_{pre,post}_procurement_{ab,ba}`), **new** |
| Prerequisites | core_00 recommended; core_05 helps (personal data) |
| Full episode | About 13 minutes |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the new procurement pair) |
| Priority | Phase 3 |
| Build size | M. One new attack-first episode extending E1, one consequence-flip episode for due diligence and offboarding, and a new procurement check pair |

## Build status

- **Built, this module extends:** episode **E1 *Invoice and bank-detail fraud*** (`scenarios/awareness_e1_invoice_fraud`) at Brightwell Foods already teaches supplier impersonation (a supplier asking to change its bank details, a genuine-looking sender proving nothing). role_07 extends that to the whole supplier relationship. It reuses the episode runner, OSINT browser, mail client in template mode, flip view, inbox triage, debrief view, concept cards and awareness measurement. role_07 has **no built episode or check** of its own yet.
- **New (this whole module):** a procurement role at Brightwell. It needs its **own supplier-and-procurement check-form pair** (`awareness_{pre,post}_procurement_{ab,ba}`), a new attack-first episode extending E1's supplier impersonation, and a consequence-flip episode for the parts with no live attacker (tiering, evidence, clauses, offboarding).
- The awareness product is "Incident Simulations: Critical Cases", on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

Suppliers are part of an organisation's attack surface and of its single points of failure. They hold its data, connect to its systems and run services it can't do without, and they have suppliers of their own. Four cases show the routes:

- **MOVEit and Zellis, 2023.** A ransomware gang exploited a previously unknown flaw in MOVEit Transfer, a file transfer product, from 27 May 2023 (CISA advisory AA23-158A). One victim was Zellis, a UK payroll provider, and staff data of several of its clients, including the BBC, British Airways and Boots, was taken (BBC News, 5 June 2023). The clients' risk sat with their supplier's supplier.
- **Kaseya, 2021.** Attackers used a flaw in Kaseya's VSA remote management software, used by managed service providers, to push ransomware to those providers and their customers from 2 July 2021 (CISA). Kaseya put the number of businesses hit at between 800 and 1,500 (as reported by Reuters and the Washington Post, July 2021).
- **Synnovis, 2024.** A ransomware attack on 3 June 2024 hit almost all of Synnovis's systems and interrupted the pathology services it runs for London NHS trusts; stolen data was published on 20 June, and services weren't fully restored until late autumn (Synnovis).
- **CrowdStrike, 2024.** No attacker at all: a faulty content update for a security product, released at 04:09 UTC on 19 July 2024 and pulled 78 minutes later, crashed an estimated 8.5 million Windows devices (CrowdStrike; Microsoft).

The UK government expects buyers to manage this: central government departments, their agencies and NHS bodies must apply proportionate cyber controls to their contracts, and for higher-risk contracts the note's answer is to require Cyber Essentials, Cyber Essentials Plus or equivalent controls (PPN 014, Cabinet Office, February 2025). Brightwell's own NHS and council customers ask the same of Brightwell, and Brightwell should ask it of the suppliers that hold its data.

## Target behaviours

1. **Matches the checks to the risk and asks for evidence:** asks what the supplier will hold, reach and run, and checks evidence (its scope, issuer and dates) rather than accepting claims.
2. **Writes security into the contract and uses it:** a breach notice within set hours, named subcontractors, data returned and deleted at the end, supplier access rules, and assurance rights; and escalates a supplier's breach notice to security and the DPO straight away.
3. **Controls supplier access from the first day to the last:** named accounts, MFA, least privilege, time limits and logging; everything removed when the work or the contract ends.

## Learning outcomes

After this module, procurement staff and contract owners can:

- **R07-LO1** Explain how suppliers create risk (the data they hold, the access they have, the services we depend on, their own suppliers), using real examples.
- **R07-LO2** Tier a supplier by risk and choose proportionate due diligence.
- **R07-LO3** Judge supplier security evidence: tell evidence from claims; check a certificate's scope, issuer and dates; and say what Cyber Essentials, ISO 27001 certificates and SOC 2 reports do and don't show.
- **R07-LO4** Include the security clauses that matter and hold them in negotiation.
- **R07-LO5** Set up and remove supplier access safely.
- **R07-LO6** Respond to a supplier's breach notification: escalate at once to security and the DPO, use the contract, get the facts, keep records. **Extends E1: distinguish a genuine supplier breach notice from an impersonation that borrows a supplier's name.**

The procurement check pair measures the message-facing outcomes (telling evidence from claims in a bid email, spotting supplier impersonation and a fake breach notice, a supplier access request); the tiering, clause and offboarding outcomes are taught by the consequence-flip episode and concept cards.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2; this matches the module's coverage matrix row):

- **ISO 27001 cl. 7.2** (competence for people whose work affects information security).
- **NIST AT-3** (role-based training; its discussion names acquisition and procurement officials).
- **CIS 14.9** (role-specific awareness and skills training; IG2 and IG3).
- **NCSC CAF B6.b**; **DSPT 10.2.1** (due diligence on suppliers, categories 3 and 4), which this module supports.
- **NIS2 Art 21(2)(d)** (supply chain security) and **NIS2 IR 5.1.4** (supplier contracts set security requirements, including the awareness, skills and training of the supplier's staff), for the entity types they cover.
- **DORA Art 30(2)(i)** (contracts set the conditions for an ICT provider's participation in the entity's awareness programmes and training), for EU financial entities.
- **UK GDPR Art 28** (processor contracts), as context: it isn't a training article.
- US customers: **FTC 314.4(f)** (overseeing service providers), which this module supports; **CMMC AT.L2-3.2.2** (training for staff with security duties, including acquisition and procurement staff).

The module also teaches the staff side of controls that aren't training requirements and so aren't in the mapping: supplier relationships and agreements (ISO 27001 A.5.19 to A.5.23) and supply chain risk (NCSC CAF A4).

## Module flow

The new attack-first episode, in the built shape at Brightwell, extending E1:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | Mei Lin welcomes the learner to an authorised exercise; the learner is in procurement at Brightwell | no | under 1 |
| Attack half | OSINT on a supplier's public details, then compose one supplier-impersonation message from found facts (new bank details, an engineer who needs access, or a "we've had a breach, act now") | no | about 4 |
| Flip | The learner's own message lands in the procurement inbox with its tells named | no | 1 |
| Defend half | A procurement inbox: a fake supplier breach notice, a fake access request, a claims-only bid email, a "new details" supplier email, against their genuine twins; mirror pairs | yes | about 5 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card, the reporting route, no blame | no | about 2 |

The **consequence-flip** episode (R3) covers the parts with no live attacker: the learner chooses a supplier on claims, accepts weak clauses, or leaves accounts open at exit in a safe sandbox, and the flip shows where each led (a breach notice too late, an engineer's account still live a year on). The new procurement pre and post checks bracket the episodes.

## Reuse from existing Break Escape content

- **Episode runner** for all stages; `variant: "full"`, `"defendOnly"` and the consequence flip (R3); the `facilitated` flag for a procurement-team session.
- **OSINT browser** and **intel facts**; **mail client in template mode** with `systems/phish-rules.js`; **flip view**.
- **Inbox triage** with the Verify verdict; **mirror pairs** (aw5) in the defend set and the procurement checks. E1's supplier look-alike and "new bank details" patterns carry straight over.
- **Debrief view**, **concept cards**, **awareness measurement** and the comparison panel.
- **Rooms:** `room_aw_brightwell`.

## New features needed

- **A new procurement check-form pair** (`awareness_{pre,post}_procurement_{ab,ba}`): a triage set of supplier-facing messages (a fake supplier breach notice, a fake access request, a claims-only bid email, a supplier "new bank details" email), each phish mirror-paired with its genuine twin (a genuine breach notice, a genuine access request, an evidenced bid, a genuine change confirmed by call-back). 10 items, 4 phish, matched flag multisets, counterbalanced AB and BA.
- **A new attack-first episode** extending E1's supplier impersonation, and a **consequence-flip episode** for due diligence and offboarding, as above.
- **Concept cards:** the four ways a supplier can hurt you; tiering; the evidence ladder (claim, document, independent evidence in scope and in date); the clauses that matter; supplier access from first day to last.
- **BE-05 Organisation profile** (partly built): the supplier tiers, the required evidence, the standard clauses and the sign-off route in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays.
- Not pursued (would redesign beyond the build): the MG-22 supplier-assessment minigame with its bid grid and clause step, MG-25 document inspector, MG-18 access review and the `log-filter` breach-day view. Tiering, evidence, clauses and offboarding are taught by the consequence flip and concept cards; the bid-grid minigame is a later idea in the `features/minigames.md` catalogue (build status "not built").

## Organisation-specific content

- The supplier tiers, and what evidence each tier needs (Brightwell: Cyber Essentials Plus for any supplier holding staff or customer personal data).
- The organisation's supplier security questionnaire, or the short default one.
- The standard security clauses and the contract schedule they live in.
- Who signs off a high-tier supplier (procurement, security, the DPO) and the order countersignature threshold.
- The supplier access process (IT) and the supplier register.
- How often supplier security is reviewed, and the exit checklist.
- The reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **A right answer among bidders?** *Recommendation: in the consequence-flip episode, one wrong choice (claims without evidence) and two defensible ones, judged on the reasons and conditions, so the module never teaches "always pick the biggest" or "never pick the cheapest".*
2. **Real cases on screen?** *Recommendation: fictional equivalents in the game, as the brief requires; the real names (MOVEit, Kaseya, Synnovis, CrowdStrike) in `concepts.md` only.*
3. **The bid grid and clause negotiation.** The build's triage engine scores messages, not a bid grid. *Recommendation: teach tiering, evidence and clauses as a consequence flip and concept cards, measure the message-facing outcomes in the procurement check pair, and keep the bid-grid minigame in the backlog.*
