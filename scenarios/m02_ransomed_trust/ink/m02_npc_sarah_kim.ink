// ===========================================
// ACT 1/2 NPC: Dr. Sarah Kim -- Chief Technology Officer
// Mission 2: Ransomed Trust
//
// Kim is the person who called you in and the person who caused this, and she
// knows both of those things at the same time. She is the mission's exposition
// engine for the central premise -- SHE CANNOT AUTHORISE ANYTHING, because the
// system that grants authorisation is behind the ransom screen. That is the
// line that makes the whole mission make sense, and it comes from her.
//
// She gives: the boardroom code, the pointer to Gary, a countersigned paper
// badge that opens nothing, and the fire-drill seed (she never approved it).
//
// Her big consequence choice is the board vote. advised_board_pay /
// advised_board_refuse are read back in the closing debrief against what the
// player ACTUALLY did at the recovery console. Telling her to hold the line
// and then paying anyway is a specific, remembered betrayal.
// ===========================================

EXTERNAL player_name()

VAR kim_influence = 0
VAR kim_guilt_revealed = false
VAR topic_attack_vector = false
VAR topic_gary = false
VAR topic_ransom_vote = false
VAR topic_fire_drill = false
VAR topic_escrow = false
VAR player_warned_kim = false
VAR access_explained = false
VAR advised_on_vote = false
VAR kim_statement_given = false   // protect_gary and board_coverup both hand it over; only once

// Synced from globalVars by engine at call-open
VAR insider_evidence_partial = false
VAR insider_identified = false
VAR cover_burned = false
VAR cover_restored = false
VAR board_coverup_email_found = false
VAR offline_keys_recovered = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{access_explained:
    -> returning
}
-> first_meeting

=== first_meeting ===
Narrator: Dr. Sarah Kim is standing at the window with a mobile in each hand. She has been up since three and it shows in a way that expensive tailoring cannot do anything about.

Dr. Sarah Kim: You're the consultant.

Dr. Sarah Kim: I'm going to say three things very quickly, because I am waiting on a board call that has been rescheduled twice and will land the moment I stop expecting it.

Dr. Sarah Kim: Forty-seven patients on generators. Twelve hours of fuel. And the board votes on paying these people in four.

* [Then let's not waste any of it. Tell me how they got in.]
    ~ kim_influence += 5
    # influence_increased
    -> explain_attack

* [You called us in. That took nerve, given what the vote's going to cost you.]
    ~ kim_influence += 10
    # influence_increased
    Dr. Sarah Kim: *a short, unamused breath* Nerve. That's a generous word for it.
    Dr. Sarah Kim: I called you in because I had already decided who was to blame and I wanted somebody in the building who wasn't me.
    ~ kim_guilt_revealed = true
    -> explain_attack

* [Four things. You've missed one. What do you actually need from me?]
    ~ kim_influence += 8
    # influence_increased
    Dr. Sarah Kim: *pause* Yes. All right.
    Dr. Sarah Kim: I need an alternative. Any alternative. I cannot walk into that room with nothing but a Bitcoin address.
    -> explain_attack

// ===========================================
// HOW THEY GOT IN
// ===========================================

=== explain_attack ===
~ topic_attack_vector = true

Dr. Sarah Kim: The backup server. There is a flaw in the file transfer software on it -- old, publicly documented, patchable for years.

Dr. Sarah Kim: I am not going to pretend I understand the technical detail. That is Gary Whitlock's world and he has been trying to explain it to me since May.

Dr. Sarah Kim: What I understood was the figure next to it. Eighty-five thousand pounds.

* [And you deferred it.]
    ~ kim_guilt_revealed = true
    Dr. Sarah Kim: I deferred it. Yes. Say the next bit as well, you've clearly got it ready.
    -> the_deferral

* [What did you spend it on instead?]
    ~ kim_guilt_revealed = true
    Narrator: She does not pretend not to understand the question.
    -> the_deferral

* [Understood. Where's Gary now?]
    ~ topic_gary = true
    -> discuss_gary

=== the_deferral ===
~ kim_guilt_revealed = true

Dr. Sarah Kim: A replacement scanner. Three point two million.

Dr. Sarah Kim: And before you say it -- yes, I can defend that decision. I can defend it very well. I have defended it in front of a commissioning board with a slide deck. Imaging capacity against infrastructure that has never once failed.

Narrator: She stops. Looks at the dead screen on her desk.

Dr. Sarah Kim: It has never once failed. That was the actual sentence. I said it out loud in March.

* [You made a clinical trade-off with the information you had. That's the job.]
    ~ kim_influence += 8
    # influence_increased
    Dr. Sarah Kim: I had the information. That's rather the difficulty. It was in my inbox seven times.
    -> access_problem

* [You had a written warning from your own administrator. Seven of them.]
    ~ kim_influence -= 5
    # influence_decreased
    Dr. Sarah Kim: *evenly* I know exactly how many there were. I replied to all of them.
    Dr. Sarah Kim: I would rather you were the one saying that to me than a coroner. Get on with your job.
    -> access_problem

* [Save it for the inquiry. Right now I need doors.]
    ~ kim_influence += 5
    # influence_increased
    Dr. Sarah Kim: *almost relieved* Thank you. Yes. Doors.
    -> access_problem

// ===========================================
// THE CENTRAL PREMISE -- she cannot grant access
// ===========================================

=== access_problem ===
~ access_explained = true
#complete_task:meet_dr_kim
#unlock_aim:access_it_systems
#give_item:id_badge

Dr. Sarah Kim: Now. This is where I have to disappoint you, and I want to be precise about it, because everyone I have said this to tonight has assumed I am being obstructive.

Dr. Sarah Kim: I am the Chief Technology Officer of this hospital and I cannot grant you access to a single room in it.

* [Because?]
    -> access_because

* [Your badge system is encrypted along with everything else.]
    ~ kim_influence += 10
    # influence_increased
    Narrator: For the first time she looks at you with something like interest.

    Dr. Sarah Kim: Thank you. Yes.
    -> access_because

=== access_because ===
Dr. Sarah Kim: Access control runs on the same estate as everything else. Every permission, every card mapping, every door group. All of it is sat behind that ransom screen.

Dr. Sarah Kim: So I can authorise you verbally until I lose my voice and it will not open one door, because there is nothing left that can be told about it.

Narrator: She signs your paper badge, writes an extension number on it, and hands it back.

Dr. Sarah Kim: That is genuinely the extent of my power tonight. A signature on a piece of card.

Dr. Sarah Kim: Everything mechanical, Estates dumped on reception this morning -- back down through the ward, if you have not come that way. Bernie has the override keys on a hook and rather more authority than her job title suggests. Be nice to her.

Dr. Sarah Kim: And the server room -- I cannot help you at all. That reader is on its own isolated controller, which is the one thing in this building that Gary won an argument about, and it will only take a card that already exists. He has one. I do not.

+ [So my route is Gary.]
    Dr. Sarah Kim: Your route is Gary.
    Dr. Sarah Kim: Through the handover room, the door on the east side, behind the override lock. He has been in there since half past ten and I have not had the courage to go and knock.
    -> hub

+ [Then what have you actually got?]
    Dr. Sarah Kim: A boardroom, a telephone and four hours.
    -> hub

// ===========================================
// HUB
// ===========================================

=== hub ===
// Escape hatch. access_problem carries #complete_task:meet_dr_kim, the
// access_it_systems aim unlock and the badge, but it sits only on the
// the_deferral spine. A player who asks after Gary at explain_attack lands in
// the hub having never passed through it, and the whole IT-access aim is dead.
// This keeps the route open from the hub until she has actually explained it.
+ {not access_explained} [Before anything else -- I need to get into your IT department. What can you actually authorise?]
    -> access_problem

+ {not topic_gary} [Tell me about Gary Whitlock.]
    -> discuss_gary

+ {not topic_ransom_vote} [Talk me through this board vote.]
    -> explain_board_vote

+ {topic_ransom_vote and not advised_on_vote} [You asked what to tell them. Ask me again -- I'll answer properly this time.]
    -> ransom_decision_input

+ {not topic_fire_drill} [Six weeks ago there was a fire drill at half two in the morning. Whose was it?]
    -> fire_drill

+ [What's the code for the boardroom?]
    -> boardroom_code

+ {not topic_escrow} [There's an offline key escrow in the emergency store. What's on that safe?]
    -> escrow_safe

+ {topic_gary and not player_warned_kim} [Whatever happens tonight, Gary doesn't carry this alone. I want that on the record.]
    -> protect_gary

+ {board_coverup_email_found and not player_warned_kim} [Your board chair has already written to Legal about Gary. Did you know?]
    -> board_coverup

+ {cover_burned and not cover_restored} [Someone's rung security and told them I was never booked.]
    -> cover_reaction

+ {insider_evidence_partial and not insider_identified} [Someone inside this hospital confirmed ENTROPY's timing. You cut the budget. Was it you?]
    -> accuse_kim

+ [I need to get on.]
    {offline_keys_recovered:
        Dr. Sarah Kim: Then go. And if you find me an alternative before they finally dial in, I will use it.
    - else:
        Dr. Sarah Kim: Yes. Go.
    }
    #exit_conversation
    -> hub

// ===========================================
// TOPICS
// ===========================================

=== discuss_gary ===
~ topic_gary = true

Dr. Sarah Kim: Gary is the best administrator this hospital has and I have spent six months teaching him that being right is worthless here.

Dr. Sarah Kim: He is going to be sacked. Not by me -- I do not think I get to make that decision any more -- but he is going to be sacked, and the paperwork will say something about implementation failure.

Dr. Sarah Kim: And the thing that will finish me, when I am old, is that he will believe it was my idea.

+ [Was it?]
    Dr. Sarah Kim: *pause* No.
    Dr. Sarah Kim: But I deferred his budget, I told him to stop escalating, and I have not been through that door once tonight. At some point the difference stops mattering.
    -> hub

+ [Then go and tell him it wasn't. It'll cost you nothing and it's worth a great deal.]
    ~ kim_influence += 10
    # influence_increased
    Dr. Sarah Kim: *quietly* When the wards are back.
    Dr. Sarah Kim: If I go in there now I will be asking him to forgive me while his patients are on generators, and that is not an apology. That is management.
    -> hub

=== protect_gary ===
~ player_warned_kim = true
~ kim_influence += 15
# influence_increased
#complete_task:learn_about_scapegoating
#set_global:gary_protected:true
{not kim_statement_given:
    ~ kim_statement_given = true
    #give_item:notes:kim_statement
}

Dr. Sarah Kim: You want it in writing.

Narrator: She does not argue. She writes for about thirty seconds, signs it, and holds it out without reading it back.

Dr. Sarah Kim: Statement of fact. The security remediation was costed, escalated seven times, and deferred on my recommendation. Not his.

Dr. Sarah Kim: If they want a name on this, they can have the correct one.

+ [This will end your career.]
    Dr. Sarah Kim: Probably. It was going to anyway -- this way it ends accurately.
    -> hub

+ [I'll make sure it reaches the right people.]
    ~ kim_influence += 5
    # influence_increased
    Dr. Sarah Kim: Do.
    -> hub

=== board_coverup ===
~ player_warned_kim = true
#complete_task:learn_about_scapegoating
#set_global:gary_protected:true
{not kim_statement_given:
    ~ kim_statement_given = true
    #give_item:notes:kim_statement
}

Narrator: You describe the email. Board chair to Legal. Reframe as implementation failure. Termination paperwork. Non-disparagement agreement.

Narrator: Kim reads the room's dead screens for a while before she answers.

Dr. Sarah Kim: Non-disparagement.

Dr. Sarah Kim: So they have not only decided it was him. They have decided he is not to be allowed to say otherwise.

Narrator: She sets both phones down.

Dr. Sarah Kim: Right.

Dr. Sarah Kim: Whatever happens on this vote, that does not happen. You have my statement, you have his emails, and if it comes to it you have me in a committee room saying it out loud.

~ kim_influence += 15
# influence_increased

+ [Good. Hold that when the room gets warm.]
    Dr. Sarah Kim: I have been holding the wrong thing since March. I can manage one night of holding the right one.
    -> hub

=== fire_drill ===
~ topic_fire_drill = true

Dr. Sarah Kim: *frowning* Six weeks ago.

Dr. Sarah Kim: There was a drill. Half past two in the morning, no notice. I remember because I was rung at home about it, and because Estates spent the following week furious.

Dr. Sarah Kim: Furious because they had not scheduled it. Nobody had scheduled it. There is no drill on the annual plan for that night and there is no record of one being requested.

Dr. Sarah Kim: We put it down to a fault on the panel and moved on. We had a scanner to install.

* [Somebody walked contractors through this building that night under cover of a drill nobody called.]
    ~ kim_influence += 5
    ~ insider_evidence_partial = true
    # influence_increased
    #set_global:insider_evidence_partial:true
    Dr. Sarah Kim: *very slowly* And I signed the incident off as a panel fault.
    Dr. Sarah Kim: Find out who. Please.
    -> hub

* [Noted. I'll come back to it.]
    -> hub

// F3: the safe hint as an admission rather than assistance. Redundant with the estates
// snag list, Sister Doyle and the lobby plaque -- so this is characterisation, not a gate.
=== escrow_safe ===
~ topic_escrow = true
#set_global:found_safe_pin_clue:true

Dr. Sarah Kim: A four-digit keypad.

Narrator: She does not look up from the window.

Dr. Sarah Kim: Estates put it on the audit snag list. Three times. Item nineteen, if you want the reference -- I could give you the reference for most things by now.

+ [What's the code?]
    Dr. Sarah Kim: The year we were founded. It's cut into the plaque you walked past on your way in, at about chest height, in brass.
    Dr. Sarah Kim: Twenty years of it being on that snag list and nobody ever quite got to item nineteen. Including me. Especially me.
    -> escrow_safe_out

+ [Three times, and it's still on the default.]
    Dr. Sarah Kim: Yes.
    Dr. Sarah Kim: It's the founding year. It's on the plaque in the lobby. I'm telling you that quickly because there is no version of saying it slowly that sounds better.
    -> escrow_safe_out

=== escrow_safe_out ===
Dr. Sarah Kim: If those keys are still in there, they are the only thing in this building that ENTROPY does not have a copy of.

-> hub

=== boardroom_code ===
#set_global:found_boardroom_code:true
{topic_ransom_vote:
    Dr. Sarah Kim: Nought-four-one-seven. It has been nought-four-one-seven since I arrived and it is written in my desk diary, which tells you a great deal about this institution's relationship with security.
- else:
    Dr. Sarah Kim: Nought-four-one-seven. Why -- ah. Because the board papers are in there and you want to know what they knew.
    Dr. Sarah Kim: Go on then. There is nothing in that room I am proud of.
}
-> hub

// ===========================================
// THE BOARD VOTE -- the consequence choice
// ===========================================

=== explain_board_vote ===
~ topic_ransom_vote = true

Dr. Sarah Kim: A hundred and fifty thousand pounds. Against forty-seven people on generators and a hospital that cannot tell you what anyone is allergic to.

Dr. Sarah Kim: Six of the nine will vote to pay. They are not monsters. They are frightened people who have been told a number and a timescale by somebody very good at presenting both.

Dr. Sarah Kim: And they are right, in the narrow sense. Paying is faster. Faster is fewer funerals tonight.

Dr. Sarah Kim: It also puts a hundred and fifty thousand pounds into the hands of the people who did this, so that they can do it to somebody else in about a month.

Dr. Sarah Kim: They dial in the moment they've finished arguing among themselves. What do I tell them?

-> ransom_decision_input

=== ransom_decision_input ===
~ advised_on_vote = true

Dr. Sarah Kim: And be careful how you answer, because I am going to say it on that call as though I thought of it myself, and I will not name you if it goes badly.

+ [Pay. Whatever it costs the rest of us, the people on those generators tonight are yours.]
    #set_global:advised_board_pay:true
    #set_global:advised_board_refuse:false
    ~ kim_influence += 10
    # influence_increased
    Dr. Sarah Kim: *nods once* Then that is what I will argue.
    Dr. Sarah Kim: And if anyone asks who advised it, my name goes on it. Not yours.
    -> hub

+ [Don't pay. Give me the time and I'll bring you the keys myself.]
    #set_global:advised_board_refuse:true
    #set_global:advised_board_pay:false
    ~ kim_influence += 5
    # influence_increased
    Dr. Sarah Kim: You are asking me to stake forty-seven lives on you being quick.
    Narrator: She looks at you for a long moment, deciding something that she is clearly going to have to live with either way.
    Dr. Sarah Kim: All right. I will hold them off as long as I can hold them.
    Dr. Sarah Kim: Do not make me a liar in that room, {player_name()}.
    -> hub

+ [It isn't my decision and I won't pretend it is. Buy me time and I'll change the options.]
    #set_global:advised_board_refuse:false
    #set_global:advised_board_pay:false
    ~ kim_influence += 8
    # influence_increased
    Dr. Sarah Kim: *something like respect* Everyone in this building has had an opinion tonight.
    Dr. Sarah Kim: You are the first person to say the decision is not theirs to make. Time I can buy. Go.
    -> hub

// ===========================================
// COVER BURN REACTION
// ===========================================

=== cover_reaction ===
Dr. Sarah Kim: *sharply* Rung security from where?

Dr. Sarah Kim: I authorised you. I countersigned your badge an hour ago. I have not spoken to security control all night.

Narrator: She reaches for a phone, stops, and puts it down again with visible frustration.

Dr. Sarah Kim: And I cannot fix it, can I. Because there is no system left to correct the record in. That is exactly why it worked.

Dr. Sarah Kim: Somebody in this building understood that before you did, and before I did.

* [Then they know what's on that backup server.]
    ~ kim_influence += 5
    # influence_increased
    Dr. Sarah Kim: *quietly* Get to it before they do anything else clever.
    -> hub

+ [Take the call when it comes. I'll handle the rest of it.]
    Dr. Sarah Kim: Yes. Find something for me to hold up in there.
    -> hub

// ===========================================
// RED HERRING -- Kim is negligent, not a traitor
// ===========================================

=== accuse_kim ===
Narrator: She goes absolutely still.

Dr. Sarah Kim: I rang SAFETYNET at one o'clock this morning. I brought you into this building. I signed your badge with my own name on it.

Dr. Sarah Kim: If I were working with these people, that would make me the least competent traitor in the history of the profession.

+ [You're right. That doesn't add up. I'm sorry.]
    ~ kim_influence -= 5
    # influence_decreased
    Dr. Sarah Kim: I made a catastrophic decision in March. I did not invite them in.
    Dr. Sarah Kim: Now stop spending the time we do not have and go and find who did.
    -> hub

* [Guilt is a very good cover. So is calling us in.]
    -> accuse_kim_push

=== accuse_kim_push ===
Dr. Sarah Kim: How dare you.

Dr. Sarah Kim: There are people dying on backup power on my watch, because of a decision I made, and you are stood in my office building a theory out of my remorse.

Dr. Sarah Kim: We are finished. Find your own way round my hospital.

#hostile:dr_sarah_kim
#set_global:accused_wrong_suspect:true
#exit_conversation
-> DONE

// ===========================================
// RETURN VISITS
// ===========================================

=== returning ===
{cover_burned and not cover_restored:
    Dr. Sarah Kim: *before you speak* I have heard. Security control rang the switchboard about you.
    -> hub
}
{offline_keys_recovered:
    Dr. Sarah Kim: Tell me you have something I can take into that room.
    -> hub
}
Dr. Sarah Kim: Progress?
-> hub
