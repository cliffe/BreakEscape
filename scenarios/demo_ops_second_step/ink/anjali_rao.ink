// Anjali Rao, finance. Short staff chat; she keeps notes and a code fob.
VAR met_anjali = false

=== start ===
{ met_anjali:
    -> hub
}
~ met_anjali = true
# speaker:npc
Hi. Finance is a bit busy today.
-> hub.choices

=== hub ===
# speaker:npc
Can I help?
- (choices)
+ [Do you carry your code fob everywhere?]
    # speaker:npc
    I mean to. Then I get thirsty and leave it on my desk.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Thanks.
    # exit_conversation
    -> END
