# Adversarial review R2: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` and R1 (with its
Outcomes) against the code at tree `f9220e53b` (worktree `p-hard-tailgate-plan`). Every code claim
below was opened and read at the pinned file:line. `build/hard-rfid` is taken as a given
prerequisite; this review judges only whether the plan uses it correctly and holds the credential
credit until it lands. Counts: 0 blockers, 2 majors, 4 minors.

The core machinery is sound. The viaPass credit rests on `courier_ready`, which `POST /wear`
writes only after a server-side possession check (`wearables.rb:55-59`, `wear!` calls
`held_inventory_item`), so it is genuinely earned, not merely server-written. The credit globals
become read-only through the same union the wearables use (`merge_global_variables!`
`game.rb:337,340`), `write_server_globals!` (`wearables.rb:136`) is the correct bypass, and
`serverCompletedOnly` with the real `trusted:` keyword resists the `{ "trusted": true }` smuggle.
I found no client-forgeable path that still earns credit: viaPass is gated on a server-owned
global, viaCredential on the hardened possession check, the credit globals and `tailgate_in` are
server-owned. The honest slip-in and reload cases hold. The SYNC SIZE accounting is sound: three
server-held derived lists, nothing new in the client-to-server payload, credit globals replace
existing keys rather than adding them.

## Disputed R1 closure

**B2 is only partly closed, not fixed.** R1's Outcomes claims the viaPass credit now threads the
scenario "through the guard, credit and aim calls." The enumeration is incomplete, and the model it
implies is wrong. `complete_task!` (`game.rb:3632`) is the plan's "creditOnPass task completion".
Its very first line calls `initialize_objectives` (`game.rb:3633`), which reads
`scenario_data['objectives']` (`game.rb:3622`); near its end it calls
`recheck_pending_mission_conclusions!` (`game.rb:3716`), which reads `scenario_data['objectives']`
(`game.rb:5208`); and it calls `process_task_completion` -> `apply_task_set_globals!`, which reads
`scenario_data['globalVariables']` (`game.rb:5326`) whenever the credited task has an
`onComplete.setGlobal`. None of these three is in the plan's "Concretely" list (3.3a), which names
only the `room_unlocked?`/`start_room?` guard, `complete_task!`, and "the aim check". Worse, it
lists `check_aim_completion` as a sibling of `complete_task!`, but `check_aim_completion` is called
*inside* `complete_task!` (`game.rb:3711`); listing it as a peer shows the call tree was not traced.
On the narrow sync row (`SYNC_STATE_COLUMNS`, `games_controller.rb:2022`, no `scenario_data`),
`initialize_objectives` raises `ActiveModel::MissingAttributeError` before any credit is written, so
a builder who threads only the three named sites reproduces exactly the honest-earn soft-lock B2 was
meant to remove. See MAJOR-1. Every other R1 closure holds (B1 given the prerequisite; M1 test 3b;
M2 section 6 wording; M3 backstop removal; m1 `filtered_room_data`/`track_npc_encounters`; m2
transaction; m3; m4; m5 confirmed, the `currentRoom` guard at `games_controller.rb:2096-2098` reads
`unlockedRooms` from `player_state` and `startRoom` through a `pick` at `:2097`, so acceptance itself
does not trip the missing-attribute problem).

## Majors

### MAJOR-1. The B2 scenario-threading surface is under-specified and the "Concretely" list is wrong
`game.rb:3622`, `game.rb:5208`, `game.rb:5326`, `game.rb:3711`. As above: the plan's concrete
threading list (3.3a) omits `initialize_objectives` and `recheck_pending_mission_conclusions!`,
both of which read `scenario_data['objectives']` unconditionally on every `complete_task!`, and it
mis-models `check_aim_completion` as a call peer rather than a nested call. A builder following the
list literally raises `MissingAttributeError` on the sync row; the plan's own test 2 (which runs the
whole viaPass credit on the `scenario_data`-less row) would catch it, so it cannot ship broken, but
it forces a rework round and the plan should not depend on a red test to discover its own call tree.
Separately, "thread the scenario through `complete_task!`" adds a `scenario:` keyword to roughly six
methods shared with many other callers (`complete_task!`, `initialize_objectives`,
`find_task_in_scenario`, `process_task_completion`/`apply_task_set_globals!`, `check_aim_completion`,
`recheck_pending_mission_conclusions!`); this is a larger, riskier change than the one Chunk B bullet
implies. **Fix:** either (a) list the full call tree and add the `scenario:` keyword to every member
of it, defaulting to the loaded attribute so existing callers are untouched, and widen the Chunk B
estimate; or (b) take the reload route the plan rejected but scoped correctly: fetch `scenario_data`
once via `stored_scenario_data` (`game.rb:797`, a single `pick` on the sync row) and set it on the
in-memory record before the credit, which leaves the in-flight `player_state` merge intact (the
merge lives in `player_state`, not `scenario_data`), so the plan's stated objection to a reload does
not apply to a `scenario_data`-only fetch.

