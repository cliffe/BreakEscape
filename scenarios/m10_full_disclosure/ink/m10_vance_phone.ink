INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Robert Vance on the phone, the by-hand cut (group C).
// Phone NPC vance_phone. Home knot `start` is gated and silent. The voiced call
// is `cut_call` (targetKnot; resume: true; OT §4.9, CONTRACT §1.6 and §4).
// No prefix for the contact, no narrator, no printed variables.
// A "wait" choice exits to the step's own menu, so a resume lands on it.

=== start ===
+ [(Put the phone away.)]
    #exit_conversation
    -> start

// ---------------------------------------------------------------
// The call: routes on gallery_shutter_cut, then cut_step.
// ---------------------------------------------------------------
=== cut_call ===
{gallery_shutter_cut:
    Shutter's dead already. You don't need me for that.
    -> cut_close_right
}
{
- cut_step == 0:
    -> cut_0
- cut_step == 1:
    -> cut_1
- else:
    -> cut_2
}

=== cut_0 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
Vance. They've told me what you're stood in. Old kit, so we do it by the book.
Grey cabinet by the door. Key switch and a breaker row, GALLERY SHUTTER on the label.
-> cut_0_menu
= cut_0_menu
+ [I'm at it.]
    ~ cut_step = 1
    -> cut_1
+ [Give me a minute.]
    Right. I'll ring back when you're in the room.
    #exit_conversation
    -> cut_0_menu

=== cut_1 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
Turn the key a quarter right and leave it. That takes the row off their board. It's ours now, not theirs.
-> cut_1_menu
= cut_1_menu
+ [Key's turned.]
    ~ cut_step = 2
    -> cut_2
+ [Give me a minute.]
    Leave the key where it is. I'll wait.
    #exit_conversation
    -> cut_1_menu

=== cut_2 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
Breaker row. The shutter's third from the left, the big one. Don't touch the others.
-> cut_2_menu
= cut_2_menu
+ {not gallery_camera_blinded} [And the gallery camera?]
    ~ gallery_camera_blinded = true
    Small toggle under the row, painted over. Flick it down. That's their camera on the gallery.
    -> cut_2_menu
// Puzzle chains P2: the player pulls it at the isolator; the call ends on the instruction (resume lands back here).
// Dialogue R3 m1: a question, so the instruction answers it.
+ [Anything else before I pull it?]
    Third from the left, the big one. Go and pull it. Nothing else.
    -> cut_2_go
= cut_2_go
+ [On it.]
    #exit_conversation
    -> cut_2_menu

// Puzzle chains P2: rung once the player has pulled it (cut_step 3).
=== cut_done ===
That's it. Shutter's dead. Sixty-year-old kit, and it still does what it's told.
-> cut_close_way

// After the cut: no text, one way out.
=== cut_after ===
+ [(Put the phone away.)]
    #exit_conversation
    -> cut_after

// Stage 9 final check (m09 CONTRACT §15 pattern): the phone closes ~3 ms after
// the last line before #exit_conversation, so a call whose last line carries
// information ends on a short unvoiced player reply. Flags are set before it.

=== cut_close_way ===
+ [On my way.]
    #exit_conversation
    -> cut_after

=== cut_close_right ===
+ [Right.]
    #exit_conversation
    -> cut_after
