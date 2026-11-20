// ================================================
// Fixture C (DRAFT): Irena Novak, field contact, comms. Office desk.
// Plan §9.3. Shows her SAFETYNET phone; her bag stays in the drawer (the
// burner is found by picking the drawer, t_c_novak_bag). The player can clone
// her badge here (#clone_keycard, m05 shape: tag on a throwaway line, then a
// debrief knot reading c_novak_badge_cloned, set by t_c_badge_cloned). The
// copy opens the garage. Her word about the night of the leak and the quarry
// clears nothing. Act: wait in the comms room, as the others.
// She is the guilty one in truth; nothing here says so. Her lines stay dry and
// guarded, the same register an innocent loner would use.
// ================================================

VAR se_intel_c_novak_safenet = false
VAR c_novak_badge_cloned = false
VAR c_comms_locked = false
VAR c_leaving = false
VAR deduction_closed = false

// Ink-local
VAR met = false
VAR asked_leak = false
VAR asked_quarry = false
VAR hub_quiet = false

=== start ===
{met:
    -> hub
- else:
    ~ met = true
    Irena Novak: Door. Shut it. You're HaX's new pair of eyes.
    -> hub
}

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Irena Novak: {&Yes?|Quickly.|What.}
}
+ {not c_comms_locked and not c_leaving and not deduction_closed} [Go and wait in the comms room. Once you're in, I can't take it back.]
    -> wait_comms
+ {not se_intel_c_novak_safenet} [Show me your kit.]
    -> show_kit
+ {not c_novak_badge_cloned} [Mind if I look over the comms rota with you?]
    -> clone
+ {not asked_leak} [Where were you the night of the leak?]
    -> leak
+ {not asked_quarry} [Have you been out to the quarry site?]
    -> quarry
+ [I'll leave you to it.]
    Irena Novak: Shut the door behind you.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== show_kit ===
Irena Novak: My phone. SAFETYNET, same as yours. #grant_fact:c_novak_safenet
Irena Novak: The bag stays in the drawer. Personal.
-> hub

=== clone ===
Narrator: You lean over the desk. Her badge hangs a hand's width from your hip.
#clone_keycard:c_novak_badge
Narrator: She doesn't look up from the rota.
-> clone_debrief

=== clone_debrief ===
{c_novak_badge_cloned:
    Irena Novak: Your bag hummed. HaX gives you such cheap kit.
- else:
    Irena Novak: Seen enough? Good.
}
-> hub

=== leak ===
~ asked_leak = true
Irena Novak: Here, working. Ask the walls. They'll say the same.
-> hub

=== quarry ===
~ asked_quarry = true
Irena Novak: I go where HaX sends me. Where that is, is between me and the travel log.
-> hub

=== wait_comms ===
Irena Novak: The comms room. How thoughtful. Fine. #set_global:c_waiting_ded_c_novak:true #remove_npc #exit_conversation
-> END
