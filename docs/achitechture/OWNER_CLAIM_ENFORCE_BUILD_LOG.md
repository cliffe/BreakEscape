# Owner claim enforcement (decision q78): build log

Branch `build/owner-claim`, worktree `.claude/worktrees/p-owner-claim`, 2026-11-12.

## The decision

`POST /login` with `{ pc_id, claim: "owner" }` opens the owner's session at an office-life PC
without a password. The server cannot see NPC positions or the seeded screen roll, so a tampered
client can claim a session the player never found open. User decision q78: accept that as best
effort where it only saves the student time, but where honest play could never leave the screen
open, the server enforces it. A claim must never be refused where honest play could succeed;
where unsure, allow.

## What changed

- `lib/break_escape/owner_claim.rb` (new): `OwnerClaim.leave_route(data, owner)` returns the first
  way honest play can make the owner leave their post, or nil. Plain Ruby, used by the server and
  the validator. `never_leaves?` is `leave_route.nil?`.
- `Game#claim_login_session!`: after the existing checks, refuses with "Sign in required" (log
  reason `the owner never leaves the post`) when `OwnerClaim.never_leaves?`.
- `AccessIdentities.screen_always_locks?`: a habit's `lockIfAwayOverSeconds` is read as the client's
  `Number()` reads it (`"20"` counts, `null` is 0), and a negative threshold can never be met, so
  `lockChance` alone decides there. New helper `AccessIdentities.js_number`.
- `scripts/validate_scenario.rb`: a warning for a sign-in PC whose tracked owner never leaves (the
  same test), beside the existing warning for an untracked owner.
- `docs/achitechture/ACCESS_MODEL_PLAN.md` section 6, the claim row: the stale sentence "A lockout
  of the owner's username does not stop a claim" is replaced by check 9 (the lockout, as the code
  has done since sub-slice L) and check 10 (this one).
- `scenarios/test_access_habits`: beat H10 (Run 4). Noor Qureshi in `noor_room`, north of Omar's
  room: `locksScreenOnLeave: false`, her only need (`work`) met at her own PC, attacks off. Task
  `h10_never_leaves` completes on `pc_in_use` at `noor_pc`. `PLAYTEST.md` has the run and the
  second expected validator warning; the dungeon graph is regenerated.

## How "the owner can leave" is decided

Mirrored from `npc-needs.js` (what emits `npc_left_post`) and `workstation-state.js` (what counts
as a leave). Any one route allows the claim:

1. **Knock-out.** `onKnockedOut` counts a knock-out of a tracked owner as a leave. Possible unless
   the scenario has `disableAttacks: true` (`player-combat.js attacksDisabled`) or the owner has
   `koImmune: true` (`npc-hostile.js`).
2. **Desk phones.** `answersPhones: true`: a colleague's ringing phone is a real leave
   (`_claimAnswerer`).
3. **Print errands.** Any `revealOutput` in the scenario (a printer hook can give a printout to
   fetch, slice 17).
4. **A need with a source.** For each need that `normaliseNeed` accepts (`decayPerMin` and
   `urgentAt` above 0): an object anywhere in the scenario whose affordance (own fields over the
   office preset, `AccessWork.affordance`) satisfies it, other than the owner's own `needsHome`
   (a use there never leaves the post, `_atOwnPost`), allowed by the room leash (`needsRooms`,
   `needsAvoidRooms`, the room's `needsPrivateTo`; the home room is never forbidden,
   `_roomForbidden`) and by a `private` affordance's owners (`_permitted`, `_owners`). A judged
   need (`work` with a plan, or `social_media`) skips other desks (`_otherDesk`).
5. **A judged need that can fail** (`AccessWork.can_fail?`): a failure queues a check visit or a
   workaround, either of which can walk.
6. **An interest** (`normaliseInterest`, weight above 0) with both an item carrying its
   `needsTag` and an object whose affordance `accepts` it (`_carryCandidate`).

