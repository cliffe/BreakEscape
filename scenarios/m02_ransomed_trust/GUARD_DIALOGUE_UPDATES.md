# Guard Dialogue Updates for ENTROPY Insider Discovery

## Required Changes to m02_npc_security_guard.ink (source file)

### 1. Add Global Variable
```ink
VAR guard_identity_exposed = false
```

### 2. Add Hub Choice (appears when player has read payment receipt)
```ink
=== hub ===
+ [Ask about the ransomware attack] -> ask_about_attack
+ [Request access to restricted areas] -> request_access
+ {caught_lockpicking} [Explain the lockpicking situation] -> explain_lockpick_again
+ {guard_identity_exposed && !guard_knocked_out} [Confront the guard about being Asset #47] -> confront_entropy_agent
+ [End conversation]
    #exit_conversation
    Guard: Stay safe. This crisis has everyone on edge.
    -> hub
```

### 3. Add Confrontation Knot
```ink
=== confront_entropy_agent ===
#speaker:player
You: I found the payment receipt in the server room. "Asset #47" — that's you, isn't it?

#speaker:security_guard
{influence >= 40:
    -> guard_confession
- else:
    -> guard_denial
}

= guard_confession
Guard: *freezes, hand moving toward radio*
Guard: How did you... who are you working for?
Guard: You don't understand. They have my daughter. Medical bills I can't pay.
Guard: Ghost said £15,000 would cover her treatment. I just had to look the other way.

+ [You still betrayed 47 patients on life support]
    -> guilt_trip
+ [Ghost used you. ENTROPY doesn't care about your daughter]
    -> sympathy_approach
+ [I'm taking you down]
    -> arrest_attempt

= guard_denial
Guard: That's insane. You're accusing me of terrorism?
Guard: SECURITY BREACH! ALL UNITS TO NORTH CORRIDOR!
#hostile:security_guard
#set_global:guard_identity_exposed:true
#exit_conversation
-> END

= guilt_trip
Guard: I know! You think I don't know that?
Guard: Every night I see their faces. But my daughter—
Guard: I can't lose her. I already lost her mother to cancer.
~ influence -= 20
-> confrontation_aftermath

= sympathy_approach
You: Ghost doesn't care about you or your daughter. You're a loose end.
You: Once this is over, you think ENTROPY will let you walk away?
Guard: *looks shaken*
Guard: I... I didn't think about that.
~ influence += 10
-> confrontation_aftermath

= arrest_attempt
Guard: You're not taking me anywhere!
#hostile:security_guard
#set_global:guard_identity_exposed:true
#exit_conversation
-> END

= confrontation_aftermath
Guard: What do you want from me?

+ [Help me stop Ghost. Testify.]
    -> guard_cooperates
+ [Step aside and don't interfere]
    -> guard_stands_down
+ [Attack while they're vulnerable]
    -> attempt_fight

= guard_cooperates
Guard: Fine. I'll testify. But you have to promise— my daughter's treatment.
Guard: I have files. Ghost's communications. The network device access codes.
~ influence += 30
#complete_task:expose_guard
#set_global:guard_cooperating:true
You: I'll make sure she gets care. But you're going to face justice.
Guard: *nods* I know. At least I can live with myself.
#exit_conversation
-> END

= guard_stands_down
Guard: *steps back, removes radio battery*
Guard: I won't stop you. But I can't help either.
Guard: Just... finish this before Ghost finds out I'm compromised.
~ influence += 15
#complete_task:expose_guard
#set_global:guard_neutralized:true
#exit_conversation
-> END
```

## If Source .ink File Not Available

Add this configuration to the scenario JSON `eventMappings` for the guard:

```json
{
  "eventPattern": "global_variable_changed:guard_identity_exposed",
  "condition": "value === true",
  "targetKnot": "confront_entropy_agent",
  "conversationMode": "person-chat",
  "background": "assets/backgrounds/hospital1.png",
  "onceOnly": false
}
```

## Global Variables to Add to Scenario JSON

Already added:
- `guard_identity_exposed` (set when payment receipt is read)
- `pin_cracker_obtained` (set when PIN cracker is picked up)
- `guard_schedule_decoded` (optional tracking)
