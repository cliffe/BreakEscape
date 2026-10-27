# sector_01 game design: Ward Round

## Concept

sector_01 is a new sector role, so it has no built episode yet. It is designed in the "Incident Simulations: Critical Cases" shape: a training room at Beckside Hospitals NHS Trust with a kiosk and a host, no doors, no combat, no VMs. The learner is the ward clerk on Ward 12, a 28-bed general medical ward, whose morning job is to get three patients home by two o'clock while protecting their information from everyone who doesn't need it and sharing it quickly with those who do.

- **Attack first.** The social engineering a ward clerk faces: a caller who says he is a patient's nephew, a "patient's agent" who is really a reporter, a smartcard-renewal phish in the shared mailbox, a stranger in a hi-vis jacket in the staff corridor. The learner researches what a caller could learn about a patient from public sources, composes one pretext call or mailbox phish, sees it flipped, then defends the ward phone and mailbox.
- **Consequence flip (R3).** The harms with no attacker: opening a famous patient's record out of curiosity, working in a colleague's session, taking an unsafe workaround when the system is down. The learner makes the everyday mistake in a safe sandbox and the flip shows the access audit, line by line.

The lunchtime talking points: the audit list showing exactly who opened the famous patient's notes, the "nephew" the patient hasn't spoken to in ten years, and the lunchtime outage run on paper.

The old Larkspur-client framing is retired: Beckside is a proposed brand-set healthcare organisation in its own right, not Larkspur's client. The un-built patient record viewer (an `ehr-terminal` generalisation), the MG-27 desktop, the BE-10 ward sweep and Dr Mulligan's engine-recorded video are retired too. The snooping audit is a debrief and concept card, not a full record-viewer minigame; the ward sweep becomes a spot-the-risk defend item; the "duty to share" is a concept card from the Caldicott Guardian, not a video (R9). The record-viewer generalisation is kept in the `features/minigames.md` catalogue (build status "not built").

## Setting and cast

- **Company:** Beckside Hospitals NHS Trust (`beckside.example`, **proposed for `BRAND_SET.md`**), with Beckside General Hospital and Ward 12. The awareness product uses the training-room frame; a new or redressed Beckside training room holds the kiosk and host.
- **Cast** (diverse by age and background, each needing the pre-ship web-search and surname-clash check; there is no recurring course mentor, the host carries the welcome):
  - **Dev Kapoor**, the trust's information governance manager and host: calm, friendly, "every look is logged".
  - **Rodel Bautista**, ward manager: brisk, fair, sets the morning's work.
  - **Dr Patrick Mulligan**, consultant and Caldicott Guardian: gives the "duty to share" concept card (not a video).
  - **Joy Okonjo**, staff nurse, whose smartcard is left in a reader in the consequence flip; **Kayleigh Rowntree**, healthcare assistant, whose curiosity is the snooping temptation.
  - **Patients:** Mr Arthur Fenwick (going home to a care home) and Ros Fairbairn (a well-known gardener admitted after a fall).
  - **Callers (voices only):** a man who says he is Mr Fenwick's nephew; a woman who says she is Ros's agent; the deputy manager at the care home; the pathology lab.
- **The facilities contractor on site** is from the proposed **Harbreck Facilities Group** (role_01): an engineer who signs in and expects to be checked, the contrast with the hi-vis stranger.

## Structure

### Attack-first episode: the ward phone and mailbox

**Brief and scope note.** Dev welcomes the learner to an authorised exercise on Ward 12.

**Attack half (unscored, red-flag meter / influence bar).** Research what a caller could learn about a patient from public sources (a local news story, a social post), then compose one pretext: a call to the ward as a "relative", or a smartcard-renewal phish to the ward's shared mailbox. Nothing real happens.

**Flip.** The learner's own approach shown from the ward clerk's side, its tells named: a caller who knows public facts but isn't on the patient's list; a renewal email with a look-alike sign-in page.

**Defend half (scored, Verify on, mirror pairs).** The ward phone and shared mailbox, each impostor with a close genuine twin, the claimed facts shown by label:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | The "nephew" asking how a patient is (`call`) | A genuine relative who gives the agreed password | not on the list | Verify: take a name and number, or ask for the password |
| 2 | The "agent" (a reporter) asking when a patient goes home (`call`) | A genuine care home needing a discharge summary | press enquiry, pressure | Report/Verify: the press office; confirm the home by call-back |
| 3 | A "smartcard expires today, renew here" email (email) | A genuine IT notice linking to the known portal | look-alike domain, credential lure | Report |
| 4 | A stranger in hi-vis heading for the office (`page`/visitor) | A genuine contractor who signs in and invites a check | no ID, no booking | Verify with IT/security |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for the ward: *"Look only at what you need. Share what care needs. Check who's asking. Report anything odd."* Concept cards on the duty to share (the Caldicott Guardian's card) and who's asking. Then the reporting-route box and the no-blame line.

### Consequence-flip episode (R3): need to know, smartcards, downtime

No live attacker, so the learner makes the everyday mistakes in a safe sandbox and the flip shows the consequence:

- **The mistakes:** open the famous patient's clinical notes out of curiosity (the record viewer's warning asked for a reason); work in Joy's open session to print a letter; when pathology goes down, send the bloods list on a messaging app, photograph the whiteboard, or charge a phone from a monitor's USB port.
- **The flip:** the record access audit for the famous patient, showing exactly who opened the notes, with the learner's own line if they looked; the letter recorded as Joy's work; the ward list on a personal phone nobody controls.
- **Debrief cards:** need to know and every look is logged (Caldicott Principle 4); your smartcard is you; the duty to share (Principle 7); the downtime procedure and why the workarounds are unsafe; and "if you've already looked, tell IG now; it's always better coming from you".

## Decisions and consequences

Every item pairs a threat with a doable action and never shames the player, nor a colleague; a reported slip is the good outcome. Refusing to share with the care home is shown as a gap (unsafe for the patient), not a pass: over-caution is corrected alongside over-sharing.

| Item | Caught by | Learning outcome |
|---|---|---|
| The "nephew" | Take a name and number, or ask for the password | LO3 |
| The "agent" | The press office | LO3 |
| Mailbox phish | Report; never click | LO6 |
| Hi-vis stranger | Check with IT or security | LO6 |
| Famous patient's notes (flip) | Need to know; admin view only | LO1 |
| Colleague's session (flip) | Card out, lock, own login | LO2 |
| Downtime workaround (flip) | The downtime procedure | LO5 |
| The care home (defend item) | Call back, then the approved secure route | LO4 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of the attack-first episode and the consequence flip (R3) |
| OSINT browser and intel facts | What a caller can learn about a patient from public sources |
| Mail client in template mode with `systems/phish-rules.js` | Compose the mailbox phish |
| Inbox triage with the `call`, `sms`, `page` and email cards and the Verify verdict | The ward phone and mailbox defend set, with mirror pairs |
| Flip view, debrief view, concept cards | The flip, the debrief and the Caldicott, smartcard and downtime cards |
| Awareness measurement and the comparison panel | The new healthcare checks |

No new minigame is built. The generalised patient record viewer, MG-27, the BE-10 ward sweep and the video are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Need to know; every look is logged | Consequence-flip episode | LO1 |
| Your smartcard is you | Consequence-flip episode | LO2 |
| Who's asking? | Attack-first defend half | LO3 |
| The duty to share (Caldicott Guardian) | Attack-first defend half | LO4 |
| The downtime procedure | Consequence-flip episode | LO5 |
| Report it | Both debriefs | LO6 |

No video. Dr Mulligan's "duty to share" is a concept card, not an engine-recorded video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view: per-item reasoning cards; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted); the "On Monday" card; the reporting-route box; the no-blame line. The consequence-flip debrief shows the record access audit for the famous patient, with the learner's own line if they looked, and Dev's calm "was that for her care?".

Spoken lines say "the hospital" and "the ward", never the organisation's name, so BE-05 can rename it on screen; counts are on screen only.

## Variants

- **Defend-only variant:** the attack-first episode as brief, defend, debrief (about 8 minutes), same defend set.
- **Facilitated session:** the `facilitated` flag on the full episode, played on a shared screen for a ward-team huddle, with pause panels (who we give updates to and how we know; what to say to a colleague who says "just a quick look"; where our downtime box is; when not sharing has caused a problem). The flag hides per-learner scores on the shared screen.
- **Text route:** the shift as text, the calls as transcripts, the record access audit as an accessible table, the spot-the-risk as a described list; a gap in the build (BE-03), and important in a clinical setting.
- **Spaced practice:** a "Share or Don't?"-style defend-only shell, monthly; the healthcare checks repeated each year.
- **Replay and editions:** the callers, the phish lure and the well-known patient vary (a footballer, a local MP, a soap actor, or the commonest real temptation, a colleague admitted as a patient); GP practice and care home editions come later and also serve DSPT categories 3 and 4.

## Alternative concepts

1. **The Audit Trail (consequence flip).** The learner is an information governance officer the morning after a famous patient's admission, working out from the audit which accesses were for care and which weren't, with fairness before blame. Built-shape consequence flip; suits managers and IG leads.
2. **Paper Day (consequence flip).** A whole episode during an outage, each step a choice between the downtime procedure and a tempting workaround, with the flip showing what each workaround cost. Strong for clinical staff.
3. **Mystery Caller (attack-first, built shape).** The attack half already is this: the learner builds the pretext from public sources, then defends the calls. No red-team mentor.

## Art and audio

- **Rooms:** a new or redressed Beckside training room (room review and POV backgrounds are later in the build).
- **Characters:** Dev Kapoor (host) and Rodel Bautista need art and voices; Dr Mulligan needs a portrait for his concept card; Joy, Kayleigh, the patients and the callers need art or voices as the episode uses them. The facilities contractor is a Harbreck Facilities engineer. Host art is held on PixelLab quota and the user's approval.
- **Voice:** text-to-speech only (no runtime language model). No voiced line prints a variable: never the player's name, the organisation's name, a count or a ward number that changes per play, so the voice cache stays keyed on exact text.

## Pitfalls

- **Over-caution.** Refusing to share is a gap, not a pass. The care-home item exists so that "say nothing to anyone" is visibly wrong.
- **Clinical accuracy.** The ward clerk routes clinical calls and doesn't take results or make clinical decisions. A nurse and a ward clerk review the script before the build.
- **Fear.** The audit is shown plainly, with consequences stated, not staged. No dismissals or police on screen.
- **Blaming a colleague.** A card left in a reader is often a system problem (too few terminals, slow logins); the debrief says so, and a reported slip is the good outcome.
- **Jargon.** Smartcard, IG, Caldicott Guardian and downtime are explained the first time they come up.
- **Going out of date.** The DSPT and NHSmail's reporting route change; both are organisation slots, reviewed with each DSPT release.
- **Real people.** The well-known patient is fictional and must not resemble a real presenter or any real case of record snooping.
- **Teaching the wrong thing by showing it.** Unsafe workarounds are offered as choices but never shown in detail (no realistic patient list on a phone screen).
