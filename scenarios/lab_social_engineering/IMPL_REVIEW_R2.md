# Implementation review R2: lab fix round L (commit 343561b5)

Scope: commit `343561b5` reviewed against `scenarios/lab_social_engineering/playtests/FIX_ROUND_L.md`.
Read-only review. No files changed, nothing committed.

Checks requested: each fix correct; no fix games the playtest or breaks m01-m10 / the test slice;
the ink tunnels in `ruth.ink` and the stage guards in `ruth_phone.ink` cannot loop or double-give;
the pretext-judge anti-farm and the influence-reset decision are sound for teaching; the M2
`fillVars` placement covers the fresh first-call path.

## Verdict

No blockers. Two minor correctness/teaching notes and three documentation-accuracy notes. The four
blockers (B1-B4) and four majors (M1-M4) are implemented correctly. Gates reproduced green:

- `node --test` on `social-lab-ruth-keys`, `social-pretext-session`, `social-pretext-prep`,
  `validator-landing-pages`: 54/54 pass.
- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --no-graph
  --skip-ink --strict-social`: exit 0 (suggestions/recommended-field warnings only, no errors).
- `inklecate` recompile of `ruth.ink`, `ruth_phone.ink`, `dev_service_desk.ink`, `tomasz.ink`:
  no errors; each committed `.json` matches a fresh compile (jq-canonical compare). No stale compile.

## Blockers

None.

## Majors

None.

## Minors

### m-1 (teaching / dead config): the fresh-call influence reset overrides the report lockout's `recoverTo`

`public/break_escape/js/minigames/person-chat/person-chat-pretext.js:520-535` resets a non-resuming
call to `cfg.start`. For Dev, `start = -10` (`scenario.json.erb:265`). The report threshold at
`dev_influence <= -70` fires a `lockout` with `recoverTo: -30` (`scenario.json.erb:276`). On
lockout lift the service writes -30, but the next call then resets to -10. So `recoverTo: -30` is
immediately overwritten and never has any effect on the player's starting position for the call-back.

Why it matters: the config now says one thing (a reported call-back starts worse, at -30) while the
code does another (every call-back starts at -10, the same as the first). This is consistent with the
logged decision ("the lesson stays with the report + channel lockout, not a worse starting
influence"), so it is not a bug in behaviour; it is a stale/contradictory config that will mislead a
later editor. Recommend either dropping `recoverTo` from the report threshold, or flooring the reset
at the character's current value when a lockout recovery is in effect, and noting which in the log.

Soundness for teaching: the decision itself is sound. The persistent consequence of pushing too hard
survives the reset — `dev_reported`/`pretext_call_reported` stay set and surface in the engagement
report ("The contact reported the attempt.") and in Tomasz's debrief — so the lesson lands even
though influence starts fresh. The lockout (`afterMinutes: 2`) and the advancing hint ladder
(`pretext_<callId>_reports`) gate the retry. The only soft spot is that 2 in-game minutes is a weak
barrier if the lab clock runs fast, but that is pre-existing and not introduced by this round.

### m-2 (correctness, low risk): B2 pin re-spread is correct, but the key-match mechanism is not what the log/comment describes

The separation is genuinely fixed. The real key-vs-lock gate is
`public/break_escape/js/minigames/lockpicking/key-operations.js:189`:
`Math.abs(selectedCuts[i] - correctCuts[i]) > 5` over cut depths, where
`cut = clamp(round(pin - 20), 0, 110)` (`utils/key-cut-calculator.js:28-52`). The new pins give
cuts: recon `[0,4,16,28]`, operations `[30,0,26,0]`, blue_team `[28,54,16,34] -> [8,34,0,14]`. Every
cross pair differs by more than 5 at position 0 (30, 8, 22), so no key opens another door; each key
still matches its own door exactly (diff 0). Verified by hand; also robust on raw pins.

Why flagged: the build-log entry and the ink/scenario reasoning attribute the gate to
"pin-management.js threshold 8". `pin-management.js:683` (`> 8`) is an unrelated over-pick check
inside the manual lockpick, not the key-acceptance test. A future pin edit that trusts "diff > 8 on
raw pins" instead of the true "cut-diff > 5 on clamped cuts" could reintroduce a collision (note the
clamping: all pins <= 20 collapse to cut 0). Recommend correcting the log/commit note to cite
`key-operations.js:189` and the clamp. Pin values 50/54 are within range (shipped missions use up to
75), so solvability is unaffected.

### m-3 (documentation): minors left unaddressed are logged, but the harness items are not called out as deferred

`FIX_ROUND_L.md` lists a "Harness (tools/playtest/se)" block (`clickControl "Send"` substring match,
`lock` picks the first key, `bootstrap` cannot leave Ruth's opening chat). The commit touches no
`tools/playtest/se` file (confirmed in `git show --stat`), and the build-log "Minors left" section
does not mention them. They appear simply deferred. Not a code problem; worth an explicit line in the
log so the orchestrator knows the harness is still as reported.

## Point-by-point confirmation

### B1 - Ruth keys on reopen (ruth.ink) - correct, no loop, no double-give

- `hub` (`ruth.ink:154-156`) runs `-> recheck ->` then `-> keys ->` as tunnels; both knots end in
  `->->` (`:134`, `:152`). `start` and `brief_close` now divert to `hub` (`:55`, `:70`); the old
  `resume` knot is gone and nothing references it. Compiles clean.
- Idempotent: each `#give_item` is guarded by its own once-flag
  (`recon_key_given`/`operations_key_given`/`blue_team_key_given`, `:137-151`), which are ink-local
  VARs saved in story state, so they survive a reload. `#complete_task` re-issue is harmless.
