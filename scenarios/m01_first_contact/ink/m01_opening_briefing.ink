// ================================================
// Mission 1: First Contact - Opening Briefing
// Act 1: Interactive Cutscene
// Agent 0x99 "Haxolottle" briefs Agent 0x00
// UPDATED: Shortened intro - Operation Shatter discovered through investigation
// ================================================

// Variables for tracking what player asked about (affects debrief)
VAR asked_about_stakes = false
VAR asked_about_derek = false
VAR asked_about_maya = false
VAR mission_accepted = false

// External variables
VAR player_name = "Agent"

// ================================================
// START: BRIEFING BEGINS
// ================================================

=== start ===
Agent HaX: Agent, thanks for getting here on short notice.

Agent HaX: We have a situation at Viral Dynamics Media. ENTROPY's Social Fabric cell is operating there.

+ [What are they doing?]
    -> briefing_threat
+ [I'm ready. What's the mission?]
    -> mission_objectives
+ [How urgent is this?]
    ~ asked_about_stakes = true
    -> urgency_explanation

// ================================================
// URGENCY EXPLANATION
// ================================================

=== urgency_explanation ===
Agent HaX: Time-sensitive. We received an anonymous tip from someone inside who suspects ENTROPY activity.

Agent HaX: Whatever they're planning, it's active. And it's dangerous.

-> briefing_threat

// ================================================
// THREAT BRIEFING
// ================================================

=== briefing_threat ===
Agent HaX: Three weeks ago, we flagged suspicious activity at Viral Dynamics—far beyond typical disinformation work.

Agent HaX: Our intel suggests they're coordinating something larger. Data collection, psychological profiling, attack infrastructure.

Agent HaX: The details are unclear, but it's active and operational.

+ [What kind of data?]
    -> data_concerns
+ [Who's running the operation?]
    ~ asked_about_derek = true
    -> operative_identity
+ [What's my mission?]
    -> mission_objectives

// ================================================
// DATA CONCERNS
// ================================================

=== data_concerns ===
Agent HaX: Large-scale data aggregation. Personal profiles, vulnerability assessments.

Agent HaX: Whatever they're building, it's targeted and sophisticated.

Agent HaX: Your job is to get inside and find out what they're actually planning.

+ [Who's running this?]
    ~ asked_about_derek = true
    -> operative_identity
+ [What's my mission?]
    -> mission_objectives

// ================================================
// MISSION OBJECTIVES
// ================================================

=== mission_objectives ===
Agent HaX: Infiltrate Viral Dynamics and identify what ENTROPY is planning. Gather evidence of their operations and identify all operatives... And Report back with actionable intelligence so we can stop whatever they're building.

+ [How do I get inside?]
    -> cover_story
+ [Who's the primary target?]
    ~ asked_about_derek = true
    -> operative_identity
+ [What resources do I have?]
    -> resources_available

// ================================================
// OPERATIVE IDENTITY
// ================================================

=== operative_identity ===
Agent HaX: Derek Lawson. Senior Marketing Manager at Viral Dynamics.

Agent HaX: He's been there three months. Timeline matches when the suspicious activity started.

Agent HaX: He's ENTROPY, but we don't know the full scope of what he's running.

+ [How do I get to him?]
    -> cover_story
+ [What's my mission?]
    -> mission_objectives

// ================================================
// COVER STORY
// ================================================

=== cover_story ===
Agent HaX: You're going in as an IT contractor hired to audit their network security.

Agent HaX: Completely legitimate. Viral Dynamics actually requested the audit weeks ago. We just... made sure we got the contract.

+ [So I'll have access to technical systems]
    -> technical_access
+ [What about the employees?]
    -> employee_interaction
+ [I'm ready to go]
    -> deployment

=== technical_access ===
Agent HaX: Server room, computers, network infrastructure—all fair game under your cover.

Agent HaX: That's where you'll find evidence of what Derek's planning. Look for encrypted files, attack infrastructure, target databases.

-> innocent_warning

=== employee_interaction ===
Agent HaX: Most employees at Viral Dynamics have no idea what's happening.

Agent HaX: They think they work at a marketing agency. The ENTROPY team is isolated—probably just a few people.

Agent HaX: Everyone else is innocent. Keep collateral damage to zero.

-> innocent_warning

=== innocent_warning ===
Agent HaX: One more thing: there's someone inside named Maya Chen.

Agent HaX: She contacted us anonymously. Suspected something was wrong but doesn't have the full picture.

Agent HaX: Find her. She might have critical information. And protect her identity—if Derek finds out she tipped us off, she's in danger.

~ asked_about_maya = true

-> resources_available

// ================================================
// RESOURCES AVAILABLE
// ================================================

=== resources_available ===
Agent HaX: You'll have phone comms with me throughout. I'll provide guidance as needed.

Agent HaX: There's a SAFETYNET drop-site terminal in their server room for submitting intercepted intelligence.

+ [What about tools?]
    -> tools_discussion
+ [I'm ready to go]
    -> final_instructions

=== tools_discussion ===
Agent HaX: Everything you need looks like standard IT equipment. Stay in character. The IT department can provide you with a Kali Linux terminal, and lockpicks.

Agent HaX: And document everything you find. We need complete evidence of whatever they're planning.

-> final_instructions

// ================================================
// FINAL INSTRUCTIONS
// ================================================

=== final_instructions ===
Agent HaX: Remember—Derek doesn't know we're onto him. This is just a routine IT audit as far as he's concerned.

Agent HaX: Use that advantage. Gather intelligence and evidence before making any moves.

+ [Any specific advice?]
    -> specific_advice
+ [I'm ready to deploy]
    -> deployment

// ================================================
// SPECIFIC ADVICE
// ================================================

=== specific_advice ===
Agent HaX: The IT manager—Kevin Park—is your entry point. Build rapport with him.

Agent HaX: He's not ENTROPY, just overworked and underpaid. He'll appreciate competent help and give you access.

+ [Anyone else I should know about?]
    -> other_npcs
+ [Got it. Ready to go]
    -> deployment

=== other_npcs ===
Agent HaX: Sarah O'Brien is the receptionist. Professional, friendly. Don't give her any reason to flag you.

Agent HaX: And Maya Chen—the journalist who contacted us. Be careful around her. Derek might be watching who she talks to.

-> deployment

// ================================================
// DEPLOYMENT
// ================================================

=== deployment ===
Agent HaX: Get inside, find out what ENTROPY is planning, and report back.

Agent HaX: Talk to Maya. She's your best lead. Whatever Derek's building, she'll have seen pieces of it.

Agent HaX: Once you know what we're dealing with, contact me. We'll figure out how to stop it.

~ mission_accepted = true

#exit_conversation
-> END
