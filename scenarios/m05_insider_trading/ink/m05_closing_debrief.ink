// ===========================================
// Mission 5: Closing Debrief - Act 3
// Reflects on player choices and mission outcome.
//
// PASS 2:
// - The case is read from found_* booleans and flags. evidence_level and
//   lore_collected never counted (the engine assigns setVariable values
//   literally), so every run used to land in the "thin case" branch.
// - Each ending has its own authored branch; combat_nonlethal no longer
//   borrows the "he lawyered up" text, and the combat_lethal branch matches
//   what the player actually did (left him on the floor).
// - The Recruiter's offer now has a consequence here and in the credits.
// - Meta references ("Mission 6", "Missions 6 through 10") are in-world.
// - Linear person-chat cutscene (hidden NPC, the m02/m04 pattern): it ends
//   the mission, so it terminates at END. debrief_played stops a replay.
// - Canon (review M2): SAFETYNET has no arrest powers. Torres is handed to
//   the police via Patricia; sentencing is not SAFETYNET's to promise.
// ===========================================

// Act 1 (opening)
VAR player_approach = "" // cautious, aggressive, diplomatic
VAR knows_full_stakes = false
VAR handler_trust = 50

// Act 2 (the case)
VAR found_pamphlet = false
VAR found_incident_log = false
VAR found_vetting_file = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_upload_schedule = false
VAR found_manifest = false
VAR flag3_submitted = false
VAR flag4_submitted = false

// Act 3 (confrontation)
VAR final_choice = "" // turn_double_agent, arrest, combat_nonlethal, combat_lethal, public_exposure
VAR confront_stance = "" // sympathetic or hardline
VAR elena_treatment_funded = false
VAR recruiter_deal_offered = false
VAR recruiter_deal_accepted = false
VAR recruiter_deal_decided = false
VAR found_pipeline_list = false
VAR debrief_played = false
VAR recruiter_deal_confessed = false
VAR found_stand_down_email = false

VAR player_name = "Agent 0x00"

=== function case_strength()
~ temp n = 0
{found_pamphlet:
    ~ n = n + 1
}
{found_incident_log:
    ~ n = n + 1
}
{found_vetting_file:
    ~ n = n + 1
}
{found_medical_bills:
    ~ n = n + 1
}
{found_torres_journal:
    ~ n = n + 1
}
{found_upload_schedule:
    ~ n = n + 1
}
{found_manifest:
    ~ n = n + 1
}
{flag3_submitted:
    ~ n = n + 1
}
{flag4_submitted:
    ~ n = n + 1
}
~ return n

// ===========================================
// DEBRIEF START
// ===========================================

=== start ===
~ debrief_played = true
#speaker:narrator
Narrator: SAFETYNET headquarters. Thursday morning, nine o'clock.

Narrator: You sit across from Agent HaX. The mission report is up on the screen.

#speaker:agent_0x99
Agent HaX: {player_name}. Let's go through it.

-> mission_outcome_assessment

// ===========================================
// THE CASE
// ===========================================

=== mission_outcome_assessment ===
#speaker:agent_0x99

{case_strength() >= 7:
    Agent HaX: The file on this is the best we've had on the Initiative. Motive, means, the Architect's signature, and the recruiter's calling card. Nobody's arguing with it.
- else:
    {case_strength() >= 4:
        Agent HaX: You built enough to move, and you closed it. There are gaps in the file, but it'll stand.
    - else:
        Agent HaX: You stopped the upload. The file behind it is thin. The police will get what we send them, and it won't be much.
    }
}

{found_stand_down_email:
    Agent HaX: Patricia's copy of the CEO's email went to the Home Office review with the rest of the file. Nobody signs off on a stand-down like that twice.
- else:
    Agent HaX: QDC's readiness review passed. Nobody asked who cancelled Patricia's interview.
}

{player_approach == "cautious":
    Agent HaX: You said you'd be methodical. You were.
}
{player_approach == "aggressive":
    Agent HaX: You said fast and direct. You were, and it held.
}
{player_approach == "diplomatic":
    Agent HaX: You said you'd read the room. You did.
}

Agent HaX: The final upload: stopped at 97%. The key material left in pieces over six weeks, but the rotation windows never went. Without those, what they have is a very expensive paperweight.

