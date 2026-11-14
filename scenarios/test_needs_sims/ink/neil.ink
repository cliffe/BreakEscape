// neil_print_asked is a scenario global, synced into this VAR on load, and set by the change-log
// choice below. Gating the ask on it stops Neil promising a second print that never comes (M4).
VAR neil_print_asked = false
// neil_page_on_tray mirrors the change-log slot: an eventMapping sets it true when the page lands
// (object_revealed:it_out_a), the page's onRead clears it when the player takes it, and a
// game_loaded mapping clears it on reload. The engine owns the slot's own reveal global, so we keep
// this flag instead. The "ready" line below branches on it so Neil only claims the page is on the
// tray when it really is (R2 M2).
VAR neil_page_on_tray = false
// neil_page_taken is a scenario global set true by the page's onRead when the player takes it, so
// the "ready" line can say "you've got it already" instead of sending them back to the tray (R3 m2).
VAR neil_page_taken = false
// job_called (SIMS-4): the player reports the staff room's flickering light; Neil radios it in, and
// the staff-room pair's "job called" exchange then has its gate.
VAR job_called = false
// staff_room_seen is a scenario global set by a room_entered:staff_room eventMapping, so the light
// choice is only offered once the player has been in the staff room and could have seen it (R3 m4).
VAR staff_room_seen = false
// asked_now is ink-only (not a scenario global): it marks that the print was asked for in this same
// chat, where nothing can have printed yet, so the "ready" line reads clumsily. The ended-story
// restart saves and restores ink variables, so it is reset in the start knot below, which the restart
// runs, rather than relying on the story ending (R3 m2).
VAR asked_now = false

=== start ===
~ asked_now = false
# speaker:npc
Alright? Neil, IT support. I'm parked here by me mug, so give us a shout.
-> hub.choices

=== hub ===
// A reopen after an X close re-navigates to this knot (person-chat-minigame.js), so the top line
// shows again as a fresh re-entry instead of the stale last reply (R3 m3). The start knot and every
// in-chat reply divert straight to the choices gather below, so this line only shows on a reopen.
# speaker:npc
Back again? What's up?
- (choices)
+ {not neil_print_asked} [Could you print the change log?]
    # speaker:npc
    The change log? Aye, no bother. I'll fire it at the copier now, give us a sec.
    #set_global:neil_print_asked:true
    ~ neil_print_asked = true
    ~ asked_now = true
    -> choices
+ {neil_print_asked} [Is that change log ready?]
    # speaker:npc
    {
        - asked_now && not neil_page_on_tray:
            Soon as you let me get back to it, pet.
        - neil_page_taken:
            You've got it already, pet.
        - neil_page_on_tray:
            It's on the copier tray, pet. Help yourself.
        - else:
            Have a look on the copier tray, pet. It'll be there if it's come through.
    }
    -> choices
+ [What do you look after?]
    # speaker:npc
    The whole floor. Laptops, the copier, the kettle that keeps tripping. All of it.
    -> choices
+ [How's the coffee?]
    # speaker:npc
    Lukewarm at best. I never get to the bottom of it before something kicks off.
    -> choices
+ [Quiet day?]
    # speaker:npc
    There's always something on the go. I like it better that way, mind.
    -> choices
+ { not job_called && staff_room_seen } [The staff room light's flickering.]
    # speaker:npc
    That tube again? I'll put it out on the radio for maintenance now.
    #set_global:job_called:true
    ~ job_called = true
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    No bother, pet. Mind the cables on your way out.
    # exit_conversation
    -> END
