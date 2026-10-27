# core_03: Passwords, passphrases and MFA

**Working game title:** Keys to the Kingdom
**Pitch:** Run a password-guessing rig against a colleague from their public details, then flip to your own account under a prompt flood and lock it all down with a manager, unique passwords and a passkey.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 is the first-play brief in the kiosk frame; none required |
| Full episode | About 15 minutes (E9); the MFA stage is built inside E3 (about 15 minutes) |
| Defend-only variant | About 8 minutes |
| Pre and post check | about 9 minutes each (the helpdesk form carries the MFA push item), no pass mark |
| Text route | A gap in the build (BE-03), still to come |
| Priority | Built (the E3 MFA stage); E9 passwords and password managers is new |
| Build size | Built for MFA fatigue; the new work is E9, in the built shape |

## Build status

**Narrow build** (`research/built_episodes_vs_plan.md` §2). Only the MFA-fatigue outcome is built so far, inside E3; the rest of the module is the new episode E9.

| Outcome | Covered by | Status |
|---|---|---|
| C03-LO1 how passwords are stolen; why reuse multiplies | not yet taught | **New (E9)** |
| C03-LO2 three random words; length beats symbols | not yet taught (E5 mentions the manager) | **New (E9)** |
| C03-LO3 a password manager for a unique password per account | not yet taught | **New (E9)** |
| C03-LO4 choose the strongest sign-in protection | the E3 authenticator demo shows number matching | **Builds on E3; fuller in E9** |
| C03-LO5 recognise an unrequested prompt or code; deny and report | **E3 MFA stage**: the attacker push run and the defend push card (deny and report) | **Built (E3)** |
| C03-LO6 refuse to use, share or write down passwords; get access properly | not yet taught | **New (E9)** |

**What is built:** E3 (Quayholt Insurance, helpdesk) includes an MFA-fatigue stage. In the attack half the learner runs an attacker-side push flood in a mock authenticator, choosing how many pushes to send and when (for example late at night), and the debrief explains why fatigue works; in the defend half (the role swap) one card is an unrequested push whose right move is deny and report, Verify on. That carries C03-LO5.

