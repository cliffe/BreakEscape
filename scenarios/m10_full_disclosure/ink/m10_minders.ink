INCLUDE m10_carryover_vars.ink
VAR end_quiet = false   // end_rest: skip the line once after an exit
// ================================================
// Mission 10: Full Disclosure - the minders (SAFETYNET's van team, unnamed)
// Group B, stage 7b. Contract §1.4. Copies and their currentKnot:
// minder_post -> post, minder_blast -> blast, minder_lock -> lock.
// One line each, no globals. UK English.
// No DONE or END: each exit returns to its own knot, whose line is the re-entry.
// ================================================

=== start ===
{ending != "": -> end_rest}
{
- outer_lock_open:
    -> lock
- breach_open and nightshade_tethered:
    -> blast
- else:
    -> post
}

// At the van end all night.
=== post ===
{ending != "": -> end_rest}
Minder: Van's warm. That's the only good news I've got.
+ [Keep it warm.]
    Minder: Will do.
    #exit_conversation
    -> post

// With silent Nightshade at the blast door when Arakawa can't be.
=== blast ===
{ending != "": -> end_rest}
Minder: He hasn't moved. Neither have I.
+ [Keep it that way.]
    Minder: Will do.
    #exit_conversation
    -> blast

// Holding the outer lock when Quintero can't.
=== lock ===
{ending != "": -> end_rest}
Minder: Quintero's not coming up. I've got the lock. Go on.
+ [Thanks.]
    Minder: Mind how you go.
    #exit_conversation
    -> lock

// Stage 9 walkthrough R1b-M1: after his ending, nothing in-raid. One quiet line
// by ending, none from SAFETYNET people on Join (a narrator beat), and the exit.
=== end_rest ===
{
- end_quiet:
    ~ end_quiet = false
- ending == "joined":
    Narrator: The minder doesn't look at you.
- ending == "executed":
    Narrator: The minder says nothing.
- ending == "scorched":
    Minder: Out. Follow the torches.
- else:
    Minder: We're done. Van's warm.
}
+ [(Leave it.)]
    ~ end_quiet = true
    #exit_conversation
    -> end_rest
