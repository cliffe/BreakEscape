# Finale engine: flag reward doors (F18), mapping unlocks (F19), silence (F10)

Done 2026-10-21. Not committed. Line numbers are in the working tree after the change.

## What changed

### F18: an `unlock_door` flag reward opens the room it names

`find_flag_rewards` merged the station's own room over every reward's `room_id`, and `process_door_unlock_reward` read `room_id` before `target_room`. A reward always "unlocked" the room the station stands in, which is already open.

- `app/controllers/break_escape/games_controller.rb`
  - L2152, L2159, L2167 (`find_flag_rewards`, hash, flag-locked and indexed forms): `'room_id' => reward['room_id'] || room_id`, so the station room is only a fallback.
  - L2232-2235 (`process_door_unlock_reward`): `target_room` first, then `room_id`, with a comment.
- `public/break_escape/js/systems/apply-actions.js` L83-93 (`unlock_door`): when `source === 'flag_reward'`, set `locked = false` on the door sprites to that room and on `gameScenario.rooms[id]` / `rooms[id]`, as `NPCGameBridge.unlockDoor` does. Without this the browser check showed the archive door still asking for its PIN after the reward until a reload. Other sources (triggerOnInteract, timers, ESD) are client-only and the server would refuse the room, so they are left as before.

### F19: eventMapping `unlockDoor`

`"unlockDoor": "<room_id>"` (or a list) on an NPC eventMapping unlocks through the same server path as ink `#unlock_door` (`POST unlock`, method `npc`), so it is saved and survives a reload, and fires `door_unlocked_by_npc` like the ink tag.

- `app/models/break_escape/game.rb`
  - L1030 (door branch of `validate_unlock`, method `npc`): `npc_mapping_unlocks_door?(npc_id, target_id) || validate_npc_unlock(npc_id, target_id)`.
  - L1246-1258: new `npc_mapping_unlocks_door?`: true when that NPC record (room NPC or headless) has an eventMapping whose `unlockDoor` names the room. No encounter or `unlockable` check: the mapping is the permission.
