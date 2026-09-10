// ===========================================
// PATROL NPC: Val Okonkwo -- Hospital Security Officer, nights
// Mission 2: Ransomed Trust
//
// Val works the security office -- a 2x2 room that the server room door opens
// off, so she is physically between the player and the only lock that matters.
// She has TWO completely different modes and the switch between them is the
// mission's midpoint:
//
//   BEFORE the cover burn -- the consultant line works. She's warm, funny,
//     slightly bored, and she'll wave you through on Kim's say-so.
//   AFTER the cover burn -- control has told her there is no consultant.
//     That line is now a lie she can disprove, and she is not stupid.
//     The player needs a real lanyard, Bernie vouching, or to earn it in
//     conversation. Or to put her on the floor, which has costs.
//
// She is not an obstacle for its own sake. She has independently clocked
// Graham Reeves and been told twice to drop it, which makes her the
// player's best alternative route into the insider thread if they treat
// her as a colleague rather than a turnstile.
//
// Physical combat is never scripted here -- aggression sets #hostile and
// hands control to the game's combat system.
// ===========================================

EXTERNAL player_name()

VAR influence = 0
VAR warned_player = false
VAR caught_lockpicking = false
VAR lockpick_confrontations = 0
VAR talked_about_reeves = false
VAR talked_about_attack = false
VAR cleared_after_burn = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false
VAR staff_lanyard_obtained = false
VAR bernie_vouched = false
VAR dr_kim_met = false
VAR insider_identified = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{cover_burned and not cover_restored:
    -> cover_challenge
}
{not warned_player:
    -> first_encounter
}
-> friendly_return

=== first_encounter ===
~ warned_player = true

Narrator: The security office sits between the main corridor and the server room, and the officer in it has clocked you through the glass before you are halfway across it.

Val Okonkwo: Alright. Stop there a sec.

Val Okonkwo: That door behind me is restricted, and before you say it -- yes, I know the readers are dead. That's precisely why it's me stood in front of it instead of them.

Val Okonkwo: So. Who are you and who says you're allowed?

* [Emergency security consultant. Dr. Kim called me in at one this morning.]
    ~ influence += 15
    # influence_increased
    -> claim_consultant

