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
// Pass 4 dialogue: a re-talk re-navigates to hub, so the hub carries the return greeting.
// hub_quiet skips it once after a reply or a goodbye.
VAR hub_quiet = false

// Synced from globalVars by engine at call-open
VAR insider_evidence_partial = false
VAR insider_identified = false
VAR cover_burned = false
VAR cover_restored = false
VAR board_coverup_email_found = false
VAR offline_keys_recovered = false
// Playtest loop round 1: B11 retires the IT escape hatch once IT is open; R7 retires
// the boardroom-code question once her diary has been read.
VAR it_door_open = false
VAR found_boardroom_code = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
// Round 1 (B11): a player who took "Where's Gary now?" never passes access_problem,
// so a re-talk must not replay the first meeting.
{access_explained or first_meeting:
    -> returning
}
-> first_meeting

=== first_meeting ===
// Round 1 (B11): near the top (README rule), so every route through the meeting counts.
#complete_task:meet_dr_kim
#unlock_aim:access_it_systems
Narrator: Dr. Sarah Kim stands at the window with a mobile in each hand. She has been up since three, and good tailoring can't hide it.

Dr. Sarah Kim: You're the consultant.

Dr. Sarah Kim: Three things, quickly. I'm waiting on a board call that's been rescheduled twice and will land the moment I stop expecting it.

Dr. Sarah Kim: Forty-seven patients on generators. Twelve hours of fuel. And the board votes on paying these people in four.

