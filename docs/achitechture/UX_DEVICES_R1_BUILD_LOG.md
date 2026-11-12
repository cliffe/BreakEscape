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
