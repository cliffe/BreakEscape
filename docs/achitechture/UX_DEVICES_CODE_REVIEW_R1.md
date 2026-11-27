Counts: 0 blockers, 0 majors, 4 minors, 6 nits.

# UX devices: code review round 1

Branch build/ux-devices at ec58c7826, reviewed as `git diff main...build/ux-devices` (26 files).
Read with the build log (UX_DEVICES_R1_BUILD_LOG.md) and the after shots (19, 22, 29).

## What was checked

- Cheat policy: the new `cardId` on the unlock answer, the world-card `cloneSource`, the refusal wording.
- RFID minigame, door flow and clone saving, read in full around every changed call.
- Pixel-art rule on the redrawn copier, its CSS and the inline SVG icons.
- Trial merges (`git merge-tree`) against main (tip 72e26f911, already contains the merge base's
  successor), build/ux-access (3f450e01e) and build/unlock-gaps-r1 (06bd6885a).
- Sync size (q77).
- Tests: every node test file that imports a changed module or asserts on changed text (107 files),
  plus the Rails files for the unlock answer.

## Test results

- Node, without the lock: all 107 files that import rfid-ui, rfid-minigame, rfid-protocols,
  rfid-attacks, rfid-data, notes-minigame, unlock-system, inventory, interactions, info-label,
  social-intel or action-menu, or assert on the old wording: 0 failures. The new files pass:
  rfid-door-screen 8, notepad-start-page 4; access-rfid-acl 24, action-menu 11.
- Rails: access_model_rfid_test.rb 32 runs, 0 failures; unlock_response_filter_test.rb and
  flag_reward_unlock_door_test.rb 7 runs, 0 failures.
- Browser: not run in this review. The build log has shots for test_access_doors and the wearable
  scenario; test_clone_left_card was created but not driven (see m3).

## Cheat policy

- `cloneSource` on the world-card Copy menu (action-menu.js:84) adds no new power. It sends the
  same `{ object_id }` the keycard click already sends (interactions.js:1082), and
  `Game#clone_source_keycard` (game.rb:2308) still requires a held cloner, a keycard object with a
  card_id that is not `cloneable: false`, held or in a reachable room with every container above it
  unlocked, and records only that object's own card_id. A tampered client could already post any
  object_id to /clone_card; this change does not widen what it accepts.
- The refusal text (unlock-system.js `rfidAccessDeniedLine`) names no role or person. It does say
  whether the list is of roles or of named people, but the lock's `access` hash is served to the
  client unfiltered already (only `requires` is stripped, and not for rfid), so nothing new leaks.
- `cardId` does tell the player something new: see m1.

## Minors

### m1. The unlock answer's `cardId` tells the player which NPC's copy carries a withheld role

- Where: app/models/break_escape/game.rb:2219-2231 (`rfid_unlock_card_id`), games_controller.rb:954,
  unlock-system.js:1127.
- The code comment says the id "is one the client sent, so this tells it nothing new". The honest
  client sends every held card id in one request (`heldRfidCardIds`), so before this branch the
  player learned only that one of their cards passed. The server withholds NPC `role` from the
  client (`WITHHELD_NPC_KEYS`, game.rb:4699).
- Failure scenario: the player has copied the badges of Dana, Jake and Imran. A door's access list
  holds the role "finance". The door opens with "Opened with your copy of Dana's badge.", so the
  player now knows Dana is in Finance, a fact a social-intel puzzle may want them to earn (an
  evidence fact, a knowledge check in ink, a debrief question). For a people list it confirms
  that this NPC is named on it.
- Why only minor: no lock opens that would not have opened, and the same fact can be found slowly
  by honest play (copy one badge at a time and try the door) or by a tampered client sending one
  id per request. It is a design question, not a server-secret breach.
- Fix (needs a user call): either (a) keep it and correct the comment and the build log to say it
  names the passing card among those held; or (b) return `cardId` only when the passing card is the
  player's own keycard or the only card sent, and otherwise toast "Opened with one of your cards.";
  or (c) drop `cardId` and route access-list doors through the copier's reader screen, the option
  the build log already offers, so the player picks the card and learns only by trying.

### m2. A notebook search resets the remembered page, so the next open jumps to the newest note

- Where: public/break_escape/js/minigames/notes/notes-minigame.js:361-365 with `searchNotes` at 451.
- `updateDisplayedNote` records `seenCount = this.collectedNotes.length` and
  `lastIndex = this.currentNoteIndex`. While a search is active, `collectedNotes` is the filtered
  subset, so both are recorded against the filtered list.
- Failure scenario: 12 notes; the player searches "badge" (3 matches), reads match 2, closes the
  notepad. `seenCount` is 3, so on the next open `notepadStartIndex` sees 12 > 3 and opens on note
  12, as if a new note had arrived. A `lastIndex` of 1 from the filtered list would also point at
  the wrong note in the full list.
- Fix: record against the full list: `seenCount = window.gameState?.notes?.length ?? 0`, and map the
  shown note back to its index in `gameState.notes` (by id or identity) before storing `lastIndex`.
  Add a case to notepad-start-page.test.mjs (or a small harness test) for a filtered view.

### m3. The `cloneSource` fix and the "Opened with your copy" toast have no live proof

- Where: action-menu.js:81-85; unlock-system.js:1127; build log "1783 (test_clone_left_card,
  created, not driven)".
