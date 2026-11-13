# UI quick review, round 3

Branch build/ui-quick, tip 0dd5fba27 on main 2f5471209. Read-only review of the round 2 fixes:
the chin room carried between `update()` passes in `pc-monitor.js`, the reset of the height
ratchet when the room changes, the new `PC_CHIN_BUTTON_ROOM` fallbacks, and
`stopFrameSnap()` plus `pcMonitor.destroy()` in `PasswordMinigame.cleanup()`.

How it was checked: `git diff 824ef3c6d..HEAD` read in full, and the password minigame's
`cleanup()` callers read. Tests run without the lock: pc-monitor-frame 46/46,
password-signin-mode 55/55, escaping-shared-helpers 21/21, container-shares 43/43,
access-signin-postit 8/8. Live probe on a keyless server on :3445, test_access_networks, Sam's
PC, scrollbars shown, through the real note paths (served `postitNote` for the sign-in, the
PC's scenario note for the desktop and the share window). Notes: short (`Sam: sokafor /
Marmalade-82`), three-line (109 characters), and a long token (`Key:
Abcdefghijklmnopqrstuvwxyz0123456789 / x`). Sizes 1400x1000, 800x600, 915x412, 390x844,
360x740. Wrapped `ResizeObserver` and `MutationObserver` counted live observations.
Probe scripts and shots: the reviewer's scratchpad, ui-quick-r3/ (probe.mjs, probe_snap.mjs,
probe_snap_ctrl.mjs, probe_kept.mjs, shots/).

## R2 findings

| R2 finding | Status | Evidence |
|---|---|---|
| Major 1: chin sized from the stale fallback width | Closed | `pc-monitor.js:364-389`: `lastRoom` feeds the first pass (`:369-370`), a height taken at another room is dropped (`:383`). Live, chin minus max(44, note + 6) is 0 in all 45 combinations (3 views x 5 sizes x 3 notes); note/button overlap 0, note inside the bezel, button inside the chin, no scrolling box. Three-line note: 110/104 at 1400x1000 and 800x600, 94/88 at 915x412, 130/124 at 390x844, 166/160 at 360x740 (chin/note). The same note gives the same frame in all three views at each size. A stale kept height (three-line note opened first, then a shorter one at the same size) also settled to 0 extra in 12 tries at 915x412, 800x600 and 360x740. |
| Minor 1: observer leak when ended without `complete()` | Closed for the leak, but see new Minor 1 | `password-minigame.js:1396-1403`. Live at 915x412, three opens each: sign-in 5 RO / 3 MO while open, back to the 2 / 2 baseline after the X and after `endMinigame`; desktop 4 to 2 by both; share 4 to 2 by the X (which returns to the desktop, then closes it). By `endMinigame` the share hands back to its desktop, which stays open at 4, flat across three rounds: no growth. |
| Minor 2: the `update()` test stubs what it tests | Closed | `pc-monitor-frame.test.mjs:143-182`: the note height follows `style.maxWidth`, buttons of 90, 125 and 170px, and the chin is asserted against the note at its drawn width, twice. The share label is asserted at `:184-207` and the observer release at `:209-232`. |
| Minor 3 (optional): a lone letter on its own line | Deferred by the orchestrator, unchanged | The long token breaks mid-word in every view and size (expected, the accepted price of R1 Major 1); its trailing `/ x` keeps the slash on the line before (shot `desktop_long_360x740.png`: "9 /" then "x"). |

## Sign-in handing over to the desktop

Real form sign-in (Sam's tile, password typed, Sign in clicked), sampled every frame for 3 s, at
1400x1000, 915x412, 390x844 and 360x740 with the short and three-line notes. The monitor keeps
its position and size from the sign-in through the "Signed in as" message to the desktop in all
eight runs (for example 237,8 440x392 throughout at 915x412 with the three-line note), and the
desktop's chin is note + 6 with the button inside it. So the new `stopFrameSnap()` does not
break the handover. During the 800ms success window `pc-view` is off the container and the frame
snap is stopped (next finding); no geometry moved because of it.

## New findings

### Minor 1: `cleanup()` runs mid-flow, so the new teardown stops the pixel snap while the screen is still shown

`PasswordMinigame` calls `this.cleanup()` to drop its listeners while the screen stays up with a
message: `signInLockedOut()` (`password-minigame.js:1740-1757`, open until the player closes it),
`signInAccepted()` (`:1725-1731`, 800ms), `passwordCorrect()` (`:1247-1250`, 1s),
`passwordFailed()` (`:1308-1314`, up to 2.5s), the lock-scope refusal (`:1232-1233`, 2s) and the
Wi-Fi join (`:1170-1172`). The round 2 `cleanup()` (`:1396-1403`) now also calls
`stopFrameSnap()` and `pcMonitor.destroy()`, so in those windows the frame snap's
MutationObserver is gone when the new message text lands, and `pc-view` is removed from a
monitor that is still on screen (`pc-monitor.js:429`).

Live, at 1400x1000 the lockout line "Too many tries..." sits at x + 0.5px (blurred text) and
stays so until the player closes the screen; with the same two calls stubbed out in the page
(control run) it sits on 0.0. The other four sizes tried (915x412, 391x845, 361x741, 801x601)
came out whole by chance. This undoes UX slice 2a R3 m1 (crisp text on whole pixels) for the
lockout screen. Rated minor because the screen is rare and the shift is half a pixel, but it is
a regression from this round.

Fix: release the snap and the monitor only when the game is really ending. `endMinigame` sets
`ending._ending = true` before it calls `cleanup()` (`minigame-manager.js:224-233`), so in
`PasswordMinigame.cleanup()` wrap the two calls in `if (this._ending) { ... }` (`complete()`
still releases them on its own path). Update the observer test
(`pc-monitor-frame.test.mjs:209-232`) to end through `MinigameFramework.endMinigame` or set
`_ending`, and add one that calls `signInLockedOut()` and asserts the frame-snap observers are
still live and `pc-view` is still on the container.

## Other checks (no finding)

- The chin label reads "Add Postit to notepad" in all 45 live combinations; full frames keep the
  212x34 one-line button, compact and narrow frames the 125x44 stacked one, matching the
  fallbacks at `pc-monitor.js:62`.
- No `ResizeObserver loop` or page errors across about 120 opens; the only console errors were
  403s for resources unrelated to the PC view.
- Pre-existing, not from this branch: after `cleanup()` the monitor no longer re-fits on a window
  resize (its resize listener goes through `scene.addEventListener`, `pc-monitor.js:409-414`,
  which the base cleanup removes). Live, a lockout screen at 1400x1000 resized to 800x600 kept
  a 1168x796 frame. Only reachable by resizing during a lockout; noted for the backlog.
- The success box over the sign-in ("Signed in as Sam Okafor" twice, once in a box and once on
  the message line) is unchanged by this branch.
- Pixel-art rule: no new borders, radii, shadows or fonts in the round 2 diff.

## Verdict

Ready to merge once Minor 1 is fixed (a two-line guard plus a test). R2 Major 1 is closed with
exact chin sizing in every live combination, the observer leak is closed by both the X and
`endMinigame`, and the sign-in to desktop handover keeps the frame and the chin. The new
teardown in `cleanup()` is too broad: it also runs on the screens that stay up after a result,
and leaves the lockout message off the pixel grid at 1400x1000.

Counts: blocker 0, major 0, minor 1.
