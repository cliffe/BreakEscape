// ===========================================
// ACT 2/3 PHONE NPC: Ghost (Ransomware Incorporated)
// Mission 2: Ransomed Trust
// Break Escape - Antagonist, True Believer, Ideological Counter
// ===========================================

// Variables for tracking interactions
VAR ghost_contacted_player = false
VAR ghost_persuasion_attempted = false
VAR player_confronted_ghost = false

// Variables synced from globalVars by engine at call-open
VAR ransom_decision_made = false
VAR paid_ransom = false

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// INITIAL CONTACT (Mid-Mission)
// ===========================================

=== start ===

{ghost_contacted_player:
    -> return_contact
}

> DEVICE ACTIVE
> NETWORK BRIDGE: ST. CATHERINE'S LAN -- [REDACTED]
> CONTACT: GHOST

#speaker:ghost

Ghost: You found it.

Ghost: Took you rather longer than I'd allowed for. I'd pencilled in ninety minutes and you've had rather more than that.

Ghost: It went on this network six weeks ago, during a fire drill. It has been listening ever since -- through the budget meetings, through the patch that never happened, through a man in IT sending his seventh email.

~ ghost_contacted_player = true
#set_global:ghost_contacted_player:true
Ghost: And I want you to sit with the word "drill" for a moment, because a drill is a thing somebody has to authorise.

* [Somebody let you in.]
    Ghost: *the pause is deliberate* Somebody agreed with me. That is not the same thing and I'd thank you to keep the distinction.
    Ghost: You'll work it out. It will take you most of the night and you will be furious when you do.
    -> ghost_introduction

