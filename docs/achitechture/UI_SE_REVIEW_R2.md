# UI SE review round 2 (build/ui-se, tip cc51ec38d; main 372600713 merged)

Reviewer pass over the Fix round 1 work (docs UI_SE_BUILD_LOG.md "Fix round 1" + handover)
against UI_SE_REVIEW_R1.md, USER_PICKS_2026-11-14 and the pixel-art UI / ui-design-language
rules. LIVE on fresh `lab_social_engineering` games (strict audit game 3730; X/Esc drive game
3743) and a fresh `ca05_signin_pages` game (3732) for real episode content, keyless server on
:3490, at 1400x1000, 800x600, 667x375, 390x844, 360x740. Severities: B blocker, M major,
m minor, n note. Review only, no fixes applied. Paths under `public/break_escape/` unless noted.

## R1 findings — all closed

- **M1 osint-browser fit @667x375 — CLOSED.** Strict audit clean at all five sizes;
  `osint-browser-minigame.css` now `max-height: min(92vh,860px)` + `overflow-y:auto` so the tab
  strip and page nav are reachable and scroll inside the frame (667x375 shot: strip + address in
  view, scrollbar shown).
- **M2 pretext-prep bottom border cut @667x375 — CLOSED.** Audit clean; `.pretext-prep` margin 0
  + `max-height: calc(100% - 40px)`; 667x375 shot shows the bottom border in view, content scrolls
  inside, scope note in a dashed `.se-notice` box.
- **m3 shredded-document text "Close" — dead text gone, but see m1 below for the X look.** The
  `cancelText:'Close'` is dropped; the framework `#minigame-close` is tagged `.se-overlay-close`
  (`shredded-document-minigame.js:72`). It closes by X and Esc at all five sizes.
- **m4 wide-window radius/soft-shadow/hairline — CLOSED.** Strict `--strict` audit reports 0
  radius/shadow/hairline/font-size breaches on every SE scene (assistant-chat, landing-page-builder,
  pretext-prep debrief, episode-runner swept). Only residual flag is the inbox-triage gradient
  false positive (n1).
- **m5 mail-client 1px hairlines — CLOSED.** Audit `hairline 0` on mail-client at all five sizes.
- **n2 shared `.se-notice` — applied and legible.** `css/utilities.css:393` base (2px dashed, GNF
  16px, dark-theme ink). Scene overrides map it to the light surfaces' tokens
  (`episode-runner.css:192`, `password-guesser-minigame.css:68`, `sort-drill-minigame.css:124`,
  `engagement-report-minigame.css:294`). Verified legible on light (password-guesser worksheet,
  episode-runner kiosk screen, engagement-report cream, pretext-prep) and on dark (assistant-chat
  reload note). See m4 for the scenes still without it.

## Brief's specific checks

### C-ER1 kiosk (pick B: kiosk bezel in normal play, full-bleed only in facilitated) — behaviour PASS, two reads for the user (see m1, m2)
Driven with REAL episode content (`ca05_signin_pages`, `social.awarenessEpisode` = e5 Quayholt
Insurance), not the stub. At all five sizes `epr-kiosk` is on, the bezel is on-screen, the 7-step
strip wraps (3 rows at 390, 2 at 360) and the screen scrolls inside (667x375). A facilitated run
(episode.facilitated = true) drops `.epr-kiosk` and stays full-bleed, no bezel — correct split.
The bezel (`episode-runner.css:21`) copies the PC monitor's case exactly: `#3d3d3d` fill, 2px
`#161616` outline, inset 2px `#555`, the same stepped clip-path as `pc-monitor.css:28`. X and Esc
both close it (a Mission Brief notepad reappearing after close is the known intentional behaviour,
not a close failure).

### C-X8 (pick: GNF everywhere + letter check) — PASS
`css/fonts.css:89` `--se-font-address` is now `'GNF'` first. Every address element is >=16px and
uses that var: osint `.ob-site-url/.ob-handle/.ob-address-text` (`:131,:297,:103`,
`:43` family), mail `.mail-account-label/.mail-row-address/.mail-link-status` (16px, GNF,
`overflow-wrap:anywhere`/ellipsis), lpb `.lpb-address-text/.lpb-address-alt/.lpb-locked-domain`
(16px, `word-break:break-all`). Strict audit reports `font 0` on all SE scenes. Long URLs wrap:
osint at 390 shows each tab URL and the address on its own line with no sideways scroll; audit
`clipped 0 / overflow 0` on osint/mail/lpb at 1400 and 390. The cross glyph is replaced by a
plain `x` in `landing-page-model.js` (no `×`/`✗` remains in any SE content JS). The close control
renders `&times;` in Press Start 2P (`social-overlay.js:56`), which draws cleanly at every size.
Judgement on the `mail-bridge.js:726` strip-regex `/^\s*[✓✔✗✘]\s*/u`: correct to keep — it strips
an authored leading mark so the `mark-cross.png` pixel art is not doubled; it renders no glyph.

### m2 (light inner surfaces kept with a 2px edge) — acceptable, flag for eyeball (n4)
`assistant-chat-minigame.css:47` `.ac-section` `#f4f8f6` 2px border radius 0; `:68` `.ac-reply`
`#fff` 2px border + 4px accent edge, radius 0; password-guesser worksheet likewise squared with a
2px edge. These read as deliberate "paper/app-screen" panels, not cards floating on the frame. The
whole body of these windows (and engagement-report's cream) is light inside the dark 9-slice frame
— a two-tone look that is internally consistent and diegetic, but worth the user's eye on
screenshots against "one look per concept".

### `.se-notice` legibility — PASS (covered in n2 above).

## Findings

### m1 [minor] shredded-document's X is the themed steel close skin, not the flat-red SE X
The 14 social-overlay scenes draw their own `.se-overlay-close` element (flat `#e74c3c`, 4px solid
`#c0392b` border, white `×`, no border-image — measured live on assistant-chat / password-guesser /
authenticator). shredded-document instead reuses the framework `#minigame-close` and only *tags* it
`.se-overlay-close` (`shredded-document-minigame.js:72`). Because `data-ui-theme` is set globally
(`js/ui/display-settings.js:73`, value "general"), the rule `[data-ui-theme] .minigame-close-button`
(`css/ui-themes.css:1006`, specificity 0,2,0) out-specifies `.se-overlay-close` (0,1,0) and wins, so
shredded's X draws as the steel 9-slice themed button (red `×` on a steel frame). The tag is inert
and shredded's close does NOT match the "one close look across the SE windows" the m3 comment claims.
It still closes by X and Esc. Fix direction: either style `.se-overlay-close` to beat the themed
rule (e.g. `[data-ui-theme] .se-overlay-close` reset), or accept shredded as part of the base-minigame
family and drop the inert tag. file:line `css/ui-themes.css:1006`, `shredded-document-minigame.js:72`.

### m2 [minor] the kiosk reads closer to a dark-title-bar window than to the PC monitor device, and its X differs from the PC bezel's X
Two sub-reads against the brief's C-ER1 question. (a) The bezel borrows the PC monitor's colours and
stepped corners, but the case is thin (`.epr-kiosk-screen margin: 0 6px 6px`, `episode-runner.css:60`)
and there is no device signifier (the PC monitor has a webcam dot, `pc-monitor.css:47`), so at a
glance it reads as a window with a dark title bar more than as a distinct kiosk/monitor. (b) The X:
the kiosk uses the flat-red SE `.se-overlay-close`, which IS consistent with the shared SE X
(identical, both `#e74c3c`/4px solid), but the PC monitor's own X (`.minigame-close-button.pc-monitor-close`,
`pc-monitor.css:300`) is the themed steel skin from `ui-themes.css:1006`. So the two "monitors" in
the game close with two different X looks. Pick B's behaviour (bezel in normal play, full-bleed in
facilitated) is met; this is a design call for the user: add a device cue (webcam/thicker chin/label)
and/or reconcile the SE flat-red X with the PC/base themed steel X. file:line `episode-runner.css:21`.

## Notes

