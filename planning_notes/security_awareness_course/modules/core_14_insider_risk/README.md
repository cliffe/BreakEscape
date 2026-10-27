# core_14: Insider risk

**Working game title:** Notice Period
**Pitch:** An account manager leaves on Friday, a colleague is having a strange week, and the office already has a theory. Spend the week noticing, staying fair, and passing what you see to the people whose job it is.

| | |
|---|---|
| Audience | All staff (built role: general) |
| Prerequisites | core_00 recommended (introduces the reporting route) |
| Full episode | about 13 minutes |
| Defend-only variant | about 8 minutes |
| Pre and post check | 4 to 5 minutes each (general role forms) |
| Priority | Phase 3 (proposed episode E16) |
| Build size | M. Reuses inbox triage (email, call and push cards), the influence global and the consequence flip; new work is a "raise a concern" fact-chip form |

## Build status

**New episode, consequence-flip and defend shape.** Nothing in the built product covers insider risk (`../../04_BUILT_SO_FAR.md` §3; `research/built_episodes_vs_plan.md` §2 marks core_14 "None"). An insider-risk case for the same product line is designed in `../../../phishing_and_social_engineering/designs/12_deduction_board.md` (use case B, "Night shift insider"), but that is a deduction-board design, not an awareness episode, and is not built. Every learning outcome here is new.

The episode is designed in the built shape. Because the learner's own habits are most of the topic, the attack beat is a **consequence flip** (R3): the learner makes the everyday slip (lending a login, nibbling at an outside offer) in a safe sandbox, and the flip shows the chain it started. The defend half reuses the **inbox-triage** defender with its `call`, `push` and email cards (as E3 and E6 do), plus a short "raise a concern" step. The night-shift deduction board in design 12 use case B is noted as a **later, richer version** for this product line, not built here.

**Covers:** C14-LO1 to LO6, all new.

The episode is proposed as a full episode, a defend-only variant and new general check items. It is not yet built: the awareness product is on hold.

## Why this module

An insider is anyone who has, or had, authorised access to an organisation's people, information, systems or buildings: staff, contractors, partners and leavers. The UK's National Protective Security Authority (NPSA) widened its definitions in 2023 to include harm done unintentionally, and its message is "If you have people, you have insider risk". Much of it is everyday mistakes and shortcuts by people trying to get their work done: an email to the wrong person, a borrowed login, work sent to a personal account. A few cases are deliberate, usually driven by a grievance, money, pressure from someone else or a belief that they're in the right. Two things make the difference in both cases: people not sharing their access, and colleagues who raise what they notice, fairly and early, with the right person.

- **A car leasing salesman, 2024.** He copied more than 3,600 customer records shortly before resigning and offered them to rival firms, claiming they were his own. The ICO prosecuted him under section 170 of the Data Protection Act 2018.
- **A BBC journalist, 2025.** A criminal claiming to work with a ransomware gang offered him a share of any ransom for access to the BBC's systems, then flooded his phone with sign-in prompts when he stalled. He reported it to the BBC's security team, who disconnected his access as a precaution.
- **Coinbase, 2025.** Criminals paid a small number of overseas customer support staff to copy customer data, then demanded US$20 million. The company refused, and estimated its costs at US$180 to 400 million.
- **Morrisons, 2014.** An internal auditor with a grudge after a disciplinary warning posted the payroll data of almost 100,000 colleagues online and tried to frame a co-worker for it.

## Target behaviours

1. **Never shares access.** Never shares their login, codes or prompts, never uses anyone else's, and helps a locked-out colleague to the service desk instead.
2. **Reports offers.** Reports anyone who offers money or favours for access or data, straight away and without replying, and denies sign-in prompts they didn't start.
3. **Raises concerns fairly.** Passes what they notice about how data or access is being used to the right person, as facts rather than conclusions, without investigating colleagues, confronting them or spreading rumours.

## Learning outcomes

After this module, staff can:

- **C14-LO1** Explain that insider risk covers accidental and careless actions by anyone with access as well as rare deliberate ones, and give an example of each.
- **C14-LO2** Refuse to share credentials or use someone else's, and direct the colleague to the proper route.
- **C14-LO3** Recognise behaviours that may mean data is being taken or access misused (copying company data to personal storage, asking others to export data outside their role, getting round controls) without treating unusual behaviour as proof.
- **C14-LO4** Recognise an approach offering money or favours for access or data, including through social media and messaging apps, and report it without engaging.
- **C14-LO5** Raise a concern through the right route (security team, manager, HR, the Speak Up line, the DPO for personal data) with facts rather than conclusions, and without investigating, confronting or gossiping.
- **C14-LO6** Tell whistleblowing through a protected route from leaking, and respond to a colleague under pressure with support rather than suspicion.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2):

