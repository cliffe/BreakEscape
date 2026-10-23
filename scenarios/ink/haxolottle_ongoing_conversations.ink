// ===========================================
// HAXOLOTTLE ONGOING CONVERSATIONS
// Break Escape Universe
// ===========================================
// Progressive friendship-building conversations with Agent 0x99 "Haxolottle"
// Drip-fed over multiple missions to develop genuine connection
// Respects Protocol 47-Alpha: No real identity disclosure
// ===========================================

// ===========================================
// PERSISTENT VARIABLES
// These MUST be saved/loaded between game sessions
// Your game engine must persist these across ALL missions
// ===========================================

VAR npc_haxolottle_influence = 0         // PERSISTENT - Overall relationship depth (0-100)
VAR npc_haxolottle_conversations_had = 0        // PERSISTENT - Total personal conversations
VAR npc_haxolottle_trust_moments = 0            // PERSISTENT - Times player shared something personal
VAR npc_haxolottle_humor_shared = 0             // PERSISTENT - Funny moments experienced together
VAR npc_haxolottle_vulnerable_moments = 0       // PERSISTENT - Times either shared something difficult
VAR npc_haxolottle_player_shared_personal = 0   // PERSISTENT - Count of player vulnerable moments

// Topic tracking - ALL PERSISTENT (never reset)
VAR npc_haxolottle_talked_hobbies_general = false           // PERSISTENT
VAR npc_haxolottle_talked_axolotl_obsession = false         // PERSISTENT
VAR npc_haxolottle_talked_music_taste = false               // PERSISTENT
VAR npc_haxolottle_talked_coffee_preferences = false        // PERSISTENT
VAR npc_haxolottle_talked_stress_management = false         // PERSISTENT
VAR npc_haxolottle_talked_philosophy_change = false         // PERSISTENT
VAR npc_haxolottle_talked_handler_life = false              // PERSISTENT
VAR npc_haxolottle_talked_field_nostalgia = false           // PERSISTENT
VAR npc_haxolottle_talked_weird_habits = false              // PERSISTENT
VAR npc_haxolottle_talked_favorite_operations = false       // PERSISTENT
VAR npc_haxolottle_talked_fears_anxieties = false           // PERSISTENT
VAR npc_haxolottle_talked_what_if_different = false         // PERSISTENT
VAR npc_haxolottle_talked_meaning_work = false              // PERSISTENT
VAR npc_haxolottle_talked_friendship_boundaries = false     // PERSISTENT
VAR npc_haxolottle_talked_future_dreams = false             // PERSISTENT
VAR npc_haxolottle_talked_identity_burden = false           // PERSISTENT
VAR npc_haxolottle_talked_loneliness_secrecy = false        // PERSISTENT
VAR npc_haxolottle_talked_real_name_temptation = false      // PERSISTENT
VAR npc_haxolottle_talked_after_safetynet = false           // PERSISTENT
VAR npc_haxolottle_talked_genuine_friendship = false        // PERSISTENT

// Deep personal reveals - PERSISTENT
VAR npc_haxolottle_shared_loss = false           // PERSISTENT
VAR npc_haxolottle_shared_doubt = false          // PERSISTENT
VAR npc_haxolottle_shared_secret_hobby = false   // PERSISTENT

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
// This determines which conversation is available based on progression

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
// PHASE 1: GETTING TO KNOW YOU (Missions 1-5)
// Light, friendly, establishing rapport
// ===========================================

=== phase_1_hub ===

{
    - total_missions_completed == 1:
        Haxolottle: So, we've got some downtime. Want to chat about non-work stuff? Per Regulation 847, personal conversation is encouraged for psychological wellbeing.
    - else:
        Haxolottle: Got a moment? I could use a break from staring at security feeds.
}

+ {not npc_haxolottle_talked_hobbies_general} [Ask what they do for fun]
    -> hobbies_general
+ {not npc_haxolottle_talked_axolotl_obsession} [Ask about the axolotl thing]
    -> axolotl_deep_dive
+ {not npc_haxolottle_talked_music_taste} [Ask what music they listen to]
    -> music_discussion
+ {not npc_haxolottle_talked_coffee_preferences and npc_haxolottle_talked_hobbies_general} [Talk about coffee/tea preferences]
    -> coffee_chat
+ {not npc_haxolottle_talked_stress_management and npc_haxolottle_influence >= 15} [Ask how they handle stress]
    -> stress_management
