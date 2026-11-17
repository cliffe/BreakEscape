# UX slice 16 review, round 1

Branch `build/ux-slice16`, diff a8f74b3b8..cfa9f3114. Scope: q99 (confirms keep two named buttons, no X), q100 (no End Conversation; X and Esc end a conversation), q89 (a PC's own screen-lock setting beats its owner's habit, documented and pinned). Read only: code, tests, the build log, the 390x844 and 1400x1000 shots and their JSON reports. No suites run (test lock rule).

The slice itself is small and correct. The q99 and q100 code changes do what the decisions ask, the end path for a conversation is unchanged (the X, Esc and the removed button all called `closeByPlayer()`), and the live reports show one `conversation_closed` and a saved state for both the X and Esc. Most findings below are things the slice now exposes or missed nearby.

## Checked, no finding

- **Esc on a confirm.** `registerModal` puts the confirm on the stack and its capture-phase `keydown` on `document` closes only the top entry and stops the event, so the minigame's own bubble-phase Esc (`base-minigame.js:172`) and the game menu (`game-menu.js:375`, which sees the full-screen overlay through `_somethingElseOpen`) never act on the same press. Key repeat is swallowed. `finish(false)` resolves the safe answer.
- **Click outside.** The overlay has no click handler, so a click on the dimmed area does nothing: no answer, the dialog stays. That is safe.
- **Over a minigame.** `.game-confirm-overlay` is z-index 3000, the minigame container 1500, so a confirm raised during a conversation sits on top and Esc closes the confirm first, then the chat on a second press.
- **Leaks.** `finish()` always unregisters and removes the overlay, nothing else removes `.game-confirm-overlay`, and the listener drops when the stack empties. An end screen (z-index 10000) over an open confirm leaves that one registration live until the game is left; harmless.
- **Conversation end paths.** X, Esc, the ink hook (`npc-conversation-ended`, `person-chat-minigame.js:342`), the story end (`complete(true)`), a forced `complete(false)` and a minigame opened over the chat (cleanup without complete, `person-chat-minigame.js:2011`) all reach `cleanup()`, which saves the ink state while the conversation is active, emits `conversation_closed:<npc>` once per instance (`_conversationClosedEmitted`) and clears the NPC context. The scenario music listens on that event (`music/scenario-music-events.js:11`). `disableClose` still hides the X and blocks Esc, and there is no longer a cancel button for it to hide.
- **Drivers and the bridge.** No live test bridge helper clicks `#minigame-cancel` or the confirm X: the bridge closes with `.minigame-close-button` (`test-bridge/minigames.js:497`). `tools/playtest/pixel-style-sweep.mjs:152` lists only password and notes as keeping Cancel, so person-chat was already expected to have none. No skill under `.claude/skills` mentions End Conversation. The m08 mentions are historical comments.
- **q89 order.** The README's five steps match `decideLocked` (`workstation-state.js:147-168`) exactly, including "any other value locks" for `locksScreenOnLeave` and "a threshold alone locks" for the habit. The validator's "which wins" warning exists (`scripts/validate_npc_habits.rb:155`, `:191`). The JS cases at `test/js/workstation-state.test.mjs:216-224` pin both directions.
- **Pixel-art rule.** The confirm CSS change adds no radius, shadow, gradient or font. Sync: nothing new in player_state.

## Findings

### M1 (existing). A confirm does not hold the game's keys, so E stacks a second copy of the same confirm

`public/break_escape/js/core/player.js:278-330` reads E, F, Q, Space and the arrows whenever `keyboardPaused` is false, and nothing pauses it while a confirm is open. `tryInteractWithNearest` (`systems/interactions.js:2122`), `maybeInteractionWarning` (`interactions.js:762`, it guards only `currentMinigame`) and `confirm_action` (`systems/apply-actions.js:409`) have no open-confirm guard either. So, by reading (not proved live):
- pressing E again opens a second identical confirm on top; answering yes to both runs `onConfirm` twice (a second `remove_item`, `set_global`, `complete_task`, or a second wear request);
- the arrows walk the player away, F punches and Space jumps behind the dialog, and the confirm still applies when answered from across the room.

Esc closes only the top copy, so a player who stacked two sees the "same" dialog come back. Before q99 the X did the same thing, so this is not new, but it is the main way two confirms end up open at once.

Fix: in `player.js` keydown, return early (after the `keyboardPaused` check) when `openModalCount() > 0`, importing it from `ui/modal-stack.js` and adding that file to each JS test harness copy list. Clear `keyboardInput` movement flags when a modal registers, so a held arrow does not keep walking. As a second line of defence, return early from `maybeInteractionWarning` and from the `confirm_action` case when a `.game-confirm-overlay` is already open. Test: open a confirm, dispatch E twice, assert one overlay; answer it and assert `onConfirm` ran once.

