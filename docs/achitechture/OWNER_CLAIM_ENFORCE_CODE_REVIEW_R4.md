# Owner claim enforcement (q78): code review, round 4

Branch `build/owner-claim`. R3 fixes in `6f71a1a64` (code and tests) and `a387c6f28` (build log),
reviewed against R3 (`71b3ec5fa`). `main` has had no commits since `6a834437c`, which R3 merged
in, so nothing new came from it. 2026-11-12.

The rule is q78: refuse an owner claim only where honest play could never leave the screen open,
and never refuse an honest one. R3 took every room and leash test out of the refusal path. Every
object anywhere in the scenario now counts as reachable. Three fixed rules are left that can still
narrow the precise layer: a use of the owner's own `needsHome` is no leave, a `private` affordance
serves only its owners, and a judged need skips another person's desk (`_otherDesk`). This round
checks those three against the client, walks the 16 PCs that reach check 10, and repeats the
completeness pass.

## Summary

| Grade | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 |
| Nit | 4 |

R3's B1, m1, n1, n2 and n4 are fixed as the build log says, and n3 was kept on purpose. No
shipped scenario changes behaviour. Of the 16 PCs that pass claim checks 3 to 7, only
`test_access_habits noor_pc` is refused, and that refusal is real. One gap remains where the
mirror and the client disagree on whether `work` is judged (m1). It can refuse an honest claim,
but only in a scenario that already fails the validator.

## The three fixed rules

### A use of the own `needsHome` is no leave

`_leavePost` (`npc-needs.js:2893`) emits `npc_left_post` only when `s.atPost && !_atOwnPost(s)`.
`_atOwnPost` is true for a `use` or `visit` job whose `targetId` is `s.home.objectId`. That id is
set by `_resolveHome` from the record's `needsHome`, and nothing in the engine or the server
writes `needsHome` at run time (searched: no assignment in `public/break_escape/js`, `app` or
`lib`). So the mirror's skip of `home_id` matches the client, with one short window. While the
home is provisional, `s.home.objectId` is null (n1).

### The private-owners check

`_permitted(s, o, true)` refuses a private affordance unless `_owners(o)` includes the NPC.
`_owners` reads `affordance.owners`, else `screenOwner`, else the first registered NPC whose
`needsHome` is the object. The mirror reads the same three, and takes every NPC with that
`needsHome` where the client takes the first, so it is wider.

Nothing can change these in play:

- No client code assigns `affordance`, `owners`, `private`, `screenOwner` or `needsHome`. The
  only write near them is `out.desk = true` in `describe`, a derived flag.
- No preset sets `private` or `owners` (`js/data/office-presets.json`, read in full). A preset
  can only add `satisfies` and use fields, so a private flag always comes from the object's own
  `affordance`, which every copy carries.
- The knock-out drop (`npc-hostile.js` `{ ...item, takeable: true }`), the server's copy of it
  (`game.rb:486` and `505`), the player's drop (`item-drop.js:228`) and the NPC carry and slot
  placements copy the item with its own `affordance` and `screenOwner`. Setting `takeable: true`
  can only drop a preset, which never holds `private`.
- No ink tag or event mapping touches them. `control()` takes `suspend`, `resume`, `print` and
  `set` (need levels) only.
- `add_object` from the client is stored in `objects_added`, and honest play only sends copies
  of scenario items. A forged one is the accepted side under q78 and strips lock fields anyway.

This rule cannot refuse an honest claim.

### `_otherDesk`

`_otherDesk(s, need, o)` is `o.desk && _judged(s, need)`, minus the own station and a borrowed PC.

- `o.desk` comes from `isDeskData`: `workstation`, `locksScreenOnLeave`, `lockChance`,
  `lockType: "login"`, or the `desk_pc` preset. None is written at run time. The preset needs the
  object not to be `takeable`, and a knock-out drop sets `takeable: true`. That can only turn a
  desk into a non-desk, and only for an `itemsHeld` object, which `movable?` already allows.
  `AccessWork.desk?` reads the same fields.
- The borrow exception comes only from a `borrow_session` workaround (`setBorrow`, from
  `npc-workarounds.js`). The server hands a workaround over only after failures of a judged need,
  and any failure route (`fails:<need>`) returns before the source search, so the mirror never
  needs the exception.
- `_judged(s, 'work')` reads the shipped plan: `rec.work.needs.length > 0`. The mirror reads
  `AccessWork.work_plan?`, which is not the same test (m1).

So `_otherDesk` is a fixed client rule, apart from m1.

## The 16 PCs that reach check 10

My own sweep (session scratchpad `r4_owner_sweep/sweep.rb` and `detail.rb`, not the repo) renders
all 176 `scenario.json.erb` files (176 of 176, none failed), prepares each with
`NpcHabits.expanded_copy` as the server does at load (`game.rb:1073`), records claim checks 3 to 7
for every sign-in PC with an owner, then `leave_route`, and `leave_route` and `precise_route`
with attacks forced off.

| Scenario | PC (owner) | Label | What the client does |
|---|---|---|---|
| `lab_physical_pentest` | `staff_pc_2` (pierce) | `need:work:staff_pc` | Attacks are off and the habit's `lockChance` is 0. Work is not judged (no plan), so `staff_pc` is a source. The client takes the own PC first while it is free, so `staff_pc` is used only when `staff_pc_2` is busy (n4). The everyday leave is caffeine at `coffee_station`, which the mirror also has. |
| `test_access_habits` | `dana_pc` (dana) | `need:caffeine:dana_coffee` | Her private machine (`owners: ["dana"]`), in her room. Real leave, habit `lockChance` 0. |
| `test_access_habits` | `lena_pc` (lena) | `need:caffeine:lena_coffee` | The same, habit `lockChance` 0.5. |
| `test_access_sessions` | `dana_pc`, `omar_pc`, `kai_pc`, `mei_pc`, `tom_pc` | `knock_out` | Attacks on, no `koImmune`, PC `lockChance` 0, so `decideLocked` with no estimate leaves it open. With attacks off each has its own private coffee machine, so the label holds either way. |
| `test_access_social` | `theo_pc`, `ruth_pc`, `sade_pc` | `knock_out` | Attacks on, habit `lockChance` 0. Behind it, `fails:social_media`: the kiosks and `l1_hot_desk` are desks, so `_otherDesk` keeps them out, and the own station's policy can fail. |
| `test_access_social` | `l2_pc` (hamid) | `knock_out` | As above, with `fails:work` behind it. |
| `test_access_work` | `omar_pc`, `leo_pc` | `knock_out` | Attacks on, PC `lockChance` 0, `fails:work` behind it. |
| `test_capture_log` | `mel_pc` (mel) | `need:caffeine:office_coffee` | An open machine, PC `locksScreenOnLeave: false`. Real leave. |
| `test_access_habits` | `noor_pc` (noor) | nil | Refused. See below. |

`decideLocked` and `open_without_estimate?` agree on every branch: a numeric PC `lockChance`
first, then the `locksScreenOnLeave` key (JSON null locks on both sides), then a habit with a
numeric `lockChance`. A threshold alone needs an estimate, which a knock-out never has.

**Noor's refusal is real.** Scenario `disableAttacks: true`, and no client code assigns it. Her
record has one need, `work` (`decayPerMin` 30, `urgentAt` 40, `initial` 65, no jitter). She has
no work plan, so work is not judged and cannot fail. With no `officePresets`, `noor_pc` is the
only object in the whole scenario whose affordance satisfies `work`, and it is her own
`needsHome`. She has no `itemsHeld`, interests, `answersPhones`, `printHabit`, `onUse`, mappings
or patrol (`behavior` is `facePlayer` only). `scenarios/test_access_habits/ink/owner.json` and
`owner.ink` both read and contain no `patrol_mode`. On the client her need turns urgent about 50
seconds after she registers, long after her home resolves (within a second), and she sits at
`noor_pc` with no leave. Nothing else ever starts a job for her.

The other results match R3. `test_access_social` jake and lena reach only `might:social_media`,
but check 6 refuses both first. The validator's never-leaves warning fires for `noor_pc` only,
next to the older untracked-owner warning for `test_access_work pat_pc`.

## Completeness of the movement paths

Unchanged since R3, and `main` brings nothing new.

- `npc_left_post` still has one emitter (`npc-needs.js:2900`, inside `_leavePost`). `_startJob`
  is still called only from `_select` (1371), the `_turnBack` fallback (1928), `_startVisit`
  (2413) and `_claimAnswerer` (4046). `enqueueVisit` has the same two callers (the check visit
  at 2252 and `npc-workarounds.js:156`), and `setBorrow` has one (`npc-workarounds.js:142`).
- `npc_ko:<id>` still has one emitter (`npc-hostile.js:356`). The other `isKO = true` writes
  (`npc-hostile.js:162`, `npc-lazy-loader.js:114`) restore saved state and emit nothing.
  `damageNPC` is reached in play only from `player-combat.js:730`.
- The owner answering their own desk phone (`_ownerAnswers`, `_beginCall`) starts no job and
  no walk. `pending-gate-walk.js` moves the player only.
- `control()` takes `suspend`, `resume`, `print` and `set` only, and the table already covers
  each of them.

## Findings

### m1 (minor). The mirror can call `work` judged where the client does not

`AccessWork.judged?(data, npc, 'work')` is `work_plan?`: a `work` need and a non-empty
`work_list`. The client's `_judged` reads the shipped plan, `rec.work.needs.length > 0`.
`AccessWork.plan` builds `needs` with `filter_map` over `resources`, so a `workNeeds` id that names
no resource leaves `work_plan?` true and the shipped `needs` empty.

In that case the client treats work as not judged, `_otherDesk` does not apply, and any other
desk that satisfies `work` is a source. The NPC leaves for it. The mirror treats work as judged.
`can_fail?` is false (it reads only resolved resources), so the source search skips every other
desk. Probe (scratchpad `r4_owner_sweep/probe.rb`): Jo, `koImmune`, attacks off, one `work` need,
`workNeeds: ["no_such_resource"]`, own `jo_pc` and a `spare_pc` workstation with
`satisfies: "work"`. `plan` gives `"needs" => []`, `judged?` is true, `can_fail?` is false, and
`leave_route` is nil. The server refuses an honest claim.

The validator already reports this as an error ("names no resource in 'resources'",
`validate_access_work.rb:454`), and the merge rule needs 0 ❌, so no shipped scenario can have it.
The sweep finds no NPC with `work_plan?` true and an empty plan.

Fix: in `OwnerClaim.precise_route`, judge `work` as the client does: judged only when
`AccessWork.plan(data, owner)` has a non-empty `needs`. Keep `social_media` as it is. That only
adds routes. Changing `AccessWork.judged?` itself would also move `NpcFrustration`, so keep the
change local. Add the probe as a unit case that expects `need:work:spare_pc`.

### n1 (nit). A provisional home makes a use of the own PC a leave for up to a second

When the `needsHome` object is not registered yet (start-room NPCs register before the room's
objects), `_resolveHome` gives a provisional home with `objectId: null` and retries every
`HOME_RETRY_TICKS` (4 ticks, one second). If the object registers between retries and a need it
meets is already urgent, `_useCandidate` cannot prefer it as home and `_atOwnPost` is false, so
a use of the own PC emits `npc_left_post`. The leave is short (the walk to the own desk, which
`_targetsOwnPost` ends as a return), but it is a leave with an away record.

