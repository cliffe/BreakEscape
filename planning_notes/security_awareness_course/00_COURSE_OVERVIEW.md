# Course overview

## What this is

A cyber security awareness course for all staff in an organisation, built from short Break Escape games and hosted in Hacktivity. It extends the built product line **Incident Simulations: Critical Cases** (user decision F2): a line apart from SAFETYNET, with a neutral corporate skin, delivered as ordinary missions in the Hacktivity `training` collection and ordered by the organiser. It is designed to help meet the training requirements of the common standards and laws (ISO/IEC 27001, PCI DSS, NIS2, DORA, UK GDPR, the NCSC Cyber Assessment Framework, the NHS Data Security and Protection Toolkit and others; see `02_COMPLIANCE_MAPPING.md`) while being something staff would choose to play.

What is already built, and how this plan was reconciled with it, is in `04_BUILT_SO_FAR.md`. Labels used below: **Built** (on main), **Builds on E# / system X** (extends something built), **New** (plan only).

## Who it is for

- **All staff**, from new starters to the board, including people who rarely use a computer at work.
- **People in roles with extra risk.** Built check roles: finance, hr, helpdesk, executive, general and mobile. Later roles (New): developers, customer-facing staff, procurement, and leaders and boards in a crisis.
- **Sector staff** with sector rules, starting with healthcare (New).
- **The organisation's security, compliance and HR teams**, who assign the course, follow completion and show the evidence to auditors.

## What makes it different

- **Attack first, then defend.** **Built.** In each episode the learner looks at public sources, builds one attack from templates whose blanks only take facts they have found, then sees their own message land in a defender's inbox with its tells highlighted, before triaging a scored set of messages. Defend-only is the opt-out, for customers who object to the attack half.
- **The habit to keep.** **Built.** Every debrief ends on the same rule of thumb, word for word: *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* Reporting quickly, including after a mistake, is rewarded and never penalised, and every debrief shows the customer's own reporting route and a no-blame line.
- **Short.** **Built.** About 15 minutes an episode (E6 and E7 about 16), about 8 minutes defend-only (recommended for sessions under 30 minutes), about 9 minutes a check (finance checks about 8 to 10).
- **Measured, not graded.** **Built.** Role-based pre and post checks on matched parallel forms, with no default pass mark. Records hold item ids, verdicts and times, never free text and never the learner's identity. The product makes no effectiveness claims.
- **Accessible.** The build has a keyboard and plain-text baseline. An equivalent text route and a WCAG 2.2 AA commitment are **New** (BE-03, BE-04, BE-26).

## Pathways

A pathway is a role check pair (a pre-check and a post-check for one role) around one or more episodes, with defend-only shells for drills.

| Pathway | Who | What it holds | Status | Time |
|---|---|---|---|---|
| **Role pair** | Anyone, by role | The role's pre-check, its episode (or the defend-only variant), then the post-check in the paired order (AB or BA). finance: E1 (and E7); hr: E2; helpdesk: E3; executive: E4; general: E5; mobile: E6 | **Built** (the organiser orders the missions by hand) | About 33 minutes (about 34 with E6 or E7) |
| **Everyone episode** | All staff | E7 cloned CEO voice, optional, with no check of its own | **Built** | About 16 minutes |
| **Defend-only route** | Customers or learners who opt out of the attack half | The defend-only variant of each episode in place of the full episode; the same defend set, so the measurement is unchanged | **Built** (E6 and E7 keep both versions listed, with organiser guidance; two courses are seeded in Hacktivity, one with the defend-only episodes and one with both versions) | About 8 minutes each |
| **Induction starter** | New starters, in the window the organisation sets | A first-play "how it works" brief (core_00), then the general pair with E5, then E1 or E6 as the organisation chooses | **Builds on** the general checks and E5; core_00 is **New** | About 53 minutes, in two sittings |
| **Core library** | All staff over their first year, or as assigned | New episodes for the core topics with no episode yet (D15 order in the roadmap), each with a defend-only variant and new check items | **New** | About 15 minutes each |
| **Spaced drills** | All staff, optional, set by the organisation | Defend-only shells spaced through the year | **Builds on** the defend-only variants | 8 minutes each |
| **Annual refresher** | All staff every 12 months | core_17: a mixed edition built from the existing defend sets, with the role's post-check | **Builds on** the defend sets and post-checks | About 20 minutes |
| **Later roles and sectors** | Developers, customer-facing staff, procurement, healthcare | Each needs its own episode and its own check form pair | **New** | About 33 minutes per pair |

## Module catalogue

Minutes are episode-shaped targets: **Full** is the full episode (brief, attack or consequence half, flip, defend, debrief) and **Defend-only** is the variant of about 8 minutes, recommended for sessions under 30 minutes. Checks (about 9 minutes each) sit around the episodes and are not counted here. **Built** gives the episodes and checks that already cover the module, from `04_BUILT_SO_FAR.md` §3.

