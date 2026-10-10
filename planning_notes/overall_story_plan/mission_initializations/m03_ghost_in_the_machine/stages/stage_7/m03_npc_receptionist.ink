// ===========================================
// Mission 3: Ghost in the Machine
// NPC: Receptionist (Daytime)
// Location: Reception lobby
// ===========================================

// State tracking
VAR receptionist_influence = 0
VAR badge_received = false
VAR topic_victoria = false
VAR topic_company_history = false
VAR topic_james = false
VAR pin_hint_given = false

// External variables (from game)
EXTERNAL player_name()

// ===========================================
// INITIAL GREETING
// ===========================================

=== start ===
#speaker:receptionist

{not badge_received:
    #display:receptionist-professional

    Receptionist: Good afternoon! You must be {player_name()}.

    Receptionist: Ms. Sterling mentioned you'd be coming in for a consultation.

    Receptionist: Let me get you checked in.

    -> badge_process
}

{badge_received:
    #display:receptionist-friendly

    Receptionist: Hi again! How's your visit going?

    -> hub
}

// ===========================================
// BADGE CHECK-IN PROCESS
// ===========================================

=== badge_process ===
#speaker:receptionist

Receptionist: I just need you to sign in here, and I'll print you a visitor badge.

[She slides a clipboard across the desk]

Receptionist: Ms. Sterling's in the conference room. Second door on the right down that hallway.

* [Thank you - sign in]
    ~ badge_received = true
    ~ receptionist_influence += 5
    You sign the visitor log.

    Receptionist: Here's your badge. Please keep it visible while you're in the building.

    #give_item:visitor_badge

    Receptionist: And welcome to WhiteHat Security!
    -> first_impression_choice

* [Ask about the company first]
    You: Before I meet with Victoria, can you tell me a bit about WhiteHat Security?
    ~ receptionist_influence += 10
    Receptionist: Of course! We're a cybersecurity research and penetration testing firm.
    -> company_overview

* [Just sign quickly and head to meeting]
    ~ badge_received = true
    You quickly sign the log.

    Receptionist: Here's your badge. Ms. Sterling's waiting in the conference room.

    #give_item:visitor_badge
    #exit_conversation
    -> DONE

=== company_overview ===
#speaker:receptionist

Receptionist: WhiteHat Security was founded in 2010 by Victoria Sterling.

Receptionist: We do penetration testing, security audits, and advanced research training.

{receptionist_influence >= 10:
    Receptionist: We also have a research division - Zero Day training programs. Very cutting-edge stuff.
}

~ topic_company_history = true
~ pin_hint_given = true

