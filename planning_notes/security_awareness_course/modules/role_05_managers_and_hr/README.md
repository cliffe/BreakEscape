# role_05: People managers and HR

**Working game title:** Joiners, Movers, Leavers
**Pitch:** Managers and HR defend recruitment against malicious CVs and fake remote candidates, then learn to give the least access, close it on the last day, and say "thank you" when someone reports a mistake.

| | |
|---|---|
| Audience | Line managers, team leaders and HR staff |
| Built foundation | Episode E2 (CV and recruitment lures) and the hr check pair, at Tarrowby Logistics |
| Company | Tarrowby Logistics (`tarrowby.example`); E2 host Fatima Begum |
| Prerequisites | core_00; core_01 and core_04 recommended (the phishing and reporting basics a manager gets asked about) |
| Full episode | About 13 minutes (E2) |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the hr pair) |
| Priority | Phase 3 |
| Build size | M. The recruitment-lure half is built (E2, the hr checks); the role extension (recruitment fraud, joiners-movers-leavers access, no-blame culture) is one new attack-first episode, one consequence-flip episode and concept cards |

## Build status

- **Built, this module builds on it:** episode **E2 *CV and recruitment lures*** (`scenarios/awareness_e2_cv_lures`), Tarrowby Logistics, host Fatima Begum. The learner researches, composes one job application with an attachment chosen from labels (a malicious CV or a "enable content" document), sees it flipped, then defends the recruitment inbox (6 emails, 2 phish, 4 genuine, no Verify) with a short macro concept panel. The **hr check pair** (`awareness_{pre,post}_hr_{ab,ba}`) measures the skill. Covers R05-LO4 in part (malicious CVs, portfolio links, "enable content").
- **Builds on E2 and the hr checks:** malicious attachments, portfolio links and "enable content" lures aimed at recruiters are taught and measured today.
- **New (role extension this plan adds):** recruitment fraud by borrowed identities and proxies (R05-LO4, the other half); joiners, movers and leavers access (R05-LO1, LO2, LO3); and the no-blame culture and HR data on a need-to-know basis (R05-LO5, LO6). Delivered as one new attack-first episode (recruitment fraud), one consequence-flip episode (access that outlives the job), and concept cards; see `game_design.md`.
- The awareness product is "Incident Simulations: Critical Cases", on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

Managers decide who gets access and when it goes, and they decide whether people feel safe to admit a mistake. IT can only act on what managers and HR tell it, so accounts, keys and codes outlive the job when nobody says the job has ended. The NCSC's identity and access management guidance recommends a "joiners, movers and leavers" policy "so access can be revoked when no longer needed", and regular reviews for unnecessary privileges.

Recruitment has become a way in as well. In September 2024 the UK's Office of Financial Sanctions Implementation (OFSI) warned that it is "almost certain" UK firms are being targeted by North Korean IT workers posing as remote freelancers under false identities. In the US, the FBI warned in 2022 that applicants for remote IT jobs were using deepfakes and stolen personal details in interviews.

- **KnowBe4, July 2024.** A security company hired a remote software engineer who had passed four video interviews and a background check using a stolen US identity and an AI-altered photo. Malware began loading on the company laptop as soon as it arrived; the company's monitoring flagged it and the laptop was contained within half an hour of the first alert (KnowBe4, 23 July 2024).
- **Leaseline Vehicle Management, September 2024.** A sales consultant took more than 3,600 pieces of customer information shortly before resigning and offered them to competitors. He was fined under section 170 of the Data Protection Act 2018 after the company reported him (ICO, 17 September 2024).

## Target behaviours

1. **Gives the least access** a role needs, and makes sure movers and leavers lose access, devices, keys and codes on the day. **New.**
2. **Says "thank you" and acts** when someone reports a mistake: gets it reported at once, supports them, never blames. **New.**
3. **Insists on the same checks for every new hire**, and raises concerns about candidates or colleagues through HR and security rather than handling them alone. **Built in part: E2's recruitment lures; new: recruitment fraud.**

## Learning outcomes

After this module, managers and HR staff can:

- **R05-LO1** Request the least access a new starter's role needs, with an end date for temporary staff, instead of copying someone else's access. **New.**
- **R05-LO2** Make sure a mover's old access, and a leaver's accounts, devices, keys, codes and data, are dealt with on the day they move or leave. **New.**
- **R05-LO3** Review their team's access, remove what is no longer needed, and ask the system owner when unsure. **New.**
- **R05-LO4** Recognise the signs of recruitment fraud (malicious attachments and links, borrowed identities, proxies, altered video) and apply the standard identity and right to work checks fairly to every candidate. **Built in part: E2; new: the fraud half.**
- **R05-LO5** Respond to a team member who reports a mistake by thanking them, getting it reported at once and supporting them, and set the team's culture by making time for training. **New.**
- **R05-LO6** Handle HR and health information on a need-to-know basis, and raise a concern about a colleague through HR and security instead of investigating it themselves. **New.**

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **NCSC CAF B6.a**: a positive culture in which people who report are treated positively. Managers are where that culture is made or lost. For NHS customers, **DSPT B6.a**.
- **ISO 27001 cl. 7.2** and **ISO 27001 A.6.3**: competence and training relevant to the manager's and HR job.
- **NIST AT-3** (role-based training) and **NIST AT-2(2)** (recognising and reporting possible insider threat, through the fair concern beat).
- **CIS 14.9** (role-specific awareness and skills training; IG2 and IG3).
- **NIS2 IR 10.1, IR 10.2** (human resources security: role assignments reviewed, background checks), for entities the Implementing Regulation covers; **NIS2 Art 21(2)(g)** for the rest.
- **DORA RTS Art 19** (the human resources policy: staff know the security policies and the channels for reporting), for EU financial customers.
- **UK GDPR Art 5(1)(f)** and **UK GDPR Art 32(4)** through the HR data beats; the **ICO training toolkit** (specialised training for roles with key data protection duties, which includes HR).
- **CMMC AT.L2-3.2.3** (insider threat awareness), for US defence customers.