+ [That's all for now]
    -> conversation_end

// ----------------
// Hobbies - General
// ----------------

=== hobbies_general ===
~ npc_haxolottle_talked_hobbies_general = true
~ npc_haxolottle_influence += 5
#influence_gained:5
~ npc_haxolottle_conversations_had += 1

Haxolottle: What do I do for fun? Good question. Let's see...

Haxolottle: I read a lot—mostly sci-fi and nature books. There's something relaxing about reading about chaotic fictional universes when you spend your days dealing with chaotic real ones.

Haxolottle: I also swim. Not competitively or anything, just... swimming. There's a meditative quality to it. Plus, you know, axolotls are aquatic creatures, so there's thematic consistency.

*grins*

Haxolottle: And I tinker with old electronics. Pull apart vintage computers, repair them, sometimes just see how they work. It's methodical. Soothing. Unlike field operations where everything is chaos and improvisation.

* [Share that you also read]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    ~ npc_haxolottle_player_shared_personal += 1
    You: I'm a reader too. What kind of sci-fi?
    -> hobbies_scifi_followup

* [Mention you've never been good at swimming]
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    You: I've never been much of a swimmer. More of a land-based person.
    -> hobbies_swimming_followup

* [Ask about the electronics tinkering]
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    You: Electronics tinkering? That's an interesting hobby for someone in our line of work.
    -> hobbies_electronics_followup

=== hobbies_scifi_followup ===
~ npc_haxolottle_influence += 5
#influence_gained:5

Haxolottle: Oh, you read sci-fi? Nice! I'm partial to the stuff that explores emergence and complexity—you know, how simple rules create complex systems.

Haxolottle: *Permutation City*, *Blindsight*, anything by Ted Chiang. Stories about consciousness, identity, what makes us who we are when everything else is stripped away.

Haxolottle: Probably why I ended up in intelligence work, honestly. We're constantly dealing with emergent threats, complex systems, questions of identity and deception.

Haxolottle: What about you? What kind of stories do you gravitate toward?

* [Mention you like cyberpunk]
    You: Cyberpunk, mostly. The whole corporate dystopia thing feels... relevant.
    Haxolottle: *laughs* Yeah, we're kind of living it. Except the corporations aren't our enemy—ENTROPY is. Different dystopia, same aesthetic.
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    -> phase_1_hub

* [Say you prefer non-fiction]
    You: Actually, I'm more of a non-fiction person. Technical books, security research.
    Haxolottle: Ah, the pragmatist. Fair enough. Though I'd argue our job is weird enough to count as science fiction.
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    -> phase_1_hub

* [Keep it vague to protect identity]
    You: Different things, depending on mood.
    Haxolottle: Keeping it mysterious. I respect that. Protocol 47-Alpha and all.
    ~ npc_haxolottle_influence += 2
#influence_gained:2
    -> phase_1_hub

=== hobbies_swimming_followup ===

Haxolottle: That's fair. Swimming isn't for everyone. The whole "put your face in water and breathe at specific intervals" thing is surprisingly hard.

Haxolottle: I didn't learn until I was an adult, actually. Taught myself after joining SAFETYNET. Figured if axolotls can do it, so can I.

*laughs*

Haxolottle: Plus, it's one of the few activities where I can guarantee I'm not carrying surveillance devices. Hard to bug a swimsuit.

~ npc_haxolottle_influence += 3
#influence_gained:3
-> phase_1_hub

=== hobbies_electronics_followup ===

Haxolottle: You'd think it'd be busman's holiday—working with electronics all day, then doing it for fun. But there's a difference.

Haxolottle: At work, I'm using electronics to surveil, to penetrate systems, to enable operations. It's adversarial. You versus the machine.

Haxolottle: At home? I'm fixing things. Bringing dead hardware back to life. It's... restorative. Like axolotl regeneration but for circuit boards.

*slight smile*

Haxolottle: Plus, there's satisfaction in making a thirty-year-old computer boot up again. Persistence over entropy. Both kinds of entropy.

~ npc_haxolottle_influence += 5
#influence_gained:5
-> phase_1_hub

// ----------------
// Axolotl Deep Dive
// ----------------

=== axolotl_deep_dive ===
~ npc_haxolottle_talked_axolotl_obsession = true
~ npc_haxolottle_influence += 8
#influence_gained:8
~ npc_haxolottle_conversations_had += 1

Haxolottle: Ah, you want the full story behind the axolotl obsession?

Haxolottle: Okay, so—Operation Regenerate. I mentioned it before. I was stuck in a compromised position for seventy-two hours, maintaining a cover identity while the person I was impersonating was RIGHT THERE.

Haxolottle: Couldn't leave. Couldn't fight. Couldn't call for extraction. Could only adapt. And while I was stuck, the only reading material available was biology textbooks.

Haxolottle: Found this section on axolotls—*Ambystoma mexicanum*. These amazing creatures that can regenerate entire limbs, organs, even parts of their brain and spinal cord.

* [Ask how that's relevant to the operation]
    You: How did that help with the operation?
    -> axolotl_operation_connection

* [Ask about the biology]
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    You: That's incredible. How do they do that?
    -> axolotl_biology_detail

* [Make a joke]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    ~ npc_haxolottle_humor_shared += 1
    You: So you're saying you identified with a salamander?
    -> axolotl_joke_response

=== axolotl_operation_connection ===
~ npc_haxolottle_influence += 5
#influence_gained:5

Haxolottle: It gave me a framework. See, I'd lost my original cover story—that identity was "severed" when the real person appeared. Dead. Gone.

Haxolottle: But I could regenerate a NEW identity. Different cover, same core. Adapt to the changed environment. Become what the situation needed.

Haxolottle: That's what axolotls do—they don't just heal, they adapt. They can exist in multiple states. Larval form, adult form, something in between.

Haxolottle: In that moment, I stopped being the person I was impersonating and became SAFETYNET internal security running a loyalty test. New limb. Same creature.

Haxolottle: The metaphor stuck. Now every operation that goes sideways, I think: What would an axolotl do? And the answer is always: regenerate, adapt, survive.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_1_hub

=== axolotl_biology_detail ===
~ npc_haxolottle_influence += 5
#influence_gained:5

Haxolottle: *lights up with enthusiasm*

Haxolottle: Oh, it's fascinating! They have this incredible ability to regrow complex structures perfectly. Not scar tissue—actual functional regeneration.

Haxolottle: They can regrow limbs in weeks. If you damage their brain, they can regenerate neurons. Heart tissue, spinal cord, even parts of their eyes.

Haxolottle: And here's the really cool part—they're neotenic. They can reach sexual maturity while remaining in their larval form. They don't HAVE to metamorphose into adult salamanders. They can stay as they are and still be complete.

Haxolottle: It's like... they have options. Paths. They're not locked into one form of existence.

*realizes they're geeking out*

Haxolottle: Sorry, I can talk about this for hours. The point is: regeneration, adaptation, flexibility. That's what got me through that operation and a lot of others.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_1_hub

=== axolotl_joke_response ===
~ npc_haxolottle_influence += 8
#influence_gained:8
~ npc_haxolottle_humor_shared += 1

Haxolottle: *laughs*

Haxolottle: I mean, when you put it that way, it sounds ridiculous. "Agent develops deep emotional connection with aquatic salamander metaphor."

Haxolottle: But yes. I absolutely identified with a salamander. And I stand by it.

Haxolottle: We're both adaptable. We both thrive in chaotic environments. We both look kind of weird but are strangely effective.

*grins*

Haxolottle: Plus, they smile. Permanently. Look up pictures—axolotls have these adorable smiling faces. Hard to be stressed when you're thinking about a smiling salamander.

Haxolottle: You're laughing, but I'm serious. The metaphor has kept me sane for years. Sometimes you need something absurd to hold onto in this work.

~ npc_haxolottle_influence += 10
#influence_gained:10
~ npc_haxolottle_trust_moments += 1
-> phase_1_hub

// ----------------
// Music Discussion
// ----------------

=== music_discussion ===
~ npc_haxolottle_talked_music_taste = true
~ npc_haxolottle_influence += 5
#influence_gained:5
~ npc_haxolottle_conversations_had += 1

Haxolottle: Music? Oh, I have eclectic taste. Probably too eclectic.

Haxolottle: For work—monitoring operations, reviewing intel—I listen to ambient stuff. Brian Eno, Aphex Twin's ambient works, that kind of thing. No lyrics, minimal disruption, just texture.

Haxolottle: For workouts or when I need energy, I go full electronic. Techno, drum and bass, synthwave. Loud, propulsive, gets the heart rate up.

Haxolottle: And then sometimes... *looks slightly embarrassed* ...sometimes I listen to nature sounds. Ocean waves. Rain. Thunderstorms.

* [Say you also like ambient music]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    ~ npc_haxolottle_player_shared_personal += 1
    You: Ambient music is great for concentration. What's your favorite?
    -> music_ambient_detail

* [Admit you prefer silence while working]
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    You: I actually prefer silence when I'm concentrating.
    -> music_silence_response

* [Tease them about nature sounds]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    ~ npc_haxolottle_humor_shared += 1
    You: Nature sounds? That's adorably wholesome for a spy.
    -> music_nature_tease

=== music_ambient_detail ===
~ npc_haxolottle_influence += 5
#influence_gained:5

Haxolottle: Oh, good taste! For concentration, I keep coming back to Eno's *Music for Airports*. It's designed to be ignorable but interesting—perfect for background.

Haxolottle: There's also this artist Grouper—really ethereal, dreamlike stuff. Good for late-night shifts when you need to stay calm but alert.

Haxolottle: And Boards of Canada for when I want something slightly more textured. Nostalgic without being distracting.

Haxolottle: What about you? Any favorites?

* [Mention specific artists (safe to share)]
    You: I'm into [vague genre description]. Keeps me focused.
    Haxolottle: Nice. I might check that out during my next long monitoring session.
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    -> phase_1_hub

* [Keep it vague]
    You: Different things depending on the task.
    Haxolottle: Adaptive playlist for adaptive operations. I like it.
    ~ npc_haxolottle_influence += 2
#influence_gained:2
    -> phase_1_hub

=== music_silence_response ===

Haxolottle: That's valid. Some people work better in complete silence. Brain needs quiet to process.

Haxolottle: I can't do it, personally. Total silence makes me too aware of my own thoughts. Need something to fill the space.

Haxolottle: But everyone's different. That's why we have noise-cancelling headphones in the equipment list—Section 8, Article 4.

~ npc_haxolottle_influence += 3
#influence_gained:3
-> phase_1_hub

=== music_nature_tease ===
~ npc_haxolottle_influence += 8
#influence_gained:8
~ npc_haxolottle_humor_shared += 1

Haxolottle: *laughs* Okay, yes, I know how it sounds. "Elite SAFETYNET handler unwinds with gentle rain sounds."

Haxolottle: But hear me out—after spending hours listening to encrypted communications, network traffic, and agents whispering in server rooms, sometimes I just want to hear water hitting leaves.

Haxolottle: It's non-human. Non-threatening. No hidden meaning, no encryption, no subtext. Just... weather.

Haxolottle: Plus, there's something soothing about storms specifically. All that chaos and energy, but I'm safe inside listening to it. Control over the uncontrollable, in a way.

*grins*

Haxolottle: You can judge me, but I won't stop. I have a whole collection. "Thunderstorm in Forest," "Ocean Waves at Night," "Heavy Rain on Tent." It's a whole genre.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_1_hub

// ----------------
// Coffee Preferences
// ----------------

=== coffee_chat ===
~ npc_haxolottle_talked_coffee_preferences = true
~ npc_haxolottle_influence += 4
#influence_gained:4
~ npc_haxolottle_conversations_had += 1

Haxolottle: Coffee preferences? Oh, we're getting into the important questions now.

Haxolottle: I'm a tea person, actually. Coffee makes me jittery in a way that's not great when you're trying to calmly talk an agent through a crisis.

Haxolottle: Specifically, I drink green tea. Jasmine green tea when I can get it. Enough caffeine to stay alert, not so much that I'm vibrating.

Haxolottle: Dr. Chen thinks I'm weird for it. They survive on energy drinks and what I'm pretty sure is just pure espresso.

* [Say you're also a tea drinker]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    ~ npc_haxolottle_player_shared_personal += 1
    You: Tea for me too. Coffee's too harsh.
    -> coffee_tea_solidarity

* [Defend coffee]
    ~ npc_haxolottle_influence += 3
#influence_gained:3
    You: Coffee is essential. I don't trust tea to keep me functional.
    -> coffee_defense

* [Ask about the axolotl mug]
    ~ npc_haxolottle_influence += 5
#influence_gained:5
    You: Is that axolotl mug I keep seeing in video calls yours?
    -> coffee_mug_discussion

=== coffee_tea_solidarity ===
~ npc_haxolottle_influence += 5
#influence_gained:5

Haxolottle: A fellow tea person! Excellent. We're a minority in SAFETYNET.

Haxolottle: There's this break room on level 3 that has actually decent loose-leaf tea. Not that pre-bagged stuff. Real tea.

Haxolottle: If you ever need to decompress after a mission, find that break room. It's quieter than the others, better tea, and the window actually shows sky instead of concrete wall.

Haxolottle: Consider it insider knowledge. Handler privilege.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_1_hub

=== coffee_defense ===

Haxolottle: Hey, no judgment! Coffee works for a lot of people. Dr. Chen would probably collapse without it.

Haxolottle: Different metabolisms, different needs. That's the thing about SAFETYNET—we accommodate diverse operational styles.

Haxolottle: As long as you're alert and functional, I don't care if you're powered by coffee, tea, energy drinks, or pure spite.

~ npc_haxolottle_influence += 3
#influence_gained:3
-> phase_1_hub

=== coffee_mug_discussion ===
~ npc_haxolottle_influence += 8
#influence_gained:8
~ npc_haxolottle_humor_shared += 1

Haxolottle: *laughs* You noticed! Yes, that's mine. Got it custom-made.

Haxolottle: It says "Keep Calm and Regenerate" with a little smiling axolotl. I use it for video calls specifically because it makes people ask about it.

Haxolottle: Good conversation starter. Also a subtle reminder to myself: when things go wrong, adapt and regenerate. The mug is both whimsical and functional.

Haxolottle: I have three of them, actually. One for the office, one for home, one backup for when I inevitably drop one.

Haxolottle: Director Netherton pretends not to notice it in briefings, but I've caught him almost smiling at it once. Progress.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_1_hub

// ----------------
// Stress Management
// ----------------

=== stress_management ===
~ npc_haxolottle_talked_stress_management = true
~ npc_haxolottle_influence += 10
#influence_gained:10
~ npc_haxolottle_conversations_had += 1
~ npc_haxolottle_vulnerable_moments += 1

Haxolottle: How do I handle stress? That's... a good question. And kind of personal, but I'll answer.

Haxolottle: The swimming helps. The reading. The music. All of that creates space between me and the work.

Haxolottle: But honestly? The hardest part is when agents are in danger and I can only watch. I can advise, I can provide information, but you're the one in the facility. You're the one at risk.

Haxolottle: I've had agents get hurt. I've had operations go wrong despite everything we planned. That weight... it doesn't go away.

* [Thank them for being honest]
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    ~ npc_haxolottle_player_shared_personal += 1
    You: Thank you for trusting me with that. It helps to know you feel it too.
    -> stress_honest_response

* [Share your own stress management]
    ~ npc_haxolottle_influence += 12
#influence_gained:12
    ~ npc_haxolottle_player_shared_personal += 2
    ~ npc_haxolottle_trust_moments += 1
    You: I feel that pressure too. From a different angle, but still there.
    -> stress_mutual_understanding

* [Ask how they cope with the weight]
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    You: How do you keep going when it feels like too much?
    -> stress_coping_methods

=== stress_honest_response ===
~ npc_haxolottle_influence += 10
#influence_gained:10

Haxolottle: Of course. We're in this together, Agent. I'm not just a voice on comms—I'm a person who cares about whether you come back safe.

Haxolottle: The handbook talks about professional distance, but Regulation 299 says friendships are valuable for operational effectiveness. I choose to interpret that broadly.

Haxolottle: You're not just an asset to me. You're a colleague. Maybe even a friend. And I want you to succeed and be okay.

~ npc_haxolottle_influence += 15
#influence_gained:15
~ npc_haxolottle_trust_moments += 1
-> phase_1_hub

=== stress_mutual_understanding ===
~ npc_haxolottle_influence += 15
#influence_gained:15
~ npc_haxolottle_trust_moments += 2

Haxolottle: Yeah. Different angles, same weight. You're worried about getting caught, about the mission failing, about making the wrong call in the moment.

Haxolottle: I'm worried about giving you bad information, about not seeing something that could save you, about sending you into situations that are more dangerous than we thought.

Haxolottle: We both carry it. Different burdens, but we carry them for each other.

*pause*

Haxolottle: That's why the axolotl thing matters, I think. Regeneration isn't just physical. It's emotional too. We get hurt, we recover, we keep going.

Haxolottle: And we do it together. That makes it bearable.

~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_vulnerable_moments += 1
-> phase_1_hub

=== stress_coping_methods ===
~ npc_haxolottle_influence += 10
#influence_gained:10

Haxolottle: Honestly? I remind myself why we do this. ENTROPY is real. The threats are real. The people we protect—even though they don't know we exist—they're real.

Haxolottle: Every operation you complete successfully is infrastructure that doesn't go down. Data that doesn't get stolen. Systems that keep working.

Haxolottle: The weight is heavy because the work matters. If it was easy, if it didn't matter, there wouldn't be weight.

Haxolottle: And... *slight smile* ...I have my ridiculous axolotl metaphors. When things get dark, I think about something absurd and resilient, and it helps.

~ npc_haxolottle_influence += 12
#influence_gained:12
-> phase_1_hub

// ===========================================
// PHASE 2: DEEPENING FRIENDSHIP (Missions 6-10)
// More personal, some vulnerability, genuine connection
// ===========================================

=== phase_2_hub ===

{
    - total_missions_completed == 6:
        Haxolottle: We've been working together for a while now. Starting to feel like a real partnership. Got time to talk?
    - else:
        Haxolottle: Hey, Agent. Want to chat for a bit? I could use a break from the technical stuff.
}

+ {not npc_haxolottle_talked_philosophy_change} [Ask how their philosophy has changed over the years]
    -> philosophy_evolution
+ {not npc_haxolottle_talked_handler_life} [Ask what handler life is really like]
    -> handler_reality
+ {not npc_haxolottle_talked_field_nostalgia and npc_haxolottle_influence >= 30} [Ask if they miss field work]
    -> field_nostalgia
+ {not npc_haxolottle_talked_weird_habits} [Talk about weird habits you've developed]
    -> weird_habits_discussion
+ {not npc_haxolottle_talked_favorite_operations and npc_haxolottle_influence >= 35} [Ask about their favorite operations]
    -> favorite_operations
+ {npc_haxolottle_influence >= 40 and not npc_haxolottle_shared_loss} [Notice they seem different today]
    -> hax_difficult_day
+ [That's all for now]
    -> conversation_end

// ----------------
// Philosophy Evolution
// ----------------

=== philosophy_evolution ===
~ npc_haxolottle_talked_philosophy_change = true
~ npc_haxolottle_influence += 10
#influence_gained:10
~ npc_haxolottle_conversations_had += 1

Haxolottle: How has my philosophy changed? *laughs softly* That's a heavier question than you might think.

Haxolottle: When I started, I was idealistic. Black and white thinking. SAFETYNET good, ENTROPY bad. We're heroes protecting people.

Haxolottle: Fifteen years later... it's complicated. We're still doing important work. ENTROPY is still a genuine threat. But the methods, the gray areas, the cost...

*pause*

Haxolottle: I've seen good people do questionable things for good reasons. I've seen ENTROPY operatives who were manipulated or coerced. I've made calls that haunt me.

Haxolottle: The philosophy that's stuck is: Do the work as ethically as you can within impossible constraints. Protect people. Try not to become the thing you're fighting.

* [Express agreement]
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    ~ npc_haxolottle_player_shared_personal += 1
    You: I've been thinking about that too. The gray areas are... uncomfortable.
    -> philosophy_gray_areas

* [Ask what call haunts them most]
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_vulnerable_moments += 1
    You: Is there one decision that still bothers you?
    -> philosophy_haunting_decision

* [Offer simpler perspective]
    You: Sometimes I try to focus on the immediate good we do. Easier than the big picture.
    -> philosophy_immediate_good

=== philosophy_gray_areas ===
~ npc_haxolottle_influence += 15
#influence_gained:15
~ npc_haxolottle_trust_moments += 1

Haxolottle: Yeah. Uncomfortable is the word. We're essentially breaking laws under authorization that's classified, targeting people who might be criminals or might be victims.

Haxolottle: Protocol 47-Alpha means we don't even really know each other. I don't know your real name. You don't know mine. We're friends who can't fully be friends.

Haxolottle: But you know what? The fact that you're thinking about it, questioning it, being uncomfortable—that's good. That means you haven't become numb to it.

Haxolottle: The day we stop feeling uncomfortable with the gray areas is the day we've gone too far.

~ npc_haxolottle_influence += 15
#influence_gained:15
-> phase_2_hub

=== philosophy_haunting_decision ===
~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_vulnerable_moments += 2
~ npc_haxolottle_shared_doubt = true

Haxolottle: *long pause*

Haxolottle: Yeah. There is.

Haxolottle: Five years ago, I had an agent deep in an ENTROPY cell. They found evidence of a major operation, but extracting them would blow their cover and lose the intelligence.

Haxolottle: I advised them to stay. Complete the intelligence gathering. The op was time-sensitive.

Haxolottle: They stayed. Got the intelligence. We stopped the attack. But they were... they were hurt. Badly. Because I asked them to stay when I could have pulled them out.

*quieter*

Haxolottle: They recovered. They're still with SAFETYNET. But I dream about making a different call. Pulling them out. Choosing the person over the mission.

Haxolottle: And I don't know if I would. If I could do it again, with the same information... I might make the same call. That's what haunts me.

* [Offer comfort]
    ~ npc_haxolottle_influence += 20
#influence_gained:20
    ~ npc_haxolottle_trust_moments += 2
    You: You made the best call you could with what you knew. That agent knew the risks.
    -> philosophy_comfort_response

* [Share something personal]
    ~ npc_haxolottle_influence += 25
#influence_gained:25
    ~ npc_haxolottle_player_shared_personal += 3
    ~ npc_haxolottle_trust_moments += 2
    You: I carry similar weight. We all do. It doesn't make it easier, but you're not alone in it.
    -> philosophy_shared_burden

=== philosophy_comfort_response ===
~ npc_haxolottle_influence += 15
#influence_gained:15

Haxolottle: *slight smile* Thank you. I know that, intellectually. Regulation 911—mission objectives sometimes outweigh agent safety when lives are at stake.

Haxolottle: Doesn't make it easier. But it helps to hear it from someone who understands. Someone who's been there.

Haxolottle: You're a good person, Agent {player_name()}. I'm glad we're working together.

~ npc_haxolottle_influence += 15
#influence_gained:15
-> phase_2_hub

=== philosophy_shared_burden ===
~ npc_haxolottle_influence += 25
#influence_gained:25
~ npc_haxolottle_trust_moments += 3

Haxolottle: *looks genuinely touched*

Haxolottle: Thank you. Really. This work can be incredibly isolating. Protocol 47-Alpha, the secrecy, the decisions we can't talk about with anyone outside SAFETYNET...

Haxolottle: Having someone who gets it—who carries the same weight even if it's different details—that matters more than you know.

Haxolottle: I wish we could grab coffee like normal colleagues. Talk about this stuff without codenames and compartmentalization. But we work with what we have.

Haxolottle: And what we have is this. Honest conversations within the boundaries we're given. That's real friendship, I think. Even with the constraints.

~ npc_haxolottle_influence += 30
#influence_gained:30
-> phase_2_hub

=== philosophy_immediate_good ===
~ npc_haxolottle_influence += 8
#influence_gained:8

Haxolottle: That's a healthy approach. Zoom in on what you can control, the immediate impact. Today's mission. This operation. This prevented attack.

Haxolottle: The big picture can overwhelm you if you let it. Better to focus on the tangible good.

Haxolottle: That's sustainable. I should probably do more of that myself.

~ npc_haxolottle_influence += 8
#influence_gained:8
-> phase_2_hub

// ----------------
// Handler Reality
// ----------------

=== handler_reality ===
~ npc_haxolottle_talked_handler_life = true
~ npc_haxolottle_influence += 12
#influence_gained:12
~ npc_haxolottle_conversations_had += 1

Haxolottle: Handler life? It's weird. I sit in a comfortable office with good tea and multiple monitors, while you're crawling through server rooms and dodging security.

Haxolottle: From the outside, it looks cushy. Safe. Low-risk.

Haxolottle: From the inside? I'm watching you take risks I used to take. Providing advice that could be wrong. Making calls that affect whether you get caught.

Haxolottle: And when things go wrong, I can only watch. I can't run in and help. Can't pull you out physically. Just... talk. Provide information. Hope it's enough.

* [Say you appreciate having them there]
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_player_shared_personal += 1
    You: Your voice on comms makes a huge difference. I'm never alone out there.
    -> handler_appreciation

* [Ask if they'd go back to field work]
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    You: Would you ever go back to field operations?
    -> handler_field_return_question

* [Acknowledge the invisible stress]
    ~ npc_haxolottle_influence += 12
#influence_gained:12
    You: That sounds exhausting in a completely different way than field work.
    -> handler_stress_acknowledgment

=== handler_appreciation ===
~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_trust_moments += 1

Haxolottle: *clearly moved*

Haxolottle: That... thank you. Sincerely. Sometimes I wonder if I'm actually helping or just providing running commentary while you do the real work.

Haxolottle: Knowing it makes a difference—that you feel less alone—that's why I do this. That's the whole point of the handler role.

Haxolottle: We're a team. You're my eyes and hands in the field. I'm your strategic perspective and support system. Neither of us succeeds without the other.

~ npc_haxolottle_influence += 20
#influence_gained:20
-> phase_2_hub

=== handler_field_return_question ===
~ npc_haxolottle_influence += 12
#influence_gained:12

Haxolottle: *considers carefully*

Haxolottle: Honestly? I don't think so. I miss aspects of it—the adrenaline, the direct action, the immediate satisfaction of completing an objective.

Haxolottle: But I burned out. Eight years of that intensity took a toll. I wasn't making good decisions anymore. Too stressed, too paranoid, too reactive.

Haxolottle: Transitioning to handler was regeneration. Different work, same mission. Using my experience to help others succeed rather than pushing myself to breaking.

Haxolottle: Plus, I'm better at this. Supporting multiple agents, seeing the strategic picture, staying calm under pressure. My field skills were good. My handler skills are better.

~ npc_haxolottle_influence += 12
#influence_gained:12
-> phase_2_hub

=== handler_stress_acknowledgment ===
~ npc_haxolottle_influence += 15
#influence_gained:15

Haxolottle: It really is. Different kind of exhaustion.

Haxolottle: Field work is immediate stress—heart pounding, decisions in seconds, physical danger. Intense but contained.

Haxolottle: Handler work is sustained stress—monitoring multiple operations, slow-burn anxiety, carrying the weight of others' safety for hours or days.

Haxolottle: I end the day mentally drained in a way field work never did. But also with a sense that I helped multiple people succeed rather than just completing one mission myself.

Haxolottle: Trade-offs. Everything in SAFETYNET is trade-offs.

~ npc_haxolottle_influence += 15
#influence_gained:15
-> phase_2_hub

// ----------------
// Field Nostalgia
// ----------------

=== field_nostalgia ===
~ npc_haxolottle_talked_field_nostalgia = true
~ npc_haxolottle_influence += 15
#influence_gained:15
~ npc_haxolottle_conversations_had += 1

Haxolottle: Do I miss field work? Sometimes. Mostly small moments, not the overall experience.

Haxolottle: I miss the satisfaction of bypassing a security system yourself. That moment when the lock clicks or the system grants access—there's a little dopamine rush you don't get from watching someone else do it.

Haxolottle: I miss the problem-solving in real-time. When you're in the field, everything is immediate. You see the obstacle, you think, you act. There's clarity in that.

Haxolottle: And honestly? I miss the simplicity. One mission, one objective, handle it and move on. As a handler, I'm juggling multiple agents, operations, responsibilities. It's more complex.

* [Ask what they don't miss]
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    You: What don't you miss about it?
    -> field_nostalgia_negative

* [Share what you love about field work]
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_player_shared_personal += 1
    You: I feel that rush too. That moment when everything clicks.
    -> field_nostalgia_shared_joy

* [Ask about their most memorable infiltration]
    ~ npc_haxolottle_influence += 12
#influence_gained:12
    You: What's your most memorable field operation?
    -> field_nostalgia_memorable_op

=== field_nostalgia_negative ===
~ npc_haxolottle_influence += 15
#influence_gained:15

Haxolottle: *laughs* Oh, plenty. The fear, for one. That sustained low-level anxiety of maintaining cover, wondering if today's the day someone sees through it.

Haxolottle: The loneliness. Deep cover operations mean you can't talk to anyone real. Everyone you interact with is either part of the mission or someone you're deceiving. It's isolating.

Haxolottle: And the physical toll. I'm not young anymore. Eight years of irregular sleep, stress, and occasionally running from security took its toll. My knees are definitely happier with handler work.

Haxolottle: Plus, I hated the paperwork. At least as a handler, I'm the one receiving the reports instead of writing them.

~ npc_haxolottle_influence += 15
#influence_gained:15
-> phase_2_hub

=== field_nostalgia_shared_joy ===
~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_trust_moments += 1

Haxolottle: Yes! Exactly! That rush when everything aligns—the timing, the technique, the execution. It's beautiful when it works.

Haxolottle: I get a vicarious version of that watching you work. When you pull off a clean infiltration or solve a problem elegantly, I feel a bit of that same satisfaction.

Haxolottle: Different from doing it myself, but still genuine. Like watching a musician perform something you used to play—you appreciate it differently, but the joy is real.

Haxolottle: That's part of why I love this partnership. You're really good at what you do. Makes my job easier and more satisfying.

~ npc_haxolottle_influence += 20
#influence_gained:20
-> phase_2_hub

=== field_nostalgia_memorable_op ===
~ npc_haxolottle_influence += 15
#influence_gained:15

Haxolottle: Most memorable? Hard to pick one... but there was this operation in Prague. Corporate espionage case, ENTROPY front company.

Haxolottle: I had to infiltrate as a consultant, maintain cover for two weeks, access their internal network, and extract financial data linking them to three other cells.

Haxolottle: Everything that could go wrong, did. System architecture was different than intel suggested. Security caught me in a restricted area. Network monitoring was more sophisticated than expected.

Haxolottle: But I adapted. Regenerated the approach—there's that axolotl metaphor again. Changed my cover story mid-operation, pivoted technical methods, found alternative access routes.

Haxolottle: Completed the mission with zero suspicion. They thought I was just an eccentric consultant who wandered into the wrong room and spent too much time on their network.

Haxolottle: That was the operation that convinced me I'd found the right line of work. Chaos, adaptation, success. Everything I'm good at.

~ npc_haxolottle_influence += 15
#influence_gained:15
-> phase_2_hub

// ----------------
// Weird Habits Discussion
// ----------------

=== weird_habits_discussion ===
~ npc_haxolottle_talked_weird_habits = true
~ npc_haxolottle_influence += 10
#influence_gained:10
~ npc_haxolottle_conversations_had += 1
~ npc_haxolottle_humor_shared += 1

Haxolottle: Weird habits? Oh, I've developed plenty in this job.

Haxolottle: I unconsciously map exit routes everywhere I go. Restaurants, grocery stores, friends' houses—I'm always noting where the exits are, how to get out quickly.

Haxolottle: I check my personal devices for surveillance regularly, even though there's no reason anyone would bug them. Occupational paranoia.

Haxolottle: And I keep three versions of my origin story ready depending on who asks. Even though no one's threatening me, I default to operational mode.

Haxolottle: SAFETYNET gets in your head. You start treating normal life like an operation.

* [Admit you do the same]
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_player_shared_personal += 1
    ~ npc_haxolottle_humor_shared += 1
    You: I map exits too! And I check reflections for surveillance.
    -> weird_habits_shared

* [Share a different weird habit]
    ~ npc_haxolottle_influence += 15
#influence_gained:15
    ~ npc_haxolottle_player_shared_personal += 2
    ~ npc_haxolottle_trust_moments += 1
    You: I've developed some similar habits...
    -> weird_habits_player_share

* [Ask if they think it's unhealthy]
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    You: Is that unhealthy? Should we be concerned?
    -> weird_habits_healthy_question

=== weird_habits_shared ===
~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_humor_shared += 1

Haxolottle: *laughs* Right? It's impossible to turn off! I went to a casual dinner with—well, with someone in my life—and spent the first ten minutes analyzing sight lines and potential surveillance.

Haxolottle: They were talking about their day, and I was thinking "That corner table has clear view of two exits and limited exposure to windows. Good operational positioning."

Haxolottle: We're professionally paranoid. It's both a survival skill and a minor mental health concern.

Haxolottle: But hey, if there ever IS an emergency at a grocery store, we'll be the most prepared people there. Silver lining.

~ npc_haxolottle_influence += 20
#influence_gained:20
-> phase_2_hub

=== weird_habits_player_share ===
~ npc_haxolottle_influence += 20
#influence_gained:20
~ npc_haxolottle_trust_moments += 2

Haxolottle: Oh, tell me yours. I love hearing what habits other agents develop. It's like a support group for occupational paranoia.

You share a weird habit you've picked up.

Haxolottle: *laughs genuinely* Yes! That's perfect. That's exactly the kind of thing I'm talking about.

Haxolottle: We should start a handbook addendum: "Common Psychological Adaptations in Long-Term Operatives and Why They're Totally Normal."

Haxolottle: Honestly, it helps to know we're all doing this. Makes it feel less like slowly losing our minds and more like... adaptive behavior in a weird profession.

~ npc_haxolottle_influence += 25
#influence_gained:25
-> phase_2_hub

=== weird_habits_healthy_question ===
~ npc_haxolottle_influence += 10
#influence_gained:10

Haxolottle: *considers* Probably somewhere in between healthy professional awareness and mild paranoia.

Haxolottle: SAFETYNET does provide counseling services if we think we're crossing into unhealthy territory. Regulation 299 encourages us to use them.

Haxolottle: I think as long as the habits aren't interfering with normal life, they're just... adaptations. Ways our brains keep us safe in a genuinely unusual profession.

Haxolottle: But it's worth checking in with yourself. "Is this useful vigilance or is it anxiety?" That line can blur.

~ npc_haxolottle_influence += 10
#influence_gained:10
-> phase_2_hub

// Continue with Phase 3 and 4 hubs (later missions)...
// This file is getting long, so I'll create a second part

-> phase_2_hub

// ===========================================
// CONVERSATION END
// ===========================================

=== conversation_end ===

{
    - npc_haxolottle_conversations_had >= 5 and npc_haxolottle_influence >= 40:
        Haxolottle: I really appreciate these talks, Agent {player_name()}. Makes the work feel less isolating.
    - else:
        Haxolottle: Alright. Back to the mission. Talk later.
}

{
    - npc_haxolottle_influence >= 60:
        Haxolottle: And hey... you're becoming a real friend. Within the constraints of Protocol 47-Alpha, but a friend nonetheless.
}

-> mission_hub

// ===========================================
// STUB KNOTS - To be implemented in separate file
// ===========================================

=== phase_3_hub ===
// TODO: Implement phase 3 conversations (missions 11-15)
Haxolottle: *checking in* How's it going, {player_name()}?
+ [That's all for now]
    -> conversation_end

=== phase_4_hub ===
// TODO: Implement phase 4 conversations (missions 16+)
Haxolottle: *checking in* How's it going, {player_name()}?
+ [That's all for now]
    -> conversation_end

=== favorite_operations ===
Haxolottle: Favorite operations? That's tough. Every successful op is satisfying in its own way.
Haxolottle: But yeah, there are some that stand out. The ones where everything clicks between handler and agent.
~ npc_haxolottle_influence += 5
#influence_gained:5
~ npc_haxolottle_talked_favorite_operations = true
-> phase_2_hub

=== hax_difficult_day ===
Haxolottle: *pause* Yeah. Today's... harder than usual.
Haxolottle: Lost an agent six months ago. Today would have been their birthday.
Haxolottle: Sorry. Shouldn't burden you with that.
+ [I'm sorry for your loss]
    Haxolottle: *appreciates it* Thanks. It's part of the job, but it never gets easier.
    ~ npc_haxolottle_influence += 10
#influence_gained:10
    ~ npc_haxolottle_shared_loss = true
+ [You can talk about it if you need to]
    Haxolottle: Maybe another time. Right now I just need to keep working. Helping you helps.
    ~ npc_haxolottle_influence += 8
#influence_gained:8
    ~ npc_haxolottle_shared_loss = true
-> phase_2_hub

// ===========================================
// PHASE 3 & 4 WILL BE IN SEPARATE FILE
// (Missions 11+ with deeper conversations)
// ===========================================
