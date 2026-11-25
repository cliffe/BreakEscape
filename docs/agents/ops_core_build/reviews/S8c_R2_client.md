# S8c review, round 2: client, scenario, playtest script and docs

Reviewed: `ops-lock2` at `2788775bd`, the diff `7f7fbf0a2..HEAD` for the client area
(`systems/inventory-menu.js`, `interactions.js`, `lock-step.js`, `lock-step-wiring.js`,
`mfa-client.js`, `unlock-system.js`, `ui/lock-step-pane.js`, `ui/lock-step-push.js`,
`chat-helpers.js`, the two lock-step stylesheets, `PLAYTEST.md`, the docs and the JS tests).
Review only; nothing fixed. Paths are under `public/break_escape/js/` unless they start with
another directory.

Result: **0 blocker, 1 major, 7 minor.** All ten round 1 findings are closed. The fixes hold up as
code: the server still decides every pass and every open, the new tray entry and the floor rule
touch no shipped item, and the pane title is right in a real page. The major is in the playtest
script: beat 12d expects a toast that the code cannot show in that beat, and the fix commit says
it does.

Tests run (`TMPDIR` on `/data`, `bin/test-js -j 2`): `lock-step*.test.mjs` (14 files),
`inventory-menu`, `interactions-dropped-locked-pickup`, `minigame-font-16-default`,
`toast-once-before-container`, `chat-helpers-unlock-wording`, `mfa-client`, `mfa-client-lock`,
`unlock-one-poster`, `locked-hint-refusals`: 23 files passed, 0 failed. Probes of my own ran the
real stack through `test/js/helpers/lock-step-real-stack.mjs`; their output is quoted below.

## Round 1 findings

| Finding | State | Evidence |
|---|---|---|
| R1-CLIENT1 (blocker) carried briefcase cannot be opened from the tray | closed | `inventory-menu.js:122-124` puts "Unlock" first for a droppable item with `locked === true`; `:254` maps it to `handleUnlock(el, 'item')`. `lock-step-carried.test.mjs` now opens the real menu and clicks the real overlay row (passes). Shipped menus: a scan of every `scenarios/*/scenario.json(.erb)` found 25 `"droppable": true` objects; the only one with `locked` or `contents` is `gordon_briefcase` in `test_ops_lock_step`. `droppable` is never set by code (grep of `app`, `lib`, `js`). `PLAYTEST.md` 13b and 13c rewritten to the menu. |
| R1-CLIENT2 (major) pane titled "this lock" in a real page | closed | `ui/lock-step-pane.js:72-98` (`findObjectData`: the pad's lockable, then `window.rooms` sprites and their contents, then the tray); the wiring imports the same function. The harness no longer merges the room payload into `gameScenario` (`lock-step-real-stack.mjs:205-221`). Probe, real pad and pane, bootstrap-only `gameScenario`: `moira_locker` gives "Staff locker"; the nested `audit_zip` from the capture (`containerMoiraPc.contents[1]`, in no room list) gives `pane: "quarterly_export.zip" kind push_number_match`. A hostile name is text: title `<img src=x onerror=alert(1)><b>x</b>` gave `img in layer= 0 b in layer= 0`. See R2-CLIENT7 for the test. |
| R1-CLIENT3 (major) `toast-once-before-container` broken | closed | Test passes; line 111 pins the new text. |
| R1-CLIENT4 two lines lost a space | closed | `chat-helpers.js:112`, `:118`; `chat-helpers-unlock-wording.test.mjs` passes. |
| R1-CLIENT5 stale blocker paragraph in `PLAYTEST.md` | closed | Paragraph removed (diff). |
| R1-CLIENT6 pane swallows browser keys | closed | `ui/lock-step-pane.js:247-248`; cases added to `lock-step-pane.test.mjs` (passes). Propagation is still stopped. |
| R1-CLIENT7 "sent" over "Requests sent: 0" | closed | `ui/lock-step-push.js:96-97`, `:154-159`; two new tests pass. One sibling case is left, see R2-CLIENT2. |
| R1-CLIENT8 approve with no number read as gone | closed | `mfa-client.js:226-231` keeps the record and returns `error` for a lock; the PC branch is pinned unchanged (`mfa-client-lock.test.mjs`). Two tests were edited to a shape the server never sends, see R2-CLIENT2. |
| R1-CLIENT9 12e calls a client event a server record | closed | `PLAYTEST.md:142`. |
| R1-CLIENT10 two doc statements | closed | `docs/ACCESS_AND_NETWORKS.md:864`, `README_scenario_design.md` row A25 (diff). |

## New findings

### R2-CLIENT1 (major): beat 12d expects a toast the code cannot show there; the fix commit's claim is not true of that beat

`PLAYTEST.md:141` (12d): "If the approval from 12c is still pending (the request count carried
over), the door opens at once with no pane and the toast 'Approved earlier. The door opens.'".
Commit `61bc59eba` says "playtest 12d a door opened from an approval the server already held says
so".

