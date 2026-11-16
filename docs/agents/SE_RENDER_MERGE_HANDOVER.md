# C-X7 / n5 shared SE stepper merge - handover

Worktree: `.claude/worktrees/p-se-render`, branch `build/se-render-merge` (cut from main 65f9ad80e).

## Done (committed)

- Commit **c741a9806** "SE stepper: merge the three step-strip render functions into one shared module".
- New shared module: `public/break_escape/js/minigames/helpers/step-stepper.js`
  - `buildStepItems(list, steps, config)` builds the `<li>` items (stepClass, dataKey,
    optional numClass, label as text/span/none) and returns a Map id -> li.
  - `applyStepStates(items, steps, config, resolve)` toggles currentClass/doneClass/skippedClass,
    aria-current and an optional screen-reader suffix span. `resolve(step, i)` returns
    `{current, done, skipped}` already de-conflicted by the caller.
- Three callers switched to it, DOM/classes/behaviour unchanged (config-driven, no CSS touched):
  - `minigames/episode-runner/step-strip.js` (`renderStepStrip`): aw-step / aw-step-num /
    aw-step-label / aw-step-current/done/skipped / aw-step-sr, data-stage. Wordmark + brand
    accent stay in this file.
  - `minigames/inbox-triage/inbox-triage-minigame.js` (`_renderSteps`): tri-step, data-step,
    label as li text ("1 Brief"), done when i<here, current when i===here.
  - `minigames/landing-page-builder/landing-page-builder-minigame.js` (`_renderSteps`): lpb-step,
    lpb-step-label span, is-current, data-step.
- New unit test: `test/js/social-step-stepper.test.mjs` (8 tests, all pass).
- Added `'minigames/helpers/step-stepper.js'` to the copy list of **41** test harnesses that copy
  one of the three engine files (every JS harness that imports them). A patch script did it:
  `scratchpad/patch_harness.py` over `scratchpad/harnesses.txt`.
  - NOTE one false positive handled: `social-triage-bridge-chips.test.mjs` referenced the inbox
    path only inside an assertion array (not a copy list); the spurious insert was reverted, so
    that file is unchanged. step-stepper.js has no `tri-chip` string so it stays out of that
    assertion.

## Verification done

- New test `node --test test/js/social-step-stepper.test.mjs` -> 8 pass.
- All 42 touched harnesses run one at a time with plain `node --test <file>` -> every one passes
  (0 fail). These assert the exact main-era DOM (classes, aria-current, data attrs, counts) for all
  three steppers, so they are the byte-identical-DOM proof.

## In progress

- **Train check**: running in background (task id b0mroogmi), log at
  `scratchpad/se-render-train/`. Command used:
  `SHELL_X=always tools/playtest/train-check.sh <worktree> <scratchpad>/se-render-train 3490`.
  node_modules symlink was moved to `tmp/delete/` first; tree was clean. Wait for
  `se-render-train/summary.txt` last line (GREEN / RED / PARTIAL). Recreate the node_modules
  symlink afterwards: `ln -s ../../../node_modules node_modules`.

## Not started: headless live check

Plan worked out (not yet run):
- Recreate node_modules link first. Start a keyless Rails server on a port 3491-3494 with
  `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`.
- Faithful open path is `window.__test.interact('<objId>')` then
  `waitForMinigame('<key>', ...)`, modelled on `tools/playtest/se/phish-build-liveproof.mjs`.
- Hosting test scenarios / object ids found:
  - landing-page-builder: scenario `test_social_slice`, object `slice_page_builder`.
  - episode-runner: scenario `test_social_episode`, object `ep_kiosk` (see
    `tools/playtest/se/bridge-p7-episode.jsonl` for the full drive; strip `.aw-wordmark`/`.aw-step`).
  - inbox-triage: NOT yet located. Minigame key never appears literally in scenario.json.erb;
    objects carry `triageSetId` (grep `triageSetId` in test_social_slice:1079/1091, and
    `landingPageId`/`triageSets`/`landingPages` keys). Find the object whose interact opens
    `inbox-triage` in test_social_slice (it has both triageSetId and landingPageId objects) or
    another `test_social_*` scenario. Fixture shape from harnesses:
    `{ set, social:{ triageSets:[set] }, skin:'awareness' }`.
- Create games with `tools/playtest/new-game.rb`. On a character picker choose
  `female_hacker_hood_v2`. Call `setFPS(20)`, never turn fixed step off. Screenshot the stepper at
  1280 and at 390x844.
- Before/after: easiest same-worktree baseline is to capture AFTER on this branch first, then
  `git checkout 65f9ad80e -- <the 4 engine files>` (step-strip.js, inbox-triage-minigame.js,
  landing-page-builder-minigame.js only - NOT step-stepper.js which does not exist on parent, and
  the engine revert just leaves it unused), restart server, capture BEFORE, then
  `git checkout HEAD -- <same 4 files>` to restore and confirm `git status` clean. This is a path
  checkout only (no reset/rebase/stash, allowed). The DOM is expected byte-identical, so diff the
  stepper outerHTML as the strict proof and keep the screenshot pairs.

## Gotchas
- Shared Postgres dev DB across worktrees: never db:create/migrate/reset/schema:load; interact-created
  games are fine. Never edit existing game rows. Never touch ports 3000/3085/3086. Kill only PIDs you start.
- bridge-chips assertion lists every file containing `tri-chip`; keep step-stepper.js free of it.
