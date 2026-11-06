# role_03 game design: Reset Request

## Concept

This module is the built episode E3 plus one new episode, in the "Incident Simulations: Critical Cases" frame: a training room at Quayholt Insurance with a kiosk and a host, no doors, no combat, no VMs.

- **Built foundation.** E3 teaches the habit the NCSC asked every service desk to review in 2025: verify through a route the caller doesn't control, however senior or urgent they are. The learner plays the attacker first (a pretext call to the desk as a locked-out claims manager, on the influence bar, then an MFA push run where the learner chooses how many pushes to send and when), then the role swaps: the learner is the service desk agent, taking three calls and an unrequested push, checking the very facts they used as the attacker. The helpdesk check pair measures the skill before and after.
- **New role extension.** One new episode in the same built shape covers what E3 does not: least privilege and separate admin accounts, risky app consent and remote tooling, and the alerts that follow a reset.

The story a learner takes away is E3's: the impostor knows every security answer, and the only thing that catches him is the call back on a number he doesn't control. The role swap makes it land, because the learner just made the same call themselves.

The old Larkspur service desk, its MG-17 caller verification queue, its `log-filter` and `siem` alert views and its `forensic-data-platform` consent inspector are retired: they would redesign well beyond the build. The fuller "Monday queue" is kept in the `features/minigames.md` catalogue (build status "not built"). The post-reset alert is taught here as a defend item and a concept card.

## Setting and cast

