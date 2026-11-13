Counts: blockers 0, majors 1, minors 3, nits 5

# UX slice 2a (sign-in and shares): code and UX review round 5 (final)

Branch build/ux-signin at 49fde6fad, reviewed against R4 (89ea3a504): commits 6794aa8b1, 2c050b621,
4be85c8e0 and 49fde6fad. Read with UX_SLICE2A_REVIEW_R4.md, the "R4 fixes" section of
UX_SLICE2A_BUILD_LOG.md, and the UI design language, pixel-art UI and no-downscaling rules.

Orchestrator decisions taken as given, not findings: the bedside crop override stays an engine table;
the crop values chosen by eye stand (none of the four cuts off a face).

## Live look

Keyless server on :3319 from this worktree, stopped afterwards (killed by its own PID). Headless
Chromium with `--hide-scrollbars` removed, so scrollbars show. `setFPS(20)` with fixed steps on
(`[20, true]` logged on every run). The R4 driver, copied with two additions: an extra probe after
every measurement (frame wraps content, X inside the frame, no Cancel, post-it against every control,
fonts in use, radius and 1px borders, true overflow, and for every box the snap moved: did it leave its
parent or newly overlap a sibling), and an m02 scene. A second script (`probe-snap.mjs`) counts and
times every snap run. All in the session scratchpad under `ux-shots/slice2a-r5/` (driver
`drive-r5.mjs`, logs in `logs/`).

New games:
- 2770, 2771, 2772: test_access_signin (swapped onto test_access_networks). Hot desk at 1400x1000,
  800x600 and 915x412: tiles, chosen, wrong, Change, local sign-in, Switch user, Ian's PC typed
  username (refused, then signed in).
- 2774, 2775, 2776: test_access_signin. Lockout (one left, locked, Esc) and the archive (X, Esc,
  wrong, unlock, no stale return) at the three sizes.
- 2777, 2778, 2779: m01 (`--start-room kevin_office`). Plain screen at the three sizes: open, empty,
  wrong, X, Esc in the field, the on-screen Esc key, refusal and network error (faked at `/unlock`),
  out of tries.
- 2785: m02 (`--start-room it_department`). Gary's workstation at 1400x1000: open, empty, wrong, X.
  (2784, an m02 game without the start room, was made and not used.)
- 2781, 2782: test_access_networks (`--give kit_dropbox`). Wi-Fi prompt, plant, remote sign-in to
  Lena's PC, Ledger-Archive share, the pivot, SV-FS02 remote sign-in (refused, then `ishaw`),
  Backup-Vault share, at 1400x1000 and 915x412.
- 2783: test_access_habits (swapped, `--start-room omar_room`). Omar seated, away, his sign-in screen.
- 2773 (aborted on a probe selector), 2791: the snap probe on the hot desk. 2780: the snap probe on
  m01. 2796, 2797: the room mark on Omar's PC.

## Tests

Run without the lock: every node test file that imports or reads `password-minigame.js` or its CSS
(13 files, 171 pass, 0 fail), and every file that imports `minigames/index.js`,
`minigame-starters.js` or `network-links.js`, which pull the module in (21 more files, 272 pass,
0 fail). No Rails file changed in R4.

## The snap machinery (focus 1)

Measured live with a counter on the instance's `_innerSnapped` (each run sets it twice):

| Action | Runs | Cost per run |
| --- | --- | --- |
| Idle 3s, after open (m01 and hot desk) | 0 | |
| Typing 20 characters on the real keyboard | 0 | |
| Choosing a tile | 2 | 2ms |
| Eye toggle | 2 | 1 to 2ms |
| Tab through 6 controls (focus rings) | 0 | |
| Hover sweep over 15 on-screen keys | 0 | |
| 10 on-screen letters | 2 | 5ms |
| On-screen keyboard shown (88 boxes, 28 moved) | 2 | 25ms, max 36ms |
| Shift twice, keyboard shown | 2 | 24ms, max 30ms |
| Resize 1400x1000 to 915x412 and back | 2 each | 1 to 18ms |
| Wheel scroll of the area | 0 | |

- Loops: none. The MutationObserver drops the records of the snap's own writes, typing changes
  `value` (a property, not an attribute) and so never triggers it, and nothing re-ran while idle.
- Out of the parent, onto another box: none. Over every state at every size the largest move was
  0.5px; no moved box left a parent it was inside, and none newly overlapped a sibling.
- Every state at every size has 0 boxes on a fractional left or top at the moment it is measured,
  except after a press on a scaled control (m1).
- The eye toggle gets `translate: 0px 0.5px` and stays inside its field.
- Teardown: after the X, after being displaced by another minigame (`startNotesMinigame`), and
  after a direct `endMinigame`, the old instance has no snap, no ResizeObserver and no
  MutationObserver. The displaced path is cleared at once by the frame's own `isConnected` check.

## The narrowed `transition` lists (focus 2)

