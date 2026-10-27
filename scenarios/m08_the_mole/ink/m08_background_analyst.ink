// Mission 8: The Mole - background bark. No globals, no tasks.
// Speaker: Junior Analyst
// PASS 2 (lesson 21): never reaches DONE; the exit returns to the hub.
// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag (re-entry line on a
// re-talk only), and met so a page reload doesn't replay the opener.
VAR hub_quiet = false
VAR met = false

=== start ===
{ met: -> hub }
~ met = true
Junior Analyst: You're the one the Director brought in. Don't tell me anything. Knowing things is how you end up in an interview room.
Junior Analyst: I've read the same threat feed six times tonight and couldn't tell you a word of it. Everyone's watching the door.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    Junior Analyst: {&Still here. Still reading the same paragraph.|Yes?}
}
~ hub_quiet = false
+ [Get some air. You've earned it.]
    Junior Analyst: If I leave this desk, somebody writes down that I left this desk. I'll stay.
    -> back
+ [I'll leave you to it.]
    Junior Analyst: Close the door behind you. Please.
    #exit_conversation
    -> back