The module also supports the organisation's own access, screening and leaver controls. Those are controls, not training requirements, so the compliance mapping doesn't list them (see Open questions).

## Module flow

E2 played in the built episode shape:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | Fatima welcomes the learner to an authorised exercise; the learner is in recruitment at Tarrowby | no | under 1 |
| Attack half | OSINT on a public vacancy, then compose one job application with an attachment chosen from labels (a malicious CV or "enable content" document) | no | about 4 |
| Flip | The learner's own application lands in the recruiter's inbox with its tells named | no | 1 |
| Defend half | The recruitment inbox (6 emails, 2 phish, 4 genuine), a macro concept panel, mirror pairs | yes | about 5 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card and the reporting route | no | about 2 |

The new **recruitment fraud** episode runs the same shape. The **access that outlives the job** consequence-flip episode (R3) has no natural attacker: the learner makes the "copy a leaver's access" mistake in a safe sandbox and the flip shows the ghost accounts and the toxic combination it left. The hr pre and post checks bracket the episodes.

## Reuse from existing Break Escape content

- **Episode runner** for all stages; `variant: "full"`, `"defendOnly"` and the consequence flip (R3); the `facilitated` flag for a managers' workshop.
- **OSINT browser**, **intel facts**, **mail client in template mode** with the red-flag meter, and the **flip view**.
- **Inbox triage** with the macro concept panel (E2) and attachment labels; **mirror pairs** (aw5) in the defend sets and the hr checks.
- **Debrief view**, **concept cards**, **awareness measurement** and the comparison panel.
- **The look-alike NPC guard and player avatar**.
- **Rooms:** `room_aw_tarrowby` for E2 and the new episodes.

## New features needed

- **A new recruitment-fraud episode** in the runner at Tarrowby: the attack half composes a fake application from a borrowed identity; the defend set triages candidate messages and files, each phish with a close genuine twin (a fake remote candidate with mismatched paperwork and a refusal to show original ID, against a genuine candidate with awkward circumstances such as poor broadband or a career break), as mirror pairs. Concept cards carry the fair-checks rule.
- **A consequence-flip episode** (R3) for joiners, movers and leavers access: the learner copies a leaver's access or leaves a mover's access open in a safe sandbox, and the flip shows the ghost accounts, the shared login and the toxic combination. Concept cards carry day one, move day, last day and the review.
- **Concept cards:** access follows the job; the access lifecycle; the fair checks for every hire; HR information on a need-to-know basis; Thank, Act, Support, Learn when someone owns up.
- **BE-05 Organisation profile** (partly built): the leaver deadline, the screening policy, the statement on mistakes and the reporting routes in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays.
- **Video call quality dressing** (freeze, blur, lag) that can appear for any caller in a `person-chat` video scene: ordinary call-quality dressing, never a deepfake tell (core_15 teaches that fakes don't reliably glitch); the fake candidate is caught by the identity and process checks, not the video. Likely shared with core_15.
- Not pursued (would redesign beyond the build): the MG-18 access review desk built from `warranty-checklist`, the MG-25 document inspector, the `alarm-panel` team pulse board and the week planner. The twelve-row access review and the live pulse board are a later idea in the `features/minigames.md` catalogue (build status "not built"); access is taught as a consequence flip and concept cards.

## Organisation-specific content

- The joiner, mover and leaver process: who raises each request, in which system, and the deadline for disabling a leaver's accounts.
- Who collects devices, badges and keys, and who changes shared codes.
- How often access is reviewed, and who signs it off.
- The pre-employment screening policy (identity, right to work, references, criminal record checks where the role needs them) and the rules for agencies, freelancers and contractors.
- The organisation's statement on security mistakes, and how it fits the disciplinary policy.
- Where HR and health information is kept, and who can see it.
- Routes: the security team, HR, the DPO and the whistleblowing line; and the reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **Recruitment fraud specifics.** The official advisories are about North Korean IT workers. *Recommendation: name them in `concepts.md` and on the reference card, but keep the game's fraudster an unnamed, faceless network, so no candidate's nationality, accent or appearance becomes the clue. The clues are inconsistencies and refusals, and the genuine-candidate mirror twin makes "run the checks" the only reliable rule.*
2. **Control references.** The module supports access, screening and leaver controls. *Recommendation: add short references to `02_COMPLIANCE_MAPPING.md` only if customers ask; they aren't training requirements.*
3. **An HR-only route.** *Recommendation: an organisation setting that frames the recruitment-fraud episode for HR without the team-manager framing, keeping the same defend set and checks.*
4. **Access as a consequence flip.** The build has no scored access-review desk. *Recommendation: teach joiners, movers and leavers as a consequence-flip episode and concept cards; keep the richer review desk in the backlog.*
