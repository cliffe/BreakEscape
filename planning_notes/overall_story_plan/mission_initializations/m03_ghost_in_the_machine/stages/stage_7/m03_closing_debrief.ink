// ===========================================
// Mission 3: Ghost in the Machine
// ACT 3: CLOSING DEBRIEF
// ===========================================

// Variables from Act 1 (opening briefing)
EXTERNAL player_approach()
VAR handler_trust = 50  // Starts at 50, modified during debrief
EXTERNAL knows_m2_connection()
EXTERNAL mission_priority()

// Variables from Act 2 (gameplay)
EXTERNAL objectives_completed()
EXTERNAL lore_collected()
EXTERNAL stealth_rating()
EXTERNAL time_taken()
EXTERNAL flags_submitted_count()

// Variables from moral choices
EXTERNAL victoria_fate()        // "protected", "exposed", "recruited", "arrested"
EXTERNAL james_fate()           // "protected", "exposed", "ignored"
EXTERNAL found_exploit_catalog()
EXTERNAL found_architect_directive()

EXTERNAL player_name()

// ===========================================
// OPENING
// ===========================================

=== start ===
#speaker:agent_0x99

[Location: SAFETYNET Secure Debrief Room]
[Time: 24 hours after mission completion]
[Visual: Agent 0x99 avatar - serious but relieved expression]

Agent 0x99: {player_name()}, welcome back. Have a seat.

Agent 0x99: Let's debrief Mission 3 - Ghost in the Machine.

{objectives_completed() >= 4:
    -> full_success_debrief
}

{objectives_completed() >= 2 and objectives_completed() < 4:
    -> partial_success_debrief
}

{objectives_completed() < 2:
    -> minimal_success_debrief
}

// ===========================================
// FULL SUCCESS PATH
// ===========================================

=== full_success_debrief ===
#speaker:agent_0x99

Agent 0x99: All primary objectives completed. Outstanding work.

{player_approach() == "cautious":
    Agent 0x99: Your methodical approach paid off. You documented everything, missed nothing.
}

{player_approach() == "aggressive":
    Agent 0x99: You moved fast and got results. Aggressive execution, clean outcome.
}

{player_approach() == "diplomatic":
    Agent 0x99: Your adaptability was key. You read situations perfectly and adjusted tactics accordingly.
}

{stealth_rating() > 80:
    Agent 0x99: And you stayed ghost the entire operation. Zero Day never knew what hit them.
}

{stealth_rating() > 50 and stealth_rating() <= 80:
    Agent 0x99: You made some noise, but nothing that compromised the mission.
}

{stealth_rating() <= 50:
    Agent 0x99: You triggered some alerts, but you completed the objectives despite the heat.
}

-> mission_impact

// ===========================================
// PARTIAL SUCCESS PATH
// ===========================================

=== partial_success_debrief ===
#speaker:agent_0x99

Agent 0x99: Mission complete, though we didn't get everything we wanted.

Agent 0x99: {objectives_completed()} objectives out of the primary set. That's solid work, but there are gaps.

{player_approach() == "aggressive" and time_taken() < 1800:
    Agent 0x99: Speed was prioritized. Sometimes that means missing details.
}

Agent 0x99: Still, what you DID get is valuable. Let's talk impact.

-> mission_impact

// ===========================================
// MINIMAL SUCCESS PATH
// ===========================================

=== minimal_success_debrief ===
#speaker:agent_0x99

Agent 0x99: You completed the core objective, but... we're working with incomplete intelligence.

Agent 0x99: What we have is useful. But there's significant intelligence we missed.

Agent 0x99: Let's assess what we got and what it means.

-> mission_impact

// ===========================================
// MISSION IMPACT ASSESSMENT
// ===========================================

=== mission_impact ===
#speaker:agent_0x99

Agent 0x99: Here's what Zero Day Syndicate's infiltration accomplished:

