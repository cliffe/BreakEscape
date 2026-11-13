Counts: blockers 0, majors 0, minors 4, nits 5

# UX slice 1 (network views): code and UX review, round 1

Branch `build/ux-net` against `build/ux-feedback` (commits 67b02c123, 8adfd5172, 34a5390a5, 56f36de5d). Read against the plan's slice 1 section, the build log, the pixel-art UI rule and the UI design language.

## Live check

Keyless server on :3301 from this worktree, headless, physics at 20 fps with fixed steps on. New game 2455 made with `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all` (2456 made too, not used). Setup through the real `window.ApiClient` calls, each view opened through `window.networkLinks.open` after a reload. Shots at 1400x1000 and 800x600 in the scratchpad folder `ux-shots/slice1-r1/`: `jack`, `pivot` (scrolled to the pivot block), `down-no-route`, `wifi-joined`, `implant-injector`, `implant-stick`, `powered-down`. No page errors.

Names seen live, all from the server defaults: "Drop box: Comms room", "Drop box: Workshop", "Keystroke injector: Desks", "USB stick: Store", "Wi-Fi: Guest Wi-Fi".

## Tests

- `test/js/network-view.test.mjs`: 36/36.
- Network Rails tests (every `*network*_test.rb` in `test/controllers/break_escape` and `test/models/break_escape`, under the lock): 189 runs, 0 failures, 0 errors (see the end).

## What checks out

- Server names: "<device>: <place>" is written once at grant for jack, implant (session and dropped shapes) and Wi-Fi; an authored `linkName` or action `name` wins; Wi-Fi keeps the network name; an old jack record with no stored name derives its old name (`network_access.rb` 261-262, 364, 505, 526-551, 608).
- `room_display_name` matches `utils/room-display-name.js` (door sign, then name, then the id capitalised).
- GET /network `source` lists only held footholds; its name and room are the object the player planted, implanted or joined at (a Wi-Fi join already requires the access point to be reachable). `heldAs` on down-block rows names an account whose session the player holds. No passwords, author notes or unreached objects in either.
- Sync: one string (`name`) per jack record in `player_state['footholds']`, written at grant; implant and Wi-Fi records already carried one. Bounded by the scenario's footholds; `source` and down-block `heldAs` are computed per request and never stored. Within the delta rule.
- Client: `downState` gives one vocabulary for the link, blocks and rows; reasons are plain; remote sign-in off stays readable. The panel border is 2px, rows have no border and a lighter fill 4px apart, blocks keep their 2px frame. Every border in the CSS is 2px solid; no radius, gradient or smooth font. The Wi-Fi icon is drawn at x2 with `image-rendering: pixelated`. The subtitle never equals the title on any view shot. The joined Wi-Fi line replaces the stale line. The game area is content-sized (the Wi-Fi and powered-down views no longer have a tall empty panel).

## Minors

### m1. The inventory line repeats the subtitle on jack and implant views
`public/break_escape/js/minigames/network-view/network-view-minigame.js:407`

