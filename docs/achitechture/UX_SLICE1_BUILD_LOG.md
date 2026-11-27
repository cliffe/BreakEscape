# UX feedback round, slice 1 (network views): build log

Branch `build/ux-net`, worktree `.claude/worktrees/p-ux-net`, from `build/ux-feedback` (main plus the plan). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md`, section 2, "Slice 1".

## What was built

### Link names (o-link-names), server
`app/models/break_escape/network_access.rb`
- One pattern, "<device>: <place>", written into the foothold record once at grant:
  - jack: "Drop box: <jack's room>" ("Network jack: <room>" only if a record ever has no device copy);
  - implant, session shape: "Keystroke injector: <PC's room>";
  - implant, dropped shape: "USB stick: <PC's room>";
  - Wi-Fi: "Wi-Fi: <network name>", as before (one network spans several rooms).
- The room name is `room_display_name`, the Ruby twin of `utils/room-display-name.js`: door sign, else room name, else the id with each word capitalised.
- Authored names win: a jack's `linkName`, an implant PC's `linkName`, or a grant_foothold action's `name`.
- A jack record now stores `name`; the link item reads it first. A jack planted before this has no stored name and derives the old one ("Network drop box: Bench switch"), so an old game keeps its old names. An implant record already stored the action's name; an old one keeps it (or the old "Implant: <host>" fallback).
- GET /network adds `source: { name, room }` to each foothold, for the subtitle. Both are things the player saw in the world at the grant.
- A down block's rows now keep `heldAs` (the account a held session is kept for), as a powered-down row already did, for "Session kept: <name>".

`scenarios/test_access_networks/scenario.json.erb`: the comms port's `linkName` and the three grant_foothold `name`s are removed, so the floor shows the defaults. The P11 sign now says the link item is named for the room. `PLAYTEST.md` names updated.

### Network view, client
`public/break_escape/js/minigames/network-view/network-view-minigame.js`, `css/network-view-minigame.css`
- `downState(item, { inDownBlock })` returns `{ down, tag, reason, kept }` for a row, a block or the link:
  - no route: tag "(down)", reason "No route" (block title and each row);
  - host service off: tag "(powered down)", reason "Powered down", row greyed;
  - implant's PC off: "(down)" on the view title, the old "This link is not responding" line as the reason;
  - remote sign-in off: reason "Remote sign-in off", no tag, row not greyed (not a down state);
  - held session: "Session kept: <name>" under the reason.
- Reason text is plain (no italics; the CSS already forces `font-style: normal`).
- Borders: outer panel 2px (was 4px); rows have no border, a lighter fill (#223140) on the block's darker one, 4px apart; blocks keep their 2px frame.
- Header: title is the link name; `viewSubtitle` adds what the title lacks ("On <network>, at <source object>" for physical kinds, "Access point: <access point>, <room>" for Wi-Fi) and is dropped if it would equal the title.
- Wi-Fi: an 11x8 Wi-Fi glyph (x2) by the title; "Joined. Reaches <n> host(s)." in place of the observations line, n = distinct hosts of the live rows drawn.
- Group headings ("Computers", "File shares", ...) on every list, one kind or several, so the Wi-Fi and implant views have the jack view's layout.
- The game area is as tall as the view and centred, Close under it; a long list scrolls inside it (no tall empty panel).
- `getTestState()` adds `title`, `subtitle`, `status`.

## Sync
One string per foothold record in `player_state['footholds']` (the jack record's new `name`; implant and Wi-Fi records already had one), written once at grant and sent once in the grant answer. Bounded by the scenario's footholds. No new field in player_state beyond that, nothing re-sent. GET /network gains `source` (two short strings per foothold) on the existing per-open fetch, and `heldAs` on down-block rows; neither is stored.

## Tests
- `test/controllers/break_escape/network_link_names_test.rb` (new, 9 runs): default per kind (drop box, keystroke injector, USB stick, Wi-Fi), door sign as the room, authored `linkName` and action `name` still win, a jack record with no stored name keeps the old name, the view's `source`.
- `network_footholds_test.rb`: the bench link name is now "Drop box: Workshop".
- All network Rails tests, unlocked per the test lock rule: `lab_physical_pentest_network_test`, every `network_*_test`, `start_item_answer_network_test`, `access_leak_scanner_test`, `network_model_test`, `sync_payload_size_test`, `lab_physical_pentest_secrets_test`, `game_test`: 390 runs, 5088 assertions, 0 failures, 0 errors (before the new file; it passes alone, 9/9).
- `test/js/network-view.test.mjs`: 36/36 (9 new: downState per state, powered-down and remote-off rows, kept session in a down block, link title "(down)", no italics, row and panel borders, subtitle per kind, header subtitle, joined Wi-Fi view). Also green: `escaping-shared-helpers` 20, `network-links` 66, `network-links-routing` 4, `access-remote-signin` 15, `dungeon-graph-networks` 52, `toast-once-across-panel-handover` 6.
- Validator `--no-graph`: `test_access_networks` 0 ❌, `lab_physical_pentest` 0 ❌ (its authored "Drop box: comms cupboard" is unchanged).
- No new static imports, so no JS harness copy list changes.

## Live proof and retakes
Keyless server on :3300 from this worktree. Games by `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`. Setup through the real `window.ApiClient` calls (take, plant, sign in, join, implant, drop, globals), then each view opened through `window.networkLinks.open` after a page load with `skip_resume=1`. Script: scratchpad `ux-shots/slice1/shots.mjs`.

- Game 2431: main3-02, 04, 09, 10, 13, 15 (all after-shots).
- Game 2442: main3-04 and main3-06 retaken (06 scrolled to the pivot block).
- Game 2440: the own-down pair. Its stored `office_lan` carries a test-only `downIf: office_offline` (written to that game row only; the scenario file has no own-network outage). Lena signed in through the box, then `office_offline` set.
- Games 2420, 2425, 2427, 2428, 2432, 2438 were false starts of the shot script (the resume overlay and a late Mission Brief); not used.

Shots (webp) in the scratchpad `ux-shots/slice1/`: `after-main3-02-wifi-joined-view`, `after-main3-04-network-view-from-jack`, `after-main3-06-view-linked-network-by-pivot`, `after-main3-09-network-down-no-route`, `after-main3-10-badusb-implant-foothold-view`, `after-main3-13-dropped-stick-implant-foothold-view`, `after-main3-15-host-not-responding-after-power-off`, `after-net-own-down-held-session`, `after-net-own-down-held-session-after-reload`.

Names seen live: "Drop box: Comms room", "Drop box: Workshop", "Keystroke injector: Desks", "USB stick: Store", "Wi-Fi: Guest Wi-Fi".

## Open points
- The Wi-Fi glyph (`assets/icons/wifi.png`, 11x8, drawn by hand pixel by pixel) is new art: it needs the user's approval before merge, like the section 5 items.
- Physical links keep the inventory observation line ("Your Network drop box on Spare wall port.") under the subtitle, which repeats part of it. The plan replaces it only on the Wi-Fi view; dropping it for every kind is a one-line change if wanted.
- Room names keep their door-sign case ("Drop box: Comms room"), so the lab's authored "Drop box: comms cupboard" is lower case beside the defaults.
- A long view (the jack and implant views with a pivot block) fills the screen and scrolls inside its game area; the pivot block is below the fold until scrolled, and Close sits over the HUD row as in every minigame. A scroll cue was not added.
- Headless door controller and powered-down PC icons wait on the art in section 5 (slice 8).

## R1 fixes

From `docs/achitechture/UX_SLICE1_CODE_REVIEW_R1.md` (0 blockers, 0 majors, 4 minors, 5 nits) and the orchestrator's rulings. Every finding is fixed.

- m1, header repeats: the inventory line is gone from every view (`linkObservations` and `viewObservations` removed). The header is the title, the subtitle and, on Wi-Fi only, the joined line. A JS test checks that no header line repeats or contains another, for the jack and both implant views.
- m2, long views: the panel now has a frame (`.network-view-frame`, 2px) that holds the X, the scrolling list and a "More below" strip with a stepped 12x6 arrow. The frame is never taller than the screen less 24px, so its bottom border always shows. The strip shows while the list runs past the bottom and hides at the end (`updateScrollCue` on scroll, resize, render and image load). The header is sticky, so rows scroll under it and never under the X. Rows lay out in a grid, `repeat(auto-fill, minmax(340px, 1fr))`: two columns at 800 wide and up. Group headings, empty lines and locked shares (with their long note) span both. Tighter spacing: row padding 2px 6px, row buttons 4px 12px at 16px, block padding 6px, panel gap 6px. A resource row's host label no longer breaks at its hyphen. At 1400x1000 every view now fits. At 800x600 the jack, Wi-Fi and powered-down views fit; the pivot, down and implant views scroll inside the frame with the cue. At 915x412 the Wi-Fi and powered-down views fit and the others scroll.
- m3, `getTestState()`: `status` is the load state again; the header line is `statusLine`. A new `moreBelow` field says whether the cue shows.
- m4 and the out-of-scope Close: the view passes `showCancel: false`, so there is no Close button; the X is moved into the frame at top 6px, right 6px, clear of the border at every size; Esc still closes (framework handler). Tests click `#minigame-close`; a new test checks there is no `#minigame-cancel`, the X's parent is the frame, and Esc ends the trip with `closed`.
- n1: a powered-down row shows "(powered down)" only; `downState` gives it no reason. No-route rows are unchanged.
- n2: a Wi-Fi view heads its own block "Reachable" (`WIFI_OWN_HEADING`).
- n3: the joined count leaves out rows `downState` marks down.
- n4: `readable_object_name` gives the object's name, else a PC's host label, else the id with spaces and a capital ("Bench port b"). Used for the view's `source` name and the n5 suffix.
- n5: `distinct_link_name`: when a default name is already held by another foothold, the newer one becomes "<default>, <source object name>" (a number follows only if that is taken too). Authored names are never changed. Jack and both implant shapes; Wi-Fi names a network, so it cannot clash. Stored once at grant, so sync is unchanged (one string per record).

