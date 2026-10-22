INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Voltage (Critical Mass), the power room (group C).
// NPC ids: voltage_van (currentKnot van; captured, at the forward post until
// the breach), voltage_power_captured (currentKnot captured; koImmune),
// voltage_power (currentKnot escaped; knockable). MC §3.4, CONTRACT §1.6.
// The in-person cut uses the same steps and global (cut_step) as the phone cut.

VAR volt_quiet = false      // skip the re-entry line once after an exit
VAR volt_c_seen = false     // captured: the opener has played
VAR volt_e_seen = false     // escaped: the opener has played
VAR volt_talk = 0           // escaped: right picks in the talk-down (0, 1, 2)
VAR volt_missed = false     // escaped: a miss ended the talk

=== start ===
{
- m04_voltage_captured and not breach_open:
    -> van
- m04_voltage_captured:
    -> captured
- else:
    -> escaped
}

// Captured, in the van at the forward post until the breach.
=== van ===
{volt_quiet:
    ~ volt_quiet = false
- else:
    Voltage (Critical Mass): Cuffed in front. Somebody thinks I'll need my hands tonight.
}
+ [You might.]
    Voltage (Critical Mass): Then somebody's right for once.
    ~ volt_quiet = true
    #exit_conversation
    -> van

// ---------------------------------------------------------------
// Captured: he offers both options himself (the signposting).
// ---------------------------------------------------------------
=== captured ===
{voltage_outcome == "":
    ~ voltage_outcome = "avoided"
}
// Alignment R9 sweep: Wendell (or the phone voice) may have cut the shutter already.
{gallery_shutter_cut:
    -> captured_rest
}
{voltage_outcome == "by_hand":
    -> cut_in_person
}
{voltage_outcome == "his_hands":
    -> captured_rest
}
{volt_quiet:
    ~ volt_quiet = false
    -> captured_menu
}
{volt_c_seen:
    Voltage (Critical Mass): {&Still live. Your call.|The shutter won't cut itself.}
    -> captured_menu
}
~ volt_c_seen = true
Voltage (Critical Mass): You checked my sums. Now check this.
Voltage (Critical Mass): A new feed cable-tied onto a board from 1962. It'll hold. Just.
Voltage (Critical Mass): Let me do it. It's quicker. Or do it yourself, and I'll tell you which one's the gallery camera.
-> captured_menu

=== captured_menu ===
// Alignment R9 sweep: a reopen enters here, so the shutter is tested again.
{gallery_shutter_cut:
    -> captured_rest
}
+ [Your hands. Go on.]
    ~ voltage_outcome = "his_hands"
    Voltage (Critical Mass): I could. Watch my hands.
    Voltage (Critical Mass): Key, breaker, done. The camera's still on. I left it for you to see.
    Voltage (Critical Mass): Write down that I did it myself.
    ~ gallery_shutter_cut = true
    + + [I'll write it down.]
        Voltage (Critical Mass): Good. It's the only part of tonight I'll sign.
    + + [We'll see.]
        Voltage (Critical Mass): That's what they said at Albion.
    - -
    ~ volt_quiet = true
    #exit_conversation
    -> captured_rest
+ [I'll do it. Talk me through it.]
    ~ voltage_outcome = "by_hand"
    Voltage (Critical Mass): You're right not to trust me.
    -> cut_in_person
+ [Give me a minute.]
    Voltage (Critical Mass): Take it. I've nowhere to be.
    ~ volt_quiet = true
    #exit_conversation
    -> captured

=== captured_rest ===
{volt_quiet:
    ~ volt_quiet = false
- else:
    Voltage (Critical Mass): {gallery_shutter_cut: Shutter's isolated. The rest is yours.|Still live. Your call.}
}
+ [Stay here.]
    Voltage (Critical Mass): I'm cuffed to a man from your van. Where would I go?
    ~ volt_quiet = true
    #exit_conversation
    -> captured_rest

// ---------------------------------------------------------------
// By hand, in person: the shared cut shape (CONTRACT §1.6), routed on
// cut_step so a walk-away lands on the first unanswered step.
// ---------------------------------------------------------------
=== cut_in_person ===
{gallery_shutter_cut:
    -> captured_rest
}
{volt_quiet:
    ~ volt_quiet = false
    {
    - cut_step == 0:
        -> cut_p0.cut_p0_menu
    - cut_step == 1:
        -> cut_p1.cut_p1_menu
    - else:
        -> cut_p2.cut_p2_menu
    }
}
{
- cut_step == 0:
    -> cut_p0
- cut_step == 1:
    -> cut_p1
- else:
    -> cut_p2
}

=== cut_p0 ===
// R10: a reopen re-enters the knot (not the stitch), so the test sits here as well.
{gallery_shutter_cut:
    -> captured_rest
}
Voltage (Critical Mass): Grey panel by the door. A key switch, a row of breakers, GALLERY SHUTTER on the label.
-> cut_p0_menu
= cut_p0_menu
{gallery_shutter_cut:
    -> captured_rest
}
+ [I'm at it.]
    ~ cut_step = 1
    -> cut_p1
+ [Give me a minute.]
    Voltage (Critical Mass): Go and stand at it. I'll wait.
    ~ volt_quiet = true
    #exit_conversation
    -> cut_in_person

=== cut_p1 ===
// R10: a reopen re-enters the knot (not the stitch), so the test sits here as well.
{gallery_shutter_cut:
    -> captured_rest
}
Voltage (Critical Mass): Turn the key a quarter right and leave it there. That takes the row off their board. It's ours now.
-> cut_p1_menu
= cut_p1_menu
{gallery_shutter_cut:
    -> captured_rest
}
+ [Key's turned.]
    ~ cut_step = 2
    -> cut_p2
+ [Give me a minute.]
    Voltage (Critical Mass): The key's not going anywhere.
    ~ volt_quiet = true
    #exit_conversation
    -> cut_in_person

=== cut_p2 ===
// R10: a reopen re-enters the knot (not the stitch), so the test sits here as well.
{gallery_shutter_cut:
    -> captured_rest
}
Voltage (Critical Mass): Breaker row. Third from the left is the shutter. Leave the others; they feed the hall.
-> cut_p2_menu
= cut_p2_menu
{gallery_shutter_cut:
    -> captured_rest
}
+ {not gallery_camera_blinded} [And the gallery camera?]
    ~ gallery_camera_blinded = true
    Voltage (Critical Mass): The small toggle under the row, painted over. Down. That's their camera on the walkway.
    -> cut_p2_menu
// Puzzle chains P2: the player pulls it at the isolator (its click writes the cut); his success line is a bark on the cut.
+ [Going to it.]
    Voltage (Critical Mass): Third from the left. Go and pull it yourself. I'll watch.
    ~ volt_quiet = true
    #exit_conversation
    -> cut_in_person

// ---------------------------------------------------------------
// Escaped: he runs the room. The print (m04), the corrected sheet, or a fight.
// Static is beside him on m04_static_left and not m04_static_left_alone.
// ---------------------------------------------------------------
=== escaped ===
{voltage_outcome == "":
    ~ voltage_outcome = "avoided"
}
// Alignment R10-m4: a reload restores hostility, but a Restart after the player is knocked out calms it; a fight he was in then starts again.
{voltage_outcome == "fought":
    -> fight
}
{voltage_outcome == "stood_down_print" or voltage_outcome == "talked_down":
    -> escaped_rest
}
{volt_quiet:
    ~ volt_quiet = false
    -> escaped_menu
}
{volt_e_seen:
    Voltage (Critical Mass): {&You came back. Nothing you say next will be new.|Still here. So's the shutter.}
    -> escaped_menu
}
~ volt_e_seen = true
Voltage (Critical Mass): Albion's agent. You came a long way to stand in my power room.
{m04_static_left and not m04_static_left_alone:
    ENTROPY Operative 'Static': Voltage. Company.
}
Voltage (Critical Mass): The shutter stays live until he says otherwise. Say what you came to say.
-> escaped_menu

=== escaped_menu ===
+ {m04_voltage_print_on_bypass and voltage_print_lifted} [That's your thumb on the bypass. Same as Albion.]
    ~ voltage_outcome = "stood_down_print"
    Voltage (Critical Mass): My print. *flatly* I'm not going to argue with my own thumb.
    Agent HaX: I told you it'd be waiting. It was.
    -> stand_down
+ {casualty_sheet_read and not volt_missed and volt_talk == 0} [You check sums for a living. His casualty sheet is wrong.]
    ~ volt_talk = 1
    Voltage (Critical Mass): I know. I know my figures to one decimal place. This one's wrong by a thousand.
    Voltage (Critical Mass): I found it in March. I said nothing.
    -> escaped_menu
+ {casualty_sheet_read and not volt_missed and volt_talk == 0} [People die whatever the sums say. That's the point.]
    ~ volt_missed = true
    Voltage (Critical Mass): Don't tell me about sums.
    -> escaped_menu
+ {not volt_missed and volt_talk == 1} [Then say it now. He signed a number he knew was low.]
    ~ voltage_outcome = "talked_down"
    Voltage (Critical Mass): He did. He signed it in front of me.
    -> stand_down
+ {not volt_missed and volt_talk == 1} [You said nothing. You're as bad as he is.]
    ~ volt_missed = true
    Voltage (Critical Mass): You came to lecture me. The lecture's over.
    -> escaped_menu
+ [Step away from the board. Now.]
    -> fight
+ [Not yet.]
    Voltage (Critical Mass): Then get out of my power room. The clock doesn't care either way.
    ~ volt_quiet = true
    #exit_conversation
    -> escaped

// A stand-down: he cuts the shutter himself and goes out cuffed.
=== stand_down ===
~ gallery_shutter_cut = true
Voltage (Critical Mass): Shutter's isolated. Cuff me in front. I'll want my hands for the inquiry.
{m04_static_left and not m04_static_left_alone:
    ENTROPY Operative 'Static': He doesn't need me, then.
}
~ volt_quiet = true
#exit_conversation
-> escaped_rest

// A failed talk, or the player's choice to fight. The phone voice rings for the cut.
=== fight ===
~ voltage_outcome = "fought"
~ cut_by_hand = true
// Alignment R12-m2: both hostile tags ride the first line, so a close mid-reply arms both.
{m04_static_left and not m04_static_left_alone:
    #hostile:static_power
}
#hostile:voltage_power
Voltage (Critical Mass): Then be quick about it.
{m04_static_left and not m04_static_left_alone:
    ENTROPY Operative 'Static': Not past me.
}
~ volt_quiet = true
#exit_conversation
-> escaped_rest

=== escaped_rest ===
{volt_quiet:
    ~ volt_quiet = false
- else:
    {
    - voltage_outcome == "fought":
        Voltage (Critical Mass): You've got me. You haven't got him.
    - else:
        Voltage (Critical Mass): Cut, and cuffed. Go and finish it.
    }
}
+ [Stay down.]
    Voltage (Critical Mass): I'm not going anywhere tonight.
    ~ volt_quiet = true
    #exit_conversation
    -> escaped_rest
