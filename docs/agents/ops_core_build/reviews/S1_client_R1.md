# S1 client R1 (build step 4, commit 559f36023)

Reviewer: read-only. Findings appended per check.

Read by `git show 559f36023:<path>`. NV = `public/break_escape/js/minigames/network-view/network-view-minigame.js`,
OM = `.../network-view/ops-model.js`, plan = `docs/achitechture/OPS_CORE_PLAN.md`.
Node tests run (read-only): `ops-model`, `network-view-ops`, `api-client-network-ops`, `network-view`,
`test-bridge-access`, `minigame-consoles-fit`, `pc-monitor-frame`, `escaping-shared-helpers`: 8 files pass.
No browser check was made; everything below is from reading the code.

## Check 1: the two halves agree

Traced, server line to client line (server files at the same commit):

| Thing | Server builds | Client reads | Agrees |
|---|---|---|---|
| Request body | `games_controller.rb:1827-1838` (`foothold` + exactly one of `network_id`/`host_id`) | `api-client.js` `networkScan` | yes |
| Sweep answer `{success, already?, network:{id, swept, hosts}}` | `network_ops.rb` `scan_network!` (hosts = `network_rows`, PCs, devices, then shares) | OM `applyScanAnswer` sweep branch; rows replaced whole | yes |
| Host answer `{success, already?, host: row}` | `scan_host!` -> `ops_host_row` | OM `applyScanAnswer` scan branch, merge by id | yes |
| Refusals `bad_request` 400, `not_found` 404, `not_responding` 403, `not_needed` 422, body `{success:false, reason}` | `ops_bad_request`, `NOT_FOUND_BODY`, `ops_refusal`, controller 400 | `api-client.js:47-58` puts the parsed body on `err.body`; NV `_request` (:1000-1010) reads `err.body.reason`; all four in `REFUSAL_TEXT` | yes |
| Block `swept`, `ops` | `ops_block_fields` (merged in `network_blocks`:804; down blocks get `swept` but never `ops`) | OM `offersSweep`, `blockHasOps`, `isOpsBlock` (all skip `route: 'down'`) | yes |
| Own network | own up block is in `networks` (via nil) and its rows also in flat `hosts` (`network_view`) | NV `ownOpsBlock` (:648) finds the block by `view.network.id`; rows from `hosts` | yes |
| PC row `scanned`, `services`, `responding` | `host_row` -> `ops_add_host_fields!` | OM `offersScan`, `rowServices` | yes |
| Device row `id, kind:'device', name, sprite?, responding?, scanned?, services?` | `ops_device_row` | NV `deviceRowHtml`, `deviceIcon`, `rowState` | yes |
| Service `name,label,port,product,version` (+`cli`) | `ops_service_row` / `SERVICE_KEYS` | OM `rowServices` (drops `cli`, by design) | yes |

No key is read that the server never sends, and no nesting differs. `address`, `cli`, `headless` and a PC's
`sprite` are sent and not read (skin only, as the handover says). A 4xx body with no `reason` (a policy or CSRF
refusal) falls to the `no_answer` line, which is acceptable. Notes, not mismatches:

- The sweep answer carries no `ops` (plan line 1229 gives `{id, swept, hosts}` only), so after a sweep the Scan
  controls appear only when the refetch lands. That is the plan's split, but it makes finding M1 more visible.
- Scan is offered on every answering host of an `ops` block, service-less ones included; they answer 422
  `not_needed` and keep offering Scan. This is the plan's intent (line 1274: `ops` says only that scanning is
  worth trying).

## Check 2: perform and the pending guard

Order at NV:953-978 matches plan 645-668: guard, `clearResult`, key in, `onSent`, `redraw`, request, then
`onEnded`, key out + `redraw`, `showResult`, and only then `afterAnswer` (`complete(false)` for unplug).
`_unplugging` is gone; `unplugBox` (:938) is a thin wrapper; `unplugHtml` reads the set. Hooks are instance
properties called through `_runHook` (try/catch + `console.warn`), so the skin sets them without touching
`perform`. A second press is turned away before any hook or call (tested).

### m1 (minor) NV:963, :973-975: the tail is not `finally`-shaped
Plan 656 ("one `finally`-shaped tail, run on every ending"). The first `this.redraw()` (:963) sits outside the
`try`. If `render()` throws there (a malformed row, say), `perform` rejects with the key left in `pending`, and
that control is dead until the view is reopened. Likewise a throw from the tail's `redraw()` (:973) skips
`showResult`. Fix: wrap from the key going in to the key coming out in `try { ... } finally { this.pending.delete(key) }`,
and guard each redraw with a try/catch that warns.