| Id | Module | Working game title | Audience | Built | Full | Defend-only | Priority | Size |
|---|---|---|---|---|---|---|---|---|
| core_00 | First play: how the episodes work, and the habit to keep | First Day | All staff | None (every shell has a brief, scope note and host welcome) | 5 | none | MVP | S |
| core_01 | Phishing emails | Inbox Zero | All staff | **Large**: E1, E2, E4, E5 and every check | 15 | 8 | MVP | L |
| core_02 | Social engineering by phone, text, QR code and in person | The Caller | All staff | Part: E3, E6, E4 and E7 voicemail; helpdesk and mobile checks | 15 | 8 | P2 | M |
| core_03 | Passwords, passphrases and MFA | Keys to the Kingdom | All staff | Narrow: E3 MFA stage; helpdesk checks | 15 | 8 | MVP | M |
| core_04 | Spotting and reporting incidents | The Golden Hour | All staff | Part: report button, tally, route box and no-blame line in every debrief | 15 | 8 | MVP | M |
| core_05 | Data protection and privacy | Personal Effects | All staff | None | 15 | 8 | MVP | M |
| core_06 | Handling information: classification, sharing, sending and disposal | Need to Know | All staff | None | 15 | 8 | P2 | M |
| core_07 | Malware, ransomware and updates | Zero Hour | All staff | Touch: E2 macro panel | 15 | 8 | P2 | M |
| core_08 | Safe web browsing and downloads | The Download | All staff | Part: E5 address bar and padlock myth; general checks | 15 | 8 | P2 | L |
| core_09 | Remote and mobile working | On the Move | All staff | Touch: E6; mobile checks | 15 | 8 | P2 | L |
| core_10 | Physical security | Tailgate | All staff | None | 15 | 8 | P2 | M |
| core_11 | Payment fraud and business email compromise | Change of Details | All staff | **Large**: E1, E7, E4; finance checks | 15 | 8 | P2 | M |
| core_12 | Social media and oversharing | Open Book | All staff | Part: OSINT "reduce" notes in every attack half; E2 and E4 posts | 15 | 8 | P3 | M |
| core_13 | Removable media, cloud storage and shadow IT | Workaround | All staff | None | 15 | 8 | P3 | M |
| core_14 | Insider risk | Notice Period | All staff | None | 15 | 8 | P3 | M |
| core_15 | Generative AI and deepfakes | The Assistant | All staff | Narrow: E7, E4 voice | 15 | 8 | P2 | M |
| core_16 | Acceptable use and your responsibilities | Small Print | All staff | None | 15 | 8 | MVP | S |
| core_17 | Capstone: the annual mixed edition | Year End | All staff | Touch: post-checks | 20 | none | P2 | L |
| role_01 | Leaders and boards | Crisis Room | Directors, senior leaders, trustees | Touch: E4; executive checks | 15 | none | P2 | M |
| role_02 | Finance and payments | Payment Run | Finance, payroll, accounts payable | Part: E1, E7; finance checks | 15 | 8 | P2 | M |
| role_03 | IT administrators and service desk | Reset Request | IT staff, privileged users | **Large** (service desk half): E3 role swap; helpdesk checks | 15 | 8 | P3 | M |
| role_04 | Developers | Ship It | Developers, technical staff | None | 15 | 8 | P3 | M |
| role_05 | People managers and HR | Joiners, Movers, Leavers | Line managers, HR | Part: E2; hr checks | 15 | 8 | P3 | M |
| role_06 | Customer-facing and contact centre staff | Who's Calling? | Contact centre, reception, account managers | Touch: E3's verification pattern | 15 | 8 | P3 | M |
| role_07 | Procurement and supplier management | Due Diligence | Procurement, contract owners | Touch: E1 supplier impersonation | 15 | none | P3 | M |
| sector_01 | Healthcare staff | Ward Round | Clinical and admin staff in health and care | None | 15 | 8 | P3 | M |

Topics with no natural attacker (core_05, core_06, core_16) use the **consequence flip**: the learner makes the everyday mistake in a safe sandbox and the flip shows where it led (R3, `01_LEARNING_DESIGN.md`). They can also use the defend-only shape (D13).

