# Chatter falloff (decision D34, option c)

Client audio only. `player_state` sync is unchanged and no spoken lines were added to the engine: every line is still scenario data (NPC chatter pools and ink exchange knots).

## What changed

Before, `NpcChatterVoice.say` worked out a volume (`max(0.35, 1 - d/400)`) and never passed it to `play`. It set `mgr.audio.volume` after the clip had loaded, which Web Audio routing ignores, so distance had no effect. Voiced lines were also dropped outright unless the speaker was in the player's room.

Now:

- `room-hearing.js` holds `chatterVolume(d)` (the curve) and `openDoorHearing` (moved from `npc-office-visuals.js`, which re-exports it, so the desk-phone ring is unchanged). No new imports, so no test harness copy lists change.
- `npc-needs-chatter.js` `_hearing(npcId)` returns 1 in the player's room, 0.4 for the next room through an open door, 0 otherwise. `_volumeFor` is curve times that factor. The volume is worked out when the line starts (not when it was queued) and passed as `mgr.play(npcId, line, { volume })`.
- `tts-manager.js` `play` accepts `{ volume }` and calls `setDistanceGain(volume, true)` before audio starts. A `GainNode` sits between the analyser and `MusicController.voiceGain`, so lip-sync still reads the full signal and the Voice slider still scales on top. With no Web Audio routing it falls back to the element volume. `play` without a volume (scripted barks, dialogue) resets the gain to 1.
- While a line plays, `NpcChatterVoice` re-reads the volume every 250 ms and calls `setDistanceGain` (eased with a 0.1 s time constant). Walking off fades it, leaving the room or shutting the door takes it to 0.

## Constants

| Name | Value | Where |
|---|---|---|
| `CHATTER_NEAR` | 160 px (5 tiles, the earshot radius) | room-hearing.js |
| `CHATTER_FAR` | 480 px (3 x near) | room-hearing.js |
| `CHATTER_FLOOR` | 0.15 | room-hearing.js |
| `THROUGH_DOOR` | 0.4 | room-hearing.js |
| `VOLUME_TICK_MS` | 250 | npc-needs-chatter.js |

Curve: 1.0 up to 160 px, straight line down to 0.15 at 480 px, 0.15 beyond. Through an open door the same curve is multiplied by 0.4 (floor there is 0.06). A shut door, a room that is not joined by a connection, and an unknown room give 0 (`other_room` in the log).

## Not done (left from the plan's option a): superseded, see Handover below; kept for history

- No new faint lines are drawn for ambient chatter or grumbles out of earshot; those still show a picture only. Faint audio therefore covers exchange lines (which already run to the end once started) and any ambient line drawn within earshot that outlasts the player walking off.
- No dimmed bubbles, no `faintChatter` scenario flag, no music-widget toggle, no preemption of a faint line by a full one, no ducking under a scripted bark. The single-line queue and speech lock already cap faint voices at one.
- Lines heard faintly do not count as heard: `playerHears` is unchanged, so `heard_<knot>`, `npc_overheard` and E9 (exchanges start only in earshot) behave as before.
- The through-door case needs the door open. A door that has been opened stays open, so a shut door is only reachable live for a room whose NPCs are loaded some other way.

## Tests

`test/js/npc-chatter-falloff.test.mjs` (5 tests):

1. `chatterVolume`: full inside earshot, straight line, floor, unknown distance, custom radii.
2. The volume is passed to `play` and falls with distance down to the floor (1, 0.575, 0.15).
3. Through an open door the line is voiced at 0.4 of the curve, and distance multiplies with the door.
4. A shut door, a non-adjacent room: not voiced, `other_room`.
5. The gain follows the player mid-line (1, then 0.15 at the far radius, then 0 when the door shuts).

Failing against the old `npc-needs-chatter.js` (checked by restoring it from `HEAD~1` with `git checkout`): tests 2, 3 and 5. Tests 1 and 4 pass on it. Test 1 targets the new pure function, which the old code did not have. Test 4 pins behaviour that did not change (the old code also refused other rooms).

## Live proof

`tools/playtest/chatter-falloff-proof.mjs <gameId>`: keyless server on :3092 from this worktree, game from `tools/playtest/new-game.rb`, headless, `setFPS(20)`, fixed steps on. The page is changed in memory only: `getTTS` returns a short silent clip (the server has no key), and `TTSManager.play` and `setDistanceGain` are wrapped to log what they receive. The real Web Audio graph and gain node are used.

Volume passed to `play` (test_needs_sims, game 6317). Distances are measured when the line starts; NPCs move, so they differ a little from the target.

