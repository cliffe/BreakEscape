# Phone calls plan: R5 outcomes

| Id | Severity | Outcome | Where in the plan |
|---|---|---|---|
| V1 | major | Fixed with the ink move, no engine change. `#complete_task:call_in_after_sweep` moves from `extract_go` onto the `[Bring me in.]` reply line in m03, m04, m05 and m06 (all four have the same pattern, checked in the ink: reply at `:605`, `:451`, `:971`, `:605`; task at `:617`, `:463`, `:988`, `:617`). C33 records that "Keep going" no longer holds the ending; the player rings HaX again from the hub choice that placed the call (the `extract_call` entry has `button: false`, so the call button alone does not reach it). Proof run added: nothing optional open, no question; and Keep going, hang up, ring again, `[On my way.]`. | 7.2 m03 to m06 rows; 9.1 C33; section 8 step 4; slices M4, M5, M7, M10 |
| V2 | major | Fixed. The `ring` half of 4.2 (client `callStartKnots`, server `call_start_knots`, `voiced_phone_call?`) moves into A2b, with parity and Rails test cases and `caller_basic` written with `ring` and no `voiced`. A5 keeps the `call` entries only. | 4.2; A2b; A5; 5.1 parity row |
| v3 | minor | Fixed. `_callFinished` flag set when a ringer call's story-end branch schedules the close; `cleanup` resets when not forced or `_callFinished`; the end hook treats it as row 25; test case added. | 2.5 "Ending"; 2.3 row 32; A2b; 5.1 `phone-outgoing-call` |
| v4 | minor | Fixed. `callActive()` is read live from the framework (call's minigame is `currentMinigame` and not `_ending`, or in the open delay), with the drain ordering cited; test case added. | 2.2; 5.1 `phone-ringer`, `phone-ring-layer` |
| v5 | minor | Fixed. 2.5 says only the after-choice path checks `#exit_conversation`; A2b adds the check to `_presentOutput` for ringer calls; both paths tested. | 2.5 "Ending"; A2b; 5.1 `phone-outgoing-call` |
| v6 | minor | Fixed. "reset the story and" removed from A2a. | A2a |
| v7 | minor | Fixed. The `extract_offer` to `extract_call` rename, with the agreement of entry, tag and knot name (4.3), is stated in all four rows; 7.6 header names it. | 7.2 m03 to m06 rows; 7.6 header |
| v8 | minor | Fixed. m04 opening is now "Past the gate it's forensics' site, not ours. Anything you want, take it now." | 7.6 m04 row |
| v9 | minor | Fixed. `scripted-conversation-queue` added to the must-pass list and to A2b's accept list. | 5.1; A2b |
