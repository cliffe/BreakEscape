// ===========================================
// Mission 5: NPC - Lisa Park
// Marketing Coordinator, office observer. Runs the collection for Elena.
//
// PASS 2: never reaches DONE/END (lesson 21). The old event-triggered
// knots (on_torres_identified, on_mission_complete) had no trigger; the
// scene about Torres' children is now a hub choice once he's named.
//
// PASS 4 (whodunnit): the player no longer opens by asking about Torres.
// They ask who the collection is for, and the David questions follow once
// she has named him. She also passes on Halloran's row with the CEO (true,
// and a red herring).
//
// PASS 4 (dialogue): "What have you noticed lately?" spreads the gossip over
// Halloran, Ben and David, so it no longer singles David out before the
// badge log. hub_quiet gives the hub a re-entry line (m03 pattern).
// ===========================================

VAR lisa_influence = 0              // 0-100 scale
VAR topic_office_mood = false
VAR topic_torres_personal = false
VAR topic_elena = false
VAR told_about_torres = false
VAR first_meeting = true
VAR heard_about_david = false
VAR hub_quiet = false               // set by every exit, so a goodbye doesn't end on a greeting

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
Narrator: A woman in her early thirties by the break room window. Coffee going cold, a collection tin at her elbow.

#speaker:lisa_park
Lisa Park: Hi. You're the security person, right? Everyone's been whispering.

Lisa Park: Lisa Park, marketing. I don't go near the crypto stuff, but I sit by the kettle. I notice things.

+ [What have you noticed lately?]
    ~ lisa_influence += 10
    -> ask_office_mood

+ [Who's the collection tin for?]
    ~ lisa_influence += 5
    -> torres_sympathy

+ [Sorry, I'm short on time. Cleared staff first.]
    Lisa Park: No, totally. Good luck with it.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== torres_sympathy ===
#speaker:lisa_park
~ heard_about_david = true

Lisa Park: David Torres, in cryptography. Keep it to yourself, yeah? His wife Elena's got cancer. Stage 3.

Lisa Park: The treatment that might work is a trial in the States, and the insurer won't touch it. Hence the tin.

Lisa Park: He's lost weight. Looks like he hasn't slept in months.

+ [That's rough. Thanks for telling me.]
    ~ lisa_influence += 10
    -> hub

+ [If he's done something, his circumstances don't change that.]
    Lisa Park: Wow. Okay. Right.
    ~ lisa_influence -= 10
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:lisa_park
{hub_quiet:
    ~ hub_quiet = false
- else:
    Lisa Park: {&Anything else? I've got nowhere to be.|Go on.|What else?}
}

+ {not topic_office_mood} [How's the office mood these days?]
    -> ask_office_mood

+ {not heard_about_david} [Who's the collection tin for?]
    -> torres_sympathy

+ {heard_about_david and not topic_torres_personal} [Tell me about David Torres.]
    -> ask_torres_personal

+ {heard_about_david and not topic_elena} [Is David all right? At home, I mean?]
    -> ask_elena

+ {torres_identified and not told_about_torres} [It's David. I'm sorry.]
    -> told_torres

+ [That's all, thanks.]
    Lisa Park: Any time. I'll be here. Apparently forever.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_office_mood ===
#speaker:lisa_park
~ topic_office_mood = true
~ lisa_influence += 5

Lisa Park: Tense. The crypto team keep looking at each other like it's a game of Cluedo.

{lisa_influence >= 15:
    ~ heard_about_david = true
    Lisa Park: Dr Halloran had a stand-up row with the CEO last month about publishing. Half the building heard it.
    Lisa Park: Ben Ashworth's been snapping at everyone. David Torres has barely said a word in weeks.
    Lisa Park: And Owen's been living in the logs, poor lamb.
    ~ lisa_influence += 5
}

-> hub

=== ask_torres_personal ===
#speaker:lisa_park
~ topic_torres_personal = true
~ lisa_influence += 10

Lisa Park: David's lovely. Always polite. Remembers everyone's birthday.

Lisa Park: Two kids, Sofia and Miguel. He used to talk about them non-stop.

Lisa Park: Now he barely talks at all.

{lisa_influence >= 20:
    Lisa Park: I saw him crying in the car park last month. I pretended I hadn't. Still feel awful.
    Lisa Park: And someone keeps ringing his desk phone. He takes it in the stairwell.
    ~ lisa_influence += 10
}

-> hub

=== ask_elena ===
#speaker:lisa_park
~ topic_elena = true

{topic_torres_personal:
    Lisa Park: His wife, Elena, came to the Christmas party two years ago. Lovely woman. Now she's ill. Properly ill.
    {lisa_influence >= 25:
        Lisa Park: He told me what the treatment costs once, after a glass of wine. Three hundred and eighty thousand dollars.
        Lisa Park: The tin's on about two grand. I can't even think about the rest.
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

Lisa Park: But Elena. The money. Oh, God.

Lisa Park: What happens to Sofia and Miguel? If he goes to prison and Elena's...

+ [That's not my concern tonight.]
    Lisa Park: Right. Just the job, then.
    ~ lisa_influence -= 10
    -> hub

+ [I don't know yet. I'm trying to find a way that doesn't wreck them.]
    Lisa Park: Then try hard. Please.
    ~ lisa_influence += 5
    -> hub
