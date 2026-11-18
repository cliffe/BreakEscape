// Jun Watanabe, office worker. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (leaves his screen open), no variable, no consequence.

// met_jun: ink-local VAR so the first-meeting line plays once; a re-talk (after
// an ended story or a reload) opens at the hub reopen line. See ama_owusu.ink.
VAR met_jun = false

=== start ===
{ met_jun:
    -> hub
}
~ met_jun = true
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
