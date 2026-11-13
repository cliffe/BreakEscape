Counts: blockers 0, majors 0, minors 3, nits 2

# UX slice 1 (network views): code and UX review, round 2

Branch `build/ux-net` at d68f428c3, against R1 (1e59a6e87). Read: the R1 review, the build log's "R1 fixes" section, commits b9fea169a, 1254bf400, 0292e9b2a, 07a51aee1 and d68f428c3, the pixel-art UI rule and the UI design language.

## Live check

Keyless server on :3303 from this worktree, headless, physics at 20 fps with fixed steps on, stopped afterwards. New games made with `tools/playtest/swap-scenario-game.rb test_access_networks scenarios/test_access_networks --unlock-all`: 2506 (every view, at every size) and 2507 (Esc against X, and a run with the browser's scrollbars shown). Setup went through the real `window.ApiClient` calls. Each view was opened through `window.networkLinks.open` after a reload. Shots are in the scratchpad folder `ux-shots/slice1-r2/`, at 1400x1000, 800x600 and 915x412, scrolled to the top, the middle and the bottom where the list scrolls: `jack`, `pivot`, `down-no-route`, `wifi-joined`, `implant-injector`, `implant-stick`, `powered-down`, `remote-signin`, `scrollbar-visible`. The full numbers are in `run.log` and `probe.log`. No page errors.

## R1 findings, checked live

- m1: the header is the title and the subtitle on jack and implant views, plus the joined line on Wi-Fi. No line repeats another. Fixed.
- m2: the frame wraps the content at all three sizes. Its bottom border is always on screen and nothing overflows the page sideways. "More below" shows exactly when the list runs past the bottom: the jack view at 915x412, the pivot, down and implant views at 800x600 and 915x412. It hides when the list is scrolled to the end. The arrow is a stepped 12x6 clip-path in 2px steps, drawn in the pixel font colours, with no radius or gradient. The header is sticky: scrolled halfway or to the end, rows pass under it and never under the X. Two columns at every size tested (477, 365 and 422 px). Fixed, with the scrollbar exception in m2 below.
- m3: `getTestState().status` is `ready` on every view, and `statusLine` carries the joined line. Fixed.
- m4: the X is inside the frame, 6px from its top-right corner and clear of the 2px border, at every size. There is no Close button. Fixed, with the scrollbar exception in m2 below.
- Esc and the X give the same result. Both report `landed('view', 'close')`, end the trip and leave no minigame open. The Mission Brief comes back after whichever close happens first. That follows from the order the closes run in, whichever way the view is closed (seen with both orders on game 2507).
- n1 to n3: a powered-down row shows "(powered down)" alone; the Wi-Fi block is headed "Reachable"; the joined count leaves out powered-down hosts. Fixed.
- n4 and n5 (server): see below.

## Server helpers

- `readable_object_name` (`app/models/break_escape/network_access.rb:574`) is a pure function of the object: its name, a PC's host, or the id with spaces and a capital. It never returns the raw id. It is used for the view's `source` name and the n5 suffix, and both describe only an object the player planted, implanted or joined at. Nothing unreached leaks.
- `distinct_link_name` (`:559`) runs only on a default name, never on an authored `linkName` or action `name`. It is written into the foothold record once, at grant. Names read the same across reloads (game 2506: "Drop box: Comms room", "Wi-Fi: Guest Wi-Fi", "Keystroke injector: Desks", "USB stick: Store", "Drop box: Workshop", identical after each reload).
- Sync: still one string per foothold record, bounded by the scenario's footholds. `taken` is computed at grant and never stored. Within the delta rule.
- It is not fully deterministic across replants: see n1.

## Tests

- `test/js/network-view.test.mjs` under the lock: 40/40. Also green: `network-links` 66, `network-links-routing` 4, `access-remote-signin` 15.
- Network Rails tests (all 15 `*network*_test.rb` files in `test/controllers/break_escape` and `test/models/break_escape`, under the lock): 191 runs, 3483 assertions, 0 failures, 0 errors, 0 skips.

## Minors

### m1. Jack and implant views repeat the network name under the subtitle (ruling)
`public/break_escape/js/minigames/network-view/network-view-minigame.js:437`

What breaks: the subtitle reads "On Harbour office LAN, at Spare wall port", and the own block's heading below it reads "Harbour office LAN" again. The same happens on both implant views and the powered-down view ("On Workshop bench LAN, ..." then "Workshop bench LAN"). The no-repeat rule applies to the header and the heading under it.

Fix (orchestrator's ruling): head the own block "Reachable" on every view, as on Wi-Fi: `const ownName = WIFI_OWN_HEADING` (rename the constant, for example `OWN_HEADING`). Further networks keep their names ("Server network, through HB-FIN-02"). Update the heading expectations in `test/js/network-view.test.mjs`, and extend the no-repeat test to the first block heading.

### m2. With visible scrollbars the X sits on the list's scrollbar, and the scrollbar is not pixel art
`public/break_escape/css/network-view-minigame.css:32-50` (scroll area and X)

What breaks: the headless shots hide scrollbars, so this does not show in the build log's proof. With scrollbars shown, as in desktop Chrome or Firefox (game 2507, `scrollbar-visible-800x600.png`), the list's scrollbar is 15px wide on the right of the scroll area and runs from the frame's top edge, behind the sticky header. At 800x600 the X spans x 750 to 780 and the scrollbar x 771 to 786, so the X covers the scrollbar's top end. At 915x412 the X spans 865 to 895 and the scrollbar 886 to 901. The scrollbar is the platform's default, a smooth grey thumb, which breaks the pixel-art rule. The design language also says the X never overlaps anything in the frame.

Fix: take the header out of the scroll area. Make the frame a column of header (holding the X), scrolling list and "More below" strip, so the scrollbar starts under the header and never meets the X. That also removes the negative-margin sticky header. Then style the list's scrollbar as pixel art: `::-webkit-scrollbar` with a square thumb, a 2px border and no radius, plus `scrollbar-color` for Firefox (as `panels.css:583-605` does for the notes panel). Test: a JS check that the X's parent is the header and not the scroll area, and a live shot run with `ignoreDefaultArgs: ['--hide-scrollbars']`.

### m3. A PC row's host label still breaks at its hyphen in a narrow column
`public/break_escape/js/minigames/network-view/network-view-minigame.js:373` (with `public/break_escape/css/network-view-minigame.css:233`)

What breaks: 07a51aee1 kept a resource row's host on one line (`.network-row-hostname`), but a PC row's host is the `<strong>` in `labelHtml` and can still wrap. With a visible scrollbar at 800x600 each column is about 357px, and Lena's row with "Open (Lena Fox)" shows "HB-FIN-" over "02" (`scrollbar-visible-800x600.png`). Any viewport that gives a column near the 340px minimum does the same, with or without a scrollbar.

Fix: `white-space: nowrap` on `.network-row-title strong` (or give the host `<strong>` the `network-row-hostname` class), and let the label's second line or the button shrink instead. Add the PC row to the existing columns test.

## Nits

### n1. A jack's name can change when it is unplugged and planted again
`app/models/break_escape/network_access.rb:559-571`

`distinct_link_name` looks at what is held at the moment of grant. Plant A, then B, in one room, and A is "Drop box: Desks" while B is "Drop box: Desks, B". Unplug both and plant B first, and B becomes "Drop box: Desks" while A gets the suffix. Names are stable across reloads but not across replants. The first of two also never says which jack it is. No shipped scenario has two of one kind in a room yet.

Fix (when one does): decide from the scenario, not from what is held. If the room has more than one jack (or implantable PC) of the kind, always add the source object's name. The name then depends only on the source and stays the same on every grant.

### n2. Dead CSS for the removed inventory line
`public/break_escape/css/network-view-minigame.css:127-130`

`.network-view-observations` has no element since m1's fix. Remove the rule.

## Out of scope, noted

- Remote sign-in reached from a row works: Sign in on Lena's row opens the password screen headed "Lena's PC (HB-FIN-02)" and "Remote sign-in through Drop box: Comms room", and Esc returns to the network view with the trip intact. Its layout has problems this branch did not cause (it does not touch the password minigame): at 915x412 the monitor frame runs off the bottom and a Cancel button sits beside the X; at 800x600 Cancel sits under the frame (`remote-signin-*.png`). These belong to a later sign-in slice.
- The shared X and button skin report 6px and 12px borders and a gradient layer in computed style. That is the UI theme's 9-slice art (`ui-themes.css:923`), shared by every minigame, so it is not a finding here.
- Bold `<strong>` and headings have `font-synthesis: none` on `.network-view`, so no faux bold is drawn.
