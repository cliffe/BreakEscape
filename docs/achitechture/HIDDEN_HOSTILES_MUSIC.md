# Hidden hostiles and the fight music

## Problem

`anyHostilesAlive` (`public/break_escape/js/music/scenario-music-events.js`) decides when the `all_hostiles_ko` music event may fire. It counted every hostile, conscious NPC, including ones a scenario had hidden with a `setVisible: false` mapping. A hidden NPC cannot attack (`npc-behavior.js`), and hostility survives a reload, so a mission that hides a conscious hostile (m03 will hide its day staff at the night turn) kept the fight music going for good.

## Rule chosen

Skip an NPC only when its recorded `setVisible` state is `false`.

- `NPCManager._npcVisibility` (npcId to bool) is written by `recordNpcVisibility`, which `setNPCVisible` calls for every mapping. It is saved by `exportNpcVisibility` (state-sync `npcVisibility`) and put back by `restoreNpcVisibility` on load, so the record survives a reload.
- New `NPCManager.isHiddenByMapping(npcId)` returns `_npcVisibility.get(npcId) === false`.
- `anyHostilesAlive` calls it and skips those NPCs. No new import, so no harness copy list changes.

Review round 1 added two more pieces so the music follows the count at the moments it changes:

- Hide: `NPCBehaviorManager.setNPCVisible(id, false)` emits `npc_hidden { npcId, wasHostile: true }` when the NPC is hostile and not KO'd (after recording the state, before any sprite work, so it also fires when the sprite does not exist yet). The `all_hostiles_ko` handler listens to `npc_hidden` as well as `npc_ko`, so hiding the last conscious hostile ends the fight with no later KO. A peaceful or KO'd NPC emits nothing.
- Reveal: `setNPCVisible(id, true)` on a hostile, not KO'd NPC that was hidden (by a mapping record, `isVisible === false`, or a hidden sprite) calls `announceRestoredHostile`, which emits `npc_hostile_state_changed { isHostile: true, restored: true }`. The fight music returns, and a mission that wants to ignore a restored announcement can test `restored`.
- Reload: `NPCBehavior`'s constructor keeps `hostile = true` and the tint for a restored hostile but skips `announceRestoredHostile` while `isHiddenByMapping` is true. It is announced when revealed instead. A hostile no mapping hid is announced as before.

Why not skip every hidden NPC: an NPC that starts hidden (`behavior.initiallyHidden`) has no record, so it keeps counting, exactly as on main. A reveal records `true`, so it counts as before; hiding it again records `false`.

## m10 check

m10 hostiles are `initiallyHidden`. Only `reinforcement_a` and `reinforcement_b` have `startHostile: true`; the rest (Arakawa, the minders, Vector, Phantom, Nightshade) turn hostile only when attacked or made hostile in play.

- The two reinforcements start hidden: since R2 M1 they are not hostile until first shown (gallery, after Victoria is trusted), so they neither cue the fight music nor count while hidden.
- The only m10 `all_hostiles_ko` entry is `spy-action` while `!hax_jammed && !outer_lock_open`. The behaviour that changes is intended: a hostile that a mapping hid again (for example Arakawa at `breach_open`) no longer holds that entry back.

## Tests

`test/js/hostiles-hidden-music.test.mjs` (real `scenario-music-events.js`, `NPCManager` and `NPCBehaviorManager.setNPCVisible`, and the real `NPCBehavior` constructor, in jsdom). Hides go through `_setupEventMappings` and a `setVisible` mapping, not `recordNpcVisibility`. Every music assertion checks the resulting playlist (`calm`), and the "keeps fighting" tests end with a KO as a positive control, so a handler that never registered cannot pass. Nineteen tests (twelve from round 1, seven from R2). Against the old source (restored from 5bfb95a5d) six of the first twelve fail (the hide-first test passes there too); the seven R2 tests are listed under R2 outcomes:

- hide first, KO second ends the fight (passes on old code too; it is the real hide-first order, kept as a guard)
- M1, KO first then hide ends the fight (fails)
- revealed hostile is announced, and counts again (fails: no announce)
- a reveal of a visible, peaceful or KO'd NPC announces nothing (fails: no announce for the hostile case)
- M2, a restored hostile hidden by a mapping is not announced on reload (fails)
- M2 then reveal announces once on the reveal (fails)
- a hidden hostile with no record is announced on its first reveal (fails; reveal branch only, M1 is covered by the R2 tests)
- pass on both, guarding other behaviour: one hostile hidden while another fights, a peaceful or KO'd hide, a hostile that starts hidden with no record, hidden state surviving export and restore, a restored hostile that is not hidden still announced.

