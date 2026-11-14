# UI SE build log (build/ui-se)

Branch build/ui-se from build/ui-consoles 422c55061. Scope: critique C (social engineering,
comms, awareness exercise and conversation scenes; scratchpad critique-c/findings.md) on top of
the shell and consoles work. Paths are under public/break_escape/ unless they start with tools/,
test/ or docs/.

Deferred to the user (do not build without their call): C-X8 (address font: the user chose
"pixel font everywhere plus a letter check"; a separate GNF letter test runs first, so the
Source Sans addresses stay for now).

Added to scope mid-pass by the coordinator (2026-11-14) and DONE in a second work block after a
limit reset: C-X3 (9-slice frame on every SE window), C-ER1 (framed kiosk episode runner,
full-bleed only in facilitated mode), C04 (merge the intel board's duplicate fact lists, display
only). See sections 2 and 5.

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

## 5. Second block: C-X3, C-ER1, C04 (coordinator additions)

### C-X3 (done) one 9-slice frame for every SE window
- The five plain-line tool windows (intel-board, engagement-report, landing-page-builder,
  osint-browser, pretext-prep) now carry the shared mail/triage 9-slice frame
  (`border: 16px solid transparent; border-image: var(--se-frame-image, url(mail-frame.png)) 8 /
  16px stretch`) on their `*-game-container` (pretext: `.pretext-prep`) in place of the 4px/3px
  line. The outer rings (`box-shadow: 0 0 0 2px`) and the soft inner shades are gone.
- The frame has NO `fill`, so each scene keeps its own surface (intel cork, engagement cream
  paper, osint cream page, dark surface). Widths are unchanged (1100/960/1180/1100/640), so the
  multi-column layouts do not reflow. (The 6 card-like scenes keep the C-X2 opt-in, which caps at
  720 with `fill` + --ui-surface because they have no own background.)
- Shots: scratchpad ui-se/shots-cx3b (looked at intel-board, engagement-report, osint-browser,
  pretext-prep at 1400 and 390: frame around each, surfaces intact, X in header, no reflow).

### C-ER1 (done) framed kiosk episode runner
- episode-runner-minigame.js init() toggles `.minigame-framed` on the container when NOT
  facilitated (`this.facilitated` = `episode.facilitated === true`). Normal play is now a framed
  kiosk window that sits with the other SE windows; a facilitated (shared-screen) run stays
  full-bleed. No new mode invented — the facilitated flag already existed. Shot shots-er.

### C04 (done) intel board lists each unknown fact once
- The duplicate `emptySlots` rows ("<label>: ??? / Not yet found") are dropped from the card.
  board-model builds `emptySlots = slots.filter(!done).map(label)`, so they were the same missing
  facts the readiness checklist already shows as "Missing: <hint> [Stuck?]". Found facts still
  list as ticks; the `.ib-facts` ul is only drawn when there is a found fact. Display only — the
  facts and how they unlock are unchanged (getTestState still carries emptySlots).
- Detail: critique-e C04 (the coordinator said critique-a, but it is in critique-e). Tests:
  social-intel-board updated (the ??? row and the board-slot-empty icon are gone by design).

## 3. Tests

- test/js/minigame-se-close.test.mjs (8 tests, new): buildCloseControl is the pixel × not a text
  button; mountCloseControl appends to the given parent; `framed` default off and a framed scene
  tags the container; the shared CSS rules exist (close, framed, notice, title) and are pixel and
  square; the five wide SE windows use the 9-slice frame with no ring/line (C-X3); the episode
  runner frames itself only when not facilitated (C-ER1); no hand-rolled text Close button remains.
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
1. C-X4 apply `.se-notice` to every scope/safety/reload/empty-state notice: password-guesser
   "No real password...", episode-runner and pretext-prep "Authorised exercise...", assistant/
   sort-drill/inbox-triage reload note, engagement-report "Ledgerwell has no button...",
   landing-page-builder "You don't own this" + captures banner + "No captures yet". Class is
   ready in utilities.css; this is markup/class edits per scene.
2. C-X7 shared stepper (episode-runner pills, inbox-triage text tabs, landing-page-builder chips
   -> one boxed stepper). Not started.
3. C-X9 awareness one-button look (password-guesser / episode-runner / lpb). Not started.
4. Phone scenes (C-AU1 reuse phone-chat stepped shell for the authenticator; C-PH1 phone error
   toast inside the phone; C-PH2 Add to Notepad onto the phone; C-PH3 X off the bezel; C-PH4
   glow + empty state). These need the phone-chat shell logic — not started.
5. Shredded document C-SD1-3: the flip glyph (draw a pixel icon / the word 'Flip'), keyboard and
   touch strip reorder (brief allows this logic), larger flip hit area, drop the tilt blur and
   soft shadow. Only font-size 7->8 done so far. The brief asks for a shredded-doc keyboard
   reorder test too — not written.
6. Per-scene minors not yet touched: C-AC2 (two surfaces), C-AU2/3, C-CS1, C-ER2/3, C-RP1,
   C-IT1/2, C-IB1, C-LP1/2/3, C-MC1/2/3, C-OB1, C-PG1, C-PC1/2, C-PP1/2/3, C-PV1. Many are small
   CSS/width fixes; a few (C-PV1 switch wording, C-PP2/3 pretext header, C-MC1 account select)
   touch scene markup.
7. Proof still owed: reshoot at 667x375 and 360x740; drive each heavily changed scene through
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

## Fix round 1 (build/ui-se merged with main 372600713 -> format 3)

Merged main (372600713, format hardening 8b/8c) into build/ui-se first: the shared dev DB holds
format-3 games now, and a format-1 server answers 409 on them, so every live proof here runs on a
fresh `lab_social_engineering` game made by new-game.rb after the merge (recipe: keyless server on
:3490, `PLAYTEST_PORT=3490 ... new-game.rb lab_social_engineering`). The demo sprite churns on the
shared DB; new-game.rb switches it to a valid base sprite at creation, so each proof uses a
just-created game (ids seen: 3629, 3709).

