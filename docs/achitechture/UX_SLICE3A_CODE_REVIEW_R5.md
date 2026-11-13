Counts: blockers 0, majors 0, minors 1, nits 3

# UX feedback round, slice 3a: code review R5 (final)

Branch `build/ux-copier` at 16e4c56b5. Reviewed: the R4 fix commits 42ddbc91a (CSS, `rfid-ui.js`, tests) and 16e4c56b5 (build log), the "R4 fixes" section of `UX_SLICE3A_BUILD_LOG.md`, and the slice against R1 to R4. R4: `UX_SLICE3A_CODE_REVIEW_R4.md`.

Live: keyless server on :3329 from this worktree, physics at setFPS(20) with fixed steps on (`smoothStep` off, `minFps` 1), scrollbars shown (Playwright's `--hide-scrollbars` default dropped), stopped at the end. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`:

- 2591, 2592, 2593, 2594: the review-page flow (main2-16 to main2-23) at 1400x1000, 800x600, 915x412 and 390x844, one game per size, so each size opens the visitor room door itself.
- 2595: held card copy, tray menu, tap list, 12 saved cards at four sizes, MIFARE Classic (Crack keys first, protocol screen, Back, dictionary attack, Save), DESFire (Save UID), Abandon at 390x844, Enter and Esc.
- 2596: NPC badge copy (Dana) at 915x412: Esc, Abandon and Save, each back to the chat hub.
- 2612: the door reader with 12 saved cards at 915x412 and 390x844, a wrong card, the denial, then the right card.

The MIFARE and DESFire cards were opened with `startRFIDMinigame` in clone mode, as `interactions.js` does for a world card, because `test_access_doors` has none. The extra 11 saved cards were pushed into the copier's local list (display only). Shots: session scratchpad, `ux-shots/slice3a-final/`, 85 PNGs.

## Live checks

### Every flow end to end

| Flow | Result |
|---|---|
| World card copy | Copy or Take menu with icons; reading; result with Save and Abandon read in the footer at all four sizes, no scroll; a real click on Save posted `clone_card` (`object_id: visitor_card`, 200); "Card copied" toast in the world. |
| Door read and emulate | At the visitor room reader the copier opens on "RFID > Reader"; a real click on the saved card shows "RFID > Reader > Emulating" with "Emulating..." in view at every size; Access Granted at about 1.5 s; one `POST unlock` (`visitor_room`, `method: rfid`, 200); `card_emulated` true; `enterRoom('visitor_room')` goes through. All four sizes. |
| Held card copy | Took the visitor card, then copied it from the tray: same read and result screens, Save posted `clone_card` (200). With that card held, the door opens by a tap and the copier does not open (expected). |
| NPC badge copy | Dana, 915x412: Save in the footer with no scroll; a real click posted `clone_card` with `npc_id: dana` (200); the chat came back on its hub with the same three choices. Esc and Abandon read also came back to the hub, with no request. |
| Tray copier menu | "RFID" with Read and Saved; footer hidden. |
| Saved list, details, Emulate | List, then details with "> Emulate" and Back in the footer; Back returns to the list; Emulate from the tray gives "No reader here" as before. |
| Tap list | "RFID > Read" with Back in the footer. |
| Protocol screen | "RFID > Info" with Back and Abandon read in the footer. Back returns to the read with "Crack keys first". See m1. |
| Crack keys first (MIFARE Classic, default keys) | Footer shows "Crack keys first" and "Abandon read"; it opens the protocol screen; the dictionary attack shows its result with the footer hidden, then the read screen with Save; Save closes the copier. |
| Save UID (DESFire) | Footer shows "Save UID" and "Abandon read"; Save UID saves and closes. |
| Abandon | A real click on "Abandon read" at 390x844 closed the copier with no request. |
| Wrong card at a reader | Emulating, then the refusal with the footer hidden; a tap on it returns to the reader list. |

### Footer swaps

Measured on every screen (computed `display` of `.flipper-footer`, its children, and every control in it hit at its own centre with no scroll):

| Screen | Footer |
|---|---|
| Copy result (EM4100) | Save, Abandon read |
| Copy result (MIFARE keyless) | Crack keys first, Abandon read |
| Copy result (MIFARE cracked) | Save, Abandon read |
| Copy result (DESFire) | Save UID, Abandon read |
| Saved list, tap list | Back |
| Details | > Emulate, Back |
| Protocol | Back, Abandon read |
| Menu, reading, reader, emulating, success, attack result, refusal | hidden (`display: none`, 0 children) |

No stale control at any step: after Save (success screen), after the dictionary result, after Back from the protocol screen, after Back from details, and after the refusal, the footer holds only what the new screen put there. `freshScreen()` empties it on every view.

### Long saved list (12 cards)

| Size | Saved list body (scroll height in client height) | "More below" at top | After wheel to the end | Card 12 hit |
|---|---|---|---|---|
| 1400x1000 | 598 in 430 | shown | hidden | yes |
| 800x600 | 598 in 400 | shown | hidden | yes |
| 915x412 | 598 in 212 | shown | hidden | yes |
| 390x844 | 598 in 554 | shown | hidden | yes |

The door reader with 12 cards: 677 in 252 at 915x412 and 677 in 594 at 390x844, cue shown, hidden at the end, card 12 hit. One scroll area per screen and one scrollbar, so dropping the list's own scroller does no harm: before R4 the list scrolled inside a body that could also scroll, two bars in one screen. Back from details and the return after a refusal both put the list back at its top (n3).

### Scrollbar and cue

The scrollbar is 14px wherever the body overflows and absent where it fits (0px). Track #1a1a1a with a 2px #4d4d4d left edge, thumb #4d4d4d with a 2px orange edge, no arrow buttons: pixel art. "More below" is a flat strip with the stepped arrow, shown exactly where the body runs on (copy at 800x600 and 915x412; details and emulating at 915x412; every long list) and hidden once scrolled to the end.

### Keyboard

- Esc closes the copier from the copy result, tap list, saved list (four sizes), reader, and the cracked MIFARE read; from an NPC copy it returns to the chat hub. No request is sent.
- Enter does nothing on any screen tested (held reading, copy result, menu, tap list, saved list, details, reader, refusal, MIFARE result, protocol, NPC copy): the breadcrumb, footer and minigame stay the same, and nothing reaches the world (no interaction menu, no room change). See n1.

### Look

The stepped corners, the outline and the two bevel layers are as in the R3 shots and as the user asked in main2-17 and main2-22. Corner check: 57 frame shots across all four games, every pixel in the frame's four 12px corner squares is a palette colour or the backdrop, 0 blends. Frame on whole pixels and inside the window at every size and screen; the X is clear of the frame and hit. See n2 for the footer controls on the orange body.

## R1 to R4: regressions

None. Frame sizes match R4's table (1400x1000: 480, 205, 440, 590; 800x600: 180, 20, 440, 560; 915x412: 238, 20, 440, 372; 390x844: 16, 65, 358, 714). No `#minigame-cancel`. Emulation hold about 1.5 s with the reader breadcrumb. Listeners: 3 `resize` and 1 ResizeObserver in the world, the same after every run. Status lines ("Emulating...", the read status) in view at every size. Save and Abandon in view at 915x412 with no scroll (R4 m1).

## Tests

Every `test/js` file that imports the rfid code (no lock, test lock rule): 16 files, 158 tests, all passing. `rfid-door-screen` 28/28.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. On the protocol screen the one action (the attack, "Read & Clone" or "Save UID Only") is below the fold at every size, while Back and Abandon read sit in the footer.** `public/break_escape/js/minigames/rfid/rfid-ui.js:905` (`screen.appendChild(actions)`, after the header, note and card data) against `:906` (`this.addToFooter(backBtn, abandonBtn)`).

What breaks: on a keyless MIFARE read the player presses "Crack keys first" and lands on a screen whose visible controls are Back and Abandon read. "> Dictionary Attack (instant)" is under the card data: body 480 in 392 at 1400x1000 and 480 in 174 at 915x412, and the measure found it outside the visible body at both (`protocol-screen-1400x1000.png`, `protocol-screen-915x412.png`). Before R4 the body had the full 496px at 1400x1000 and the attack showed; the footer now takes about 80px, so this is a side effect of the R4 change, and the one screen where the R4 m1 rule (main action shown without scrolling) does not hold. The cue shows, so it can be found, which keeps it a minor.

Fix: put the protocol actions in the footer above Back and Abandon read (`this.addToFooter(actions, backBtn, abandonBtn)`, dropping `actions.style.marginTop` at `:802`), or move `actions` before the card data. Test: on the protocol screen for each protocol, the action entries sit in `.flipper-footer`; live, the attack entry is hit at its centre with no scroll at 1400x1000 and 915x412.

### Nits

**n1. Enter does nothing anywhere in the copier.** `public/break_escape/js/minigames/rfid/rfid-ui.js:404`, `:195`, `:210`, `:589` and `backButton` at `:111`: menu entries, card entries, "> Emulate" and Back are `div`s with no `tabindex` and no key handler, and nothing takes focus when a screen opens. Save and Abandon read are `button`s but are not focused; Tab goes to the X first. Older than this slice and not a regression; Esc and the X work everywhere. Fix: give the footer's first control focus on each view (or `tabindex="0"` on the role="button" divs with an Enter and Space handler), so Enter does the screen's main action.

**n2. The footer controls lose their surface on the orange body.** `public/break_escape/css/rfid-minigame.css:334` (`.flipper-button`, orange fill) and `:220` (`.flipper-footer`, no background). Save is now orange on orange, set apart only by its 2px dark outline, and "> Emulate" is a grey screen entry sitting on the shell (`main2-17-copier-read-result-1400x1000.png`, `main2-21-saved-card-details-1400x1000.png`). It reads, but the primary action looks emptier than Abandon read beside it. Fix: give Save a darker fill or the light bevel colour (#ffb366) with dark text, and style "> Emulate" in the footer as a `.flipper-button`.

**n3. Back from a card's details, and the return after a refusal, put a long list back at its top.** `public/break_escape/js/minigames/rfid/rfid-ui.js:339` (`freshScreen` sets `scrollTop = 0` on every view). With 12 cards at 915x412, picking card 12, then Back, shows cards 1 to 3 again; the same at the reader after a wrong card. Fix: keep the list's scroll position on the renderer when leaving the saved list or reader list, and restore it when the same list is shown again.

## Outside the slice

- The tray copier's "Read" says "No keycards in inventory" while a keycard is held (`tap-list-1400x1000.png`): `interactions.js:1251` opens it with `availableCards: []`. Older than this slice; not counted.
