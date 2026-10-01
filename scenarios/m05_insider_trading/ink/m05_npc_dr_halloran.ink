// ===========================================
// Mission 5: NPC - Dr Ruth Halloran
// Chief Scientist, Project Heisenberg lead
//
// PASS 2: never reaches DONE/END (lesson 21). Her spare badge now opens
// the server hallway (second route beside Owen's clone). The old
// #unlock_room / #unlock_task tags were not engine tags and did nothing.
// Her Heisenberg lines now match the mission's stakes (the 999 dispatch
// rollout), not the pre-alignment "military communications" draft.
// ===========================================

VAR halloran_influence = 0                // 0-100 scale
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
#complete_task:talk_to_dr_halloran
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her mid-forties looks up from a whiteboard dense with lattice notation. Sharp eyes behind glasses.

#speaker:dr_halloran
Dr Ruth Halloran: You're the consultant. Ruth Halloran, Project Heisenberg lead.

Dr Ruth Halloran: I hope you find whoever did this quickly. And I hope you're wrong about my team.

+ [Help me understand what was taken.]
    You: The technical context will help me narrow it down.
    ~ halloran_influence += 10
    -> heisenberg_explanation

+ [I need to interview your team.]
    You: I need to talk to everyone with access to Heisenberg.
    Dr Ruth Halloran: My team didn't do this.
    -> defensive_response

+ [Could you have missed a change in one of them?]
    You: Could you have missed something? Someone behaving differently?
    Dr Ruth Halloran: I know my people.
    ~ halloran_influence -= 5
    -> defensive_response

=== heisenberg_explanation ===
#speaker:dr_halloran
~ topic_heisenberg = true
~ halloran_influence += 5

Dr Ruth Halloran: Heisenberg is quantum-safe key exchange for the new national emergency dispatch network. The system that routes 999 calls.

Dr Ruth Halloran: Lattice-based. Built to survive an attacker with a quantum computer, which is a problem for the 2030s. The problem for tonight is simpler.

{halloran_influence >= 15:
    Dr Ruth Halloran: The keys rotate region by region during the rollout. If someone holds the keys and knows the rotation windows, they don't need to break anything. They just wait.
    Dr Ruth Halloran: People could die waiting for an ambulance. I've done the arithmetic. I try not to.
    ~ halloran_influence += 5
}

-> hub

=== defensive_response ===
#speaker:dr_halloran

Dr Ruth Halloran: My team are brilliant and vetted to the hilt.

Dr Ruth Halloran: If one of them did this, they had a reason. Pressure. Coercion.

+ [I'm not here to judge. I'm here for the truth.]
    ~ halloran_influence += 10
    You: Whoever did this might be a victim too.
    Dr Ruth Halloran: Thank you for saying that.
    -> hub

+ [A reason doesn't make it right.]
    You: They made a choice.
    Dr Ruth Halloran: We're done here.
    ~ halloran_influence -= 10
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:dr_halloran

+ {not topic_heisenberg} [Explain Project Heisenberg to me.]
    -> heisenberg_explanation

+ {not topic_team} [Tell me about your team.]
    -> ask_team_members

+ {not topic_torres_defense and halloran_influence >= 20} [What can you tell me about David Torres?]
    -> ask_torres

+ {not server_badge_obtained and topic_heisenberg} [I need to get onto the server side.]
    -> request_research_access

+ {torres_identified and not told_about_torres} [It's David.]
    -> halloran_guilt

+ [That's all for now.]
    You: That's all for now.
    Dr Ruth Halloran: Good luck with your investigation.
    #exit_conversation
    -> hub

=== ask_team_members ===
#speaker:dr_halloran
~ topic_team = true
~ halloran_influence += 5

Dr Ruth Halloran: Eight people. I recruited most of them myself.

Dr Ruth Halloran: David Torres is my cryptography lead. The best I've worked with.

{halloran_influence >= 20:
    Dr Ruth Halloran: He's been distracted. His wife Elena is very ill. It's been hard on him.
    ~ halloran_influence += 5
}

-> hub

=== ask_torres ===
#speaker:dr_halloran
~ topic_torres_defense = true

Dr Ruth Halloran: David is one of the finest cryptographers in the country.

{halloran_influence >= 30:
    Dr Ruth Halloran: I've watched him fight the insurer for months. Every denial letter, he'd come in the next morning and work twice as hard.
    ~ halloran_influence += 10
}

-> hub

=== request_research_access ===
#speaker:dr_halloran

You: I need to get into the server hallway. Your badge opens it.

{halloran_influence >= 25:
    #give_item:keycard:research_lab_badge
    Dr Ruth Halloran: You've been straight with me. Here's my spare.
    Dr Ruth Halloran: Senior badges open the server hallway. Bring it back when you're done.
    ~ halloran_influence += 5
    -> hub
- else:
    Dr Ruth Halloran: I don't know you well enough to hand you my access.
    Dr Ruth Halloran: Owen in IT can sort you out if it's that urgent.
    -> hub
}

=== halloran_guilt ===
#speaker:dr_halloran
~ told_about_torres = true

Dr Ruth Halloran: I should have seen it. He was pulling away. Working late, alone. Avoiding my eye.

Dr Ruth Halloran: I failed him. As a manager, and as a friend.

+ [ENTROPY picked him because he was drowning. That isn't on you.]
    You: This isn't your fault. They went looking for someone drowning.
    Dr Ruth Halloran: That doesn't make me feel better. But thank you.
    -> torres_defense

+ [He made his choice.]
    You: He made his choice.
    Dr Ruth Halloran: He did. So did they, when they picked him.
    -> hub

=== torres_defense ===
#speaker:dr_halloran

Dr Ruth Halloran: What happens to him now?

+ [That depends on him.]
    You: That depends on whether he helps us.
    Dr Ruth Halloran: Will you at least think about his circumstances?
    You: I'll make the call when I'm standing in front of him.
    -> hub

+ [He'll face justice.]
    Dr Ruth Halloran: I understand.
    -> hub
