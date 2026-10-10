// ===========================================
// AGENT HaX - PHONE SUPPORT (HANDLER)
// Mission 4: Critical Failure
// Break Escape - Strategic Guidance Throughout Mission
// ===========================================

// Variables for tracking conversation state
VAR handler_contacted = 0              // Number of times player contacted handler
VAR handler_confidence = 50            // 0-100 handler's confidence in mission success
VAR server_room_reached = false
VAR attack_mechanism_known = false
VAR voltage_priority_discussed = false
VAR server_room_advice_given = false

// Field-guide exposure flags. Engine-owned: each _offered is set by an
// eventMapping when the player actually meets the thing the guide is about
// (m01 pattern -- guides are exposure-gated, never time-gated), and each
// _hint_given is set here when the guide is handed over.
VAR rfid_guide_offered = false
VAR rfid_guide_hint_given = false
VAR lockpicking_guide_offered = false
VAR lockpicking_guide_hint_given = false
VAR recon_guide_offered = false
VAR recon_guide_hint_given = false
VAR vuln_guide_offered = false
VAR vuln_guide_hint_given = false
VAR distcc_guide_offered = false
VAR distcc_guide_hint_given = false
VAR cyberchef_guide_offered = false
VAR cyberchef_guide_hint_given = false
VAR privesc_guide_offered = false
VAR privesc_guide_hint_given = false
VAR proftpd_guide_offered = false
VAR proftpd_guide_hint_given = false
VAR relay_card_cloned = false        // PASS 4: Relay's card copied on the quiet route
VAR operative_relay_defeated = false
VAR fingerprint_kit_found = false
// PLAYTEST ROUND: all four flags in (set by the flag mappings), and the evidence
// globals, so the hint can name what still holds the ESD when the flags are done.
VAR all_flags_in = false
VAR anomaly_detected = false
VAR evidence_maintenance_logs_found = false
VAR evidence_access_logs_found = false
VAR evidence_camera_tampering_found = false
VAR evidence_reader_spoof_found = false

// Game state variables
VAR vance_is_ally = false
VAR operatives_defeated = 0
VAR urgency_stage = 0
VAR flags_submitted = 0

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// CONVERSATION HUB
// ===========================================

=== start ===
{handler_contacted == 0: -> first_call}
-> support_hub

// ===========================================
// SUPPORT HUB
//
// PHASE 1a SKELETON. Every call branch returns here instead of falling through
// `#exit_conversation` into `-> start`, which re-entered `first_call` with its
// once-only choices already consumed -- that is what made all 18 enumerated
// paths error on the FIRST call, not on re-entry.
//
// The three event knots below (event_server_room_entered,
// event_attack_mechanism_identified, player_guidance_request) were previously
// ORPHANED: no eventMapping uses targetKnot, so nothing could reach them.
// They are now reachable from this hub, gated on progress.
//
// PHASE 4 will rebuild this to the m02 standard
// (m02_ransomed_trust/ink/m02_phone_agent0x99.ink:101-175): finer progress
// gating, an always-on fallback, and exposure-gated field-guide offers with
// #give_item:lab-workstation:<key>.
// ===========================================