What breaks: the jack view shows "On Harbour office LAN, at Spare wall port" and then "Your Network drop box on Spare wall port."; the implant views show "On Harbour office LAN, at Sam's PC" and then "Your implant on HB-DESK-01." The title, subtitle and status lines must never repeat each other (orchestrator's ruling on builder open point 1). The inventory line is also larger (18px) than the subtitle above it (16px), so the repeat reads as the main line.

Fix: drop the inventory observation line from the header for every kind (`const obs = ''`, or remove `viewObservations(this.linkObservations())` from the header), or replace it with a status line that adds something new, as the Wi-Fi view does. Update the jack and implant expectations in `test/js/network-view.test.mjs` and add an assertion that no header line repeats another.

### m2. Long views scroll with no cue
`public/break_escape/css/network-view-minigame.css:21-25`

What breaks: at 1400x1000 the jack view with a down or pivot block, and both implant views, are taller than the game area (scrollHeight 947 to 1065 against 879); at 800x600 every physical view is (965 to 1101 against 479). The pivot or down block sits below the fold with nothing to say it is there, and the panel's bottom border is cut off, so the frame does not visibly wrap the content (design language: "the frame wraps all the content at every screen size"). Orchestrator's ruling on builder open point 2.

Fix: add a visible pixel-art scroll cue when `scrollHeight > clientHeight` (for example a 2px-bordered "More below" strip or a pixel arrow pinned to the bottom edge of the game area, hidden once scrolled to the end), or make the content fit (compact rows at short heights). Test: a JS test that the cue shows when the list overflows and hides at the bottom.

### m3. `getTestState()` has `status` twice; the second hides the load state
`public/break_escape/js/minigames/network-view/network-view-minigame.js:509` and `:513`

What breaks: the object literal sets `status: this.status` ('loading', 'ready', 'gone', 'error') and then `status: this.statusLine()`. The later key wins, so the test bridge now reports `status: ''` for every jack and implant view and "Joined. Reaches 1 host." for Wi-Fi, never 'ready' or 'error'. Seen live: `tsStatus: ""` with `m.status: "ready"`. A playtest agent waiting on the view's state through the bridge can no longer tell a loaded view from one that failed.

Fix: rename the new field (`statusLine: ...`) and keep `status: this.status`. Add a test that `getTestState().status` is 'ready' after a load and that `statusLine` carries the joined line.

### m4. The X is not in the frame once the game area is content-sized
`public/break_escape/css/network-view-minigame.css:21-29` (with the framework's `.minigame-close-button`)

What breaks: at 1400x1000 the X sits in the screen's top-right corner, 150px or more from the panel (the panel spans x 200 to 1200); on the Wi-Fi view it is 300px above it. At 800x600 the panel is full width from y 20 and the X (757,17 to 787,47) lies across the panel's top-right border. The design language asks for the X inside the frame and never over its border. The content-sized area (34a5390a5) is what moved the panel away from the X.

Fix: position the X relative to the network view's game area (top-right inside the 2px frame, with padding) rather than the full-screen container, or give the game area a top margin and the X a matching place inside it at short heights. Check both viewports again.

## Nits

### n1. Powered-down rows say it twice
`public/break_escape/js/minigames/network-view/network-view-minigame.js:107`

"WS-BENCH-01 (powered down)" and "Powered down" on the same row; a no-route row shows "(down)" on the block, "(down)" on the row and "No route". This is what the plan asked for, so a nit: consider keeping the tag on the name and showing the reason only when it adds something (No route, Session kept).

### n2. Wi-Fi block heading repeats the title's network name
`public/break_escape/js/minigames/network-view/network-view-minigame.js:421` (own-network heading)

"Wi-Fi: Guest Wi-Fi" is followed by the block heading "Guest Wi-Fi". The heading layout is deliberate (UX access R2), so a nit: on a Wi-Fi view the own block could carry "Hosts on this network" or no heading.

### n3. Joined count includes powered-down hosts
`public/break_escape/js/minigames/network-view/network-view-minigame.js:441-442`

`reachedHostCount` counts every row in `allRows()`, including a PC with `responding: false`. On a Wi-Fi network with a powered-down PC, "Reaches n hosts" counts a host that does not answer. Filter out `downState(r).down` rows.

### n4. The subtitle can show a raw object id
`app/models/break_escape/network_access.rb:704`

`link_source_place` falls back to `foothold['source']` (for example `comms_port`) when the object has no `name`. Every object in the test scenario has one, but a mission jack without a name would show an id in the subtitle. Return nil for the name instead, so `viewSubtitle` leaves the "at ..." part out.

### n5. Two footholds in one room get the same name
`app/models/break_escape/network_access.rb:529-551`

Two jacks, or two implanted PCs, in one room both become "Drop box: <room>" or "Keystroke injector: <room>", so the inventory shows two identical link items (the subtitle tells them apart only once opened). No shipped scenario does this yet. If one does, append the source object's name or a number when the default is already held.

## Out of scope, noted

- The view has both the X and a Close button under the panel. The design language says minigames close with the X only; this is the framework's Close, shared by every minigame, so it belongs to a later slice.
- The Wi-Fi icon (`public/break_escape/assets/icons/wifi.png`) awaits the user's approval; not a finding.

## Rails result

All `*network*_test.rb` files in `test/controllers/break_escape` and `test/models/break_escape`, under the lock: 189 runs, 3469 assertions, 0 failures, 0 errors, 0 skips.
