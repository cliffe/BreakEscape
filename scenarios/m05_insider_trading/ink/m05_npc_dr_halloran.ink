// ===========================================
// Mission 5: NPC - Dr Ruth Halloran
// Chief Scientist, Project Heisenberg lead
//
// PASS 2: never reaches DONE/END (lesson 21). Her spare badge now opens
// the server hallway (second route beside Owen's clone). The old
// #unlock_room / #unlock_task tags were not engine tags and did nothing.
// Her Heisenberg lines now match the mission's stakes (the 999 dispatch
// rollout), not the pre-alignment "military communications" draft.
//
// PASS 4 (whodunnit): she is the red herring. Asked about her spare badge
// (the night log), she gives her Zurich alibi, says where the spare hangs,
// and who works in her lab late. That clears her. Round 2: it no longer
// sets torres_suspected on its own (the player still has to make the case).
// If the player accused her first, she's suspended and says so, still
// answers, and won't hand over her spare.
//
// PASS 4 (dialogue): hub_quiet gives the hub a re-entry line (m03 pattern).
// It is also set before the hub after the scenes that end on a hard line
// (her suspension, the alibi, the news about David), so "What else?"
// doesn't follow "Oh, no."
// ===========================================

VAR halloran_influence = 0                // 0-100 scale
VAR topic_heisenberg = false
VAR topic_team = false
VAR topic_torres_defense = false
VAR told_about_torres = false
VAR first_meeting = true
VAR accused_acknowledged = false
VAR hub_quiet = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR server_badge_obtained = false
VAR found_door_log = false
VAR found_halloran_alibi = false
VAR halloran_questioned = false
VAR halloran_accused = false
VAR torres_suspected = false
VAR door_log_reasoned = false
VAR patricia_ko = false

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_dr_halloran
{halloran_accused and not accused_acknowledged:
    ~ accused_acknowledged = true
    ~ first_meeting = false
    -> accused_greeting
}
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her mid-forties looks up from a whiteboard dense with lattice notation.

#speaker:dr_halloran
Dr Ruth Halloran: You're the consultant. Ruth Halloran. I run Heisenberg.

Dr Ruth Halloran: Find whoever did this, and quickly. And I hope to God you're wrong about my team.

