// test_phone_calls, contact caller_replace
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Replace here.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== old_call ===
// lint: call-knot
This is the old call. You should not hear it.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE

=== new_call ===
// lint: call-knot
This is the newer call, the only one that should ring.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
