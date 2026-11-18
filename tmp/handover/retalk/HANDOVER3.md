# Re-talk fix handover 3 (2026-11-18)

Commit 80b60380b on fix/retalk-restart: person-chat `_flushTrailingTags` (cleanup probes one ink step past the shown reply; tags-only step runs once via _flushPendingReply, a step with text is rolled back), `_cleanedUp` guards at the top of displayDialogueBlocksSequentially and after the two awaits, new test test/js/person-chat-close-trailing-tags.test.mjs (5 pass; 5 fail on the old source; person-chat-pending-reply 17/17 still pass).

## Done earlier
- Full bin/test-js on 2963bb088: 762 pass, 0 fail (run twice). Phone proof OK (m02 HaX, game 8309: mid-typeout close, reload, real choices). Ruling: late set_global was a single late fire, not a double.

## OPEN: live re-proof FAILED (game 8324, :3087 server PID 3786019, session live-d may still be running: send {"cmd":"quit"})
Close at Val's reply ("I'm stood in a corridor"): heard=false and 0 events at close and after 4 s; read again later it was true. So the flush did not set it at close, and something still sets it late (not measured when, nor the stack; tmp/hook3.js records stacks in window.__writes). Check: is `_displayInFlight` set when the reply shows (displayAccumulatedDialogue -> displayDialogueBlocksSequentially entry), is cleanup() reached with story.canContinue true, does conversation.continue() return tags-only, does the write come from the flush (stack would show _flushPendingReply) or the old path. Then re-run full bin/test-js (a run into scratchpad/testjs2.log was started; may be unfinished) and the live proof, then report to AC0.
Stop server by PID: kill 3786019.
