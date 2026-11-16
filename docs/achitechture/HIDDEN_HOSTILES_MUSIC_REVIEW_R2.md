# Hidden hostiles and the fight music: review round 2

Branch `build/ol-hidden-hostiles` at ca3e8ba85. Scope: 0c04a124d, 17687d3ac, ca3e8ba85, and a fresh read of `git diff main...HEAD`.

**Blocking 0, major 1, minor 4.**

The R1 fixes do what the outcomes table says. The hide emits once per real hide, the music handler re-checks on it, a reload no longer announces a hostile a mapping hid, and a reveal announces it again. The tests are real: run against the source at 5bfb95a5d, seven of twelve fail, as the doc says (checked here, see the end). The one major is R1 m6, still open. It is the same class of bug this branch fixes, the fix is small, and I recommend doing it on this branch.

## Major

### M1. (R1 m6, open) Hidden startHostile reinforcements turn hostile at creation and count as live hostiles until revealed

Code path: `NPCBehavior` constructor, `public/break_escape/js/systems/npc-behavior.js:584-586`, `else if (this.config.hostile.startHostile) this.setHostile(true);`. That goes to `setHostile` (line 3450), then `npcHostileSystem.setNPCHostile` (`npc-hostile.js:226-260`), which records the hostility for the save and emits `npc_hostile_state_changed { isHostile: true }` (line 254). Nothing checks whether the sprite is hidden. In m10 `reinforcement_a` and `reinforcement_b` (`scenarios/m10_full_disclosure/scenario.json.erb:4025-4045`) are `initiallyHidden` with `startHostile`, and they are revealed only on the `trusted` route (4042, 4043).

Effects, from reading the code (not run live):

- When the gallery loads, the threat entry (m10:1356, `!hax_jammed && !outer_lock_open`) fires for two NPCs nobody can see. Behaviours are made at room load, before `room_entered:gallery`. On a first visit this is probably masked at once by the gallery's own `room_entered:gallery` entry to `silence` (m10:1358).
- The lasting harm is the count. The reinforcements are hostile and have no visibility record, so `isHiddenByMapping` is false and `anyHostilesAlive` (`scenario-music-events.js:172`) counts them. From the gallery's load until `outer_lock_open`, on every route where Victoria is not trusted, `all_hostiles_ko` (m10:1357) can never fire. Any fight in that window (`hax_jammed` is cleared again on leaving the gallery, m10:1692) keeps `threat` until some other trigger replaces it. This branch exists to stop exactly that ("a hidden NPC cannot attack, so it cannot keep a fight going", `scenario-music-events.js:160-161`).
- After a reload their hostility comes back from the save (it was recorded at creation). The restored path skips the announce only when `isHiddenByMapping` is true (`npc-behavior.js:579`). These two have no record, so they are announced again at room load.

Small fix (about ten lines, low risk; only these two NPCs in the campaign use `startHostile` together with `initiallyHidden`; `test_needs_attack` and `test_hidden_hostiles` use visible ones):

1. Constructor, line 584: if `this.sprite.visible === false` (npc-sprites.js:229-245 has already hidden it for a mapping record or `initiallyHidden`), set `this._startHostileOnReveal = true` and do not call `setHostile`. Otherwise keep the current call.
2. `setNPCVisible`, after the sprite is shown (after line 424): `if (visible && behavior._startHostileOnReveal) { behavior._startHostileOnReveal = false; behavior.setHostile(true); }`. The reveal block at 400-407 sees the NPC as not hostile yet, so it does not announce, and `setHostile` emits exactly once, with the NPC on screen. If ink made it hostile while hidden, `setHostile(true)` is a no-op and the existing reveal announce covers it.
3. Line 579: guard on `this.sprite?.visible === false` instead of `isHiddenByMapping`. That covers a mapping-hidden NPC as now, and also a restored hidden `initiallyHidden` hostile. The reveal path already treats a hidden sprite as `wasHidden` (line 389), so the announce follows on reveal.

