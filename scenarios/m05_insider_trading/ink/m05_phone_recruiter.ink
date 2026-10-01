// ===========================================
// ACT 2/3 PHONE NPC: The Recruiter
// Mission 5: Insider Trading
// Break Escape - Antagonist, ENTROPY Insider Threat Initiative
// ===========================================

// Variables for tracking interactions
VAR recruiter_contacted_player = false
VAR recruiter_deal_offered = false
VAR recruiter_persuasion_attempted = false

// Variables synced from globalVars by engine at call-open
VAR final_choice = ""
VAR recruiter_deal_accepted = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR found_pipeline_list = false

// PASS 2: never reaches DONE (lesson 21). Every exit goes to `idle`,
// whose sticky choices let the player ring her back. Return-contact
// choices are sticky (+) so a second call can't starve.

// ===========================================
// INITIAL CONTACT (torres_identified)
// ===========================================

=== start ===
// Review B2: never play the first call before Torres is named, even if
// something runs this knot early (the phone preloads listed contacts).
{not torres_identified:
    -> not_yet
}

// Playtest D2: route on whether the DEAL was made, not on whether the call
// started. In run 1 the naming conversation's close fired twice, a second
// jump to `start` landed after the first had set recruiter_contacted_player,
// and the player got "Still deciding?" with no offer ever made. Replaying
// the intro is harmless; skipping the offer is not.
{recruiter_deal_offered:
    -> return_contact
}

#speaker:narrator
Narrator: Caller ID: TALENTSTACK EXECUTIVE RECRUITING.

#speaker:recruiter

The Recruiter: {player_name}. Or whatever they're calling you this week.

The Recruiter: I run TalentStack. Executive search, mostly technical roles. You've spent the last few hours putting a name to one of my placements, so I thought I'd save you the trouble of wondering who I am.

The Recruiter: David Torres. QD-001, if you prefer the file number.

~ recruiter_contacted_player = true

* [You radicalised a man whose wife is dying.]
    The Recruiter: I identified a man whose wife was dying and offered him a way to keep paying for her treatment. You're describing the outcome as though I invented the cancer.
    -> recruiter_introduction

* [How many more "placements" do you have?]
    The Recruiter: Forty-seven under evaluation, last I checked. Give or take. Torres was never the only iron in the fire.
    -> recruiter_introduction

* [Say nothing. Let her fill the silence.]
    You: ...
    The Recruiter: Considered, agent. Most people open with an accusation. Very well -- I'll carry both halves of the conversation.
    -> recruiter_introduction

=== recruiter_introduction ===
#speaker:recruiter

The Recruiter: Every person has a price. That isn't cynicism, it's an operating philosophy, and it has never once failed me. The only variable is what currency they'll take.

The Recruiter: Torres took debt relief and a standing consultancy retainer. Cheaper than most, if you're keeping score.

* [He's not a "line item." He's a person.]
    -> recruiter_line_item

* [What was in it for QDC? What were you actually after?]
    -> recruiter_reveals_target

=== recruiter_line_item ===
#speaker:recruiter

The Recruiter: He was a line item. There are forty-seven more candidates in the pipeline right now.

The Recruiter: I don't say that to be cruel. I say it because it's accurate, and accuracy is the only thing I owe you.

The Recruiter: You'll want to feel sorry for him. Go ahead. It doesn't cost me anything, and it won't change what happens to the other forty-seven if you don't move faster than I do.

-> recruiter_reveals_target

=== recruiter_reveals_target ===
#speaker:recruiter

The Recruiter: Project Heisenberg was never going to a foreign buyer. Nobody's shopping this around. ENTROPY wants the quantum-safe key material and the rollout schedule for the National Emergency-Services Dispatch Network. Nine-nine-nine call routing.

The Recruiter: We keep it. We integrate it. That's the whole disposition.

