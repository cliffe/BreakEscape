VAR hub_quiet = false
=== start ===
# speaker:npc
Morning. This is the sign-in test floor: eight beats, a sign at each.
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
    Every PC here wants you to sign in. Each one shows a different sign-in screen.
    # speaker:npc
    Whatever you can do there depends on whose account you use.
    -> hub
+ [Where are the beats?]
    # speaker:npc
    The hot desk is north, the IT office east, the known-people PC south and the lockout PC west.
    # speaker:npc
    Finance is through the IT office, on its east side.
    -> hub
+ [I'll get started.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Good luck.
    -> hub
