# UI slice 6 (Lock a held PC session) — integrator server review

Branch `build/ui-slice6-lock`, tip `b71385a18`, with main `1ce7486c7` merged in.
Diff `git diff 1ce7486c7...b71385a18`. Review only; no code changed. Paths are relative to
the worktree `.claude/worktrees/p-ui-6-lock`.

**Counts: 0 B, 2 M, 3 n.** The core design is sound: `locked` is one boolean on the existing
per-PC session record, it is never accepted back from the client, unlock is the ordinary
`POST /login` password check with no new route, and a forged lock / wrong-password unlock is
refused 422 with the lock kept. Both M findings and all three n's concern sessions the player
holds *without* a password (claim / guest) and the fact that the lock is a client-only gate.

## Constraint check (summary)

1. **One flag, delta, never accepted back — PASS.** `locked` lives on `player_state['sessions'][pcId]`
   (`game.rb:2425` `set_session_locked!`), bounded by the number of sign-in PCs. The lock endpoint
   answers only `{ success, pcId, locked }` (`games_controller.rb:1368`); the whole sessions map is
   re-sent only by `GET /scenario` as before. The `sync_state` merge allow-list
   (`games_controller.rb:2116` `merge_last_write_wins_sections`, `:2192` `merge_grow_only_sections`)
   has **no** `sessions`/`locked` key, and the `update_room` `permit` lists (`:3132`, `:3143`, `:3151`)
   are object-state only. The only writers of `player_state['sessions']` are server-authoritative
   member actions (login/logout/claim/lock_session/network). The client cannot set or clear `locked`
   through any sync path. Confirmed.
2. **Unlock = same password check — PASS, with one answered question (see below).** No unlock route;
   `attempt_login!` (`game.rb:2141`) is the only clearer, rebuilding the record with no `locked`
   via `start_login_session!` (`game.rb:2958-2968`); `maxAttempts` and lockout count identically
   (tests prove 4,3,2,1 then `lockedOut`). Claim cannot hijack a locked session: `claim_login_session!`
   refuses while any Hash session is held (`game.rb:2227`), and a locked session is still a Hash.
3. **One predicate, reusable — PASS.** `session_locked?` / `set_session_locked!` (`game.rb:2418`,
   `:2425`) act on any session Hash (password, claim, future keyring grant).
4. **Holder-only, survives reload, forged → 422 — PASS.** `lock_session!` (`game.rb:2439`) refuses a
   PC with no held Hash session (422), which covers a forged lock of a session the player does not
   hold; a password session is not ended on load, so the lock survives a reload. Tests cover forged
   lock (422, no session created) and wrong-password "unlock" (422, lock kept).
5. **No new leak — PASS.** The scenario answer adds only `sessionLockingSupported: true` (a capability
   boolean) and `locked: true` on sessions the player already holds. `login_session_answer`
   (`game.rb:2972`) carries no password; the client `preselect` is the player's own held session's
   username (`unlock-system.js` ~`:629`), already known to the browser.

### The question constraint 2 asked us to answer

**Can another permitted account sign in at a locked PC and so "unlock" it, and is the old desktop
exposed?** Yes, a second admitted account that knows/holds its own password can sign in at a locked
PC. `attempt_login!` admits any account passing `pc_admits_account?` with the correct password and
calls `start_login_session!`, which **replaces** the record with `{ id: <new npc>, via: 'password' }`
and no `locked` (`game.rb:2178`, `:2962-2963`). This matches real Windows "another user signs in" —
a *new* session, not a resume of the locked one. The previous (locked) holder's desktop is **not**
exposed: the served desktop follows the new session's `id`, and the locked record is discarded. This
is acceptable and is in fact stricter than Windows fast-user-switching (which keeps the first session
running). No defect; see n2 for the missing test.

## M findings

### M1 — The lock is a client-only gate; the server serves a locked session's desktop
`app/models/break_escape/game.rb:2408` (sole reader) and `app/controllers/break_escape/games_controller.rb:580` (`container`)

