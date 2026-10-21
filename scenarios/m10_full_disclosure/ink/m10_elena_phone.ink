INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Elena Rodriguez on the phone, the by-hand cut (group C).
// US English. Phone NPC elena_phone. Home knot `start` is gated and silent.
// The voiced call is `cut_call` (targetKnot; resume: true; OT §4.9, CONTRACT §1.6, §4).
// No prefix for the contact, no narrator, no printed variables.

VAR elena_decided_said = false   // FA row 90: said on the first ring only

=== start ===
+ [(Put the phone away.)]
    #exit_conversation
    -> start

// ---------------------------------------------------------------
// The call: routes on gallery_shutter_cut, then cut_step.
// ---------------------------------------------------------------
=== cut_call ===
{gallery_shutter_cut:
    The shutter's already dead. You don't need me for this one.
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
It's Elena Rodriguez. They patched me into your feed. I know switchgear older than this, barely.
{not elena_decided_said:
    ~ elena_decided_said = true
    Your director decided what to do with me. This is it.
}
There's a gray cabinet by the door. A key switch and a breaker row, labeled GALLERY SHUTTER.
-> cut_0_menu
= cut_0_menu
+ [I'm at it.]
    ~ cut_step = 1
    -> cut_1
+ [Give me a minute.]
    Okay. It'll ring again when you're in there.
    #exit_conversation
    -> cut_0_menu

=== cut_1 ===
Turn the key a quarter right and leave it. That isolates the feed. Nothing moves yet.
-> cut_1_menu
= cut_1_menu
+ [Key's turned.]
    ~ cut_step = 2
    -> cut_2
+ [Give me a minute.]
    Leave the key where it is. I'm not going anywhere either.
    #exit_conversation
    -> cut_1_menu

=== cut_2 ===
Breaker row. The shutter's third from the left. Leave the rest alone, they feed the hall.
-> cut_2_menu
= cut_2_menu
+ {not gallery_camera_blinded} [And the gallery camera?]
    ~ gallery_camera_blinded = true
    The little toggle under the row, painted over. Down. That's their camera on the walkway.
    -> cut_2_menu
+ [Pulling it.]
    ~ cut_step = 3
    ~ gallery_shutter_cut = true
    Done. That shutter won't close tonight. Go get him.
    #exit_conversation
    -> cut_after
+ [Give me a minute.]
    Third from the left. It'll wait.
    #exit_conversation
    -> cut_2_menu

// After the cut: no text, one way out.
=== cut_after ===
+ [(Put the phone away.)]
    #exit_conversation
    -> cut_after
