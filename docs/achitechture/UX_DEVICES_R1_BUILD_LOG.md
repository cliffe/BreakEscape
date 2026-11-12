# UX devices R1: card copier, RFID doors, wearables, notebook

Branch build/ux-devices (from main 13a0f9f96). Before shots: ux-shots/main2, after shots:
ux-shots/after_devices (session scratchpad), each with manifest.json. Games: 1782 and 1787
(test_access_doors), 1783 (test_clone_left_card, created, not driven), 1784 (test_wearable),
1785 (test_access_social), all swapped onto test_access_social hosts on a keyless :3064 server.

## Findings

| # | Finding | Outcome |
|---|---------|---------|
| 1 | Copier breaks the pixel-art rule | Fixed. Square frame, 2px solid borders, hard 2px bevel, no soft shadow, no bold GNF, stepped animations, no scale pulse. Emoji replaced with inline pixel SVG icons drawn at whole-number scale (rfid-ui.js pixelIcon). The stray red bar (a 4px protocol colour stripe on centred text) is gone. Attack messages lost their emoji. |
| 2a | No confirmation after Save | Fixed. "Card copied" toast naming the card and the device once the copier closes. |
| 2b | At a door the copier opened on Read/Saved | Fixed. It opens on "At the reader: <sign>", listing every saved card (one press to emulate) and every held card (one press to tap). It does not mark which card the reader wants. A refusal returns to this screen. |
| 2c | "flipper" versus "Card copier" | Fixed. The device title, the world keycard menu ("Copy it with the card copier") and its hint take the rfid_cloner item's own name. |
| 2d | Visitor door needed the copier, role door opened at once | Intended, now explained by the toast. A requires door is checked on the client and goes through the copier; an access-list door is decided by the server from every card id held, copies included (access model 4.1). The server now answers with the passing card's id and the toast says "Opened with your copy of X" or "Opened with X". Option for the user: route access-list doors through the copier's reader screen too, so a copy always needs a press. |
| 2e | (found) the world keycard menu's copy sent no source | Fixed. It passes cloneSource { object_id }, so the server records the copy and it counts at access-list doors. |
| 3a | "Access denied" with no reason | Fixed. "None of your cards is cleared for this door. It opens only for staff with the right access." (or "for named people only" for a people list); no role or person named; lockedHint still appended. |
| 3b | "RFID lock unlocked!" names no card | Fixed. The reader result carries the card name and whether it was emulated. |
| 4 | Vest swaps the player for another character | Options. Costumes are whole-character sprites by design (player-costume.js, the wearable build log), so this is not a bug. A fix needs art: (a) a per-avatar costume map in scenario.disguises; (b) an overlay layer (vest-only frames) drawn over the player's own sprite; (c) keep it and say in the onWear text that the player now looks like a courier. |
| 4b | "(worn)" label tiny and covering the icon | Fixed. A tag above the slot, Press Start 2P at 8px, 2px border. |
| 4c | Hover caption stays on the jacket during the vest dialog | Fixed. The world caption is blank while a confirm, an action menu or a minigame is open. |
| 4d | X and Cancel on the confirm | Skipped: gameConfirm (notifications.js) belongs to build/ux-access. |
| 5a | Notebook opens on page 1 | Fixed. The tray notepad opens on the newest note added since it was last read, else the page last shown. Memory is client-only and never synced. |
| 5b | "Evidence: a colleague" | Engine default (social-intel.js subjectLabel when the subject is unnamed or has no social.people entry). The note title now uses the fact's authored label in that case. |
| 5c | (found) Notepad tray picture 404 | Fixed. The notepad item names sprite notes5. |
| 6a | HP hearts missing in test_wearable | Skipped: intended, "disableAttacks": true hides them (health-ui.js). |
| 6b | Door captions float away from doors | Skipped: not cheap in this round. |
| 6c | Reader icon drawn over the player's head | Skipped: the walk-behind depth convention at a back-wall door. |

