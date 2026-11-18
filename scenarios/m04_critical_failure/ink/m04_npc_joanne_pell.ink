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
    Joanne Pell: I'd rather you kept your distance, love. #exit_conversation
- else:
    Joanne Pell: {&Hiya, duck. I've a dozen inductions at six, so I came in early to get ahead. Don't mind me.|Lanyards, sign-in sheets, a slideshow nobody reads. Inductions don't run themselves.|Robert said I could use the sofa. I'm not complaining.|Kettle's in the ops office, if you're after a brew.} #exit_conversation
}
// Loop to the knot, not DONE: the chat closes on the tag with the divert still unread, so the
// saved story is mid-knot and a plain DONE here made every later talk show only "(End of
// conversation)". Looping replays the line each talk (the house pattern, as m03 hub exits).
// The tag sits on the spoken line itself, so each talk returns one line with the tag in one read.
-> start
