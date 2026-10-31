# role_05 game design: Joiners, Movers, Leavers

## Concept

This module is the built episode E2 plus two new episodes, in the "Incident Simulations: Critical Cases" frame: a training room at Tarrowby Logistics with a kiosk and a host, no doors, no combat, no VMs.

- **Built foundation.** E2 teaches recruiters the lures aimed at them: a job application whose CV or document carries malware or "enable content", or whose portfolio link leads somewhere nasty. The learner plays the applicant, then defends the recruitment inbox.
- **New role extension.**
  - A **recruitment fraud** episode in the built shape: a candidate who is not who they say they are, caught by the standard checks, never by a hunch.
  - A **consequence-flip** episode (R3) for access that outlives the job: no live attacker, so the learner makes the everyday mistake (copy a leaver's access, leave a mover's access open) in a safe sandbox and the flip shows where it led.
  - **Concept cards** for least access, the access lifecycle, HR data on a need-to-know basis and the Thank, Act, Support, Learn response when someone owns up.

The lessons a manager takes away: a video call isn't an identity check; the candidate who won't show an original passport and asks to be paid into someone else's account; the access list full of ghosts; and that how a manager reacts to a confession decides whether the team tells them anything next time.

The old Larkspur "week", its MG-18 access review desk, the MG-25 document inspector and the live team pulse board are retired: they would redesign well beyond the build. The twelve-row access review and the pulse board are kept in the `features/minigames.md` catalogue (build status "not built").

## Setting and cast

- **Company:** Tarrowby Logistics (`tarrowby.example`), a regional haulier and warehousing firm in West Yorkshire, room `room_aw_tarrowby`. Host: **Fatima Begum**, recruitment lead (E2 inbox owner).
- **Built Tarrowby cast** (in `BRAND_SET.md`): **Colin Mather** (warehouse manager, the hiring manager whose vacancy is public), **Jun Watanabe** (HR assistant), **Roseanne Wadsworth** (agency recruiter at Kettlewick Talent, the genuine agency), **Nilesh Solanki** (IT service desk analyst). E2's attack persona is **Alex Rendell**, the job applicant on the exercise account.
- The old Larkspur cast (Mei Lin Zhou, Ama Owusu, Owain Jenkins, Leo Brennan, Marta Ferreira, Des Harker, Farida Haidari) is retired as a recurring workplace. The new episodes use the Tarrowby cast: Fatima and Jun for HR, Nilesh for IT and security escalations, Colin as a hiring manager. Where the consequence-flip episode needs a mover, a leaver or a colleague who owns up, it uses Tarrowby staff; any additional name needs the pre-ship web-search and surname-clash check. There is no recurring course mentor; the host carries the welcome and the debrief carries the teaching.

## Structure

### Built foundation: E2 and the hr checks

