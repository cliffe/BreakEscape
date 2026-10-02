// ===========================================
// ACT 3 NPC: Graham Reeves -- Night Security Supervisor / ENTROPY inside asset
// Mission 2: Ransomed Trust
//
// The polite man who has been helpful all night. He authorised the fire drill
// that put ENTROPY's device on the LAN six weeks ago, and he is the one who
// rang security control and pulled the player's booking -- which is the
// mission's midpoint turn paying off in the villain's own mouth.
//
// Gated reveal: he stays in cover until insider_identified -- which the player
// sets by naming him (to HaX, or here: "You're badge SC-4471."). If the player
// never names him, he confronts them at the press terminal and walks out, so the
// thread always resolves. Pass 4: that ambush is a walk-out, not a fight, and it
// is what sets mission_complete (the terminal defers it via awaiting_ambush), so
// the debrief can no longer start on top of it.
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
VAR insider_badge_id_found = false
VAR inspected_asset_post = false
VAR exposed_hospital = false
VAR awaiting_ambush = false
VAR mission_complete = false

VAR cover_probed = false
VAR asked_guarding = false
VAR asked_plainclothes = false
VAR asked_badge = false

=== start ===
// Before the confronted check: the ambush sets insider_confronted as it starts, so
// an ambush interrupted by a reload must still be resumable here.
{awaiting_ambush and not mission_complete:
    -> press_terminal_ambush
}
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
Narrator: He stands beside the comms relay, hands loosely clasped, like a man who has stood in exactly that spot for a very long time and doesn't mind.

Graham Reeves: Evening. You'll be the consultant Dr Kim brought in.

Graham Reeves: Graham Reeves, night security supervisor. I've the comms watch while the systems are down.

Graham Reeves: Anything you want to send from that terminal comes through me first. Just process. It's a bad night for half a story getting out.

-> cover_hub

=== cover_hub ===
// Round 3: one question covers the post and the plain clothes, to keep the hub short.
+ {not asked_guarding} [What are you guarding in here, and why no uniform?]
    -> cover_guarding

+ {cover_burned and not cover_restored and not cover_probed} [Somebody told security control I was never booked in. Any idea who?]
    -> cover_probe

