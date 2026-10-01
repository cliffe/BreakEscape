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
VAR vance_trust_level = 0
VAR urgency_stage = 0

// Engine-owned, synced in from globalVariables. Set true by the
// objective_aim_completed:map_the_attack mapping (all four flags in), so the
// branches gated on it below fire once the attack is mapped.
VAR attack_mechanism_known = false
VAR server_room_reached = false    // global; set on entering the workshop (PASS 3 P16)
VAR plant_reader_seen = false      // global; set on entering Hall 2 (PASS 3 P8)
VAR asked_plant_reader = false
VAR robert_vance_ko = false        // global; Vance knocked out -- nobody answers

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
    Robert Vance: {player_name()}. I'm on the ops desk with both screens up.
- else:
    Robert Vance: Still here. Still watching it climb.
}

-> support_hub

// ===========================================
// HUB
// ===========================================

=== support_hub ===
{robert_vance_ko: -> vance_no_answer}
+ {not asked_charge_control} [How do the charge-control systems work?]
    ~ asked_charge_control = true
    ~ vance_trust_level += 3
    # influence_increased
    -> charge_control_systems_explanation

+ {server_room_reached and not asked_server_room} [I'm in the engineering workshop. What am I looking for?]
    ~ asked_server_room = true
    ~ vance_trust_level += 3
    # influence_increased
    -> server_room_guidance

+ {not asked_disabling} [How do I disable their attack safely?]
    ~ asked_disabling = true
    ~ vance_trust_level += 3
    # influence_increased
    -> safe_disabling_guidance

+ {plant_reader_seen and not asked_plant_reader} [The plant room's on a fingerprint reader.]
    ~ asked_plant_reader = true
    Robert Vance: HV room. Authorised persons only, and tonight that's me. I can't come: Voltage is on the other side, and somebody has to watch the real numbers.
    Robert Vance: They didn't need me on the ninth. I log every round on the Hall 1 panel. They'll have had it off that. Do what they did.
    -> support_hub

+ [What should I prioritise right now?]
    ~ vance_trust_level += 5
    # influence_increased
    -> priority_guidance

+ [How urgent is this?]
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

Robert Vance: Three rack banks. A, B and C, each with its own BMS and its own cooling loop.

Robert Vance: They're driven over SCADA, and SCADA is theirs, so nothing you type at a terminal will hold — they'll just push it back.

Robert Vance: The one control they can't reach is the hardwired ESD in the plant room. That's what isolates the banks and forces the vent fans. Everything comes down to that button.

-> support_hub

=== server_room_guidance ===
~ guidance_provided = "server_room"

{attack_mechanism_known:
    Robert Vance: You've already got their infrastructure mapped. That's the hard part done.
    Robert Vance: Now it's the shutdown. Nothing you do from a terminal will hold -- they own that layer.
- else:
    Robert Vance: The terminal in there can reach our SCADA backup server.
    Robert Vance: If they staged anything, they staged it on that box.
    Robert Vance: Scan the network, look at what's listening, find where they got in. Anything you pull, put it through the drop-site terminal.
}

-> support_hub

=== safe_disabling_guidance ===
~ guidance_provided = "disabling"

Robert Vance: One thing, and it isn't a keyboard.

Robert Vance: Every control path in this plant runs through SCADA, and SCADA is theirs. Delete their script and they'll push it again before you've closed the window.

Robert Vance: The Emergency Shutdown pushbutton in the plant room is hardwired. Physical contacts straight to the bank isolators, no network in the middle. It's the one thing they could never touch.

Robert Vance: Get to it and press it. That's the mission.

{urgency_stage >= 3:
    Robert Vance: And be quick about it. I'm watching bank B climb while we talk.
- else:
    Robert Vance: Take it methodically. Rushing this is how you trip the thing you're trying to stop.
}

-> support_hub

=== priority_guidance ===
{not attack_mechanism_known:
    Robert Vance: Find out how they're driving the SCADA network. Everything else waits on that.
    Robert Vance: The jump-server terminal in the workshop is your way in.
}
{attack_mechanism_known and urgency_stage >= 3:
    Robert Vance: We're past planning. Get to the hardwired ESD and press it -- that's the only thing left that works.
}
{attack_mechanism_known and urgency_stage < 3:
    Robert Vance: You know what they did. Now get to the ESD and press it.
}

-> support_hub

=== urgency_assessment ===
{urgency_stage >= 4:
    Robert Vance: Bad. Rack temperatures are past the advisory and climbing toward runaway.
    Robert Vance: The hardwired ESD is built for exactly this — it isolates the bank and forces the vents. Get to it.
}
{urgency_stage == 3:
    Robert Vance: Charge parameters are drifting yellow. There's time. Not a lot.
}
{urgency_stage == 2:
    Robert Vance: Anomalies, nothing critical yet. Use the time while you've got it.
}
{urgency_stage < 2:
    Robert Vance: Stable, for now. But it won't stay stable on its own.
    Robert Vance: They've set it for 0800.
}

-> support_hub

=== support_call_end ===
Robert Vance: Call me if you need it.

{urgency_stage >= 3:
    Robert Vance: And hurry.
- else:
    Robert Vance: I'm not going anywhere.
}

-> support_hub

// The old `vance_emergency_call` knot was removed in pass 2: it was orphaned (no
// eventMapping reached it), its "get those vectors down, all of them" line
// contradicted the one-ESD design, and firing a phone conversation when the
// racks vent (T+12m, likely mid-finale) would drop a call over the plant-room
// fight (lesson 20). The racks_vent timer's own hint covers that beat.
