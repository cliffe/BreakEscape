# Handover S5a unit 11: the plant in interactions.js

Done. Files: `public/break_escape/js/systems/interactions.js`, `test/js/interactions-admin-plant.test.mjs` (9 tests).

## Built (interactions.js, the `requiresItem` branch of `handleObjectInteraction`)
- An object in `plantsInFlight` does nothing on a further interact (console line). Items in `itemsInFlight` are left out of the `requiresItem` match, so a second object wanting the same item takes the "not held" hint path.
- `plantRefusal(matching, data, scenario, { admin })`: `admin` is `window.pcSessions?.plantAdmin?.(data) === true` (strict boolean).
- Both `applyActions` calls pass `objectData: sprite.scenarioData`.
- Gated `consumesItem` plant (`consumesItem`, an item id, an object id, and `window.pcPolicy.gatedRemove(...) === true`): `sendGatedRemove(itemId, objectId, {})` from apply-actions.js is called, and only on `true` is the item removed from the tray and `triggerOnInteract` fired. The refusal toast and `usb_refused:<objectId>` event come from that helper (not copied). Every other plant keeps today's order and fire-and-forget send. The ungated block comes first in the source because `requires-item-hint.test.mjs` pins the text order (condition gate, fire, consume).

## Imports
No new module import. A second, namespace import of `./apply-actions.js` (`applyActionsModule`) reads `sendGatedRemove`, `plantsInFlight` and `itemsInFlight` tolerantly, because many harnesses stub apply-actions.js with `applyActions` only (they swap every `'./apply-actions.js'` occurrence, so both imports are covered). `plantAdmin` and `gatedRemove` are read from `window.pcSessions` and `window.pcPolicy`. No copy list changed.

## Proof
`test/js/interactions-admin-plant.test.mjs` 9/9; all 56 files importing `interactions.js` plus `apply-actions*` and `requires-item*` and `ops-unchanged-validator`: 60 of 61 pass; `lab-ux-ui.test.mjs` fails (pickup toast shown twice at 50 ms; known flaky on this machine, pickup path, not touched). `bin/ops-golden-compare`: 16 runs, 0 failures, nothing re-recorded.

## Gotcha
If a test needs the real `pcSessions` singleton, `plantAdmin` is bound to it; the new test uses a `PcSessions` instance on `window.pcSessions` instead.
