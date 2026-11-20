# Friendface phone item: code review, round 5

Branch `build/ff-phone` at 7d27326fc. Scope: the R4 fixes in 0155e1336 (main merged in),
a3d9dd08f, 8310a97f1, 719bf08d5 and 7d27326fc, above all `Game#npc_ko_claimable?` and the
readers and records that now use it, the stamped held item ids, and the refusal handling in
`withSyncRetries`. Round 4: `FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R4.md`; build log section "R4 fixes".

Counts: 0 blocker, 2 major, 1 minor, 2 nit.

## What was checked

- Every writer of `encounteredNPCs` (the "met" record the new rule rests on), every writer of a KO
  record, and the NPC kinds in every scenario (only `person` and `phone` exist; no NPC id is
  listed in two rooms with different `koImmune` or `npcType`).
- Old saves: a KO on record for an NPC with no met record.
- n1: an honest KO drop with a slow KO sync, in the NPC's own room and in another room.
- Stamped ids: every give tag, task and event mapping in every scenario that could name an item
  which had no id before (scan of all missions).
- The offer branch: every held item in m01 to m10 that passes `npc_offers_item?`, the give tags
  it matches, and whether each tag's knot is ever reached (diverted to or named by the scenario).
- Live proof on a keyless server at :3083 (stopped afterwards), headless, physics at
  `setFPS(20)` with fixed steps on. Games created: 1650, 1657, 1662, 1666, 1667, 1670, 1672
  (all m01).
- Tests, affected files only, no lock: Rails `forged_ko_drop_test.rb`,
  `reload_persistence_test.rb`, `game_test.rb`: 173 runs, 704 assertions, 0 failures. JS
  `npc-ko-drop-retry` 9/9, `combat-room-rule` 17/17, `npc-hostility-persistence` 8/8,
  `npc-ko-immune-and-door-event` 7/7.

## R4 findings

| R4 | Status |
|---|---|
| M1 forged hostility KO | The direct probe is closed (game 1650: forged KO stored, drop 422). Not closed overall: "met" can be forged (M1 below). |
| m1 id-less held items | Fixed for KO drops (stable ids, one stored copy, re-drop listed). The stamp breaks an m01 task (M2 below). |
| m2 `koImmune` in every record | Fixed: all three records and every reader ask `npc_ko_claimable?`. |
| n1 refusals retried | Fixed. An honest drop is not refused first time (games 1666, 1667); see "Honest play". |
| n2 two sprites on re-entry | Agreed: only the m10 shared id case, run live by the fixer. |
| n3 pending walk per room load | Fixed: two hash lookups and a room-state walk for an NPC with no KO record. |

## Live results

| Game | What was done | Requests and outcome |
|---|---|---|
| 1650 | Start reception; Kevin unmet behind locked doors. Forged KO and drop, then `move_npc` for Kevin, then GET /room | Forged `sync_state` 200 (stored `ko: false`); drop of his keycard 422. `move_npc` (roomId `reception_area`, fromRoom `main_office_area`, locked and empty, toRoom `reception_area`) 200. GET /room/reception_area lists Kevin and records him met. Forged KO 200, now stored `ko: true`; keycard drop into reception 200; `/inventory add` of his lockpick from the NPC 200; keycard pickup 200. Inventory: Kevin's lockpick and server room keycard; unlocked rooms: reception only. |
| 1657 | Head start: build_the_case open, Kevin's lockpick given | `find_derek_access` active, count 0. |
| 1662 | Start IT room; Kevin KO'd honestly; his lockpick picked up from the floor | KO 200, three drops 200. The pickup event carries `itemId: kevin_park_held_0`; `find_derek_access` stays active, count 0. Control: the same event with no id (what a game made before the stamp sends) completes it at once (server log "Task completed: find_derek_access"). |
| 1666 | Derek KO'd in the break room, the KO sync held 8 s | KO 200 at 8.1 s; the launch device drop is sent after it, 200 at 8.1 s, first try. One stored copy. |
| 1667 | Derek moved into the conference room (the chase case), KO sync held 8 s | KO 200 at 8.1 s; drop into `conference_room` 200 at 8.1 s, first try. |
| 1670 | The chase case, KO sync answering 503 every try | Four KO tries, then the drop 422 once, not retried. The local sprite shows; picking it up: `/inventory add` 200 (NPC branch), `remove_object` 422; the launch device is held and its station opens. The hostility KO reached the server by `sync_state`. |
| 1672 | Simulated old save: Derek's KO in `npc_states`, Derek not in `encounteredNPCs` | First load: Derek lies KO'd, still holding the launch device, no `koDropPending`, nothing on the floor; the load records him met. Reload: listed, re-dropped ("Added item launch-device"), sprite on the floor. |

