// NPC Influence System Demo
// Demonstrates how to use the influence mechanic in Break Escape

VAR npc_name = "Agent Carter"
VAR influence = 0
VAR relationship = "stranger"
VAR conversation_count = 0
VAR helped_with_task = false
VAR shared_secret = false

=== start ===
~ conversation_count += 1

// Update relationship status based on influence
{influence >= 10:
    ~ relationship = "trusted ally"
}
{influence >= 5 and influence < 10:
    ~ relationship = "friend"
}
{influence >= -5 and influence < 5:
    ~ relationship = "acquaintance"
}
{influence < -5:
    ~ relationship = "distrustful contact"
}

// Opening greeting changes based on relationship
{relationship == "trusted ally":
    Good to see you, partner. What do you need?
}
{relationship == "friend":
    Hey there! Always happy to help.
}
{relationship == "acquaintance":
    Hello. What brings you here?
}
{relationship == "distrustful contact":
    What do you want now?
}

-> hub

=== hub ===

// Different options become available based on influence
+ [Ask how they're doing]
    -> small_talk

+ {not helped_with_task} [Offer to help with their work]
    -> help_offer

+ {helped_with_task} [Check on the task progress]
    -> task_followup

+ {influence >= 5 and not shared_secret} [Ask about classified intel]
    -> classified_intel

+ {influence >= 10} [Request backup on your mission]
    -> request_backup

+ [Demand information immediately]
    -> be_demanding

+ [Make a joke]
    -> joke

+ [Leave] #exit_conversation
    See you around.
    -> hub

=== small_talk ===
{influence >= 0:
    I'm doing well, thanks for asking.
    ~ influence += 1
    # influence_increased
- else:
    I'm fine. Can we get to the point?
}
-> hub

=== help_offer ===
Really? That would be amazing.
I've been swamped with this security audit.
~ helped_with_task = true
~ influence += 2
# influence_increased
Your help means a lot.
-> hub

=== task_followup ===
{influence >= 5:
    Thanks to your help, we finished ahead of schedule!
    The director was impressed.
    ~ influence += 1
    # influence_increased
    I owe you one.
- else:
    It's going fine. Thanks for asking.
}
-> hub

=== classified_intel ===
{influence >= 10:
    Alright, I trust you. Between us...
    ~ shared_secret = true
    ~ influence += 2
    # influence_increased
    The breach came from inside the network.
    -> hub
- else:
    You know I can't share that. Not yet.
    Build more trust first.
    -> hub
}

=== request_backup ===
Absolutely. You can count on me.
I'll have a team ready in 10 minutes.
~ influence += 1
# influence_increased
-> hub

=== be_demanding ===
Whoa, slow down there.
I don't respond well to demands.
~ influence -= 2
# influence_decreased
Try asking nicely next time.
-> hub

=== joke ===
{influence >= 0:
    Ha! That's a good one.
    ~ influence += 1
    # influence_increased
    It's nice to work with someone who can lighten the mood.
- else:
    This isn't really the time for jokes.
    ~ influence -= 1
    # influence_decreased
    Let's stay professional.
}
-> hub
