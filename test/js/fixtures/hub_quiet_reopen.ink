// Fixture: a person-chat hub with a `quiet` flag (lab D9 shape).
// A topic sets quiet and returns to the hub; the hub consumes quiet and
// prints nothing, so the topic's last line is the last thing said.
VAR stage_two = false
VAR quiet = false
VAR greeted = false

=== start ===
{ greeted: -> hub }
~ greeted = true
Ruth: Morning.
-> hub

=== recheck ===
// Always emits a tag, as the lab's recheck does once any task is due: the tag after
// a topic's last line stops ink's lookahead there, so the tail runs on the next continue
#complete_task:stage_one_seen
{ stage_two:
    #complete_task:stage_two_seen
}
->->

=== hub ===
-> recheck ->
{
- quiet:
    ~ quiet = false
- stage_two:
    Ruth: Stage two now. Go to the workstation.
- else:
    Ruth: Stage one. Read the board.
}
+ [Tell me about the topic.]
    -> topic
+ [Bye.]
    #exit_conversation
    Ruth: Go on, then.
    -> hub

=== topic ===
Ruth: Topic line one.
Ruth: Topic line two, the last one.
~ quiet = true
-> hub
