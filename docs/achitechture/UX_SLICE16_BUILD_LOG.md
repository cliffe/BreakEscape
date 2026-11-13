# UX slice 16 build log: confirms, conversation close, screen-lock precedence

Branch `build/ux-slice16`, from batch 27 at a8f74b3b8. User decisions q99, q100 and q89 (2026-11-13).

## What changed

| Item | Decision | Change | Files |
|---|---|---|---|
| Confirm dialogs have no X | q99 | `gameConfirm` draws no close X in either branch (plain text or `html: true`); its two named buttons are the only answer and Esc picks the cancel button (resolves false, as before, through the modal stack). The message no longer reserves 40 px on the right for the X. `gameDisplay` (an information panel, not a confirm) keeps its X. Every engine confirm goes through `gameConfirm`: `confirm_action` (switches, breakers, sockets), `interactionWarning`, `onInteract.confirmationText`, the wearable put-on and take-off confirm, and the network jack's "Unplug it" / "Leave it". | `public/break_escape/js/systems/notifications.js`, `public/break_escape/css/notifications.css` |
| Named buttons at phone width | q99 | Confirm buttons keep their label on one line (`white-space: nowrap`) and the row wraps, so at 390 px "Switch off" and "Leave it" take a row each instead of breaking inside the button. | `public/break_escape/css/notifications.css` |
| Wearable confirm named | q99 | The default confirm passes "Put it on" / "Leave it off" for `confirmOn` and "Take it off" / "Keep it on" for `confirmOff` (exported as `PUT_ON_LABELS`, `TAKE_OFF_LABELS`), instead of Confirm / Cancel. | `public/break_escape/js/systems/wearables.js` |
| `onInteract` confirm labels | q99 | `onInteract.confirmationText` reads optional `confirmLabel` and `cancelLabel` beside it (fallback Confirm / Cancel), as `confirm_action` already does. | `public/break_escape/js/systems/interactions.js` |
| Test-scenario confirms named | q99 | The three unlabelled `confirm_action`s in test scenarios now name both buttons: "Plant it" / "Leave it", "Bin it" / "Keep it", "Plug it in" / "Leave it". | `scenarios/test_capture_log`, `scenarios/test_wearable`, `scenarios/test_remove_item` |
| No End Conversation | q100 | `PersonChatMinigame.keepsCancelButton` is false and the "End Conversation" default label is gone, so the person chat draws only the X. The X, Esc and the removed button all called `closeByPlayer()` -> `complete(false)` -> `endMinigame` -> `cleanup()`, so the end path is unchanged: the ink state save, `conversation_closed:<npc>` (which the scenario music listens for), `minigame_failed`, deferred barks, and the pretext interceptor (it wraps `complete`). Phone chat never drew the button (its `keepsCancelButton` was already false); its "Hang up" is a call control and stays. | `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`, comments in `framework/base-minigame.js` and `person-chat/person-chat-pretext.js` |
| PC lock beats the owner's habit | q89 | No behaviour change. Documented: a new README subsection "Who decides the lock: the PC's setting beats its owner's habit" (the five-step order, examples, the hot-desk exception, the idle locks on top); a comment at `decideLocked` and at the two server readers. Pinned: a new Rails test of both server readers each way round, and two more cases in the JS precedence test. | `README_scenario_design.md`, `public/break_escape/js/systems/workstation-state.js`, `lib/break_escape/access_identities.rb`, `lib/break_escape/owner_claim.rb` |
| README confirm docs | q99 | The confirm section shows `confirmLabel` / `cancelLabel` and says a confirm has no X and Esc cancels; the action table lists the two labels. | `README_scenario_design.md` |

Sync: nothing new in player_state. The labels are scenario data; the conversation close path is unchanged.

## Tests

