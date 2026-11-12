// A6 fixture: a contact with a home hub, a call knot and two voicemail knots (phone calls plan 2.6).
VAR call_answer_seconds = 0
VAR call_is_callback = false
VAR heard_vm = false
VAR vm_count = 0
VAR vm_global_flag = false

=== start ===
Home line one.
* [Anything new?]
    Nothing yet.
    -> start
+ [Bye.]
    #exit_conversation
    -> DONE

=== ring_call ===
// lint: call-knot
{call_is_callback: Thanks for ringing back.|Glad you picked up.}
-> DONE

=== ring_vm ===
// lint: call-knot
~ heard_vm = true
~ vm_count += 1
#set_global:vm_heard:true
voice: You let it ring.
voice: Call me when you can.
-> DONE

=== other_vm ===
// lint: call-knot
{heard_vm: voice: I already left one.|voice: First message.}
-> DONE
