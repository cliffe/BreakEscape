// ===========================================
// Mission 5: NPC - Bernadette Lyons
// Quantum Dynamics' evening cleaner. Office-life extra (office_life/PLAN.md 2.13, 6).
// Ambient: no clue, no task, nothing given. She arrives at the evening turn and knows nothing of the operation.
// Two lines. Her conversation offers nothing.
//
// ex_late_again is played by the needs system when she and Niamh meet at the espresso with the player in
// earshot; it is never reached from her conversation. Her record carries its gates. The engine sets
// heard_ex_late_again once a line was heard. She owns it because her id is the lower of the pair.
// ===========================================

// Set by the engine once a line of the exchange was heard.
VAR heard_ex_late_again = false

// Skips the opener once after a goodbye, so the line printed behind the exit tag is not shown (m03 pattern).
VAR hub_quiet = false

=== start ===
-> choices

=== choices ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Bernadette Lyons: Just the bins, love. Don't mind me.
}
+ [Carry on, I'll stay out of your way.]
    -> goodbye

=== goodbye ===
Bernadette Lyons: Right you are. Mind how you go.
~ hub_quiet = true
#exit_conversation
-> choices

// Evening, after the server room: the cleaner and Niamh meet at the espresso.
=== ex_late_again ===
Bernadette Lyons: You again. Do they pay you overtime?
Niamh Doherty: They pay me in biscuits.
Bernadette Lyons: Then I'll leave you the good ones.
-> DONE