- New `test/js/conversation-end-paths.test.mjs` (5): the real `PersonChatMinigame` and `MinigameFramework` in jsdom. No End Conversation button and the X is drawn; the X, Esc, the ink end hook (`npc-conversation-ended`) and the story end (`complete(true)`) each save the ink state, fire `conversation_closed:<npc>` once, let the framework go, run `onComplete` once and clear the NPC context.
- `test/js/notifications-plain-default.test.mjs`: 13 pass (new: no X, exactly two named buttons, Esc resolves false in both branches, the buttons resolve true and false; `gameDisplay` keeps its X; `onInteract` labels reach the buttons).
- `test/js/modal-stack-escape.test.mjs`: 5 pass (the X count is now gameDisplay's only).
- `test/js/wearables.test.mjs`: 25 pass (the default confirm passes the named labels for put on and take off).
- `test/js/workstation-state.test.mjs`: 53 pass (q89 cases: an open PC ignores a habit that always locks; lockChance beats locksScreenOnLeave).
- New `test/unit/pc_screen_lock_precedence_test.rb` (4 runs): `AccessIdentities.screen_always_locks?` and `OwnerClaim.open_without_estimate?`, the PC field winning both ways round, lockChance over locksScreenOnLeave, and the habit and default when the PC sets neither.
- Related files run alone: minigame-close-shell 16, minigame-pixel-art 48, minigame-title-escape 23, interaction-warning 13, network-links 66, wearable-hooks 4, toast-click-through 2: all pass.
- Full Rails suite (on 1136b61ed, under the lock): 2390 runs, 42539 assertions, 0 failures, 0 errors, 1 skip.
- Full JS suite (`MERGE_BATCH=1 bin/test-js -j 3`, under the lock, after every code commit): 599 files passed, 0 failed.
- Validator `--no-graph` on test_capture_log, test_wearable, test_remove_item: 0 ❌, exit 0 each.

## Live proof

Keyless server on :3063 from this worktree, new games only (new-game.rb), headless shell with scrollbars shown, `setFPS(20)` and fixed steps on. Shots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/ux-shots/slice16/`, each at 1400x1000 and 390x844:

- `q99-a-switch-confirm` (test_needs_sims, game 2943, the coffee machine socket): "Switch off" / "Leave it", no X, two buttons; Esc closed it and `office_coffee_off` stayed false.
- `q99-b-wear-confirm` (test_wearable, game 2944, the vest from the tray toggle): "Put it on" / "Leave it off", no X; Esc closed it and nothing was worn.
- `q99-c-interaction-warning-confirm` (test_interaction_warning, game 2946, the logged terminal): "Continue" / "Back off", no X; Esc closed it and no minigame opened.
- `q100-a-person-chat-open`, `q100-b-person-chat-open`, `q100-c-after-close` (m01_first_contact, game 2945, Sarah at reception): the chat shows the X and no End Conversation; the X closed it (one `conversation_closed:sarah_martinez`, NPC state saved, context cleared), then a reopened chat closed on Esc (the second event, state saved).

## Not done

- Two mission confirms still fell back to Confirm / Cancel: the cable `confirm_action` in `sis02_energy` and the hi-vis `confirm_action` in `lab_physical_pentest`. (An earlier version of this line named an `interactionWarning` in sis01_healthcare; that is a medication note inside the EHR terminal's data, not a dialog.) Both are named in the R1 fixes below.
- Minigame-internal confirm panels (ESD pushbutton "CONFIRM - INITIATE SHUTDOWN" / "CANCEL", SIS tamper report "Confirm" / "Cancel") already had no X and two buttons; their generic labels and Esc (which closes the whole minigame) are untouched.
- The assistant chat (a social engineering app window) keeps its "Close" text button, like the mail client and the other SE overlays; it is not an NPC conversation.
- Seen in the 390x844 chat shots and not part of this slice: the speaker name and line sit over the portrait, the choices are half width, and after the chat closes the "Menu (Esc)" hint sits under the Block and Punch buttons.
- At 390 px the two confirm buttons stack with unequal widths; acceptable, but a later pass could give them equal width when wrapped.

## Review round 1 fixes

Review: `docs/achitechture/UX_SLICE16_REVIEW_R1.md`. Commits 07d13df3b, a3f86024f, 54d89d19a, b9a89b86a, b38a462a7.

| Finding | Fix |
|---|---|
| M1 | `player.js` keydown returns early while `openModalCount() > 0` (gameConfirm or gameDisplay open) and drops held movement keys; `updatePlayerMovement` also stops a walk that was under way when a dialog opened. `gameConfirm` keeps an open count (`window.gameConfirmOpen`), and `maybeInteractionWarning` and the `confirm_action` case refuse to open a second confirm while one is open. No test harness imports the real `player.js` (all stub it), so no copy list needed `ui/modal-stack.js`; `social-return-to.test.mjs`, which lifts the pause and resume functions from the source, now lifts `clearKeyboardMovement` too. New `test/js/confirm-holds-keys.test.mjs` (5): a second and third E open no second confirm and yes runs `onConfirm` once; confirm_action twice opens one; F, Q, Space and the arrows do nothing behind a confirm and a held arrow stops; focus and Enter, Tab and Space; the interaction warning guard. |
| M2 | `[data-minigame="person-chat"] .minigame-close-button::after` with `inset: -14px` under `(max-width: 600px), (pointer: coarse)`: nothing drawn, hit area at least 44 px. Live: points 7 px left of, right of and below the drawn X hit it at 390 (touch). |
| M3 | sis02 cable confirm: "Disconnect" / "Leave it"; TESTING_WALKTHROUGH step 19 updated (it also named a stale `onRead`). Validator 0 ❌. |
| m1 | lab_physical_pentest hi-vis confirm: "Put it on" / "Leave it off" (coordinator: one wearable pair across the game, matching `PUT_ON_LABELS`). Validator 0 ❌. |
| m2 | The "Not done" line above corrected. |
| m3, m4 | README: the browser reads all five steps, the server's two readers steps 2 to 5 and the policy on its own (the guest claim); a hot desk's policy with `autoLockMin: 0` still ends the guest's session. The guest-still-signed-in mismatch is a new line in `docs/IDEAS_BACKLOG.md`. |
| m5 | `pc_screen_lock_precedence_test.rb`: the knock-out route of `OwnerClaim.precise_route` each way round, and a habit filled from `habits.locksScreen` by `NpcHabits.expand!` at a bare PC and beside a PC field (6 runs). |
| m6 | `conversation-end-paths.test.mjs`: a forced `complete(false)` (not a player close), a minigame opened over the chat (saved, event once, inactive, a second cleanup adds nothing) and `disableClose` (no X, no cancel row, Esc does nothing) (8 tests). The music hand-back was not checked live: m01 has no `conversation_closed` music event. |
| m7 | `m07_live.sh` closes the briefing with `#minigame-close`; `docs/test-bridge.md` lists notes and the password screen only; the dead `.game-modal-close` stub removed from `interaction-warning.test.mjs`. |
| m8 | At `max-width: 480px` a wrapped pair is two full-width rows of equal size (live: 290 and 290 px). |
| m9 | Buttons get `max-width: 100%; overflow: hidden; text-overflow: clip`; the validator warns on `confirmLabel`, `cancelLabel`, `proceedLabel` and `declineLabel` over 16 characters (`test/js/validator-confirm-label-length.test.mjs`, 2). |
| m10 | `gameConfirm` focuses the cancel button on open and gives focus back on close; Enter or Space presses the focused button, Tab and the arrows move between the two, and none of these reach the game. A square 2px white focus ring (`:focus-visible`). |
| m11, m12 | Under `max-width: 600px` the portrait sits at the top at 4:3 and the caption follows in flow (name and line under the portrait), one column, choices full width (358 px at 390), the caption scrolls if it outgrows the space. Desktop unchanged in layout. |
| m13 | `setHudLabel` ignores hover labels when `(hover: none)` matches. Live at 390 with touch emulation, after the chat closes by a tap on the X the HUD shows the proximity caption, not "Menu (Esc)". At 1400 with a mouse the label still shows while the pointer rests on the menu button after the X click: that is a real hover. |
| m14 | The caption is a flat `rgba(0,0,0,0.82)` band as tall as its content with a stepped top edge (two 4 px hard shadows, no blur); the line's text shadow is `2px 2px 0`. At 1400 the band is lower than the old 33% fade, so more of the portrait shows; the text stays readable. |

Suites under the lock: Rails 2392 runs, 42555 assertions, 0 failures, 0 errors, 1 skip (started on b9a89b86a; b38a462a7, one CSS inset and one label string, landed during the run). JS `MERGE_BATCH=1 bin/test-js -j 3` on b38a462a7: 601 files passed, 0 failed.

Live proof on :3063 (keyless, from this worktree), new games only (2981 to 2988 and 2994; 2989 was a probe), headless shell with scrollbars shown, `setFPS(20)` with fixed steps on. Shots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/ux-shots/slice16-r1fix/`, each at 1400x1000 and 390x844 (the 390 chat with touch emulation): the switch and warning confirms show one overlay after two more E presses, the player did not move under a held arrow, focus starts on the safe button; Esc answers no in all three (coffee stays on, nothing worn, no minigame); the chat X and Esc each fire one `conversation_closed` and save the state.

Still open (not in this round): the video-call mode of the chat keeps a gradient status bar, scanline gradient and soft text shadows (`person-chat-minigame.css`, video call section); at 390 the HUD proximity caption sits under the Block and Punch buttons (the same spot as the old Menu label; a HUD layout matter).

## Handover

Not needed: the slice finished within the context budget.
