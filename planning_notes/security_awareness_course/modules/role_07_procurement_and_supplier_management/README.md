# role_07: Procurement and supplier management

**Working game title:** Due Diligence
**Pitch:** Choose a rostering system for 250 field staff, write security into the contract, and live with the supplier you picked: through a breach notice six months in, and the accounts still open when the contract ends.

| | |
|---|---|
| Audience | Procurement staff, contract owners and anyone who buys or manages a supplier that holds the organisation's data, connects to its systems or runs a service it depends on |
| Prerequisites | core_00 recommended; core_05 helps (personal data) |
| Full module | 20 minutes |
| Micro-drill | none (as in the catalogue); "Claim or Evidence?" can run as an optional drill |
| Text route | 12 to 15 minutes |
| Priority | Phase 3 |
| Build size | M, driven by MG-22 (supplier assessment, including its clause step), two time skips (BE-16) and the exit access review (MG-18) |

## Why this module

Suppliers are part of an organisation's attack surface and of its single points of failure. They hold its data, connect to its systems and run services it can't do without, and they have suppliers of their own. Four cases show the routes:

- **MOVEit and Zellis, 2023.** A ransomware gang exploited a previously unknown flaw in MOVEit Transfer, a file transfer product, from 27 May 2023 (CISA advisory AA23-158A). One victim was Zellis, a UK payroll provider, and staff data of several of its clients, including the BBC, British Airways and Boots, was taken (BBC News, 5 June 2023). The clients' risk sat with their supplier's supplier.
- **Kaseya, 2021.** Attackers used a flaw in Kaseya's VSA remote management software, used by managed service providers, to push ransomware to those providers and their customers from 2 July 2021 (CISA). Kaseya put the number of businesses hit at between 800 and 1,500 (as reported by Reuters and the Washington Post, July 2021).
- **Synnovis, 2024.** A ransomware attack on 3 June 2024 hit almost all of Synnovis's systems and interrupted the pathology services it runs for London NHS trusts; stolen data was published on 20 June, and services weren't fully restored until late autumn (Synnovis).
- **CrowdStrike, 2024.** No attacker at all: a faulty content update for a security product, released at 04:09 UTC on 19 July 2024 and pulled 78 minutes later, crashed an estimated 8.5 million Windows devices (CrowdStrike; Microsoft).

The UK government expects buyers to manage this: central government departments, their agencies and NHS bodies must take a risk-based approach and require Cyber Essentials, Cyber Essentials Plus or equivalent controls in higher-risk contracts (PPN 014, Cabinet Office, February 2025). Larkspur's own NHS and council customers ask the same of Larkspur, and Larkspur should ask it of the suppliers that hold its data.

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
- **R07-LO6** Respond to a supplier's breach notification: escalate at once to security and the DPO, use the contract, get the facts, keep records.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2; this matches the module's row in its coverage matrix):

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

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Lena wants ShiftHarbour's order form signed today for 20% off; their security questionnaire says "yes" to everything. The player's response is the baseline | Game (MG-27, `notes`) | 1 to 2 |
| Learn | Harjit and Ama: four ways a supplier can hurt you; tiering; the evidence ladder; the clauses that matter; supplier access | NPC explainer with visual aids (EX-01, BE-08) | 3 |
| Practise | "Claim or Evidence?": eight supplier statements, getting harder | Minigame (MG-22 practice, MG-25) | 3 |
| Apply | Judge three bids, recommend one, negotiate the clauses, set up the supplier's access; then six months later a breach notice, and two years later the contract ends with accounts still open | Game (MG-22, BE-16, MG-18, `log-filter`) | 8 to 9 |
| Debrief | "Your contract against what happened": each clause, what it gave on breach day and at exit | Debrief screen (BE-02), Harjit, Ama and Tomasz | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The supplier security checklist on The Lark | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** the procurement desk in the open-plan office (`room_office`); the meeting room with a screen for pitch day (`room_meeting`); Owain's IT office (`room_IT`); the security office (`room_security`) on breach day.
- **`warranty-checklist`** (sis03): a verdict per row behind an evidence gate, with a submit step. The base of MG-22, once its sis03 letterhead, verdict labels, gate global and alert text come from data (`features/minigames.md` section 4).
- **`forensic-data-platform`**: the bidders' evidence packs (certificate, report extract, policy) as tabs, and the breach notice pack with a gated confirm.
- **`log-filter`**, `vpn` log type: Kai's view of the supplier account's sign-ins on breach day. Its columns (user, IP, country, MFA, result) fit a supplier account exactly, and sis01 already uses it for a contractor's VPN account with no MFA.
- **`person-chat` video-call mode** for the three pitches and the clause counter-offers. Its status bar says "SECURE VIDEO LINK" (`person-chat-ui.js`), which needs to come from data ("Larkspur Meet").
- **`notes`** for the order form, the questionnaire summary, the supplier register and the reference card.
- **Patterns, not canon:** sis01's contractor VPN account with no MFA (`scenarios/sis01_healthcare/scenario.json.erb`, the m.blake log lines) and sis02's dormant contractor account still live fourteen months after the contractor left (`scenarios/sis02_energy/scenario.json.erb`, the jump server node) are ready-made examples of supplier access gone wrong. The SIS games' names and organisations stay out of this course; the patterns come in with Larkspur's own fictional suppliers.
- **Systems:** BE-16 time skips over the game clock; objectives for the procurement task.