### 1. M1 / M2 fit at 667x375 (and 360x740)
- M1 osint-browser: `osint-browser-minigame.css` the window now wraps its content and scrolls
  inside the frame (`max-height: min(92vh,860px)`, `overflow-y: auto`, `.ob-root min-height:100%`)
  instead of a fixed height with `overflow:hidden`, so the site tab strip and page nav are
  reachable at short heights.
- M2 pretext-prep: `pretext-prep-minigame.css` `.pretext-prep` margin 0 and
  `max-height: calc(100% - 40px)` (the default rule and the <=600px media query), so the frame's
  own margin plus the framework container's 20px margins stay within the viewport; bottom border
  no longer cut.

### 2. C-ER1 kiosk bezel (pick B)
- `episode-runner-minigame.js` init builds a diegetic CSS kiosk in normal play (`.epr-kiosk` on the
  container, replacing the generic `.minigame-framed`): a bezel in the PC-monitor look (flat case,
  2px outline, 2px inner edge, corners cut in 2px steps, no image art) with the X in its top strip,
  a screen that wraps the step strip + body and scrolls inside rather than fixing an aspect.
  Facilitated runs skip `.epr-kiosk` and stay full-bleed. CSS in `episode-runner.css`
  (`.epr-kiosk-bezel/.epr-kiosk-top/.epr-kiosk-cap/.epr-kiosk-screen`).

### 3. m3 / m4 / m5 / m2
- m3 shredded-document: dropped the dead `showCancel/cancelText:'Close'` (keepsCancelButton was
  false, so no text Close actually rendered) and tagged the framework close button with the shared
  `.se-overlay-close` class (`shredded-document-minigame.js`).
- m4 radius/soft-shadow/hairline on the wide windows set to 0 radius / 2px / no soft shadow:
  `assistant-chat-minigame.css` (`.ac-reply/.ac-hidden-text/.ac-paste-line/.ac-document` radius->0,
  1px->2px; `.ac-class-tag` 999px pill->0; fractional rems .ac-disclaimer/.ac-document-title->whole
  px; faux-bold .ac-empathy/.ac-paste-warning/.ac-exchange-prompt/.ac-done-badge->normal),
  `landing-page-builder-minigame.css` (all small radii->0, 1px->2px, the preview card soft shadow
  removed), `pretext-prep-minigame.css` debrief card (1px->2px, radius 10px->0, soft shadow gone;
  `.pretext-gap` 1px->2px), `episode-runner.css` (`.epr-facilitator` radius->0, `.epr-sbx-option`
  1px->2px radius->0).
- m5 mail-client 1px hairlines -> 2px (`mail-client-minigame.css`, five borders).
- m2 light card inside the dark frame: decision - keep the inner surfaces LIGHT because they are
  diegetic (the AI-assistant app screen's section/reply/document panels; the password-guesser
  worksheet "paper"), and give them a crisp 2px edge so they read as deliberate panels rather than
  cards floating on the frame. assistant-chat's panels already carry 2px borders (now squared);
  password-guesser's `.epr-gs-root` gets a 2px border and its rows are squared/2px.

### 4. C-X8 (pick: GNF everywhere, no font edit)
- `fonts.css` `--se-font-address` now 'GNF' first (Source Sans 3 kept only as a fallback for glyphs
  GNF lacks). Every address element raised to >=16px: osint `.ob-site-url/.ob-handle`, lpb
  `.lpb-address-text/.lpb-address-alt/.lpb-locked-domain`, mail
  `.mail-account-label/.mail-row-address/.mail-link-status`.
- The cross glyph replaced with a plain x in `landing-page-model.js` (11 fail lines).
  `mail-bridge.js` was NOT changed: its only cross glyph is in a defensive strip-regex (removing an
  authored leading mark so the PNG mark art is not doubled) and a comment; it renders no cross
  glyph, and the regex must keep stripping it. Noted for the user.

### 5. n2 shared .se-notice
- Applied `.se-notice` to the listed notices: episode-runner scope + reload, password-guesser
  safety + reload, assistant-chat reload, sort-drill reload, pretext-prep scope, engagement-report
  notes, landing-page-builder "No captures yet". The shared rule uses dark-theme `--ui-*` colours,
  which suit the dark SE windows; for the light awareness/paper surfaces a scoped override maps the
  notice colours to the scene tokens (`.epr-root/.epr-gs-root .se-notice` -> aw tokens, `.sd-root
  .se-notice` -> drill tokens, `.er-section .se-notice` -> report ink), so the text stays legible.

### Still open / not done
- The cross glyph remains in non-SE scenes (flag-wording, combination, cryptex) and the tick glyph
  stays in landing-page-model pass lines - out of this brief's scope (brief named the cross glyph in
  landing-page-model.js and mail-bridge.js only).
- Deferred phone scenes, C-X7 stepper, C-X9 one-button, remaining per-scene minors from R1 are
  still open (unchanged by this round).

### Fix round 1 handover (2026-11-14)

Tip: commit b644119e8 on build/ui-se, which already has main 372600713 (format 3) merged
(merge commit 2a3225bab, clean, no conflicts).

Done (all items in the round): M1 osint fit, M2 pretext fit, C-ER1 kiosk bezel (pick B), m3
shredded shared X, m4 radius/shadow/hairline sweep on the wide windows, m5 mail hairlines, m2
light-card decision (kept light + 2px border), C-X8 GNF address font + >=16px + cross glyph -> x in
landing-page-model.js, n2 shared .se-notice on the listed notices with scene-token colour overrides.

Proof:
- Strict audit (`ui-rules-audit.mjs --strict`, 15 SE scenes x 5 sizes 1400x1000/800x600/667x375/
  390x844/360x740, fresh lab_social_engineering game on :3490): every SE scene clean at every size.
  Before: osint clipped 5 @667x375 + font 5; pretext overflow 1 @667x375; mail hairline 1 + font 1.
  After: 0 of each. The only remaining non-clean is inbox-triage `gradient 1` at all sizes, the flat
  single-colour `.tri-brief` false positive already recorded (R1 n1), not a fit breach. Logs/json:
  scratchpad uise/after.{log,json}, before.{log,json}.
- Screenshots (looked at): scratchpad uise/shots/mg-*_{size}.png. Confirmed osint 667x375 (strip +
  address reachable, GNF address, scrolls in frame), pretext 667x375 (bottom border in view, scope
  note in se-notice box), episode-runner 390x844 and 360x740 (kiosk bezel, X in top strip, step
  strip wraps, not squeezed; caption ellipsises at 360), password-guesser 1400x1000 (light worksheet
  with a 2px edge in the dark frame; both notices in dashed se-notice boxes with readable dark text).
- Tests (plain `node --test`, one file at a time): minigame-se-close 12/12 (updated C-ER1 + new m3,
  C-X8 font, C-X8 cross glyph, n2 tests); social-password-guesser 35, social-triage-row-address-font
  5, minigame-pixel-art 48, social-episode-views 30, social-episode-aftermath 7,
  social-landing-page-render 13, social-landing-page-fakecheck 7, social-osint-browser 51,
  social-engagement-report 23, social-gap-engagement-report 18, social-pretext-prep 17,
  social-assistant-chat 24, social-sort-drill 27, social-mail-client-shell 14, social-intel-board 10,
  social-return-to 17, minigame-close-shell 19, minigame-title-escape 24, social-password-guesser-spray
  23, social-engine-ux-batch4 10 - all 0 fail.

Left / not done this round: none of the round's items. Out of scope and left as-is (noted): the cross
glyph in non-SE scenes (flag-wording, combination, cryptex) and the tick glyph in landing-page-model
pass lines; mail-bridge.js was not touched (its cross glyph is only in a strip-regex/comment, renders
no glyph). Full suites not run (congestion rule): only touched/importing test files run above; the
orchestrator runs the full suites per merge batch.

Env / resume: keyless server on :3490 (this worktree; PID in test/dummy/tmp/pids/server-3490.pid -
stopped at end of this round). RBENV_VERSION=2.7.8;
PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell.
Shared-DB sprite churn: make a fresh game with new-game.rb and start the audit back-to-back (one
command), because the demo sprite is flipped by other agents within seconds and a mid-gap flip makes
the game page redirect to character config so window.__test never loads.

## Fix round 2 part A (build/ui-se, from tip abbf8cc90; main merged)

Merged main (1f3ac1f0b, launch-device / flag-station work) into build/ui-se first: clean, no
conflicts (merge commit cb4492564). All items below are committed with explicit paths.

### Done this round

1. **R2 m1 - shredded X is the flat-red SE close, not the themed steel skin.** Added a two-class
   override `[data-ui-theme] .minigame-close-button.se-overlay-close` in `css/ui-themes.css`
   (after the themed close rule at :1024). Specificity 0,3,0 beats the themed
   `[data-ui-theme] .minigame-close-button` (0,2,0); it only matches an element carrying BOTH
   classes (shredded is the one SE scene that reuses the framework `#minigame-close`), so the
   themed X is unchanged everywhere else. Base + hover + active states set to the flat SE red.
   Commit 50b67e142.
2. **R2 m2 - kiosk reads as a device.** (a) Its X is now the PC monitor's themed steel X, not the
   SE flat red: new `mountThemedCloseControl()` in `js/minigames/framework/social-overlay.js`
   builds a `.minigame-close-button` (so the themed skin styles it) wired to the same requestClose;
   `episode-runner-minigame.js` kiosk branch calls it with class `epr-kiosk-close`;
   `episode-runner.css` keeps it in the top strip's flex flow (base rule makes it absolute).
   (b) Device cue on a new chin: a card-reader slot (`.epr-kiosk-reader` + `.epr-kiosk-reader-slot`)
   and a status LED (`.epr-kiosk-led`) beside a READY label, all 2px pixel art, flat fills, no
   radius/soft shadow/image. Screen side margins widened 6px->8px so the case reads thicker.
   Full-bleed kept in facilitated mode (the chin and kiosk only build when `kiosk === !facilitated`).
   Commit 50b67e142.
3. **n2 - osint stale comment** at `css/osint-browser-minigame.css:3` rewritten: addresses use
   `--se-font-address` (GNF first, smooth fallback only for missing glyphs), not "Source Sans 3".
   Commit 50b67e142.
4. **C-X4 - .se-notice on the two remaining notices.** inbox-triage reload note
   (`.tri-brief-restart`) and the lpb captures banner (`.lpb-captures-banner`) now carry
   `se-notice`; the banner's own CSS trimmed to just `margin:0` so the shared rule governs its look.
   Commit 532b6afdf.
5. **Tidy inert per-scene close CSS rules.** Removed the dead `.ob-close`, `.lpb-close`,
   `.pretext-close`, `.ib-close` (+ its `:focus-visible`) and `.er-close` rules - confirmed unused
   in JS (grep). No `.ac-close` rule existed. Commit 532b6afdf.