### Tests
- `test/js/network-view.test.mjs`: 40/40 (one obsolete `viewObservations` test removed, five added: header lines, X and Esc, scroll cue, columns and wide rows, joined count). Also green: `escaping-shared-helpers` 20, `network-links` 66, `network-links-routing` 4, `access-remote-signin` 15, `toast-once-across-panel-handover` 6.
- `test/controllers/break_escape/network_link_names_test.rb`: 11/11 (two new: two drop boxes in one room get different names; an unnamed jack is named readably in the link and the view).
- Network Rails tests (every `*network*_test.rb` in `test/controllers/break_escape` and `test/models/break_escape`, under the lock): 191 runs, 3483 assertions, 0 failures, 0 errors, 0 skips.
- Validator `--no-graph`: `test_access_networks` 0 ❌, `lab_physical_pentest` 0 ❌.

### Live proof
Keyless server on :3302 from this worktree, headless, physics at 20 fps with fixed steps on. New games by `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`: 2475 for the final shots; 2470 and 2471 for two earlier passes (before the sticky header and the host-label fix), kept in `first-pass/` and `second-pass-2471/`. Setup through the real `window.ApiClient` calls, each view opened through `window.networkLinks.open` after a reload. Shots at 1400x1000, 800x600 and 915x412 in the scratchpad `ux-shots/slice1-r1fix/`: `jack`, `pivot-top`, `pivot` (scrolled to the end), `down-no-route`, `wifi-joined`, `implant-injector`, `implant-stick`, `powered-down`. In every shot: load state `ready`, no Close button, the X inside the frame, the frame's bottom border on screen, the cue shown exactly when the list is not at its end. No page errors.

