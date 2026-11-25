# S8c review, round 1: client, scenario, playtest script and docs

Reviewed: `ops-lock2` at `b51b97d50`, every commit since `git merge-base main ops-lock2`
(`e9114090c`). Area: `systems/lock-step*.js`, `ui/lock-step-*.js`, the changes to
`unlock-system.js`, `mfa-client.js`, `doors.js`, the pads and starters, `__test.lockStep`, the CSS,
`scenarios/test_ops_lock_step/` with `PLAYTEST.md`, the JS tests and the unit 29 docs. Review only;
nothing fixed. All paths below are under `public/break_escape/js/` unless they start with another
directory.

Result: **1 blocker, 2 major, 7 minor.** The core holds up: the client decides no pass and no open,
one pane at a time, a cancel leaves nothing open, and the PC sign-in step is untouched. The
problems are at the edges the tests reach by a shortcut: the tray click of the carried briefcase
never reaches its lock, and the pane cannot name a room object in a real page. Both passed their
tests because the test stood in for the page.

Tests run: the 183 `test/js/*.test.mjs` files that name a changed module, with `bin/test-js -j 2`:
179 pass, 4 fail. Three are the ones the hand-on file lists as failing on `main`
(`capture-log`, `lockpick-mode-switch-roundtrip`, `lab-ux-ui`); the fourth is R1-CLIENT3. The whole
suite was not run to the end (the root volume filled up during the run and it was stopped).

## Findings

### R1-CLIENT1 (blocker): the carried briefcase cannot be opened from the tray; beat 13b cannot be played by clicking

`PLAYTEST.md:148` (13b) says "Click the briefcase in the inventory tray, type its PIN, press
Enter", and 13c and 13d build on it. The briefcase is `droppable: true`
(`scenarios/test_ops_lock_step/scenario.json.erb:466`), and a droppable tray item never reaches
`handleUnlock`:

- `systems/inventory.js:1053-1063`: the tray click calls `window.openInventoryItemMenu` first and
  returns when it takes the click.
- `systems/inventory-menu.js:92-139`: a droppable item with no `triggerOnInteract`, not wearable and
  not a consumable falls to line 138 and gets "Drop here" and "Examine" only. "Examine" is
  `examineHeldItem` (the examine view). No entry opens the lock.
- `systems/interactions.js:1190-1197`: any other caller of `handleObjectInteraction` on a held
  droppable item (the test bridge, for one) drops it, long before the container branch at
  `interactions.js:1920-1936`.

Run (real `inventory-menu.js`, the briefcase as the real server sent it in
`test/js/fixtures/lock_step_room_payloads.json`, put in `window.inventory.items`):

```
served item keys: id,name,type,locked,lockType,takeable,droppable,secondStep,observations,pinLength,hasContents droppable= true
menu: [{"id":"drop","label":"Drop here"},{"id":"examine","label":"Examine"}]
tray click taken by menu: true labels: [ 'Drop here', 'Examine' ]
handleObjectInteraction calls: 0 handleUnlock calls: 0
```

So the tests' simulated click is not faithful. `test/js/lock-step-carried.test.mjs:5` says "The
click is what inventory.js sends it to for a container: handleUnlock(item, 'item')" and lines 51,
75, 88, 105, 110 and 123 call `window.handleUnlock(item, 'item')` directly. That is true only of a
held container that is not droppable. `interactions.js` and `inventory-menu.js` are loaded by none
of the lock-step tests.

Also read, not run: once dropped, a click on the briefcase on the floor reaches the container
branch (`interactions.js:1920-1936`, "check BEFORE lock check"), which calls `handleUnlock`. So
13c's "click it on the floor to pick it up" most likely opens the PIN pad and picks nothing up. The
browser run should confirm which.

Fix:
1. `public/break_escape/js/systems/inventory-menu.js`, `inventoryMenuFor`: for a droppable held
   item that is a locked or content-bearing container (`data.locked === true`, or
   `data.hasContents`, or `Array.isArray(data.contents)`), put `{ id: 'open', label: 'Open' }`
   first. In `openInventoryItemMenu` add the action `open: () => w.handleUnlock?.(el, 'item')`. Do
   not route it through `use`: `handleObjectInteraction` drops a held droppable item
   (`interactions.js:1194`).
2. Before that change, grep every shipped scenario for a `droppable: true` item that is locked or
   has contents. If there is none, shipped menus are unchanged; say so in the commit. Extend
   `test/js/inventory-menu.test.mjs` with the briefcase case and keep its shipped-item cases as
   they are.
