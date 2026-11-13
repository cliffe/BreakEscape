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

## Handover

- Done: server lock (`locked` on the session record), `POST /lock_session`, capability flag,
  client `lockSession`/`isLocked`/`lockingSupported`, pre-chosen sign-in on a locked open,
  Rails + node tests.
- Open: live browser proof on :3465.
- Gotchas: a new member action needs `set_game` AND `with_game_lock` AND a `GamePolicy`
  predicate, or it 500s. `locked` is added to the sessions answer only when true, so the
  existing exact-equality scenario tests still pass.
