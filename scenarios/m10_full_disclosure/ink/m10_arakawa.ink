INCLUDE m10_carryover_vars.ink
VAR end_quiet = false   // end_rest: skip the line once after an exit
// ================================================
// Mission 10: Full Disclosure - Officer Kenji Arakawa
// Group B, stage 7b. Contract §1.4. Copies and their currentKnot:
// arakawa_post -> post, arakawa_gate -> gate, arakawa_blast -> blast,
// arakawa_so -> so, arakawa_ws -> ws, arakawa_pr -> pr, arakawa_hall -> hall
// (RL §2.9). Pacific Northwest, US English; soft and slow.
// gate is his call at 02:10 (OT §6): opened by his own mapping, no choice,
// its last line sets arakawa_call_done. He is the alibi the player sees.
// The face-to-face wrong accusation is offered by every copy the player can
// reach after clue 1 (blast, so, ws, pr, hall). His recall line plays in
// HaX's recall_arakawa.
// No DONE or END: exits divert to a resting knot.
// ================================================

VAR arak_quiet = false
VAR arak_road_asked = false
VAR arak_daughter_asked = false
VAR arak_peel_said = false

=== function arak_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == "" and officer_out == "" and not wren_at_core and ending == ""

=== start ===
{ending != "": -> end_rest}
{
- server_hall_entered and not nightshade_tethered:
    -> hall
- power_room_entered and not nightshade_tethered:
    -> pr
- workshop_entered and not nightshade_tethered:
    -> ws
- security_office_entered and not nightshade_tethered:
    -> so
- nightshade_tethered and breach_open:
    -> blast
- split_started:
    -> gate
- else:
    -> post
}

// ---------------- the forward post ----------------

// The kit check (koImmune table copy).
=== post ===
{ending != "": -> end_rest}
{
- arak_quiet:
    ~ arak_quiet = false
- else:
    Officer Kenji Arakawa: Case is packed. Don't ask me where half of it goes.
}
+ {not arak_road_asked} [The road?]
    -> arak_road ->
    ~ arak_quiet = true
    -> post
+ [See you at the gate.]
    Officer Kenji Arakawa: I'll be there.
    ~ arak_quiet = true
    #exit_conversation
    -> post

=== arak_road ===
~ arak_road_asked = true
Officer Kenji Arakawa: The sheriff closed it. Nobody asked who for.
{m09_completed:
    Officer Kenji Arakawa: Nobody did in Helena either.
}
->->

// His call at 02:10 (OT §6; MC §4): a line, not a choice. Malhotra logs it
// from the van end, which puts him there at ten past.
// SE's "It's ten past eight here" is replaced: the contract keeps every
// spoken time in UTC (§5.6), so he gives the minutes instead of a local time.
=== gate ===
{ending != "": -> end_rest}
{arakawa_call_done: -> gate_rest}
Narrator: Arakawa steps up beside you at the gate and dials.
Officer Kenji Arakawa: Our clock runs on UTC. At home it's her bedtime. Thirty seconds, I promise.
Narrator: He turns half away and talks low into the phone. Something about Saturday.
Officer Kenji Arakawa: She wants a telescope. I'm getting her a telescope.
~ arakawa_call_done = true
Officer Dev Malhotra: Arakawa, you're off the net.
~ arak_quiet = true
#exit_conversation
-> gate_rest

=== gate_rest ===
{
- arak_quiet:
    ~ arak_quiet = false
- else:
    Officer Kenji Arakawa: Holding the gate. Nothing's come up the road.
}
+ {not arak_daughter_asked} [Your daughter?]
    ~ arak_daughter_asked = true
    Officer Kenji Arakawa: Nine on Saturday. I promised I'd be home for it.
    ~ arak_quiet = true
    -> gate_rest
+ {not arak_road_asked} [The road?]
    -> arak_road ->
    ~ arak_quiet = true
    -> gate_rest
+ [Hold it.]
    Officer Kenji Arakawa: Holding.
    ~ arak_quiet = true
    #exit_conversation
    -> gate_rest

