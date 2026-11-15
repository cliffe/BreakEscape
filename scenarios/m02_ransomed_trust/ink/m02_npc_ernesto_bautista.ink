// ===========================================
// Night porter: Ernesto Bautista
// Mission 2: Ransomed Trust
// Office life (office_life/PLAN.md 2.2, 6): ambient. No clue, no task, nothing given.
// ===========================================

VAR night_staff_attacked = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
{night_staff_attacked:
    Ernesto Bautista: That's close enough. Say what you want and go.
    -> hub
}
Ernesto Bautista: Evening. Or morning. Hard to tell in here tonight.
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Ernesto Bautista: Still here? Radio's quiet for once.
}
+ [I'll leave you to it.]
    Ernesto Bautista: Mind how you go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
