# A8 live proof: ringtone

Keyless server on :3026 (stopped), headless, `test_phone_calls` game 1499. `soundManager.play` and `stop` were wrapped in the page to log `phone_*` calls (`[call, name, loop, performance ms]`); `sounds.phone_ringtone.isPlaying` read back after each step.

| Step | Log | isPlaying | Shot |
|---|---|---|---|
| Sound manager | `sounds.phone_ringtone` loaded, `getVolumeForSound` = 0.6 (the notifications volume) | | |
| caller_basic rings (lever_basic_again) | `play phone_ringtone loop=true` at 44458 | true | `answer_ringing.png` |
| Answer | `stop phone_ringtone` at 53610; call opens (PhoneChatMinigame) | false | `answer_call_connected.png` |
| caller_decline rings | `play ... loop=true` at 68886 | true | `decline_ringing.png` |
| Decline | `stop` at 77731 | false | `decline_after_decline.png` |
| Timeout (first ring left alone 20 s) | `stop` at 32032, one stop with no replay | false | |

Loop stays on one `play` per ring (no restart every 2 s). Session and /tts logs: `basic_*`.
Lab SE: `grep ringtone|phoneRinger` over `scenarios/lab_social_engineering` finds nothing; its calls are not ringer calls.

R2 m1 (2026-11-12): plan 2.4's "`phone_vibrate` once per cycle" is dropped on purpose. The looped ringtone covers the cycle, and `phone_vibrate` stays only as the fallback when the ringtone has not loaded (every 2 s). The other exits (minigame, popup, knockout, `close()`, pause menu, hidden tab) are tests in `test/js/phone-ring-layer.test.mjs` ("A2b R2 m1").