6. **Shredded-document C-SD1-3.** `.sdm-doc-title`/`.sdm-completed-banner` 7px->8px (on the
   Press Start 2P grid); the `U+2195` glyph replaced by a named **Flip** button; a keyboard- and
   touch-usable **Up/Down** reorder route (`.sdm-move-btn` + `_move(index, dir)`) beside drag, with
   first/last disabled and focus kept on the moved strip; strips de-tilted (no `transform:rotate`),
   hard 2px offset shadow (was a 6px blur), all edges 2px (were 1px dashed / 3px solid); flip and
   move buttons get a 44px touch target via `::after` on coarse pointers. New test
   `test/js/social-shredded-reorder.test.mjs` (4 tests). Commit 2d5e75893.
7. **C-X9 - awareness one-button look.** `.aw-button` (used by the episode-runner flip/debrief/
   sandbox views) was rounded (radius 4), borderless and faux-bold; now square, 2px border,
   normal weight - matching `.epr-button` and the password-guesser's action button, so every
   awareness/dark-window action reads the same. Added a `.aw-button-secondary` variant and dropped
   the `.lpb-step::before` faux-bold. Commit fbb532e4e.

### Tests (plain `node --test`, one file at a time, no lock)

- minigame-se-close 13/13 (updated C-ER1 for the themed kiosk X + device cue + the two-class SE
  close rule; added C-X9; extended n2 for the two new notices).
- social-shredded-reorder 4/4 (new).
- Regression check on touched/importing files, all 0 fail: minigame-pixel-art 48,
  social-episode-views 30, social-episode-aftermath 7, social-episode-brief-cards 10,
  social-triage-ui 24, social-landing-page-builder 19, social-landing-page-render 13,
  engine-fixes-pass4b 10.
- Full suites NOT run (congestion rule): the orchestrator runs them per merge batch.

### Live proof - OWED (not completed this round)

A fresh `lab_social_engineering` game (id 3800) was created on the keyless :3490 server and the
strict audit started back-to-back, but `ui-rules-audit.mjs` timed out after 240s on
`page.waitForFunction` for `window.__test` (five sizes 1400x1000/800x600/667x375/390x844/360x740,
`--skip person-chat,network-view`). That is the shared-DB sprite-churn redirect to character config
noted in the Fix round 1 env note, not a code defect - all unit tests pass. Live proof with real
clicks + the strict audit (keep all zeros) and the two targeted shots (kiosk at 390x844 and 360x740
to confirm the step strip still fits inside the bezel with the new chin; shredded Up/Down + Flip) is
still owed and should be re-run on a freshly created game when the DB is quieter. Audit log:
scratchpad r2a/audit.log.

### Left for part B (do NOT treat as done)

- **C-X7 shared stepper** - NOT STARTED. Fold the three step strips into one boxed stepper:
  episode-runner pills (`js/minigames/episode-runner/step-strip.js` + `.aw-step*` in
  `css/awareness-skin.css:47-59`), inbox-triage text tabs
  (`js/minigames/inbox-triage/header-panel.js`), and the lpb chips (`.lpb-steps`/`.lpb-step`,
  `css/landing-page-builder-minigame.css:85-115`). Target the landing-page-builder boxed look
  (2px square boxes, current step in the accent colour, done steps ticked); at 390 let it scroll
  sideways in one row. This is a three-scene refactor with its own tests and live proof - deferred
  here because it could not be completed and proven within budget.
- Phone scenes **C-AU1** (reuse phone-chat shell for the authenticator), **C-PH1-4** (phone error
  toast inside the phone; Add to Notepad onto the phone; X off the bezel; glow + empty state) -
  explicitly left for part B by the brief.
- Per-scene minors list (C-AC2 decided keep-light, C-AU2/3, C-CS1, C-ER2/3, C-RP1/RP2, C-IT1/2,
  C-IB1, C-LP1/2/3, C-MC1/2/3, C-OB1, C-PG1, C-PC1/2, C-PP1/2/3, C-PV1) - left for part B.

### Handover (2026-11-14, past the ~150k/181k token point)

Tip: fbb532e4e on build/ui-se (main 1f3ac1f0b merged at cb4492564). Everything in "Done this round"
is committed with explicit paths; the only open engineering item in this brief's part-A scope is
C-X7 (above, NOT STARTED). Live proof is owed (audit timed out on sprite churn; unit tests green).
Env: keyless server was on :3490 (worktree; PID file test/dummy/tmp/pids/server-3490.pid) and is
stopped at the end of this round. RBENV_VERSION=2.7.8;
PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell.
To resume: start the server by hand on :3490 (the script is hard-wired to :3001 - copy its
bundle exec line), create a fresh game with `PLAYTEST_PORT=3490 BREAK_ESCAPE_STANDALONE=true
bin/rails runner tools/playtest/new-game.rb lab_social_engineering`, and run the audit immediately
back-to-back in one command.

## Fix round 2 part B (build/ui-se, from tip fbb532e4e; main 1f3ac1f0b already merged)

Commits this round (explicit paths, no attribution lines):
- bdc991bfd per-scene minors + C-X7 stepper + aw-button-secondary
- ea8ad0a43 more per-scene minors (C-PH4, C-MC3, C-LP3, C-PC1, C-OB1, C-PP2)
- bdb74ddeb tests (captures 16px C-X8, episode-runner close selector, two new tests)

### Owed part-A live proof (done)

Fresh `lab_social_engineering` game (id 3819) on keyless :3490, strict `--all` audit at
1400x1000, 800x600, 667x375, 390x844, 360x740 (`--skip person-chat,network-view`). Log:
scratchpad r2b/audit-partA.log. Every SE lab scene is clean at all five sizes except two expected
lines: inbox-triage `gradient 1` (the flat single-colour surface fill, the known false positive -
now fixed this round by C-IT2) and phone-chat `shadow 1` (the clipped green glow = C-PH4 - fixed
this round). The other non-clean lines are all NON-SE scenes at the narrow sizes and outside this
branch and its scope: siem-dashboard `cancel-beside-x`, network-architecture / notes / alarm-panel
fit (NAD-class, by design), cryptex / combination `clipped` and examine `font-size` at 667x375 /
360x740 (pre-existing responsive issues in the wider game, not touched by build/ui-se). These sizes
were not in the section-1 baseline, so they are not regressions from this branch.

