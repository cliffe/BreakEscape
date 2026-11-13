# UX feedback round, slice 2a: build log

Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md`, slice 2a. Branch `build/ux-signin` (from `build/ux-feedback`). Engine paths below are under `public/break_escape/`.

Built: the sign-in post-it, the room mark, share labels, the share header, the share folder window. Not built: the prompt skin (q98 unanswered), kept as the plain 2px panel.

## What changed

| Card | Change | Files |
|---|---|---|
| main-01, main-12 | The sign-in note sat off centre because it is the bezel's second child and an old `:nth-child(2)` rule gave it a 140px left margin. The note now sits at the bezel's lower-left: `align-self: flex-start`, `left: -14px` (overhangs the left edge, as on the desktop), `margin-top: -48px` (pulled up over the frame). The `:nth-child` offset rules are gone. The password screen (non sign-in) uses the same rule, so its note moves to the same place (checked live on m01, below). | `css/password-minigame.css` |
| main-11 | `postitPosition` puts the mark's bottom on the sprite's bottom: `y = floor(top + h - POSTIT_SIZE / 2)`. Floored so the 9px picture never hangs half a pixel below the sprite. x unchanged. | `js/systems/postit-marks.js` |
| main3-05 | A share icon on a desktop shows the share name only; the UNC path is the icon's `title` (tooltip). The same for the standard grid (label name only, hover tooltip the UNC path). | `js/minigames/container/container-minigame.js` |
| main3-08 header | `containerImageUrl` returns the share icon (`m09_folder1.png`, or the item's `iconImage`) for a `network_share` with no texture, so the header no longer asks for the missing `network_share.png`. `SHARE_ICON` moved into `container-item-image.js`. | `js/minigames/container/container-item-image.js` |
| main3-08 window | A share (mapped on a desktop, or opened from the network view) opens as a folder window: `shareFolder` forces `desktopMode` false; `createShareFolderUI` draws the header (icon, short name, observations) and a grey window with a navy title bar holding the UNC path, over a white file pane (the standard contents grid, so taking, reading and Copy / Move work as before; the Copy / Move dialog opens inside the window). No wallpaper, no drawer sound. `parentLockable` and the remote return are unchanged: Close goes back to the local or remote desktop it came from. `openMappedShare` now passes `desktopMode` false. | `container-minigame.js`, `css/container-minigame.css` |

Pixel-art rule: 2px borders (bevel greys as on the desktop dialogs), square corners, GNF in the title bar and labels, the folder icon at 1x (26x18) in the title bar and in the 80px header box as before, a hard 4px offset shadow with no blur (as the Copy / Move dialog and the post-it). No radius, gradients or smooth fonts.

Share name parsing: `shareLabelParts(name)` splits the server's `"Name (\\HOST\Name)"` (network_access.rb `mapped_share_stubs`, and `shareLockable` in the network view). A name with no UNC part gives the name and no path. Client only; the server is unchanged.

## Sync

Client display only. Nothing stored in player_state, no new field, no new request; every request each screen makes is the same as before.

## q98 (prompt skin): the one-line switch

Unanswered, so the Wi-Fi and archive prompt keeps the plain 2px panel. To use the theme frame skin, add `[data-ui-theme] .prompt-mode .monitor-bezel,` to the selector list of the frame rule in `css/ui-themes.css` (the block starting `[data-ui-theme] .objectives-panel,`, about line 657). main3-01 needs a retake if that goes in.

## Tests

Each new assertion fails on the parent commit (old CSS has the nth-child rule and no negative margin; old mark is top-left; old shares open in desktop mode with a `network_share.png` header and the full label).

- `test/js/access-signin-postit.test.mjs`: new CSS assertion (left offset, negative top margin, `flex-start`, no centring, no nth-child rule). 6 pass.
- `test/js/postit-marks.test.mjs`: bottom edge on the sprite bottom; new test for three origins. 9 pass.
- `test/js/container-shares.test.mjs`: seven new slice 2a tests (label parts; name-only label with UNC tooltip; header icon and never `network_share.png`; folder window parts and Copy / Move inside it; local desktop Close returns; remote desktop Close returns; a view share is a folder window and still reports share/close). Two older assertions that pinned "the share comes back in its desktop layout" now pin the folder window; the `icon()` helper also finds file slots. 35 pass.
- `test/js/inventory-restore-sprite-image.test.mjs`: the helper count is 3 (standard, desktop, share folder). 10 pass.
- Also run, all green: `password-signin-mode` 19, `container-transfer-dialog` 14, `access-remote-signin` 15, `password-join-mode` 6, `password-case-hint` 5, `password-minigame-submit` 2, `engine-fixes-pass4b` 10, `engine-fixes-round6` 9, `escaping-shared-helpers` 20, `keypad-title` 6, `lock-scope-refusal` 12, `minigame-controls-layout` 11, `minigame-title-escape` 23, `toast-once-across-panel-handover` 6, `toast-once-before-container` 8, `unlock-r1-ux` 11, `variants-in-lock-panels` 4 (every test file that imports the password or container minigame, `container-item-image.js` or `postit-marks.js`).
- No new module file, so no JS harness copy-list change. No Rails code changed. Full suites not run (test lock rule).

## Live proof and retakes

Keyless server on :3310 from this worktree, headless Chromium, `setFPS(20)` with fixed steps on (`[20, true]` logged each run). Shots in `scratchpad/ux-shots/slice2a/` (the session scratchpad).

| Shot | Game | What it shows |
|---|---|---|
| after-main-01-signin-account-tiles.webp | 2406 (test_access_signin, swap) | Note at the bezel lower-left, 14px past the left edge |
| after-main-11-room-locked-screen-padlock-with-postit.webp, and -zoom.webp | 2407 (test_access_habits, swap) | Mark bottom -392.5 against sprite bottom -392 (logged) |
| after-main-12-signin-postit-note-on-screen.webp | 2407 | Nine tiles plus Other user; note at the lower-left, clear of "Choose an account." |
| after-main3-05-remote-desktop-through-box.webp | 2424 (test_access_networks, new-game.rb --give kit_dropbox) | Icon label "Backup-Vault"; title `\\SV-FS02\Backup-Vault` (logged) |
| after-main3-08-share-opened-after-signin.webp | 2424 | Folder window, header icon loads (naturalWidth > 0), no wallpaper; Close returned to the remote SV-FS02 desktop (logged `remote: true`) |
| after-access-b07-m01-it-monitoring-desktop.webp | 2421 (m01, --start-room it_room) | Mission desktop unchanged |
| after-extra-m01-password-postit.webp | 2426 (m01, --start-room kevin_office) | Password-mode note at the bezel lower-left (regression check) |

main3-01 not retaken (q98 open, nothing changed). Games 2408, 2419 and 2423 were made for runs that failed or were superseded.

## Art needs

- Network share icon, 26x18, shown x2 in the header and x1 in the title bar (plan section 5). Until approved, `m09_folder1.png` stands in. Not generated.

## Not done, and notes for the reviewer

- The remote desktop header in main3-05 says "Remote session through your link": the script signed in through `pcSessions` without the network view, so `networkLinks` had no name for the foothold. Not a slice 2a change.
- The minigame's own title (params.title) still carries the full label with the UNC path; the folder window's header and title bar show the short name and the path. Left as is.
- The standard grid's slot hover scales by 1.05 elsewhere (an older rule); the folder window turns that off for its own slots only.

## Handover

Done: everything in slice 2a except the q98 skin. Commits: 0ecbfb614 (post-it, mark), 6282b2658 (shares), b5c13e2d5 (file label width), plus this log. In progress: nothing. Open: q98; slice 2b waits on q92 and this branch's merge.

## R1 fixes

Review: `UX_SLICE2A_REVIEW_R1.md` (0 blockers, 2 majors, 2 minors, 4 nits), with the orchestrator's rulings and the user's general notes on the password screens (unlock-44, unlock-53). Every finding is fixed.

| Finding | Fix | Files |
|---|---|---|
| M1, share header icon at 3.08x | The header `<img>` gets `share-header-icon`: 52x36 (exactly x2) with 22px/14px padding, so it is centred in the same 80px box with no `object-fit: contain`. `fitWholeScale(img, 80, { maxScale: 2, pad: true })` sets the same sizes from the loaded picture, so a share with its own `iconImage` also lands on a whole-number scale. Measured live: box 84x84, padding 22px 14px, picture 26x18. | `container-item-image.js` (`fitWholeScale`, `containerImageHtml` extra class), `container-minigame.js`, `container-minigame.css` |
| M2, folder window unfinished | The folder window fills the frame below the header (`.share-folder-layout`, flex column, the window `flex: 1 1 auto`, `width: min(880px, 100% - 40px)`): 880x699 at 1400x1000, 724x323 at 800x600. The grey tile fill is gone: files sit on the white pane with no box; hover marks the name navy on white, as a file browser selects. No larger document icon exists in `assets/icons` or `assets/objects` (the document glyphs are all 16x16; `case-file.png` 40x27 is a folder), so the 16px glyph is drawn at x4 (64px) by `fitWholeScale(img, 64)`. Columns are a fixed 160px, so the glyph sits on a whole pixel (1fr columns put it on a quarter pixel). | `container-minigame.js`, `container-minigame.css` |
| m1, clipped and repeated tooltip | No tooltip repeats a printed label: the `.container-content-tooltip` box and the item `title` are gone from the standard grid. A share's UNC path (which its label leaves out) stays as the native `title` on its icon, which the browser draws outside any clipping box. | `container-minigame.js` |
| m2, post-it over Add to Notepad | The password screen is now a frame that wraps its content (below); the game area scrolls inside it, and the controls row sits under the frame, so the note can never reach a button. Checked with `elementFromPoint` on every button at three sizes on all three screens. | `password-minigame.js`, `password-minigame.css` |
| n1, half pixel | The mark is drawn with `setOrigin(0.5, 1)` at `y = round(top + h)`: its bottom is the sprite's bottom to the pixel (live: 120 against 120; before 119.5). | `postit-marks.js` |
| n2, orphaned JSDoc | Removed. | `container-minigame.js` |
| n3, header line differs | The mapped stub's empty header line becomes "A file share on HOST." from its UNC host, the same line as a share from the network view. | `container-minigame.js` |
| n4, loose CSS test | The test pins `left: -14px` and `margin: -48px 0 0 0`, and checks the desktop note uses the same `-14px`. | `test/js/access-signin-postit.test.mjs` |

### The user's notes on the password screens

- No Cancel button in any mode (sign-in, Wi-Fi prompt, plain). `PasswordMinigame.init` passes `showCancel: false` to the base scene; the controls row is made only when it holds Add to Notepad (`ensureControlsRow`). The X and Esc close the screen. On a lockout the X takes the focus (it used to relabel Cancel as Close). Other minigames keep their Cancel (slice 7).
- The frame wraps its content at every size. `wrapInFrame` puts the game area and the X in a `.password-frame` (2px border, 644px wide, capped at the window less 32px). The area is `height: auto` (it was a fixed share of the window, which left the empty band under the monitor). The X sits at 6px inside the frame's top-right corner, clear of the border; the area's 44px top padding keeps the content clear of it. In a window 640px tall or less, the device header goes and the bezel and padding shrink, so the field and Submit show at 915x412 without scrolling; anything taller scrolls inside the frame.
- With the full-window dark game area gone, the dimmed game shows around the frame, as it does around the other framed panels.

### Tests (without the lock, every file that imports a changed module)

access-remote-signin 15, access-signin-postit 7 (one new: the frame), container-shares 38 (three new: `fitWholeScale`, the folder window header/tooltips/host line, the folder CSS), container-transfer-dialog 14, engine-fixes-pass4b 10, engine-fixes-round6 9, escaping-shared-helpers 20, inventory-restore-sprite-image 10 (counts `${this.containerImageHtml(` calls), keypad-title 6, lock-scope-refusal 12, minigame-controls-layout 11 (the password area rule now pins `height: auto` and the frame's scroll), minigame-title-escape 23, password-case-hint 5, password-join-mode 6, password-minigame-submit 2, password-signin-mode 21 (the lockout closes by the X; two new: no Cancel and no empty controls row on the sign-in, plain and prompt screens), postit-marks 9 (exact bottom and origin), toast-once-across-panel-handover 6, toast-once-before-container 8, unlock-r1-ux 11, variants-in-lock-panels 4. All pass. No new module file, so no harness copy-list change.

### Live proof

Keyless server on :3312 from this worktree, headless Chromium, `setFPS(20)` with fixed steps on (`[20, true]` logged each run). New games: 2459 (test_access_signin, swap), 2460 and 2464 (test_access_habits, swap; 2464 starts in omar_room, the mark forced on with `postitMarks.mark` because the server shows a note only when the owner has written the password down), 2461 (test_access_networks, `new-game.rb --give kit_dropbox`: the swap script has no `--give`), 2462 (m01, `new-game.rb --start-room kevin_office`). Before shots were taken with the pre-fix files checked out over the worktree for the run, then restored from the commit. Shots and the driver (`drive.mjs`, `after-log.txt`) are in the session scratchpad under `ux-shots/slice2a-r1/`:

- `before-` and `after-main-01-12-signin-{1400x1000,800x600,915x412}.png`
- `before-` and `after-m01-plain-password-{1400x1000,800x600,915x412}.png` (the m01 note at 800x600 among them)
- `before-` and `after-wifi-prompt-{1400x1000,800x600,915x412}.png`
- `before-` and `after-main-11-room-mark-1400x1000.png`, and `-zoom-`
- `before-` and `after-main3-05-remote-desktop-{1400x1000,800x600}.png`
- `before-` and `after-main3-08-share-folder-{1400x1000,800x600}.png`, and `-share-hover-`

### Art need

- A document icon larger than 16x16 for the folder window (about 32x32, shown x2), so a file does not depend on a 16px glyph at x4. Not generated.

### Handover (R1)

Done: every R1 finding and the user's password-screen notes. Commits: b07685776, cf7841113, 939fa9485, plus this log. Open: q98 (prompt skin), unchanged. Not done: nothing in scope.

## R2 fixes

Review: `UX_SLICE2A_REVIEW_R2.md` (0 blockers, 2 majors, 3 minors, 2 nits), with the orchestrator's rulings. Every finding is fixed, plus the archive password's X.

**Correction to the R1 log.** R1 said "the field and Submit show at 915x412 without scrolling". That held for Ian's PC and the Wi-Fi prompt only. On the hot desk with a tile chosen, Submit and the attempts line were below the frame, and the shots missed it because headless Chromium hides scrollbars by default. The R2 proofs below were all taken with scrollbars shown.

| Finding | Fix | Files |
|---|---|---|
| M1, 4px overflow and a system scrollbar | Bisected live by hiding each descendant of the frame's scroll area in turn: the overflow came from `.monitor-bezel::before`, set 4px past each edge of the bezel. The bezel's `clip-path` hides everything outside its own box, so those 4px never showed, but they still counted as scrollable overflow. The pseudo-element is now inset 0; the bezel is pixel-identical (compared live with the scroll held fixed). Where the area does scroll, it has a pixel-art scrollbar: a 12px track with a 2px left border, and a square thumb with a 2px border and no radius, following `biometrics-minigame.css`. `scrollbar-color` and `scrollbar-width` are set for Firefox only, inside `@supports (-moz-appearance: none)`, because Chromium drops the `::-webkit-scrollbar` rules once either is set. The rule is scoped in `password-minigame.css`, with a comment naming the shared `.pixel-scroll` rule that slice 1 adds to `utilities.css`. | `password-minigame.css` |
| M2, sign-in at 915x412 | In the short-window block: 84px tiles, a 32px portrait (a quarter of a 128px talk-sheet frame), no username line, smaller gaps and a smaller controls row. The controls row is inside the frame (m3). `revealInFrame` (`scrollIntoView` with `block: 'nearest'`) brings Submit into view once a tile is chosen, and the message line into view on a wrong password or a lockout; the plain screen's attempts counter is revealed after each try. The sign-in post-it is pulled up 40px (24px in a short window) instead of 48px, so it stays below the message line; at 915x412 it had covered the start of "Incorrect username or password". | `password-minigame.css`, `password-minigame.js` |
| m1, Esc in a field | The plain, prompt and sign-in key handlers call `closeByPlayer()` and stop propagation, as the X does: at once, `closedByPlayer` true, no "cancelled" message, no 800ms wait. The on-screen keyboard's Escape key is labelled Esc (it read Cancel) and closes the same way. `cancelPassword` has no callers left; it is kept for now. | `password-minigame.js` |
| m2, share icon at 1.85x | Desktop icons go through `fitWholeScale(img, 56, { pad: true, onlyIfFits: true })`. 56 is the old 48px box plus its 4px padding, so the box keeps its size: a 16px glyph stays at x3 with 4px padding, and the 26x18 share folder is at x2 (52x36, padding 10px 2px). `onlyIfFits` (new) leaves a picture larger than the box at its CSS size. | `container-item-image.js`, `container-minigame.js` |
| m3, Add to Notepad outside the frame | `ensureControlsRow` appends the row to the frame, after the game area, as `flex: 0 0 auto` with a 2px top rule. The area scrolls above it, so the post-it cannot reach it. | `password-minigame.js`, `password-minigame.css` |
| n1, mark half pixel on x | The mark is drawn with origin (0, 1) at `x = round(left + inset)`: live, its left is at 163 against the sprite's 160, and its bottom at 120 against 120. | `postit-marks.js` |
| n2, hover fills the label box | The folder window's label is `width: max-content; max-width: 152px`, so the navy highlight covers the name only (139px for "Backup-Vault"). | `container-minigame.css` |
| Archive password X | A lock screen opened from a sign-in desktop at the keyboard arms the same one-shot return as a network screen, so the X (or Esc) on Ian's archive password goes back to his desktop, as a share's Close does. The return uses `playerCloseOnly`: a forced close (a hit, too many wrong passwords) stays in the world and clears the pending return. A successful unlock hands over to the archive. An ordinary container still arms no return. | `container-minigame.js` |

### Tests

Run without the lock: the 21 node test files that import `password-minigame.js`, `container-minigame.js`, `container-item-image.js` or `postit-marks.js`, or read their CSS. 256 pass, 0 fail. `toast-once-across-panel-handover` fails under `node --test` with a runner deserialise error (the script prints to stdout); it passes 6/6 run with plain `node`, as `bin/test-js` runs it.

New or changed tests:
- `password-signin-mode`: 4 new. Esc in the password field, the username field or on the page ends exactly as the X does (same `endMinigame` arguments, `closedByPlayer`, no failure message, ended once). The same holds on the plain, archive and Wi-Fi screens, including the on-screen Esc key. Add to Notepad sits inside the frame after the game area, on the sign-in and plain screens. Choosing a tile reveals Submit; a wrong password and a lockout reveal the message line.
- `access-signin-postit`: 1 new. The bezel `::before` is inset 0; the scrollbar has a 2px-bordered square thumb and the Firefox properties in `@supports`; the controls row does not scroll; the short-window tile, portrait and post-it rules.
- `container-shares`: 4 new. The archive X returns to the local desktop; a forced close stays in the world; an unlock hands over to the archive; desktop icons are drawn at a whole scale.
- `postit-marks`: the mark's origin is (0, 1) and its left is a whole pixel.

### Live proof

Keyless server on :3314 from this worktree, stopped afterwards. Headless Chromium with `--hide-scrollbars` removed (scrollbars shown), `setFPS(20)` with fixed steps on (`[20, true]` logged on every run). New games:
- 2540, 2558, 2559 (test_access_signin, swapped onto test_access_networks): Ian's PC, the lockout PC and the archive password at 1400x1000, 800x600 and 915x412.
- 2587, 2588, 2589: the same, used for the final hot desk runs (the archive run leaves the hot desk signed in).
- 2544, 2560, 2561 (m01, `--start-room kevin_office`).
- 2545 (m02, `--start-room it_department`).
- 2543 (test_access_networks, `--give kit_dropbox`): the Wi-Fi prompt at three sizes, the SV-FS02 desktop and the share folder.
- 2542 (test_access_habits, `--start-room omar_room`): the room mark.

Measured (scrollHeight minus clientHeight of the frame's scroll area, and its scrollbar width):
- 1400x1000 and 800x600: overflow 0, no scrollbar, on every screen. This covers the hot desk (tiles, tile chosen, wrong password, Other user), Ian's PC, the lockout PC (open, wrong, locked), the archive, the Wi-Fi prompt, m01 (open, wrong, maxed) and m02. R2 measured 4px on most of these.
- 915x412: the tile screen, Ian's PC, the archive, the Wi-Fi prompt and the lockout PC as opened fit with no scrollbar. Once a tile is chosen, the hot desk scrolls, with the 12px pixel-art scrollbar. Submit (284 to 329) is inside the visible area. After a wrong password the area scrolls by 55px, so the field, Submit and "Incorrect username or password. 4 attempts left." are all inside it, with the post-it below the line. The same holds for Other user. On the lockout PC the "locked" line is in view. On m01 the attempts counter is reachable by the scrollbar and scrolls into view after a try.
- Add to Notepad is a child of `.password-frame` on the hot desk, m01 and m02. `elementFromPoint` reaches every control at every size.
- The X and Esc (on the page and in a field) end with `closedByPlayer` true and nothing open, on the hot desk, m01, m02 and the Wi-Fi prompt. On the archive, both the X and Esc in the field go back to Ian's desktop (`ContainerMinigame` open).
- SV-FS02 desktop: the share icon is `data-scale` 2, 52x36, with padding 10px 2px. The folder window hover is navy, 139px wide.
- Room mark: origin (0, 1), left 163 (sprite 160), bottom 120 (sprite 120).

Shots and logs are in the session scratchpad under `ux-shots/slice2a-r2fix/`: `after-signin-{tiles,chosen,wrong,other}-*`, `after-signin-typed-*`, `after-signin-lockout-wrong-*`, `after-signin-lockout-*`, `after-archive-password-*`, `after-plain-*kevin_office_pc_0-*`, `after-plain-*gary_workstation-1400x1000`, `after-wifi-prompt-*`, `after-remote-desktop-*`, `after-share-folder-*`, `after-share-hover-*`, `after-room-mark-zoom-1400x1000`, at 1400x1000, 800x600 and 915x412. Drivers: `drive.mjs`, `probe.mjs` (the overflow bisect); logs in `logs/` (the `signin2-*` runs failed on an already signed-in hot desk and were redone as `signin3-*`).

### Noticed, not changed

- At 1400x1000 the frame is centred on a quarter pixel when its height is odd (top 210.25 with a tile chosen), so its text can sit off the pixel grid. This predates the slice.
- The plain screen's transient failure box ("Incorrect password. 2 attempts remaining.") draws over the post-it for its 1.5s at 915x412. This also predates the slice.
- `cancelPassword` is now unused.

### Handover (R2)

Done: every R2 finding and the archive X. Commits: 89b795576, d03a1b7f2, plus this log. Open: q98 (prompt skin), unchanged. Not done: nothing in scope.
