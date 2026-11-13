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

## Handover
Done: all of slice 1. Nothing in progress. Commits on `build/ux-net`: see the report.
