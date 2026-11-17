# UX slice 2b, phase 0: build log

Branch `build/ux-slice2b0` (from main 2f5471209). Engine paths below are under `public/break_escape/`.

Fresh-look critique entry E01 (and E02): the remote sign-in screen showed bare Username and Password fields with the captured sign-ins as plain text buttons, so remote sign-in broke the rule of one shared sign-in module with headshots. Local sign-in, Switch user and the kiosk already used it (slice 2a), inside the PC monitor frame (slice 2c).

## What changed

| Part | Change | Files |
|---|---|---|
| Tiles | The remote screen's Captured sign-ins are the shared `.signin-tile` account tiles, under a "Captured sign-ins" heading on its own line, followed by an Other user tile. Each tile has the 64px portrait, the name and the username. The tiles sit above the form, where the PC's own tiles sit at the keyboard. | `js/minigames/password/password-minigame.js` (`capturedListHtml`, `capturedTiles`, `bindCapturedSignIns`) |
| Names and headshots | No new data. A tile's name and picture come from the NPC record the client already holds (`npcRecordFor` by the capture's target id, else its username). The picture is drawn by `applyTilePortrait` with the same order as the local tiles: the authored `<key>_headshot.png`, else the talk-sheet crop, else initials. A capture with no NPC record shows its role label and initials. The role label stays in the tile's tooltip. | same |
| Behaviour | The same flow as the keyboard. With captures, the screen opens on the tiles ("Choose an account."). A captured tile chooses that account: the chosen line with its headshot, the Password field, filled only when the server served the password, as the text buttons did. Other user shows the Username and Password fields. At x2 and in a short window the tile row (and its heading) folds once an account is chosen, and Change brings it back. With no captures, or while `/capture_secrets` is still loading, the typed form shows at once with "Checking..." or "None yet." under the heading. Captures that arrive after the player has started typing leave the typed form alone. Sign-in sends the chosen tile's username; the server checks are unchanged. | same, `css/password-minigame.css` |
| Frame | The remote screen was already in the slice 2c PC monitor frame (it uses `mountPcMonitor` like the local screen); nothing changed there. | none |
| Test scenario | `test_access_networks` gets two lobby cards, "Capture card: Lena" and "Capture card: Ian". Reading one sets `capture_card_<npc>`, and an `addCapture` event mapping on that NPC records a credential capture. Both NPCs carry `captureProof: planted kit_dropbox on comms_port`, so a capture is served only once the drop box is in the comms room. `social.captures.revealSecret` is on, so a captured tile fills the password. Ian's account is not admitted on Lena's PC, so his tile gives the wrong-account refusal. | `scenarios/test_access_networks/scenario.json.erb`, `PLAYTEST.md` |

Pixel art: the tiles reuse the monitor's tile look (2px edges, flat fills, the OS accent on the chosen edge), pixel fonts, headshots at whole scales.

## Sync

Client display only. No player_state field, no change to what the server sends: `/capture_secrets` answers as before (`accounts`, `secrets`), and the names and headshot keys come from the NPC records already in the bootstrap. The test scenario's two globals are booleans set once.

## Tests

- `test/js/password-signin-mode.test.mjs` (58 pass): captured tiles replace the text buttons; the label names a tile with no NPC record; tiles come first, above the form; a tile chooses its account (no Username field, password only when served); Other user and Change; the NPC record names the tile and gives the authored headshot (also on the chosen line); a tile signs in with its own username, not a typed one, and a `not_permitted` refusal keeps the tile chosen; late captures with nothing typed show the tiles; a player already typing keeps the form; no captures shows the heading, "None yet." and the form.
- `test/js/pc-monitor-frame.test.mjs` (40 pass): the captured tiles sit in the monitor's screen with a 2px edge, before and after the list arrives.
- Importers and scenario readers run alone: `access-remote-signin` 15, `access-signin-routing` 23, `format-8a-reader-parity` 9, `dungeon-graph-networks` 52, `toast-once-across-panel-handover` 6, all pass. Rails `sync_payload_size_test.rb` and `format_8a_corpus_test.rb`: 27 runs, 0 failures (the bootstrap payload limit for this scenario still holds).
- Validator on `test_access_networks`: 0 errors, 7 warnings (the same 7 as main).

