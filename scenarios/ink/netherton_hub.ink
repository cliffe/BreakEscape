// ===========================================
// NETHERTON CONVERSATION HUB
// Break Escape Universe
// ===========================================
// Central entry point for all Netherton conversations
// Mixes personal relationship building with mission-specific content
// Context-aware based on current mission and location
// ===========================================

// Include personal relationship file
INCLUDE netherton_ongoing_conversations.ink

// Include mission-specific files (examples - add more as missions are created)
// INCLUDE netherton_mission_ghost_in_machine.ink
// INCLUDE netherton_mission_data_sanctuary.ink
// INCLUDE netherton_mission_protocol_breach.ink

// ===========================================
// EXTERNAL CONTEXT VARIABLES
// These are provided by the game engine
// Note: player_name() and current_mission_id() are already declared in netherton_ongoing_conversations.ink
// ===========================================

EXTERNAL npc_location()                 // LOCAL - Where conversation happens ("office", "safehouse", "field", "briefing_room")
EXTERNAL mission_phase()                // LOCAL - Phase of current mission ("pre_briefing", "active", "debriefing", "downtime")

// ===========================================
// GLOBAL VARIABLES (shared across all NPCs)
// Note: total_missions_completed and professional_reputation are already declared in netherton_ongoing_conversations.ink
// ===========================================

// ===========================================
// MAIN ENTRY POINT
// Called by game engine when player talks to Netherton
// ===========================================

=== netherton_conversation_entry ===
// This is the main entry point - game engine calls this

{
    - npc_location() == "office":
        Netherton: Agent {player_name()}. *gestures to chair* What do you need?
    - npc_location() == "briefing_room":
        Netherton: Agent. *stands at tactical display* We have matters to discuss.
    - npc_location() == "field":
        Netherton: *over secure comms* Agent. Report.
    - npc_location() == "safehouse":
        Netherton: *sits across from you in the secure room* We're clear to talk here. What's on your mind?
    - else:
        Netherton: Agent {player_name()}. What requires my attention?
}

-> mission_hub

// ===========================================
// MISSION HUB - Central routing point
// Routes to personal conversations or mission-related topics
// Game returns here after #end_conversation from personal talks
// ===========================================

=== mission_hub ===

// Show different options based on location, mission phase, and relationship level

// PERSONAL RELATIONSHIP OPTION (always available if topics exist)
+ {has_available_personal_topics() and mission_phase() != "active"} [How are you, Director?]
    Netherton: *slight pause, as if surprised by personal question*
    {
        - npc_netherton_influence >= 70:
            Netherton: That's... considerate of you to ask, Agent. I have a moment for personal discussion.
        - else:
            Netherton: An unusual question. But acceptable. What do you wish to discuss?
    }
    -> jump_to_personal_conversations

// MISSION-SPECIFIC CONVERSATIONS (context-dependent)
+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "pre_briefing"} [Request briefing for Ghost Protocol operation]
    Netherton: Very well. Let me bring you up to speed on Ghost Protocol.
    -> mission_ghost_briefing

+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "active"} [Request tactical guidance]
    Netherton: *reviews your position on tactical display* What do you need?
    -> mission_ghost_tactical_support

+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "debriefing"} [Debrief Ghost Protocol operation]
    Netherton: Submit your report, Agent.
    -> mission_ghost_debrief

+ {current_mission_id() == "data_sanctuary"} [About the Data Sanctuary operation...]
    Netherton: The Data Sanctuary. A delicate situation. What questions do you have?
    -> mission_sanctuary_discussion

+ {mission_phase() == "downtime" and npc_netherton_influence >= 60} [Ask for operational advice]
    Netherton: You want my counsel? *slight approval* Very well.
    -> operational_advice_discussion

// GENERAL PROFESSIONAL TOPICS (available when not in active mission)
+ {mission_phase() != "active"} [Ask about SAFETYNET operations status]
    Netherton: *brings up secure display* Current operations status...
    -> safetynet_status_update

+ {professional_reputation >= 50 and mission_phase() == "downtime"} [Request additional training opportunities]
    Netherton: Initiative. Good. What areas do you wish to develop?
    -> training_discussion

