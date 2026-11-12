# Network fixes build log (user decisions q45 and q46, 2026-11-12)

Branch `build/net-fixes`. Background: `docs/handover/2026-11-11_USER_DECISIONS.md` (q45, q46),
plan `ACCESS_MODEL_SLICE_9_3B_PLAN.md` section 5.2, and the reviews named below.

## q45: a host whose own service is off

Plan 5.2, "A host whose own service is off". Uses 9.2's `affordance.offWhen` (a global name, or
`{ name: value }`), read through `AccessWork.affordance` and `AccessWork.globals_hold?` on the
same globals the NPC frustration path reads (`frustration_globals`).

- `Game#host_service_off?(pc)` (`network_access.rb`).
- `host_row` gives such a host `responding: false` and no `remoteSignIn` or `session`.
- A remote sign-in (`attempt_login!` with a foothold) answers 403 `{ reason: "unreachable",
  message: "PC not responding" }` before the password is read, so no failure is counted.
- `desktop_request_allowed?` with a foothold refuses it (403 `unreachable` from the controller).
- `session_route_up?` refuses scoped requests under a remote session there. The session itself is
  kept, as one over a down route is, and works again when the service returns.
- A keyboard (walk-up) sign-in is not refused: plan 5.2 names remote requests only.
- Client: `hostAction` returns `not_responding` first; the row shows "not responding" with no
  control.
- Client: `networkLinks.view()` now awaits `stateSync.sync()` before `GET /network` (plan 5.2,
  "Keeping the server's view current"). Without it a switch flipped a moment before showed only
  after the next 30 second sync. This affects N5 to N7 as well.
- Scenario beat N14 in `test_access_networks`: `bench_pc` in the workshop, off at the start, with
  a `bench_power` switch; `n14_host_off` ticks on a remote sign-in after the view showed it off.
  Documented in the scenario's PLAYTEST.md.

## q46: network minors

- K R2 m1: `validate_network.rb` judges the "reachable only by pivoting" warning per path (a path
  is usable when every network before the target has a sign-in host). Two JS validator tests.
- K R2 m2: `network_pivot_test` gains a reload that ends an onward session whose only pivot was a
  claim, and an unplug that ends the pivot and the onward session.
- O R2 MIN-1: `network_outages_test` reloads during an outage (with a claim present, so the prune
  really runs) and the remote session survives, then reopens on repair.
