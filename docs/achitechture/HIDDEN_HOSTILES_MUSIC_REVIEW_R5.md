# Hidden hostiles and fight music: review round 5 (final delta)

Branch `build/ol-hidden-hostiles`, tip a6659b340. Scope: e9f7568db (code, tests, doc), a6659b340 (outcomes text), and the main merge a043c9cdb.

Result: 0 blocking, 0 major, 2 minor.

## Checks

| Question | Answer |
|---|---|
| Can the new guard break a normal calm on a visible NPC? | No. The guard (`public/break_escape/js/systems/npc-hostile.js:256-265`) runs only when `_startHostileOnReveal` is true. That flag is set at one place (`npc-behavior.js:605`, a startHostile NPC whose sprite is hidden at creation) and cleared at `npc-behavior.js:435` and `3476`. A visible NPC never has it, so a calm on it falls straight through to the existing code. A hostile NPC cannot have it either, because `setHostile(true)` clears it first. `getBehavior?.` is null safe when no manager exists. |
| Does it double record when the call comes through the behaviour? | It does nothing extra. `setHostile(false)` (`npc-behavior.js:3475-3476`) calls `recordCalm` and clears the flag before it calls `setNPCHostile` (3484), so the guard sees a false flag. `recordCalm` also returns early if an entry exists (`npc-hostile.js:217-220`). The bridge route (`npc-game-bridge.js:629` then 637) goes through `setState('hostile')` to `setHostile`, so it is the same. |
| Can it drop a later ink re-hostile? | No. After the calm the flag is false and `hostilityRecord` holds `{ hostile: false, ko: false }`. A later `setNPCHostile(id, true)` sees `wasHostile` false, so `recordHostility` (`npc-hostile.js:21-22`, called at 268) overwrites the calm entry with `hostile: true` and the hostile event fires. The reveal no longer turns it hostile, so the one cue still comes from the ink turn, not the reveal. A pending NPC that ink made hostile first (flag still true) and is then calmed directly: `recordCalm` is a no-op because a record exists, then `recordHostility` writes the calm; the flag is cleared so the reveal does not re-hostile it. All correct. This is read from the code. No test pins "calm, then hostile again" on a pending NPC (m2 below). |
| Main merge a043c9cdb | Clean for this work. `git diff 3a635f5ea..a043c9cdb` over `npc-behavior.js`, `npc-hostile.js`, `npc-manager.js` and `music/scenario-music-events.js` is empty. The merge brought keyring, pc-sessions, container, capture-model and validator work. |
| a6659b340 | Text only: the R4 outcomes section and counts in `HIDDEN_HOSTILES_MUSIC_REVIEW_R4.md`. The m3 row matches the code (bridge route already recorded the calm, direct route now does). |
| R4 m2 "Known differences" (`HIDDEN_HOSTILES_MUSIC.md:125-129`) | Accurate on the main claims. `anyHostilesAlive` (`music/scenario-music-events.js:166-183`) skips an NPC only when `isHiddenByMapping` (record is false), so an ink-hostile, unrecorded `initiallyHidden` NPC counts and the restored one, recorded hidden at `npc-behavior.js:597`, does not. The cited reason against unifying them holds (the never-touched `initiallyHidden` hostile must keep counting). "Cannot stay stuck" holds: the only code that sets an NPC sprite visible and records it is `setNPCVisible` (`npc-behavior.js:396`); the other `setVisible(true)` hits are in room object and door code. One wording slip, m1 below. |
| Tests | `node --max-old-space-size=2048 test/js/hostiles-hidden-music.test.mjs`: 30 tests, 30 pass, 0 fail. `test/js/npc-hostility-persistence.test.mjs`: 14 pass, 0 fail. Full suites not run, as instructed. |

## Findings

### m1 (minor): "written once, never removed" is not exact

`docs/achitechture/HIDDEN_HOSTILES_MUSIC.md:129`. The restore path writes `npcVisibility[id] = false` once, but the later reveal overwrites it with `true` (`npc-behavior.js:396` via `setNPCVisible`), and a re-hide writes `false` again. The key is permanent, which is right, but its value changes. Say "never removed; its value follows later reveals and hides".

### m2 (minor): no test for calm then re-hostile on a pending NPC

`test/js/hostiles-hidden-music.test.mjs` (the four R4 tests from line 361 on) pin calm via the behaviour, the bridge and the direct call, plus the no-pending case. None then turns the same pending NPC hostile again, which is the "later ink re-hostile" case. The code is correct (see the check above), so this is a guard gap only. One test: direct `setNPCHostile('r', false)`, then `setNPCHostile('r', true)`, then reveal; expect `exportHostility().r.hostile === true` and exactly one `npc_hostile_state_changed`.
