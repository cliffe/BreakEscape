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
// Pass 4 dialogue: a re-talk re-navigates to hub, so the hub carries the return
// greeting and the cover-burn phone call. hub_quiet skips it once after a reply or
// a goodbye; met_after_burn stops the phone call replaying for a player who first
// met her after the burn (she has already told them).
VAR hub_quiet = false
VAR met_after_burn = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false // Synced scenario global: the player's cover is re-established (Bernie vouches here); also set by Val (m02_npc_security_guard)
VAR bernie_trusts_player = false
VAR noticed_struck_booking = false
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
    ~ met_after_burn = true
    Narrator: Bernie Nwosu is holding a phone handset away from her ear. She puts it down as you reach the desk.
    Bernie Nwosu: Before you say anything. Security control have just rung me about a consultant who apparently doesn't exist.
    Bernie Nwosu: I'm guessing that's you. I want your version first.
    -> the_struck_entry
}
Narrator: Ten past four in the morning. Every screen behind the desk is black, and the lights run amber off the generators.

Narrator: Bernie Nwosu is holding the front of this hospital together with a clipboard, a landline and a dying biro.

Bernie Nwosu: *not looking up* If it's the computers, I know. If it's your appointment, it's cancelled.

Bernie Nwosu: If it's the vending machine, that's been broken since March. And if you're press, there's a car park you can stand in.

* [I'm the security consultant Dr. Kim called in. It's about the ransomware.]
    ~ bernie_influence += 1
    # influence_increased
    -> route_consultant

* [I need Dr. Kim. Where is she?]
    -> route_demand

* [You've been on this desk since it started, haven't you?]
    ~ bernie_influence += 2
    # influence_increased
    -> route_human

// ===========================================
// APPROACH 1 -- STRAIGHT
// ===========================================

=== route_consultant ===
Bernie Nwosu: Say that again.

Bernie Nwosu: I've had the police, two journalists, and a man from head office asking if it's been "logged in the incident system".

Bernie Nwosu: Which is encrypted. Along with the incident.

Bernie Nwosu: So. Security consultant. Convince me.