{knows_full_stakes:
    Agent HaX: Those thirty to forty-five people who'd have waited too long for an ambulance? They'll never know. That's how it's supposed to work.
}

-> torres_outcome

// ===========================================
// TORRES OUTCOME
// ===========================================

=== torres_outcome ===
#speaker:agent_0x99

Agent HaX: And David Torres...

{final_choice == "turn_double_agent":
    -> torres_turned_path
}
{final_choice == "combat_lethal":
    -> torres_killed_path
}
{final_choice == "public_exposure":
    -> public_exposure_path
}
{final_choice == "combat_nonlethal":
    -> torres_subdued_path
}
{final_choice == "arrest" and elena_treatment_funded:
    -> torres_arrested_with_treatment_path
}
-> torres_arrested_no_treatment_path

// ===========================================
// PATH 1: TURNED
// ===========================================

=== torres_turned_path ===
#speaker:agent_0x99

Agent HaX: You turned him. High risk, high reward.

Agent HaX: Elena starts the trial on Monday. We're paying, quietly, and if it ever gets dangerous we can move the family.

Agent HaX: In exchange, he gives us the Insider Threat Initiative from the inside.

+ [What have we got from him so far?]
    -> torres_intelligence_gained

+ [Can we trust him?]
    -> torres_trust_question

=== torres_intelligence_gained ===
#speaker:agent_0x99

Agent HaX: Twenty-three active placements. He's giving us the companies, and some of the names.

{found_pipeline_list:
    Agent HaX: And the forty-seven on that TalentStack list. We're getting to them before the Recruiter does.
- else:
    Agent HaX: He's met some of the Recruiter's other candidates. Not all forty-seven, but it's a start.
}

Agent HaX: And how TalentStack actually works: the front, the payments, the approach.

-> recruiter_reckoning

=== torres_trust_question ===
#speaker:agent_0x99

Agent HaX: He's motivated. Elena's treatment depends on him.

Agent HaX: And you got him early. Three months in, not three years. He still knows it was wrong. We can work with that.

Agent HaX: If he wobbles, we'll know. That's the job now.

-> recruiter_reckoning

// ===========================================
// PATH 2: LEFT ON THE FLOOR
// ===========================================

=== torres_killed_path ===
#speaker:agent_0x99

Agent HaX: David Torres is dead.

Agent HaX: He hit his head on the rack when he went down. You killed the upload and walked out. Nobody found him until Patricia went looking, forty minutes later.

Agent HaX: The pathologist thinks twenty minutes would have been enough.

+ [He came at me. I stopped the upload.]
    You: He attacked me. I did what the mission needed.
    -> torres_tactical_discussion

+ [I should have stayed with him.]
    You: I should have stayed. I know.
    -> torres_weight_discussion

=== torres_tactical_discussion ===
#speaker:agent_0x99

Agent HaX: The upload was the priority. Nobody will argue that.

Agent HaX: But there was a gap between stopping it and walking away, and a man died in it. The review board will ask about that gap.

-> torres_family_impact

=== torres_weight_discussion ===
#speaker:agent_0x99

Agent HaX: Yes. You should have.

Agent HaX: He'd been ENTROPY's for three months. He was also a husband and a father. Both of those were true on the floor of that data centre.

-> torres_family_impact

=== torres_family_impact ===
#speaker:agent_0x99

Agent HaX: Elena Torres is a widow now, still fighting Stage 3 cancer. No treatment, no protection.

Agent HaX: Sofia is eleven. Miguel is eight.

Agent HaX: And everything he knew about the Initiative died with him. We're mapping it the hard way now.

-> recruiter_reckoning

// ===========================================
// PATH 3: SUBDUED
// ===========================================

=== torres_subdued_path ===
#speaker:agent_0x99

Agent HaX: Detained after a fight. You stayed with him, kept his airway clear, and Patricia brought the police and an ambulance. Textbook, once it came to that.

Agent HaX: He woke up in hospital under police guard, angry, and he hasn't said a word to anyone since. What happens to him now is up to them.

Agent HaX: Elena's treatment is unfunded. He never talked to us, so there's no deal to hang it on.

