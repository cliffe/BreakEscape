# Access model slice 9.3b sub-slice I (implants): code review R2

Adversarial, fresh-eyes review of the slice's own changes (`git diff main...build/9-3b-i`,
excluding W and P which came in through the merges and are already on main). Scope: server
authority, inventory reconciliation, interaction with W and P, save/reload, plain-text output,
validator, test coverage and the live-proof claims.

Main files reviewed: `app/models/break_escape/network_access.rb`,
`public/break_escape/js/systems/network-links.js`, `app/controllers/break_escape/games_controller.rb`,
`config/routes.rb`, `app/policies/break_escape/game_policy.rb`, `lib/break_escape/network_model.rb`,
`public/break_escape/js/api-client.js`, `public/break_escape/js/systems/apply-actions.js`,
`scripts/validate_network.rb`, `scripts/scenario-schema.json`, and their tests.

## Verdict

Server authority is sound. A tampered client cannot implant without the declared action, the held
session and device (session shape) or the server drop record (dropped shape); it cannot implant
twice (the already-held branch); and nothing about an un-earned foothold's network reaches the
bootstrap or the room/scenario routes. Item consumption and footholds are decided server-side. The
one real defect is a tray-reconcile gap on the retry path, raised as a Major. The P (port security)
interaction is correct: implants never touch a jack, so port security does not apply, and the USB
policy hook is the implant's own refusal. Save/reload keeps implant footholds (the link item is
rebuilt from the foothold record). Toasts go out plain-text.

Touched tests run clean (see end).

## Blockers

None.

## Majors

### M1. A lost response on the retry path leaves the consumed device in the tray

`app/models/break_escape/network_access.rb:405-409` (already-held branch) and
`public/break_escape/js/systems/network-links.js:460-468` (reconcile).

`implant()` runs one retry on a network error precisely because the firing timer/interaction is
saved fired and never re-runs (network-links.js comment at the retry loop). The retry exists for
the case where the first POST reaches the server, grants the foothold and consumes the device, but
the *response* is lost. On the retry the server takes the already-held branch, which returns
`inventory` but no `consumedId`:

```ruby
if network_footholds.key?(foothold_id)
  return { status: :ok, body: { success: true, already: true, first: false,
                                foothold: foothold_for_client(foothold_id), inventory: player_state['inventory'] } }
end
```

The client then reconciles only `[foothold.itemId]` (consumedId is absent), so the device the first
call consumed is never removed from the tray. It stays visible, and apparently usable, until a
reload rebuilds the inventory from the server. No duplication exploit (the server copy is gone, so a
second use answers `not_ready`), but the tray is wrong for the rest of the session, in the exact
robustness path the slice added. The non-retry success path is fine; the JS retry test
(`network-links.test.mjs`) only covers throw-then-fresh-success, not throw-after-server-success, so
it misses this.

Fix: name the consumed device in the already-held branch, from the stored foothold record, so the
client reconciles it on the retry just as on the first success:

```ruby
if network_footholds.key?(foothold_id)
  held = network_footholds[foothold_id]
  consumed = held.is_a?(Hash) && held['device'].is_a?(Hash) ? held['device']['id'] : nil
  return { status: :ok, body: { success: true, already: true, first: false, consumedId: consumed,
                                foothold: foothold_for_client(foothold_id), inventory: player_state['inventory'] } }
end
```

The client already pushes `body.consumedId` into `ids` when present, so no client change is needed.
Add a JS test: first `networkImplant` throws a network error *after* the server would have granted
(mock returns `already: true` with no consumedId on the retry), and assert the consumed device is
removed from the tray. The dropped shape stores no `device`, so `consumed` is nil there, matching
its first-call behaviour.

## Minors

### m1. `consumedId` depends on the held device carrying an `id`

`app/models/break_escape/network_access.rb:435,458` and `scripts/validate_network.rb:489-499`.

