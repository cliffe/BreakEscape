# Credential keyring K3a: code review, round 1

Diff: `git diff main...b7214fb2e` on `build/keyring-k3a` (cut from `bb075aa10`). Spec: plan 8.1, 8.3 (the `linkDropped` reason that lands with K3a), 8.4, 8.5; build log K3a runs 1 to 4.

## Verdict: FIX (B0 M1 m4 t5)

No blocker. Nothing new reaches the client that the server did not mean to send, every author string goes in escaped or as text, the server still decides every sign-in, and nothing is added to player_state. The 8.5 strings match the table word for word. The one major is a plan item that K3a owns and did not build: a sign-in's `endedPcIds` are dropped with the unplug wording. The minors are an edge in the page-start prime, a file-opened hook that only one open path calls (and no test sees), a client-side fallback that can show a saved connection the server did not scope, and the order of the chosen line.

Runs on `b7214fb2e`: `keyring-signin.test.mjs` 46/46, `screen-states.test.mjs` 26/26, `bin/test-js` 713 files, 0 failed; `keyring_route_test.rb` and `sync_payload_size_test.rb` 11 runs, 0 failures. No server was started (port 3063 is the live-proof agent's), so `signin-fit.mjs` and the live beats were not run here.

## Security walk (8.4), what holds

- **No new secret.** The only server change is `credentialsDeclared`, a boolean from `scenario_data['credentials']` (`games_controller.rb:444-448`); the registry is still stripped. GET /keyring is unchanged from K1: a registry password carries no value (`credential_keyring.rb` `registry_password_entry`), only a captured entry carries the password the capture already served. The client reads `password` only for `source: 'capture'` (`password-minigame.js:413-414`).
- **No XSS.** Tile tags, titles, `data-username` and `aria-label` go through `escapeHtml`; the ways box (`renderSignInWays`) builds nodes with `textContent` only; the remote message line goes through `nowrapHostsHtml(text, escapeHtml)`; the start panel and the account bar escape `displayDashes(line)` (which only swaps in a dash character, never markup); the teaching toast is plain text (`notifications.js:569`, plain unless `html: true`). Mutations 10 and 11 of the build log prove the two new HTML sinks are tested.
- **Client never decides access.** A greyed button sends nothing, but the server's own `accepts?` check is what refuses (`credential_login.rb`); a forged click on a greyed button would be refused there. Lock stays password-only on both sides (`pc-sessions.js:258`, `game.rb:3605`), so a credential session cannot be locked into a state no password clears.
- **Nothing synced.** `keyring.js` holds its cache, opened set, first-answer ids and taught kinds in memory only; `credentialsDeclared` is a static bootstrap field. The test state exposes counts and ids, never a password (test "the test state carries ... never a password").
- **Harness copy lists.** No engine module gains a static import of a new file: `keyring.js` is imported statically only by `main.js` (no harness loads it) and by dynamic import in `unlock-system.js`; `container-minigame.js` imports one more name from `pc-taskbar.js`, which it already imported; `password-minigame.js` imports more names from `remote-host-text.js`. `bin/test-js` is green with no ERR_MODULE_NOT_FOUND.

## Deviations (build log K3a runs 1 to 4)

1. **`core/game.js` primes the keyring at page start** (`window.keyring?.prime?.()`, no import). **Accept.** It is the only way to tell "earned before this page" (show at once, the 8.1 reload gap) from "earned in this page" (wait for the file) without server state. It is a no-op without `credentialsDeclared`, and `game.js` gains no import. The fallback when the prime fails is m1.
2. **Picker `false` at the keyboard shows no keyring tiles; `accounts` drops unlisted keyring accounts; `known` adds them.** **Accept.** `accounts` and `known` follow K0's 5.2 rule exactly (`dropUnlisted`). K0's "false shows unlisted captures tagged" was written for the remote screen; a picker-`false` keyboard has no tile row at all, and adding one would change a shipped screen's look for an account whose password the player must type anyway.
3. **Desktop lines use `escapeHtml` inside the existing HTML templates; the ways box uses `textContent`.** **Accept.** Each follows its file's own practice and both escape; mutations 10 and 11 fail the tests.
4. **A late keyring answer after a tile is chosen does not fill the Password field.** **Accept.** Overwriting a field the player may be typing in is worse than an empty field, and Change then the tile again fills it (`selectSignInTile` reads the refreshed tile). The test pins it.
5. **`credentialsDeclared` and the `sync_payload_size_test.rb` change** (refute `/"credentials"\s*:/` instead of the substring). **Accept.** The flag is a capability bit, not per-player state. The regex still catches the registry under its own key at any depth; the old substring test caught nothing more except the flag itself (item `credential` fields are singular and never matched "credentials").
6. **A server `kindRefused` greys the button from then on and shows the full line.** **Accept.** It matches what a click on a pre-greyed button does, and the next screen open gets `accepted: false` from the server anyway.
7. **The plug badge group reuses `badge-key.png`** (`remote-host-text.js` `BADGE_FILE`). **Accept** as a stand-in until the art; one place to change.

## Major

**M1. A sign-in's `endedPcIds` are reported as an unplug, and 8.3's `linkDropped` reason is not built.** `pc-sessions.js:347-349` calling `linkDropped(ended)` at `pc-sessions.js:617-638`.
Plan 8.3 says `linkDropped(endedPcIds, reason)` "gains a reason (K2's client half, landing with K3a)": `unplugged` keeps `unplugEndedMessage`, `route_ended` uses the 8.5 line "Your session on {host} ended: the session it went through was closed." K3a wires `_dropEnded` into both sign-in paths but calls the one-argument `linkDropped`, so an onward session pruned by a replacing sign-in closes with "The link dropped" and toasts "Unplugged. Your session on HB-FIN-03 ended." when nothing was unplugged. With K3a's foothold-only routes the server sends no `endedPcIds` yet, so no player sees it today; it becomes the live text the moment K3b (Connect hands `endedPcIds` to `linkDropped`), K3c or K4 lands, and the build log does not list it as deferred. The K2 3.8 test only checks that the ids reach `linkDropped`, so it passes on the wrong wording.
Fix: add the `reason` argument (default `unplugged` for the `network_device_unplugged` listener), pass `route_ended` from `_dropEnded`, add `routeEndedMessage(host)` beside `unplugEndedMessage` with the 8.5 text, and assert the toast text in the endedPcIds test for both reasons.

## Minors

**m1. When the prime fails, the first screen's answer becomes the "page-start" answer and shows found passwords before their file is opened.** `keyring.js:81`, `keyring.js:105-109`.
`remember` sets `firstAnswerIds` from whichever answer succeeds first. If the page-start GET fails (a blip, a 5xx), `prime` swallows it and the first sign-in screen's answer fills `firstAnswerIds`, so an entry the player earned in this page (signed in at Lena's PC, not yet opened passwords.txt) shows "In file" and its found line at once. The same happens if a screen's answer beats a slow prime.
Fix: set `firstAnswerIds` only from the prime's own answer (pass a flag into `remember`), and on a failed prime set it to an empty set, so the worst case is the stricter one (after a reload with a failed prime, open the file again). Add a test: prime rejects, then a screen answer with a registry password, `foundVisible` false until `noteOpened`.

