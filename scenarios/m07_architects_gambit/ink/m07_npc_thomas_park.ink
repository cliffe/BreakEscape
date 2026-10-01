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
Narrator: He is kneeling at an open junction box on the control run that feeds the transfer switch upstairs, a flashlight propped on the cable tray. He does not stop working when the door moves.

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

Narrator: He does not look up. The stripped conductor in his left hand is a finger's width from the terminal block and he holds it there, steady, like a man making a point he has made before.

Thomas Park: I lean four inches and this whole building goes to candles. You want to keep talking, talk quieter.
-> hub

=== paid ===
Thomas Park: Job's a building. Cut the backup, walk out, get paid. Nobody briefs me on the rest and I don't ask, because asking is how you end up in a room with someone like you.
-> hub

=== projection ===
Narrator: You hold the page where the flashlight can find it. He reads two lines, which is all it takes, because the number is on the second one and it has a doctor's signature under it.

Thomas Park: Two hundred and forty.

You: To three hundred and eighty-five. Over seventy-two hours. That is what the backup power is standing between.

Narrator: He is quiet long enough that you can hear the trunk runs hum.

Thomas Park: They said data centre. They said nobody's in it.

+ [Nobody is. That was never the point.]
    -> stand_down
+ [You still have four minutes. Use them differently.]
    -> stand_down

=== stand_down ===
~ park_resolved = "talked"
#set_global:park_resolved:talked
#complete_task:neutralise_park
Narrator: He lays the conductor down on the insulated mat, deliberately, then puts both hands flat on his knees where you can see them.

Thomas Park: I'm not going to help you. I want that on record. I'm just not doing this one.

Thomas Park: The vault trunks are tapped at the north run. That's not me. That's been there months.

Narrator: He picks up his bag, leaves the flashlight burning on the floor, and walks out past you without hurrying.

#exit_conversation
-> gone

=== goes_loud ===
Thomas Park: Right.

Narrator: He drops the conductor and comes up off his knees with the crimping tool already swinging.

~ park_resolved = "ko"
#set_global:park_resolved:ko
#hostile:thomas_park
#exit_conversation
-> parked

=== evade ===
Narrator: You take the door frame back into the dark of the stairwell. He waits, counting, then decides the noise was the building settling and goes back to the junction box.

~ park_resolved = "evaded"
#set_global:park_resolved:evaded
#exit_conversation
-> hub

=== back_at_it ===
Narrator: He is still at the junction box, working faster now, and the flashlight beam swings to the door before you have finished opening it.

Thomas Park: Second time. There isn't a third.
-> hub

=== gone ===
Narrator: The junction box cover is back on and finger-tight. His flashlight is still lying on the mat, burning down.

+ [Take the flashlight and move.]
    #exit_conversation
    -> gone

=== down_and_out ===
Narrator: He is out cold against the cable rack with the crimping tool a few feet from his hand. The backup power stays up, which was the only thing he was ever going to change here.

+ [Move on.]
    #exit_conversation
    -> down_and_out

// PASS 2 (lesson 21): never DONE. A hostile Park can't be talked to, so this
// only holds the story open.
=== parked ===
+ [Leave it.]
    #exit_conversation
    -> parked