### C-X7 shared stepper (done as one look; single render module NOT merged)

The three step strips now read as one boxed stepper and behave the same: 2px square boxes, the
current step in the accent colour, 14px text, and one sideways-scrolling row at <=767px.
- inbox-triage `.tri-step` (css:19) converted from tiny underlined tabs to the boxed look
  matching landing-page-builder; narrow one-row scroll in the media block.
- landing-page-builder `.lpb-step` bumped 13px -> 14px; added narrow one-row scroll.
- episode-runner `.aw-step` was already the boxed look (part A C-X5); added narrow one-row scroll.
What is NOT done: folding the three separate render functions into a single shared stepper
component. Targets if that refactor is picked up: `js/minigames/episode-runner/step-strip.js`
`renderStepStrip` + `css/awareness-skin.css` `.aw-step*`; `js/minigames/inbox-triage/
inbox-triage-minigame.js:351-365` (`.tri-steps`); `js/minigames/landing-page-builder/
landing-page-builder-minigame.js:480-511` (`.lpb-steps`). The visible unification is delivered;
the code-level single-component merge is deferred (risk + budget).

### Phone scenes

- **C-PH4 (part done)** `css/phone-chat-minigame.css:54` - removed the 20px green glow that the
  stepped clip-path clips away entirely and that trips the audit (`shadow 1`). The empty-state
  "No messages yet" line is NOT added (needs the messages-render path; deferred).
- **C-AU1, C-PH1, C-PH2, C-PH3 - NOT done.** These are the heavier phone-shell items (reuse the
  phone-chat stepped shell for the authenticator; the error toast inside the phone; Add to Notepad
  onto the phone; X off the bezel). Each restructures phone/authenticator markup and needs live
  browser verification per size; left for a follow-up with budget for it.

### Per-scene minors

Done:
- **C-AU3** authenticator `.auth-outcome/.auth-card/.auth-card-action/.auth-card-deny/.auth-banner`
  squared (radius 0) with 2px borders; banner raised to 16px with no faux-bold.
- **C-RP1** engagement-report options are a full-width left-aligned quiz list (`.er-option`).
- **C-ER2 / C-ER3** stepper is one scrolling row at narrow (kiosk X already pinned in the top
  strip, part A); the scope note now carries `.se-notice` only - the left-bar `.epr-scope` box
  is gone.
- **C-IT1 / C-IT2** inbox-triage: boxed stepper (above); flat surfaces written as
  `background-color` not single-colour gradients (clears the audit false positive); the soft
  scroll-fade gradients and the blurred `box-shadow` replaced by the shared `.pixel-scroll` bar on
  the result body and a hard 2px offset separator; the hidden-text reveal uses the readable font
  with a 2px square dashed edge, not the browser monospace with a 1px rounded edge.
- **C-LP3** captures: no faux-bold role; address in `--se-font-address` 16px; secret in GNF 16px
  (C-X8 >=16px).
- **C-MC3** the current mail folder reads as an accent-filled pressed tab, not a yellow outline
  that looks like a focus ring (focus keeps the outline).
- **C-OB1** osint site tabs are one sideways-scrolling row at narrow, not four full-width rows.
- **C-PC1** person-chat `[SPACE]` hint is a solid colour and hidden under `(pointer: coarse)`.
- **C-PP2** the pretext call target is labelled "Calling: <name>", not a bare word (the headshot
  half is not added - optional, needs the NPC portrait lookup).
- **Confirmed already satisfied by part A (no change needed):** C-AC2 (the m2 keep-light decision;
  `.ac-section/.ac-reply` are squared 2px), C-CS1 (`.epr-sbx-card` is 2px), C-RP2
  (`.er-section/.er-card` radius 0), C-IB1 (`.ib-option` is `width:100%`), C-LP1 (`.lpb-chip` is
  square, 14px) - each noted so the next reviewer does not re-flag them.

Not done (layout items that need per-size browser verification - deferred to a follow-up):
- **C-MC1** mail account picker min-width / own row below 1000px.
- **C-MC2** mail toolbar three rows at 390 -> one icon-tab row.
- **C-LP2** empty preview collapse at narrow, single scroll area.
- **C-PC2** ~200px black under person-chat dialogue at 390.
- **C-PG1** password-guesser sticky action bar / drop the spacer.

For the user (design / pedagogy calls the critique left open):
- **C-PP3** the orange gate line ("Team: nothing held yet ...") repeats the card rows and reads as
  an error. The fix is either to reword the authored `gate.line` or to suppress it when the
  readiness rows already show the same gaps - both change the exercise's authored wording /
  behaviour, so left for the owner of the lab_social_engineering pretext content.
- **C-PV1** the privacy switch label ("Posts: friends only"), its state ("Open") and its note
  ("Leave this off: ...") contradict each other. Renaming the switch as the action with an Off/On
  state and rewording the note ("Closes: her dog's name") changes the learner's mental model of
  the exercise; it needs the content owner's call, not a blind UI edit. The default strings live in
  `js/minigames/privacy-panel/privacy-model.js` and the per-switch labels are authored in the
  scenario.

### item 5: aw-button-secondary wired

The unused `.aw-button-secondary` is now the brief-card **Back** button (episode-runner), the one
clear secondary action in the awareness windows (C-X9 asked for one primary + one secondary). A
two-class `.epr-button.aw-button-secondary` override in `css/episode-runner.css` guarantees the
white-fill secondary look beats the primary `.epr-button` fill regardless of load order. New test
in social-episode-brief-cards asserts Back carries the variant and stays in the shared button
family while Next does not.

