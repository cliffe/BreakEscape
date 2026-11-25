// Shared test ink for scenarios/test_npc_walk_in_out: every walker uses it.
// "arrival" is the knot the case (f) mapping opens when the inspector reaches his spot.

=== start ===
# speaker:npc
Just passing through. Carry on.
-> hub

=== hub ===
+ [Where have you come from?]
    # speaker:npc
    Next door. I walked, same as anyone.
    -> hub
+ [Thanks, that's all.] #exit_conversation
    # speaker:npc
    Right you are.
    -> hub

=== arrival ===
# speaker:npc
Ah, you found the inspection notice. I came straight over to talk you through it.
-> hub
