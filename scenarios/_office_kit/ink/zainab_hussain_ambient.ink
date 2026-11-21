VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca06_out = false  // Synced scenario global
VAR kit_ca06_asked = false
VAR kit_ca06_notice_choice = ""  // Synced scenario global
VAR kit_ca06_done = false
VAR kit_ca02_moved = false

=== start ===
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca06_asked || (kit_ca06_out && not kit_ca06_done):
    -> ca06_notice
}
{ kit_defend_done:
    { kit_ep == "ca02": -> ca02 }
    { kit_ep == "ca06": -> ca06 }
}
Zainab Hussain: Hiya. Help yourself to the drinks machine, it's just there.
-> bye

=== ca02 ===
{ kit_ca02_moved:
    -> bye
}
{ kit_key_caught:
    Zainab Hussain: Nice catch on that CV. One file that wants a second click to open, and you're off the road for a week.
- else:
    Zainab Hussain: Heard HR had a scare with an application. Easy to click when the inbox is heaving.
}
-> bye

=== ca06 ===
{ kit_key_caught:
    Zainab Hussain: Nice one. Out on the road you'd scan that barrier code in a heartbeat, so glad you clocked it.
- else:
    Zainab Hussain: I'm forever scanning codes out at the depots. One day one of them won't be what it says.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca06_notice ===
{ kit_ca06_notice_choice == "check" || kit_ca06_notice_choice == "fine" || kit_ca06_notice_choice == "silent" || kit_ca06_done:
    -> ca06
}
Zainab Hussain: This one says my parking permit needs renewing. Is it one of ours?
{ kit_ca06_notice_choice == "":
    ~ kit_ca06_notice_choice = "asked"
}
+ [Check it with Facilities on the number you already have.]
    ~ kit_ca06_notice_choice = "check"
    Zainab Hussain: Good idea. I'll ring Facilities from my desk before I touch it.
    #exit_conversation
    -> DONE
+ [It's got the car park name on. Looks like ours. Go ahead.]
    ~ kit_ca06_notice_choice = "fine"
    Zainab Hussain: Lovely. I'll get it sorted now, then. #delivery: cheerful, breezy
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca06_notice_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca06_react ===
{ kit_key_caught:
    Zainab Hussain: Nice. That code's just a sticker on an official notice, and it's your card details it's really after. #delivery: steady, approving
- else:
    Zainab Hussain: A code on a proper-looking notice, who'd think twice? That's the whole con. Open the parking app yourself instead. #delivery: steady, matter-of-fact
}
-> bye