| Case | Speaker | Distance | Hearing | Volume to `play` |
|---|---|---|---|---|
| Same room, near | Sanjay | 77 px | 1 | 1.000 |
| Same room, mid | Sanjay | 163 px | 1 | 0.993 |
| Same room, far | Sanjay | 269 px | 1 | 0.711 |
| Open kitchen door, player in the office, near | Grace (in the kitchen) | 167 px | 0.4 | 0.392 |
| Open kitchen door, far | Grace | 431 px | 0.4 | 0.112 |
| Shut door (stand-in sprite) | Grace | 251 px | 0 | not played, `other_room` |

The office is too small to reach the 480 px floor in one room, so the floor is covered by the unit tests. The kitchen door was opened by walking through it (`__test.enterRoom`), and Grace walked to the kitchen on her own. The shut-door row used a stand-in shut door sprite pushed onto the kitchen's door list in the page and then removed, because a real door stays open once opened. The gain node's value followed the set value (for example, set to 0.711 then read back 0.711 after the ease). No page errors.

## Handover (second pass, commit 294b5736c)

Built and unit-tested (node tests only, not yet run live or in the full suites):

- Faint ambient draw: `NPCNeedsSystem` ambient chat turn asks `world.faintVolume(speaker)`; above 0 it draws a bag line with `_pickBark({ faint: true })` (starts the cooldown, never waits for the lock), voices it with `info.faint`, `overheard` stays false (no `npc_overheard`, no `_heardUntil`, E9 and `heard_<knot>` unchanged). `_talking()` carries `faint`.
- `NpcChatterVoice.faintVolume(npcId)`: voice, sound on, no conversation, hearing > 0 (same room or open door), distance within `CHATTER_FAR` (480 px). Beyond that a turn is a picture as before.
- Preempt: `_speechFreeFor(faint)`. A faint line holds the lock only until a non-faint asker (ambient bag line the player hears, an exchange line the player hears, a heard desk-call line) takes it; `world.fadeFaint()` fades the voice over 300 ms (`fadeFaint` in the voice, also aborts a faint clip still loading). A full `say` with `info.overheard` calls it too. A faint line ducks to 0.25 under a playing scripted bark (`barkSystem.ttsManagers`).
- Dimmed bubble: `FAINT_ALPHA` 0.6 in npc-world-bubbles.js. Through an open door there is no bubble (other room), as the plan warned.
- Scenario flag `"faintChatter": false` (world adapter and `scripts/validate_npc_needs.rb` boolean check).
- Conversation mute: `conversationOpen()` moved to room-hearing.js (office-room-tone's `chatOpen()` uses it). The voice's `say` is silent while a person-chat or phone-chat is open, checks again in the queue step, and the 250 ms follow tick stops a playing clip. The engine world's `playerHears` returns not overheard and `speak` returns early (no voice, no toast) while it is open, reading it through `window.npcChatterVoice.conversationOpen()` because npc-needs.js has no imports on purpose. No new static import in an engine module that tests copy, so no harness copy list changed.
- Tests: `test/js/npc-chatter-faint.test.mjs` (16), a dimmed-bubble test in `npc-chatter-one-bubble.test.mjs`, `setAlpha` added to the bubble fakes. Against the old sources (npc-needs.js, npc-needs-chatter.js, npc-world-bubbles.js from 3e2a887c3), tests 1, 6 to 10 and 12 to 15 fail; 2 to 5 and 16 pass (they pin unchanged behaviour); 11 tests the new pure helper.
- Docs: `scenarios/test_needs_sims/README.md` D34 section steps 5 to 7.

Still to do:

1. Live proof on :3092 (keyless, fresh game from `tools/playtest/new-game.rb test_needs_sims`): add a `faint` mode to `tools/playtest/chatter-falloff-proof.mjs` showing a faint ambient line from a distance (`npcChatterVoice.log` entries with `faint: true`, play volume), the same through the open kitchen door, silence with a person-chat open beside a chatting NPC, chatter back after a phone call closes, a faint line ducking under a full one.
2. Update the tables above with the live figures.
3. Run `bin/test-js` once, then `bin/rails test` (RBENV_VERSION=2.7.8, BUNDLE_PATH as in the brief), one after the other. Commit the live-proof script and doc first.
4. Not done: grumbles and mutters still draw no faint lines (chat turns only); music-widget "Background chatter" toggle (the plan makes it optional); exchange lines unheard-but-voiced still follow the old rule apart from the mute.
