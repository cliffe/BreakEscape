# S8c review, round 4: delta (leak scanner and the tray fix)

Delta reviewed on `ops-lock2`: `40f392949` (scanner, R3-SCANNER1..4: `tools/playtest/lib/lock_step_leak_rules.rb`
(`rules`), `access_leak_scanner_lock_step_test.rb`, new `access_leak_scanner_lock_step_r3fix_real_test.rb` (`r3fix`)) and
`7f7965f4a` (client, R3-CLIENT1: `public/break_escape/js/systems/inventory-menu.js`, `test/js/inventory-menu.test.mjs`).
Inputs: `S8c_R3_scanner.md`, `S8c_R3_client.md`, the round-3 section of `S8C_HANDON.md` (decisions: the only empty-room
allowance is the root `roomData` of a 200 door open of a locked room with no objects and no NPCs; R3-SCANNER5 is a recorded
limit). Review only; no code changed.

Counts: 0 blockers, 1 major, 5 minors.

## How it was checked, and what could not be run

- **Rails runs: NOT RUN.** The shared test lock `/home/deploy/BreakEscape/tmp/tests.lock` is deadlocked: `flock ... bin/ops-golden-compare`
  (pid 3169519, since 00:39) holds it, and its own child `flock ... /data/be-ops-build/bin/rails test .../ops_unchanged_replay_test.rb`
  (pid 3173602, parent 3169519) waits for the same lock, so nothing queued behind it runs (about 15 runs waiting at 01:22). That
  process belongs to another session; I did not kill it. Two runs of mine are queued and will write their output when the lock clears:
  - R3 probes + `r3fix`: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8c-r4/probe_r3a.txt`
    (`s8c-r3-scanner/r3a_test.rb` and `access_leak_scanner_lock_step_r3fix_real_test.rb`).
  - R4 probes (`s8c-r4/r4_probe_test.rb`: E0-E6, M1-M7, S1-S4, A1-A5, the real run) + all 27 scanner files
    (`test/controllers/break_escape/access_leak_scanner_*`, `test/unit/access_leak_scanner*`, which include the S5a `_privilege_real`,
    S7 `_ops_*real` and S8a `_mfa*` real-capture tests): `.../scratchpad/s8c-r4/full_and_r4.txt`.
  The findings below rest on traces of the rule code against the exact probe bytes in `r4_probe_test.rb`, not on runs. The real run
  0, the tamper reports and the S5a/S7/S8a counts are **unconfirmed** this round. The scanner commit touches no real-capture test
  other than `lock_step_test` (the restored assertion) and the new `r3fix`.
- **JS:** `bin/test-js -j 2` on `inventory-menu`, `inventory-tray`, `lock-step-carried`: 3 passed, 0 failed.
- **Server read** (the answers the rules must match): door open `games_controller.rb:1293-1329` (both branches serve one room, the
  route-room branch without `unlock_room!`), `serve_opened_room` `:3148`; `filtered_room_data` `game.rb:2796` and
  `apply_room_state_changes!` `:2933` (`objects_added` from `room_states` is served in the room); NPC carry put-down
  `put_down_carried!` `game.rb:1491-1518`, KO drop of a carried object `:1555-1590`, `carriable_object_index` `:1315`
  (`needsTag` objects), reach `put_down_room_reachable?` `:1609` (a connected room); a player drop keeps the item's id
  (`add_item_to_room!` `:1086-1226`, `player_drop`); flag reward answers `find_flag_rewards` `games_controller.rb:4227-4275`
  (`flag_station_id = obj['id'] || obj['name']`, rewards forwarded verbatim), door reward `:4342-4352` (`{type, room_id,
  success}`, no room data); id stamping `game.rb:7914-7933`; headless records `withhold_headless_habits!` `game.rb:7795-7815`;
  locked container marking `game.rb:7650-7653`.

## Round 3 findings

| Finding | State | Evidence |
|---|---|---|
| R3-SCANNER1 (major) room "opened" on weak proof | **closed** (two fail-closed side effects: R4-2, R4-3) | `rules:241-259`: a `GET room` adds only the awareness world room (`social.awarenessEpisode.world.room`, as `Game#awareness_world_room?` `game.rb:164`); a 200 `POST unlock` door open adds a room only when the listed ids hit exactly one room of `@ls_room_ids`, else `lockstep:room:mixed`. P1, P1b list ids of two rooms (mixed, closet not added, gate reported); P2b adds nothing (gate reported). `r3fix` pins P0, P1, P1b, P1c (limit), P2, the world room and the real run. Header `rules:36-41` rewritten. Traced, not run (lock). |
| R3-SCANNER2 (major) empty-room allowance applied everywhere; test loosened | **closed for where it applies; closed wrongly for what it lets through** (R4-1) | `rules:688-691`: `door_open` is set only for the root hash of a 200 `POST unlock` with `success: true, type: 'door'` (`rules:789`), so `GET scenario` (P3, P3b), `GET room` and every nested `roomData` are judged as before. `lock_step_test.rb:349-356` restored to `[['lock_step_content', 'lockstep:content:door:records_room']]` and the root case added; `r3fix` P3/P3b expect every shut gated door. Decision recorded in `S8C_HANDON.md`. But the allowance tests "no ids", not "no objects and no NPCs": R4-1. |
| R3-SCANNER3 (minor) `awareness` on headless records | **partly closed** (R4-5) | `rules:417-420` reports `awareness`/`promptPatience` on `social.characters.*.emailRecord` and on `social.mailClient.contacts[i]` itself. The server keeps a contact's record at `contacts[i].emailRecord` (`game.rb:7803`), which the regex does not match. |
| R3-SCANNER4 (minor) reward station ignored; reward by name | **closed** for the asked cases; one fail-closed gap (R4-4) | `rules:283-289` keys `{station id or name => objectIds}`; `rules:826-834` needs `flag_station_id` to name a station authoring that `objectId`, and resolves the lock by id or name. The server forwards `unlock_object` verbatim with `flag_station_id` merged (`games_controller.rb:4254-4268`, `:4299`), so R1 and R4 bytes are honest and pass; R2 (other station) and R3 (no station) earn nothing. `r3fix` pins R1-R5. Doors stay one set: the `unlock_door` answer carries no station (recorded limit). |
| R3-SCANNER5 (minor) route rooms | **recorded limit** (orchestrator, 2026-11-25) | Unchanged by the delta; the route-room door open (`games_controller.rb:1294-1303`) is a door open and counts as proof under R3-SCANNER1's rule. |
| R3-CLIENT1 (minor) "Open" on an emptied container | **closed wrongly for the real case** (R4-6) | `inventory-menu.js:129` now needs `contents.length > 0`, but `|| hasContents === true` still shows "Open" for the S8c briefcase, which the server serves with `hasContents: true` and the client never clears. |
| R3-CLIENT2 (needs Opus) server answer for "Open" on a held container | not in this delta | Not judged here; still open for the server review. |

