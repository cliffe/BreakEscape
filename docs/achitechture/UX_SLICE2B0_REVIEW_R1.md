# UX slice 2b phase 0: code and UX review, round 1

Branch `build/ux-slice2b0`, diff `2f5471209..341a5b075` (commits 6059ee134, 5819e4da5, 13feb6bae, 341a5b075). Engine paths are under `public/break_escape/`.

Counts: **B 0, M 2, m 3, n 4.**

## What was checked

- Code: `js/minigames/password/password-minigame.js`, `css/password-minigame.css`, `js/systems/unlock-system.js` (the opener, unchanged), the server readers of `revealSecret` and `captureProof` (`app/models/break_escape/network_access.rb`, `capture_proofs.rb`, `lib/break_escape/capture_model.rb`, `games_controller.rb#capture_secrets`).
- Tests run alone, all green: `password-signin-mode` 58, `pc-monitor-frame` 40, and the importers and scenario readers `engine-fixes-pass4b` 10, `escaping-shared-helpers` 20, `minigame-title-escape` 24, `access-signin-postit` 8, `password-join-mode` 6, `minigame-controls-layout` 11, `keypad-title` 6, `password-case-hint` 5, `engine-fixes-round6` 9, `lock-scope-refusal` 12, `unlock-r1-ux` 11, `password-minigame-submit` 2, `access-remote-signin` 15, `access-signin-routing` 23, `dungeon-graph-networks` 52, `format-8a-reader-parity` 9, `toast-once-across-panel-handover` 6.
- Validator, branch and main (2f5471209) side by side: 0 ❌ on both, and the output is identical apart from the file path (the same 7 warnings).
- Live: keyless server on :3062, new games 3183 (915x412, DPR 3, touch) and 3184 (800x600), scrollbars shown. Each run: plant the box with no cards read (empty state), then read both cards and reopen (tiles, Ian chosen, Ian refused, Change, Other user). No scroller inside the monitor and nothing outside the screen area in any state. Shots are in the review scratchpad `rv2b0/shots/` (`<state>__915x412.png`, `<state>__800x600.png`). The builder's 1400x1000 and 390x844 shots were checked by eye.

## What holds

- **One module.** The captured tiles use the shared `.signin-tile` markup, the same `applyTilePortrait` and `applyHeadshotBox`, and the same Change and fold rules as the keyboard. Nothing else draws tiles. Keyboard behaviour matches the local screen: tiles are buttons (Tab, Enter or Space), Enter in the fields submits, Esc in the fields closes, and Change puts focus back on the first tile.
- **Headshots.** Live, both tiles draw the authored `female_blowse_v2_headshot.png` and `male_nerd_v2_headshot.png` (`data-headshot` set, no `data-headshot-missing`). The crop and initials fallbacks come from the shared function unchanged. A capture with no NPC record shows its label and initials (unit test).
- **Server unchanged.** No file under `app/` or `lib/` changed. The password still comes only from `c.password`, which `capturedSignIns` fills only from the `/capture_secrets` `secrets` map. Sign-in sends the chosen tile's username, so a typed name cannot ride along (unit test). Ian's account is refused by the server on Lena's PC (live: "This account can't sign in on this PC."). The test state carries `fillsPassword` and no password. No new player_state field and no new server answer. The two new globals are booleans set once, and `se_captures` gains at most two entries, so the synced state stays bounded.
- **Untouched.** `openRemoteSignInScreen` still passes `picker: false` and `tiles: []` (`unlock-system.js:657-658`). The PC's own `loginPicker` is still ignored for a remote screen, and the unit test checks that `#signin-tiles` is absent.
- **Pixel art.** The tiles keep the 2px edges, flat fills and pixel fonts of the keyboard tiles. Headshots are drawn at whole scales (x2 in the normal tile, x1 in the short window).

## Findings

### M1. The capture cards plus `revealSecret` let a run skip the earned-secret chain (P5 and P8)

`scenarios/test_access_networks/scenario.json.erb:140` (`revealSecret: true`), `:290-308` (the two cards), `:395-397` and `:413-415` (the `addCapture` mappings).

Failure scenario: a run takes the box, reads the two lobby cards, plants at `comms_port` (P2) and opens `HB-FIN-02`. Lena's tile fills `Ledger-Lena-9`, and P5 completes without the letter from the open share (P4). Ian's tile is offered on every remote screen. The `accounts` map in `account_capture_usernames` (`network_access.rb:1384`) is per game, not per PC, so on `HB-DOOR-01` his tile fills his password and P8 runs without the handover note from the finance share. PLAYTEST.md says every password a run types is read from its in-game source first ("Earned secrets"). The cards break that for anyone who reads them, and a blind or persona playtester in the lobby will read them. The scripted P-series still proves what it did when it skips the cards, and the leak check stays consistent, because it judges `/capture_secrets` answers against the capture routes and proofs. What changes is that the scenario now has an unearned route to two passwords, which neither the validator nor the dungeon graph shows.

`revealSecret` is not needed for this slice's UX. `account_capture_usernames` lists the username "whatever revealSecret says", so with the flag off the tiles, headshots, Other user, Change and the Ian refusal all still show. Only the password fill is lost, and the unit tests already prove both fill branches (`fillsPassword` true and false).