// Round 2 (re-review M1): accusing him needs the duty sheet that ties the badge to
// this post. Without it the player can only probe, and he deflects.
+ {insider_badge_id_found and inspected_asset_post and not insider_identified} [You're badge SC-4471.]
    -> name_him

+ {insider_badge_id_found and not inspected_asset_post and not asked_badge} [What badge number do you carry on this post?]
    ~ asked_badge = true
    Graham Reeves: The one security issued me, same as everybody's. Why do you ask?
    Graham Reeves: If it's a records question, the post has a log. I'm sure it's somewhere.
    -> cover_hub

+ [Nothing for now.]
    Graham Reeves: Of course. I'll be here.
    Graham Reeves: Do get those wards back, won't you. People are relying on it.
    #exit_conversation
    -> DONE

=== cover_guarding ===
~ asked_guarding = true

Graham Reeves: The relay, principally. It's the only line out of this building that still works.

Graham Reeves: The danger tonight is the press getting half of it. People fill the gaps with whatever frightens them most.

Graham Reeves: So what leaves this room is the whole picture, or nothing at all.

-> cover_plainclothes

=== cover_plainclothes ===
~ asked_plainclothes = true

Graham Reeves: As for the suit, crisis protocol. A uniform in a corridor makes people ask what's happened, and then you've a queue of anxious relatives.

Graham Reeves: I've held this post since the summer. I know this building better than most who work in it. That's just what nights do to you.

-> cover_hub

=== cover_probe ===
~ cover_probed = true

Graham Reeves: *nothing in his face moves* How very odd.

Graham Reeves: In fairness to control, they've no way of confirming anybody tonight. A phone call and a paper book, both only as good as whoever last touched them.

Graham Reeves: If somebody wanted to make a person disappear tonight, they wouldn't need to be clever. They'd need a telephone.

* [That's a very complete answer for someone hearing it for the first time.]
    Graham Reeves: ...I've been in security a long while.
    Graham Reeves: You get so you can see how a thing was done. It's an unattractive habit.
    -> cover_hub

* [Thanks. I'll bear it in mind.]
    Graham Reeves: Do.
    -> cover_hub

// The player's own deduction, made to his face (pass 4). HaX confirms by text.
=== name_him ===
~ insider_identified = true
#set_global:insider_identified:true
#complete_task:unmask_identify
-> confrontation

// ===========================================
// CONFRONTATION -- insider_identified
// ===========================================

=== confrontation ===
Narrator: You say the badge number out loud. SC-4471. The fire drill nobody scheduled.

Narrator: The courteous expression switches off, cleanly, like a lamp.

Graham Reeves: So you did the work.

Graham Reeves: Good. Otherwise I'd have sat here another six hours being helpful, and that's far more tiring than this.

{cover_burned:
    -> confrontation_the_call
}
-> confrontation_why

=== confrontation_the_call ===
Graham Reeves: *a tilt of the head at the wall phone* You'll want to ask about the telephone.

Graham Reeves: I rang control from that phone and told them there was no consultant booked. That was all. Eleven words.

Graham Reeves: No violence. Nothing anyone could charge me with. I removed your standing.

Graham Reeves: Someone with no standing spends the night explaining themselves in corridors instead of reading logs.

{insider_method_confirmed:
    Graham Reeves: You've read their note about it, haven't you. "Better at this than we pay him to be."
    Graham Reeves: I did rather enjoy that.
}

* [It cost me twenty minutes.]
    Graham Reeves: Twenty minutes. On a twelve-hour generator.
    Graham Reeves: That's the scale I work in. Nobody ever notices the twenty minutes. That's why it works.
    -> confrontation_why

* [You've stood here all night being helpful, after you'd sabotaged me.]
    Graham Reeves: Yes.
    Graham Reeves: I've been helpful to this entire hospital all night. You're the first person who's noticed that's the point.
    -> confrontation_why

* {bernie_vouched} [It didn't work. Bernie put her own name against mine.]
    Narrator: For the first time, something crosses his face that he hasn't chosen.
    Graham Reeves: ...Bernadette did that.
    Graham Reeves: Six months, and she never once made me sign her book. I took that for laziness.
    Graham Reeves: It appears it was manners.
    -> confrontation_why

=== confrontation_why ===
Graham Reeves: You want to know why. They always want to know why.

* [You held the door open for people who put a ward on generators.]
    Graham Reeves: I held a door open. Be precise about that. Everyone in this building held one, and none of them will be asked about it.
    -> monologue_1

* [Six months on this post and you sold it. What did they pay you?]
    Graham Reeves: Ask the second question first next time. It's the one you actually want answered.
    -> monologue_1

* [I don't need why. I need you away from that terminal.]
    Graham Reeves: You'll get the why anyway. It's the only part of this I'm here for.
    -> monologue_1

=== monologue_1 ===
Graham Reeves: Money. That's the first guess, always.

Graham Reeves: Do you know what this hospital pays a night supervisor to hold a building full of sick people together, ten till six?

Graham Reeves: Less than the catering for the meeting where they cut Gary Whitlock's budget. I carried the trays out afterwards.

Graham Reeves: I raised the servers too. I've been raising things since the day I arrived. I was told to mind my post.

* [Being ignored doesn't give you licence.]
    Graham Reeves: No. Licences are what people with titles issue each other.
    -> monologue_2

* [So they came along and listened.]
    Graham Reeves: They asked about my own building and wrote the answers down. Do you know how long it had been?
    -> monologue_2

* [Gary was ignored too. He wrote seven emails. He didn't do this.]
    Graham Reeves: No. He wrote his seven emails and waited to be listened to. In a fortnight they'll sack him for it.
    Graham Reeves: That's not a counter-argument. That's my closing statement.
    -> monologue_2

=== monologue_2 ===
Graham Reeves: "Recruited" is the word everyone reaches for. They agreed with me. That's all.

Graham Reeves: And look at what I did. I confirmed a window. I walked two men through a lobby during a drill. I made one telephone call.

Graham Reeves: The deferred patch, the scanner over the servers: every one of those was decided by somebody with a title, in daylight, with minutes taken.

Graham Reeves: They built it. I only stopped it being invisible.

Narrator: His hand settles near the lanyard at his collar.

-> confrontation_choice

// ===========================================
// FOCUSED CHOICE -- stance, not outcome
// ===========================================

=== confrontation_choice ===
Graham Reeves: So. You've found me. What happens now is your call, agent.

+ [Quietly. You're under arrest. SAFETYNET has you.]
    -> choice_arrest

+ [You go public. Your name, alongside every one of theirs.]
    -> choice_expose

+ [I'm done talking. Explain it to SAFETYNET.]
    -> choice_handover

+ [You don't walk out of here.] #color:red
    -> choice_hostile

=== choice_arrest ===
~ insider_confronted = true
Graham Reeves: No fuss. Good.

Graham Reeves: I told them a fuss was beneath the point.

Graham Reeves: The point is that nobody in this sector can ever say they didn't know. Give it a year. You'll see it in the budgets.

Narrator: He offers his wrists without being asked. Whatever else he is, he came to work tonight ready to be caught.

{gary_protected:
    Graham Reeves: The IT lad. Whitlock.
    Graham Reeves: If you've really put his warnings on the record, then something came of tonight I couldn't manage on my own. I'd like that noted.
}

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#exit_conversation
-> DONE

=== choice_expose ===
~ insider_confronted = true
Graham Reeves: Publish it?

Graham Reeves: Then publish all of it. My name against the board's, same paragraph, same size type.

Graham Reeves: Let the readers decide which of us they're angrier at. I suspect it won't be me. That's the whole thesis.

Narrator: You log his identity into the SAFETYNET evidence package. He doesn't resist when backup takes the door.

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#set_global:insider_asset_exposed:true
#exit_conversation
-> DONE

=== choice_handover ===
~ insider_confronted = true
Graham Reeves: Straight to the agency. Cleaner.

Graham Reeves: Fewer chances for either of us to say something we actually mean.

Narrator: You signal SAFETYNET. Reeves sits at the boardroom table, folds his hands, and waits like a man who thinks he's already won the argument.

#set_global:insider_confronted:true
#set_global:insider_asset_arrested:true
#exit_conversation
-> DONE

=== choice_hostile ===
~ insider_confronted = true
Narrator: He steps back from the terminal.

Graham Reeves: Then we're past talking.

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
#set_global:insider_confronted:true
#set_global:insider_ambushed:true
{exposed_hospital:
    Narrator: Your transmission clears the relay. Behind you, unhurried, the courteous supervisor steps between you and the door.
- else:
    Narrator: You close the terminal without sending anything. Behind you, unhurried, the courteous supervisor steps between you and the door.
}

Graham Reeves: I'm sorry. I can't let you leave believing that was only careless budgeting.

Graham Reeves: I'm the man who made sure it ran on schedule. Badge SC-4471. A fire drill six weeks ago that facilities never called.

Graham Reeves: And the telephone call, which I imagine cost you a good deal of your evening.

// Round 2: one reply for the player before he goes. Every answer ends the same way.
* [You won't get far.]
    Graham Reeves: I don't need far. I need the next hour, and everyone in this building is looking at a ward.
* [Go for the door.]
    Narrator: He's closer to it than you are. He planned it that way.
* [Say nothing.]
    Graham Reeves: That's fair. I'd have nothing to say to me either.
-
Graham Reeves: You should have looked harder.

Narrator: You move half a second too late. He's through the door, and by the time you reach the corridor it's empty.

#set_global:insider_asset_escaped:true
#set_global:mission_complete:true
#exit_conversation
-> DONE

// ===========================================
// RESOLVED
// ===========================================

=== already_resolved ===
Narrator: The post beside the comms relay is empty.
#exit_conversation
-> DONE