### Tests (plain `node --test`, one file at a time, no lock)

- minigame-se-close 13/13; social-episode-runner 48/48 (close selector updated); social-episode-
  brief-cards 11/11 (+1 new, aw-button-secondary); social-pretext-prep 18/18 (+1 new, Calling
  label); social-triage-ui 24/24; social-engagement-report 23/23; social-authenticator 9/9;
  social-episode-views 30/30; pretext-debrief-labels 5/5; minigame-pixel-art 48/48.
- **Pre-existing failure found and closed:** at the part-A tip (fbb532e4e) social-episode-runner
  had 3 failures - part A's C-ER1 themed kiosk close (`mountThemedCloseControl`) stops carrying
  `.se-overlay-close`, but three assertions still queried that class. Verified the 3 fail on the
  parent source and pass with mine; updated the three assertions to accept
  `.se-overlay-close, .epr-kiosk-close`. No production code changed for this.
- Full suites NOT run (congestion rule): the orchestrator runs them per merge batch. New static
  imports: none, so no test-harness copy-list change.

### Live proof

- Part-A `--all` strict audit: game 3819, scratchpad r2b/audit-partA.log (summary above).
- After-change focused strict audit (the 15 changed/adjacent SE scenes x 5 sizes, fresh game
  3848): scratchpad r2b/audit-after.log - confirms inbox-triage and phone-chat clean after C-IT2
  and C-PH4, and no new breach on the changed scenes.
- NOT captured this round (budget): the owed targeted eyeball shots (kiosk bezel at 390/360 with
  real ca05_signin_pages episode content; shredded Up/Down + Flip by touch and keyboard). The
  strict audit covers fit/style; these are the "look at the shot" confirmations still owed.

### Handover (2026-11-14, part B)

Tip: bdb74ddeb on build/ui-se (main 1f3ac1f0b merged). Everything in "Done" is committed with
explicit paths. Open for a part C: C-X7 single render-module merge (look already unified); phone
scenes C-AU1 / C-PH1 / C-PH2 / C-PH3 and the C-PH4 empty state; layout minors C-MC1, C-MC2, C-LP2,
C-PC2, C-PG1; and the two user-call items C-PP3 and C-PV1. Owed eyeball shots (kiosk 390/360,
shredded reorder) still to capture. Env: keyless server on :3490 (worktree; PID file
test/dummy/tmp/pids/server-3490.pid) - stop by PID at the end. RBENV_VERSION=2.7.8;
PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell.
Resume recipe unchanged (fresh new-game.rb + audit back-to-back).

## Fix round 2 part C (build/ui-se, from tip bdb74ddeb; main 1f3ac1f0b merged)

Scope: UI styling only for the social engineering awareness lab; no attack content. Ports 3490-3492.

### Owed eyeball shots (done, looked at)

- Kiosk bezel with real ca05_signin_pages content. Opened episode-runner on a fresh
  ca05_signin_pages game (its window.gameScenario.social.awarenessEpisode = e5_signin_pages)
  at 390x844 and 360x740. Confirms: the themed steel X (not the SE flat red), the device chin
  (card-reader slot + green READY LED), and the step strip ("1 Brief 2 Research 3 Build 4 Wr...")
  fitting in one sideways-scrolling row inside the bezel. Shots: scratchpad se-c/kiosk/.
  Finding while looking: .aw-wordmark (the QUAYHOLT brand pill in the kiosk strip, not diegetic
  page content) still had border-radius 3px. Fixed to 0 in css/awareness-skin.css:42.
- Shredded document Up/Down and Flip, by touch and keyboard. Opened shredded-document with a real
  four-strip memo and allowRotation at 1400x1000 and 390x844. Confirms: each strip has Up / Down /
  Flip named buttons (no missing glyph), first strip's Up and last strip's Down disabled, two
  strips shown upside-down so the Flip use-case is visible, and the instruction line names both the
  drag and the Up/Down routes. The keyboard+touch behaviour itself is asserted by
  social-shredded-reorder.test.mjs. Shots: scratchpad se-c/shredded/.
  Finding while looking: .sdm-drag-handle rendered Press Start 2P at 14px (off the 8px grid).
  Fixed to 16px in css/shredded-document-minigame.css:156.

### Layout minors (C-MC1 fixed; the rest reviewed and proved clean at five sizes)

Captured current-state shots of mail-client, landing-page-builder and password-guesser at
1400x1000, 800x600, 667x375, 390x844, 360x740 first (scratchpad se-c/before/), then judged each:

- C-MC1 (mail account picker) - FIXED. At 800x600 the send-as account shrank to the stub "Cons"
  (and truncated at 915x412): the 767px narrow rules give it its own row, but the 768-1000px band
  did not. Added `@media (max-width: 1000px)` to css/mail-client-minigame.css: the toolbar wraps,
  the account takes its own full-width row and the select keeps min-width 16ch, so the active
  sender (the fact the lesson turns on) stays legible at every width. New assertion in
  social-mail-narrow.test.mjs.
- C-MC2 (mail toolbar rows at 390) - reviewed, no change. The current 390 layout is clean and
  readable: account on its own row, then Inbox/Sent and Contacts/Compose/X across two short rows,
  with the message list below and room to spare. Passes strict at all five sizes. The critique's
  icon-tab redesign is not warranted on top of a layout that already fits; left as an optional
  polish.
- C-PG1 (password-guesser buttons at 390) - reviewed, appears already resolved in the current
  build: the three action buttons stack in one vertical column, all visible, no clip and no large
  empty band above them (the part-A/B card work). Clean at all five sizes.