* [Dr. Kim called for emergency incident response at one this morning. Check your log.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Oh, I will.
    -> the_struck_entry

* [I don't need to convince you. Just point me at IT.]
    ~ bernie_influence -= 1
    # influence_decreased
    Bernie Nwosu: Everyone who's ever nicked something from this hospital walked in talking like that.
    -> the_struck_entry

* [I can't. Ring her extension and ask her yourself.]
    ~ was_honest = true
    Narrator: She dials four digits and waits. Somewhere up on the admin corridor, a phone rings out.
    ~ bernie_influence += 3
    # influence_increased
    Bernie Nwosu: Not answering. She hasn't answered since three.
    Bernie Nwosu: But you told me to ring, which is more than the journalists did.
    -> the_struck_entry

// ===========================================
// APPROACH 2 -- PRESSURE
// ===========================================

=== route_demand ===
Bernie Nwosu: And you are?

Bernie Nwosu: Forty-seven people upstairs on generators, and I've no way of checking who anybody is tonight.

Bernie Nwosu: So "I need Dr. Kim" isn't a sentence. It's the start of one.

* [Emergency security consultant. She called me in at one this morning.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Right. That I can work with.
    -> the_struck_entry

* [Every minute you spend on this, those generators are burning.]
    ~ bernie_influence -= 2
    # influence_decreased
    Bernie Nwosu: *very evenly* I've counted every one of those minutes tonight. Don't you dare use them on me.
    Narrator: She holds your eye a second too long, then reaches for the paper log anyway.
    -> the_struck_entry

// ===========================================
// APPROACH 3 -- HUMAN
// ===========================================

=== route_human ===
Bernie Nwosu: Two forty-seven. I was on my break. The whole wall of screens went at once, like somebody threw a switch.

Bernie Nwosu: Eleven years I've done this desk. Fires, floods, the roof coming in on Paediatrics.

Bernie Nwosu: Never had the building just... stop knowing who anybody was.

Bernie Nwosu: Anyway. You're not a patient and you're not press. What are you?

* [Security consultant. Dr. Kim called me in.]
    ~ was_honest = true
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Did she, now. Let's have a look.
    -> the_struck_entry

* [I'm the person who's going to get your screens back.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: You and four others tonight. Go on, then.
    -> the_struck_entry

// ===========================================
// THE HOOK -- the struck-through booking
// The player sees the first sign that someone is working against them,
// forty seconds into the mission, without knowing what it means yet.
// ===========================================

=== the_struck_entry ===
Narrator: She turns the paper log round so you can both read it. Halfway down, in the small hours: EXTERNAL SECURITY CONSULTANT -- auth: DR S. KIM.

Narrator: A line has been ruled through it. Different biro. No initials.

Bernie Nwosu: That's my log. And that's somebody else's crossing-out.

Bernie Nwosu: Nobody amends this book but me. That's the whole point of the book.

* [Who's been behind this desk tonight?]
    Bernie Nwosu: Me. Only me. I've not been to the loo since two.
    Bernie Nwosu: Except when I walked the police out to the car park. Five minutes, maybe.
    Bernie Nwosu: ...Five minutes.
    -> offer_key

* [Does it matter? You know I'm expected.]
    Bernie Nwosu: It matters to me. Somebody's been at my book.
    -> offer_key

* [Leave it exactly as it is. Don't tidy it up.]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: You want me to preserve it.
    Bernie Nwosu: You're not really a consultant, are you.
    Narrator: She lets the question sit, then visibly decides not to ask it again.
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

Narrator: She writes you into the log by hand, pressing hard.

Bernie Nwosu: You're in the book. And no, I can't give you a badge that does anything.

Bernie Nwosu: The readers are down, and the permissions system's behind that ransom screen with everything else.

Bernie Nwosu: So Estates dumped every mechanical override on my hook and made it my problem.

Narrator: She unhooks a worn brass key and holds it a moment before she lets go.

Bernie Nwosu: IT's off the handover room. Through Ward Three, along the link and up the main corridor. In the handover room, IT's the door on your right.

Bernie Nwosu: Gary's in there. He's not come out since half ten, so knock properly.

{was_honest:
    ~ bernie_influence += 2
    ~ bernie_trusts_player = true
    # influence_increased
    #set_global:bernie_trusts_player:true
    Bernie Nwosu: And listen. You told me the truth when you could've fed me something easier. I've clocked that.
    Bernie Nwosu: Anything goes sideways for you tonight, you come back to this desk. Yeah?
}
{not was_honest:
    Bernie Nwosu: Sign it back in when you're done. I'll be here. I'm always here.
}

~ hub_quiet = true
-> hub

// ===========================================
// RETURN VISITS
// ===========================================

// Pass 4: the "I watched you pick a door" branch is gone. Nothing could ever set it --
// reception has no key lock and her catch mapping wasn't a person-chat.
=== returning ===
Bernie Nwosu: Back already. Go on, what's broken now?
~ hub_quiet = true
-> hub

// ===========================================
// AFTER THE COVER BURN -- the payoff for Act 1
// ===========================================

=== cover_burned_entry ===
Narrator: Bernie is holding the handset away from her ear.

Bernie Nwosu: *into the phone* No. I signed them in myself. With my own hand, in my own book.

Bernie Nwosu: Then whoever told you that is wrong, isn't -- hello?

Bernie Nwosu: That was security control. Somebody's rung them from an internal line to say there's no consultant booked tonight. Never was.

~ hub_quiet = true
-> hub

=== which_extension ===
~ asked_about_reeves_hours = true
Bernie Nwosu: Control wouldn't say. They never do.

Bernie Nwosu: But there's four internal phones on this side of the building that aren't behind a locked door tonight. Three of them are on my desk.

Bernie Nwosu: The fourth one's in the boardroom.

{observed_stranger:
    Bernie Nwosu: Which is where your man in the plain suit's been stood all night, isn't it.
    Bernie Nwosu: ...I've said that out loud now. I can't unsay it.
}
~ hub_quiet = true
-> hub

=== bernie_vouches ===
~ cover_restored = true
#set_global:bernie_vouched:true
#set_global:cover_restored:true

Narrator: She doesn't hesitate. She dials, and her voice goes flat and official, eleven years of front desk in it.

~ bernie_influence += 3
# influence_increased
Bernie Nwosu: Night reception, Nwosu. Logging a correction. The external consultant was booked at 01:02 on Dr Kim's authority and signed in by me personally.

Bernie Nwosu: I'm naming myself as the vouching officer. Yes. Put it against my name. All of it.

Bernie Nwosu: There. If you turn out to be something other than what you've told me, it's my job as well as yours. So don't.

* [Understood. Thank you.]
    Bernie Nwosu: Go on. Before somebody rings them back.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

* [Why would you do that for me?]
    Bernie Nwosu: Somebody's been at my book and on my phone. I don't like being made a liar in my own lobby.
    Bernie Nwosu: And you told me the truth this morning when you didn't have to. That's rarer than you'd think.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== bernie_hesitates ===
Bernie Nwosu: I want to.

Bernie Nwosu: But I've a supervisor telling me one thing and a phone call telling me another. Back the wrong one and I'm out of a job I've done eleven years.

Bernie Nwosu: I signed you in. That's on the page. That's what I've got.

* [That's fair. I'll find another way.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: If it helps, the wards issue their own lanyards. Sister Doyle's got a drawer full for the agency staff.
    Bernie Nwosu: I didn't say that.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

+ [Eleven years, and you'd rather be right on paper than right.]
    Narrator: She turns back to her forms.
    ~ bernie_influence -= 2
    # influence_decreased
    Bernie Nwosu: Off you go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// MAIN HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {cover_burned and not cover_restored and not cover_burned_entry and not met_after_burn:
        -> cover_burned_entry
    }
    Bernie Nwosu: {&Back already. What's broken now?|Go on, then.|What do you need?}
}
+ {cover_burned and not cover_restored and bernie_trusts_player} [Say that to security control. On the record, under your own name.]
    -> bernie_vouches

+ {cover_burned and not cover_restored and not bernie_trusts_player} [You know I'm meant to be here. Back me up.]
    -> bernie_hesitates

+ {cover_burned and not asked_about_reeves_hours} [That call came off an internal line. Which phones can reach control?]
    -> which_extension

+ {not asked_situation} [How bad is it upstairs, honestly?]
    -> ask_situation

+ {not observed_stranger} [Has anyone come through tonight who doesn't belong?]
    -> observe_stranger

+ {observed_stranger and not asked_about_reeves_hours} [This man in the plain suit. How long has he been around?]
    -> reeves_hours

+ {insider_identified} [Graham Reeves. Tell me everything you've noticed about him.]
    -> reeves_confirmed

+ [I should get moving.]
    Bernie Nwosu: {bernie_influence >= 4: Go on. And come back if you need me.|Right you are.}
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_situation ===
~ asked_situation = true

Bernie Nwosu: Honestly? Nobody knows anything about anybody.

Bernie Nwosu: We can't tell you what you're allergic to, or what you were given at eight, or whether your mum's been moved.

Bernie Nwosu: A man came in at four looking for his wife. I walked him round three wards reading names off the ends of beds.

Bernie Nwosu: Forget the money. This place has forgotten everybody in it.

+ [How are you still standing?]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Vending machine's broken, so it's not the caffeine.
    Bernie Nwosu: You just keep going, don't you. Same as the girls upstairs.
    ~ hub_quiet = true
    -> hub

+ [Then let's give it its memory back.]
    ~ bernie_influence += 1
    # influence_increased
    Bernie Nwosu: You say that like it's a thing a person can do.
    ~ hub_quiet = true
    -> hub

// ===========================================
// THE REEVES BREADCRUMB
// Optional. Pure foreshadowing, no puzzle flags -- but the curious
// player walks into the boardroom already suspicious of him.
// ===========================================

=== observe_stranger ===
~ observed_stranger = true

Bernie Nwosu: *lowering her voice* Now you mention it.

Bernie Nwosu: There's a fella on night security. Plain suit, no uniform, no lanyard from us. Very polite. Very.

Bernie Nwosu: He stands himself by the boardroom and the comms relay and doesn't move.

Bernie Nwosu: Everybody signs this book. Contractors, engineers, the lot. He never has. Says he's "posted", like that's an answer.

+ [What's his name?]
    Bernie Nwosu: Couldn't tell you. He's never signed, so he's never had to say.
    ~ hub_quiet = true
    -> hub

+ [Have you raised it with anyone?]
    Bernie Nwosu: Val has. Val on security. She walks the main corridor outside the security office, and she's had him in her notebook for weeks.
    Bernie Nwosu: Got told it was crisis protocol and to leave it. Twice.
    ~ hub_quiet = true
    -> hub

+ [Probably nothing. But thanks.]
    Bernie Nwosu: That's what I keep telling myself.
    ~ hub_quiet = true
    -> hub

=== reeves_hours ===
~ asked_about_reeves_hours = true

Bernie Nwosu: Since the summer, he says.

Bernie Nwosu: Eleven years I've sat at this desk. Every face through those doors, twice a night.

Bernie Nwosu: I'd never once clapped eyes on that man before this started.

~ hub_quiet = true
-> hub

=== reeves_confirmed ===
Bernie Nwosu: *very still* Reeves.

Bernie Nwosu: Six weeks ago there was a fire drill. Half two in the morning, nothing on the board. Estates were livid. They hadn't scheduled it.

Bernie Nwosu: He walked two men in high-vis through this lobby and said they were with facilities. I asked for names for the book.

Bernie Nwosu: He said, "That's alright, Bernie, I'll sign for them." And I let him.

Bernie Nwosu: He was security, I was on my own, and it was half two in the morning.

Bernie Nwosu: ...I let him.

* [That's on him. His whole job was to be believed.]
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Yeah. Well.
    Bernie Nwosu: Go and make it cost him.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

+ [Write it down, exactly as you just said it, and sign it.]
    Narrator: She's already reaching for a fresh sheet.
    ~ bernie_influence += 2
    # influence_increased
    Bernie Nwosu: Every word.
    Bernie Nwosu: If somebody's going to ask questions about tonight, they can have mine in writing.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
