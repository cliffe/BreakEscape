// ===========================================
// Mission 6: NPC - Checkpoint Guard (contract security)
// PASS 3 P8: a turnstile on the trading-floor door.
// - Talk: the FCA cover and the CTO's name get you waved through
//   (#unlock_door:trading_floor). Wrong answers cost only the walk.
// - Pick: in his blind window. Seen picking, he challenges you and you lose
//   the talk route until you've been back to the lobby (guard_grace).
// - He never turns hostile: this file has no hostile tag.
//
// Re-entry. Every resting choice lives in a stitch of `start`, so on a re-open
// the engine re-navigates to `start` (the first segment of the choice's
// sourcePath, person-chat-minigame.js) and plays the right opener for the
// current state. Exits divert to a stitch, never DONE, and print nothing after
// the exit line.
//
// #unlock_door is fire-and-forget (chat-helpers.js:64-83): guard_waved_through
// is set whether or not the server accepted it, so every entry checks it first
// and re-issues the tag, which costs nothing once the door is open.
// ===========================================

// Synced scenario globals
VAR guard_waved_through = false
VAR guard_grace = false
VAR guard_caught = false     // set on a catch, never cleared (credits)
VAR guard_resolved = false   // set by HaX on entering the trading floor

// Ink-local
VAR guard_asked_name = false

-> start

=== start ===
{ guard_waved_through:
    // Re-issue the unlock only until the player has reached the floor (the
    // door is provably open then); saves a repeat of the raw-id toast (E17).
    { not guard_resolved:
        #unlock_door:trading_floor
    }
    Checkpoint Guard: Go on, then.
    -> start.waved_choices
}
{ guard_grace:
    Checkpoint Guard: Still here. Still not on my list. Try reception.
    -> start.grace_choices
}
{ not guard_asked_name:
    ~ guard_asked_name = true
    Narrator: A contract guard with a clipboard walks a slow line across the checkpoint, between you and the trading-floor door.
    Checkpoint Guard: Afternoon. Floor's restricted. Who are you?
- else:
    Checkpoint Guard: You again. Who are you, then?
}
-> start.question

// Two beats (PASS 3 review): the cover, then the name. HaX's briefing-close
// text gives both; the lobby brochure also names the CTO. A wrong answer at either beat costs
// only the walk.
= question
+ [Financial Conduct Authority. Routine supervisory visit.]
    Checkpoint Guard: Regulator. Yeah, they said there'd be one. Who are you here to see?
    -> start.name
+ [IT. I've been asked to look at the servers.]
    Checkpoint Guard: IT come in through the back with a ticket number. You're not on my list.
    #exit_conversation
    -> start.question
+ [A consultant. Blockchain audit.]
    Checkpoint Guard: Consultants come with a sponsor and a pass. You've got neither. Not on my list.
    #exit_conversation
    -> start.question
+ [Just looking around. I'll come back.]
    Checkpoint Guard: You do that.
    #exit_conversation
    -> start.question

= name
+ [Dr Volkova. The CTO.]
    -> waved_through
+ [The CEO.]
    Checkpoint Guard: Nobody sees the CEO. A regulator would know that. Not on my list.
    #exit_conversation
    -> start.question
+ [Whoever runs compliance.]
    Checkpoint Guard: That's not a name. I don't let people through to job titles.
    #exit_conversation
    -> start.question

= waved_choices
+ [Thanks. I'll head through.]
    Checkpoint Guard: Mind the traders.
    #exit_conversation
    -> start.waved_choices

= grace_choices
+ [Fine. I'm going.]
    Checkpoint Guard: Good.
    #exit_conversation
    -> start.grace_choices

=== waved_through ===
~ guard_waved_through = true
#set_variable:guard_waved_through=true
Checkpoint Guard: Dr Volkova. You're on the list. She's on the floor.
#unlock_door:trading_floor
Checkpoint Guard: Door's open. Don't touch the screens; the traders bite.
#exit_conversation
-> start.waved_choices

// lockpick_used_in_view (event-started, cooldown 0). Checks the waved-through
// and grace states first, so a man who let you in never challenges you.
=== on_lockpick_seen ===
{ guard_waved_through:
    { not guard_resolved:
        #unlock_door:trading_floor
    }
    Checkpoint Guard: I said go on. It's open. Put those away.
    #exit_conversation
    -> start.waved_choices
}
{ guard_grace:
    Narrator: He doesn't even break stride this time.
    Checkpoint Guard: Still here. Still watching. Away from the door.
    #exit_conversation
    -> start.grace_choices
}
~ guard_grace = true
~ guard_caught = true
#set_variable:guard_grace=true
#set_variable:guard_caught=true
Narrator: Across the room, the guard's head comes up. He has seen the picks.
Checkpoint Guard: Oi. Away from that door.
Checkpoint Guard: I don't know who you are, and now I'm not going to take your word for it. Go back out to reception and sign in properly.
#exit_conversation
-> start.grace_choices
