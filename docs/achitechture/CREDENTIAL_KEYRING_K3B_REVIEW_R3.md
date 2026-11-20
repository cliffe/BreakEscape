# Credential keyring K3b: code review, round 3 (delta)

Diff: `git diff 0782e1206..05bdee04d` on `build/keyring-k3b`. Inputs: round 2 (`CREDENTIAL_KEYRING_K3B_REVIEW_R2.md`) and the "K3b run 5" section of the build log.

## Verdict: SHIP (B0 M0 m0 t2)

Every R2 fix does what R2 asked, and I found nothing that breaks. The two remaining items are tidy-ups on paths that are rare or cannot be hit with today's server.

Runs on `05bdee04d`: `keyring-client.test.mjs`, `keyring-signin.test.mjs` and `inventory-menu.test.mjs` together 142/142. I did not wait for a full `bin/test-js` run (the delta touches two engine JS files and tests only; the build log has it green). No server was started, so the live beats were not checked here.

## Resolution of R2

**m1a. Resolved.** `keyring.js:289` to `:293`: `this._queued = null` is now the first statement of the ask callback, before `await syncConfirmed()`. Same-tick triggers still join, because the callback only runs on a later microtask, after `_queued = ask` has been assigned. A trigger that lands during the sync PUT finds `_queued` null and builds a new ask chained behind `_running` (the first ask), whose own `syncConfirmed` carries its change. The new test pins the failure: a second `refresh()` while the first sync is pending returns a different promise, a second `syncConfirmed` is called, and two GETs go out. No trigger can be lost: either it joins an ask that has not started (and that ask's flush happens after the trigger), or it builds the next one.

**m1b. Resolved.** `noteDropped` (`keyring.js:172` to `:175`) runs on both stale branches (`:187`, `:191`) and only for `primed`, only while `firstAnswerIds === null`, and only for an answer that carries `entries` (a prime sends no rev, so it is never an `unchanged` answer). It reads ids only, and does not touch `latest`, the cache or `noteFinds`, so the newer data stays as it was. The test replays the out-of-order case and checks the set, `latest` and `foundVisible`.

**t1. Resolved.** The cap is passed only from `refresh()` (`keyring.js:296`, `timeoutMs: this.askTimeoutMs`); Connect's GET and the prime pass nothing, so `timeoutMs` is 0 and `ask` is a plain `api.keyring` call for them. On timeout the timer's callback aborts the controller and rejects; the race settles first with the timeout error, `refresh()`'s catch returns null, and no toast or error line is produced (nothing in the catch path calls `toast`). The abort's later `AbortError` rejection on the request promise is already handled by `Promise.race`, so there is no unhandled rejection. `.finally(() => clearTimeout(timer))` clears the timer on every outcome (answer, throw, timeout), so no timer outlives an ask. A timed-out ask has used a sequence number but never set `_appliedSeq`, so later asks are not treated as stale. `ApiClient.get` and `ApiClient.keyring` take `{ signal }` with a default, so every existing caller is unchanged, and `signal` is spread only when present. The test checks the hung ask resolves null, `signal.aborted`, a joined trigger resolves, a later ask is answered and exactly one find toast appears.

**t2. Resolved.** The server strings, from the controller and models: the credential login branch returns the body of `attempt_credential_login!` (`credential_login.rb:187`, `{ success: false, message: 'PC not reachable' }`); the non-credential reachability refusal is `render_error("PC not reachable: <id>")` (`games_controller.rb:1543`, body `{ error: ... }` with no `message`); the Pundit refusal is `{ error: 'Not authorized' }` (`application_controller.rb:120`). `pc-sessions.js:396` builds `message` as `b.message || b.error || ...`, so both "not reachable" shapes arrive as a string that matches `/not reachable/i`, and "Not authorized" does not, so it goes to `CONNECT_FAILED_TEXT`. Every reason-carrying body is handled before the regex (`reason: 'unreachable'` and `not_responding` / `off`). The regex runs on `String(result.message || '')`, so a missing message is safe. Test rows cover the real message and the Pundit body.

**t3. Resolved.** `keyring-signin.test.mjs:461` asserts `alerts[0][4].whole === true` on K3a's teaching toast.

## Fixture relabel

Consistent. The credential label (`scenario.json.erb:54`) and the item name (`:274`) both read "SV-OPS-01 admin.rdp", and `ops_cookie` keeps "SV-OPS-01.rdp" (`:61`). A search of `public`, `app`, `lib`, `test` and `scenarios` for the old label finds only `ops_cookie` and two Ruby tests that set their own label inline (`credential_keyring_test.rb:81`, `credential_item_field_test.rb:17`); neither reads the fixture file, so neither is affected. The id, the `proof.held` id and `credential` links are unchanged. The old label also survives in older plan and review documents, which are history.

## Generated dungeon graph files

They belong in the commit. The three `dungeon_graph.*` diffs are label-only (6 + 2 + 6 changed lines, each the one renamed node), the earlier K3b commits already track these files, and leaving them stale would make the next validator run produce a dirty tree.

## Security and regressions

- No unescaped text: the new code adds no DOM writes. The find and sign-in lines still go through `gameAlert` with `plainText`, and the label is the scenario's own string.
- Nothing new is synced: the only new network traffic is the same GET /keyring, now with an optional abort signal. `refresh()` calls the existing `syncConfirmed`, adding no payload.
- The client still never decides access: the timeout and the reason mapping only choose which sentence to show; Connect still posts and the server decides.
- No new global state. `askTimeoutMs` is an instance field, set from a constant, overridden only by the test.

## Findings

**t1. The cap covers the GET, not the sync PUT before it.** `keyring.js:293`, `:296`.
`await window.stateSync?.syncConfirmed?.()` sits ahead of the capped fetch with no limit. A PUT /sync_state that never settles would hold the chain just as a hung GET used to. It is the same class as R2 t1, so a rare network fault, and the player's next page load clears it. Fix if wanted: race `syncConfirmed()` against the same timer, or give the cap to the whole callback.

**t2. Two GETs in one ask can wait twice the cap.** `keyring.js:187`, `:190`.
`ask` starts a fresh timer for the second request (the no-rev retry after a lost rev), so one chained ask can wait up to 30 s before it gives up. Harmless, and the second request is rare. Fix if wanted: take one deadline for the whole `fetch`.
