# role_03: IT administrators and service desk

**Working game title:** Reset Request
**Pitch:** Work the service desk against a locked-out "manager", an MFA flood and a must-have app, where the one thing every caller wants is access, then learn the admin hygiene that keeps a reset from becoming an estate.

| | |
|---|---|
| Audience | Service desk analysts (in-house and outsourced), system, network and cloud administrators, and anyone with privileged access |
| Built foundation | Episode E3 (help-desk reset by phone, then MFA fatigue, with a role swap) and the helpdesk check pair, at Quayholt Insurance |
| Company | Quayholt Insurance (`quayholt.example`); E3 host Darren Price, with Leila Nassar as the phone NPC the attacker reaches |
| Prerequisites | core_00. core_02 (callers and pretexts) and core_03 (passwords and MFA) recommended |
| Full episode | About 13 minutes (E3 runs to about 17, accepted by the user) |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the helpdesk pair) |
| Priority | Phase 3 |
| Build size | M. The service desk half is built (E3's role swap and the helpdesk checks); the role extension (least privilege, consent, post-reset alerts) is one new episode in the built shape plus concept cards |

## Build status

- **Built, this module builds on it:** episode **E3 *Help-desk reset by phone, then MFA fatigue*** (`scenarios/awareness_e3_helpdesk_reset`), Quayholt Insurance, host Darren Price. The learner first plays the attacker: a pretext call to the service desk as a locked-out manager (on the influence bar), then an attacker-side MFA push run that the target approves. Then the **role swap** (`episode-runner/role-swap.js`) puts the learner in the service desk agent's seat (Leila Nassar's): three calls (2 impostor, 1 genuine) and one unrequested push, triaged with Verify on, the claimed facts shown by label so the learner checks the facts they used as the attacker. The **helpdesk check pair** (`awareness_{pre,post}_helpdesk_{ab,ba}`) mixes emails, calls, a voicemail and a push, 4 phish in 10, Verify on in the scenario files.
- **Builds on E3 and the helpdesk checks:** facts prove nothing, the call back on the number on record, not being talked round, and never reading out a code (R03-LO1, LO2, LO6) are taught and measured today.
- **New (role extension this plan adds):** least privilege and separate admin accounts (R03-LO3), risky app consent and remote tooling (R03-LO4), and acting on the alerts that follow a reset (R03-LO5). Delivered as one new episode in the built shape plus concept cards; see `game_design.md`.
- The awareness product is "Incident Simulations: Critical Cases", on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

A password or MFA reset hands over an identity: the mailbox, the files, the approvals and, for an administrator, the whole estate. Attackers have learned that phoning the service desk is often easier than breaking MFA.

- **Co-op, 2025.** Its Chief Digital Information Officer told MPs that the attackers "were able to impersonate a colleague and successfully answer a number of security questions to get their account reset", about an hour before using the account maliciously (8 July 2025).
- **M&S, 2025.** Its chairman told the same committee that the initial entry, on 17 April, came through "sophisticated impersonation", that the attackers "appeared as an individual, with their details", and that the point of entry "also involved a third party". Reports that this was a password reset through an outsourced service desk were not confirmed by M&S.
- **MGM Resorts, 2023.** MGM confirmed that it shut its systems down, that customers' personal data was taken and that the attack would cost about US$100 million in quarterly earnings (SEC filing, 5 October 2023). It did not say how the attackers got in. It was widely reported, including from the attackers' own claims, that they phoned the IT help desk posing as an employee.
- In May 2025 the NCSC asked organisations to "review helpdesk password reset processes, including how the helpdesk authenticates staff members credentials before resetting passwords, especially those with escalated privileges".

Administrator accounts, remote management tools and app permissions are the next steps in the same chain. The service desk and IT team are where it can be broken.

## Target behaviours

1. **Verifies identity through a route the caller doesn't control** before any password, MFA or access change, however senior, urgent or angry the caller. **Built: E3 and the helpdesk checks.**
2. **Keeps privileged access tight:** separate admin accounts used only for admin work, phishing-resistant MFA, least privilege, access granted only when needed and for a set time, and approved tools only. **New.**
3. **Escalates the signals instead of clearing them:** odd sign-ins after a reset, requests to approve apps with broad access, unknown remote tools and requests to switch security off go to the security team straight away, and so do their own slips. **New.**

## Learning outcomes

After this module, IT staff can:

