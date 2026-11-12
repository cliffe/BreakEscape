# Lab port security build log

Date: 2026-11-12. Branch `build/lab-portsec`, worktree `.claude/worktrees/p-lab-portsec`.

## What was built

The 9.3b plan's section 13 item 2 recommendation, accepted by the user: a second,
port-secured wall port in `lab_physical_pentest`'s comms cupboard (room `P3`). It backs up the
lab's "disable unused ports / port security / 802.1X" lesson without touching the critical chain.
This is scenario work only; the engine side (sub-slice P) was already merged and needed no change.

One object was added to `scenarios/lab_physical_pentest/scenario.json.erb`, in `P3`'s `objects`
array beside the existing live `network_port`:

- `id: secured_port`, `type: pc`, `networkJack: true`, `network: office_lan`.
- `portSecurity: true` with an authored `portSecurityMessage`.
- `sprite: hce_comms_cabinet1` (a wall comms/patch cabinet), `position: { x: 3, y: 3 }`.

## Design decisions (and why)

- **Where it sits / how it reads.** `P3` is 5x6 (TILE_SIZE 32). The live `network_port` is at
  (1,3), the passive patch panel at (2,1). The secured port sits at (3,3): same wall band as the
  live port, two tiles (64 px) clear of it and >33 px from the patch panel, so object origins keep
  the >=33 px rule. Both props are orthogonal top-down (square to the wall), not isometric.
- **Telling the two ports apart.** The live port keeps `network_rack1` (a tall server rack); the
  secured port uses `hce_comms_cabinet1` (a wall comms cabinet), so the two are visibly different
  units at a glance. Names and observations do the rest: "Live wall network port" vs "Managed wall
  network port", and the secured port's observation says it runs to a managed switch with port
  security on. The live open port remains the one that works; the secured one only ever refuses.
- **No new capture or finding line.** The lab's `kp_*` captures each record a weakness that was
  exploited (e.g. `kp_netdrop_planted` for the live port, `kp_dropbox_viewed` for its network
  view). A port-security refusal is the control *working*, not a weakness found, so logging it as a
  `kp_*` capture would be inconsistent. The teaching lands at the moment of refusal through the
  `portSecurityMessage` (UI text, not voiced). No global, task, event mapping or voiced line was
  added. The message mirrors the existing `jackConfirm`'s phrasing ("disable unused ports ... port
  security / 802.1X") so the two ports read as one lesson.

## Player-facing text added (all UI/narrator text, none voiced)

- `name`: "Managed wall network port".
- `observations`: the managed-switch description (shown on examine).
- `jackConfirm`: "Try the network drop box in this managed switch port?" (confirm dialog).
- `requiresItemHint`: shown only if the port is clicked with no device in hand.
- `portSecurityMessage`: "The switch logs the drop box's address and shuts the port. A managed port
  takes only known machines, so an unknown device gets no network. The control: disable unused ports
  and switch on port security / 802.1X." (the refusal toast).

None of these is spoken by a character, so no TTS work is needed. They render as plain text through
the existing examine / confirm / toast paths.

## Checks

- **Validator:** `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb
  scenarios/lab_physical_pentest/scenario.json.erb --no-graph` -> 0 lines with the cross mark
  (validation complete). A new info line prints the secured_port jack's *structural* reach, in the
  same form as a live jack ("lists hosts ... resources ..."). That is the reach a foothold would
  have; the secured port never grants a foothold, so nothing is actually reachable through it (review
  R1 NIT-3). The line is left as-is: the reach-line format is shared validator tooling asserted by
  `test/js/validator-network-model.test.mjs`, so a port-security suffix belongs with that stream, not
  this scenario change. Ran with `--no-graph`, so `dungeon_graph.*` is untouched (no lock/key chain
  change).
- **JS suite:** `bin/test-js -j 3` under the shared lock -> 507 passed, 0 failed.
- **Rails suite:** `bin/rails test` under the shared lock -> 1796 runs, 25577 assertions, 0
  failures, 0 errors, 1 skip.
- **Live browser proof** (keyless server :3031, games created with
  `tools/playtest/new-game.rb lab_physical_pentest --start-room P3 --give kit_dropbox`): driving the
  real client `networkLinks.interactJack` path in a headless browser,
  - secured port -> `{ action: 'refused', reason: 'port_security' }`, the drop box stays in the
    inventory (`["kit_dropbox"]` before and after), and the exact `portSecurityMessage` is shown via
    a toast (`toast(b.error ...)` in `network-links.js`; the proof hooks its `gameAlert` sink to read
    the text back);
  - live port -> `{ action: 'planted', footholdId: 'jack_network_port', first: true }`, the drop box
    is consumed, and a foothold on `office_lan` is written.
  - Screenshot of the cupboard with both ports and the refusal message:
    `<scratchpad>/cupboard-message.png`.

## For the lab sheet (not written here; lab sheets come last)

The sheet's existing "disable unused ports / port security / 802.1X" point should note the contrast
now in the room: the live port let the drop box straight onto the network (a finding), while the
managed port beside it logged the device and shut the port (the control working). The managed port
is a demonstration object, not a required step, and earns no capture. No walkthrough step needs to
visit it.

## Handover

- Done: scenario object added, validator clean, JS suite green, Rails suite green, live proof both
  ways, screenshot. Nothing left open.
- Files touched: `scenarios/lab_physical_pentest/scenario.json.erb` (one object added),
  `docs/achitechture/LAB_PORT_SECURITY_BUILD_LOG.md` (this file).
- Commits: scenario change committed before testing (shared-tree rule).
- Gotchas: `interactJack` short-circuits to `requiresItemHint` when no rogue device is held, so the
  port-security refusal is only reachable with the drop box in the inventory; the proof uses a fresh
  game (`--give kit_dropbox`) for the message capture. `hce_comms_cabinet1` is already preloaded in
  `core/game.js`, so no sprite load list changed.
