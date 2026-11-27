# Network fixes code review, round 2 (build/net-fixes against main)

Scope: `git diff main...build/net-fixes` at 431b18a69, the build log `NET_FIXES_BUILD_LOG.md`,
round 1 (`NET_FIXES_CODE_REVIEW_R1.md`) and plan 9.3b sections 5.2 and 5.5. The coordinator's
decision after round 1: a switched-off PC is off for everything that goes through it. The keyboard
sign-in at a switched-off PC (round 1 m2) waits on the user's q72 and is not raised again here.

Counts: 0 blockers, 0 majors, 3 minors, 4 nits.

Three behaviours were checked with a throwaway integration test against the `NetworkModelScenario`
pivot fixture (deleted afterwards, not committed). Its results are quoted under m1, m2 and n3.

## Round 1 fixes

| R1 item | State |
|---|---|
| M1, an off host relays a pivot | Fixed. `reach_walk_uncached` skips an off session host only when `ignore_outages` is false, so `player_reach` drops the onward network and `structural_reach` keeps it. The onward network shows in a `route: "down"` block. Tests fail without the fix. |
| M2, a share served through a session at an off host | Fixed for remote sessions, with `session_route_up?` added as suggested. The check also reaches keyboard sessions, which opens m1 below. |
| m1, no time bound on the sync | Fixed: a 3 s race, test with a sync that never settles. What the player sees when the race is lost is m3 below. |
| m2, keyboard at an off PC | Waiting on q72. |
| Nits 1 to 6 | All done: soft-gate comment, array key, a walk-counting cache test, `isNew` guard on both implant branches, plan 5.5 reload clause, `heldAs` on the off row. |

## What holds up

- **The two walks agree where it matters.** The off check sits in the shared walk behind
  `!ignore_outages`, the same switch the outage test uses, so the two walks differ only in
  outages and off hosts. `prune_unreachable_sessions!` reads only `structural_reach`, and both of
  its callers (`logout_session!`, `end_claimed_sessions!`) go through it. The probe switched Lena's
  PC off with Lena's and Ian's remote sessions held, then reloaded (`GET /scenario`) and signed out
  of a third session: both sessions were still there, and the `sv_fs02` desktop answered 200 once
  the PC was back on. No client path drops a session on an `unreachable` 403: `container-minigame`
  drops its copy only on `no_session`.
- **Down blocks.** `down_blocks` takes structural minus player reach, so an onward network behind
  an off host appears greyed. Its `via` is worked out over `structural`, so it names the off host,
  which is the right hint. Rows in it lose `responding` and `heldAs` as well as the controls.
- **The cache key cannot go stale between requests or within one.** The key is rebuilt from live
  state on every call. `hosts_off` reads `host_service_off?` for every session key, a superset of
  the hosts the walk reads, and only for the outage walk, which is the only walk that reads it.
  `host_service_off?` reads `frustration_globals`, which merges `player_state['globalVariables']`
  over the scenario defaults on each call with no memo of its own, so a global changed by
  `PUT /sync_state`, by `set_global` in a test, or by a `with_lock` reload changes the key. Each
  request loads its own `Game`, so nothing carries across requests anyway. The one input still
  outside the key is an in-place edit of a room's or object's `network` (round 1 nit 2), which
  nothing does at runtime.
- **Routes through a session.** `GET /container` for a host scope, a profile scope and a resource
  scope (`session_admits?`), a desktop add (`scope_admitted_by_session?`), a share add
  (`resource_item_for_add`), unlocks (`path_unlocked?` under `session_admits?`) and the desktop
  itself (`desktop_request_allowed?`) all refuse a remote session at an off host or over a down
  route. `session_route_up?` returns true for a session with no foothold, so the keyboard path is
  unchanged except for shares (m1).
- **Implant changes.** The two answers in flight now emit and open once in either order, and the
  `already` branch decides "first" from the browser's own `gained` set. Tests cover both orders.

## Minors

### m1. At the keyboard of an off PC, a mapped share lists but will not open, yet its files can be added

R1 M2's `next false if host_service_off?(...)` in `resource_admits_player?` applies to every
session, local ones included. `session_route_up?` and `mapped_shares` do not check the service for
a local session. Probe: keyboard sign-in at `lena_pc` (200), PC switched off, then

- `GET /container/lena_pc` (keyboard desktop): 200, contents include `ledger_archive`;
- `GET /container/ledger_archive`: 404;
- `POST /inventory` add of `ledger_handover` with `source_pc_id: lena_pc`: 200, item added.

So the desktop shows a share folder that answers "not found" when clicked, while a file from that
same share can still be taken through `scope_admitted_by_session?` and `share_mapped_at?`. The
README line "serves no share through a session there" describes the read path only.

