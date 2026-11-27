# Network fixes code review, round 3 (build/net-fixes)

Scope: commits 50ab4378d and 798607209 (user decision q72 and the round 2 fixes), read against
`NET_FIXES_CODE_REVIEW_R2.md`, the build log's "q72 and review R2 fixes" section and plan 9.3b
section 5.2. q72: a switched-off PC refuses everything at its own keyboard (sign-in, owner and
guest claims, `GET /login_accounts`, the desktop) with 403 `off`, "This PC is off.", counts no
failure, and keeps any session held there for when it is back on.

Counts: 0 blockers, 1 major, 1 minor, 5 nits.

Evidence: a throwaway integration test against the `NetworkModelScenario` fixture (deleted, not
committed), quoted under M1 and n3, and a live run on a keyless server on :3061, game 1528
(`test_access_networks`), quoted under "Live check".

## Round 2 fixes

| R2 item | State |
|---|---|
| m1, an off PC's mapped share lists but will not open, yet its files can be added | Fixed by q72. `session_route_up?` is false for every session at an off PC, so `session_admits?`, `scope_admitted_by_session?` and `resource_admits_player?` all refuse, and the read and the add agree. Live: share 404, add 422 "Not available to this session", desktop 403 `off`. |
| m2, an up block's `via` can name an off host | Fixed. `network_blocks` passes `via_for` only live session hosts; `down_blocks` still gets every host, so a down block keeps naming the off one. Test "the via of an up block skips an off session host" pins it. |
| m3, a view opened after the 3 s limit is not marked and never catches up | Fixed. `view()` returns `stale: true` with the `synced` promise; the view shows the line and refetches once with `{ sync: false }` when the sync lands and the view is still open. Both behaviours are tested. |
| Nit 1, "not responding" wording | Done: 403 `not_responding` for a remote sign-in and a remote desktop at an off host, worded "This PC is not responding." and "<host> is not responding." on the client. |
| Nit 2, cache key cost | Done: the merged globals are built once per key. |
| Nit 3, no prune-while-off test | Done. |
| Nit 4, `seq` comment | Done; the tie-break itself stays in the backlog. |

## What holds up

- **Keyboard refusals come before anything is counted.** `attempt_login!` returns `pc_off_answer`
  before the lockout check and before `record_login_failure!`; both claims return it before the
  "session already held" check; `GET /login_accounts` refuses before the tiles and the note.
  Live: three wrong passwords at the off keyboard and an owner claim all answered 403 `off`, and
  the server's `loginFailures` held only the one entry made earlier while the PC was on.
- **The power state is told only where the PC is reached.** `desktop_refusal` says `off` only when
  the PC is physically reachable and not headless, and `not_responding` only when the foothold
  reaches the host and its policy allows remote sign-in. `attempt_login!` checks reach before
  power on both branches. Nothing new names a host the player has not reached, and
  `network_no_exposure_test.rb` passes.
- **Sessions survive.** No prune reads `session_route_up?`; `prune_unreachable_sessions!` still reads
  `structural_reach` only. Live: the keyboard session at `bench_pc` was kept on the server and
  the client throughout the off period.
- **The `unreachable` to `not_responding` change missed nothing.** It is a new reason for the off
  case, not a rename: `unreachable` stays for a host the foothold cannot reach. A grep over
  `app`, `lib`, `public/break_escape/js`, `scenarios` (ink and JSON included), `tools/playtest` and
  `test` finds every consumer of the off case updated: `container-minigame.js` keeps the session
  on both reasons, `network-links.js` has a landing for each, and the password screen maps both.
  The `unreachable` strings left in `npc-work.js`, `access_work.rb` and `npc_frustration.rb` are
  office-life failure causes, a separate vocabulary. No scenario or ink file names either reason.
