// test_dm_social: an ordinary Friendface DM with the next-door neighbour, Priya. No judge,
// no meter, just a plain phone-chat thread (the DM app is only a skin). Waving back sets
// `waved_back`, which releases Priya's timed follow-up (see her timedMessages). TEST-ONLY ids.

=== start ===
Priya: Oh, hiya! You're the new neighbour at number 11?
-> hub

=== hub ===
+ [Hi Priya, just moved in last week.]
    Priya: Welcome to the building! Give me a wave if you ever need a hand.
    #set_global:waved_back:true
    -> hub
+ [Any tips for the area?]
    Priya: The cafe on the corner does a cracking flat white. Tell them I sent you.
    -> hub
+ [Catch you later, Priya.]
    Priya: Anytime!
    #exit_conversation
    -> hub
