// ================================================
// Fixture C (DRAFT): Odile Baptiste, field contact, courier. Lounge.
// Plan §9.3. Shows her SAFETYNET phone. Gossips with an influence cost (§7.2:
// the answer first, then the cost; the first gossip free, each later one -15;
// the kind word +20, once). Her one clue topic is Ahmed's quarry trip; the
// other two gossip topics give no clue but point the way (her bag holds the
// office code; the garage door log). Being a suspect, her word about others is
// fine and her word about herself clears nothing.
// Wary: vague line, no grant, no cost, topic stays open. Refuses ends the talk
// (threshold effect). Reports sets ded_c_baptiste_reported (HaX mentions it).
// Act and door-opening as Ahmed's.
// ================================================

EXTERNAL se_influence(delta, reason)

VAR se_intel_c_baptiste_safenet = false
VAR se_intel_c_ahmed_travel = false
VAR ded_c_baptiste_wary = false
VAR c_keycard_revoked = false
VAR c_comms_locked = false
VAR c_leaving = false
VAR deduction_closed = false

// Ink-local
VAR met = false
VAR gossip_count = 0
VAR asked_novak = false
VAR asked_leak = false
VAR doors_opened = false
VAR hub_quiet = false

=== start ===
{met:
    -> hub
- else:
    ~ met = true
    Odile Baptiste: HaX said you'd come. Sit anywhere except the green chair. Tariq will sulk.
    -> hub
}

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Odile Baptiste: {&What now?|Mm?|Ask, then.}
}
+ {c_keycard_revoked and not doors_opened and not deduction_closed} [HaX killed my keycard. Can you open the bedroom and the comms room?]
    -> open_doors
+ {not c_comms_locked and not c_leaving and not deduction_closed} [Go and wait in the comms room. Once you're in, I can't take it back.]
    -> wait_comms
+ {not se_intel_c_ahmed_travel} [Has anyone been out of town lately?]
    -> ask_travel
+ {not asked_novak} [What's Novak like?]
    -> ask_novak
+ {not asked_leak} [What happened the night of the leak?]
    -> ask_leak
+ {not se_intel_c_baptiste_safenet} [Show me your kit.]
    -> show_kit
* [Thanks for putting up with me. I know this isn't easy.]
    -> kind_word
+ [I'll leave you to it.]
    Odile Baptiste: Shut the door softly. Tariq naps.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== show_kit ===
Odile Baptiste: Phone. SAFETYNET, see the crest. #grant_fact:c_baptiste_safenet
Odile Baptiste: My kit bag's in the bedroom drawer. The drawer jams, so bring picks.
-> hub

=== ask_travel ===
{ ded_c_baptiste_wary:
    Odile Baptiste: I've said enough about people who aren't in the room.
    -> hub
}
Odile Baptiste: Tariq went out to the old quarry this month. Came back with chalk on his boots and wouldn't say why. #grant_fact:c_ahmed_travel
-> charge

=== ask_novak ===
{ ded_c_baptiste_wary:
    Odile Baptiste: Ask her yourself. I'm done gossiping.
    -> hub
}
~ asked_novak = true
Odile Baptiste: Irena keeps the office locked and the code to herself. She wrote it down for me once, when she had flu.
Odile Baptiste: It's still in my kit bag, I think.
-> charge

=== ask_leak ===
{ ded_c_baptiste_wary:
    Odile Baptiste: That night's not my business. Find someone else to squeeze.
    -> hub
}
~ asked_leak = true
Odile Baptiste: Someone went out through the garage in the small hours. I heard the shutter.
Odile Baptiste: The door readers keep a log. If you can get in there, it'll tell you more than I can.
-> charge

=== charge ===
~ gossip_count += 1
{ gossip_count > 1:
    ~ se_influence(-15, "pressed")
}
-> hub

=== kind_word ===
~ se_influence(20, "kind_word")
Odile Baptiste: Thanks for saying it. Most of HaX's people don't.
-> hub

=== open_doors ===
~ doors_opened = true
Odile Baptiste: Dead? What did you do? No, don't tell me. #unlock_door:c_bedroom #unlock_door:c_comms
Odile Baptiste: Both open. You owe me a coffee.
-> hub

=== wait_comms ===
Odile Baptiste: In the cupboard with the dead radio? Fine. I'll be the one sulking now. #set_global:c_waiting_ded_c_baptiste:true #remove_npc #exit_conversation
-> END

=== function se_influence(delta, reason) ===
~ return 0