- **n1** inbox-triage `gradient 1` at all five sizes is the flat `linear-gradient(colour, colour)`
  scroll-shade (`css/inbox-triage-minigame.css:62,84`) the consoles log already recorded as a known
  audit false positive. Not a fit or style breach.
- **n2** `css/osint-browser-minigame.css:3` header comment still says addresses "are Source Sans 3
  (--se-font-address)"; the var is now GNF-first. Stale comment only (fallbacks in the var declaration
  at `:43,:280` still name Source Sans as the fallback, which is fine).
- **n3** The audit/drive cannot exercise landing-page-builder real content: with no build params the
  stub degrades to "This page is not available" with the X floating top-left (not in a header). Its
  fit and font audit pass at all sizes, but the real lpb header/fail-mark render was not seen live
  this round. Worth a real-content drive when lpb markup changes next.
- **n4** The light-bodied SE windows (password-guesser, assistant-chat, engagement-report) sit as a
  light surface inside the dark 9-slice frame (the m2 decision). Flagged for the user's screenshot
  eyeball, not a regression.

## Deferred batch still open (for the next fixer)

From the build log Open list and Fix round 1 "Still open", unchanged by this round:
- **C-X4 `.se-notice`**: applied only to the Fix-round-1 list of notices. Any notice not on that list
  (e.g. inbox-triage reload note, landing-page-builder captures banner) still needs the class.
- **C-X7 shared stepper** (episode-runner pills / inbox-triage text tabs / lpb chips -> one boxed
  stepper). Not started.
- **C-X9 awareness one-button look** (password-guesser / episode-runner / lpb). Not started.
- **Phone scenes C-AU1** (reuse phone-chat stepped shell for authenticator), **C-PH1-4** (phone error
  toast inside the phone; Add to Notepad onto the phone; X off the bezel; glow + empty state). Not started.
- **Shredded-doc C-SD1-3** (flip glyph / the word 'Flip'; keyboard + touch strip reorder; larger flip
  hit area; drop the tilt blur and soft shadow; the reorder test). Only font-size 7->8 done.
- **Per-scene minors** C-AC2 (the m2 two-surface call was made: keep light), C-AU2/3, C-CS1, C-ER2/3,
  C-RP1, C-IT1/2, C-IB1, C-LP1/2/3, C-MC1/2/3, C-OB1, C-PG1, C-PC1/2, C-PP1/2/3, C-PV1.
- **Out of scope (noted)**: the cross glyph in non-SE scenes (flag-wording, combination, cryptex) and
  the tick glyph in landing-page-model pass lines; the inert per-scene close CSS rules (`.ib-close`,
  `.er-close`, `.ob-close`, `.lpb-close`, `.pretext-close`, `.ac-close`) left in place to tidy.

## Counts

- Blockers (B): 0
- Majors (M): 0
- Minors (m): 2
- Notes (n): 4

## Evidence

- Strict audit (`ui-rules-audit.mjs --strict`, 15 SE scenes x 5 sizes, fresh game 3730):
  SUMMARY window-offscreen 0, frame-offscreen 0, clipped 0, x-on-frame 0, overflow 0. Only non-clean
  line is inbox-triage `gradient 1` at all sizes (n1). Log/json/shots: scratchpad r2/after.{log,json},
  r2/shots.
- X/Esc drive-through (drive.mjs, fresh game 3743): all 15 SE scenes x 5 sizes GREEN — opened, X
  present, frame on-screen, X closes, Esc closes (0 non-green of 75 cells). JSON: scratchpad r2/drive.json.
- Real-episode kiosk drive (ca05 game 3732): kiosk on + bezel on-screen + flat-red X (rgb(231,76,60))
  at all five sizes; facilitated run = no kiosk, full-bleed. Shots: scratchpad r2/epr/.
- Close-button computed-style probe: social overlays flat-red `.se-overlay-close` (no border-image);
  shredded reuses `.minigame-close-button se-overlay-close` under `data-ui-theme=general` (m1).
- Tests (plain `node --test`, one file at a time): minigame-se-close 12/12; all 153 social-*.test.mjs
  files 2336 pass / 0 fail.
