// ===========================================
// Mission 5: Closing Debrief - Act 3
// Reflects on player choices and mission outcome
// ===========================================

// Variables from Act 1 (Opening)
EXTERNAL player_approach            // cautious, aggressive, diplomatic
EXTERNAL mission_priority           // thoroughness, speed, stealth
EXTERNAL knows_full_stakes          // Did player ask about casualties?
EXTERNAL handler_trust              // 0-100 Agent 0x99 trust

// Variables from Act 2 (Investigation)
EXTERNAL objectives_completed       // Number completed
EXTERNAL lore_collected            // Number of LORE fragments
EXTERNAL evidence_level            // 0-7+ evidence quality

// Variables from Act 3 (Confrontation)
EXTERNAL final_choice              // turn_double_agent, arrest, combat_nonlethal, combat_lethal, public_exposure
EXTERNAL torres_turned
EXTERNAL torres_arrested
EXTERNAL torres_killed
EXTERNAL elena_treatment_funded
EXTERNAL entropy_program_exposed

EXTERNAL player_name

// ===========================================
// DEBRIEF START
// ===========================================

=== start ===
#speaker:narrator

[Location: SAFETYNET Headquarters, Debrief Room]
[Time: Saturday morning, 9:00 AM]

You sit across from Agent 0x99. Mission report displayed on screen.

#speaker:agent_0x99
#display:agent-professional

Agent 0x99: {player_name}. Mission complete.

Agent 0x99: Let's go through what happened.

-> mission_outcome_assessment

// ===========================================
// MISSION OUTCOME ASSESSMENT
// ===========================================

=== mission_outcome_assessment ===
#speaker:agent_0x99

{objectives_completed >= 3:
    Agent 0x99: All primary objectives completed. Operation Schrödinger stopped.
    -> full_success_path
}

{objectives_completed == 2:
    Agent 0x99: Two objectives completed. Partial success.
    -> partial_success_path
}

{objectives_completed < 2:
    Agent 0x99: Minimal objectives achieved. This could have gone better.
    -> minimal_success_path
}

=== full_success_path ===
#speaker:agent_0x99

Agent 0x99: You identified the insider. Stopped the final exfiltration.

{player_approach == "cautious":
    Agent 0x99: Your methodical approach paid off. Nothing was missed.
}

{player_approach == "aggressive":
    Agent 0x99: You moved fast and got results. Efficient work.
}

{player_approach == "diplomatic":
    Agent 0x99: Your adaptability made the difference. You read the situation perfectly.
}

-> exfiltration_prevented

=== partial_success_path ===
#speaker:agent_0x99

Agent 0x99: The core threat was neutralized, but we left gaps.

{evidence_level < 4:
    Agent 0x99: Evidence collection could have been stronger.
}

-> exfiltration_prevented

=== minimal_success_path ===
#speaker:agent_0x99

Agent 0x99: You stopped the immediate threat. That matters.

Agent 0x99: But we missed opportunities for larger intelligence gains.

-> exfiltration_prevented

// ===========================================
// EXFILTRATION STATUS
// ===========================================

=== exfiltration_prevented ===
#speaker:agent_0x99

Agent 0x99: Final data exfiltration: PREVENTED

Agent 0x99: 73% of Project Heisenberg was already stolen. But the last 27%—

Agent 0x99: DoD deployment schedules. Zero-day exploits. Installation timelines.

Agent 0x99: That 27% would have caused the casualties. You saved it.

{knows_full_stakes:
    Agent 0x99: Those 12 to 40 intelligence officers? Still alive. Because of you.
}

-> torres_outcome

// ===========================================
// TORRES OUTCOME (5 Paths)
// ===========================================

=== torres_outcome ===
#speaker:agent_0x99

Agent 0x99: And David Torres...

{torres_turned:
    -> torres_turned_path
}

{torres_killed:
    -> torres_killed_path
}

{torres_arrested and not elena_treatment_funded:
    -> torres_arrested_no_treatment_path
}

{torres_arrested and elena_treatment_funded:
    -> torres_arrested_with_treatment_path
}

