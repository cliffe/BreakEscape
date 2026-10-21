INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: THE RECRUITER'S NUMBER (phone; never rings).
// NPC id: recruiter_phone. Home knot: start.
// Exists only to carry her 06:00 text on m09_recruiter_offer == "double_crossed"
// ("I'll remember the shape of you."), which is a JSON timed text, not ink.
// start is gated and silent (PASS2 lesson 36): it prints nothing, writes
// nothing, and holds one sticky exit, so the phone's preload saves nothing.
// ===========================================

=== start ===
+ [(Put the phone away.)]
    #exit_conversation
    -> start
