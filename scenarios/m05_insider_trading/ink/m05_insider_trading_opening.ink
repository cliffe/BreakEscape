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
VAR player_name = "Agent 0x00"

// ===========================================
// OPENING
// ===========================================

=== start ===
// Playtest D4: briefing_played is set the moment this cutscene opens
// (setGlobalOnStart, npc-manager.js:1273-1277), so the task completes here
// too, not only on the last line. An early close or a reload mid-briefing
// no longer strands it.
#complete_task:receive_mission_briefing
Narrator: A SAFETYNET briefing room. Director Netherton stands at the head of the table. Beside him, a man in a lab coat -- the service's own insider-threat specialist -- has three monitors of access logs open.

Director Magnus Netherton: Agent 0x00. This one is close to home in a way I dislike. Someone inside a Home Office contractor is handing the crown jewels to ENTROPY. I've brought Nightshade in because catching a mole is precisely his trade -- learn from him. HaX will run you on the ground.

Agent 0x47 'Nightshade': Insiders are easy to romanticise and hard to catch, because they don't break in -- they're already trusted. You don't hunt the break-in. You hunt the pattern: the access that's a little too broad, the hours that are a little too odd, the calm of someone who's decided the rules don't apply to them. Find whose behaviour stopped matching their story.

Director Magnus Netherton: Sound advice. HaX -- the detail.

#speaker:agent_0x99

Agent HaX: {player_name}, we have a situation developing.

Agent HaX: Quantum Dynamics Corporation, on a science park outside Cambridge. Quantum-safe cryptography, under contract to the Home Office.

Agent HaX: Someone on the inside is stealing it.

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
    Agent HaX: Good. Let's get straight to it.
    -> mission_objectives

=== damage_assessment ===
#speaker:agent_0x99

Agent HaX: Project Heisenberg. Quantum-safe key material for the National Emergency-Services Dispatch Network. The system that routes 999 calls.

Agent HaX: 73% of the package is already staged for exfiltration. The rest goes out within four hours if we don't stop it.

+ [What exactly was stolen?]
    -> stolen_data_details

