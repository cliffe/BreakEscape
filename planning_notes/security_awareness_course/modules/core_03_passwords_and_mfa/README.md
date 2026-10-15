# core_03: Passwords, passphrases and MFA

**Working game title:** Keys to the Kingdom
**Pitch:** At 02:13 your phone starts asking you to approve a sign-in you never started; by lunchtime you've locked down your accounts and you're helping the warehouse do the same.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast, the phone and the first MFA prompt); none required |
| Full module | 15 minutes |
| Micro-drill | 4 minutes ("Approve or Deny?") |
| Text route | 10 minutes |
| Priority | MVP |
| Build size | M, driven by the MFA prompts and authenticator (MG-07) and the password manager and passphrase builder (MG-08), which core_00, core_04 and core_17 also use |

## Why this module

A password is the key to everything an account can open: email, payroll, customer records, and the trust of everyone the account can write to. Most stolen passwords are not cracked by genius. They are phished (core_01), reused from another site's breach, guessed from the usual list, or lifted from a home computer by malware. Reuse is the multiplier: one breach of a small website hands an attacker a working key to every account that shares the password. Multi-factor authentication (MFA) stops most of these attacks, so attackers now work on the person holding the phone instead.

- **23andMe, 2023.** An attacker reused logins leaked from other breaches to get into accounts between April and September 2023, exposing data on 155,592 UK residents. The ICO (since 30 September 2026, the Information Commission) fined the company £2.31 million in June 2025, noting there was no mandatory MFA.
- **Uber, 2022.** An attacker had a contractor's password. The contractor received repeated approval requests and eventually accepted one, and the attacker was in (Uber's own account of the incident). Press reports said the attacker had also messaged the contractor pretending to be Uber IT.
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
- **PCI DSS 8.3.8** (authentication policies and procedures communicated to all users: choosing strong factors, protecting them, not reusing passwords, changing them and reporting if compromised).
- **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **NIS2 IR recital 20** lists MFA among user cyber hygiene (context, not a requirement).
- **DORA Art 13(6)**, for EU financial entities.
- **UK GDPR Art 32**.
- **DSPT 2.1.1, 3.2.1 (categories 3 and 4)**, for NHS customers.
- **HIPAA 164.308(a)(5)(ii)(C) and (D)** (log-in monitoring and reporting discrepancies; password management), **FTC 314.4(e)** and **CMMC AT.L2-3.2.1**, for US customers.

