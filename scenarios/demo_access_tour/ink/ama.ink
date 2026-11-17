// Ama Owusu, Merrin & Sallow's practice manager. Three jobs, chosen in ink:
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
Ama Owusu: And there's a cake in your bag. Put it down in the open plan when you want people away from their desks.
Ama Owusu: I'll stay here. If you're stuck, check your phone. I'll text if I think of anything.
# complete_task:t_meet_ama
-> route_choice

=== route_choice ===
Ama Owusu: The quick version, or the full walk-round?
+ [Quick version.]
    Ama Owusu: Quick it is. Doors, a desk, the box, and back to me.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [The full walk-round.]
    ~ tour_full = true
    Ama Owusu: The full walk-round, then. Every room, every gadget.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== hub ===
{ tour_debriefed or done_t_debrief: -> written_up }
{ wrap_open(): -> debrief }
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Ama Owusu: Not done yet. Your phone's got the list. I'll be here.
}
+ { not tour_full } [Actually, show me the full walk-round.]
    ~ tour_full = true
    Ama Owusu: Go on then. Your phone will keep you right.
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
        Ama Owusu: Go on. I'll be here.
    - else:
        Ama Owusu: The box is out, so the network stops are done for today. The doors and desks are all still there if you want them.
    }
    #exit_conversation
    -> debrief
+ [I'm done, let's talk. #ending_check]
    -> recap

=== recap ===
Ama Owusu: The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's held because nobody copied his.
Ama Owusu: The box got you onto the network, and Julian's saved connection did the rest. His door never came into it.
{
- julian_ended_by_unplug:
    Ama Owusu: And when the box came out, everything you'd opened through it went with it.
    { tour_full:
        Ama Owusu: The desks you'd sat at stayed signed in.
    }
- julian_lost_with_desk and not julian_back:
    Ama Owusu: You connected to Julian's from Delphine's desk, so when you signed out there, his went too.
- else:
    Ama Owusu: Julian's session stayed up when the box came out. You'd connected from a desk you were signed in at, so it never needed the box. That's the bit people miss.
}
Ama Owusu: Thanks. I'll write it up for the partners.
# set_global:tour_debriefed:true
# complete_task:t_debrief
# exit_conversation
-> END
