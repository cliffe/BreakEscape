# The built awareness episodes against the 26-module course plan

> **Snapshot (first merge, 2026-10-27).** Later the same day main resumed the product and closed most stages; timings changed to about 15 minutes per episode and about 9 per check. See `../04_BUILT_SO_FAR.md` §1 for the current status.

Read-only research, 2026-10-27. Sources: the plan in `planning_notes/security_awareness_course/`, the build docs in `planning_notes/phishing_and_social_engineering/`, and the 38 shells in `scenarios/awareness_*` (read directly; where they differ from a design doc, the scenario file wins and the difference is noted).

## 1. What is built

### 1.1 Product line and frame

- **Product line:** "Incident Simulations: Critical Cases", a separate line from SAFETYNET, on a neutral corporate skin (`ui_theme: "general"`). User decision F2, 2026-10-20 (`planning_notes/PHISHING_AND_SE_DECISIONS.md`; `phishing_and_social_engineering/README.md` "Products and build order" item 4; `designs/11_awareness_product_episodes.md` line 3). The individual missions are titled "Awareness E1: ..." and "Awareness check: ..." (`scenarios/awareness_*/mission.json`). The Hacktivity collection is `training`.
- **Frame:** every shell is one room, `training_room`, a company training room with a **training kiosk** and a **host NPC**. The learner taps the kiosk, and the episode runner (`public/break_escape/js/minigames/episode-runner/`) runs the stages in order with a step strip. There are no doors, no combat (`disableAttacks: true`) and no VMs.
- **Rooms:** four awareness-owned map types, all copied from `room_uni_seminar` and dressed per company: `room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`, `room_aw_merrin_sallow`. Each has the company's accent as a skirting line, a wall logo plate and a "REPORT IT" poster. The skeleton (host spot, kiosk slot, spawn point) is shared, and so is the lighting (`awareness/TRAINING_ROOM_PLAN.md`, `awareness/training_room.py`, `training_room_lighting.json`). Room review cycle 1 is done. Cycles 2 to 5 and the four POV conversation backgrounds have not been started (`chatBackground` is still `None` for all four).
- **Host:** each shell has one host who welcomes the learner. The host also carries the event mapping that completes the shell's single `missionConclusion` task once the defend or check result has synced. Episode hosts: E1 Adaeze Okafor, E2 Fatima Begum, E3 Darren Price (plus Leila Nassar as the phone NPC the learner calls), E4 Thandiwe Moyo, E5 Niamh Doherty, E6 Chidi Okeke, E7 Agnieszka Duda. The check shells have hosts of their own, such as Graham Whitfield, Farah Qureshi, Anjali Rao and Jun Watanabe. Host art is waiting on PixelLab quota and the user's approval (`awareness/HANDOVER.md` §2).
- **Player:** the learner (`displayName: "Learner"`). The player's chosen avatar always wins and the portrait follows it (aw9, `FUN_DECISIONS.md`).

### 1.2 The seven full episodes

