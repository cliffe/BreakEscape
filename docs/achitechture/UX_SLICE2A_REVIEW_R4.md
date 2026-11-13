Counts: blockers 0, majors 0, minors 2, nits 5

# UX slice 2a (sign-in and shares): code and UX review round 4

Branch build/ux-signin at 7dee6da99, reviewed against R3 (84a92d6dc): commits c732c8d78, 9d7362f1e
and 7dee6da99. Read with UX_SLICE2A_REVIEW_R3.md, the "R3 fixes" section of UX_SLICE2A_BUILD_LOG.md,
and the UI design language and pixel-art rules.

## Live look

Keyless server on :3317 from this worktree, stopped afterwards. Headless Chromium with
`--hide-scrollbars` removed, so scrollbars show. `setFPS(20)` with fixed steps on (`[20, true]` logged
on every run). New games:

- 2681, 2682, 2683: test_access_signin (swapped onto test_access_networks). Hot desk at 1400x1000,
  800x600 and 915x412: tiles, chosen, wrong, Change, local sign-in, Switch user. Then Ian's PC
  (typed username) at 1400x1000 (2681) and 915x412 (2683).
- 2684, 2685, 2686: test_access_signin. Lockout PC at 1400x1000, 915x412 and 800x600. Ian's archive
  at 1400x1000 (2684) and 915x412 (2685), including the stale-return check.
- 2687, 2688, 2689: m01 (`--start-room kevin_office`). Plain screen at the three sizes: empty field,
  wrong password, X, Esc in the field, the on-screen Esc key, a refusal and a network error (both
  faked at `/unlock` with a route), and running out of tries.
- 2690, 2691: test_access_networks (`--give kit_dropbox`). Wi-Fi prompt at 1400x1000 and 915x412.
  The remote part of these runs failed on a driver selector and was redone below.
- 2706 (selector check), 2707 (1400x1000) and 2708 (915x412): test_access_networks. Wi-Fi prompt, then
  plant the box, remote sign-in to Lena's PC from the view's Sign in, open the Ledger-Archive share
  from her desktop, close back to the view, remote sign-in to SV-FS02 (a refused account, then
  ishaw), and open the Backup-Vault share.

Shots, the driver (`drive.mjs`), the probes and per-run logs are in the session scratchpad under
`ux-shots/slice2a-r4/`. The head crop check is `crop_dump.py`, `crop_run.mjs` and `crop_sheet.py`,
with the contact sheets `headcrops-1.png`, `headcrops-2.png` and `headcrop-misses.png`.

## Tests

Run without the lock: the 33 node test files that import `password-minigame.js`,
`password-minigame.css`, `container-minigame.js` or `minigame-starters.js`. Every file exits 0, with
389 passing and 0 failing.

## R3 findings, checked live

- m1 (frames on fractional pixels): fixed for the frame. Its rect is whole at every size and state:
  tiles, chosen, wrong, switch, lockout, plain, archive, Wi-Fi and both remote sign-ins. The snap
  applied 0.5px left at 915x412 and 0.5px top where the height was odd. Every 32px and 64px
  portrait is on whole pixels. Boxes centred inside the frame are not: see m2.
- m2 (failure box over the post-it): fixed. On m01 at 1400x1000, 800x600 and 915x412, the empty
  field, wrong password, refusal, network error and out-of-tries texts all go on the line. No
  `.minigame-failure-message` appears and the line never meets the note.
- m3 (toast on the player's own close): fixed. X, Esc in the field and the on-screen Esc key end
  with `{ reason: 'closed', closedByPlayer: true }` and no `gameAlert`. Checked on m01 at three
  sizes, the hot desk, Switch user, Ian's PC, the archive (X and Esc), Wi-Fi and the remote screens.
  The lockout keeps `{ reason: 'locked_out' }` on Esc. Running out of tries still raises "Failed to
  enter correct password." (error, 5000ms). A refusal raises nothing.
- m4 (post-it out of view at 915x412): fixed.
  - Chosen: the tile row folds, the note (267 to 322) is inside the area (to 329), and Change
    shows at 503,100.
  - Wrong: the area scrolls 37px, and the note (274 to 329) and the line (230 to 268) are both in
    view.
  - At 800x600 the same fold applies. Change (451,192 to 519,216) is inside the area, and so are
    the note and the line.
  - Change is a real button: it takes focus by keyboard (tabIndex 0), and pressing it brings the
    tiles back, focuses the first tile, clears the field and resets the line to "Choose an
    account.". Choosing another tile folds the row again.
  - On the lockout PC at 800x600 and 915x412, Change stays after "This account is locked on this
    PC.", so another account can be picked.
  - It is 2px bordered, square and on whole pixels (zoom-change-915.png).
- m5 (stale desktop return): fixed. After the unlock the archive opens with nothing pending. Its
  Close lands in the world, and closing the Notes later opens nothing. This holds at 1400x1000 and
  915x412. The archive's X and Esc still go back to Ian's desktop.
- n1 (32px portrait): fixed for the short window. The 32px boxes use `256px 256px` at offsets
  such as `-58px -5px`, so they are a scale-1 crop. Over all 134 talk sheets, the finder frames the
  face on 129. It misses 4 bedside portraits, and one silhouette is dark by design. See n3. The 64px
  tile is still a downscale: see m1.
- n2 (scrollbar guard): fixed as described. Not re-tested in Firefox.

## `cancelPassword` callers

There are none left. A grep over `public/`, `test/`, `tools/`, `app/`, the scenarios and
`.claude/` finds the name only in:
- the R2 and R3 reviews and the build log;
- the test that asserts it is gone (`password-signin-mode.test.mjs:630`).

The test bridge (`js/systems/test-bridge/`) never called it. No other minigame calls it either:
the three `startMinigame('password', ...)` callers (`unlock-system.js:584`, `:630`,
`network-links.js:638`) and `startPasswordMinigame` read only `success`. The one reader of
`cancelled` that is left, `unlock-system.js:848`, belongs to another lock's outcome, not the
password screen's. The new `reason: 'closed'` is read nowhere, which is harmless.

## The in-screen line for Wi-Fi, refusal and network error

This was the builder's own call. It is the right one, and should stay.

- It is the sign-in screen's pattern (`setSignInMessage`), so the plain, Wi-Fi and sign-in screens
  now say things the same way, in the same 2px-bordered box. That matches "one design language per
  concept".
- Wi-Fi: "Please enter the key" and "That key was not accepted." sit on the line inside the frame
  at 1400x1000 and 915x412, with no overlay and no toast. Before this, a 1.5s box covered the middle
  of the window.
- Refusal ("This PC is off."): shown on the line for 2s, then the screen closes with
  `refused: 'off'`. It counts no attempt and raises no toast, so the reason stays readable while the
  screen is up.
- Network error: shown on the line. The attempt is handed back (the counter reads 0), and the next
  wrong password replaces the text.
- The line stays until the next try instead of vanishing after 1.5s. That is better: the old box
  could vanish before a slow reader finished it. It leaves `duration` dead (n4).
- Successes ("Connected.", "Password accepted!", "Signed in as ...") still use the centred box. Each
  closes the screen within a second, so nothing waits behind it. That is acceptable.
- One side effect: the screen's content is centred vertically, so the field and Submit move up when
  the line appears (27px at 1400x1000 on m01). The sign-in screen has done the same since R1 and no
  round has flagged it. It is not a finding.

## End to end

Every step below worked live, at the sizes listed above:
- local sign-in: hot desk, Sam (`sokafor`), then the desktop;
- typed username: Ian's PC refuses `sokafor` with "This account can't sign in on this PC.", gives
  "Incorrect username or password." for a wrong password, then signs in `ishaw` to the desktop;
- Switch user: the screen shows the current session. Its X returns to the desktop, and the
  desktop's X closes to the world;
- lockout: "1 attempt left", then "This account is locked on this PC.", then Esc with `locked_out`;
- archive: the X, Esc and a wrong password. The unlock hands over to the archive;
- Wi-Fi prompt;
- remote sign-in: Lena's PC from the view's Sign in, typed, then her desktop;
- share: Ledger-Archive opens from Lena's desktop. Closing her desktop returns to the view, now with
  SV-FS02 (task N2);
- the SV-FS02 remote sign-in refuses `lfox`, signs in `ishaw` (task N3), and Backup-Vault opens.

There were no page errors. The only console errors are the expected 422s from wrong passwords.

## Why main-05 and main3-07 did not open (orchestrator question)

Both were driver mistakes. Neither is a bug in the game.

- main-05 (Ian's PC, typed username refused). In the final proof's run, the X on the Switch user
  screen hands back to the hot desk desktop, as designed (`openLoginSignIn` onComplete,
  `switching && signedIn`). The driver went on with that desktop still open, so
  `__test.interact('ian_pc')` returned `minigame-active` (logs/signin-1400.log line 16 in
  `slice2a-final`). Also, `it_room` is not next to `hot_desk_room`, so `enterRoom('it_room')`
  from there returns `no-doorway` unless the player goes through the lobby first. Retaken through
  the lobby: `slice2a-r4/main-05.png` (game 2681) shows the refusal line at 1400x1000, and
  `ian-refused-915x412.png` (game 2683) shows it at 915x412.
- main3-07 (SV-FS02 remote sign-in). The final driver searched
  `networkLinks.views.get(fh).hosts` for `sv_fs02` and called `openRemoteSignIn` only when it found
  the row. It never did, for two reasons. First, SV-FS02 is on `server_net` and is listed only after
  an office session has been signed in through the box and its desktop closed back to the view
  (task N2); the final driver signed in to nobody before searching. Second, even after the pivot,
  the server host is not in that `hosts` array. The view's own Sign in button on the SV-FS02 row
  calls `window.openRemoteSignIn` and opens the screen correctly. Retaken: `slice2a-r4/main3-07.png`
  (game 2707) and `remote-fs02-915x412.png` (game 2708).

`openRemoteSignIn` is not broken.

## Findings

### Minors

**m1. The 64px tile shows the 128px talk frame at half size.** (Orchestrator ruling.)
`public/break_escape/js/minigames/password/password-minigame.js:166-169` (`backgroundSize = '200%
200%'` on a 64px box, `css/password-minigame.css:786`).

Live at 1400x1000: each portrait is `64px` with `200% 200%` of a 256px sheet. That is a 2:1
nearest-neighbour downscale of the whole frame (tiles-crop-1400x1000.png). On full-body sheets
(Ian), the face is a few pixels across. The 32px short-window tile now shows more face than the 64px
one.

Fix: use the same crop logic at both sizes. Either:
- 64x64 at scale 1: `background-size: 256px 256px` (the sheet's own size) with
  `headCropOffset(alpha, frameSize, 64)`. The R4 script ran this over all sheets; the offsets are in
  `crops.json` as `o64`.
- or the 32x32 crop at x2: `background-size: 512px 512px` and the 32px offset doubled.

The 64x64 crop at scale 1 keeps the artist's own pixels, so prefer it. Set it in `applyTilePortrait`
next to `setShortPortrait`. Add a test that the 64px box never gets a `background-size` that is not
a whole multiple of the sheet's size.

**m2. Centred boxes of odd width inside the frame still sit half a pixel off.** (Orchestrator ruling.)
Measured live (left or top ending in .5) on:
- every plain, archive and Wi-Fi screen: the field label, field and wrapper
  (`css/password-minigame.css:137`, `:252`) and Submit (`.hint-controls`, `:383`), for example
  557.5 and 648.5 at 1400x1000;
- the hot desk and Switch user tiles: `.signin-name` (`:799`) and `.signin-username`, for example
  488.5 and 625.5;
- the sign-in line (`.signin-message`, `:837`), for example 613.5 for "Choose an account." and
  551.5 for the refusal;
- `.signin-current` (`:736`) at 554.5;
- Add to Notepad (`#minigame-notebook-postit`, `password-minigame.js:396-399`) at 590.5, 296.5 and
  354.5;
- the eye toggle (`.toggle-password-btn`, `:319`), vertically: top 520.5.

The text in these boxes blends across two pixel columns, which the frame snap was meant to stop.

Fix: after layout, snap these boxes as the frame is snapped. Extend `snapFrameToPixels` to walk a
short list of selectors and give each `position: relative; left: -fx; top: -fy` from
`wholePixelOffset`. Re-run it from the same ResizeObserver and after `setSignInMessage` and
`showScreenMessage` change text. Text changes the width, so a fixed even width will not hold. Extend
the existing frame test to assert that every visible element in `.password-frame` has a whole left
and top, in the tiles, chosen, wrong, lockout, plain, archive and Wi-Fi states at 1400x1000, 800x600
and 915x412.

### Nits

**n1. At 915x412 an empty Submit on a plain screen pushes the post-it half out of view.**
`public/break_escape/js/minigames/password/password-minigame.js:901-903` with `showScreenMessage`
(`:488-498`), which reveals only the line.

On m01, "Please enter a password" moves the note to 290 to 387, against the area's bottom at 329.
A wrong password is fine, because `:910` reveals the attempts counter below the note.

Fix: in `showScreenMessage`, reveal the `.postit-note` first and then the line, as
`setSignInMessage` now does (9d7362f1e).

**n2. At 915x412 the chosen and Switch user screens overflow by 4 to 5px, and a 12px scrollbar
appears for it.** The short-window block, `css/password-minigame.css:957` onwards (sign-in screen
gap and padding at `:991`).

Measured: chosen over 5, switch over 4. Fix: take 6px out of the block. For example, set the
`.signin-screen` gap from 6px to 4px, or trim the `.signin-current` margin, so the content fits with
no bar.

**n3. The head-crop finder misses 4 bedside portraits.**
`public/break_escape/js/minigames/password/password-minigame.js:220-235` (`headCropOffset`).

The 4 portraits are mr_ahmed, mr_pryce, mrs_kowalski and ms_okafor. The pillow or hair is the first
opaque row, so the crop lands on hair or bedding (headcrop-misses.png). None of them is a sign-in
account today.

Two 120x120 sheets (male_hacker_hood, male_hacker_hood_v2) are not talk-sheet sized. They fall back
to `contain`, which downscales in both boxes.

Fix:
- allow an optional per-NPC crop override (for example `portraitCrop: { left, top }` in the NPC's
  scenario data) for posed portraits;
- treat non-talk-sheet images that are not exactly 32x32 or 64x64 as initials, not `contain`.

**n4. `showScreenMessage`'s `duration` option is dead when the line exists.**
`public/break_escape/js/minigames/password/password-minigame.js:488`.

It is still passed at `:902`, `:932` and `:1037` (3000ms for a case mismatch), but the line stays
until the next try. Fix: drop `duration` from those calls and keep it only for the no-line fallback,
or rename it `fallbackMs` so the intent is plain.

**n5. The build log still lists main-05 and main3-07 as retakes owed.**
`docs/achitechture/UX_SLICE2A_BUILD_LOG.md`, "R3 fixes", "Not done, and notes", first bullet.

Fix: say both were driver mistakes (the desktop left open and the room route for main-05; no pivot,
and the wrong `hosts` lookup, for main3-07), and point to the R4 retakes.

## Not findings

- Successes still use the centred box (see above). Each closes the screen within a second.
- The field and Submit move up when the line appears (see above). The sign-in screen has done the
  same since R1.
- No synced state is added. All the R3 changes are client display only.
