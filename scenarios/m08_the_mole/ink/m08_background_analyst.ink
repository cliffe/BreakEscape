// Mission 8: The Mole - background bark. No globals, no tasks.
// Speaker: Junior Analyst
// PASS 2 (lesson 21): never reaches DONE; the exit returns to the hub.
=== start ===
Junior Analyst: You're the one the Director brought in, aren't you. Don't tell me anything. I don't want to know anything. Knowing things is how you end up in an interview room in this place.
Junior Analyst: I've read the same threat feed six times tonight. I couldn't tell you a word of it. Everyone's just... watching the door.
-> hub

=== hub ===
+ [Get some air. You've earned it.]
    Junior Analyst: If I leave this desk, somebody writes down that I left this desk. I'll stay.
    -> hub
+ [I'll leave you to it.]
    #exit_conversation
    -> hub
