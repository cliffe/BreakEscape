=== start ===
# speaker:npc
Morning. Don't mind me, I'm only after a coffee.
-> hub

=== hub ===
+ [Long shift?]
    # speaker:npc
    Long enough. I keep an eye on the floor while I'm up, mind.
    -> hub
+ [I'll let you get your coffee.] #exit_conversation
    # speaker:npc
    Ta.
    -> hub

// Opened by the lockpick_used_in_view catch (person-chat), when the player picks dee_drawer
// while Dee can see it.
=== on_drawer_picked ===
# speaker:npc
Oi. That's a locked cabinet, and I just watched you open it.
# speaker:npc
Step away from it. I've got your face now.
#exit_conversation
-> hub
