Counts: blockers 0, majors 2, minors 3, nits 2

# UX slice 2a (sign-in and shares): code and UX review round 2

Branch build/ux-signin at ddcc10302, reviewed against R1 (3cfd1d615): commits b07685776, cf7841113,
939fa9485 and ddcc10302. Read with UX_SLICE2A_REVIEW_R1.md, the "R1 fixes" section of
UX_SLICE2A_BUILD_LOG.md, and the UI design language and pixel-art UI rules.

## Live look

Keyless server on :3313 from this worktree, headless Chromium, `setFPS(20)` with fixed steps on
(`[20, true]` logged on every run). Server stopped afterwards. New games:

- 2497: test_access_signin (swap, host test_access_networks). Sign-in tiles, wrong password,
  Other user, X, Esc, lockout, archive password.
- 2498: test_access_habits (swap, `--start-room omar_room`). Room mark, forced on with
  `postitMarks.mark`.
- 2499: test_access_networks (`new-game.rb --give kit_dropbox`). Wi-Fi prompt, remote desktop,
  share folder window.
- 2500, 2525, 2527: m01 (`--start-room kevin_office`). Plain password screen at three sizes, then
  the desktop.
- 2501: m02 (`--start-room it_department`). Gary's workstation password screen and desktop.

Before shots came from the merge base (6290be45c) by routing the six changed public files to their
base contents in the browser. The worktree was not touched. Most runs used Chromium with
`--hide-scrollbars` removed, because headless Chromium hides scrollbars by default (see M1). The
shots, the driver (`drive.mjs`) and per-run logs are in the session scratchpad under
`ux-shots/slice2a-r2/`.

## Tests

Run without the lock: the 21 node test files that import `container-minigame.js`,
`container-item-image.js`, `password-minigame.js` or `postit-marks.js`, or read their CSS.
247 pass, 0 fail.

The two older tests changed for sound reasons:
- `minigame-controls-layout`: the password area's fixed `calc(100% - 80px)` height was removed on
  purpose (it caused the empty band), so the test now pins `height: auto`, `margin: 0 auto` and the
  frame's scroll. The container half of the test is unchanged.
- `inventory-restore-sprite-image`: the share header now passes a class to
  `containerImageHtml(...)`, so the test counts calls by their opening text. It still requires all
  three headers to use the helper. The match is slightly looser, which is fine.

## R1 findings, checked live

- M1 (share header icon at 3.08x): fixed. The header picture is 26x18 drawn at 52x36 with padding
  22px 14px in the 84px box (`data-scale` 2), at 1400x1000 and 800x600.
- M2 (folder window): fixed. 880x699 at 1400x1000 and 724x323 at 800x600. The 16px file glyph is at
  x4 on whole pixels (offsets 0,0). There is no grey tile, and hovering a file shows its name navy
  on white (`rgb(0,0,128)` / white). This looks like a file browser now.
- m1 (tooltip): fixed. No `.container-content-tooltip` and no repeated `title`.
- m2 (post-it over Add to Notepad): fixed. `elementFromPoint` reaches every control on every screen
  at all three sizes.
- n1 (mark half pixel, y): fixed. The mark's bottom is at 120, level with the sprite's bottom
  (origin 0.5, 1). See n1 below for the same thing on x.
- n2, n3, n4: fixed. The mapped share's header reads "A file share on SV-FS02."

## Password Cancel removal

- The X gives the same result as the old Cancel, which also called `closeByPlayer`:
  `endMinigame(false, null)` with `closedByPlayer` true. This was checked in sign-in, plain (m01,
  m02), Wi-Fi prompt and archive. After an X following a wrong password, the hot desk holds no
  session and no minigame is left open.
- Esc with the focus on the page gives the same result. Esc with the focus in a field does not
  (m1).
- On a lockout the X takes the focus, and Enter on it closes the screen (`locked_out`,
  `closedByPlayer` true).
- The controls row is present only with Add to Notepad: one row on the hot desk, m01 and m02, and
  none on Ian's PC, the lockout PC, the Wi-Fi prompt or the archive. `#minigame-cancel` is absent
  in every password mode.

