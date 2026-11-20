// ===========================================
// AGENT 0x00 - CYBER-PHYSICAL DIVISION INTRODUCTION
// Break Escape Universe
// ===========================================
// A cutscene introducing Agent 0x00 to their new assignment
// in SAFETYNET's CYBER-PHYSICAL division.
// ===========================================

// Relationship and choice tracking variables
VAR netherton_respect = 50          // Director Netherton's assessment (0-100)
VAR haxolottle_trust = 50           // Handler's confidence in agent (0-100)
VAR player_attitude = ""            // eager, cautious, confident, analytical
VAR specialization_interest = ""    // cyber, physical, hybrid
VAR knows_cyber_division = false    // Has player asked about the division?
VAR knows_handler_role = false      // Has player asked about handlers?
VAR professional_impression = true  // Starting with good impression

// External variables (could be set by game)
EXTERNAL player_name
EXTERNAL previous_missions_completed

// ===========================================
// OPENING: SAFETYNET HEADQUARTERS
// ===========================================

=== start ===
[Location: SAFETYNET Headquarters, Director's Office]
[Time: 0900 hours]

Narrator: The elevator doors open with a soft chime. You step into the corridor of SAFETYNET's executive level—a place you've only heard about in whispers. Sleek, minimalist, and impossibly secure.

The walls are lined with framed commendations and photos of operations you'll probably never be cleared to know about. Each door bears only a number, no names.

A subtle display guides you: "Director Netherton - Office 7A - Proceed."

Your phone buzzed exactly 47 minutes ago with a single message: "Report to HQ. Director's office. 0900 sharp."

No explanation. No context. Just the summons.

* [Walk confidently to the office]
    ~ player_attitude = "confident"
    ~ netherton_respect += 5
    You've been called here for a reason. Whatever it is, you're ready.
    -> directors_office

* [Approach cautiously]
    ~ player_attitude = "cautious"
    You take a moment to steady yourself. Deep breath. This could be anything—commendation, reprimand, or something else entirely.
    -> directors_office

* [Review what you know]
    ~ player_attitude = "analytical"
    ~ netherton_respect += 3
    As you walk, you mentally catalog the possibilities. Your recent operations were successful. No major rule violations. Performance metrics solid. This is probably...
    -> directors_office

// ===========================================
// DIRECTOR NETHERTON'S OFFICE
// ===========================================

=== directors_office ===
Narrator: You reach Office 7A. The door is already open.

Director Magnus Netherton sits behind an immaculate desk, reviewing something on a tablet. He's exactly as described—impeccably dressed in a charcoal suit, gray at the temples, and radiating the kind of authority that comes from two decades of making life-or-death decisions.

Without looking up:

Netherton: Agent {player_name}. You're three minutes early. Acceptable.

He gestures to a chair.

Netherton: Please, sit.

* [Sit immediately]
    You take the offered seat, maintaining professional posture.
    -> first_briefing

* [Ask why you've been summoned]
    ~ netherton_respect -= 5
#respect_lost:5
    ~ player_attitude = "eager"
    You: Director, may I ask why I've been called in?
    -> premature_question

* [Wait for him to continue]
    ~ netherton_respect += 5
    ~ player_attitude = "cautious"
    You sit down silently, waiting for the Director to speak first. Patience is a virtue in SAFETYNET.
    -> first_briefing

=== premature_question ===
Netherton: Netherton finally looks up, his expression unreadable.

Netherton: You'll find out momentarily, Agent. Patience is a virtue outlined in handbook section 3.4—though I suspect you already know that.

He returns his attention to the tablet for exactly five more seconds, then sets it down.

-> first_briefing

// ===========================================
// THE BRIEFING - CYBER-PHYSICAL DIVISION
// ===========================================

=== first_briefing ===
Netherton: Your performance over the past {previous_missions_completed > 0: {previous_missions_completed} operations | several months} has been noted.

{player_attitude == "confident":
    Netherton: You carry yourself with confidence. Good. You'll need that.
}
{player_attitude == "cautious":
    Netherton: You're careful. Methodical. These are valuable traits.
}
{player_attitude == "analytical":
    Netherton: Your analytical approach to challenges has not gone unnoticed.
}

Netherton: You've proven yourself capable in {previous_missions_completed > 0: fieldwork | your previous assignments}. However, SAFETYNET has a more... specialized need for your skills.

He taps the tablet, and a holographic display materializes above his desk—organizational charts, mission statistics, threat assessments.

Netherton: The CYBER-PHYSICAL division. Our operatives who engage with threats that exist at the intersection of digital and physical security.

The display shifts to show images: server rooms, corporate facilities, critical infrastructure, research labs.

Netherton: ENTROPY doesn't simply hack systems from a distance, Agent. They infiltrate facilities. They compromise supply chains. They plant hardware backdoors. They manipulate both silicon and society.

* [Express eagerness to join]
    ~ player_attitude = "eager"
    ~ haxolottle_trust += 5
    You: I'm ready for this, Director. When do I start?
    -> eager_response

* [Ask about the division's scope]
    ~ player_attitude = "analytical"
    ~ netherton_respect += 5
    ~ knows_cyber_division = true
    You: What exactly does the CYBER-PHYSICAL division handle that other divisions don't?
    -> division_details

* [Ask why you were selected]
    ~ player_attitude = "cautious"
    You: Why me, sir? There are more experienced agents.
    -> why_selected

=== eager_response ===
Netherton: Netherton's expression doesn't change, but there's something that might be approval in his eyes.

Netherton: Enthusiasm is noted, Agent. However, there are protocols. Per handbook section 12.3, new division assignments require a comprehensive briefing and handler assignment.

-> division_details

=== division_details ===
Netherton: The CYBER-PHYSICAL division handles operations requiring both cyber security expertise and physical infiltration capability.

He highlights several case files on the display:

Netherton: - Facility infiltration to access air-gapped systems
Netherton: - Physical implantation of monitoring devices
Netherton: - On-site network penetration and data exfiltration
Netherton: - Supply chain interdiction
Netherton: - Hardware security assessments of critical infrastructure

{not knows_cyber_division:
    ~ knows_cyber_division = true
}

Netherton: Unlike pure cyber operations conducted remotely, or pure physical security assessments, CYBER-PHYSICAL operatives must excel at both. The margin for error is... minimal.

-> handler_introduction_setup

=== why_selected ===
Netherton: A valid question.

He pulls up what appears to be your personnel file.

Netherton: Your technical proficiency is well-documented. Your adaptability in the field has been demonstrated repeatedly. And perhaps most importantly...

He looks directly at you.

Netherton: You complete missions while adhering to operational protocols. A rarer combination than one might expect.

{player_attitude == "cautious":
    Netherton: Your cautious nature is an asset, not a liability. CYBER-PHYSICAL operations require agents who think before they act.
}

~ netherton_respect += 10

-> division_details

=== handler_introduction_setup ===
Netherton: Per standard operating procedure outlined in handbook section 14.7, you will be assigned a dedicated handler for CYBER-PHYSICAL operations.

He presses a button on his desk.

Netherton: Someone with extensive field experience who can provide real-time support during your operations.

The office door opens.

* [Turn to see who enters]
    -> haxolottle_entrance

// ===========================================
// AGENT 0x99 "HAXOLOTTLE" INTRODUCTION
// ===========================================

=== haxolottle_entrance ===
Narrator: A figure enters—relaxed posture, tech-casual attire, holding what appears to be a coffee mug with an unusual design. They look comfortable in a way that suggests years of experience.

Haxolottle: Agent {player_name}, I presume?

They extend a hand for a handshake.

Haxolottle: Agent 0x99. Callsign "Haxolottle." Yes, like the axolotl. Yes, I know it's unusual. And yes, there's a story behind it that I'll probably tell you over comms during a mission at exactly the wrong moment.

* [Shake hands professionally]
    ~ haxolottle_trust += 5
    ~ professional_impression = true
    You shake hands firmly. Professional. Confident.
    You: Pleased to meet you, Agent 0x99.
    -> haxolottle_initial_banter

* [Shake hands warmly]
    ~ haxolottle_trust += 10
    You shake hands with a genuine smile. This person seems... approachable. Different from the Director's intensity.
    You: Call me {player_name}. Looking forward to working together.
    -> haxolottle_initial_banter

* [Ask about the axolotl reference]
    ~ haxolottle_trust += 8
    ~ specialization_interest = "curious"
    You shake hands, genuinely curious.
    You: I have to ask—why "Haxolottle"?
    -> axolotl_story_teaser

=== haxolottle_initial_banter ===
Haxolottle: Haxolottle grins and glances at Director Netherton.

Haxolottle: Still as warm and welcoming as ever, I see, Director.

Netherton: Netherton doesn't look up from his tablet.

Netherton: Agent 0x99, please maintain professional decorum per handbook section—

Haxolottle: —Section 3.2.b, interpersonal conduct. I know, I know. Fifteen years and you're still citing the handbook at me.

Haxolottle turns back to you with a conspiratorial wink.

Haxolottle: You'll get used to it. The Director's bark is worse than his bite. Actually, wait, that's not true. His bite is exactly as strict as his bark. But it comes from a good place.

-> handler_explanation

=== axolotl_story_teaser ===
Haxolottle: Haxolottle's eyes light up.

Haxolottle: Oh, you're going to fit in just fine. The short version: axolotls are masters of regeneration and adaptation. Lost a limb? Grow it back. Need to change your approach? Metamorphosis is an option.

Netherton: Director Netherton clears his throat.

Netherton: Agent 0x99, perhaps we could save the amphibian biology lecture for after the formal briefing.

Haxolottle: Right, right. Professional decorum. Got it, Director.

Haxolottle turns back to you with a smile.

Haxolottle: Long version later. For now, just know: in this job, the ability to regenerate from setbacks and adapt to changing circumstances is everything. Hence, Haxolottle.

-> handler_explanation

=== handler_explanation ===
Netherton: Director Netherton stands, hands clasped behind his back.

Netherton: Agent 0x99 will serve as your handler for CYBER-PHYSICAL operations. They will provide mission briefings, real-time support during operations, and post-mission debriefing.

Haxolottle: Translation: I'm the voice in your ear when you're standing in a server room you're not supposed to be in, trying to bypass security you definitely shouldn't be bypassing, while maintaining a cover story that seemed way more convincing during planning.

~ haxolottle_trust += 5

Haxolottle: I've been doing this for fifteen years. Spent eight in the field before transitioning to handler work. Whatever you run into out there, I've probably seen it—or something close enough to help.

* [Express confidence in the arrangement]
    ~ haxolottle_trust += 10
    ~ netherton_respect += 5
    You: I appreciate the support. Looking forward to working with you both.
    -> mission_philosophy_question

* [Ask about their field experience]
    ~ haxolottle_trust += 5
    ~ knows_handler_role = true
    You: What kind of operations did you run in the field?
    -> haxolottle_experience_brief

* [Ask what happens if you disagree during a mission]
    ~ player_attitude = "analytical"
    ~ netherton_respect += 8
    You: What if we disagree about the best approach during an operation?
    -> disagreement_protocol

=== haxolottle_experience_brief ===
Haxolottle: Haxolottle leans against the Director's desk casually—earning a slight frown from Netherton, which they ignore.

Haxolottle: Infiltrated controlled corporations. Ran counter-intelligence on ENTROPY cells. Did some work that's still classified and will probably stay that way until we're both retired.

Haxolottle: The operation that earned me the callsign involved being pinned in a compromised position for three days, surviving through adaptation and creative problem-solving. Turned a blown mission into our biggest intelligence coup that year.

Haxolottle: Point is: I know what you'll be dealing with. The fear. The adrenaline. The moment when everything goes sideways and you have to improvise. I've been there.

~ knows_handler_role = true
~ haxolottle_trust += 5

-> mission_philosophy_question

=== disagreement_protocol ===
Netherton: Netherton answers before Haxolottle can.

Netherton: An excellent question. Per handbook section 14.9, field agents have operational discretion when directly engaged. You are on-site. You have eyes on the situation. Your handler provides guidance, not commands.

Haxolottle: What the Director's saying is: I'll give you my best assessment based on the big picture I can see. But you're the one in the room. If you've got a better read on the situation, I trust your judgment.

Haxolottle: That said, if I'm telling you something's dangerous, there's probably a very good reason. We're partners in this.

~ netherton_respect += 10
~ haxolottle_trust += 10

-> mission_philosophy_question

=== mission_philosophy_question ===
Netherton: Director Netherton pulls up a new display—threat assessments, ENTROPY cell activities, ongoing operations.

Netherton: The CYBER-PHYSICAL division faces unique challenges. ENTROPY operates in the shadows between digital and physical security. They exploit the gaps where traditional defenses fail.

Haxolottle: We're the ones who close those gaps. Sometimes with elegant technical solutions. Sometimes with a lockpick and a convincing cover story.

Netherton: Your approach to these operations will shape your effectiveness. I'm interested in understanding your operational philosophy, Agent {player_name}.

* [Prioritize thoroughness and caution]
    ~ player_attitude = "cautious"
    ~ specialization_interest = "analytical"
    ~ netherton_respect += 10
    You: I believe in careful planning, thorough reconnaissance, and minimizing risk. Better to take the time to do it right.
    -> cautious_philosophy_response

* [Prioritize speed and decisiveness]
    ~ player_attitude = "confident"
    ~ specialization_interest = "physical"
    ~ haxolottle_trust += 10
    You: In my experience, hesitation is dangerous. Gather intel, make a plan, execute with confidence. Adapt as needed.
    -> confident_philosophy_response

* [Prioritize adaptability and flexibility]
    ~ player_attitude = "analytical"
    ~ specialization_interest = "hybrid"
    ~ netherton_respect += 8
    ~ haxolottle_trust += 8
    You: Every situation is different. I believe in having multiple approaches ready and adapting based on what I encounter.
    -> adaptive_philosophy_response

=== cautious_philosophy_response ===
Netherton: Netherton nods approvingly.

Netherton: A methodical approach. This aligns well with handbook guidance on operational planning section 7.3. Measured execution reduces unnecessary exposure and maintains operational security.

Haxolottle: And when things inevitably go sideways—because they always do—that thorough planning gives you a foundation to build your improvisation on. Like an axolotl regenerating a limb: you need the core structure first.

There's that axolotl reference again.

-> specialization_discussion

=== confident_philosophy_response ===
Haxolottle: Haxolottle grins.

Haxolottle: I like it. Decisiveness is underrated. Analysis paralysis has killed more operations than bold action, in my experience.

Netherton: Netherton looks less enthusiastic but not disapproving.

Netherton: Confidence is valuable, Agent, provided it's paired with sound judgment. Per handbook section 8.5, field discretion requires balancing speed with caution.

Haxolottle: Translation: be bold, but don't be reckless. We're working on it together. If your instincts say "go," and I don't have a compelling reason to stop you, we go.

-> specialization_discussion

=== adaptive_philosophy_response ===
Haxolottle: Haxolottle actually looks impressed.

Haxolottle: Now that's the mindset. Adaptability. Flexibility. Like I said—axolotl thinking. The ability to regenerate your approach when the first one doesn't work.

Netherton: Director Netherton also appears satisfied.

Netherton: A balanced perspective. The handbook acknowledges in section 14.2 that field conditions are inherently unpredictable. Agents who can adjust methodology while maintaining mission focus demonstrate advanced operational maturity.

Haxolottle: In other words: you get it. Perfect. We're going to work well together.

-> specialization_discussion

=== specialization_discussion ===
Netherton: Netherton dismisses the holographic display.

Netherton: Agent 0x99 will handle your detailed orientation over the coming week. You'll receive technical briefings, facility access, and equipment assignments.

He looks directly at you.

Netherton: The CYBER-PHYSICAL division handles the operations that are too complex for single-discipline approaches. You will encounter challenges that test both your technical capabilities and your field craft.

Haxolottle: What the Director's not saying is: you're going to be challenged. But you're also going to grow faster than you ever thought possible. We don't assign people to CYBER-PHYSICAL unless we believe they can handle it.

Netherton: Quite. Do you have any questions before you begin orientation?

* [Ask about first assignment]
    You: When will I receive my first CYBER-PHYSICAL operation?
    -> first_assignment_timing

* [Ask about training and preparation]
    You: What kind of preparation should I focus on?
    -> training_guidance

* [Express readiness to begin]
    You: No questions, Director. I'm ready to start.
    -> ready_to_begin

=== first_assignment_timing ===
Netherton: Netherton glances at his tablet.

Netherton: Per protocol, new division assignments require a one-week orientation period. However, given current operational tempo and ENTROPY activity levels...

He looks at Haxolottle.

Haxolottle: I've got a scenario developing that's perfect for a shakedown operation. Corporate facility, suspected ENTROPY infiltration, moderate complexity. Could be ready to brief in 72 hours.

Netherton: Acceptable. Agent {player_name}, complete your orientation, review the required materials, and report to Agent 0x99 on Thursday at 0800 hours.

~ netherton_respect += 5

-> closing_briefing

=== training_guidance ===
Haxolottle: Haxolottle answers first.

Haxolottle: Honestly? The best preparation is reviewing what you already know. You've got the fundamentals. Now it's about integrating them.

{specialization_interest == "cyber":
    Haxolottle: Your technical skills are solid. Brush up on physical infiltration basics—lockpicking, cover stories, reading floor plans. The cyber part, you've got.
}
{specialization_interest == "physical":
    Haxolottle: Your field craft is good. Make sure your technical knowledge is current—latest exploit frameworks, network architecture, common security systems. The physical part, you've got.
}
{specialization_interest == "hybrid":
    Haxolottle: You've got a good foundation in both areas. Focus on integration—how to use physical access to enable cyber operations, and vice versa. That's where CYBER-PHYSICAL work gets interesting.
}

Netherton: Additionally, review handbook sections 12 through 18. CYBER-PHYSICAL operations have specific protocols regarding evidence handling, data exfiltration, and operational security.

~ netherton_respect += 8
~ haxolottle_trust += 5

-> closing_briefing

=== ready_to_begin ===
Netherton: Netherton almost smiles. Almost.

Netherton: Confidence without arrogance. Acceptable. Agent 0x99, proceed with orientation protocol per handbook section 12.5.

Haxolottle: Copy that, Director.

Haxolottle gestures toward the door.

Haxolottle: Come on, Agent {player_name}. Let me show you your new office space, introduce you to the team, and explain why the coffee on level 3 is better than level 5 despite what anyone tells you.

~ haxolottle_trust += 10
~ professional_impression = true

-> closing_briefing

=== closing_briefing ===
Netherton: Director Netherton stands, signaling the meeting's conclusion.

Netherton: Agent {player_name}, welcome to the CYBER-PHYSICAL division. Your performance will be evaluated continuously. I expect excellence.

{netherton_respect >= 60:
    Netherton: Based on your record and this conversation, I believe you're capable of meeting that standard.
}
{netherton_respect < 60:
    Netherton: I trust you'll rise to the challenge.
}

He extends his hand for a formal handshake.

* [Shake hands firmly]
    You shake the Director's hand. His grip is firm, measured. Professional.
    -> final_moment

=== final_moment ===
Netherton: Per handbook section 2.7, maintain operational security regarding your division assignment. Dismissed.

As you turn to leave with Haxolottle, the Director speaks once more:

Netherton: {netherton_respect >= 70: Agent {player_name}... good luck. | Agent... don't disappoint me.}

The door closes behind you.

Haxolottle: Haxolottle grins as you walk down the corridor.

Haxolottle: So! Welcome to CYBER-PHYSICAL. You survived a Netherton briefing without him citing the handbook more than... okay, he cited it a lot. But he likes you—I can tell.

Haxolottle: First rule of working with me: I will make axolotl metaphors. They're genuinely helpful about 60% of the time. Second rule: when I say "get out now," trust me and get out.

Haxolottle: Everything else we'll figure out together. Ready to see your new workspace?

* [Absolutely]
    ~ haxolottle_trust += 5
    You: Lead the way.
    -> orientation_begins

* [Ask about the team]
    You: You mentioned introducing me to the team?
    -> team_tease

=== orientation_begins ===
Haxolottle: Haxolottle leads you toward the elevators.

Haxolottle: One more thing—and this is important. We're partners in this work. I've got experience and perspective. You've got skills and fresh eyes. Best operations happen when we trust each other.

They press the elevator button.

Haxolottle: So if you've got questions, ask. If something doesn't feel right, speak up. And if I tell you about axolotl regeneration during a critical moment... well, it'll probably be relevant. Probably.

The elevator arrives.

Haxolottle: Welcome to CYBER-PHYSICAL, Agent {player_name}. This is going to be interesting.

-> END

=== team_tease ===
Haxolottle: Oh, you'll like them. We've got Dr. Chen in technical support—brilliant, talks incredibly fast, lives on energy drinks. There's a betting pool on whether they actually sleep.

Haxolottle: Then there's Agent 0x42—you might not meet them directly. They're... mysterious. Legendary field operative. Appears cryptically, provides crucial information, vanishes. Very dramatic.

Haxolottle: And of course, there's the rest of the CYBER-PHYSICAL agents. Good people. We look out for each other out there.

They press the elevator button.

Haxolottle: You're joining a solid team, Agent. We've got your back.

-> orientation_begins

// ===========================================
// END OF INTRO CUTSCENE
// ===========================================
// Variables set:
// - netherton_respect (relationship with Director)
// - haxolottle_trust (relationship with handler)
// - player_attitude (roleplay style)
// - specialization_interest (career direction hints)
// - knows_cyber_division (lore flag)
// - knows_handler_role (lore flag)
// ===========================================
