// test_phone_calls, contact caller_basic
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Basic here. Text me if you need anything.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start

=== ring_call ===
// lint: call-knot
{
- call_is_callback: Thanks for ringing back.
- call_answer_seconds > 10: There you are. I was about to give up.
- else: Good, you're there.
}
I only wanted to check the line works.
+ [Keep talking.]
    Then listen carefully. This is the middle of the call.
    -> after_choice
+ [Finish it here.]
    Right. That is the whole call.
    -> DONE
+ [Hang up politely.]
    Understood. Goodbye.
    #exit_conversation
    -> DONE

=== after_choice ===
Nothing else to add.
+ [Thanks.]
    Anytime.
    -> DONE
