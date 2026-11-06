# Engine batch 5 review (merge `05c645cbd`)

Read-only review of `git diff 4fa34a222 05c645cbd -- public/ scripts/ test/` (33 files).
Judged on the code, not the commit messages. Full social JS suite run: 2080 pass, 0 fail.

## Counts

- Blockers: 0
- Majors: 1
- Minors: 3

## Blockers

None.

## Majors

- **M1 — verdict-points override has no "phish vs real" guard; raising Trust/Comply for a kind
  also rewards trusting a phish of that kind, and the review card then shows a green "right" verdict
  on an item the scoring still treats as an uncaught/critical phish.**
  `public/break_escape/js/minigames/inbox-triage/triage-scoring.js:95-114` (`verdictPointsOverride`,
  `verdictPoints`), interacting with `isCriticalMiss` at `:139-143` and the trusted-phish band cap at
  `scoreTriage` `:371-387`; validator at `scripts/validate_social/triage.rb:653-672`
  (`verdict_points_checks`) only range-checks 0..60.

  `set.scoring.kindPoints[kind]` and `truth.verdictPoints` are applied in `verdictPoints` regardless
  of the item's `isPhish`. `kindPoints` is keyed by kind only, so there is no way to say "Comply is
  full marks for a *genuine* caller": `scoring.kindPoints.call.trust = 60` (the documented reception
  desk / visitor-queue use) also makes complying with a *vishing* call of the same kind score the
  full 60. For a phish call that is still a critical miss (`CRITICAL_KINDS` includes `call`), still
  not counted in `phishCaught`, and still caps the band, so the learner is penalised while
  `_isRight`/`_verdictTone` paint the review card green with a "You chose Comply" line and no
  `_rightCallLine`. Contradictory feedback, and the validator raises nothing.

  Concrete: a visitor/call set with both an expected client and a vishing impostor, authored
  `scoring.kindPoints.call.trust = 60` so letting the expected client in is full marks. Complying
  with the impostor now also shows 60/green on the card, yet the round is still marked a critical
  miss and the top band is withheld. No validator error.

  Not yet triggered by any shipped episode: a grep of `scenarios/awareness_*` shows no set uses
  `scoring` / `kindPoints` / `truth.verdictPoints` (only `phishCaughtLabel` is used, in
  `e17_acceptable_use_defend`). So this is a latent authoring footgun, not a live regression — the
  defaults path is unchanged (`override` is `null` when nothing is authored, scoring byte-for-byte as
  before).

  Suggested fix (smallest): in `verdict_points_checks`, warn when a `trust`-family full-marks value
  is set for a kind/item that can carry a phish — i.e. warn on `truth.verdictPoints.trust >= 60` when
  `truth.isPhish`, and warn on `scoring.kindPoints.<kind>.trust >= 60` when any message of that kind
  is a phish. Better long-term: let the override express `{ phish?: {...}, real?: {...} }` (as
  `verdictFeedback` already does) so an author can reward Trust only on genuine items; then
  `verdictPointsOverride` selects by `isPhish`.

## Minors

- **m1 — pretext debrief modal has no focus trap and no Escape handler of its own; keyboard events
  still reach the chat behind it.** `public/break_escape/js/minigames/person-chat/person-chat-pretext.js:499-516`.
  The new backdrop is a visual overlay only. Tab can leave the panel and land on End Conversation /
  the live bar behind it (the very thing the backdrop was added to hide), and the chat's global
  `keydown` handler (`person-chat-minigame.js:298`) still fires while the modal is up. Dismiss-on-Esc
  is handled indirectly via the `complete` override (`person-chat-pretext.js:640`), which is fine, but
  there is no focus containment. Suggested fix: trap Tab within the backdrop while it is mounted and
  restore focus to the opener on Done; optionally stop propagation of keydown on the backdrop.

- **m2 — backdrop coverage depends on `minigame.container` being a positioned ancestor.**
  `person-chat-pretext.js:509-512` sets `.pretext-debrief-backdrop { position:absolute; inset:0 }`
  (`css/pretext-prep-minigame.css:238-249`) and appends it to `minigame.container ||
  minigame.messageContainer`. If that element is `position:static`, `inset:0` resolves against a
  different positioned ancestor and the "covers the chat" guarantee does not hold. Not reproducible
  headless here; worth a one-time in-browser check that the backdrop actually covers the open chat on
  both the neutral awareness chat and the dark lab chat. (The CSS file itself is loaded globally via
  `show.html.erb`, so the styles are present wherever this renders — that part is fine.)

- **m3 — in immediate mode the report verdict line gets `aw-report-thanks`, whose
  `color: var(--aw-accent)` overrides the tone colour on `.tri-card-verdict`.**
  `inbox-triage-minigame.js:631-635`; `css/awareness-skin.css:162-164`. A reported phish's single
  confirmation line now renders in the accent colour rather than the success/neutral tone colour it
  would otherwise carry. Cosmetic only; flag only if the tone colour on that line is intended.

## What was checked and is sound (defaults / regressions)

- **Defaults opt-in, output unchanged when keys absent** — verified for every new key:
  `verdictPointsOverride` returns `null` with nothing authored (scoring identical);
  `verdictFeedbackOverride` returns `null` so all feedback lines fall to their defaults; `labels.next`
  defaults to `Next ${item[0]}`, which is `Next message` for an email/email-mixed set (unchanged);
  `labels.itemNoun` only applies when present; `resultCopy.noFlagsLead` defaults to the exact prior
  sentence; debrief `phishCaughtLabel` defaults to `Phish caught`; `sentResultLine` returns the prior
  banner text when no override.
- **skillName precedence change (F-E9) is a no-op for every shipped episode.** Extracted the keys of
  every `skillNames` block in `scenarios/awareness_*/scenario.json.erb`: all are scenario-local tell
  ids (`found_media`, `lookalike_network`, `mfa_number_relay`, …). None collide with a built-in
  `SKILL_NAMES` id, so "set override wins" renames nothing that was not already being rendered from the
  set. No unintended rename.
- **Immediate-mode confirmation change (F-E19-3).** `_scrollToFeedback` falls back to
  `.tri-card-verdict` (`:833`); `getTestState` reads `reportThanks`/`reportWin` by class, both of which
  are now on the card verdict line (`:1602-1603`); post-lock focus targets `.tri-card-title` then
  `.tri-next`, both present on the immediate card; end mode keeps the `.tri-locked` line and its thanks
  paragraph; `_announce(_lockedLine(...))` still fires for screen readers. Report-win pop still fires
  (`.aw-report-win` is a generic animation rule). No stale dependency on `.tri-locked` left broken.
- **Debrief verdict word (F-E10-2).** `actionById('email', action, verdict, labels).label` returns
  `Trust/Report/Delete/Verify` for a default email set (matches the removed `VERDICT_WORD`), so the
  debrief word is byte-identical without `labels.verdict`.
- **HTML injection.** `_addressy`, `appendWithAddresses`, `isAddressValue` build only text nodes
  (`document.createTextNode`) and spans set via the `el`/`h` helpers, which assign `textContent`.
  No `innerHTML`. The address regex has no nested quantifiers (no catastrophic backtracking);
  `appendWithAddresses`/`isAddressValue` reset the shared `ADDRESS_RE.lastIndex` before use.
- **Schema/validator.** New keys (`scoring.kindPoints`, `truth.verdictPoints`, `labels.verdictFeedback`,
  `labels.itemNoun`, `labels.next`, `resultCopy.noFlagsLead`, `replies.byChoice[].sentLine`,
  `sentLines`) all carry `additionalProperties:false` with `^_` pattern escapes; the validator's
  `known` labels list and the new `scoring_checks` / `verdict_points_checks` / `verdictFeedback`
  checks match the shapes the code accepts. (`sentLines`/`sentLine` have no dedicated Ruby content
  check, but the schema gates them and an empty string degrades safely to the default banner via
  `isStr`.)

## Verdict

**Accept with fixes.** The merge is default-safe and the full social suite passes; the immediate-mode
refactor, skillName precedence, address helpers and modal all hold up. The one substantive issue (M1)
is a latent validator gap in the opt-in verdict-points override, not a live regression — no shipped
episode exercises it. Land the batch; add the M1 validator guard before any set authors `scoring` /
`truth.verdictPoints`. No commit in the range needs reverting.
