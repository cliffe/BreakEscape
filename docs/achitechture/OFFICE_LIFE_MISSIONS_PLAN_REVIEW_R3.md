# Office life missions plan: review round 3

Reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 1d3404068 (draft 3), worktree `p-ol-plan`.

## Verdict

The m06 pilot can be built. The Tiled coffee point and copier can be declared as scenario objects with presets, the lab reaches the floor through an unlocked door, and Dani and Priya carry only optional beats. No blockers. Five majors remain:

- the merge rule does not match how work reaches main;
- the release check has no owner;
- the sync table leaves out the physical-pentest state the openings would write;
- V5's event list misses the events the pilot's openings use;
- the voice costing misreads how scenario-level chatter pools are billed.

The rest are minors.

## Checked and holding

- **Declaring decor.** A scenario object claims a Tiled item by base type (`core/rooms.js:258-282`, `:186-192`), and `office-presets.json` has `coffee_station1` and `photocopier1` in its `coffee` and `copier` types. The trading floor has exactly one of each on the `items` layer (`room_hce_trading.json`: photocopier1 at 36,244; coffee_station1 at 74,242). So `{ "type": "coffee_station", "id": ... }` and `{ "type": "photocopier", "id": ... }` claim them and take presets (`validate_npc_needs.rb:607-614`).
- **Lab to coffee.** `blockchain_lab` has no `locked` and joins the floor through its west door (`scenario.json.erb:2233-2249`). Doors become walkable once opened and never re-close (`NPC_NEEDS_SYSTEM.md:52`). The lab loads only after the player has come through the floor, so the floor's coffee point is always loaded whenever Priya is.
- **Dani and Priya.** Both have optional tasks only (`scenario.json.erb:360-374`; `TESTING_WALKTHROUGH.md:62`). Neither holds items. Their KO effects are `cover_strained` and the credits lines (`:1421-1436`, `:246-251`), and those are the same whether they stand still or move. Both atlases already have `sit` frames.
- **Other checks.** No m01 to m10 mission has an `npc_arrived` mapping. m06 has 566 clips (566 json and mp3 pairs) and 0 validator errors. `player-combat.js:453` turns an attacked NPC hostile. The field map matches the hardening plan (`SCENARIO_FORMAT_HARDENING_PLAN.md:738-747`). `STEPS = [STEP_8A]` (`format_upgrade.rb:59`). Branch `build/hard-8b` exists with chunk 1 committed.

## Majors

