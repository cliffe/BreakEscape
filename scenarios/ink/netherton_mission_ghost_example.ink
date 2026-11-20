// ===========================================
// NETHERTON - GHOST IN THE MACHINE MISSION
// Break Escape Universe
// ===========================================
// Mission-specific dialogue for Ghost in the Machine operation
// This is an EXAMPLE showing how mission-specific files work
// Each mission can have its own file per NPC
// ===========================================

// Mission-specific variables (would be in global space or mission-specific save data)
VAR ghost_mission_briefed = false
VAR ghost_mission_active = false
VAR ghost_mission_complete = false
VAR ghost_player_asked_about_stakes = false
VAR ghost_player_requested_tactical_advice = false

// ===========================================
// MISSION BRIEFING
// Called from netherton_hub.ink
// ===========================================

=== ghost_briefing ===
Netherton: *activates secure display showing power grid infrastructure*

Netherton: Operation: Ghost in the Machine. Codename reflects the nature of the threat—ENTROPY has embedded malicious code into control systems that manage critical infrastructure.

Netherton: Target: Midwest Regional Power Coordination Center. ENTROPY has infiltrated their operational technology network and installed a persistent backdoor.

Netherton: *highlights affected regions on map*

Netherton: If activated, this backdoor grants ENTROPY control over power distribution for three states. Hospitals. Emergency services. Data centers. Millions of lives depend on stable power.

~ ghost_mission_briefed = true

* [Ask about strategic importance]
    Netherton: Strategic importance is severe. ENTROPY gains leverage over critical infrastructure. They could trigger cascading failures. Hold populations hostage. Create chaos that serves their ideology.
    Netherton: We cannot allow that capability to remain in hostile hands. This operation is defensive priority one.
    ~ ghost_player_asked_about_stakes = true
    -> ghost_briefing

* [Ask about tactical considerations]
    Netherton: Tactical complexity is high. The facility has both physical security—guards, surveillance, access controls—and digital monitoring—intrusion detection, network analysis.
    Netherton: You must bypass both simultaneously. Physical infiltration without digital signature. Digital operations without physical detection.
    Netherton: Dr. Chen has prepared specialized equipment. Active network camouflage will mask your digital presence. But you'll need sound tradecraft for physical infiltration.
    ~ ghost_player_requested_tactical_advice = true
    -> ghost_briefing

* [Ask about the intelligence source]
    Netherton: *slight hesitation*
    Netherton: Intelligence derived from signals intercept and human source reporting. Reliability assessed as high. But not perfect.
    Netherton: You should assume the intelligence is directionally accurate. Specific details may vary. Maintain operational flexibility.
    -> ghost_briefing

* [Ask about rules of engagement]
    Netherton: Rules of engagement: Non-lethal unless absolutely necessary for self-defense. This is a stealth operation. Violence creates complications.
    Netherton: Facility personnel are civilians. They are not ENTROPY. They are unaware their systems have been compromised. Treat them as innocents.
    Netherton: Your target is the ENTROPY backdoor code. Not the people who work there.
    ~ npc_netherton_respect += 5
    -> ghost_briefing

* [Ask about extraction plan]
    Netherton: Extraction follows standard protocols. Complete objective, egress quietly using planned route. Haxolottle will coordinate transportation.
    Netherton: If compromised: Protocol 7 authorizes emergency extraction. Three prepared waypoints. Haxolottle has the coordinates.
    Netherton: *firm look* I would prefer you complete this operation quietly. Burned operations create cascading problems. But your safety takes priority over operational security.
    {npc_netherton_respect >= 70:
        Netherton: *rare vulnerability* I'd rather you come back safe with a failed mission than not come back at all.
        ~ npc_netherton_respect += 5
    }
    -> ghost_briefing

