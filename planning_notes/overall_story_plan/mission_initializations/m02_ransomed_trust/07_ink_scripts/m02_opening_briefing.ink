// ===========================================
// ACT 1: OPENING BRIEFING
// Mission 2: Ransomed Trust
// Break Escape - ENTROPY Cell: Ransomware Incorporated
// ===========================================

// Variables for tracking player choices and state
VAR player_approach = ""          // cautious, aggressive, adaptable
VAR handler_trust = 50            // 0-100 Handler's confidence in player
VAR knows_full_stakes = false     // Did player ask about patient risk?
VAR knows_timeline = false        // Did player ask about time pressure?
VAR mission_priority = ""         // speed, stealth, thoroughness

// External variables (set by game)
EXTERNAL player_name

// ===========================================
// OPENING
// ===========================================

=== start ===
#speaker:agent_0x99

{player_name}, thanks for getting here fast.

We have an emergency situation at St. Catherine's Regional Medical Center.

* [Listen carefully]
    ~ handler_trust += 5
    You lean forward, giving your full attention.
    -> briefing_main

* [Ask what kind of emergency]
    You: What's happened?
    -> briefing_main

* [Express readiness]
    ~ handler_trust += 10
    ~ player_approach = "confident"
    You: I'm ready. What's the mission?
    Agent 0x99: Good. Let's get straight to it.
    -> briefing_main

// ===========================================
// MAIN BRIEFING
// ===========================================

=== briefing_main ===
#speaker:agent_0x99

Agent 0x99: Hospital ransomware attack. ENTROPY signature detected—Ransomware Incorporated.

Agent 0x99: 47 patients on life support. Backup power holds 12 hours.

Agent 0x99: If systems aren't restored... the math gets ugly.

* [Ask about timeline]
    ~ knows_timeline = true
    You: How much time do we have?
    -> timeline_explanation

* [Ask about patient risk]
    ~ knows_full_stakes = true
    ~ handler_trust += 5
    You: What's the actual risk to those patients?
    -> patient_risk_explanation