3. `test/js/lock-step-carried.test.mjs`: load the real `inventory-menu.js`, open the menu with
   `openInventoryItemMenu(item, ...)`, choose "Open" through the entry's `onSelect`, and correct the
   header comment.
4. `scenarios/test_ops_lock_step/PLAYTEST.md` 13b to 13d: "click the briefcase in the tray, choose
   Open", with the bridge call (`__test.openInventoryItem` then `__test.inventoryAct(item, 'Open')`).
   Rewrite 13c to what a click on the dropped briefcase really does.

### R1-CLIENT2 (major): in a real page the pane is titled "this lock" for every room object

`systems/lock-step-wiring.js:27-40` (`findObjectData`) looks for the object in
`win.gameScenario.rooms[*].objects` and then in the inventory. The page never puts objects on
`gameScenario`: the bootstrap rooms carry none, and `core/rooms.js:1009` takes the fetched room
into a local `roomData` that goes straight to `createRoom` (`rooms.js:1033`), which builds sprites
in `window.rooms[roomId].objects`. A grep for any write of `objects` onto `gameScenario.rooms`
finds none. The pane's own default (`ui/lock-step-pane.js:67-88`) has the same fault.

Run (real `lock-step-wiring.js`; `gameScenario` is the captured bootstrap, the start room's objects
are sprites in `window.rooms.office.objects`, as the page holds them):

```
bootstrap office keys: type,connections,door_sign,hasPresentNpc,locked
moira_pc | authored name: Moira's PC | pane title: this lock | isOpenInClient once open: false
moira_locker | authored name: Staff locker | pane title: this lock | isOpenInClient once open: false
priya_safe | authored name: Wall safe | pane title: this lock | isOpenInClient once open: false
dana_cabinet | authored name: Finance cabinet | pane title: this lock | isOpenInClient once open: false
door: Records room
```

So `PLAYTEST.md` beats 2, 4, 8, 9 and 10 (`title: "Moira's PC"` and so on) cannot hold, the
dialog's `aria-label` is "this lock", and `isOpenInClient` (`lock-step-wiring.js:71-78`) is never
true for a room object, so a queued request for an object the client has already opened is posted
again instead of dropped. Doors and held items are right.