## Live proof

Keyless server on :3060, new games of `test_access_networks`, headless shell with scrollbars shown (15px measured on the phone context). Game 3174 at 1400x1000 (the monitor at x2), game 3175 at 390x844 with DPR 3 and touch. Each run: take the drop box, read both capture cards (`se_captures` holds `lena` and `ian`), plant the box, open Lena's PC from the drop box view.

Before (main 2f5471209, from the critique sweep): `pc-remote-signin__1400x1000.webp`, `pc-remote-signin__390x844.webp`, `pc-remote-signin-wrong__*.webp` in the sweep's shots folder.

After, in the session scratchpad `ux2b0/shots/`, each at `__1400x1000` and `__390x844`:

- `tiles`: Lena Fox and Ian Shaw with their authored headshots, then Other user; "Choose an account."
- `ian-chosen`, `ian-refused`: Ian's tile chosen (headshot on the chosen line, password filled), Sign in refused with "This account can't sign in on this PC."; the tile stays chosen.
- `other-user`: the typed Username and Password fields.
- `lena-chosen`, `lena-signed-in`: Lena's tile signs in; her remote desktop opens (session `lfox`, `remote: true`, foothold `jack_comms_port`).

No scroller inside the monitor and no horizontal overflow in any shot (measured in each run).

## Left for the q92-dependent part

- Showing the target PC's own account tiles over the network (the PC's `loginPicker` stays ignored for a remote screen; `picker: false` and `tiles: []` are still passed by `openRemoteSignInScreen`).
- Any policy field for what a remote screen may show.

## Round 1 fixes

Review: `UX_SLICE2B0_REVIEW_R1.md` (B 0, M 2, m 3, n 4).

**Merge.** main f956f5355 merged into the branch (b165f8fbb), no rebase. No conflicts.

**M1, revealSecret.** `test_access_networks` no longer reveals captured secrets: `social.captures.revealSecret` is now `false`. The two lobby capture cards stay, so the tiles still have something to show. A captured tile fills only the username, and the password is still typed from its earned source: P5 still needs the letter, P8 still needs the handover note. `/capture_secrets` returns an empty `secrets` map with the flag off (`Game#capture_secrets_for_client`), so no password can fill unless an earned source served it. Live, every run's test state shows `fillsPassword: false` for both tiles and an empty password field once a tile is chosen. PLAYTEST.md says so.

Validator: 0 ❌, and the same 7 warnings as main. Removing the flag outright brought in two new warnings ("NPC 'lena' / 'ian' has a capture route ... but social.captures.revealSecret is not set"). These are not the forged-capture warnings that `captureProof` covers; they flag a missing switch. The validator now warns only when the key is absent, so an explicit `revealSecret: false` counts as a choice and is not warned about (`scripts/validate_scenario.rb`, test in `validator-access-model.test.mjs`). No other scenario sets the key to false, so no other output changes.

**M2, loading.** While `/capture_secrets` loads, the remote screen shows the heading with "Checking..." under it: no form, no "Choose an account." line, and no focus on any field (`other` starts false). When the list arrives the screen decides once: the tiles, or with none the typed form, which takes focus at that point. A player already in the typed form keeps it, and focus in a field now counts as typing. Tests: no focused field while loading; tiles arriving leave no field focused; an empty list shows the form and focuses Username only then; focus with nothing typed keeps the form.

**m1, empty state.** Kept the line and moved it below the form, as one line: "Captured sign-ins: none yet." The form comes first, and the line still tells the player that captured sign-ins exist and will show up here, which the form alone does not. The block moves above the form while it is loading or holds tiles (`placeCapturedBlock`, `data-state` on the block).

**m2, selection.** One loop over every `.signin-tile` asks `signInTileSelected`, which owns the rule for both the PC's own tiles and the captured ones. Nothing depends on loop order now.

