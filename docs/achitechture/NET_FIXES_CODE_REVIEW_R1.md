# Network fixes code review, round 1 (build/net-fixes against main)

Scope: `git diff main...build/net-fixes`, the build log `NET_FIXES_BUILD_LOG.md`, and plan 9.3b
sections 5.2 and 5.5. Covers q45 (a host whose own service is off), q46 (the K, O and I minors)
and the sync before the network view opens.

Counts: 0 blockers, 2 majors, 2 minors, 6 nits.

Two behaviours below were confirmed with a throwaway integration test against the
`NetworkModelScenario` fixture (deleted afterwards, not committed): with `lena_pc` given
`affordance.offWhen` and a remote session held there, then switched off,

- `player_reach(jack_comms_port)` still holds `server_net`, and a remote sign-in to `sv_fs02`
  through the box answers 200;
- `GET /container` for `ledger_archive` (finance only, admitted by Lena's identity) answers 200.

## What holds up

- **403 order on a remote sign-in.** `attempt_login!` checks `host_reachable_through?` first (so
  an unreachable host's power state is never told), then `host_service_off?`, then the policy, and
  only then reads the username, the lockout list and the password. No failure is counted, and no
  lockout answer can come back from an off host. Correct.
- **Desktop and scoped requests.** `desktop_request_allowed?` refuses the foothold path, and
  `session_route_up?` refuses scoped requests (host folders, inventory adds, unlocks, and profile
  scopes through `session_admits?` and `scope_admitted_by_session?`) under a remote session at an
  off host. The session is kept, not pruned, and works again when the global clears.
  `prune_unreachable_sessions!` reads `structural_reach`, which never sees the service state, so an
  off host never ends a session. That is the right way round.
- **Soft gate.** The `offWhen` global is an ordinary synced global, so a tampered client can clear
  it. Clearing it only lets the player try a password at a host the foothold already reaches, so
  nothing treats it as a security boundary. Setting it only hurts the player.
- **Cache key.** It covers the foothold record, the held session keys, each network's outage value
  (read through `outage_global`, so the scenario default counts), the networks, the links and the
  `scenario_data` identity. The cache is an instance variable on one `Game` object, so it cannot
  leak between games, and each request loads its own `Game`, so nothing carries across requests.
  A sign-in, unplug, logout or outage flip inside one request changes the key. The frozen-then-dup
  return stops a caller from altering the cached set.
- **Sync before the view.** `StateSync#sync()` never throws: it returns false on failure, and it
  queues behind a run in flight, so a run built before the switch flip is followed by one that
  carries it. A second caller shares the queued run, so there is no double PUT, and a sync with
  nothing to send makes no request at all.
- **Implant `already`.** The first-lost-answer retry now fires `network_foothold_gained` and opens
  the view once. `footholds` and `gained` are rehydrated from the scenario response on load, so a
  reload does not make an old foothold look new.
- **not_ready retry.** `attempt--` with `continue` keeps the network-error budget intact (at most
  2 + 3 asks). The session shape does not wait. `apply-actions.js` does not await `implant()`, so
  the 4.5 second wait blocks no other action.
- **Validator per-path rule.** `path[0..-2].all?` is the right test: the walk needs a session on
  every network before the target, the jacked one included, and none on the target.

## Majors

### M1. An off host still carries an onward pivot

`reach_session_hosts` counts every held session at a sign-in host, including one whose service is
off, so `player_reach` still crosses links from it. With Lena's PC switched off and her remote
session held, the box still reaches `server_net` and a fresh remote sign-in to `sv_fs02` succeeds
(probe above). The host refuses its own sign-in, desktop and scoped requests but still relays
traffic onward. That contradicts plan 5.2's "the host-level counterpart of a network outage": a
session on a down network stops the walk (`up.call(net)` on the host's network). The N14 fiction
makes it sharper: the switch is the PC's power.

Plan 5.2 does not say, so this is a design call. If the user agrees the pivot should stop:

- skip a host where `host_service_off?` holds in `player_reach`'s walk only (not in
  `structural_reach`, so nothing is pruned and the onward session comes back with the power);
- add the `offWhen` values of the session hosts to `reach_cache_key` (today the key is complete
  only because the walk does not read them);
- then an onward session over it shows in a `route: "down"` block, as for an outage, with no new
  client code;
- add a pivot test with the host switched off and back on.

### M2. A share is still served through a session at an off host

`resource_admits_player?`'s session branch walks `access_sessions` with no `host_service_off?`
check. An access-listed share that the off host's signed-in identity admits is served by a direct
`GET /container` (probe above: `ledger_archive` 200 through Lena's session while her PC is off).
The desktop is refused, so the share is not mapped, but a desktop left open before the switch-off
still lists the share folder, and a click on it succeeds. The build log's claim that every route
through the host is covered does not hold for shares.

Fix: in that branch, `next false if host_service_off?(info[:object])`. Consider
`next false unless session_route_up?(pc_id)` as well. That closes a smaller gap from before this
branch: a remote session on `sv_fs02` whose pivot network is down while `server_net` stays up still
admits a `server_net` share, because `networks_reachable_from(host_net)` only checks the host's own
side. Add a test to `network_host_service_off_test.rb`.

## Minors

### m1. The sync before the view has no time bound

`view()` awaits `stateSync.sync()` with no timeout. A slow sync, or one queued behind a large run
in flight (mail, the phone), keeps the view on "Connecting..." for two round trips; a hung one
keeps it there until the browser gives up. Before this branch only the GET could hang. The view
only wants fresher globals, so race the sync against a short wait (about 2 seconds) and fetch
anyway. `npc-reports.js` already bounds its own requests with an `AbortSignal` (review R2 m2).
Add a test with a sync that never settles.

### m2. N14's "power" switch leaves the keyboard working

Plan 5.2 names remote requests only, and the build follows it: walk-up sign-in, the keyboard
desktop and a claim at a switched-off `bench_pc` all work. The scenario calls the switch the PC's
power ("Its power lead runs to the switch on the wall"), so a player who walks up to a PC that has
just been switched off finds it working. Either reword the N14 object and switch as a network
service (a remote-access or network switch) so the fiction matches, or ask the user whether a
walk-up to an off PC should be refused as well. `README_scenario_design.md` now states "Walking up
to it still works", so authors are told. Only the test scenario's wording is wrong.

## Nits

1. **Keyboard path settles a remote session at an off host.** `render_login_desktop` without a
   `foothold` param judges room reach, not where the player stands, and then
   `settle_session_at_keyboard!` clears the session's foothold, after which `session_route_up?`
   passes. A tampered client can therefore lift the off gate on a remote session in an unlocked
   room. This is the same soft path outages already have, and the player could walk there anyway,
   so nothing to fix. Add a "not a security boundary" sentence to `host_service_off?` like the
   one on `network_up?`.
2. **Cache key and rooms.** `reach_session_hosts` reads each host's network through
   `object_network`, which reads `scenario_data['rooms']`. The key covers the `scenario_data`
   identity, not an in-place edit of a room's or object's `network`. Nothing does that at runtime
   today. The key is also stored as `Array#hash` (an integer). A collision is very unlikely, but
   using the array itself as the hash key costs nothing and removes the chance.
3. **The cache test cannot fail without the cache.** The memo test in `network_outages_test.rb`
   proves the key is fresh enough (it would catch a key missing an input), but it passes just as
   well with no memoisation at all. If the cache is meant to stay, one assertion that a second ask
   does not walk again (count calls to `reach_walk_uncached`) would pin it.
4. **Two answers in flight.** If two `implant()` calls overlap (a double click on a BadUSB prop)
   and the `already` answer is handled before the `implanted` one, `isNew` is true for the first,
   and the `implanted` branch emits and may open again without checking `isNew`. Rare. Guard the
   emit on `isNew` in both branches.
5. **A reload during the not_ready waits loses the grant.** The timer is saved as fired, so a reload
   within the 4.5 seconds never asks again. Plan 5.5 tells authors to place the timer a few
   seconds after the drop, which covers it. Worth a clause there saying the waits do not survive a
   reload.
6. **A held session at an off host shows no hint that it is kept.** The row says only "not
   responding", where an outage's down block says "No route to <host>" so that "a held session is
   never silently missing" (5.2). A short "(signed in as Lena)" or similar on that row would match.

## Do the tests fail without the change?

| Test | Fails on main? |
|---|---|
| `network_host_service_off_test.rb`, all 4 | Yes (no `responding`, the sign-in succeeds, the desktop opens) |
| outages: down-block rows carry no `remoteSignIn` or `session` | Yes (the held `sv_fs02` row carried `session`) |
| outages: reload during an outage keeps the session | No: coverage of existing behaviour (O R2 MIN-1 asked for exactly that) |
| outages: memoised walk follows its inputs | No: passes uncached too (nit 3) |
| pivot: reload ends the claim-bridged onward session; unplug ends both | No: coverage of existing behaviour (K R2 m2) |
| JS `view()` syncs first, and fetches on a failed sync | Yes |
| JS `already` on an unheld foothold emits and opens once; gained-before does not open | Yes |
| JS dropped not_ready asks again; gives up after three | Yes |
| JS session-shape not_ready asks once (added assertion) | No: guards the new branch against widening |
| JS `hostAction` not_responding; row shows the text with no control | Yes |
| JS validator: chain through a hostless middle network warns | Yes (the old union passed on the office host) |
| JS validator: host on every network does not warn | No: guards against a false positive |

No test covers M1 or M2, which is how they got through.
