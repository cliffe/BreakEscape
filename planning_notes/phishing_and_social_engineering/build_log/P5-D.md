# P5-D — landing-page builder overlay

Packet P5-D (IMPLEMENTATION_PLAN.md §4; "Phase 5 detail"). The builder overlay: steps 1 to 5
(Pretext, Build, Score, Send/Attach), the Score panel, Attach and Attach anyway, the Case file
nested launch, close as a normal exit, and concept-card display (07 N1, N7 display, N9). Model:
opus48 (builder packets to opus48, user decision 2026-10-21). Done 2026-10-21. Not committed.

## Files changed (my scope only)

- `public/break_escape/js/minigames/landing-page-builder/landing-page-builder-minigame.js` (new) —
  the overlay scene, extends `SocialOverlayScene`.
- `public/break_escape/css/landing-page-builder-minigame.css` (new) — the `.lpb-*` layout, the
  preview classes the renderer (P5-B) draws, `image-rendering: pixelated`, the narrow (<700 px)
  stacked layout and 44 px touch targets, reduced-motion.
- `test/js/social-landing-page-builder.test.mjs` (new) — 13 jsdom cases.

Not mine, left untouched: `landing-page-model.js` (P5-A), `landing-page-render.js` (P5-B),
`state-sync.js` and the global declarations (P5-F), the wiring and the fixture (P5-G), step 6
inspection (P5-E).

## What the overlay is

`LandingPageBuilderMinigame extends SocialOverlayScene`. Params `{ landingPageId, targetId,
returnTo?, kitId?, onComplete, social? }`; `requiresKeyboardInput: true` and `disableClose: true`
come from `socialOverlayParams`. Layout: a head with the own Close control, the five-step strip
(`Pretext · Build · Score · Send · Inspect`, `aria-current` on the furthest step reached), then two
panes — the preview (drawn by `renderLandingPage`, mode `build`) on the left and the choice panel on
the right. The choice panel holds the pinned Pretext card, the seven Build rows, the Score panel and
the action bar.

- **Chips are `<button>`s** with `role="radio"`/`role="checkbox"` and arrow-key navigation; the
  player types nothing (`typedInputs: 0`). Form fields, the readable domain chips, the wording chips
  and the padlock toggle are all buttons. The preview itself stays free of any `<a>`, `<button>`,
  form control or `contenteditable` (checked in the test: `previewForbidden === 0`).
- **Profile rows (07 §7).** Student edits all seven rows; awareness edits brand/domain/padlock;
  mission edits domain/wording. Rows the profile does not edit are preset to the correct value
  (brand/purpose from the pretext, crisp logo, the `match:true` wording, the brand's `realFields`,
  padlock on) and not drawn. Domain options carrying `minProfile: "student"` are hidden below the
  student profile.
- **Score** runs `scorePage` and writes the record through `applyScore` (keeping `victim`/
  `tellsFound`). The panel shows the credibility meter with the target's threshold line, the band
  verdict, any failed gate line underneath, and the per-factor checklist with Pass/Partly/Fail words
  beside each line (never a mark alone).
- **A change after a Score** clears the panel, hides Attach, and rewrites the record as unscored
  (`credibility: 0`, `meetsThreshold: false`, `built: false`) so new choices never pair with an old
  score (07 §3).
- **Attach / Attach anyway** flips the record `built: true` via `setBuilt`, sets
  `landing_<pageId>_built` and `landing_<pageId>_domain` through the shared global writer, sets
  `gameResult = linkInfoFor(record, pageDef, kitId)` plus `{ saved: true, inspectionComplete }` and
  completes. Below-threshold the button reads "Attach anyway" and attaches a `meetsThreshold: false`
  page (07 §4, OQ5).
- **Persistence.** The draft (`se_landing_drafts[pageId]`, the seven choice keys) is written on every
  change and on close; the record (`se_landing_pages[pageId]`) on every Score. Both go through
  `writeGlobal(..., { openChat: false })` then `stateSync.sync()`, the osint pattern. A reload
  restores the choices from the draft and, when the record's choices match and it carries a real
  credibility, re-runs the Score to bring the panel back.
- **Case file** (`_openCaseFile`) uses `launchChild('intel-board', { mode: 'recon' })`, which saves
  the draft, marks the overlay suspended and passes `returnTo`.
- **Close/Esc** are a normal exit: `close()` saves the draft then `super.close()` (so no
  `minigame_failed`); the backstop view (wrong target/missing page) still closes normally.

## Decisions / things to flag

