# m10 Full Disclosure, stages 4+5: review R1 (puzzles, locks, engine)

## 0. Scope and method

Round 1, fresh read-only reviewer, 2026-10-21. Reviewed: `../stage_4/objectives_tasks.md` ("OT") and `room_layout.md` ("RL"), with `docs/agents/FINALE_BRIEF.md`, and `../stage_3/moral_choices.md` ("MC", §3.5 and §16) for context. Method: the `mission-puzzle-chains` skill run against the plan as if building it (no `scenario.json.erb` exists yet). Every engine claim was checked against the working tree; paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/` or `tools/`.

I ran `scripts/check_door_alignment.py` on a stub scenario holding RL §1's eight rooms, their stand-in map types and connections (scratch file, not in the repo). I ran it with `forward_post` as the start and again with each test start room (`security_office`, `workshop_floor`, `server_hall`, `core`). All seven door pairs align in all five cases. The stand-in maps' sizes match RL §2's table (`room_pnw_genhall` 20×10, `room_pnw_vault` 10×6, `room_qdc_server_hall` 10×6, the other five 10×10).

No VM material was opened. The orchestrator has accepted the PIN outer lock and the records cupboard, so I don't re-argue them.

## 1. Verdict

**Not yet implementable. 1 blocker, 9 major, 13 minor.** The structure is good: the map, the door alignment, the story-door route, the PIN outer lock, the KO nets and `concludeRequires` all stand up against the code. What fails is the wiring between them, in ways that break silently:

- the deep-start test runs have no handler (F-00);
- the clock's string values turn into numbers when ink writes them (F-01);
- HaX's mappings can't show, hide or open other NPCs (F-02);
- the flag-reward door unlock the plan cites unlocks the wrong room, and one OT row would skip the shutter (F-03);
- the WREN aim never appears without an `unlockAim` mapping (F-04);
- a failed unlock leaves a door shut behind a done-flag (F-05);
- HaX's jam can stick on for the rest of the night (F-06).

On design, the kit is carried but never needed. The fingerprint kit has no use on any branch (F-07), chains are one room deep on a cold start (F-08), and the guard can't watch the cracker (F-09).

Fix F-00 to F-06 before round 2. F-07 to F-09 are design calls for the author, each with a cheap option that adds no lock.

## 2. Engine claims checked

| Claim (where) | Verdict | Evidence |
|---|---|---|
| No eventMapping action unlocks a door (OT §0, RL item 30) | **holds** | `_buildMappingConfig` keys, `systems/npc-manager.js:648-683`: setGlobal, completeTask, skipTask, unlockTask, unlockAim, emitEvent, setVisible, patrol keys, conversation keys; no unlock |
| Ink `#unlock_door` from a met NPC with `unlockable` persists (OT §0, §4) | **holds**, also from a phone chat | `minigames/helpers/chat-helpers.js:71-96` → `systems/npc-game-bridge.js:75-170` → server `app/models/break_escape/game.rb:1028-1031` (`method == 'npc'` is checked before the lock-type match), `:1247-1270`. Phone chat sets `window.currentConversationNPCId` (`minigames/phone-chat/phone-chat-minigame.js:275, 342`) and runs the same tag processor (`:711, :885`). "Met" means the NPC's room was served: `app/controllers/break_escape/games_controller.rb:471` → `track_npc_encounters` `:1519-1556`. HaX, listed in the start room, counts as met from load. **It is fire-and-forget**, though: the unlock's result arrives after the knot's later tags (F-05) |
| Flag reward `unlock_door` is a persisted route (OT §0, RL item 30) | **wrong** | see F-03: `find_flag_rewards` overwrites the reward's `room_id` with the station's own room (`games_controller.rb:2152, 2159, 2166`), and `process_door_unlock_reward` reads `room_id` first (`:2232`). The reward unlocks the room the station is in |
| `game_loaded` fires after saved state is restored (RL item 31) | **holds** | `core/game.js:2080`, after `initScenarioMusicEvents` |
| A reload resumes where the player was | **not as the plan assumes** | the client always spawns at `gameScenario.startRoom` (`core/game.js:1687-1727`); `player_state['currentRoom']` is saved (`state-sync.js:110, 206`) but nothing on the client reads it back. After any reload the player is at the forward post and walks the corridor again. Neither OT nor RL says so (F-06, F-15) |
| `concludeRequires.globals` counts only boolean `true` (OT §0, §7) | **holds** | `game.rb:2719-2735` |
| Conditions take `&&` only (OT §0) | **holds** for mappings and variants | mappings: `systems/npc-manager.js:16-110` (`!`, `===`/`!==`/comparisons, `.includes`, `&&` split; no `||`, no brackets); variants: `utils/conditional-text.js:27-80`. Music and credits conditions are `new Function` JavaScript (`music/scenario-music-events.js:35-55`), so they need the `globalVars.` prefix (F-17) |
| `koImmune` (RL §2, item 36) | **holds** (static only) | `systems/npc-hostile.js:263-275`, `systems/player-combat.js:329`, validator `scripts/validate_scenario.rb:1141-1147`. Nothing toggles it |
| `resume: true` re-rings (OT §4.2, RL item 32) | **holds** | `systems/npc-manager.js` phone branch: `startKnot: (config.resume && npc.storyState) ? null : knotToUse`; with no saved story it falls back to the knot. `room_exited` carries `roomId` (`core/rooms.js:3011-3014`) |
| `delayMs` waits out an open minigame (OT §4) | **holds** | `_scheduleDelayedMapping` re-arms while `MinigameFramework.currentMinigame` is set (`systems/npc-manager.js:602-622`). A pending timer is lost on reload |
| `door_unlocked` / `door_unlocked_by_npc` payloads (OT §4.5, RL item 39) | **holds** | player: `systems/unlock-system.js:675`; NPC: `systems/npc-game-bridge.js:135` (`roomId`); `door_unlock_failed:<connectedRoom>` exists (`systems/unlock-system.js:122-131`), and an RFID door with an empty cloner emits it at once (`:524-527`) |
| Flag stations: first owner wins, wrong-station refusal, `hintOnlyFlags`, station-qualified task ids, one reward per flag (OT §0, RL "Also checked") | **holds**, with a build trap | `games_controller.rb:1180-1216` (the hint check runs before the ownership check; `hintOnlyFlags` must be a Hash, `:2389-2405`), `:2407-2440`, `:2496-2530`, `:2176-2210`. The trap: see F-18 |
| ERB loops for the countdown objects (OT §6) | **holds** as a build method | the conditions are plain `&&` strings that `conditional-text.js` reads. But `raid_clock`'s values coerce to numbers when ink writes them (F-01) |
| The WREN aim opens on `unlockCondition.globalVariable` (OT §2) | **not by itself** | `systems/objectives-manager.js:688-700` evaluates it, but nothing re-checks it when the global changes; aims unlock on `aimCompleted` only (`:849-869`). F-04 |
| `los.challengeOnSight` covers the keypad (OT §4.5, RL §2.7) | **doesn't cover the keypad** | `systems/npc-sight-challenge.js:26-29`: "Nothing is checked while a minigame or conversation is open"; the only in-minigame catch is the lockpick's (`systems/lockpick-catch.js:6-13`). F-09 |
| Mapping actions act on another NPC (RL §2.2, §5; OT §4.7; RL item 40) | **wrong** | `setVisible` toggles the mapping's own NPC (`npcBehaviorManager.setNPCVisible(npcId, …)` in `_handleEventMapping`), and `conversationMode` opens the owner's own chat (`startMinigame(…, { npcId: npc.id … })`). F-02 |
| `triggerOnInteract`, `onRead.setVariable` on a `gameDisplay` readable | **holds** | `systems/interactions.js:715-719`, `:1617-1631`; both emit `global_variable_changed:*` |
| Ink `#set_global` value types | **coerces** | `chat-helpers.js:474-478`: `!isNaN(value)` → `Number`. F-01 |
| An NPC with `unlockable` but a card held by someone else (`#give_item`) | **speaker's own items only** | `chat-helpers.js:98-113` gives from `window.currentConversationNPCId`'s `itemsHeld`. There is no pickpocket mechanic (no hit for `pickpocket`/`steal` under `js/`). F-12 |
| `--start-room` in F15 | **moves the start room** | `tools/playtest/new-game.rb:162-166` rewrites `scenario_data['startRoom']`; only the start room's NPCs load at boot (`core/game.js:1720-1727`; `systems/npc-lazy-loader.js:35-56`). F-00 |