=== support_hub ===
// Progress-gated advice. Each option appears only once the player is actually
// at that beat, and disappears once used -- so the hub always reflects where
// they are, and never offers a hint for a problem they haven't met yet.
+ {server_room_reached and not server_room_advice_given and not all_flags_in} [I'm on the OT network. What am I looking at?]
    -> event_server_room_entered

+ {attack_mechanism_known and not voltage_priority_discussed} [I've got their attack mechanism mapped.]
    -> event_attack_mechanism_identified

+ {operatives_defeated >= 1 and not voltage_priority_discussed} [I've put one of their people down.]
    -> operative_down_advice

// ---- Field guides. Exposure-gated: offered by an eventMapping when the
// ---- player meets the obstacle, handed over here on request.
+ {rfid_guide_offered and not rfid_guide_hint_given} [Send me the RFID cloning guide.]
    -> request_rfid_guide

+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [Send me the lockpicking guide.]
    -> request_lockpicking_guide

+ {recon_guide_offered and not recon_guide_hint_given} [Send me the network mapping guide.]
    -> request_recon_guide

+ {vuln_guide_offered and not vuln_guide_hint_given} [Send me the attack surface guide.]
    -> request_vuln_guide

+ {distcc_guide_offered and not distcc_guide_hint_given} [Send me the distcc guide.]
    -> request_distcc_guide

+ {privesc_guide_offered and not privesc_guide_hint_given} [Send me the sudo guide.]
    -> request_privesc_guide

+ {proftpd_guide_offered and not proftpd_guide_hint_given} [Send me the ProFTPD guide.]
    -> request_proftpd_guide

+ {cyberchef_guide_offered and not cyberchef_guide_hint_given} [Send me the CyberChef decoding guide.]
    -> request_cyberchef_guide

// ---- Always available: the fallback that stops this hub ever running dry.
+ [I need guidance.]
    -> player_guidance_request

+ [Nothing right now.]
    #exit_conversation
    Line's open. Call it in when you have something.
    -> support_hub

// ===========================================
// FIELD GUIDE HANDOVERS
// Each sets its _hint_given so the offer retires, and pushes the
// lab-workstation item into the player's inventory.
// ===========================================

=== request_rfid_guide ===
~ rfid_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_rfid_cloning
Sent. Old prox cards just shout their number. Read it, save it, play it back at the reader.
-> support_hub

=== request_lockpicking_guide ===
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_lockpicking
On its way. Tension wrench first, then pick the pins one at a time. Don't force it.
-> support_hub

=== request_recon_guide ===
~ recon_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_recon_network_mapping
Sent. Find what's alive on that subnet before you touch anything.
-> support_hub

=== request_vuln_guide ===
~ vuln_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_vuln_analysis
Sent. Once you know what's listening, it tells you what's worth pushing on.
-> support_hub

=== request_distcc_guide ===
~ distcc_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_distcc
Sent. Old daemon, runs compile jobs for anyone who asks. That's your way onto the box.
-> support_hub

=== request_privesc_guide ===
~ privesc_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_privesc
Sent. On the box, check what sudo lets you run. That's how the crew reached the calibration file.
-> support_hub

=== request_proftpd_guide ===
~ proftpd_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_proftpd
Sent. Same backdoor as St Catherine's. Someone poisoned the build at source, and every copy carried it.
-> support_hub

=== request_cyberchef_guide ===
~ cyberchef_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_cyberchef
Sent. Paste it in, hit Magic, and it'll tell you what it is.
-> support_hub

=== operative_down_advice ===
{operatives_defeated >= 2:
    Two down. Both halls clear. The only one left is the one who matters.
- else:
    {operative_relay_defeated:
        One down. Check what she dropped: that's the workshop card.
    - else:
        One down. Check what he dropped. Relay's the one carrying a workshop card.
    }
}

And {player_name()}, the hall doesn't care who's winning. Watch the hydrogen panel.

-> support_hub

// ===========================================
// KO KEYCARD FALLBACK (B1)
// Reached by an eventMapping (phone-chat) on npc_ko:operative_relay. Relay
// carries the only Level 2 card (PASS 3 P3). If the physical drop failed, HaX
// relays a working copy from the reader logs. A duplicate is harmless (the RFID
// lock needs one match). #give_item above the line it belongs to.
// ===========================================

=== on_relay_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_workshop_keycard
Relay's down. I've pulled her Level 2 number off the reader logs and pushed you a copy. That's the workshop.
-> on_relay_ko_card_choices

=== on_relay_ko_card_choices ===
+ [On it.]
    #exit_conversation
    -> support_hub

// ===========================================
// THE 61°C TURN (round 2, re-review M2)
// Reached by an eventMapping (phone-chat) on anomaly_detected. HaX quotes
// Nightshade's read (his briefing line asked for a real reading). Text knot then
// a choices-only knot (E13), like on_relay_ko_card. The reply branches on
// server_room_reached, so a late dial reading (the aim cascade) still fits.
// ===========================================

=== on_anomaly_confirmed ===
#speaker:agent_0x99
Nightshade's got your reading. Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens.
His words: those cells are past safe, and they won't wait for 0800, trigger or no trigger.
The screens lie because ENTROPY feed them. That dial isn't on ENTROPY's network.
-> on_anomaly_confirmed_choices

=== on_anomaly_confirmed_choices ===
+ {not server_room_reached} [Then where do I start?]
    #exit_conversation
    With how they're driving it. The workshop, off Hall 1.
    -> support_hub
+ {server_room_reached} [Then the dial was the last piece.]
    #exit_conversation
    It was. Grid control can see the difference now.
    -> support_hub

// ===========================================
// FIRST CALL (Initial Contact)
// Triggered: Shortly after mission start
// ===========================================

=== first_call ===
#speaker:agent_0x99

{player_name()}, status check. Are you inside the facility?
-> first_call_choices

=== first_call_choices ===

* [I'm inside. Met Robert Vance, the facility manager.]
    ~ handler_contacted += 1
    -> vance_status_inquiry

* [Inside the facility. Beginning investigation now.]
    ~ handler_contacted += 1
    -> investigation_update

* [I'm in. Anything new from your end?]
    ~ handler_contacted += 1
    -> intel_update

=== vance_status_inquiry ===
#speaker:agent_0x99

{vance_is_ally:
    ~ handler_confidence += 15

    Good. Lean on Vance when you need to. Nobody on that site knows those systems better.
- else:
    How's he taking the cover? Buying it, or watching you?

    -> vance_cover_status
}
-> vance_status_inquiry_choices

=== vance_status_inquiry_choices ===

+ [Understood. I'll keep looking.]
    -> first_call_objectives

=== vance_cover_status ===
#speaker:agent_0x99

* [Cooperative. He's getting me access.]
    ~ handler_confidence += 5
    -> vance_cooperation_acknowledged

* [Sceptical, but he's going along with the audit.]
    -> vance_skeptical_acknowledged

* [I told him the truth about ENTROPY. He's in.]
    ~ handler_confidence += 10
    -> vance_revealed_acknowledged

=== vance_cooperation_acknowledged ===
#speaker:agent_0x99

Good. Hold the cover until you've got hard evidence. Then bring him in.

-> first_call_objectives

=== vance_skeptical_acknowledged ===
#speaker:agent_0x99

Keep him onside. Find proof of the breach and it'll convince him for you.

-> first_call_objectives

=== vance_revealed_acknowledged ===
#speaker:agent_0x99

~ handler_confidence += 10

Bold. If he's in, use him. He knows how they'd have moved through those systems.

-> first_call_objectives

=== investigation_update ===
#speaker:agent_0x99

Copy. Find how they're driving the attack, then kill it. Take Voltage alive if you can.

-> first_call_objectives

=== intel_update ===
#speaker:agent_0x99

Nothing new. Still encrypted traffic between the site and somewhere outside.

Whatever it is, it's set for 0800. Time, but not much.

-> first_call_objectives

=== first_call_objectives ===
#speaker:agent_0x99

First job: find how they got onto the SCADA network.

The way on is the engineering workshop, off Battery Hall 1. Start there.

{vance_is_ally:
    Vance can point you to the right systems.
}
-> first_call_objectives_choices

=== first_call_objectives_choices ===

+ [On it.]
    -> first_call_end

=== first_call_end ===
#speaker:agent_0x99

Stay sharp. If anyone comes at you, defend yourself. Call if you need me.

#exit_conversation
-> support_hub

// ===========================================
// EVENT: SERVER ROOM ENTERED
// Triggered: Player enters the engineering workshop
// ===========================================

=== event_server_room_entered ===
#speaker:agent_0x99

~ server_room_advice_given = true
~ handler_confidence += 10

{player_name()}, you're in the workshop. That's their way in.

The BMS jump server runs through there, and so does the route onto the SCADA network.
-> event_server_room_entered_choices

=== event_server_room_entered_choices ===

+ [There's a terminal here into the BMS jump server.]
    -> vm_guidance

+ [What specifically should I investigate?]
    -> investigation_guidance

=== vm_guidance ===
#speaker:agent_0x99

~ handler_confidence += 5

Good. Scan what's on that network first, then see what each box is running.

Where they got in is on the jump server. Anything you find goes into the drop-site terminal.
-> vm_guidance_choices

=== vm_guidance_choices ===

+ [On it.]
    -> server_room_event_end

=== investigation_guidance ===
#speaker:agent_0x99

What's listening, and what shouldn't be.

Three of them were in here for hours. They left something behind. Find it, and we'll know how to pull the attack apart.
-> investigation_guidance_choices

=== investigation_guidance_choices ===

+ [Will do.]
    -> server_room_event_end

=== server_room_event_end ===
#speaker:agent_0x99

{operatives_defeated >= 1:
    And {player_name()}, you've already met one of them. There'll be more.
- else:
    Watch your back. They won't hesitate.
}

Call when you've got something.

#exit_conversation
-> support_hub

// ===========================================
// EVENT: ATTACK MECHANISM IDENTIFIED
// Triggered: Player submits final VM flag (distcc exploit)
// ===========================================

=== event_attack_mechanism_identified ===
#speaker:agent_0x99

~ handler_confidence += 20

{player_name()}, your flags are landing. Grid control can see it too.

They own the SCADA layer, and there's a remote trigger sitting on top of it.
-> event_attack_mechanism_identified_choices

=== event_attack_mechanism_identified_choices ===

+ [The software's theirs. Anything I do from a keyboard, they undo.]
    -> three_vector_confirmation

+ [Where's the remote trigger mechanism?]
    -> trigger_location_discussion

=== three_vector_confirmation ===
#speaker:agent_0x99

~ handler_confidence += 10

Right. Faked temperatures, interlocks bypassed, an overcharge on a timer.

So you don't fight it with software.

The plant room has a hardwired shutdown button, no network path. The one thing they couldn't reach.

Press it and the attack's dead.

-> voltage_priority_update

=== trigger_location_discussion ===
#speaker:agent_0x99

Your intel puts the trigger with Voltage, in the plant room.

That's where he is, and where this ends.

-> voltage_priority_update

=== voltage_priority_update ===
#speaker:agent_0x99

~ voltage_priority_discussed = true

{player_name()}, listen. Voltage is worth more to us talking than down.

He knows The Architect, how the cells coordinate, what's coming next.
-> voltage_priority_update_choices

=== voltage_priority_update_choices ===

* [Do I take Voltage even if it's the riskier play?]
    -> capture_vs_speed_guidance

* [Understood. I'll try to take him alive.]
    ~ handler_confidence += 10
    -> capture_attempt_acknowledged

* [The attack comes first. Voltage second.]
    -> attack_priority_acknowledged

=== capture_vs_speed_guidance ===
#speaker:agent_0x99

Your call on the ground. Both ways cost something.

Go for him and you're close to the trigger he's holding. Cornered, he'll use it.

Go for the button and the grid holds, but he's out the dock and gone.

You'll see it better than I will. Make the call there.
-> capture_vs_speed_guidance_choices

=== capture_vs_speed_guidance_choices ===

+ [I'll decide when I'm in the room with him.]
    ~ handler_confidence += 15
    -> judgment_trusted

=== capture_attempt_acknowledged ===
#speaker:agent_0x99

Good. But if he reaches for that trigger, stop him any way you have to. Lives first.

-> final_phase_briefing

=== attack_priority_acknowledged ===
#speaker:agent_0x99

~ handler_confidence += 5

Right priorities. If he runs but the attack fails, that's still a win.

-> final_phase_briefing

=== judgment_trusted ===
#speaker:agent_0x99

That's the approach. Work with what you find.

-> final_phase_briefing

=== final_phase_briefing ===
#speaker:agent_0x99

Last stretch. In the plant room:

Deal with Voltage and anyone still standing with him.

Keep him off that laptop.

Then the hardwired shutdown button. Press it.

{operatives_defeated >= 2:
    {operatives_defeated} of them down already. You're almost there.
}
{operatives_defeated == 1:
    One down. The rest won't make it easy.
}
{operatives_defeated == 0:
    Their people are still up. Be ready.
}
-> final_phase_briefing_choices

=== final_phase_briefing_choices ===

* [Ready. Heading for the plant room.]
    ~ handler_confidence += 10
    -> final_encouragement

=== final_encouragement ===
#speaker:agent_0x99

{handler_confidence >= 80:
    Clean run so far, {player_name()}. Finish it.
}
{handler_confidence >= 60 and handler_confidence < 80:
    Good so far. Stay sharp for the last of it.
}
{handler_confidence < 60:
    Careful. This is the worst of it.
}

Two hundred and forty thousand people are on that grid.

#exit_conversation
-> support_hub

// ===========================================
// OPTIONAL: PLAYER-INITIATED CALL (GUIDANCE REQUEST)
// Player can call for hints/support
// ===========================================

=== player_guidance_request ===
#speaker:agent_0x99

~ handler_contacted += 1

{player_name()}, go ahead.

// These are STICKY (+). As once-only (*) choices they were consumed after
// three visits, and `guidance_call_end` routes back here ("One more thing...")
// -- so a fourth visit found an empty choice list and ran out of content.
// A guidance hub must always have something to offer.
-> player_guidance_request_choices

=== player_guidance_request_choices ===
+ [What should I be doing right now?]
    -> priority_guidance

+ [Anything new on your end?]
    -> intel_status_update

+ [I'm stuck. Where do I look?]
    -> tactical_suggestions

+ [Nothing. Just checking in.]
    -> guidance_call_end

=== priority_guidance ===
#speaker:agent_0x99

{not server_room_reached:
    The engineering workshop, off Battery Hall 1. That's where they got onto the SCADA network. It wants a Level 2 card.
    {relay_card_cloned or operative_relay_defeated:
        You've got Relay's. Use it on the workshop door.
    - else:
        Relay carries one. She walks Hall 2, and Hall 2 opens on Vance's card.
    }

    {vance_is_ally:
        Vance can point you to it from the ops desk.
    }
}
{server_room_reached and not attack_mechanism_known:
    {
    - all_flags_in and not (evidence_maintenance_logs_found or evidence_access_logs_found or evidence_camera_tampering_found or evidence_reader_spoof_found):
        Your flags are in. Grid control still wants the break-in on paper.
        Vance's work orders in the operations office, the access log in the workshop, or the camera log in the security office.
    - all_flags_in and not anomaly_detected:
        Your flags are in. Grid control still wants a real reading off the racks.
        The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network.
    - else:
        Work the terminal in the workshop. Find how they're driving the attack, and drop the flags as you go.
    }
}
{server_room_reached and attack_mechanism_known:
    You know how they did it. Now stop it.

    Voltage's in the plant room with the trigger. Deal with him, then the shutdown button.
}
-> priority_guidance_choices

=== priority_guidance_choices ===

+ [Right.]
    -> guidance_call_end

=== intel_status_update ===
#speaker:agent_0x99

{attack_mechanism_known:
    Their whole mechanism's on record now. That's the case made.
- else:
    {server_room_reached:
        You're on the network. Keep pulling flags into the drop-site terminal.
    - else:
        Nothing in yet. The intel's on the BMS jump server in the workshop. Scan it, submit what you find.
    }
}

{operatives_defeated >= 2:
    Both halls clear. Static and Voltage are waiting in the plant room.
}
{operatives_defeated == 1:
    One down. Stay alert for the rest.
}
{operatives_defeated == 0:
    No contact yet. They're here. Be ready.
}
-> intel_status_update_choices

=== intel_status_update_choices ===

+ [Thanks.]
    -> guidance_call_end

=== tactical_suggestions ===
#speaker:agent_0x99

What's the problem?

// Sticky + a fallback: this knot is re-enterable from the guidance hub, and as
// once-only choices it emptied on the fourth visit.
-> tactical_suggestions_choices

=== tactical_suggestions_choices ===
+ [I can't work out where to go next.]
    -> navigation_help

+ [One of them's giving me trouble.]
    -> combat_help

+ [The network side has me lost.]
    -> vm_challenge_help

+ [Actually, I'm fine.]
    -> guidance_call_end

=== navigation_help ===
#speaker:agent_0x99

{not server_room_reached:
    The workshop's off Battery Hall 1, and it wants a Level 2 card. Vance's only reaches Level 1.

    {operative_relay_defeated:
        Relay's down. Her card's on the floor by her, and I've pushed you a copy anyway.
    - else:
        {relay_card_cloned:
            You've got Relay's card. Play it at the workshop door.
        - else:
            Relay's in the inverter room, and she carries a workshop card. Hall 2 opens on Vance's.
        }
    }
}
{server_room_reached:
    The plant room's off Hall 2, and the reader wants Vance's print.

    {fingerprint_kit_found:
        You've got the crew's kit. Now find somewhere he touches on every round.
    - else:
        You need a kit, and somewhere he touches every round. Their tool case is in the workshop. Start there.
    }
}
-> navigation_help_choices

=== navigation_help_choices ===

+ [That helps. Thanks.]
    -> guidance_call_end

=== combat_help ===
#speaker:agent_0x99

Use cover. They've got training, but so have you.

And you don't have to win every fight. Most won't chase far.

{not operative_relay_defeated and not relay_card_cloned:
    Relay's card copies like Vance's did, if you keep her talking.
}

{vance_is_ally:
    Vance may know where the others are, if you ask him.
}
-> combat_help_choices

=== combat_help_choices ===

+ [Understood]
    -> guidance_call_end

=== vm_challenge_help ===
#speaker:agent_0x99

Start with a scan to map the network. Nmap.

Then see what each box is running. The FTP and web services are holding intel.

Then push on the weak one to get a foothold. The guides cover each step.

{vance_is_ally:
    Vance can fill in the SCADA side if you get stuck.
}
-> vm_challenge_help_choices

=== vm_challenge_help_choices ===

+ [Got it. Thanks.]
    -> guidance_call_end

=== guidance_call_end ===
#speaker:agent_0x99

~ handler_confidence += 3

Anything else?

// Sticky: this knot is re-entered every time the player loops the guidance
// hub, so once-only choices leave it empty on the second pass.
-> guidance_call_end_choices

=== guidance_call_end_choices ===
+ [No, I'm good. Thanks.]
    -> call_final_end

+ [One more thing...]
    -> player_guidance_request

=== call_final_end ===
#speaker:agent_0x99

Stay safe. Call if you need me.

#exit_conversation
-> support_hub
