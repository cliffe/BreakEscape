VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_e1_note_up = false
VAR kit_e1_note_choice = ""

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Priya Nair: Morning. The portal has been fine so far.
-> bye

=== ca01 ===
Priya Nair: Good spot on that invoice. Phone the supplier next time too.
-> hub

// The hub offers the note only once it is on the screen (kit_e1_note_up).
=== hub ===
+ {kit_e1_note_up} [Ask about the note on your screen.]
    -> note_ask
+ [See you later.]
    #exit_conversation
    -> DONE

=== note_ask ===
Priya Nair: It says the supplier portal is not letting anyone in. I'm leaving it until it has been looked at.
-> hub

// Reached from the bark: the colleague asks, the answer is kept in kit_e1_note_choice.
=== kit_e1_request ===
Priya Nair: The supplier portal won't let me in, and there's a note on my screen. Should I do anything?
+ [Tell IT about it.]
    ~ kit_e1_note_choice = "report"
    Priya Nair: Good idea. I'll ring them now.
    -> bye
+ [Leave it for now, you're busy.]
    ~ kit_e1_note_choice = "wait"
    Priya Nair: Fair enough. I've got a queue of invoices to get through anyway.
    -> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
