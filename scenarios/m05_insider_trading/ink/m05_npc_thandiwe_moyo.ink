// ===========================================
// Mission 5: NPC - Thandiwe Moyo
// Quantum Dynamics' office manager. Office-life extra (office_life/PLAN.md 2.1, 6).
// Ambient: no clue, no task, nothing given. She knows nothing of the operation.
// Three lines; the choices change which of them the player hears, and nothing else.
// Her exchanges with Niamh live in m05_npc_niamh_doherty.ink (Niamh owns them).
//
// Never reaches DONE/END (lesson 21): the exit tag is followed by a divert back to the
// choices. A reopen re-enters the choices knot, which prints the opener again.
// ===========================================

// Skips the opener once after a goodbye, so the line printed behind the exit tag is not shown (m03 pattern).
VAR hub_quiet = false

=== start ===
-> choices

=== choices ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Thandiwe Moyo: Can I help? I'm only the office manager.
}
+ [Just looking around.]
    Thandiwe Moyo: Help yourself to tea if you're staying.
    -> goodbye
+ [I'll leave you to it.]
    -> goodbye

=== goodbye ===
Thandiwe Moyo: Thanks. These parcels won't chase themselves.
~ hub_quiet = true
#exit_conversation
-> choices
