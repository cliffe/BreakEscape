Counts: blockers 0, majors 3, minors 6, nits 2

# UX feedback round, slice 7: code review, round 5 (final)

Branch build/ux-pixel at d45e2ce07, reviewed against round 4 (`UX_SLICE7_REVIEW_R4.md`) and the "R4 fixes" section of `UX_SLICE7_BUILD_LOG.md` (commits 4428e9824, 4a571019b, d45e2ce07). Rules: `ui-design-language`, `pixelart-ui-rule`.

## What I checked

- Keyless headless server on :3349 from this worktree (setFPS(20), fixed steps on), stopped afterwards. Games 2719, 2720, 2721, 2758 and 2759, all new, made with `swap-scenario-game.rb test_seating test_seating`.
- Every browser run had scrollbars shown (`ignoreDefaultArgs: ['--hide-scrollbars']`). Touch runs used real touch input through CDP `Input.dispatchTouchEvent`, on a phone context (`hasTouch`, `isMobile`) and a touch-laptop context (`hasTouch`, not mobile).
- `releaseHeldTouchPointers()` on notes (DOM only), lockpicking (Phaser) and person-chat (opened by a tap or click on Ruth), by touch on the phone at 915x412 and the touch laptop at 1400x1000, and by mouse on the touch laptop at 1400x1000 and a mouse-only desktop at 800x600. After each close: main-game pointers, a world tap or click, a walk on the arrow keys, and at the end a tap or click on the NPC.
- Two hold cases, each as built and with the release stubbed out: (A) a finger pressed inside the notes reader is still down when it closes, slides onto the world and lifts; (B) a finger hold-walking on the world while the Bluetooth scanner (game input kept) opens and then closes on its own.
- The pump's compatibility-mouse window on the touch laptop at 1400x1000 and 915x412: a tap, then a real mouse click 100 to 1000ms later, with every window event logged with its `sourceCapabilities.firesTouchEvents`.
- Cryptex ink boxes at 1400x1000, 800x600 and 915x412, ten letters, with partial-pixel counts.
- `pixel-style-sweep.mjs --offline` on the 14 scope scenes plus cryptex, combination, container, password, lockpicking and person-chat at the three sizes; `ui-rules-audit.mjs` (from the p-ux-audit worktree) on the same scenes at the three sizes; my own look at the sweep shots and the final shots in `ux-shots/slice7-final/`.
- Every file name in `slice7-final/` against its card title in `review-page/cards.json`.
- Tests, without the lock: the 31 test files that import `minigame-manager.js`, `infusion-pump-minigame.js` or `minigames/index.js`, or read `cryptex-minigame.css`, `bluetooth-scanner.css` or the sweep tool: 31 of 31 pass.
- Output: scratchpad `ux-shots/slice7-r5/` (`probe/` with `release-probe-*.log`, `hold-probe.log`, `pump-debug-1400x1000.log`; `cryptex/` with `cryptex-ink.log`; `sweep.json`, `audit.json`, `sweep/`, `audit/`, `sheets/` with crops). Probe scripts: `tmp/r5/` in the worktree (not committed).

## The release on close, checked live

What works:
- Notes, lockpicking and person-chat, by touch and by mouse at every size tried: each closes on its X, all main-game touch pointers are free after close, a world tap or click fires one main `pointerdown`, and the arrow keys walk the player. The NPC opens a conversation on a tap or click afterwards. (One world tap at 1400x1000 after person-chat fired its `pointerdown` but did not move the player; the same happened by mouse, so it is the scenery where the probe tapped, not the release.)
- Mouse play: the mouse pointer is never released (`released` was 0 on every mouse close).
- Hold case A shows why the release is needed: the notes reader's element is removed while the finger is down, so its `touchend` goes to a detached node and never reaches the window. With the release stubbed out the main pointer stays held for good (`held#7` after lift). As built it is released at close; the world sees no `pointerdown` and no `pointerup` while the finger slides onto the world and lifts, the player does not move, and later taps walk. No phantom tap.
- Hold case B: the release frees a finger that is still down on the world, but hold-walk has already stopped when the scanner opened (with or without the release), so the player sees no difference. The finger's later `touchend` is dropped harmlessly.

