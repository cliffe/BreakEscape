VAR hub_quiet = false
VAR lent_phone = false
VAR lent_briefcase = false
VAR opened_plant = false
=== start ===
# speaker:npc
Gordon Pike, site manager. Yes?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ {not lent_phone} [Could I borrow your phone for a minute?]
    #give_item:phone_friendface
    # speaker:npc
    Fine. Do not lose it.
    ~ lent_phone = true
    -> hub
+ {not lent_briefcase} [Could I take your briefcase?]
    #give_item:briefcase
    # speaker:npc
    Take it. The code is on the note over there, I never remember it.
    ~ lent_briefcase = true
    -> hub
+ {not opened_plant} [Could you let me into the plant room?]
    #unlock_door:plant_room
    # speaker:npc
    Go on, I will buzz you through.
    ~ opened_plant = true
    -> hub
+ [Nothing, thanks.] #exit_conversation
    # speaker:npc
    Right.
    -> hub
