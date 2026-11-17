# SIMS-5 review, round 3: code (V10)

Branch `build/ol-sims`, tip `4e87d9bb0`, worktree `p-ol-sims`. Kind of work: tooling for the
office-life demo scenario (`test_needs_sims`). The aim is a validator rule that mirrors exactly what
the needs engine can trigger, with no false warnings and no false passes, and that stays quiet on
every committed scenario unless a real dead pool exists.

Read: AGENTS.md, the R2 review and its Outcomes section (`OFFICE_LIFE_SIMS5_REVIEW_R2.md`), the R2
fix commit (`git show 4e87d9bb0`), `scripts/validate_office_life.rb`,
`test/js/validator-office-life-v10.test.mjs`, the `ValidateNpcNeeds` helpers it calls
(`leash_reach`, `use_rule`, `collect`, `printer_list`), and in `npc-needs.js`: `register`,
`normaliseNeed`, `normaliseInterest`, `magnetOf`, `onItemDropped`, `_shownMagnets`, `_magnetBarred`,
`_magnetsFor`, `_sight`, `_tickNews`, `_newsHearers`, `_announce`, `control` (the `print` command),
`_startJob` (the print roll), `_completeJob` (the `onUse` hook), `_revealOutput`, `_reserve`,
`_errandCandidate`, `_printBlocked`, `_recheck`, `_turnBack`, `_grumble`, `_grumbleTopic`, `_judged`,
`_avoidRadius`, `_avoidedAt`, `_avoidsOneWay`, `_compatible`, `_maybePair`, `_maxQueue`, `_balks`,
`onPhoneRing`, `_tickRings`, `_ownerCanAnswer`, `_claimAnswerer`, `_chooseCall`, `_visitPlace`,
`_carryCandidate`, and the live adapter (`createEngineWorld`: `npcIds`, `getNpc`, `npcPos`,
`npcStatus`, `listObjects`). Also `npc-behavior.js` for how a patrol is enabled and where it goes.

Every new finding was confirmed with a fixture run through `ValidateOfficeLife.check` (session
scratchpad `s5r3/probe.rb`; fixture names P1 to P9 below refer to it). Lines are
`scripts/validate_office_life.rb` unless a test is named.

## Runs

- `node test/js/validator-office-life-v10.test.mjs`: 24 of 24 pass, 5.4 s.
- `ruby scripts/validate_scenario.rb <s> --skip-ink --no-graph` on `test_needs_sims` and
  `m02_ransomed_trust`: exit 0, 0 errors, no V10 line and no "could not run" line.
- Corpus: all 180 `scenarios/*/scenario.json.erb` rendered through `render_erb_to_json` and passed to
  `ValidateOfficeLife.check` alone: no render or check failure, 0 V10 warnings, 0.05 s in V10 overall.
- The tree was unchanged after the runs (only the untracked `node_modules` link).

## R2 findings: closure

| R2 | Status | Evidence |
|---|---|---|
| M1 registration | Closed | `runs?` (268) matches `register`: a need that survives `normaliseNeed` (`needs_of`, 250, same `> 0` tests on `Number`) or an interest that survives `normaliseInterest` (`interests_of`, 259; a bare number or a Hash `weight`, a string is dropped in both). Owners (499), answerers (506) and tellers and hearers (`news_pairs`, 348, over `actors`) must run; avoided NPCs drop phone contacts only (436), as `_avoidedAt` walks `npcIds` and skips a null `npcPos`. The phone-contact assumption holds: a phone contact is in `npcIds` and may register, but with no sprite `npcPos` is null and `npcStatus` reports it hidden, so it never answers, claims, tells or hears. One gap remains on the pairing side (m2 below). |
| M2 reach | Closed | `build_rooms` (303-343) gives home and start rooms, usable world objects' rooms, print rooms, and leash reach only for a patrol, an interest or a work plan; fixed magnets are learnt by sight or word. The fixpoint terminates: every pass either adds a magnet to a knower set or a room to a room set, both bounded, and nothing is removed. It is order independent for the same reason (monotone growth to the least fixpoint); P6 reverses the NPC and room order and gets the same output. The print and patrol inputs to it are wrong in places (M2 and m1 below). |
| m1 listeners | Closed | `ring_targets` (178-188) reads `emitEvent` and an `emit_event` action's `event_name` only. Ink cannot emit an arbitrary event (no such tag in `chat-helpers.js`), so nothing else rings a phone. |
| m2 servings | Closed | `servings` (153-157) is `magnetOf`'s rule, `js_number` included; magnets with no servings are dropped from sources, magnets and news (107-109). |
| m3 maxQueue | Closed | `max_queue` (388-393) matches `_maxQueue` (`""` is 0, `true` is 1, as `Number`); `pairs?` (398-405). |
| m4 contents | Closed | Top-level room objects only are `world` (74); contents and `itemsHeld` go to `held` (75, 81). |
| m5 group mirror | Closed | `mirrored_pair?` (650-662). |
| m6 tests | Closed, with one wrong assertion | Tests 20 to 25 cover each listed gap. Test 25's printer case asserts a pass the engine cannot speak (M1 below). The ERB pins now render through `ScenarioBinding.render`, the same call `render_erb_to_json` makes, so the pins check what the validator checks. |
| m7 nesting | Closed | `GRUMBLE_REASON` (562-570); test 24 asserts it. |

The fixer's two stated assumptions:

- NPCs with interests or a work plan keep full leash reach. Sound. A workaround or check visit
  (`_visitPlace`) and an interest carry (`_carryCandidate`, `_permitted`) both honour the leash, so
  leash reach is a superset of where they go. Every V10 rule only gains passes from a wider room set,
  so the cost is a possible missed warning and never a false one. Interest targets could be narrowed
  later (`noticeRooms`, else the home room, plus `accepts` targets), but nothing requires it now.
- Phone contacts never count as running. Sound for every role V10 mirrors through `runs?` (above).

## Findings

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | M1, M2 |
| Minor | 4 | m1 to m4 |

None of the findings changes V10's output on any committed scenario (0 warnings over the corpus), so
the SIMS-5 live proof is not at risk. M1 is a false pass that test 25 locks in; M2 is a false warning
that the R2 rewrite introduced.

### M1 (major). `grumble_printer_off` counts prints that never happen or never speak

`print_producers` 356-366, `printer_off_turn_back?` 463-469; test 25,
`test/js/validator-office-life-v10.test.mjs:447-450`.

`printer_off_turn_back?` passes when any print producer list on the NPC is all `offWhen`. The engine
speaks `grumble_printer_off` from one place only: `_completeJob`, when a use job on the hook's own
object ends and `job.printTo` was set by `_startJob`'s roll. Three kinds of source never get there:

- A `needs.print` mapping goes through `control`, which calls `_printBlocked(..., viaCommand: true)`,
  and `_printBlocked` returns before `_pickBark` when `viaCommand` is set. It never speaks. P1: the
  only print source is a mapping to an off printer; V10 passes.
- An `onUse` hook fires only on a use job whose target is that object. If the NPC has no need the
  object satisfies (or the leash or privacy bars it), it never uses it and never prints. P2: the hook
  is on the NPC's desk, which has no affordance, and its only need is thirst; V10 passes.
- `chance` 0 (or below 0, or `"0"`): `_startJob`'s roll `roll < max(0, chance)` never succeeds. P2b
  passes.

Test 25 builds exactly P2 (`onUse: { a_pc: { revealOutput: 'pr1' } }` on an NPC whose only need is
thirst, and `a_pc` a plain desk) and asserts that `grumble_printer_off` does not warn. In the game
that pool is dead.

Fix: in `printer_off_turn_back?`, count only `onUse` hooks whose key is a world object the NPC
`can_use?`, with `revealOutput` and a `chance` that is absent, not a finite number, or above 0; leave
`needs.print` mappings out. Rewrite test 25 so the passing case hooks a used object (the cooler it
drinks at, P2c), and add P1, P2 and P2b as warning cases.

### M2 (major). Print errand rooms: the string and list `needs.print` forms are dropped, and a hook with no habit adds a room

`print_producers` 356-366 (362), used by `build_rooms` 312.

`build_rooms` adds an NPC's print producers' rooms, standing for the fetch errand. Two parts of that
input are wrong:

- `control` accepts `needs.print` as a producer id, a list of ids, or `{ producer, ... }`, and the
  needs validator accepts all three. Line 362 reads `producer` only when `print` is a Hash, so the
  string and list forms add no room. A mapping print is always owned (`own` is set with
  `viaCommand: true`), so `_reserve` books it and `_errandCandidate` walks the NPC to the slot. P3:
  `a` avoids `b` and drinks only at a kitchen cooler; `b` drinks coffee in the office and its only
  kitchen visit is a mapping print to the kitchen printer. With `{ producer: 'pr1' }` V10 passes
  `a`'s `grumble`; with `'pr1'` or `['pr1']` it warns. That is a false warning, which V10 exists not to
  give. Before R2 the string form raised in `dig` (so V10 "could not run" on it); the R2 side fix
  stopped the raise by skipping the value, and the new `build_rooms` made the skip matter.
- An `onUse` hook prints, but its print is owned only when the NPC has a `habits.print` Hash
  (`_completeJob` passes `habit ? { habit } : null`, and `_revealOutput` reserves only when `own` is
  set). With no habit there is no reservation and no errand, so the NPC never walks to the printer.
  V10 adds the room anyway (P3b passes where it should warn).

Fix: split the two uses. For rooms, an `errand_producers(n)` that reads `needs.print` in all three
forms (as `control` does: a String or Array is the producer list, a Hash its `producer`), plus
`onUse` `revealOutput` lists only when `habits.print` is a Hash (and, as in M1, only for hooks on
objects the NPC can use). Add the room of the producer's reveal slots (objects with `outputOf` that
producer), since the errand walks to the slot, not the printer. For `grumble_printer_off`, the M1
list. Add P3 in all three forms and P3b as test cases.

### m1 (minor). Patrols: a one-room patrol gets the whole leash, a route is bounded by the needs leash, and an auto-enabled patrol is missed

`patrols?` 272-274, `build_rooms` 314.

`npc-behavior.js` keeps a patrol in the NPC's room unless `multiRoom` is true with a `route`, and then
it walks the route's rooms, which the needs leash (`needsRooms`, `needsAvoidRooms`) does not govern.
It also turns a patrol on when `waypoints` or `bounds` are given and `enabled` is not set.

- P7c: a single-room patrol in the office is put in every room its leash reaches, so an avoider's
  kitchen `grumble` passes. The engine never takes it to the kitchen. False pass.
- P7: a `multiRoom` route through the kitchen, on an NPC whose `needsAvoidRooms` names the kitchen,
  is never put there. False warning.
- P7b: `multiRoom` with `route` and `waypoints` and no `enabled`; the engine patrols, V10 does not.
  False warning.

Fix: a patrol is on when `enabled` is true, or when `enabled` is not set and `waypoints` (non-empty)
or `bounds` is given. Its rooms are the route's `room` values when `multiRoom` with a non-empty
`route`, else the start room. Do not pass them through `leash_reach`.

### m2 (minor). A phone contact with needs still pairs at a chatter object

`can_use?` 370-377, used by `chatter_pair?` 414, `share_any_object?` 673-679, `off_turn_back?` 451,
`gone_turn_back?` 458.

`runs?` excludes phone contacts, but the user lists for pairing and the off and gone turn-backs go
through `can_use?`, which reads `needs_of` and not `runs?`. A phone contact with a `needs` block has
no sprite, so it never uses anything. P9: it is the only cooler partner and the speaker's `cooler`
pool passes. P9b: an exchange with it passes. P9d: its own `grumble_off` passes. None of these can
play.

Fix: return false from `can_use?` unless `runs?(npc)`. This also covers any later rule built on it.

### m3 (minor). News: a zero radius and a hearer who already knows

`news_pairs` 348-353.

- `magnetOf` clamps `newsRadius` to 0 to 50, and `_newsHearers` takes only hearers within
  `newsRadius * 32 + 0.5` px. At 0 a hearer must stand on the teller's centre, so the announce never
  happens. P4: `newsRadius: 0`, and the `news_cake` pool passes.
- `_newsHearers` skips an NPC that already knows. An NPC that starts in the magnet's room sees a
  shown magnet on its first tick (`_sight`), before any teller can come home. P5: the only possible
  hearer lives in the cake room and visits the teller's office for water; V10 passes the pool, and in
  the game nobody is ever told.

Fix: treat a magnet whose `newsRadius` reads 0 (through `js_number`, as `magnetOf`) as one nobody
tells. In `news_pairs`, skip a hearer whose start room is the magnet's room when the magnet has no
`revealOnGlobal` (one revealed later can still be news to it).

### m4 (minor). Odd values: a non-numeric capacity raises, and `avoidRadius` is not read as `Number`

`pairs?` 401, `avoid_radius` 241.

- `(aff['capacity'] || 1).to_i` raises `NoMethodError` for `true`, a Hash or an Array (P8), so the
  hook prints "could not run" and every V10 result for that scenario is lost. The engine reads
  `Number(aff.capacity) || 1`.
- `_avoidRadius` takes `Number(c.avoidRadius)` when it is finite, so `""` is 0 (no avoidance) and
  `true` is 1. V10 parses only Numeric or a Float string, so `""` and `true` fall to the default of
  2. P8c: `avoidRadius: ""`, and an avoidance `grumble` passes that the engine never speaks.

Fix: read both through `js_number`, the helper R2 added for `servings`. For `avoidRadius`, the absent
and `null` cases still take the default.

## Notes (no change asked)

- Test 20 to 25 headers cite the R2 items they cover, which reads well. The comment block at the top
  of `build_rooms` (295-302) is accurate apart from the print and patrol details above; update it
  with the M2 and m1 fixes.
- Room-level modelling stays coarse on purpose: `_avoidedAt` needs the avoided NPC within the avoid
  radius of the approach cell, and `_newsHearers` within the news radius of the teller. A
  non-running NPC never moves, so its distance to an object's approach cell is fixed and could be
  checked one day. Not asked for now, since it needs the approach-cell rules.

## Verdict

**All nine R2 findings are closed**, and the two assumptions the fixer stated are sound. The
reach model is a monotone fixpoint that terminates and does not depend on order. V10 is still not an
exact mirror: M1 passes `grumble_printer_off` for prints that never happen or never speak, and test
25 asserts one of those passes; M2 gives a false warning for the string and list `needs.print` forms
and a false pass for a hook with no print habit. Both should land, with their tests, before V10 is
called done. m1 to m4 are cheap and can go in the same round. Nothing here changes the corpus result
(0 warnings over 180 scenarios), so the SIMS-5 live proof can go ahead.

## Outcomes

Each finding was checked against `npc-needs.js` and `npc-behavior.js` before the change, and the
reviewer's probe (P1 to P9) now gives the engine's answer on every fixture. Lines are
`scripts/validate_office_life.rb` unless a test is named; tests are in
`test/js/validator-office-life-v10.test.mjs`.

| Finding | Outcome | Where |
|---|---|---|
| M1 | Fixed. `printer_off_turn_back?` reads only `hook_print_lists`: onUse hooks on a world object the NPC can use for a need, with a non-empty `revealOutput` and a `chance` that is absent, not a finite number, or above 0 (`_startJob`'s roll; `null` and `""` are Number 0 and never print). `needs.print` mappings are left out, as `control` passes `viaCommand` and `_printBlocked` returns before `_pickBark`. Test 25's passing case now hooks the cooler the NPC drinks at; test 26 covers the mapping forms, the unused desk and the chance values. | 443-465, 601-609; tests 25 (445), 26 (477) |
| M2 | Fixed. `command_print_lists` reads `needs.print` as `control` does (a string or a list is the producer, an object its `producer`); `errand_producers` adds hook lists only with a `habits.print` that is an object (an array counts, as `typeof` does in `_completeJob`), and only for an NPC whose `needsHome` names a world object (the errand carries the print there); `errand_rooms` gives the rooms of that producer's `outputOf` slots that the leash allows (`_errandCandidate` checks `_permitted` on the slot). `build_rooms` uses it in place of the printer rooms. Test 27. | 467-502, 357-379; test 27 (497) |
| m1 | Fixed, with one correction to the finding. The constructor auto-enables a patrol whenever `enabled` is falsy and waypoints or bounds are given, so `enabled: false` with waypoints still patrols (the finding said "not set"). `patrol_rooms` mirrors that, keeps a patrol in the start room unless `multiRoom` has a route that `validateMultiRoomRoute` accepts (rooms exist, waypoints have x and y, each room connects to the next and the last to the first), and does not pass a route through the needs leash. It applies to every NPC, needs or not, as before. Test 21's patrol case now uses a route; test 28 covers P7, P7b, P7c, bounds and a bad route. | 291-336, 378-379; tests 21 (369), 28 (523) |
| m2 | Fixed. `can_use?` returns false unless `runs?`, so a phone contact with needs pairs, exchanges and turns back from nothing. Test 29. | 504-508; test 29 (548) |
| m3 | Fixed. `news_pairs` tells nobody when `news_radius` (Number, clamped 0 to 50, default 5 tiles) is 0; NPC bodies collide, so a hearer within 0.5 px of the teller's centre is not modelled as possible. A hearer whose start room is the magnet's room is skipped unless the magnet has a `revealOnGlobal` (shown later, so it can still be news). Test 30. | 410-441; test 30 (559) |
| m4 | Fixed. `pairs?` reads `capacity` through `js_number` (no raise for `true`, a Hash or an Array); `avoid_radius` takes `js_number` when the key is set and not null and the value is finite, else the default. `js_number` now also follows Number for arrays (`[]` 0, `[3]` 3, `[true]` NaN), hex, binary and octal strings, `"5."`, `".5"` and `Infinity`, and rejects `"1_0"`. Test 31. | 143-170, 256-265, 537-541; test 31 (586) |
| Note 1 | Done: the `build_rooms` comment now describes the slot errand and the patrol rooms. | 357-366 |
| Note 2 | Deferred, as the review says: room-level modelling of the avoid and news radii stays coarse. | |

Where the engine cannot be read statically the rules lean to a missed warning over a false one,
and say so in their comments: the reach pass does not ask whether a fixed magnet with a print hook
is known yet; a slot is not checked for `pickable` or a reveal global; the start-room hearer skip
applies only to magnets shown from the start. One gap was noticed and left: a magnet with
`pickable: false` is never shown (`_shownMagnets`), so nobody sees or tells it, and V10 can still
pass its news pool. That is a possible missed warning, not a false one.

Runs after the fix: the V10 node test 30 of 30; `validate_scenario.rb --skip-ink --no-graph` on
`test_needs_sims` and `m02_ransomed_trust` exit 0 with 0 errors and no V10 line; the corpus run over
all 180 rendered scenarios has no render or check failure and 0 V10 warnings.
