// ================================================
// Mission 1: First Contact - Derek Confrontation
// Act 3: Major Moral Choice
// Player confronts Derek with evidence
// ================================================

VAR confrontation_approach = ""    // diplomatic, aggressive, evidence_based
VAR derek_knows_safetynet = false
VAR derek_cooperative = false
VAR final_choice = ""              // arrest, recruit, expose, eliminate

// External variables
EXTERNAL player_name
EXTERNAL evidence_collected

// ================================================
// START: DEREK APPEARS
// ================================================

=== start ===
#complete_task:confront_derek

Derek: Working late on the security audit?

Derek: You've been very thorough. Accessing locked offices, reviewing server logs, talking to everyone.

+ [Just doing my job as an IT contractor]
    ~ confrontation_approach = "diplomatic"
    -> derek_response_cover
+ [I know who you are, Derek]
    ~ confrontation_approach = "aggressive"
    ~ derek_knows_safetynet = true
    -> derek_response_direct
+ [I have questions about your network activity]
    ~ confrontation_approach = "evidence_based"
    -> derek_response_evidence

// ================================================
// DEREK RESPONDS TO COVER STORY
// ================================================

=== derek_response_cover ===
Derek: Of course. Very professional.

Derek: But we both know you're not really an IT contractor, are we?

Derek: The way you move, the questions you ask, the systems you've accessed...