Two other delivery modes stay in the plan as **New**: a text route (BE-03) and a facilitated version for a team on one screen (the runner's `facilitated` flag exists, but no shell sets it yet). See `01_LEARNING_DESIGN.md`.

### Topic boundaries

Some topics touch. To avoid two modules (or two episodes) teaching the same thing differently:

| Topic | Taught in | Touched in |
|---|---|---|
| Recognising phishing emails | core_01 | core_11 (payment requests), core_15 (AI-written phishing), core_17 |
| Payment fraud: bank-detail changes, executive impersonation, cloned voice | core_11 | core_01, core_15, role_02. **Built overlap:** E1 (bank-detail change), E4 (executive whaling) and E7 (cloned CEO voice) all touch it; new payment items must not repeat their tells |
| Calls, texts, QR codes, people at the door | core_02 | core_10 (in person at the building), role_03 and role_06 (callers at work) |
| What to do after clicking or entering a password | core_04 | core_01, core_03 |
| Personal data and the law | core_05 | core_06 (handling), role_05 (HR data) |
| Classification, sending, sharing and disposal | core_06 | core_05, core_13 |
| Software updates | core_07 | core_08, core_09 |
| Downloads, fake sites, browser warnings | core_08 | core_07 |
| Reading web addresses | core_08 | core_01. **Built overlap:** E5 and the general checks |
| Devices outside the office | core_09 | core_10 |
| Deepfake voice and video | core_15 | core_11, role_01, role_02, role_05 |
| Sharing credentials, leavers taking data | core_14 | core_03, role_05 |
| Policy acknowledgement | core_16 | every module's "On Monday" card |
| Free online tools (converters, transfer sites, apps) | core_08 asks "is this site or file safe to download?"; core_13 asks "should our data go there?" | core_15 (AI tools are core_15's) |
| Redaction | core_06 owns the technique (the black-box trap, hidden content); core_05 owns the judgement of what to remove | |

The concepts file for the module that teaches a topic is the source of truth; modules that touch it point to it rather than restating it.

## Course-level completion

**Built:** every awareness mission uses completion scoring. A mission is complete when the learner reaches its conclusion: the host completes it once the defend or check result has synced. There is **no default pass mark** (the checks set `passPercent` to 0). The scored parts are the defend half of an episode and the checks; the attack half is never scored or ranked, and reporting is never penalised.

The evidence an organisation gets:

1. completion of each mission it ordered (pre-check, episode or defend-only variant, post-check);
2. the post-check, which shows the change from the newest pre-check on matched items, or says there is no baseline;
3. awareness-measure records per item: item id, form, verdict, chips, score, stage, variant and time to answer, with no free text and no learner identity;
4. a discrimination figure (hits on phish against false alarms on genuine items) for organisers only.

**New, as later organisation options:** a pass mark or certificate on the post-check percent; policy acknowledgement (core_16, HA-07); version stamps on records. None is a default. Who sees what on the hosting platform is a platform question, outside this plan.

## Roadmap

This replaces the old phased roadmap (`04_BUILT_SO_FAR.md` §4).

1. **Finish the built product first.** The product resumed on 2026-10-27 (`HANDOVER.md`). Playtests P6 and P7, dialogue review cycles C1 to C5, training-room review cycles C1 to C3, the light puzzle-chain pass and the POV conversation backgrounds are done. The remaining items are host character art after the PixelLab reset (3 Nov, all 19 concepts approved), human timing runs (postponed) and one facilitator guide for the course, in the lab-sheet system, written last. This is not this plan's work.
2. **Close the engine gaps that every new episode needs.** These are the open catalogue items in `features/README.md` with build status "Not built" and priority MVP:
   - BE-03 text route;
   - BE-04 and BE-26 accessibility beyond the social overlays;
   - BE-19 a real `#trigger_minigame`;
   - BE-20 an authorable title and tutorial (today they still show Hacktivity and spy text);
   - BE-23 pause that also stops the clock;
   - BE-25 Unicode name entry;
   - BE-30 configurable call labels.
3. **New episodes, in this proposed order** (D15): each is a full episode, a defend-only variant and new items for the check forms, in the built shape, at a brand-set company.
   - E8 *after the click* (core_04 and core_01 LO6);
   - E9 passwords and password managers (core_03);
   - E10 fake downloads and "verify you are human" pages (core_08 and core_07);
   - E11 misdirected and overshared data (core_05 and core_06, consequence flip);
   - E12 the visitor and the tailgater (core_10, with person-chat in the training room);
   - E13 the AI assistant (core_15, authored);
   - then the remaining core topics, the role extensions and sector_01.
4. **New check roles** for developers, customer-facing staff, procurement and healthcare, once their episodes exist.
5. **Platform**: only the reporting-route setting, once the user answers. The rest of the HA list is wish list.

## How each module was planned

Each module folder holds four files (`MODULE_TEMPLATE.md`): a module card with its build status, the concepts (the source of truth), the episode design and the assessment (candidate check items and mirror pairs). Turning a plan into an episode follows the existing loops in `AGENTS.md`: plan, adversarial review, implement, playtest. The awareness episodes are a kind of game alongside the campaign, the Security-Informed Safety games and the labs; their aims are set out in `01_LEARNING_DESIGN.md` and should go into every reviewer's prompt.
