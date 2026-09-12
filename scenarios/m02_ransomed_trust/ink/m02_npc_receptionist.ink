// ===========================================
// ACT 1 NPC: Bernie Nwosu -- Night Reception Coordinator
// Mission 2: Ransomed Trust
//
// Bernie is the first real gate in the mission. She holds the mechanical
// override key for the IT department on the hook behind her, and she is not
// handing it to a stranger just because he says a word she recognises.
//
// THREE APPROACHES, THREE DIFFERENT RESULTS:
//   honest   -> she gives you the key AND remembers you as straight with her.
//               bernie_trusts_player is what lets her VOUCH for you later,
//               after the cover burn. This is the big delayed payoff.
//   pressure -> she gives you the key, resents it, will not vouch later.
//   flatter  -> she gives you the key, likes you, but you learnt nothing.
// The key is never withheld entirely -- picking the door is always available
// anyway, so refusing it would only cost the player time, not create tension.
// What the player is actually playing for is BERNIE HERSELF, later.
//
// She also plants two hooks: the struck-through booking (cover burn), and
// the plainclothes man who never signs her log (Reeves).
// ===========================================

EXTERNAL player_name()

VAR bernie_influence = 0
VAR asked_situation = false
VAR observed_stranger = false
VAR asked_about_reeves_hours = false
VAR gave_key = false
VAR was_honest = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false
VAR bernie_trusts_player = false
VAR noticed_struck_booking = false
VAR seen_picking_by_bernie = false
VAR insider_identified = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{not gave_key:
    -> first_meeting
}
{cover_burned and not cover_restored:
    -> cover_burned_entry
}
-> returning

=== first_meeting ===
{cover_burned:
    Narrator: Bernie Nwosu is holding a phone handset away from her ear with an expression of flat disbelief. She puts it down as you reach the desk.
    Bernie Nwosu: Right. Before you say anything -- security control have just rung me about a consultant who apparently doesn't exist.
    Bernie Nwosu: I'm going to guess that's you, and I'm going to want your version first.
    -> the_struck_entry
}
Narrator: Ten past four in the morning. Every screen behind the desk is black, the lights are running amber off the generators, and somewhere above you a ventilator is doing its work in a ward with nobody watching the numbers.

Narrator: Bernie Nwosu is holding the entire front of this hospital together with a clipboard, a landline and a biro that is visibly on its last legs.

Bernie Nwosu: *not looking up* If it's about the computers -- I know. If it's about your appointment, it's cancelled. If it's about the vending machine, that's been broken since March and is nothing to do with any of this.

Bernie Nwosu: And if you're press, there's a car park you can stand in.

* [I'm the security consultant Dr. Kim called in. I'm here for the ransomware.]
    ~ bernie_influence += 1
    # influence_increased
    -> route_consultant

* [I need Dr. Kim. Where is she?]
    -> route_demand

* [You've been on this desk since it started, haven't you.]
    ~ bernie_influence += 2
    # influence_increased
    -> route_human

// ===========================================
// APPROACH 1 -- STRAIGHT
// ===========================================

=== route_consultant ===
Narrator: She looks up properly for the first time.

Bernie Nwosu: Say that again.

Bernie Nwosu: Because I have had the police, I have had two journalists and I have had a man from head office who wanted to know if the incident had been "logged in the incident system". Which is encrypted. Along with the incident.

Bernie Nwosu: So. Security consultant. Go on then. Convince me.

