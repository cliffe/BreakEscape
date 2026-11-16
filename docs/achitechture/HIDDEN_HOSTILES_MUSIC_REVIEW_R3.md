# Hidden hostiles and the fight music: review round 3

Branch `build/ol-hidden-hostiles` at 78962d36e. Scope: 09bd64e61, 05188f0f6, 7c57f11fb, 0e15f80b9, 78962d36e (everything after c34d74cd5), and a fresh read of `git diff main...HEAD`.

**Blocking 0, major 0, minor 7.**

The R2 fixes do what the "R2 outcomes" table says. A hidden `startHostile` NPC is not hostile, gives no cue and does not count until its first reveal, which gives exactly one `npc_hostile_state_changed`. The repeat-hide guard works. I ran the test file on HEAD (19 of 19 pass) and against the engine source at c34d74cd5 (git archive of `public/break_escape/js` into a scratch copy, same test file): 5 fail, tests 13, 14, 15, 17 and 19, which are the five the doc marks "fails before". The findings below are latent edge cases, test and proof gaps, and stale docs. None changes a normal route in m10 or any other mission.

## Minor

### m1. A calm set while the NPC is hidden is lost on a reload

`setHostile(false)` on a pending NPC clears `_startHostileOnReveal` (`public/break_escape/js/systems/npc-behavior.js:3468`) and returns at once, because `this.hostile` is already false (3469). Nothing is recorded in the hostility save. After a reload the constructor finds no restored entry (582) and sets the flag again from config (596-600), so the next reveal turns the NPC hostile. In the same session it would have stayed calm.

Not reachable in shipped content: person-chat's `#hostile:false` acts on the conversation's own NPC (`minigames/person-chat/person-chat-conversation.js:590-596`), which a hidden NPC cannot be, and the shared tag processor only ever sets hostile true (`minigames/helpers/chat-helpers.js:301-315`). Fix if it matters later: when `setHostile(false)` clears a pending flag, record the calm through `npcHostileSystem.setNPCHostile(id, false)` so it is saved, or note the limit in the doc.

### m2. The reveal turns a KO'd pending NPC hostile

`npc-behavior.js:433-436` calls `setHostile(true)` without checking KO. A hidden NPC cannot be punched (`systems/player-combat.js:427-428` skips invisible sprites), so the only route in is `debugKO` (`systems/test-bridge/index.js:1727-1742`). That route makes it hostile first, so on reveal the hostile system emits nothing new. The behaviour still tints the KO'd body red and emits `npc_hostile_changed`. Guard: `if (visible && behavior._startHostileOnReveal && !window.npcHostileSystem?.isNPCKO?.(npcId))`, and clear the flag either way.

### m3. A restored hidden hostile with no visibility record is counted but not announced

The constructor now skips the announce whenever the sprite is hidden (`npc-behavior.js:591`), but `anyHostilesAlive` still counts a hidden NPC with no mapping record (`music/scenario-music-events.js:172`). After a reload such an NPC gets no fight music yet holds back `all_hostiles_ko` until it is revealed or KO'd. Before the reload it was announced and counted, so the two disagree.

It needs an `initiallyHidden` NPC made hostile by ink (`#hostile:<id>` from another NPC's conversation, which goes straight to the hostile system and leaves the behaviour's flag set) before its first reveal. That does not happen in m10: the `reinforcement` knot (`m10_guards.ink:209-211`) can only be opened on a visible reinforcement, and both are revealed by the same mapping; `#hostile:static_power` (`m10_voltage.ink:281`) runs under the same condition that reveals Static on entering the power room. The R2 review recommended this guard (step 3), so this is a cost of that choice, not a slip in the fix. Either leave it and add one sentence to the doc's "Why not skip every hidden NPC" paragraph, or make `isHiddenByMapping` treat a hidden sprite as hidden too (wider change, needs its own tests).

### m4. The reserve route's KO check cannot fail on the old code

`tools/playtest/hidden-hostiles-music-proof.mjs:93` expects `noir` after the lobby guard's KO. `noir` is also the `game_loaded` playlist (`scenarios/test_hidden_hostiles/scenario.json.erb:15-16`), and the start playlist is recorded but not judged (proof line 76), so if the threat cue lands before `game_loaded` the music is `noir` before the KO as well. The check passes whether or not `all_hostiles_ko` fired. The route still proves the fix through the `hostile: false` checks at lines 89 and 97, which do fail on the old code. Fix: before the KO, assert the playlist is `threat`, or count `switchPlaylist` calls across the KO and expect one.

