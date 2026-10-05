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
VAR hub_quiet = false                // pass 4 dialogue: re-entry line on a re-talk, skipped once after a reply or a goodbye

// Synced from globalVars by engine at call-open
VAR gary_evidence_recovered = false
VAR board_coverup_email_found = false
VAR cover_burned = false // Synced scenario global: the player's booking has been pulled; also set by the talk_to_gary task mapping
VAR cover_restored = false
VAR insider_evidence_partial = false
VAR insider_identified = false
// Round 3 (best M4): retire the lanyard and sticky-note options once those are in hand.
VAR staff_lanyard_obtained = false
VAR password_hints_found = false

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

Narrator: Two dead terminals, a cold mug with a skin on it, and a printed stack of his own emails squared up beside the keyboard.

Gary Whitlock: *not turning round* If you're head office, the answer's still no. I can't "just restore from backup". The backup's the bit they encrypted.

Gary Whitlock: If you're the police, I've told your mate everything twice.

Gary Whitlock: And if you're the board, I've put it all in writing. Seven times.

* [Seven times. I know.]
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

Gary Whitlock: You know.

Narrator: He turns round properly for the first time.

Gary Whitlock: Nobody's read them. Kim read the first one. Finance read the one with the number in it.

Gary Whitlock: After that it was "noted", and "noted", and "noted".

Gary Whitlock: By the end I was writing them for the archive. So one day somebody could find them and see I'd said it.

Gary Whitlock: Bit pathetic when you say it out loud.

+ [It's a paper trail. Tonight it's the most useful thing in this building.]
    Narrator: Something goes out of his shoulders.
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: Yeah.
    Gary Whitlock: Right. What do you need?
    -> the_ask

