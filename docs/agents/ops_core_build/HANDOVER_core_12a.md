# Handover: core step 12 part A (S3 client, network view side of technique cards)

Files: `public/break_escape/js/minigames/network-view/network-view-minigame.js` and `ops-model.js` (S3 block at the end),
`public/break_escape/css/network-view-minigame.css` (appended block), `public/break_escape/js/api-client.js` (`networkTechnique`),
`public/break_escape/js/utils/compromise-bolt.js` (NEW, committed first), `docs/test-bridge.md`; tests `compromise-bolt.test.mjs` (6),
`network-view-techniques.test.mjs` (19), `ops-model.test.mjs` (+5), `api-client-network-ops.test.mjs` (+2). No Ruby. No other test file edited.

## Bolt helper (`utils/compromise-bolt.js`, imports nothing)
`BOLT_WIDTH` 7, `BOLT_HEIGHT` 11, `BOLT_COLOURS { outline, fill }`, `BOLT_ROWS` (11 strings of 7: `.` empty, `o` outline, `y` fill),
`boltPixels()` -> `[{x,y,kind}]`, `drawBolt(ctx, x, y, scale = 1)` (whole-pixel scale, any object with `fillStyle` and `fillRect`; returns `{width,height}`),
`createBoltCanvas(doc, scale = 1)` (canvas element with the bolt drawn, or null). 12b: use `drawBolt` for the world sprites' texture or `createBoltCanvas`.

## Import (settled in S3 client R1, view fix)
The view now imports `utils/compromise-bolt.js` STATICALLY (the ruling); `_loadBolt` and `paintBolts`'s deferral are gone and the bolt draws in the same tick. The helper is on the copy lists of `network-view.test.mjs`, `network-view-ops.test.mjs` and `network-view-techniques.test.mjs` (the others only read the source).

## View: perform, guard, hooks
- `use` goes through `perform({ action: 'use', target: { card: '<techniqueId>', finding: '<finding id>' } })`; pending key `use:<card>|<finding>` (`pendingKey` of the object).
  `parseUseTarget` also takes an array or a `"card|finding"` string. Guard turns away (`{sent:false}`): a finding id the view does not list (an alias is refused), a card
  not in the `techniques` map or with no `itemId`, api function missing, view not ready. Finding status is NOT looked at (plan 5.4); the server decides.
- Request: `ApiClient.networkTechnique(footholdId, { findingId, itemId })`, itemId read from `view.techniques[card].itemId` at send time.
- `OPS_ACTIONS` now has `use`. `useSelected()` (picked pair), `dropCard(cardId, findingAlias)` (drag; picks both then `perform`), `selectFinding(aliasOrId)`, `selectTechnique(id)` toggle and redraw.
- Result: a refusal draws `refusalLine(body)` (REFUSAL_TEXT; `need_unmet` adds " Missing: <need.label>" when the server sent `need.label`) as a notice keyed `use:...`; a null answer draws `no_answer`.
  Success: `lastGrant` (session grant) for the panel; notice `CREDENTIAL_GRANT_TEXT` or `sessionGrantText(host, who)`.
