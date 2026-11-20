# SIMS-5 review, round 2: code (V10)

Branch `build/ol-sims`, tip `fd9842b83`, worktree `p-ol-sims`. Read: AGENTS.md, plan 5.5, the build
log sections "SIMS-5" and "SIMS-5 R1 and SIMS-4 R3 review fixes", the R1 review
(`OFFICE_LIFE_SIMS_S5_REVIEW_R1_CODE.md`), `scripts/validate_office_life.rb`, its hook in
`scripts/validate_scenario.rb` (43, 8121), the `ValidateNpcNeeds` helpers it reuses
(`collect`, `expand_presets`, `use_rule`, `leash_rule`, `leash_reach`, `owners_of`, `pool_lines`,
`check_phones`), `test/js/validator-office-life-v10.test.mjs`, and in `npc-needs.js`: `register`,
`normaliseNeed`, `normalisePool`, `chatterPool`, `magnetOf`, `onItemDropped`, `_shownMagnets`,
`_magnetsFor`, `_sight`, `_tickNews`, `_newsHearers`, `_avoidRadius`, `_avoidedAt`, `_recheck`,
`_turnBack`, `_grumble`, `_grumbleTopic`, `_judged`, `_failTopic`, `_advanceJob` (off and gone
turn-backs), `_avoidsOneWay`, `_compatible`, `_maybePair`, `_tickChats`, `_findExchange`,
`_exchangeHeard`, `onPhoneRing`, `_tickRings`, `_ownerCanAnswer`, `_claimAnswerer`, `_chooseCall`,
`_queueCfg`, `_balks`, `_tickQueueChats`, the live adapter's `npcIds` and `npcPos`, and
`npc-workarounds.js` (`START_POOLS`, `ALOUD_POOL`).

Each new finding was confirmed with a fixture run through `ValidateOfficeLife.check` (scripts in the
session scratchpad, `s5r2/probe.rb` and `probe2.rb`; fixture letters below refer to them).

## Runs

- `node test/js/validator-office-life-v10.test.mjs`: 18 of 18 pass, 3.6 s.
- `ruby scripts/validate_scenario.rb <s> --skip-ink --no-graph` on `test_needs_sims` and
  `m02_ransomed_trust`: exit 0, 0 errors, no V10 warning, no "could not run" line.
- Corpus: all 180 `scenarios/*/scenario.json.erb` rendered through `render_erb_to_json` and passed
  to `ValidateOfficeLife.check` alone. No render or check failure, 0 V10 warnings anywhere. V10's own
  time over the whole corpus is 0.06 s; the slowest is `m10_full_disclosure` at 14 ms (75 NPCs).
  Performance is not a concern.
- The tree was unchanged after the runs (only the untracked `node_modules` link).

## R1 findings: closure

| R1 | Status | Where it is closed |
|---|---|---|
| B1 grumble rule | Closed as specified | `avoid_turn_back?` 287-302 (radius, deferrable needs, any use object but `needsHome`, avoids either way with `requireGlobal` counted, groups ignored); `grumble_for?` 342-352 (off and gone fall back only when the merged pool is empty); `off_turn_back?` 305-310 skips judged needs; `compatible?` 192-198 used for pairing only. The five dead showcase pools were removed and the pin stays `[]`. The "can be at the source" half still uses the loose `can_be_in?` (M2). |
| M1 blanket "other subsystem" pass | Closed | `OFFICE_TOPICS` 34, `other_subsystem_topic?` 55-58, ordering 486-491: `greet`, `coffee`, `cooler` with no object and `news` with no plain magnet now warn (test 15). The access topics match `START_POOLS`, `ALOUD_POOL` and `_failTopic`'s `work_fail_<kind>`. |
| M2 colleague phones | Closed as specified | `answers_rung_phone?` 366-376 (`answersPhones == true`, home room equals the phone's room, no avoid either way with the owner); phones need a non-empty String owner, 117 (test 16). The registration gap (M1 below) is new. |
| M3 announce rule | Closed as specified | `news_tellers` 384-412 (knower by `_sight` or word, home room not the magnet's room, a hearer neither avoids, hearers become knowers); test 9 rewritten. The rule still accepts tellers and hearers the engine cannot produce (M1, M2 below), and test 9 asserts two such passes. |
| m1 duplicate knots | Closed | One map over exchanges and calls, one warning per knot, mirrored pair exempt, 496-540 (test 17). |
| m2 queue cells, held objects, gone leash | Closed | `queue?` 249-254; held objects split from world objects, held magnets kept as sources, 63-80 and 100-101; `gone_turn_back?` goes through `can_use?`, so the leash and privacy rules apply (test 18). |
| m3 reason text | Closed | `GRUMBLE_REASON` 448-456 and the reasons at 469-491 are whole phrases; `POOL_FIX` ends each pool warning. One nesting nit remains (m7). |
| m4 stale log and line numbers | Closed | Build log step 1 marked superseded; Ruby comments cite functions only. |
| m5 test gaps | Closed | Tests 14 to 19 added; test 13 relies on the exit status and prints a skip note for `lab_physical_pentest`. New gaps in m6. |

## Findings

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | M1, M2 |
| Minor | 7 | m1 to m7 |

None of the findings changes V10's output on any committed scenario (the corpus gives 0 warnings
before and after), so the SIMS-5 live proof on the showcase is not at risk. They are false passes of
the kind V10 exists to catch, and two of them are locked in by test 9.

### M1 (major). NPCs the needs engine never runs count as tellers, hearers, phone owners, answerers and avoided NPCs

`scripts/validate_office_life.rb:229-236, 293, 300, 360-362, 366-376, 387, 397`.

The needs engine runs an NPC only if `register` accepts it: a `needs` or `interests` block with at
least one entry that survives `normaliseNeed` (`decayPerMin > 0` and `urgentAt > 0`). Every rule V10
mirrors then reads `this.states`:

- `_newsHearers` loops over `this.states`, so an NPC with no needs never hears news, and `_tickNews`
  runs per state, so it never tells.
- `_tickRings` takes the owner from `this.states.get(r.ownerId)`. An owner with no needs is
  `undefined`, never answers, and the phone rings out. Its `phone` pool and its `phoneCalls` never play.
- `_claimAnswerer` loops over `this.states`, so an `answersPhones` NPC with no needs never claims.
- `_avoidedAt` counts any NPC with a sprite, needs or not, but skips one with no position
  (`npcPos` is null without a sprite). A phone contact (`npcType: "phone"`, listed in a room's `npcs`,
  as m02 does three times) is never avoided.

V10 reads `ctx.npc_list`, which holds every NPC in every room's `npcs`, and `can_be_in?` returns true
for an NPC's home or start room whatever it is. Fixtures, each giving no warning:

- A: phone owner `a` with `needsHome` but no `needs`, a rung phone, `chatter.phone` and a
  `phoneCalls` knot. Neither can play.
- B: colleague `b` with `answersPhones: true` and no `needs`, in the room of `a`'s rung phone, with a
  `phone_message` pool. It never claims.
- Phone NPC: `a` avoids `"*"`, has a `grumble` pool, and the only other NPC in the room is a phone
  contact. V10 passes the grumble; with the contact removed it warns.
- F: the only partner at a cooler has `thirst: { decayPerMin: 0, urgentAt: 40 }`, which
  `normaliseNeed` drops (the NPC is not registered). The speaker's `cooler` pool passes.
- Test 9, first case (`test/js/validator-office-life-v10.test.mjs:131-141`): hearer `b` is commented
  "no needs: it stays at its desk and hears". The engine never tells `b`, yet the test asserts no
  warning.

Fix: add `runs?(n)`, true when `needs` holds one entry with numeric `decayPerMin > 0` and
`urgentAt > 0`, or `interests` holds one entry. Require it of tellers and hearers in `news_tellers`,
of the owner in `owns_rung_phone?` and of the answerer in `answers_rung_phone?`. In
`avoid_turn_back?`, keep NPCs with no needs but drop phone contacts (`npcType == "phone"`). Add
fixtures A, B, F and the phone contact, and rewrite test 9 (see M2).

### M2 (major). `can_be_in?` gives any NPC with a need its whole leash reach

`scripts/validate_office_life.rb:229-236`, used at 300 (avoided NPC at a source), 387 (who sees a
magnet) and 397 (who hears at the teller's home).

The needs engine only moves an NPC to a target: a source for one of its needs that it may use
(`_select`), a magnet it already knows of (`_magnetsFor` reads `s.knows`), a print errand or an
interest item. Idle NPCs stay at their post, and nothing in `npc-needs.js` wanders. V10 instead puts
any NPC with a non-empty `needs` in every room its leash reaches.

- C: magnet in the kitchen; `a` and `c` live in the office, both with `thirst`, and the only thirst
  source is the office cooler. Nobody has a reason to enter the kitchen, so nobody sees the magnet,
  yet the scenario `news_cake` pool passes.
- D: `a` avoids `b`, `a` drinks at a kitchen cooler, and `b` only needs caffeine, served in the
  office. `b` is never in the kitchen, so `a` never turns back, yet `a`'s `grumble` passes.
- Test 9, first case (test lines 131-141): `a`'s only hunger source is the cake itself, which it can
  learn of only by seeing it in the kitchen it has no other reason to enter. This is circular: it
  never learns and never tells. The test asserts no warning.
- Test 9, third case (test lines 147-157): `a` has `thirst` and no thirst source anywhere, so it
  never leaves the office. The test asserts its `news_cake` pool passes. The comment at 147 also
  describes a different fixture ("b has no hunger, but sees the cake in its own room and tells c next
  door").

Fix: build each NPC's room set once. It holds the home and start rooms, the rooms of world objects
it may use for any of its needs (`can_use?`), the rooms of print producers for its print habit and
mappings, and, for a patrol, its leash reach. Count a fixed magnet's room only when the NPC reaches it
by one of those routes, or is told of it (the knower set `news_tellers` already builds). A held
(droppable) magnet stays permissive, since the player places it. Rewrite test 9 so that the passing
case gives the teller a real reason to enter the magnet's room (a fridge there for its hunger) and a
hearer with needs. Turn the two current passes into warning cases, and add fixture D.

### m1 (minor). A listener for a ring counts as a ringer

`scripts/validate_office_life.rb:142-152`.

`ring_targets` takes any string anywhere in the scenario that equals `desk_phone_ring:<id>`. An
`eventMappings` entry with `"eventPattern": "desk_phone_ring:pa"` (an objective that listens for the
ring) makes `pa` count as rung. Fixture E: no emitter, and `a`'s `phone` pool passes. Fix: collect
only emitters (a mapping's `emitEvent`, an action's `event_name`, a needs hook's `emitEvent`), or at
least skip values under `eventPattern`.

### m2 (minor). `grumble_gone` ignores knowledge and string servings

`scripts/validate_office_life.rb:314-316, 385`.

- The engine targets a magnet only once the NPC knows of it (`_magnetsFor`), so a world magnet in a
  room the NPC never visits, and that nobody tells it about, can never turn it back. V10 passes
  `grumble_gone` on `can_use?` alone. This is the same gap as M2, and the knower set fixes both.
- `magnetOf` reads `Number(servings)`, so `"servings": "0"` is zero servings: never a source and
  never gone. Fixture H passes `grumble_gone`. `news_tellers` (385) checks only a Numeric value too.
  Fix: read servings as `Float(v, exception: false)`, floored and clamped as `magnetOf` does.

### m3 (minor). `maxQueue: 0` partners never queue

`scripts/validate_office_life.rb:258-263, 267-279`.

`_balks` refuses a queue of length `>= maxQueue`, so an NPC with `maxQueue: 0` never joins one (the
needs validator says so: "0 never queues"). On a capacity-1 queued object, a pair where the only
possible second user has `maxQueue: 0` never chats. Fixture G passes. Fix: for a capacity-1 object,
`pairs?` through the queue needs at least one of the two to have no `maxQueue` of 0.

### m4 (minor). Container contents count as room sources

`scripts/validate_office_life.rb:70`, through `ValidateNpcNeeds.collect` (which walks `contents` and
`itemsHeld`).

A cooler inside a locked safe's `contents` pairs two NPCs (fixture I). A container's contents only
reach the room as items the player takes. They are not objects an NPC walks to, so this is very
likely a false pass. Fix: collect only top-level room objects as `world`, and treat contents like
held items (magnets only, which `onItemDropped` places).

### m5 (minor). The mirrored-pair exemption misses a group `with`

`scripts/validate_office_life.rb:535-540`.

`a` lists knot `k` with `b`, and `b` lists `k` with `group:g`, where `a` is the only member of `g`.
This is one exchange between one pair, but it warns (fixture J). The warning is right when `g` has
other members, so the fix is narrow: expand a group `with` to its members before comparing.

### m6 (minor). Test gaps and a stale comment

`test/js/validator-office-life-v10.test.mjs`.

- No case for `grumble_printer_off`, for a judged need's off turn-back (a `work` plan) being left out
  of `grumble_off`, for a `deferrable: false` need being left out of the avoid rule, or for the default
  `news` topic passing with a magnet that has no `announce`.
- No case for an NPC with no needs, or a phone contact, as a teller, hearer, owner, answerer or
  avoided NPC (M1).
- The comment at 147 does not match the fixture built at 148-155 (M2).
- The two pins (316-322) read `scenario.json.erb` with `JSON.parse` and no render. That works today
  only because the files hold no ERB tag. A future tag turns the pin into a parse failure instead of a
  V10 check. Use the render path test 13 already uses.
- Test numbering in the comments runs 1 to 11, 14 to 19, then 12 and 13, which is confusing to read.

### m7 (minor). Nested parentheses in the grumble warning

`scripts/validate_office_life.rb:450, 433, 442`.

The reason is printed inside the warning's own parentheses, so an author reads "(no avoidance
turn-back (that needs an avoid radius and an avoided NPC who can be at a source this NPC uses), and no
off or gone turn-back falls back to it)". Fix: use a colon or a comma inside the reason.

## Notes (no change asked)

- Plan 5.5 sizes V10 at about 110 validator lines. The file is 558, since R1 asked for the full
  engine rules. Update the plan's size line when the slice closes.
- The hook is still one line under `run_check`. V10 reads format 3 names only, and no odd-data
  fixture tried in this round raised an error.

## Verdict

**All nine R1 findings are closed as R1 specified them.** V10 is not yet an exact mirror, because
of two majors in the reach and registration model. M1: NPCs the engine never runs count as tellers,
hearers, owners, answerers and avoided NPCs. M2: any NPC with a need is placed in every room its
leash reaches. Two assertions in test 9 lock in passes the engine cannot speak. Neither major changes
the output on any committed scenario, so the live proof can go ahead. M1, M2 and the test 9 rewrite
should land before V10 is called done, with m1 to m4 in the same round if they are cheap. m5 to m7
can follow.

## Outcomes

Every finding was checked against `npc-needs.js` first (`register`, `normaliseNeed`,
`normaliseInterest`, `_newsHearers`, `_tickNews`, `_sight`, `_magnetsFor`, `_magnetBarred`, `_select`,
`_tickRings`, `_claimAnswerer`, `_avoidedAt`, `_balks`, `_maxQueue`, `magnetOf`, the live adapter's
`listObjects` and `npcPos`) and every one holds. None is withdrawn or deferred. All ten probe
fixtures (A to J, and the phone contact) now warn, or for J stop warning, as the review says they
should. File lines below are `scripts/validate_office_life.rb` unless a test is named.

| Finding | Outcome | Where |
|---|---|---|
| M1 | Fixed. `runs?` (268) mirrors `register`: a need that survives `normaliseNeed` (`needs_of`, 250) or an interest with weight above 0, and not a phone contact. Owners (`owns_rung_phone?`, 499) and answerers (`answers_rung_phone?`, 506) must run; the owner avoid is checked only for a running owner, as `_claimAnswerer` reads it from `this.states`. Tellers and hearers are running NPCs (`news_pairs`, 348). Pair partners lose dropped needs through `needs_of`. `avoid_turn_back?` drops phone contacts and keeps NPCs with no needs (436). | Test 20 (fixtures A, B, F, phone contact, plus a colleague answering for a phone-contact owner) |
| M2 | Fixed. `build_rooms` (303) gives each NPC its home and start rooms, the rooms of world objects it may use, its print producers' rooms, and its whole leash reach only for a patrol, an interest or a work plan. Fixed magnets are learnt by sight or word and add their room once known and usable, repeated to a fixpoint. `can_be_in?` reads that set; `can_use?` (370) bars a fixed magnet the NPC does not know of. Held magnets stay permissive. Test 9 rewritten: the passing case gives the teller a kitchen fridge and a hearer with needs; the circular case and the thirsty-teller case now warn; the stale comment is gone. | Test 9; test 21 (fixture D, its passing twin, and a patrol) |
| m1 | Fixed. `ring_targets` (178) reads only `emitEvent` and an `emit_event` action's `event_name`. | Test 22 (fixture E, and an emitEvent that rings) |
| m2 | Fixed. `servings` (153) follows `magnetOf` (`Number`, clamp 0 to 1000, floor, default 1); magnets with no servings are dropped from sources, magnets and news. `grumble_gone` now needs a known magnet through `can_use?`. | Test 22 (fixture H, `"2"`, and a magnet in a room the NPC never enters) |
| m3 | Fixed. `max_queue` (388) mirrors `_maxQueue`; `pairs?` (398) for a capacity-1 queue needs one of the pair to have a `maxQueue` other than 0. | Test 23 (fixture G and its passing twin) |
| m4 | Fixed. `check` (60, 74) takes top-level room objects as world; contents and an object's `itemsHeld` go to the held list (magnets only). | Test 23 (fixture I) |
| m5 | Fixed. `mirrored_pair?` (650) expands a group `with` and accepts it when the partner is its only other member. | Test 24 (fixture J, and a group with a third member, which still warns) |
| m6 | Fixed. New cases for `grumble_printer_off`, a judged work need left out of `grumble_off`, `deferrable: false` left out of the avoid rule, the default `news` topic, and NPCs with no needs or phone contacts in every role. The pins render the ERB through `ScenarioBinding` before checking (`checkFile`), so they no longer need the json-schema gem. Tests 12 and 13 moved after 11, so the numbering reads in order. | Tests 12, 13, 20 to 25 |
| m7 | Fixed. The `grumble` reason (`GRUMBLE_REASON`, 562) is one phrase with commas; test 24 asserts no nested parentheses. | Test 24 |

One side fix: reading print producers for every running NPC reached a mapping whose `needs` is a
string (`test_needs_attack`), which raised in `dig`. `print_producers` now checks each level is a
Hash.

Runs after the fixes: the V10 node test passes 24 of 24. `validate_scenario.rb --skip-ink
--no-graph` on `test_needs_sims` and `m02_ransomed_trust` exits 0 with output identical to this
review's runs. The corpus (all 180 rendered `scenarios/*/scenario.json.erb` through
`ValidateOfficeLife.check`) gives no render or check failure and 0 V10 warnings, as before; V10's
total time is 0.04 s.
