Counts: blockers 0, majors 1, minors 0, nits 2

# UX feedback round, slice 3a: code review R3

Branch `build/ux-copier` at c2696ebda. Reviewed: the R2 fix commits 5aea57749 and d50e85e53, the "R2 fixes" section of `UX_SLICE3A_BUILD_LOG.md`, and the slice as a whole against `build/ux-feedback` (6290be45c). R2: `UX_SLICE3A_CODE_REVIEW_R2.md`.

Live: keyless server on :3325 from this worktree, physics at setFPS(20) with fixed steps on, stopped at the end. New games, each `test_access_doors` swapped onto a `test_access_social` host with `tools/playtest/swap-scenario-game.rb`: 2473 (sizes and corners), 2474 (close paths, race, restart, cycles, emulate), 2489 (every entry path), 2492 (copy screen at short sizes), 2494 (candidate fix for M1, injected CSS), 2502 (320x568). Games 2472 and 2483 were early runs of the entry-path script with a wrong bridge call. Shots in the session scratchpad, `ux-shots/slice3a-r3/`.

## `this.params = params` removed: every reader traced

The base constructor (`base-minigame.js:16`) stores the object it is given. `RFIDMinigame` now passes `{ ...params, title, showCancel: false, requiresKeyboardInput: false }` and keeps it. That object holds every caller key unchanged; only `title`, `showCancel` and `requiresKeyboardInput` differ from the caller's own object. No caller sets any of those three. Nothing in `rfid-minigame.js` or `rfid-ui.js` writes to `this.params`, and no caller changes its params object after the start, so losing the identity with the caller's object changes nothing.

Readers, and what each got live (game 2489, keys of `currentMinigame.params` read in the page):

| Reader | Path | Live |
|---|---|---|
| `rfid-ui.js:178` `readerName` | door (`unlock-system.js:1109`) | "At the reader: Visitor room" |
| `rfid-ui.js:182`, `:382` `availableCards` | door, inventory | door lists the saved cards; tray copier opens on its menu |
| `rfid-ui.js:242` `cardToClone` | world copy (`action-menu.js:98`), held card (`interactions.js:1076`), NPC (`chat-helpers.js:432`) | each reads its card: "Visitor card 07" (world and held), "Dana Reyes's badge" (NPC) |
| `rfid-minigame.js:184` `onRefused` | door | Dana's copy emulated at the visitor room: `card_emulated` false, then `door_unlock_failed` `wrong_card` |
| `onComplete` (`minigame-manager.js:274`) | door | Visitor copy emulated: one `POST unlock` for `visitor_room`, `method: rfid`, `card_emulated` true (game 2474) |
| constructor `mode`, `cloneFrom`, `cloneSource`, `hasCloner`, `requiredCardIds`, `acceptsUIDOnly` | all | read from the caller's params as before; `clone_card` posts carry `object_id` (world), `npc_id: dana` (NPC) |
| base `showCancel`, `cancelText`, `disableClose`, `headerElement`, `title` | all | no `#minigame-cancel` on any path; X and Esc wired |
| `minigame-manager.js:98` `requiresKeyboardInput` of a suspended parent | none | the copier never suspends itself for a child |
| `minigame-manager.js:382` restart | forced restart at the door | reopens on "RFID > Reader" with every key; the constructor recomputes the three it sets |
| `workstation-state.js:167`, `npc-needs.js:4978` object match | none | they scan param values for an object id; the three new keys hold strings and booleans |
| `test-bridge/index.js:378` `params.lockable` | none | `startRFIDMinigame` never put `lockable` in params, before or after |

One visible change: the bridge snapshot (`base-minigame.js:246`) now reports the copier's title as "RFID Reader" or "Cloning Card..." instead of null. The header stays hidden (no `headerElement`), so the player sees no change. This is not a finding.

The NPC path ran end to end: choose the scan line, the copier opens after the line, Save posts `clone_card` with `npc_id`, the chat comes back on its hub, and the exit line closes it.

**Test stubs.** The five changed stubs now set `this.params = p` in the constructor, which is what the real base does at `base-minigame.js:16`. `rfid-clone-card` and `f18-toast-flag-rfid` already did. Two of them also set `this.gameContainer = c`, where the real base sets `this.container` and finds `gameContainer` in `init()`. That shortcut is older than this slice and stands in for the stubbed `init()`. The stubs are not bent to pass.

## No Cancel button; X and Esc; stale timer

No `#minigame-cancel` on the world copy, NPC copy, held-card copy, door reader or tray copier. Emulate at the visitor reader, then close 0.3 s into the hold by the X, by Escape and by a forced close (`MinigameFramework.forceCloseMinigame()`). Each time I reopened the reader and waited 2.6 s. It stayed on "RFID > Reader", with no `card_emulated` and no unlock request. A normal Emulate afterwards gave one `card_emulated` (true) and one `POST unlock` (`visitor_room`, `rfid`).

## X against the frame

The X never meets the frame, on the reader screen or the copy screen:

| Size | Frame (y, height) | X bottom | Gap |
|---|---|---|---|
| 1400x1000 | 205, 590 | 45 | 160 |
| 800x600 | 20, 560 (reader); 12, 577 (copy) | 45 | X is 135 px right of the frame |
| 915x412 | 20, 372 (reader); -82, 577 (copy) | 45 | X is 192 px right of the frame |
| 390x844 | 65, 714 | 45 | 20 |
| 375x667 | 53, 562 | 45 | 8 |

At wide sizes the X sits beside the frame, never over it. See M1 for the copy screen at 915x412.

