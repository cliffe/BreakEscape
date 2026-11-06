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
VAR erlang_guide_offered = false
VAR erlang_guide_hint_given = false
VAR cyberchef_guide_offered = false
VAR cyberchef_guide_hint_given = false
VAR privesc_guide_offered = false
VAR privesc_guide_hint_given = false
VAR proftpd_guide_offered = false
VAR proftpd_guide_hint_given = false
VAR relay_card_cloned = false        // PASS 4: Relay's card copied on the quiet route
VAR operative_relay_defeated = false
VAR fingerprint_kit_found = false
// PLAYTEST ROUND: all four flags in (set by the flag mappings), so the hint can
// name what still holds the ESD when the flags are done. (The evidence globals
// were dropped in pass 5 puzzle chains R2-1: nothing here reads them now.)
VAR all_flags_in = false
VAR anomaly_detected = false

// Game state variables
VAR vance_is_ally = false
VAR operatives_defeated = 0
// Phase 4 dialogue C1 (D5-27): urgency_stage removed (never read here).

// Pass 5 A5: synced progress globals the hub's gated hints read (all declared
// in scenario.json.erb globalVariables). Read only, except mission_complete,
// which extract_go sets with #set_global (A4 call-in).
VAR guard_admitted = false
VAR security_guard_ko = false
VAR vance_met = false
VAR vance_provided_keycard = false
// Puzzle chains R3-1/R3-2: the hub asks whether a step is done, not how.
// level1_card_held: the security-locker spare taken. checkpoint_passed: the
// player reached the operations office, however they got past the gate.
VAR level1_card_held = false
VAR checkpoint_passed = false
// Puzzle chains R4-3: the print is already lifted (set on every lift). Read only.
VAR vance_print_lifted = false
// Scenario design m2: the 61°C call now arrives as a text the player clicks;
// the hub re-offers it if the text was missed (m03 P3-19). Local.
VAR anomaly_call_heard = false
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
// Phase 8 final check (F1): a hostile operative still on their feet can hit the
// player during the debrief person-chat, and the engine closes it (no debrief, no
// disclosure). The call-in waits until none is. Synced globals, read only:
// cipher_engaged / static_engaged / guard_hostile / voltage_fight_started and the new
// relay_engaged are set by each NPC's npc_hostile_state_changed mapping; the KO
// globals by globalVarOnKO.
VAR cipher_engaged = false
VAR relay_engaged = false
VAR static_engaged = false
VAR guard_hostile = false
VAR operative_cipher_defeated = false

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
// greeted is ink-local; the engine saves ink variables (npcInkVariables), so it
// survives a page reload (confirmed in the browser, m06 game 2304). The late-game
// fallback below stays as a guard: the status check only fits the early game.
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

+ {anomaly_detected and not anomaly_call_heard and not attack_prevented} [You wanted to talk about the dial reading.]
    -> on_anomaly_confirmed

+ {voltage_fight_started and not voltage_neutralised and not racks_vented and not hint_race_given} [He's going for the laptop!]
    -> hint_race

+ {plant_room_entered and not voltage_neutralised and not voltage_fight_started and not hint_voltage_given} [Voltage. How do I play this?]
    -> hint_voltage

// Decision 1: the night crew. Pointer only; Vance sounds the alarm.
// Struggling run A (F4): also once the clock is running without the dial.
+ {(anomaly_detected or attack_mechanism_known) and not crew_warned and not racks_vented and not attack_prevented and not hint_crew_given} [Can we get the night crew out of Hall 2?]
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

+ {(vance_met or robert_vance_ko or checkpoint_passed) and not anomaly_detected and not hint_dial_given} [How do I prove the screens are lying?]
    -> hint_dial

+ {(guard_admitted or security_guard_ko or checkpoint_passed) and not vance_provided_keycard and not level1_card_held and not plant_reader_seen and not hint_clone_given} [How do I get through the card readers?]
    -> hint_clone

+ {not guard_admitted and not security_guard_ko and not checkpoint_passed and not hint_guard_given} [How do I get past the gate?]
    -> hint_guard

// ---- Field guides, one choice. Exposure-gated: offered by an eventMapping
// ---- when the player meets the obstacle, handed over here on request.
+ {(rfid_guide_offered and not rfid_guide_hint_given) or (lockpicking_guide_offered and not lockpicking_guide_hint_given) or (recon_guide_offered and not recon_guide_hint_given) or (vuln_guide_offered and not vuln_guide_hint_given) or (erlang_guide_offered and not erlang_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given) or (proftpd_guide_offered and not proftpd_guide_hint_given) or (cyberchef_guide_offered and not cyberchef_guide_hint_given)} [Send me a field guide.]
    // Struggling run A (F8): a visible reply before the list.
    Which one?
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
+ {erlang_guide_offered and not erlang_guide_hint_given} [The Erlang SSH RCE guide.]
    -> request_erlang_guide
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

=== request_erlang_guide ===
~ erlang_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_erlang_ssh
Sent. Erlang/OTP SSH daemon on a high port — a brand-new pre-auth RCE that runs commands before it even asks who you are. Your way in.
-> support_hub

=== request_privesc_guide ===
~ privesc_guide_hint_given = true
#give_item:lab-workstation:safetynet_field_guide_privesc
Sent. On the box, check what sudo lets you run. That's how the crew got at the charge settings.
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
        One down. Check what he dropped.
        // Puzzle chains R4-2: not once the workshop card is held.
        {not relay_card_cloned and not server_room_reached:
            Relay's the one carrying a workshop card.
        }
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
// Puzzle chains R4-3: don't send a player who holds the print back for it.
{
- vance_print_lifted:
    You've got his print. Put it on the reader in Hall 2. That's all it checks for.
- fingerprint_kit_found:
    You've got the crew's kit. Now you need Vance's print, off something he touches every round.
    The duty panel in Hall 1. He logs every round on it.
- else:
    That reader wants a finger, not a card. The crew beat it on the ninth with their own kit.
    Their tool case is under the workshop bench. Open it.
}
-> support_hub

=== hint_voltage ===
#speaker:agent_0x99
~ hint_voltage_given = true
He's costed tonight to the decimal. Don't expect to talk him round.
Go for him and it's a race to his laptop. Drop him fast.
{operative_static_defeated:
    Static's down, so he's got nobody. You can take him and hand him to the police.
- else:
    With Static still up, you won't take him quietly. Put Static down and he's yours to hand over.
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
// Round 2 (review m3, orchestrator decision 1): true to when it's asked.
{
- robert_vance_ko:
    // nobody can sound it; no cost to weigh
- voltage_neutralised:
    // Round 4 (review M2): nobody left to fire early.
    Voltage is down, so nobody's listening. The alarm costs you nothing.
- attack_mechanism_known:
    The clock's already running, so the alarm can't cost you any time now.
- else:
    But think first. The minute that alarm goes, Voltage knows we've found him. You'd have about half an hour, not till eight.
}
-> support_hub

// ===========================================
// PASS 5 A4: THE CALL-IN (m03 extract_offer / extract_go)
// After the shutdown the player sweeps the site and calls in here. Text first,
// choices in a text-free knot (phone reopen rule, E13). Leaving sets
// mission_complete, which opens the debrief (agent_0x99_debrief mapping); the
// call-in task completes in the same batch.
// ===========================================

=== extract_offer ===
{hostile_standing(): -> extract_blocked}
-> extract_offer_text

// Phase 8 final check (F1).
=== function hostile_standing() ===
~ return (relay_engaged and not operative_relay_defeated) or (cipher_engaged and not operative_cipher_defeated) or (static_engaged and not operative_static_defeated) or (guard_hostile and not security_guard_ko) or (voltage_fight_started and not voltage_neutralised)

=== extract_blocked ===
#speaker:agent_0x99
{
- relay_engaged and not operative_relay_defeated:
    Not with Relay still on you. Lose her or put her down, then call.
- cipher_engaged and not operative_cipher_defeated:
    Not with Cipher still on you. Lose him or put him down, then call.
- static_engaged and not operative_static_defeated:
    Not with Static still on you. Lose him or put him down, then call.
- guard_hostile and not security_guard_ko:
    Not with the gate guard still after you. Lose him or put him down, then call.
- else:
    Not with Voltage still on his feet. Put him down, then call.
}
-> extract_blocked_choices

// Choices-only (phone reopen rule). "Well clear" is the lose-them route: the
// danger is being hit while the debrief plays, so a player who has got away (or
// can't win the fight) still has a way to finish.
=== extract_blocked_choices ===
+ [I'm well clear of them. Bring me in.]
    -> extract_offer_text
+ [Understood.]
    -> support_hub

=== extract_offer_text ===
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
// Blind run A (m4): this event call used to end on a lone "On it." menu. Later
// texts landed under it, so the hub (field guides included) looked gone until
// the chat was closed and reopened. Straight to the hub instead.
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
~ anomaly_call_heard = true
Nightshade's got your reading. Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens.
His words: those cells are past safe, and they won't wait for 0800, trigger or no trigger.
The screens lie because ENTROPY feed them. That dial isn't on ENTROPY's network.
-> on_anomaly_confirmed_choices

=== on_anomaly_confirmed_choices ===
+ {not server_room_reached} [Then where do I start?]
    #exit_conversation
    With how they're driving it. The workshop, off Hall 1.
    -> support_hub
// Puzzle chains R2-3: "the last piece" only when it was (the attack mapped and
// Voltage dealt with); otherwise say what's still missing.
+ {server_room_reached and attack_mechanism_known and voltage_neutralised} [Then the dial was the last piece.]
    #exit_conversation
    It was. Grid control can see the difference now.
    -> support_hub
+ {server_room_reached and not (attack_mechanism_known and voltage_neutralised)} [Then what's still missing?]
    #exit_conversation
    {attack_mechanism_known:
        Grid control has the hazard and the cause. Now Voltage.
    - else:
        Grid control has the hazard now. Get them the cause, off the workshop terminal.
    }
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
// Post-close fix (m05 pattern, m05_phone_agent_0x99.ink first_call_choices): a
// first call closed unanswered reopens here, and its once-only answers kept the
// hub (and "Bring me in") out of reach. On a reopen (second visit or later) once
// the player is past the gate, or any later step, go to the hub. A first arrival
// inside still gets the inside answers.
// Phase 8 final check (F2): this keyed on the visit count, which is already 2 on
// the first open (the phone preloads the opening, then re-navigates to this knot
// when globals have changed since: phone-chat-conversation.js reopenWithCurrentGlobals),
// so the guard always fired. It now keys on progress only, the reverse of
// start's staleness test: once the dial is read, the workshop reached or the
// attack mapped, the status check is stale and the hub takes over. An inside first
// open (gate passed, Vance met) still gets these answers; reload-safe (globals).
// Exactly start's test, so a first arrival never prints the status question and
// then skips its answers.
{anomaly_detected or server_room_reached or attack_prevented: -> support_hub}

// Puzzle chains R4-1: the first open usually comes at the gate (HaX's "Gate
// first" text), so the "inside" answers wait until the player is inside, and
// "Met Robert Vance" until they have met him.
* {(guard_admitted or security_guard_ko or checkpoint_passed) and vance_met} [I'm inside. Met Robert Vance, the facility manager.]
    -> vance_status_inquiry

* {guard_admitted or security_guard_ko or checkpoint_passed} [Inside the facility. Beginning investigation now.]
    -> investigation_update

* {guard_admitted or security_guard_ko or checkpoint_passed} [I'm in. Anything new from your end?]
    -> intel_update

* {not guard_admitted and not security_guard_ko and not checkpoint_passed} [Not yet. I'm at the gate.]
    #exit_conversation
    Then the badge. Routine audit, came early. Once you're past him: Vance, then something in Hall 1 that isn't on their feed.
    -> support_hub

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

// Scenario design m8: "I told him the truth… He's in." was removed: this knot is
// reached only when vance_is_ally is false, so it was always untrue.

=== vance_cooperation_acknowledged ===
#speaker:agent_0x99

Good. Hold the cover until you've got hard evidence. Then bring him in.

-> first_call_objectives

=== vance_skeptical_acknowledged ===
#speaker:agent_0x99

Keep him onside. Find proof of the breach and it'll convince him for you.

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

// Round 2 (review m10): dial first, as the gated hints and "Where do I stand?" say.
// Phase 4 dialogue C1 (D5-26): the dial isn't named here, so the HMI's clue has
// work to do; hint_dial and "Where do I stand?" name it for a player who asks.
First, prove the screens are lying. Something in Battery Hall 1 that isn't on their feed.

Then the engineering workshop, off the same hall. That's how they got onto the SCADA network.

{vance_is_ally:
    Vance can point you to the right systems.
}
-> first_call_objectives_choices

=== first_call_objectives_choices ===

+ [On it.]
    -> first_call_end

=== first_call_end ===
#speaker:agent_0x99

Call me when you've got a real reading.

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

+ [Where do I start on it?]
    -> vm_guidance

+ [What specifically should I investigate?]
    -> investigation_guidance

=== vm_guidance ===
#speaker:agent_0x99

~ handler_confidence += 5

Scan what's on that network first, then see what each box is running.

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
    They'll know someone's opened the workshop. Keep an eye on the door.
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

Your flags are in. Grid control can see it too.

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

// Phase 4 dialogue C1 (D5-5): not "press it" before it can arm.
{anomaly_detected:
    Press it and the attack's dead.
- else:
    It won't arm till grid control has a real reading. The dial in Hall 1 first.
}

-> voltage_priority_update

=== trigger_location_discussion ===
#speaker:agent_0x99

Your intel puts the trigger with Voltage, in the plant room.

That's where he is, and where this ends.

-> voltage_priority_update

=== voltage_priority_update ===
#speaker:agent_0x99

~ voltage_priority_discussed = true

Listen. Voltage is worth more to us in a cell than in the wind.

He knows The Architect, how the cells coordinate, what's coming next.
-> voltage_priority_update_choices

=== voltage_priority_update_choices ===

* [Do I take Voltage even if it's the riskier play?]
    -> capture_vs_speed_guidance

* [Understood. I'll try to take him alive.]
    // Phase 4 dialogue C1 (D5-32): the debrief remembers the promise.
    #set_global:promised_voltage_alive:true
    ~ handler_confidence += 10
    -> capture_attempt_acknowledged

* [The attack comes first. Voltage second.]
    -> attack_priority_acknowledged

=== capture_vs_speed_guidance ===
#speaker:agent_0x99

Your call on the ground. Both ways cost something.

Go for him and you're close to the trigger he's holding. Cornered, he'll use it.

{anomaly_detected:
    Go for the button and the grid holds, but he's out the dock and gone.
- else:
    Go for the button and he's out the dock and gone. And it won't arm till grid control has a real reading.
}

You'll see it better than I will.
-> capture_vs_speed_guidance_choices

=== capture_vs_speed_guidance_choices ===

+ [I'll decide when I'm in the room with him.]
    ~ handler_confidence += 15
    -> judgment_trusted

=== capture_attempt_acknowledged ===
#speaker:agent_0x99

Good. If he reaches for that laptop, put him down.

-> final_phase_briefing

=== attack_priority_acknowledged ===
#speaker:agent_0x99

~ handler_confidence += 5

Copy. Then the button's your job and he's a bonus.

-> final_phase_briefing

=== judgment_trusted ===
#speaker:agent_0x99

Good.

-> final_phase_briefing

=== final_phase_briefing ===
#speaker:agent_0x99

// Phase 4 dialogue C1 (D5-31, D5-5): no list; the button only once it can arm.
// C2 (D6-15): the laptop was in her line just before this.
Last stretch. Anyone still standing with him goes down first.

{anomaly_detected:
    Then the button.
- else:
    The button won't arm till grid control has a real reading. The dial in Hall 1 first.
}

// C2 (D6-21): the operative-count lines cut (filler, and the counter misses Static).
-> final_phase_briefing_choices

=== final_phase_briefing_choices ===

* [Ready. Heading for the plant room.]
    ~ handler_confidence += 10
    -> final_encouragement

=== final_encouragement ===
#speaker:agent_0x99

// C2 (D6-21, D6-18): one closer; the 240,000 line is the briefing's.
{handler_confidence >= 80:
    Clean run so far. Finish it.
- else:
    Careful. This is the worst of it.
}

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
// Puzzle chains R3-1/R3-2 and the round-3 sweep: each step asks whether it's
// done, whatever route the player took (slipped past the guard, the locker
// spare, never met Vance, Hall 2 already open).
- not guard_admitted and not security_guard_ko and not checkpoint_passed:
    You're not in yet. Regulator badge at the gate. A routine audit that came early.
- not vance_met and not robert_vance_ko and not vance_provided_keycard and not level1_card_held and not plant_reader_seen:
    Find Robert Vance, in the operations office. Nobody knows that plant better.
- not vance_provided_keycard and not level1_card_held and not plant_reader_seen:
    You need Vance's door card. It's old prox: the cloner copies it while he talks. There's a spare in the security office locker.
- not anomaly_detected and not server_room_reached:
    Prove the screens are lying. The dial on the Rack Bank C wall in Hall 1 isn't on their network.
- not server_room_reached:
    The engineering workshop, off Hall 1. It wants a Level 2 card.
    {relay_card_cloned or operative_relay_defeated:
        You've got Relay's. Use it on the workshop door.
    - else:
        Relay carries one. She walks Hall 2, and Hall 2 opens on any Level 1 card.
    }
- not attack_mechanism_known:
    // Puzzle chains R2-1: the paper-evidence branch is gone (the gate is retired;
    // map_the_attack completes on the four flags alone).
    Work the terminal in the workshop. Find how they're driving the attack, and drop the flags as you go.
    {not anomaly_detected:
        And read the dial on the Rack Bank C wall in Hall 1. Grid control will want it.
    }
// Puzzle chains R2-2: once the flags are in, the dial can still be missing, and
// it holds the ESD. Named before the plant-room steps.
- not anomaly_detected:
    Your flags are in. Grid control still wants a real reading off the racks.
    The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network.
- not plant_room_entered:
    You know how they did it. The plant room's off Hall 2, and its reader wants Vance's print.
    {
    - vance_print_lifted:
        You've got it. Use it on the reader.
    - not fingerprint_kit_found:
        The crew's own kit is in their tool case in the workshop.
    }
- not voltage_neutralised:
    Voltage is in the plant room with the trigger. Deal with him, then the shutdown button.
- not esd_authorized:
    Grid control's nearly there. Stay by the button.
- else:
    The ESD is live. Press it.
}
// Struggling run A (F8): straight back to the hub (as the hint knots do), not a
// one-option "Right." menu.
-> support_hub
