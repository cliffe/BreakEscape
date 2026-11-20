# Gate door bar and slice 9.3a step 7: code review R1

Reviewed 2026-11-10 on `claude/break-escape-access-design-090sjx`:

- `b2e2d86e4` Gate doors: solid for a player the gate is not open to (design:
  `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` section 3).
- `140eccd4f`, `ed3bf1e83`, `3d9f0219b`, `72209f7f9` Networks 9.3a step 7 (design:
  `ACCESS_MODEL_SLICE_9_3_PLAN.md`, step 7, sections 4.1, 4.3, 6 and 8).

No code was changed by this review.

## Counts

| Severity | Count |
|---|---|
| Blockers | 0 |
| Majors | 2 (one in the bar, one older and made likelier by the bar) |
| Minors | 7 |
| Nits | 3 |

Fix now: **M1** (the bump refuses a player who holds the clone), a few lines in `doors.js` with a
test. Fix before the lab playtest, in its own commit: **M2** (Len's route action cannot fire while
the player stands on his waypoint beside the gate). Everything else can wait or is accepted.

## What was run

- `bin/test-js -j 2`: 460 passed, 3 failed, 463 files. The three failures are timing flakes under
  load, none in a file these commits touch: `client-purchase.test.mjs` (test 26),
  `fingerprint-generator.test.mjs` ("generatePrint at 128 runs in under 150 ms") and
  `password-signin-mode.test.mjs` (test 10, a portrait fallback). Each passes when run alone
  (42/42, 7/7, 11/11).
- `bin/rails test`: 1195 runs, 7216 assertions, 0 failures, 0 errors, 2 skips.
- `scripts/validate_scenario.rb` (with a UTF-8 locale) on every scenario with a gate or a network:
  `lab_physical_pentest`, `test_gate_tailgate`, `m10_full_disclosure`,
  `ca20_remote_and_mobile_working`, `ca20_remote_and_mobile_working_defend` and
  `test_access_networks`: no errors, and no side-gate warning and no "gate on the door out of the
  locked room" error in any shipped scenario. (The validator rewrote the two `ca20` dungeon graph
  JSON files, whitespace only; I restored them.)
- No browser run: none of the findings needed one to be settled. M2 and m1 should be watched in
  the lab playtest the plan already calls for.

## Part 1: the gate door bar

### What holds

- One writer for gate bodies (`_applyBodies`, `door-gates.js:347-353`), called by `open()`,
  `close()`, `register()`, `playerOpen()` on an open gate, `closeNow()` and every tick of
  `update()`. The overlap exception and `playerHoldsDoorway` match the design. `_playerBarred`
  tests the room first and is read once per tick by both branches.
- `clickOutcome` is asked once, after the repeat guard (`doors.js:664-670`), so `exitOpen` cannot
  run twice for one click; the credential branch always returns, so the `outcome` computed before
  its `await` is never read stale.
- The validator's two new checks (`validate_scenario.rb:6155-6170`) fire on no shipped scenario.

### `gateShowsOpen(body)` in `npc-pathfinding.js` (outside the plan's file list)

Judgement: **correct and safe; keep it.** Reasons:

- It matches only a body whose game object has `doorProperties.gateKey` and `open === true`
  (`npc-pathfinding.js:103-106`). Only `door-gates.js _join` sets `gateKey`, and an ordinary door
  that opens is destroyed by `openDoor`, so no other door is affected. A declined side gate never
  gets `gateKey`.