What the server did in playtest 1 (`s8c-playtest/RESULTS.md` row 12d): "The click's unlock
returned `secondStep: true`, then the prompt returned `stepPassed: true, approvedBy: "owner"`: the
third request was approved at once and the door opened." The server held a count of two (12a, 12c),
not an approval. So the click gets a gate answer, `lockStep.run` runs (`systems/lock-step.js:123`,
`runs++`), the pane opens, its first request is the third and passes, and the pane closes in one
round trip. The toast is raised only when `runCount()` did not change
(`systems/unlock-system.js:1107-1113`), so it is not shown. The fixer's own test proves it:
`test/js/lock-step-room-payload.test.mjs:245` ("approved in a pane this click: no 'approved
earlier' toast", gate then `prompt_passed`) passes.

The toast's own case (the server answers the open with no gate) needs a passed record with the
door still shut: a page closed between the approving answer and the final `POST /unlock`. The
script never makes that state. So in 12d neither branch of the beat holds (no toast, and no pane
that stays), the door still opens with nothing said, which is the fault playtest 1 reported, and
12e ("click Send again until approved") has nothing left to do.

The toast itself is sound: it shows only on the server's `success`, the client decides no open, and
`:231` covers it.

Fix, in `scenarios/test_ops_lock_step/PLAYTEST.md`:
1. 12d: "Reload, click the east door. The server answers a gate; the pane opens and its first
   request is the third on the record (12a, 12c), so it is approved on arrival: the pane closes
   within one round trip (it may never be seen, and `S()` may never read `open: true`) and the door
   opens. No toast. Judge by the server rows: a third `mfa_prompt_sent`, then `mfa_prompt_approved`
   (approver `owner`) at `door` `plant_room`." Move 12e's client event check
   (`door_unlocked_by_npc`, once, `retry: true`) into 12d and delete 12e's "Send again" step.
2. Add one line under "Not played in the browser": the toast "Approved earlier. The door opens."
   needs a page closed between the approval and the open; it is covered by
   `test/js/lock-step-room-payload.test.mjs`.
3. `docs/ACCESS_AND_NETWORKS.md:864` may stay as it is (it describes the toast's true case).

### R2-CLIENT2 (minor): two edited tests now use an answer the server never sends, and one no longer proves its name

`test/js/lock-step-real-flow.test.mjs:295-305` ("a lock answer needs no message key: a bare refusal
ends the step and no server wording reaches the screen") now deletes `message` from
`generic_refusal` and then asserts that "Incorrect username or password" is not on screen: that
half cannot fail. `test/js/mfa-client-lock.test.mjs:184-190` does the same. No lock route sends a
bare `{ success: false }` 422: every 422 in `app/controllers/break_escape/lock_step_requests.rb`
(`:13`, `:195`) and `app/models/break_escape/lock_step_gate.rb` (`:81-154`, `:253`) carries a flag
or a message. So neither shape comes from the shared fixture, and nothing drives the real
`generic_refusal` through the pane.

Probe, real stack, unpatched `generic_refusal` on the first `POST /mfa/prompt`:

```
pane open= true text= "Staff lockerXA request was sent to moira's phone.Send againThat did not work. Try again."
server wording on screen: false
```

The wording stays off the screen, but the pane says a request was sent beside "That did not work"
(the R1-CLIENT7 fault, on the error branch).

Fix:
- `test/js/lock-step-real-flow.test.mjs:295`: use `generic_refusal` unpatched; assert the pane stays
  open, the text has "That did not work. Try again.", has no "was sent" and no "Incorrect username
  or password"; rename the test to say that.
- `public/break_escape/js/ui/lock-step-push.js` near `:161`: on a failed first request
  (`sent === 0 && !countEl.textContent`) clear the status line before `setMessage`.
- `test/js/mfa-client-lock.test.mjs:184`: use a fixture answer that is really "gone" for a lock
  (`verify_dropped` or `approve_expired`), or delete the test; no hand-patched body.

### R2-CLIENT3 (minor): the fourth test of `interactions-dropped-locked-pickup` asserts what the real module does not do

`test/js/interactions-dropped-locked-pickup.test.mjs:88-95` is named "a locked droppable held in
the tray opens through handleUnlock, as before". The harness stubs
`isDroppableInventoryItem(){return false;}` (line 47). In the real module a held droppable item
passed to `handleObjectInteraction` is dropped at `systems/interactions.js:1193-1196`, long before
the lock branch; that is why the tray entry calls `handleUnlock` directly
(`inventory-menu.js:253-254`). The test passes only because of the stub.

Fix, in that test file: make the stub the real rule
(`s?.scenarioData?.droppable === true && window.inventory.items.includes(s)`), record
`dropInventoryItem` calls, and change the fourth test to "handleObjectInteraction on a held locked
droppable drops it and opens no pad" (or delete it).

### R2-CLIENT4 (minor): once opened, a carried droppable container has no tray entry that opens it again; the floor rule is not in the docs

"Unlock" is offered only while `locked === true` (`inventory-menu.js:124`). Probe, real
`inventoryMenuFor`, the captured briefcase with `locked: false` and "Board minutes" still inside:

```
opened briefcase, contents left, tray menu: ["Drop here","Examine"]
```

A player who closes the container in 13d without taking "Board minutes" can reach it only by
dropping the briefcase and clicking it on the floor (the container branch,
`interactions.js:1931-1939`). Round 1's instruction covered this ("locked or content-bearing").
Two smaller points of the same change: "Unlock" on a held droppable with `lockType: 'flag'` would
show "This item requires flag to unlock." (`unlock-system.js:1723-1724`; the flag station is
reached only from `interactions.js:1903`), and the new rule that a locked, takeable, droppable
object in a room is picked up by a click and never opened where it lies
(`interactions.js:1930`) is stated nowhere for authors.

Fix:
- `public/break_escape/js/systems/inventory-menu.js`: for a droppable item with
  `locked !== true` and (`Array.isArray(data.contents)` or `data.hasContents === true`) push
  `{ id: 'open', label: 'Open' }` first, mapped to `w.handleUnlock?.(el, 'item')`; for
  `lockType === 'flag'` offer no "Unlock". No shipped droppable item has contents or a lock (scan
  above), so shipped menus stay as they are; add both cases to `test/js/inventory-menu.test.mjs`.
- `docs/ACCESS_AND_NETWORKS.md`, A25 "What the player sees": add "a locked item that is takeable
  and droppable is picked up by a click in the room and unlocked from the tray".

### R2-CLIENT5 (minor): the font guard was wrong about the lock-step buttons, and the code was changed to suit it

`test/js/minigame-font-16-default.test.mjs` reads any `-btn` rule as GNF because
`.minigame-container button` (`css/minigames-framework.css:293`) beats a one-class rule. The pane
is not inside `.minigame-container`: `ui/lock-step-pane.js:405` appends its layer to
`document.body`. So `.lock-step-btn` and `.lock-step-push-btn` draw in VT323, which the guard's own
header says has no grid, and 20px was right. `07b581b0e` raised both to 24px
(`css/lock-step.css:50`, `css/lock-step-push.css:42`); the pane's text stays 20px
(`lock-step.css:24`, `lock-step-push.css:5`). Nothing breaks.

Fix, in `test/js/minigame-font-16-default.test.mjs`: skip the control-is-GNF override for the two
lock-step sheets (a `BODY_MOUNTED` set beside `VT323_ROOT`, with the reason). The CSS may stay at
24px or go back to 20px; with the test corrected either passes.

### R2-CLIENT6 (minor): the tray click in `lock-step-carried` is a copy; the real listener can be loaded

`test/js/lock-step-carried.test.mjs:39-45` repeats two lines of `systems/inventory.js:1060-1063`
and a source regex pins them (`:167-170`). The copy leaves out the listener's first line, the
forced-conversation guard (`inventory.js:1056`). The real module loads under node:
`test/js/inventory-restore-no-revalidate.test.mjs:33-44` copies it with stubs and calls the real
`addToInventory`, which builds the tray `<img>` and adds this listener (`inventory.js:1054`). The
copy is faithful for the case tested, so this is minor.

Fix, in `test/js/lock-step-carried.test.mjs`: add one test that puts the captured briefcase in the
tray through the real `addToInventory` (loaded as `inventory-restore-no-revalidate.test.mjs` does),
dispatches a real `click` on the tray image, and picks "Unlock" in the overlay; the source regex
can then go.

### R2-CLIENT7 (minor): the nested-title test uses a hand-made object, not the captured one

`test/js/lock-step-pane-title.test.mjs:41-50` builds `{ id: 'audit_zip', type: 'zip', name: 'Audit
archive' }` and sets `currentMinigame` by hand; `assert.ok(zip)` on line 49 can never fail (line 43
falls back to a literal). The capture has the real object
(`test/js/fixtures/lock_step_room_payloads.json`, `containerMoiraPc.contents[1]`, name
"quarterly_export.zip"), and round 1 asked for the title "opened from the container". My probe
above ran that path and the title is right, so only the test is short.

Fix, in that test: take `payloads.containerMoiraPc.contents[1]`, call
`window.handleUnlock({ scenarioData, objectId: 'audit_zip' }, 'item')`, submit the real password
pad with a gate answer patched to `audit_zip`, and assert `__test.lockStep.state().title` equals
the captured name.

### R2-CLIENT8 (minor): the bridge's tray hint names two entries only

`systems/test-bridge/index.js:1995`: `hint: 'This item has a menu. Pick an entry with
inventoryAct(item, "Drop here" | "Examine" | index).'`. The same reply carries `menu.items` with
the real labels (`:1994`), and `PLAYTEST.md` 13b gives the exact call, so a scripted player who
reads the reply sees "Unlock"; one who reads only the hint does not (the same was already true of
"Use", "Eat" and "Put on").

Fix, in `index.js:1995`: build the hint from the menu, for example
`` `Pick an entry with inventoryAct(item, ${menu.items.map(i => JSON.stringify(i.label)).join(' | ')} | index).` ``.

## Checked and found sound

- **Tray "Unlock".** Shown only for a droppable held item with `locked === true`; gone once the
  client marks it open (`lock-step-carried.test.mjs`, "once the briefcase is open"). It calls
  `handleUnlock`, so the pad, the gate and the pane are the ordinary path and the server decides.
- **Floor click.** `droppedLockedInWorld` needs `droppable`, `takeable` and `locked` all true and
  the item not held (`interactions.js:1930`). Not takeable: the pad opens where it lies, as before
  (test 2). Unlocked: the container branch, as before (test 3). There is no inventory limit in
  `inventory.js`. A dropped copy is rebuilt by the server from the held item with `takeable: true`
  (`app/models/break_escape/game.rb:1176-1178`). No shipped scenario has such an object (scan).
- **Pane title.** Doors read `door_sign` from the bootstrap room; carried items the tray; nested
  objects the pad's lockable (every pad starter passes `lockable` in its params,
  `minigame-starters.js:615`, `:674`, `:1158`, `:1186`). Names reach the DOM by `textContent` and
  `setAttribute` only (`ui/lock-step-pane.js:134`, `:172`).
- **"Approved earlier" toast and `runCount`.** Raised only inside `if (answer && answer.success)`;
  `runCount` is read, never used to decide an open. With no `window.lockStep` there is no toast.
- **R1-CLIENT8 branch.** It sits after every flag check and applies to lock subjects only; 403 and
  404 answers carry `error`, not `message`, and are untouched.
- **PLAYTEST beats 1 to 11, 13.** Traced again click to request. 13b: tray click, menu, "Unlock",
  `handleUnlock`, PIN pad, `POST /unlock` (`item`), gate, pane. 13c: X, the pad closes itself, "Drop
  here", floor click takes it, "Unlock" again. 13d and 13e as round 1. Beats 5 and 9 match the new
  first-request wait line. Only 12d and 12e are wrong (R2-CLIENT1).
- **Docs.** The A25 paragraph matches the code for the tray entry, the held phone on a plain push
  and the "Not approved." toast.

## For the owner

- R2-CLIENT1: after a reload, a door whose third request is approved on arrival opens with nothing
  said (the pane closes within one round trip). The fix above corrects the script only. If a line
  is wanted there (for example a toast "Approved." whenever a pane passes on its first answer),
  that is a new player-facing rule for every push lock and needs a decision.

Verdict: not clean
