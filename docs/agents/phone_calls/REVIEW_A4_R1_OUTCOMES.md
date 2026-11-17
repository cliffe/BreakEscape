# A4 review round 1: outcomes (2026-11-12)

Sonnet fixer. All of `REVIEW_A4_R1.md` that was assigned is done, plus the A3 R2 carry-overs. "Failed first" means the new test failed on the unfixed code. For test-only items the code was already right, so the proof is a mutation of the code (listed) that the new test catches. Each item was committed as it passed, explicit paths. No file A5 had uncommitted was edited.

| Item | Fix | Test, and the first failure |
|---|---|---|
| m1 slot lost on a size-fallback flush | `phone-ringer-dom.js` `savePendingCall`: when a contact's slot changes, a debounced (500 ms) `stateSync.sync()`; one sync for a burst | `phone-call-persistence.test.mjs` (3 tests); two failed first (0 syncs). Live: `ringing_autosync` route, slot on the server 2 s after the ring with no manual sync |
| m2 cleared slot left on the server | `npc-manager.js` `exportPhoneState`: a contact last sent with a `pendingCall` and now empty sends `{ history: [], pendingCall: null }` once; `game.rb` `merge_phone_state!` deletes the entry for that marker only | JS (3 tests, the main one failed first); Rails (3 tests, one failed first: stale slot stayed). The marker is also sent after a reload resume clears a restored slot |
| m3 legacy voiced call screen draws rows | `phone-chat-ui.js` `addMessage`: `isCallMode` skips `type: 'call'` | `phone-call-log.test.mjs`, failed first (subtitle for the row) |
| m4 filters tested by source text only | none needed | new `phone-call-rows-not-conversation.test.mjs` (5 tests): both preload filters with real ink, the minigame's `openConversation` lifted out of the source (rows-only thread starts fresh, no `restoreState`). Mutations caught: minigame `\|\| true`, each preload filter `\|\| true` |
| m5 row drawing, contact check, `giveUp`, `markAllRead` | none needed | 4 tests in `phone-call-log.test.mjs`. Mutations caught: no draw, no read mark, no contact check, `giveUp` without `{ missed: true }`, `markAllRead` skipping rows. (The file's `loadUi` repoints `globalThis.window`; the new tests restore the world's window) |
| m6 hostile server cases | none needed | 5 Rails tests: knot with a newline, call-row text with a newline, `Infinity`/`-Infinity`/NaN and parsed `1e400`, `<>` in a `setGlobalOnStart` string, the 10-entry cap. Mutations caught: `^$` anchors, no `finite?`, no `<>` check, no cap |
| n1 dead `type` select | kept, with a comment | `phone-player-lines.test.mjs` reads that line by regex, so removing it broke that test (found by the full suite and put back) |
| n3 re-run `reload_ringing` | route run with the current code | `proofs/A4_r1/reload_ringing_server.json` now shows `live.state: "ringing"`; after the reload: one unread "Missed call", no ring, slot null |
| A3 R2 m1 close-while-held | test steps until the phone is put aside and the offer is `held`, asserts `held`, then `close()` emits at once | mutation (drop removed from `close()`) caught |
| A3 R2 m2 adapter reopen drops | 2 tests: a popup opens between End and the reopen; `startMinigame` refuses the reopen. Each expects one `conversation_closed:<thread>`, once | both adapter drops mutated and caught |
| A3 R2 m3 settle guards | fixture `ring_home_hub.ink` gains `synced_home` (`~ hub_seen = true`) and `narrated_home` (`Narrator:` line); 4 tests | observer left on and no prefix-stripped match, both caught |
| A3 R2 n1 `reopenDisplaced` and `suspended` | `phone-ringer.js`: while suspended the descriptor is kept; `suspend(false)` reopens it; `close()` drops it (one thread event) | 2 tests, both failed first (phone reopened under the pending ending) |
| A3 R2 n4 reload test | new `phone-reload-home-hub.test.mjs`: live thread with a narrated home line, JSON save, reload, ring, answer, End, read-ahead: settles, no second hub line | mutations caught: no prefix-stripped match; the exported text altered |

## Runs

- `bin/test-js -j 3` under the lock: 519 files, 518 passed on the first run, the one failure (`phone-player-lines`, the n1 edit above) fixed and re-run, 0 failed.
- Rails under `flock /tmp/be-test-suite.lock`: `game_phone_calls_state_test.rb` 29 runs / 111 assertions, `reload_persistence_test.rb`, all `test/unit/break_escape/tts_*_test.rb` and the model directory: 0 failures.
- Lab SE (`proofs/A4_r1/se_dev/`, server :3024, keyless, stopped afterwards): `sha256_noseed` `dev_service_desk` `ffe4c083...` and `ruth_phone` `52c50b7a...`, identical to A0/A3/A4 after the call and after the reload; the four `/tts` lines identical; `se_phone_contacts.png` SHA-256 `d30d40ce...`, byte-identical to `A4/se_dev`; `history_after_reload.json` no call rows.

## Left open

- Nits not on the list: n2 (flat `pendingCall` shape), n4's small test gaps (withheld reload row, `reload: true`, the clone, once guard, two forced entries, badge and `gameTime` on a row), n5 (for A6: a kept callback overwritten by the ringer's next save), n6 (rows count toward the 150 cap, for the A7 README).
- m2 has no live proof, only unit and Rails tests (a contact with no thread whose slot is cleared by the ending needs a route that A5's scenario changes may serve better).
- Not blocked by A5 at any point.