- No loop: the two tunnels return rather than divert; choices loop back to `hub`, which re-runs the
  (idempotent) tunnels. No ping-pong.
- Resume model holds: a reopen re-navigates to the knot owning the saved choices (`hub`), re-running
  the tunnels — matches `phone-chat-minigame.js` reopen path and the committed test. The Node test
  `test/js/social-lab-ruth-keys.test.mjs` drives fresh-open + two reopens per key and asserts each key
  is given exactly once and never re-given after a `ToJson`/`LoadJson` round trip. Passes.

### B2 - key/lock pin separation (scenario.json.erb) - correct (see m-2 for the doc note)

Item `keyPins` and the matching room-door `keyPins` are updated in lockstep (`:1232-1239`, `:1339`,
`:1364`, `:1421`). Separation verified under the true cut-diff tolerance.

### B3 - payroll_login pretext + validator - correct

- `scenario.json.erb:986-990` adds `pretext {brandId: ledgerwell, purposeId: payslip, facts:
  [lord_portal_name, lord_payslip_date]}`, plus `fields`/`extraSensitiveFields`. `brandId`/`purposeId`
  resolve on the page (validator would error otherwise; it passes). The lab uses full intel ids
  (`lord_portal_name`, `lord_payslip_date`), which the builder prefixes with `se_intel_` — not the
  slice's bare `portal_name`/`payslip_date`. Consistent with the lab's facts.
- `scripts/validate_social/landing.rb:169-200` (`pretext_block`) errors under `--strict-social` on a
  missing `pretext`, an unknown `brandId`, or an unknown `purposeId`; `facts` shape-checked. Wired in
  at `:159`. Fixture `test/js/fixtures/social_landing/lp_clean.json` gained a `pretext`; the three new
  cases in `validator-landing-pages.test.mjs` pass.

### B4 - ruth_phone stage guards - correct, no loop

Each `stageN` opens with `{ <completion-condition>: -> hub }` (`ruth_phone.ink:58,75,95,112,129,150,
167,184`). The guard condition is the exact complement of the `hub` selector for that stage
(checked all eight), so `hub -> stageN` and `stageN -> hub` are mutually exclusive: a stage only
diverts to `hub` once done, and `hub` only routes to a stage while it is not done. Globals are
monotonic, so no ping-pong. The in-person "collect the key" rungs were softened to plain pointers to
Ruth (`:87,96,113`), appropriate now B1 hands keys over on reopen.

