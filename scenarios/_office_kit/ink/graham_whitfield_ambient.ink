VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca13_out = false  // Synced scenario global
VAR kit_ca13_asked = false
VAR kit_ca13_send_choice = ""  // Synced scenario global
VAR kit_ca13_moved = false
VAR kit_ca13_done = false
VAR kit_ca07_out = false  // Synced scenario global
VAR kit_ca07_asked = false
VAR kit_ca07_call_choice = ""  // Synced scenario global
VAR kit_ca07_moved = false
VAR kit_ca07_done = false

=== start ===
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca13_asked || (kit_ca13_out && not kit_ca13_done):
    -> ca13_send
}
{ kit_ca07_asked || (kit_ca07_out && not kit_ca07_done):
    -> ca07_call
}
{ kit_defend_done:
    { kit_ep == "ca07": -> ca07 }
    { kit_ep == "ca13": -> ca13 }
}
Graham Whitfield: Morning. Help yourself to a brew.
-> bye

=== ca07 ===
{ kit_key_caught:
    Graham Whitfield: Good ear. A voice on the phone proves nothing by itself.
- else:
    Graham Whitfield: Finance are re-checking every recent run by hand. Slow going.
}
-> bye

=== ca13 ===
{ kit_key_caught:
    Graham Whitfield: Nice. You checked it yourself instead of trusting that summary.
- else:
    Graham Whitfield: Finance are chasing a payment that shouldn't have gone. The assistant sounded so sure.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca13_send ===
{ kit_ca13_moved || (kit_ca13_send_choice == "ring" && not kit_key_caught):
    -> bye
}
{ kit_ca13_send_choice == "ring" || kit_ca13_send_choice == "send" || kit_ca13_send_choice == "silent" || kit_ca13_done:
    -> ca13
}
Graham Whitfield: Assistant says Pennine Oat Mills need our customer list for a recall. Reply's drafted. Just send it?
{ kit_ca13_send_choice == "":
    ~ kit_ca13_send_choice = "asked"
}
+ [Ring Pennine on the number we hold. The assistant can't tell who's asking.]
    ~ kit_ca13_send_choice = "ring"
    Graham Whitfield: Fair enough. I'll ring them on the number on file, and report the email to Gwen.
    #exit_conversation
    -> DONE
+ [A recall's urgent. Send it now and tell Gwen after.]
    ~ kit_ca13_send_choice = "send"
    Graham Whitfield: Right you are. Sent. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca13_send_choice = "silent"
    #exit_conversation
    -> DONE

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca07_call ===
{ kit_ca07_moved:
    -> bye
}
{ kit_ca07_call_choice == "ringback" || kit_ca07_call_choice == "pay" || kit_ca07_call_choice == "silent" || kit_ca07_done:
    -> ca07
}
Graham Whitfield: Sounds just like him. Ashcarr Haulage have changed bank, and he wants them paid today. Go ahead?
{ kit_ca07_call_choice == "":
    ~ kit_ca07_call_choice = "asked"
}
+ [Hang up. Ring Ravinder on his saved mobile, and Ashcarr on the number on file.]
    ~ kit_ca07_call_choice = "ringback"
    Graham Whitfield: You're right. I'll hang up and ring them both myself.
    #exit_conversation
    -> DONE
+ [Go ahead. It's his own mobile on the screen, so it's him.]
    ~ kit_ca07_call_choice = "pay"
    Graham Whitfield: There we are. Paid. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca07_call_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca07_react ===
{ kit_key_caught:
    Graham Whitfield: Good instinct. The number on the screen and the voice can both be faked, so ringing back is what settles it. #delivery: unhurried, warm
- else:
    Graham Whitfield: A voice that sounds just like the boss is easy to fake now. Ring back on his saved number and it falls apart. #delivery: kind, matter-of-fact
}
-> bye

=== ca13_react ===
{ kit_key_caught:
    Graham Whitfield: Well done. That instruction came from the document the assistant read, not from anyone here. It only passed it along. #delivery: unhurried, warm
- else:
    Graham Whitfield: A document can hide an instruction telling the assistant to send things out, and it just obeys. Best to read it yourself. #delivery: kind, matter-of-fact
}
-> bye
