# core_01 game design: Inbox Zero

core_01 is delivered by four built episodes, plus one new episode this plan adds. The built episodes are not redesigned here: they are described as built, and the new work is E8 *after the click*, designed in the built shape. Where a scenario file and this description differ, the scenario file wins.

## Concept

The phishing-email outcomes play out as attack-then-defend episodes in a training room at a client company. The learner taps a kiosk, a host welcomes them, and the episode runner steps through the stages: a brief, an attack half in which they build one message from a template with blanks filled from facts found in the OSINT browser, a flip into the inbox that message lands in, a scored defend half triaging a realistic inbox, and a debrief. The point the learner takes away is the one the attack half produces on its own: a well-made phish is hard to spot, so people who fall for one are not stupid, and the defence is to stop and check through a route you already trust.

E8 adds the piece the plan always wanted and the build lacked: what happens, and what to do, once someone has clicked. It teaches C01-LO6 and core_04 together (`04_BUILT_SO_FAR.md` §4).

## Setting and cast

The world is the built one: one training room per company, a kiosk and a host, no doors, no combat, no VM. There is no recurring mentor and no single workplace. Larkspur Group is retired as a setting; the old course cast (Ama, Kai, Leo, Owain, Lena and the rest) does not appear. The host carries the welcome, and the debrief carries the teaching.

**Built episodes and their companies:**

| Episode | Topic | Company (room) | Role | Host |
|---|---|---|---|---|
| E1 | Invoice and bank-detail fraud, BEC | Brightwell Foods | finance | Adaeze Okafor |
| E2 | CV and recruitment lures | Tarrowby Logistics | HR, recruitment | Fatima Begum |
| E4 | Executive whaling, with voicemails | Merrin & Sallow Architects | executive and PA | Thandiwe Moyo |
| E5 | Fake sign-in pages | Quayholt Insurance | general staff | Niamh Doherty |

**New episode:**

- **E8 *after the click*** is proposed at **Quayholt Insurance** (general staff), host **Anjali Rao**, the information security analyst who receives reports, both already in `BRAND_SET.md`. The company and host are confirmable by the user.

All people and companies are fictional; every domain ends `.example`; look-alikes use learnable shapes (a swapped character, an added hyphen, an added word), never homographs.

## Structure

### The built episodes (E1, E2, E4, E5): as built, not redesigned

Each full episode runs the same stages (`research/built_episodes_vs_plan.md` §1.2):

1. **Brief and scope note.** The host welcomes the learner and states the exercise is authorised, at a fictional company.
2. **Attack half** (unscored, capped at one artefact). Look at two public sources in the OSINT browser, collect typed intel facts, then compose one message in the mail client's template mode, with blanks that take only the facts found. A red-flag meter gives escalating guidance before Send. E5 adds a build stage: a look-alike sign-in page assembled from abstract parts (brand, domain, padlock), which captures nothing.
3. **Flip.** The learner's own message arrives in a defender's inbox with its tells highlighted; a scripted defender line answers the learner's choice.
4. **Defend half** (scored). Triage the inbox under the awareness profile with immediate feedback. E1 (payments inbox, 6 items, Verify on), E2 (recruitment inbox, 6 items, no Verify), E4 (PA inbox, 3 emails and 2 voicemails, Verify on), E5 (5 page items in a mock browser, no Verify).
5. **Debrief.** A reasoning card per item, feedback on the genuine items, the team-protected tally, the habit to keep, the "On Monday" card, the customer's reporting route and a no-blame line.

The scoring is defence only: 60 for the verdict (Trust, Report or Delete; Verify scores as Report where it is on), and 40 for naming the real flags from the closed chip list. Reporting a genuine message is never penalised (`designs/11` §4.1).

### E8 *after the click* (new, built shape)

E8 teaches the first steps once a click has happened, and the signs that an account or device is already compromised. It runs the built five stages.

- **Brief and scope note.** Anjali Rao welcomes the learner to the Quayholt training room: *"Everyone clicks something eventually. Today is about the ten minutes after."*
- **Attack half (unscored).** The learner plays the authorised red-teamer one more time. In the OSINT browser they find a general-staff target's team and a service they use, then compose one credential-phish email from a template with blanks filled from those facts (the same mail client, the same red-flag meter). Nothing is sent outside the game; no link works.
- **Flip.** The message lands, and this time the flip goes one beat further: the defender clicks and signs in. The learner sees the account begin to behave oddly (a sent-items entry they did not write, a new mail rule), which sets up the defend half.
- **Defend half (scored).** The learner is now the person whose account was used, triaging the signs that follow, in the inbox-triage defender with its mixed card kinds:
  - an email in their own sent items they did not write (Report);
  - a password-reset confirmation they did not request (Report);
  - a sign-in push from abroad they did not start (Report; reuses the authenticator card from E3 and E9);
  - a genuine IT maintenance notice, announced on the intranet (Trust, or Verify);
  - a genuine "your parcel is ready" that is simply ordinary (Trust);
  - a "shared document" from a stranger that is the next phish (Report or Delete).
  The teaching point of the set is that the right first move for every real sign is the same: report it through the route you trust, leave the device as it is, and do not try to fix it yourself. Verify is on, so "I would check first" is a scored move.
