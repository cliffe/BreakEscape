// neil_print_asked is a scenario global, synced into this VAR on load, and set by the change-log
// choice below. Gating the ask on it stops Neil promising a second print that never comes (M4).
VAR neil_print_asked = false
// neil_page_on_tray mirrors the change-log slot: an eventMapping sets it true when the page lands
// (object_revealed:it_out_a), the page's onRead clears it when the player takes it, and a
// game_loaded mapping clears it on reload. The engine owns the slot's own reveal global, so we keep
// this flag instead. The "ready" line below branches on it so Neil only claims the page is on the
// tray when it really is: not yet printed, taken, or after a reload all read false (R2 M2).
VAR neil_page_on_tray = false

=== start ===
# speaker:npc
Alright? Neil, IT support. I'm parked here by me mug, so give us a shout.
-> hub

=== hub ===
+ {not neil_print_asked} [Could you print the change log?]
    # speaker:npc
    The change log? Aye, no bother. I'll fire it at the copier now, give us a sec.
    #set_global:neil_print_asked:true
    ~ neil_print_asked = true
    -> hub
+ {neil_print_asked} [Is that change log ready?]
    # speaker:npc
    { neil_page_on_tray:It's on the copier tray, pet. Help yourself.|Have a look on the copier tray, pet. It'll be there if it's come through.}
    -> hub
+ [What do you look after?]
    # speaker:npc
    The whole floor. Laptops, the copier, the kettle that keeps tripping. All of it.
    -> hub
+ [How's the coffee?]
    # speaker:npc
    Lukewarm at best. I never get to the bottom of it before something kicks off.
    -> hub
+ [Quiet day?]
    # speaker:npc
    There's always something on the go. I like it better that way, mind.
    -> hub
+ [I'll let you get on.]
    # speaker:npc
    No bother, pet. Mind the cables on your way out.
    # exit_conversation
    -> END