This is a consequence of the round 1 fix, separate from q72 itself. Whatever q72 decides, the read
and the add should agree. To leave the keyboard working until q72 is answered (the build log's
stated intent), narrow the new check to remote sessions:
`next false if (session['foothold'].present? && host_service_off?(info[:object])) || !session_route_up?(pc_id)`.
`session_route_up?` already covers the remote case, so the explicit service check could go. Add a
keyboard case to `network_host_service_off_test.rb`.

### m2. An up block can name an off host as the one it is reached through

`via_for` picks among session hosts on a linked, reached network with no service check. When two
held sessions bridge the same link and the one with the lower `seq` is switched off, the walk
crosses through the live host but the label names the off one. Probe (pivot fixture, Sam's PC
given `offWhen`, remote sessions at `lena_pc`, `sam_pc` and `sv_fs02`, Sam's PC switched off):

    server_net up, via { hostId: "sam_pc", host: "HB-DESK-01", displayName: "Sam Okafor" }

while Sam's row on `office_lan` reads "not responding". The route really runs through Lena. Fix:
in `network_blocks`, filter off hosts out of the candidates for an up block (pass a predicate, or
drop off hosts from `session_hosts` before calling `via_for` there, but not in `down_blocks`, which
should keep naming the off host). One assertion in the M1 test file pins it.

### m3. A view opened after the 3 s limit is not marked as possibly out of date, and never catches up

When the race is lost, `view()` fetches at once and returns `{ ok: true, view }` exactly as for a
fresh view. The sync carries on in the background, and if its PUT lands after the GET was served,
the view keeps the old state: a PC switched off a moment ago still offers "Sign in". Nothing
refetches when the late sync lands (plan 5.2's five-second refetch is not built; it is in the
backlog). The player then clicks "Sign in" and gets "This PC can't be reached." from the password
screen, which does not match a row that offered a sign-in.

This matters only on a slow link, and the next open is fresh, so it is a minor. Cheap fix: return
`stale: true` from `view()` when the timer won the race, show a short line in the view such as
"Still updating. Close and reopen if this looks wrong.", and when `synced` later settles true while
the same view is open, call `load()` once more. One JS test for each: the flag, and the single
refetch.

## Nits

1. **The client ignores the server's "not responding" wording.** The server answers a remote
   sign-in at an off host with `message: 'PC not responding'`, but the password screen shows its
   own "This PC can't be reached." for any 403, and a held desktop refused there lands on
   `unreachableMessage`, "HB-FIN-02 can't be reached over this link." The host is reachable; it is
   off. A `reason: 'not_responding'` (or reading the message) would let both say "not responding",
   matching the row.
2. **The cache key now costs about what it saves.** For every held session the key runs
   `find_login_pc`, `AccessWork.affordance` and `frustration_globals` (a dup and merge of all
   globals), then serialises the networks and links to JSON. The uncached walk does
   `find_login_pc` once per session too. Correct, but the memo no longer obviously pays for itself.
   Building `frustration_globals` once per key, or dropping the cache, are both fine.
3. **No test triggers a prune while a host is off.** The M1 test switches the PC off and back on
   with no reload or sign-out in between, so it would not notice a later change that made
   `prune_unreachable_sessions!` read `player_reach`. The probe above (reload plus an unrelated
   sign-out while off, both sessions kept) is the assertion to add.
4. **`seq` follows jsonb key order, not creation order (pre-existing, outside this branch).**
   `view_session_hosts` comments that `seq` is "its creation order, kept across prunes". The
   column is `jsonb`, which stores object keys sorted by length and then bytewise, so after a save
   `sam_pc` sorts before `lena_pc` whatever the sign-in order. The probe saw this: Lena signed in
   first, yet the via named Sam. Labels stay deterministic, so this matters only for the comment
   and plan 5.1's stated tie-break. Backlog, not this branch.

## Tests run (no lock, per the test lock rule)

- Rails: `test/controllers/break_escape/network_*_test.rb` (9 files) with
  `test/models/break_escape/game_test.rb`: 231 runs, 3036 assertions, 0 failures, 0 errors, 0
  skips. `test/models/break_escape/network_withholding_test.rb`: 6 runs, 0 failures.
- JS: `network-links` 63 of 63, `network-view` 19 of 19, `validator-network-model` 63 of 63,
  plus the importers of the changed modules: `access-remote-signin` 13 of 13,
  `network-links-routing` 4 of 4, `objectives-network-footholds` 4 of 4, `test-bridge-access`
  12 of 12.
- No test covers m1, m2 or m3.
