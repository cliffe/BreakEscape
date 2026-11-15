// ===========================================
// Night porter: Ernesto Bautista
// Mission 2: Ransomed Trust
// Office life (office_life/PLAN.md 2.2, 6): ambient. No clue, no task, nothing given.
// He takes the player for whoever they say they are, and knows nothing of the operation.
// ===========================================

// Set by HaX's npc_attacked mappings when either of the night staff is struck.
VAR night_staff_attacked = false
// Set by the engine once a line of the night_watch_burned exchange was heard.
VAR heard_night_watch_burned = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false
// Set at the first meeting if the player answers his question with their cover; the radio topic
// reads it back. Local to this story.
VAR ernesto_told_security = false

=== start ===
~ hub_quiet = true
{night_staff_attacked:
    Ernesto Bautista: That's close enough. Whatever you want, I haven't got it. #delivery: flat and guarded
    -> hub
}
Ernesto Bautista: Evening. Or morning. Hard to tell in here tonight.
Ernesto Bautista: You with IT? Somebody ought to be.
* [Security. I've been called in about the systems.]
    ~ ernesto_told_security = true
    Ernesto Bautista: Then I hope they're paying you nights.
* [Something like that.]
    Ernesto Bautista: Fair enough. Nobody's anything tonight.
- -> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {night_staff_attacked:
        Ernesto Bautista: I've nothing to say to you. #delivery: flat and guarded
    - else:
        Ernesto Bautista: {&Back again?|Pull up a chair, if you're stopping.|You'll wear a path in that floor.}
    }
}
* {not night_staff_attacked} [You look like you've done some miles tonight.]
    Ernesto Bautista: Porter. Anything that needs carrying, I carry it.
    Ernesto Bautista: Tonight that's samples down to the lab and results back up.
    Ernesto Bautista: The computers went, so the tube system went with them. I'm the tubes now.
    Ernesto Bautista: Nobody notices the porter, normally. Tonight they're all waiting on me.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked} [How do the wards reach you with everything down?]
    Ernesto Bautista: Radio. A ward calls, I go. Then I come back here and wait for the next one.
    Ernesto Bautista: Best seat in the house for waiting, this.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked} [Shouldn't you be up on the wards, with all this going on?]
    Ernesto Bautista: The wards want nurses tonight, not porters.
    Ernesto Bautista: I carry what they send. Anything more and I'm under Sister's feet.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked && heard_night_watch_burned} [Busy night on the radio?]
    Ernesto Bautista: Security put a call out for some visitor. That's their department.
    {ernesto_told_security:
        Ernesto Bautista: Your department too, I'd have thought. You'll hear before I do.
    - else:
        Ernesto Bautista: Always someone looking for someone, a night like this.
    }
    ~ hub_quiet = true
    -> hub
+ [I'll leave you to it.]
    {night_staff_attacked:
        Ernesto Bautista: Go on, then. #delivery: flat and guarded
    - else:
        Ernesto Bautista: Mind how you go.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub
