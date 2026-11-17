# UX integration, merge batch 25 (slice 7 + slice 2a)

Branch train/25, on top of the merge c412bdff2. Each slice passed on its own; once merged, test/js/password-signin-mode.test.mjs failed 3 tests (21, 24, 43) and test/js/container-shares.test.mjs failed 3 more.

## Cause

- Slice 7 changed `MinigameScene.init()` so that it always drew an empty `.minigame-controls` row (hidden by `:empty`), because Cancel became opt-in (`keepsCancelButton`).
- Slice 2a's password screen expected the base to draw no row when it has no Cancel. It made its own row inside `.password-frame` on first use, through `ensureControlsRow()`. That method returned the base's existing row, which sits outside the frame. So Add to Notepad landed outside the frame (test 24). The frame's pixel snap never reached the button, so it stayed off the pixel grid (test 43). On a screen with no post-it, an empty row was left in the DOM (test 21).
- Slice 7 also removed the container's Cancel. Slice 2a's share-window tests still closed the window by clicking `#minigame-cancel`, which no longer exists.
- `PasswordMinigame.keepsCancelButton` was still `true` from slice 7, although slice 2a passes `showCancel: false`.

The X placement (slice 7's `closeInsideFrame`, which the password scene does not use) and slice 7's no-faux-bold rule did not clash.

## Fix

- One general rule in the base (`public/break_escape/js/minigames/framework/base-minigame.js`): the controls row is drawn only when it has content. `init()` draws it only with a kept Cancel. `ensureControlsRow()` makes it on first use for a footer button, under the message line. A scene names a different parent with `controlsHost()`.
- The password scene drops its own `ensureControlsRow()` and overrides `controlsHost()` to return its frame. `keepsCancelButton` is now `false`.
- The container, VM launcher and phone chat add Add to Notepad through `ensureControlsRow()` instead of the row the base used to draw.
- Commits: 7d8d48083 (the fix), 67c1eba67 (container-shares tests).

## Tests changed (each pinned an implementation detail)

- `minigame-close-shell.test.mjs`: "the controls row is still there for footer buttons" asserted an empty row in the DOM. It now asserts that there is no row, and that `ensureControlsRow()` makes one once, under the message line. The user-facing outcome (no Cancel, nothing visible) is unchanged.
- `phone-outgoing-call.test.mjs`: a source regex for the old `this.controlsElement && !ringerCall` guard now matches the `ensureControlsRow()` wiring. The outcome (no Add to Notepad on a ringer call) is unchanged.
- `container-shares.test.mjs` (3 tests): the share window now closes with the X instead of Cancel. Both call `closeByPlayer()`. The outcome under test (returning to the desktop it came from) is unchanged.
- The slice 2a tests (21, 24, 43) were not changed. They pass as written.

## Proof

- JS suite: `MERGE_BATCH=1 bin/test-js -j 3` under the tests lock on 67c1eba67: 595 files passed, 0 failed.
- Live check: keyless server on :3321 from this worktree, setFPS(20) with fixed steps on, scrollbars shown, at 1400x1000 and 915x412, on new games.
  - Password shell check (sign-in 2866/2867, m01 plain 2880/2881, Wi-Fi 2870/2871): on every screen, no Cancel and no empty controls row; the X is a child of `.password-frame` and inside its box; Add to Notepad is visible and inside the frame (sign-in and plain); 0 boxes off the pixel grid.
  - The slice 2a reviewer's snap probe (sign-in 2872/2873, plain 2882/2883): offGrid 0 at every step (typing, eye, keyboard, shift, tabs, resize, wheel).
  - `ui-rules-audit.mjs` (sign-in 2876, plain 2884, Wi-Fi 2878, scenes 2879): every password surface (sign-in tiles, chosen, wrong, typed username, archive open and wrong, plain open, wrong and keyboard, Wi-Fi open and wrong) is clean. The PIN pad, notes and SIEM show 0 x-on-frame, 0 faux-bold and 0 font. The only hits are ones slice 7 already accepted: SIEM DISMISS flagged as cancel-beside-x (a false positive, 2) and the full-window PIN and SIEM borders 2px past the viewport (overflow, 4). The password Cancel that slice 7 had accepted is gone.
  - Scripts and logs: the scratchpad folder `p25-live`.
- Note: m01 games made by swap-scenario-game.rb with `--start-room kevin_office` spawn the player behind the office's back wall, out of reach of the PC. The m01 games here were made with new-game.rb, as slice 2a's review did.
