# SIMS-5 review, round 4: code (V10)

Branch `build/ol-sims`, tip `3c71a0a34`, worktree `p-ol-sims`. Kind of work: tooling for the
office-life demo scenario (`test_needs_sims`). The aim is a validator rule that mirrors what the
needs engine can trigger, with no false warnings on any scenario. Where the engine cannot be
modelled statically, a missed warning is the accepted trade-off, and the code says so.

Read: AGENTS.md, the R3 review and its Outcomes section, the R3 fix commit (`git show 3c71a0a34`),
`scripts/validate_office_life.rb`, `test/js/validator-office-life-v10.test.mjs`, and in
`npc-needs.js`: `magnetOf`, `_shownMagnets`, `_hidden`, `_sight`, `_tickNews`, `_newsHearers`,
`control`, `_startJob`, `_completeJob`, `_pickProducer`, `_isOff`, `_revealOutput`,
`_printBlocked`, `_reserve`, `_errandCandidate`, `_roomForbidden`, `_permitted`, `_avoidRadius`,
`_maxQueue`, `_maybePair`, `_judged`, `_stationId`, `_socialCandidate`, `_resolveHome`, and the live
adapter (`createEngineWorld`: `describe`, `socialHomes`, `isSlot`, `findSprite`, `getObject`,
`listObjects`). Also `npc-behavior.js` (the patrol constructor and `validateMultiRoomRoute`) and
`npc-manager.js` (`_normalizeEventMappings`, the `needs` mapping field).

Every new finding was confirmed with a fixture run through `ValidateOfficeLife.check` (session
scratchpad `s5r4/probe.rb`, fixtures Q1 to Q7). `s5r4/probe_old.rb` runs the same fixtures against
the R2 tip (`4e87d9bb0`) to tell R3 regressions from older gaps. Lines are
`scripts/validate_office_life.rb` unless a test is named.

## Runs

- `node test/js/validator-office-life-v10.test.mjs`: 30 of 30 pass, 9.5 s.
- `ruby scripts/validate_scenario.rb <s> --skip-ink --no-graph` on `test_needs_sims` and
  `m02_ransomed_trust`: exit 0, 0 errors, no V10 line and no "could not run" line.
- Corpus: all 180 `scenarios/*/scenario.json.erb` rendered through `render_erb_to_json` and passed
  to `ValidateOfficeLife.check` alone: no render or check failure, 0 V10 warnings, 0.07 s in V10.
- The tree was unchanged after the runs (only the untracked `node_modules` link).

## R3 findings: closure

| R3 | Status | Evidence |
|---|---|---|
| M1 printer off | Closed, with one regression (m1 below) | `printer_off_turn_back?` (604-609) reads only `hook_print_lists` (448-465). Mappings are left out, which matches `control` passing `viaCommand` to `_printBlocked`. The chance rule matches `_startJob`: `prints = !(finite && chance < 1) \|\| roll < max(0, chance)`, so a finite chance of 0 or less (`0`, `null`, `""`, `[]`, `"0"`) never prints and anything else can. `_completeJob` needs `job.need`, `!job.carrying` and `job.printTo`, so only a need use of the hook's own object prints. The `can_use?` gate (461) is the right idea, but it reads only `affordance.satisfies` and so misses the social_media station (m1). |
| M2 errand rooms | Closed | `command_print_lists` (469-476) reads `needs.print` as `control` does (a string or array is the producer, a Hash its `producer`). `print_habit?` (479-482) matches `_completeJob`'s `typeof rec.habits.print === 'object'` (null is not, an array is). `errand_producers` (487-493) requires a `needsHome` string naming a world object, as `_errandCandidate` needs `s.home.objectId` and `getObject`. `errand_rooms` (497-502) checks the slot's room against `leash_rule`, which matches `_permitted(s, item, false)` and `_roomForbidden` (leash allow and deny, `needsPrivateTo`, home room exempt). A `forget: true` mapping or `forgetChance: 1` is never fetched but still adds the room: a missed warning, as the Outcomes say. |
| m1 patrols | Closed, and the fixer's correction is right | The constructor sets `enabled: config.patrol?.enabled \|\| false` and then auto-enables when `!config.patrol?.enabled` and `waypoints?.length > 0` or `bounds` is truthy, so `enabled: false` with waypoints or bounds patrols. `patrol_rooms` (301-314) mirrors that, including a string `waypoints` (it has a `length`) and the string `"false"` (truthy, Q7). `multi_room_route` (319-336) matches `validateMultiRoomRoute`: a segment needs a room the scenario has, every array waypoint needs `x` and `y` present (`null` passes, as `=== undefined` does, Q7b), and each room must connect to the next, looping back. A one-room route fails that loop, as it does in the engine (Q7c). The needs leash is not applied. |
| m2 phone contacts | Closed | `can_use?` (507-508) returns false unless `runs?`, so every rule built on it drops a phone contact. `avoid_turn_back?` (576) still drops phone contacts from the avoided set on its own, as `_avoidedAt` needs a position. |
| m3 news | Closed | `news_radius` (430-434) is `magnetOf`'s `num(m.newsRadius, NEWS_RADIUS, 0, 50)`; 0 tells nobody (417). The start-room skip (419, 424) holds: `_tickNpc` calls `_sight` before anything else once the sprite has a position, and an NPC in an unloaded room has no position and so is no hearer either; when its room loads, the magnet in that room is registered in the same load. No scenario object is hidden other than through `revealOnGlobal`, and a magnet that is not shown at start (`revealOnGlobal`, or never shown) only loses the skip, a missed warning. |
| m4 Number | Closed | `pairs?` (540) reads `capacity` with `js_number`, matching `(Number(aff.capacity) \|\| 1) >= 2` with no raise. `avoid_radius` (261-264) matches `_avoidRadius` exactly, including `null` taking the default (`c.avoidRadius !== null`). `js_number` agrees with `Number` on every case tried: `"08"` 8, `"1_0"` NaN, `"0x1F"` 31, `"+0x10"` NaN, `"1."`, `".5"`, `"-.5"`, `"5.e3"`, `"1e400"` Infinity, `[]` 0, `[[3]]` 3, `[true]` and `[{}]` NaN. The one known gap is that Ruby `strip` keeps a non-breaking space that JavaScript trims, which no author will hit. |

## Findings

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 2 | m1, m2 |

Neither finding changes V10's output on any committed scenario (0 warnings over the corpus). m1 is
a false warning that R3 introduced; m2 is an older false warning, present at the R2 tip too.

### m1 (minor, R3 regression). A print hook on a social_media NPC's own station is not counted

`hook_print_lists` 461, `can_use?` 507-516; it feeds `printer_off_turn_back?` 604-609 and
`errand_producers` 491.

The M1 fix keeps a hook only when `can_use?` says the NPC can use its object for a need, and
`can_use?` asks whether `affordance.satisfies` names one of the NPC's needs. The engine has one use
that does not go through `satisfies`. `social_media` is always judged (`_judged`), so `_select` picks
its source with `_socialCandidate`. That function takes the NPC's own station (its `needsHome`, when
that object is a desk by `isDeskData`) and adds `social_media` to its `satisfies` on the spot. The
adapter even lists such a desk with an empty affordance when it has none (`describe`,
`socialHomes`). The use is `kind: 'use'` with `need: 'social_media'`, so `_startJob` rolls the hook
and a met use reaches the hook block in `_completeJob`; with every listed printer off it speaks
`grumble_printer_off`.

Failure scenario: an NPC with a `social_media` need and no `work` need, whose `needsHome` is a
workstation (`workstation: true`, or the `desk_pc` preset under `officePresets`) with
`onUse: { <desk>: { revealOutput: 'pr1' } }`, `pr1` having an `offWhen`, and its own
`grumble_printer_off` lines. In the game the NPC scrolls at its desk, the print fails, and it
grumbles. V10 warns that no such print can happen (Q1, Q1c with no affordance, Q1d with presets). At
the R2 tip all three passed. The same gap drops the errand room: give that NPC a `habits.print` and
a slot in the kitchen, and an avoider whose only kitchen visit would meet it gets a false `grumble`
warning (Q5).

The NPC needs three things at once (social media but no need the desk satisfies, a print hook on
the desk, lines for the grumble), and the corpus has none, so this stays minor.

Fix: in `hook_print_lists`, also keep a hook whose object is the NPC's `needsHome` when
`AW.social_station?(json, n, 'social_media')` holds (the helper `validate_npc_needs.rb` already uses
for the same rule). A blocked or locked-out station only costs a missed warning. Add Q1, Q1c and Q5
to test 26 and 27 as passing cases. A borrowed PC (`_borrowCandidate`) is a second use outside
`satisfies`, but a hook on another NPC's PC is too unlikely to model; say so in the comment.

### m2 (minor, older). A printer whose room is not loaded counts as off in a list of two or more

`printer_off_turn_back?` 607-608.

The rule passes only when every producer in the list has an `offWhen`. `_pickProducer` treats a
producer the world does not know as off when the list has two or more entries (its own comment says
"its room not loaded"), and the live `getObject` finds only sprites in loaded rooms (`findSprite`).
Rooms load lazily as the player moves, and a locked room does not load until it is unlocked.