## Live proof (keyless server, port 3093, headless, setFPS(20), fixed steps on)

Scenario `scenarios/test_hidden_hostiles` (validated, 0 errors) and `tools/playtest/hidden-hostiles-music-proof.mjs <gameId> <route>`, which exits 1 on any mismatch. Music: `game_loaded` is `noir`, a hostile turning is `threat`, `all_hostiles_ko` is `noir`. The lobby holds `fight_guard` (hostile) and a peaceful `clerk`; the day guard (hostile) is in the annex, a room loaded after the start room. Trying the vault door sets `night` (day guard hidden by its own mapping); trying the closet door sets `dawn` (day guard shown). `debugKO` knocks a guard out. Each route uses a fresh game.

Route hide-then-ko, game 6351 (9 of 9 checks pass):

| Step | Playlist |
| --- | --- |
| Annex entered, day guard hostile and visible | threat |
| Vault door tried (night): day guard hidden, hostile, conscious | threat |
| `fight_guard` KO'd | noir |
| Reload: hidden record restored, lobby loads | noir (`game_loaded`) |
| Annex loaded: hidden hostile restored, not announced | noir |
| Closet door tried (dawn): day guard revealed | threat |

Route ko-then-hide, game 6352 (4 of 4 pass): annex threat, `fight_guard` KO'd (threat stays, the day guard still fights), vault door tried: day guard hidden, playlist noir with no `npc_ko` after the hide.

Against the old source (5bfb95a5d, games 6355 and 6356) each route fails one check: the annex after the reload is `threat` (the hidden guard was re-announced), and the hide after the KO stays `threat`.

m10, game 6333 earlier (`tools/playtest/m10-opening-music-read.mjs`, read only helper, unchanged): opening playlist `noir`, no hostile NPCs, visibility record holds only `nightshade_van` and `kowalczyk_post`. The first hidden-hostile reveal in m10 (the reinforcements in the gallery) was not reached live.

## Fixed in R2: m10 reinforcements start hostile only when first shown (review M1)

`reinforcement_a` and `reinforcement_b` (`initiallyHidden`, `startHostile`) used to call `setHostile(true)` at creation, so the threat cue fired for nobody and they counted as live hostiles, which stopped `all_hostiles_ko` firing on a non-trusted route. Now the `NPCBehavior` constructor sets `_startHostileOnReveal` when `sprite.visible === false` and skips `setHostile`; `setNPCVisible` calls `setHostile(true)` after the sprite is shown, giving exactly one emit with the NPC on screen. A restored hostile on a hidden sprite is not announced at room load (guard is `sprite.visible !== false`, not the mapping record); the reveal announces it. A reload while still hidden has nothing saved, so it stays pending; a reload after the reveal restores the hostility on a visible sprite and announces it as before.

## Static check of the eight missions that use both `setVisible: false` and `all_hostiles_ko`

Method: every literal `setVisible: false` mapping in `scenarios/m02` to `m07`, `m09` and `m10` (`scenario.json.erb`; m10 has 31 literal lines, the complete list is below), matched to its NPC, and each condition read for whether it can hide an NPC that is hostile and conscious. All hostility in these missions comes from an ink `#hostile:` tag or the player punching an NPC; only m10's `reinforcement_a` and `reinforcement_b` use `startHostile`, and they start hidden, so since R2 they are not hostile and do not count until their first reveal.

The rule changes nothing unless a hostile, conscious NPC is hidden by a mapping. In that case the old code held the fight playlist until the NPC was KO'd (the bug); the new code lets the next `npc_ko` of another hostile end it. The hides below are all peaceful outcomes, so they hide a calm NPC and the music is unchanged on the normal route:

- m02 `night_security_supervisor`, lines 3123, 3129, 3143: hidden on `insider_asset_arrested` only when `!globalVars.insider_hostile`. Never hides a hostile one. No change.
- m03 `victoria_sterling`, lines 1495, 1501: hidden after `victoria_choice_made` unless `victoria_fate === 'ko'`. Her ink has no `#hostile:` tag. A punched, hostile Victoria would now stop counting once hidden; not a normal route.
- m04 `operative_cipher` 2177, 2182 (`cipher_walked`); `voltage` 2588, 2593 (`voltage_escaped`); `operative_static` 2664, 2669 (`static_left`): hidden after they walk or escape. `operative_static` is made hostile by Voltage's ink (`m04_npc_voltage.ink:367`), so if he is hostile when he leaves, the new rule ends the fight at the next KO; the old rule kept it going. That is the intended fix.
- m05 `david_torres` 2369, 2375 (`torres_called_in`); m06 `satoshi_minder` 2521, 2526 (`minder_walked`); m07 `ray_hollis` 1490, 1495 and `thomas_park` 2415, 2420 (`'talked'`), `james_mercer` 2188 (templated condition): hidden after a talked-down or walked-off outcome. Same reading as m04: no change on the peaceful route; a hostile hidden by these now stops counting.
- m09 `noor_haddad` 1303, 1304 (`noor_told`); `old_coyote` 1441, 1442 (`old_coyote_told`); `jesse_tran` 1594, 1595 (`tran_outcome === 'talked'`): hidden after being told or talked round. Only `archive_guard` has a `#hostile:` tag (`m09_archive_guard.ink:11`), and it is not among the hidden NPCs. No change.
- m10 `scenario.json.erb`: `vector_so` 2983, 2984 hides on `room_exited` of the security office, so a hostile Vector the player leaves behind stops counting (before: fight music held). `arakawa_gate` 2243, 2244 hides at `breach_open`; `arakawa_blast` 2268 hides on `officer_out === 'arakawa'`. `victoria_gallery` 3895, 3896 and `victoria_threat` 3915 hide after a `trusted`, `walked` or `talked_down` outcome (`victoria_threat` is made hostile by `m10_victoria.ink:194`). `monitor_guard` 4000 and `farah_guard` 4021 hide on talked-round outcomes. `quintero_lock` 4071 and `minder_lock` 4095 hide on a gallery entry or `quintero_enters_core`. All are hides of NPCs that are normally not hostile; where one is hostile and conscious when hidden, the new rule drops it from the count (intended).

Complete m10 hide list (31 literal lines plus the generated closing hides), read for whether the NPC can be hostile and conscious when hidden. Ink `#hostile:` targets in m10 are `lock_guard`, `victoria_threat`, the tunnel, duty, workshop, hall, monitor and farah guards, `reinforcement_a`/`b`, `static_power` and `voltage_power`; any NPC can also turn hostile when the player punches it. Of the hidden NPCs only `victoria_threat`, `monitor_guard` and `farah_guard` are ink-hostile targets, and all three hide only on talked-round or trust outcomes.

| Lines | NPC | Hides on | Reading |
| --- | --- | --- | --- |
| 2033, 2034 | `nightshade_table` | `breach_open` (change and `game_loaded`) | No `startHostile`, no ink tag; hostile only by punching. |
| 2080, 2081 | `nightshade_van` | `breach_open` (change and `game_loaded`) | Same: no `startHostile`, no ink tag; hostile only by punching. |
| 2149, 2151, 2152 | `kowalczyk_post` | `split_started`, `breach_open` | Same: no `startHostile`, no ink tag. |
| 2192, 2194 to 2196 | `quintero_post` | `split_started`, `breach_open` | Same. |
| 2216, 2217 | `arakawa_post` | `split_started` | Same. No `startHostile`, no ink tag. |
| 2243, 2244 | `arakawa_gate` | `breach_open` | Same. |
| 2268 | `arakawa_blast` | `officer_out === 'arakawa'` | Same. |
| 2395 | `voltage_van` | `breach_open` | No `startHostile`, no ink tag; hostile only by punching. |
| 2983, 2984 | `vector_so` | `room_exited` security office, `officer_out === 'vector'` | Intended: a hostile Vector left behind stops counting and the new `npc_hidden` ends the fight. |
| 3895, 3896, 3915 | `victoria_gallery`, `victoria_threat` | trusted, walked or talked-down outcomes | `victoria_threat` is ink-hostile; hidden after a talked-down outcome. |
| 4000, 4021 | `monitor_guard`, `farah_guard` | `room_entered:gallery` with a talked-round or blinded condition | Ink-hostile; hidden only on the peaceful outcomes. |
| 4071, 4095 | `quintero_lock`, `minder_lock` | `quintero_enters_core`, gallery entry with the lock open | Hostile only by punching. |
| 4249, 4251 | `tesseract` | ending conversation closed, `room_entered:core` | No `startHostile`, no ink tag; hostile only by punching. |
| 4272, 4293, 4294 | `kowalczyk_core_waiting`, `kowalczyk_core` | `wren_at_core`, `wren_stopped` | Hostile only by punching. |
| `after_end` (lines 528 to 535, used 48 times) | every NPC in the closing | `closing_done`, `game_loaded` (forward post), `room_entered:<room>` | After the mission has ended; the credits own the music. No effect on the fight playlist. |

