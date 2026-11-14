=== start ===
# speaker:npc
Alright? Neil, IT support. I'm parked here by me mug, so give us a shout.
-> hub

=== hub ===
+ [Could you print the change log?]
    # speaker:npc
    The change log? Aye, nee bother. I'll fire it at the copier now, give it a sec.
    #set_global:neil_print_asked:true
    -> hub
+ [What do you look after?]
    # speaker:npc
    The whole floor. Laptops, the copier, the kettle that keeps tripping. All of it.
    -> hub
+ [How's the coffee?]
    # speaker:npc
    Stone cold. I never get doon the bottom of it before summat kicks off.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Nee worries. Howay, mind the cables on your way oot.
    -> hub
