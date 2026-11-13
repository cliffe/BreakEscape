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
// Phase 4 dialogue C1 (D5-27): guidance_provided removed (never read).
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
// Pass 5 decision 1: the night crew can be warned from the phone too. crew_warned
// is written with #set_global (synced); attack_prevented is read only.
VAR crew_warned = false
VAR attack_prevented = false
// Round 2: the hub states the alarm's real cost, which depends on whether the
// clock is already running. The workshop card feeds priority_guidance,
// mirroring the face-to-face vance_priority.
// Round 4 (review M2). Read only. (all_flags_in and vance_provided_keycard
// dropped in puzzle chains R3-4 / R3-6: nothing read them.)
VAR voltage_neutralised = false
VAR relay_card_cloned = false
VAR operative_relay_defeated = false

EXTERNAL player_name()

// ===========================================
// ENTRY
// ===========================================

// Phone-calls M4 (Vance callable). The support line is a voiced call now. The hub is reached only
// by the call knot `support_call` (the `call` entry's knot, dialled by the green Call button or a
// #place_call tag). The call rings out until Vance is an ally and while he is knocked out: that is
// the `call` entry's `when` (vance_is_ally && !robert_vance_ko) and `unavailable: "no_answer"`,
// config set by the implementer, so the ink no longer routes the not-ally / KO / no-answer cases
// (the old vance_not_yet_ally / vance_no_answer knots are gone). The whole file from `support_call`
// to `support_call_end` is the voiced call; `start` stays a silent text stub.

=== start ===
// Home text stub (phone reopen rule). Opening the thread by hand shows only a way out; the Call
// button places the call (support_call). No NPC line here: a preload would add an unread message.
+ [(Close.)]
    #exit_conversation
    -> start

// ===========================================
// CALL
// ===========================================

=== support_call ===
// lint: call-knot
// Reached only when vance_is_ally && !robert_vance_ko (the `call` entry's `when`), so no KO/ally guard.
~ vance_support_calls += 1
{
- vance_support_calls == 1:
    Vance. What do you need?
- attack_prevented:
    Banks are isolated. The hydrogen's coming down at last.
// Phase 4 dialogue C1 (D5-22): not "Still here." from four characters.
- anomaly_detected:
    Vance. The hydrogen's still climbing.
- else:
    Vance.
}

-> support_hub

// ===========================================
// HUB
// ===========================================

=== support_hub ===
// lint: call-knot
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

+ {not asked_disabling and not attack_prevented} [How do I shut this down safely?]
    ~ asked_disabling = true
    ~ vance_trust_level += 3
    # influence_increased
    -> safe_disabling_guidance

