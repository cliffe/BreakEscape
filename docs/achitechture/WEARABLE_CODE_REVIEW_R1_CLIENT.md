# Wearable items: code review, round 1 (client half)

Branch `build/wearable`, worktree `.claude/worktrees/p-wearable`. Scope: the client side of the
engine `wearable` item field (`systems/wearables.js` and its hooks in `inventory.js`,
`inventory-menu.js`, `interactions.js`, `apply-actions.js`, `core/game.js`, `css/hud.css`), the
`scenarios/test_wearable` scenario and the JS tests. The server, the validator and the lab are
reviewed separately.

Spec: `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` section 4 and the user's decision of 2026-11-11
(both the worn frame and `unseenOnly`). Design and claims: `WEARABLE_BUILD_LOG.md`.

Tests run (single files): `wearables.test.mjs` 14 of 14, `inventory-menu.test.mjs` pass,
`validator-wearable.test.mjs` 6 of 6, `apply-actions-hint-give.test.mjs` 7 of 7. No browser run.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Major | Toasts, confirms | Watcher names, the item name, `confirmOn`/`confirmOff` and the server message reach `innerHTML` |
| 2 | Major | `unseenOnly` | Putting on a second wearable takes the first off in front of a watcher |
| 3 | Minor | `unseenOnly` | The watcher check runs before the confirm, not after it |
| 4 | Minor | Toggle | No in-flight guard: a quick double click posts twice and runs `onWear` twice |
| 5 | Minor | Costume | A failed `setCostume` still leaves the item recorded as worn |
| 6 | Minor | Reload | `game.js` inlines the bootstrap read; the tested `restore()` is never called |
| 7 | Minor | Tests | The five integration hooks have no test that fails when the hook is removed |
| 8 | Minor | Test scenario | W5's "Drop here is refused too" only holds when the vest is worn, which the sign does not say |
| 9 | Minor | Test scenario | No sign covers finding 2 (swap under watch) or a three-plus watcher toast |
| 10 | Nit | CSS | Under any `data-ui-theme`, `ui-themes.css` cancels the frame's black inner keyline |
| 11 | Nit | CSS | `font-weight: bold` on the GNF pixel font gives a smeared faux bold |
| 12 | Nit | Menu seam | `inventoryMenuFor` reads `ctx.window.wearables` but `menuLabel` falls back to the global window |
| 13 | Nit | Toast | An NPC with no `displayName` is named by its raw id |
| 14 | Nit | Interaction | A wearable's `triggerOnInteract` is silently never run |
| 15 | Note | Harness | `inventoryAct` "confirmed" on a confirm overlay is the documented meaning, not a bug |

## Blocker

None.

## Major

### 1. Author text rendered as HTML in the refusal toast and the confirms

`wearables.js:159`, `:170`, `:195` call `d.alert(...)`, whose default (`:118`) is
`w.gameAlert(msg, 'warning', title, 4000)` with no `options`. `gameAlert` goes to
`renderNotification` (`notifications.js:207-213`), which builds the title and message with a
template string into `innerHTML` unless `options.plainText` is true. The message carries NPC
`displayName`s (author text), the title is the item's `name`, and `:170` passes the server's error
message. `inventory-menu.js:143` shows the same refusal (drop) the same way. The confirm
default (`wearables.js:117`) calls `w.gameConfirm(text)` without `{ plainText: true }`, so
`confirmOn` and `confirmOff` also go to `innerHTML` (`notifications.js:317-325`).

This is the rule the brief names (names are author text: textContent, never innerHTML), and the
project's org-input rule. Fix: pass `{ plainText: true }` in both defaults:

```js
confirm: deps.confirm ?? ((text) => (w.gameConfirm ? w.gameConfirm(text, 'Confirm', 'Cancel', { plainText: true }) : Promise.resolve(true))),
alert: deps.alert ?? ((msg, title) => w.gameAlert?.(msg, 'warning', title || '', 4000, { plainText: true })),
```

and the fifth argument `{ plainText: true }` at `inventory-menu.js:143`. Add a test that the
default `alert` and `confirm` pass `plainText: true` (stub `gameAlert`/`gameConfirm` on the rig
window and leave `deps.alert`/`deps.confirm` unset), and one with a `displayName` of
`<img src=x onerror=alert(1)>`.

### 2. A swap takes an `unseenOnly` item off in front of a watcher

`putOn` (`wearables.js:157-160`) checks `changeRefusal` against the new item's spec only. If the
worn item has `unseenOnly` and the new one does not, the server takes the worn item off
(`:163-175`, its `onRemove` runs) with the watcher in the room. In `test_wearable` this is the
vest and the jacket: wear the vest in the changing room, walk into the office with Sam, click the
jacket, confirm. The vest comes off in front of Sam, which W5 says is refused. Any mission with
two wearables, one of them `unseenOnly`, has the hole.

Fix: in `putOn`, when something else is worn, also refuse on the worn item's spec:

