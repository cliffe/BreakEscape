> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 6: Dialogue & Ink Script Planning

**Mission ID:** m04_critical_failure
**Stage:** 6 - Dialogue and Ink Script Planning
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document provides complete dialogue planning for all NPCs in Mission 4 "Critical Failure," including Ink script structure, conversation knots, dialogue choices, branching logic, and voice acting requirements. The dialogue system integrates with objectives, character arcs, and player choices.

---

## Dialogue Design Principles

### Core Goals

1. **Character Voice Consistency:** Each NPC has distinct personality and speech patterns
2. **Player Agency:** Choices affect relationships and outcomes
3. **Narrative Integration:** Dialogue advances story and reveals character arcs
4. **Choice Consequences:** Player dialogue choices have visible impacts
5. **Natural Flow:** Conversations feel organic, not expository

### Variable Tracking

**Mission-Wide Variables:**
- `chen_trust_level` (0-100): Tracks Robert Chen's cooperation level
- `voltage_captured` (boolean): Voltage capture outcome
- `attack_trigger_secured` (boolean): Task 3.1 outcome
- `disclosure_choice` (string): "full" / "quiet" / "partial"
- `operatives_defeated` (0-3): Combat encounters completed

**Conversation-Specific Variables:**
- `revealed_mission` (boolean): Told Chen about real mission
- `chen_approached_first` (boolean): Met Chen before investigation
- `radio_obtained` (boolean): Has encrypted radio from Operative #1

---

## NPC Dialogue Files Structure

### File Organization

```
missions/m04_critical_failure/dialogue/
├── agent_0x99_briefing.ink
├── robert_chen.ink
├── voltage_confrontation.ink
├── security_guard.ink
├── operatives.ink
├── agent_0x99_debrief.ink
└── ambient_dialogue.ink
```

---

## Agent 0x99 - Opening Briefing

**File:** `agent_0x99_briefing.ink`
**When:** Mission start cutscene
**Function:** Establish mission parameters, ENTROPY threat, rules of engagement

### Knot Structure

```ink
=== briefing_start ===
# LOCATION: SAFETYNET Mobile Command Unit
# NPC: Agent 0x99
# PLAYER: Agent 0x00

At 0342 hours, our signals intelligence intercepted encrypted communications between known Critical Mass operatives and a location inside the Pacific Northwest Regional Water Treatment Facility.

+ [How many operatives?]
    -> operative_count
+ [What's the target?]
    -> target_explanation
+ [Time window?]
    -> timeline_details

=== operative_count ===
At least three, led by an individual using the callsign "Voltage." Ex-military, infrastructure specialists. #CHEN_TRUST_IMPACT: -5 (if player doesn't ask about facility manager)

Critical Mass doesn't operate like Social Fabric. They're professionals with combat training.

+ [What's their target?]
    -> target_explanation
+ [My cover identity?]
    -> cover_identity

=== target_explanation ===
The facility serves 400,000 residents. A successful attack on the chemical dosing systems could contaminate the entire municipal supply.

We've identified suspicious activity scheduled for 0800 hours—less than four hours from now.

+ [What's my cover?]
    -> cover_identity
+ [What about the facility manager?]
    -> chen_briefing

=== chen_briefing ===
~ chen_trust_level = chen_trust_level + 10
Robert Chen, the facility manager. We've briefed him on a "routine surprise inspection." He doesn't know about ENTROPY yet—use your judgment on disclosure.

+ [Understood. My cover identity?]
    -> cover_identity

=== cover_identity ===
Emergency security auditor from the state regulatory commission. Chen expects you, but he's not happy about a 4 AM audit.

Rules of engagement: these operatives are hostile. If detected, they WILL act to protect their operation. You're authorized for defensive action.

+ [Defensive only, understood.]
    -> mission_objectives_professional
+ [What if combat becomes necessary?]
    -> combat_clarification
+ [They won't see me coming.]
    -> mission_objectives_aggressive

=== combat_clarification ===
Non-lethal takedowns only. We want intel, not bodies. Capture Voltage if possible—he's high-value for intelligence on The Architect.

-> mission_objectives

=== mission_objectives_professional ===
~ player_approach = "professional"
Good. Primary objective: identify the attack vector and disable it before 0800. Secondary: capture operatives for intelligence. Tertiary: keep this quiet—public panic helps ENTROPY.

-> mission_final_warning

=== mission_objectives_aggressive ===
~ player_approach = "aggressive"
Confident. Remember: intel value is in capture, not combat efficiency. Don't be reckless.

Primary objective: identify the attack vector and disable it before 0800. Secondary: capture operatives. Tertiary: keep this quiet.

-> mission_final_warning

=== mission_objectives ===
Primary objective: identify the attack vector and disable it before 0800. Secondary: capture operatives for intelligence. Tertiary: keep this quiet—public panic helps ENTROPY.

-> mission_final_warning

=== mission_final_warning ===
One more thing—Critical Mass doesn't operate like Social Fabric. They're not ideologues running social media campaigns. They're infrastructure specialists with military training. Stay sharp.

+ [I'm ready.]
    -> briefing_end

=== briefing_end ===
~ emit_event("briefing_complete")
Good hunting, Agent.

# TRIGGER: Mission start, player spawns at facility entrance
-> END
```

**Estimated Lines:** 25-30 (Agent 0x99 voice acting)
**Branches:** 3 player response styles (professional, questioning, aggressive)
**Variables Set:** `player_approach`, `chen_trust_level`

---

## Robert Chen - Multi-Stage Conversations

**File:** `robert_chen.ink`
**NPCs:** npc_robert_chen
**Function:** Primary ally NPC, evolving relationship through mission

### Conversation 1: Initial Meeting (Task 1.2)

