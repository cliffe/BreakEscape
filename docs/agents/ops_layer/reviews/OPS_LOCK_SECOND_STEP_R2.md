# OPS_LOCK_SECOND_STEP_PLAN.md, review round 2

Reviewer: Opus 5.5, 2026-11-19. Plan at d8adde1cd (709 lines), whole plan read. MFA plan and log
plan read at the same commit. Code read in this worktree.

Stopped at the context limit. **Not verified this round:** the validator line numbers and
buildability of each new error in `scripts/validate_scenario.rb` (`:8050-8059`, startRoom,
awareness rooms, task ids, id length), and `generate_dungeon_graph.rb`. Round 3 should do these
first.

Counts: 0 blocker, 2 major, 7 minor, 2 nit.

## R1 and R1b closure

Closed in the text and right against the code: R1 B1 (Rule C and the two-column table; the
scope branches do test the object itself, `path_unlocked?(path + [object])`,
`games_controller.rb:650`, `:657`), R1 M1 (shortcut off, `game.rb:4695-4698`; `flag_reward`
skip only under `flag_reward_unlocks_object?`, `:4732-4735`), R1 M2, R1 M3 (`ApiClient.unlock`
is the only `/unlock` poster, `api-client.js:108`; `notifyServerUnlock` swallows and returns
undefined, `unlock-system.js:43-49`, so the cancelled marker is needed), R1 m1 to m4, R1b M1 to
M3, R1b m1, m2, m6, m7, m8 and the nits. The `unlock_object` action claim holds: its other
sources (`object_interact`, `interaction_warning`, `interactions.js:784-1095`) fail
`unlock_method_matches_lock?` for a locked object. R1b m3 to m5 are in the text; their
validator buildability is the unverified item above. Two new problems sit inside the fixes (M1,
M2 below).

## Major

### M1. `save_limit: true` on every lock row makes every row malformed

Plan 626-627: "Every call passes `save_limit: true` ... never a number and never `once:`". The
log plan makes `save_limit: true` malformed when the event and result have no registered limit
(log plan :756, :818), and a malformed call is dropped in production and raises in tests. The
eight `mfa_*` events register no `save_limit` (log plan `EVENTS`, :1020-1030; rows :1097-1104,
each "the save that stores ..."), and the MFA plan never passes it for them. Each lock branch
also has a save of its own (record write, counts, `passed`, drop), which is the case
`save_limit` is not for ("for a branch with no save of its own", :756).

**Fix.** Lock calls use the default `save_limit: false`, as the MFA plan's sign-in calls do;
each row rides the branch's own save. The no-row branches (repeat, stale, too soon, 403, 404,
Rule C) stay rowless, so no limit is needed. Drop the sentence at 626-627 and add a controller
test that every lock row is stored (a malformed call raises in tests).

### M2. `step_ancestors` "keyed by the object itself" breaks on copied sources and is undefined

Plan 219-221. Ruby Hash keys compare by value unless `compare_by_identity` is set; the plan says
neither.

- Identity keys: `held_usb_sticks` returns `stick.deep_dup.merge('contents' =>
  usb_stick_files(stick).map(&:deep_dup))` (`game.rb:5011-5020`), and both finders walk it
  (`game.rb:4893-4896`; `games_controller.rb:3018`, `:3074-3077`). Everything below a
  `secondStep` object in a habit stick misses the map, Rule C is silently off, and R1 B1 is open
  again there. The plan's walk lists "every USB stick" (217) and the validator does not refuse the
  placement.
- Value keys: two equal objects with no id (two `readme.txt` text files) collide, so one under a
  gated PC and one outside share an entry. Last write wins: either a false refusal or a leak.

**Fix.** Compute Rule C from the path, not from a map of objects: the resolver returns `{ object,
path }` (`locate_object_in` already builds a path, `game.rb:4272`), and Rule C is "some id on the
path is in `second_step_ids` and fails Rule B". The exits that use other finders
(`find_container_in_scenario`, `find_accessible_item`, the inventory copy) get a path from the
same walk. Simpler alternative: in the scenario-only walk, collect every id and name that occurs
below a `secondStep` object, and refuse any posted string in that set while any such ancestor is
closed (conservative; a plain twin of a hidden child is refused until the step opens, and the
validator warns). Either way, add a validator error for `secondStep` in a habit stick's contents,
and a test with a gated object in a held stick.

## Minor

### m1. Cross-plan item 8 asks the MFA plan for something the lock caller already has

Plan 284-286 and 642-643. Sign-in overwrites its record per PC (MFA plan :377), and request 11
(MFA plan :1129-1141) does not cover item 8. It does not need to: the gate can read the live
record and answer again with `numbers(key, game_id, "object:<id>", npc_id, record['nonce'])`
(MFA plan 5.1, :234-240), a pure function. **Fix.** State this as the lock caller's own logic
and drop item 8, or ask only that the record keep `nonce` and `kind` (it does).

