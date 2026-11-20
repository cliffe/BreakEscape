# Access model slice 9.3b sub-slice O (outages): code review round 1 (adversarial)

Reviewer pass over `git diff main...build/9-3b-o`. Branch `build/9-3b-o`, worktree
`.claude/worktrees/p-9-3b-o`. Spec: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`
(sub-slice O, 4.2, 5.2, section 13 answer 4). Reviewed against that plan, the 9.3a base on
`main`, and 9.2's NPC side of `downIf`.

## Summary

The server-authority spine is sound. Every read and write route that should withhold a down
host or share does so from server state, not a client-sent value: `network_up?` and
`resource_down?` read the outage global from `player_state['globalVariables']` (falling back to
the scenario default) and apply `NetworkModel.truthy?`; `player_reach` skips a down network, so
`network_rows`, `mapped_shares`, `host_reachable_through?` and `resource_admits_player?` all drop
down hosts and shares; the new `session_route_up?` re-judges a held remote session from the
server's own session record. The leak rule holds: a down-by-default network nobody has reached is
absent and unnamed. The `truthy?` subset matches `npc-work.js` and `npc_frustration#truthy_global?`
exactly. Validator and schema changes are correct and the info/warning lines are right.

Counts: **0 blockers, 1 major, 3 minor, 2 nit.**

## Major

### MAJ-1 Overstated tamper-resistance: the outage global IS client-writable

`app/models/break_escape/network_access.rb:730-738` (`network_up?` docstring) states "a tampered
client cannot clear an outage it did not set or reach a downed network", and
`test/controllers/break_escape/network_outages_test.rb:59-66` is titled "a tampered client cannot
clear the outage global the server reads". Both claims are false. The outage global is an ordinary
scenario global and is **not** in the read-only set of
`app/models/break_escape/game.rb:285-307` (`merge_global_variables!` protects only imported and
wearable globals), so a hostile `PUT /sync_state` carrying `globalVariables: { servers_offline:
false }` is stored verbatim; `network_up?` then reads it as cleared and the down network's hosts
and shares come back into reach (subject to the player already holding a foothold/session and any
password or ACL).

This is in fact the accepted model: plan 5.2 ("Keeping the server's view current") has the client
sync outage globals, and `scripts/validate_network.rb:308-321` already warns that "a browser can
set that global false, so a secret that must not be read early needs an account-gated share or a
session as well, not an outage alone." So the behaviour is correct and guarded; the defect is that
the security-critical comment and the test name assert a property the code does not provide, which
could lead a later author to trust an outage as a boundary.

The N5 test body only reads the default down state; it never drives a hostile sync, so it does not
test what its name claims.

Fix: reword `network_up?`'s docstring to state the real property (the value is read from server
state so the server, not a request parameter in the access call, decides the route; the global
itself is client-published and an outage alone is not a security boundary, which is why unreached
networks stay withheld/unnamed and reach still requires a server-held foothold/session plus any
password/ACL). Rename the N5 test to something like "the server reads the outage global from its
own state (down by default)", and add a test that POSTs `sync_state` clearing the global on a
down-by-default network **with no foothold** and asserts the network is still unreached and
unnamed (the genuine tamper guarantee), plus one that clears it **with** a foothold and asserts the
host still demands its password (the outage is a soft gate).

## Minor

### MIN-1 `outage_global` duplicates `npc_frustration#frustration_global`

`app/models/break_escape/network_access.rb:751-762` reimplements, byte for byte, the
player-state-then-default lookup of `app/models/break_escape/npc_frustration.rb:719-726`
(`frustration_global`), and `NetworkModel.truthy?` duplicates `truthy_global?` at
`npc_frustration.rb:736`. Three copies of the same truthy set (here, `npc_frustration.rb`,
`npc-work.js`) must stay in lock-step or an outage is decided two ways. Fix: have `outage_global`
delegate to a single shared reader (or note the mirrored methods in both bodies so a future change
updates all copies); at minimum keep the `NetworkModel.truthy?` comment's cross-references current.

### MIN-2 `session_route_up?` returns a conservative false when the PC cannot be resolved

`app/models/break_escape/network_access.rb:779-782`: when `find_login_pc(pc_id)` returns nil (`net`
nil), the route is treated as down and the session refused. This is the safe default, but it means
any future change that makes a legitimately reachable remote PC momentarily unresolvable (e.g. a
PC inside a container whose lock state is read differently) silently locks the player out of a held
session with no distinct signal. Fix: no code change required, but add a one-line comment stating
the nil-PC case is a deliberate deny, and consider a targeted test for a remote session whose PC is
present and reachable so a regression in `find_login_pc`/`object_network` surfaces here.

