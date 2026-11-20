// ===========================================
// HAXOLOTTLE CONVERSATION HUB
// Break Escape Universe
// ===========================================
// Central entry point for all Haxolottle (Agent 0x99) conversations
// Mixes personal friendship building with handler support
// Context-aware based on mission phase and operational needs
// Protocol 47-Alpha: No real identities disclosed
// ===========================================

// Include personal friendship file
INCLUDE haxolottle_ongoing_conversations.ink

// Include mission-specific files (examples - add more as missions are created)
// INCLUDE haxolottle_mission_ghost_handler.ink
// INCLUDE haxolottle_mission_data_sanctuary_support.ink

// ===========================================
// EXTERNAL CONTEXT VARIABLES
// These are provided by the game engine
// Note: player_name() and current_mission_id() are already declared in haxolottle_ongoing_conversations.ink
// ===========================================

EXTERNAL npc_location()                 // LOCAL - Where conversation happens ("handler_station", "briefing_room", "comms_active", "safehouse")
EXTERNAL mission_phase()                // LOCAL - Phase of current mission ("planning", "active", "debriefing", "downtime")
EXTERNAL operational_stress_level()     // LOCAL - How stressed the current situation is ("low", "moderate", "high", "crisis")

// ===========================================
// GLOBAL VARIABLES (shared across all NPCs)
// Note: total_missions_completed and professional_reputation are already declared in haxolottle_ongoing_conversations.ink
// ===========================================

// ===========================================
// MAIN ENTRY POINT
// Called by game engine when player talks to Haxolottle
// ===========================================

=== haxolottle_conversation_entry ===
// This is the main entry point - game engine calls this

{
    - npc_location() == "handler_station":
        Haxolottle: Agent! Good to see you. What's up? #delivery: swinging round from the monitors, pleased
    - npc_location() == "briefing_room":
        Haxolottle: Okay, let's review the handler support plan for this operation. #delivery: settling in, businesslike
    - npc_location() == "comms_active":
        Haxolottle: Reading you clearly, Agent. How can I help? #delivery: over secure comms, calm and focused
    - npc_location() == "safehouse":
        Haxolottle: Hey. Safe to talk here. What do you need? #delivery: relaxed
    - else:
        Haxolottle: Hey! What brings you by?
}

-> mission_hub

// ===========================================
// MISSION HUB - Central routing point
// Routes to personal conversations or mission-related topics
// Game returns here after #end_conversation from personal talks
// ===========================================

=== mission_hub ===

// Show different options based on location, mission phase, stress level, and friendship

// CRISIS HANDLING (takes priority during high-stress situations)
+ {operational_stress_level() == "crisis" and mission_phase() == "active"} [I need immediate handler support!]
    Haxolottle: Talk to me. What's happening? #delivery: instantly alert
    -> crisis_handler_support

// PERSONAL FRIENDSHIP OPTION (available during downtime if topics exist)
+ {has_available_personal_topics() and mission_phase() == "downtime"} [Want to chat? Non-work stuff?]
    Haxolottle: Personal conversation? According to Regulation 847, that's encouraged for psychological wellbeing. #delivery: grinning
    {
        - npc_haxolottle_influence >= 60:
            Haxolottle: And honestly, I could use a break from staring at monitors. What's on your mind?
        - else:
            Haxolottle: Sure, I've got time. What do you want to talk about?
    }
    -> jump_to_personal_conversations

// ACTIVE MISSION HANDLER SUPPORT
+ {mission_phase() == "active" and operational_stress_level() != "crisis"} [Request handler support]
    Haxolottle: On it. What do you need?
    -> active_mission_handler_support

+ {mission_phase() == "active"} [Request intel update]
    Haxolottle: Let me give you the current situation... #delivery: brisk, briefing
    -> intel_update_active

+ {mission_phase() == "active" and operational_stress_level() == "high"} [Situation is getting complicated]
    Haxolottle: Okay. Talk me through what's happening. We'll adapt. #delivery: focused
    -> complicated_situation_support

