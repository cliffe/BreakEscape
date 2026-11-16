# NPC and player poses: review R2

Branch `build/ol-poses`, worktree `.claude/worktrees/p-ol-poses`, after main 177c13f6a was merged
(d0f49f0d6). Reviewed:

- a3bf36310: the R1 fixes (npc-poses.js, validator, converter, drift audit, pipeline, tests).
- 5e79b1da8: pose art for ernesto_bautista, hodan_warsame and male_office_worker_v2 (test only;
  checked only for changes outside the pose frames).
- bf6941646: sprite-breath test rig with `settleMs: 0`.
- 3dd03f41c: player poses (`systems/player-poses.js`) and its hooks in consumables.js,
  interactions.js, minigame-manager.js, core/player.js and core/game.js.

Plus a design for a phone lead-in before phone-style minigames open.

Runs: `node --test` on npc-poses (21 pass), player-poses (9), validator-npc-poses (3) and
sprite-breath (7); `python3 tools/test_pixellab_pipeline.py` (17, OK). No server was started.

R2: 0/1/3

## R1 fixes: confirmed

| R1 | Fix in a3bf36310 | Test |
| --- | --- | --- |
| M1 per-tick idle restarts | `b.lastAnimationKey = this._idleKey(id, b)` while a pose holds, so the behaviour's own `playAnimation('idle')` is a no-op; a direction change still replays the idle in `update` and the pose comes back in the same frame's `postupdate`, so nothing renders between | npc-poses.test.mjs:242 (100 ticks, 0 plays) |
| M2 use while turned away | `facesObject` (one compass step), `wantedPose({ facing })`; social drink at the cooler | :30, :256 |
| M3 drift audit pose names | `split_frame_name` from the right | pipeline tests (split and adopt) |
| m1 machine matching | `MACHINE_PRESETS` first, `NOT_MACHINE_RE` (table, cup, mug) | :69 |
| m2 microwave | `BRIEF_USE_NEEDS` | :54 |
| m3 lookup per frame | `rec.obj` cached per job | :266 |
| m4 lead during chat | `_useRec(..., paused)` moves `at` forward | :278 |
| m5 flash before sitting | `pending` and `SETTLE_MS` | :297 |
| m6 officeVisuals | `off` empties the pass | :314 |
| m7 validator | `check_poses` (three warnings) | validator-npc-poses.test.mjs |
| m8 `--pose-from name=` | removes the stored pose and folder | PoseFromTest |
| m9 pose feet | `pose_feet_shifts`, pose-only sizes fall back to the pose frames' own feet | PoseFeetLineTest |

`SETTLE_MS` (150 ms of scene time): seating decides a seat in its own `postupdate` from
`needsStop` (seating.js:1721), which reads the same `using` phase the pose pass reads, so a seat
appears within a frame or two of the use starting. 150 ms covers that with margin at 20 fps and
above. A pose that drops for one frame (the NPC turned away and back) waits another 150 ms, which
reads as a short idle, not a flicker.

`pose_feet_shifts`: it runs only when `frame_offsets` pads (`padded`), that is when frames are not
already canvas-sized. Every one of the 128 characters in tools/pixellab_characters.json is 60x60,
so it always runs today; an 80x80 legacy character would skip it, which matches the converter's
"canvas-sized frames are pasted unchanged" rule. The idle reference is frame 0 of breathing-idle,
the comparison is bbox bottom against bbox bottom at equal frame sizes, and shifts above 4 px are
ignored. Sound for standing poses.

Art commit 5e79b1da8: the three atlas JSONs are unchanged. Comparing every frame rectangle of the
old and new PNGs, and the PNGs with the pose rectangles blanked: ernesto_bautista 9 frames changed,
hodan_warsame 6, male_office_worker_v2 3, all of them `pose_*`; everything outside the pose frames
is byte-identical. tools/pixellab_characters.json changed only the two `imported` dates.

bf6941646: the sprite-breath rig sets `settleMs: 0` so the breath trace test sees the pose on its
first pass. Correct; the settle itself is tested in npc-poses.test.mjs:297.

## Machine matching across the scenarios

Every object with an `affordance` (and, in `"officePresets": true` scenarios, every declared
object a preset covers) in all scenarios, run through the real `isMachine`:

| Type (officeType) | Preset | Satisfies | Machine | Pose a needs NPC gets |
| --- | --- | --- | --- | --- |
| coffee_station, coffee_station1 | coffee or none | caffeine | yes | use lead, then drink |
| kettle1, hot_water_boiler (kettle) | kettle | caffeine | yes | use lead, then drink |
| hot_water_boiler1 | none | thirst | yes | use lead, then drink |
| water_cooler, water_cooler1 | cooler or none | thirst, social | yes | use lead, then drink |
| microwave, microwave1 | microwave | hunger | yes | brief use |
| photocopier1 | copier | none | yes | use |
| qdc_fridge1 | fridge | hunger | no | none |
| office-misc-cup | none | caffeine | no | drink at once |
| cake1, mugs_tray1, bin1, staff_lockers, leather_sofa1 | various | various | no | none (or drink for a drink need) |
| pc, pc3 | desk_pc or none | work, social_media | no | none (seated) |
| phone1 (desk_phone) | desk_phone | none | no | phone through `s.call` |

