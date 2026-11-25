// Ops demo (recon) host: Ama Owusu of Fenlow Managed IT (person, office aisle).
// Hub knot is `hub`; levers, "What's next?", recaps and the short version divert back to it.
// Contract: SHOWCASE_PLAN.md 8.3.1 (recon). Every VAR below is a scenario global that the
// scenario file declares with the same initial value, synced in when the conversation starts;
// met_ama is the only ink-local VAR (first-meeting line plays once, as in office_life_showcase).
// coffee_call is a counter: the lever adds one and stays offered, so every press is a change.

VAR coffee_call = 0
VAR act_midday = false
VAR act_evening = false
VAR plug_in_done = false
VAR sweep_done = false
VAR scan_printer_done = false
VAR confirm_both_done = false
VAR use_card_done = false
VAR terminal_view_done = false
VAR open_share_done = false
VAR read_log_done = false
VAR met_ama = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
Merrin and Sallow want to know what an outsider could learn from one spare network socket.
# speaker:npc
This drop box is yours. Plug it in when nobody is looking, and I'll point out each step.
-> hub

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ [What's next?]
    -> whats_next
+ [Send them for coffee.]
    -> lever_coffee
+ { not act_midday } [Send them to lunch.]
    -> lever_lunch
+ { not act_evening } [Call it a day.]
    -> lever_day_end
+ { not terminal_view_done } [I looked at the file server in the Terminal.]
    -> terminal_check
+ { plug_in_done } [What did that show?]
    -> recap
+ [Give me the short version.]
    -> short_version
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END

=== whats_next ===
{
    - not plug_in_done:
        # speaker:npc
        Find the hot desk and its network socket. Plug the drop box in while Jun is away from it.
        {
            - coffee_call == 0:
                # speaker:npc
                Jun leaves for coffee now and then. Or I can send them.
            - else:
                # speaker:npc
                They've gone for coffee. Be quick, and don't be at the socket when he walks back.
        }
    - not sweep_done:
        # speaker:npc
        Now sweep the office network. See what answers.
    - not scan_printer_done:
        # speaker:npc
        Scan the printer. Find out what it runs.
    - not confirm_both_done:
        # speaker:npc
        Check the printer's admin page. Two weaknesses get reported. Test both, then see which is real.
    - not use_card_done:
        # speaker:npc
        There's a cupboard by Agnieszka's desk with a technique card in it. Use it on the weakness that's real.
    - not terminal_view_done:
        # speaker:npc
        Same moves, typed. Try the Terminal on the file server.
    - not act_evening:
        # speaker:npc
        The rest needs the evening. Tell me to call it a day.
    - not open_share_done:
        # speaker:npc
        Zainab stays late. Talk to her in the kitchen, then work up to the shared drive.
        # speaker:npc
        You'll need two steps on the file server, and a second card from her tool roll.
    - not read_log_done:
        # speaker:npc
        Go and see Graham in IT. He'll show you the network log.
    - else:
        # speaker:npc
        That's the lot. Ask for the short version, or stay and look round.
}
-> hub

=== lever_coffee ===
~ coffee_call = coffee_call + 1
# speaker:npc
Right. A coffee run. Chidi and Jun will head for the machine.
# speaker:npc
Anyone still at the socket when they come back gets caught.
-> hub

=== lever_lunch ===
~ act_midday = true
#set_global:act_midday:true
# speaker:npc
Lunch, then. Staff drift off their desks.
# speaker:npc
That's your midday: test what you found, and try a technique.
-> hub

=== lever_day_end ===
# speaker:npc
Seen what you wanted? Once they've gone home, it's just Zainab and Graham.
+ [Yes, call it a day.]
    ~ act_evening = true
    #set_global:act_evening:true
    # speaker:npc
    Right. Home time for nearly everyone.
    # speaker:npc
    Zainab's in the kitchen on her own, and Graham will show you the log.
    -> hub
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub

=== terminal_check ===
# speaker:npc
Good. What did the file server say?
+ [It named the product and its version.]
    # speaker:npc
    That's the banner. It tells you what to look up before you guess.
    -> terminal_ticked
+ [It listed findings, and one looked false.]
    # speaker:npc
    The Terminal gives the reason a finding is false. It's the same finding as in the panels.
    -> terminal_ticked

=== terminal_ticked ===
# speaker:npc
Panels and Terminal are two views of the same thing. Switch between them any time.
#complete_task:terminal_view
~ terminal_view_done = true
-> hub

=== recap ===
{ plug_in_done:
    # speaker:npc
    The drop box on the socket gave you a foothold. No password needed, only a free cable.
}
{ sweep_done:
    # speaker:npc
    The sweep listed what answers. Machines you never touched, found from one socket.
}
{ scan_printer_done:
    # speaker:npc
    The scan showed what the printer runs, service by service.
}
{ confirm_both_done:
    # speaker:npc
    Testing sorted the weakness that's real from the one that's a false alarm.
}
{ use_card_done:
    # speaker:npc
    The card only worked on the finding it fits. That's why you test first.
}
{ terminal_view_done:
    # speaker:npc
    The Terminal showed the same findings, typed, with the reason a false one is false.
}
{ open_share_done:
    # speaker:npc
    The shared drive took two steps: a user session first, then an administrator's.
}
{ read_log_done:
    # speaker:npc
    The log kept every step you took, so someone could spot you afterwards.
}
-> hub

=== short_version ===
# speaker:npc
One cable shows a lot: sweep the network, scan each machine.
# speaker:npc
Reported weaknesses are only reports. Test each one before you trust it.
# speaker:npc
A technique fits one kind of weakness, and some need a lower step first.
# speaker:npc
Everything you did is in the network log. That's how defenders find you.
-> hub
