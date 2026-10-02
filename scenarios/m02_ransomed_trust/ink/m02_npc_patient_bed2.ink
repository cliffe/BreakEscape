// ===========================================
// Ward Patient: Bed 2 (Mrs Hargreaves, ECMO)
// Mission 2: Ransomed Trust
// Break Escape - Stakes witness / critical dependency
// ===========================================

VAR spoke_to_player = false
// Pass 4 dialogue: re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
{not spoke_to_player:
    ~ spoke_to_player = true
    Mrs Hargreaves: *barely* ...that you, love?
    -> first_words
}
{spoke_to_player:
    -> hub
}

=== first_words ===

Mrs Hargreaves: ...can't see me screen. Sister says it's down.

Mrs Hargreaves: That screen tells them. If me heart's doing what it should.

Mrs Hargreaves: Three weeks I've watched it.

* [Your machine's still running. We're getting the screens back.]
    Mrs Hargreaves: ...good.
    Mrs Hargreaves: Me and this machine have an understanding.
    Mrs Hargreaves: I just don't like not seeing.
    ~ hub_quiet = true
    -> hub

* [How are you feeling?]
    Mrs Hargreaves: Like I'm plugged into summat I can't switch off. Which I am.
    Mrs Hargreaves: Don't fuss. Today's... a day.
    ~ hub_quiet = true
    -> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Mrs Hargreaves: ...still at it, love?
}
+ [I'll let you rest.]
    Mrs Hargreaves: Mind how you go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
