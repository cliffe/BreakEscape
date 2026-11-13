Counts: blockers 0, majors 0, minors 5, nits 2

# UX slice 2a (sign-in and shares): code and UX review round 3

Branch build/ux-signin at 387bafb84, reviewed against R2 (11f596c53): commits 89b795576, d03a1b7f2
and 387bafb84. Read with UX_SLICE2A_REVIEW_R2.md, the "R2 fixes" section of UX_SLICE2A_BUILD_LOG.md,
and the UI design language and pixel-art UI rules.

## Live look

Keyless server on :3315 from this worktree, stopped afterwards. Headless Chromium with
`--hide-scrollbars` removed, so scrollbars show. `setFPS(20)` with fixed steps on (`[20, true]` logged
on every run). New games:

- 2599, 2600, 2601: test_access_signin (swapped onto test_access_networks). Hot desk sign-in at
  1400x1000, 800x600 and 915x412, and the lockout PC at 1400x1000 and 915x412.
- 2602, 2603: test_access_signin. Ian's archive password at 1400x1000 and 915x412, covering the X,
  the on-screen Esc key, a forced close, running out of attempts, an unlock and the archive's own
  Close. Also the stale-return check below.
- 2604: test_access_signin, not used.
- 2605, 2606, 2607: m01 (`--start-room kevin_office`). Plain screen at three sizes, then the desktop.
- 2608: m02 (`--start-room it_department`). Gary's workstation and its desktop.
- 2609: test_access_networks (`--give kit_dropbox`). Remote sign-in to SV-FS02, the SV-FS02 desktop,
  and the Wi-Fi prompt at 1400x1000 and 915x412.

The "before" captures route the changed public files to their 11f596c53 contents in the browser.
The worktree was not touched. Shots, the driver (`drive.mjs`) and per-run logs are in the session
scratchpad under `ux-shots/slice2a-r3/`.

## Tests

Run without the lock: the 21 node test files that import `password-minigame.js`,
`container-minigame.js`, `container-item-image.js` or `postit-marks.js`. Every file exits 0, with
256 passing and 0 failing.

## R2 findings, checked live

- M1 (4px overflow and a system scrollbar): fixed. The overflow is 0 and no scrollbar shows at
  1400x1000 and 800x600 on every screen: hot desk (tiles, chosen, wrong), lockout, archive, Wi-Fi,
  m01, m02 and remote sign-in. At 915x412 the 12px pixel-art scrollbar appears only where the content
  really is taller.
- M2 (sign-in at 915x412): fixed. Submit is in view once a tile is chosen. After a wrong password,
  the area scrolls 55px and "Incorrect username or password. 4 attempts left." sits inside it. The
  lockout line is in view. See m4 for the post-it on the same screen.
- m1 (Esc in a field): fixed. Esc in a field, Esc on the page and the X all end with `closedByPlayer`
  true, at once, with no "cancelled" message. This holds on the hot desk, the lockout (`locked_out`),
  m01, m02, the archive, the remote sign-in and the Wi-Fi prompt (whose field has the focus when it
  opens).
- m2 (share icon at 1.85x): fixed. The SV-FS02 desktop differs from 11f596c53 only inside the 52x36
  icon box.
- m3 (Add to Notepad outside the frame): fixed. The row is inside the frame on the hot desk, m01
  and m02.
- n1 and n2: fixed, as the build log says. The room mark was not re-shot this round.

## Bezel `::before` inset

The change is pixel-identical. The bezel has no `position`, so `::before` is positioned against
`.password-minigame-area`, which covers the whole bezel either way. The bezel's own `clip-path`
cuts what lies outside it, so the -4px only ever added unseen overflow.

I checked live on each screen by capturing the bezel with inset 0, then again with the old -4px
forced, holding the scroll and layout fixed. The PNG bytes are identical on all of these:
- hot desk tiles at three sizes;
- the archive prompt at two sizes;
- m01 at three sizes;
- m02;
- the remote sign-in to SV-FS02.

PC desktops use `.container-monitor-bezel`, a separate rule that this slice did not change. The
m01 and m02 desktops are pixel-identical to 11f596c53. The SV-FS02 remote desktop differs only in
the share icon box (m2).

`.container-monitor-bezel::before` (`container-minigame.css:120`) still uses -4px, and the
desktop bezel's scrollHeight is 4px over its clientHeight (559 against 555). No scrollbar shows
there, but the later `.pixel-scroll` merge should set it to inset 0 too.

## Close paths after `cancelPassword` went

- Lockout: `signInLockedOut` restores its own X and Esc handlers, which already called
  `closeByPlayer`. Live: the X takes the focus, and Esc ends with `locked_out` and `closedByPlayer`
  true.
- Attempts counter: running out still ends through `passwordFailed`'s 1.5s timer, with `closedByPlayer`
  false and `max_attempts_exceeded`. `cleanup()` removes the X and Esc listeners during that box, so
  a player close cannot slip in (live: an X click in the box did nothing). Nothing counted the
  cancel as an attempt.
