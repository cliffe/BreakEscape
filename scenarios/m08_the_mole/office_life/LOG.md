# m08 The Mole: office-life build log

## What was built (the relief watch)

Plan: PLAN.md. Two night-duty officers, Julian Sallow and Agnieszka Duda, hidden until the badge audit is read, then seated at the operations floor duty desk.

| Slice | Content |
|---|---|
| 1 to 2 | Cast, seats, needs (thirst), `ops_watch` company group, `needsHome`, hostile settings (leashed) |
| 3 | Water cooler `ops_cooler` (capacity 2, `offWhen: ops_watch_upset`), mapped breaks on entering the ops floor, trouble mappings (`ops_watch_upset`, tip-off on a KO before the naming) |
| 4 | Duty-desk console (Julian's workstation, screen habit `lockChance` 0.25) with owner-away and locked text states; two decor pc twins claiming the other ops monitors |
| 5 | Officers' storyPath ink (`m08_relief_watch`), cooler pools, three once-only exchanges, arrival bark, debrief conduct beat, credits name no location |
| export | `julian_ko` and `agnieszka_ko` in `exportGlobals` (D151b, carried into m10) |

Spoken lines: SPOKEN_LINES.md. Locks, keys, PINs and VM flags are untouched; no objective reads an office-life global.

## Build review R1 fixes (branch fix/m08-ol-r1)

| Item | Result |
|---|---|
| M1 officer stays at the cooler | See "M1 diagnosis" below |
| m2 docs | Plan replaced with the relief watch plan, room tone plan kept as history, SPOKEN_LINES.md and this log added |
| m3 ERB loop | The four `global_variable_changed` trouble mappings are written out in plain JSON |
| m4 console text | Fixed description is neutral ("The duty desk's console.") so it is true in every state |
| D re-talk refusal | `julian_hub` and `agnieszka_hub` send a re-talk with trouble to the existing refusal line, with an inkjs test |
| M2 carry | Contract rows updated; see CONTRACT.md |
| m5 upset officers | Not built: needs an engine change (see below) |

## Handover

Handover (fixer R1, stopped at the context limit):

- Done and committed: m3 (mappings written out), m4 (neutral console description), D (hub refusal, ink recompiled, 4 new inkjs tests passing), m2 docs, m08 CONTRACT amendment, console away glow (item E, data only, emitter entry `julian_console` on the ops floor lighting block: warm breathing glow while away and not locked).
- Not done: live proof of M1 and the E before/after screenshots; m5 (see below); the `--office-summary` diff.
- M1 so far: code shows hostility is set only by a punch (`player-combat.js` sets every NPC in the cone hostile and emits `npc_attacked`); nothing spreads it. Live repros on games 9128 and 9131 (fresh, keyless :3092): with the pair 38 px apart a jab hit only Julian (attacked list `["julian_sallow"]`), and Agnieszka went home. So (a) is the likely cause when the pair stand about 10 px apart (the review's run). A second-user cell is chosen by `besideCell`, which varies, so spacing is not controllable from scenario data. Needs the user's call: an engine change (cone or spacing) or accept.
- m5 needs an engine change: the chatter pools have no global gate, so an upset officer who still makes trips would keep chattering. Small change (a `requireGlobal` on a chatter pool) plus tests; not built.
- Server on :3092 stopped.

## Fixer R1, part 2 (live proof, console glow, static checks)

Server: keyless on :3092 from this worktree, PID 3628509, stopped at the end. Harness: tmp/f2/attack3.js (not committed).

| Item | Result |
|---|---|
| M1 live proof | Two clean runs: only Julian attacked, Agnieszka never attacked or hostile. Detail below. |
| m3 live | Pass. A knock-out set `ops_watch_upset` true, `julian_ko` true and `nightshade_tipped_off` true; the cooler's `offWhen` is that global and no officer made a further cooler trip in 60 s. |
| m4 live | Pass. The console reads "The duty desk's console." with Julian at post and away. |
| E console glow | Original (#ffd27a, radius 54) read as a faint lamp on the desk, not as "owner away". Tuned to #ffb23c, radius 84, intensity 1 (data only). Now reads as a warm pool over the desk and a warm tint on the monitor. |
| m5 | Kept as built for this train, superseded by feat/chatter-pool-gate (upset officers keep their cooler trips once that branch lands). |
| Static | Validator 0 errors (17 warnings); 19/19 in test/js/m08-relief-watch.test.mjs. |

### M1 evidence

Method: player pre-positioned, both officers' thirst set to 5 (the sanctioned lever) to start the trip, player moved to the far side of Julian from Agnieszka (target is in feet coordinates; sprite centre is about 31 px higher), then real `playerCombat.punch('jab')` calls, aborting if Agnieszka would be inside a 35 degree, 38 px cone. `npc_attacked` listeners on both.

| Game | Positions (sprite centres) | Attacked list | Result |
|---|---|---|---|
| 9152 | Julian (567,160), Agnieszka (529,178), player (577,170); Agnieszka 48 px from player, 56 degrees off Julian's line | ["julian_sallow"] | 11 jabs, Julian KO at (557,187). Agnieszka never hostile. She left the cooler during the jabs and was seated at her desk (427,141) 4 s after the jabs ended; 60 s trace stable, atPost true. |
| 9155 | Julian (533,187), Agnieszka (553,164), player (532,210); Agnieszka 51 to 54 px away, 20 to 22 degrees off | ["julian_sallow"] | 10 jabs, Julian KO at (536,187). Agnieszka never hostile, never attacked, left the cooler within 4 s. She then stayed `returning` at (508,125) for the whole 60 s and after (see finding). |

Earlier attempts (games 9136, 9137) were invalid: the move into position took so long the officers had changed places, so the jabs hit Agnieszka. Games 9141 and 9149 produced no or one jab. These show the pair stand 27 to 38 px apart, so the cone can be kept off her with the player on the far side of Julian.

Finding (new, not an attack effect): in game 9155 Agnieszka's walk home stalled. Needs log: `return_stuck` (tries 3), `return_abandoned`, repeated `return_resumed`, at feet (508,156). `agent_vector` (an existing story NPC in the ops floor) was standing at (486,122), 22 px from her sprite at (508,125). She was neither hostile nor attacked. Not seen in 9141, 9149 or 9152 (her home path differed). It is an NPC-blocks-NPC stall on the return path, likely independent of the knock-out; the integrator should decide whether it needs a return-path fix (for example a longer abandon retry or a sidestep).

### Static checks

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 17 warnings (baseline had 4 listed; the warnings are the existing credits and wiring suggestions, none from the officers).
- `--office-summary` diffed against v1_summary_base.txt (the baseline file holds the whole validator output, not only the summary block; compared by NPC lines): 12 to 14 NPCs, the only added lines are agnieszka_duda and julian_sallow. No other NPC changed.
- `scripts/lock_key_diff.rb` against baseline_locks.json: 2 edges removed, 2 added, the rename gitlist_repository_server to field_console_kali (from e813aac01 on main): `gitlist_repository_server -> vmch_recover_gitlist_exposure` becomes `field_console_kali -> vmch_recover_gitlist_exposure`, and `server_room -> gitlist_repository_server` becomes `server_room -> field_console_kali`. Baseline not edited. Nothing else differs.
- `node test/js/m08-relief-watch.test.mjs`: 19 pass, 0 fail.

Screenshots (scratchpad m08-console): at_post.png, away_unlocked_before_tune.png, away_unlocked_tuned.png, plus crops.

## Chatter-pool gate (data half)

The two officers' `cooler` chatter pools now carry `requireGlobal {ops_watch_upset: false}`. The cooler's `offWhen` is the new `ops_watch_ko` (set with `ops_watch_upset` by the julian_ko and agnieszka_ko mappings on `agent_0x99`), so upset alone no longer switches it off. The three Julian break mappings and Agnieszka's cooler coupling test `!ops_watch_ko` instead of `!ops_watch_upset`; cooldowns unchanged. No line text changed. Live proof: LIVE_CHATTER_GATE.md (upset: trips continue, 0 spoken; KO: cooler off).

## Cooler queue cells check (fix/m08-cooler-queue, 2026-11-19)

The six validator warnings on `ops_cooler` queue cells 1 and 2 are a false positive: the object has no scenario position, so the validator reads it at 0,0. The engine puts the cells at (220,180) and (244,180) in operations_floor, walkable, clear of the doors. Live (games 10123, 10125, capacity forced to 1): Julian queued on cell 1 and used the cooler when the slot freed. No scenario change. Validator fix (skip the check when unpositioned, 17 to 11 warnings) saved as `validator-queue-skip.patch.txt`, not applied. Detail: LIVE_COOLER_QUEUE.md.

## Validator resolves the Tiled position (D174)

`scripts/validate_npc_needs.rb` now places the queue cells of an object with no scenario position from the Tiled object it claims (same claim order as rooms.js, centre at x + w/2, y - h/2, cells snapped to the 8 px grid as the engine does), so the six `ops_cooler` warnings are gone without a skip. An unresolvable claim gives an info line instead of a 0,0 guess. `validator-queue-skip.patch.txt` is superseded and was not applied.
