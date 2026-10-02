// ===========================================
// Mission 6: NPC - Crypto Trader
// Innocent employee, provides context
// ===========================================

VAR trader_talked = false
VAR topic_volume = false
VAR topic_monero = false
VAR topic_irina = false
VAR first_meeting = true
// Final round (m03 pattern): set by every exit, so the resting knot's re-entry
// line shows on a reopen and never in the same batch as a goodbye.
VAR hub_quiet = false

// External variables
VAR player_name = "Agent 0x00"

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:trader

{first_meeting:
    ~ first_meeting = false

    #speaker:narrator
    Narrator: A young trader watches six price charts at once, placing the occasional order without appearing to look at it.

    Dani Okonkwo: You're the regulator, yeah? FCA?

    Dani Okonkwo: Don't worry, we're legit. Mostly.

    + [Mostly? That's an interesting qualifier.]
        Dani Okonkwo: Joking. It's all above board. Irina makes sure. Honestly. Ignore me.
        -> hub

    + [It's a standard audit. Nothing to worry about, if everything's compliant.]
        Dani Okonkwo: Course. Yeah. Shout if you need me.
        ~ hub_quiet = true
        -> hub

    + [What does this place actually do?]
        -> operations_overview
- else:
    Dani Okonkwo: Hi again. What's up?
    ~ hub_quiet = true
    -> hub
}

=== operations_overview ===
#speaker:trader

Dani Okonkwo: Mid-size exchange. Privacy coins, mostly. Monero, Zcash, that sort.

Dani Okonkwo: Fast, cheap, loads of volume. It's a tough market, to be fair.

+ [Why focus on privacy coins?]
    -> privacy_coin_focus

+ [What's the daily volume?]
    ~ topic_volume = true
    -> volume_discussion

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Dani Okonkwo: {&Anything else?|Go on, then.|What else?}
}

+ {not topic_volume} [Eight hundred million a day. Is that normal for you?]
    -> volume_discussion

+ {not topic_monero} [Why is so much of this in Monero?]
    -> monero_discussion

+ {not topic_irina} [What's Dr. Volkova like to work for?]
    -> irina_discussion

+ [That's all, thanks.]
    #speaker:trader
    Dani Okonkwo: Safe. Er, I mean, no problem.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// TRADING VOLUME
// ===========================================

=== volume_discussion ===
#speaker:trader
~ topic_volume = true

Dani Okonkwo: Eight, nine hundred million a day, dollar equivalent. Irina's kit holds up.

Dani Okonkwo: Mostly Bitcoin and Ethereum. Monero's gone mad lately though.

+ [Mad how?]
    -> monero_surge

+ [Busy, then.]
    Dani Okonkwo: Rammed. Everyone wants privacy coins this year.
    -> hub

=== monero_surge ===
#speaker:trader

Dani Okonkwo: Three, four times normal. Big wallets go Bitcoin to Monero, round the houses, back to Bitcoin.

Dani Okonkwo: Textbook mixing. Legal and that. But... yeah.

+ [Do you report that?]
    -> reporting_discussion

+ [Is that suspicious?]
    -> suspicious_activity

=== reporting_discussion ===
#speaker:trader

Dani Okonkwo: We flag everything. Irina looks at it and files reports when she has to.

Dani Okonkwo: We're compliant. We're just also, like, private. That's the brand.

-> hub

=== suspicious_activity ===
#speaker:trader

Dani Okonkwo: Depends on your perspective.

Dani Okonkwo: Some people want privacy. Some want to hide money. From a chart they look the same.

Dani Okonkwo: That's your job, innit?

-> hub

// ===========================================
// PRIVACY COIN FOCUS
// ===========================================

=== privacy_coin_focus ===
#speaker:trader
~ topic_monero = true

Dani Okonkwo: Satoshi's thing. "Financial freedom through cryptography." It's on the brochure.

Dani Okonkwo: Pay who you like without the government watching. Privacy's a right, he says.

+ [Sounds more like a religion than a business plan.]
    -> ideology_response

+ [Privacy also hides crime.]
    -> illegal_activity_response

=== ideology_response ===
#speaker:trader

Dani Okonkwo: Bit of both. Satoshi believes it, and it pays.

Dani Okonkwo: Privacy traders pay top fees. We do all right.

-> hub

=== illegal_activity_response ===
#speaker:trader

Dani Okonkwo: So does cash. You going to shut every bank because some people launder?

Dani Okonkwo: We follow the law. We file reports. After that it's their business. That's what I'm told.

-> hub

// ===========================================
// MONERO DISCUSSION
// ===========================================

=== monero_discussion ===
#speaker:trader
~ topic_monero = true

Dani Okonkwo: Monero can't be traced. That's the point of it.

Dani Okonkwo: Bitcoin, you can follow a wallet. Monero, you can't. Great for privacy. Great for laundering too, I suppose.

+ [Is this place being used to launder?]
    -> laundering_opinion

+ [How does the mixing work?]
    -> mixing_explanation

=== laundering_opinion ===
#speaker:trader

Dani Okonkwo: I mean... I don't ask. I just place trades.

Dani Okonkwo: Irina and Satoshi do compliance. I just watch the charts.

+ [You've noticed something, though.]
    -> trader_suspicions

+ [Fair enough.]
    -> hub

=== trader_suspicions ===
#speaker:trader
// Review M1: this is the "flagged the wallets" conversation the task names.
#complete_task:question_the_trader

Dani Okonkwo: *lowers voice* Between us? Some of it's weird. Big round sums going in late at night. Same wallets, same habit.

Dani Okonkwo: I put the wallet names in the daily report. It's on the desk. One's got "ENTROPY" right there in the address.

Dani Okonkwo: Flagged it to Irina. She said she's on it.

Dani Okonkwo: Honestly? I just want to keep my job and not think about it too hard.

-> hub

=== mixing_explanation ===
#speaker:trader

Dani Okonkwo: Bitcoin comes in. We turn it into Monero, bounce it round a few wallets, turn it back into Bitcoin somewhere new.

Dani Okonkwo: The chain sees Bitcoin in, Bitcoin out. The middle's dark. Totally legal. We say so on the website.

-> hub

// ===========================================
// IRINA DISCUSSION
// ===========================================

=== irina_discussion ===
#speaker:trader
~ topic_irina = true

Dani Okonkwo: Irina's scary clever. Like, proper PhD.

Dani Okonkwo: She wrote all our privacy stuff. Zero-knowledge proofs, homo-something encryption. Way over my head.

+ [Does she take compliance seriously?]
    -> irina_compliance

+ [Do you get on with her?]
    -> irina_impression

=== irina_compliance ===
#speaker:trader

Dani Okonkwo: Obsessively. Every flagged trade goes past her personally.

Dani Okonkwo: She's been stressed lately, mind. Something's bothering her. She won't say what.

-> hub

=== irina_impression ===
#speaker:trader

Dani Okonkwo: Intense. Bit distant. Fair, though.

Dani Okonkwo: She believes in the privacy thing. I think it gets to her, what people use it for.

-> hub