// EXIT OPTIONS
+ {mission_phase() == "active"} [That's all I needed, Director]
    Netherton: Understood. Execute the mission. Report any developments.
    #end_conversation
    -> mission_hub

+ [That will be all, Director]
    {
        - npc_netherton_influence >= 80:
            Netherton: Very well, Agent {player_name()}. *almost warm* Continue your excellent work.
        - npc_netherton_influence >= 60:
            Netherton: Dismissed. Maintain your current performance level.
        - else:
            Netherton: Dismissed.
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
            - not npc_netherton_discussed_handbook: ~ return true
            - not npc_netherton_discussed_leadership: ~ return true
            - not npc_netherton_discussed_safetynet_history: ~ return true
            - not npc_netherton_discussed_expectations and npc_netherton_influence >= 55: ~ return true
            - else: ~ return false
        }

    // Phase 2 topics (missions 6-10)
    - total_missions_completed <= 10:
        {
            - not npc_netherton_discussed_difficult_decisions: ~ return true
            - not npc_netherton_discussed_agent_development: ~ return true
            - not npc_netherton_discussed_bureau_politics and npc_netherton_influence >= 65: ~ return true
            - not npc_netherton_discussed_field_vs_command and npc_netherton_influence >= 60: ~ return true
            - else: ~ return false
        }

    // Phase 3 topics (missions 11-15)
    - total_missions_completed <= 15:
        {
            - not npc_netherton_discussed_weight_of_command and npc_netherton_influence >= 75: ~ return true
            - not npc_netherton_discussed_agent_losses and npc_netherton_influence >= 70: ~ return true
            - not npc_netherton_discussed_ethical_boundaries and npc_netherton_influence >= 70: ~ return true
            - not npc_netherton_discussed_personal_cost and npc_netherton_influence >= 75: ~ return true
            - else: ~ return false
        }

    // Phase 4 topics (missions 16+)
    - total_missions_completed > 15:
        {
            - not npc_netherton_discussed_legacy and npc_netherton_influence >= 85: ~ return true
            - not npc_netherton_discussed_trust and npc_netherton_influence >= 80: ~ return true
            - not npc_netherton_discussed_rare_praise and npc_netherton_influence >= 85: ~ return true
            - not npc_netherton_discussed_beyond_protocol and npc_netherton_influence >= 90: ~ return true
            - else: ~ return false
        }

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
    - total_missions_completed <= 15:
        -> phase_3_hub
    - total_missions_completed > 15:
        -> phase_4_hub
}

// ===========================================
// MISSION-SPECIFIC CONTENT STUBS
// These would be expanded in separate mission files
// ===========================================

=== mission_ghost_briefing ===
Netherton: Ghost Protocol targets a critical infrastructure backdoor. ENTROPY has embedded themselves in the power grid control systems for three states.

Netherton: Your objective: Infiltrate their command node, identify the attack vector, and disable their access without alerting them to SAFETYNET's awareness.

Netherton: Dr. Chen has prepared specialized equipment. Haxolottle will provide handler support during infiltration.

Netherton: Questions?

+ [Ask about the strategic importance]
    Netherton: If ENTROPY activates this backdoor, they can cause cascading power failures across the region. Hospitals. Emergency services. Data centers. Millions affected.
    Netherton: We cannot allow that capability to remain in hostile hands.
    -> mission_ghost_briefing

+ [Ask about tactical considerations]
    Netherton: The facility has physical security and digital monitoring. You'll need to bypass both simultaneously.
    Netherton: Haxolottle has mapped their patrol patterns. Dr. Chen's camouflage system should mask your digital presence. But you'll need sound fieldcraft.
    -> mission_ghost_briefing

+ [Ask about extraction plan]
    Netherton: Standard extraction protocols apply. Complete the objective, egress quietly. If compromised, Protocol 7 authorizes forced extraction.
    Netherton: I'd prefer you complete this quietly. Burned operations create complications.
    -> mission_ghost_briefing

