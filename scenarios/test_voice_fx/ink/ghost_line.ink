// Test: voice FX. One line, spoken by whichever phone NPC opens this story.
// The text matches an m02 Ghost clip exactly, so the cached audio plays with no TTS call.
=== start ===
Then you'll do it the long way, and you already know what the long way costs, because you've been standing in it all night.
+ [Again.]
    -> start
+ [End the call.]
    -> END
