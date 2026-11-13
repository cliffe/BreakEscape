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