## Frame

The X sits 8px inside the frame's top and right edges, clear of the 2px border, at 1400x1000,
800x600 and 915x412, in every mode. The frame stays within the viewport on every run.

The side effect is fine: the minigame container is still `rgba(0,0,0,0.95)`, so the game around the
smaller frame shows only as a faint outline. It reads as a framed panel over a dimmed scene, the
same as other framed panels. The `#3a3a3a` border is low contrast on near-black but visible.

## Findings

### Majors

**M1. Most password screens show a browser scrollbar inside the frame at full size.**
`public/break_escape/css/password-minigame.css:28` (`overflow-y: auto` on
`.password-frame > .minigame-game-container`).

The game area's content is 4px taller than the area on the sign-in screens and the plain screens.
Measured scrollHeight against clientHeight:
- hot desk: 415 vs 411 at 1400x1000, and 329 vs 325 at 800x600;
- Ian's PC: 375 vs 371;
- lockout PC: 408 vs 404;
- m01: 704 vs 700, and 432 vs 428;
- m02: 623 vs 619.

The Wi-Fi prompt and the archive do not overflow.

With scrollbars enabled (as on desktop Chrome on Windows and Linux), a 15px white system scrollbar
appears inside the frame at 1400x1000 (`offsetWidth` 640 against `clientWidth` 625). It pushes the
bezel off centre, crowds the X, and breaks the pixel-art rule.

Headless Chromium hides scrollbars by default, which is why the builder's shots and R1 did not show
it. Compare after-probe-signin-1400x1000.png and after-signin-lockout-1400x1000.png with
after-plain-kevin_office_pc_0-1400x1000.png.

