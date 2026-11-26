// Ops demo host: Ama Owusu (reception). Second steps showcase.
// Contract 8.3.1 (second step). Levers are sticky and stay offered; the task
// flags <task>_done are scenario globals synced in when the conversation starts.
// Every task ticks by mapping (see_note on pc_signin_shown:anjali_pc with the note); none by this ink.
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
VAR desk_call_done = false // Synced scenario global
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
Welcome to Merrin and Sallow. I'm Ama, from Fenlow, the firm that looks after their IT.
# speaker:npc
Last month we switched on a second sign-in step. A password alone is no longer enough: you also need something you have, like a phone or a code fob.
# speaker:npc
Outside this office it's called multi-factor authentication, or MFA.
# speaker:npc
Today you'll see what it stops and where it gives way.
# speaker:npc
Ask me "What's next?" whenever you're unsure. The board in the office lists the whole day, and your tasks tick on their own.
# speaker:npc
I can send the staff for coffee or lunch, or switch things off, so you can watch what people do.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ [What's next?]
    -> whats_next
+ { not lorna_card_given } [Could I have Lorna's sign-in?]
    -> give_lorna_card
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
        Tell me to send them for coffee. While she's away, click her PC: the note shows on her sign-in screen.
    - not open_screen_done:
        # speaker:npc
        Darren's short coffee trips leave his screen open. Use it while he's out.
        # speaker:npc
        If you missed him, ask me to send them for coffee again.
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
        If Lorna's at her desk, send them for coffee. Then sign in at her PC with the card I gave you.
        # speaker:npc
        Her phone gets a request to approve. Press Send again once more, and see what happens when she doesn't answer.
    - not fob_done:
        # speaker:npc
        Anjali's second step is a code fob. It shows six digits that change every minute, and her PC asks for them.
        # speaker:npc
        Send them for coffee, take the fob from her desk, and sign in at her PC with the password from her note.
    - not number_match_done:
        # speaker:npc
        Yusuf's second step shows a number on his PC, and he has to pick the same number on his phone.
        # speaker:npc
        His phone sits by the coffee machine when he's away. Take it, then sign in at his PC with the login you overheard.
    - not act_midday:
        # speaker:npc
        Darren takes a long lunch. Tell me to send them to lunch, then wait for me to say his screen has locked.
    - not pestered_done:
        # speaker:npc
        His password's on the note on his sign-in screen.
        # speaker:npc
        Sign in while he's at lunch, and keep pressing Send again until he gives in.
    - not exempt_done:
        # speaker:npc
        Read the card beside the visitor kiosk and sign in there.
    - not reset_password_done:
        # speaker:npc
        Thandiwe runs the IT desk in the IT room. Ask her for a password reset for Darren.
        # speaker:npc
        Her form wants his username, which is on his sign-in screen, plus his staff number and his manager.
        # speaker:npc
        His badge on his desk has the staff number. His manager is on the kitchen board.
    - not reenrol_done:
        # speaker:npc
        Now ask Thandiwe for an approval reset for Yusuf. That moves his sign-in approvals to a new phone: yours.
        # speaker:npc
        His answers are on the kitchen board. The same form is on Darren's desktop too, but it only sends while his screen is open.
    - not desk_refuses_done:
        # speaker:npc
        Try Lorna's username at the desk, and answer wrongly until it stops listening. Watch what it tells you, and what it doesn't.
    - not desk_call_done:
        # speaker:npc
        One more at the desk. Meet Priya in the IT room, then ring the IT line on your work phone.
        # speaker:npc
        Keep Yusuf's phone on you, and ask the line for an approval reset for him.
    - not propped_done:
        # speaker:npc
        Two new door codes are on the facilities notice in the kitchen. Try the archive store door with its code.
        # speaker:npc
        Gwen won't approve it, so close the request. Then ask me to switch the records index off, and watch what Fatima does.
    - not door_step_done:
        # speaker:npc
        The records room wants Gwen's approval as well as its code.
        # speaker:npc
        Send them for coffee, then take Gwen's phone from the office charger and approve.
        # speaker:npc
        The door's pane has a button to check Gwen's phone. Use it with her phone in hand.
    - not safe_step_done:
        # speaker:npc
        Gwen keeps the records safe's code in her drawer. Open the safe in the records room with it, then give it the six digits from Anjali's fob.
    - not case_step_done:
        # speaker:npc
        Darren's case is by the front desk, and its key is in his drawer. The lock also sends a request to his phone.
        # speaker:npc
        Take it anywhere you like, put it down, pick it up, and choose Unlock again each time. His phone can't tell where the case is.
    - not act_evening:
        # speaker:npc
        Nearly done. Tell me when to call it a day.
    - not read_log_done:
        # speaker:npc
        Go and see Thandiwe in the IT room. She has the log.
    - else:
        # speaker:npc
        That's the lot. Ask me for the short version, and I'll sum up the day.
}
-> hub.choices

=== give_lorna_card ===
#give_item:text_file
# speaker:npc
Here's Lorna's sign-in card. It's in your inventory. Try her PC now, while she's sitting at it.
~ lorna_card_given = true
# speaker:npc
Once she's away, her PC will send a request to her phone each time you sign in.
-> hub.choices

=== lever_coffee ===
{ not kitchen_seen:
    # speaker:npc
    Have a look in the kitchen first. That's where the water is, and Anjali won't move without it.
    -> hub.choices
}
{ coffee_call > 0:
    # speaker:npc
    Asked again. Lorna, Darren and Yusuf should be up for coffee within a couple of minutes. Anjali only moves for water.
- else:
    # speaker:npc
    Right, coffee for everyone. Watch who leaves their desk.
    # speaker:npc
    Give them a minute or two. If nobody moves, ask me again.
}
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
{ not see_temper_note_done:
    { printer_off:
        # speaker:npc
        Not yet. Wait for Darren's temper to run first.
    - else:
        # speaker:npc
        Not yet. Switch the printer off and let Darren's temper run first.
    }
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
{ not skip_late and not (reset_password_done and reenrol_done and desk_refuses_done and desk_call_done and door_step_done and propped_done and safe_step_done and case_step_done):
    # speaker:npc
    Not yet. Some of the afternoon and late things are still undone, and staff won't be back once they've gone home.
    -> lever_day_refused
}
# speaker:npc
Seen everything you wanted? Staff won't be back once they've gone home.
+ [Yes, call it a day.]
    -> day_end_go
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== day_end_go ===
# speaker:npc
Right. Home time for nearly everyone.
# speaker:npc
Thandiwe stays on in the IT room.
#set_global:act_evening:true
~ act_evening = true
# exit_conversation
-> END

=== lever_day_refused ===
+ [Skip them and call it a day anyway.]
    ~ skip_late = true
    -> day_end_go
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== recap ===
{
    - not see_note_done and not see_temper_note_done and not overhear_done and not step_holds_done and not open_screen_done and not fob_done and not number_match_done and not pestered_done and not exempt_done and not read_log_done and not reset_password_done and not reenrol_done and not desk_refuses_done and not desk_call_done and not door_step_done and not propped_done and not safe_step_done and not case_step_done:
        # speaker:npc
        Nothing to look back on yet. Try one of the things on the board.
        -> hub.choices
}
{ see_note_done:
    # speaker:npc
    A note under a keyboard gives the password away, so the second step is all that's left.
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
    Darren's open screen asked for nothing, so lock your screen when you step away.
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
    Darren gave in to make the requests stop. A request you didn't start should be denied.
}
{ exempt_done:
    # speaker:npc
    The visitor kiosk account has no second step at all, and one gap like that undoes the rest.
}
{ reset_password_done:
    # speaker:npc
    The desk asked two things about Darren that anyone could read. That was the whole check.
}
{ reenrol_done:
    # speaker:npc
    Yusuf's approvals went to your phone, so his second step now answers to you. If a lock of his asked, you'd approve it yourself.
}
{ desk_refuses_done:
    # speaker:npc
    The desk's limit and its silence about names stop guessing, but not someone who has the answers.
}
{ desk_call_done:
    # speaker:npc
    The phone line trusted a call-back to Yusuf's phone, and you were the one holding it.
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
The helpdesk can undo it for anyone who can answer facts from a badge and a board.
# speaker:npc
A door, a safe or a case can ask for it too, and a propped door skips it.
# speaker:npc
One account with no second step undoes the rest.
# speaker:npc
And the log shows it all. Requests nobody started are a warning sign, so deny them and tell IT.
+ [What are these called outside this office?]
    -> real_names
+ [That's enough.]
    -> hub.choices

=== real_names ===
# speaker:npc
The second step is multi-factor authentication, or MFA.
# speaker:npc
A request to approve on a phone is a push. The fob's six digits are a one-time code. Picking the matching number is number matching.
# speaker:npc
Sending requests until someone gives in is called MFA fatigue, or prompt bombing.
# speaker:npc
Talking a helpdesk into a reset is social engineering. Ringing back the number on file is call-back verification.
# speaker:npc
And a propped door is the oldest way round any lock.
-> hub.choices