+ [Walk me through what was taken. It'll help me narrow it down.]
    ~ halloran_influence += 10
    -> heisenberg_explanation

+ [I need to talk to everyone with access to Heisenberg.]
    Dr Ruth Halloran: My team didn't do this.
    -> defensive_response

+ [Could you have missed someone behaving differently?]
    Dr Ruth Halloran: I know my people.
    ~ halloran_influence -= 5
    -> defensive_response

=== heisenberg_explanation ===
#speaker:dr_halloran
~ topic_heisenberg = true
~ halloran_influence += 5

Dr Ruth Halloran: Heisenberg is quantum-safe key exchange for the new national emergency dispatch network. The system that routes 999 calls.

Dr Ruth Halloran: Lattice-based, built to survive a quantum computer. That's a problem for the 2030s. Tonight's problem is simpler.

{halloran_influence >= 15:
    Dr Ruth Halloran: The keys rotate region by region during the rollout. Hold the keys, know the windows, and you don't need to break anything. You wait.
    Dr Ruth Halloran: People could die waiting for an ambulance. I've done the arithmetic. I try not to look at it.
    ~ halloran_influence += 5
}

-> hub

=== defensive_response ===
#speaker:dr_halloran

Dr Ruth Halloran: My team are brilliant, and vetted to the hilt.

Dr Ruth Halloran: If one of them did this, somebody gave them a reason. Pressure. Coercion.

+ [I'm not here to judge. Whoever did this might be a victim too.]
    ~ halloran_influence += 10
    Dr Ruth Halloran: Thank you. Not many in your line would say that.
    -> hub

+ [A reason doesn't make it right. They made a choice.]
    Dr Ruth Halloran: We're done here.
    ~ halloran_influence -= 10
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:dr_halloran
{hub_quiet:
    ~ hub_quiet = false
- else:
    Dr Ruth Halloran: {&What else?|Go on, so.|Quickly, please. I've work to do.}
}

+ {not topic_heisenberg} [What exactly is Heisenberg?]
    -> heisenberg_explanation

+ {not topic_team} [Tell me about your team.]
    -> ask_team_members

+ {topic_team and not topic_torres_defense and halloran_influence >= 20} [What can you tell me about David Torres?]
    -> ask_torres

+ {found_door_log and not halloran_questioned} [Your spare badge has been through the server hallway at night. Four times.]
    -> spare_badge

+ {not server_badge_obtained and topic_heisenberg and not halloran_accused} [I need into the server hallway. Your badge opens it.]
    -> request_research_access

+ {torres_identified and not told_about_torres} [It's David.]
    -> halloran_guilt

+ [That's all for now.]
    Dr Ruth Halloran: Good luck. I mean that.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_team_members ===
#speaker:dr_halloran
~ topic_team = true
~ halloran_influence += 5

Dr Ruth Halloran: Eight people. I hired most of them myself.

Dr Ruth Halloran: Amara and Tomasz could rebuild the key exchange from memory. David Torres is my cryptography lead, the best I've worked with.

{halloran_influence >= 20:
    Dr Ruth Halloran: Ben's frightened of falling behind. David's had a hard year at home. I've carried both of them.
    ~ halloran_influence += 5
}

-> hub

=== ask_torres ===
#speaker:dr_halloran
~ topic_torres_defense = true

Dr Ruth Halloran: David made Heisenberg work. Two years of his life are in that key exchange.

{halloran_influence >= 30:
    Dr Ruth Halloran: I've watched him fight the insurer for months. Every denial letter, he'd come in next morning and work twice as hard.
    ~ halloran_influence += 10
}

-> hub

=== request_research_access ===
#speaker:dr_halloran

{halloran_influence >= 25:
    #give_item:keycard:research_lab_badge
    Dr Ruth Halloran: You've been straight with me. Here's my spare.
    Dr Ruth Halloran: Senior badges open the server hallway. Bring it back when you're done.
    ~ halloran_influence += 5
    -> hub
- else:
    Dr Ruth Halloran: I don't know you well enough to hand you my access.
    Dr Ruth Halloran: Owen in IT can sort you out, if it's that urgent.
    -> hub
}

=== accused_greeting ===
#speaker:narrator
Narrator: Dr Halloran sits at her bench with her coat on, as if she's been told to wait.
#speaker:dr_halloran
Dr Ruth Halloran: Security have suspended my access. I'm to wait here for the police. On your say-so, I gather.
Dr Ruth Halloran: Ask what you came to ask.
~ hub_quiet = true
-> hub

=== spare_badge ===
#speaker:dr_halloran
~ halloran_questioned = true
~ found_halloran_alibi = true
Dr Ruth Halloran: My spare? It hangs on the hook by the door, for visitors. I haven't touched it in months.
Dr Ruth Halloran: The twenty-third I was in Zurich, giving a paper to two hundred people. The lanyard's on my monitor.
Dr Ruth Halloran: Who's in here after hours? Amara some evenings, but she's gone by ten. David, mostly. He says the lab's quieter than his office.
Dr Ruth Halloran: ...Oh. Oh, no.
~ hub_quiet = true
-> hub

=== halloran_guilt ===
#speaker:dr_halloran
~ told_about_torres = true
{halloran_accused:
    {patricia_ko:
        Dr Ruth Halloran: Security have given me my access back. I'll want an apology from you. Not tonight.
    - else:
        Dr Ruth Halloran: Patricia's given me my access back. I'll want an apology from you. Not tonight.
    }
}

Dr Ruth Halloran: I should have seen it. He was pulling away. Working late, alone. Avoiding my eye.

Dr Ruth Halloran: I failed him. As his manager, and as his friend.

+ [ENTROPY picked him because he was drowning. That isn't on you.]
    Dr Ruth Halloran: It doesn't help. Thank you anyway.
    -> torres_defense

+ [He made his choice.]
    Dr Ruth Halloran: He did. So did they, when they picked him.
    ~ hub_quiet = true
    -> hub

=== torres_defense ===
#speaker:dr_halloran

Dr Ruth Halloran: What happens to him now?

+ [That depends on whether he helps us.]
    Dr Ruth Halloran: Then think about his circumstances when you're in front of him. Please.
    ~ hub_quiet = true
    -> hub

+ [He'll face justice.]
    Dr Ruth Halloran: *quietly* I suppose he will.
    ~ hub_quiet = true
    -> hub
