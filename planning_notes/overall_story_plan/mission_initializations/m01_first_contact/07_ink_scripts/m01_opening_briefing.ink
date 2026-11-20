// ================================================
// Mission 1: First Contact - Opening Briefing
// Act 1: Interactive Cutscene
// Agent 0x99 "Haxolottle" briefs Agent 0x00
// ================================================

// Variables for tracking player choices
VAR player_approach = ""          // cautious, confident, adaptable
VAR asked_about_stakes = false
VAR asked_about_entropy = false
VAR asked_about_cover = false
VAR mission_accepted = false

// External variables
EXTERNAL player_name

// ================================================
// START: BRIEFING BEGINS
// ================================================

=== start ===
Agent 0x99: {player_name}, thanks for getting here on short notice.

Agent 0x99: We have a situation developing at Viral Dynamics Media.

+ [What's the situation?]
    -> briefing_threat
+ [I'm ready. What's the mission?]
    ~ player_approach = "confident"
    -> briefing_threat
+ [How urgent is this?]
    ~ asked_about_stakes = true
    -> urgency_explanation

// ================================================
// URGENCY EXPLANATION
// ================================================

=== urgency_explanation ===
Agent 0x99: ENTROPY's Social Fabric cell is operating inside Viral Dynamics right now.

Agent 0x99: They're running disinformation campaigns targeting the upcoming election.

-> briefing_threat

// ================================================
// THREAT BRIEFING
// ================================================

=== briefing_threat ===
Agent 0x99: Social Fabric specializes in information manipulation—narrative control, social engineering at scale.

Agent 0x99: They've infiltrated Viral Dynamics as employees. We don't know how many operatives, but we've identified at least one.

+ [Who's the target operative?]
    -> operative_identity
+ [What are they trying to accomplish?]
    ~ asked_about_entropy = true
    -> entropy_objectives
+ [What's at stake if they succeed?]
    ~ asked_about_stakes = true
    -> stakes_explanation

// ================================================
// OPERATIVE IDENTITY
// ================================================

=== operative_identity ===
Agent 0x99: Derek Lawson. Senior Marketing Manager at Viral Dynamics.

Agent 0x99: Perfect cover—his job is literally manipulating narratives for clients.

+ [How long has he been there?]
    -> infiltration_timeline
+ [What's my objective?]
    -> mission_objectives

=== infiltration_timeline ===
Agent 0x99: Three months. Long enough to install backdoors, build trust, map the organization.

Agent 0x99: He's not just stealing data—he's weaponizing the company's media distribution network.

+ [What's my objective?]
    -> mission_objectives
+ [What happens if they succeed?]
    ~ asked_about_stakes = true
    -> stakes_explanation

// ================================================
// ENTROPY OBJECTIVES
// ================================================

=== entropy_objectives ===
Agent 0x99: They're collecting demographic data, testing disinformation tactics, mapping influence networks.

Agent 0x99: It's all feeding into something bigger—Phase 3, though we don't know details yet.

+ [What's Phase 3?]
    -> phase_3_explanation
+ [What's my mission?]
    -> mission_objectives

=== phase_3_explanation ===
Agent 0x99: That's what we're trying to figure out. Multiple cells collecting different types of data.

Agent 0x99: Social Fabric handles narrative manipulation. Other cells focus on infrastructure, finance, healthcare.

+ [So this is part of something larger]
    -> larger_threat
+ [What do I need to do?]
    -> mission_objectives

=== larger_threat ===
Agent 0x99: Exactly. But right now, we stop this cell. One operation at a time.

-> mission_objectives

// ================================================
// STAKES EXPLANATION
// ================================================

=== stakes_explanation ===
Agent 0x99: If they succeed, they'll manipulate election coverage across social media and news outlets.

Agent 0x99: Viral Dynamics has distribution deals with dozens of platforms. Derek controls what millions see.

+ [That's... significant]
    -> mission_objectives
+ [We have to stop this]
    -> mission_objectives

// ================================================
// MISSION OBJECTIVES
// ================================================

=== mission_objectives ===
Agent 0x99: Your primary objectives:

Agent 0x99: One—Identify all ENTROPY operatives inside Viral Dynamics.

Agent 0x99: Two—Gather evidence of the disinformation operation.

Agent 0x99: Three—Intercept their communications with other cells.

+ [How do I get inside?]
    ~ asked_about_cover = true
    -> cover_story
+ [What resources do I have?]
    -> resources_available
+ [Sounds straightforward]
    -> approach_discussion

// ================================================
// COVER STORY
// ================================================

=== cover_story ===
Agent 0x99: You're going in as an IT contractor hired to audit their network security.

Agent 0x99: Completely legitimate. Viral Dynamics actually requested the audit weeks ago.

+ [So I'll have access to technical systems]
    -> technical_access
+ [What about the employees?]
    -> employee_interaction

=== technical_access ===
Agent 0x99: Server room, computers, network infrastructure—all fair game under your cover.

Agent 0x99: Just stay professional. IT contractors ask questions; that's expected.

-> approach_discussion

=== employee_interaction ===
Agent 0x99: IT contractors interact with everyone. Use it.

Agent 0x99: People trust IT. They'll share passwords, complain about systems, gossip about coworkers.

-> approach_discussion

// ================================================
// RESOURCES AVAILABLE
// ================================================

=== resources_available ===
Agent 0x99: You'll have phone comms with me throughout. I'll provide guidance as needed.

Agent 0x99: There's a SAFETYNET drop-site terminal in their server room for submitting intercepted intelligence.

+ [What about tools?]
    -> tools_discussion
+ [Got it. What's the approach?]
    -> approach_discussion

=== tools_discussion ===
Agent 0x99: Your contractor kit has lockpicks, RFID cloner, and analysis tools.

Agent 0x99: Everything you need looks like standard IT equipment. Stay in character.

-> approach_discussion

// ================================================
// APPROACH DISCUSSION
// ================================================

=== approach_discussion ===
Agent 0x99: How do you want to handle this?

+ [Careful and methodical—thorough investigation]
    ~ player_approach = "cautious"
    You: I'll take my time. Thorough beats fast.
    Agent 0x99: Smart. Don't miss anything critical.
    -> final_instructions
+ [Quick and focused—complete objectives efficiently]
    ~ player_approach = "confident"
    You: I'll move quickly and get results.
    Agent 0x99: Good. Just don't rush past important evidence.
    -> final_instructions
+ [Adaptable—read the situation as it develops]
    ~ player_approach = "adaptable"
    You: I'll adapt based on what I find.
    Agent 0x99: Flexible thinking. Trust your instincts.
    -> final_instructions

// ================================================
// FINAL INSTRUCTIONS
// ================================================

=== final_instructions ===
Agent 0x99: Remember—Derek doesn't know we're onto him yet. Keep it that way.

{player_approach == "cautious":
    Agent 0x99: Your careful approach should keep you under the radar. Document everything.
}
{player_approach == "confident":
    Agent 0x99: Speed is good, but stealth is better. Stay professional.
}
{player_approach == "adaptable":
    Agent 0x99: Read the room. If something feels off, trust that feeling.
}

+ [Any specific advice?]
    -> specific_advice
+ [I'm ready to deploy]
    -> deployment

// ================================================
// SPECIFIC ADVICE
// ================================================

=== specific_advice ===
Agent 0x99: The IT manager—Kevin Park—is your entry point. Build rapport with him.

Agent 0x99: He's not ENTROPY, just overworked and underpaid. He'll appreciate competent help.

+ [Anyone else I should know about?]
    -> other_npcs
+ [Got it. Ready to go]
    -> deployment

=== other_npcs ===
Agent 0x99: Sarah Martinez is the receptionist. She'll check you in.

Agent 0x99: Be professional. First impressions matter for your cover.

-> deployment

// ================================================
// DEPLOYMENT
// ================================================

=== deployment ===
Agent 0x99: Good luck, {player_name}. SAFETYNET is counting on you.

Agent 0x99: And remember—technically, you're just an IT contractor doing an audit.

Agent 0x99: Keep that cover intact and this should go smoothly.

~ mission_accepted = true

#start_gameplay
-> END
