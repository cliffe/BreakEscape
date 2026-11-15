// ===========================================
// Night domestic: Hodan Warsame
// Mission 2: Ransomed Trust
// Office life (office_life/PLAN.md 2.2, 6): ambient. No clue, no task, nothing given.
// The exchange knots are played by the needs system when she and Ernesto meet with the player
// in earshot; they are never reached from her conversation.
// ===========================================

VAR night_staff_attacked = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
{night_staff_attacked:
    Hodan Warsame: Don't come any nearer. I'm on the radio if I need to be.
    -> hub
}
Hodan Warsame: You lost? Everyone's lost tonight.
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Hodan Warsame: Still about, then?
}
+ [I'll let you get on.]
    Hodan Warsame: Go on, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
