// security-guard.ink
// A security guard that patrols the corridor
// Reacts when the player attempts to lockpick in their view
// Can be persuaded to let the player off or confronted with consequences
// Uses hub pattern for clear conversation flow

VAR influence = 0
VAR caught_lockpicking = false
VAR confrontation_attempts = 0
VAR warned_player = false

=== start ===
#speaker:security_guard
{not warned_player:
    #display:guard-patrol
    You see the guard patrolling back and forth. They're watching the area carefully.
    ~ warned_player = true
    What brings you to this corridor?
}
{warned_player and not caught_lockpicking:
    #display:guard-patrol
    The guard nods at you as they continue their patrol.
    What do you want?
}
-> hub

=== hub ===
+ [I'm just passing through] 
  -> passing_through
+ [I need to access that door]
  -> request_access
+ [Nothing, just leaving]
  #exit_conversation
  #speaker:security_guard
  Good. Stay out of trouble.

-> hub

=== on_lockpick_used ===
#speaker:security_guard
{caught_lockpicking < 1:
    ~ caught_lockpicking = true
    ~ confrontation_attempts = 0
}
~ confrontation_attempts++

#display:guard-confrontation
{confrontation_attempts == 1:
    Hey! What do you think you're doing with that lock?
    
    * [I was just... looking for something I dropped]
        -> explain_drop
    * [This is official business]
        -> claim_official
    * [I can explain...]
        -> explain_situation
    * [Mind your own business]
        -> hostile_response
}
{confrontation_attempts > 1:
    I already told you to stop! This is your final warning.
    
    * [Okay, I'm leaving right now]
        -> back_down
    * [You can't tell me what to do]
        -> escalate_conflict
}

=== explain_drop ===
#speaker:security_guard
{influence >= 30:
    ~ influence -= 10
    Looking for something... sure. Well, I don't get paid enough to care too much.
    Just make it quick and don't let me catch you again.
    #display:guard-annoyed
    -> hub
}
{influence < 30:
    ~ influence -= 15
    That's a pretty thin excuse. I'm going to have to report this incident.
    Move along before I call for backup.
    #display:guard-hostile
    #exit_conversation
    -> hub
}

=== claim_official ===
#speaker:security_guard
{influence >= 40:
    ~ influence -= 5
    Official, huh? You look like you might belong here. Fine. But I'm watching.
    #display:guard-neutral
    -> hub
}
{influence < 40:
    ~ influence -= 20
    Official? I don't recognize your clearance. Security protocol requires me to log this.
    You're coming with me to speak with my supervisor.
    #display:guard-alert
    #exit_conversation
    -> hub
}

=== explain_situation ===
#speaker:security_guard
{influence >= 25:
    ~ influence -= 5
    I'm listening. Make it quick.

    * [I need to access critical files for the investigation]
        -> explain_files
    * [I'm security testing your protocols]
        -> explain_audit
    * [Actually, just let me go]
        -> back_down
}
{influence < 25:
    ~ influence -= 20
    No explanations. Security breach detected. This is being reported.
    #display:guard-arrest
    #exit_conversation
    -> hub
}

=== explain_files ===
#speaker:security_guard
{influence >= 35:
    ~ influence -= 10
    Critical files need a key. Do you have one? If not, this conversation is over.
    #display:guard-sympathetic
    -> hub
}
{influence < 35:
    ~ influence -= 15
    Critical files are locked for a reason. You don't have the clearance.
    #display:guard-hostile
    #exit_conversation
    -> hub
}

=== explain_audit ===
#speaker:security_guard
{influence >= 45:
    ~ influence -= 5
    Security audit? You just exposed our weakest point. Congratulations.
    But you need to leave now before someone else sees this.
    #display:guard-amused
    -> hub
}
{influence < 45:
    ~ influence -= 20
    An audit would be scheduled and documented. This isn't.
    #display:guard-alert
    #exit_conversation
    -> hub
}

=== hostile_response ===
# speaker:security_guard
~ influence -= 30
That's it. You just made a big mistake.
SECURITY! CODE VIOLATION IN THE CORRIDOR!
#display:guard-aggressive
#hostile:security_guard
#exit_conversation
-> hub

=== escalate_conflict ===
# speaker:security_guard
~ influence -= 40
You've crossed the line! This is a lockdown!
INTRUDER ALERT! INTRUDER ALERT!
#display:guard-alarm
#hostile:security_guard
#exit_conversation
-> hub

=== back_down ===
#speaker:security_guard
{influence >= 15:
    ~ influence -= 5
    Smart move. Now get out of here and don't come back.
    #display:guard-neutral
}
{influence < 15:
    Good thinking. But I've got a full description now.
    #display:guard-watchful
}
#exit_conversation
-> hub

=== passing_through ===
#speaker:security_guard
Just passing through, huh? Keep it that way. No trouble.
#display:guard-neutral
-> hub

=== request_access ===
#speaker:security_guard
{influence >= 50:
    You? Access to that door? That's above your pay grade, friend.
    But I like the confidence. Not happening though.
}
{influence < 50:
    Access? Not without proper credentials. Nice try though.
}
#display:guard-skeptical
-> hub
