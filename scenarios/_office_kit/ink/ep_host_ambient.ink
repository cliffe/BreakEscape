VAR kit_e1_note_choice = ""

=== start ===
Host: Take your time. The kiosk is ready when you are.
-> bye

// Reached from the host's bark once Priya's conversation has closed. It reads the answer
// she was given and shows what followed, with no blame either way.
=== kit_e1_host_note ===
{ kit_e1_note_choice == "report":
    Host: IT heard about the portal note within minutes, so the fault was checked early.
- else:
    { kit_e1_note_choice == "wait":
        Host: The portal note stayed on the screen a while before anyone looked at it.
    - else:
        Host: The portal note is still on Priya's screen.
    }
}
-> bye

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