## New findings

### R4-1 (major) The empty-open allowance passes a door open whose objects or NPCs carry no ids: wider than the decision

`rules:691`: `unknown = loose && (ids.to_set & @ls_known_ids).empty? && !(ids.empty? && door_open)`, with
`ids = ls_ids(roomData.objects) + ls_ids(roomData.npcs)`. `ls_ids` collects only string ids, so a door open whose root
`roomData` lists objects or NPCs **without ids** (or with non-string ids) gets the allowance. The decision is "a locked room with
no objects and no NPCs". The server never sends such entries: every room object and held item is stamped with an id at creation
(`game.rb:7917`, `:7930`), and the NPC list is keyed by id (`track_npc_encounters`). So these bytes are not a thing an honest server
could produce, and they carry a gated room's content. Trace of probe E1 (echo-less 200 door open, `roomData: {objects: [{type:
'notes', name: 'Records memo', text: '...'}], npcs: []}`): `ls_judge_open` returns `[nil, []]` (no echo, `ls_content_owners(loose:
false)` empty); in `ls_judge_contents` the root has `door_open` true and `ids` empty, so `unknown` is false and there is no owner; the
object hash has no `id` (`ls_id_owners` empty); `ls_room_owners` needs a `rooms.<id>` path or `room_id` (none). Result: 0 findings,
where it should report `lockstep:content:door:*` for every shut gated door. The same holds for E2 (an id-less NPC holding an id-less
keycard) and E3 (`id: 7`).

**Fix** (`rules:691`): grant the allowance only when the root `roomData`'s `objects` and `npcs` are each absent or an empty
Array: `empty_room = door_open && Array(hash['roomData']['objects']).empty? && Array(hash['roomData']['npcs']).empty?`, and
`unknown = loose && (ids.to_set & @ls_known_ids).empty? && !empty_room`. Add E1, E2, E3 to `r3fix` as reported; keep the
decision case (`r3fix` "the open of an empty locked room") at `[]`.

### R4-2 (minor) The mixed rule reports an honest open that lists an object an NPC carried in; a carried object alone moves the proof to the wrong room

A `needsTag` object (`carriable_object_index`, `game.rb:1315-1338`) keeps its authored id when an NPC puts it down, or drops it on a
KO, in a connected room (`put_down_carried!` `game.rb:1491-1518`, `:1585-1588`, `put_down_room_reachable?` `:1609`), and the room
serves it from `objects_added` (`game.rb:2944-2951`). That room may be shut to the player. Its honest first door open then lists
its own ids plus the carried one: `lockstep:room:mixed`, the room is not marked opened, and a gated object's honest gate there is
reported too (probe M1, the same bytes as `r3fix` P1). If the room lists only the carried object (M2), the rule marks the carry's
home room opened instead. A player drop also keeps the id (`player_drop`), so an `alreadyOpen` door open of a room the player dropped
something in is reported mixed. No shipped lock-step scenario has a carriable object (only `test_ops_lock_step` has lock steps),
so nothing fails today; it fails closed, except M2, which is the P1c class (limit 1).

**Fix** (`rules:178-186` and `:250`): leave ids of objects the server can move out of the room proof. Build `@ls_room_ids` from
objects that are neither `needsTag` carriable (mirror `Game#carriable_object?` / `carriable_object_index`) nor takeable, and
skip an `alreadyOpen` answer for the mixed report. Test: an honest closet open listing a carried annex object is clean and
opens the closet.