- **Debrief.** Reasoning cards, then the recovery steps as a card: report, then change the password on the real site, then follow the service desk, then change the same password anywhere it was reused. The team-protected tally, the habit to keep, the "On Monday" card, the customer report route and the no-blame line close it. core_04 owns the full reporting procedure; E8 is the phishing-specific slice of it.

E8 has a defend-only variant (brief, defend, debrief) and feeds new items into the general and, where relevant, finance check forms.

## Decisions and consequences

The attack half is a sequence of authored choices (who to impersonate, which found fact to use, which lever), judged by the pretext judge and never scored against other learners. The defend half is where decisions carry a score, through the verdict and the flags. Every item shows its reasoning, pass or fail. No option shames the player: the worst defend choice still ends with the debrief framing it as "this is how most real incidents start, and this is what reporting would have changed".

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Each defend item (E1, E2, E4, E5, E8) | Trust / Report / Delete / Verify (where on) | LO2, LO3, LO4, LO5 | Immediate feedback, then the reasoning card in the debrief |
| E8 sign of a used account | Report / Trust / Delete | LO5, LO6 | The recovery-steps card; the team-protected tally |
| Naming the flags | the closed chip list | LO1, LO2 | 40 of the item score; missed flags named on the card |

## Minigames

All built and reused (`04_BUILT_SO_FAR.md` §1):

| System | Use here |
|---|---|
| Episode runner and step strip | The wrapper for every episode |
| OSINT browser and intel board | The attack half of E1, E2, E4, E5 and E8 |
| Mail client (template mode, red-flag meter) | Composing the one attack artefact |
| Landing-page builder | E5's look-alike page (a scored model, never a working page) |
| Flip view | The hand-off from attack to defend |
| Inbox-triage defender | Every defend half, with email, voicemail, page and (E8) push cards |
| Authenticator demo | The E8 unrequested-push card (shared with E3 and E9) |
| Debrief view | The reasoning cards, tally, habit, "On Monday" card, report route and no-blame line |
| Concept cards | E2's macros card; an E8 card on the recovery steps |
| Awareness-measure records | Per-item records for the defend halves and the checks |

## Explainers

No mentor NPC and no video. The host welcomes and the debrief teaches. Concept cards do the short explaining (E2's macros card; E8's recovery-steps card). Text to speech provides the voices (E4's and E7's voicemails, E8's host lines). A concept panel can carry the "read the domain from the right-hand end" worked example in E5 and E8.

## Debrief

The built debrief view, in order: a reasoning card per item; detailed feedback on the genuine items (which the learner trusted, checked or flagged); the team-protected tally; the habit to keep, quoted word for word; the "On Monday" card; the customer's reporting route from the slot; the no-blame line. E8 adds the recovery-steps card before the tally.

**The habit to keep** (identical in all shells, enforced by a test):

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

## Variants

- **Defend-only variant:** every episode (E1, E2, E4, E5 and E8) has one, about 8 minutes: brief, defend, debrief, with the same defend set so the measurement is unchanged. It is the opt-out for customers who object to the attack beat, and the micro-drill through the year.
- **Text route:** not yet built. An equivalent text route and a WCAG 2.2 AA statement are kept as a gap (`04_BUILT_SO_FAR.md` §5; BE-03, BE-04, BE-26).
- **Facilitated session:** the episode runner has a `facilitated` flag (prompts, no per-learner score on the shared screen) that no shipped shell sets yet. Facilitator notes are scheduled last.
- **Replay and randomisation:** the defend sets and check forms carry matched items with disjoint phish slots across the A and B forms; look-alike domains and names are invented and varied per set. An annual mixed edition can be built from the existing defend sets (core_17).

## Alternative concepts

The built attack-then-defend shape is settled; alternative framings are closed. The old plan's optional "Phish Tank" attacker-view workshop is delivered by the attack half itself (the OSINT browser, intel facts, the template composer and the red-flag meter), so it is not a separate idea. Jo Fairweather and the sandbox workshop are dropped.

## Art and audio

- **Rooms:** the four awareness rooms, dressed per company; room review cycle 1 is done, cycles 2 to 5 and the four POV conversation backgrounds are not started.
- **Hosts:** Adaeze Okafor (E1), Fatima Begum (E2), Thandiwe Moyo (E4), Niamh Doherty (E5), Anjali Rao (E8). Host art is waiting on PixelLab quota and the user's approval.
- **Voice:** text to speech for the voicemails and host lines. No voiced line prints a variable: counts, the company name and the report route are on screen only.
- **No video.**

## Pitfalls

- **Don't redesign what is built.** E1, E2, E4 and E5 are shipped shells; this plan extends them with E8 and extra items, it does not restage them.
- **Never ask for a real password.** The attack half composes from templates and found facts only; sign-in pages and the landing-page builder capture nothing.
- **Never use a real domain or brand.** Every domain ends `.example`; look-alikes use learnable shapes, never homographs; the lab's brands stay out of the awareness product.
- **Don't teach spelling mistakes as the main clue.** The defend sets are built so the tell is the request and the check, not the typo.
- **Don't punish over-reporting.** Reporting a genuine message is never penalised; the defend set credits Report and Verify.
- **No claims of effectiveness.** The checks report a before-and-after change on matched items for a cohort, and nothing more.
