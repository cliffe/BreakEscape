// Pass 4 (design review fix 1): the day-to-night turn. A hidden narrator-only
// cutscene, launched by the night_transition NPC's room_entered:main_hallway
// mapping the first time the player leaves Victoria's room after her card is
// saved (or she is knocked out). Synced globals only; no EXTERNAL getters.
VAR receptionist_ko = false
VAR victoria_ko = false
// Pass 5 (P1-21): quiet flag so a reopen of this one-shot scene lands on a
// re-entry line, not a blank [Continue]. Set after the narration and on exit.
VAR scene_quiet = false

-> start

=== start ===
#speaker:narrator
{ victoria_ko:
    // Pass 5 (R1-2): she is unconscious, so say so.
    Narrator: Sterling is out cold on the conference room floor. You pull the door shut behind you.
    Narrator: You walk out with the last of the afternoon's visitors. Nobody goes looking for her before the building shuts.
- else:
    { receptionist_ko:
        Narrator: Sterling's card is saved in the cloner. You leave by the fire stairs before anyone wonders why the front desk is empty.
    - else:
        Narrator: Sterling's card is saved in the cloner. You sign out at the front desk and walk out into the afternoon with the last of the visitors.
    }
}
Narrator: Eleven o'clock that night, you're back. The staff entrance takes the receptionist's badge without a murmur.
Narrator: The main hallway is on its night lights. Somewhere off to the east, a guard's footsteps go round, and round again.
~ scene_quiet = true
#exit_conversation
-> idle

// Resting point (m02 pattern): never DONE, so a reopened story lands on a choice.
// The quiet flag suppresses the line on the first pass (the narration above has just
// played) and shows it on a later reopen, so re-entry is never blank.
=== idle ===
#speaker:narrator
{ scene_quiet:
    ~ scene_quiet = false
- else:
    Narrator: The hallway's still on its night lights. Off to the east, the guard goes round again.
}
+ [Continue]
    ~ scene_quiet = true
    #exit_conversation
    -> idle