`session_locked?` is consulted in exactly one place — `session_for_client` (`game.rb:2408`), which
only decides whether the scenario answer carries `locked`. The desktop/shares route (`container`,
`desktop_request_allowed?`) never checks it. The lock is enforced solely by the two client open
functions (`unlock-system.js` `openLoginPc` ~`:267` and `interactLoginPc` ~`:485`, guarded by
`isLocked`).

**Failure scenario:** any route to a held session's desktop that does not pass through those two
functions ignores the lock — most concretely the **remote path** (`container` reached through a
foothold, which `isLocked` does not guard on the client), serving the locked desktop and its shares
with no password. Constraint 2 names "the remote sign-in path" as a bypass to check.

**Policy read:** per `cheat-resistance-policy.md` (q78) this is acceptable **for a password session**
— the player signed in with a password they hold, so bypassing the re-lock only saves time (honest
play reaches the same desktop). It is **not** acceptable where honest play could never re-enter: a
claim/guest session (M2), where no password exists to re-authenticate.

**Fix:** decide whether Lock is a real server boundary. If yes, gate the desktop route on
`session_locked?` (refuse `container` / remote desktop for a locked session, 403 "Sign in again")
so the password is the only way back in, matching constraint 2. If it is to stay a client
convenience, say so in the build log and scope it to password sessions (M2). The full route
enumeration belongs to the UI session's round-1 sweep; this finding flags only that no server check
exists to back any of those routes.

### M2 — `lock_session!` locks claim/guest sessions that the password unlock can never clear
`app/models/break_escape/game.rb:2439` (`lock_session!`), `public/break_escape/js/systems/pc-sessions.js:452` (`lockSession`)

Neither the server `lock_session!` nor the client `lockSession` restricts by session kind: both lock
any held session, including one obtained by `via: 'claim'` or a guest claim (no password was ever
entered).

**Failure scenario:** the player claims an owner's walked-away session (no password), then locks it.
The only intended way back in is `POST /login` with that account's password, which the player does
not have. The locked session is now a dead end: the player can return to it only by the M1 client/
remote bypass, or by logging out (which discards the held claim). Neither is "the same password
check" constraint 2 requires, and the dead-end case can strand a player mid-mission, which the cheat
policy explicitly forbids ("Never let hardening block a student from completing a challenge").

**Fix:** refuse to lock a session whose `via` is not `'password'` (return 422 "Only a signed-in
session can be locked"), or define the unlock fallback for a claim (e.g. the sign-in screen offers
"Switch user"/logout without ending the mission state). Whether the start-panel UI even offers Lock
on a claimed session is the UI agent's call, but the server should not accept a lock it cannot let
the player clear by the intended route.

## n findings

### n1 — `set_session_locked!(session, false)` is dead in this slice
`app/models/break_escape/game.rb:2425-2432`

The `false` branch (`session.delete('locked')`) is never reached: unlock happens by
`start_login_session!` rebuilding a record without `locked`. The build log states this is deliberate
symmetry for a future keyring grant. Intentional, not a bug — noted so a later reader does not read
it as the live unlock path. Keep, or add a comment that no caller passes `false` yet.

### n2 — No test for a second admitted account "unlocking" a locked PC
`test/controllers/break_escape/access_model_login_test.rb` (after line ~262)

The behaviour constraint 2 asked about (another permitted account signs in at a locked PC) has no
test. Add one: at a jake-locked PC, `login('dana', DANA_PASSWORD)` succeeds, the record becomes
`{ 'id' => 'dana', 'via' => 'password' }` with no `locked`, and the served desktop is dana's, not
jake's.

### n3 — No test for locking a claim/guest session (ties to M2)
`test/controllers/break_escape/access_model_login_test.rb`

The lock tests only exercise a password session. Add a test that claims a session then locks it, to
pin down whatever M2 resolves to (either a 422 refusal, or the documented logout fallback).
