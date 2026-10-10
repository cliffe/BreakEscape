// ===========================================
// PATROL NPC: Val Okonkwo -- Hospital Security Officer, nights
// Mission 2: Ransomed Trust
//
// Val patrols the main corridor in front of the security office, whose door is
// key-locked and is the only way to the server room (pass 4, U2). She is the
// turnstile: talk her round and she opens it (#unlock_door), pick it while her
// back is turned, or put her down and take her key. She has TWO completely
// different modes and the switch between them is the mission's midpoint:
//
//   BEFORE the cover burn -- the consultant line works. She's warm, funny,
//     slightly bored, and points you at Gary: the server room needs his card,
//     and she'll open her office for whoever comes back with it.
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
VAR asked_about_drill = false
VAR val_notebook_given = false   // her notebook is offered on every route, but handed over once
VAR talked_about_attack = false
VAR cleared_after_burn = false
// Pass 4 dialogue: a re-talk re-navigates to hub, so the hub re-checks the challenge and
// carries the return greeting. hub_quiet skips the greeting once after a reply or a goodbye.
VAR hub_quiet = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false // Synced scenario global: the player's cover is re-established (Val clears it here); also set by Bernie's vouch (m02_npc_receptionist)
VAR staff_lanyard_obtained = false
VAR bernie_vouched = false
VAR dr_kim_met = false
VAR insider_identified = false
VAR val_opened_office = false
VAR bernie_gave_key = false
VAR bernie_trusts_player = false
// Round 2: repeat detection lives in globals, because a catch can cut a
// conversation short before its local state is saved.
VAR val_caught_picking = false
VAR val_challenged = false
VAR val_argument_heard = false
// Round 3: the local warned_player is not carried into an event-opened conversation
// (playtest 1409), so the meeting itself is recorded in a global too.
VAR val_met = false
// Playtest loop round 1 (A10): Val as the red herring. She can be accused once the
// handover board's "security override" has been read and the player is past her door.
VAR read_handover_board = false
VAR insider_badge_id_found = false
VAR read_night_rota = false
VAR reached_security_office = false
VAR val_accused = false
VAR attacked_guard = false
VAR guard_knocked_out = false

// Local: whether the challenge is the first time she has ever spoken to the player.
VAR challenge_is_first_meeting = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
// Round 2 (CF-C): after a fight she's done talking.
{attacked_guard and not guard_knocked_out:
    -> after_fight
}
{cover_burned and not cover_restored:
    -> cover_challenge
}
// A vouched player who never met her (or reloaded): straight to the door.
{cover_burned and cover_restored and not val_opened_office:
    ~ warned_player = true
    -> open_after_vouch
}
{not warned_player and not val_met:
    -> first_encounter
}
-> friendly_return

=== first_encounter ===
~ warned_player = true
#set_global:val_met:true

Narrator: A security officer walks a slow beat along the main corridor, past the door marked Security Office. She clocks you before you're halfway along.

Val Okonkwo: Alright. Stop there a sec.

Val Okonkwo: That door behind me is restricted. And yes, I know the readers are dead. That's why it's me stood in front of it.

Val Okonkwo: So. Who are you and who says you're allowed?

* [Emergency security consultant. Dr. Kim called me in at one this morning.]
    ~ influence += 15
    # influence_increased
    -> claim_consultant