What breaks: m2 (the release does nothing until something calls `MinigameFramework.init`).

## Findings

### Majors

**M1. Synthetic bold on pixel faces in 11 of the slice's scenes.**
`minigames-framework.css:3` (`.minigame-container`) sets nothing to stop it, and GNF, VT323 and Press Start 2P ship one weight each (`fonts.css`), so every `font-weight: bold` or 600+ inside a minigame makes Chrome smear a fake bold. The audit finds it at all three sizes in drug library integrity (37 elements: table headers, every Dose max cell, tabs, the status bar, the run button), PIN (display and every key), biometrics (9), BLE and Bluetooth scanners (3 each), forensic data platform, NCSC brief, SCADA historian, text file (file name), notes (title) and password (attempts). The PIN digits show it plainly: uneven stroke widths on 0, 2 and 8 (`sheets/pin800_keys_x2.png`, `pin800_log_x3.png`). Combination and cryptex do not, because slice 7 gave them `font-synthesis: none` (`combination-minigame.css:5`, `cryptex-minigame.css:5`).
Fix: add `font-synthesis: none;` to `.minigame-container` in `minigames-framework.css` (one rule for every minigame; the two local copies can then go), rerun the audit and confirm `faux-bold` is 0 in scope. Add the property to the static checks in `minigame-pixel-art.test.mjs` so it stays.

**M2. Press Start 2P off its 8px grid in four of the slice's scenes, so the text is soft.**
Press Start 2P draws one font pixel per eighth of its size; at 12px a font pixel is 1.5 screen pixels and is smeared. The sweep's size check only catches fractional sizes, so it passed these:
- PIN: title "Keypad" 12px (`pin.css:43`), keys 20px bold (`pin.css:180-181`); the keys are the most visible text on the plate.
- SIEM: 12px title (`siem-dashboard-minigame.css:35`), 11px (`:107`, `:151`), 10px (`:268`, `:332`, `:422`, `:435`), 9px legend (`:392`), 12px (`:460`).
- Fingerprint reader: the sign and its tag at 11px (`biometrics-minigame.css:644`, and `.fpr-sign-tag` at `:859`).
- Notes title: 20px at 1400x1000 (`notes.css:135`), 13px under the short-screen rule (`notes.css:412`).
Fix: whole multiples of 8 (8, 16, 24): PIN keys 24px normal weight (they fit the 2px-bordered key), PIN title 16px, SIEM 8px for the small labels and 16px for the titles, the reader sign 8px or 16px, the notes title 16px (and 8px or 16px on short screens). Retake the PIN shots for the user beside the R4 ones, since the PIN plate is designed art the user has compared before.

