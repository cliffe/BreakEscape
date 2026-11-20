Counts: blockers 0, majors 1, minors 5, nits 4

# UX slice 15 review, round 1 (world marks and switches)

Branch `build/ux-world`, commits 294ec3b9b, 4fba8919c, e6ffd6cfa, ef884d740. Read against slice 15, d6, d7, F34, F38 and section (f) of `UX_GENERAL_RULES_AUDIT.md`, the UI design language and the pixel-art UI rule.

## Findings

### Major

**M1. `public/break_escape/js/systems/item-drop.js:134-138`: a drop beside a desk lands inside the desk and is drawn behind it.**
What breaks: `dropPoint` aims 8 px below the feet and snaps to the nearest walkable grid cell. The grid only blocks a desk's collision strip (the bottom 10 px) plus body clearance, so the desk's top surface counts as floor. A player standing in the gap between two desks (test_needs_sims office, feet at (62, 164), where a walk to the west wall stops) drops the cake at (60.5, 172.5), depth 186.5, inside `office_desk1_91`'s sprite (top 166, bottom 205, depth 206). The desk, Grace's laptop, the pencil pot and the speakers all draw over it: the item shows as a faint ghost on the desktop (`drop-c-beside-desk-hidden-3x.webp`, game 2508). R15 says a drop is visible where it lands. Before this change the same drop sat at the feet and overlapped the desk by about 6 px; the 8 px aim pushes it fully into the desk. A sweep of every walkable foot cell in the office (1144 cells, 16x16 item) finds 255 drops drawn over by a larger prop with the new aim against 228 with the old one: 47 new cases (behind desks, chairs, the bookcase and the activity board), 20 cured.
Fix: give `dropPoint` a clearance test and try candidates in order: the aim (feet + 8), the feet, one cell left and right of the feet, then the feet unsnapped. A candidate is clear when it is walkable and its item-sized box overlaps no static body and no visible non-takeable room object whose depth is above the item's would-be depth (build the test in `dropInventoryItem` from `room.objects`; `roomObstacles` in table-drop.js already lists them). Unit test: a desk sprite just below the feet sends the drop to the feet or the side. Live proof: the same spot between the office's left desks, item visible at 3x.

### Minor