- Without it, a gate held solid for the player would be a blocked cell for Len, whose path would
  then be unreachable (the builder's playtest finding). The grid followed `open` before this
  change too, because the body was off whenever the gate was open; this keeps that.
- NPC sight occlusion does not use this code. `npc-sight-occlusion.js doorBlocks` (`:312-317`)
  already treats a door as clear when `doorProperties.open === true`, so guards see through an
  open gate with or without this change; the two now agree.
- NPCs have no collider with door sprites (only the player does, `doors.js:590`, and wheeled
  chairs, `object-physics.js:95,155`), so a guard physically walks the path the grid now gives him.
- The other readers of `hasWorldPhysicsLineOfSight` are the hostile chase close-in
  (`npc-behavior.js:2216,2239,2330`), which is right to see through an open gate the NPC can
  cross, and player path smoothing, which the bump handles (the plan accepts this).

Two small consequences are listed as m5 and n1 below.

### The builder's five reports

| Report | Verdict | Fix now? |
|---|---|---|
| Len stalled about 3 s in the doorway after a dash, then recovered | Explained, not a defect of the bar: see m1 | No |
| A bump toast can fire before a clone click when walking up to a gate open for Len | **Confirmed**: M1 | **Yes** |
| Ordinary north and south doors go on the pending list | Confirmed, harmless: m2 | No |
| Len's route action does not run when the player stands on his waypoint (older code) | **Confirmed as older code**, and the bar makes it likelier in the lab: M2 | Before the lab playtest |
| A far room's side of the doorway is not marked walkable when a gate opens before that room loads (older code) | Confirmed as a no-op call, with no expected effect: m3 | No |

### M1 (Major). The bump refuses a player who holds a working credential

`doors.js:773-782` (`handleGateBump`). The bump checks only that the gate is open and its body is
on, then shows "Access denied: this door only opens for authorised staff." with the gate's
`lockedHint` and emits `door_gate_denied`. It never asks `playerHoldsRfidCredentialFor(g.requires)`,
which the click asks first (`doors.js:687`).

Failure: in `test_gate_tailgate` or the lab, the player holding the cloned badge walks up to the
gate while Len is in the doorway (the only time an open gate stays solid for a barred player within
its radius, since `_playerBarred` otherwise shuts it at once). He touches the strip: "Access
denied" and the hint about where a badge comes from, then he clicks and gets "Access granted:
cloned staff badge accepted." The two messages contradict each other, and `door_gate_denied`
fires for a player the door would admit; any scenario mapping on it (the plan's optional Len bark)
would scold him.

Fix: in `handleGateBump`, after `cancelClickToMove`, return without the refusal when
`playerHoldsRfidCredentialFor(g.requires ?? props.requires)` is true (optionally a short neutral
toast, "Click the door to badge in", throttled by the same `bumpDue`). Add a case to
`door-gates-bar.test.mjs` beside "the bump: on an open gate that blocks him": with the clone held,
the walk is cancelled, no refusal toast and no `door_gate_denied`.

### M2 (Major, older code). Len's route action waits for ever while the player stands on his waypoint

`npc-behavior.js:1256-1258` (mustReach) with `:1477-1481` (the squeeze) and `:1223` (arrival is
`distance < 8`). On the last leg to a waypoint with an `action`, a blocking player makes Len wait
600 ms and then squeeze towards the waypoint at 0.45 speed; the action runs only when his body
centre is within 8 px of it. A player standing on that point keeps him out of the 8 px, and the
stuck watch re-arms while the player stands beside him (`_checkPathStuck`, `:1290`, header above it),
so nothing gives up. The action is deferred, not lost: it runs once the player moves.

Why it matters now: the lab's action waypoint is `open_plan (1, 2)`, `unlockRoom: secure_area`,
`useObject: badge_reader` (`lab_physical_pentest/scenario.json.erb:1214`), beside the gate and the
reader; `test_gate_tailgate` has the same shape (`:76`). With the bar, a player waiting for Len is
stopped at the strip, which is where that waypoint is. A disguised player (not barred) waiting to
tailgate stands in the same place, so the intended tailgate beat stalls until he steps aside, with
nothing on screen to say why.

Fix (own commit, with a test in the pattern of the avoidance tests): when `mustReach` and the
blocker is the player, count the waypoint as reached within a reach radius (for example 24 px,
under a tile) after the squeeze has run for a short time, then run the route action from there.
Confirm in the lab playtest by standing on `(1, 2)` with and without the vest.

### m1 (Minor, not a defect). The 3 s stall in the doorway

Matches the avoidance code: a body within `AVOID_LOOKAHEAD_PX` ahead stops Len for
`AVOID_WAIT_MS` (600 ms), a detour is tried, and with no way round he squeezes after
`AVOID_GIVEUP_MS` (2500 ms), `npc-behavior.js:48-55,1437-1499`. After a dash the barred player is
held at the strip, in Len's lane as he comes out through the doorway, so the wait and give-up add
up to about 3 s, then the squeeze carries him on. It recovers by design and the gate stays open
throughout (`npcInDoorway`). No fix; if it reads badly in playtests, a guard could treat a player
standing on the far side of a solid strip as not ahead, but that is a design change.

### m2 (Minor). Every ordinary north or south door sits in `pending`

`door-gates.js:224-230`. `doors.js:603` registers every door sprite, so each ordinary N/S door
(rawGate null, no group at its key) is added to `pending` and stays there until its sprite is
destroyed; `_prunePending()` walks the whole map every frame (`:734`). It is correct (a pending
sprite only joins a gate created at the same 8 px key, which is only its own doorway's configured
sprite) and the cost is a few dozen set entries per frame. Optional tidy: in `doors.js`, register
with null only when the connected room's door entry back into this room carries a `gate`
(`fullRoomData` of the connected room is not always to hand, so this is not worth doing now).

### m3 (Minor, older code). The far room's half of the doorway is not marked when the gate opens first

`door-gates.js:419-424` calls `markDoorWalkable(g.connectedRoom, ...)`; with that room not loaded,
`npc-pathfinding.js:258-273` records the doorway in `openDoorways` and returns before touching the
grid. When the room loads, its sprite joins the open gate (`_join`, `:287`, open look and
`open = true`), `register` applies the body rule, and the room's pathfinding init rebuilds the
world grid from bodies, where `gateShowsOpen` leaves the open gate out. The corner blocks are kept
by the first room's call (`openNSDoors`). So the missed call has no expected effect on the unified
grid. No fix now; if a playtest ever shows a guard refusing that doorway after a mid-hold load, add
`pm.rebuildWorldGrid()` in `register()` when a sprite joins an open gate.

### m4 (Minor). No test covers `gateShowsOpen`

`test/js` has no case for `buildWorldGrid` or `hasWorldPhysicsLineOfSight` with a gate body that
is on and shows open. Add one to the pathfinding tests: a stub world with one enabled immovable
body whose game object has `doorProperties { gateKey, open: true }` leaves its cells free and does
not block the line; with `open: false` it blocks; an ordinary door body (no `gateKey`) with
`open: true` still blocks.

### m5 (Minor). The seat stand-up grid can pick a cell on a solid gate strip

`seat-box.js:138` builds its grid with `buildWorldGrid`, so it also treats an open gate's strip as
free. A player standing up from a seat right beside a gate that is open for a guard and solid for
him could be placed overlapping the strip; Phaser then separates him, possibly to the far side.
Needs a seat within a tile of a gate doorway; none exists in the shipped gate scenarios. Fix if it
ever matters: pass the open gate bodies that block the player in `exclude`'s opposite (a `include`
list), or check `blocksPlayer` for the chosen cell.

### n1 (Nit). Click-to-walk and smoothing route the player through a gate solid for him

Intended by the plan (the bump cancels the walk), noted only so a tester does not file it: a click
into the secured room while the gate is open for Len walks the player to the strip and stops with
the refusal.

## Part 2: slice 9.3a step 7

### What holds

- `api-client.js:122-155` (`login` `:129`, `networkPlant` `:141`, `network` `:153`): the three calls and the `foothold` field; `foothold` is only sent when
  given, so every existing `login` caller sends what it did before. The routes exist
  (`config/routes.rb:44-46`).
- `inventory.js`: `showServerItem` and `syncInventoryFromServer` (`:1211-1274`) add with no
  request (`_serverAdded` skips the POST at `:649`), remove locally only (`removeFromInventory`
  sends nothing), and defer the tray refresh to one call at the end. `addToInventory` has no
  `await` outside the request block, so the synchronous call in `addServerItem` really completes
  before `deferTray` refreshes. `3d9f0219b` correctly skips `onPickup` and `item_picked_up` for
  server-made items, so a pickup mapping on the drop box does not fire again when an unplug gives
  it back.
- `interactions.js:935-948`: the jack and link-item branches sit after the sign-in PC branch and
  return; nothing else in `handleObjectInteraction` changes for other objects.
- `game.js:1683`: `networkLinks.load` runs after the scenario defaults and the saved globals are
  merged (`:1654-1676`), so `<jackId>_planted` survives a reload and is set before any room loads;
  `restoreHandles` runs after the saved inventory (`:2393`); the objectives manager initialises
  after both (`:1810`), so the reconcile sees `wasGained`.
- Other scenarios: with no `footholds`, no jack and no `network_link` item, every new path is
  inert (`load([], [])`, `syncRoom` finds no jack, the two branches never match). m01 to m09, the
  lab and `test_gate_tailgate` do not reach any of it; the JS and Rails suites pass.
- Secrecy: the client learns a network's name only from a held foothold (bootstrap `footholds`, a
  plant answer, `GET /network`). Room data withholds `network`, `linkName` and `linkStoreIn`
  (`network_access.rb:21`, `game.rb:1017`, `:4018`); the bootstrap withholds `networks`,
  `networkLinks` and `resources`. In `test_access_networks` no task title, sign text, ink line or
  jack text names a network, a resource host or a share; the only such strings are inside
  `networks` and `resources` (checked by search over the scenario, its ink and `mission.json`). A
  sign-in PC's `host` ships in room data, which section 6 allows.