- afterAnswer on success: emit `network_technique_used { findingId, techniqueId, grant }` (+ `:<findingId>`); session grant: `window.pcSessions?.noteTechniqueSession?.(hostId, answer.session, answer.endedPcIds)`
  (12b's method in `pc-sessions.js`, optional call), then `window.openRemoteDesktop(hostId, footholdId)` with `exitReason = 'handover'`; if nothing replaced the view it stays open (`handedOver()`)
  and refetches. Credential grant with `keyringChanged === true`: `window.keyring.refresh()` fire-and-forget (the existing `Keyring.refresh`); `false` (a repeat): no ask.
  Refusal with a string `reason`: emit `network_technique_refused { findingId, reason }` (+ `:<findingId>`); a null answer emits nothing.
- `hostAction`: `responding === false` first; then `remoteSignIn === false && session?.openHere !== true` is `off`; else the existing session line. Absent `openHere` = off, as today.

## DOM and hooks
Panel (only while the view holds a card): `div.network-block.network-techniques[data-techniques]` > `h5` "Techniques", `ul.network-technique-list > li.network-technique[data-technique="<id>"][data-selected][draggable="true"]`
holding `button[data-action="select-technique"][aria-pressed]` (the card name), `.network-technique-summary`, `.network-technique-works` (works-on line); then `.network-technique-use` with `.network-technique-pick`
(the hint or "Finding f1 with <name>") and `button[data-action="use"]` (disabled until a pair is picked, "Using..." while pending); then `p.network-technique-grant` after a session grant (with `.network-access-tag`).
A finding's alias is now `button.network-finding-alias.network-finding-select[data-action="select-finding"][aria-pressed]`; `li.network-finding` gains `data-selected`. Host rows: `span.network-row-bolt[role=img]`
after the icon (a `canvas.network-bolt-canvas` is appended once the bolt module loads) while `session.via === 'technique'`; `span.network-access-tag[data-access="admin"]` before the Open/Locked control when `session.access === 'admin'`.
Drag: `dragstart` on a card remembers it (`_dragCard`), `dragover` on a finding accepts, `drop` calls `dropCard`. Keyboard path: finding alias button, card button, Use button; focus kept across redraws (`focusedControl` sub-id `@techniques`).

## getTestState
Row (only for such a session): `bolt: true`, `access: 'admin'`. Finding entries gain `select` (selector) and `selected`. Top level, only when the view holds a card or something is picked:
`techniques [{ id, name, summary, worksOn, itemId, selected, select }]`, `selectedFinding` (alias|null), `selectedTechnique`, `use` (selector), `canUse`, `grant { hostId, who, access? }`. Nothing says which card fits which finding. Documented in `docs/test-bridge.md`.

## Shapes assumed
- `openHere` on `session` of a host row, true only in the view of the foothold the technique session came through; absent = false. `access: "admin"` on `session` (row and answer), absent = user.
- `techniques` map: the server sends it at the TOP LEVEL of the `GET /network` body, beside `footholds`; `networkLinks.refresh` copies it onto the stored view as `view.techniques` (S3 client R1 B1), and the view and `ops-model.js` read `view.techniques` from there. The tests' fixture is the body shape (techniques beside `footholds`, none on the entry) fed through the real `refresh`.
- `techniques` entry `{ name, summary?, worksOn: { class, product?, versions[]? }, itemId }` as the 10b handover says; a missing or malformed map = no panel.
- Answers as 10b: success `{ success, already?, grant: 'session'|'credential', session?, endedPcIds?, keyringChanged? }`; refusal body (4xx, via `err.body`) `{ success:false, reason, need? { kind, label } }`.
- The host row id is the PC id (`openRemoteDesktop(row.id, foothold)` as the Open control does); a session grant's `session` is the object `noteTechniqueSession` takes.
- Session grant on a host with no row in this view: handover skipped (no host id).
- `REFUSAL_TEXT` already had all 17 codes of `ops_refusal_codes.json`; none added, none missing.

## Open / not done
- Graph (cards, needs, grants) is not mine (dungeon graph). Not done: no static bolt import (above); no browser run, layout and drag in a real browser are unproven.
- A repeat session grant (`already: true`) also hands over (the server says the desktop will serve it).

## Live proof should click
On a `test_ops_*` with cards: scan, Check, Confirm; pick a finding (alias button), pick a card, Use (Enter works); a wrong card shows the refusal line; a right session card opens the desktop (check the remote view frame,
12b) and the host row shows the bolt and, for admin, the tag; a credential card shows the keyring line and the keyring refetches; drag a card onto a finding; a long card name and summary wrap inside the card.


## S3 client R1 (view) changes
- A repeat session grant (`already: true`) on a copy `pcSessions.remoteViewFoothold(host)` already holds is not recorded again (no sign-out or sign-in event); the desktop still opens. A copy the client lacks is recorded. `noteTechniqueSession` is called with a fourth argument, `answer.tokenExpiredPcIds ?? null`.
- With no card held a finding's alias is the plain chip (no select control); `dropCard` redraws when the guard turns the drop away; the alias button has its own border and colour; a grid row (card) no longer stretches to the tallest card in its row, so content starts at the top.
