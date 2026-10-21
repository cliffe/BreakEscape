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
    #exit_conversation
    -> cut_after
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
Turn the key a quarter right and leave it. That isolates the feed. Nothing's moved yet.
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
Breaker row. The shutter's third from the left, the big one. Don't touch the others.
-> cut_2_menu
= cut_2_menu
+ {not gallery_camera_blinded} [And the gallery camera?]
    ~ gallery_camera_blinded = true
    Small toggle under the row, painted over. Flick it down. That's their camera on the gallery.
    -> cut_2_menu
+ [Pulling it.]
    ~ cut_step = 3
    ~ gallery_shutter_cut = true
    That's it. Shutter's dead. Sixty-year-old kit, and it still does what it's told.
    #exit_conversation
    -> cut_after
+ [Give me a minute.]
    Third from the left. Take your time.
    #exit_conversation
    -> cut_2_menu

// After the cut: no text, one way out.
=== cut_after ===
+ [(Put the phone away.)]
    #exit_conversation
    -> cut_after
