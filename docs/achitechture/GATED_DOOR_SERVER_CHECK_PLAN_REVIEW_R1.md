# Adversarial review R1: gated-door server check plan

Reviewer read the plan at `docs/achitechture/GATED_DOOR_SERVER_CHECK_PLAN.md` against the code at
tree `3af921c56` (worktree `p-hard-tailgate-plan`). Every code claim below is pinned to a
file:line that was opened and read. Counts: 2 blockers, 3 majors, 5 minors.

The plan is careful and most of its structure holds: the viaPass proof rests on a genuinely
server-verified fact, collection is correctly blocked for route rooms, the two holds-doors demos
are correctly carved out, the load-bearing `len_never_fires` mapping is correctly kept, the
`trusted:` keyword design resists the `{ "trusted": true }` smuggle, and the SYNC SIZE accounting
(three server-held derived lists, nothing new in the client payload) is sound. Two of the three
credit paths the plan credits are not actually provable as written, and the viaPass credit as
routed would raise on the sync path. Both must be redesigned before build.

## Blockers

### B1. The viaCredential path credits a captured-credential finding with no server proof of the clone
The plan (sections 2, 3.3b, 6, test 3/8) leans on `rfid_lock_passes?` (`game.rb:2539`) to prove the
player holds the cloned badge. It does not. The lab's `secure_area` is `locked:true, lockType:rfid,
requires:cm_records_badge` with **no `access` list** (`scenarios/lab_physical_pentest/scenario.json.erb:2122-2124`;
door `:1370-1372`), so `acl_lock?` (`game.rb:2510`) is false and `rfid_lock_passes?` takes the
trusted branch `return !rfid_requires_revoked?(lock)` (`game.rb:2541-2542`), which is **true for a
player holding nothing** (`rfid_requires_revoked?` returns false when no required card is held,
`game.rb:2556-2569`). The validate_unlock rfid branch even says so: "Without an access list,
client-trusted as before" (`game.rb:3098-3100`). The clone POST sends **no `card_ids`**
(`doors.js:684-693`; no `card_ids`/`cardIds` anywhere in `doors.js`), so even promoting
`secure_area` to an acl lock would hit the nil-ids branch `Array(requires).any? && !revoked`
(`game.rb:2547`), still true. `test_gate_tailgate`'s `staff_room` is the same shape
(`scenarios/test_gate_tailgate/scenario.json.erb:156-161`), so the fixture would not prove the path
either. Net: a tampered client POSTs `/unlock target:secure_area method:rfid` with no clone and the
viaCredential block sets `kp_records_cloned` server-owned true and completes `tailgate_in`. This
credits "cloned the badge" (a captured credential, a secret under CHEAT POLICY) without the clone
ever being made. The plan's test 8 ("wrong card: `rfid_lock_passes?` refuses") is false for this
non-acl lock. **Fix:** at promotion, verify server-held possession of the room's `requires` card
directly, e.g. `held_rfid_cards`/`held_keycard_ids` (`game.rb:2465,2491`) plus `server_clones`
(`game.rb:2457`) honouring `rfid_cloner_held?` (`game.rb:2449`), independent of validate_unlock's
boolean. Do not credit viaCredential off the trusted boolean.

### B2. The viaPass credit on the sync_state path reads `scenario_data`, which is not loaded there, and raises
`sync_state` loads `Game.lock.select(*SYNC_STATE_COLUMNS)` with no `scenario_data`
(`games_controller.rb:819`; `SYNC_STATE_COLUMNS` at `:2022`). The plan solves this only for the gate
blob (a targeted `pick`, 3.3a). But the viaPass credit calls, in order: the guard
`!room_unlocked?(room_id)` -> `start_room?` -> `scenario_data['startRoom']` (`game.rb:122-127`);
then `complete_task!(..., trusted:true)` -> `find_task_in_scenario` -> `scenario_data['objectives']`
(`game.rb:5217-5223`), plus `initialize_objectives` and `check_aim_completion` (`game.rb:3621,5361`).
`scenario_data` is a plain column (no override), so on the narrow sync row each raises
`ActiveModel::MissingAttributeError`. The honest viaPass earn therefore throws in production and
`tailgate_in` never completes -> soft-lock of the only remaining completion path for that task
(client writers removed, section 9). The existing server-owned credit on sync (`record_capture!`)
avoids exactly this by injecting `stored_scenario_data` (`game.rb:797-806`,
`games_controller.rb:918-923`); the plan does not thread a scenario into `complete_task!`/
`check_aim_completion`. **Fix:** when a pending `npcRouteRooms` room's `currentRoom` is accepted and
the pass check is to run, reload the full row (bounded: once per room) before any `room_unlocked?`/
credit/aim call, or route the viaPass credit through a scenario-injecting variant. State which in
the plan; test 2 as written would catch this but the plan's prose claims the `pick` alone suffices,
which is wrong.

## Majors

### M1. No negative test pins the credential path's server enforcement
Because of B1, test 3 ("hold the clone, unlock, credited") passes even with **no** clone held, so it
proves nothing. Add a test: POST `/unlock method:rfid` on the records door with no clone and no
keycard -> **not** credited, `kp_records_cloned` false, `tailgate_in` incomplete, room not in
`unlockedRooms`. Fix test 8's premise (a wrong card is not refused by `rfid_lock_passes?` on a
non-acl lock). Both split rooms are non-acl `requires`-only, so this gap is not lab-specific.

### M2. Section 6 table implies `lockType:rfid` means server-checked; it does not
The table ("both split rooms which are `lockType: rfid`", 3.3b) reads as if rfid implies a server
credential check. Neither split room has an `access` list, so neither is server-checked today
(`game.rb:2541-2547`). The plan should say the credential proof is being **added** by B1's
possession check, not inherited from the existing rfid validation.

### M3. Backstops must be removed, not merely "re-audited", and will emit rejection noise
`:728`/`:729` complete `tailgate_in` from the client on `room_entered:secure_area`
(`scenario.json.erb:728-729`). Once `tailgate_in` is `serverCompletedOnly` (section 7), the
`complete_task!` guard rejects these on every entry, logging a warning each time, and they can never
help. The plan says "re-audit"; it should direct their removal (move to `tmp/delete/` per the common
rules) so the serverCompletedOnly rejection path is not routinely exercised by the shipped scenario.

## Minors

- m1. 3.5's route-room branch returns served room data "without `unlock_room!`", but
  `serve_opened_room` (`games_controller.rb:2239-2246`) also runs `filtered_room_data` and
  `track_npc_encounters`. State that the branch must reproduce both, or NPC encounters in the route
  room go untracked until promotion.
- m2. The viaCredential double-`save!` note (3.3b) is correct (`unlock_room!` saves at its tail,
  `game.rb:116-120`); confirm the credit write + `npcRouteRooms` delete sit inside the existing
  `ActiveRecord::Base.transaction` (`games_controller.rb:1141`) so a mid-write failure rolls back
  cleanly.
- m3. Q1/visitor_pass: agree require the pass global be server-owned (validator-enforced). But note
  this does not help the credential path, which is the real gap (B1); fixing visitor_pass alone
  leaves `test_gate_tailgate` credited by an unproven rfid unlock.
- m4. Minor line drift (all still correct enough to find the code): validate_unlock is at
  `game.rb:3050` (plan says 3050, npc branch ~3078), `npc_mapping_unlocks_door?` at `:3478`,
  `serve_opened_room` at `games_controller.rb:2239`. No action needed.
- m5. Confirm the `currentRoom` guard extension (3.3a, `games_controller.rb:2096-2099`) reads
  `npcRouteRooms` from `player_state` (loaded on sync) and not from scenario_data, so the slip-in
  acceptance itself does not trip B2's missing-attribute problem (it does not; only the subsequent
  credit does).

## Open questions
- Q1 (server-owned pass): agree, require server-owned and validator-enforce. Add: the credential
  path needs the same rigour via B1's possession check, else the strong-pass rule is half the story.
- Q2 (scope): given B1/B2, do not ship viaCredential as planned. Land the server split plus the
  viaPass credit (after B2's reload fix), and hold viaCredential until the possession check
  (B1) is designed and negatively tested. If the user wants it all now, that is fine provided B1 and
  B2 are in Chunk B.
- Q3 (holds-doors demos presentation-only): agree, leave them; they credit nothing and gate no
  outcome (verified: `rfid_cloner` count 0 in both, no server-owned pass).
- Q4 (`enter_room` objective follow-on): agree separate; asserting server state in the fixture is
  the right stopgap.

## Verdict
**Request changes.** The design is close and the viaPass/server-ownership machinery is sound, but
the viaCredential credit proves nothing server-side (B1) and the viaPass credit as routed raises on
the sync path and would soft-lock the honest earn (B2). Both are in the credit core (Chunk B).
Re-plan those two paths, add the negative credential test (M1), and the plan is buildable.
