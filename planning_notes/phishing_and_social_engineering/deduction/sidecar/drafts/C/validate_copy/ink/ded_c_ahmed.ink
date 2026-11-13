// ================================================
// Fixture C (DRAFT): Tariq Ahmed, field contact, retired archivist. Lounge.
// Plan §9.3. Shows his SAFETYNET phone ("show me your kit", the only clue his
// own ink grants: a contact shows only what can be seen, §7.1). His word about
// the night of the leak clears nothing; he points at the door log instead.
// Once the keycard is revoked he opens the bedroom and comms doors (§9.3
// "Either contact can open ... with #unlock_door when asked").
// Act: "wait in the comms room", can't be called back, while !c_comms_locked;
// sets his own c_waiting global and removes him (§9.3 Verdicts).
// ================================================

VAR se_intel_c_ahmed_safenet = false
VAR c_keycard_revoked = false
VAR c_comms_locked = false
VAR c_leaving = false
VAR deduction_closed = false

// Ink-local
VAR met = false
VAR asked_leak = false
VAR asked_garage = false
VAR doors_opened = false
VAR hub_quiet = false

=== start ===
{met:
    -> hub
- else:
    ~ met = true
    Tariq Ahmed: You'll be the new one. Tea's in the pot. Mind the third stair, it bites.
    -> hub
}

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Tariq Ahmed: {&Well?|Go on.|Still here.}
}
+ {c_keycard_revoked and not doors_opened and not deduction_closed} [HaX killed my keycard. Can you open the bedroom and the comms room?]
    -> open_doors
+ {not c_comms_locked and not c_leaving and not deduction_closed} [Go and wait in the comms room. Once you're in, I can't take it back.]
    -> wait_comms
+ {not se_intel_c_ahmed_safenet} [Show me your kit.]
    -> show_kit
+ {not asked_leak} [Where were you the night of the leak?]
    -> leak
+ {asked_leak and not asked_garage} [How do I get into the garage?]
    -> garage
+ [I'll leave you to it.]
    Tariq Ahmed: Close the door on your way. It sticks.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== show_kit ===
Tariq Ahmed: Fair enough. Here. SAFETYNET issue, serial on the back. #grant_fact:c_ahmed_safenet
Tariq Ahmed: The rest is in my locker in the office. Irena keeps that room shut.
-> hub

=== leak ===
~ asked_leak = true
Tariq Ahmed: Asleep in that chair. And you've only my word for it, which is worth nothing to you.
Tariq Ahmed: Good. The door readers log every swipe. The log is in the garage.
-> hub

=== garage ===
~ asked_garage = true
Tariq Ahmed: The reader takes Irena's badge and nothing else. She wears it on her belt like a relic.
-> hub

=== open_doors ===
~ doors_opened = true
Tariq Ahmed: He's done what? Then he's angry with someone, and I hope it isn't me. #unlock_door:c_bedroom #unlock_door:c_comms
Tariq Ahmed: Both open. Don't make me regret it.
-> hub

=== wait_comms ===
Tariq Ahmed: Under suspicion or under protection? Don't answer that. I'll go. #set_global:c_waiting_ded_c_ahmed:true #remove_npc #exit_conversation
-> END
