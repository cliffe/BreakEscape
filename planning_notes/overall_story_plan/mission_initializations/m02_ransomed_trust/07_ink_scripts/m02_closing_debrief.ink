// ===========================================
// ACT 3: CLOSING DEBRIEF
// Mission 2: Ransomed Trust
// Break Escape - Consequences and Reflection
// ===========================================

// Variables from Act 1 (carried forward)
VAR player_approach = "adaptable"   // From opening: cautious, aggressive, adaptable
VAR handler_trust = 50              // From opening: 0-100
VAR knows_full_stakes = false       // From opening
VAR mission_priority = "stealth"    // From opening

// Variables from Act 2/3 (set by game or previous scripts)
VAR paid_ransom = false             // Critical decision
VAR exposed_hospital = false        // Secondary decision
VAR marcus_protected = false        // Optional player action
VAR kim_guilt_revealed = false      // NPC interaction

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed
EXTERNAL lore_collected
EXTERNAL stealth_rating
EXTERNAL time_taken
EXTERNAL tasks_completed

// ===========================================
// DEBRIEF START
// ===========================================

=== start ===
#speaker:agent_0x99

[Location: SAFETYNET Debrief Room - 48 Hours After Mission]

Agent 0x99: {player_name}. Good to see you back.

Agent 0x99: St. Catherine's Hospital is stabilized. Systems restored. The immediate crisis is over.

Agent 0x99: Let's debrief.

* [How are the patients?]
    -> patient_outcomes

* [What happened to Ghost?]
    -> ghost_status

