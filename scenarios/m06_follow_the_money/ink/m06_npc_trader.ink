// ===========================================
// Mission 6: NPC - Crypto Trader
// Innocent employee, provides context
// ===========================================

VAR trader_talked = false
VAR topic_volume = false
VAR topic_monero = false
VAR topic_elena = false
VAR first_meeting = true

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

    Dani Okonkwo: Hey, you're the regulator, right? From the FCA?

    Dani Okonkwo: Don't worry, we're legit. Mostly. *grins*

    + [Mostly? That's an interesting qualifier.]
        Dani Okonkwo: *laughs* I'm kidding. Everything's above board. Irina makes sure of that.
        -> hub

    + [It's a standard audit. Nothing to worry about, if everything's compliant.]
        Dani Okonkwo: Cool cool. Let me know if you need anything.
        -> hub

    + [Tell me about the exchange's operations]
        -> operations_overview
}

{not first_meeting:
    Dani Okonkwo: What's up?
    -> hub
}

=== operations_overview ===
#speaker:trader

Dani Okonkwo: We're a mid-size crypto exchange. Focus on privacy coins. Monero, Zcash, stuff like that.

Dani Okonkwo: High volume, fast transactions, low fees. Competitive market.

+ [Why focus on privacy coins?]
    -> privacy_coin_focus

+ [What's the daily volume?]
    ~ topic_volume = true
    -> volume_discussion

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_volume} [Eight hundred million a day. Is that normal for you?]
    -> volume_discussion

+ {not topic_monero} [Why is so much of this in Monero?]
    -> monero_discussion

+ {not topic_elena} [What's Dr. Volkova like to work for?]
    -> elena_discussion

+ [That's all, thanks]
    #speaker:trader
    Dani Okonkwo: No problem. Happy trading!
    #exit_conversation
    -> hub

// ===========================================
// TRADING VOLUME
// ===========================================

=== volume_discussion ===
#speaker:trader
~ topic_volume = true

Dani Okonkwo: We're doing like $800-900 million USD equivalent per day.

Dani Okonkwo: Not bad for a mid-size exchange. Irina's infrastructure is solid.

Dani Okonkwo: Mostly Bitcoin, Ethereum, but the Monero volume has been crazy lately.

+ [Crazy how?]
    -> monero_surge

+ [That's impressive volume]
    Dani Okonkwo: Yeah, privacy coin demand is skyrocketing.
    -> hub

=== monero_surge ===
#speaker:trader

Dani Okonkwo: Like, 3-4x normal. Big wallets converting Bitcoin to Monero, mixing through multiple addresses, converting back.

Dani Okonkwo: Classic mixing pattern. Totally legal, but... yeah.

+ [You report these patterns?]
    -> reporting_discussion

+ [Is that suspicious?]
    -> suspicious_activity

=== reporting_discussion ===
#speaker:trader

Dani Okonkwo: Oh yeah, we flag everything. Irina runs analysis, files SARs when needed.

Dani Okonkwo: We're compliant. Just... we're also privacy-focused. That's our brand.

-> hub

=== suspicious_activity ===
#speaker:trader

Dani Okonkwo: *shrugs* Depends on your perspective.

Dani Okonkwo: Some people want financial privacy. Some want to hide money. Hard to tell which is which from transaction patterns.

Dani Okonkwo: That's your job, I guess. *gestures at you*

-> hub

// ===========================================
// PRIVACY COIN FOCUS
// ===========================================

=== privacy_coin_focus ===
#speaker:trader
~ topic_monero = true

Dani Okonkwo: Satoshi's philosophy. "Financial freedom through cryptography."

Dani Okonkwo: People should be able to transact without government surveillance. Privacy is a right.

+ [That sounds like ideology, not business]
    -> ideology_response

+ [Privacy can enable illegal activity]
    -> illegal_activity_response

=== ideology_response ===
#speaker:trader

Dani Okonkwo: It's both! Satoshi's a true believer, but it's also profitable.

Dani Okonkwo: Privacy coin traders pay premium fees. We make bank.

-> hub

=== illegal_activity_response ===
#speaker:trader

Dani Okonkwo: Sure. And regular currency enables illegal activity too.

Dani Okonkwo: You gonna shut down every bank because some people launder money?

Dani Okonkwo: We follow the law. We file reports. What people do with their privacy is their business.

-> hub

// ===========================================
// MONERO DISCUSSION
// ===========================================

=== monero_discussion ===
#speaker:trader
~ topic_monero = true

Dani Okonkwo: Monero's untraceable. That's the whole point.

Dani Okonkwo: Bitcoin is pseudonymous; you can track wallets. Monero is truly anonymous.

Dani Okonkwo: Makes it perfect for privacy. Also perfect for money laundering, I guess.

+ [Do you think the exchange is being used for money laundering?]
    -> laundering_opinion

+ [How does the mixing work?]
    -> mixing_explanation

=== laundering_opinion ===
#speaker:trader

Dani Okonkwo: *uncomfortable* I mean... I don't ask questions. I just execute trades.

Dani Okonkwo: Irina and Satoshi handle compliance. I'm just the guy watching charts.

+ [You must have suspicions]
    -> trader_suspicions

+ [Fair enough]
    -> hub

=== trader_suspicions ===
#speaker:trader
// Review M1: this is the "flagged the wallets" conversation the task names.
#complete_task:question_the_trader

Dani Okonkwo: *lowers voice* Between you and me? Some of the transaction patterns are... weird.

Dani Okonkwo: Like, coordinated. Multiple big wallets mixing at the same time, same amounts, same destination patterns.

Dani Okonkwo: I put the wallet names in the daily report and flagged it to Irina. It's on the desk. One of them has "ENTROPY" right there in the address. She said she's investigating.

Dani Okonkwo: But honestly? I just want to keep my job and not think about it too hard.

-> hub

=== mixing_explanation ===
#speaker:trader

Dani Okonkwo: User sends Bitcoin to us. We convert to Monero. Send through 5-10 different wallets.

Dani Okonkwo: Then convert back to Bitcoin from a completely unlinked address.

Dani Okonkwo: Blockchain shows Bitcoin in, Bitcoin out. But the Monero middle step? Untraceable.

Dani Okonkwo: Perfectly legal mixing service. We're transparent about it.

-> hub

// ===========================================
// IRINA DISCUSSION
// ===========================================

=== elena_discussion ===
#speaker:trader
~ topic_elena = true

Dani Okonkwo: Irina's brilliant. Like, PhD in cryptography brilliant.

Dani Okonkwo: She designed all our privacy protocols. Zero-knowledge proofs, homomorphic encryption...

Dani Okonkwo: Way above my pay grade. I just use the systems she builds.

+ [Does she seem concerned about compliance?]
    -> elena_compliance

+ [What's your impression of her?]
    -> elena_impression

=== elena_compliance ===
#speaker:trader

Dani Okonkwo: Obsessively. She reviews every flagged transaction personally.

Dani Okonkwo: Actually, she's been stressed lately. I think some of the activity patterns are bothering her.

Dani Okonkwo: But she hasn't said anything specific.

-> hub

=== elena_impression ===
#speaker:trader

Dani Okonkwo: Smart, intense, kinda distant. But fair.

Dani Okonkwo: She believes in what we're doing: financial privacy as a right.

Dani Okonkwo: I think she struggles with the fact that good tech can be used for bad things.

-> hub
