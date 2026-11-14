# UI PC polish, review round 2

Branch `build/ui-pc-polish`, tip 11981b677, against slice 6 base 100730121 (R1 at bfa733c52).
Read-only review with live checks on a keyless server on :3476 (stopped afterwards). Scrollbars
shown in every shot. Scripts, logs and shots are in the review scratch folder `ui-pc-polish-r2`
(`menu.mjs`, `net.mjs`, `signin.mjs`, `fit.mjs`, `neigh.mjs`, `dbg2.mjs`, `probe-log.txt`,
`shots/`).

Counts: 0 B, 0 M, 2 m. Verdict: the R1 fixes hold; merge. The two minors are small CSS changes
that can ride with this branch or go to the next UI pass.

## Live checks of the R1 fixes

Games 3478 (test_access_social, lobby), 3480 (m10_full_disclosure, `--start-room
workshop_floor`), 3484 and 3486 (test_access_networks, `--start-room comms_room --unlock lobby
--give kit_dropbox`).

| Fix | Result |
| --- | --- |
| M1, world menu, pc10 | m10 `model_terminal` (type `pc10`, password) beside its real neighbour `bench_log` (gap 17px). Tap at world (72,158), standing at (80,170), opens the world interaction menu with both entries. Locked: the terminal entry carries "A bench terminal with one file waiting behind a password prompt..." at 360, 800, 915, 1400 and 667. After DOUBLECOUNT: the terminal entry is the name only at all six sizes, the clipboard keeps its line. At 390 locked the tap was refused because the workshop NPC's greeting had opened; the 390 unlocked menu and the 360 locked one cover phone width. |
| M1, world menu, pc3 | test_access_social `kiosk` (type `pc3`, sign-in). Its only real neighbours are chairs (dropped from menus) and the phone, out of reach together, so the lobby sign was moved beside it at runtime (world (200,190)) to make a two-entry tap; the menu itself is the real tap path. Locked: "Kiosk / A spare kiosk PC under the lax policy..." at all six sizes. Signed in as Omar: "Kiosk" alone at all six sizes. |
| M1, how the menu reads it | `core/game.js:2820` (tap menu) and `:3005` (far-object entries) both call `worldObservations(obj.scenarioData, ...)`, the same function as the HUD; `scenarioData.type` is the raw `pc3` / `pc10`, so the fix covers both paths. |
| m1 labels | `fitIconLabel` run live on desktop-label markup in the game page (game CSS, GNF loaded): every label computes 16px, no inline font size; over-long words end in an ellipsis with the full name in `title`; `Board <b>minutes</b> & "notes"` is built with `textContent` per word (no `<b>` element, entities shown literally). The fixer's m01 shots at 390 and 800 show the same. My own attempt to reopen Derek's desktop (game 3488) did not reach the password screen from the probe, so the m01 desktop rests on the fixer's shots and `pc-monitor-frame` tests. |
| m2 network view | 390x844, 360x740, 800x600, 915x412, 1400x1000, 667x375: no sideways scroll, no row child outside its row, no label/control overlap. "Ledger-Archive", "Scanned-Inbox" and "Remote sign-in off" never break at a hyphen. "Needs account" drops under the share's text at 390 and 360, right-aligned. |
| m3 tidy | Header, log line and the unused `readAlpha` parameter and imports are gone; callers and tests updated. |

### The 360 "Sign in" split

At 360x740 each host row's Sign in button is two lines, "Sign / in", 78x68 (Lena's 87x68) where
every other width shows 95x50. It is readable and stays inside its 9-slice frame, so it is not a
defect on its own. Two things make it worth fixing (m1 below): at 360 the 78px button already
sits 2px wider than its 76px control column, and at 320 (a real phone width, not in the review
list) the column is 36px and the button covers the host name ("HB-DESK", "HB-DOOF", "HB-FIN-").
Before the branch the 340px grid minimum made the list scroll sideways at those widths instead;
the `min(340px, 100%)` change is right, but the host row was never given the wrap the resource
rows now have.

## Findings

### m1. Host rows squeeze the Sign in button instead of wrapping

`public/break_escape/css/network-view-minigame.css:256-259` (host label `min-width: min-content`)
with no wrap rule for `.network-row-host`, beside the new resource-row wrap at `:324-335`.

Failure: at 360 "Sign in" splits to two lines and the rows grow from 54 to 72px; at 320 the
button is 78px in a 36px control and is drawn over the host name, so a player on a 320px phone
cannot read which PC a button signs in to.

Evidence: `signin-asis__360x740.png`, `signin-asis__320x640.png`; measurements in
`probe-log.txt` ("as is 320": ctl 36 wide, btn 78).

