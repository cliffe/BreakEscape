# core_01: Phishing emails

**Working game title:** Inbox Zero
**Pitch:** Build one phishing email from a supplier's public details, then flip to the inbox it lands in and triage the morning's post while the fakes sit beside the genuine work.

| | |
|---|---|
| Audience | All staff. Built as finance (E1), HR (E2), executive and PA (E4) and general-staff (E5) episodes |
| Prerequisites | core_00 is the first-play brief in the kiosk frame; no module is locked behind another |
| Full episode | About 13 minutes (brief, attack, flip, defend, debrief) |
| Defend-only variant | About 8 minutes (brief, defend, debrief) |
| Pre and post check | 4 to 5 minutes each, per role, no pass mark |
| Text route | A gap in the build: an equivalent text route and a WCAG 2.2 AA statement are still to come |
| Priority | Built (E1, E2, E4, E5); the after-the-click addition is new (E8) |
| Build size | Built. The new work is E8 (LO6) and extra defend items, in the built shape |

## Build status

**Built.** The phishing-email outcomes are carried by four full episodes, each a defend-only variant and the role check forms, all in the "Incident Simulations: Critical Cases" line (`04_BUILT_SO_FAR.md`; `research/built_episodes_vs_plan.md` §2). Where a built episode and this plan once disagreed, the build wins.

| Outcome | Covered by | Status |
|---|---|---|
| C01-LO1 pressures and the ask | E1, E2, E4, E5 attack and defend halves; concept cards | **Built** |
| C01-LO2 read the address and domain | E1 and E5 defend halves; the general check forms (page items); the OSINT browser in every attack half | **Built** |
| C01-LO3 pause-worthy requests | E1, E2, E4, E5 defend halves; all six role check forms | **Built** |
| C01-LO4 check through a trusted channel | E1 and E4 defend sets (Verify verdict on); the debrief rule of thumb | **Built** |
| C01-LO5 report when unsure | the Report verdict in every defend set; the report button, always visible and never penalised | **Built** |
| C01-LO6 first steps after clicking, opening or typing a password | not yet taught: the debrief shows the consequence, not the recovery | **New (E8)** |

**What the built episodes are:** E1 invoice and bank-detail fraud (Brightwell Foods, finance), E2 CV and recruitment lures (Tarrowby Logistics, HR), E4 executive whaling (Merrin & Sallow Architects, executive and PA), E5 fake sign-in pages (Quayholt Insurance, general staff). Item counts and flags are taken from the scenario files, not the design doc: E1 has 6 defend items (the `BRAND_SET.md` §5 set of 5 was extended in build), E2 has 6, E4 has 3 emails and 2 voicemails, E5 has 5 page items. Each attack half is capped at one artefact and is unscored; the defend half is scored on the verdict and the flags (60 and 40; `designs/11` §4.1). Reporting a genuine message is never penalised.

**What is new:** E8 *after the click* (built shape, new), which teaches C01-LO6 and core_04 together, plus extra defend items that add the "threats arrive inside a real work task" frame the plan always wanted. E8's place in the roadmap is `04_BUILT_SO_FAR.md` §4; its design is in `game_design.md`.

## Why this module

Phishing is the most common way attacks on organisations begin. In the UK government's Cyber Security Breaches Survey 2025, 85% of businesses that identified a breach or attack in the previous year had experienced phishing. Most of it aims at passwords, which open email, payroll, customer data and the trust of everyone the account can write to. Well-made phishing no longer has spelling mistakes, and it often arrives from real accounts that have been taken over, so the defence has to be a habit (stop and check through a route you already trust) rather than a checklist of cues.

## Target behaviours

1. **Reports** suspicious emails with the report button, including when unsure and after their own mistake.
2. **Checks another way** before signing in, paying or sending data because an email asked: a bookmark, the app, the directory, a colleague.

## Learning outcomes

After this module, staff can:

- **C01-LO1** Say what a phishing email is trying to get them to do, and recognise the pressures it uses (authority, urgency, fear, curiosity, reward, social proof, secrecy).
- **C01-LO2** Read a web address or email address and pick out the real domain.
- **C01-LO3** Recognise requests that should make them pause (a password, a code, money, data, a file, skipping process), even when the sender looks genuine.
- **C01-LO4** Check a suspicious request through a channel they already trust.
- **C01-LO5** Report a suspicious email through the organisation's route, including when unsure.
- **C01-LO6** Take the right first steps after clicking a link, opening an attachment or typing a password.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3.1**: training covers phishing and related attacks and social engineering. This module and core_02 together meet it.
- **ISO 27001 cl. 7.3** and **ISO 27001 A.6.3**.
- **NIST AT-2, AT-2(3) and AT-2(4)**: literacy training; social engineering and mining; suspicious communications.
- **CIS 14.2** (recognise social engineering attacks, including business email compromise) and **CIS 14.6** (recognise and report incidents).
- **NIS2 Art 21(2)(g)** (basic cyber hygiene practices and training) and **NIS2 IR 8.1** where the Implementing Regulation applies.
- **NCSC CAF B6.a** (a reporting culture) and **NCSC CAF B6.b** (training).
- **UK GDPR Art 32** (security of processing: staff awareness is the usual organisational measure).
- **NYDFS 500.14(a)(3)** (annual training including social engineering), for US financial services customers.

