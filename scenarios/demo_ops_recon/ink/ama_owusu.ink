// Ops demo (recon) host: Ama Owusu of Fenlow Managed IT (person, office aisle).
// Hub knot is `hub`; levers, "What's next?", recaps and the short version divert back to it.
// Contract: SHOWCASE_PLAN.md 8.3.1 (recon). Every VAR below is a scenario global that the
// scenario file declares with the same initial value, synced in when the conversation starts;
// met_ama is the only ink-local VAR (first-meeting line plays once, as in office_life_showcase).
// coffee_call is a counter: a press that is not already pending adds one, so it is a change.
// coffee_pending is true from a press until Jun is back at his desk (a mapping on Jun clears it):
// a press in between says the run is on its way and queues nothing.
// kitchen_seen and server_room_seen gate lunch and the evening: an NPC's needs only pick
// targets in rooms the player has loaded, so the kitchen (food, the evening coffee) and the
// server room (Zainab) must be loaded before those levers can work (as office_life_showcase
// gates its lunch on kitchen_seen).

VAR coffee_call = 0
VAR coffee_pending = false // Synced scenario global: set here on a press, cleared when Jun is back at his desk or on a load
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
VAR remote_signin_done = false
VAR unplug_done = false
VAR box_at_kitchen = false
VAR printer_off = false
VAR open_share_done = false
VAR read_log_done = false
VAR met_ama = false
// skip_day: the player chose "Skip them and call it a day anyway." (ink-local, as skip_late in the second-step showcase).
VAR skip_day = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
I'm Ama, from Fenlow. Merrin and Sallow want to know what an outsider could learn from one spare network port.
# speaker:npc
This drop box is a small computer, and it's yours. Plug it in when nobody is looking, and I'll point out each step.
-> hub

