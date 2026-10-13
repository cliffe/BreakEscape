// ===========================================
// AGENT HaX - PHONE SUPPORT (HANDLER)
// Mission 4: Critical Failure
// Break Escape - Strategic Guidance Throughout Mission
// ===========================================

// Variables for tracking conversation state
VAR handler_confidence = 50            // 0-100 handler's confidence in mission success
VAR server_room_reached = false
VAR attack_mechanism_known = false
VAR voltage_priority_discussed = false
// Pass 5 A5: synced (declared in globalVariables), so the workshop advice
// retires across a reload.
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

// Pass 5 A5: synced progress globals the hub's gated hints read (all declared
// in scenario.json.erb globalVariables). Read only, except mission_complete,
// which extract_go sets with #set_global (A4 call-in).
VAR guard_admitted = false
VAR security_guard_ko = false
VAR vance_met = false
VAR vance_provided_keycard = false
VAR robert_vance_ko = false
VAR plant_reader_seen = false
VAR plant_room_entered = false
VAR operative_static_defeated = false
VAR voltage_fight_started = false
VAR voltage_neutralised = false
VAR esd_authorized = false
VAR crew_warned = false
VAR racks_vented = false
VAR attack_prevented = false
VAR mission_complete = false           // Synced scenario global: set by extract_go (A4 call-in); opens the debrief
VAR lore_architect_directive_found = false
VAR lore_safehouse_address_found = false

// Local: greet on the first open only (m03 D2-14); one gated hint per stuck
// point, retired once given (m03 pass 5 P1-12).
VAR greeted = false
VAR hint_guard_given = false
VAR hint_clone_given = false
VAR hint_dial_given = false
VAR hint_relay_given = false
VAR hint_reader_given = false
VAR hint_voltage_given = false
VAR hint_race_given = false
VAR hint_crew_given = false
VAR operative_down_given = false

// External variables (set by game)
EXTERNAL player_name()

// Root divert (m03 pattern). When a conversation has ended, the engine restores
// only its variables on the next talk and continues from the root; without this
// line the root is empty.
-> start

// ===========================================
// ENTRY
// ===========================================

=== start ===
// greeted is ink-local, so a page reload forgets it. The status check only fits
// the early game, so after a late reload (dial read, or the workshop reached)
// the phone opens straight on the hub.
{not greeted:
    ~ greeted = true
    {not anomaly_detected and not server_room_reached and not attack_prevented:
        -> first_call
    }
}
-> support_hub

// ===========================================
// SUPPORT HUB
//
// Pass 5 A5: rebuilt to m03's standard (m03_phone_agent0x99.ink `hub`). Every
// call branch returns here. Topics appear only when the player is at that beat,
// sit most urgent first, and retire through their own guards. The field guides
// are folded into one choice. The two fixed choices ("Where do I stand?" and the
// exit) sit last, so the hub is never empty and a stuck player always has the
// progress read to fall back on.
// ===========================================

