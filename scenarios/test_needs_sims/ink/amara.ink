=== start ===
# speaker:npc
Morning. I'm at my desk, apart from the coffee runs.
-> hub

=== hub ===
+ [What are you up to?]
    # speaker:npc
    Emails. When my mug's empty I go to the coffee station by the door.
    # speaker:npc
    If a parcel turns up on the floor, I'll take it to my desk and open it.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Cheers.
    -> hub
