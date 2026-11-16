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
| `FAINT_MAX` | 0.5 (a background voice is the curve times this; R2 m1, was a cap) | npc-needs-chatter.js |
| `FAINT_COOLDOWN_MS` | 25000 (a speaker's faint-line throttle, needs clock) | npc-needs.js |
| `FADE_MS` | 300 (a faint line given way to fades over this) | npc-needs-chatter.js |
| `BARK_DUCK` | 0.25 (a faint line under a scripted bark) | npc-needs-chatter.js |
| `FAINT_ALPHA` | 0.6 (dimmed bubble opacity) | npc-world-bubbles.js |

Curve: 1.0 up to 160 px, straight line down to 0.15 at 480 px, 0.15 beyond. Through an open door the same curve is multiplied by 0.4 (floor there is 0.06). A shut door, a room that is not joined by a connection, and an unknown room give 0 (`other_room` in the log).

## Not done (left from the plan's option a): history only

This section describes the first pass. Everything in it was done in the second pass or round 1 (see Status and R1 fixes); read it as a record, not as the current state.

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

From `CHATTER_FALLOFF_REVIEW_R1.md` (0 blocking, 3 major, 10 minor). Main merged first (a0f35064f). Tests are in `test/js/npc-chatter-faint.test.mjs` (28 cases) and `test/js/tts-distance-gain.test.mjs` (4). M1, M2, M3 and the m1, m2, m5, m6, m7 and m8 tests failed against the old sources; the R1 m3 test did not (it passed on them, fixed in R2 m4). Commits: A = bae7e2f1e (majors), B = 2af863cba (minors and docs), C = 13010d7c5 (m10 tests), D = ee0561985 (live proof cases).

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

Done: all 13 findings fixed, tested and live-proved (above). Open: nothing. Suites on f90d108e2: `bin/test-js` 719 files passed, 0 failed; `bin/rails test` 3003 runs, 48495 assertions, 0 failures, 0 errors, 3 skips. Gotchas: background shells were reaped once, so run the suites with `run_in_background` and wait for the notice. The :3092 server was killed (its pid was the listener on that port); game 6359 remains in the dev DB.


## R2 fixes

From `CHATTER_FALLOFF_REVIEW_R2.md` (0 blocking, 1 major, 9 minor). Main merged first (already up to date). Commits: A = b893c67c5 (code and tests), B = 7c7551139 (switch look, live proof cases). Unit tests: `test/js/npc-chatter-faint.test.mjs`, now 37 cases.

| Finding | Fix | Test |
|---|---|---|
| M1 switch and level miss unheard exchange lines | One helper, `_backgroundLevel(npcId)`: 0 with the switch off, else curve x door x `FAINT_MAX`. `faintVolume`, `say` and the follow tick all use it. An exchange line voiced out of earshot is passed `{ unheard: true }` (not `faint`, so it keeps the lock and no full line cuts it); `say` drops it when the switch is off (`background_off` in the log, bubble unchanged) and the follow tick stops a line already playing when the switch goes off | three "R2 M1" cases, and the R1 m8 test (`info.unheard`) |
| m1 plateau | Scale instead of clamp: the curve x 0.5 (0.5 at the earshot edge, 0.075 at 3r). A dark room beside the speaker is still 0.5. Through a door it is 0.4 x curve x 0.5 | updated figures, and "louder nearer, inside the old plateau" |
| m2 faint grumbles and mutters not dimmed | `s.saying.faint` is stored and `_talking` returns it | "R2 m2" |
| m3 switch | Row label dropped; one name, "Background voices", in the button, tooltip, comments and tests. `.mw-toggle-btn[aria-pressed]` styles: on has a filled face and accent border, off is dim with a dashed 2px border; on the themed skin on is the accent colour and off is the dimmed filter. 2px borders, no radius, the widget's pixel font, `white-space: nowrap`. Screenshots below | live case 9 clicks the real button |
| m4 weak tests | The R1 m3 test now uses a 2 s clip and must end before the first 250 ms follow tick; the R1 m10 test now runs the unheard grumble half. The R1 table sentence above is corrected | edited tests |
| m5 two untested fixes | "R2 m5" mutter wait queue case; "R2 m5" real-adapter case with a stale `phone-chat` type and a lockpick open. Both were checked by mutation: reverting `_tickMutterWaits` to `_speechFree()` fails the first, making the inline `conversationOpen` read `currentConversationMinigameType` again fails the second. The inline copy now has a comment naming `room-hearing.js` | as named |
| m6 docs | README step 5 figures, `NPC_NEEDS_SYSTEM.md`, constants table, "Not done" marked as history | n/a |
| m7 token leak | The step's outer `.catch` calls `dropTok()` | "R2 m7" |
| m8 paused conversation | Decision: a minigame whose `params.returnTo.sceneType` is a chat counts as a conversation, in `room-hearing.js` and the inline copy, so chatter stays muted under a cloner or lockpick opened from a conversation | "R2 m8", real-adapter case, live case 10 |
| m9 late blip | The late-load branch calls `setDistanceGain(0, true)` before `stop()` | "R2 m9" |

### Live proof (R2)

Keyless server on :3092 from this worktree, fresh test_needs_sims game 6383, headless, `setFPS(20)`, fixed steps on; `PLAYTEST_PORT` not used by the script (it reads `PORT`). `PORT=3092 node tools/playtest/chatter-falloff-proof.mjs 6383 faint`, no page errors. The old cases still hold at the scaled level: 1 faint from 204 px `play` 0.441 (curve 0.88 x 0.5); 2 through the open door 0.152; 3 and 4 the conversation mute and the heard line at 0.77 after the call; 5 full over faint (`preempted`, then Amara at 1); 6 under a bark 0.089; 7 and 8 unchanged.

- 9a The real "Background voices" button clicked off (`window.backgroundChatter` false, `aria-pressed` false): an unheard exchange line from Sanjay is not played, log `background_off`. 9b Clicked on: the same line plays at 0.356.
- 10 A person-chat with Amara, marked suspended, with a `notes` minigame opened over it (`returnTo` person-chat): `conversationOpen` true, `faintVolume` 0, `playerHears` false, and a direct `say` is logged `conversation`. After the child closes, `conversationOpen` is false again.

Screenshots (headless, the music widget at 300 px): `chatter-switch-on.png` and `chatter-switch-off.png` (themed skin), `chatter-switch-plain-on.png` and `chatter-switch-plain-off.png` (no theme), all under the session scratchpad. The text sits on one line in all four (themed button 256 px wide with scrollWidth equal to clientWidth, plain 276 px).


## R3 fixes

From `CHATTER_FALLOFF_REVIEW_R3.md` (0 blocking, 2 major, 6 minor). Main merged first, and again before the final suites (Train 111, 11fae1a6d). Code and tests are commit cc4e2490a; unit tests are in `test/js/npc-chatter-faint.test.mjs` (now 44 cases).

| Finding | Fix | Test |
|---|---|---|
| M1 priority mutters skip the background level | `_speak` sets `unheard` once, from `!overheard && !faint && !call`, so every line takes one path (the exchange call site no longer passes it). `_showSaying` marks a priority mutter `secret`. In `say`, a `secret` line that is not overheard plays no audio at all (log reason `secret_unheard`): no faint version, no through-door version, switch on or off. Its bubble and the speech lock are those of any unheard bubble. An overheard one is voiced in full and credited, as on main | three "R3 M1" cases: `unheard` derivation, a real `login_aloud` mutter in and out of earshot, and the four silent placements plus the heard line |
| M2 switch looks disabled | Same button face as SKIP, PAUSE and VISUALISER at full strength in both states: no filter, no opacity, solid 2px border. An 8px CSS marker (`::before`, filled on, hollow off, after `dusting.css:94-95`). On: accent text and border. Off: the normal button text colour (`#ccc` plain, `--ui-button-text` themed). The 11px override is gone | screenshots below |
| m1 late blip | `TTSManager.play` takes `cancelled`; it is asked after the metadata wait and before `setDistanceGain` and `audio.play()`, and a true answer stops and returns null. The chatter voice passes `() => tok.abort` for faint lines. The mute-then-stop in `say` stays as a backstop for a clip already playing | the real `play` extracted onto a stub audio element (never calls `audio.play()`); and the voice passes a live `cancelled` |
| m2 type and announcement | Font size and letter spacing overrides dropped (12px, 0.5px like its neighbours). The button text is the fixed "Background voices"; `aria-pressed` is the one state signal for a screen reader, the marker and colour for the eye | live check below |
| m3 two copies | `conversationOpen` is now one export of `npc-needs.js` (still import-free). `createEngineWorld` uses it, `npc-needs-chatter.js` and `office-room-tone.js` import it, and the copy in `room-hearing.js` is removed. No harness copy list changed: the lighting harnesses copy `room-hearing.js`, which no longer carries it | one table of ten minigame shapes run through the shared function, the real adapter and the voice |
| m4 faintChatter: false | `_faintOff()` reads the scenario flag beside the player's switch, so every background voice (drawn faint, unheard exchange) obeys both | "R3 m4" |
| m5 room tone under a child minigame | Kept, on purpose. A cloner or lockpick opened from a conversation leaves the chat suspended under it, and the conversation still counts as open; the office bed and typing loop duck for it as for the chat itself, which is what the player expects while a dialogue is on screen. `NPC_NEEDS_SYSTEM.md` now says so | covered by the shared-table case |
| m6 Audio page | Screenshot taken, below | n/a |

Not changed: the 250 ms window in which a clip that was already playing when its abort landed is heard until the follow tick.

### Live proof (R3)

Keyless server on :3092 from this worktree (killed afterwards), fresh test_needs_sims game 6401, headless, `setFPS(20)` with fixed steps on. `PORT=3092 PLAYTEST_PORT=3092 node tools/playtest/chatter-falloff-proof.mjs 6401 faint`, no page errors. Cases 1 to 10 unchanged from R2 (1 faint 0.441, 2 through the door 0.152, 3 and 4 the conversation mute and 0.77 after the call, 5 full over faint, 6 under a bark 0.089, 9a `background_off`, 9b 0.355, 10 child minigame keeps the mute).

- 11a (new) `login_aloud` from Amara in the office, player in the kitchen through the open door (hearing 0.4): the mutter is shown, `plays` is empty, log `secret_unheard`, no `npc_overheard`.
- 11b (new) The same mutter with the player 52 px away in the office: played at volume 1, and `npc_overheard:amara` fires.

The `login_aloud` pool is set on the page copy only (test_needs_sims has none); no game row or scenario file was touched.

Screenshots (headless, themed skin, in the session scratchpad): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/chatter-switch-on.png`, `chatter-switch-off.png`, `chatter-audio-page.png` (game menu Audio page, switch on), plus `chatter-audio-page-off.png`, `chatter-switch-plain-on.png` and `chatter-switch-plain-off.png`.
