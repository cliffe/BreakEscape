# K3c handover (run 1: part A done, part B open)

**Run 1 (part A) done, commit 888f48af3:** items 0 (D49 tidy), 2 (D50, shared `chosenAccountLine`), 4 (R3 t1), 5 (R3 t2), 6 (reconnect toast, `_announced` map in `keyring.js`) and 7 (`route_ended` test in `pc-sessions.test.mjs`) are built and tested; build log has a "K3c run 1 (part A)" entry. `bin/test-js` 716/716. Line numbers below in `keyring.js` and `password-minigame.js` have moved by a few lines.

**Part B still open:** item 1 (relay plus 9.1 fixtures) and item 3 (K2 m4 folder route). Notes for both are unchanged below.

---
(Run 0 notes follow.)

Worktree `.claude/worktrees/p-k3c`, branch `build/keyring-k3c`, tip `8d311a99a` (D49 plug badge). Tree clean. No commits made this run. The context guard stopped the run before any edit.

## Still to do (all seven brief items open)

0. D49 tidy: `utils/remote-host-text.js:55` comment (check whether it calls the plug art pending); grep `test/js` for `badge-key.png` expected for plug.
1. Relay (plan 8.3) plus 9.1 fixtures in `scenarios/test_access_keyring/scenario.json.erb` (check what K1/K2 already authored for Jake: `jake_assist`, `jake_assist_code`, `jake_pc`, timer, ink).
2. D50: chosen-account line names the kinds of knowledge, on `password-minigame.js` (around :1990) and the other screen that shows the chosen account; same wording on both.
3. K2 m4 (folder route): see "m4" below.
4. R3 t1: the 15 s cap must cover `syncConfirmed` in `refresh()` (`keyring.js:292`).
5. R3 t2: one deadline per `fetch` (`keyring.js:176-194`; `ask` makes a new timer for the no-rev retry).
6. Reconnect toast: see "item 6" below.
7. `route_ended` unit test, plus a build log note that the live proof must exercise it.
Then: build log "K3c run 1" entry, `bin/test-js`, Rails tests, commits with explicit paths.

## What the code says (read this run)

**Server is done for the relay (K2).** `credential_login.rb:70-76` (relay sign-in, answer `route: {relay:true}`); `game.rb:4133` `start_login_session!` (relay skips `signedInPcs`); `game.rb:4158` `login_session_answer` (relay adds `relay: true`, `host`; no `remote`); `game.rb:3539` `sessions_for_client` leaves relay out on bootstrap; `network_access.rb:1308` `desktop_request_allowed?` (relay=1 branch; no-route at a relay session is refused); `games_controller.rb:2995` `desktop_route_params` (relay=1, :conflict); sync answer carries `endedRelayPcIds` (`games_controller.rb:894`, `:931`, `:938`); keyring rows for `assist_invite` have `routes: [{relay:true}]`, `ended`, `heldItem` (`credential_keyring.rb:160-205`).

**Client gaps for the relay:**
- `systems/keyring.js`: `CONNECT_KINDS` (:54) and `FIND_KINDS` (:519) need `assist_invite`; `connectRoute` (:64) add `{ relay: true }` after footholds; `_connect` step 5 (:423) must open the relay desktop for a relay session; step 8 (:434-437) `signInWithCredential(pcId, id, route)` then open by route; invite refusals at :471 (`kind_refused` gives "{host} does not allow remote assistance.", `ended` gives the ended line; `t.credentialRefusalLine` may already map them: check `remote-host-text.js:115`); prompt end: while a relay session is held, `global_variable_changed` calls `stateSync.sync()`; listener removed when the relay ends.
- `api-client.js:250` `loginWithCredential` sends only `foothold`; add `relay: true` (never `relay: false`). `keyring()` (:238) may need `relay` too for a relay screen (probably not: no relay sign-in screen).
- `systems/pc-sessions.js`: `signInWithCredential` (:373) takes only `{ foothold }`; take `{ foothold, relay }`. `_replace` (:539) adds to `signedIn` and computes `firstAtPc`; a relay must not touch `signedIn`. `publicSession` (:134) and `load` (:223): store/emit `relay: true`, `kind`; `load()` must keep no relay session (server never sends one, but guard it) and arm no trigger. `_remoteOf` (:667) is spread into `pc_signed_in`/`pc_desktop_opened`: add `relay: true, kind` for a relay. Add `heldAtKeyboard(pcId)` (session held and not relay). Handle the sync answer's `endedRelayPcIds` with `linkDropped(ids, 'relay_ended')`: the desktop closes with `endedAssistMessage(displayName)`. `linkDropped` (:629) only knows `unplugged` and `route_ended`.
- Where the sync answer is seen: `state-sync.js` `_applyAnswer` (:1019) calls every part's `onAnswer(answer)`; registering a part or a hook there is the cheapest place to read `endedRelayPcIds` (note the harness copy list rule if a static import is added).
- `systems/unlock-system.js`: `openLoginPc` (:266) and `interactLoginPc` (:530 `sessions?.has?.(pcId)`) must use `heldAtKeyboard`; the keyboard screen's `current`/`onComplete` reads (plan cites :618/:624, now inside `openLoginSignIn` :609+). `openRemoteDesktop(pcId, footholdId)` (:354) builds `remoteLockable` with `remote: { footholdId }`; add a relay lockable (`remote: { relay: true }`) and `window.openRelayDesktop(pcId)`.
- `minigames/container/container-minigame.js`: `this.remote` (:357) only for `footholdId`; add `this.relay`. `loadLoginDesktop` (:574) query: `?relay=1` for relay; its 403 path for relay: `dropLocal`, close to the world, never the sign-in screen. `accountBarHtml` (:1012): relay reads "Using {displayName}'s session ({username})", header "Remote assist session", one Disconnect (POST /logout via `pcSessions.signOut`) in place of Switch user and Sign out, no link line; no-shares line "Shared drives are not mapped over remote assist." where share folders would be. `reportNetworkExit` (:731): a folder under a relay desktop reopens the relay desktop. `isNetworkScreenContainer` (:53) and `networkScreenKind` (:105) stay false for relay (the plan wants it to close to the world).
- `systems/screen-states.js:83`: a relay session paints locked.
- `systems/objectives-manager.js:360`: ignore `pc_signed_in` with `relay: true`.
- Fit: `tools/playtest/signin-fit.mjs` gains the relay desktop at the four sizes (needs a server: leave for AC0, note it).

