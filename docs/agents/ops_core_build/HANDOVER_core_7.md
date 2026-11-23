# Handover: core step 7 (S2 client), done

Files: `public/break_escape/js/minigames/network-view/ops-model.js` (S2 block at the end), `.../network-view-minigame.js`,
`public/break_escape/js/api-client.js` (`networkCheck`, `networkConfirm`), `public/break_escape/css/network-view-minigame.css`
(appended block), `docs/test-bridge.md`; tests `ops-model.test.mjs`, `network-view-ops.test.mjs`, `api-client-network-ops.test.mjs`,
`test-bridge-access.test.mjs` (+1). `access.js` untouched (the entry already came back whole). Not touched: Ruby, scripts, scenarios.

## Answer shapes assumed (server builder builds to the plan text; check against it)
- `POST /network/check` params `foothold, host_id, service`; answer `{ success, already?, hostId, service, findings: [finding] }`.
- `POST /network/confirm` params `foothold, finding_id` (the built id, never the alias); answer `{ success, already?, finding }`; a confirmed
  finding carries `needs: [{ kind, label, met }]` (and `fixed`), a false one carries its reason under the key `falseBecause` only (R1 m1: the `because` and `reason` fallbacks were removed; `falseReason` in ops-model.js).
- A finding on a host row: `findings: [...]` beside `services`; each `{ id, alias, hostId, service, class, severity, summary, status }`.
- Refusals `{ success:false, reason }`, 4xx, read from `err.body`. All 12 codes were already in `REFUSAL_TEXT`; none added.

## perform
Accepts `check` (target `"<hostId>:<service>"`, key `check:<host>:<service>`) and `confirm` (target the finding id, key `confirm:<id>`). The guard turns away
(`{sent:false}`): no such tile (host not scanned, powered down, unknown service), no such unconfirmed finding on a responding host, an alias instead of an id,
the API function missing. `OPS_ACTIONS` is exported from the view. Success: the answer is folded in at once (`applyOpsAnswer`), then events, then the refetch.
A check with no findings draws `NO_FINDINGS_TEXT` as a notice (not a refusal, so not from REFUSAL_TEXT). A refusal notice is keyed to the control; `noticeTargetListed` knows check and confirm keys.

## DOM and hooks
Tile `li.network-service[data-service]` holds `.network-service-line` (the S1 line text; the S1 test now reads that child), `button[data-action="check"]`, and
`ul.network-findings` of `li.network-finding[data-finding="<alias>"][data-status]`. A finding: head (alias, class word, severity word, status word, `.network-finding-fixed` only if
confirmed and `fixed`), `.network-finding-summary` (the server's `summary` as sent; the client's `CLASS_DEFAULT_LINE` table was removed in R1 m2, the server's `CLASS_SUMMARIES` is the one table), `button[data-action="confirm"]` while unconfirmed on a responding host, `ul.network-finding-needs > li.network-need[data-met]`
(tick or cross mark plus "<label>: yes|no" in `.network-need-text`), `p.network-finding-reason` for a false one. `data-action` is on ops controls only. No `select-finding` yet (S3).
Pending look: "Checking..." / "Confirming...", disabled. Focus stays inside the tile after a move (focusedControl/restoreFocus now carry a `sub` = finding alias or service).

## getTestState (per host row in an ops block, only when there is something)
`checks: { <service>: selector }` (only while Check is offered), `findings: [{ alias, id, service, class, severity, summary, status, fixed, needs, reason, confirm? }]` (alias order; `confirm` selector only while offered).
Top-level `selectedFinding`, `techniques` are S3.

## Events
`network_service_checked { hostId, service }` (+ `:<hostId>.<service>`), `network_finding_confirmed { findingId, status }` (+ `:<findingId>`), after any success including `already`.

## R3-2
`_refetchDropped = false` set in the constructor (test pins it).

## Tests
`ops-model.test.mjs` 14, `network-view-ops.test.mjs` 42 (S2: 14 added incl. hostile summary/need label/decoy reason, cli not drawn, guard, double press, hooks, refetch-while-pending, focus),
`api-client-network-ops.test.mjs` 7, `test-bridge-access.test.mjs` +1. No new import in the view, so no harness copy list changed.

## Live proof should click
Scan a device on `test_ops_*`, press Check on a tile, read the alias, class, severity and line; Confirm a finding: a real one shows needs with tick/cross, a decoy shows its reason; Check again (alias kept, no second row);
a long summary and a long need label wrap inside the card (no browser run here: layout is unproven).

## R1 changes (S2 client fix pass)
- `focusedControl` returns null when focus is in the list but on no control; `perform` takes the focus and epoch inside its `try` (M1).
- `findingSummary` returns the server's `summary` only; `getTestState().findings[].summary` is that string (m2).
- Check and confirm answers replace a held finding by id, in place (m3). The empty-check line is keyed to the control (m4).
- A severity reaches a class attribute only through `severityClass` (a known key, m7). Open: m8 deferred to the live proof.