### m5. The test scenario's dungeon graph is stale

`scenarios/test_hidden_hostiles/dungeon_graph.html`, `.json` and `.md` were not regenerated after 7c57f11fb and have no cellar room or cellar lock. Running `scripts/validate_scenario.rb` on the scenario gives 0 errors, 7 warnings and rewrites all three (70 lines changed). I reverted the regenerated files; regenerate and commit them on the branch.

### m6. Two stale lines in the docs

- `docs/achitechture/HIDDEN_HOSTILES_MUSIC.md:70` still says the reinforcements "start hidden with no record, so they count as before". Since R2 M1 they are not hostile while hidden and do not count. Lines 22 and 61 already say so.
- `scenarios/test_hidden_hostiles/scenario.json.erb:4`, brief step 5, says "calm music" after the KO; the scenario's `all_hostiles_ko` plays `noir` (line 27).

### m7. Two test gaps

`test/js/hostiles-hidden-music.test.mjs` has no test for:

- A second reveal of an already revealed `startHostile` NPC (m10's `room_entered:gallery` reveal at `scenarios/m10_full_disclosure/scenario.json.erb:4043` fires on every gallery entry). By reading the code it gives no cue: the flag is false and `wasHidden` is false (`npc-behavior.js:388-390`).
- Ink making a pending NPC hostile while hidden, then a reveal. By reading the code it gives one cue: `announceRestoredHostile` (409) emits, then `setHostile(true)` (435) finds the hostile system already hostile and emits no second `npc_hostile_state_changed`.

Both are cheap to add with the existing `startHostileBehavior` and `mapReveal` helpers.

## Answers to the brief

1. **`_startHostileOnReveal` across a reload.** It is not saved; it is a behaviour field re-derived in the constructor. That is correct on every reachable path. Before the reveal nothing was recorded, so the constructor sets it again from config. After the reveal `setHostile(true)` recorded the hostility (`npc-hostile.js:247`), so the restored branch runs (583) and the flag is never set. A reveal while the room is not loaded records `isVisible: true`, so the sprite is made visible and the constructor turns the NPC hostile at once, on screen.
   - **Fire twice:** no. The flag is cleared before `setHostile` (434) and by `setHostile` itself (3468). A later reveal sees it false, and `wasHidden` is false, so neither the flag nor the announce fires.
   - **KO'd while hidden:** not reachable in play (player-combat.js:427-428). Through `debugKO` it tints the body and emits `npc_hostile_changed` (m2).
   - **Ink while hidden:** ink `#hostile:<id>` goes to the hostile system and leaves the flag set; the reveal gives one cue (m7 second point). After a reload the hostility is restored, the sprite is hidden, so no announce, and the reveal announces once. A calm set while hidden does not survive a reload (m1); not reachable today.
2. **sprite.visible against the mapping record.** The only places an NPC sprite's `visible` is set are `npc-sprites.js:224` (KO with no death animation), `230` (`isVisible === false`, from a record), `239` (`initiallyHidden`) and `npc-behavior.js:426` (`setNPCVisible`). Room reveal, lighting, behind-wall fade and seating touch layers, objects, caps, chairs and the player, not NPC sprites (searched). A room that is not loaded has no sprite and no behaviour, so the constructor does not run. A fade works on alpha, not `visible`. So no announce is lost to a cutscene, a fade or an unloaded room. The KO case is the restored KO branch, which never announces anyway. The one real divergence is m3. Pre-existing and outside this branch: a start-room NPC revealed in the window before the behaviour manager loads (`core/game.js:2054-2062`) keeps a hidden sprite, because `setNPCVisible` returns early with no behaviour (`npc-behavior.js:415-424`). With this branch such an NPC also stays not hostile, which matches what the player sees.
3. **m10 reinforcements, by route** (`scenario.json.erb:4025-4045`, `m10_guards.ink:209-211`):
   - Victoria trusted, Zero Day share not stopped, Nightshade not taken in: revealed 1.5 s after her conversation closes (4042). One `npc_hostile_state_changed` with them on screen. The `threat` entry (1356) is held back by `hax_jammed`, which is set on entering the gallery (1690), so the gallery stays `silence`; the jam clears when the player leaves (1692) and from then on they count. That is the mission's own music design, not a branch issue. Re-entries re-run 4043 with no second cue.
   - Trusted but Nightshade taken in, or any other Victoria outcome: never revealed, never hostile, never counted. `all_hostiles_ko` (1357) can fire again on these routes, which was R2 M1.
   - Reload before the reveal: nothing saved, still pending. Reload after: hostility restored on a visible sprite and announced at gallery load, as before this branch.
   - Closing: the gallery `after_end` hides (4041) hide a revealed, conscious reinforcement once, emitting `npc_hidden`; the ending owns the music there (R2).
4. **Tests and scenario.** The tests are real: a real `NPCBehavior` constructor, the real `setNPCVisible`, the real `NPCManager` mapping path and the real music module, with playlist assertions and positive controls. Results above (19 of 19 on HEAD, 5 fail on c34d74cd5, matching the doc). The proof's reserve route has one check that cannot fail (m4). The only scenario touched by the whole branch is `scenarios/test_hidden_hostiles/` (plus its `mission.json` and graphs); no mission scenario changed.
5. **player_state.** No growth. `_startHostileOnReveal` is a behaviour field, never exported. The branch adds no state-sync section and does not touch `state-sync.js`. `npcVisibility` and `npcHostility` are keyed sections sent as deltas, and the branch writes the same keys as main. The hostility save now holds fewer entries, since hidden reinforcements are no longer recorded at creation.

## Checked and fine

- R2 m1: `wasRecordedHidden` is read before `recordNpcVisibility` (387, 396), and only the hide branch uses it (407). A never-shown `initiallyHidden` hostile still emits on its first hide.
- The order in `setNPCVisible` on a first reveal of a pending NPC: the announce branch is skipped because the hostile system says not hostile (402), then the sprite is shown (426-430), then `setHostile(true)` (433-436). One emit, sprite visible, and the health bar follows the sprite (`ui/npc-health-bars.js:87, 216`).
- The visible `startHostile` path is unchanged (`npc-behavior.js:601-602`), so `test_needs_attack` and the lobby guard in `test_hidden_hostiles` behave as on main.
- No new static import, so no harness copy list changes.
- `scripts/validate_office_life.rb:62` exclusion unchanged since R2.

## R3 outcomes

Merged main (11fae1a6d) first. Tests were written first; four of the new ones failed before the code change (the two m7 tests passed at once, as the review predicted, and now guard the behaviour).

| Minor | Choice | What changed |
|---|---|---|
| m1 calm lost on reload | Guard + test | `setHostile(false)` on a pending NPC calls the new `npcHostileSystem.recordCalm(id)` (`npc-hostile.js`), which saves `{ hostile: false, ko: false }` with no event and never overwrites an existing record. The reload then takes the restored branch and the flag is not set again. |
| m2 reveal of a KO'd pending NPC | Guard + test | `setNPCVisible` clears `_startHostileOnReveal` either way and only calls `setHostile(true)` when the hostile system says the NPC is not KO'd. |
| m3 restored hidden hostile counted but not announced | Guard + test | The constructor records such an NPC as hidden (`recordNpcVisibility(id, false)`), so it neither counts nor cues until the reveal, which announces it. Chosen over making `anyHostilesAlive` skip every hidden sprite: that would change the tested rule that a never-touched `initiallyHidden` hostile still counts. |
| m4 proof KO check | Fixed | The reserve route wraps `switchPlaylist` before the KO and expects exactly `['noir']` across it, so it fails if `all_hostiles_ko` does not fire. The playlist check stays as a second line. |
| m5 stale graph | Fixed | Validator run on `test_hidden_hostiles` (0 errors, 7 warnings); the three `dungeon_graph` files are committed. |
| m6 stale text | Fixed | `HIDDEN_HOSTILES_MUSIC.md` line 70 and the scenario brief step 5 ("noir music"). |
| m7 test gaps | Tests | A second reveal gives no second cue; ink making a hidden pending NPC hostile then a reveal gives one announce and no second `npc_hostile_state_changed`. |

No doc notes were needed; every minor got a guard or a test.

Live (keyless server on :3093, `setFPS(20)`, fixed steps on, games 6411, 6412 and 6413 from new-game.rb): hide-then-ko, ko-then-hide and reserve all passed with 0 failed checks. The server was stopped afterwards.

Suites: `bin/test-js` and `bin/rails test` (3014 runs, 0 failures, 0 errors, 3 skips); `bin/test-js` 720 files passed, 0 failed (the two suites overlapped in time because test-js ran past the foreground limit).
