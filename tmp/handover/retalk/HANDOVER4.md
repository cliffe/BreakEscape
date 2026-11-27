# Re-talk fix handover 4 (2026-11-18), R1 fixes

## Correction to HANDOVER3
The "live FAIL" on game 8324 was a harness error. The proof clicked `.minigame-close-button`, which matched the hidden crypto-close-btn, so the chat never closed. With the real X (`#minigame-close`) the fix worked live (games 8356, 8364 on :3087): `val_argument_heard` set once at close, no late event, survived reload, re-talk opened at the hub.

## R1 findings
- B1: both look-aheads (person-chat `_flushTrailingTags`, phone `restoredStoryHasOnlyTheEnd`) detach the story's `variableChangedEvent`, step `engine.continue()`, then `LoadJson(saved)` and re-attach. Person-chat then runs `conversation.continue()` live only for a tags-only step, so a `~ g = g + 1` there lands once, through the observer. The phone spent-step case is committed with a live `engine.continue()`. Probing via `engine.continue()` also removes m1 (no `npc-conversation-ended` from the probe).
- M1: test/js/person-chat-close-real-sequence.test.mjs drives the real class (choice, 1.5 s timer, display, cleanup) on the real Val ink. Against person-chat-minigame.js from 80b60380b^ it fails at "set at the close". Live re-check below.
- M2: on a reopen whose restored story has only the end left, `showCurrentDialogue` runs the empty result's state tags (`_flushPendingReply`, same denylist) before `restartAfterEnd()`. Tested: once after a reload, zero after a close flush.
- m2: no action (5285ef7b5 came from main).
- #ending_check: sis03 Eleanor Vance (person-chat debrief, `#ending_check / #set_global:debrief_complete:true / #complete_task` after "Well done") is the only person-chat scenario with a trailing one; the m01-m09 0x99 ones sit on phone choices or call knots (not person-chat). Flushing it at a close would pop the confirm during teardown, and running the tags after it without the gate would end the mission without the "Keep going" check. So it is now excluded as a whole: `_flushPendingReply` skips every state tag of a reply that contains `ending_check` (and leaves them to the display path), and `_flushTrailingTags` leaves such a step unread. Tested.

## Live re-check (fresh m02 game 8438, :3087 from this worktree, headless, own game only)
Page had `PersonChatMinigame._flushTrailingTags` (function). Bootstrap without autoBrief (the autoBrief run sets the global during the cutscene), picked "Somebody phoned", then "I'll get you something", reply shown at 1.56 s, clicked `#minigame-close`: `val_argument_heard` false -> true at the close, one `global_variable_changed` event, one write (via `_flushPendingReply`), still 1 event and 1 write 10 s later. After reload the value stayed true and re-talk opened at the hub ("Back again..."). Server stopped by PID.

## Tests
Full bin/test-js at the fix commit: 764 files passed, 0 failed.
Focused: close-real-sequence 6/6, close-trailing-tags 5/5, retalk-restart 9/9, pending-reply 17/17, person-chat-reopen 4/4, phone-call-notes-paths 15/15. The lifted-method tests got `tagAction` in their deps. No new static import in an engine module (tagAction is from the existing pending-reply import).