### m2 (minor) NV:966, :977: a reply of `undefined` is not turned into `null`
Plan 639-641 and 657 ("no reply ... with `answer = null`"). `answer = await this._request(...)` keeps
`undefined` when the call resolves with nothing, so `onEnded(offer, undefined)` and `{ sent: true, answer: undefined }`
go to the skin. Fix: `answer = (await this._request(...)) ?? null`. The test at
`network-view-ops.test.mjs:268` is titled "and one with no usable reply" but only makes a throw (see T1).

### m3 (minor) NV:1035-1048, :1055-1070: the result is drawn and the view rebuilt after the view has closed
If the player closes the view, or clicks Sign in (handover), while a scan is out, the answer still runs
`showResult`, which calls `this.render()` (:1047) on a view whose `cleanup` has run (`redraw` checks `_reported`,
`showResult` does not). `render` calls `setConsoleTitle` and `showHeader`; whether that can touch the screen that
replaced it was not traced. Fix: in `showResult` return early for sweep/scan when `this._reported || this._ending`
(still fold the answer into `this.view` if wanted); the events in `afterAnswer` can stay.

## Check 3: ops-model.js is pure, one refusal table

OM has no import and no `window`/`document` (a test greps for it). `REFUSAL_TEXT` is the only place a code
becomes words; NV words refusals only through `refusalText` (:1051). The unplug line
("The port did not respond. Try again.", :1042) and the server's unplug `message` are the old unplug wording the
plan keeps (line 629-630), not a `reason` code. No finding.

## Check 4: unchanged view

Read the whole NV diff. For an answer with no `swept`/`ops`/`scanned`/`services`/device rows: `sweepHtml(null)`
and `scanHtml`/`servicesHtml` give `''`, `data-network-id` is added only for an ops block, and the row and block
strings are the same bytes. `getTestState` builds the same keys in the same order (`rowState`), adding
`pending`/`ownNetwork`/row ops keys only when present. `test/js/network-view.test.mjs` changed by one line (the
copy of `ops-model.js`), no assertion. One behaviour change on the old path, allowed by the plan: an unplug press
now redraws the whole list through `render()` (twice) instead of only relabelling the button; scroll and focus
are put back. No finding.

## Check 5: UI rules

- Server strings go into the HTML through `escapeHtml` (names, service line, `data-service`, `data-network-id`,
  `data-host-id`), not `textContent`. The orchestrator's check asked for `textContent` only; the plan (5.5, lines
  1120-1123) allows "the same two helpers or `textContent`", and the hostile-string test covers name, label,
  product, version and the notice. `escapeHtml` escapes both quotes, so attribute use is safe. Not raised as a
  finding; say so if `textContent` only is wanted.
- The device sprite is checked against `^[A-Za-z0-9_-]{1,60}$` before it becomes a path (`deviceIcon`, :763), and
  the result is escaped; the fallback `network_rack1.png` exists.
- CSS: 2px solid borders, no radius, shadow or blur, no font override. Controls are `<button type="button">`.
  `data-action` values added are only `sweep` and `scan`; Unplug keeps `data-unplug`.

### m4 (minor) NV:1045-1048: keyboard focus and scroll are dropped after a successful sweep or scan
Plan 1117 (every control a focusable button, the path works from the keyboard). On success `showResult` calls
`this.render()` with no scroll or focus restore (the refetch path and `redraw` both do it), and the pressed
control no longer exists, so focus falls to the page body and a keyboard player tabs from the top after every
move. Fix: keep `scrollTop`, and after a success focus the next control in the same row or block (the first
`[data-action]` inside `[data-host-id=target]` or `[data-network-id=target]`).

### m5 (minor) NV:159-160: device rows sort last, under "Other devices"
`KIND_RANK` and `KIND_GROUPS` have no `device` entry, so a device row is ranked 4 and headed "Other devices",
below shares and printers, while the server lists hosts and devices before resources (`network_rows`) and the plan
calls both "host rows" (line 111-113). Fix: add `device` to both tables, ranked straight after `pc` (for example
"Devices"). A design call; raise or drop as the orchestrator sees fit.

### m6 (minor) NV:1012-1015, :1049-1051: the refusal line's bookkeeping
`noticeKey` is not reset when another notice replaces the refusal (a Look at a resource, :1101), so the next press
of that same control blanks an unrelated line. A sweep refusal is drawn with no row id, so nothing ever clears
it but a new press of the same Sweep. Fix: set `noticeKey = null` in `showNotice` unless called from `showResult`,
and clear a keyed notice when the refetch no longer lists its target.

## Check 6: the 5 s refetch and an action in flight

A refetch that lands while a request is out redraws from the pending set, so the control stays disabled (tested).

