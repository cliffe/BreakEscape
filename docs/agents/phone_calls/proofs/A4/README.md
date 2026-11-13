# A4 live proofs (keyless :3025, `tools/phone_calls/routes/a4_live.sh`, `se_dev.sh`)

Logs `<route>.log`, shots `<route>_*.png`, server dumps `reload_*_server.json` (the saved `phoneState` for the contact, taken after `stateSync.sync()`).

| Route | Result |
|---|---|
| `rows` | Decline: "Missed call" unread (`caller_basic`). Answer then End after 5 s: "Incoming call, 0:05", read (`caller_thread`). Ring-out (25 s): "Missed call" unread, `missed_seen` set (`caller_decline`). Contact list: preview "Missed call" in red (`rgb(192, 57, 43)`), unread badge counts it, the phone item badge counts it; opening the thread draws the row (`message-call-row missed`) and the badge drops. Shots `rows_contacts.png`, `rows_thread_missed.png`, `rows_thread_incoming.png`. |
| `reload_ringing` | `caller_decline` saved as `live` `ringing`; after reload: no ring, one unread "Missed call", `pendingCall` null, `missed_seen` true (the `phone_call_missed` mapping fired after `game_loaded`). |
| `reload_held` | `caller_hold` answered over the keypad, saved `held`; after reload: unread "Missed call", no ring, no pill. |
| `reload_connected` | `caller_thread` on the line, saved `connected` (`reload_connected_server.json`); after reload: unread "Missed call", nothing open. |
| `reload_forced` | `caller_forced` on the line, saved as `forced[0]` `connected`, `answerSeconds` 6; after reload it rings again (t+1, t+2) with `answerSeconds` 6, auto-answers, and is connected and open from t+3. No row. |
| `reload_timed` | `timed_caller` reloaded 1.5 s into its ring: after reload one "Missed call", no second ring over 16 s, `timed_ringing` set, the delivered id `conv:timed_caller:ring_call:0` is in the saved `timedMessages.delivered`. |
| `settle` | `caller_thread`: Answer, End with the phone closed, sync, reload, then the thread: home line once, the "Incoming call, 0:03" row, choices `1. Anything new? 2. Tell me more.`; a second open is identical. (`settleOnSeenLines` works on history restored from the server.) |
| `se_dev/` (lab SE) | `sha256_noseed` for `dev_service_desk` (`ffe4c083...`) and `ruth_phone` (`52c50b7a...`) identical to `A3_r1/se_dev` after the call and after reload; four `/tts` lines as before; `se_phone_contacts.png` byte-identical to `A0` and `A3_r1`; `history_after_reload.json`: no call rows in either thread (Dev 8 messages, types npc and player; Ruth 1). |

Not run: the old `reload_*` routes were first run before `sync_now` existed; their reloads worked because the unload flush or the periodic sync had saved the slot (`reload_ringing_server.json` is `null` for that reason). The reload routes are the ones to re-run if the sync path changes.
