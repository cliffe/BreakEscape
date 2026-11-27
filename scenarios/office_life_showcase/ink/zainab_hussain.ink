// Zainab Hussain, field service engineer. Five-line staff chat (neil.ink reopen pattern).
// One flavour topic (keeps to herself), no variable, no consequence.

// met_zainab: ink-local VAR so the first-meeting line plays once; a re-talk (after
// an ended story or a reload) opens at the hub reopen line. See ama_owusu.ink.
VAR met_zainab = false

=== start ===
{ met_zainab:
    -> hub
}
~ met_zainab = true
# speaker:npc
Alright. I'm only in to service the kit.
-> hub.choices

=== hub ===
# speaker:npc
Still here.
- (choices)
+ [Do you ever join the others?]
    # speaker:npc
    I'm in a different office every day.
    # speaker:npc
    Easier to get the job done if I don't get chatting.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right.
    # exit_conversation
    -> END
