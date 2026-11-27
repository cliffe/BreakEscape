// Fixture for test/js/phone-player-lines.test.mjs (U3).
// Phone ink where some lines are the player's: a "You:" line after a non-verbal
// choice, one in the opening, and one marked with #speaker:player.
VAR flag = false
VAR noted = false

=== start ===
Morning. Anything?
You: Morning.
-> hub

=== hub ===
{flag and not noted: -> sent}
- (opts)
+ [Say nothing.]
    You: Just checking in.
    Noted.
    -> hub
+ [Send the photo.]
    Photo of the manifest. #speaker:player
    Got it.
    -> hub

=== sent ===
~ noted = true
Sent you the file. #speaker:player
Thanks. That's him.
-> hub.opts

// A mapping's bark knot that opens with the player's line
=== bark_after_player ===
You: Sent you the photo.
Patricia Morgan: Got it. That's him.
-> DONE

=== bark_only_player ===
You: Hello?
-> DONE
