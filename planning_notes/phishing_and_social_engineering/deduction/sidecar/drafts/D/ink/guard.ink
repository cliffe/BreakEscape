// ================================================
// Fixture D (Night train): Nadia Rahman, the guard. Phone NPC in d_car1's npcs,
// registered at the start so her eventMappings (unlockDoor on d_stop_<n>) are
// live before the carriages load. She holds no clues. Phone ink: no prefix for
// the contact's own lines; the resting knot holds choices only.
// Reads the stop globals so "when's the next stop" is never stale.
// ================================================

VAR d_stop_1 = false
VAR d_stop_2 = false
VAR d_stop_3 = false
VAR d_stop_4 = false
VAR deduction_closed = false

=== start ===
-> hub

=== hub ===
+ [When's the next stop?] -> next_stop
+ [Why are the doors locked?] -> doors
+ [Thanks, Nadia.]
    Any time. Keep your phone on.
    #exit_conversation
    -> hub

=== next_stop ===
{
- deduction_closed:
    No more stops. We're coasting in. Whatever you decided, it's decided.
- d_stop_4:
    That was the last one. Carriage five's open. Do what you came to do before we reach the coast.
- d_stop_3:
    One more. The door to carriage five opens there, and that's the end of the line.
- d_stop_2:
    Two to go. Carriage four opens at the next.
- d_stop_1:
    Three to go. Carriage three opens at the next.
- else:
    First stop's a couple of minutes off. Carriage two opens there.
}
If you've seen enough where you are, wait by the far door. I'll bring her in early.
-> hub

=== doors ===
Company rule on the night service. One carriage at a time, doors open at the stops.
And at every stop, someone gets off with less luggage than they got on with. Look round before you move on.
-> hub
