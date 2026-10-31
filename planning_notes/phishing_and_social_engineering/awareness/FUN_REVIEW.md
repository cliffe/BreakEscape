# Awareness episodes E1–E7: fun and learning review

Reviewer brief: judge the seven awareness episodes (`scenarios/awareness_e*`) and the episode runner
(`public/break_escape/js/minigames/episode-runner/`) as a product for office staff in a short session.
Review only; no code or data was changed. Target shape unchanged: browser-only, no runtime LLMs, an
episode of about 8–13 minutes.

What I read: design doc 11, the runner (`episode-runner-minigame.js`, `flip-view.js`, `debrief-view.js`,
`step-strip.js`, `role-swap.js`, `episode-model.js`), E1's full scenario, the defend sets and
`awarenessEpisode` blocks of E2–E7, and the per-role pre/post check sets.

## Verdict in one paragraph

The defend beat is good: clear, kind, well-written, and the "genuine change-of-bank, confirmed by
phone" item (E1 `e1_bank_confirmed`, `scenarios/awareness_e1_invoice_fraud/scenario.json.erb:225`) is
the kind of thing people actually remember. Variety across the seven is real on the *defence* side:
email triage, attachment handling, a helpdesk role swap with an MFA-push stream, sign-in page
inspection, a phone shell with QR and SMS, voicemails. The per-role pre/post sets test the channel each
role's episode teaches, which most products in this category get wrong and this one gets right. The
weak point is the attack beat. For five of the seven episodes it is a pretext picker with one blank to
fill, and that undercuts the one thing meant to set this product apart: the moment you see your own
message fool someone. The swap lands hardest in E3 (a live call) and E5 (you build the page); it is
thinnest in E6 and E7, where the "message" was barely yours. The debrief's most useful line, the
concrete "here is how we report," is designed as a customer slot and then never rendered. And the
headline score cannot tell a careful triager apart from someone who reports everything, which is a
problem for a product whose selling point is measurement.

## The swap moment

The flip replays the learner's artefact with its tells highlighted and a line saying the defender was
fooled by it (`flip-view.js:68`; E1's `flipDefenderLine`,
`scenarios/awareness_e1_invoice_fraud/scenario.json.erb:298`). Mechanically it works and the writing is
strong. The feeling only lands if the learner felt authorship. In E1/E2/E4/E6/E7 the write stage is
"pick a pretext, fill a blank" (E1 `templateSets`, scenario `:619`; `primedFor` `:636`), so the message
is mostly pre-written and the flip is closer to "look at this message" than "look at *your* message."
E3 (a real pretext call, `attack.callId`) and E5 (`landing-page-builder`) are the two where the swap
genuinely bites. This is the single biggest fun-and-learning lever in the product.

## Variety

Structurally varied on defence and fairly uniform on attack. Every attack beat except E3 and E5 is a
template with one or two blanks, so played back to back the first halves of E1, E2, E4, E6 and E7 feel
alike. The defend halves do not, because the surfaces differ (calls, pages, phone, voicemail). A staff
member doing the first-slice set (E1, E5, E3 per design A2) gets good variety; a staff member doing
E1, E2, E4 in a row gets three near-identical openings.

## Difficulty

Pitched low and flat, which is right for the audience but leaves little tension. Immediate feedback, a
closed chip list (`glossary: "closed"`), an always-visible Report, 5–8 items at ~40–66% phish. The only
real curveballs are the "looks like a phish, is genuine, verified correctly" items, and those are the
best teaching in the whole product. There is no ramp across a session and no near-miss beat. The bigger
issue is that Report scores 60 whether the item is phish or genuine (doc 4.1), so "report everything"
is close to a dominant strategy and the headline cannot see it (see change 3).

## Debrief and the Monday card

The per-episode Monday cards are concrete and role-specific, which is the right instinct
(E1 `strings.mondayCard`, scenario `:302`). Two gaps hurt recall. First, the one line that would
actually survive to Monday, the organisation's real reporting route, is designed as a slot
(`debrief.mondayCard: "slot:customer_report_route"`, scenario `:306`) that the debrief view never reads:
it renders `strings.mondayCard` instead (`debrief-view.js:161`). So every learner is told to report "the
way your organisation asks you to" and never told what that is. Second, a learner doing three episodes
gets three different Monday cards and no single carried rule, so nothing is reinforced across the
session.

## Do the pre/post checks measure what the episodes teach?

Mostly yes, and better than expected. Each role's pre/post form carries the channel its episode teaches:
finance is email (`pre_finance_ab`), general is `page` ×3 (E5), mobile is `qr`+`sms` (E6), executive is
`voicemail`+`pdf` (E4), helpdesk is `call`+`push`+`voicemail` (E3). The finance form's phish flags
(`senderTrust`, `lookalike_domain`, `changed_bank_details`, `secrecy_or_bypass`) match what E1 teaches.
Two holes: (a) in a multi-episode session only the learner's primary role is measured, so two of three
episodes' learning is invisible (doc 5.2 concedes this but product copy should be explicit); (b) the
headline `percent`/`reportRate` cannot distinguish skill from blanket-reporting, so a pre/post gain can
be a shift to reporting everything rather than better discrimination.

---

## Changes, ranked by value

### 1. Render the "how we report here" slot in the debrief
The actionable, memorable line is the organisation's real reporting route, and it is currently dead
code. `debrief.mondayCard` holds `slot:customer_report_route`
(`scenarios/awareness_e1_invoice_fraud/scenario.json.erb:306`) but the debrief reads `strings.mondayCard`
and ignores the slot (`public/break_escape/js/minigames/episode-runner/debrief-view.js:161`). Resolve the
slot from a customer-filled string table and render it as its own line under the Monday card, falling
back to the generic text when unset.
- **Cost:** engine (small, a resolver in `debrief-view.js` and a lookup the runner passes through) plus
  data (the customer string).