The extra 4px does not come from the post-it: screens without a post-it (Ian's PC, the lockout PC)
overflow too. No child's border box reaches past the area, so something in the area's scrollable
overflow (an offset, margin or pseudo-element) adds it.

Fix:
1. Find and remove the 4px. Outline the area's descendants in the browser and look at scrollable
   overflow, not border boxes.
2. Give the frame's scroll area a pixel-art scrollbar: square, 2px-bordered, in the theme colours,
   using `::-webkit-scrollbar` and `scrollbar-color`. It is still needed in short windows (M2).
3. Add a live check (Playwright with `ignoreDefaultArgs: ['--hide-scrollbars']`) that
   `scrollHeight <= clientHeight` at 1400x1000 on the hot desk and on m01.

**M2. At 915x412 the sign-in screen hides Submit and the attempts and lockout message below the
fold.** `public/break_escape/css/password-minigame.css:841` (short-window block).

The build log says the field and Submit show at 915x412 without scrolling. That holds for Ian's PC
(typed username) and the Wi-Fi prompt. It does not hold for the hot desk once a tile is chosen:
- the frame's scroll area is 311px tall and its content is 507px;
- the password field is cut at the frame's bottom;
- Submit (328 to 373) and "Incorrect username or password. 2 attempts left." (395 to 433) are both
  outside the frame (bottom 323).

The same happens with Other user: the password field starts at 347. On m01 at 915x412 the attempts
counter is below the fold (content 432 in 311).

Enter still submits, but the player cannot see the result or how many attempts are left without
scrolling. In a real browser that scroll is the system scrollbar from M1. See
after-signin-wrong-915x412.png and after-signin-other-915x412.png.

The controls row (65px plus margins) sits outside the frame and costs a fifth of the height.

Fix, in the `max-height: 640px` block:
- shrink the sign-in tiles (smaller portrait box, no username subtitle) and the gaps around them;
- move the controls row into the frame (see m3);
- after `setSignInMessage` (password-minigame.js:1194) writes an error or lockout line, call
  `scrollIntoView({ block: 'nearest' })` on the line, so the result is always on screen.

Then re-check the hot desk, Other user and the lockout at 915x412.

### Minors

**m1. Esc in a focused field still closes differently from the X.**
`public/break_escape/js/minigames/password/password-minigame.js:587-590` (plain and prompt key
handler) and `:1082` (sign-in key handler) call `cancelPassword()` (`:896`).

That path shows "Sign-in cancelled." or "Password entry cancelled." and closes 800 ms later with
`reason: 'cancelled'` and `closedByPlayer` false. The X and page-level Esc close at once with
`closedByPlayer` true.

Seen live:
- hot desk: Esc after typing gives `byPlayer: false`;
- Wi-Fi prompt: the field has the focus on open, so even a plain Esc takes this path.

This predates the slice, but with Cancel gone the X and Esc are the only two closes, and the brief
asks that they match. `closedByPlayer` decides whether a close goes back to the container it came
from.

Fix: have the field's Esc call `this.closeByPlayer()` and `stopPropagation()`, or set
`this.closedByPlayer = true` in `cancelPassword` when the player pressed Esc. Add a test that Esc in
the field and the X end with the same `endMinigame` arguments.

**m2. The mapped share's desktop icon is at a fractional scale.**
`public/break_escape/css/container-minigame.css:244-247` (`.desktop-icon-image`, 48x48,
`object-fit: contain`) with `container-minigame.js:967` (`SHARE_ICON` on a desktop icon).

The 26x18 folder is drawn at about 1.85x on the SV-FS02 desktop
(after-remote-desktop-1400x1000.png). `fitWholeScale` covers the share header and the folder
window, but not the desktop icon path, which the slice added in 6282b2658. The 16x16 desktop icons
land at x3 and are fine.

Fix: call `fitWholeScale(iconImg, 48)` for desktop icons. That puts the folder at x1 (26x18); for
x2, use a 52px box for share icons. Either way, test that the scale is whole.

Older fractional headers, the `pc_desktop` header (36x24 in 80, 2.2x) and the m01 PC header
(34x27, 2.35x), predate this slice. They are noted here but not counted.

**m3. Add to Notepad sits outside the frame.**
`public/break_escape/js/minigames/password/password-minigame.js:320-328` (`ensureControlsRow`
appends the row to the container, after the frame).

The design language says the frame wraps all the content. On the hot desk, m01 and m02 the button
floats on the dimmed game under the frame (after-signin-wrong-1400x1000.png).

Fix: append the row inside `.password-frame`, after the game area, as a fixed flex item
(`flex: 0 0 auto`) that does not scroll. The area scrolls above it, so the post-it still cannot
cover it, and in short windows the frame gets the row's height back (M2).

This is a design call: the build log chose the outside row on purpose. Raise it with the user if
in doubt.

### Nits

**n1. The room mark sits half a pixel off on x.** `public/break_escape/js/systems/postit-marks.js:49`.

x is the rounded centre of a 9px picture with origin 0.5, so its left edge is at 163.5 (live, with
the sprite's left at 160). `roundPixels` hides it on screen.

Fix: draw with origin (0, 1) at `x = Math.round(left + POSTIT_INSET)`, or keep the centre on a
half pixel (`left + inset + 4.5` with a whole `left`).

**n2. The hover highlight fills the whole 152px label box.**
`public/break_escape/css/container-minigame.css:756`.

A short name gets a wide navy bar, where a file browser highlights only the name.

Fix: make the label `display: inline-block; max-width: 152px` inside a centred wrapper, or
highlight a span around the text.

## Not findings

- The m01 desktop (Kevin's workstation, with post-it) is pixel-identical before and after at
  1400x1000. On m02 (Gary's workstation) the only differing pixels are in the dimmed game behind
  the controls row (an NPC moving), and the panel is identical.
- The share folder window at both sizes, the Close paths (remote desktop to the share and back to
  SV-FS02 with the foothold kept), and the header line "A file share on SV-FS02." all work.
- At 800x600 every sign-in path fits: tiles, typed username, wrong password, Other user. The Wi-Fi
  prompt and the archive fit at all three sizes.
- Closing the archive password screen with the X does not return to Ian's desktop. The base build
  behaves the same with Cancel (checked with the base files), so this predates the slice.
- No synced state is added. All changes are client display only.