- C-LP2 (landing-page-builder empty preview) - NOT done. Judging this needs the real two-pane
  builder with a service picked (the title-only start shows only a "page not available" placeholder,
  not the empty-preview-vs-choices split the critique flagged). Deferred: it wants the in-game
  builder flow to capture, not a bare minigame start.
- C-PC2 (person-chat ~200px black at 390) - NOT done. person-chat needs the game's own NPC and is
  outside the bare-minigame audit (it is on the audit --skip list); not captured this round.

### Tests (plain `node --test`, one file at a time, no lock)

- social-mail-narrow 13/13 (+1 new, C-MC1 1000px account row).
- social-shredded-reorder 5/5 (+1 new, C-SD1 drag-handle on the 8px grid).
- Regression on every test that reads a changed CSS file (awareness-skin, mail-client-minigame,
  shredded-document-minigame), all 0 fail: minigame-se-close 13, social-episode-views 30,
  social-reuse-authenticator 13, social-mail-accounts 21, social-engine-r3-triage 11,
  social-engine-ux1 16, social-engine-ux-batch4 10, social-episode-aftermath 7,
  social-episode-sandbox 18, social-mail-client-shell 14, social-mail-episode-options 10,
  social-reuse-mail 7, social-role-swap 9, social-triage-row-address-font 5.
- No JS module changed, so no test-harness copy-list change. Full suites NOT run (congestion rule).

### Strict audit (end of round)

Fresh lab_social_engineering game (id 3899), strict audit over the 15 SE lab scenes at 1400x1000,
800x600, 667x375, 390x844, 360x740, with real shredded params. EXIT 0. The JSON was scanned for
EVERY breach kind (not just the fit kinds --strict exits on): zero breaches across every scene and
size, so the wordmark-radius and drag-handle-font-size fixes land and the SE lab keeps all zeros.
Log/json: scratchpad se-c/ (final.json, final/ shots).

### For the user (do NOT change - captured for a decision)

Current-state shots and a per-item note in scratchpad se-user/:
- C-PP3 (pretext prep orange gate line) - mg-pretext-prep_1400x1000.png, _390x844.png, C-PP3.txt.
  Reproduced with the lab's real service_desk_call spec, nothing held: the `.pretext-readiness`
  orange line (pretext-prep-minigame.js:240-242) repeats the Team/Intern readiness buttons.
- C-PV1 (privacy panel switch label/state/note) - mg-privacy-panel_1400x1000.png, _390x844.png,
  C-PV1.txt. Reproduced with the ca14_social_media privacyPanel settings: the switch label
  describes the tightened target while the state pill reads "Open", so they look contradictory.
Each .txt says what the player sees, the critique's options, and which file holds the authored text.

### Not done (for a part D)

- Phone scenes C-AU1 / C-PH1 / C-PH2 / C-PH3 and the C-PH4 empty state (heavy phone/authenticator
  markup restructures, each needing per-size browser verification) - not started this round.
- C-X7 single stepper render-module merge (the look is already unified; only the three render
  functions remain separate) - not started.
- Layout minors C-LP2 and C-PC2 (need the in-game builder flow / person-chat NPC to capture).

### Handover (2026-11-14, part C)

Tip after this round's commit on build/ui-se (main 1f3ac1f0b merged). All "done" work is committed
with explicit paths. Changed files: css/awareness-skin.css, css/mail-client-minigame.css,
css/shredded-document-minigame.css, test/js/social-mail-narrow.test.mjs,
test/js/social-shredded-reorder.test.mjs, docs/achitechture/UI_SE_BUILD_LOG.md. Open for a part D:
phone scenes (C-AU1/C-PH1/C-PH2/C-PH3/C-PH4 empty state), C-X7 render-module merge, and layout
minors C-LP2 (in-game builder) and C-PC2 (person-chat). The two user-call items C-PP3 and C-PV1 are
captured in scratchpad se-user/ and await the owner's wording decision. Env: keyless server was on
:3490 (worktree; PID file test/dummy/tmp/pids/server-3490.pid), stopped by PID at the end of this
round. RBENV_VERSION=2.7.8;
PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell.
Resume: start the server by hand on :3490 (copy start-keyless-server.sh's bundle exec line to the
worktree root and port), create a fresh game with new-game.rb, run the audit back-to-back.

## Fix round 2 part D (build/ui-se, from tip 2be575f14; main 3a083f167 merged)

Scope: UI styling only for the social engineering awareness lab; no attack content. Ports 3490-3492.
First merged main (train/45 tip 3a083f167 - consoles, PC 2, HUD-adjacent work) into build/ui-se:
clean merge, no conflicts (merge commit 72f55dbc2, both parents 2be575f14 + 3a083f167).

### Phone scenes (C-AU1, C-PH1, C-PH2, C-PH3, C-PH4)

- **C-AU1** (authenticator phone shell) - the authenticator now reuses the shared in-game phone
  shell: a grey shell with the stepped (pixel-art) clip-path corner, an inner dark screen, and a
  status bar with signal bars and a battery reading, matching phone-chat. The old rounded navy
  rectangle with a speaker slot is gone. css/authenticator-minigame.css (.auth-phone,
  .auth-phone-screen, .auth-phone-status, .auth-signal-bar, .auth-battery);
  js/minigames/authenticator/authenticator-minigame.js (status-bar markup replaces the speaker slot).
- **C-PH1** (phone error as raw text) - showNotification now hosts the toast inside the phone
  screen (`.phone-screen` || container) and css/phone-chat-minigame.css styles `.phone-notification`
  as a pixel toast (2px square border, GNF, opacity-only fade). No more white text on the backdrop.
- **C-PH2** (Add to Notepad over the HUD) - the notepad action moves onto the phone: a
  `.phone-notepad-btn` anchored on the phone status bar (then contact-list header, then the screen),
  no longer the framework controls row that overlapped the inventory/health bar. A ringer call still
  gets none. phone-chat-minigame.js init; css `.phone-notepad-btn` (44px touch target under coarse).