```ink
=== chen_initial_meeting ===
# LOCATION: Administration Office
# CONDITION: Task 1.1 complete (entered facility)
# TRIGGERS: Task 1.2 (meet_robert_chen)

# Chen looks up from desk, visibly annoyed

State audit at 4 AM? You regulatory people have interesting schedules.

+ [Just doing my job, Mr. Chen.]
    -> chen_professional_response
+ [I apologize for the inconvenience.]
    -> chen_apologetic_response
+ [There have been concerns about this facility.]
    -> chen_direct_response

=== chen_professional_response ===
~ chen_trust_level = chen_trust_level + 5
Right. Well, I run a tight ship here despite our budget constraints. Whatever boxes you need checked, let's get it done quickly—we have a facility to operate.

+ [I'll need access to employee records.]
    -> chen_access_request
+ [Tell me about recent maintenance work.]
    -> chen_maintenance_question

=== chen_apologetic_response ===
~ chen_trust_level = chen_trust_level + 10
# Chen's expression softens slightly

I appreciate that. Look, I know you're doing your job. It's just... we're understaffed, underfunded, and now I've got surprise inspections at dawn.

+ [I understand. This won't take long.]
    -> chen_cooperation_gained
+ [Has there been unusual activity recently?]
    -> chen_concerns_question

=== chen_direct_response ===
~ chen_trust_level = chen_trust_level - 5
# Chen becomes defensive

Concerns? We passed our last three inspections with flying colors. Our safety record is spotless. Who's been talking?

+ [It's routine, Mr. Chen. May I see your employee records?]
    -> chen_access_reluctant
+ [I need to be frank with you about something.]
    -> chen_early_reveal_opportunity

=== chen_access_request ===
~ chen_trust_level = chen_trust_level + 3
Employee records? Fine. But I want to know what you're looking for. We don't have anything to hide.

-> chen_provides_access

=== chen_maintenance_question ===
~ chen_trust_level = chen_trust_level + 5
Maintenance? We had OptiGrid Solutions in earlier this week for control system upgrades. Routine stuff, all contracted properly.

+ [OptiGrid Solutions? Can I see their access logs?]
    -> chen_optigrid_interest
+ [Any other contractors recently?]
    -> chen_contractors_inquiry

=== chen_optigrid_interest ===
~ chen_trust_level = chen_trust_level + 5
# Chen shows slight concern at specific interest

Sure, I can pull those. They checked out—proper credentials, background checks passed. Is there a problem?

+ [Just being thorough.]
    -> chen_provides_access
+ [Actually, there's something you should know.]
    -> chen_early_reveal_opportunity

=== chen_cooperation_gained ===
~ chen_trust_level = chen_trust_level + 15
# Chen relaxes, becomes cooperative

Alright. What do you need? Employee records, maintenance logs, facility access—I'll get you whatever you need.

-> chen_provides_access

=== chen_provides_access ===
# Chen hands over Level 1 keycard
~ emit_event("chen_provides_keycard")
~ item_obtained("facility_keycard_level1")

Here's a facility keycard—Level 1 access. That'll get you into most areas. Restricted zones need higher clearance, but for an inspection you should be fine.

+ [Thank you. I'll start with employee records.]
    -> initial_meeting_end_professional
+ [I appreciate your cooperation.]
    -> initial_meeting_end_grateful

=== initial_meeting_end_professional ===
~ emit_event("npc_conversation_complete:robert_chen:initial_meeting")
# TRIGGERS: Task 1.2 completion, unlocks Tasks 1.3 and 1.4

Let me know if you need anything. I'll be in the Control Room monitoring systems.

-> END

=== initial_meeting_end_grateful ===
~ chen_trust_level = chen_trust_level + 5
~ emit_event("npc_conversation_complete:robert_chen:initial_meeting")

Of course. And look... if you do find anything, let me know. This facility is my responsibility.

-> END

=== chen_early_reveal_opportunity ===
# Optional early mission reveal if player chooses

+ [Tell Chen the truth about ENTROPY threat now]
    -> chen_early_reveal
+ [Not yet, continue cover story]
    -> chen_maintains_cover

=== chen_early_reveal ===
~ revealed_mission = true
~ chen_trust_level = chen_trust_level + 30

# Chen's expression changes from annoyed to alarmed

Mr. Chen, I'm not actually a state auditor. I'm with SAFETYNET. We have intelligence that ENTROPY operatives have infiltrated your facility and are planning an attack on your water treatment systems.

# Chen sits down heavily

...What? ENTROPY? Here? Are you serious?

+ [Completely serious. Three operatives, targeting chemical dosing.]
    -> chen_processes_threat
+ [I need your help to stop them.]
    -> chen_asks_for_help

=== chen_processes_threat ===
~ chen_trust_level = chen_trust_level + 10

My God. The OptiGrid technicians—that was them? I... I let them in. I signed off on their access.

+ [You had no way of knowing. Now we need to act.]
    -> chen_commits_to_helping
+ [Don't blame yourself. Help me stop them.]
    -> chen_commits_to_helping

=== chen_commits_to_helping ===
~ emit_event("chen_ally_activated_early")
~ chen_trust_level = chen_trust_level + 20

Tell me what you need. Facility access, SCADA system knowledge, anything. 400,000 people drink this water. We're stopping this.

-> chen_ally_mode_activated

=== chen_ally_mode_activated ===
# Chen provides additional support earlier than normal path
~ emit_event("npc_conversation_complete:robert_chen:initial_meeting")

I'll pull up all the access logs and SCADA monitoring data. Meet me in the Control Room.

-> END
```

**Conversation 1 Estimated Lines:** 40-50 (Robert Chen)
**Branches:** Multiple paths based on player approach
**Key Variables:** `chen_trust_level`, `revealed_mission`
**Outcomes:** Affects Chen's cooperation throughout mission

### Conversation 2: SCADA Anomaly Discovery (Task 1.4)

