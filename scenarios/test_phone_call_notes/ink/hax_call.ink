// test_phone_call_notes: a voiced call whose lines carry #delivery: notes, on the paths that used to
// speak them untagged (A1 R1 M1). note_call opens on a tagged line; if `alarm` is set while the
// thread is closed, the reopen re-runs the knot and `alarm_lines` is new, so its notes must reach /tts.
VAR call_started = false
VAR alarm = false
VAR seen = false

=== hub ===
+ [Anything else?]
    Agent HaX: Nothing yet.
    -> hub

=== note_call ===
~ call_started = true
Agent HaX: Listen carefully. #delivery: low and even
- (opts)
{alarm and not seen: -> alarm_lines}
+ [Go on.]
    Agent HaX: Noted. That is all.
    #exit_conversation
    -> DONE

=== alarm_lines ===
~ seen = true
Agent HaX: The alarm just went off. #delivery: urgent and clipped
Agent HaX: Now, where were we?
-> note_call.opts
