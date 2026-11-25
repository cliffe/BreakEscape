// Zainab Hussain, field service engineer (recon showcase). Contract: SHOWCASE_PLAN.md 8.3.1.
// card_offer: evening only, until she has handed over technique card 2 (#give_item:technique_card).
// The scenario puts the "Known update gap" card in her itemsHeld.

VAR act_evening = false
VAR zainab_card_given = false
// met_zainab: ink-local first-meeting flag (see ama_owusu.ink).
VAR met_zainab = false

=== start ===
{ met_zainab:
    -> hub
}
~ met_zainab = true
# speaker:npc
Alright. I'm only in to service the kit.
-> hub

=== hub ===
# speaker:npc
Still here.
- (choices)
+ { act_evening and not zainab_card_given } [You're on your own tonight.]
    -> card_offer
+ [Do you ever join the others?]
    # speaker:npc
    I'm in a different office every day.
    # speaker:npc
    Easier to get the job done if I don't get chatting.
    -> choices
+ [What's in the tool roll?]
    # speaker:npc
    My spare kit. It lives in the server room.
    # speaker:npc
    Help yourself to what you need, as long as it goes back.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right.
    # exit_conversation
    -> END

=== card_offer ===
# speaker:npc
Everyone's gone, so I can talk. Ama said you're doing the network check.
~ zainab_card_given = true
#set_global:zainab_card_given:true
#give_item:technique_card
# speaker:npc
Here, take this card. It's for a known update gap on the file server.
# speaker:npc
It only fits a weakness that is real, and that you've tested.
# speaker:npc
There's another card in my tool roll, in the server room. Help yourself.
-> hub
