# Access model slice 9.3b sub-slice K: code review round 2 (adversarial, fresh eyes)

Reviewed `git diff main...build/9-3b-k` against the plan (`ACCESS_MODEL_SLICE_9_3B_PLAN.md`
sections 5.1, 6, 7, 9, 13) without reading the round 1 review. Scope: network links and the
pivot. Date 2026-11-12.

## Summary

- Blockers: 0
- Majors: 0
- Minors: 2
- Nits: 3

Server authority holds under a tampered client. Footholds and sessions live only in
`player_state` (`network_access.rb:45`), never client supplied. Every access gate recomputes
reach live per request:

- Reaching a linked network with no pivot is refused: `player_reach` seeds the foothold's own
  network and only crosses a link from a held session on an already reached network
  (`reach_walk`, `network_access.rb:583`), so a bare foothold reaches its own network only.
  `host_reachable_through?` (`:680`) and `attempt_login!` (`game.rb:1549`) reject the
  cross-link sign-in (test N1b, `network_pivot_test.rb`).
- A forged foothold id is rejected: `network_footholds[id]` is nil, `reach_walk` returns an empty
  set, and `network_view` returns `:not_found` for an unheld foothold (`:426`).
- Keeping onward sessions after sign-out: `prune_unreachable_sessions!` (`:623`) ends every
  session carrying a `foothold` whose PC network is in no held foothold's `structural_reach`,
  called from `logout_session!` and `end_claimed_sessions!` (`game.rb:1712`, `:1736`). The one
  pass is sound: `structural_reach` is a fixpoint computed after the triggering delete, and a
  session on an unreached network cannot itself have expanded the reach, so removing it cannot
  orphan a survivor (test N4 and the model-level prune test).
- Reload: `end_claimed_sessions!` prunes onward pivots after clearing claims.

Open-share rule change vs 9.3a is correct: a same-network open share still opens from a
foothold on its own network (`resource_admits_player?` foothold branch, `:735`) or a session on
its own network (`open_share ? host_net == network`, `:753`); a linked open share needs a
foothold that pivots to it, never a bare adjacent session (test m3). `mapped_shares` mirrors this
(`:778`). 9.3a controller suites and the no-exposure suite pass unchanged.

Leaks: the scenario endpoint withholds `networks`, `networkLinks` and `resources` wholesale
(`WITHHELD_SCENARIO_KEYS`, `network_access.rb:18`), so no link topology or server-network name
reaches the bootstrap. `GET /network` names only networks in `player_reach` plus down blocks for
networks the player already holds a session on (`network_blocks`, `:447`); a down-by-default,
never-reached network is absent (beat N5). No unreached network name leaks in `/network`,
`/login` or `/scenario` (no-exposure test over `SERVER_STRINGS`).

W/P/I interactions: sub-slice K ships `network_up?` as a constant `true` (`:571`) and no
`downIf`, `ssid`, port-security or implant fields; those stay reserved in the validator loop and
schema, so K does not touch W/P/I. Cycles and the path cap: `all_reach_paths` is simple-path only
(`path.include?`), bounded by `REACH_PATHS_CEILING = 64`, and the runtime reach walk
(`reach_walk`) is an independent uncapped fixpoint, so the eight-path cap on `reach_paths` limits
only `reach_conditions` (9.2/validator), never server authority.

## Tests run

- `bin/rails test test/unit/network_model_test.rb test/controllers/break_escape/network_pivot_test.rb test/controllers/break_escape/network_no_exposure_test.rb`: 40 runs, 1751 assertions, 0 failures, 0 errors, 0 skips.
- `node --test test/js/network-view.test.mjs test/js/validator-network-model.test.mjs`: 61 pass, 0 fail.
- Validator over `test_access_*` and the labs (`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`): every `test_access_*` scenario 0 ❌, including `test_access_networks` (the only scenario that uses `networkLinks`). Lab ❌ counts (lab_exploitation 13, lab_feeling_blu 10, lab_malware_metasploit 1, lab_post_exploitation 12, lab_vulnerabilities 3, lab_vulnerability_analysis 9) are pre-existing ink errors (standalone emote and `//` comment lines in `ink/instructor.ink`), none from the `networkLinks` checks; those labs carry no `networkLinks`.

## Minors

### m1. Validator "reachable only by a pivot" check under-warns (false negatives)
`scripts/validate_network.rb:275-276`. The suppression test
`next if intermediates.any? { |net| host_on.call(net) }` folds every node on every path into one
set and passes if any single one carries a sign-in host. A network is reachable only if some
whole path is usable, which needs a sign-in host on every network *before* the target, not on any
one of them. A chain `jack(A, host) -> B(no host) -> C(host, target)` is genuinely unreachable (no
host on B to open the second hop), yet A's host suppresses the warning. It never produces a false
positive (the brief's concern), so no valid scenario is wrongly flagged; it just misses some dead
links. Fix: test reachability per path, warning only when no path is fully usable:
```ruby
usable = paths.any? { |path| path[0..-2].all? { |net| host_on.call(net) } }
next if usable
```
(each `path` runs from a jacked source to `net_id`; the target itself needs no host).

### m2. No integration coverage for the reload and unplug onward-prune beats
`network_pivot_test.rb` covers the N4 logout prune and a model-level `prune_unreachable_sessions!`
call, but not the two other callers the plan names: `end_claimed_sessions!` pruning an onward
pivot whose bridge was a claim reset on reload (`game.rb:1736`), and an unplug ending an onward
cross-link session through `end_sessions_through!`. The prune logic is shared, so this is a
coverage gap rather than a defect. Fix: add one controller test that opens a pivot through a
claimed office host, triggers `end_claimed_sessions!` (reload), and asserts the onward server
session is gone; and one that unplugs the device and asserts the onward session ends.

## Nits

### n1. `via_for` looks up the bridging session by host id, not the tracked session key
`network_access.rb:499`: `session = access_sessions[best[:host_id].to_s]`. `view_session_hosts`
already records the session's own key as `pc_id` (`:479`); `via_for` discards it and re-keys by
`host_id`. This works only because sessions are keyed by the object id today. If a sign-in PC's
session key ever diverged from its object id, `displayName` would silently drop. Fix: carry
`pc_id` through the `min_by` and look up `access_sessions[best[:pc_id]]`.

### n2. `player_reach` recomputed per foothold per access check
`network_access.rb:735` and the session loop at `:748`, plus `mapped_shares`
(`:778`), each run a full session-walk BFS once per foothold (and `resource_admits_player?` is
called per resource). Correct, but O(footholds x sessions) per request on hot paths. Fine at
current scenario sizes; memoise `player_reach`/`networks_reachable_from` per request if a dense
scenario ever shows up.

### n3. Asymmetry between foothold-pivot reach and session mapping is undocumented in code
A held foothold reaches an access-listed share only by a hop-by-hop pivot (`player_reach` needs a
session at each hop), while a session maps an access-listed share across the whole link closure
(`networks_reachable_from`, no per-hop session). This is the intended member-of-staff model
(plan 5.1) and the ACL gates it, so it is not a finding, but a one-line comment at
`mapped_shares` noting the closure walk is deliberate (not a pivot) would save a future reader the
double-take.