{flags_submitted_count() >= 4:
    Agent 0x99: Network intelligence - complete. You submitted all VM flags.
    Agent 0x99: We have a full map of their training network, service vulnerabilities, and operational infrastructure.
}

{flags_submitted_count() >= 2 and flags_submitted_count() < 4:
    Agent 0x99: Network intelligence - partial. You submitted {flags_submitted_count()} of 4 flags.
    Agent 0x99: We have some visibility into their operations, but there are blind spots.
}

{flags_submitted_count() < 2:
    Agent 0x99: Network intelligence - minimal. We're missing critical digital evidence.
}

-> m2_hospital_discussion

// ===========================================
// M2 HOSPITAL ATTACK DISCUSSION
// ===========================================

=== m2_hospital_discussion ===
#speaker:agent_0x99

Agent 0x99: Now... St. Catherine's Hospital. The M2 connection.

{found_exploit_catalog() or flags_submitted_count() >= 4:
    Agent 0x99: You found the smoking gun. The exploit catalog. The operational logs.

    Agent 0x99: ProFTPD exploit, CVE-2010-4652. Sold to GHOST - Ransomware Incorporated.

    Agent 0x99: Purchase price: $12,500. With a healthcare premium markup.

    Agent 0x99: Target: St. Catherine's Regional Medical Center.

    [Pause]

    Agent 0x99: Six deaths. Four in critical care when patient monitoring failed. Two during emergency surgery when systems crashed.

    {knows_m2_connection():
        Agent 0x99: You knew the stakes from the beginning. You delivered.
    }

    Agent 0x99: This is ironclad evidence. Federal prosecutors can prove direct causation.

    Agent 0x99: Zero Day → GHOST → St. Catherine's. Murder for profit.

    -> victoria_discussion
}

{not found_exploit_catalog() and flags_submitted_count() < 4:
    Agent 0x99: We have strong circumstantial evidence connecting Zero Day to the M2 hospital attack.

    Agent 0x99: But without the operational logs or exploit catalog, proving direct causation is harder.

    Agent 0x99: We can build a case, but it would have been stronger with more evidence.

    -> victoria_discussion
}

// ===========================================
// VICTORIA STERLING DISCUSSION
// ===========================================

=== victoria_discussion ===
#speaker:agent_0x99

Agent 0x99: Victoria Sterling. Codename "Cipher." CEO of WhiteHat Security, leader of Zero Day Syndicate.

