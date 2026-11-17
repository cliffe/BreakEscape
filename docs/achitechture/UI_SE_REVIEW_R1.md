# UI SE review round 1 (build/ui-se, tip c60b9048f)

Reviewer pass over critique C's built items (C-X1, C-X2, C-X3, C-X4/C-X6 infra + titles,
C-X5 partial, C-ER1, C04) against USER_PICKS_2026-11-14 and the pixel-art UI / ui-design-language
rules. LIVE on a fresh `lab_social_engineering` game (id 3577) on the keyless server :3490,
at 1400x1000, 800x600, 667x375, 390x844, 360x740. Severities: B blocker, M major, m minor,
n note. Review only, no fixes applied.

Paths below are under `public/break_escape/` unless noted.

## How the close X was covered (shell-x-check does not apply: SE scenes hide the framework X)

- A live click/key drive-through (`tmp/review/drive.mjs`, kept in scratchpad ui-se-review/drive.*)
  opened each SE window for real at all five sizes and, per window: clicked `.se-overlay-close`
  and confirmed the minigame closed, then reopened and pressed Esc and confirmed it closed.
  Result: all 14 overlay windows (assistant-chat, authenticator, sort-drill, privacy-panel,
  password-guesser, consequence-sandbox, intel-board, engagement-report, landing-page-builder,
  osint-browser, pretext-prep, episode-runner, mail-client, inbox-triage) close by both X and Esc
  at every size; shredded-document closes by Esc and by its framework control (it is not a
  social-overlay scene — see m4).
- The strict audit's `x-on-frame` count is 0 over every scene and size: the SE X (`aria-label`
  "Close") never sits on or over the window's frame border.
- No window frame for any SE scene is off-screen at any size (audit `frame-offscreen` hits only
  the non-SE alarm-panel and notes scenes).

## Verdicts

### Picks and built items — PASS

- **C-X1 shared pixel X (pick n/a, rule X-only).** PASS. `framework/social-overlay.js:52-66`
  `buildCloseControl` builds one `.se-overlay-close` pixel × (innerHTML `&times;`, aria-label
  Close, click -> requestClose); `mountCloseControl` appends it. CSS `css/minigames-framework.css:393-422`:
  30px square, 4px border, Press Start 16px, square corners, no radius/shadow, 44px touch target
  under 600px / coarse pointer. The 14 overlay windows render exactly this control and no text
  "Close" (verified live + `social-*` tests). Exception: shredded-document (m4).
- **C-X2 framed opt-in (pick n/a).** PASS. `framework/base-minigame.js:17,66` `static framed`
  toggles `.minigame-framed`; `css/minigames-framework.css:378-391` gives the 9-slice frame
  (`--se-frame-image` ... `8 fill / 16px`), `min(720px,96vw)`, `max-height: calc(100% - 40px)`,
  scrolls inside. On for assistant-chat, authenticator, sort-drill, privacy-panel,
  password-guesser, consequence-sandbox. Frame wraps content at all five sizes (live).
- **C-X3 = pick A (9-slice frame on every SE window).** PASS. The five plain-line windows now
  carry the shared mail/triage 9-slice frame with no outer ring / inner soft shade:
  `intel-board-minigame.css:21-22`, `engagement-report-minigame.css:20-21`,
  `landing-page-builder-minigame.css:22-23`, `osint-browser-minigame.css:21-22`,
  `pretext-prep-minigame.css:24-25`. mail-client and inbox-triage already had it; the theme
  picker now drives all of them. The wide windows keep their own widths (640-1180) with a
  no-`fill` frame so the multi-column layouts do not reflow — a sound call over a blanket 720 cap
  (see the builder's open point below).
- **C-X4 / C-X6 infra + titles.** PASS (infra + the C-X6 title sizes). `css/utilities.css:393-415`
  `.se-notice` (2px dashed, square, GNF 16px, 8px-grid label) and `:419-426` `.se-window-title`
  (heading font, 16px, 24px line, no faux bold). SE window titles are 16px on grid
  (`.ib-title`/`.er-title`/`.ob-title`/`.pretext-title`/`.lpb-title`, assistant-chat 18px).
  C-X4 `.se-notice` is not yet *applied* to the scenes' notices — deferred, see n2.
- **C-ER1 = pick B (framed kiosk in normal play, full-bleed only when facilitated).** PASS on
  behaviour. `episode-runner-minigame.js:320-323`: `.minigame-framed` toggled on when not
  facilitated, `.epr-facilitated` + full-bleed kept for a facilitated run. Caveat on the frame
  *style*: see m2.
- **C04 = pick A (merge duplicate case-file rows).** PASS. `intel-board/intel-board-minigame.js:623-629`
  drops the "??? / Not yet found" empty-slot rows; found facts still list, the "Missing: ..."
  readiness checklist is the single source. Display-only; `getTestState` still carries
  `emptySlots` (:811). `social-intel-board` updated and green.
- **C-X5 (done for the framed / awareness scenes).** PASS for those scenes (authenticator wordmark/
  phone/choice squared, password-guesser card/buttons, episode-runner sandbox card, assistant-chat
  section/reply, intel-board + engagement-report soft shades gone). Residual radius/soft-shadow on
  the wide windows is the still-open per-scene work — see m5, not a regression.

## Findings

### M1 [major] osint-browser clips its tab strip and page nav unreachably at 667x375
Strict audit: `mg-osint-browser 667x375 clipped 5`. The site tab strip buttons
(`nav.ob-strip > button.ob-site`), the page title and the page-nav links are cut on the Y axis by
the window and there is no scroll to reach them. Cause: `osint-browser-minigame.css:12-14`
`.osint-browser-game-container { height: min(92vh, 860px); overflow: hidden }` — a fixed-height
window with hidden overflow; at 375px tall the inner panes exceed it. This is **pre-existing**
(git show main: same `overflow: hidden`, border was 4px not 16px), so not a regression introduced
by C-X3 — but the C-X3 frame costs another ~24px of inner height and the builder never ran 667x375,
so it slips through the "no new fit breach" claim. Fix direction: let the window scroll (or cap
height so the strip stays) at short heights. file:line `osint-browser-minigame.css:13`.

### M2-fit [major] pretext-prep frame's bottom border is cut at 667x375
Strict audit: `mg-pretext-prep 667x375 overflow 1` — `.pretext-prep` runs y35-380 on a 375-tall
viewport (5px past the frame). Cause `pretext-prep-minigame.css:18-20` (`max-height: min(92vh,820px)`,
`margin: 4vh auto`, border-box) plus the framework container's `margin: 20px auto`
(`minigames-framework.css:145`): 20px + 4vh + 92vh > 100vh. This is the known-open **C-PP1**
(flagged at 915x412 in the critique) now also biting at 667x375; **pre-existing** and independent
of border width (border-box caps the total), so not a C-X3 regression. Fix direction as the
critique: `.pretext-prep` margin 0 or `max-height: calc(100% - 8vh)`. file:line
`pretext-prep-minigame.css:18`.

(Both M findings fail `ui-rules-audit --all --strict` at the brief's required sizes; the remaining
audit fit breaches — notes, network-architecture [NAD1, by design], alarm-panel, cryptex,
combination — are non-SE scenes outside this review's scope and pre-existing at 667x375.)

### m1 [minor] C-ER1 uses the generic SE 9-slice frame, not a distinct kiosk/monitor bezel
Pick B was worded "kiosk bezel in normal play" and the critique listed "kiosk or monitor bezel"
as a different option from "theme frame like other windows". The build applies the ordinary
`.minigame-framed` SE frame (`episode-runner-minigame.js:323`), i.e. the "theme frame" option.
The not-full-bleed / facilitated split is correct and one-look-per-concept is arguably served, but
this is not the literal "I am at a kiosk" bezel the pick names. Confirm with the user that the
shared SE frame is acceptable or whether a dedicated kiosk bezel is still wanted (no bezel art
exists yet).

### m2 [minor] password-guesser and assistant-chat: a light card inside the dark 9-slice frame
The builder's own open point. C-X2 wraps these in the dark SE frame, but their inner surface is a
light card: `assistant-chat-minigame.css:69-72` (`.ac-exchange` background `#ffffff`, radius 6px),
password-guesser's card likewise. It reads as unfinished (a white box floating in a dark frame)
and is the open **C-AC2** "one surface" item. Acceptable as interim per the build log; recommend
restyling the inner card to the dark surface (or giving the whole window the awareness skin)
before this ships. file:line `assistant-chat-minigame.css:69`.

### m3 [minor] shredded-document keeps a text "Close" (C-X1 not applied here)
`shredded-document/shredded-document-minigame.js:43` still sets `cancelText: 'Close'`; it is a base
minigame, not a social-overlay scene, so it shows the framework shell X plus a text "Close" rather
than the shared pixel ×. This is explicitly deferred (build log Open item 5: "shredded-document
needs its own SD work first"), not a regression — noting so it is not lost. Its font sweep is done
(Press Start 2P 8/16 only, audit clean). file:line `shredded-document-minigame.js:43`.

### m4 [minor] residual pixel-rule breaches remain on the wide SE windows (deferred C-X5 / C-LP / C-PP)
Not swept yet, matching the build log Open list (not claimed done, not regressions), latent because
the title-only audit start does not draw them:
- `pretext-prep-minigame.css:263-265` debrief result card: `border-radius: 10px` + soft
  `box-shadow: 0 8px 28px` (chrome, not diegetic).
- `landing-page-builder-minigame.css:104-314` chips/rows: `border-radius 2/3/4/6`, 1px borders.
- `assistant-chat-minigame.css:83` `.ac-disclaimer font-size: 0.8rem` (fractional), `:90`
  `font-weight: 600` (faux bold), `:154` `border-radius: 999px`.
These should be caught when C-X5 is extended to the wide windows. file:line
`pretext-prep-minigame.css:263`.

### m5 [minor] mail-client 1px hairlines (pre-existing, not introduced here)
Audit `mg-mail-client ... hairline 1` at all five sizes; e.g. `mail-client-minigame.css:682`
(`border: 1px solid`). The SE branch only touched this file to remove the old close-button size
rule (git diff vs main is the C-X1 edit), so the hairlines are pre-existing baseline, not a
regression. Note for a later mail-client pixel pass.

## Notes

- **n1** inbox-triage `gradient 1` at all sizes is the flat single-colour `.tri-brief` gradient the
  consoles build log already recorded as a known audit false positive (`inbox-triage-minigame.css`).
- **n2** C-X4 `.se-notice` class exists but is not yet applied to any scope/safety/reload/empty
  notice (password-guesser, episode-runner, pretext-prep, assistant-chat, etc.). Deferred, infra
  ready (build log Open item 1).
- **n3** C-X8 address font (osint/mail/lpb Source Sans) `font` audit breaches persist by design —
  deferred to the user's GNF letter test, per USER_PICKS C-X8.

## Counts

- Blockers (B): 0
- Majors (M): 2
- Minors (m): 5
- Notes (n): 3

## Evidence

- Strict audit (`ui-rules-audit.mjs --all --strict`, game 3577, five sizes): FAIL on 23 fit
  breaches across the whole registry; SE-scene fit breaches are only M1 (osint 667x375) and
  M2-fit (pretext 667x375). SUMMARY: window-offscreen 0, frame-offscreen 2 (non-SE),
  clipped 11 (3 surfaces), x-on-frame 0, overflow 10 (5 surfaces). Log + json:
  scratchpad ui-se-review/audit-all.{log,json}.
- Live X/Esc drive-through: all 14 SE overlay windows close by X and Esc at all five sizes; no SE
  X or frame off-screen. scratchpad ui-se-review/drive.{log,json}, shots in ui-se-review/shots.
- Tests (one file at a time, plain node): minigame-se-close 8/8; social-engagement-report 23,
  social-gap-engagement-report 18, social-intel-board 10, social-pretext-prep 17, social-return-to 17,
  social-episode-runner 48; plus regression spot-check social-assistant-chat 24, social-authenticator 9,
  social-sort-drill 27, social-privacy-panel 17, social-password-guesser 35, social-episode-sandbox 18,
  social-osint-browser 51, social-landing-page-builder 19, social-mail-client-shell 14, social-triage-ui 24,
  social-intel-board-engagement 12, social-header-panel-labels 2 — all 0 fail.
