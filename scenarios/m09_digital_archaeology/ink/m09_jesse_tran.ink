// ===========================================
// m09 Digital Archaeology: Jesse Tran, IT contractor (person-chat)
// Group B, B7. CONTRACT.md §3.5. Beat 2.6; MC §4.4.
// NPC id: jesse_tran, server closet. Entry knot: start.
// 29, Vietnamese-American, Seattle. Social Fabric's man on the staff (courier
// "J.T." in the letters). Fast, ironic, very online; treats the player as a
// tourist until the letters. US English.
// No fight button. His handler, if named, is D. Varga, "the Bozeman number"
// (S6 §6.3); Netherton's "His handler is being watched, and knows it." must
// stay true, so Tran's walk-out phone call goes to that number.
// ===========================================

// Scenario globals (CONTRACT §5.3).
VAR cage_bin = ""
VAR tran_outcome = "left"
VAR tran_alerted = false

// Ink-local.
VAR tran_met = false
VAR tran_asked_reels = false
VAR tran_asked_record = false
VAR hub_quiet = false

=== start ===
{tran_met: -> hub}
~ tran_met = true
Jesse Tran: Paper. You people break into buildings at night for paper.
{tran_alerted:
    Jesse Tran: I already made a call, by the way. Somebody from Statewide is on his way, and he bills by the hour.
}
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{not hub_quiet:
    Jesse Tran: {&Still here? Bold.|You're in my light, tourist.|What. I'm working.}
}
~ hub_quiet = false
+ {not tran_asked_reels} [What are you wiping?]
    ~ tran_asked_reels = true
    Jesse Tran: Interviews. Old ones, on reels. Nobody's played them since phones had cords.
    Jesse Tran: Peg wants them gone by the end of the run. Peg gets what Peg wants.
    -> back
+ {not tran_asked_record} [Somebody's going to want a record of this.]
    ~ tran_asked_record = true
    Jesse Tran: Derek wrote things down. Look how that went. I don't write things down.
    -> back
// The lever (MC §4.4): only with the letters, which name his courier run.
+ {cage_bin == "letters" and tran_outcome == "left"} [You can explain these to Social Fabric, or to me.]
    Narrator: He reads the courier line, J.T., and takes his hands off the keyboard.
    Jesse Tran: Fine. It's off. I walk out that door, and I make a phone call on the way.
    -> deal
+ [Enjoy your night.]
    Jesse Tran: {&Living the dream.|Bye, tourist.}
    #exit_conversation
    -> back

// His price is said before the player agrees.
=== deal ===
+ [Go.]
    #set_global:tran_outcome:talked
    Jesse Tran: The Bozeman number gets one call from me. After that I'm a guy who fixes printers.
    #exit_conversation
    -> back
+ [No deal.]
    Jesse Tran: Your call. The wipe keeps running.
    -> back
