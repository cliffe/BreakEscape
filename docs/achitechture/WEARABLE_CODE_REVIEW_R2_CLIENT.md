# Wearable items: code review, round 2 (client half)

Branch `build/wearable` at 6589ce444, worktree `.claude/worktrees/p-wearable`. Scope: the client
half of `git diff main...build/wearable` (`systems/wearables.js` and its hooks in `inventory.js`,
`inventory-menu.js`, `interactions.js`, `apply-actions.js`, `core/game.js`, `css/hud.css`, the JS
tests, the playtest skill note). The test bridge and the playtest tooling have no changes on this
branch. Not findings, by orchestrator decision: `unseenOnly` is a client check only; the records
door bypass is pre-existing and in the backlog.

Tests run (single files, in the worktree): `wearables.test.mjs` 24 of 24,
`wearable-hooks.test.mjs` 4 of 4, `inventory-menu.test.mjs` 18 of 18,
`apply-actions-hint-give.test.mjs` 7 of 7, `validator-wearable.test.mjs` 6 of 6. No browser run.

## Round 1 findings: checked

Each fix was removed in a scratch copy of the JS tree (the worktree was not touched) and the three
wearable test files rerun. Every mutation below turned at least one test red.

| R1 | Fix in the code | Mutation that a test catches |
|----|-----------------|------------------------------|
| 1 | `PLAIN` passed by the default `alert` and `confirm` (`wearables.js:109`, `:121-122`); `{ plainText: true }` on the drop refusal (`inventory-menu.js:145`); label by `textContent` (`:349`) | `PLAIN` dropped from alert, from confirm, from the menu drop; `textContent` swapped for `innerHTML` |
| 2 | `swapRefusal` checks the worn item's spec as well (`:173-175`, `:206`) | the `prevData` check removed |
| 3 | `refused()` again after each confirm (`:216`, `:296`) | either recheck removed |
| 4 | `exclusive` per window (`:130-146`) | the drop of a second non-forced call removed |
| 5 | `settle` returns false when `setCostume` fails, `putOnNow` undoes (`:153`, `:227-241`) | the return check removed |
| 6 | `restore()` deleted; `game.js:1682-1684` keeps the inline read | (live path untested, as agreed; W7 browser proof) |
| 7 | `wearable-hooks.test.mjs` | each of `onItemLeft` (`inventory.js:1171`), `decorateSlot` (`inventory.js:141`), the toggle route (`interactions.js:960-964`), the menu drop refusal; the 422 forced settle (`wearables.js:308`); the `take_off` action (`apply-actions.js:365`) |
| 13 | "someone" for no `displayName` (`:85`) | the old `displayName \|\| id` |
| m2 (server, client part) | `strayWornId` (`:269-277`) and `withGlobal` (`:250-255`) | either removed |

All text the module shows goes through `gameAlert`/`gameConfirm` with `plainText`, or `textContent`;
nothing else in the diff writes wearable text to the DOM. `unseenOnly` guards a wear, a removal
(tray and `take_off` action) and a swap, and a drop of the worn item from the menu.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Minor | In-flight guard | A `wear` or `take_off` inside `onWear` / `onRemove` (or run while a confirm is open) is dropped silently |
| 2 | Minor | Older games | First session after deploy: no frame, "Put on" on a vest already worn, and a drop leaves the client's worn global true |
| 3 | Nit | CSS | In a themed mission the inset keyline still does not show: the theme frame's `fill` paints over it |
| 4 | Nit | Accessibility | The hover label and the image `alt` do not say "worn"; only the 10px label does |
| 5 | Nit | Toast | Several unnamed watchers read "someone and someone are watching"; the first name shown can be "someone" when a named watcher exists |

## Blocker

None.

## Major

None.

## Minor

### 1. Nested `wear` / `take_off` are dropped with no trace

