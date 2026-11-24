# Handover S5a unit 08: client policy helpers

Done. `public/break_escape/js/systems/pc-policy.js` and `test/js/pc-policy-admin.test.mjs` (new). No imports added, so no harness copy list changed.

Signatures (all named exports and in the frozen `pcPolicy`):
- `plantRefusal(heldItems, objectData, scenario, { admin = false } = {})`: only `admin === true` lets `list[0]` through (no refusal); otherwise unchanged.
- `sessionGrantPc(objectData)`: pc of the first `grant_foothold` with `needsSession`, depth-first through `triggerOnInteract` and `confirm_action.onConfirm`; conditions ignored; else null.
- `gatedRemove(item, objectData, scenario)`: `usbRefused(usbPolicyFor(objectData, scenario), classOf(item))`.

Gotcha: `lab-ux-ui.test.mjs` (pickup toast timing) failed once under load and passed on rerun; unrelated.
