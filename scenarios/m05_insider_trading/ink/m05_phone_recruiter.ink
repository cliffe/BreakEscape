// ===========================================
// ACT 2/3 PHONE NPC: The Recruiter
// Mission 5: Insider Trading
// Break Escape - Antagonist, ENTROPY Insider Threat Initiative
// PASS 4 (dialogue): her own lines carry no prefix (phone convention).
// She keeps one rhetorical "not X, Y" (the final statement), as a villain's
// habit of speech.
// ===========================================

// Variables for tracking interactions
VAR recruiter_contacted_player = false
VAR recruiter_deal_offered = false
VAR recruiter_deal_decided = false   // global; set when she gets an answer (reload backstop, PASS 3)
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
// PASS 3 (implementation review M1): if the player confronted Torres before
// ringing her back, she knows it's over. Never play the pre-confrontation
// pitch (or let the deal be taken) after the fate is decided. Marking her
// contacted also stops the game_loaded backstop.
{final_choice != "":
    ~ recruiter_contacted_player = true
    -> post_confrontation_contact
}
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

{player_name}. Or whatever they're calling you this week.

I run TalentStack. Executive search, mostly technical roles.

You've spent the last few hours putting a name to one of my placements. I thought I'd save you wondering who I am.

David Torres. QD-001, if you prefer the file number.

~ recruiter_contacted_player = true

-> start_choices

=== start_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [You radicalised a man whose wife is dying.]
    I identified a man whose wife was dying, and offered him a way to keep paying for her treatment.
    You're describing the outcome as though I invented the cancer.
    -> recruiter_introduction

* [How many more "placements" do you have?]
    Forty-seven under evaluation, last I checked. Give or take. Torres was never the only iron in the fire.
    -> recruiter_introduction

* [Say nothing. Let her fill the silence.]
    You: ...
    Considered, agent. Most people open with an accusation. Very well. I'll carry both halves of the conversation.
    -> recruiter_introduction

=== recruiter_introduction ===
#speaker:recruiter

Everyone has a price. I call that an operating philosophy, and it has never once failed me.

The only variable is what currency they'll take.

Torres took debt relief and a standing consultancy retainer. Cheaper than most, if you're keeping score.

-> recruiter_introduction_choices

