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

// Variables synced from globalVars by engine at call-open
VAR final_choice = ""
VAR recruiter_deal_accepted = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR found_pipeline_list = false
// Blind run A (2026-10-16, m2): after her last word the ring-back is gone, so
// choosing it again doesn't replay a call the phone already shows.
VAR recruiter_line_dead = false

// Phone-calls M5: engine-written call VARs (2.11) and the cross-caller de-dup (M1).
VAR call_answer_seconds = 0
VAR call_is_callback = false
// Synced scenario global: set by HaX's topic_architect_choices once the player has heard the
// casualty projection from her. The Recruiter branches on it so she doesn't repeat HaX (M1).
VAR architect_discussed = false
// Local (m3): true once she is rung back, so recruiter_deal opens "Since you've rung...".
VAR player_rang = false

// Phone-calls M5: the call knots now end #exit_conversation then -> DONE. The engine moves the story
// to the home knot `start` after the call, and the green Call button (the `call` entry, return_contact)
// rings her back. The old "never reaches DONE, every exit goes to idle" rule is gone.

// ===========================================
// INITIAL CONTACT (torres_identified)
// ===========================================

// Phone-calls M5 (Recruiter). Her first contact is a ringing call now, opened on `first_call` (the
// ring mapping's targetKnot). Ringing her back is the green Call button (the `call` entry, knot
// return_contact, when !recruiter_line_dead; unavailable:"no_answer"). The call knots (first_call,
// return_contact and everything they reach up to the deal flow) end `#exit_conversation` then `-> DONE`;
// the engine moves the story to the home knot `start` after a call, and the "Call ended" screen replaces
// the old "line goes dead" / "hangs up first" narration. `start` is a silent by-hand resting router.

=== start ===
// Home router (opened by hand). Never routes into a call knot as silent text -- it only rests.
{not torres_identified: -> not_yet}
-> idle

// ===========================================
// FIRST CALL (incoming ring, targetKnot: first_call)
// ===========================================

=== first_call ===
// lint: call-knot
// The call screen shows the caller, so the "Caller ID" narration is dropped. Playtest history
// (preserved): never play the pre-confrontation pitch once the fate is decided, and never replay the
// intro once the deal has been offered -- a callback after either skips straight to the right knot.
{final_choice != "":
    ~ recruiter_contacted_player = true
    -> post_confrontation_contact
}
{recruiter_deal_offered:
    -> return_contact
}
#speaker:recruiter

{call_is_callback:
    You rang back. Manners, or curiosity?
}
{call_answer_seconds > 10:
    Take your time. Patience is most of my job.
}
Agent. Or whatever they're calling you this week.

I run TalentStack. You've spent tonight putting a name to one of my placements. David Torres.

~ recruiter_contacted_player = true

-> start_choices

=== start_choices ===
// lint: call-knot
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
// lint: call-knot
#speaker:recruiter

Torres took debt relief and a standing consultancy retainer. Cheaper than most, if you're keeping score.

-> recruiter_introduction_choices