**m1. `public/break_escape/js/systems/lighting.js:141-147`: the status dot is at the sprite's centre, not on the screen (orchestrator ruling).**
What breaks: for PC textures with a tower beside the monitor (`pc8`, Amara's and Ian's) the sprite centre falls between monitor and tower; on `pc6` (Tom's) it lands on the monitor's lower edge (`dot-locked-tom_pc-pc6-3x.webp`; builder shot `main3-21-b-dot-amara_pc-3x.webp`). R13 asks for the mark centred on what it marks, which is the screen.
Fix: a per-texture screen anchor table (`pc6`, `pc8`, `pc11` and every other workstation texture in use) giving the screen's centre as an offset from the sprite centre in source pixels, scaled by display size; `workstationIndicators` reads it and falls back to offsets 0 for an unknown texture. The lock flash already reads the same offsets. Node test per listed texture; 3x shots of each.

**m2. `public/break_escape/js/systems/lighting.js:481-492` (via the indicator glow at 711-713): the dot is the soft radial light texture, not a pixel mark (orchestrator ruling, pixel-art rule).**
What breaks: the indicator is drawn with `LIGHT_TEX`, a 21-stop radial gradient with LINEAR filtering, so the dot is a blurred glow (visible in the dot shots). The pixel-art UI rule bans soft glows and smooth edges in UI marks.
Fix: draw indicators as a crisp pixel mark: a small whole-pixel sprite (for example 4x4 locked, 6x6 open, square or stepped) generated once with NEAREST filtering, at integer world positions, keeping the colour, size difference and breathe or steady motion that tell locked from open. The screen glow can stay soft; only the indicator changes.

**m3. `scenarios/test_needs_sims/scenario.json.erb:247-256`, `:307-316` and `scenarios/test_access_networks/scenario.json.erb:543-552`: three physical switches still act on a click with no confirm (orchestrator ruling, R4e).**
What breaks: the coffee and copier wall sockets switch off at once with a hint, and the server rack power switch brings the network back at once (live: `r4e-office_coffee_socket-no-confirm.webp`, `r4e-office_copier_socket-no-confirm.webp`, game 2508; `r4e-server_power-no-confirm.webp`, game 2511, `servers_offline` false with no prompt). R4e asks for one confirm language for every physical switch.
Fix: wrap each in a `confirm_action` with named labels: coffee "Switch off the coffee machine at the wall?" with "Switch off" and "Leave it"; copier the same for the photocopier; the rack "Switch the server rack back on?" with "Switch on" and "Leave it", guarded by `globalVars.servers_offline` (the breaker's already-off hint covers the other state). Keep the hints in `onConfirm`. Validator 0 ❌ on both scenarios; live shots of the three dialogs.

**m4. `public/break_escape/js/systems/item-drop.js:137`: when nothing walkable is within two cells of the aim, the drop lands at the raw aim point.**
What breaks: the fallback used to be the feet (where the player stands); it is now 8 px below them, unsnapped, which can be inside the south wall or a desk's collision strip. The sweep found four such foot cells in the office, all beside the side doors at x 12 to 20 and 300 to 308; the player could not reach them in a live walk (stopped at x 41), so this is a guard, not a seen bug.
Fix: fall back to the snapped feet, then the raw feet (covered by M1's candidate list). Add a unit test with a pathfinder that returns null for the aim only.

**m5. `scenarios/test_access_work/scenario.json.erb:1586-1598` and `scenarios/test_access_social/scenario.json.erb:1586-1598`: the dialog says "under Ian's desk" (and Greg's), but the socket is high on the back wall about 78 px from a PC that stands on the floor with no desk.**
What breaks: socket centre (128.5, 46), PC centre (177, 107) in both rooms (games 2509 and 2512): 48 px across and 61 px up, mid-wall between the whiteboard and the bookcase. The text points the player at a desk that is not there, so the socket and the PC do not read as a pair (d6's intent). The function itself is fine: off sets `ian_pc_unplugged` and `f12_pc_unplugged` true, on sets them false, labels "Switch off" / "Switch on" with "Leave it".
Fix: until PCs sit on desks (deferred room-dressing note), reword to "Switch off the wall socket behind Ian's PC? It loses power." (and Greg's), or move the socket to the wall foot nearest the PC's column if the bookcase can shift. Correct the build log's "about 40 px from the PC" at `docs/achitechture/UX_SLICE15_BUILD_LOG.md:12`.

### Nits

**n1. `scripts/scenario-schema.json:5260-5261`: `minLength: 1` accepts a label of spaces, which the engine then shows as Confirm or Cancel (`apply-actions.js:414` trims).** Fix: add `"pattern": "\\S"` to both so the validator and the engine agree.

**n2. `scenarios/test_access_work/scenario.json.erb:2158-2162`: the wedge stands beside the stores doorway, not in it.** Centre (80, 248), 16 px wide: its left edge is 8 px right of the door gap (x 32 to 64) and its foot about 26 px above the door line (`wedge-b-3x.webp`, game 2510). It reads as "an extinguisher near the door", which meets d12's short-term aim; for the lab move (slice 16) place it against the open leaf's edge so it reads as holding the door.

**n3. `public/break_escape/js/systems/item-drop.js:136`: the snap does not keep the drop in the current room.** `findNearestWalkableWorldCell` searches the world grid, so from a foot cell in a side doorway (4, 76) it returns (-12, 84) in the next room while the drop is saved under `currentPlayerRoom`. Those foot cells were not reachable live, and the old code had the same reach; clamp the result to the room rectangle when M1 is fixed.

**n4. `docs/achitechture/UX_SLICE15_BUILD_LOG.md:12`: "about 40 px from the PC" is about 78 px.** Covered by m5's fix.

## What checks out

- `confirmLabel` and `cancelLabel` (apply-actions.js:408-420): plain text into `gameConfirm`, which sets both labels with `textContent`; a missing, blank or non-string label falls back to Confirm or Cancel. The schema documents both on the trigger action. The server ignores them (declared_grants, capture_model only walk `onConfirm`). The unrelated `confirmLabel` keys in sis02 and sis03 sit in `minigameData` and do not clash.
- Old scenarios keep their text: lab_physical_pentest's unlabelled hi-vis confirm shows "Confirm" and "Cancel" live (game 2513, `lab-unlabelled-confirm.webp`). m01_first_contact has no `confirm_action`, so it proves nothing either way; it validates clean.
- The 31 named confirms (work 18, networks 5, social 8): each confirm label names the action in plain UK English ("Switch off", "Switch on", "Jam it", "Clear it", "Flip it", "Plug it in") and each cancel is "Leave it". Live: Ian's and Greg's sockets both ways, the breaker "Flip it" / "Leave it". The dialog keeps the skinned buttons and pixel font.
- The socket uses the existing `wall_socket1` fixture at whole-pixel positions (120, 37), 17x18 at x1, no downscaling.
- The wedge appears on `store_door_propped` beside the stores doorway (visible true after the global).
- Room edges: drops at the south wall (parcel at (164, 300), feet at y 298, depth 307.5 against the player's 293.9) and beside the west door ((44, 84)) land on the floor in front of the feet and show (`drop-a-south-edge-3x.webp`, `drop-e-west-doorway-3x.webp`).
- No new player_state: the diff touches no synced field; a drop sends the same payload with x and y one cell lower.

## Verification

- Server: keyless, headless, port 3361 from this worktree, setFPS(20) with fixed steps on; stopped by PID afterwards.
- New games via `tools/playtest/swap-scenario-game.rb` on host test_seating: 2508 (test_needs_sims: drops, sweep, dots, coffee and copier sockets), 2524 (test_needs_sims: west door drop), 2509 (test_access_work, cable_room: Ian's socket), 2510 (test_access_work, store_lobby: wedge), 2511 (test_access_networks, server_room: breaker, rack power), 2512 (test_access_social, f12_room: Greg's socket), 2513 (lab_physical_pentest: unlabelled confirm).
- Shots and per-run JSON reports: session scratchpad `ux-shots/slice15-r1/`.
- JS: every test file importing a changed module or one of its importers (apply-actions, item-drop, lighting, inventory-menu, interactions, core/game, scenario-timer-dispatcher): 72 files, 949 tests, 0 fail.
- Validator `--no-graph`: test_access_work, test_access_networks, test_access_social, lab_physical_pentest, m01_first_contact: 0 ❌ each, exit 0.
