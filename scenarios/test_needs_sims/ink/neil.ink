// neil_print_asked is a scenario global, synced into this VAR on load, and set by the change-log
// choice below. Gating the ask on it stops Neil promising a second print that never comes (M4).
VAR neil_print_asked = false
// job_called (SIMS-4): the player reports the staff room's flickering light; Neil radios it in, and
// the staff-room pair's "job called" exchange then has its gate.
VAR job_called = false

=== start ===
# speaker:npc
Alright? Neil, IT support. I'm parked here by me mug, so give us a shout.
-> hub

=== hub ===
+ {not neil_print_asked} [Could you print the change log?]
    # speaker:npc
    The change log? Aye, no bother. I'll fire it at the copier now, give us a sec.
    #set_global:neil_print_asked:true
    -> hub
+ {neil_print_asked} [Is that change log ready?]
    # speaker:npc
    It's on the copier tray, pet. Help yourself.
    -> hub
+ [What do you look after?]
    # speaker:npc
    The whole floor. Laptops, the copier, the kettle that keeps tripping. All of it.
    -> hub
+ [How's the coffee?]
    # speaker:npc
    Stone cold. I never get to the bottom of it before something kicks off.
    -> hub
+ [Quiet day?]
    # speaker:npc
    There's always something on the go. I like it better that way, mind.
    -> hub
+ { not job_called } [The staff room light's flickering.]
    # speaker:npc
    That tube again? I'll put it out on the radio for maintenance now.
    #set_global:job_called:true
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    No worries. Howay, mind the cables on your way out.
    -> hub
