# Access model slice 9.3b sub-slice I - code review R1 (CLIENT)

Scope: api-client.js (networkImplant), apply-actions.js (grant_foothold), network-links.js
(implant, one retry, tray reconcile bcb72c547), JS tests, scenarios/test_access_networks
(N11-N13) and PLAYTEST.md. Server grant logic (network_access.rb etc.) read only as far as
needed to judge the client contract. Reviewed at head 4456c6142 against main.

JS suites run alone, both green: test/js/network-links.test.mjs 39/0,
test/js/validator-network-model.test.mjs 38/0.

## Blocker

None.

## Major

### M1 - the implant tray reconcile can silently drop an unrelated tray item
`public/break_escape/js/systems/network-links.js:446-451`

`implant()` reconciles with the union of every id in the tray and every id in the server's
inventory:
```
const trayIds = (win().inventory?.items || []).map(it => it?.scenarioData?.id).filter(Boolean);
const ids = [...new Set([foothold.itemId, ...serverIds, ...trayIds])];
win().syncInventoryFromServer?.(body.inventory, ids);
```
`syncInventoryFromServer` (inventory.js:1265-1281) removes any id it is given that is in the
tray but not in `body.inventory`, and `removeFromInventory` has no guard - it removes whatever
matches. `body.inventory` is the server's full `player_state['inventory']` snapshot
(implant_foothold! returns `inventory: player_state['inventory']`). So the set of tray items
this call deletes is exactly "tray items absent from the server snapshot" - which is the
consumed device (intended) **plus any tray item whose own POST /inventory persist has not yet
committed**. `addToInventory` persists asynchronously and its callers do not await it
(inventory.js:652-669), and a `grant_foothold` is fired-and-forgotten from apply-actions, so a
device/key/note picked up or granted a moment before an implant fires is in the tray but not
yet in the server snapshot, and this reconcile removes it. It reappears only on reload (the
server copy is intact), so it is recoverable, but it is a silent mid-puzzle inventory loss.

Failure scenario: a dropped-stick implant (N11 shape) consumes nothing from the player's tray,
yet it still passes the whole tray to the reconcile; if an NPC beat or a pickup put an item in
the tray in the same tick and its persist is still in flight, that item vanishes from the tray.

Why it diverges: `plant()` (the 9.3a pattern, lines 396-398) passes only the two ids it knows
changed - `[foothold.itemId, deviceId]` - never the whole tray. `implant()` went broad because
the server does not tell the client which device it consumed.

Fix: match `plant()` - reconcile only ids the server explicitly says changed. Have
implant_foothold! return the consumed device id, and pass `[foothold.itemId, consumedId]`
(consumedId only for the `session` shape; `dropped` consumes nothing from the tray, so
`[foothold.itemId]` suffices). Never pass the whole tray: a tray id the server merely has not
synced yet must not be eligible for removal.

## Minor

### m1 - refusal toast renders server-authored text as HTML
`public/break_escape/js/systems/network-links.js:431`

`toast(b.error || 'That device was refused.', 'info', 4000)` calls `gameAlert` with no options,
so `plainText` is false and the message is interpolated into `innerHTML`
(notifications.js:218-219, 226). `b.error` is server/author text (USB_REFUSAL_LINES). The
established convention is plain text for author/server strings - interactJack's own confirm
flow passes `{ plainText: true }` (lines 351, 366-368). The brief calls this out explicitly.
The server constants are currently markup-free, so no live defect, but it violates the
convention and would surface any author-introduced markup. Fix: pass `{ plainText: true }` (the
toast helper would need to forward an options arg, which it currently drops). The pre-existing
plant() toasts share this gap; worth a follow-up but out of this slice's diff.

### m2 - test gaps around the reconcile, the retry and the dropped shape
`test/js/network-links.test.mjs:549-609`

Good coverage of success, consumed-device removal, already, usb_refused and not_ready, all on
the `session` shape. Missing:
- No test that an **unrelated** tray item absent from the server snapshot is *kept* - exactly
  the M1 regression goes unguarded. Add an item to the tray, omit it from `implantAnswer.inventory`,
  and assert it survives.
- No `dropped`-shape test (N11), though it is a distinct server path and the apply-actions
  mapping (`needsSession ? 'session' : 'dropped'`) chooses it.
- No test of the one-retry path: the mock throws the same error on every call, so a
  throw-once-then-succeed network retry cannot be exercised, and the successful-retry branch is
  untested. The mock needs a call counter to cover it.
- apply-actions.js `grant_foothold` has no JS test at all (shape selection, `action.pc`/
  `action.path` forwarding, the no-networkLinks warning branch).

## Nit

### n1 - _publishPlanted ordering differs from plant() on `already`
`network-links.js:454-457` - on an `already` response implant returns before `_publishPlanted`,
whereas plant() calls `_publishPlanted` *before* its `already` return (line 403-404). Harmless
in normal flow (the first implant already published), but the inconsistency is easy to trip
over if the planted-state global is ever read fresh after a reload. Align the two.

### n2 - lost foothold after both retries is silent
`network-links.js:440` / apply-actions.js:450-452 - a `grant_foothold` that fails twice resolves
to `{ action: 'error' }` and apply-actions only `console.warn`s it. The retry comment notes a
timer-fired beat never re-runs, so the foothold is lost for good with no player-visible signal.
Acceptable per the design note, but flagging: a dropped implant that the server would have
granted can be lost to two transient network errors with nothing on screen.

## Reachability (N11-N13)

All four room templates (room_reception/office/meeting/closet) are 10x10 with walkable interior
x:1-8, y:2-8. Every new object sits inside it on floor, adjacent to floor, with no tile clash:
kit_badusb {8,6}, kit_stick {6,6} (lobby, takeable, on floor); sam_dock {7,4} (desk_room);
kiosk_dock {7,4} (kiosk_room); door_dock {6,3} (store). Reachable. No finding.

## Other checks

- Retry idempotency: safe. implant_foothold!'s already-check precedes device consumption and
  the whole action is under with_game_lock, so a retry after a lost-but-committed first request
  hits the `already` branch and never double-consumes. No double-plant.
- apply-actions regressions: the new `grant_foothold` case is additive, `default` still present,
  give_item/remove_item/wear paths untouched.
- 9.3a jack plant(): unchanged.

## Verdict

Request changes. One Major (M1) - fix the over-broad reconcile before merge; it is a real,
if reload-recoverable, silent inventory-loss path and the targeted `plant()` pattern is readily
available. m1/m2 recommended in the same pass (add the kept-unrelated-item test alongside the
M1 fix). n1/n2 optional.