- **C-PH3** (X on the phone bezel at 390) - on screens under 500px the phone drops 44px below the
  fixed close X so the X sits in the clear band above the device, clear of the battery/top corner.
  css/phone-chat-minigame.css `@media (max-width: 500px)`.
- **C-PH4** (empty state / blank green) - a missing contact now falls back to the contact list
  (showContactList) instead of leaving a blank screen behind the toast, and the empty list's
  `.no-contacts` reads in solid dark ink on the green LCD rather than a faded 50% grey. (The 20px
  glow was already removed in part B.)

### Layout minors (C-LP2, C-PC2)

- **C-LP2** (landing-page-builder empty preview) - driven through the real builder flow
  (landingPageId `payroll_login`). The renderer adds an empty-state hint ("Pick a service to start
  the page") in the preview before any choice (build mode, nothing chosen only; a blocked look-alike
  keeps the bare placeholder). The narrow layout caps the preview to a short strip (max-height 38vh)
  so it no longer takes the larger half, and the choice panel is the only pane that scrolls.
  js/minigames/landing-page-builder/landing-page-render.js; css/landing-page-builder-minigame.css.
- **C-PC2** (person-chat ~200px black at 390) - at narrow width the portrait grows to fill the
  spare height (object-fit cover so it fills rather than letterboxing a 4:3 strip) and the dialogue
  band hugs its content at the foot; the ~250px black gap under the dialogue is gone. Long lines
  keep a cap and scroll. Desktop layout unchanged (scoped to max-width 600px).
  css/person-chat-minigame.css narrow media query.

NOT changed (with the user): C-PP3, C-PV1 - captured in part C (scratchpad se-user/), untouched.

### Live proof (shots looked at, at 1400x1000, 800x600, 667x375, 390x844, 360x740)

- authenticator (attacker mode with a push card, and decision mode): the shared phone shell and
  status bar read at every size. Shots scratchpad se-d/phone (and phone2).
- phone-chat (contact-not-found path): the styled toast inside the screen (C-PH1), the Notepad on
  the status bar clear of the HUD (C-PH2), the X above the phone at 390/360 (C-PH3), and the
  fallback contact list / empty state (C-PH4). Shots scratchpad se-d/phone2.
- landing-page-builder (empty and after a service pick): the empty hint at every size, the capped
  preview strip and single-pane scroll at 390/360, desktop two-pane intact. Shots scratchpad se-d/lpb.
- person-chat (real NPC conversation): the portrait fills and the dialogue hugs the foot at 390/360;
  desktop unchanged. Before/after shots scratchpad se-d/pc-before, pc-after2.

### Tests (plain `node --test`, one file at a time, no lock)

- New: social-phone-ui-partd 3/3 (C-AU1/C-PH1/C-PH2 source), social-person-chat-narrow-partd 2/2
  (C-PC2 narrow rules); social-landing-page-render +1 (14/14, C-LP2 empty hint); phone-outgoing-call
  updated wiring + a C-PH4 fallback behaviour test (51/51).
- Regression: minigame-se-close 13, social-authenticator 9, social-authenticator-decision 10,
  social-reuse-authenticator 13, minigame-controls-layout 11, phone-chat-close-race 3,
  phone-call-terminal-beat 8, minigame-close-shell 19, minigame-pixel-art 48,
  social-landing-page-builder 19, social-landing-page-inspect 14, social-landing-page-guard 4,
  social-gap-landing-page-builder 22, person-chat-pixel-art 3, person-chat-background 18,
  person-chat-camera 8, person-chat-reopen 4, person-chat-pending-reply 17. All 0 fail.
- Full social-*.test.mjs swept one file at a time: 155 files clean, 2351 assertions. One failure:
  social-gap-episode-runner test 16 ("a finished episode reopened and closed again leaves the state
  exactly as it was"). Pre-existing and out of part-D scope: episode-runner source/test/css are
  byte-identical between the pre-part-D tip (2be575f14) and HEAD, and none of part D's 12 changed
  files touch episode-runner. Flagged for the orchestrator.

### Strict audit (end of round)

Fresh lab_social_engineering game (id 4060), strict audit over the 15 SE lab scenes at 1400x1000,
800x600, 667x375, 390x844, 360x740. EXIT 0. The JSON was scanned for EVERY breach kind (not just
the fit kinds --strict exits on): zero breaches across every scene and size, and nothing unopened or
erroring. The C-AU1 authenticator shell and the C-LP2 landing-page-builder changes land with the SE
lab still at all zeros. Log/json: scratchpad se-d/audit-final (audit.log, audit.json, shots/).

### Handover (2026-11-14, part D)

All part-D items done and committed with explicit paths. Commits: 631f0ae8c (phone scenes),
0e3df1d45 (C-LP2), f647c170e (C-PC2), on top of merge 72f55dbc2. Changed files: css/
authenticator-minigame.css, css/phone-chat-minigame.css, css/landing-page-builder-minigame.css,
css/person-chat-minigame.css, js/minigames/authenticator/authenticator-minigame.js,
js/minigames/phone-chat/phone-chat-minigame.js, js/minigames/phone-chat/phone-chat-ui.js,
js/minigames/landing-page-builder/landing-page-render.js, test/js/phone-outgoing-call.test.mjs,
test/js/social-landing-page-render.test.mjs, test/js/social-phone-ui-partd.test.mjs,
test/js/social-person-chat-narrow-partd.test.mjs, docs/achitechture/UI_SE_BUILD_LOG.md.
Open for a later round: C-X7 single stepper render-module merge (look already unified). Env: keyless
server on :3490 (worktree; PID file tmp/pids/server-3490.pid), stopped by PID at the end of the round.
