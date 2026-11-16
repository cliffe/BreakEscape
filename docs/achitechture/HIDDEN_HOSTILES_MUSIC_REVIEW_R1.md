# Hidden hostiles and the fight music: review round 1

Branch `build/ol-hidden-hostiles` at 146198913, reviewed as `git diff main...HEAD`.

**Blocking 0, major 2, minor 6.**

The rule itself is sound and small: `isHiddenByMapping` reads a bounded map that already exists, is saved and restored, and only `anyHostilesAlive` calls it. The two majors are both cases the change set out to fix but does not reach: the fight music only re-checks on `npc_ko`, so a hide that comes after the last KO, or a reload that re-announces a hidden hostile, still leaves the fight playlist on for good.

## Major

### M1. Hiding the last conscious hostile never ends the fight music

`public/break_escape/js/music/scenario-music-events.js:421-428` runs the `all_hostiles_ko` check only on `npc_ko`. The new skip at line 172 only matters if some other hostile is knocked out after the hide.

Order that still sticks: the player punches a day staff member in m03 (threat plays via the `npc_hostile_state_changed` entry at m03 `scenario.json.erb:157`), nobody else is hostile, then the night turn hides that NPC. No `npc_ko` follows, so the fight playlist stays for the rest of the night. This is the m03 case the notes give as the reason for the change (`HIDDEN_HOSTILES_MUSIC.md`, Problem). The same applies to m04 `operative_static` leaving while hostile (2664, 2669) and m10 `vector_so` left behind in the security office (2983) when he is the only hostile. The live proof and the unit tests both use the order hide first, KO second, so they do not see it.

Fix: when a `setVisible: false` hides an NPC that is hostile and not KO'd, run the same check. For example, in `npc-behavior.js` `setNPCVisible` (line 383), after the record at line 392, emit `npc_hidden` with `{ npcId, wasHostile: true }` when `!visible && npcHostileSystem.isNPCHostile(id) && !isNPCKO(id)`, and register the `all_hostiles_ko` handler on that event too (line 425 block). Gating on "was a counted hostile" keeps a peaceful hide from switching the playlist. Add a unit test for KO first, hide second, and a proof step in the test scenario for that order.

### M2. After a reload, a hidden hostile is re-announced and restarts the fight music

`public/break_escape/js/systems/npc-behavior.js:557-562` calls `announceRestoredHostile` for every restored hostile that is not KO'd, hidden or not. `npc-hostile.js:218-223` then emits `NPC_HOSTILE_CHANGED { isHostile: true, restored: true }`. m03's threat entry (`scenario.json.erb:156-160`) and m10's (`scenario.json.erb:1356`) do not exclude `restored`, so the fight playlist starts for an NPC that is hidden by a mapping and, under the new rule, can never be counted or KO'd. Nothing then ends it (see M1). m03's own comment at 1311 confirms that a restored NPC outside the start room is announced after `game_loaded`, so the `game_loaded` mood loses.

The notes claim the reload case as fixed, but the proof cannot show it: the test scenario's `game_loaded` entry is itself `threat` (`scenarios/test_hidden_hostiles/scenario.json.erb:12`), both guards are in the start room, and the reload row of the table in `HIDDEN_HOSTILES_MUSIC.md:44` leaves the playlist blank.

Fix: in `npc-behavior.js:559-562` keep `this.hostile = true` and the stats, but skip `announceRestoredHostile` (or only its emit) when `window.npcManager?.isHiddenByMapping?.(npcId)` is true. Then a reveal should announce it (see m1). Prove it with the test scenario changes in m3.

## Minor

### m1. A hostile revealed again does not bring the fight music back

`setNPCVisible(true)` (`npc-behavior.js:383-427`) records `true`, so the NPC counts again (test at `test/js/hostiles-hidden-music.test.mjs:65`), but no hostile event fires. Example: m10 `vector_so` hidden on leaving the security office (2983), another hostile KO'd (calm music), the player goes back (2982 reveals him): he chases with calm music playing. Fix: on a reveal of a hostile, not KO'd NPC, call `announceRestoredHostile` (the `restored: true` flag lets m04-style conditions ignore it if a mission wants to). Same change as M2's second half.

### m2. Tests skip the real hide path and two of them only assert silence

All four tests call `recordNpcVisibility` directly (`hostiles-hidden-music.test.mjs:60, 67-68, 84`). A regression in `setNPCVisible` (stops calling `recordNpcVisibility`, line 392) or in the mapping handler (`npc-manager.js:1656-1659`) would pass. Tests 2 and 3 (lines 65, 73) assert `switches` is empty, which also passes if the handler never registered. Fixes: drive one test through `handleEventMapping` with a `setVisible: false` config and a stub `npcBehaviorManager` that calls the real `NPCBehaviorManager.prototype.setNPCVisible`; in tests 2 and 3, end by KO'ing `b` and asserting `['calm']` as a positive control. Add the M1 order (KO, then hide) as a test once fixed.

