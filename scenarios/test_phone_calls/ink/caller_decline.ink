// test_phone_calls, contact caller_decline
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Decline here. I will try again later.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
{
- call_is_callback: Thanks for ringing back.
- else: Glad you picked up.
}
That is all.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE
