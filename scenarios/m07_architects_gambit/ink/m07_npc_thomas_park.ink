// ===========================================
// m07 The Architect's Gambit -- THOMAS PARK
// NPC id: thomas_park   displayName: Thomas Park
// Room: cable_vault. Static, reacts on entry.
//
// Critical Mass sabotage tech, in the vault to cut the facility's own backup
// power. Cold, brief, busy. He is pressure on the last approach, not plot.
//
// Three resolutions per CONTRACT.md park_resolved: "talked" / "ko" / "evaded".
// The only thing that reaches him is the casualty projection, because he was
// briefed on a building and not on a number.
// ===========================================

VAR park_resolved = ""
VAR park_ko = false
VAR casualty_projection_found = false
VAR found_mole_evidence = false

VAR park_greeted = false

=== start ===
{park_ko:
    -> down_and_out
}
{park_resolved == "talked":
    -> gone
}
{park_resolved == "evaded":
    -> back_at_it
}
-> entry

=== entry ===
// PASS 2: the transfer switch is upstairs in the generator hall; he is in the
// vault, cutting the control run that feeds it (the jumper upstairs is his too).
Narrator: He is kneeling at an open junction box on the control run to the transfer switch. He doesn't stop working.

Thomas Park: Four minutes and I'd have been out. Four.

~ park_greeted = true
-> hub

=== hub ===
+ [Step away from the cable.]
    -> refuse
+ {casualty_projection_found} [Read this. It's the projection for what you're covering.]
    -> projection
+ [Who's paying you to cut the backup?]
    -> paid
+ [Then finish it and see what happens.]
    -> goes_loud
+ [Nothing. I was never here.]
    -> evade

=== refuse ===
Thomas Park: No.

Narrator: He doesn't look up. The stripped wire in his hand stays a finger's width from the terminal.

Thomas Park: I lean four inches and this building goes to candles. Talk quieter.
-> hub

=== paid ===
Thomas Park: Job's a building. Cut the backup, walk out, get paid. I don't ask about the rest.
Thomas Park: Asking is how you end up in a room with someone like you.
-> hub

=== projection ===
Narrator: You hold the page where the flashlight can find it. He reads two lines. The number is on the second.

Thomas Park: Two hundred and forty. Three hundred and eighty-five.

Narrator: The trunk runs hum.

Thomas Park: They said a building. Empty, they said. Nobody in it.

+ [The building's empty. The people are on the other end of the wires.]
    -> stand_down
+ [You've got four minutes. Spend them walking out.]
    -> stand_down

=== stand_down ===
~ park_resolved = "talked"
#set_global:park_resolved:talked
#complete_task:neutralise_park
Narrator: He lays the wire down on the mat and puts his hands on his knees.

Thomas Park: I'm not helping you. Put that on record. I'm just not doing this one.

Thomas Park: The north trunk run's tapped. Months ago. Not me.

Narrator: He picks up his bag and walks out past you, unhurried.

#exit_conversation
-> gone

=== goes_loud ===
Thomas Park: Right.

Narrator: He comes up off his knees with the crimping tool swinging.

~ park_resolved = "ko"
#set_global:park_resolved:ko
#hostile:thomas_park
#exit_conversation
-> parked

=== evade ===
Narrator: You back into the dark of the stairwell. He waits, then goes back to the junction box.

~ park_resolved = "evaded"
#set_global:park_resolved:evaded
#exit_conversation
-> hub

=== back_at_it ===
Narrator: He is still at the junction box, working faster. His flashlight finds the door before you're through it.

Thomas Park: Second time. There isn't a third.
-> hub

=== gone ===
Narrator: The junction box cover is back on, finger-tight. His flashlight lies on the mat, burning down.

+ [Move on.]
    #exit_conversation
    -> gone

=== down_and_out ===
Narrator: He is out cold against the cable rack. The backup power stays up.

+ [Move on.]
    #exit_conversation
    -> down_and_out

// PASS 2 (lesson 21): never DONE. A hostile Park can't be talked to, so this
// only holds the story open.
=== parked ===
+ [Leave it.]
    #exit_conversation
    -> parked
