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

## Faint draw, mute and preempt: live proof (second pass, commit 294b5736c)

`node tools/playtest/chatter-falloff-proof.mjs <gameId> faint` (cases in `tools/playtest/chatter-faint-cases.mjs`). Same setup as above: keyless server on :3092, fresh test_needs_sims game (6340), headless, `setFPS(20)`, fixed steps on, a 6 second silent clip, the real Web Audio graph and gain node. Waiting for a natural ambient chat turn took more than two minutes with no line, so each case runs the two steps the needs system's chat turn runs, on the live objects: `faintVolume` (through the voice) to decide, then `_pickBark({ faint })` to draw a bag line and `_speak` to hand it to the voice. The bubble layer is told to let the voice through, because no bubble is staged for a hand-drawn line. Only the page changes; no game row or global is written.

| Case | Setup | Result (volumes are what `play` received) |
|---|---|---|
| 1 Faint from a distance | Sanjay, office, player 270 px away (earshot is 160) | Log: `spoken`, `faint: true`, 0.71. `play` 0.707. Gain node 1 at start, then 0.707 |
| 2 Faint through an open door | Amara in the office, player in the kitchen after walking through the door, 248 px, hearing 0.4 | `faint: true`, 0.31. `play` 0.307 (curve 0.77 x 0.4) |
| 3 Person-chat open | Person-chat with Amara open, Tom 247 px away | `faintVolume` 0.771 before, 0 during. The system's `_speak` left no voice log entry and no `play`. A direct `say` was logged `conversation`, not spoken |
| 4 Phone-chat closed | Phone-chat open then closed | Open: `faintVolume` 0, `say` refused with `conversation`. After close: `faintVolume` 0.768 and a line from Tom voiced at 0.77 (`play` 0.768) |
| 5 Faint under a full line | Sanjay faint at 0.707, then Amara a full line within earshot | `preempted` logged for Sanjay, his gain set to 0 (faded over 300 ms), then Amara's `play` at 1.0 and her gain at 1 |
| 6 Faint under a scripted bark | Page-only stand-in made `barkSystem` report a voice playing | Sanjay's faint line 0.177 against 0.709 undamped (0.25 of it) |

No page errors. The stand-in in case 6 was restored straight after. Case 5 shows the full line taking the voice from a faint one; the unit tests hold the lock logic.

## Status

Built, unit-tested, live-proved (above) and committed. The suites ran after this commit; their figures are in the commit that follows.

Not done at this point: grumbles and mutters drawing faint lines, the music-widget toggle, dimmed unheard exchange lines. All three were done in round 1 (below).


## R1 fixes

From `CHATTER_FALLOFF_REVIEW_R1.md` (0 blocking, 3 major, 10 minor). Main merged first (a0f35064f). Tests are in `test/js/npc-chatter-faint.test.mjs` (28 cases) and `test/js/tts-distance-gain.test.mjs` (4). M1, M2, M3 and the m1 to m8 tests were run against the old sources and failed there. Commits: A = bae7e2f1e (majors), B = 2af863cba (minors and docs), C = 13010d7c5 (m10 tests), D = ee0561985 (live proof cases).

| Finding | Fix | Test | Commit |
|---|---|---|---|
| M1 stale phone-chat type makes every minigame a conversation | `conversationOpen` tests the open minigame's `_sceneType`; the sticky type is gone | "R1 M1" | A |
| M2 faint line spent the full cooldown | A faint pick sets `faintQuietUntil` (25 s) and leaves `chatterQuietUntil` alone; faint picks check the faint throttle | "R1 M2", first-case assertion changed | A |
| M3 mutters waited behind a faint line | Mutter entry and `_tickMutterWaits` ask `_speechFreeFor(!full)`, with `ahead` checked first | "R1 M3" | A |
| m1 faint line at full volume | Faint volume capped at `FAINT_MAX` 0.5, at draw and in the follow tick | "R1 m1" | B |
| m2 abort did not abort the load | A token per faint line made in `say`, aborted for all faint lines by `fadeFaint`; the load is raced against the abort; a late clip is stopped unless a newer one started | two "R1 m2" cases | B |
| m3 conversation opens during a load | Re-checked after `play` returns | "R1 m3" | B |
| m4 mute hung off the voice module | `createEngineWorld` has its own inline `conversationOpen` | covered by the live cases | B |
| m5 curve ignored `overhearRadius` | Radius passed through `faintVolume` and `info.radius`; near = r, far = 3r | "R1 m5" | B |
| m6 no faint grumbles or mutters | `_grumble` draws a faint line out of earshot (not for `always` priority mutters), on the faint throttle | "R1 m6" | B |
| m7 no toggle, dead mute | `_muted` reads `barkSystem`; "Background voices" switch in the music widget (`window.backgroundChatter`, saved as `be_bg_chatter`), faint lines only | "R1 m7" | B |
| m8 unheard exchange line looked full | Its bubble is dimmed; it still holds the lock and is not preemptable | "R1 m8" | B |
| m9 NPC_NEEDS_SYSTEM.md stale | "Faint chatter" paragraph added; earshot paragraph reworded | n/a | B |
| m10 test gaps | `setDistanceGain` unit tests, heard grumble through the preempt, stale-type case | `tts-distance-gain.test.mjs`, "R1 m10" | C |
| perf nit | The follow tick skips `setDistanceGain` when the level moved under 0.01 | n/a | B |

Not covered by a direct test: an unheard exchange line waiting behind a faint line (the `_speechFreeFor(!nextHeard)` call is unchanged; the unit cases hold the lock logic).

### Live proof (R1)

Keyless server on :3092 from this worktree, fresh test_needs_sims game 6359, headless, `setFPS(20)`, fixed steps on. `node tools/playtest/chatter-falloff-proof.mjs 6359 faint`, no page errors. Cases 1 to 6 re-run; the faint volume is now capped at 0.5.

- 1 Faint from 270 px: `play` 0.5 (was 0.707). 2 Through the open door: 0.304. 3 Person-chat open: `faintVolume` 0.5 before, 0 during, a direct `say` logged `conversation`. 4 After the phone-chat closes: 0.5, and a heard line voiced at 0.77. 5 Full line over faint: `preempted`, gain 0, then Amara at 1. 6 Under a bark: 0.125 (0.25 of 0.5). Case 6 needs `faintQuietUntil` cleared by the harness, because Sanjay had just spoken faintly (the new throttle at work).
- 7 (new, M1) Phone-chat open: `conversationOpen` true, scene type `phone-chat`. 300 ms after close: false, `faintVolume` 0.30, though `currentConversationMinigameType` is still `phone-chat`. With a stand-in lockpick minigame as the current one: false.
- 8 (new, M2) A faint `_pickBark` took a line, left `chatterQuietUntil` at 0 and set `faintQuietUntil` 25000 ms; a second faint pick gave a picture; a heard pick straight after gave a line and started the 120 s cooldown.

### Handover (end of R1 fix pass)

Done: all 13 findings fixed, tested and live-proved (above). Open: the full suites had not finished when this note was written. Run `bin/test-js` and `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/rails test` from this worktree (the machine was loaded; each takes well over 10 minutes; the tests touched here all pass on their own: `npc-chatter-faint` 28/28, `tts-distance-gain` 4/4, and every `npc-*` and `room-*` test file ran clean after the fixes). Gotchas: background shells were reaped once, so run the suites with `run_in_background` and wait for the notice. The :3092 server was killed (its pid was the listener on that port); game 6359 remains in the dev DB.
