// test_phone_calls, contact caller_queue
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Queue One here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
First caller on the line.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