```ink
=== chen_scada_anomalies ===
# LOCATION: Control Room
# CONDITION: Task 1.3 complete, Chen present
# TRIGGERS: Task 1.4 investigation

# Chen is at SCADA terminal, player approaches

{revealed_mission:
    I've been monitoring the systems. You were right—something's wrong. Look at these chemical dosing parameters.
- else:
    Can I help you with something? These are the SCADA monitoring systems—controls the whole facility.
}

+ [Examine the SCADA displays]
    -> scada_examination
+ [{revealed_mission} What am I looking at?]
    -> scada_technical_explanation

=== scada_examination ===
# Player examines SCADA terminal
# Visual: Yellow warnings on chemical dosing parameters

{revealed_mission:
    Those dosing rates shouldn't be changing outside of manual input from this terminal. Someone's got remote access to the system.
- else:
    # Chen notices player's concern
    You see something? Those parameters have been drifting for the past two days. My operators thought it was sensor issues.
}

+ [This isn't sensor drift. The system is compromised.]
    -> chen_realizes_threat
+ [{not revealed_mission} Mr. Chen, I need to tell you something.]
    -> chen_mission_reveal_forced

=== chen_realizes_threat ===
{revealed_mission:
    ~ chen_trust_level = chen_trust_level + 10
    The attack you mentioned—this is it, isn't it? They're setting up a contamination event.
- else:
    # Chen becomes alarmed
    Compromised? What are you talking about? Who are you really?
    -> chen_mission_reveal_forced
}

+ [Can you tell what they're trying to do?]
    -> chen_technical_analysis
+ [How do we stop this?]
    -> chen_asks_how_to_stop

=== chen_mission_reveal_forced ===
# Mission reveal becomes necessary
~ revealed_mission = true
~ chen_trust_level = chen_trust_level + 20

I'm not a state auditor. I'm with SAFETYNET. ENTROPY operatives have infiltrated your facility. They're planning to contaminate the water supply.

# Chen's face goes pale

...400,000 people. My God. How long do we have?

+ [They're scheduled to execute at 0800 hours.]
    -> chen_timeline_reaction
+ [I'm working to identify and stop the attack.]
    -> chen_wants_to_help

=== chen_timeline_reaction ===
~ chen_trust_level = chen_trust_level + 5

That's less than {0800 - current_time} hours. What do you need from me?

-> chen_commits_to_stopping_attack

=== chen_technical_analysis ===
~ chen_trust_level = chen_trust_level + 10

# Chen examines parameters closely

They're slowly increasing chlorine dosing rates while decreasing pH adjustment. If this continues to the levels they're programming... it would create toxic byproducts in the treatment process.

The contamination wouldn't be immediate—it would build up over hours. By the time anyone noticed, thousands would have consumed it.

+ [Can you override their control?]
    -> chen_override_risks
+ [I need to find how they're accessing the system.]
    -> chen_suggests_server_room

=== chen_override_risks ===
~ chen_trust_level = chen_trust_level + 5

I could try, but if they've corrupted the automation system, a crude override might trigger fail-safes—or worse, trigger the attack early. We need to find their control mechanism and disable it properly.

-> chen_suggests_server_room

=== chen_suggests_server_room ===
~ chen_trust_level = chen_trust_level + 10

The server room. If they're accessing SCADA remotely, it's through our network infrastructure. I can give you access—Level 2 keycard.

{operatives_defeated >= 1:
    Actually, you probably already have Level 2 access from... whoever you encountered.
- else:
    # Chen provides Level 2 keycard
    ~ item_obtained("facility_keycard_level2")
    Here. Server room is through the treatment floor. Be careful—if those operatives are still here...
}

+ [I'll handle it.]
    -> scada_conversation_end_determined
+ [Thank you, Mr. Chen. Stay here and monitor.]
    -> scada_conversation_end_grateful

=== scada_conversation_end_determined ===
~ chen_trust_level = chen_trust_level + 5
~ emit_event("npc_conversation_complete:robert_chen:scada_anomalies")
~ emit_event("custom_objective_complete:identify_scada_anomalies")
~ urgency_stage = 2

I'll keep monitoring from here. Call me if you need technical support—I know every system in this facility.

# TRIGGERS: Objective 1 completion, Objective 2 unlocked

-> END

=== scada_conversation_end_grateful ===
~ chen_trust_level = chen_trust_level + 10
~ emit_event("npc_conversation_complete:robert_chen:scada_anomalies")
~ emit_event("custom_objective_complete:identify_scada_anomalies")
~ urgency_stage = 2

Be careful out there. And... thank you. For taking this seriously.

-> END
```

**Conversation 2 Estimated Lines:** 30-40 (Robert Chen)
**Branches:** Varies based on early reveal vs. forced reveal
**Key Moments:** Mission reveal (if not done earlier), technical explanation
**Outcomes:** Objective 1 completion, urgency escalation

### Conversation 3: Mid-Mission Support (Radio/Phone)

```ink
=== chen_support_calls ===
# LOCATION: Various (player can call Chen)
# CONDITION: After Objective 1 complete
# FUNCTION: Provide hints and updates

=== chen_call_scada_update ===
# Triggered periodically or by player request

{urgency_stage == 2:
    The parameters are still changing. Whatever they set up, it's progressing. Have you found their control system?
- urgency_stage == 3:
    # Chen's voice more urgent
    The dosing rates are approaching critical levels. We're running out of time. Did you find the attack mechanism?
- urgency_stage == 4:
    # Chen extremely urgent
    The automated systems just executed! Chemical dosing just spiked! You need to stop this NOW!
}

-> END

=== chen_call_technical_help ===
# Player asks for SCADA help

What do you need?

+ [How do the chemical dosing systems work?]
    -> chen_explains_dosing
+ [What would happen if I manually shut down?]
    -> chen_warns_against_shutdown
+ [Just checking in.]
    -> chen_encouragement

=== chen_explains_dosing ===
Three dosing stations—chlorine, fluoride, pH adjustment. They're automated via SCADA but have physical controls. If ENTROPY installed bypass devices, you'd need to disable both the digital control AND the physical hardware.

Careful sequence is critical—wrong order could trigger fail-safes.

-> END

=== chen_warns_against_shutdown ===
Don't. Emergency shutdown could trigger exactly what they want. We need to disable their attack vectors methodically—digital control, physical bypasses, and their remote trigger.

-> END

=== chen_encouragement ===
~ chen_trust_level = chen_trust_level + 5

You're doing great. Just... hurry. Every minute those parameters drift closer to catastrophic contamination.

-> END
```

**Support Call Estimated Lines:** 15-20 (Robert Chen)
**Function:** Hints, encouragement, urgency updates
**Adaptive:** Changes based on urgency stage

### Conversation 4: Final Resolution (Task 3.3)

```ink
=== chen_resolution_conversation ===
# LOCATION: Control Room
# CONDITION: Task 3.2 complete (attack disabled)
# TRIGGERS: Task 3.3 (report mission outcome)

# Chen at terminal, watching parameters stabilize

All systems back to normal. Chemical parameters are safe. You... you just saved 400,000 people.

{voltage_captured:
    And you captured their leader? SAFETYNET will get intelligence from him?
- else:
    Their leader escaped?
}

+ [{voltage_captured} He's in custody. He'll provide valuable intel.]
    -> chen_grateful_capture_success
+ [{not voltage_captured} He got away, but the attack is stopped.]
    -> chen_grateful_partial_success
+ [It was close. Too close.]
    -> chen_reflects_on_vulnerability

=== chen_grateful_capture_success ===
~ chen_trust_level = chen_trust_level + 15

Good. Those people—ENTROPY—they've been planning this for days. They walked right in, and I didn't see it.

-> chen_asks_about_future

=== chen_grateful_partial_success ===
~ chen_trust_level = chen_trust_level + 10

At least the facility is safe. That's what matters most.

-> chen_asks_about_future

=== chen_reflects_on_vulnerability ===
~ chen_trust_level = chen_trust_level + 10

I've been running this facility for five years. Twenty years in the industry. I thought I knew what I was doing. But we were completely vulnerable.

Budget cuts, outdated cybersecurity, minimal physical security... I've been fighting for funding, but this... this could have killed thousands.

+ [You did everything you could with what you had.]
    -> chen_absolution_offered
+ [This isn't your fault. ENTROPY are professionals.]
    -> chen_professional_acknowledgment
+ [Now you know. Now you can fix it.]
    -> chen_forward_looking

=== chen_absolution_offered ===
~ chen_trust_level = chen_trust_level + 15

Maybe. But it's not enough, is it? "Everything I could" almost resulted in mass poisoning.

-> chen_asks_about_future

=== chen_professional_acknowledgment ===
~ chen_trust_level = chen_trust_level + 10

Professionals with forged credentials and cover companies. I ran background checks. They passed. How do you defend against that?

-> chen_asks_about_future

=== chen_forward_looking ===
~ chen_trust_level = chen_trust_level + 20

You're right. No more excuses. This facility—and every other water treatment plant—needs real security. Not budget theater. Real protection.

-> chen_commits_to_change

=== chen_commits_to_change ===

This changes now. I'm going to fight for cybersecurity investment, physical security upgrades, proper training. This can't happen again.

-> chen_asks_about_public

=== chen_asks_about_future ===

What happens now? Do we... do we tell people what almost happened here?

# Agent 0x99 call incoming for disclosure choice

-> END

# [Disclosure choice handled in agent_0x99_debrief.ink]
```

**Conversation 4 Estimated Lines:** 25-30 (Robert Chen)
**Function:** Resolution, character arc completion, sets up disclosure choice
**Character Growth:** From defensive manager to security advocate

**Total Robert Chen Lines:** ~120-140 across all conversations

---

## Voltage - Confrontation Dialogue

**File:** `voltage_confrontation.ink`
**NPC:** npc_voltage
**Function:** Climactic antagonist encounter, player choice integration

### Confrontation Knot Structure

```ink
=== voltage_confrontation_start ===
# LOCATION: Maintenance Wing
# CONDITION: Task 3.1 (confront_voltage)
# NPC: Voltage + Operative #3 (Static)

# Voltage at laptop, notices player entry

You're good. Better than the usual SAFETYNET drones.

{operatives_defeated >= 2:
    You took out Cipher and Relay. Impressive.
- operatives_defeated == 1:
    You got past my people.
- else:
    Sneaky approach. I respect that.
}

But you're too late. This facility's security is a joke. We've been here for three days setting this up.

+ [The attack is over, Voltage. Stand down.]
    -> voltage_professional_approach
+ [You're not contaminating this water supply.]
    -> voltage_confrontational
+ [{attack_trigger_secured} Your trigger is disabled. It's over.]
    -> voltage_attack_already_disabled

=== voltage_professional_approach ===

Professional to the end. I can respect that.

{attack_trigger_secured:
    -> voltage_attack_disabled_standoff
- else:
    -> voltage_has_leverage
}

=== voltage_confrontational ===

Bold. But conviction doesn't stop attacks.

{attack_trigger_secured:
    -> voltage_attack_disabled_standoff
- else:
    -> voltage_threatens_trigger
}

=== voltage_attack_already_disabled ===
# Player disabled attack BEFORE confrontation (prioritize disable choice)

~ voltage_leverage = false

# Voltage checks laptop, realizes attack is neutralized

Smart. You disabled the vectors before coming for me.

-> voltage_no_leverage_combat

=== voltage_has_leverage ===
# Attack trigger NOT secured yet

~ voltage_leverage = true

# Voltage hand moves near laptop

One keystroke and I trigger it now. 400,000 people drinking contaminated water by noon. Your move, agent.

+ [Choice: Prioritize Capture - Try to capture Voltage WITH active trigger]
    -> player_choice_capture_risky
+ [Choice: Prioritize Disable - Secure laptop first]
    -> player_choice_disable_safe
+ [Attempt to talk Voltage down]
    -> voltage_negotiation_attempt

=== player_choice_capture_risky ===
# Player chooses to capture Voltage despite active trigger risk
~ player_priority = "capture"
~ combat_difficulty = "hard"

# Combat begins - Voltage + Static
# Risk: Voltage may trigger attack during combat

-> voltage_combat_with_leverage

=== player_choice_disable_safe ===
# Player focuses on securing laptop
~ player_priority = "disable"
~ attack_trigger_secured = true

# Player moves toward laptop, Voltage reacts

# Voltage toward loading dock

Static, cover me!

# Operative #3 engages player while Voltage escapes
# Combat: Operative #3 only, Voltage escapes

-> voltage_escape_route

=== voltage_negotiation_attempt ===

You want to talk? Fine.

This facility? It's one test run. The Architect has operations in six cities. Coordinated infrastructure attacks with Social Fabric ready to amplify the panic.

You think stopping this changes anything? You stopped ONE attack. How many others can you stop?

+ [We'll stop all of them. Starting with you.]
    -> voltage_negotiation_failed_combat
+ [Why infrastructure? Why target civilians?]
    -> voltage_ideology_explanation
+ [Who is The Architect?]
    -> voltage_architect_deflection

=== voltage_ideology_explanation ===

You want to understand? Fine.

Infrastructure is the foundation of the system. Power, water, transportation—without them, society collapses. ENTROPY isn't about ideology. It's about exposing how fragile everything is.

You see this facility? Budget cuts, aging systems, minimal security. One fake maintenance company and we walked right in. If we can do it, anyone can.

The Architect is forcing people to wake up to how vulnerable they are. Sometimes that requires... harsh lessons.

+ [Terrorizing thousands isn't a lesson. It's murder.]
    -> voltage_rejects_moral_argument
+ [You're rationalizing mass casualties.]
    -> voltage_rejects_moral_argument

=== voltage_rejects_moral_argument ===

Call it what you want. The system failed them, not us. We're just proving it.

Now—are you going to try to stop me, or are we done talking?

-> voltage_negotiation_failed_combat

=== voltage_architect_deflection ===

The Architect? You'll never find them. The Architect doesn't exist in your databases, your surveillance networks, your informant networks.

The Architect is an idea as much as a person. And ideas? You can't capture those.

-> voltage_negotiation_failed_combat

=== voltage_negotiation_failed_combat ===
# Negotiation ends, combat begins

Enough talking.

{attack_trigger_secured:
    -> voltage_no_leverage_combat
- else:
    -> voltage_combat_with_leverage
}

=== voltage_combat_with_leverage ===
# COMBAT: Voltage + Static, active trigger laptop
# If player defeats both before trigger activated: Voltage captured
# If Voltage triggers during combat: Emergency response path
# If Voltage escapes: Loading dock escape

# [Combat mechanics execute]

{voltage_defeated_before_trigger:
    -> voltage_captured_with_trigger
- voltage_triggered_attack:
    -> voltage_triggered_emergency
- voltage_escaped:
    -> voltage_escape_success
}

=== voltage_captured_with_trigger ===
~ voltage_captured = true
~ attack_trigger_secured = true

# Voltage restrained, attack trigger secured

You're better than I thought. The Architect will be interested in you.

+ [Tell me about The Architect's plans.]
    -> voltage_interrogation_preview
+ [You're done. The attack is stopped.]
    -> voltage_captured_defiant

=== voltage_interrogation_preview ===

I'll tell SAFETYNET what I feel like telling them. But here's something for free:

OptiGrid Solutions has contracts at 40 facilities across the country. Good luck finding which ones we've accessed.

-> voltage_captured_end

=== voltage_captured_defiant ===

This attack. One facility. You stopped your battle. We're winning the war.

-> voltage_captured_end

=== voltage_captured_end ===
~ emit_event("voltage_captured")
~ emit_event("custom_objective_complete:confront_voltage")

# SAFETYNET team arrives to take custody

-> END

=== voltage_triggered_emergency ===
# Voltage managed to trigger attack before defeat
~ attack_partially_triggered = true
~ voltage_captured = true

# Attack initiated but player can still intervene

You're too late!

# Chen radio call: "Chemical dosing just spiked!"
# Player must immediately proceed to emergency intervention

-> voltage_triggered_outcome

=== voltage_triggered_outcome ===
~ emit_event("attack_partially_triggered")
~ emit_event("voltage_captured")

# Task 3.2 becomes emergency intervention mode

-> END

=== voltage_escape_route ===
# Voltage escapes through loading dock
~ voltage_captured = false
~ attack_trigger_secured = true

# Voltage at loading dock door

This isn't over. You won your battle. We're winning the war.

# Voltage exits to rental van, drives away

-> voltage_escape_success

=== voltage_escape_success ===
~ emit_event("voltage_escaped")
~ emit_event("custom_objective_complete:confront_voltage")

# Attack still prevented, but Voltage at large

-> END

=== voltage_no_leverage_combat ===
# Attack already disabled, Voltage has no leverage
~ voltage_leverage = false

You disabled it. Smart.

But I'm not getting captured today.

# Combat: Voltage + Static
# Voltage prioritizes escape over fighting

{voltage_defeated:
    -> voltage_captured_no_leverage
- else:
    -> voltage_escape_attempt
}

=== voltage_captured_no_leverage ===
~ voltage_captured = true
~ emit_event("voltage_captured")

# Voltage restrained

Attack failed. But this was a test run anyway. The Architect expected SAFETYNET might interfere.

You stopped this. How many others can you stop?

-> voltage_captured_end

=== voltage_escape_attempt ===
~ voltage_captured = false
~ emit_event("voltage_escaped")

# Voltage escapes via loading dock

-> voltage_escape_success

=== voltage_attack_disabled_standoff ===
# Attack disabled but player confronts anyway

Smart. You know your way around SCADA systems. Military training?

This was a test run anyway. The Architect expected SAFETYNET might interfere.

-> voltage_no_leverage_combat
```

**Voltage Dialogue Estimated Lines:** 35-45
**Branches:** Multiple based on player choices and attack status
**Key Variables:** `voltage_captured`, `attack_trigger_secured`, `player_priority`
**Integration:** Task 3.1 completion, multiple outcomes

---

## Security Guard - Entry Dialogue

**File:** `security_guard.ink`
**NPC:** npc_security_guard
**Function:** Entry point social engineering

### Entry Conversation

```ink
=== security_guard_entry ===
# LOCATION: Main Entrance
# CONDITION: Task 1.1 (enter facility)
# FUNCTION: Social engineering or confrontation

# Guard at desk, looks up as player approaches

Morning. Kind of early for visitors.

+ [Present state auditor credentials]
    -> guard_credentials_check
+ [I'm here for an inspection]
    -> guard_inspection_response
+ [Bypass guard, attempt stealth entry]
    -> guard_stealth_attempt

=== guard_credentials_check ===

# Guard examines credentials

State auditor? This early? Alright, sign in here.

#Guard hands clipboard

Mr. Chen mentioned something about a surprise inspection. He's not happy about it, fair warning.

+ [I'll keep that in mind. Thank you.]
    -> guard_entry_granted
+ [It's routine. Where can I find him?]
    -> guard_directions

=== guard_directions ===

Administration offices, down that hall. Should be in his office or the Control Room at this hour.

-> guard_entry_granted

=== guard_entry_granted ===
~ emit_event("enter_room:room_entrance")
~ emit_event("custom_objective_complete:enter_facility")

Go on through. Badge scanner there will let you in.

# Interior door unlocks

-> END

=== guard_inspection_response ===

Inspection? Nobody told me about any inspection.

+ [It's a surprise inspection. Check with your supervisor.]
    -> guard_confused_allows
+ [Show credentials]
    -> guard_credentials_check

=== guard_confused_allows ===

# Guard confused but doesn't want to challenge authority

Uh... okay. Sign in anyway. Cover my bases.

-> guard_entry_granted

=== guard_stealth_attempt ===
# Player attempts to bypass guard
# DIFFICULT - guard will notice and challenge

Hey! Where do you think you're going?

+ [Run past guard]
    -> guard_alarm_raised
+ [Smooth talk out of situation]
    -> guard_smooth_talk
+ [Show credentials]
    -> guard_credentials_check

=== guard_alarm_raised ===
# Guard raises alarm - fails stealth entry

Security! We've got an intruder!

# Player must leave and try alternate entry (loading dock)

-> END

=== guard_smooth_talk ===

I'm here for a surprise security audit. Part of the audit is testing entry protocols. You passed—you challenged me appropriately.

+ [Convince guard]
    -> guard_fooled
+ [Guard doesn't buy it]
    -> guard_demands_credentials

=== guard_fooled ===
~ chen_trust_level = chen_trust_level - 5

Oh. Uh, okay. Should I still log you in?

+ [Yes, proper procedure.]
    -> guard_entry_granted

=== guard_demands_credentials ===

Right. I need to see some ID before I let you through.

-> guard_credentials_check
```

**Security Guard Estimated Lines:** 15-20
**Function:** Entry point, tutorial for social engineering
**Branches:** Social, stealth, authority

---

## Operatives - Combat Dialogue

**File:** `operatives.ink`
**NPCs:** npc_operative_cipher, npc_operative_relay, npc_operative_static
**Function:** Combat encounter dialogue, radio chatter

### Operative #1 (Cipher) - Detection/Combat

```ink
=== cipher_detection ===
# Triggered when player detected by Operative #1

What the—hey! Security, we've got a problem!

# Attempts radio call

{radio_call_interrupted:
    # Player stops radio call
    -> cipher_combat_silent
- else:
    # Radio call succeeds
    -> cipher_alerts_team
}

=== cipher_alerts_team ===

# Radio

Voltage, security's here! Real security. We're compromised!

# Other operatives go on alert

-> cipher_combat_alerted

=== cipher_combat_silent ===
# Combat without alerting team

You're not stopping this!

# Combat encounter

-> END

=== cipher_combat_alerted ===
# Combat with team alerted

# Combat encounter - other operatives will be prepared

-> END

=== cipher_defeated ===

# Cipher incapacitated, drops items

-> END
```

### Operative #2 (Relay) - Patrol/Combat

```ink
=== relay_patrol_alert ===
# Triggered if Relay detects player

Intruder in chemical storage! Relay responding!

# Radio call attempt

{radio_call_interrupted:
    -> relay_combat
- else:
    # Radio

All units, intruder in chemical storage!
    -> relay_combat_team_alerted
}

=== relay_combat ===

You're not getting to those dosing stations!

# Combat

-> END

=== relay_defeated ===

# Relay incapacitated, drops items

-> END
```

### Operative #3 (Static) - Voltage Support

```ink
=== static_voltage_support ===
# During Voltage confrontation

Voltage, we have company!

{player_priority == "capture":
    I've got your back!
    # Fights alongside Voltage
- player_priority == "disable":
    Go! I'll cover you!
    # Covers Voltage's escape
}

-> END

=== static_combat ===

You're not stopping this operation!

# Combat

-> END

=== static_defeated ===

# Static incapacitated, drops items

-> END
```

**Operatives Combined Estimated Lines:** 20-25
**Function:** Combat encounters, team coordination
**Radio Integration:** Alert system affects later encounters

---

## Agent 0x99 - Mission Debrief

**File:** `agent_0x99_debrief.ink`
**NPC:** Agent 0x99
**Function:** Mission resolution, disclosure choice, campaign revelation

### Debrief Conversation

