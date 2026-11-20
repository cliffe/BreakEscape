# UI SE picks review R1

Round 1, read-only, of branch `build/ui-se-picks` at tip `d0edb2227` (base main
`d69c29089`), in the worktree `.claude/worktrees/p-ui-se-picks`.

Scope: the two user picks, C-PP3 (option B, drop the orange readiness line on the
pretext prep card) and C-PV1 (option C, the privacy pill reads Exposed / Closed).

## Verdict: SHIP

Both picks are built correctly and proven on the live path. The readiness line is
gone with no path where it ever said more than the buttons, and its export has no
remaining importer in this branch. The privacy pill reads Exposed / Closed from the
one place that renders it, with no other reader of the switch state words and the
per-scenario override intact.

Counts: Blocker 0, Major 0, Minor 0. Nits 1 (listed separately, no action required
for the pick as chosen).

## What was checked and the evidence

### C-PP3: drop the orange readiness line

The removal is sound on every path.

- The card renders a disabled button for every fact in `facts`
  (`pretext-prep-minigame.js:236-238`, the loop over `facts`, no filter). An empty
  fact's button text is exactly `` `${label}: nothing held yet` `` using
  `factLabel(fact.factId, fact.label)` (`pretext-prep-minigame.js:246,259`).
- The removed `readinessLines(facts, optionsByFact)` filtered the same `facts` to
  those with no options and mapped each to the identical
  `` `${factLabel(...)}: nothing held yet` `` string (the deleted
  `pretext-card.js` export). Both received the same `facts` and the same `options`
  from `render()`, so the line was always a strict subset of the disabled buttons
  and never named a gap a button did not already show.
- Paths exercised: held fact (button not disabled, excluded from the line);
  filtered facts (the `usableLines` filter at `pretext-prep-minigame.js:217-220`
  touches only which pretext lines show, not the buttons or the line); a fact with
  no label (both button and line used the same `factLabel`); a call with no `knows`
  (`facts` empty, no buttons, "No blanks to fill." shown, no line); reload mid-prep
  (the card is derived from `facts`/`options` only, `chosen` resets to `{}`, so no
  persisted state could make the line say more than the buttons).
- Export removal has no stray importer in this branch:
  `git grep readinessLines d0edb2227` returns only `UI_SE_PICKS_BUILD_LOG.md`. The
  js, tests, tools and scenarios in the reviewed tree hold no other reference. (The
  matches elsewhere on disk are other worktrees and `/tmp` test-harness copies, not
  this branch.)

Live proof (port 3442, game 4318 lab_social_engineering, real `service_desk_call`
spec and scenario social data, both sizes): the card shows the two disabled buttons
"Team: nothing held yet" and "Intern: nothing held yet" with no orange paragraph
beneath them; `document.querySelector('.pretext-readiness')` is null at 1400x1000
and 390x844. The one orange line present, "This call has no contact." beside Begin,
is the separate gate line (no contact loaded in this entry state) and is unchanged.
Shots: `se-picks-r1/pretext_1400x1000.png`, `pretext_390x844.png`.

### C-PV1: pill reads Exposed / Closed

- The only reader of the switch state words is the pill:
  `privacy-panel-minigame.js:148` renders
  `this.text(s.tight ? 'switchTight' : 'switchOpen')` into `.pp-switch-state`.
  `DEFAULT_TEXT.switchOpen` / `switchTight` now read 'Exposed' / 'Closed'
  (`privacy-model.js:28-29`).
- No other surface renders the words. `aria-checked` is set from the boolean
  (`privacy-panel-minigame.js:145`), the row `data-state` uses the internal `OPEN`
  / `TIGHT` constants ('open' / 'tight', never shown), and `summarise()`
  (`privacy-model.js:141-143`) keeps counts only, so a debrief, result record or
  facilitator view carries no Open / Tight text. A branch-wide search for the words
  as switch state found nothing beyond the model and the build log.
- Screen-reader text is consistent: the pill text is inside the switch button, so
  the button's accessible name is "`<label>` Exposed" or "`<label>` Closed",
  matching the visible pill, with `aria-checked` carrying off / on.
- Per-scenario override still works. `privacyText` reads `config.strings[key]`
  before the default (`privacy-model.js:41-45`). Both `ca14_social_media` and
  `ca14_social_media_defend` override only `leaveOff` in `privacyPanel.strings`
  (scenario erb around lines 454 and 418), so they pick up the new pill words and
  nothing else contradicts them. No scenario authors `switchOpen` / `switchTight`.

Live proof (port 3442, game 4319 ca14_social_media, real config at
`social.awarenessEpisode.privacyPanel`, a real click on the first switch, both
sizes): all five pills read "Exposed" while open, paired with the red "Still
visible" notes; after the tighten click the first pill reads "Closed" and its fact
note reads "Closed". No Open / Tight anywhere. Shots:
`se-picks-r1/privacy_open_1400x1000.png`, `privacy_open_390x844.png`,
`privacy_tightened_1400x1000.png`, `privacy_tightened_390x844.png`.

## Tests

Every test file that imports a changed module, run one at a time with plain
`node test/js/<file>.test.mjs`, all pass:

- social-pretext-prep 18, social-reuse-pretext 4, social-privacy-panel 18,
  social-feed 23, minigame-se-close 13, exercise-station 14,
  validator-social-followups 11, social-lab-dev-call 5, pretext-debrief-labels 5.

Mutation checks of the two new assertions, both catch their bug and were restored:

- C-PV1: reverting `switchOpen` to 'Open' makes
  social-privacy-panel fail ("the switch state pill reads Exposed when open...",
  `'Open' !== 'Exposed'`); restored to 18 pass.
- C-PP3: re-adding a `.pretext-readiness` element makes social-pretext-prep fail
  ("the readiness note is gone (C-PP3)"); restored to 18 pass.

## Gates

- `ui-rules-audit.mjs --port 3442 --game 4318 --all --strict --skip
  person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`: SUMMARY
  frame-offscreen 1 (1), window-offscreen 0, clipped 0, x-on-frame 0, overflow 0.
  The single frame-offscreen is `mg-alarm-panel` at 915x412, the stated baseline
  (confirmed by a targeted re-run of pretext-prep, privacy-panel and alarm-panel:
  only alarm-panel breaches). The two changed scenes are clean at all four sizes.
- `shell-x-check.mjs --port 3442 --game 4318`: 172 checked, 0 failed. (pretext-prep
  and privacy-panel report "no X (disableClose scene)" under the title-only start;
  this is the harness entry state, not a regression, and both show a working X with
  real params, as the live shots confirm.)

## Findings

None at Blocker, Major or Minor.

### Nits

- N1 (nit, C-PV1 vocabulary). The panel heading "Tighten the settings" and the
  intro "Turn one to tight and see which of the facts an attacker could find it
  closes." (`privacy-model.js:26-27`) keep the tight / tighten wording while the
  pill now reads Exposed / Closed. A player reads "turn one to tight" and then sees
  the switch move Exposed to Closed. This is within the user's chosen option C (the
  lighter reading, pill only), so it is not a defect against the pick; noted only as
  a candidate follow-up if the heading and intro are ever revisited.

## Build log claims spot-checked

- "readinessLines fed only this line and its own unit test": confirmed, no other
  importer in the branch.
- Test pass counts (18 / 4 / 18 and the wider list): confirmed by running each.
- "overridable per scenario, no scenario authors switchOpen/switchTight": confirmed.
- Live before/after: reproduced independently on 3442 with games 4318 / 4319.
