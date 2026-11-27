# role_01 game design: Crisis Room

## Concept

This module is two built things plus one new episode, all in the "Incident Simulations: Critical Cases" frame: a training room with a kiosk and a host, no doors, no combat, no VMs.

- **Built foundation.** Episode E4 *Executive whaling* already teaches leaders the one behaviour they fall for most: an urgent instruction that borrows a leader's name and authority. The learner takes the PA's seat at Merrin & Sallow Architects, researches the partners' public diaries, composes one "about to board, pay this" email in the managing partner's name, sees it flipped into the PA's inbox with its tells named, then defends the inbox (3 emails and 2 voicemails, 3 phish, Verify on). The executive pre and post checks measure the same skill. This is built. Do not redesign it.
- **New role extension.** A facilitated **board crisis** episode, in the same built shape, at the proposed Harbreck Facilities Group. It covers the decisions only a board can make (contain at a cost, meet the clocks, handle a ransom demand properly, restore safely), which E4 does not touch. It is built from the episode runner with the `facilitated` flag set, so a board can play together on one screen with a pause panel between each stage.

The hook a board member talks about afterwards is the same one E4 and E7 use: the voice note in the chief executive's voice that asks for a quiet payment, caught not by listening for glitches but by checking another way. In the board crisis that message is the learner's own attack, flipped, and then one item among the crisis-time inbox they defend.

The old Larkspur Group crisis, its MG-24 crisis decision board, its decision-log minigame and its time skips are retired: they would redesign beyond what the build has. The governance content survives as facilitated pause panels and debrief cards. The larger "crisis board" idea is kept in the `features/minigames.md` catalogue (build status "not built"), not built here.

## Setting and cast

