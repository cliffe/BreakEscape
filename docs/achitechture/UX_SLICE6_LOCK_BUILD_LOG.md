# UI slice 6: Lock a held PC session

Branch `build/ui-slice6-lock` (from main `6b2344e20`). Server side plus a thin client API
for the start-panel UI (built on `build/ui-slice6` by another agent). "Lock" keeps a PC
session held but requires the account's password again to get back in.

## What locking is

A held session (`player_state['sessions'][pcId]`, `{ id, via, foothold? }`) gains one
boolean, `locked`. The session stays held and `signedInPcs` is untouched, so the player is
still signed in; the next open shows the sign-in screen with the account pre-chosen, and a
correct password (an ordinary `POST /login`) replaces the record and so clears the lock.
There is no unlock route: unlock is the normal sign-in, so `maxAttempts` and lockout count
exactly as they do for any sign-in.

## Where `locked` lives and the predicate

- `app/models/break_escape/game.rb`
  - `session_locked?(session)` — the predicate (`session['locked'] == true`), works for any
    session kind (password, claim, a future keyring grant).
  - `set_session_locked!(session, locked)` — the one setter; unlock (`false`) deletes the key.
    Reached on unlock only through `start_login_session!`, which builds a fresh record with no
    `locked`.
  - `lock_session!(pc_id)` — only the holder can lock: a PC with no held session is refused
    `:unprocessable_entity` (covers a forged lock of a session the player does not hold).
    Returns the delta `{ pcId, locked: true }`.
  - `session_for_client(pc_id)` adds `'locked' => true` only when locked (absent = false), so
    the sessions answer never grows for the common case.

## Sync / size

`locked` is one boolean on the existing per-PC session record, bounded by the number of
sign-in PCs. The lock endpoint answers only the delta `{ pcId, locked }`, never the whole
sessions map. The sessions map is re-sent only on `GET /scenario` (bounded, as before). The
client never sends `locked` back as state (the server holds every session; the client mirror
is read-only to the server).

## Routes / controller

- `config/routes.rb`: `post 'lock_session'`.
- `app/controllers/break_escape/games_controller.rb`:
  - `lock_session` action; added to `set_game` and `with_game_lock` (reads/writes
    `player_state['sessions']`).
  - scenario response adds `sessionLockingSupported: true` (the capability flag).
- `app/policies/break_escape/game_policy.rb`: `lock_session?` => `show?`.

## Client API and capability flag

- `public/break_escape/js/api-client.js`: `ApiClient.lockSession(pcId)` -> `POST /lock_session`.
- `public/break_escape/js/systems/pc-sessions.js`:
  - `lockSession(pcId)` — posts, sets the local copy `locked`, closes an open desktop
    ("Locked. Sign in again to continue.", reason `locked`), emits `pc_session_locked`.
  - `isLocked(pcId)`, `lockingSupported()`, `locked` carried in `publicSession`, restored in
    `load(...)` (survives a reload), capability read from `load`'s third arg.
- `public/break_escape/js/core/game.js`: passes `sessionLockingSupported` to `pcSessions.load`.

## PC open flow (pre-chosen account)

- `public/break_escape/js/systems/unlock-system.js`: `openLoginPc` and `interactLoginPc`
  route a held-but-locked session to the sign-in screen, not the desktop (never a claim).
  `openLoginSignIn` passes `preselect` = the locked account's username.
- `public/break_escape/js/minigames/password/password-minigame.js`: when `signIn.preselect`
  is set, the matching tile starts selected (else the "Other user" field is pre-filled), so
  the player lands on the password field. The server still checks the password.

Not touched: `pc-monitor.js`, the start panel UI, the taskbar.

## Tests

- `test/controllers/break_escape/access_model_login_test.rb` (+8): lock, scenario answer
  carries `locked` + `sessionLockingSupported`, unlocked session has no `locked` key, unlock
  via the same password check with `maxAttempts` counting, wrong-try lockout, forged lock
  (422), forged unlock without the password (422, lock kept). 36 runs, 0 failures.
- `test/js/pc-sessions.test.mjs` (+5): lockSession posts and closes the desktop, refuses with
  no session and never sends `locked`, a 422 leaves it unlocked, `load` restores `locked` and
  the capability, default capability false. 39 runs, 0 failures.

## Status

Server, client API and tests done and green. Merged main (tip 1ce7486c7) into the branch:
one conflict in password-minigame.js (slice 2b0's remote-capture `other` default vs my
preselect) resolved by combining both; Rails login tests 36/0 and node pc-sessions/
password-signin-mode/access-remote-signin/access-signin-routing all pass after the merge.