"Anywhere in the scenario" is every hash with a string id, rooms and container contents, the start
inventory and items given later, so an item the player can drop counts too.

## Cases refused

New in this build:

- The owner never leaves the post: none of routes 1 to 6 exists. This covers "no need or routine
  sends them away" (no source for any need, or every source is their own PC), "the room has nowhere
  for them to go" (every source is in a room the leash forbids, or private to somebody else), an
  interest with no item or no place for it, and a judged need that cannot fail with only other
  desks as sources. Only when attacks are off or the owner is `koImmune`.
- A habit with a negative `lockIfAwayOverSeconds` and no PC lock field, with `lockChance` unset or
  at least 1: every leave locks.

Already refused before this build (unchanged): a claim through a foothold; no such PC; a headless
host; an unreachable PC; a session already held there; no owner (this includes an owner who is not
a room NPC, so is absent for the whole game); an untracked owner; no account; an access list that
does not admit the owner; a screen that always locks (`lockChance` 1, `locksScreenOnLeave` unset or
true, a habit with `lockChance` 1); the owner locked out at that PC; a policy with `autoLockMin: 0`.

## Cases allowed because they could succeed, or I was not sure

- **The PC is not the owner's needsHome** (owned through `screenOwner`): allowed. The client rolls
  every PC the owner owns on each leave from their real post (`_stationsOf`), and the owner is
  "present" only while at that post, so the screen can be found open.
- **No scenario switch turns the claim off.** Neither the client (`interactLoginPc`,
  `pc-sessions.js claim`) nor the server has one, so there is nothing to mirror.
- **Owner removed, hidden, hostile or moved by a script.** Dynamic and client-reported
  (`room_states.npcs_removed`); a removal can follow an open leave. Allowed.
- **Sources the owner may not reach by path** (locked doors, another room never loaded), sources
  hidden by `revealOnGlobal` or switched off by `offWhen`, and magnets (they need sight or word of
  mouth): all count as sources.
- **Interests**: the item may be anywhere, not only in its `noticeRooms` or the home room.
- **Prints**: any `revealOutput` allows the claim, though a printout is owned only with a
  `printHabit` or a print command.
- **`answersPhones: true`** allows the claim even with no colleague's phone in the room.
- **A habit threshold of 0 or more** (including `null`, read as 0): a trip that short may never
  happen, but working that out needs the walk and use times.
- **A short `autoLockSeconds`**, and needs so slow they never get urgent in a session: allowed.

A sweep of every scenario's claimable PCs (tracked owner with an account) found no existing PC that
the new rule refuses: `lab_physical_pentest staff_pc_2`, `test_capture_log mel_pc` and every
`test_access_habits` owner leave for a need source; every `test_access_sessions`,
`test_access_social` and `test_access_work` owner can be knocked out. Only the new `noor_pc` is
refused.

## Sync size

Nothing is added to `player_state` and nothing new is sent. The check reads `scenario_data` on the
server at claim time only (one walk of the scenario hash per claim).

## Tests

- `test/controllers/break_escape/owner_claim_enforce_test.rb` (new): 12 refusal cases and 16 honest
  cases, each through `POST /login`. The log shows 11 refusals for "the owner never leaves the
  post" and 1 for "the screen always locks" (the negative threshold). 2 runs, 84 assertions, 0
  failures.
- Affected files, run without the lock: `access_model_login_test`, `capture_proofs_test`,
  `game_state_locking_test`, `network_remote_signin_test`, `npc_lockout_l_test`,
  `owner_claim_enforce_test`, `lab_physical_pentest_secrets_test`, `npc_habits_loader_test`,
  `access_identities_screen_test`: 151 runs, 1863 assertions, 0 failures. Validator-adjacent:
  `access_model_withholding_test`, `access_work_social_test`, `access_work_test`,
  `declared_grants_test`, `network_shares_test`: 70 runs, 0 failures. `npc_habits_clues_test`: 14
  runs, 0 failures. No JS changed, so no node tests were run.
