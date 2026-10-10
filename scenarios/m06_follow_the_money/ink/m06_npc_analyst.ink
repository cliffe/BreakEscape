// ===========================================
// Mission 6: NPC - Blockchain Analyst
// Technical expert, innocent employee
//
// PASS 4 (design, fix 1): Priya teaches the follow-the-money method (amount
// and timing correlation across the mixer) in mixer_matching, a sticky hub
// option so it can be asked again. Her write-up no longer names the fund.
// ===========================================

VAR analyst_talked = false
VAR topic_forensics = false
VAR topic_patterns = false
VAR topic_concerns = false
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
#speaker:analyst

{first_meeting:
    ~ first_meeting = false

    #speaker:narrator
    Narrator: An analyst is bent over a wall-sized monitor, dragging nodes around a transaction graph and muttering at it.

    Priya Raghavan: *doesn't look up* If you're here about the flagged transactions, talk to Irina.

    Priya Raghavan: I just draw the pictures. She decides what they mean.

    + [That's quite a setup. I'm FCA. I'd like to see how you work.]
        Priya Raghavan: Oh. The regulator. Right, yeah.
        -> audit_response

    + [What transactions are you analysing?]
        -> transaction_work

    + [I'll find Dr Volkova, then.]
        Priya Raghavan: Cheers.
        ~ hub_quiet = true
        #exit_conversation
        -> hub
- else:
    Priya Raghavan: Need something?
    ~ hub_quiet = true
    -> hub
}

=== audit_response ===
#speaker:analyst

Priya Raghavan: Built most of it myself, me. Graphs, wallet clustering, the lot.

Priya Raghavan: It flags anything that looks like laundering or sanctions dodging.

+ [Does it flag much?]
    -> violations_discussion

+ [How do you actually work a case?]
    -> methodology_discussion

=== transaction_work ===
#speaker:analyst

Priya Raghavan: Big money through our mixer. Big round sums, always late in the evening.

+ [That sounds suspicious.]
    Priya Raghavan: Yeah. Very.
    -> suspicious_patterns

+ [Show me.]
    Priya Raghavan: *swings the monitor round* Here, look.
    -> suspicious_patterns

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Priya Raghavan: {&What else?|Go on.|Anything else?}
}

+ {not topic_forensics} [How does the forensics side of this work?]
    -> forensics_discussion

+ {not topic_patterns} [Has anything in the flow looked wrong to you?]
    -> pattern_concerns

+ {not topic_concerns} [Does any of this worry you?]
    -> personal_concerns

+ [How would you follow money through a mixer?]
    -> mixer_matching

+ [Thanks for your time.]
    #speaker:analyst
    Priya Raghavan: Mm. Ta.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// FORENSICS DISCUSSION
// ===========================================

=== forensics_discussion ===
#speaker:analyst
~ topic_forensics = true

Priya Raghavan: Oh, it's brilliant. Every transaction's public. Knowing whose it is, that's the hard bit.

Priya Raghavan: You watch how wallets behave, group the ones that move together, and line up the timings.

+ [Can you trace privacy coins like Monero?]
    -> monero_forensics

+ [What patterns indicate illegal activity?]
    -> illegal_patterns

=== monero_forensics ===
#speaker:analyst

Priya Raghavan: Not from outside. Ring signatures, stealth addresses. It's a black box.

Priya Raghavan: But we're the door either side of it. Bitcoin in, Monero in the middle, Bitcoin out.

Priya Raghavan: The chain can't see the middle. Our own logs can.

+ [So your logs can see what the chain can't?]
    Priya Raghavan: Pretty much.
    -> internal_logs_value

+ [Then whoever has your logs has everything.]
    Priya Raghavan: Yeah. Don't put that in your report.
    -> internal_logs_value

=== internal_logs_value ===
#speaker:analyst

Priya Raghavan: With our logs you can unmix anything we've ever processed.

Priya Raghavan: Which is why Irina guards them like a dragon. Privacy customers would riot.

-> hub

=== illegal_patterns ===
#speaker:analyst

Priya Raghavan: Big mixing with no business reason. Amounts sitting just under the reporting line.

Priya Raghavan: And timing. Unrelated wallets that mix at the same time, same sort of amount? They aren't unrelated.

-> hub

// ===========================================
// VIOLATIONS DISCUSSION
// ===========================================

=== violations_discussion ===
#speaker:analyst

Priya Raghavan: We file suspicious activity reports most weeks.

Priya Raghavan: Privacy mixing gets a certain clientele. Most of it's legal, mind.

-> methodology_discussion

=== methodology_discussion ===
#speaker:analyst

Priya Raghavan: Map who's connected to who, then check whether they move at the same times, then look at the amounts.

Priya Raghavan: Anything odd goes to Irina. She decides what gets reported.

-> hub

// ===========================================
// SUSPICIOUS PATTERNS
// ===========================================

=== suspicious_patterns ===
#speaker:analyst

Priya Raghavan: Big round sums, late evening, straight into the mixer. Same habit every time.

Priya Raghavan: Three of them have names on. Another twelve million or so since January hasn't.

+ [Where's the money going?]
    -> destination_discussion

+ [Have you reported this?]
    -> reporting_status

=== destination_discussion ===
#speaker:analyst

Priya Raghavan: That's the weird bit. I lose it in the mixer. But the shape says it all ends up in one place.

Priya Raghavan: Different wallets in, and I'd bet one wallet out. Either someone's pooling it, or...

+ [Or what?]
    -> coordinated_funding

+ [Did you flag this to Irina?]
    -> irina_flagging

=== coordinated_funding ===
#speaker:analyst

Priya Raghavan: Or lots of little groups are paying into one big one.

Priya Raghavan: That's the shape you get with organised crime. Or worse.

Priya Raghavan: I hope Irina knows what she's doing with it.

-> hub

=== irina_flagging ===
#speaker:analyst

Priya Raghavan: Fortnight ago. She took it off me and did it herself.

Priya Raghavan: Hasn't said what she found. Just "keep watching".

+ [Does she seem concerned?]
    -> irina_concern

+ [What's your read on it?]
    -> analyst_opinion

=== irina_concern ===
#speaker:analyst

Priya Raghavan: Hard to tell. Irina's always intense.

Priya Raghavan: But she's been here till all hours, re-running my work. Either she's thorough or it's eating her.

-> hub

=== analyst_opinion ===
#speaker:analyst

Priya Raghavan: It looks bad.

Priya Raghavan: Anywhere else, I'd call it a criminal network paying itself.

Priya Raghavan: But Satoshi says we're legit, and Irina signs off our compliance. So I'm trying not to jump.

-> hub

=== reporting_status ===
#speaker:analyst

Priya Raghavan: Flagged to Irina. She hasn't sent anything outside yet.

Priya Raghavan: So either it's fine or she's building a case. She's cleverer than me, so I trust her. Mostly.

-> hub

// ===========================================
// PATTERN CONCERNS
// ===========================================

=== pattern_concerns ===
#speaker:analyst
// Review M1: the "walk you through her graph" conversation the task names.
#complete_task:question_the_analyst
#set_variable:analyst_walked_through=true
~ topic_patterns = true

Priya Raghavan: *pulls up a graph* Look at this. Three wallets with names, plus a load without.

Priya Raghavan: Into our mixer on a schedule, out the other side. And I'd swear it lands in the same place.

+ [What do you think it means?]
    -> pattern_interpretation

+ [Can you identify the source wallets?]
    -> source_identification

=== pattern_interpretation ===
#speaker:analyst

Priya Raghavan: Lots of income streams feeding one pot. Could be a business with one accounts team.

Priya Raghavan: Could be a criminal network pooling its money. Depends who owns the wallets.

-> hub

=== source_identification ===
#speaker:analyst

Priya Raghavan: They name themselves! Somebody paid for vanity wallets with ENTROPY in the address.

Priya Raghavan: It's all in my write-up on the desk. Take it.

Priya Raghavan: Where it lands, the chain can't tell me. Somewhere in our own cold slots.

Priya Raghavan: Irina sees who's behind the addresses. I just see shapes.

-> hub

// ===========================================
// MIXER MATCHING (PASS 4 fix 1: the method)
// ===========================================

=== mixer_matching ===
#speaker:analyst
// Round 2 (m7): teaching the method is walking you through her graph.
#complete_task:question_the_analyst

Priya Raghavan: You can't see through Monero. You don't need to. Watch what goes in and what comes out.

Priya Raghavan: The pool takes a cut and holds every coin a minimum time. So money comes out a bit lighter, and never early.

Priya Raghavan: Same amount less the cut, after the hold, that's a match. Same slot three times, that's your wallet.

Priya Raghavan: The cut, the hold and the credits are on the transaction server in the data centre. I'm not allowed in. A regulator might be.

-> hub

// ===========================================
// PERSONAL CONCERNS
// ===========================================

=== personal_concerns ===
#speaker:analyst
~ topic_concerns = true

Priya Raghavan: I love this job. I love privacy tech. I believe in what we're meant to be doing.

+ [But?]
    -> but_response

+ [What's keeping you up?]
    -> worry_response

=== but_response ===
#speaker:analyst

Priya Raghavan: But some of these patterns frighten me. I might be drawing graphs of something awful.

Priya Raghavan: And I tell myself it's Irina's call. I'm just the analyst.

Priya Raghavan: That's starting to sound like an excuse.

-> moral_conflict

=== worry_response ===
#speaker:analyst

Priya Raghavan: That we sell privacy and some customers are buying cover.

Priya Raghavan: And they're not idealists.

-> moral_conflict

=== moral_conflict ===
#speaker:analyst

Priya Raghavan: That's why you're here, isn't it? The FCA doesn't turn up at a place our size for nowt.

Priya Raghavan: Someone thinks we're dirty.

+ [I can't talk about that.]
    -> professional_response

+ [You tell me. Is it?]
    -> direct_question

=== professional_response ===
#speaker:analyst

Priya Raghavan: *laughs bitterly* Right. Professional.

Priya Raghavan: When you're done, tell me whether I've been helping criminals. I'd like to know what I've been drawing.

~ hub_quiet = true

#exit_conversation
-> hub

=== direct_question ===
#speaker:analyst

Narrator: She's quiet for a long moment.

Priya Raghavan: I think some customers would horrify me if I knew the details. I think Irina knows more than she says.

Priya Raghavan: And I think Satoshi cares more about his ideas than what they cost. So, yeah. Probably.

~ hub_quiet = true

#exit_conversation
-> hub
