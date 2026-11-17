Counts: blockers 0, majors 0, minors 2, nits 2

# UX slice 1 (network views): code and UX review, round 3

Branch `build/ux-net` at 70e482a77, against R2 (`UX_SLICE1_CODE_REVIEW_R2.md`). Read: the R2 review, the build log's "R2 fixes" section, commits 4ba66cfb6, 8acbccab7 and 70e482a77, the pixel-art UI rule and the UI design language.

## Live check

Keyless server on :3305 from this worktree, headless with the browser's scrollbars shown (`ignoreDefaultArgs: ['--hide-scrollbars']`), physics at 20 fps with fixed steps on, stopped afterwards. New games made with `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`: 2535 (every view at every size, Esc against X, remote sign-in from a row) and 2536 (names across replants, the port-security refusal). Setup went through the real `window.ApiClient` calls; each view was opened through `window.networkLinks.open` after a reload. Shots are in the scratchpad folder `ux-shots/slice1-r3/`, at 1400x1000, 800x600 and 915x412, scrolled to the top, middle and bottom where the list scrolls: `jack`, `pivot`, `down-no-route`, `wifi-joined`, `implant-injector`, `implant-stick`, `powered-down`, `remote-signin`, `after-esc`, `after-x`, with 3x nearest zooms of the scrollbar beside the X (`*-scrollbar-x3.png`, `pivot-mid-800x600-thumb-x3.png`) and `cmp-down-r2-vs-r3-800x600.png`. Numbers in `run.log` and `names.log`. No page errors.

## R2 findings, checked live

- m1: the own block is headed "Reachable" on every view (jack, pivot, down, Wi-Fi, both implants, powered down). Further networks keep their names ("Server network, through HB-FIN-02", "Server network (down)"). Fixed.
- m2: the header holds the X and sits outside the scroll area. Wherever the list scrolls (jack at 915x412; pivot, down and both implants at 800x600 and 915x412) the bar is 14px wide, starts at the header's bottom edge and never meets the X. The X is inside the frame at every size, the frame is on screen and the page never scrolls sideways. "More below" shows exactly when the list is not at its end. Fixed.
- m3: no PC host label wraps or overflows at any size. Fixed. The button text that now wraps instead is covered under n1 below.
- n1: names depend only on the scenario. On 2536: plant the comms port, unplug, plant the bench port, unplug, plant the comms port again; the comms link is "Drop box: Comms room, Spare wall port" each time, the bench link "Drop box: Workshop". Fixed, but see m1 below for what the new suffix does to the header.
- n2: the `.network-view-observations` rule is gone. Fixed.
- Esc and X: Esc ends the trip and the Mission Brief comes back (intended, see the mission-brief-on-reload note); X ends the trip with nothing open. Sign in on Lena's row opens the password screen and Esc returns to the network view with the trip intact.

## The shared `.pixel-scroll` rule (`public/break_escape/css/utilities.css:327-380`)

- Pixel art at 3x: a 14px bar; a square thumb with a 2px `#6f8a9c` edge round a `#2d3a44` fill; a flat track with a 2px divider on its left; no radius, no arrow buttons, no gradient. Sampled across the thumb at 800x600: 2px edge, 10px fill, 2px edge, then the frame's 2px border. Hard edges throughout.
- Opt-in only: every rule hangs off the class. On the page, the only element with the class is the network view's list. The four other scrollers present (`#inventory-container`, the preferences modal body, the game menu body or pages, `.objectives-content`) compute `scrollbar-color: auto` and `scrollbar-width: auto`, as before. The class goes on the framework's game area, which `base-minigame.js:37` builds fresh for each minigame, so it cannot carry over to the next one.
- The guard: `CSS.supports('selector(::-webkit-scrollbar)')` is true in Chromium (measured live), so Chrome and Edge never see `scrollbar-color` and keep the `::-webkit-scrollbar` art (Chrome 121 and later drop that art on an element once `scrollbar-color` or `scrollbar-width` is not `auto`). Safari also supports the pseudo-element and gets the art. Firefox does not, so it takes the guarded colours. The reasoning holds. One weakness for later adopters: see n2.

## Server naming (n1)

- Deterministic: `distinct_link_name` (`app/models/break_escape/network_access.rb:562`) reads only the scenario: the room's jacks, or for an implant the room's PCs named by a `grant_foothold` of the same shape (`:551`), in scenario order (`room_data` reads `scenario_data`). Nothing held enters it.
- Authored names win: a jack's `linkName` and an implant's action `name` or `linkName` return before the helper runs.
- `lab_physical_pentest` unchanged: its only room with two jacks is P3. `network_port` has an authored `linkName` ("Drop box: comms cupboard"); `secured_port` has port security, so it is refused before any record is written. The lab has no `grant_foothold` actions. No live name changes.
- Wi-Fi unchanged: "Wi-Fi: Guest Wi-Fi" in game 2535, as in R2. Wi-Fi joins do not use the helper.
- Leaks: the suffix is the planted source's own name, and the number counts same-named peers. No other object's name reaches the client. A peer the player has not found (a jack inside a closed container) would still add the suffix and so hint that another jack exists; m1's fix narrows that.
- Sync: one `name` string per foothold record, written at grant. A repeat plant on a held jack returns early, so nothing is rewritten. Bounded by the scenario's footholds, so it meets the delta rule.

## Full pass against the user's rules

At all three sizes, on every view:
- the X is inside the frame;
- the frame wraps its content;
- the header and the first heading never repeat each other, except for m1;
- one down-state language: grey rows with "(down)" or "(powered down)" after the host, "Server network (down)" on the block, "No route" or "Remote sign-in off" where the control would be;
- fonts are GNF at 16, 18, 20 and 22px and Press Start 2P at 18px, all whole sizes;
- `font-synthesis` is `none` on every text element. The headings and host labels are set to weight 700, but no bold is drawn.
- the X and button skin are the shared 9-slice theme, as noted in R2.

