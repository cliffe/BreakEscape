// ================================================
// The Keyholder Trials: Jordan Pike (CryptoSecure stand, foyer)
// Third-year campus ambassador, an earlier Keyholder. Small-time ENTROPY asset.
// Hands over the leaflet (Trial I). Estuary English through word choice only.
// ================================================

VAR met_jordan = false
VAR asked_mailer = false

=== start ===
{ met_jordan: -> hub }
#complete_task:visit_stand
~ met_jordan = true
#give_item:notes:keyholder_leaflet
Jordan Pike: Hey! Honestly, no pressure, but you look like a Keyholder. Here, leaflet. It's in your notepad now. Nobody applies, you get found.
Jordan Pike: See the numbers on it? They spell a word. Type the word into the lockbox and you're in the Trials.
Jordan Pike: Nine grand a year and fees paid. It's literally free money.
-> hub

=== hub ===
Jordan Pike: {&Any questions? I get a referral bonus, so ask away.|Anything else?|Go on, ask. It's all commission.}
+ [Who's CryptoSecure?]
    Jordan Pike: Data recovery. Companies get hit by ransomware, CryptoSecure gets them back up. Very busy, apparently.
    -> hub
+ [What happened to the earlier Keyholders?]
    Jordan Pike: Two of us work for them now. Placements, then jobs. They ask some odd questions, though. I don't ask back.
    -> hub
+ {not asked_mailer} [What's the Mailer on the laptop?]
    ~ asked_mailer = true
    Jordan Pike: Some email thing they sell. Tells you when people open stuff? No idea how. I just do the stand.
    -> hub
+ [Thanks. I'll have a go.]
    #exit_conversation
    Jordan Pike: Nice one. Tell your mates.
    -> hub