+ {plant_reader_seen and not asked_plant_reader} [The plant room's on a fingerprint reader.]
    ~ asked_plant_reader = true
    HV room. Authorised persons only, and tonight that's me.
    I can't leave the desk. Somebody has to watch the hydrogen, and I don't know who's through there.
    They didn't need me on the ninth. I log every round on the Hall 1 panel. They lifted my print off it. Do the same.
    -> support_hub

+ {(anomaly_detected or attack_mechanism_known) and not crew_warned and not racks_vented and not attack_prevented} [The night crew in Hall 2. Can you get them out?]
    -> crew_offer

+ [What should I be doing right now?]
    ~ vance_trust_level += 5
    # influence_increased
    -> priority_guidance

+ [How bad is it?]
    ~ vance_trust_level += 3
    # influence_increased
    -> urgency_assessment

+ [That's everything for now.]
    -> support_call_end

// ===========================================
// GUIDANCE
// ===========================================

=== charge_control_systems_explanation ===
// lint: call-knot
Three rack banks, A, B and C, and each one's got its own management unit and its own cooling loop.

SCADA's theirs, so the only thing that works is the hardwired shutdown in the plant room.

-> support_hub

=== server_room_guidance ===
// lint: call-knot
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
// lint: call-knot
One thing, and it isn't a keyboard.

// Phase 4 dialogue C1: the hardwired plant-room shutdown is introduced once, in
// charge_control_systems_explanation ("the only thing that works is the hardwired
// shutdown"). D5-5: no "press it" before it can arm.
The shutdown button in the plant room is hardwired. Straight to the bank isolators, no network in the middle.

{
- attack_mechanism_known and anomaly_detected:
    Get to it and press it.
- attack_mechanism_known:
    It won't arm until grid control has a real reading. The dial in Hall 1.
- anomaly_detected:
    It won't arm until grid control knows how they did it. That's the workshop.
- else:
    It won't arm until grid control believes you. Prove the screens wrong, then prove how.
}

{urgency_stage >= 3:
    And be quick. I'm watching bank B climb while we talk.
- else:
    Steady, though. Watch the hydrogen panel in Hall 2 on your way.
}

-> support_hub

// Round 2 (review m2): mirrors the face-to-face vance_priority, so the phone
// never sends the player to the shutdown before it can work.
=== priority_guidance ===
// lint: call-knot
{
- attack_prevented:
    Go and see what they left behind. I'll watch the banks.
- not anomaly_detected:
    My screens all read the same feed. Check the racks against something that isn't on it.
    There's an old dial on the Rack Bank C wall in Hall 1.
- not server_room_reached and not (relay_card_cloned or operative_relay_defeated):
    The workshop wants a Level 2 card, and mine's only Level 1. Their contractors had Level 2.
- not attack_mechanism_known:
    The workshop. If they got onto my network, it was through the jump server in there.
- urgency_stage >= 3:
    We're past planning. Get to the hardwired shutdown and press it. It's the only thing left that works.
- else:
    You know what they did. Now get to the shutdown and press it.
}

-> support_hub

// Pass 5 decision 1. Text knot, then a choices-only knot (phone reopen rule, E13).
// Round 2 (review M1, orchestrator decision 1): the cost is said plainly before
// "Sound it.", and it is true to when it's asked: before the attack is mapped
// the alarm starts a clock; after, the clock is already running.
=== crew_offer ===
// lint: call-knot
I can sound the evacuation from here. Klaxon and strobes in every hall.
{
- voltage_neutralised:
    Whoever was in my plant room isn't listening any more. It costs you nothing.
- attack_mechanism_known:
    Whoever's in my plant room hears it too. Your clock's running anyway. All it costs you now is surprise.
- else:
    And whoever's in my plant room hears it too. He'll not wait for morning.
    Half an hour, maybe, and you've not finished in the workshop.
}
-> crew_offer_choices

=== crew_offer_choices ===
// lint: call-knot
+ [Sound it. Get them out.]
    -> crew_sound
+ [Not yet.]
    Your call. Say the word and it goes.
    -> support_hub

=== crew_sound ===
// lint: call-knot
#set_global:crew_warned:true
~ crew_warned = true
Sounding it now. They're moving. Nine of them, out through the Hall 2 fire doors.
-> support_hub

=== urgency_assessment ===
// lint: call-knot
{
- attack_prevented:
    Not any more. The cells are cooling.
- racks_vented:
    Bank B's gone. A and C are holding, for now.
    The hardwired shutdown isolates what's left and forces the vents. Get to it.
- hydrogen_alarm:
    Bank B's venting hydrogen. That's the stage before fire.
    The ESD is built for exactly this. Get to it.
- anomaly_detected:
    Your dial says sixty-one. I've the hydrogen readout from the vent controller up here, it's off their network, and it's climbing.
    They've set it for 0800, but cells that hot don't wait for a clock.
- else:
    My screens say twenty-eight and I don't believe them. Read the dial in Hall 1. It isn't on their network.
    They've set it for 0800.
}

-> support_hub

=== support_call_end ===
// lint: call-knot
Call me if you need it.

{urgency_stage >= 3 and not attack_prevented:
    And hurry.
- else:
    I'm not going anywhere.
}

// Phone-calls M4 (plan 3.5): a call ends on its last line with #exit_conversation then -> DONE.
// The engine moves the story to the home knot (`start`) after the call; the thread never replays
// the hub as silent text.
#exit_conversation
-> DONE

// The old `vance_emergency_call` knot was removed in pass 2: it was orphaned (no
// eventMapping reached it), its "get those vectors down, all of them" line
// contradicted the one-ESD design, and firing a phone conversation when the
// racks vent (T+12m, likely mid-finale) would drop a call over the plant-room
// fight (lesson 20). The racks_vent timer's own hint covers that beat.
