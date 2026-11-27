# A6 R3 outcomes

Verdict was accept with four nits. All four done; test additions are in `test/js/phone-voicemail-hold.test.mjs`.

- **n-a:** `_threadOpenOn` (`systems/npc-manager.js`) now also requires `!!open.conversation`, so a phone-chat with no conversation yet (intro preload, outgoing dial) no longer holds a voicemail its close would never release. Test `n-a` fails with the clause removed. `openThread` in the test now gives the fake thread a `conversation`.
- **n-b:** test `n-b` reloads a slot with a ringing withheld live offer (callback, no voicemail) plus a saved callback, and expects the callback to stand. Fails with `restoreCallback(npc.id, callback)` in `_resumePendingCall` removed (J3).
- **n-c:** test `n-c` releases a held voicemail after `ringer.suspend(true)` and expects no toast. Fails with the `isSuspended` clause removed (J17).
- **n-d:** the n4 title now says the voicemail is released after the warning, and the test asserts the slot is cleared.
