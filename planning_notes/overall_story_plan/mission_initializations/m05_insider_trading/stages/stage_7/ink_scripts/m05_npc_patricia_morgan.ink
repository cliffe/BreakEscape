// ===========================================
// Mission 5: NPC - Patricia Morgan (CSO)
// Chief Security Officer, Mission Handler
// ===========================================

VAR patricia_trust = 5            // 0-10 scale
VAR topic_investigation = false
VAR topic_suspects = false
VAR topic_company_politics = false
VAR gave_security_logs = false
VAR first_meeting = true

// External variables
EXTERNAL player_name
EXTERNAL evidence_level

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:patricia_morgan

{first_meeting:
    ~ first_meeting = false
    #display:patricia-professional

    A woman in her early 50s approaches. Military bearing, sharp eyes. Former Marine, you'd guess.

    Patricia: You must be the SAFETYNET consultant. Patricia Morgan, Chief Security Officer.

    Patricia: Thanks for coming on short notice.

    + [Glad to help. What's the situation?]
        You: Fill me in on what you've found so far.
        ~ patricia_trust += 1
        -> briefing_details

    + [Let's skip the pleasantries. I need access]
        You: I'm here to work, not chat. What access do I have?
        Patricia: Direct. I like it.
        ~ patricia_trust += 1
        -> provide_access

    + [Agent 0x99 briefed me. 4.2 TB exfiltration]
        You: I know the basics. Quantum crypto research, inside job.
        Patricia: Good. Then let's get to work.
        ~ patricia_trust += 2
        -> provide_access
}

{not first_meeting:
    #display:patricia-neutral
    Patricia: Back for more intel?
    -> hub
}

=== briefing_details ===
#speaker:patricia_morgan

Patricia: Data exfiltration. 4.2 terabytes over six weeks.

Patricia: Project Heisenberg. Quantum key distribution protocols. DoD contracts.

Patricia: If it reaches foreign governments, we're looking at national security catastrophe.

+ [How did you detect it?]
    Patricia: Anomalous network traffic. 2-4 AM uploads to external servers.
    Patricia: Took three weeks to confirm it wasn't legitimate remote work.
    -> provide_access

+ [Who has access to this data?]
    -> suspects_overview

=== suspects_overview ===
#speaker:patricia_morgan

Patricia: Eight people with TS/SCI clearance. Cryptography division.

Patricia: Dr. Sarah Chen leads the team. Five senior researchers. Two junior engineers.

Patricia: All vetted. All trusted. Until now.

+ [I'll need to interview them]
    ~ patricia_trust += 1
    You: Can you arrange access without tipping them off?
    Patricia: Already done. You're here as a "routine security audit."
    -> provide_access

+ [Any prime suspects?]
    Patricia: Not yet. That's your job.
    -> provide_access

=== provide_access ===
#speaker:patricia_morgan

Patricia: Here's your visitor badge. Limited access for now.

#give_item:visitor_badge
#complete_task:obtain_security_badge

Patricia: For restricted zones, you'll need to... improvise.

Patricia: I'll be available by phone if you need authorization.

+ [Where should I start?]
    Patricia: Security logs in the open office area. Network traffic analysis.
    Patricia: Talk to people. Someone knows something.
    ~ gave_security_logs = true
    #exit_conversation
    -> DONE

+ [I'll figure it out]
    #exit_conversation
    -> DONE

// ===========================================
// CONVERSATION HUB (Return Visits)
// ===========================================

=== hub ===

+ {not topic_investigation} [Ask about the investigation so far]
    -> ask_investigation

+ {not topic_suspects} [Ask about the suspect list]
    -> ask_suspects

+ {not topic_company_politics} [Ask about company politics]
    -> ask_company_politics

+ {evidence_level >= 3} [Share findings]
    -> share_findings

+ [I need authorization for something]
    -> request_authorization

+ [That's all for now]
    #exit_conversation
    #speaker:patricia_morgan
    Patricia: Stay in touch.
    -> DONE

=== ask_investigation ===
#speaker:patricia_morgan
~ topic_investigation = true

Patricia: Internal investigation hit a wall. Insider's too sophisticated.

Patricia: Access logs look legitimate. No obvious behavioral red flags.

{patricia_trust >= 3:
    Patricia: Between you and me? I should have caught this sooner.
    ~ patricia_trust += 1
}

-> hub

=== ask_suspects ===
#speaker:patricia_morgan
~ topic_suspects = true

Patricia: Dr. Sarah Chen - team lead. Brilliant cryptographer.

Patricia: David Torres - senior researcher. Top of his field.

Patricia: Five others with varying levels of access.

{patricia_trust >= 5:
    Patricia: Torres has been... distracted lately. Personal issues.
    Patricia: But distracted doesn't mean traitor.
}

-> hub

=== ask_company_politics ===
#speaker:patricia_morgan
~ topic_company_politics = true

Patricia: CEO Jennifer Zhao wants this handled quietly.

Patricia: No press. No prosecution if we can avoid it. Protect the DoD contracts.

{patricia_trust >= 4:
    Patricia: I want justice. She wants damage control.
    Patricia: We'll see who wins.
    ~ patricia_trust += 1
}

-> hub

=== share_findings ===
#speaker:patricia_morgan

You: I've found some leads. Want to compare notes?

{evidence_level >= 5:
    Patricia: Talk to me. What have you got?
    -> significant_findings
}
{evidence_level >= 3:
    Patricia: I'm listening.
    -> moderate_findings
}

=== moderate_findings ===
#speaker:patricia_morgan

You: [Share evidence summary]

Patricia: Good work. Keep digging.

{patricia_trust >= 6:
    Patricia: You're thorough. I appreciate that.
}

~ patricia_trust += 1
-> hub

=== significant_findings ===
#speaker:patricia_morgan

You: [Share evidence pointing to specific suspect]

Patricia: Damn. You're close, aren't you?

Patricia: Be careful. When you confront them, you're on your own.

Patricia: But... good work. Really.

~ patricia_trust += 2
-> hub

=== request_authorization ===
#speaker:patricia_morgan

Patricia: What do you need?

+ [Access to employee financial records]
    Patricia: I'll send you the files. Check your device.
    #give_item:financial_records_access
    ~ patricia_trust += 1
    -> hub

+ [Server room access override]
    Patricia: Done. Security system updated.
    #unlock_room:server_room
    ~ patricia_trust += 1
    -> hub

+ [Never mind]
    -> hub

// ===========================================
// EVENT-TRIGGERED: Player Identifies Insider
// ===========================================

=== on_insider_identified ===
#speaker:patricia_morgan

[Patricia's phone rings. You call her.]

You: Patricia, I've identified the insider.

Patricia: Who?

{torres_identified:
    You: David Torres.
    Patricia: *long pause* Damn it.
    Patricia: His wife. Elena. She's sick, isn't she?
    Patricia: Financial desperation. ENTROPY's playbook.
}

Patricia: What do you need from me?

+ [Backup when I confront him]
    Patricia: You've got it. When and where?
    -> DONE

+ [Just stay ready. I'll handle this]
    Patricia: Be careful. Cornered people are dangerous.
    -> DONE

// ===========================================
// EVENT-TRIGGERED: Mission Complete
// ===========================================

=== on_mission_complete ===
#speaker:patricia_morgan

Patricia: Is it done?

{torres_turned:
    You: He's working with us now. Double agent.
    Patricia: Risky. But if it maps ENTROPY's network... good call.
}

{torres_arrested:
    You: He's in custody. Evidence is solid.
    Patricia: By the book. Respect that.
}

{torres_killed:
    You: He resisted. Lethal force was necessary.
    Patricia: *pause* Understood. I'll handle the paperwork.
}

Patricia: Thank you, {player_name}. You did good work here.

#exit_conversation
-> DONE
