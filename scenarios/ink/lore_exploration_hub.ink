// ===========================================
// LORE EXPLORATION HUB
// Break Escape Universe
// ===========================================
// Reusable dialogue system for exploring SAFETYNET and ENTROPY lore
// Can be triggered during missions or between operations
// Tracks influence with NPCs and unlocks deeper information
// ===========================================

// Influence tracking (different NPCs can use different influence pools)
VAR handler_influence = 0           // Relationship with handler (like Haxolottle)
VAR tech_influence = 0              // Relationship with technical support (like Dr. Chen)
VAR director_influence = 0          // Relationship with command (like Netherton)
VAR fellow_agent_influence = 0      // Relationship with peer agents

// Topic tracking - what has the player already discussed?
VAR discussed_entropy_origins = false
VAR discussed_entropy_philosophy = false
VAR discussed_entropy_cells = false
VAR discussed_entropy_tactics = false
VAR discussed_safetynet_mission = false
VAR discussed_safetynet_methods = false
VAR discussed_shadow_war = false
VAR discussed_field_ops = false
VAR discussed_cyber_physical = false
VAR discussed_moral_complexity = false

// Deep lore unlocks (requires high influence)
VAR knows_berlin_crisis = false
VAR knows_handler_backstory = false
VAR knows_entropy_masterminds = false
VAR knows_0x42_legend = false

// Conversation state
VAR current_speaker = "handler"    // handler, tech_support, director, fellow_agent
VAR conversation_depth = 0         // Tracks how much player has explored
VAR player_curiosity_noted = false

// External variables
EXTERNAL player_name
EXTERNAL mission_active

// ===========================================
// ENTRY POINT - HANDLER CONVERSATION
// ===========================================

=== start_handler_lore ===
~ current_speaker = "handler"

{mission_active:
    Haxolottle: Got a quiet moment? Happy to answer questions while you're on downtime.
- else:
    Haxolottle: What's on your mind, Agent {player_name}? Need some context about what we're up against?
}

-> lore_hub_handler

// ===========================================
// HANDLER LORE HUB (Haxolottle-style)
// ===========================================

