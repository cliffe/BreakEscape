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
// Pass 4: the offer is made at the console BEFORE the restore choice, and accepting
// it puts a "Ghost's keys" source on the console (requiresGlobal ghost_deal_accepted).
VAR ghost_offer_made = false
VAR ghost_deal_accepted = false
VAR ghost_deal_refused = false
VAR ghost_keys_used = false
VAR ward_recovering = false

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

You found it.

Took you rather longer than I'd allowed for. I'd pencilled in ninety minutes and you've had rather more than that.

It went on this network six weeks ago, during a fire drill. It's been listening ever since.

Through the budget meetings. Through the patch that never happened. Through a man in IT sending his seventh email.

~ ghost_contacted_player = true
#set_global:ghost_contacted_player:true
And I want you to sit with the word "drill" for a moment, because a drill is a thing somebody has to authorise.

* [Somebody let you in.]
    Somebody agreed with me. *unhurried* That's not the same thing, and I'd thank you to keep the distinction.
    You'll work it out. It will take you most of the night and you will be furious when you do.
    -> ghost_introduction

* [There is a woman on ECMO forty feet from where I'm stood.]
    -> player_threatens

* [Say nothing. Let them fill the silence.]
    You: ...
    Most people shout. You're going to be tiresome, I can tell.
    Very well. I'll do both parts.
    -> ghost_introduction

=== ghost_introduction ===
#speaker:ghost

We're not here for profit. St. Catherine's ignored security warnings for six months.

Gary Whitlock's email, May 17th: "ProFTPD vulnerability, critical severity, immediate patching required."

Hospital response: "Budget constraints. Defer to next fiscal year."

* [That doesn't justify encrypting patient records. People could die.]
    -> ghost_justification

* [You're teaching them a lesson? That's your justification?]
    -> ghost_philosophy

=== player_threatens ===
#speaker:ghost

Forty feet. That's a very precise number for someone who's telling me numbers are the problem.

She was on that machine last night as well. And the night before. Nobody rang SAFETYNET about her then.

I haven't touched her. I haven't been within two hundred miles of her.

I switched off the screen that let this hospital pretend it was watching her. Now everybody can see how thin that watching always was.

+ [You've worked out how many of them die. Haven't you.]
    -> ghost_confirms_calculations

+ [That's a very long way of saying you're using her.]
    -> ghost_philosophy

=== ghost_confirms_calculations ===
#speaker:ghost

I'm not going to recite it down a phone line. It's on my own machine, where you'll find it if you're any good.

But yes. I sat down and I worked out what this would cost, in people, before I did it.

The interesting part isn't that I did.

It's that in March this board deferred eighty-five thousand pounds of server work for a three point two million pound scanner.

None of them worked out what THAT would cost in people.

I showed my working. They didn't.

+ [Showing your working doesn't make it not murder.]
    No. It makes it accountable, which is a different thing and a rarer one.
    You'll notice nobody is going to be asked to account for the scanner.
    -> ghost_philosophy

+ [What do you actually want?]
    -> ransom_demand

=== ghost_justification ===
#speaker:ghost

Justify. That's a word for people who think this is an argument they can win on the phone.

I'm not justifying anything. I'm invoicing.

-> ghost_philosophy

=== ghost_philosophy ===
#speaker:ghost

I surveyed two hundred and fourteen hospitals. A hundred and forty-seven are carrying something critical and unpatched.

And every one of them was warned about it in writing.

There is always a Gary Whitlock. There is always a file of emails.

Consultants charge a fortune for a report that goes in a drawer. I charge rather less for a lesson that doesn't.

This board will triple their security budget inside a month. So will forty others, the moment they read about tonight.

I've watched it happen before. The figures are consistent enough to be boring.

+ [Nobody elected you to decide which wards find out the hard way.]
    Nobody elected the board either. They were appointed, and they decided, and the ward found out the hard way regardless.
    The only thing I've changed is the date.
    -> ransom_demand

+ [You've built a whole philosophy out of being underpaid and ignored.]
    That's the first thing you've said that was beneath you. *cooler now*
    Go and read what I've left on that server. Then say it again, if you still want to.
    -> ransom_demand

// ===========================================
// RANSOM DEMAND
// ===========================================

=== ransom_demand ===
#speaker:ghost

A hundred and fifty thousand pounds, in Bitcoin, to the address on their own screens. They'll have their keys inside the hour.

Less than five per cent of what they spent on the scanner. Sit with that.

They'll find it down the back of a sofa, and still tell the inquiry it was an impossible position.

~ ghost_persuasion_attempted = true
#set_global:ghost_persuasion_attempted:true
Or they don't pay, and you spend the night doing by hand what a key does in a minute.

I don't mind which. One outcome gets written up in the trade press. The other in a coroner's court.

+ [We don't fund people like you. I'll get the keys myself.]
    -> ghost_warns_consequences

+ [You've left a payment trail. We'll follow it home.]
    -> ghost_laughs_at_threat

+ [I've heard enough of this.]
    Of course. You know where I am -- I'm the one part of this hospital that's still up.
    #exit_conversation
    -> DONE

=== ghost_warns_consequences ===
#speaker:ghost

Then you'll do it the long way, and the long way has a shape to it. I've watched three hospitals do the long way.

When it's over, somebody will ask why you didn't simply pay. You'll have a very good answer, and it will be a policy answer.

Practise saying it to a relative. It sounds different out loud.

#exit_conversation
-> DONE

=== ghost_laughs_at_threat ===
#speaker:ghost

You will, actually. The chain is public -- that's rather the point of it, and I've never understood colleagues who pretend otherwise.

You'll follow it to a swap service in a country that ignores your letters.

There it stops being Bitcoin and becomes something with no ledger you can read.

After that, a gap, and a forensics report that says "consistent with" a great many things.

We don't handle that end in any case. Another part of the family does, and they're rather better at it than I am at this.

Follow it. Genuinely. It's the most useful thing you'll do tonight after the wards.

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

Still at it. Good -- I'd have thought less of you if you'd gone home.

I've been reading their estates paperwork while you work. There's a five-year plan in there that had this server decommissioned in 2019.

+ [You want me talking to you. It slows me down.]
    It does, rather. Although you're the one who keeps picking the phone up.
    -> end_contact

+ [You'll be in a cell before that plan gets revised.]
    Very possibly. It'll get revised either way, is my point.
    -> end_contact

+ [I'm not doing this. Not tonight.]
    -> end_contact

+ {ghost_offer_made and not ghost_deal_accepted and not ghost_deal_refused and not ransom_decision_made} [Your offer. The keys for the evidence. I'll take it.]
    -> act3_accept

// F4: fires when the player picks up the ENTROPY keypad oracle. Ghost is unbothered and
// interested, per the Phase 1 pass that stripped the nagging -- the register is a
// colleague reading a good result, not a threat.
=== on_cracker_taken ===
#speaker:ghost

You've found the case behind the rack.

I'd assumed that would go in a skip with everything else they never inventory.

+ [Your man left it. He didn't get to use it.]
    No. He didn't.
    That's the first thing you've told me tonight that I didn't already know. *something shifts*
    -> cracker_out

+ [It's a nice piece of kit. I'll be keeping it.]
    It is, and you will, and I find I don't mind as much as I ought to.
    -> cracker_out

+ [You sent someone into a hospital to empty a safe.]
    I sent someone to make sure the decision got made on the merits, not on a set of keys nobody had checked in eleven years.
    You may call that the same thing. I'd only argue with you about the word, not the act.
    -> cracker_out

=== cracker_out ===
Go on, then. Take it round the building and see what opens.

I'd rather you did, if you want the truth. It's the only part of tonight where you and I do the same job.

#exit_conversation
-> END

=== post_decision_contact ===
#speaker:ghost

{paid_ransom:
    -> ransom_paid_response
}
{ghost_keys_used:
    -> ghost_keys_response
}
-> ransom_refused_response

=== ghost_keys_response ===
#speaker:ghost

You took them. Good. The wards are coming up and nobody paid me a penny for it.

Now we find out what your word is worth. The terminal in the boardroom is still on.

And you'll have worked out the rest by now. My keys, my doors.
I'll be in this network a good while after your people think they've swept it.

+ [I'll keep it.]
    Then I'll be reading.
    -> ghost_final_statement

+ [You'll find out when everyone else does.]
    Fair. That's the most honest answer anybody's given me tonight.
    -> ghost_final_statement

=== ransom_paid_response ===
#speaker:ghost

Paid. The keys are already on their way and I'd expect their monitoring up before the next obs round.

They'll triple Gary Whitlock's budget by Friday. The eighty-five thousand, and a hundred and sixty more on top.

And not one person in that room will say out loud why.

That is what it took. Six months of him asking politely, and one night of me.

+ [People died tonight. Say that part.]
    I know. *no change in tone* I know which, I know their ages, and I'm not going to perform being sorry for you.
    This hospital has had a mortality figure every week of its existence. This is the first week anyone outside it will read one.
    -> ghost_final_statement

+ [You've just taught forty other boards that paying works.]
    Now that's the actual objection, and you're the first to make it. *the first real interest all night*
    You may even be right. I've a column for it.
    -> ghost_final_statement

=== ransom_refused_response ===
#speaker:ghost

{ward_recovering:
    You did it without me. My own key material and their escrow set, side by side.
    I wrote down that nobody here would work that out in time, and I was wrong.
- else:
    You did it by hand. All of it.
    I watched the restore counters go up for eleven hours and I'll admit I did not think you'd finish.
}

It cost them a night they'll be answering questions about for two years. It cost me a fee.

I'd like to know whether you think that trade was worth what it was paid in, but I don't suppose you'll tell me.

+ [You encrypted a hospital. Don't hand me the bill for it.]
    -> ghost_rejects_responsibility

+ [You got nothing. Not a penny of it.]
    -> ghost_acknowledges_loss

=== ghost_rejects_responsibility ===
#speaker:ghost

I'm not handing you a bill. I've never said I didn't do it.

I'll say it to a court, at length, and I hope they let me.

What I won't do is stand in the dock alone while nine people who deferred it in writing sit in the gallery, looking sad.

-> ghost_final_statement

=== ghost_acknowledges_loss ===
#speaker:ghost

Not a penny. You're right, and I'd rather you'd paid, and I'd be lying if I said the difference was nothing.

It's just not the number I'm judged on.

They'll sign off four hundred thousand of emergency security work inside a fortnight, out of pure fright. So will every board that reads about tonight.

I couldn't have bought that for a hundred and fifty.

-> ghost_final_statement

// ===========================================
// FINAL STATEMENT (Unrepentant)
// ===========================================

=== ghost_final_statement ===
#speaker:ghost

One last thing, and then I'll let you get on.

I planned it, I costed it, and if you find me I won't run and I won't deny a word.

I'd quite like the trial. It's the only room left where somebody has to sit and hear the whole thing.

+ [You're a fanatic with a spreadsheet. That's all this is.]
    A fanatic is somebody who won't look at the results. I have looked at very little else for fourteen months.
    You may still be right. It isn't the sort of thing you get to be sure about from the inside.
    -> ghost_disconnects

+ [You're not the last of these I'll take apart.]
    No. I should think not.
    Whoever you meet next won't have my manners. *almost warm* Try not to miss them.
    -> ghost_disconnects

=== ghost_disconnects ===
#speaker:ghost

Go and see to your ward.

And when a committee room asks what could have prevented this, the answer was eighty-five thousand pounds and a man asking seven times.

> CHANNEL TERMINATED

#exit_conversation
-> DONE

// ===========================================
// END CONTACT
// ===========================================

=== end_contact ===
#speaker:ghost

Off you go.

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

You just used my backdoor against me.

The 1.3.3c backdoor. Fourteen years old and still listening. I wrote my own build of the exploit in 2021.

Nobody patches what they don't understand.

I have had a listening post on this network for six weeks. Tonight I have had it on you. Every terminal, every room.

Gary Whitlock. Dr. Kim. The ward nurse with the paper charts.

+ [What do you want from me?]
    Nothing. You're not who this is addressed to.
    Though while you're in there -- do it properly. Don't leave anything unfound. I'd hate for this to be reported as a mystery.
    -> act1_end

+ [Get off this network. This is a hospital.]
    It is. Six beds in the first bay, a woman on ECMO in the next, paper charts on the ends of all of them.
    I know. I read the ward returns before I did any of this. Carry on.
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

Four seconds. Your handler didn't notice.

We can do that for four minutes. Four hours.

+ [Was that meant to frighten me?]
    No. If I'd wanted you frightened I'd have done it an hour ago, when it would have cost you something.
    I wanted you accurate about where you're standing. There's a difference and it matters to me.
    -> act2_reveal

+ [What is it you actually want out of this?]
    That board, in a room, being asked what they chose and why, by somebody they can't defer.
    The hundred and fifty thousand pays for the next one. It isn't the point of this one.
    -> act2_reveal

=== act2_reveal ===
#speaker:ghost

We've run 47 operations. St. Catherine's is the only one that called SAFETYNET.

The other 46 paid quietly. Kept it private. Told no one.

Six months later, two of them were hit again. Different attackers. Same vulnerabilities.

Paying without publishing teaches nothing.

One more thing.

Someone in this building confirmed our operational timing. An ENTROPY affiliate.

I'll let you wonder who.

It's relevant to what you decide when you reach that recovery console.

> CONTACT SUSPENDED

#exit_conversation
-> DONE

// ===========================================
// ACT 3: THE OFFER
// Trigger: task_completed:initiate_backup_recovery
// ===========================================

=== on_recovery_console ===
#speaker:ghost
~ ghost_offer_made = true

#set_global:ghost_offer_made:true
Before you touch that console -- look up.

Narrator: The terminal text goes dark. A video window opens in its place -- a hooded figure, backlit, the face held in deliberate shadow.

There. I have been a cursor to you all night. That was the idea. It is easier to despise a cursor.

But I won't make this particular offer from behind text. You can look at me while I make it.

Don't waste the effort on the hood. No name tonight, no face. You get a person.

That's the part they always leave out, and the only part that ever mattered.

Now. You're standing at the recovery console.

I'm going to make you an offer. Once. Listen carefully.

The decryption keys. All of them. Free. No payment. No ransom. No ENTROPY funding.

Clean recovery. Under an hour. Those patients have their systems before the next manual obs check.

+ [Nothing from you is free. Name it.]
    No. Nothing is. I'd be insulted if you'd taken it at face value.
    -> ghost_states_terms

+ [Go on, then. I'm listening.]
    You're the first person in this building tonight who's let me finish a sentence.
    -> ghost_states_terms

=== ghost_states_terms ===
#speaker:ghost

The board liability email in the conference room. The budget documents. Gary's six months of ignored warnings. All of it.

Upload them. Unredacted. To the press terminal in the conference room.

Public record. Journalist distribution. Permanent.

Not the money. The lesson. The money was only ever how I made them take the lesson seriously.

Fourteen months I've had this. I knew what the downtime would cost in people before I wrote a line.

I ran it again and again, hoping the arithmetic would come out against me.

It never did. Force this into daylight, and the people who don't die over the next five years outnumber the ones who die tonight. Badly.

The board ran a calculation too. They chose the scanner.

They simply never had to show their working. That's the whole of it. That's the only thing I've ever wanted out of any of this.

+ [I accept. I'll upload the evidence. Give me the keys.]
    -> act3_accept

+ [No deal. We don't negotiate with ENTROPY.]
    Noted.
    -> act3_deal_refused

+ [I need time to think.]
    Take it. I've waited fourteen months; I can wait while you decide what sort of person you are.
    -> act3_dismissed

=== act3_accept ===
#speaker:ghost
~ ghost_deal_accepted = true
#set_global:ghost_deal_accepted:true
Keys transmitted. They're on your console now, next to everything else it's offering you.
Conference room. Press terminal. Don't forget what you agreed to.
Include Gary Whitlock's emails. All six months, in order.
The lesson requires the complete picture.
-> act3_deal_accepted

=== act3_deal_accepted ===
#speaker:ghost

Good.

We'll be watching.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE

=== act3_deal_refused ===
#speaker:ghost
~ ghost_deal_refused = true
#set_global:ghost_deal_refused:true

Then you'll do it the long way, and you already know what the long way costs, because you've been standing in it all night.

When your agency comes for us -- and I know they're coming -- I hope it's you leading it.

You'll understand why we did this. Even if you never agree.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE

// Second and last ask: the next time the player uses the console after "I need time
// to think" (scenario: object_interacted, once only).
=== on_console_again ===
#speaker:ghost
{ghost_deal_accepted or ghost_deal_refused or ransom_decision_made:
    #exit_conversation
    -> DONE
}
Back at the console. So you've decided.

+ [I'll take the keys. And publish.]
    -> act3_accept

+ [No. I'm doing this without you.]
    Noted.
    -> act3_deal_refused

+ [I still don't know.]
    Then that's a no. I'll take silence as a policy -- it's what the board gave Gary.
    -> act3_deal_refused

=== act3_dismissed ===
#speaker:ghost

The offer stands until you touch that console again. I'm not running a sale.

The evidence has been sat in the conference room since March. It can wait a few more minutes.

> GHOST PROTOCOL: CLOSED

#exit_conversation
-> DONE