## Tests

- `test/js/network-view.test.mjs` under the lock: 41/41.
- Network Rails tests (all 15 `*network*_test.rb` in `test/controllers/break_escape` and `test/models/break_escape`) under the lock: 194 runs, 3504 assertions, 0 failures, 0 errors, 0 skips.

## Minors

### m1. The comms jack's title and subtitle both name the port
`public/break_escape/js/minigames/network-view/network-view-minigame.js:123-136` (`viewSubtitle`), with `app/models/break_escape/network_access.rb:263`

What breaks: since n1, the comms room's link is "Drop box: Comms room, Spare wall port", and the subtitle under it reads "On Harbour office LAN, at Spare wall port". Every view reached from that link repeats the port, at every size (`jack-*`, `pivot-*`, `down-no-route-*`). `viewSubtitle`'s own contract is "what the link's name lacks, never the name again". The suffix is also not needed here. The room's other jack, `secure_port`, has port security, so the server refuses it before writing any record (game 2536: 422). Only one jack in that room can ever hold a link, yet `room_objects_where(...) { NetworkModel.jack?(obj) }` counts both. An implant in a room with two implantable PCs would repeat in the same way ("Keystroke injector: Desks, Sam's PC" over "..., at Sam's PC").

Fix:
- Client: in `viewSubtitle`, leave out `at <source>` when the name already ends with `, <source>` (or contains the source name), so the subtitle reads "On Harbour office LAN".
- Server: pick only jacks that can take a device as peers: `NetworkModel.jack?(obj) && !obj['portSecurity']`, or reuse `port_security_refusal(obj).nil?`. The comms link then keeps "Drop box: Comms room". The rule stays deterministic, since port security is scenario data. If a port-security bypass is added later, it should count those jacks again.
- Tests: a `viewSubtitle` case with a suffixed name, and a `network_link_names_test` case with a jack beside a port-security jack.

### m2. A down row in a narrow column wraps to six lines and splits the kept name
`public/break_escape/css/network-view-minigame.css:255-268` (`.network-row-control`, `.network-row-kept`), with `public/break_escape/js/minigames/network-view/network-view-minigame.js:386-393`

What breaks: at 800x600 with the scrollbar shown (358px columns), the SV-FS02 row on the down view reads "SV-FS02" / "(down)" / "Server file" / "host" beside "No route" / "Session kept: Ian" / "Shaw" (`down-no-route-bottom-800x600.png`, `cmp-down-r2-vs-r3-800x600.png`). R2 m3's `flex: 0 1 auto; min-width: 0` on the control lets the note shrink, so the person's name breaks in two. The label is already at its minimum content width, so the "(down)" tag drops under the host and the line under the host wraps word by word. The powered-down row keeps its tag on the host's line, so the down state looks different from row to row at this size.

Fix:
- Keep the kept name whole: `.network-row-kept { white-space: nowrap; }`. Or wrap only the name in a nowrap span, so "Session kept:" may sit above "Ian Shaw".
- Keep the host and its tag together: `.network-row-title { white-space: nowrap; }`. The label's minimum width is then "SV-FS02 (down)".
- If the two still do not fit, let the row wrap (`.network-row { flex-wrap: wrap; }`, with `margin-left: auto` on the control), so the control drops under the label rather than squeezing it.
- Extend the columns test to a down row with a kept session: the name is on one line, and the host and tag share a line.

## Nits

### n1. "Open (Name)" buttons break inside the name at 800x600
`public/break_escape/js/minigames/network-view/network-view-minigame.js:405`

At 800x600 with the scrollbar shown, the open-session buttons wrap to two lines: "Open (Sam" / "Okafor)", "Open (Lena" / "Fox)" and "Open (Ian" / "Shaw)" (`implant-injector-top-800x600.png`, `pivot-top-800x600.png`). They are 68px tall, against 46px for one line. They do not overflow and stay legible, but the split inside the brackets reads badly. At 1400x1000 and 915x412 they stay on one line.

Fix: build the label as `Open <span class="network-row-who">(${who})</span>` with `.network-row-who { white-space: nowrap; }`, so a narrow column breaks it as "Open" / "(Sam Okafor)".

### n2. `.pixel-scroll` loses its art in Chrome under an inherited or competing `scrollbar-color`
`public/break_escape/css/utilities.css:337-380`

`scrollbar-color` is inherited, and several minigames set it on their own scrollers. Examples: `phone-chat-minigame.css:131`, `:673` and `:1002`, `forensic-data-platform-minigame.css:69`, `ncsc-brief-minigame.css:52`. Chrome 121 and later ignore the `::-webkit-scrollbar` rules on any element whose computed `scrollbar-color` or `scrollbar-width` is not `auto`. So when a later slice adds `.pixel-scroll` to one of those elements, or to an element inside one, the bar falls back to the platform's smooth thumb with no warning. The network list computes `auto` today, so nothing is broken yet.

Fix: put `scrollbar-color: auto; scrollbar-width: auto;` in the unguarded `.pixel-scroll` rule. Chrome keeps the art, and the guarded block after it still wins in Firefox. Say in the comment that an adopter removes its own `scrollbar-color` and `scrollbar-width` rules. A JS check that the list's computed `scrollbarColor` is `auto` would catch a regression.

## Out of scope, noted

- Remote sign-in reached from a row still has the layout problems R2 noted (monitor frame past the bottom at 915x412, a Cancel button). They belong to the sign-in slice.