Fix (tried live in the page, `signin-try-wrap__360x740.png` and `__320x640.png`): give host rows
the same wrap as resource rows and keep button words on one line:

```css
.network-row-host { flex-wrap: wrap; }
.network-row-host > .network-row-control { margin-left: auto; }
.network-row-action { white-space: nowrap; }
```

With that, the button stays 95x50 and one line everywhere, drops under the label, right-aligned,
only where it does not fit (360 and 320), and the `:has()` reason rule at `:339-345` becomes
redundant for host rows (the kiosk's reason row is a host row). Nowrap alone is worse: the button
then covers the host name at 360 too (`signin-try-nowrap__360x740.png`).

### m2. A single very long word in a resource name scrolls the list sideways on a phone

`public/break_escape/js/minigames/network-view/network-view-minigame.js:63-67` (`wordsHtml`) with
`network-view-minigame.css:247-256` (`.network-row-word { white-space: nowrap }` and the resource
label's `min-width: min-content`).

Failure: a share name with no spaces wider than the column now cannot break at all. Injected
"Quarterly-Financial-Reconciliation-Archive-2026-Final" at 390 and 360: the label drops under the
icon, runs past the row's right edge, and the list scrolls sideways (`minigame-game-container`
scrollWidth 510 against 348 / 318). Before the branch it would have broken at its hyphens. No
real scenario has such a name today: the longest resource names are 14 characters
(Ledger-Archive, Scanned-Inbox), and about 24 characters fit at 360, so this is a guard for
authored content to come.

Evidence: `n-inject__390x844.png` (bottom scrollbar, clipped name), `probe-log.txt` lines
starting "inj".

Fix: let a word that is wider than the label break as a last resort, keeping whole-word wrapping
for every normal name. In `wordsHtml`, leave a word longer than about 20 characters out of the
nowrap span (the span is what stops the break), and give the name
`.network-row-resource .network-row-label strong { overflow-wrap: anywhere; }` so that word,
and only that word, can break where it must (it also lowers the label's min-content, so the
`min-width: min-content` rule stops forcing the overflow). Or end such a word in an ellipsis
with the full name in `title`, as the desktop labels do (`.desktop-icon-word`).

The same overflow already exists, before this branch, for a very long host name
(`.network-row-hostname { white-space: nowrap }`, code review R2 m3): injected
"FINANCE-RECONCILIATION-WS-0001" pushes its Sign in button out of the row at 390 to 915. Not
counted here; the same last-resort break would cover it.

## Other checks

- Escaping (org input rule): `wordsHtml` splits on whitespace and passes every non-space part
  through `escapeHtml` (`& < > " '`); the whitespace parts are only whitespace. Live: a share
  named `<img src=x onerror="window.__xss=1">Tom & Jerry's "Q3" <b>bold</b>` rendered as that
  literal text in 7 word spans, no `<img>` and no `<b>` in the DOM, `window.__xss` stayed 0. A
  host's sub-label `Ann & "Bob" <i>x</i>` also showed literally. The reason text
  (`downControlHtml`) goes through the same function.
- `:has()` fallback: the rule only adds `flex-wrap: wrap` and `margin-left: auto` to a host row
  with a reason. Without `:has` (Chrome before 105, Safari before 15.4, Firefox before 121) the
  row stays one line and the reason's words, each nowrap, wrap at their spaces ("Remote /
  sign-in / off") beside the label; at 360 the label (min-content) plus the longest reason word
  still fit (72 + 8 + about 115 + 8 + about 63 = 266 of 270px). Acceptable. Not tested live (no
  browser without `:has` here). Fix m1 removes the need for it on host rows.
- Pixel-art rule: the new CSS adds no borders, radii, shadows or fonts.
- Sync size: nothing in this round touches player state or what is synced.

## Tests

- Node, each file alone (plain `node file`): 44 files (every test naming a changed module, plus
  pc-observations, pc-taskbar, pc-sessions, pc-monitor-frame, network-view, workstation-state,
  password-signin-mode, info-label-proximity, workaround-door-label, network-links), 827 pass,
  0 fail.
- Rails: `test/controllers/break_escape/access_model_login_test.rb`,
  `network_pivot_test.rb`, `network_remote_signin_test.rb`: 76 runs, 745 assertions, 0 failures.
- Harness copy lists: `info-label-proximity` and `workaround-door-label` copy
  `utils/pc-observations.js` and now `utils/computer-keywords.js`; `pc-observations` and
  `tap-pick-handler` import the module in place, so they need no list. No harness copies
  `core/game.js`, `network-view-minigame.js` gained no import.
