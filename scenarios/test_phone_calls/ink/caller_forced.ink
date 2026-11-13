// test_phone_calls, contact caller_forced (A2c: forced)
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Caller forced here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
This is the forced caller. You can hear me now.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
