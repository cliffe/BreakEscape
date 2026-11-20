// ===========================================
// Mission 5: NPC - Dr. Sarah Chen
// Chief Scientist, Project Heisenberg Lead
// ===========================================

VAR chen_trust = 0                // 0-100 scale
VAR topic_heisenberg = false
VAR topic_team = false
VAR topic_torres_defense = false
VAR gave_research_access = false
VAR first_meeting = true

// External variables
EXTERNAL player_name
EXTERNAL torres_identified

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:dr_chen

{first_meeting:
    ~ first_meeting = false
    #display:chen-professional

    A woman in her mid-40s looks up from complex equations on a whiteboard. Sharp eyes behind glasses.

    Dr. Chen: You're the security consultant. Sarah Chen, Project Heisenberg lead.

    Dr. Chen: I hope you find whoever did this quickly.

    + [I'll do my best. Can you help me understand what was stolen?]
        You: The technical context will help narrow down suspects.
        ~ chen_trust += 10
        -> heisenberg_explanation

    + [I need to interview your team members]
        You: Everyone with access to Project Heisenberg.
        Dr. Chen: *defensive* My team didn't do this.
        -> defensive_response

    + [How well do you know your team?]
        You: Could you have missed something? Behavioral changes?
        Dr. Chen: *bristles* I know my people.
        ~ chen_trust -= 5
        -> defensive_response
}

{not first_meeting:
    #display:chen-neutral
    Dr. Chen: Yes?
    -> hub
}

=== heisenberg_explanation ===
#speaker:dr_chen

Dr. Chen: Project Heisenberg is quantum key distribution for military communications.

Dr. Chen: Post-quantum cryptography. Secure against quantum computer attacks.

Dr. Chen: If hostile nations get our protocols, they can develop countermeasures. Decade of research wasted.

{chen_trust >= 15:
    Dr. Chen: 247 DoD facilities are scheduled for installation. If attackers know the deployment timeline...
    Dr. Chen: People could die.
    ~ chen_trust += 5
}

-> hub

=== defensive_response ===
#speaker:dr_chen

Dr. Chen: My team is brilliant. Vetted. TS/SCI clearance.

Dr. Chen: If one of them did this, they had a reason. Pressure. Coercion.

+ [I'm not here to judge. Just to find the truth]
    ~ chen_trust += 10
    You: Whoever did this might be a victim too.
    Dr. Chen: *softens slightly* Thank you for understanding that.
    -> hub

+ [Reason doesn't justify espionage]
    You: They made a choice.
    Dr. Chen: *cold* We're done here.
    ~ chen_trust -= 10
    #exit_conversation
    -> DONE

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_heisenberg} [Explain Project Heisenberg in detail]
    -> ask_heisenberg_details

+ {not topic_team} [Tell me about your team]
    -> ask_team_members

+ {not topic_torres_defense and chen_trust >= 20} [What can you tell me about David Torres?]
    -> ask_torres

+ {chen_trust >= 30} [I need access to research documentation]
    -> request_research_access

+ [That's all]
    #exit_conversation
    #speaker:dr_chen
    Dr. Chen: Good luck with your investigation.
    -> DONE

=== ask_heisenberg_details ===
#speaker:dr_chen
~ topic_heisenberg = true
~ chen_trust += 5

Dr. Chen: Quantum entanglement enables unbreakable encryption. Any eavesdropping attempt collapses the quantum state.

Dr. Chen: Our work implements this at scale. 847 pages of protocols, algorithms, hardware specifications.

Dr. Chen: Three years of research. Billions in DoD funding.

{chen_trust >= 25:
    Dr. Chen: If you want to understand the technical details, check the research lab. Documentation's there.
    #unlock_task:access_heisenberg_documentation
}

-> hub

=== ask_team_members ===
#speaker:dr_chen
~ topic_team = true
~ chen_trust += 5

Dr. Chen: Eight people total. I personally recruited most of them.

Dr. Chen: David Torres is my senior researcher. Brilliant cryptographer. MIT PhD.

Dr. Chen: The others are equally qualified.

{chen_trust >= 20:
    Dr. Chen: David's been... distracted lately. Personal issues.
    Dr. Chen: His wife Elena has cancer. Stage 3. It's been hard on him.
    ~ chen_trust += 5
}

-> hub

=== ask_torres ===
#speaker:dr_chen
~ topic_torres_defense = true

Dr. Chen: David is one of the best cryptographers I've ever worked with.

Dr. Chen: He's also a good man. A father. Husband to a dying woman.

{chen_trust >= 30:
    Dr. Chen: I've seen him struggle. Medical bills. Insurance denials.
    Dr. Chen: If someone targeted him because of that vulnerability...
    Dr. Chen: *angry* ENTROPY are predators.
    ~ chen_trust += 10
}

-> hub

=== request_research_access ===
#speaker:dr_chen

You: I need access to Project Heisenberg documentation. Technical specs, team files.

{chen_trust >= 40:
    Dr. Chen: Alright. You've been thorough and respectful.
    Dr. Chen: Here's my research badge. Use it wisely.

    #give_item:research_badge
    #unlock_room:research_lab
    #complete_task:obtain_research_access

    ~ gave_research_access = true
    ~ chen_trust += 5

    Dr. Chen: The research lab has everything you need.
    -> hub
- else:
    Dr. Chen: I don't know you well enough to grant that level of access.
    Dr. Chen: Keep investigating. Earn my trust.
    -> hub
}

// ===========================================
// EVENT-TRIGGERED: Player Identifies Torres
// ===========================================

=== on_torres_accused ===
#speaker:dr_chen

{torres_identified:
    Dr. Chen: Is it true? David Torres?

    + [Yes. The evidence is conclusive]
        Dr. Chen: *closes eyes* I should have seen it.
        Dr. Chen: He was pulling away. Working late alone. Avoiding eye contact.
        -> chen_guilt

    + [I'm still gathering evidence]
        Dr. Chen: Be absolutely certain before you destroy his life.
        -> DONE
}

=== chen_guilt ===
#speaker:dr_chen

Dr. Chen: I failed him. As a supervisor. As a friend.

Dr. Chen: Elena's treatment. The debt. I knew. I didn't ask if he needed help.

+ [This isn't your fault. ENTROPY manipulated him]
    Dr. Chen: That doesn't make me feel better.
    -> torres_defense

+ [He made his choice]
    Dr. Chen: *sharp look* He made a choice between watching his wife die or committing espionage.
    Dr. Chen: What would you choose?
    -> DONE

=== torres_defense ===
#speaker:dr_chen

Dr. Chen: What happens to him now?

+ [That depends on how he cooperates]
    Dr. Chen: Will you... consider his circumstances?
    You: I'll make the right call when I confront him.
    Dr. Chen: Thank you.
    -> DONE

+ [He'll face justice]
    Dr. Chen: *quiet* I understand.
    -> DONE

// ===========================================
// EVENT-TRIGGERED: Mission Complete
// ===========================================

=== on_mission_complete ===
#speaker:dr_chen

{torres_turned:
    Dr. Chen: I heard David's cooperating. Working with SAFETYNET.
    Dr. Chen: And... Elena's treatment will be covered?
    You: Witness protection program. She'll get the care she needs.
    Dr. Chen: *exhales* Thank god. Maybe something good comes from this.
}

{torres_arrested:
    Dr. Chen: David's in federal custody.
    Dr. Chen: What about Elena? The children?
    You: That's not my jurisdiction.
    Dr. Chen: *bitter* Of course not.
}

{torres_killed:
    Dr. Chen: I heard David was killed.
    Dr. Chen: *long silence*
    Dr. Chen: Elena's a widow now. Sofia and Miguel have no father.
    Dr. Chen: I hope it was worth it.
    #exit_conversation
    -> DONE
}

Dr. Chen: Thank you for... handling this as well as you could.

#exit_conversation
-> DONE
