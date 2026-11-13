// test_phone_calls, contact caller_terminal (A6): the terminal-look twin of caller_voicemail, not withheld. Declined or missed, it leaves a
// voicemail: ring_vm runs silently into the thread and sets heard_vm, which the home knot reads on
// the next open.
VAR call_answer_seconds = 0
VAR call_is_callback = false
VAR heard_vm = false

=== start ===
{heard_vm:
    Terminal line. You listened to my message. Good.
- else:
    Terminal line. Nothing to say yet.
}
+ [Anything new?]
    Nothing yet. Wait for my call.
    -> start

=== ring_call ===
// lint: call-knot
Terminal here. You picked up this time.
+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE

=== ring_vm ===
// lint: call-knot
~ heard_vm = true
voice: You did not pick up. The terminal will keep it.
voice: Leave this with me. I will ring again.
-> DONE