- **R03-LO1** Explain why facts a caller knows (date of birth, employee number, manager's name) don't prove identity, and recognise the pressures callers put on service desks (seniority, urgency, travel, anger, sympathy). **Built: E3.**
- **R03-LO2** Verify a reset or access request with the procedure: a call back on the number on record, a prompt to the person's registered device, confirmation from their manager on a known channel, or an in-person or video check with ID for high-risk accounts; then notify the user and watch the account. **Built: E3.**
- **R03-LO3** Apply least privilege to access requests: separate admin accounts, approval by the system owner, time-limited or just-in-time access, phishing-resistant MFA for administrators, and no email or web browsing as an administrator. **New.**
- **R03-LO4** Recognise and handle risky consent and tooling: requests to approve apps with broad mailbox or file access, unapproved remote management tools, and requests to disable security tools. **New.**
- **R03-LO5** Act on the alerts that follow a reset (a sign-in from an unexpected place, a new MFA method, new mail forwarding) by escalating, not dismissing. **New.**
- **R03-LO6** Hold the line politely with senior or angry callers, and support colleagues who slip up to report it quickly. **Built: E3.**

## Compliance coverage

Training requirements this module contributes to (short names from `02_COMPLIANCE_MAPPING.md`):

- **NIST AT-3** (role-based training) and **NIST AT-2(3)** (social engineering, here aimed at the service desk).
- **CIS 14.9** (role-specific training, including for system administrators).
- **ISO 27001 cl. 7.2** (competence for roles with security duties) and **ISO 27001 A.6.3**.
- **NCSC CAF B6.b** (training defined for every role); **DSPT 3.3.1** for NHS customers.
- **PCI DSS 12.6.3.1** (social engineering, alongside core_01 and core_02) and **PCI DSS 12.10.4**, in part: the service desk's first steps in an incident.
- **NIS2 IR 8.2** (training for roles that need security skills) and **NIS2 IR 10.1** (privileged users understand their roles), where the Implementing Regulation applies.
- **DORA Art 13(6)** (training at a level that fits the role), for EU financial entities.
- **UK GDPR Art 32** (security of processing, including staff who control access to personal data).
- US customers: **NYDFS 500.10(a)(2)**, **FTC 314.4(e)(3)**, **CMMC AT.L2-3.2.2** and **SOC 2 CC1.4**.

**What it doesn't meet on its own.** The module is awareness level. It doesn't replace training for incident response staff (PCI DSS 12.10.4) or the technical skills of system administration. Point those staff to Hacktivity's technical labs: the HacktivityLabSheets labs on log management and SIEM, backups and recovery, and authentication, access controls and directory services, and the incident response practice in the Security-Informed Safety games (`scenarios/sis01_healthcare`).

The content also follows ISO 27001 A.5.17, A.5.18, A.8.2, A.8.5 and A.8.16, NCSC CAF B2, NIS2 Art 21(2)(i) and (j), and PCI DSS requirement 8 (changes to any authentication factor authorised before the change, 8.2.4; MFA for administrative, non-console access to the cardholder data environment, 8.4.1). Its admin rules match the user access control requirements of Cyber Essentials v3.3, which is a technical scheme with no training requirement and is not claimed here.

## Module flow

The built E3, played in the episode shape (the attack half and the role swap are both in the runner):

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | Darren Price welcomes the learner to an authorised exercise at Quayholt's service desk | no | under 1 |
| Attack half | A pretext call to the service desk as a locked-out manager (on the influence bar), then an attacker-side MFA push run the target approves | no | about 5 |
| Flip | The learner's own pretext call and push run shown from the desk's side, tells named | no | 1 |
| Defend half (role swap) | The learner is the service desk agent: 3 calls (2 impostor, 1 genuine) and 1 unrequested push, Verify on, mirror pairs; the claimed facts shown by label | yes | about 7 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card, the reporting route, no blame | no | about 2 |

The new **least privilege and consent** episode runs the same stages. The helpdesk pre and post checks bracket the episodes, sequenced by the organiser.

## Reuse from existing Break Escape content

- **Episode runner** and the **role-swap module** (`episode-runner/role-swap.js`) for E3; the `facilitated` flag (BE-15) for a team session.
- **OSINT browser** and **intel facts** for the research stage; **pretext prep and the pretext judge** (`minigames/pretext-prep/`, `systems/pretext-judge.js`) and the **influence bar** for the pretext call; the **mock authenticator** (`minigames/authenticator/`) for the attacker-side MFA push run.
- **Inbox triage** with the `call`, `push` and `voicemail` kinds and the Verify verdict for the defend set; **mirror pairs** (aw5) in the defend set and the helpdesk checks.
- **Flip view**, **debrief view**, **concept cards**, **awareness measurement** and the comparison panel.
- **Rooms:** `room_aw_quayholt` for E3 and the new episode.

## New features needed

- **A new least-privilege and consent episode** in the runner at Quayholt: the attack half composes an app-consent lure or an admin-access request from found facts; the defend set triages a must-have app with broad mailbox access (against a genuine approved tool), an unapproved remote support tool (against a genuine supplier session through the gateway), a post-reset sign-in alert from an unexpected place (against a genuine travelling user), and a request to switch security off (against a genuine tuning change), all as mirror pairs. Concept cards carry the admin hygiene (separate admin accounts, phishing-resistant MFA, just-in-time access). No new minigame.
- **Concept cards:** what a reset is worth; the verification ladder; least privilege; app consent as an access request; the alerts that follow a reset.
- **BE-05 Organisation profile** (partly built): the reset procedure names, the directory of record, the admin account rules and the escalation contact in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays.
- Not pursued (would redesign beyond the build): the MG-17 caller verification desk as a standalone queue, the `log-filter`/`siem` alert views and `forensic-data-platform` consent inspector. The post-reset alert is a defend item and a concept card, not a scored log view. The fuller "Monday queue" is a later idea in the `features/minigames.md` catalogue (build status "not built").

## Organisation-specific content

- The reset and verification procedure, by account type, and who approves resets for privileged and executive accounts.
- The directory of record for call-back numbers, and the registered-device or self-service options.
- The privileged access tool and the admin account rules.
- The approved remote support tools and the supplier remote access route.
- The app consent policy (who can approve which permissions).
- The security team's contact for escalations, in and out of hours.
- A written statement that time spent verifying never counts against handling-time targets.
- The reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **Real companies.** *Recommendation: name Co-op, M&S and MGM only in this README and `concepts.md`, always keeping "confirmed" and "reported" apart; the game uses Quayholt and fictional callers.*
2. **How hard to make the fake caller.** *Recommendation: the impostor knows every security answer and sounds plausible, so only the procedure catches them, never a slip in the story. The debrief says so. (E3 already builds this: the claimed facts are shown by label.)*
3. **Outsourced service desks.** *Recommendation: let the organisation profile frame Quayholt as the client of a service desk partner, with the same procedure and an extra "client approval" step for privileged accounts.*
4. **Video checks and deepfakes.** *Recommendation: allow video with ID for high-risk resets, always paired with a second check, and point to core_15.*
