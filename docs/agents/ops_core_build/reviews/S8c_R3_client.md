# S8c review, round 3: client delta

Reviewed: `ops-lock2`, the three client fix commits `341406b26`, `2980e7105`, `26faae9ee` (diff only) against `S8c_R2_client.md`.
Review only; nothing fixed. Paths under `public/break_escape/js/` unless noted.

Tests run (`PATH` with node 22, `TMPDIR=/data/tmp`, `bin/test-js -j 2`): `lock-step*.test.mjs` (14 files), `inventory-menu`,
`interactions-dropped-locked-pickup`, `minigame-font-16-default`, `mfa-client-lock`, `test-bridge-lock-step`, plus all eight
`inventory*` and tray tests (`inventory-tray`, `inventory-tray-narrow`, `inventory-drop-label`, `inventory-restore-*`,
`inventory-resume-same-name`, `inventory-server-items`): 20 files then 10 files, 0 failed.

## R2 client findings

| Finding | State | Evidence |
|---|---|---|
| R2-CLIENT1 (major) 12d expects a toast it cannot show | closed | `PLAYTEST.md:141` now says: gate, pane opens, third request approved on arrival, no toast, judge by the rows, `door_unlocked_by_npc` once with `retry: true`; `:142` (12e) is a fresh game with "Send again" to the third request; "Not played in the browser" names the toast and `lock-step-room-payload.test.mjs`. Traced below (section 3). |
| R2-CLIENT2 (minor) edited refusal tests | closed | `lock-step-real-flow.test.mjs` uses unpatched `generic_refusal` and asserts pane open, "That did not work", no "was sent", no "Requests sent"; `mfa-client-lock.test.mjs` uses `verify_dropped` (reason `expired`). `lock-step-push.js:162-163` clears the status line when `sent === 0 && !countEl.textContent`. Both files pass. |
| R2-CLIENT3 (minor) fourth dropped-pickup test | closed | The stub is now the real rule (`droppable === true` and held), `__dropped` is recorded, the test asserts a drop and no pad, plus a not-droppable twin. Passes. |
| R2-CLIENT4 (minor) no tray entry once opened; flag lock; docs | closed, with R3-CLIENT1 | `inventory-menu.js:127-131` (Open; no Unlock for `lockType === 'flag'`), `:213` icon, `:262` action; tests added in `inventory-menu.test.mjs`; A25 line updated. |
| R2-CLIENT5 (minor) font guard | closed | `BODY_MOUNTED` set in `minigame-font-16-default.test.mjs`, plus a test that reads `ui/lock-step-pane.js` for the body append and requires VT323 on every `-btn` rule of both sheets. Both sheets set `font-family: 'VT323'` on their button rules (`lock-step.css:49`, `lock-step-push.css:41`) and neither has a `.minigame-container` selector. Passes. |
| R2-CLIENT6 (minor) copy of the tray listener | closed | `lock-step-carried.test.mjs` loads a rewritten copy of the real `inventory.js`, builds the tray `<img>` with the real `addToInventory`, and dispatches a real `click`; the source regex is gone. See 2c. |
| R2-CLIENT7 (minor) nested title test | closed | `lock-step-pane-title.test.mjs` takes the captured `audit_zip` through the real password pad (diff); passes. |
| R2-CLIENT8 (minor) bridge hint | closed | `systems/test-bridge/index.js:1995` builds the hint from `menu.items`; a case in `test-bridge-lock-step.test.mjs` passes. |

## 2. The diff as new code

**2a. Tray "Open".** Shown for a droppable held item with `locked !== true` and (`Array.isArray(contents)` or
`hasContents === true`), first in the menu, mapped to `handleUnlock(el, 'item')`, which is the server-verified path
(`unlock-system.js:1038-1075`, the unlocked branch asks the server). Shipped menus unchanged: a scan of every
`scenarios/*/scenario.json.erb` for `"droppable": true` found `demo_access_tour` (cake, a text file) and
`test_access_keyring` (`lena_rdp_gift`, `ops_rdp_file`); none has `contents`, `hasContents` or `locked`, so none gains an
entry. Droppable is never set by code. The `inventory-menu` and tray tests above pass. A flag lock shows no "Unlock"
(`:126`), pinned by a test. See R3-CLIENT1 for the empty case.

