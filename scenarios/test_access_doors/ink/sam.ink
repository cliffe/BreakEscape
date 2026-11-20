VAR hub_quiet = false
=== start ===
# speaker:npc
Morning. This is the door test floor: five beats, one sign at each.
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else{&?|, then?| I can help with?}
}
+ [What is this place?]
    # speaker:npc
    Every door here takes a card. Some want one card in particular, some want anyone in the right job.
    # speaker:npc
    The card copier is on the table and the visitor card is on my desk. Read the signs as you go.
    -> hub
+ [Where are the beats?]
    # speaker:npc
    Finance is north, IT is east, security is south and the plant area is west.
    # speaker:npc
    The visitor room is off the IT lobby, through its north door.
    -> hub
+ [I'll get started.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Good luck.
    -> hub