### MAJOR-2. "Nothing can be taken" from a served route room is verified for loose items only
The plan's accepted caveat (3.2, 5) is that serving a route room exposes object positions but
"nothing can be taken (collection reads `unlockedRooms`)". That holds for room-located items: the
pickup path refuses a locked room not in `unlockedRooms` (`games_controller.rb:2661-2666`) and the
room action is gated at `games_controller.rb:1008` (`room_unlocked?`). It is not shown for the other
take/capture vectors. The `/unlock` object branch returns a container's contents inline in the
response (`games_controller.rb:1166-1168`), gated by `unlock_scope_refused?` and object-lock logic,
not by the containing room being in `unlockedRooms`; `submit_flag` (`games_controller.rb:1735`) and
the sign-in paths are likewise not shown to check the containing room. The lab's `secure_area`
(`scenario.json.erb:2100`) holds no locked secret container, flag station or login PC, so this is
not exploitable today, but the plan states a blanket guarantee it does not establish, and a future
split gated room with a secret-bearing object would leak it to an un-promoted tampered client.
**Fix:** either confirm each of container unlock, `submit_flag` and sign-in is `room_unlocked?`-gated
for the containing room, or add a validator rule (section 11) that refuses a locked container, flag
station or login PC inside a split gated room, and narrow the caveat wording to "loose collectibles".

## Minors

- m1. Hard-rfid coupling, state it at the credit site. The clone entry POST sends no `card_ids`
  (`doors.js:689-694`; `grep -c card_ids doors.js` is 0), so the hardened `rfid_lock_passes?` must
  read held cards and live clones from server state with `card_ids` nil. The plan says this in prose
  (1, 3.3b) but the viaCredential credit (3.3b) should name it as a build precondition: Chunk B is
  not buildable, and the credential path credits nothing for an honest cloner, unless the merged
  `build/hard-rfid` `rfid_lock_passes?` ignores the (nil) client `card_ids` and consults
  `serverClones`. The plan's cited possession lines (`game.rb:2449,2457,2465,2491`) do not exist in
  this tree; they are in the prerequisite branch, which is correct but the builder must verify the
  hardened signature before wiring the credit.

- m2. The runtime split predicate is undefined. 3.1 defines a split as "a cloneable card with an
  `rfid_cloner` present", but `split_gated_door?`/`gated_route_room?` run in the model while the
  validator (section 11) reuses `check_access_model`'s full card/cloner reachability
  (`scripts/validate_scenario.rb` around `:2201-2250`). State the model-side algorithm: mere
  presence of an `rfid_cloner` in the scenario is the safe and simplest runtime test (a wrongly
  split gate credits nothing because the possession check still gates viaCredential), so the builder
  should not reimplement the validator's reachability pass in `game.rb`.

- m3. Line drift in 3.3b/3.5. The `unlock` action transaction is at `games_controller.rb:1137` and
  the `serve_opened_room` call at `:1139` (plan says the transaction is "opened at
  `games_controller.rb:1141`"). No design impact; the branch still sits inside that transaction.

- m4. Migration anchor, make it explicit. 9 pins the demotion to "the room GET / game show
  (`games_controller.rb:506`, `:193`)". The room GET is for one room id, so wiring the scan there
  only would miss a split room the player is not currently loading; the game `show` (`:193`) is
  room-agnostic and loads the full row, so state that the all-split-rooms scan runs in `show` (before
  its own state writes), not on the per-room GET, so a builder does not scope it to a single id.

## Open questions
- Q1 (server-owned pass): agree, require server-owned and validator-enforce; the credential path's
  rigour comes separately from `build/hard-rfid`, so the rule is half the guarantee without it (the
  plan already says this).
- Q2 (scope): the full change is safe to land now only with `build/hard-rfid` merged before Chunk B,
  and with MAJOR-1's threading corrected. If `build/hard-rfid` slips, land the server split plus
  viaPass (after MAJOR-1) and hold viaCredential, as the plan recommends.
- Q3 (holds-doors demos presentation-only): agree, leave them; `rfid_cloner` count is 0 in both and
  neither has a server-owned pass, so nothing is provable or forgeable.
- Q4 (`enter_room` objective follow-on): agree separate; assert server state in the fixture for now.

## Verdict
**Request changes.** No blockers: the credit cannot be forged, honest play is not blocked in any case
the plan handles, and SYNC SIZE holds. But R1's B2 is only partly closed (MAJOR-1): the plan's
concrete scenario-threading list misses two guaranteed `scenario_data` reads inside `complete_task!`
and mis-places a third, so the honest viaPass earn still raises on the sync row if built as written,
and the threading scope is understated for Chunk B. Fix MAJOR-1 (full call tree or a
`scenario_data`-only reload), tighten the "nothing can be taken" caveat to the vectors actually
checked or add the validator guard (MAJOR-2), and resolve the four minors. With those, the plan is
buildable chunk by chunk with tests and live proofs that would catch a broken live path.
