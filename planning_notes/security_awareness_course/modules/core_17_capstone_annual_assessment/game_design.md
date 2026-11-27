> **For the build, this design is superseded by `../../implementation/11_WP12_FIRST_PLAY_AND_ANNUAL.md (Part B)`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_17 game design: Year End

## Concept

The capstone is an **annual mixed edition built from the built shells**. It brackets a mixed run of the year's defend sets with a before-and-after check, so each learner meets the year's threats across channels and companies in one sitting, and sees the change from their own baseline. The frame is the built one: a training room, a kiosk, and a neutral proctor who gives a short "what changed this year" brief and the debrief. The run is the built inbox-triage defender, so the measurement is the same measurement the learner has met all year.

Everything here is assembled from pieces that already exist: the seven episodes' defend sets and their defend-only variants, the six roles' pre and post check forms (AB and BA), the debrief view and the awareness-measure store. The only new work for the mixed edition is the edition definition (which defend sets, in which order) and the yearly brief.

The richer "one busy day" narrative, the cross-item chains, the private year profile and spotlights, and the team event are kept below as **proposed, later** extensions. They do not block the mixed edition, which ships first.

## Setting and cast

- **Room:** a training room, dressed neutrally (the edition draws on several companies' defend sets, so it is not tied to one brand). The kiosk runs the edition through the episode runner.
- **Host:** a neutral proctor, Graham Whitfield by default (an existing check-mission host), who welcomes the learner, gives the brief, and carries the event mapping that completes the shell once the result has synced.
- **No single company:** the mixed run meets Brightwell, Tarrowby, Quayholt and Merrin & Sallow through their built defend sets, so the learner sees the year's channels (email, call, voicemail, push, page, SMS, QR) and brands.

Larkspur and its cast (Ama, Kai, Maureen, Martin, Leo, Hassan, Tomasz, Owain, Precious, Kev, Jo Fairweather, Lena, Gillian, Ellie, Peter, Ade) are retired. The teaching moves into the brief, the per-item feedback and the debrief. The authorised-test reveal is replaced by the built scope note (an openly authorised exercise), so there is no hidden-test reveal.

## Structure

The checks are separate missions that bracket the run; the run is scored under the `awareness` profile; there is no default pass mark.

### Pre-check (separate mission, 4 to 5 minutes)

The check itself now takes about 9 minutes.

The learner's role pre-check form (A or B, per the AB/BA pairing). It exports the baseline the post-check will import.

### Brief: what changed this year (3 minutes)

The proctor gives a short "year in three changes" brief, rewritten and re-checked each year from that year's threat picture (see `concepts.md`). The organisation's own "what changed here" lines appear on screen. The spoken lines are generic; any figures are on screen only.

### Mixed run (10 to 15 minutes)

A selection of the year's defend sets, mixed across channels and companies, each run as the built inbox-triage defender:

- examples for the 2027 edition: the invoice-fraud set (E1, Brightwell), the help-desk and MFA set (E3, Quayholt), the texts-and-QR set (E6, Tarrowby), the cloned-voice set (E7, Brightwell) and the sign-in-pages set (E5, Quayholt);
- each is the built defend set, with Report always visible and Verify where the set uses it;
- the run is the defend halves only (the attack beats are not repeated), so it reads as a mixed inbox of the year's threats.

### Debrief (3 to 4 minutes)

The built debrief view, across the run:

1. A per-item reasoning card for each item.
2. Feedback on the genuine items.
3. The **team protected** tally.
4. **The habit to keep:** *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."* (The debrief adds the plain line: *"Break the chain at the first link."*)
5. The **"On Monday"** card.
6. The reporting route (`slot:customer_report_route`).
7. The no-blame line.

### Post-check (separate mission, 4 to 5 minutes)

The check itself now takes about 9 minutes.

The paired role post-check form. It imports the newest pre-check result and shows the change; it shows "no baseline" if the pre-check was not concluded. There is no pass mark.

## Decisions and consequences

Each defend item is the built `awareness` scoring: 60 for the verdict, 40 for naming the real flags, and reporting is never penalised, so the Report verdict is also the "I'm not sure" path. The debrief's per-item reasoning explains each. No item shames the learner; a late report in a chain-flavoured item is still credited as the right move. The decisions are the built verdicts (Trust, Report, Delete, and Verify where the set uses it) on the items the edition draws in; the module adds no scoring of its own.

## Minigames

| System | Status | Use here |
|---|---|---|
| Episode defend sets (E1 to E7, and defend-only variants) | built | The mixed run |
| Pre and post check forms (six roles, AB and BA) | built | The bracketing missions and the before-and-after |
| Inbox triage (`awareness` profile) | built | Every item in the run |
| Debrief view | built | The per-item reasoning, tally, habit, Monday card, route and no-blame line |
| Awareness-measure records | built | Per-item id, verdict, chips, score, stage and time |
| Edition definition | new (small) | Which defend sets, in which order |
| "What changed this year" brief | new (content) | The yearly three changes |

## Explainers

- The **"what changed this year"** brief: three changes, each one aid, rewritten each year.
- The **debrief** per-item reasoning and the "where to report here" box.

No video. No runtime language model. The brief and the feedback are authored data or ink.

## Debrief

The built episode debrief, as set out under "Structure" above: a reasoning card per item, feedback on the genuine items, the "team protected" tally, the habit to keep, the "On Monday" card, the customer's reporting route and the no-blame line.

## Variants

- **Shorter run:** fewer defend sets, for a lighter annual touch. The checks still bracket it.
- **Role editions:** the mix favours the channels a role meets, and the checks are that role's forms.
- **Facilitated session:** the `facilitated` flag; the team discusses each item before the shared screen reveals it, and each learner takes the checks individually so the measurement stays per-learner.
- **Replay and editions:** each edition changes at least half of the defend sets it draws on, keeps the before-and-after checks, and rewrites the brief from that year's sources. Domains and names are re-checked. No real organisation's incident becomes a plot within a year of it happening, and then only with fictional names.

Example editions:

| Edition | The mix |
|---|---|
| 2027, Year End | Invoice fraud (E1), help-desk and MFA (E3), texts and QR (E6), cloned voice (E7), sign-in pages (E5); the year's three changes |
| 2028 (proposal) | A different mix favouring that year's threats, plus any new episodes built by then |

## Proposed, later extensions

These build on the mixed edition and are not part of the first build:

- **A single-day narrative** ("one busy last day", a new starter shadowing the learner) that threads the defend items through ordinary work. It needs new narrative features (a work task bar, time skips) and new cast art.
- **A chain view** in the debrief that links related items and marks where a report broke a chain.
- **A private year profile and spotlights:** a per-learner view of results by area, with last year's beside them, and up to two private practice recommendations. It depends on reading back the awareness-measure records, which the build does not yet do.
- **A team event** ("Year End Live"): tables play the same edition, decisions are table votes, reporting is literally how you leave an escape-room layer, and teams (never people) are ranked. It needs a facilitator console and the team-play surfaces.

Each is a worthwhile later build; none is needed for the capstone to run as a measured annual assessment.

## Alternative concepts

None beyond the variants above.

## Art and audio

- **Room:** a neutrally dressed training room; no new room for the mixed edition.
- **Characters:** the proctor needs host art (CSS wordmark and placeholder sprites until PixelLab art is approved); the defend sets reuse the companies' existing cast art.
- **Voice:** text to speech for the brief and the debrief. No voiced line prints a variable: the year's figures, the organisation's lines and any counts are on screen only.

## Pitfalls

- **A gotcha festival.** A mixed run of threats can feel like a trap. Keep the genuine items in (every built defend set includes them), so the lesson is not "everything is an attack".
- **Unfair to people who missed a module.** Every item can be handled with the habit; the debrief names the module that covers it.
- **Punishing an early slip.** Reporting is never penalised, and a late report in a chain-flavoured item is credited.
- **Stale editions.** A capstone that still warns about last year's scam teaches the wrong thing. Edition rules and release notes keep it current.
- **Overbuilding.** The single-day narrative, chains, profile and team event are proposed extensions; the mixed edition built from existing shells is the thing that ships first and already meets the annual-assessment requirement.
- **No default pass mark.** The checks author `passPercent` 0; a pass mark is an organisation option on the post-check percent, not a default.
