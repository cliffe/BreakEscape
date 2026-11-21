# OPS_LOCK_SECOND_STEP_PLAN.md, review round 1, second half

Reviewer: Opus, 2026-11-19. Plan at commit fec5fbf5f (618 lines). MFA plan and log plan read at
HEAD (185c3fa02 and c93305555). Code read in this worktree. Covers points 4 to 7 only; the first
half (R1) covered contents below a gate, the already-open shortcut and the client callers.

Stopped at the context limit. Not reached: a line-by-line check of `generate_dungeon_graph.rb`
edges (only confirmed that habits are already drawn there, `generate_dungeon_graph.rb:329-376`).

Counts: 0 blocker, 3 major, 8 minor, 4 nit.

## Major

### M1. `mfa_prompt_approved` uses the detail key `by`, which both sibling plans have named `approver`

Plan 528 (row table) and beat K3 (plan 486) write `by: owner | held_phone | own_phone`. The MFA
plan registers `approver` (MFA plan section 13, row `mfa_prompt_approved`), and the log plan
names `approver` and reserves `by` as a stored row key for the parked defence work (log plan
13.6; 14, item 5: "The `mfa_prompt_approved` detail key is `approver` (`by` is reserved, 13.6)").
A detail key that is not registered makes the call malformed (log plan 13.2 step 2): in
production the row is dropped with a warning, and in tests the guard raises.

**Fix.** Use `approver` in the table and in K3.

### M2. The player's own phone (a re-enrolled owner) is half built for locks

The plan takes the re-enrolment branch from the MFA plan in some places and not others:

- `POST /mfa/approve` for a lock accepts "the owner is re-enrolled onto the player's phone"
  (plan, section 6), and the gate's answer carries `ownPhone?` (plan 5.2 step 3).
- `GET /mfa/phone` for a lock requires "`npc_id` is the lock's owner and that phone is held
  (else 403)". It has no `own=1` form. The MFA plan's `own=1` form lists sign-in records only,
  in the `{ pcId, host, username, ... }` shape (MFA plan section 6, `GET /mfa/phone` row).
  So `authenticator-live` opened from "My phone" draws no card for the lock, and a number-match
  lock cannot be approved there through the UI.
- For `code`, the plan does not say which device a lock's verify compares against. The MFA plan
  compares a re-enrolled account against `own:<npcId>` and makes the old device answer
  `enrolled: false` (MFA plan 5.2, "For a re-enrolled account"). If that is shared, a helpdesk
  reset of the owner's work sign-in also retires the device for the owner's safe and archive.

**Fix.** Decide, as an open question with a recommendation, whether a helpdesk re-enrolment
carries to an owner's locks. Recommend no: a lock's step always uses the owner's own
`code_device` and `phone_friendface`, the lock routes ignore `accountResets`, and the
`ownPhone` field is dropped from the lock answer. If yes, add the `own=1` lock form of
`GET /mfa/phone` and name `own:<npcId>` for verify.

### M3. Cross-plan request 1 to the MFA plan is incomplete

Request 1 (plan 557-561) lists three differences (record home, no lockout key, `passed` in
place of a session) and the repeat answer. The plan relies on at least five more behaviours
of the shared functions that the MFA plan defines differently:

1. **Expiry tidy.** The MFA plan drops expired records "whenever the map is read or written"
   (MFA plan 5.2, "Pending record"). The lock plan keeps a `passed` record past five minutes
   (plan section 8; question 5 option a). The tidy must skip `passed`.
2. **No drop on a pass.** MFA verify, prompt and approve drop the record on success (MFA plan
   section 6, each "Right"/"Approved" cell). The lock form keeps it with `passed` until the
   second `/unlock` post.
3. **No route re-judge.** Every MFA second-step route runs `second_step_refusal` (MFA plan 5.2,
   "Every second-step route judges the first step's route again"). The lock form must not
   (plan section 6, "No route re-judge and no lockout").
4. **`numbers` takes `pc_id`.** `MfaModel.numbers(key, game_id, pc_id, npc_id, nonce)` (MFA plan
   5.1). The lock plan says the subject key "takes the PC id's place" (plan 5.2); the signature
   must say subject key.
