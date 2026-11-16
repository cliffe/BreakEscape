# Hidden hostiles and the fight music

## Problem

`anyHostilesAlive` (`public/break_escape/js/music/scenario-music-events.js`) decides when the `all_hostiles_ko` music event may fire. It counted every hostile, conscious NPC, including ones a scenario had hidden with a `setVisible: false` mapping. A hidden NPC cannot attack (`npc-behavior.js`), and hostility survives a reload, so a mission that hides a conscious hostile (m03 will hide its day staff at the night turn) kept the fight music going for good.

## Rule chosen

Skip an NPC only when its recorded `setVisible` state is `false`.

- `NPCManager._npcVisibility` (npcId to bool) is written by `recordNpcVisibility`, which `setNPCVisible` calls for every mapping. It is saved by `exportNpcVisibility` (state-sync `npcVisibility`) and put back by `restoreNpcVisibility` on load, so the record survives a reload.
- New `NPCManager.isHiddenByMapping(npcId)` returns `_npcVisibility.get(npcId) === false`.
- `anyHostilesAlive` calls it and skips those NPCs. No new import, so no harness copy list changes.

Why not skip every hidden NPC: an NPC that starts hidden (`behavior.initiallyHidden`) has no record, so it keeps counting, exactly as on main. A reveal records `true`, so it counts as before; hiding it again records `false`.

## m10 check

m10 hostiles are `initiallyHidden`. Only `reinforcement_a` and `reinforcement_b` have `startHostile: true`; the rest (Arakawa, the minders, Vector, Phantom, Nightshade) turn hostile only when attacked or made hostile in play.

- The two reinforcements start hidden with no record, so they still count until revealed (gallery, after Victoria is trusted). Unchanged.
- The only m10 `all_hostiles_ko` entry is `spy-action` while `!hax_jammed && !outer_lock_open`. The behaviour that changes is intended: a hostile that a mapping hid again (for example Arakawa at `breach_open`) no longer holds that entry back.

## Tests

`test/js/hostiles-hidden-music.test.mjs` (real `scenario-music-events.js` and `NPCManager` methods in jsdom). Against the old source, two of the four fail:

- a hostile hidden by `setVisible: false` no longer holds the fight music (fails on old code)
- the hidden state after export, restore on a fresh manager (reload) (fails on old code)
- a hostile revealed again counts again (passes on both, guards the new rule)
- a hostile that starts hidden with no record still counts (passes on both, guards the old behaviour)

## Live proof (keyless server, port 3093, headless, setFPS(20))

Scenario `scenarios/test_hidden_hostiles` (validated, 0 errors) and `tools/playtest/hidden-hostiles-music-proof.mjs`. Two guards start hostile, music `threat`. Trying the vault door (real door path) sets `night`, whose own mapping hides the day guard. `debugKO` (combat not played) knocks out the other guard.

Fresh game 6332:

| Step | Playlist | Day guard |
| --- | --- | --- |
| Start | threat | hostile, visible |
| After the vault door attempt (night true) | threat | hostile, conscious, hidden, `hiddenByMapping` true |
| After the other guard is KO'd | noir (fight ended) | still hostile, conscious, hidden |
| After a reload | | still `hiddenByMapping` true, sprite hidden |

Control, game 6331 (before the door attempt, which the title screen blocked): KO of one guard with the other visible left the playlist on `threat`.

m10, fresh game 6333 (`tools/playtest/m10-opening-music-read.mjs`, read only): opening playlist `noir`, no hostile NPCs, visibility record holds only `nightshade_van` and `kowalczyk_post`, so the opening is untouched by the change. The first hidden-hostile reveal (the reinforcements in the gallery) was not reached live: it needs the earlier stages of the mission played through real paths, which I did not drive. It rests on the unit tests and the analysis above.

## Static check of the eight missions that use both `setVisible: false` and `all_hostiles_ko`

Method: every `setVisible: false` mapping in `scenarios/m02` to `m07`, `m09` and `m10` (`scenario.json.erb`), matched to its NPC, and each condition read for whether it can hide an NPC that is hostile and conscious. All hostility in these missions comes from an ink `#hostile:` tag or the player punching an NPC; only m10's `reinforcement_a` and `reinforcement_b` use `startHostile`, and they start hidden with no record, so they count as before.

The rule changes nothing unless a hostile, conscious NPC is hidden by a mapping. In that case the old code held the fight playlist until the NPC was KO'd (the bug); the new code lets the next `npc_ko` of another hostile end it. The hides below are all peaceful outcomes, so they hide a calm NPC and the music is unchanged on the normal route:

- m02 `night_security_supervisor`, lines 3123, 3129, 3143: hidden on `insider_asset_arrested` only when `!globalVars.insider_hostile`. Never hides a hostile one. No change.
- m03 `victoria_sterling`, lines 1495, 1501: hidden after `victoria_choice_made` unless `victoria_fate === 'ko'`. Her ink has no `#hostile:` tag. A punched, hostile Victoria would now stop counting once hidden; not a normal route.
- m04 `operative_cipher` 2177, 2182 (`cipher_walked`); `voltage` 2588, 2593 (`voltage_escaped`); `operative_static` 2664, 2669 (`static_left`): hidden after they walk or escape. `operative_static` is made hostile by Voltage's ink (`m04_npc_voltage.ink:367`), so if he is hostile when he leaves, the new rule ends the fight at the next KO; the old rule kept it going. That is the intended fix.
- m05 `david_torres` 2369, 2375 (`torres_called_in`); m06 `satoshi_minder` 2521, 2526 (`minder_walked`); m07 `ray_hollis` 1490, 1495 and `thomas_park` 2415, 2420 (`'talked'`), `james_mercer` 2188 (templated condition): hidden after a talked-down or walked-off outcome. Same reading as m04: no change on the peaceful route; a hostile hidden by these now stops counting.
- m09 `noor_haddad` 1303, 1304 (`noor_told`); `old_coyote` 1441, 1442 (`old_coyote_told`); `jesse_tran` 1594, 1595 (`tran_outcome === 'talked'`): hidden after being told or talked round. Only `archive_guard` has a `#hostile:` tag (`m09_archive_guard.ink:11`), and it is not among the hidden NPCs. No change.
- m10 `scenario.json.erb`: `vector_so` 2983, 2984 hides on `room_exited` of the security office, so a hostile Vector the player leaves behind stops counting (before: fight music held). `arakawa_gate` 2243, 2244 and `arakawa_blast` 2268 hide at `breach_open`. `victoria_gallery` 3895, 3896 and `victoria_threat` 3915 hide after a `trusted`, `walked` or `talked_down` outcome (`victoria_threat` is made hostile by `m10_victoria.ink:194`). `monitor_guard` 4000 and `farah_guard` 4021 hide on talked-round outcomes. `quintero_lock` 4071 and `minder_lock` 4095 hide on a gallery entry or `quintero_enters_core`. All are hides of NPCs that are normally not hostile; where one is hostile and conscious when hidden, the new rule drops it from the count (intended).

No mission relies on a hidden, conscious hostile keeping the fight music going, so no behaviour on a normal route changes in any of the eight. Nothing here looked affected enough to need a live run beyond the m10 opening above.

Limit of this check: it is a read of the scenario files (ERB templated conditions at m07:2188 and m10:4071, 4095 were read as written, not rendered for each variable value).