`.keyboard-toggle-btn` keeps background, border and transform; no state of it changes anything else.
`.key` loses `color`, which `:active` and `.key-shift.active` change (n2). Keeping `transform` in both
lists is what lets the snap measure a key mid-animation (m1).

## Portrait paths (focus 3)

Every path is whole-scale. Live: the 64px tiles are `256px 256px` at offsets such as `-37px -14px`
(a 64x64 crop at scale 1), the 32px boxes `256px 256px` at `-53px -14px` (a 32x32 crop at scale 1),
and the fourth tile is the "?" box with no image. All 134 talk sheets are 256x256; the 120 128x128
`_talk_init` pictures are not what the tile builder sends. The 32x32 headshot at x2 and the 64x64
avatar are covered by the unit test, and `.signin-portrait` has `image-rendering: pixelated`, so the
x2 case is drawn as whole pixels. The background-size test is sound: it reads the inline size and
the short-window custom property, fails on `%`, `contain` and `cover`, demands a whole multiple of
the natural size and a whole-pixel offset, and checks that the base rule sets no size.

## Rules pass (focus 4)

At 1400x1000, 800x600 and 915x412 across local sign-in, typed username, Switch user, lockout,
Change, archive, Wi-Fi, plain (m01, m02), remote sign-in, share sign-in and share folder:
- X inside the frame in every state; no Cancel anywhere;
- the frame wraps its content (nothing outside it but the scrolled area);
- no radius, no 1px borders;
- every text face is GNF or Press Start 2P, but several sizes are off the face's grid (m3);
- a scrollbar shows only where content truly overflows: plain at 915x412 (109px), wrong sign-in at
  915x412 (41px), remote sign-in at 915x412 (29px, 71px refused), archive wrong at 915x412 (13px,
  n5). The chosen and Switch user screens at 915x412 now fit with no bar (R4 n2 holds);
- the post-it covers no control on any sign-in screen; on m01's plain screen it covers 1px of Submit
  at 800x600 and 915x412 (m2);
- X and Esc end with `closedByPlayer` and no toast; the lockout keeps `locked_out`; the end-to-end
  chain (both shares, the pivot, SV-FS02) works at both sizes. No page errors; the console errors are
  the expected 422s and the faked 403 and 500.

## After shots against the review page (focus 5)

The final shots in `slice2a-final/` match their cards' titles (main-01 to 05, 07, 08, 12; main3-01,
05, 07, 08; unlock-44 and unlock-53), with one exception: main-09 ("Password on a sticky note
(in-room mark), owner seated") and main-11 ("Locked screen sprite (padlock) with post-it") show
Omar's PC with no sticky note on it. See M1.

## Findings

### Majors

**M1. A sign-in PC in the start room never gets its post-it mark, so main-09 and main-11 show none.**
`public/break_escape/js/core/game.js:2086` (`installPostitMarks(this)`) runs before the start room
is built at `:2194` (`createRoom(startRoomId, ...)`), and that direct call skips the loader in
`core/rooms.js:1021` that calls `postitMarks.syncRoom(roomId)`. The install's own `syncRoom()`
(`systems/postit-marks.js:154`) finds no rooms yet.

Live on 2796 and 2797 (`omar_room` start): Omar's PC has `hasPostit: true` and `lockType: login`,
`_wanted` is true and the texture is loaded, yet `postitMarks.marks` is empty. Calling
`postitMarks.syncRoom('omar_room')` by hand adds the mark. Zoomed at 6x, the monitor in both final
shots and in this round's main-11 has no yellow pixels. The same order is on main, so this predates
the slice, but the two cards that judge the slice's room-mark fix (bottom on the PC's bottom) show
nothing to judge, and in any mission a sign-in PC in the start room has no mark.

Fix: call `window.postitMarks?.syncRoom(startRoomId)` (with the `screenStates`, `networkLinks` and
`npcWorkarounds` syncs `rooms.js:1015-1023` makes) after `createRoom` at `game.js:2194`, or move
those syncs into `createRoom` itself. Add a test that a start-room sign-in PC with `hasPostit` has a
mark after boot, then retake main-09 and main-11.

### Minors

**m1. The snap measures a pressed control mid-scale and leaves it off the pixel grid after release.**
`public/break_escape/js/minigames/password/password-minigame.js:280` (`getBoundingClientRect` in
`snapInnerBoxes` includes transforms) with `css/password-minigame.css:379-381` and `:548-551`
(`transform: scale(0.95)` on `:active`, still in the transition lists at `:371` and `:537`).

Clicking the keyboard toggle changes the keyboard's `style` (a mutation) while the button is
scaled. The snap writes `left: 0.212646px; top: 0.212646px` on it, and after release the button and
its icon sit at 664.203, 587.203. Shift does the same (`left: 0.463623px; top: 0.409851px`, the key at
459.953, 807.406). Nothing re-snaps until the next content change, so the keyboard icon and the
Shift label stay blurred across two pixel columns.