+ [Six months ignored, and you're still here at four in the morning fixing it.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: Well, where else am I going to be? There's people upstairs on generators.
    Gary Whitlock: Turns out you can be furious and useful. Who knew.
    -> the_ask

+ [Then this time somebody actions it. What do you need from me?]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: What I need is a time machine and eighty-five grand in May.
    Gary Whitlock: Failing that, ask me your questions.
    -> the_ask

// ===========================================
// OPENING 2 -- PROFESSIONAL
// ===========================================

=== open_professional ===
~ topic_vulnerability = true

Gary Whitlock: *swivelling round* Finally. Someone who wants the technical version.

Gary Whitlock: Backup server. ProFTPD -- the poisoned one, one point three point three c.

Gary Whitlock: Somebody trojaned the actual source release back in 2010 and it shipped with a backdoor built in. It's been public and patchable since. Fourteen years.

Gary Whitlock: Whoever did this didn't have to be clever. They had to be awake and have a scanner.

Gary Whitlock: That box holds every clinical backup we own. That's the whole disaster in one sentence, and I emailed that sentence in May.

+ [Fourteen years unpatched on the backup box. Somebody chose not to fund that.]
    ~ gary_influence += 12
    # influence_increased
    ~ topic_warnings = true
    ~ gary_trusts_player = true
    Gary Whitlock: Say that in front of the board and I'll buy you a pint.
    -> the_ask

+ [Then we go in the same way they did. Show me the route.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: Fight fire with fire. Yeah. Yeah, that's clever, actually.
    Gary Whitlock: The exploit gets you a shell. From there it's their staging, their logs, their everything.
    -> the_ask

// ===========================================
// OPENING 3 -- BLAME
// A real consequence, not a soft-lock. He still surrenders the card.
// ===========================================

=== open_blame ===
~ gary_defensive = true

Gary Whitlock: *very still* My estate.

Gary Whitlock: I costed the fix in May. Eighty-five thousand pounds. I sent it seven times.

Gary Whitlock: I was told to stop escalating it outside the department, in writing, by the Chief Technology Officer, and I have that email in my hand right now.

Gary Whitlock: Then they signed off three point two million on a scanner.

Narrator: He puts the keycard down in front of you, hard enough that it skids.

#complete_task:talk_to_gary
#give_item:keycard:server_room_keycard
Gary Whitlock: Server room. Take it. That's what you came for.

Gary Whitlock: And when the write-up says the administrator failed to maintain his estate, you'll have known. And said nothing. Same as the rest of them.

~ gave_keycard = true
~ cover_burned = true

* [Gary, I--]
    Gary Whitlock: Don't.
    ~ hub_quiet = true
    -> defensive_hub

* [Take the card back. Let's start again.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: You keep it. I'm not doing this twice.
    ~ hub_quiet = true
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
        Gary Whitlock: Go on. I'll be here. Obviously.
    - else:
        Gary Whitlock: Course you will. Everybody comes back when they want something.
    }
    #exit_conversation
    -> gary_waiting

=== keycard_request ===
Narrator: He pulls a lanyard out from under his collar.

Gary Whitlock: You'll have found every reader in the building dead on the way here. The interesting bit is what's still alive.

Gary Whitlock: This one. The server room reader's on its own controller, off the network. I argued for that in 2019 and actually won.

Gary Whitlock: Turns out being right about one thing buys you exactly one working door.

Gary Whitlock: So this is the only card in St Catherine's that opens anything tonight. And nobody can cut you your own. The issuing machine went with the rest.

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

Narrator: He takes it off over his head and puts it in your hand.

Gary Whitlock: There. It's got my name on it, so don't make me look daft.

Narrator: He peels a sticky note off the monitor bezel.

Gary Whitlock: And you'll want this.

Gary Whitlock: Shared admin credential on the backup box. Never rotated. I know. I KNOW.

Gary Whitlock: It's on the list. The list is four years long, and the list is why we're here.

Gary Whitlock: Emma2018. Hospital1987. StCatherines. One of those three gets you an SSH session.

-> offer_cabinet

=== keycard_conditional ===
~ gave_keycard = true
~ cover_burned = true
#complete_task:talk_to_gary
#give_item:keycard:server_room_keycard

Gary Whitlock: *a pause, then he holds it out* Right. Take it.

Gary Whitlock: But that reader logs every swipe. When this is over, somebody will see my card in that room at four in the morning while I was sat in here.

Gary Whitlock: So if anybody asks, I gave it you. Don't get clever and say you found it.

+ [You have my word. It goes in my report exactly as it happened.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: Then we're alright.
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

Gary Whitlock: Forty-seven people on generators. I'm not having you stood out there arguing about it.

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

Narrator: You put the seventh warning on the desk. Dated 8 November, copied to the board secretariat, answered four days later with a deferral and a request to stop escalating.

Narrator: Gary looks at his own words on somebody else's paper.

Gary Whitlock: Where'd you get that.

* [Your filing cabinet. It's a good lock. Not a great one.]
    Gary Whitlock: *almost laughs* No. It isn't.
    -> email_reaction

* [Does it matter? It exists, and it's in my hands now.]
    -> email_reaction

=== email_reaction ===
Gary Whitlock: Know what I've been doing tonight, between restores? Printing those. All seven.

Gary Whitlock: I've been working out how long it takes a hospital board to decide it was one man's fault. About a day and a half.

Gary Whitlock: So I thought: at least when they come for me, it'll be on paper.

Gary Whitlock: And now you've walked in with one of them in your hand.

* [All seven go in the SAFETYNET record. You won't carry this alone.]
    #complete_task:learn_about_scapegoating
    #set_global:gary_protected:true
    Narrator: He has to look away for a second.
    ~ gary_influence += 15
    # influence_increased
    Gary Whitlock: Right.
    Gary Whitlock: Right, well. Let's get you what you need, quick, before I make a show of myself.
    -> leverage_payoff

* [I need the same thing your board needed and ignored. Access.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Fair enough. At least you're honest about it.
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
    Gary Whitlock: Server room. Isolated reader. Only card in the building that still works.
}

Narrator: He peels the sticky note off the monitor bezel.

Gary Whitlock: Shared admin credential on the backup box, never rotated. Emma2018, Hospital1987, StCatherines.

Gary Whitlock: I know how that looks. Put it in the report. Put all of it in.

-> offer_cabinet

// ===========================================
// THE CABINET
// ===========================================

=== offer_cabinet ===
{showed_him_the_email:
    ~ hub_quiet = true
    -> hub
}

Gary Whitlock: One more thing. Filing cabinet, behind you.

Gary Whitlock: Every warning I sent and every answer I got. A year of it.

Gary Whitlock: It's locked, and I lost the key somewhere around 2022. That tells you how this department's resourced.

Gary Whitlock: If you can get into it, take the lot. Better your hands than the shredder in a fortnight.

// Task completes when the player actually recovers the email (handler eventMapping
// on item_picked_up:gary_vindication_email), not when Gary mentions the cabinet.

~ hub_quiet = true
-> hub

// ===========================================
// MAIN HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Gary Whitlock: {gary_trusts_player: {&Any joy?|Go on.|What do you need?}|{&What now?|Yeah?}}
}
+ {gary_evidence_recovered and not showed_him_the_email} [Gary. Look at this.]
    -> show_the_email

+ {not gave_keycard} [I need into the server room.]
    -> keycard_request

+ {not topic_warnings} [Tell me about the warnings you sent.]
    -> discuss_warnings

+ {not topic_vulnerability} [Walk me through the vulnerability.]
    -> discuss_vulnerability

+ {not topic_passwords and not password_hints_found} [Is there anything reused on that backup server I should try?]
    -> discuss_passwords

+ {not topic_family} [Who's in the photo?]
    -> discuss_family

+ {board_coverup_email_found and not gary_protected_locally} [There's something in the boardroom you need to see.]
    -> tell_him_about_board

+ {(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard and not staff_lanyard_obtained and (not lanyard_refused or gary_influence >= 15)} [Someone's pulled my booking with security. I need something that holds up.]
    -> the_lanyard

+ {insider_evidence_partial and gave_keycard and not insider_identified} [Someone inside helped ENTROPY in. Was that you?]
    -> accuse_gary

+ {not gave_keycard} [I should get on.]
    Gary Whitlock: Right. Card'll be here.
    #exit_conversation
    -> gary_waiting

+ {gave_keycard} [I should get on.]
    {gary_trusts_player:
        Gary Whitlock: Go on. And... thanks. For reading them.
    - else:
        Gary Whitlock: Yeah.
    }
    #exit_conversation
    ~ hub_quiet = true
    -> hub

// ===========================================
// TOPICS
// ===========================================

=== discuss_warnings ===
~ topic_warnings = true

Gary Whitlock: Seventeenth of May. First formal one. "Critical severity, immediate patching required." I don't use "critical" lightly.

Gary Whitlock: Reply on the twenty-first. Deferred to next financial year, and would I please stop escalating outside the department.

Gary Whitlock: So I did it six more times. What else are you going to do?

Gary Whitlock: Eighty-five thousand for the server work. Three point two million for the new scanner. Board voted seven to two.

+ [Seven to two. Somebody in that room agreed with you.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: Huh.
    Gary Whitlock: Six months of this, and you're the first person who's asked about the two.
    ~ hub_quiet = true
    -> hub

+ [You did your job. They didn't do theirs.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: Tell my daughter that in a week, when it's in the local paper with my name on it.
    ~ hub_quiet = true
    -> hub

+ [Seven emails and no escalation to the regulator. That's a gap.]
    ~ gary_influence -= 8
    # influence_decreased
    Gary Whitlock: Right. Yeah. The whistleblowing I should've done, on my salary, with a seven-year-old at home.
    Gary Whitlock: Thanks for that.
    ~ hub_quiet = true
    -> hub

=== discuss_vulnerability ===
~ topic_vulnerability = true

Gary Whitlock: ProFTPD one point three point three c. The compromised release.

Gary Whitlock: Somebody put a backdoor in the actual source tree back in 2010 and it shipped to everyone who downloaded it.

Gary Whitlock: Unauthenticated remote code execution. You don't need a password, you need a port.

Gary Whitlock: A clean version was out within days. We are still running the poisoned build, in 2024, on the box that holds every clinical backup in this hospital.

// Playtest loop round 1 (A4/R8): each follow-up offers the other, so the pointer at
// the module isn't lost by asking "why reachable" first.
+ [Why is that box even reachable?]
    -> vuln_reachable

+ [Then it works both ways. Their door is my door.]
    -> vuln_door

=== vuln_reachable ===
~ gary_influence += 5
# influence_increased
Gary Whitlock: A contractor set it up in 2011. Every year since, moving it's been on a list under something more urgent.
Gary Whitlock: Nobody decides to be insecure. They just keep deciding something else matters more.
{vuln_door:
    ~ hub_quiet = true
    -> hub
}
+ [Then it works both ways. Their door is my door.]
    -> vuln_door
+ [Right.]
    ~ hub_quiet = true
    -> hub

=== vuln_door ===
~ gary_influence += 8
# influence_increased
Gary Whitlock: *grimly satisfied* It does. Scan it, fingerprint the version, and there's a module that'll walk straight in.
Gary Whitlock: Fourteen years that hole's been there. Might as well get one useful night out of it.
{vuln_reachable:
    ~ hub_quiet = true
    -> hub
}
+ [Why is that box even reachable?]
    -> vuln_reachable
+ [Right.]
    ~ hub_quiet = true
    -> hub

=== discuss_passwords ===
~ topic_passwords = true
#complete_task:obtain_password_hints

Narrator: He peels a curling sticky note off the monitor bezel and holds it up, embarrassed.

Gary Whitlock: Shared admin credential on the backup box. Never rotated. Been on my list since 2021.

Gary Whitlock: Emma2018. Hospital1987. StCatherines. One of those three gets you an SSH session.

Gary Whitlock: Go on, say it. It's a disgrace.

+ [It's a disgrace. It's also completely normal, and that's worse.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: Now you sound like my emails.
    ~ hub_quiet = true
    -> hub

+ [It's a disgrace. Put it in the remediation plan with everything else.]
    ~ gary_influence += 4
    # influence_increased
    Gary Whitlock: There's a plan. There's been a plan since May.
    ~ hub_quiet = true
    -> hub

=== discuss_family ===
~ topic_family = true

Gary Whitlock: Emma. She turned seven in May.

Gary Whitlock: Seventeenth of May. Same day as the first warning. I sent it from her party, in the car park, because it wouldn't wait.

Gary Whitlock: Best day of the year, and I spent twenty minutes of it on an email nobody read.

+ [Go home when this is done. Don't bring it with you.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: *after a moment* Yeah. Yeah, alright.
    ~ hub_quiet = true
    -> hub

+ [She'll grow up knowing her dad was the one who said it out loud.]
    ~ gary_influence += 12
    # influence_increased
    Gary Whitlock: If anybody ever tells her. That's the bit that gets me.
    ~ hub_quiet = true
    -> hub

=== tell_him_about_board ===
~ gary_protected_locally = true

Gary Whitlock: Go on.

Narrator: You describe the email. Board chair to Legal: call it an implementation failure, draw up termination papers and a non-disparagement agreement.

Narrator: He's quiet long enough that the ventilation is the loudest thing in the room.

Gary Whitlock: Non-disparagement.

Gary Whitlock: They've written the ending before the generators have even run out. And I'm the bloke who let it happen.

* [The record will say otherwise. I'll make sure of it.]
    ~ gary_influence += 20
    # influence_increased
    #complete_task:learn_about_scapegoating
    #set_global:gary_protected:true
    Gary Whitlock: You'd do that.
    Gary Whitlock: Then do me a favour. Do it for whoever's sat in this chair at the next hospital, writing their seventh email.
    ~ hub_quiet = true
    -> hub

* [You should get a solicitor before you say another word to anyone here.]
    ~ gary_influence += 8
    # influence_increased
    Gary Whitlock: Can't afford one. That's the point of the exercise, isn't it.
    ~ hub_quiet = true
    -> hub

* [Then finish the job first. Argue about it afterwards.]
    ~ gary_influence -= 5
    # influence_decreased
    Gary Whitlock: Course. Wards first. There's always something first.
    ~ hub_quiet = true
    -> hub

// ===========================================
// THE LANYARD -- cover-burn recovery route
// ===========================================

=== the_lanyard ===
Gary Whitlock: Somebody's pulled your booking.

Gary Whitlock: Everything's down. So somebody picked up a phone and said words.

{gary_influence >= 15:
    -> lanyard_given
- else:
    -> lanyard_grudging
}

// Pass 4: the lanyard is what the player shows Val; it no longer restores cover by itself.
=== lanyard_given ===
~ gave_lanyard = true
#give_item:id_badge:gary_contractor_lanyard
#set_global:staff_lanyard_obtained:true

Narrator: He digs a lanyard, still in its wrapper, out of the second drawer down.

Gary Whitlock: Contractor pass. Blank, real hospital stock. Nobody's ever questioned one in all my time here.

Gary Whitlock: Which is exactly the sort of thing I've been sending emails about.

Gary Whitlock: Go on. And whoever made that phone call, I'd like to know who.

+ [You'll know. I'll make sure of it.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Right.
    #exit_conversation
    ~ hub_quiet = true
    -> hub

// He has a blank contractor pass in the drawer and will not part with it for someone he
// has no reason to trust. Earn him (>= 15) and the same drawer opens. This is the low
// road: the player has to go back out and find another way to stand up a corridor.
=== lanyard_grudging ===
~ lanyard_refused = true

Narrator: His hand goes to the second drawer down, and stops.

Gary Whitlock: There's a blank contractor pass in there. I'm not giving it to you.

Gary Whitlock: An hour ago you were on the visitor list. Now you're not. I can't tell which of those is the lie.

+ [Forty-seven people on that ward say you should.]
    Gary Whitlock: They do. And if I'm wrong about you, it lands on them. So I want better than a good sentence.
    -> lanyard_refused_out

+ [Fair. I'd have said no as well.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: Then you're the first person tonight who's understood my position.
    -> lanyard_refused_out

=== lanyard_refused_out ===
Gary Whitlock: Sister Doyle on Ward Three's been signing agency staff in and out all night. She's got a drawer of her own.

Gary Whitlock: Whether she opens it for you is between you and her.

#exit_conversation
~ hub_quiet = true
-> hub

// ===========================================
// DEFENSIVE STATE
// He still helps, badly. The leverage route can still recover him.
// ===========================================

=== defensive_return ===
-> defensive_hub

=== defensive_hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Gary Whitlock: {&You've got the card.|What now?}
}
+ {gary_evidence_recovered and not showed_him_the_email} [Gary. Look at this.]
    -> show_the_email

+ {not topic_passwords} [The backup server's on a shared credential. What is it?]
    ~ topic_passwords = true
    #complete_task:obtain_password_hints
    Gary Whitlock: It's on the note on the monitor, where I've kept it for four years like the disgrace I am.
    Gary Whitlock: Help yourself. You've clearly got opinions about my housekeeping.
    ~ hub_quiet = true
    -> defensive_hub

+ {(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard} [Someone's pulled my booking with security. I need a pass.]
    -> lanyard_grudging

+ [For what it's worth, I was wrong. You warned them and they buried it.]
    ~ gary_defensive = false
    Narrator: The ventilation fills a long silence.
    ~ gary_influence += 20
    # influence_increased
    Gary Whitlock: Say that in your report and we'll call it square.
    ~ hub_quiet = true
    -> hub

+ [Fine.]
    Gary Whitlock: Fine.
    #exit_conversation
    ~ hub_quiet = true
    -> defensive_hub

// ===========================================
// CAUGHT AT THE CABINET (pass 4)
// lockpick_used_in_view with Gary in the room. Once only: the next attempt picks.
// Leaves met_gary alone, so his first meeting still plays when the player talks.
// ===========================================

=== on_cabinet_picked ===
Narrator: Behind you, a chair creaks round.

Gary Whitlock: That's my filing cabinet.

* [It is. Your warnings are in it, and I want to read them.]
    ~ gary_influence += 10
    # influence_increased
    Gary Whitlock: ...Go on, then. Somebody should.
* [Sorry. I should have asked first.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: You should have. ...Third pin sticks. Go on.
* [Turn round, Gary.]
    ~ gary_influence -= 10
    # influence_decreased
    Gary Whitlock: I'll watch, if it's all the same to you. Still my cabinet.
- #exit_conversation
-> DONE

// ===========================================
// RED HERRING -- Gary is not the traitor
// ===========================================

=== accuse_gary ===
Gary Whitlock: Say that again.

Gary Whitlock: You think the affiliate is the bloke who sent seven emails begging them to close the hole.

Gary Whitlock: Have a think about that. Go on. I'll wait.

+ [You're right. It doesn't add up. I'm sorry.]
    ~ gary_influence += 5
    # influence_increased
    Gary Whitlock: No, it doesn't.
    Gary Whitlock: Ask Val on security. She's had somebody in her notebook for weeks, and nobody upstairs wants to hear it.
    Gary Whitlock: Ask her. Not me.
    ~ hub_quiet = true
    -> hub

* [You had the access, the knowledge and six months of grievance.]
    -> accuse_gary_push

=== accuse_gary_push ===
~ gary_defensive = true

Gary Whitlock: Grievance.

Gary Whitlock: I've got a grievance because I was RIGHT. And you're stood in my office at four in the morning building it into a motive.

Gary Whitlock: That's the ending, then. Them, and now you as well.

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
    {gary_trusts_player:
        Gary Whitlock: {&Card's still here. You know what you came in for. Just ask.|Still here. Still got it. Still yours when you want it.}
    - else:
        Gary Whitlock: {&Card's still here. Funny, that. Nobody walked off with it while you were gone.|Back again. Card's where it was. So am I.}
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
    Gary Whitlock: Mm.
    #exit_conversation
    -> gary_waiting

// ===========================================
// RETURN VISITS
// ===========================================

=== returning ===
{cover_burned and not cover_restored and not gave_lanyard:
    Gary Whitlock: You've gone grey. What's happened?
    ~ hub_quiet = true
    -> hub
}
{gary_trusts_player:
    Gary Whitlock: Any joy?
- else:
    Gary Whitlock: What now?
}
~ hub_quiet = true
-> hub