`wearables.js:136`: a non-forced call while a change is in flight returns false and logs nothing.
`putOnNow` and `takeOffNow` run `onWear` / `onRemove` (`:242-243`, `:312`) inside the lock, and
`apply-actions.js:358-367` calls `putOn` / `takeOff` from there. So an author's
`"onRemove": [{ "type": "wear", "itemId": "vest" }]` on a jacket ("take the jacket off and the vest
goes back on") never runs: checked with a probe against the real module, the nested `putOn`
returns false, one post (`coat`, `worn: false`) is sent, nothing is worn. The same happens to a
`take_off` from an NPC conversation or an event while the player has a tray confirm open, since
the confirm is awaited inside the lock (`:214`, `:295`).

Fix: log a warning when a call is dropped (`console.warn('[wearables] change already in flight,
dropped:', itemId)`), and either queue non-forced calls that come from actions (an `opts.queue`
that `apply-actions.js` passes, which waits like `force` does but keeps the `unseenOnly` check) or
run `onWear` / `onRemove` after `exclusive` has released. The validator can warn on `wear` /
`take_off` inside a wearable's own `onWear` / `onRemove`. Test: a coat whose `onRemove` wears the
vest ends with the vest worn (or, if dropped by design, with a warning logged).

### 2. A game in flight at deploy: the worn state is missing for the whole first session

The server reconciles an older game only from `merge_global_variables!` (`wearables.rb:26-37`, via
`game.rb:288`), that is on the first sync; the bootstrap (`games_controller.rb:305-306`) sends
`wornItem` from before it. So in a lab game where the old client put the vest on
(`courier_ready` true, `pp_disguise` courier, avatar dressed), `game.js:1682-1684` sets
`wornItem` null and for the rest of that session:

- the tray shows no frame or "(worn)", and the menu (`wearables.js:334-337`) says "Put on" for a
  vest the avatar is wearing; clicking it shows `confirmOn` and runs `onWear` again;
- `isWorn` (`:58-62`) is false, so `onItemLeft` (`:327-331`) does nothing when the vest leaves:
  a drop takes it off on the server (`release_dropped_worn_item!`), but the client keeps
  `courier_ready` true and the courier sprite until a reload, and the client-side records door
  gate (`playerMayPassIf: courier_ready`) stays open;
- the menu drop refusal (`inventory-menu.js:142`) is skipped for the same reason.

Only `takeOff` knows the stray case (`strayWornId`, `:269-277`). It affects only games started
before the deploy, once, so Minor.

Fix (client): let `isWorn` and `wornItemId` fall back to `strayWornId(null, w)` when
`gameState.wornItem` is null, or set `gameState.wornItem` from the first stray match once the
inventory is restored. Fix (server, alternative): have the bootstrap work out the would-be record
the reconcile would make, without saving, and send it as `wornItem`. Test: a rig with
`vest_on: true`, no `wornItem`, the vest held: `menuLabel` is "Take off" and `onItemLeft` posts
`worn: false` and clears `vest_on`.

## Nits

3. `hud.css:433-438`: the raised selector does win over `[data-ui-theme] .inventory-slot
   { box-shadow: none }`, but under a theme the slot has `isolation: isolate` and a `::before`
   frame at `z-index: -1` with `border-image-slice: ... fill` (`ui-themes.css:355-382`). Negative
   z-index children paint above the element's own background and box shadow, so the filled frame
   covers the inset keyline anyway; only the amber outline (painted last) shows. That reads fine.
   Either accept it and drop the second selector and its comment, or draw the keyline on
   `.tray-worn::after` above the frame.
4. `inventory.js:32-34`, `:800`, `:863`: the hover label and the image `alt` are the item name
   only. The "(worn)" span is real text in the slot, so it is read and it does not rely on colour,
   but at 10px it is small, and the hover label is where a mouse player reads names. Suggest
   `inventoryHoverLabel` adds " (worn)" when `window.wearables?.isWorn(scenarioData)` (the hover
   label is set on `mouseenter`, so it is current), or set `aria-label` on the slot in
   `decorateSlot`.
5. `wearables.js:89-97`: with unnamed NPCs the text can read "someone and someone are watching",
   or "someone and 3 others" while a named NPC is in the room. Sort named watchers first and say
   "2 people are watching" when no one has a name. Map order otherwise decides who is named, which
   is fine.

## Points checked and found right

- Reload: `game.js:1682-1684` sets `wornItem` before `processInitialInventoryItems` (`:2418`);
  every `addToInventory` ends in `refreshInventoryTray`, which calls `decorateSlot`, and the module's
  own catch-up (`wearables.js:367`) covers a tray drawn before it loads. The costume comes back from
  `pp_disguise` (`game.js:1873`), which the server keeps in step. No reload path calls
  `removeFromInventory`, so a reload never takes the item off.
- Drop: the menu refuses a drop of the worn item under watch (`inventory-menu.js:142`). An allowed
  drop calls `removeFromInventory` (`item-drop.js:221`), whose hook posts `worn: false` with
  `force`, alongside `persistDrop`. In either server order the result holds: `player_drop` takes
  the item off and out of the inventory, and the later `worn: false` gets `clear_stray_worn_globals!`
  (success) or a 422 that the forced path settles locally; the inventory `remove` is idempotent.
  The world copy keeps `wearable`, so a pick-up can be worn again. A drop that never lands
  (`returnToTray`) comes back not worn, which matches the server.
- Other inventory actions: `consumesItem` (`interactions.js:1005`), `remove_item`
  (`apply-actions.js:295`), consumables and network sync all go through `removeFromInventory`, so the
  worn item always comes off, by design without `unseenOnly`. The container minigame imports
  `removeFromInventory` but never calls it. `interactions.js:1026` (drop for other callers) is
  unreachable for a wearable because the toggle branch comes first.
- "And N others": one name, two names, then "first and N-1 others" with "are"; tested for 1, 2 and 3.
- Test quality: every R1 fix and every hook has a test that fails when it is removed (table
  above). The hook tests run the real `inventory.js` and `interactions.js` under jsdom with stubbed
  imports and assert the stubbed imports exist, so a renamed import fails loudly rather than
  passing.
- The skill note on `inventoryAct` and `dismiss` "Confirm" is accurate.

## Verdict

Ready to merge on the client side. No blockers or majors; every R1 client finding is fixed and has
a test that catches its removal. Finding 1 (log the dropped call at least) and finding 2 (only
games in flight at deploy, and only their first session) are small and worth doing before the lab
ships to students; the nits can wait.