=== recruiter_introduction_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [You're talking about him like a receipt.]
    -> recruiter_line_item

* [What were you actually after?]
    -> recruiter_reveals_target

=== recruiter_line_item ===
#speaker:recruiter

He was a line item, agent. There are forty-seven more candidates in the pipeline right now.

I don't say that to be cruel. I say it because it's accurate, and accuracy is the only thing I owe you.

You'll want to feel sorry for him. Go ahead. It costs me nothing.

And it won't help the other forty-seven, unless you move faster than I do.

-> recruiter_reveals_target

=== recruiter_reveals_target ===
#speaker:recruiter

Project Heisenberg was never going to a foreign buyer. Nobody's shopping this around.

ENTROPY wants the key material and the rollout schedule for your national dispatch network. Nine-nine-nine call routing.

We keep it. We integrate it. That's the whole disposition.

-> recruiter_reveals_target_choices

=== recruiter_reveals_target_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [You're talking about ambulances. Fire crews. Police response times.]
    -> recruiter_confirms_casualties

* [Why does ENTROPY want control of emergency dispatch?]
    -> recruiter_confirms_casualties

=== recruiter_confirms_casualties ===
#speaker:recruiter

I'm talking about a forty-to-seventy-minute failover window during the key-rotation cutover, across twelve regions, in the first wave alone.

The Architect's office ran the numbers before signing off. Thirty to forty-five excess deaths, where minutes decide things: cardiac, stroke, structure fires.

It's filed as an acceptable cost of acquisition. I didn't file it. I just recruited the man who could get us the schedule.

~ recruiter_persuasion_attempted = true

-> recruiter_confirms_casualties_choices

=== recruiter_confirms_casualties_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [That number was known before Torres ever touched the data.]
    Known and signed. Yes.
    -> recruiter_deal

* [You're a fanatic dressed up as a headhunter.]
    I'm a recruiter who is very good at her job. Fanaticism is somebody else's department. I just staff the operation.
    -> recruiter_deal

// ===========================================
// THE DEAL
// ===========================================

=== recruiter_deal ===
#speaker:recruiter

Here's why I actually called. What you do with Torres doesn't much interest me. He's already spent.

But I'd rather you didn't spend the next six months chasing my other forty-seven.

Under Torres' keyboard there's an envelope addressed to a PO box in Reading. Forty-seven names.

{found_pipeline_list: You've already opened it, I expect.} Leave it out of your report. Let my courier have it.

In return, nothing in this operation points at you. No loose thread, no file with your face in it.

Everyone has a price, agent. I'm asking what yours is.

~ recruiter_deal_offered = true

-> recruiter_deal_choices

=== recruiter_deal_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [What exactly would "nothing points at me" cost me?]
    -> recruiter_deal_terms

* [I'm done talking. This call's over.]
    Time's short for both of us, then.
    #exit_conversation
    -> idle

=== recruiter_deal_terms ===
#speaker:recruiter

Nothing dramatic. You forget the number forty-seven. The envelope goes to Reading, not to your handler.

You get a clean report, a grateful handler, and one less thing keeping you up at night.

Most agents take that trade without needing it spelled out.

-> recruiter_deal_terms_choices

=== recruiter_deal_terms_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [Fine. The envelope goes to Reading. I never heard the number forty-seven.]
    -> recruiter_deal_taken

* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [No deal. Every one of those forty-seven is a name I'm going to find.]
    -> recruiter_deal_refused

=== recruiter_deal_taken ===
#speaker:recruiter
~ recruiter_deal_accepted = true
~ recruiter_deal_decided = true

Sensible. You get your clean report, and I get my quiet. That's the whole arrangement.

Do what you like with Torres. The other forty-seven were never your problem.

#speaker:narrator
Narrator: The line goes dead.

#exit_conversation
-> idle

=== recruiter_deal_refused ===
#speaker:recruiter
~ recruiter_deal_decided = true

Noted. For what it's worth, I expected it. Your file reads like someone who finishes what they start.

Understand what you're choosing, though. Forty-seven is a number that changes weekly.

You won't reach all of them before I've closed on a few more.

Good luck with Torres. He was cheap. The next one might cost me more, and I'll enjoy the work regardless.

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

Still deciding? The offer doesn't improve with age, agent.

Forty-seven names. One call from you protects them, or leaves them where they are. In my pipeline.

-> mid_mission_contact_choices

=== mid_mission_contact_choices ===
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
+ [I already told you. No deal.]
    Consistent. I can respect that, while I disagree with it.
    -> end_contact

+ [I'm going to find every one of them.]
    You're welcome to try. I have a considerable head start.
    -> end_contact

+ [I'm done talking. This call's over.]
    -> end_contact

=== post_confrontation_contact ===
#speaker:recruiter
{not recruiter_deal_offered:
    -> never_talked_terms
}

{recruiter_deal_accepted:
    -> deal_accepted_response
- else:
    -> deal_refused_response
}

=== deal_accepted_response ===
#speaker:recruiter

Sensible. The file's forgotten on my end too. As far as anyone official knows, this call never happened.

You'll sleep fine. Most people do, once they've priced it out.

-> deal_accepted_response_choices

=== deal_accepted_response_choices ===
+ [I'll live with it.]
    -> recruiter_final_statement

=== deal_refused_response ===
#speaker:recruiter

Torres is dealt with, one way or another, and you didn't take the trade. I respect that more than I expected to.

It changes nothing about the other forty-seven. I'll simply be more careful with whoever's next.

-> deal_refused_response_choices

=== deal_refused_response_choices ===
+ [There won't be a "next" if I have anything to do with it.]
    -> recruiter_final_statement

+ [You talk about people like inventory.]
    Inventory doesn't have a price, agent. People do. I've built a career on the difference.
    -> recruiter_final_statement

=== recruiter_final_statement ===
#speaker:recruiter

Here's what I'd like you to sit with, whatever you decided about Torres.

I didn't lie to him once. I told him exactly what he was trading, and what it would cost other people.

He signed anyway. Everyone I recruit signs anyway.

That's not a defence. It's the part nobody wants to hear: the price was real, and he still took it.

Forty-seven names, agent. The clock on those didn't stop because you found one of mine.

#speaker:narrator
Narrator: The line goes dead.

#exit_conversation
-> idle

// PASS 3 (implementation review M1): reachable from start when the player
// rings back only after the confrontation. No offer is made: the envelope's
// moment has passed.
=== never_talked_terms ===
#speaker:recruiter
{player_name}. Torres is dealt with, and we never did talk terms. Pity.
There was an envelope under his keyboard I'd have liked back. Whatever you did with it, the next one will cost me more.
#speaker:narrator
Narrator: The line goes dead.
#exit_conversation
-> idle

=== end_contact ===
#speaker:recruiter

Think it over. I'm not in a hurry.

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
{torres_identified: -> start}
#speaker:narrator
+ [No messages.]
    #exit_conversation
    -> not_yet
