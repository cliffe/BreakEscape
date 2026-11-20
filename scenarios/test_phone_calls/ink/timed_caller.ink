// test_phone_calls, contact timed_caller
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Timed here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
This call came in on a timer, before you did anything.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
