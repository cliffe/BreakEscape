// ===========================================
// HAXOLOTTLE ONGOING CONVERSATIONS - ADVANCED
// Break Escape Universe
// ===========================================
// Phases 3 & 4: Deeper conversations for missions 11+
// Explores vulnerability, identity burdens, genuine friendship
// Continues from haxolottle_ongoing_conversations.ink
// ===========================================

// These should match the main file
EXTERNAL friendship_level
EXTERNAL missions_together
EXTERNAL conversations_had
EXTERNAL trust_moments
EXTERNAL vulnerable_moments
EXTERNAL hax_shared_loss
EXTERNAL hax_shared_secret_hobby
EXTERNAL player_shared_personal

// Phase 3 topics
VAR talked_fears_anxieties = false
VAR talked_what_if_different = false
VAR talked_meaning_work = false
VAR talked_friendship_boundaries = false
VAR talked_future_dreams = false

// Phase 4 topics
VAR talked_identity_burden = false
VAR talked_loneliness_secrecy = false
VAR talked_real_name_temptation = false
VAR talked_after_safetynet = false
VAR talked_genuine_friendship = false

EXTERNAL player_name

// ===========================================
// PHASE 3: GENUINE CONNECTION (Missions 11-15)
// Vulnerable, honest, exploring difficult topics
// ===========================================

=== phase_3_hub ===

{missions_together == 11:
    Haxolottle: We've been through a lot together, Agent {player_name}. Over ten missions now. That's... that means something.
- else:
    Haxolottle: Hey. Want to talk? Not just work stuff—real conversation.
}