`inventory_item_matching` matches `needsHeld` by id, type or name, but `consumedId` is
`device_copy['id']`, and `syncInventoryFromServer` keys tray items on `id` only. If a scenario names
`needsHeld` by type or name and that device object has no `id`, `consumedId` is nil and even the
normal success path never removes the device from the tray. Every fixture here gives the device an
id, so it is latent. Fix: in the validator's session branch, after resolving the `needsHeld` item,
error if the named device object has no `id` (an id-less device cannot be reconciled), e.g. beside
the existing `needsHeld` checks around `scripts/validate_network.rb:490`.

### m2. Validator host-tracking skips timers and onConfirm, so two session-shape guards go dark there

`scripts/validate_network.rb:454,462`.

`host_action_keys` is `triggerOnInteract onInteract conditionalActions completionActions`. It omits
`timers` and `onConfirm`, both of which `DeclaredGrants.executed?` treats as server-run. A
`needsSession` grant_foothold placed in a timer's `actions` therefore has `host = nil`, so the "on
the sign-in PC it targets" and "host sets consumesItem" checks are silently skipped for it. A
session-shape action on a timer is unusual (the player must hold the session and device at the
instant the timer fires), but it is accepted by the server, so the validator should either cover it
or state that those two guards apply only to object-hosted actions. Fix: add `timers` to the host
set (carry the timer node as host when descending into `timers[i].actions`), or document the
limitation in the comment at `scripts/validate_network.rb:452`.

## Nits

### n1. Author-set `path` on the action becomes load-bearing

`app/models/break_escape/network_access.rb:377-381`. `grant_foothold_action_for` matches on `path`
when the client sends a non-empty one (`apply-actions.js` forwards `action.path`). The validator
guarantees one action per `[pc, shape]`, so path is never needed to disambiguate; but if an author
ever adds a `path` property to the action node whose value is not the server's computed
`path_string`, the match fails and the implant silently no-actions. Since nothing needs it, consider
dropping the path tie-break entirely, or keep the current comment that documents it as non
load-bearing.

### n2. Build-log "open items" is now stale in its favour

`docs/achitechture/ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md` (I section, "Open / not done") still lists
the no-exposure implant case as not added, with a parenthetical that it was closed in R1. The test
`network_no_exposure_test.rb` does carry the implant `not_ready` case now, so the line reads as a
contradiction. Tidy the wording. No code impact.

## Checks that passed

- Server authority: no-action (404), bad shape (400), twice (already), session needs non-foothold
  session + held device, dropped needs the server drop record, USB policy refusal keeps the device.
  Covered by `network_implants_test.rb` and asserted no-leak by `network_no_exposure_test.rb`.
- Reconciliation on the first success: only the link item and the one `consumedId` device move; an
  unrelated, not-yet-synced tray item survives (`network-links.test.mjs`).
- W and P interaction: Wi-Fi and implant footholds coexist (distinct `via`, distinct ids, shared
  `seq` counter); port security is a jack-only refusal and does not reach implants; the USB hook
  reuses `AccessWork.plant_refused?`, the same table pc-policy.js uses.
- Save/reload: implant foothold's link item is rebuilt from the stored record via
  `link_item_for`'s `via == 'implant'` branch; `footholds_for_client` carries sprite/observations.
- Plain text: the `toast()` wrapper passes `{ plainText: true }`; `notifications.js` writes
  `textContent`, so a `<` or markup in a server/author string renders literally.
- Validator: server-run gate, neither/both shape, pc-not-a-sign-in-host, missing/unknown needsHeld,
  action-on-its-own-PC, host-consumesItem, duplicate [pc, shape], and the USB-policy warning, all
  reusing `DeclaredGrants.executed?` so "declared" means one thing in both places.
- Live-proof claims (build log, :3026, 17/18 checks, leak scan over 39 responses) are consistent
  with the implementation; not re-run here.

## Test run (R2)

- `bin/test-js test/js/network-links.test.mjs test/js/grant-foothold-action.test.mjs test/js/validator-network-model.test.mjs`: 3 files passed, 0 failed.
- Rails `test/controllers/break_escape/network_implants_test.rb test/controllers/break_escape/network_no_exposure_test.rb test/unit/network_model_test.rb` under the shared lock: 37 runs, 1731 assertions, 0 failures, 0 errors, 0 skips.