### M2. With End Conversation gone, the chat's only touch exit is a 30 px X in the corner

`public/break_escape/css/minigames-framework.css:292-297` draws the X at 30x30, top right. At 390x844 (`q100-b-person-chat-open-390x844.png`) it sits about 250 px above the dialogue and choices, and a phone has no Esc. The removed button was a full-width target next to the choices. The decision stands (q100), but the remaining exit needs a touch-sized target.

Fix: keep the drawn size and widen the hit area for the chat on small or touch screens, e.g. `@media (max-width: 600px), (pointer: coarse) { [data-minigame="person-chat"] .minigame-close-button::after { content: ''; position: absolute; inset: -8px; } }` (44 px target, no visual change, pixel-art rule untouched). Check the shot at 390 and 915x412.

### M3. sis02_energy still has a bare Confirm / Cancel confirm, and the builder missed it

`scenarios/sis02_energy/scenario.json.erb:2064-2069`: the `confirm_action` "Disconnect cable JS-SCADA-LAN?" names neither button, so it shows Confirm / Cancel, against q99 and the new comment at `notifications.js:466` ("never a bare Confirm or Cancel"). The README example the slice edited (`README_scenario_design.md:815-819`) is this very cable, with "Disconnect" / "Leave it". The action (isolating the jump server) is not undone by a second click, which is where a named choice matters most.

Fix: add `"confirmLabel": "Disconnect", "cancelLabel": "Leave it"`, run the validator `--no-graph` on sis02_energy, and check `scenarios/sis02_energy/TESTING_WALKTHROUGH.md` for any "click Confirm" step to update.

### m1. lab_physical_pentest: name the hi-vis confirm

`scenarios/lab_physical_pentest/scenario.json.erb:1018-1023` is a `confirm_action` whose text ends "Put it on?" and whose `onConfirm` is a `wear`. It falls back to Confirm / Cancel, while the same vest's own wearable confirm (line 1006) now shows "Put it on" / "Leave it off" through `PUT_ON_LABELS`. One vest, two different button pairs. Add `"confirmLabel": "Put it on", "cancelLabel": "Leave it for now"` (the text already says "You can leave it for now"). A two-field data edit; validate afterwards. Recommended.

### m2. Build log names the wrong sis01 confirm

`docs/achitechture/UX_SLICE16_BUILD_LOG.md` "Not done" says sis01_healthcare has an `interactionWarning` confirm. `scenarios/sis01_healthcare/scenario.json.erb:1578` is a medication's drug-interaction note inside the EHR terminal's patient data (read by `ehr-terminal-minigame.js:200`), not a dialog; `maybeInteractionWarning` ignores a string. sis01 needs no change. Fix the log line to name sis02_energy (M3) and lab_physical_pentest (m1).

### m3. README overstates that the server reads "this same order"

`README_scenario_design.md:1081` says the browser and the server read the same order. The server readers skip step 1: `AccessIdentities.screen_always_locks?` and `OwnerClaim.open_without_estimate?` take no policy (their own comments say "without the policy"), and only the guest claim checks the policy separately (`app/models/break_escape/game.rb:2307-2308`). So a PC with a `policy` of `autoLockMin: 0` and `lockChance: 0` always locks in the browser, while `open_without_estimate?` says it can be found open and the knock-out route counts for the owner claim. That is the deliberately permissive side, but the sentence should not promise identity.

Fix: "The browser reads all five steps. The server's readers (...) read steps 2 to 5; a policy is checked on its own where the server needs it." Optionally add the policy to `open_without_estimate?` if the knock-out claim should match exactly.

### m4. The hot-desk exception is incomplete

`README_scenario_design.md:1079`: "only the borrower's habit decides whether they leave it signed in". A hot desk's policy with `autoLockMin: 0` also bars the guest session (`game.rb:2307-2308` refuses the claim). Reword: "the hot desk's own `lockChance` and `locksScreenOnLeave` are not read; a policy with `autoLockMin: 0` there still ends the guest's session".

Related, existing and not proved live: in that same case the server's borrow answer still says `guest: true` (`npc_frustration.rb:451`, `record_borrow_done!` does not read the policy), and `onGuestLeft` (`workstation-state.js:295-304`) records the hot desk as open, so the player sees an open session whose claim is then refused. Worth a backlog line; outside this slice.

### m5. The Rails test pins the helpers, not the behaviour that uses them