The tests pass because the harness builds a `gameScenario` the page never has:
`test/js/helpers/lock-step-real-stack.mjs:200-205` (`scenarioFromPayloads`) merges the start room's
payload over its bootstrap entry, and `test/js/lock-step-wiring.test.mjs:332` ("an object lock is
titled by its scenario name") does the same by hand.

Fix, in `public/break_escape/js/systems/lock-step-wiring.js` `findObjectData`: look, in this order,
at (1) the lockable of the pad beneath (`win.MinigameFramework?.currentMinigame`, its
`params.lockable.scenarioData` or `lockable.scenarioData`, when its `id` is the target id: this is
the only place a nested object such as `audit_zip` is sure to be), (2) every sprite in
`win.rooms[*].objects` (a map, not an array) by `scenarioData.id`, walking `scenarioData.contents`,
(3) the inventory. Remove `defaultLockName`'s room walk in `ui/lock-step-pane.js` or make it the
same. In `test/js/helpers/lock-step-real-stack.mjs` stop merging the room payload into
`gameScenario`; build `window.rooms[room].objects` sprites from it instead, and add a test that the
title of `moira_pc`, of `audit_zip` (opened from the container) and of `records_room` is right with
`gameScenario` holding the bootstrap only.

### R1-CLIENT3 (major): the stage breaks `test/js/toast-once-before-container.test.mjs`

Unit 21 (`f50222ee6`) wrapped the key-pad success toast in `if (!gated) { ... }`
(`systems/minigame-starters.js:490-494`). The test pins the old source text at
`test/js/toast-once-before-container.test.mjs:111`:
`"'Unlock Successful', 4000);\n                // Small delay"`.

```
$ node test/js/toast-once-before-container.test.mjs
not ok 6 - callers set the expectation before the toast
  error: 'Unlock Successful', 4000);\n                // Small delay
# pass 7
# fail 1
```

The pinned text is present at the merge base and absent at `ops-lock2` (checked with `git show` on
both). The hand-on file lists only three tests as failing on `main`; this one is the stage's.

Fix: in `test/js/toast-once-before-container.test.mjs:111` pin the new text
(`'Unlock Successful', 4000);\n                }\n                // Small delay`). The
look-behind for `expectContainerAfterUnlock` on line 114 still holds (it is the line above the
toast). Behaviour for an ungated lock is unchanged, so no code edit.

### R1-CLIENT4 (minor): two shipped player-facing lines lost a space

`minigames/helpers/chat-helpers.js:109` and `:114` now read `` `⚠️ Failed to unlock:${...}` `` and
`` `⚠️ Door unlock error:${...}` ``. On `main` both have a space after the colon
(`git show main:public/break_escape/js/minigames/helpers/chat-helpers.js | grep -n "Failed to unlock\|Door unlock error"`
prints `Failed to unlock: ${` and `Door unlock error: ${`). Every scenario with an `#unlock_door`
tag shows these on a refusal, so a shipped scenario does not behave exactly as before.

Fix: restore the space in both template strings in `chat-helpers.js`.

### R1-CLIENT5 (minor): `PLAYTEST.md` still announces a blocker that is fixed

`scenarios/test_ops_lock_step/PLAYTEST.md:14` ("Known blocker found by the unit 27 tests (not yet
fixed when this was written)") says every object beat fails with 422 because the pad posts
`targetType: "item"`. Unit 15 fixed it: `app/controllers/break_escape/lock_step_requests.rb:20-22`
reads `item` as `object`, and `test/js/lock-step-real-flow.test.mjs:55` relies on it.

Fix: delete the paragraph at `PLAYTEST.md:14`.

### R1-CLIENT6 (minor): the open pane swallows browser keys once focus is outside it

`ui/lock-step-pane.js:223` prevents the default of every key whose target is outside the layer. A
click on the backdrop or on a line of text moves focus to `<body>`, and from then on F5, Ctrl+R and
F12 do nothing until the pane closes. Run (real pane, focus on `body`):

```
keydown {"key":"F5"} on body -> defaultPrevented: true
keydown {"key":"r","ctrlKey":true} on body -> defaultPrevented: true
keydown {"key":"F12"} on body -> defaultPrevented: true
```

Beat 12d reloads with a pane open. Fix, in `ui/lock-step-pane.js` `onKey`: do not call
`preventDefault` when `e.ctrlKey`, `e.metaKey` or `e.altKey` is set or the key is a function key
(`/^F\d+$/`); propagation may still be stopped. Add the three cases to
`test/js/lock-step-pane.test.mjs`.

### R1-CLIENT7 (minor): a reopened pane can say a request was sent and show "Requests sent: 0"

When the pane is reopened within the server's two-second gap the first request is refused as too
soon. `ui/lock-step-push.js:151-155` then only shows the wait line, so the status line (line 65)
and the count (lines 94-95) contradict each other. Run (real push part, the fixture's
`prompt_too_soon` body):

```
{"status":"A request was sent to Moira Hale's phone.","countLine":"Requests sent: 0","message":"Wait a moment before sending another request."}
```

`PLAYTEST.md` beats 5 and 9 describe this case as "counts from the next request". Fix, in
`ui/lock-step-push.js`: leave the count line empty until a prompt answer gives a count (draw it in
`send()` only), and on a first-request `too_soon` set the status line to the wait text in place of
"A request was sent". Add the case to `test/js/lock-step-push.test.mjs`.

### R1-CLIENT8 (minor): the open item, approve on a number lock with no number

Confirmed as the hand-on file has it, and it stays minor. `systems/mfa-client.js:226-229` reads any
422 with no flag as `gone` and drops the pending record; `ui/lock-step-push.js:118-127` (`ended`)
turns `gone` into `expired`, so the pane would close with "Not approved." while the server keeps
the step. The pane cannot send it: on a `push_number_match` lock `drawCard`
(`lock-step-push.js:183-207`) draws only the server's number buttons and "Deny", never "Approve".
The cost if it ever happened is one extra first factor.

Fix: in `systems/mfa-client.js` `refusalResult`, for a lock subject (`parsed.kind !== 'pc'`) whose
body has a `message` and none of the flags, keep the pending record and return `reason: 'error'`
(the push part then shows "That did not work. Try again." and stays open). The PC branch stays as
it is. Add one test in `test/js/mfa-client-lock.test.mjs` from the fixture's `generic_refusal`
shape, and one in `test/js/lock-step-push.test.mjs` that a number-match card has no "Approve".

### R1-CLIENT9 (minor): `PLAYTEST.md` 12e calls a client event a server record

`PLAYTEST.md:144`: "Server: `door_unlocked_by_npc` fired exactly once, with `retry: true`". The
event is emitted by the browser (`systems/unlock-system.js:1108-1110`, and
`systems/npc-game-bridge.js` for the pass with no retry), and line 3 of the script says to judge
each beat by the server record. Fix: in `PLAYTEST.md` 12e write "Client event" for that line and
name the server row to check (`mfa_prompt_approved` at `door` `plant_room`).

### R1-CLIENT10 (minor): two statements in the docs do not match the code

`docs/ACCESS_AND_NETWORKS.md`, A25, "What the player sees":

- "a denied or expired step on an NPC-opened door, a key, a card or another non-pad unlock shows
  'Not approved.' once". It shows over a pad too: `utils/lock-scope-refusal.js:40-45` calls
  `cancelFeedback` for every pad, and `PLAYTEST.md` beat 6 expects the toast over a password pad.
- The held phone is mentioned only for number match. A plain `push` with the owner's phone held
  also shows "Check <owner>'s phone", with "Approve" and "Deny" (`ui/lock-step-push.js:78-82`,
  `196-200`; beat 13d). `README_scenario_design.md` row A25 has the same gap ("a request to the
  owner's phone, which a careless owner may approve").

Fix: in `docs/ACCESS_AND_NETWORKS.md` say "a denied or expired step shows 'Not approved.' once with
the reject tone, over a pad or with none", and add to the push sentence "or the player approves it
on the owner's phone if they hold it"; add the same clause to the `push` text of row A25 in
`README_scenario_design.md`.

## Checked and found sound

- The client decides nothing. `lock-step.js` resolves only with a fresh `POST /unlock` answer after
  a pass (`lock-step.js:144-148`), and a second gate answer there is a cancel. `unlockTarget`
  returns at once on a cancel (`unlock-system.js`, first line of the function).
- One pane at a time: the slot in `lock-step.js:79-93`; a queued request re-posts once and never
  opens a second pane beside the first. Gordon's plant-room line can be chosen once (`gordon.ink`).
- State after cancel, expiry and close: `settle` in `lock-step-pane.js:183-194` removes the three
  key listeners, the timer, the push part and the layer, and resumes world keys. The request body
  lives only in the `run` closure. A reload clears everything client-side.
- Every pad treats a cancel as no attempt and shows no line (PIN, password, combination, cryptex);
  each calls `lockScopeRefusalLine` once, so "Not approved." is said once.
- PC sign-in (S8a): each `mfa-client.js` change is behind `parsed.kind === 'pc'` or is a new
  export; the PC branch of `passed` and of the `codeLocked` refusal reads as before.
- Door paths traced to their request: card door (beat 11) posts `door`/`rfid` through
  `notifyServerUnlock`; Gordon's line posts `door`/`npc` through `NPCGameBridge.unlockDoor`; the
  door retry (12c, 12d) posts `npc` with `fromDoor`, fed by `doors.js:557-560` from the bootstrap
  room. Object beats 2 to 10 post `targetType: "item"`, which the server now takes.
- A plain `push` phone card shows "Approve": the server sends `numbers` only for a number lock
  (`app/models/break_escape/lock_step_gate.rb:177`).
- Accessibility: `role="dialog"`, `aria-modal`, `aria-label="Close"` on the X, Escape closes the
  pane and not the pad, Tab stays inside, first focus on the field or the X.
- New static imports: `unlock-system.js` (the BLE helper), `test-bridge/index.js`
  (`./lock-step.js`), `lock-step-wiring.js`, `lock-step-pane.js`. Every harness that names one of
  the changed modules passes (the 179 above), so no copy list is short.
- The pinned overlay list: no scene was added (the pane is a DOM layer, not a framework scene), and
  `playtest-shellx-open-wait.test.mjs` exits 0 unchanged.
- Docs: lock-type lists match `LockStepModel` (`lib/break_escape/lock_step_model.rb:16-18`); the id
  limit and the three lock types that take no step match `scripts/validate_lock_step.rb:16-19`; the
  bridge calls match `systems/test-bridge/lock-step.js`.

## For the owner

- R1-CLIENT1 adds an "Open" entry to the tray menu of a droppable locked container. That is an
  engine change to a shipped menu (inert today if no shipped droppable item is locked or has
  contents, which the fix must check). The other way is to make the briefcase not droppable and
  drop beat 13c from the browser script, leaving the drop to the Rails tests. Which is wanted?
