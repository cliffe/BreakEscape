# UX slice 16 review, round 2

Branch `build/ux-slice16`, diff a18ed08af..ae9f4a6ea (the round 1 fixes). Read only: code, the build log, the slice16 and slice16-r1fix shots and their JSON reports. Run without the lock: the five touched JS test files (45 tests, 0 failures), every other `test/js` file that imports `info-label`, `notifications`, `modal-stack` or `apply-actions` (0 failures), `test/unit/pc_screen_lock_precedence_test.rb` (6 runs, 0 failures), and the validator on sis02_energy and lab_physical_pentest (0 ❌ each).

## Round 1 fixes: checked

Every round 1 finding has a real fix in the diff:

- **M1.** `player.js:297` returns early while `openModalCount() > 0` and drops held movement; `updatePlayerMovement` (`player.js:1053`) stops a walk already under way. `confirm_action` (`apply-actions.js:415`) and `maybeInteractionWarning` (`interactions.js:770`) refuse a second confirm. The live report shows one overlay after two more E presses and no movement.
- **M2.** The chat X gets an `::after` hit area with `inset: -14px` under `(max-width: 600px), (pointer: coarse)`, at least 44 px. Live probes 7 px outside the drawn X all hit.
- **M3, m1.** The sis02 cable confirm says "Disconnect" / "Leave it" and the walkthrough step matches. The lab hi-vis confirm says "Put it on" / "Leave it off", the same pair as `PUT_ON_LABELS`.
- **m2 to m7.** The build log line, the README wording (browser all five steps, server steps 2 to 5, the hot desk policy exception), the backlog line, the caller-level Rails cases, the three extra end-path tests, `m07_live.sh` closing with `#minigame-close`, `docs/test-bridge.md` and the dead stub are all done.
- **m8, m9.** Wrapped buttons are full width at 480 px and below (290 and 290 px live); labels are cut at the frame; the validator warns over 16 characters, with a test.
- **m10.** The cancel button takes focus on open, focus is restored on close, Enter and Space press the focused button, and the ring is a square 2 px outline.
- **m11, m12.** At 390 the portrait sits on top at 4:3, the name and line follow in flow, and the choices are 358 px wide.
- **m13, m14.** `setHudLabel` ignores hover labels on `(hover: none)`. The caption is a flat band with a stepped top edge, and the text shadow has no blur.

## The key guard (question 2)

- **Stranding.** Only `gameConfirm` and `gameDisplay` register on the modal stack. Their only unregister path is `finish`, reached by the buttons, the X (display only) or Esc through the stack's own capture listener. Nothing else removes `.game-confirm-overlay`. A reload resets the module. No minigame registers, so the minigame keys (`keyboardPaused`) and the modal guard never overlap. The one case where a count could stick is a throw between `openConfirms++` (`notifications.js:508`) and `appendChild`; even then Esc still reaches `finish` through the stack. See m3.
- **Keys a modal needs.** The guard returns without `preventDefault`, so typing, Esc (handled earlier in the capture phase by `modal-stack.js`) and the browser's defaults are untouched. The confirm's own Enter, Space, Tab and arrows stop on the overlay before they reach `document`. No minigame with arrow keys registers as a modal.
- **`window.gameConfirmOpen`.** It is decremented once per confirm in `finish` (the `done` flag stops a second decrement), on every answer path.

## Findings

### M1. Arrow keys on a confirm move focus to "yes", and a held arrow flips it on every repeat

`public/break_escape/js/systems/notifications.js:531-536`. The arrows are the movement keys. A player walking with an arrow held who presses E opens the confirm with focus on the safe button. The arrow's auto-repeat keydowns then go to the focused button, and each one toggles focus between the two buttons, so the focus lands on either one when the key is let go. A single habitual tap of an arrow does the same. The next Space (the jump key) or Enter then presses "Switch off", "Disconnect" or "Put it on". The live report already shows it: `report-switch-1400x1000.json` gives `"focusAfterKeys": "game-confirm-btn game-confirm-ok"` after the held-arrow check. This undoes the safety the m10 fix promised ("so a stray Enter or Space never says yes"), on actions the player cannot take back (the sis02 cable).

Fix: in the Tab and arrow branch, still `preventDefault` and `stopPropagation`, but do nothing when `e.repeat` is true. Better still, ignore any key that was already down when the dialog opened: keep a `Set` of `e.key` values that arrive before their first keyup after open and skip them. Add a test to `test/js/confirm-holds-keys.test.mjs`: open a confirm, dispatch `ArrowRight` with `repeat: true` three times on the focused button, and assert focus is still on `.game-confirm-cancel`.

### m1. Touch players lose the names on icon-only HUD buttons and single-action tray items

`public/break_escape/js/ui/info-label.js:37`. On `(hover: none)` no hover label shows at all. That fixes the stuck "Menu (Esc)", but on touch the sticky label was also the only place a tap showed what an icon-only button is ("Music Controls", "VM Controls (Inactive)", "Player Settings") or an inventory item's name and "(worn)" (`inventory.js:904`). Items with a menu still show their name as the menu title (`inventory-menu.js:156`). Items with one action do not, and the Block and Punch buttons keep their own captions. Fix: on a screen that cannot hover, show the label briefly and clear it after about 1.5 s, or on the next `pointerdown` elsewhere, instead of dropping it.

