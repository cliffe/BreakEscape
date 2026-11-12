// test_phone_calls, contact caller_thread (A3: rings inside the open phone)
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Thread here. This is the home knot.
+ [Anything new?]
    Nothing new on the thread. Ring me when it matters.
    -> start
+ [Tell me more.]
    Not much more. Still the home knot.
    -> start

=== ring_call ===
// lint: call-knot
This is the thread caller. You can hear me now.
+ [Keep talking.]
    These are the call's own lines, not the thread's.
    -> after_choice
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE

=== after_choice ===
Nothing else to add.
+ [Thanks.]
    Anytime.
    -> DONE
