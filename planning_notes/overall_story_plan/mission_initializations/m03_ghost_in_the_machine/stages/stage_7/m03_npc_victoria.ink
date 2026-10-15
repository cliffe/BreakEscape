// ===========================================
// Mission 3: Ghost in the Machine
// NPC: Victoria Sterling (Cipher)
// Location: Conference Room (Day) / Executive Office (Night)
// ===========================================

// Influence and state tracking
VAR victoria_influence = 0
VAR victoria_trusts_player = false
VAR victoria_suspicious = false
VAR rfid_clone_started = false
VAR rfid_clone_complete = false
VAR topic_zero_day_philosophy = false
VAR topic_free_market = false
VAR topic_ethics = false
VAR recruitment_discussed = false
VAR player_approach = ""

// External variables (from game)
EXTERNAL player_name()

// ===========================================
// INITIAL MEETING - Conference Room (Daytime)
// ===========================================

=== start ===
#speaker:victoria_sterling

{not recruitment_discussed:
    #display:victoria-professional
    [Victoria Sterling stands as you enter. Professional attire, confident bearing.]

    Victoria: You must be {player_name()}. Welcome to WhiteHat Security.

    Victoria: I'm Victoria Sterling, CEO. Have a seat.

    [She gestures to the conference table.]

    ~ recruitment_discussed = true
    -> first_impression
}

{recruitment_discussed and not rfid_clone_complete:
    #display:victoria-neutral
    Victoria: Back for more conversation?
    -> hub
}

{rfid_clone_complete:
    #display:victoria-neutral
    Victoria: We covered the main points. I'll be in touch about the training program.
    #exit_conversation
    -> DONE
}

// ===========================================
// FIRST IMPRESSION
// ===========================================

=== first_impression ===
#speaker:victoria_sterling

Victoria: I reviewed your background. Freelance pen testing, some CTF competition work.

Victoria: Solid technical skills. But that's not why you're here.

* [Why am I here?]
    You: Why am I here, then?
    Victoria: To see if you understand the philosophy behind real security research.
    ~ victoria_influence += 5
    -> philosophy_intro

