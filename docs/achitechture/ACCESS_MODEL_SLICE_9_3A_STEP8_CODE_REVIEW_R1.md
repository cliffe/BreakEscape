# Slice 9.3a step 8: code review, round 1

Scope: the client for the network view, remote sign-in and shares, `83fbaecc2` to `77065971d` on
`claude/break-escape-access-design-090sjx` (pc-sessions.js, unlock-system.js,
password-minigame.js, container-minigame.js, text-file-minigame.js, the network view and its
stylesheet, the test bridge log, npc-manager.js includes on a list, `test_access_networks`, the
9.1 m5 sticky note guard in `games_controller.rb#login_accounts`, and the leak scanner change).
Checked against `ACCESS_MODEL_SLICE_9_3_PLAN.md` sections 4.3, 4.4, 4.5, 6 and 9 step 8, and
`ACCESS_MODEL_SLICE_9_3_PLAN_REVIEW_R3.md` (R3-M1, R3-M2).

## Counts

| | |
|---|---|
| Blockers | 0 |
| Majors | 2 |
| Minors | 5 |
| Nits | 2 |
| `bin/test-js -j 3` | 473 files: 472 passed, 1 failed (`fingerprint-generator.test.mjs`, a timing assertion, "worst 195 ms", under load; it passes run alone: 7 of 7) |
| `bin/rails test` | 1282 runs, 9446 assertions, 0 failures, 0 errors, 1 skip |

No browser was used. No code was edited. The working tree was clean before and after (no
`dungeon_graph.json` was rewritten: the validator was not run).

## What holds

- **Secrecy, the sticky note.** The remote sign-in screen (`openRemoteSignInScreen`,
  `unlock-system.js:452`) never calls `GET /login_accounts`, shows no tiles and passes
  `postitNote: ''`, `showPostit: false`. A remote desktop's Switch user passes `remote`, so it takes
  the same path (`container-minigame.js:731-733`). The server guard (`games_controller.rb`,
  `login_accounts`) is belt and braces: the route already requires physical reachability, so a
  crafted request without `foothold` gets nothing for a PC in a locked room.
- **Secrecy, the rest.** The view reads only `GET /network` rows; the share lockable and the remote
  lockable are built from the row; the Captured sign-ins list carries the password only in the
  input field, and the test bridge state reports `fillsPassword`, never the value; `list()` adds
  `host` only for a remote session.
- **The landing table, R3-M1 and R3-M2.** Every row of 4.3 was traced: the view's Close (leave
  `closed`), its handover (no `network_view_closed`), `foothold_gone` from the refetch, the sign-in
  screen with and without a session (the `signin` row now has `pcId`), Switch user left with no
  sign-in (back to the desktop through `landed` with `pcId`), the desktop's Close for a view trip
  and a session trip, Sign out, 403 `no_session` (session dropped) and `unreachable` (session
  kept), the link dropped, a share from the view, a mapped share at a remote and at a keyboard
  desktop, a reader below any of them, and nested folders (each carries `parentLockable` through
  `childExtras`, `container-minigame.js:770`). P5 in `PLAYTEST.md` now says what the code does.
- **npc-manager.js includes on a list.** Across every scenario there are five `.includes(...)`
  mapping conditions: `data.endedPcIds` (a list, the new case), `data.usernameList` (a comma
  string by design, `pc-sessions.js:420-421`), `data.minigameName` and two `data.cardName` (strings).
  The strings behave as before. The music and timer evaluators have no includes form, so nothing
  diverges there. The validator's syntax check already strips `.includes('...')`.
- **Ordinary containers and readers.** For a container that is not a network screen every new
  path is a no-op: `parentLockable` is never set outside `childExtras` and `openMappedShare` (no
  other file uses the field), `reportNetworkExit` returns without acting, `init` clears only a
  network screen's pending return, `offersTransfer` and `takeItem` are unchanged when
  `sourceResourceId` is null, and the text-file reader's new branch needs
  `isNetworkScreenContainer`. m01 to m09 and the labs have no `network_share`, `remote` or
  `networkShare` data.
- **pc-sessions.js for local sessions.** `publicSession`, `list()`, `pc_signed_in`,
  `pc_signed_out` and `pc_desktop_opened` carry no new field for a local session; the internal
  record gains `remote: false` only. The unplug listener is registered from `load()`, so it works
  after a reload.
- **Save and reload.** Remote sessions come back with `remote`, `footholdId` and `host`; a trip is
  in memory only, so a reload lands in the world, which is right. The link item comes back from the
  server inventory with its own sprite and `storeIn`; `restoreHandles` only covers a client that lost
  it (minor 2).

## Majors

### M1. A child of a network screen that is neither a reader nor a container strands the trip and leaves a stale return that later hijacks the world (the cancelled PIN case)

- **Where.** `container-minigame.js:894-1015` (`handleInteractiveItem`: the locked-folder and other
  interactive branches set `pendingContainerReturn` and `exitReason = 'item'`, `:949`, `:995`);
  `network-links.js` `LANDINGS.desktop.item` and `LANDINGS.share.item` (null: no landing);
  `unlock-system.js:728-731` (the PIN callback does nothing on failure; the password case at
  `:754` is the same); `text-file-minigame.js:377-386`; `notes-minigame.js:803`;
  `capture-log-minigame.js:136`.
