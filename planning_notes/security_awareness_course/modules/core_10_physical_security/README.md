# core_10: Physical security

**Working game title:** Tailgate
**Pitch:** Spend a morning shadowing an ethical tester as she walks into your building, then spend the next day stopping her, one polite challenge and one locked screen at a time.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast and badges) |
| Full module | 15 minutes |
| Micro-drill | 4 minutes ("Clear the Floor") |
| Text route | 11 minutes |
| Priority | Phase 2 |
| Build size | M, reusing the campaign's RFID and lockpicking minigames and the door, badge and patrol systems |

## Why this module

Most money spent on security goes on keeping attackers out of systems, but a stranger who walks in through a propped fire door can reach the same information with a lanyard and a confident smile. Physical social engineering is cheap, it works, and it is tested every day by real criminals and by the authorised testers organisations hire to find the gaps first. The behaviours that stop it are small and social: challenge someone you do not recognise, do not hold a secure door for a stranger, wear your badge inside and hide it outside, lock your screen, clear your desk, and do not prop the fire door. None of this is confrontational when it is done the friendly way, and the module teaches the friendly way.

Two kinds of case show why it matters. Authorised physical penetration tests routinely get inside buildings by tailgating and talking past reception; the lesson every tester repeats is that one polite "can I help you find someone?" would have ended the visit. And lost or exposed material causes real harm: in June 2021 classified Ministry of Defence papers were found at a bus stop in Kent, a reminder that a clear desk and careful handling are part of security too.

## Target behaviours

1. **Challenges or reports people they do not recognise** in the office and in secure areas, politely, and does not hold secure doors for people they do not know.
2. **Looks after their badge:** wears it inside, keeps it out of sight outside, never lends it, and reports a lost badge at once.
3. **Locks the screen and clears the desk** of confidential material, and does not prop fire or secure doors.

## Learning outcomes

After this module, staff can:

- **C10-LO1** Recognise tailgating and challenge or report an unknown person without confrontation, using a simple, friendly line.
- **C10-LO2** Follow the visitor rule: sign in, badge, escort, and verify a contractor or inspector against the day's expected visitors before granting access.
- **C10-LO3** Handle their badge correctly (wear inside, hide outside, never lend, report loss at once) and understand why a badge can be copied if left lying around.
- **C10-LO4** Keep a clear desk and a locked screen, and keep whiteboards and printouts from exposing confidential information.
- **C10-LO5** Keep fire and secure doors from being propped, and know the proper way to hold a door open.
- **C10-LO6** Report a physical security concern through the organisation's route, including their own slip, without blame.

## Compliance coverage

Contributes to:

- **ISO/IEC 27001** Annex A 7.1 to 7.4 (physical perimeters, entry, securing offices and rooms, physical monitoring), A 7.6 (working in secure areas), A 7.7 (clear desk and clear screen), A 6.3 (awareness), clause 7.3.
- **NIST SP 800-53 Rev 5** AT-2(3) (social engineering, which names tailgating); AT-3(2) (physical security role-based training; "contributes to" for general staff).
- **CIS Controls v8.1** 14.2 (recognise social engineering, including tailgating) and 14.4 (clear desk and clear screen, locking screens, wiping whiteboards).
- **PCI DSS v4.0.1** 9.x (physical access to areas with cardholder data) and 9.5.1.3 (staff at card terminals spot tampering and substitution), for customers who take card payments on site.
- **NIS2** Article 21(2)(g); **NCSC CAF** B6 (awareness) and B2 (identity and access, where badges gate secure areas).

## Build status

**Company and host:** Merrin & Sallow Architects (`BRAND_SET.md`), a London practice with a reception, a studio and visiting clients and contractors. Host: a Merrin & Sallow facilities or front-of-house staff member. There is no recurring course mentor.