```js
const prevId = wornItemId(d.w);
const prevData = prevId && prevId !== itemId ? heldItem(prevId, d.w)?.scenarioData : null;
const refusal = changeRefusal(item.scenarioData, 'change', d.w)
    || (prevData ? changeRefusal(prevData, 'change', d.w) : null);
```

(move the `prevId`/`prevSpec` lines above the check). Add a unit test (vest worn, Tom in the
room, `putOn('coat')` refused, no post) and a sign (finding 9).

## Minor

### 3. Watchers are checked before the confirm, not after

`putOn` (`:157-161`) and `takeOff` (`:193-197`) test `unseenOnly`, then await the confirm. NPCs
keep walking while the dialog is up (the dialog does not stop NPC behaviour), so an NPC can walk
in between the check and the click on Confirm. Fix: keep the early check (it saves a pointless
dialog) and run `changeRefusal` again after the confirm resolves true, before the post.

### 4. No in-flight guard on the toggle

`toggle` / `putOn` / `takeOff` have no busy flag. A wearable with no `confirmOn` (allowed by the
spec) clicked twice quickly sends two `worn: true` posts; both settle, `onWear` runs twice (two
hint toasts) and `wearable_put_on` fires twice. A `wear` action and a tray click can overlap the
same way. Fix: a module-level `let busy = false` set around the post and settle in `putOn` and
`takeOff` (return false when busy; `onItemLeft` should wait for the current call rather than drop,
for example by chaining on a stored promise).

### 5. A costume that fails to apply still records the item as worn

`settle` (`:125-137`) ignores `setCostume`'s return. `setCostume` returns false when the disguise
is missing or `applyCostume` fails (sprite atlas not loaded), and then writes no `pp_disguise`.
The tray shows the frame and the worn global is true while the avatar is unchanged. Fix: when
`setCostume` returns false, log a warning and post `worn: false` to undo, or at least warn loudly;
a test with a costume stub that returns false.

### 6. The bootstrap read duplicates `restore()`

`core/game.js:1682-1683` writes `gameState.wornItem` inline. `wearables.js:258-262` exports
`restore()` with the same logic and `wearables.test.mjs:213` tests it, so the tested function is
dead and the live path is untested. Fix: keep the inline read (the module loads later, by
`import()` at `:1684`), drop `restore()` and its test, or move the rule to a tiny pure helper both
use. Either way the reload claim (W7) rests on the browser proof alone today.

### 7. Integration hooks that no test would miss

Each of these lines can be deleted with every JS test still passing:

- `inventory.js:1171` (`onItemLeft` from `removeFromInventory`): the unit test calls `onItemLeft`
  directly. A drop, `remove_item` or network unplug would leave the costume on.
- `inventory.js:141` (`decorateSlot` from `refreshInventoryTray`): the rig's `refresh` calls
  `decorateSlot` itself (`wearables.test.mjs:79`).