- Validator on `test_access_habits`: no errors; the new warning fires for `noor_pc` only.

## Live proof

Keyless server on :3050 from this worktree, headless Chromium, physics `setFPS(20)` with fixed
steps on (RAF in setTimeout mode). Game **1649** (`test_access_habits`).

1. Walked lobby, `dana_room`, `omar_room`, `noor_room`. Clicked `noor_pc`: "Noor Qureshi is using
   this PC.", `pc_in_use:noor_pc`, task `h10_never_leaves` complete.
2. Waited 120 s of needs clock: Noor took a job at `noor_pc` (her own post), `atPost` stayed true,
   `npc_left_post:noor` never fired, and `noor_pc` never had an away record.
3. Forged claim from the page (`fetch` POST `/login` with `claim: "owner"` and the globals saying
   away and open): 422 `{ success: false, message: "Sign in required" }`; server log
   `login claim refused at noor_pc: the owner never leaves the post`.
4. Honest walk-up: back in `dana_room`, Dana had left for her coffee (`present` false,
   `screenLocked` false). Clicked `dana_pc`: her desktop opened through a claim ("Signed in as Dana
   Reyes", screenshot checked). Server: `sessions = { dana_pc: { id: dana, via: claim } }`, tasks
   `h1_never_locks` and `h10_never_leaves` completed, log `login claim at dana_pc for dana`.

The server and the browser were stopped by PID afterwards.

## Commits

- `03499118a` Owner claim q78: refuse a claim where the owner never leaves the post
- `b310933e3` test_access_habits H10: an owner who never leaves; plan claim checks 9 and 10
- this log

## Handover

Done. Open for the orchestrator: the full Rails and JS suites under the lock with the next merge
batch. `tools/playtest/verify-run.rb --access` reports `alwaysLocks` per PC but not the new
never-leaves result; adding it would help regression testers read H10 (not done).

## R1 fixes

Review: `OWNER_CLAIM_ENFORCE_CODE_REVIEW_R1.md` (commit `3151a443c`). The rule stays q78: refuse a
claim only where honest play could never leave the screen open, and never refuse an honest one.

- **M1, the knock-out.** A knock-out leave reaches `decideLocked` with no time-away estimate, so a
  habit's `lockIfAwayOverSeconds` never opens it. `leave_route(data, owner, pc)` now takes the PC
  and counts the knock-out only where `OwnerClaim.open_without_estimate?` says that leave can find
  it open: the PC's numeric `lockChance` below 1, else its `locksScreenOnLeave` key set to `false`,
  else a `screenHabit` with a numeric `lockChance` below 1. That is `decideLocked` with
  `expectedAwayMs` null, branch for branch. With no PC given the knock-out still counts. The
  server and the validator both pass the PC. The branch's own honoured case ("a habit threshold
  written as a string") now has a coffee in reach, and the knock-out-only version is a refusal.
  `npc_habits_loader_test` had the same knock-out-only case honoured (`lockIfAwayOverSeconds: 20`,
  no need source); it now expects a refusal and gains the honoured version with a source.
- **M2, print commands.** An event mapping on the owner's record (`eventMappings` as a list or a
  pattern map, or the singular `eventMapping`) with `needs: { print }` naming a producer counts as a
  leave route: `control` always owns that print, so an errand follows.
- **m1, print hooks.** Narrowed to what the client does: the owner's own `onUse` hook with
  `revealOutput`, on an object one of the owner's valid needs uses (only a need use prints), with a
  `printHabit` (an unowned print is never fetched) and a hook `chance` that is not 0 or less. Both
  print routes also need a `needsHome` that names an object (`_errandCandidate`). A `revealOutput`
  on a printer object, or on another NPC's hook, no longer counts. Plan check 10 is reworded, and
  the honoured test fixture moved to a hook on Jake with a `printHabit`.
- **m2, phones.** `answersPhones` counts only when some object has a `phoneOwner` other than the
  owner.
