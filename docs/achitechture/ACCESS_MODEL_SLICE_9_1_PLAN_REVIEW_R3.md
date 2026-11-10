# Access model slice 9.1 plan: adversarial review, round 3

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` as revised after round 2 (commit
`c6a163ffa`), against the code on branch `claude/break-escape-access-design-090sjx` and against
the sibling plans as committed at the same point (`ACCESS_MODEL_SLICE_9_2_PLAN.md`,
`ACCESS_MODEL_SLICE_9_3_PLAN.md`, `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`). Nothing was run;
every finding is from reading code and documents. No server was touched.

**Counts: 0 blockers, 2 majors, 12 minors.**

**Verdict in short.** Both round 2 majors are closed. `holdsDoors` is now wholly in step 5, behind
a five-line contract that matches the engine plan's item 3 as written, and the build order and
shared files agree with all three siblings. Every round 2 minor is taken up. The two new majors
are both in the validator (step 3): the `guessable` test still lets a short word through with no
source, which is the round 1 fairness hole in a smaller form, and the validator's severities for
lock rolls and lock-dependent mappings contradict each other and the feature scenario's own
expected output. Steps 1 and 2 can start now. Steps 3 and 4 need the two majors written in first.
Step 5 is ready to start once E1 is committed, with four small clarifications.

## Round 2 findings

### Majors

| # | Round 2 finding | Resolved? | Evidence |
|---|---|---|---|
| N-M1 | `holdsDoors` built in step 1 before its dependency; tests written for an old version of item 3 | **Resolved.** | Step 1 says "Nothing about `holdsDoors` or gates is built here" (plan line 773) and its unit test asserts `holdsDoors` is an unknown habit at that step (:790). 4.1, 4.2, 4.4, 5.1 and 7.1 mark every `holdsDoors` and `noHold` item "(step 5)". Section 3 records why (:189), and 17 declines carrying unbuilt names (:1365). 5.4 now states the contract in five lines (:459-468), names `blocksPlayer(g, { playerRoom, now })` and the 4 s bump, and step 5's tests and H9 assert "shut or solid, never open and passable" (:949-951, :1045), which matches the engine plan's body rule (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, `blocksPlayer = !g.open \|\| (!openToPlayer(g, now) && playerRoom !== g.securedRoom)`, and the skipped hold). Section 16 says X1 is recorded and decided in the engine plan (:1321). Two small leftovers are R3-m4 and R3-m5. |
| N-M2 | Build order and shared-file list out of date | **Resolved.** | The order 9.3a, then 9.1, then 9.2 is in the header (:10), section 3 (:183), 14 (:1202) and 14.5. The shared-file table in 15 (:1292-1306) agrees row for row with the engine plan's "Files shared with the sibling plans" and with 9.3's section 14 table (9.3 plan :1339-1351). Section 2 says line numbers are as of `210e48eec` and are to be found again by method name (:53-55). Steps 2 and 6 say which earlier edits land in the same methods and to re-read them. One row is incomplete and two sibling texts are now stale (R3-m10). |

### Minors

| # | Resolved? | Where |
|---|---|---|
| n1 scanner exception for the note | Yes | Section 6 (:553-557) and step 6 (:965-968, :979-983): `$.postitNote` only, `pc_id` from the answer, the scanner handed the game, the shared-password fixture. The checker already runs under `bin/rails runner` and holds the game (`tools/playtest/access-leak-check.rb:4`, `:26`), so handing it over is one argument. |
| n2 NPC record definition | Yes | Section 6 (:561-564), step 6 fixture. |
| n3 saved-note wording | Yes | Section 6 (:558-560): "an earlier response line, in any of the files given and in the order given". |
| n4 saving the note closes the screen | Yes | 5.3 (:428-434), H3 (:1039), 17 (:1339). |
| n5 `zeitwerk:check` | Yes | Step 1 loader test (:802-805) and step 3 Clues test (:887-888). |
| n6 nil `needsHome` matches nil id | Yes | 5.2 (:358-361), step 1 test (:795-796). |
| n7 implicit `staff` role | Yes | Section 4 (:228-231), step 1 test (:787-789). Matches `identity_roles` (`lib/break_escape/access_identities.rb:60-66`). See R3-m8 for one sentence it still needs. |
| n8 note picture | Yes | 5.3 (:419-426): sign-in PCs only, top-left, depth stated; section 12 persona question (:1147-1148). |
| n9 `lastGuards` gaps | Yes | 5.4 (:486-493): `nearGuardIds`, set in `open`, never added while shut; step 5 test (:946-947). |
| n10 `guessable` matching | Partly | Whole words, digit runs and years, scope exclusions and the symbol count are in (7.2, :639-653). The parts rule still skips short runs: R3-M1. |
| n11 `password` in presets | Yes | 4.2 (:268), section 3 (:187), 17 (:1368). |
| n12 `never` with a lock mapping | Partly | The warning now covers 0 (7.2, :613-617), but it reads the lock chance alone and ignores policies: R3-M2. |
| n13 note edge loop | Yes | 7.3 (:691-693), step 4 test (:912-913). |
| n14 a gate keeps no secret | Yes | 5.3 (:444-447), 5.4 (:503-505), step 9. |
| n15 delete the whole of `roles` | Yes | 5.2 (:382-383), section 6, 14.2, 17. Confirmed nothing in `public/break_escape/js` reads a top-level `roles` (every `roles` there is an access list), and no scenario has a top-level `roles` today (the three hits are `access.roles` and `for.roles`). |
| n16 scripted run details | Yes | H8 picks the PC id (:1044), H9 `holdMs: 6000` (:1045), `login_postit_for` public (:379-380), blind testers shown neither report (:683-684, :1144-1146, :974-977). |

## New findings: major

### R3-M1. The `guessable` parts rule leaves short letter runs and single digits unsourced, so an unfair password passes

**Where:** 7.2 "Backing a `guessable` password", test 1 (plan :641-645); step 3 tests (:889-896);
section 3 decision "A `guessable` password" (:186).

**Evidence.** A part is "each run of four or more letters and each run of two or more digits", and
the password "must have at least one" (:641-643). Nothing is said about the characters that fall
in no part. Test 3 covers only characters that are neither a letter nor a digit (:650-651). So:

- `Rex2019!`: one part (`2019`, sourced by a calendar), `!` in the memo. Backed. Nothing sources
  `Rex`, and three-letter pet and partner names (Rex, Max, Ben, Amy) are exactly what the habit is
  for.
- `Jo1987!`, `Ab12cd34`: the same, with `Jo`, `Ab` and `cd` unsourced.
- `Biscuit7!`: the `7` is in no part.

The server compares exactly (`attempt_login!`, `app/models/break_escape/game.rb:1416-1430`) and a
policy with `maxAttempts` locks the username out at that PC for the game, so one unsourced
character turns deduction into guessing. That is the failure round 1's M4 was raised for, and
section 3 states the rule this test exists to enforce: "the player must be able to work out the
whole password, not most of it".

There is a false negative in the other direction. A run of letters is one part, so
`BiscuitRover2019!` has the part `BiscuitRover`, which no text holds as a whole word, and a fairly
clued password is reported "not backed".

**Fix.** In test 1:

1. Every character of the password is in exactly one of: a sourced part, a symbol the pattern clue
   holds (test 3), or a **fixed piece** the pattern clue holds.
2. Split letters into parts at every change from a lower-case to an upper-case letter as well as at
   digits and symbols, so `BiscuitRover` is two parts. Then a letter part of three or more letters
   and a digit part of two or more are sourced as now (whole word, whole run, last two digits of a
   year); `Rex` becomes a part and needs a source.
3. A letter part of one or two letters, or a single digit, is a fixed piece: it must appear, with
   its case, as a whole word or run in the pattern clue's own text ("starts with IT", "ends in 7").
   Matching a two-letter word anywhere in the scenario would source it by chance.
4. Step 3 gains three fixtures: `Rex2019!` with `Rex` unsourced (not backed, part named by
   position), `Rex2019!` with a photo caption "Rex" (backed), and `BiscuitRover2019!` with both
   names sourced (backed). The report's counts (`2 capitals, 1 symbol, 3 parts in order`) count the
   fixed pieces too.

### R3-M2. The validator's lock severities contradict each other and the feature scenario's expected output

**Where:** 7.2 "Wiring" (:590-594) and the third warning (:613-617); section 9 (:725-731); 7.2
suggestions (:632); section 11 "Expected validator output" (:1051-1055); section 13 (:1195-1197);
step 3 tests (:897-900).

**Evidence, three parts.**

1. **The roll warning on the expanded copy.** The plan passes the expanded copy to
   `check_access_model` so "the roll warning ... see[s] the effective `lockChance`" (:592-594).
   That warning is in the sign-in PC loop and fires for any `lockChance` above 0 and below 1, as a
   `⚠️ WARNING` (`scripts/validate_scenario.rb:6086-6090`). On the expanded copy, `lena_pc` (H8,
   `"awareness": "medium"`, a sign-in PC) has `lockChance` 0.5, so the validator warns. But 7.2
   says a preset `sometimes` on a sign-in PC is a suggestion (:632), section 9 says the message
   "names the habit" and is a suggestion from the preset (:728-730), and section 11 expects "no
   errors and no warnings. One suggestion: the roll on `lena_pc`". As written, the builder of
   step 3 either breaks the expected output or edits the first slice's warning without being told
   to. A `sometimes` by name would also be reported twice: once by that warning and once by
   `check_npc_habits` (:612).
2. **The lock-mapping warning ignores policies.** The new warning fires when a workstation's lock
   chance "resolves to ... 0" and a mapping needs a lock (:613-617). A policy with
   `autoLockMin: 0` locks on every leave whatever the chance (`decideLocked`,
   `public/break_escape/js/systems/workstation-state.js:93-94`), and one with `autoLockMin` above 0
   locks while the owner is away, which `wasLocked` reports (`workstation-state.js:21-23`,
   `:301-306`). So the warning fires falsely on:
   - **H5** in this plan's own scenario: Kai is `low` (filled `lockChance` 0) under `instant_lock`,
     and the beat's task is "completed by an event mapping on the beat's own event" (:1025), which
     for "a click opens the sign-in screen" is `workstation_locked_attempt:kai_pc`;
   - **`test_access_sessions`**, an existing regression fixture with no habits: `priya_pc` has
     `"lockChance": 0` and `"policy": "instant_lock"` (`scenarios/test_access_sessions/scenario.json.erb:550-551`)
     and a task on `workstation_locked_attempt:priya_pc` (`:233`). Section 13 (:1195-1197)
     describes this as a real finding that "can fire on existing scenarios"; here it would be a
     false one.
3. **H8 may also warn.** If Lena's task is on `workstation_locked_attempt:lena_pc` or a `wasLocked`
   return, the warning's "between 0 and 1" branch fires on a preset `sometimes`, again against
   "no warnings". The plan does not say what H8's own event is.

**Fix.**

1. In 7.2 "Wiring", say exactly which existing check reads the expanded copy and how the roll
   warning changes: on a PC whose authored data has no `lockChance` and whose expanded copy has one,
   the first slice's roll warning is not raised; `check_npc_habits` raises one line instead,
   naming the habit, a warning by name and a suggestion from a preset. An authored `lockChance`
   between 0 and 1 keeps today's warning unchanged (so `validator-access-model.test.mjs` passes
   unchanged, as step 3 requires).
2. In the lock-mapping warning, "resolves" means the effective lock on a leave: a policy with
   `autoLockMin: 0` (the PC's `policy`, else `defaultPolicy`) resolves to 1; a policy with
   `autoLockMin` above 0 means the screen can lock during an absence, so a resolved chance of 0
   does not warn (the policy's own timing is the author's call). Say the same in section 13.
3. Name H5's and H8's task events in section 11, and keep "no warnings" true: H5 on
   `workstation_locked_attempt:kai_pc` is then clean by rule 2; give H8's task an event that does
   not need a lock (`workstation_owner_left:lena_pc`, or `pc_signin_shown:lena_pc` or a claim),
   or list the suggestion it draws.
4. Step 3 fixtures: a `sometimes` by name on a sign-in PC draws exactly one warning; a preset
   `sometimes` draws one suggestion and no warning; a `lockChance` 0 PC under `autoLockMin: 0`
   with a `workstation_locked_attempt` mapping draws nothing; the same under `autoLockMin: 5`
   draws nothing.

## New findings: minor

**R3-m1. `passwordPattern` is described as a habit but is not one.** 5.1 builds `HABITS`, "each
habit's allowed values", with `passwordPattern` in it (:330); `expanded` drops "invalid ... values"
(:332); the validator errors on "a habit value outside its list" (:605); the habits report marks
each habit "preset or by name". An object id has no list. Fix: in 5.1, say `passwordPattern` is a
parameter of `password`, not a habit: valid when a non-empty string, kept by `expanded` as
written, never in `PRESETS`, not listed as a habit in the report (it appears under the `password`
line as "pattern clue at <path>"); the error for a non-string value is the schema's.

**R3-m2. The lock-mapping warning needs its detection rule.** Beyond R3-M2: (a) "resolves to
**between 0 and 1** ... and to **0**" (:613-614) reads as one condition; write "to 0, or to more
than 0 and less than 1". (b) "with `wasLocked` in its condition" also matches
`data.wasLocked === false`, a mapping that wants an open screen and fires on every leave at
`never`; it would warn wrongly there and miss the mirror case (`=== false` at `always` never
fires). Match `data.wasLocked === true` or a bare `data.wasLocked`, and add the mirror warning for
`=== false` or `!data.wasLocked` at a resolved 1, or say it is out of scope. (c) Say where mappings
are read: `eventMappings` of every NPC in the scenario (room and phone), with `eventPattern` equal
to `<event>:<pcId>`; a bare `workstation_owner_returned` with `data.objectId` in the condition is
not followed. The lab's capture is the first shape (`scenarios/lab_physical_pentest/scenario.json.erb:842-843`).

**R3-m3. The validator's new entry points need their shape.** `validator-access-model.test.mjs`
calls `check_access_model(json, repoRoot, nil)` with three arguments (`test/js/validator-access-model.test.mjs:22`)
and must pass unchanged, so the two new arguments are optional keywords, and with none given
`check_access_model` reads the authored data throughout. The nearest precedent for a split-out file
is a module (`ValidateNpcNeeds.check(json_data)`, `scripts/validate_scenario.rb:6497`); say
`ValidateNpcHabits.check(json_data, expanded:, report:, scenario_dir:)` in
`scripts/validate_npc_habits.rb`, and say how `validator-npc-habits.test.mjs` loads it (requiring
`validate_scenario.rb`, as the access model test does, pulls it in through the `require_relative`).

**R3-m4. Stream D's edges are not quite drawn.** (a) Step 6, owned by stream E, prints "from
step 5 one per gate with a `noHold`" in `verify-run.rb` (:972), and H9's server record relies on
it (:1045), but D's file list in section 15 (:1280) does not include `verify-run.rb` or
`playtest-verify-run-access.test.mjs`. Either E builds that line now (it reads a key nothing
writes yet, which is harmless but is a `holdsDoors` artefact before step 5) or D adds it; say D
adds it. (b) Section 15 starts D "after F, A, B and S are committed" (:1280); step 5 (:921) and
14.5 item 3 (:1265) say "steps 1 to 4". D writes beat H9 into S's scenario, so S first is right;
make step 5 and 14.5 say so.

**R3-m5. The careful guard's only visible tell is outside the contract.** 4.3 promises "the door
shuts on the guard's heels instead of lingering open" (:288), and 4.3 is "the contract the feature
scenario tests" (:279-280). That comes from E1's skipped hold (5.4, :470-472: "this slice does not
depend on that"). H9 asserts only "shut or solid" (:1045), which a gate that lingers open but
solid for `holdMs` also passes. So if E1 drops or changes the skipped hold, the habit loses its
tell and no test notices, and a careful guard's gate looks like a careless one's until the player
walks into it. Fix: make it contract item 6 ("while `blocksPlayer` is true for a player within the
radius, the gate shuts on the first tick no guard is near or crossing") and add the matching H9
assertion (approaching within the radius after Sara has gone through, the gate is shut within one
tick of her leaving the radius and the doorway).

**R3-m6. H9's mappings need two entries each.** H9 has "a mapping on `door_gate_denied` for
`store_b`" (:1045) and waits "on a global the scenario sets from `door_gate_opened`" (:1083). Both
events carry the group's `roomId` and `connectedRoom` (`door-gates.js:239-241`), which are
whichever sprite registered first (the engine plan says the same of `securedRoom`), and an
`eventMappings` condition cannot use `||`. The lab found this and needed one mapping per field
(`scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md:304`). Say so in H9, so the builder of
stream S does not ship a bark that fires for only one registration order.

**R3-m7. "One thing in that file" understates stream D's edit.** 5.4 says this slice owns "one
thing" in `door-gates.js` (:455-456), and the engine plan says D "adds `noHold`, `lastGuards` and
one clause in `openToPlayer`". D also edits `normaliseGate`, `open`, `close` and E1's `update()`
(the per-tick add to `lastGuards` while open, :489). `update()` is E1's by name. List the five
places in 5.4's "Who owns what" so the E1 builder knows `update()` will gain one line, and contract
item 5 already makes `open` and `close` the only ways in and out (check that E1's `exitOpen()` and
`playerOpen()` go through `open()`; today `playerOpen` does, `door-gates.js:310-321`).

**R3-m8. `roles.staff.awareness` is a default only for NPCs with an account or a card.** Section 4
calls it "a site default" (:231). `identity_roles` adds `staff` only when the NPC has a `creds`
hash or a card and `staff` is not false (`access_identities.rb:64`). A gate guard or a cleaner
with no creds gets no level from it, and with step 5 that is a guard whose `holdsDoors` is absent.
Say "a default for every NPC with an account or a card", and add the no-creds case to the step 1
level test.

**R3-m9. The validator misses a `needsHome` that names a stamped id.** 5.2 is right that the
server must fill a PC owned through a `needsHome` naming a stamped id (:352-354), and step 1 tests
it. On authored data that PC has no id, `expand!` skips it, and 7.2 warns only for a workstation
with a `screenOwner` and no id (:596-599). So the validator's report and the server disagree with no
warning. The stamping rule is deterministic (`"#{room_id}_#{obj['type']}_#{i}"`, `game.rb:4058`,
mirrored in `rooms.js`). Fix: either stamp the validator's expanded copy by the same rule (move it
to `AccessIdentities` so the scripts and the server share it), or widen the warning to "a
workstation with no authored `id` that an NPC's `needsHome` or a `screenOwner` would own".

**R3-m10. One table row is short, and two siblings now disagree with 9.1's settled text.**
(a) The `game.rb` row in section 15 (:1294) omits engine E2b, which edits `generate_scenario_data`
(engine plan, stream table), the caller of `prepare_scenario_data!` and the method next to it;
add it ("held for the user's question 3; different method"). (b) 9.2 still says 9.1 deletes only
`roles.<role>.awareness` from the bootstrap (`ACCESS_MODEL_SLICE_9_2_PLAN.md:1484`), and its
section 15 items 4 and 5 (`:1515-1516`) are now resolved by this revision. (c) 9.3's shared-file
table says engine E4 edits only `access-leak-check.rb` (`ACCESS_MODEL_SLICE_9_3_PLAN.md:1348`);
the engine plan (its table, `access_leak_scanner.rb` row) and 9.1 (:1303) say E4 edits the scanner
library too. None of (b) or (c) is a 9.1 edit; the orchestrator should correct the siblings so a
9.1 builder does not meet a contradiction.

**R3-m11. A clue can sit behind the account it unlocks.** Test 2 excludes the account's own
profile and the contents of a PC only that account opens (:646-648). A clue in a container or
room whose way in needs that account (a PIN on its desktop, a badge only its profile holds) is
still counted, and the puzzle is then circular. The dungeon graph's "clue" edges (7.3) would show
the loop, which is what the graph is for. Fix: one sentence in 7.2 and the README section that
the author checks the graph for a loop through the account's node, or, cheaply, the report names
any source whose room or container is locked ("part 2 of 3: behind lock <id>") so the author
looks.

**R3-m12. The pattern clue's symbol test is weak both ways.** It passes on common punctuation the
memo holds anyway (a password ending in `.` or `-` is "covered" by any sentence or date), and it
fails a memo that spells the symbol ("ends with an exclamation mark"). Neither is unfair to the
player once R3-M1 is in, but the README section in step 9 should tell authors to write each symbol
literally and in context ("end with !"), and the report should name which symbols it matched, so a
chance match is visible.

## Interfaces with slices 9.2 and 9.3, and the engine plan

| Point | 9.1 now | Sibling | Status |
|---|---|---|---|
| Build order | 9.3a, 9.1, 9.2; engine streams separate; D after E1 | 9.2 :7, :1419, :1506; 9.3 :1234, :1363; engine order item 4 | Agreed |
| The sticky note channel | 5.3 and 14.2 | 9.2 :1482, :1525; 9.3 :1244 | Agreed. 9.2's "if built before 9.1" fallback (:449-452) matches 5.3 |
| `leavesOpen` | 14.2 | 9.2 :517-521, :1486 | Agreed |
| `roles` in the bootstrap | Whole key deleted | 9.2 :780 deletes the whole key; :1484 still describes 9.1 as deleting part | 9.2's :1484 is stale (R3-m10) |
| Role default order | `identity_roles` | 9.2 :1484-1485 | Agreed; see R3-m8 for who has `staff` |
| `attach_login_accounts!`, `openLoginSignIn` | 9.3a first, re-read | 9.3 :1246, :1339 | Agreed |
| Wi-Fi key as a secret home | Whichever lands second | 9.3 :1243 | Agreed |
| `door-gates.js` | E1 whole file first; D adds its lines | Engine "Files shared" row; contract in 5.4 | Agreed; R3-m5 and R3-m7 make it tighter |
| Leak scanner sequence | 9.3a, E4, 9.1, 9.2 | Engine agrees; 9.3 :1348 differs on what E4 touches | R3-m10 |

## The step 5 contract with E1

Checked each of the five clauses against the engine plan's item 3 as written:

1. `openToPlayer(g, now)` as the only question: the engine plan says so in the same words and
   names 9.1's clause.
2. No crossing while it answers no: `blocksPlayer` and the body rule, with the overlap exception
   (a body the player already overlaps is not switched on). A player who is in the doorway at the
   moment `lastGuards` becomes all `noHold` is not blocked until they step off it. That is the
   same edge the engine plan accepts for `playerMayPassIf` gates, and `room_entered` then needs
   them to keep walking forward through an opening that is closing; acceptable, and H9 starts the
   approach from outside the radius.
3. The bump emits `door_gate_denied`, at most once in 4 s: matches `bumpDue`.
4. Clone hold first: matches (`playerHoldUntil`, today `door-gates.js:337`).
5. `open` and `close` as the only start and end: true of today's code for `playerOpen` and
   `closeNow`; the builder should confirm it for E1's new `exitOpen()` (R3-m7). One consequence to
   keep: with `lastGuards` empty (a gate opened by an exit click or a clone with no guard near),
   the `noHold` clause answers yes. Both cases already let the player through by other rules, so
   this is harmless; worth one line in 5.4 so a later reader does not "fix" it.

The contract is buildable and fair with R3-m5 added.

## Fun, education and chaining

- **`locksScreen`** stays the strongest habit: a visible tell (padlock, dot), time pressure, a
  desktop that leads on, and a control the student can apply the same day. The lab recipe keeps
  play unchanged.
- **`writesDown`** is now well specified as one link: the note picture is visible before the
  owner leaves, the text only at the desk, and the pairing with a locking screen is the right
  default. The report's "opens only its own PC" line points authors at the chain that stops.
- **`password: guessable`** is the puzzle with the most learning in it (predictable passwords from
  a rule and personal facts), and the pattern clue makes the rule the lesson. It is fair only if
  every character has a source or is stated in the rule; R3-M1 closes the last gap.
- **`password: reused`** chains well and its two labels (same password, shared with) teach two
  different things.
- **`holdsDoors`**, built on the hard bar, is now something a puzzle can stand on and sends the
  player to a copied badge or another guard. Its fairness rests on the door visibly shutting on
  the careful guard's heels and on the bark; R3-m5 makes the first a tested promise and R3-m6
  makes the second work in both registration orders.
- **Presets** now only touch the screen (and the door from step 5). One word on an NPC does what
  the report says, and with R3-M2 the validator stops raising warnings for a preset roll the plan
  calls a suggestion.

## What to change before building

1. R3-M1 into 7.2 test 1 and the step 3 fixtures.
2. R3-M2 into 7.2 "Wiring" and the lock-mapping warning, section 9, section 11 (H5 and H8 events),
   section 13, and the step 3 fixtures.
3. The minors a builder would otherwise guess: R3-m1, R3-m2, R3-m3 (step 3); R3-m4, R3-m5, R3-m7
   (step 5); R3-m6 (step 7).
4. The orchestrator corrects 9.2 :1484 and :1515-1516 and 9.3 :1348 (R3-m10).

Ready to build steps 1 to 4: no. Steps 1 and 2 are ready now; steps 3 and 4 are ready once R3-M1
and R3-M2 are written into the plan (step 4's "clue" edges depend on the backing rule).

Step 5 ready once E1 lands: yes, with R3-m4, R3-m5 and R3-m7 written in; none of them needs a
design decision.