Gain: no early threat cue, the reinforcements do not count while hidden, so `all_hostiles_ko` works on the non-trusted route, and no hostility is saved for NPCs the player never saw (a slightly smaller `npcHostility`). The orchestrator's suggested variant (keep them hostile, guard only the emit and announce on reveal) fixes the cue but not the count, because hidden NPCs with no record still count. Deferring the hostility itself is the better option. Tests: a real `NPCBehavior` with a hidden sprite and `startHostile` emits nothing and is not counted; a reveal emits once and counts; both fail on the current code. Then one live read in `test_hidden_hostiles` with an `initiallyHidden` `startHostile` guard. A seeded m10 save at the gallery door would then be optional.

The doc's own section on this (`HIDDEN_HOSTILES_MUSIC.md`, "Open: m10 reinforcements") describes the problem correctly, but it does not mention the reload re-announce in the third point above.

## Minor

### m1. A hide of an already-hidden hostile emits `npc_hidden` again, so `all_hostiles_ko` can fire with no fight on

`npc-behavior.js:400-404` emits whenever the NPC is hostile and not KO'd, whether or not it was already hidden. `wasHidden` (387-389) is only used on the reveal branch. To the question asked: it cannot fire while a visible hostile is standing, because `anyHostilesAlive` still counts every visible, recorded-visible or unrecorded hostile, and the only reveal path is `setNPCVisible` (searched). But it can fire again when nothing changed:

- Reload: a `game_loaded` hide re-runs for a start-room NPC whose hostility was restored before registration (`npc-hostile.js:161-191` sets `isHostile` at once). Example: m10 `nightshade_table` 2034 and `nightshade_van` 2081 (`breach_open`), if the player punched Nightshade. `npc_hidden` is emitted at load and `all_hostiles_ko` switches to `spy-action` when no fight has ended. In m10 the `game_loaded` entry for `breach_open` is also `spy-action` (m10:1325), so this case is harmless there. In a mission whose `all_hostiles_ko` playlist differs from its load mood, the result depends on which listener runs first.
- `room_entered` hides that fire on every entry (m10 `monitor_guard` 4000, `farah_guard` 4021, the `after_end` `room_entered` hides; the last are covered by `_endingOwnsMusic`).

On main, `all_hostiles_ko` only re-fired on an `npc_ko`, so this is a new way to fire it, though a narrow one. Fix: capture `const wasRecordedHidden = window.npcManager?.isHiddenByMapping?.(npcId) === true` before `recordNpcVisibility` (line 395) and emit only when it is false. Do not use `wasHidden`: a never-shown `initiallyHidden` hostile has a hidden sprite but still counts, so its first hide must emit. Add a unit test that hides `b` twice after KO'ing `a` and expects `['calm']` once. That test fails now.

### m2. Test 1 is mislabelled and duplicates test 2

`test/js/hostiles-hidden-music.test.mjs:72` is titled "hide first, KO second", but its body KOs `a` (line 74) and then hides `b` (line 76). That is the M1 order and the same as test 2 (line 80). The real hide-first order is test 3 (line 89). The doc repeats the label and says it fails on old code because of the handler change (`HIDDEN_HOSTILES_MUSIC.md:34`). That is true only because the test is really the KO-first case. Fix: delete test 1 or rename it, and correct the doc line. The count of tests that fail on old code then drops to six, and the doc should say so.

### m3. The m10 hide table names the wrong NPC for four lines

`HIDDEN_HOSTILES_MUSIC.md:85` lists 2033, 2034, 2080 and 2081 as `alarm_override`. They belong to `nightshade_table` (block from m10:1992) and `nightshade_van` (block from m10:2039); `alarm_override` is an item inside the Nightshade block. The reading ("hostile only by punching") probably still holds for Nightshade, but the row should name him. Nightshade is also the m1 example above. I checked the other rows by block indentation and they match: `kowalczyk_post` 2149, `quintero_post` 2192, `arakawa_post` 2216, `arakawa_gate` 2243, `arakawa_blast` 2268, `voltage_van` 2395, `vector_so` 2983, `victoria_gallery` 3895, `victoria_threat` 3915, `monitor_guard` 4000, `farah_guard` 4021, `quintero_lock` 4071, `minder_lock` 4095, `tesseract` 4249, `kowalczyk_core_waiting` 4272 and `kowalczyk_core` 4293.