- **NIST AT-2** and **NIST AT-2(2)** (recognising and reporting potential signs of insider threat).
- **CMMC AT.L2-3.2.3** (awareness training on insider threat indicators), for US defence supply chain customers.
- **ISO 27001 cl. 7.3**, **ISO 27001 A.6.3** and **ISO 27001 A.6.8** (a route for reporting what you observe).
- **CIS 14.3** (credential handling) and **CIS 14.6** (recognising and reporting incidents).
- **NCSC CAF B6.a** (people know how to raise a concern, and those who report are treated positively) and **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 10.1** (human resources security).
- **DORA Art 13(6)** and **DORA RTS Art 19** (channels for reporting anomalous behaviour, including whistleblowing).
- **UK GDPR Art 32(4)**; the module also tells staff that taking personal data without the employer's consent can be an offence under section 170 of the Data Protection Act 2018.
- **SOC 2 CC2.2**.
- **PCI DSS 12.6.1** and **DSPT 3.2.1 (categories 3 and 4)**, as part of the wider programme.
- The organisation's **whistleblowing policy**: the module explains the routes it offers; it does not replace the policy or legal advice.

## Module flow

One training-room mission, with the pre-check and post-check as the bracketing missions.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | 10-item general check form, before the episodes | 4 to 5 |
| Brief and scope note | "Authorised exercise at Quayholt Insurance (fictional). It's a leaver's last week. In scope: your own choices and what you notice." | 1 |
| The week (sandbox) | The everyday choices arrive inside ordinary work: a colleague wants your login, an outside offer lands, a leaver asks a favour, the office floats a theory about someone. The learner makes each choice; unscored | 4 to 5 |
| Flip: the chain | A short montage shows where a shared login or an engaged offer led, and where a kind word and a fair concern led instead | 1 to 2 |
| Defend | Triage a set: an offer message (Report), a shared-login request (decline and route), unexpected sign-in prompts (Deny and report), a leaver's favour, and a "raise a concern" step that rewards facts over conclusions; scored under the `awareness` profile | 3 to 4 |
| Debrief | Per-item reasoning, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line; the fair-concern line lands here | 1 to 2 |
| Post-check (separate mission) | The parallel general check form, after the episodes; shows the change | 4 to 5 |

## Setting and host

- **Company:** Quayholt Insurance (`quayholt.example`, brand set), a commercial insurer whose staff hold customer data and whose service desk resets access, so insider access and offers fit. It already hosts E3 and E5.
- **Host:** Anjali Rao, information security analyst (the Quayholt analyst who receives reports), who welcomes the learner and takes the concern.
- **Cast (proposed, consistent with `BRAND_SET.md`, surname clash check before release):** the leaver (an account manager, passed over, joining a competitor, who has talked himself into "my contacts"); the false lead (a colleague having a hard week, whose father is in hospital); the rumour-spreader (a likeable colleague who loves a theory); the login-borrower (a colleague locked out); an HR partner and a DPO as concern routes. The "talent partner" is an unknown contact on a messaging app, text only, no art.

## Reuse from existing Break Escape content

- **inbox triage** with `call`, `push` and email cards, Report always visible, Verify where it fits;
- the **influence global** and its thresholds, for how the leaver and the false lead respond to the learner;
- the **consequence flip** (the chain montage) in place of the attack-then-flip beat;
- the **MFA authenticator** demo (the night-time prompt storm, one decision; core_03 teaches it in full);
- **awareness-measure** records.

## New features needed

A "raise a concern" fact-chip form (what, when, where, who; conclusions allowed but flagged in feedback; a route picker). It is a small extension of the triage surface. The deduction board of design 12 use case B is a separate, later, richer build.



## Organisation-specific content

- The routes for raising a concern: the security team, line managers, HR, the Speak Up line (its provider, number and whether it is anonymous), and the DPO.
- The name and link of the whistleblowing policy, and the regulator most relevant to the organisation.
- The leaver process: when access ends, what leavers may take, and who helps.
- The rule on sending work to personal email or cloud storage.
- The employee assistance programme or other wellbeing support.
- What the organisation monitors and how staff are told, so the module never implies covert watching.
- How to report an outside approach (fills `slot:customer_report_route`).

## Open questions

1. **How much to say about monitoring.** One line ("our tools see files moving, but not why; people see the why"), with the organisation's own monitoring notice on the reference card. Never imply covert watching.
2. **The false lead's reason.** A parent in hospital, told lightly and with no medical detail; the bank holds other innocent reasons for replays (a second job cleared with HR, a medical appointment).
3. **How much the learner learns about the outcome.** A short, discreet resolution ("it's been dealt with; the copies are gone"), modelling the confidentiality staff should expect.
4. **The prompt storm.** Kept as a single decision, because it is exactly what happened after the 2025 BBC approach; link to core_03.
5. **Real cases in the game.** None named in dialogue; the field guide, generated from `concepts.md`, names them.
6. **A richer version.** The night-shift insider of design 12 use case B (one of four staff let an intruder in; evidence from logs; a report verdict) is a strong later build on a deduction board, noted but not built here.
