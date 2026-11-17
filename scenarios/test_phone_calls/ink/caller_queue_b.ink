// test_phone_calls, contact caller_queue_b
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Queue Two here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
Second caller, after the first.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