* [Ask about ENTROPY's involvement]
    You: Ransomware Incorporated—what do we know?
    -> entropy_explanation

=== timeline_explanation ===
#speaker:agent_0x99

Agent 0x99: 12 hours of backup power. Maybe less if systems fail cascading.

Agent 0x99: Hospital board's voting on paying the ransom in 4 hours.

Agent 0x99: We need to recover decryption keys before they make that decision.

+ [Understood. What's the plan?]
    -> mission_objectives

+ {not knows_full_stakes} [What's the risk to patients?]
    ~ knows_full_stakes = true
    ~ handler_trust += 5
    -> patient_risk_explanation

=== patient_risk_explanation ===
#speaker:agent_0x99

Agent 0x99: 47 patients: ventilators, ECMO, dialysis. All dependent on networked systems.

Agent 0x99: Statistical risk increases every hour. 0.3% per hour without full systems.

Agent 0x99: If we hit 12 hours... 4-6 expected fatalities. Those are real people.

+ [That's horrifying]
    ~ handler_trust += 5
    You: Those are real lives. We have to move fast.
    Agent 0x99: Exactly. Every minute counts.
    -> mission_objectives

+ [What if the board pays the ransom?]
    You: If they pay, systems restore faster, right?
    -> ransom_preliminary_discussion

=== ransom_preliminary_discussion ===
#speaker:agent_0x99

Agent 0x99: Yes. Ransom payment gets decryption keys immediately—maybe 1-2 patient deaths.

Agent 0x99: But that's $87,000 funding ENTROPY's next attack.

Agent 0x99: This won't be a simple mission, agent.

+ [I understand the stakes]
    ~ knows_full_stakes = true
    -> mission_objectives

=== entropy_explanation ===
#speaker:agent_0x99

Agent 0x99: Ransomware Incorporated. They believe suffering "teaches resilience."

Agent 0x99: Not profit-motivated—ideologically driven. They calculate harm.

Agent 0x99: Ghost's their operative. Cold, methodical. No remorse.

+ [How do we stop them?]
    -> mission_objectives

+ [They calculated patient deaths?]
    You: They calculated how many people might die?
    Agent 0x99: Spreadsheet of projected fatalities. This is ENTROPY's ideology.
    ~ knows_full_stakes = true
    -> mission_objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent 0x99: Your objectives:

Agent 0x99: One—infiltrate St. Catherine's as external security consultant.

Agent 0x99: Two—access hospital's IT systems, identify attack vector.

Agent 0x99: Three—exploit ENTROPY's backdoor on backup server, recover decryption keys.

* [What's my cover story?]
    -> cover_story

* [What about hospital security?]
    -> security_warning

* [I'm ready to go]
    ~ player_approach = "direct"
    -> mission_approach

=== cover_story ===
#speaker:agent_0x99

Agent 0x99: You're a cybersecurity consultant brought in for emergency recovery.

Agent 0x99: Dr. Sarah Kim, Hospital CTO, is expecting you. She'll grant access.

Agent 0x99: Staff is stressed, desperate. Use that. Build trust.

+ [Understood]
    -> security_warning

=== security_warning ===
#speaker:agent_0x99

Agent 0x99: Security is heightened. Guards patrolling. Stay low profile.

Agent 0x99: Like an axolotl timing its movements—patience and observation.

Agent 0x99: You'll need lockpicking, social engineering, maybe some technical exploitation.

+ [I can handle it]
    -> mission_approach

+ [Any other guidance?]
    You: What else should I know?
    Agent 0x99: IT admin is named Marcus Webb. He warned them about vulnerabilities six months ago.
    Agent 0x99: They ignored him. Now he's devastated. Might be an ally.
    -> mission_approach

// ===========================================
// CRITICAL CHOICE: Mission Approach
// ===========================================

=== mission_approach ===
#speaker:agent_0x99

Agent 0x99: How do you want to approach this?

+ [Cautious and methodical]
    ~ player_approach = "cautious"
    ~ mission_priority = "thoroughness"
    You: I'll be careful. Thorough investigation is key.
    Agent 0x99: Smart. Document everything. Build a complete picture.
    Agent 0x99: But remember—47 patients, 12-hour window. Thorough doesn't mean slow.
    -> final_instructions

+ [Fast and direct]
    ~ player_approach = "aggressive"
    ~ mission_priority = "speed"
    You: I'll move fast. Complete objectives quickly.
    Agent 0x99: Time is critical, but don't miss vital evidence.
    Agent 0x99: ENTROPY leaves traces. Those traces help us stop them permanently.
    -> final_instructions

+ [Adaptable—assess on site]
    ~ player_approach = "adaptable"
    ~ mission_priority = "stealth"
    You: I'll read the situation and adapt as needed.
    Agent 0x99: Flexible thinking. Trust your instincts.
    Agent 0x99: Situations like this change fast. Adapt or fail.
    ~ handler_trust += 5
    -> final_instructions

=== final_instructions ===
#speaker:agent_0x99

Agent 0x99: Remember Field Operations Rule 7: "In crises, perfect is the enemy of good enough."

{player_approach == "cautious":
    Agent 0x99: Your careful approach serves you well. But speed matters here.
}
{player_approach == "aggressive":
    Agent 0x99: Speed is good. But don't compromise the mission for it.
}
{player_approach == "adaptable":
    Agent 0x99: Adaptability is your strength. Use it.
}

Agent 0x99: You'll have comms support. Call if you need guidance.

* [Any last advice?]
    Agent 0x99: Marcus Webb, the IT admin. He's guilty and desperate.
    Agent 0x99: That makes him vulnerable. Build trust, get access.
    Agent 0x99: And watch for Ghost. They're calculated. Expect spreadsheets, not rage.
    -> deployment

* [I'm ready to go]
    -> deployment

=== deployment ===
#speaker:agent_0x99

Agent 0x99: Good luck, {player_name}.

Agent 0x99: 47 lives. 12 hours. SAFETYNET is counting on you.

{knows_full_stakes:
    Agent 0x99: And remember—those patient deaths? They're on ENTROPY, not you.
    Agent 0x99: Do your best. That's all anyone can ask.
}

#complete_task:receive_mission_briefing
#unlock_aim:infiltrate_hospital
#start_gameplay
#exit_conversation

-> END
