# Wearable items: code review round 1 (server and lab)

Branch `build/wearable` at b605d4a32, against `main`. Scope: the Rails side of the `wearable`
field (`app/models/break_escape/wearables.rb`, `lib/break_escape/wearable_model.rb`, `POST wear`,
the sync and inventory hooks), the validator (`scripts/validate_wearable.rb`, schema), the lab
change (`scenarios/lab_physical_pentest`) and their tests. Client JavaScript and
`scenarios/test_wearable` are a second reviewer's.

Checked by: reading the diff and the paths it touches on the server; `ruby -wc` under 2.7.8 on
every changed Ruby file (no Ruby 3-only syntax: `filter_map` and `pick` are 2.7 and Rails 6);
`bin/rails test test/controllers/break_escape/wearable_test.rb` (18 runs, 0 failures) and
`test/models/break_escape/lab_physical_pentest_secrets_test.rb` (36 runs, 0 failures);
`check_wearables` on lab_physical_pentest, test_wearable and test_npc_needs (no issues); the full
validator on the same three (no wearable or costume errors; the lab's committed dungeon graph is
current).

## Severity table

| Id | Severity | Finding |
|----|----------|---------|
| m1 | minor (pre-existing) | Records door: the costume's server ownership protects nothing the server checks; entry and the tailgate credit are both client-owned, and the bypass needs no forged call |
| m2 | minor | A game in progress at deploy with `courier_ready` true and no worn record is stuck: take_off writes nothing |
| m3 | minor | A player drop does not take the worn item off on the server; only the separate inventory remove does |
| m4 | minor | Validator misses `#set_global:<worn global>:` ink tags |
| m5 | minor | Test gaps that would let a regression through |
| n1 | nit | The read-only log line says "imported global" and fires on a fresh game's first sync |
| n2 | nit | `WearableModel.spec_for_id` is unused |
| n3 | nit | `pp_disguise` stays client-writable beside a server-written value |
| n4 | nit (pre-existing) | Unrouted `Api::GamesController` adds client items unvalidated |
| n5 | nit | Build log and README could say plainly what the costume does not protect |

No blockers, no majors.

## Server authority, question by question

- **Wear without holding the item.** Refused. `wear!` (`wearables.rb:47`) looks the item up in
  the server inventory and reads `wearable` from the server's copy (`held_inventory_item`). A
  client-made `wearable` never reaches the inventory: `CLIENT_ITEM_FORBIDDEN_FIELDS` strips it
  and `canonical_inventory_item` (`games_controller.rb:2133`) stores the scenario copy. Tested.
  The lab vest is a declared grant, which the server lets the player claim at any time
  (`games_controller.rb:2207`, plan 1.4); it sits in the start room, so that changes nothing.
- **Keep the costume after dropping.** Through `inventory remove` and a network plant, no: both
  call `release_worn_unless_held!`. Through a player drop alone, yes (m3).
- **Write the worn global.** No through `sync_state` (set or delete: `merge_global_variables!`,
  `game.rb:284`, joins `worn_global_names` to the read-only list). The only other server writer
  of a declared global is a task's `onComplete.setGlobal` (`apply_task_set_globals!`), which is
  authored content and the validator refuses it for a worn global. Row locks: `wear` is in
  `with_game_lock`; `sync_state` takes its own row lock; the older-game migration runs inside it.
- **Get what the costume unlocks without wearing it.** Yes, as on `main` (m1).

## Open item (a): the records door without the costume

**Did it exist before this branch?** Yes, unchanged. On `main`, `validate_unlock` accepts
`method: npc` for any NPC that carries an `unlockDoor` mapping for the room
(`game.rb:2155`, `npc_mapping_unlocks_door?` at `game.rb:2443`, added in 57d3d2373), with no
encounter, position or gate check, and Len carries `len_never_fires` for `secure_area`
(`scenario.json.erb:1451`, same on main). The branch touches neither.

**It is wider than the build log says.** No forged call is needed. Len's route action runs in
the player's own browser (`npc-behavior.js` `_runRouteAction` calls `NPCGameBridge.unlockDoor`),
and a valid unlock calls `unlock_room!` (`games_controller.rb:967`), so after Len's first trip
into records `secure_area` is in the player's `unlockedRooms`. From then on `GET room/secure_area`
serves it (`games_controller.rb:485`) and a sync of `currentRoom: secure_area` is accepted. The
gate is a client-side control by design, as `door-gates.js` says at length.