### m2. Section 6 contradicts itself on `GET /mfa/phone`

Plan 401 gives "all four below" the generic 422 when no live record exists; plan 404 answers
`GET /mfa/phone` with "that one lock's request, or an empty list". Pick one (recommend the empty
list for the phone, 422 for the three posts). Also say the routes resolve `target_id` by id only
(Rule B), never through the name-matching finder.

### m3. "Resolve once" needs a changed `validate_unlock` signature

Plan 268-275. `validate_unlock(target_type, target_id, ...)` takes the posted string and finds
again (`game.rb:4693-4702`), and the controller finds a third time for the answer. State that
`validate_unlock` takes the resolved object (and its path, for M2), or the shortcut-off rule and
Rule C judge a different find from the gate's.

### m4. The re-post after a pass: time stamp and loop

`ApiClient.unlock` stamps `clientTs` at dispatch (`api-client.js:107`). The final answer arrives
minutes later, after syncs, so its server writes would be judged older than them. Say that
`finishLock` re-posts through the raw post with a fresh stamp and never re-enters the step
handler (a second `secondStep` answer, say after a lost `passed` record, must reject, not reopen
the pane in a loop). Add both to the JS test.

### m5. `badge_swipe` after the gate is still only in this plan

Log plan 5.1 (:221-225) places the granted `badge_swipe` "after the route-room refusal, before
`unlock_room!`" and says nothing of the gate. Since the gate returns before the transaction the
trace is right in code, but the log plan text should say it. Request 5 asks; keep it open until
the log plan's text carries it.

### m6. Places a `secondStep` object can sit that no finder walks

`tableItems` (`scenario-schema.json:5724`, filtered at `game.rb:7287`) are not walked by
`find_scenario_object` (`game.rb:4867-4915`), so a gated object there never opens. Add it, with
habit-stick contents (M2), to the validator's refused places and to "Where it may sit" (180-188).

### m7. Open questions do not say which option the plan is written to

Each of 1 to 8 has options and a recommendation, but none says "the plan is written to (a)".
Add one line per question (all eight are written to (a), as far as the text shows: 5.2 for 1,
5.3 for 2, section 4 for 3 and 7, 5.4 for 4, section 8 for 5, section 3 for 6, section 6 for 8).

## Nit

### n1. The `unlock_object` action shows a refused object as open

`apply-actions.js:200` emits `object_remotely_unlocked` before the post, so the client clears
`locked` for any refused remote unlock. Existing behaviour, not this plan's; note it in the live
proof so a screenshot of a gated object after an `object_interact` action is not misread.

### n2. Length (709 lines): about 45 lines can go

- Section 2, client paragraph (105-120): the caller list repeats in 5.4 (357-368). Keep one. ~8.
- 5.2 subject table (305-322): six of its rows restate the MFA plan's 5.2 table. Point to it and
  keep the lock-only rows (record key, code device, phone). ~10.
- Section 7 (414-423) restates 5.2 and section 6. ~8.
- Section 14 request 1 (634-644): items 1 to 7 are met; one line naming MFA request 11. ~8.
- Owner rules in section 4 (194-202) and question 8 (699-706) overlap the MFA plan's 5.2. ~5.
- Section 11 "Nothing leaves early" and "Nothing below opens early" share fixtures; merge. ~4.

## Checked and sound

- Rule C rows for take routes: the container take tests `unlockedObjects.include?(container_id)`
  with `obj['id'] || obj['name']` (`games_controller.rb:3424-3430`, `:3662-3666`); the share
  take tests every locked folder by id (`network_access.rb:1720-1732`).
- NPC give paths: a carried bag's inventory copy goes through `canonical_inventory_item`, which
  drops a locked nested item's `contents` (`games_controller.rb:3315-3332`, filter
  `game.rb:7228-7231`); a top-level carried gated item is refused by the validator.
- Room payload marker runs on the dup room (`game.rb:2999-3010`, `:2735-2745`); GET /room
  writer (`games_controller.rb:584-591`) as stated.
- MFA fit: subject-rules table (MFA 5.2), `numbers` subject key (5.1), `device_in_use?` (MFA
  :455-459), `takeCompleted(subject)` and events from `MfaClient` (5.3), section 8 bounds "per
  step owner" (MFA :791-792) all match the lock plan.
- Log fit: eight `mfa_*` events with `places: %w[pc door object]`, closed `method` list,
  `{ npc: }` only when the pane names the owner (log plan :1108-1113); `approver` (:1102).
- State and reload: `lockSteps` never read from a sync body; a live record answers again; a
  passed one survives reload, dropped by reset.

## Verdict

Not ready, but close. M1 is a one-line fix that otherwise drops every lock row. M2 reopens the
round 1 blocker for one source and leaves the core data structure undefined; computing Rule C
from the resolver's path fixes both. Round 3 should verify the validator errors and the graph,
which this round did not reach.