**None built** (`research/built_episodes_vs_plan.md` §2: core_10 None; E6's printed QR code is a phishing channel, not building security). This module is delivered as **E12** (new): the visitor and the tailgater, covering core_10 with **person-chat in the training room**.

- **New (whole episode):** E12, with a defend-only variant and new check items, at Merrin & Sallow.
- **Builds on built systems:** person-chat (for the face-to-face challenges), the awareness-measure records, the concept cards and the debrief view; the attacker-view "Red Team Day" interlude reuses the campaign's RFID and lockpicking minigames and is optional depth.
- **Checks:** a **physical-security** check role is proposed as **New**, with mirror pairs (`assessment.md`).

## Module flow

Recast in the built episode shape. Pre and post checks bracket the episode; only the defend half and the checks are scored. The attacker view (Red Team Day) is the attack-first half; the day of challenges is the defend half.

| Stage | What happens | Format | Scored |
|---|---|---|---|
| Pre-check | The role check: one 10-item spot-the-item form, no pass mark | Check mission | Measured, not scored |
| Brief and scope | "Authorised exercise at Merrin & Sallow Architects (fictional)." The host welcomes the learner | Episode runner | No |
| Attack half | Red Team Day: shadow the authorised tester as she tailgates, reads a badge left on a table and opens a simple cabinet, each step ending with what would have stopped her | Attacker-view interlude (reuses RFID and lockpicking) | No |
| Flip | "What would have stopped me": the tester's list of ways in, now the learner's checklist for the next day | Flip / checklist view | No |
| Defend half | Work the building: challenge a tailgater, verify a contractor, deal with a lost-badge request, lock screens, clear the desk, unprop a door, using person-chat for the face-to-face moments | Person-chat and decision triage | Scored |
| Debrief | Per-item reasoning cards, the "what would have stopped me" list ticked off, the shared habit to keep, the "On Monday" card, the reporting route, the no-blame line | Debrief view | Debrief |
| Post-check | The other form; shows the change from the pre-check | Check mission | Measured |

## Reuse from existing Break Escape content

- **Rooms:** `room_reception` (badge gate and visitor desk), `room_servers` (the comms room the "inspector" wants), `room_office` (desks, screens, printer), `room_break` (the canteen, where a badge is left on a table and Jo picks it up). The car park and smoking shelter are a small new exterior area, shared with core_02's side door and core_13's dropped USB stick.
- **Minigames:** `rfid` (reading a badge left unattended, in clone mode, kept easy and fun, as in `scenarios/m03_ghost_in_the_machine`); `lockpicking` (a simple cabinet, difficulty `easy` = 3 pins); `pin` (a shoulder-surfed door code). See `scenarios/RFID_SCENARIO_PATTERNS.md`.
- **Systems:** the door and keycard systems; NPC `patrol` (a roaming visitor or tester); `los.challengeOnSight` (a guard or the player's colleague reacting when someone unknown enters a secure area), with `skipIfGlobal` for a visitor who has signed in; `lockpick-catch` (an NPC noticing a lock being picked). Event-triggered conversations and barks.
- **Patterns:** m03's visitor badge, "keep it on show" line and RFID cloning; m02's "Do not prop doors" notice issued during an incident; m07's badge station left logged in and unescorted contractor; m08's "ID to be carried and displayed" policy board. These are spy-thriller scenes; reuse the props and ideas, not the tone.

## New features needed

- **BE-11 Role switch**: become or shadow Jo for the Red Team Day interlude, with her kit and objectives, then switch back to the player.
- **EX-06 Attacker-view interlude**: the Red Team Day walk, kept at "this is how little I need", never a how-to.
- **BE-10 Spot-the-risk mode**: the "spot the way in" drill and the final clear-desk sweep; mark risks in a scene, with a found-and-missed summary.
- **MG-25 Document inspector**: compare the "inspector's" work order and ID with the day's expected-visitors list and the service contract, and mark what does not match.
- **BE-18 Work task and interruptions**: the reception cover and floor walk, with the challenges arriving inside it.
- **BE-16 Time skips**: a short "here is what she would have reached" scene when a challenge is missed.
- **BE-01 Assessed decisions**, **BE-02 Debrief**, **MG-20 Knowledge check**, **BE-09 Intranet terminal**, **BE-05 Organisation profile** (badge rules, reporting route, visitor policy, secure areas), **BE-19 Open minigames from conversations and events**.

## Organisation-specific content

- The badge rule (wear inside, hide outside, never lend, report loss at once) and where to report a lost badge.
- The visitor policy (sign in, badge, escort) and who may enter secure areas.
- The clear-desk and clear-screen policy and the screen-lock shortcut.
- How to report a physical security concern, and the facilities or building security contact.
- Whether staff take card payments on site (adds the terminal-tampering beat, PCI DSS 9.5.1.3).
- Fire door and hold-open arrangements (names the alarm-linked release devices, if any).

## Open questions

1. **How much attacker view.** Red Team Day uses the RFID and lockpicking minigames; how long should it run? *Recommendation: three short, light steps (tailgate, badge read, simple cabinet), each under a minute, each ending with Jo's "what would have stopped me". Keep it fun, not a heist.*
2. **New exterior art.** The car park and smoking shelter are new. Build now or reuse an interior door? *Recommendation: a small exterior tile set shared across core_02, core_10 and core_13 earns its keep; until then, stage the side door as an interior lobby door.*
3. **Challenge realism.** Some staff fear being rude. How hard should an unchallenged stranger push? *Recommendation: keep challenges friendly and low-stakes, reward the polite line, and never punish a player for checking; the model line is "Hi, can I help you find someone? I'll walk you to reception."*
