// ===========================================
// ROBERT VANCE - PHONE SUPPORT
// Mission 4: Critical Failure
// SCADA technical guidance, available once Vance is an ally.
//
// STRUCTURE: every branch returns to `support_hub`, which always presents at
// least one sticky choice. The previous version fell through
// `#exit_conversation` straight into `-> start`, which re-entered the
// not-an-ally branch with no choice to stop on -- an infinite loop at every
// entry point (>2000 continues, 0 choices).
// See README_ink_best_practices.md:459-509 for the hub-return convention.
// ===========================================

// Ink-owned state
VAR vance_support_calls = 0
VAR guidance_provided = ""
VAR asked_charge_control = false
VAR asked_server_room = false
VAR asked_disabling = false

// Engine-owned, synced in from globalVariables.
// vance_trust_level is deliberately incremented here -- that is real progression
// and syncs back. vance_is_ally / urgency_stage are read only.
VAR vance_is_ally = false
VAR vance_trust_level = 0 // Synced scenario global: Vance's trust (0-100), read by the debrief; also raised face to face (m04_npc_robert_vance)
VAR urgency_stage = 0

// Engine-owned, synced in from globalVariables. Set true by the
// objective_aim_completed:map_the_attack mapping (all four flags in), so the
// branches gated on it below fire once the attack is mapped.
VAR attack_mechanism_known = false
VAR server_room_reached = false    // global; set on entering the workshop (PASS 3 P16)
VAR plant_reader_seen = false      // global; set on entering Hall 2 (PASS 3 P8)
VAR asked_plant_reader = false
VAR robert_vance_ko = false        // global; Vance knocked out -- nobody answers
// PASS 4 fix 13: urgency now reads the real state (urgency_stage 2 is never set).
VAR anomaly_detected = false
VAR hydrogen_alarm = false
VAR racks_vented = false

EXTERNAL player_name()

// ===========================================
// ENTRY
// ===========================================

=== start ===
{robert_vance_ko: -> vance_no_answer}
{not vance_is_ally: -> vance_not_yet_ally}
~ vance_support_calls += 1
-> vance_phone_support_start

// PASS 3 phone-chat rule. A phone chat reopened after a synced global changed
// re-navigates to the knot of the first saved choice, not `start`
// (phone-chat-minigame.js:532-566), so every resting knot re-checks its own
// state at the top. This one prints no NPC text (the preload would add an
// unread message), so a player who opens the phone before allying sees only a
// way out, and is routed on as soon as vance_is_ally flips.
=== vance_not_yet_ally ===
{robert_vance_ko: -> vance_no_answer}
{vance_is_ally: -> start}
+ [(He's at the ops desk. Talk to him there.)]
    #exit_conversation
    -> vance_not_yet_ally

=== vance_no_answer ===
+ [(No answer.)]
    #exit_conversation
    -> vance_no_answer

=== vance_phone_support_start ===
{vance_support_calls == 1:
    {player_name()}. What do you need?
- else:
    Still here. Still watching it climb.
}

-> support_hub

// ===========================================
// HUB
// ===========================================

=== support_hub ===
{robert_vance_ko: -> vance_no_answer}
+ {not asked_charge_control} [How do the charge controls work?]
    ~ asked_charge_control = true
    ~ vance_trust_level += 3
    # influence_increased
    -> charge_control_systems_explanation

+ {server_room_reached and not asked_server_room} [I'm in the workshop. What am I looking for?]
    ~ asked_server_room = true
    ~ vance_trust_level += 3
    # influence_increased
    -> server_room_guidance

+ {not asked_disabling} [How do I shut this down safely?]
    ~ asked_disabling = true
    ~ vance_trust_level += 3
    # influence_increased
    -> safe_disabling_guidance

+ {plant_reader_seen and not asked_plant_reader} [The plant room's on a fingerprint reader.]
    ~ asked_plant_reader = true
    HV room. Authorised persons only, and tonight that's me.
    I can't leave the desk. Voltage is through there, and somebody has to watch the real numbers.
    They didn't need me on the ninth. I log every round on the Hall 1 panel. They lifted my print off it. Do the same.
    -> support_hub

+ [What should I be doing right now?]
    ~ vance_trust_level += 5
    # influence_increased
    -> priority_guidance

+ [How bad is it?]
    ~ vance_trust_level += 3
    # influence_increased
    -> urgency_assessment

+ [That's everything for now.]
    #exit_conversation
    -> support_call_end

// ===========================================
// GUIDANCE
// ===========================================

=== charge_control_systems_explanation ===
~ guidance_provided = "charge_control_systems"

Three rack banks, A, B and C, and each one's got its own management unit and its own cooling loop.

They all run over SCADA, and SCADA is theirs. Type a change at a terminal and they'll just push it back.

The one thing they can't reach is the hardwired shutdown in the plant room.

It isolates the banks and forces the vents. It all comes down to that button.

-> support_hub

=== server_room_guidance ===
~ guidance_provided = "server_room"

{attack_mechanism_known:
    You've got their setup mapped. That's the hard part done.
    Now it's the shutdown. Nothing you type will hold. They own that layer.
- else:
    The terminal in there reaches the BMS jump server.
    If they staged anything, it's on that box.
    Scan it, see what's listening, find their way in. Anything you pull goes through the drop-site terminal.
}

-> support_hub

=== safe_disabling_guidance ===
~ guidance_provided = "disabling"

One thing, and it isn't a keyboard.

Every control path runs through SCADA, and SCADA is theirs. Delete their script and they'll push it back before you've closed the window.

The shutdown button in the plant room is hardwired. Straight to the bank isolators, no network in the middle. The one thing they couldn't touch.

Get to it and press it. That's the mission.

{urgency_stage >= 3:
    And be quick. I'm watching bank B climb while we talk.
- else:
    Steady, though. Rush it and you trip the very thing you're stopping.
}

-> support_hub

=== priority_guidance ===
{not attack_mechanism_known:
    Find out how they're driving the SCADA network. Everything waits on that.
    The jump-server terminal in the workshop is your way in.
}
{attack_mechanism_known and urgency_stage >= 3:
    We're past planning. Get to the hardwired shutdown and press it. It's the only thing left that works.
}
{attack_mechanism_known and urgency_stage < 3:
    You know what they did. Now get to the shutdown and press it.
}

-> support_hub

=== urgency_assessment ===
{
- racks_vented:
    Bank B's gone. A and C are holding, for now.
    The hardwired shutdown isolates what's left and forces the vents. Get to it.
- hydrogen_alarm:
    Bank B's venting hydrogen. That's the stage before fire.
    The ESD is built for exactly this. Get to it.
- anomaly_detected:
    The historian has the cells past sixty and climbing. My screens still say twenty-eight.
    They've set it for 0800, but cells that hot don't wait for a clock.
- else:
    The historian reads hotter than my screens. Read the dial in Hall 1 and you'll see by how much.
    They've set it for 0800.
}

-> support_hub

=== support_call_end ===
Call me if you need it.

{urgency_stage >= 3:
    And hurry.
- else:
    I'm not going anywhere.
}

-> support_hub

// The old `vance_emergency_call` knot was removed in pass 2: it was orphaned (no
// eventMapping reached it), its "get those vectors down, all of them" line
// contradicted the one-ESD design, and firing a phone conversation when the
// racks vent (T+12m, likely mid-finale) would drop a call over the plant-room
// fight (lesson 20). The racks_vent timer's own hint covers that beat.