* {ghost_player_asked_about_stakes and ghost_player_requested_tactical_advice} [I'm ready to proceed. Assign the mission.]
    Netherton: *slight nod of approval*
    Netherton: Mission assigned. *hands over classified mission packet*
    Netherton: Review operational details thoroughly. Brief with Dr. Chen for equipment familiarization. Coordinate timing with Haxolottle.
    Netherton: Agent {player_name}—*direct eye contact*—you're one of our most capable operators. That's why you're receiving this assignment.
    {npc_netherton_respect >= 80:
        Netherton: *almost warm* I have confidence in your abilities. Execute this mission with the excellence you've consistently demonstrated.
    - npc_netherton_respect >= 60:
        Netherton: Execute this cleanly. Demonstrate the operational skill I expect from agents of your caliber.
    - else:
        Netherton: Complete the mission. Maintain operational standards.
    }

    Netherton: Dismissed. Begin preparation.

    ~ ghost_mission_active = true
    ~ professional_reputation += 2
    #mission_ghost_assigned
    -> END

* [This seems like high-pressure assignment]
    Netherton: *doesn't soften*
    Netherton: It is high pressure. All our assignments carry weight. This particular operation has severe consequences for failure.
    Netherton: That's why I'm assigning it to you. You've proven capable of handling pressure. This is not beyond your abilities.
    {npc_netherton_respect >= 70:
        Netherton: *slight reassurance* I would not assign you a mission I believed you couldn't complete. Trust your training. Trust your capabilities.
        ~ npc_netherton_respect += 5
    }
    -> ghost_briefing

// ===========================================
// TACTICAL SUPPORT DURING MISSION
// Called from netherton_hub.ink when mission is active
// ===========================================

=== ghost_tactical_support ===
Netherton: *monitoring your position on tactical display*

Netherton: Agent {player_name}, I have your location. What do you need?

* [Request permission to deviate from infiltration plan]
    Netherton: Explain the deviation and tactical justification.

    ** [Explain that security patterns changed]
        Netherton: *considers* Security adaptation is expected. If original route is compromised, alternate approach is reasonable.
        Netherton: Granted. Use tactical judgment. Haxolottle will adjust monitoring based on new route.
        ~ npc_netherton_respect += 5
        #deviation_approved
        -> ghost_tactical_support

    ** [Explain that you found better approach]
        Netherton: *evaluates*
        {npc_netherton_respect >= 70:
            Netherton: Your field assessment carries weight. If you've identified superior approach, I trust your judgment.
        - else:
            Netherton: Explain why your approach is superior to planned method.
        }
        Netherton: Approved. Execute your plan. Report results.
        ~ npc_netherton_respect += 8
        #alternate_approach_approved
        -> ghost_tactical_support

    ** [Explain that situation is more dangerous than expected]
        Netherton: *concerned* How much more dangerous? Assess risk level.
        Netherton: If deviation reduces risk while maintaining mission viability, approved. If risk exceeds acceptable parameters, consider abort.
        Netherton: Your safety matters, Agent. Make the call.
        ~ npc_netherton_respect += 10
        -> ghost_tactical_support

* [Request emergency extraction]
    Netherton: *immediately alert* Situation report. Are you compromised?

    ** [Yes, position is compromised]
        Netherton: *rapid coordination* Extraction authorized. Proceed to waypoint Charlie immediately. Haxolottle is scrambling pickup.
        Netherton: Evade pursuit. Maintain comms if possible. We're getting you out.
        #emergency_extraction_authorized
        -> END

    ** [Not compromised but mission parameters exceeded]
        Netherton: *assessing* Understood. Operational assessment indicating abort?
        Netherton: Extraction authorized. Mission can be re-attempted with adjusted parameters. Agent safety is priority.
        {npc_netherton_respect >= 70:
            Netherton: Good call recognizing when to withdraw. Better to extract safely than push beyond limits.
            ~ npc_netherton_respect += 10
        }
        #tactical_abort_authorized
        -> END

    ** [Equipment failure requiring extraction]
        Netherton: Dr. Chen is monitoring your channel. Stand by.
        Netherton: *to Chen* Can you remote-diagnose the failure?
        // This would integrate with Chen's systems
        Netherton: If equipment cannot be restored, extraction is authorized. Decision is yours, Agent.
        -> ghost_tactical_support

* [Request real-time intel update]
    Netherton: *checks multiple feeds*
    Netherton: Current intel: [describes security status, ENTROPY activity, facility operations]
    Netherton: Haxolottle reports: [provides handler assessment]
    Netherton: Recommended action: [tactical suggestion]
    Netherton: Questions?
    -> ghost_tactical_support

* [Report mission objective complete]
    Netherton: *verification* Confirm: ENTROPY backdoor has been neutralized? Evidence captured?

    ** [Confirm objective complete]
        Netherton: Excellent. Begin exfiltration using planned route. Haxolottle will guide egress.
        {npc_netherton_respect >= 80:
            Netherton: *rare approval* Outstanding work, Agent. Textbook execution.
        - npc_netherton_respect >= 60:
            Netherton: Well done. Proceed to extraction point.
        - else:
            Netherton: Acknowledged. Extract.
        }
        ~ ghost_mission_complete = true
        ~ npc_netherton_respect += 15
        #mission_objective_complete
        -> END

    ** [Objective complete but complications occurred]
        Netherton: Elaborate on complications.
        // Would branch based on specific complications
        Netherton: Understood. Exfiltrate. We'll debrief complications after you're secure.
        ~ ghost_mission_complete = true
        ~ npc_netherton_respect += 10
        #mission_complete_with_complications
        -> END

* [Just checking in, all nominal]
    Netherton: *brief acknowledgment* Acknowledged. Operational tempo is solid. Continue mission.
    {npc_netherton_respect >= 60:
        Netherton: You're performing well. Maintain current approach.
        ~ npc_netherton_respect += 3
    }
    -> END

// ===========================================
// MISSION DEBRIEF
// Called from netherton_hub.ink after mission completion
// ===========================================

=== ghost_debrief ===
Netherton: *mission after-action review display active*

Netherton: Agent {player_name}. Debrief for Operation Ghost in the Machine.

Netherton: Mission outcome: {ghost_mission_complete: Success | Failure}. ENTROPY backdoor status: {ghost_mission_complete: Neutralized | Remains active}.

{ghost_mission_complete:
    Netherton: Your operational execution was {npc_netherton_respect >= 85: exemplary | npc_netherton_respect >= 70: highly competent | npc_netherton_respect >= 55: satisfactory | adequate}.

    Netherton: The facility's power grid control systems have been secured. ENTROPY's capability to trigger cascading failures has been eliminated.

    Netherton: Dr. Chen is analyzing the technical data you extracted. Initial assessment indicates this backdoor was part of a larger ENTROPY infrastructure campaign.

    {npc_netherton_respect >= 80:
        Netherton: *genuine approval* This is exactly the kind of operational performance SAFETYNET requires. You executed under pressure, adapted to complications, and achieved mission objectives without compromise.
        ~ npc_netherton_respect += 15
    - npc_netherton_respect >= 65:
        Netherton: Solid work. Mission objectives achieved. Some aspects could be refined in future operations, but overall performance meets standards.
        ~ npc_netherton_respect += 10
    - else:
        Netherton: Adequate performance. Mission complete. There are areas for improvement we'll address in training.
        ~ npc_netherton_respect += 5
    }

    ~ professional_reputation += 5
    ~ total_missions_completed += 1

- else:
    Netherton: Mission did not achieve primary objectives. ENTROPY backdoor remains in place. This is... disappointing.

    Netherton: However, you exfiltrated safely. Equipment and personnel are recoverable. Mission can be re-attempted.

    {npc_netherton_respect >= 60:
        Netherton: The fact that you recognized when to abort shows sound judgment. Better to withdraw safely than to force failure into catastrophe.
        ~ npc_netherton_respect += 5
    - else:
        Netherton: We'll analyze what went wrong. Identify lessons learned. Prepare for second attempt.
    }
}

* [Request detailed feedback on performance]
    Netherton: *pulls up performance analysis*

    Netherton: Technical execution: {npc_netherton_respect >= 75: Excellent | npc_netherton_respect >= 60: Competent | Needs improvement}. You demonstrated {npc_netherton_respect >= 70: strong | adequate} tradecraft.

    Netherton: Decision-making under pressure: {npc_netherton_respect >= 75: Sound judgment consistently applied | npc_netherton_respect >= 60: Generally solid with minor questionable calls | Requires development}.

    Netherton: Adaptation to complications: {npc_netherton_respect >= 75: Excellent flexibility and problem-solving | npc_netherton_respect >= 60: Adequate adaptation | Struggled with unexpected variables}.

    {npc_netherton_respect >= 70:
        Netherton: Areas for continued development: [specific constructive feedback]
        Netherton: But overall, this was strong work. Continue this trajectory.
        ~ npc_netherton_respect += 5
    - else:
        Netherton: Areas requiring improvement: [specific critical feedback]
        Netherton: Focus on these elements in training. Standards must be maintained.
    }
    -> ghost_debrief

* [Ask about the larger ENTROPY campaign]
    Netherton: *brings up classified intelligence display*

    Netherton: The backdoor you neutralized is consistent with ENTROPY's "Infrastructure Compromise Initiative"—their term, intercepted from communications.

    Netherton: They're embedding persistent access in critical systems across multiple sectors. Power. Water. Communications. Transportation.

    Netherton: Your operation denied them one attack vector. But the campaign continues. This is long-term conflict.

    {npc_netherton_respect >= 70:
        Netherton: *rare transparency* Which is why operatives like you are critical. Every operation you complete successfully degrades ENTROPY's capabilities.
        Netherton: The work matters. You matter. Remember that.
        ~ npc_netherton_respect += 8
    }
    -> ghost_debrief

* [Ask about next assignment]
    Netherton: *approves the professional focus*

    Netherton: Take seventy-two hours recovery time. Regulation 412—mandatory rest after high-stress operations.

    Netherton: After recovery period, report for next assignment briefing. I have several operations in development. Your performance on Ghost Protocol will inform assignment selection.

    {npc_netherton_respect >= 75:
        Netherton: Given your demonstrated capabilities, I'm considering you for increasingly complex operations. Keep performing at this level.
        ~ professional_reputation += 2
    }
    -> ghost_debrief

* {ghost_mission_complete} [This mission felt significant. Thank you for the assignment.]
    Netherton: *slight surprise at the personal acknowledgment*

    {npc_netherton_respect >= 70:
        Netherton: You're welcome. Though the gratitude should flow both directions—you executed excellently.
        Netherton: Assigning capable agents to critical missions is easy. Having agents who justify that confidence is rarer.
        ~ npc_netherton_respect += 10
        ~ npc_netherton_personal_moments += 1
    - else:
        Netherton: *formal* Assignment is based on operational requirements and agent capabilities. You met requirements. That's sufficient.
    }
    -> ghost_debrief

* [Request time for personal decompression]
    Netherton: *approves immediately*

    Netherton: Granted. High-stress operations take psychological toll. Take the time you need.

    {npc_netherton_respect >= 65:
        Netherton: *rare concern* Regulation 299 requires self-care. If you need counseling services, they're available. No judgment. No impact on operational status.
        Netherton: I've used them myself after difficult operations. It helps.
        ~ npc_netherton_respect += 8
        ~ npc_netherton_personal_moments += 1
    }

    Netherton: Report when you're ready for next assignment. Not before.
    -> ghost_debrief

* [That will be all, Director.]
    Netherton: *nods*

    {ghost_mission_complete and npc_netherton_respect >= 75:
        Netherton: Excellent work on this operation, Agent {player_name}. *almost warm* Truly excellent.
        Netherton: Dismissed. Take your recovery time. Return ready for the next challenge.
    - ghost_mission_complete:
        Netherton: Dismissed. Review the operational lessons learned. Apply them to future assignments.
    - else:
        Netherton: We'll revisit this mission. Learn from what went wrong. Dismissed.
    }

    #debrief_complete
    -> END

=== END
