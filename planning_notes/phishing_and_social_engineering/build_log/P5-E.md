# P5-E — step 6 defender inspection

Packet P5-E (IMPLEMENTATION_PLAN.md §4; "Phase 5 detail"; design 07 §3 step 6, §4 tells tables,
§6 "Inspect", item 07 N5). The defender flip: the player reopens the sent page as the victim's
browser and finds each giveaway — focusable preview hot-spots, the padlock decoy, a "Show the link
target" button, the closing five-habits card. Exports `buildSuspectPage` and the `tells` table.
Model: opus48 (builder packets to opus48, user decision 2026-10-21). Done 2026-10-21. Not committed.

## Files changed (my scope only)

- `public/break_escape/js/minigames/landing-page-builder/landing-page-inspect.js` (new) — the pure
  inspection model: `buildSuspectPage(pageDef, record, target)`, the `TELL_REGIONS`/`tells` table,
  `INSPECT_REGIONS`, `FINE_LINES`/`FINE_FALLBACK`. No DOM, no globals, imports only the model.
- `public/break_escape/js/minigames/landing-page-builder/landing-page-builder-minigame.js` (P5-D's
  file) — replaced the `_enterInspect()` stub with the full step 6: `_buildSuspect`, `_wireHotspots`,
  `_pickRegion`, `_showLinkTarget`, `_showMe`, `_afterFind`, `_persistFound`, `_playFoundCue`,
  `_renderInspectPanel`, `_closingCard`, `_focusAfterInspect`; preview now renders `inspect` mode when
  inspecting; `_currentStep` and `getTestState` extended; the `FIVE_HABITS` fallback constant. `_canInspect`
  is unchanged (P5-D left it for me and said to keep it).
