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

- Two mission confirms still fall back to Confirm / Cancel: the `confirm_action` in `lab_physical_pentest` and the `interactionWarning` in `sis01_healthcare`. Mission text, left for the mission owners.
- Minigame-internal confirm panels (ESD pushbutton "CONFIRM - INITIATE SHUTDOWN" / "CANCEL", SIS tamper report "Confirm" / "Cancel") already had no X and two buttons; their generic labels and Esc (which closes the whole minigame) are untouched.
- The assistant chat (a social engineering app window) keeps its "Close" text button, like the mail client and the other SE overlays; it is not an NPC conversation.
- Seen in the 390x844 chat shots and not part of this slice: the speaker name and line sit over the portrait, the choices are half width, and after the chat closes the "Menu (Esc)" hint sits under the Block and Punch buttons.
- At 390 px the two confirm buttons stack with unequal widths; acceptable, but a later pass could give them equal width when wrapped.

## Handover

Not needed: the slice finished within the context budget.
