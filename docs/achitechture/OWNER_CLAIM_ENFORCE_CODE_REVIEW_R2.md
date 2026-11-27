# Owner claim enforcement (q78): code review, round 2

Branch `build/owner-claim`, R1 fixes in `948a239ef`, `8c4b726db` (merge of `main`), `246d995b0`,
`9844a5698` and `a74bd659d`, reviewed against R1 (`3151a443c`). 2026-11-12.

The rule is q78: refuse an owner claim only where honest play could never leave the screen open,
and never refuse an honest one. I compared `OwnerClaim` with the client code it mirrors:
`decideLocked`, `onLeft`, `onKnockedOut` and `onInteract` in `workstation-state.js`; `control`,
`_select`, `_useCandidate`, `_socialCandidate`, `_carryCandidate`, `_startJob`, `_completeJob`,
`_revealOutput`, `_reserve`, `_errandCandidate`, `_claimAnswerer`, `_leavePost`, `_atOwnPost`,
`_roomForbidden`, `_homeRoom` and `register` in `npc-needs.js`; the mapping dispatch in
`npc-manager.js`; `item-drop.js`; and the world adapter's `describe`.

## Summary

| Grade | Count |
|---|---|
| Blocker | 2 |
| Major | 0 |
| Minor | 2 |
| Nit | 4 |

Every R1 finding is fixed as described. Two client routes are still missed. Each would refuse an
honest claim, though no scenario today has either: a droppable source or accepting place
authored in a room the leash forbids (B1), and a print hook on the owner's own station used for
social media (B2). No real claim is refused: across all 176 scenarios only
`test_access_habits noor_pc` has no route, and the validator warns there and nowhere else.

## R1 findings

| R1 | Status |
|---|---|
| M1 knock-out where a knock-out always locks | Fixed. `open_without_estimate?` follows `decideLocked` with `expectedAwayMs` null branch for branch (see below). The reworked tests cover each branch. |
| M2 print command | Fixed. `print_command?` reads `eventMappings` as a list or a pattern map, and the singular `eventMapping` only when the plural is absent, as `npc-manager.js` normalises them. `print: null` and empty producers give no route, matching `control`. Only the owner's own mappings count, which is right: `control(npcId, ...)` always runs for the NPC that owns the mapping. |
| m1 print hook too wide | Fixed, with one gap (B2). The hook chance matches `_startJob`: `Number(chance)` finite and at most 0 never prints (so `null`, `""` and `false` never print, and a non-numeric string always does). `js_number` gives the same answers. |
| m2 `answersPhones` with no colleague's phone | Fixed. Still wider than the client (m1 below). |
| m3 no tests | Fixed: `test/unit/owner_claim_test.rb` and five validator tests. |
| n1 home preference | Noted in the `leave_route` comment, as agreed. |
| n2 interest leash | Fixed for fixed places. It also brings in half of B1. |
| n3 validator on raw data | Fixed: `NpcHabits.expanded_copy`, and screens that always lock are skipped. |
| n4, n5, n6, n7 | Fixed: `game.rb` says checks 1 to 10; the `js_number` comment lists the gaps; the warning ends with a fix; `PLAYTEST.md` names the `X-CSRF-Token` header and the stale paths are gone. |

### `open_without_estimate?` against `decideLocked`

With `expectedAwayMs` null, `decideLocked` goes: policy `autoLockMin: 0` locks (claim check 7
refuses that earlier); a finite numeric `lockChance` decides on its own (0 or below opens, 1 or
above locks, between them the seeded roll can open); otherwise any `locksScreenOnLeave` other than
`undefined` decides (`false` opens, `null` or `true` lock); otherwise no habit locks; otherwise the
threshold is skipped because there is no estimate, and only a numeric habit `lockChance` below 1
can open. The Ruby is the same in every branch. That includes the edge cases: a string
`lockChance` falls through on both sides, `locksScreenOnLeave: null` locks on both sides, and an
array `screenHabit` (an object to `habitOf`) locks on both. The server lockout (`_lockedOut`) only
ever adds a lock, and claim check 9 handles it first. `onKnockedOut` fires only for a tracked owner
with no away record, and claim check 3 asks the same "tracked" question.

## Findings

### B1 (blocker). A droppable source or accepting place in a forbidden room is missed

`item-drop.js` lets the player drop any inventory item marked `droppable: true`. The drop copies
the item's whole `scenarioData` (`{ ...data, takeable: true, ... }`), so its `affordance` comes
with it, and the item becomes an ordinary room object where it lands. `_useCandidate` and
`_carryCandidate` judge the leash on the object's room now, `o.roomId`, not on the room it was
authored in. So the player can carry a droppable coffee, or a droppable tray that accepts the
owner's interest tag, out of a room the owner may not enter and put it down in the owner's own
room. The owner then gets up for it: a real leave with a short estimate, which can find the PC
open.

The mirror judges the leash on the authored room (`e[:room]`). This covers objects nested in a
container or held by an NPC there, because `scenario_objects` gives nested hashes their top-level
room. Probes I ran against `leave_route`, with attacks off and the PC's `lockChance` 0:

- a droppable item with `satisfies: ["caffeine"]` in a room outside `needsRooms`: nil (refused);
- the same as a magnet (`affordance.magnet`): nil;
- the same inside a cabinet's `contents`: nil;
- an interest item at home and a droppable `accepts` tray outside `needsRooms`: nil. This half
  comes from the R1 n2 fix. The need half predates R1.

No scenario has a droppable item with an affordance inside a room (the droppable items in
`test_needs_sims`, `test_capture_log`, `test_npc_needs`, `test_access_networks`, `test_wearable`,
`lab_physical_pentest` and `test_access_work` are either in the start inventory, which already
counts, or carry no affordance), so no claim is refused today.

Fix: treat an object with `droppable: true` as roomless for the leash, for both need sources and
accepting places, since the player decides where it ends up. Add the four probes above as unit
cases that expect a route.

### B2 (blocker). A print hook on the own station, used for social media, is missed

`_socialCandidate` gives the owner's own station `social_media` in its `satisfies` for that
choice. `describe` even gives a social home desk an empty affordance when it has none. So an
owner with a `social_media` need uses their own PC for it, first, ahead of the phone (it heads
the list, and `_useCandidate` prefers the needs home). That use has `job.need` set and carries
nothing. `_startJob` rolls the hook's chance and sets `printTo`, and `_completeJob` prints, owned
through the `printHabit`. The due errand then carries the printout to the needs home. That is a
`carry` job, which `_atOwnPost` does not exempt, so `npc_left_post` fires.

`prints?` asks whether one of the owner's needs uses the hooked object through
`AccessWork.satisfies?`, which reads only the authored or preset affordance. An owner with
`needs.social_media`, `needsHome: "jo_pc"`, a `printHabit` and `onUse: { jo_pc: { revealOutput:
"printer" } }`, and nothing else, gets nil from `leave_route` (probe run). The same owner with a
`work` need and `satisfies: ["work"]` on the PC gets `prints`. No scenario has this today.

The fixer's judgement call (the hook object has to be used for one of the owner's needs) is right
in principle. Only a need use prints (`job.need && !job.carrying`). A phone answer, an interest
carry and an errand all have `need: null` and never print, and a magnet use counts through the
magnet's own `satisfies`. The gap is only this augmented station. Fix: in `prints?`, count the
hooked object as used when it is the owner's `needsHome` and the owner has a valid
`social_media` need (`AccessWork.judged?` already treats every `social_media` need as judged).
Add the probe as a unit case.

### m1 (minor). `answersPhones` still counts a phone the owner can never answer

`_claimAnswerer` skips an answerer whose position, or whose resolved home room, differs from the
ringing phone's room. A colleague's phone that is not in the owner's home room is therefore never
answered by this owner. This can be checked statically: require the colleague's phone to sit in
`home_room(data, owner, home_id)`. The error only goes the allow way, so it never refuses an
honest claim, but it is a counted leave that cannot happen.

### m2 (minor). A print route counts where the print can never be owned or fetched

`_revealOutput` returns a slot only when the producer has reveal slots (objects whose `outputOf`
names it). A `revealOutput` or print command naming an object with no slots prints nothing that
is owned, so no errand ever follows. `prints?` checks only that the producer list is non-empty.
Two more cases count a leave that cannot happen: a command with `forget: true`, and a `printHabit`
with `forgetChance` 1 (`_reserve` marks every such print forgotten, and `_errandCandidate` skips
forgotten prints). Requiring at least one slot object for some listed producer would close the
first case with no risk. The forget cases are rare and can stay allowed.

### n1 (nit). The claimable count in the build log is 18; check 7 refuses two of them first

My sweep finds 16 PCs that pass claim checks 1 to 9. `test_access_habits kai_pc` and
`test_access_sessions priya_pc` are under the `instant_lock` policy (`autoLockMin: 0`), so the
server refuses them before check 10. Both have a route anyway (`need:caffeine:kai_coffee`,
`knock_out`), so nothing changes. The R1 sweep and the fixer's sweep both left out the policy
check. The log's list of claimable PCs should drop them, or say they are refused by check 7.

### n2 (nit). An interest item counts anywhere, even where nothing can move it

`_carryCandidate` only notices an item in the interest's `noticeRooms` (else the home room).
Counting an item anywhere is right for a droppable one, as the `leave_route` comment says. A fixed,
non-droppable item outside those rooms is never noticed. This only allows more, and R1 accepted
it. With B1's `droppable` test in place, the same test could narrow this case.

### n3 (nit). The validator's prepared copy skips two of the server's steps

`expanded_copy` stamps room object ids and expands habits. It does not run
`normalise_access_model!`, which touches only creds and `usePayload` and so no leave-route field,
and it does not stamp resource or account-profile content ids. An id-less affordance object inside
a resource or a profile would be invisible to the validator but visible to the server. No scenario
has one.

### n4 (nit). The validator warns where a claim is refused for another reason too

The warning fires for any tracked owner whose screen does not always lock. That includes owners
with no account, owners an access list does not admit, and PCs under an `autoLockMin: 0` policy.
The warning's facts still hold in each case (no unlocked session there), so it is not false. Its
"the server refuses a claim" points at the wrong check, though. No scenario has such a case
today.

## Independent sweep (never block honest play)

My own script (in the session scratchpad, not the repo) renders every `scenario.json.erb` through
the validator's `render_erb_to_json` (176 rendered, none failed) and applies
`NpcHabits.expanded_copy`. For every sign-in PC with an owner it then records the server's
refusals 3 to 7 (tracked, account, `access`, `screen_always_locks?`, `autoLockMin: 0`).
`leave_route` runs three times: with the PC, without it, and with attacks forced off to see the
route behind a knock-out. Beside each it runs a liberal finder of my own that ignores the leash,
chances and rooms: my own reading of the knock-out rule, any source of a valid need other than
the home, judged failures, phones, print hooks and commands, `set` commands, interest items,
magnets, workarounds and social media.

- 16 claimable PCs. Only `test_access_habits noor_pc` returns nil, and the liberal finder finds
  nothing for Noor either: her refusal is real.
- The other 15 have routes: `lab_physical_pentest staff_pc_2` (`need:work:staff_pc`),
  `test_capture_log mel_pc`, and `test_access_habits` dana and lena by a need. The five claimable
  `test_access_sessions` owners, the three `test_access_social` owners with `l2_pc`, and
  `test_access_work` omar and leo go by a knock-out that can find the PC open (the liberal
  finder's own knock-out test agrees for every one), with a coffee need or a failure route behind
  it.
- Tracked owners with no route on PCs that are not claimable: `test_access_social` jake and lena
  and `test_access_work` amy. Their screens always lock (check 6), as the build log says.
- `check_access_model` over all 176 gives the never-leaves warning for `noor_pc` only, beside the
  older untracked-owner warning for `test_access_work pat_pc`. No false warnings, and none missed:
  the validator calls the same `never_leaves?`, so it can only miss what B1 and B2 miss.

## Sync size

Unchanged from R1: check 10 reads `scenario_data` at claim time and writes nothing, and a refusal
returns before `save!`. Nothing new goes into `player_state`, and the client sends nothing new.

## Live run

None. Nothing I found changes behaviour in any shipped scenario. The two blockers are static gaps
that no scenario reaches, and the fixes for them would add routes, never remove one.

## Tests run

Without the lock: `test/unit/owner_claim_test.rb`,
`test/controllers/break_escape/owner_claim_enforce_test.rb`,
`test/models/break_escape/npc_habits_loader_test.rb`, `test/unit/access_identities_screen_test.rb`,
`test/controllers/break_escape/access_model_login_test.rb`,
`test/controllers/break_escape/capture_proofs_test.rb`,
`test/controllers/break_escape/npc_lockout_l_test.rb`: 100 runs, 924 assertions, 0 failures, 0
errors. Node `test/js/validator-access-model.test.mjs`: 33 tests, 33 pass, none skipped.
