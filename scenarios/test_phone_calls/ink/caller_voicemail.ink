// test_phone_calls, contact caller_voicemail (A6): a withheld call. Declined or missed, it leaves a
// voicemail: ring_vm runs silently into the thread and sets heard_vm, which the home knot reads on
// the next open.
VAR call_answer_seconds = 0
VAR call_is_callback = false
VAR heard_vm = false

=== start ===
{heard_vm:
    Unknown number. You listened to my message. Good.
- else:
    Unknown number. Nothing to say yet.
}
+ [Anything new?]
    Nothing yet. Wait for my call.
    -> start

=== ring_call ===
// lint: call-knot
You picked up this time. Good.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE

=== ring_vm ===
// lint: call-knot
~ heard_vm = true
voice: You did not pick up. That is fine.
voice: Leave this with me. I will ring again.
-> DONE
