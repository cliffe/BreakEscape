// Zainab Hussain, field service engineer (Terminal showcase).
// card_offer: once confirm_all_done is set (Ama sends the player at T7), until she has handed over the update card (#give_item:technique_card).
// The scenario puts the "Known update gap" card in her itemsHeld.

VAR zainab_card_given = false
// confirm_all_done: a scenario global (Ama's T6 tick), synced in; the card is offered once Ama has sent the player.
VAR confirm_all_done = false
// met_zainab: ink-local first-meeting flag (see ama_owusu.ink).
VAR met_zainab = false

=== start ===
{ met_zainab:
    # speaker:npc
    Still here.
    -> hub
}
~ met_zainab = true
# speaker:npc
Alright. I'm setting up remote support on the file server. Don't touch the cables.
-> hub

=== hub ===
- (choices)
+ { confirm_all_done and not zainab_card_given } [Ama said you have a card for me.]
    -> card_offer
+ [What's the token for?]
    # speaker:npc
    It's a sign-in for the backup PC, so I can work without a password. It runs out on purpose.
    -> choices
+ [What's in the tool roll?]
    # speaker:npc
    My spare kit.
    # speaker:npc
    Help yourself to what you need, as long as it goes back.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right.
    # exit_conversation
    -> END

=== card_offer ===
~ zainab_card_given = true
#set_global:zainab_card_given:true
#give_item:technique_card
# speaker:npc
Here, take this card. It's for a known update gap on the file server.
# speaker:npc
It only fits a weakness that is real, and that you've tested.
# speaker:npc
There's another card in my tool roll. Help yourself.
-> hub