**M3. At 915x412 the SIEM console runs off the bottom of the window: the frame does not wrap it, and its footer cannot be reached.**
`siem-dashboard-minigame.css:19` gives `.siem-panel` `min-height: 520px`, and `:9` leaves the game container `overflow: visible`. At 915x412 the panel spans y 16 to 536 in a 412px window (audit), so the bottom border, the lower alert rows and the footer ("ALERTS PENDING", "TIME REMAINING") are cut off, with no outer scroll (`sweep/unlock-49_siem-dashboard_915x412_r5.webp`; the user's card unlock-49 shot shows the same). The panel's section titles also wrap into overlapping lines at 800x600 and 915x412: "ESCALATED FOR REVIEW" and "> SEVERITY BREAKDOWN" sit one line over the other (`siem-dashboard-minigame.css:329-339`, 10px with no line height of its own; `sheets/siem_scroll_x3.png`).
Fix: under `max-height: 560px`, drop the minimum (`min-height: 0; height: 100%`) so the two panes shrink and scroll inside the frame; give `.siem-queue-section-title` and the pane titles `line-height: 16px` at an 8px font size (with M2). Retake unlock-49 and unlock-58.

### Minors

**m1. On a touch laptop, a real mouse click within 800ms of a tap anywhere on the pump's screen is dropped.**
`infusion-pump-minigame.js:205-212` notes the time of any touch inside `#ip-phaser-container` and stops every mouse event for 800ms after it (`:199`, `:207`). The box is not the device: at 1400x1000 it is 1400x960 (0,20 to 1400,980), the whole minigame area, so a tap on the dark surround counts too. Live on the touch laptop at 1400x1000 and 915x412: a tap above the device then a click on 5 after 100ms and after 400ms read nothing; after 1000ms it reads "5". A tap on 1 then a click on 4 after 150ms, or on 5 after 500ms, reads "1"; on 6 after 900ms "16". A tap outside the box (the overlay corner) does not block a click. Chrome marks the compatibility events: `mousedown`, `mouseup` and `click` after a tap carry `sourceCapabilities.firesTouchEvents === true` and arrive within 1ms of the `touchend`; the real clicks carry `false` (`probe/pump-debug-1400x1000.log`). Mixing the two inside 800ms is uncommon, but nothing tells the player why the click did nothing.
Fix: in `onMouse`, stop the event when `e.sourceCapabilities` exists and `firesTouchEvents` is true; only when `sourceCapabilities` is missing (Firefox, Safari) fall back to the timer, and then also require the mouse event to land within 16px of the last touch's point (record `changedTouches[0].clientX/Y` in `onTouch`). Test: a click with `firesTouchEvents: false` 100ms after a touch gets through; one with `true` is stopped; a fallback click 40px from the touch gets through.

**m2. The release on close does nothing until something has called `MinigameFramework.init`.**
`minigame-manager.js:410` reads `this.mainGameScene`, which only the starters set (`minigame-starters.js`, some of `interactions.js`, `notes-minigame.js:822`); nothing sets it when the game boots. On a new game (2759), after the title screen and the Mission Brief closed by a click, `mainGameScene` was still null; the NPC branch of `interactions.js` (`:894`) starts person-chat without an init. With no scene, a minigame that ends under a held finger leaves the main pointer held for good: hold case A without init kept `held#7` after the lift (`probe/hold-probe.log`, first run). The pump starter does call init (`minigame-starters.js:965`), so B1 itself stays fixed; the guard for every other scene does not run early in a session. The same null leaves the main game's mouse and keys enabled under those minigames (`minigame-manager.js:125`), which predates this slice.
Fix: in `releaseHeldTouchPointers`, use `(this.mainGameScene || window.game)?.input?.manager`; better, call `window.MinigameFramework.init(this)` once in the main scene's `create()` in `game.js` beside `this.input.addPointer(1)`, so the release and the input disabling both always have a scene. Test: `endMinigame` with `mainGameScene` null and a `window.game` holding two held pointers releases both.

**m3. Three of the slice's scenes still show Chrome's default scrollbar.**
White track, rounded grey thumb and arrow buttons (`sheets/tf_na.png`, `siem_scroll_x3.png`):
- Fingerprint reader at 915x412: `.fpr-panel` scrolls (`biometrics-minigame.css:619-620`) with no scrollbar style and no "More below" cue.
- Network architecture: `.nad-svg-wrap` (`network-architecture-minigame.css:93`) and the detail pane (`:231`).
- SIEM: `.siem-alert-list` and `.siem-queue-list` (`siem-dashboard-minigame.css:112-116`), at every size.
Fix: the flat 8px pixel scrollbar the Bluetooth scanner and pump use (or `.pixel-scroll` once slice 1 lands), and the "More below" cue on the reader panel.

**m4. Expanded at 915x412, the biometrics kit cuts off its Instructions with no way to read the rest.**
`biometrics-minigame.css:53` (`overflow: hidden !important` on the panel) with `:59` (`max-height: 70vh` expanded): at 915x412 the panel ends at y 315 and the Instructions box loses its bottom border and its last lines (`sheets/bio_bottom_x2.png`). The Bluetooth scanner, the same compact panel, was fixed for this in R3 and R4.
Fix: as the Bluetooth scanner: let the game area scroll (`overflow-y: auto` with the flat pixel scrollbar), and a `95vh` panel rule under 720px high.

**m5. Lockpicking's feedback strip keeps a 1px border and a soft glow.**
`lockpicking.css:13` overrides the 2px border at `:8` with `border: 1px solid #00ff00`, and `:18` adds `box-shadow: 0 0 10px rgba(0, 255, 0, 0.3)`. The strip shows whenever the lock gives feedback. Slice 7 touched lockpicking (R1 and R2 took its Cancel away), and the sweep and the audit flag both at all three sizes.
Fix: delete `:13` and `:18` (or a hard 2px ring). The Phaser canvas the sweep flags as smoothed (no `pixelArt`, no `roundPixels`, `lockpicking-game-phaser.js:485-497`) is a larger change; list it for slice 12.

**m6. The close X sits over the end of the network architecture legend.**
`network-architecture-minigame.css:50-56`: the legend runs the full width of the header, so at 915x412 the X covers "Attack p…" (`sheets/tf_na.png`). The R1 build log saw this and left it ("as before"), but it breaks the X-inside-the-frame rule on a slice 7 scene.
Fix: `padding-right` on `.nad-legend` equal to the X's width plus its inset (or let the legend wrap under the title), and retake at the three sizes.

### Nits

**n1. The SIEM X covers the top-right corner of the console's inner panel border.**
At 800x600 and 915x412 the X sits over the corner where `.siem-panel`'s 2px border turns (`siem-dashboard-minigame.css:13-22`; `sheets/siem_x_x4.png`). It is inside the outer frame, so the rule holds, but the corner looks broken.
Fix: 8px more top padding on `.siem-minigame-game-container`, or the X anchored in the header row.

**n2. `slice7-final/` has no after shots for three cards.**
Every name there matches its card (64 named files; `pin-1400x1000-r4final.webp` has no card, as the log says). Missing: unlock-31 Network architecture and unlock-33 Forensic data platform, both slice 7 scenes, and unlock-59 Backup recovery 800x600 (its 915x412 card, unlock-50, has one).
Fix: copy them in from the sweep with `--names` after the fixes above, so the user's page shows an after shot on every slice 7 card.

## R4 changes, checked

- B1 (pump touch): each tap reads once, and the world answers touch after the pump closes; m1 above is the only cost of the new mouse guard.
- m1 (cryptex): GNF 82px, 56px line box, padding `8px 20px 12px` (`4px 16px 8px` under 560px high). Measured on W, M, Q, G, A and I, T, O, J, L: margins 22/22 at 1400x1000 and 800x600, 10/10 at 915x412; left and right 40/39 (36/35 at 915x412), the 1px being one faint column, since 82px is four font pixels plus 0.04px a step. 0 strong partial pixels in all 30 boxes; nothing scrolls. Centred and crisp at all three sizes (`cryptex/cryptex-ink.log`, `cryptex/crop_915_x2.png`).
- m2 and m3 (Bluetooth): the flat scrollbar and the `95vh` rule from 720px high hold in the final shots at 844x390, 800x360 and 800x600.
- n1 (More below releases): not retested beyond the R4 fix log; the pump runs above read every tap once.
- n2 (names): the card titles match the file names throughout; see n2 above for the gaps.
- Audit hits I did not count: SIEM "DISMISS" as a Cancel beside the X (it is a row action, not a close); password's Cancel (slice 2a); the full-window PIN and SIEM containers reported 2px outside the viewport (their outer border is the screen edge of a full-window backdrop, not a frame the player sees); container's audit start error (no scenario object, the sweep opened it cleanly).

## Out of scope, for slice 12

The `--all` scenes noted in R4 (esd-pushbutton, alarm-panel, coverage-decision-form, backup-recovery) and the lockpicking canvas smoothing (m5). The lockpicking scene at 915x412 also draws its Phaser canvas taller than the window, and its pin labels overlap; neither is pixel styling.
