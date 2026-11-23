# Handover S5a unit 10: gated removes in apply-actions.js

Done. Files: `public/break_escape/js/systems/apply-actions.js`, `public/break_escape/js/minigames/container/container-minigame.js` (ruled extra), `test/js/apply-actions-gated-remove.test.mjs` (10 tests). No new static import, so no harness copy list changed: `apply-actions.js` reads `window.pcPolicy` (`plantRefusal`, `gatedRemove`) and `window.pcSessions.plantAdmin` and does nothing gated when they are absent.

## For unit 11 (all named exports of `apply-actions.js`)
- `applyActions(actions, { source, gameId, objectId, objectData })`: the opt is `objectData` (the sprite's `scenarioData`); the `confirm_action` branch threads it to `onConfirm`.
- `plantsInFlight` (object ids) and `itemsInFlight` (item ids): `Set`s, filled from the send until every kind of answer.
- `sendGatedRemove(itemId, objectId, { gameId })`: the shared helper. Adds both ids to the sets, sends with `withBody`, empties the sets on every answer. Resolves `true` on success (the caller then removes the item from the tray and goes on). On anything else it shows the line through `gameAlert` (server `error` only, else "That did not go through. Try again."), emits `usb_refused:<objectId>` `{ objectId, itemId, usbClass: null }` when the body's `reason` is `usb_refused`, and resolves `false` (item stays). Use it in the `consumesItem` branch; do not copy it.
- `sendInventoryRemove(id, { usedOn, gameId, withBody })`: `withBody` true gives `true`, the 4xx refusal body (plain object), or `false` (network failure, 5xx after the retry, no body).
- `remove_item`: matches exclude items in flight; the pick is `pcPolicy.plantRefusal(matches, objectData, window.gameScenario, { admin: pcSessions.plantAdmin(objectData) }).item`, else the first match. Gated means `objectId`, an item id, `objectData` and `pcPolicy.gatedRemove(...)` true: the list stops there, the rest runs by a new `applyActions(rest, opts)` on success only. A `remove_item` for an object in `plantsInFlight` logs and does nothing.
- Unit 11 must also leave `itemsInFlight` ids out of its `requiresItem` match and skip an interact on an object in `plantsInFlight`.

## Ruled extra
`container-minigame.js` `loadLoginDesktop`: `window.pcSessions?.noteDesktopRefused?.(pcId, refusal?.reason)` in the `off` branch, the remote and `fromRoute` branches (before `exitReason`) and the relay off/not_responding branch (which the earlier relay 403 branch makes unreachable today). The method ignores other reasons, so `unreachable` keeps `access` (tested with the real mirror).
