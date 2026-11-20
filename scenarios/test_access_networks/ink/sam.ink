VAR hub_quiet = false
=== start ===
# speaker:npc
Morning. This is the network test floor: twelve beats, a sign at each.
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
    A small office with two networks. The drop box on the table plugs into a wall port and shows you what the network around it exposes.
    # speaker:npc
    What you can open from there still depends on whose password you have.
    -> hub
+ [Where are the beats?]
    # speaker:npc
    The comms room is north, the workshop west and the desks east. The store, the kiosk and finance are off the desk room.
    -> hub
+ [I'll get started.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Good luck.
    -> hub
