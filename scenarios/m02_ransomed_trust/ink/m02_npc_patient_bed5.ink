// ===========================================
// Ward Patient: Bed 5 (Ms Chen, post-op)
// Mission 2: Ransomed Trust
// Break Escape - Stakes witness / ambient
// ===========================================

VAR spoke_to_player = false
// Pass 4 dialogue: re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
{not spoke_to_player:
    ~ spoke_to_player = true
    Ms Chen: *lowering her book* You'll be the one they've brought in about the computers.
    -> first_words
}
{spoke_to_player:
    -> hub
}

=== first_words ===

Ms Chen: The young doctor said "ransomware", as though the word explained itself.

Ms Chen: Forty years I taught in Edinburgh and never once had to think about it.

* [We're working on it. Your own care isn't affected.]
    Ms Chen: I believe the nurse about me.
    Ms Chen: But Mrs Hargreaves in bed two is on that machine, and the screen above her has been off since three.
    Ms Chen: I've been watching it for her. Sister cannot be in six places.
    ~ hub_quiet = true
    -> hub

* [How are you holding up?]
    Ms Chen: I've had my operation. Waiting I can do.
    Ms Chen: If I were you, I'd worry about the ones who can't tell you they're in trouble.
    ~ hub_quiet = true
    -> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Ms Chen: Any progress, or are we still guessing?
}
+ [Thank you for watching the others.]
    Ms Chen: I'm in the same room as them. What else would I do?
    ~ hub_quiet = true
    -> hub

+ [I'll let you rest.]
    Ms Chen: Go and fix it, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
