// ===========================================
// NETHERTON ONGOING CONVERSATIONS
// Break Escape Universe
// ===========================================
// Progressive professional relationship with Director Netherton
// Formal, by-the-book, but gradually reveals care and respect
// Tracks progression from strict authority to earned mutual respect
// ===========================================

// ===========================================
// PERSISTENT VARIABLES
// These MUST be saved/loaded between game sessions
// Your game engine must persist these across ALL missions
// ===========================================

VAR npc_netherton_influence = 50              // PERSISTENT - Director's respect for agent (0-100)
VAR npc_netherton_serious_conversations = 0 // PERSISTENT - Formal discussions held
VAR npc_netherton_personal_moments = 0      // PERSISTENT - Rare vulnerable moments

// Topic tracking - ALL PERSISTENT (never reset)
VAR npc_netherton_discussed_handbook = false                // PERSISTENT
VAR npc_netherton_discussed_leadership = false              // PERSISTENT
VAR npc_netherton_discussed_safetynet_history = false      // PERSISTENT
VAR npc_netherton_discussed_expectations = false            // PERSISTENT
VAR npc_netherton_discussed_difficult_decisions = false     // PERSISTENT
VAR npc_netherton_discussed_agent_development = false       // PERSISTENT
VAR npc_netherton_discussed_bureau_politics = false         // PERSISTENT
VAR npc_netherton_discussed_field_vs_command = false        // PERSISTENT
VAR npc_netherton_discussed_weight_of_command = false       // PERSISTENT
VAR npc_netherton_discussed_agent_losses = false            // PERSISTENT
VAR npc_netherton_discussed_ethical_boundaries = false      // PERSISTENT
VAR npc_netherton_discussed_personal_cost = false           // PERSISTENT
VAR npc_netherton_discussed_legacy = false                  // PERSISTENT
VAR npc_netherton_discussed_trust = false                   // PERSISTENT
VAR npc_netherton_discussed_rare_praise = false             // PERSISTENT
VAR npc_netherton_discussed_beyond_protocol = false         // PERSISTENT

// Achievement flags - PERSISTENT
VAR npc_netherton_shared_vulnerability = false  // PERSISTENT
VAR npc_netherton_earned_personal_trust = false // PERSISTENT
VAR npc_netherton_received_commendation = false // PERSISTENT

// ===========================================
// GLOBAL VARIABLES (session-only, span NPCs)
// These exist for the current mission only
// Reset when mission ends
// ===========================================

VAR total_missions_completed = 0        // GLOBAL - Total missions done (affects all NPCs)
VAR professional_reputation = 0         // GLOBAL - Agent standing (affects all NPCs)

// ===========================================
// LOCAL VARIABLES (this conversation only)
// These only exist during this specific interaction
// Provided by game engine when conversation starts
// ===========================================

EXTERNAL player_name()                  // LOCAL - Player's agent name
EXTERNAL current_mission_id()           // LOCAL - Current mission identifier

// ===========================================
// ENTRY POINT - Conversation Selector
// ===========================================

=== start ===

{
    - total_missions_completed <= 5:
        -> phase_1_hub
    - total_missions_completed <= 10:
        -> phase_2_hub
    - total_missions_completed <= 15:
        -> phase_3_hub
    - total_missions_completed > 15:
        -> phase_4_hub
}

// ===========================================
// PHASE 1: ESTABLISHING STANDARDS (Missions 1-5)
// Formal, setting expectations, professional distance
// ===========================================

=== phase_1_hub ===

{
    - total_missions_completed == 1:
        Netherton: Agent {player_name()}. I have a few minutes available. Is there something you wish to discuss?
    - npc_netherton_influence >= 60:
        Netherton: Agent. Your performance has been noted. What can I address for you today?
    - else:
        Netherton: Agent {player_name()}. You have questions?
}

+ {not npc_netherton_discussed_handbook} [Ask about the Field Operations Handbook]
    -> handbook_discussion
+ {not npc_netherton_discussed_leadership} [Ask about leadership principles]
    -> leadership_discussion