```ink
=== debrief_start ===
# LOCATION: Control Room (phone/video call)
# CONDITION: Task 3.2 complete (attack disabled)
# TRIGGERS: Task 3.3 (report_to_0x99)

# Agent 0x99 on screen

Report, Agent.

+ [Attack prevented. Facility secure.]
    -> debrief_attack_stopped
+ [Attack stopped. Voltage {voltage_captured: captured | escaped}.]
    -> debrief_voltage_status

=== debrief_attack_stopped ===

Good work. Contamination avoided, systems secured. {chen_trust_level > 70: Chen speaks highly of your work. }

{voltage_captured:
    And you captured Voltage. Excellent.
- else:
    Voltage escaped?
}

-> debrief_intelligence_gathered

=== debrief_voltage_status ===

{voltage_captured:
    Excellent. Voltage is high-value. His interrogation will provide significant intelligence on The Architect's infrastructure initiative.
- else:
    Unfortunate. But the attack is stopped—that's the priority.
}

-> debrief_intelligence_gathered

=== debrief_intelligence_gathered ===

The intelligence you gathered confirms our worst fears. Critical Mass and Social Fabric were coordinating this attack.

{voltage_captured:
    Voltage's interrogation has begun. He's defiant, but he's confirming cross-cell operations.
- else:
    The documents you recovered show clear coordination between cells.
}

This wasn't random. Social Fabric was ready with disinformation campaigns in three cities—they planned to amplify the panic from contamination.

+ [The Architect is coordinating this.]
    -> debrief_architect_revelation
+ [How extensive is the coordination?]
    -> debrief_scale_explanation

=== debrief_architect_revelation ===

Yes. We've intercepted communications mentioning "The Architect." Someone is coordinating ENTROPY cells at a level we've never seen before.

This facility was a test run. The Architect is planning something bigger—coordinated infrastructure attacks with synchronized disinformation campaigns.

-> debrief_task_force_announcement

=== debrief_scale_explanation ===

{voltage_captured:
    Voltage mentioned operations in six cities. OptiGrid Solutions—their cover company—has contracts at 40 facilities nationwide. We're running full audits now.
- else:
    The documents reference operations in multiple cities. OptiGrid Solutions contracts appear at dozens of critical infrastructure sites.
}

This is coordinated at an unprecedented level.

-> debrief_task_force_announcement

=== debrief_task_force_announcement ===

SAFETYNET is forming a special task force dedicated to hunting The Architect and dismantling coordinated ENTROPY operations.

Task Force Null. You're being assigned.

+ [What's the mission?]
    -> task_force_mission_explanation
+ [I'm ready.]
    -> task_force_accepted

=== task_force_mission_explanation ===

This isn't about stopping individual cells anymore. We're going after the network. The Architect. The coordination infrastructure.

You've proven yourself across four missions now. First Contact, Ransomed Trust, Ghost in the Machine, and now this. You're ready.

-> task_force_accepted

=== task_force_accepted ===

Good. Task Force Null briefing is tomorrow at 0600.

Now—there's one more decision to make. This facility is secure. Attack prevented. No casualties. But...

-> disclosure_decision

=== disclosure_decision ===

# Robert Chen present, listening

How do we handle this publicly? The facility manager needs to know our approach.

+ [Choice: Full Public Disclosure]
    -> disclosure_full_public
+ [Choice: Quiet Patch]
    -> disclosure_quiet
+ [Choice: Partial Disclosure]
    -> disclosure_partial

=== disclosure_full_public ===
~ disclosure_choice = "full"

Full transparency. We reveal the attack attempt, facility vulnerabilities, and ENTROPY threat.

# Robert Chen reacts

{chen_trust_level > 70:
    # Chen concerned but understanding
    Chen: "It'll damage the facility's reputation, but... people have a right to know how close this came."
- else:
    # Chen worried
    Chen: "The public backlash will be severe. But I understand."
}

Consequences:
- Public protected (awareness of infrastructure risks)
- Facility reputation damaged
- Industry-wide security investigations triggered
- Political pressure for infrastructure funding

This will force systemic change. Approved.

-> disclosure_outcome

=== disclosure_quiet ===
~ disclosure_choice = "quiet"

We classify the incident. Frame it as a "maintenance issue" that was resolved. Facility patches vulnerabilities quietly.

# Robert Chen reacts

{chen_trust_level > 70:
    # Chen conflicted
    Chen: "I understand the reasoning, but... is it right to hide this from the people we serve?"
- else:
    # Chen relieved
    Chen: "Thank you. The facility can't afford the reputational damage right now."
}

Consequences:
- Public uninformed of risk
- Facility reputation intact
- Security upgrades done discretely
- No systemic pressure for change

Stability over transparency. Approved.

-> disclosure_outcome

=== disclosure_partial ===
~ disclosure_choice = "partial"

Acknowledge a "security incident" without full details. Controlled narrative.

# Robert Chen reacts

{chen_trust_level > 70:
    # Chen accepts balance
    Chen: "A middle ground. People know something happened without full panic. I can work with that."
- else:
    # Chen neutral
    Chen: "Probably the most politically viable option."
}

Consequences:
- Moderate public awareness
- Balanced transparency and stability
- Some pressure for security improvements
- Controlled narrative

Balanced approach. Approved.

-> disclosure_outcome

=== disclosure_outcome ===

Decision recorded. {disclosure_choice == "full": Public statement will be coordinated. | disclosure_choice == "quiet": Incident remains classified. | disclosure_choice == "partial": Controlled statement will be prepared. }

# Robert Chen final words

{chen_trust_level > 80:
    Chen: "Thank you. I don't know your real name, but... thank you. You saved this facility. You saved those 400,000 people."
- chen_trust_level > 50:
    Chen: "You did good work here. This facility won't forget it."
- else:
    Chen: "I appreciate what you did, even if I don't fully understand it."
}

+ [It was an honor, Mr. Chen.]
    -> debrief_end_respectful
+ [Just doing my job.]
    -> debrief_end_professional

=== debrief_end_respectful ===
~ chen_trust_level = chen_trust_level + 10

# Chen nods

Chen: "This facility's been operating on hope and duct tape for too long. That changes now."

-> mission_complete

=== debrief_end_professional ===

# Chen returns to work

Chen: "I'll begin implementing security overhauls immediately."

-> mission_complete

=== mission_complete ===
~ emit_event("npc_conversation_complete:agent_0x99:debrief_complete")
~ emit_event("mission_complete")

# Agent 0x99 final words

Get some rest. Task Force Null briefing tomorrow. This is just beginning.

# Mission statistics display
# Credits roll

-> END
```

**Agent 0x99 Debrief Estimated Lines:** 30-35
**Function:** Mission wrap-up, disclosure choice, Task Force Null setup
**Key Moments:** Campaign revelation, player choice, Chen farewell

---

## Voice Acting Summary

### Line Count Estimates

**Primary Characters:**

- **Robert Chen:** 120-140 lines
  - Initial meeting: 40-50
  - SCADA discovery: 30-40
  - Support calls: 15-20
  - Resolution: 25-30

- **Agent 0x99:** 55-65 lines
  - Briefing: 25-30
  - Debrief: 30-35

- **Voltage:** 35-45 lines
  - Confrontation dialogue (multiple branches)
  - Ideology explanation
  - Capture/escape outcomes

**Supporting Characters:**

- **Security Guard:** 15-20 lines
  - Entry dialogue variations

- **Operatives (Cipher, Relay, Static):** 20-25 lines total
  - Combat alerts
  - Radio chatter
  - Team coordination

**Total Estimated Lines:** 245-295 voice acting lines

### Recording Sessions

**Session 1: Agent 0x99 (65 lines)**
- Briefing sequence
- Mid-mission support
- Debrief sequence