{entropy_program_exposed:
    -> public_exposure_path
}

// ===========================================
// PATH 1: TORRES TURNED (S-Rank)
// ===========================================

=== torres_turned_path ===
#speaker:agent_0x99

Agent 0x99: You turned him. Double agent status.

Agent 0x99: That was the high-risk, high-reward play.

{elena_treatment_funded:
    Agent 0x99: Elena Torres starts treatment Monday. Experimental therapy, SAFETYNET-funded.
    Agent 0x99: Witness protection covers everything.
}

Agent 0x99: In exchange, Torres gives us ENTROPY's entire Insider Threat Initiative.

+ [What have we learned so far?]
    -> torres_intelligence_gained

+ [Can we trust him?]
    -> torres_trust_question

=== torres_intelligence_gained ===
#speaker:agent_0x99

Agent 0x99: 23 active insider placements. He's giving us companies, names, timelines.

Agent 0x99: 47 additional targets under evaluation. We're warning them before ENTROPY makes contact.

Agent 0x99: The Recruiter's operational methods. TalentStack Executive Recruiting as cover.

{handler_trust >= 60:
    Agent 0x99: This is massive intelligence, {player_name}. Strategic victory.
}

-> campaign_impact_turned

=== torres_trust_question ===
#speaker:agent_0x99

Agent 0x99: He's motivated. Elena's life depends on his cooperation.

Agent 0x99: And you de-radicalized him early. Three months in, not three years.

Agent 0x99: He still has cognitive dissonance. He knows what he did was wrong.

Agent 0x99: We can work with that.

-> campaign_impact_turned

=== campaign_impact_turned ===
#speaker:agent_0x99

Agent 0x99: For the campaign? This changes everything.

Agent 0x99: Torres becomes an asset for Missions 6 through 10.

Agent 0x99: We map ENTROPY's network. Save dozens of potential recruits.

{handler_trust >= 70:
    Agent 0x99: You made the right call. I'm proud of how you handled this.
}

-> lore_discussion

// ===========================================
// PATH 2: TORRES KILLED
// ===========================================

=== torres_killed_path ===
#speaker:agent_0x99

Agent 0x99: David Torres. KIA. Lethal force during apprehension.

Agent 0x99: *pause*

Agent 0x99: He was reaching for his phone. To call his wife.

Agent 0x99: But you didn't know that at the time.

+ [He was resisting. I made a tactical decision]
    You: I assessed him as a threat. Lethal force was justified.
    -> torres_tactical_discussion