- **Risk:** low. Pure addition; the generic fallback keeps existing shells working.
- **Where:** `debrief-view.js:161` (reads `mondayCard`); slot value at each episode's
  `awarenessEpisode.debrief.mondayCard`.

### 2. Give the template attack one consequential choice, and make the flip name it
Protect the product's thesis. In the five template episodes, the learner picks a pretext and fills a
blank, so the flip plays back a message they barely wrote. Add one choice that changes the artefact and
is quoted back in the flip, for example which fact to exploit (the open invoice vs the quarter-end rush)
or which pressure lever to pull, so the defender line reads "the invoice number *you chose* is real, so
changing the payee looked like the job in front of her."
- **Cost:** data for a light version (a second meaningful `templateSets` branch plus a
  choice-aware `flipDefenderLine`); generator if the flip line must vary continuously by choice.
- **Risk:** medium. More authoring per episode, and it must stay inside the one-send cap
  (`maxSends: 1`) so it does not become a phishing workshop.
- **Where:** E1 `templateSets`/`primedFor` (scenario `:619`–`:645`); flip line `strings.flipDefenderLine`
  (scenario `:298`); the flip already renders `truth.flags`, `flip-view.js:85`.

### 3. Record a discrimination figure, so measurement cannot be gamed by over-reporting
Report scores 60 on phish and on genuine mail (doc 4.1), so the headline rewards blanket-reporting and a
pre/post gain may be false-positive-driven. Keep the no-blame stance in the game, but compute and store a
specificity figure (genuine items correctly Trusted or Verified, not Reported) alongside `percent` and
`reportRate`, for the later organiser view, and show the learner their own "you spotted the safe ones too"
line gently in the debrief summary.
- **Cost:** data plus engine. `awareness-measure.js` already records every verdict; add a derived stat
  there and one summary line in the debrief.
- **Risk:** medium. Must land as information, never blame; the debrief's no-blame rule governs the wording.
- **Where:** summary built at `debrief-view.js:142`–`:149` (shows `reportRate` only);
  records in `systems/awareness-measure.js`.

### 4. Carry one rule of thumb across every debrief in a session
A learner doing three episodes meets three different Monday cards and no repeated spine. Add one short
line that is identical in every episode's debrief ("Stop. Check on a route you already hold. Report."),
above the episode-specific card, so the session reinforces one habit.
- **Cost:** data (one shared string), plus a tiny engine touch if it is to be a session-end card rather
  than a per-debrief line.
- **Risk:** low.
- **Where:** debrief render, before the Monday aside (`debrief-view.js:161`–`:163`).

### 5. Guarantee each episode has one phish-shaped-genuine and one genuine-shaped-phish
The "genuine, verified by phone" items are the best teaching in the product (E1 `e1_bank_confirmed`,
scenario `:225`). The matching trap, a phish that mimics an approved internal process, is the other half.
Audit each defend set for exactly one of each so the learner cannot win on "unusual = phish," which is the
habit that makes real staff report their own payroll team.
- **Cost:** data (a content audit and, where missing, one authored item per set).
- **Risk:** low. Content only; watch the phish/genuine ratio the design states per episode.
- **Where:** each episode's `triageSets[0].messages`.

### 6. Add a running "team protected" tally and confirm the report sting fires
The defend beat is static per-item triage. A small non-competitive tally ("you kept the team safe on 4
of 5") raises engagement without a leaderboard, which the design forbids. The runner passes
`skin: 'awareness'` to the triage starter (`episode-runner-minigame.js:616`), which is meant to give the
Report a positive animation (doc 8); confirm that sting actually fires, as it is the product's one
reward moment.
- **Cost:** data/engine, small.
- **Risk:** low. Keep it per-learner and private (no ranking, doc 4.3).
- **Where:** triage skin `episode-runner-minigame.js:616`; debrief summary `debrief-view.js:142`.

### 7. For E6 and E7, prefer the defend-only variant unless the attack earns the flip
The swap is weakest exactly where the channel is most novel: the E6 (QR/SMS) and E7 (voicemail) attack
beats are a channel/pretext pick, and the flip falls back to the generic "nothing to replay"
(`flip-view.js:169`–`:174`). The defend-only variant already exists (doc 3.1) and keeps the measurement.
Ship E6/E7 defend-only by default and reserve the full attack beat for the episodes where authorship is
real (E1, E3, E5).
- **Cost:** data/config (`variant: "defendOnly"` on those shells).
- **Risk:** low. Loses the empathy beat for those two, which is already thin there.
- **Where:** `awarenessEpisode.variant` and `stages` in the E6/E7 shells.

### 8. Make the cross-role measurement gap explicit in copy, or add a mixed form
The first-slice session (E1, E5, E3) measures only the learner's primary role, so two of three episodes'
learning is unmeasured. Either state this plainly in organiser copy, or author one mixed "general" pre/post
form that samples all three channels for multi-episode sessions.
- **Cost:** doc/copy for the honest version; data (one mixed `05` form pair) for the fuller fix.
- **Risk:** low. The mixed form must stay matched on difficulty and flag mix (doc 5.2).
- **Where:** per-role check shells under `scenarios/awareness_{pre,post}_*`.

## What is already good (keep)

- The E3 role swap and E5 page builder are genuinely different interactions and carry the swap moment.
- Per-role pre/post channel alignment (page/qr/sms/voicemail/call) is a real strength.
- The no-blame copy is consistent and well-judged, and the Verify verdict is a smart third option that
  gives the unsure learner a safe, non-punished move.
- The "genuine, correctly verified" items teach discrimination, not just suspicion.
