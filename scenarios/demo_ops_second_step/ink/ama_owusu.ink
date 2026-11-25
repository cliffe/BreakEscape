// Ops demo host: Ama Owusu (reception). Second steps showcase.
// Contract 8.3.1 (second step). Levers are sticky and stay offered; the task
// flags <task>_done are scenario globals synced in when the conversation starts.
// Ticks by ink: see_note (knot tell_note). All other tasks tick by mapping.
// The coffee and lunch levers wait for kitchen_seen: staff needs only pick targets in
// rooms the player has opened, and the water and lunch are in the kitchen.

VAR coffee_call = 0 // Synced scenario global
VAR kitchen_seen = false // Synced scenario global (set on room_entered:kitchen)
VAR printer_off = false // Synced scenario global
VAR act_midday = false // Synced scenario global
VAR act_evening = false // Synced scenario global
VAR lorna_card_given = false // Synced scenario global
VAR see_note_done = false // Synced scenario global
VAR see_temper_note_done = false // Synced scenario global
VAR overhear_done = false // Synced scenario global
VAR step_holds_done = false // Synced scenario global
VAR open_screen_done = false // Synced scenario global
VAR fob_done = false // Synced scenario global
VAR number_match_done = false // Synced scenario global
VAR pestered_done = false // Synced scenario global
VAR exempt_done = false // Synced scenario global
VAR read_log_done = false // Synced scenario global
VAR reset_password_done = false // Synced scenario global
VAR reenrol_done = false // Synced scenario global
VAR desk_refuses_done = false // Synced scenario global
VAR records_index_off = false // Synced scenario global
VAR door_step_done = false // Synced scenario global
VAR propped_done = false // Synced scenario global
VAR safe_step_done = false // Synced scenario global
VAR case_step_done = false // Synced scenario global
// met_ama is ink-local: the opening plays once, later talks open at the hub.
VAR met_ama = false
// skip_late: the player chose to end the day with the afternoon and late beats undone.
VAR skip_late = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
Welcome to Merrin and Sallow. We switched on a second sign-in step last month.
# speaker:npc
Today you'll see what it stops and where it gives way.
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
+ { not records_index_off } [Switch the records index off.]
    -> lever_index
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
        Start with Lorna's sign-in. She agreed to be the test. Ask me for it.
    - not kitchen_seen:
        # speaker:npc
        Have a look in the kitchen, through the office. That's where the water and lunch are.
        # speaker:npc
        Then come back to me, and I can send them for coffee.
    - not see_note_done:
        # speaker:npc
        Anjali keeps a note under her keyboard.
        # speaker:npc
        Tell me to send them for coffee, then read it while she's away.
    - not see_temper_note_done:
        # speaker:npc
        Switch the printer off and wait. Darren writes things down when he's cross.
    - not overhear_done:
        # speaker:npc
        Yusuf asks Anjali for help each time the printer fails him.
        # speaker:npc
        Wait right beside Anjali to hear his login.
    - not step_holds_done:
        # speaker:npc
        Sign in at Lorna's PC while she's away, and ask for approval twice.
    - not open_screen_done:
        # speaker:npc
        Darren's short coffee trips leave his screen open. Use it while he's out.
    - not fob_done:
        # speaker:npc
        Anjali's fob sits on her desk when she's away.
        # speaker:npc
        Send them for coffee, then take it and sign in at her PC.
    - not number_match_done:
        # speaker:npc
        Yusuf's phone sits by the coffee machine when he's away. Take it, then sign in at his PC.
    - not act_midday:
        # speaker:npc
        Darren takes a long lunch. Tell me to send them to lunch, then go straight to his PC.
    - not pestered_done:
        # speaker:npc
        His password's on the note on his sign-in screen.
        # speaker:npc
        Sign in while he's at lunch, and keep asking until he gives in.
    - not exempt_done:
        # speaker:npc
        Read the card at the visitor desk and sign in there.
    - not reset_password_done:
        # speaker:npc
        Thandiwe runs the IT desk. Ask her for a password reset.
        # speaker:npc
        Darren's badge on his desk has his staff number. His manager is on the kitchen board.
    - not reenrol_done:
        # speaker:npc
        Ask Thandiwe for a sign-in approval reset, for Yusuf.
        # speaker:npc
        His answers are on the kitchen board. Then sign in at his PC with your own phone.
    - not desk_refuses_done:
        # speaker:npc
        Try Lorna's username at the desk, and answer wrongly until it stops listening.
    - not door_step_done:
        # speaker:npc
        Facilities pinned two new door codes on the facilities notice in the kitchen. The records room also wants Gwen's approval.
        # speaker:npc
        Send them for coffee, then take Gwen's phone from the office charger and approve.
    - not propped_done:
        # speaker:npc
        Fatima props the archive store door when the records index is down. Ask me to switch it off.
        # speaker:npc
        Try that door first, and don't approve it on Gwen's phone, or the prop has nothing to skip.
    - not safe_step_done:
        # speaker:npc
        Gwen keeps the records safe's code in her drawer. The safe also asks for a code from Anjali's fob.
    - not case_step_done:
        # speaker:npc
        Darren's case is by the front desk, and its key is in his drawer.
        # speaker:npc
        Carry it off, put it down, pick it up, and keep asking him.
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
#give_item:text_file
# speaker:npc
Here's Lorna's sign-in. Use it at her desk when she's away.
~ lorna_card_given = true
# speaker:npc
Her PC will send a request to her phone each time.
-> hub.choices

