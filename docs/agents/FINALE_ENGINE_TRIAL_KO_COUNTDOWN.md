# Finale engine trial: KO immunity, door_unlocked, countdown text

2026-10-21. Approved by the user as F14 for the Season 1 finale. Not committed.

## What already existed

- **A door-unlock event.** `unlock-system.js` `unlockTarget()` emits `door_unlocked` with `{ roomId, connectedRoom, direction, lockType }` every time the player unlocks a locked door, whatever the lock type (key, PIN, password, RFID, biometric, Bluetooth, flag). `connectedRoom` is the room unlocked; `roomId` is the room the player was standing in. Mappings filter it with `"condition": "data.connectedRoom === 'vault'"`. There is no `door_unlocked:<room>` suffix form. `objectives-manager.js` already uses it for `unlock_room` tasks, and `ceo_exfil` used it in a mapping. It was missing from the README's list of event patterns.
- **NPC unlocks** (ink `#unlock_door:<room>`) emit a separate event, `door_unlocked_by_npc` `{ roomId, npcId, source: 'npc' }`, where `roomId` is the room unlocked. They do not also emit `door_unlocked`. I left that alone, because emitting both would make existing `door_unlocked` mappings fire on NPC unlocks too.
- **Object text chosen by a global.** `utils/conditional-text.js` `resolveObjectField()` already handles `observationVariants` and `textVariants`: `[{ "condition": "globalVars.x === 'y'", "value": "..." }]`, where the first match wins and the base field is the fallback. The examine view, the Read path (`interactions.js`), the hover label (`ui/info-label.js`), the container header, the dusting and lock minigames all resolve it. `spriteVariants` swaps the sprite the same way. m07's `cascade_countdown_display` is already a countdown display built like this. The README documented it (Object Field Reference) with a bedside-monitor example, and the validator already checks the variant conditions for `||` and parentheses.
- **No per-NPC "can't be fought" key.** The only switch was the scenario-wide `disableAttacks`. m08 handles a KO on `nightshade_confrontation` with a safety-net mapping on `npc_ko:nightshade_confrontation`.

## What I added

### 1. `koImmune` on an NPC

`"koImmune": true` on a person NPC. The player can't hurt it, knock it out or start a fight with it.

