# Slice 9.3b sub-slice W: client code review, round 1

Scope: client join flow (`api-client.js`, `interactions.js`, `network-links.js`, password
minigame join mode), the changed JS tests, and `scenarios/test_access_networks`. Read-only.
Branch `build/9-3b-w`, head `ad807fadc`, diff against `main`. All three changed JS test files
pass alone: `network-links.test.mjs` 40/40, `password-join-mode.test.mjs` 5/5,
`validator-network-model.test.mjs` 34/34.

## Blocker

None.

## Major

### M1. The access points and the Wi-Fi card sit outside the room; no real player can reach them
`scenarios/test_access_networks/scenario.json.erb:175` (`guest_ap` x=11,y=6), `:186`
(`guest_ap2` x=11,y=8), `:196` (`wifi_note` x=11,y=4).

The lobby is `room_reception`, whose tilemap (`public/break_escape/assets/rooms/room_reception.json`)
is 10x10 with a solid wall on column 9; the walkable interior is x=1..8, y=2..8. All three
W-added objects are placed at x=11, two full tiles beyond the east wall. Interaction needs the
player centre within `INTERACTION_RANGE` (1 tile = 32px) of the object *and* a clear line
(`interactionLineClear`, `interactions.js:265`). From the nearest reachable tile (x=8) the APs
are ~96px away with the x=9 wall between, so `handleObjectInteraction` never runs for them. This
is exactly why the build log's live proof had to call `networkLinks.interactWifiAp(...)` directly
rather than walk to the AP and click. A real player cannot join the guest Wi-Fi, cannot reach the
second AP, and cannot even read the key card (`wifi_note`), so beats N8/N9 are unplayable by hand
and the "earned secret" has no in-game source. Fix: move `guest_ap`, `guest_ap2` and `wifi_note`
to interior tiles adjacent to walkable floor (x within 1..8, with an open neighbour), then re-run
the playtest by walking to each AP and clicking, not via a direct `interactWifiAp` call. (The
pre-existing P-slice signs at x=10 share this pattern but are out of W's scope.)

## Minor

### m1. `interactWifiAp` can open the key minigame twice on rapid clicks
`network-links.js:462-469`. `interactWifiAp` checks `this._busy` (line 466), but the probe's
`join` only sets `_busy` *after* the check, and `_busy` is already false again by the time the key
minigame is open. A second click on the AP while the minigame is up runs another probe and calls
`_promptWifiKey` again, stacking a second password minigame. Low impact (framework may coalesce),
but worth a guard: skip the probe when a minigame is already active, or set a pending flag across
the prompt. Not a regression in jack/link behaviour, which is unchanged.

## Nit

### n1. The join-header escaping is untested because the test stubs `displayDashes`
`password-join-mode.test.mjs:24` replaces `displayDashes` with identity and never asserts on the
header HTML, so the `escapeHtml(displayDashes(...))` wrapping at `password-minigame.js:224` (the
one place W sets attacker-influenceable text as HTML, the AP `name`) is not exercised by a test.
The escaping itself is correct (local `escapeHtml`, line 33). Consider one assertion that an AP
name containing `<`/`&` renders escaped in the header, so a later refactor cannot silently drop it.

### n2. Test quality otherwise holds up
Spot-checked that each assertion earns its place: `network-links.test.mjs` covers the open-join,
first-join-opens-view, keyed probe to minigame, wrong-key-no-foothold, second-AP `already`
(network_joined fires twice, view does not reopen) and reload-rebuild paths; removing the
`body.already` branch, the `network_joined` emit, or the `cleanFoothold`/`success` guard in
`join()` would fail a named test. `password-join-mode.test.mjs` would fail without the no-attempt
counter, the wrong-key field-clear, and the no-trim key handling. No duplicate or tautological
tests found. Other minigame modes (sign-in, password) are untouched: every W change is gated on
`this.join`, and 9.3a's jack/link paths in `network-links.js` are not modified.

## Verdict

The client join flow is correct and well tested: the server contract (open probe, 422 wrong-key,
`already` with a foothold, reload rebuild) is honoured, the one HTML sink is escaped, double-submit
is guarded by `checkPending`, and no other minigame mode or 9.3a behaviour regresses. The one thing
that blocks hand-play is M1: the test scenario's APs and key card are placed outside the walkable
room, so the feature cannot be reached by a real player and the live proof bypassed the real entry
point. M1 must be fixed and the playtest redone by walking to the AP before this sub-slice can be
called proven end to end. m1 and the nits are optional polish.