* [2010 founding - that's the PIN to the safe!]
    [Mental note: 2010 might be useful...]
    ~ receptionist_influence += 5
    You: 2010, interesting. Victoria must be proud of how far the company's come.
    Receptionist: Oh, very much so. She has a whole display of awards in her office.
    -> badge_process

* [What kind of training programs?]
    You: What kind of training does Zero Day offer?
    Receptionist: [Slightly evasive] Advanced penetration testing techniques. For serious researchers.
    Receptionist: Ms. Sterling is very selective about who gets into the program.
    ~ receptionist_influence += 5
    -> badge_process

=== first_impression_choice ===
#speaker:receptionist

Receptionist: Is this your first time working with a cybersecurity firm?

* [I've done some freelance pen testing]
    ~ receptionist_influence += 10
    You: I've done freelance penetration testing before. Looking to level up.
    Receptionist: Well, you're in the right place! Ms. Sterling is brilliant.
    -> hub

* [Yes, I'm new to the field]
    ~ receptionist_influence += 5
    You: Relatively new, yes. Still learning.
    Receptionist: That's exciting! Everyone here is very passionate about security.
    -> hub

* [I need to get to the meeting]
    You: I should head to the conference room. Don't want to keep Victoria waiting.
    Receptionist: Of course! Down the hall, second door on the right.
    #exit_conversation
    -> DONE

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===

+ {not topic_victoria} [Ask about Victoria Sterling]
    -> ask_victoria

+ {not topic_james} [Ask about other employees]
    -> ask_james

+ {not topic_company_history and not pin_hint_given} [Ask about company history]
    -> ask_company_history

+ {receptionist_influence >= 15} [Ask about the building layout]
    -> ask_building_layout

+ [End conversation]
    #exit_conversation
    Receptionist: Have a great visit!
    -> DONE

// ===========================================
// CONVERSATION TOPICS
// ===========================================

=== ask_victoria ===
#speaker:receptionist

~ topic_victoria = true
~ receptionist_influence += 5

Receptionist: Ms. Sterling is amazing. She's a DEFCON speaker, published researcher, the whole package.

Receptionist: And she really cares about the work. Sometimes she's here until midnight.

{receptionist_influence >= 20:
    Receptionist: Between you and me, she can be intense. Very particular about her research.
    Receptionist: But she's fair. If you're good at what you do, she'll respect you.
}

* [She sounds dedicated]
    ~ receptionist_influence += 5
    You: She sounds very dedicated to the work.
    Receptionist: Absolutely. Cybersecurity is her passion.
    -> hub

* [Midnight? That's late]
    You: Midnight work sessions? That's some serious dedication.
    Receptionist: Yeah, sometimes I see her car still in the lot when I leave at 6.
    Receptionist: She has a whole setup in her office - coffee maker, the works.
    ~ receptionist_influence += 5
    -> hub

+ [Continue]
    -> hub

=== ask_james ===
#speaker:receptionist

~ topic_james = true
~ receptionist_influence += 5

Receptionist: Well, there's James Park - he's one of our senior consultants.

Receptionist: Really nice guy. Always brings donuts on Fridays.

{receptionist_influence >= 15:
    Receptionist: He's been a bit stressed lately, though. I think he's working on a big project.
}

* [What kind of work does James do?]
    You: What kind of consulting work does James do?
    Receptionist: Penetration testing, mostly. He goes on-site to client locations for security audits.
    Receptionist: He's been with WhiteHat since the beginning - 2010, I think.
    ~ receptionist_influence += 5
    -> hub

* [Where's his office?]
    You: Where does James work? In case I run into him.
    Receptionist: His office is down the main hallway, past the server room.
    Receptionist: Though he's usually out at client sites during the day.
    -> hub

+ [Continue]
    -> hub

=== ask_company_history ===
#speaker:receptionist

~ topic_company_history = true
~ pin_hint_given = true
~ receptionist_influence += 5

Receptionist: WhiteHat Security was founded in 2010 by Victoria Sterling.

Receptionist: There's actually a plaque right over there [gestures to wall] with the founding year and mission statement.

Receptionist: "Security Through Economics" - that's our motto.

* [What does "Security Through Economics" mean?]
    You: That's an unusual motto. What does it mean?
    Receptionist: [Uncertain] Something about market-driven security research? Ms. Sterling explains it better than I can.
    Receptionist: She has strong opinions about how the security industry should work.
    ~ receptionist_influence += 5
    -> hub

* [2010 - I'll remember that]
    [Mental note: 2010 might be important...]
    You: 2010. That's a significant year for the company then.
    Receptionist: Absolutely! Ms. Sterling is very proud of everything we've built since then.
    ~ receptionist_influence += 5
    -> hub

+ [Continue]
    -> hub

=== ask_building_layout ===
#speaker:receptionist

~ receptionist_influence += 5

Receptionist: Sure! It's a pretty straightforward layout.

Receptionist: Reception here, conference rooms to the right, main offices down the central hallway.

Receptionist: Server room and IT area in the back - that's usually locked, executive access only.

Receptionist: And Ms. Sterling's office is in the executive wing on the north side.

* [What about after hours?]
    You: Is anyone here after business hours?
    Receptionist: Usually just Ms. Sterling if she's working late. And we have a night security guard - makes rounds to keep the place safe.
    ~ receptionist_influence += 5
    -> hub

* [Executive access for the server room?]
    You: Executive access for the server room - is that a key card system?
    Receptionist: RFID badges. Ms. Sterling and the senior staff have access. Security precaution.
    ~ receptionist_influence += 5
    -> hub

+ [That's helpful, thanks]
    -> hub

// ===========================================
// EVENT-TRIGGERED KNOTS
// ===========================================

// Called when player returns to reception during daytime
=== daytime_return ===
#speaker:receptionist

#display:receptionist-friendly

Receptionist: How did your meeting with Ms. Sterling go?

* [Very well - she's impressive]
    ~ receptionist_influence += 10
    You: It went great. Victoria is very impressive. I learned a lot.
    Receptionist: I'm so glad! She has that effect on people.
    #exit_conversation
    -> DONE

* [Interesting conversation]
    You: It was... illuminating. She has strong ideas about security.
    Receptionist: [Laughs] That's one way to put it! She definitely has opinions.
    ~ receptionist_influence += 5
    #exit_conversation
    -> DONE

* [I need to think about it]
    You: I need some time to consider the training program. Big decision.
    Receptionist: Of course! Take your time. Let us know if you have any questions.
    #exit_conversation
    -> DONE

// Called if player tries to access restricted areas during daytime
=== restricted_area_daytime ===
#speaker:receptionist

Receptionist: Oh, I'm sorry - that area is for employees only.

Receptionist: Please stay in the public areas. Conference rooms and the main hallway are open to visitors.

{receptionist_influence >= 20:
    Receptionist: If you need access to something specific, Ms. Sterling can authorize it.
}

#exit_conversation
-> DONE

// ===========================================
// END
// ===========================================
