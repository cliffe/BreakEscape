# UX slice 6 review, round 5 (final): start panel on short screens, shell merge

Branch `build/ui-slice6`, tip 7c1894e90: the R4 fixes (45da1e898) with main fc4b4d8a5 merged on
top, which brings in the minigame shell branch (scrolling shell, X placement through
`placeCloseButton`, `tools/playtest/ui-rules-audit.mjs` and `shell-x-check.mjs`). Reviewed against
`UX_SLICE6_REVIEW_R4.md`, the build log's "review round 4 fixes" section, the UI design language
and the pixel-art UI rule. No code was changed.

## How it was checked

- Read the R4 fix diff (`2143b6bf8..45da1e898`: `css/pc-monitor.css`, `utils/pc-taskbar.js`) and the
  merge's changes to `minigames-framework.css`, `base-minigame.js`, `pc-monitor.css`,
  `container-minigame.css` and `password-minigame.css`.
- Live: own keyless server on :3474 (stopped by PID). Games from `new-game.rb` plus
  `unlock-all-rooms.rb`: 3359, 3364, 3365 (Sam's PC, local), 3360 (`door_box`), 3361 (Lena's PC),
  all `test_access_networks`; 3362, 3363 (`store_controller` and the audit game,
  `lab_physical_pentest`). Headless shell with scrollbars shown (14 px, measured on the panel). The
  drop box was taken and plugged in through `window.__test`; Start, the X and Sign in were real
  clicks. Scripts, logs and shots: scratch `ui-slice6-r5/` (`proof.mjs`, `pcx.mjs`, `netx.mjs`,
  `out-*.txt`, `audit-*.txt`, `shellx-*.txt`, `shots/`).
- Main comparison: `git archive main public/break_escape/{js,css}` served in place of the branch's
  files through Playwright routing (`pcx.mjs` with `MAIN=1`, and copies of the two tools with the
  same route added, `main-ui-rules-audit.mjs`, `main-shell-x-check.mjs`). Same server, same game.

## R4 findings

| R4 | Status | Evidence |
|---|---|---|
| major 1 Places list painted over Lock | Fixed | List bottom at or above the actions' top in every run: 4 hosts x 8 sizes fresh, and the same 8 sizes again by resizing with the panel open. Wherever the panel does not scroll, `elementFromPoint` at the centre of Lock, Switch user and Sign out returns that button. |
| nit 1 compact only decided on open | Fixed | Panel opened at 1400x1000 and resized through 915x412, 667x375, 568x320, 740x360, 844x390, 390x844, 800x600 and back: every step matches the fresh open at that size (compact, picture scale, overflow, hits), on all four hosts. |
| nit 2 two "Locked" badges | Left for the wording pass, as the fixer said | Not re-checked. |

## The panel, live

Fresh open. YYY = Lock, Switch user, Sign out each hit at its centre. "Over" is panel
`scrollHeight - clientHeight`.

| Viewport | Lena / door_box (3 Places) | Sam local (2) | store_controller (1) |
|---|---|---|---|
| 667x375 | YYY, over 0, compact, Places scrolls 18 with More below | YYY, 0, compact | YYY, 0, compact |
| 740x360 | YYY, 0, Places scrolls 32 with More below | YYY, 0, compact | YYn, over 14 |
| 844x390 | YYY, 0, compact | YYY, 0 | YYY, 0, compact |
| 568x320 | Ynn, over 36 | YYn, over 32 | Ynn, over 54 |
| 915x412 | YYY, 0, compact | YYY, 0 | YYY, 0, compact |
| 390x844, 800x600 | YYY, 0, x2 | YYY, 0, x2 | YYY, 0, x2 |
| 1400x1000 | YYY, 0, compact x1 | YYY, 0, x2 | YYY, 0, compact x1 |

This matches the fixer's table exactly. No horizontal page overflow anywhere. Where the panel
scrolls, the missing hits land on the taskbar below the panel, not on Places: the buttons are below
the fold, not covered. Reaching them works: a wheel on the panel scrolls it to the end and all
three then hit; from a fresh open, ArrowUp from Desktop wraps to Sign out and scrolls the panel to
the end. Same results in a touch, mobile context (`isMobile`, `hasTouch`) for `store_controller`
at 740x360 and 568x320, where the styled scrollbar still measured 14 px.

### Is there a cue where the whole panel scrolls?

Partly. The panel's own 14 px pixel-art scrollbar shows (square thumb, `pixel-scroll`), and the
last row on show is cut through its middle (`store-fresh__740x360.png`: "Sign out" half drawn;
`lena-fresh__568x320.png`: "Switch user" half drawn). There is no "More below" for the panel. At
568x320 on a three-place host the only "More below" on screen belongs to Places, and the panel has
two nested scrollers side by side. See minor 1.

### This PC heading on short screens