=== support_hub ===
// A4: the way out once the shutdown is in. First, because it ends the mission.
+ {attack_prevented and not mission_complete} [I'm done here. Bring me in.]
    -> extract_offer

+ {voltage_fight_started and not voltage_neutralised and not racks_vented and not hint_race_given} [He's going for the laptop!]
    -> hint_race

+ {plant_room_entered and not voltage_neutralised and not voltage_fight_started and not hint_voltage_given} [Voltage. How do I play this?]
    -> hint_voltage

// Decision 1: the night crew. Pointer only; Vance sounds the alarm.
+ {anomaly_detected and not crew_warned and not racks_vented and not attack_prevented and not hint_crew_given} [Can we get the night crew out of Hall 2?]
    -> hint_crew

+ {attack_mechanism_known and not voltage_priority_discussed and not voltage_neutralised} [I've got their attack mechanism mapped.]
    -> event_attack_mechanism_identified

+ {server_room_reached and not server_room_advice_given and not all_flags_in} [I'm on the OT network. What am I looking at?]
    -> event_server_room_entered

+ {plant_reader_seen and not plant_room_entered and not hint_reader_given} [How do I get through the plant-room reader?]
    -> hint_reader

+ {plant_reader_seen and not relay_card_cloned and not operative_relay_defeated and not server_room_reached and not hint_relay_given} [Relay's got the workshop card. How do I get it?]
    -> hint_relay

+ {operatives_defeated >= 1 and not voltage_priority_discussed and not operative_down_given} [I've put one of their people down.]
    -> operative_down_advice

+ {(vance_met or robert_vance_ko) and not anomaly_detected and not hint_dial_given} [How do I prove the screens are lying?]
    -> hint_dial

+ {guard_admitted and not vance_provided_keycard and not hint_clone_given} [How do I get through the card readers?]
    -> hint_clone

+ {not guard_admitted and not security_guard_ko and not hint_guard_given} [How do I get past the gate?]
    -> hint_guard

// ---- Field guides, one choice. Exposure-gated: offered by an eventMapping
// ---- when the player meets the obstacle, handed over here on request.
+ {(rfid_guide_offered and not rfid_guide_hint_given) or (lockpicking_guide_offered and not lockpicking_guide_hint_given) or (recon_guide_offered and not recon_guide_hint_given) or (vuln_guide_offered and not vuln_guide_hint_given) or (distcc_guide_offered and not distcc_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given) or (proftpd_guide_offered and not proftpd_guide_hint_given) or (cyberchef_guide_offered and not cyberchef_guide_hint_given)} [Send me a field guide.]
    -> field_guides

// ---- Always available: the fallback that stops this hub ever running dry.
+ [Where do I stand?]
    -> report_progress

+ [Nothing right now.]
    #exit_conversation
    Line's open. Call it in when you have something.
    -> support_hub

// Choices-only: the guides on offer and not yet sent (m02/m03 field_guides).
=== field_guides ===
+ {rfid_guide_offered and not rfid_guide_hint_given} [The RFID cloning guide.]
    -> request_rfid_guide
+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [The lockpicking guide.]
    -> request_lockpicking_guide
+ {recon_guide_offered and not recon_guide_hint_given} [The network mapping guide.]
    -> request_recon_guide
+ {vuln_guide_offered and not vuln_guide_hint_given} [The attack surface guide.]
    -> request_vuln_guide
+ {proftpd_guide_offered and not proftpd_guide_hint_given} [The ProFTPD guide.]
    -> request_proftpd_guide
+ {distcc_guide_offered and not distcc_guide_hint_given} [The distcc guide.]
    -> request_distcc_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [The sudo guide.]
    -> request_privesc_guide
+ {cyberchef_guide_offered and not cyberchef_guide_hint_given} [The CyberChef decoding guide.]
    -> request_cyberchef_guide
+ [Not now.]
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
~ operative_down_given = true
{operatives_defeated >= 2:
    Two down. Both halls clear.
    {not operative_static_defeated:
        Static's still with Voltage in the plant room.
    }
- else:
    {operative_relay_defeated:
        One down. Check what she dropped: that's the workshop card.
    - else:
        One down. Check what he dropped. Relay's the one carrying a workshop card.
    }
}

And the hall doesn't care who's winning. Watch the hydrogen panel.

-> support_hub

// ===========================================
// PASS 5 A5: GATED HINTS
// One per stuck point, offered in the hub only when the player is at that point,
// and retired once given (m03 hint_* pattern). Text knot, then back to the hub.
// ===========================================

=== hint_guard ===
#speaker:agent_0x99
~ hint_guard_given = true
Show him the regulator badge. You're a routine audit that came early. He'll grumble and sign you in.
Don't try to walk past him. He's the one person on that site doing his job properly.
-> support_hub

=== hint_clone ===
#speaker:agent_0x99
~ hint_clone_given = true
Vance's door card is old prox. Stand close while he talks and the cloner reads it off his lanyard.
If that goes wrong, there's a spare Level 1 in the security office locker. It's a pin tumbler.
-> support_hub

=== hint_dial ===
#speaker:agent_0x99
~ hint_dial_given = true
Every screen in that building reads the same poisoned feed. You need an instrument that isn't on it.
Battery Hall 1. There's an old dial thermometer on the Rack Bank C wall. Read it.
-> support_hub

=== hint_relay ===
#speaker:agent_0x99
~ hint_relay_given = true
Two ways. Keep her talking and step in close. Her card's old prox, like Vance's, and the cloner will copy it.
Or put her down. She won't chase far, so if she turns on you, back off and cross when she's at the far end.
-> support_hub

=== hint_reader ===
#speaker:agent_0x99
~ hint_reader_given = true
{fingerprint_kit_found:
    You've got the crew's kit. Now you need Vance's print, off something he touches every round.
    The duty panel in Hall 1. He logs every round on it.
- else:
    Picks and cloner won't touch a fingerprint reader. The crew beat it on the ninth with their own kit.
    Their tool case is under the workshop bench. Open it.
}
-> support_hub

=== hint_voltage ===
#speaker:agent_0x99
~ hint_voltage_given = true
He's costed tonight to the decimal. Don't expect to talk him round.
Go for him and it's a race to his laptop. Drop him fast.
{operative_static_defeated:
    Static's down, so he's got nobody. You can arrest him.
- else:
    With Static still up, you won't take him quietly. Put Static down and the arrest is yours.
}
{attack_mechanism_known and anomaly_detected:
    Or go for the button and let him run. Grid control will take the shed now.
- else:
    The button won't arm yet, so letting him run buys you nothing. Grid control needs the case first.
}
-> support_hub

=== hint_race ===
#speaker:agent_0x99
~ hint_race_given = true
Then stop talking to me and drop him.
If he gets there it's Bank B, not the whole hall. The button still saves A and C.
-> support_hub

=== hint_crew ===
#speaker:agent_0x99
~ hint_crew_given = true
Not from here. The site's evacuation alarm is on Vance's desk.
{
- robert_vance_ko:
    And Vance is on the floor of his own office. Nobody's sounding it now.
- not vance_is_ally:
    He'd have to trust you first. Tell him who you are.
- else:
    Ask him. He'll do it.
}
But think first. The minute that alarm goes, Voltage knows we've found him, and he won't wait for eight.
-> support_hub

// ===========================================
// PASS 5 A4: THE CALL-IN (m03 extract_offer / extract_go)
// After the shutdown the player sweeps the site and calls in here. Text first,
// choices in a text-free knot (phone reopen rule, E13). Leaving sets
// mission_complete, which opens the debrief (agent_0x99_debrief mapping); the
// call-in task completes in the same batch.
// ===========================================

=== extract_offer ===
#speaker:agent_0x99
Once you're out, you don't go back in. Whatever you haven't read stays for forensics.
{not lore_architect_directive_found:
    Voltage's operation log is still on the plant-room bench, for one.
}
{not lore_safehouse_address_found:
    And there's a go-bag at the dock nobody's opened.
}
-> extract_choices

=== extract_choices ===
+ [Bring me in.]
    Car's at the loading dock. Two minutes.
    -> extract_confirm
+ [Not yet. I'm still looking.]
    Take your time. The banks aren't going anywhere.
    -> support_hub

=== extract_confirm ===
+ [On my way.]
    -> extract_go

=== extract_go ===
#speaker:agent_0x99
#complete_task:call_in_after_sweep
#set_global:mission_complete:true
~ mission_complete = true
See you at HQ.
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
// Reached from start on the first open (greeted).
// ===========================================

=== first_call ===
#speaker:agent_0x99

Agent, status check. Are you inside the facility?
-> first_call_choices

=== first_call_choices ===

* [I'm inside. Met Robert Vance, the facility manager.]
    -> vance_status_inquiry

* [Inside the facility. Beginning investigation now.]
    -> investigation_update

* [I'm in. Anything new from your end?]
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
// Offered in the hub once the player is in the engineering workshop
// ===========================================

=== event_server_room_entered ===
#speaker:agent_0x99

~ server_room_advice_given = true
~ handler_confidence += 10

You're in the workshop. That's their way in.

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
    And you've already met one of them. There'll be more.
- else:
    Watch your back. They won't hesitate.
}

Call when you've got something.

#exit_conversation
-> support_hub

// ===========================================
// EVENT: ATTACK MECHANISM IDENTIFIED
// Offered in the hub once map_the_attack is complete
// ===========================================

=== event_attack_mechanism_identified ===
#speaker:agent_0x99

~ handler_confidence += 20

Your flags are landing. Grid control can see it too.

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

Listen. Voltage is worth more to us talking than down.

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
    Two of them down already. You're almost there.
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
    Clean run so far. Finish it.
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
// WHERE DO I STAND? (Pass 5 A5)
// The always-on fallback: reads the night as it is and names the next step.
// Replaces the old guidance sub-hub (player_guidance_request and its six knots),
// whose content the gated hints above now carry. First unmet step wins.
// ===========================================

=== report_progress ===
#speaker:agent_0x99
{
- attack_prevented:
    It's done. The banks are isolated and cooling.
    Sweep what you want, then tell me to bring you in.
- not guard_admitted and not security_guard_ko:
    You're not in yet. Regulator badge at the gate. A routine audit that came early.
- not vance_met and not robert_vance_ko:
    Find Robert Vance, in the operations office. Nobody knows that plant better.
- not vance_provided_keycard:
    You need Vance's door card. It's old prox: the cloner copies it while he talks. There's a spare in the security office locker.
- not anomaly_detected and not server_room_reached:
    Prove the screens are lying. The dial on the Rack Bank C wall in Hall 1 isn't on their network.
- not server_room_reached:
    The engineering workshop, off Hall 1. It wants a Level 2 card.
    {relay_card_cloned or operative_relay_defeated:
        You've got Relay's. Use it on the workshop door.
    - else:
        Relay carries one. She walks Hall 2, and Hall 2 opens on Vance's card.
    }
- not attack_mechanism_known:
    {
    - all_flags_in and not (evidence_maintenance_logs_found or evidence_access_logs_found or evidence_camera_tampering_found or evidence_reader_spoof_found):
        Your flags are in. Grid control still wants the break-in on paper.
        Vance's work orders in the operations office, the access log in the workshop, or the camera log in the security office.
    - all_flags_in and not anomaly_detected:
        Your flags are in. Grid control still wants a real reading off the racks.
        The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network.
    - else:
        Work the terminal in the workshop. Find how they're driving the attack, and drop the flags as you go.
        {not anomaly_detected:
            And read the dial on the Rack Bank C wall in Hall 1. Grid control will want it.
        }
    }
- not plant_room_entered:
    You know how they did it. The plant room's off Hall 2, and its reader wants Vance's print.
    {not fingerprint_kit_found:
        The crew's own kit is in their tool case in the workshop.
    }
- not voltage_neutralised:
    Voltage is in the plant room with the trigger. Deal with him, then the shutdown button.
- not esd_authorized:
    Grid control's nearly there. Stay by the button.
- else:
    The ESD is live. Press it.
}
-> report_progress_choices

=== report_progress_choices ===
+ [Right.]
    -> support_hub