+ [Who's this going to?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Walk me through the objectives.]
    -> mission_objectives

=== timeline_urgency ===
#speaker:agent_0x99

Agent HaX: Final exfiltration scheduled within four hours.

Agent HaX: Once ENTROPY has the full package, they keep it and use it themselves. Nobody is selling this on.

~ knows_full_stakes = true

+ [What do they want it for?]
    -> buyers_and_stakes

+ [I understand the urgency]
    -> mission_objectives

=== stolen_data_details ===
#speaker:agent_0x99

Agent HaX: Lattice-based key exchange parameters. The production candidate set.

Agent HaX: And the rollout schedule: phased cutover dates, region by region, including the key-rotation windows.

Agent HaX: Everything ENTROPY needs to compromise the dispatch network the moment it goes live.

+ [Why does ENTROPY want the dispatch network?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Walk me through the objectives.]
    -> mission_objectives

=== buyers_and_stakes ===
#speaker:agent_0x99

Agent HaX: No foreign buyer. ENTROPY's Insider Threat Initiative is acquiring it and keeping it.

Agent HaX: If they hold the key material during a rotation window, they can force the dispatch network onto a degraded routing path. Every ambulance, fire and police call routed through it runs six to eleven minutes slower.

{not knows_full_stakes:
    ~ knows_full_stakes = true
}

Agent HaX: Early modelling: thirty to forty-five excess civilian deaths in the first rollout wave. Cardiac arrests. Strokes. Structure fires. The calls where minutes decide it.

Agent HaX: Real people. The ones who call 999 and wait.

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

Agent HaX: Your objectives:

Agent HaX: One - Identify the insider. Quantum Dynamics' security chief has narrowed it to eight people in the cryptography division.

Agent HaX: Two - Gather evidence. Enough that the police can act on it when we hand it over anonymously, or enough leverage to turn them.

+ [Turning them?]
    -> turning_explanation

+ [What's the third objective?]
    -> third_objective

=== turning_explanation ===
#speaker:agent_0x99

Agent HaX: ENTROPY's Insider Threat Initiative runs on a recruiter: a handler working behind a headhunting firm. 23 active placements. 47 more targets under evaluation.

Agent HaX: If we can turn this insider into a double agent, we map their entire network.

~ knows_insider_profile = true

Agent HaX: Three - Stop the final upload. That last 27% doesn't leave the building.

+ [How do I get inside?]
    -> cover_story

+ [What if the insider won't cooperate?]
    -> non_cooperation

=== third_objective ===
#speaker:agent_0x99

Agent HaX: Three - Stop the final exfiltration. Prevent that last 27% from leaving.

+ [What's my cover?]
    -> cover_story

+ [Tell me about turning the insider]
    -> turning_explanation

=== non_cooperation ===
#speaker:agent_0x99

Agent HaX: Then you hold them and hand them to the client's security chief. She calls the police. We have no badge, {player_name}; what happens to them after that isn't ours to decide.

{not knows_insider_profile:
    Agent HaX: But understand - ENTROPY targets vulnerable people. Financial desperation, ideological manipulation.
    ~ knows_insider_profile = true
}

Agent HaX: The real enemy is ENTROPY. The insider might be a victim too.

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

Agent HaX: You're going in as an external security consultant. SAFETYNET cover identity.

Agent HaX: Chief Security Officer Patricia Morgan is expecting you. Ex-military police, fifteen years at the National Crime Agency. She called us in.

Agent HaX: She'll get you in the door, but the politics are tense. The CEO wants this handled quietly.

+ [Understood. Any other contacts?]
    -> npc_briefing

+ [What resources do I have?]
    -> resources_briefing

=== npc_briefing ===
#speaker:agent_0x99

Agent HaX: Dr. Sarah Chen leads the cryptography team. Brilliant scientist, protective of her people.

Agent HaX: Kevin Park - IT systems administrator. He's your best bet for technical access. Build rapport.

Agent HaX: Lisa Park in marketing might have useful intel. She's observant about office dynamics.

+ [Got it. What about equipment?]
    -> resources_briefing

+ [I'm ready to begin]
    -> mission_approach

=== resources_briefing ===
#speaker:agent_0x99

Agent HaX: Not much, and that's deliberate. A security auditor can't walk a pick kit through reception. Anything you need, you source on site. Kevin Park in IT is your best bet.

Agent HaX: We've set up a drop-site terminal in the server room. Secure channel for submitting what you pull off their systems.

Agent HaX: Their research portal runs Bludit. Whatever the insider is staging, it's going through that box.

+ [Bludit? I can work with that.]
    You: Bludit. There's a known upload flaw, but it needs a login first.
    Agent HaX: Then find the login. Four flags on that server. Get them all.
    -> mission_approach

+ [I'll figure out their communication method]
    -> mission_approach

// ===========================================
// MISSION APPROACH - CRITICAL CHOICE
// ===========================================

=== mission_approach ===
#speaker:agent_0x99

Agent HaX: Final question - how are you approaching this?

+ [Careful and thorough. Investigation takes time]
    ~ player_approach = "cautious"
    ~ mission_priority = "thoroughness"
    You: I'll be methodical. Document everything, interview everyone.
    Agent HaX: Smart. This is a puzzle, not a raid. Take your time.
    -> final_instructions

+ [Fast and direct. Stop that exfiltration]
    ~ player_approach = "aggressive"
    ~ mission_priority = "speed"
    You: Identify the insider, stop the upload, get out.
    Agent HaX: Speed is good. But don't miss critical evidence.
    -> final_instructions

+ [Adaptive. I'll read the situation on site]
    ~ player_approach = "diplomatic"
    ~ mission_priority = "stealth"
    ~ handler_trust += 5
    You: I'll adapt based on what I find. Flexibility is key.
    Agent HaX: Good instincts. Trust your judgement.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS & DEPLOYMENT
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

{knows_full_stakes:
    Agent HaX: Remember - thirty to forty-five lives depend on this mission. Civilians, not officers.
}

{player_approach == "cautious":
    Agent HaX: Your methodical approach should serve you well. But watch the clock.
}
{player_approach == "aggressive":
    Agent HaX: Move fast, but don't compromise the investigation. We need solid evidence.
}
{player_approach == "diplomatic":
    Agent HaX: Adapt as needed. The insider might surprise you - be ready for anything.
}

Agent HaX: I'll be available by phone. Report findings, request guidance, submit VM flags to the drop-site.

+ [Any last advice?]
    -> last_advice

+ [I'm ready to deploy]
    -> deployment

=== last_advice ===
#speaker:agent_0x99

Agent HaX: Yeah - don't assume you know the insider's story until you see all the evidence.

{knows_insider_profile:
    Agent HaX: ENTROPY weaponises suffering. Remember that.
}

Agent HaX: And {player_name}? Good luck.

-> deployment

=== deployment ===
#speaker:agent_0x99

Agent HaX: Quantum Dynamics. Wednesday afternoon, half past four.

Agent HaX: The final upload goes tonight. You have four hours.

// PASS 2: player_approach, knows_full_stakes and handler_trust are scenario
// globals, so every `~` assignment above already reached gameState through
// the variable observer. The old #set_global tags with {braces} were
// redundant and relied on dynamic tags.
#complete_task:receive_mission_briefing
Agent HaX: Go get them.
-> END
