# SIMS-5 review, round 1: code (V10)

Branch `build/ol-sims`, tip `ed0a5cd1f` (main's E7 to E9 chatter merged). Read: the agent brief,
plan 5.5, build log SIMS-5, `scripts/validate_office_life.rb`, its hook in
`scripts/validate_scenario.rb` (43, 8173), the `ValidateNpcNeeds` helpers it reuses,
`test/js/validator-office-life-v10.test.mjs`, and `npc-needs.js` at every `_pickBark(` and
`_grumble(` call site, `chatterPool`, `_maybePair`, `_tickQueueChats`, `_tickChats`,
`_findExchange`, `_chooseCall`, `_claimAnswerer`, `_tickNews`, `_newsHearers`, `_sight`,
`_avoidedAt`, `_avoidRadius`, `_recheck`, `_turnBack`, `_grumbleTopic`, `_failTopic`.

Each finding below was confirmed by running `ValidateOfficeLife.check` on a small fixture (script in
the session scratchpad, `officelife-sims/s5-review/probe.rb` and `probe2.rb`).

## Runs

- `bin/test-js test/js/validator-office-life-v10.test.mjs`: PASS.
- Corpus: `ruby scripts/validate_scenario.rb --skip-ink --no-graph` on all 180
  `scenarios/*/scenario.json.erb`. All finished with exit 0. No "could not run" line, no
  V10 error, **0 V10 warnings**. The tree was unchanged after the run: no graph or other file
  was rewritten. (m10_full_disclosure takes about 87 s; it hit a 120 s timeout on the first sweep
  and ran clean on the rerun.)
- The odd-data fixtures did not crash. They covered `needs` as an array, `chatter` as a string,
  pools as a string or `{ lines: "x" }`, `nil` and number entries in `avoids`, `groups` as a
  string, `exchanges` as a Hash, `nil` and number knots in `phoneCalls`, a missing `needsHome`
  target, `needsHome: { room: 5 }`, rooms with `npcs: nil` or a `nil` room, an NPC with no id,
  `"chatter": false`, `officePresets: true` with a preset, and `servings: "lots"`.

## Findings

### B1 (blocker). The `grumble` rule differs from the engine in both directions, and the owned showcase has five dead pools that pass

`scripts/validate_office_life.rb:142-162, 201-222, 351-364`.

The engine says `grumble` in these cases:

- An `avoid` turn-back. `_recheck` returns at once unless the turning NPC's own `_avoidRadius > 0`.
  That radius is 2 only for an NPC that declares `needsCompany.avoids` (or sets `avoidRadius`);
  an NPC with no `needsCompany` has radius 0. `_avoidedAt` looks at any use object (not only
  chatter objects). It counts any avoided NPC that is using it, queued for it, or standing within
  the radius ("any NPC counts, needs or not"). The avoid test is `_avoids` only; groups play no
  part. A `requireGlobal` avoid counts while its global holds.
- An `off` or `gone` turn-back when `grumble_off` / `grumble_gone` has no lines for that NPC.
  `_grumbleTopic` falls back to `grumble`.

V10 instead treats `!compatible?` as a turn-back, which counts group mismatch. It ignores the
turner's radius. It looks only at chatter objects and needs both NPCs to be able to use them. It
skips `requireGlobal` avoids. It never counts the off/gone fallback. Fixtures:

- False passes. Two NPCs in disjoint groups at a cooler, no avoids. An NPC `a` whose only link is
  that `b` avoids `a` (`a` has radius 0, so `a` never turns back).
- False warnings. `a` avoids `b` at a fridge with no `chatter`. `a`'s only avoid is
  `{ npc: b, requireGlobal: feud }`. A `grumble` pool with an `offWhen` cooler and no
  `grumble_off` lines. The same with a finite magnet and no `grumble_gone` lines.

In `test_needs_sims`, Amara, Tom, Grace and Rosa have no `needsCompany` and Marek has
`avoidRadius: 0`, so none of them can make an avoid turn-back. The scenario's `grumble_off` and
`grumble_gone` pools have lines, so their off/gone turn-backs speak those pools. Their own
`grumble` pools (one line each, five in all) can never be spoken. Only Sanjay's own `grumble` and
the scenario `grumble` pool can. V10 passes all five. The pin at
`test/js/validator-office-life-v10.test.mjs:159-161` (`deepEqual(..., [])`) locks the false pass
in. The plan's live-proof rule ("every pool V10 passes is spoken at least once") would fail on
these five.

Fix: model the engine's rule. `grumble` for NPC `n` is triggerable when any of these holds:

1. `n` has an avoid radius > 0, and there is a use object `n` may use (any affordance that
   satisfies one of `n`'s needs, not `n`'s own `needsHome`) whose room some NPC `m` can be in,
   where `avoids_one_way?(n, m) || avoids_one_way?(m, n)` and `requireGlobal` entries count.
2. An off or gone turn-back exists for `n` (the existing `off_turn_back?` / `gone_turn_back?`), and
   `n`'s merged `grumble_off` / `grumble_gone` pool (scenario plus own) has no lines.

For a scenario pool, "any NPC". Keep `compatible?` for pairing only. Then re-pin
`test_needs_sims` with the five warnings, or fix the scenario: give those NPCs a reason to turn
back, or drop the lines. The plan's scenario step says to resolve them. Add node fixtures for
each direction above.

### M1 (major). A chatter-object topic with no such object, and `news` with no magnet, pass as "another subsystem"

`scripts/validate_office_life.rb:341-347`.

`known_engine_topics` is every key of `PICTURE_CHATTER`, so it holds `coffee`, `cooler`, `greet`
and `news`. When no object carries that `chatter` value, `ctx.by_topic.key?(topic)` is false and
the topic falls through to the blanket pass. Fixtures: a `greet` pool with no greet object, a
`coffee` pool with no coffee object, and a scenario `news` pool with no magnet all pass with
"spoken by another engine subsystem (work failures or access workarounds); outside V10". That
reason is wrong for all four, since the needs engine speaks them itself. It also breaks the plan
rule "`greet` needs an affordance with `chatter: "greet"`".

Fix: limit the blanket pass to the access/workaround and work-failure topics (`usb_refused`,
`station_fail`, `social_blocked`, `work_fail*`, `wk_*`, `login_aloud`). Read them from
`PICTURE_CHATTER` minus an explicit office-life set (`coffee cooler greet news` plus
`GRUMBLE_TOPICS` and `PHONE_TOPICS`). A chatter-object topic with no object goes to
`chatter_pair?`, which warns. `news` is `_tickNews`'s default (`m.cfg.announce || 'news'`), so it
is triggerable only through a magnet with no `announce`, judged by the announce rule (M3). Add
node fixtures for `greet`, `coffee` and `news` with nothing to trigger them.

### M2 (major). Colleague phone rules do not read `answersPhones` and use leash reach instead of the engine's same-room rule

`scripts/validate_office_life.rb:283-293, 329-335, 432`.

`_claimAnswerer` takes only an NPC with `answersPhones === true`. The NPC must be in the phone's
room, its home room must be that room, it must not avoid the owner (either way) and it must be
reachable. `onPhoneRing` ignores a phone whose `owner` is not a String. V10's
`answers_rung_phone?` never reads `answersPhones` and accepts any NPC whose leash reaches the
phone's room. `owners_of` also accepts an owner list.

- Fixture: `b`, with no `answersPhones`, in the room of `a`'s rung phone. `b`'s `phone_message`
  pool and its `phoneCalls` knot both pass, though neither can play.
- Fixture: a phone with `owner: ["a"]`. `a`'s `phone` pool and `phoneCalls` pass, but the engine
  logs `ring_ignored: no_phone`.

The showcase is not affected (Amara sets `answersPhones` and shares Tom's room).

Fix: in `answers_rung_phone?` require `n['answersPhones'] == true`, `ctx.home_room[n['id']] ==
p.room`, and no `avoids_one_way?` either way with the owner (`requireGlobal` permissive). Count a
phone only when `p.data['owner']` is a non-empty String, in `owns_rung_phone?` too. Add the two
fixtures.

### M3 (major). The announce rule does not match `_tickNews`, and node test 9 asserts a pass the engine cannot speak

`scripts/validate_office_life.rb:366-377`; `test/js/validator-office-life-v10.test.mjs:127-132`.

`_tickNews` needs several things:

- The teller knows the magnet. `_sight` gives that to any NPC that is in the magnet's room, need
  or not, or a hearer is told it.
- The teller is in its own home room.
- That room is not the magnet's room (`o.roomId === pos.roomId` skips it).
- At least one hearer (`_newsHearers`) is present: another NPC in the same room, within
  `newsRadius`, not knowing, not avoided either way. With no hearer: "no line, no picture, no TTS
  request".

V10 asks only that some NPC with a need the magnet satisfies can reach the magnet's room. Test 9
uses one NPC whose home room is the magnet's room. The engine never announces there: there is no
hearer, and the room is the same. Yet the test asserts no warning. The need test also gives
false warnings: an NPC with no hunger that walks past the cake can still tell people.

Fix: an announce pool for teller `n` is triggerable when all of these hold:

- `n` can be in the magnet's room (its leash reach includes it). A room-less inventory magnet
  stays permissive.
- `n`'s home room differs from the magnet's room.
- Another NPC `m` shares `n`'s home room (or can be in it) and neither avoids the other
  unconditionally.

Drop the need test. Rewrite test 9 with a teller whose home is outside the magnet's room plus a
hearer at home (no warning), and keep the lone same-room case as a warning.

### m1 (minor). Duplicate-knot check: misses two cases, false-warns a mirrored entry, and repeats itself

`scripts/validate_office_life.rb:382-399, 422-437`.

`_exchangeHeard` is shared by exchanges and calls (`_exPlayed` and `heard_<knot>`). Three gaps
follow from how V10 checks it:

- An exchange knot that is also a `phoneCalls` knot gives no warning (fixture M).
- One NPC using the same knot in two entries, with two partners, gives none either (fixture O).
- `a` listing `k2` with `b` while `b` lists `k2` with `a` is one exchange and harmless, yet it
  warns, and the warning is printed once per entry (twice for two NPCs; fixture N).

Fix: build one map from knot to its `[npc, kind, with]` entries over both lists, and warn once per
knot when it has more than one entry. A mirrored pair (the same two NPCs naming each other) is
exempt.

### m2 (minor). `pairs?` and `can_use?` are more permissive than the engine in a few places

`scripts/validate_office_life.rb:56-67, 176-181, 236-250`.

- Any Hash `queue` counts, but `_queueCfg` needs a non-empty `cells` array of `{dx, dy}`, so
  `queue: {}` passes and never queues.
- Objects in an NPC's `itemsHeld` and in `startItemsInInventory` count as usable chatter objects
  in the world (fixture P: a cooler held only by an NPC passes).
- `gone_turn_back?` does not check that the NPC's leash reaches the magnet (fixture U).

Fix: count a queue only when `cells` holds one valid offset. Skip `itemsHeld` and inventory objects
for chatter pairing, and keep them only for magnets. Test the leash reach in `gone_turn_back?`.
Each is a small false pass.

### m3 (minor). Warning reason text is ungrammatical

`scripts/validate_office_life.rb:363`.

`"no #{reason} can happen"` with reason "an avoidance turn-back" gives "(no an avoidance
turn-back can happen)". It also gives "no a magnet that runs out" and "no a print with every
listed printer off". An author reads this first.

Fix: give the reasons without the article ("avoidance turn-back", "magnet that runs out" and so
on) and print "no #{reason} can happen". It would also help to end each pool warning with the
fix: "give it a partner or trigger, or remove the lines".

### m4 (minor). Stale build log and stale line references

`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:337-349` says the three cooler pools were "left in
place and pinned, not edited". Commit `3f4068967` re-keyed Amara's and Tom's to `coffee`, dropped
Marek's and unpinned the test (now `[]`).

The engine line numbers in the validator header and comments
(`scripts/validate_office_life.rb:9, 22-26, 122-123, 134`) predate the E7 to E9 merge:

| Function | Comment says | Now |
|---|---|---|
| `_pickBark` | 2740 | 2755 |
| `_maybePair` | 3972 | 4008 |
| `_tickQueueChats` | 4575 | 4624 |
| `_chooseCall` | 4278 | 4327 |
| `_compatible` | 3953 | 3989 |
| `onPhoneRing` | 4124 | 4173 |
| `desk_phone_ring:*` listener | 5456 | 5523 |

Fix: update the log paragraph, and its count once B1 lands. Cite function names rather than line
numbers in the Ruby comments.

### m5 (minor). Test coverage gaps

`test/js/validator-office-life-v10.test.mjs`.

- No fixture for an `exchanges` knot shared by two NPCs. Plan 5.5's behaviour names it, though its
  node list names only `phoneCalls`.
- The `queue: false` case sits on a hand-written affordance with `officePresets: false`, so it
  never tests the preset path (`queue: false` over a preset's queue), which is what the plan's
  coffee-station wording is about.
- Test 13's "raises no error" is weak, because V10 emits only warnings: the guard that matters is
  the exit-status assert.
- `lab_physical_pentest` is skipped silently when `json-schema` is missing.

Fix: add the exchange-duplicate fixture and a preset fixture (`officePresets: true`, coffee preset,
own `queue: false`). Log a visible skip note for `lab_physical_pentest`. Add the fixtures listed
under B1, M1, M2 and M3.

### Note (no change). Plan wording

Plan 5.5 lists "a queue" among the turn-backs for `grumble`. The engine has no such grumble:
`_leaveQueue` on `max_wait` leaves without speaking. V10 is right not to count it. The plan text
could drop it.

## What is right

- The hook is one line beside `ValidateAccessWork` and runs under the `run_check` rescue.
- It reads format 3 names only (`needsHome`, `needsCompany`, `needsRooms`, `needsAvoidRooms`,
  `needsPrivateTo`, `owner`, `private`, object-level `offWhen`, `deskPhone`).
- Pairing is mirrored correctly: `_maybePair` needs capacity 2+, and the queue chat in
  `_tickQueueChats` adds the queued front. `chatterPool` merging (a scenario pool warns only when
  no NPC can trigger it) is handled correctly, and so is the exchange route through either chat.
- No crash on any odd data tried. `grumble_off`, `grumble_gone` and `grumble_printer_off` are
  judged by their own rules.

## Verdict

**Not ready.** B1 has to land, re-pin or resolve the five showcase pools, and come with fixtures
before SIMS-5's live proof is run, because that proof would otherwise fail on V10's own passes.
M1 to M3 are false passes of the kind V10 exists to catch and should land in the same round. The
minors can follow.

| Severity | Count | Items |
|---|---|---|
| Blocker | 1 | B1 |
| Major | 3 | M1, M2, M3 |
| Minor | 5 | m1, m2, m3, m4, m5 |
