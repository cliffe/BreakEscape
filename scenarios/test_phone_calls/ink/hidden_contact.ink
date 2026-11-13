// test_phone_calls, contact hidden_contact (A5: `call` with a `when`, unavailable "hidden": no button until it holds)
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Hidden here. You can only ring me once I am in.
+ [Anything new?]
    Nothing new.
    -> start

=== hidden_call ===
// lint: call-knot
Now you can reach me.
+ [Thanks.]
    Anytime.
    #exit_conversation
    -> DONE