### Open
- The Wi-Fi glyph still awaits the user's approval (unchanged).
- The own block heading on jack and implant views repeats the network named in the subtitle ("On Harbour office LAN, ..." then "Harbour office LAN"). The ruling covered the Wi-Fi view only, so this is left as it was.

## R2 fixes

From `docs/achitechture/UX_SLICE1_CODE_REVIEW_R2.md` (0 blockers, 0 majors, 3 minors, 2 nits) and the orchestrator's rulings. Every finding is fixed.

- m1, own block heading: the own network's block is headed "Reachable" on every view (`OWN_HEADING`, was `WIFI_OWN_HEADING`). The subtitle names the network, so the heading no longer repeats it. Further networks keep their names ("Server network, through HB-FIN-02").
- m2, header and scrollbar: the frame is now a column of header, scrolling list and "More below" strip. The header (`.network-view-header`, with `.network-view-header-body` for the lines) holds the X and sits outside the scroll area, so the list's scrollbar starts under it and never meets the X. The sticky header and its negative margins are gone. A shared rule, `.pixel-scroll`, is added to `css/utilities.css` (the file existed and `games/show.html.erb` loads it): a 14px bar, a square thumb with a 2px border, a flat track with a 2px divider on its left, no radius, no arrow buttons, colours from four variables (`--pixel-scroll-track`, `-thumb`, `-edge`, `-hover`). Firefox gets `scrollbar-width` and `scrollbar-color`, behind `@supports not selector(::-webkit-scrollbar)`, because Chrome drops the `::-webkit-scrollbar` art once `scrollbar-color` is set. Only the network view's list uses it in this slice.
- m3, PC host label: a PC row's host `<strong>` carries `network-row-hostname` (nowrap). The label is never narrower than its host (`min-width: min-content`), and the control may shrink instead (`flex: 0 1 auto`), so at 800x600 with the scrollbar shown "Open (Lena Fox)" wraps inside its button and "HB-FIN-02" stays whole.
- n1, names across replants: `distinct_link_name` now decides from the scenario. When the source's room holds more than one source of that kind (jacks for a jack; PCs that a `grant_foothold` of the same shape names, for an implant), every link from that room adds its own source name, whatever is held. Two sources with one readable name are numbered in scenario order. The name depends only on the source, so unplugging and planting in either order gives the same names. In `test_access_networks` the comms room has two jacks (the spare port and the locked switch port), so its drop box link now reads "Drop box: Comms room, Spare wall port"; the workshop's single jack still reads "Drop box: Workshop".
- n2: the dead `.network-view-observations` rule is removed.

### Tests
- `test/js/network-view.test.mjs` (under the lock): 41/41. Updated: own heading expectations, the no-repeat test now covers the first block heading, the X test checks the X's parent is the header and that neither is in the scroll area (children of the frame are header, list, More below), the columns test covers a PC row's host label, and a new test checks the `.pixel-scroll` rule and that the layout loads `utilities.css`. Also green without the lock: `escaping-shared-helpers` 20, `network-links` 66, `network-links-routing` 4, `access-remote-signin` 15.
- `test/controllers/break_escape/network_link_names_test.rb`: 14/14. Changed: two jacks in one room both carry their jack name. New: replanted in the other order keeps both names (and one planted alone still says which jack); one jack in a room keeps the plain name; two jacks with one readable name are numbered.
- Network Rails tests (all 15 `*network*_test.rb` in `test/controllers/break_escape` and `test/models/break_escape`, under the lock): 194 runs, 3504 assertions, 0 failures, 0 errors, 0 skips.
- Validator `--no-graph`: `test_access_networks` 0 ❌, `lab_physical_pentest` 0 ❌.

### Live proof
Keyless server on :3304 from this worktree, headless with the browser's scrollbars shown (`ignoreDefaultArgs: ['--hide-scrollbars']`), physics at 20 fps with fixed steps on, stopped afterwards. New games by `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`: 2531 for every shot (2532 was made as a spare and not used). Setup through the real `window.ApiClient` calls, each view opened through `window.networkLinks.open` after a reload. Shots in the scratchpad `ux-shots/slice1-r2fix/` at 1400x1000, 800x600 and 915x412: `jack`, `pivot` (top, middle, bottom), `down-no-route` (top, bottom), `wifi-joined`, `implant-injector` (top, bottom), `implant-stick`, `powered-down`, plus `remote-signin-*`, `after-esc` and `after-x`. Each shot with a scrollbar has a 3x nearest zoom of the scrollbar's top end beside the header and X (`*-scrollbar-x3.png`). Measured in every shot (`run.log`): own heading "Reachable"; wherever the list scrolls, the scrollbar is 14px wide, starts at the header's bottom edge and never overlaps the X (at 800x600 the X spans x 750 to 780 and the bar 772 to 786 from y 84 down, below the X's bottom at 50); no PC host label wraps and no row overflows; the frame is on screen and the page never scrolls sideways; "More below" shows exactly when the list is not at its end. Two columns at every size (477, 358 and 415 px with the bar). No page errors.

### Open
- The Wi-Fi glyph still awaits the user's approval (unchanged).
- Other minigames' scrollbars adopt `.pixel-scroll` in a later slice; their own per-minigame rules are untouched here.
- Firefox cannot draw a border on a scrollbar thumb, so there the bar is flat colours only; not checked live (no Firefox here).

