// Mission 8: The Mole - background bark. No globals, no tasks.
// Speaker: Off-Duty Agent
// PASS 2 (lesson 21): never reaches DONE; the exit returns to the hub so a
// re-talk opens on a choice rather than "(End of conversation)".
VAR mole_identified = false

=== start ===
Narrator: He doesn't look up from the magazine.
Off-Duty Agent: You didn't hear it from me. But I heard it was someone from Ops. Then I heard Intel. Then I heard Crypto.
Off-Duty Agent: Which means nobody knows anything, which means it could be anybody, which means I'm sitting where I can see both exits. You should too.
-> hub

=== hub ===
+ [Heard anything new?]
    { mole_identified:
        Off-Duty Agent: Only that the Director's had the interrogation suite cleared. Nobody's said for who. Nobody needs to.
    - else:
        Off-Duty Agent: Same rumours, different order. Crypto's ahead this hour.
    }
    -> hub
+ [Leave him to it.]
    #exit_conversation
    -> hub
