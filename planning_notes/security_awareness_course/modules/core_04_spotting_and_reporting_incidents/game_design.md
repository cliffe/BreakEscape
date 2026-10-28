> **For the build, this design is superseded by `../../implementation/episodes/E08_after_the_click.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_04 game design: The Golden Hour

core_04 is delivered two ways: the **reporting culture built into every episode's debrief** (the report verdict, the team-protected tally, the customer report route, the no-blame line), and one new episode, **E8 *after the click***, which teaches the incident content in the built shape and also carries core_01 LO6. The old plan's live-spread "golden hour" afternoon is retired as a room-walk design; its ideas are carried by E8's flip, defend set and debrief. Where a scenario file and this description differ, the scenario file wins.

## Concept

The incident-reporting outcomes play out as one attack-then-defend episode in a training room, plus the reporting furniture that every other episode already shows. In E8 the learner builds one phish, watches it get clicked, and then becomes the person whose account is being used, triaging the signs that follow: a sent email they did not write, an unrequested reset, locked files, a misdirected document. The lesson is the module's title: most of the damage happens between noticing and reporting, so the right first move for every real sign is the same, report it and leave it. The security team shows, in the debrief, how far each sign had got and what the report let them do.

## Setting and cast

The world is the built one: one training room per company, a kiosk and a host, no doors, no combat, no VM. Larkspur Group is retired as a setting, and the old cast (Ama, Kai, Leo, Martin, Tomasz, Precious, Owain and the rest) does not appear. The host welcomes; the debrief teaches. There is no live-spread afternoon on an office floor, no command board and no walk to a comms room.

| Episode | Topic | Company (room) | Role | Host |
|---|---|---|---|---|
| E8 (new) | After the click: spotting and reporting an incident | Quayholt Insurance | general staff | Anjali Rao, information security analyst (receives reports) |

E8 is the same episode core_01 names for LO6; its company and host match that design. Any colleague who appears in a defend card (a confession about a misdirected email, a chat about locked files) is drawn from the Quayholt cast in `BRAND_SET.md`. All people and companies are fictional; every domain ends `.example`.

## Structure

### The reporting furniture: as built, across every episode

Every episode's debrief already carries the reporting culture (`research/built_episodes_vs_plan.md` §1.2):

- the **report verdict**, always available on every card and never penalised;
- the **team-protected tally** (what the learner's reports protected);
- the **customer's reporting route**, from the `customer_report_route` slot;
- the **no-blame line** ("people who fall for these are not stupid").

That is C04-LO2, LO5 and LO6 in spirit, reinforced in every module. E8 adds the explicit teaching.

### E8 after the click (new, built shape)

- **Brief and scope note.** Anjali Rao welcomes the learner: *"Everyone clicks something eventually. Today is about the ten minutes after, and how one quick report changes the ending."*
- **Attack half (unscored).** The learner plays the authorised red-teamer. In the OSINT browser they find a general-staff target's team and a service they use, then compose one credential phish from a template with blanks filled from those facts, in the mail client with the red-flag meter. One artefact, no working link.
- **Flip.** The message lands and is clicked. The flip puts the learner in the seat of the person whose account is now being used, and shows the first odd sign (a sent-items entry they did not write), which sets up the defend half.
- **Defend half (scored).** Triage the signs that follow, in the inbox-triage defender with its mixed card kinds, Verify on:
  - a sent email the learner did not write (Report);
  - a password-reset confirmation they did not request (Report);
  - a sign-in push from abroad they did not start (Report; reuses the authenticator card);
  - a misdirected document: a colleague's chat admitting they sent the wrong attachment to a client (Report, help them report);
  - files on a shared drive that will not open, and a note (Report; leave it, do not restart or delete);
  - a benign look-alike: an announced IT maintenance notice (Trust, or Verify);
  - an ordinary message that is simply ordinary (Trust).
  The teaching point of the set is that the right first move for every real sign is the same: report it through the route you trust, leave the device as it is, and do not try to fix it yourself.
- **Debrief.** Reasoning cards, then two concept cards unique to E8:
  - **The five questions a report answers:** what, when, where, who, and what you have done (be honest: "I restarted it", "I clicked the link"), so the team does not have to call back.
  - **First steps and recovery:** leave it as it is, keep the evidence, do not switch off unless told, follow the service desk; and for a click, report, change the password on the real site, change it where reused, follow the service desk.
  Then the team-protected tally, the habit to keep, the "On Monday" card, the customer report route and the no-blame line. A colleague who reported their mistake is thanked in front of everyone; one who did not is shown, without blame, how a report would have changed it.

E8 has a defend-only variant (brief, defend, debrief) and feeds items into the general check form.

## Decisions and consequences

The attack half is authored choices, judged by the pretext judge, never scored against other learners. The defend half carries the score through the verdict and the flags (60 and 40). Every item shows its reasoning. No option shames the player: mishandling a sign ends with the debrief showing, calmly, how far it got and what a report would have changed. Reporting a genuine item is never penalised. A colleague's mistake is never the villain's doing; helping them report it is the scored move.

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| A sign of a used account | Report / Trust / Delete | LO1, LO2, LO6 | Reasoning card; the team-protected tally; the recovery card |
| The locked files and note | Report and leave it / retry, restart or delete | LO4 | Reasoning card: leaving it keeps the evidence and does not make it worse |
| A colleague's misdirected document | help them report / say nothing | LO5 | Reasoning card; the thank-you, or the calm "what a report would have changed" |
| The benign look-alike (maintenance notice) | Trust or Verify / Report | LO1 | Reporting it is thanked, with a tip; it is the calibration mirror |
| The report itself | which of the five questions to include | LO3 | The five-questions card in the debrief |

## Minigames

All built and reused:

| System | Use here |
|---|---|
| Episode runner and step strip | The wrapper for E8 |
| OSINT browser and intel facts | E8's attack half |
| Mail client (template mode, red-flag meter) | The composed phish |
| Flip view | The click and the used account |
| Inbox-triage defender | The signs-that-follow set, with email, push and page cards, Verify on |
| Authenticator demo | The unrequested-push card |
| Concept cards | The five-questions card and the first-steps and recovery card |
| Debrief view, awareness-measure records | As across the product |

## Explainers

No mentor NPC and no video. The host welcomes; the debrief teaches, with the two concept cards above. Text to speech provides the host lines. The old plan's EX-05 behind-the-scenes scenes, the spread map and the command board are not part of the built shape.

## Debrief

The built debrief view, with E8's two extra concept cards: reasoning cards; the five-questions card; the first-steps and recovery card; genuine-item feedback; the team-protected tally; the habit to keep (quoted word for word); the "On Monday" card; the customer report route; the no-blame line.

**The habit to keep:**

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

## Variants

- **Defend-only variant:** E8 has one (about 8 minutes): brief, defend, debrief, same defend set.
- **Text route:** not yet built (BE-03), kept as a gap.
- **Facilitated session:** the `facilitated` flag exists; no shipped shell sets it. It would suit a short tabletop reporting exercise.
- **Replay and randomisation:** matched items with disjoint slots across the A and B check forms; the signs and the colleague vary per play.

## Alternative concepts

The built shape is settled. The old plan's "Night Shift" receiving-end mode, the "Golden Hour" tabletop and the "Cold Case" detective board are closed: E8's flip (the click) and its signs-that-follow defend set deliver the mechanic and the reflection. A report-form surface may be added later to let learners practise the five questions as structured input (open question 2).

## Art and audio

- **Rooms:** the Quayholt awareness room, dressed for the company.
- **Host:** Anjali Rao.
- **Props in cards:** a screen of renamed files and a plain note (no skulls, no countdown); a sent-items list; an unrequested reset.
- **Voice:** text to speech for the host lines. No voiced line prints a variable: times, counts and reference numbers are on screen only.
- **No video.**

## Pitfalls

- **Don't restage the old afternoon.** The live-spread office walk is retired; E8 teaches the same lesson in the built attack-then-defend shape.
- **Showing what nobody reported.** The defend set and the debrief reveal an incident's reach only after the learner has acted, not as a live gauge.
- **Turning it into a race.** No countdowns and no rating on seconds; the defend half is read at the learner's pace.
- **Fear without action.** Every sign is paired with the one move: report it and leave it. The debrief shows what the report changed.
- **Blame.** Colleagues are likeable and competent, and are thanked when they report. The no-blame line closes the debrief.
- **Punishing over-reporting.** Reporting the benign look-alike is thanked, with a tip.
- **Straying into core_07.** No ransom amounts, no countdown on the note, no "pay" button; E8 stops at "report it and leave it".
- **No claims of effectiveness.**
