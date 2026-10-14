# role_03: IT administrators and service desk

**Working game title:** Reset Request
**Pitch:** Run the service desk for a Monday morning shift, where a locked-out "chief executive", a contractor in a hurry and a helpful supplier all want the one thing you can give them: access.

| | |
|---|---|
| Audience | Service desk analysts (in-house and outsourced), system, network and cloud administrators, and anyone with privileged access |
| Prerequisites | core_00. core_02 (callers and pretexts) and core_03 (passwords and MFA) recommended |
| Full module | 25 minutes |
| Micro-drill | 4 minutes ("Prove It") |
| Text route | 15 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the caller verification desk (MG-17, shared with role_06) and the alert views built on existing minigames |

## Why this module

A password or MFA reset hands over an identity: the mailbox, the files, the approvals and, for an administrator, the whole estate. Attackers have learned that phoning the service desk is often easier than breaking MFA.

- **Co-op, 2025.** Its Chief Digital Information Officer told MPs that the attackers "were able to impersonate a colleague and successfully answer a number of security questions to get their account reset", about an hour before using the account maliciously (8 July 2025).
- **M&S, 2025.** Its chairman told the same committee that the initial entry, on 17 April, came through "sophisticated impersonation", that the attackers "appeared as an individual, with their details", and that the point of entry "also involved a third party". Reports that this was a password reset through an outsourced service desk were not confirmed by M&S.
- **MGM Resorts, 2023.** MGM confirmed that it shut its systems down, that customers' personal data was taken and that the attack would cost about US$100 million in quarterly earnings (SEC filing, 5 October 2023). It did not say how the attackers got in. It was widely reported, including from the attackers' own claims, that they phoned the IT help desk posing as an employee.
- In May 2025 the NCSC asked organisations to "review helpdesk password reset processes, including how the helpdesk authenticates staff members credentials before resetting passwords, especially those with escalated privileges".

Administrator accounts, remote management tools and app permissions are the next steps in the same chain. The service desk and IT team are where it can be broken.

## Target behaviours

1. **Verifies identity through a route the caller doesn't control** before any password, MFA or access change, however senior, urgent or angry the caller.
2. **Keeps privileged access tight:** separate admin accounts used only for admin work, phishing-resistant MFA, least privilege, access granted only when needed and for a set time, and approved tools only.
3. **Escalates the signals instead of clearing them:** odd sign-ins after a reset, requests to approve apps with broad access, unknown remote tools and requests to switch security off go to the security team straight away, and so do their own slips.

## Learning outcomes

After this module, IT staff can:

