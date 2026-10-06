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
You after the Keyholder money as well? Get in the queue.
Megan. First year. Our mam thinks I'm doing something sensible.
-> hub

=== hub ===
{
- megan_choice == "warned":
    I'm still thinking about what you said. Proper thinking.
- locker_open:
    You got past the locker? Dead good. I'm still on it.
- lockbox_open:
    Locker four's done my head in.
- else:
    Go on, then.
}
+ {lockbox_open and not locker_open} [How are you getting on with Trial II?]
    -> trial_two
+ {megan_file_read and megan_choice == "" and not decision_made} [CryptoSecure isn't what it looks like. Walk away from this.]
    -> warn_her
+ [Why do you want it so much?]
    -> why
+ [See you around.]
    #exit_conversation
    Not if I see you first.
    -> hub

=== trial_two ===
Eight digits, four-digit keypad. I typed the first four straight in and it locked me out. Three goes and you're done.
It resets if you walk off and come back, mind.
Someone said the card's not a number, it's characters. And I tried that hex thing and got four capital letters, so that's not it either.
-> hub

=== why ===
My mam's care home is two months behind. I'm on an overdraft I'm not telling you the size of.
Nine grand a year sorts both. So yeah. I want it.
-> hub

=== warn_her ===
{ megan_choice != "": -> hub }
Narrator: You tell her what you read in the candidate assessments.
They wrote that down? About my mam?
Narrator: She's quiet for a long moment.
Right. Glad I know. Doesn't pay the care home, does it.
I'm out. They can find another charity case.
#set_global:megan_choice:warned
#set_global:megan_choice_made:true
~ megan_choice = "warned"
-> hub