## 3. Boss-key and chain depth

**Room depth** (from `forward_post`): tunnel 1, security office 2, workshop 3, power room 4, server hall 5, gallery 6, core 7. RL §3's audit calls the gallery stair "5" and the outer lock "6". That fits if depth counts the room the lock is seen *from*, so it's consistent.

**RL §3's audit, re-checked:**

| Lock | RL verdict | Re-check |
|---|---|---|
| Blast door | by design | agree. Both halves (table, gate terminal) are in the start room |
| Inner door | intended | agree, but the ladder can be used before the door is tried, which skips the cost (F-13) |
| Stair | by design | agree |
| Power-room door | ❌ same-room, accepted | agree it's same-room. All three routes (talk, clone, hatch) sit in the workshop |
| Gallery stair | ✅ boss-key | agree. The cut is one room back and the lock is visible on arrival in the hall |
| Outer lock | ✅ boss-key on Ghost's code and the rota | **only on two import branches**. On a cold start and on most saves, every way through is in the gallery itself (cracker, the guard's card, the inside man), so it plays as same-room |
| Records cupboard | optional | agree |

**Chain depth on the critical path.** Six locks lie between the start and the core. Four are story gates that open themselves when a scene or flag finishes, and two are real puzzles, both solvable in the room where they're met. No item is ever hunted for on the critical path, and no tool from the cumulative kit is *required* on any branch: the pick, the cloner and the cracker each have a talk route beside them, and the fingerprint kit has nothing to touch (F-07, F-08). A finale built around five scenes and four VM flags can carry that, and the brief asks for "fun and educational, not hard". Still, the mission tells the player to bring every tool and then needs none of them, and the boss-key pattern that m01 and m02 were rebuilt around appears only on imports. F-08 proposes two cheap fixes that keep everything optional and add no lock.