- **Pretext-card fact source (new contract).** The card lists held facts from
  `pageDef.pretext.facts` (an array of intel fact ids), resolved against `social.intelFacts[id].text`
  and the `se_intel_<id>` held globals. 07 §1 says the card is "built from what the player holds"
  but names no field. **P5-G's fixture page and the lab must author `pretext.facts`** (e.g.
  `["lord_portal", "lord_portal_name", "lord_payslip_date"]`), or the card always shows the
  "haven't found out yet" line with the Case file button. This is the one key I invented; reconcile
  in `00`/`07` if a different shape is preferred.
- **`extraSensitiveFields` and `fields` are required on the page.** The worked example's 34 depends
  on `card_number` being in `extraSensitiveFields`. The P5-C validator fixture (`lp_clean.json`)
  omits both, so my test injects them; the lab page (P5-G) must author them, as the 07 §5 sample
  does.
- **`firstName`** is resolved from `social.people[].forms.first` keyed by the target id (falling back
  to `forms.short`, the first word of `forms.full`, then the target id). The lab's `lord` person
  entry must carry a first name, or the `{firstName}` strings print the id.
- **`kitId`** comes from `params.kitId`. The mail client's Attach launch (01 N4, P5-G) passes it so
  `gameResult.kitId` is correct; a workstation launch has none, so `gameResult.kitId` is null there,
  matching the gameResult contract in 07 §6.
- **The "why the page must match the story" note** (07 §1 step 1) is a short built-in note behind a
  "?" button, not an authored `conceptCards` entry — the card list has no such id. Chrome text only,
  no authored address.
- **Step 6 (Inspect) is a hook for P5-E.** The Inspect chip is in the strip; `_canInspect()` (a
  stored `victim` record) gates an Inspect button that currently calls the `_enterInspect()` stub.
  P5-E replaces `_enterInspect`, `_canInspect` stays. Nothing in P5-D depends on it.
- **The `five-habits` card is deliberately excluded** from the build view (`_cardsFor`): it is the
  step-6 closing card (P5-E).
- Concept cards render through the shared `osint-browser/concept-card.js` renderer (P2-A), as 07 N7
  and D4 require; they are grouped by row (typo-squat/homograph/right-to-left/hover-link on the
  domain row, padlock on the padlock row).

## Tests and checks

- `bundle exec node --test test/js/social-landing-page-builder.test.mjs` → 13 pass, 0 fail. Covers:
  keyboard-owning open with the five-step strip, the pretext card, zero typed inputs and an inert
  preview; the target backstop; the worked example attempt 1 = 34 (low verdict + careful-reader gate
  line, Attach anyway) and attempt 2 = 87 (high verdict, Attach to email); a change after Score
  greying the panel and un-scoring the record; Attach anyway setting the globals and the `saved: true`
  `linkInfoFor` gameResult; draft-on-change and record-on-Score persistence; reload restoring a
  scored page and a stale change; the held-fact / Case file pretext branches and the `intel-board`
  recon launch; concept-card display and toggle (five-habits excluded); Esc as a normal exit that
  saves the draft; and the awareness profile editing three rows with the rest preset correct and the
  homograph hidden.
- `bundle exec node --test test/js/social-landing-page-*.test.mjs
  test/js/validator-landing-pages.test.mjs` → 67 pass, 0 fail (no regression in the model, guard,
  render or validator packets; the render test's network-API grep over the builder folder is clean
  with my file present).
- `bundle exec node --test --test-concurrency=1 test/js/social-*.test.mjs test/js/validator-*.test.mjs`
  → 623 pass, 0 fail.
- `grep -nE 'fetch|XMLHttpRequest|WebSocket|sendBeacon'` over the builder folder: the only hit is a
  comment in `landing-page-render.js` (P5-B); my overlay makes no request.
- `git status --porcelain` shows only the three new paths above; no shared file touched.

## Left undone / for later packets

- Step 6 inspection (P5-E): the Inspect chip, `_canInspect` and `_enterInspect` hook are in place;
  the hot-spots, decoy padlock, "Show the link target" and the five-habits closing card are P5-E.
- Persistence declarations and the state-sync shape guard are P5-F; the overlay writes the globals,
  P5-F declares them `{}` and drops out-of-set keys at the sync boundary (defence in depth; the
  overlay already writes only closed keys via `buildRecord`/`applyScore`/`setBuilt` and the seven
  draft keys via `_pick7`).
- Wiring (register, starter, `interactions.js` branch, `show.html.erb` link, schema, sprite) and the
  `test_social_slice` fixture page are P5-G; the overlay was tested against the P5-C fixture plus the
  authored fields noted above.
- Browser bridge steps 1 to 8 are P5-T; steps 1 to 5 are exercised here in jsdom, but a real-browser
  run on :3001 is still owed.
- No art generated (OBJ8, UI22, LOGO1/4-6). The preview and logo slots fall back to CSS boxes; the
  padlock uses the existing `padlock_32.png`.