### R4-3 (minor) With `GET room` no longer proof, ordinary rooms opened by a door reward or a prop are never "opened"

A successful `unlock_door` flag reward (`games_controller.rb:4342-4352`) answers `{type, room_id, success}` with no room data;
the client then fetches `GET room/<id>`, which is honest (`unlock_room!` ran). A `prop_door` workaround opens through
`serve_opened_room` in a `POST npc_workaround` answer. `ls_earn_door_routes` (`rules:822-839`) adds `@ls_opened` only for a
gated door, and `ls_note_rooms` reads only `POST unlock`, so a lock-step object in an **ordinary** room opened either way has
its honest gate reported as `lockstep:gate:room:*`. Fails closed; no shipped scenario has it.

**Fix**: in `ls_earn_door_routes`, `@ls_rooms << r['room_id']` for a successful `unlock_door` reward whose room is in
`@ls_reward_doors`; in `ls_note_rooms`, accept a 200 `POST npc_workaround` `{roomId, roomData}` for a room in `@ls_prop_doors`
when its listed ids belong to `roomId` only. Tests: both honest paths clean; a reward for a room no station authors earns nothing.

### R4-4 (minor) A station with no authored id is keyed differently from the server's `flag_station_id`

`rules:283` keys a station by `station['id'] || station['name']` from the scenario file. The server stamps an id-less station
`<room>_flag-station_<i>` (or `<npc>_held_<i>` when held, `game.rb:7917`, `:7930`) before `find_flag_rewards` reads
`obj['id'] || obj['name']` (`games_controller.rb:4237`), so its honest answer names the generated id and the scanner earns
nothing: the open after it is reported (probes S1, S2). In the other direction, for a station with a name and no id, the scanner
accepts `flag_station_id` equal to the name (S3), which the server never sends. The reward must still be authored by that station,
so this loosens nothing that matters. **Fix**: key stations by the id `ls_server_ids` gives them (the same generator `@ls_room_ids`
uses), and not by name. Tests: S1 and S2 clean; S3 reported.

