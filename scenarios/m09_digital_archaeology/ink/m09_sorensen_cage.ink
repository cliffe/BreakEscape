// ===========================================
// m09 Digital Archaeology: Margaret Sorensen in the cage (person-chat)
// Group B, B4. CONTRACT.md §3.3. Beat 2.1 step 6; MC §4.3.
// NPC id: sorensen, at the shredder's feed. Entry knot: start.
// She keeps feeding. An arrest doesn't stop her; SAFETYNET can't arrest.
// No fight button: a knock-out is the player's own blow, and HaX's
// npc_ko:sorensen mapping sets the fate.
// After "Give me a pencil" she says nothing more (SE §3; B-5): every later
// beat is a Narrator line.
// ===========================================

INCLUDE m09_carryover_vars.ink

// Scenario globals (CONTRACT §5.3).
VAR sorensen_fate = "left"
VAR nightshade_file_held = false
VAR ledger_read_heard = false

// Ink-local.
VAR cage_met = false
VAR cage_asked_wren = false
VAR hub_quiet = false

=== start ===
{cage_met or sorensen_fate != "left": -> hub}
~ cage_met = true
Narrator: She feeds another sheaf into the shredder and doesn't turn round.
Margaret Sorensen: It's only paper. The people are where they've always been, at their desks, doing what they were placed to do.
Margaret Sorensen: Paper was the only thing that could ever have hurt them. So the paper goes.
Margaret Sorensen: Torres cost us one hospital bill, and he got us within an afternoon of a nation's dispatch keys. I'd call that good value. So would you, if you were honest.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
// Re-entry tracks sorensen_fate. Once talked, she has no more speech.
{not hub_quiet:
    {sorensen_fate == "talked":
        Narrator: She's writing in pencil, box by box. She doesn't look up.
    - else:
        Margaret Sorensen: {&Another box.|Keep your sleeves away from the feed.|You're standing in my light.}
    }
}
~ hub_quiet = false
+ {sorensen_fate == "left"} [It's over. Put the stamp down.]
    Narrator: She doesn't look up.
    Margaret Sorensen: When I've finished, dear. You'll want the list to be complete.
    -> back
// The lever (MC §4.3): her own pencilled query says the plan chest wasn't
// on the schedule. Shown only with Nightshade's file in hand. "Your
// Architect" so "he" can't be read as Nightshade (script edit B-12).
+ {nightshade_file_held and sorensen_fate == "left"} [Your Architect kept his own papers off your list. Only yours burn.]
    Narrator: She reads the label on the file in your hand, and sets the stamp down.
    #set_global:sorensen_fate:talked
    Margaret Sorensen: Then I'll keep what's left. Give me a pencil. I'll write down what I've destroyed, accurately.
    // Stage 8 M-03 (ruling 2): the room's ambient shredder keeps sounding, so
    // the line stops the feeding, not the noise.
    Narrator: She takes her hand off the feed. The shredder runs on, empty.
    -> back
+ {ledger_read_heard and sorensen_fate == "left" and not cage_asked_wren} [Who's WREN?]
    ~ cage_asked_wren = true
    Margaret Sorensen: I keep records. I don't read them aloud.
    -> back
+ [I'm done here.]
    {sorensen_fate == "talked":
        Narrator: She keeps writing.
    - else:
        Margaret Sorensen: The gate sticks.
    }
    #exit_conversation
    -> back