* [I'm interested in advanced research]
    ~ victoria_influence += 10
    You: I want to work on cutting-edge research. Real impact.
    Victoria: "Real impact." Good. Let's talk about what that means.
    -> philosophy_intro

* [I heard Zero Day does interesting work]
    ~ victoria_influence += 5
    ~ victoria_suspicious += 5
    You: I've heard Zero Day's training programs are... unconventional.
    Victoria: [Slight pause] We push boundaries, yes. Let me explain our approach.
    -> philosophy_intro

// ===========================================
// VICTORIA'S PHILOSOPHY INTRODUCTION
// ===========================================

=== philosophy_intro ===
#speaker:victoria_sterling

Victoria: The traditional security model is broken. Researchers find vulnerabilities, report them to vendors, wait months for patches.

Victoria: Meanwhile, those same vulnerabilities get discovered by others. Sold on dark markets. Exploited.

* [That's the responsible disclosure debate]
    ~ victoria_influence += 10
    You: The responsible disclosure versus full disclosure debate. Classic dilemma.
    Victoria: Exactly. But there's a third option most won't discuss.
    -> market_efficiency_pitch

* [Researchers deserve to be paid]
    ~ victoria_influence += 15
    You: Researchers deserve compensation for their work. Fair pay for valuable discoveries.
    Victoria: [Nods appreciatively] Finally, someone who gets it.
    -> market_efficiency_pitch

* [Sounds like you sell vulnerabilities]
    ~ victoria_influence -= 5
    ~ victoria_suspicious += 10
    You: This sounds like you're advocating selling vulnerabilities.
    Victoria: "Selling" is such a crude term. Think of it as market-driven research incentives.
    -> market_efficiency_pitch

// ===========================================
// MARKET EFFICIENCY PITCH
// ===========================================

=== market_efficiency_pitch ===
#speaker:victoria_sterling

Victoria: We provide liquidity to the vulnerability market.

Victoria: Every system tends toward disorder. That's thermodynamics - entropy is inevitable.

Victoria: The question isn't whether systems will fail. It's who benefits from that knowledge.

~ topic_free_market = true

-> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
+ {not topic_zero_day_philosophy} [Ask about Zero Day's mission]
    -> zero_day_philosophy

+ {not topic_ethics} [Question the ethics]
    -> ethics_discussion

+ {victoria_influence >= 20 and not rfid_clone_started} [Move closer to examine the whiteboard]
    -> clone_rfid_opportunity

+ {rfid_clone_started and not rfid_clone_complete} [Continue the conversation (RFID cloning in progress)]
    -> clone_rfid_distraction

+ [End the conversation]
    #exit_conversation
    #speaker:victoria_sterling
    {victoria_influence >= 30:
        Victoria: I think you'd be a good fit for our training program. I'll be in touch.
        ~ victoria_trusts_player = true
    }
    {victoria_influence < 30 and victoria_influence >= 10:
        Victoria: We'll review your application. Thank you for your time.
    }
    {victoria_influence < 10:
        Victoria: I'm not sure you're the right fit for Zero Day's culture. We'll be in touch.
    }
    -> DONE

// ===========================================
// ZERO DAY PHILOSOPHY DISCUSSION
// ===========================================

=== zero_day_philosophy ===
#speaker:victoria_sterling

~ topic_zero_day_philosophy = true

Victoria: Zero Day's mission is simple: recognize that vulnerability knowledge has inherent value.

Victoria: We discover, we price according to demand, we connect buyers with opportunities.

* [What do buyers do with the exploits?]
    You: And what do the buyers do with these exploits?
    Victoria: That's not our concern. We're security professionals, not moralists.
    Victoria: A gun manufacturer isn't responsible for every shooting.
    ~ victoria_influence += 5
    -> moral_rationalization

* [That sounds like willful ignorance]
    ~ victoria_influence -= 10
    ~ victoria_suspicious += 10
    You: "Not our concern"? That's willful ignorance of the consequences.
    Victoria: [Slight defensiveness] It's recognizing the reality of how markets work.
    -> moral_rationalization

* [The free market argument]
    ~ victoria_influence += 15
    You: So you're applying free market principles to vulnerability research.
    Victoria: [Smiles] Precisely. Supply and demand. Transparent economics.
    -> moral_rationalization

=== moral_rationalization ===
#speaker:victoria_sterling

Victoria: We live in a world where vulnerabilities exist whether we like it or not.

Victoria: Our choice isn't between exploit sales happening or not happening. They already happen.

Victoria: Our choice is whether security researchers get fairly compensated, or whether only criminals profit.

~ victoria_influence += 5

-> hub

// ===========================================
// ETHICS DISCUSSION
// ===========================================

=== ethics_discussion ===
#speaker:victoria_sterling

~ topic_ethics = true

Victoria: Let me guess - you want to ask about the "morality" of selling exploits.

Victoria: Go ahead. I've heard every argument.

* [What about innocent people getting hurt?]
    ~ victoria_influence -= 5
    You: What about when exploits you sold hurt innocent people? Hospitals, critical infrastructure?
    Victoria: [Measured response] That's on the buyer, not the researcher who discovered the vulnerability.
    -> ethics_response_harm

* [There's a difference between research and weaponization]
    ~ victoria_influence += 5
    You: There's a line between security research and creating weapons. Where do you draw that line?
    Victoria: Interesting question. Most people don't even acknowledge there is a line to discuss.
    -> ethics_response_nuance

* [I'm not here to judge]
    ~ victoria_influence += 15
    ~ player_approach = "diplomatic"
    You: I'm not here to judge your business model. I'm here to understand it.
    Victoria: [Genuinely pleased] That's refreshing. Most people lead with moral indignation.
    -> ethics_response_pragmatic

=== ethics_response_harm ===
#speaker:victoria_sterling

Victoria: Do you hold pharmaceutical companies responsible when someone overdoses on painkillers?

Victoria: Do you blame car manufacturers for drunk driving fatalities?

Victoria: Tools have utility. People choose how to use them.

~ victoria_influence -= 5

-> hub

=== ethics_response_nuance ===
#speaker:victoria_sterling

Victoria: The line is intent. We don't create exploits TO hurt people. We discover vulnerabilities that already exist.

Victoria: If someone uses a crowbar to break into a house, you don't blame the crowbar manufacturer.

~ victoria_influence += 10

-> hub

=== ethics_response_pragmatic ===
#speaker:victoria_sterling

Victoria: Pragmatism. I appreciate that.

Victoria: The truth is, I sleep fine at night because I believe in information freedom.

Victoria: Vulnerabilities are facts about reality. Suppressing facts doesn't make anyone safer.

~ victoria_influence += 10
~ victoria_trusts_player = true

-> hub

// ===========================================
// RFID CLONING SEQUENCE
// ===========================================

=== clone_rfid_opportunity ===
#speaker:victoria_sterling

[You stand and move toward the whiteboard, getting closer to Victoria.]

You: This network diagram - is this your training lab architecture?

Victoria: Yes, that's the 192.168.100.0 subnet. Students practice on isolated VMs.

[RFID CLONER ACTIVE - Stay within 2 meters for 10 seconds]
[Progress bar appears on screen]

~ rfid_clone_started = true

You need to keep Victoria talking while the RFID cloner does its work.

-> clone_rfid_distraction

// ===========================================
// RFID CLONING DISTRACTION
// ===========================================

=== clone_rfid_distraction ===
#speaker:victoria_sterling

Victoria: The training network uses real vulnerable services. Much more effective than theoretical exercises.

[CLONING IN PROGRESS...]

* [What services are in the lab?]
    You: What kind of services do you run in the lab environment?
    Victoria: FTP, HTTP, some legacy services like distcc. Real-world targets.
    -> clone_check_1

* [How do students access it?]
    You: How do students access the training network?
    Victoria: VPN from the server room workstations. Keeps it air-gapped from the internet.
    -> clone_check_1

* [Impressive setup]
    You: That's an impressive training environment. More realistic than most.
    ~ victoria_influence += 5
    Victoria: We pride ourselves on authenticity. Real exploits, real scenarios.
    -> clone_check_1

=== clone_check_1 ===
#speaker:victoria_sterling

[CLONING 50% COMPLETE...]

Victoria: Of course, what students learn in the lab is just the beginning.

Victoria: Real Zero Day research requires understanding market dynamics, pricing models, buyer relationships.

* [How do you price vulnerabilities?]
    You: How do you determine pricing for a zero-day vulnerability?
    Victoria: CVSS score is the baseline. Then sector premiums based on defensive capacity.
    -> clone_check_2

* [That sounds complex]
    You: That sounds more complex than pure technical work.
    Victoria: Security research is as much economics as it is code. Most researchers don't grasp that.
    ~ victoria_influence += 5
    -> clone_check_2

* [Who are your typical buyers?]
    ~ victoria_suspicious += 5
    You: Who typically buys from Zero Day?
    Victoria: [Slight pause] Clients who need access to specialized research. I can't discuss specifics.
    -> clone_check_2

=== clone_check_2 ===
#speaker:victoria_sterling

[CLONING 75% COMPLETE...]

Victoria: You're asking good questions. Technical competence is common. Strategic thinking is rare.

* [I believe in understanding the full picture]
    ~ victoria_influence += 10
    You: Technical skills alone aren't enough. You need to understand the ecosystem.
    Victoria: Exactly. That's why most security researchers stay poor while we thrive.
    -> clone_complete

* [Stay focused on the whiteboard]
    [You pretend to study the network diagram]
    You: This training lab must have taken significant investment.
    Victoria: Worth every dollar. Our students become operational faster than any university program.
    -> clone_complete

* [Just a few more seconds...]
    [Keep her talking]
    You: And the certifications - do you offer any formal credentials?
    Victoria: We don't believe in traditional certifications. Results speak louder than paper.
    -> clone_complete

// ===========================================
// RFID CLONE COMPLETE
// ===========================================

=== clone_complete ===
#speaker:victoria_sterling

[CLONING 100% COMPLETE]
[Device vibrates subtly in your pocket]
[VICTORIA STERLING'S EXECUTIVE KEYCARD CLONED]

You step back from the whiteboard, creating distance naturally.

#complete_task:clone_rfid_card
#unlock_aim:network_recon
#unlock_aim:gather_evidence
~ rfid_clone_complete = true

Victoria: I think that covers the basic philosophy. The training program starts next month if you're interested.

* [I'm very interested]
    ~ victoria_influence += 10
    You: This is exactly the kind of work I've been looking for.
    Victoria: Excellent. I'll have my assistant send you the enrollment details.
    -> meeting_end

* [I need to consider it]
    You: Let me think it over. This is a significant decision.
    Victoria: Of course. Take your time. Reach out when you've decided.
    -> meeting_end

* [Thank you for your time]
    You: I appreciate you taking the time to explain Zero Day's approach.
    Victoria: My pleasure. It's rare to meet someone who actually wants to understand rather than judge.
    ~ victoria_influence += 5
    -> meeting_end

=== meeting_end ===
#speaker:victoria_sterling

Victoria: Feel free to look around the office if you'd like. Reception area, main hallway. Get a feel for the company culture.

{victoria_trusts_player:
    Victoria: And {player_name()}? I think you'd fit in well here. We need more pragmatists.
}

Victoria: I have another meeting in a few minutes. But we'll be in touch.

[Victoria's phone buzzes. She glances at it.]

Victoria: Excuse me, I need to take this.

#exit_conversation
-> DONE

// ===========================================
// NIGHTTIME CONFRONTATION (Optional)
// ===========================================
// This knot is called if player chooses to confront Victoria
// at the end of the mission

=== nighttime_confrontation ===
#speaker:victoria_sterling

[Location: Victoria's Executive Office or Main Hallway]
[Time: Late night]

#display:victoria-shocked

Victoria: {player_name()}? What are you doing here at this hour?

[She sees that you've clearly been investigating]

Victoria: You're not a recruit, are you.

* [SAFETYNET agent. You're under investigation.]
    You: SAFETYNET. You're under investigation for exploit sales to ENTROPY cells.
    -> confrontation_safetynet

* [I know about St. Catherine's Hospital]
    You: I know about St. Catherine's. The ProFTPD exploit. Six people died.
    -> confrontation_hospital

* [You can help us take down The Architect]
    You: We know about The Architect. You can help us stop Phase 2.
    -> confrontation_recruitment

=== confrontation_safetynet ===
#speaker:victoria_sterling

#display:victoria-defensive

Victoria: SAFETYNET. Of course. The moral guardians of the status quo.

Victoria: You have no authority here. This is a legitimate business.

* [Show her the exploit catalog]
    You: [$12,500 for the hospital exploit. With a healthcare premium.]
    -> moral_confrontation

* [You sold weapons. People died.]
    You: You sold the tools that killed six people. That's not research, that's murder for profit.
    -> moral_confrontation

=== confrontation_hospital ===
#speaker:victoria_sterling

#display:victoria-conflicted

Victoria: St. Catherine's... [pause] That was a buyer's deployment decision. Not our responsibility.

* [You charged extra because they couldn't defend themselves]
    You: You charged a healthcare premium. Extra money because hospitals can't protect themselves.
    Victoria: [Defensive] That's market pricing. Reflecting risk and value.
    -> moral_confrontation

* [Six people in critical care. Two in surgery.]
    You: Six people died when patient monitoring failed. Real people. Real deaths.
    Victoria: [Visibly affected] I... we didn't deploy the ransomware. We just provided—
    You: The weapon. You provided the weapon and took payment.
    -> moral_confrontation

=== confrontation_recruitment ===
#speaker:victoria_sterling

#display:victoria-calculating

Victoria: The Architect? [Pause] You found the directive, didn't you.

Victoria: Phase 2. Healthcare SCADA. Energy grid ICS.

* [50,000 patient treatment delays. 1.2 million without power.]
    You: 50,000 patients. 1.2 million people without power in winter. That's genocide-scale harm.
    Victoria: [Shaken] Those were projections. Theoretical maximums for pricing—
    -> moral_confrontation

* [You can stop it. Become a double agent.]
    You: You can stop Phase 2. Feed us intelligence. Become a double agent.
    -> recruitment_pitch

=== moral_confrontation ===
#speaker:victoria_sterling

#display:victoria-conflicted

Victoria: I'm a security researcher. I discover vulnerabilities. That's not a crime.

Victoria: The market exists with or without me. I just participate honestly.

* [Is $12,500 worth six lives?]
    You: Was $12,500 worth six lives? Can you honestly tell me you sleep well?
    Victoria: [Long pause] I... [she struggles] The market model is sound. Individual cases don't invalidate—
    You: Individual cases? Those are people. With families. With futures you erased for profit.
    -> victoria_breaking_point

* [The Architect is using you]
    You: The Architect is using you. You're not a researcher, you're an arms dealer for a terrorist network.
    Victoria: [Defensive but wavering] We have standards. Vetting processes—
    You: You sold to GHOST. To Ransomware Incorporated. You knew exactly who they were.
    -> victoria_breaking_point

=== victoria_breaking_point ===
#speaker:victoria_sterling

#display:victoria-broken

[Victoria sits down heavily, the confidence gone]

Victoria: I told myself it was about market efficiency. About fair compensation for researchers.

Victoria: I built a whole philosophy around it. Rational. Defensible.

[She looks at her hands]

Victoria: But when I read the news about St. Catherine's... the patient deaths... I knew.

Victoria: I knew it was our exploit. And I did nothing.

* [You can still do something now]
    -> recruitment_pitch

* [You need to face justice]
    -> arrest_option

* [Say nothing, let her process]
    -> victoria_decision

=== recruitment_pitch ===
#speaker:victoria_sterling

Victoria: Become a double agent? Feed SAFETYNET intelligence on The Architect?

Victoria: If I do that, ENTROPY will kill me. You know that.

* [We can protect you. Witness protection.]
    You: SAFETYNET can protect you. New identity, relocation, the full program.
    Victoria: [Considering] And in exchange?
    You: Everything you know about The Architect. Zero Day's client list. Phase 2 targets.
    -> recruitment_consideration

* [It's the only way to stop more deaths]
    You: Phase 2 will kill thousands. You're the only one positioned to stop it.
    Victoria: [Conflicted] I'd be betraying everything I built...
    You: You'd be saving lives. Isn't that what security research is supposed to be about?
    -> recruitment_consideration

* [Or you can go to prison]
    You: The alternative is federal prison. ENTROPY operational charges. 20 years minimum.
    Victoria: [Grimly] That's not exactly a choice.
    You: It's more choice than you gave those six people at St. Catherine's.
    -> recruitment_consideration

=== recruitment_consideration ===
#speaker:victoria_sterling

[Victoria is silent for a long moment]

Victoria: If I do this... if I feed you intelligence on The Architect...

Victoria: I want immunity. Full immunity from prosecution.

Victoria: And protection for my family. They don't know about Zero Day. They're innocent.

* [SAFETYNET can arrange that]
    ~ victoria_trusts_player = true
    You: We can arrange immunity and family protection. But you have to give us everything.
    Victoria: [Nods slowly] Alright. I'll do it. I'll be your double agent.
    #complete_task:victoria_choice_made
    -> recruitment_success

* [I can't promise immunity without authorization]
    You: I don't have authority to grant immunity. But I can advocate for it.
    Victoria: [Frustrated] Not good enough. I need guarantees.
    You: Help us now, and I'll fight for your immunity. That's all I can promise.
    -> recruitment_conditional

=== recruitment_success ===
#speaker:victoria_sterling

Victoria: What do you need to know?

Victoria: The Architect's real identity? I don't know it. None of us do.

Victoria: But I know the communication channels. The encryption protocols. The payment methods.

Victoria: And I know the Phase 2 timeline. It's not theoretical. It's active.

You: When?

Victoria: Q4 2024. Three months from now. The Architect's already positioning assets.

#exit_conversation
-> DONE

=== arrest_option ===
#speaker:victoria_sterling

Victoria: Prison. [Hollow laugh] I suppose that's what I deserve.

Victoria: For what it's worth... I'm sorry. About St. Catherine's. About all of it.

Victoria: I convinced myself I was just participating in a market. But markets can be immoral too.

[She stands, hands out]

Victoria: I won't resist. Just... tell them the truth at trial. I wasn't trying to kill anyone.

You: Intent doesn't erase consequences.

Victoria: No. I suppose it doesn't.

#complete_task:victoria_choice_made
#exit_conversation
-> DONE

=== recruitment_conditional ===
#speaker:victoria_sterling

Victoria: Not good enough. I'm not risking my life on promises.

Victoria: [Stands] You have your evidence. Use it however you want.

Victoria: But I'm not betraying The Architect without guaranteed protection.

[She walks toward the door]

Victoria: I'll take my chances with lawyers.

#complete_task:victoria_choice_made
#exit_conversation
-> DONE

=== victoria_decision ===
#speaker:victoria_sterling

[Victoria looks up at you]

Victoria: What happens now?

* [You help us, or you face trial]
    -> recruitment_pitch

* [That's up to you]
    You: What happens now is your choice. Prison, or redemption.
    Victoria: [Long pause] Redemption. I choose redemption.
    -> recruitment_pitch

* [Justice happens]
    -> arrest_option

// ===========================================
// END
// ===========================================
