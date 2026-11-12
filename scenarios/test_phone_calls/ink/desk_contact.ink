// test_phone_calls, contact desk_contact (A5: a `call` list on a contact the player rings)
// Entries: desk_call (the header button), extract_call (button: false, dialled by the hub choice).
VAR call_answer_seconds = 0
VAR call_is_callback = false
VAR desk_calls = 0

=== start ===
Desk here. Ring me from the header, or ask below.
+ [Anything new?]
    Nothing new at the desk. Ring me when it matters.
    -> start
+ [I'm done here. Close the file.]
    #place_call:extract_call
    -> DONE

=== desk_call ===
// lint: call-knot
~ desk_calls += 1
{
- call_is_callback: Thanks for ringing back.
- desk_calls > 1: Back again. This is the desk line, second time round.
- else: Desk line. Go ahead.
}
+ [Keep talking.]
    These are the call's own lines, not the thread's.
    -> more

+ [Goodbye.]
    Goodbye.
    #exit_conversation
    -> DONE

=== more ===
// lint: call-knot
That is all from the desk.
+ [Thanks.]
    Anytime.
    #exit_conversation
    -> DONE

=== extract_call ===
// lint: call-knot
You placed this one from the thread. Shall I close the file?
+ [Yes, close it. #ending_check]
    Closing it now. #set_global:end_go:true
    #exit_conversation
    -> DONE
+ [Not yet.]
    Take your time.
    #exit_conversation
    -> DONE