## R3 fixes

From `docs/achitechture/UX_SLICE1_CODE_REVIEW_R3.md` (0 blockers, 0 majors, 2 minors, 2 nits). Every finding is fixed.

- m1, title and subtitle both name the port: the server counts only jacks that can take a device as a room's link peers (`link_peer_jacks`: a jack with no port security). A port-security jack is refused before any record is written, so it never needs telling apart. Port security is scenario data, so names stay deterministic; a future port-security bypass should count those jacks again. In `test_access_networks` the comms link is "Drop box: Comms room" again. On the client, `viewSubtitle` leaves out "at <source>" when the name already ends with ", <source>" or ", <source> <n>", so an implant beside another implantable PC reads "On Harbour office LAN" under "Keystroke injector: Desks, Sam's PC".
- m2, a down row in a narrow column: `.network-row-kept` and `.network-row-title` are nowrap, so "Session kept: Ian Shaw" and "SV-FS02 (down)" each stay on one line. The first live pass showed the nowrap note then sat over the host's second line at 800x600, so down rows also wrap (`.network-row-down { flex-wrap: wrap }`, the control right-aligned with `margin-left: auto`): when the label and the reason do not fit side by side, "No route" and the kept note drop under the label. Other rows are unchanged.
- n1: the open button is `Open <span class="network-row-who">(name)</span>`, with the span nowrap, so a narrow column breaks it as "Open" / "(Lena Fox)".
- n2: `.pixel-scroll` resets `scrollbar-color` and `scrollbar-width` to `auto`, so Chrome keeps the art under a parent that sets them; the guarded Firefox block after it still wins there. The comment says an adopter drops its own rules.

### Tests
- `test/js/network-view.test.mjs` (under the lock): 43/43. New: title and subtitle never both name the source (suffixed, numbered and plain names); a down row keeps the kept note whole and the host with its tag, with the wrap rule. Extended: the columns test checks the open button's nowrap name span; the `.pixel-scroll` test checks the two resets come before the guarded block. Also green without the lock: `escaping-shared-helpers` and `engine-fixes-round6`, 29.
- `test/controllers/break_escape/network_link_names_test.rb`: new case, a jack beside a port-security jack keeps the plain room name and the secure port writes no record.
- Network Rails tests (all 15 `*network*_test.rb` in `test/controllers/break_escape` and `test/models/break_escape`, under the lock): 195 runs, 3511 assertions, 0 failures, 0 errors, 0 skips.
- Validator `--no-graph`: `test_access_networks` 0 ❌, `lab_physical_pentest` 0 ❌.

### Live proof
Keyless server on :3306 from this worktree, headless with the browser's scrollbars shown, physics at 20 fps with fixed steps on, stopped afterwards. New games by `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`: 2578 for the main3 views, 2579 for the own-down pair (its stored `office_lan` carries a test-only `downIf: office_offline`, on that game row only). Games 2570 and 2571 were the first pass, before the down-row wrap; their shots are kept in `superseded-2570/`. Setup through the real `window.ApiClient` calls, each view opened through `window.networkLinks.open` after a reload. Shots in the scratchpad `ux-shots/slice1-final/` at 1400x1000, 800x600 and 915x412, named after the review page ids, scrolled to the top and bottom (main3-06 also the middle): `main3-02` (Wi-Fi joined), `main3-04` (jack), `main3-06` (pivot), `main3-09` (no route), `main3-10` (injector), `main3-13` (USB stick), `main3-15` (powered down), `after-net-own-down` and `after-reload`. Measured in every shot (`run.log`): load state ready; no host and tag split; no kept note on two lines; no label text overlapped by a control; no row overflows; the X inside the frame; the frame on screen; no sideways page scroll; the list's computed `scrollbar-color` is `auto`. "Open (name)" buttons are one line at 1400x1000 and 915x412 and break before the bracket at 800x600. No page errors.

### Open
- The Wi-Fi glyph still awaits the user's approval (unchanged).
- Remote sign-in reached from a row keeps the layout points R2 noted; they belong to the sign-in slice.

## Handover
Done: all of slice 1. Nothing in progress. Commits on `build/ux-net`: see the report.