+ [He chose to fight.]
    You: He chose to fight. I gave him the chance to step away.
    Agent HaX: You did. And now we're both living with what came after.
    -> recruiter_reckoning
+ [Is there still a way to get him talking?]
    You: Is there any way back to a cooperation deal?
    Agent HaX: Not through us. He's in the police's hands now, and we don't get to walk into their interview rooms.
    -> recruiter_reckoning

// ===========================================
// PATH 4: ARRESTED (no cooperation)
// ===========================================

=== torres_arrested_no_treatment_path ===
#speaker:agent_0x99

Agent HaX: You held him and Patricia called the police. He hasn't said a word to them or to us.

Agent HaX: Our evidence reached them without our name on it. What a court gives him is out of our hands.

Agent HaX: Elena's treatment is unfunded. She has months, maybe. Sofia and Miguel may watch that with their father on remand.

+ [Justice has costs.]
    You: He did this. Actions have consequences.
    Agent HaX: They do. For everyone near him.
    -> campaign_impact_arrested_no_coop

+ [That's not on me.]
    You: I did my job. The rest isn't my department.
    Agent HaX: I know that's what you said to him. I'm not sure it's true.
    -> campaign_impact_arrested_no_coop

=== campaign_impact_arrested_no_coop ===
#speaker:agent_0x99

Agent HaX: Without him, we're blind on the Initiative. The placements carry on. The forty-seven stay in the pipeline until we find them ourselves.

-> recruiter_reckoning

// ===========================================
// PATH 5: ARRESTED (with cooperation)
// ===========================================

=== torres_arrested_with_treatment_path ===
#speaker:agent_0x99

Agent HaX: He talked to you before the police arrived. Everything he knows about the Initiative, in exchange for Elena's treatment.

Agent HaX: She starts on Monday, and we're paying. What happens to him is the court's business now. We couldn't promise him anything there, and you didn't.

Agent HaX: His family gets through this. The kids have a chance.

Agent HaX: It's less than a double agent would give us. It's a great deal more than nothing, and it's clean.

-> recruiter_reckoning

// ===========================================
// PATH 6: PUBLIC EXPOSURE
// ===========================================

=== public_exposure_path ===
#speaker:agent_0x99

Agent HaX: You went public.

Agent HaX: The Insider Threat Initiative is front-page news. TalentStack's offices are empty. The police picked Torres up the next morning.
{found_pipeline_list:
    Agent HaX: We rang the forty-seven on that list before the story broke. Most of them had never heard of ENTROPY. They have now.
}

Agent HaX: The twenty-three placements are blown. Their employers are running their own investigations.

+ [It was the only way to burn the programme.]
    You: It was the only way to make sure they can't rebuild it.
    -> public_exposure_consequence

+ [They needed to see it cost them.]
    You: ENTROPY needed to see this cost them something.
    -> public_exposure_consequence

=== public_exposure_consequence ===
#speaker:agent_0x99

Agent HaX: It worked. The Initiative is finished in this country, for now.

Agent HaX: And David Torres is "The Quantum Traitor". Sofia and Miguel's classmates have seen their father's face on the news.

Agent HaX: Elena is reading about it from a hospital bed.

{handler_trust >= 60:
    Agent HaX: You put the programme ahead of the man. I understand the logic.
- else:
    Agent HaX: A strategic win, at a human cost. That's the trade you made.
}

Agent HaX: Expect them to hit back. You made them look weak, and they won't forget it.

-> recruiter_reckoning

// ===========================================
// THE RECRUITER'S OFFER
// ===========================================

=== recruiter_reckoning ===
#speaker:agent_0x99

{not recruiter_deal_offered:
    -> entropy_revelation
}
{not recruiter_deal_decided and not recruiter_deal_accepted:
    Agent HaX: And the Recruiter. She rang you and made you an offer. You never gave her an answer.
    Agent HaX: Silence isn't a yes, and she'll know that by now.
    {found_pipeline_list:
        Agent HaX: The TalentStack list went into your report. We've reached three of the forty-seven already.
    - else:
        Agent HaX: We never found the list she was protecting. Her courier probably has it by now.
    }
    -> entropy_revelation
}
{not recruiter_deal_accepted:
    Agent HaX: And the Recruiter. She rang you, she made you an offer, and you turned her down.
    {found_pipeline_list:
        Agent HaX: The TalentStack list went into your report. We've reached three of the forty-seven already. That's three she doesn't get.
    - else:
        Agent HaX: We never found the list she was protecting. Her courier probably has it by now. Still, you didn't sell.
    }
    -> entropy_revelation
}

Agent HaX: One more thing. Your report doesn't mention the Recruiter's call.

Agent HaX: The phone logs do. Four minutes, from a TalentStack number, right after you named him.

+ [She offered me a deal. I took it.]
    ~ recruiter_deal_confessed = true
    You: She offered to keep me out of it if the list stayed with her. I said yes.
    Agent HaX: ...Thank you for telling me. That's the only reason this stays between us.
    {found_pipeline_list:
        Agent HaX: The list goes in today. It's late, and some of those forty-seven will already have signed. That's on the record now, and on you.
    - else:
        Agent HaX: Whatever that list was, it's with her courier now. That's on the record, and on you.
    }
    ~ handler_trust = handler_trust - 10
    -> entropy_revelation

+ [It was nothing. A sales pitch.]
    You: A sales pitch. I hung up.
    Agent HaX: Four minutes is a long sales pitch.
    Agent HaX: I'll leave it there. For now.
    ~ handler_trust = handler_trust - 25
    -> entropy_revelation

// ===========================================
// ENTROPY REVELATION
// ===========================================

=== entropy_revelation ===
#speaker:agent_0x99

{flag4_submitted:
    Agent HaX: The Architect's authorisation is the part I keep coming back to. A casualty projection, reviewed, and filed as an acceptable cost.
- else:
    Agent HaX: We never got the authorisation off that server. Somebody above the Recruiter signed this off, and we can't prove who.
}

Agent HaX: Ransomware Incorporated. Zero Day Syndicate. Critical Mass. Now the Insider Threat Initiative.

Agent HaX: The cells share suppliers, targets and a signature. The Architect runs them like a business, and pays them like one: the Initiative was given eight hundred and forty-seven thousand dollars for this job alone.

-> future_implications

// ===========================================
// FUTURE IMPLICATIONS & CLOSURE
// ===========================================

=== future_implications ===
#speaker:agent_0x99

{final_choice == "turn_double_agent":
    Agent HaX: Torres is an asset now. We'll be leaning on him for months.
}
{final_choice == "combat_lethal" or final_choice == "combat_nonlethal" or (final_choice == "arrest" and not elena_treatment_funded):
    Agent HaX: We'll map the Initiative the slow way. Harder, but doable.
}
{final_choice == "public_exposure":
    Agent HaX: ENTROPY will escalate. They're wounded, not finished.
}

Agent HaX: Every one of these operations has been paid for by someone. Next, we follow the money.

{final_choice == "turn_double_agent" or elena_treatment_funded:
    Agent HaX: Torres knows how TalentStack paid him. That's a thread we can pull.
}

-> final_reflection

=== final_reflection ===
#speaker:agent_0x99

Agent HaX: {player_name}, one last thing.

Agent HaX: There was never a clean way to handle Torres. How you handled him tells me what kind of agent you are.

{confront_stance == "sympathetic":
    Agent HaX: You went looking for the man underneath. That mattered, whatever you decided in the end.
}
{confront_stance == "hardline":
    Agent HaX: You never let him hide behind his story. Cold, maybe. But you saw it clearly.
}

{handler_trust >= 70:
    Agent HaX: I trust your judgement. Last night proved that.
- else:
    {handler_trust >= 50:
        Agent HaX: You made hard calls. I respect that.
    - else:
        Agent HaX: The job got done. We'll talk about the rest another time.
    }
}

-> mission_end

=== mission_end ===
#speaker:agent_0x99

Agent HaX: Get some rest. Take the rest of the day.

{knows_full_stakes:
    Agent HaX: And {player_name}? The people who'd have waited too long for that ambulance will never know your name. But they're alive.
}

// The conclusion task completes HERE, at the end of the debrief, so the
// bond_visualiser screen is raised after the player has heard it (m04 pattern).
#complete_task:hear_debrief
Agent HaX: Good work.

#exit_conversation
-> END
