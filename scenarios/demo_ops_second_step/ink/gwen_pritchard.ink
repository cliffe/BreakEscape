// Gwen Pritchard, records manager. Owner of the second step on the records room and archive store doors.
VAR met_gwen = false

=== start ===
{ met_gwen:
    -> hub
}
~ met_gwen = true
# speaker:npc
Records. You need the door code, and you need my say-so.
-> hub.choices

=== hub ===
# speaker:npc
What can I do for you?
- (choices)
+ [Why do the records doors need your approval?]
    # speaker:npc
    A code can be copied. A request to my phone is meant to be harder.
    -> choices
+ [Do you always carry your phone?]
    # speaker:npc
    When I'm away from my desk it sits on the charger by the east wall. Old habit.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Mind the boxes.
    # exit_conversation
    -> END