No loss. With the heading gone the section still shows the computer name and the "Remote through"
line (remote), and the PC's display name appears on the monitor bezel and the computer name again
on the taskbar (`taskbarHost` shown at every size). On Sam's local panel the section is one line,
"HB-DESK-01", under the account; it reads as the computer's name given the taskbar beside it. The
heading is kept at 1400x1000 even in compact, as the CSS says (`[data-short]` only).

## The shell merge

- PC view keeps its own layout: main adds `overflow: hidden` to `.minigame-container.pc-view`, so
  the shell never scrolls there, and `pc-monitor.js` moves the X into the bezel
  (`.pc-monitor-close`, absolute, `!important` top and right), so the shell's new fixed X rule
  (`.minigame-container > .minigame-close-button`) does not reach it. `ContainerMinigame` and
  `TextFileMinigame` skip `placeCloseButton` inside the monitor.
- Measured on Sam's PC (`pcx.mjs`), sign-in screen, desktop and the Scanned-Inbox share window, at
  1400x1000, 800x600, 915x412, 390x844, 667x375 and 568x320: shell overflow 0 both ways, monitor
  wholly in view, X wholly in view and inside the monitor, `elementFromPoint` at the X returns the X.
  A real click on the X closes the sign-in screen (568x320) and the desktop (390x844); on the share
  window it returns to the desktop, which is the designed behaviour (`container-minigame.js:1099`).
  The same script with main's files gives identical numbers, X positions included.
- Sign-in at 568x320: the account tiles scroll 12 px inside the screen (pixel scrollbar shown). The
  same 12 px on main, so not from this branch; noted only.
- Network view (`netx.mjs`, `door_box` game, locked-row build): at all six sizes the shell does not
  scroll, the X is in view and hit, no row button sits under the X, and every row button on screen
  takes its own hit. The X click at 667x375 closes it.
- `shell-x-check.mjs --port 3474 --game 3363` (default sizes): 164 checked, 0 failed, exit 0. With
  main's files: 164 checked, 0 failed, and the per-line output is identical.
- `ui-rules-audit.mjs --all --strict --sizes 1400x1000,800x600,915x412,390x844`: exit 1 with
  window-offscreen 0, frame-offscreen 5, clipped 23, x-on-frame 0, overflow 29, and
  `mg-person-chat` and `mg-network-view` not opened by a title-only start. With main's files the
  summary and every `mg-` line are identical, so none of it comes from this branch. The PC-related
  scenes are clean at all four sizes on both: `mg-container`, `mg-password`, `mg-text-file`
  (`mg-password-guesser`, not a PC scene, reports hairline 1 and radius 3 on both). The breaches are
  in `esd-pushbutton`, `alarm-panel`, `claims-management-system`, `command-board`,
  `scada-historian`, `siem-dashboard` and others, for the shell work to pick up. The network view
  is covered by the live check above instead.

## Findings

### minor 1: where the whole panel scrolls, the actions go below the fold with only a scrollbar to say so

`store_controller` at 740x360 (a common Android landscape size) and every host at 568x320 open a
panel that scrolls as a whole: Sign out (and at 568x320 Switch user) sits below the fold. The
player sees a 14 px scrollbar and a half-drawn row; on a three-place host at 568x320 the one "More
below" on screen belongs to Places, a second scroller inside the first. The comment at
`css/pc-monitor.css:604-605` still says Lock, Switch user and Sign out "are always on show", which
is no longer true at these sizes. On iOS Safari, which does not draw `::-webkit-scrollbar` skins,
the scrollbar cue may not show at all (not testable here).

Fix: keep the actions on show and let the parts above them scroll. In `css/pc-monitor.css`, give
`.pc-monitor .pc-start-actions` (`:594-610`) `position: sticky; bottom: 0; z-index: 1;` and the
panel's background (`#1c2833`) plus its 2 px top border, so the account, This PC and Places scroll
under it when the panel must scroll. That makes the `:604` comment true again and removes the need
for a panel-level cue. A cheaper partial fix for the 740x360 case: in compact on a short screen,
keep `.pc-start-remote` (`:676`) to one line (`white-space: nowrap; overflow: hidden;
text-overflow: ellipsis`, full text in a `title`), which wins back the 18 px that pushes
`store_controller` over by 14. Re-measure at 740x360 and 568x320 on all four hosts.

## Verdict

Ready to merge. Both R4 findings are fixed and hold under resize; the Places list never covers the
actions; the shell merge leaves the PC sign-in, desktop, share window and network view fitting and
closing exactly as on main. The one minor is a polish item for the tiny and short-screen cases,
where every action is still reachable by scroll, wheel and keyboard.

## Tests

Without the lock: `pc-taskbar` 30, `pc-sessions` 43, `pc-monitor-frame` 49, `network-view` 46,
`workstation-state` 55, `password-signin-mode` 66, `minigame-shell-fit` 30, `minigame-close-shell`
16, all pass (335, `node --test`). Rails `access_model_login`, `network_pivot`,
`network_remote_signin`: 76 runs, 745 assertions, 0 failures, 0 errors.
