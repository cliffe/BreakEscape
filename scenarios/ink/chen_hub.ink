// ===========================================
// DR. CHEN CONVERSATION HUB
// Break Escape Universe
// ===========================================
// Central entry point for all Dr. Chen conversations
// Mixes personal friendship building with technical support
// Context-aware based on current mission and equipment needs
// ===========================================

// Include personal relationship file
INCLUDE dr_chen_ongoing_conversations.ink

// Include mission-specific files (examples - add more as missions are created)
// INCLUDE chen_mission_ghost_equipment.ink
// INCLUDE chen_mission_data_sanctuary_tech.ink

// ===========================================
// EXTERNAL CONTEXT VARIABLES
// These are provided by the game engine
// Note: player_name() and current_mission_id() are already declared in dr_chen_ongoing_conversations.ink
// ===========================================

EXTERNAL npc_location()                 // LOCAL - Where conversation happens ("lab", "equipment_room", "briefing_room", "field_support")
EXTERNAL mission_phase()                // LOCAL - Phase of current mission ("pre_briefing", "active", "debriefing", "downtime")
EXTERNAL equipment_status()             // LOCAL - Status of player's equipment ("nominal", "damaged", "needs_upgrade")

// ===========================================
// GLOBAL VARIABLES (shared across all NPCs)
// Note: total_missions_completed and professional_reputation are already declared in dr_chen_ongoing_conversations.ink
// ===========================================

// ===========================================
// MAIN ENTRY POINT
// Called by game engine when player talks to Dr. Chen
// ===========================================

=== chen_conversation_entry ===
// This is the main entry point - game engine calls this

{
    - npc_location() == "lab":
        Dr. Chen: {player_name()}! *looks up from workbench* Perfect timing. Come check this out!
    - npc_location() == "equipment_room":
        Dr. Chen: Oh hey! Here for gear? I just finished calibrating some new equipment.
    - npc_location() == "briefing_room":
        Dr. Chen: Agent {player_name()}. *gestures to technical displays* Let's talk about the tech side of this operation.
    - npc_location() == "field_support":
        Dr. Chen: *over comms* Reading you loud and clear. What do you need?
    - else:
        Dr. Chen: Hey! What brings you by?
}

-> mission_hub

// ===========================================
// MISSION HUB - Central routing point
// Routes to personal conversations or mission-related topics
// Game returns here after #end_conversation from personal talks
// ===========================================

=== mission_hub ===

// Show different options based on location, mission phase, and relationship level

// PERSONAL FRIENDSHIP OPTION (always available if topics exist)
+ {has_available_personal_topics() and mission_phase() != "active"} [How are you doing, Dr. Chen?]
    Dr. Chen: Oh! *surprised by personal question*
    {
        - npc_chen_influence >= 70:
            Dr. Chen: You know, I really appreciate when people ask that. Want to chat for a bit?
        - else:
            Dr. Chen: I'm good! Busy, but good. What's up?
    }
    -> jump_to_personal_conversations

// EQUIPMENT AND TECHNICAL SUPPORT (high priority when damaged or needs upgrade)
+ {equipment_status() == "damaged"} [My equipment took damage in the field]
    Dr. Chen: *immediately concerned* Let me see it. What happened?
    -> equipment_repair_discussion

+ {equipment_status() == "needs_upgrade"} [Request equipment upgrades for upcoming mission]
    Dr. Chen: Upgrades! Yes! I've been working on some new gear. Let me show you what's available.
    -> equipment_upgrade_menu

+ {mission_phase() == "active" and npc_location() == "field_support"} [I need technical support in the field]
    Dr. Chen: *alert* Okay, talk to me. What's the technical problem?
    -> field_technical_support

// MISSION-SPECIFIC TECHNICAL DISCUSSIONS
+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "pre_briefing"} [What tech will I need for Ghost Protocol?]
    Dr. Chen: Ghost Protocol! Okay, so I've prepared some specialized equipment for this one. Let me walk you through it.
    -> mission_ghost_equipment_briefing

+ {current_mission_id() == "ghost_in_machine" and mission_phase() == "debriefing"} [Technical debrief for Ghost Protocol]
    Dr. Chen: How did the equipment perform? I need field data to improve the designs.
    -> mission_ghost_tech_debrief

+ {current_mission_id() == "data_sanctuary"} [What tech is protecting the Data Sanctuary?]
    Dr. Chen: *pulls up schematics* The sanctuary has multi-layered security. Let me explain the architecture.
    -> mission_sanctuary_tech_overview