Live proof on :3465 (Sam's PC in test_access_networks, playtest harness) PASSED, shots in the
session scratch folder: sign in (01-02), lockSession -> {ok:true} and isLocked true; reload
keeps `locked` on the server (GET /scenario) and the client restores it; opening the locked PC
shows the sign-in screen with Sam pre-chosen (03), a wrong password is refused and the PC stays
locked (04), the right password returns to the desktop (container minigame) and clears the lock
(05).

## 2026-11-13 - review fixes (R1 and integrator), lock made a real server boundary

The access-model owner ruled that Lock is a re-authentication gate, a real server boundary,
not a screen lock. Every finding from both reviews is now resolved. Tip `788395b13`.

### Where the gate lives

One shared predicate: `Game#session_identity(pc_id)` returns nil for a locked session
(game.rb ~1957). Every read path resolves the signed-in identity through it, so a locked PC
is refused exactly as a signed-out one, and future routes inherit the gate:

- `render_login_desktop` (games_controller.rb:2465): no identity -> `no_session` 403. Covers
  the local desktop and the remote/foothold desktop (one method serves both).
- `scope_admitted_by_session?` (game.rb): no identity -> a copy/transfer from a locked
  desktop is refused ("Not signed in", games_controller.rb:2766, and the scope check at 2772).
- `session_admits?` login_pc branch (game.rb): now also `!session_locked_at?(scope[:id])`, so a
  desktop folder read through a locked session is refused.
- `resource_admits_player?` (network_access.rb:1241): skips a locked session, so a share
  mapped only through a locked PC (list and file read) answers "not found".

A new helper `session_locked_at?(pc_id)` reads the stored record for the two admit tests that
check for a held Hash directly rather than through `session_identity`.

### R1 and integrator findings - outcomes

- R1 BLOCKER 1 / integrator M1 (lock enforced only in the client; a forged GET reached the
  locked desktop and a share's secret): FIXED by the gate above. Proven refused live (below).
- R1 MAJOR 1 / integrator M2 (locking a claim or guest session a password can never unlock):
  FIXED. `lock_session!` refuses a session whose `via` is not `'password'` with the same 422 as
  an unheld PC (game.rb). Client `pcSessions.canLock(pcId)` and the `lockSession` guard never
  offer or attempt it for a claim/guest session (pc-sessions.js).
- R1 MINOR 1 / integrator n2, n3 (no tests for read-gating, a second account, a claim/guest
  lock): FIXED. See Tests below.
- R1 MINOR 2 (`sessionLockingSupported` unconditional): FIXED. True only when the scenario has
  at least one sign-in PC, via `Game#scenario_has_login_pc?` (games_controller.rb:429).
- integrator n1 (`set_session_locked!(..., false)` branch dead): kept per the owner's decision,
  with a one-line comment that it is for a future keyring grant.

### Tests

- Rails, real controller paths. access_model_login_test.rb (+5): the local desktop is refused
  while locked and served after the password; a profile copy is refused while locked and
  allowed after the password; locking a claimed owner session is 422 and leaves it unlocked;
  locking a guest session (via claim, with a guestSessions marker) is 422; a second permitted
  account (Dana) signs in at a jake-locked PC and gets a fresh session, never the locked
  desktop. network_remote_signin_test.rb (+2): a share on a locked PC is refused (list and a
  file) then served after the password; the remote/foothold desktop is refused as signed-out
  then served after a remote re-sign-in. Both files green: login 32 runs, remote 29 runs, each
  0 failures (61/634 assertions together). Related access suites green: desktop/shares/
  footholds/pivot/no_password 91 runs, 0 failures.
- Node: pc-sessions.test.mjs (+3) for `canLock` (offered only for a held password session while
  supported; false without support; `lockSession` never POSTs for a claim/guest). 42 runs, 0
  failures. Related session node suites all green (remote-signin, signin-routing,
  password-signin-mode, etc.).

### Live proof on :3467 (game 3253, test_access_networks, sam_pc)

- The R1 forged reads reproduced and now refused. Unlocked (control): `GET /container/sam_pc`
  200, `GET /container/scanned_inbox` 200 with the letter text. After `lock_session!` on
  sam_pc: `GET /container/sam_pc` -> 403 `no_session`, `GET /container/scanned_inbox` -> 404
  not found. Same shape as the signed-out state.
- Client flow via the playtest harness and the window.__test bridge: the game loaded the
  locked session from the server (the reload case), opening sam_pc showed the sign-in screen
  with Sam pre-chosen (password field only, a Change control); a wrong password kept the lock
  (server session still `locked:true`); the right password opened the desktop (ContainerMinigame)
  and cleared the lock (server session back to `{id sam, via password}`).

## 2026-11-13 - R2 minor fixes, train 33 merge, live proof

Tip `d3fe5efe3` (R2 fixes `450027522`, merge `6f72a651d`, hot-desk guard `d3fe5efe3`).

### R2 minor 1 - a locked session no longer extends a foothold's pivot reach for access

The access walk (`player_reach`, i.e. `reach_walk_uncached` with `ignore_outages: false`) now
skips a locked session host, mirroring the host-off relay cut just above it
(network_access.rb ~1110): `next if !ignore_outages && session_locked_at?(host[:pc_id])`.
`structural_reach` (outages ignored) is unchanged, so the network view still draws the link.
The walk cache (`reach_cache_key`) gains a per-session `sessions_locked` component for the
outage walk, so locking a session invalidates its cached `player_reach`. This single cut fixes
both `:1115` (the pivot) and the open-share/foothold consumer at `:1230`, because that branch
reads `player_reach`; `session_route_up?` (a remote session chained beyond the locked pivot)
is fixed by the same cut for the same reason. The owner ruled Lock is a real server boundary.

Rails test (network_pivot_test.rb): an open share on server_net, bridged only through a locked
office pivot (lena_pc), is refused (404) while locked and served after a correct POST /login;
`player_reach` drops server_net while locked, `structural_reach` keeps it.

### R2 minor 2 - the network view shows a locked remote PC as Locked

`host_row` carries `locked` on the held-session row and `via_for` carries `locked` on the
bridge object (network_access.rb). The client `hostAction` returns `'locked'` for a held,
locked password session, and the host row draws the existing padlock "Locked" badge
(`network-row-locked`, the same one a locked share uses) in place of Open; the "through
&lt;host&gt;" block title gains "(Locked)" when the bridge is locked. No new look.
Tests: network_remote_signin_test.rb (the row carries `locked`), network_pivot_test.rb (a down
block through a locked pivot names the bridge locked), network-view.test.mjs (+2: hostAction
and the DOM badge).

### Train 33 merge (main ac526d218) - hot desk vs lock

`git merge main` was a clean merge (no conflicts; only the client hot-desk
workstation-state.js, its two node tests, and docs changed). Checked the interaction: the
hot-desk borrow/guest-leave flow touches only the NPC-workstation sim (`guests` map, screen
globals) and ends only `via: 'claim'` sessions via `ownerReturned`/`screenAutoLocked` (both
guard `via === 'claim'`). A locked session is always a `via: 'password'` session, the server
refuses claim/guest takeover of any held session and refuses locking a non-password session,
so no hot-desk path can clear, bypass or create a lock. Added a node regression test
(pc-sessions.test.mjs) that a hot-desk owner-return and auto-lock leave a locked password
session held and locked.

### Tests and live proof

- Rails (touched + related access suites, unlocked): network_pivot 23, network_remote_signin
  12 (the two touched files 35 runs / 260 assertions, 0 failures); access_model_login,
  network_shares, network_outages, network_footholds, network_implants,
  network_host_service_off, network_wifi, network_link_names together 167 runs / 1581
  assertions, 0 failures.
- Node: network-view 45, pc-sessions 43, workstation-state 55, test-bridge-access 15, all 0
  fail.
- Live on :3469 (keyless, stopped by PID; test game destroyed): through the real model
  predicates and the real login path on the running app, with a locked lena_pc pivot and an
  open share on the linked server_net - unlocked, `player_reach` reaches server_net, the open
  share is admitted and `session_identity` is present; locked, `player_reach` drops server_net
  while `structural_reach` keeps it, the open share and the remote desktop are refused and
  `session_identity` is nil; after a correct login the lock clears and both serve again. HTTP
  forged GETs on the locked game: `/container/lena_pc?foothold=...` -> 403 `no_session`,
  `/container/server_public?foothold=...` -> 404; the office_lan own-network share stays 200
  (not over-blocked); both serve 200 after the login.

## Handover

- Done: the lock is now a real server boundary (re-auth gate); every read path refuses a locked
  PC through `session_identity`; `lock_session!` refuses non-password sessions 422; client
  `canLock` + `lockSession` guard; `sessionLockingSupported` gated on a sign-in PC existing;
  Rails + node tests; forged-request and client-flow live proof on :3467. Committed at
  `788395b13`. Server stopped by PID; harness session closed.
- Open: nothing from the two reviews. The start-panel UI that calls `canLock`/`lockSession` is
  built on another branch (out of this diff); it should read `pcSessions.canLock(pcId)` to
  decide whether to show Lock.
- Gotchas: a new member action needs `set_game` AND `with_game_lock` AND a `GamePolicy`
  predicate, or it 500s. `locked` is added to the sessions answer only when true, so the
  existing exact-equality scenario tests still pass. `session_for_client` reads the raw session
  record (not `session_identity`), so gating `session_identity` for locked sessions does not
  affect the scenario answer or reload. Guest sessions are `via: 'claim'` on the server, so the
  non-password guard covers them.
