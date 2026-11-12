// test_phone_calls, contact caller_debrief (A5: also a `call` entry placed from the hub, the placed-call variant)
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Debrief here. Say the word and I will bring you in.
+ [Anything new?]
    Nothing yet. Ring me when it matters.
    -> start
+ [I'm ready. Ring the debrief line.]
    #place_call:ring_call
    -> DONE

=== ring_call ===
// lint: call-knot
{
- call_is_callback: Thanks for ringing back.
- else: It is time. Are you ready to be brought in?
}
+ [I'm done here. Bring me in.]
    Bringing you in now. #set_global:debrief_go:true
    Stay sharp in there, and say nothing you do not have to.
    #exit_conversation
    -> DONE
+ [Not yet.]
    Take your time, then.
    #exit_conversation
    -> DONE
