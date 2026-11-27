Counts: 0 blockers, 2 majors, 2 minors, 4 nits.

# UX slice 2a (sign-in and shares): code review round 1

Branch build/ux-signin at c80e9c37c, reviewed as `git diff build/ux-feedback...HEAD` (10 files).
Read with the plan (UX_FEEDBACK_ROUND_PLAN.md, slice 2a), the build log (UX_SLICE2A_BUILD_LOG.md),
the user's notes on main-01, main-11, main-12, main3-05, main3-07 and main3-08, and the before and
after shots.

## What was checked

- Each user ask against the after shots and a live look.
- Pixel-art rule on every changed rule and element, with computed styles read in the browser.
- The share folder window from both entry points (a mapped share on a remote desktop, a share row
  in the network view), and where Close lands from each.
- The remote desktop header's link name on the real path.
- The post-it on the plain password screen (m01).
- Tests on the parent's source.

## Live look

Keyless server on :3311 from this worktree, headless Chromium, `setFPS(20)` with fixed steps on
(`[20, true]` logged each run), 1400x1000 and 800x600. Games: 2433 (test_access_signin, swap),
2434 (test_access_habits, swap, made but not driven: the build log's main-11 shots and the unit
test cover the mark), 2435, 2444 and 2445 (test_access_networks, new game with kit_dropbox),
2436 (m01, start room kevin_office). Server stopped afterwards. Shots and the driver are in the
session scratchpad under `r1-2a/`.

The drop box was planted through `networkLinks.plant`, so the client knows the link's name (the
builder's run went straight to the API and skipped this).

## Test results

- On HEAD, without the lock: the 21 node test files that import the container or password
  minigame, `container-item-image.js` or `postit-marks.js`: 241 pass, 0 fail.
- Must-fail check: the four changed test files run against the merge base's `public/` tree.
  access-signin-postit fails 1 (the new CSS test), postit-marks fails 2, container-shares fails 9
  (all seven slice 2a tests and the two re-pinned older ones), inventory-restore-sprite-image
  fails 1. Each new assertion fails without its change.

## Orchestrator observations

1. Rounded bezel corners and an empty band below the screen (after-main-01): not confirmed.
   The bezel has no `border-radius` (computed `0px`); its corners are the stepped `clip-path`
   (2px steps over 10px), which is pixel art and must stay. `.password-minigame-area` also
   computes `0px`. The webp blur makes the steps look smooth at full size; zoomed, they show
   steps. The bezel's frame is 28px on all four sides (8px border plus 20px padding: bezel
   400 to 1000 by 60 to 400, screen 428 to 972 by 88 to 372), so the strip below the screen is
   the same as the top and sides. The large empty area under the whole bezel (from 400 down to
   the Cancel row) is the fixed-height password area with the keyboard hidden. That is older
   layout and not part of this slice.
2. Share folder window reads as unfinished (after-main3-08): confirmed. See M2. The header image
   itself is fixed (the folder icon now loads, no broken `network_share.png`), so the user's
   "Fix the header image" is met, but the icon is shown at a fractional scale (M1).
3. main3-05 "through your link": confirmed as a driver artefact. On the real path the header
   reads "Remote session through Drop box: comms room", both for SV-FS02 opened after a
   foothold sign-in and for Lena's PC opened from the network view's row.

## User asks

- main-01, main-12 (note off centre, to the left): met. The note sits at the bezel's lower-left
  (note 386 to 674 by 352 to 407, bezel left 400), 14px past the left edge, as on the desktop.
  Same at 800x600.
- main-11 (mark's bottom on the PC sprite's bottom): met (see n1 for a half-pixel detail).
- main3-05 (landscape desktop as above): the landscape CSS already applied; the share label is
  now the name only ("Backup-Vault") with `\\SV-FS02\Backup-Vault` as the tooltip. Met.
- main3-07 (shared sign-in module): slice 2b, not in this branch. Correctly left alone.
- main3-08 (header image): met, with M1.

## Findings

### Majors

**M1. The share header icon is drawn at 3.08x, not a whole number.** The header `<img>`
(`.container-image`) is an 80px content box with `object-fit: contain`, so the 26x18
`m09_folder1.png` is drawn 80x55.4 (measured: box 84x84 with its 2px border, natural 26x18). The
plan says "shown x2". This is the element the user asked to fix, and the pixel-art rule asks for
whole-number scale on any changed icon. Fix: for the share header, size the picture explicitly
(52x36 at x2, or 78x54 at x3) and centre it in the 80px box, instead of `contain`. The title bar
icon is 26x18 at 1x and is fine.

**M2. The folder window looks unfinished.** At 1400x1000 the window is a fixed 600x261 box
(`.share-folder-window`, grid `min-height: 160px`) at the top of a 1400x880 frame, leaving about
450px of empty navy below it. The file is a 16x16 glyph at 2x (32px) inside a 64px tile, and the
drawn part of that glyph is about 10px of the 16, so it reads as a dot in a large grey square.
At 800x600 the proportions are fine. Suggested: let the window grow with the frame (for example
`width: min(880px, 100%)` and a pane height tied to the frame, as the desktop does with
`calc(100vh - 440px)`), and drop the grey tile fill in the white pane so a file reads as an icon
with a name, as on a real file browser. A larger file glyph would need new art (not a resize, per
the no-downscaling and whole-number rules).

### Minors

**m1. The file tooltip in the folder window is clipped.** `.share-folder-files` has
`overflow-y: auto`, which also clips horizontally and at the top, so the hover tooltip above a
file in the first row is cut in half by the pane's top edge (seen on hover at 1400x1000). It also
repeats the label already printed under the file. Either hide the tooltip in the folder window
(the label carries the name) or place it inside the slot.

**m2. At 800x600 the m01 password note covers half of "Add to Notepad".** `elementFromPoint` at the
button's left and centre returns `.postit-note`. This is older: with the old CSS injected the note
covered the same button (note 120 to 414 by 541 to 638). The slice changed this rule, so it is a
cheap place to fix it (for example a lower `z-index` than the controls row, or keep the note above
the controls by capping the area's height at small windows). The sign-in screen at 800x600 is
clear.

### Nits

**n1. The room mark's bottom sits half a pixel above the sprite's bottom.** `Math.floor(top + h -
4.5)` gives a centre at bottom minus 5, so a 9px picture with origin 0.5 spans bottom minus 9.5 to
bottom minus 0.5 (the build log's -392.5 against -392). `roundPixels` hides it on screen. A cleaner
form is `setOrigin(0.5, 1)` at `y = top + h`; the comment's "never hangs half a pixel below"
describes the current result loosely.

**n2. An orphaned JSDoc line.** In `container-minigame.js` the comment "The folder picture for a
share stub" stayed behind when `SHARE_ICON` moved out, and now sits above `TRANSFER_LABELS`.

**n3. The two share headers differ.** A share from the network view shows "A file share on
HB-FS01." under its name; a mapped share on a desktop shows an empty line (the server's mapped
stub has no `observations`). Either give the mapped stub the same line client side from its UNC
host, or leave both empty.

**n4. The sign-in post-it CSS test is loose.** It accepts any negative `left` and any negative top
margin, so a later change to, say, `left: -400px` would pass. Pinning the exact values (or the
note's left edge against the bezel's) would hold the position the user approved.

## Not findings

- Close paths: a share from a remote desktop closes back to that remote desktop (`sv_fs02`,
  `remote.footholdId` kept, desktop mode); a share from the network view closes back to the
  network view. Both from a live run.
- Shares from both entry points are the same folder window (`shareFolder: true`,
  `desktopMode: false`), so the two now match.
- Pixel-art rule on the new CSS: 2px bevel borders, square corners, a hard 4px offset shadow with
  no blur, GNF in the title bar and labels, `image-rendering: pixelated` on the title icon. Bezel
  and area have no radius.
- Sync: client display only; nothing new stored or sent.
- The m01 desktop and password screens: the note sits at the bezel's lower-left at 1400x1000 and
  the screen's controls are clear of it.
- "The PC should be on a desk" (main-11) is about the test scenario's dressing, outside this slice.
