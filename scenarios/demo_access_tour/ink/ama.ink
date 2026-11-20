// Ama Owusu, Fenlow Managed IT's security lead, looking after Merrin & Sallow. Three jobs, chosen in ink:
//   start    the briefing on load (timedConversation), then the mid-tour hub
//   hub      mid-tour while wrap_open() is false
//   debrief  once the eight required tasks are done (wrap_open() true)
// LOAD-BEARING: #complete_task:t_meet_ama (briefing), #ending_check inside the brackets of
// "I'm done, let's talk.", and the closing tags on the last debrief line (#set_global:tour_debriefed:true,
// #complete_task:t_debrief, #exit_conversation). Every global read below is declared in globalVariables.
// Text only for now: nothing here is voiced yet. No {var} in a spoken line.

VAR met = false
VAR hub_quiet = false
VAR asked_round = false

VAR tour_full = false
VAR done_t_meet_ama = false
VAR done_t_kit = false
VAR done_t_front_desk = false
VAR done_t_copy_badge = false
VAR done_t_comms = false
VAR done_t_drop_box = false
VAR done_t_julian_pc = false
VAR done_t_unplug = false
VAR done_t_implant = false
VAR done_t_staff_wifi = false
VAR done_t_yasmin_pc = false
VAR julian_ended_by_unplug = false
VAR julian_lost_with_desk = false
VAR julian_back = false
VAR tour_debriefed = false
VAR done_t_debrief = false

=== function wrap_open() ===
~ return done_t_meet_ama and done_t_kit and done_t_front_desk and done_t_copy_badge and done_t_comms and done_t_drop_box and done_t_julian_pc and done_t_unplug

=== start ===
{ met: -> hub }
~ met = true
Ama Owusu: Morning. You found us. This is Merrin & Sallow, and for the next little while you're my tester.
Ama Owusu: The partners want to know how far someone gets with a visitor badge and a bag of kit. So do I.
Ama Owusu: Your kit's in the meeting room. The visitor card opens that door and nothing else, in theory.
Ama Owusu: And there's a cake in your bag. Put it down in the open plan and see if it gets anyone away from their desk.
Ama Owusu: I'll stay here. If you're stuck, check your phone. I'll text if I think of anything.
# complete_task:t_meet_ama
-> route_choice

=== route_choice ===
Ama Owusu: The quick version's about fifteen minutes. The full walk-round is nearer thirty-five, every room and every gadget. Which?
+ [Quick version.]
    Ama Owusu: Quick it is. Doors, a desk, the box, and back to me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [The full walk-round.]
    ~ tour_full = true
    Ama Owusu: The full walk-round, then. Most people only see half of it.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== hub ===
{ tour_debriefed or done_t_debrief: -> written_up }
{ wrap_open(): -> debrief }
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Ama Owusu: Still going? Your phone will tell you where next.
}
+ { not tour_full and not done_t_unplug } [Actually, show me the full walk-round.]
    ~ tour_full = true
    Ama Owusu: Go on then. There's plenty more to see.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [Right, back to it.]
    Ama Owusu: Good luck.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== written_up ===
Ama Owusu: It's all written up. Thanks again.
#exit_conversation
-> END

=== debrief ===
{ asked_round:
    Ama Owusu: Anything else, or shall we talk it through?
- else:
    Ama Owusu: Right. Before we wrap up, anything else you want to try?
}
+ [I'll have another look round.]
    ~ asked_round = true
    { tour_full:
        Ama Owusu: Have a proper look. I'll be right here when you're done.
    - else:
        Ama Owusu: Go on. The box is out, so anything that needed it in the wall is done for today. The rest is still there.
    }
    #exit_conversation
    -> debrief
+ [I'm done, let's talk. #ending_check]
    -> recap

=== recap ===
Ama Owusu: The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's door held only because nobody copied his card.
Ama Owusu: A saved connection on the front desk got you into Julian's PC. His door never came into it.
{
- julian_ended_by_unplug:
    Ama Owusu: And when the box came out, everything you'd opened through it went with it.
    { done_t_implant or done_t_staff_wifi or done_t_yasmin_pc:
        Ama Owusu: Anything you'd reached another way didn't need the box.
    }
- julian_lost_with_desk and not julian_back:
    Ama Owusu: You connected to Julian's from Delphine's desk, so when you signed out there, his went too.
- done_t_julian_pc:
    Ama Owusu: Julian's session didn't go with the box. Connect from a desk you're signed in at and it never needs the box. That's the bit people miss.
- else:
    Ama Owusu: Pulling the box ends what ran through it. Anything you reached another way stays up. That's the bit people miss.
}
Ama Owusu: Thanks. I'll write it up for the partners.
# set_global:tour_debriefed:true
# complete_task:t_debrief
# exit_conversation
-> END