+ [I know. I'll live with it]
    You: It was him or the mission. I chose the mission.
    -> torres_weight_discussion

=== torres_tactical_discussion ===
#speaker:agent_0x99

Agent 0x99: The after-action report supports your assessment.

Agent 0x99: Confined space. Suspected espionage agent. Rapid movement toward concealed object.

Agent 0x99: By the book, you're clear.

-> torres_family_impact

=== torres_weight_discussion ===
#speaker:agent_0x99

Agent 0x99: These choices have weight. They should.

Agent 0x99: David Torres was radicalized for three months. He knew his actions would cost lives.

Agent 0x99: But he was also a father. A husband. A man who made terrible choices under terrible pressure.

Agent 0x99: Both things are true.

-> torres_family_impact

=== torres_family_impact ===
#speaker:agent_0x99

Agent 0x99: Elena Torres is now a widow. Still fighting Stage 3 cancer.

Agent 0x99: Sofia and Miguel—ages 11 and 8—lost their father.

Agent 0x99: No witness protection. No treatment coverage.

{knows_full_stakes:
    Agent 0x99: You saved 12 to 40 intelligence officers. At the cost of one family.
}

Agent 0x99: That's the math. Doesn't make it easier.

-> campaign_impact_killed

=== campaign_impact_killed ===
#speaker:agent_0x99

Agent 0x99: For the campaign? We lost intelligence opportunities.

Agent 0x99: Torres could have mapped ENTROPY's Insider Threat Initiative. Now we do it the hard way.

Agent 0x99: The other 47 targets are still vulnerable. We'll find them manually.

{handler_trust < 50:
    Agent 0x99: I won't judge your choice. But it cost us.
}

-> lore_discussion

// ===========================================
// PATH 3: TORRES ARRESTED (No Treatment)
// ===========================================

=== torres_arrested_no_treatment_path ===
#speaker:agent_0x99

Agent 0x99: David Torres. Federal custody. Espionage charges.

Agent 0x99: He didn't cooperate. Lawyer'd up immediately.

Agent 0x99: 15 to 25 years in federal prison. Standard sentence for espionage.

Agent 0x99: Elena Torres? No treatment coverage. Stage 3 cancer.

Agent 0x99: She has months, maybe. Sofia and Miguel will watch their mother die while their father's in prison.

+ [Justice has costs]
    You: He committed espionage. Actions have consequences.
    Agent 0x99: They do. For everyone involved.
    -> campaign_impact_arrested_no_coop

+ [I offered him a deal. He refused]
    You: He could have cooperated. He chose not to.
    Agent 0x99: Fair point.
    -> campaign_impact_arrested_no_coop

=== campaign_impact_arrested_no_coop ===
#speaker:agent_0x99

Agent 0x99: Without his cooperation, we lost intelligence on ENTROPY's network.

Agent 0x99: The 23 active placements continue. The 47 targets remain vulnerable.

Agent 0x99: We stopped one operation. ENTROPY still has 22 others running.

-> lore_discussion

// ===========================================
// PATH 4: TORRES ARRESTED (With Treatment)
// ===========================================

=== torres_arrested_with_treatment_path ===
#speaker:agent_0x99

Agent 0x99: David Torres. Federal custody. Full cooperation agreement.

Agent 0x99: He's providing intelligence in exchange for Elena's treatment.

{elena_treatment_funded:
    Agent 0x99: Witness protection budget covers experimental therapy. She starts Monday.
}

Agent 0x99: Torres still faces prison time. 5 to 10 years, reduced sentence for cooperation.

Agent 0x99: But his family survives. Elena gets treatment. Kids have a chance.

-> campaign_impact_arrested_coop

=== campaign_impact_arrested_coop ===
#speaker:agent_0x99

Agent 0x99: His cooperation gives us partial intelligence on ENTROPY's Insider Threat Initiative.

Agent 0x99: Not as valuable as a double agent, but better than nothing.

Agent 0x99: We'll identify some of the 23 active placements. Warn some of the 47 targets.

Agent 0x99: By-the-book justice with strategic benefit. Solid outcome.

-> lore_discussion

// ===========================================
// PATH 5: PUBLIC EXPOSURE
// ===========================================

=== public_exposure_path ===
#speaker:agent_0x99

Agent 0x99: You went nuclear. Public exposure.

Agent 0x99: Every major news outlet has the story. ENTROPY's Insider Threat Initiative is front-page news.

Agent 0x99: The 47 targets? They've all been warned. ENTROPY can't touch them now.

Agent 0x99: The 23 active placements? Compromised. Companies launching internal investigations.

+ [It was necessary to burn the program]
    You: ENTROPY's recruitment methodology is exposed. They can't rebuild this.
    -> public_exposure_consequence

+ [I wanted maximum impact]
    You: This sends a message. ENTROPY's operations have consequences.
    -> public_exposure_consequence

=== public_exposure_consequence ===
#speaker:agent_0x99

Agent 0x99: You're right. ENTROPY's Insider Threat Initiative is finished.

Agent 0x99: But there are costs.

Agent 0x99: David Torres is now a household name. "The Quantum Traitor."

Agent 0x99: Sofia and Miguel's classmates see their father on TV. Labeled a spy.

Agent 0x99: Elena's in hospice. Reading about her husband's espionage while dying.

{handler_trust >= 60:
    Agent 0x99: You prioritized the mission over individuals. I understand the logic.
- else:
    Agent 0x99: Strategic victory. Human cost. That's the trade you made.
}

-> campaign_impact_public

=== campaign_impact_public ===
#speaker:agent_0x99

Agent 0x99: For the campaign? ENTROPY's recruitment arm is crippled.

Agent 0x99: But they'll retaliate. Expect escalation in future missions.

Agent 0x99: You made them look weak. They won't forget that.

-> lore_discussion

// ===========================================
// LORE & INTELLIGENCE DISCUSSION
// ===========================================

=== lore_discussion ===
#speaker:agent_0x99

{lore_collected >= 4:
    Agent 0x99: I see you collected all LORE fragments. Thorough work.
    -> lore_complete
}

{lore_collected >= 2:
    Agent 0x99: You found some LORE fragments. Helpful context.
    -> lore_partial
}

{lore_collected < 2:
    Agent 0x99: Limited LORE collection. We'll work with what we have.
    -> entropy_revelation
}

=== lore_complete ===
#speaker:agent_0x99

Agent 0x99: The recruiting pamphlet. Target selection criteria. Architect protocols.

Agent 0x99: Together, these show ENTROPY's methodology. Systematic. Calculated. Professional.

Agent 0x99: They're not anarchists. They're a criminal corporation with service-level agreements.

-> entropy_revelation

=== lore_partial ===
#speaker:agent_0x99

Agent 0x99: The LORE you found fills in gaps. ENTROPY's professionalism is clear.

-> entropy_revelation

// ===========================================
// ENTROPY REVELATION
// ===========================================

=== entropy_revelation ===
#speaker:agent_0x99

Agent 0x99: This mission revealed something critical about ENTROPY.

Agent 0x99: Insider Threat Initiative. Digital Vanguard. Zero Day Syndicate. Crypto Anarchists.

Agent 0x99: They're coordinating like a multinational corporation.

Agent 0x99: Service contracts. Revenue sharing. Professional recruitment.

Agent 0x99: The Architect isn't just coordinating attacks. They built a criminal enterprise.

-> future_implications

// ===========================================
// FUTURE IMPLICATIONS & CLOSURE
// ===========================================

=== future_implications ===
#speaker:agent_0x99

Agent 0x99: For future missions, this matters.

{torres_turned:
    Agent 0x99: Torres will provide intelligence through Mission 10. Strategic asset.
}

{torres_killed or (torres_arrested and not elena_treatment_funded):
    Agent 0x99: We'll track ENTROPY's network manually. Harder, but doable.
}

{entropy_program_exposed:
    Agent 0x99: ENTROPY will escalate. They're wounded but not dead.
}

Agent 0x99: Mission 6 - "Follow the Money" - we'll track ENTROPY's financial network.

Agent 0x99: Crypto Anarchists. HashChain Exchange. Cryptocurrency laundering.

{torres_turned:
    Agent 0x99: Torres can provide account numbers and transaction IDs. Massive advantage.
}

-> final_reflection

=== final_reflection ===
#speaker:agent_0x99

Agent 0x99: {player_name}, one last thing.

Agent 0x99: This mission put you in an impossible position.

Agent 0x99: David Torres was radicalized. He knew his actions would cause deaths.

Agent 0x99: But ENTROPY targeted him because of medical debt. Weaponized his wife's cancer.

Agent 0x99: He's both perpetrator and victim. Both guilty and sympathetic.

Agent 0x99: How you handled that complexity... that's who you are as an agent.

{handler_trust >= 70:
    Agent 0x99: I trust your judgment. Today proved that.
}

{handler_trust >= 50 and handler_trust < 70:
    Agent 0x99: You made tough calls. I respect that.
}

{handler_trust < 50:
    Agent 0x99: We got the job done. That's what matters.
}

-> mission_end

=== mission_end ===
#speaker:agent_0x99

Agent 0x99: Get some rest. Mission 6 briefs Monday.

{knows_full_stakes:
    Agent 0x99: And {player_name}? Those 12 to 40 officers you saved?
    Agent 0x99: They'll never know your name. But they're alive.
    Agent 0x99: That's what we do this for.
}

Agent 0x99: Good work out there.

[Fade to mission complete screen]

#exit_conversation
-> END
