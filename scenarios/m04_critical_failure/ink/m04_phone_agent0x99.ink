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

// Game state variables
VAR chen_is_ally = false
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
+ {server_room_reached and not server_room_advice_given} [I'm on the OT network. What am I looking at?]
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

+ {cyberchef_guide_offered and not cyberchef_guide_hint_given} [Send me the CyberChef decoding guide.]
    -> request_cyberchef_guide

// ---- Always available: the fallback that stops this hub ever running dry.
+ [I need guidance.]
    -> player_guidance_request

+ [Nothing right now.]
    #exit_conversation
    Agent HaX: Line's open. Call it in when you have something.
    -> support_hub

// ===========================================
// FIELD GUIDE HANDOVERS
// Each sets its _hint_given so the offer retires, and pushes the
// lab-workstation item into the player's inventory.
// ===========================================

=== request_rfid_guide ===
~ rfid_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_rfid_cloning
Agent HaX: Sending it now. Read the card, crack the keys, emulate it at the reader — that's the whole shape of it.
-> support_hub

=== request_lockpicking_guide ===
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_lockpicking
Agent HaX: On its way. Tension wrench first, then pick the pins one at a time. Don't force it.
-> support_hub

=== request_recon_guide ===
~ recon_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_recon_network_mapping
Agent HaX: Sent. Find what's alive on that subnet before you touch anything.
-> support_hub

=== request_vuln_guide ===
~ vuln_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_vuln_analysis
Agent HaX: Sent. Once you know what's listening, this tells you what's worth pushing on.
-> support_hub

=== request_distcc_guide ===
~ distcc_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_distcc
Agent HaX: Sent. It's an old daemon that runs compile jobs for anyone who asks. That's your command execution.
-> support_hub

=== request_cyberchef_guide ===
~ cyberchef_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_cyberchef
Agent HaX: Sent. Paste it in, hit Magic, and it'll tell you what it is.
-> support_hub

=== operative_down_advice ===
{operatives_defeated >= 2:
    Agent HaX: Two down. That's both halls clear, which means the only one left is the one who matters.
- else:
    Agent HaX: One down. Check them — these people carry the cards that open the doors they're standing in front of.
}

Agent HaX: And {player_name()} — the hall doesn't care who's winning. Watch the hydrogen panel.

-> support_hub

// ===========================================
// KO KEYCARD FALLBACKS (B1)
// Reached by an eventMapping (phone-chat) on npc_ko:operative_cipher /
// npc_ko:operative_relay. If the physical card drop failed, HaX relays a working
// copy from the reader logs so the workshop / plant room stays reachable. The
// card is also still on the floor if the drop worked; a duplicate is harmless
// (the RFID lock matches on opens_lock). #give_item above the line it belongs to.
// ===========================================

=== on_cipher_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_workshop_keycard
Agent HaX: He's down. I've pulled his Level 2 card's number off the reader logs and pushed a working copy to your kit. If his own card turns up on the floor, you've got a spare. Either way, the workshop's open.
+ [Understood.]
    #exit_conversation
    -> support_hub

=== on_relay_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_master_keycard
Agent HaX: Relay's down. Same trick: there's a copy of her master card in your kit now, whatever happened to the real one. The plant room's the last door. Voltage is behind it.
+ [On it.]
    #exit_conversation
    -> support_hub

// ===========================================
// FIRST CALL (Initial Contact)
// Triggered: Shortly after mission start
// ===========================================

=== first_call ===
#speaker:agent_0x99

{player_name()}, status check. Are you inside the facility?

* [I'm inside. Met Robert Vance, the facility manager.]
    ~ handler_contacted += 1
    -> chen_status_inquiry

* [Inside the facility. Beginning investigation now.]
    ~ handler_contacted += 1
    -> investigation_update

* [I'm in. Anything new from your end?]
    ~ handler_contacted += 1
    -> intel_update

=== chen_status_inquiry ===
#speaker:agent_0x99

{chen_is_ally:
    ~ handler_confidence += 15

    Good. Vance's cooperation will be valuable—he knows those systems inside out.

    Use his SCADA expertise when you need it.
- else:
    How's he taking the cover story? Suspicious or cooperative?

    -> chen_cover_status
}

+ [Understood. Continuing investigation]
    -> first_call_objectives

=== chen_cover_status ===
#speaker:agent_0x99

* [Cooperative. Providing facility access.]
    ~ handler_confidence += 5
    -> chen_cooperation_acknowledged

* [Sceptical, but he's complying with the audit cover.]
    -> chen_skeptical_acknowledged

* [I told him the truth about ENTROPY. He's fully on board.]
    ~ handler_confidence += 10
    -> chen_revealed_acknowledged

=== chen_cooperation_acknowledged ===
#speaker:agent_0x99

Good. Maintain the cover until you have hard evidence. Then bring him in fully if needed.

-> first_call_objectives

=== chen_skeptical_acknowledged ===
#speaker:agent_0x99

Keep him cooperative. If you find evidence of compromise, that'll convince him.

-> first_call_objectives

=== chen_revealed_acknowledged ===
#speaker:agent_0x99

~ handler_confidence += 10

Bold move. But if he's committed, use him—SCADA expertise will help identify their attack vector.

-> first_call_objectives

=== investigation_update ===
#speaker:agent_0x99

Copy that. Remember your objectives:

Identify the attack vector. Disable it. Capture operatives if possible—especially Voltage.

-> first_call_objectives

=== intel_update ===
#speaker:agent_0x99

Nothing new. Signals intelligence still shows encrypted traffic between the facility and external nodes.

Whatever they're planning, it's scheduled for 0800. You've got time, but not much.

-> first_call_objectives

=== first_call_objectives ===
#speaker:agent_0x99

Priority one: find how they're compromising the SCADA network.

Look for a way onto the OT network — the engineering workshop, the network infrastructure, anything that explains remote control.

{chen_is_ally:
    Vance can point you to the right systems.
}

+ [Roger that. Moving to investigate]
    -> first_call_end

=== first_call_end ===
#speaker:agent_0x99

Stay sharp. These aren't amateurs. If you encounter hostiles, defend yourself.

Call if you need guidance.

#exit_conversation
-> support_hub

// ===========================================
// EVENT: SERVER ROOM ENTERED
// Triggered: Player enters the engineering workshop
// ===========================================

=== event_server_room_entered ===
#speaker:agent_0x99

~ server_room_reached = true
~ server_room_advice_given = true
~ handler_confidence += 10

{player_name()}, good work reaching the engineering workshop.

That's their access point—the BMS jump server and the SCADA network infrastructure run through there.

+ [There's a network investigation terminal here. SCADA backup server.]
    -> vm_guidance

+ [What specifically should I investigate?]
    -> investigation_guidance

=== vm_guidance ===
#speaker:agent_0x99

~ handler_confidence += 5

Perfect. Use it to scan the SCADA network topology.

Identify compromised systems, enumerate services, find their attack mechanism.

Submit flags at the drop-site terminal when you find intelligence.

+ [Understood. Beginning network analysis]
    -> server_room_event_end

=== investigation_guidance ===
#speaker:agent_0x99

Look for network access points, compromised services, remote control mechanisms.

They had three operatives here for hours—they installed something.

Find it, analyse it, and we'll know how to disable their attack.

+ [On it]
    -> server_room_event_end

=== server_room_event_end ===
#speaker:agent_0x99

{operatives_defeated >= 1:
    And {player_name()}—you've already encountered hostiles. Stay alert. There may be more.
- else:
    Watch your back. Those operatives are armed and won't hesitate.
}

Call when you've got intel.

#exit_conversation
-> support_hub

// ===========================================
// EVENT: ATTACK MECHANISM IDENTIFIED
// Triggered: Player submits final VM flag (distcc exploit)
// ===========================================

=== event_attack_mechanism_identified ===
#speaker:agent_0x99

~ attack_mechanism_known = true
~ handler_confidence += 20

{player_name()}, I'm seeing your flag submissions. Outstanding work.

You've identified their whole approach. They own the SCADA layer and they're holding a remote trigger on top of it.

+ [The software side is theirs. Anything I do from a terminal, they can undo.]
    -> three_vector_confirmation

+ [Where's the remote trigger mechanism?]
    -> trigger_location_discussion

=== three_vector_confirmation ===
#speaker:agent_0x99

~ handler_confidence += 10

Correct. Physical devices on the rack banks, malicious SCADA script, and their command laptop.

Which is why the answer isn't software. There's a hardwired Emergency Shutdown pushbutton in the plant room -- physical contacts, no network path. It's the one thing they couldn't reach from SCADA. Press it and the attack is dead.

-> voltage_priority_update

=== trigger_location_discussion ===
#speaker:agent_0x99

Based on your intel, the remote trigger is with Voltage—plant room command centre.

That's where you'll find him. And that's where this ends.

-> voltage_priority_update

=== voltage_priority_update ===
#speaker:agent_0x99

~ voltage_priority_discussed = true

Listen carefully. Voltage is high-value intelligence.

He knows about The Architect, multi-cell coordination, future operations.

* [Should I prioritise capturing Voltage even if it's riskier?]
    -> capture_vs_speed_guidance

* [Understood. I'll attempt to capture him.]
    ~ handler_confidence += 10
    -> capture_attempt_acknowledged

* [Attack prevention is priority one. Capture is secondary.]
    -> attack_priority_acknowledged

=== capture_vs_speed_guidance ===
#speaker:agent_0x99

Your call on the ground. Here's the analysis:

Going for him is high intel value and a riskier engagement — he's holding the trigger, and cornered he will use it.

Going for the shutdown is the safe play. The grid holds, but he walks out of that dock and we lose him.

I trust your judgement. Choose based on the tactical situation.

+ [I'll make the call when I confront him. Tactical situation dependent.]
    ~ handler_confidence += 15
    -> judgment_trusted

=== capture_attempt_acknowledged ===
#speaker:agent_0x99

Good. But {player_name()}—if he threatens to trigger the attack, stop him by any means.

Lives first. Intelligence second.

-> final_phase_briefing

=== attack_priority_acknowledged ===
#speaker:agent_0x99

~ handler_confidence += 5

Solid priorities. Stop the attack. If Voltage escapes but the attack fails, that's still a win.

-> final_phase_briefing

=== judgment_trusted ===
#speaker:agent_0x99

That's the right approach. Adapt to what you find.

-> final_phase_briefing

=== final_phase_briefing ===
#speaker:agent_0x99

Final phase objectives:

One—neutralise Voltage and any remaining operatives in the plant room.

Two—secure or destroy the remote trigger laptop.

Three—get to the hardwired ESD pushbutton in the plant room and press it.

{operatives_defeated >= 2:
    You've already taken down {operatives_defeated} operatives. You're doing this.
}
{operatives_defeated == 1:
    You've neutralised one operative. Expect resistance from the others.
}
{operatives_defeated == 0:
    Their people are still on their feet. Be ready for combat.
}

* [Ready. Moving to the plant room now.]
    ~ handler_confidence += 10
    -> final_encouragement

=== final_encouragement ===
#speaker:agent_0x99

{handler_confidence >= 80:
    You've got this, {player_name()}. Textbook operation so far. Finish it.
}
{handler_confidence >= 60 and handler_confidence < 80:
    Good work so far. Stay sharp for the final push.
}
{handler_confidence < 60:
    Be careful. This is the most dangerous phase.
}

240,000 people are counting on you. Bring it home.

#exit_conversation
-> support_hub

// ===========================================
// OPTIONAL: PLAYER-INITIATED CALL (GUIDANCE REQUEST)
// Player can call for hints/support
// ===========================================

=== player_guidance_request ===
#speaker:agent_0x99

~ handler_contacted += 1

{player_name()}, go ahead. What do you need?

// These are STICKY (+). As once-only (*) choices they were consumed after
// three visits, and `guidance_call_end` routes back here ("One more thing...")
// -- so a fourth visit found an empty choice list and ran out of content.
// A guidance hub must always have something to offer.
+ [What's my next priority?]
    -> priority_guidance

+ [Intel update?]
    -> intel_status_update

+ [I'm stuck. Suggestions?]
    -> tactical_suggestions

+ [Nothing. Just checking in.]
    -> guidance_call_end

=== priority_guidance ===
#speaker:agent_0x99

{not server_room_reached:
    Get to the engineering workshop, off Battery Hall 1. That's where they got onto the SCADA network.

    {chen_is_ally:
        Vance can point you to it from the ops desk.
    }
}
{server_room_reached and not attack_mechanism_known:
    Use the VM terminal in the workshop. Investigate the SCADA network.

    Identify their attack mechanism. Submit flags when you find intel.
}
{server_room_reached and attack_mechanism_known:
    You know the attack mechanism. Now disable it.

    Confront Voltage in the plant room. Secure the remote trigger. Disable all attack vectors.
}

+ [Understood]
    -> guidance_call_end

=== intel_status_update ===
#speaker:agent_0x99

{attack_mechanism_known:
    You've got their whole mechanism on record now. That's the case made.
- else:
    {server_room_reached:
        You're on the OT network. Keep pulling flags and get them into the drop-site terminal.
    - else:
        Nothing submitted yet. The intel is on the BMS jump server in the workshop — scan it, and submit what you find at the drop-site.
    }
}

{operatives_defeated >= 2:
    Both hall operatives neutralised. Static and Voltage will be waiting in the plant room.
}
{operatives_defeated == 1:
    One operative neutralised. Stay alert for the others.
}
{operatives_defeated == 0:
    No confirmed hostile encounters yet. They're here—be ready.
}

+ [Thanks]
    -> guidance_call_end

=== tactical_suggestions ===
#speaker:agent_0x99

What's the situation?

// Sticky + a fallback: this knot is re-enterable from the guidance hub, and as
// once-only choices it emptied on the fourth visit.
+ [I can't find where to go next.]
    -> navigation_help

+ [Having trouble with a combat encounter.]
    -> combat_help

+ [The VM network challenge is confusing.]
    -> vm_challenge_help

+ [Actually, I'm fine.]
    -> guidance_call_end

=== navigation_help ===
#speaker:agent_0x99

{not server_room_reached:
    Workshop access: through the battery hall. You'll need Level 2 keycard.

    {operatives_defeated >= 1:
        Check the operative you defeated—they may have had a keycard.
    }
    {operatives_defeated == 0:
        Vance's card only reaches Level 1. The workshop is Level 2 — that card is on the operative holding Battery Hall 1. You'll have to go through him.
    }
}
{server_room_reached:
    Plant room: final location. Requires master keycard.

    {operatives_defeated >= 2:
        Check the operative in inverter room—Relay has the master keycard.
    }
    {operatives_defeated < 2:
        Defeat the operative patrolling inverter room. They have the master keycard.
    }
}

+ [That helps, thanks]
    -> guidance_call_end

=== combat_help ===
#speaker:agent_0x99

Use cover. These operatives have training, but so do you.

Stealth takedowns when possible. Direct engagement if necessary.

{chen_is_ally:
    Vance might have intel on operative locations if you ask.
}

+ [Understood]
    -> guidance_call_end

=== vm_challenge_help ===
#speaker:agent_0x99

Start with network scanning—Nmap. Map the SCADA topology.

Then enumerate services—FTP and HTTP will have intelligence files.

Finally, exploit vulnerable services to access attack control mechanisms.

{chen_is_ally:
    Vance can provide SCADA context if you need technical clarification.
}

+ [Got it, thanks]
    -> guidance_call_end

=== guidance_call_end ===
#speaker:agent_0x99

~ handler_confidence += 3

Anything else?

// Sticky: this knot is re-entered every time the player loops the guidance
// hub, so once-only choices leave it empty on the second pass.
+ [No, I'm good. Thanks.]
    -> call_final_end

+ [One more thing...]
    -> player_guidance_request

=== call_final_end ===
#speaker:agent_0x99

Stay safe out there. Call if you need me.

#exit_conversation
-> support_hub
