# Lab port security — adversarial code review, round 1

Date: 2026-11-12. Branch `build/lab-portsec` vs `main`. Reviewer: subagent (adversarial R1).
Scope reviewed: `scenarios/lab_physical_pentest/scenario.json.erb` (one object added, `secured_port`),
`docs/achitechture/LAB_PORT_SECURITY_BUILD_LOG.md`, and the already-merged sub-slice P engine path
(`network_access.rb`, `network-links.js`, `interactions.js`) that the object relies on.

## Verdict

No blocker and no major found. The change is scenario-only: it adds a second, port-secured wall
port that can only ever refuse the drop box. It writes no global, no foothold, no capture and no
task, so it cannot bypass anything, cannot be a second foothold route, is safe under either drop-box
order, and is reload-safe because there is no state to restore. Findings below are minor and nit.

## Checks requested, with the result

- **Fields right for a jack.** Match. `secured_port` is `type: pc`, `networkJack: true`,
  `network: "office_lan"` — the same shape as the live `network_port` (scenario `:2287`), minus the
  `plantedSprite`/`linkName` that only a plantable jack needs. `office_lan` is a defined network
  (`:93`). The engine's `find_jack` accepts it (`network_access.rb:98`). PASS.
- **Cannot bypass / is not a sign-in object or a second foothold.** PASS. A sign-in PC is routed
  only by `lockType === 'login'` (`interactions.js:927`); `secured_port` has no `lockType`, so it
  falls to the `networkJack === true` branch (`interactions.js:938`) which is the plant flow. Plant
  always refuses on `portSecurity` before any foothold is written (`network_access.rb:181-185`), so
  no foothold id, no network reach and no session is ever granted through it.
- **Drop-box order both ways.** PASS. Secured-first: `plant_device!` returns `422 port_security`,
  the device is never removed (the refusal is before the inventory take), so the box is still in hand
  for the live port. Live-first: the box is consumed on the live plant; a later click on the secured
  port finds no held device and short-circuits to `requiresItemHint` (`network-links.js:361-366`).
  Neither order crashes or leaks.
- **Reload.** PASS. No global is set (no `network_port_planted` equivalent) and no foothold record
  is written, so there is nothing to restore and no stale `observationVariants` state; the static
  `observations` render the same before and after a reload.
- **Nothing miscounts it.** PASS. `secured_port` is referenced nowhere else in the file — no task
  (`opt_netdrop` targets `network_port`, `:357`), no capture mapping, no `kp_*` global, no aim
  condition. It adds zero to any objective or capture count.
- **Validator.** PASS. `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb
  scenarios/lab_physical_pentest/scenario.json.erb --no-graph` -> 0 lines with the cross mark,
  "Validation complete". The four warnings are pre-existing and unrelated (multi-door alignment,
  a cutscene `onceOnly`, `cm_store_key`, the hampshire relay). One new info line enumerates the
  jack's structural reach (see NIT-3).
- **JS tests.** PASS. `node --test test/js/network-links.test.mjs` -> 56 pass, 0 fail (covers the
  plant, `no_device` and `port_security` refusal branches).
- **Rails tests.** `test/controllers/break_escape/network_footholds_test.rb` (under the shared lock)
  -> 31 runs, 338 assertions, 0 failures, 0 errors, 0 skips. The branch build log also records a
  full Rails suite green (1796 runs, 0 failures).
- **Placement / crowding.** PASS by coordinates. P3 is 5x6. Origins: patch panel (2,1),
  live port (1,3), `secured_port` (3,3). Live-to-secured = 64 px, secured-to-panel ~= 71 px, both
  well over the 33 px origin rule, all inside bounds, no shared tile. Sprite asset
  `hce_comms_cabinet1.png` exists and is preloaded (`core/game.js:1202`). See NIT-4.
- **Text (802.1X / port security, UK English, no dashes).** Mostly accurate; see MINOR-1 and NIT-1.

## Findings

### MINOR-1 — teaching text lumps 802.1X in with a MAC allow-list
`scenarios/lab_physical_pentest/scenario.json.erb:2326` (`portSecurityMessage`): "A managed port
takes only known machines ... port security / 802.1X." Port security filters by MAC address, which
"takes only known machines" describes well; 802.1X authenticates the endpoint (certificate or
credentials), it does not match a known machine. For precise teaching the two are different controls
and the phrase blurs them. Both named controls are correct, so impact is low.
Fix: reword so the allow-list idea attaches to port security and 802.1X reads as authentication,
e.g. "... so an unknown device gets no network. The control: disable unused ports, and use port
security (known addresses only) or 802.1X (the device must authenticate before it gets a network."
The live port's own `jackConfirm` (`:2298`) and the existing `kp_dropbox_viewed` capture (`:762`)
have the same loose pairing, so this is a house-style point, not a regression.

### NIT-1 — em dash in the new ERB comment
`scenarios/lab_physical_pentest/scenario.json.erb:2305` ("secured_port — the contrast to
network_port ...") uses an em dash, against the builder rule "no em or en dashes". It is an authoring
comment, not player-facing, and the surrounding file already uses em dashes throughout its player
text, so this is cosmetic. Fix: replace " — " with ", " or a colon.

### NIT-2 — build log says the refusal shows via `gameAlert`, the code uses `toast`
`docs/achitechture/LAB_PORT_SECURITY_BUILD_LOG.md:65` states the message is shown "via `gameAlert`".
The merged client shows it with `toast(b.error ...)` (`network-links.js:394`). The message does
display either way; only the proof's wording is wrong. Fix: change "gameAlert" to "a toast".

### NIT-3 — validator reach info line can read like granted access
The validator prints an info line: "Network reach: jack 'secured_port' on 'office_lan' lists hosts
... resources ...", identical in form to a live jack. It is the structural reach a foothold *would*
have, and the secured port never grants a foothold, so nothing is actually reachable through it. No
code change needed; a one-line note in the build log would stop a future reader mistaking it for a
second live route.

### NIT-4 — no independent visual render in this review
Placement is confirmed from coordinates and the build log's screenshot only; this review did not
render P3. The `network_rack1` and `hce_comms_cabinet1` props can be tall, so a glance at the live
room is still worth it to confirm the two ports and the top patch panel do not visually overlap on
the back wall (the lab's crowded-wall backlog item touches this room's wall).

## Appendix: Rails single-file result

`flock .../tests.lock bin/rails test test/controllers/break_escape/network_footholds_test.rb`
-> 31 runs, 338 assertions, 0 failures, 0 errors, 0 skips.