Failure scenario: `revealOutput: ['office_printer', 'kitchen_printer']` on the cooler an office NPC
drinks at, `office_printer` with an `offWhen`, `kitchen_printer` with none, and
`grumble_printer_off` lines. While the player has not been near the kitchen, the office printer
going off leaves no printer "on", so the print is blocked and the NPC grumbles. V10 warns (Q2). The
demo's Tom has exactly this list shape, but both of his copiers have an `offWhen`, so it passes
today.

Fix: in a list of two or more, treat a producer as possibly off when it has an `offWhen`, is not a
world object, or sits in a room other than the hook object's room (the NPC's room is loaded while it
uses the object, so a producer there is known). Add Q2 as a passing case.

## Notes (no change asked)

- `offWhen` is read with Ruby truthiness (591, 607), so `{}`, `""` and `[]` count as a condition.
  `_isOff` treats all three as none. That only produces passes the engine cannot speak (Q3), so it is
  a missed warning; `false` and absent are handled (Q3 warns for `false`).
- A takeable magnet placed in a room is treated as fixed there. The player can pick it up and drop
  it elsewhere (`onItemDropped` keeps the registry entry and every NPC's `knows`), which can make a
  knower whose home is the magnet's original room into a teller. That is an older gap, and a
  contrived one: the hearer must reach the room after the magnet has left it (Q4 shows V10 warning on
  a fixture where the engine needs that timing). No committed scenario has a takeable room magnet.
- `command_print_lists` reads `eventMappings` as an array only. `npc-manager.js` also accepts an
  object keyed by pattern and the singular `eventMapping`; both are outside the schema (`eventMappings`
  is `type: array`) and absent from the corpus, and `validate_npc_needs.rb` reads them the same way.
- Movement V10 does not model, unchanged by R3: an unleashed hostile chasing the player, and a
  `patrolOverride` mapping (its own room only, so harmless). A chaser is excluded from hearing news
  but not from `_avoidedAt`; an avoider's grumble could play where V10 warns. Not worth modelling.
- The comments added in R3 (`build_rooms` 357-366, `news_pairs` 410-415, `hook_print_lists`
  443-447, `patrol_rooms` 297-300) describe the code correctly; the `hook_print_lists` comment should
  gain the social station once m1 lands.

## Verdict

**All six R3 findings are closed**, and the fixer's correction to m1 (a patrol auto-enables when
`enabled` is falsy, `false` included) matches the constructor. The `js_number` rewrite agrees with
JavaScript `Number` on every case tried. R3 introduced one false warning (m1: a print hook on a
social media NPC's own station), which is narrow and absent from the corpus; m2 is an older false
warning from lazy room loading. Neither blocks calling V10 done, and both are a few lines with a
test each. The corpus result is unchanged (0 warnings over 180 scenarios), so nothing here puts the
SIMS-5 live proof at risk.

## Outcomes

- **m1, fixed.** `hook_prints` (which `hook_print_lists` now wraps) keeps a hook whose object the
  NPC can use through `satisfies` or, new, through `social_home?`: the object is the NPC's
  `needsHome`, the NPC runs and has a `social_media` need that survives normalising, and
  `AW.social_station?` holds. A blocked or locked-out station is still counted, a missed warning;
  a borrowed PC is not modelled, and the comment says so. Through `errand_producers` the same rule
  adds the slot room of an owned station print. Test 32: Q1, Q1c, Q1d and Q5 pass; a thirst-only
  NPC and a `needsHome` that is no desk still warn. The rest of `can_use?` is unchanged, so no
  other rule picks up the station.
- **m2, fixed.** `printer_off_turn_back?` reads each hook's producer list with the rooms of its
  hook object. In a list of two or more, a producer with no world object, or one in a room other
  than the hook object's room, counts as off (as `_pickProducer` treats a producer in an unloaded
  room); a producer in the hook object's room still needs an `offWhen`. A list of one is unchanged.
  Test 33: Q2 and an unknown second producer pass; a never-off producer in the hook's room, a list
  of one in another room and a lone unknown producer still warn.
- The notes (offWhen truthiness, a takeable room magnet, the object form of `eventMappings`, chasers
  and `patrolOverride`) are left as missed warnings.
- Runs: the V10 node test 34 of 34; `validate_scenario.rb --skip-ink --no-graph` on
  `test_needs_sims` and `m02_ransomed_trust` exit 0 with 0 errors and no V10 line; the corpus run
  (180 scenarios) gives 0 failures and 0 V10 warnings. The same commit rewrites the V10 warning
  text for the design review R2 (its "V10 outcomes" subsection).
