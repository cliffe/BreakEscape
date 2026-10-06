// ================================================
// The Keyholder Trials: Megan Oyelaran (common room)
// Fellow first-year chasing the studentship. Teaches the Trial II trap by
// example, and is the mid-mission moral choice. Manchester through word choice.
// ================================================

VAR met_megan = false

// Synced scenario globals
VAR lockbox_open = false
VAR locker_open = false
VAR corridor_open = false
VAR megan_file_read = false
VAR megan_choice = ""
VAR decision_made = false

=== start ===
{ met_megan: -> hub }
~ met_megan = true
Megan Oyelaran: You after the Keyholder money as well? Get in the queue.
Megan Oyelaran: Megan. First year. Our mam thinks I'm doing something sensible.
-> hub

=== hub ===
{
- megan_choice == "warned":
    Megan Oyelaran: Binned the leaflet. Still skint, mind. Worth it.
- corridor_open:
    Megan Oyelaran: Still on Trial III. Don't tell me how. I want to get it myself.
- locker_open:
    Megan Oyelaran: You got past the locker? Dead good. I'm still on it.
- lockbox_open:
    Megan Oyelaran: Locker four's done my head in.
- else:
    Megan Oyelaran: Go on, then.
}
+ {lockbox_open and not locker_open} [How are you getting on with Trial II?]
    -> trial_two
+ {megan_file_read and megan_choice == "" and not decision_made} [CryptoSecure isn't what it looks like. Walk away from this.]
    -> warn_her
+ [Why do you want it so much?]
    -> why
+ [See you around.]
    #exit_conversation
    Megan Oyelaran: Not if I see you first.
    -> hub

=== trial_two ===
Megan Oyelaran: Eight digits, four-digit keypad. I typed the first four straight in and it locked me out. Three goes and you're done.
Megan Oyelaran: It resets if you walk off and come back, mind.
Megan Oyelaran: Someone said the card's not a number, it's characters. And I tried that hex thing and got four capital letters, so that's not it either.
-> hub

=== why ===
Megan Oyelaran: My mam's care-home fees are two months behind. I'm on an overdraft I'm not telling you the size of.
Megan Oyelaran: Nine grand a year sorts both. So yeah. I want it.
-> hub

=== warn_her ===
{ megan_choice != "": -> hub }
Narrator: You tell her what you read in the candidate assessments.
Megan Oyelaran: They wrote that down? About my mam?
Narrator: She's quiet for a long moment.
Megan Oyelaran: Right. Glad I know. Doesn't pay the care home, does it.
#set_global:megan_choice:warned
#set_global:megan_choice_made:true
~ megan_choice = "warned"
Megan Oyelaran: I'm out. They can find another charity case.
-> hub
