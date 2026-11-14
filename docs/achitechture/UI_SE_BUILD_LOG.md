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
