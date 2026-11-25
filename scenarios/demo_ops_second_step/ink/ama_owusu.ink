// Ops demo host: Ama Owusu (reception). Second steps showcase.
// Contract 8.3.1 (second step). Levers are sticky and stay offered; the task
// flags <task>_done are scenario globals synced in when the conversation starts.
// Ticks by ink: see_note (knot tell_note). All other tasks tick by mapping.

VAR coffee_call = 0
VAR printer_off = false
VAR act_midday = false
VAR act_evening = false
VAR lorna_card_given = false
VAR see_note_done = false
VAR see_temper_note_done = false
VAR overhear_done = false
VAR step_holds_done = false
VAR open_screen_done = false
VAR fob_done = false
VAR number_match_done = false
VAR pestered_done = false
VAR exempt_done = false
VAR read_log_done = false
// met_ama is ink-local: the opening plays once, later talks open at the hub.
VAR met_ama = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
Welcome to Merrin and Sallow. We switched on a second sign-in step last month.
# speaker:npc
Today you see what it stops, and where it gives way.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ [What's next?]
    -> whats_next
+ { not lorna_card_given } [Could I have Lorna's sign-in?]
    -> give_lorna_card
+ { not see_note_done } [I read Anjali's note.]
    -> tell_note
+ [Send them for coffee.]
    -> lever_coffee
+ { not printer_off } [Switch the printer off.]
    -> lever_printer
+ { not act_midday } [Send them to lunch.]
    -> lever_lunch
+ { not act_evening } [Call it a day.]
    -> lever_day_end
+ [What did that show?]
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
    - not lorna_card_given:
        # speaker:npc
        Start with Lorna's sign-in. She agreed to be the test, so I'll hand it over.
    - not see_note_done:
        # speaker:npc
        Anjali keeps a note under her keyboard. Read it while she's away from her desk.
        # speaker:npc
        If she's staying put, send them for coffee.
    - not see_temper_note_done:
        # speaker:npc
        Switch the printer off and wait. Darren writes things down when he's cross.
    - not overhear_done:
        # speaker:npc
        Yusuf will go and tell Anjali his login. Stand close to them.
    - not step_holds_done:
        # speaker:npc
        Sign in at Lorna's PC while she's away, and ask for approval twice.
    - not open_screen_done:
        # speaker:npc
        Darren's short coffee trips leave his screen open. Use it while he's out.
    - not act_midday:
        # speaker:npc
        Time for the second half of the day. Tell me to send them to lunch.
    - not fob_done:
        # speaker:npc
        Anjali's fob sits on her desk when she's away. Take it, then sign in at her PC.
    - not number_match_done:
        # speaker:npc
        Yusuf's phone sits by the coffee machine when he's away. Take it, then sign in at his PC.
    - not pestered_done:
        # speaker:npc
        Sign in at Darren's PC while he's at lunch, and keep asking until he gives in.
    - not exempt_done:
        # speaker:npc
        Read the card at the visitor desk and sign in there.
    - not act_evening:
        # speaker:npc
        Nearly done. Tell me when to call it a day.
    - not read_log_done:
        # speaker:npc
        Go and see Thandiwe in the IT room. She has the log.
    - else:
        # speaker:npc
        That's the lot. Stay and look round as long as you like.
}
-> hub.choices

=== give_lorna_card ===
# speaker:npc
Here's Lorna's sign-in. Use it at her desk when she's away.
#give_item:text_file
~ lorna_card_given = true
# speaker:npc
Her PC will send a request to her phone each time.
-> hub.choices

=== tell_note ===
# speaker:npc
Good. A password on a note under a keyboard is no secret at all.
# speaker:npc
That's the first way a password escapes.
#complete_task:see_note
#set_global:see_note_done:true
~ see_note_done = true
-> hub.choices

=== lever_coffee ===
# speaker:npc
Right, coffee for everyone. Watch who leaves their desk.
~ coffee_call = coffee_call + 1
# exit_conversation
-> END

=== lever_printer ===
# speaker:npc
Printer's off. Let's see who loses patience.
#set_global:printer_off:true
~ printer_off = true
# exit_conversation
-> END

=== lever_lunch ===
# speaker:npc
Lunchtime, then. Some of them will be away for a while.
#set_global:act_midday:true
~ act_midday = true
# exit_conversation
-> END

=== lever_day_end ===
# speaker:npc
Seen everything you wanted? Staff won't be back once they've gone home.
+ [Yes, call it a day.]
    # speaker:npc
    Right. Home time for nearly everyone.
    # speaker:npc
    Thandiwe stays on in the IT room.
    #set_global:act_evening:true
    ~ act_evening = true
    # exit_conversation
    -> END
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== recap ===
{
    - not see_note_done and not see_temper_note_done and not overhear_done and not step_holds_done and not open_screen_done and not fob_done and not number_match_done and not pestered_done and not exempt_done and not read_log_done:
        # speaker:npc
        Nothing to look back on yet. Try one of the things on the board.
        -> hub.choices
}
{ see_note_done:
    # speaker:npc
    A written note: a password escapes through habit.
    # speaker:npc
    The second step cannot help if the password is on show.
}
{ see_temper_note_done:
    # speaker:npc
    Darren wrote his down when the printer let him down.
    # speaker:npc
    Frustration makes people take shortcuts.
}
{ overhear_done:
    # speaker:npc
    A login said aloud travels as far as the nearest listener.
    # speaker:npc
    Two colleagues helping each other still leak it.
}
{ step_holds_done:
    # speaker:npc
    With the password in hand, you still needed Lorna's phone.
    # speaker:npc
    She never approved, so the second step held.
}
{ open_screen_done:
    # speaker:npc
    No step was asked. It guards signing in, not a screen left open.
    # speaker:npc
    That's the way round.
}
{ fob_done:
    # speaker:npc
    The code came from a fob left on a desk.
    # speaker:npc
    A second step is only as good as the thing you keep hold of.
}
{ number_match_done:
    # speaker:npc
    A phone left by the coffee machine answered for its owner.
    # speaker:npc
    Matching the number stops a blind tap, not a borrowed phone.
}
{ pestered_done:
    # speaker:npc
    Darren approved just to make the requests stop.
    # speaker:npc
    Too many prompts wear people down.
}
{ exempt_done:
    # speaker:npc
    The visitor desk account has no second step at all.
    # speaker:npc
    An exempt account is a gap, even a small one.
}
{ read_log_done:
    # speaker:npc
    The log kept every request, including the ones nobody answered.
    # speaker:npc
    That's how someone notices a burst in the night.
}
-> hub.choices

=== short_version ===
# speaker:npc
A password is easy to come by in a busy office. Notes, tempers and talk all leak them.
# speaker:npc
A second step adds a thing you must also have.
# speaker:npc
It holds when the owner ignores the request.
# speaker:npc
It gives way to a worn-down approver, a fob on a desk or a phone by the kettle.
# speaker:npc
And it never covers a screen someone left open.
-> hub.choices