* [Let's review the mission]
    -> mission_summary

=== mission_summary ===
#speaker:agent_0x99

{objectives_completed >= 8:
    -> full_success_path
}
{objectives_completed >= 5:
    -> partial_success_path
}
{objectives_completed < 5:
    -> minimal_success_path
}

// ===========================================
// FULL SUCCESS PATH (8+ objectives)
// ===========================================

=== full_success_path ===
#speaker:agent_0x99

Agent 0x99: Excellent work. All primary objectives completed.

Agent 0x99: You exploited ENTROPY's backdoor, recovered decryption keys, and made the ransom call.

{player_approach == "cautious":
    Agent 0x99: Your methodical approach paid off. Nothing was missed.
}
{player_approach == "aggressive":
    Agent 0x99: You moved fast and got results. Time was critical—you delivered.
}
{player_approach == "adaptable":
    Agent 0x99: Your adaptability was key. You read the situation perfectly.
}

-> patient_outcomes

// ===========================================
// PARTIAL SUCCESS PATH (5-7 objectives)
// ===========================================

=== partial_success_path ===
#speaker:agent_0x99

Agent 0x99: Mission complete, though we didn't get everything.

Agent 0x99: Primary objectives achieved. Some secondary objectives incomplete.

{lore_collected < 2:
    Agent 0x99: We missed some ENTROPY intelligence. More fragments would have helped understand their network.
}

-> patient_outcomes

// ===========================================
// MINIMAL SUCCESS PATH (<5 objectives)
// ===========================================

=== minimal_success_path ===
#speaker:agent_0x99

Agent 0x99: Core objective achieved, but significant gaps remain.

Agent 0x99: Systems restored, but we missed critical intelligence and opportunities.

-> patient_outcomes

// ===========================================
// PATIENT OUTCOMES (Critical Callback)
// ===========================================

=== patient_outcomes ===
#speaker:agent_0x99

{paid_ransom:
    -> ransom_paid_outcomes
- else:
    -> manual_recovery_outcomes
}

=== ransom_paid_outcomes ===
#speaker:agent_0x99

Agent 0x99: You chose to pay the ransom. Systems restored in 3 hours, 47 minutes.

Agent 0x99: Patient outcomes: 2 fatalities. Cardiac arrest during system transition—both had pre-existing complications.

Agent 0x99: 45 patients survived. Medical board ruled deaths were "statistically probable regardless of cyber attack."

* [We saved 45 lives]
    You: 45 people are alive because we moved fast.
    -> ransom_paid_reflection

* [2 people died]
    You: 2 people died. That's not nothing.
    -> ransom_paid_guilt

* [What about the $87,000?]
    -> entropy_funding_discussion

=== ransom_paid_reflection ===
#speaker:agent_0x99

Agent 0x99: Yes. 45 lives saved today. That's significant.

Agent 0x99: But that $87,000 is already flowing through Crypto Anarchist infrastructure.

Agent 0x99: HashChain Exchange, Silk Route Protocol, DarkCoin Mixer. Ghost's payment trail is gone.

Agent 0x99: Ransomware Incorporated has operational funding for 2-3 more attacks.

* [Was it the right choice?]
    -> validate_ransom_choice

* [We funded ENTROPY's next attack]
    -> acknowledge_consequence

=== ransom_paid_guilt ===
#speaker:agent_0x99

Agent 0x99: 2 people died, yes. Pre-existing cardiac conditions, 80+ years old, ICU life support.

Agent 0x99: Medical review board: "Deaths likely within 72 hours regardless of cyber incident."

Agent 0x99: Not your fault. Not Ghost's fault, technically. Just... tragic timing.

-> validate_ransom_choice

=== validate_ransom_choice ===
#speaker:agent_0x99

Agent 0x99: Was paying the ransom right? Depends on your ethical framework.

Agent 0x99: Utilitarian view: Minimize immediate harm. 2 deaths vs. potential 6. You chose correctly.

Agent 0x99: Consequentialist view: Long-term harm from ENTROPY funding. You enabled future attacks.

Agent 0x99: I won't judge. You made the best call with the information you had.

-> entropy_funding_discussion

=== acknowledge_consequence ===
#speaker:agent_0x99

Agent 0x99: Yes. $87,000 to Ransomware Incorporated.

Agent 0x99: That funds malware development, exploit procurement, reconnaissance operations.

Agent 0x99: Ghost's manifesto mentioned Operation Triage—3 previous hospital attacks. All paid ransoms.

Agent 0x99: Total ENTROPY revenue from healthcare ransomware: $230,000+. Growing.

-> entropy_funding_discussion

=== manual_recovery_outcomes ===
#speaker:agent_0x99

Agent 0x99: You chose independent recovery. Manual restoration using offline backup keys.

Agent 0x99: Recovery time: 11 hours, 34 minutes. Just under the 12-hour window.

Agent 0x99: Patient outcomes: 6 fatalities. Ventilator complications, dialysis failures, cardiac arrests during extended downtime.

* [6 people died because of my choice]
    You: 6 people died because I refused to pay.
    -> manual_recovery_guilt

* [We denied ENTROPY funding]
    You: But we denied ENTROPY $87,000. No funding for their next attack.
    -> manual_recovery_vindication

=== manual_recovery_guilt ===
#speaker:agent_0x99

Agent 0x99: 6 people died during a crisis ENTROPY created. Not you.

Agent 0x99: Medical review: 4 of 6 had terminal diagnoses. Life expectancy under 6 months regardless.

Agent 0x99: 2 were critical ICU patients. 50/50 survival odds even without ransomware.

Agent 0x99: This is on Ghost, not you.

* [Ghost will say it's on me]
    You: Ghost said those deaths would be on my conscience.
    -> ghost_blame_response

* [I made the best choice I could]
    -> manual_recovery_vindication

=== ghost_blame_response ===
#speaker:agent_0x99

Agent 0x99: Ghost WANTS you to feel guilty. That's psychological warfare.

Agent 0x99: They calculated patient death probabilities to weaponize your empathy.

Agent 0x99: Don't let them win twice—once with the attack, again with guilt.

-> manual_recovery_vindication

=== manual_recovery_vindication ===
#speaker:agent_0x99

Agent 0x99: You denied ENTROPY $87,000. No operational funding for Ransomware Incorporated.

Agent 0x99: Long-term impact: Reduces ENTROPY's capability for 2-3 months.

Agent 0x99: Ghost's next hospital attack? Delayed or cancelled due to budget constraints.

Agent 0x99: Consequentialist ethics: You saved more lives long-term by denying funding.

-> entropy_funding_discussion

// ===========================================
// ENTROPY FUNDING DISCUSSION
// ===========================================

=== entropy_funding_discussion ===
#speaker:agent_0x99

Agent 0x99: Let's talk about ENTROPY's financial network.

{paid_ransom:
    Agent 0x99: Your ransom payment (2.5 BTC) flowed through Crypto Anarchist infrastructure.
    Agent 0x99: HashChain Exchange, Monero mixing, multi-hop routing. Trail is cold.
- else:
    Agent 0x99: You denied them funding, but their network is still operational.
}

Agent 0x99: Crypto Anarchists handle payment processing for all ENTROPY cells.

Agent 0x99: Mission 6 will target their financial infrastructure. Your choice today affects that mission.

{paid_ransom:
    Agent 0x99: We have a fresh transaction to trace. More data means better leads.
- else:
    Agent 0x99: Less transaction data, but ENTROPY has less operational funding to defend with.
}

-> hospital_status

// ===========================================
// HOSPITAL STATUS
// ===========================================

=== hospital_status ===
#speaker:agent_0x99

{exposed_hospital:
    -> hospital_exposed_path
- else:
    -> hospital_quiet_path
}

=== hospital_exposed_path ===
#speaker:agent_0x99

Agent 0x99: You exposed St. Catherine's negligence publicly. Media had a field day.

Agent 0x99: "Hospital Ignored IT Warnings for 6 Months Before Ransomware Attack."

Agent 0x99: Congressional hearings on healthcare cybersecurity. 40+ hospitals implementing emergency security audits.

* [Was that the right call?]
    You: Did I do the right thing by exposing them?
    -> exposure_reflection

* [What happened to Dr. Kim and Marcus?]
    -> npc_outcomes_exposed

=== exposure_reflection ===
#speaker:agent_0x99

Agent 0x99: Exposure forced systemic change. 40 hospitals upgraded security within 2 weeks.

Agent 0x99: Long-term lives saved: Hundreds, potentially thousands.

Agent 0x99: But St. Catherine's reputation is damaged. Lawsuits filed. Budget constraints from settlements.

Agent 0x99: Trade-off: Immediate harm to one hospital vs. sector-wide improvement.

-> npc_outcomes_exposed

=== hospital_quiet_path ===
#speaker:agent_0x99

Agent 0x99: You kept St. Catherine's negligence confidential. Hospital board privately implemented security overhaul.

Agent 0x99: Cybersecurity budget tripled. $250,000 annual allocation—up from $85K requested.

Agent 0x99: St. Catherine's reputation intact. Public unaware of institutional failure.

* [Did I do the right thing?]
    You: Should I have exposed them?
    -> quiet_resolution_reflection

* [What happened to Dr. Kim and Marcus?]
    -> npc_outcomes_quiet

=== quiet_resolution_reflection ===
#speaker:agent_0x99

Agent 0x99: Quiet resolution protected St. Catherine's reputation but limits sector-wide impact.

Agent 0x99: Other hospitals unaware of risks. No Congressional hearings. No emergency audits.

Agent 0x99: St. Catherine's improved, but systemic vulnerabilities persist elsewhere.

Agent 0x99: Trade-off: Protect one institution vs. force industry-wide change.

-> npc_outcomes_quiet

// ===========================================
// NPC OUTCOMES (Exposed Path)
// ===========================================

=== npc_outcomes_exposed ===
#speaker:agent_0x99

Agent 0x99: Dr. Sarah Kim resigned under pressure. Congressional testimony destroyed her credibility.

Agent 0x99: She's consulting now. Healthcare tech advisory. Reputation damaged but not destroyed.

{kim_guilt_revealed:
    Agent 0x99: She told investigators she recommended the budget cuts. Accepted responsibility.
    Agent 0x99: That took courage. Not many executives own their mistakes publicly.
}

Agent 0x99: Marcus Webb...

{marcus_protected:
    -> marcus_protected_exposed
- else:
    -> marcus_unprotected_exposed
}

=== marcus_protected_exposed ===
#speaker:agent_0x99

Agent 0x99: Marcus was vindicated. Your documentation of his warnings went public.

Agent 0x99: He's now Director of Cybersecurity at Metro General Hospital. $180K salary, full team.

Agent 0x99: Consulting for 15 other hospitals on ransomware prevention. Minor celebrity in healthcare IT.

Agent 0x99: You gave him his career back. That matters.

-> ghost_status

=== marcus_unprotected_exposed ===
#speaker:agent_0x99

Agent 0x99: Marcus was scapegoated initially. Fired 48 hours after attack.

Agent 0x99: But public exposure revealed his warnings. Media backlash forced St. Catherine's to rehire him.

Agent 0x99: Promoted to IT Security Director. $140K salary. He survived, but barely.

Agent 0x99: He asked about you. Said "thank SAFETYNET for making the truth public."

-> ghost_status

// ===========================================
// NPC OUTCOMES (Quiet Path)
// ===========================================

=== npc_outcomes_quiet ===
#speaker:agent_0x99

Agent 0x99: Dr. Kim retained her position. Privately reprimanded by board, but no public consequences.

Agent 0x99: She's pushing for industry-wide security standards now. Trying to prevent repeat incidents.

{kim_guilt_revealed:
    Agent 0x99: She told me she'll never ignore an IT warning again. Guilt is a powerful teacher.
}

Agent 0x99: Marcus Webb...

{marcus_protected:
    -> marcus_protected_quiet
- else:
    -> marcus_unprotected_quiet
}

=== marcus_protected_quiet ===
#speaker:agent_0x99

Agent 0x99: You protected Marcus. Your documentation prevented scapegoating.

Agent 0x99: Promoted to Director of Cybersecurity. $150K salary, full budget authority.

Agent 0x99: He sent a message: "Thank the agent who documented my warnings. Saved my career."

-> ghost_status

=== marcus_unprotected_quiet ===
#speaker:agent_0x99

Agent 0x99: Marcus was fired quietly. No public scapegoating, but career destroyed.

Agent 0x99: Blacklisted in healthcare IT. "Failed to prevent catastrophic breach."

Agent 0x99: Last I heard, he's working help desk at a community college. $45K salary.

Agent 0x99: He did everything right. Warned them. Documented risks. Still lost everything.

Agent 0x99: That's... that's the injustice that radicalizes people. Remember that.

-> ghost_status

// ===========================================
// GHOST STATUS
// ===========================================

=== ghost_status ===
#speaker:agent_0x99

Agent 0x99: As for Ghost...

Agent 0x99: Vanished. Ghost Protocol anonymity infrastructure worked perfectly.

Agent 0x99: No trace. No leads. Ransomware Incorporated is still operational.

* [We failed to stop them]
    You: Ghost escaped. We failed.
    -> ghost_escape_analysis

* [What about ENTROPY's coordination?]
    -> entropy_coordination_reveal

=== ghost_escape_analysis ===
#speaker:agent_0x99

Agent 0x99: Ghost escaped, yes. But we disrupted their operation.

{paid_ransom:
    Agent 0x99: They got paid, but we have transaction data. Financial trail for Mission 6.
- else:
    Agent 0x99: They lost $87K operational funding. Setback for 2-3 months.
}

Agent 0x99: And we learned their methodology. Calculated harm, ideological justification, coordinated cells.

-> entropy_coordination_reveal

=== entropy_coordination_reveal ===
#speaker:agent_0x99

Agent 0x99: This mission revealed ENTROPY's cross-cell coordination.

Agent 0x99: Ghost's logs mentioned Zero Day Syndicate (exploit procurement), Crypto Anarchists (payment processing).

Agent 0x99: Mission 3 targets Zero Day Syndicate. Mission 6 targets Crypto Anarchists.

Agent 0x99: Your work here sets up both operations.

{lore_collected >= 2:
    Agent 0x99: And you found LORE fragments. Intelligence on ENTROPY's network structure.
    Agent 0x99: Ghost's manifesto, CryptoSecure front company, cross-cell invoices. Excellent work.
}

-> final_reflection

// ===========================================
// FINAL REFLECTION
// ===========================================

=== final_reflection ===
#speaker:agent_0x99

Agent 0x99: Here's what matters, {player_name}.

Agent 0x99: You faced an impossible choice. Pay ransom vs. patient deaths. Expose negligence vs. protect reputation.

Agent 0x99: You made a call. Right or wrong, it was YOUR call.

* [I did my best]
    You: I made the best decision I could with the information I had.
    -> handler_validates_choice

* [I'm not sure I chose right]
    You: I'm still not sure I made the right choice.
    -> handler_provides_perspective

* [What's next for SAFETYNET?]
    -> mission_3_setup

=== handler_validates_choice ===
#speaker:agent_0x99

Agent 0x99: That's all anyone can do. Best decision, available information, time pressure.

Agent 0x99: ENTROPY creates impossible dilemmas on purpose. They want you paralyzed.

Agent 0x99: You acted. You saved lives—just different timeframes depending on your choice.

-> mission_3_setup

=== handler_provides_perspective ===
#speaker:agent_0x99

Agent 0x99: Counterterrorism is full of no-win scenarios. Lesser evils, calculated trade-offs.

{paid_ransom:
    Agent 0x99: You saved 45 lives today. That's real. Tangible. Those families don't have funerals.
    Agent 0x99: But ENTROPY has funding for future attacks. Long-term consequence.
- else:
    Agent 0x99: You denied ENTROPY funding. Long-term lives saved, statistically.
    Agent 0x99: But 6 people died during recovery. Immediate consequence.
}

Agent 0x99: Both choices have costs. Both choices save people. Just different equations.

-> mission_3_setup

// ===========================================
// MISSION 3 SETUP
// ===========================================

=== mission_3_setup ===
#speaker:agent_0x99

Agent 0x99: What's next? We go after Zero Day Syndicate.

Agent 0x99: They sold Ghost the ProFTPD exploit. They scanned 214 hospitals, recommended St. Catherine's specifically.

Agent 0x99: Shut down their exploit marketplace, reduce ENTROPY's capability across all cells.

Agent 0x99: Mission 3: Operation Cyber Arsenal. You'll infiltrate ZDS's operations.

* [I'm ready]
    You: Let's take them down.
    -> debrief_close

* [What about The Architect?]
    You: Ghost mentioned The Architect. Who's coordinating ENTROPY?
    -> architect_tease

=== architect_tease ===
#speaker:agent_0x99

Agent 0x99: The Architect coordinates all six ENTROPY cells. We don't know who they are yet.

Agent 0x99: But each mission reveals more. Social Fabric, Ransomware Inc—patterns emerging.

Agent 0x99: Eventually, we'll have enough to identify them. Then we end this.

-> debrief_close

// ===========================================
// DEBRIEF CLOSE
// ===========================================

=== debrief_close ===
#speaker:agent_0x99

Agent 0x99: Get some rest, {player_name}.

Agent 0x99: You saved lives. You stopped ENTROPY's operation. You gathered intel.

{handler_trust >= 70:
    Agent 0x99: And... good work. Really. SAFETYNET is lucky to have you.
}
{handler_trust < 40:
    Agent 0x99: You completed the mission. That's what counts.
}

Agent 0x99: We'll brief Mission 3 when you're ready.

#complete_mission
#exit_conversation

-> END