### m2. A click on the dimmed backdrop loses the confirm's focus

`notifications.js:525`. The overlay has no click handler, by design. A click on the dim area still moves focus to `body`, so Enter does nothing, the keydown listener on the overlay no longer runs, and Tab walks the HUD before it reaches the buttons (the overlay comes last in `body`). Fix: add `overlay.addEventListener('mousedown', e => { if (!e.target.closest('.game-confirm-btn')) e.preventDefault(); })` so focus stays on the button.

### m3. A confirm_action that fires while another confirm is open is dropped silently

`apply-actions.js:415`. The guard was meant for the same switch pressed twice, but it drops any `confirm_action` that arrives while some other confirm is open, including one from a timer (`scenario-timer-dispatcher.js:238`). Nothing logs it and nothing replays it. No scenario on the branch does this today. Fix: drop only when the open confirm has the same text (keep the open text in a module-level set), and `console.warn` when a confirm is dropped. Also move `openConfirms++` and `registerModal` in `gameConfirm` to after the button listeners are wired, just before `appendChild` (`notifications.js:507-508`), so a throw while building the dialog cannot leave the count at 1.

### m4. The chat caption can scroll at 390 but shows a plain scrollbar and no "More below" cue

`public/break_escape/css/person-chat-minigame.css:348` sets `overflow-y: auto` on the caption. A long line and four choices will scroll with the browser's own scrollbar, which breaks the pixel-art scrollbar rule in the UI design language. Fix: copy the pixel scrollbar rule (as `css/infusion-pump-minigame.css:391-415` does until the shared `.pixel-scroll` lands) onto `.person-chat-caption-area` inside the 600 px block, and add the shared "More below" cue.

### m5 (existing, left open). The video-call mode of the chat still breaks the pixel-art rule

`person-chat-minigame.css` from `:387`: a `repeating-linear-gradient` scanline, a `linear-gradient` status bar, `text-shadow: 1px 1px 2px` (twice), `border-radius: 50%` with a `0 0 6px` glow on the live dot, and a soft `0 4px 12px` drop shadow. None of these is touched by this slice, so they need not block it. It needs its own follow-up: a flat status band, a 2 px stepped dot, `2px 2px 0` shadows, and a scanline drawn as a whole-pixel PNG or dropped.

### m6 (existing, left open). At 390 the HUD caption sits under Block and Punch

`q100-c-after-close-390x844.png`: the proximity caption ("Sign-in log showing suspicious after-hours acc...") is cut by the two combat buttons, so on a phone the player cannot read it. `#hud-info-label` is fixed at `bottom: 148px` themed (`ui-themes.css:571`), and the combat row sits at `bottom: 116px` and is 68 px tall below 900 px wide (`hud.css:121-127`). Fix: below 900 px and not in landscape, `body:has(#combat-buttons) #hud-info-label { bottom: 196px; }` (above the row, scaled by `--hud-zoom`), and a check of the shot. This is a HUD matter and outside this slice's scope; it does not block the merge.

### m7. The music hand-back reason in the build log is wrong, and the check is cheap

`docs/achitechture/UX_SLICE16_BUILD_LOG.md:63` says m01 has no `conversation_closed` music event. It does: `scenarios/m01_first_contact/scenario.json.erb:76` switches to `noir` on `conversation_closed:briefing_cutscene`, and sis02 has one on `conversation_closed:helen_marsh` (`:495`), which is a conversation the player closes with the X. The emit path did not change in this slice, and `conversation-end-paths.test.mjs` pins one event per close, so the risk is low. Fix: correct the log line, and do one live check on a new sis02 game with `briefing_played` set: close Helen with the X and assert the music controller's current playlist is `noir`.

## The extra choice, the band and the open items

- **Arrow keys between the confirm buttons (question 4).** Keep them for keyboard players, but only with the M1 fix. Without it they are the one way this round made a "yes" more likely.
- **Flat caption band at 1400 (question 5).** Compared with `slice16/q100-b-person-chat-open-1400x1000.png`, it is no worse. The old fade was almost clear above the name. The new band starts about 50 px above the name, with a visible two-step edge, and darkens Sarah's hands and waist. The name and line read more clearly against it. Both versions have the same seam where the portrait image ends and the black below starts (the line "audit." and choice 2 sit below it). The build log says "more of the portrait shows". That is true of the box, but not of what the player sees, since the band is darker where the old fade was clear. No finding.
- **Open items (question 6).** The video-call gradients are m5 and the HUD caption at 390 is m6; both are existing and neither blocks the merge. The music hand-back is m7: low risk, but the stated reason is wrong.

## Counts

B 0, M 1, m 7 (two existing and left open).

## Verdict

Merge-ready once M1 is fixed: a few lines in `notifications.js` and one test. The m findings can follow in a later slice. m1 and m3 are worth doing next.
