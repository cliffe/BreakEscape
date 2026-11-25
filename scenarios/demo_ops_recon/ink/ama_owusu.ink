// Ops demo (recon) host: Ama Owusu of Fenlow Managed IT (person, office aisle).
// Hub knot is `hub`; levers, "What's next?", recaps and the short version divert back to it.
// Contract: SHOWCASE_PLAN.md 8.3.1 (recon). Every VAR below is a scenario global that the
// scenario file declares with the same initial value, synced in when the conversation starts;
// met_ama is the only ink-local VAR (first-meeting line plays once, as in office_life_showcase).
// coffee_call is a counter: the lever adds one and stays offered, so every press is a change.
// kitchen_seen and server_room_seen gate lunch and the evening: an NPC's needs only pick
// targets in rooms the player has loaded, so the kitchen (food, the evening coffee) and the
// server room (Zainab) must be loaded before those levers can work (as office_life_showcase
// gates its lunch on kitchen_seen).

VAR coffee_call = 0
VAR act_midday = false
VAR act_evening = false
VAR kitchen_seen = false
VAR server_room_seen = false
VAR file_server_seen = false
VAR zainab_card_given = false
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
I'm Ama, from Fenlow. Merrin and Sallow want to know what an outsider could learn from one spare network port.
# speaker:npc
This drop box is yours. Plug it in when nobody is looking, and I'll point out each step.
-> hub

=== hub ===
# speaker:npc
{&What can I help with?|Anything else?|Go on.}
- (choices)
+ [What's next?]
    -> whats_next
+ { not act_evening } [Send them for coffee.]
    -> lever_coffee
+ { not act_midday and not act_evening } [Send them to lunch.]
    -> lever_lunch
+ { not act_evening } [Call it a day.]
    -> lever_day_end
+ { file_server_seen and not terminal_view_done } [I looked at the file server in the Terminal.]
    -> terminal_talk
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
        Find the hot desk and its network port. Plug the drop box in while Jun is away from it.
        # speaker:npc
        Jun goes for coffee now and then, or I can send him and Chidi. Be off the port before he's back.
    - not sweep_done:
        # speaker:npc
        Open the drop box in your inventory and sweep the office network. See what answers.
    - not scan_printer_done:
        # speaker:npc
        Scan the printer to see what it runs.
    - not confirm_both_done:
        # speaker:npc
        Check the printer's admin page. It reports two weaknesses. Test both to see which is real.
    - not use_card_done:
        # speaker:npc
        There's a technique card in the printer cupboard. Use it on the weakness that's real.
    - not terminal_view_done:
        # speaker:npc
        Now try the file server the same way, in the Terminal view. Same moves, typed.
        # speaker:npc
        Then come back and tell me what it said.
    - not act_evening:
        { kitchen_seen and server_room_seen:
            # speaker:npc
            The rest needs the evening. Tell me to call it a day.
        - else:
            # speaker:npc
            The rest needs the evening. Look in on the kitchen and the server room first, then tell me to call it a day.
        }
    - not open_share_done:
        { not zainab_card_given:
            # speaker:npc
            Zainab stays late. She'll be in the server room or at the kitchen coffee. She has a card for you.
        - else:
            # speaker:npc
            Use Zainab's card on the file server's update weakness. That gets you a user session.
            # speaker:npc
            Then test the left-open setting, and use the card from her tool roll on it. That's an admin session, and the shared drive.
        }
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
Anyone still at the hot desk port when Jun comes back gets caught.
-> hub

=== lever_lunch ===
{ not kitchen_seen:
    # speaker:npc
    Have a look in the kitchen first. That's where they eat.
    -> hub
}
~ act_midday = true
#set_global:act_midday:true
# speaker:npc
Lunch, then. Staff drift off their desks, Jun included. They only go the once.
-> hub

=== lever_day_end ===
{ not kitchen_seen or not server_room_seen:
    # speaker:npc
    Look in on the kitchen and the server room first. Zainab works in the server room, and she'll want the kitchen later.
    -> hub
}
# speaker:npc
Seen what you wanted? Once they've gone home, it's just Zainab and Graham.
+ [Yes, call it a day.]
    ~ act_evening = true
    #set_global:act_evening:true
    # speaker:npc
    Right. Home time for nearly everyone.
    # speaker:npc
    Zainab will head for the kitchen coffee, and Graham will show you the log.
    -> hub
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub

=== terminal_talk ===
# speaker:npc
Good. What did the file server say?
+ [It named the product and its version.]
    # speaker:npc
    That's the banner. It tells you what to look up before you guess.
    -> terminal_ticked
+ [It listed the same findings, with addresses.]
    # speaker:npc
    Same findings, same names. The Terminal shows the addresses and banners the panels tidy away.
    -> terminal_ticked
+ [Actually, I haven't yet.]
    # speaker:npc
    Try it, then tell me.
    -> hub

=== terminal_ticked ===
# speaker:npc
Panels and Terminal are two views of the same thing. Switch between them any time.
#complete_task:terminal_view
~ terminal_view_done = true
-> hub

=== recap ===
# speaker:npc
Which part?
+ [The morning.]
    -> recap_morning
+ { confirm_both_done or use_card_done or terminal_view_done } [Midday.]
    -> recap_midday
+ { open_share_done or read_log_done } [The evening.]
    -> recap_evening

=== recap_morning ===
# speaker:npc
The drop box on the port gave you a foothold. No password needed, only a free cable.
{ sweep_done:
    # speaker:npc
    The sweep listed what answers. Machines you never touched, found from one port.
}
{ scan_printer_done:
    # speaker:npc
    The scan showed what the printer runs, service by service.
}
-> hub

=== recap_midday ===
{ confirm_both_done:
    # speaker:npc
    Testing sorted the weakness that's real from the one that's a false alarm.
}
{ use_card_done:
    # speaker:npc
    The card turned the printer's factory account into a saved link to Agnieszka's PC.
}
{ terminal_view_done:
    # speaker:npc
    The Terminal showed the same findings, typed, with each machine's address and banner.
}
-> hub

=== recap_evening ===
{ open_share_done:
    # speaker:npc
    The shared drive took two steps, a user session and then an administrator's.
}
{ read_log_done:
    # speaker:npc
    The log kept every step you took, so someone could spot you afterwards.
}
-> hub

=== short_version ===
# speaker:npc
One cable shows a lot. Sweep the network, then scan each machine.
# speaker:npc
Reported weaknesses are only reports. Test each one before you trust it.
# speaker:npc
A technique fits one kind of weakness, and some need a user session first.
# speaker:npc
Everything you did is in the network log. That's how defenders find you.
-> hub
