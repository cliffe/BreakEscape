// Pass 4 (design review fix 1): the day-to-night turn. A hidden narrator-only
// cutscene, launched by the night_transition NPC's room_entered:main_hallway
// mapping the first time the player leaves Victoria's room after her card is
// saved (or she is knocked out). Synced globals only; no EXTERNAL getters.
VAR receptionist_ko = false
VAR victoria_ko = false

-> start

=== start ===
#speaker:narrator
{ victoria_ko:
    Narrator: You close the conference room door on Sterling and walk out with the last of the afternoon's visitors. Nobody goes looking for her before the building shuts.
- else:
    { receptionist_ko:
        Narrator: Sterling's card is saved in the cloner. You leave by the fire stairs before anyone wonders why the front desk is empty.
    - else:
        Narrator: Sterling's card is saved in the cloner. You sign out at the front desk and walk out into the afternoon with the last of the visitors.
    }
}
Narrator: Eleven o'clock that night, you're back. The staff entrance takes the receptionist's badge without a murmur.
Narrator: The main hallway is on its night lights. Somewhere off to the east, a guard's footsteps go round, and round again.
#exit_conversation
-> idle

// Resting point (m02 pattern): never DONE, so a reopened story lands on a choice.
=== idle ===
+ [Continue]
    #exit_conversation
    -> idle
