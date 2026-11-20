# UI SE review round 3 (build/ui-se, tip 7a3bc35cc; merged with train/45 3a083f167)

Reviewer pass over Fix round 2 parts A, B, C and D (build log UI_SE_BUILD_LOG.md) against
UI_SE_REVIEW_R2.md, the pixel-art UI rule and ui-design-language. LIVE on fresh
`lab_social_engineering` games on a keyless :3490 worktree server, a fresh game created right
before each run (strict audit game 4077; X/Esc drive game 4103; close probe game 4101; phone
empty/fallback game 4110). Sizes 1400x1000, 800x600, 667x375, 390x844, 360x740. Severities:
B blocker, M major, m minor, n note. Review only, no fixes applied. Paths under
`public/break_escape/` unless noted.

## Known regression pinned down first

**social-gap-episode-runner.test.mjs test 16 ("a finished episode reopened and closed again
leaves the state exactly as it was") fails 19/1 on this branch.**

- **Cause (file:line):** `test/js/social-gap-episode-runner.test.mjs:356` clicks `.se-overlay-close`.
  The runner's kiosk branch stopped drawing that class in Fix round 2 part A (commit 50b67e142):
  `js/minigames/episode-runner/episode-runner-minigame.js:346` now calls
  `this.mountThemedCloseControl(top, 'Close', 'epr-kiosk-close')`, which builds a
  `minigame-close-button epr-kiosk-close` element (the themed steel X, R2 m2 fix) with no
  `.se-overlay-close`. The kiosk opens in normal (non-facilitated) play, so the test's `click`
  helper finds no `.se-overlay-close` and throws `no .se-overlay-close in episode-runner` before
  the state assertion ever runs. Confirmed live: `node --test` error is the click helper at line
  166, not a state mismatch.
- **Rating: m (minor). A test that pins old DOM, not a player-facing behaviour change.** The
  kiosk still closes by its (themed) X and by Esc; the R2 m2 class change was deliberate and the
  close works (see the drive and probe below). The sibling file
  `test/js/social-episode-runner.test.mjs` was updated in part B to query
  `.se-overlay-close, .epr-kiosk-close` (three sites: :247, :301, :504); the gap file was missed.
  Because the test errors before its assertion, the "reopen + close leaves state unchanged" check
  is currently not exercised on the kiosk path. Fix direction: change the selector at
  `social-gap-episode-runner.test.mjs:356` to `.se-overlay-close, .epr-kiosk-close` (production
  code untouched). This must be fixed before the merge batch, since the JS suite has to be green;
  the fix is a one-line test edit with no product risk.

## R2 findings — both closed

- **R2 m1 (shredded X should be the flat-red SE close, not the themed steel skin) — CLOSED.**
  The two-class override `[data-ui-theme] .minigame-close-button.se-overlay-close`
  (`css/ui-themes.css`, specificity 0,3,0) now wins. Live: shredded's X renders as the flat SE
  red (shot `r3/shots/mg-shredded-document_1400x1000.png`), and the close probe confirms shredded
  closes by `.se-overlay-close`. Only the shredded scene carries both classes, so the themed X is
  unchanged elsewhere.
- **R2 m2 (kiosk should read as a device; its X vs the PC bezel's X) — CLOSED.** Live at every
  size the kiosk draws the themed steel X (same skin as the PC monitor), a device chin with a
  card-reader slot and a green READY LED, and the boxed step strip scrolls in one row inside the
  bezel at 360/390 with the shared pixel scrollbar (shots `r3/shots/mg-episode-runner_1400x1000.png`,
  `_360x740.png`). The two "monitors" (PC and kiosk) now close with the same themed X, so the
  device look is consistent. Facilitated mode still drops the bezel (not re-driven this round; the
  kiosk/chin only build when `kiosk === !facilitated`, part A).

## Fix round 2 checks — all verified

- **C-X4/C-X7/C-X9 (notices, stepper, one-button look):** strict audit clean; the three step
  strips read as one boxed stepper and scroll one row at narrow (episode-runner, inbox-triage,
  landing-page-builder). The single render-module merge is still deferred (look delivered) — see n5.
- **C-AU1 (authenticator phone shell):** live the authenticator reuses the shared phone shell —
  grey shell, stepped pixel-art corner, inner dark screen, status bar with signal bars and a
  battery reading; squared 2px buttons (C-AU3). Shots `r3/shots/mg-authenticator_390x844.png`.
- **C-PH1-4 (phone scenes):** live on a real phone-chat (missing-contact path, game 4110): the
  "Contact not found" toast renders inside the green screen as a 2px pixel toast (C-PH1); the
  Notepad button sits on the phone status bar clear of the HUD (C-PH2); the fixed X sits in the
  clear band above the bezel at 390 (C-PH3); and a missing contact falls back to the contact list
  rather than a blank screen (C-PH4). Shot `r3/phone/empty-noNpc_390x844.png`. See n2 on the
  part-D proof shot.
- **C-LP2 (landing-page-builder empty preview) via the real builder:** driven through the real
  flow (part D shots at HEAD, code unchanged since): the preview shows "Pick a service to start
  the page", is capped to a short strip at narrow, and only the choice panel scrolls; the X is in
  the header. See n3 on the title-only stub.
- **C-PC2 (person-chat narrow black gap):** at 390/360 the portrait fills the height
  (object-fit cover) and the dialogue band hugs the foot; the ~200px black gap is gone.
- **C-SD1-3 (shredded flip/reorder):** the instruction names the drag and the Up/Down routes,
  no missing glyph; behaviour asserted by social-shredded-reorder (5/5).
- **Pixel-art UI rule:** strict audit (below) reports every font across all 15 SE scenes at all 5
  sizes is GNF or Press Start 2P, and zero radius/shadow/hairline/font-size/gradient breaches.
- **ui-design-language (X closes, no Cancel, one look per concept, diegetic device frames):** X
  closes every scene (drive 75/75), no Cancel text remains, the device frames (PC + kiosk) share
  one X look. See n1 on the flat-red-vs-steel split within the SE family (a resolved R2 decision).
- **C-PP3 and C-PV1:** with the user; wording not judged here.

## Findings

(No B or M. The one m is the gap-test selector in the "Known regression" section above:
`test/js/social-gap-episode-runner.test.mjs:356`.)

## Notes

- **n1** Within the SE family the kiosk (episode-runner) closes with the themed steel X while the
  other 13 SE windows use the flat-red `.se-overlay-close`; shredded uses the flat red too. This
  is the deliberate R2 m2 decision (kiosk and PC are diegetic devices, so they close like the PC;
  app windows keep the SE flat-red X), not a regression. Flagged only as a consistency read for the
  user's eye. file:line `episode-runner-minigame.js:346`, `social-overlay.js:85`.
- **n2** Part D's `phone-empty` proof shot used `npcIds:['nobody_here_xyz']`; `npcIds` is not a
  recognised param, so phone-chat throws "requires either npcId or phoneId" and the shot showed the
  bare game world, not an empty phone. The real missing-contact path (`npcId`) was re-driven this
  round and correctly falls back to the contact list plus the "Contact not found" toast, so C-PH4
  holds; only that one proof shot was misleading. No code issue.
- **n3** The landing-page-builder title-only stub still degrades to "This page is not available"
  with the flat-red X floating top-left (not in a header) — carried over from R2 n3. Stub-only; the
  real builder flow puts the X in the header (C-LP2). Not a player-facing path.
- **n4** Every SE overlay still carries the framework `#minigame-close` (`.minigame-close-button`)
  as a `display:none`, 0x0 element behind its own visible `.se-overlay-close`/`.epr-kiosk-close`.
  It is inert (suppressed, never clickable), not a second visible X. Noted only so the next reviewer
  does not read it as a stray control.
- **n5** C-X7's single shared stepper render-module merge is still open (the three render functions
  remain separate while the look is unified). Deferred by design across parts A-D; not a breach.

## Counts

- Blockers (B): 0
- Majors (M): 0
- Minors (m): 1
- Notes (n): 5

## Evidence

- **Strict audit** (`ui-rules-audit.mjs --strict`, 15 SE scenes x 5 sizes, fresh game 4077):
  EXIT 0. SUMMARY window-offscreen 0, frame-offscreen 0, clipped 0, x-on-frame 0, overflow 0. The
  JSON was scanned for EVERY breach kind, not just the fit kinds `--strict` exits on: the only
  entries are the informational `_fonts` inventory, and every font seen across all scenes/sizes is
  GNF or Press Start 2P. Zero real breaches (no radius/shadow/hairline/font-size/gradient/clipped/
  overflow/offscreen/x-on-frame). Log/json/shots: scratchpad r3/audit.log, r3/audit.json, r3/shots.
- **X/Esc drive-through** (drive.mjs, fresh game 4103): all 15 SE scenes x 5 sizes GREEN
  (`oxFCE`) — opened, visible functional X present, frame on-screen, X closes, Esc closes
  (0 non-green of 75). The drive selector was corrected to the visible functional close
  (`.se-overlay-close, .epr-kiosk-close`) after an initial run matched the hidden framework button.
  JSON: scratchpad r3/drive.json; shots r3/drive-shots.
- **Close probe** (probe-close.mjs, game 4101): assistant-chat and mail-client close by
  `.se-overlay-close`, episode-runner by `.epr-kiosk-close`, shredded by its
  `minigame-close-button se-overlay-close`; the framework `#minigame-close` is `display:none`/0x0
  in every case (n4).
- **Tests** (plain `node --test`, one file at a time): all 155 `social-*.test.mjs` files +
  minigame-se-close/-shell/close-shell = 2382 pass / 1 fail (only social-gap-episode-runner test
  16, the m above). Non-social files the fixes touched all pass: phone-outgoing-call 51,
  minigame-controls-layout 11, phone-chat-close-race 3, phone-call-terminal-beat 8,
  minigame-close-shell 19, minigame-pixel-art 48, person-chat-{pixel-art 3, background 18, camera 8,
  reopen 4, pending-reply 17}, pretext-debrief-labels 5.
