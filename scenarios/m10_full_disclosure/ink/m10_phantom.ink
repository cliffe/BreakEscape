INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Agent 0x88 'Phantom' (phantom_post)
// Group B, stage 7b. Contract §1.4. Shown only on phantom_on_team. m08's
// voice: arch, dry, keeps his own lists.
// His list replaces clue 3 (arc §8.3, R3-15): one more unit in the case than
// its sheet lists, and the two names who signed for it. It sets
// clue_bench_log. On taken / double-crossed the whodunit is off and the list
// balances. The face-to-face wrong accusation once clue 1 is in.
// No DONE or END: exits divert to post.
// ================================================

VAR pha_quiet = false
VAR pha_list_heard = false

=== function pha_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == "" and officer_out == ""

=== start ===
-> post

=== post ===
{
- pha_quiet:
    ~ pha_quiet = false
- else:
    Agent 0x88 'Phantom': The Director's bloodhound again. Sit, if you like. I'm counting.
}
+ {not pha_list_heard} [Counting what?]
    ~ pha_list_heard = true
    -> the_list
+ {whodunit_live and pha_list_heard and not clue_bench_log} [Who signed for the case?]
    ~ clue_bench_log = true
    Agent 0x88 'Phantom': Kowalczyk and Arakawa. Both signatures are good. The count isn't.
    ~ pha_quiet = true
    -> post
+ {pha_can_accuse()} [You're WREN.]
    -> accuse_check
+ [Carry on counting.]
    Agent 0x88 'Phantom': I never stop.
    ~ pha_quiet = true
    #exit_conversation
    -> post

=== the_list ===
{
- whodunit_live:
    Agent 0x88 'Phantom': Since Portland I audit every sign-out. That case went out with one more unit than its sheet lists.
    Agent 0x88 'Phantom': Two names signed for it.
- else:
    Agent 0x88 'Phantom': Since Portland I audit every sign-out. Tonight's balances. I checked twice, out of habit.
}
~ pha_quiet = true
-> post

// The face-to-face wrong accusation: the same writes as the line accusation.
=== accuse_check ===
Agent HaX: Wrong, and Netherton loses Phantom till you can clear him. Sure?
+ [I'm sure.]
    ~ officer_out = "phantom"
    ~ wrong_accusation = true
    Agent 0x88 'Phantom': Ask me for my list next time. It has a name on it, and it isn't mine.
    Director Magnus Netherton: Then I am a pair of hands short. Carry on.
    ~ pha_quiet = true
    #exit_conversation
    -> post
+ [Forget I said it.]
    Agent 0x88 'Phantom': Already written down. Never mind.
    ~ pha_quiet = true
    -> post
