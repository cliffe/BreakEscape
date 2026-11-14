# UI PC polish, review round 1

Branch `build/ui-pc-polish`, tip c0d37f626, against `build/ui-slice6` 100730121. Read-only review
with live checks on a keyless server on :3476 (stopped afterwards). Scrollbars shown in every shot.

Counts: 0 B, 1 M, 3 m. Verdict: fix M1, then merge; the minors can ride with it or go to the
next UI pass.

## Live checks

Games 3438 (m01, Derek's office), 3441 and 3443 (test_access_networks, desk room), 3448
(test_access_networks, comms room, drop box kit given), 3449 (lab_physical_pentest, open plan).
Sizes 390x844, 800x600, 915x412, 1400x1000 and 667x375. Scripts, logs and shots are in the
review scratch folder `ui-pc-polish-r1` (`derek.mjs`, `net.mjs`, `net2.mjs`, `lab.mjs`,
`reload.mjs`, `shots/`).

| Item | Result |
| --- | --- |
| 1 Derek (password) | Locked: menu and HUD show "password locked" at all five sizes, the lock screen note keeps it. After 0419: no desktop strip at any size; menu shows the name only, the Encoded Note beside it keeps its text; HUD shows "Derek's Computer". After a page reload the server hands back `locked: false` and the menu still shows the name only; reopening goes straight to the desktop. |
| 1 Sam (sign-in) | No session: rule says locked, HUD shows the observations. Signed in: rule unlocked, HUD shows the name. Lock from the start panel: rule locked again, observations back. Reload with a locked session: still locked. Reload with an open session: unlocked straight away (the session store is filled before the first check). |
| 1 lab_physical_pentest | Melanie's PC and the hot desk PC count as PCs; Chris's and Sofia's PCs (no lock) and the headless door controller do not. |
| 2 Labels | m01 names fit at 16px at every size and wrap only at spaces. The builder's long-name shots (CONTINGENCY.txt at 12px, two ellipsis cuts) are right; see m1 for the small sizes. |
| 3 Tiles | Sam, Lena, Ian, Chris, Sofia and Melanie all show their authored `_headshot.png` at every size; no talk crop anywhere. |
| 4 Other user | One line at every size (17px name at 390, 34px at x2 on 1400). |
| 5 Post-it pin | Derek's note: the pin starts 7px right of the last character at all five sizes (text right 135, pin left 142 at 390). |
| 6 Network view | Lena's PC locked from the start panel: "Locked"; Ledger-Archive: "Needs account"; same badge look. No sideways scroll at any size, no badge over text. At 390 see m2. |

The HUD label change (item 1 applied to `ui/info-label.js`, not asked for) is right: without it
the HUD would keep saying "password locked" beside a PC the player has just opened, which is the
repetition the item removes. It runs inside the label's 100ms throttle and adds one property test
and, for sign-in PCs, two Map lookups per object; no cost worth measuring.

### The "PC" definition against real scenarios

Scanned every type-`pc`-like object in m01 to m10, sis01, sis02, all lab_* and all test_access_*
(rendered ERB, `scan_pcs.rb`). Nothing that is not a computer is caught: the 67 objects that count
are desk PCs, workstations, terminals and the Tesseract scoreboard, each with a password or sign-in.
Wall ports, the drop box kit, ransomware displays, PIN consoles, flag consoles and headless
controllers keep their observations. Two kinds of real computer slip through: M1.

### Tile pictures (item 3)

The dropped avatar and bust fallbacks: every one of the 45 NPCs with an account in the scenarios
that have sign-in PCs (lab_physical_pentest, test_access_*) has an authored `_headshot.png` under
one of the keys the engine tries, and none has an `avatar` field (`scan_heads.rb`). The `avatar`
pictures used elsewhere are either `_headshot.png` files (still found through the avatar key) or the
generic 32x32 `assets/npc/avatars/npc_*.png` icons, which are authored pictures, not crops, and
belong to phone contacts with no account. No character in a real scenario loses a picture.

## Findings

### M1. Computers whose type is a sprite variant are not PCs to the new rule

`public/break_escape/js/utils/pc-observations.js:12-15` (`isPcData`) accepts only `type === "pc"`.
The engine treats `pc3`, `pc10`, `pc_desktop` and the rest as computers (desktop mode, password
screen kind, lighting offsets; `utils/computer-keywords.js` `isComputerType`).

Failure: m10_full_disclosure `model_terminal` (type `pc10`, password lock) keeps "A bench terminal
with one file waiting behind a password prompt" in the menu and the HUD after the player has opened
it, the exact repetition item 1 removes, in a real mission. test_access_social has five sign-in
computers of type `pc3` (`kiosk`, `f11_kiosk`, `f13_kiosk`, `l1_hot_desk`, `l2_hot_desk`) that keep
their lock-policy lines while signed in.

Evidence: `pcs.txt` from `scan_pcs.rb`; `isComputerType` returns true for `pc`, `pc3`, `pc10`,
`pc_desktop` and false for `notes`, `phone`, `safe`, `usb`, `network_port`.

Fix: in `isPcData`, use `isComputerType(data.type)` instead of `data.type === 'pc'`, keeping the
lockType and headless conditions. Add `pc3` and `pc10` cases to `test/js/pc-observations.test.mjs`.
The new import means `utils/computer-keywords.js` joins the copy lists in
`info-label-proximity.test.mjs` and `workaround-door-label.test.mjs`.

### m1. Labels at 15 to 13px are not whole-scale pixel text

`public/break_escape/js/minigames/container/container-minigame.js:261` (`LABEL_FIT_SIZES`). GNF is
drawn at 2px per font pixel at 16px; at 12 to 15px a font pixel is 1.5 to 1.9 screen pixels, so
strokes come out uneven. Zoomed crops (`zoom-12px.png` beside `zoom-16px.png`, from the builder's
long-name shot at 390) show CONTINGENCY.txt at 12px with mixed one- and two-pixel strokes where the
16px labels are even. Readable, but it breaks the crisp-text and whole-scale rule.

Fix (coordinator's call, since the 15 to 12 steps were decided): either accept it, or skip the
shrink and go straight to the 16px ellipsis with the full name in the title, which already works.

### m2. Network view at 390: names now break at their hyphens

`public/break_escape/css/network-view-minigame.css:160` and `:311-314`. The narrower one-column
grid (the right fix for the sideways scroll) leaves resource labels too narrow: at 390 the share
names break as "Ledger- / Archive" and "Scanned- / Inbox", the Ledger-Archive row grows to eight
text lines beside a 135px badge, and the kiosk's reason reads "Remote sign- / in off". Before the
branch the names sat on one line (under the overlapping badge). Code review R2 m3 set the rule that
host names never break at a hyphen; share names now do.

Evidence: `n-3-netview__390x844.png` (after) against the builder's `before-net-1-locked__390x844.png`.
800, 915, 1400 and 667 wide are fine (`n-3-netview__*.png`).

Fix: give a resource's `<strong>` name (network-view-minigame.js:476) `white-space: nowrap` and the
resource label `min-width: min-content`, as host rows have; let `.network-row-wide` wrap its control
under the label in a narrow column (`flex-wrap: wrap` on the row, `margin-left: auto` on the
control) instead of capping it at 45% beside an eight-line label; wrap "sign-in" in the kiosk reason
in a nowrap span, or set the reason `white-space: nowrap` with the label shrinking instead.

### m3. Stale wording about the talk crop

`public/break_escape/js/utils/npc-headshot.js:4-6` still says a sign-in tile crops the talk portrait
when no headshot exists, and `:58` logs "falling back to the talk portrait crop" when the tile now
falls back to the silhouette. `password-minigame.js:122-124` keeps an unused `readAlpha` parameter
and the crop helpers stay imported (`:10-11`).

Fix: say "falling back to the silhouette" in the log and the header; drop the crop imports that
nothing in the file uses. Keep the re-exports if tests use them.

## Notes (not counted)

- Some password PCs' observations describe the object, not the lock (lab_tesseract_trials
  `keyholder_guest_terminal`: "Nobody ordered it, according to Dr Shaw"). The rule drops these too
  after unlock. That follows the decision and no scenario edits were allowed; if one matters later,
  conditional observations (`resolveObjectField`) can keep it.
- Pre-existing, not this branch: Sam's PC's HUD line while locked reads "A sticky note clings to the
  screen. A sticky note is stuck to the monitor." (observations plus the post-it mark's suffix).
- Not tested live: m01 Kevin's Workstation, which has no `id`; its unlock state on reload depends on
  the server matching it by name or generated id (unchanged code).

## Tests

- Node, each file alone: 62 files (every test importing a changed module, plus pc-sessions,
  pc-taskbar, workstation-state), 1156 pass, 0 fail.
- Rails: access_model_login, network_pivot, network_remote_signin: 76 runs, 745 assertions,
  0 failures.
- Harness copy lists: only `info-label-proximity` and `workaround-door-label` copy
  `ui/info-label.js`, and both list `utils/pc-observations.js`; `lab-ux-ui`, `network-links` and
  `wearable-hooks` stub info-label; no harness copies `core/game.js`.