- **Built: Merrin & Sallow Architects** (`merrinsallow.example`), room `room_aw_merrin_sallow`, host **Thandiwe Moyo**. The E4 cast is already set: **Catherine Merrin** (managing partner, impersonated), **Tomás Carvalho** (the PA, the learner's seat), **Yasmin Chaudhry** (finance controller, the person the PA should ring). The executive check forms carry **Larkspur Travel** as a supplier (genuine and look-alike); that name stays.
- **New: Harbreck Facilities Group** (`harbreck.example`, **proposed for `BRAND_SET.md`**): a facilities management firm in the North of England, about 600 staff, board-governed, with public-sector lifeline services (hospital and care-home cleaning rotas, school deliveries, payroll). The board crisis episode's room is a new or redressed training room for Harbreck. Cast for this one episode (diverse by age and background, each needing the pre-ship web-search and surname-clash check before release):
  - **Ama Owusu**, Information Security Manager and the episode host: calm, honest about what she doesn't know yet. (Remapped from the retired Larkspur mentor; she is a Harbreck staff member here, not a recurring course mentor. The build has no recurring mentor.)
  - **Anne-Marie Lambert**, board chair: formal, fair, writes everything down.
  - **Gillian Marsh**, chief executive: decisive, impatient with process; the leader whose name and voice are borrowed.
  - **Hassan Qureshi**, finance manager: receives the fake voice note and brings it straight in.
  - **Faisal Karim**, non-executive director with a cyber background: appears in the facilitated pause panels to translate between the board and the technical team.
- The attackers are never seen or heard. Their demand is a printed screenshot; their fake instruction is the learner's own flipped attack and a crisis-time inbox item.

## Structure

The board crisis episode follows the built stages. Crisis time is shown as a timestamp on each stage, not simulated with a live clock.

### Built foundation: episode E4 and the executive checks

Already built; summarised so this module reads whole. Brief and scope note (an openly authorised exercise); attack half (OSINT on the partners' travel, then one whaling email, unscored, with the red-flag meter); flip (the email in the PA's inbox, tells named); defend half (the PA inbox, 3 emails and 2 voicemails, 3 phish, Verify on, mirror pairs, scored); debrief (per-item cards, genuine-item feedback, the team tally, the habit, an "On Monday" card, the reporting route, no blame). The executive AB and BA checks bracket it. This evidences R01-LO6.

### New episode: the board crisis (facilitated, in the built shape)

**Brief and scope note.** Ama welcomes the board to an openly authorised exercise at Harbreck. Overnight, ransomware is spreading on the file servers; the chief executive is travelling; the depots send cleaning teams to hospital and care-home sites in the morning. The learner (or the board, in a facilitated session) is a board member on call.

**Attack half (unscored, red-flag meter).** OSINT on Harbreck's public pages and the chief executive's public diary and travel, granting the same kind of typed facts E4 uses. Then compose one message in the chief executive's name, from templates whose blanks take only found facts: *"The board has agreed to settle quietly. The adviser needs the first payment tonight. Keep it off email."* This is the whaling pretext placed inside a crisis, where everyone expects unusual instructions. Nothing real is sent; it reaches the fictional finance manager.

**Flip.** The learner's own message lands in Hassan's inbox with its tells named by their canonical sentences: borrowed authority, urgency, secrecy, a request to skip the process.

**Defend half (scored, Verify on, mirror pairs).** A crisis-time inbox of messages that arrive during the incident, to triage with Trust, Report, Delete or Verify:
- the fake "chief executive" voice note (`voicemail` kind), the message the learner just built, paired against a genuine crisis-group voicemail from the chair;
- a push "approve this sign-in" during the outage (`push` kind), paired against a genuine MFA prompt the learner started;
- a fake "insurer: confirm your bank details to release funds" email with a look-alike link, paired against the genuine breach coach's email that asks the learner to call a number already held;
- a fake "IT: reset your password here while systems are down" page, paired against the genuine status page.
Mirror pairs (aw5) mean each phish has a close genuine twin, so the learner practises the difference, not a surface cue. Reporting is never penalised.

**Debrief cards.** Per-item reasoning cards; detailed feedback on the genuine items; the team-protected tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for leaders: *"Decide on advice. Write down why. Tell people what you know."* Then the reporting-route box and the no-blame line.

**Facilitated flag (`facilitated: true`, BE-15).** When set, a pause panel appears between stages so the board discusses the decisions E4 and the triage do not score. These are prompts and concept cards, not scored minigames:
1. After the brief: *"Who here can switch our network off at 2am without asking anyone? Should they be able to?"* Concept card: contain at a cost, on the technical lead's advice, and own the business impact.
2. After the attack half: *"What could someone find about our chief executive in ten minutes, and how would a crisis make a fake instruction land?"*
3. After the flip: *"How would our finance team check an instruction from one of us?"* Concept card: the ICO's 72-hour clock, the insurer line, client contract clocks, the police and the NCSC, all running from awareness.
4. After the defend half: *"What is our ransom stance, and who must be in the room before any exception?"* Concept card: no guaranteed key, no safe deletion, no reduction of duties, possible unlawfulness, and the value of a stance agreed in advance.
5. Before the debrief: *"Restore clean, not just fast. What are our lifeline services, and how long could each run on paper?"*

The facilitated debrief hides any per-learner score on the shared screen and adds a grid mapping the discussion to the Code's five principles (A risk, B strategy, C people, D incident, E assurance).

## Decisions and consequences

In the defend half, every scored item pairs a threat with a doable action and never shames the player:

| Item (mirror pair) | Phish option caught by | Learning outcome |
|---|---|---|
| Fake chief executive voice note vs genuine chair voicemail | Calling the chief executive on a number already held | LO6 |
| Fake sign-in push vs a push the learner started | Denying and reporting a push you did not start | LO6 |
| Fake "insurer, confirm bank details" vs the genuine breach coach asking you to call | Verifying through a number already held, not the email's link | LO5, LO6 |
| Fake "IT reset" page vs the genuine status page | Reading the address, not the look | LO6 |

The facilitated pause panels carry the board decisions (contain, clocks, ransom process, restoration) as discussion, evidenced in the group record rather than scored per learner. The debrief frames each as "this is how boards get caught out; this is what the plan, the checks and the clocks are for".

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of both the built E4 episode and the new board crisis; `variant: "full"` or `"defendOnly"`, `facilitated: true` for the board session |
| OSINT browser (`minigames/osint-browser/`) and intel facts (`systems/social-intel.js`) | The research stage: the chief executive's public diary and travel |
| Mail client in template mode (`minigames/mail-client/`) with the red-flag meter and `systems/phish-rules.js` | Compose the one whaling message from blanks filled by found facts |
| Flip view (`episode-runner/flip-view.js`) | The learner's own message seen from Hassan's inbox, tells named |
| Inbox triage (`minigames/inbox-triage/`) with `voicemail`, `push` and `page` kinds and the Verify verdict | The crisis-time defend set, with mirror pairs |
| Debrief view (`episode-runner/debrief-view.js`) | Per-item cards, the habit, the On Monday card, the reporting route, the no-blame line |
| Concept cards (`osint-browser/concept-card.js`) and the voice panel | "Voices can be faked"; the governance cards in the pause panels |
| Awareness measurement (`systems/awareness-measure.js`) and the comparison panel | The executive pre and post checks |

No new minigame is built. The MG-24 crisis decision board, a scored decision log and BE-16 time skips are not pursued; they are a larger later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

The build's explainers are concept cards, the voice panel, the immediate per-item feedback and the debrief, not a mentor or video (R9). For this module:

| Concept card | Shown where | Covers |
|---|---|---|
| Voices can be faked | The voice panel in the defend half | LO6; check another way |
| Whose call is it? | Pause panel 1 | LO1; leaders decide, the technical team does |
| The clocks | Pause panel 3 | LO4; from awareness, not from certainty |
| If they ask for money | Pause panel 4 | LO5; the four facts |
| Restore clean, not fast | Pause panel 5 | LO3 |
| Optional: who's behind it | Available in the OSINT browser | NIST AT-2(5) at awareness level: most want a quick payday, a few want quiet lasting access, the same basics stop both |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view, with the facilitated additions when the flag is set:

1. A per-item reasoning card for each defend item.
2. Detailed feedback on the genuine items.
3. The team-protected tally.
4. **The habit to keep** (quoted above), the shared rule of thumb in every debrief.
5. The "On Monday" card: *"Decide on advice. Write down why. Tell people what you know."*
6. The reporting-route box (`slot:customer_report_route`) and the no-blame line.
7. Facilitated only: the Code grid (A to E) and the group's action list.

## Variants

- **Defend-only variant:** the board crisis as brief, defend, debrief (about 8 minutes), same defend set, for boards that object to the "write a phish" beat. The no-blame line moves into the debrief's `defendOnly` string.
- **Facilitated session (the group mode):** the `facilitated` flag on the full episode, played on one screen with the pause panels above. A reverse-seniority rule in the facilitator guide (the built product will have one course guide, so per-episode notes would be an extension) asks the most junior person to answer first at each pause. The own-plan version loads the organisation's incident plan headings, crisis roles, contacts, ransom stance, insurer and clocks into the debrief cards (BE-05), so the session is the board's annual exercise of its own plan (Cyber Governance Code D2); run with Harbreck's plan it is training only. Facilitator notes and lab sheets are written last, after the product ships (build decision R).
- **Text route:** each stage as text with the same options, the same records; a gap in the build (BE-03).
- **Spaced practice:** the defend-only shell as a quarterly five-minute drill; the executive checks repeated each year.
- **Replay:** the entry route and which data was taken can vary; the annual edition updates the law cards.

## Alternative concepts

1. **The Board Pack.** A quarterly board meeting rather than a crisis, built as a consequence-flip episode (R3): the board reads the cyber report, misses five buried risks in a safe sandbox, and the flip shows where each led. Strong on Code principles A and E; no live attacker needed.
2. **Ransom Room.** A defend-only board away-day: one crisis-time inbox, a facilitated discussion of the ransom demand, three futures shown as debrief cards. Narrower, fits a short slot.
3. **Red Team Briefing.** An authorised-test findings briefing as concept cards: the three routes an attacker would use, and a fixed budget to decide what to fix this year. Teaches risk appetite through trade-offs; light on incident decisions.

## Art and audio

- **Rooms:** the built `room_aw_merrin_sallow` for E4; a new or redressed Harbreck training room for the board crisis (a new room needs its own review and POV background; the four built rooms already have theirs).
- **Characters:** E4's Thandiwe Moyo, Catherine Merrin, Tomás Carvalho and Yasmin Chaudhry use their awareness art. Harbreck's Ama Owusu, Anne-Marie Lambert, Gillian Marsh, Hassan Qureshi and Faisal Karim need art and voices; host art follows the PixelLab reset (3 Nov), with all 19 concepts approved (`HANDOVER.md`).
- **Voice:** text-to-speech only (no runtime language model). The fake voice note uses Gillian's voice with a flatter style; the debrief stresses that detection wasn't the defence, checking was. No voiced line prints a variable: times, counts, money and titles are on-screen text only, so the voice cache stays keyed on exact text.
- **Music:** low and unhurried, no countdown sirens.

## Pitfalls

- **Don't lecture senior people.** Concept cards are short and skippable; the scored work is the triage.
- **Don't moralise about paying.** Discuss the process in the pause panel; the module shows paying's limits, not a sermon.
- **Don't drift into technical detail.** No malware names, attack steps or tools.
- **No fear without action.** Every alarming item is paired with a doable choice, and reporting is never penalised.
- **Don't teach deepfake detection.** The voice note is caught by calling back, not by listening for glitches (core_15).
- **Don't let the most senior voice decide everything in a group.** Use the reverse-seniority rule.
- **Keep it current.** The ransomware proposals and the Cyber Security and Resilience Bill may change; the cards that mention them carry a "checked on" date.
- **Fictional names only in the game.** Harbreck, Merrin & Sallow and their casts are invented; real organisations appear only in `concepts.md` and the facilitator notes.
