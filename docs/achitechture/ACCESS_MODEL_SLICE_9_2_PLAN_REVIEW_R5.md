# Access model slice 9.2 plan: confirming review, round 5

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md` as revised after round 4 (commit
`b6d4b07f4` on branch `claude/break-escape-access-design-090sjx`), against the code on the same
branch (`public/break_escape/js/systems/npc-needs.js`, `npc-action-icons.js`,
`public/break_escape/js/data/office-presets.json`, `app/models/break_escape/game.rb`) and the
existing scenarios. Nothing was run and no server was touched; every finding is from reading code
and documents. "plan :N" is a line of the plan; other line numbers are for the current tree.

The focus is the two round 4 majors and the parts written to resolve them: "Belongs to the NPC"
(causes and `object_id` tied to the NPC's own places), `u` as the shortest use time over those
places with a 20 second default, the 3 second allowance on both floors, the server's own causes
gating the `rearmed` shortcut, the new `held` park reason with its per-need `hold` carried on a
reload, the `social_media` kick limited to `"phone": false`, and the renamed beats (Rosa Lane in
H3, Ellis Ward in X3, the `intranet` resource). For each I looked for an honest player action the
server refuses, and for a gain a tampered browser has beyond what section 9.3 states.

**Counts: 0 blockers, 0 majors, 7 minors.**

| Grade | Count | Ids | Sub-slices |
|---|---|---|---|
| Blocker | 0 | | |
| Major | 0 | | |
| Minor | 7 | n1 to n7 | n1 A and L; n2 C; n3, n4, n6 A; n5 A (9.3 and the report); n7 C test scenario |

**Verdict in short.** Both round 4 majors are resolved in the text and fit the code, and all
eleven round 4 minors are resolved. The new parts are sound: no tampered gain beyond 9.3 was
found, and the server cannot be steered to a shorter floor by any field of the report. One honest
sequence is still refused (n1: an `off` park woken by the station coming back on, followed by a
failure whose cause the server owns), which loses one count, as round 4's reload case did; it is
graded minor for the same reason, and the plan's "designed out" sentence needs it. **U and A can
be built now**, with n1, n3, n4, n5 and n6 folded into A-3 and A-5. B, H, L and C are design-ready
and follow in order. Existing scenarios behave exactly as before.

## 1. Round 4 majors

| Id | Round 4 finding | Now | Evidence |
|---|---|---|---|
| M1 | The server never tied a fail report's object and causes to the NPC, so a tampered browser chose its own floor | **Resolved** | "Belongs to the NPC" (plan :1204-1219): `down`, `unreachable` and `no_access` must name a resource in the NPC's resolved list; `off`, `locked_out` and `social_blocked` the NPC's `needsHome` object or a `borrow_session` PC; `object_id` one of the NPC's places (own station, borrow PC, a non-desk object that satisfies the need, or null for a phone ease). Route check 2 applies it to fails and eases (plan :1311). `u` is worked out by the server as the shortest use time over those places, never from the report (plan :1241-1250), so naming another object changes nothing. The park floor is now chosen from the server's own causes, "whatever the report lists" (plan :1264-1272), so Kai listing only `down` keeps it. The three A-3 tests asked for are there (plan :1909-1916), as are the 20 second default and the one-second-either-side tests |
| M2 | An honest `off` fail after a met use was refused when the station went off during that use | **Resolved** | A later fail is measured from the last accepted **fail** only; an ease is a gate, not an anchor (plan :1256-1263). The met use between the two fails takes at least `u`, so the later fail clears the use floor; the reports go in order (the ease is queued at `_completeJob`, the `off` fail at the next `_select`), so the gate is open when the fail is checked. A-3 tests the exact case (plan :1904-1906) |

Round 4's minors are all resolved: n1 (3 second allowance, plan :1229-1238), n2 (`hold` and the
`held` park, plan :579-586, :1485), n3 (`exclude?.need === name`, plan :488-496), n4 (the kick
skips every parked need, plan :702-707), n5 (the station read from `needsHome` and the kick held
while the home is provisional, plan :400-402, :710-713), n6 ("own" defined and the `screenOwner`
warning, plan :369-372, :1572-1577), n7 (`reachable` per cause, plan :459-464), n8 (a plan needs a
`work` need, plan :300-308, :1363), n9 (Rosa and Ellis are their own NPCs, plan :1727-1728,
:1768, :1772), n10 (the dead-station rule and the kick only for `"phone": false`, plan :402-403,
:725-727, :1086-1089) and n11 (the `needsDeferMin` warning for `social_media`, plan :1569-1571).

## 2. What the new parts get right

- **Belongs to the NPC.** The client's candidate list for a judged need is exactly the server's
  "places" (plan :366-378 and :1211-1214 use one rule, resolved once in `access_work.rb`), so no
  honest report is refused by it. The desk test the server copies matches the client: `affordanceOf`
  resolves the object's own fields over its preset (`npc-needs.js:3275-3282`), which is the
  server's "authored, else preset, else 20" field by field, so the server's `u` is never above the
  client's real use time. The desk phone preset (`useSeconds` 0) satisfies nothing
  (`office-presets.json`), so it is never a place.
- **`u` and its default.** `npc-needs.js:2139-2140` is the 20 second default as cited. Taking the
  minimum over every place errs only towards a shorter floor (a fast break room tablet anywhere in
  the scenario lowers it), never towards refusing an honest report.
- **The allowance.** At `u` 5 the use floor is 1.5 seconds against an honest gap of at least 5;
  at `needsDeferMin` 0.5 the park floor is 24 seconds against 30. The figures in 9.3 and the
  validator report agree: `(2 - 1) x (0.9 x 10 - 3)` is 6, `(3 - 1) x (0.9 x 5 - 3)` is 3,
  `0.9 x 240 - 3` is 213.
- **The server's own causes.** None can clear in play: access lists are fixed, 9.3a's routes are
  only `[]` or `[[]]`, policies are fixed, and `add_login_lockout!` never drops an entry for a real
  account (`game.rb:1149-1151`, `:1922-1933`). So ignoring `rearmed` while one holds costs an
  honest client nothing except the one sequence in n1.
- **The social kick.** For an NPC with a phone, `_giveUpReason` never returns `off` and the kick
  never fires, so a dead PC sends it to the phone and counts nothing; 5.2, 5.6 and 8.1 now say the
  same.
- **The renamed beats.** H3's Rosa (finance and staff, `borrow_session` at 50, perFail 20) fails
  at 20, 40, 60 and borrows on the third, as the beat says; X3's Ellis (perFail 50, `emit` at 50,
  `noWarning`) fires on the first failure. `intranet` is an allowed kind (`scenario-schema.json:231`,
  "file_share, printer, or another kind"), and with no `work_fail_intranet` pool its line comes from
  `work_fail`, which the validator's mutter rule accepts. W1 and W2 keep their own NPCs.
- **Code references.** Every cited line checked (`_park` :1560, `_unpark` :1573, `_wakeParked`
  :1583, `_wakeParkedFor` :1599, `onGlobalChanged` :551 with its early return at :552, `TURN_BACK`
  :99-105, `_turnBack` :1627, `_grumble` :1661-1663, `_pickBark` :1721, `describe` :3297,
  `globalHolds` :3604, `besideCell` :3606; `game.rb` :96, :827, :890, :895, :965, :1142, :1181,
  :1232, :1294, :1542, :4027-4030, :4048) is where the plan says.

## 3. Minors

**n1. An `off` park woken by its station, then a failure with a cause the server owns, is refused
(A, L).**
*Where:* plan :1264-1283 (gate 2), :1296-1302 ("Every case ... is designed out"), :465-471 (the
station's targeted wake sets `rearmed`).
*Evidence:* take an NPC with a cause the server owns (Kai-style `no_access`, a `[]` route, a
blocking `social` policy with `"phone": false`, or an owner the player has locked out) whose own
PC has an `offWhen`. Its owned-cause fail F1 parks for `needsDeferMin`; the player unplugs the PC;
at the park's end the dead-station rule parks `off`, counted (F2, a park after F1: accepted). The
player plugs it back in: the `off` park is woken after one use time, with `rearmed: true`, the NPC
uses the PC for a use time and fails with the owned cause (F3, about two use times after F2).
Gate 2 is closed because an owned cause holds, no ease lies between, so F3 is held to the park
floor and answered `tooSoon`. The sentence "a failure with a cause the server owns has no `wakeOn`
and is never woken" is true, but the park that was woken was the `off` one before it. One count is
lost; the next park recovers it. No beat in 11.1 has this combination.
*Fix:* open the gate also when the last accepted fail listed only `off` and this one lists a cause
the server owns (store the last fail's causes per need beside `failAt`). The tampered bound for
such an NPC becomes two counts per park floor, one `off` and one owned; say so in 9.3 and halve the
validator's park-floor figure for an NPC whose station has an `offWhen`. Add an A-3 test: owned
fail, `off` fail a park later, owned fail two use times after that, all accepted, and a second
`off` fail a use time after the third refused. Or, if that is not wanted, state the lost count and
drop "designed out".

**n2. `metAt` is written only for an NPC with a `work` plan or a feed (C).**
*Where:* plan :1252-1255, 9.4's table (:1470), A-3's "an NPC not yet met ... refused" (:1897), 14
(:2316).
*Evidence:* "Can fail" for `social_media` (plan :1201-1202) allows an NPC with the need, `"phone":
false` and a blocking or switchable PC, with or without a feed. Such an NPC with no feed (an author
who wants the block to drive a `borrow_session` with no posts) gets no `metAt`. If "not yet met"
reads `metAt`, every fail it reports is refused; if it reads `encounteredNPCs`, `metAt` is unused
for it. The plan does not say which.
*Fix:* write `metAt` for every NPC the "can fail" rule allows or that has a feed, and say in 9.1
that check 1 is `encounteredNPCs` and `metAt` only anchors the first fail.

**n3. The `held` park over-holds (A).**
*Where:* plan :579-586, 9.4 (:1485).
*Evidence:* `register` applies the whole `hold` however long after the response the room loads,
so a player who walks into the room five minutes after the reload finds the NPC held for the full
time again (up to about 213 seconds with a default `needsDeferMin`), though the server would accept
a fail now. While held the need is parked, so an NPC whose outage cleared before the reload also
does no work at all for that time: no fail, but no met use and no ease either. And
`thoughtBubble` shows any park as the greyed need icon with the `closed` badge
(`npc-action-icons.js:155-159`, `PARKED_BADGE[...] || 'closed'`), so a "silent" hold reads as "no
source" under `showPressingNeeds`.
*Fix:* subtract the real time elapsed since the response was received (the end then falls at or
after the server's own end, as now), and give `held` no thought bubble (skip it in
`thoughtBubble`). A simpler alternative that keeps the NPC working: leave the needs untouched and
have `npc-reports.js` hold back a fail report for that NPC and need until its `hold` has run out;
nothing in sub-slice A's decisions depends on an answer (5.4), so the decision log is unchanged.

**n4. Two other paths unpark a failure or `held` park (A).**
*Where:* plan :451-455 lists the three callers of `_wakeParked()` only.
*Evidence:* an `npcNeeds` mapping with `set` unparks first (`_unpark(s, name, 'set')`,
`npc-needs.js:867`), and a magnet the NPC learns of wakes every parked need it satisfies
(`_wakeParkedFor`, `:702`, `:773`). A `set` on `work` from an event the player triggers (an ink tag,
a task) unparks an `off` park, which re-parks at once and is reported a tick after the last fail:
`tooSoon`. A `failed` park so unparked retries after a full use and, unmarked, is held to the park
floor: `tooSoon` again.
*Fix:* `set` on a judged need that is in a failure or `held` park sets the level for when the park
ends and leaves the park alone; `_wakeParkedFor` skips those parks as `_wakeParked` does. Add both
to 14's "skips failure parks" row (no existing scenario sets `work`).

**n5. 9.3 and the report miss the NPC whose only owned cause is a `[]` route (A).**
*Where:* plan :1426-1435, validator report :1611-1620.
*Evidence:* gate 2 counts a resource with `routes: []` as an owned cause, so `rearmed` is ignored;
but only an NPC with an unadmitted resource has its eases refused. A tampered browser can therefore
walk the `[]` NPC up by alternating claimed eases and fails at the use floor, like `locked_out` and
`social_blocked`. That is inside 9.3's general bound, so no gain beyond it, but 9.3 lists only the
other two in the alternation class and the report prints no "only by alternating" note for it.
More tightly: an ease naming the NPC's own station is never honest while an owned cause holds
there (`[]` from the home station, a blocking policy, a lockout at that PC), since no use there can
be met.
*Fix:* name the `[]` case beside `locked_out` and `social_blocked` in 9.3 and the report. Optionally
refuse an ease whose `object_id` is the NPC's own station while an owned cause holds there, which
leaves only a borrowed or non-desk place to claim an ease from (L1's hot desk ease stays honest).

**n6. One A-3 test says "that station's use time" (A).**
*Where:* plan :1913-1914.
*Evidence:* the rule is the NPC's shortest use time over its places (plan :1241-1244). In the test
fixture they are equal only if the station is the NPC's only place.
*Fix:* "floored by the NPC's shortest use time (here its station's)".

**n7. F4's Omar keeps the default park (C, test scenario).**
*Where:* 11.2 set-up (plan :1795-1798) and F4 (:1805).
*Evidence:* 11.1 gives every desk owner `"needsDeferMin": 0.5`; 11.2 sets none. Omar's
`social_blocked` failures have no `wakeOn`, so his second failure, which F4 waits for, comes about
four minutes after the first, past 11 point 4's "one to four minutes", and his park floor is the
213 second one.
*Fix:* author `"needsDeferMin": 0.5` on Omar (and on any 11.2 NPC with `"phone": false`).

## 4. Tampered browser, checked against 9.3

Tried and found closed: naming another NPC's resource or station; naming a desk phone or any
object outside the places; twenty `rearmed` fails in one request; omitting `no_access` (or
`locked_out`, `social_blocked`, a `[]` resource) from a `rearmed` report; an ease from Kai to open
gate 1; a null `object_id` (it is only a phone ease, and opens no faster gate than an ease at a
place); an `off` cause naming a borrow PC (allowed, harmless: it changes neither `u` nor the gate).
Open, and stated in 9.3: the use-floor pace for browser-controlled outages, the first fail at
once, alternation for owned causes, per-need doubling, `check` at any time. The only additions are
n1's fix (two counts per park floor for an owned-cause NPC with a switchable PC, to be stated) and
n5's wording.

## 5. Existing scenarios

Re-checked for the lab (`lab_physical_pentest`), `test_needs_sims`, `test_npc_needs`,
`test_needs_leash`, `test_seating`, `test_access_signin`, `test_access_sessions` and
`test_access_doors`. None declares `resources`, `roles`, `workNeeds`, `frustration`,
`workarounds` or a `social_media` need (searched), so no NPC has a `work` plan and nothing is
judged. The only `offWhen`s are in `test_needs_sims`, none on a workstation. The two access test
scenarios set `usb` and `social` to `"allowed"` as 14 says.

| Change since round 4 | Existing behaviour |
|---|---|
| "Belongs to the NPC", `u`, the 3 second allowance, owned causes in gate 2 | New route only |
| `held` park, `hold` in `GET /scenario` | Only from an `npcFrustration` entry: none |
| `_wakeParked` skips `held` | No `held` parks exist |
| Kick for `social_media` only with `"phone": false` | Nobody has the need |
| Dead-station rule reads `needsHome`, kick waits for a provisional home | Gated on a judged need |
| `metAt` only with a plan or feed | None |

So section 14 holds, and the needs regression captures should show no difference.

## 6. Verdict by sub-slice

| Sub-slice | Build now? | Before or while building |
|---|---|---|
| U | **Yes** | Nothing |
| A | **Yes** | Fold n1 (or its stated alternative), n3, n4, n5 and n6 into A-3 and A-5; all are a sentence or a test each |
| B | **No**, design-ready; follows A | Nothing of its own |
| H | **No**, design-ready; follows A and B | Nothing of its own |
| L | **No**, design-ready; follows H | n1 applies to a locked-out owner whose PC can be switched off |
| C | **No**, design-ready; follows A | n2 and n7 |
