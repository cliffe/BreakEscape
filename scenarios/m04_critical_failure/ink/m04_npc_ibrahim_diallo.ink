// ===========================================
// Mission 4: NPC - Ibrahim Diallo
// Albion's office IT support lead, in overnight for a desktop swap. Office-life extra
// (office_life/PLAN.md 2.14, 6). Ambient: no clue, no task, nothing given.
// One line per talk; a curt variant after trouble (aes_staff_off).
//
// The three exchanges below are played by the needs system when Ibrahim and Joanne meet at
// the ops-office kettle with the player in earshot; they are never reached from his
// conversation. Order and gates are in his NPC record. The engine sets heard_<knot> once a
// line was heard. Ibrahim owns them because his id is the lower of the pair.
// ===========================================

// Synced from the scenario: set once trouble starts or the site is evacuated.
VAR aes_staff_off = false

// Set by the engine once a line of each exchange was heard.
VAR heard_ex_six_oclock = false
VAR heard_ex_not_on_the_rota = false
VAR heard_ex_stay_out_of_the_halls = false

=== start ===
{aes_staff_off:
    Ibrahim Diallo: I'll keep to my work, if it's all the same to you. #exit_conversation
- else:
    Ibrahim Diallo: {&Hello. I'm waiting on the office desktops to image. The swap was booked late, so I won't be on tonight's list.|Still imaging. Forty minutes a machine, and there are six.|If the reception PCs boot by six, I'll call it a win.|Nobody thanks IT until the screens go black.} #exit_conversation
}
// Loop to the knot, not DONE: the chat closes on the tag with the divert still unread, so the
// saved story is mid-knot and a plain DONE here made every later talk show only "(End of
// conversation)". Looping replays the line each talk (the house pattern, as m03 hub exits).
// The tag sits on the spoken line itself, so each talk returns one line with the tag in one read.
-> start

=== ex_six_oclock ===
Joanne Pell: Twelve contractors at six, all new.
Ibrahim Diallo: And the reception PCs half swapped.
Joanne Pell: They can sign in on paper, then.
Ibrahim Diallo: Paper never needs me. That's its flaw.
-> DONE

=== ex_not_on_the_rota ===
Ibrahim Diallo: Neither of us is on tonight's rota.
Joanne Pell: Your swap was booked late, then?
Ibrahim Diallo: After the rota went out. You're early.
Joanne Pell: Inductions today. Nobody knows I'm in.
-> DONE

=== ex_stay_out_of_the_halls ===
Joanne Pell: Robert says keep out of the halls.
Ibrahim Diallo: Till the crew's done. Fine by me.
Joanne Pell: Not at this hour, no thank you.
-> DONE