- `inventory-menu.js:142` (the worn-item drop refusal in `openInventoryItemMenu`'s `drop`): only
  `inventoryMenuFor` labels are tested.
- `interactions.js:960-963` (the tray click routing to `toggle`).
- `wearables.js:203-205` (the forced take-off settling locally when the server answers 422, the
  case a drop or `remove_item` racing the server's own removal will hit).

Fix: one test per hook. `inventory-menu.test.mjs` already drives `openInventoryItemMenu` with a
`deps.window`; add a worn vest with `wearables.isWorn`/`changeRefusal` stubs and assert the drop is
refused and `dropInventoryItem` not called. For `removeFromInventory`, a source test in the style of
the harness copies, or a minimal DOM stub, asserting `window.wearables.onItemLeft` is called with
the removed item. For `:203-205`, a rig with `post` rejecting and `force: true`: assert the global
goes false and the costume clears.

### 8. W5's drop refusal needs the vest worn

`scenario.json.erb:153`: "Click the vest in your inventory: it is refused ... Drop here is refused
too." W4 ends with the jacket taken off, so the player reaches W5 wearing nothing. "Put on" is
refused (good), but `inventory-menu.js:142` refuses a drop only for a worn item, so "Drop here"
works and the vest lands on Sam's floor. Fix the sign: "Wear the vest in the changing room, then
come here. Click it: Take off is refused, and Drop here is refused too. Taking it off or putting it
on are both refused while Sam watches."

### 9. Sign coverage

W1 to W8 cover: put on and take off with confirm, frame and label (W1, W2), the `take_off` and
`wear` actions (W2, W3), one at a time (W4), refusal and an ignored teammate (W1, W5), drop (W6),
reload (W7), a forced removal under watch (W8). Not covered: the swap under watch (finding 2), a
toast with three or more names (only the lab's floor shows it, not rerun after the change), an NPC
in the neighbouring loaded room not counting (implied by W5's "go back", worth saying aloud), a
declined confirm. KO'd and hidden NPCs cannot be shown here (`disableAttacks: true`) and are unit
tested, which is enough. Fix: add a W5b sign for the swap and a second person NPC plus one more in
the office for the "and N others" form, or state in the sign that the office shows "Sam Ellery is
watching" and the lab shows the long form.

## Nits

10. `hud.css:431-435`: `ui-themes.css` loads after `hud.css` (`games/show.html.erb:30`, `:101`)
    and `[data-ui-theme] .inventory-slot { box-shadow: none; }` has the same specificity as
    `.inventory-slot.tray-worn`, so in every themed mission the black inner keyline goes and only
    the amber outline is left. The outline still reads; if the keyline matters, raise the selector
    (`#inventory-container .inventory-slot.tray-worn`) or move the rule into `ui-themes.css`.
    Both look acceptable, no new art is drawn, and 10px GNF matches the combat button labels.
11. `hud.css:448`: GNF has no bold face; `font-weight: bold` makes the browser smear it. Drop it;
    the black-on-amber block is legible without it.
12. `inventory-menu.js:98`: `menuLabel?.(data)` is called without the window it found, so a test
    passing `ctx.window` must wrap `menuLabel` (as `wearables.test.mjs:222` does). Pass it:
    `.menuLabel?.(data, ctxWindow)`.
13. `wearables.js:85`: `npc.displayName || npc.id` shows ids such as `guard_02` to the player.
    Prefer "someone" when there is no `displayName`.
14. `interactions.js:960`: a wearable item that also carries `triggerOnInteract` never runs it.
    That is the right precedence; a validator warning would make it visible to authors.

## Points checked and found right

- Menu order: a droppable wearable gets "Put on" or "Take off", "Drop here", "Examine"
  (`inventory-menu.js:96-104`); a non-droppable one has no menu and its click toggles. The label is
  worked out when the menu opens, so it follows the worn state.
- Frame and label: drawn in CSS with no image, toggled per slot by `decorateSlot`, label by
  `textContent`, removed when the item comes off or moves (W4 test at `wearables.test.mjs:172`).
  The slot is `position: relative`, the label sits inside the 80px strip, the badge is top right so
  they do not collide.
- "In the room": `person`, same `roomId` as `currentPlayerRoom`, `isVisible !== false`, not
  `isNPCKO`, not in `seenBy.ignore`. It matches the sight challenge's room rule
  (`npc-sight-challenge.js:194-200`) less line of sight, as designed. An NPC behind a wall in the
  same room counts (by design: "a change in the open"); an NPC in a neighbouring loaded room does
  not, even across an open doorway. Between rooms (`currentPlayerRoom` not a string) nobody counts.
  `npc-behavior.js:842` keeps `roomId` current for patrollers, and `npc-manager.js:1718` keeps
  `isVisible` current.
- Leaving the inventory: every client removal path goes through `removeFromInventory` (drop
  `item-drop.js:221`, `remove_item` `apply-actions.js:295`, `consumesItem` `interactions.js:1005`,
  consumables, and network plants and unplugs via `syncInventoryFromServer`), so the hook at
  `inventory.js:1171` catches them all, with `force` skipping `unseenOnly` (W8). The world copy of
  a dropped wearable keeps its `wearable` field (`item-drop.js:229`), so W6's re-wear works.
- `wear` waits for earlier `give_item`s in the same list and then polls up to 3 s; `take_off` with
  no id takes off whatever is worn. Neither confirms; both obey `unseenOnly` (and an author's later
  actions in the same list still run after a refusal, which authors should know: worth one line in
  the README).
- Other missions: only `test_npc_needs` uses `set_costume`, with no wearables; nothing else reads
  `pp_disguise` beyond `reapplyPersistedCostume`, so no existing costume flow changes. A
  `set_costume` while a wearable is worn would leave the record and the avatar disagreeing; the
  validator's warning covers that.

## Note: the `inventoryAct` "confirmed" report

`test-bridge/index.js:1489` treats `confirmEffect`'s result as success. For a click that opens a
`gameConfirm` raised by the target's own handler, `confirmEffect` (`:241-276`) returns
`{ confirmed: true, via: 'overlay', overlay: { text } }`: "confirmed" there means "the click had an
effect", the same meaning it has for every interaction, and the overlay text is in the result. It
does not mean the Confirm button was pressed, and the bridge never presses author buttons by
design. So this is not a harness bug, and the builder's skill note ("follow it with `dismiss`
'Confirm'") is the right fix. A cheap improvement, optional: when `via === 'overlay'` and the
overlay is a `game-confirm-dialog`, add `awaitingConfirm: true` and a hint naming the dismiss step,
so a run that forgets it fails loudly at the next step rather than silently.

## Verdict

Not ready to merge. Fix findings 1 and 2 (both small) with their tests, correct the W5 sign, and
add the missing hook tests in finding 7; findings 3 to 6 are quick and worth doing in the same
round. The design matches the spec and the user's decision, the menu order and the frame are
right, and the removal paths are all covered by the one hook.
