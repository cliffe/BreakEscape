EXTERNAL player_name()

VAR receptionist_influence = 0
VAR badge_received = false
VAR topic_victoria = false
VAR topic_company_history = false
VAR topic_danny = false
VAR pin_hint_given = false
VAR clone_reception_badge_done = false
// Pass 3c: synced scenario global, set by the card_cloned mapping only when the
// badge is actually saved in the cloner. Until then the clone option stays offered.
VAR reception_badge_cloned = false
// Synced from globalVars: after Victoria's card is cloned the building is closing.
VAR mission_phase = ""

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:receptionist
{ mission_phase == "act2_infiltration":
    -> closing_up
}
{ not badge_received:
    #display:receptionist-professional
    Receptionist: Good afternoon! You must be {player_name()}.
    Receptionist: Ms. Sterling mentioned you'd be coming in for a consultation.
    Receptionist: Let me get you checked in.
    -> badge_process
}
{ badge_received:
    #display:receptionist-friendly
    Receptionist: Hi again! How's your visit going?
    -> hub
}

=== badge_process ===
#speaker:receptionist
Receptionist: I just need you to sign in here, and I'll print you a visitor badge.
Narrator: She slides a clipboard across the desk.
Receptionist: Ms. Sterling's in the conference room. Straight up the hallway, first door on the left.
* [Thank you - sign in]
    #give_item:id_badge:visitor_badge
    ~ badge_received = true
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    Narrator: You sign the visitor log.
    Receptionist: Here's your badge. Please keep it visible while you're in the building.
    Receptionist: The conference room is through the card reader on the left — RFID access. Ms. Sterling usually authorises visitors herself, so just head over when you're ready.
    Receptionist: And welcome to WhiteHat Security!
    -> first_impression_choice
* [Before I meet with Victoria, can you tell me a bit about WhiteHat Security?]
    ~ receptionist_influence = receptionist_influence + 10
    # influence_increased
    Receptionist: Of course! We're a cybersecurity research and penetration testing firm.
    -> company_overview
* [Just sign quickly and head to meeting]
    #give_item:id_badge:visitor_badge
    ~ badge_received = true
    Narrator: You scrawl a signature in the log.
    Receptionist: Here's your badge. Ms. Sterling's in the conference room — through the card reader on your left.
    #exit_conversation
    -> hub