* [You're talking about ambulances. Fire crews. Police response times.]
    -> recruiter_confirms_casualties

* [Why does ENTROPY want control of emergency dispatch?]
    -> recruiter_confirms_casualties

=== recruiter_confirms_casualties ===
#speaker:recruiter

The Recruiter: I'm talking about a forty-to-seventy-minute failover window during the key-rotation cutover, across twelve regions, in the first wave alone.

The Recruiter: The Architect's office ran the numbers before signing off. Thirty to forty-five excess deaths, concentrated where minutes actually decide things -- cardiac, stroke, structure fires.

The Recruiter: It's filed as an acceptable cost of acquisition. I didn't file it. I just recruited the man who could get us the schedule.

~ recruiter_persuasion_attempted = true

* [That number was known before Torres ever touched the data.]
    The Recruiter: Known and signed. Yes.
    -> recruiter_deal

* [You're a fanatic dressed up as a headhunter.]
    The Recruiter: I'm a recruiter who is very good at her job. Fanaticism is somebody else's department -- I just staff the operation.
    -> recruiter_deal

// ===========================================
// THE DEAL
// ===========================================

=== recruiter_deal ===
#speaker:recruiter

The Recruiter: Here's why I actually called.

The Recruiter: You're going to confront Torres. Whatever you decide about him doesn't much interest me -- he's already spent. But I'd rather you didn't spend the next six months chasing my other forty-seven candidates.

The Recruiter: Under Torres' keyboard there's an envelope addressed to a PO box in Reading. Forty-seven names. {found_pipeline_list: You've already opened it, I expect.} Leave it out of your report. Let my courier have it.

The Recruiter: In return, nothing in this operation points at you personally. No loose thread, no file with your face in it, no complications on your next job.

The Recruiter: Every person has a price, agent. I'm asking what yours is.

~ recruiter_deal_offered = true

* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [What exactly would "nothing points at me" cost me?]
    -> recruiter_deal_terms

* [I'm done talking. This call's over.]
    The Recruiter: Time's short for both of us, then.
    #exit_conversation
    -> idle

=== recruiter_deal_terms ===
#speaker:recruiter

The Recruiter: Nothing dramatic. You forget the number forty-seven. The envelope goes to Reading, not to your handler.

The Recruiter: In exchange, you get a clean report, a grateful handler, and one fewer thing keeping you up at night. Most agents take that trade without needing it spelled out.

* [Fine. The envelope goes to Reading. I never heard the number forty-seven.]
    -> recruiter_deal_taken

* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [No deal. Every one of those forty-seven is a name I'm going to find.]
    -> recruiter_deal_refused

=== recruiter_deal_taken ===
#speaker:recruiter
~ recruiter_deal_accepted = true

The Recruiter: Sensible. You'll get your clean report, and I'll get my quiet. That's the whole of the arrangement.

The Recruiter: Handle Torres however suits you. The other forty-seven were never your problem to begin with.

#speaker:narrator
Narrator: The line goes dead.

#exit_conversation
-> idle

=== recruiter_deal_refused ===
#speaker:recruiter

The Recruiter: Noted. For what it's worth, that's what I expected -- your file reads as somebody who finishes what they start.

The Recruiter: Understand what you're choosing, though. Forty-seven candidates is a number that changes weekly. You won't reach all of them before I've closed on a few more.

The Recruiter: Good luck with Torres. He was cheap. The next one might cost me more, and I'll enjoy the work regardless.

~ recruiter_deal_accepted = false
#speaker:narrator
Narrator: The line goes dead.

#exit_conversation
-> idle

// ===========================================
// RETURN CONTACT (After first call)
// ===========================================

=== return_contact ===
#speaker:recruiter

{final_choice != "":
    -> post_confrontation_contact
- else:
    -> mid_mission_contact
}

=== mid_mission_contact ===
#speaker:recruiter
{not recruiter_deal_offered:
    -> recruiter_deal
}

The Recruiter: Still deciding? The offer doesn't improve with age, agent.

The Recruiter: Forty-seven names. One phone call from you either protects them or leaves them exactly where they are -- in my pipeline.

+ [I already told you. No deal.]
    The Recruiter: Consistent. I can respect that, even while I disagree with it.
    -> end_contact

+ [I'm going to find every one of them.]
    The Recruiter: You're welcome to try. I have a considerable head start.
    -> end_contact

+ [I'm done talking. This call's over.]
    -> end_contact

=== post_confrontation_contact ===
#speaker:recruiter
{not recruiter_deal_offered:
    The Recruiter: Torres is dealt with, and we never did talk terms. Pity. The next one will cost me more.
    -> end_contact
}

{recruiter_deal_accepted:
    -> deal_accepted_response
- else:
    -> deal_refused_response
}

=== deal_accepted_response ===
#speaker:recruiter

The Recruiter: Sensible. The file's forgotten on my end too -- as far as anyone official is concerned, this call never happened.

The Recruiter: You'll sleep fine. Most people do, once they've priced it out.

+ [I'll live with it.]
    -> recruiter_final_statement

=== deal_refused_response ===
#speaker:recruiter

The Recruiter: Torres is dealt with, one way or another, and you didn't take the trade. I respect that more than I expected to.

The Recruiter: It changes nothing about the other forty-seven. I'll simply be more careful with whoever's next.

+ [There won't be a "next" if I have anything to do with it.]
    -> recruiter_final_statement

+ [You talk about people like inventory.]
    The Recruiter: Inventory doesn't have a price, agent. People do. That's the entire distinction I've built a career on.
    -> recruiter_final_statement

=== recruiter_final_statement ===
#speaker:recruiter

The Recruiter: Here's what I'd like you to sit with, whatever you decided about Torres.

The Recruiter: I didn't lie to him once. I told him exactly what he was trading and exactly what it would cost other people. He signed anyway. Everyone I recruit signs anyway.

The Recruiter: That's not a defence. It's just the part nobody wants to hear -- that the price was real, and he still took it.

The Recruiter: Forty-seven names, agent. The clock on those didn't stop because you found one of mine.

#speaker:narrator
Narrator: The line goes dead.

#exit_conversation
-> idle

=== end_contact ===
#speaker:recruiter

The Recruiter: Think it over. I'm not in a hurry.

#speaker:narrator
Narrator: She hangs up first.

#exit_conversation
-> idle

// ===========================================
// RESTING KNOT
// ===========================================

=== idle ===
#speaker:narrator
+ [Ring the TalentStack number back.]
    -> return_contact
+ [Leave it.]
    #exit_conversation
    -> idle

// Resting knot before Torres is named. Never reached in normal play; the
// Recruiter is off the phone's contact list until a mapping calls her.
=== not_yet ===
#speaker:narrator
+ [No messages.]
    #exit_conversation
    -> not_yet
