// ================================================
// Mission 1: First Contact - Closing Debrief
// Act 3: Mission Complete
// Reflects on choices, performance, and consequences
// ================================================

// Variables from previous scripts
EXTERNAL player_name
EXTERNAL player_approach          // From opening briefing
EXTERNAL final_choice             // From Derek confrontation (arrest/recruit/expose)
EXTERNAL derek_cooperative        // From confrontation
EXTERNAL objectives_completed     // Performance metric
EXTERNAL lore_collected          // Number of LORE fragments found

// ================================================
// START: DEBRIEF BEGINS
// ================================================

=== start ===
#speaker:agent_0x99

Agent 0x99: {player_name}, return to HQ for debrief.

Agent 0x99: Mission complete. Let's discuss what happened.

+ [On my way]
    -> debrief_location

// ================================================
// DEBRIEF LOCATION
// ================================================

=== debrief_location ===
[SAFETYNET HQ - Agent 0x99's Office]
[The axolotl tank bubbles quietly in the background]

#speaker:agent_0x99

Agent 0x99: So. Your first field operation.

Agent 0x99: Social Fabric cell disrupted, Derek Lawson neutralized, election manipulation prevented.

+ [Mission accomplished]
    -> performance_review
+ [But at what cost?]
    -> moral_reflection

// ================================================
// PERFORMANCE REVIEW
// ================================================

=== performance_review ===
Agent 0x99: Let's review your performance.

Agent 0x99: Objectives completed: {objectives_completed}%. LORE fragments collected: {lore_collected}.

{objectives_completed >= 80:
    Agent 0x99: Strong work. You achieved the mission goals efficiently.
    -> choice_consequences
}
{objectives_completed >= 60:
    Agent 0x99: Solid. You got the job done, even if not perfectly.
    -> choice_consequences
}
{objectives_completed < 60:
    Agent 0x99: Mission complete, but there were gaps. Review your approach for next time.
    -> choice_consequences
}

// ================================================
// MORAL REFLECTION
// ================================================

=== moral_reflection ===
Agent 0x99: Every operation has costs. That's the weight we carry.

Agent 0x99: But you prevented election manipulation. Innocent people's votes will count.

+ [The ends justify the means?]
    Agent 0x99: Not always. But in this case? Yes. You made the right calls.
    -> choice_consequences
+ [I'm still not sure]
    Agent 0x99: Good. That uncertainty keeps you human. Keeps you questioning.
    -> choice_consequences

// ================================================
// CHOICE CONSEQUENCES (Derek's Fate)
// ================================================

=== choice_consequences ===
Agent 0x99: Now, about Derek Lawson...

{final_choice == "arrest":
    -> consequence_arrest
}
{final_choice == "recruit":
    -> consequence_recruit
}
{final_choice == "expose":
    -> consequence_expose
}

// ================================================
// CONSEQUENCE: ARREST
// ================================================

=== consequence_arrest ===
Agent 0x99: You chose arrest. Legal channels, proper prosecution.

{derek_cooperative:
    Agent 0x99: Derek's cooperating with investigators. Not full immunity, but his intel is valuable.
    Agent 0x99: We've identified two other Social Fabric operatives at Viral Dynamics.
    -> arrest_outcome
- else:
    Agent 0x99: Derek's fighting this legally. Claims whistleblower protection.
    Agent 0x99: Media attention is... complicated. But we have the evidence.
    -> arrest_outcome
}

=== arrest_outcome ===
Agent 0x99: Viral Dynamics is under investigation. Some innocent employees are caught in the fallout.

Agent 0x99: But the Social Fabric cell is dismantled. That's what matters.

+ [What about Phase 3?]
    -> phase_3_discussion
+ [Was arrest the right choice?]
    Agent 0x99: You followed legal protocol. That's always defensible.
    -> phase_3_discussion

// ================================================
// CONSEQUENCE: RECRUIT
// ================================================

=== consequence_recruit ===
Agent 0x99: You recruited Derek as Asset NIGHTINGALE.

Agent 0x99: Risky. Very risky. But if it works, we'll have unprecedented ENTROPY intel.

Agent 0x99: Derek's feeding us information on Phase 3, other cells, coordination with Zero Day Syndicate.

+ [Can we trust him?]
    Agent 0x99: No. Never trust a turned asset completely.
    Agent 0x99: But we can verify his intel and use it. He's valuable, even if unreliable.
    -> recruit_outcome
+ [What if The Architect finds out?]
    Agent 0x99: Then Derek's dead and we lose our access. Hence "risky."
    -> recruit_outcome

=== recruit_outcome ===
Agent 0x99: Asset NIGHTINGALE is your responsibility now. You turned him, you run him.

Agent 0x99: Future missions may require coordinating with Derek. Can you handle that?

+ [I'll manage him]
    Agent 0x99: Good. This could be a major intelligence breakthrough.
    -> phase_3_discussion
+ [I hope I made the right call]
    Agent 0x99: Time will tell. But you took the bold option. I respect that.
    -> phase_3_discussion

// ================================================
// CONSEQUENCE: EXPOSE
// ================================================

=== consequence_expose ===
Agent 0x99: Public disclosure. Full transparency.

Agent 0x99: Every media outlet is running the story. ENTROPY operations, Viral Dynamics infiltration, election manipulation—all exposed.

Agent 0x99: Director Netherton is furious. We don't do public disclosures.

+ [The public deserved to know]
    Agent 0x99: Maybe. But you've made enemies inside SAFETYNET.
    Agent 0x99: Some think you're reckless. Others think you're principled.
    -> expose_outcome
+ [I'd do it again]
    Agent 0x99: I believe you. And honestly? I'm not sure you're wrong.
    -> expose_outcome

=== expose_outcome ===
Agent 0x99: Viral Dynamics is destroyed. Employees lost jobs, careers ruined.

Agent 0x99: But ENTROPY's Social Fabric operations are now public knowledge. Harder for them to operate in shadows.

Agent 0x99: Double-edged sword. Transparency vs. collateral damage.

+ [Was it worth it?]
    Agent 0x99: Ask me in six months. Right now, it's too soon to know.
    -> phase_3_discussion
+ [I stand by my choice]
    Agent 0x99: Then own it. Choices have consequences. You knew that going in.
    -> phase_3_discussion

// ================================================
// PHASE 3 DISCUSSION
// ================================================

=== phase_3_discussion ===
Agent 0x99: One cell down. But Phase 3 isn't stopped.

Agent 0x99: Social Fabric was one part of a larger operation. Zero Day Syndicate, Ransomware Inc., Critical Mass—all coordinating.

Agent 0x99: And behind them all: The Architect.

+ [Who is The Architect?]
    -> architect_mystery
+ [What's next for me?]
    -> next_mission

// ================================================
// THE ARCHITECT MYSTERY
// ================================================

=== architect_mystery ===
Agent 0x99: We don't know. No one does.

Agent 0x99: ENTROPY's leader, strategist, philosopher. Maybe one person, maybe a collective.

Agent 0x99: Every cell reports to The Architect. Every operation traces back.

+ [How do we stop them?]
    Agent 0x99: Cell by cell. Operation by operation. Until we can trace the pattern.
    Agent 0x99: Your mission disrupted one cell. We need hundreds more like it.
    -> next_mission
+ [Sounds impossible]
    Agent 0x99: Maybe. But we have to try.
    -> next_mission

// ================================================
// NEXT MISSION SETUP
// ================================================

=== next_mission ===
Agent 0x99: You've proven yourself, {player_name}.

{player_approach == "cautious":
    Agent 0x99: You said you were cautious. You were—measured, thoughtful, strategic.
}
{player_approach == "confident":
    Agent 0x99: You said you were confident. You delivered on that.
}
{player_approach == "adaptable":
    Agent 0x99: You said you were adaptable. You proved it—pivoting when needed.
}

Agent 0x99: First mission complete. But this is just the beginning.

+ [I'm ready for the next one]
    -> debrief_conclusion
+ [I need time to process this]
    Agent 0x99: Take it. But not too long. ENTROPY doesn't wait.
    -> debrief_conclusion

// ================================================
// DEBRIEF CONCLUSION
// ================================================

=== debrief_conclusion ===
Agent 0x99: One more thing.

Agent 0x99: Remember that axolotl metaphor from the briefing? About trusting your instincts?

+ [Yeah, I remember]
    -> axolotl_callback
+ [Vaguely]
    -> axolotl_callback

=== axolotl_callback ===
Agent 0x99: You've discovered which instincts to trust now.

Agent 0x99: You're not a hatchling anymore. You're an agent.

Agent 0x99: Welcome to SAFETYNET, {player_name}.

+ [Thank you, 0x99]
    -> mission_end
+ [Let's stop The Architect]
    Agent 0x99: That's the plan. One mission at a time.
    -> mission_end

// ================================================
// MISSION END
// ================================================

=== mission_end ===
#speaker:agent_0x99

Agent 0x99: Get some rest. Next briefing is in 48 hours.

Agent 0x99: And {player_name}? Good work out there.

[MISSION COMPLETE: FIRST CONTACT]

{final_choice == "arrest":
    [OUTCOME: Derek Lawson arrested - Legal prosecution pending]
}
{final_choice == "recruit":
    [OUTCOME: Derek Lawson recruited as Asset NIGHTINGALE - Double agent operation active]
}
{final_choice == "expose":
    [OUTCOME: Full public disclosure - ENTROPY operations exposed]
}

[Social Fabric cell disrupted]
[Election manipulation prevented]
[Phase 3 continues...]

-> END