No scenario hits it. It needs a need whose `initial` (with jitter) is at or below `urgentAt` and
whose only source is the own PC. Noor starts at 65 against 40 with no jitter. Either note it in the
build log's movement table as a known window, or let the mirror count a use of the own PC as a
route when a need starts urgent. Both are cheap, and the second only adds routes.

### n2 (nit). `js_positive?` is still narrower than `Number()` for a few strings

`normaliseNeed` accepts any `Number(x) > 0` and clamps it. `js_positive?` also needs the value to be
finite, and `js_number` does not read JavaScript's other number spellings. `"Infinity"`, a JSON
`1e400`, `"0b101"` and `"0o7"` all make a live need on the client, but the mirror and check 3
(`needs_tracked?`) ignore them. Nobody writes these, and the sweep finds none. Dropping the
finite test in `js_positive?` (for `+Infinity` only) and reading `0b`/`0o` in `js_number` would
close it. Otherwise list them beside the other known gaps in the `js_number` comment.

### n3 (nit). The comment above the check 10 call in `game.rb` is stale

`game.rb:1920` to `1924` lists only the precise routes ("no need source, interest, print errand,
colleague's phone or failure route, and no knock-out that can find this PC open") and the
`patrol_mode` tag. Since R2 a refusal also needs no patrol, scripted move, social media need,
station hook, interest, phone answering, print habit or command, or movable source, and since R3
a readable story. "In a way that can leave it open" fits the precise layer only. Suggested
wording: "Owner claim q78: refused only when the owner has no movement source at all
(OwnerClaim.leave_route: no precise route, and nothing the cautious layer counts). Every object in
any room counts. The owner's ink story is read as GamesController#ink finds it, and a story that
cannot be read allows the claim."

`bin/rubocop` on `game.rb`, `owner_claim.rb` and `access_identities.rb`: 3 files, no offences.

### n4 (nit). The `staff_pc_2` row in the build log names a fallback route

The build log's sweep says the habits PCs, `staff_pc_2` and `mel_pc` have "needs" routes. For
`staff_pc_2`, `leave_route` returns `need:work:staff_pc`, which the client takes only when Pierce's
own `staff_pc_2` is not free, since `_useCandidate` prefers the home object. His everyday leave is
caffeine at `coffee_station`. The claim is honest either way, and the doc comment says the label
names the first route found. One line in the build log saying the caffeine route is the one play
uses would stop a later reader treating the label as the common case.

## Sync size

Unchanged. Check 10 reads `scenario_data` and, for an owner with no precise route, a few story
files at claim time. It writes nothing, and a refusal returns before `save!`. Nothing goes into
`player_state`, and the client sends nothing new.

## Live run

None. No shipped scenario changes behaviour: the same 15 PCs are allowed and only `noor_pc` is
refused, as in R3.

## Tests run

All without the lock.

- Rails: `test/unit/owner_claim_test.rb`,
  `test/controllers/break_escape/owner_claim_enforce_test.rb`,
  `test/unit/access_identities_screen_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`,
  `test/controllers/break_escape/access_model_login_test.rb`,
  `test/controllers/break_escape/capture_proofs_test.rb`,
  `test/controllers/break_escape/npc_lockout_l_test.rb`,
  `test/controllers/break_escape/game_state_locking_test.rb`,
  `test/controllers/break_escape/network_remote_signin_test.rb`,
  `test/models/break_escape/lab_physical_pentest_secrets_test.rb`,
  `test/controllers/break_escape/usb_habit_test.rb`, `test/unit/access_work_usb_habit_test.rb` and
  `access_model_rules_test.rb`: 206 runs, 2359 assertions, 0 failures, 0 errors.
- Node: `test/js/validator-access-model.test.mjs` and `test/js/validator-usb-habit.test.mjs`:
  61 of 61 pass.
- Validator (`--no-graph`) on `test_access_habits` and `test_access_work`: 0 lines with ❌. The
  never-leaves warning appears for `noor_pc` only.
- Sweep over all 176 scenarios: as above.