* [There is a woman on ECMO forty feet from where I'm stood.]
    -> player_threatens

* [Say nothing. Let them fill the silence.]
    You: ...
    Ghost: *after a long moment* Most people shout. You're going to be tiresome, I can tell.
    Ghost: Very well. I'll do both parts.
    -> ghost_introduction

=== ghost_introduction ===
#speaker:ghost

Ghost: We're not here for profit. St. Catherine's ignored security warnings for six months.

Ghost: Gary Whitlock's email, May 17th: "ProFTPD vulnerability, critical severity, immediate patching required."

Ghost: Hospital response: "Budget constraints. Defer to next fiscal year."

* [That doesn't justify encrypting patient records. People could die.]
    -> ghost_justification

* [You're teaching them a lesson? That's your justification?]
    -> ghost_philosophy

=== player_threatens ===
#speaker:ghost

Ghost: Forty feet. That's a very precise number for a man who's telling me numbers are the problem.

Ghost: She was on that machine last night as well. And the night before. Nobody rang SAFETYNET about her then.

Ghost: I have not touched her. I have not been within two hundred miles of her. What I have done is switch off the screen that let this hospital pretend it was watching her, and now everybody can see how thin that watching always was.

+ [You've worked out how many of them die. Haven't you.]
    -> ghost_confirms_calculations

+ [That's a very long way of saying you're using her.]
    -> ghost_philosophy

=== ghost_confirms_calculations ===
#speaker:ghost

Ghost: *without any hurry at all* I'm not going to recite it to you down a phone line. It's on my own machine, where you'll find it if you're any good.

Ghost: But yes. I sat down and I worked out what this would cost, in people, before I did it.

Ghost: The interesting part isn't that I did. It's that in March this board sat in a room and deferred eighty-five thousand pounds of server work against a three point two million pound scanner, and not one of them worked out what THAT would cost in people.

Ghost: I showed my working. They didn't.

+ [Showing your working doesn't make it not murder.]
    Ghost: No. It makes it accountable, which is a different thing and a rarer one.
    Ghost: You'll notice nobody is going to be asked to account for the scanner.
    -> ghost_philosophy

+ [What do you actually want?]
    -> ransom_demand

=== ghost_justification ===
#speaker:ghost

Ghost: Justify. That's a word for people who think this is an argument they can win on the phone.

Ghost: I'm not justifying anything. I'm invoicing.

-> ghost_philosophy

=== ghost_philosophy ===
#speaker:ghost

Ghost: I surveyed two hundred and fourteen hospitals. A hundred and forty-seven of them are carrying something critical and unpatched that they have already been warned about in writing.

Ghost: Not ignorant. Warned. There is always a Gary Whitlock. There is always a file of emails.

Ghost: Consultants charge them a fortune for a report that goes in a drawer next to the last one. I charge rather less for a lesson that doesn't.

Ghost: This board will triple their security budget inside a month. So will forty others, the moment they read about tonight. I have watched it happen before and the figures are consistent enough to be boring.

+ [Nobody elected you to decide which wards find out the hard way.]
    Ghost: Nobody elected the board either. They were appointed, and they decided, and the ward found out the hard way regardless.
    Ghost: The only thing I've changed is the date.
    -> ransom_demand

+ [You've built a whole philosophy out of being underpaid and ignored.]
    Ghost: *a pause, and the courtesy has thinned when the voice comes back* That is the first thing you've said that was beneath you.
    Ghost: Go and read what I've left on that server. Then say it again, if you still want to.
    -> ransom_demand

// ===========================================
// RANSOM DEMAND
// ===========================================

=== ransom_demand ===
#speaker:ghost

Ghost: A hundred and fifty thousand pounds, in Bitcoin, to the address on their own screens. They'll have their keys inside the hour.

Ghost: It is, and I want you to sit with this, less than five per cent of what they spent on the scanner. They will find it down the back of a sofa and they will still tell the inquiry it was an impossible position.

~ ghost_persuasion_attempted = true
#set_global:ghost_persuasion_attempted:true
Ghost: Or they don't pay, and you spend the night doing by hand what a key does in a minute. I'm not going to pretend I mind either way. One of those outcomes gets written up in the trade press. The other gets written up in a coroner's court.

+ [We don't fund people like you. I'll get the keys myself.]
    -> ghost_warns_consequences

+ [You've left a payment trail. We'll follow it home.]
    -> ghost_laughs_at_threat

+ [I've heard enough of this.]
    Ghost: Of course. You know where I am -- I'm the one part of this hospital that's still up.
    #exit_conversation
    -> DONE

=== ghost_warns_consequences ===
#speaker:ghost

Ghost: Then you'll do it the long way, and the long way has a shape to it. I've watched three hospitals do the long way.

Ghost: I'd only say this. When it's over, somebody will ask you why you didn't simply pay, and you will have a very good answer, and it will be a policy answer.

Ghost: Practise saying it to a relative. It sounds different out loud.

#exit_conversation
-> DONE

=== ghost_laughs_at_threat ===
#speaker:ghost

Ghost: You will, actually. The chain is public -- that's rather the point of it, and I've never understood colleagues who pretend otherwise.

Ghost: What you'll follow it to is a swap service in a country that doesn't answer your letters, where it stops being Bitcoin and becomes something that doesn't keep a ledger you can read. After that you have a gap, and a forensics report that says "consistent with" a great many things.

Ghost: We don't handle that end in any case. Another part of the family does, and they're rather better at it than I am at this.

Ghost: Follow it. Genuinely. It's the most useful thing you'll do tonight after the wards.

#exit_conversation
-> DONE

// ===========================================
// RETURN CONTACT (After Decision)
// ===========================================

=== return_contact ===
#speaker:ghost

[ENCRYPTED CHANNEL - GHOST]

{ransom_decision_made:
    -> post_decision_contact
- else:
    -> mid_mission_contact
}

=== mid_mission_contact ===
#speaker:ghost

Ghost: Still at it. Good -- I'd have thought less of you if you'd gone home.

Ghost: I've been reading their estates paperwork while you work. Did you know there's a five-year plan in there that has this server being decommissioned in 2019?

+ [You want me talking to you. It slows me down.]
    Ghost: It does, rather. Although you're the one who keeps picking the phone up.
    -> end_contact

+ [You'll be in a cell before that plan gets revised.]
    Ghost: Very possibly. It'll get revised either way, is my point.
    -> end_contact

+ [I'm not doing this. Not tonight.]
    -> end_contact

// F4: fires when the player picks up the ENTROPY keypad oracle. Ghost is unbothered and
// interested, per the Phase 1 pass that stripped the nagging -- the register is a
// colleague reading a good result, not a threat.
=== on_cracker_taken ===
#speaker:ghost

Ghost: You've found the case behind the rack.

Ghost: I'd assumed that would go in a skip with everything else they never inventory.

+ [Your man left it. He didn't get to use it.]
    Ghost: No. He didn't.
    Ghost: *a pause, and something shifts in it* That is the first thing you've told me tonight that I didn't already know.
    -> cracker_out

+ [It's a nice piece of kit. I'll be keeping it.]
    Ghost: It is, and you will, and I find I don't mind as much as I ought to.
    -> cracker_out

+ [You sent someone into a hospital to empty a safe.]
    Ghost: I sent someone to make sure a decision got made on the merits rather than on a set of keys nobody had checked in eleven years.
    Ghost: You may call that the same thing. I'd only argue with you about the word, not the act.
    -> cracker_out

=== cracker_out ===
Ghost: Go on, then. Take it round the building and see what opens.

Ghost: I'd rather you did it that way than the other way, if you want the truth. It's the only part of tonight where you and I are doing the same job.

#exit_conversation
-> END

=== post_decision_contact ===
#speaker:ghost

{paid_ransom:
    -> ransom_paid_response
- else:
    -> ransom_refused_response
}

=== ransom_paid_response ===
#speaker:ghost

Ghost: Paid. The keys are already on their way and I'd expect their monitoring up before the next obs round.

Ghost: They'll triple Gary Whitlock's budget by Friday. They'll give him the eighty-five thousand, and about a hundred and sixty more on top, and not one person in that room will say out loud why.

Ghost: That is what it took. Six months of him asking politely, and one night of me.

+ [People died tonight. Say that part.]
    Ghost: *no change in tone whatsoever* I know. I know which, and I know their ages, and I'm not going to perform being sorry for you.
    Ghost: I'd only note that this hospital has had a mortality figure every single week of its existence, and this is the first week anyone outside it will read one.
    -> ghost_final_statement

+ [You've just taught forty other boards that paying works.]
    Ghost: *the first real interest in that voice all night* Now that is the actual objection, and you're the first one to make it.
    Ghost: You may even be right. I've a column for it.
    -> ghost_final_statement

=== ransom_refused_response ===
#speaker:ghost

Ghost: You did it by hand. All of it. I watched the restore counters go up for eleven hours and I'll admit I did not think you'd finish.

Ghost: It cost them a night they'll be answering questions about for two years. It cost me a fee.

Ghost: I'd like to know whether you think that trade was worth what it was paid in, but I don't suppose you'll tell me.

+ [You encrypted a hospital. Don't hand me the bill for it.]
    -> ghost_rejects_responsibility

+ [You got nothing. Not a penny of it.]
    -> ghost_acknowledges_loss

=== ghost_rejects_responsibility ===
#speaker:ghost

Ghost: I'm not handing you a bill. I've never once said I didn't do it -- I'll say it to a court, at length, and I rather hope they let me.

Ghost: What I won't do is stand in the dock on my own while nine people who deferred it in writing sit in the gallery being sad about it.

-> ghost_final_statement

=== ghost_acknowledges_loss ===
#speaker:ghost

Ghost: Not a penny. You're right, and I'd rather you'd paid, and I'd be lying if I said the difference was nothing.

Ghost: It's just not the number I'm judged on.

Ghost: They'll sign off four hundred thousand of emergency security work inside a fortnight, out of pure fright, and so will every board that reads about tonight. I couldn't have bought that for a hundred and fifty.

-> ghost_final_statement

// ===========================================
// FINAL STATEMENT (Unrepentant)
// ===========================================

=== ghost_final_statement ===
#speaker:ghost

Ghost: One last thing, and then I'll let you get on.

Ghost: I planned it, I costed it, and if you find me I won't run and I won't deny a word of it. I'd quite like the trial. It's the only room left where somebody has to sit and listen to the whole thing.

+ [You're a fanatic with a spreadsheet. That's all this is.]
    Ghost: A fanatic is somebody who won't look at the results. I have looked at very little else for fourteen months.
    Ghost: You may still be right. It isn't the sort of thing you get to be sure about from the inside.
    -> ghost_disconnects

+ [You're not the last of these I'll take apart.]
    Ghost: No. I should think not.
    Ghost: *and there is something almost warm in it* Whoever you meet next won't have my manners. Try not to miss them.
    -> ghost_disconnects

=== ghost_disconnects ===
#speaker:ghost

Ghost: Go and see to your ward.

Ghost: And when somebody in a committee room asks you what could have prevented all this, I'd like you to remember that the answer was eighty-five thousand pounds and a man asking seven times.

> CHANNEL TERMINATED

#exit_conversation
-> DONE

// ===========================================
// END CONTACT
// ===========================================

=== end_contact ===
#speaker:ghost

Ghost: Off you go.

> CONTACT CLOSED

#exit_conversation
-> DONE

// ===========================================
// ACT 1: GHOST DETECTS THEIR BACKDOOR BEING USED
// Trigger: task_completed:submit_proftpd_flag
// ===========================================

=== on_proftpd_exploited ===
#speaker:ghost

> EXPLOIT SIGNATURE DETECTED
> PROFTPD 1.3.3c BACKDOOR -- ST. CATHERINE'S BACKUP SERVER

Ghost: You just used my backdoor against me.

Ghost: The 1.3.3c backdoor. Fourteen years old and still listening. I wrote my own build of the exploit in 2021.

Ghost: Nobody patches what they don't understand.

Ghost: I have had a listening post on this network for six weeks. Tonight I have had it on you. Every terminal, every room.

Ghost: Gary Whitlock. Dr. Kim. The ward nurse with the paper charts.

Ghost: We know everything that's happened in this building tonight.

+ [What do you want from me?]
    Ghost: Nothing. You're not who this is addressed to.
    Ghost: Though while you're in there -- do it properly. Don't leave anything unfound. I'd hate for this to be reported as a mystery.
    -> act1_end

+ [Get off this network. This is a hospital.]
    Ghost: It is. Six beds in the first bay, a woman on ECMO in the second one along, paper charts on the ends of all of them.
    Ghost: I know. I read the ward returns before I did any of this. Carry on.
    -> act1_end

=== act1_end ===
#speaker:ghost

> CONTACT SUSPENDED

#exit_conversation
-> DONE

// ===========================================
// ACT 2: GHOST DEMONSTRATES NETWORK CONTROL
// Trigger: task_completed:submit_database_flag
// ===========================================

=== on_backup_located ===
#speaker:ghost

> NETWORK ACCESS: 4 SECONDS
> CAPABILITY DEMONSTRATION

Ghost: Four seconds. Your handler didn't notice.

Ghost: We can do that for four minutes. Four hours.

Ghost: That's not a threat. It's a capability demonstration. You should understand your situation clearly.

+ [Was that meant to frighten me?]
    Ghost: No. If I'd wanted you frightened I'd have done it an hour ago, when it would have cost you something.
    Ghost: I wanted you accurate about where you're standing. There's a difference and it matters to me.
    -> act2_reveal

+ [What is it you actually want out of this?]
    Ghost: That board, in a room, being asked what they chose and why, by somebody they can't defer.
    Ghost: The hundred and fifty thousand pays for the next one. It isn't the point of this one.
    -> act2_reveal

=== act2_reveal ===
#speaker:ghost

Ghost: We've run 47 operations. St. Catherine's is the only one that called SAFETYNET.

Ghost: The other 46 paid quietly. Kept it private. Told no one.

Ghost: Six months later, two of them were hit again. Different attackers. Same vulnerabilities.

Ghost: Paying without publishing teaches nothing.

Ghost: One more thing.

Ghost: Someone in this building confirmed our operational timing. An ENTROPY affiliate.

Ghost: I'll let you wonder who.

Ghost: It's relevant to what you decide when you reach that recovery console.

> CONTACT SUSPENDED

#exit_conversation
-> DONE

// ===========================================
// ACT 3: THE OFFER
// Trigger: task_completed:initiate_backup_recovery
// ===========================================

=== on_recovery_console ===
#speaker:ghost

Ghost: Before you touch that console -- look up.

Narrator: The terminal text goes dark. A video window opens in its place -- a hooded figure, backlit, the face held in deliberate shadow.

Ghost: There. I have been a cursor to you all night. That was rather the point -- it is easier to despise a cursor.

Ghost: But I won't make this particular offer from behind text. You can look at me while I make it.

Ghost: Don't waste the effort on the hood. You get no name tonight, and no face. You get a person. That is the part they always leave out, and it is the only part that has ever mattered.

Ghost: Now. You're standing at the recovery console.

Ghost: I'm going to make you an offer. Once. Listen carefully.

Ghost: The decryption keys. All of them. Free. No payment. No ransom. No ENTROPY funding.

Ghost: Clean recovery. Under an hour. Those patients have their systems before the next manual obs check.

+ [Nothing from you is free. Name it.]
    Ghost: No. Nothing is. I'd be insulted if you'd taken it at face value.
    -> ghost_states_terms

+ [Go on, then. I'm listening.]
    Ghost: *unhurried* You're the first person in this building tonight who's let me finish a sentence.
    -> ghost_states_terms

=== ghost_states_terms ===
#speaker:ghost

Ghost: The board liability email in the conference room. The budget documents. Gary's six months of ignored warnings. All of it.

Ghost: Upload them. Unredacted. To the press terminal in the conference room.

Ghost: Public record. Journalist distribution. Permanent.

Ghost: Not the money. The lesson. The money was only ever how I made them take the lesson seriously.

Ghost: Fourteen months I've had this. I knew what the downtime would cost in people before I wrote a line of it, and I ran it again, and again, hoping to find the arithmetic came out against me.

Ghost: It never did. Not once. Force this into daylight and the people who don't die over the next five years outnumber the people who die tonight, and they outnumber them badly.

Ghost: The board ran a calculation too. They chose the scanner.

Ghost: They simply never had to show their working. That's the whole of it. That's the only thing I've ever wanted out of any of this.

+ [I accept. I'll upload the evidence. Give me the keys.]
    Ghost: Keys transmitted.
    Ghost: Conference room. Press terminal. Don't forget what you agreed to.
    Ghost: Include Gary Whitlock's emails specifically. The full six months. Not just the cover-up memo -- the timeline.
    Ghost: The lesson requires the complete picture.
    #set_global:ghost_deal_accepted:true
    -> act3_deal_accepted

+ [No deal. We don't negotiate with ENTROPY.]
    Ghost: Noted.
    -> act3_deal_refused

+ [I need time to think.]
    Ghost: Take it. I've waited fourteen months; I can wait while you decide what sort of person you are.
    -> act3_dismissed

=== act3_deal_accepted ===
#speaker:ghost

Ghost: Good.

Ghost: We'll be watching.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE

=== act3_deal_refused ===
#speaker:ghost

Ghost: Then you'll do it the long way, and you already know what the long way costs, because you've been standing in it all night.

Ghost: For what it's worth -- and I accept it's worth very little from me -- you are the most capable person any agency has sent into one of these.

Ghost: When your agency comes for us -- and I know they're coming -- I hope it's you leading it.

Ghost: You'll understand why we did this. Even if you never agree.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE

=== act3_dismissed ===
#speaker:ghost

Ghost: The offer doesn't expire. I'm not running a sale.

Ghost: Conference room, when you've decided. The evidence has been sat in there since March.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE
