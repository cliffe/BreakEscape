# Owner claim enforcement (q78): code review, round 1

Branch `build/owner-claim` (commits `03499118a`, `b310933e3`, `6ba697b56`), reviewed against
`main` with `git diff main...HEAD`. 2026-11-12.

Scope: `lib/break_escape/owner_claim.rb`, the new check in `Game#claim_login_session!`,
`AccessIdentities.screen_always_locks?` and `js_number`, the validator warning, beat H10 in
`test_access_habits`, the new controller test, and the plan and build log edits. I compared the
mirror with the client code it copies: `npc-needs.js` (`_select`, `_useCandidate`,
`_socialCandidate`, `_carryCandidate`, `_errandCandidate`, `control`, `_claimAnswerer`,
`_leavePost`, `_atOwnPost`, `_countFailure`, `enqueueVisit`, `onExternalMove`),
`workstation-state.js` (`decideLocked`, `onLeft`, `onKnockedOut`, `_rollScreen`, `onInteract`),
`npc-workarounds.js`, `player-combat.js` and `npc-hostile.js`.

## Summary

| Grade | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 3 |
| Nit | 7 |

No honest claim is newly refused in any of the 176 scenarios. Two gaps go the other way: a
knock-out is counted as a route even where a knock-out leave always locks the screen (the branch's
own test honours such a claim), and a print command in an event mapping is a real way to leave
that the mirror misses.

## Independent sweep (never block honest play)

