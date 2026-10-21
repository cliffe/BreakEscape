INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - the minders (SAFETYNET's van team, unnamed)
// Group B, stage 7b. Contract §1.4. Copies and their currentKnot:
// minder_post -> post, minder_blast -> blast, minder_lock -> lock.
// One line each, no globals. UK English.
// No DONE or END: each exit returns to its own knot, whose line is the re-entry.
// ================================================

=== start ===
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
Minder: Van's warm. That's the only good news I've got.
+ [Keep it warm.]
    Minder: Will do.
    #exit_conversation
    -> post

// With silent Nightshade at the blast door when Arakawa can't be.
=== blast ===
Minder: He hasn't moved. Neither have I.
+ [Keep it that way.]
    Minder: Will do.
    #exit_conversation
    -> blast

// Holding the outer lock when Quintero can't.
=== lock ===
Minder: Quintero's not coming up. I've got the lock. Go on.
+ [Thanks.]
    Minder: Mind how you go.
    #exit_conversation
    -> lock
