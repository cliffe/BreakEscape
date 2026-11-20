# UI slice 6 (Lock a held PC session): review R2

Fresh read-only review of `build/ui-slice6-lock`, tip `ec413bd63`, the fix at `788395b13`.
Diff: `git diff main...HEAD`. Live checks on a keyless standalone server on :3468 (game
3263, the network-model scenario, `sam_pc`, `sokafor` / `Okafor-Desk-4410`); forged reads
with curl, the pivot-reach check driven through the real model predicates with a Rails
runner. No code changed. Paths are in the worktree.

The fix turns Lock into a real server boundary. Every signed-in read resolves identity
through `Game#session_identity(pc_id)` (game.rb:1973), which now returns nil for a locked
session (game.rb:1977), so a locked PC is refused exactly as a signed-out one, and the two
admit predicates that read a held Hash directly gate the lock through `session_locked_at?`
(game.rb:1985, used at game.rb:1999 and network_access.rb:1244).

## Earlier findings - status

- **R1 BLOCKER 1 / integrator M1** (lock enforced only in the client; a forged GET reached
  the locked desktop and a share's secret): **CLOSED** for the desktop, desktop folders,
  profiles, directly mapped shares, copy/transfer and the remote/foothold desktop.
  `render_login_desktop` returns `no_session` 403 when `session_identity` is nil
  (games_controller.rb:2471-2472); the copy path refuses the same way
  (games_controller.rb:2766, scope at :2772); a mapped share skips a locked session
  (network_access.rb:1244); `find_mapped_share_item` / `share_mapped_at?` resolve through
  `session_identity` (network_access.rb:1333, :1346). Reproduced live with `sam_pc` locked:
  `GET /container/sam_pc` -> 403 `no_session`; `GET /container/scanned_inbox` (the open share
  on the desktop) -> 404 "Container not found". One residual read path survives, see MINOR 1.
- **R1 MAJOR 1 / integrator M2** (locking a claim or guest session a password can never
  unlock): **CLOSED**. `lock_session!` refuses a session whose `via` is not `password` with
  the same 422 as an unheld PC (game.rb:2480-2482); the client `canLock` and the `lockSession`
  guard never offer or attempt it for a claim/guest (pc-sessions.js:215, :480). Confirmed live:
  locking a claimed owner session and a guest session each return 422 and leave the record
  unlocked (access_model_login_test.rb, two tests, green).
- **R1 MINOR 1 / integrator n2, n3** (no tests for read-gating, a second account, a
  claim/guest lock): **CLOSED**. Rails tests drive the real controller: the local desktop and
  a profile copy are refused while locked then served after the password; a claim and a guest
  lock are 422; a second permitted account (Dana) signs in at a jake-locked PC and gets a fresh
  `{ id dana, via password }` with no `locked`, and the served desktop is hers
  (access_model_login_test.rb). The remote/share paths are covered in
  network_remote_signin_test.rb.
- **R1 MINOR 2** (`sessionLockingSupported` unconditional): **CLOSED**. True only when the
  scenario has a sign-in PC, via `scenario_has_login_pc?` (games_controller.rb:430,
  game.rb:1948). Live `GET /scenario` on a scenario with a sign-in PC returned
  `sessionLockingSupported: true`; the node test covers the false default.
- **integrator n1** (`set_session_locked!(..., false)` branch dead): kept by the owner's
  decision with a comment that it is for a future keyring grant (game.rb:2459). Noted, not a
  bug.

## New findings

### MINOR 1 - a locked session still extends a foothold's pivot reach, so an OPEN share on a network bridged only by that locked session is read without re-auth
`app/models/break_escape/network_access.rb:1115` (`reach_session_hosts`, no lock skip),
`:1230` (the open-share / foothold branch of `resource_admits_player?`)

The fix gates the session-based share branch (network_access.rb:1244) and every path that
runs through `session_identity`, but `reach_session_hosts` (network_access.rb:1116) still
counts any held session Hash, locked ones included. The foothold pivot walk
(`reach_walk_uncached`, network_access.rb:1089) uses it, so a locked session still bridges to
its linked networks. The open-share branch of `resource_admits_player?`
(network_access.rb:1230) admits an open share (no access list) on any network a held
foothold's `player_reach` includes. So an open share on a network reached only by pivoting
through the locked session is served with no password.

Shown through the real predicates with `sam_pc` locked, a held foothold on office_lan, and an
open share on the linked server_net: `reach_session_hosts` still lists `sam_pc`,
`player_reach('office_foothold')` still includes `server_net`, and `resource_admits_player?`
on the open server_net share returns true - the same as with the session unlocked.

Impact is limited: the pivot was established by a password sign-in, so honest re-entry is a
re-sign-in that reaches the same share, which `cheat-resistance-policy.md` (q78) treats as
acceptable for a password session (the lock "saves time", not access). But it contradicts the
fix's own contract ("every read path ... refuses a locked PC") and the owner's "a locked
session admits nothing until re-auth". The access-listed share across a pivot is already
safe, because that branch skips locked sessions (network_access.rb:1244). Only the
open-share-via-foothold branch and `session_route_up?` of a remote session chained beyond the
locked pivot (network_access.rb:1032) still trust the locked pivot.

Fix (owner to choose): either skip a locked session in `reach_session_hosts` for the access
walk only - the same shape as the host-service-off relay cut at network_access.rb:1099, which
drops a host from `player_reach` but keeps it in `structural_reach` so chained remote sessions
are not pruned - or record that a locked password session keeps its pivot by design and amend
the "every read path refuses" wording to name the open-share-via-foothold exception.

### MINOR 2 - the network view does not reflect the lock on a remote PC
`app/models/break_escape/network_access.rb:918` (`host_row`), `:836` (`via_for`)

`host_row` lists a locked remote password session as an openable `session` with no lock
state (it keys only on `via == 'password'`), and `via_for` still names the locked session as
the bridging account. No data leak: this is the player's own session, and opening its desktop
is refused by the `session_identity` gate (games_controller.rb:2471). It is a consistency gap
only - the network view invites an open the server will refuse, and shows no "locked" cue.
Carry the `locked` flag into the row (as the local sessions answer does, game.rb:2436) if the
start-panel UI wants to show lock state over the network.

## Items checked clean

- **The lock cannot be cleared except by a correct `POST /login`.** The only writer that
  removes `locked` is `start_login_session!` rebuilding a fresh record on a successful
  password sign-in (game.rb); `set_session_locked!(false)` has no caller. A second permitted
  account's sign-in replaces the record with its own fresh session and never resumes the
  locked holder's desktop (tested). Logout/reset and `prune_unreachable_sessions!`
  (network_access.rb:1150) only ever drop a session to signed-out, never into the held
  desktop. Live: a correct `POST /login` by the holder cleared `locked` and served the desktop
  (200); the forged GETs stayed refused until then.
- **Claim / guest takeover.** `claim_login_session!` (game.rb:2255) and
  `claim_guest_session!` (game.rb:2324) refuse while any session Hash is held, and a locked
  session is still a Hash, so neither can take over or drop a locked session.
- **POST /login lockout on a locked PC.** Unlock is the ordinary `attempt_login!`
  (game.rb:2169): it always checks the password and records a failure / lockout with no
  "already held, skip" branch; `maxAttempts` counts identically (tests assert 4,3,2,1 then
  locked-out, lock kept).
- **Reload and the sessions answer (delta, bounded).** `session_for_client` reads the raw
  record and adds `locked` only when true (game.rb:2436), so a reload keeps the lock and the
  answer does not grow for the common case; `sessions_for_client` carries it for remote
  sessions too. Live `GET /scenario` returned `sessions.sam_pc.locked: true`. `lock_session!`
  answers only the delta `{ pcId, locked }` (game.rb:2487). The client never sends `locked`
  back (node test).
- **Held-session counts / bounds.** `locked` is one boolean per sign-in PC. A locked session
  keeps its slot (claim refused), and a different account's login replaces rather than adds,
  so the state cannot grow past the number of sign-in PCs.
- **Outage / power-off.** `host_service_off?` and the outage walk are independent of the lock;
  a locked session is refused reads the same as a live one when its host is off.
- **Tests exercise real controller paths.** access_model_login_test.rb and
  network_remote_signin_test.rb are ActionDispatch integration tests hitting the real routes
  (`/login`, `/lock_session`, `/container`, `/inventory`). Both files green locally: 61 runs,
  634 assertions, 0 failures. Node pc-sessions.test.mjs: 42 pass, 0 fail.

## Verdict

**Approve.** Counts: 0 blocker, 0 major, 2 minor. R1's blocker and both reviews' findings are
genuinely closed: the lock is now a server boundary and the headline forged reads are refused
live, with the correct password the only way back into the held desktop. The two minors are
non-blocking: MINOR 1 (an open share reachable only through a locked pivot is still served, a
contract/wording gap the cheat policy tolerates for a password session) and MINOR 2 (the
network view shows no lock state). The owner should decide MINOR 1 - gate the pivot walk or
amend the "every read path refuses" claim - before the next merge batch; neither blocks
shipping the slice.
