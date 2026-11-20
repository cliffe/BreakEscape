# A6 live proofs (callback, voicemail, reload mid-call)

Server: keyless :3024, headless, stopped at the end. Routes: `tools/phone_calls/routes/a6_live.sh <route>` (`PC_PORT=3024`); `reload_forced` is `a4_live.sh reload_forced` with `OUT` here. Logs are `<route>.log`, shots `<route>_<name>.png`, `/tts` requests `<route>_tts.jsonl` (the keyless server answers 503; the request list is the evidence). `voicemail_tts.jsonl` also holds the first, abandoned run (the route was fixed to tap each bubble in turn).

| Route | Shows |
|---|---|
| `patient` | `caller_patient` rings 30 s, Decline: "Missed call" row, callback `{ knot: ring_call }`, slot `live.state: "missed"`, header "Call back" and the row's button |
| `decline` | `caller_decline`: header "Call back" and the row's own button (aria `Call Caller Decline back`) each connect to `ring_call` at once; the `call_is_callback` line "Thanks for ringing back." is on screen and its `/tts` request is `caller_decline` (3 requests over 3 connects); the callback clears on connect; after End the header is gone; a new ring clears a pending callback (row 7); after a reload the button, the callback and the VAR line (third connect) are back |
| `debrief_ko` | `caller_debrief` answered, then `closeMinigameForKnockout()` (the knockout path's own close): `phone_call_missed`, callback left, thread on its home knot with its hub choices, calling back plays "Thanks for ringing back." (voiced) |
| `voicemail` | `caller_voicemail` (withheld): banner "No caller ID"; Decline leaves "Missed call: No caller ID", "Voicemail", two voice bubbles; toast "New voicemail"; no callback; tapping each bubble asks `/tts` for its text under `caller_voicemail`; the home knot read `heard_vm` (set by the voicemail knot) and says "You listened to my message" |
| `terminal` | `caller_terminal`, the same in the terminal look, not withheld: toast "New voicemail from Caller Terminal"; both lines requested under `caller_terminal`; the VAR line shows |
| `midcall_out` | A5 R1 M1, outgoing: reload on the call's choices; after it `currentKnot` is `start` (client and server), the thread shows the home hub and no "Keep talking."/"Goodbye." choices, no row |
| `midcall_in` | A5 R1 M1, incoming: reload while connected: "Missed call" row, callback, `currentKnot` `start`, thread on its hub with no call choices |
| `reload_forced` | a forced call still rings again and resumes on its choice (the skip for a restored forced slot) |
| `se_dev/` | lab SE: `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`) after the call and after the reload equal A5's; `se_phone_contacts.png` identical; the four `/tts` lines identical |

Key identity: `TTS_DUMP_CHATTER=1` dumps at e252ac7b4 and at this branch: only `test_phone_calls` moves (+5 keys: the voicemail lines, the two call lines); every other scenario is identical. Dump of the new state: `keys_new_a6/`.
