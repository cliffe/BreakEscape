# Access model slice 9.2 plan: adversarial review, round 4

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md` as revised after round 3 (commit
`8407aac59` on branch `claude/break-escape-access-design-090sjx`), against the code on the same
branch (`public/break_escape/js/systems/npc-needs.js`, `npc-needs-chatter.js`, `office-presets.js`,
`workstation-state.js`, `app/models/break_escape/game.rb`, `games_controller.rb`) and against
`ACCESS_MODEL_SLICE_9_1_PLAN.md`, which is being built in parallel. Nothing was run and no server
was touched; every finding is from reading code and documents. "plan :N" is a line of the plan;
other line numbers are for the current tree.

The focus is the five round 3 majors and the parts written to resolve them: the "desk" definition
and its filters, the targeted wakes, the park and use floors with the browser-claimed `rearmed`
flag, and the new validator warnings. Existing scenarios that use NPC needs were re-checked against
every changed method.

**Counts: 0 blockers, 2 majors, 11 minors.**

| Grade | Count | Ids | Sub-slices |
|---|---|---|---|
| Blocker | 0 | | |
| Major | 2 | M1, M2 | A (server route A-3), bounds stated for B, H, L and C |
| Minor | 11 | n1 to n11 | A mostly; n9 test scenario; n10, n11 C |

**Verdict in short.** All five round 3 majors are resolved in the text and fit the code. The new
parts are mostly sound: the desk filter sits where it must (inside the candidate lists, so a
colleague's `private` desk or a busy plain PC never reaches `_giveUpReason`), the dead-station rule
precedes both null returns, the `wakeOn` clause precedes the early return, and the guest rule now
matches `decideLocked` and 9.1's `screen_always_locks?`. Two server-side faults remain, both in the
pace floor of A-3: the server never ties a fail report's object and causes to the NPC, so a
tampered browser chooses its own use floor and sidesteps the park floor the plan says binds
`no_access` (M1); and an honest `off` failure that follows a met use on a station switched off
mid-use is refused `tooSoon` (M2). Both are a few lines of plan text and touch no client design.
**U can be built now. A needs a short revision of 9.1 (the routes), 9.3 and A-3's tests; its
client steps (A-1, A-2, A-4, A-5) are not affected.** B, H, L and C are design-ready behind A.
Existing scenarios behave exactly as before.

## 1. Round 3 majors

| Id | Round 3 finding | Now | Evidence |
|---|---|---|---|
| M1 | A dead PC parks only when nothing else is acceptable; guard covered the wrong set | **Resolved** | One definition of a desk (plan :361-386), filtered in the candidate list beside `_isOff` (`_useCandidate`, `npc-needs.js:1406-1407`; `_queueCandidate`, `:3090-3093`), so it never reaches `_permitted` or `_giveUpReason`'s `private` null (`:1542-1543`). The new rule in `_giveUpReason` is placed before both null returns (plan :388-395). With every other source filtered, `sat` is empty, `opts` is empty, `queued()` returns null and `nothing()` calls `_giveUpReason` (`:1431-1437`), so the rule is reached. W6 now states no leash and two desks of each kind in reach (plan :1653). The A-5 test is the one asked for (plan :1838-1841). One wording in 5.2, A-5 and section 14 |
| M2 | One wake routine asked to skip and deliver the same wake | **Resolved** | `_wakeParked()` skips failure parks for all three callers; two targeted wakes on `_wakeParkedFor`'s pattern (`:1599-1606`): `wakeOn` before the early return at `:552`, and the switched-on clause collecting the ids that came back on (plan :440-456). The switched-on clause can see the station: the station's own `_isOff` ran in the select that parked it (it is the NPC's `needsHome`, so the desk filter keeps it), so `_offSeen` holds it with `off: true` (`:569-575`, `:556-559`). One fixture tests both wakes and the door's non-wake (plan :1831-1837) |
| M3 | Mutters had no text | **Resolved** | Lines are scenario-authored (plan :599-613), which keeps the rule at `npc-needs.js:61-64`; "replaces" corrected to "adds" (`chatterPool`, `:187-197`); each new pool has a `PICTURE_CHATTER` picture, so causes differ with no line (plan :629-634); `_pickBark` already takes `ignoreCooldown` and `icons` (`:1721`); the validator warns per cause the NPC can meet; `test_access_work` ships every pool and `test_access_social` ships `social_blocked` |
| M4 | The pace floor refused an honest second failure after a toggled outage | **Resolved for the cases listed, with one honest case left (M2 below)** | A later fail after an accepted ease, or marked `rearmed` with only browser-controlled causes, is held to the use floor (plan :1181-1196). W4's re-arm is a server test (plan :1787-1789). The A-3 first-fail floor is gone; a first fail at once after `metAt` is tested (plan :1784-1785) |
| M5 | Every borrower with no screen habit left nothing to claim | **Resolved** | 6.4 (plan :853-868) and 15 (plan :2202) state one rule: careful when `screen_always_locks?` with no PC field is true, which includes no habit, as `decideLocked` locks for an owner with none (`workstation-state.js:129, 134`) and as 9.1 defines the function (9.1 plan :493-497) and its 14.2 row (9.1 plan :1708). Check 7, the validator and `leavesOpen` use it. 11.1 authors `{ "lockChance": 0 }` on Ian, Dana and Jake and `lockChance: 1` on their own PCs (plan :1639-1641); 11.2 on Omar |

Round 3's minors: n1 (the `off` park's grumble from `_select`, `_grumbleTopic`'s order,
`ignoreCooldown`), n2 (one "judged"), n3 (no preset on a sign-in PC, and the warning), n4 (the
`off` park drains), n5 (the manual clock), n6 (`roles.staff.workNeeds`, Ian's role), n7 (an
`unreachable` waits out its park), n8 (the kick waits for the job and its chat), n9 (one check
visit per outage), n10 (line numbers) and n11 (no walk at the own desk) are all resolved.

## 2. What the new parts get right

- **The desk filter.** Filtering in the candidate list, not in `_permitted`, is the only place
  that works: `_permitted` failures feed `priv` and `private_skipped` and then the `private` null
  in `_giveUpReason` (`:1415-1437`, `:1542-1543`). A busy plain PC would have reached the `busy`
  null (`:1555`); it is now never in `sat`.
- **`desk` in `describe`.** `describe` (`:3297-3316`) is the right home; `window.officePresets` is
  installed before the needs system (`core/game.js:1977-1981`) and `presetIdFor` needs no
  scenario (`office-presets.js:49-58`), returning null with presets off because the table is not
  loaded. The `isWorkstation` rule (`workstation-state.js:89-93`) is small enough to copy.
- **The off park's line.** `_grumble` with no job leaves `need` undefined, so it already passes no
  need icon from `_select` (`:1662-1663`); the plan's `icons` option makes that explicit.
- **`_log` drops undefined values** (`:3198-3203`), so `grumble:` on a `parked` entry adds nothing
  to existing logs, and the needs baseline compares sequences of events and log entries
  (`tools/playtest/needs-baseline-compare.js`), so new `getState` fields cannot show as a change.
- **The guest rule** is now one sentence in three places that agree with each other and with 9.1.

## 3. Majors

### M1. The server never ties a fail report's object and causes to the NPC, so a tampered browser picks its own floor (A; the bounds in B, H, L and C)

**Where:** 9.1 "A cause holds" (plan :1156-1162), "Pace floors" (plan :1164-1215, "u is the use
time of the station the report names"), the route table's checks 2 to 4 (plan :1224), 9.3's bounds
(plan :1324-1342), the validator's report line (plan :1509-1513).

**Evidence.**

1. "A cause holds" checks each listed cause against the server's view (a `down` global truthy,
   the reported station's `offWhen` holding) but nowhere requires the resource to be in the NPC's
   resolved work list or the station to be the NPC's own or a borrow PC. "Can fail" is per NPC and
   need, not per cause. So a report for any NPC that can fail may name any resource with a
   `downIf` and any object with an `offWhen`, both of which the browser sets.
2. The use floor's `u` comes from "the station the report names". The browser chooses
   `object_id`. Naming any object with a `useSeconds` of 2 or less (a desk phone preset has 0,
   `data/office-presets.json`), or one with no affordance and no preset (the plan gives no
   default), makes `0.9 x u - 2` zero, and twenty `rearmed` fails in one request are then all
   accepted: level 100 and every workaround handed over at once, whatever the NPC's station. 9.3
   and the validator report state the bound with the station's own `u`.
3. The park floor is said to bind "an NPC whose only cause is `no_access`" (plan :1336-1338, about
   216 seconds by default). It holds only while the report lists `no_access`: "a report that lists
   one keeps the park floor" (plan :1189-1190). A tampered browser omits it. W5's Kai is exactly
   this NPC: his only extra resource, `finance_share`, has `downIf: "finance_share_down"`, so the
   browser sets that global, reports `[{ id: "finance_share", why: "down" }]` with `rearmed: true`,
   and walks Kai at the use floor (or at once, by point 2).

**Fix.** In "A cause holds", per fail report: every `down` or `unreachable` cause names a resource
in the NPC's resolved list; an `off` cause names the NPC's `needsHome` object or a PC one of its
`borrow_session` workarounds names; `object_id` is one of those, or a non-desk object that
satisfies the need. Take `u` from the NPC's own `needsHome` object (the borrow PC for a report
naming it), with a stated default when neither has a use time (the desk preset's 10). Decide the
floor from the server's own causes, not the listed ones: if any server-owned cause holds for that
NPC and need on the server (an unadmitted resource in the list, a blocking `social` policy, a
`loginLockouts` entry), the park floor applies whatever the report lists. Add three A-3 tests: a
fail naming a resource outside the list is refused; a fail naming an object with `useSeconds` 0 is
floored by the home station's use time; Kai with only `down` listed and `rearmed` keeps the park
floor.

### M2. An honest `off` failure after a met use is refused when the station went off during that use (A)

**Where:** 5.1 (plan :283-285) and 5.6's second bullet (plan :670-674): "a use that finishes on a
station just switched off is followed at once by the `off` park"; 5.4 (an ease after a met judged
use with frustration above 0, plan :518-521); 9.1 point 1, "held only to the use floor after the
later of that fail and that ease" (plan :1181-1185); the claim "Every case where an honest client
could meet a floor is designed out" (plan :1211-1215).

**Evidence.** The most natural act a student makes in W6 or H1 is to pull the plug while Ian is
working. The use finishes (office life's rule, `npc-needs.js:2078`), is met and, when Ian's level
is above 0, is reported as an ease. The kick is applied after the restore and the next selection
parks `off` at once: a counted fail a tick after the ease, often in the same two-second batch. The
floor measures that fail from the ease and needs `0.9 x 5 - 2 = 2.5` seconds. The server answers
`tooSoon`, writes nothing, and the student has seen "This PC is useless." that does not count. It
happens from the second episode on (the first has level 0, so no ease), which is every episode
after W6's first and the run up to H1's third failure.

**Fix.** Measure a later fail's use floor from the last accepted **fail** only; an accepted ease
between is a gate (it lifts the park floor), not an anchor. The honest client is then always clear
(a met use lies between, so at least one use time has passed since the last fail), and the
tampered rate is unchanged (one fail per use floor, as stated in 9.3). Add the case to A-3: a fail,
a woken met use with an ease a use time later, and an `off` fail in the same request as the ease,
all accepted.

## 4. Minors

**n1. The park floor's slack for an `off` re-park leaves about a second for the forced sync.** A
timer-expired `off` park re-parks at once, with no use time in between, so honest fails are exactly
`needsDeferMin` apart. The first is delayed by the two-second batch window and by the forced state
sync awaited before it (5.4, the unplug changed a plan global); the second is not. With 0.5 minutes
the floor is 27 seconds and the slack 3, so a sync slower than about a second refuses Ian's second
or third failure (W6, H1). Make the park floor `0.9 x D - 3` seconds, or count the sync in the
validator's minimum.

**n2. A reload meets the park floor.** Needs restart at `initial` and the kick brings an NPC whose
outage still holds straight back to a failing desk (plan :1389-1391), with no `rearm` mark (it is
reset). A fail a few seconds after the last one, before the reload, answers `tooSoon`. One count
is lost and the next park recovers it, but the "designed out" claim is false and the A-7 reload
after W4 can meet it. Let `npcFrustration` on load carry each need's remaining park floor, and have
the kick park the need for that long first.

**n3. The `off` park's line is lost inside another need's fallback.** `_select` grumbles for a
counted `off` park only when `exclude` is null (plan :471-476). A fallback select from a turn-back
for coffee also evaluates an urgent `work` and can park it `off` with `exclude` set for
`caffeine`, so that failure says nothing. Use `exclude?.need !== name`.

**n4. The kick on a need parked for another reason.** Parked state is the held level
(`_decay`, `:1246-1250`; `_select` reads levels only, `:1356-1366`). The kick lowers the level of
any `work` need except one "parked for a failure" (plan :671-672), so a need parked `no_source` or
`avoid` would be selected while still in `s.parked` and parked over. Say the kick skips every
parked need (a failure park needs no kick; any other is woken by its own rules).

**n5. The dead-station rule and a provisional home.** Start-room NPCs register before their room's
objects and hold a provisional home until `needsHome` resolves (`_updateHome`, `:2450-2458`). A
global already on at `register` kicks at once (plan :670); `s.home.objectId` is not yet set and the
station is not in the object list, so the need parks `no_source`, uncounted and silent, for a whole
park. Read the station id from the record's `needsHome` string, or hold the kick until the home
resolves.

**n6. "Own" means `needsHome` only.** A PC an NPC owns through `screenOwner`, with a coordinate or
other `needsHome`, is a desk and is filtered, so that NPC never works; the workstation layer calls
it the NPC's own (`workstation-state.js`, owner rule). Either define own as "the `needsHome` object,
or a workstation whose owner is this NPC", or extend the validator's "satisfies no `work`" warning
to a coordinate `needsHome`.

**n7. The `wakeOn` test is wrong for routes with several globals (latent until 9.3b).** "None of
whose `wakeOn` globals now holds" (plan :447) keeps an `unreachable` park with routes `[[a], [b]]`
parked when `a` clears, though the need is reachable. Wake when the recorded causes would now pass
(`reachable(need, globals)` and no listed `downIf` truthy). With 9.3a's `[]` and `[[]]` it changes
nothing.

**n8. A work plan without a `work` need.** "Has a `work` plan" is "its resolved list is not empty"
(plan :300-304); a role default such as `roles.staff.workNeeds` gives one to every staff room NPC,
including ones with no needs block. 11.1's `temp_user` owns `pat_pc` and is a desk owner, so it
gets a plan, a `metAt`, and the validator's "needsHome satisfies no `work`" warning, against
"nothing else" (plan :1669). Attach `work` and run the warnings only for an NPC with a `work` need.

**n9. One NPC record cannot be two beats.** H3 says Dana "gains" a `borrow_session` at 50, but W2
and H3 are the same scenario file. With the borrow, W2's first failure (34) already gives `tell` 2
(34 + 34 reaches 50) and her second hands over a borrow, against "After the second failure the icon
pulses" and "no workarounds". X3's Amy and W1 share the same problem in a milder form. Give H3 and
X3 their own NPCs.

**n10. `social_media` and the phone (C).** The dead-station rule lives in `_useCandidate`'s
`_giveUpReason` (5.2), which runs before the phone (8.1, item 4) can be chosen, so an NPC with a
phone and a dead PC parks `off` instead of using the phone. Apply the rule to `social_media` only
for `"phone": false`, or try the phone before `_giveUpReason` runs, and say which in 8.1.

**n11. The `needsDeferMin` warning covers only `work` plans.** The park floor applies to
`social_media` fails too (9.1); warn under 0.5 for an NPC with that need and `"phone": false`.

## 5. Existing scenarios

Checked against each changed method, for the lab (`lab_physical_pentest`), `test_needs_sims`,
`test_npc_needs`, `test_needs_leash`, `test_seating`, `test_clone_left_card` and the access test
scenarios (the only scenarios with `decayPerMin`; `m02_ransomed_trust` and `sis01_healthcare`
use `needs` only for other systems). None has `resources`, `workNeeds` or a `social_media` need,
so no NPC has a plan and nothing is judged.

| Change | Existing behaviour |
|---|---|
| Desk filter in `_useCandidate` and `_queueCandidate` | Gated on a judged need; `desk` in `describe` is read by nothing else |
| Dead-station rule in `_giveUpReason` | Gated on a judged need; the two null returns are unchanged |
| `_wakeParked` skips failure parks | Only judged needs have them; every park in these scenarios wakes from the same three callers. `test_needs_sims`' coffee machine and copiers keep their `off` parks and wakes |
| `wakeOn` clause before `:552` | Loops over failure parks only: none |
| Switched-on clause collects ids | Same log entry (`switched_on`), same `_clearBackoffs` and `_wakeParked` |
| `_turnBack`: a parking reason with no fallback parks | No existing row has `parks: true` and `fallback: false` (`answered`, `rang_out` are `parks: false`, `:99-105`) |
| `_grumble` options, new `PICTURE_CHATTER` entries | Existing calls pass none; topics unchanged; `grumble`, `grumble_off`, `grumble_gone`, `grumble_printer_off` pools in `test_needs_sims` and the lab's `grumble` pool are chosen as now |
| `npc_used` gains `met` | Only judged uses; `test/js/npc-needs.test.mjs:130` holds |
| `parked` log and event fields | Undefined values are dropped by `_log`; event assertions in `test/js/npc-avoidance.test.mjs` read named fields only |
| Policy, USB, social | As round 3; no `usbClass` in the lab, so Sofia's finds and the keylogger plant are untouched |

So the plan's section 14 holds, and the needs regression captures should show no difference.

## 6. Interfaces

| Point | 9.2 | Sibling | Status |
|---|---|---|---|
| Guest rule and `leavesOpen` | 6.4, check 7, validator | 9.1 5.2 and 14.2 | Agreed |
| `screen_always_locks?` | Read with no PC field | 9.1 step F builds it | Agreed; H builds it only if 9.1 is not built |
| `roles` | `workNeeds`, `frustration`, `workarounds` | 9.1 adds the key and deletes it from the bootstrap | Agreed |
| `resource_acl_admits?`, `reach_conditions` | `compile_npc_plan!` | 9.3a, built (`network_access.rb:405`, `network_model.rb:161`) | Agreed |
| `npc-needs.js` | The methods A-5 names | Office life | No new contact |

## 7. Verdict by sub-slice

| Sub-slice | Build now? | Before building |
|---|---|---|
| U | **Yes** | Nothing |
| A | **No**, after a short revision | M1 and M2 (9.1, 9.3, A-3 tests); minors n1 to n9. A-1, A-2, A-4 and A-5 are not touched by the majors |
| B | **No**, follows A | Nothing of its own; M1's binding sets its real bound |
| H | **No**, follows A and B | Nothing of its own; M5 is resolved |
| L | **No**, follows H | M1 and M2 apply to its `locked_out` fails |
| C | **No**, follows A | n10 and n11 |