The measurement for this coverage is the pre and post check pair, not a per-module pass mark; see `assessment.md`.

## Module flow

The built episode shape, the same for E1, E2, E4 and E5. A full episode is about 13 minutes; the defend-only variant drops the attack and flip and runs about 8 minutes.

| Stage | What happens | Scored |
|---|---|---|
| Brief and scope note | The host welcomes the learner in the training room and names the exercise as an authorised one at a fictional company | no |
| Attack | Look at two public sources in the OSINT browser, collect typed intel facts, then compose one message from a template whose blanks take only the facts found; a red-flag meter guides before Send. One artefact, no links or payloads that work | no |
| Flip | The learner's own message arrives in a defender's inbox with its tells highlighted, and a scripted defender line answers the learner's choice | no |
| Defend | Triage the inbox with Trust, Report, Delete and (in E1 and E4) Verify; immediate feedback explains a miss before the next, similar item | yes |
| Debrief | A reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and a no-blame line | no |
| Pre and post check | Separate missions that bracket the episodes: matched parallel forms, counterbalanced, no pass mark, per-item records only | the checks are scored, with no pass or fail |

## Reuse from existing Break Escape content

Built on the awareness systems on main (`04_BUILT_SO_FAR.md` §1):

- the episode runner and its step strip, in one training room per company with a kiosk and a host, no doors, no combat, no VM;
- the OSINT browser and the intel board of typed facts (the attack half);
- the mail client in template mode with the red-flag meter;
- the landing-page builder (E5), a scored model that never produces a working page;
- the flip view;
- the inbox-triage defender with its card kinds (email, call, voicemail, push, page, sms, qr), the report button and Verify;
- the debrief view (reasoning cards, genuine-item feedback, the team-protected tally, the habit, the "On Monday" card, the customer report-route slot, the no-blame line);
- concept cards (E2 carries one on macros);
- awareness-measure records (ids, verdicts, chips, score, stage and time only; no free text, no identity);
- the look-alike NPC guard and the social validator's strict social job in CI.

The four training rooms are copied from a seminar room and dressed per company (Brightwell, Tarrowby, Quayholt, Merrin & Sallow), with the accent, a wall logo plate and a "REPORT IT" poster.

## New features needed

The engine is built. The gaps that E8 and further episodes still need are the open MVP items in `features/README.md` (`04_BUILT_SO_FAR.md` §4):

- **BE-03** an equivalent text route, and **BE-04 and BE-26** accessibility beyond the social overlays;
- **BE-19** a real `#trigger_minigame`;
- **BE-20** an authorable title and tutorial (today the shell still shows the platform title);
- **BE-23** a pause that also stops the clock;
- **BE-25** Unicode name entry;
- **BE-30** configurable call labels.

No runtime language model is used anywhere: the pretext judge, the defender replies, the feedback and the hints are authored data or ink. No video is used; the host, concept cards, feedback strings and text to speech do the explaining.

## Organisation-specific content

- The customer's reporting route, resolved through the `customer_report_route` slot and shown in every debrief. The deployment setting for this is a proposed Hacktivity feature awaiting the user's answer (described at feature level only).
- The name and location of the report button, where the customer wants it named on screen.
- What to do after opening a suspicious attachment.
- The approved way to reach company systems (a bookmark, an app, a portal).

## Open questions

1. **E8 company and host.** E8 *after the click* is proposed at Quayholt Insurance with host Anjali Rao, the information security analyst who receives reports, so the general-staff thread from E5 carries on. *Recommendation: confirm Quayholt and Anjali Rao, both already in `BRAND_SET.md`.*
2. **Extra defend items.** The plan still wants more defend items that place the threat inside a real work task. *Recommendation: add them to the existing E1, E2, E4 and E5 defend sets and the check forms, keeping the matched-flag balance the social validator checks.*
3. **The attacker half for customers who object.** Already answered by the build: the defend-only variant is the opt-out, and the no-blame line moves into its debrief. (Candidate for DECISIONS_PENDING: whether E6 and E7 should be defend-only by default, which the user put on hold as aw7.)
