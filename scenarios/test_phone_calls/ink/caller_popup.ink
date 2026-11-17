// test_phone_calls, contact caller_popup (A2c: popup)
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Caller popup here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
This is the popup caller. You can hear me now.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