**Session 2: Robert Chen (140 lines)**
- Initial meeting variations
- SCADA discovery
- Support calls
- Resolution dialogue

**Session 3: Voltage + Operatives (70 lines)**
- Voltage confrontation (all branches)
- Operative combat dialogue
- Radio chatter

**Session 4: Minor NPCs (20 lines)**
- Security guard
- Background employees

---

## Dialogue Integration with Objectives

### Task-Dialogue Connections

**Task 1.2 (Meet Robert Chen):**
- Triggers: `chen_initial_meeting` knot
- Completion: `npc_conversation_complete:robert_chen:initial_meeting`
- Provides: Level 1 keycard

**Task 1.4 (Identify SCADA Anomalies):**
- Triggers: `chen_scada_anomalies` knot
- Completion: `npc_conversation_complete:robert_chen:scada_anomalies`
- Unlocks: Objective 2

**Task 3.1 (Confront Voltage):**
- Triggers: `voltage_confrontation_start` knot
- Branches: Based on `attack_trigger_secured` variable
- Completion: `custom_objective_complete:confront_voltage`
- Outcomes: `voltage_captured` (true/false)

**Task 3.3 (Report Mission Outcome):**
- Triggers: `debrief_start` knot
- Completion: `mission_complete` event
- Choice: `disclosure_choice` variable set

---

## Dialogue Variables Reference

### Mission Variables

```
chen_trust_level: 0-100
- Starting: 0
- Cooperative threshold: 50+
- Strong ally threshold: 70+
- Impacts: Chen's helpfulness, dialogue tone, final conversation

revealed_mission: boolean
- false: Cover identity maintained
- true: Mission revealed to Chen
- Affects: All Chen dialogue after reveal

voltage_captured: boolean
- Outcome of Task 3.1 confrontation
- Affects: Debrief dialogue, intelligence gained

attack_trigger_secured: boolean
- Critical for Voltage confrontation branching
- Affects: Voltage's leverage, combat difficulty

disclosure_choice: "full" | "quiet" | "partial"
- Player choice in Task 3.3
- Affects: Mission epilogue, Chen's final reaction

operatives_defeated: 0-3
- Tracks combat encounters
- Affects: Voltage's dialogue, tactical situation

player_approach: "professional" | "aggressive" | "cautious"
- Set during briefing
- Flavor text throughout mission

radio_obtained: boolean
- From Operative #1 defeat
- Enables radio monitoring feature
```

### Event Emissions

**Conversation Completions:**
```ink
~ emit_event("npc_conversation_complete:robert_chen:initial_meeting")
~ emit_event("npc_conversation_complete:robert_chen:scada_anomalies")
~ emit_event("npc_conversation_complete:agent_0x99:debrief_complete")
```

**Objective Triggers:**
```ink
~ emit_event("custom_objective_complete:confront_voltage")
~ emit_event("custom_objective_complete:identify_scada_anomalies")
~ emit_event("mission_complete")
```

**Outcome Tracking:**
```ink
~ emit_event("voltage_captured")
~ emit_event("voltage_escaped")
~ emit_event("attack_partially_triggered")
```

---

## Ink Script Best Practices (M4-Specific)

### Variable Naming Conventions

- Boolean flags: `revealed_mission`, `voltage_captured`
- Numeric values: `chen_trust_level`, `operatives_defeated`
- String choices: `disclosure_choice`, `player_approach`

### Branching Logic

```ink
{condition:
    Branch if true
- else:
    Branch if false
}

{variable == value:
    Exact match branch
- variable > threshold:
    Comparison branch
- else:
    Default branch
}
```

### Event Integration

```ink
~ emit_event("event_name")  // Trigger game event
~ item_obtained("item_id")  // Give player item
~ urgency_stage = 2         // Update urgency level
```

### Dialogue Pacing

- Short lines for action sequences
- Longer exposition for character moments
- Player choices every 3-5 NPC lines
- Branch reunion after 2-3 exchanges

---

## Localization Considerations

### Text Length Constraints

- Dialogue lines: 200 characters max (UI display)
- Choice text: 80 characters max (button display)
- NPC names: Consistent across all files

### Cultural Adaptation

- Technical jargon (SCADA, chemical dosing): Glossary provided
- American setting: Water treatment facility, Pacific Northwest
- Professional tone: Formal for 0x99/Chen, tactical for operatives

---

## Success Criteria for Dialogue

### Character Voice:
- 90%+ players can identify speaker without name tags
- Robert Chen's transformation feels earned
- Voltage feels credible, not cartoonish

### Player Agency:
- 85%+ players report choices felt meaningful
- Dialogue branches clearly different in tone and outcome
- Chen trust levels visibly affect his cooperation

### Integration:
- Dialogue triggers objectives correctly
- Variables track player choices accurately
- Event emissions work with game systems

---

## Stage 6 Completion Checklist

- [x] Agent 0x99 briefing dialogue complete
- [x] Robert Chen multi-stage conversations complete
- [x] Voltage confrontation dialogue complete
- [x] Security guard entry dialogue complete
- [x] Operative combat dialogue complete
- [x] Agent 0x99 debrief dialogue complete
- [x] Voice acting line counts estimated
- [x] Dialogue variables documented
- [x] Event integration specified
- [x] Ink script structure defined

---

## Next Stage Preparation

**Stage 7: Asset Manifest**
- Complete list of all required assets
- Sprites and animations for all NPCs
- Environment art requirements
- UI elements and SCADA displays
- Sound effects and music
- Item icons and object graphics

**Key Questions for Stage 7:**
- What sprite variations are needed for each NPC?
- What animation states are required?
- What SCADA UI elements need design?
- What sound effects support urgency progression?

---

**Status:** Stage 6 Complete - Ready for Stage 7
**Estimated Development Time:** 12-14 hours for Stage 6 documentation complete
**Quality Assessment:** Comprehensive dialogue system with branching conversations, character voice consistency, player agency integration, and complete Ink script planning

---

*Stage 6 establishes the complete dialogue foundation for Mission 4, providing detailed Ink script structures, conversation branching, variable tracking, and voice acting requirements. The dialogue system integrates seamlessly with objectives while supporting player choices and character development throughout the mission.*