// MISSION PLANNING AND BRIEFING
+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "planning"} [Review handler plan for Ghost Protocol]
    Haxolottle: Ghost Protocol. Right. Let's go through the support plan. #delivery: brisk
    -> mission_ghost_handler_briefing

+ {current_mission_id() == "data_sanctuary" and mission_phase() == "planning"} [Discuss Data Sanctuary handler support]
    Haxolottle: Data Sanctuary defensive operation. I'll be coordinating multi-agent support. Here's how we'll handle it.
    -> mission_sanctuary_handler_plan

+ {mission_phase() == "planning"} [Ask about contingency planning]
    Haxolottle: Contingencies! Yes. Let's talk about what happens when things go sideways.
    Haxolottle: Per the axolotl principle—we plan for regeneration. #delivery: with a slight smile
    -> contingency_planning_discussion

// DEBRIEFING
+ {mission_phase() == "debriefing"} [Debrief the operation]
    Haxolottle: Alright. Let's walk through what happened. Start from the beginning. #delivery: businesslike
    -> operation_debrief

+ {mission_phase() == "debriefing" and operational_stress_level() == "high"} [That mission was rough]
    Haxolottle: Yeah, I saw. Are you okay? Physically? Mentally? #delivery: concerned
    -> rough_mission_debrief

// GENERAL HANDLER TOPICS (available during downtime)
+ {mission_phase() == "downtime"} [Ask about current threat landscape]
    Haxolottle: So, here's what ENTROPY is up to lately... #delivery: serious, briefing
    -> threat_landscape_update

+ {mission_phase() == "downtime" and npc_haxolottle_influence >= 40} [Ask for operational advice]
    Haxolottle: You want my handler perspective? Sure. What's the question? #delivery: settling in
    -> operational_advice_from_handler

+ {npc_haxolottle_influence >= 50 and mission_phase() == "downtime"} [Ask about handler tradecraft]
    Haxolottle: Handler tradecraft! You're interested in the behind-the-scenes stuff?
    -> handler_tradecraft_discussion