+ [I'm ready to proceed]
    Netherton: Excellent. *hands you mission packet* Review the details. Brief with Dr. Chen for equipment. Haxolottle will coordinate deployment.
    Netherton: Agent {player_name()}—*direct look*—execute this cleanly. We're counting on you.
    #mission_briefing_complete
    -> mission_hub

=== mission_ghost_tactical_support ===
Netherton: *monitoring your position* I'm tracking your progress. What do you need?

+ [Request permission to deviate from plan]
    Netherton: Explain the deviation and justification.
    // This would branch based on player's explanation
    Netherton: ... Acceptable. Use your judgment. I trust your field assessment.
    ~ npc_netherton_influence += 5
#influence_gained:5
    -> mission_hub

+ [Request emergency extraction]
    Netherton: *immediately alert* Situation?
    // This would handle emergency extraction logic
    Netherton: Extraction authorized. Get to waypoint Charlie. Haxolottle is coordinating pickup.
    #emergency_extraction_authorized
    -> mission_hub

+ [Just checking in]
    Netherton: Acknowledged. You're performing well. Maintain operational tempo.
    -> mission_hub

=== mission_ghost_debrief ===
Netherton: Your mission report indicates success. The backdoor has been neutralized. ENTROPY remains unaware of our intervention.

{npc_netherton_influence >= 70:
    Netherton: Excellent work, Agent. Your execution was textbook. This is exactly the kind of operational performance SAFETYNET requires.
    ~ npc_netherton_influence += 10
#influence_gained:10
- else:
    Netherton: Adequate performance. Mission objectives achieved. Some aspects could be refined.
    ~ npc_netherton_influence += 5
#influence_gained:5
}

Netherton: Dr. Chen is analyzing the technical data you extracted. It may provide intelligence on other ENTROPY operations.

Netherton: Take forty-eight hours downtime. Then report for next assignment.

#mission_complete
-> mission_hub

=== mission_sanctuary_discussion ===
Netherton: The Data Sanctuary operation. We're protecting a secure storage facility that houses classified intelligence from multiple allied agencies.

Netherton: ENTROPY has been probing the facility's defenses. They want what's inside.

Netherton: Your role will be defensive support. Not glamorous, but critical.

+ [Understood. What's my specific assignment?]
    Netherton: Details forthcoming. I wanted to brief you on strategic context first.
    -> mission_hub

+ [Ask why ENTROPY wants this data]
    Netherton: The sanctuary contains operation records, agent identities, tactical intelligence. A treasure trove for our adversaries.
    Netherton: If compromised, dozens of ongoing operations burn. Agents in the field become exposed. The damage would be severe.
    -> mission_sanctuary_discussion

+ [This mission sounds important]
    Netherton: Every mission is important, Agent. But yes—this one has particularly high stakes.
    -> mission_hub

=== operational_advice_discussion ===
Netherton: You want operational advice. *considers* On what specific matter?

+ [How to handle ambiguous situations in the field]
    Netherton: Ambiguity is constant in our work. The handbook provides framework, but you must exercise judgment.
    Netherton: When faced with ambiguous situation: Assess risk. Identify options. Select least-worst approach. Execute decisively.
    Netherton: Hesitation kills. Make the call and commit.
    ~ npc_netherton_influence += 5
#influence_gained:5
    -> mission_hub

+ [How to improve mission planning]
    Netherton: Read after-action reports from successful operations. Study what worked. Identify patterns.
    Netherton: Anticipate failure modes. For each plan, ask: What could go wrong? How would I adapt?
    Netherton: The axolotl principle—Haxolottle's term. Plan for regeneration when the original approach fails.
    ~ npc_netherton_influence += 5
#influence_gained:5
    -> mission_hub

+ [How to advance in SAFETYNET]
    Netherton: Consistent excellence. That's the path.
    Netherton: Demonstrate competence. Show sound judgment. Develop specialized capabilities. Volunteer for challenging assignments.
    Netherton: Most importantly: Maintain integrity. Technical skills can be trained. Character cannot.
    ~ npc_netherton_influence += 8
#influence_gained:8
    ~ professional_reputation += 1
    -> mission_hub

=== safetynet_status_update ===
Netherton: *brings up classified display*

Netherton: Current threat level: Elevated. ENTROPY has increased activity across three operational theaters.

Netherton: CYBER-PHYSICAL division is running {total_missions_completed + 15} active operations. Your work is part of that larger campaign.

Netherton: We're making progress. But ENTROPY adapts. The fight continues.

+ [Ask about specific threats]
    Netherton: Classified beyond your current access level. Your focus should remain on assigned missions.
    -> mission_hub

+ [Ask how the division is performing]
    Netherton: We meet operational objectives consistently. Success rate is {85 + (npc_netherton_influence / 10)} percent over the past quarter.
    Netherton: Acceptable, but there's room for improvement. Every failed operation represents unmitigated risk.
    -> mission_hub

+ [Thank them for the update]
    Netherton: *nods* Maintaining situational awareness is important. Don't become narrowly focused on individual missions.
    Netherton: Understand the larger context. Your work contributes to strategic objectives.
    -> mission_hub

=== training_discussion ===
Netherton: Training opportunities. What areas interest you?

+ [Advanced infiltration techniques]
    Netherton: We run quarterly advanced tradecraft seminars. I'll add you to the roster. Expect rigorous training. High washout rate.
    ~ professional_reputation += 2
    -> mission_hub

+ [Leadership development]
    Netherton: *slight approval* Thinking about command responsibilities. Good.
    Netherton: There's a leadership program for senior agents. Application process is competitive. I can recommend you if your performance continues.
    ~ professional_reputation += 3
    ~ npc_netherton_influence += 10
#influence_gained:10
    -> mission_hub

+ [Technical specialization]
    Netherton: Dr. Chen runs technical workshops. I'll arrange access. They'll be pleased to have an agent interested in deep technical capability.
    ~ professional_reputation += 2
    -> mission_hub
