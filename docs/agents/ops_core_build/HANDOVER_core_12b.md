# Handover: core step 12 part B (S3, N15): world side of a technique session

Done (committed). Nothing in progress. Part A (network view, `api-client.js`, the Use handler) is 12a's.

## Files and lines (public/break_escape/js unless noted)
- `systems/pc-sessions.js`: `accessFields` (~248) copied in `load`, `signIn`, `publicSession` (`access: 'admin'` only); `remoteViewFoothold(pcId)` (~498: technique copy, remote, foothold still in `networkLinks.get`); `canSwitchUser(pcId)` (~512: false only for a technique copy whose foothold's `lastView` host row has `remoteSignIn === false`); `noteTechniqueSession(pcId, session, endedPcIds)` (~606): **12a's Use handler must call this with the answer's `session` and `endedPcIds`** (records via `_replace`: pc_signed_in, drops ended sessions); `displaced()` gains `if (previous.remote === true) return false;` after the relay rule; header and docstring comments changed.
- `systems/unlock-system.js`: `openRemoteViewIfHeld` (~288) calls `networkLinks.openSession(pcId, { returnTo })`; used in `openLoginPc` after the headless check and in `interactLoginPc` immediately before the `heldAtKeyboard` branch (returns `'remote_view'`). Skipped for `scenarioData.remote` rows.
- `minigames/container/container-minigame.js`: imports `remoteViewLine` and `createBoltCanvas`; `mountMonitor` adds `desktop-frame--remote-view` to `.pc-monitor-screen`; `isRemoteView`, `remoteViewLineHtml`, `decorateRemoteView` (bolt canvas into `.desktop-remote-bolt`, stepped wipe class `desktop-wipe` on `.pc-desktop` unless `prefers-reduced-motion`); both remote-line builders choose the remote-view line when `session.via === 'technique'`; `canSwitch` also needs `canSwitchUser(pcId) !== false`.
- `minigames/text-file/text-file-minigame.js` (~220): same `canSwitch` rule.
- `utils/remote-host-text.js`: `remoteViewLine(account, link)`.
- `../css/ui-themes.css` (end of file): `--ui-remote-view`, the red rim, line colour, wipe keyframes, reduced-motion guard.
- `systems/network-links.js`: one emit `network_foothold_dropped { footholdId, sourceId }` at the end of `_dropFoothold`; header event list.
- `systems/interactions.js`, `minigames/biometrics/biometrics-minigame.js`: local `restTint(obj)` (compromiseTint else clearTint) replaces the three / one `clearTint()` calls.
- `systems/compromise-marks.js` (NEW): `CompromiseMarks` (`sourcesOf`, `syncRoom`, `refresh`, `list`, `install`), `installCompromiseMarks`. Source kinds `technique`, `implant`, `jack`; `sources` in `list()` are `[{ kind, footholdId }]`. Bolt is an image from texture `compromise_bolt` (canvas from `utils/compromise-bolt.js`, scale 1), origin top right, depth sprite+1.
- `core/rooms.js`: `window.compromiseMarks?.syncRoom?.(roomId)` after screenStates. `core/game.js`: installs the module after `installScreenStates`, and `syncRoom` for the start room.
- `systems/test-bridge/access.js`: `compromiseMarks()`.
- Copy lists: `utils/compromise-bolt.js` added to the 17 harnesses that copy `container-minigame.js` and list `remote-host-text.js`.

## Tests (test/js)
New: `pc-remote-view-click.test.mjs` (7), `desktop-remote-view.test.mjs` (7), `compromise-marks.test.mjs` (9). All pass.

## Open / for the orchestrator
- Two existing tests conflict with the plan and were NOT edited (instruction: no assertion edited): `pc-sessions.test.mjs` H-4 (npc_sat_at and npc_borrowed_session displace a `remote` password copy; plan 5.4 says a remote copy stays) and `test-bridge-access.test.mjs` (pins the key list of the access bridge; now includes `compromiseMarks`). Both need a one-line owner decision; the new behaviour is covered in `pc-remote-view-click` and `compromise-marks`.
- `npc_frustration.rb record_borrow_done!`: not done. Section 12.2 names the change but assigns it to no step row; no Ruby builder has done it.
- Not built here: the network view row's bolt (12a, uses `utils/compromise-bolt.js`); `interactions-compromise-tint.test.mjs` and `pc-sessions-access.test.mjs` of section 11.3 (not in my test list); text-file's `canSwitch` is pinned by a source assertion, not a running reader.

## Live proof should look at
A held PC in a room: red tint and bolt at top right out of range, blue in range then red again; click opens the red-rimmed desktop with the "Remote view: ... through ..." line and a short stepped wipe, no sign-in; Sign out clears the mark; unplug clears it; `__test.access.compromiseMarks()` lists it with `tint`. The bolt position and size on real sprites (scale 1) and the wipe look are unseen.

## S3 client R1 (world half): contract changes

- `networkLinks.view()` (the stored `lastView`) now carries the `GET /network` body's top-level `techniques` map beside the foothold entry's fields (B1). A body with no map gives the plain entry.
- `pcSessions.noteTechniqueSession(pcId, session, endedPcIds, tokenExpiredPcIds)` takes a fourth argument; a repeat grant of the same copy (same npcId, footholdId, access) changes nothing and fires nothing. The view should pass `answer.tokenExpiredPcIds` (m1, view side).
- `signInWithCredential` and `claim` copy `access` (m3). `canSwitchUser` reads `hosts` and every `networks[].hosts`.
- `openRemoteViewIfHeld` fetches `networkLinks.view(footholdId)` first when no view is held (a 'gone' answer takes the keyboard path), then `openSession(pcId, { returnTo, toWorld: true })`. A `toWorld` trip leaves to the world on sign_out, no_session, unreachable and not_responding (m6; other `session` trips, e.g. the capture log, still resume the view). N-C1: a `toWorld` trip also reopens its own desktop on a share close and leaves to the world on a sign-in close with no session; a trip not opened from the world keeps both landings in the view.
- `compromiseMarks.syncRoom` runs after `networkLinks.syncRoom` and `plantHiding.syncRoom` (rooms.js, game.js); `_place` re-places the bolt and copies `visible` on every later pass (m8).
- `keepsAuthoredLook` ignores a highlighted sprite's blue (M1). A fingerprint-view red on a non-highlighted sprite still counts as authored (bolt only).
- The three assertions of the plan's section 10 part 3 are updated (M3); `displaced()` leaves any remote copy.
