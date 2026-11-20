# Access model slice 9.3b sub-slice K: code review round 1 (adversarial)

Reviewer pass over `git diff main...build/9-3b-k` (main already carries W, P, 9.2 C). Focus:
server authority over reach, leaks of unreached networks, links/pivot/prune, validator and
schema, save/reload, interaction with W/P/I, and the test and live-proof claims.

## Verdict

Server authority holds. Reach is computed server-side on every gate (`host_reachable_through?`,
`desktop_request_allowed?`, `resource_admits_player?`, `network_blocks`), a forged foothold id is
refused (`network_view` 404, no_exposure test), and onward sessions are pruned on both logout
(`logout_session!`) and reload (`end_claimed_sessions!`). The leak surface is clean: a network the
player neither reaches nor holds a session on is never named in `GET /network`, bootstrap or the
NPC-work `routes`. Links handle cycles (fixpoint in `reach_walk`/`networks_reachable_from`,
simple-path walk with `path.include?` in `all_reach_paths`) and the 8-path cap with a 64 ceiling.

No blockers, no majors. Three minors and two nits, all cosmetic or spec-wording.

Touched tests run green:
- `bin/rails test test/unit/network_model_test.rb test/controllers/break_escape/network_pivot_test.rb test/controllers/break_escape/network_no_exposure_test.rb`: 37 runs, 1732 assertions, 0 failures, 0 errors, 0 skips.
- `bin/test-js test/js/network-view.test.mjs test/js/validator-network-model.test.mjs`: 2 files passed (16 + 45 tests), 0 failed.
- Validator on `scenarios/test_access_networks/scenario.json.erb --no-graph`: exit 0, no `❌`, link-reach info lines present.

## Blockers

None.

## Majors

None.

## Minors

### m1. `via` tie-break uses host id, not session seq (spec divergence)
`app/models/break_escape/network_access.rb:494` picks the bridging host with
`candidates.min_by { |h| h[:host_id].to_s }`. Plan 5.1 (line 328) specifies "the one with the
lowest session `seq`, then by host id". `view_session_hosts`
(`app/models/break_escape/network_access.rb:474`) never carries the session seq, so the documented
primary key cannot be applied. The result is deterministic but can name a different host than the
spec when two pivot hosts on the same linked network both hold sessions. No security impact (label
only). Fix: have `view_session_hosts` include the session's `seq` (from `access_sessions[pc_id]`),
and in `via_for` tie-break with `min_by { |h| [h[:seq].to_i, h[:host_id].to_s] }`; or amend the
plan to say the key is host id.

### m2. `via` block omits the documented `displayName`
`app/models/break_escape/network_access.rb:495` returns `{ 'hostId', 'host' }`. Plan 5.1 (line 316)
documents the shape as `via: { hostId, host, displayName }`. The client
(`network-view-minigame.js` `blockSectionHtml`/`testState`) only reads `host`/`hostId`, so nothing
breaks today, but a later consumer following the plan will find `displayName` missing. Fix: add
`'displayName' => session_identity(best[:pc]['id'])&.dig('displayName')` (guarding nil), or drop
`displayName` from the plan's documented shape.

### m3. Open-share reach on a linked network does not require a pivot session there (confirm intended)
`app/models/break_escape/network_access.rb:735-744` (`resource_admits_player?` session branch) and
`mapped_shares` (`:751-768`) resolve reach with `networks_reachable_from` (pure link graph), gated
only by the share ACL. So a player holding any session at a host on a link-adjacent network can
open an **open** share (`access: nil`) on the linked network without ever opening a pivot session on
that network, e.g. a bare claim at an office PC opens an open share on a linked server net. The
foothold branch (`:728`) correctly uses `player_reach` (needs a pivot). This asymmetry looks
intended (the plan comment at `:757` describes a staff desktop mapping linked shares), and the test
scenario avoids it (backup_vault is ACL-gated, not open), so no beat is broken. Flagging for
confirmation: if the stricter "a session on the resource's own network is required" reading was
meant, the session branch should also require the resource's network to sit in some foothold's
`player_reach`. Otherwise, leave as is.

## Nits