Already built; summarised so this module reads whole. Brief and scope note (an authorised exercise at Tarrowby's recruitment inbox); attack half (OSINT on Colin's public vacancy, then one application with an attachment chosen from labels, unscored, red-flag meter); flip (the application in the recruiter's inbox, tells named); defend half (the recruitment inbox, 6 emails, 2 phish, 4 genuine, no Verify, a short macro concept panel, mirror pairs); debrief (per-item cards, genuine-item feedback, the team tally, the habit, an "On Monday" card, the reporting route, no blame). The hr AB and BA checks bracket it. This evidences R05-LO4 in part. Do not redesign it.

### New episode: recruitment fraud (attack-first, built shape)

**Brief and scope note.** Fatima welcomes the learner; there is a remote hire to fill quickly and an agency pushing hard.

**Attack half (unscored, red-flag meter).** OSINT on the public vacancy and a professional profile, then compose one application from a borrowed identity, with found facts in the blanks. Nothing real is sent.

**Flip.** The learner's own application shown from the recruiter's side, its tells named: a profile created weeks ago, a firm with no trace, an ID that is a photo of a screen, pay requested to someone else's account.

**Defend half (scored, mirror pairs).** A set of candidate messages and files to triage, each fake paired with a close genuine twin, so the learner practises the checks, not a type:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | A remote candidate who won't show original ID on a live call | A genuine candidate on poor rural broadband who holds up a passport | identity refused | Verify through the standard checks |
| 2 | Pay requested to "my business partner's account, for tax reasons" | A genuine request to pay into the candidate's own named account | payment to a third party | Report; the real route is the candidate's own account |
| 3 | References from free email with internet phone numbers, a profile created last month | A career-break candidate with checkable references HR rings itself | unverifiable references | Verify on numbers HR finds itself |
| 4 | A CV from a firm with no trace before last year | A genuine CV with an unusual but checkable history | fabricated history | Verify; run the right-to-work and reference checks |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for managers: *"Right access on day one, gone on the last day, and 'thank you' when someone tells you."* A concept card on the fair checks (the original document seen in person or on a live call, right to work, references HR rings itself, every candidate, every time). Then the reporting-route box and the no-blame line.

### New episode: access that outlives the job (consequence flip, R3)

No natural attacker, so the learner makes the everyday mistakes in a safe sandbox and the flip shows the consequence:

- **The mistake:** copy a leaver's access for a new starter ("same as the person who's leaving"), keep a mover's old mailbox, leave a shared login unchanged, miss a leaver's key safe code.
- **The flip:** the access list months later, full of ghosts (a contractor who left in spring, a summer temp, a senior person's unused admin rights), a toxic combination (someone who can both raise a purchase order and approve its payment), and a key safe code a leaver and every past cover still knows.
- **Debrief cards:** access follows the job; day one, move day, last day; the review; and the no-blame response (Thank, Act, Support, Learn) when a team member reports a mistake, with the "What do you say?" prompts (a misdirected rota, an approved sign-in nobody started, a lost laptop) answered best with *"Thanks for telling me. Let's report it now, together."*

## Decisions and consequences

Every item pairs a threat with a doable action and never shames the player, nor a colleague who owns up. The genuine-candidate mirror twin makes "run the checks" the only reliable rule, so no candidate's nationality, accent or appearance is ever the clue.

| Item | Caught by | Learning outcome |
|---|---|---|
| E2: malicious CV or "enable content" (built) | Treating attachments and links as untrusted; the macro panel | LO4 |
| Fake candidate, refused ID | The standard identity check | LO4 |
| Pay to a third party | Pay only the candidate's own named account | LO4 |
| Copy a leaver's access (flip) | The role template and least access | LO1 |
| Mover's mailbox left open (flip) | Remove old access on move day | LO2 |
| Ghost accounts and shared login (flip) | The access review | LO3 |
| A reported mistake | Thank, Act, Support, Learn | LO5 |
| HR or health detail | Need-to-know; point to HR | LO6 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of E2, the recruitment-fraud episode and the consequence flip (R3) |
| OSINT browser and intel facts | The research stage |
| Mail client in template mode with the red-flag meter and `systems/phish-rules.js` | Compose the one application |
| Inbox triage with attachment labels and the macro concept panel (E2) | The defend sets, with mirror pairs |
| Flip view, debrief view, concept cards | The flip, the debrief and the access and culture cards |
| `person-chat` video-call mode | The remote interview; any freeze, blur or lag is generic call-quality dressing, never a deepfake tell |
| Awareness measurement and the comparison panel | The hr checks |

No new minigame is built. The MG-18 access review desk, MG-25 document inspector and the live team pulse board are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Lures aimed at recruiters | E2 defend half (macro panel) | LO4 |
| The fair checks for every hire | Recruitment-fraud defend half | LO4 |
| Access follows the job | Consequence-flip debrief | LO1 |
| Day one, move day, last day | Consequence-flip debrief | LO2, LO3 |
| HR information: need to know | Consequence-flip debrief | LO6 |
| Thank, Act, Support, Learn | Consequence-flip debrief | LO5 |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view for each episode: per-item reasoning cards; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted); the "On Monday" card; the reporting-route box; the no-blame line. The consequence-flip debrief also shows the access list before and after the flip, with ghosts and toxic combinations marked.

## Variants

- **Defend-only variant:** each full episode as brief, defend, debrief (about 8 minutes), same defend set.
- **Facilitated session:** the `facilitated` flag on the full episodes, played on a shared screen for a managers' workshop, with pause panels (who has copied access to save time; what you say to your own manager when the agency says start Monday; what your best manager said when you got something wrong; which account you'd be nervous to remove). The flag hides per-learner scores on the shared screen. HR teams can run it with the HR-only framing.
- **Text route:** each stage as text with the same options; the interview as a transcript with the call described (poor broadband means nothing; he won't hold his passport up; he asks to be paid into someone else's account); a gap in the build (BE-03).
- **Spaced practice:** the defend-only shell as a quarterly drill timed with access reviews; the hr checks repeated each year.
- **Replay:** the fake candidate is drawn from a bank alongside genuine candidates with awkward circumstances, so the lesson is always "run the checks"; the consequence flip varies the mover, the leaver and the ghost accounts.

## Alternative concepts

1. **The Leaver's Shadow (consequence flip).** Already the built-shape plan above: the access a recent leaver still holds, shown as the flip. No red-team mentor; the awareness product has no runtime attacker guide.
2. **Manager's In-tray (defend-only drill).** Access requests, leaver forms and interview reports as a short defend-only shell, scored on the right call against the role cards.
3. **Team Pulse (facilitated).** The culture lesson run as a facilitated discussion around the "What do you say?" prompts, for management development days.

## Art and audio

- **Rooms:** `room_aw_tarrowby` (training-room review cycles C1 to C3 are closed and the POV conversation backgrounds are made, wired and approved).
- **Characters:** Tarrowby's Fatima Begum, Colin Mather, Jun Watanabe, Roseanne Wadsworth and Nilesh Solanki use their awareness art; host art follows the PixelLab reset (3 Nov), with all 19 concepts approved. The fake candidate needs a portrait for the video call (a profile photo plus a plain on-camera frame); any freeze or blur is generic call-quality dressing, not specific to them.
- **Voice:** text-to-speech only (no runtime language model). The fake candidate and the genuine awkward candidate use clearly different voices. No voiced line prints a variable: names, counts and percentages are on screen only, so the voice cache stays keyed on exact text.

## Pitfalls

- **Profiling.** The candidate's nationality, accent or appearance must never be the clue. The clues are inconsistencies and refusals, and the genuine-candidate mirror twin makes "run the checks" the only rule that always works.
- **Leavers as villains.** The risk is the forgotten access and the codes, not the person; a leaver's honest wish to say goodbye is resolved kindly.
- **Surveillance training.** The concern card teaches managers to raise facts with HR and security, not to watch colleagues or search mailboxes alone.
- **Punishing the click.** A reported mistake ends well; reporting is never penalised; the blame response is shown to cost trust, not drama.
- **Too much law.** Employment and data protection detail stays light and points to HR and the DPO; rules differ by country and change, so the organisation profile carries the local process.
- **A manager-only lens.** HR staff and senior managers take this module too; the debrief says "your team" without assuming a team size in speech.
