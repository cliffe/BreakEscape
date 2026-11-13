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

## Handover
Done: all of slice 1. Nothing in progress. Commits on `build/ux-net`: see the report.