## Major

### M1. "Met" can be forged through `move_npc`, so the M1 bypass is still open

`npc_ko_claimable?` assumes an NPC is met only when the server serves its room, which it does
only for a room the player may enter. That holds for the room action, but the room's NPC list
includes `npcs_added`, and `update_room` `move_npc` writes that list from the client:

- the controller checks only that `roomId` (the destination) is accessible;
- `move_npc_to_room!` checks that `fromRoom` and `toRoom` are connected (or that the NPC is a
  phone NPC), not that `fromRoom` is accessible or that the NPC is in it.

So a client names any NPC, any `fromRoom` next to an unlocked room, and that room as `toRoom`.
The next GET /room for it lists the NPC and `track_npc_encounters` marks it met. From there the
R4 rule accepts a forged KO, `npc_in_room?` is true through `npcs_added`, and the give branch
hands over any held item even without a KO. Game 1650 took Kevin's server room keycard and
lockpick with only reception unlocked (see the table). Every NPC that R4 M1 listed (keys behind
locked doors in m01 to m10) is reachable the same way, provided some unlocked room is
connected to any room at all.

The endpoint predates this branch (e18e1d722) and has no caller in the game: `RoomStateSync`
exports the request, and nothing calls it. So this is not new to the branch, but it is the one
input the new rule trusts, and it reopens the R4 M1 hole in full. It also breaks the sync size
rule: `npcs_added` gains a full NPC copy on every call with no duplicate check, so repeated calls
grow `player_state` without bound, and every GET /room for that room sends them all.

Fix: refuse `move_npc` unless `fromRoom` is unlocked (`room_unlocked?`) and the NPC is currently
there (`npc_in_room?`), and do not append an NPC already in `npcs_added`; or drop the action,
since nothing calls it. Add a Rails test: unmet Kevin moved from `main_office_area` into reception,
then the GET /room, forged KO, drop and `/inventory add` all refused, and the move refused.

### M2. The stamped held ids break m01's `find_derek_access` task

`find_derek_access` (required, in `build_the_case`) has
`"targetItemIds": ["Derek's Office Key", "derek_office_key", "Lock Pick Kit"]`. The pickup event
sends `itemId: scenarioData.id || lockRef(...)`, and the objectives code matches
`itemId || itemName`. Kevin's lockpick had no id and no lock ref, so the match fell through to its
name, "Lock Pick Kit", and the task completed. Stamped, its id is `kevin_park_held_0`, the name is
never tried, and the task cannot complete from it (game 1662, with the control showing the old
payload completing it). The server's `validate_collection` uses the same `id || name` order.

Derek's Office Key does not save the task either: it sits in Patricia's briefcase and carries the
older contents stamp `patricia_briefcase_content_0`, so it has matched none of the three entries
since contents got ids. That part predates the branch; the lockpick was the only way left.

Effect in a new m01 game: the required task stays open for the whole run, `build_the_case` never
completes, and the score loses it. The ending is not withheld (the conclude gate lists only the
four flag tasks) and `search_derek_office` still opens early when the player enters Derek's
office, so this is not a blocker. Games made before the stamp are unaffected.

The scan of every scenario found no other task or mapping hurt: m03's card mappings match the
card name, which the stamp leaves alone.

Fix, either or both: in m01, add `kevin_park_held_0` and `patricia_briefcase_content_0` to the
task (or give both items authored ids and list those); in the engine, match `targetItemIds`
against the item's id, its lock ref and its name, client and server alike. A validator warning for
a `targetItemIds` entry that matches no item's id, lock ref or name would have caught both.

## Minor

### m1. An old save with a KO but no met record re-drops only on the second load

