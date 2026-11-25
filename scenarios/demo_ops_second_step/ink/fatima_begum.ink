// Fatima Begum, records clerk. Carries archive boxes; the records index is hers.
VAR met_fatima = false

=== start ===
{ met_fatima:
    -> hub
}
~ met_fatima = true
# speaker:npc
Sorry, boxes. Mind your feet.
-> hub.choices

=== hub ===
# speaker:npc
Need something?
- (choices)
+ [What do you do here?]
    # speaker:npc
    I keep the archive and its index. When the index is down I can't find a thing.
    -> choices
+ [Why is the archive store locked?]
    # speaker:npc
    Old rotas and leases. Every visit needs a code and Gwen's approval, which is a pain with my arms full.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Thanks. Careful on the way out.
    # exit_conversation
    -> END