No false positive. Two arguable negatives: the fridge (an NPC opening it for food) and the staff
lockers (upkeep) get no `use`. Both are design choices the preset list states; an author who wants
the reach sets `affordance.machine: true`. Not counted. The m01 to m10 missions declare no
affordances, so NPC poses do not run there; the player poses do, whenever the player's atlas has
pose frames.

## Player poses: what holds

- Client only: player-poses.js writes nothing to `player_state`, sends no request and emits no
  event; `log` is an in-memory ring of 100. Confirmed by reading every call in the module.
- The use pose never delays an interaction: the hook (interactions.js:846) is synchronous, inside
  `try`, and only calls `anims.play`; the interaction carries on in the same call.
- Input, camera and collisions: the player's body is set by `setSize(18, 10)` and
  `setOffset(31, 66)` and the pose frames share the 80x80 cell, so the body does not move; the
  breath draws a separate image and never moves the sprite, so the camera does not bob. No input is
  read or blocked.
- Timers: none. Expiry is checked in `postupdate` against `scene.time.now`; repeated interactions
  only overwrite `cur`, so a burst of E presses leaves nothing behind.
- Clearing: walking, a turn, any other animation or a blocker ends the pose on the next
  `postupdate` (player-poses.js:158). KO and fights block. A sprite swap removes the `pose_*`
  animations (core/player.js:173) and plays the idle, so the next pass drops the pose. Seated: the
  seated player is drawn by seating's own sprite (seating.js:494) with the player hidden (497), so
  the breath crop cannot clash with seating's the way it did for NPCs. Scene shutdown: the listener
  stays on `scene.events`, but a restart of the same scene reuses the instance (173) and a new game
  makes a new one, so nothing doubles.
- The use pose follows the facing turn: `useObjectInReach` (core/game.js) and the E key
  (interactions.js:2258) turn the player before `handleObjectInteraction`.

## Findings

### M1. The phone pose is refused when the player is still moving as the phone opens, and then shows only after the call

player-poses.js:134-149 with `blocked()` at :90-91; minigame-manager.js:171.

`startMinigame` calls `window.cancelClickToMove()` (core/player.js:961-970) before the start hook,
but that clears only the path state: `player.body.velocity` and `player.isMoving` still hold the
walk until the next `update`. `onMinigameStart` then calls `show('phone', 0, { hold: true })`,
`blocked()` returns `'walking'`, and nothing ever tries again. `phoneScene` is still set, so
`onMinigameEnd` falls through to `show('phone', PHONE_CLOSE_MS)` (:148).

Failure: the player click-walks across the office and taps the phone in the inventory, or answers
a ringing call mid-walk, or an event-mapping call opens while they walk. The phone chat opens, the
next frame's player update stops the walk and plays the idle, and the player stands with empty
hands for the whole call. When it closes the phone pose appears for 600 ms, the reverse of what
was asked. Opening the phone on the move is common, so the feature misses in a large share of
real opens.

Fix: keep the wish while the phone-style minigame is open. In `onMinigameStart`, set
`this.phoneWanted = true` and `this.phoneShown = this.show(...)`. In `update()`, before the early
`return` for `!cur`: when `this.phoneWanted && !this.cur && !this.blocked()`, call
`this.phoneShown = this.show('phone', 0, { hold: true }) || this.phoneShown`. In `onMinigameEnd`,
clear `phoneWanted`, and play the 600 ms close pose only when `phoneShown` (the pose showed during
this minigame). Tests: open with `velocity.x = 80`, assert no pose; set velocity 0, `update()`,
assert `pose_phone_south` held; end, assert 600 ms then idle; and a minigame during which the pose
never showed (seated throughout) ends with no phone pose.

### m1. The use pose fires for NPCs, chairs and swivel chairs

interactions.js:846, before the branches at :852 (`seating.trySit`), :855 (swivel chair), :870
(NPC).

`use()` excludes only inventory items. Talking to an NPC plays the reach-out `use` pose at the
person; under a person-chat it is mostly hidden, but when the conversation does not open (the
social lockout at :884 returns with no chat, or `npc.callId` starts a pretext flow) the player
visibly reaches at the colleague for 0.5 s. A hostile NPC and a swivel chair get it for a frame
before the punch replaces it; a chair gets it before the sit. Container items opened from inside
the container minigame (container-minigame.js:1526, :1646, :1707) pass temporary sprites that are
not in the inventory, so they trigger it too, under the open container. The owner's trigger is a
world object interaction.

