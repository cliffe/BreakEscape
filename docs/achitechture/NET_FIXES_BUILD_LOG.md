# Network fixes build log (user decisions q45 and q46, 2026-11-12)

Branch `build/net-fixes`. Background: `docs/handover/2026-11-11_USER_DECISIONS.md` (q45, q46),
plan `ACCESS_MODEL_SLICE_9_3B_PLAN.md` section 5.2, and the reviews named below.

## q45: a host whose own service is off

Plan 5.2, "A host whose own service is off". Uses 9.2's `affordance.offWhen` (a global name, or
`{ name: value }`), read through `AccessWork.affordance` and `AccessWork.globals_hold?` on the
same globals the NPC frustration path reads (`frustration_globals`).

- `Game#host_service_off?(pc)` (`network_access.rb`).
- `host_row` gives such a host `responding: false` and no `remoteSignIn` or `session`.
- A remote sign-in (`attempt_login!` with a foothold) answers 403 `{ reason: "unreachable",
  message: "PC not responding" }` before the password is read, so no failure is counted.
- `desktop_request_allowed?` with a foothold refuses it (403 `unreachable` from the controller).
- `session_route_up?` refuses scoped requests under a remote session there. The session itself is
  kept, as one over a down route is, and works again when the service returns.
- A keyboard (walk-up) sign-in is not refused: plan 5.2 names remote requests only.
- Client: `hostAction` returns `not_responding` first; the row shows "not responding" with no
  control.
- Client: `networkLinks.view()` now awaits `stateSync.sync()` before `GET /network` (plan 5.2,
  "Keeping the server's view current"). Without it a switch flipped a moment before showed only
  after the next 30 second sync. This affects N5 to N7 as well.
- Scenario beat N14 in `test_access_networks`: `bench_pc` in the workshop, off at the start, with
  a `bench_power` switch; `n14_host_off` ticks on a remote sign-in after the view showed it off.
  Documented in the scenario's PLAYTEST.md.

## q46: network minors

- K R2 m1: `validate_network.rb` judges the "reachable only by pivoting" warning per path (a path
  is usable when every network before the target has a sign-in host). Two JS validator tests.
- K R2 m2: `network_pivot_test` gains a reload that ends an onward session whose only pivot was a
  claim, and an unplug that ends the pivot and the onward session.
- O R2 MIN-1: `network_outages_test` reloads during an outage (with a claim present, so the prune
  really runs) and the remote session survives, then reopens on repair.
- O R2 NIT-1: down-block host rows drop `remoteSignIn`, `session` and `responding`.
- O R2 NIT-2: `reach_walk` is memoised per game object on what it reads (the foothold record,
  the held session keys, every network's downIf value, the networks and links). A changed input
  misses the cache; a copy is returned. Test in `network_outages_test`.
- I R3 m1: `implant()` on an `already` answer for a foothold this browser did not hold fires
  `network_foothold_gained` and, when no foothold had been gained from that PC here before, opens
  the view. A repeat on a held foothold stays quiet.
- I R3 m2: a dropped-shape implant answered `not_ready` asks again three times, 1.5 seconds apart
  (`IMPLANT_NOT_READY_RETRIES`, `IMPLANT_NOT_READY_DELAY_MS`); the session shape does not. Plan
  5.5 documents the timing.

## Tests

- New `test/controllers/break_escape/network_host_service_off_test.rb` (4 tests).
- Added to `network_outages_test.rb`, `network_pivot_test.rb`, `test/js/network-links.test.mjs`,
  `test/js/network-view.test.mjs`, `test/js/validator-network-model.test.mjs`.
- Full suites under the shared lock: Rails 1804 runs, 0 failures, 0 errors, 1 skip; JS 507 of 507 files.

## Live proof (keyless server on :3037, game 1370)

Box planted in `bench_port`: the view showed WS-BENCH-01 "not responding" with no control
(screenshot `n14-not-responding.png` in the session scratchpad). A forced remote `POST /login`
with a wrong password while off answered 403 `unreachable`, `loginFailures` stayed 0. Switched on:
Sign in offered, signed in through the view with Sam's details, `n14_host_off` ticked. After a
reload, switching the PC off and opening the view at once showed "not responding" (the sync before
`GET /network`). Switched off with a held remote session: row "not responding", desktop fetch 403,
`sessions.bench_pc` kept. Leak check: no leaks.

## Review R1 fixes (NET_FIXES_CODE_REVIEW_R1.md)

Decision from the coordinator: a switched-off PC is off for everything that goes through it.

- M1: `player_reach` skips a session host whose service is off (not `structural_reach`, so
  nothing is pruned); the cache key carries each session host's off state. An onward session over
  it shows in a down block and reopens with the power.
- M2: `resource_admits_player?` serves no share through a session at an off host, nor through a
  remote session whose route is down (`session_route_up?`).
- m1: the sync before `GET /network` waits at most `VIEW_SYNC_WAIT_MS` (3 s), then the view opens
  with the server's last known state.
- m2: the keyboard sign-in at a switched-off PC is left working; it is the user's q72 and waits
  for the answer.
- Nits: a "soft gate" comment on `host_service_off?` (1); the cache key is the array itself (2);
  the cache test counts walks (3); the implanted branch emits only for a foothold not held (4);
  plan 5.5 says the not_ready waits do not survive a reload (5); an off row names a kept session
  as "still signed in as ..." (`heldAs`) (6).
- New tests: four in `network_host_service_off_test.rb` (M1 twice, M2, the kept-session row), all
  failing without the fix; JS tests for the sync time limit, two answers in flight and the row.

## Open

- Plan 5.2's five-second refetch of an open view, and a sync before a remote sign-in or a desktop
  or share fetch, are not built (the view's sync covers the usual path). In the backlog.
- The dungeon graph does not draw links, outages, Wi-Fi or implants (build/graph-net is on it).
