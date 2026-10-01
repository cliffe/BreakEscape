// ===========================================
// Mission 6: NPC - Blockchain Analyst
// Technical expert, innocent employee
// ===========================================

VAR analyst_talked = false
VAR topic_forensics = false
VAR topic_patterns = false
VAR topic_concerns = false
VAR first_meeting = true

// External variables
VAR player_name = "Agent 0x00"

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:analyst

{first_meeting:
    ~ first_meeting = false

    #speaker:narrator
    Narrator: An analyst is bent over a wall-sized monitor, dragging nodes around a transaction graph and muttering at it.

    Priya Raghavan: *doesn't look up* If you're here about the flagged transactions, talk to Elena.

    Priya Raghavan: I just run the analysis. She makes the compliance decisions.

    + [Impressive setup. I'm with the FCA, just observing your process.]
        Priya Raghavan: *glances up* Oh. Compliance audit. Right.
        -> audit_response

    + [What transactions are you analysing?]
        -> transaction_work

    + [I'll talk to Elena then]
        Priya Raghavan: *already back to screens* Okay.
        #exit_conversation
        -> hub
}

{not first_meeting:
    Priya Raghavan: Need something?
    -> hub
}

=== audit_response ===
#speaker:analyst

Priya Raghavan: Thanks. I built most of this myself. Transaction graph analysis, wallet clustering algorithms.

Priya Raghavan: We track patterns that might indicate money laundering or sanctions violations.

+ [Do you find many violations?]
    -> violations_discussion

+ [Tell me about your methodology]
    -> methodology_discussion

=== transaction_work ===
#speaker:analyst

Priya Raghavan: Current project: mapping large-volume mixing patterns through our exchange.

Priya Raghavan: Multiple wallets converting to Monero simultaneously, similar amounts, coordinated timing.

+ [Is that suspicious?]
    -> suspicious_patterns

+ [What do the patterns show?]
    -> suspicious_patterns

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_forensics} [How does the forensics side of this work?]
    -> forensics_discussion

+ {not topic_patterns} [Has anything in the flow looked wrong to you?]
    -> pattern_concerns

+ {not topic_concerns} [Does any of this worry you?]
    -> personal_concerns

+ [Thanks for your time]
    #speaker:analyst
    Priya Raghavan: *already back to work* Uh-huh.
    #exit_conversation
    -> hub

// ===========================================
// FORENSICS DISCUSSION
// ===========================================

=== forensics_discussion ===
#speaker:analyst
~ topic_forensics = true

Priya Raghavan: Blockchain forensics is fascinating. Every transaction is public, but attribution is hard.

Priya Raghavan: You track wallet behaviours, cluster related addresses, analyse timing patterns.

Priya Raghavan: Like digital detective work. Follow the money across thousands of transactions.

+ [Can you trace privacy coins like Monero?]
    -> monero_forensics

+ [What patterns indicate illegal activity?]
    -> illegal_patterns

=== monero_forensics ===
#speaker:analyst

Priya Raghavan: Not really. Monero uses ring signatures and stealth addresses. Transactions are genuinely untraceable.

Priya Raghavan: That's why exchanges like ours are critical choke points. We see the conversion: Bitcoin in, Monero mix, Bitcoin out.

Priya Raghavan: Blockchain doesn't show the middle step, but our internal logs do.

+ [So you can map what the blockchain can't?]
    -> internal_logs_value

+ [That makes your logs valuable]
    -> internal_logs_value

=== internal_logs_value ===
#speaker:analyst

Priya Raghavan: Exactly. Our internal database is way more valuable than the public blockchain for forensics.

Priya Raghavan: Which is why Elena's so careful about access. If someone gets our logs, they can unmix transactions we've processed.

Priya Raghavan: Privacy customers would not be happy about that.

-> hub

=== illegal_patterns ===
#speaker:analyst

Priya Raghavan: High-volume mixing with no clear business purpose. Coordinated multi-wallet behaviours.

Priya Raghavan: Amounts just under reporting thresholds. Structuring. Rapid conversions avoiding single-transaction limits.

Priya Raghavan: And timing patterns. If multiple unrelated wallets mix simultaneously with similar amounts? Coordinated operation.

-> hub

// ===========================================
// VIOLATIONS DISCUSSION
// ===========================================

=== violations_discussion ===
#speaker:analyst

Priya Raghavan: We file SARs, Suspicious Activity Reports, pretty regularly.

Priya Raghavan: High-value privacy coin mixing attracts... a certain clientele.

Priya Raghavan: But most of it's legal. People have a right to financial privacy.

-> methodology_discussion

=== methodology_discussion ===
#speaker:analyst

Priya Raghavan: I run transaction graph analysis: map all connected wallets, identify clusters.

Priya Raghavan: Then timing analysis, looking for coordinated behaviour.

Priya Raghavan: Finally, amount analysis: large conversions, unusual patterns.

Priya Raghavan: Flag anything suspicious to Elena. She decides whether to file SARs or investigate deeper.

-> hub

// ===========================================
// SUSPICIOUS PATTERNS
// ===========================================

=== suspicious_patterns ===
#speaker:analyst

Priya Raghavan: *frowns* Yeah. Very.

Priya Raghavan: Multiple large wallets. Coordinated conversions. Consistent timing every Friday night.

Priya Raghavan: Amounts totalling... about $12-13 million over the past month.

+ [Where's the money going?]
    -> destination_discussion

+ [Have you reported this?]
    -> reporting_status

=== destination_discussion ===
#speaker:analyst

Priya Raghavan: That's the weird part. After mixing, it all reconverges to a single destination wallet.

Priya Raghavan: Different source wallets, different mixing paths, same destination.

Priya Raghavan: Either someone's consolidating funds from multiple sources, or...

+ [Or what?]
    -> coordinated_funding

+ [Did you flag this to Elena?]
    -> elena_flagging

=== coordinated_funding ===
#speaker:analyst

Priya Raghavan: Or it's coordinated funding for something. Multiple cells paying into a central operation.

Priya Raghavan: That's... that's the kind of pattern you see with organised crime or terrorism.

Priya Raghavan: I really hope Elena knows what she's doing with this investigation.

-> hub

=== elena_flagging ===
#speaker:analyst

Priya Raghavan: Yeah, like two weeks ago. She's been analysing it personally.

Priya Raghavan: Hasn't told me her conclusions yet. Just said to keep monitoring.

+ [Does she seem concerned?]
    -> elena_concern

+ [What's your read on it?]
    -> analyst_opinion

=== elena_concern ===
#speaker:analyst

Priya Raghavan: Hard to tell. Elena's always intense.

Priya Raghavan: But yeah, she's been stressed. Stays late, re-runs my analyses, asks detailed questions.

Priya Raghavan: Either she's being thorough, or something's really bothering her.

-> hub

=== analyst_opinion ===
#speaker:analyst

Priya Raghavan: *uncomfortable* Honestly? It looks bad.

Priya Raghavan: Coordinated mixing, consistent timing, large amounts, single destination...

Priya Raghavan: If I saw this pattern at any other exchange, I'd assume criminal network funding.

Priya Raghavan: But Satoshi says we're a legitimate business. Elena vouches for our compliance.

Priya Raghavan: So I'm trying not to jump to conclusions.

-> hub

=== reporting_status ===
#speaker:analyst

Priya Raghavan: Flagged to Elena. She's investigating.

Priya Raghavan: She hasn't filed an external SAR yet, which means either it's legitimate activity or she's gathering more evidence.

Priya Raghavan: I trust her judgement. She's way smarter than me.

-> hub

// ===========================================
// PATTERN CONCERNS
// ===========================================

=== pattern_concerns ===
#speaker:analyst
// Review M1: the "walk you through her graph" conversation the task names.
#complete_task:question_the_analyst
~ topic_patterns = true

Priya Raghavan: *pulls up a graph* Look at this. Five different source wallets.

Priya Raghavan: They convert to Monero on the same schedule. Mix through our infrastructure. Reconverge to one destination.

Priya Raghavan: Pattern repeats weekly. Like clockwork.

+ [What do you think it means?]
    -> pattern_interpretation

+ [Can you identify the source wallets?]
    -> source_identification

=== pattern_interpretation ===
#speaker:analyst

Priya Raghavan: My guess? Coordinated fundraising. Multiple revenue streams feeding a central operation.

Priya Raghavan: Could be legit. A distributed business with centralised accounting.

Priya Raghavan: Could be money laundering. A criminal network consolidating funds.

Priya Raghavan: Without knowing who controls the wallets, it's hard to say.

-> hub

=== source_identification ===
#speaker:analyst

Priya Raghavan: The addresses name themselves. Somebody paid for vanity wallets, "1ENTROPY" this and "1ARCHITECT" that. It's in my write-up on the desk.

Priya Raghavan: Who's actually behind them, I can't tell from the chain. Monero anonymisation is really good.

Priya Raghavan: Elena sees the customer records behind the addresses. I only see the patterns.

-> hub

// ===========================================
// PERSONAL CONCERNS
// ===========================================

=== personal_concerns ===
#speaker:analyst
~ topic_concerns = true

Priya Raghavan: *pauses work* You want my honest opinion?

Priya Raghavan: I love blockchain forensics. I love privacy technology. I believe in what we're supposed to be doing.

+ [But?]
    -> but_response

+ [What are you worried about?]
    -> worry_response

=== but_response ===
#speaker:analyst

Priya Raghavan: But some of these patterns scare me.

Priya Raghavan: I'm analysing transactions that might be funding... I don't know. Terrorism? Organized crime?

Priya Raghavan: And I tell myself it's not my job to judge. I'm just the analyst. Elena makes the decisions.

Priya Raghavan: But that feels like an excuse.

-> moral_conflict

=== worry_response ===
#speaker:analyst

Priya Raghavan: That we're not just providing privacy. We're providing cover.

Priya Raghavan: That our ideals about financial freedom are being exploited by people who... aren't idealists.

-> moral_conflict

=== moral_conflict ===
#speaker:analyst

Priya Raghavan: *looks at you* That's why you're here, isn't it? The FCA doesn't turn up at a mid-size exchange unless something's already been flagged.

Priya Raghavan: Someone thinks we're dirty.

+ [I can't comment on ongoing investigations]
    -> professional_response

+ [Do you think the exchange is being used illegally?]
    -> direct_question

=== professional_response ===
#speaker:analyst

Priya Raghavan: *laughs bitterly* Right. Professional.

Priya Raghavan: Well, when your investigation concludes, I hope you tell me whether I've been helping criminals.

Priya Raghavan: I'd like to know if my work has been... meaningful. Or just enabling.

#exit_conversation
-> hub

=== direct_question ===
#speaker:analyst

Narrator: She's quiet for a long moment.

Priya Raghavan: I think some of our customers are using our privacy infrastructure for things that would horrify me if I knew the details.

Priya Raghavan: I think Elena knows more than she's telling me.

Priya Raghavan: And I think Satoshi cares more about ideology than consequences.

Priya Raghavan: So yeah. Probably.

#exit_conversation
-> hub