- Wi-Fi prompt: Esc in the field and the X both end at once with `closedByPlayer` true, and with no
  toast.
- `cancelPassword`'s message and 800ms delay are used nowhere else: nothing in `js/` or `test/`
  reads the "cancelled" texts. Its `reason: 'cancelled'` was never read either, because
  `startPasswordMinigame`'s info branch checks `result.cancelled`, which only the lock-scope
  refusal sets. See m3: that branch is now dead, and the player's own close reads as a rejection.
- On-screen keyboard: "Esc" sits beside "Enter" in the same purple, and reads as the keyboard's key
  (after-archive-keyboard-1400x1000.png). It closes as the X does. That is sensible.

## Archive password X

- X, on-screen Esc and Esc in the field all go back to Ian's desktop (`ContainerMinigame` open).
- Forced close (`complete(false)`, as a hit does): stays in the world, and the pending return is
  cleared.
- Out of attempts: stays in the world, with `max_attempts_exceeded`, and the pending return is
  cleared.
- Unlock: hands over to the archive (`router_backup.txt` shown). See m5 for what is left behind.

## Short-window tiles

At 800x600 and 915x412 the tile is 84px and the portrait is 32x32, with `background-size: 200%` of
a 256x256 talk sheet. That draws the 128px closed-mouth frame at 1/4 scale. It is a whole-number
factor, but a 4:1 nearest-neighbour downscale rather than a crop: each face comes out a few pixels
across (zoom3-tiles-crop-915x412.png). The three people are still told apart by build and clothing
colour, and the names carry them. "Sam Okafor" and "Other user" wrap to two lines at 15px. Both
are legible. See n1.

## Post-it position

At 1400x1000 the note's top is 40px above the bezel's bottom edge. It overhangs the bezel's left edge
by 14px and its bottom by 15px, and sits 5px below the message line. In a short window it is pulled
up 24px. In both cases it reads as stuck to the bezel's lower-left, as the user asked
(after-signin-wrong-1400x1000.png, after-signin-wrong-800x600.png, after-signin-tiles-915x412.png).
At 915x412, once a tile is chosen, it is no longer on screen (m4).

## Scrollbar guard for Firefox

Both guards are false in Chromium (checked live: `CSS.supports('-moz-appearance', 'none')` is
false, `CSS.supports('selector(::-webkit-scrollbar)')` is true), and both are true in Firefox, so
both work today. The builder's reason holds. Live, a box with `scrollbar-color` set got a 15px
system scrollbar in place of the 12px `::-webkit-scrollbar`.

Slice 1's `@supports not selector(::-webkit-scrollbar)` is the right guard, and the merge should
use it. It tests the feature the fallback stands in for, not a vendor property that only one
engine happens to parse. It also stays correct if an engine ever drops `::-webkit-scrollbar` or
starts parsing `-moz-appearance`.

Slice 1 also sets `scrollbar-color: auto` and `scrollbar-width: auto` on the scroller. This
matters because `scrollbar-color` inherits: an ancestor that sets it would switch Chromium off the
pixel-art rules. This slice has no such reset (n2).

## Findings

### Minors

**m1. Frames land on fractional pixels, so their text sits off the pixel grid.** (Orchestrator ruling.)
`public/break_escape/css/password-minigame.css:8-21` (the frame, centred by the container's flex
layout and `margin: 16px auto`), with half-pixel heights such as `.signin-name` `line-height: 1.1`
(`:794`, 16.5px at 15px).

Measured:
- 1400x1000: top 210.25 with a tile chosen, 209.75 on the lockout, 104.5 on m01;
- 800x600: top 118.5 on the tile screen, 47.5 on m01;
- 915x412: left 135.5 on every screen, because the odd width centres the 644px frame on a half
  pixel.

The 32px portraits inherit the offset (left and top .5 at 915x412, top .5 at 800x600). The
viewport-centred failure box sits on 465.4 as well.

Fix:
- give text inside the frame whole-pixel line heights (for example `.signin-name { line-height:
  17px; }`);
- snap the frame after layout: a ResizeObserver on `.password-frame` that applies
  `translate(-fx, -fy)`, where fx and fy are the fractional parts of its rect;
- add a live test that the frame's rect is whole at 1400x1000, 800x600 and 915x412, in the tiles,
  chosen, wrong, lockout and plain states.

**m2. On the plain screen the 1.5s failure box and the post-it overlap.** (Orchestrator ruling.)
`public/break_escape/css/minigames-framework.css:83-96` (`.minigame-failure-message`, fixed and
centred in the viewport) with `public/break_escape/js/minigames/password/password-minigame.js:858`
(`passwordIncorrect` calls `showFailure`).

