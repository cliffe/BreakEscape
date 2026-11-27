Counts: 0 blockers, 0 majors, 2 minors, 1 nit.

# README slice 9.3b and engine fixes: review, round 3

Branch `build/readme-93b`, tip d3a59f941. Reviewed: `git diff main...build/readme-93b` read fresh, with a close look at the round 2 fixes (ac1d117a2, d3a59f941) against `README_9_3B_REVIEW_R2.md` and the R2 section of `README_9_3B_FIXES_BUILD_LOG.md`.

## What was checked and holds

- **M1, the down own-network block.** `networkBlocks()` (network-view-minigame.js:181-185) now keeps an own-network entry only when its route is `down`. The server sends an own entry with `route: 'up'` only while the own network is in `player_reach`, and `down_blocks` (network_access.rb:640-650) rejects every network in reach, so the own network never arrives both up and down. The kept block goes through the existing down branch of `blockSectionHtml`: no `data-host-id`, no `data-action`, so nothing in it is clickable. `allRows()` and the per-block `network_viewed` loop both skip down blocks, so the new entry adds no click target and no event. No other module calls `networkBlocks()` (grep over public/break_escape/js). The `<ul>` with "Nothing answers on this network." is dropped only when the link responds, there are no own rows and an own down block exists; the implant-off branch (`responding: false`) still shows its line. With the own network down and no session held on it, the server sends `networks: []` (or only further down blocks) and the view still says nothing answers, which is true. The live screenshot after reload (game 1751) shows the greyed block, "No route to HB-FIN-02" and no "Nothing answers" line.
- **n1, the second access point's `false`.** `join()` (network-links.js:623-625) writes with `deferEmit` only when the value is `false` and the global is unset, and drops the returned events. A first access point (`true`) still emits. A global the author declared `false` in `globalVariables` does not change, so it emits nothing either way. The ink and state-manager broadcast in `writeGlobal` still run, so a story that declares the name gets the value. The node test asserts one change event at the first access point and none at the second.
- **n2, n3.** The first-join test stubs `serverCompleteTask` (the method `serverCompleteTaskWithRetry` calls) and asserts one POST. The E3 secrecy check takes the compact label list, asserts it is not empty and refutes each label.
- **README line 928.** "(a second access point is set `false` with no change event)" matches the code for an unset or declared-`false` global, and "`network_viewed` ... once for the foothold's own network, even while that network is down ... one whose beat needs a host tests `data.hostList`" matches network-view-minigame.js:153-156.
- **README line 939.** "(a foothold on that network included: its own rows go, and only a session held there shows, greyed)" matches `network_view` (network_access.rb:608-611) and the client. The next sentence covers sessions on further networks, which also show as down blocks while the own network is down.
- **New CSS against the pixel-art rule** (network-view-minigame.css:127-169). Borders are 2px solid with square corners, fills are flat, there is no radius, shadow or gradient, and the greyed row drops the synthesised slant. `filter: grayscale(1) brightness(0.7)` recolours the icon without smoothing it. The icon's scale is m1 below.
- **Cheat policy and secrets.** Unchanged since R2: `complete_task!` reads only server-written `gainedFootholds` for an access point, the down block's rows carry no `remoteSignIn`, `session`, `responding` or `heldAs`, and no SSID, key or link name is newly sent.

## Tests and validator

- Rails, no lock: network_outages, network_wifi, network_footholds, network_implants, network_pivot: 89 runs, 812 assertions, 0 failures, 0 errors.
- Node: network-view (24), network-links (66), network-links-routing (4), objectives-network-footholds (8), every other objectives-* file, validator-network-model (63), and every file that imports network-links, network-view-minigame or objectives-manager (access-remote-signin, escaping-shared-helpers, test-bridge-access, ending-check, success-screen, the credits files): all pass, 0 failures.
- `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 ❌.

## Findings

### m1 (minor): the host icon is drawn at a fractional scale, greyed rows included

- Where: network-view-minigame.css:64-70 (`.network-row-icon`: `width: 32px; height: 32px; object-fit: contain`), reused by the new greyed row at :167. The R2 build log says the icon is greyed "at its whole-number scale".
- Failure scenario. `pc_desktop.png` is 36x24. In a 32x32 box with `contain` it is drawn at 32x21.3, a scale of 0.889, so columns and rows of pixels are dropped and the icon smears; the screenshot `own_down_held_session_after_reload_1751.png` shows the smudged PC beside HB-FIN-02. `m09_folder1.png` (26x18) is drawn at 1.23x. Only `npc-print.png` (16x16, 2x) is whole. The pixel-art rule asks for icons at whole-number scale. The rule predates the box, but the branch adds a new row that uses it and the build log claims the scale is whole.
- Fix: draw each icon at a whole multiple of its own size, for example `.network-row-icon { width: auto; height: auto; object-fit: none; }` (36x24 and 26x18 at 1x) with a `[data-kind="printer"] .network-row-icon { width: 32px; height: 32px; }` rule for the 16px printer at 2x, and keep the 32px column width with `min-width: 36px` so rows still line up. Correct the build log line.

### m2 (minor): an em dash in on-screen text

- Where: network-view-minigame.js:195, the template that puts an em dash (U+2014) before "through" in the up-block title ("Server network", em dash, "through HB-FIN-02"), asserted by test/js/network-view.test.mjs:222.
- Failure scenario. Every pivot-reached network block shows the player an em dash, against the repository rule of no em or en dashes. It predates this branch, but the branch touches the file and restyles the title it sits in. No other on-screen string in a touched file has one (the remaining dashes in game.rb and objectives-manager.js are code comments; the 9.3b README section has none).
- Fix: `` `, through ${...}` `` or `` ` (through ${...})` ``, and update the regex at network-view.test.mjs:222.

### n1 (nit): synthesised italic and bold remain on the pixel font in the rest of the view

- Where: network-view-minigame.css:91-96 (`.network-row-off`, `.network-row-locked`: `font-style: italic`), :43 (`.network-view-stale`: italic); the `h4` and `h5` titles and the `<strong>` host labels have no `font-weight`, and GNF ships only a normal weight (fonts.css).
- Failure scenario. The branch removes the slant from the greyed row because it is synthesised, but "Not responding", "Locked", the stale notice and the up rows keep it, and the titles and host names get a synthesised bold, so the up rows and the greyed rows render the same font two ways.
- Fix: set `font-style: normal` in the base rules (and drop the override in `.network-row-down`), and add `font-synthesis: none;` on `.network-view` so headings and `strong` keep GNF's own weight; use colour for emphasis instead.

## Sync size

No finding adds synced state. The round 2 fixes add none: M1 is client rendering and tests, and n1 writes the same one boolean global per access point, now with no change event for an unset-to-false write. `gainedFootholds` stays bounded by the scenario's jacks, access points and PCs.
