// ===========================================
// ACT 2 NPC: Dr. Sarah Kim (Hospital CTO)
// Mission 2: Ransomed Trust
// Break Escape - Desperate Authority Figure
// ===========================================

// Variables for tracking player relationship and topics
VAR kim_influence = 0             // 0-100 trust/rapport with Dr. Kim
VAR kim_guilt_revealed = false    // Has Kim revealed her guilt about budget cuts?
VAR topic_attack_vector = false   // Discussed how attack happened
VAR topic_marcus = false          // Discussed Marcus Webb
VAR topic_ransom_vote = false     // Discussed board ransom vote
VAR topic_budget = false          // Discussed budget cuts
VAR player_warned_kim = false     // Player warned Kim about scapegoating Marcus

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
#speaker:dr_kim

{objectives_completed == 0:
    -> first_meeting
}
{objectives_completed > 0 and objectives_completed < 5:
    -> mid_mission_checkin
}
{objectives_completed >= 5:
    -> late_mission_update
}

=== first_meeting ===
#speaker:dr_kim

Dr. Kim: Thank god you're here. We're running out of time.

Dr. Kim: 47 patients on backup power. If we don't restore systems in 12 hours...

Dr. Kim: The board is voting on paying the ransom in 4 hours. I need your opinion.

* [Ask about the attack]
    You: Tell me what happened. How did they get in?
    ~ kim_influence += 5
    -> explain_attack

* [Offer reassurance]
    You: We'll get those systems back. That's why I'm here.
    ~ kim_influence += 10
    Dr. Kim: I hope you're right. Those are real people.
    -> explain_attack

* [Ask about the board vote]
    You: Why are they voting so quickly?
    ~ kim_influence += 5
    -> explain_board_vote

=== explain_attack ===
#speaker:dr_kim
~ topic_attack_vector = true

Dr. Kim: Our IT admin, Marcus, kept warning us about some FTP vulnerability.

Dr. Kim: CVE-2010-4652. He wanted an $85,000 server upgrade.

Dr. Kim: We... we deferred it. Budget cuts.

* [Press about budget cuts]
    You: Why defer cybersecurity?
    ~ topic_budget = true
    -> reveal_budget_guilt

* [Ask about Marcus]
    You: Where's Marcus now?
    ~ topic_marcus = true
    -> discuss_marcus

* [Focus on recovery]
    You: We need to focus on recovery. Where's your IT department?
    -> grant_access

=== reveal_budget_guilt ===
#speaker:dr_kim
~ kim_guilt_revealed = true
~ kim_influence += 5

Dr. Kim: I recommended those budget cuts. The $85,000 Marcus wanted for server security.

Dr. Kim: We bought a $3.2 million MRI instead. State-of-the-art equipment.

Dr. Kim: Now people might die because I chose shiny technology over unsexy cybersecurity.

* [Sympathize]
    You: You made a decision based on patient care priorities. You couldn't have known.
    ~ kim_influence += 10
    Dr. Kim: That's... thank you. But I should have listened.
    -> hub

* [Stay professional]
    You: The past doesn't matter now. Let's focus on recovery.
    ~ kim_influence += 5
    Dr. Kim: Right. Professional. I appreciate that.
    -> hub

* [Challenge the decision]
    You: $85K vs. patient data security. That was a risky choice.
    ~ kim_influence -= 10
    Dr. Kim: I... I know. I know.
    -> hub

=== discuss_marcus ===
#speaker:dr_kim
~ topic_marcus = true

Dr. Kim: Marcus is devastated. Blaming himself.

Dr. Kim: The board... they're planning to blame him too. Scapegoat.

Dr. Kim: But he warned us. He did everything right.

* [Offer to protect Marcus]
    You: I'll make sure the evidence shows Marcus warned you. He shouldn't take the fall.
    ~ kim_influence += 15
    ~ player_warned_kim = true
    Dr. Kim: Thank you. He deserves better than this.
    #complete_task:learn_about_scapegoating
    -> hub

* [Stay neutral]
    You: Let's focus on the mission first.
    ~ kim_influence += 0
    Dr. Kim: Of course. IT Department is down the hall.
    -> hub

* [Suggest Marcus share responsibility]
    You: He's the IT admin. He has some responsibility here.
    ~ kim_influence -= 15
    Dr. Kim: No. We ignored him. This isn't his fault.
    -> hub

