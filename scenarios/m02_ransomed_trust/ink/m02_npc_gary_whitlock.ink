// ===========================================
// ACT 2 NPC: Gary Whitlock -- IT Systems Administrator
// Mission 2: Ransomed Trust
//
// Gary holds the only credential in the building that still opens anything:
// the server room card, on an isolated reader that survived the encryption.
// He is therefore the mission's hard gate -- which means he must NEVER be a
// dead end. Four routes to the card:
//
//   RAPPORT   -- treat him as a professional who was right. He hands it over,
//                plus the spare contractor lanyard and the credentials.
//   LEVERAGE  -- pick his filing cabinet first and put his own seventh warning
//                on the desk in front of him. Recovers him from ANY state,
//                including hostile. Rewards the player who explored.
//   TRANSACTION -- be cold about it. He gives you the card and nothing else.
//   FORCE     -- KO him; itemsHeld drops both card and lanyard. taskOnKO
//                covers talk_to_gary, the handler covers the credentials.
//
// So the "wrong" opening costs the player the lanyard, the credentials from
// his mouth, and his good opinion. It never costs them the mission -- the
// sticky note on his monitor carries the credentials regardless.
//
// WALKING AWAY is free. Leaving before the card changes hands completes nothing
// and burns nothing: talk_to_gary completes only when the card does, because the
// cover burn hangs off that task (whoever is watching pulls the booking once the
// player holds the one working credential). Gary notices, though, and says so
// when the player comes back (gary_waiting).
// ===========================================

EXTERNAL player_name()

VAR gary_influence = 0
VAR gary_defensive = false
VAR gary_trusts_player = false
VAR gave_keycard = false
VAR gave_lanyard = false
VAR lanyard_refused = false   // he said no once; askable again only if you've earned it since
VAR topic_warnings = false
VAR topic_vulnerability = false
VAR topic_family = false
VAR topic_passwords = false
VAR showed_him_the_email = false
VAR met_gary = false                 // prevents replaying first_meeting with its * choices already spent
VAR gary_protected_locally = false   // local mirror so the boardroom-email hub option retires once used
VAR gary_waiting_primed = false      // set as the player walks off card-less; the greeting plays on the way back in

// Synced from globalVars by engine at call-open
VAR gary_evidence_recovered = false
VAR board_coverup_email_found = false
VAR cover_burned = false
VAR cover_restored = false
VAR insider_evidence_partial = false
VAR insider_identified = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{gary_defensive:
    -> defensive_return
}
{gave_keycard:
    -> returning
}
{met_gary:
    -> returning
}
-> first_meeting

=== first_meeting ===
~ met_gary = true

Narrator: Two dead terminals, a cold mug with a skin on it, and squared up on the desk beside the keyboard, printed out, a stack of his own emails.

Gary Whitlock: *not turning round* If you're the bloke from head office, the answer's still no, I can't "just restore from backup", because the backup is the bit they encrypted.

Gary Whitlock: If you're the police, I've told your mate everything twice.

Gary Whitlock: And if you're the board, I've got nothing to say to you that I haven't already put in writing seven times.

