# role_04 game design: Ship It

## Concept

role_04 is a new role, so it has no built episode yet. It is designed in the built "Incident Simulations: Critical Cases" shape: a training room at Stavely Software with a kiosk and a host, no doors, no combat, no VMs. The learner is a developer on the team that builds and runs Stavely's booking-and-invoicing portal.

- **Attack-first episode.** The social engineering aimed at developers: a "maintainer" who wants you to switch to their fork and grant access, an AI assistant that names a package that does not exist, a fake CI or registry notice, a recruiter lure. The learner researches, composes one such message from found facts, sees it flipped, then defends a developer inbox.
- **Consequence-flip episode (R3).** The topics with no live attacker: a secret committed to the repository, real people in the test database, a risky pull request approved under release pressure. The learner makes the everyday mistake in a safe sandbox and the flip shows where it led.

The story a developer takes away: the package the assistant made up does not exist today; three weeks later it does, and someone else wrote it. And: a deleted secret is not a gone secret.

This is awareness level. The MG-19 code review minigame, the pull request view and the MG-16 coding-mode assistant from the old Larkspur plan are retired; they would redesign well beyond the build. Secure-coding recognition depth lives in Hacktivity's Web Security and Software Security courses and the Break Escape VM labs, linked from the reference card. The code-review minigame is kept in the `features/minigames.md` catalogue (build status "not built").

## Setting and cast

- **Company:** Stavely Software (`stavely.example`, **proposed for `BRAND_SET.md`**), a UK software firm that builds and runs a booking-and-invoicing portal for its clients (schools, councils and care homes). Room: a new or redressed Stavely training room. Host: the portal team's lead developer.
- **Cast for this module** (diverse by age and background, each needing the pre-ship web-search and surname-clash check; there is no recurring course mentor, the host carries the welcome):
  - **Darius Rahimi**, lead developer and host: pragmatic, allergic to lectures.
  - **Ines Carvalho**, developer: fast, always volunteers for the release; her pull requests are the review material.
  - **Sunil Mehta**, QA lead: methodical; copies production data into test to chase a bug.
  - **A Stavely security analyst** (the escalation contact) and **a Stavely data protection officer** (the test-data adviser). (Remapped from the retired Larkspur Kai Murray and Tomasz Wiśniewski; Stavely staff here, not recurring course cast.)
  - **Stav Assist**, the approved AI coding assistant (a scripted, no-model helper; the friendly robot avatar shared with core_15).
- **Email only:** "Kit Ellery", who claims to co-maintain the open-source PDF library the team uses; a security researcher in the consequence-flip debrief.
- **Fictional names used as examples:** the approved library `papyrus-pdf`; the invented `papyrus-pdf-invoices`; the fork `papyrus-pdf-next`; the look-alike `papyrus-pfd`; the internal package `@stavely/portal-auth` and its public shadow `stavely-portal-auth`. Check every name is unregistered on npm and PyPI before release.

## Structure

### Attack-first episode: the developer inbox

**Brief and scope note.** The host welcomes the learner; it is release week and the messages are stacking up.

**Attack half (unscored, red-flag meter).** OSINT on the open-source library the team uses and a developer's public profile, then compose one message from found facts: a "maintainer takeover" email ("switch to my fork, grant me access") or a recruiter-style lure aimed at a developer. Nothing real is sent; it reaches a fictional developer.

**Flip.** The learner's own message shown from the developer's inbox, its tells named: friendly, urgent, asking for access or a switch; the trust-takeover pattern behind the XZ Utils backdoor.