Fix: in `use(sprite)`, return false for `sprite._isNPC`, `sprite.isSwivelChair`,
`window.seating?.isSeat?.(sprite)` and `String(sprite.objectId || '').startsWith('temp_')` (or when
a minigame is open: `window.MinigameFramework?.currentMinigame`). Test each exclusion.

### m2. A drink during a phone chat ends the held phone pose for good

player-poses.js:124 (`drink()` has no hold check), :165 (`release` on timeout).

`use()` refuses while `cur.hold`, `drink()` does not. Drinking a coffee from the inventory while
the phone chat is open replaces the held phone with the drink pose; after `DRINK_MS` it times out
to the idle while the phone is still open, and the phone pose does not come back until the close
pose.

Fix: with M1's `phoneWanted`, nothing else is needed: once the drink ends, `update()` re-shows the
held phone. Without M1, `release()` should re-show `phone` with `hold` while `this.phoneScene` is
set. Test: phone open, drink, advance `DRINK_MS`, assert `pose_phone_*` again.

### m3. A short pose is not dropped when another minigame or dialog opens

player-poses.js:135 (`onMinigameStart` returns early for non-phone scenes).

A `use` or `drink` pose keeps playing under any non-phone minigame until it times out (0.5 s or
1.6 s). Most of them disable game input and cover much of the canvas, so the cost is small, but a
framed minigame (the scanners, the notes panel) leaves the figure visible and still breathing
behind it, and the brief's rule was that a pose clears when a dialog opens.

Fix: in `onMinigameStart`, when the scene is not phone-style and `cur` is not a held phone, call
`release()`. Test: `drink()`, then `onMinigameStart('pin', {}, {})`, assert the idle and
`cur === null`.

### Test gaps (no separate count)

- No test drives `updatePlayerSprite` with a pose held and asserts the old `pose_*` animations are
  gone and the next pass drops the pose (core/player.js:173).
- No test for M1's walking-at-open case, m1's exclusions or m3.

## Phone lead-in design

The owner asked for the phone pose a moment before the phone minigame opens and a moment after it
closes. The close side exists (`PHONE_CLOSE_MS`, 600 ms). For the open side, `startMinigame` must
stay synchronous: its callers keep the returned instance (npc-manager.js:1051 stores it in
`_scriptedCall`, phone-ringer-dom.js:303 returns `started` to the ringer, which reads it at once).
So the wait belongs at the call sites, and only where the player started the open.

### Every place a phone-style minigame opens

| # | Call site | Who starts it | Return value used | Lead-in |
| --- | --- | --- | --- | --- |
| 1 | interactions.js:1807 `handleObjectInteraction`, phone object with `npcIds` (the inventory phone and world desk phones) | player | no (`return` after it) | wait 300 ms |
| 2 | interactions.js:1830, same branch after `PhoneMessageConverter` (already inside an `import().then`) | player | no | wait 300 ms |
| 3 | npc-barks.js:983 and :993 `openPhoneChat` (click on a text notification; already `async`) | player | no | wait 300 ms |
| 4 | phone-ringer.js:604 `answer` then :613 `beginOpen`, which already waits `SCRIPTED_CALL_START_MS` (500 ms) before `finishOpen` calls the adapter's `openCall` (phone-ringer-dom.js:303) | player (answer button or banner), or the forced-call auto-answer (:831) | yes, inside the ringer | pose at `beginOpen`, no added wait |
| 5 | phone-ringer.js:1028 `dial` via phone-ringer-dom.js:574 `placeCall` (outgoing call from the open thread) | player, from inside the open phone | yes | none: the phone pose is already held, and the end-then-start swap keeps it |
| 6 | npc-manager.js:1051 `_openScriptedConversation`, event-mapping phone chats (`_queueScriptedPhoneCall`, 1012) and event video calls (1849), both after a 500 ms `startDelayMs` timer | the story | yes | pose at the start of the existing 500 ms, no added wait |
| 7 | npc-manager.js:2547 timed conversations (phone or video), `startDelayMs: 0`, and anything opened by `_pumpScriptedCallQueue` | the story (opening cutscenes, queued beats) | yes | none: opens at once as today |
| 8 | phone-ringer-dom.js:405 `reopen` (the phone the call displaced) | the ringer, after a call | yes | none: the call's close pose is still showing |
| 9 | phone-chat-minigame.js:2124 back from the notepad; rfid-minigame.js:822 and container-minigame.js:2122 back to a conversation after a tag action | a return | no | none: a return is not a fresh open |
| 10 | pretext-prep-minigame.js:353, :367 via pretext-card.js `callLaunch` | player, from inside the prep minigame | no | none: a swap between panels; the pose starts as the call opens |