- **Server text reaches the player as text only.** `ApiClient.get` now sets `err.body`; the only
  readers are `openLoginSignIn`, which compares `reason` and shows its own constant, and the
  existing `capture-rows.js` and `unlock-system.js` callers, which do not display it.
  `pcSessions.signIn`'s `serverReason` is only compared in `signInErrorMessage`, which returns
  constants, and the password screen writes with `textContent`. The one place server text is
  shown is the container-minigame's `off` toast (`refusal.error`), through `gameAlert`, which is
  plain text by default. Live: a forced 403 `off` whose `error` was an `<img onerror>` and a
  `<b>` element showed as literal characters, with no element created and no script run.
- **Client and server agree on `offWhen`.** `pcSwitchedOff` reads the string form as truthy and the
  hash form as all-equal, the same as `AccessWork.globals_hold?`. When they disagree (client
  thinks on, server off), the server's 403 `off` on `GET /login_accounts` still stops the screen:
  live, with the sync stalled, the click waited 3 s, asked the server, and showed "This PC is
  off." with no sign-in screen.

## Major

### M1. An implant on a switched-off PC still gives a working foothold

An implant foothold (`implant_<pc>`, `via: "implant"`, `source: <pc>`) starts its reach walk at the
source PC's network, and nothing in `reach_walk_uncached`, `player_reach` or `network_blocks`
looks at the source PC's power. The R1 decision was that a switched-off PC is off for everything
that goes through it, and an implant is software running on that PC.

Probe (fixture, BadUSB session-shape implant at `lena_pc`, then `lena_pc`'s `offWhen` set true):

- `GET /network?foothold=implant_lena_pc`: 200, the full `office_lan` block, with `lena_pc` itself
  listed as `responding: false` in the view the implant on it is serving;
- `POST /login` to `sam_pc` through `implant_lena_pc` with the right password: 200, a remote
  session;
- `GET /container/scanned_inbox` through the implant: 200 with the file text.

So a student can switch a PC off and keep using the implant on it, and the view contradicts itself.
No shipped scenario combines an implant with an `offWhen` PC today (the test scenario's N12
implant is on `sam_pc`, which has none), which keeps this from being a blocker, but it is the
open route the q72 question asked about and plain play reaches it.

Fix: treat an implant foothold whose source PC is off as down. In `reach_walk_uncached`, when the
foothold is `via: "implant"` and `!ignore_outages` and `host_service_off?` holds for its source,
return the empty set (the outage walk only, so `structural_reach` and pruning are untouched); add
the source's power to `reach_cache_key` (the `hosts_off` list covers sessions only). The view for
that foothold then needs a state: either answer the existing "no route" shape, or a short
"<host> is off." line, which the user may want to choose. Tests: the three probe requests
above, refused while off and working again when the PC is back on.

## Minor

### m1. A PIN pad under an off PC counts the refusal as a wrong attempt

The server never counts a failure at an off PC, but the client can. A desktop already open when
the PC goes off stays open (n2). A PIN-locked folder in it, or in a share mapped there, goes to
`POST /unlock`; `unlock_scope_refused?` is now true, so `validate_unlock` answers 422 "Invalid
attempt", exactly as for a wrong PIN. `pin-minigame.js` treats any answer with a status as a real
attempt: the right PIN reads as wrong, `attemptCount` rises, and at `maxAttempts` the pad shows
"LOCKED" and reports `maxAttemptsReached`, which scenarios can hook. The lockout is per opening of
the pad, so a student is not locked out for good, but they are told a correct PIN is wrong.
Found by reading the code; not reproduced live (no PIN folder sits under `bench_pc`). The same
path existed for a remote session over a down route before q72; q72 extends it to the keyboard.

Fix: give a scope refusal its own answer where existence is already known (a folder under a
sign-in PC or a profile, not a share path, which must still answer as an invented id), for
example 403 with `reason` `off` or `unreachable`, and have the lock minigames refund an attempt
whose answer carries such a reason. One Rails test for the answer, one JS test for the refund.

## Nits

1. **Plan 5.2 still says `unreachable` and "never gains a refusal".** Line 368 says a remote sign-in
   and desktop at an off host "answer 403 `unreachable`", and the scoped-request paragraph says "a
   local session at a walk-up PC never gains a refusal". The q72 paragraph a few lines below
   contradicts both. Two wording fixes.
2. **A desktop open when the PC goes off stays open, and its share opens empty.** Live: with the
   keyboard desktop open, switching `bench_pc` off (global set and synced) and clicking the
   Bench-Notes share opened a second container titled with the share, with a broken icon and
   "Desktop empty", and a red "Could not load container contents" toast. Nothing leaks. A listener
   on the `offWhen` global that closes that PC's open desktop with "This PC is off." (or the plan's
   five-second refetch, already in the backlog) would cover it and m1.
