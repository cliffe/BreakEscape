VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false
VAR kit_ca05_out = false  // Synced scenario global
VAR kit_ca05_asked = false
VAR kit_ca05_prompt_choice = ""  // Synced scenario global
VAR kit_ca05_moved = false
VAR kit_ca05_done = false
VAR kit_ca10_out = false  // Synced scenario global
VAR kit_ca10_asked = false
VAR kit_ca10_check_choice = ""  // Synced scenario global
VAR kit_ca10_moved = false
VAR kit_ca10_done = false

=== start ===
// A click before the request bark lands (or the ask flag is set) still opens the request, so an early click never strands it.
{ kit_ca05_asked || (kit_ca05_out && not kit_ca05_done):
    -> ca05_prompt
}
{ kit_ca10_asked || (kit_ca10_out && not kit_ca10_done):
    -> ca10_check
}
{ kit_defend_done:
    { kit_ep == "ca00": -> ca00 }
    { kit_ep == "ca05": -> ca05 }
    { kit_ep == "ca08": -> ca08 }
    { kit_ep == "ca10": -> ca10 }
    { kit_ep == "ca16": -> ca16 }
    { kit_ep == "ca19": -> ca19 }
}
Darren Price: Alright. Help yourself to the cooler if you're parched.
-> bye

// ca00 convention (brief 1.3): staff open on this knot directly, no branch.
=== ca00 ===
Darren Price: Welcome aboard. Good to have you on the floor with us.
-> bye

=== ca05 ===
{ kit_key_caught:
    Darren Price: Nice catch on that fake sign-in page. Looked just like the real portal, didn't it.
- else:
    Darren Price: Seen a few lookalike login pages doing the rounds. Hard to tell from the real thing now.
}
-> bye

// D265: the ca05 defend twin's after-sort reaction bark. Triggered only in the twin, by the
// kit_darren_price eventMapping on kit_defend_done (gen_e3_e5_shells.py); the engine speaks the
// first line aloud. Reads only kit_key_caught and is true on every path (trust, delete, report
// or leave). Not reached by start: the twin has no set-piece flow, and the full ca05 shell never
// carries the mapping, so its Darren is untouched.
=== ca05_react ===
{ kit_key_caught:
    Darren Price: Saw you clock that lookalike sign-in. The address gave it away, same as it always does. #delivery: approving, dry
- else:
    Darren Price: Those copied sign-in pages are catching folk out all week. The address bar's where they slip. #delivery: dry, matter-of-fact
}
-> bye

=== ca08 ===
{ kit_key_caught:
    Darren Price: Good call flagging that one fast. A quick shout saves us a lot of grief later.
- else:
    Darren Price: One of the machines went down earlier. Always a scramble when a shared system drops.
}
-> bye

=== ca10 ===
{ kit_key_caught:
    Darren Price: Well spotted. Those fake device-check prompts catch people out all the time.
- else:
    Darren Price: Had a laptop out of action this week. Dodgy download, by the looks of it.
}
-> bye

=== ca16 ===
{ kit_key_caught:
    Darren Price: Good thinking. Keeping sign-ins to one person saves a lot of untangling later.
- else:
    Darren Price: Folk still share logins when they're stuck. Makes it murder to work out who did what.
}
-> bye

=== ca19 ===
{ kit_key_caught:
    Darren Price: Nice one. Catching it early means IT can box it off before it spreads.
- else:
    Darren Price: IT pulled a machine off the network today. Updates had slipped, apparently.
}
-> bye

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca05_prompt ===
{ kit_ca05_moved:
    -> bye
}
{ kit_ca05_prompt_choice == "stop" || kit_ca05_prompt_choice == "approve" || kit_ca05_prompt_choice == "silent" || kit_ca05_done:
    -> ca05
}
Darren Price: Password's in, and now my phone wants me to approve it. Fine to say yes?
{ kit_ca05_prompt_choice == "":
    ~ kit_ca05_prompt_choice = "asked"
}
+ [Deny it. Check voicemail the usual way, and report it now.]
    ~ kit_ca05_prompt_choice = "stop"
    Darren Price: Right, denied. I'll report it now and change my password.
    #exit_conversation
    -> DONE
+ [Approve it. The prompt's from Quayholt, so it's real.]
    ~ kit_ca05_prompt_choice = "approve"
    Darren Price: Done. That's me in. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca05_prompt_choice = "silent"
    #exit_conversation
    -> DONE

// Reached from the request bark. A bark's knot sticks, so a second entry never re-answers.
// Once the beat is over a late click gets the stub, so no answer lands after the recap.
=== ca10_check ===
{ kit_ca10_moved:
    -> bye
}
{ kit_ca10_check_choice == "close" || kit_ca10_check_choice == "paste" || kit_ca10_check_choice == "silent" || kit_ca10_done:
    -> ca10
}
Darren Price: It says press Windows and R, then paste and press Enter. It's off my bookmarks. Shall I?
{ kit_ca10_check_choice == "":
    ~ kit_ca10_check_choice = "asked"
}
+ [Close that tab and ring security now.]
    ~ kit_ca10_check_choice = "close"
    Darren Price: Closing it. I'll ring security.
    #exit_conversation
    -> DONE
+ [Go on. Your phone prompt still guards the account.]
    ~ kit_ca10_check_choice = "paste"
    Darren Price: Pasted. The box has gone. #delivery: cheerful, unbothered
    #exit_conversation
    -> DONE
+ [\[Say nothing\]]
    ~ kit_ca10_check_choice = "silent"
    #exit_conversation
    -> DONE

// Every knot ends on this choice: a knot that prints its line and ends at DONE with no
// choice shows only "(End of conversation)" in person-chat (GATE_A.md Diagnosis).
=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca08_react ===
{ kit_key_caught:
    Darren Price: Someone flagged that one quick. Once they're in an account they send as you, so a fast shout boxes them in. #delivery: approving, dry
- else:
    Darren Price: A sign-in from abroad right after a click is them already inside. The sooner it's reported, the less they reach. #delivery: dry, matter-of-fact
}
-> bye

=== ca10_react ===
{ kit_key_caught:
    Darren Price: Someone saw through that verify box. No real check tells you to press keys and paste. That paste runs a hidden command. #delivery: approving, dry
- else:
    Darren Price: A check that tells you to press keys or paste something isn't a check. Close it, touch nothing, and ring security. #delivery: dry, matter-of-fact
}
-> bye

=== ca16_react ===
{ kit_key_caught:
    Darren Price: Keep a login to one person and the odd sign-in stands out. Share it and there's nowhere to spot them. #delivery: approving, dry
- else:
    Darren Price: A borrowed login hides whoever's using it among the rest of us. That's exactly what someone up to no good counts on. #delivery: dry, matter-of-fact
}
-> bye

=== ca19_react ===
{ kit_key_caught:
    Darren Price: Caught before it spread. It locks whatever it reaches, then waits for someone to pay to get it back. #delivery: approving, dry
- else:
    Darren Price: A locked screen with a countdown and a demand to pay is ransomware. Get security on it fast, from another phone, before it spreads further. #delivery: dry, matter-of-fact
}
-> bye