**M1. The merge rule skips the batch train and the full-suite rule.**
Evidence:
- Section 3, stage 8 (plan:255) and section 10 (plan:405) rebase each mission branch onto main, run the mission's own checks (validator, route suite, V9, V6, a short playtest), then fast-forward main.
- Work actually reaches main through batch branches: `git log --merges` shows "Merge build/exchange-heard ... into batch 26" and "Merge build/reactions ... into batch 27".
- The standing rule is to fast-forward main only to a batch commit on which `bin/rails test` and `bin/test-js -j 3` ran green (merge-tested-commit, the user's rule).
- The mission branch also changes shared files that those suites cover: `office-presets.json` comes in with E2 later, `README_scenario_design.md` gains lines for the V tools (plan:288), and V9 and the other V tools add new fixture tests.

Under the plan's rule, main would take untested suite changes, and two office-life branches racing each other would each re-run their checks over and over.

Fix: merge `build/office-life-<m>` into the current batch like any other build branch. Run the mission checks (validator, the m06 route suite, V9, V6, the Haiku regression) on the batch tip next to the full suites, and fast-forward main to the hash they ran on.

**M2. The release check has no owner, and "revert from the release branch" doesn't fit how releases are cut.**
Evidence:
- Plan:404 says "before any version bump, a release check runs V6 for every mission".
- `.claude/skills/bump-version/SKILL.md` has no such step, and section 13 never schedules adding one.
- Releases are cut as branches from main (`release/1.0.15`, kept at 7eedbd4c1), and Hacktivity loads the gem as a path gem (`Hacktivity/Gemfile:15`).
- After the plan's fast-forward, a mission's office-life work is a run of separate commits mixed in with later work. Holding it back means reverting each commit on the release branch, and later fixes that touch the same files can make those reverts conflict.

Fix:
- Add a step to the bump-version skill (as an item in section 13): run V6 across `scenarios/m*/` and stop on any uncached office-life clip.
- Under decision 4(b), keep unvoiced office-life work on its branch, or behind a one-line scenario switch the release branch can flip, rather than reverting commits.
- State that m06 is not served to students (`SCENARIO_FORMAT_HARDENING_PLAN.md:27`), which bounds the risk while that work is set up.

**M3. The sync table leaves out what the physical-pentest openings write.**
Evidence:
- Section 7 (plan:342-355) says office life reaches player_state "only in the forms below", and its caps total 58 keys.
- The openings the plan offers (section 3 Tier 3, the m06 row: "openings into optional content", a tailgate gate, a propped door, an unlocked session) write state that is not in the table:
  - `se_captures` and `__capture_log_seen`, both sent whole on each new capture and both rated "risk" (`PLAYER_STATE_SYNC_AUDIT.md:100`, `:166-180`);
  - cloner `saved_cards`, sent whole inside every inventory echo, 9.5 KB at 50 cards (`:101-102`). m06 starts with an RFID cloner (`scenario.json.erb:667`);
  - `sessions`, `signedInPcs`, `footholds`, `lockoutPcs` and `wornItem` in the bootstrap (`:50`);
  - `door_propped:<roomId>` (`NPC_NEEDS_SYSTEM.md` event list).

Fix: add a row for each one, giving the piece, where it lives, how it is sent, and a cap per mission (for example at most 2 capture targets and at most 1 clonable card added per mission). Make V8 count them as well. Or limit the pilot's openings to workstation, print and left-behind slots, and list the others as a later approval item with their sync cost.

**M4. V5's office-life event list misses the events the pilot's openings fire.**
Evidence:
- V5 (plan:282) lists 14 events.
- The engine also emits `workstation_accessed:<id>` and sets `<id>_accessed` (`workstation-state.js:56-58`, `:587-588`). It emits `npc_caught_at_post:<npc>` too (`npc-needs.js:3049`).
- The event catalogue (`NPC_NEEDS_SYSTEM.md` around :900-960) adds more: `workstation_owner_left`, `workstation_owner_returned`, `workstation_auto_locked`, `npc_returned_post`, `npc_posted`, `npc_overheard`, `npc_turned_back`, `npc_mutter`, `door_propped`, `item_dropped`, and `desk_phone_ring_heard` (`npc-office-visuals.js:459`).
- The pilot's main opening, "unlocked trading screens while their owners are at the coffee point" (plan:315), completes through `workstation_accessed`, so V5 as written would pass a required task bound to it.

Fix: define V5's set as event prefixes. Keep the list in one constant that a fixture test checks against the event catalogue in `NPC_NEEDS_SYSTEM.md`, and add the globals `<id>_accessed` and `<id>_servings`.

**M5. A scenario-level chatter line costs a clip for every voiced NPC in the mission, not just the ones who can say it.**
Evidence:
- `TtsLineExtractor#each_chatter_line` (`tts_line_extractor.rb:112-120`) yields every shared pool line for every voiced, non-phone room NPC, whether or not that NPC has needs or ever chats.
- `keys` (:99-108) and the batch both follow it, so `ttsPregenerateChatter: true` (plan:409) generates those clips.
- m06 has 12 voice blocks and 1 phone NPC (`scenario.json.erb`). Those include briefing and debrief records, Netherton, Nightshade, Satoshi and Kemal. So one shared line costs about 11 clips, not the 2 to 3 the plan assumes.
- Plan:283 and plan:424 say "once for each voiced NPC who can say it", and the Tier budgets build on that.

Fix: campaign missions use NPC-own pools only, with no scenario-level `chatter`, which lets V7 and the budgets stand. If shared pools are wanted later, make narrowing the extractor to NPCs with chatter or needs an engine item for approval, and make V6 report the extractor's real count. Also say that 4(a)'s batch would otherwise voice lines nobody speaks, and that `tts:wasted` will not flag them, because `keys` treats them as expected.

## Minors

**m1. Declaring one trading-desk PC hides its twins.**
An unclaimed decor sprite is skipped when another sprite with the same image name has been claimed (`core/rooms.js:2190`, `:2498`; `mission-room-dressing/SKILL.md:100`). The floor's desks carry pc6 three times, and pc8 and pc11 twice each (`room_hce_trading.json` table_items). "Screen habits on trading desks" (plan:303) would make the undeclared copies vanish.
Fix: in the pilot's PLAN.md, declare every same-image monitor on the floor, or register distinct variants. Add this to `patterns.md`.

**m2. The coffee point's preset queue runs into the copier and the west wall.**
The `coffee` preset queues at (-1,1) and (-2,1) (`office-presets.json`). On the 10x10 tile floor the copier sits one tile west of the coffee point (36 against 74), so the first queue cell is likely the copier's own `useFrom` cell, and the second reaches the wall column.
Fix: give the pilot a hand-written `queue.cells` (or `"queue": false`), and check it with the validator's queue-cell check and a render.

**m3. Dressing and lighting come before the slices that add objects.**
Stage 4 slice 2 (plan:210) dresses and lights before slices 3 to 5 add switches, reveal slots and printouts, magnet spots and declared desk phones.
Fix: move slice 2 after slice 5, or add a short re-dress and lighting check after slice 5.

**m4. The round rules differ from AGENTS.md.**
AGENTS.md:41 and :72 (user, 2026-11-09) say 2 to 5 rounds, stopping after round 2 once a round has no blockers or majors. Plan:447-448 says 3 to 5 for plans, and "always rounds 1 to 5" for built-mission phases, which follows an older rule from 2026-10-22. That built-mission rule's early exit also leaves out blockers ("0 majors and 0 minors").
Fix: follow AGENTS.md, or name the user rule the stricter count comes from, and add blockers to the early-exit condition.

**m5. The m06 row leaves out Kemal Aydin.**
`satoshi_minder` patrols (`scenario.json.erb:2431`), holds a sight challenge and a cover-story beat (:28-30), and is the key source for the CEO's office (:2413).
Fix: list him with the checkpoint guard as patrolling and never given needs.

**m6. V9 can't get codes or the critical path from `dungeon_graph.json`.**
The JSON holds nodes with `id`, `label`, `kind` and `optional`, and edges with `from`, `to` and `soft`. Secrets are scrubbed out of it (`generate_dungeon_graph.rb:2343`). The critical path is built only for the HTML and Markdown (:1729). Plan:125 promises "key, code and password edges", and rule 2 says no PIN or password moves.
Fix: V9 hashes each lock's requirement from the rendered scenario and works out the aim chain from the rendered scenario too, or the graph script writes aims to the JSON.

**m7. The floor's POV background differs from the map, and the split view follows NPC position.**
`POV_BACKGROUNDS.md:11` puts the copier and coffee point on the back wall, while the map has them on the south row. The left or right view is chosen from the NPC's position (:32), so giving Dani a desk post changes which image shows.
Fix: list both as facts in the pilot's art section, and decide whether the redo moves the coffee point.

**m8. The 24-hour exchange isn't in the source.**
`LIGHTING_PLAN.md:9` says "a night, the exchange still staffed". It never says the exchange runs 24 hours. Plan:303 and :313 assert it.
Fix: drop "24-hour", or cite ink that says so.

**m9. The levers aren't grounded in m06.**
m06 has no cake source and no breaker. A desk-phone lever needs a declared phone with an id and an extension source, as in `test_needs_sims/scenario.json.erb:197-208`. Plan:303 offers "a cake or desk-phone lever" with no source for either.
Fix: name the pilot's lever and its in-world source in section 5, or leave the choice to stage 2 explicitly.

Counts: B=0 M=5 m=9