=== tell_note ===
# speaker:npc
Good. A password on a note under a keyboard is no secret at all.
# speaker:npc
That's one way a password escapes.
#complete_task:see_note
#set_global:see_note_done:true
~ see_note_done = true
-> hub.choices

=== lever_coffee ===
{ not kitchen_seen:
    # speaker:npc
    Have a look in the kitchen first. That's where the water is, and Anjali won't move without it.
    -> hub.choices
}
# speaker:npc
Right, coffee for everyone. Watch who leaves their desk.
# speaker:npc
Give them a minute or two. If nobody moves, ask me again.
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
{ not kitchen_seen:
    # speaker:npc
    Have a look in the kitchen first. That's where lunch happens.
    -> hub.choices
}
# speaker:npc
Lunchtime, then. Some of them will be away for a while.
#set_global:act_midday:true
~ act_midday = true
# exit_conversation
-> END

=== lever_index ===
# speaker:npc
Records index off. Let's see what Fatima does about it.
#set_global:records_index_off:true
~ records_index_off = true
# exit_conversation
-> END

=== lever_day_end ===
{ not skip_late and not (reset_password_done and reenrol_done and desk_refuses_done and door_step_done and propped_done and safe_step_done and case_step_done):
    # speaker:npc
    Not yet. Some of the afternoon and late things are still undone, and staff won't be back once they've gone home.
    + [Skip them and call it a day anyway.]
        ~ skip_late = true
        -> lever_day_end
    + [Not yet.]
        # speaker:npc
        Take your time.
        -> hub.choices
}
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
    - not see_note_done and not see_temper_note_done and not overhear_done and not step_holds_done and not open_screen_done and not fob_done and not number_match_done and not pestered_done and not exempt_done and not read_log_done and not reset_password_done and not reenrol_done and not desk_refuses_done and not door_step_done and not propped_done and not safe_step_done and not case_step_done:
        # speaker:npc
        Nothing to look back on yet. Try one of the things on the board.
        -> hub.choices
}
{ see_note_done:
    # speaker:npc
    A note under a keyboard: the second step can't help once the password's on show.
}
{ see_temper_note_done:
    # speaker:npc
    Darren wrote his down when the printer let him down. Frustration makes shortcuts.
}
{ overhear_done:
    # speaker:npc
    A login said aloud travels as far as the nearest listener.
}
{ step_holds_done:
    # speaker:npc
    Lorna never approved, so her password alone got you nowhere.
}
{ open_screen_done:
    # speaker:npc
    Darren's open screen asked for no second step. It guards signing in, not a screen left open.
}
{ fob_done:
    # speaker:npc
    A fob left on a desk: the step is only as good as what you keep hold of.
}
{ number_match_done:
    # speaker:npc
    Matching the number stops a blind tap, not a borrowed phone.
}
{ pestered_done:
    # speaker:npc
    Darren approved just to make the requests stop.
}
{ exempt_done:
    # speaker:npc
    The visitor desk account has no second step at all.
}
{ reset_password_done:
    # speaker:npc
    The desk asked two things about Darren that anyone could read. That was the whole check.
}
{ reenrol_done:
    # speaker:npc
    Yusuf's approvals went to your phone, so his second step now answers to you.
}
{ desk_refuses_done:
    # speaker:npc
    After three wrong answers the desk stopped listening, and never said whether the name was real.
}
{ door_step_done:
    # speaker:npc
    A door asked for the same second step as a sign-in, and Gwen's phone was the weak point.
}
{ propped_done:
    # speaker:npc
    A propped door skips every step. Fatima wedged it because the index was down.
}
{ safe_step_done:
    # speaker:npc
    The safe's code came from Anjali's fob, so whoever holds the fob holds the step.
}
{ case_step_done:
    # speaker:npc
    Darren's case went with you. The requests followed it until he gave in.
}
{ read_log_done:
    # speaker:npc
    Those night-time requests mean someone else had Darren's password first.
    # speaker:npc
    They were trying to wear him down.
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
It gives way to a worn-down approver, a fob on a desk or a phone by the coffee machine, and it never covers a screen left open.
# speaker:npc
And the helpdesk can undo it for anyone who can answer facts from a badge and a board.
# speaker:npc
A door, a safe or a case can ask for it too, and a propped door skips it.
-> hub.choices