### n1. `>8 paths` validator warning count can understate the real total
`scripts/validate_network.rb:286-289` reports `all_reach_paths(...).length`, which stops at
`REACH_PATHS_CEILING` (64, `lib/break_escape/network_model.rb`). When the real number of simple
paths exceeds 64 the warning says "joined by 64 link paths" as if exact. Fix: when
`count == REACH_PATHS_CEILING`, word it "at least 64" (or mention the ceiling), so an author with a
very dense graph is not misled.

### n2. `all_reach_paths` is recomputed per resource in the NPC-work composer
`reach_conditions` (`lib/break_escape/network_model.rb`) rebuilds the adjacency and re-walks the
link graph for every resource in every NPC's work list (`access_work.rb` `routes`/`routes_from`).
Bounded by the 64 ceiling so not a correctness problem, but on a dense link graph with many NPCs it
repeats work. Optional: memoise adjacency (or `reach_paths(from, to)`) per `data` within a plan
build. No change needed for K's scale.

## Checks that passed (for the record)
- Bootstrap withholds `networkLinks` whole (`WITHHELD_SCENARIO_KEYS`, `network_access.rb:18`); no
  link, network name, SSID, key, resource name, host or share content ships.
- Forged foothold: `network_view` returns 404 for an unheld id; `host_reachable_through?` returns
  false for an unheld foothold; plant checks `find_jack` + `object_reachable?`.
- Prune soundness: `prune_unreachable_sessions!` unions `structural_reach` over all footholds and
  ends only foothold-carrying sessions off every foothold's structural reach; a self-supporting
  cycle of onward sessions cannot bootstrap its own reachability (the fixpoint only crosses a link
  from a session on an already-reached network), so one pass suffices. Covered by the pivot test's
  "prune ends a session... keeps a local one" and "survives sitting down at the pivot host".
- Logout and reload both prune; `logout_session!` returns onward ids, surfaced as `endedPcIds` and
  closed client-side with `linkDropped` (reason `link_dropped`).
- W/P/I interaction: `reach_walk`/`structural_reach` key on `foothold['network']` regardless of
  `via`, so a Wi-Fi or implant foothold pivots identically; port security is orthogonal and
  untouched.
- Validator: malformed `networkLinks`, undefined-network and self-link errors; pivot-with-no-host
  and `>8` warnings; link-reach info line. Schema `networkLinks` un-reserved with a real definition.
- Lab `lab_physical_pentest` is not in the diff; K is inert without `networkLinks` (handover live
  check confirms office_lan-only behaviour unchanged).

## Round 1 outcomes (commit 4c91bf807)

- **m1 fixed.** `view_session_hosts` now carries each session's `seq` (its insertion position, which
  is its creation order, kept across prunes and keyboard settles), and `via_for` tie-breaks with
  `[seq, host_id]`, so the bridging host is the earliest pivot session then the lowest host id, as
  plan 5.1 says. No session field was added (sessions have no stored `seq`; adding one would break
  many exact-hash session assertions), so the insertion-order proxy is used.
- **m2 fixed.** The `via` block now carries `displayName`, the bridging session's account display
  name (`scenario_room_npc(session['id'])['displayName']`), guarding a missing npc.
- **m3 fixed (an open share on a linked network needs a pivot).** Decision from the plan: plan 5.1
  routes an **open** share through the foothold branch ("reached by any held foothold that reaches
  its network") and the session branch only "for a share with an access list"; 9.3a already made
  open shares foothold-reached, access-listed shares session-reached. The session branch (and
  `mapped_shares`) wrongly admitted an open share across a link via the pure link graph, so a bare
  session on a link-adjacent network opened a linked open share with no pivot. Fix: in the session
  branch and `mapped_shares`, an open share is reached from a session only on **its own network**;
  an access-listed share still maps across the pivot walk, gated by its list (the member-of-staff
  model). A linked open share now needs a foothold whose `player_reach` includes it, which only a
  held pivot session opens, matching the slice rule. The same-network open-share-via-local-desktop
  case (9.3a) is preserved. Two tests added to `network_pivot_test.rb` (m3 both ways).
- **n1 fixed.** The `>8 paths` validator warning says "at least 64" when the count hits
  `REACH_PATHS_CEILING`, so a very dense graph is not reported as exact.
- **n2 rejected.** Memoising `all_reach_paths` per resource is a performance-only change bounded by
  the 64 ceiling; no correctness issue at K's scale, so left as is (the reviewer agreed no change is
  needed).