### m4. The doc and the outcomes table overstate what the reveal covers for m6

`HIDDEN_HOSTILES_MUSIC_REVIEW_R1.md` (R1 outcomes, m6 row) and the "m6 (partial)" test (`hostiles-hidden-music.test.mjs:179-185`) show a reveal of an unrecorded hidden hostile announcing once. In play, the reinforcements' creation emit has already fired, so that reveal is a second emit. The test stubs hostility and never builds the behaviour, so it does not run the `startHostile` path at all. It is fine as a guard for the reveal branch, but it should not be read as partial cover for M1. Retitle it, for example "a hidden hostile with no record is announced on its first reveal", and leave M1 open in the doc until the fix lands.

## Answers to the brief

1. M1, double fire: no fire while a visible hostile stands. A repeated hide re-fires `all_hostiles_ko` with no fight on (m1 above). A hide followed by a KO of the same hidden NPC is not reachable in normal play (body disabled, line 421). Any re-fire on a later `npc_ko` already happens on main.
2. M2: correct after a reload for an NPC a mapping hid. The reveal after the reload announces exactly once (`wasHidden` from the restored record, line 387; unit test at line 170; live game 6351 per the doc). A reveal before the NPC's behaviour exists could double-announce, but NPC mappings only register when the NPC's room loads (`npc-lazy-loader.js:103`, and the m10 `after_end` comment at m10:531), so that window is effectively closed. The gap is the unrecorded hidden hostile in M1's third point.
3. m1: yes. A reveal of a hidden, hostile, conscious NPC calls `announceRestoredHostile` (line 405), the threat entry fires, and the health bar is made hidden and then follows the sprite's visibility each frame (`ui/npc-health-bars.js:87, 216`), so it appears with the NPC. Side effect worth knowing: the announce also fires `npc_hostile_state_changed` eventMappings with `restored: true` (for example m10:1802, 1803 `power_fight_on`). Those are idempotent `setGlobal` calls, so no harm.
4. Validator: narrow. `npc_hidden` matches no `OFFICE_LIFE_EVENT_PREFIXES` entry anyway. The exclusion (`scripts/validate_office_life.rb:62`) matches only the exact name or `npc_hidden:` (line 81), and it is there so the literal collector in `test/js/validator-office-life-events.test.mjs` accepts the new emit. That test passes (3 of 3).
5. m6: see M1. Major, open; a small fix exists and is described above.
6. player_state: no new synced field. `npcVisibility` is a keyed section (`state-sync.js:43`), so it goes as deltas, and the branch writes the same keys as before. `npc_hidden` is not recorded anywhere. The M1 fix would save slightly less (no hostility for never-seen NPCs).
7. Tests: real. They use the real `NPCManager` mapping path, the real `setNPCVisible`, the real `NPCBehavior` constructor and the real music module, with playlist assertions and KO positive controls. I ran them against the source at 5bfb95a5d (git archive of `public/break_escape/js` into a scratch copy): 7 fail (tests 1, 2, 5, 6, 9, 11, 12) and 5 pass, as the doc states. On HEAD 12 of 12 pass. Gaps: test 1 duplicates test 2 (m2); there is no test for a repeated hide (m1) and none that builds a `startHostile` behaviour with a hidden sprite (M1).

## Checked and fine

- `isHiddenByMapping` (`npc-manager.js:2219-2221`) still has one music caller (`scenario-music-events.js:172`), plus the two new behaviour callers (`npc-behavior.js:387, 579`).
- The `npc_hidden` listener has a matching `off` in `_cleanupFns` (`scenario-music-events.js:431-432`).
- `npc_hidden` is emitted after the record is written (line 395, then 403), so the handler already sees the NPC as not counted. It is emitted before the sprite work and the no-sprite early return, so it also fires for a hide before the sprite exists.
- The proof script judges every step and exits 1 on a mismatch (`tools/playtest/hidden-hostiles-music-proof.mjs:22, 111`).
- No new static import, so no changes to the harness copy lists.
