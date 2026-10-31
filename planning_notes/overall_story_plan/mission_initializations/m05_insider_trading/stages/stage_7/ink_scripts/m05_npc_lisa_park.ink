// ===========================================
// Mission 5: NPC - Lisa Park
// Marketing Coordinator, Office Observer
// ===========================================

VAR lisa_rapport = 0              // 0-100 scale
VAR topic_office_mood = false
VAR topic_torres_personal = false
VAR topic_elena = false
VAR first_meeting = true

// External variables
EXTERNAL player_name

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:lisa_park

{first_meeting:
    ~ first_meeting = false
    #display:lisa-friendly

    A woman in her early 30s sits in the break room, coffee in hand, looking out the window.

    Lisa: Hey! You're the security person, right?

    Lisa: Lisa Park, marketing. I don't have access to the secret crypto stuff.

    Lisa: But I notice things. Office dynamics, you know?

    + [What have you noticed lately?]
        ~ lisa_rapport += 10
        You: How's the mood been around here?
        -> office_mood

    + [I'm interested in David Torres. You know him?]
        You: Can you tell me about him?
        Lisa: David? Yeah, poor guy.
        ~ lisa_rapport += 5
        -> torres_sympathy

    + [Thanks, but I need to focus on cleared personnel]
        You: Sorry, limited time.
        Lisa: Oh, totally get it. Good luck!
        #exit_conversation
        -> DONE
}

{not first_meeting:
    #display:lisa-casual
    Lisa: Hey again!
    -> hub
}

=== office_mood ===
#speaker:lisa_park
~ topic_office_mood = true

Lisa: Tense. Everyone knows something's wrong.

Lisa: People whispering. Suspicious looks. It's like a bad TV drama.

{lisa_rapport >= 15:
    Lisa: David Torres especially. He looks exhausted. Stressed beyond belief.
    ~ lisa_rapport += 5
}

-> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_office_mood} [How's the office mood?]
    -> ask_office_mood

+ {not topic_torres_personal} [Tell me about David Torres]
    -> ask_torres_personal

+ {not topic_elena} [What do you know about Torres' wife?]
    -> ask_elena

+ [That's all, thanks]
    #exit_conversation
    #speaker:lisa_park
    Lisa: Anytime! I'll be here if you need me.
    -> DONE

=== ask_office_mood ===
#speaker:lisa_park
~ topic_office_mood = true
~ lisa_rapport += 5

Lisa: Everyone's on edge. The cryptography team especially.

Lisa: They know one of them did it. They're all looking at each other.

{lisa_rapport >= 20:
    Lisa: Dr. Chen is taking it personally. She feels responsible.
    Lisa: Kevin's been digging through network logs like crazy.
}

-> hub

=== ask_torres_personal ===
#speaker:lisa_park
~ topic_torres_personal = true
~ lisa_rapport += 10

Lisa: David's a sweetheart. Always polite. Remembers everyone's names.

Lisa: He has two kids. Sofia and Miguel. He talks about them all the time.

Lisa: Or... he used to. He's been really quiet lately.

{lisa_rapport >= 25:
    Lisa: His wife Elena is sick. Cancer, I think.
    Lisa: I saw him crying in the parking lot once. Last month.
    Lisa: Pretended I didn't see. Felt awful.
    ~ lisa_rapport += 10
}

-> hub

=== ask_elena ===
#speaker:lisa_park
~ topic_elena = true

{topic_torres_personal:
    Lisa: Elena? She came to the office Christmas party two years ago.
    Lisa: Beautiful woman. Really kind. You could see how much David loved her.

    {lisa_rapport >= 30:
        Lisa: Stage 3 cancer. Breast cancer, I think.
        Lisa: Experimental treatment. Insurance won't cover it.
        Lisa: David mentioned it once. $380,000.
        Lisa: I can't even imagine that kind of debt.
        ~ lisa_rapport += 10
    }
    -> hub
- else:
    Lisa: David's wife? She's sick. Cancer.
    Lisa: That's all I know.
    -> hub
}

=== torres_sympathy ===
#speaker:lisa_park

Lisa: His wife Elena has cancer. Stage 3.

Lisa: Treatment costs a fortune. I don't know how they're managing.

Lisa: He's been so stressed. Lost weight. Looks like he hasn't slept in months.

+ [That's rough. Thanks for the context]
    ~ lisa_rapport += 10
    -> hub

+ [Personal problems don't excuse espionage]
    You: If he's the insider, circumstances don't matter.
    Lisa: *pause* Wow. Okay then.
    ~ lisa_rapport -= 10
    #exit_conversation
    -> DONE

// ===========================================
// EVENT-TRIGGERED: Player Identifies Torres
// ===========================================

=== on_torres_identified ===
#speaker:lisa_park

{torres_identified:
    Lisa: I heard... David Torres is the insider?

    + [Where did you hear that?]
        Lisa: Office gossip travels fast.
        Lisa: Is it true?
        -> confirm_torres

    + [I can't discuss the investigation]
        Lisa: Right. Sorry. Classified.
        -> DONE
}

=== confirm_torres ===

+ [Yes. He's been stealing classified research]
    Lisa: *shocked* No. David wouldn't...
    Lisa: *pause* But Elena. The money.
    Lisa: God. That's tragic.
    -> emotional_response

+ [The evidence points to him]
    Lisa: I don't want to believe it.
    Lisa: But I guess desperation makes people do terrible things.
    -> DONE

=== emotional_response ===
#speaker:lisa_park

Lisa: What happens to his kids? Sofia and Miguel?

Lisa: If David goes to prison, Elena's dying, who takes care of them?

+ [That's not my concern]
    Lisa: *quietly* Right. Just the mission.
    #exit_conversation
    -> DONE

+ [I don't have answers for that]
    You: I'm trying to do the right thing. It's complicated.
    Lisa: Yeah. I bet it is.
    -> DONE

// ===========================================
// EVENT-TRIGGERED: Mission Complete
// ===========================================

=== on_mission_complete ===
#speaker:lisa_park

{torres_turned:
    Lisa: I heard David's cooperating with the government. Witness protection?
    Lisa: And Elena's treatment will be covered?
    You: That's the arrangement.
    Lisa: *relieved* Oh thank god. Those kids need their parents.
}

{torres_arrested:
    Lisa: David's been arrested.
    Lisa: *sad* Elena and the kids...
    Lisa: This is just awful.
}

{torres_killed:
    Lisa: Someone died?
    Lisa: *horrified* David?
    Lisa: *starts crying* Oh god. Elena. The kids.
    Lisa: I need a minute.
    #exit_conversation
    -> DONE
}

Lisa: Thanks for handling this. I know it wasn't easy.

#exit_conversation
-> DONE