**m4 (item 3), from K2 R1 m4 / build log :848.** Folder opens skip the route check: `games_controller.rb:633` `login_pc` scope goes through `session_admits?` only. Client `loadContainerContents` (`container-minigame.js:520`) sends no route. Planned fix: client sends `?foothold=` (remote session) or `?relay=1` (relay session) when the folder's `sourcePcId` session has one; server, in the `login_pc` scope branch, runs `desktop_request_allowed?(find_login_pc(pc), route)` when a route is named (refuse `:conflict`), and refuses a no-route request when the session there is a relay. Keep no-route foothold folders as today (full keyboard rule would change foothold behaviour; record the choice in the log). Rails test in the container/network test files (grep `session_admits` tests).

**Item 6 (reconnect toast).** No root cause found by reading. `noteFinds` diffs against the previous no-screen answer only, so any answer that transiently lacks an entry (server inventory race, a held list) toasts it again. Candidate fix: a page-life `_announced` set of ids; an id is forgotten only when it leaves an answer and its `heldItem` is not in the tray (`_trayIds`), so drop-then-retake still toasts; dedupe `_held` by id, and drop held entries no longer in the latest answer at release. Unit tests: baseline, [ops] toast, [] with tray still holding it, [ops] gives no toast; held twice gives one line.

**Item 7.** `routeEndedMessage` exists (`pc-sessions.js:99`); `linkDropped(ids,'route_ended')` closes open desktops with it and toasts unseen hosts. Add tests: one host, two hosts, open desktop closed with the line, unplug keeps the unplug line.

## Harness and tests
- Client tests: `test/js/keyring-client.test.mjs` (harness copies the module list of `keyring-signin.test.mjs`), `pc-sessions.test.mjs`, `access-remote-signin.test.mjs`, `screen-states.test.mjs`, the objectives test, `inventory-menu.test.mjs`.
- Rails: `RBENV_VERSION=2.7.8 BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bundle exec rails test <files>`.

---
## Run 2 (part B), stopped at the context guard