* [I'm working the incident. There are forty-seven people on generators.]
    ~ influence += 5
    # influence_increased
    Val Okonkwo: I know how many there are, love. I walked past every one of them on my first round.
    Val Okonkwo: Doesn't tell me who you are, though, does it.
    -> hub

* [I'd rather not get into it.]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: *entire manner changes* Right.
    Val Okonkwo: Then we've got a problem, because "I'd rather not get into it" is a full sentence and it means no.
    -> standoff

=== claim_consultant ===
{dr_kim_met:
    Val Okonkwo: *relaxing about ten percent* Right, yeah. Reception flagged it through about an hour back.
    Val Okonkwo: Go on then. Mind yourself in there -- it's twenty-odd degrees hotter than it should be and there's cable everywhere.
    -> hub
- else:
    Val Okonkwo: Consultant. Right.
    Val Okonkwo: Nobody's told me that, but then nobody's told me anything since two forty-seven, so join the queue.
    Val Okonkwo: Get yourself signed in properly at reception and have a word with Dr Kim, and I'll not stand in your way.
    -> hub
}

// ===========================================
// THE COVER CHALLENGE -- mission midpoint
// ===========================================

=== cover_challenge ===
Narrator: She is not ambling any more. She crosses the office at a pace that closes the distance before you have decided what to do with it, and plants herself squarely between you and the server room door.

Val Okonkwo: Stay where you are.

Val Okonkwo: Control have just been on. There is no external consultant booked at this hospital tonight. There never was. Reception's paper log's been amended and there's nothing on the system, because there is no system.

Val Okonkwo: So whatever you told me an hour ago -- start again.

-> cover_challenge_options

=== cover_challenge_options ===
+ {staff_lanyard_obtained} [Show her the lanyard.]
    -> show_lanyard

+ {bernie_vouched} [Ring Bernie on reception. She's logged a correction under her own name.]
    -> bernie_backs_you

+ {influence >= 20} [Val. You've watched me for an hour. Do I look like the problem in this building tonight?]
    -> earn_it

+ [Somebody phoned that in to stop me reaching that room. Ask yourself who benefits.]
    -> the_argument

+ [Then we're doing this the hard way.] #color:red
    ~ influence -= 40
    # influence_decreased
    Narrator: Her hand is already going to her radio.

    Val Okonkwo: Don't.
    Val Okonkwo: Don't you dare. Not in here, not tonight --
    #hostile:security_guard_patrol
    #set_global:attacked_guard:true
    #exit_conversation
    -> DONE

=== show_lanyard ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true

Narrator: She takes the lanyard, turns it over, checks the reverse, and hands it back.

Val Okonkwo: Contractor pass. IT issue.

Val Okonkwo: *pause* Which is blank, has no photograph, and could have come out of anybody's drawer.

Narrator: She looks at you for a long moment. Somewhere behind you a generator changes note.

Val Okonkwo: Here's where I've got to. Either you're a wrong 'un with a stolen pass, or somebody's had my control room told a lie about you.

Val Okonkwo: And I've had this building tell me lies about who's supposed to be stood where for about six weeks now. So.

Val Okonkwo: Go on. But you come past me on your way out and you tell me what you found, or I'll take it very personally.

* [Deal.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: Right.
    #exit_conversation
    -> hub

* [Six weeks. Tell me about that.]
    -> discuss_reeves

=== bernie_backs_you ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true

Val Okonkwo: Bernie's logged what?

Narrator: She turns away, says four sentences into the radio, and listens to rather more than four sentences coming back.

Narrator: She lowers the handset.

Val Okonkwo: She's named herself as vouching officer. In writing. On her own log, against her own staff number.

Val Okonkwo: Bernie Nwosu has worked that desk eleven years and has never once put her name to something she wasn't sure of. Not once.

Val Okonkwo: So now I've got a phone call from control saying one thing and Bernie saying the other, and I know which of those two I've actually met.

Val Okonkwo: Go on. Quick.

* [Thank you.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: Don't thank me, thank her. And don't make either of us regret it.
    #exit_conversation
    -> hub

* [Whoever rang control -- can you find out which extension?]
    Val Okonkwo: *slowly* Now that is a very good question and I do not like the answer I'm already thinking of.
    -> discuss_reeves

=== earn_it ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true

Narrator: She doesn't answer straight away.

Val Okonkwo: No. You don't.

Val Okonkwo: You've been polite, you've stopped when I've asked, and you've spent your night going towards the thing that's on fire instead of away from it. I've been doing this eleven years and that's not nothing.

Val Okonkwo: And the fella who I reckon rang that in has never once stopped when I've asked.

Narrator: She steps aside, but not far.

Val Okonkwo: I'm putting my own name against this in my notebook. If you make a fool of me I'll find you myself.

* [Understood.]
    ~ influence += 5
    # influence_increased
    #exit_conversation
    -> hub

* [Who is he? The one who doesn't stop.]
    -> discuss_reeves

=== the_argument ===
Val Okonkwo: *unmoved* Everyone who's ever been where they shouldn't has a theory about who grassed them up.

Val Okonkwo: Give me something I can hold. A pass. A name on a log. Somebody on a phone saying you're alright.

Val Okonkwo: "Ask yourself who benefits" is what people say when they've got none of those.

+ {staff_lanyard_obtained} [Fine. Here.]
    -> show_lanyard

+ {bernie_vouched} [Then ring Bernie. She's already logged it.]
    -> bernie_backs_you

+ [I'll get you something. Don't go anywhere.]
    Val Okonkwo: I'm stood in a windowless room at four in the morning guarding a door. Where am I going?
    #exit_conversation
    -> DONE

// ===========================================
// LOCKPICK DETECTION
// ===========================================

=== on_lockpick_used ===
~ caught_lockpicking = true
~ lockpick_confrontations++

{lockpick_confrontations == 1:
    -> lockpick_first
}
-> lockpick_again

=== lockpick_first ===
Narrator: You hear her before you see her. The torch beam arrives about a second before she does.

Val Okonkwo: WHOA. Whoa whoa whoa. Away from the door.

Val Okonkwo: What in God's name have you got in your hands?

* [Reception key's not working on this one. I'm improvising.]
    ~ influence -= 5
    # influence_decreased
    Val Okonkwo: *taking that in* Improvising.
    Val Okonkwo: Half this building's improvising tonight, so I'll let that go the once. But not in my office and not where I can see you.
    -> hub

* [Every second on that door is a second the ward hasn't got. You know that.]
    ~ influence -= 10
    # influence_decreased
    Val Okonkwo: I do know that. I also know that's what I'd say if I was you and I was lying.
    Val Okonkwo: Once. That's your once.
    -> hub

* [Dropped something. Just having a look.]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: *flatly* With a pick set.
    Val Okonkwo: That is the worst lie I have heard on this shift, and a man told me at midnight he was his own next of kin.
    -> hub

* [Turn round and walk away.] #color:red
    ~ influence -= 40
    # influence_decreased
    Val Okonkwo: Not a chance.
    #hostile:security_guard_patrol
    #set_global:attacked_guard:true
    #exit_conversation
    -> DONE

=== lockpick_again ===
Val Okonkwo: Again? Seriously?

Val Okonkwo: I gave you the benefit. I don't hand that out twice.

* [Last time. You have my word.]
    {influence >= 15:
        ~ influence -= 10
        # influence_decreased
        Val Okonkwo: *hard stare* Last time.
        Val Okonkwo: Because you've been straight with me otherwise. Not because I believe you.
        -> hub
    - else:
        ~ influence -= 15
        # influence_decreased
        Val Okonkwo: Your word's not worth much on current form.
        Val Okonkwo: I'm logging it. Every incident, every time. That's how this ends up being somebody's problem, and it won't be mine.
        -> hub
    }

+ [Then log it. I've got work to do.]
    ~ influence -= 15
    # influence_decreased
    Val Okonkwo: Oh, I'm logging it.
    -> hub

// ===========================================
// STANDOFF
// ===========================================

=== standoff ===
Val Okonkwo: I'm going to ask you once more, properly, and then I'm going to stop asking.

* [Sorry. Long night, and I'm taking it out on the wrong person. Emergency security consultant -- Dr. Kim's call.]
    ~ influence += 15
    # influence_increased
    Val Okonkwo: *the temperature drops about ten degrees* There we are. That wasn't hard, was it.
    Val Okonkwo: We're all shattered. Doesn't cost anything to say who you are.
    -> hub

* [I don't answer to hospital security.]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: You do tonight, sunshine.
    Val Okonkwo: Control, this is Okonkwo on north --
    #hostile:security_guard_patrol
    #set_global:attacked_guard:true
    #exit_conversation
    -> DONE

// ===========================================
// HUB
// ===========================================

=== hub ===
+ {not talked_about_attack} [What have you actually been told about all this?]
    -> discuss_attack

+ {not talked_about_reeves} [Is there anyone in this building tonight who shouldn't be?]
    -> discuss_reeves

+ {talked_about_reeves and insider_identified} [Graham Reeves is ENTROPY's man inside. You were right.]
    -> reeves_vindicated

+ [I'll let you get on.]
    Val Okonkwo: {influence >= 20: Go on. Shout if you need me -- I mean that.|Mm.}
    #exit_conversation
    -> hub

=== discuss_attack ===
~ talked_about_attack = true

Val Okonkwo: Officially? "An IT incident." That's the phrase. I've had it four times off three different people.

Val Okonkwo: What I've worked out on my own is that somebody's locked up every computer in the building and wants paying, and that the lad in IT has been shouting about exactly this since about May.

Val Okonkwo: Gary. Nice lad. Bit intense. Been right for six months, which round here is basically a disciplinary offence.

+ [Nobody listens to the people who tell them things they don't want to hear.]
    ~ influence += 8
    # influence_increased
    Val Okonkwo: *very dryly* You've worked in a hospital before.
    -> hub

+ [What's your job in all this?]
    Val Okonkwo: Stand in front of that door. Stop people. Which sounds daft until you remember that everything that decides who's allowed where has gone in the fire.
    Val Okonkwo: Tonight I am the access control system. Me. A torch and a radio.
    -> hub

// ===========================================
// THE REEVES THREAD -- Val's real value
// ===========================================

=== discuss_reeves ===
~ talked_about_reeves = true

Narrator: The professional distance drops off her like a coat.

Val Okonkwo: Funny you should ask.

Val Okonkwo: There's a fella been on nights since about July. Reeves. Plain suit, no uniform, "night security supervisor". Stands himself in the boardroom by the comms relay and doesn't move all shift.

Val Okonkwo: He is not on my rota. He has never been on my rota. I've asked Estates, I've asked control, I've asked the agency -- nobody's got a Graham Reeves on any list I'm allowed to see.

Val Okonkwo: I've raised it twice. Twice I've been told it's "crisis protocol" by people who won't put it in an email.

+ [Six weeks ago there was a fire drill nobody scheduled. Was he on that night?]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: *stops dead* I was mid-round when the alarm went. And a drill is the one night everybody moves the same direction -- out. Down the stairs, into the car park, you know the drill, that's the whole point of the drill.
    Val Okonkwo: Bernie's two "facilities" lads went the other way. Up the north corridor, towards the comms relay and the server room. Against the entire building.
    Val Okonkwo: I clocked it and I told myself facilities knew their own job. He smiled at me and said he'd sorted it.
    #set_global:insider_evidence_partial:true
    Val Okonkwo: Six weeks that's itched at me. Two men walking the wrong way through a fire.
    -> hub

+ [You've got all this written down?]
    ~ influence += 5
    # influence_increased
    #give_item:notes:val_notebook
    #set_global:insider_evidence_partial:true
    Narrator: She taps her breast pocket.

    Val Okonkwo: Every shift. Dates, times, who told me to drop it.
    Val Okonkwo: Here. Take the whole thing -- I've been waiting eight weeks for somebody to want it.
    Narrator: She tears the used pages out and folds them into your hand without any ceremony at all.
    -> hub

+ [Keep it to yourself for now. Don't let him know you've told me.]
    ~ influence += 5
    # influence_increased
    Val Okonkwo: *quietly* Right you are.
    Val Okonkwo: You'll tell me though. When you know.
    -> hub

=== reeves_vindicated ===
Narrator: She takes it in without any visible satisfaction at all.

Val Okonkwo: Eight weeks.

Val Okonkwo: Eight weeks I've had that man in my notebook, and twice I've been told to leave it, and now you're telling me he let them in.

Val Okonkwo: *steadily* I'm not going to be dramatic about it. But when they ask afterwards who knew -- and they will ask, they always ask -- I want it said that somebody knew and got told to drop it.

* [It'll be in the record. Your name, your dates, and who told you to drop it.]
    ~ influence += 15
    # influence_increased
    Val Okonkwo: Then that'll do me.
    Val Okonkwo: Go and get him. And be careful -- he's stood next to the only phone line out of this building that still works.
    #exit_conversation
    -> hub

+ [Stay out of the boardroom until SAFETYNET arrive. He's not what he looks like.]
    ~ influence += 8
    # influence_increased
    Val Okonkwo: I've been doing this eleven years. I know exactly what he looks like.
    Val Okonkwo: But I'll hold this room. Go on.
    #exit_conversation
    -> hub

// ===========================================
// SERVER ROOM ACCESS EVENT
// ===========================================

=== on_server_room_access ===
{cleared_after_burn:
    Val Okonkwo: *from across the office* Server room. Right. I've seen nothing.
    Val Okonkwo: Get the wards their screens back and we'll call it square.
    #exit_conversation
    -> DONE
}

Val Okonkwo: Hang on -- server room's authorised IT personnel only. That's not a badge thing, that's a rule thing.

* [I've got Gary Whitlock's card and Gary Whitlock's blessing. Ring him if you want.]
    Val Okonkwo: *pause* ...I would, but the phones in IT are as dead as everything else, aren't they.
    Val Okonkwo: Go on. I'm logging it with your description and the time.
    #exit_conversation
    -> DONE

* [Then come in with me and watch what I do.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: *genuinely thrown* Nobody's ever said that to me.
    Val Okonkwo: No. You've got a job. But I'll be on this door, and I'll remember you offered.
    #exit_conversation
    -> DONE

+ [Say nothing and walk past.]
    ~ influence -= 15
    # influence_decreased
    Val Okonkwo: Oi! I said authorised only!
    Val Okonkwo: *to the radio* ...control, security office, I want that logging.
    #exit_conversation
    -> DONE

// ===========================================
// FRIENDLY RETURN
// ===========================================

=== friendly_return ===
{cleared_after_burn:
    Val Okonkwo: Still with us, then.
- else:
    Narrator: She nods you past without breaking her round.

    Val Okonkwo: Alright.
}
-> hub