A script of my own (not the builder's) rendered every `scenario.json.erb` (176), applied
`NpcHabits.expanded_copy` as the server does at game creation, and for every sign-in PC with a
tracked owner who has an account, is admitted by the PC's access list and is not refused by
`screen_always_locks?`, called `OwnerClaim.leave_route` twice: once as authored and once with
`disableAttacks` forced on, to see the route behind the knock-out.

18 claimable PCs. Only `test_access_habits noor_pc` returns nil. The other 17 match the build
log: `lab_physical_pentest staff_pc_2` (need), `test_capture_log mel_pc` (need),
`test_access_habits` dana, kai and lena (need), six `test_access_sessions` owners (knock-out, then
a coffee need behind it), four `test_access_social` owners and two `test_access_work` owners
(knock-out, then a failure route behind it). The script also flagged, for each claimable PC,
whether the owner's habit has a threshold with no lock chance (finding M1), whether the print
route rests on somebody else's hook (m1), and any print command (M2): none fired on a real PC.

Note on the sweep: rendering the raw ERB without the habits expansion hides the four
`test_access_habits` owners (their PCs then look as if they always lock), so any repeat of this
sweep must expand habits first.

## Findings

### M1 (major). A knock-out counts as a leave even where a knock-out leave always locks

`leave_route` returns `knock_out` whenever attacks are on and the owner is not `koImmune`. A
knock-out reaches the workstation layer as `onLeft(npcId, { reason: 'ko' })` with no
`expectedAwayMs`, so `rec.expectedAwayMs` is null. In `decideLocked`, a PC with no `lockChance`
and no `locksScreenOnLeave` falls to the owner's `screenHabit`; with `lockIfAwayOverSeconds` set
and a null estimate the threshold test is skipped, and with no numeric habit `lockChance` the
function returns true. So for such an owner a knock-out always locks, and only a need leave whose
estimate is under the threshold can leave the screen open.

Where the knock-out is the only route, honest play can never open that PC, yet the claim is
honoured. The branch's own test does exactly that: "a habit threshold written as a string, read as
Number() reads it" in `owner_claim_enforce_test.rb` has attacks on, no source for Jake's need, no
lock field on `jake_pc` and `screenHabit: { lockIfAwayOverSeconds: '20' }`, and asserts the claim
succeeds. Under q78 the server should refuse it.

Fix: count the knock-out only when a leave with no estimate can be open: the PC's `lockChance`
below 1, or `locksScreenOnLeave: false`, or (with neither on the PC) a habit with a numeric
`lockChance` below 1. The same reasoning applies to any route whose leave has no estimate. Rework
that honoured test case so it keeps a real route (a coffee source in reach), and add the
knock-out-only version as a refusal. No real scenario is affected today.

### M2 (major). A print command in an event mapping is a missed route

`NPCNeedsSystem.control(npcId, { print })`, reached from any event mapping with a `needs: { print:
... }` field (`npc-manager.js`), prints as that NPC with an owned slot whatever its `printHabit`
(`own.habit` defaults to `{}`), so a due errand follows: `_errandCandidate` carries the slot to the
needs home, a `carry` job, which `_atOwnPost` does not exempt, so `_leavePost` emits
`npc_left_post`. No `revealOutput` key is needed anywhere in the scenario for this.

The mirror's print route is `key_anywhere?(data, 'revealOutput')`, so a scenario that gives an
owner a print command and has no `revealOutput` hook would have an honest claim refused. Only
`test_needs_sims` uses print commands today, and it has no claimable PC, so no real claim is
refused; it is still a client route the mirror misses, against the "where unsure, allow" rule.

Fix: count the print route for an owner whose own event mappings (on the owner's record) carry a
`needs.print`, as well as the hook case (see m1). Add a test case with a print command and no
`revealOutput`.

### m1 (minor). The print route is far wider than the client's

Besides M2, the print route accepts any `revealOutput` anywhere in the scenario. On the client a
print the owner will fetch comes only from (a) the owner's own `onUse[<object>].revealOutput` hook
on a need use, owned only when the owner has a `printHabit` (`_completeJob`: `habit ? { habit } :
null`; an unowned print is never fetched), or (b) a print command. Another NPC's hook never sends
this owner anywhere. The errand also needs a string `needsHome` that names an object
(`_errandCandidate` returns null without it).

Two related wording slips: the plan's check 10 says "no `revealOutput` printer exists", and the
honoured test case "a printer can give an errand" puts `revealOutput` on a printer object.
`revealOutput` lives on an NPC's `onUse` hook, not on the printer, so the fixture passes only
because the mirror looks for the key anywhere.

Fix: scope the route to the owner's own hooks with a `printHabit` (or a print command), and move
the test fixture to an `onUse` hook on Jake with a `printHabit`.

### m2 (minor). `answersPhones` counts with no colleague's phone

`_claimAnswerer` only sends an `answersPhones` NPC to a ringing object whose `phoneOwner` is
somebody else, in that phone's room, after `desk_phone_ring:<id>` (a mapping's `emitEvent` or an
object's `emit_event`). With no object carrying another person's `phoneOwner` in the scenario, the
route can never fire. The build log lists this as allowed because unsure; whether a phone rings is
dynamic, but whether a colleague's phone exists at all is static and certain. Requiring at least
one object with a `phoneOwner` other than the owner would close it without any risk to honest
play.

### m3 (minor). No automated test for the validator warning or the route labels

The validator warning was checked by hand on `test_access_habits`. No validator test asserts that
it fires for a never-leaves owner and stays silent for each route, and nothing tests
`OwnerClaim.leave_route` directly (its labels are only visible in the server log). A small unit
test over the same fixtures as the controller test would have caught M1 (the client's knock-out
leave has no estimate), and would guard the validator against false warnings as routes are
refined.

### n1 (nit). The home preference is not modelled, and is not in the "allowed" list

`_useCandidate` always picks the owner's own needs home when it satisfies the need and is free and
reachable. Another source for the same need is used only when the home is busy, off, hidden,
unreachable or just turned back from. So "a source elsewhere" is a real route only when the home
does not satisfy that need, or something can make it unavailable. Allowing it is a fair "unsure"
call (`_free` and turn-backs are dynamic), but the build log's list of allowed cases should say
so. It also makes the route label misleading: `lab_physical_pentest staff_pc_2` reports
`need:work:staff_pc`, while Pierce's real way away is his caffeine need.

### n2 (nit). Interests ignore the room leash

`_carryCandidate` applies `_permitted(s, o, false)` to both the item and the target, so an item or
an accepting place in a room the leash forbids is no route. The mirror counts any tagged item and
any accepting object. Allowing an item anywhere is right (the player can drop a takeable one), but
the accepting target is fixed and its room can be checked as for needs.

### n3 (nit). The validator judges raw data; the server judges prepared data

`check_access_model` gets the raw `json_data`; the server's `scenario_data` has been through
`prepare_scenario_data!` (habits expanded, object ids stamped). The habits expansion does not touch
any leave-route field, but an id-less object is invisible to `scenario_objects` in the validator
and has a stamped id on the server. An id-less preset coffee machine as an owner's only source
would raise a warning the server disagrees with. The sweep of all 176 scenarios found no such
case.

### n4 (nit). The claim method's comment still says checks 1 to 9

`game.rb` now says "claim checks 1 to 9" while the plan lists 10 and the new line is check 10.

### n5 (nit). Number() edge cases

`js_number` returns NaN for an array, where JavaScript gives 0 for `[]` and the number for `[n]`,
and Ruby's `Float()` accepts `"1_000"` where `Number()` gives NaN. `positive_number?` (already used
by `needs_tracked?`) rejects `true`, which `Number()` reads as 1. No scenario authors any of these;
a note in the helper's comment would do.

### n6 (nit). The validator warning has no remedy

The neighbouring warnings end with a fix ("Fix the chance at 0 or 1, or make sure another route
exists."). This one only explains. Something like "Give the owner a need met somewhere else, or
allow attacks, if the screen is meant to be found open." would match them. The wording is
otherwise accurate and plain.

### n7 (nit). H10's forged-claim step does not say how to authenticate it

PLAYTEST.md Run 4 step 3 gives the URL and body. The request I sent needed the page's CSRF token
(`meta[name=csrf-token]` as `X-CSRF-Token`); saying so saves a tester a failed first try. The
Setup section's `/opt/rbenv` and `/opt/pw-browsers` paths are stale too, though that is older than
this branch.

## Judgement on the builder's "allowed because unsure" cases

| Case | Verdict under q78 |
|---|---|
| PC owned through `screenOwner`, not the needs home | Right. `_stationsOf` rolls every PC the owner owns on each leave. |
| No scenario switch for claims | Right. Neither side has one. |
| Owner removed, hidden, hostile or moved by a script | Right. Dynamic, and a removal can follow an open leave. A script move (`onExternalMove`) emits no `npc_left_post`, so it is correctly not a route. |
| Sources unreachable by path, hidden by `revealOnGlobal`, off by `offWhen`, magnets | Right. Doors and globals change in play; magnets are items the player puts out. |
| Interest item anywhere | Right for the item; the accepting target's room could be checked (n2). |
| Any `revealOutput` allows | Too wide (m1), and misses print commands (M2). |
| `answersPhones` with no colleague's phone | Too wide where no colleague's phone exists at all (m2). |
| Habit threshold 0 or more, `null` read as 0 | Right for a positive threshold. A threshold of 0 almost never yields an open screen, but proving that needs trip times, so allowing it is fair. The knock-out case is different and certain (M1). |
| Short `autoLockSeconds`, needs that never get urgent | Right. |

## Validator warning across all scenarios

Calling `check_access_model` on every one of the 176 scenarios gives exactly one new warning, for
`test_access_habits noor_pc`. The only other never-leaves style warning is the existing
untracked-owner one for `test_access_work pat_pc`. No false warnings.

## Beat H10

Noor has one need, `work`, not judged (no work list), met only by the `affordance` on her own
`noor_pc`, with `needsRooms: ["noor_room"]` and the scenario's `disableAttacks: true`. Nothing else
in the scenario satisfies `work`, she has no interests, no phone duty and no print hook. The
never-leaves result is genuine, and H10 tests it cleanly. The sign, task and mapping are fine.

## Live proof

Keyless server from this worktree on :3063 (checked free first; :3050 was in use by another
process), headless Chromium through the playtest session harness. Physics: RAF switched to
setTimeout mode, `smoothStep` false, `minFps` 1, `setFPS(20)`, `fixedStep` left on (checked:
`fixedStep: true`, `fps: 20`). The first walk from the lobby to `noor_room` ran before I applied
the throttle; every step after that, including the walk back to `dana_room`, ran with it. The
player crossed each door normally.

Game **1668** (`test_access_habits`), the only game created.

1. Clicking `noor_pc` from beside the chair: toast "Noor Qureshi is using this PC.", events
   `pc_in_use:noor_pc` and `objective_task_completed:h10_never_leaves`. (A first click landed on
   Noor herself and opened her conversation, which I closed without choosing.)
2. 120 s of needs clock (manual clock, 1 s steps with real frames between): Noor became urgent and
   started a `use` job at `noor_pc`; `atPost` stayed true, `npc_left_post:noor` never fired, and
   the workstation showed `present: true`, `away: null`.
3. Forged claim from the page (`fetch` POST `/break_escape/games/1668/login`, body `pc_id:
   noor_pc`, `claim: owner`, globals saying away and unlocked, with the CSRF token): 422 `{
   success: false, message: "Sign in required" }`. Server log: `login claim refused at noor_pc:
   the owner never leaves the post`.
4. Honest claim: in `dana_room`, Dana had left for her coffee (`present: false`, away record with
   `expectedAwayMs` 604036, `screenLocked: false`). Clicking `dana_pc` opened her desktop,
   "Signed in as Dana Reyes (dreyes)" (screenshot checked). Server log: `login claim at dana_pc
   for dana`; saved `sessions = { "dana_pc" => { "id" => "dana", "via" => "claim" } }`, and no
   `noor_pc` session.

The browser session and the server were stopped by PID afterwards.

## Sync size

The new check reads `scenario_data` on the server at claim time and writes nothing: the refusal
returns before `save!`. `AccessWork.with_index` caches its index in a thread-local for the length
of the call, not in the scenario hash. Game 1668's `player_state` has no new key; its only claim
trace is the existing `sessions` entry from the honest claim (2757 bytes in all). Nothing new is
sent by the client.

## Tests run

Without the lock: `owner_claim_enforce_test`, `access_model_login_test`, `capture_proofs_test`,
`npc_lockout_l_test`, `access_identities_screen_test`: 82 runs, 826 assertions, 0 failures, 0
errors. No JavaScript changed on the branch, so no node tests were run.
