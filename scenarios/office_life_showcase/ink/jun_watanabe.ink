// Jun Watanabe, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (leaves his screen open), no variable, no consequence.

=== start ===
# speaker:npc
Oh, hi. Sorry, I'm a bit swamped.
-> hub.choices

=== hub ===
# speaker:npc
Sorry, still swamped.
- (choices)
+ [Do you lock your screen when you go?]
    # speaker:npc
    Lock it? I'm only ever gone a minute.
    # speaker:npc
    Nobody here would touch it anyway.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    No worries.
    # exit_conversation
    -> END
