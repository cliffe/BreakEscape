// ===========================================
// Mission 5: NPC - Dr. Sarah Chen
// Chief Scientist, Project Heisenberg lead
//
// PASS 2: never reaches DONE/END (lesson 21). Her spare badge now opens
// the server hallway (second route beside Kevin's clone). The old
// #unlock_room / #unlock_task tags were not engine tags and did nothing.
// Her Heisenberg lines now match the mission's stakes (the 999 dispatch
// rollout), not the pre-alignment "military communications" draft.
// ===========================================

VAR chen_influence = 0                // 0-100 scale
VAR topic_heisenberg = false
VAR topic_team = false
VAR topic_torres_defense = false
VAR told_about_torres = false
VAR first_meeting = true

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR server_badge_obtained = false

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_dr_chen
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her mid-forties looks up from a whiteboard dense with lattice notation. Sharp eyes behind glasses.

#speaker:dr_chen
Dr. Sarah Chen: You're the consultant. Sarah Chen, Project Heisenberg lead.

Dr. Sarah Chen: I hope you find whoever did this quickly. And I hope you're wrong about my team.

+ [Help me understand what was taken.]
    You: The technical context will help me narrow it down.
    ~ chen_influence += 10
    -> heisenberg_explanation

+ [I need to interview your team.]
    You: I need to talk to everyone with access to Heisenberg.
    Dr. Sarah Chen: My team didn't do this.
    -> defensive_response

+ [Could you have missed a change in one of them?]
    You: Could you have missed something? Someone behaving differently?
    Dr. Sarah Chen: I know my people.
    ~ chen_influence -= 5
    -> defensive_response

=== heisenberg_explanation ===
#speaker:dr_chen
~ topic_heisenberg = true
~ chen_influence += 5

Dr. Sarah Chen: Heisenberg is quantum-safe key exchange for the new national emergency dispatch network. The system that routes 999 calls.

Dr. Sarah Chen: Lattice-based. Built to survive an attacker with a quantum computer, which is a problem for the 2030s. The problem for tonight is simpler.

{chen_influence >= 15:
    Dr. Sarah Chen: The keys rotate region by region during the rollout. If someone holds the keys and knows the rotation windows, they don't need to break anything. They just wait.
    Dr. Sarah Chen: People could die waiting for an ambulance. I've done the arithmetic. I try not to.
    ~ chen_influence += 5
}

-> hub

=== defensive_response ===
#speaker:dr_chen

Dr. Sarah Chen: My team are brilliant and vetted to the hilt.

Dr. Sarah Chen: If one of them did this, they had a reason. Pressure. Coercion.

+ [I'm not here to judge. I'm here for the truth.]
    ~ chen_influence += 10
    You: Whoever did this might be a victim too.
    Dr. Sarah Chen: Thank you for saying that.
    -> hub

+ [A reason doesn't make it right.]
    You: They made a choice.
    Dr. Sarah Chen: We're done here.
    ~ chen_influence -= 10
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:dr_chen

+ {not topic_heisenberg} [Explain Project Heisenberg to me.]
    -> heisenberg_explanation

+ {not topic_team} [Tell me about your team.]
    -> ask_team_members

+ {not topic_torres_defense and chen_influence >= 20} [What can you tell me about David Torres?]
    -> ask_torres

+ {not server_badge_obtained and topic_heisenberg} [I need to get onto the server side.]
    -> request_research_access

+ {torres_identified and not told_about_torres} [It's David.]
    -> chen_guilt

+ [That's all for now.]
    You: That's all for now.
    Dr. Sarah Chen: Good luck with your investigation.
    #exit_conversation
    -> hub

=== ask_team_members ===
#speaker:dr_chen
~ topic_team = true
~ chen_influence += 5

Dr. Sarah Chen: Eight people. I recruited most of them myself.

Dr. Sarah Chen: David Torres is my cryptography lead. The best I've worked with.

{chen_influence >= 20:
    Dr. Sarah Chen: He's been distracted. His wife Elena is very ill. It's been hard on him.
    ~ chen_influence += 5
}

-> hub

=== ask_torres ===
#speaker:dr_chen
~ topic_torres_defense = true

Dr. Sarah Chen: David is one of the finest cryptographers in the country.

{chen_influence >= 30:
    Dr. Sarah Chen: I've watched him fight the insurer for months. Every denial letter, he'd come in the next morning and work twice as hard.
    ~ chen_influence += 10
}

-> hub

=== request_research_access ===
#speaker:dr_chen

You: I need to get into the server hallway. Your badge opens it.

{chen_influence >= 25:
    #give_item:keycard:research_lab_badge
    Dr. Sarah Chen: You've been straight with me. Here's my spare.
    Dr. Sarah Chen: Senior badges open the server hallway. Bring it back when you're done.
    ~ chen_influence += 5
    -> hub
- else:
    Dr. Sarah Chen: I don't know you well enough to hand you my access.
    Dr. Sarah Chen: Kevin in IT can sort you out if it's that urgent.
    -> hub
}

=== chen_guilt ===
#speaker:dr_chen
~ told_about_torres = true

Dr. Sarah Chen: I should have seen it. He was pulling away. Working late, alone. Avoiding my eye.

Dr. Sarah Chen: I failed him. As a manager, and as a friend.

+ [ENTROPY picked him because he was drowning. That isn't on you.]
    You: This isn't your fault. They went looking for someone drowning.
    Dr. Sarah Chen: That doesn't make me feel better. But thank you.
    -> torres_defense

+ [He made his choice.]
    You: He made his choice.
    Dr. Sarah Chen: He did. So did they, when they picked him.
    -> hub

=== torres_defense ===
#speaker:dr_chen

Dr. Sarah Chen: What happens to him now?

+ [That depends on him.]
    You: That depends on whether he helps us.
    Dr. Sarah Chen: Will you at least think about his circumstances?
    You: I'll make the call when I'm standing in front of him.
    -> hub

+ [He'll face justice.]
    Dr. Sarah Chen: I understand.
    -> hub
