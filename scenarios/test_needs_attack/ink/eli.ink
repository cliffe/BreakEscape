=== start ===
# speaker:npc
Hello. I don't move about much. The mug's right here, the work's right here.
-> hub

=== hub ===
+ [Could you print the handover notes?]
    # speaker:npc
    The handover? Course. I'll send it to the copier now, give it a minute to come through.
    #set_global:eli_asked:true
    -> hub
+ [How's the coffee?]
    # speaker:npc
    Cold. I never seem to get to the end of it before it goes cold.
    -> hub
+ [I'll leave you be.] #exit_conversation
    # speaker:npc
    Right you are.
    -> hub
