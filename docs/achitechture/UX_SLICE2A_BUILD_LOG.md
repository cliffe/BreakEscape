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

## R3 fixes

Review: `UX_SLICE2A_REVIEW_R3.md` (0 blockers, 0 majors, 5 minors, 2 nits). Every finding is fixed in code and tested; two of the final shots need a retake (see Not done).

| Finding | Fix | Files |
|---|---|---|
| m1, frames on fractional pixels | `snapFrameToPixels` (as slice 3a's copier frame): after layout, the frame's `left`/`top` take the offset that puts its rect on whole device pixels (`wholePixelOffset`). Re-snapped after the first paint, on resize, and from a ResizeObserver on the frame and the overlay; stopped in `complete()`. The tile text has whole-pixel line heights (`.signin-name` 17px, `.signin-username` 15px). | `password-minigame.js`, `password-minigame.css` |
| m2, failure box over the post-it | The plain and Wi-Fi screens have a message line inside the screen, under Submit (`#password-message`, styled as the sign-in line). A wrong password, an empty field, running out of tries, a refusal and a network error are written there (`showScreenMessage`); the floating box is only a fallback for a screen with no line. While the line shows, the note is pulled up 40px (24px in a short window), as on the sign-in screen. | `password-minigame.js`, `password-minigame.css` |
| m3, toast on the player's own close | `PasswordMinigame.closeByPlayer` sets `{ success: false, reason: 'closed', cancelled: true, closedByPlayer: true, attempts }` unless a result is set (a lockout keeps `locked_out`). `startPasswordMinigame` shows no toast for `closedByPlayer` or `refused`; the dead `cancelled` branch is gone. `cancelPassword` is retired (its text is in `tmp/delete/`). A wrong password that runs out of tries still shows the rejection. | `password-minigame.js`, `minigame-starters.js` |
| m4, post-it out of view at 915x412 | Once an account is chosen the screen gets `signin-chosen`; in the max-height 640px block that hides the tile row and shows a Change button beside the chosen name, which goes back to the tiles. After a wrong password the note is revealed, then the message line. | `password-minigame.js`, `password-minigame.css` |
| m5, stale desktop return | The return armed from a sign-in desktop is marked `loginDesktopReturn`; a container opening (the unlocked archive) clears it, as it does a network screen's. | `container-minigame.js` |
| n1, 32px portrait was the frame at 1/4 | The 32px box shows a 32x32 head crop of the talk sheet's first frame at scale 1 (`headCropOffset`: centred on the head's width over its first 24 rows, 4px below its top; checked over all 134 talk sheets), or a 32x32 avatar (the scenario's headshot) when the tile has one. Set as custom properties the short-window rule reads; the 64px tile is unchanged. | `password-minigame.js`, `password-minigame.css` |
| n2, scrollbar guard | `@supports not selector(::-webkit-scrollbar)` with `scrollbar-width: auto`, and the scroller resets `scrollbar-color` and `scrollbar-width` to auto, as `.pixel-scroll` does. | `password-minigame.css` |

### Tests

Run without the lock: the 33 node test files that import or read `password-minigame.js`, `container-minigame.js`, `minigame-starters.js` or `password-minigame.css`. 388 pass, 1 failed on the first run (`player-damage-interrupt`: a comment pushed the damage guard more than 220 characters from the toast); the comment was shortened and the file passes 11/11.

New or changed:
- `password-signin-mode`: 13 new. `wholePixelOffset`; the frame snapped and re-snapped on resize, and not after the screen ends; whole-pixel line heights; the plain message line (inside the screen, no box, cleared on the next try); out of tries on the line, then a failure close; the note's pull-up rules; X, Esc and the on-screen Esc key give the close result; a lockout keeps its result; `signin-chosen` and Change; the short-window rules; `headCropOffset`; the head crop and 32px avatar properties; the n2 guard.
- `container-shares`: 1 new. After an unlock, nothing is pending; closing the archive and then the Notes opens nothing.
- `lock-scope-refusal`, `error-toast-floor`: the player's close shows no toast; running out of tries still does.
- `access-signin-postit`: follows the new guard and the combined note rules.

### Live proof

Keyless server on :3316 from this worktree, stopped afterwards. Headless Chromium with scrollbars shown, `setFPS(20)` with fixed steps on (`[20, true]` logged on every run). New games:
- 2658, 2659, 2660: test_access_signin (swapped onto test_access_networks), hot desk and lockout PC at 1400x1000, 800x600 and 915x412.
- 2661: test_access_signin, Ian's archive and the stale-return check.
- 2662, 2663, 2664: m01 (`--start-room kevin_office`) at the three sizes.
- 2665: test_access_networks (`--give kit_dropbox`).
- 2666: test_access_habits (swapped, `--start-room omar_room`).

Measured:
- m1: the frame's left and top are whole at every size and state: tiles, chosen, wrong, lockout (one left and locked), plain (open, wrong, maxed), archive, Wi-Fi and Omar's PC. The snap applied `0.5px` left at 915x412 and `0.5px` top where the height was odd. Every 32px and 64px portrait is on whole pixels.
- m2: on m01 the message line and the note do not intersect at 1400x1000, 800x600 or 915x412; no `.minigame-failure-message` appears.
- m3: X, Esc in the field and the on-screen Esc key end with `closedByPlayer` and no `gameAlert`, on m01 at three sizes, the hot desk, the archive and the Wi-Fi prompt. Running out of tries still raises "Failed to enter correct password." as an error.
- m4: at 915x412, chosen: the note (267 to 322) is inside the scroll area (to 329). Wrong: the area scrolls 37px and the note (274 to 329) and the message line (230 to 268) are both in view. Change brings the tiles back.
- m5: after the unlock the archive opens with nothing pending; its Close lands in the world, and the Notes closing later opens nothing.
- n1: the short portraits use `256px 256px` at offsets such as `-58px -5px` (`data-short="head-crop"`).

Shots in the session scratchpad under `ux-shots/slice2a-final/`, named by review page id: `main-01`, `main-02`, `main-03`, `main-04`, `main-07`, `main-08`, `main-09`, `main-11`, `main-12`, `main3-01`, `main3-05`, `main3-08`, `unlock-44` (m01, 915x412), `unlock-53` (m01, 800x600), plus `portrait-3x-915x412.png` (the new 32px portraits at 3x), `wrong-915x412`, `chosen-915x412`, `chosen-800x600`, `wrong-800x600`, `plain-wrong-1400x1000`, `archive-wrong-1400x1000`, `stale-after-notes-1400x1000`. Driver `drive.mjs`, logs in `logs/`.

### Not done, and notes

- `main-05` and `main3-07` did not show the intended screens. Corrected in R4 (review R4 n5): both were mistakes in this round's driver, not game bugs. For main-05 the driver left the hot desk desktop open after closing Switch user (that X returns to the desktop, as designed), so `interact('ian_pc')` returned `minigame-active`; and `it_room` is not next to `hot_desk_room`, so the route has to go through the lobby. For main3-07 the driver searched the network view's `hosts` for `sv_fs02` before any office session had been signed in through the box (SV-FS02 is listed only after that pivot), and the server host is not in that array even afterwards; the view's own Sign in button opens the screen. The R4 review retook both (`slice2a-r4/main-05.png`, game 2681; `slice2a-r4/main3-07.png`, game 2707), and the R4 fixes proof refreshes them in `slice2a-final/` (see "R4 fixes").
- Boxes of odd width centred inside the frame (the field label, Submit, Add to Notepad, some tile names, "Choose an account.") still sit on half a pixel horizontally. The frame itself is whole. Fixed in R4 (m2).
- The 64px tile still draws the 128px talk frame at x0.5 (`background-size: 200%` of a 64px box). R3 n1 covered the 32px box only. Fixed in R4 (m1).
- When an NPC has a 32x32 `avatar`, the short window shows that headshot rather than the talk-frame crop. Test_access_signin has no avatars, so the proof shows the crop, which shows the face better. Switching the order is one line in `applyTilePortrait`.

### Handover (R3)

Done: m1 to m5, n1, n2. Commits: c732c8d78 (fixes and tests), plus the follow-up (damage-guard comment, note reveal at 915x412) and this log. Open: q98 (prompt skin); the two retakes above.

## R4 fixes

Review: `UX_SLICE2A_REVIEW_R4.md` (89ea3a504; 0 blockers, 0 majors, 2 minors, 5 nits). All seven fixed.

| Finding | Fix | Files |
| --- | --- | --- |
| m1, the 64px tile was the 128px frame at half size | `setTilePortrait` puts the sheet at its own size (`256px 256px`) and cuts a 64x64 head crop with the same finder as the 32px box (`headCropOffset(alpha, frameSize, 64)`, so the 64 crop is the 32 crop's centre and top). Every path is whole-scale: a talk sheet is cut at scale 1 in both boxes; a 64x64 image is shown at scale 1, with a 32x32 head crop of it in the short window; a 32x32 headshot is shown at x2 in the 64px box and at scale 1 in the 32px box. No `contain`, `cover` or percentage size is left. | `password-minigame.js` |
| m2, odd boxes inside the frame on half pixels | `snapInnerBoxes` walks every box in the frame in document order after the frame is snapped, and moves any box whose left or top is fractional onto the pixel: an in-flow box by a relative `left`/`top` (added to its own), a positioned one (the eye toggle) by `translate`, so its anchors stay. `unsnapInnerBoxes` undoes it before each pass, so offsets never add up. It runs with the frame snap (first paint, resize, ResizeObserver) and also from a MutationObserver on the frame (new text changes a centred box's width without changing the frame's size); the records of its own style writes are dropped with `takeRecords()`. An image load (capture phase) and a late font also re-snap. `wholePixelOffset` keeps six decimal places, because Chrome lays out in 1/64px steps and the Add to Notepad icon was 0.015625px off. `.keyboard-toggle-btn` and `.key` no longer use `transition: all`, so a snapped `left`/`top` lands at once. | `password-minigame.js`, `password-minigame.css` |
| n1, an empty Submit pushed the post-it half out of view | `showScreenMessage` reveals the `.postit-note` first, then the line, as `setSignInMessage` does. | `password-minigame.js` |
| n2, chosen and Switch user overflowed 4 to 5px at 915x412 | The short-window `.signin-screen` has 4px gaps (was 6) and 6px padding above and below (was 8). Gaps alone left the chosen screen 3px over. | `password-minigame.css` |
| n3, the finder missed 4 bedside portraits; odd sheets used `contain` | `PORTRAIT_CROP_OVERRIDES`, keyed by talk sheet file name, gives the 64 and 32 crops for mr_ahmed, mr_pryce, mrs_kowalski and ms_okafor (checked by eye at 4x: `bedside-crops.png`). A picture that is not a talk sheet and not exactly 32x32 or 64x64 (the two 120x120 hood sheets) is skipped: the avatar is tried next, then initials in Press Start 2P. | `password-minigame.js` |
| n4, dead `duration` | Dropped from `showScreenMessage` and its three callers; the no-line fallback box keeps a fixed 1500ms. | `password-minigame.js` |
| n5, the build log listed main-05 and main3-07 as owed | The R3 "Not done" bullet now says both were driver mistakes and points to the retakes; the two later bullets are marked fixed in R4. | this log |

The override is a table in the engine rather than a `portraitCrop` field in scenario data: none of the four is a sign-in account today, and a scenario field would need the server's tile builder (`login_account_tiles`) to pass it. That is one more key per tile if it is wanted later. No synced state is added; every change is client display only.

### Tests

New in `password-signin-mode.test.mjs`: the 64x64 crop at scale 1; no portrait box ever gets a size that is not a whole multiple of the image (talk sheets at 256 and 512, a 64 avatar, a 32 headshot, an override sheet, a 120 and a 128 picture), and the base `.signin-portrait` rule sets no size; the overrides stay inside the frame and win over the finder; an odd sheet falls through to the headshot; the inner snap (a relative box, a positioned box by translate, no build-up on a second pass, a new message re-snapped by the observer); the 1/64px step; unsnap restores inline values; no `transition: all`; the note revealed before the line; no `duration`; the 4px gap rule. The test that measures every state at every size is the live one below (JSDOM has no layout): `geom` lists every visible element in `.password-frame` whose left or top is not whole.

Run without the lock: the 34 node test files that import or read `password-minigame.js` or its CSS, `minigames/index.js`, `network-links.js` or `minigame-starters.js`. 443 pass, 0 fail.

### Live proof

Keyless server on :3318 from this worktree, stopped afterwards. Headless Chromium with scrollbars shown, `setFPS(20)` with fixed steps on (`[20, true]` logged on every run). The driver is the R4 review's, with the final shot names: `slice2a-final/drive-r4.mjs`, logs in `slice2a-final/logs-r4/` (run 1's in `logs-r4-run1/`). New games:
- Run 1 (before the 1/64px, load and font fixes), 2725 to 2736: found the Add to Notepad icon 0.015625px off and one late `.password-info` re-flow.
- Run 2 (all fixes but the padding), 2737 to 2748: test_access_signin (swapped onto test_access_networks) for the hot desk, Switch user, Ian's PC, the lockout PC and the archive at 1400x1000, 800x600 and 915x412 (2737 to 2742); m01 (`--start-room kevin_office`) at the three sizes (2743 to 2745); test_access_networks (`--give kit_dropbox`) at 1400x1000 and 915x412 (2746, 2747); test_access_habits (swapped, `--start-room omar_room`, 2748).
- Run 3 (final CSS), 2760 to 2763: the sign-in and lockout scenes at 800x600 and 915x412.

Measured:
- m2: no visible element in the frame has a fractional left or top in any state at any size: tiles, chosen, wrong, Change, Switch user, Ian's PC (open, refused), lockout (one left, locked), archive (open, wrong), plain (open, empty, wrong, refusal, network error, maxed), Wi-Fi (open, empty, wrong), Lena's and SV-FS02's remote sign-ins and Omar's PC. Every count is 0.
- m1: at 1400x1000 the three account tiles are `256px 256px` at `-42px -5px`, `-37px -14px` and `-32px -4px`; at 800x600 and 915x412 the 32px boxes are at scale 1 as before. `portrait-64px-3x.png` and `portrait-32px-3x.png` are the live boxes enlarged 3x.
- n1: on m01 at 915x412 an empty Submit leaves the note at 232 to 329, inside the area (to 329); it was 290 to 387.
- n2: at 915x412 the chosen and Switch user screens overflow by 0 with no scrollbar (were 5 and 4). A wrong password still scrolls the area (41px) with the note and the line in view, as R3 m4 set.
- End to end, unchanged: local sign-in, Switch user and its X back to the desktop, Ian's PC refusing `sokafor` then signing in `ishaw`, lockout and Esc with `locked_out`, the archive unlock with no stale return, the Wi-Fi prompt, remote sign-in to Lena's PC, Ledger-Archive, SV-FS02 after the pivot (refused `lfox`, then `ishaw`), Backup-Vault. X and Esc end with `closedByPlayer` and no toast. No page errors; the console errors are the expected 422s and the faked 403 and 500.

Shots in `ux-shots/slice2a-final/` (refreshed): `main-01` to `main-05`, `main-07`, `main-08`, `main-09`, `main-11`, `main-12`, `main3-01`, `main3-05`, `main3-07`, `main3-08`, `unlock-44`, `unlock-53`, `chosen-*`, `wrong-*`, `tiles-*`, `switch-*`, `tiles-crop-*`, `plain-wrong-1400x1000`, `archive-wrong-*`, `stale-after-notes-*`, `portrait-64px-3x`, `portrait-32px-3x`, `bedside-crops`. `main-05` is Ian's PC refusing `sokafor` (game 2737); `main3-07` is the SV-FS02 remote sign-in (game 2746).

### Handover (R4)

Done: m1, m2, n1 to n5. Commits: 6794aa8b1 (fixes and tests), 2c050b621 (1/64px step, image and font re-snap, gaps), 4be85c8e0 (padding), and this log. Open: q98 (prompt skin). Possible follow-up: a scenario `portraitCrop` field passed through the tile builder, if a posed portrait ever becomes a sign-in account.

## Final fixes

For UX_SLICE2A_REVIEW_R5.md (0 blockers, 1 major, 3 minors, 5 nits). There is no further review round: the live run below is the acceptance proof.

- **M1.** `core/game.js` builds the start room with `createRoom` directly, so it skipped the per-room syncs that the loader in `core/rooms.js` makes. It now makes the same four (`screenStates`, `networkLinks`, `postitMarks`, `npcWorkarounds`) right after `createRoom(startRoomId, ...)`. Live on game 2822 and again on 2840 (`omar_room` start): `postitMarks.marks` holds `omar_pc` after boot with no hand sync, its bottom at the PC's bottom (120 against 120). `main-09` and `main-11` are retaken and show the note on the monitor (on `main-11`, the locked screen with its padlock).
- **m1.** `snapInnerBoxes` skips a box drawn scaled, rotated or skewed (a press's `scale(0.95)`), and everything inside it; a pure translate (the eye toggle's -50%) is still measured. The returned list carries a non-enumerable `skipped` count. When the last snap left a box out, the frame snaps again on that box's `transitionend` or `transitioncancel` for transform, or on the frame after a `pointerup` or `keyup`. Live, after a real mouse press: the keyboard toggle ends at 664,585 (1400x1000), 364,331 (800x600) and 422,218 (915x412) with no inline offset, and Shift at 460,805, 160,551 and 218,551. Every off-grid count after the press is 0.
- **m2.** A narrower note (`max-width: 200px`) wrapped m01's note to four lines and made 800x600 overflow by 12px, so that change was dropped. Instead, in the short window the plain screen's note is pulled up 44px, not 48px, when no message line shows. It covers no control in any state at 800x600 or 915x412 (`noteHits` empty throughout).
- **m3.** Press Start 2P now sits on its 8px grid everywhere on these screens. The sign-in title is 16px, and 8px in the short window, where 16px together with the n4 backing made the chosen screen 5px too tall at 915x412. The frame's X goes from the framework's 18px to 16px, and the device header (`.password-info h4`) from 20px bold to 16px normal. The rules audit also found two synthetic bolds and two fractional sizes on these screens, all fixed: the attempts count is no longer bold, and the keyboard toggle and the tiles get 16px in place of the browser's 13.33px button default. GNF sizes are unchanged, pending the user's font policy for GNF (q105): the tile name at 15px, the username at 13px, Change at 14px (it is GNF, inherited, not Press Start 2P), the field at 18px, the prompt title at 22px, the plain label at 20px.
- **n1.** The snap reads before it writes. One pass reads every rect and computed style, adds each box's moved ancestors to its rect, rounds, then writes. A second pass checks the result and normally finds nothing to do, so a snap costs two layouts however many boxes move. With the on-screen keyboard shown (88 boxes, 26 moved): 6 to 9ms a run, 12.4ms at most, against 25 to 36ms before.
- **n2.** `.key` fades `color` with its background.
- **n3.** `.password-field` is `box-sizing: border-box`.
- **n4.** `.signin-field-row label` has the plain label's `#101820` backing, 2px 8px padding and `align-self: flex-start`.
- **n5.** In the short window a prompt's bezel padding is 6px 12px, its title margin 4px and its controls' top margin 4px. The archive's wrong state at 915x412 now overflows by 0, with no bar and the attempts box whole.

### Tests

New: `postit-marks.test.mjs` (a start-room sign-in PC has its mark once the start room is built; game.js makes the four syncs between `createRoom(startRoomId` and `revealRoom(startRoomId)`). `password-signin-mode.test.mjs` adds three tests: a scaled box and its child are skipped and a translated one is not; one read pass and one check pass (6 reads for 3 boxes) with a child carried by its parent's move; and the CSS for m2, m3 (every Press Start 2P size a multiple of 8), n2 to n5, the X, the attempts weight and the 16px button sizes.

Run without the lock: 54 node test files that import or read `password-minigame.js` or its CSS, `minigames/index.js`, `minigame-starters.js`, `network-links.js`, `core/game.js` or `postit-marks.js`: 838 pass, 0 fail. The full JS suite once, `MERGE_BATCH=1 bin/test-js -j 3` under the lock, on 60b08e672: 543 files passed, 0 failed.

### Live proof

A keyless server on :3320 from this worktree, stopped afterwards (killed by its own PID). Headless Chromium with scrollbars shown (`--hide-scrollbars` removed), and `setFPS(20)` with fixed steps on (`[20, true]` logged on every run). The scripts are the R5 reviewer's `drive-r5.mjs` and `probe-snap.mjs`, copied to `ux-shots/slice2a-fix/` with the port, the output folder and three changes. The habits scene logs the post-it marks. The probe scrolls the toggle, the letters and Shift into view before pressing, because at 915x412 a press below the fold landed on the game and closed the screen. The probe also clears its counters before the toggle press. The UI rules audit (`p-ux-audit/tools/playtest/ui-rules-audit.mjs`) is copied there with scrollbars shown, and run with the surface files `surfaces-plain.mjs`, `surfaces-signin.mjs` and `surfaces-wifi.mjs`. Logs are in `slice2a-fix/logs/`. Shots go to `slice2a-final/`.

New games:
- Pass 1 (all fixes but the short-window title): test_access_signin (swapped onto test_access_networks) for the sign-in scenes 2804 to 2806 and the lockout and archive 2810 to 2812; m01 (`--start-room kevin_office`) 2837 to 2839; test_access_networks (`--give kit_dropbox`) 2819 and 2820; m02 (`--start-room it_department`) 2823; test_access_habits (swapped, `--start-room omar_room`) 2840; the probe on 2807 to 2809 (sign-in) and 2816 to 2818 (m01); the audit on 2841 (sign-in), 2842 (m01) and 2843 (Wi-Fi). Earlier runs during the fixes used 2813 to 2815, 2822, 2827 to 2829 and 2834 to 2836. 2821, 2824 to 2826 and 2830 to 2833 are stray games and were not used.
- Pass 2 (final CSS), for every scene the short-window title touches: sign-in 2845 to 2847, lockout and archive 2858 (800x600) and 2848 (915x412), networks 2849 (915x412), the probe on 2851, 2853 and 2855 (m01) and 2852, 2854 and 2856 (sign-in), and the audit on 2857. 2850 was made and not used.

Measured, with the final code, across every state at all three sizes (hot desk tiles, chosen, wrong, Change, Switch user, Ian's PC open and refused, lockout one left and locked, archive open and wrong, m01 plain open, empty, wrong, refusal, network error and maxed, m02, Wi-Fi open, empty and wrong, Lena's and SV-FS02's remote sign-ins, SV-FS02 refused, Omar's PC):
- Off the pixel grid: 0 in every state, and 0 after the eye toggle, the keyboard toggle press, 10 on-screen letters, Shift twice, six Tabs, a resize and a wheel scroll.
- The post-it covers no control in any state.
- X inside the frame, no Cancel, no radius or 1px border, no box moved out of its parent or onto a sibling (largest move 0.5px).
- A scrollbar shows only where content truly overflows, all at 915x412: m01 plain (113px open, 179px with the line), the sign-in wrong state (39px), the remote sign-ins (31px, 73px refused). Chosen, Change, Switch user, Ian's PC, the lockout, the archive (open and wrong) and Wi-Fi fit with no bar.
- The audit on the password screens (plain open, wrong and keyboard; sign-in tiles, chosen, wrong and typed username; archive open and wrong; Wi-Fi open and wrong) at the three sizes: 0 breaches. The only findings at 1400x1000 belong to other windows the audit's first open caught behind the password screen (the notes window open at boot, and the hot desk's container desktop under the archive). They are not password screens and are left for the general audit.
- End to end, unchanged: local sign-in, Switch user, Ian's PC refusing then signing in, lockout and Esc, the archive unlock with no stale return, Wi-Fi, the plant, Lena's remote sign-in and Ledger-Archive, the pivot, SV-FS02 and Backup-Vault. No page errors. The console errors are the expected 422s and the faked 403 and 500.

Shots refreshed in `ux-shots/slice2a-final/`: `main-01` to `main-05`, `main-07`, `main-08`, `main-09`, `main-11`, `main-12`, `main3-01`, `main3-05`, `main3-07`, `main3-08`, `unlock-44`, `unlock-53`, and the per-size `tiles-*`, `chosen-*`, `wrong-*`, `switch-*`, `lockout-*`, `archive-*`, `plain-*`, `wifi-*`, `remote-*`, `m02-*` shots.

### Handover (final)

Done: M1, m1, m2, m3, n1 to n5. Open for the user: q105 (GNF sizes). Not done: the 1400x1000 audit findings on the notes window and the container desktop, which are outside this slice.
