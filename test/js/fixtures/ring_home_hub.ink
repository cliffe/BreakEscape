// A3 R1 m1: homes a ringer call resets to. Not a scenario: a fixture for phone-ring-home-hub.test.mjs.
VAR deal = false
VAR seen_calls = 0

=== start ===
Thread here. This is the home knot.
+ [Anything new?]
    Nothing new on the thread.
    -> start
+ [Tell me more.]
    Not much more.
    -> start

=== ring_call ===
This is the call.
+ [Keep talking.]
    More call.
    ~ seen_calls = seen_calls + 1
    -> DONE

=== router ===
{ deal:
    -> return_contact
}
Router hub line.
+ [Hello]
    Hi.
    -> router

=== return_contact ===
The call again.
+ [Fine]
    -> DONE

=== silent_home ===
+ [One]
    -> silent_home

=== two_lines ===
First hub line.
Second hub line.
+ [Go on]
    -> two_lines

=== ends ===
Last word.
-> DONE

// A3 R2 m3: a home knot that assigns a synced global, and one that starts with narration
VAR hub_seen = false

=== synced_home ===
~ hub_seen = true
Synced hub line.
+ [Go]
    -> synced_home

=== narrated_home ===
Narrator: A carrier tone hums on the line.
+ [Listen]
    -> narrated_home