- **Failure scenario.** P5: on Lena's remote desktop, open Ledger-Archive, click Year-end, then
  close the PIN pad (or press Esc). The share reported `item` (no landing), the PIN pad reports
  nothing, so nothing is on screen and the trip is still running: no `network_view_closed`, and a
  capture log `returnTo` never runs. `pendingContainerReturn` still holds the share, a network
  screen. The builder's guard (`:408`) clears it only when another container opens. If the player
  next reads a text file in a room, the reader's cleanup sees a network screen and reopens Lena's
  share from the world (`text-file-minigame.js:379-384`); if the next minigame is the notes reader,
  `returnToContainerAfterNotes` reopens it; meanwhile the capture log's armed return stays armed
  because a return is pending. The same happens for a key-locked folder without the key (an alert,
  no minigame), a wrong-PIN lockout, and any interactive item that is not a reader (a phone, a
  workstation, a `minigameId` object) opened from a remote desktop or a share.
- **Fix.** One rule: a hand-over from a network screen to anything other than a reader or a
  container comes back to that screen when it ends without opening one. For example, in
  `handleInteractiveItem`, when `isNetworkScreenContainer(this.containerItem)`, arm a one-shot
  listener on `minigame_completed`/`minigame_failed` (the capture log's `armReturn` pattern) that,
  one tick later with no minigame open, clears `pendingContainerReturn` and reopens
  `this.containerItem`; and when `handleObjectInteraction` returns with no minigame open (the key
  alert), reopen at once. Add the row "A lock or other screen opened from a network screen, left
  without opening anything: the screen it was opened from" to 4.3, and tests in
  `container-shares.test.mjs`: a cancelled PIN on a folder in a mapped share returns to the share
  with `pendingContainerReturn` cleared; a world text file read afterwards closes to the world.

### M2. The leak scanner's share clue exemption is global, and hides a share password outside its share

- **Where.** `tools/playtest/lib/access_leak_scanner.rb:258-261` (`note_clues(item)` in
  `walk_share`), used by `deliberate_clue?` (`:492-496`) in `scan_passwords`.
- **Failure scenario.** `note_clues` exempts a password wherever it appears inside a hash whose
  `id` is the share item's id, or inside a string containing any of that item's own strings,
  on every route and before the share was ever served. `share_content`, the rule left to catch a
  share item outside its share, matches only `name`, `text` and `content`. So a share item whose
  password sits in another field (`observations`, a variant, `onRead` text) and that leaks into a
  room or `/scenario` answer is reported by nothing. Confirmed with a probe through
  `bin/rails runner`: one NPC with password `Patchday!2026`, a share item with that password in
  its `observations`, and two `GET /room` answers carrying that observation (one under the item's
  id, one under another id). The scanner at `5e0522e29` reports two `password` findings; the
  scanner now reports none. A password is the secret this tool exists to find, and a blind run
  would pass.
- **Fix.** Exempt a share clue only where `scan_share_content` would allow that item: in a
  `GET /container` answer for its resource or a folder above it, or after that item has been served
  that way (`legit`), as the note exception is tied to its route. Keep share items out of the
  global `@clue_texts`/`@clue_holders`, or record them in separate maps checked with that context.
  Add tests to `test/unit/access_leak_scanner_test.rb`: the letter's password in the share's
  `/container` answer is not reported; the same password in a room answer before any serve is.
  The change has no test today.

## Minors

1. **Hand-over is recorded before the next screen exists.** The view sets `exitReason = 'handover'`
   (`network-view-minigame.js:222`) and the desktop sets `'switch'` (`container-minigame.js:731`)
   and then call `openRemoteSignIn`/`openLoginSignIn`, which awaits `GET /capture_secrets`
   (`unlock-system.js:457`) before starting the screen. During that wait the view or desktop is
   still open: Close then reports a null landing, and a second click opens a second screen. If the
   screen never opens (no framework), the trip is stranded. Fix: start the sign-in screen first and
   fill the Captured sign-ins when the answer arrives, or set the reason only once the new screen
   has started (and ignore clicks while one is opening).
2. **`restoreHandles` (the builder's open item).** The rebuilt handle (`network-links.js:173-187`)
   has no `sprite` and no `storeIn`, and writes "Open it to see what it reaches." instead of the
   server's text; the view header (`linkObservations`) and the jack's "Your <device> is plugged in
   here" (`_deviceName`) both degrade with it. Agreed fix: the bootstrap foothold carries `sprite`,
   `observations` and, when set, `storeIn` (none is secret), and `restoreHandles` uses them. Only a
   client that lost its handle is affected; a normal reload restores the server's item.
3. **The view header's observations come from the tray item (the builder's open item).** That is
   acceptable and is what R3 minor 4 offered; say it in 4.3 and drop the contrary sentence in 13.4,
   so the capture log's author does not expect `GET /network` to carry it.
4. **A notes item below a network screen.** `returnToContainerAfterNotes` adds the note with a stand-in
   that carries no `sourcePcId` or `sourceResourceId` (`container-minigame.js`, the `itemToTake`
   branch), so the server's generic search, which does not walk resources or profiles, will
   probably refuse it; and it reopens the share with `desktopMode` auto-detected, so a share from
   the view comes back in the standard layout. Pre-existing for profiles; it now reaches shares.
   Fix: copy `sourceExtras()` onto that stand-in and pass `desktopMode: true` for a network screen.
   No scenario has a notes item in a share yet.
5. **Test gaps.** No test for M1 or M2. The jsdom suites use a hand-written framework mock whose
   `endMinigame` order matches `minigame-manager.js` today; one test that drives a trip through the
   real manager would catch drift. The plan's scripted Runs A to C and the three first-slice suite
   runs have no report in the commits (only the notes in `9052f565d`); confirm they were run, or run
   them before step 8 is called built.

## Nits

1. `README_scenario_design.md:1432` describes `.includes('...')` without saying that on a list it
   tests membership of a whole id. Add one clause.
2. `pc_signin_shown` can now carry `reason: 'remote'` (`unlock-system.js`, `screenShown` in
   `openRemoteSignInScreen`); the reason list in the `pc-sessions.js` header does not name it.