+ [I don't know what you mean]
    -> derek_calls_bluff
+ [You're right. I'm SAFETYNET]
    ~ derek_knows_safetynet = true
    -> derek_response_safetynet

=== derek_calls_bluff ===
Derek: Come on. Give me some credit.

Derek: I've been watching you watch me. We're professionals here.

-> derek_response_safetynet

// ================================================
// DEREK RESPONDS TO DIRECT APPROACH
// ================================================

=== derek_response_direct ===
Derek: SAFETYNET. I wondered when you'd show up.

Derek: Took you long enough. I've been operating here for three months.

+ [That ends tonight]
    -> derek_challenge
+ [We know about Social Fabric]
    -> derek_social_fabric

=== derek_challenge ===
Derek: Does it? You're one agent. I'm one operative. What happens now?

-> present_evidence

=== derek_social_fabric ===
Derek: Social Fabric. The Architect. Phase 3. You know the names but not what they mean.

-> present_evidence

// ================================================
// DEREK RESPONDS TO EVIDENCE
// ================================================

=== derek_response_evidence ===
Derek: Network activity. How specific.

Derek: Let me guess—you found the backdoor, the server access, the encrypted communications?

+ [All of it]
    -> derek_impressed
+ [Enough to know you're ENTROPY]
    ~ derek_knows_safetynet = true
    -> derek_response_safetynet

=== derek_impressed ===
Derek: Thorough. I'm actually impressed.

Derek: Not many people could piece that together. SAFETYNET training, I assume?

~ derek_knows_safetynet = true

-> derek_response_safetynet

// ================================================
// DEREK ACKNOWLEDGES SAFETYNET
// ================================================

=== derek_response_safetynet ===
Derek: So what now? You arrest me? Call in your team?

Derek: Or did you come alone to have a conversation first?

-> present_evidence

// ================================================
// PRESENT EVIDENCE
// ================================================

=== present_evidence ===
You explain what you've found:

You: Firmware backdoor in the edge router. Three months of network monitoring.

You: Encrypted communications with other ENTROPY cells. Demographic data collection.

You: Disinformation campaign planning. Phase 3 references.

Derek: You have been thorough.

+ [What is Phase 3?]
    -> phase_3_explanation
+ [Why do this? Why ENTROPY?]
    -> derek_motivation
+ [This stops now]
    -> confrontation_choice

// ================================================
// PHASE 3 EXPLANATION
// ================================================

=== phase_3_explanation ===
Derek: Phase 3 is... enlightenment, you could call it.

Derek: The Architect believes systems inherently tend toward chaos. We just accelerate the inevitable.

+ [That's justification for terrorism]
    Derek: Is it terrorism to reveal truth? To demonstrate that security is an illusion?
    -> derek_philosophy
+ [You're manipulating people]
    Derek: Everyone manipulates people. We're just honest about it.
    -> derek_philosophy

=== derek_philosophy ===
Derek: You think your elections are secure? Your infrastructure is protected?

Derek: We'll prove otherwise. Not with bombs—with demonstration of how fragile everything really is.

-> derek_motivation

// ================================================
// DEREK'S MOTIVATION
// ================================================

=== derek_motivation ===
Derek: Why ENTROPY? Because The Architect showed me the truth.

Derek: Every security system fails. Every organization collapses. Entropy always wins.

Derek: We're not villains. We're... educators. Demonstrating reality that people refuse to see.

+ [You're rationalizing harm]
    ~ confrontation_approach = "aggressive"
    Derek: And you're rationalizing surveillance and control. We're not so different.
    -> confrontation_choice
+ [You sound like you actually believe this]
    ~ confrontation_approach = "diplomatic"
    ~ derek_cooperative = true
    Derek: I do. That's what makes us dangerous—we're not criminals chasing money. We're believers.
    -> confrontation_choice

// ================================================
// CONFRONTATION CHOICE (Major Decision)
// ================================================

=== confrontation_choice ===
Derek: So. Here we are.

Derek: What happens next is up to you.

+ [I'm calling in SAFETYNET. You're under arrest]
    ~ final_choice = "arrest"
    #complete_task:final_resolution
    -> choice_arrest
+ [I have a proposition—work for us instead]
    ~ final_choice = "recruit"
    #complete_task:final_resolution
    -> choice_recruit
+ [I'm exposing everything publicly]
    ~ final_choice = "expose"
    #complete_task:final_resolution
    -> choice_expose

// ================================================
// CHOICE: ARREST (Surgical Strike)
// ================================================

=== choice_arrest ===
You: You'll face justice through proper channels.

{derek_cooperative:
    Derek: Interesting. You could eliminate me quietly, but you're choosing the legal path.
    Derek: I respect that, actually. It's principled.
    -> arrest_cooperative
- else:
    Derek: The legal system. How quaint.
    Derek: You realize I'll claim whistleblower protection? Expose corporate surveillance?
    -> arrest_hostile
}

=== arrest_cooperative ===
Derek: I won't resist. But you should know—there are others.

Derek: Social Fabric isn't just me. Phase 3 continues with or without this operation.

You: That's for SAFETYNET to handle.

You call in backup. Derek is taken into custody professionally.

-> arrest_outcome

=== arrest_hostile ===
Derek: This will get messy. Media attention, legal battles, public scrutiny of SAFETYNET.

Derek: But if that's how you want to play it...

You call in backup. Derek is arrested but promises a legal fight.

-> arrest_outcome

=== arrest_outcome ===
#speaker:agent_0x99

Agent 0x99: Backup team is on site. Derek Lawson in custody.

Agent 0x99: Good work, {player_name}. Clean operation.

-> END

// ================================================
// CHOICE: RECRUIT (Double Agent)
// ================================================

=== choice_recruit ===
You: ENTROPY is going down. You can go down with it, or you can help us stop Phase 3.

Derek: Become a double agent? Feed you intelligence while maintaining my ENTROPY cover?

+ [Exactly. You keep your cell's trust, we get inside information]
    -> recruit_negotiation
+ [Or face prosecution. Your choice]
    -> recruit_pressure

=== recruit_negotiation ===
Derek: Interesting proposition.

Derek: What's in it for me? Immunity? Protection?

+ [Full immunity for cooperation. Witness protection if needed]
    ~ derek_cooperative = true
    -> recruit_accept
+ [A chance to do the right thing]
    Derek: I'm a true believer, remember? "Right thing" is subjective.
    Derek: But immunity and protection... that I can work with.
    -> recruit_accept

=== recruit_pressure ===
Derek: Threatening prosecution? That's your angle?

Derek: Fine. But understand—I'm doing this for my survival, not because I've seen the error of my ways.

-> recruit_accept

=== recruit_accept ===
Derek: I'll do it. Feed you intelligence, maintain my ENTROPY connections.

Derek: But you should know—if The Architect suspects I'm compromised, I'm dead.

Derek: So keep me alive, and I'll keep you informed about Phase 3.

#speaker:agent_0x99

Agent 0x99: {player_name}, this is high risk. But if it works, we'll have unprecedented ENTROPY access.

Agent 0x99: Derek Lawson is now Asset NIGHTINGALE. Proceed with extreme caution.

-> END

// ================================================
// CHOICE: EXPOSE (Public Disclosure)
// ================================================

=== choice_expose ===
You: I'm taking everything I've found—the backdoors, the emails, the evidence—and going public.

Derek: Public disclosure? That's bold.

Derek: You'll expose ENTROPY operations, but also Viral Dynamics' complete security failure.

+ [The public deserves to know the truth]
    -> expose_truth
+ [Transparency is the only way]
    -> expose_transparency

=== expose_truth ===
Derek: Noble. Naive, but noble.

Derek: You'll destroy this company, ruin careers, cause panic. All for "truth."

+ [Better than letting ENTROPY operate in shadows]
    -> expose_execute
+ [The alternative is worse]
    -> expose_execute

=== expose_transparency ===
Derek: Transparency. The Architect would appreciate the irony.

Derek: You're proving our point—that security through obscurity fails when exposed.

-> expose_execute

=== expose_execute ===
Derek: Well, if you're doing this, you should know the full scope.

Derek: Social Fabric is coordinating with Zero Day Syndicate, Ransomware Inc., and Critical Mass. Multiple cells, one operation.

Derek: Expose it all. Let the chaos unfold.

You begin compiling the evidence for public release.

#speaker:agent_0x99

Agent 0x99: {player_name}, Director Netherton is furious. We don't do public disclosures.

Agent 0x99: But... the evidence is already out there. Viral Dynamics, ENTROPY operations, everything.

Agent 0x99: The fallout is going to be massive.

-> END