- The node test proves the menu passes `{ object_id: 'clerk_card_item' }`. Nothing proves the live
  path: the world sprite's `scenarioData.id` reaching /clone_card, the server answering
  `recorded: true`, and then an access-list door opening on that copy with the right toast. Helper
  tests have passed while the real path broke before (bootstrap filter, doors.js).
- Failure scenario: the world keycard sprite's scenarioData carries a runtime id rather than the
  scenario id in some load path; /clone_card answers 403 "Keycard not within reach", the copy stays
  client-only, and an access-list door refuses it. The tests would stay green.
- Fix: one browser run on test_clone_left_card (Copy from the action menu, then check
  `player_state.serverClones` has `clerk_card` with source `{ object: "clerk_card_item" }`), and one
  on test_access_doors opening a role door with a copy and reading the toast. test-rfid as the
  regression for the reader screen (emulate, refusal, return to the reader screen).

### m4. Merge conflict in inventory.js with build/ux-access (the Notepad tray picture)

- Where: public/break_escape/js/systems/inventory.js:1163-1172 (this branch) against ux-access's
  `notepadItemData()`.
- Both branches give the notepad `sprite: 'notes5'`; the trial merge conflicts on the literal block.
- Which should win: build/ux-access. Its `notepadItemData()` is exported, and
  inventory-restore-sprite-image.test.mjs (ux-access, line 195) checks it through `trayImageKey`.
  This branch only has a source regex in notepad-start-page.test.mjs:1128, which still matches
  `sprite: 'notes5',` inside `notepadItemData()`, so it needs no change.
- Resolution: take the ux-access side (`const notepadData = notepadItemData();`) and drop this
  branch's literal. Then run notepad-start-page and inventory-restore-sprite-image.

## Nits

- n1. game.rb:2220-2222: the comment "so this tells it nothing new" is wrong (see m1); fix it
  whichever option is chosen.
- n2. rfid-ui.js:371, 423, 482, 710, 1061 and 1082: the copier still draws text glyphs for "←",
  "✓" and "✗" at 72px. Shot 22 shows GNF draws "✓" as pixels, so it may be fine, but check "✗" and
  "←" are in GNF rather than a fallback smooth font; if not, add `tick`, `cross` and `back` to
  PIXEL_ICONS. rfid-minigame.css:499 sets the crack hint to `0.85em` (13.6px), a fractional size for
  a pixel font; use a whole size.
- n3. rfid-minigame.css:55, 85, 144, 296, 336, 415, 469: lines left at 8-space indent where
  `font-weight: bold` was removed above them. Cosmetic.
- n4. action-menu.js:34 `clonerLabel` duplicates rfid-ui.js `clonerNameInSentence` (the comment
  says why). Fine for now; if action-menu gains imports later, use the one helper.
- n5. scenarios/test_clone_left_card/scenario.json.erb:4 (and its mission.json and dungeon_graph.md)
  still tell the tester the menu says "Clone it with the flipper". Update to "Copy it with the RFID
  cloner" (that scenario's cloner name).
- n6. Tests: no Rails case that a `requires`-only rfid door (no access list) answers without
  `cardId`, and none for a UID-only copy at a lock without `acceptsUIDOnly` (it shares
  `rfid_passing_card_id`, so the risk is low). Add both to access_model_rfid_test.rb.

## Pixel-art rule (copier and icons)

- Frame: square corners, 2px solid outline, 2px inset bevel with no blur, no clip-path, no
  border-radius, no soft shadow; the 1px borders on the crypto badge and sector cells are now 2px.
  The wave rings are square and step in whole pixels (20, 36, 52, 68, 84px). Transitions are stepped.
- Icons: `pixelIcon` rounds the scale to a whole number, sizes the SVG at width x scale, uses
  `shape-rendering="crispEdges"` and `image-rendering: pixelated`; every call uses 2, 3, 4 or 5.
  The rows of every icon are even (tested).
- Worn tag (hud.css:440-457): 2px border, Press Start 2P at its native 8px. `top: -16px` clips under
  an 80px strip, but every game page sets `data-ui-theme`, which makes the strip 108px; shot 29 shows
  it whole.
- The remaining `rgba` in rfid-minigame.css is on the scrollbars and the overlay, unchanged here.
- Leftovers: n2.

## Merges

- main (72e26f911 is in main): clean.
- build/ux-access: one conflict, inventory.js (m4). Toasts: this branch only calls
  `window.gameAlert(message, type, title, duration)`, which keeps working with ux-access's queue
  (the new `options` argument defaults). `worldCaptionCovered` looks for `.game-confirm-overlay`;
  ux-access's notifications.js still uses that class. No overlap in container code.
- build/unlock-gaps-r1: clean (games_controller.rb, game.rb and unlock-system.js auto-merge; its
  unlock-system change is in the cryptex and combination cases). Its footer change makes
  `.minigame-controls` static under the game area. The copier frame is a fixed 550px; after the
  merge, look once at the copier on a short window (about 720px) to see the Cancel row is not
  pushed off screen. ux-access and unlock-gaps-r1 conflict with each other in
  password-minigame.js, which this branch does not touch.

## Sync size (q77)

- No player_state field added. The notepad memory is a module variable, never synced.
- `cardId` is one string on an unlock answer, not stored.
- The `cloneSource` fix means a world-card copy now writes `serverClones[card_id]`. That map is keyed
  by card_id and overwritten, so it is bounded by the number of keycards the scenario defines; each
  /clone_card call sends one card_id and one source id.