Every full episode has the same shape: **brief and scope note, then an attack half** (OSINT look-around, then write, with optional build or MFA stages), then **the flip** (the learner's own message arrives in the defender's inbox with its tells highlighted, and a scripted defender line is keyed to the learner's choice), then **the defend half** (a triage set under the `awareness` scoring profile with immediate feedback), then **the debrief**. Only the defend half is scored. The attack is capped at one artefact (`maxMessages: 1`, `scored: false`) and has a red-flag meter.

| Ep | Folder | Topic | Company (room) | Role | Stages (from `stages`) | Attack half | Defend half (built items) | Target length |
|---|---|---|---|---|---|---|---|---|
| E1 | `awareness_e1_invoice_fraud` | Invoice and bank-detail fraud, BEC | Brightwell Foods (`room_aw_brightwell`) | finance | brief, osint, write, flip, defend, debrief | OSINT on two sites, then one templated email from "Harlow Packaging" asking for a bank change on INV-2217 | Payments inbox, 6 emails (3 phish, 3 genuine), Verify verdict on | 13 min |
| E2 | `awareness_e2_cv_lures` | CV and recruitment lures (link or "enable content") | Tarrowby Logistics (`room_aw_tarrowby`) | hr_recruitment | as E1 | One job application to the recruiter, with an attachment chosen from labels | Recruitment inbox, 6 emails (2 phish, 4 genuine), no Verify | 13 min |
| E3 | `awareness_e3_helpdesk_reset` | Help-desk reset by phone, then MFA fatigue | Quayholt Insurance (`room_aw_quayholt`) | helpdesk | brief, osint, write (a pretext call), mfa, flip, defend, debrief | Pretext call to the service desk as a locked-out manager (influence bar), then an attacker-side MFA push run (approved at 06:50) | Role swap: the learner is the service desk agent; 3 calls (2 impostor, 1 genuine) plus 1 unrequested push; Verify on | 13 min target, about 17 min accepted by the user |
| E4 | `awareness_e4_exec_whaling` | Executive whaling, voice | Merrin & Sallow Architects (`room_aw_merrin_sallow`) | executive | as E1 | One "about to board, pay this" email to the PA | PA inbox, 3 emails and 2 voicemails (3 phish, 2 genuine), Verify on | 13 min |
| E5 | `awareness_e5_signin_pages` | Fake sign-in pages | Quayholt Insurance | general_staff | brief, osint, build, write, flip, defend, debrief | Build a look-alike SSO page from abstract parts (brand, domain, padlock), then one email carrying its link; captures nothing | 5 page items in a mock browser (3 phish, 2 genuine), no Verify | 13 min |
| E6 | `awareness_e6_texts_and_qr` | Texts and QR codes | Tarrowby Logistics | mobile | as E1 (phone layout) | One "scan this code" message to depot staff as Facilities | Work phone: 3 texts, 2 QR notices, 1 email (4 phish, 2 genuine), Verify on | 13 min |
| E7 | `awareness_e7_voice_ceo` | Cloned CEO voice (optional episode) | Brightwell Foods | everyone | as E1 | One email in the CEO's name, the message that would land beside a cloned-voice call | Finance line: 3 voicemails and 2 emails (2 phish, 3 genuine), Verify on | 14 min |

The design doc's item counts are out of date: it gives E1 5 items and E3 3 calls plus a push. Use the counts above, which are taken from the scenario files.

**Minigames and systems used:** the OSINT browser and intel facts (all attack halves), the mail client in template mode with the red-flag meter (E1, E2, E4 to E7), the landing-page builder (E5), the pretext call on the influence score (E3), the MFA authenticator demo (E3), the flip view, and the inbox-triage defender with its non-email card kinds (`call`, `push`, `voicemail`, `page`, `sms`, `qr`). There is also a role-swap module (`episode-runner/role-swap.js`). The debrief view (`episode-runner/debrief-view.js`) shows these parts in order:

1. A per-item reasoning card for each item.
2. Detailed feedback on the genuine items: which ones the learner trusted, checked or flagged.
3. A "team protected" tally (aw6).
4. The shared rule of thumb (aw4).
5. The "On Monday" card.
6. The "how to report here" box, which comes from `slot:customer_report_route` (aw1).
7. The no-blame line.

E7 and E4 also carry a `voicePanel` concept panel, and E2 carries a short concept panel on macros. Text-to-speech provides the voices. There is no language model at runtime (decision P, `phishing_and_social_engineering/README.md`). The judge, the replies, the feedback and the hints are all authored data or ink.

### 1.3 The defend-only variants

There are seven `awareness_e*_defend` shells, one per episode (decision V, 2026-10-21). The stages are `brief, defend, debrief`, `variant: "defendOnly"`, and the target is 8 minutes. Each uses the same defend set as its full episode, so the measurement is unchanged. Each also uses the same company, room and host. They exist for customers who object to the "write a phish" beat. The no-blame "people who fall for these are not stupid" line moves into the debrief's `defendOnly` string. The user put "E6 and E7 defend-only by default" (aw7) on hold.

### 1.4 The pre and post checks

- **24 shells:** `awareness_{pre,post}_{finance,hr,helpdesk,executive,general,mobile}_{ab,ba}`. That is six roles, two parallel forms (A and B) of 10 items each, and two counterbalanced orders: AB takes A before and B after, and BA the reverse. Each is a 4 or 5 minute mission with `stages: ["check"]`.
- **Company per role:** finance uses Brightwell. HR and mobile use Tarrowby. Helpdesk and general use Quayholt. Executive uses Merrin & Sallow. Each role's check tests the channels that role meets in its episode. Helpdesk forms mix emails, calls, a voicemail and a push. Mobile mixes texts, QR codes and emails. General mixes emails and pages. Executive includes voicemails.
- **Form design:** 4 phish in 10 (5 for executive), with matched flag multisets and paired difficulty. Feedback comes at the end (`feedbackMode: "end"`) and `passPercent` is 0. The forms have been permuted so that A and B no longer share phish slots, which fixed blocker B1 in `awareness/CHECK_PARITY_AUDIT.md` (`awareness/HANDOVER.md` §2: "permuted, disjoint phish slots, audited all 6 roles"). The scenarios have `verifyVerdict: true` in the finance, executive, helpdesk and mobile forms, which differs from `BRAND_SET.md` §6 ("Verify is off").
- **Measurement:** the pre-check exports `triage_pre_percent`, `triage_pre_reportRate` and `triage_pre_done`. The post-check imports them through the platform's carry-over (the newest concluded run of the paired pre mission). The post screen shows the change only when a baseline exists, and says so when there is none. The organiser sequences the pre and post checks by hand in the event (decision V, A8). Per-item records go into `se_awareness_records` (`public/break_escape/js/systems/awareness-measure.js`). Each record holds the item id, form, verdict, chips, score, stage (pre, post or episode), the variant and the time to answer. The first answer wins.
- **Discrimination figure (aw3):** hits on phish against false alarms on genuine items. Organisers see it; learners never do. Learners get detailed feedback on the genuine items instead.
- **Privacy:** no free text is stored, only ids, enums, numbers and booleans. No learner identity is held in the block (the actor is added by the caller, and the block is shaped for xAPI). There are no individual league tables, and the attack half is never scored or ranked. The aggregate size for an organiser view (A4) and the hosting and learner-privacy questions (A7) are out of scope for now. Who can see results on the hosting platform is a platform question, kept out of this repo.
- **Claims:** the product claims only a before-and-after change on matched items for a cohort. There is no pilot and no effectiveness claim (A3, `designs/11` §5.2 and §5.4). The organiser copy says the checks are per role (aw8).

### 1.5 Brand set

`awareness/BRAND_SET.md` defines four invented companies, each with an `.example` domain, look-alike domains and a wordmark accent:

- Brightwell Foods, a food manufacturer in the East Midlands, `#2f6f5e`;
- Tarrowby Logistics, a haulier in West Yorkshire, `#3b5b8c`;
- Quayholt Insurance, a commercial insurer in Bristol, `#6b4c9a`;
- Merrin & Sallow Architects, a London practice, `#8a5a2b`.

Each company has a named, deliberately varied cast. Invented shared services: inboxly, QuickPost Mail, docshare-login. The look-alikes use learnable shapes only (a swapped character, an added hyphen, an added word), and there are no homographs. The lab's brands (Ledgerwell, Tarnside, CloudBoxy) are kept out of the awareness product. Every company name gets a web search before release.

### 1.6 Shared rule of thumb (no motto)

The debrief heading is "The habit to keep", and the text is identical in all 38 shells (`awareness/awareness_deploy.py`, enforced by `test/js/social-awareness-rule-of-thumb.test.mjs`):

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

Each episode adds its own "On Monday" card and ends on the customer's reporting route. The room poster says "REPORT IT". "Pause. Check. Report." appears nowhere in the build.

### 1.7 Hacktivity reporting-route proposal (feature level)

Source: `awareness/HACKTIVITY_ROUTE_PROPOSAL.md`. The proposal is a per-course and per-organisation "how to report suspicious messages" setting. Organisers would set it on their own course, and administrators would set an organisation default. It is resolved live when a game opens, in this order: the course, then the course's organisation, then (optionally) the player's own organisation. If none is set, it falls back to the scenario's own route and then to a generic line. It would be plain text with a length cap, shown in every awareness debrief, and copied when a course is copied. The engine already reads this setting on the client side. The user chose "a Hacktivity setting" and was then sent an options form (approaches A to F), which has **not been answered**. No Hacktivity change happens without the user's explicit go-ahead (`HANDOVER.md` §5).

### 1.8 Status (on hold since 2026-10-23)

From `awareness/HANDOVER.md`:

- **Closed:** design (3 cycles), the check forms, and engine rounds 1 to 5.
- **Done:** data rounds 1 to 8. Round 8 was committed but the bridges have not been re-run since.
- **Playtests:** P5 found no blockers or majors; P6 is pending.
- **Fun changes:** aw1 to aw6, aw8 and aw9 are built, and aw7 is on hold.
- **Not started:** dialogue review cycles 4 and 5; training-room cycles 2 to 5; the POV backgrounds; the light puzzle-chain pass; host art; human timing runs (postponed by the user); the game-configuration options form (not answered); lab sheets and facilitator notes (to be written last).
- **Facilitated mode:** the `facilitated` flag exists in the episode runner (prompts, no per-learner score on the shared screen), but no shipped shell sets it.
- **Not built, listed as "later" in `designs/11` §6.3:** SCORM, xAPI and LTI export; single sign-on; an admin dashboard; localisation; a full screen-reader audit.

The student lab `scenarios/lab_social_engineering` ("Phishing and Social Engineering", collection `lab_games`, browser-only, with a lab sheet) is the separate technical product. It is not on hold.

## 2. Mapping: the 26 planned modules against the build

Key: **Full** means the plan's main outcomes are met. **Part** means some outcomes are met. **Touch** means the topic appears but is not taught. **None** means not covered.

| Module | Coverage | Built source | What is covered, and what is missing |
|---|---|---|---|
| core_00 First Day | None | (all shells: brief, scope note, host welcome) | There is no induction, cast introduction or reporting-route walkthrough. The motto beat has no counterpart; the rule of thumb is the nearest thing. |
| core_01 Phishing emails | Part, large | E1, E2, E4, E5 defend halves; all 24 checks | Covered: pressures, reading the address and domain, look-alikes, pause-worthy requests, checking through a trusted channel, reporting when unsure (C01-LO1 to LO5). Missing: LO6, the first steps after clicking or typing a password (the debrief's `ifTrusted` shows the consequence but not the recovery), and the "threats arrive inside a real work task" frame. |
| core_02 Beyond email | Part | E3 (calls), E6 (texts, QR, "reply STOP"), E4 and E7 (voicemail); helpdesk and mobile checks | Covered: phone and text levers, verifying through a known number, QR before scanning (C02-LO1 to LO3, LO5). Missing: in-person approaches, chat apps, remote-access requests, and the personal-scam routes (7726, 159, Report Fraud appear in no shell). |
| core_03 Passwords and MFA | Part, narrow | E3 MFA beat (attack and defend push), helpdesk checks; E5 mentions the password manager | Covered: an unrequested push or flood, deny and report (C03-LO5). Missing: passphrases, the password manager, passkeys, reuse, and sharing (LO1 to LO4, LO6). |
| core_04 Spotting and reporting incidents | Part | Every debrief: report always visible, report sting, team-protected tally, customer report route, no-blame line | Covered: the reporting habit and culture (C04-LO2, LO5 in spirit). Missing: what counts as an incident, report content, first steps, what happens after a report (LO1, LO3, LO4, LO6). |
| core_05 Data protection | None | | |
| core_06 Handling information | None | | |
| core_07 Malware, ransomware, updates | Touch | E2 concept panel on macros and "enable content" | No ransomware or updates content. |
| core_08 Safe web and downloads | Part | E5 (address bar, look-alike domains, padlock myth, password manager not filling); general checks | Covered: C08-LO2 and the reporting half of LO6. Missing: downloads, fake "verify you are human" and paste-a-command pages, browser warnings, extensions. |
| core_09 Remote and mobile working | Touch | E6 work phone | Covers phone-borne lures only, not devices or working outside the office. |
| core_10 Physical security | None | | The QR code on a printed notice in E6 is a phishing channel, not building security. |
| core_11 Payment fraud and BEC | Part, large | E1, E7, E4; finance checks | Covered: bank-detail change, chief executive fraud, urgency and secrecy, a genuine-looking sender proves nothing, ring back on the number held (C11-LO1 to LO4). Missing: Confirmation of Payee (LO5), what to do if money has gone (LO6). Gift cards appear in 2 shells. |
| core_12 Social media and oversharing | Part | The OSINT stage of every attack half, with a "reduce note" per fact found; E2 social post asking for CVs; E4 public diary and travel | Covered: what an attacker learns from public posts, and what to keep off them (C12-LO1, LO2). Missing: privacy settings, fake profiles and recruiters, speaking for the organisation. |
| core_13 Removable media, cloud, shadow IT | None | | |
| core_14 Insider risk | None | | An insider-risk case for the same product line is designed in `designs/12_deduction_board.md` (use case B), but it is not an awareness episode and is not built. |
| core_15 Generative AI and deepfakes | Part, narrow | E7 cloned voice, E4 voicemails, `voicePanel` | Covered: voices can be faked, so verify through a trusted channel (C15-LO5, part of LO6). Missing: AI tool use, data in prompts, made-up output, prompt injection (LO1 to LO4). |
| core_16 Acceptable use | None | | |
| core_17 Capstone | Touch | Post-checks; the cross-role E7 | The post-check is a measured assessment, but there is no annual capstone, no chain-of-events day and no year profile. |
| role_01 Leaders and boards | Touch | E4 (executive as the impersonated target; the learner plays the PA); executive checks | Touches R01-LO6 (verify urgent instructions that claim to come from leaders). No board crisis, ransomware, notification or governance content. |
| role_02 Finance and payments | Part | E1, E7, finance checks | Covered: the bank-change process and pressure (part of R02-LO1, LO3). Missing: payment-run data review, payroll and refunds, the first hour after a fraud, PCI card data. |
| role_03 IT and service desk | Part, large (service desk half) | E3 role swap (3 calls, push), helpdesk checks | Covered: facts prove nothing, the callback to the number on file, not being talked round, never reading out a code (R03-LO1, LO2, LO6). Missing: least privilege, consent and tooling, alerts after a reset (LO3 to LO5). |
| role_04 Developers | None | | |
| role_05 Managers and HR | Part (recruitment lure half) | E2, HR checks | Covered: malicious CVs, portfolio links, "enable content". Missing: joiners, movers and leavers access; fake-candidate recruitment fraud (R05-LO4 is about borrowed identities, a different threat from E2's); responding to a reported mistake. |
| role_06 Customer-facing | Touch | E3's verification pattern | Same pattern (callback on the number held, never read out a code), but for internal staff, not customers. No account-takeover, scam-victim or card-payment content. |
| role_07 Procurement | Touch | E1 supplier impersonation | No supplier due diligence or contract security. |
| sector_01 Healthcare | None | | |

**Roles.** The build has six check roles: finance, hr, helpdesk, executive, general and mobile. The episodes also use the role ids `hr_recruitment` and `general_staff`, and E7 is "everyone" with no check of its own. Against the plan:

- finance matches role_02;
- helpdesk matches the service-desk half of role_03;
- hr matches the recruitment half of role_05;
- executive is the executive and PA as a target, which the plan has no role for (role_01 is the board in a crisis);
- general and mobile are all-staff channels that the plan treats as core modules (core_01, core_02, core_08), not roles.

The plan's role_04 developers, role_06 customer-facing, role_07 procurement and sector_01 healthcare have no built counterpart.

## 3. Conflicts, each resolved in favour of the build

| # | Conflict | Plan says | Build has | Recommendation |
|---|---|---|---|---|
| C1 | World | One fictional organisation, Larkspur Group (a facilities firm in the North of England, about 600 staff), a recurring cast of about 30 led by mentor Ama Owusu, the player as a new Operations starter, many locations (`03_WORLD_AND_CAST.md`) | One training room per company, with a kiosk and a host. There are four invented client companies, each with its own cast, `.example` domains and look-alikes, and the lab's brands are kept out (`BRAND_SET.md`). There is no recurring mentor; the hosts and the debrief carry the teaching | Retire Larkspur as the course's world. Write further modules as new episodes at existing or new client companies in the training-room frame, and add each company to `BRAND_SET.md`. Keep the plan's cast only as a pool of names, checked against `BRAND_SET.md`. **Name clash:** "Larkspur Travel" is already a supplier, genuine and look-alike, in the executive check forms (`awareness_pre_executive_ab`, items `ea_larkspur_bank` and `ea_larkspur_invoice`). Dropping Larkspur Group as a setting removes the confusion. |
| C2 | Module structure | Seven beats: Hook, Learn, Practise, Apply, Debrief, Check, Reference, over 15 to 20 minutes (`01_LEARNING_DESIGN.md`) | Brief, attack half (OSINT, write, optional build or MFA), flip, defend half, debrief. Checks are separate missions that bracket any set of episodes | Adopt the build's shape as the module template. Map the plan's beats onto it: the attack half and flip take the place of Hook and Learn, defend is Practise and Apply, the debrief is Debrief and Reference, and the separate post-check is Check. Rewrite `MODULE_TEMPLATE.md` and the "module pattern" section to match. |
| C3 | Attacker perspective | Optional, off by default, P3, sandboxed MG-30 "pretext workshop" with Jo Fairweather, never before detect and behave, landing last (`features/minigames.md` MG-30; principle 12) | The attack comes first and is the signature: the learner builds one artefact from templates and blanks filled with found facts (or a page, a call, a push run), judged by the rules engine, unscored, then flips to defence. A defend-only variant exists for every episode for customers who object | Make attack-first the default and the defend-only variant the opt-out, so the plan's "off by default" becomes "available off". MG-30 is in effect built as the mail client in template mode with the OSINT browser, intel facts and red-flag meter (plus the landing-page builder and the pretext call). Mark MG-30 as delivered by these and drop it as a separate minigame. |
| C4 | Assessment | A knowledge check bank (MG-20) of 5 or 6 scenario questions per module, an 80% pass, critical behaviours with loop-back, Secure / Developing / Not yet per outcome, completion records and certificates (`features/assessment_and_evidence.md`; `00_COURSE_OVERVIEW.md` "Course-level completion") | Pre and post spot-the-item checks per role: matched parallel forms, counterbalanced AB and BA, `passPercent: 0` and no pass or fail. Missions are `scoring: "completion"`. Per-item records in `awareness-measure`, with the organiser-only discrimination figure and xAPI-shaped blocks. The episode is scored on the defend half only (60 for the verdict, 40 for the flags; reporting is never penalised). No effectiveness claim | Replace the per-module knowledge-check bank and pass rule with the built pre and post design. If a compliance buyer needs a pass mark, add it as an organisation setting on the post-check's percent. Keep "no blame, report never penalised" as it is in both. Drop Secure / Developing / Not yet unless it is later built from `perFactor`. |
| C5 | Role list | role_01 to role_07 plus sector_01 | finance, hr, helpdesk, executive, general, mobile (plus E7 "everyone") | Adopt the six built roles as the role list. Add the executive/PA role, which the plan lacks. Treat general and mobile as roles for check purposes. Keep role_04, role_06, role_07 and sector_01 as gaps (section 4), not as competing role definitions. |
| C6 | Product name | Open (D3): "Break Escape: At Work", "Pause. Check. Report.", "Larkspur"; the plan says "the awareness course" until a pilot | "Incident Simulations: Critical Cases" (user decision F2), with "Awareness E*" and "Awareness check" mission titles | Close D3 with the built name. Use "Incident Simulations: Critical Cases" in the plan, and "awareness episodes" for the series. |
| C7 | Motto | "Pause. Check. Report." heads every module and reference card | "The habit to keep" rule of thumb (quoted in 1.6), identical in all 38 shells and enforced by a test; the "On Monday" card; the "REPORT IT" poster | Replace the motto with the built rule of thumb wherever the plan quotes it (core_00, core_17's C17-LO1, reference cards). If a three-word tag is still wanted, it has to be a user decision added to `awareness_deploy.py`, not a plan-only phrase. |
| C8 | Runtime LLM | The plan's core_15 assumes an in-game AI assistant the player uses (MG items for AI chat) | No language model in the game (decision P); everything is authored data or ink | Any future core_15 episode must use a scripted or authored "assistant", never a live model. Say so in the core_15 plan. |
| C9 | Timings | 15 to 20 minute modules, 3 to 5 minute micro-drills, a 10 to 15 minute text route, a 35 minute capstone | 13 minute full episodes (E7 14; E3 accepted at about 17), 8 minute defend-only variants, 4 or 5 minute checks; a pre-check, one episode and a post-check come to about 21 to 26 minutes. Human timing runs are postponed | Use the built figures. The defend-only variant (8 minutes) is the nearest thing to a micro-drill. |
| C10 | Mentor and explainers | Mentor NPC (EX-01), engine-recorded videos (EX-02), in-world documents, intranet terminal reference card (BE-09) | The host's welcome, the scope note, immediate per-item feedback, concept panels (E2 macros, E4 and E7 voice), the debrief. No video, no intranet terminal | Drop the mentor, video and intranet-terminal dependencies for the episode format. Keep the explainers as concept panels and feedback strings. |
| C11 | Company domains and names | Real-looking UK domains (`thelark.larkspur.co.uk`) pending trademark checks (D2) | Every domain ends `.example`. Invented brands only, with a pre-ship web search per company | Close D2 in favour of the `.example` rule and the `BRAND_SET.md` roster. |
| C12 | Platform delivery | Many new Hacktivity features (HA-01 to HA-26: organisations, assignments, certificates, policy acknowledgement, dashboards) | Ordinary Hacktivity missions in the `training` collection, sequenced by the organiser. Only one platform change is proposed: the reporting-route setting (1.7). SCORM, xAPI, LTI, SSO and dashboards are deferred | Treat the HA list as a later wish list. The first platform change is the reporting-route setting, pending the user's answer. |

### Plan decisions (`DECISIONS_PENDING.md`) already answered elsewhere

| Plan item | Answer found | Where |
|---|---|---|
| D1 Own world or campaign | Its own line, not SAFETYNET, on a neutral corporate skin. The world is the training room plus client companies, not Larkspur | F2, `PHISHING_AND_SE_DECISIONS.md`; `designs/11` |
| D2 Organisation name | Superseded: four invented companies, `.example` domains, pre-ship web search | `awareness/BRAND_SET.md` §1 |
| D3 Course name | "Incident Simulations: Critical Cases" | F2 |
| D4 Hacktivity or LMS | Hacktivity first (the `training` collection); SCORM, xAPI and LTI later | `designs/11` §6.3; README "Defaults taken" |
| D5 Phishing simulation | Not built; the build measures on matched in-game items and makes no real-world click-rate claim | `designs/11` §5.2 |
| D7 Videos | No videos; text-to-speech voices and concept panels | build (all shells) |
| D8 Test-out | Not a test-out, but the defend-only variant (8 minutes) offers the measured defence without the attack | decision V |
| D12 Technical phishing lab | The technical product is `lab_social_engineering` ("Phishing and Social Engineering", `lab_games` collection, browser-only, no VM). The VM phishing plan is parked | `PHISHING_AND_SE_DECISIONS.md` (A2, A3, I1 to I5 superseded); lab `mission.json` |
| core_00 "scam in the first minute"; the Jo Fairweather authorised-test reveals | Overtaken by the build: the frame is an openly authorised exercise ("Authorised exercise at ... a fictional company") stated in every scope note, so there are no hidden-test reveals | episode `scopeNote` strings |
| core_17 "who sees the year profile" | Equivalent answered: scores go to the learner only, the discrimination figure to organisers only, never shown as blame; aggregates are out of scope for now (A4, A7) | `FUN_DECISIONS.md` aw3, disc_visible; `designs/11` §4.3 |
| Customer's reporting details in the game (BE-05 organisation profile) | `slot:customer_report_route` is built (aw1). The deployment setting is to be a Hacktivity setting; the options are not yet answered | `FUN_DECISIONS.md` route_config; `HACKTIVITY_ROUTE_PROPOSAL.md` |

Still open in both: D6 (market order and localisation; the build is UK-flavoured with localisation later), D9 (an accessibility commitment; the build has a keyboard-and-plain-text baseline but no text route), D10 (where Hacktivity plans live), D11 (compliance gaps).

## 4. What the plan has that the build lacks (worth keeping)

Recast each of these as an episode, or as a check, in the training-room frame:

1. **Topics with no episode yet:** data protection (core_05), handling information and redaction (core_06), malware, ransomware and updates (core_07), downloads and fake "verify you are human" or paste-a-command pages (core_08), devices away from the office (core_09), physical security and tailgating (core_10), removable media and shadow IT (core_13), insider risk (core_14; `designs/12` use case B already proposes one for this product line), AI tool use and prompt injection (core_15 LO1 to LO4), acceptable use and policy acknowledgement (core_16).
2. **Roles and sectors:** developers (role_04), customer-facing account-takeover callers (role_06, a natural reuse of the E3 role swap), procurement (role_07), healthcare (sector_01), and the board-crisis decision game (role_01).
3. **After-the-click content:** the first steps after clicking, entering a password or paying (C01-LO6, C04-LO3 and LO4, C11-LO6, R02-LO5). The build teaches "report", but not what to do next.
4. **UK reporting routes for personal scams:** 7726, 159 and Report Fraud (C02-LO6, R06-LO5). They appear in no shell.
5. **Confirmation of Payee** (C11-LO5) in the finance defend set or the checks.
6. **Password hygiene:** three random words, password managers, passkeys (C03-LO1 to LO4, LO6).
7. **Accessibility:** an equivalent text route (BE-03) and a WCAG 2.2 AA commitment and statement (D9). `designs/11` defers the screen-reader audit.
8. **Facilitated sessions:** facilitator notes and timings. The `facilitated` engine flag exists but no shell uses it, and lab sheets and facilitator notes are scheduled last.
9. **Spaced practice:** micro-drills through the year. Defend-only shells could serve as the vehicle.
10. **Compliance mapping** (`02_COMPLIANCE_MAPPING.md`) and course-level evidence: per-outcome tagging, completion records, version stamps and certificates. This is useful sales material once re-pointed at the built episodes and checks. The D11 gaps carry over unchanged.
11. **Organisation profile beyond the reporting route** (BE-05): renamed classifications and customer policy text. The `customer_report_route` slot is the start of this.
12. **Topic-boundary table** (`00_COURSE_OVERVIEW.md`): keep it to stop overlap as new episodes are added. For example, E1, E4 and E7 already share payment fraud, and E5 and the general checks share reading web addresses.