| File | Lines (working tree) | Change |
|---|---|---|
| `public/break_escape/js/systems/npc-hostile.js` | 90; 262-275 | New exported `isNPCKOImmune(npcId)` (reads `npcManager.getNPC(id).koImmune === true`), exposed as `npcHostileSystem.isNPCKOImmune`. `damageNPC` returns `false` at once for an immune NPC, so no HP change, `npc_ko`, `globalVarOnKO`, `taskOnKO`, item drop or death animation. |
| `public/break_escape/js/systems/player-combat.js` | 329-334 | The punch loop in `checkForHits` skips an immune NPC *before* the "attacked a friendly NPC" branch, so it is never turned hostile and `npc_attacked:<id>` never fires. Other NPCs in the same swing are hit as before. |
| `public/break_escape/js/systems/test-bridge/index.js` | 979-985 | `__test.debugKO(id)` returns `{ ok: false, reason: 'ko-immune' }` for an immune NPC instead of converting it to hostile. |
| `scripts/validate_scenario.rb` | 272; 1082-1083, 1097-1103, 1218; 2202-2216 | `koImmune` is a known NPC field. It must be `true`/`false`. It warns when `koImmune: true` sits with `taskOnKO` or `globalVarOnKO` (these can never fire) or with `behavior.hostile` (the NPC would attack and can't be hit back). The KO-resilience check (CHECK 4) treats a task as KO-safe when one of the NPCs whose ink completes it is immune. |
| `scripts/scenario-schema.json` | 849-852 | `koImmune` as a boolean. |

Ink can still turn an immune NPC hostile with `#hostile:<id>`. I left that open on purpose because it is a story decision, and the validator warns about the static `behavior.hostile` case.

### 2. door_unlocked payload fix

| File | Lines | Change |
|---|---|---|
| `public/break_escape/js/systems/apply-actions.js` | 83-85 | The `unlock_door` action (flag-station `flagRewards`, `triggerOnInteract`) emitted `door_unlocked` with only `roomId`. It now also sends `connectedRoom` (the same room). Before this, `objectives-manager` read `data.connectedRoom` as `undefined` for these unlocks, so an `unlock_room` task never completed from a flag reward, and a `data.connectedRoom` condition never matched. |

Nothing else was needed for feature 2: the event and the conditional text both existed.

### Docs

`README_scenario_design.md`:
- NPC field table: a `koImmune` row (around line 989).
- Common event patterns: `door_unlocked` and `door_unlocked_by_npc`, with their payloads (around 1156).
- Object Field Reference: a countdown-display example built from `observationVariants` + `textVariants`, when the text is chosen, and why `addToNotes: false` (around 517-537).

## Scenario keys and how to use them

```json
{ "id": "director", "npcType": "person", "koImmune": true, ... }
```

The NPC can't be punched or knocked out. Drop its KO safety-net mapping (`npc_ko:<id>`), `taskOnKO` and `globalVarOnKO`, because none of them can fire now. For m08's `nightshade_confrontation`, `koImmune: true` would replace the mapping at `scenarios/m08_the_mole/scenario.json.erb` ~L1050 along with `nightshade_ko_before_fate` and the debrief and credit lines that read it. That is a content change for whoever owns m08 and I have not made it.

```json
{
  "eventPattern": "door_unlocked",
  "condition": "data.connectedRoom === 'vault'",
  "onceOnly": true,
  "setGlobal": { "release_clock": "released" }
}
```

```json
{
  "type": "smartscreen", "name": "Release Timer", "readable": true,
  "readDisplay": "gameDisplay", "addToNotes": false,
  "observations": "RELEASE IN 04:00",
  "observationVariants": [
    { "condition": "globalVars.release_clock === 'released'", "value": "RELEASED" },
    { "condition": "globalVars.release_clock === 'short'", "value": "RELEASE IN 01:45" }
  ],
  "text": "RELEASE IN 04:00",
  "textVariants": [ ...same... ]
}
```

Declare the global in `globalVariables` (`"release_clock": "long"`). Story beats set it with `setGlobal` or ink `#set_global`. Put the most advanced state first.

## Tests

New file `test/js/npc-ko-immune-and-door-event.test.mjs`, 7 tests, all pass:
- `isNPCKOImmune` is true only for `koImmune: true`.
- A punch over an immune NPC does no damage and causes no hostility and no events.
- The same punch still turns and damages an ordinary NPC beside it.
- `damageNPC(immune, 9999)` returns false, with no KO, no global and no events.
- The `unlock_door` action emits `door_unlocked` with `connectedRoom`.
- The player-unlock emit carries `roomId` and `connectedRoom`.
- Countdown variants resolve to 04:00, 01:45, RELEASED and back to the base text.

Suites on the shared working tree, which also holds other agents' uncommitted work:

```
node --test test/js/
# tests 853
# pass 851
# fail 2
not ok 18 - test/js/engine-fixes-pass3.test.mjs
not ok 23 - test/js/engine-fixes-round4.test.mjs
  (both the known runner error; alone: pass3 6/6, round4 4/4)

bin/rails test
675 runs, 2289 assertions, 0 failures, 0 errors, 1 skips

node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json
Total problems: 0

ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --skip-ink --no-graph
m01 exit=0 invalid=0 warnings=13    m05 exit=0 invalid=0 warnings=15
m02 exit=0 invalid=0 warnings=26    m06 exit=0 invalid=0 warnings=25
m03 exit=0 invalid=0 warnings=3     m07 exit=0 invalid=0 warnings=19
m04 exit=0 invalid=0 warnings=15    m08 exit=0 invalid=0 warnings=3
(no mission uses koImmune; no koImmune message in any output)
```

My first full node run failed `validator-portrait-variants.test.mjs`, which greps the literal `gender portraitVariants _comment` in the known-fields list. I moved `koImmune` to the `taskOnKO` line of that list and the test now passes.

Validator probes, run on scratch copies of the test scenario:
- `koImmune: true` with `globalVarOnKO` and `behavior.hostile` gave both new warnings.
- `koImmune: "yes"` failed schema validation (`type string did not match boolean`).
- An `npc_conversation` task completed only by that NPC's ink gave the KO-resilience warning with `koImmune: false` and no warning with `koImmune: true`.

## Browser check

New scenario `scenarios/test_ko_countdown/` (mission.json + scenario.json.erb). A lobby holds an immune Director, an ordinary Guard and a Release Timer `smartscreen`. North of it is a vault behind PIN 1234. The Director has two mappings: `door_unlock_attempt` on the vault sets `release_clock: short`, and `door_unlocked` with `data.connectedRoom === 'vault'` sets `released`. I registered the mission row by hand (id 80, `rails runner`, `find_or_initialize_by(name: "test_ko_countdown")`) rather than running the whole `db:seed`.

Keyless server on :3001, game 2829, run by a Playwright script (window.__test plus `playerCombat.punch()` after facing the NPC):

```
director before: {"hostile":false,"ko":false,"hp":100,"immune":true}
director after 3 jabs: {"hostile":false,"ko":false,"hp":100,"immune":true}
debugKO director: {"ok":false,"reason":"ko-immune","npcId":"test_director"}
guard before: {"hostile":false,"ko":false,"hp":100,"immune":false}
guard after 3 jabs: {"hostile":true,"ko":false,"hp":70,"immune":false}
global: long
timer (start): "RELEASE IN 04:00"
interact door -> PIN minigame "Enter PIN: Vault"
global after attempt: short
timer (after attempt): "RELEASE IN 01:45"
PIN 1234 entered
global after unlock: released
timer (after unlock): "RELEASED"
events: npc_hostile_state_changed(test_guard), npc_attacked:test_guard, npc_ko(test_guard),
        door_unlock_attempt{roomId:lobby, connectedRoom:vault, lockType:pin},
        global_variable_changed:release_clock short,
        door_unlocked{roomId:lobby, connectedRoom:vault, direction:north, lockType:pin},
        global_variable_changed:release_clock released
```

No event names the Director. I looked at the screenshots myself:
- After the jabs the player stands next to the Director, who is untinted and has no health bar.
- The timer's read modal shows "RELEASE IN 04:00" in both the observation and text lines.
- Next to the timer after the unlock, the hover label reads "RELEASED".

The screenshots are in the session scratchpad (`ko-countdown/1b.png`, `3-timer-start.png`, `6-near-timer.png`).

The combat change only adds a skip for immune NPCs. The non-immune path is unchanged, and the Guard control run above confirms it. No mission uses the key yet, so I ran no mission browser regression.

## Limits

- A punch at an immune NPC gives no feedback: the swing simply misses. A toast ("not a fight you can pick") would be a later addition if playtests show confusion.
- Ink `#hostile` can still turn an immune NPC hostile. It will then chase and attack the player and can't be hit back. Only the static `behavior.hostile` case is flagged.
- Other damage paths, such as the `combat-debug.js` console helpers, go through `damageNPC` and are refused there. Their `setNPCHostile` calls still go through.
- Object variants are resolved when shown. A display doesn't tick on its own and doesn't change while its read modal is open. For a live clock, use a scenario `timers` entry.
- `door_unlocked_by_npc` stays a separate event with `roomId` meaning the unlocked room, which differs from `door_unlocked`'s `roomId`. The README now says which field to use for each.
- Spotted but not changed: README line ~1730 says `globalVarOnKO` sets its global "without emitting `global_variable_changed`". `npc-hostile.js` does emit it now (around line 360), so that bullet is stale.