## New features needed

- **MG-22 Supplier assessment:** the three bids, the four verdicts (evidenced, claimed only, a gap, a red flag), the evidence documents, the recommendation, and its clause step. The clause step here also shows the chosen bidder's counter-offer for each clause (played as a short video call in ink), and records which clauses were held.
- **MG-25 Document inspector:** a certificate's scope and dates against what is being bought.
- **MG-18 Access review:** the supplier's accounts, keys and delegations at contract end.
- **MG-27 Work desktop**, **MG-20 Knowledge check**, **BE-01**, **BE-02**.
- **BE-08 Visual aids:** the four routes, the tiering grid, the evidence ladder, the clause cards.
- **BE-16 Time skips:** "Six months later" and "Two years later", with the contract's clauses carried forward as globals.
- **BE-09 Intranet terminal**, **BE-05 Organisation profile** (tiers, required evidence, standard clauses, who signs off), **BE-13 Content banks** (bidders, evidence, incidents), **BE-19 Open minigames from conversations and events** (Harjit's check question, `#trigger_minigame:knowledge_check|r07_q_scope`).
- **BE-07 Micro-drill launcher**, only if the organisation switches on the optional "Claim or Evidence?" drill.

## Organisation-specific content

- The supplier tiers, and what evidence each tier needs (Larkspur: Cyber Essentials Plus for any supplier holding staff or customer personal data).
- The organisation's supplier security questionnaire, or the short default one.
- The standard security clauses and the contract schedule they live in.
- Who signs off a high-tier supplier (procurement, security, the DPO) and the order countersignature threshold.
- The supplier access process (IT) and the supplier register.
- How often supplier security is reviewed, and the exit checklist.

These go in the organisation's HA-26 setup checklist.

## Open questions

1. **A right answer among the bidders?** *Recommendation: one wrong choice (ShiftHarbour, which has claims without evidence) and two defensible ones, assessed on the reasons and the conditions set, so the module never teaches "always pick the biggest" or "never pick the cheapest".*
2. **Real cases on screen?** *Recommendation: fictional equivalents in the game, as the brief requires; the real names (MOVEit, Kaseya, Synnovis, CrowdStrike) in the field guide generated from `concepts.md`.*
3. **Northbeck in the supplier register.** *Recommendation: yes: it holds no Larkspur data but deliveries depend on it, and its taken-over mailbox in core_01 and core_11 is a reminder that a supplier can also be used to impersonate.*
4. **A micro-drill.** The catalogue lists none. *Recommendation: keep none by default, with "Claim or Evidence?" available as an optional drill for procurement teams.*