+ {not npc_netherton_discussed_safetynet_history} [Ask about SAFETYNET's history]
    -> safetynet_history
+ {not npc_netherton_discussed_expectations and npc_netherton_influence >= 55} [Ask what he expects from agents]
    -> expectations_discussion
+ [That will be all, Director]
    -> conversation_end_phase1

// ----------------
// Handbook Discussion
// ----------------

=== handbook_discussion ===
~ npc_netherton_discussed_handbook = true
~ npc_netherton_influence += 5
#influence_gained:5
~ npc_netherton_serious_conversations += 1

Netherton: The Field Operations Handbook. *adjusts glasses slightly*

Netherton: I co-wrote the original edition twenty years ago. I've personally overseen every revision since. Edition 7, Revision 23, 847 pages across 23 sections.

Netherton: Agents often mock the handbook. The contradictions, the excessive detail, the seemingly absurd specificity. But every regulation exists for a reason.

* [Express genuine interest]
    ~ npc_netherton_influence += 10
#influence_gained:10
    ~ professional_reputation += 1
    You: I've been studying it seriously. There's real wisdom in there.
    -> handbook_appreciation

* [Ask about the contradictions]
    ~ npc_netherton_influence += 5
#influence_gained:5
    You: Why are there so many contradictions in it?
    -> handbook_contradictions

* [Admit you find it confusing]
    ~ npc_netherton_influence += 3
#influence_gained:3
    You: I'll be honest, Director—it's overwhelming.
    -> handbook_honest_confusion

=== handbook_appreciation ===
~ npc_netherton_influence += 15
#influence_gained:15

Netherton: *brief pause, something that might be surprise*

Netherton: Few agents take the handbook seriously until they've been in the field long enough to understand why it exists.

Netherton: The fact that you're already engaging with it thoughtfully... that speaks well of your judgment.

Netherton: Section 14.7 is particularly relevant to your current assignment level. I recommend thorough review.

~ npc_netherton_influence += 10
#influence_gained:10
-> phase_1_hub

=== handbook_contradictions ===
~ npc_netherton_influence += 8
#influence_gained:8

Netherton: An astute observation. The contradictions are not accidents.

Netherton: Field operations exist in legal and ethical gray areas. We operate under authorities that are classified, in situations that are unpredictable.

Netherton: The handbook provides guidance for contradictory circumstances. Agents must exercise judgment about which regulation applies to their specific situation.

Netherton: It's not a rulebook. It's a framework for decision-making under impossible conditions.

~ npc_netherton_influence += 8
#influence_gained:8
-> phase_1_hub

=== handbook_honest_confusion ===
~ npc_netherton_influence += 5
#influence_gained:5

Netherton: Understandable. The handbook is not designed for easy consumption.

Netherton: Focus on sections 8 through 12 for field operations. Sections 14 through 18 for technical protocols. The appendices can be referenced as needed.

Netherton: Your handler will guide you on relevant sections for specific situations. No one memorizes the entire handbook.

<> *slight pause*

Netherton: Though I've come close. Not by choice.

~ npc_netherton_influence += 5
#influence_gained:5
-> phase_1_hub

// ----------------
// Leadership Discussion
// ----------------

=== leadership_discussion ===
~ npc_netherton_discussed_leadership = true
~ npc_netherton_influence += 8
#influence_gained:8
~ npc_netherton_serious_conversations += 1

Netherton: Leadership principles. *straightens papers on desk*

Netherton: I've held command positions for over two decades. Military intelligence, civilian agencies, and now SAFETYNET.

Netherton: The core principle remains constant: leadership is responsibility. You are accountable for every person under your command and every outcome of their actions.

* [Ask how he handles that weight]
    ~ npc_netherton_influence += 12
#influence_gained:12
    ~ professional_reputation += 1
    You: How do you handle that weight? That responsibility?
    -> leadership_weight

* [Ask about his leadership style]
    ~ npc_netherton_influence += 5
#influence_gained:5
    You: How would you describe your leadership style?
    -> leadership_style

* [Thank him for the insight]
    You: That's a valuable perspective. Thank you, Director.
    -> phase_1_hub

=== leadership_weight ===
~ npc_netherton_influence += 15
#influence_gained:15

Netherton: *considers the question carefully*

Netherton: You don't "handle" it. You carry it. Every decision, every mission, every agent deployed—the weight accumulates.

Netherton: I've sent agents into situations where they were hurt. I've made calls that cost missions. I've lost... *brief pause* ...I've had agents not return.

Netherton: The weight never lessens. You simply become stronger at carrying it. Or you break. Those are the options in command.

<> *looks directly at you*

Netherton: That you're asking this question suggests you may be suited for leadership yourself. Eventually.

~ npc_netherton_influence += 20
#influence_gained:20
~ professional_reputation += 2
-> phase_1_hub

=== leadership_style ===
~ npc_netherton_influence += 8
#influence_gained:8

Netherton: Structured. Disciplined. By the handbook—because the handbook represents accumulated wisdom from thousands of operations.

Netherton: Some call me rigid. Perhaps. But structure keeps agents alive. Discipline prevents mistakes. Standards maintain operational integrity.

Netherton: I demand excellence because the work demands it. Lives depend on our precision. I will not lower standards to make agents more comfortable.

<> *slight softening*

Netherton: But I do not demand perfection. I demand learning. Mistakes are acceptable if they result in growth. Repeated mistakes indicate insufficient attention.

~ npc_netherton_influence += 8
#influence_gained:8
-> phase_1_hub

// ----------------
// SAFETYNET History
// ----------------

=== safetynet_history ===
~ npc_netherton_discussed_safetynet_history = true
~ npc_netherton_influence += 5
#influence_gained:5
~ npc_netherton_serious_conversations += 1

Netherton: SAFETYNET's history. This is not widely documented for security reasons.

Netherton: The organization was founded in the late 1990s during the early internet boom. The founders recognized that cyber threats would become existential before governments were prepared.

Netherton: I joined during the formative years. Helped write operational protocols. Built the training program. Developed the handbook from field experience and hard lessons.

Netherton: We've evolved from a small group of specialists to a global operation. But the mission remains: protect critical infrastructure from those who would weaponize technology.

* [Ask about the early days]
    ~ npc_netherton_influence += 10
#influence_gained:10
    You: What were the early days like?
    -> history_early_days

* [Ask about ENTROPY's emergence]
    ~ npc_netherton_influence += 8
#influence_gained:8
    You: When did ENTROPY become a major threat?
    -> history_entropy_emergence

* [Express appreciation for the context]
    You: That helps me understand our purpose better. Thank you.
    -> phase_1_hub

=== history_early_days ===
~ npc_netherton_influence += 12
#influence_gained:12

Netherton: Chaotic. Improvised. We were writing the procedures as we executed operations.

Netherton: Small teams, minimal oversight, operating in legal territory that didn't yet exist. The handbook's first edition was 47 pages. Now it's 847.

Netherton: Every page added represents a lesson learned. Often painfully.

<> *rare hint of warmth*

Netherton: But we were building something important. Creating capabilities that would become essential. That purpose drove us through the chaos.

Netherton: We still carry that founding mission. Even though the organization has grown, even though operations are more structured—the core purpose remains.

~ npc_netherton_influence += 15
#influence_gained:15
-> phase_1_hub

=== history_entropy_emergence ===
~ npc_netherton_influence += 10
#influence_gained:10

Netherton: ENTROPY as an organized network appeared approximately five years ago. Though precursor activities date back further.

Netherton: Initially we tracked disparate threat actors. Then patterns emerged. Coordination. Shared resources. Unified philosophical framework.

Netherton: By the time we recognized it as a network, ENTROPY had already infiltrated numerous systems and organizations. We've been fighting catch-up since.

Netherton: They adapt quickly. They learn from our countermeasures. They recruit effectively. They're the most sophisticated adversary SAFETYNET has faced.

Netherton: Which is why we require agents of your caliber.

~ npc_netherton_influence += 12
#influence_gained:12
-> phase_1_hub

// ----------------
// Expectations Discussion
// ----------------

=== expectations_discussion ===
~ npc_netherton_discussed_expectations = true
~ npc_netherton_influence += 10
#influence_gained:10
~ npc_netherton_serious_conversations += 1

Netherton: What I expect from agents. *interlaces fingers, formal posture*

Netherton: First: Competence. Master your technical skills. Maintain physical readiness. Develop field craft. Excellence is not optional.

Netherton: Second: Judgment. I can teach techniques. I cannot teach wisdom. You must develop the capacity to make sound decisions under pressure.

Netherton: Third: Integrity. The power we wield is enormous. The oversight is minimal. Your personal ethics are the only reliable safeguard against abuse.

Netherton: Fourth: Growth. Learn from every operation. Improve continuously. Stagnation is failure.

* [Promise to meet those standards]
    ~ npc_netherton_influence += 15
#influence_gained:15
    ~ professional_reputation += 2
    You: I will meet those standards, Director. You have my commitment.
    -> expectations_commitment

* [Ask if you're currently meeting expectations]
    ~ npc_netherton_influence += 8
#influence_gained:8
    You: Am I currently meeting your expectations?
    -> expectations_current_assessment

* [Acknowledge the high bar]
    ~ npc_netherton_influence += 5
#influence_gained:5
    You: Those are high standards. I'll work toward them.
    -> phase_1_hub

=== expectations_commitment ===
~ npc_netherton_influence += 20
#influence_gained:20

Netherton: *direct eye contact*

Netherton: Commitment is noted. Performance will determine whether that commitment is genuine.

<> *slight pause*

Netherton: Based on your record thus far, I believe you have the capacity to meet these standards. Whether you will is your choice.

Netherton: I expect to see continued progress. Maintain this trajectory.

~ npc_netherton_influence += 15
#influence_gained:15
~ professional_reputation += 2
-> phase_1_hub

=== expectations_current_assessment ===
~ npc_netherton_influence += 12
#influence_gained:12

{
    - npc_netherton_influence >= 70:
        Netherton: You are exceeding expectations for your experience level. Continue this performance.
    - npc_netherton_influence >= 55:
        Netherton: You are meeting standards. There is room for improvement, but your trajectory is positive.
    - else:
        Netherton: You are adequate. Adequate is insufficient for SAFETYNET's needs. Improvement is required.
}

Netherton: Specific areas for development will be addressed in formal performance reviews. But overall... *brief pause* ...you show promise.

~ npc_netherton_influence += 12
#influence_gained:12
-> phase_1_hub

// ===========================================
// PHASE 2: GROWING RESPECT (Missions 6-10)
// Still formal, but showing more trust and depth
// ===========================================

=== phase_2_hub ===

{
    - npc_netherton_influence >= 70:
        Netherton: Agent {player_name()}. Your continued excellent performance has been noted. What do you wish to discuss?
    - npc_netherton_influence >= 60:
        Netherton: Agent. I have time for a brief discussion.
    - else:
        Netherton: Agent {player_name()}. What requires attention?
}

+ {not npc_netherton_discussed_difficult_decisions} [Ask about making difficult command decisions]
    -> difficult_decisions
+ {not npc_netherton_discussed_agent_development} [Ask about agent development]
    -> agent_development
+ {not npc_netherton_discussed_bureau_politics and npc_netherton_influence >= 65} [Ask about SAFETYNET politics]
    -> bureau_politics
+ {not npc_netherton_discussed_field_vs_command and npc_netherton_influence >= 60} [Ask if he misses field work]
    -> field_vs_command
+ [That will be all, Director]
    -> conversation_end_phase2

// ----------------
// Difficult Decisions
// ----------------

=== difficult_decisions ===
~ npc_netherton_discussed_difficult_decisions = true
~ npc_netherton_influence += 15
#influence_gained:15
~ npc_netherton_serious_conversations += 1

Netherton: Difficult command decisions. *removes glasses, cleans them methodically*

Netherton: Every operation presents choices where all options have negative consequences. You select the least worst option and accept the cost.

Netherton: The Berlin Crisis. Two years ago. Agent captured, ENTROPY preparing exposure. Every extraction option carried unacceptable risks.

<> *rare vulnerability*

Netherton: I authorized an extraction that cost us intelligence assets, burned operations across Europe, and required protocol violations I cannot discuss.

Netherton: But I brought our agent home alive. The mission failed. The agent lived. I chose the agent.

* [Say you would have done the same]
    ~ npc_netherton_influence += 20
#influence_gained:20
    ~ professional_reputation += 2
    You: I would have made the same choice, Director.
    -> difficult_agree

* [Ask how he lives with such decisions]
    ~ npc_netherton_influence += 18
#influence_gained:18
    ~ npc_netherton_personal_moments += 1
    You: How do you live with decisions like that?
    -> difficult_living_with

* [Thank him for the honesty]
    ~ npc_netherton_influence += 10
#influence_gained:10
    You: Thank you for sharing that. It helps to know the weight you carry.
    -> phase_2_hub

=== difficult_agree ===
~ npc_netherton_influence += 25
#influence_gained:25
~ professional_reputation += 3

Netherton: *looks at you with something approaching approval*

Netherton: Many agents claim they would prioritize personnel over missions. Few actually do when the stakes are real.

Netherton: That you understand the value of that choice... that suggests you have the right priorities for command.

<> *formal again*

Netherton: Remember that conviction when you face similar decisions. Because you will. Leadership guarantees it.

~ npc_netherton_influence += 20
#influence_gained:20
-> phase_2_hub

=== difficult_living_with ===
~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_personal_moments += 1

Netherton: You don't. Not comfortably.

Netherton: You review the decision. Analyze alternatives. Identify what you could have done differently. File the lessons learned.

Netherton: Then you accept that you made the best call available with the information you had. And you carry the weight of the consequences.

<> *quiet*

Netherton: The agent I extracted wrote me a letter. Thanked me for the choice. Said they understood the cost and were grateful I paid it.

Netherton: I keep that letter in my desk. Read it when I doubt whether the choice was correct.

Netherton: That's how you live with difficult decisions. You remember why you made them.

~ npc_netherton_influence += 30
#influence_gained:30
~ npc_netherton_shared_vulnerability = true
-> phase_2_hub

// ----------------
// Agent Development
// ----------------

=== agent_development ===
~ npc_netherton_discussed_agent_development = true
~ npc_netherton_influence += 12
#influence_gained:12
~ npc_netherton_serious_conversations += 1

Netherton: Agent development is central to SAFETYNET's effectiveness. You are all high-capability individuals. My role is to refine that capability into excellence.

Netherton: I review every agent's performance quarterly. Identify strengths to leverage. Weaknesses to address. Growth trajectories to accelerate.

Netherton: Your development has been... *consults memory* ...notably consistent. Steady improvement across technical and operational metrics.

* [Ask for specific feedback]
    ~ npc_netherton_influence += 18
#influence_gained:18
    ~ professional_reputation += 2
    You: What specific areas should I focus on improving?
    -> development_specific_feedback

* [Ask about his training philosophy]
    ~ npc_netherton_influence += 10
#influence_gained:10
    You: What's your philosophy on training agents?
    -> development_philosophy

* [Express appreciation]
    ~ npc_netherton_influence += 5
#influence_gained:5
    You: I appreciate you investing in our development.
    -> phase_2_hub

=== development_specific_feedback ===
~ npc_netherton_influence += 22
#influence_gained:22

{
    - npc_netherton_influence >= 75:
        Netherton: Your technical skills are excellent. Your judgment under pressure has improved significantly. Field craft is developing appropriately.

        Netherton: Focus on strategic thinking. You excel at tactical execution. Now develop the capacity to see three moves ahead. Anticipate consequences beyond immediate objectives.

        Netherton: Leadership potential is evident. Begin considering command responsibilities. How you would manage teams. How you would make resource allocation decisions.

        <> *rare warmth*

        Netherton: You're on track to become one of SAFETYNET's premier agents. Maintain this trajectory.

        ~ npc_netherton_influence += 25
#influence_gained:25
        ~ professional_reputation += 3
    - npc_netherton_influence >= 60:
        Netherton: Technical competence is solid. Decision-making is sound. Operational performance meets standards.

        Netherton: Develop deeper strategic awareness. Understand the broader context of operations. How your missions connect to organizational objectives.

        Netherton: Increase your initiative. Don't wait for instructions when the correct action is clear. Trust your judgment more.

        ~ npc_netherton_influence += 15
#influence_gained:15
        ~ professional_reputation += 1
    - else:
        Netherton: You meet minimum standards. That is insufficient for advancement.

        Netherton: Improve technical precision. Develop better situational awareness. Demonstrate more consistent judgment.

        Netherton: Review handbook sections 8 through 12. Study after-action reports from successful operations. Learn from excellence.

        ~ npc_netherton_influence += 8
#influence_gained:8
}

-> phase_2_hub

=== development_philosophy ===
~ npc_netherton_influence += 15
#influence_gained:15

Netherton: Train for the worst case. When operations go smoothly, any agent can succeed. Excellence is demonstrated when everything goes wrong.

Netherton: I design training scenarios that are unreasonably difficult. Multi-variable problems with no clean solutions. Time pressure. Incomplete information. Conflicting priorities.

Netherton: Because that describes actual field conditions. If you can perform under training stress, you can perform under operational stress.

<> *slight pause*

Netherton: Some agents resent my methods. Call me harsh. But those agents are alive because the training prepared them for reality.

Netherton: Your survival is worth more than your comfort.

~ npc_netherton_influence += 18
#influence_gained:18
-> phase_2_hub

// ----------------
// Bureau Politics
// ----------------

=== bureau_politics ===
~ npc_netherton_discussed_bureau_politics = true
~ npc_netherton_influence += 12
#influence_gained:12
~ npc_netherton_serious_conversations += 1

Netherton: *visible distaste*

Netherton: SAFETYNET politics. Inter-divisional competition. Budget battles. Turf wars over jurisdiction and authority.

Netherton: I despise organizational politics. But ignoring politics is professional suicide. So I engage. Minimally. Strategically.

Netherton: The CYBER-PHYSICAL division competes with INTELLIGENCE, ANALYSIS, and SPECIAL OPERATIONS for resources. We succeed because we deliver results.

* [Ask about inter-division conflicts]
    ~ npc_netherton_influence += 15
#influence_gained:15
    You: Are there serious conflicts between divisions?
    -> politics_conflicts

* [Ask how to navigate politics as an agent]
    ~ npc_netherton_influence += 18
#influence_gained:18
    ~ professional_reputation += 2
    You: How should agents like me navigate organizational politics?
    -> politics_agent_navigation

* [Express sympathy for the burden]
    ~ npc_netherton_influence += 10
#influence_gained:10
    ~ npc_netherton_personal_moments += 1
    You: That must be exhausting on top of operational responsibilities.
    -> politics_burden

=== politics_conflicts ===
~ npc_netherton_influence += 18
#influence_gained:18

Netherton: Conflicts are constant. INTELLIGENCE believes their analysis should drive operations. SPECIAL OPS believes their combat capabilities are underutilized. ANALYSIS believes everyone ignores their risk assessments.

Netherton: CYBER-PHYSICAL maintains that technical operations require specialized capabilities they don't possess. We're correct. They resent it.

Netherton: Two months ago, SPECIAL OPS attempted to take over a cyber infiltration operation. Claimed their tactical training made them better suited. The operation required zero tactical capabilities.

Netherton: I shut it down. Made enemies. The operation succeeded. Results matter more than relationships.

~ npc_netherton_influence += 15
#influence_gained:15
-> phase_2_hub

=== politics_agent_navigation ===
~ npc_netherton_influence += 25
#influence_gained:25
~ professional_reputation += 3

Netherton: *approving look*

Netherton: Intelligent question. Most agents don't think about organizational dynamics until it damages their careers.

Netherton: First: Focus on operational excellence. Political capital derives from competence. Be undeniably good at your work.

Netherton: Second: Build relationships across divisions. Respect other specialties. Collaborate when possible. But don't compromise CYBER-PHYSICAL's mission for popularity.

Netherton: Third: Document everything. Politics involves selective memory and blame shifting. Documentation is protection.

Netherton: Fourth: Understand that I handle divisional politics. Your role is executing missions. If political issues affect your operations, inform me immediately.

<> *rare personal advice*

Netherton: You show leadership potential. As you advance, politics becomes unavoidable. Learn the skills now. But never let politics compromise operational integrity.

~ npc_netherton_influence += 30
#influence_gained:30
~ professional_reputation += 3
-> phase_2_hub

=== politics_burden ===
~ npc_netherton_influence += 18
#influence_gained:18
~ npc_netherton_personal_moments += 1

Netherton: *brief surprise at the empathy*

Netherton: It is... exhausting. Yes.

Netherton: I became a director to build an excellent division. To develop agents. To counter ENTROPY effectively. That's meaningful work.

Netherton: Instead, I spend hours in budget meetings. Defending resource allocations. Justifying operational decisions to people who've never been in the field.

<> *quiet frustration*

Netherton: But if I don't fight those battles, my division loses resources. Which means fewer agents. Worse equipment. Failed missions.

Netherton: So I attend the meetings. I play the political games. I do what's necessary.

<> *looks at you directly*

Netherton: Thank you for recognizing the burden. Few do.

~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_personal_moments += 1
-> phase_2_hub

// ----------------
// Field vs Command
// ----------------

=== field_vs_command ===
~ npc_netherton_discussed_field_vs_command = true
~ npc_netherton_influence += 15
#influence_gained:15
~ npc_netherton_serious_conversations += 1

Netherton: *long pause, considering the question*

Netherton: I spent fifteen years in the field. Intelligence operations. Technical infiltration. Asset recruitment. I was... effective.

Netherton: Transitioned to command because SAFETYNET needed leadership. Because I could build systems better than I could execute missions.

Netherton: Do I miss field work? *removes glasses, sets them aside*

* [Wait for him to continue]
    ~ npc_netherton_influence += 20
#influence_gained:20
    ~ npc_netherton_personal_moments += 1
    You: *remain silent, giving him space*
    -> field_nostalgia

* [Say you'd miss it in his position]
    ~ npc_netherton_influence += 15
#influence_gained:15
    You: I imagine I would miss it. The directness of field work.
    -> field_understanding

* [Ask what he misses most]
    ~ npc_netherton_influence += 18
#influence_gained:18
    ~ npc_netherton_personal_moments += 1
    You: What do you miss most about field operations?
    -> field_what_he_misses

=== field_nostalgia ===
~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_personal_moments += 1

Netherton: *appreciates the silence*

Netherton: Yes. I miss it. The clarity of field operations. Clear objectives. Direct action. Immediate feedback on decisions.

Netherton: Command is ambiguous. Decisions have cascading consequences months later. Success is measured in systems and statistics rather than completed missions.

Netherton: I miss the simplicity of being responsible only for my own performance. Not carrying the weight of everyone under my command.

<> *rare vulnerability*

Netherton: But I'm better suited to command. I can build systems that enable dozens of agents to be more effective than I ever was alone.

Netherton: So I carry the weight. Because it's where I can do the most good.

~ npc_netherton_influence += 30
#influence_gained:30
~ npc_netherton_shared_vulnerability = true
-> phase_2_hub

=== field_understanding ===
~ npc_netherton_influence += 22
#influence_gained:22

Netherton: Precisely. The directness. The unambiguous nature of field success or failure.

Netherton: In the field, you know immediately whether you've succeeded. The system responds or it doesn't. The mission completes or it fails.

Netherton: Command success is measured over years. Did I develop the right agents? Build the right systems? Make strategic choices that will prove correct long after I've retired?

Netherton: The uncertainty is... challenging.

~ npc_netherton_influence += 20
#influence_gained:20
-> phase_2_hub

=== field_what_he_misses ===
~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_personal_moments += 1

Netherton: *considers carefully*

Netherton: The focus. In the field, the mission is everything. All your attention, all your capability, directed at a single objective.

Netherton: Command requires divided attention. Operations, politics, personnel, logistics, strategy—everything simultaneously.

Netherton: I miss the purity of field work. One problem. Apply all your skills. Solve it. Move to the next.

<> *quiet*

Netherton: And I miss the camaraderie. Field teams develop deep trust. Command is isolated. Leadership requires distance.

Netherton: I have subordinates. Colleagues. Not... friends. Not anymore.

<> *formal again*

Netherton: But that's the price of command. Acceptable trade for the impact I can have at this level.

~ npc_netherton_influence += 35
#influence_gained:35
~ npc_netherton_shared_vulnerability = true
~ npc_netherton_personal_moments += 2
-> phase_2_hub

// ===========================================
// PHASE 3: EARNED RESPECT (Missions 11-15)
// Genuine respect developing, rare personal moments
// ===========================================

=== phase_3_hub ===

{
    - npc_netherton_influence >= 80:
        Netherton: Agent {player_name()}. *almost warmth* Your continued excellence is appreciated. What's on your mind?
    - npc_netherton_influence >= 70:
        Netherton: Agent. I have time for a substantive discussion.
    - else:
        Netherton: Agent {player_name()}. What do you need?
}

+ {not npc_netherton_discussed_weight_of_command and npc_netherton_influence >= 75} [Ask about the weight of command]
    -> weight_of_command
+ {not npc_netherton_discussed_agent_losses and npc_netherton_influence >= 70} [Ask how he handles losing agents]
    -> agent_losses
+ {not npc_netherton_discussed_ethical_boundaries and npc_netherton_influence >= 70} [Ask about ethical boundaries]
    -> ethical_boundaries
+ {not npc_netherton_discussed_personal_cost and npc_netherton_influence >= 75} [Ask about the personal cost of the work]
    -> personal_cost
+ [That will be all, Director]
    -> conversation_end_phase3

// ----------------
// Weight of Command
// ----------------

=== weight_of_command ===
~ npc_netherton_discussed_weight_of_command = true
~ npc_netherton_influence += 20
#influence_gained:20
~ npc_netherton_serious_conversations += 1

Netherton: The weight of command. *sets down whatever he was working on*

Netherton: I'm responsible for 47 active agents in CYBER-PHYSICAL division. Each one a high-capability individual. Each one in constant danger.

Netherton: Every mission I authorize might get someone killed. Every operational decision carries life-or-death consequences.

Netherton: I review casualty statistics. I write letters to families—classified letters that can't explain what their loved one was actually doing. I attend memorials for agents whose names can't be on the memorial.

* [Ask how he carries that weight]
    ~ npc_netherton_influence += 25
#influence_gained:25
    ~ npc_netherton_personal_moments += 1
    You: How do you carry that weight without breaking?
    -> weight_carrying_it

* [Say you're starting to understand]
    ~ npc_netherton_influence += 20
#influence_gained:20
    ~ professional_reputation += 2
    You: I'm starting to understand what command would mean. The responsibility.
    -> weight_understanding

* [Express respect for his strength]
    ~ npc_netherton_influence += 18
#influence_gained:18
    You: The fact that you carry it shows remarkable strength.
    -> weight_respect

=== weight_carrying_it ===
~ npc_netherton_influence += 30
#influence_gained:30
~ npc_netherton_personal_moments += 1
~ npc_netherton_shared_vulnerability = true

Netherton: *long pause*

Netherton: Some days I don't. Some days the weight is too much. I stay late in this office. Stare at mission reports. Question every decision.

Netherton: I keep a file. Every agent lost under my command. Their final mission reports. Their personnel files. Sometimes I read through it. Remind myself of the stakes.

Netherton: *removes glasses, rare sign of fatigue*

Netherton: Then I close the file. Review current operations. Make the next decision. Authorize the next mission.

Netherton: Because agents in the field depend on command making sound choices. My feelings are irrelevant compared to their safety.

Netherton: You carry it by remembering it's not about you. It's about the mission. About protecting the people under your command. About the larger purpose.

<> *puts glasses back on, formal again*

Netherton: And some days that's enough. Other days you just carry it anyway.

~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_personal_moments += 2
-> phase_3_hub

=== weight_understanding ===
~ npc_netherton_influence += 28
#influence_gained:28
~ professional_reputation += 3

Netherton: *approving look*

Netherton: The fact that you're contemplating command responsibility before pursuing it—that indicates proper respect for what leadership entails.

Netherton: Too many agents seek promotion for status. For authority. They don't understand they're volunteering for a burden.

Netherton: You understand. Which suggests you might be suited for it. Eventually.

<> *rare directness*

Netherton: When the time comes, if you choose command, I'll support your advancement. You have the judgment. The integrity. The capacity to carry the weight.

Netherton: But don't rush it. Develop your capabilities fully. Command will still be there when you're ready.

~ npc_netherton_influence += 35
#influence_gained:35
~ professional_reputation += 4
-> phase_3_hub

=== weight_respect ===
~ npc_netherton_influence += 25
#influence_gained:25

Netherton: *slight discomfort at the compliment*

Netherton: It's not strength. It's duty. The role requires it. So I do it.

Netherton: But... thank you. Leadership can be isolating. Acknowledgment is... appreciated.

~ npc_netherton_influence += 20
#influence_gained:20
~ npc_netherton_personal_moments += 1
-> phase_3_hub

// ----------------
// Agent Losses
// ----------------

=== agent_losses ===
~ npc_netherton_discussed_agent_losses = true
~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_serious_conversations += 1
~ npc_netherton_personal_moments += 1

Netherton: *very long pause, considering whether to discuss this*

Netherton: I've lost eleven agents in my time as division director. Eleven people under my command who didn't come home.

Netherton: Each one... *removes glasses* ...each one is permanent. Every name. Every mission. Every decision point where maybe I could have chosen differently.

Netherton: Agent Karim. Moscow operation. Intelligence failure led to ambush. She held position long enough for her team to extract. Died buying them time.

Netherton: Agent Torres. Infrastructure infiltration. Equipment malfunction. Fell during a climb. Instant.

Netherton: Agent Wu. Deep cover in ENTROPY cell. Cover was compromised. We never recovered the body.

<> *quiet*

Netherton: I remember all eleven names. All their final missions. All the choices I made that put them in those situations.

* [Say they knew the risks]
    ~ npc_netherton_influence += 15
#influence_gained:15
    You: They knew the risks when they took the assignment. They chose this.
    -> losses_they_chose

* [Ask if he blames himself]
    ~ npc_netherton_influence += 30
#influence_gained:30
    ~ npc_netherton_personal_moments += 2
    You: Do you blame yourself?
    -> losses_blame

* [Remain silent, let him continue]
    ~ npc_netherton_influence += 25
#influence_gained:25
    ~ npc_netherton_personal_moments += 1
    You: *silent respect*
    -> losses_silence

=== losses_they_chose ===
~ npc_netherton_influence += 20
#influence_gained:20

Netherton: They did. You're correct. Every agent volunteers. Every agent understands the stakes.

Netherton: That truth doesn't diminish my responsibility. I authorized the missions. I accepted the risk on their behalf.

Netherton: Their choice to serve doesn't absolve my duty to bring them home. When I fail that duty...

<> *trails off*

Netherton: Yes. They chose this. But I chose to send them. Both things are true.

~ npc_netherton_influence += 18
#influence_gained:18
-> phase_3_hub

=== losses_blame ===
~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_personal_moments += 2
~ npc_netherton_shared_vulnerability = true

Netherton: *removes glasses, sets them aside carefully*

Netherton: Yes. Every one.

Netherton: I review each loss exhaustively. Mission analysis. Decision trees. Alternative approaches. I identify every point where different choices might have changed outcomes.

Netherton: Sometimes the conclusion is that nothing could have prevented it. Operational hazards. Equipment failures beyond prediction. Enemy actions we couldn't have anticipated.

Netherton: That analysis is... not comforting. Even when the loss was unavoidable, the responsibility remains.

<> *long pause*

Netherton: Agent Karim's family received a letter saying she died in a training accident. Classified operations. They can't know she died a hero. Can't know the three agents she saved.

Netherton: I know. And I carry that. For all eleven.

Netherton: So yes. I blame myself. Whether or not the blame is rational. It's mine to carry.

<> *puts glasses back on*

Netherton: Thank you for asking directly. Few people do.

~ npc_netherton_influence += 50
#influence_gained:50
~ npc_netherton_personal_moments += 3
~ npc_netherton_earned_personal_trust = true
-> phase_3_hub

=== losses_silence ===
~ npc_netherton_influence += 35
#influence_gained:35
~ npc_netherton_personal_moments += 2

Netherton: *appreciates the silence*

Netherton: The memorial wall in headquarters lists 127 names. SAFETYNET agents lost in the line of duty. Public version has cover identities. Real names are classified.

Netherton: Eleven of those names are agents I commanded. I visit that wall monthly. Stand there. Remember.

Netherton: Some directors avoid the wall. Too painful. Too much accumulated loss.

Netherton: I believe remembering is the minimum duty we owe them. They gave everything for the mission. We remember. We honor. We continue the work.

<> *direct look*

Netherton: And we try to ensure their sacrifice wasn't wasted. That SAFETYNET remains worth dying for.

~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_personal_moments += 2
-> phase_3_hub

// ----------------
// Ethical Boundaries
// ----------------

=== ethical_boundaries ===
~ npc_netherton_discussed_ethical_boundaries = true
~ npc_netherton_influence += 22
#influence_gained:22
~ npc_netherton_serious_conversations += 1

Netherton: Ethical boundaries in our work. *steeples fingers*

Netherton: We operate in legal and moral gray areas. Unauthorized system access. Information theft. Manipulation. Sometimes violence.

Netherton: The handbook provides guidelines. But ultimately, individual agents make split-second ethical choices in the field.

Netherton: I've made choices I regret. Authorized operations that were legally justified but morally questionable. Pursued outcomes that benefited the mission but harmed innocents.

* [Ask where he draws the line]
    ~ npc_netherton_influence += 25
#influence_gained:25
    You: Where do you draw the line? What's absolutely off limits?
    -> ethics_the_line

* [Ask about moral compromise]
    ~ npc_netherton_influence += 22
#influence_gained:22
    ~ professional_reputation += 2
    You: How do you handle moral compromises the work requires?
    -> ethics_compromise

* [Say some things are worth the cost]
    ~ npc_netherton_influence += 15
#influence_gained:15
    You: Some things are worth the moral cost. Protecting infrastructure saves lives.
    -> ethics_worth_it

=== ethics_the_line ===
~ npc_netherton_influence += 30
#influence_gained:30

Netherton: *considers very carefully*

Netherton: Torture. Absolutely prohibited. We do not torture. Even when the intelligence would save lives. Even when the target is ENTROPY leadership. No torture.

Netherton: Deliberate civilian casualties. We accept collateral damage when unavoidable. We never target civilians deliberately. Mission success never justifies civilian deaths.

Netherton: Illegal orders. I've refused orders from oversight I believed were unlawful or unethical. I've instructed agents to refuse illegal commands even from me.

Netherton: Personal gain. We serve the mission. Not ourselves. The moment we use operational authority for personal benefit, we become what we fight.

<> *firm*

Netherton: Those are my lines. I enforce them absolutely. Agents who cross those boundaries are removed. No exceptions. No second chances.

~ npc_netherton_influence += 35
#influence_gained:35
-> phase_3_hub

=== ethics_compromise ===
~ npc_netherton_influence += 30
#influence_gained:30
~ npc_netherton_personal_moments += 1

Netherton: *long pause*

Netherton: Poorly. I handle them poorly.

Netherton: I document the decision. File the justification. Ensure oversight reviews it. Follow the process designed to prevent abuse.

Netherton: Then I accept that I made a choice that harmed someone. That I prioritized mission success over individual welfare. That the math of protecting thousands justified hurting dozens.

Netherton: And I question whether that math is ever truly justified. Whether there was an alternative I failed to see. Whether I'm rationalizing harm.

<> *removes glasses*

Netherton: I don't have a clean answer. I make the choices. I live with the consequences. I try to minimize harm while completing necessary missions.

Netherton: Some days that feels like enough. Other days it feels like self-serving rationalization for moral compromise.

<> *puts glasses back on*

Netherton: The uncertainty is... probably healthy. The moment I become comfortable with moral compromise is the moment I should resign.

~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_personal_moments += 2
~ npc_netherton_shared_vulnerability = true
-> phase_3_hub

=== ethics_worth_it ===
~ npc_netherton_influence += 20
#influence_gained:20

Netherton: *slight frown*

Netherton: Be careful with that logic. Every authoritarian system justifies its excesses with "protecting the people."

Netherton: Yes, our work saves lives. Yes, infrastructure protection matters. Yes, ENTROPY represents a genuine threat.

Netherton: But the moment we decide any action is justified by good intentions—we've lost our moral foundation. We become the threat.

Netherton: Stay vigilant about your ethical boundaries. Question your choices. Accept that some costs are too high even when the mission demands it.

Netherton: The work is worth doing. That doesn't mean anything we do in service of it is justified.

~ npc_netherton_influence += 12
#influence_gained:12
-> phase_3_hub

// ----------------
// Personal Cost
// ----------------

=== personal_cost ===
~ npc_netherton_discussed_personal_cost = true
~ npc_netherton_influence += 28
#influence_gained:28
~ npc_netherton_serious_conversations += 1
~ npc_netherton_personal_moments += 1

Netherton: The personal cost of this work. *looks out window*

Netherton: I've been with SAFETYNET for twenty-three years. Intelligence agencies before that. My entire adult life in classified operations.

Netherton: I have no family. Marriage failed within three years—couldn't talk about work, couldn't separate work stress from home life. No children. By choice. Couldn't raise children while carrying this responsibility.

Netherton: Few friends outside the agency. Civilian friendships are... difficult. Can't discuss what occupies most of my waking thoughts. Can't explain the stress. Can't share the experiences that define me.

* [Express sympathy]
    ~ npc_netherton_influence += 18
#influence_gained:18
    ~ npc_netherton_personal_moments += 1
    You: That's a heavy price to pay.
    -> cost_sympathy

* [Ask if he regrets it]
    ~ npc_netherton_influence += 25
#influence_gained:25
    ~ npc_netherton_personal_moments += 2
    You: Do you regret it? The sacrifices?
    -> cost_regrets

* [Ask if it was worth it]
    ~ npc_netherton_influence += 20
#influence_gained:20
    You: Was it worth the cost?
    -> cost_worth_it

=== cost_sympathy ===
~ npc_netherton_influence += 25
#influence_gained:25
~ npc_netherton_personal_moments += 1

Netherton: *slight acknowledgment*

Netherton: It is. But it was my choice. I understood the trade when I made it.

Netherton: Every agent faces similar choices. Career versus relationships. Mission versus personal life. The work demands priority.

Netherton: Some agents manage better balance. Families. Hobbies. Lives outside the agency. I respect that.

Netherton: I never achieved that balance. Perhaps never tried hard enough. The work always came first.

~ npc_netherton_influence += 22
#influence_gained:22
-> phase_3_hub

=== cost_regrets ===
~ npc_netherton_influence += 35
#influence_gained:35
~ npc_netherton_personal_moments += 2
~ npc_netherton_shared_vulnerability = true

Netherton: *removes glasses, rare vulnerability*

Netherton: Some days. Yes.

Netherton: I wonder what life would have been like if I'd left after ten years. Taken civilian work. Built a normal life. Had a family.

Netherton: I see agents like you—talented, capable, whole career ahead—and I think about warning you. Telling you to get out before the work consumes everything else.

<> *quiet*

Netherton: But then I remember what we accomplish. Infrastructure protected. ENTROPY cells disrupted. Attacks prevented. Lives saved. The work matters.

Netherton: And I'm effective at it. Better than most. If I'd left, would my replacement have done it as well? Would agents under their command have been as well supported?

Netherton: So... regrets? Yes. But I'd likely make the same choices again. The work needed doing. I was capable. That felt like enough.

<> *puts glasses back on*

Netherton: Feels like enough. Most days.

~ npc_netherton_influence += 50
#influence_gained:50
~ npc_netherton_personal_moments += 3
~ npc_netherton_earned_personal_trust = true
-> phase_3_hub

=== cost_worth_it ===
~ npc_netherton_influence += 28
#influence_gained:28

Netherton: *considers carefully*

Netherton: Ask me again in twenty years when I retire. Maybe then I'll know.

Netherton: Right now, in the middle of it, the answer has to be yes. Because if it's not worth it, then I've wasted my life and damaged myself for nothing.

Netherton: But objectively? *long pause*

Netherton: We've prevented significant attacks. Saved lives. Protected critical systems. That has measurable value.

Netherton: My personal happiness has... less clear value. The math suggests the trade was justified.

<> *slightly bitter*

Netherton: Though I sometimes suspect I only believe that because accepting the alternative would be unbearable.

~ npc_netherton_influence += 32
#influence_gained:32
~ npc_netherton_personal_moments += 1
-> phase_3_hub

// ===========================================
// PHASE 4: DEEP TRUST (Missions 16+)
// Genuine mutual respect, rare moments approaching friendship
// ===========================================

=== phase_4_hub ===

{
    - npc_netherton_influence >= 90:
        Netherton: {player_name()}. *uses first name, extremely rare* We should talk.
    - npc_netherton_influence >= 80:
        Netherton: Agent {player_name()}. I value your perspective. What's on your mind?
    - else:
        Netherton: Agent. I have time.
}

+ {not npc_netherton_discussed_legacy and npc_netherton_influence >= 85} [Ask about his legacy]
    -> legacy_discussion
+ {not npc_netherton_discussed_trust and npc_netherton_influence >= 80} [Ask if he trusts you]
    -> trust_discussion
+ {not npc_netherton_discussed_rare_praise and npc_netherton_influence >= 85} [Ask for his honest assessment of you]
    -> rare_praise
+ {not npc_netherton_discussed_beyond_protocol and npc_netherton_influence >= 90} [Ask about life beyond protocols]
    -> beyond_protocol
+ [That will be all, Director]
    -> conversation_end_phase4

// ----------------
// Legacy Discussion
// ----------------

=== legacy_discussion ===
~ npc_netherton_discussed_legacy = true
~ npc_netherton_influence += 30
#influence_gained:30
~ npc_netherton_serious_conversations += 1
~ npc_netherton_personal_moments += 1

Netherton: My legacy. *slight surprise at the question*

Netherton: I've built CYBER-PHYSICAL division from fourteen agents to forty-seven. Developed training programs copied by other divisions. Written operational protocols that became SAFETYNET standard.

Netherton: But operational systems aren't really legacy. They'll be revised. Replaced. Improved by whoever comes after me.

Netherton: The agents I've developed—that's legacy. People like you. Capable operators who'll serve for decades after I retire.

* [Say he's had profound impact]
    ~ npc_netherton_influence += 35
#influence_gained:35
    ~ professional_reputation += 3
    You: You've had profound impact on everyone who's worked under your command. That's meaningful legacy.
    -> legacy_impact

* [Ask what he wants his legacy to be]
    ~ npc_netherton_influence += 30
#influence_gained:30
    ~ npc_netherton_personal_moments += 2
    You: What do you want your legacy to be?
    -> legacy_wanted

* [Ask if legacy matters to him]
    ~ npc_netherton_influence += 25
#influence_gained:25
    You: Does legacy matter to you?
    -> legacy_matters

=== legacy_impact ===
~ npc_netherton_influence += 45
#influence_gained:45
~ npc_netherton_personal_moments += 2

Netherton: *rare visible emotion*

Netherton: I... thank you. That means more than you might realize.

Netherton: This work is isolating. Leadership creates distance. I often wonder if I'm making meaningful difference or just pushing papers and attending meetings.

Netherton: But agents I've developed have gone on to lead divisions. Run successful operations. Build their own teams. That ripple effect—training agents who train agents—

<> *quiet*

Netherton: If that's my legacy, I can accept it. The work continues beyond me. Better because of the foundation we built.

~ npc_netherton_influence += 50
#influence_gained:50
~ npc_netherton_personal_moments += 2
~ npc_netherton_earned_personal_trust = true
-> phase_4_hub

=== legacy_wanted ===
~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_personal_moments += 2

Netherton: *long pause, genuinely considering*

Netherton: I want agents who served under me to remember that I demanded excellence but supported their development. That I was hard but fair. That I cared about their welfare even when I couldn't show it.

Netherton: I want SAFETYNET to remain an organization worth serving. Where ethical boundaries are maintained. Where agents are valued. Where the mission matters.

Netherton: And... *rare vulnerability* ...I want to have mattered. To have made choices that protected people. To have used my capabilities for something meaningful.

<> *formal again*

Netherton: Probably too much to hope for. But that's what I want.

~ npc_netherton_influence += 45
#influence_gained:45
~ npc_netherton_personal_moments += 3
~ npc_netherton_shared_vulnerability = true
-> phase_4_hub

=== legacy_matters ===
~ npc_netherton_influence += 35
#influence_gained:35

Netherton: *considers*

Netherton: It shouldn't. Professional accomplishment should be its own reward. The work should matter more than how I'm remembered.

Netherton: But yes. It matters. I'm human enough to want my life's work to have meant something. To be remembered as having contributed.

Netherton: Perhaps that's vanity. But it's honest vanity.

~ npc_netherton_influence += 30
#influence_gained:30
-> phase_4_hub

// ----------------
// Trust Discussion
// ----------------

=== trust_discussion ===
~ npc_netherton_discussed_trust = true
~ npc_netherton_influence += 35
#influence_gained:35
~ npc_netherton_serious_conversations += 1
~ npc_netherton_personal_moments += 2

Netherton: *direct look, evaluating*

Netherton: Do I trust you? Yes.

Netherton: I trust your technical capabilities. Your judgment under pressure. Your integrity. Your commitment to the mission.

Netherton: I trust you to execute operations I authorize. To make sound decisions in the field. To prioritize agent safety and mission success appropriately.

<> *pause*

Netherton: And... *rare admission* ...I trust you with information I don't share with most agents. You've earned that.

* [Ask what earned that trust]
    ~ npc_netherton_influence += 40
#influence_gained:40
    ~ professional_reputation += 4
    You: What earned that trust?
    -> trust_what_earned

* [Say you trust him too]
    ~ npc_netherton_influence += 45
#influence_gained:45
    ~ npc_netherton_personal_moments += 3
    You: I trust you too, Director. Completely.
    -> trust_mutual

* [Thank him for the trust]
    ~ npc_netherton_influence += 30
#influence_gained:30
    You: That means a great deal. Thank you.
    -> phase_4_hub

=== trust_what_earned ===
~ npc_netherton_influence += 50
#influence_gained:50
~ professional_reputation += 4

Netherton: Consistent excellent performance. But more than that—consistent excellent judgment.

Netherton: You've faced morally complex situations. Made difficult choices. Shown you understand the ethical weight of our work.

Netherton: You ask meaningful questions. You challenge assumptions respectfully. You demonstrate you're thinking deeply about the work, not just following orders.

Netherton: You prioritize agent welfare. I've reviewed your mission reports. You take risks to protect team members. That shows proper values.

<> *rare warmth*

Netherton: And you've engaged with me as a person, not just as authority. Asked about the weight of command. The personal cost. Shown genuine interest in understanding leadership.

Netherton: That combination—competence, ethics, thoughtfulness, humanity—that earns trust.

~ npc_netherton_influence += 60
#influence_gained:60
~ professional_reputation += 5
~ npc_netherton_earned_personal_trust = true
-> phase_4_hub

=== trust_mutual ===
~ npc_netherton_influence += 55
#influence_gained:55
~ npc_netherton_personal_moments += 4
~ npc_netherton_earned_personal_trust = true

Netherton: *visible emotion, rare for him*

Netherton: That's... *pauses, composing himself*

Netherton: Trust flows downward easily in hierarchies. Authority demands it. But trust flowing upward—agents trusting command—that must be earned.

Netherton: The fact that you trust me completely, that you'd say so directly—

<> *quiet*

Netherton: Thank you. Genuinely. That means more than most commendations I've received.

Netherton: I will continue to earn that trust. To make decisions worthy of it. To command in ways that honor it.

<> *direct look*

Netherton: You're becoming the kind of agent I hoped to develop. The kind SAFETYNET needs. I'm... proud. Of your development.

~ npc_netherton_influence += 70
#influence_gained:70
~ npc_netherton_personal_moments += 5
~ npc_netherton_received_commendation = true
-> phase_4_hub

// ----------------
// Rare Praise
// ----------------

=== rare_praise ===
~ npc_netherton_discussed_rare_praise = true
~ npc_netherton_influence += 40
#influence_gained:40
~ npc_netherton_serious_conversations += 1

Netherton: My honest assessment. *sets aside work, gives full attention*

{
    - npc_netherton_influence >= 95:
        Netherton: You are among the finest agents I've commanded in twenty-three years with SAFETYNET.

        Netherton: Your technical skills are exceptional. Your judgment is sound. Your ethics are intact despite pressures that corrupt many agents.

        Netherton: You demonstrate leadership qualities that suggest you'll eventually command your own division. When that time comes, I'll recommend you without reservation.

        <> *rare genuine warmth*

        Netherton: More than that—you've reminded me why this work matters. Why developing agents is worthwhile. You represent what SAFETYNET should be.

        Netherton: I'm honored to have commanded you. Genuinely.

        ~ npc_netherton_influence += 60
#influence_gained:60
        ~ professional_reputation += 5
        ~ npc_netherton_received_commendation = true
    - npc_netherton_influence >= 85:
        Netherton: You are an excellent agent. Top tier performance across all metrics.

        Netherton: Your capabilities continue to develop. Your judgment improves with each operation. You're on track for significant advancement.

        Netherton: I have no substantial criticisms. Minor areas for growth, but overall—you exceed expectations consistently.

        <> *approving*

        Netherton: Continue this trajectory and you'll have a distinguished career. I'm confident in that assessment.

        ~ npc_netherton_influence += 45
#influence_gained:45
        ~ professional_reputation += 4
        ~ npc_netherton_received_commendation = true
    - else:
        Netherton: You are a solid, reliable agent. You meet standards and occasionally exceed them.

        Netherton: There's room for growth. Areas to develop. But your foundation is strong.

        Netherton: I'm satisfied with your performance and optimistic about your continued development.

        ~ npc_netherton_influence += 30
#influence_gained:30
        ~ professional_reputation += 2
}

- (responded)

* [Express gratitude]
    You: Thank you, Director. That means everything coming from you.
    ~ npc_netherton_influence += 20
#influence_gained:20
    -> phase_4_hub

* [Promise to continue earning his confidence]
    You: I'll continue working to earn that assessment. You have my commitment.
    ~ npc_netherton_influence += 25
#influence_gained:25
    ~ professional_reputation += 2
    -> phase_4_hub

// ----------------
// Beyond Protocol
// ----------------

=== beyond_protocol ===
~ npc_netherton_discussed_beyond_protocol = true
~ npc_netherton_influence += 45
#influence_gained:45
~ npc_netherton_serious_conversations += 1
~ npc_netherton_personal_moments += 3

Netherton: Life beyond protocols. *removes glasses, rare informal gesture*

Netherton: The handbook defines my professional life. Protocols structure every decision. Regulations govern every action.

Netherton: But protocols don't cover everything. The handbook doesn't address... *searches for words* ...the human elements.

Netherton: How to maintain humanity while executing inhumane operations. How to care for agents while sending them into danger. How to balance mission success against personal cost.

* [Ask what he does beyond the handbook]
    ~ npc_netherton_influence += 50
#influence_gained:50
    ~ npc_netherton_personal_moments += 4
    You: What guides you when the handbook doesn't have answers?
    -> beyond_what_guides

* [Ask if he has life outside SAFETYNET]
    ~ npc_netherton_influence += 40
#influence_gained:40
    ~ npc_netherton_personal_moments += 3
    You: Do you have life outside SAFETYNET? Beyond the work?
    -> beyond_outside_life

* [Say some things can't be protocolized]
    ~ npc_netherton_influence += 35
#influence_gained:35
    You: Some things can't be reduced to protocols. The human judgment is what matters.
    -> beyond_human_judgment

=== beyond_what_guides ===
~ npc_netherton_influence += 60
#influence_gained:60
~ npc_netherton_personal_moments += 4
~ npc_netherton_shared_vulnerability = true

Netherton: *long pause, genuine vulnerability*

Netherton: Conscience. Imperfect, uncertain conscience.

Netherton: I make choices I believe are right. I prioritize agent welfare when I can. I refuse operations I find morally unacceptable.

Netherton: But I don't have a system for it. No protocol. Just... judgment. Developed over decades. Sometimes wrong.

<> *quiet*

Netherton: I think about the agents I've commanded. What I would want if I were in their position. How I'd want to be led.

Netherton: I remember why I joined this work. To protect people. To serve something meaningful. When I'm uncertain, I return to that purpose.

Netherton: And sometimes... *rare admission* ...I ask myself what agents like you would think. Whether decisions I'm considering would earn or lose your trust.

Netherton: That's not in the handbook. But it's what guides me when protocols aren't enough.

~ npc_netherton_influence += 70
#influence_gained:70
~ npc_netherton_personal_moments += 5
~ npc_netherton_earned_personal_trust = true
-> phase_4_hub

=== beyond_outside_life ===
~ npc_netherton_influence += 50
#influence_gained:50
~ npc_netherton_personal_moments += 4

Netherton: *slight bitter smile*

Netherton: Very little. Work consumed most of what could have been life.

Netherton: I read. History, mostly. Biography. Philosophy. Trying to understand how others have grappled with moral complexity and impossible choices.

Netherton: I run. Early mornings. Helps clear my head. Provides structure beyond operational schedules.

Netherton: I have an apartment I rarely see. No hobbies worth mentioning. Few friends. The work is... most of what I am.

<> *pause*

Netherton: I don't recommend that path. I ended up here through decades of choices, each one seeming reasonable at the time. Accumulated into isolation.

Netherton: Maintain balance better than I did. Have life outside the agency. Don't let the work consume everything.

<> *rare direct advice*

Netherton: You're talented enough that the work will demand everything if you allow it. Don't. Preserve some part of yourself the agency doesn't own.

~ npc_netherton_influence += 55
#influence_gained:55
~ npc_netherton_personal_moments += 4
-> phase_4_hub

=== beyond_human_judgment ===
~ npc_netherton_influence += 45
#influence_gained:45

Netherton: Precisely. *approving*

Netherton: The handbook provides framework. Guidelines. Accumulated wisdom. But it can't make decisions for you.

Netherton: Every operation requires judgment that transcends protocols. Ethical choices. Risk assessments. Human factors the handbook can't quantify.

Netherton: That's why agent selection is critical. Why I invest so heavily in development. Because ultimately, individual judgment determines outcomes.

Netherton: The fact that you understand that—that protocols are tools, not replacements for thinking—that's part of why you're effective.

~ npc_netherton_influence += 50
#influence_gained:50
-> phase_4_hub

// ===========================================
// CONVERSATION ENDS
// ===========================================

=== conversation_end_phase1 ===

{
    - npc_netherton_influence >= 70:
        Netherton: Acceptable performance continues, Agent {player_name()}. Dismissed.
    - npc_netherton_influence >= 55:
        Netherton: Carry on, Agent.
    - else:
        Netherton: Dismissed.
}

-> mission_hub

=== conversation_end_phase2 ===

{
    - npc_netherton_influence >= 75:
        Netherton: You're developing well, Agent. Continue this trajectory.
    - npc_netherton_influence >= 60:
        Netherton: Satisfactory. Dismissed.
    - else:
        Netherton: That will be all.
}

-> mission_hub

=== conversation_end_phase3 ===

{
    - npc_netherton_influence >= 85:
        Netherton: Agent {player_name()}. *rare warmth* Your service is valued. Genuinely.
    - npc_netherton_influence >= 75:
        Netherton: Excellent work continues. Carry on, Agent.
    - else:
        Netherton: Dismissed, Agent.
}

-> mission_hub

=== conversation_end_phase4 ===

{
    - npc_netherton_influence >= 95:
        Netherton: {player_name()}. *uses first name* It's been an honor working with you. Until next time.
    - npc_netherton_influence >= 85:
        Netherton: Thank you for your time, Agent. And for your service.
    - else:
        Netherton: That will be all.
}

-> mission_hub