* [Then let's not waste any of it. Tell me how they got in.]
    # influence_increased
    -> explain_attack

* [You called us in. That took nerve, given what the vote's going to cost you.]
    # influence_increased
    Dr. Sarah Kim: Nerve. That's a generous word for it.
    Dr. Sarah Kim: I'd already decided who was to blame. I wanted somebody in the building who wasn't me.
    ~ kim_guilt_revealed = true
    -> explain_attack

* [Four things. You've missed one. What do you actually need from me?]
    # influence_increased
    Dr. Sarah Kim: ...Yes. All right.
    Dr. Sarah Kim: I need an alternative. Any alternative. I cannot walk into that room with nothing but a Bitcoin address.
    -> explain_attack

// ===========================================
// HOW THEY GOT IN
// ===========================================

=== explain_attack ===
~ topic_attack_vector = true

Dr. Sarah Kim: The backup server. A flaw in its file transfer software. Old, public, patchable for years.

Dr. Sarah Kim: I won't pretend I understand the detail. That's Gary Whitlock's world, and he's been trying to explain it to me since May.

Dr. Sarah Kim: What I understood was the figure next to it. Eighty-five thousand pounds.

* [And you deferred it.]
    ~ kim_guilt_revealed = true
    Dr. Sarah Kim: I deferred it. Yes. Say the next bit as well. You've clearly got it ready.
    -> the_deferral

* [What did you spend it on instead?]
    ~ kim_guilt_revealed = true
    Dr. Sarah Kim: You know the answer, or you wouldn't ask.
    -> the_deferral

* [Understood. Where's Gary now?]
    ~ topic_gary = true
    -> discuss_gary

=== the_deferral ===
~ kim_guilt_revealed = true

Dr. Sarah Kim: A replacement scanner. Three point two million.

Dr. Sarah Kim: And yes, I can defend it. I did, to a commissioning board, with a slide deck. Imaging capacity against infrastructure that had never once failed.

Narrator: She looks at the dead screen on her desk.

Dr. Sarah Kim: "Never once failed." That was the actual sentence. I said it out loud in March.

* [You made a clinical trade-off with the information you had. That's the job.]
    # influence_increased
    Dr. Sarah Kim: I had the information. That's the difficulty. It was in my inbox seven times.
    -> access_problem

* [You had a written warning from your own administrator. Seven of them.]
    # influence_decreased
    Dr. Sarah Kim: I know exactly how many. I replied to all of them.
    Dr. Sarah Kim: Better you say it to me than a coroner. Get on with your job.
    -> access_problem

* [Save it for the inquiry. Right now I need doors.]
    # influence_increased
    Dr. Sarah Kim: *almost relieved* Thank you. Yes. Doors.
    -> access_problem

// ===========================================
// THE CENTRAL PREMISE -- she cannot grant access
// ===========================================

=== access_problem ===
~ access_explained = true
#give_item:id_badge

Dr. Sarah Kim: Now I disappoint you, and I'll be precise, because everyone I've told tonight assumes I'm being obstructive.

Dr. Sarah Kim: I am the Chief Technology Officer of this hospital, and I cannot grant you access to a single room in it.

* [Because?]
    -> access_because

* [Your badge system is encrypted along with everything else.]
    # influence_increased
    Dr. Sarah Kim: Thank you. Yes. Somebody listens.
    -> access_because

=== access_because ===
Dr. Sarah Kim: Access control runs on the same estate as everything else. Every permission, every card, every door group, behind that ransom screen.

Dr. Sarah Kim: I can authorise you until I lose my voice. It won't open one door.

Narrator: She signs your paper badge, writes an extension on it, and hands it back.

Dr. Sarah Kim: That's the extent of my power tonight. A signature on a piece of card.

Dr. Sarah Kim: The mechanical override keys are on a hook at reception, back down through the ward. Bernie has them, and more authority than her job title suggests. Be nice to her.

Dr. Sarah Kim: The server room I can't help with at all. Its reader is isolated and only takes a card that already exists.

Dr. Sarah Kim: Gary has one. I don't.

+ [So my route is Gary.]
    Dr. Sarah Kim: Your route is Gary.
    Dr. Sarah Kim: Through the handover room, the door on the east side, behind the override lock.
    Dr. Sarah Kim: He's been in there since half past ten, and I haven't had the courage to knock.
    ~ hub_quiet = true
    -> hub

+ [Then what have you actually got?]
    Dr. Sarah Kim: A boardroom, a telephone and four hours.
    ~ hub_quiet = true
    -> hub

// ===========================================
// HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Dr. Sarah Kim: {cover_burned and not cover_restored and not cover_reaction: I've heard. Security control rang the switchboard about you.|{offline_keys_recovered: Tell me you have something I can take into that room.|{&Progress?|Yes?|What do you need?}}}
}
// Newest topics first (m01 support_hub pattern); spent topics retire; the fixed
// choices (boardroom code, goodbye) sit last.
+ {insider_evidence_partial and not insider_identified and not accuse_kim} [Someone in here helped ENTROPY in. You cut the budget. Was it you?]
    -> accuse_kim

+ {cover_burned and not cover_restored and not cover_reaction} [Someone's rung security and told them I was never booked.]
    -> cover_reaction

+ {board_coverup_email_found and not player_warned_kim} [Your board chair has already written to Legal about Gary. Did you know?]
    -> board_coverup

+ {topic_gary and not player_warned_kim} [Gary doesn't carry this alone. I want that on the record.]
    -> protect_gary

+ {not topic_escrow and not offline_keys_recovered} [There's an offline key escrow in the emergency store. What's on that safe?]
    -> escrow_safe

+ {topic_ransom_vote and not advised_on_vote} [You asked what to tell the board. I'll answer properly now.]
    -> ransom_decision_input

+ {not topic_ransom_vote} [Talk me through this board vote.]
    -> explain_board_vote

+ {not topic_fire_drill} [Anything odd on nights lately? Drills, alarms?]
    -> fire_drill

+ {not topic_gary} [Tell me about Gary Whitlock.]
    -> discuss_gary

// Escape hatch. access_problem carries the countersigned badge (meet_dr_kim and the
// aim unlock moved to first_meeting in round 1), but it sits only on the
// the_deferral spine. A player who asks after Gary at explain_attack lands in
// the hub having never passed through it, and the whole IT-access aim is dead.
// This keeps the route open from the hub until she has actually explained it.
+ {not access_explained and not it_door_open} [I need to get into IT. What can you actually authorise?]
    -> access_problem

+ {not found_boardroom_code} [{boardroom_code: The boardroom code again?|What's the code for the boardroom?}]
    -> boardroom_code

+ [I need to get on.]
    {offline_keys_recovered:
        Dr. Sarah Kim: Then go. If you find me an alternative before they dial in, I'll use it.
    - else:
        Dr. Sarah Kim: Yes. Go.
    }
    #exit_conversation
    ~ hub_quiet = true
    -> hub

// ===========================================
// TOPICS
// ===========================================

=== discuss_gary ===
~ topic_gary = true

Dr. Sarah Kim: Gary is the best administrator this hospital has, and I've spent six months teaching him that being right is worthless here.

Dr. Sarah Kim: He's going to be sacked. I don't think I get to make that decision any more. The paperwork will say "implementation failure".

Dr. Sarah Kim: And what will finish me, when I'm old, is that he'll believe it was my idea.

+ [Was it?]
    Dr. Sarah Kim: No.
    Dr. Sarah Kim: But I deferred his budget, told him to stop escalating, and haven't been through that door once tonight. At some point the difference stops mattering.
    ~ hub_quiet = true
    -> hub

+ [Then go and tell him. It costs you nothing.]
    # influence_increased
    Dr. Sarah Kim: When the wards are back.
    Dr. Sarah Kim: If I go in now, I'm asking him to forgive me while his patients are on generators. That's management, dressed as an apology.
    ~ hub_quiet = true
    -> hub

=== protect_gary ===
~ player_warned_kim = true
# influence_increased
#complete_task:learn_about_scapegoating
#set_global:gary_protected:true
{not kim_statement_given:
    ~ kim_statement_given = true
    #give_item:notes:kim_statement
}

Dr. Sarah Kim: You want it in writing.

Narrator: She doesn't argue. She writes for thirty seconds, signs it, and holds it out without reading it back.

Dr. Sarah Kim: Statement of fact. The remediation was costed, escalated seven times, and deferred on my recommendation.

Dr. Sarah Kim: If they want a name on this, they can have the correct one.

+ [This will end your career.]
    Dr. Sarah Kim: Probably. It was going to anyway. This way it ends accurately.
    ~ hub_quiet = true
    -> hub

+ [I'll make sure it reaches the right people.]
    # influence_increased
    Dr. Sarah Kim: Do.
    ~ hub_quiet = true
    -> hub

=== board_coverup ===
~ player_warned_kim = true
#complete_task:learn_about_scapegoating
#set_global:gary_protected:true
{not kim_statement_given:
    ~ kim_statement_given = true
    #give_item:notes:kim_statement
}

Narrator: You describe the email. Board chair to Legal: implementation failure, termination papers, a non-disparagement agreement.

Dr. Sarah Kim: Non-disparagement.

Dr. Sarah Kim: So they've decided it was him, and that he isn't to be allowed to say otherwise.

Narrator: She sets both phones down.

# influence_increased
Dr. Sarah Kim: Whatever happens on this vote, that doesn't.

Dr. Sarah Kim: You have my statement and his emails. If it comes to it, you have me in a committee room saying it out loud.


+ [Good. Hold that when the room gets warm.]
    Dr. Sarah Kim: I've held the wrong thing since March. I can manage one night of holding the right one.
    ~ hub_quiet = true
    -> hub

=== fire_drill ===
~ topic_fire_drill = true

Dr. Sarah Kim: Six weeks ago.

Dr. Sarah Kim: There was a drill. Half past two, no notice. I was rung at home about it, and Estates spent the next week furious.

Dr. Sarah Kim: Nobody had scheduled it. It isn't on the annual plan, and there's no record of anyone requesting it.

Dr. Sarah Kim: We put it down to a fault on the panel and moved on. We had a scanner to install.

* [Somebody walked contractors in that night, under cover of a drill nobody called.]
    ~ insider_evidence_partial = true
    # influence_increased
    #set_global:insider_evidence_partial:true
    Dr. Sarah Kim: *slowly* And I signed it off as a panel fault.
    Dr. Sarah Kim: Find out who. Please.
    ~ hub_quiet = true
    -> hub

* [Noted. I'll come back to it.]
    Dr. Sarah Kim: Do.
    ~ hub_quiet = true
    -> hub

// F3: the safe hint as an admission rather than assistance. Redundant with the estates
// snag list, Sister Doyle and the lobby plaque -- so this is characterisation, not a gate.
=== escrow_safe ===
~ topic_escrow = true
#set_global:found_safe_pin_clue:true

Dr. Sarah Kim: A four-digit keypad.

Dr. Sarah Kim: Estates put it on the audit snag list. Three times. Item nineteen. I could give you the reference for most things by now.

+ [What's the code?]
    Dr. Sarah Kim: The year we were founded. It's on the brass plaque in the lobby, at chest height.
    Dr. Sarah Kim: Nobody ever quite got to item nineteen. Including me. Especially me.
    -> escrow_safe_out

+ [Three times, and it's still on the default.]
    Dr. Sarah Kim: Yes.
    Dr. Sarah Kim: It's the founding year, on the plaque in the lobby. I'm saying it quickly because it doesn't sound better slowly.
    -> escrow_safe_out

=== escrow_safe_out ===
Dr. Sarah Kim: If those keys are still in there, they're the only thing in this building ENTROPY hasn't got a copy of.

~ hub_quiet = true
-> hub

=== boardroom_code ===
// Round 1 (A3): a repeat ask gets the code and nothing else.
{boardroom_code > 1:
    Dr. Sarah Kim: Nought-four-one-seven.
    ~ hub_quiet = true
    -> hub
}
{topic_ransom_vote:
    Dr. Sarah Kim: Nought-four-one-seven.
    Dr. Sarah Kim: It's been the same since I arrived, and it's written in my desk diary. That tells you a lot about us.
- else:
    Dr. Sarah Kim: Nought-four-one-seven.
    Dr. Sarah Kim: Ah. The board papers are in there, and you want to know what they knew. Go on. There's nothing in that room I'm proud of.
}
~ hub_quiet = true
-> hub

// ===========================================
// THE BOARD VOTE -- the consequence choice
// ===========================================

=== explain_board_vote ===
~ topic_ransom_vote = true

Dr. Sarah Kim: A hundred and fifty thousand pounds. Against forty-seven people on generators and a hospital that cannot tell you what anyone is allergic to.

Dr. Sarah Kim: Six of the nine will vote to pay. Frightened people, told a number and a timescale by somebody very good at presenting both.

Dr. Sarah Kim: And in the narrow sense they're right. Paying is faster. Faster is fewer funerals tonight.

Dr. Sarah Kim: It also hands the money to the people who did this, so they can do it to somebody else in a month.

Dr. Sarah Kim: They dial in the moment they've finished arguing. What do I tell them?

-> ransom_decision_input

=== ransom_decision_input ===
~ advised_on_vote = true

Dr. Sarah Kim: Careful. I'll say it on that call as though I thought of it myself, and I won't name you if it goes badly.

+ [Pay. Whatever it costs later, the people on those generators are yours tonight.]
    #set_global:advised_board_pay:true
    #set_global:advised_board_refuse:false
    # influence_increased
    Dr. Sarah Kim: Then that's what I'll argue.
    Dr. Sarah Kim: And if anyone asks who advised it, my name goes on it. Not yours.
    ~ hub_quiet = true
    -> hub

+ [Don't pay. Give me the time and I'll bring you the keys myself.]
    #set_global:advised_board_refuse:true
    #set_global:advised_board_pay:false
    # influence_increased
    Dr. Sarah Kim: You're asking me to stake forty-seven lives on you being quick.
    Dr. Sarah Kim: ...All right. I'll hold them off as long as I can.
    Dr. Sarah Kim: Do not make me a liar in that room, Agent.
    ~ hub_quiet = true
    -> hub

+ [It isn't my decision. Buy me time and I'll change the options.]
    #set_global:advised_board_refuse:false
    #set_global:advised_board_pay:false
    # influence_increased
    Dr. Sarah Kim: Everyone in this building has had an opinion tonight.
    Dr. Sarah Kim: You're the first to say the decision isn't theirs to make. Time I can buy. Go.
    ~ hub_quiet = true
    -> hub

// ===========================================
// COVER BURN REACTION
// ===========================================

=== cover_reaction ===
Dr. Sarah Kim: *sharply* Rung security from where?

Dr. Sarah Kim: I countersigned your badge an hour ago. I haven't spoken to security control all night.

Narrator: She reaches for a phone, stops, and puts it down again.

Dr. Sarah Kim: And I can't fix it. There's no system left to correct the record in. That's exactly why it worked.

Dr. Sarah Kim: Somebody in this building understood that before you did, and before I did.

* [Then they know what's on that backup server.]
    # influence_increased
    Dr. Sarah Kim: Then get to it before they do anything else clever.
    ~ hub_quiet = true
    -> hub

+ [Take the call when it comes. I'll handle the rest of it.]
    Dr. Sarah Kim: Yes. Find something for me to hold up in there.
    ~ hub_quiet = true
    -> hub

// ===========================================
// RED HERRING -- Kim is negligent, not a traitor
// ===========================================

=== accuse_kim ===
Dr. Sarah Kim: *very still* I rang SAFETYNET at one this morning. I brought you into this building. I signed your badge.

Dr. Sarah Kim: If I were working with these people, I'd be the least competent traitor in the history of the profession.

+ [You're right. That doesn't add up. I'm sorry.]
    # influence_decreased
    Dr. Sarah Kim: I made a catastrophic decision in March. Inviting them in wasn't part of it.
    Dr. Sarah Kim: Now stop spending time we don't have, and go and find who did.
    ~ hub_quiet = true
    -> hub

* [Guilt is a very good cover. So is calling us in.]
    -> accuse_kim_push

=== accuse_kim_push ===
Dr. Sarah Kim: How dare you.

Dr. Sarah Kim: People are dying on backup power because of a decision I made, and you're building a theory out of my remorse.

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
    Dr. Sarah Kim: I've heard. Security control rang the switchboard about you.
    ~ hub_quiet = true
    -> hub
}
{offline_keys_recovered:
    Dr. Sarah Kim: Tell me you have something I can take into that room.
    ~ hub_quiet = true
    -> hub
}
Dr. Sarah Kim: Progress?
~ hub_quiet = true
-> hub
