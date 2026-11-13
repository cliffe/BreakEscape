# UX slice 2b phase 0: code and UX review, round 2

Branch `build/ux-slice2b0` at f07908cf2. Fix commits 3e29efb02 (M1), 3f74ee516 (M2, m1, m2, n1, n2), f07908cf2 (build log), and the main merge b165f8fbb. Engine paths are under `public/break_escape/`.

Counts: **B 0, M 0, m 1, n 4.** Ready for a train.

## What was checked

- Code: the three fix commits in full; `password-minigame.js` (`renderSignInForm`, `setCapturedSignIns`, `placeCapturedBlock`, `signInTileSelected`, `clearSignInChoice`, `capturedListHtml`); `unlock-system.js` (`openRemoteSignInScreen`, `remoteCapturedSignIns`); `Game#reveal_capture_secret?` and `#capture_secrets_for_client`; `GamesController#capture_secrets`; `state-sync.js#syncConfirmed`.
- Tests run alone, all green: `password-signin-mode` 61, `validator-access-model` 36, `dungeon-graph-networks` 52, `format-8a-reader-parity` 9, `toast-once-across-panel-handover` 6, `access-remote-signin` 15, `access-signin-routing` 23, `pc-monitor-frame` 40.
- Validator: main's `scripts/` (da5f53f34) extracted beside the branch and run on the same four scenario files that use `captures`. `test_capture_log`, `lab_social_engineering` and `lab_physical_pentest` give identical output on both (0 ❌; 3, 5 and 6 warnings). `test_access_networks` gives 0 ❌ on both; main's validator adds the two "revealSecret is not set" warnings on the branch's file (9 warnings), the branch's gives 7, the same 7 as main's file under main's validator. The only `scripts/` difference from main is the `validate_scenario.rb` hunk. The branch merges into current main with no conflicts, and main has not touched the slice's files since the merge base.
- Live: keyless server on :3062, new game 3215 at 915x412 (DPR 3, touch), scrollbars shown (15 px measured). Cards read, box planted, then `/capture_secrets` called directly; the remote screen opened with the answer held back 6 s (loading, tiles, Lena chosen); then opened again with `/capture_secrets` made to throw. Shots in the review scratchpad `rv2b0r2/live/shots/`. The builder's shots at all four sizes (`r1f2b0/shots/`) were checked by eye for loading, empty and tiles. Server stopped afterwards.

## Verified

### R1 M1 (revealSecret): fixed

- `/capture_secrets` on game 3215 with both captures held answered `{"secrets":{},"accounts":{"ian":"ishaw","lena":"lfox"}}`. `reveal_capture_secret?` is a strict `== true`, and `capture_secrets_for_client` returns `{}` before reading anything else, so `false` serves nothing.
- The test state shows `fillsPassword: false` for both tiles, and choosing Lena leaves the password field empty with focus in it. P5 and P8 still need the password typed from the letter and the handover note; the server is the gate.
- The validator change is sound. A capture route with the key missing still warns (a forgotten switch). With an explicit `false` the author has chosen the earned-source path, which is what the awareness labs and this scenario mean, so a warning there would only be noise. `true` stays silent as before. The unit test covers all three. No other scenario sets the key to `false`, and the side-by-side run shows no change elsewhere.

### R1 M2 (form then tiles): fixed

- While loading, `other` starts false: no form, no "Choose an account.", the block reads "Captured sign-ins / Checking..." above where the form will go. Live at 915x412: `formShown: false`, focus on `body`, no horizontal scroll. The builder's 390x844, 800x600 and 1400x1000 loading shots match; the frame wraps everything at each size.
- The list decides once. Tiles arriving: focus stays on `body`, no field focused (live and unit test). No captures: the form shows and Username takes focus at that moment (unit test; live in the failure path). Since no field is focused during loading, a phone keyboard cannot open then.
- The "typing" guard now counts focus in a field, and only when the player is already in the typed form.

