# Handover: A6 (callback and voicemail, reload mid-call)

Branch `build/phone-calls`, started at 8ec328b28. Server :3024 stopped. Commits: `1668894b0` (engine, tests, scenario, extractor), the M1 commit (reload mid-call), and the proofs commit carrying this note.

## Done
- **Callbacks live in the ringer** (`phone-ringer.js`): `callbacks` Map `{ knot, callLabel }` per contact; `leaveMissed(o, { answered, quiet })` runs after the row on Decline, ring-out, Hang up, the hold limit, `giveUp` and row 32. Default `onMissed` leaves a callback; a withheld caller leaves nothing; `answered` (row 32, give-up) is always a callback; a forced call is never missed. Row 7: a new offer ringing clears the callback (`startRinging`); one queued keeps it. `callbackFor`, `restoreCallback`, `missedOffline(npcId, rec)` (reload), `refreshSave`. The slot carries the callback as `live` `{ state: "missed" }` whenever the contact has no offer of its own (A4 R2 n5). A callback dial that connects clears it and emits `phone_call_answered` with `callback: true` (plan 3.4); a callback connect cut by something else is left again.
- **Adapter**: `callButtonFor` reads "Call back" (`Call <name> back`) for a pending callback, with or without a `call` block; `placeCall` dials it (header, `#place_call` bare, `#place_call:<callback knot>`), `call_is_callback` true through the existing `connecting` path. `voicemail` and `callbackChanged` effects.
- **UI**: the latest "Missed call" row carries a "Call back" button while a callback is pending (`PhoneChatUI.refreshRowCallBack`, refreshed by `setCallButton`); CSS.
- **Voicemail**: `PhoneChatConversation.runVoicemail` (restore the saved story, go to the knot, continue to the end, tags to `applyTags`, "Voicemail" row, lines as unread `npc` messages, then `goToKnot(home)` and one save; `currentKnot` put back). `NPCManager.runVoicemail` (dynamic imports, one run at a time per contact, toast "New voicemail from <name>" or "New voicemail" when withheld, none after a reload; draws live into an open thread).
- **Reload** (`npc-manager.js`): `_resumePendingCall` now restores a saved callback, runs `onMissed` for a missed live call (no toast) and calls `ringer.refreshSave`, which schedules the debounced sync (A4 R2 m1). **A5 R1 M1** (option b): `_resumeMidCallStory` runs after it for every contact not resuming a forced call; when `currentKnot` is one of the contact's ringer call knots (`call` entries, `ring` mappings, timed `ring`, never a legacy voiced call) it puts `currentKnot` back to `homeKnot` and `PhoneChatConversation.resetToHome` moves the saved story to the home knot. An outgoing call cut by a reload leaves no row (decision: no time on the line is known); an incoming one already gets "Missed call".
- **Server**: `TtsLineExtractor.voicemail_knots` and a branch in `each_host_line` yield the `voice:` lines of voicemail knots, prefix stripped, under the contact's id, no delivery note. No change to `game.rb` (the A4 cleaner already keeps `state: "missed"`).
- **Tests** (all pass; `bin/test-js -j 3` 523 files, 0 failed; Rails TTS and phone-state 51 runs, 0 failed): `phone-callback-ringer` (17), `phone-callback-dom` (16), `phone-callback-ui` (4), `phone-voicemail-run` (8), callback half of `phone-call-vars` (3), `tts_line_extractor_voicemail_test` (5). Three A4/A2 persistence and ringer tests changed to expect the callback slot instead of an empty one. I wrote the code and tests in the same pass, so only the M1 tests were watched failing first (4 failures before the code). No new static import.
- **Scenario**: `caller_voicemail` (withheld) and `caller_terminal` (terminal look) in `test_phone_calls`; validator 0 errors, same warnings. README rows added.
- **Live**: `tools/phone_calls/routes/a6_live.sh`, `proofs/A6/README.md`.

## Open
- A reviewer pass over A6.
- Not live: `onMissed: "voicemail"` after a reload (unit-tested, `quiet: true`); a voicemail while the contact's own thread is open (lines are drawn live, but that open minigame holds its own story and its next save overwrites the voicemail's home-knot save, losing ink-local VARs the knot set); the hold-limit callback toast.
- The late-registered-contact M1 test is weak (`<= 1` resets).
- DM list screenshot was not retaken (nothing there changed).
- A7 (validator rules for `onMissed`, `voicemailKnot`, `withheld`; README) not started. Review m1 to m3 of A5 R1 are queued for after A6.

## Gotchas
- The voicemail row and the lines are added only after the story loads, so a thread opened in that instant shows the old state.
- `reload_forced` (a4 route) still resumes on its choice: the mid-call reset skips contacts with a restored forced slot.
- The `voicemail_tts.jsonl` proof file holds two runs.
- `dungeon_graph.*` files were left alone (the validator regenerated `test_phone_calls`'s; not committed).