// EXIT OPTIONS
+ {mission_phase() == "active"} [That's all I needed. Thanks, Hax.]
    Haxolottle: Roger. I'm monitoring your situation. Call if you need anything. Stay safe out there.
    #end_conversation
    -> mission_hub

+ [That's all for now]
    {
        - npc_haxolottle_influence >= 70:
            Haxolottle: Alright, Agent. Always good talking with you. Take care of yourself. #delivery: genuine warmth
        - npc_haxolottle_influence >= 40:
            Haxolottle: Sounds good. Let me know if you need anything. Really, anytime.
        - else:
            Haxolottle: Okay. Talk later!
    }
    #end_conversation
    -> mission_hub

// ===========================================
// HELPER FUNCTION - Check for available personal topics
// ===========================================

=== function has_available_personal_topics() ===
// Returns true if there are any personal conversation topics available
{
    // Phase 1 topics (missions 1-5)
    - total_missions_completed <= 5:
        {
            - not npc_haxolottle_talked_hobbies_general: ~ return true
            - not npc_haxolottle_talked_axolotl_obsession: ~ return true
            - not npc_haxolottle_talked_music_taste: ~ return true
            - not npc_haxolottle_talked_coffee_preferences and npc_haxolottle_talked_hobbies_general: ~ return true
            - not npc_haxolottle_talked_stress_management and npc_haxolottle_influence >= 15: ~ return true
            - else: ~ return false
        }

    // Phase 2 topics (missions 6-10)
    - total_missions_completed <= 10:
        {
            - not npc_haxolottle_talked_philosophy_change: ~ return true
            - not npc_haxolottle_talked_handler_life: ~ return true
            - not npc_haxolottle_talked_field_nostalgia and npc_haxolottle_influence >= 30: ~ return true
            - not npc_haxolottle_talked_weird_habits: ~ return true
            - not npc_haxolottle_talked_favorite_operations and npc_haxolottle_influence >= 35: ~ return true
            - else: ~ return false
        }

    // Phase 3 and 4 topics would go here (file only has Phase 1-2 currently)
    - else:
        ~ return false
}

// ===========================================
// JUMP TO PERSONAL CONVERSATIONS
// Routes to the appropriate phase hub in personal file
// ===========================================

=== jump_to_personal_conversations ===
// Jump to appropriate phase hub based on progression
{
    - total_missions_completed <= 5:
        -> phase_1_hub
    - total_missions_completed <= 10:
        -> phase_2_hub
}

// ===========================================
// CRISIS HANDLER SUPPORT
// ===========================================

=== crisis_handler_support ===
Haxolottle: Okay. Deep breath. You've trained for this. #delivery: absolutely focused

Haxolottle: Tell me the situation. What's the immediate threat?

+ [Explain the crisis situation]
    You quickly explain the critical situation you're facing.
    Haxolottle: Okay. Okay. Here's what we're going to do... #delivery: thinking fast
    -> crisis_solution_planning

+ [I'm compromised. Need extraction.]
    Haxolottle: Extraction protocol initiated. I'm coordinating with Netherton now. #delivery: fast, working as they talk
    Haxolottle: Get to emergency waypoint Bravo. Fifteen minutes. Can you make it?
    -> emergency_extraction_coordination

+ [Equipment failure in critical situation]
    Narrator: Haxolottle opens a second channel to Dr. Chen.
    Haxolottle: Chen, I need you. Equipment failure, active operation. #delivery: urgent
    Haxolottle: Okay, Agent, Chen is on comms now. Walk them through the problem.
    -> equipment_crisis_support

=== crisis_solution_planning ===

Haxolottle: Alright. You have options. None are perfect, but you can regenerate from this. #delivery: calm and methodical despite the crisis

Haxolottle: Option Alpha: [describes tactical approach]. Risk level: moderate. Success probability: 65%.

Haxolottle: Option Bravo: [describes alternative]. Risk level: high. Success probability: 80% if it works.

Haxolottle: Option Charlie: Abort and extract. Risk level: moderate. Mission fails but you live.

Which approach do you want to take?

+ [Option Alpha]
    Haxolottle: Good call. I agree. Here's how we execute...
    #crisis_resolved_alpha
    -> mission_hub

+ [Option Bravo]
    Haxolottle: High risk, but yeah, the payoff justifies it. I'll support you. Let's do this carefully.
    #crisis_resolved_bravo
    -> mission_hub

+ [Option Charlie - extract]
    Haxolottle: Smart. Live to fight another day. Coordinates extraction...
    Haxolottle: You made the right call. Equipment and missions are replaceable. You're not.
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    #crisis_extraction
    -> mission_hub

+ [Ask for their recommendation]
    {operational_stress_level() == "crisis":
        Haxolottle: Honest assessment? Extract. The mission isn't worth your life. But it's your call. #delivery: glad to be asked
    - else:
        Haxolottle: I'd try Alpha. Calculated risk with decent probability. But you're the one in the field. #delivery: glad to be asked
    }
    -> crisis_solution_planning

=== emergency_extraction_coordination ===

Haxolottle: Netherton has authorised emergency extraction. Asset protection priority. #delivery: rapid, coordinating

Haxolottle: Route to waypoint Bravo. #delivery: clear, precise

Haxolottle: I've got eyes on security feeds. I'll guide you around patrol patterns.

Haxolottle: Agent, you've got this. I'm with you every step. Move now. #delivery: firm but caring

#emergency_extraction_active
-> DONE

=== equipment_crisis_support ===
// Dr. Chen joins the comms channel
Dr. Chen: Okay, I'm here. What's failing? #delivery: over a comms link

Haxolottle: I'll coordinate while Chen troubleshoots the tech. Two-handler support.

[This would integrate with Chen's technical support systems]

#multi_handler_crisis_support
-> mission_hub

// ===========================================
// ACTIVE MISSION SUPPORT
// ===========================================

=== active_mission_handler_support ===
Haxolottle: What kind of support do you need? #delivery: professional, focused

+ [Intel refresh - what am I walking into?]
    Haxolottle: Current situation: [describes updated tactical picture] #delivery: reading live from the feeds
    Haxolottle: Changes from briefing: [notes differences]. Adapt accordingly.
    -> mission_hub

+ [Need security status update]
    Haxolottle: Security status: [describes guard patterns, surveillance state] #delivery: checking the feeds as they talk
    Haxolottle: Best infiltration window is in 12 minutes. That work for you?
    -> mission_hub

+ [Requesting abort confirmation]
    Haxolottle: You want to abort? Talk to me. What's the situation? #delivery: serious
    -> abort_request_discussion

+ [Just checking in]
    Haxolottle: All good. You're doing great. Operational tempo is solid. Keep it up. #delivery: reassuring
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    -> mission_hub

=== intel_update_active ===

Haxolottle: Current intel picture: ENTROPY activity level moderate. No indication they're aware of you. #delivery: analysing as they talk

Haxolottle: Target location status: [describes current state based on surveillance]

Haxolottle: Recommended approach: [tactical suggestion based on current intel]

+ [Acknowledge and proceed]
    Haxolottle: Roger. I'll keep monitoring. Call if situation changes.
    -> mission_hub

+ [Intel doesn't match what I'm seeing]
    Haxolottle: Explain. What are you seeing that I'm not? #delivery: immediately alert
    -> intel_discrepancy_resolution

+ [Request deeper analysis]
    Haxolottle: Give me two minutes. I'll pull additional sources... #delivery: fast, typing as they speak
    -> deep_intel_analysis

=== complicated_situation_support ===
Haxolottle: Okay. Complications are normal. We adapt. #delivery: calm under pressure

Haxolottle: Talk me through the specific complication. What changed?

+ [Explain the complication]
    You describe how the situation has become more complex.
    Haxolottle: Alright. That's not ideal, but it's manageable. Here's how we adjust... #delivery: processing it
    Haxolottle: Remember the axolotl principle. Original approach failed. Time to regenerate a new one.
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    -> adaptation_planning

+ [Multiple things going wrong]
    Haxolottle: Okay, let's triage. What's the most immediate problem? #delivery: focused
    -> crisis_triage

+ [I think I need to abort]
    Haxolottle: That's a valid option. Let's assess together. Walk me through your reasoning. #delivery: supportive
    -> abort_assessment

=== adaptation_planning ===
Haxolottle: New plan: [outlines adapted approach based on the complication]

Haxolottle: This should account for the changes you're seeing. Thoughts?

+ [Sounds good. Proceeding with adapted plan.]
    Haxolottle: Excellent. Execute when ready. I'm monitoring your six.
    -> mission_hub

+ [Still risky. What if it doesn't work?]
    Haxolottle: Fair concern. Backup plan: [outlines contingency]
    Haxolottle: You'll have options. That's what matters.
    -> mission_hub

+ [Got a better idea]
    Haxolottle: I'm listening. What are you thinking? #delivery: interested
    -> agent_alternative_plan

=== abort_request_discussion ===
Haxolottle: Okay. If you want to abort, we abort. Your judgment in the field is what matters. #delivery: taking it seriously

Haxolottle: But help me understand—is this "mission parameters changed beyond acceptable risk" or "something feels wrong"?

+ [Risk has exceeded acceptable parameters]
    Haxolottle: Operational assessment. Respected. I'll coordinate extraction. #delivery: agreeing
    Haxolottle: Netherton might push back, but I'll support your call. You're the one taking the risk.
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    #mission_aborted
    -> mission_hub

+ [Something feels wrong - can't explain it]
    Haxolottle: That's valid. Field intuition saves lives. Abort authorised. #delivery: trusting your instinct
    Haxolottle: We can analyze what felt wrong afterwards. Right now, get clear.
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    #mission_aborted_intuition
    -> mission_hub

+ [Actually, let me try one more thing first]
    Haxolottle: Okay. But the abort option stays on the table. I've got your back either way. #delivery: supportive
    -> mission_hub

=== intel_discrepancy_resolution ===
Haxolottle: Intel discrepancy is serious. Describe exactly what you're seeing. #delivery: very focused

You explain the difference between Haxolottle's intel and ground truth.

Haxolottle: Okay. Either my feeds are compromised or ENTROPY changed something recently. #delivery: urgent

Haxolottle: Recommend trusting your eyes over my monitors. Proceed with extreme caution. I'm investigating the discrepancy.

{npc_haxolottle_influence >= 50:
    Haxolottle: And Agent? Be careful. If my intel is wrong, you're more exposed than we thought. #delivery: concerned
    ~ npc_haxolottle_influence += 5
#influence_gained:5
}

-> mission_hub

// ===========================================
// MISSION-SPECIFIC HANDLER BRIEFINGS
// ===========================================

=== mission_ghost_handler_briefing ===

Haxolottle: Ghost Protocol. High-stakes infiltration. Here's the handler support plan. #delivery: businesslike

Haxolottle: Before you go in: I'll have access to facility security feeds, external surveillance, and ENTROPY communication intercepts.

Haxolottle: During infiltration: I'll provide real-time guidance on security patrols, alert you to threats, guide route adjustments.

Haxolottle: If compromised: Emergency extraction protocols ready. Three waypoints prepared.

+ [How reliable is the security feed access?]
    Haxolottle: 85% confidence. Dr. Chen provided the access tools. They're good, but not perfect.
    Haxolottle: If feeds cut out, you'll need to go silent running. We've prepared for that contingency.
    -> mission_ghost_handler_briefing

+ [What if comms go down?]
    Haxolottle: Good question. If we lose comms: fall back to pre-planned exfiltration route Alpha.
    Haxolottle: I'll send periodic encrypted status pings. If you don't respond, I initiate extraction protocols.
    -> mission_ghost_handler_briefing

+ [Sounds solid. I'm confident in this plan.]
    Haxolottle: Good. Because I've run hundreds of handler ops, and this is one of my better plans. #delivery: with a slight smile
    Haxolottle: We've got this. Partnership.
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    -> mission_hub

=== mission_sanctuary_handler_plan ===
Haxolottle: Data Sanctuary defensive operation. Different from infiltration—we're protecting rather than penetrating.

Haxolottle: I'll be coordinating four agents plus security personnel. Central tactical coordinator role.

Haxolottle: Your position will be [describes defensive position]. If ENTROPY attempts breach, you respond to my directions.

Haxolottle: This requires trusting my tactical picture. I'll be seeing things you can't. Follow my instructions precisely.

+ [I trust your tactical judgment]
    Haxolottle: Thank you. Command is easier when agents trust the handler. #delivery: appreciative
    Haxolottle: I won't let you down.
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    -> mission_hub

+ [What if I see something you don't?]
    Haxolottle: Always report anomalies immediately. You're my eyes on the ground. #delivery: pleased by the question
    Haxolottle: I coordinate big picture. You provide ground truth. Both matter.
    -> mission_sanctuary_handler_plan

+ [Coordinating four agents sounds complex]
    Haxolottle: It is. But I've done multi-agent ops before. As long as everyone follows instructions, it works.
    Haxolottle: Just need everyone to trust the system. And me.
    -> mission_sanctuary_handler_plan

=== contingency_planning_discussion ===
Haxolottle: Contingencies! My favorite part of planning.

Haxolottle: For every mission, I plan at least three "what if" scenarios. #delivery: methodical, briefing

Haxolottle: What if you're detected? What if extraction fails? What if comms are compromised? What if everything goes perfectly but ENTROPY adapted?

Haxolottle: The axolotl principle—regeneration over rigidity. Plans that can adapt. #delivery: smiling

+ [Walk me through the contingencies for this mission]
    Narrator: Haxolottle walks you through the contingencies for this mission.
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    -> mission_hub

+ [This seems paranoid]
    Haxolottle: I've had too many operations go sideways. Paranoid preparation saves lives. #delivery: with a shrug in the voice
    Haxolottle: When you're in the field and things go wrong, you'll be glad we planned for it.
    -> mission_hub

+ [I appreciate the thoroughness]
    Haxolottle: That means a lot. Handlers live and die by preparation. #delivery: sincere
    Haxolottle: Knowing you value that preparation makes the late nights worth it.
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    -> mission_hub

// ===========================================
// DEBRIEFING
// ===========================================

=== operation_debrief ===
Haxolottle: Standard post-operation debrief. Walk me through it chronologically. #delivery: businesslike

+ [Provide thorough debrief]
    You provide a detailed account of the operation.
    Haxolottle: Good detail. This is exactly what I need for the after-action report. #delivery: taking notes as they listen
    {npc_haxolottle_influence >= 40:
        Haxolottle: And more importantly—are you okay? Physically? Mentally?
        ~ npc_haxolottle_influence += 3
#influence_gained:3
    }
    -> debrief_completion

+ [Give abbreviated version]
    Haxolottle: I need more detail for the report. What specific challenges did you encounter? #delivery: with a slight frown
    -> detailed_debrief_questions

+ [Ask if they want their perspective first]
    Haxolottle: Actually, yes. Let me tell you what I saw from handler perspective, then you fill gaps. #delivery: appreciating the question
    -> handler_perspective_debrief

=== rough_mission_debrief ===
Haxolottle: Yeah, I was watching. That got intense. #delivery: concerned

Haxolottle: Before we do the formal debrief—are you actually okay? Not the professional "I'm fine." The real answer.

+ [Be honest about the difficulty]
    You admit the mission was harder than expected and took a toll.
    Haxolottle: Thank you for being honest. That mission pushed limits. You handled it, but pushing limits has costs. #delivery: empathetic
    Haxolottle: Take additional recovery time. I'll handle Netherton if they push back. Your wellbeing matters.
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_trust_moments += 1
    -> debrief_completion

+ [Downplay it professionally]
    Narrator: Haxolottle sees straight through it.
    Haxolottle: Agent. I watched that mission. It was rough. Don't minimise it.
    Haxolottle: Acknowledging difficulty isn't weakness. It's accurate assessment.
    -> rough_mission_debrief

+ [Thank them for asking]
    Haxolottle: Of course I ask. I watched you face that. I care about more than mission success—I care about you. #delivery: sincere
    {npc_haxolottle_influence >= 50:
        Haxolottle: You're not just an asset to manage. You're... a colleague I value. A friend, within the constraints of Protocol 47-Alpha. #delivery: hesitating
        ~ npc_haxolottle_influence += 10
#influence_gained:10
    }
    -> debrief_completion

=== debrief_completion ===

Haxolottle: Debrief complete. After-action report will go to Netherton and operational archives. #delivery: wrapping up, businesslike

{mission_phase():
    Haxolottle: Mission status: another operation completed successfully.
    ~ total_missions_completed += 1
}

Haxolottle: You did good work, Agent. Really.

#debrief_complete
-> mission_hub

// ===========================================
// GENERAL OPERATIONAL DISCUSSIONS
// ===========================================

=== threat_landscape_update ===
Narrator: Haxolottle brings up the classified threat dashboard.

Haxolottle: Current ENTROPY activity: [describes threat level based on mission count and patterns]

Haxolottle: Recent patterns suggest they're shifting tactics. More sophisticated network infiltration. Less brute force.

Haxolottle: We're adapting. Dr. Chen is developing new countermeasures. Netherton is adjusting operational protocols.

+ [Ask about specific threats]
    Narrator: Haxolottle gives you a detailed threat analysis.
    -> mission_hub

+ [Express concern about escalation]
    Haxolottle: Yeah, me too. The escalation pattern is concerning. #delivery: serious
    Haxolottle: But that's why we're here. SAFETYNET exists to counter this. And we're getting better at it.
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    -> mission_hub

+ [Thank them for the update]
    Haxolottle: Situational awareness matters. Stay informed, stay effective. #delivery: agreeing
    -> mission_hub

=== operational_advice_from_handler ===
Haxolottle: Handler perspective on operations. What do you want to know?

+ [How to be a better field agent]
    Haxolottle: From handler perspective? Communicate clearly. Trust your handler's intel but verify with your eyes. Adapt when plans fail.
    Haxolottle: Best agents treat handlers as partners, not support staff. We succeed together or fail together.
    ~ professional_reputation += 1
    -> mission_hub

+ [What mistakes do agents make?]
    Haxolottle: Biggest mistake: not calling for help until it's too late. Pride gets people hurt. #delivery: thoughtful
    Haxolottle: Ask for support early. That's what handlers are for. We can't help if we don't know there's a problem.
    ~ professional_reputation += 1
    -> mission_hub

+ [How to work better with you specifically]
    Haxolottle: Honestly? You already work well with me. #delivery: appreciating the question
    Haxolottle: You communicate clearly. You trust my intel while using your judgment. You understand the partnership.
    {npc_haxolottle_influence >= 50:
        Haxolottle: You're one of the best agents I've handled. And I've handled a lot.
        ~ npc_haxolottle_influence += 8
#influence_gained:8
    }
    -> mission_hub

=== handler_tradecraft_discussion ===
Haxolottle: Handler tradecraft! The behind-the-scenes magic.

Haxolottle: Handlers balance multiple information streams—security feeds, ENTROPY intercepts, agent biometrics, tactical maps—and synthesize it into actionable guidance.

Haxolottle: We're pattern recognition engines. Spotting threats before they manifest. Identifying opportunities you can't see from your position.

Haxolottle: And honestly? A lot of it is managing stress. Yours and ours. Keeping calm when everything is chaotic.

+ [That sounds incredibly complex]
    Haxolottle: It is. But it's also what I'm good at. Turns out eight years of field experience translates well to handler work.
    Haxolottle: I know what you're experiencing because I've experienced it. That empathy makes me better at support.
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    -> mission_hub

+ [How do you manage your own stress?]
    Haxolottle: Varies. Swimming helps. Reading. Listening to rain sounds while pretending I'm not worried about agents in danger. #delivery: honestly
    {npc_haxolottle_influence >= 40:
        Haxolottle: Conversations like this help too. Knowing the agents I support see me as more than a voice on comms.
        ~ npc_haxolottle_influence += 8
#influence_gained:8
    }
    -> mission_hub

+ [Could you teach me handler skills?]
    Haxolottle: You want cross-training? Actually, that would make you a better field agent. Understanding both sides improves collaboration. #delivery: interested
    Haxolottle: I can set up some handler shadowing. You observe while I run someone else's operation. Educational for both roles.
    ~ professional_reputation += 2
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    #handler_training_offered
    -> mission_hub

// ===========================================
// STUB KNOTS - To be implemented
// ===========================================

=== deep_intel_analysis ===
Haxolottle: I'm pulling deeper intelligence sources now. Give me a moment... #delivery: analysing the data as they talk
Haxolottle: Alright, here's what I'm seeing from the extended analysis...
-> mission_hub

=== crisis_triage ===
Haxolottle: Okay, let's prioritise. First, secure your immediate position. Second, we assess escape routes. #delivery: focused, in triage mode
Haxolottle: Talk to me. What's the most pressing threat right now?
-> mission_hub

=== abort_assessment ===
Haxolottle: Let's walk through the abort decision together. What's driving this? #delivery: methodical
Haxolottle: Sometimes abort is the right call. Sometimes we just need to adapt. Let's figure out which this is.
-> mission_hub

=== agent_alternative_plan ===
Haxolottle: Okay, you have an alternative approach in mind. Walk me through it. #delivery: collaborative
Haxolottle: I'll assess feasibility from my end while you explain the concept.
-> mission_hub

=== detailed_debrief_questions ===
Haxolottle: I need you to walk me through the timeline step by step. #delivery: probing, detailed
Haxolottle: What happened first? What was your decision-making process at each critical point?
-> mission_hub

=== handler_perspective_debrief ===
Haxolottle: From my monitoring position, here's what I observed during your operation... #delivery: analytical
Haxolottle: There were moments where communication could have been clearer, but overall solid execution.
-> mission_hub