### m6 (Minor). A restored handle is not the server's link item

`network-links.js:179-183` (`restoreHandles`) builds the link item itself: no `sprite`, no
`storeIn`, and different `observations`. The server's item (`network_access.rb:255-266`) carries
`sprite` (the device's sprite), `storeIn` (from the jack's `linkStoreIn`) and "Your <device> on
<jack>. Open it to see what it reaches."

Failure: in the case this exists for (a held foothold whose link item is missing from the saved
inventory), the tray shows `objects/network_link.png`, which does not exist (a broken image); a
scenario that files link items with `linkStoreIn` gets it loose in the tray; and `_deviceName`
(`:319-327`) cannot parse "Your X on" from the observations, so the unplug confirm says "Your
device is plugged in here". Fix: have the bootstrap's foothold carry the link item
(`link_item_for`), or at least `sprite` and `storeIn`, and show that; until then copy the
server's observations wording and fall back to the device sprite.

### m7 (Minor). Two quick clicks can stack two plant confirms

`network-links.js:330-361`. `_busy` is set only inside `plant` and `unplug`, after the confirm
resolves, so a second click (or E press) while the first confirm is open opens a second
`gameConfirm` (`notifications.js` has no guard). Confirming both sends two plants; the second gets
`already` or a 422 `no_device` and shows the "nothing to plug in" toast after a successful plant.
Fix: set `_busy` at the top of `interactJack` (return `busy` if set) and clear it in a `finally`
around the whole method, with a test that a second call during an open confirm sends nothing.

### n2 (Nit). The planted look can be applied after an unplug

`network-links.js:291-295`: when `plantedSprite` is not loaded yet, `set` runs on the loader's
`complete` with the key chosen before the load. An unplug before the load completes leaves the
planted look on an empty jack until the room reloads. Fix: in the callback, call
`applyJackLook(sprite)` again instead of setting the captured key.

### n3 (Nit). `load()` writes the planted globals without `writeGlobal`

`network-links.js:163-166` writes `globalVariables` directly. That is deliberate (before any room
or listener exists, and the plan says display state only), but a scenario that does not declare
`<jackId>_planted` gets an undeclared global set on every reload. Worth one line in the author
docs: declare `<jackId>_planted` in `globalVariables` if a condition reads it (the feature
scenario does).

## Not checked

- No browser run, so the plan's scripted step 7 run (plant, unplug, plant again, reload,
  `verify-run.rb --access` and `access-leak-check.rb` on :3001) was not repeated here.
- `ca20_*` and `m10` gates were checked only through the validator, not played.
