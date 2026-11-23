# Handover: core step 4 (S1 client), done

Files: `public/break_escape/js/minigames/network-view/ops-model.js` (new), `.../network-view-minigame.js`,
`public/break_escape/js/api-client.js` (`networkScan`), `public/break_escape/css/network-view-minigame.css`
(appended block), `public/break_escape/js/systems/test-bridge/access.js` (comment only), `docs/test-bridge.md`,
tests `test/js/ops-model.test.mjs`, `network-view-ops.test.mjs`, `api-client-network-ops.test.mjs` (new),
`network-view.test.mjs` (one copy line), `test-bridge-access.test.mjs` (one test).

## perform contract (network-view-minigame.js `perform`, about :953)
`await scene.perform({ action, target }, { echo })` resolves `{ sent: false }` for a guard turn-away (key already in
`pending`, game not active, no such control: unplug needs `target === unplugJack` and `links.unplugFromView`;
sweep/scan need status ready and `ApiClient.networkScan`; any other action is turned away until S2/S3 add them),
else `{ sent: true, answer }` (also after a redraw or result throw: those are logged, the key is cleared in a `finally`). `answer` is the server body, a refusal body (`{ success:false, reason }`, taken from
`err.body` of a thrown 4xx), the unplug's `out` object, or `null` (throw, or no reply: `undefined` becomes `null`).
Key: `pendingKey(action, target)` from `ops-model.js` = `"<action>:<target>"`; `use` takes `{ card, finding }` ->
`use:<card>|<finding>`. `scene.pending` is a Set; `scene.onSent(offer, echo)`, `scene.onEnded(offer, answer)` are
instance properties, no-ops by default.
Order: guard; clear previous result (`clearResult`); key into `pending`; `onSent`; `redraw()` (pending look); request;
tail: `onEnded`; key removed; `redraw()`; `showResult(offer, answer)` (sweep/scan: folds the answer into `this.view`
through `applyScanAnswer`, or draws the refusal via `refusalText`; unplug: notice); then `afterAnswer` (unplug success:
`exitReason='unplugged'` and `complete(false)`; ops success: events then `refetchAfterOps()`). Hook throws are caught
(`console.warn`). `unplugBox()` is now a thin wrapper over `perform`; `_unplugging` is gone.

## Answer shapes assumed (check against the server half)
- `POST /network/scan` body params: `foothold` plus one of `network_id` / `host_id` (matches games_controller.rb).
- Sweep answer `{ success, already?, network: { id, swept: true, hosts: [rows] } }`; host answer `{ success, already?, host: row }`.
- Refusals `{ success:false, reason }` with status 400/403/404/422, read from `err.body.reason`.
- A device row `{ id, kind:'device', name, sprite?, responding?, scanned?, services? }`. Device rows draw like host rows with
  `data-host-id` and `data-kind="device"`, icon from `sprite` (only if it matches `^[A-Za-z0-9_-]{1,60}$`, file under
  `assets/objects/`), else `network_rack1.png`.
- The own network's discovery state comes from its block in `networks` (id == the foothold's own network): the view reads that
  block for Sweep/Scan and getTestState (`ownNetwork`), though the own rows stay in flat `hosts`. The own up block is still not
  drawn as a second block.
- A block counts as an ops block when it carries `swept` (true/false) or `ops: true`; only then does it get `data-network-id`.
- Scan is offered on any pc/device row in an `ops: true` block that is not `scanned` and not `responding === false`
  (the row does not say whether it declares services; a `not_needed` refusal is drawn from `REFUSAL_TEXT`).
- Not drawn: `address`, `cli` fields (skin only).

## getTestState additions (only present when there is something to say)
top level `pending` (array of keys, only while any), `ownNetwork: { id, swept?, ops?, sweep? }` (only if the own block has an ops key);
per further block `swept`, `ops`, `sweep` selector; per host/device row in an ops block (or scanned) `scanned`, `services`
(`{name,label,port,product,version}`), `scan` selector (only while offered). `findings`, `access`, `techniques`,
`selectedFinding` are S2/S3. Device rows' `action` is `'none'` or `'not_responding'`.

## Bridge
`window.__test.access.networkView(id)` already returned the whole entry (a JSON copy); only the doc comment, `docs/test-bridge.md`
and a pinning test changed.

## Events
`network_swept {networkId}` (+ `network_swept:<id>`), `network_host_scanned {hostId}` (+ `:<id>`), emitted after any success
(an `already` repeat included). `network_service_checked`, `network_finding_confirmed`, `network_technique_used/_refused` are S2/S3.

## Hooks for a live proof
`[data-network-id="<net>"] [data-action="sweep"]`, `[data-host-id="<id>"] [data-action="scan"]`, tiles `[data-service="<name>"]`.
Sweep on `test_ops_scan` (the discovery network opens empty), then Scan a device, read the tile line, then the pivot network.

## Tests
`ops-model.test.mjs` 10, `api-client-network-ops.test.mjs` 4, `network-view-ops.test.mjs` 17, `test-bridge-access.test.mjs` +1;
existing `network-view`, `minigame-consoles-fit`, `pc-monitor-frame`, `escaping-shared-helpers`, `patch-panel`,
`minigame-title-crisp-css` pass with no assertion edited. Only `network-view.test.mjs` copies the view into a temp folder
(copy line for `ops-model.js` added); the others read the source from `public/`.

## Gotchas
- A view left open keeps a refetch timer: node tests must end the minigame (`endMinigame`) or the file hangs.
- `ops-model.js` has no `window`/`document` use; a test greps for that.
- Stale refetches (S1 client R1 M1): `_opsEpoch` counts moves (a request going out, an answer folded in); a refetch that started before the count changed drops its answer. `refetchAfterOps` awaits the in-flight refetch (`_refetchDone`), then refetches with `sync:false`.
- Device rows are their own group, "Devices", after Computers and before File shares (R1 m5). A sweep or scan success keeps scroll and focus (`focusAfterMove`); a closed view is not redrawn (R1 m3). `showNotice(text, rowId, key)`: only a refusal passes a key (R1 m6).
- Not done: no live browser proof; `docs/ACCESS_AND_NETWORKS.md` and the feature index belong to the stage landing, not this step.