**Defend half (scored, Verify on, mirror pairs).** A developer inbox to triage, each phish with a close genuine twin:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | "Kit Ellery" asks you to switch to their fork and grant access | A genuine release announcement on the project's official channel | trust takeover, access request | Verify officially; Report |
| 2 | A fake CI or registry notice "your token expired, sign in here" | A genuine CI email that links to the known dashboard | look-alike domain, credential lure | Delete or Report |
| 3 | An OAuth app-consent page asking to read all repositories and act on your behalf (`page` kind) | A genuine, narrowly scoped approved tool | broad consent, unverified publisher | Report; send for review |
| 4 | A recruiter lure with a "coding test" attachment to run locally | A genuine recruiter message with no attachment to run | attachment to run, pressure | Delete or Report |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for developers: *"If you didn't write it, check it. If it's secret, it's not in code. If it's real, it's not in test."* Concept cards on dependencies (check the name and the source) and AI assistants (review and test as a stranger's code). Then the reporting-route box and the no-blame line.

### Consequence-flip episode (R3): secrets, test data and review

No live attacker, so the learner makes the everyday mistakes in a safe sandbox and the flip shows the consequence:

- **The mistakes:** approve Ines's "twelve-line" pull request that logs a password reset token and holds a key; let Stav Assist fill a connection string into the push; use Sunil's production-backup test database full of real residents' names; add the package Stav Assist invented.
- **The flip:** the key alive in every clone and build log; the invented package registered three weeks later with a malicious install script; the test database as a copy of real people in a place with weaker locks; an outside researcher's report that the invoice download lets one school open another's invoices.
- **Debrief cards:** secrets (deleted isn't gone, rotate first, then clean up, then tell security); the four review questions (where does input go, who may see this, what gets logged, any secret or new dependency); synthetic test data; and the disclosure route (thank the researcher, route it, keep them updated).

## Decisions and consequences

Every item pairs a threat with a doable action and never shames the player, nor a teammate under release pressure. Reporting a leaked secret, or real data in test, is always treated as the good outcome.

| Item | Caught by | Learning outcome |
|---|---|---|
| Fake maintainer takeover | Check the official project; don't switch or grant access | LO5, LO2 |
| Fake CI or registry notice | Read the address; use the known dashboard | LO5 |
| Broad OAuth consent | Treat consent as an access request; send for review | LO5 |
| Invented package (flip) | Check the registry; use the approved library; tell security | LO2, LO3 |
| Committed secret (flip) | Rotate first, then clean up, then report | LO1 |
| Real data in test (flip) | Stop, report to the DPO, use the generator | LO6 |
| Risky pull request (flip) | The four review questions; request changes | LO4 |
| Outside vulnerability report (flip) | Thank, route, keep updated | LO6 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of the attack-first episode and the consequence flip (R3) |
| OSINT browser and intel facts | The research stage |
| Mail client in template mode with the red-flag meter and `systems/phish-rules.js` | Compose the one developer-facing message |
| Inbox triage with the `page` kind and the Verify verdict | The developer inbox, with mirror pairs; the OAuth consent and registry pages as `page` items |
| Flip view, debrief view, concept cards | The flip, the debrief and the secrets, dependency and review cards |
| Awareness measurement and the comparison panel | The new developer checks |

No new minigame is built. The MG-19 code review minigame, the pull request view and the MG-16 coding-mode assistant are a later idea in the `features/minigames.md` catalogue (build status "not built"); recognition depth is the technical labs.

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Dependencies: strangers with your keys | Attack-first defend half | LO2 |
| Assistants: a quick junior | Attack-first debrief | LO3 |
| Secrets: deleted isn't gone | Consequence-flip debrief | LO1 |
| The four review questions | Consequence-flip debrief | LO4 |
| Real data in test | Consequence-flip debrief | LO6 |
| The disclosure route | Consequence-flip debrief | LO6 |
| Optional: the OWASP Top 10:2025 | OSINT browser | Context |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built. Depth is the technical labs, linked from the reference card.

## Debrief

Shown on the built debrief view for each episode: per-item reasoning cards; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted); the "On Monday" card; the reporting-route box; the no-blame line. The consequence-flip debrief is framed as release notes: what shipped, what was stopped, and what three weeks later held.

## Variants

- **Defend-only variant:** the attack-first episode as brief, defend, debrief (about 8 minutes), same defend set.
- **Facilitated session:** the `facilitated` flag on the full episode, for a team brown-bag, with pause panels (would we have approved it; how do we check a package; where does our test data come from; what's our real emergency route at half five). The flag hides per-learner scores on the shared screen.
- **Text route:** each message and the consequence-flip changes as accessible text, line markers read out; a gap in the build (BE-03).
- **Spaced practice:** a short defend-only "Diff or Dud?"-style shell drawn from the pool; the developer checks repeated each year.
- **Replay:** package names and messages are drawn from banks and checked against the public registries each edition; the annual edition adds the year's supply chain incidents at awareness level.

## Alternative concepts

1. **Capture the Leak (consequence flip).** A fictional repository's history, build logs and chat exports, with the learner finding and rotating every secret; the flip shows what a copy made before rotation could still do.
2. **Dependency Jenga (consequence flip).** Inspect the portal's dependencies and swap out risky ones; the flip pulls a compromised block and shows what falls.
3. **Red Team Review (attack-first, built shape).** The attack half already shows what a tester looks for; no separate red-team mentor, and no attack input is ever shown.

## Art and audio

- **Rooms:** a new or redressed Stavely training room (room review and POV backgrounds are later in the build).
- **Characters:** Darius Rahimi, Ines Carvalho, Sunil Mehta, the Stavely security analyst and DPO need art and voices; host art is held on PixelLab quota and the user's approval. Stav Assist uses core_15's robot avatar.
- **Voice:** text-to-speech only (no runtime language model; Stav Assist is scripted, authored data). Code, package names and the assistant's suggestions are on-screen text only. No voiced line prints a variable: file names, package names and counts are on screen, so the voice cache stays keyed on exact text.

## Pitfalls

- **Not a secure coding course.** No attack input, no payloads, no step-by-step exploitation. Show the pattern and the fix; the labs teach the rest.
- **No realistic secrets in the scenario files.** Keys in the game's own data use obviously fake formats, or the repository scanners (and anyone copying them) will treat them as real.
- **Check every fictional package name** against the public registries before each release, and never link to a real package.
- **Don't make AI the villain.** Stav Assist is approved and useful; the habit is checking, not avoiding it.
- **Don't shame teammates.** Ines and Sunil take shortcuts under pressure and are thanked when the shortcuts are caught; reporting is never penalised.
- **Accessible content.** Line markers read aloud, colour never the only marker, keyboard navigation.
- **No speed scoring.** The release is a story deadline; it can't be failed, and ratings never depend on how fast someone reads.
