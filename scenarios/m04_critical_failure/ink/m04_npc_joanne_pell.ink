// ===========================================
// Mission 4: NPC - Joanne Pell
// Albion's training and inductions coordinator, in early for the six o'clock contractor
// inductions. Office-life extra (office_life/PLAN.md 2.14, 6). Ambient: no clue, no task.
// One line per talk; a curt variant after trouble (aes_staff_off).
// Her exchanges live in m04_npc_ibrahim_diallo.ink (he owns them).
// ===========================================

// Synced from the scenario: set once trouble starts or the site is evacuated.
VAR aes_staff_off = false

=== start ===
{aes_staff_off:
    Joanne Pell: I'd rather you kept your distance, love.
- else:
    Joanne Pell: Hiya, duck. I've a dozen inductions at six, so I came in early to set the room up. Don't mind me.
}
#exit_conversation
-> DONE
