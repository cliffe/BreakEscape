# OPS_LOCK_SECOND_STEP_PLAN.md, review round 4 (delta)

Reviewer: Opus 5.5, 2026-11-19. Plan at 344317449 (730 lines); delta c2826ed8a..344317449 read
in full, plus 5.1, 5.2 and sections 9 to 14 around it. Code read in this worktree:
`game.rb` (`validate_unlock` 4597-4726, `find_scenario_object` 4867-4920, the only
`unlockedObjects` writer at 691-693, `headless_npc_records` 5127-5147),
`games_controller.rb#unlock` 1211-1340, `generate_dungeon_graph.rb:15-29`,
`validate_scenario.rb:20-50` and `:1259`, MFA plan 5.1 (217-250) and section 10, core plan
section 10 (1222-1247).

Counts: 0 blocker, 1 major, 4 minor, 3 nit.

## R3 closure

- **M1 (shared golden mechanism)**: closed. Proof 2 (530-538) names three fixtures in
  `ops_unchanged/`, captured from main, compared by `bin/ops-golden-compare` in
  `lock_step_unchanged_test.rb`; 631 reworded. One gap left, m3 below.
- **m1 (door rules in own file)**: closed (458-466, 474-477, 485-486, shared-files row 643).
- **m2 (graph predicate)**: closed in form (491-495, 514-516; owner node room edge or none at
  513-514), but the predicate's logic changed in the rewrite and is now wrong (M1 below).
- **m3 (tasks below the lock)**: closed (496-499, test at 556).
- **m4 (path when `resolved:` is nil)**: closed for objects (268-271, 549-550); a door gap, m1.
- **m5 (refusal bodies)**: closed (399-403). The MFA bodies named match the MFA plan
  (`mfaIncorrect`, `codeLocked`, `tooSoon`, `expired` at MFA plan 715-716).
- **Nits n1 to n6**: closed (B1-B11 at 609-622 and 631-634; M1a to M3 at 3 and 629; L1a/L1b
  at 3-4; `<record key>` at 291; `alreadyOpen` by Rule B at 277-279; room NPCs and headless
  records at 210; `tableItems` warning at 505-506). n7 stays as request 3 (687-689), as the
  decisions file records.

## Access-check change (task item 2): verified, one gap

- **Existing scenarios.** `validate_unlock` has one production caller,
  `games_controller.rb:1226`; the rest are model tests passing strings (`game_test.rb:296-589`,
  `npc_mapping_unlock_door_test.rb:35-46`). Moving the object lookup ahead of
  `unlock_scope_refused?` (4689) and the shortcut (4695-4698) is a pure read:
  `find_scenario_object` has no side effects and returns early in a fixed source order, and
  with `second_step_ids` empty Rule C is false and the shortcut stays on. Same result for every
  existing call.
- **The gate cannot be skipped by omitting `resolved:`.** The gate is step 4 in the controller,
  not inside `validate_unlock`, so a caller that omits `resolved:` changes only which lookup
  Rule C reads. The only writer to `unlockedObjects` is `unlock_object!` (`game.rb:693`; grep
  finds no other append), and Rule A makes it refuse an id in the set, so no other path can
  open a gated object.
- **No second resolution can disagree.** `/unlock` passes `resolved:`; the answer's finder at
  `games_controller.rb:1318` is swapped for the resolved object whenever the set is non-empty
  (258-260). The other target-string helpers (`unlock_scope_refused?`,
  `object_in_unpromoted_route_room?` at 1273, the feedback helpers) can only refuse, so a twin
  they judge cannot open anything. Player-dependent sources in the walk (`held_grant_items`,
  `held_usb_sticks`, `released_npc_containers`) cannot change within one request, which runs
  under `with_game_lock`.

## Major

### M1. `lock_step_never_passes?` now says "or" where it must say "and"

Plan 493-495: true "when the owner's phone or code device sits in no place the player can take
it from ... **or**, for `push`, when `prompt_habit` reads `never`". The previous text said
"and, for push, the owner never approves", which was right. A push step passes when the owner
approves *or* the player holds the phone (B3 against B6-B7), so it can never pass only when
both routes are shut.

As written: `moira_pc`, `moira_locker` and G2's `records_room` (`push`, Moira approves when
pestered, B3, B9, B11; plan 598-600) are true whenever Moira's phone is not takeable, so the
feature scenario's own critical-path locks get the "never passes" error (a task needs them)
and the dashed "never approves" edge. Under the other reading, a takeable phone with a
never-approving owner is also flagged.

**Fix.** "True when the owner's code device (for `code`) or phone (for a push kind) sits in no
place the player can take it from **and**, for `push`, `prompt_habit` reads `never`." If the
MFA plan's number matching needs the phone in hand (its M3 graph edge suggests it, MFA plan
859-862), say that `push_number_match` checks the phone only. Add a validator spec per kind with
the two routes open and shut (four cases each for `push`).

## Minor

### m1. With `resolved: nil`, a door would be resolved as an object

Plan 265-271: the controller resolves "with `resolve_unlock_target` (or `room_data` for a
door)", but `validate_unlock` with `resolved: nil` "calls `resolve_unlock_target(target_id)`
itself" whatever the type. For a door that walk looks for an object named like the room. In a
scenario with `secondStep`, Rule C could then refuse a door because an object of that name
sits under a closed step. The door tests at `game_test.rb:333-458` pass room ids.

**Fix.** "Left nil, it resolves as the controller does: `resolve_unlock_target` for an object,
`room_data` for a door (no path; Rule C reads objects only)."

### m2. The shared predicate needs a headless-record walk that `lib/` does not have

Plan 493-494 and 513-514: `lock_step_never_passes?` looks for the phone or device in "an NPC's
`itemsHeld`", and the graph must recognise a headless owner. The headless walk exists only
as `Game.headless_npc_records` (`game.rb:5127-5147`, an app model) and its validator copy
(`validate_scenario.rb:1259`). The graph loads neither (`generate_dungeon_graph.rb:21-29`; it
has no headless-record code today), and `MfaModel` is "no Rails" (MFA plan 219). The MFA plan's
`device_for` walk (MFA plan 225-227) covers room objects, NPC `itemsHeld` and start items, but
neither declared grants nor headless records, so it is not the walk the predicate describes.

**Fix.** Say where the walk lives: either `lock_step_never_passes?` walks rooms, room NPCs,
`social.characters[].emailRecord.itemsHeld`, declared grants and start items itself, or a plain-Ruby
`headless_npc_records` moves into `lib/` (the app and validator copies then call it). Say
whether it reuses or extends `device_for`.

### m3. The golden fixtures name no script

Plan 530-538 names the files and scenarios but not the requests recorded. The core plan
(1225-1234) records "a fixed script through the real routes" and writes it "once from main by a
rake task". "The `/unlock` answers" for a scenario is undefined until the attempts are fixed.
"The fixture scenarios the unlock and container controller tests use" is also not a list.

**Fix.** One sentence: for each listed scenario (name them), every lock is posted once with a
wrong and once with the right first factor (and `GET /container` for each container after
it opens), then `filtered_room_data` for each room. Written by the core plan's capture task, or
a named task beside it.

### m4. The new `MfaModel` function is not listed where this plan lists its `MfaModel` additions

5.1 (201-205) lists what `MfaModel` gains (`LOCK_KINDS`, the two type lists, `lock_step`) and
the shared-files row (640) repeats that list for the MFA plan's owner. Neither names
`lock_step_never_passes?`, which appears only in section 9. The MFA plan builds the file in
M1a, before G1, so its owner learns of the addition only from 5.1 and the table.

**Fix.** Add `lock_step_never_passes?(scenario, lockable)` to 5.1 and to row 640, and move its
unit test to the `mfa_model_test.rb` line (543), where it sits beside `lock_step`.

## Nit

- **n1.** Graph require (515, row 643): the MFA plan's graph edges (M1b onward, MFA plan 859)
  already need `mfa_model` in `generate_dungeon_graph.rb`, so this plan adds no require of its
  own. Say "the require the MFA plan adds". `mfa_model.rb` should itself require `npc_habits`
  for `prompt_habit` (the graph loads it already, `:25`; the validator at `:22`).
- **n2.** Line 629 "the log helper first" leaves L1b out; line 3-4 needs it for B11. Write "MFA
  M1a to M3 and log L1a and L1b first" (the log plan lands both before S1 anyway, log plan 98-99).
- **n3.** The dashed edge is labelled "never approves" (515) also for a `code` step whose device
  is untakeable, where no one approves anything. "never passes" fits both.

## Names and references (task item 5)

No review or round references (the only grep hits are "workaround"). B1-B11, M1a-M3, L1a/L1b,
G1/G2 are consistent across 3-4, 580, 609-634 and 687-689. M1b at 580 correctly names the MFA
stage that puts `mfa-client.js` on the copy lists (MFA plan 127).

## Verdict

One more delta. The access-check change holds against the code: existing callers behave the
same, omitting `resolved:` cannot skip the gate, and no second lookup can pick a different
object. The rewrite of the never-passes rule turned "and" into "or", which would flag the
feature scenario's own Moira locks (M1). That and the four minors are text edits; a delta
round after them should find nothing above nit.
