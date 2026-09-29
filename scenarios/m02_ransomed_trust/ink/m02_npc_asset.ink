// ===========================================
// ACT 3 NPC: Graham Reeves -- Night Security Supervisor / ENTROPY inside asset
// Mission 2: Ransomed Trust
//
// The polite man who has been helpful all night. He authorised the fire drill
// that put ENTROPY's device on the LAN six weeks ago, and he is the one who
// rang security control and pulled the player's booking -- which is the
// mission's midpoint turn paying off in the villain's own mouth.
//
// Gated reveal: he stays in cover until insider_identified. If the player
// never identifies him, he ambushes at the press terminal instead, so the
// thread always resolves.
//
// He is IMMOVABLE by design -- an ideological convert who came prepared to be
// caught. The player's choices at the confrontation therefore set STANCE, not
// outcome, and each one is recorded and read back in the debrief.
// ===========================================

EXTERNAL player_name()

// Synced from globalVars by engine at call-open
VAR insider_identified = false
VAR insider_confronted = false
VAR cover_burned = false
VAR cover_restored = false
VAR insider_method_confirmed = false
VAR bernie_vouched = false
VAR gary_protected = false

VAR cover_probed = false
VAR asked_guarding = false
VAR asked_plainclothes = false

=== start ===
{insider_confronted:
    -> already_resolved
}
{insider_identified:
    -> confrontation
}
-> cover_friendly

// ===========================================
// COVER -- before identification
// ===========================================

=== cover_friendly ===
Narrator: He is standing beside the comms relay with his hands loosely clasped, in the manner of a man who has been standing in exactly that spot for a very long time and is entirely comfortable about it.

Graham Reeves: Evening. You'll be the consultant Dr Kim brought in.

Graham Reeves: Graham Reeves, night security supervisor. I've the sensitive comms watch while the systems are down -- so anything you want to send from that terminal, you come through me first.

Graham Reeves: Not obstruction. Just process. It's a bad night for half a story getting out.

-> cover_hub

=== cover_hub ===
+ {not asked_guarding} [What exactly are you guarding in here?]
    -> cover_guarding

+ {not asked_plainclothes} [No uniform. Why plainclothes?]
    -> cover_plainclothes

+ {cover_burned and not cover_restored and not cover_probed} [Somebody's rung security control and told them I was never booked in. Any idea who'd do that?]
    -> cover_probe

+ [Nothing for now.]
    Graham Reeves: Of course. I'll be here.
    Graham Reeves: *as you turn* Do get those wards back, won't you. There are people relying on it.
    #exit_conversation
    -> DONE

=== cover_guarding ===
~ asked_guarding = true

Graham Reeves: The relay, principally. It's the only line out of this building that still works.

Graham Reeves: In an incident like this, the danger isn't the press finding out. It's the press finding out half of it. A partial account does more damage than a complete one -- people fill the gaps in with whatever frightens them most.

Graham Reeves: So I make sure that what leaves this room is the whole picture, or nothing at all.

-> cover_hub

=== cover_plainclothes ===
~ asked_plainclothes = true

Graham Reeves: Crisis protocol. A uniform in a corridor makes people ask what's happened, and then you've a queue of anxious relatives instead of a hospital.

Graham Reeves: Plainclothes keeps things calm.

Graham Reeves: I've held this post since the summer. I know this building rather better than most of the people who work in it -- which sounds like a boast and is actually just what nights does to you.

-> cover_hub

=== cover_probe ===
~ cover_probed = true

Narrator: Nothing in his face moves at all.

Graham Reeves: How very odd.

Graham Reeves: Though I'd say this in fairness to them -- with the access system down, control have no way of confirming anybody. They're working off a phone call and a paper book, both of which are only as good as whoever last touched them.

Graham Reeves: If somebody wanted to make a person disappear tonight, they wouldn't need to do anything clever. They'd need a telephone.