- O R2 NIT-1: down-block host rows drop `remoteSignIn`, `session` and `responding`.
- O R2 NIT-2: `reach_walk` is memoised per game object on what it reads (the foothold record,
  the held session keys, every network's downIf value, the networks and links). A changed input
  misses the cache; a copy is returned. Test in `network_outages_test`.
- I R3 m1: `implant()` on an `already` answer for a foothold this browser did not hold fires
  `network_foothold_gained` and, when no foothold had been gained from that PC here before, opens
  the view. A repeat on a held foothold stays quiet.
- I R3 m2: a dropped-shape implant answered `not_ready` asks again three times, 1.5 seconds apart
  (`IMPLANT_NOT_READY_RETRIES`, `IMPLANT_NOT_READY_DELAY_MS`); the session shape does not. Plan
  5.5 documents the timing.

## Tests

- New `test/controllers/break_escape/network_host_service_off_test.rb` (4 tests).
- Added to `network_outages_test.rb`, `network_pivot_test.rb`, `test/js/network-links.test.mjs`,
  `test/js/network-view.test.mjs`, `test/js/validator-network-model.test.mjs`.
- Full suites under the shared lock: Rails 1804 runs, 0 failures, 0 errors, 1 skip; JS 507 of 507 files.

## Live proof (keyless server on :3037, game 1370)

Box planted in `bench_port`: the view showed WS-BENCH-01 "not responding" with no control
(screenshot `n14-not-responding.png` in the session scratchpad). A forced remote `POST /login`
with a wrong password while off answered 403 `unreachable`, `loginFailures` stayed 0. Switched on:
Sign in offered, signed in through the view with Sam's details, `n14_host_off` ticked. After a
reload, switching the PC off and opening the view at once showed "not responding" (the sync before
`GET /network`). Switched off with a held remote session: row "not responding", desktop fetch 403,
`sessions.bench_pc` kept. Leak check: no leaks.

## Review R1 fixes (NET_FIXES_CODE_REVIEW_R1.md)

Decision from the coordinator: a switched-off PC is off for everything that goes through it.

- M1: `player_reach` skips a session host whose service is off (not `structural_reach`, so
  nothing is pruned); the cache key carries each session host's off state. An onward session over
  it shows in a down block and reopens with the power.
- M2: `resource_admits_player?` serves no share through a session at an off host, nor through a
  remote session whose route is down (`session_route_up?`).
- m1: the sync before `GET /network` waits at most `VIEW_SYNC_WAIT_MS` (3 s), then the view opens
  with the server's last known state.
- m2: the keyboard sign-in at a switched-off PC is left working; it is the user's q72 and waits
  for the answer.
- Nits: a "soft gate" comment on `host_service_off?` (1); the cache key is the array itself (2);
  the cache test counts walks (3); the implanted branch emits only for a foothold not held (4);
  plan 5.5 says the not_ready waits do not survive a reload (5); an off row names a kept session
  as "still signed in as ..." (`heldAs`) (6).
- Live check (:3037, game 1444, `lena_pc` given an `offWhen` in that game's copy only): with
  Lena's and Ian's remote sessions held, switching Lena's PC off turned `server_net` to a down
  block, gave her row "not responding" with `heldAs`, and refused `ledger_archive` and
  `backup_vault` (404) and the `sv_fs02` desktop (403). Switched back on, all three were served
  again. Leak check: no leaks.
- New tests: four in `network_host_service_off_test.rb` (M1 twice, M2, the kept-session row), all
  failing without the fix; JS tests for the sync time limit, two answers in flight and the row.

## q72 and review R2 fixes (NET_FIXES_CODE_REVIEW_R2.md)

User decision q72: a switched-off PC is off at its own keyboard too, "This PC is off."

- Server: a keyboard sign-in (`attempt_login!` with no foothold), an owner or guest claim and
  `GET /login_accounts` at the keyboard answer 403 `{ reason: "off", message: "This PC is off." }`
  before the password is read (no failure counted). The keyboard desktop answers 403 `off`
  (`Game#desktop_refusal`), without settling a remote session there.
- `session_route_up?` is false for every session at an off PC, local ones included, so its
  folders, profiles reached through it, its mapped shares and an inventory add from any of them
  are refused. This settles R2 m1: a share's add path is refused as well as its read.
  `resource_admits_player?` now relies on `session_route_up?` alone.
- A session held there, local or remote, is kept and works again when the PC is back on. The
  client keeps its copy on a 403 `off` (`container-minigame.js`), shows "This PC is off." and
  opens no sign-in screen.
- Client: `interactLoginPc` checks `affordance.offWhen` on the client's globals first
  (`pcSwitchedOff`) and says "This PC is off." with no request; a PC that has an `offWhen` but is
  on sends the globals first (at most 3 s), so a switch flipped back on is known to the server.
  `openLoginSignIn` and the password screen word a server `off` answer the same way.
  `ApiClient.get` now carries the refusal body (`err.body`), as `post` does.
- How the PC looks when off: `bench_pc` in `test_access_networks` has no `sprite` or
  `spriteVariants`, so it shows its map texture (`pc6`, a lit blue monitor) on and off. There is
  an existing `aw_pc_off1.png` object in the assets, unused by this scenario. No art was made; the
  author guide says to add a `spriteVariants` entry on the same global for an off look.
- R2 m2: an up block's `via` skips off session hosts; a down block still names the off host.
- R2 m3: `networkLinks.view()` returns `stale: true` and the sync promise when the 3 s limit won.
  The view shows "Still updating, so this may be out of date." and, when that sync lands while
  the same view is open, fetches once more with `{ sync: false }` (the globals are there, so a
  slow link does not make the refetch stale too).
- Nit 1: a remote refusal at an off host is now 403 `not_responding` (sign-in and desktop); the
  password screen says "This PC is not responding." and the desktop landing
  "<host> is not responding.", matching the row.
- Nit 2: `reach_cache_key` builds the merged globals once for all session hosts
  (`host_service_off?(pc, globals)`).
- Nit 3: a test reloads and signs out of an unrelated session while a pivot host is off; both
  sessions are kept.
- Nit 4: `view_session_hosts`'s comment now says `seq` follows the jsonb key order. The tie-break
  change itself stays in the backlog.

Tests (no lock, per the test lock rule):

- `network_host_service_off_test.rb`: 12 runs (4 new: keyboard refusals and claim, keyboard
  session with desktop, file, share read and share add refused then restored, via skips an off
  host, prune while off). Run against the previous server code, 5 fail (the 4 changed or new q72,
  m2 and wording tests); the prune test is coverage only.
- Rails: every `network_*_test.rb`, `game_test.rb`, `network_withholding_test.rb` and each test
  file naming the touched login or session methods: 442 runs, 0 failures, 0 errors, 0 skips.
- JS: new tests in `access-signin-routing` (3), `access-remote-signin` (2), `pc-sessions` (1),
  `password-signin-mode` (1), `network-links` (2), `network-view` (2). Against the previous client
  code 10 of them fail; "a stale view closed before the sync lands" is coverage only. All 60 JS
  test files importing a changed module: 694 tests, 0 failures.

Live check (keyless server on :3037, game 1501, `test_access_networks`):

- q72 at the keyboard: `bench_pc` off at the start; a click showed "This PC is off." and opened
  nothing. Switched on, the click opened the sign-in screen; signed in as Sam at the keyboard and
  the desktop opened. Switched off with that session held: the click showed "This PC is off.",
  the client kept the session, and forced `GET /container/bench_pc`, `GET /login_accounts` and a
  wrong-password `POST /login` all answered 403 `off` with no failure counted. Switched back on,
  the click opened the desktop again; the server still held `bench_pc = sam (password)`.
- m3: the box planted at `bench_port`, every sync delayed 6 s, the PC switched off and the link
  item opened at once: the view showed "Still updating, so this may be out of date." with the old
  "Open (Sam Okafor)" row (screenshot `m3-stale.png` in the session scratchpad `net-fixes/`).
  When the late sync landed the view refetched once, with no further sync: the row read "not
  responding (still signed in as Sam Okafor)" and the line was gone.
- Leak check over the captured responses: no leaks.

## R3 fixes (NET_FIXES_CODE_REVIEW_R3.md)

- M1, an implant on a switched-off PC: `implant_source_off?` is true for an `implant_<pc>` foothold
  whose source PC's `offWhen` holds. `reach_walk_uncached` then returns no networks (the outage walk
  only), and `reach_cache_key` carries the source's power. So the foothold serves no network block,
  no remote sign-in (403 "PC not reachable", no failure counted), no session's desktop or folders
  and no open share or add from one. `structural_reach` ignores it, so nothing is pruned: a session
  through the implant is kept, and the same implant works again when the PC is back on. Display
  (orchestrator decision): `GET /network` still lists the foothold, with `responding: false`,
  `sourceHost` and no rows; any session held through it shows only in a greyed block. The view
  says "This link is not responding: <host> is off." with nothing to click.
- Capture and leak routes through an implant: `GET /capture_secrets` and the bootstrap name no
  share text or password with the implant's PC off (test). A capture proof of the `planted` kind
  reads `gainedFootholds`, a record that the device was once planted, so it is unaffected by
  power by design. `network_no_exposure_test.rb` passes.
- m1, a PIN pad under an off PC: `Game#unlock_session_refusal` gives a reason when an unlock is
  refused for its scope under a session the player holds: `off` (keyboard session at an off PC),
  `not_responding` (remote session there) or `unreachable` (its route is down). `POST /unlock`
  answers that as 403 with the message. An object under no held session, a share path and a wrong
  code still answer 422 "Invalid attempt", as an invented id does. The PIN pad treats a 403 with
  one of these reasons as no attempt: it says "This PC is off." (or the matching line), closes as
  cancelled, and records nothing in its history.
- Nit 1: plan 5.2 now says a remote refusal at an off host is 403 `not_responding`, that a local
  session gains a refusal only while its PC is off, and describes the implant rule and the unlock
  reason.
- Nit 2: a desktop, or a share or folder opened from one, closes when its PC's `offWhen` global
  changes to off: "This PC is off." at the keyboard, back to the network view as not responding
  for a remote desktop. A share that fails to load while the PC is off says "This PC is off."
  rather than open empty with "Could not load container contents". A share closed this way does
  not reopen its desktop.
- Nit 3: `GET /login_accounts` refuses an off PC whatever `foothold` value the request carries.
- Nit 4: `pcSessions.claim` passes `serverReason` as `signIn` does; `interactLoginPc` shows
  "This PC is off." once for a claim refused as `off` and opens no sign-in screen.
- `bench_pc` in `test_access_networks` now has `spriteVariants` to `aw_pc_off1` while off, and a
  PIN folder `bench_logs` (3141) on its desktop for the m1 check. Live, the swap back to on showed
  the type's `pc` texture rather than the map's `pc6`: `registerSpriteVariantListeners` fell back
  to `scenarioObj.sprite || type`. A Tiled-matched sprite now records `variantBaseKey` and the
  listener returns to it. The off picture sits on the desk's back edge (its bottom on the desk top
  line, the map picture's monitor top at the same height), so no position change was needed.
  PLAYTEST.md N14 describes the picture and a "left open" beat.

Tests (no lock, per the test lock rule):

- New Rails tests: `network_implants_test.rb` 5 (view, remote sign-in, remote session, open share
  and add, capture and bootstrap), `network_host_service_off_test.rb` 3 (keyboard PIN 403 off,
  remote PIN 403 not_responding, no session still 422) and a `login_accounts` foothold case.
  Against the previous server code, 4 of the 5 implant tests and the 2 PIN reason tests fail; the
  capture and bootstrap test and the "still 422" test are coverage.
- Rails: every `network_*` controller and model test, `access_model_*`, `npc_workaround*`,
  `npc_habits_postit_test.rb`, `game_test.rb`, `access_leak_scanner_test.rb` (446 runs, 5410
  assertions), then every other controller and integration test that names unlock (32 files, 689
  runs): 0 failures, 0 errors, 0 skips.
- JS: new tests in `network-view` (1), `pin-cracker-feedback` (2), `container-shares` (3),
  `access-signin-routing` (1), `pc-sessions` (1), `table-group-variant-listeners` (1). All 62 JS
  test files importing a changed module: 826 tests, 0 failures.

Live check (keyless server on :3063, headless, `setFPS(20)` with fixed steps on, games 1557 and
1575, `test_access_networks`; session logs `session-1557.jsonl` and `session-1575.jsonl` and
screenshots in the session scratchpad `net-r3fix/`):

- `bench_pc` off at the start shows `aw_pc_off1`; the switch turns it to `pc6`, off again to
  `aw_pc_off1` (`bench-off-on.png`). Game 1557 showed the `pc` fallback, fixed before game 1575.
- m1: signed in at the keyboard as Sam, opened `bench_logs`' PIN pad, switched the PC off and
  synced, entered the right PIN: the pad said "This PC is off." and closed, attemptCount 0, no
  attempt recorded, no "PIN Rejected"; server: `bench_logs` not unlocked, session kept.
- Nit 2: with the desktop open, switching off closed it with one "This PC is off." toast and the
  session kept; the same with the Bench-Notes share open, which closed and did not reopen the
  desktop.
- M1 has no live check: no scenario puts an implant on a PC with an `offWhen` (the test scenario's
  BadUSB targets `sam_pc`, which has none). The Rails tests drive the real routes.
- One `loginFailures` entry on game 1575 (`bench_pc|`, an empty username) came from a harness call
  of mine that read no sticky note, not from the off period.

## R4 fixes (NET_FIXES_CODE_REVIEW_R4.md)

Main merged in first (the 9.2 H fixes, feed-lockout and graph-net): two conflicts, both kept from
both sides. `docs/IDEAS_BACKLOG.md` keeps this branch's 9.3b K line (m1 and m2 done here) and
drops a duplicate TTS line; `test/js/pc-sessions.test.mjs` keeps this branch's two 403 reason
tests and main's q44 sign-out test.

- m1: `unlock_session_refusal` now gives a reason only when every container on the object's path
  is unlocked (`path_unlocked?` on `login_scope_of`'s path). An object behind a still-locked
  folder answers the same 422 "Invalid attempt" as an invented id, so a guessed id cannot be
  confirmed. Once the outer folder is open, the inner one gets its `off` reason again.
- m2: the reason texts and a `lockScopeRefusal(error)` check live in
  `js/utils/lock-scope-refusal.js` (the PIN pad's `PIN_SCOPE_REFUSAL_TEXT` now points at them).
  The password, combination and cryptex screens treat a 403 `off`, `not_responding` or
  `unreachable` as no try: they show the matching line ("This PC is off."), close as cancelled
  (`cancelled: true, refused: <reason>`) and never say the answer was wrong. The password screen
  emits no `password_failed`, and `startPasswordMinigame` shows no "Password Rejected" toast for a
  refused result. The flag station's lock mode says the line too and tells the mission no
  `flag_rejected`. Checked and left: `notifyServerUnlock` (key and lockpick) and the RFID access
  list read no reason, but neither kind of lock sits in a PC folder; the NPC and action unlocks
  have no screen.
- Nit 2: `registerSpriteVariantListeners` swaps the proximity ghost's texture with the sprite's,
  on the late-load path too.
- Nit 3: the lighting skill (line 107) and the two m08 comments now say an object with
  `spriteVariants` and no `sprite` returns to the map item's picture when matched to one, and to
  its type otherwise (the reviewer's wording).
- Nit 1 (an implant-off remote sign-in answers the generic 403) is left as the review accepts.

Found, not fixed: `validate_unlock` has no `combination` or `cryptex` branch, so on the server
those locks never open, even with the right answer (422). No shipped scenario uses either lock.
It predates this branch and is out of this round's scope.

Tests (no lock, per the test lock rule):

- Rails: a new `network_host_service_off_test.rb` case (inner folder behind a locked one, PC off:
  pin and password answers equal the invented id's 422; open the outer one and the inner gets 403
  `off`). It fails against the old code ("inner id and invented id answer the same").
  `network_host_service_off_test.rb`, `network_implants_test.rb`, `network_no_exposure_test.rb`,
  `network_outages_test.rb`: 60 runs, 0 failures, 0 errors.
- JS: new `lock-scope-refusal.test.mjs` (12 tests: the helper, password for each reason and a
  422 control, combination and cryptex off, other reasons and a 422 control, the password
  starter's toast). 8 of them fail against the old screens. A flag-station case in
  `flag-station-resubmit.test.mjs` and a ghost case in `table-group-variant-listeners.test.mjs`.
  The PIN harnesses now use the root/minigames layout so the new utils import resolves, and the
  new file is on every harness copy list that loads one of the changed screens. Every JS test file
  that loads a changed module (33 for the lock screens and starters, 18 more through
  `unlock-system.js`, 33 through `rooms.js`): 0 failures.

Live check (keyless server on :3052, headless, `setFPS(20)` with fixed steps on, game 1620,
`test_access_networks`, with a password folder `bench_pw` and a combination folder `bench_combo`
added to `bench_pc` in that game's copy only; session log `session-1620.jsonl` and screenshots in
the session scratchpad `net-r4fix/`):

- Ghost, standing next to `bench_pc` and flipping `bench_pc_off` with a sync: off `aw_pc_off1`
  (34x22), on `pc6` (32x30), off, on. The ghost's key and size matched the sprite's every time.
- Password: signed in at the keyboard as Sam, opened "Bench passwords", switched the PC off and
  synced, entered the right password. The server answered 403 `off`; the screen said "This PC is
  off.", attempts stayed 0, it closed as cancelled, no toast. With the PC back on the same
  password opened the folder.
- Combination: the same with "Bench combo" and the right dials: 403 `off`, "This PC is off.",
  attemptCount 0, closed as cancelled, no toast. With the PC on, the right combination answers
  422 (the missing server branch above).

## Open

- Plan 5.2's five-second refetch of an open view, and a sync before a remote sign-in or a desktop
  or share fetch, are not built (the view's sync covers the usual path). In the backlog.
- The dungeon graph does not draw links, outages, Wi-Fi or implants (build/graph-net is on it).