// GENERAL TECHNICAL TOPICS
+ {mission_phase() == "downtime"} [Ask about experimental technology]
    Dr. Chen: *eyes light up* Oh! You want to hear about the experimental stuff? Because I have some REALLY cool projects going.
    -> experimental_tech_discussion

+ {mission_phase() == "downtime" and npc_chen_influence >= 50} [Offer to help test experimental equipment]
    Dr. Chen: *excited* You'd volunteer for field testing? That would be incredibly helpful!
    -> volunteer_field_testing

+ {npc_chen_influence >= 60} [Ask for technical training]
    Dr. Chen: You want technical training? I love teaching! What area interests you?
    -> technical_training_discussion

// EXIT OPTIONS
+ {mission_phase() == "active" and npc_location() == "field_support"} [That's all I needed, thanks]
    Dr. Chen: Roger that. I'll keep monitoring your situation. Call if you need anything!
    #end_conversation
    -> mission_hub

+ [That's all for now, Chen]
    {
        - npc_chen_influence >= 80:
            Dr. Chen: Sounds good! *warm smile* Always great talking with you. Stay safe out there!
        - npc_chen_influence >= 50:
            Dr. Chen: Alright! Let me know if you need anything. Seriously, anytime.
        - else:
            Dr. Chen: Okay. Good luck with the mission!
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
            - not npc_chen_discussed_tech_philosophy: ~ return true
            - not npc_chen_discussed_entropy_tech: ~ return true
            - not npc_chen_discussed_chen_background: ~ return true
            - not npc_chen_discussed_favorite_projects and npc_chen_influence >= 55: ~ return true
            - else: ~ return false
        }

    // Phase 2 topics (missions 6-10)
    - total_missions_completed <= 10:
        {
            - not npc_chen_discussed_experimental_tech: ~ return true
            - not npc_chen_discussed_research_frustrations and npc_chen_influence >= 65: ~ return true
            - not npc_chen_discussed_field_vs_lab: ~ return true
            - not npc_chen_discussed_ethical_tech and npc_chen_influence >= 70: ~ return true
            - else: ~ return false
        }

    // Phase 3 topics (missions 11-15)
    - total_missions_completed <= 15:
        {
            - not npc_chen_discussed_dream_projects and npc_chen_influence >= 80: ~ return true
            - not npc_chen_discussed_tech_risks and npc_chen_influence >= 75: ~ return true
            - not npc_chen_discussed_work_life_balance: ~ return true
            - not npc_chen_discussed_mentorship and npc_chen_influence >= 80: ~ return true
            - else: ~ return false
        }

    // Phase 4 topics (missions 16+)
    - total_missions_completed > 15:
        {
            - not npc_chen_discussed_future_vision and npc_chen_influence >= 90: ~ return true
            - not npc_chen_discussed_friendship_value and npc_chen_influence >= 85: ~ return true
            - not npc_chen_discussed_collaborative_legacy and npc_chen_influence >= 90: ~ return true
            - not npc_chen_discussed_beyond_safetynet and npc_chen_influence >= 88: ~ return true
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
// EQUIPMENT AND TECHNICAL SUPPORT
// ===========================================

=== equipment_repair_discussion ===
Dr. Chen: *examines the damaged equipment* Okay, let me see... *muttering technical analysis*

Dr. Chen: This is fixable, but it'll take some time. What happened out there?

+ [Explain the damage honestly]
    You explain how the equipment was damaged during the operation.
    Dr. Chen: *nods* Okay, that's actually really useful feedback. I can improve the durability in the next version.
    Dr. Chen: Give me about two hours. I'll have this repaired and reinforced.
    ~ npc_chen_influence += 5
#influence_gained:5
    #equipment_repair_started
    -> mission_hub

+ [Say it was your fault]
    Dr. Chen: Hey, no—don't beat yourself up. Field conditions are unpredictable. That's why we build redundancy.
    Dr. Chen: Let me fix this and add some additional protection. You're not the first agent to damage gear in the field.
    ~ npc_chen_influence += 8
#influence_gained:8
    -> mission_hub

+ [Blame the equipment design]
    Dr. Chen: *slight frown* Okay... I mean, there's always room for improvement. But the equipment is rated for standard field conditions.
    Dr. Chen: I'll repair it. And I'll review the design specs. But be more careful with the gear, alright?
    ~ npc_chen_influence -= 3
#influence_lost:3
    -> mission_hub

=== equipment_upgrade_menu ===
Dr. Chen: *brings up equipment catalog on holographic display*

Dr. Chen: Alright, so here's what's available for your access level:

Dr. Chen: Network infiltration package—improved encryption bypass, faster data extraction.
Dr. Chen: Surveillance countermeasures—better detection avoidance, signal jamming upgrades.
Dr. Chen: Physical security tools—advanced lockpicks, biometric spoofing, RFID cloning.

What interests you?

+ [Network infiltration upgrade]
    Dr. Chen: Good choice. *pulls equipment* This has the latest decryption algorithms. Should shave minutes off your infiltration time.
    Dr. Chen: I'll add it to your loadout. Don't lose this one—it's expensive!
    #equipment_upgraded_network
    ~ professional_reputation += 1
    -> mission_hub

+ [Surveillance countermeasures]
    Dr. Chen: Smart. Staying undetected is half the job. *configures equipment*
    Dr. Chen: This should make you nearly invisible to standard monitoring systems. Field test it and let me know how it performs.
    #equipment_upgraded_surveillance
    ~ professional_reputation += 1
    -> mission_hub

+ [Physical security tools]
    Dr. Chen: The classics, updated. *hands over toolkit*
    Dr. Chen: New biometric spoofer uses quantum randomization—way harder to detect than the old version.
    #equipment_upgraded_physical
    ~ professional_reputation += 1
    -> mission_hub

+ [Ask what they recommend]
    Dr. Chen: *considers your mission profile*
    {
        - current_mission_id() == "ghost_in_machine":
            Dr. Chen: For Ghost Protocol? Definitely the network package. You'll be dealing with sophisticated digital security.
        - else:
            Dr. Chen: Based on your recent missions... I'd say surveillance countermeasures. You're running a lot of infiltration ops.
    }
    Dr. Chen: But it's your call. You know what you need in the field.
    -> equipment_upgrade_menu

=== field_technical_support ===
Dr. Chen: *focused* Okay, I'm pulling up your equipment telemetry. What's the technical issue?

+ [System won't connect to target network]
    Dr. Chen: *checking diagnostics* Hmm, they might be using non-standard protocols. Try cycling through alt-frequencies. Settings menu, third tab.
    Dr. Chen: If that doesn't work, there might be active jamming. I can try remote boost, but it'll make you more detectable.
    -> field_support_followup

+ [Encryption is taking too long]
    Dr. Chen: Yeah, they upgraded their security. Um... *rapid thinking* ...okay, try the quantum bypass. It's experimental but it should work.
    Dr. Chen: Quantum menu, enable fast-mode. Warning: it generates a lot of heat. Don't run it for more than five minutes.
    ~ npc_chen_influence += 5
#influence_gained:5
    -> field_support_followup

+ [Equipment is malfunctioning]
    Dr. Chen: *concerned* Malfunctioning how? Be specific.
    Dr. Chen: Actually, I'm seeing some anomalous readings on my end. Let me try a remote reset... *working*
    Dr. Chen: There. Try now. That should stabilize it.
    -> field_support_followup

=== field_support_followup ===
Dr. Chen: Did that help? Are you good to continue?

+ [Yes, that fixed it. Thanks!]
    Dr. Chen: *relieved* Oh good! Okay, I'll keep monitoring. Call if anything else goes wrong.
    ~ npc_chen_influence += 8
#influence_gained:8
    -> mission_hub

+ [Still having issues]
    Dr. Chen: *more concerned* Okay, this might be a hardware problem. Can you safely abort and extract?
    Dr. Chen: I don't want you stuck in there with malfunctioning equipment. Your safety is more important than the mission.
    ~ npc_chen_influence += 10
#influence_gained:10
    -> mission_hub

=== mission_ghost_equipment_briefing ===
Dr. Chen: *pulls up equipment display with visible excitement*

Dr. Chen: Okay! So for Ghost Protocol, I've prepared some specialized gear. This is actually really cool tech.

Dr. Chen: First—active network camouflage. Makes your digital signature look like normal traffic. You'll blend into their network like you're just another employee.

Dr. Chen: Second—enhanced data exfiltration tools. Faster extraction, better compression, leaves minimal traces.

Dr. Chen: Third—and this is experimental—quantum-encrypted comms. Even if they intercept your transmissions to Haxolottle, they can't decrypt them.

+ [Ask how the network camouflage works]
    Dr. Chen: *launches into technical explanation* ...so basically, it analyzes local traffic patterns and generates fake activity that matches the statistical profile...
    -> ghost_equipment_details

+ [Ask about the risks of experimental tech]
    Dr. Chen: *appreciates the question* Good thinking. The quantum comms are 95% reliable in testing. If they fail, you default to standard encrypted comms.
    Dr. Chen: I've built in fallbacks. Worst case, you lose some capability but not all capability.
    ~ npc_chen_influence += 5
#influence_gained:5
    -> ghost_equipment_details

+ [Express confidence in the tech]
    Dr. Chen: *grins* I'm glad you trust my work! I've tested this extensively. You'll be well-equipped.
    ~ npc_chen_influence += 8
#influence_gained:8
    -> ghost_equipment_details

=== ghost_equipment_details ===
Dr. Chen: Any other questions about the gear? Or are you ready for me to configure your loadout?

+ [More questions about technical specs]
    Dr. Chen: *happily explains more details*
    -> ghost_equipment_details

+ [I'm ready. Configure my loadout.]
    Dr. Chen: Perfect! Give me twenty minutes. I'll have everything calibrated to your biometrics.
    Dr. Chen: *genuine* And hey... be careful out there, okay? I built good equipment, but you're the one taking the risks.
    {npc_chen_influence >= 60:
        Dr. Chen: Come back safe. The tech works better when the operator survives.
        ~ npc_chen_influence += 5
#influence_gained:5
    }
    #equipment_configured
    -> mission_hub

=== mission_ghost_tech_debrief ===
Dr. Chen: *eager for feedback* Okay, tell me everything! How did the equipment perform?

+ [Everything worked perfectly]
    Dr. Chen: *extremely pleased* Yes! That's what I want to hear! The camouflage held up? No detection issues?
    Dr. Chen: This is great data. I can certify this tech for wider deployment now.
    ~ npc_chen_influence += 10
#influence_gained:10
    ~ npc_chen_tech_collaboration += 1
    -> mission_hub

+ [Mostly good, but had some issues with X]
    Dr. Chen: *immediately taking notes* Okay, tell me specifics. What were the exact conditions when the issue occurred?
    You provide detailed feedback.
    Dr. Chen: Perfect. This is exactly the field data I need. I can iterate on the design and fix that problem.
    Dr. Chen: Thank you for the thorough report. Seriously. This makes my job so much easier.
    ~ npc_chen_influence += 15
#influence_gained:15
    ~ npc_chen_tech_collaboration += 2
    -> mission_hub

+ [Honestly, it saved my life]
    Dr. Chen: *becomes emotional* It... really? Tell me what happened.
    You explain how the equipment got you out of a dangerous situation.
    Dr. Chen: *voice cracks slightly* That's... that's why I do this. Building tech that keeps agents safe.
    Dr. Chen: I'm really glad you're okay. And thank you for the feedback. I'll keep improving it.
    ~ npc_chen_influence += 20
#influence_gained:20
    ~ npc_chen_tech_collaboration += 2
    -> mission_hub

=== mission_sanctuary_tech_overview ===
Dr. Chen: *brings up Data Sanctuary schematics*

Dr. Chen: The sanctuary has probably the most sophisticated security architecture SAFETYNET has ever built. Multi-layered, redundant, paranoid design.

Dr. Chen: Physical layer: Biometric access, man-traps, Faraday shielding. Digital layer: Air-gapped systems, quantum encryption, intrusion detection AI.

Dr. Chen: If ENTROPY tries to breach this, they'll need nation-state level capabilities. Which... *worried* ...they might have.

+ [Ask if the defenses are enough]
    Dr. Chen: *honest* Should be. But ENTROPY has surprised us before. That's why we're adding additional measures.
    Dr. Chen: And why agents like you are on standby. Tech is great, but humans adapt in ways systems can't.
    -> mission_hub

+ [Ask what your role will be]
    Dr. Chen: You'll be part of the rapid response team. If ENTROPY attempts intrusion, you'll help counter them.
    Dr. Chen: I'm preparing specialized defensive equipment. Detection tools, countermeasure packages, emergency lockdown access.
    -> mission_hub

+ [Express concern about ENTROPY's capabilities]
    Dr. Chen: *sighs* Yeah, me too. They're getting better. Faster. More sophisticated.
    Dr. Chen: That's why I work late. Every improvement I make might be the difference between holding the line and catastrophic breach.
    ~ npc_chen_influence += 5
#influence_gained:5
    -> mission_hub

=== experimental_tech_discussion ===
Dr. Chen: *absolute enthusiasm* Oh! Okay, so I'm working on some really exciting stuff right now!

Dr. Chen: Project Mirage—adaptive network camouflage that learns from each deployment. Gets better over time.

Dr. Chen: Project Sentinel—predictive threat detection AI. Tries to identify attacks before they happen.

Dr. Chen: Project Fortress—quantum-resistant encryption for critical communications. Future-proofing against quantum computing threats.

Which interests you?

+ [Tell me about Project Mirage]
    -> experimental_mirage_details

+ [Explain Project Sentinel]
    -> experimental_sentinel_details

+ [Describe Project Fortress]
    -> experimental_fortress_details

+ [All of it sounds amazing]
    Dr. Chen: *huge grin* Right?! This is why I love this job. Every project is pushing boundaries!
    ~ npc_chen_influence += 10
#influence_gained:10
    -> mission_hub

=== experimental_mirage_details ===
Dr. Chen: Mirage is about learning adaptation. Current camouflage is static—I configure it, you deploy it.

Dr. Chen: Mirage learns from each mission. Analyzes what worked, what didn't. Automatically improves its disguise algorithms.

Dr. Chen: Eventually, it becomes customized to your specific operational patterns. Personalized stealth.

Dr. Chen: Still in early testing, but the results are promising!

-> experimental_tech_discussion

=== experimental_sentinel_details ===
Dr. Chen: Sentinel is my attempt at precognition through data analysis.

Dr. Chen: It monitors network traffic, security logs, ENTROPY communication patterns. Looks for pre-attack indicators.

Dr. Chen: Not perfect—lots of false positives still. But when it works? We get warning hours before ENTROPY strikes.

Dr. Chen: Could revolutionize our defensive posture if I can refine it.

-> experimental_tech_discussion

=== experimental_fortress_details ===
Dr. Chen: Fortress addresses a scary problem—quantum computers breaking current encryption.

Dr. Chen: When quantum computing becomes widespread, every encrypted message we've ever sent becomes readable. That's terrifying.

Dr. Chen: Fortress uses quantum-resistant mathematics. Should remain secure even against quantum decryption.

Dr. Chen: It's mathematically beautiful and operationally critical.

-> experimental_tech_discussion

=== volunteer_field_testing ===
Dr. Chen: *lights up* You'd really volunteer? Most agents avoid experimental gear!

Dr. Chen: I need field testing data. Lab conditions can't replicate real operational stress.

Dr. Chen: I promise to build in safety margins. Fallback systems. Kill switches. Your safety comes first.

+ [I trust your work. I'll test it.]
    Dr. Chen: *emotional* That trust means everything. Seriously.
    Dr. Chen: I'll prepare test equipment for your next mission. Thorough briefing beforehand. Real-time monitoring during deployment.
    Dr. Chen: We're partners in this. Thank you.
    ~ npc_chen_influence += 20
#influence_gained:20
    ~ npc_chen_tech_collaboration += 3
    -> mission_hub

+ [What would I be testing specifically?]
    Dr. Chen: Depends on your next mission profile. Probably the adaptive camouflage or improved detection tools.
    Dr. Chen: Nothing that could catastrophically fail. Just new features that need validation.
    -> volunteer_field_testing

+ [Maybe next time]
    Dr. Chen: No pressure! Experimental testing should always be voluntary. But if you change your mind, let me know!
    -> mission_hub

=== technical_training_discussion ===
Dr. Chen: Technical training! I love teaching!

Dr. Chen: What interests you? Network security? Hardware hacking? Cryptography? Sensor systems?

+ [Network security]
    Dr. Chen: Excellent choice. Understanding networks makes you better at infiltrating them.
    Dr. Chen: I can run you through penetration testing, protocol analysis, intrusion detection...
    ~ professional_reputation += 2
    #training_scheduled_network
    -> mission_hub

+ [Hardware hacking]
    Dr. Chen: Oh, fun! Physical access to systems. Let me teach you about circuit analysis, firmware exploitation, hardware implants...
    ~ professional_reputation += 2
    #training_scheduled_hardware
    -> mission_hub

+ [Cryptography]
    Dr. Chen: *very excited* My specialty! I can teach you encryption theory, code-breaking techniques, quantum cryptography basics...
    ~ professional_reputation += 2
    ~ npc_chen_influence += 5
#influence_gained:5
    #training_scheduled_crypto
    -> mission_hub

+ [Just make me better at my job]
    Dr. Chen: *grins* I can do that. Let me design a custom training program based on your recent missions.
    Dr. Chen: I'll mix practical skills with theoretical knowledge. Make you a more effective operator.
    ~ professional_reputation += 3
    -> mission_hub

