# m05 office-life plan review, round 4

B 0 / M 0 / m 3

Read only, worktree `p-ol-m05` at `fc761ca5c`. Engine paths are under `public/break_escape/js/`; plan files under `scenarios/m05_insider_trading/office_life/`.

## R3 minors: all five fixed

- **m1 (needs reset before reveal): fixed.** Each of Bernadette's three show mappings carries `"needs": { "set": { "caffeine": 60, "tidy": 50 } }`. `systems/npc-manager.js:1639` runs `config.needs` and `:1656` runs `setVisible`, in that order. `control()` accepts `{ set: {...} }` for a need the NPC holds (`systems/npc-needs.js:1133` to `:1149`) and does not check visibility. The :135 and :202 claims now match `_tickNpc` (decay at `:1404`, unavailable return at `:1418` onward).
- **m2 (sync and KO guard): fixed.** `npcHostility` is in `KEYED_SECTIONS` (`state-sync.js:43`). `setNPCVisible` posts `updateNpcState` at `systems/npc-behavior.js:456` to `:458` (the plan says `:455` to `:458`, fine). `sprite.body.enable = visible` is at `:439` (the plan's `:438` is the `if (sprite.body)` line one above it, acceptable). `npc-hostile.js:405` is `checkCollision.none = true`. The guard on Bernadette's plain show does what the plan says. See m-b for Thandiwe's onceOnly hides.
- **m3 (Lisa gate): fixed.** See the checks below.
- **m4 (gate column): fixed.** The people table has the column, Lisa's row is filled, the others read n/a.
- **m5 (needs form): fixed.** No shorthand is left. Every remaining mention is the JSON form, or a prose reference to "`needs.set`" at PLAN.md:197, which is readable beside the form given three lines above and in section 2.12.

## Engine cites

| Cite | Result |
|---|---|
| `npc-manager.js:1639`, `:1656` | Hold. `needs` at 1639, `setVisible` at 1656. |
| `npc-manager.js:1500` to `:1506` | Holds. `if (config.setGlobal ...)` is at 1500; the block runs to about 1517. |
| `npc-manager.js:752` | Wrong target, see m-a. |
| `npc-behavior.js:438`, `:455` to `:458` | Hold, within one line. |
| `npc-hostile.js:405` | Holds. |
| `state-sync.js:43` | Holds. |

## Checks 2 and 3

- **`lisa_met` mapping shape: valid.** `setGlobal` takes `{ var: value }` (`npc-manager.js:1500` to `:1503`) and broadcasts a `global_variable_changed` event. A `onceOnly` mapping with no conversation or minigame action persists its trigger (`:1489`), so it survives a reload. Lisa has no existing `eventMappings` in `scenario.json.erb` (checked from line 1731 onward, no `lisa_met` yet), so the handler indexes are free. The gate holds on the peek route: no `lisa_met`, no trip.
- **Conditions: valid.** `safeEvaluateCondition` (`npc-manager.js:54` to `:135`) handles `&&`-joined terms, `!globalVars.x`, `globalVars.x === true`, `globalVars.x !== true` and `data.previousRoom === '...'`. `||` appears nowhere in a mapping condition (the three hits in PLAN.md are the "no `||`" rule and the credits conditions). An unset global compares `!== true` as true, so the guards pass before any KO.
- **Section 7 counts: add up.** onceOnly 2 + 2 + 5 + 2 + 1 = 12. Cooldown-only 9 = 2 + (2 + 1) + 2 + 2. Plain 2. Keys are per-key booleans, hostility is up to 4 bounded keys, and `lisa_met` is one global, so sync stays bounded and goes out as deltas.
- **Skeleton: consistent.** Niamh's `eventMappings` entry in 2.12 uses the JSON `needs` form and valid condition syntax. The KO guard conditions are valid.

## Minors

**m-a. The `conversation_closed:<npcId>` cite points at the wrong code.** PLAN.md:254 cites `npc-manager.js:752`. That line is `const eventName = ...` inside `_whileThreadOpen`, a phone-thread helper. The event Lisa's in-person conversation emits is at `minigames/person-chat/person-chat-minigame.js:1993` (emitted once per instance on cleanup). The claim "a real event" is true; only the cite is off. Fix: cite `person-chat-minigame.js:1993` (and `npc-manager.js:2163` for the mapping registration if wanted).

**m-b. The "onceOnly cannot repeat" reasoning leaves Thandiwe's re-hides unguarded.** PLAN.md:116 to :118 guard only Thandiwe's plain hide. Her two `onceOnly` hides (`room_entered:break_room` and `room_entered:main_corridor`, condition `server_room_entered === true`) have no KO guard. If she is knocked out by day and the player then enters the server room, the guarded plain hide is skipped. The first onceOnly hide fires on the next break-room entry and hides the KO'd body, so it vanishes at the turn instead of staying where the attack probe left it, which is what the guard's own note says it wants. (Bernadette's onceOnly shows are safe: she is hidden until the turn, so she cannot be KO'd before they fire.) Fix: add `globalVars.thandiwe_ko !== true` to both of Thandiwe's onceOnly hides (a failed condition does not consume the key, `npc-manager.js:1283` onward), or state in 2.9 that a KO'd Thandiwe is hidden at the turn on purpose. Either way, say so in E-checks.

**m-c. `lisa_met` is missing from the section 2.11 globals list, and DIALOGUE_SAMPLE.md does not mention the gate.** PLAN.md:144 ("Declared `false` at the scenario's globals: ...") lists five globals; `lisa_met` is declared only in 2A and section 7. A build following 2.11 alone would miss it, and the gate would then read `undefined === true`, so Lisa would never take her trip (fail-safe, but silent). Also `DIALOGUE_SAMPLE.md:36` says "Lisa may step to the kettle once while you are two rooms away", which is still true but now only after the player has spoken to her; ANALYSIS.md:7 and :27 stay consistent (they point to section 2A). SPOKEN_LINES.md is untouched by the fix (no kettle-trip lines depend on the gate). Fix: add `lisa_met` to the 2.11 declared list, and append "once you have spoken to her" to DIALOGUE_SAMPLE.md:36.

## Outcomes

- m-a: fixed, the conversation_closed cite now points at person-chat-minigame.js:1993.
- m-b: fixed, both onceOnly re-hides carry the thandiwe_ko guard.
- m-c: fixed, lisa_met is in the declared-false list; DIALOGUE_SAMPLE says the kettle step comes after you have spoken to Lisa.