5. **Bounds in the MFA plan's section 8.** `mfaPrompts` is "one integer per account",
   `mfaAccounts` "four integers per account". The lock plan adds entries for owners who are not
   accounts (plan section 8). The MFA plan's bound text needs to read "per account or lock
   owner".

The client side has the same gap: the MFA plan's `MfaClient` hands a child scene's result to the
reopened sign-in screen through `takeCompleted(pcId)` (MFA plan 5.3). The lock plan names
`finishLock(subject)` but not what tells a reopened pane that the child approved; nor which
module emits `mfa_required` and the other events for a lock (the MFA plan emits them from
`pc-sessions.js`).

**Fix.** List all of these in request 1 (server) and add a client item: `takeStepPassed(subject)`
or the equivalent, and the emitter of the four events for a lock.

## Minor

### m1. Owner phone rule differs from the MFA plan

Plan 185-187: "The owner needs a `phone_friendface` item for a push kind ... all as in the MFA
plan"; section 9 makes a missing item a validator error. The MFA plan has no such rule. Its
validator refuses a push kind only where the NPC has `phone: false`, and warns where an owner
"holds no declared phone" (MFA plan section 9, errors and the warning "A push step nobody
passes"); push case 5 (MFA plan 5.2) needs no item for the owner to receive a request.

**Fix.** Either drop "all as in the MFA plan" and say why a lock is stricter (the player must
be able to hold the phone for number match), or follow the MFA rule.

### m2. `second_step_ids` depends on what the player holds

Plan 5.2: the set is "built once per instance by the walk `find_scenario_object` uses". That
walk includes `held_grant_items`, `held_usb_sticks` and `released_npc_containers`
(`game.rb:4888-4902`), which depend on `player_state`. So a `secondStep` object in a grant not
yet held is not in the set; a plain object whose name equals its id can be written by
`unlock_object!` then, and once the grant is held Rule B finds the id already in the list.
The validator refuses twin names, but the plan's own twin-names test is the case where it has
not run. A memo per instance also goes stale inside a request that changes holding.

**Fix.** Build the set from every authored home in `scenario_data` whatever is held (rooms and
contents, profiles, shares, all declared grants, every NPC `itemsHeld`, start items). It then
depends only on the scenario, and the existing-scenario proof (plan section 10, check 1) is a
pure scenario walk.

### m3. `secondStep` on a `doors[]` entry would be a warning, not an error

Plan section 9 puts it in `DOOR_ENTRY_LOCK_FIELDS` and lists it under errors. That list raises a
warning (`scripts/validate_scenario.rb:8050-8055`, `warn.call`). The error branch is the
`access acceptsUIDOnly` list just below it (`:8057-`).

**Fix.** Add `secondStep` to that error list, not to `DOOR_ENTRY_LOCK_FIELDS`.

### m4. Two room writers and one task reader the plan does not cover

- `GET /room` appends to `unlockedRooms` directly for the start room and an awareness world
  room (`games_controller.rb:569-591`, the `<<` at `:590`), not through `unlock_room!`. Plan 5.3
  says `unlock_room!` "has no other caller"; this writer bypasses it. Validator error:
  `secondStep` on the `startRoom` or an awareness world room.
- An `unlock_object` task checks `object_unlocked?(task['targetObject'])` with the authored
  string (`game.rb:5270`, `:697-699`). Once Rule A writes ids only, a task naming a gated object
  by name or generated id never completes. Validator error for that case.

### m5. Log ids and the `method` code list

- The log plan caps an id at 40 characters from `[A-Za-z0-9_.:-]` and treats anything else as
  malformed (log plan 13.1, 13.5). Request 5 asks it to "recompute the row ceiling for a
  40-character object id"; it already uses that ceiling. What is missing is the validator rule:
  a `secondStep` object's id, a door's room id, and the owner's NPC id must fit, or every row
  for that lock is dropped.
- Request 5 says `method` takes "a value from the unlock method list"; the log plan asks for a
  closed list of codes (log plan 14, item 5). Name it. From `validate_unlock`
  (`game.rb:4597-4780`), the methods that can reach the gate are `key`, `lockpick`, `rfid`,
  `biometric`, `bluetooth`, `ble`, `pin`, `password`, `combination`, `cryptex` and `npc`
  (`flag_reward` skips; `unlocked` and `flag` never reach it). `lockpick` is a method on a `key`
  lock, so question 3 option (c) should not call it a lock type.
- Request 5 asks the log plan to "register place kinds `object` and `door`"; they are already in
  `OpsLog::KINDS` from L1a (log plan 13.5). Replace with "add `door` and `object` to the
  `places` of the eight `mfa_*` events", which is what the log plan records (13.7, S8c note).

### m6. `badge_swipe` at a gated rfid door is not stated

The log plan writes `badge_swipe` `ok` inside the `/unlock` transaction, after the route-room
refusal and before `unlock_room!` (log plan 5.1, lines 227-229 of that file). The lock plan's
gate runs before the transaction. So at an L2 rfid door the first right card writes
`mfa_challenge` and no badge row, repeats write nothing, and the final post writes one
`badge_swipe`. That may be the intended trace, but neither plan says so.

**Fix.** State it in section 13, add it to K11's server record, and add a line to request 5.

### m7. Test list gaps

- The log plan asks every `test_ops_*` scenario that asserts rows to declare a `gameClock` and
  call `assert_ops_log_holds_no_secret` (log plan 14, item 1). The plan declares `logSources`
  only (section 11, feature scenario).
- No secret-guard case: the MFA plan has one per stage (a row holding a code after
  `note_issued_secret`); the lock stages call the same issuers and need the same case, plus a row
  attempt holding the lock's own `requires` (registered in L1a, log plan 13.2 step 2).
- No dungeon graph test file (the MFA plan has `test/js/dungeon-graph-mfa.test.mjs`); no
  `lock_key_diff.rb` "output unchanged without the field" check; no validator spec per error in
  section 9.
- JS: "no new module, so no harness copy list changes" holds only if MFA M1b has already put
  `mfa-client.js` and the scenes on every copy list. Say that the lock tests depend on it.

### m8. Reload with a passed record and a different first factor

Plan 5.2 step 5 and the controller row "The second post" say a wrong first factor after a pass
is refused and the record stays. With question 5 (a) the record never lapses, so a `passed`
record can sit in `lockSteps` for the rest of the game when the player never returns. The bound
(one per lock) holds; say in section 8 that such records persist across reloads and resets drop
them (`ACCESS_STATE_DEFAULTS` keys are not on `reset_player_state!`'s preserved list,
`game.rb:3019-3020`).

## Nit

- n1. Schema pointers: the room block's `lockType` is `scenario-schema.json:4217-4220`; `:4170`
  is `locked`. The object `lockType` at `:5279` is right. `infusion_pump` and `backup_recovery`
  (plan section 3, "Not planned") are not values of either `lockType` enum (`:4219`, `:5281`).
- n2. The log plan says "the seven `mfa_*` events" (log plan 13.7, S8c note); there are eight
  (MFA plan section 13; this plan's table). Ask the log plan to correct it.
- n3. `lockSteps` keys `object|<id>` and `door|<roomId>`; `PinDust` already keys the same two
  kinds of lock as `object:<id>` and `door:<room>` through a canonical-id function
  (`pin_dust.rb:12`, `:80-83`). Reuse that function and format.
- n4. Adding `lockSteps` to `ACCESS_STATE_DEFAULTS` gives every game an empty `lockSteps` on its
  next initialise (`game.rb:7576`). Harmless and never sent; say so in section 10 so the
  byte-for-byte capture is understood to cover answers, not stored state.

## Checked and sound

- `lockSteps` and the counts are never read from a sync body: `sync_state` merges named sections
  only (`games_controller.rb:867-925`), and the bootstrap attaches named player-state keys
  (`:303-340`). No synced value grows.
- `unlock_object!` is the only writer of `unlockedObjects` (`game.rb:691-695`, `:7523` init);
  its callers are `/unlock` only (`games_controller.rb:1315`).
- The `unlock_room!` callers listed in plan section 2 are right (`game.rb:476`,
  `games_controller.rb:2931`, `:4020`), apart from the `GET /room` writer in m4.
- The bootstrap room allowlist is at `game.rb:2425-2427` as stated.
- The `mfa_challenge` save rule (rides the record write), the no-row branches and "pass
  `save_limit:`, never `once:`" match the log plan's rules (13.2 step 4, 13.3).
- `{ npc: ownerId }` as `as` matches the log plan's "Locks name no account" (13.3), since the
  gate's answer names the owner.