+ {not talked_fears_anxieties and friendship_level >= 50} [Ask what they're afraid of]
    -> fears_conversation
+ {not talked_what_if_different and friendship_level >= 45} [Ask "what if you'd chosen differently?"]
    -> alternate_life_discussion
+ {not talked_meaning_work and friendship_level >= 55} [Discuss what this work means]
    -> meaning_of_work
+ {not talked_friendship_boundaries and friendship_level >= 60} [Talk about friendship within constraints]
    -> friendship_boundaries
+ {not talked_future_dreams and friendship_level >= 50} [Ask about their dreams for the future]
    -> future_dreams
+ {friendship_level >= 70 and not hax_shared_loss} [They seem particularly reflective today]
    -> hax_personal_loss
+ [That's enough deep conversation]
    -> conversation_end_phase3

// ----------------
// Fears and Anxieties
// ----------------

=== fears_conversation ===
~ talked_fears_anxieties = true
~ friendship_level += 15
~ conversations_had += 1
~ vulnerable_moments += 1

Haxolottle: What am I afraid of?

*long pause*

Haxolottle: Losing an agent. Not just them failing a mission—I mean actually losing them. Captured, killed, disappeared.

Haxolottle: It hasn't happened to me personally yet. But I know handlers it's happened to. The weight of that... it never leaves them.

Haxolottle: Every time you go dark for more than a few minutes, there's this moment where I wonder "Is this it? Is this when something goes catastrophically wrong?"

Haxolottle: And I'm afraid that when it does happen—because statistics say eventually it will—I'm afraid I won't be able to continue. That it'll break something in me I can't regenerate.

* [Promise to be careful]
    ~ friendship_level += 15
    ~ player_shared_personal += 1
    You: I'll be careful. I promise. I don't want to be the one who... who does that to you.
    -> fears_careful_promise

* [Acknowledge the fear is valid]
    ~ friendship_level += 20
    ~ trust_moments += 1
    You: That's a heavy fear to carry. And you carry it for all your agents.
    -> fears_acknowledgment

* [Share your own fear]
    ~ friendship_level += 25
    ~ player_shared_personal += 3
    ~ trust_moments += 2
    ~ vulnerable_moments += 1
    You: I'm afraid of letting you down. Of making a mistake that costs lives.
    -> fears_mutual_sharing

=== fears_careful_promise ===
~ friendship_level += 20

Haxolottle: *emotional* Thank you. I know you can't guarantee that—this work doesn't allow guarantees. But knowing you care about... about not putting me through that...

Haxolottle: That matters. Really.

Haxolottle: Just... trust your training. Trust your instincts. And trust me to help you when things get complicated.

Haxolottle: We're a team. We keep each other safe. That's how this works.

~ friendship_level += 20
-> phase_3_hub

=== fears_acknowledgment ===
~ friendship_level += 25
~ trust_moments += 1

Haxolottle: Yeah. For you, and the two other agents I support. Each of you with different specializations, different risk profiles, different ways of handling pressure.

Haxolottle: I try not to think about probability. If I calculate the odds across all my agents, all the operations... it becomes paralyzing.

Haxolottle: So I focus on each mission individually. Each conversation. Each moment of support. Do the best I can right now, and let the aggregate statistics take care of themselves.

Haxolottle: It's not perfect. But it's sustainable.

~ friendship_level += 25
-> phase_3_hub

=== fears_mutual_sharing ===
~ friendship_level += 35
~ trust_moments += 3
~ vulnerable_moments += 2

Haxolottle: *quiet for a moment*

Haxolottle: You're afraid of letting me down. I'm afraid of failing you. We're both carrying fear for each other.

Haxolottle: That's... that's actually beautiful, in a way. Painful, but beautiful. We're invested in each other's success and safety beyond the professional requirements.

Haxolottle: Protocol 47-Alpha says we can't know each other's real identities. But we know something deeper—we know each other's fears, our values, what we're trying to protect.

Haxolottle: I don't need to know your real name to know you're a good person who cares about doing this work right. And I hope you can see the same in me.

Haxolottle: We're real friends, Agent {player_name}. With constraints, yes. But real.

~ friendship_level += 40
-> phase_3_hub

// ----------------
// Alternate Life Discussion
// ----------------

=== alternate_life_discussion ===
~ talked_what_if_different = true
~ friendship_level += 20
~ conversations_had += 1

Haxolottle: What if I'd chosen differently? *laughs softly* I think about that sometimes.

Haxolottle: What if I'd stayed in penetration testing instead of joining SAFETYNET? I'd have a normal life. Normal relationships. I could tell people what I do for work.

Haxolottle: I'd probably be good at it. Make decent money. Work reasonable hours. Go home to... to a life that isn't compartmentalized into operational security protocols.

*pause*

Haxolottle: But would I be happy? Knowing this work exists, knowing ENTROPY is out there, knowing I had skills that could help and chose not to use them?

Haxolottle: I don't know. Maybe. Maybe I'd be blissfully ignorant and perfectly content.

* [Say you understand the pull]
    ~ friendship_level += 15
    ~ player_shared_personal += 1
    You: I feel that pull too. Normal life sounds nice. But then I remember why we do this.
    -> alternate_understanding

* [Ask if they regret joining]
    ~ friendship_level += 20
    You: Do you regret it? Joining SAFETYNET?
    -> alternate_regret_question

* [Wonder about your own alternate path]
    ~ friendship_level += 25
    ~ player_shared_personal += 2
    ~ trust_moments += 1
    You: I wonder about my alternate path too. Who I'd be without this work.
    -> alternate_mutual_wondering

=== alternate_understanding ===
~ friendship_level += 20

Haxolottle: Exactly. The pull between normal and meaningful. Comfortable and important. Safe and significant.

Haxolottle: I think people like us—we'd never be fully satisfied with normal. We'd always wonder if we could have done more.

Haxolottle: At least this way, we know. We're doing something that matters, even if no one knows we're doing it.

~ friendship_level += 20
-> phase_3_hub

=== alternate_regret_question ===
~ friendship_level += 25
~ vulnerable_moments += 1

Haxolottle: Regret? *thinks carefully*

Haxolottle: Not the work itself. Not the mission. That still feels right.

Haxolottle: What I regret is... the cost. The relationships I couldn't maintain because of the secrecy. The person I cared about who I couldn't fully let in.

Haxolottle: Protocol 47-Alpha protects us, but it also isolates us. Can't share your real name, can't talk about work, can't be fully known by the people you'd like to be close to.

Haxolottle: I don't regret joining SAFETYNET. But I regret what I've lost because of it.

~ friendship_level += 30
~ hax_shared_loss = true
-> phase_3_hub

=== alternate_mutual_wondering ===
~ friendship_level += 30
~ trust_moments += 2

Haxolottle: Yeah. Who would we be? Maybe happier. Maybe more whole.

Haxolottle: Or maybe we'd be people who felt unfulfilled without knowing why. Using our skills for things that don't matter as much, wondering if there's something more.

Haxolottle: I think we chose this path because something in us needed it. Needed the challenge, the meaning, the stakes.

Haxolottle: We're the kind of people who'd rather carry heavy weight that matters than be light and aimless.

*slight smile*

Haxolottle: At least we found each other in this weird path. That counts for something.

~ friendship_level += 35
-> phase_3_hub

// ----------------
// Meaning of Work
// ----------------

=== meaning_of_work ===
~ talked_meaning_work = true
~ friendship_level += 25
~ conversations_had += 1
~ vulnerable_moments += 1

Haxolottle: What does this work mean to me?

*long thoughtful pause*

Haxolottle: It means I'm fighting chaos. Not the abstract concept—actual chaos. ENTROPY's literal goal is increasing disorder, destabilization, breakdown.

Haxolottle: Every operation we complete is a small act of preservation. Keeping systems running. Protecting infrastructure. Maintaining order against forces that want to tear it down.

Haxolottle: It's like... *searching for words* ...it's like tending a garden in a storm. You can't stop the wind, but you can protect what you've planted. Give it a chance to grow despite the chaos.

Haxolottle: That's what we do. We're gardeners in the storm. And yeah, that sounds pretentious, but it's how I make sense of it.

* [Love the metaphor]
    ~ friendship_level += 20
    ~ player_shared_personal += 1
    You: I love that. Gardeners in the storm. That's exactly what this feels like.
    -> meaning_metaphor_appreciation

* [Share your own meaning]
    ~ friendship_level += 30
    ~ player_shared_personal += 3
    ~ trust_moments += 2
    You: For me, it's about protection. Being the shield people don't know they need.
    -> meaning_personal_share

* [Ask if it's enough]
    ~ friendship_level += 20
    You: Is that enough? Does the meaning sustain you?
    -> meaning_sustainability_question

=== meaning_metaphor_appreciation ===
~ friendship_level += 25

Haxolottle: *smiles genuinely* Thank you. I've never actually said that out loud before. Thought it in my head, but never voiced it.

Haxolottle: It helps to have someone who gets it. Who understands why we do this despite the cost.

Haxolottle: We're gardeners together, then. Tending our little corner of the world against the storm.

~ friendship_level += 25
-> phase_3_hub

=== meaning_personal_share ===
~ friendship_level += 40
~ trust_moments += 3

Haxolottle: The shield people don't know they need. *nods slowly*

Haxolottle: That's beautiful. And harder than people realize. There's no recognition, no gratitude, no acknowledgment. The best outcome is that nothing happens and no one knows you prevented it.

Haxolottle: To do that work anyway—to be the shield without reward—that takes a special kind of integrity.

Haxolottle: You have it, Agent {player_name}. I've seen it in how you handle missions, the choices you make, the care you take to do this right.

Haxolottle: I'm honored to work with you.

~ friendship_level += 45
-> phase_3_hub

=== meaning_sustainability_question ===
~ friendship_level += 25
~ vulnerable_moments += 1

Haxolottle: *honest* Most days, yes. The meaning is enough. I come to work, support my agents, make a difference.

Haxolottle: But some days? It's hard. The weight accumulates. The secrecy grinds on you. The fear for people you care about becomes overwhelming.

Haxolottle: Those days, I remind myself: Regeneration. Like the axolotl. Let the damaged parts heal. Take a day off. Swim. Listen to rain sounds. Talk to people who understand.

*looks at you meaningfully*

Haxolottle: People like you. These conversations help more than you know. Sharing the weight makes it bearable.

~ friendship_level += 30
-> phase_3_hub

// ----------------
// Friendship Boundaries
// ----------------

=== friendship_boundaries ===
~ talked_friendship_boundaries = true
~ friendship_level += 35
~ conversations_had += 1
~ vulnerable_moments += 2

Haxolottle: Friendship within constraints. *laughs softly* That's what we have, isn't it?

Haxolottle: Protocol 47-Alpha says we can't know each other's real identities. Can't meet outside of work contexts. Can't integrate our lives beyond SAFETYNET.

Haxolottle: And yet... I consider you a friend. A real one. Someone I trust, respect, care about.

Haxolottle: Is that strange? To have genuine friendship with someone whose real name you don't know?

* [Say it is strange but real]
    ~ friendship_level += 30
    ~ player_shared_personal += 2
    You: It's strange. But it's real. I feel the same way about you.
    -> friendship_strange_but_real

* [Argue names don't matter]
    ~ friendship_level += 40
    ~ player_shared_personal += 3
    ~ trust_moments += 2
    You: Names are just labels. We know what matters—character, values, trust.
    -> friendship_names_dont_matter

* [Express frustration with constraints]
    ~ friendship_level += 35
    ~ vulnerable_moments += 1
    You: Honestly? Sometimes I wish we could just... be normal friends. No protocols.
    -> friendship_frustration

=== friendship_strange_but_real ===
~ friendship_level += 35
~ trust_moments += 1

Haxolottle: Thank you. Hearing you say that... it validates something I've been feeling but wasn't sure was mutual.

Haxolottle: We're friends. Within the constraints SAFETYNET requires, but friends nonetheless.

Haxolottle: Maybe it's actually better this way. We know each other through our choices, our values, our conversations. No preconceptions, no baggage from outside lives.

Haxolottle: Just two people who've been through challenges together and genuinely care about each other.

Haxolottle: I'll take that over a lot of "normal" friendships.

~ friendship_level += 40
-> phase_3_hub

=== friendship_names_dont_matter ===
~ friendship_level += 50
~ trust_moments += 3

Haxolottle: *clearly moved*

Haxolottle: You're right. Names are just... sounds. Labels. They don't capture who someone really is.

Haxolottle: I know who you are. I know you're someone who thinks carefully about ethics. Who handles pressure with grace. Who cares about doing this work correctly even when it's hard.

Haxolottle: I know you're someone I trust with my professional life and respect as a person.

Haxolottle: Your real name wouldn't tell me those things. Our conversations already have.

*quiet*

Haxolottle: You're a good friend, Agent {player_name}. Better than many I've had who knew every detail about me.

~ friendship_level += 55
-> phase_3_hub

=== friendship_frustration ===
~ friendship_level += 45
~ vulnerable_moments += 2

Haxolottle: Yeah. I wish that too.

Haxolottle: I'd like to grab coffee without it being a "secure location meeting." I'd like to talk about our lives without editing every sentence for information security.

Haxolottle: I'd like to know your actual name. Not because it changes who you are, but because it would feel... more complete. More real.

*pause*

Haxolottle: But Protocol 47-Alpha exists for good reasons. Compartmentalization protects us. If you're captured, you can't reveal what you don't know. If I'm compromised, your identity stays safe.

Haxolottle: The constraints are the price we pay for the work. And I still think the work is worth it.

Haxolottle: But I won't pretend the constraints don't hurt sometimes. They do. Especially with people I care about.

~ friendship_level += 50
-> phase_3_hub

// ----------------
// Future Dreams
// ----------------

=== future_dreams ===
~ talked_future_dreams = true
~ friendship_level += 30
~ conversations_had += 1

Haxolottle: Future dreams? *smiles wistfully*

Haxolottle: Sometimes I dream about retirement. Not young retirement—I've got years left in me. But eventual retirement.

Haxolottle: I'd like to live near water. Ocean, lake, river—something. Wake up, swim, read, tinker with electronics, just... exist without the weight.

Haxolottle: Maybe teach? Not SAFETYNET training—something totally different. Marine biology. Electronics repair. Something where I can share knowledge without the operational security.

Haxolottle: What about you? What do you dream about for after all this?

* [Share a dream]
    ~ friendship_level += 35
    ~ player_shared_personal += 3
    ~ trust_moments += 2
    You share a careful dream about your future—something that doesn't reveal identity but feels genuine.
    -> future_shared_dream

* [Say you haven't thought that far ahead]
    ~ friendship_level += 20
    You: Honestly, I'm so focused on now that I haven't thought about after.
    -> future_present_focused

* [Express uncertainty about leaving]
    ~ friendship_level += 30
    ~ vulnerable_moments += 1
    You: I'm not sure I could leave. This work becomes who you are.
    -> future_uncertain_leaving

=== future_shared_dream ===
~ friendship_level += 40
~ trust_moments += 2

Haxolottle: *listens carefully*

Haxolottle: That sounds wonderful. Really. I hope you get that.

Haxolottle: And you know what? I think you will. You're good at this work, which means you'll survive it. And survivors get to choose what comes next.

Haxolottle: Maybe someday we'll both be retired, living our quiet post-SAFETYNET lives. We still won't be able to reveal our real identities to each other—the protocol follows us forever.

Haxolottle: But maybe we could still talk sometimes. As the people we are now. Friends who've been through something together, even if we can't name all the details.

Haxolottle: I'd like that.

~ friendship_level += 45
-> phase_3_hub

=== future_present_focused ===
~ friendship_level += 25

Haxolottle: That's probably healthier, honestly. Focusing on the present, the current mission, what you can control right now.

Haxolottle: I only started thinking about future because I've been doing this long enough to see the end might actually happen. In your position, I was the same—all present, no future planning.

Haxolottle: Just... don't forget that there IS an after. This work doesn't have to be forever. That's important to remember on the hard days.

~ friendship_level += 25
-> phase_3_hub

=== future_uncertain_leaving ===
~ friendship_level += 35
~ vulnerable_moments += 1

Haxolottle: Yeah. I understand that completely.

Haxolottle: This work becomes your identity—literally, we adopt operational identities. Figuratively, it becomes who we are. What we do, how we think, who we associate with.

Haxolottle: Leaving means... who am I without this? Without the mission, the purpose, the meaning?

Haxolottle: I don't have a good answer. But I know that we're more than just our work. We have to be. Otherwise, the work consumes us completely.

Haxolottle: Axolotls don't just regenerate damaged parts—they can transform entirely when the environment requires it. Maybe we can too, when the time comes.

*slight smile*

Haxolottle: But that's future worry. For now, we have work that matters and each other. That's enough.

~ friendship_level += 40
-> phase_3_hub

// ----------------
// Hax Personal Loss (High Friendship)
// ----------------

=== hax_personal_loss ===
~ friendship_level += 50
~ vulnerable_moments += 3
~ hax_shared_loss = true
~ conversations_had += 1

Haxolottle: *quieter than usual*

Haxolottle: Can I tell you something personal? And I mean really personal, within the bounds of Protocol 47-Alpha.

* [Of course]
    ~ friendship_level += 20
    You: Of course. Always.
    -> hax_loss_tell

* [Only if you want to]
    ~ friendship_level += 15
    You: Only if you want to share. No pressure.
    -> hax_loss_tell

=== hax_loss_tell ===
~ friendship_level += 30
~ trust_moments += 3

Haxolottle: Before I joined SAFETYNET, I had someone in my life. Someone important. We were... close.

Haxolottle: When SAFETYNET recruited me, I had to make a choice. The relationship or the work. Protocol 47-Alpha meant I couldn't tell them what I really did. Couldn't share that part of my life.

Haxolottle: I tried to make it work. But you can't have a real relationship when you're lying about fundamental parts of your existence. Or not lying, exactly—just... omitting. Constantly.

Haxolottle: Eventually, they asked me to choose. And I chose SAFETYNET.

*pause*

Haxolottle: I don't know if it was the right choice. I know it was the choice I made. And I live with it.

Haxolottle: Some days I wonder who I'd be if I'd chosen differently. If I'd be happier. More complete.

*looks at you*

Haxolottle: But then I remember the work matters. The people we save, the systems we protect. And I have friends like you, who understand this life even if we can't know every detail.

Haxolottle: It's not the same. But it's something real.

* [Offer comfort]
    ~ friendship_level += 40
    ~ player_shared_personal += 2
    ~ trust_moments += 3
    You: That's a heavy loss. Thank you for trusting me with it.
    -> hax_loss_comfort

* [Share similar loss]
    ~ friendship_level += 50
    ~ player_shared_personal += 4
    ~ trust_moments += 4
    ~ vulnerable_moments += 2
    You: I've lost people too. Different circumstances, same weight.
    -> hax_loss_mutual

=== hax_loss_comfort ===
~ friendship_level += 45

Haxolottle: *slight smile through sadness*

Haxolottle: Thank you. For listening. For being someone I can share this with.

Haxolottle: The hardest part of Protocol 47-Alpha isn't the operational security—it's the emotional isolation. Having someone who gets it, even without all the details...

Haxolottle: That's invaluable.

~ friendship_level += 50
-> phase_3_hub

=== hax_loss_mutual ===
~ friendship_level += 60
~ trust_moments += 5

Haxolottle: *reaches out but stops—physical comfort violates distance protocols*

Haxolottle: I'm sorry. I'm so sorry you've carried that too.

Haxolottle: This work demands so much. Not just our skills, our time, our safety—but our connections. Our ability to be fully known.

Haxolottle: We sacrifice parts of ourselves so others don't have to. And most people will never know.

*quiet moment*

Haxolottle: I'm glad we found each other. In this weird, constrained, protocol-bound way. You're one of the few people who truly gets it.

Haxolottle: That means everything.

~ friendship_level += 65
-> phase_3_hub

// ===========================================
// PHASE 4: DEEP BOND (Missions 16+)
// Most vulnerable, questioning identity, lasting friendship
// ===========================================

=== phase_4_hub ===

{missions_together == 16:
    Haxolottle: Sixteen missions together. That's... we've built something real here, haven't we?
- else:
    Haxolottle: Hey, friend. And I mean that—friend. Want to talk?
}

+ {not talked_identity_burden and friendship_level >= 70} [Discuss the burden of hidden identity]
    -> identity_burden
+ {not talked_loneliness_secrecy and friendship_level >= 65} [Talk about loneliness of secrecy]
    -> loneliness_discussion
+ {not talked_real_name_temptation and friendship_level >= 75} [The temptation to share real names]
    -> name_temptation
+ {not talked_after_safetynet and friendship_level >= 70} [What happens when this ends?]
    -> after_safetynet
+ {not talked_genuine_friendship and friendship_level >= 80} [Acknowledge the friendship]
    -> friendship_acknowledgment
+ {friendship_level >= 85 and not hax_shared_secret_hobby} [They want to share something special]
    -> hax_secret_hobby
+ [These conversations mean a lot]
    -> conversation_end_phase4

// Phase 4 conversations would continue here with even deeper topics
// For brevity, I'll include a few key ones:

=== identity_burden ===
~ talked_identity_burden = true
~ friendship_level += 40
~ conversations_had += 1
~ vulnerable_moments += 2

Haxolottle: The burden of hidden identity... *heavy sigh*

Haxolottle: You know what's strange? I've been "Haxolottle" longer than I was... whoever I was before. The designation, the callsign, the role—it's more real than my legal identity now.

Haxolottle: When I'm in public, using my real name, I feel like I'm wearing a costume. This—Agent 0x99, handler, SAFETYNET operative—this is who I actually am.

Haxolottle: But that person is built on secrets. On information I can't share, experiences I can't discuss, work I can't acknowledge.

Haxolottle: Sometimes I wonder: if no one knows the real you, are you even real?

* [Affirm their reality]
    ~ friendship_level += 45
    ~ player_shared_personal += 3
    You: You're real to me. The person I know—Haxolottle, friend, handler—that's real.
    -> identity_affirmation

* [Share the same feeling]
    ~ friendship_level += 50
    ~ player_shared_personal += 4
    ~ trust_moments += 3
    You: I feel that too. My designation feels more real than my name sometimes.
    -> identity_shared_experience

=== identity_affirmation ===
~ friendship_level += 50
~ trust_moments += 2

Haxolottle: *visibly emotional*

Haxolottle: Thank you. That... that helps more than you know.

Haxolottle: You see me. Maybe not my legal name or my address or my full history, but you see who I actually am. My values, my thoughts, my struggles.

Haxolottle: That's more real than most people get, even without Protocol 47-Alpha.

~ friendship_level += 55
-> phase_4_hub

=== identity_shared_experience ===
~ friendship_level += 60
~ trust_moments += 4

Haxolottle: We're both becoming our codenames. Our operations identities are superseding our legal ones.

Haxolottle: That's both beautiful and sad. Beautiful because we've found purpose, identity, meaning. Sad because we're losing parts of ourselves in the process.

Haxolottle: But at least we're losing them together. At least there's someone else who understands.

~ friendship_level += 65
-> phase_4_hub

// ----------------
// Name Temptation
// ----------------

=== name_temptation ===
~ talked_real_name_temptation = true
~ friendship_level += 50
~ conversations_had += 1
~ vulnerable_moments += 3

Haxolottle: Can I be honest about something that probably violates the spirit if not the letter of Protocol 47-Alpha?

* [Always]
    ~ friendship_level += 20
    You: Always. You can tell me anything.
    -> name_temptation_reveal

=== name_temptation_reveal ===
~ friendship_level += 40

Haxolottle: I've been tempted to tell you my real name. So many times. Just... drop it in conversation. Let you know me completely.

Haxolottle: Not because it would change anything fundamental. You already know me. But because it would feel like a gift. Trusting you with the one thing I'm not supposed to share.

Haxolottle: I haven't. And I won't. Protocol exists for good reasons. But the temptation is there.

*pause*

Haxolottle: Have you felt that? The urge to just... tell me?

* [Admit the same temptation]
    ~ friendship_level += 60
    ~ player_shared_personal += 5
    ~ trust_moments += 4
    ~ vulnerable_moments += 2
    You: Yes. All the time. I want you to know who I really am.
    -> name_mutual_temptation

* [Say you've made peace with it]
    ~ friendship_level += 40
    You: I understand the urge, but I've made peace with the boundaries.
    -> name_peace_with_boundaries

=== name_mutual_temptation ===
~ friendship_level += 70
~ trust_moments += 5

Haxolottle: *quiet, meaningful moment*

Haxolottle: We both want to cross that line. And we both choose not to, because we respect the protocols that keep us safe.

Haxolottle: That's... that's actually more intimate than sharing names. We're choosing each other's safety over our own desire for complete connection.

Haxolottle: That's love, in a way. Not romantic—friendship love. Caring about someone enough to maintain boundaries that protect them.

*soft smile*

Haxolottle: So we'll keep our names. And we'll keep this friendship. And somehow, impossibly, it'll be enough.

~ friendship_level += 80
-> phase_4_hub

=== name_peace_with_boundaries ===
~ friendship_level += 45

Haxolottle: You're wiser than me, then. Or maybe just more disciplined.

Haxolottle: You're right, of course. The boundaries exist for reasons. And we can have real friendship within them.

Haxolottle: Thank you for that perspective. Helps me make peace with it too.

~ friendship_level += 50
-> phase_4_hub

// ----------------
// Genuine Friendship Acknowledgment
// ----------------

=== friendship_acknowledgment ===
~ talked_genuine_friendship = true
~ friendship_level += 60
~ conversations_had += 1

Haxolottle: I want to say something, and I want you to know I mean it completely.

Haxolottle: You're one of my closest friends. Maybe THE closest friend I have.

Haxolottle: I don't know your real name. I don't know where you live or where you came from. But I know who you are.

Haxolottle: I know you're brave and ethical and thoughtful. I know you carry weight for others. I know you care about doing right even when it's hard.

Haxolottle: And I know that when things are difficult, when I'm struggling, when the work feels too heavy—talking to you makes it bearable.

Haxolottle: That's friendship. Real, genuine friendship. Protocol 47-Alpha be damned.

* [Return the sentiment]
    ~ friendship_level += 80
    ~ player_shared_personal += 5
    ~ trust_moments += 5
    You: You're one of my closest friends too. This bond is real.
    -> friendship_mutual_acknowledgment

* [Express gratitude]
    ~ friendship_level += 70
    ~ trust_moments += 3
    You: That means everything to me. Thank you for being that person.
    -> friendship_gratitude

=== friendship_mutual_acknowledgment ===
~ friendship_level += 90
~ trust_moments += 6

Haxolottle: *genuinely emotional*

Haxolottle: Then we're doing something impossible. Being truly close to someone we can't fully know.

Haxolottle: Protocol says we can't share identities. But it doesn't say we can't share ourselves. And we have.

Haxolottle: Whatever happens—missions, careers, future—I want you to know this mattered. You matter. This friendship is real.

~ friendship_level += 100
-> phase_4_hub

=== friendship_gratitude ===
~ friendship_level += 75

Haxolottle: The gratitude is mutual, Agent {player_name}. Completely mutual.

Haxolottle: We found each other in this strange, secretive, protocol-bound world. And we built something real.

Haxolottle: That's not nothing. That's everything.

~ friendship_level += 80
-> phase_4_hub

// ----------------
// Secret Hobby Share (Very High Friendship)
// ----------------

=== hax_secret_hobby ===
~ friendship_level += 50
~ vulnerable_moments += 2
~ hax_shared_secret_hobby = true
~ conversations_had += 1

Haxolottle: Okay, I'm going to tell you something embarrassing. Something I've never told another SAFETYNET operative.

Haxolottle: Promise not to laugh?

* [Promise]
    You: I promise. Tell me.
    -> hax_hobby_reveal

=== hax_hobby_reveal ===
~ friendship_level += 40

Haxolottle: I... write poetry. Bad poetry, probably. But I write it.

Haxolottle: About the work, about the ocean, about regeneration and adaptation. About the weight we carry and the things we can't say.

Haxolottle: It's how I process everything I can't talk about. Can't share in therapy because of classification. Can't tell people in my life because of Protocol 47-Alpha.

Haxolottle: I write it down, and somehow that makes it bearable.

*embarrassed laugh*

Haxolottle: Axolotl metaphors in prose apparently aren't enough. I need them in verse too.

* [Ask to hear some]
    ~ friendship_level += 50
    ~ trust_moments += 4
    You: I'd love to hear some. If you're comfortable sharing.
    -> hax_poetry_share

* [Reveal your own hidden outlet]
    ~ friendship_level += 60
    ~ player_shared_personal += 5
    ~ trust_moments += 5
    You: I have a similar outlet. Something I've never shared with anyone here.
    -> secret_outlet_exchange

=== hax_poetry_share ===
~ friendship_level += 60
~ trust_moments += 4

Haxolottle: Really? You... okay.

*recites from memory*

Haxolottle: "The axolotl smiles in dark water, regenerating what the world has taken. We surface briefly, gather air, descend again to depths where names dissolve and only purpose remains."

*quiet*

Haxolottle: Told you it was bad. But it's honest.

~ friendship_level += 65
-> phase_4_hub

=== secret_outlet_exchange ===
~ friendship_level += 75
~ trust_moments += 6

Haxolottle: *leans forward with genuine interest*

Haxolottle: Tell me. Please.

You share your own creative outlet, your own way of processing the impossible weight.

Haxolottle: *listening with complete attention*

Haxolottle: That's beautiful. And meaningful. And it makes perfect sense.

Haxolottle: We're both finding ways to be human in inhuman circumstances. To process weight that can't be spoken. To create beauty from burden.

*warm smile*

Haxolottle: I'm honored you shared that with me. Truly.

~ friendship_level += 85
-> phase_4_hub

// ===========================================
// CONVERSATION ENDS
// ===========================================

=== conversation_end_phase3 ===

{friendship_level >= 70:
    Haxolottle: These conversations... they keep me grounded. Thank you for being real with me.
- else:
    Haxolottle: Thanks for talking. Back to the mission.
}

#exit_conversation
-> END

=== conversation_end_phase4 ===

{friendship_level >= 90:
    Haxolottle: You know I care about you, right? Within all the protocols and boundaries—genuine care.
- friendship_level >= 70:
    Haxolottle: Thank you for these conversations. They mean more than protocol allows me to say.
- else:
    Haxolottle: Good talk. Stay safe out there.
}

#exit_conversation
-> END
