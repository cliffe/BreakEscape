# P5-G — landing-page builder wiring, fixture, and the mail `link` kind

Packet P5-G (IMPLEMENTATION_PLAN.md §4; "Phase 5 detail"; D9). The shared-file wiring that puts
the builder overlay in the game, the `test_social_slice` fixture page (D5), the `link` kind in the
mail Attach menu (`01` N4) and the send-path victim record / capture call (`01` N6, `07` N10/N11),
plus the defender-string key reconciliation the orchestrator asked for (P5-E point 1). Model opus48
(builder packets to opus48, user 2026-10-21). Done 2026-10-21. Not committed.

## What was built

### 1. Overlay wiring (README Conventions checklist)

- `public/break_escape/js/minigames/index.js` — export, import and
  `registerScene('landing-page-builder', LandingPageBuilderMinigame)`, beside the other social
  overlays (the hook points in "Phase 5 detail" pointed at the `text-file` model; the social group
  at lines 16–20 / 103–107 / 170–174 is the better neighbour and is where these three lines went).
- `public/break_escape/js/systems/minigame-starters.js` — `startLandingPageBuilder(sprite, options)`
  and its `window.` export, modelled on `startOsintBrowserMinigame`. It reads
  `minigameData.landingPageId` (and optional `targetId`), passes `kitId`/`returnTo` through from the
  mail launch, and wraps params in `socialOverlayParams()` so `requiresKeyboardInput` and
  `disableClose` are set before `startMinigame` reads them. A workstation launch passes no `kitId`,
  so `gameResult.kitId` is null there (the `07` §6 contract). The overlay derives `targetId` from the
  page's single `targets` key when none is passed (model line 285).
- `public/break_escape/js/systems/interactions.js` — a `page-builder` branch beside the other social
  object branches (hyphenated id, D3), launching `startLandingPageBuilder(sprite)`.
- `public/break_escape/js/core/game.js` — `this.load.image('page-builder', 'objects/page-builder.png')`.
- `app/views/break_escape/games/show.html.erb` — the `landing-page-builder-minigame.css` link, in the
  social group after `pretext-prep-minigame.css`.
- `scripts/minigame-data-schemas.json` — the `page-builder` entry: `required: ["landingPageId"]`,
  `optional: ["targetId"]` (`00` §11).
- `public/break_escape/assets/objects/page-builder.png` — placeholder sprite, a copy of
  `osint-workstation.png`, so `--strict-social`'s sprite check passes (OBJ8 is still a user request).

The **Space and `E` pause** (`07` §6) needs no new code: `socialOverlayParams()` sets
`requiresKeyboardInput: true`, which the framework uses to suspend the world's movement and
interaction keys while the overlay is open. P5-T exercises it in the browser.

### 2. The `link` kind in the mail Attach menu (`01` N4)

- `mail-composer.js` — a new `link` control (`_renderLink`): a button per landing-page link offered
  for the current target. A `link` kit is offered only when its page's `targets` map contains the
  composer's target (`linkKitsForTarget`). A built page attaches at once (`setLink`); an unbuilt one
  hands off to the host (`onAttachLink`) to open the builder. `attachLinkIfBuilt(kitId)` is the
  return path. `this.link` (a kitId string) rides the draft (`draft()`, `_restoreDraft`), is reset in
  `selectContact`, and `buildMessage()` sets `message.link` (the kitId, a string, as `04`'s
  `judgeLink` expects) and `message.linkText`. `getTestState` reports `link` and `linkKits`.
  `ATTACHMENT_KINDS` still excludes `link`, so the file Attach menu never lists it.
- `mail-client-minigame.js` — `openCompose` passes `landingPages` and `onAttachLink` to the composer;
  `_launchBuilderForLink(kit)` saves the draft and `launchChild('landing-page-builder', …)`;
  `returnParams()` carries `reopenCompose`/`attachLinkKit` when a builder launch is in flight, and
  `start()` reopens Compose on return and attaches the link if the page is now built
  (`01` §2 "Attach a link that has no page").

### 3. Send-path victim record and capture call (`01` N6)

- `mail-bridge.js` — imports `linkInfoFor`, `describeVictimOutcome`, `betterVictim`, `captureGranted`
  and `buildRecord` from `landing-page-model.js`. In `performSend`:
  - before judging, a `link`-kind message has `message.linkInfo` filled from the saved
    `se_landing_pages[pageId]` record via `linkInfoFor` (or the `missing` state when no built page
    exists), so `linkCredible` sees the built page's domain and threshold;
  - after the record and metrics are written, a send that carries a **built** page computes
    `describeVictimOutcome(record, target, landed)`, keeps the best outcome with `betterVictim`,
    writes it back onto the page record through the shared writer, and — only when
    `captureGranted(before, after)` is true (the first `submitted`) — calls `window.addNote` with the
    page's `capture.note`.
  - The sent record's `link` field is populated (`{ kitId, linkText, destination }`).
- `mail-reader.js` — a Sent record's link renders as an abstract chip (never a real URL).

### 4. Defender-string key reconciliation (orchestrator request; P5-E point 1)

`landing-page-model.js` reads the per-tier step-6 defender line from `defDomainTier<N>` (plus
`tellFormOrigin`, `tellHoverMismatch`, `padlockDecoy`). P5-C's lint required `domainTier<N>Defender`,
a name the lint invented, which the model ignores. The model's names win:

- `scripts/validate_social/landing.rb` — `tier_defender_key(tier)` now returns `"defDomainTier#{tier}"`.
- `test/js/fixtures/social_landing/lp_clean.json` — its four defender keys renamed to `defDomainTier0..3`.
- `test/js/validator-landing-pages.test.mjs` — the two `domainTier1Defender` references renamed.

### 5. The fixture page in `test_social_slice` (D5)

Neither existing target (`hampshire`, `teague`) requires `linkCredible`, so a third target was added
(D5). All additions are confined to `scenario.json.erb`:

- a `lord` data-only target (Sofia Lord, intern): `requiredFactors ["senderTrust", "linkCredible"]`,
  `expectedLink { brandId: "ledgerwell", realDomain: "ledgerwell.example" }`, `primedFor.trusts
  ["*"]` (open), two pretext templates (`pretext_payslip`, `pretext_portal`) so the pick matters, and
  `outcome.setGlobal { phish_lord_landed: true }`;
- a `payroll_login` landing page serving only `lord` (the one-target rule), modelled on the P5-C
  clean fixture: the Ledgerwell/CloudBoxy brands, the six-domain menu (tiers 0–3, the homograph
  `d_homo` written with a `е` source escape), purposes, three wordings (one `match:true`, one
  `slips:true`), the `defDomainTier0..3` defender strings, the six landing concept cards, `pretext`
  (`brandId`/`purposeId`/`facts`), `fields`, `extraSensitiveFields`, and `capture`;
- the `lord` person (`forms.first: "Sofia"`, needed for `{firstName}`), the `lord` mail contact
  (revealed by `se_intel_portal_name`, a fact the Brandt call grants), the `kit_payroll_page` `link`
  payload-kit item, the six landing concept cards, `intelBoard.people`/`readinessSlots.lord`;
- a `lord_round` aim with a `lord_landed` task and a host `eventMapping` on
  `global_variable_changed:phish_lord_landed`;
- globals: `target_ready_lord`, `phish_lord_landed`, `phish_lord_attempts`,
  `landing_payroll_login_built`, `landing_payroll_login_domain`, `se_landing_pages: {}`,
  `se_landing_drafts: {}` (the `{}` declarations are P5-G's per P5-F).

## Tests and checks

- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social
  --no-graph --skip-ink` → **exit 0**, "✓ Validation complete!", no SOCIAL errors. (The remaining
  suggestions about `brandt_call_done`/`quinn_call_*` globals are pre-existing and not P5-G's.)
- `bundle exec node --test test/js/validator-landing-pages.test.mjs` → 24 pass, 0 fail (after the
  defender-key rename).
- `bundle exec node --test test/js/social-mail-link-victim.test.mjs` (new, 8 cases) → 8 pass, 0 fail.
  Covers: linkInfo filled + linkCredible pass + landed for a built page; victim written + capture
  note added once for a submitted send and not a second time; a below-threshold page = noticed, no
  capture, linkCredible fails; `betterVictim` keeps an earlier submitted outcome; an unbuilt page
  reads `missing` and writes no victim; the composer offers the link only for the served target and
  attaches a built page (and `attachLinkIfBuilt` on the builder return).
- `bundle exec node --test --test-concurrency=1 test/js/social-*.test.mjs test/js/validator-*.test.mjs`
  → **699 pass, 0 fail**.

## Decisions / things to flag

- **`message.link` is the kitId string**, not an object: `04`'s `judgeLink` tests `isStr(message.link)`.
  `message.linkInfo` (the object from `linkInfoFor`) is filled by the bridge before judging.
- **`landing-page-model.js` is now on the mail client's static import graph** (mail-bridge imports it).
  Every `*.test.mjs` that copies `mail-bridge.js` into a temp dir must also copy
  `minigames/landing-page-builder/landing-page-model.js`. The current working-tree copies of
  `social-mail-bridge`, `social-mail-composer`, `social-mail-client-shell` and `social-mail-narrow`
  already do (added by a sibling packet); their HEAD copies do not, so once these land the test copy
  lists must be committed together with the bridge change.
- **`page-builder` CSS link placement.** Added to the social group in `show.html.erb` after
  `pretext-prep`, not "after the siem stylesheet at :40" as the stale hook note said.
- **lord's reveal.** The `lord` contact is revealed by `se_intel_portal_name` (granted by the Brandt
  pretext call) rather than a lord-specific fact, to avoid a declared-but-ungranted global; the
  readiness slots use `portal_name`/`payslip_date`. A playtest reaches lord by making the Brandt call
  first (or by console-setting the facts — "exercised, not earned").
- **No art generated** (OBJ8). `page-builder.png` is a copy of `osint-workstation.png`.

## Left undone / for later packets

- **P5-T** (bridge checks 1–8 on :3001) runs after this. Steps 7–8 (`se_landing_pages` persistence
  across a reload; the victim record making Inspect appear) now have the wiring and fixture they need.
- A real-browser run of the mail→builder nested launch and re-attach is owed to P5-T; it is exercised
  here only in jsdom (the composer handoff and the `attachLinkIfBuilt` return path).
- **`social-mail-narrow.test.mjs`** was being edited by a concurrent agent during this packet (its
  test 4 changed under me and briefly failed against both HEAD and this source); on the final full run
  it passed. Not P5-G's; flagging because it is a shared test file.
- `scenarios/test_social_slice/dungeon_graph.{html,json,md}` appeared as untracked files during the
  session (not written by P5-G's `--no-graph` runs; likely a sibling validator/graph run). Left in
  place (shared tree; not cleaned, not committed).