{victoria_fate() == "recruited":
    Agent 0x99: And now... your double agent.

    Agent 0x99: I'll be honest - that was a hell of a gambit. Recruiting her instead of arresting her.

    * [She's more valuable as an intelligence asset]
        You: She has access to The Architect. To the entire ENTROPY network. We need that intelligence.
        Agent 0x99: I agree. But it's risky. She's ideologically committed, not just mercenary.
        Agent 0x99: She believes in what she's doing. That makes turning her... complicated.
        -> victoria_recruited_path

    * [She can help us stop Phase 2]
        You: Phase 2 targets 50,000+ patients and 1.2 million customers. Victoria's intel can prevent that.
        Agent 0x99: True. If she delivers. If she doesn't get exposed. If The Architect doesn't suspect.
        Agent 0x99: A lot of "ifs."
        -> victoria_recruited_path

    * [It was the right call]
        You: It was the right tactical decision given the strategic picture.
        ~  handler_trust += 10
        Agent 0x99: I trust your judgment. You were there, you made the call.
        -> victoria_recruited_path
}

{victoria_fate() == "arrested":
    Agent 0x99: Victoria Sterling is in federal custody. Charged with conspiracy, providing material support to terrorist operations, and accessory to murder.

    Agent 0x99: She's looking at life in prison. Her lawyers are already talking about philosophical defenses - "information freedom," "market forces."

    Agent 0x99: It won't work. The evidence is too clear.

    * [She authorized six deaths for $12,500]
        You: She charged a healthcare premium because hospitals can't defend themselves. Calculated exploitation.
        Agent 0x99: Exactly. That pricing model proves premeditation and malicious intent.
        -> victoria_arrested_path

    * [Justice for St. Catherine's victims]
        You: Angela Martinez. David Chen. Sarah Thompson. Marcus Gray. Jennifer Wu. Robert Patterson.
        You: They have justice now.
        ~  handler_trust += 10
        Agent 0x99: [Quiet moment] Yes. Yes, they do.
        -> victoria_arrested_path

    * [One cell leader down]
        You: One ENTROPY cell leader captured. That disrupts their operations.
        Agent 0x99: Agreed. Zero Day Syndicate is crippled without Victoria.
        -> victoria_arrested_path
}

{victoria_fate() != "recruited" and victoria_fate() != "arrested":
    Agent 0x99: Victoria Sterling remains at large. She suspects SAFETYNET interest but has no proof of infiltration.

    Agent 0x99: We have evidence, but without her in custody, prosecution is harder.

    Agent 0x99: She'll likely go dark, reorganize, resurface under a new operation.

    -> phase_2_discussion
}

=== victoria_recruited_path ===
#speaker:agent_0x99

Agent 0x99: She's been debriefed by our counterintelligence team. Initial intelligence package delivered.

Agent 0x99: Communication protocols for The Architect. Payment methods. Other ENTROPY cell contacts.

Agent 0x99: We're establishing encrypted channels for her to feed us ongoing intelligence.

Agent 0x99: She'll continue operations at Zero Day to avoid suspicion, but now she reports to us.

{player_approach() == "diplomatic":
    Agent 0x99: Your diplomatic approach made this possible. Well played.
}

Agent 0x99: Time will tell if this gambit pays off. But for now, we have eyes inside ENTROPY leadership.

-> phase_2_discussion

=== victoria_arrested_path ===
#speaker:agent_0x99

Agent 0x99: With Victoria in custody, Zero Day Syndicate is effectively neutralized.

Agent 0x99: Her encryption keys gave us access to client databases, transaction records, The Architect's communications.

Agent 0x99: We're rolling up her network as we speak. Other ENTROPY cells that relied on Zero Day's exploits are scrambling.

{player_approach() == "cautious":
    Agent 0x99: Your thorough evidence gathering made this arrest possible. Clean prosecution.
}

-> phase_2_discussion

// ===========================================
// PHASE 2 DISCUSSION
// ===========================================

=== phase_2_discussion ===
#speaker:agent_0x99

Agent 0x99: Now the big one - Phase 2.

{found_architect_directive():
    Agent 0x99: You found The Architect's directive. That USB drive in Victoria's desk.

    Agent 0x99: Double-encoded. Base64 and ROT13. You cracked it.

    [Agent 0x99's expression darkens]

    Agent 0x99: The contents... jesus.

    Agent 0x99: Healthcare SCADA systems. 15 hospitals targeted. Ventilation control. Patient monitoring networks.

    Agent 0x99: Energy grid ICS. 427 vulnerable substations mapped for attack.

    Agent 0x99: Projected impact: 50,000+ patient treatment delays. 1.2 million residential customers without power. Winter targeting.

    * [That's genocide-scale harm]
        You: 50,000 patients. That's not hacking. That's mass casualty terrorism.
        Agent 0x99: Correct. And it's coordinated across multiple ENTROPY cells.
        -> architect_revelation

    * [We have to stop it]
        You: We have the Phase 2 timeline. Q4 2024 - Q1 2025. We can prevent this.
        Agent 0x99: We're working on it. But stopping a distributed multi-cell attack is complex.
        -> architect_revelation

    * [The Architect is orchestrating everything]
        You: This isn't isolated cells. This is coordinated network-level operation.
        Agent 0x99: Yes. And that's the game-changer.
        -> architect_revelation
}

{not found_architect_directive():
    Agent 0x99: We know Phase 2 is planned. We've seen references in Victoria's communications.

    Agent 0x99: But without the detailed directive, we're working with incomplete intelligence.

    Agent 0x99: Infrastructure targeting. Healthcare and energy sectors. That's what we know.

    Agent 0x99: We'll keep working the intelligence, but... we could have had more.

    -> james_discussion
}

// ===========================================
// THE ARCHITECT REVELATION
// ===========================================

=== architect_revelation ===
#speaker:agent_0x99

Agent 0x99: The Architect. ENTROPY's leadership figure.

Agent 0x99: The directive proves they exist. Proves they're coordinating all the cells.

Agent 0x99: Zero Day provides exploits. Ransomware Inc deploys against hospitals. Social Fabric amplifies panic via misinformation. Critical Mass targets emergency response.

Agent 0x99: Multi-vector synchronized attack. Each cell independently operational, but coordinated for maximum chaos.

Agent 0x99: "Chaos amplification factor: 3.7x" - they're CALCULATING the synergistic harm.

* [Do we know The Architect's identity?]
    You: Do we have any leads on The Architect's real identity?
    Agent 0x99: Not yet. Victoria claims she's never met them face-to-face. All communication via encrypted channels.
    Agent 0x99: But we're working on it. Every ENTROPY operation gets us closer.
    -> architect_investigation

* [This is campaign-level intelligence]
    You: This isn't just one mission. This is the key to the entire ENTROPY network.
    ~  handler_trust += 10
    Agent 0x99: Exactly. You didn't just complete a mission. You gave us the map to their whole operation.
    -> architect_investigation

=== architect_investigation ===
#speaker:agent_0x99

Agent 0x99: SAFETYNET Command is escalating this to top priority.

Agent 0x99: Phase 2 prevention is now inter-agency. FBI, CISA, NSA. We're briefing them all.

Agent 0x99: 427 energy substations will get hardened defenses. 15 hospitals will get emergency security assessments.

Agent 0x99: We can't stop ENTROPY entirely - they're too distributed - but we can protect the Phase 2 targets.

Agent 0x99: Thanks to you.

-> james_discussion

// ===========================================
// JAMES PARK DISCUSSION
// ===========================================

=== james_discussion ===
#speaker:agent_0x99

{james_fate() != "":
    Agent 0x99: One more thing. James Park, Zero Day's senior consultant.

    {james_fate() == "protected":
        Agent 0x99: You protected him. Framed his role as unwitting participation under Victoria's deception.

        Agent 0x99: I've read your report. And I've read James's diary entries.

        Agent 0x99: I think... I think you made the right call.

        Agent 0x99: James conducted legitimate pen testing under false pretenses. He was a tool Victoria used.

        Agent 0x99: When he learned the truth, he was paralyzed by fear and guilt. That's human.

        {player_approach() == "diplomatic":
            Agent 0x99: Your diplomatic nuance - recognizing the complexity - that's why this field needs people like you.
        }

        Agent 0x99: James reached out to SAFETYNET yesterday. Voluntarily. He's cooperating fully.

        Agent 0x99: He won't face charges. But he'll live with what happened. That's punishment enough.

        -> lore_discussion
    }

    {james_fate() == "exposed":
        Agent 0x99: You exposed James's full involvement. The reconnaissance, the post-attack knowledge, the hush money.

        Agent 0x99: He's been arrested. Charged with conspiracy after the fact and obstruction.

        Agent 0x99: His lawyers are arguing he was deceived, which... he was. Initially.

        Agent 0x99: But when he learned the truth and took Victoria's raise to stay quiet, that became a choice.

        {player_approach() == "aggressive":
            Agent 0x99: Your aggressive approach - all operatives face justice - is consistent. I respect that.
        }

        Agent 0x99: James will likely get a reduced sentence compared to Victoria. Maybe 5-10 years instead of life.

        Agent 0x99: His cooperation since arrest is helping prosecution. But he'll still serve time.

        -> lore_discussion
    }

    {james_fate() == "ignored":
        Agent 0x99: You documented James's situation but left his fate to his own choices.

        Agent 0x99: Interesting approach. Not protecting, not exposing. Just... observing.

        Agent 0x99: James made his choice. He came forward to SAFETYNET two days ago. Voluntarily.

        Agent 0x99: He's cooperating. Providing testimony against Victoria. He'll likely avoid charges given the voluntary disclosure.

        {player_approach() == "cautious":
            Agent 0x99: Your cautious approach - gather evidence, let the system decide - allowed James's own moral agency.
        }

        Agent 0x99: He made the right choice in the end. That says something about him.

        -> lore_discussion
    }
}

{james_fate() == "":
    -> lore_discussion
}

// ===========================================
// LORE FRAGMENTS DISCUSSION
// ===========================================

=== lore_discussion ===
#speaker:agent_0x99

{lore_collected() >= 3:
    Agent 0x99: Intelligence gathering - exemplary. You collected all LORE fragments.

    Agent 0x99: Zero Day's founding philosophy. The exploit catalog. The Architect's directive.

    Agent 0x99: Each one gave us pieces of the larger ENTROPY puzzle.

    -> lore_fragment_breakdown
}

{lore_collected() == 2:
    Agent 0x99: You collected some LORE fragments. Useful intelligence on ENTROPY's structure.

    Agent 0x99: We would have benefited from the complete set, but what you found helps.

    -> final_assessment
}

{lore_collected() == 1:
    Agent 0x99: You found one LORE fragment. Better than nothing, but we're missing context.

    -> final_assessment
}

{lore_collected() == 0:
    Agent 0x99: No LORE fragments collected. That's... a missed opportunity.

    Agent 0x99: LORE provides strategic intelligence about ENTROPY's ideology, structure, and future plans.

    Agent 0x99: Without it, we're fighting tactics instead of strategy.

    -> final_assessment
}

=== lore_fragment_breakdown ===
#speaker:agent_0x99

Agent 0x99: The three fragments paint a complete picture:

Agent 0x99: Fragment 1 - "Zero Day: A Brief History" - showed us Victoria's philosophy. "Monetize entropy."

Agent 0x99: She's not a sociopath. She's a true believer. She genuinely thinks she's participating in a rational market.

Agent 0x99: That makes her MORE dangerous, not less. You can't reason someone out of a position they didn't reason themselves into.

[Pause]

Agent 0x99: Fragment 2 - "Q3 2024 Exploit Catalog" - the smoking gun. $12,500 for the hospital exploit. Healthcare premium.

Agent 0x99: That pricing model - charging MORE to attack the vulnerable - that's evidence of calculated malice.

Agent 0x99: No jury will see "market efficiency" when they read "healthcare premium: +30% (delayed incident response)."

[Pause]

Agent 0x99: Fragment 3 - "The Architect's Directive" - the game-changer. Phase 2 plans. Multi-cell coordination. The full scope.

Agent 0x99: This fragment alone justified the entire mission. We know what's coming. We can prepare.

-> final_assessment

// ===========================================
// FINAL ASSESSMENT
// ===========================================

=== final_assessment ===
#speaker:agent_0x99

Agent 0x99: Final assessment, {player_name()}:

{objectives_completed() >= 4 and lore_collected() >= 2:
    Agent 0x99: Mission success - exceptional. You delivered everything we needed and more.

    {handler_trust >= 70:
        Agent 0x99: And honestly? I knew you would. I've always had complete confidence in you.
    }

    Agent 0x99: The M2 hospital attack has accountability. Victoria Sterling faces justice.

    Agent 0x99: Phase 2 can be prevented. We have targets, timelines, coordination plans.

    Agent 0x99: The Architect is still out there, but we're closing in. Each mission gets us closer.

    -> aftermath
}

{objectives_completed() >= 2:
    Agent 0x99: Mission success - solid. You got what we needed, even if we didn't get everything.

    Agent 0x99: We can work with this. Prosecution is viable. Phase 2 prevention is possible.

    Agent 0x99: It would have been better with complete intelligence, but you did good work.

    -> aftermath
}

{objectives_completed() < 2:
    Agent 0x99: Mission success - partial. We got some intelligence, but there are significant gaps.

    Agent 0x99: We'll use what we have. But this fight against ENTROPY just got harder.

    -> aftermath
}

// ===========================================
// AFTERMATH & FUTURE SETUP
// ===========================================

=== aftermath ===
#speaker:agent_0x99

Agent 0x99: Here's what happens now:

Agent 0x99: Zero Day Syndicate is disrupted. Victoria Sterling {victoria_fate() == "arrested": is in custody}{ victoria_fate() == "recruited": is our asset}{victoria_fate() != "arrested" and victoria_fate() != "recruited": has gone dark}.

Agent 0x99: Phase 2 critical infrastructure targets are being hardened. FBI and CISA are coordinating defenses.

Agent 0x99: Other ENTROPY cells are scrambling without Zero Day's exploit supply chain.

Agent 0x99: And SAFETYNET is one step closer to identifying The Architect.

* [What's next for me?]
    You: What's my next assignment?
    Agent 0x99: Rest. Debrief. Then we'll see where ENTROPY pops up next.
    Agent 0x99: They're a network. Taking down one cell reveals others.
    -> closing

* [What about The Architect?]
    You: When do we go after The Architect directly?
    Agent 0x99: When we know who they are. We're getting closer. Each mission, each piece of intelligence.
    Agent 0x99: Eventually, they'll make a mistake. And when they do, we'll be ready.
    -> closing

* [The fight continues]
    You: ENTROPY is still out there. Ransomware Inc, Social Fabric, Critical Mass, others.
    Agent 0x99: Yes. This is a marathon, not a sprint.
    Agent 0x99: But every mission we complete, we weaken their network. We save lives.
    -> closing

// ===========================================
// CLOSING
// ===========================================

=== closing ===
#speaker:agent_0x99

{handler_trust >= 80:
    Agent 0x99: {player_name()}, I want you to know... you're one of the best agents I've worked with.

    Agent 0x99: Not just technically skilled. But morally thoughtful. You understand nuance.

    Agent 0x99: That's rare in this field. Don't lose it.
}

{handler_trust >= 50 and handler_trust < 80:
    Agent 0x99: You did good work on this mission, {player_name()}.

    Agent 0x99: Get some rest. We'll need you again soon.
}

{handler_trust < 50:
    Agent 0x99: Mission complete. We got results, even if the execution was rough.

    Agent 0x99: Take some time. Reflect on what worked and what didn't.
}

Agent 0x99: And remember those six names. Angela Martinez. David Chen. Sarah Thompson. Marcus Gray. Jennifer Wu. Robert Patterson.

Agent 0x99: They didn't get justice before. But because of what you did, they have it now.

Agent 0x99: That matters.

* [It does matter]
    ~  handler_trust += 5
    You: It matters. That's why we do this work.
    Agent 0x99: Exactly. That's why we fight.
    -> final_words

* [Thank you, Agent 0x99]
    You: Thank you for the support on this mission. Your guidance made the difference.
    ~  handler_trust += 10
    Agent 0x99: [Warmly] Any time, {player_name()}. We're a team.
    -> final_words

* [On to the next mission]
    You: Where ENTROPY goes, we follow. On to the next mission.
    Agent 0x99: [Nods] Damn right. Haxolottle out.
    -> final_words

=== final_words ===
#speaker:agent_0x99

Agent 0x99: Stay safe out there, {player_name()}.

Agent 0x99: The fight against ENTROPY continues. But tonight, you've earned some rest.

[Transmission ends]

[Mission 3 Complete: Ghost in the Machine]

#mission_complete
-> END