* [That's a very complete answer for someone hearing it for the first time.]
    Graham Reeves: *the smallest pause* I've been in security a long while.
    Graham Reeves: You get so you can see how a thing was done. It's an unattractive habit.
    -> cover_hub

* [Thanks. I'll bear it in mind.]
    Graham Reeves: Do.
    -> cover_hub

// ===========================================
// CONFRONTATION -- insider_identified
// ===========================================

=== confrontation ===
Narrator: You stop in front of him and say the badge number out loud. SC-4471. The fire drill nobody scheduled. The two men in high-vis Bernie was never allowed to name.

Narrator: The courteous expression does not fall away. It switches off, cleanly, like a lamp.

Graham Reeves: So you did the work.

Graham Reeves: Good. I'd have been disappointed otherwise -- and I'd have had to sit here another six hours being helpful, which is genuinely more tiring than this.

{cover_burned:
    -> confrontation_the_call
}
-> confrontation_why

=== confrontation_the_call ===
Narrator: He tips his head very slightly towards the internal phone on the wall behind him.

Graham Reeves: You'll want to ask about the telephone.

Graham Reeves: I rang control at ten to four and told them there was no consultant booked. That was all. Eleven words.

Graham Reeves: No violence, no confrontation, nothing anyone will ever be able to charge me with. I simply removed your standing, and a man with no standing spends his night explaining himself in corridors instead of reading logs.

{insider_method_confirmed:
    Graham Reeves: *slight smile* You've read their note about it, haven't you. "Better at this than we pay him to be."
    Graham Reeves: I did rather enjoy that.
}

* [It cost me twenty minutes.]
    Graham Reeves: Twenty minutes. On a twelve-hour generator.
    Graham Reeves: That is precisely the scale of thing I deal in. Nobody ever notices the twenty minutes. That's why it works.
    -> confrontation_why

* [You've been standing here all night being helpful to a man you'd already sabotaged.]
    Graham Reeves: Yes.
    Graham Reeves: I've been standing here all night being helpful to this entire hospital. That's rather the point I'm making, and you're the first person who's noticed it's a point.
    -> confrontation_why

* {bernie_vouched} [It didn't work. Bernie put her own name against mine.]
    Narrator: For the first time, something crosses his face that he has not chosen.
    Graham Reeves: ...Bernadette did that.
    Graham Reeves: *quietly* I've stood in that lobby for six months and she's never once made me sign her book. I took that for laziness.
    Graham Reeves: It appears it was manners.
    -> confrontation_why

=== confrontation_why ===
Graham Reeves: You want to know why. They always want to know why.

* [You held the door open for people who put a ward on generators.]
    Graham Reeves: I held a door open. You'll want to be precise about that, because everyone else in this building held one too and none of them will be asked about it.
    -> monologue_1

* [Six months on this post and you sold it. What did they pay you?]
    Graham Reeves: *something tightens* Ask me the second question first next time. It's the one you actually want the answer to.
    -> monologue_1

* [I don't need why. I need you away from that terminal.]
    Graham Reeves: *unbothered* You'll get the why anyway. It's the only part of this I'm actually here for.
    -> monologue_1

=== monologue_1 ===
Graham Reeves: Money. That's the first guess, always.

Graham Reeves: Do you know what this hospital pays a night security supervisor to hold a building full of dying people together between ten at night and six in the morning?

Graham Reeves: Less than the board spent on catering the meeting where they cut Gary Whitlock's security budget. I know that because I stood outside that room, and I carried the trays out afterwards.

Graham Reeves: I raised it. Not the catering -- the servers. I have been raising things in this building since the day I arrived. I was told to mind my post.

* [Being ignored is not a licence.]
    Graham Reeves: No. It's a condition. Licences are what people with titles issue each other.
    -> monologue_2

* [So they came along and listened.]
    Graham Reeves: *quietly* They asked me questions about my own building and then wrote the answers down. Do you know how long it had been?
    -> monologue_2

* [Gary was ignored too. He wrote seven emails. He didn't do this.]
    Graham Reeves: *nods slowly* No. He wrote his seven emails and he waited to be listened to, and in about a fortnight they will sack him for it.
    Graham Reeves: That's not a counter-argument. That's my closing statement.
    -> monologue_2

=== monologue_2 ===
Graham Reeves: They didn't recruit me. That word's wrong and everyone reaches for it.

Graham Reeves: They agreed with me. There's a difference, and it's the whole difference.

Graham Reeves: And look at what I actually did. I confirmed a window. I walked two men through a lobby during a drill. I made one telephone call tonight.

Graham Reeves: I did not write the software. I did not defer the patch for six months. I did not choose the scanner over the servers.

Graham Reeves: Every one of those decisions was taken by somebody in this building with a title, in daylight, in a room with minutes taken.

Graham Reeves: They built it. I only stopped it being invisible.

Narrator: His hand settles, quite deliberately, near the lanyard at his collar.

-> confrontation_choice

// ===========================================
// FOCUSED CHOICE -- stance, not outcome
// ===========================================

=== confrontation_choice ===
Graham Reeves: So. You've found me. What happens now is entirely your call, agent.

+ [Quietly. You're under arrest. SAFETYNET has you.]
    -> choice_arrest

+ [You go public. Your name, alongside every one of theirs.]
    -> choice_expose

+ [I'm not doing the talking. SAFETYNET takes you and you can explain it to them.]
    -> choice_handover

+ [You don't walk out of here.] #color:red
    -> choice_hostile

=== choice_arrest ===
~ insider_confronted = true
Graham Reeves: No fuss. Good.

Graham Reeves: I told them a fuss was beneath the point.

You: The point was people on backup power.

Graham Reeves: The point was that nobody in this sector will ever be able to say they didn't know. Give it a year. You'll see it in the budgets.

Narrator: He offers his wrists without being asked. Whatever else he is, he came to work tonight prepared to be caught.

{gary_protected:
    Graham Reeves: *as you take his arm* The IT lad. Whitlock.
    Graham Reeves: If you've genuinely put his warnings on the record, then something came out of tonight that I couldn't have managed on my own. I'd like that noted.
}

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#exit_conversation
-> DONE

=== choice_expose ===
~ insider_confronted = true
Graham Reeves: Publish it?

Graham Reeves: Then publish all of it. My name against the board's, in the same paragraph, same size type. That's the only version of this I'll sign.

You: You'll get your name in it. Next to the people you let in.

Graham Reeves: Good. Let the readers work out which of us they're angrier at. I've a suspicion it won't be me, and that's the entire thesis.

Narrator: You log his identity into the SAFETYNET evidence package. He does not resist as backup takes the door.

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#set_global:insider_asset_exposed:true
#exit_conversation
-> DONE

=== choice_handover ===
~ insider_confronted = true
Graham Reeves: Straight to the agency. Cleaner.

Graham Reeves: Fewer chances for either of us to say something we actually mean.

Narrator: You signal SAFETYNET. Reeves sits down at the boardroom table, folds his hands, and waits with the calm of a man who believes he has already won the argument and is simply waiting for the room to catch up.

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#exit_conversation
-> DONE

=== choice_hostile ===
~ insider_confronted = true
Narrator: He steps back from the terminal.

Graham Reeves: Then we're past talking.

You: We were past talking at half past two, six weeks ago.

Graham Reeves: Everyone always is. Right up until the lights go out.

#hostile:night_security_supervisor
#set_global:insider_confronted:true
#set_global:insider_hostile:true
#set_global:insider_asset_arrested:true
#exit_conversation
-> DONE

// ===========================================
// PRESS-TERMINAL AMBUSH -- insider never identified
// Fires from eventMapping when decide_hospital_exposure completes
// ===========================================

=== press_terminal_ambush ===
~ insider_confronted = true
Narrator: Your transmission clears the relay. Behind you, unhurried, the courteous supervisor steps between you and the door.

Graham Reeves: I'm sorry. I can't let you leave here believing that was only careless budgeting.

You: Who are you?

Graham Reeves: The man who made sure it happened on schedule. Badge SC-4471. A fire drill six weeks ago that facilities never called.

Graham Reeves: And the telephone call at ten to four, which I imagine cost you rather a lot of your evening.

Narrator: The realisation lands about half a second too late. He is already moving.

Graham Reeves: You should have looked harder.

#hostile:night_security_supervisor
#set_global:insider_confronted:true
#set_global:insider_hostile:true
#set_global:insider_asset_escaped:true
#exit_conversation
-> DONE

// ===========================================
// RESOLVED
// ===========================================

=== already_resolved ===
Narrator: The post beside the comms relay is empty. There is nothing else to say to him tonight.
#exit_conversation
-> DONE
