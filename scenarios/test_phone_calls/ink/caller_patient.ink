// test_phone_calls, contact caller_patient
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Patient here. I will wait as long as it takes.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
{
- call_answer_seconds > 10: You took your time. I almost gave up.
- else: Good, you picked up quickly.
}
That is all I had.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