### R4-5 (minor) `awareness` on a mail contact's record is not reported

`rules:418` matches `social\.mailClient\.contacts\[\d+\]\z`, the contact hash. The server's record for a contact is
`social.mailClient.contacts[i].emailRecord` (`withhold_headless_habits!`, `game.rb:7801-7803`), which neither alternative
matches. Probe A1 (`contacts: [{id: 'ghost', emailRecord: {awareness: 'low'}}]`) is not reported by this rule. **Fix**: add
`social\.mailClient\.contacts\[\d+\]\.emailRecord\z` to the regex (keep the contact-level one); add A1 to `r3fix`. Note:
`promptPatience` is a habit (`habits.promptPatience`, `mfa_model.rb:170-173`); the emailRecord-level key check is harmless but
does not replace the habits rule.

### R4-6 (minor) "Open" is still offered for the emptied S8c briefcase

The gated briefcase is served locked, so the server deletes its `contents` and sets `hasContents: true` (`game.rb:7650-7653`).
The unlock copies the server's `contents` onto `scenarioData` and leaves `hasContents` in place (`unlock-system.js:42-43`; no client
code clears it). Once the player takes the last item, `contents` is `[]` but `hasContents === true` still adds "Open"
(`inventory-menu.js:129`). The new test pins `hasContents: false, contents: []`, a state this item never has.
**Fix**: `Array.isArray(data.contents) ? data.contents.length > 0 : data.hasContents === true` (a USB stick, which has
`hasContents` and no `contents`, keeps "Open"); test that `{ locked: false, hasContents: true, contents: [] }` gives
`['Drop here', 'Examine']`.

## The delta as new code (other points checked)

- **Mixed report** fires only on `success: true` door opens (`rules:248-249`); a refused or non-door answer proves and reports
  nothing (M5). Ids come from `objects` (with contents) and `npcs` (with held items); `@ls_room_ids` holds room objects and their
  contents only, so an NPC that walked between rooms does not make an answer mixed. Duplicate authored ids across two rooms
  would (M4); there are none in the shipped lock-step scenario.
- **World room** read is guarded at every level (`rules:246`).
- **Headless rule** runs only with a lock step (`@ls_active`), the scope R3 asked for.
- **Restored assertion** (`lock_step_test.rb:353-356`) is exactly the R3 instruction, plus the root case.
- **Client**: the change is one condition; the three JS files pass.

## Limits the stage lands with

1. P1c: a door open that serves another shut room's data whole is the same bytes as that room's honest open (no request body
   in the capture); M2 (a carried object alone) is the same class.
2. With a PC push step open in a mixed scenario, an echo-less cancel or waiting prompt reads as the PC's.
3. An echo-less open of a gated lock that serves no contents and no room data is not reported; the echo-less door open of a room
   with no objects and no NPCs is placed nowhere (owner decision; R4-1 narrows the allowance to that).
4. Values under `serverGlobals`, the text of contents, and id-less content under unknown keys of an honestly opened item (and
   unknown keys of room data, such as `items`) are not judged; freshness is on the recorder's clock.
5. Integers inside the server's bounds can still carry a value (`promptsSent` 10..20, `retryIn` 10..99).
6. A gated room whose only ids are NPCs moved out before it opens is reported on its honest first open (fail closed).
7. Route rooms (R3-SCANNER5): an unpromoted route room counts as opened; for the scanner hardening stage.
8. Door rewards share one station set (the `unlock_door` answer carries no station id).
9. Until R4-2 and R4-3 are fixed: honest carries into a shut room, and ordinary rooms opened by a reward or a prop, give false
   alarms (fail closed).

Verdict: not clean (R4-1 major). The Rails runs are pending on the deadlocked test lock; read the two output files above once it clears.
