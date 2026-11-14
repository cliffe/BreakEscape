# UI SE build log (build/ui-se)

Branch build/ui-se from build/ui-consoles 422c55061. Scope: critique C (social engineering,
comms, awareness exercise and conversation scenes; scratchpad critique-c/findings.md) on top of
the shell and consoles work. Paths are under public/break_escape/ unless they start with tools/,
test/ or docs/.

Deferred to the user (do not build without their call): C-X8 (address font: the user chose
"pixel font everywhere plus a letter check"; a separate GNF letter test runs first, so the
Source Sans addresses stay for now).

Added to scope mid-pass by the coordinator (2026-11-14), landed in the OPEN list because this
pass reached its handover point first: C-X3 (A: 9-slice frame on every SE window), C-ER1 (B:
kiosk bezel for the episode runner, full-bleed only in facilitated mode), C04 (A: merge the
intel board's duplicate fact lists, display only). See the Handover open list for how to resume.

## 1. Baseline (tip 422c55061, game 3503, keyless :3490)

`node tools/playtest/ui-rules-audit.mjs --port 3490 --game 3503 --all --strict --skip person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`

    SUMMARY window-offscreen 0 (0), frame-offscreen 1 (1), clipped 0 (0), x-on-frame 0 (0), overflow 3 (1)
    FAIL: 4 fit breach(es)

Same fit counts as the consoles tip (alarm panel 915x412 and network architecture 390, both
by design / NAD1). The shell and consoles branches had already fixed every fit breach on the
critique-C scenes, so this pass is about the style and chrome items the critique raised, not fit.
Baseline per-scene STYLE breaches (radius/hairline/shadow/gradient/font/font-size) at 1400x1000,
from audit-before.json, are in the before/after table below. Logs and JSON: scratchpad ui-se/
audit-before.{log,json}.

## 2. Fixes done

### C-X1 (done) shared pixel X for every SE / exercise window
- `framework/social-overlay.js`: `buildCloseControl(label='Close')` builds the shared pixel ×
  (class `.se-overlay-close`, aria-label Close, innerHTML `&times;`, click -> requestClose) and
  records `this.closeButton`; `mountCloseControl(parent, label)` appends it. No more text 'Close'
  skin button, no cancelText default for these scenes.
- The hand-rolled `se-overlay-close minigame-button` text buttons in assistant-chat, intel-board
  (x3), engagement-report, landing-page-builder (x3), osint-browser and pretext-prep now call
  `buildCloseControl()`.
- `css/minigames-framework.css`: `.se-overlay-close` is the pixel × (30px square, 4px border,
  Press Start 16px, square, no radius/shadow), hover/active/focus-visible, a 44px touch target
  under 600px / coarse pointers. `css/mail-client-minigame.css`: the toolbar's size rules no
  longer target `.se-overlay-close` (only `margin-left:auto` stays), so the shared look wins.
- The 10 `mountCloseControl(bar, ...)` callers (password-guesser, mail-client, sort-drill,
  concern-form, authenticator, privacy-panel, consequence-sandbox, episode-runner, inbox-triage)
  route through the new code unchanged; the label is now only the aria-label.
- The per-scene close classes (`.ib-close`, `.er-close`, `.ob-close`, `.lpb-close`,
  `.pretext-close`, `.ac-close`) are no longer on any element; their CSS rules are inert (left
  in place, harmless) — tidy them if touching those files.

### C-X2 (done) framed-window opt-in
- `js/minigames/framework/base-minigame.js`: `static framed = false`; `init()` toggles
  `.minigame-framed` on the container (like `controlsOverlay`).
- `css/minigames-framework.css`: `.minigame-container.minigame-framed > .minigame-game-container`
  takes the same 9-slice frame mail-client/inbox-triage use (border-image `--se-frame-image`,
  `--ui-surface` background), width `min(720px, 96vw)`, centred, `max-height: calc(100% - 40px)`,
  scrolls inside the frame (base adds `.pixel-scroll`).
- `static framed = true` on assistant-chat, authenticator, sort-drill, privacy-panel,
  password-guesser, consequence-sandbox. (episode-runner and shredded-document intentionally NOT
  framed yet: episode-runner is C-ER1, shredded-document needs its own SD work first.)

### C-X4 / C-X6 (infra done; applied to titles) shared notice and title
- `css/utilities.css`: `.se-notice` (2px dashed `--ui-line`, square, GNF 16px, optional
  `.se-notice-label`) and `.se-window-title` (`--ui-heading-font` 16px, whole 24px line, no faux
  bold).
- C-X6 applied: SE window titles raised to 16px Press Start on grid (`.ib-title`, `.er-title`,
  `.ob-title`, `.pretext-title`, `.lpb-title`, intel-board `.ib-h` section headings 11->16);
  assistant-chat `.ac-title` 18.4px->18px, `.ac-reload-note` 14.4->14px.
- C-X4 (`.se-notice`) is NOT yet applied to the scenes' notices — see Open.

### C-X5 (done for the framed/awareness scenes) radius -> 0, 1px -> 2px, drop faux bold
- `awareness-skin.css` (`.aw-step`/`.aw-step-num`/`.aw-step-current`), `password-guesser` card
  and buttons, `episode-runner` `.epr-sbx-card` and `.epr-button`, `authenticator`
  (wordmark/phone/speaker/choice/group/legend/confirm), `assistant-chat`
  (`.ac-section`/`.ac-reply`), `shredded-document` instruction/empty 7px->8px. The soft inner
  shades and the `inset 0 0 24px` blurs are gone from intel-board and engagement-report (the
  outer `0 0 0 2px` ring stays — 0 blur, not a soft shadow); engagement result/finding cards
  squared.

### before / after STYLE breaches (1400x1000, audit --json)

| scene | before | after |
|---|---|---|
| assistant-chat | font-size:2 | none |
| authenticator | radius:3 | none |
| password-guesser | hairline:1, radius:3 | none |
| consequence-sandbox | hairline:1 | none |
| episode-runner | hairline:6, radius:13 | none |
| shredded-document | font-size:2 | none |
| engagement-report | font-size:1, radius:2, shadow:1 | none |
| intel-board | font-size:4, shadow:1 | none (shadow+titles fixed) |
| sort-drill, privacy-panel, landing-page-builder, capture-log | none | none |
| osint-browser | font-size:1 | font-size:1 (C-X8 address, deferred) |
| pretext-prep | font-size:1 | font-size:1 (C-X8 address, deferred) |
| mail-client | font:1 | font:1 (C-X8 address, deferred) |
| inbox-triage | gradient:1 | gradient:1 (flat gradient, known false positive per consoles log) |

The remaining after-breaches are all C-X8 (address font, deferred) or the inbox-triage flat
gradient the consoles build log already recorded as a false positive.

## 3. Tests

- test/js/minigame-se-close.test.mjs (6 tests, new): buildCloseControl is the pixel × not a text
  button; mountCloseControl appends to the given parent; `framed` default off and a framed scene
  tags the container; the shared CSS rules exist (close, framed, notice, title) and are pixel and
  square; no hand-rolled text Close button remains in the six SE scenes.
- Updated for the new X (per-scene close classes and the word 'Close' are gone):
  social-engagement-report, social-gap-engagement-report, social-intel-board, social-pretext-prep,
  social-return-to, social-episode-runner.
- Run (plain `node file`, no lock): minigame-se-close 6/6, minigame-shell-fit 30/30,
  minigame-close-shell 19/19, minigame-consoles-fit 18/18. Every social-*.test.mjs plus
  pretext-debrief-labels, minigame-controls-layout, minigame-launch-routes, minigame-pixel-art
  (~2453 tests): 0 fail after the six test updates.
- No new static imports were added, so no JS test harness copy-list change was needed.

## 4. After results / live proof

- Full after audit `--all --strict`: scratchpad ui-se/audit-after-all.{log,json} (fit SUMMARY,
  expected unchanged at 0 / 1 / 0 / 0 / 3 — no new fit breach; confirm the log before merge).
- SE-scene audit (16 scenes, 4 sizes): scratchpad ui-se/audit-after.{log,json}.
- Shots: scratchpad ui-se/shots (assistant-chat, authenticator, password-guesser, privacy-panel,
  sort-drill, consequence-sandbox, intel-board, engagement-report, pretext-prep, episode-runner
  at 1400x1000 and 390x844), shoot driver ui-se/shoot.mjs + specs.mjs, montage ui-se/montage1.png.
  Looked at the framed scenes (assistant, authenticator, password-guesser) and intel-board at
  1400: the shared × sits in each header right, the authenticator phone and wordmark are square,
  the titles are pixel at 16px, the frame wraps the content. NOT yet driven through real
  clicks/keys at all six sizes, and 667x375 / 360x740 not shot — see Open.

## Handover (handover point, 2026-11-14)

Tip of build/ui-se: the commit of this log. Commits: e509a4091 (C-X1), 02382a78a
(C-X2/X4/X6/X5), a9bc241a5 (test updates), 0c8ee1e04 (intel heading), this log.

### Done
- C-X1 (shared pixel X), C-X2 (framed opt-in on 6 scenes), C-X4/C-X6 shared classes and the
  C-X6 title sizes, C-X5 radius/hairline/faux-bold on the framed and awareness scenes, the soft
  shades off intel-board and engagement-report. Tests above, all green.

### Open (not started / not finished), rough order
1. C-X3 (coordinator A: one 9-slice frame for every SE window). The opt-in already exists: set
   `static framed = true` on intel-board, engagement-report, landing-page-builder, osint-browser
   and pretext-prep, then REMOVE each root's own plain-line border / outer ring / inset shade
   (intel-board-minigame.css ~:18-22, engagement-report-minigame.css ~:21, landing-page-builder
   ~:22, osint-browser root border, pretext-prep ~:24,:37) so the framed game-container is the
   only frame. CAUTION: these are wide multi-column windows; a 720px frame will reflow them, so
   shoot each at all six sizes and check the internal layout before trusting it (osint tabs+page,
   intel columns, lpb preview+panel). The shared frame rule is in minigames-framework.css.
2. C-ER1 (coordinator B: episode-runner kiosk bezel, full-bleed only in facilitated mode). The
   consoles log notes a facilitated flag `epr-facilitated`; grep episode-runner-minigame.js /
   step-strip for how facilitated mode is set (params/global). If a facilitated mode exists,
   frame episode-runner (via the opt-in or a kiosk-bezel class) in normal play and keep full-bleed
   only when facilitated; if there is NO such mode, frame it in every case and say so — do not
   invent a mode. episode-runner-minigame.js:214 is where the frame class is missing.
3. C04 (coordinator A: intel board merges duplicate fact lists, DISPLAY ONLY). Detail in
   scratchpad critique-a/findings.md (search "C04"). Merge the duplicate unknown-fact lists so
   each fact shows once; do not change which facts exist or how they unlock. Lives in
   intel-board-minigame.js (the People/Contacts/Company sections) and/or its model.
4. C-X4 apply `.se-notice` to every scope/safety/reload/empty-state notice: password-guesser
   "No real password...", episode-runner and pretext-prep "Authorised exercise...", assistant/
   sort-drill/inbox-triage reload note, engagement-report "Ledgerwell has no button...",
   landing-page-builder "You don't own this" + captures banner + "No captures yet". Class is
   ready in utilities.css; this is markup/class edits per scene.
5. C-X7 shared stepper (episode-runner pills, inbox-triage text tabs, landing-page-builder chips
   -> one boxed stepper). Not started.
6. C-X9 awareness one-button look (password-guesser / episode-runner / lpb). Not started.
7. Phone scenes (C-AU1 reuse phone-chat stepped shell for the authenticator; C-PH1 phone error
   toast inside the phone; C-PH2 Add to Notepad onto the phone; C-PH3 X off the bezel; C-PH4
   glow + empty state). These need the phone-chat shell logic — not started.
8. Shredded document C-SD1-3: the flip glyph (draw a pixel icon / the word 'Flip'), keyboard and
   touch strip reorder (brief allows this logic), larger flip hit area, drop the tilt blur and
   soft shadow. Only font-size 7->8 done so far. The brief asks for a shredded-doc keyboard
   reorder test too — not written.
9. Per-scene minors not yet touched: C-AC2 (two surfaces), C-AU2/3, C-CS1, C-ER2/3, C-RP1,
   C-IT1/2, C-IB1, C-LP1/2/3, C-MC1/2/3, C-OB1, C-PG1, C-PC1/2, C-PP1/2/3, C-PV1. Many are small
   CSS/width fixes; a few (C-PV1 switch wording, C-PP2/3 pretext header, C-MC1 account select)
   touch scene markup.
10. Proof still owed: reshoot at 667x375 and 360x740; drive each heavily changed scene through
    real clicks/keys and check X + Esc close a pop-up first then the scene; confirm the full after
    audit SUMMARY in audit-after-all.log.

### Excluded (user): C-X8 address font — leave as is until the user's GNF letter test lands.

### Resume
Keyless server on :3490 (this worktree, pid test/dummy/tmp/pids/server-3490.pid), game 3503
(test_seating). RBENV_VERSION=2.7.8. Shoot: `node <scratchpad>/ui-se/shoot.mjs --port 3490
--specs <scratchpad>/ui-se/specs.mjs --out <scratchpad>/ui-se/shots`. Audit gate:
`node tools/playtest/ui-rules-audit.mjs --port 3490 --game 3503 --all --strict --skip
person-chat,network-view --sizes 1400x1000,800x600,915x412,390x844`.

### Gotchas
- The social overlays set `disableClose: true`, so the framework `#minigame-close` is hidden and
  the overlay draws its own × via buildCloseControl — don't expect `#minigame-close`.
- Some scene tests use a fake DOM without `getAttribute`; assert on `className`/`textContent` not
  attributes (social-return-to).
- The framed opt-in puts the dark 9-slice frame around a scene's existing (sometimes light) inner
  card, so password-guesser shows a white card inside a dark frame — acceptable, but C-AC2 (one
  surface) and C-X3's final look may want the inner card restyled.
- `&times;` in the close button is innerHTML, not textContent, so a fake-DOM test reading
  textContent sees '' — check the class instead.
