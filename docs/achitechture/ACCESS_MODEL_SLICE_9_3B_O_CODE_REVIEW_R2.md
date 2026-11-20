# Access model slice 9.3b sub-slice O (outages): code review round 2

Adversarial, fresh eyes, 2026-11-12. Diff reviewed: `git diff main...build/9-3b-o` (merge base
`main` at 1c54bce6d). Scope is sub-slice O only (K, W, P, I are already on main). Earlier review
files were not read.

## Verdict

No blockers, no majors. The O diff is server-side and test-only; every outage gate is read from
server state, never a request parameter, and is covered by tests. Findings below are minors and
nits. The slice is mergeable as it stands.

## What was checked

- **Server authority under a tampered client.** The outage global is client-syncable by design, so
  `network_up?` can be flipped to "up" over `PUT /sync_state`. That changes nothing a boundary would
  stop: reach still needs a server-held foothold (`player_reach`/`structural_reach` seed from the
  foothold's own network), and a host brought back into reach still demands its password and ACL.
  `network_outages_test` drives the hostile sync both with no foothold (nothing reached or named) and
  with a foothold (soft gate lifts, but a wrong password is still a password failure, not a reach
  bypass). Confirmed.
- **Reach to a down network without a foothold.** `reach_walk` returns an empty set when the
  foothold is absent; `resource_admits_player?` and `network_rows` withhold down hosts/shares; the
  no-exposure test `a down-by-default network nobody has reached is absent from every read route`
  confirms `/network`, `/login`, `/scenario` name nothing on `server_net`.
- **Sessions while the route is down.** Kept, not pruned: `prune_unreachable_sessions!` uses
  `structural_reach` (which ignores outages), so a session over a downed route stays in the record
  and its desktop reopens on repair with no password (N7). A pivot ends only on sign-out, verified by
  the prune path in `POST /logout` / `end_claimed_sessions!`.
- **Scoped-request route test.** `session_route_up?` reads the route from the server's own
  `sessions[pc]['foothold']`, never a client-sent foothold, and gates `session_admits?` (login_pc and
  profile scopes) and `scope_admitted_by_session?`. A local (blank-foothold) session is judged as
  9.3a did, so no 9.3a scenario gains a refusal. The conservative deny when the PC is unresolvable has
  a happy-path guard test.
- **Every view/route withholds down data.** `network_rows` (resource `downIf`), `resource_admits_player?`
  (both resource `downIf` and down-network via `player_reach`), `mapped_shares`,
  `host_reachable_through?`, `desktop_request_allowed?`, and the scoped gates all refuse a down route.
  `login_accounts` is physical-console only and unchanged by O (realistic: a local console works while
  the network is down); it is consistent with 9.3a, not a new leak.
- **Shared refactor is behaviour-neutral.** `Game#global_variable_value` is byte-identical to the old
  `frustration_global` body; `NetworkModel.truthy?` is byte-identical to the old `truthy_global?` body
  (and the `0.0` case is caught by `== 0`). The `npc_frustration.rb` `workaround_body` case/when
  reindent changes no behaviour and is rubocop-clean. 9.2 frustration/workaround/social tests: 115
  runs, 0 failures.
- **Interaction with K / W / P / I.** O only promotes `network_up?` from the K stub to a real
  `downIf` read and adds `resource_down?` and `session_route_up?`. Wi-Fi and implant footholds flow
  through the same `player_reach`, so outages apply to them uniformly; port security is on the plant
  path and untouched. No conflict.
- **Validator, no false positives.** `test_access_*` all report 0 ❌ (networks, work, social, signin,
  sessions, habits, doors). Lab scenarios with ❌ (exploitation 13, post_exploitation 12, feeling_blu
  10, vulnerability_analysis 9, vulnerabilities 3, malware_metasploit 1) are pre-existing and none of
  their ❌ lines mention downIf/outage/network. JS validator test: 61 pass. Resource-side `downIf`
  string/declared validation lives in `validate_access_work.rb:276-278` (9.2), so the delegation in
  the comment at `validate_network.rb:291` is accurate, not a gap.
- **Coordinator note (innerHTML / notifications).** O touches no client JS, and the diff contains no
  `innerHTML`, `notification` or `toast`. O adds only JSON fields (`route`, the down blocks) consumed
  by the already-reviewed `network-view-minigame.js` on main. Nothing in O renders server text through
  a notification or innerHTML.

## Tests run

- `network_outages_test`, `network_no_exposure_test`, `network_model_test`: 45 runs, 1870 assertions,
  0 failures.
- `npc_frustration_test`, `npc_workaround_test`, `npc_workaround_h_test`, `social_lockout_q33_test`,
  `social_sync_then_emit_test`: 115 runs, 752 assertions, 0 failures.
- `test/js/validator-network-model.test.mjs`: 61 pass.
- rubocop on the three changed Ruby models: no offenses.

## Minors

### MIN-1 — No reload-with-outage test for a kept remote session
`docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` §8 claims "a session over a route that went down
across a reload is kept". The behaviour is correct (`prune_unreachable_sessions!` at
`app/models/break_escape/network_access.rb:879` uses `structural_reach`, which ignores outages), but
no test exercises the reload path (`end_claimed_sessions!` at `app/models/break_escape/game.rb:1745`)
with an outage present. N7 takes the route down but never reloads.
Fix: add a case to `test/controllers/break_escape/network_outages_test.rb` that signs in over the
office pivot, takes `servers_offline` true, calls the reload scenario action (or `end_claimed_sessions!`
directly), and asserts `state['sessions']` still holds `sv_fs02` and its desktop reopens once the
global clears.

## Nits

### NIT-1 — Down-block host rows still carry `remoteSignIn: true` and a `session` object
`down_blocks` (`app/models/break_escape/network_access.rb:617-624`) builds its rows with the shared
`host_row` (`:679`), which sets `remoteSignIn: true` and a `session` block for a held password
session. A `route: "down"` block therefore ships a sign-in affordance; it relies entirely on the
client greying down blocks. The server refuses the sign-in regardless (`host_reachable_through?` via
`player_reach`), so this is not exploitable, only defence-in-depth.
Fix (optional): in `down_blocks`, override `remoteSignIn` to `false` on the rows it builds, so a
down block never advertises an action the server will refuse.

### NIT-2 — `session_route_up?` recomputes `player_reach` per call
`session_route_up?` (`app/models/break_escape/network_access.rb:778`) runs the `reach_walk` fixpoint
on every scoped request, and the `profile` scope in `session_admits?`
(`app/models/break_escape/game.rb:1390-1398`) calls it once per held session inside `.any?`. Harmless
at test scale (O(sessions x walk)); memoising `player_reach` per foothold for the duration of a
request would remove the repetition if a scenario ever holds many sessions.
Fix (optional): memoise `reach_walk` results keyed by `[foothold_id, ignore_outages]` for the request.

### NIT-3 — Unrelated reindent in `npc_frustration.rb`
The `workaround_body` case/when block (`app/models/break_escape/npc_frustration.rb:412-420`) was
reindented with no behaviour change. Confirmed neutral and rubocop-clean; flagged only because it is
unrelated to outages and slightly enlarges the O diff. No action needed.