* [Seven times. I know. I've read them.]
    ~ gary_influence += 15
    # influence_increased
    -> open_solidarity

* [I'm the incident responder. Talk me through what you've got.]
    ~ gary_influence += 8
    # influence_increased
    -> open_professional

* [You're the administrator. This is your estate. How did it get this bad?]
    ~ gary_influence -= 18
    # influence_decreased
    -> open_blame

// ===========================================
// OPENING 1 -- SOLIDARITY
// ===========================================

=== open_solidarity ===
~ topic_warnings = true
~ gary_trusts_player = true

Narrator: He turns round properly for the first time.

Gary Whitlock: You've read them.

Gary Whitlock: *carefully, like he's testing a stair* Nobody's read them. Not properly. Kim read the first one. Somebody in Finance read the one with the number in it. After that it was "noted" and "noted" and "noted".

Gary Whitlock: I got so I was writing them for the archive. Not to be actioned. Just so that one day somebody could find them and see I'd said it.

Gary Whitlock: Bit pathetic when you say it out loud.

+ [It isn't pathetic. It's a paper trail, and tonight it's the most useful thing in this building.]
    ~ gary_influence += 12
    # influence_increased
    Narrator: Something goes out of his shoulders.

    Gary Whitlock: Right. Yeah.
    Gary Whitlock: Right. What do you need?
    -> the_ask

+ [Six months of being ignored, and you're still here at four in the morning fixing it.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: Well, where else am I going to be? There's people upstairs on generators.
    Gary Whitlock: You can be furious and useful. Turns out. Who knew.
    -> the_ask

+ [Then let's make sure this time somebody actions it. What do you need from me?]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: What I need is a time machine and eighty-five grand in May.
    Gary Whitlock: Failing that -- ask me your questions.
    -> the_ask

// ===========================================
// OPENING 2 -- PROFESSIONAL
// ===========================================

=== open_professional ===
~ topic_vulnerability = true

Narrator: He swivels the chair round.

Gary Whitlock: Finally. Someone who wants the technical version.

Gary Whitlock: Backup server. ProFTPD -- the poisoned one, one point three point three c. Somebody trojaned the actual source release back in 2010 and it shipped with a backdoor built in. It's been public and patchable since. Fourteen years.

Gary Whitlock: Whoever did this didn't have to be clever. They had to be awake and have a scanner.

Gary Whitlock: That box is where every clinical backup we own lives. That's the whole disaster, in one sentence, and I put that sentence in an email in May.

+ [Fourteen years unpatched on the box that holds every backup. That's not your failure, that's a funding decision.]
    ~ gary_influence += 12
    # influence_increased
    ~ topic_warnings = true
    ~ gary_trusts_player = true
    Gary Whitlock: *quietly* Say that again in front of the board and I'll buy you a pint.
    -> the_ask

+ [Then we go in the same way they did. Show me the route.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: *first hint of life* Fight fire with fire. Yeah. Yeah, that's not stupid.
    Gary Whitlock: The exploit gets you a shell. From there it's their staging, their logs, their everything.
    -> the_ask

// ===========================================
// OPENING 3 -- BLAME
// A real consequence, not a soft-lock. He still surrenders the card.
// ===========================================

=== open_blame ===
~ gary_defensive = true

Narrator: He goes very still.

Gary Whitlock: My estate.

Gary Whitlock: I costed the fix in May. Eighty-five thousand pounds. I sent it seven times. I was told to stop escalating it outside the department, in writing, by the Chief Technology Officer, and I have that email in my hand right now.

Gary Whitlock: Then they signed off three point two million on a scanner.

Narrator: He picks the keycard off the desk and puts it down again in front of you, hard enough that it skids.

#complete_task:talk_to_gary
#give_item:keycard:server_room_keycard
Gary Whitlock: Server room. Take it. That's what you came for.

Gary Whitlock: And when they write this up and it says the administrator failed to maintain his estate -- you'll know. You'll have known and said nothing. Same as the rest of them.

~ gave_keycard = true
~ cover_burned = true

* [Gary -- ]
    Gary Whitlock: Don't.
    -> defensive_hub

* [Take the card back. Let's start again.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: *flatly* You keep it. I'm not doing this twice.
    -> defensive_hub

// ===========================================
// THE ASK -- the keycard, cooperatively
// ===========================================

=== the_ask ===
+ {not gave_keycard} [I need into the server room. What's it going to take?]
    -> keycard_request

+ {not topic_warnings} [Tell me about the warnings.]
    -> discuss_warnings

+ {not topic_vulnerability} [Walk me through the vulnerability.]
    -> discuss_vulnerability

+ [Nothing yet. I'll come back.]
    {gary_trusts_player:
        Gary Whitlock: *already turning back to the screens* Go on. I'll be here. Obviously.
    - else:
        Gary Whitlock: *already turning back to the screens* Course you will. Everybody comes back. Usually when they want something.
    }
    #exit_conversation
    -> gary_waiting

=== keycard_request ===
Narrator: He pulls a lanyard out from under his collar and looks at it.

Gary Whitlock: You'll have found every reader in the building dead on your way to me. So you already know the interesting bit is what's still alive.

Gary Whitlock: This one. Server room reader's on its own controller -- isolated, no network, nothing on it worth encrypting. I argued for that in 2019 and I actually won, for once in my life. Turns out being right about one thing buys you exactly one working door.

Gary Whitlock: So this card's the only credential in St Catherine's that opens anything at all tonight. And no, before you ask, nobody can cut you your own -- the machine that issues them went in the fire with the rest.

{gary_influence >= 25:
    -> keycard_trusted
}
{gary_influence >= 8:
    -> keycard_conditional
}
-> keycard_reluctant

=== keycard_trusted ===
~ gave_keycard = true
~ gary_trusts_player = true
~ topic_passwords = true
~ cover_burned = true
#complete_task:talk_to_gary
#complete_task:obtain_password_hints
#give_item:keycard:server_room_keycard

Narrator: He takes it off over his head and puts it in your hand without ceremony.

Gary Whitlock: There. If this goes wrong it's got my name on it, so don't make me look daft.

Gary Whitlock: And you'll want this as well.

Narrator: He pulls a folded sticky note off the monitor bezel and flattens it out.

Gary Whitlock: Shared admin credential on the backup box. Never rotated. I know. I KNOW. It's on the list, and the list is four years long, and the list is why we're here.

Gary Whitlock: Emma2018. Hospital1987. StCatherines. One of those three gets you an SSH session. I'd try the middle one.

-> offer_cabinet

=== keycard_conditional ===
~ gave_keycard = true
~ cover_burned = true
#complete_task:talk_to_gary
#give_item:keycard:server_room_keycard

Narrator: He hesitates, then holds it out.

Gary Whitlock: Right. Take it.

Gary Whitlock: But that reader logs every swipe locally, and when this is over somebody is going to read that log and see my card in that room at four in the morning while I was sat in here.

Gary Whitlock: So if anybody asks, you tell them I gave it you. Don't get clever and say you found it.

+ [You have my word. It goes in my report exactly as it happened.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: *nods once* Then we're alright.
    -> offer_cabinet

+ [Understood.]
    ~ gary_influence += 3
    # influence_increased
    -> the_ask

=== keycard_reluctant ===
~ gave_keycard = true
~ cover_burned = true
#complete_task:talk_to_gary
#give_item:keycard:server_room_keycard

Narrator: He pushes it across the desk without looking at you.

Gary Whitlock: There's forty-seven people on generators. I'm not going to be the reason you were stood out there arguing about it.

Gary Whitlock: Doesn't mean I've warmed to you.

-> the_ask

// ===========================================
// LEVERAGE ROUTE -- the reward for exploring
// Recovers him from ANY state, including defensive.
// ===========================================

=== show_the_email ===
~ showed_him_the_email = true
~ gary_defensive = false
~ gary_trusts_player = true
~ topic_warnings = true
~ gary_influence += 30
# influence_increased

Narrator: You put the seventh warning on the desk between you. Dated 8 November. Copied to the board secretariat. Answered four days later with a deferral and a request that he stop escalating.

Narrator: Gary looks at his own words on somebody else's paper for a long moment.

Gary Whitlock: Where'd you get that.

* [Your filing cabinet. It's a good lock. Not a great one.]
    Gary Whitlock: *almost laughs* No. It isn't.
    -> email_reaction

* [It doesn't matter. What matters is it exists and it's in my hands now.]
    -> email_reaction

=== email_reaction ===
Gary Whitlock: Do you know what I've been doing tonight? Between the restores?

Gary Whitlock: Printing those. All seven. Because I've been sat here working out how long it takes a hospital board to decide that a thing was one man's fault, and the answer is about a day and a half.

Gary Whitlock: So I thought: at least when they come for me, it'll be on paper.

Narrator: He straightens the stack.

Gary Whitlock: And now you've walked in with one of them already in your hand.

* [I'm putting all seven in the SAFETYNET record. You won't be carrying this on your own.]
    ~ gary_influence += 15
    # influence_increased
    #complete_task:learn_about_scapegoating
    #set_global:gary_protected:true
    Narrator: He has to look away for a second.

    Gary Whitlock: Right.
    Gary Whitlock: Right, well. Then let's get you what you need, and quick, before I make a show of myself.
    -> leverage_payoff

* [I need the same thing your board needed and ignored. Access.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Fair enough. At least you're honest about what this is.
    -> leverage_payoff

=== leverage_payoff ===
~ topic_passwords = true
~ cover_burned = true
#complete_task:talk_to_gary
#complete_task:obtain_password_hints

{not gave_keycard:
    ~ gave_keycard = true
    #give_item:keycard:server_room_keycard
    Narrator: The lanyard comes off over his head and lands in your palm.
    Gary Whitlock: Server room. Isolated reader -- it's the only card in the building that still works.
}

Narrator: He peels the sticky note off the monitor bezel.

Gary Whitlock: Shared admin credential on the backup box, never rotated. Emma2018, Hospital1987, StCatherines. Middle one, I'd bet.

Gary Whitlock: Yes, I know how that looks. Put it in the report. Put all of it in the report.

-> offer_cabinet

// ===========================================
// THE CABINET
// ===========================================

=== offer_cabinet ===
{showed_him_the_email:
    -> hub
}

Gary Whitlock: One more thing. Filing cabinet, behind you.

Gary Whitlock: Every warning I sent, and every answer I got back. A year of it.

Gary Whitlock: It's locked and I've lost the key somewhere between here and 2022, which tells you everything about how this department is resourced.

Gary Whitlock: If you can get into it -- take the lot. I'd rather it was in your hands than shredded in a fortnight.

// Task completes when the player actually recovers the email (handler eventMapping
// on item_picked_up:gary_vindication_email), not when Gary mentions the cabinet.

-> hub

// ===========================================
// MAIN HUB
// ===========================================

=== hub ===
+ {gary_evidence_recovered and not showed_him_the_email} [Gary. Look at this.]
    -> show_the_email

+ {not gave_keycard} [I need into the server room.]
    -> keycard_request

+ {not topic_warnings} [Tell me about the warnings you sent.]
    -> discuss_warnings

+ {not topic_vulnerability} [Walk me through the vulnerability.]
    -> discuss_vulnerability

+ {not topic_passwords} [Is there anything reused on that backup server I should try?]
    -> discuss_passwords

+ {not topic_family} [Who's in the photo?]
    -> discuss_family

+ {board_coverup_email_found and not gary_protected_locally} [There's something in the boardroom you need to see.]
    -> tell_him_about_board

+ {(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard and (not lanyard_refused or gary_influence >= 15)} [Someone's phoned security and pulled my booking. I need something that holds up in a corridor.]
    -> the_lanyard

+ {insider_evidence_partial and gave_keycard and not insider_identified} [The affiliate who confirmed ENTROPY's timing. Was that you?]
    -> accuse_gary

+ {not gave_keycard} [I should get on.]
    Gary Whitlock: *already turning back to the screens* Aye. Card'll be here.
    #exit_conversation
    -> gary_waiting

+ {gave_keycard} [I should get on.]
    {gary_trusts_player:
        Gary Whitlock: Go on. And -- thanks. For reading them.
    - else:
        Gary Whitlock: Aye.
    }
    #exit_conversation
    -> hub

// ===========================================
// TOPICS
// ===========================================

=== discuss_warnings ===
~ topic_warnings = true

Gary Whitlock: Seventeenth of May. First formal one. "Critical severity, immediate patching required." I don't use the word critical lightly, it devalues it.

Gary Whitlock: Reply came back on the twenty-first. Deferred to next financial year, and would I please stop escalating outside the department.

Gary Whitlock: So I did it six more times anyway, because what else are you going to do.

Gary Whitlock: Eighty-five thousand for the server work. Three point two million for the new scanner. Board voted seven to two.

+ [Seven to two. Somebody in that room agreed with you.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: *pause* Huh.
    Gary Whitlock: You know, in six months of this, you're the first person who's asked about the two.
    -> hub

+ [You did your job. They didn't do theirs.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: Try telling my daughter that in about a week, when it's in the local paper with my name on it.
    -> hub

+ [Seven emails and no escalation to the regulator. That's a gap.]
    ~ gary_influence -= 8
    # influence_decreased
    Gary Whitlock: *bitterly* Right. Yeah. It's the whistleblowing I should've done, on the salary I'm on, with a seven-year-old at home.
    Gary Whitlock: Thanks for that.
    -> hub

=== discuss_vulnerability ===
~ topic_vulnerability = true

Gary Whitlock: ProFTPD one point three point three c. The compromised release.

Gary Whitlock: Somebody put a backdoor in the actual source tree back in 2010 and it shipped to everyone who downloaded it. Unauthenticated remote code execution. You don't need a password, you need a port.

Gary Whitlock: A clean version was out within days. We are still running the poisoned build, in 2024, on the box that holds every clinical backup in this hospital.

+ [Why is that box even reachable?]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Because it was set up in 2011 by a contractor who's dead now, and every year since, moving it has been on a list under something more urgent.
    Gary Whitlock: That's how it always is. Nobody decides to be insecure. They just keep deciding something else is more pressing.
    -> hub

+ [Then it works both ways. Their door is my door.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: *grimly satisfied* It does. Scan it, fingerprint the version, and there's a module that'll walk straight in.
    Gary Whitlock: Fourteen years that hole's been sat there. Might as well get one useful night out of it.
    -> hub

=== discuss_passwords ===
~ topic_passwords = true
#complete_task:obtain_password_hints

Narrator: He peels a curling sticky note off the monitor bezel and holds it up without any attempt to hide his embarrassment.

Gary Whitlock: Shared admin credential on the backup box. Never rotated. Been on my list since 2021.

Gary Whitlock: Emma2018. Hospital1987. StCatherines. One of those three gets you an SSH session and I'd put money on the middle one.

Gary Whitlock: Go on, say it. It's a disgrace.

+ [It's a disgrace. It's also completely normal, and that's worse.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: *tired laugh* Now you sound like my emails.
    -> hub

+ [It's a disgrace. Put it in the remediation plan with everything else.]
    ~ gary_influence += 4
    # influence_increased
    Gary Whitlock: There's a plan. There's been a plan since May.
    -> hub

=== discuss_family ===
~ topic_family = true

Gary Whitlock: Emma. She's seven. Well -- she was seven in May.

Gary Whitlock: Seventeenth of May, actually. Same day I sent the first warning. Sent it from her party, in the car park, because I'd been chewing on it all week and it wouldn't wait.

Gary Whitlock: *quietly* Best day of the year and I spent twenty minutes of it writing an email nobody read.

+ [Then get it back. Go home when this is done and don't bring it with you.]
    ~ gary_influence += 10
    # influence_increased
    Narrator: He nods, and doesn't trust himself with anything else for a second.
    Gary Whitlock: Yeah. Yeah, alright.
    -> hub

+ [She'll grow up knowing her dad was the one who said it out loud.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: If anybody ever tells her. That's the bit that gets me.
    -> hub

=== tell_him_about_board ===
~ gary_protected_locally = true

Gary Whitlock: Go on.

Narrator: You describe the email. Board chair to Legal. Reframe it as an implementation failure, not a budget decision. Prepare termination paperwork and a non-disparagement agreement.

Narrator: He is quiet for long enough that the ventilation is the loudest thing in the room.

Gary Whitlock: Non-disparagement.

Gary Whitlock: They've written the ending. Before the generators have even run out, they've written the ending, and in it I'm the bloke who let it happen.

* [Not if the record says otherwise. I'll make sure it does.]
    ~ gary_influence += 20
    # influence_increased
    #complete_task:learn_about_scapegoating
    #set_global:gary_protected:true
    Gary Whitlock: You'd do that.
    Gary Whitlock: *steadier* Then do me one favour. Don't do it for me. Do it for whoever's sat in this chair at the next hospital, writing their seventh email.
    -> hub

* [You should get a solicitor before you say another word to anyone here.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: I can't afford a solicitor. That's rather the point of the exercise, isn't it.
    -> hub

* [Then finish the job first. Argue about it afterwards.]
    ~ gary_influence -= 5
    # influence_decreased
    Gary Whitlock: *flat* Course. Wards first. There's always something first.
    -> hub

// ===========================================
// THE LANYARD -- cover-burn recovery route
// ===========================================

=== the_lanyard ===
Gary Whitlock: Somebody's pulled your booking.

Gary Whitlock: *slowly* That's not a computer doing that. Everything's down. Somebody picked up a phone and said words.

{gary_influence >= 15:
    -> lanyard_given
- else:
    -> lanyard_grudging
}

=== lanyard_given ===
~ gave_lanyard = true
~ cover_restored = true
#give_item:id_badge:gary_contractor_lanyard
#set_global:staff_lanyard_obtained:true
#set_global:cover_restored:true

Narrator: He opens the second drawer down and digs out a lanyard still in its wrapper.

Gary Whitlock: Contractor pass. We issue them to hardware engineers. Blank, no name, real hospital stock, and nobody has ever once questioned one in eleven years of me watching people wave them about.

Gary Whitlock: Which is, when you think about it, exactly the sort of thing I've been sending emails about.

Gary Whitlock: Go on. And whoever made that phone call -- I'd quite like to know who, when you find out.

+ [You'll know. I'll make sure of it.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Right.
    #exit_conversation
    -> hub

// He has a blank contractor pass in the drawer and will not part with it for someone he
// has no reason to trust. Earn him (>= 15) and the same drawer opens. This is the low
// road: the player has to go back out and find another way to stand up a corridor.
=== lanyard_grudging ===
~ lanyard_refused = true

Narrator: His hand goes to the second drawer down, and stops there.

Gary Whitlock: There's a blank contractor pass in that drawer. I'm not giving it to you.

Gary Whitlock: An hour ago you were on the visitor system. You're not now. I don't know which of those is the lie and I'm not in a position to find out.

+ [Forty-seven people on that ward say you should.]
    Gary Whitlock: *not unkindly* They do. And if I'm wrong about you, they're the ones it lands on, so you'll forgive me for wanting better than a good sentence.
    -> lanyard_refused_out

+ [Fair. I'd have said no as well.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: *a beat* Then you're the first person tonight who's understood the position I'm in.
    -> lanyard_refused_out

=== lanyard_refused_out ===
Gary Whitlock: There's a nurse on Ward Three who's been signing agency staff in and out all night. Sister Doyle. She has a drawer of her own.

Gary Whitlock: Whether she opens it for you is between you and her.

#exit_conversation
-> hub

// ===========================================
// DEFENSIVE STATE
// He still helps, badly. The leverage route can still recover him.
// ===========================================

=== defensive_return ===
Gary Whitlock: *doesn't turn round* You've got the card.

-> defensive_hub

=== defensive_hub ===
+ {gary_evidence_recovered and not showed_him_the_email} [Gary. Look at this.]
    -> show_the_email

+ {not topic_passwords} [The backup server's on a shared credential. What is it?]
    ~ topic_passwords = true
    #complete_task:obtain_password_hints
    Gary Whitlock: It's on the note. On the monitor. Where I've kept it for four years like the disgrace I am.
    Gary Whitlock: Help yourself. You've clearly got opinions about my housekeeping.
    -> defensive_hub

+ {(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard} [Someone's pulled my booking with security. I need a pass.]
    -> lanyard_grudging

+ [For what it's worth -- I was wrong. You warned them and they buried it.]
    ~ gary_defensive = false
    ~ gary_influence += 20
    # influence_increased
    Narrator: The ventilation fills a very long silence.
    Gary Whitlock: Say that in your report and we'll call it square.
    -> hub

+ [Fine.]
    #exit_conversation
    -> defensive_hub

// ===========================================
// RED HERRING -- Gary is not the traitor
// ===========================================

=== accuse_gary ===
Gary Whitlock: *very carefully* Say that again.

Gary Whitlock: The affiliate. You think the affiliate is the bloke who sent seven emails begging them to close the hole.

Gary Whitlock: Have a think about that for a second. Go on. I'll wait.

+ [You're right. It doesn't add up. I'm sorry.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: No, it doesn't.
    Gary Whitlock: Look -- go and ask Val on the north corridor. She's had somebody in her notebook for weeks and nobody upstairs wants to hear it.
    Gary Whitlock: Ask her. Not me.
    -> hub

* [You had the access, the knowledge and six months of grievance.]
    -> accuse_gary_push

=== accuse_gary_push ===
~ gary_defensive = true

Gary Whitlock: Grievance.

Gary Whitlock: I have got a grievance because I was RIGHT, and you're stood in my office at four in the morning building it into a motive.

Gary Whitlock: That's it. That's the ending. That's them, and now it's you as well.

Gary Whitlock: Get out.

#hostile:gary_whitlock
#set_global:accused_wrong_suspect:true
#exit_conversation
-> DONE

// ===========================================
// WALKED OFF WITHOUT THE CARD
// The engine resumes a conversation at the knot its pending choices belong to
// and replays that knot from the top. So the greeting is gated on a flag that is
// false on the way out and set just before the choices: it plays when the
// player comes back, not as they leave. Every choice here clears it again.
// ===========================================

=== gary_waiting ===
{gary_waiting_primed and not gave_keycard:
    Narrator: The lanyard is still round his neck. He taps the card on it without turning round.
    {gary_trusts_player:
        Gary Whitlock: {&Still here. Card's still here. You know what you came in for -- just ask.|Still here. Still got it. Still yours when you want it.}
    - else:
        Gary Whitlock: {&Still here. So's the card. Funny, that -- nobody's walked off with it while you were gone.|Back again. Card's where it was. So am I.}
    }
}
~ gary_waiting_primed = true
+ {not gave_keycard} [I need into the server room.]
    ~ gary_waiting_primed = false
    -> keycard_request
+ [Something else first.]
    ~ gary_waiting_primed = false
    -> hub
+ [Still nothing. I'll come back.]
    ~ gary_waiting_primed = false
    Gary Whitlock: *doesn't look up* Mm.
    #exit_conversation
    -> gary_waiting

// ===========================================
// RETURN VISITS
// ===========================================

=== returning ===
{cover_burned and not cover_restored and not gave_lanyard:
    Gary Whitlock: *looks up* You've gone grey. What's happened?
    -> hub
}
{gary_trusts_player:
    Gary Whitlock: Any joy?
- else:
    Gary Whitlock: What now?
}
-> hub