3. **`GET /login_accounts` skips the off check for any `foothold` value.** The check is
   `params[:foothold].blank?`, and the foothold is not validated on this route, so a forced request
   with `foothold=anything` at a reachable off PC gets the tiles (no note). Probe: 200 with all
   three tiles. It reveals only what the screen shows when the PC is on, and a forced remote
   sign-in there still answers 403 with no count, so this is consistency only: refuse when the PC
   is off and the foothold does not reach it, or check power for every request.
4. **A guest claim refused as `off` toasts twice.** When client and server disagree, `claim` maps a
   403 to `reason: 'error'` with the server's message; `interactLoginPc` shows that message for a
   guest claim, then `openLoginSignIn` gets 403 `off` and shows "This PC is off." again. Pass
   `serverReason` from `claim` as `signIn` now does and return early on `off`. Also, a click on any
   PC with an `offWhen` waits up to 3 s on the sync with no feedback; fine on a normal link, worth
   a "Checking..." line if it shows in playtests.
5. **`bench_pc` looks the same on and off; `aw_pc_off1` is a fair stand-in, with a caveat.** The
   texture is already preloaded (`core/game.js`), so `"spriteVariants": [{ "condition":
   "globalVars.bench_pc_off", "value": "aw_pc_off1" }]` on `bench_pc` would work with no new art,
   and would exercise the README's own advice in the test scenario that documents it. I recommend
   wiring it. The caveat: `aw_pc_off1` is 34x22, a tower and dark monitor from the awareness set,
   and the map's `pc6` is 32x30, a lit monitor with a keyboard, so the PC changes shape as well as
   state, and the swap keeps the base sprite's placement, so the off picture may sit 8 px off the
   desk line. Check it in one live screenshot after wiring; if it reads badly, leave the PC as it is
   and say so in PLAYTEST.md (which already notes that it has no off picture). No image
   generation is needed either way.

## Live check (keyless server on :3061, game 1528, `test_access_networks`)

Game ids created: 1528 only. Session log:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/net-r3/session-1528.jsonl`.

- Client says on, server says off, sync stalled: a click on `bench_pc` waited the 3 s limit, sent
  `GET /login_accounts`, got 403 `off`, showed "This PC is off." and opened nothing.
- Switched on and synced, signed in at the keyboard as Sam, desktop open (the Bench-Notes share
  listed, 200 on the share). Switched off and synced: share 404, an add of `bench_note` from the
  desktop 422, the desktop 403 `off`, three wrong passwords and an owner claim 403 `off`. Server
  state afterwards: `sessions.bench_pc` kept, no lockout, and no failure from the off period.
- The open desktop after the switch: n2 above (screenshot `open-desktop-share-after-off.png` in
  the same scratchpad folder).
- A forced 403 `off` with HTML in `error`: shown as literal text, session kept, no minigame.

## Tests run (no lock, per the test lock rule)

- Rails: `network_host_service_off_test.rb`, `network_implants_test.rb`,
  `network_no_exposure_test.rb`: 39 runs, 1808 assertions, 0 failures, 0 errors, 0 skips.
- JS: the six changed test files (`access-signin-routing` 22, `access-remote-signin` 15,
  `pc-sessions` 32, `password-signin-mode` 17, `network-links` 65, `network-view` 21), and all 60
  files importing a changed module: 694 passed, 0 failed.
- No test covers M1, m1 or nits 2 to 4.