* [Dr. Kim requested emergency incident response at one o'clock this morning. Check your log.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    -> the_struck_entry

* [I don't need to convince you. I need to be pointed at your IT department.]
    ~ bernie_influence -= 1
    # influence_decreased
    Bernie Nwosu: Everyone who's ever nicked something from this hospital has walked in talking exactly like that.
    -> the_struck_entry

* [I can't. Ring her extension and ask her yourself.]
    ~ was_honest = true
    ~ bernie_influence += 3
    # influence_increased
    Narrator: She picks up the handset, dials four digits and waits. Somewhere up on the admin corridor, a phone rings out unanswered.
    Narrator: She replaces the receiver.

    Bernie Nwosu: She's not answering. She hasn't answered since three.
    Bernie Nwosu: But you told me to ring, which is more than the journalists did.
    -> the_struck_entry

// ===========================================
// APPROACH 2 -- PRESSURE
// ===========================================

=== route_demand ===
Bernie Nwosu: *finally looking up* And you are?

Bernie Nwosu: Because there are forty-seven people on generators upstairs and I have got no way of checking who anybody is tonight. So "I need Dr. Kim" isn't a sentence, love. It's a start of one.

* [Emergency security consultant. She called me in at one this morning.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Right. That, I can work with.
    -> the_struck_entry

* [Every minute you spend on this is a minute those generators are burning.]
    ~ bernie_influence -= 2
    # influence_decreased
    Bernie Nwosu: *very evenly* I have counted every one of those minutes tonight. Don't you dare use them on me.
    Narrator: She holds your eye for a second longer than is comfortable, then reaches for the paper log anyway.
    -> the_struck_entry

// ===========================================
// APPROACH 3 -- HUMAN
// ===========================================

=== route_human ===
Narrator: The biro stops.

Bernie Nwosu: Two forty-seven. I was on my break. Whole wall of screens went at once, like somebody threw a switch.

Bernie Nwosu: Eleven years I've done this desk. Fire alarms, floods, the roof coming in on Paediatrics. Never had the building just... stop knowing who anybody was.

Narrator: She straightens up.

Bernie Nwosu: Anyway. You're not a patient and you're not press. What are you?

* [Security consultant. Dr. Kim called me in.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    -> the_struck_entry

* [I'm the person who's going to get your screens back.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: *snorts* You and the four other men who've said that tonight. Go on then.
    -> the_struck_entry

// ===========================================
// THE HOOK -- the struck-through booking
// The player sees the first sign that someone is working against them,
// forty seconds into the mission, without knowing what it means yet.
// ===========================================

=== the_struck_entry ===
Narrator: She turns the paper log round so you can both read it. Halfway down, in the small hours: EXTERNAL SECURITY CONSULTANT -- auth: DR S. KIM.

Narrator: A line has been ruled through it. Different biro. No initials.

Bernie Nwosu: *quietly* Now that's interesting, because that's my log and that's not my crossing-out.

Bernie Nwosu: Nobody amends this book but me. That's the whole point of the book.

* [Who's been behind this desk tonight?]
    Bernie Nwosu: Me. Only me. I've not been to the toilet since two.
    Bernie Nwosu: *pause* Well. Except when I walked the police out to the car park. Five minutes, maybe.
    Narrator: She looks at the page again.

    Bernie Nwosu: Five minutes.
    -> offer_key

* [Does it matter? You know I'm expected.]
    Bernie Nwosu: It matters to me. Somebody's been at my book.
    -> offer_key

* [Leave it exactly as it is. Don't tidy it up.]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: *slowly* You want me to preserve it.
    Bernie Nwosu: You're not really a consultant, are you.
    Narrator: She lets the question sit there for a moment, then decides -- visibly -- not to ask it again.
    Bernie Nwosu: Right. It stays as it is.
    -> offer_key

// ===========================================
// THE KEY
// ===========================================

=== offer_key ===
~ gave_key = true
#complete_task:sign_in_at_reception
#unlock_aim:access_it_systems
#set_global:bernie_gave_key:true
#give_item:key:it_override_key

Narrator: She writes you into the log by hand, in biro, pressing hard.

Bernie Nwosu: Right. You're in the book. And before you ask -- no, I can't give you a badge that does anything, because none of the readers work and they can't issue new cards. The whole permissions system is sat behind that ransom screen with everything else.

Bernie Nwosu: Which is why Estates dumped every mechanical override on my hook this morning and made it my problem.

Narrator: She unhooks a worn brass key and holds it a moment before letting go of it.

Bernie Nwosu: IT's off the handover room -- straight through Ward Three, up the link, along the main corridor, then it's the door on your right as you go in. Gary is in there and he's not come out since half ten, so knock properly.

{was_honest:
    ~ bernie_influence += 2
    ~ bernie_trusts_player = true
    # influence_increased
    #set_global:bernie_trusts_player:true
    Bernie Nwosu: And listen -- you told me the truth when you could've fed me something easier. I've clocked that.
    Bernie Nwosu: Anything goes sideways for you in here tonight, you come back to this desk. Yeah?
}
{not was_honest:
    Bernie Nwosu: Sign it back in when you're done. I'll be here. I'm always here.
}

-> hub

// ===========================================
// RETURN VISITS
// ===========================================

=== returning ===
{seen_picking_by_bernie:
    Bernie Nwosu: *without looking up* I gave you a key.
    Bernie Nwosu: I watched you crouch down at a door I had already given you the key to, and do... whatever that was.
    Bernie Nwosu: I'm not going to ask. I want that on record. I am choosing not to ask.
    -> hub
}
Bernie Nwosu: Back already. Go on -- what's broken now?
-> hub

// ===========================================
// AFTER THE COVER BURN -- the payoff for Act 1
// ===========================================

=== cover_burned_entry ===
Narrator: Bernie is holding the handset away from her ear with an expression of pure disbelief.

Bernie Nwosu: *into the phone* No. No, because I signed them in myself. With my own hand. In my own book.

Bernie Nwosu: *pause* Then whoever told you that is wrong, isn't -- hello?

Narrator: She looks at the dead receiver, then at you.

Bernie Nwosu: That was security control. Somebody's rung them from an internal line and told them there is no consultant booked tonight and there never was.

-> hub

=== which_extension ===
~ asked_about_reeves_hours = true
Bernie Nwosu: Control wouldn't say. They never do.

Bernie Nwosu: I'll tell you what I can tell you, though. There's four internal phones on this side of the building that aren't behind a locked door tonight, and three of them are on my desk.

Bernie Nwosu: The fourth one's in the boardroom.

{observed_stranger:
    Bernie Nwosu: *slowly* Which is where your man in the plain suit has been stood all night, isn't it.
    Bernie Nwosu: ...I've said that out loud now. I can't unsay it.
}
-> hub

=== bernie_vouches ===
~ cover_restored = true
#set_global:bernie_vouched:true
#set_global:cover_restored:true
~ bernie_influence += 3
# influence_increased

Narrator: She does not hesitate. She dials, and when it connects her voice changes into something flat and official that she has clearly been using on this desk for eleven years.

Bernie Nwosu: Night reception, Nwosu. I'm logging a correction. The external consultant is signed in by me personally at 01:02, countersigned by Dr Kim, and I am naming myself as the vouching officer.

Bernie Nwosu: *pause* Yes. Put it against my name. All of it.

Narrator: She hangs up and writes something in the book, pressing hard.

Bernie Nwosu: There. Now if you turn out to be something other than what you've told me, it's my job as well as yours. So don't.

* [Understood. Thank you.]
    Bernie Nwosu: Go on. Before somebody rings them back.
    #exit_conversation
    -> hub

* [Why would you do that for me?]
    Bernie Nwosu: Because somebody's been at my book, and somebody's been on my phone, and I don't like being made a liar in my own lobby.
    Bernie Nwosu: Also you told me the truth this morning when you didn't have to. That's rarer than you'd think.
    #exit_conversation
    -> hub

=== bernie_hesitates ===
Bernie Nwosu: *long pause* I want to.

Bernie Nwosu: But I've got a supervisor telling me one thing and a phone call telling me another, and if I put my name to the wrong one of those I'm out of a job I've done for eleven years.

Bernie Nwosu: I signed you in. That's on the page. That's what I've got.

* [That's fair. I'll find another way.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: *quietly* If it helps -- the wards issue their own lanyards. Sister Doyle's got a drawer full for the agency staff.
    Bernie Nwosu: I didn't say that.
    #exit_conversation
    -> hub

+ [Eleven years and you'd rather be right on paper than right.]
    ~ bernie_influence -= 2
    # influence_decreased
    Narrator: She turns back to her forms.

    Bernie Nwosu: Off you go.
    #exit_conversation
    -> hub

// ===========================================
// MAIN HUB
// ===========================================

=== hub ===
+ {cover_burned and not cover_restored and bernie_trusts_player} [I need you to say that to security control. Out loud, on the record, under your own name.]
    -> bernie_vouches

+ {cover_burned and not cover_restored and not bernie_trusts_player} [You know I'm meant to be here. Back me up.]
    -> bernie_hesitates

+ {cover_burned and not asked_about_reeves_hours} [That call came off an internal line. Which extensions can reach control?]
    -> which_extension

+ {not asked_situation} [How bad is it upstairs, honestly?]
    -> ask_situation

+ {not observed_stranger} [You're on this desk all night. Has anyone come through who doesn't belong?]
    -> observe_stranger

+ {observed_stranger and not asked_about_reeves_hours} [This man in the plain suit. How long has he been around?]
    -> reeves_hours

+ {insider_identified} [Graham Reeves. Tell me everything you've noticed about him.]
    -> reeves_confirmed

+ [I should get moving.]
    Bernie Nwosu: {bernie_influence >= 4: Go on. And come back if you need me.|Right you are.}
    #exit_conversation
    -> hub

=== ask_situation ===
~ asked_situation = true

Bernie Nwosu: Honestly? Nobody knows anything about anybody.

Bernie Nwosu: We can't tell you what you're allergic to. We can't tell you what you were given at eight. We can't tell you which consultant is yours or when your surgery is or whether your mum was moved to another ward.

Bernie Nwosu: A man came in at four looking for his wife. I had to walk him round three wards reading names off the ends of beds.

Bernie Nwosu: That's what it is. It's not the money. It's that this place has forgotten everybody in it.

+ [How are you still standing?]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: *small laugh* Vending machine's broken, so it's not that.
    Bernie Nwosu: You just keep going, don't you. Same as the girls upstairs.
    -> hub

+ [Then let's give it its memory back.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: You say that like it's a thing a person can do.
    -> hub

// ===========================================
// THE REEVES BREADCRUMB
// Optional. Pure foreshadowing, no puzzle flags -- but the curious
// player walks into the boardroom already suspicious of him.
// ===========================================

=== observe_stranger ===
~ observed_stranger = true

Bernie Nwosu: *lowering her voice without seeming to decide to* Now you mention it.

Bernie Nwosu: There's a fella on the night security detail. Plain suit, no uniform, no lanyard from us. Very polite. Very. Stands himself down by the boardroom and the comms relay and doesn't move.

Bernie Nwosu: Everybody signs this book. Contractors, engineers, the lot, all night long. He never has. Says he's "posted", like that's an answer.

+ [What's his name?]
    Bernie Nwosu: Reeves. Graham, I think. Says it like you should already know it.
    -> hub

+ [Have you raised it with anyone?]
    Bernie Nwosu: Val's raised it. Val on security -- she's in that office by the server room, and she's had him in her notebook for weeks.
    Bernie Nwosu: Got told it's crisis protocol. Twice. By people who won't put it in writing.
    -> hub

+ [Probably nothing. But thanks.]
    Bernie Nwosu: That's what I keep telling myself. It's been that sort of night.
    -> hub

=== reeves_hours ===
~ asked_about_reeves_hours = true

Bernie Nwosu: Since the summer, he says.

Bernie Nwosu: And here's the thing I keep chewing on. Eleven years I've sat at this desk. Every face that comes through those doors, twice a night, for eleven years.

Bernie Nwosu: I had never once clapped eyes on that man before this started.

-> hub

=== reeves_confirmed ===
Bernie Nwosu: *very still* Reeves.

Bernie Nwosu: Six weeks ago there was a fire drill. Half two in the morning, no warning, nothing on the board. Estates were livid -- they hadn't scheduled it.

Bernie Nwosu: He walked two men in high-vis through this lobby and told me they were with facilities. I asked for names for the book.

Bernie Nwosu: He said, "That's alright, Bernie, I'll sign for them." And I let him. Because he was security and I was on my own and it was half two in the morning.

Narrator: She puts the biro down.

Bernie Nwosu: I let him.

* [That wasn't your failure. It was his job to be believed.]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: *not convinced, but grateful* Aye. Well.
    Bernie Nwosu: You go and be somebody's failure back at him.
    #exit_conversation
    -> hub

+ [Write it down. Exactly as you just said it, and sign it.]
    ~ bernie_influence += 2
    # influence_increased
    Narrator: She is already reaching for a fresh sheet.

    Bernie Nwosu: Every word.
    Bernie Nwosu: If somebody's going to ask questions about tonight, they can have mine in writing.
    #exit_conversation
    -> hub
