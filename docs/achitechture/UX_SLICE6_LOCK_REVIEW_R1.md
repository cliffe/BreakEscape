# UI slice 6 (Lock a held PC session): review R1

Read-only review of `build/ui-slice6-lock` (tip `b71385a18`, main `1ce7486c7` merged at
`49da6754b`). Diff: `git diff main...HEAD`. Live checks run against a keyless standalone
server on :3466, game 3251, scenario `test_access_networks`, Sam's PC (`sam_pc`,
`sokafor` / the sticky-note password). Forged requests were sent with curl, because a
forged request is by definition one the client would not send.

Paths cited are in the worktree.

## Constraint check (the four from the access-model owner)

1. One bounded boolean `locked` on the held-session record, a delta, never sent back by
   the client. HOLDS. `locked` is one key on `player_state['sessions'][pcId]`
   (game.rb:112-116, set at 2112-2114); bounded by the number of sign-in PCs.
   `session_for_client` adds it only when true (game.rb:73-75), so the common case does not
   grow. `POST /lock_session` answers the delta `{ success, pcId, locked }`
   (controller:42-50), never the sessions map. The client posts only `pc_id`
   (api-client.js:264-266) and `publicSession` carries `locked` outward only, read-only to
   the server (pc-sessions.js:114-116); the node test asserts no `"locked"` in any outbound
   call (pc-sessions.test.mjs:616-617). Live: lock answered
   `{"success":true,"pcId":"sam_pc","locked":true}`.

2. Unlock goes through the same sign-in password check, no new route, lockout counts the
   same, one reusable predicate. HOLDS for the unlock *route*. There is no unlock endpoint;
   unlock is an ordinary `POST /login` through `attempt_login!` (game.rb:2141-2185), which
   always checks the password (2171) and records a failure / lockout (2167, 2184) with no
   "already held, skip password" branch. A successful sign-in rewrites a fresh record with
   no `locked` (`start_login_session!`, game.rb:2962-2963), clearing the lock. The predicate
   `session_locked?` / setter `set_session_locked!` (game.rb:84-99) are kind-agnostic. Live:
   four wrong tries returned attemptsLeft 4,3,2,1 and the lock was kept; the right password
   returned the desktop and cleared `locked`. But see BLOCKER 1: "no cached-password bypass"
   is defeated for *reads* even though the unlock route is clean.

3. Only the holder can lock; locked survives reload. HOLDS. `lock_session!` refuses a PC
   with no held session Hash with 422 (game.rb:2108-2110); live the forged lock of an unheld
   PC returned 422 and wrote nothing. Reload: `GET /scenario` re-serves `locked:true`
   (session_for_client) and the client restores it on `load` (pc-sessions.js:197-198,
   173-181); live the scenario answer carried `locked:true` and `sessionLockingSupported`.

4. Rails tests including a forged unlock returning 422. PRESENT and green
   (access_model_login_test.rb:550-568). See MINOR 1 for a coverage gap.

## Findings

### BLOCKER 1 - the lock is enforced only in the client; a forged read reaches the locked desktop and a share's secret contents without the password

The server stores `locked` but checks it on no read path. `render_login_desktop` serves the
desktop whenever a session identity exists (controller:2470-2471, never `session_locked?`);
`session_admits?` for a `login_pc` / `resource` / `profile` scope checks only that a session
Hash is held and the route is up (game.rb:1965-1987); `scope_admitted_by_session?` likewise
(game.rb:1991-2010), so file copies from a locked desktop are admitted too. A held-but-locked
session is a cached grant that bypasses the password for every direct read, which is exactly
what constraint 2 forbids ("no cached-password bypass") and what the review brief asked be
"refused".

Proven live, with `sam_pc` locked:

- `GET /games/3251/container/sam_pc` -> HTTP 200, full desktop (the mapped share folder) plus
  `session.locked:true`. The locked desktop is served.
- `GET /games/3251/container/scanned_inbox` -> HTTP 200, the share's file `scan_0412.pdf` with
  its text "Starter password: Ledger-Lena-9" - the credential the share exists to teach,
  returned without re-entering the password.

(The claim path is correctly closed: `POST /login {claim:"owner"}` on the locked PC returned
422 "Sign in required", because a session Hash is already held - game.rb:2227. Guest claim is
closed the same way, game.rb:2296.)

There are two readings, and the owner must pick:

- Screen-lock semantics (what the build log describes: "the session stays held ... so the
  player is still signed in"). Then the server session legitimately persists, the lock is a
  UI convenience, and a forged read returning data the player already earned is not a leak.
  Under this reading the feature is working as built and BLOCKER 1 is downgraded to "by
  design" - but the brief's "confirm each is refused" and the cheat-resistance line
  ("any forged client request must fail") then need to be revised, because neither holds.
- Re-authentication gate (what the brief states). Then the desktop of a locked PC, and any
  share/profile reachable only through that locked session, must be refused until unlock,
  while the session record stays so reload keeps the lock. Fix: in `render_login_desktop`
  return a `no_session`-style 403 (reason e.g. `locked`) when `session_locked?(session)` for
  that PC; and in `session_admits?` / `scope_admitted_by_session?` treat a scope that resolves
  only through a locked session as not admitted. Keep the record (constraint 3) and leave
  `signedInPcs` untouched. Decide separately whether a locked session should still carry
  network pivots and outage handling (today it does, because locked == held everywhere).

Recommendation: treat as a blocker pending that decision. As written the feature's stated
property ("getting back in needs the password again") is defeated by one forged GET, so it
cannot ship as a re-auth gate, and if screen-lock is intended the brief and the client-only
nature should be recorded so nobody later mistakes it for a server boundary.

### MAJOR 1 - locking a claim or guest session can strip access it granted without a password

`lock_session!` locks any held session Hash with no check on `via` (game.rb:2105-2115). A
`via:'claim'` or `via:'guest'` session was entered *without* a password (an owner walked away
from an unlocked screen, or an NPC left one open). The only unlock is the password check in
`attempt_login!`, and the client pre-fills the owner's username on a locked open
(unlock-system.js:626, password-minigame.js:296-315). So locking a claimed session converts a
password-free hold into a password-required one the player may never be able to satisfy, with
no recovery route. The start-panel UI that decides when to offer Lock is out of this diff
("Not touched" in the build log), so the server must guard it. Fix: refuse `lock_session!`
when the session's `via` is not `'password'` (or otherwise guarantee the UI never offers Lock
on a claim/guest), returning the same 422 as an unheld PC. Needs an owner decision on what
unlock means for a password-free session.

### MINOR 1 - no test covers read-gating while locked

The Rails tests cover the lock delta, the scenario answer, unlock-via-login with lockout
counting, and a forged lock/unlock 422 (access_model_login_test.rb:494-568). None asserts
whether `GET /container` on a locked PC or its share is refused - it cannot, because nothing
refuses it (BLOCKER 1). The "forged unlock" test (lines 558-568) is really a wrong-password
`POST /login`, which is correct but does not exercise read-gating. If BLOCKER 1 resolves as a
re-auth gate, add controller tests for the locked desktop and a locked-PC share.

### MINOR 2 - `sessionLockingSupported: true` is unconditional

The capability flag is hard-coded true for every scenario (controller:429). Harmless as a
server capability, but it will surface the Lock affordance in missions where locking a session
makes no narrative sense. Flag for the owner; a per-scenario gate could come later.

## Items checked clean

- Merge conflict in password-minigame.js: slice 2b0's remote-capture `other` default is
  intact as the first disjunct and combined with `presetOther` via `|| presetOther`
  (password-minigame.js:307-312); the preselect adds `presetUsername` and tile selection
  without changing the 2b0 branch. Correct.
- Client preselect: `openLoginSignIn` passes `preselect = current.locked ? current.username`
  (unlock-system.js:626, 475); `openLoginPc` / `interactLoginPc` route a locked session to the
  sign-in screen, never the desktop and never a claim (unlock-system.js:265-267, 484-489). The
  minigame selects the tile or pre-fills "Other user" (password-minigame.js:296-315,
  1500-1503). Server still checks the password.
- Authorisation on `POST /lock_session`: `lock_session?` => `show?` (game_policy.rb:89-91),
  plus `set_game` and `with_game_lock` (controller:28, 42) - the same chain as login/logout,
  so another player's game is refused by `show?` (owner?/admin/manager) and the game lock is
  held for the write. The policy predicate is present, so no 500 (the build log's own gotcha).
- Sync size: nothing grows or is re-sent (constraint 1 above). The sessions map is re-sent
  only on `GET /scenario`, bounded as before.
- Both touched test files pass locally: `test/js/pc-sessions.test.mjs` 39/0,
  `test/controllers/break_escape/access_model_login_test.rb` 36/0.

## Verdict

Changes requested. The slice is well built on its own terms - bounded delta, clean unlock
route, closed claim paths, authorisation and sync all correct - but it does not meet the
brief as written: the lock is a client-side screen lock only, and a forged `GET /container`
returns the locked desktop and a share's secret contents without the password (BLOCKER 1).
The owner must decide between screen-lock semantics (accept, and revise the brief) and a
re-auth gate (enforce `session_locked?` on the locked PC's reads). MAJOR 1 (locking a
password-free claim/guest session) needs a guard either way. Do not merge to main until
BLOCKER 1 has an owner decision and MAJOR 1 is guarded.