Not a training requirement, but worth telling buyers: **Cyber Essentials v3.3** (from 27 April 2026) asks organisations to "support users to choose unique passwords for their work accounts", for example by teaching them to avoid common passwords, promoting three random words and providing a password manager. This module is that support; it doesn't make Cyber Essentials a training standard.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 02:13: the phone lights up with sign-in prompts the player didn't start, then a message from "IT" gives a number to type "to make them stop". What they do is the baseline | Game: night scene in the conversation panel (MG-07; the message in `phone-chat`) | 1 to 2 |
| Learn | Next morning at the service desk, Owain shows how the attacker had the password (a breached trade show site, and reuse), then the three habits: a manager, MFA with passkeys first, and "didn't start it, don't approve it" | NPC explainer with visual aids (EX-01, BE-08) | 2 to 3 |
| Practise | "Lock it down": roll a passphrase for the manager and race the guesser, fix the vault's reused passwords (email first), make up security answers, move to a passkey, then "Approve or Deny?" (six prompts) | Minigames (MG-08, MG-07) | 3 |
| Apply | "Stock check": get the care home stock figures from Kev's warehouse office by 12:00. A shared PC with its password on a sticky note, a supplier portal to sign up to, a sign-in prompt for another system that lands just as they expect one of their own, and Kev, who uses one password for everything | Game (BE-18, MG-08, MG-07) | 5 |
| Debrief | The night's prompts and the afternoon's prompt side by side; the breach list and who it reached; what Kev changed | Debrief screen (BE-02), then Owain and Ama | 1 to 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The reference card on The Lark, plus three things to do at home tonight | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_IT` (Owain's service desk, for Learn, Practise and the debrief); Kev's warehouse office as `small_office_room2_1x1gu`, redressed with hi-vis jackets on hooks, clipboards and a shared PC by a window onto the loading bay (or the warehouse floor core_07 builds, if it exists first); `hall_1x2gu` between them. The night scene needs no room: it plays in the conversation panel over a bedroom-at-night background.
- **Conversations:** `person-chat` for Owain, Ama and Kev (multi-speaker for Owain and Ama); `phone-chat` for Lena's task, the fake "IT" message and the night service desk; and, until MG-07 exists, a phone contact "Larkspur Authenticator" whose prompts are ink choices.
- **Minigames:** `password` for the shared PC, whose built-in post-it (`postitNote`, `showPostit` in `public/break_escape/js/minigames/password/password-minigame.js`) is exactly the sticky note on the monitor; `examine` for the second note under the keyboard; `container` for the PC's desktop and the stock file; `notes` for Owain's three-habits card.
- **The cold open:** an NPC `timedConversation` with `background`, `waitForEvent: "game_loaded"`, `skipIfGlobal` and `setGlobalOnStart` (`README_scenario_design.md`, "NPC Timed Conversations").
- **Pacing:** `timers[]` with `startOnGlobal`, `cancelOnGlobal` and `setGlobal` for the prompt flood and the Ledger prompt (`public/break_escape/js/ui/scenario-timer-dispatcher.js`); globals for every decision; objectives for the task bar.
- **Patterns:** m01's Kevin runs a quiz in ink (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`), the interim for Owain's check question; core_01's "Leo's slip" for the Kev conversation; password props from the campaign (m01's passphrase post-it, erb:1735; m02's sticky note of family names and years, erb:2140; m03's "surname plus the year the firm was founded", erb:1681; see `research/existing_content_reuse.md`) as ideas for the sticky notes, rewritten in this course's tone.

## New features needed

- **MG-07 MFA prompts and authenticator:** the night flood, enrolment, the drill and the Ledger prompt. What this module needs from it is in `game_design.md`.
- **MG-08 Password manager and passphrase builder:** the vault, the word tiles, the guesser, the lookalike fill test, the sign-up form and Kev's setup. What this module needs from it is in `game_design.md`.
- **MG-27 Work desktop:** the player's laptop as the launcher for the vault, the authenticator set-up and The Lark.
- **MG-20 Knowledge check:** Owain's check question and the final spot check.
- **BE-01 Assessed decisions** and **BE-02 Debrief screen:** every row in `assessment.md`.
- **BE-08 Visual aids:** the four ways passwords are stolen, the breach timeline, the sign-in ladder, the guesser.
- **BE-09 Intranet terminal:** the reference card and the password policy page.
- **BE-16 Time skips:** from 02:13 to the next morning, and to "that afternoon" for the debrief.
- **BE-18 Work task and interruptions:** the stock check and the Ledger prompt.
- **BE-19 Open minigames from conversations and events:** MG-07 opening by itself in the night scene (an `open_minigame` action on the cold open's timer); MG-08 from Owain's conversation (`#trigger_minigame:password_manager|lock_it_down`).
- **BE-05 Organisation profile:** the approved password manager, the MFA methods offered, whether passkeys are available, the browser saving policy, the route for unexpected prompts, the 24/7 number.
- **BE-04 Accessibility baseline:** the prompt flood has no time limit and follows the pausable clock; buzzing is shown as captions; reduced motion stops the phone shaking.
- **MG-05 Messaging apps** (P2): a chat-app skin for the fake "IT" message; `phone-chat` works until then.
- **BE-07 Micro-drill launcher** and **BE-13 Content banks** (P2): "Approve or Deny?" as a monthly drill.

## Organisation-specific content

- The approved password manager, how staff get it, and whether browsers may save work passwords.
- The MFA methods offered (passkeys, security keys, an authenticator app with number matching, text codes) and how to enrol or change method.
- How to report an unexpected prompt or code (the app's Report option, the service desk, the security team).
- The 24/7 service desk number.
- The password policy points worth stating (minimum length, blocked common passwords, no forced expiry, or the organisation's current rule if it differs).
- The approved way to handle shared accounts (named accounts, a shared vault).
- Any breach-check or password-health tool the organisation provides.

## Open questions

1. **A cold open at night.** The module starts at 02:13, outside work. *Recommendation: keep it. Night is when prompt floods happen (the Uber case), and it is the scene people will talk about. A daytime variant (the flood arrives during a meeting) stays in the bank for organisations that prefer it.*
2. **Passkeys for staff accounts.** Not every organisation offers them yet. *Recommendation: teach the ladder (passkey, then an app with number matching, then a text code). Where the organisation profile says passkeys aren't offered, Practise sets up the app instead, and the reference card says "use a passkey at home where you can": the NCSC has recommended passkeys first for personal accounts since April 2026.*
3. **Browser password saving.** The NCSC says saving passwords in the browser on your own devices is safe; many employers restrict it for work accounts. *Recommendation: an organisation slot, defaulting to "work accounts in the company manager; your browser's manager is fine for personal accounts on your own devices".*
4. **The hook is a baseline.** Typing the fake "IT" number at 02:13 is common and forgivable. *Recommendation: as in core_01, the hook is never a critical behaviour; the Apply's Ledger prompt is (C03-CB1).*
5. **Overlap with core_00 and core_02.** core_00 previews MG-07 and MG-08; core_02 owns callers asking for codes. *Recommendation: keep core_03 self-contained and keep its "IT" pressure to the one night-time message from the seed; no phone calls asking for codes here. If BE-17 (cross-module memory) exists, Owain can mention that the player already set up the manager in core_00 (never the passphrase itself, which the game doesn't keep).*