=== recruiter_introduction_choices ===
// lint: call-knot
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [You're talking about him like a receipt.]
    -> recruiter_line_item

* [What were you actually after?]
    -> recruiter_reveals_target

=== recruiter_line_item ===
// lint: call-knot
#speaker:recruiter

He was a line item, agent. There are more like him in the pipeline right now.

You'll want to feel sorry for him. Go ahead. It costs me nothing.

-> recruiter_reveals_target

=== recruiter_reveals_target ===
// lint: call-knot
#speaker:recruiter

ENTROPY wants the key material and the rollout schedule for your national dispatch network. Nine-nine-nine call routing.

We keep it. We integrate it. Operation Schrödinger, if your file needs a name.

-> recruiter_reveals_target_choices

=== recruiter_reveals_target_choices ===
// lint: call-knot
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [You're talking about ambulances. Fire crews. Police response times.]
    -> recruiter_confirms_casualties

* [Why does ENTROPY want control of emergency dispatch?]
    // Phase 4 dialogue C1 (D5-24): this choice gets its own answer first.
    Control? Nobody wants to run it. We want the minutes.
    -> recruiter_confirms_casualties

=== recruiter_confirms_casualties ===
// lint: call-knot
#speaker:recruiter

// M1: if the player has already heard the projection from HaX (architect_discussed), she says it once;
// otherwise she delivers it in full. HaX gates her own casualty topic on the same global.
{architect_discussed:
    You've read the projection, then. I didn't file it. I just recruited the man who could get us the schedule.
- else:
    A forty-to-seventy-minute failover window at the cutover, across twelve regions: thirty to forty-five excess deaths, where minutes decide things.
    The Architect's office signed it off as an acceptable cost. I didn't file it. I recruited the man who could get us the schedule.
}

-> recruiter_confirms_casualties_choices

=== recruiter_confirms_casualties_choices ===
// lint: call-knot
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
// lint: call-knot
#speaker:recruiter

// m3: "Since you've rung..." when the player rang her back; else "Here's why I actually called."
{player_rang:
    Since you've rung, here's what I wanted. What you do with Torres doesn't much interest me. He's already spent.
- else:
    Here's why I actually called. What you do with Torres doesn't much interest me. He's already spent.
}

Under Torres' keyboard there's an envelope addressed to a PO box in Reading. Forty-seven names.

// m5: the found_pipeline_list alternative is a whole-line branch now (3.6, no inline alternatives in
// voiced lines); the old "In return, nothing points at you" line is folded in.
{found_pipeline_list:
    You've already opened it, I expect. Leave it out of your report, let my courier have it, and nothing points at you.
- else:
    Leave it out of your report, let my courier have it, and nothing in this operation points at you.
}

Everyone has a price, agent. I'm asking what yours is.

~ recruiter_deal_offered = true

-> recruiter_deal_choices

=== recruiter_deal_choices ===
// lint: call-knot
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [What exactly would "nothing points at me" cost me?]
    -> recruiter_deal_terms

* [I'm done talking. This call's over.]
    Time's short for both of us, then.
    #exit_conversation
    -> DONE

=== recruiter_deal_terms ===
// lint: call-knot
#speaker:recruiter

Nothing dramatic. You forget the envelope. It goes to Reading, not to your handler.

You get a clean report, a grateful handler, and one less thing keeping you up at night.

-> recruiter_deal_terms_choices

=== recruiter_deal_terms_choices ===
// lint: call-knot
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
* [Fine. The envelope goes to Reading. I never saw it.]
    -> recruiter_deal_taken

* [Not interested. That list is going to SAFETYNET.]
    -> recruiter_deal_refused

* [No deal. Every one of those forty-seven is a name I'm going to find.]
    -> recruiter_deal_refused

=== recruiter_deal_taken ===
// lint: call-knot
#speaker:recruiter
~ recruiter_deal_accepted = true
~ recruiter_deal_decided = true

Sensible. You get your clean report, and I get my quiet. That's the whole arrangement.

Do what you like with Torres. The other forty-seven were never your problem.

#exit_conversation
-> DONE

=== recruiter_deal_refused ===
// lint: call-knot
#speaker:recruiter
~ recruiter_deal_decided = true

Noted. For what it's worth, I expected it. Your file reads like someone who finishes what they start.

You won't reach all of them before I've closed on a few more.

~ recruiter_deal_accepted = false
#exit_conversation
-> DONE

// ===========================================
// RETURN CONTACT (After first call)
// ===========================================

=== return_contact ===
// lint: call-knot
// The ring-back call entry (the `call` entry's knot, dialled by the Call button when !recruiter_line_dead).
// m3: she knows the player rang this time, so recruiter_deal opens "Since you've rung...".
~ player_rang = true
#speaker:recruiter

{final_choice != "":
    -> post_confrontation_contact
- else:
    -> mid_mission_contact
}

=== mid_mission_contact ===
// lint: call-knot
#speaker:recruiter
{not recruiter_deal_offered:
    -> recruiter_deal
}
// Scenario design R1 (m4): an answer already given is remembered.
{recruiter_deal_accepted:
    We have an arrangement. Don't ring this number again.
    -> hangs_up
}
{recruiter_deal_decided:
    You said no once. I heard you.
    -> hangs_up
}

Still deciding? The offer doesn't improve with age, agent.

Forty-seven names. One call from you protects them, or leaves them where they are. In my pipeline.

-> mid_mission_contact_choices

=== mid_mission_contact_choices ===
// lint: call-knot
// Playtest 3b: a reopened chat re-navigates here (E10); never resume a pre-confrontation menu once the fate is set.
{final_choice != "": -> post_confrontation_contact}
// Phase 4 dialogue C1 (D5-5): a player who hung up on the offer has given no
// answer. A refusal here is recorded, so the debrief agrees with it, and the
// deal can still be taken by hearing the terms again.
+ [No deal.]
    ~ recruiter_deal_decided = true
    Then we're done. I'll close your file.
    -> hangs_up

+ [Run the terms past me again.]
    -> recruiter_deal_terms

+ [I'm done talking. This call's over.]
    -> end_contact

=== post_confrontation_contact ===
// lint: call-knot
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
// lint: call-knot
#speaker:recruiter

We're square, then. The file's forgotten on my end too.

You'll sleep fine. Most people do, once they've priced it out.

-> deal_accepted_response_choices

=== deal_accepted_response_choices ===
// lint: call-knot
+ [I'll live with it.]
    -> recruiter_final_statement

=== deal_refused_response ===
// lint: call-knot
#speaker:recruiter

Torres is dealt with, one way or another, and you didn't take the trade. I respect that more than I expected to.

It changes nothing about the rest. I'll simply be more careful with whoever's next.

-> deal_refused_response_choices

=== deal_refused_response_choices ===
// lint: call-knot
+ [There won't be a "next" if I have anything to do with it.]
    -> recruiter_final_statement

+ [You talk about people like inventory.]
    Inventory doesn't have a price, agent. People do. I've built a career on the difference.
    -> recruiter_final_statement

=== recruiter_final_statement ===
// lint: call-knot
#speaker:recruiter

I didn't lie to him once. I told him exactly what he was trading, and what it would cost other people.

That's not a defence. It's the part nobody wants to hear: the price was real, and he still took it.

Forty-seven names, agent. The clock on those didn't stop because you found one of mine.

~ recruiter_line_dead = true
#exit_conversation
-> DONE

// PASS 3 (implementation review M1): reachable from start when the player
// rings back only after the confrontation. No offer is made: the envelope's
// moment has passed.
=== never_talked_terms ===
// lint: call-knot
#speaker:recruiter
Agent. Torres is dealt with, and we never did talk terms. Pity.
There was an envelope under his keyboard I'd have liked back. Whatever you did with it, the next one will cost me more.
~ recruiter_line_dead = true
#exit_conversation
-> DONE

// Scenario design R2 (R2-m1): the ring-back answers close without "Think it over".
=== hangs_up ===
// lint: call-knot
#exit_conversation
-> DONE

=== end_contact ===
// lint: call-knot
#speaker:recruiter

Think it over. Quickly.

#exit_conversation
-> DONE

// ===========================================
// RESTING KNOT
// ===========================================

=== idle ===
// By-hand resting stub. The ring-back choices are gone: ringing her back is the green Call button
// (the `call` entry, knot return_contact, when !recruiter_line_dead; it rings out once the line is dead).
#speaker:narrator
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
