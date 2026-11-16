# NPC and player poses: review R3

Branch `build/ol-poses`, worktree `.claude/worktrees/p-ol-poses`. Reviewed: commit 624b6e305,
which fixes the R2 findings (0/1/3) and builds the phone lead-in. Files: systems/player-poses.js,
systems/interactions.js, systems/npc-barks.js, systems/npc-manager.js,
minigames/phone-chat/phone-ringer.js, minigames/phone-chat/phone-ringer-dom.js,
test/js/player-poses.test.mjs, and the two docs.

Runs: `node --test test/js/player-poses.test.mjs` (22 pass). No server was started. The live
evidence is the builder's run (lead-live.json and strip.png, test_phone_calls, the player swapped
to male_office_worker_v2, headless, 20 fps): tap while standing still, pose at 50 ms and phone open
at 334 ms; tap mid-walk, open at 34 ms with the pose held once the walk stopped; answering a
ringing call, pose at 12 ms and open at 534 ms. In the strip the B and C rows show the player
behind a keypad overlay, so only the JSON confirms the pose there; the A row shows it clearly.

R3: 0/1/4

## What the player poses are

`PlayerPoses` (systems/player-poses.js) plays short pose animations on the player sprite when the
player's atlas has `pose_*` frames: `drink` from a drink in the inventory, `use` at a world object,
and `phone` while a phone-style minigame (phone chat, its calls, a person-chat video call) is open
and for `PHONE_CLOSE_MS` (600 ms) after. It is client only and runs in the scene's `postupdate`.
The lead-in adds `PHONE_LEAD_MS` (300 ms): when the player starts a phone open, the pose shows
first and the minigame opens 300 ms later (`openWithPhoneLead`). Where a wait already exists (the
ringer's 500 ms between answer and open, and scripted calls with `startDelayMs > 0`) the pose
fills that wait (`phoneLead`) and nothing is added.

## R2 fixes: confirmed

| R2 | Fix | Test |
| --- | --- | --- |
| M1 phone refused while walking at open | `phoneWanted` set in `onMinigameStart` (player-poses.js:184); `update()` calls `_wantPhone()` when no pose is up (:206) and after a timed pose ends (:219); the close pose shows only when `phoneShown` (:200) | test:173 (open at `velocity.x = 80`, no pose; stop, held; end, 600 ms, idle); test:192 (seated throughout, no close pose). Live: B row. |
| m1 use pose on NPCs, chairs, containers | `use()` refuses `_isNPC`, `isSwivelChair`, `seating.isSeat`, `temp_` object ids and any open minigame (:139-142) | test:205, one assertion per exclusion |
| m2 drink ends the held phone | `_wantPhone()` right after `release()` in the same pass (:218-219), so no idle frame shows between | test:228 |
| m3 short pose under another minigame | non-phone `onMinigameStart` releases a timed pose, keeps a held phone (:178-181) | test:241 |

All four are real. `phoneWanted` is cleared only in `onMinigameEnd` (:192), which the framework
calls for the phone instance on close and on displacement (minigame-manager.js:222), so it cannot
stay set after the phone has gone.

## Lead-in against its design

| Design row | Site | State |
| --- | --- | --- |
| 1, 2 phone object (inventory phone, desk phones) | interactions.js:1815, :1837 | wired, `go` closure, fallback to `go()` when the module is not loaded yet |
| 3 text notification click | npc-barks.js:985 | wired; the dynamic-import fallback at :993 left alone as designed; the forced-minigame check stays first (:603) |
| 4 ringer answer | phone-ringer.js:619 `call('answering', o)` in `beginOpen`, adapter phone-ringer-dom.js:256 | wired; `call` (phone-ringer.js:117) skips a missing method and catches a throw, so test adapters without `answering` are unaffected |
| 6 scripted calls with a start delay | npc-manager.js:975-980 | wired for `phone-chat` and video person-chats, after the `endMinigame` and before the timer |
| 5, 7, 8, 9, 10 | dial, `startDelayMs: 0`, queue pump, `reopen`, returns, pretext swap | untouched, as designed |

`startMinigame` is unchanged and still returns its instance synchronously; every caller that uses
the return value (rows 4 to 8) is outside the wrapped sites.

No pose frames: `show()` returns false (`has()` fails), so `openWithPhoneLead` calls `open()` in
the same call stack and never touches `leadPending` or the timer (:155); `phoneLead()` returns
false with no timer; `_wantPhone()` adds no timer. The only timer in the module is the one at :157,
reached only after a successful `show`. Before `installPlayerPoses` has run (it is a dynamic
import, core/game.js:1934) the call sites fall back to `go()`. Old timing holds exactly.

`conv.params()` at npc-manager.js:977: the three closures that reach the `startDelayMs > 0` branch
(npc-manager.js:1791, :1860, :1913) build plain object literals from captured values,
`window.gameScenario` and the NPC record, with no writes, calls or events. The extra call is free of
side effects. The open still builds its own params later (:1057), so a queued call still reads the
NPC's story as it is at open. Row 7's closure (:2581) is never reached here (`startDelayMs: 0`).

Races during the 300 ms lead, standing with pose frames:

- Double tap: the second call returns at :154; one open. A different second open is lost (m4).
- A minigame opened during the lead (an E-press on a lock, an auto-challenge): the timer sees
  `currentMinigame` and drops the open (:161); the timed pose ends by itself, and a non-phone
  `onMinigameStart` releases it at once. As designed.
- A ringer answer or scripted call during the lead: the lead opens at 300 ms and the ringer's or
  scripted call's 500 ms open then displaces it or defers behind it, the same order as today's
  instant open.
- KO: dropped at :162, and `startMinigame` refuses during a KO anyway; the pose drops in `update`
  (blocked).
- Room change: nothing in a room transition touches the pose or the timer; the open goes ahead. A
  click to walk during the lead ends the pose (walking) and the open then stops the walk
  (`cancelClickToMove`), which is new only in that today there is no 300 ms window to click in. Not
  counted.
- Scene shutdown: `dead` is set by the `once('shutdown')` listener (:232) and checked at :160; but
  see m2.
- A minigame already open at the tap: see M1.

## Findings

### M1. A tap while a minigame is already open is dropped, and a notification click during a phone chat is lost

player-poses.js:155-163 (the guard at :161); npc-barks.js:600-605 and :985;
minigame-manager.js:61 and :193.

`openWithPhoneLead` drops the open whenever any minigame is current when the timer fires. It does
not tell a minigame that opened during the lead from one that was already open at the tap. Barks
stay on top of an open phone chat (`holdsBarks()` returns false for `phone-chat`, so a text from
another contact is clickable there), and the click handler calls `openPhoneChat` and then removes
the notification (`_removeBark`). Today `startMinigame` ends the open phone chat and opens the
other contact's thread (minigame-manager.js:61).

Failure, with a player atlas that has pose frames and the player standing: the phone chat with
contact A is open; a text from contact B arrives as a notification; the player clicks it.
`show('phone', 800)` succeeds (nothing blocks it during a phone chat), the timer is set and the
notification is removed; 300 ms later the guard finds the phone chat still open and drops the open.
B's thread never opens and the notification has gone, so the player has to find B in the contact
list. The held phone pose is also swapped for an 800 ms timed one, which `_wantPhone` then restores.
A seated player or an atlas without pose frames still gets today's behaviour, so the same click
works or fails depending on the avatar. The same drop hits any `openWithPhoneLead` site tapped
while another minigame is open, for example the inventory phone over a minigame that leaves the
inventory clickable. The test at test:295 sets `currentMinigame` after the tap only, so it misses
this.

Fix: skip the lead when a minigame is already open at the tap. At the top of `openWithPhoneLead`,
after the `leadPending` check: `if (win().MinigameFramework?.currentMinigame) return open();`. A
phone-to-phone swap then keeps the held pose through the end and start hooks, as at row 5. (An
alternative: record `const before = w.MinigameFramework?.currentMinigame` and drop only when the
current one differs from `before`; it adds a lead in front of a swap the player cannot see behind
the panel, so the first fix is simpler.) Tests: with `currentMinigame` set before the call,
`openWithPhoneLead` opens synchronously with no timer; a held phone stays `hold` after it.

### m1. Every phone chat costs two `blocked()` passes per frame for an atlas without pose frames

player-poses.js:171-175 with :206; `show()` at :114.

The idle check costs nothing: with no phone open, `_wantPhone` stops at `this.phoneWanted`. But
`phoneWanted` is set by every phone-style `onMinigameStart`, whether or not the atlas has the
frames. For the whole of every phone chat or video call, each `postupdate` then runs `blocked()`
in `_wantPhone`, `blocked()` again in `show`, the loop over every NPC behaviour in
`npcBehaviorManager.behaviors`, and an `anims.get`, only to find no `pose_phone_*` animation. That
is the common case today: no mission player atlas has pose frames. The cost per frame is small, but
it buys nothing.

Fix: in `onMinigameStart`, set `this.phoneWanted = this.has('phone')`, or start `_wantPhone`
with `if (!this.phoneWanted || this.cur || !this.has('phone')) return;` so the cheap lookup runs
before `blocked()`. Test: with no pose keys, open a phone minigame, run `update()` ten times with a
counting `npcBehaviorManager.behaviors` getter, assert no reads.

### m2. A scene restart would reuse an instance already marked dead, and every lead-in would then drop its open

player-poses.js:229 and :232, checked at :160.

`installPlayerPoses` returns the existing instance when `w.playerPoses.scene === scene`, which
is the restart case R2 relied on. The new `once('shutdown')` sets `dead = true` and nothing
clears it. After a restart of the same scene the reused instance is dead: `show` still works, so a
tap shows the pose and sets the timer, and the timer then returns at :160 without opening. The
phone would never open from the inventory, a desk phone or a notification while the pose is shown,
and the player would see the phone raised and nothing happen. No current path restarts the main
scene (the only `scene.restart()` is inside the infusion-pump minigame, and the game-over restart
reloads the page), so this is latent.

Fix: in `installPlayerPoses`, when returning the reused instance, set `dead = false` and
`leadPending = false` and register a fresh `once('shutdown')`; or drop the reuse branch's early
return for a dead instance and build a new one. Test: install, emit `shutdown`, install with the
same scene, `openWithPhoneLead`, fire the timer, assert opened.

### m3. The call-site tests match source text; the designed behaviour tests for the ringer and the scripted branch are missing

test/js/player-poses.test.mjs:348-366.

The R2 design asked for two behaviour tests: the ringer's `beginOpen` calls the adapter hook once,
and `_queueScriptedConversation` with `startDelayMs` 500 and a phone scene calls `phoneLead`,
while `startDelayMs` 0 does not. The commit checks both with string and regex matches on the
source files. They pass for a call in dead code or behind a wrong condition: nothing runs the
video-call test `conv.params?.()?.videoCall === true`, or checks that a non-video person-chat
(the `_in_view` auto-challenge) gets no pose, or that a retry through `beginOpen` (phone-ringer.js
:850) raises the phone again. `createPhoneRinger({ adapter, clock })` takes a fake adapter and
clock, so the ringer test is cheap; `_queueScriptedConversation` needs only stubs for
`window.MinigameFramework`, `window.playerPoses` and `setTimeout`.

Fix: replace the ringer and npc-manager text checks with those behaviour tests (offer, answer,
assert `answering` called once before `openCall`; three `_queueScriptedConversation` calls: phone
with delay, video person-chat with delay, plain person-chat with delay, plus phone with delay 0).
The interactions.js and npc-barks.js text checks can stay: those functions are hard to drive in
isolation.

### m4. A different open during the lead is dropped, and its notification is removed

player-poses.js:154; npc-barks.js:604-605.

`if (this.leadPending) return true;` drops any second call, not only a second tap on the same
phone. The player taps the inventory phone and a text notification arrives and is clicked within
300 ms (or two notifications are clicked in quick succession): the second open is ignored, but its
caller treats `true` as done, so `openPhoneChat` returns and the notification is removed. The
phone opens on the first thread. The window is short, so the cost is small, but the click is lost
without a trace.

Fix: let the newest open win. Keep `this.leadOpen = open` and, when `leadPending`, replace it and
return true; the timer calls `this.leadOpen`. The phone still opens once. Test: two calls with
different `open` functions, fire the timer, assert only the second ran.

## Test quality

The lead-in tests (test:265-346) drive the real class through an injected `timer`, cover the lead,
the double tap, a minigame opened during the lead, a KO, a dead or replaced instance, no frames and
the walking refusal, and assert on the played animation key rather than on internal flags alone.
They are good. Gaps besides m3:

- No test with a minigame already open at the tap (M1).
- The double-tap test resets `leadPending` by hand (test:290) before its second open, which the
  timer has already done at :158; harmless but it hides whether the reset works.
- Sprite swap with a pose held: still no test. Reading the code, the swap is safe:
  `updatePlayerSprite` removes every `pose_*` key (core/player.js:173) and plays the idle without
  `ignoreIfPlaying` (core/player.js:201); the next `update()` sees `currentAnim.key !== cur.key`,
  ends the breath image and clears `cur` (player-poses.js:210-215); with a phone still open,
  `_wantPhone` re-shows the phone from the new atlas if it has the frames, and shows nothing if it
  does not. The live run swapped atlases before posing, not during one. Suggested test, in the
  existing rig: hold the phone (`onMinigameStart`), then simulate the swap (`anims.get` returns
  null for every pose key, `player.anims.play('idle-down')`), run `update()` twice, assert `cur`
  is null and the idle stays; repeat with the pose keys kept and assert the phone is held again.
  Not counted: the code path is the "another animation ends the pose" path that test:123 already
  covers.

## Counts

| Severity | Findings |
| --- | --- |
| Blocker | none |
| Major | M1 tap while a minigame is open (notification click during a phone chat lost) |
| minor | m1 per-frame work with no frames; m2 dead instance on scene restart; m3 text-only call-site tests; m4 second open during the lead lost |

R3: 0/1/4
