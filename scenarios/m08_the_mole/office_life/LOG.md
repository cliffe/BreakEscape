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
