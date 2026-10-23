// ===========================================
// Mission 5: "Insider Trading" - Opening Briefing
// Act 1: Interactive Cutscene
// ===========================================

// Variables for tracking player choices
VAR player_approach = ""          // cautious, aggressive, diplomatic
VAR mission_priority = ""          // thoroughness, speed, stealth
VAR knows_full_stakes = false      // Did player ask about casualties?
VAR knows_insider_profile = false  // Did player ask about insider psychology?
VAR handler_trust = 50            // Agent 0x99's confidence (0-100)

// External variables (set by game)
EXTERNAL player_name

// ===========================================
// OPENING
// ===========================================

=== start ===
#speaker:agent_0x99

{player_name}, we have a critical situation developing.

Quantum Dynamics Corporation in San Francisco. Quantum cryptography research for the Department of Defense.

Someone on the inside is stealing it.

+ [How much has been compromised?]
    ~ handler_trust += 5
    You: What's the damage so far?
    -> damage_assessment

+ [What's the timeline?]
    You: How much time do we have?
    -> timeline_urgency

+ [I'm ready. What's the mission?]
    ~ handler_trust += 10
    ~ player_approach = "direct"
    You: Give me the objectives. I'll handle it.
    Agent 0x99: Good. Let's get straight to it.
    -> mission_objectives

=== damage_assessment ===
#speaker:agent_0x99

Agent 0x99: 4.2 terabytes of classified quantum cryptography research.

Agent 0x99: 73% already exfiltrated. The rest goes out this weekend if we don't stop it.

+ [What exactly was stolen?]
    -> stolen_data_details

+ [Who's buying this data?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Continue]
    -> mission_objectives

=== timeline_urgency ===
#speaker:agent_0x99

Agent 0x99: Final exfiltration scheduled for this weekend.

Agent 0x99: Once the data reaches ENTROPY's network, it gets sold to foreign governments within 48 hours.

~ knows_full_stakes = true

+ [What happens if they sell it?]
    -> buyers_and_stakes

+ [I understand the urgency]
    -> mission_objectives

=== stolen_data_details ===
#speaker:agent_0x99

Agent 0x99: Quantum key distribution protocols. Military-grade encryption specs.

Agent 0x99: 14 zero-day vulnerabilities in competitor systems. DoD facility deployment schedules.

Agent 0x99: Everything needed to compromise US quantum cryptography for the next decade.

+ [Who's the buyer?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Continue]
    -> mission_objectives

=== buyers_and_stakes ===
#speaker:agent_0x99

Agent 0x99: Chinese MSS. Russian GRU. Iranian IRGC.

Agent 0x99: Expected sale price: $68 million.

{not knows_full_stakes:
    ~ knows_full_stakes = true
}

Agent 0x99: NSA's estimate? 12 to 40 intelligence officers compromised if this data gets out.

Agent 0x99: Real people. Real casualties.

+ [We have to stop this]
    ~ handler_trust += 5
    You: Then let's not let that happen.
    -> mission_objectives

+ [What's the mission?]
    -> mission_objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent 0x99: Your objectives:

Agent 0x99: One - Identify the insider. Quantum Dynamics' CSO narrowed it to 8 suspects in the cryptography division.

Agent 0x99: Two - Gather evidence. We need proof for prosecution or leverage for turning them.

+ [Turning them?]
    -> turning_explanation

+ [What's the third objective?]
    -> third_objective

=== turning_explanation ===
#speaker:agent_0x99

Agent 0x99: ENTROPY's Insider Threat Initiative has 23 active placements. 47 more targets under evaluation.

Agent 0x99: If we can turn this insider into a double agent, we map their entire network.

~ knows_insider_profile = true

Agent 0x99: Three - Stop the final exfiltration. Prevent that last 27% from leaving the building.

+ [How do I get inside?]
    -> cover_story

+ [What if the insider won't cooperate?]
    -> non_cooperation

=== third_objective ===
#speaker:agent_0x99

Agent 0x99: Three - Stop the final exfiltration. Prevent that last 27% from leaving.

+ [What's my cover?]
    -> cover_story

+ [Tell me about turning the insider]
    -> turning_explanation

=== non_cooperation ===
#speaker:agent_0x99

Agent 0x99: Then you arrest them. Standard espionage charges.

{not knows_insider_profile:
    Agent 0x99: But understand - ENTROPY targets vulnerable people. Financial desperation, ideological manipulation.
    ~ knows_insider_profile = true
}

Agent 0x99: The real enemy is ENTROPY. The insider might be a victim too.

+ [I'll make the call when I see the situation]
    ~ player_approach = "diplomatic"
    ~ handler_trust += 5
    -> cover_story

+ [Justice is justice. They made their choice]
    ~ player_approach = "aggressive"
    -> cover_story

// ===========================================
// COVER STORY & ENTRY
// ===========================================

=== cover_story ===
#speaker:agent_0x99

Agent 0x99: You're going in as an external security consultant. SAFETYNET cover identity.

Agent 0x99: Chief Security Officer Patricia Morgan is expecting you. Former Marine, 15 years FBI Cyber Division.

Agent 0x99: She'll provide access, but corporate politics are... tense. CEO wants this handled quietly.

+ [Understood. Any other contacts?]
    -> npc_briefing

+ [What resources do I have?]
    -> resources_briefing

=== npc_briefing ===
#speaker:agent_0x99

Agent 0x99: Dr. Sarah Chen leads the cryptography team. Brilliant scientist, protective of her people.

Agent 0x99: Kevin Park - IT systems administrator. He's your best bet for technical access. Build rapport.

Agent 0x99: Lisa Park in marketing might have useful intel. She's observant about office dynamics.

+ [Got it. What about equipment?]
    -> resources_briefing

+ [I'm ready to begin]
    -> mission_approach

=== resources_briefing ===
#speaker:agent_0x99

Agent 0x99: Standard kit - lockpicks, RFID cloner, CyberChef workstation for decoding evidence.

Agent 0x99: We've also set up a drop-site terminal in the server room. Secure channel for submitting intelligence.

{knows_insider_profile:
    Agent 0x99: The insider uses a personal Bludit CMS server for ENTROPY communications. Exploit it and you'll find evidence.
- else:
    Agent 0x99: Intel suggests the insider uses encrypted dead drops. Find their method and exploit it.
    ~ knows_insider_profile = true
}

+ [Bludit CMS? I can work with that]
    You: CVE-2019-16113. Directory traversal, auth bypass.
    Agent 0x99: Exactly. Four flags hidden in that server. Get them all.
    -> mission_approach

+ [I'll figure out their communication method]
    -> mission_approach

// ===========================================
// MISSION APPROACH - CRITICAL CHOICE
// ===========================================

=== mission_approach ===
#speaker:agent_0x99

Agent 0x99: Final question - how are you approaching this?

+ [Careful and thorough. Investigation takes time]
    ~ player_approach = "cautious"
    ~ mission_priority = "thoroughness"
    You: I'll be methodical. Document everything, interview everyone.
    Agent 0x99: Smart. This is a puzzle, not a raid. Take your time.
    -> final_instructions

+ [Fast and direct. Stop that exfiltration]
    ~ player_approach = "aggressive"
    ~ mission_priority = "speed"
    You: Identify the insider, stop the upload, get out.
    Agent 0x99: Speed is good. But don't miss critical evidence.
    -> final_instructions

+ [Adaptive. I'll read the situation on site]
    ~ player_approach = "diplomatic"
    ~ mission_priority = "stealth"
    ~ handler_trust += 5
    You: I'll adapt based on what I find. Flexibility is key.
    Agent 0x99: Good instincts. Trust your judgment.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS & DEPLOYMENT
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

{knows_full_stakes:
    Agent 0x99: Remember - 12 to 40 lives depend on this mission.
}

{player_approach == "cautious":
    Agent 0x99: Your methodical approach should serve you well. But watch the clock.
}
{player_approach == "aggressive":
    Agent 0x99: Move fast, but don't compromise the investigation. We need solid evidence.
}
{player_approach == "diplomatic":
    Agent 0x99: Adapt as needed. The insider might surprise you - be ready for anything.
}

Agent 0x99: I'll be available by phone. Report findings, request guidance, submit VM flags to the drop-site.

+ [Any last advice?]
    -> last_advice

+ [I'm ready to deploy]
    -> deployment

=== last_advice ===
#speaker:agent_0x99

Agent 0x99: Yeah - don't assume you know the insider's story until you see all the evidence.

{knows_insider_profile:
    Agent 0x99: ENTROPY weaponizes suffering. Remember that.
}

Agent 0x99: And {player_name}? Good luck.

-> deployment

=== deployment ===
#speaker:agent_0x99

Agent 0x99: Quantum Dynamics, San Francisco. Wednesday afternoon, 4:30 PM.

Agent 0x99: Final exfiltration scheduled Friday night. You have 48 hours.

Agent 0x99: Go get them.

[Visual: Fade to Quantum Dynamics corporate lobby]

#complete_task:receive_mission_briefing
#start_gameplay
-> END