**2b. Failed first request.** `lock-step-push.js:162-163`, reached only on the generic failure branch. The branch before it
(`too_soon`) already set the wait line; the new line cannot clear that. Sound.

**2c. `lock-step-carried` copy of `inventory.js`.** The test rewrites six import paths in the real source (it throws if an
import is missing, so a change to `inventory.js` imports fails loudly), loads it, and the click goes through the real
listener (`inventory.js:1054-1062`). The stubs are leaf collaborators; `inventoryBlockedByForcedMinigame` returns false, so
the guard's result is not tested, only that the listener calls it. The listener under test is the real one: if the listener
stopped calling `openInventoryItemMenu` first, test 1 would fall through to `handleObjectInteraction` and fail. Sound.

**2d. Font guard.** `BODY_MOUNTED` applies to the two sheets only and is backed by a test on the pane's body append. If
the pane were ever mounted inside `.minigame-container`, the new test's regex on `ui/lock-step-pane.js` would fail. Sound.

## 3. PLAYTEST 12d and 12e, traced to requests

- 12a: chat choice, `#unlock_door` style first factor accepted, pane opens, first `POST /mfa/prompt` (request 1).
  12b: X, silent. 12c: click door, `handleUnlock` door branch with `npcStepOpener` (`unlock-system.js:1096-1118`):
  `unlock('door', roomId, opener, 'npc')`, gate, pane, request 2. Matches "count of two".
- 12d: reload, bootstrap room carries `npcStepOpener`; the click runs the same branch; `runCount` increases (the pane ran), so
  no "Approved earlier" toast (`:1107`); the third request is approved on arrival, pane closes, `unlockTarget`, and
  `door_unlocked_by_npc` is emitted once with `retry: true` (`:1116`). Matches the script. The walk route (x 189, y 85, x 279) is
  not checkable without a browser; not re-run.
- 12e: fresh game, 12a request 1, "Send again" twice gives requests 2 and 3, approval on the third. That the owner approves
  the third request automatically is a server rule: **needs Opus** (I did not judge it; the server tree is being changed).
- 13d: the "Open" sentence matches 2a.

## New findings

### R3-CLIENT1 (minor): "Open" is offered for an emptied container

`inventory-menu.js:129` tests `Array.isArray(data.contents)`, so `contents: []` also gets "Open", and
`inventory-menu.test.mjs` ("S8c R2-CLIENT4: an opened droppable container ...") pins `locked: false, contents: []` to
`['Open', 'Drop here', 'Examine']`. The R2 instruction and the brief said "with contents". After the player takes the last
item out of the briefcase, the tray still offers "Open" and it opens an empty container.
Fix: `(Array.isArray(data.contents) && data.contents.length > 0) || data.hasContents === true`; change the first assertion
in that test to `['Drop here', 'Examine']` for `contents: []` and keep a non-empty case. Whether the carried briefcase's
`contents` array is emptied client-side when the player takes items is not shown in this diff; if it is not, the length
test never hides "Open" and the entry is harmless, so this stays minor.

### R3-CLIENT2 (needs Opus): "Open" sends a server unlock request for a held, unlocked container

`handleUnlock(el, 'item')` with no lock requirements posts `POST /unlock` with the method "unlocked"
(`unlock-system.js:1066-1075`). Whether the server accepts that for an item the player holds, and sends the contents back,
is a server rule; the client tests stub the network. Not judged here. Ask Opus to confirm with a Rails test on the held
briefcase after it was opened.

## Checked and found sound

- Failed first request, carried-item tray click, font guard, bridge hint, nested title: see sections above.
- `lock-step-room-payload.test.mjs` still pins the "Approved earlier" toast's true case and its absence when a pane ran.
- No server file touched by these commits (`git show --stat`).

Counts: 0 blocker, 0 major, 1 minor, 1 needs Opus.

Verdict: clean (the minor and the Opus question do not block).
