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

// Slice 15 (OFFICE_LIFE_PLAN 11.4): a scripted exchange, played once by the needs system when
// Tom and Amara chat (the coffee queue) after she has opened the parcel, with the player in
// earshot. Never reached from the player's conversation.
=== exchange_tom_parcel ===
Tom: Was that parcel on the floor for you?
Amara: It was. New headsets for the team.
Tom: Any chance of one before Friday?
Amara: Get in the queue, Tom.
-> DONE