- **Company:** Quayholt Insurance (`quayholt.example`), a commercial insurer in Bristol with an in-house IT service desk and single sign-on, room `room_aw_quayholt`. Host: **Darren Price**, service desk team lead, who backs his analysts: "Nobody on this desk gets in trouble for following the procedure."
- **The learner:** a service desk analyst (the attacker, then, after the role swap, the agent in Leila Nassar's seat).
- **Built Quayholt cast** (in `BRAND_SET.md`): **Leila Nassar** (service desk agent, the role-swap seat), **Gordon McLeish** (claims manager, the "locked-out manager" an attacker impersonates), **Anjali Rao** (information security analyst, who receives reports), with the impostor alias **"Josh Henley"**. E3's build also added Helen Achterberg, Patrick Kerrigan and Reuben Ofori (the genuine voicemail caller in the helpdesk form).
- The old Larkspur cast (Owain Jenkins, Kai Murray, Rosa Delgado) is retired. The new episode uses the Quayholt cast: Anjali Rao for security escalations, Helen Achterberg as the analyst who slips and reports it, Gordon McLeish as a genuine manager who requests an app. Any additional name needs the pre-ship web-search and surname-clash check.

## Structure

### Built foundation: E3 and the helpdesk checks

Already built; summarised so this module reads whole. Brief and scope note (an authorised exercise at Quayholt's desk); attack half (a pretext call to the desk as Gordon McLeish, locked out, on the influence bar, then an attacker-side MFA push run where the learner chooses how many pushes to send and when, for example late at night, and the debrief explains why fatigue works); flip (the learner's own call and push run from the desk's side, tells named); defend half as a role swap (the learner is the agent: three calls, two impostor and one genuine, plus one unrequested push, Verify on, the claimed facts shown by label so the learner checks the facts they used); debrief (per-item cards, genuine-item feedback, the team tally, the habit, an "On Monday" card, the reporting route, no blame). The helpdesk AB and BA checks bracket it. This evidences R03-LO1, LO2 and LO6. Do not redesign it.

### New episode: least privilege and consent

In the built shape at Quayholt:

**Brief and scope note.** Darren welcomes the learner; it is a busy shift and the admin and consent requests are stacking up.

**Attack half (unscored, red-flag meter / influence bar).** OSINT on Quayholt's public pages and a project's public notes, then compose one app-consent lure or admin-access request from found facts: a message in a project manager's name asking for a new contractor's account to be given broad admin rights, or an app that "files client emails" and needs every mailbox. Nothing real is sent.

**Flip.** The learner's own request shown from the approver's side, its tells named: who really asked, what the app can actually do, why "give him domain admin so he isn't blocked" is the wrong shape.

**Defend half (scored, Verify on, mirror pairs).** A triage set, each phish with a close genuine twin:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | "Approve this app: read and write all mailboxes, send as any user" | A genuine approved filing tool with narrow scope | broad consent, unverified publisher | Report; send for security review |
| 2 | "Whitelist our remote support tool, your antivirus keeps closing it" | A genuine supplier session booked through the gateway with a change ticket | unapproved tool, no change ticket | Verify, then refuse and remove |
| 3 | A post-reset sign-in from an unexpected place, new MFA device | A genuine sign-in from a user travelling with their known device | post-reset anomaly | Report to security now |
| 4 | "Turn the virus checker off on this PC" | A genuine request to tune a slow scan | disable security | Verify; raise a change to tune, not disable |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for the desk: *"Knowing isn't proving. Call back on a number they don't control."* Concept cards on least privilege (separate admin accounts, phishing-resistant MFA, just-in-time access, no email or browsing as an admin) and on treating app consent as an access request. Then the reporting-route box and the no-blame line.

## Decisions and consequences

Every scored item pairs a threat with a doable action and never shames the player. A reset in the attack half is the learner playing the attacker, not a mistake; the role swap and debrief treat a reported slip as the best outcome after an error (the build's no-blame line, and E3's "slipped, reported, thanked" pattern).

| Item | Caught by | Learning outcome |
|---|---|---|
| E3: the locked-out "manager" call (built) | Call back on the number on record | LO1, LO2 |
| E3: the unrequested push (built) | Deny and report a push you did not start | LO2 |
| Broad app consent | Treat consent as an access request; send for review | LO4 |
| Remote tool whitelist | The approved gateway; remove and report | LO4 |
| Post-reset sign-in alert | Escalate to security before anything else | LO5 |
| "Switch security off" | Raise a change to tune, not disable | LO4 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner and role-swap module | The spine of E3 and the new episode; the `facilitated` flag for a team session |
| OSINT browser and intel facts | The research stage |
| Pretext prep and the pretext judge, with the influence bar | E3's pretext call; the new episode's admin-access request |
| Mock authenticator (`minigames/authenticator/`) | E3's attacker-side MFA push run |
| Mail client in template mode with `systems/phish-rules.js` | The app-consent lure |
| Inbox triage with the `call`, `push` and `voicemail` kinds and the Verify verdict | The defend sets, with mirror pairs |
| Flip view, debrief view, concept cards | The flip, the debrief and the admin-hygiene cards |
| Awareness measurement and the comparison panel | The helpdesk checks |

No new minigame is built. The MG-17 caller verification desk, the `log-filter`/`siem` alert views and the `forensic-data-platform` consent inspector are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| What a reset is worth | E3 debrief | LO1 |
| Knowing isn't proving | E3 defend half | LO1 |
| The verification ladder | E3 and the new episode | LO2 |
| Least privilege | The new episode's debrief | LO3 |
| App consent is an access request | The new episode's defend half | LO4 |
| The alerts after a reset | The new episode's debrief | LO5 |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view for each episode: per-item reasoning cards; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted above); the "On Monday" card (*"Knowing isn't proving. Call back on a number they don't control."*); the reporting-route box; the no-blame line. E3's debrief also shows the attack chain the learner broke, link by link, from the role swap.

## Variants

- **Defend-only variant:** each episode as brief, defend, debrief (about 8 minutes), same defend set, for customers who object to the attacker beat.
- **Facilitated session:** the `facilitated` flag on the full episode, played on a shared screen for a service desk team meeting, with a pause panel between stages (would we have moved it; what could someone find about our executives; what makes people skip checks; one change to our procedure). The organisation's own procedure replaces Quayholt's on the cards (BE-05); the flag hides per-learner scores on the shared screen.
- **Text route:** each call and item as a transcript with the caller card as a table and the verification actions as buttons; same decisions and records; a gap in the build (BE-03).
- **Spaced practice:** the defend-only shell as a monthly "Prove It" drill; the helpdesk checks repeated each year.
- **Replay:** the callers, pretexts and records vary; an outsourced-desk version adds a client-approval step for privileged accounts.

## Alternative concepts

1. **The Long Con (attacker-first, built shape).** E3 already is this: the learner builds the caller's answers from public information in the OSINT browser, then the role swaps and the next call is their own. No separate red-team mentor; the awareness product has no runtime attacker guide.
2. **Keys to the Castle (consequence flip).** A least-privilege design episode built as a consequence flip (R3): the learner grants an over-broad admin account in a safe sandbox, and the flip shows how far one phished account then reaches. Good for system administrators; kept in the backlog if a design board is ever built.
3. **Desk drill (defend-only).** A short defend-only shell of caller and push items for service desk away-days, scored on correct verification over speed.

## Art and audio

- **Rooms:** `room_aw_quayholt` (training-room review cycles C1 to C3 are closed and the POV conversation backgrounds are made, wired and approved).
- **Characters:** Quayholt's Darren Price, Leila Nassar, Gordon McLeish, Anjali Rao, Helen Achterberg and Patrick Kerrigan use their awareness art; host art follows the PixelLab reset (3 Nov), with all 19 concepts approved.
- **Voice:** text-to-speech only (no runtime language model). The impostor caller uses a different voice from the genuine manager, with phone ambience through the voice filter; the lesson is that the voice and the answers prove nothing either way. No voiced line prints a variable: names, numbers and account details are on the caller card, not in speech. Phone numbers on screen come from Ofcom's drama range.

## Pitfalls

- **Don't train obstruction.** Every "no" comes with the fast route: the call back, the booking, the approved tool. Callers are colleagues.
- **Don't make the desk the villain.** The analyst who slips is good at the job; the fix is the procedure and the backing, not blame. Reporting is never penalised.
- **Keep the procedure doable.** Every correct route must be achievable inside the episode.
- **Don't teach unreliable cues.** The impostor has no slip in the story; the voice, the answers and the ambience prove nothing.
- **Awareness level only.** No detail on how callers spoof numbers, bypass MFA or abuse tools. The module shows what the desk sees and what stops it.
- **No real products.** The app, the supplier and the remote tool are fictional; check names before release.
- **Video isn't proof.** Every video check in the module is paired with a second route.