### m3. The test scenario should stay, but cannot catch M1 or M2 as written

`scenarios/test_hidden_hostiles` is worth keeping (59 other `test_` scenarios, `collection: testing`, small). Changes so it proves the stated claims:
- `game_loaded` to `noir`, plus an `npc_hostile_state_changed` entry (`isHostile === true`) to `threat`, so a reload shows which entry won (line 12).
- Put the day guard in the vault or a second room loaded after the start room, so a reload re-announces it after `game_loaded` (M2).
- A second route for the opposite order: KO `fight_guard` first, then trigger `night` (M1). A `door_unlock_attempt` on a second door, or the same door after the KO, would do.

### m4. The proof scripts print but never judge

`tools/playtest/hidden-hostiles-music-proof.mjs:67` and `tools/playtest/m10-opening-music-read.mjs` print JSON and exit 0 whatever happens; the reading is left to whoever runs them, and the notes' table has a blank cell where the reload playlist should be. Fix: add expected values (`start.playlist === 'threat'`, `afterNight.npcs` day guard `hiddenByMapping`, `afterKO.playlist === 'noir'`, reload playlist per m3) and `process.exit(1)` on a mismatch. `doorways[0]` (line 47) is fine for one door but will pick the wrong one once m3 adds a second; select by `connectedRoom`. The m10 read script is fine to keep as a read-only helper.

### m5. The m10 static list is incomplete and one line is wrong

Spot-checked m03 (1495, 1501 `victoria_sterling`) and m04 (2177, 2182 `operative_cipher`; 2588, 2593 `voltage`; 2664, 2669 `operative_static`; `m04_npc_voltage.ink:367`): all match. m10:
- `HIDDEN_HOSTILES_MUSIC.md:61` says `arakawa_blast` 2268 hides at `breach_open`. It hides on `officer_out === 'arakawa'` (`m10 scenario.json.erb:2268`).
- The method (line 52) says every `setVisible: false` mapping was read. m10 has 31; the list omits at least 2033, 2034, 2080, 2081, 2149, 2151, 2152, 2192, 2194 to 2196, 2216, 2217, 2395, 4249, 4251, 4272, 4293, 4294, and the `after_end` `closing_done` hides every NPC carries (`scenario.json.erb:528-535`). Most are vans, posts and the closing, so the conclusion probably holds, but `arakawa_post` (2216, `split_started`) and the posts should be checked for a hostile config before the doc says so.

Fix: correct the 2268 line, and either list the remaining m10 hides with a one-line reading each or narrow the method sentence to the NPCs that can turn hostile.

### m6. Pre-existing: m10's hidden reinforcements can start and hold the fight music (outside this diff)

`reinforcement_a` and `reinforcement_b` (`m10 scenario.json.erb:4039`) are `initiallyHidden` with `startHostile`. `setHostile(true)` runs when the behaviour is created (`npc-behavior.js:566-567`), hidden or not, and emits the hostile event (`npc-hostile.js:254`). If the gallery's behaviours are created before `room_entered:gallery` sets `hax_jammed` (`scenario.json.erb:1690`), or after a reload, which clears `hax_jammed` (1675), the threat entry at 1356 can play with nobody visible; and because they have no record they count until revealed, so `all_hostiles_ko` cannot end it on a route where Victoria is not trusted. The reveal path itself (4042, 4043, `setVisible: true`, record `true`) works as the notes say and is unchanged by this branch. Not checked live. Fix, as a follow-up: do not apply `startHostile` (or not emit) until an `initiallyHidden` NPC is first shown, or skip NPCs whose sprite body has never been enabled. Worth one live read with a seeded save at the gallery door.

## Checked and fine

- `isHiddenByMapping` has one caller (`scenario-music-events.js:172`). `_npcVisibility` is otherwise read only by `registerNPC` (`npc-manager.js:355`) and the export; nothing else changes behaviour.
- Ids: the record and `getAllNPCs()` both key on the registered `realId` (`npc-manager.js:304-359`).
- KO: a KO'd hidden NPC is skipped either way; no interaction.
- Hostility changes: a hidden NPC that turns hostile (ink tag while hidden is not possible; a mapping could) does not count, which matches its inability to attack (`npc-behavior.js:878`).
- player_state: the branch adds no synced field. `npcVisibility` is a map keyed by NPC id, capped by `MAX_NPC_VISIBILITY` on the server (`game.rb:5649-5662`), so it does not grow with play. It is sent whole on every sync when non-empty (`state-sync.js:484-485`); that predates this branch.
- No new static import, so no harness copy list changes. `node --max-old-space-size=2048 test/js/hostiles-hidden-music.test.mjs`: 4 of 4 pass.