* [I'm working the incident. There are forty-seven people on generators.]
    ~ influence += 5
    # influence_increased
    Val Okonkwo: I know how many there are. I walked past every one of them on my first round.
    Val Okonkwo: Doesn't tell me who you are, though, does it.
    ~ hub_quiet = true
    -> hub

* [I'd rather not get into it.]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: *the smile goes* Right.
    Val Okonkwo: Then we've got a problem. "I'd rather not get into it" is a full sentence, and it means no.
    -> standoff

=== claim_consultant ===
{dr_kim_met:
    Val Okonkwo: Right, yeah. Reception flagged it through about an hour back.
- else:
    Val Okonkwo: Consultant. Right.
    Val Okonkwo: Nobody's told me, but nobody's told me anything since two forty-seven. Join the queue.
    {bernie_gave_key:
        Val Okonkwo: Bernie's signed you in, has she? Then go and have a word with Dr Kim.
    - else:
        Val Okonkwo: Get yourself signed in properly at reception and have a word with Dr Kim.
    }
}
Val Okonkwo: Server room's through my office, and it's card-only. One card left in the building opens it: Gary's, in IT.
Val Okonkwo: Come back with it and I'll open the office for you.
~ hub_quiet = true
-> hub

// ===========================================
// THE COVER CHALLENGE -- mission midpoint
// ===========================================

=== cover_challenge ===
~ challenge_is_first_meeting = not (warned_player or val_met or val_caught_picking)
~ warned_player = true
{val_challenged:
    Val Okonkwo: Back again. Have you got something for me this time?
    -> cover_challenge_options
}
Narrator: She isn't ambling any more. She closes the distance before you've decided what to do with it, and plants herself between you and her office door.

Val Okonkwo: Stay where you are.

-> cover_challenge_speech

// After a catch she is already in the player's face, so the catch skips the walk-up.
=== cover_challenge_speech ===
{val_challenged:
    Val Okonkwo: Same question as before, and I'm still waiting on an answer.
    -> cover_challenge_options
}
#set_global:val_challenged:true
Val Okonkwo: Control have just been on. There's no external consultant booked at this hospital tonight. There never was.

Val Okonkwo: Reception's paper log's been amended, and there's nothing on the system, because there is no system.

{challenge_is_first_meeting:
    Val Okonkwo: So. Whoever you are, start talking.
- else:
    Val Okonkwo: So whatever you told me an hour ago, start again.
}

-> cover_challenge_options

=== cover_challenge_options ===
+ {staff_lanyard_obtained} [Show her the lanyard.]
    -> show_lanyard

+ {bernie_vouched} [Ring Bernie on reception. She's logged a correction under her own name.]
    -> bernie_backs_you

+ {bernie_trusts_player and not bernie_vouched} [Ring Bernie on reception. She signed me in. She'll vouch for me.]
    -> bernie_backs_you

+ {influence >= 20} [Val, you've watched me for an hour. Do I look like the problem tonight?]
    -> earn_it

+ [Somebody phoned that in to keep me out of that room. Who benefits?]
    -> the_argument

+ [Then we're doing this the hard way. (Fight her.)] #color:red
    ~ influence -= 40
    # influence_decreased
    Val Okonkwo: *hand going to her radio* Don't.
    Val Okonkwo: Don't you dare. Not in here, not tonight--
    #hostile:security_guard_patrol
    #set_global:attacked_guard:true
    #exit_conversation
    -> DONE

=== show_lanyard ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true

Narrator: She turns the lanyard over, checks the back, and hands it back.

Val Okonkwo: Hospital pass. Blank, no photo. Could have come out of anybody's drawer.

Narrator: She looks at you for a long moment. Somewhere behind you a generator changes note. #lighting_dip

Val Okonkwo: Here's where I've got to. Either you're a wrong 'un with a stolen pass, or somebody's had my control room told a lie about you.

Val Okonkwo: And this building's been lying to me about who's supposed to be stood where for six weeks now. So.

Val Okonkwo: Go on. But you come past me on the way out and tell me what you found, or I'll take it very personally.

-> val_opens_office ->

* [Deal.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: Right.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

* [Six weeks. Tell me about that.]
    -> discuss_reeves

=== bernie_backs_you ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true
#set_global:bernie_vouched:true

{bernie_vouched:
    Val Okonkwo: Bernie's logged what?
- else:
    Val Okonkwo: Bernie on reception. Let's see, shall we.
}

Narrator: She says four sentences into the radio and listens to rather more than four coming back.

Val Okonkwo: She's named herself as vouching officer. In writing, on her own log, against her own staff number.

Val Okonkwo: Eleven years on that desk, and Bernie's never once put her name to something she wasn't sure of.

Val Okonkwo: So I've got control saying one thing and Bernie saying the other. I know which of those I've actually met.

Val Okonkwo: Go on. Quick.

-> val_opens_office ->

* [Thank you.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: Don't thank me, thank her. And don't make either of us regret it.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

* [Whoever rang control, can you find out which extension?]
    Val Okonkwo: Now that's a very good question. And I don't like the answer I'm already thinking of.
    -> discuss_reeves

=== earn_it ===
~ cleared_after_burn = true
~ cover_restored = true
#set_global:cover_restored:true

Val Okonkwo: *after a while* No. You don't.

Val Okonkwo: You've been polite, you've stopped when I asked, and you've spent your night running towards the fire.

Val Okonkwo: I've stood in a lot of corridors. That counts for something.

Val Okonkwo: And the fella I reckon rang that in has never once stopped when I've asked.

Val Okonkwo: I'm putting my own name against this in my notebook. If you make a fool of me I'll find you myself.

-> val_opens_office ->

* [Understood.]
    ~ influence += 5
    # influence_increased
    Val Okonkwo: Go on, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

* [Who is he? The one who doesn't stop.]
    -> discuss_reeves

// Shared by every clearance route: she opens the door herself. The server only
// honours #unlock_door from an NPC the player has met who lists the room in
// "unlockable" (game.rb validate_npc_unlock) -- Val lists security_office.
=== val_opens_office ===
~ val_opened_office = true
#unlock_door:security_office
#set_global:val_opened_office:true
Narrator: She unlocks the office door and stands aside.
->->

=== the_argument ===
{val_argument_heard:
    Val Okonkwo: We've done this. A pass, a name on a log, or somebody on a phone. Not a theory.
- else:
    Val Okonkwo: Everyone who's ever been where they shouldn't has a theory about who grassed them up.

    Val Okonkwo: Give me something I can hold. A pass. A name on a log. Somebody on a phone saying you're alright.

    Val Okonkwo: "Who benefits?" is what people say when they've got none of those.
}

+ {staff_lanyard_obtained} [Fine. Here.]
    -> show_lanyard

+ {bernie_vouched} [Then ring Bernie. She's already logged it.]
    -> bernie_backs_you

+ {bernie_trusts_player and not bernie_vouched} [Then ring Bernie. She'll put her name to me.]
    -> bernie_backs_you

+ [I'll get you something. Don't go anywhere.]
    {val_argument_heard:
        Val Okonkwo: Still here.
    - else:
        Val Okonkwo: I'm stood in a corridor at four in the morning guarding a door. Where am I going?
    }
    #set_global:val_argument_heard:true
    #exit_conversation
    -> DONE

// ===========================================
// LOCKPICK DETECTION
// ===========================================

=== on_lockpick_used ===
~ caught_lockpicking = true
~ lockpick_confrontations++
~ warned_player = true
// The global, not the local count: it survives a catch that cut the last scene short.
{val_caught_picking:
    -> lockpick_again
}
#set_global:val_caught_picking:true
-> lockpick_first

// After a catch: a burned player goes straight into the challenge; anyone else
// gets her hub. Being caught has already cost influence, which gates earn_it.
=== after_catch ===
{cover_burned and not cover_restored:
    -> cover_challenge_speech
}
-> hub

=== lockpick_first ===
Narrator: You hear her before you see her. The torch beam arrives about a second before she does.

Val Okonkwo: WHOA. Whoa whoa whoa. Away from the door.

Val Okonkwo: What in God's name have you got in your hands?

* [Reception key's not working on this one. I'm improvising.]
    ~ influence -= 5
    # influence_decreased
    Val Okonkwo: Improvising.
    Val Okonkwo: Half this building's improvising tonight, so I'll let that go the once. Not on my door, and not where I can see you.
    -> after_catch

* [Every second on that door is a second the ward hasn't got. You know that.]
    ~ influence -= 10
    # influence_decreased
    Val Okonkwo: I do know that. I also know that's what I'd say if I was you and I was lying.
    Val Okonkwo: Once. That's your once.
    -> after_catch

* [Dropped something. Just having a look.]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: With a pick set.
    Val Okonkwo: Worst lie I've heard this shift, and a man told me at midnight he was his own next of kin.
    -> after_catch

* [Turn round and walk away. (She'll fight you.)] #color:red
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
        Val Okonkwo: Last time.
        Val Okonkwo: Because you've been straight with me otherwise. I still don't believe you.
        -> after_catch
    - else:
        ~ influence -= 15
        # influence_decreased
        Val Okonkwo: Your word's not worth much on current form.
        Val Okonkwo: I'm logging it. Every incident, every time. That's how this ends up somebody's problem, and it won't be mine.
        -> after_catch
    }

+ [Then log it. I've got work to do.]
    ~ influence -= 15
    # influence_decreased
    Val Okonkwo: Oh, I'm logging it.
    -> after_catch

// ===========================================
// STANDOFF
// ===========================================

=== standoff ===
Val Okonkwo: I'm going to ask you once more, properly, and then I'm going to stop asking.

* [Sorry. Long night. I'm the security consultant Dr. Kim called in.]
    ~ influence += 15
    # influence_increased
    Val Okonkwo: There we are. That wasn't hard, was it.
    Val Okonkwo: We're all shattered. Doesn't cost anything to say who you are.
    ~ hub_quiet = true
    -> hub

* [I don't answer to hospital security. (She'll fight you.)]
    ~ influence -= 20
    # influence_decreased
    Val Okonkwo: You do tonight, sunshine.
    Val Okonkwo: Control, this is Okonkwo on north--
    #hostile:security_guard_patrol
    #set_global:attacked_guard:true
    #exit_conversation
    -> DONE

// ===========================================
// HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {cover_burned and not cover_restored:
        -> cover_challenge
    }
    {cover_burned and cover_restored and not val_opened_office:
        -> open_after_vouch
    }
    {val_accused:
        Val Okonkwo: Mm.
    - else:
        Val Okonkwo: {cleared_after_burn: Still with us, then.|{&Alright.|You again. Go on.|What's up?}}
    }
}
+ {not talked_about_attack} [What have you actually been told about all this?]
    -> discuss_attack

+ {not talked_about_reeves} [Is there anyone in this building tonight who shouldn't be?]
    -> discuss_reeves

+ {talked_about_reeves and not val_notebook_given} [About Reeves. Have you got any of that written down?]
    -> reeves_notebook

+ {talked_about_reeves and insider_identified} [Graham Reeves is ENTROPY's man inside. You were right.]
    -> reeves_vindicated

+ {cover_burned and read_handover_board and not insider_identified and not val_accused and not accuse_val and (val_opened_office or reached_security_office)} [That drill ran on a security override. You're security. Was it you?]
    -> accuse_val

+ {cover_burned and cover_restored and not val_opened_office} [Val, I need the server room.]
    -> open_after_vouch

+ [I'll let you get on.]
    Val Okonkwo: {influence >= 20: Go on. Shout if you need me. I mean that.|Mm.}
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Cover restored somewhere else (Bernie's vouch) before Val ever cleared the player.
=== open_after_vouch ===
Val Okonkwo: Control rang back. Bernie Nwosu's put her own name against you, in writing.
Val Okonkwo: Eleven years and she's never done that for anybody. That'll do me.
-> val_opens_office ->
~ hub_quiet = true
-> hub

=== discuss_attack ===
~ talked_about_attack = true

Val Okonkwo: Officially? "An IT incident." I've had that phrase four times off three different people.

Val Okonkwo: What I've worked out myself: somebody's locked up every computer in the building and wants paying.

Val Okonkwo: And the lad in IT's been shouting about exactly this since May. Gary. Nice lad. Bit intense.

Val Okonkwo: Been right for six months, which round here is basically a disciplinary offence.

+ [Nobody listens to the people who tell them things they don't want to hear.]
    ~ influence += 8
    # influence_increased
    Val Okonkwo: You've worked in a hospital before.
    ~ hub_quiet = true
    -> hub

+ [What's your job in all this?]
    Val Okonkwo: Stand in front of that door. Stop people. Sounds daft, till you remember everything that decides who's allowed where has gone.
    Val Okonkwo: Tonight I am the access control system. Me, a torch and a radio.
    ~ hub_quiet = true
    -> hub

// ===========================================
// THE REEVES THREAD -- Val's real value
// ===========================================

=== discuss_reeves ===
~ talked_about_reeves = true
#set_global:reeves_known:true

{discuss_reeves > 1:
    Val Okonkwo: Reeves. Same as I told you. Not on my rota, never signs Bernie's book, and I've been told twice to drop it.
    -> reeves_questions
}
Val Okonkwo: *lowering her voice* Reeves.

Val Okonkwo: Been on nights since about July. Plain suit, no uniform, "night security supervisor".

Val Okonkwo: Stands in the boardroom by the comms relay and doesn't move all shift.

Val Okonkwo: He's never been on my rota. I've asked Estates, control, the agency. Nobody's got a Graham Reeves on any list I'm allowed to see.

Val Okonkwo: I've raised it twice. Twice I've been told it's "crisis protocol" by people who won't put it in an email.

-> reeves_questions

=== reeves_questions ===
+ {not asked_about_drill} [Anything odd on nights lately? Drills, alarms?]
    ~ asked_about_drill = true
    ~ influence += 10
    # influence_increased
    Val Okonkwo: *stops dead* There was. A fire drill nobody had scheduled.
    Val Okonkwo: Six weeks ago, half two in the morning. Everybody goes the same way in a drill. Out.
    Val Okonkwo: Two men in high-vis, "facilities", went the other way. Up the north corridor, towards the comms relay and the server room.
    Val Okonkwo: Panel said fire, so I unlocked the north doors myself. Somebody rang down and said facilities had it in hand.
    #set_global:insider_evidence_partial:true
    Val Okonkwo: Six weeks that's itched at me. Two men walking the wrong way through a fire.
    -> reeves_questions

+ {not val_notebook_given} [You've got all this written down?]
    -> reeves_notebook

+ [Keep it to yourself for now. Don't let him know you've told me.]
    ~ influence += 5
    # influence_increased
    Val Okonkwo: Right you are.
    Val Okonkwo: You'll tell me, though. When you know.
    ~ hub_quiet = true
    -> hub

=== reeves_notebook ===
~ val_notebook_given = true
~ influence += 5
# influence_increased
#give_item:notes:val_notebook
#set_global:insider_evidence_partial:true
#set_global:val_notebook_given:true
Narrator: She taps her breast pocket.

Val Okonkwo: Every shift. Dates, times, who told me to drop it.
Val Okonkwo: Here. Take the whole thing. I've been waiting eight weeks for somebody to want it.
Narrator: She tears the used pages out and folds them into your hand.
~ hub_quiet = true
-> hub

=== reeves_vindicated ===
{val_accused:
    Val Okonkwo: And an hour ago you had me down for it.
}
Val Okonkwo: Eight weeks.

Val Okonkwo: Eight weeks I've had that man in my notebook. Twice I was told to leave it. And now you're telling me he let them in.

Val Okonkwo: I'll not be dramatic. But when they ask afterwards who knew, and they always ask, I want it said somebody knew and got told to drop it.

* [It'll be in the record. Your name, your dates, who told you to drop it.]
    ~ influence += 15
    # influence_increased
    Val Okonkwo: Then that'll do me.
    Val Okonkwo: Go and get him. And be careful. He's stood next to the only phone line out of this building that still works.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

+ [Stay out of the boardroom until SAFETYNET arrive. He's not what he looks like.]
    ~ influence += 8
    # influence_increased
    Val Okonkwo: I've had him in my notebook eight weeks. I know exactly what he looks like.
    Val Okonkwo: But I'll hold this corridor. Go on.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Round 2 (CF-C): re-talk after the player went for her.
=== after_fight ===
Val Okonkwo: You've got a nerve, coming back to me. It's all in my log.
+ [Walk away.]
    #exit_conversation
    -> after_fight

// ===========================================
// ACCUSING VAL (playtest loop round 1, A10 red herring)
// The soft answers come back to the hub; the push costs her goodwill and counts as a
// wrong accusation, like Kim's and Gary's. No #hostile: a fight would be out of scale.
// ===========================================

=== accuse_val ===
Val Okonkwo: Me.
Val Okonkwo: Eight weeks I've been writing down a man nobody'll let me question. You've had me for five minutes.

+ {read_night_rota and insider_badge_id_found} [Your rota number isn't the one in Ghost's log.]
    Val Okonkwo: No. It isn't. Nice to know somebody reads my rota.
    ~ hub_quiet = true
    -> hub

+ [You're right. I had to ask.]
    Val Okonkwo: You did. Now go and ask the right one.
    ~ hub_quiet = true
    -> hub

* {asked_about_drill} [You opened those doors yourself. You told me.]
    -> accuse_val_push

* {not asked_about_drill} [You had the keys and the shift. Who else?]
    -> accuse_val_push

=== accuse_val_push ===
Val Okonkwo: I opened them because the panel said fire. That's the job.
Val Okonkwo: Put that in your report. Then find somebody else to talk to.
#set_global:accused_wrong_suspect:true
#set_global:val_accused:true
~ hub_quiet = true
#exit_conversation
-> hub

// ===========================================
// SERVER ROOM ACCESS EVENT
// ===========================================

=== on_server_room_access ===
~ warned_player = true
// Bernie vouched, but the player picked her door rather than ask her to open it.
{cover_restored:
    Narrator: Footsteps behind you. Val has followed you in through her own office.
    Val Okonkwo: Bernie's word's on the log, so I'll not make a fuss. Still. That was my door.
    #exit_conversation
    -> DONE
}

Narrator: Footsteps behind you. Val has followed you in through her own office, and she isn't pleased about the state of her door.

Val Okonkwo: Hang on. Server room's authorised IT personnel only. Badges or no badges, that's the rule.

* [I've got Gary Whitlock's card and Gary Whitlock's blessing. Ring him if you want.]
    Val Okonkwo: ...I would, but the phones in IT are as dead as everything else, aren't they.
    Val Okonkwo: Go on. I'm logging it with your description and the time.
    #exit_conversation
    -> DONE

* [Then come in with me and watch what I do.]
    ~ influence += 10
    # influence_increased
    Val Okonkwo: Nobody's ever said that to me.
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
    Val Okonkwo: Alright.
}
~ hub_quiet = true
-> hub
