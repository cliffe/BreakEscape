VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca02": -> ca02 }
    { kit_ep == "ca09": -> ca09 }
    { kit_ep == "ca15": -> ca15 }
    { kit_ep == "ca20": -> ca20 }
}
Chidi Okeke: Now then. Drinks machine's over there if you fancy one.
-> bye

=== ca02 ===
{ kit_key_caught:
    Chidi Okeke: Good one, spotting that dodgy application. The lads in HR open attachments all day, so nice to have someone watching their backs.
- else:
    Chidi Okeke: Recruitment inbox never stops. All sorts of attachments land in there from folk we've never met.
}
-> bye

=== ca09 ===
{ kit_key_caught:
    Chidi Okeke: Nice. Get everyone on a manager and a passkey and each sign-in's one person's, no more shared logins on sticky notes.
- else:
    Chidi Okeke: We still share a login or two on the fleet desk. Nobody could say who did what, mind.
}
-> bye

=== ca15 ===
{ kit_key_caught:
    Chidi Okeke: Nice. Deadline on and a free transfer tool looks grand, but then nobody can say where the client pack's gone.
- else:
    Chidi Okeke: We're always chasing a quicker way to shift big files before a deadline. The approved one feels slow.
}
-> bye

=== ca20 ===
{ kit_key_caught:
    Chidi Okeke: Nice one. Report a lost device the minute it's gone and IT wipes it before anyone reads a thing.
- else:
    Chidi Okeke: Half my week's out of the van. You forget what's sat on that tablet if you leave it somewhere.
}
-> bye

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice is reported as ended on that same continue, and person-chat then shows only
// "(End of conversation)" (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