- **m3, tests.** New `test/unit/owner_claim_test.rb` (8 tests on the route labels, every M1 branch,
  phones, both print routes and their near misses, the interest leash). Validator warning tests in
  `test/js/validator-access-model.test.mjs`: it fires with a fix for a never-leaves owner, stays
  silent for each route, still fires for the near misses, and skips a screen that always locks.
- **n2.** An interest's accepting place now has to be in a room the leash allows (the item may
  still be anywhere).
- **n3.** The validator now judges the warning on `NpcHabits.expanded_copy` (habits expanded, ids
  stamped), as the server's prepared data is, and only where the screen does not always lock. This
  became necessary with M1: judged on raw data, `test_access_social` `jake_pc` and `lena_pc` and
  `test_access_work` `amy_pc` (no lock field and no habit, so check 6 refuses them already) drew a
  false never-leaves warning. A validator test with an id-less source covers the stamping.
- **n4.** The `game.rb` comment says checks 1 to 10.
- **n5.** `js_number`'s comment lists the known gaps from `Number()`.
- **n6.** The validator warning now ends with a fix: give the owner a need met somewhere else, or
  allow attacks and give the PC a `lockChance` below 1.
- **n7.** `PLAYTEST.md` Run 4 step 3 says to send the page's CSRF token as `X-CSRF-Token`, and the
  Setup section's stale Ruby and browser paths are replaced.
- **n1, noted only.** The home preference is not modelled: a need source elsewhere counts even
  where the owner's own `needsHome` usually serves that need (it is used elsewhere only when the
  home is busy, off, hidden, unreachable or just turned back from, all dynamic). So
  `lab_physical_pentest staff_pc_2` reports `need:work:staff_pc` though Pierce mostly leaves for
  his caffeine need. The `leave_route` comment now says the label is the first route found.

Merged `main` (at `de866cd20`) into the branch: one conflict in `game.rb` (the claim method's
comment beside main's new `pc_off_answer`), resolved keeping both.

### Sweep after the fixes

A sweep script (in the session scratchpad, not the repo) rendered all 176 `scenario.json.erb`
files, prepared each as the server does at game creation (`Game#prepare_scenario_data!`:
access-model normalising, id stamping, habits expansion), and for every sign-in PC whose owner is
tracked, holds an account, is admitted by the PC's access list and whose screen does not always
lock, called `leave_route` as authored and with attacks forced off. 176 rendered, none failed. 18
claimable PCs, the same 18 as the review. Only `test_access_habits noor_pc` returns nil. Routes:
`lab_physical_pentest staff_pc_2`, `test_capture_log mel_pc` and `test_access_habits` dana, kai and
lena by a need; the six `test_access_sessions` owners and the six `test_access_social` and
`test_access_work` owners by a knock-out (every one of those PCs has a lock field that can leave it
open), with a coffee need or a failure route behind it. `check_access_model` over all 176 gives the
never-leaves warning for `noor_pc` only, beside the older untracked-owner warning for
`test_access_work pat_pc`.

No live re-check: nothing in `test_access_habits` changes result (dana, kai and lena keep their
need routes; noor is refused as before).

### Tests (without the lock, affected files only)

- Rails: `owner_claim_test` (new), `owner_claim_enforce_test`, `access_identities_screen_test`,
  `access_model_login_test`, `capture_proofs_test`, `npc_lockout_l_test`, `npc_habits_loader_test`,
  `lab_physical_pentest_secrets_test`, `game_state_locking_test`, `network_remote_signin_test`:
  159 runs, 1917 assertions, 0 failures, after the merge.
- Node: `validator-access-model.test.mjs`, 33 tests, 0 failures.
- Validator on `test_access_habits`: no errors; the never-leaves warning for `noor_pc` only.
- `bin/rubocop` on `validate_scenario.rb` reports two layout offences near line 6391; they are on
  `main` too and not from this branch.

### Commits

- `948a239ef` R1 fixes
- `8c4b726db` merge of `main`
- `246d995b0` validator judges the prepared data
- this log