### R1 m1, m2, n1, n2

- m1: with no captures the line sits below Sign in as one line, "Captured sign-ins: none yet." (shots `empty__915x412`, `empty__390x844`). The block moves above the form only when it holds tiles or is loading.
- m2: one loop over every `.signin-tile` asks `signInTileSelected`, which handles the PC's own tiles (`data-tile-index`) and captured ones (`data-capture-index`) separately. Live, choosing Lena marks only her tile.
- n1: `.signin-captured-item` is gone; nothing referred to it.
- n2: heading and "Checking..." centred over the row.

## New code: no new B or M

- Keyboard: unchanged from round 1. Enter and Esc are bound on the fields only, and the fields are hidden while loading, so neither does anything unexpected; the X closes the screen while loading (used live). Change still focuses the first tile.
- Selection: `signInTileSelected` gives the captured Other user tile `st.other`, and a captured account tile `!st.other && username === selected`. The keyboard's Other user still needs `signInTilesOffered()`, as before. No order dependence.
- `placeCapturedBlock` runs on build and on every list arrival, and moves the node only when its place is wrong, so bound listeners survive (it moves the same element).
- Sync size: no new player_state field, no new server answer. Unchanged from round 1.
- Merge b165f8fbb: slice 4's files (inventory, wearables, HUD, `ui-themes.css`) share no selector or module with the sign-in screen; nothing in the diff mentions sign-in, password or the monitor.

## Findings

### m1. "Checking..." has no upper bound, and the form waits for it

`unlock-system.js:353-354` (`remoteCapturedSignIns`), `state-sync.js:677`.

Before the list arrives the client runs `stateSync.syncConfirmed()` with its default 6 attempts (back-off waits 250, 500, 1000, 2000 and 4000 ms, so about 8 s plus six request times when the sync keeps failing), then `ApiClient.get('/capture_secrets')`, a `fetch` with no timeout. Round 1's screen showed the form during that wait; now the player sees only "Checking..." and the X. On a healthy server this is one round trip and the change is right. On a struggling one, a player with captures can stare at "Checking..." for 8 s or more. Sign-in needs the server anyway, so this is minor, but it is the one place where the fix makes a slow path worse.

Fix: cap the wait in `openRemoteSignInScreen` (for example, race the fetch against 3 s and call `setCapturedSignIns([])` when the cap wins), or pass `{ attempts: 2 }` to `syncConfirmed` here. The existing typing guard already lets a late list arrive without stealing the form. A unit test: loading, cap passes, form shown and focused.

## Nits

- **n1.** When `/capture_secrets` fails, the screen says "Captured sign-ins: none yet." though the player holds captures (live, shot `failed__915x412.png`). This predates the slice (round 1 said "None yet." in the same case). Say "Captured sign-ins could not be loaded." when the request failed, which needs `remoteCapturedSignIns` to tell a failure from an empty list.
- **n2.** `README_scenario_design.md` does not say that an explicit `"revealSecret": false` is the way to state "typed from the earned source" and silence the warning. One line beside the capture-route guidance would save the next author a round of reading the validator.
- **n3.** (Round 1 n3, still open.) At 390x844 the Other user tile wraps to four lines ("Other / user / type a / name") and stretches the row, leaving empty space under the two NPC tiles (`r1f2b0/shots/tiles__390x844.png`). The keyboard screen draws the same tile from the same module with the same wrap, so this is not a regression here. Rating: nit. It belongs to the UI session that owns the shared `.signin-tile` module (a shorter second line such as "type name", or `white-space: nowrap` with a smaller username line, fixes both screens at once). It should not be fixed in this slice, which would fork the tile's look.
- **n4.** When the tiles arrive, focus stays on `body`, so a keyboard player's first Tab goes to the start of the page rather than to the first tile. The local keyboard screen does the same on open, so this matches; if anyone changes it, change both in the shared module (focus the first tile when tiles are shown, not on touch).
