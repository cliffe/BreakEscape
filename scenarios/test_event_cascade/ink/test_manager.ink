=== start ===
# speaker:npc
I'm managing the ward operations today. Everything under control.
-> hub

=== hub ===
* [Anything unusual going on?]
    -> situation_report
+ [I'll let you get on with it.] #exit_conversation
    # speaker:npc
    Thank you. Things are busy but manageable.
-> hub

=== situation_report ===
# speaker:npc
Normal operations for now. We have protocols in place if anything escalates.
-> hub

=== idle ===
# speaker:npc
I'm managing the ward operations.
-> hub

=== escalation_protocol ===
# speaker:npc
ESCALATION PROTOCOL ACTIVATED — Initiating command response procedures immediately.
-> hub