Not in scope and unchanged: the minigame footer's Cancel under the copier (build/unlock-gaps-r1).

## Tests

Node (run without the lock, every file touching a changed module): rfid-door-screen (new, 8),
access-rfid-acl (24), action-menu (11), rfid-crypto-contrast (12), rfid-denial-hold,
rfid-clone-card, rfid-no-keycards-hint, rfid-flipper-back, rfid-dictionary-attack,
error-toast-floor, engine-fixes-pass3, notepad-start-page (new, 4), social-intel (10),
info-label-proximity, plus every test that imports inventory.js, interactions.js or info-label.js:
all pass. Rails: access_model_rfid_test.rb 32 runs, 0 failures (2 new cases for cardId).
Full suites not run (orchestrator runs them per merge batch).

Sync size: no synced state added. The notepad page memory is a module variable; the server's
cardId is one string on an unlock answer.

## R1 fixes (code review UX_DEVICES_CODE_REVIEW_R1.md)

Main (33c003230) merged in first, clean.

| # | Fix |
|---|-----|
| m1 | Orchestrator's ruling. The unlock answer names a card only when it is the player's own keycard (`cardId`). A passing copy answers `viaCopy: true` with no id, and the toast reads "Opened with a copied card." without saying whose: the client sends every held card id at once, so naming the copy would tell the player whose identity the list admits. `Game#rfid_unlock_card_answer` replaces `rfid_unlock_card_id`; its comment says why. The copier's own reader screen still says "Opened with your copy of X", because there the player picked the card. Finding 2d above is superseded on this point. |
| m2 | The notepad's page memory is recorded against the full notes list (`notepadMemoryFor`), so a search no longer makes the next open jump to the newest note. |
| m3 | Live proof on a keyless headless server on :3135 (setFPS(20), fixed steps on). Game 1816 (test_clone_left_card): the clerk left his card, the world card menu read "Copy it with the RFID cloner", Save posted /clone_card with `object_id: clerk_card_item` (200), and `serverClones` holds `clerk_card` with source `{ object: clerk_card_item }`. Game 1817 (test_access_doors): with the visitor card held and Dana's badge copied in conversation, the finance office opened on `card_ids` [VISITOR-07, FIN-DANA-01] with the toast "Opened with a copied card.". Shots 30 to 35 in ux-shots/after_devices. |
| m4 | inventory.js takes build/ux-access's exported `notepadItemData()` and its test in inventory-restore-sprite-image.test.mjs, both verbatim. A trial merge with build/ux-access is now clean. |
| n1 | Comment corrected (with m1). |
| n2 | Back, tick and cross are pixel icons in PIXEL_ICONS (`back`, `tick`, `cross`); no text glyph is left in rfid-ui.js (tested). The crack hint is 14px, not 0.85em (tested: no em font sizes in rfid-minigame.css). |
| n3 | The seven 8-space CSS indents fixed. |
| n4 | One name rule: rfid-ui.js puts `clonerNameInSentence` on window and action-menu.js reads it there (the module keeps no static imports); before rfid-ui loads it says "card copier". |
| n5 | test_clone_left_card brief, mission.json and dungeon_graph.md say "Copy it with the RFID cloner". Validator: 0 failures. |
| n6 | Rails cases added: a requires-only rfid door answers with neither `cardId` nor `viaCopy`; a UID-only copy at a lock without acceptsUIDOnly is refused with no card named; a copy answers `viaCopy` only. |

Tests (affected files only, no lock): access_model_rfid_test.rb 35 runs, 0 failures. Node:
access-rfid-acl 26, notepad-start-page 5, every file importing inventory.js (22 files, 357
tests), every file importing rfid-ui or action-menu, or reading rfid-minigame.css (127 tests),
notes-minigame importers (47 tests): 0 failures.

Sync size: unchanged. `viaCopy` is one boolean on an unlock answer, not stored.