**m3, live proof.** Keyless server on :3060, new games of `test_access_networks`, scrollbars shown (15px measured in each run), physics `setFPS(20)` with fixed steps. `/capture_secrets` held back 6 s by wrapping `ApiClient.get` in the page, so the loading state could be shot. Games 3205 (800x600), 3197 (915x412, DPR 3, touch), 3198 (1400x1000), 3199 (390x844, DPR 3, touch). States: `empty`, `loading`, `tiles`, `lena-chosen`, `ian-chosen`, `ian-refused` (Ian's password typed as if read from the handover note; "This account can't sign in on this PC."). Shots in the session scratchpad `r1f2b0/shots/<state>__<size>.png`. Measured in every shot: no scroller inside the monitor, nothing outside the screen area, no horizontal page scroll; focus on `body` in loading and tiles, on Username in empty, on Password once a tile is chosen.

**Nits.**
- n1: `.signin-captured-item` removed from `css/network-view-minigame.css`.
- n2: the "Captured sign-ins" heading and "Checking..." are centred over the tile row.
- n3: left. At 390x844 the Other user tile wraps to four lines and stretches the row; the keyboard screen does the same, so it belongs to the shared tile module.
- n4: at 800x600 (scale 1, no `data-short`) the tile row stays visible after a tile or Other user is chosen. Nothing folds there, as on the keyboard screen; this is expected, not a missed fold.

**Tests.** `password-signin-mode` 61 pass. Every JS test that imports `password-minigame.js`, the two CSS files, `test_access_networks` or `validate_scenario.rb` (76 files): 1183 pass, 0 fail. Rails `sync_payload_size_test.rb`, `format_8a_corpus_test.rb` and `scenario_schema_test.rb`: 37 runs, 0 failures.

## Round 2 minors

Review: `UX_SLICE2B0_REVIEW_R2.md` (0 B, 0 M, 1 m, 4 n). Main merged first as 50fc4f9ed (`git merge da5f53f34`, no rebase, no conflicts). Fixes in 4cc63ae42.

- m1: the remote screen's wait for its Captured sign-ins is capped at 3 s (`REMOTE_CAPTURES_WAIT_MS` in `unlock-system.js`). The sync wait and the fetch are unchanged; when the cap passes first, the screen gets an empty list marked as still on its way, so the typed form shows and Username takes focus once, as for an empty list, with the line "Captured sign-ins: still checking." below the form. A list that arrives later adds its tiles through a quiet redraw that moves no focus and does not scroll. A player still in the form keeps it (the existing typing guard); one who left the form gets the tiles. An answer inside the cap clears the timer, so the screen fills once.
- n1: `remoteCapturedSignIns` now tells a failed `/capture_secrets` from an empty list, and the line reads "Captured sign-ins could not be loaded."
- n2: one bullet in `README_scenario_design.md` beside the capture-proof guidance: the server serves a captured password only with `revealSecret: true`, and an explicit `false` is a deliberate choice that silences the capture-route warning.
- n3, n4: left, as the review asks (both belong to the shared tile module).

**Tests.** `access-remote-signin` 17 pass (2 new, fake timers: the cap at 3000 ms, a late list after it, an answer inside the cap filling once, a failed fetch). `password-signin-mode` 64 pass (3 new: focus once at the cap and none while waiting, late tiles moving no focus, a player who left the form getting the tiles, the failed line). Every JS test file that imports `unlock-system.js` or `password-minigame.js` (43 files): 589 pass, 0 fail.

**Live.** Keyless server from this worktree (on :3062, the port in the copied review harness; :3060 was free and unused), new game 3220 of `test_access_networks`, 915x412, DPR 3, touch, scrollbars shown (15 px measured). Both cards read, box planted, then a page-level wrapper made `/capture_secrets` answer 7 s late. A 50 ms poll in the page measured: "Checking..." with no form and no field focused; the form shown 3010 ms after "Checking..." appeared, with focus in Username and the line "still checking."; the two tiles arrived at 7122 ms with focus still in Username. In this short window the typed form keeps the tile row folded behind Change, as it does for any chosen form there. With the wrapper made to throw, the screen showed the typed form and "Captured sign-ins could not be loaded." No horizontal scroll. Shots `r2m2b0/shots/r2-{loading,capped,late-tiles,failed}__915x412.png` in the session scratchpad. Server and browser stopped afterwards.