Where one of these is hostile and conscious when hidden, the new rule drops it from the count and `npc_hidden` lets the fight end at once (intended). Nothing here needs a code change.

No mission relies on a hidden, conscious hostile keeping the fight music going, so no behaviour on a normal route changes in any of the eight. Nothing here looked affected enough to need a live run beyond the m10 opening above.

Limit of this check: it is a read of the scenario files (ERB templated conditions at m07:2188 and m10:4071, 4095 were read as written, not rendered for each variable value).

## R2 outcomes

Review: `HIDDEN_HOSTILES_MUSIC_REVIEW_R2.md` (B0, M1, m4). Tests are in `test/js/hostiles-hidden-music.test.mjs`, now 19; the five marked below failed on tip c34d74cd5 before the fix.

| Finding | Outcome |
| --- | --- |
| M1 | Fixed as described above. Tests (real `NPCBehavior` with a hidden sprite): no hostility, no cue and not counted while hidden, with `all_hostiles_ko` firing on a KO (fails before); reveal gives exactly one threat cue and counts from then on (fails before); a visible `startHostile` NPC is still hostile at creation; reload while hidden keeps it pending with no cue (fails before); reload after the reveal announces once; a restored hostile on a hidden sprite waits for the reveal (fails before). |
| m1 | `setNPCVisible` emits `npc_hidden` only if the visibility record was not already hidden (`wasRecordedHidden`, not the sprite state, so a never-shown `initiallyHidden` hostile still emits on its first hide). Test: hiding twice after a KO gives one `calm` (fails before), and hide, reveal, hide gives a second. |
| m2 | Test 1 now hides first and KOs second, and its row above says it passes on old code too. Six of the original twelve fail on 5bfb95a5d. |
| m3 | m10 table corrected: 2033 and 2034 are `nightshade_table`, 2080 and 2081 `nightshade_van` (blocks from lines 1992 and 2039 of `scenario.json.erb`). |
| m4 | The "m6 (partial)" test is retitled as the reveal branch only; M1 is covered by the real `startHostile` tests. The M2 reload tests now give the fake sprite `visible: false`, as `npc-sprites.js` does. |

Live proof, keyless server on :3093 from the worktree, `setFPS(20)` with fixed steps on, script `tools/playtest/hidden-hostiles-music-proof.mjs` (exits 1 on any failed check). `test_hidden_hostiles` gained `reserve_guard` (lobby, `initiallyHidden`, `startHostile`), a locked cellar, and a `reserve` global that the cellar door attempt sets, which reveals it.

- hide-then-ko, game 6394: 9 of 9 pass (earlier route still passes with the reserve guard in the lobby).
- ko-then-hide, game 6395: 4 of 4 pass.
- reserve, game 6396: 8 of 8 pass. Hidden at start: not hostile, sprite hidden. Lobby guard KO'd with the reserve guard hidden: `noir` (`all_hostiles_ko` fires). Reload while hidden: not hostile, still `noir`. Cellar door: hostile, exactly one `npc_hostile_state_changed` for `reserve_guard`, music `threat`.

## Known differences (R4 m2)

A restored hostile on a hidden sprite is recorded hidden (`recordNpcVisibility(id, false)` in the `NPCBehavior` constructor), so it neither counts in `anyHostilesAlive` nor cues the music until a reveal announces it. The same NPC, made hostile by ink while it was hidden and not reloaded, has no visibility record and does count. The two cases differ across a reload on purpose: making them match would mean either hiding every hidden hostile from the count (this breaks the tested rule that a never-touched `initiallyHidden` hostile counts) or recording visibility at every ink turn (wider than this fix). Nothing but `setNPCVisible` reveals a hidden sprite, so the restored case cannot stay stuck.

The restore path also adds one permanent `npcVisibility` key for that NPC to the synced state (one boolean, written once, never removed).

