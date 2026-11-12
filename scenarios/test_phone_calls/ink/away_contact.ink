// test_phone_calls, contact away_contact (A5: `call` with a `when`, unavailable "no_answer")
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Away here. I am not always at my desk.
+ [Anything new?]
    Nothing new. Try my line.
    -> start

=== away_call ===
// lint: call-knot
You caught me at my desk.
+ [Thanks.]
    Anytime.
    #exit_conversation
    -> DONE
