INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: THE HEARING (Scorched Earth only).
// NPC id: hearing (hidden person NPC). Opened on six_done with ending scorched
// (OT §4.7). HaX beside the player; the rest is told here; her last word closes
// the night. About a minute. Contract: CONTRACT.md §1.3.
// ===========================================

VAR hear_quiet = false

=== start ===
~ close_compute()
{ ending != "scorched" or closing_done:
    -> leave
}
Narrator: A hearing room at the Citadel, two days later. Three people behind a table, and an empty chair beside yours until HaX sits in it.
Agent HaX: He still knows. But the map's gone. He's one man with a memory now.
+ [They'll want to know why I did it.]
    Agent HaX: Tell them. Short, and true. They can count.
+ [(Say nothing.)]
-
-> fortyseven

// The forty-seven, on kept or denied, before the rest (FA §4.6; D-07).
=== fortyseven ===
{
- m09_recruiter_secret == "kept":
    Agent HaX: Before they call you. The forty-seven. Tell me properly, and then it's done.
    + [(Tell her properly.)]
        Narrator: You tell her all of it, quietly. She doesn't interrupt.
        -> the_rest
- m09_recruiter_secret == "denied":
    Agent HaX: Before they call you. The forty-seven. You told me she was fishing. Tell me what she actually said.
    + [(Tell her the truth.)]
        Narrator: You tell her. She doesn't look at you until you've finished.
        Agent HaX: Don't do that to me again.
        -> the_rest
- else:
    -> the_rest
}

=== the_rest ===
+ { m09_completed } [You said you'd tell me the rest.]
+ [(Wait for them to call you.)]
-
Agent HaX: The night he left, he asked me to go with him.
Agent HaX: I said no. It took me till morning.
Narrator: Someone behind the table reads out your designation.
#set_global:closing_done:true
{ hax_asked_database:
    Agent HaX: They'll ask me if I'd have stopped you. I'll tell them you asked, and I said it was yours.
- else:
    Agent HaX: They'll ask me if I'd have stopped you. I'll tell them I wasn't asked.
}
~ hear_quiet = true
#exit_conversation
-> finished

=== leave ===
~ hear_quiet = true
#exit_conversation
-> finished

=== finished ===
{ hear_quiet:
    ~ hear_quiet = false
- else:
    -> leave
}
+ [(Leave it.)]
    -> leave