=== hub ===
# speaker:npc
{&What can I help with?|Anything else?|Go on.}
- (choices)
+ [What's next?]
    -> whats_next
+ { not act_evening } [Send them for coffee.]
    -> lever_coffee
+ { not act_midday and not act_evening } [Send them to lunch (later).]
    -> lever_lunch
+ { not act_evening } [Call it a day (last).]
    -> lever_day_end
+ { file_server_seen and not terminal_view_done } [I've scanned the file server.]
    -> terminal_talk
+ { plug_in_done } [What did that show?]
    -> recap
+ [Give me the short version.]
    -> short_version
+ [I'll have a look round.]
    # speaker:npc
    I'll be here.
    # exit_conversation
    -> END

=== whats_next ===
{
    - not plug_in_done:
        # speaker:npc
        Find the hot desk and its network port. Plug the drop box in while Jun is away from it.
        # speaker:npc
        Jun goes for coffee now and then, or I can send him and Chidi.
        # speaker:npc
        If Jun comes back while you're at his port, he'll ask what you're doing.
        # speaker:npc
        If you'd rather not wait, the kitchen has a spare port too, and nobody watches it.
    - not sweep_done:
        # speaker:npc
        Open the drop box in your inventory. That's the network view, in Panels. Sweep the office network and see what answers.
    - not scan_printer_done:
        # speaker:npc
        Scan the printer to see what it runs.
    - not confirm_both_done:
        { printer_off:
            # speaker:npc
            Switch the printer back on at its wall socket first.
        }
        # speaker:npc
        On the printer's admin page, press Check. It lists two reported weaknesses, called findings. Press Confirm on each to test which is real. High and Low are only how bad the report claims it is.
        { not printer_off:
            # speaker:npc
            Want to see an outage? Switch the printer off at its wall socket and sweep again. Then switch it back on.
        }
    - not use_card_done:
        # speaker:npc
        There's a technique card in the printer cupboard. Each card is a known way in that fits one kind of weakness. This one is for factory accounts: the login a device ships with, which nobody changed.
        # speaker:npc
        Take it, then in the drop box view pick the card, pick the real finding and press Use.
    - not remote_signin_done:
        # speaker:npc
        Now open the drop box again and find Agnieszka's PC in the list. Press Sign in. You don't know her password, so don't type one: pick the printer's saved link from the list instead.
    - not terminal_view_done:
        # speaker:npc
        Now try the file server the same way, in the Terminal. Use the Panels and Terminal switch at the top of the drop box view. Same moves, typed.
        # speaker:npc
        It looks like a real console. The tool names are real, but the machines and results are made up.
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
            Use Zainab's card on the file server's update weakness. Test it first if you haven't. That gets you a user session.
            # speaker:npc
            Then test the left-open setting, and use the card from her tool roll on it. That's an admin session. Open the shared drive from the file server's own desktop, not from the list.
        }
    - not read_log_done:
        # speaker:npc
        Go and see Graham in IT. He'll show you the network log.
    - not unplug_done:
        # speaker:npc
        Last thing. Go back to the {box_at_kitchen: kitchen|hot desk} port and unplug the box.
    - else:
        # speaker:npc
        That's the lot. Ask for the short version, or stay and look round.
}
-> hub

=== lever_coffee ===
{ coffee_pending:
    # speaker:npc
    That's already on its way. Give them a minute.
    -> hub
}
~ coffee_call = coffee_call + 1
~ coffee_pending = true
# speaker:npc
Right, a coffee run. Chidi and Jun will head for the machine.
{ not plug_in_done:
    # speaker:npc
    Jun's desk will be empty for a bit.
}
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
~ temp seen_file_server = terminal_view_done
~ temp morning_done = plug_in_done and sweep_done and scan_printer_done
~ temp midday_done = confirm_both_done and use_card_done and remote_signin_done and seen_file_server
{ not skip_day and not (morning_done and midday_done):
    # speaker:npc
    Not yet. There's still work to do, and once they've gone home they won't be back.
    { not plug_in_done:
        # speaker:npc
        You haven't plugged the drop box in.
    }
    { not sweep_done:
        # speaker:npc
        You haven't swept the network.
    }
    { not scan_printer_done:
        # speaker:npc
        You haven't scanned the printer.
    }
    { not confirm_both_done:
        # speaker:npc
        You haven't tested both printer weaknesses.
    }
    { not use_card_done:
        # speaker:npc
        You haven't used the card on the printer's real weakness.
    }
    { not remote_signin_done:
        # speaker:npc
        You haven't signed in to Agnieszka's PC.
    }
    { not terminal_view_done:
        # speaker:npc
        You haven't looked at the file server in the Terminal.
    }
    -> lever_day_refused
}
# speaker:npc
Seen what you wanted? Once they've gone home, it's just Zainab and Graham.
+ [Yes, call it a day.]
    -> lever_day_go
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub

=== lever_day_go ===
~ act_evening = true
#set_global:act_evening:true
# speaker:npc
Right. Home time for nearly everyone. An empty office is when a visitor gets the most time.
# speaker:npc
Zainab will head for the kitchen coffee, and Graham will show you the log.
-> hub

=== lever_day_refused ===
+ [Skip them and call it a day anyway.]
    ~ skip_day = true
    -> lever_day_go
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== terminal_talk ===
# speaker:npc
Good. What did the file server say?
+ [It named the product and its version.]
    # speaker:npc
    That's the banner, the line a service sends to say what it is. On a real network, you'd check that version against published lists of known weaknesses.
    -> terminal_ticked
+ [It listed the same findings, with addresses.]
    # speaker:npc
    Same findings, same names. The Terminal also shows each address and banner, the line a service sends to say what it is.
    -> terminal_ticked
+ [Actually, I haven't yet.]
    # speaker:npc
    Try it, then tell me.
    -> hub

=== terminal_ticked ===
# speaker:npc
The Terminal shows the scan as a table, the way a console prints it.
# speaker:npc
Switch to Panels and back again. The Terminal keeps its log for as long as the view is open.
#complete_task:terminal_view
~ terminal_view_done = true
-> hub

=== recap ===
# speaker:npc
Which part?
+ [The morning.]
    -> recap_morning
+ { confirm_both_done or use_card_done or remote_signin_done or terminal_view_done } [Midday.]
    -> recap_midday
+ { open_share_done or read_log_done or unplug_done } [The evening.]
    -> recap_evening
+ [How do they stop that?]
    -> defend
+ [Never mind.]
    # speaker:npc
    Right.
    -> hub

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
    The card got in through the printer's factory account, and the printer had a saved link to Agnieszka's PC.
}
{ remote_signin_done:
    # speaker:npc
    A saved link is as good as a password, so anything that stores one is worth guarding. Your keyring is the list of sign-ins you've collected, and the network view offers them when you connect.
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
{ unplug_done:
    # speaker:npc
    A foothold lasts only while the box is plugged in. What you found stays with you.
}
-> hub

=== defend ===
# speaker:npc
Switch off wall ports nobody uses, and notice a box that shouldn't be there.
# speaker:npc
Change every factory login when a device goes in, and don't let devices keep saved sign-ins they don't need.
# speaker:npc
Keep services up to date, and close settings left open.
# speaker:npc
Read the log. That's where you were seen.
-> hub

=== short_version ===
# speaker:npc
One cable shows a lot. Sweep the network, then scan each machine.
# speaker:npc
Reported weaknesses are only reports. Test each one before you trust it.
# speaker:npc
A technique fits one kind of weakness, and a saved link works like a password.
# speaker:npc
One way in can lead to the next: an ordinary user first, then an administrator.
# speaker:npc
Everything you did is in the network log. That's how defenders find you.
# speaker:npc
And a foothold lasts only while the box is plugged in.
-> hub