// The tether: at the blast door with silent Nightshade all night.
=== blast ===
{ending != "": -> end_rest}
Officer Kenji Arakawa: I've got him. He hasn't said a third word.
~ arak_quiet = true
-> menu

// ---------------- below ground ----------------

// Security office: the photo line when Kowalczyk is off the team (RL §2.9).
=== so ===
{ending != "": -> end_rest}
{
- not whodunit_live:
    Officer Kenji Arakawa: They took that from a long way off. Somebody's been watching you a while.
- else:
    Officer Kenji Arakawa: This room was waiting for you. Stay low.
}
~ arak_quiet = true
-> menu

// Workshop: his reaction when she goes ahead early (wren_warned).
=== ws ===
{ending != "": -> end_rest}
{
- wren_warned and kowalczyk_gone_ahead:
    ~ arak_peel_said = true
    Officer Kenji Arakawa: Service side. She always takes the door nobody's watching.
- else:
    Officer Kenji Arakawa: Solder. Smells like my dad's garage.
}
~ arak_quiet = true
-> menu

=== pr ===
{ending != "": -> end_rest}
Officer Kenji Arakawa: That hum's in my teeth. Let's not stay long.
~ arak_quiet = true
-> menu

// Server hall: his reaction to her default peel-off.
=== hall ===
{ending != "": -> end_rest}
{
- kowalczyk_gone_ahead and not wren_warned:
    ~ arak_peel_said = true
    Officer Kenji Arakawa: Service side. She always takes the door nobody's watching.
- else:
    Officer Kenji Arakawa: Two patrols. I'll watch the left half.
}
~ arak_quiet = true
-> menu

// The resting knot. If she went ahead while he was talked to earlier, he
// says his line once on the next talk (B-12), then the plain re-entry.
=== menu ===
{ending != "": -> end_rest}
{
- arak_quiet:
    ~ arak_quiet = false
- kowalczyk_gone_ahead and whodunit_live and accused == "" and not arak_peel_said and not nightshade_tethered:
    ~ arak_peel_said = true
    Officer Kenji Arakawa: Service side. She always takes the door nobody's watching.
- else:
    Officer Kenji Arakawa: I'm here. What do you need?
}
+ {arak_can_accuse()} [You're WREN.]
    -> accuse_check
+ [Keep moving.]
    Officer Kenji Arakawa: Right behind you.
    ~ arak_quiet = true
    #exit_conversation
    -> menu

// The face-to-face wrong accusation: the same writes as the line accusation.
=== accuse_check ===
Agent HaX: Wrong, and Arakawa's off the raid till you can clear him. Sure?
+ [I'm sure.]
    ~ officer_out = "arakawa"
    ~ wrong_accusation = true
    Officer Kenji Arakawa: You were standing right next to me. Think.
    Director Magnus Netherton: Officer Arakawa, back to the post. The county will have to manage without you.
    ~ arak_quiet = true
    #exit_conversation
    -> sent_back
+ [Forget I said it.]
    Officer Kenji Arakawa: Okay. I didn't hear it.
    ~ arak_quiet = true
    -> menu

=== sent_back ===
{
- arak_quiet:
    ~ arak_quiet = false
- else:
    Officer Kenji Arakawa: I'm going. You were there. Think about it.
}
+ [Go on.]
    Officer Kenji Arakawa: Going.
    ~ arak_quiet = true
    #exit_conversation
    -> sent_back

// Stage 9 walkthrough R1b-M1: after his ending, nothing in-raid. One quiet line
// by ending, none from SAFETYNET people on Join (a narrator beat), and the exit.
=== end_rest ===
{
- end_quiet:
    ~ end_quiet = false
- ending == "joined":
    Narrator: Arakawa doesn't look at you.
- ending == "executed":
    Narrator: Arakawa looks at the ground and says nothing.
- ending == "scorched":
    Officer Kenji Arakawa: Keep moving. The road's open.
- else:
    Officer Kenji Arakawa: I'll open the road at seven. Go and sit down.
}
+ [(Leave it.)]
    ~ end_quiet = true
    #exit_conversation
    -> end_rest
