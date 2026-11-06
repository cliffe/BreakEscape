// ===========================================
// Mission 5: Agent 0x99 Phone Support
// Event-Triggered Remote Guidance
// ===========================================

VAR hint_lockpicking_given = false
VAR hint_evidence_correlation = false
VAR rooms_discovered = 0

// External variables
EXTERNAL player_name
EXTERNAL evidence_level
EXTERNAL objectives_completed

// ===========================================
// MAIN PHONE CALL (Player Initiated)
// ===========================================

=== start ===
#speaker:agent_0x99

Agent 0x99: {player_name}, checking in. Status?

+ [Request guidance]
    -> provide_guidance

+ [Report progress]
    -> report_progress

+ [I'm good, just checking in]
    Agent 0x99: Stay focused. You're on a timeline.
    #exit_conversation
    -> END

=== provide_guidance ===
#speaker:agent_0x99

{evidence_level < 2:
    Agent 0x99: Start with security logs. Identify access patterns.
    Agent 0x99: Interview employees. Build a profile of the insider.
    -> start
}

{evidence_level >= 2 and evidence_level < 4:
    Agent 0x99: You have leads. Now correlate evidence.
    Agent 0x99: Physical evidence from searches + digital evidence from VM exploitation.
    Agent 0x99: Evidence board should help synthesize findings.
    ~ hint_evidence_correlation = true
    -> start
}

{evidence_level >= 4:
    Agent 0x99: You have enough evidence. Time to identify and confront the insider.
    Agent 0x99: Be ready for anything. ENTROPY trains people in counter-interrogation.
    -> start
}

=== report_progress ===
#speaker:agent_0x99

You: I've completed {objectives_completed} objectives. Evidence level: {evidence_level}.

{objectives_completed >= 3:
    Agent 0x99: Excellent progress. Keep it up.
}

{objectives_completed < 2:
    Agent 0x99: You need to move faster. Final exfiltration is Friday night.
}

{evidence_level >= 5:
    Agent 0x99: Strong evidence collection. You should be ready to make an identification.
}

-> start

// ===========================================
// EVENT-TRIGGERED: Item Pickup
// ===========================================

=== on_lockpick_pickup ===
#speaker:agent_0x99

Agent 0x99: Good find. That lockpick will bypass key locks.

Agent 0x99: Remember - lockpicking takes time. Don't get caught mid-pick.

#exit_conversation
-> END

=== on_medical_bills_found ===
#speaker:agent_0x99

Agent 0x99: $380,000 in medical debt. Wife with Stage 3 cancer.

Agent 0x99: That's ENTROPY's textbook vulnerability. Financial desperation.

Agent 0x99: You're getting close, {player_name}.

#exit_conversation
-> END

=== on_journal_found ===
#speaker:agent_0x99

Agent 0x99: Personal journal. Good find.

Agent 0x99: Look for rationalization patterns. Signs of cognitive dissonance.

Agent 0x99: ENTROPY radicalizes people gradually. Escalating commitment.

#exit_conversation
-> END

=== on_briefcase_found ===
#speaker:agent_0x99

Agent 0x99: Encrypted communications. Direct ENTROPY contact.

Agent 0x99: This is solid evidence. Almost ready for confrontation.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: VM Flags
// ===========================================

=== on_flag1_submitted ===
#speaker:agent_0x99

Agent 0x99: First flag verified. Initial reconnaissance complete.

Agent 0x99: Keep exploiting that Bludit server. Three more flags to go.

#exit_conversation
-> END

=== on_flag2_submitted ===
#speaker:agent_0x99

Agent 0x99: Second flag secured. File system access confirmed.

Agent 0x99: You're building the digital evidence chain. Good work.

#exit_conversation
-> END

=== on_flag3_submitted ===
#speaker:agent_0x99

Agent 0x99: Third flag verified. Privilege escalation successful.

Agent 0x99: One more flag - The Architect's communications. Find it.

#exit_conversation
-> END

=== on_flag4_submitted ===
#speaker:agent_0x99

Agent 0x99: Final flag secured. The Architect's approval for Operation Schrödinger.

Agent 0x99: Casualty projections. Foreign sales. Payment schedules. Everything.

Agent 0x99: This proves ENTROPY's leadership approved the operation. Excellent work.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Room Discovery
// ===========================================

=== on_room_discovered ===
~ rooms_discovered += 1

#speaker:agent_0x99

{rooms_discovered == 1:
    Agent 0x99: Good progress. Stay methodical.
}

{rooms_discovered == 3:
    Agent 0x99: You're covering ground. Document everything you find.
}

{rooms_discovered == 5:
    Agent 0x99: Thorough exploration. ENTROPY's trail should be clearer now.
}

{rooms_discovered >= 7:
    Agent 0x99: You've mapped most of the facility. Evidence should be accumulating.
}

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Lockpicking Success
// ===========================================

=== on_lockpick_success ===
#speaker:agent_0x99

Agent 0x99: Clean lockpick. Smooth work, {player_name}.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Evidence Correlation
// ===========================================

=== on_evidence_correlated ===
#speaker:agent_0x99

Agent 0x99: Evidence correlation complete. You've identified the insider.

Agent 0x99: Now comes the hard part - the confrontation.

Agent 0x99: Remember: ENTROPY weaponizes suffering. This person may be a victim too.

Agent 0x99: But they still made choices. Choices that will cost lives.

Agent 0x99: How you handle this is your call, {player_name}. I trust your judgment.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Player Detected (Alert)
// ===========================================

=== on_player_detected ===
#speaker:agent_0x99

Agent 0x99: You've been spotted. Stay calm. Use your cover story.

Agent 0x99: You're a SAFETYNET security consultant. Routine audit. Stick to it.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Low Evidence Warning
// ===========================================

=== on_evidence_insufficient ===
#speaker:agent_0x99

Agent 0x99: Your evidence is thin. You need more before confronting the insider.

{not hint_evidence_correlation:
    Agent 0x99: Exploit the Bludit server. Search personal spaces. Correlate findings.
}

Agent 0x99: Solid evidence makes all the difference in a confrontation.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Time Warning (Friday Afternoon)
// ===========================================

=== on_time_warning ===
#speaker:agent_0x99

Agent 0x99: {player_name}, it's Friday afternoon. Final exfiltration tonight.

Agent 0x99: You need to identify the insider and stop that upload. Soon.

#exit_conversation
-> END

// ===========================================
// EVENT-TRIGGERED: Torres Identified
// ===========================================

=== on_torres_identified ===
#speaker:agent_0x99

Agent 0x99: David Torres. Senior cryptographer. MIT PhD.

Agent 0x99: Wife Elena has Stage 3 cancer. $380K in debt.

Agent 0x99: ENTROPY's Insider Threat Initiative targeted him specifically.

Agent 0x99: He's been radicalized for three months. That's early - he might still be turned.

Agent 0x99: But he's also committed espionage knowing it would cost lives.

Agent 0x99: What you do with him - that's your call. I'll support whatever decision you make.

#exit_conversation
-> END