For an NPC with a KO on record and no met record, `filtered_room_data` builds `koDropPending`
before the room action calls `track_npc_encounters`. On the first load the NPC is not claimable,
so nothing is listed, and the KO'd NPC lies there still holding its items. The same load records
it met, so the next load lists and re-drops them (game 1672, Derek's launch device). Nothing is
lost, but a player who does not reload sees a KO'd NPC with nothing to pick up.

In honest play a KO'd NPC was always met in its own room first, so a save reaches this state only
if a write to `encounteredNPCs` was lost (the race that put the room action under the game lock;
games from before that). Rare, and the item is never unreachable, so not a blocker. Fix: track
the room's encounters before composing the payload, or compute `koDropPending` after it.

## Nit

- n1. **The offer check is by text and by type.** `npc_offers_item?` accepts a held item when any
  `give_item:<type>` appears anywhere in the NPC's story or record, whether or not that line can
  run in this game, and for every held item of that type. In m01 to m10 this opens nothing
  today: every knot holding such a give is diverted to or named by its scenario, and every held
  item that shares a type with another is named by its own give tag (m02's nine handler guides,
  m05's and m06's relayed cards, m09's and m10's notes). m03's `relayed_executive_keycard` sits in
  `on_victoria_ko_card`, reached by the scenario's KO event mapping, so it is reachable in honest
  play and passes the q78 ruling; m04's `relayed_workshop_keycard` sits in `on_relay_ko_card`, the
  same pattern, and the m05 and m06 relayed cards sit in knots their scenarios reach. A future scenario could still give a key from a dead or always-false
  branch, so a validator check (a held key-type item whose only give is in an unreached knot)
  would keep this true.
- n2. **A refused KO drop of a Friendface phone cannot be picked up until a reload.** After a
  refusal the local sprite's pickup goes through the inventory NPC branch (game 1670 for the
  launch device), and that branch refuses a Friendface phone the story does not offer. It needs
  every KO sync try to fail and the NPC to fall outside its own room; a reload re-drops it once
  the hostility KO has synced. By reading, not run live.

## Trust questions, answered

| Question | Answer |
|---|---|
| Can a client fake "met"? | Yes, through `move_npc` (M1). Otherwise no: `encounteredNPCs` is written by GET /room and a door or workaround unlock (`track_npc_encounters`, for rooms the player may enter) and by the give path for headless records only; `sync_state` does not take it. |
| Another route that marks an NPC defeated? | No. KO records are `npc_states.isKO` (written by `update_npc_state!` and the in-room KO drop) and `npcHostility.ko` (`merge_npc_hostility!`); all three apply the rule, and both readers ask it. A string or number `isKO` counts as no KO in the reader. |
| NPC kinds missed? | No. Scenarios use only `person` and `phone`; headless records are not room NPCs; NPCs added at runtime come only from `move_npc` (M1). |
| Old saves | No item becomes unreachable; one case needs a second load (m1). |
| n1 | An honest drop is not refused first time: it waits for the KO sync, however slow (games 1666, 1667). It is refused only after the KO sync gives up, and then the pickup still works through the NPC branch (game 1670), phones aside (n2). |
| Stamped ids and give tags | Give tags still resolve: the client selector matches id, `opens_lock`, `key_id` or name (m02 Gary's `server_room_keycard` matches his card's lock). Ink and mappings that name items use names. The one break is a task that matched by name (M2). |
| Offer branch | Accepts no unreachable give in m01 to m10 today (n1). |

## Sync size

| Added | Where | Bound | Sent |
|---|---|---|---|
| Stamped held ids | `scenario_data`, at game creation | One per held item | Never synced |
| Refusals not retried | Client memory | One request per refusal instead of four | Single-item requests |
| `ko: false` for an unclaimable NPC | `player_state.npcHostility` | One entry per scenario NPC, as before | The client's narrow hostility sync, as before |
| `npcs_added` from `move_npc` (M1, predates the branch) | `player_state.room_states[room].npcs_added` | None: a full NPC copy per call, no duplicate check | Every GET /room for that room |

The R4 changes add nothing that grows. Only the old `move_npc` path does, and fixing M1 bounds it.