- `public/break_escape/css/landing-page-builder-minigame.css` (P5-D's file) — replaced the hot-spot
  placeholder block (whose comment reads "P5-E styles the found/decoy states") with the found/decoy/
  fine/closing-card/Done styles.
- `test/js/social-landing-page-inspect.test.mjs` (new) — 12 cases: the pure module and the overlay view.
- `test/js/social-landing-page-builder.test.mjs` (P5-D's test) — one line added to its file-copy list so
  the overlay's new `import './landing-page-inspect.js'` resolves inside the jsdom temp folder. No test
  behaviour changed.

Not mine, left untouched: `landing-page-model.js` (P5-A), `landing-page-render.js` (P5-B; its `inspect`
mode and `regions` output were already built, I only drive them), `state-sync.js` and the global
declarations (P5-F), the wiring and fixture page (P5-G).

## What step 6 is

`_enterInspect()` opens when the page record has a `victim` entry (any send carrying the page has been
recorded). The preview re-renders in `inspect` mode — `role="group"` with each region a focusable
`div role="button" tabindex="0"` (the renderer, P5-B). The choice panel becomes the inspection panel:
a progress line, the revealed findings, the "Show the link target" button, "Show me", and, once done,
the closing five-habits card and a Done button.

- **Hot-spots.** Each pick reveals the giveaway(s) in that region, or says what was fine. A region can
  carry several tells (e.g. a wrong brand and a weak logo both show on the logo). Picks work by mouse,
  by Enter/Space on the hot-spot, and after a re-render keyboard focus returns to the same region.
- **The padlock is a decoy when shown** (07 §4): tapping a shown padlock prints the decoy line and
  counts for nothing. With the padlock off, the padlock region carries a real tell.
- **The hover mismatch** has no preview element (the inert preview holds no `<a>`); it is revealed by
  the "Show the link target" button in the panel (07 §4, §6).
- **Completion** is every tell the current choices carry being found, or "Show me". It sets
  `_inspectionComplete`, shows the five-habits card, and surfaces in `gameResult.inspectionComplete`.
- **Tells are recomputed from the current choices** via the model's `scorePage(...).tells`, and only
  the stored `tellsFound` ids that still apply are pre-marked (07 §3). `tellsFound` is persisted on each
  find through `buildRecord({ ...existing, tellsFound })`, which keeps `victim` and the closed key set.
- **Close/Esc/Done** are all a normal exit (`complete(true)`), so no `minigame_failed`.

## Decisions / things to flag

- **Defender strings come from `scorePage().tells`, not from `strings["domainTier<N>Defender"]`.**
  The orchestrator's note said defender strings live at `strings["domainTier<N>Defender"]`, and the
  P5-C fixture (`lp_clean.json`) authors keys of that shape. But the P5-A model resolves the per-factor
  step-6 defender line through its own keys (`defDomainTier3` … `defDomainTier0`, `defBrand`, etc.,
  with `{shown}`/`{real}` filled) and its `tells[]` output. I used `scorePage().tells` as the single
  source of truth, so step 6 and the score panel never disagree and placeholder filling is done once.
  **Consequence:** the fixture's `domainTier<N>Defender` keys are inert — the model ignores them, so
  the DEFAULT strings show. If the lab (P5-G) or `00`/`07` wants to override a defender line, it must
  use the model's key names (`defDomainTier<N>`, `tellFormOrigin`, `tellHoverMismatch`, `padlockDecoy`).
  I did **not** edit the P5-A model to add a `domainTier<N>Defender` alias (out of my scope). Someone
  should reconcile the key name in `00`/`07`/the fixture, or add the alias to P5-A.
- **`buildSuspectPage(pageDef, record, target)`**, not the doc's literal `buildSuspectPage(record)`.
  The defender strings need `pageDef`, and `firstName` needs `target`; I kept the argument order used
  by `scorePage`/`renderLandingPage` (pageDef first). `05` reuse is out of the lab (OQ6); the signature
  is for a later awareness set, so reconcile it then if a one-arg form is wanted.
- **Tell→region map** (`TELL_REGIONS`): `domain→address`, `padlock→padlock`, `logo→logo`,
  `wording→wording`, `form→form`, `formOrigin→form`, `hoverMismatch→link` (the button), and the two
  factors with no region of their own, `brand→logo` (the wrong service shows in the logo) and
  `purpose→wording` (the stated purpose shows in the heading). In the canonical lab flow brand always
  passes and purpose shows in the wording block, so these only matter for a deliberately-wrong build.
- **Reload restore.** Re-opening the builder does not auto-enter inspect; the player re-enters from the
  action bar and the stored `tellsFound` are restored (seeded into the found set). A reload after step 6
  finished sets `_inspectionComplete` on init, so the step strip reads `inspect`.
- **CSS and the P5-D test** are P5-D's files. Editing the CSS is what its own comment invited; the test
  change is a one-line copy-list addition with no behaviour change. Flagging both since they are not
  strictly "code in the overlay folder".
- **Found-it cue** reuses `ui_click_1` via `window.soundManager` (07 §8), guarded so it is a no-op
  without sound or in tests.
- **No art generated** (OBJ8, UI22, LOGO rows). The hot-spots, decoy and found states are CSS on the
  `--ui-*` tokens; the padlock uses the existing `padlock_32.png` via the P5-B renderer.

## Tests and checks

- `bundle exec node --test test/js/social-landing-page-inspect.test.mjs
  test/js/social-landing-page-builder.test.mjs` → 27 pass, 0 fail. The inspect file's 12 cases cover:
  the `tells` table and its alias; a well-built page keeping only `domain`/`formOrigin`/`hoverMismatch`;
  a weak page carrying one tell per flawed factor plus the two page tells; stored tells filtered to the
  current choices; an off-menu domain blocked; the overlay opening into inspect (role=group, hot-spots,
  `previewForbidden === 0`); finding address + form + the link button to complete; the padlock decoy;
  a "what was fine" pick; Show me; reload part-way and after completion; Done/Esc as normal exits with
  the right `inspectionComplete`; and Inspect hidden until a victim record exists.
- `bundle exec node --test test/js/social-landing-page-*.test.mjs test/js/validator-landing-pages.test.mjs`
  → 89 pass, 0 fail (no regression in the model, render, guard, builder or validator packets; the P5-B
  render DOM-safety test still passes in both `img` and `group` states, and its network grep over the
  builder folder is clean with my file present).
- `bundle exec node --test --test-concurrency=1 test/js/social-*.test.mjs test/js/validator-*.test.mjs`
  → 645 pass, 0 fail (was 623 at P5-D).
- `grep -nE 'fetch|XMLHttpRequest|WebSocket|sendBeacon'` over the builder folder: the only hit is the
  comment in `landing-page-render.js` (P5-B); my overlay and inspect module make no request.
- `git status --porcelain` over my scope shows only the paths above (all still untracked, since P5-A–D
  are not yet committed); nothing outside the builder folder, its CSS and the two tests moved.

## Left undone / for later packets

- **Browser bridge step 6 (P5-T).** Steps 1 to 5 were exercised in jsdom by P5-D; step 6 is exercised
  in jsdom here, but a real-browser run on :3001 is still owed (P5-T, after P5-G's wiring and fixture).
  The bridge needs the mail send path (`01` N6 / P5-G) to store a `victim` record so Inspect appears.
- **Defender-string key reconciliation** (see Decisions): either alias `domainTier<N>Defender` in the
  P5-A model or fix the key names in `00`/`07`/the fixture. Needs an owner.
- **P5-G** authors the lab's `five-habits` conceptCards text; until then the overlay shows the built-in
  `FIVE_HABITS` fallback.
