> **For the build, this design is superseded by `../../implementation/episodes/E14_social_media.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_12 game design: Open Book

## Concept

This is the playful attacker-view episode, and the one where the learner does the attacker's work with their own hands before flipping to defence. The frame is the built one: a training room at Merrin & Sallow Architects (fictional), a kiosk and a host, Tomás Carvalho, who welcomes the learner and reads the scope note: *"Authorised exercise. In scope: Oskar's public posts and your own profile. Nothing you do here leaves this room."*

In the attack half the learner opens the OSINT browser on one colleague, Oskar Berglund, a junior architect who posts everything, and pins his public posts. Pin by pin, the intel board fills: his employer, his team, the practice's new finance system, next week's leave, his dog. Each fact carries its reduce note, the one line that says what to leave off a post. Then the learner writes one pretext message from a template whose blanks take only the facts found, and sends it once. The flip puts that message in a colleague's inbox with its tells highlighted: the learner sees their own work land.

The defend half turns the same board into the checklist for taking it apart. The learner triages a feed (post, tweak or hold), handles a fake recruiter and a fake senior profile, and tightens the privacy settings that close each found fact. The debrief is the built one, and the habit lands at the end. Oskar is in on it and thanked, so nobody is humiliated, and the lesson is on habits, not blame.

## Setting and cast

- **Room:** the Merrin & Sallow training room (`room_aw_merrin_sallow` type), with the kiosk and the host spot. The feed, the OSINT board and the privacy panel are full-screen overlays, so the episode needs no new room.
- **Host:** Tomás Carvalho (the E4 inbox owner), who welcomes the learner and carries the event mapping that completes the shell once the defend result has synced.
- **OSINT subject:** Oskar Berglund, a junior architect, friendly and oversharing, who owns his mistake and fixes it fast. Reuse of the E4 cast; the oversharing detail is proposed, consistent with `BRAND_SET.md`.
- **Impersonated senior:** Catherine Merrin, managing partner, as a fake connection request in the defend half (the look-alike NPC guard flags a profile in a real person's name).
- **Fake recruiter:** an unknown contact with a thin, new profile; a generic avatar, no real brand.

Larkspur and its cast (Jo Fairweather, Ama Owusu, Leo Brennan, Gillian Marsh) are retired. The ethical-tester framing is replaced by the built scope note (an openly authorised exercise), so there is no hidden-test reveal. The mentor's teaching moves into the host's welcome, the per-item feedback and the debrief.

## Structure

The attack half is unscored (one artefact, red-flag meter on); only the defend half is scored, under the `awareness` profile.

### Brief and scope note (1 minute)

Tomás welcomes the learner and states the scope. A short line sets the task: *"See what one colleague's public posts give away, then close the gaps, on his profile and on yours."*

### Attack: the board (3 to 4 minutes)

- The learner opens the OSINT browser on Oskar's public posts and pins each to the intel board. Each pin is something Oskar posted:
  1. His professional-network profile: employer, role, team, and his manager's name.
  2. A shared job advert that names the practice's new finance system.
  3. A "new kit" photo: a lanyard and a whiteboard that confirm the system and his access.
  4. A leave countdown: he is away next week.
  5. A photo of his dog, captioned as a "name a pet" answer.
- As each fact lands, the board shows its **reduce note**: the one line that says what to leave off (lock the profile down, no badge or whiteboard in shot, do not name the system, keep leave private, make up the pet answer). This is the built "reduce" mechanism, reused.

### Attack: write (2 to 3 minutes)

- The learner composes one pretext message from a template whose blanks take only facts on the board (the template composer and phish rules engine). For example, a message to Oskar's covering colleague while he is away, built from the leave date, the system name and the manager's name. The red-flag meter gives guidance before Send; the first Send ends the beat (one artefact, unscored).

### Flip (under 1 minute)

- The learner's own message arrives in the covering colleague's inbox with its tells highlighted (the flip view). A scripted defender line is keyed to the learner's choice. This is where the "a good pretext is hard to spot, so people who fall for one are not stupid" lesson lands.

### Defend (3 to 4 minutes)

Triage under the `awareness` profile, Report always visible, immediate feedback:

- **The feed ("Post or Not?").** Draft posts and photos to mark **Post**, **Tweak** or **Hold**: a lanyard selfie (tweak), a post naming an internal tool (tweak or hold), a team photo with a client whiteboard (tweak), a two-week leave post (tweak or hold), a genuinely fine pet photo with tight privacy (post), a desk photo with a screen in shot (tweak), a child's first-day photo tagging the school (tweak, a security-question reminder).
- **The fake recruiter.** A message offering a flattering role, then *"to tailor the application, could you send over an overview of your firm's systems and who runs IT?"* The verdicts are Report (best), Delete, or Trust; the debrief explains what each would have given away.
- **The fake senior profile.** A connection request in Catherine Merrin's name from a new, thin account (look-alike NPC guard). Report it.
- **Tighten the settings.** On the privacy panel, set posts to connections only, hide the connections list, turn off location tags, remove or crop the risky posts, and change the pet-name security answer to a made-up one. Each change visibly closes a found fact on the board, Oskar's and then the learner's own.

### Debrief (1 to 2 minutes)

The built debrief view, in order:

1. A per-item reasoning card for each defend item.
2. Feedback on the genuine items (the safe pet photo, a real recruiter if one is mixed in): which the learner trusted, checked or flagged.
3. The **team protected** tally.
4. **The habit to keep:** *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*
5. The **"On Monday"** card: tighten one privacy setting today, and check what is behind you before your next post or video call.
6. The reporting route (`slot:customer_report_route`).
7. The no-blame line: a well-made profile of a person is built from scraps anyone could find; nobody is foolish for having posted them.

The board is shown again, most found facts now closed, each annotated with the setting or post that closed it.

## Decisions and consequences

| Decision | Verdicts / options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Build the board | (guided) which posts give away most | LO1 | The pretext forms from the pins; each fact's reduce note |
| Write the pretext | one templated message | LO1 | The flip: the message lands with its tells highlighted |
| Feed items | Post / Tweak / Hold | LO2 | Immediate per-item feedback; the safe choices modelled |
| The fake recruiter | Report / Delete / Trust | LO4 | Reasoning card: what sharing a little or a lot would have enabled |
| The fake senior profile | Report / Delete / Trust | LO4 | Reasoning card on how a fake senior profile lends weight to later scams |
| Tighten the settings | apply each / skip some | LO3 | Each change closes a found fact on the board, on Oskar's profile and the learner's own |

Scoring is the built `awareness` profile (60 for the verdict, 40 for naming the real flags; reporting is never penalised, so an unsure learner who reports loses nothing). No option shames the player.

## Minigames

| System | Status | Use here |
|---|---|---|
| OSINT browser and intel board | built | The board of Oskar's public posts, with a reduce note per fact |
| Template composer and phish rules engine | built | The one pretext message, blanks filled from found facts; red-flag meter |
| Flip view | built | The learner's message in a colleague's inbox with its tells |
| Inbox triage (`awareness` profile) | built | The feed, the recruiter and the fake-profile cards; Report always visible |
| Look-alike NPC guard | built | The fake Catherine Merrin connection request |
| Awareness-measure records | built | Per-item id, verdict, chips, score, stage and time |
| Privacy-settings surface | new | Tighten a profile; each change closes a found fact |
| Feed drill ("Post or Not?") | new | Mark draft posts Post, Tweak or Hold |

## Explainers

- A short panel on **privacy settings** (who sees posts, tags, connections, location, old posts) in the defend half.
- A short panel on **who speaks for the organisation**, from the organisation profile.

No video. No runtime language model. The pretext message, the flip line, the feedback strings and any assistant text are authored data or ink.

## Debrief

The built episode debrief, as set out under "Structure" above: a reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and the no-blame line.

## Variants

- **Defend-only variant** (`variant: "defendOnly"`, about 8 minutes): brief, defend, debrief. It drops the OSINT and write beats and keeps the same defend set, so the measurement is unchanged. For customers who object to the "play the attacker" beat. The no-blame line moves into the debrief's `defendOnly` string.
- **Pre and post checks:** the general role check forms (AB and BA), 10 items each, played as the bracketing missions. Social-media and oversharing items (reading what a post gives away, a fake recruiter, a fake senior profile) join the general check pool as mirror pairs; see `assessment.md`.
- **Facilitated session:** the `facilitated` flag prompts discussion and hides the per-learner score on the shared screen. Pause points: after the board ("What could we find about our own team in ten minutes?"), after the feed ("Where is the line between a normal life online and a gift to an attacker?"), after the recruiter ("Who would we check with before answering?").
- **Replay:** the subject's posts and the feed draw from a bank; the recruiter's pitch varies per play.

## Alternative concepts

1. **Two profiles (compare and fix).** An oversharing profile and a careful one side by side; list the differences, then fix the oversharing one. Simpler than the full board; good for a facilitated session, but less of a hook.
2. **The shopping list.** The attack beat as a checklist ("find the manager's name, a system, a holiday, a security answer") ticked off the feed, then the finished pretext, then the flip. A tighter, gamier attack half.
3. **Your own footprint.** An optional, private extra after the episode, in which the learner tidies their own public footprint (guided, nothing stored). Powerful, but harder to assess and keep private, so it stays an extra, never the core.

## Art and audio

- **Room:** the Merrin & Sallow training room; no new room.
- **UI:** the OSINT board (already built), the generic feed, the privacy-settings panel, and the "closed string" animation when a setting changes a found fact.
- **Characters:** Tomás (host) and Oskar (subject) need the company's cast art (CSS wordmark and placeholder sprites until PixelLab art is approved). The recruiter and the fake senior profile use generic avatars.
- **Voice:** text to speech for the host and any voiced lines. No voiced line prints a variable: the subject's name and the found facts appear on the board and in text, not in speech.

## Pitfalls

- **Keep the attack at "already public".** The board only ever shows what the subject posted; no scraping tools or techniques, and the defence is always named.
- **Protect the subject.** The board is built on the fictional Oskar, with consent in the story, never on a real person or the player's real accounts.
- **No blame, no shame.** Oversharing is normal and fixable; the no-blame line is in the debrief.
- **Do not teach unreliable tells.** Fake-profile signs are hints, not proof; the reliable move is to share nothing sensitive and report.
- **Mind the boundaries.** Phishing is core_01, pretext calls are core_02, being recruited against your employer is core_14, passwords and MFA are core_03. Keep each light and signpost it.
- **No real brands.** The feed, the professional network and the services are invented, with `.example` domains; check every name before build.