### MIN-3 Plan 5.2 `offWhen` "not responding" host display left unbuilt

Plan 5.2 ("A host whose own service is off") specifies `host_row` marking a sign-in host
`responding: false` when its office-life `affordance.offWhen` is truthy, with a 403 on its sign-in
and desktop. The handover (`docs/agents/HANDOVER_9_3B_O.md:55-56`) deliberately defers this as a
9.2-field dependency outside the N5-N7 beats. That scoping call is reasonable, but nothing in this
sub-slice's code or docs tracks the gap where a reader would look. Fix: add a one-line pointer in
the build log's "left/not done" and in `docs/IDEAS_BACKLOG.md` so the deferred host-level outage
display is not lost between slices.

## Nit

### NIT-1 Two passes over `resources.keys.sort` for info lines

`scripts/validate_network.rb:676-682` adds a second `resources.keys.sort.each` immediately before
the existing resource-info loop. Harmless, but the outage resource-info line could fold into the
existing loop. Fix: optional merge for one pass.

### NIT-2 `truthy?` comment mentions `0.0` but relies on Ruby's `0.0 == 0`

`lib/break_escape/network_model.rb:301-309`: the comment lists `0.0` as falsy; the code gets this
only because Ruby's `0.0 == 0` is true (and JS `0.0 === 0` likewise), not from an explicit clause.
The unit test does cover `0.0`, so this is purely a readability note; no change needed.

## Checks run

- Validator, `--no-graph`, counting every `❌` line: `scenarios/test_access_networks` 0,
  `scenarios/lab_physical_pentest` 0. No stray `dungeon_graph.*` rewrites (`git status` clean bar
  `node_modules`).
- Touched Rails tests (`network_outages_test`, `network_no_exposure_test`, `network_model_test`),
  under the shared lock: 42 runs, 1835 assertions, 0 failures, 0 errors, 0 skips.
- Full `bin/test-js -j 3` under the shared lock: 500 files passed, 0 failed (exit 0).

## Outcomes (fixes applied)

All findings addressed bar NIT-1, rejected with a reason. Commit(s) on `build/9-3b-o`.

- **MAJ-1** fixed. `app/models/break_escape/network_access.rb` `network_up?` docstring reworded to
  the real property: the global is read from server state (not a request parameter), but it is
  client-syncable (plan 5.2), so an outage is a soft gate, not a boundary. The guarantee is that
  clearing it reaches nothing a boundary would stop. Renamed the N5 test
  ("the server reads the outage global from its own state (down by default)") and the test-class
  header. Added two tests in `test/controllers/break_escape/network_outages_test.rb`: a hostile
  `PUT /sync_state` clearing the global **with no foothold** (the server stores the cleared global,
  but the network is still unreached and no `SERVER_STRINGS` appear in the view or the bootstrap
  scenario, and `resource_admits_player?` is false), and one clearing it **with** a foothold (the
  host is reachable but a wrong password opens no session; the real password signs in). Added a
  `sync_globals` and `bootstrap_scenario` helper to `test/support/network_model_scenario.rb`.
- **MIN-1** fixed. One shared reader `Game#global_variable_value` (`app/models/break_escape/game.rb`);
  `outage_global` and `npc_frustration#frustration_global` delegate to it; `truthy_global?` delegates
  to `NetworkModel.truthy?`. `NetworkModel.truthy?`'s comment now names the delegators.
- **MIN-2** fixed. Comment added at `session_route_up?` marking the nil-PC deny deliberate; a
  happy-path test proves a present, reachable remote PC passes, so a `find_login_pc` /
  `object_network` regression surfaces here.
- **MIN-3** fixed. Dated entry in `docs/IDEAS_BACKLOG.md` and a pointer in the build log's
  "Not done / for later".
- **NIT-2** addressed in the `NetworkModel.truthy?` comment (0.0 falsy through `0.0 == 0`).
- **NIT-1** not done, by design. Folding the resource-outage info line into the existing
  `resources.keys.sort` reachable-share loop would drop outage lines for a down share that fails
  that loop's `file_share` + `access` filter (e.g. an open down share), so the dedicated pass is
  kept.

Re-run after the fixes (under the shared lock): validator `test_access_networks` 0 `❌` lines;
`bin/rails test` and `bin/test-js -j 3` — see the build log O "Suites".