Fix: skip any element that has a transform, or an ancestor with one, other than the eye toggle's
`translateY(-50%)`. Or measure with `offsetLeft` and `offsetTop` chains, which ignore transforms.
Or drop `transform` from the two transition lists and re-snap on `transitionend`. Add a live check
that the toggle and Shift are whole after a click.

**m2. On m01's plain screen the post-it covers the bottom pixel of Submit at 800x600 and 915x412.**
`public/break_escape/css/password-minigame.css:454-460` (`margin: -48px 0 0 0` pulls the note up
over the bezel).

Measured: note 86,260 to 380,357 against Submit 349,216 to 452,261 at 800x600; note 140,220 to
434,317 against Submit 401,176 to 504,221 at 915x412. The note's 2px border sits on Submit's bottom
row for 31px. m01's note is three lines and 294px wide, so it reaches under Submit; the sign-in
notes and m02's are narrow enough to clear it. The user's rule is that the post-it never covers a
control.

Fix: cap the plain-screen note's width so its right edge ends left of the field column, for example
`max-width: 200px` on `.password-minigame-area:not(.signin-mode) .postit-note`. Or pull it up 2px
less when it would meet Submit. Add the note-against-controls check to the frame test.

**m3. Several sign-in texts use pixel fonts at sizes off the face's grid, so their strokes are uneven.**
`public/break_escape/css/password-minigame.css:730-731` (`.signin-title`, Press Start 2P at 14px),
`:803` (`.signin-name`, 15px), `:810` (`.signin-username`, 13px), `:909` (`.signin-change`, 14px,
new in this slice).

Zoomed at 3x (`zoom-fonts.png`), "Hot desk PC" has doubled and single strokes side by side, and the
13px username is grey-edged. Press Start 2P is drawn on an 8px grid and GNF on 16px (the R2 code
review's own note at `:845`). The title, names and usernames are on every sign-in, Switch user,
lockout and remote screen. The rule is pixel text at crisp sizes.

Fix: Press Start 2P at 16px (or 8px in the short window) for the title. GNF at 16px for the name,
Change and Submit. The username can drop to a lighter colour at 16px, or be hidden as the short
window already does. Check the tile widths still fit "Other user".

### Nits

**n1. A snap with the on-screen keyboard shown costs 25 to 36ms.**
`public/break_escape/js/minigames/password/password-minigame.js:275-300`.

Each moved box writes `left`/`top` and the next box's `getBoundingClientRect` forces a new layout.
That is 28 layouts for one Shift press or keyboard toggle, two frames' worth. Typing never snaps, so
players will rarely notice.

Fix: read every rect first, then write. A child's new position is its old one plus the sum of its
moved ancestors' offsets, so one read pass and one write pass give the same result.

**n2. `.key` text changes colour at once while its background still fades.**
`public/break_escape/css/password-minigame.css:537`.

`color` is no longer in the list. On a press the label goes black over the grey #444 that is only
starting to turn green, and on release it goes white over a background still green. Fix: add
`color 0.2s ease`.

**n3. The Username field on a typed-username screen is 60px wider than the Password field and overruns
the form.**
`public/break_escape/css/password-minigame.css:295-297` (`.password-field`: `width: 100%` plus 57px
padding and a 2px border, content-box) inside `.signin-form`'s 360px (`:815-820`).

Measured on Ian's PC at 1400x1000: Username 520 to 940, Password 520 to 880, with the form 360px
wide. The password input sits in a flex wrapper and shrinks; the username input does not. Fix:
`box-sizing: border-box` on `.password-field`, or on `.signin-field-row input`.

**n4. The sign-in screen's field labels are white straight on the wallpaper.**
`public/break_escape/js/minigames/password/password-minigame.js:1346` and `:1350`, styled only by
`.signin-field-row` (`css/password-minigame.css:832`).

"Username:" and "Password:" sit on pale sky and trees with no backing. At 915x412 the first letter of
"Password:" is lost against a tree. The plain screen gave its label a dark backing for the same
reason (`:252-259`, UX access R2), so one concept now has two looks. Fix: give `.signin-field-row
label` the same `#101820` backing and 2px 8px padding, with `align-self: flex-start`.

**n5. At 915x412 a wrong archive password shows a scrollbar for 13px, and cuts off the attempts box.**
The short-window block, `public/break_escape/css/password-minigame.css:959` onwards, has no
prompt-mode rule.

Measured on 2776: overflow 13px, a 12px bar, and the "Attempts: 1/3" box's bottom border below the
frame (`archive-wrong-915x412.png`). Fix: in the short window, trim the prompt-mode bezel's padding or
the keyboard toggle's margin by 14px so the wrong state fits. The open state already fits.

## Not findings

- The eye toggle, focus rings, wheel scrolling and resizes keep every box whole.
- No synced state is added; every R4 change is client display only.
- Successes still use the centred box, and the field moves up when the line appears (R4, not
  findings then either).