=== company_overview ===
#speaker:receptionist
Receptionist: WhiteHat Security was founded in 2010 by Victoria Sterling.
Receptionist: We do penetration testing, security audits and advanced research training.
{ receptionist_influence >= 10:
    Receptionist: We also have a research division - Zero Day training programs. Very cutting-edge stuff.
}
~ topic_company_history = true
~ pin_hint_given = true
* [2010. Victoria must be proud of how far it's come.]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    You: 2010. She must be proud of how far the company's come.
    Receptionist: Oh, very much so. She has a whole wall of awards in her office.
    -> badge_process
* [What kind of training does Zero Day offer?]
    Receptionist: *slightly evasive* Advanced penetration testing techniques. For serious researchers.
    Receptionist: Ms. Sterling is very selective about who gets into the programme.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> badge_process

=== first_impression_choice ===
#speaker:receptionist
Receptionist: Is this your first time working with a cybersecurity firm?
* [I've done some freelance pen testing]
    ~ receptionist_influence = receptionist_influence + 10
    # influence_increased
    You: I've done freelance penetration testing before. Looking to level up.
    Receptionist: Well, you're in the right place! Ms. Sterling is brilliant.
    -> hub
* [Yes, I'm new to the field]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    You: Relatively new, yes. Still learning.
    Receptionist: That's exciting! Everyone here is very passionate about security.
    -> hub
* [I should head to the conference room. Don't want to keep Victoria waiting.]
    Receptionist: Of course! Up the hallway, first door on the left.
    #exit_conversation
    -> hub

=== hub ===
// Resting point (m02 pattern): every exit comes back here, never DONE, so the
// engine restores the story at these choices. Night-aware: after Victoria's card
// is cloned, the only thing to do is say goodnight.
+ {mission_phase == "act2_infiltration"} [You're still here? It's late.]
    -> closing_up
+ {mission_phase != "act2_infiltration" && not topic_victoria} [Ask about Victoria Sterling]
    -> ask_victoria
+ {mission_phase != "act2_infiltration" && not topic_danny} [Ask about other employees]
    -> ask_danny
+ {mission_phase != "act2_infiltration" && not topic_company_history && not pin_hint_given} [Ask about company history]
    -> ask_company_history
+ {mission_phase != "act2_infiltration" && receptionist_influence >= 15} [Ask about the building layout]
    -> ask_building_layout
+ {mission_phase != "act2_infiltration" && badge_received && not reception_badge_cloned} [Lean across the desk to examine the directory — cloner in range]
    -> clone_badge_opportunity
+ {mission_phase != "act2_infiltration"} [End conversation]
    Receptionist: Have a great visit!
    #exit_conversation
    -> hub

=== ask_victoria ===
#speaker:receptionist
~ topic_victoria = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Receptionist: Ms. Sterling is amazing. She's a DEFCON speaker, published researcher, the whole package.
Receptionist: And she really cares about the work. Sometimes she's here until midnight.
{ receptionist_influence >= 20:
    Receptionist: Between you and me, she can be intense. Very particular about her research.
    Receptionist: But she's fair. If you're good at what you do, she'll respect you.
}
* [She sounds dedicated]
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    You: She sounds very dedicated to the work.
    Receptionist: Absolutely. Cybersecurity is her passion.
    -> hub
* [Midnight work sessions? That's some serious dedication.]
    Receptionist: Yeah, sometimes I see her car still in the lot when I leave at 6.
    Receptionist: She has a whole setup in her office - coffee maker, the works.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [Continue]
    -> hub

=== ask_danny ===
#speaker:receptionist
~ topic_danny = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Receptionist: Well, there's Danny Foster - he's one of our senior consultants.
Receptionist: Really nice bloke. Always brings doughnuts in on a Friday.
{ receptionist_influence >= 15:
    Receptionist: He's been a bit stressed lately, though. I think he's working on a big project.
}
* [What kind of consulting work does Danny do?]
    Receptionist: Penetration testing, mostly. He goes on-site to client locations for security audits.
    Receptionist: He's been with WhiteHat since the beginning - 2010, I think.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [Where does Danny work? In case I run into him.]
    Receptionist: The executive wing -- off to the right from the main hallway. His is the door on the south side.
    Receptionist: He's usually out at client sites in the day, mind. He comes back in the evening to write up.
    -> hub
+ [Continue]
    -> hub

=== ask_company_history ===
#speaker:receptionist
~ topic_company_history = true
~ pin_hint_given = true
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Receptionist: WhiteHat Security was founded in 2010 by Victoria Sterling.
Receptionist: There's actually a plaque right over there *gestures at the wall* with the founding year and mission statement.
Receptionist: "Security Through Economics" - that's our motto.
* [That's an unusual motto. What does it mean?]
    Receptionist: *uncertain* Something about market-driven security research? Ms. Sterling explains it better than I can.
    Receptionist: She has strong opinions about how the security industry should work.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [2010. I'll remember that.]
    You: 2010. A significant year for the company, then.
    Receptionist: Absolutely! Ms. Sterling is very proud of everything we've built since then.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [Continue]
    -> hub

=== ask_building_layout ===
#speaker:receptionist
~ receptionist_influence = receptionist_influence + 5
# influence_increased
Receptionist: Sure! It's a pretty straightforward layout.
Receptionist: Reception here, then the main hallway. The conference room's through the card reader, first on the left.
Receptionist: Server room at the far end of the main hallway -- executive cards only.
Receptionist: And Ms. Sterling's office is in the executive wing, east off the main hallway.
* [Is anyone here after business hours?]
    Receptionist: Usually just Ms. Sterling if she's working late. And we have a night security guard - makes rounds to keep the place safe.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
* [Even the conference area needs a card? That's pretty tight security.]
    Receptionist: Card readers on the conference room and the server room. Ms. Sterling is very particular about access control.
    Narrator: She taps the badge on her lanyard.
    Receptionist: Staff badges get you into the conference area. The server room takes an executive card. Visitors normally get escorted through.
    ~ receptionist_influence = receptionist_influence + 5
    # influence_increased
    -> hub
+ [That's helpful, thanks]
    -> hub

=== clone_badge_opportunity ===
#speaker:receptionist
Narrator: You lean over the desk, studying the building directory, keeping the RFID cloner within range of her lanyard.
Narrator: The cloner's antenna lights up — it detects a MIFARE signal from her staff badge.
// The tag sits on a throwaway line: starting the RFID minigame ends this chat.
// The task completes on Save (card_cloned mapping), never on the tag.
#clone_keycard:receptionist_badge
Narrator: She carries on straightening the sign-in sheet.
-> clone_badge_debrief

=== clone_badge_debrief ===
#speaker:receptionist
{ reception_badge_cloned:
    Narrator: The badge is in the cloner.
- else:
    Narrator: The cloner didn't keep the read. You'll have to lean in again.
}
-> hub

=== closing_up ===
#speaker:receptionist
Receptionist: Oh! You're still here? I'm just shutting down for the night.
Receptionist: Security's on from now, so don't go wandering. Have a good evening!
+ [You too.]
    #exit_conversation
    -> hub