- **R03-LO1** Explain why facts a caller knows (date of birth, employee number, manager's name) don't prove identity, and recognise the pressures callers put on service desks (seniority, urgency, travel, anger, sympathy).
- **R03-LO2** Verify a reset or access request with the procedure: a call back on the number on record, a prompt to the person's registered device, confirmation from their manager on a known channel, or an in-person or video check with ID for high-risk accounts; then notify the user and watch the account.
- **R03-LO3** Apply least privilege to access requests: separate admin accounts, approval by the system owner, time-limited or just-in-time access, phishing-resistant MFA for administrators, and no email or web browsing as an administrator.
- **R03-LO4** Recognise and handle risky consent and tooling: requests to approve apps with broad mailbox or file access, unapproved remote management tools, and requests to disable security tools.
- **R03-LO5** Act on the alerts that follow a reset (a sign-in from an unexpected place, a new MFA method, new mail forwarding) by escalating, not dismissing.
- **R03-LO6** Hold the line politely with senior or angry callers, and support colleagues who slip up to report it quickly.

## Compliance coverage

Contributes to (short forms until `02_COMPLIANCE_MAPPING.md` is written):

- **PCI DSS** 12.6.3.1 (awareness of phishing and social engineering); the requirement that user identity is verified before any authentication factor is modified, and MFA for administrative access to the cardholder data environment (requirement 8; **numbering to verify** against v4.0.1).
- **ISO/IEC 27001** Annex A 5.17 (authentication information), 5.18 (access rights), 8.2 (privileged access rights), 8.5 (secure authentication), 8.16 (monitoring activities) and 6.3 (awareness, education and training).
- **NIST SP 800-53** AT-3 (role-based training) and AT-2(3) (social engineering).
- **CIS Controls v8.1** 14.9 (role-specific training), 5.4 (dedicated administrator accounts) and 6.5 (MFA for administrative access).
- **NCSC CAF** B2 (identity and access control) and B6 (staff awareness and training).
- **Cyber Essentials** (requirements v3.3, April 2026): user access control, including separate accounts used only for administrative activities, MFA, and removing privileges no longer needed.
- **NIS2** Article 21(2)(g) (cyber hygiene and training), (i) (access control) and (j) (multi-factor authentication).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 08:02, the first call of the shift: "Gillian Marsh", at an airport gate with a stolen phone, needs her authenticator moved to a new number now. She knows all the answers. The player's handling is the baseline | Game (MG-17, MG-04) | 2 |
| Learn | Owain: "Knowing isn't proving", what a reset hands over, and the verification ladder. Jo Fairweather's minute on where the caller's answers came from | NPC explainer with visual aids (EX-01, BE-08); attacker view (EX-06) | 4 |
| Practise | "Prove It": six callers and tickets; pick the check that fits the risk | Minigame (MG-17 practice mode) | 4 |
| Apply | The rest of the shift: a queue of ordinary tickets with six security tests inside it, a colleague's slip, and the real Gillian | Game (MG-17, BE-18, `log-filter`) | 10 |
| Debrief | The attack chain the player broke, link by link, and Kai's view of the same caller trying three analysts | Debrief screen (BE-02) and NPCs | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The service desk's reset card and the admin rules on The Lark | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_IT` redressed as the service desk (headset desks, the queue board, an "average handling time" screen); `room_security` for Kai; `room_ceo` for the in-person check with the real Gillian; `room_office` for walking to a colleague's desk.
- **Minigames:**
  - `log-filter` (`public/break_escape/js/minigames/log-filter/`): its `vpn` log type already has timestamp, user, IP, country, MFA and result columns, filters, threat and account lookups, and a single flaggable anomaly row, all from scenario data. It suits the "sign-in from somewhere unexpected after a reset" alert. Its synthetic log dates are fixed to 2025-11-03, and its country filter list is fixed.
  - `siem` (`siem/siem-dashboard-minigame.js`): **has a bug that blocks reuse.** `startSiemMinigame` in `systems/minigame-starters.js` passes only `timeLimitSec`, so the minigame never receives `alertConfig` and always shows its built-in hospital alerts. Fix that, and add the inline `alerts` array its own TODO describes, before using it here; until then the module uses `log-filter` alone.
  - `forensic-data-platform`: tabbed evidence with a gated confirm button, for the app consent request (the app, its publisher, the permissions it asks for, who asked).
  - `phone-chat` (team chat with Owain and Kai), `person-chat` (desk conversations, Jo's interlude, the real Gillian), `notes` (the reset procedure, the approved remote tools list, the contractor access policy), `text-file` (a ticket's history).
- **Patterns and props:**
  - sis02's managed SOC refuses an unverified change and rings back on the number it holds (`scenarios/sis02_energy/ink/npc_tom_hadley.ink:136-171`): the model for every call-back in this module.
  - "What not to do" props already in the campaign: m03's helpdesk slip giving a house default password ("Surname plus the year the firm was founded", `scenarios/m03_ghost_in_the_machine/scenario.json.erb:1686`); m05's IT ticket printing a temporary password (`scenarios/m05_insider_trading/scenario.json.erb:771`); sis02's contractor who left 14 months earlier with a working default password (`scenarios/sis02_energy/scenario.json.erb:1546`).
  - `scenarios/test-phone-terminal` for incoming phone threads.
- **Systems:** NPC timed messages and timers for the queue's interruptions; event mappings to bring Owain to the desk; voice FX for phone-quality callers (`README_scenario_design.md`, Voice FX).

## New features needed

- **MG-17 Caller verification desk** (the core, shared with role_06). This module's needs: a queue of calls and tickets; a staff record from the HR directory (role, account type, number on record, manager, registered devices, recent changes); verification actions that call back on the directory number, send a prompt to the registered device, ask the manager on a known channel, or book an in-person or video ID check; "security questions" offered as an action that visibly proves nothing; a second-analyst approval for privileged accounts; outcomes (do it, refuse, park, escalate to security); and an event for every action. One desk with two record types (staff for role_03, customers for role_06), as role_06 recommends.
- **MG-04 Voice calls:** the phone, the directory and hold that MG-17 sits on.
- **BE-18 Work task and interruptions:** the queue counter and the scheduled arrivals.
- **BE-01**, **BE-02**, **BE-08**, **BE-09**, **BE-19**, **BE-20**, **MG-20**, **EX-01**.
- **EX-06 Attacker-view interludes:** Jo's one-minute "where the answers came from" board.
- **BE-07 Micro-drill launcher** and **BE-13 Content banks** for "Prove It".
- **A bug fix before reuse:** pass `alertConfig` (or an inline `alerts` array) through `startSiemMinigame`, if the siem dashboard is wanted.

## Organisation-specific content

- The reset and verification procedure, by account type, and who approves resets for privileged and executive accounts.
- The directory of record for call-back numbers, and the registered-device or self-service options.
- The privileged access tool and the admin account rules.
- The approved remote support tools and the supplier remote access route.
- The app consent policy (who can approve which permissions).
- The security team's contact for escalations, in and out of hours.
- A written statement that time spent verifying never counts against handling-time targets.

## Open questions

1. **Real company names in the "why" section.** *Recommendation: keep Co-op, M&S and MGM in `concepts.md` only, with "confirmed" and "reported" kept apart as above; the game uses Larkspur.*
2. **How hard to make the fake Gillian.** *Recommendation: she knows every security answer and sounds plausible, so only the procedure catches her, never a slip in her story. The debrief says so.*
3. **Outsourced service desks.** Many customers outsource the desk. *Recommendation: let the organisation profile switch the player to "service desk partner" with Larkspur as the client, the same procedure and an extra "client approval" step for privileged accounts.*
4. **Video checks and deepfakes.** *Recommendation: allow video with ID for high-risk resets, always paired with a second check (manager confirmation or a call back), and point to core_15.*
5. **Should the siem dashboard be fixed for this module?** *Recommendation: yes, if role_03 is built after the engine pass; it's a small change and makes a better "alerts you shouldn't ignore" beat.*