## Bevel, observer, phone height rule

- **Child bevel:** at all four corners, at 1400x1000, 800x600, 915x412, 390x844, 375x667, 320x568 and 360x640, every pixel inside the steps is one of the four palette colours, with no blends. The bottom-right corner is clean. Where light meets dark (top right and bottom left), the corners show both bevels side by side with small jogs. See n1.
- **ResizeObserver:** live counts from page start (`resize` listeners and live observers) were 3 and 1 in the world and 4 and 2 with the copier open, on every path. They went back to 3 and 1 after: Save (world copy), Save (NPC copy, back in the chat), a successful Emulate, X, Escape, X and Escape during the hold, a forced close, the X during a held-card read, Escape from the tray copier, and five open and close cycles. A forced restart holds 2 observers, not 3: the old one is disconnected.
- **Phone height rule:** the formula is exact. 52 px of space plus 32 px of padding puts the frame 52 px down at 320x568 and 360x640, and the snap holds whole pixels. At 320x568 the 540 px `min-height` wins and the frame runs 24 px past the bottom of the window. Ruling: a nit, not a minor (n2). 320 px is below every size in the brief. The X is still clear, and the copier screen scrolls (`.flipper-screen` has `overflow-y: auto`), so a wheel or swipe brings Save to y 491..555, inside the window. Only the bottom outline and steps are lost.

## R1 and R2 fixes: regressions

None found. The Copy and Take details show in full on the menu (live menu text in game 2489). `takeIcon` behaves the same in a browser (`action-menu` 16/16). Snapping holds at every size above. The emulation hold timer is guarded as above. The phone frame stays inside the window at 390 and 375.

## Tests

I ran every `test/js` file that imports or reads a changed module: `rfid-minigame`, `rfid-ui`, `action-menu`, `interaction-menu`, the base scene, `minigames/index` and the rfid folder. That is 122 files, all passing, with `bin/test-js` and no lock (test lock rule). Key counts: `rfid-door-screen` 18/18, `action-menu` 16/16, `rfid-denial-hold` 10/10, `rfid-crypto-contrast` 12/12, `rfid-clone-card` 12/12, `f18-toast-flag-rfid` 8/8, `rfid-dictionary-attack` 3/3, `rfid-flipper-back` 3/3.

## Findings

### Blockers

None.

### Majors

**M1. At 915x412 the copy screen runs off the top and bottom of the window, and Save cannot be reached.** `public/break_escape/css/rfid-minigame.css:24` (`.rfid-minigame-game-container`, `justify-content: center`) and `:41` (the wide `.flipper-zero-frame` rule, which has no `min-height: 0`). After a read, the copy screen's content needs 577 px, and the frame cannot shrink below its content. The frame is a flex item with `overflow: visible`, so its automatic minimum height is its content height. Plain `center` then centres the overflowing frame in a 372 px area. Live, game 2492: the frame runs from y -82 to 495 in a 412 px window, so the copier's header is cut off at the top. Save sits at y 412..458, below the window: `elementFromPoint` does not reach it, and a mouse wheel moves nothing, because no ancestor scrolls (`clone-read-915x412.png`, `clone-915x412.png`). The player can close the copier but cannot save a copy in a landscape phone window. The same holds for any window wider than 500 px and shorter than about 580 px (667x375, for example). The reader screen fits (372 px), which is why R1 and R2, which measured only the reader screen, passed this size. This is older than the slice: the base also used plain `center`, and the old Cancel row took more height. The user's rule names 915x412 as a size where the frame must wrap its content.

Fix: move `justify-content: safe center` from the phone rule to the base `.rfid-minigame-game-container` rule. Give the wide `.flipper-zero-frame` `min-height: 0; max-height: 100%`, so the frame shrinks to its area and `.flipper-screen`, which already has `overflow-y: auto`, scrolls. I checked this live with injected CSS (game 2494, `clone-read-915x412-fixprobe.png`). At 915x412 the frame runs from y 20 to 392 (372 high), and the screen scrolls 483 px of content in 278, so a wheel brings Save to y 309..355. 800x600 gives 560 high with Save in view. 390x844 and 1400x1000 do not change. Better still, keep the Save and Abandon row out of the scrolling screen so it is always in view. Add a test that pins `safe center` and `min-height: 0` on the wide rules, and a live check at 915x412 that Save is inside the window or scrolls into it.

### Minors

None.

### Nits

**n1. Where the light and dark bevels meet (top-right and bottom-left), both bevels follow the steps side by side, with 2 px jogs.** `public/break_escape/css/rfid-minigame.css:112` (`.flipper-zero-frame > .flipper-bevel`). The dark layer is the same staircase as the light one, moved 2 px down and right, so along those two diagonals it shows inside the light one. At the top right, the right edge has a 2 px light block just below the corner, with a dark block inside it. At the bottom left, the left edge has a dark block 2 px in from the light bevel, and the bottom edge starts with a light block. Every pixel is a palette colour, so this is a drawing nit, not blur (`corners-1400x1000-x8.png`). Fix, optional: give `.flipper-bevel` its own polygon, with steps only along the bottom-right corner, and run it into the light bevel at the top-right and bottom-left corners, so each of those corners has one colour change. Or ask the user whether the look is fine as it is.

**n2. At 320x568 the frame's bottom 24 px (its outline and steps) is below the window.** `public/break_escape/css/rfid-minigame.css:587` (`min-height: 540px` in the phone rule). The content is still usable (see the ruling above). Fix with M1: `min-height: min(540px, calc(100vh - 104px))`, or drop the minimum, since the screen scrolls.