=== lore_hub_handler ===
+ {not discussed_entropy_origins} [Ask about ENTROPY's origins]
    -> entropy_origins_handler
+ {not discussed_entropy_philosophy} [Ask about ENTROPY's philosophy]
    -> entropy_philosophy_handler
+ {not discussed_entropy_cells and discussed_entropy_origins} [Ask about specific ENTROPY cells]
    -> entropy_cells_handler
+ {not discussed_safetynet_mission} [Ask about SAFETYNET's mission]
    -> safetynet_mission_handler
+ {not discussed_shadow_war and discussed_safetynet_mission and discussed_entropy_origins} [Ask about the shadow war]
    -> shadow_war_handler
+ {not discussed_field_ops} [Ask for field operation advice]
    -> field_ops_advice_handler
+ {not discussed_cyber_physical and discussed_field_ops} [Ask about CYBER-PHYSICAL work specifically]
    -> cyber_physical_handler
+ {handler_influence >= 30 and not knows_handler_backstory} [Ask about Haxolottle's past]
    -> handler_backstory
+ {handler_influence >= 50 and not knows_berlin_crisis} [Ask about difficult operations]
    -> berlin_crisis_story
+ [That's all for now]
    -> end_handler_conversation

// ===========================================
// ENTROPY ORIGINS
// ===========================================

=== entropy_origins_handler ===
~ discussed_entropy_origins = true
~ handler_influence += 5
~ conversation_depth += 1

Haxolottle: Ah, the big question. Where did ENTROPY come from?

Haxolottle: Honestly? We're not entirely sure. Our best intelligence suggests they emerged in the early 2020s during the pandemic chaos. Digital transformation accelerated, security practices couldn't keep up, and someone—or multiple someones—saw an opportunity.

Haxolottle: At first, we thought we were tracking different threat actors. Then patterns emerged. Shared tactics. Coordinated timing. Resources moving between what we thought were independent groups.

Haxolottle: By 2025, it was clear: this was an organization. Decentralized, cell-based, but unified by something. Philosophy, funding, leadership—we're still piecing it together.

* [That's concerning]
    ~ handler_influence += 3
    You: So we're fighting an enemy we don't fully understand?
    -> entropy_origins_followup_concern

* [Ask about their goals]
    ~ conversation_depth += 1
    You: What are they actually trying to achieve?
    -> entropy_origins_followup_goals

* [Thank them for the information]
    You: That helps contextualize things. Thank you.
    -> lore_hub_handler

=== entropy_origins_followup_concern ===
Haxolottle: Haxolottle nods seriously.

Haxolottle: Yes and no. We understand their methods—we see them in action every day. We understand their capabilities—they're formidable but not unlimited.

Haxolottle: What we don't fully grasp is the "why" behind the "what." And that uncertainty means we have to stay adaptable. Like an axolotl adjusting to different water conditions—we work with what we know and adapt as we learn more.

~ handler_influence += 5
-> lore_hub_handler

=== entropy_origins_followup_goals ===
Haxolottle: Haxolottle leans back, considering.

Haxolottle: That's where it gets interesting. Different ENTROPY cells seem to have different goals. Some are clearly financial—ransomware, data theft, extortion. Others appear ideological—accelerationism, techno-anarchism, chaos for its own sake.

Haxolottle: Then there are the esoteric cells. The ones pursuing objectives we can barely comprehend. Reality manipulation. Entity summoning. Quantum consciousness alteration. That's the stuff that keeps me up at night.

Haxolottle: The unifying thread seems to be "entropy"—increasing chaos, destabilizing systems, accelerating societal breakdown. Whether that's means or end, we're not certain.

~ discussed_entropy_philosophy = true
~ handler_influence += 8
~ conversation_depth += 1
-> lore_hub_handler

// ===========================================
// ENTROPY PHILOSOPHY
// ===========================================

=== entropy_philosophy_handler ===
~ discussed_entropy_philosophy = true
~ handler_influence += 5
~ conversation_depth += 1

Haxolottle: ENTROPY's philosophy... it's not monolithic. Each cell interprets it differently.

Haxolottle: Some are true believers in accelerationism—tear down existing systems to build something new from the ashes. They genuinely think they're helping, in a twisted way.

Haxolottle: Others are nihilists. They want chaos for its own sake. No grand vision, just destabilization and disorder.

Haxolottle: And some are just using the philosophy as cover for criminal enterprise. The ideology gives them structure and recruitment, but they're in it for money and power.

* [Ask which type is most dangerous]
    ~ conversation_depth += 1
    You: Which type poses the greatest threat?
    -> philosophy_danger_assessment

* [Ask if any can be reasoned with]
    ~ handler_influence += 8
    ~ conversation_depth += 1
    You: Can any of them be reasoned with? Turned?
    -> philosophy_redemption_question

* [Move on]
    -> lore_hub_handler

=== philosophy_danger_assessment ===
Haxolottle: The true believers, without question.

Haxolottle: Criminals can be caught, assets seized, organizations dismantled. Nihilists burn out eventually—chaos for its own sake is exhausting.

Haxolottle: But ideologues? They're patient. They're persistent. They'll sacrifice themselves for the cause. And they're often brilliant people who genuinely believe they're doing the right thing.

Haxolottle: That makes them harder to predict, harder to deter, and much more dangerous long-term.

~ handler_influence += 8
-> lore_hub_handler

=== philosophy_redemption_question ===
Haxolottle: Haxolottle looks thoughtful.

Haxolottle: You're asking the right questions, Agent. That shows good judgment.

Haxolottle: Yes. Some can be reasoned with. We've had defectors—people who joined ENTROPY for idealistic reasons and realized the reality didn't match the rhetoric. People who were coerced or manipulated.

Haxolottle: Part of our job is recognizing the difference between committed operatives and unwitting participants. The handbook has entire sections on engagement protocols for potentially redeemable assets.

Haxolottle: Not everyone wearing an ENTROPY badge is beyond saving. Some are just... lost. And if we can offer a better path, we should.

~ handler_influence += 15
~ discussed_moral_complexity = true
-> lore_hub_handler

// ===========================================
// ENTROPY CELLS
// ===========================================

=== entropy_cells_handler ===
~ discussed_entropy_cells = true
~ handler_influence += 5
~ conversation_depth += 1

Haxolottle: We've identified about a dozen major ENTROPY cells, each with distinct specializations and methodologies.

Haxolottle: Let me give you the highlights of the ones you're most likely to encounter:

Haxolottle: **Digital Vanguard**—pure cyber operations. APT-level capabilities, zero-day exploitation, sophisticated malware. They're the technical elite.

Haxolottle: **Critical Mass**—infrastructure targeting. Power grids, water systems, transportation networks. They want maximum societal impact.

Haxolottle: **Ghost Protocol**—the surveillance experts. They gather intelligence, compile dossiers, and sell information. Knowledge is their weapon.

Haxolottle: **Ransomware Incorporated**—exactly what it sounds like. Criminal enterprise wrapped in ENTROPY ideology. Financially motivated but effective.

* [Ask about a specific cell]
    -> specific_cell_details

* [Ask how cells coordinate]
    ~ conversation_depth += 1
    You: How do these cells coordinate?
    -> cell_coordination_explanation

* [That's enough for now]
    -> lore_hub_handler

=== specific_cell_details ===

Haxolottle: Which one are you curious about?

+ [Digital Vanguard]
    -> digital_vanguard_details
+ [Critical Mass]
    -> critical_mass_details
+ [Ghost Protocol]
    -> ghost_protocol_details
+ [Ransomware Incorporated]
    -> ransomware_inc_details
+ [Actually, never mind]
    -> lore_hub_handler

=== digital_vanguard_details ===
~ handler_influence += 3

Haxolottle: Digital Vanguard—the tech perfectionists of ENTROPY. They treat hacking like an art form.

Haxolottle: They specialize in advanced persistent threats, supply chain compromises, and zero-day exploitation. If there's a vulnerability no one's found yet, Digital Vanguard is probably looking for it.

Haxolottle: They recruit heavily from academic institutions and competitive hacking scenes. Lots of CTF champions who went to the dark side.

Haxolottle: Their operations tend to be surgical—highly targeted, meticulously planned, technically brilliant. When you encounter their work, you'll recognize the craftsmanship.

-> lore_hub_handler

=== critical_mass_details ===
~ handler_influence += 3

Haxolottle: Critical Mass—the infrastructure saboteurs. They're after the systems that keep society running.

Haxolottle: Power grids, water treatment, transportation networks, telecommunications. They target the foundations. Their stated goal is demonstrating how fragile our infrastructure really is.

Haxolottle: What makes them particularly dangerous is they combine cyber expertise with understanding of industrial control systems and physical infrastructure. CYBER-PHYSICAL threats, through and through.

Haxolottle: They've been linked to several near-miss incidents. We've stopped them more often than the public knows. But we don't catch everything.

-> lore_hub_handler

=== ghost_protocol_details ===
~ handler_influence += 3

Haxolottle: Ghost Protocol—the information brokers and surveillance specialists.

Haxolottle: They don't typically execute attacks directly. Instead, they gather intelligence, compile dossiers, and sell information to the highest bidder—often other ENTROPY cells.

Haxolottle: They're masters of OSINT, social engineering, and long-term surveillance operations. They know more about our operations than I'm comfortable with.

Haxolottle: Encountering Ghost Protocol is weird because they're often not hostile—they'll observe, document, and vanish. The danger comes later when someone else uses that intelligence against you.

-> lore_hub_handler

=== ransomware_inc_details ===
~ handler_influence += 3

Haxolottle: Ransomware Incorporated—the criminal enterprise wing of ENTROPY.

Haxolottle: They're straightforward in motivation: money. They deploy ransomware, steal data for extortion, and run business email compromise schemes at scale.

Haxolottle: What makes them ENTROPY rather than ordinary cybercrime is their infrastructure and support network. They operate like a legitimate business—HR, customer service, even help desks for victims who need decryption assistance.

Haxolottle: Don't underestimate them just because they're financially motivated. They're professional, well-resourced, and surprisingly effective.

-> lore_hub_handler

=== cell_coordination_explanation ===
~ handler_influence += 8

Haxolottle: Good question. The answer is: we're not entirely certain.

Haxolottle: Cells appear to operate independently most of the time. Autonomous operations, separate resources, minimal communication.

Haxolottle: But occasionally—maybe 10% of cases—we see coordination. Shared intelligence. Resource transfers. Synchronized operations across multiple cells.

Haxolottle: That suggests some kind of coordination mechanism or higher authority, but we haven't identified it. No central command that we can find. No obvious communication channels.

Haxolottle: It's one of the biggest intelligence gaps we have. How do decentralized cells occasionally act in concert? Still working on that one.

-> lore_hub_handler

// ===========================================
// SAFETYNET MISSION
// ===========================================

=== safetynet_mission_handler ===
~ discussed_safetynet_mission = true
~ handler_influence += 5
~ conversation_depth += 1

Haxolottle: SAFETYNET's mission? Officially, we're the Security And Field-Engagement Technology Yielding Nonaligned Emergency Taskforce.

Haxolottle: *grins* Unofficially, we're the people who stop ENTROPY from burning down digital civilization.

Haxolottle: We operate in a legal gray area—offensive security operations that most governments won't publicly acknowledge. We infiltrate, we gather intelligence, we neutralize threats before they materialize.

Haxolottle: The philosophy is "best defense is a preemptive offense." Don't wait for ENTROPY to attack. Find them first. Understand their operations. Dismantle them before they strike.

* [Ask about legal authority]
    ~ conversation_depth += 1
    ~ player_curiosity_noted = true
    You: What's our actual legal authority for these operations?
    -> legal_authority_question

* [Ask about oversight]
    ~ conversation_depth += 1
    ~ handler_influence += 5
    You: Who oversees SAFETYNET? Who do we answer to?
    -> oversight_question

* [Move on]
    -> lore_hub_handler

=== legal_authority_question ===
Haxolottle: Short answer? We haven't got one.

Haxolottle: There's no warrant behind you. No statute, no charter anyone could produce in a courtroom. When you walk into a building, you walk in because somebody believed the story you told them at the desk.

Haxolottle: That's what the cover actually is. Not paperwork with a seal on it. A consultant, a contractor, an auditor with a clipboard and a plausible reason to be near the server room. The access is real because the story held, and for no other reason.

Haxolottle: Which is why we're careful about what we do once we're inside. There's nothing underneath us to catch anybody. If the story stops holding, it stops holding everywhere at once.

~ handler_influence += 10
~ discussed_moral_complexity = true
-> lore_hub_handler

=== oversight_question ===
Haxolottle: The Command Council. People like Director Netherton.

Haxolottle: That's the list. I know how that sounds.

Haxolottle: There's no board above them, no inspectorate, nobody who turns up once a year to read our files and tell us we've overstepped. If we get this wrong, the correction has to come from inside the building or it doesn't come at all.

Haxolottle: So the rules of engagement aren't bureaucracy. They're the only thing in the structure doing that job. It's also why recruitment takes as long as it does — they're not checking whether you can do the work. They're checking what you'd do when nobody could stop you.

~ handler_influence += 12
~ discussed_moral_complexity = true
-> lore_hub_handler

// ===========================================
// SHADOW WAR
// ===========================================

=== shadow_war_handler ===
~ discussed_shadow_war = true
~ handler_influence += 8
~ conversation_depth += 1

Haxolottle: The shadow war. That's what we call it—the ongoing conflict between SAFETYNET and ENTROPY that the public never sees.

Haxolottle: Every day, ENTROPY operatives are planning attacks, infiltrating systems, recruiting new members. And every day, we're working to stop them.

Haxolottle: Most people will never know how many disasters we've prevented. Power grids that almost went down. Data breaches that almost happened. Infrastructure attacks we intercepted.

Haxolottle: And ENTROPY doesn't know about most of our successes—that's by design. If they knew how often we've infiltrated them, they'd change their security. Better to stay invisible.

Haxolottle: It's exhausting, honestly. A war where victories aren't celebrated and defeats are catastrophic. Where we can't tell anyone what we do or why it matters.

* [Express appreciation for the work]
    ~ handler_influence += 10
    You: That sounds incredibly difficult. Thank you for what you do—what we all do.
    -> shadow_war_appreciation

* [Ask about the toll it takes]
    ~ handler_influence += 12
    ~ conversation_depth += 1
    You: How do you handle that? The invisibility, the pressure?
    -> shadow_war_psychological

* [Move on]
    -> lore_hub_handler

=== shadow_war_appreciation ===
Haxolottle: Haxolottle smiles, genuinely touched.

Haxolottle: Thank you, Agent. That means more than you might think.

Haxolottle: We're in this together now. Every operation you run, every threat you neutralize—you're part of this shadow war. And you're making a difference, even if the world never knows.

~ handler_influence += 10
-> lore_hub_handler

=== shadow_war_psychological ===
Haxolottle: Haxolottle takes a moment before responding.

Haxolottle: Honestly? It's hard. Some days I wonder if we're making any difference. We stop one cell, two more spring up. We close one vulnerability, ENTROPY finds three others.

Haxolottle: What keeps me going is the people. My agents. Colleagues like you. Knowing we're fighting for something that matters, even in the shadows.

Haxolottle: And regeneration—like the axolotl. When the work breaks you down, you find ways to rebuild. Take time to recover. Support each other. Remember why we started.

Haxolottle: You'll have hard days too, Agent. When that happens, remember you're not alone. We've all been there. We'll help you through it.

~ handler_influence += 15
~ knows_handler_backstory = true
-> lore_hub_handler

// ===========================================
// FIELD OPERATIONS ADVICE
// ===========================================

=== field_ops_advice_handler ===
~ discussed_field_ops = true
~ handler_influence += 5
~ conversation_depth += 1

Haxolottle: Field operations advice? I've got fifteen years of hard-earned lessons. Where do I start?

Haxolottle: **First**: Trust your training, but don't be a slave to it. Plans fall apart. Improvisation is part of the job. Like an axolotl adapting to new environments.

Haxolottle: **Second**: Maintain your cover story. You're not "undercover"—you ARE the cover. Believe it yourself. Act like you belong, and people will believe you belong.

Haxolottle: **Third**: OPSEC is everything. One mistake—using your real name, accessing personal accounts, breaking character—can blow the whole operation.

Haxolottle: **Fourth**: When in doubt, slow down. Rushing causes mistakes. Better to take an extra hour than to trigger an alarm.

* [Ask about handling complications]
    ~ conversation_depth += 1
    You: What about when things go wrong?
    -> complications_advice

* [Ask about fear management]
    ~ conversation_depth += 1
    ~ handler_influence += 8
    You: How do you handle fear in the field?
    -> fear_management

* [Thank them for the advice]
    -> lore_hub_handler

=== complications_advice ===
~ handler_influence += 8

Haxolottle: When things go wrong—and they will—focus on what you can control.

Haxolottle: Unexpected security patrol? You control your reaction. Maintain cover, adjust route, stay calm.

Haxolottle: System you're trying to access is different than intel suggested? You control your approach. Reassess, find alternative, or call for support.

Haxolottle: Mission parameters change mid-operation? You control your decision-making. Communicate with me, evaluate options, make the call.

Haxolottle: The agents who survive and succeed aren't the ones who never encounter problems. They're the ones who handle problems effectively.

Haxolottle: Regeneration. Adaptation. Like—

You: Let me guess. Like an axolotl?

Haxolottle: *laughs* You're catching on.

~ handler_influence += 10
-> lore_hub_handler

=== fear_management ===
~ handler_influence += 12

Haxolottle becomes more serious.

Haxolottle: Fear is normal. Healthy, even. It keeps you sharp.

Haxolottle: The trick isn't eliminating fear—it's functioning despite it. Feel the fear, acknowledge it, then put it aside and do the work.

Haxolottle: Breathing helps. Tactical breathing—four counts in, hold four, four counts out, hold four. Resets your nervous system.

Haxolottle: And remember: you're not alone. I'm on comms. Support team is monitoring. You have backup plans and extraction protocols. You're prepared for this.

Haxolottle: I've been exactly where you'll be—heart pounding, hands shaking, wondering if you're going to get caught. I got through it. You will too.

~ handler_influence += 15
-> lore_hub_handler

// ===========================================
// CYBER-PHYSICAL WORK
// ===========================================

=== cyber_physical_handler ===
~ discussed_cyber_physical = true
~ handler_influence += 8
~ conversation_depth += 1

Haxolottle: CYBER-PHYSICAL work is where things get interesting. It's the intersection of digital and physical security.

Haxolottle: You need to think in both domains simultaneously. You're physically infiltrating a facility AND conducting network reconnaissance. Bypassing door locks AND exploiting system vulnerabilities.

Haxolottle: The physical gives you access to the digital. Air-gapped systems you can't reach remotely. Hardware implants you need to place manually. Networks you have to be inside to attack.

Haxolottle: And the digital gives you advantages in the physical. Disabling cameras remotely. Unlocking doors electronically. Accessing building management systems.

Haxolottle: Best CYBER-PHYSICAL operations use both in concert—a beautiful symphony of integrated exploitation.

* [Ask about common CYBER-PHYSICAL scenarios]
    ~ conversation_depth += 1
    You: What are typical CYBER-PHYSICAL mission types?
    -> cyber_physical_scenarios

* [Ask what makes it challenging]
    ~ conversation_depth += 1
    You: What makes CYBER-PHYSICAL work harder than single-domain operations?
    -> cyber_physical_challenges

* [Move on]
    -> lore_hub_handler

=== cyber_physical_scenarios ===
~ handler_influence += 5

Haxolottle: Common scenarios? Let me walk you through the hits:

Haxolottle: **Server room infiltration**—physically access air-gapped systems, extract data, implant monitoring devices. Classic CYBER-PHYSICAL.

Haxolottle: **Supply chain interdiction**—intercept hardware shipments, implant backdoors in devices, return them to the supply chain. Physical access enables digital compromise.

Haxolottle: **Facility reconnaissance**—gather physical intelligence about layout, security, personnel while simultaneously mapping network architecture and digital assets.

Haxolottle: **Critical infrastructure assessment**—evaluate both physical security of facilities and cyber security of control systems. Finding the intersection vulnerabilities.

Haxolottle: You'll run all of these eventually. Each one teaches you something about integrating the domains.

-> lore_hub_handler

=== cyber_physical_challenges ===
~ handler_influence += 8

Haxolottle: The challenge is cognitive load. You're managing two completely different threat models simultaneously.

Haxolottle: Physically, you're worried about: security cameras, patrol schedules, access controls, maintaining cover, physical evidence.

Haxolottle: Digitally, you're worried about: network monitoring, intrusion detection, log analysis, data exfiltration, digital forensics.

Haxolottle: And they interact in complex ways. Bypassing a door physically might create a digital log. Hacking a camera system requires physical access to a network port.

Haxolottle: You need to think like a penetration tester AND a burglar simultaneously. It's mentally exhausting until you develop the integration instinct.

Haxolottle: But that's why you're here. You've got the foundations in both domains. Now we teach you to weave them together.

~ handler_influence += 10
-> lore_hub_handler

// ===========================================
// DEEP LORE - HANDLER BACKSTORY
// ===========================================

=== handler_backstory ===
~ knows_handler_backstory = true
~ handler_influence += 15
~ conversation_depth += 2

Haxolottle looks surprised by the question.

Haxolottle: You want to know about my past? Most agents don't ask.

Haxolottle: I joined SAFETYNET... fifteen years ago. Recruited from a penetration testing firm after I responsibly disclosed some very uncomfortable vulnerabilities in government systems.

Haxolottle: Spent eight years in the field. Ran operations across four continents. Infiltrated ENTROPY cells, extracted intelligence, survived situations that probably should have killed me.

Haxolottle: The "Haxolottle" callsign came from Operation Regenerate—got pinned in a compromised position for seventy-two hours. Maintained cover, adapted strategy, turned what should have been a catastrophic failure into our biggest intelligence coup that year.

Haxolottle: During those three days, the only reading material I had was biology texts. Learned about axolotl regeneration. The metaphor stuck.

* [Ask why they became a handler]
    ~ conversation_depth += 1
    You: Why did you transition from field work to handling?
    -> why_handler_transition

* [Ask about the operation that earned the callsign]
    ~ conversation_depth += 1
    You: What exactly happened during Operation Regenerate?
    -> operation_regenerate_story

* [Express appreciation]
    You: Thank you for sharing that. It helps to know your background.
    -> lore_hub_handler

=== why_handler_transition ===
~ handler_influence += 10

Haxolottle: Good question. Honestly? I was getting burned out.

Haxolottle: Eight years of field work takes a toll. The stress. The constant danger. The isolation of maintaining cover identities for months.

Haxolottle: Then I got paired with a junior agent on a complex operation—mentorship role. Realized I was better at teaching than I expected. And I genuinely enjoyed helping them succeed.

Haxolottle: After that mission, SAFETYNET offered me a handler position. Chance to use my experience to support the next generation. Less personal risk, more strategic impact.

Haxolottle: I won't lie—I miss the field sometimes. The adrenaline. The direct action. But watching agents I've trained succeed? That's its own kind of satisfaction.

Haxolottle: And I get to make all the axolotl metaphors I want without someone telling me to shut up and focus on the mission.

~ handler_influence += 15
-> lore_hub_handler

=== operation_regenerate_story ===
~ handler_influence += 12

Haxolottle: Operation Regenerate. That's a story.

Haxolottle: I'd infiltrated an ENTROPY cell by assuming a compromised identity. Deep cover, weeks of preparation. Was gathering intelligence on their network structure and leadership.

Haxolottle: Then the original identity holder showed up. Unplanned. Unexpected. Suddenly I'm in a room with someone who knows I'm not who I claim to be.

Haxolottle: Couldn't extract—would have blown the entire operation and exposed SAFETYNET's capabilities. Couldn't maintain cover—he knew. Couldn't neutralize the threat—too many witnesses.

Haxolottle: So I improvised. Convinced him I was ENTROPY internal security running a loyalty test. Played it aggressive. Turned the tables.

Haxolottle: Spent seventy-two hours in that role—investigating "security concerns," interviewing cell members, all while extracting intelligence and praying he wouldn't call my bluff.

Haxolottle: Got out with intelligence that led to dismantling three connected cells. And a profound appreciation for regeneration—rebuilding your approach when the original plan dies.

~ handler_influence += 15
-> lore_hub_handler

// ===========================================
// DEEP LORE - BERLIN CRISIS
// ===========================================

=== berlin_crisis_story ===
~ knows_berlin_crisis = true
~ handler_influence += 20
~ director_influence += 10

Haxolottle's expression becomes somber.

Haxolottle: The Berlin Crisis. That's... not a story many people know.

Haxolottle: It happened about two years ago. SAFETYNET operation in Berlin—routine ENTROPY cell investigation that turned into a nightmare.

Haxolottle: One of our agents got compromised. Captured by the cell. ENTROPY was going to expose them, blow SAFETYNET operations across Europe.

Haxolottle: Director Netherton coordinated the extraction personally. Bent several handbook rules. Made some very questionable calls about collateral risk.

Haxolottle: But he got our agent out. Alive. Safe. The mission was technically a failure—lost the ENTROPY cell, burned intelligence assets—but Netherton prioritized the agent's life over operational success.

Haxolottle: It's why he's so strict about protocols now. Why he quotes the handbook constantly. Because when he broke the rules to save someone, it cost us dearly.

Haxolottle: And it's why I trust him completely. He'll protect you, Agent. Even when it costs him.

~ handler_influence += 20
~ discussed_moral_complexity = true
-> lore_hub_handler

// ===========================================
// END HANDLER CONVERSATION
// ===========================================

=== end_handler_conversation ===

{conversation_depth >= 5:
    Haxolottle: You ask good questions, Agent {player_name}. Curiosity is a valuable trait in this work. Keep thinking deeply about what we do and why.
    ~ handler_influence += 10
- else:
    Haxolottle: Anytime you want to talk, I'm here. Understanding the context helps you do the job better.
    ~ handler_influence += 5
}

#exit_conversation
-> END

// ===========================================
// ALTERNATIVE ENTRY POINTS
// ===========================================

// Entry point for technical support NPC (like Dr. Chen)
=== start_tech_support_lore ===
~ current_speaker = "tech_support"

Dr. Chen: Got questions? I can explain technical details about ENTROPY's methods or our countermeasures. Rapid-fire style, hope you can keep up.

-> lore_hub_tech_support

// Simplified tech support hub (different perspective)
=== lore_hub_tech_support ===
+ {not discussed_entropy_tactics} [Ask about ENTROPY's technical tactics]
    -> entropy_tactics_tech
+ {not discussed_safetynet_methods} [Ask about SAFETYNET's technical capabilities]
    -> safetynet_tech_methods
+ {tech_influence >= 30} [Ask about cutting-edge research]
    -> cutting_edge_research
+ [That's all]
    #exit_conversation
    -> END

=== entropy_tactics_tech ===
~ discussed_entropy_tactics = true
~ tech_influence += 8

Dr. Chen: ENTROPY tactics—okay, technical breakdown incoming—

They use APT-style persistence, multi-stage payloads, living-off-the-land techniques, supply chain compromise, zero-day exploitation, social engineering at scale, and increasingly AI-powered automation.

Not random script kiddies. These are sophisticated threat actors with resources, patience, and technical excellence.

What makes them dangerous is integration—they combine technical exploits with physical access, human manipulation with automated attacks, patience with precision.

We counter with our own technical capabilities, but it's an arms race. They develop new techniques, we develop countermeasures, they adapt. Continuous cycle.

~ tech_influence += 5
-> lore_hub_tech_support

=== safetynet_tech_methods ===
~ discussed_safetynet_methods = true
~ tech_influence += 8

Dr. Chen: Our technical capabilities—classified details obviously but general overview—

Custom exploitation frameworks. Proprietary malware analysis tools. Advanced network monitoring. Hardware implant technology. Secure communication infrastructure. Real-time intelligence correlation systems.

Plus partnerships with academia and private sector. We get early access to vulnerability research, cutting-edge security tools, zero-day intelligence.

My team develops custom tools for field operations. You need to bypass specific security system? We build the exploit. Need to exfiltrate data without detection? We create the method.

It's like running a security research lab combined with a mission support center. Fast-paced, high-pressure, intellectually stimulating.

~ tech_influence += 5
-> lore_hub_tech_support

=== cutting_edge_research ===
~ tech_influence += 15

Dr. Chen speaks even faster, excited about the topic.

Dr. Chen: Cutting-edge stuff—this is confidential—we're researching quantum-resistant cryptography, AI-powered threat detection, hardware-level security, supply chain verification systems, and some experimental techniques I can't fully discuss.

The esoteric ENTROPY cells are pushing us into weird territory. Quantum computing. Reality manipulation claims. We're having to develop countermeasures for threats that sound like science fiction.

It's fascinating and terrifying simultaneously. We're at the frontier of cybersecurity, dealing with adversaries who don't respect conventional limitations.

~ tech_influence += 15
-> lore_hub_tech_support

// ===========================================
// DIRECTOR VARIANT (Brief, formal)
// ===========================================

=== start_director_lore ===
~ current_speaker = "director"

Director Netherton: You have questions regarding operational context, Agent?

-> lore_hub_director

=== lore_hub_director ===
+ {not discussed_safetynet_mission} [Ask about SAFETYNET's mandate]
    -> safetynet_mandate_director
+ {not discussed_moral_complexity} [Ask about rules of engagement]
    -> rules_of_engagement_director
+ {director_influence >= 40} [Ask about the organization's future]
    -> safetynet_future_director
+ [No further questions]
    #exit_conversation
    -> END

=== safetynet_mandate_director ===
~ discussed_safetynet_mission = true
~ director_influence += 8

Netherton: SAFETYNET's mandate, as outlined in founding charter section 1.2, is the protection of critical infrastructure through proactive counter-espionage operations. Wherever that infrastructure happens to be.

We hold no commission from anyone. Our existence is not acknowledged, because there is no one whose place it would be to acknowledge it. Our successes are invisible. Our failures would be catastrophic.

The responsibility is enormous. The oversight is minimal. Therefore, our adherence to operational protocols and ethical guidelines is paramount.

We are not vigilantes. The law does not reach where we work, and that is not the same thing as being above it. We operate where it cannot, on the understanding that our power is exercised responsibly or not at all.

~ director_influence += 8
~ discussed_moral_complexity = true
-> lore_hub_director

=== rules_of_engagement_director ===
~ discussed_moral_complexity = true
~ director_influence += 10

Netherton: The Field Operations Handbook sections 8 through 11 outline our rules of engagement in detail.

Key principles: Minimize collateral damage. Protect innocent bystanders. Use appropriate force. Maintain plausible deniability. Prioritize intelligence over elimination.

We are not assassins. We are intelligence operatives. Our objective is understanding and disrupting ENTROPY, not indiscriminate destruction.

When force is necessary, it must be proportional, justified, and documented. I review every operation personally. Deviations from protocol are investigated.

The power we wield demands discipline. Without it, we become the threat we're supposed to counter.

~ director_influence += 15
-> lore_hub_director

=== safetynet_future_director ===
~ director_influence += 20

Netherton pauses, considering the question carefully.

Netherton: The future of SAFETYNET depends on agents like you, Agent {player_name}.

ENTROPY is evolving. Their techniques advance. Their cells multiply. Traditional approaches are insufficient.

We need operatives who can think strategically, act ethically, and adapt continuously. Who understand both the technical and human dimensions of security.

The organization I helped build two decades ago must evolve. New generation leadership. New methodologies. Maintained ethical foundations.

*He looks directly at you*

Netherton: You represent that future. Your generation will face threats I cannot fully anticipate. My role is ensuring you're prepared for them.

~ director_influence += 25
-> lore_hub_director

// ===========================================
// SYSTEM NOTES
// ===========================================
// This hub system can be integrated into missions as:
// 1. Optional dialogue during downtime
// 2. Phone conversations with handler
// 3. Briefing room discussions
// 4. Post-mission debriefs
//
// Influence tracking allows:
// - Deeper information unlocked over time
// - Character relationship development
// - Different perspectives from different NPCs
// - Replayability through gradual revelation
//
// Topics designed to be modular - can be accessed
// in any order, with some requiring prerequisites
// ===========================================