**Mission's own choices required (3a).** `concludeRequires` holds the four flag tasks only (OT §7), and the `end_it` tasks complete on every ending (OT §2 notes). That's correct for a finale whose choices carry consequence rather than gates. No finding.

**Capability arc (3b).** m10 grants nothing (RL §3), and that's right for the last mission. The arc closes with the kit carried but not spent (F-07, F-08).

**Would every object exist anyway (3d).** Yes for the main ones: the lock guard's code card, the fitter's spare card in a service box, the duty handset, the sign-out sheet. The countdown panels in all eight rooms are a stretch for a 1960s bunker, but they're ENTROPY's own release tooling, so they pass.

## 4. Findings

Counts: **1 blocker, 9 major, 13 minor.**

### Blocker

**F-00, blocker. OT §9 baselines S-wk, S-so, S-sh, S-core (24 of the 35 runs: B, W, C, D).**
Evidence: `tools/playtest/new-game.rb:162-166` rewrites `startRoom` to the `--start-room` value. Only the start room's NPCs load at boot (`core/game.js:1720-1727`), and later rooms load as the player reaches them (`systems/npc-lazy-loader.js:35-56`; README "Common bugs", "An NPC outside the start room only hears events once its room has loaded"). The room endpoint refuses a room that is neither the start room nor unlocked (`games_controller.rb:444-450`), and no baseline unlocks `forward_post`. Encounters are recorded only when a room is served (`:471`, `:1519-1556`), and `validate_npc_unlock` needs one (`game.rb:1258`).
Problem: on these runs HaX (`agent_0x99`), Ghost and the other phone NPCs, all listed in `forward_post`, never register. Every global mapping in OT §3–§6 is on HaX, so none of them run. Her hub is missing, her `#unlock_door` would be refused because she was never met, and so would every story door. The runs would test a mission with no handler. (The alignment check passes on every start room, so layout isn't the issue.)
Fix: start every baseline in `forward_post`, `--unlock` every room up to the target, `--set` the globals, and have the tester walk to the start point. There is no teleport in the test bridge (`systems/test-bridge/index.js:26, 370`), but the walk is six rooms of unlocked doors. Or add a tooling option to S4-9's list: `new-game.rb --preload-room forward_post` that marks the room's NPCs as met and makes the client load that room's NPCs at boot. Either way, say in OT §9 that a deep start has to load the start room's phone NPCs.

### Major

**F-01, major. OT §4.1 (`#set_global:raid_clock:0230`), §4.4 (`0345`), §6 (every step), RL §2.1 ("reads 06:00").**
Evidence: ink `#set_global` turns any numeric-looking value into a `Number`: `chat-helpers.js:474-478` (`else if (!isNaN(varValue)) parsedValue = Number(varValue)`). So `0230` is stored as `230`. Mapping `setGlobal` keeps a JSON string, and `--set raid_clock='"0245"'` stores a string.
Problem: `raid_clock` would hold a string or a number depending on who wrote it last. Every step's guard is `globalVars.raid_clock === '<previous>'` (OT §6), so after the first ink-written step (the breach knot) the next step's check fails silently. The clock stops at 02:30, and every countdown variant keyed on `'0345'`/`'0400'` falls through to the base text. The same applies to `0600`. Nothing errors, and the screens just stop matching.
Fix: use values that can't parse as numbers (`"t0145"` … `"t0600"`, or `"step3"`), or write `raid_clock` only through mapping `setGlobal` (never ink). Add a stage-9 check: grep the ink for `set_global:raid_clock:`.

**F-02, major. RL §2.2 ("each revealed by a HaX mapping on `room_entered:blast_tunnel`"), RL §5 intro ("Reveals run from a HaX mapping on `game_loaded`"), OT §4.7 ("A HaX mapping on `global_variable_changed:ending` opens the closing scene"), RL item 40 ("a HaX mapping hides `kowalczyk_core`").**
Evidence: in `_handleEventMapping` (`systems/npc-manager.js`), `setVisible` calls `npcBehaviorManager.setNPCVisible(npcId, …)` and the conversation branches call `startMinigame('person-chat' | 'phone-chat', …, { npcId: npc.id … })`, where `npcId` is the NPC that owns the mapping. A mapping can set globals and complete tasks for anyone, but it can only show, hide or open a conversation for *itself*.
Problem: written as specified, HaX's mappings would show and hide HaX, and the closing scene would open HaX's phone rather than `six_oclock`'s cutscene.
Fix: put each `setVisible` on the NPC copy it moves (the tunnel copies, every forward-post branch NPC, `kowalczyk_core`, `quintero_lock`). Put the closing-scene mapping on `six_oclock` itself. It's in the start room, so it hears `ending` wherever the player is. For NPCs in later rooms, keep the README relay: HaX sets a global, and the NPC's own `room_entered:<own room>` mapping reads it. Correct OT §4.7 and RL §2.2, §5 and item 40.

**F-03, major. OT §3 row `submit_flag_3` ("flag reward `unlock_door gallery` (persisted)"); OT §0 and RL item 30 (flag reward `unlock_door` as a persisted route).**
Evidence: `games_controller.rb:2152, 2159, 2166` merge `'room_id' => room_id` (the *station's* room) over the reward hash, and `process_door_unlock_reward` takes `reward['room_id'] || reward['target_room']` (`:2232`), so the station's room wins. The client copy does the same (`systems/apply-actions.js:78-87`). The only scenario that uses the reward (`scenarios/secgen_vm_lab/scenario.json.erb:91-93`, `target_room`) would unlock the station's own room. Separately, the OT §3 row contradicts OT §4.4 and RL §2.6, which give flag 3 `set_global flag3_submitted`, and its edge case "the gallery opens on flag 3 alone" (OT §3) contradicts §4.4's condition (flag 3 **and** the shutter).
Problem: if stage 9 builds from the §3 row, the gallery opens without the cut (aim 3 is skipped). Even then, the engine would unlock `server_hall` rather than the gallery. The claim that this reward is a working persisted route is wrong.
Fix: rewrite the row as `set_global flag3_submitted` (as §4.4 has it) and drop the `objective_task_completed` bridge, which is no longer needed. Fix the edge-case line to "the gallery opens on flag 3 and the cut, in either order". Strike the flag-reward route from OT §0 and RL item 30. Report the merge bug to the user as an engine item: a one-line fix that lets the reward's own `room_id`/`target_room` win.

**F-04, major. OT §2 (WREN aim `unlockCondition: { globalVariable: whodunit_live }`) and the notes under it.**
Evidence: `systems/objectives-manager.js:688-700` evaluates the condition, but aims unlock only from `checkAimCompletion` on `aimCompleted`/`aimsCompleted` (`:849-869`); no listener re-checks a `globalVariable` condition when the global changes. m05's global-gated aim pairs the condition with an explicit `unlockAim` mapping (`scenarios/m05_insider_trading/scenario.json.erb:384-386, 1103`). The server opens such an aim on reload (`game.rb:1555-1572`), so the aim would appear only after a reload.
Problem: in the first session the optional aim never shows. OT treats the `unlockAim` mapping as a fallback in case the validator complains, but it's needed every time.
Fix: keep the condition and always add a HaX mapping (`game_loaded`, condition `globalVars.whodunit_live === true`, `unlockAim: find_the_sleeper`). Also spell out how `whodunit_live` is written, since `!(a && (b || c))` can't be one condition: default `true`, plus two HaX `game_loaded` mappings that set it `false` (`globalVars.m09_sleeper_named === true && globalVars.m09_recruiter_offer === 'taken'`, and the same for `'double_crossed'`). Put both before the `unlockAim` mapping (mappings run in array order).

**F-05, major. OT §4 "the one pattern for a story door" ("Each knot sets `<door>_open` so nothing fires twice").**
Evidence: `#unlock_door` is fire-and-forget. It starts a server call and the knot carries on (`chat-helpers.js:71-91`, "Fire and forget"), so `#set_global:<door>_open:true` lands whether or not the unlock succeeds. Every catch-up mapping, including `game_loaded`, is guarded by `!<door>_open` (OT §4.1).
Problem: if the unlock fails (a network blip, a 500 or a refused NPC check), the door stays locked while its done-flag says it's open, and nothing will ever retry, even after a reload. That's a permanent soft-lock on the critical path, four times over (blast door, inner door, stair, gallery stair).
Fix: don't set `<door>_open` in the knot. Set it from a HaX mapping on `door_unlocked_by_npc` with `data.roomId === '<room>'`, which only fires after the server accepts (`npc-game-bridge.js:131-139`). Add a fourth catch-up per door: a HaX mapping on `door_unlock_failed:<room>` with the full condition, which re-runs the knot when the player tries the locked door. That also gives the "holding lines" (OT §4.1) a real trigger.

**F-06, major. OT §5 "The jam" (`hax_jammed` set on `room_entered:gallery`, cleared on `outer_lock_open`); OT §4.2 (`player_room`); RL item 33.**
Evidence: a reload always respawns at `forward_post` (`core/game.js:1687`; the saved `currentRoom` is never read client-side). `room_entered:<room>` fires on every entry (`core/rooms.js:2992-3000`).
Problem, three cases:
1. If the player walks back down from the core after the lock (a reload, or just going to look), re-entering the gallery sets `hax_jammed` again. `outer_lock_open` is already true, so its change mapping never fires and HaX stays static for the rest of the night. Her hub is dead and every `!hax_jammed` mapping is off.
2. Retreating from the gallery to the server hall before the lock leaves HaX jammed in a room where she's meant to talk.
3. A reload in the gallery puts the player back at the forward post with HaX jammed all the way up the corridor.

Fix: set `hax_jammed` on `room_entered:gallery` only when `!globalVars.outer_lock_open`. Clear it on `room_exited` with `data.roomId === 'gallery'` and on `outer_lock_open`. Add a note to OT §0 and RL §6 that a reload means walking back from the forward post, and check the core's resume (OT §4.6) and the A4/A5/A8/C3/D3/D9 reload runs against that.

**F-07, major. RL §4 ("m04's and m08's fingerprint kit (Voltage's print on the bypass, on that branch only)"); RL §2.5.**
Evidence: RL §2.5's object list has no dustable object, and RL §5 says "the print option in his ink". The `dusting` minigame exists (`minigames/dusting/`). Nothing in RL places a biometric lock or a surface to dust.
Problem: the fingerprint kit is carried all night and has no use on any branch, not even the one it's named for. This is the dangling kit the brief's cumulative-kit rule is meant to prevent.
Fix: give it one real use on every save. The outer lock's keypad is the natural one: dusting it shows the four worn keys, which cuts the cracker's search or confirms a code the player half has. It also makes a fifth way through the PIN lock that needs no person. On the escaped-Voltage branch, also put a dustable bypass panel in the power room (`m04_voltage_print_on_bypass`) that sets the print global his ink reads, instead of the print being an ink option only.

**F-08, major. RL §3 boss-key audit and capability arc; OT §4.8.**
Evidence: the table in §3 above. Every critical-path puzzle is solvable in the room it's met in, and every tool has a talk route beside it.
Problem: chain depth is 1 everywhere on a cold start, and the "asks for all of it" claim (RL §3) is really "allows all of it". The brief's "fun and educational, not hard" means this shouldn't get harder, so the fixes stay optional and add no lock.
Fix (cheap, no new lock):
(a) Have the outer lock's keypad answer a wrong code with a line naming whose code it is ("Shift code. Ask the gallery's duty guard."), so the cupboard's rota (security office, depth 2, opened by the cracker) becomes a return trip on *every* save, not just Ghost's.
(b) Move the power-room door's spare card out of the workshop: put it in the records cupboard (or a second box in the security office, opened with the pick). The no-talk route then means seeing the reader in the workshop and going back one room. The cracker or pick is spent on the critical path's quiet route, and the talk routes stay in the room.
Either change on its own is enough; both together give the mission one real hunt-and-return beat per act.

**F-09, major. OT §4.5 ("Kowalczyk's PIN cracker on the keypad, in the lock guard's sight (`los.challengeOnSight`)"); RL §2.7, `lock_guard`.**
Evidence: `systems/npc-sight-challenge.js:26-29`: "Nothing is checked while a minigame or conversation is open … a sighting that still holds when it closes fires then." The only catch inside a minigame is the lockpick's (`systems/lockpick-catch.js:6-13, 48`), and it fires only for key locks.
Problem: the cracker runs as a minigame, so the guard can't see it in progress. His challenge fires after the minigame closes, by which time the door is open. "The long way, under guard" carries no risk as specified, and the event the challenge emits isn't mapped to anything in OT or RL.
Fix: make the guard the obstacle before the keypad, not during it. His cone covers the approach to the keypad; `player_spotted:lock_guard` opens his person-chat (talk past, or he turns hostile through `#hostile`), and the player deals with him (talk, the code card, a knock-out) before the cracker. Say which mapping does this and what it sets, and add it to C2's checks.

### Minor

**F-10, minor. RL §2.3 `records_cupboard` (1, 7) and `vector_so` (2, 7); RL §2.4 `gary_consultant` "(3, 8), just inside the stair door" and `service_hatch_box` "by the east door, (8, 7)"; RL §2.6 `uplink_printer` "by the door (1, 7)".**
Evidence: the alignment run puts the security office's south door at tile x 1 on its bottom wall, the workshop's north door at tile x 1 on its top wall, the workshop's east door at row 2, and the server hall's doors at the west wall row 2 and north wall tile x 1.
Problem: the cupboard and Vector stand on the approach to the critical-path stair. Gary "just inside the stair door" is at the opposite wall from it. The hatch box isn't by the east door, and the printer isn't by any door. That's stale geography for stage 7's lines.
Fix: keep the cupboard clear of the bottom-left (put it on the west wall at rows 3–5, for example). Move Gary to about (2, 3). Move the hatch box to about (8, 3) or drop "by the east door". Re-check every "by the door" line after stage 9 renders.

**F-11, minor. RL §2.7 gallery NPC positions.**
Evidence: the gallery is 10×6 (four floor rows). Its south door is at tile x 1 (bottom) and its north door at tile x 8 (top).
Problem: `reinforcement_a` (1, 4) stands on the south door's approach, so once revealed he blocks the only retreat. `quintero_lock` and `lock_guard` share (8, 4). `clock_gallery` (8, 3) is directly under the outer lock, so the interact key may pick the panel instead of the door. Up to nine NPCs and two objects share 40 floor tiles.
Fix: spread them along x 2–7, keep tile x 1 rows 4–5 and tile x 8 row 2 clear, put the panel at (7, 2) or on the wall beside the door, and give `quintero_lock` its own tile.

**F-12, minor. OT §4.5 and RL §2.7 ("bought from Vos (`#give_item`) … then lifted from him").**
Evidence: `#give_item` gives from the speaking NPC's own `itemsHeld` (`chat-helpers.js:98-113`). There is no pickpocket mechanic.
Problem: Vos can't hand over a card that sits in `lock_guard`'s `itemsHeld`, and "lifted from him" has no mechanic behind it.
Fix: give Vos his own copy of the code card. Let "lifted" mean the knock-out drop, or a line in the lock guard's own ink after Victoria or the rota names him.

**F-13, minor. OT §4.3 tripwire.**
Problem: the cost (`tripwire_tripped`, `wren_warned`, `security_alerted`) is set only on `door_unlock_failed:security_office`. A player who uses the ladder before trying the door skips it.
Fix: set the same three globals in knot `ladder` when `tripwire_armed`.

**F-14, minor. Flag rewards `set_global flagN_submitted` (OT §3, RL §2.1, §2.6, §2.8).**
Evidence: `set_global` rewards are applied only on the client (`games_controller.rb:2197-2199`; `systems/apply-actions.js:34-43`), while the server marks the flag's rewards as claimed at once (`:2206-2209`) and they never replay. `emit_event` rewards are queued server-side in `pending_events` (`:2242-2251`).
Problem: if the tab dies between the submission and the next sync, the flag task is complete but `flagN_submitted` is lost for good, and the breach or the gallery never opens. It's rare, but it blocks the critical path.
Fix: use `emit_event` rewards (`flag_N_in`) and have a HaX mapping set the global. Or confirm that `writeGlobal`'s confirmed sync covers this and say so in RL §6.

**F-15, minor. OT §4.2 (`player_room` "a local set on every `room_entered`"; the `game_loaded` re-ring).**
Evidence: mapping `setGlobal` takes fixed values only (`_handleEventMapping`); there's no way to copy `data.roomId`. A reload spawns at the forward post (§2).
Problem: `player_room` needs one mapping per room, and after a reload it's stale. Separately, the first-ring mapping on `room_entered:security_office` has no `resume: true`, so re-entering after a reload restarts Ghost's call at `start`.
Fix: drop `player_room`. Re-ring on `game_loaded` when `security_office_entered && !ghost_call_done`, and put `resume: true` on every Ghost ring (it falls back to the knot when nothing is saved).

**F-16, minor. OT §4.5 ("`share_zero_day` becomes `released` unless `stopped`").**
Problem: that overwrites `traced`, so the core, the card and HaX's "[What went out?]" can no longer tell a traced share from a lost one.
Fix: keep `traced` as is (the screens read RELEASED by a variant on `head_start_out`), or add a `zero_day_traced` boolean before the overwrite.

**F-17, minor. OT §7 music table, row 2 (`briefing_played && !breach_open`) and other shorthand.**
Evidence: music conditions run as `new Function` with event-data keys and `globalVars` in scope (`music/scenario-music-events.js:42-49`); a bare `briefing_played` throws a ReferenceError and the entry is skipped (`:51-54`).
Fix: write every music condition with `globalVars.`.

**F-18, minor. RL §2.1/§2.6/§2.8 station `flags` lists.**
Evidence: `flags_for_vm` returns all of a VM's flags (`app/models/break_escape/mission.rb:261-267`). `flags_for_vm_slice` exists for exactly this split (`:269-280`). `find_flag_station_for_flag` returns the first station listing a flag (`games_controller.rb:2407-2415`), and wrong-station submissions are refused (`:1208-1216`). The `flags_by_vm` fallback path overlays the whole VM's list onto the station (`:2470-2478`), which renumbers flags and shifts reward indexes.
Problem: if stage 9 copies m08's `flags_for_vm` line onto each station, the gate terminal owns all four flags and the other two stations refuse everything.
Fix: say in RL §2 to use `flags_for_vm_slice('<vm>', 0, 1, …)`, `(…, 1, 2, …)` and `(…, 3, 1, …)`, with `hintOnlyFlags` as a Hash keyed by `"<vm>:flag_N"` references (needs the top-level `flags` block, `vm_flags_json`). Have stage 9 submit a flag at the wrong station once to check the hint.

**F-19, minor. OT §4 holding lines and the door signs ("BLAST DOOR. Opens on the breach call.").**
Evidence: `door_sign` is used as the room's display name (`utils/room-display-name.js:12`, `utils/lock-titles.js:10`), so a successful unlock toasts "Door unlocked: BLAST DOOR. Opens on the breach call." (`chat-helpers.js:75-77`). An RFID story door clicked with an empty cloner says "Access denied. No keycard, and nothing saved on the cloner." (`systems/unlock-system.js:524-527`), which suggests a card exists. The validator will also warn once for each of the four fake cards (`scripts/validate_scenario.rb:1655-1665`).
Fix: keep signs to names ("Blast Door", "Stair B"). Put the holding lines in HaX's `door_unlock_failed:<room>` knot (F-05). Note the four expected validator warnings for stage 9.

**F-20, minor. RL §2.1 forward post interactables.**
Problem: `gate_console` (17, 3) and `gate_terminal` (18, 3) are one tile apart and diagonal to the blast door's approach (19, 2). Netherton (7, 4) stands on the sign-out sheet's face (7, 5), and `hax_post` (5, 4) on Helena's plans (5, 5). README "Keep interactable things a tile apart, and NPCs out of the furniture" (`README_scenario_design.md` Common bugs).
Fix: move the launcher and terminal to (15, 3)/(17, 3), and the two NPCs off the readables' faces.

**F-21, minor. Ids and listings.**
Problem: OT §4.1 names a `netherton_table` holder that RL §2.1 doesn't list (Netherton is `director_netherton`). RL doesn't say which room lists `victoria_line`, `vance_phone` and `elena_phone`, and they must be in the start room to hear `flag2_submitted` (README Common bugs). Quintero and Kowalczyk have five and six copies with no shared KO state, so every later copy's reveal needs `!globalVars.<name>_ko`.
Fix: one id per holder, all phone NPCs listed in `forward_post`, and the KO guard written into RL §2's "When visible" column.

**F-22, minor. RL §2.7 (`victoria_gallery` "pistol held low on the threat branch: a sprite variant").**
Evidence: object `spriteVariants` exist (`core/rooms.js:522, 679-690`); for NPCs only portrait variants are documented (`utils/portrait-variants.js`).
Fix: use a second NPC copy for the threat branch (the m08 pair pattern), or confirm an NPC world-sprite variant exists before stage 9.

## 5. Test runs (OT §9)

The arithmetic holds: 3 + 8 + 5 + 4 + 6 + 9 = 35, matching MC §16. Option syntax checked against `tools/playtest/new-game.rb:28-56, 156-185`. `--set` parses JSON, so `'"0245"'` stores a string. A repeated `--start-room` (S-sh adds one on top of S-wk) takes the last value, and a repeated `--set` overwrites in order. `--imports=<file>` takes a JSON object. All valid.

What fails or needs changing:

1. **B, W, C and D (24 runs) start outside `forward_post`**, so HaX never loads (F-00). That covers every baseline except the A and E runs.
2. **The baselines don't set the door done-flags.** S-wk sets `ghost_call_done` but not `stair_open` or the inner door's flag, so the `game_loaded` catch-ups would pop HaX's unlock knots over the tester's first command. Once F-05 moves the done-flags, `--set` each `<door>_open=true` and `hax_jammed=false` in every baseline.
3. **W1, W2 and W4 are identical rows** ("none / –"). MC §16 gives each its own accusation path (right face to face; wrong Malhotra then recalled; wrong Quintero then Kowalczyk on the line). Copy the path into the Extra column, or the tester has nothing to tell the runs apart.
4. **C4's lock route is "Ghost's code"** (MC §16), but the run seeds `m02_completed` only (the unanswered branch) and no gift global. Seed whatever global Ghost's code route reads (`ghost_gift`, MC §3.2), or change the route.
5. **`whodunit_live=true` on S-so** opens nothing until F-04's `unlockAim` mapping exists.
6. **D-runs and `/conclude`.** The flag tasks stay open on core starts. S4-9's `--submit-flag` covers this, or the tester can submit `test:flag:N` at each station on the way (the alias resolves per station, `games_controller.rb:1166-1178, 2334-2376`). That needs the walk F-00 already asks for.
7. **Reload runs** (A4, A5, A8, C3, D3, D9) should expect the forward-post respawn (§2) and time the walk back.

## 6. What holds up

- **Layout and doors.** Eight rooms, all valid sizes (`README_scenario_design.md:1618-1639`). Every connection is single east–west or equal-width north–south. All seven pairs align from every start room tested, and nothing overlaps.
- **The story-door pattern itself** (an RFID lock with no card, opened by HaX's ink with `unlockable`) is sound. The server checks the NPC before the lock type (`game.rb:1028-1031`), so no pick, card or cracker can open it, and the unlock persists. F-05 is about the done-flag, not the route.
- **The outer lock as a PIN lock.** Every route the plan keeps goes through the engine's own persisted unlock path, and the two-mapping event (`door_unlocked` with `connectedRoom`, `door_unlocked_by_npc` with `roomId`) is right, including the walk-through guard.
- **Soft-lock nets.** Every forced-scene holder is `koImmune`. The power-room door always has the pick route, the outer lock always has the cracker, and the cut always has the by-hand phone choice, so no knock-out strands the critical path. Ghost's call can't be burnt.
- **`concludeRequires`** holds the four flag tasks only, and `close_the_night` on the closing scene's last line is the right way to make the conclusion wait on `ending`.
- **Three stations on one VM** work on the primary path, with station-qualified task ids, wrong-station refusal and `hintOnlyFlags` hints (F-18 is a build note).
- **Every Tier 1 import's room change in RL §5 can be built**, once F-02 moves the reveals onto the NPCs themselves and each `||` condition becomes one mapping per arm. None of them gates a lock, as MC rule 1.6 requires.