**m2. Only the container's two click paths mark a file opened, and no test fails without them.** `container-minigame.js:1511`, `:1581`.
The `foundIn` item is authored inside the proof's session PC, but nothing stops it being takeable. A takeable file on a sign-in desktop offers Open / Copy / Move; Copy or Move takes it into the inventory without calling either hook, and reading it from the inventory later goes through the text-file viewer, which never calls `noteOpened`. The tag then never shows until a reload. Separately, I removed both hook lines and ran `keyring-signin`, `container-shares` and `container-transfer-dialog`: 0 failures, so the R3 behaviour rests on the live proof alone.
Fix: call `noteOpened` where the text is shown (the text-file and notes viewers' open), or in `handleObjectInteraction`'s read path as well; add a container test that clicking a readable item, and Open in the transfer dialog, both add the id to `window.keyring.opened`.

**m3. The client lists a saved connection the server did not scope, and treats a missing `accepted` as accepted.** `keyring.js:135`, `password-minigame.js:418`.
The server sets `forThisPc` and `accepted` only when the screen's `pc_id` and route are openable now (`keyring_pc_openable?`); otherwise it sends neither. The client falls back to `connectsTo === pcId` and `accepted !== false`, so a remote screen whose foothold has just stopped reaching the host shows a live "Connect with" button even for a PC whose policy refuses saved connections. The server refuses the click, so this is display only, but it is the one place where the client second-guesses a server answer.
Fix: require `e.forThisPc === true` in `screenEntries` and keep `accepted: e.accepted === true`; update the "other PC" test to cover an unscoped answer.

**m4. The ways-in box sits above the chosen account's name.** `password-minigame.js:1571` (the box is the first child of `#signin-form`, before `.signin-selected-row`).
Once a remote tile is chosen the row folds, so the screen reads "Connect with HB-FIN-02.rdp", then "Lena Fox (lfox), Captured password, Saved connection [Change]", then Password. 8.1 lists the ways in "on the chosen line", after the choice; a player reads the buttons before learning whose they are. Placing it first does make "first button in view without scrolling" easy, which may be why it is there.
Fix: move `#signin-ways` and its cue below `.signin-selected-row` and let `signin-fit.mjs` confirm the first button still shows at all four sizes; if it cannot, keep the order and say why in the build log. Check in the live shots either way.

## Trivial

**t1.** `.signin-cred` gets `pc-os-btn` only in a monitor (`password-minigame.js:2096`); in the `wrapInFrame` fallback it has no button class and no CSS of its own, so it would draw as a browser-default button with a smooth font. Give it the same out-of-monitor styling as `.submit-btn`, or add `minigame-button`.

**t2.** `credentialRefusalLine`'s `greyedShown` (`remote-host-text.js:136-138`) is never passed, so its empty-line branch is dead: a greyed button never posts. Drop the parameter or note why it is kept.

**t3.** The keyboard's chosen line names a tagged tile's kinds only on a remote screen (`password-minigame.js:1990`), while the keyboard tile's title now carries them. One look per concept suggests the same "Jake Brooks (jbrooks), Password in a file" on both.

**t4.** The account bar's second line on the non-monitor path (`container-minigame.js:1026-1029`) has no unit test; only the start panel's line is tested. One assertion on `accountBarHtml` with a credential session, including an escaped label, would cover it.

**t5.** The keyboard path filters to `kind === 'password'` twice (`unlock-system.js` initial params and `setKeyringEntries`) after `screenEntries` has already done it for `SCREEN_KEYBOARD`. Harmless; a comment saying it is a belt-and-braces guard would stop the next reader wondering.

## Tests against plan 8.1

Present and able to fail: label cut with "Connect with" whole; one tile per account; tags by kind and "+N"; the `foundIn` wait and the reload case at the `Keyring` level; buttons above an always-present Password field; the found-password line; no invite on a foothold screen; greyed refused credential with `aria-disabled`, short reason, full reason on click and no request; password-only at the keyboard; each 8.5 refusal text (wrongPc, kindRefused for both kinds, notPermitted, lockedOut, ended, remoteBlocked, generic, both 403s); loading, cap, late redraw and failure at both screens; nothing new without `credentials`; start panel line; reload keeps kind and label; `endedPcIds` reach `linkDropped`. `screen-states.test.mjs` covers a credential session showing the desktop look and a claim painting locked.

I re-ran mutation 3 of the log (`kindRefusedShort` text changed): tests 12 and 26 fail, as recorded; restored with `git checkout`. My own mutation (both `noteOpened` hooks removed) failed nothing: m2.

Missing: the endedPcIds wording (M1), the failed-prime case (m1), the container hooks (m2), an unscoped answer (m3), the account bar line (t4).

## Not checked

- `tools/playtest/signin-fit.mjs` (the four worst cases at the four sizes, phone width 390) and the live beats R2, R3 sign-in half, R4 and R5a: both need a server. The phone-width claims for the short refused line and the 32-glyph file name rest on those runs.
- The full Rails suite (run 4 reports one fix and a re-run of that file only; I re-ran only the two changed files).
