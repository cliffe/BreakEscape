// ===========================================
// Mission 5: NPC - Lisa Park
// Marketing Coordinator, office observer. Runs the collection for Elena.
//
// PASS 2: never reaches DONE/END (lesson 21). The old event-triggered
// knots (on_torres_identified, on_mission_complete) had no trigger; the
// scene about Torres' children is now a hub choice once he's named.
// ===========================================

VAR lisa_influence = 0              // 0-100 scale
VAR topic_office_mood = false
VAR topic_torres_personal = false
VAR topic_elena = false
VAR told_about_torres = false
VAR first_meeting = true

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_lisa
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her early thirties sits by the break room window, coffee going cold, a collection tin at her elbow.

#speaker:lisa_park
Lisa Park: Hi. You're the security person, right?

Lisa Park: Lisa Park, marketing. I don't go near the crypto stuff. But I notice things.

+ [What have you noticed lately?]
    ~ lisa_influence += 10
    You: What have you noticed lately?
    -> ask_office_mood

+ [I'm interested in David Torres.]
    You: Can you tell me about David Torres?
    Lisa Park: David? Oh, poor David.
    ~ lisa_influence += 5
    -> torres_sympathy

+ [Sorry. I need to focus on cleared staff.]
    You: Sorry, I'm short on time. Cleared staff first.
    Lisa Park: No, totally. Good luck.
    #exit_conversation
    -> hub

=== torres_sympathy ===
#speaker:lisa_park

Lisa Park: His wife Elena has cancer. Stage 3.

Lisa Park: The treatment that might work isn't available here. It's a trial in the States, and the insurer won't pay. That tin's for her.

Lisa Park: He's lost weight. He looks like he hasn't slept in months.

+ [That's rough. Thanks for telling me.]
    ~ lisa_influence += 10
    -> hub

+ [Personal problems don't excuse anything.]
    You: If he's done something, his circumstances don't change that.
    Lisa Park: Wow. Okay.
    ~ lisa_influence -= 10
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:lisa_park

+ {not topic_office_mood} [How's the office mood these days?]
    -> ask_office_mood

+ {not topic_torres_personal} [Tell me about David Torres.]
    -> ask_torres_personal

+ {not topic_elena} [What do you know about his wife?]
    -> ask_elena

+ {torres_identified and not told_about_torres} [It's David. I'm sorry.]
    -> told_torres

+ [That's all, thanks.]
    You: That's all, thanks.
    Lisa Park: Any time. I'll be here, apparently forever.
    #exit_conversation
    -> hub

=== ask_office_mood ===
#speaker:lisa_park
~ topic_office_mood = true
~ lisa_influence += 5

Lisa Park: Tense. Everyone knows something's wrong. The crypto team keep looking at each other.

{lisa_influence >= 15:
    Lisa Park: David especially. He looks like he's carrying something heavy, all the time.
    Lisa Park: Dr Halloran's taking it personally. And Owen's been living in the logs.
    ~ lisa_influence += 5
}

-> hub

=== ask_torres_personal ===
#speaker:lisa_park
~ topic_torres_personal = true
~ lisa_influence += 10

Lisa Park: David's lovely. Always polite. Remembers everyone's birthday.

Lisa Park: Two kids, Sofia and Miguel. He used to talk about them constantly.

Lisa Park: He's gone very quiet lately.

{lisa_influence >= 20:
    Lisa Park: I saw him crying in the car park last month. I pretended I hadn't. I still feel awful about it.
    Lisa Park: And someone keeps ringing his desk phone. He takes it in the stairwell.
    ~ lisa_influence += 10
}

-> hub

=== ask_elena ===
#speaker:lisa_park
~ topic_elena = true

{topic_torres_personal:
    Lisa Park: Elena came to the Christmas party two years ago. Really kind. You could see how much he adored her.
    {lisa_influence >= 25:
        Lisa Park: He told me the number once, after a glass of wine. Three hundred and eighty thousand dollars.
        Lisa Park: The collection's raised about two grand. I can't even imagine the rest.
        ~ lisa_influence += 10
    }
- else:
    Lisa Park: David's wife? She's ill. Cancer. That's all I really know.
}
-> hub

=== told_torres ===
#speaker:lisa_park
~ told_about_torres = true

Lisa Park: No. David wouldn't...

Lisa Park: But Elena. The money. God.

Lisa Park: What happens to Sofia and Miguel? If he goes to prison and Elena's...

+ [That's not my concern tonight.]
    You: That's not my concern tonight.
    Lisa Park: Right. Just the mission.
    ~ lisa_influence -= 10
    -> hub

+ [I don't know yet. I'm trying to do right by them.]
    You: I don't know yet. I'm trying to find a way that doesn't wreck them.
    Lisa Park: Then try hard. Please.
    ~ lisa_influence += 5
    -> hub