`test/unit/pc_screen_lock_precedence_test.rb` calls the two module helpers directly. It covers both directions and lockChance over locksScreenOnLeave, and it uses only public module methods, so it is not tied to private internals. It would still pass if a caller stopped using the helpers. Add one case each way through a caller: `OwnerClaim.precise_route(data, owner, pc)` returning `'knock_out'` for a `lockChance: 0` PC beside an always-locking habit and `nil`-or-other for a `locksScreenOnLeave: true` PC beside a never-locking one; or `Game#pc_always_locks?` on a built game. Also one case with the habit filled from `habits.locksScreen` rather than a hand-written `screenHabit`, since the README names both.

### m6. The new end-path test leaves out two paths and the music

`test/js/conversation-end-paths.test.mjs` covers the X, Esc, the ink hook and `complete(true)`. It does not cover a forced `complete(false)` (a hit or knock-out: `closedByPlayer` false, `conversation_closed` once), a minigame opened over the chat (cleanup without complete: state saved, event once, `isActive` false), or `disableClose: true` (no X, Esc does nothing, no cancel row). None changed in this slice, but they are the paths most likely to break if the close shell changes again. The live proof shows `closedEvents` and `saved` but not the music hand-back; one assertion on the scenario music state after close would settle it.

### m7. Stale End Conversation references in a driver and a doc

- `tools/phone_calls/routes/m07_live.sh:16` looks for a button reading "End Conversation". It still closes the chat through its fallback `m.complete(false)`, but that is a forced close, not the player's (`closedByPlayer` stays false), which can differ for a scene that returns to its container. Click `#minigame-close` instead.
- `docs/test-bridge.md:946-947` lists conversations among the scenes that keep `#minigame-cancel`. Change to "(notes and the password screen)".
- `test/js/interaction-warning.test.mjs:221` still stubs `.game-modal-close` on the confirm overlay; dead now, remove it.

### m8. Stacked confirm buttons have unequal widths at 390 px

`public/break_escape/css/notifications.css:162-173`: once the row wraps, each button keeps its own width and the pair hangs right-aligned with ragged left edges ("Switch off" wider than "Leave it", `q99-a-switch-confirm-390x844.png`). Fix: `@media (max-width: 480px) { .game-confirm-buttons .game-confirm-btn { flex: 1 1 100%; } }`, so a wrapped pair is two full-width rows of equal size, confirm on top as now.

### m9. `white-space: nowrap` lets a long label overflow the dialog

Same rule (`notifications.css:171-173`). At 390 the dialog content is about 287 px and a GNF 20 px button holds roughly 18 characters. Today's longest gameConfirm label is "Open one anyway" (15), so nothing overflows yet, but an author label of 20 or more would run past the frame, breaking the "frame wraps the content" rule. Fix: add a validator warning for `confirmLabel`, `cancelLabel`, `proceedLabel` and `declineLabel` over 16 characters, and give the button `max-width: 100%; overflow: hidden; text-overflow: clip` as a backstop.

### m10 (existing). No keyboard focus on a confirm

`gameConfirm` focuses nothing, so the only key that answers is Esc; Tab walks the HUD first because the overlay is appended at the end of `body`. With the X gone a keyboard player has no way to say yes. Fix, together with M1 (so Space does not also jump): focus the cancel button on open, restore the previous focus in `finish()`, and let Enter press the focused button.

### m11 (existing). Chat at 390: name and line over the portrait

`q100-b-person-chat-open-390x844.png`: the speaker name and line sit over Sarah's face and torso. `.person-chat-caption-area` (`person-chat-minigame.css:85-99`) is a third of the height laid over the portrait, and its mobile media block (`:326-345`) is commented out. Fix: at `max-width: 600px` put the caption under the portrait (portrait area shorter, caption in flow) instead of over it.

### m12 (existing). Chat at 390: choices only half the width

`.person-chat-controls-area { max-width: 48%; }` (`person-chat-minigame.css:190-201`) is right for desktop (m08 R6) but at 390 it squeezes each choice to about 170 px and four lines. Fix: at `max-width: 600px` stack the caption and controls in a column and let the controls take 100%.

### m13 (existing). "Menu (Esc)" left showing under Block and Punch after the chat closes

`q100-c-after-close-390x844.png`. `game-menu.js:105-106` sets the HUD label on `mouseenter` and clears it on `mouseleave`; a tap fires the first and never the second, so the label sticks and draws under the Block and Punch buttons. Fix: skip hover labels when `matchMedia('(hover: none)')` matches, or clear the label on `pointerup` and when a minigame closes.

### m14 (existing). Chat caption uses a gradient and a soft text shadow

`person-chat-minigame.css:92` (`linear-gradient` caption background) and `:187` (`text-shadow: 2px 2px 4px`) breach the pixel-art rule (no gradients, no soft shadows). Fix: a flat dark band with a stepped top edge, and a 2px offset shadow with no blur.

## Counts

B 0, M 3 (one existing), m 14 (five existing).