### M1 - end screen - correct

`scenario.json.erb:122-129` adds `conclusionScreen {type: end_screen, outcome: success, ...}` on the
`defend` aim (which has `missionConclusion: true`). Shape matches the generic end-screen overlay.

### M2 - fillVars covers the fresh first-call path - correct

- `continueStory()` (`phone-chat-minigame.js:625-633`) calls `this._pretext?.fillVars?.()` at the top,
  before the continue loop that bakes the opening choices. The fresh first call reaches the choices
  through `continueStory()` (the non-restored `else` branch, `:567`), and that branch also fills at
  `:549` before `goToKnot`. So the card VARs are written before the first choice is interpolated and
  before the first line is committed to history. `fillVars` is idempotent, so the re-assert is safe.
- `fillPretextVars` (`person-chat-pretext.js:400-409`) writes `pretext_<fact>_name/_value` from
  `session.blanks` (set from `params.blanks` at attach, `:520`); `fillVars` is exposed at `:566`.
- No m01-m10 impact: `_pretext` is only set when `params.pretextCallId` is present (`:450`); for an
  ordinary phone chat it is null and both new calls are optional-chained no-ops. `showCurrentChoices`
  re-assert (`:585`) is a display-time safety and does not rebuild already-baked choices.

### M3 - pretext anti-farm + verification bypass + influence reset - correct, not a check bypass

- Anti-farm (`pretext-judge.js:224,282-287`): `session.provenFacts` tracks facts whose claim matched
  this call; a re-claim of a proven fact gets `credit = 0` and does not add to `matchCreditUsed`. A
  newly matched fact is returned in `proven` and merged in
  `applyUtteranceChanges` (`person-chat-pretext.js:91`). Persisted in `toJSON`/`fromJSON` (`:126`,
  `:146`). Repeating `open_buddy` now nets 0 (test updated and passing). Not gaming: only a correctly
  matched claim becomes proven, so this removes farming without planting credit.
- Verification bypass (`pretext-judge.js:345-351`): an ask is `verified` if its verification facts are
  all in `provenFacts`. This is the reported L4 fix — giving Sofia's name as the opener satisfies
  Dev's name-check, so the `payslip_date` ask no longer returns `pending` and dead-ends. Not a bypass:
  a fact is only proven by a claim matching the known value, which is the same check the ask would
  have run. A wrong opener does not prove the fact, so the ask still pends.
- Influence reset: sound decision for teaching; see m-1 for the stale `recoverTo`.
- Tomasz debrief (`tomasz.ink:74-80`): the "no fuss" line is now gated on
  `pretext_service_desk_call_lowest >= -10`, with a "you had to lean on Dev" variant otherwise. New
  VAR declared (`:19`). Reads correctly.

### M4 - Hampshire CV red flag - plausibly correct

`ask_review_cv` urgency lowered `medium -> low` (`scenario.json.erb:430`) to match Hampshire's
advisory ceiling, which the log says drove the "feels rushed" flag. I did not re-trace the red-flag
meter computation end to end; the change is consistent with the stated cause and does not affect the
landing threshold.

### Minors fixed - spot-checked

Neutral picker labels ("a specific detail"/"an older detail") in both `mail-composer.js:946` and
`pretext-card.js:223` (kept in sync; tests updated); engagement-report call line now prints prose for
`got_it`/`reported`/`walked_away` with a fallback (`engagement-report-minigame.js:194-197`, map keys
match the three `outcomeFor` values); the "Section 4" scope-card text and the plan objective/measure
re-ordering so the correct pick is no longer first (`scenario.json.erb`). All consistent with the log.

## m01-m10 / test slice

No shipped mission scenario, ink or audio is touched. The engine edits are confined to the social
systems (pretext judge/session, pretext-prep card, engagement report, social mail-composer labels) or
guarded by `params.pretextCallId` / optional chaining in `phone-chat-minigame.js`, so ordinary m01-m10
phone chats are unaffected. The validator change adds a `--strict-social`-only landing check; shipped
missions have no `social.landingPages`, so it does not fire for them. No regression path found.
