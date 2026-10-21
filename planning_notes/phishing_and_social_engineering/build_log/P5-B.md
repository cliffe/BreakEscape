# P5-B — Landing-page builder: preview renderer

Packet P5-B (IMPLEMENTATION_PLAN.md §4; Phase 5 detail). Model: opus48 (builder packets to opus48,
user decision 2026-10-21). Done 2026-10-21. Not committed (orchestrator commits).

## Scope built

- `07` N3: the two-layer preview renderer (`landing-page-render.js`) and its DOM-safety test.
- `07` N6b renderer half: the runtime guard that refuses an off-menu or non-`.example` domain and
  draws a blocked placeholder.
- `07` N8: `var(--se-font-readable)` on every authored domain, address and field label the preview
  shows.

## Files changed

New (both untracked; no tracked file modified):

- `public/break_escape/js/minigames/landing-page-builder/landing-page-render.js`
- `test/js/social-landing-page-render.test.mjs`

`git diff --stat` over `public/break_escape/js/minigames/landing-page-builder/` and `test/js/` shows
no tracked-file change.

## What the renderer is

`renderLandingPage({ pageDef, choices, mode, target?, doc?, logoBase? }) -> { root, blocked, regions }`.

- `root` is a detached `div.lpb-preview` the overlay (P5-D) inserts into the left pane. The overlay owns
  the chrome, step strip, choice panel, chips, checklist, feedback lines and concept cards; the renderer
  owns **only the preview** (fake browser: address bar + page body). This is why the preview can stay free
  of `<button>`: chips, the "?" concept-card button and the step-6 "Show the link target" button all live
  in the choice panel, not in the preview.
- `mode`: `'build' | 'score' | 'inspect'`. Build/score set the container `role="img"` with an
  `aria-label` describing the page; `inspect` sets `role="group"` and makes the five regions focusable
  `<div role="button" tabindex="0">` hot-spots (07 §8a).
- `regions` = `{ padlock, addressBar, logo, wording, form }` element references, so P5-E can attach the
  step-6 pick handlers without re-querying. In inspect mode each is the hot-spot div.
- Pixel layer: brand logo and padlock as `<img>` (padlock uses the real `assets/icons/padlock_32.png`,
  UI23); text layer: address, wording and field labels as inert DOM text set with `textContent`.
- Form fields are styled `<div>` boxes with a label and an empty `.lpb-field-input` div — no control.
- Also exported, pure, for the shared guard test (see coordination): `resolveDomainOption(pageDef, choices)`
  and `isDomainBlocked(pageDef, choices)`.

## Decisions (challengeable)

- **Readable font applied inline.** The builder CSS is P5-D's, so to keep N8 self-contained and testable
  the renderer sets `style.fontFamily = 'var(--se-font-readable)'` directly on each domain/address/
  field-label element (plus semantic classes for P5-D to style layout). The CSS var resolves against
  `:root` from `css/fonts.css` (P0-L) in a real browser, and jsdom exposes it on `el.style.fontFamily`
  for the test. If P5-D would rather own the font through CSS classes, drop the inline lines.
- **`browserDomain` shown in the preview address bar.** When the chosen option has a `browserDomain`
  (the `xn--` punycode form) the address bar shows a second, smaller "Some browsers show it as ..." line.
  `07` §3 attributes that second line to the choice-panel chip; I also put it in the fake browser's own
  address bar because that is where a browser shows punycode, and it lets the renderer own the raw
  rendering of the `xn--` form (the P5-B gate: "homograph drawn raw, not through displayDashes"). Easy to
  drop if P5-D's chip is meant to be the only place it appears.
- **Guard resolves the domain across the union of all brands' menus** (not just the chosen brand), so a
  legitimate menu id is never wrongly blocked. Host rule follows `07` §1: strip scheme, take up to the
  first `/`, email by the part after `@`, then require a `.example` suffix (case-insensitive).
- **Logos are `<img>` at a settled path** `assets/social/landing/logo-<brandId>.png`. LOGO1/4-6 are not
  generated yet (ASSETS; no generation in a packet), so the slot is styled by P5-D CSS to show a labelled
  box until the art lands. The `blurry`/`stretched` looks are CSS classes (`is-blurry`/`is-stretched`),
  drawn bad in the renderer, never downscaled (house rule).

## Coordination with P5-A (model), written in parallel

- The renderer **imports nothing from `landing-page-model.js`**, so neither file blocks the other and the
  render test is independent. The N6b guard is duplicated by rule, not by import: both halves apply the
  same "on the authored menu AND host ends `.example`" check. They must agree — if P5-A's model guard
  diverges, reconcile against `07` N6b.
- The shared `social-landing-page-guard.test.mjs` is P5-A's file (§4 P5-A row). For its three renderer
  fixtures it can import `isDomainBlocked`/`resolveDomainOption` and `renderLandingPage` from
  `landing-page-render.js`: (a) a menu option with host `ledgerwell.test` -> blocked; (b) an off-menu
  `domainId` -> blocked; (c) `ledgerwell-hr.example` -> not blocked, page drawn. All three are already
  covered in `social-landing-page-render.test.mjs` too, so the renderer half is proven regardless.

## Tests run

`bundle exec node --test test/js/social-landing-page-render.test.mjs` — 10 pass, 0 fail.

Covers: the six states (build, score, inspect, blocked placeholder, homograph option, worked-example
page) through the DOM-safety walk (no `a`/`form`/`input`/`textarea`/`select`/`button`/`iframe`/`script`,
no `contenteditable`); five focusable hot-spots in inspect and none in build; form fields as inert boxes;
the network-API grep over the builder folder (comments stripped so the rule can be documented); the
renderer never importing displayDashes; the homograph letter (U+0435) and `xn--ledgerwll-m0h` rendered
raw with the double hyphen intact and no en dash; the readable font on address/label/copy; and the N6b
guard across the (a)/(b)/(c) cases plus the blocked placeholder drawing the frame only.

The network-API grep strips `//` and `/* */` comments before matching: a blunt grep fails on the very
prose that documents the forbidden APIs. The test still fails on any executable use.

## Left undone / for later packets

- No CSS. `landing-page-builder-minigame.css` (the `.lpb-*` layout, `image-rendering: pixelated`, the
  pending logo-slot placeholder background) is P5-D's.
- No overlay, step strip, chips, score panel, concept cards or step-6 interaction wiring (P5-D, P5-E).
- Art pending (OBJ8, UI22, LOGO1/4-6): the renderer references settled paths; slots fall back to CSS boxes.
- The guard is a suffix + membership check only; it cannot judge brands (the offline lint, P5-C, does).