Video calls are always story-started (rows 6 and 7). A person-chat fills the minigame container,
so during the call itself the canvas is mostly hidden; the lead-in in row 6 and the close pose are
the parts the player sees.

### Recommendation

Add one helper to `systems/player-poses.js` and call it from rows 1 to 4 and 6. Nothing changes in
minigame-manager.js, and a player atlas without pose frames keeps today's synchronous behaviour
exactly, so existing tests and test-bridge flows see no difference.

1. `export const PHONE_LEAD_MS = 300;` and a method
   `PlayerPoses.openWithPhoneLead(open)`:
   - if `this.leadPending`, return true and do nothing (a second click during the lead is
     dropped, so the phone never opens twice);
   - if `!this.show('phone', PHONE_LEAD_MS + 500)` (blocked, no frames, or M1's walking case),
     call `open()` now and return its result;
   - else set `leadPending`, and `setTimeout(() => { leadPending = false; if (guard()) open(); },
     PHONE_LEAD_MS)` where `guard()` is: `window.player` still active, no
     `MinigameFramework.currentMinigame` (a call or cutscene that opened during the lead wins; the
     player can tap again), `!window.playerIsKnockedOut?.()`, and the scene not shut down. Return
     true.
   The pose is a timed one (not `hold`), so a lead whose open is dropped ends on its own;
   `onMinigameStart` turns it into the held pose when the minigame does open.
2. `PlayerPoses.phoneLead()`: `this.show('phone', SCRIPTED_CALL_START_MS + 500)` with no
   callback, for the places that already wait.
3. Call sites:
   - interactions.js `handleObjectInteraction`, phone branch (rows 1 and 2): wrap each
     `window.MinigameFramework.startMinigame('phone-chat', ...)` as
     `const go = () => window.MinigameFramework.startMinigame('phone-chat', null, {...});` then
     `window.playerPoses?.openWithPhoneLead ? window.playerPoses.openWithPhoneLead(go) : go();`.
   - npc-barks.js `openPhoneChat` (row 3): the same wrap around the call at :983 (the fallback at
     :993 only runs when the framework is missing, so it can stay as it is). Keep
     `inventoryBlockedByForcedMinigame()` before the wrap, as at :603.
   - phone-ringer-dom.js: add an adapter hook the ringer calls from `beginOpen` (phone-ringer.js
     :613), for example `call('answering', o)`, implemented in the DOM adapter as
     `win.playerPoses?.phoneLead?.()`. The existing 500 ms becomes the lead-in; `openCall` and its
     synchronous return are untouched. A call that is then held or given up (`cannotOpenNow` in
     `finishOpen`) leaves a timed pose that ends by itself.
   - npc-manager.js `_queueScriptedConversation`, the `startDelayMs > 0` branch (just before its
     `setTimeout`, after its `endMinigame`): when `isPhoneScene(conv.sceneType, conv.params?.())`
     would be true, call `window.playerPoses?.phoneLead?.()`. Build the params once and reuse them,
     since `params()` is a function (or test `conv.sceneType === 'phone-chat' ||
     conv.videoCall`-style data the caller already has). Again no added wait.
4. Not at rows 5, 7, 8, 9 and 10. Row 7 is the case the owner's words do not cover: an opening
   cutscene or queued story beat that the player did not start must not be held back, and it is
   not delayed today.

Does the player answer first? Yes for a ringing call (row 4): the ring is the cue, the answer is
the player's act, and the lead-in fills the 500 ms that already sits between the answer and the
open, so no call is delayed. A forced call that answers itself after `AUTO_ANSWER_MS` goes through
the same `beginOpen`, so the player raises the phone as it connects, which reads correctly.

Why not a wrapper inside `startMinigame`, or an awaited `startMinigameAsync`: the instance is
needed synchronously at rows 4 to 8, so an awaited variant could only serve rows 1 to 3, and those
are exactly where a small call-site wrap already works without a second entry point to keep in step
with the framework's busy guards.

Tests to add with it: with frames, `openWithPhoneLead` shows the pose at once and calls `open` only
after `PHONE_LEAD_MS`; a second call during the lead does not open twice; a minigame opened during
the lead makes it drop the open; without frames `open` runs synchronously; the ringer's `beginOpen`
calls the adapter hook once; `_queueScriptedConversation` with `startDelayMs` 500 and a phone scene
calls `phoneLead`, and with `startDelayMs` 0 it does not. Test-bridge note: a scripted playtest that
taps the phone with a pose-frame player atlas must wait for the minigame rather than assert it
synchronously (or set `PHONE_LEAD_MS` to 0 through the instance in that harness).

M1 should land first: the lead-in would otherwise inherit the walking refusal at open.
