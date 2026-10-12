EXTERNAL player_name()

VAR victoria_influence = 0
VAR victoria_trusts_player = false
VAR victoria_suspicious = 0
VAR rfid_clone_started = false
VAR rfid_clone_complete = false
// Scenario global, set by tag the moment her card is captured. Synced back in on
// every talk, so a resumed or restored story never re-runs the clone tags (D13).
VAR victoria_card_cloned = false
VAR topic_zero_day_philosophy = false
VAR topic_ethics = false
VAR recruitment_discussed = false
VAR night_confrontation_ready = false
VAR victoria_fate = "" // Synced scenario global: Sterling's fate (recruited/arrested/escaped/ko); also set to ko by her npc_ko mapping
// Synced scenario globals: what the player has opened (pass 3, P1/P3). usb_seen is
// written directly by the drive's onRead; lore_directive_found arrives via a task
// completion, so both are checked.
VAR usb_seen = false
VAR lore_directive_found = false
VAR roster_seen = false
// Pass 4 synced globals. receptionist_ko: she noticed the empty front desk (fix 2).
// clone_call_done: set when the night-transition scene plays, so from then on it
// is night (fix 3); mission_phase flips while the player is still in her room.
// guard_told_safetynet: the guard rang her (fix 6).
VAR receptionist_ko = false
VAR clone_call_done = false
VAR guard_told_safetynet = false
// Pass 5 blind (B-11): synced. Has the player met the name Sable (briefing topic,
// transaction log, distcc call)? Only then does the player say it to her face.
VAR sable_named = false
VAR transaction_log_read = false
VAR revelation_heard = false
// Local state (pass 3). P4: Victoria's suspicion decides whether the custom-key read
// lands first time. P1: the recruit offer is refused once without the drive.
VAR suspicion_warned = false
VAR eager_act_done = false
VAR read_dropped = false
VAR read_checked = false
VAR recruit_refused = false
// Pass 3b: the lab questions are tracked in variables, not ink visit counts, because a
// reload restarts the story with variables restored and visit counts lost.
VAR asked_lab_services = false
VAR asked_lab_access = false
VAR asked_lab_praise = false
// Playtest round: set by every exit so idle/hub re-entry lines show on a reopen,
// not in the same batch as a goodbye.
VAR idle_quiet = false
VAR hub_quiet = false
// Pass 2 dialogue round 2 (2026-10-12).
// D2-3: her afternoon question to the recruit ("sold" / "hedged" / "asked"), quoted
// back at night. Local: only this ink reads it.
VAR victoria_test_answer = ""
// Scenes #6 / D4-2: "keen" at the afternoon goodbye; read back at night with "sold".
VAR afternoon_goodbye = ""
// D2-17: synced. The player looked in on her night call; she reveals she saw them.
VAR sterling_on_call_seen = false
// D2-1: synced. Danny's fate, for the target-selection follow-up.
VAR danny_fate = ""
// D2-1: synced; the debrief reads it. The player put "target selection" to her face.
VAR named_target_selection = false
VAR defended_danny = false // Synced scenario global: set when the player speaks up for Danny's survey to Sterling
// D4-14: the player opened the night on St. Catherine's.
VAR came_via_hospital = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:victoria_sterling
{ victoria_fate == "ko":
    -> out_cold
}
// Re-entry guard: once her fate is decided the confrontation never replays.
{ victoria_fate != "" and victoria_fate != "ko":
    -> after_choice
}
{ night_confrontation_ready:
    -> nighttime_confrontation
}
// Pass 4 (fix 3): at night, before the network work is in, she is on a call and
// the player backs out unseen. The confrontation waits for all four flags.
{ clone_call_done:
    -> night_on_call
}
#complete_task:meet_victoria
{ not recruitment_discussed:
    #display:victoria-professional
    Narrator: Victoria Sterling rises as you come in, composed and sure of herself.
    Victoria Sterling: Victoria Sterling. Sit down. Let's see if you match your file.
    Narrator: She gestures to the conference table.
    // Pass 4 (fix 2): a knocked-out receptionist doesn't go unnoticed. Feeds the
    // P4 suspicion logic, and opens the "eager recruit" walk-back.
    { receptionist_ko:
        ~ victoria_suspicious = victoria_suspicious + 10
        ~ suspicion_warned = true
        Victoria Sterling: Our receptionist isn't at her desk. You didn't pass her on the way in?
        Narrator: She says it lightly. She watches your face the whole time she says it.
    }
    ~ recruitment_discussed = true
    -> first_impression
}
{ recruitment_discussed && not victoria_card_cloned:
    #display:victoria-neutral
    // D3-20: varied re-entry.
    Victoria Sterling: {&Forgotten something?|Reconsidering?|Sit, then.}
    ~ hub_quiet = true
    -> hub
}
{ victoria_card_cloned:
    #display:victoria-neutral
    // D2-24: varied, so a reopen doesn't replay one line.
    Victoria Sterling: {&I'll be in touch.|Reception will see you out.|Was there something else, or are you lost?}
    ~ idle_quiet = true
    #exit_conversation
    -> idle
}

=== first_impression ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
Victoria Sterling: Freelance pen testing. Some CTF work. Competent.
Victoria Sterling: Competent is cheap. That's not why you're here.
* [Why am I here, then?]
    Victoria Sterling: To find out what you're worth. Your CV only tells me what you cost.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> philosophy_intro
* [I want cutting-edge research. Real impact.]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: "Real impact." Good. Let's talk about what that means.
    -> philosophy_intro
* [I've heard Zero Day's training programmes are... unconventional.]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: Unconventional. That's the polite word. Sit down and I'll tell you the other one.
    -> philosophy_intro

=== philosophy_intro ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
Victoria Sterling: You find a hole and do the decent thing. The vendor sits on it for six months. Somebody less decent finds it in three.
* [So, responsible disclosure or full disclosure?]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Neither. Both assume the vendor deserves it for free.
    -> market_efficiency_pitch
* [Researchers deserve fair pay for what they find.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    Victoria Sterling: Good. You'd be amazed how many people choke on that sentence.
    -> market_efficiency_pitch
* [This sounds like you're advocating selling vulnerabilities.]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    // Keeps "market-driven research": the debrief's arrested branch quotes it back.
    Victoria Sterling: "Selling." You say it like a confession. Call it market-driven research and the same room applauds.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> market_efficiency_pitch

=== market_efficiency_pitch ===
#speaker:victoria_sterling
// Pass 2 blind fixes 2 (A3): "Entropy, if you like." read as a non sequitur after
// "Neither"; the ENTROPY nod now follows from her point.
Victoria Sterling: Everything breaks in the end. Some people call that entropy. I call it stock.
Victoria Sterling: What matters is who knows first, and who pays them for knowing.
-> hub

=== hub ===
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
// D2-3: after the first topic she turns the interview round, once, before the
// whiteboard. Off the critical path: never offered once the read has started, and
// every answer returns here with the whiteboard still on offer.
{ victoria_test_answer == "" and (topic_zero_day_philosophy or topic_ethics) and not rfid_clone_started:
    -> the_question
}
{ hub_quiet:
    ~ hub_quiet = false
- else:
    // Pass 2 blind fixes: the old "Go on." / "What else?" / "Ask." read as filler.
    Victoria Sterling: {&What else would you like to know?|There's a board behind me, if you've run out of questions.|Ask. I'll tell you if it's above your pay grade.}
}
+ {not topic_zero_day_philosophy} [What is Zero Day actually for?]
    -> zero_day_philosophy
+ {not topic_ethics} [Can I ask about the ethics of it?]
    -> ethics_discussion
// Pass 5 blind (B-1): always on offer until the read starts, whatever branch the
// player took and after a rebuff. Low influence gets her curt answer below.
+ {not rfid_clone_started} [Is that your training lab on the whiteboard?]
    -> clone_rfid_opportunity
+ {rfid_clone_started && not rfid_clone_complete && not read_dropped} [Keep her talking about the lab]
    -> clone_rfid_distraction
// Pass 2 blind fixes (B F2, user 2026-10-12): offered straight after a dropped read,
// as the unsaved-card path already is. The walk-back below is still there for a
// player who wants to repair the doubt; it no longer gates the retry. The retry
// can't drop again (clone_check_1 checks not read_dropped).
+ {read_dropped && not rfid_clone_complete} [Drift back to the whiteboard]
    -> clone_retry
+ {(suspicion_warned or read_dropped) && not eager_act_done && not rfid_clone_complete} [{receptionist_ko:Nobody was at the desk, so I found my own way in.|Sorry about earlier. Freelance habit -- I test every client's story.}]
    -> eager_recruit
+ {rfid_clone_complete && not victoria_card_cloned} [Lean back towards the whiteboard. The cloner needs another read.]
    -> clone_recapture
+ [Thank you. I've taken enough of your time.]
    #speaker:victoria_sterling
    { victoria_influence >= 30:
        Victoria Sterling: You'll do. Reception will have the details by Friday.
        ~ victoria_trusts_player = true
    }
    { (victoria_influence < 30) && (victoria_influence >= 10):
        Victoria Sterling: You're harder to read than most. I'll let you know which way it falls.
    }
    { victoria_influence < 10:
        Victoria Sterling: You argue with the person interviewing you. Brave. Not useful.
    }
    ~ idle_quiet = true
    #exit_conversation
    -> idle

=== zero_day_philosophy ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
~ topic_zero_day_philosophy = true
Victoria Sterling: Zero Day is simple. A vulnerability is worth something to somebody.
Victoria Sterling: We find it, we price it, and we find the somebody.
* [And what do the buyers do with these exploits?]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: Everyone asks that in their first week. Nobody asks it in their second.
    -> moral_rationalization
* [And you don't care what the buyers do? That's wilful ignorance.]
    ~ victoria_influence = victoria_influence - 10
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 10
    Victoria Sterling: Wilful. Yes. It's the only kind of ignorance worth paying for.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> moral_rationalization
* [So it's a free market in vulnerabilities.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    Victoria Sterling: Precisely.
    -> moral_rationalization

=== moral_rationalization ===
#speaker:victoria_sterling
// D2-2: by day her subject is money and talent. The buyer argument waits for night.
~ victoria_influence = victoria_influence + 5
# influence_increased
Victoria Sterling: The people who find these holes are the best in the world at it. The vendors pay them in T-shirts and thank-you emails.
Victoria Sterling: I pay them properly. You'd be amazed what loyalty that buys.
-> hub

=== ethics_discussion ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
~ topic_ethics = true
Victoria Sterling: Go on. Everyone brings a speech about it.
* [What about when exploits you sold hurt people? Hospitals, infrastructure?]
    ~ victoria_influence = victoria_influence - 5
    # influence_decreased
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: Hospitals. You've done your reading. Most candidates wait for the second interview.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> ethics_response_harm
* [There's a line between research and making weapons. Where do you draw it?]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: You tell me. Where would you draw it?
    -> ethics_response_nuance
* [I'm not here to judge your business model. Just to understand it.]
    ~ victoria_influence = victoria_influence + 15
    # influence_increased
    -> ethics_response_pragmatic

=== ethics_response_harm ===
#speaker:victoria_sterling
~ victoria_influence = victoria_influence - 5
# influence_decreased
Victoria Sterling: Ask me again once you've signed something. I answer that question for staff, not guests.
-> hub

=== ethics_response_nuance ===
#speaker:victoria_sterling
Narrator: She waits. When you don't fill the silence, she does.
~ victoria_influence = victoria_influence + 10
# influence_increased
Victoria Sterling: Most people draw it wherever they stop understanding the work.
Victoria Sterling: I don't make holes. I find them, and I'm honest about the invoice.
-> hub

=== ethics_response_pragmatic ===
#speaker:victoria_sterling
Victoria Sterling: Good. Indignation is cheap, and it pays nobody's rent.
~ victoria_influence = victoria_influence + 10
# influence_increased
~ victoria_trusts_player = true
-> hub

// D2-3: the test HaX promised in the briefing ("Sterling will test you"). Reached
// once from the hub after the first topic. Every choice sets the answer, so the hub
// never routes back here; sticky choices so a reload mid-question can't starve it.
// "sold" is the answer the cover wants; "asked" is the slip she remembers.
=== the_question ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
{ victoria_card_cloned:
    Victoria Sterling: Before you go. One question. I ask everyone, and most people get it wrong.
- else:
    // D4-11: she has just asked one on the ethics route.
    { topic_ethics:
        Victoria Sterling: Now one of mine. I ask everyone, and most people get it wrong.
    - else:
        Victoria Sterling: My turn. One question. I ask everyone, and most people get it wrong.
    }
}
Victoria Sterling: You find a hole in an NHS trust's patient records. The vendor offers you a T-shirt and a thank-you. A buyer offers forty thousand. What do you do?
+ [Take the forty. The vendor had years to find it.]
    ~ victoria_test_answer = "sold"
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Quickly said. I'll remember that.
    -> question_done
+ [Report it. Then invoice the vendor for my time anyway.]
    ~ victoria_test_answer = "hedged"
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: Wanting both. Honest, at least. It won't make you rich.
    -> question_done
+ [I'd want to know what the buyer wanted it for.]
    ~ victoria_test_answer = "asked"
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: Then you'd never sell anything. The buyer who explains himself is the one you should worry about.
    { victoria_suspicious >= 10 and not suspicion_warned:
        ~ suspicion_warned = true
        Narrator: Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that.
    }
    -> question_done

// D3-21: back to the goodbye when asked after the clone, otherwise to the hub.
=== question_done ===
{ victoria_card_cloned:
    -> clone_debrief
}
~ hub_quiet = true
-> hub

=== clone_rfid_opportunity ===
#speaker:victoria_sterling
Narrator: You get up and go to the board, close to Victoria.
{ victoria_influence >= 20:
    Victoria Sterling: Yes. An isolated network, real services. Students practise on it from the server room.
- else:
    // Cycle 3 note: the sarcasm only for a player who has given her reason.
    { victoria_suspicious >= 5:
        Victoria Sterling: *curtly* The training lab. Since you're so interested.
    - else:
        Victoria Sterling: The training lab. Have a look.
    }
}
Narrator: The cloner in your pocket starts reading her card. Custom keys: you'll need Darkside afterwards, and that takes about thirty seconds. Keep her talking while it reads.
~ rfid_clone_started = true
-> clone_rfid_distraction

// P4: walking back an earlier line. Choice-free, state first, so a save can't
// land between the choice and its effect.
=== eager_recruit ===
#speaker:victoria_sterling
~ eager_act_done = true
~ victoria_suspicious = victoria_suspicious - 10
// Pass 4 round 2: after a receptionist KO the doubt is about the empty desk, not
// a pointed question, so the walk-back answers that.
{ receptionist_ko:
    Victoria Sterling: How thoughtful.
- else:
    Victoria Sterling: *coolly* Do you. Well. Most people don't bother to walk it back.
}
Narrator: She doesn't warm to you. But she stops watching your hands.
-> hub

=== clone_retry ===
#speaker:victoria_sterling
Narrator: Back at the board. The cloner finds her card again and starts a fresh read.
-> clone_rfid_distraction

=== clone_rfid_distraction ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
{ not read_dropped:
    Victoria Sterling: Real kit, every box of it. We leave the holes in on purpose.
}
* {not asked_lab_services} [What kind of services do you run in the lab environment?]
    ~ asked_lab_services = true
    Victoria Sterling: FTP, a web host, some legacy services. There's a distcc box on there we keep telling the students not to touch.
    -> clone_check_1
* {not asked_lab_access} [How do students access the training network?]
    ~ asked_lab_access = true
    Victoria Sterling: Only from the server room terminal. The lab has no route out to the internet.
    -> clone_check_1
* {not asked_lab_praise} [That's an impressive training environment. More realistic than most.]
    ~ asked_lab_praise = true
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: Nothing in there is a toy. My students break real things.
    -> clone_check_1
// D2-4: the three questions above are spent one per reload during the read (the
// asked_lab_* flags survive a reload). This sticky fallback keeps the knot from ever
// running dry, however many reloads land mid-read.
+ [What do the students find hardest?]
    Victoria Sterling: Patience. They want root in the first minute. The good ones wait.
    -> clone_check_1

=== clone_check_1 ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
// P4: a suspicious Victoria steps out of range once. read_checked stops a reload
// (which restarts at start with variables restored) failing a player who passed.
{ victoria_suspicious >= 10 and not eager_act_done and not read_dropped and not read_checked:
    -> clone_read_dropped
}
~ read_checked = true
Narrator: Halfway. The cloner is still reading.
Victoria Sterling: The lab's the easy part. The money is in knowing who'll pay, and how much.
* [How do you determine pricing for a zero-day vulnerability?]
    // D2-6: oblique by day; the night line ("You priced the bodies in") says it.
    Victoria Sterling: CVSS is the floor. After that, it's what the buyer's target can't afford to lose. Some sectors can't afford to lose anything.
    -> clone_check_2
* [That sounds more complex than pure technical work.]
    Victoria Sterling: That's why I don't hire coders. I hire people who can count.
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    -> clone_check_2
* [Who typically buys from Zero Day?]
    ~ victoria_suspicious = victoria_suspicious + 5
    Victoria Sterling: People who'd rather I didn't say. That's most of what they're paying for.
    -> clone_check_2

=== clone_read_dropped ===
#speaker:victoria_sterling
~ read_dropped = true
// Pass 5 (P1-25): synced so HaX's "she keeps stepping away" hint shows only now.
#set_global:clone_read_dropped:true
Victoria Sterling: Let's sit back down. I'd rather see your face than the back of your head.
Narrator: She walks back to the table. The cloner's read stalls halfway, then drops. Out of range.
// Pass 2 blind fixes (B F2): say how to get the read back, and skip the hub's
// filler line straight after this.
Narrator: You'll need her back at the whiteboard for a fresh read.
~ hub_quiet = true
-> hub

=== clone_check_2 ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
Victoria Sterling: You ask questions like someone taking notes. I like that in staff. I watch for it in guests.
// Cycle 2, scene #1: one beat of danger during the read, only for a player who has
// already pushed her. Narration only: no choice, no gate.
{ victoria_suspicious >= 5 and not read_dropped:
    Narrator: Her eyes drop to your pocket, where the cloner's light shows through the cloth. Then back to the board.
}
// Pass 2 blind fixes: "Nearly there. Keep her talking." read as a game prompt.
Narrator: Against your leg, the cloner is still working. A few seconds more.
* [Skills are cheap. Knowing where to sell them isn't.]
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Exactly. Which is why my researchers are paid like surgeons.
    -> clone_complete
* [This lab can't have been cheap to build.]
    Narrator: Your eyes stay on the network diagram.
    Victoria Sterling: It paid for itself in a quarter. Universities teach them to write it up. I teach them what it's worth.
    -> clone_complete
* [Do you offer any formal certifications?]
    Victoria Sterling: Certificates are for people who want permission. My students don't ask.
    -> clone_complete

=== clone_complete ===
#speaker:victoria_sterling
Narrator: The cloner buzzes once against your leg. Card read. Now run Darkside on it.
// Pass 3c (m04 Vance pattern): the tag sits on a throwaway line, because starting
// the RFID minigame ends this chat. victoria_card_cloned and clone_rfid_card are set
// by the card_cloned mapping on Save, never here, so closing the flipper early
// leaves the card unsaved and the hub offers the read again (clone_recapture).
{ not victoria_card_cloned:
    ~ rfid_clone_complete = true
    #clone_keycard:victoria_keycard_clone
    Narrator: You step back from the whiteboard, easing the distance open again.
}
-> clone_debrief

=== clone_recapture ===
#speaker:victoria_sterling
Narrator: You drift back to the whiteboard with a question about the subnet, and stand close while she answers.
#clone_keycard:victoria_keycard_clone
Narrator: She answers at length. She likes this diagram.
-> clone_debrief

// Separate knot so the choices below belong to clone_debrief. When the engine
// restores a paused conversation it re-enters the knot that owns the current
// choices; that is now this one, never the knot carrying the clone tags.
=== clone_debrief ===
#speaker:victoria_sterling
// D4-1 sweep / D4-12: a day knot re-entered at night (a reopen lands on the knot
// that owns the saved choices) hands over to start, which routes by phase.
{ clone_call_done:
    -> start
}
{ not victoria_card_cloned:
    Narrator: The cloner didn't keep the read. You'll need to get close to her card again.
    -> hub
}
// D3-21: a player who went straight to the whiteboard still gets the test HaX
// promised. The card is saved by now, so nothing on the critical path waits on it.
{ victoria_test_answer == "":
    -> the_question
}
Victoria Sterling: That's enough philosophy for one afternoon. The programme starts next month. I'll know by Friday whether you're on it.
// Scenes #6 / D4-2: only "keen" is read back at night (with the "sold" answer).
* [This is exactly the kind of work I've been looking for.]
    ~ afternoon_goodbye = "keen"
    ~ victoria_influence = victoria_influence + 10
    # influence_increased
    Victoria Sterling: Good. I'll have the enrolment details sent over.
    -> meeting_end
* [Let me think it over.]
    Victoria Sterling: Do. The good ones always want a night on it.
    -> meeting_end
* [Thanks for being straight with me.]
    ~ victoria_influence = victoria_influence + 5
    # influence_increased
    Victoria Sterling: I'm always straight with people. It's the cheapest way to be believed.
    -> meeting_end

=== meeting_end ===
#speaker:victoria_sterling
// The guard joke holds: she never learnt his name (m03_npc_terry_mott.ink ask_victoria).
Victoria Sterling: Have a look round on your way out. Reception, the main hallway. Not the executive wing; the guard gets territorial.
{ victoria_trusts_player:
    Victoria Sterling: Off the record, you didn't flinch once. People who don't flinch do well here.
}
// Pass 2 blind fixes 2 (A3): one beat, not a narrated buzz then her line.
Narrator: Her phone buzzes. She glances at it, then at the door, and the meeting is over.
~ idle_quiet = true
#exit_conversation
-> idle

=== nighttime_confrontation ===
#speaker:victoria_sterling
#display:victoria-neutral
Narrator: Victoria is standing by the window. Coat on, a slim bag over one shoulder. She has been waiting for you.
Victoria Sterling: You came back after hours. Recruits don't do that.
// One read-back of the afternoon (cycle 3, D4-2). Since D3-21 every player reaches
// the night with a test answer, so branches below the test could never play. Order:
// what she saw (the second trip to the board), a player she had marked as hostile by
// the end of the afternoon, a rude one, then the player's own answer to her test.
// The goodbye stance adds one line only where it sharpens the "sold" line.
{ receptionist_ko:
    Victoria Sterling: Nor do they leave my receptionist on her own floor. She can't remember your face. I can.
- else:
  {
  - read_dropped:
    Victoria Sterling: You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory.
  - victoria_suspicious >= 20:
    Victoria Sterling: You asked me the questions a prosecutor asks. Recruits ask about the salary.
  - victoria_influence < 10:
    // D2-16: she told this player they weren't the right fit ("Brave. Not useful.").
    Victoria Sterling: You were rude this afternoon. I put it down to nerves. Nerves don't come back at eleven at night.
  - victoria_test_answer == "asked":
    Victoria Sterling: You asked what the buyer wanted it for. I should have ended the interview there.
  - victoria_test_answer == "sold":
    Victoria Sterling: You told me you'd take the forty. You said it very quickly. The ones who mean it take longer.
    { afternoon_goodbye == "keen":
        Victoria Sterling: And you told me this was exactly the work you'd been looking for. I believed you. That's the part I mind.
    }
  - victoria_test_answer == "hedged":
    Victoria Sterling: Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open.
  - else:
    // Only after a reload or a chat closed before the test.
    Victoria Sterling: You were very easy to like this afternoon. That should have worried me sooner.
  }
}
// Pass 4 (fix 6): telling her own guard costs the player the question.
{ guard_told_safetynet:
    Victoria Sterling: And my night guard rang me earlier, terribly excited. SAFETYNET, he said. I expect he promised you he wouldn't.
    Victoria Sterling: So let's not perform the part where I'm surprised. Say what you came to say.
- else:
    Victoria Sterling: So let's not perform the part where I'm surprised. Who are you with?
}
* {sable_named or transaction_log_read or revelation_heard} [SAFETYNET. And I know the name on your approvals. Sable.]
    Victoria Sterling: *drily* Nobody's said that name to my face before. You really have been thorough.
    -> the_reckoning
* {not (sable_named or transaction_log_read or revelation_heard)} [SAFETYNET. And I've read your approvals.]
    Victoria Sterling: Then you've read more than my accountant. He'll be disappointed.
    -> the_reckoning
* [St. Catherine's Hospital. Your ProFTPD exploit. People died on that ward.]
    ~ came_via_hospital = true
    Victoria Sterling: I sold a vulnerability. What a buyer builds with it is a buyer's problem.
    Victoria Sterling: Your Ghost liked to tell people they wrote that exploit themselves. They didn't. They bought it from me, twenty-five thousand, hospital premium and all.
    ++ [Forty per cent extra for a hospital. You priced the bodies in.]
        Victoria Sterling: I priced the urgency in. Hospitals pay fast, and they pay quietly. That isn't cruelty. It's arithmetic.
        -> the_reckoning
* {usb_seen or lore_directive_found or roster_seen} [I've been through your office{sable_named or transaction_log_read or revelation_heard:, Sable}. Your desk. Your files.]
    Victoria Sterling: Then you understand how far past me this runs. And how little arresting me changes it.
    -> the_reckoning

// D2-1: her defence ("a buyer's problem", "a professional who logs the sale") now
// meets the line Netherton opened the mission with: they choose the targets first.
// Every player here has submitted the flag-4 log that itemises the consultation.
=== the_reckoning ===
#speaker:victoria_sterling
#display:victoria-neutral
Victoria Sterling: Let me spare us the scene you're braced for. You want the confession. The tears for the ward.
Victoria Sterling: I read what that ward cost, down to the number. It changed nothing I believe.
// D4-14: on the St. Catherine's route she has just made this defence.
{ not came_via_hospital:
    Victoria Sterling: Vulnerabilities are facts. Someone will always sell the facts. Better a professional who logs the sale than a criminal who doesn't.
}
+ [That's the story you tell yourself so you can sleep.]
    Victoria Sterling: I sleep perfectly. That's the part people like you can never forgive.
    -> the_reckoning_close
// Gated on the player having seen the line item: the printed log, or HaX's call.
+ {transaction_log_read or revelation_heard} [Ten thousand for target selection. It's on your invoice. You picked the hospital.]
    ~ named_target_selection = true
    #set_global:named_target_selection:true
    Victoria Sterling: *after a moment* Danny Foster's survey. One of mine.
    Victoria Sterling: Two hundred and fourteen sites, and one with the oldest FTP box on the list.
    Victoria Sterling: Ghost wanted somewhere that would pay. I told them where. That's consultancy.
    -> target_followup
// Cycle 3 scene #1: a real choice for a player without the ledger too.
+ [You could have walked away from that sale.]
    Victoria Sterling: I did walk away. With twenty-five thousand.
    -> the_reckoning_close

=== target_followup ===
#speaker:victoria_sterling
+ {danny_fate != "" and danny_fate != "ko"} [Danny drew that survey for you. He's been sitting in the dark for months.]
    ~ defended_danny = true
    #set_global:defended_danny:true
    Victoria Sterling: Danny was paid a great deal of money to stop asking. He's the one who agreed the price.
    -> the_reckoning_close
// D3-5: keeps "I sleep perfectly" (a protected line) on the target route too.
+ [Consultancy. Is that the story you tell yourself so you can sleep?]
    Victoria Sterling: I sleep perfectly. That's the part people like you can never forgive.
    -> the_reckoning_close
+ [Consultancy. Is that what you'll call it in court?]
    Victoria Sterling: In court I'll call it whatever my barrister tells me to. You'll have to get me there first.
    -> the_reckoning_close

=== the_reckoning_close ===
#speaker:victoria_sterling
Narrator: She settles the bag on her shoulder.
Victoria Sterling: To the Architect I'm a line item. Sable, Zero Day, this office -- all of it is rented. All of it replaceable.
// D2-17, moved here in cycle 2 (D3-1): her last card, and a live threat.
{ sterling_on_call_seen:
    Victoria Sterling: One more thing. You stood in my doorway earlier. At night that window's a mirror.
    Victoria Sterling: My associates offered to deal with you. I said I'd do it myself. I still might.
}
Victoria Sterling: So decide what you actually want from the next thirty seconds. I have a car downstairs, and you have exactly one move.
-> confrontation_decision

=== confrontation_decision ===
// P1: the deal needs the drive from her desk. Without it she declines once.
+ {usb_seen or lore_directive_found} [I have your Phase 2 directive. Give me the Architect and I'll fight for a deal. Not immunity.]
    -> confrontation_recruit
+ {not (usb_seen or lore_directive_found) and not recruit_refused} [Work for us.]
    -> recruit_declined
+ [You're not walking out of here. Bag down, hands where I can see them.]
    -> confrontation_arrest
+ [Go. I've got what I need off your servers. You're just the signature now.]
    -> confrontation_escape

=== recruit_declined ===
#speaker:victoria_sterling
~ recruit_refused = true
Victoria Sterling: In exchange for what? You haven't even taken what you'd be asking me to betray.
Victoria Sterling: Still one move. Choose it.
-> confrontation_decision

=== confrontation_recruit ===
#speaker:victoria_sterling
Victoria Sterling: Not immunity. At least you're honest. Most of your people lead with a promise they can't keep.
Victoria Sterling: Then you already have the what. I'm the when.
Narrator: She lets the bag slide off her shoulder onto the desk.
Victoria Sterling: I don't have the Architect's name. Nobody does. But I have the comms protocol, the rails the money moves on, and the Phase 2 window.
Victoria Sterling: The window opens in weeks. Some of what they bought from me is already installed.
Victoria Sterling: Understand what this is. You didn't move me. You're simply a better bet than a shallow grave.
~ victoria_fate = "recruited"
#set_global:victoria_fate:recruited
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== confrontation_arrest ===
#speaker:victoria_sterling
Narrator: You put yourself between Victoria and the door. She measures the distance, the odds, and lets the bag drop.
Victoria Sterling: *quietly* You understand this stops nothing. I'm a desk. They'll have it filled by Monday.
Victoria Sterling: The evidence is real. The name is real. And none of it reaches the Architect. Enjoy the paperwork.
~ victoria_fate = "arrested"
#set_global:victoria_fate:arrested
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== confrontation_escape ===
#speaker:victoria_sterling
Victoria Sterling: The sensible answer. I could almost have used you.
Victoria Sterling: For what little it's worth -- St. Catherine's was a proof of concept. You'll see the rest.
Narrator: She's past you and gone before the lift doors settle.
~ victoria_fate = "escaped"
#set_global:victoria_fate:escaped
#complete_task:victoria_choice_made
~ idle_quiet = true
#exit_conversation
-> idle

=== night_on_call ===
#speaker:victoria_sterling
// Pass 5 (P1-26): synced so HaX's "she won't engage" hint shows only once seen.
#set_global:sterling_on_call_seen:true
// Pass 2 blind fixes: the long asterisk cue is narration now.
Narrator: Sterling is on the phone by the window, her back to the door, voice low.
Victoria Sterling: No. Not tonight. I said I'd deal with it myself.
Narrator: She doesn't seem to have heard you come in. You ease back out before she turns round.
~ idle_quiet = true
#exit_conversation
-> idle

=== after_choice ===
#speaker:victoria_sterling
Victoria Sterling: We're done here. You made your choice.
+ [Leave]
    ~ idle_quiet = true
    #exit_conversation
    -> idle

=== out_cold ===
Narrator: She's out cold. Whatever she knows, she isn't saying it tonight.
+ [Leave her]
    ~ idle_quiet = true
    #exit_conversation
    -> idle

// Resting point between talks (m02 pattern): conversations never reach DONE, so
// the engine saves the story at these choices and restores it here next time.
// The conditions cover every state, so the knot is never empty.
=== idle ===
{ idle_quiet:
    ~ idle_quiet = false
- else:
    // D5-6: the first night look-in plays the call at once (one click, and the
    // call's own line says what she's doing). Inside the else: a reopen, never an exit.
    { victoria_fate == "" and clone_call_done and not sterling_on_call_seen and not night_confrontation_ready:
        -> start
    }
    { victoria_fate == "ko":
        Narrator: She's still out cold.
    - else:
        { victoria_fate != "":
            Narrator: Sterling has nothing more to say to you.
        - else:
            { night_confrontation_ready:
                Narrator: Sterling hasn't left.
            - else:
                { clone_call_done:
                    Narrator: Sterling's still on the phone, her back to the door.
                - else:
                    Victoria Sterling: Was there something else?
                }
            }
        }
    }
}
+ {victoria_fate == "" and night_confrontation_ready} [Sterling. We need to talk.]
    -> nighttime_confrontation
+ {victoria_fate == "" and not night_confrontation_ready and not victoria_card_cloned and not clone_call_done} [Sorry. One more question.]
    -> start
+ {victoria_fate == "" and not night_confrontation_ready and victoria_card_cloned and not clone_call_done} [Thanks again for your time.]
    -> start
+ {victoria_fate == "" and not night_confrontation_ready and clone_call_done} [Look in on Sterling]
    -> start
+ {victoria_fate == "ko"} [She's out cold. Leave her.]
    Narrator: You leave her where she fell.
    ~ idle_quiet = true
    #exit_conversation
    -> idle
+ {victoria_fate != "" and victoria_fate != "ko"} [There's nothing more to say to her.]
    Narrator: She doesn't look up as you go.
    ~ idle_quiet = true
    #exit_conversation
    -> idle