Fix, either:
- (preferred) drop `"social": { "captures": { "revealSecret": true } }`. The live check then proves the branch the real missions use (a tile chooses the account and the password is typed from its earned source), and the chain stays intact. Change the PLAYTEST note to say a captured tile fills only the username here; or
- keep the flag, but gate each card on its earned source: Lena's card readable only after `inbox_letter` is copied, Ian's only after the handover note is read. Add a PLAYTEST line saying the cards are a shortcut that P-series runs must not read.

### M2. Every remote open with captures shows the typed form, focuses Username, then swaps it for the tiles

`password-minigame.js:430` (initial `other`), `:1707-1709` (`setCapturedSignIns` flips to the tiles), `unlock-system.js:661` and `:679-681` (the screen opens with `captured: []` and `capturedLoading: true`, then fetches).

`other` is computed when the screen is built, while `captured` is still `[]`, so `other` is true. `renderSignInForm` shows the Username and Password fields and focuses Username. When `/capture_secrets` answers, the form is hidden and the tiles appear. Measured live (game 3183, local server): at 0 ms the form is `display: flex` with focus on `#signin-username`; by 25 ms it is `display: none`, focus is on `body` and two tiles are showing. On a deployed server this is one round trip, often a few hundred ms. On touch the focus comes from the player's own tap on Sign in, so the phone's keyboard can open and then lose its field (not proved on a real phone). The check against "a player already typing" (`:1708`) looks only at the field values, so a player who has tapped into Username but typed nothing also loses the form.

Fix: while `capturedLoading` is true, show neither the form nor the tiles. Show the heading with "Checking..." under it, set no focus and leave `other` unset (a third state, or `other = null`). When the list arrives, choose tiles or the typed form once. If the form is kept during loading, at least count `document.activeElement === this.usernameField` as typing, and do not focus the field until the list has arrived. Add a unit test: open with `capturedLoading: true`, then assert no focused field and no visible form before `setCapturedSignIns`.

### m1. The empty state puts a dead panel above the typed form

Shot `empty__915x412.png` (and before: the sweep's `pc-remote-signin__915x412.webp`). With no captures, the heading and "None yet." now sit on two lines in a full-width slab above Username, where the old one-line note sat below Sign in. The first thing on the screen tells the player there is nothing to choose, and the form they need is pushed down. It fits at 915x412 (measured: no overflow), but with nothing to spare. Fix: with no captures (and not loading), render the block after the form, on one line ("Captured sign-ins: none yet."), as before. Keep the block above the form only when it holds tiles.

### m2. The keyboard's tile loop also writes the class on the captured tiles

`password-minigame.js:1609-1612`. `querySelectorAll('.signin-tile')` matches the captured tiles too. Their `dataset.tileIndex` is undefined, so the first loop removes `selected` from every captured tile, and the second loop (`:1616-1620`) puts it back. It works only because of the order of the two loops. Fix: narrow the first loop to `.signin-tile[data-tile-index]`.

### m3. No short-window, empty or loading shots in the build log

The build log's live proof covers 1400x1000 and 390x844 only, though the brief asks for a short window, the empty state and the loading state. This review took 800x600 and 915x412 for empty, tiles, chosen, refused, Change and Other user (all fit, no scroller). The loading state is too brief to shoot on a local server (see M2). Fix: after M2, add a loading-state shot with the `/capture_secrets` answer held back (for example, a Playwright route delay), plus the 915x412 empty-state shot after m1.

## Nits

- **n1.** `.signin-captured-item` in `css/network-view-minigame.css:414-422` no longer matches anything. Move it out with the slice.
- **n2.** In the tiles state the heading "Captured sign-ins" is left-aligned while the tile row is centred (shots `tiles__915x412.png`, `tiles__1400x1000.png`). This leaves a gap on the left at 915x412. Centre the heading, or left-align the row.
- **n3.** At 390x844 the Other user tile wraps to four lines ("Other / user / type a / name") and stretches the row, so the two NPC tiles have empty space at the bottom (`ux2b0/shots/tiles__390x844.png`). The keyboard screen has the same wrap, so this is not a regression; it is the shared module's to fix if anyone's.
- **n4.** The build log's live-proof section does not say that the tiles state at 800x600 keeps the tile row visible after Other user (scale 1, no `data-short`, so nothing folds). That matches the keyboard screen, but say so, so nobody reports it as a missed fold.

## Answers to the brief's questions

- **Do the scenario changes alter what the existing tests and P-series prove?** The JS readers (`dungeon-graph-networks`, `format-8a-reader-parity`, `toast-once-across-panel-handover`) pass unchanged, and the validator output is identical to main. `captureProof` on Lena and Ian makes the scenario "declare proofs" (`capture_model.rb:162`). That only tightens `account_capture_served?`, and Sam has no capture route, so nothing else in this scenario is withheld. The scripted P-series proves the same as before as long as it skips the cards. The change is the unearned route described in M1.
- **Is turning on revealSecret right here?** No: see M1. The tiles do not need it, and it gives two passwords away to anyone who reads a card in the start room.
