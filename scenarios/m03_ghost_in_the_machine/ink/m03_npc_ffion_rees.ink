EXTERNAL player_name()

VAR receptionist_influence = 0
VAR badge_received = false
VAR topic_victoria = false
VAR topic_company_history = false
VAR topic_danny = false
VAR pin_hint_given = false
// Pass 3c: synced scenario global, set by the card_cloned mapping only when the
// badge is actually saved in the cloner. Until then the clone option stays offered.
VAR reception_badge_cloned = false
// Pass 5 (P2-16): synced. The clone choice opens only once the player has met the
// conference reader or been told about the cloner (lock before key).
VAR conference_reader_tried = false
VAR cloner_explained = false
// Synced from globalVars: after Victoria's card is cloned the building is closing.
VAR mission_phase = ""
// Playtest round: set by every exit so the hub's re-entry line shows on a reopen,
// not in the same batch as a goodbye.
VAR hub_quiet = false
// Final round: first night visit vs return visits.
VAR night_greeted = false
// D2-12: synced. What the player told her at night; the guard reads "notebook".
VAR ffion_night_story = ""
// D5-10: suppresses the re-ask on the first pass.
VAR night_answer_quiet = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:ffion_rees
{ mission_phase == "act2_infiltration":
    -> closing_up
}
{ not badge_received:
    #display:receptionist-professional
    Ffion Rees: Afternoon! You'll be the three o'clock, is it? I'm Ffion.
    Ffion Rees: Ms. Sterling mentioned you'd be coming in for a consultation.
    -> badge_process
}
{ badge_received:
    #display:receptionist-friendly
    // D3-20: varied re-entry.
    Ffion Rees: {&Back again? Forgotten something?|Hiya again.|You're getting to be a regular.}
    ~ hub_quiet = true
    -> hub
}

=== badge_process ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
// D5-19: the directions once, not on the return from company_overview.
{ not topic_company_history:
    Ffion Rees: Sign in for me, and I'll print you a badge.
    Narrator: She slides a clipboard across the desk.
    Ffion Rees: Ms. Sterling's in the conference room. Straight up the hallway, first door on the left.
- else:
    Ffion Rees: Anyway. Sign in when you're ready.
}
* [Thanks. Where do I sign?]
    #give_item:id_badge:visitor_badge
    ~ badge_received = true
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    Narrator: You sign the visitor log.
    Ffion Rees: There you go. Keep it on show, or the guard has kittens.
    Ffion Rees: The conference room's behind the card reader on the left -- staff badges only. Ms. Sterling's strict about that. She doesn't come out to fetch people.
    -> first_impression_choice
* [Before I go in, what's WhiteHat like?]
    ~ receptionist_influence = receptionist_influence + 10
    # influence_increased
    Ffion Rees: Oh, we break into places. For money. Companies pay us to find the holes before somebody nasty does.
    -> company_overview
* [I'll just sign and go through, thanks.]
    #give_item:id_badge:visitor_badge
    ~ badge_received = true
    Narrator: You scrawl a signature in the log.
    Ffion Rees: Here's your badge. Ms. Sterling's in the conference room -- through the card reader on your left.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== company_overview ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
Ffion Rees: Ms. Sterling started it in 2010.
{ receptionist_influence >= 10:
    Ffion Rees: There's the training side too. Zero Day. Don't ask me what they do in there, I only order the pizzas.
}
~ topic_company_history = true
~ pin_hint_given = true
* [2010. She must be proud of how far it's come.]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    Ffion Rees: Oh, very much so. Mind, she'd tell you it's barely started.
    -> badge_process
* [What kind of training does Zero Day offer?]
    // D3-9: she doesn't know what the back rooms do, and says so.
    Ffion Rees: Told you, I just do the pizzas. Advanced something. She picks them herself, mind.
    Ffion Rees: Turned away a lad who'd been on the telly last spring.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> badge_process

=== first_impression_choice ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
Ffion Rees: First time at a place like this, is it?
* [I've done freelance pen testing before. Looking to level up.]
    ~ receptionist_influence = receptionist_influence + 10
    # influence_increased
    Ffion Rees: You've come to the right place, then. She doesn't see just anyone, mind.
    -> hub
// D2-25: cover-consistent (freelance pentester). The modest answer earns flavour
// and influence (D4-21).
* [Freelance. Small jobs, mostly. I'm told she's hard to impress.]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    Ffion Rees: She is. Don't let her scare you, she's like that with everyone.
    Ffion Rees: Tip? Let her do the talking. She likes an audience.
    -> hub
// Pass 5 (R1-16): a player who heard about the cloner in the briefing can lean in
// on the first visit too, not only after reopening her hub.
* {cloner_explained and not reception_badge_cloned} [Lean in by her lanyard and let the cloner read her badge.]
    -> clone_badge_opportunity
* [I should head to the conference room. Don't want to keep Victoria waiting.]
    Ffion Rees: Go on, then. Up the hallway, first door on the left.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== hub ===
// Resting point (m02 pattern): every exit comes back here, never DONE, so the
// engine restores the story at these choices. Night-aware: after Victoria's card
// is cloned, the only thing to do is say goodnight.
// D4-1 (cycle 3 blocker): every exit parks here and a reopen re-enters here, never
// start, so the first night visit must be routed to her night scene from the hub.
{ mission_phase == "act2_infiltration" and (not night_greeted or ffion_night_story == ""):
    -> closing_up
}
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { mission_phase == "act2_infiltration":
        // D2-15: she has found the charger, so she isn't searching and leaving at once.
        Ffion Rees: {Found it. Charger was in the biscuit tin, don't ask.|I'm going, I'm going.}
    - else:
        Ffion Rees: {&Anything else, love?|What else can I do for you?|Still here? I don't mind.}
    }
}
+ {mission_phase == "act2_infiltration"} [Night, Ffion.]
    // D3-10: no third "Night, then".
    Ffion Rees: Go on, I'm locking the drawer. Don't let the guard scare you.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ {mission_phase != "act2_infiltration" && not topic_victoria} [What's Ms. Sterling like?]
    -> ask_victoria
+ {mission_phase != "act2_infiltration" && not topic_danny} [Who else works here?]
    -> ask_danny
+ {mission_phase != "act2_infiltration" && not topic_company_history && not pin_hint_given} [How long has WhiteHat been going?]
    -> ask_company_history
+ {mission_phase != "act2_infiltration" && receptionist_influence >= 15} [How's the building laid out?]
    -> ask_building_layout
+ {mission_phase != "act2_infiltration" && badge_received && not reception_badge_cloned && (conference_reader_tried or cloner_explained)} [Lean in by her lanyard and let the cloner read her badge.]
    -> clone_badge_opportunity
+ {mission_phase != "act2_infiltration"} [Thanks. I'll head through.]
    Ffion Rees: Go on, then. Shout if you need anything.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== ask_victoria ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
~ topic_victoria = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Ffion Rees: Oh, she's brilliant. Does the big conferences, gets quoted in the papers. Bit terrifying, mind.
{ receptionist_influence >= 20:
    Ffion Rees: Between you and me, I've never seen her lose an argument. Not once.
    Ffion Rees: She remembers everyone's birthday, though. Which is more than my last place did.
}
* [She sounds like hard work.]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    Ffion Rees: Ha. You're not wrong. Lives for it, she does.
    -> hub
* [Does she work late?]
    Ffion Rees: Some nights, yeah. The cleaners find her at her desk gone midnight.
    Ffion Rees: Rings for a taxi at two in the morning and still beats me in.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [Thanks.]
    -> hub

=== ask_danny ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
~ topic_danny = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Ffion Rees: Well, there's Danny Foster - he's one of our senior consultants.
Ffion Rees: Really nice bloke. Always brings doughnuts in on a Friday.
{ receptionist_influence >= 15:
    Ffion Rees: He's been off it lately, mind. Hasn't touched a doughnut in weeks.
}
* [What kind of consulting work does Danny do?]
    Ffion Rees: Site visits, mostly. Hospitals, loads of them this year. Came back from one and sat in his car for an hour.
    Ffion Rees: He's been with WhiteHat since the beginning - 2010, I think.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [Where does Danny work? In case I run into him.]
    Ffion Rees: The executive wing -- off to the right from the main hallway. His is the door on the south side.
    Ffion Rees: He's usually out at client sites in the day, mind. He comes back in the evening to write up.
    -> hub
+ [Thanks.]
    -> hub

=== ask_company_history ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
~ topic_company_history = true
~ pin_hint_given = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
// W-11: keeps 2010 and the plaque (the password clue); leaves "market-driven" to Victoria.
Ffion Rees: Since 2010. Ms. Sterling started it.
Ffion Rees: Says so on the plaque, there, look. "Security Through Economics."
* [That's an unusual motto. What does it mean?]
    Ffion Rees: Something about paying people properly? Ask her. Actually, don't, you'll be here till six.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [2010. I'll remember that.]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [Thanks.]
    -> hub

=== ask_building_layout ===
#speaker:ffion_rees
// D4-1 sweep: a day knot re-entered at night hands over to start (night routing).
{ mission_phase == "act2_infiltration":
    -> start
}
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Ffion Rees: Reception here, then the main hallway. The conference room's through the card reader, first on the left.
Ffion Rees: Server room at the far end of the main hallway -- executive cards only.
Ffion Rees: And Ms. Sterling's office is in the executive wing, east off the main hallway.
* [Is anyone here after business hours?]
    Ffion Rees: Ms. Sterling, if she's working late. Danny, some evenings. And the night guard. Does his rounds, drinks a lot of tea.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [Even the conference area needs a card? That's pretty tight security.]
    Ffion Rees: Ms. Sterling had them fitted herself. Says a door's only as good as whoever's holding the card.
    Narrator: She taps the badge on her lanyard.
    Ffion Rees: Staff badges get you into the conference area. The server room takes an executive card. Visitors normally get escorted through.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [That's helpful, thanks.]
    -> hub

=== clone_badge_opportunity ===
#speaker:ffion_rees
Narrator: The cloner's antenna lights up -- it detects a MIFARE signal from her staff badge. Read it, then crack the keys.
// The tag sits on a throwaway line: starting the RFID minigame ends this chat.
// The task completes on Save (card_cloned mapping), never on the tag.
#clone_keycard:receptionist_badge
Narrator: She carries on straightening the sign-in sheet.
-> clone_badge_debrief

=== clone_badge_debrief ===
#speaker:ffion_rees
// D4-1 sweep pattern: a chat closed here by day and reopened at night hands over to start.
{ mission_phase == "act2_infiltration":
    -> start
}
{ reception_badge_cloned:
    Narrator: The badge is in the cloner.
    // Pass 5 round 2: a beat before the hub, so "Anything else, love?" doesn't
    // land straight after the clone.
    Ffion Rees: Sorry, I was miles away. Where were we?
    ~ hub_quiet = true
- else:
    Narrator: The cloner didn't keep the read. You'll have to lean in again.
}
-> hub

=== closing_up ===
#speaker:ffion_rees
// Pass 4: after the night-transition scene it is eleven at night, so she has
// popped back in rather than still being on shift. D2-12: the one civilian who puts
// the cover under pressure, and the player now has to answer her.
// D5-10: a reload or a closed chat at the question asks it again, rather than
// skipping to "Found it" for a player who never answered.
{ night_greeted and ffion_night_story == "":
    -> night_answer
}
{ night_greeted:
    -> hub
}
~ night_greeted = true
Ffion Rees: Oh! You made me jump. I only came back for my charger.
Ffion Rees: Is Ms. Sterling expecting you this late?
~ night_answer_quiet = true
-> night_answer

// All sticky. Reached first from closing_up (quiet), then on any reopen or reload
// before an answer, with her question asked again.
=== night_answer ===
#speaker:ffion_rees
{ night_answer_quiet:
    ~ night_answer_quiet = false
- else:
    Ffion Rees: Well? Is she expecting you?
}
+ [She said to come back once the building was quiet.]
    ~ ffion_night_story = "sterling"
    #set_global:ffion_night_story:sterling
    Ffion Rees: Sounds like her. She does her best talking after hours. Night, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [Left my notebook in the conference room. I'll be two minutes.]
    ~ ffion_night_story = "notebook"
    #set_global:ffion_night_story:notebook
    Ffion Rees: Go on, then. I'll tell the guard you're about, so he doesn't jump on you.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
+ [Something like that. Night.]
    ~ ffion_night_story = "brushoff"
    #set_global:ffion_night_story:brushoff
    Ffion Rees: Right. Well. Suit yourself.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