**What is new:** E9 *passwords and password managers* (built shape, new), proposed at **Tarrowby Logistics** (the haulier's depot, where shared PCs, sticky notes and warehouse logins make the password habits concrete), host **Nilesh Solanki**, the Tarrowby IT service-desk analyst, both already in `BRAND_SET.md`. E9 carries LO1 to LO4 and LO6 and reuses the E3 authenticator demo for the prompt cards. Its place in the roadmap is `04_BUILT_SO_FAR.md` §4; its design is in `game_design.md`.

## Why this module

A password is the key to everything an account can open: email, payroll, customer records, and the trust of everyone the account can write to. Most stolen passwords are not cracked by genius. They are phished (core_01), reused from another site's breach, guessed from the usual list, or lifted from a home computer by malware. Reuse is the multiplier: one breach of a small website hands an attacker a working key to every account that shares the password. Multi-factor authentication (MFA) stops most of these attacks, so attackers now work on the person holding the phone instead.

- **23andMe, 2023.** An attacker reused logins leaked from other breaches to get into accounts between April and September 2023, exposing data on 155,592 UK residents. The ICO (since 30 September 2026, the Information Commission) fined the company £2.31 million in June 2025, noting there was no mandatory MFA.
- **Uber, 2022.** An attacker had a contractor's password. The contractor received repeated approval requests and eventually accepted one, and the attacker was in. Press reports said the attacker had also messaged the contractor pretending to be Uber IT.
- **Advanced, 2022.** Attackers got into a supplier of NHS and social care software through a customer account without MFA; NHS 111 services were disrupted and 79,404 people's data was put at risk. The ICO fined the company £3.07 million in March 2025.

In the UK government's Cyber Security Breaches Survey 2025, only 40% of businesses used two-factor authentication. The fixes are cheap and well understood: a different password for every account, kept in a password manager; MFA everywhere, with passkeys where offered; and never approving a prompt or sharing a code you didn't ask for. Sources are in `concepts.md`.

## Target behaviours

1. **Uses a different password for every account**, kept in a password manager, starting with email; uses three random words for the few passwords they must remember.
2. **Turns on the strongest sign-in protection offered** (a passkey where available), and **denies and reports any MFA prompt or code they didn't start**, however many arrive and whoever asks them to approve it.
3. **Keeps passwords and codes to themselves**: never writes them where others can see, never uses someone else's, and asks the service desk for proper access instead.

## Learning outcomes

After this module, staff can:

- **C03-LO1** Explain the main ways passwords are stolen (phishing, reuse from other sites' breaches, guessing, malware) and why reuse turns one breach into many.
- **C03-LO2** Make a strong password from three random words, and explain why length and unpredictability beat symbols, swaps and forced regular changes.
- **C03-LO3** Use a password manager to create, store and fill a unique password for every account, including made-up answers to security questions.
- **C03-LO4** Choose the strongest sign-in protection on offer (a passkey or security key, then an authenticator app with number matching, then a text message code) and say why.
- **C03-LO5** Recognise an MFA prompt or code they didn't start, including a flood of prompts and a fake "IT" message asking them to approve, then deny it and report it.
- **C03-LO6** Refuse to use, share or post passwords where others can see them, and get access the proper way (their own account, a shared vault, the service desk).

## Compliance coverage

Contributes to (short references as in `02_COMPLIANCE_MAPPING.md`, section 2):

- **ISO 27001 A.6.3**; **ISO 27002 6.3**, which names password security among the baseline controls staff should know.
- **NIST AT-2** (what users do to stay secure).
- **CIS 14.3** (authentication best practices: MFA, password composition, credential management).
- **PCI DSS 8.3.8** (authentication policies and procedures communicated to all users).
- **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **NIS2 IR recital 20** lists MFA among user cyber hygiene (context, not a requirement).
- **DORA Art 13(6)**, for EU financial entities.
- **UK GDPR Art 32**.
- **DSPT 2.1.1, 3.2.1 (categories 3 and 4)**, for NHS customers.
- **HIPAA 164.308(a)(5)(ii)(C) and (D)**, **FTC 314.4(e)** and **CMMC AT.L2-3.2.1**, for US customers.

Not a training requirement, but worth telling buyers: **Cyber Essentials v3.3** (from 27 April 2026) asks organisations to "support users to choose unique passwords for their work accounts", for example by teaching them to avoid common passwords, promoting three random words and providing a password manager. E9 is that support; it doesn't make Cyber Essentials a training standard.

Measurement is the pre and post check pair (the helpdesk form carries the MFA push item; E9 adds password-practice items), not a per-module pass mark; see `assessment.md`.

## Module flow

The built episode shape. E9 is a full episode; the E3 MFA stage sits inside E3. A full episode is about 15 minutes; the defend-only variant is about 8 minutes.

| Stage | What happens | Scored |
|---|---|---|
| Brief and scope note | The host welcomes the learner and names the exercise as authorised, at a fictional company | no |
| Attack | E9: run a password-guessing and reuse rig against a fictional colleague, filling the guess list with facts found in the OSINT browser (a pet, a team, a year); watch which guesses land. E3 MFA: run an attacker push flood. Unscored | no |
| Flip | The learner's own account comes under a prompt flood and a fake "IT" message giving a number to type | no |
| Defend | E9: triage password-practice decisions and sign-in prompts (approve the one you started, deny and report the ones you didn't), Verify on. E3: the role-swap push card | yes |
| Debrief | Reasoning cards, genuine-item feedback, the team-protected tally, the habit to keep, the "On Monday" card ("three things to do at home tonight"), the customer report route and the no-blame line | no |
| Pre and post check | Helpdesk and (for E9) general or mobile forms bracketing the episodes, no pass mark | the checks are scored, with no pass or fail |

## Reuse from existing Break Escape content

Built on the awareness systems on main:

- the episode runner and step strip, in the Quayholt (E3) and a Tarrowby (E9) training room;
- the OSINT browser and intel facts (E9's guess-list attack);
- the MFA authenticator demo, with the storm, enrolment, the practice list and the look-alike passkey test (E3 and E9);
- the inbox-triage defender with its `push` card kind, the report button and Verify;
- the flip view, concept cards, the debrief view and awareness-measure records;
- the look-alike NPC guard and the social validator's strict social job.

E9 needs a password-manager and passphrase surface (word tiles, a strength meter and a guesser) in the attack and defend halves. If this is not yet a built authorable surface, it is the one new engine piece E9 requires; the attack guess-list can run on the OSINT browser and intel facts, and the defend half on the authenticator demo, until it is built.

## New features needed

The engine is largely built. The open MVP gaps and the one E9-specific surface:

- **BE-03** a text route and **BE-04 and BE-26** accessibility beyond the social overlays;
- **BE-19** a real `#trigger_minigame`;
- the password-manager and passphrase surface for E9 (word tiles, meter, guesser, vault health, a sign-up fill test): a new authorable minigame, built with no free-text password field so no real password can ever be collected.

No runtime language model is used; the guesser, the judge, the replies and the feedback are authored data. No video.

## Organisation-specific content

- The approved password manager, how staff get it, and whether browsers may save work passwords.
- The MFA methods offered (passkeys, security keys, an authenticator app with number matching, text codes) and how to enrol or change method.
- How to report an unexpected prompt or code (the app's Report option, the service desk, the security team), through the `customer_report_route` slot.
- The 24/7 service desk number.
- The password policy points worth stating (minimum length, blocked common passwords, no forced expiry).
- The approved way to handle shared accounts (named accounts, a shared vault).
- Any breach-check or password-health tool the organisation provides.

## Open questions

1. **E9 company and host.** Proposed at Tarrowby Logistics with host Nilesh Solanki, because the depot's shared PCs and sticky notes make the password habits concrete. *Recommendation: confirm Tarrowby and Nilesh Solanki, both already in `BRAND_SET.md`.*
2. **The password surface.** E9 needs a word-tile passphrase builder and vault with no free-text field. *Recommendation: build it as an authorable minigame; until then, run E9's attack on the OSINT browser and its defend half on the authenticator demo and simple cards.*
3. **Passkeys for staff accounts.** Not every organisation offers them. *Recommendation: teach the ladder (passkey, then an app with number matching, then a text code); where the organisation profile says no passkeys, the enrolment sets up the app, and the card says "use a passkey at home where you can".*