**How the tailgate is meant to be enforced.** By the client only: the gate bars a player whose
`playerMayPassIf` global is false, and the credit is two client mappings on `room_entered:secure_area`
(`scenario.json.erb:824` sets `kp_badge_tailgated` and completes `tailgate_in`; `:657` is the
backstop). `concludeRequires` is `{}` and Ruth's debrief reads `kp_badge_tailgated` in ink. Both
`kp_badge_tailgated` (a plain declared global) and the manual task `tailgate_in` are writable by
`sync_state` and `POST complete_task`, so a player who skips the door can forge the credit directly.
No server reader of `courier_ready` exists in the lab. Making `courier_ready` server-owned is
correct and costs nothing, but on its own it closes no route to the lab's outcome.

**Contained fix, if wanted later (not in this branch).** It only pays if the credit moves to the
server too. Sketch:

1. In `validate_unlock`, for `method: npc` on a door whose connecting `doors[]` entry has a
   `gate` with that NPC in `openFor`, record the room in a new `player_state['npcRouteRooms']`
   instead of `unlockedRooms`.
2. `GET room` serves a room in either list (Len's path still loads); `merge_last_write_wins_sections`
   accepts `currentRoom` for an `npcRouteRooms` room only while the gate's `playerMayPassIf`
   global is true on the server (now unforgeable when it is a worn global) or the player holds the
   room's `requires` credential, and then promotes it to `unlockedRooms`. Item collection from the
   room keeps reading `unlockedRooms`.
3. Make the credit server-side: a `concludeRequires.globals` or an aim condition on a global the
   server sets at that promotion, not `kp_badge_tailgated` from a client mapping.

That is an access-model change with its own plan and tests (every lab and mission with a gated
door and `openFor`). Recommendation for this branch: keep it as a recorded limit, correct the
build log's wording (no forged call needed; the credit is client-writable anyway), and put the
sketch in `docs/IDEAS_BACKLOG.md` or the access model plan.

## Open item (b): `unseenOnly` on the server

Not worth a server check. The server does not hold NPC positions: they come from the client's
simulation, so any check would trust client-reported positions and prove nothing. What the worn
global grants is read only by the client (m1), so a server `unseenOnly` would guard nothing. The
rule is a presentation rule and should stay client-only, as the build log records. If a later
mission puts a worn global behind a server check, the server still guarantees "held and put on
through POST wear", which is the property that matters for access; "changed unseen" is a story
rule.

## Findings

### m1. The costume protects no server outcome (pre-existing)

As above. File: `docs/achitechture/WEARABLE_BUILD_LOG.md` ("Open"), `README_scenario_design.md`
(wearable paragraph). Fix in this branch: wording only. State that Len's ordinary route unlock
already puts `secure_area` in the player's `unlockedRooms`, and that the lab's credit
(`kp_badge_tailgated`, `tailgate_in`) is client-written, so the worn global's server ownership
matters only for a server reader of it (none in the lab today).

### m2. In-flight games can be left with a worn global stuck true

`wearables.rb:25` (`worn_global_names`) and `:75`. A lab game started on `main` with the vest on
has `courier_ready: true` and `pp_disguise: courier` in its saved globals and no `worn` record.
After deploy its first sync makes `courier_ready` read-only. The bootstrap sends no `wornItem`, so
the tray shows the vest as not worn while the avatar is the courier. The locker's `take_off`
reaches `wear!(nil, false)`, finds no record and writes nothing: `courier_ready` stays true, the
locker's own "not worn" hint is skipped (its condition is `!courier_ready`), and the player gets
no feedback. Putting the vest on and taking it off again recovers, but nothing tells the player
to. Fix: when `wear!` takes off with no record, clear every worn global that is true (and
`pp_disguise`); and in the older-game branch of `worn_global_names`, reconcile once: a true worn
global whose item is held becomes a `worn` record, otherwise false. Test: a game with
`courier_ready: true`, no `worn` and no `wearableGlobals`; one sync; `POST wear worn:false` leaves
it false.

### m3. A player drop does not take the worn item off on the server

`game.rb:433-455` (`add_item_to_room!`, `player_drop`). The drop copies the held item into the
room but leaves it in `player_state['inventory']`; only a separate `inventory remove` runs
`release_worn_unless_held!`. A client that sends the drop and not the remove keeps the vest, the
costume and the worn global, with a second copy on the floor. The duplication is pre-existing for
every droppable item; for a wearable it also breaks the "comes off when it leaves" rule on the
server. The lab vest is not droppable, so the lab is not affected. Fix: in the `player_drop`
branch, remove the held item from the inventory in the same request and call
`release_worn_unless_held!` (the client's following remove is then a no-op), or refuse a
`player_drop` of the item named in `worn`. Test: drop the worn vest with no remove; `worn` is
nil and `vest_on` false. The current test "dropping the worn item takes it off"
(`wearable_test.rb:175`) sends the remove too, so it proves the remove path twice and would not
catch this.

### m4. Validator misses ink tag writers

`scripts/validate_wearable.rb:24-31` matches only `~ name =`. Ink also writes globals by tag
(`# set_global:name:value`, used in the lab itself at `ruth_debrief.ink:264`, and read by
`phone-chat-conversation.js` and the person-chat path). A `# set_global:courier_ready:true` tag
passes the validator; the server then refuses the sync, so client and server disagree until the
next reload. Fix: also match `#\s*set_global\s*:\s*<name>\s*:` in the same scan. The scan reads
only `<scenario_dir>/ink`; every lab `storyPath` is there, so that is enough today, but reading
the `storyPath` sources (the `.ink` beside each `.json`) would cover shared ink.

### m5. Test gaps

- No Rails test of the real lab path: claim `kit_hivis_vest` as the hook's declared grant, then
  `POST wear` succeeds and `courier_ready` is true. The browser run (game 1209) covered it once;
  a change to `DeclaredGrants` or `filter_requires_and_contents_recursive` that dropped
  `wearable` from the grant copy would pass every Rails test. Add it to
  `lab_physical_pentest_secrets_test.rb` or a lab controller test.
- No test that a network plant of a worn item takes it off (`network_access.rb:204`).
- No authorisation test: `POST wear` on another player's game is refused (`game_policy.rb`
  `wear?`).
- The drop test (m3) and the in-flight game (m2), as above.
- The lab test checks the absence of `courier_ready` writers in JSON but not in ink; running
  `check_wearables` on the lab in a test would cover both and the tag case once m4 lands.

### n1. Misleading, noisy log line

`game.rb:293` logs "Ignored a client write to imported global" for a worn global too. On a fresh
game the server has no value for `courier_ready` while the client's first sync sends the scenario
default `false`, so `nil != false` logs a warning on every game's first sync. Fix: name the
reason ("read-only global") and skip the warning when the stored value is nil and the incoming
one equals the scenario default.

### n2. Unused helper

`lib/break_escape/wearable_model.rb:53` `spec_for_id` has no caller. Remove it or use it.

### n3. `pp_disguise` is still client-writable

`wear!` writes `pp_disguise`, but a sync can change it, so a forged sync can show the courier
sprite after a reload with `courier_ready` false. Cosmetic (no server or lab reader of
`pp_disguise`). Adding it to the read-only list would break `set_costume` scenarios such as
test_npc_needs, so if anything make it read-only only when the scenario has wearables (where the
validator already warns about `set_costume`).

### n4. Unrouted API controller (pre-existing)

`app/controllers/break_escape/api/games_controller.rb` has an `inventory add` that stores the
client's item as sent, `wearable` included, and a `sync_state` with no lock. It is not in
`config/routes.rb`, so it is unreachable today. If it were ever routed it would undo the
wearable's server checks. Remove it, or leave a comment saying why it must not be routed.

### n5. Documentation

The README's wearable paragraph is accurate. One sentence would help authors: a client mapping
that sets another global from the worn global (the lab's `kp_badge_tailgated`) is still
client-writable, so a server check should read the worn global itself.

## The lab against the content plan

- Courier beat: the hook is in the briefing room with Ruth, who is ignored, so the player can
  put the vest on there and use the parcel story on Dev in reception. Dev (reception) and the five
  open-plan staff all count, so no change in either room. Fairbairn counts in records; the debrief
  Ruth is ignored. The hall and store room have no NPCs, so the PIN trade-off ("take it off out of
  the staff's sight: the hall is nearest") works.
- Shoulder-surf trade-off text: kept in `confirmOn` and in the ledger shelves' variant and hint;
  `player_watched_reader` still reads `!courier_ready`.
- Locker: the not-worn hint before `take_off`, conditions read at the click; Ruth is ignored, so it
  never refuses in the briefing room.
- Reload: the bootstrap sends `wornItem` and the saved globals; tested. In-flight games: m2.
- No `set_costume`, `clear_costume` or `courier_ready` writer remains in the lab JSON or ink
  (checked by the lab test and by `check_wearables`). The only other scenario with costume actions,
  test_npc_needs, has no wearables and gets no warning, as intended.

## Verdict

Approve for the server and lab half once m2 and m3 are fixed with their tests; m4, m5 and the
nits can go in the same follow-up. The server ownership of the worn global is sound: no request a
player can send puts a costume on without the held server copy, and no sync writes the worn
global. Open item (a) is pre-existing and not this branch's to fix: record it accurately (m1) and
backlog the access-model change. Open item (b): keep `unseenOnly` client-only.
