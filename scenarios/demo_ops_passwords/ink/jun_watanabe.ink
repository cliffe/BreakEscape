// Jun Watanabe, office worker. Colour, plus the borrow lines of the afternoon beats.
VAR jun_pc_off = false
VAR see_borrow_done = false
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
+ [Busy day?]
    # speaker:npc
    Always. At least the printer's behaving.
    -> choices
+ { jun_pc_off and not see_borrow_done } [Is your PC off?]
    # speaker:npc
    Dead as a doornail. I can't get a thing done.
    # speaker:npc
    I'll have to try the hot desk.
    -> choices
+ { see_borrow_done } [You're on the hot desk.]
    # speaker:npc
    Only till mine's back. I never log out of borrowed PCs. Is that bad?
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    No worries.
    # exit_conversation
    -> END