**Done, commit 2c9af7208:** item 3 (K2 m4 folder route), server half. `games_controller.rb` container `login_pc` scope branch calls new private `folder_route_allowed?(pc_id)`: a named route (relay=1, foothold=, from=) goes through `desktop_request_allowed?`; two routes or relay=0 conflict (403 unreachable); no route is refused only at a relay session; no-route folders under a foothold session keep `session_admits?` (record this choice in the build log, not yet written). Tests: `test/controllers/break_escape/keyring_folder_route_test.rb` (7 runs: relay folder opens, no-route refused at relay, foothold=/two routes/relay=0 refused, forged relay=1 at keyboard and foothold sessions, foothold= ok and wrong foothold refused, no session refused on every route, other player's game). Note: `relay=maybe` casts true in `desktop_route_params` (ActiveModel boolean); left as is.

**Done, commit (this run, see git log):** `api-client.js` `loginWithCredential(pcId, cred, { foothold, relay })` sends `relay: true` only when relay === true, else foothold. No JS test yet.

**Not started (everything else in part B):**
- pc-sessions.js: a python patch was drafted but NOT applied. Design: keep the module import-free (pc-sessions.test loads it from a data URL), so add `export const relayEndedMessage` (same text as remote-host-text `endedAssistMessage`; add a test that they match). `publicSession` adds `relay: true, host`; `load()` skips `s.relay === true` (no signedIn); `signInWithCredential(pcId, id, { foothold, relay })` posts `{relay:true}` and stores `relay: true, host` from the body (careful: the `...pictureFields(body), ...remoteFields(body) };` text occurs twice in the file, in signIn and signInWithCredential, so anchor the edit on the credential one); `_replace` leaves `signedIn` alone for relay (firstAtPc false); `_remoteOf` returns `{ relay: true, kind }` for relay; `displaced(pcId, name, npcId)` returns false for a relay held by that npc (listener passes `d.npcId`); `linkDropped(ids, 'relay_ended')` -> `_relayEnded`: drop, `pc_signed_out` reason relay_ended, close desktop with the line or toast it; add `hasRelay()`, `heldAtKeyboard(pcId)`; `hookSyncAnswer()` registers state-sync part `relayEnds` with only `onAnswer` reading `endedRelayPcIds` (no static import needed; call it from `listen()` and the relay sign-in).
- keyring.js: CONNECT_KINDS/FIND_KINDS add assist_invite; connectRoute returns `{ relay: true }` after footholds; `_connect` step 5 opens `openRelayDesktop` for a relay session, step 8 passes the route and opens by route; arm a `global_variable_changed:*` listener that calls `stateSync.requestSoon()` (or `sync()`) while `pcSessions.hasRelay()`, removed once none. remote-host-text `findLine` needs the assist line "{label}: Connect it from your inventory to join {displayName}'s session." (plan 8.2 line 527).
- unlock-system.js (`heldAtKeyboard` in openLoginPc/interactLoginPc, relay lockable + `window.openRelayDesktop`), container-minigame.js (`this.relay` from `data.remote.relay`, `?relay=1`, relay 403 closes to the world, `loadContainerContents` sends `relay=1`/`foothold=` from the sourcePcId session, relay folder close reopens the relay desktop, taskbar/start panel: "Remote assist session", "Using {name}'s session ({username})", one Disconnect action, "Shared drives are not mapped over remote assist."; `pc-taskbar.js` `pcTaskbarModel` needs a relay option), screen-states.js:83 relay paints locked, objectives-manager.js:360 ignore relay `pc_signed_in`.
- Fixtures (9.1) in test_access_keyring: none present yet beyond Jake the NPC. Needed: `jake_assist` credential, `jake_assist_code` in Jake's itemsHeld plus ink gift `#give_item:text_file:jake_assist_code`, policy `jake_desk`, Jake's office (locked, key `jake_office_key` never given) with `jake_pc` HB-FIN-03 holding `vendor_contract.txt` (`onRead.setVariable: { jake_contract_read: true }`, mechanism at container-minigame.js `handleInteractiveItem`), task, globals, mapping arming `jake_assist_armed`, `timers` entry (90000 ms, startOnGlobal, showCountdown false), later ink end, bark mapping. See plan lines 716-745.
- Build log "K3c run 2 (part B)" entry, full Rails suite, bin/test-js, validator.

---
## Run 4 (relay client), stopped at the context guard

**Committed:** f12debc43 (engine) and 9dcef946e (`test/js/access-relay-desktop.test.mjs`, 10 pass, 4 `test.skip`).
- `pc-sessions.js`: `relayEndedMessage` (copy of remote-host-text `endedAssistMessage`), `relayFields`, `publicSession` relay/host, `load()` skips relay, `signInWithCredential(pcId, id, { foothold, relay })`, `_replace` keeps relay out of `signedIn` (firstAtPc false), `_remoteOf` gives `{ relay: true, kind }`, `displaced(pcId, name, npcId)` keeps a relay held by that npc, `linkDropped(ids, 'relay_ended')` -> `_relayEnded` (close with line, else toast; pc_signed_out reason relay_ended), `settle()` leaves a relay alone, `isRelay`, `hasRelay`, `heldAtKeyboard`, `relayEndedLine`, `hookSyncAnswer()` (registers answer-only part `relayEnds` on window.stateSync; called from `listen()`), `relayAnswer(answer)`.
- `unlock-system.js`: exported `heldAtKeyboard`, `relayLockable`, `openRelayDesktop` (+ `window.openRelayDesktop`); keyboard paths (openLoginPc, interactLoginPc, openLoginSignIn current/onComplete, remote screen held/onComplete) use heldAtKeyboard.
- `container-minigame.js`: `this.relay`, `?relay=1`, relay 403 closes to the world with the ended line, exported `folderRouteQuery` used by `loadContainerContents`, relay folder 403 drop, relay folder close reopens via openRelayDesktop, `relayAccountBarHtml`, relay notices, taskbar `relay` + `disconnect` action ("Disconnected" close line, new text).
- `pc-taskbar.js`: `relay` option, Disconnect action, "Assist" tag, RELAY_* texts, `relayAccountText`. `pc-monitor.css`: two rules.
- `screen-states.js`: relay paints locked. `objectives-manager.js`: relay `pc_signed_in` ignored.

**Open (next agent):**
1. The 4 skipped tests in access-relay-desktop.test.mjs (folder under relay names relay=1 and reopens desktop; folder 403 under relay; foothold= on folder; re-entry after close). Likely harness: how a folder container gets `sourcePcId` and whether its fetch goes through `loadContainerContents`. An earlier unskipped run was OOM-killed (exit 137): suspect a reopen loop in test 9 or 14; run capped (`ulimit -v 2000000; node --max-old-space-size=300`). Check it is a harness issue, not a real reopen loop in `reportNetworkExit`'s relay branch.
2. Unit tests not yet written: pc-sessions relay (no signedIn, load skips relay, displaced exception, relay/kind on both events, relayAnswer ignores non-relay ids, hookSyncAnswer idempotent), a test that `relayEndedMessage` equals `endedAssistMessage`, pc-taskbar relay model, screen-states relay locked, objectives relay no credit.
3. Header doc comment of pc-sessions.js not updated for relay events/reason relay_ended.
4. Build log "K3c run 4 (relay client)" entry not written (the uncommitted build log diff is not mine). Must record K2 m4: no-route folder opens under a foothold session keep today's behaviour.
5. Full `bin/test-js` not run.
**Needs from keyring.js (other agent):** `window.openRelayDesktop(pcId)` after `pcSessions.signInWithCredential(pcId, id, { relay: true })` (route `{relay:true}` from connectRoute); prompt-end trigger keyed on `pcSessions.hasRelay()`.

### Run 4 resumed
Reopen loop was real engine behaviour (relay desktop's own Close reopened itself: sourcePcId falls back to loginPcId); fixed in 4c00b6955 with a guard test; the 4 skipped tests were a harness gap (folders need `locked: false` to fetch) and now pass (15/15 capped). c070ab1bc: share windows send no route. Build log entry written. Still open: items 2 and 3 of the run 4 list (unit tests for pc-sessions relay, the copy-equality test, taskbar/screen-states/objectives relay tests; header comment), signin-fit relay sizes.

### Run 4 close-out
- Loop: ENGINE, not harness. `container-minigame.js` constructor (`this.sourcePcId = ... || this.loginPcId`, ~:379) made the relay desktop's own Close match `reportNetworkExit`'s "folder from a relay desktop" branch (~:830 before the fix), which reopened the desktop on every close. Fixed 4c00b6955 (`if (this.relay) return;` and the folder branch needs `!this.loginPcId`) with guard test "loop guard: closing the relay desktop itself reopens nothing".
- Committed: f12debc43, 9dcef946e, 4c00b6955, c070ab1bc, 84fa23a77 (build log). Full bin/test-js (every file except access-relay-desktop, 2048 MB heap): 717/717. access-relay-desktop (capped): 15/15.
- Open: pc-sessions relay unit tests, relayEndedMessage == endedAssistMessage test, pc-taskbar/screen-states/objectives relay tests, pc-sessions header comment, signin-fit relay sizes, keyring.js hooks (Connect -> openRelayDesktop; prompt-end trigger on hasRelay()).

### Run 5 (unit tests for the relay desktop)
- Added relay tests: pc-sessions.test.mjs (+13, incl. relayEndedMessage == endedAssistMessage and a header check), pc-taskbar.test.mjs (+6), screen-states.test.mjs (+2), objectives-signin-pc.test.mjs (+1). Each was shown to fail with its engine line reverted. pc-sessions.js header now has a "Relay sessions" paragraph. No new harness copy-list entries were needed. No bugs found.
- Still open: signin-fit relay sizes; keyring.js hooks are another agent's.

### Run 5 (relay hooks and R1 fixes)
- Hooks built in afd895cd2, tested in be5982573, part A R2 in 04f7b596c; R1 fixes in 83f8b83ac (M1 re-sign-in by relay when the server holds a relay with no mirror; m1 off/not_responding 403 keeps the relay; t1 relay_session?; t4 names). Details in the build log "K3c run 5".
- Open: t2 (same-value skip needs `oldValue`; leave unless a live proof shows sync bursts), t3 (signin-fit relay sizes, needs a server), live proof of reload then Connect and of a powered-off relay PC, full bin/test-js rerun, AC0 review round 2.
- keyring-client "R3 t1: a sync PUT that never answers" can flake once under load; passes on rerun.