=== explain_board_vote ===
#speaker:dr_kim
~ topic_ransom_vote = true

Dr. Kim: Board members are terrified. Malpractice lawsuits, patient deaths, reputation damage.

Dr. Kim: $87,000 seems cheap compared to those risks.

Dr. Kim: But... we'd be funding terrorists. Criminals. What do I tell them?

* [Advise paying ransom]
    You: Patient lives come first. Pay if necessary.
    ~ kim_influence += 5
    Dr. Kim: That's my medical training talking too. "Do no harm."
    -> hub

* [Advise against ransom]
    You: Don't fund ENTROPY. They'll use it for the next attack.
    ~ kim_influence += 5
    Dr. Kim: Long-term thinking. But those are real lives today.
    -> hub

* [Leave decision to her]
    You: That's your call, Dr. Kim. I'm here to find the decryption keys.
    ~ kim_influence += 10
    Dr. Kim: Fair enough. Let me give you access to IT systems.
    -> grant_access

=== grant_access ===
#speaker:dr_kim

Dr. Kim: I'm authorizing full access. IT Department, server room, administrative records.

Dr. Kim: Do whatever you need. Just save those patients.

#complete_task:meet_dr_kim
#unlock_aim:access_it_systems
#give_item:hospital_admin_access_badge

-> hub

// ===========================================
// CONVERSATION HUB (Repeatable Dialogue)
// ===========================================

=== hub ===
+ {not topic_attack_vector} [Ask about the attack]
    -> explain_attack

+ {not topic_marcus} [Ask about Marcus Webb]
    -> discuss_marcus

+ {not topic_ransom_vote} [Ask about the board vote]
    -> explain_board_vote

+ {not topic_budget and topic_marcus} [Ask about budget priorities]
    ~ topic_budget = true
    -> reveal_budget_guilt

+ {topic_marcus and not player_warned_kim} [Offer to protect Marcus]
    You: I can document Marcus's warnings. Make sure he's not scapegoated.
    ~ kim_influence += 15
    ~ player_warned_kim = true
    Dr. Kim: Thank you. He deserves better.
    #complete_task:learn_about_scapegoating
    -> hub

+ [Leave conversation]
    #speaker:dr_kim
    Dr. Kim: Good luck. We're counting on you.
    #exit_conversation
    -> DONE

// ===========================================
// MID-MISSION CHECK-IN
// ===========================================

=== mid_mission_checkin ===
#speaker:dr_kim

Dr. Kim: Any progress?

{objectives_completed >= 2:
    Dr. Kim: I see you're making headway. Thank you.
}
{objectives_completed < 2:
    Dr. Kim: Time's running out. Board votes in less than 2 hours now.
}

+ [Report findings]
    You: I've accessed the IT systems. Working on recovery.
    ~ kim_influence += 5
    Dr. Kim: Good. Keep going.
    -> hub

+ [Ask for update]
    You: How are the patients?
    Dr. Kim: Stable for now. Backup power holding. But every hour increases risk.
    -> hub

+ [Continue mission]
    You: I need to keep working.
    Dr. Kim: Of course. Go.
    #exit_conversation
    -> DONE

// ===========================================
// LATE MISSION UPDATE
// ===========================================

=== late_mission_update ===
#speaker:dr_kim

Dr. Kim: The board is meeting right now. Have you found the decryption keys?

{objectives_completed >= 6:
    Dr. Kim: I see you've made significant progress. What do I tell the board?
    -> ransom_decision_input
}
{objectives_completed < 6:
    Dr. Kim: We're running out of time. What should I tell them?
    -> ransom_decision_input
}

=== ransom_decision_input ===
#speaker:dr_kim

+ [Advise paying ransom for patient safety]
    You: Pay the ransom. Patient lives come first.
    Dr. Kim: My instinct too. Thank you.
    ~ kim_influence += 10
    -> hub

+ [Advise independent recovery]
    You: Don't pay. We can recover independently.
    Dr. Kim: That's... a risk. But I trust your judgment.
    ~ kim_influence += 5
    -> hub

+ [Leave decision to board]
    You: That's the board's decision, not mine.
    Dr. Kim: Fair enough.
    -> hub

+ [Continue mission]
    #exit_conversation
    -> DONE