On m01 the box (248,171 to 667,241) crosses the note (140,123 to 434,220) at 915x412. It does the
same at 800x600 (box 200,253 to 600,347 against note 86,260 to 380,357), so this is not confined to
the shortest window. The two draw over each other, and each hides part of the other's text
(after-plain-wrong-kevin_office_pc_0-800x600.png and -915x412.png). At 1400x1000 they do not meet.

Fix: write the wrong-password text on a line inside the screen, as the sign-in screen does with
`setSignInMessage` (for example under Submit, or in the attempts counter's row), and reveal it with
`revealInFrame`, with no overlay. Test that at 800x600 and 915x412 the message's rect and the
note's rect do not intersect.

**m3. The player's own close of a password screen shows a red "Password Rejected" toast for 5s.**
`public/break_escape/js/systems/minigame-starters.js:624-633` (`startPasswordMinigame` onComplete).

`closeByPlayer` ends with `gameResult` null, so the `result?.cancelled` info branch (`:629`),
written for a cancel, is never reached. The X, Esc and the on-screen Esc key all give "Failed to
enter correct password." as an error, with the locked-hint duration. Seen live on m01 at three
sizes, on m02, and on every archive close, including the X that returns to Ian's desktop.

This predates R2: the X did it in R1, and old `cancelPassword` set no `cancelled` flag. Now that
every close goes through `closeByPlayer`, though, every close shows it. That makes it the one path
still built around the old cancel.

Fix:
- in `PasswordMinigame`, override `closeByPlayer` to set
  `gameResult = { success: false, reason: 'closed', cancelled: true, closedByPlayer: true,
  attempts }` unless a result is already set (a lockout);
- in the starter, show no toast when `result?.closedByPlayer`;
- move the unused `cancelPassword` to the delete folder, under the delete rule;
- test that the X and Esc on a plain screen raise no `gameAlert`.

**m4. At 915x412 the sign-in post-it scrolls out of view once a tile is chosen.**
`public/break_escape/js/minigames/password/password-minigame.js:1161` (`revealInFrame` on Submit)
with the short-window block in `public/break_escape/css/password-minigame.css:919-950`.

The note's top is at 345 against the scroll area's bottom at 329. After a wrong password it is at
335 against 329. The note holds the credentials the player is about to type, so they have to
scroll past the message to read it again (after-signin-chosen-915x412.png,
after-signin-wrong-915x412.png).

Fix: in the `max-height: 640px` block, once an account is chosen, collapse the tile row to the
chosen tile, or hide it behind the "Sam Okafor (sokafor)" line with a "Change" link. That saves
about 85px, enough for the field, Submit, the message line and the note together. Then re-check
that `.postit-note` is inside the area at 915x412 in the chosen and wrong states.

**m5. After the archive unlocks, Ian's desktop is left as a pending return and reopens later from
nowhere.** `public/break_escape/js/minigames/container/container-minigame.js:1305` sets
`pendingContainerReturn` for the hand-over. `:636-638` (`init`) clears it only when it is a network
screen.

Seen live (game 2603):
1. Unlock the archive. It opens with `pending` true.
2. Close it with its X. The player lands in the world and `pending` stays true.
3. Open and close the Notes. Ian's hot desk desktop opens.

The same happens on 11f596c53 (game 2600), so it predates R2. It sits on the archive return path
that R2 owns, though, and it makes "the X goes back to the desktop" uneven: the lock screen's X
returns to the desktop, but the archive's own Close does not.

Fix: in `init()`, also clear a pending return whose `containerItem` is a sign-in desktop at the
keyboard. Better, treat the archive container like a share: arm the same player-close-only return
when it opens from Ian's desktop, so its Close goes back to the desktop. Test both: after an unlock
and Close, the desktop is open (or nothing is pending), and a later Notes close opens nothing.

### Nits

**n1. The 32px tile portrait is the whole talk frame at 1/4.**
`public/break_escape/css/password-minigame.css:933-937`.

It is legible by figure and colour, but it is a downscale, and the faces are lost. A whole-number
crop would show more: for example `background-size: 400%` with a position on the head, so the 32px
box holds the top-centre 64x64 of the frame at x0.5. That is the same scale as the 64px tile, and
shows the face.

**n2. The Firefox scrollbar guard differs from slice 1's.**
`public/break_escape/css/password-minigame.css:63-68`.

`@supports (-moz-appearance: none)` sniffs a vendor property. Use slice 1's
`@supports not selector(::-webkit-scrollbar)`, add `scrollbar-color: auto; scrollbar-width: auto`
on the scroller, as `.pixel-scroll` does, and use `auto` rather than `thin`. Better still, adopt
`.pixel-scroll` when the slices merge. That is the guard of record for the merge.

## Not findings

- The X stays drawn but does nothing during the 1.5s "Maximum attempts" box. This predates the
  slice, and it is what keeps that close forced.
- No synced state is added. All the R2 changes are client display only.