### M1 (major) NV:1073-1077 with :549-600: a refetch that predates the move overwrites its result
Plan 1150-1153 (the answer "holds what the click needs at once"; the refetch brings the rest) and the
handover's claim that `refetchAfterOps` "waits for an in-flight timed refetch". It waits at most 20 turns of
`setTimeout(0)` (well under 100 ms in a browser). A timed refetch is a sync plus `GET /network`, usually
longer. When one is still out after the wait, `refetch({sync:false})` returns `null` (`_refetching`, :550), no
fresh refetch is made, and the old one then lands: its view (built before the sweep or scan reached the server)
differs from `this.view`, so :573-587 replaces the view and redraws. The swept rows or the service tiles
vanish and Sweep or Scan is offered again, until the next tick (5 s). The same happens for a timed refetch that
starts while the scan request is out and whose GET is served first. The player sees the result flash and go; a
scripted proof that reads `getTestState` just after the click can fail at random. The node tests do not catch it
because the mock refetch resolves within the 20 turns.
Fix: do not poll. Either keep the in-flight refetch's promise (`this._refetchPromise`) and `await` it before
refetching, or count moves (`this._opsEpoch++` on every ops success, and at request start), have `refetch`
note the epoch when it starts and, if it changed by the time the answer lands, drop that answer and fetch once
more. Add a node test: start a refetch held on a deferred, complete a scan, release the old answer after 50 ms,
assert the tiles are still drawn and a second `network` call was made.

## Check 7: events and the test bridge

`network_swept {networkId}` and `network_host_scanned {hostId}`, each also as `<name>:<id>` (`_emit`, :316), on
every success including an `already` repeat; none on a refusal (tested). `networkView` returns the entry whole;
the doc comment, `docs/test-bridge.md` row and the pinning test agree. `docs/test-bridge.md` has no table of the
network view's `getTestState`, so there is nothing there to drift. Nit: `getTestState().ownNetwork.sweep` gives
a selector while the link is not responding and the button is not drawn (`blockOpsState` does not look at
`view.responding`; `render` does at :866). No separate finding.

## Check 8: imports and copy lists

Only `network-view.test.mjs` and the new `network-view-ops.test.mjs` copy the view into a temp folder; both copy
`ops-model.js`. `minigame-consoles-fit`, `pc-monitor-frame` and `escaping-shared-helpers` read the source in
place and pass. No finding.

## Check 9: tests against plan 11.3

Present and able to fail: the offers per row state by hooks; no ops attribute on an existing answer; same-tick
disable and one call; other target is its own key; refetch while pending; refusal words from the table; throw;
hook order on an answer, a refusal and a throw; throwing hooks; unplug through `perform` and its throw; the
bridge; the api call's path, body, error and no retry; every code of `ops_refusal_codes.json` in the table.

### T1 (minor) `test/js/network-view-ops.test.mjs:268, :291`: gaps
- Plan 11.3 names four endings for the hook case ("an answer, a refusal, a throw and a null answer"); the null
  answer (the request resolves with nothing) is missing, and it is where m2 hides.
- No refusal case for 400 `bad_request` (the loop at :248 has 403, 422, 404).
- Nothing covers a stale refetch landing after a success (M1), a render throw inside `perform` (m1), or an
  answer arriving after the view closed (m3).
- The unchanged-view test (:116) asserts absence of hooks, not equality with the old markup; acceptable only
  because `network-view.test.mjs` passes unedited.

## Delta sync

Nothing in this commit adds to synced `player_state`; the refetch after a move is sent with `sync: false`.

## Counts and verdict

| Severity | Count | Ids |
|---|---|---|
| blocker | 0 | |
| major | 1 | M1 |
| minor | 7 | m1, m2, m3, m4, m5, m6, T1 |

Verdict: not ready to pass R1. The two halves agree and the `perform` contract is as planned; fix M1 with its
test, and m1 and m2 (both small and both touch what the skin relies on), then a delta review. m3 to m6 and T1 can
go in the same fix round or be ruled on.

## R1 outcomes (fix round)

| Finding | Outcome |
|---|---|
| M1 | fixed: epoch counter (`_opsEpoch`), a refetch that started before a move drops its answer; `refetchAfterOps` awaits the in-flight one (`_refetchDone`) then asks again. Test "M1: a slow refetch..." fails on the old code (proved) |
| m1 | fixed: key cleared in `finally`; redraw and showResult guarded by `_safely`. Test fails on the old shape (proved) |
| m2 | fixed: `(await this._request(...)) ?? null`; test with a null answer |
| m3 | fixed: `showResult` folds the answer into the view but does not render when `_reported` or `_ending`; test |
| m4 | fixed: scroll kept, focus to the row's or next control (`focusAfterMove`); test |
| m5 | fixed: "Devices" group after Computers, before File shares; test |
| m6 | fixed: `showNotice` clears `noticeKey` unless given one (sweep and scan refusals pass it); a refetch drops a keyed notice whose target is gone; test |
| T1 | fixed: null-answer hook case (m2 test), 400 `bad_request` case; M1, m1, m3 tests added |
| m7 (server R1) | the old code already withheld Sweep on `route: "down"` (OM `offersSweep`, render's down branch); added a view test and kept the model test. No code change needed |

Commit: 7c3189229 (code, tests, handover note).