- `public/break_escape/js/systems/npc-game-bridge.js` L73-74, L77, L86-87: `unlockDoor(roomId, npcIdOverride = null)`; uses the override when given, else the conversation NPC as before.
- `public/break_escape/js/systems/npc-manager.js` L671 (`_buildMappingConfig`: `unlockDoor`) and L869-881 (`_handleEventMapping`, after `unlockAim`): calls `NPCGameBridge.unlockDoor(roomId, npcId)` for each room, one at a time. (The peer's `resolveSpeakerId` change was committed in 8f38fff3, so the working diff of this file is now only these two hunks.)
- `scripts/validate_scenario.rb` L298 (`unlockDoor` added to the known eventMapping fields) and L476-480 (error when a room it names does not exist). **L296 (`voiced`) in the same diff hunk is the peer's**; split with `git add -p`.

### F10: silence

- `public/break_escape/assets/music/Silence/Silence.mp3` (new): 10 s, mono, 48 kHz, 32 kbps MP3 (the other music is 48 kHz MP3), made with `ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 10 -c:a libmp3lame -b:a 32k`. Max volume -91 dB. 40 KB.
- `public/break_escape/js/music/music-config.js` L154-164: `silence` playlist, one sequential track that loops.

### Docs

`README_scenario_design.md`: L904-905 (flag reward `unlock_door` needs `target_room`/`room_id`, after the flag-station example), L1159 (`door_unlocked_by_npc` also fires for `unlockDoor`), L1189 (`unlockDoor` row in the eventMapping actions table), L1548-1549 (silence playlist, after the music trigger table). The peer's EXTERNAL paragraph was not touched.

### Test scenario

`scenarios/test_unlock_silence/` (new; mission.json + scenario.json.erb): a warden whose mapping on `vault_release` unlocks the PIN-locked vault, a flag station in the lobby whose reward targets the PIN-locked archive, and music events `game_loaded` → noir, `quiet` → silence. Registered in the dev DB as mission 82 (rails runner, not `db:seed`).

## Tests

New:
- `test/controllers/break_escape/flag_reward_unlock_door_test.rb` (3): target_room reward opens that room; a reward's own `room_id` survives; no target falls back to the station room. **At HEAD (worktree) 2 of 3 fail** (`Expected: "vault" Actual: "hall"`, `Expected: "annex" Actual: "hall"`); all pass now.
- `test/models/break_escape/npc_mapping_unlock_door_test.rb` (3): mapping authorises an unmet NPC, list form works; other rooms/NPCs refused; unlock persists. 2 of 3 fail at HEAD, all pass now.
- `test/js/event-mapping-unlock-door.test.mjs` (4): config carries `unlockDoor`; firing mapping calls the bridge per room with its NPC, in order; bridge with override calls `unlock('door', room, npc, 'npc')` and emits `door_unlocked_by_npc`, and without one still needs a conversation; validator knows the field and errors on a missing room.
- `test/js/flag-reward-door-sprites.test.mjs` (2): flag reward opens only the named room's door sprites; a non-reward source leaves them.
- `test/js/music-silence-playlist.test.mjs` (2): playlist exists, file shipped, file silent (ffmpeg volumedetect).

Suites:
- Node, every `test/js/*.test.mjs` run with `node <file>` (local Node 18's `--test` runner crashes deserialising emoji console output; CI uses Node 20): 122 files, 928 pass, 0 fail.
- `bin/rails test`: 684 runs, 2319 assertions, 0 failures, 0 errors, 1 skip.
- `reopencheck.mjs missions.json`: Total problems: 0.
- Validator m01-m08 with `--skip-ink --no-graph`: 0 errors each. `secgen_vm_lab`: 0 errors.

## Browser checks (keyless :3001, headless harness)

Game 2850:
1. Vault Release pressed: events `global_variable_changed:vault_release`, `door_unlocked_by_npc`; server `unlockedRooms` `["lobby","vault"]`.
2. Session quit and reopened with resume: the vault door reads `locked: false` and `enter vault` walks straight in (no PIN).
3. Flag submitted: panel "Door unlocked: archive"; server `["lobby","vault","archive"]`. Before the apply-actions change the archive door still opened its PIN pad in that session.
4. Quiet Switch: `MusicController._currentPlaylistKey === "silence"`, playing buffer 10 s, widget playlist "Silence".

Game 2853 (fresh, with the apply-actions change): noir playing at load; flag submitted → "Door unlocked: archive" → `enter archive` crossed without a PIN; server `["lobby","archive"]` (lobby not re-added, vault untouched); Quiet Switch → silence with the 10 s buffer. Sessions stopped with `session-stop.sh`.

## Missions with `unlock_door` flag rewards

Searched every `scenarios/**/scenario.json.erb` and `*.json` for a `type` of `unlock_door`. Only one:

- `scenarios/secgen_vm_lab/scenario.json.erb` L90-94: `flag_station_desktop` in `flag_room`, second flag `{ "type": "unlock_door", "target_room": "server_room" }`. Under the old code it "unlocked" `flag_room` (already open), so the reward did nothing; the server room was opened only by the RFID keycard the first flag gives. Nothing relied on the old behaviour. Now the second flag also opens `server_room`, as its description says. Not changed.

No m01-m10 or lab mission uses an `unlock_door` flag reward (they use `set_global`, `emit_event`, `give_item`, `unlock_object`).

## Limits

- `unlockDoor` trusts the client that the event fired, as `completeTask` and `setGlobal` mappings do. The server checks only that the scenario gives that NPC a mapping naming the room, so someone at the console could open that door early. It does not reach rooms no mapping names.
- NPC eventMappings only (room NPCs; headless records are checked on the server, but the client registers mappings only for NPCs it loads). Object and inventory-item eventMappings are not run by `npc-manager.js`, so `unlockDoor` there does nothing (the validator doesn't check those).
- Same load gap as every mapping: an NPC outside the start room hears the event only once its room has loaded (README, "Common bugs").
- `unlockDoor` fires `door_unlocked_by_npc`, not `door_unlocked`, matching ink `#unlock_door`. A flag reward fires `door_unlocked`. Objectives handle both.
- A client-only `unlock_door` action (triggerOnInteract, timers, ESD) still isn't saved on the server and doesn't open the door sprite; unchanged and unused by any shipped scenario.
- The `silence` playlist shows in the music widget's list, so a player can pick it. It loops a 10 s buffer (cached, about 1.9 MB decoded).
