// ===========================================
// CLOSING DEBRIEF - AGENT HaX
// Mission 4: Critical Failure
// Break Escape - Mission Wrap-Up and Task Force Null Revelation
// ===========================================

// Variables for tracking debrief choices
VAR disclosure_choice = ""           // full, quiet, partial
// Phase 4 dialogue C1 (D5-27): task_force_null_assigned, mission_debriefed and
// operatives_defeated removed (never read).

// Game state variables
VAR voltage_captured = false
VAR vance_trust_level = 0
// Phase 4 dialogue C1 (D5-32): stances the debrief now remembers. Synced, read only.
// promised_voltage_alive: the briefing's or HaX's phone "alive" choice.
// asked_the_number: the player asked Voltage how many the hall takes with it.
VAR voltage_escaped = false
VAR promised_voltage_alive = false
VAR asked_the_number = false

// Engine-owned; set by the racks_vent timer. Read only.
VAR racks_vented = false
VAR casualties_occurred = false
// PASS 3 P11b: set by the trigger_race timer when Voltage reached the laptop.
VAR vented_by_trigger = false

// PASS 3 P12: set on pickup of the optional intel. Read only.
VAR lore_architect_directive_found = false
VAR lore_cross_cell_coordination_found = false
VAR lore_safehouse_address_found = false

// Engine-owned; set true if the player knocked Robert Vance out. Read only.
// Gates his debrief presence -- a man on the floor of his own operations office
// does not stand and deliver closing remarks.
VAR robert_vance_ko = false

// PASS 4. Engine-owned globals, read only.
// fix 14: the three operative KOs (the old operatives_defeated counter only ever
// counted Cipher and Relay) and the guard's KO.
VAR operative_cipher_defeated = false
VAR operative_relay_defeated = false
VAR operative_static_defeated = false
VAR security_guard_ko = false
// fix 7: Cipher talked out of the hall. fix 5: how the cards were got.
// fix 21: Voltage's print identified on the bypass module.
VAR cipher_walked = false
VAR vance_card_cloned = false
VAR relay_card_cloned = false
VAR voltage_print_on_bypass = false
// Pass 5 decision 1: Vance's evacuation alarm (crew_warned) and a vent with the
// crew still in Hall 2 (crew_lost, set by HaX's racks_vented mapping). Read only.
VAR crew_warned = false
// Scenario design round 1 (m4, browser M-3): Vance may never have been met.
// m6: HaX naming Blackout counts as hearing the name. m7: Voltage said "six
// cities" in the plant room. Synced globals; vance_spoken / vance_is_ally read only.
// Round 2 (n4): vance_spoken is set where the meeting starts (not vance_spoken, set
// at its end), so a player who cloned his card mid-meeting and walked off still met him.
VAR vance_spoken = false
VAR vance_is_ally = false
VAR voltage_six_cities = false
VAR crew_lost = false
// Round 2 (review M1, m1): the alarm came before the attack was mapped (it
// started its own clock), and that clock is what vented the bank. Read only.
VAR crew_warned_early = false
VAR vented_by_alarm_clock = false

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// DEBRIEF START
// Location: Control Room (phone/video call)
// Task 3.3: Report Mission Outcome
// ===========================================

=== start ===
// NOTE: #complete_task:report_to_0x99 used to fire HERE, on the first line of
// the debrief. With the other two aim-3 tasks already done that completed the
// mission-conclusion aim and raised the bond_visualiser *over* the debrief
// before the player had read a word of it. It now fires in `mission_complete`,
// the final knot.
-> debrief_start

=== debrief_start ===
#speaker:agent_0x99

// Agent HaX on screen
// Pass 5 A4: the reload backstops key on this (scenario.json.erb).
#set_global:debrief_started:true
Agent, report.

* {not racks_vented} [Shutdown engaged before the racks went. Banks isolated, hall intact.]
    -> debrief_attack_stopped

* {racks_vented and not vented_by_trigger} [Bank B went before I reached the button. Shutdown held A and C.]
    -> debrief_attack_stopped

* {vented_by_trigger} [He reached the laptop before I put him down. Shutdown held A and C.]
    -> debrief_attack_stopped

* [Voltage is {voltage_captured:in custody.|out through the dock.}]
    -> debrief_voltage_status

=== debrief_attack_stopped ===
#speaker:agent_0x99

{racks_vented:
    // C2 (D6-1 follow-on): "It wasn't." cut on crew-lost routes, where the next
    // line names the nine.
    {crew_lost:
        Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall.
    - else:
        Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall. It wasn't.
    }
- else:
    Clean. Runaway aborted before a single cell vented. Banks isolated.
}

-> debrief_people ->

{voltage_captured:
    And you've got Voltage.
- else:
    And Voltage got out through the dock.
}

// PLAYTEST ROUND: a player beat, so the outcome and the intelligence aren't one
// fifteen-bubble run before the first choice.
// C3 (D7-8): on crew-lost routes the player answers the nine.
+ [{crew_lost:Nine. Tell me we came out with something.|What did we get out of there?}]
    -> debrief_intelligence_gathered

// Round 4 (review m5): the Vance and KO lines, shared by both openers (a tunnel).
=== debrief_people ===
{vance_trust_level >= 70 and not robert_vance_ko:
    {
    - crew_lost:
        Vance lost nine of his crew tonight. He hasn't said a word about you yet.
    - racks_vented:
        Vance says you kept it to one bank. He still wants that in writing.
    - else:
        Vance says the grid held because of you. He wants that in writing.
    }
}
// Phase 4 dialogue C2 (D6-1): the deaths land at the top on every crew-lost
// route, not 25 lines later; the >=70 line above already says it there.
{crew_lost and not (vance_trust_level >= 70 and not robert_vance_ko):
    The night crew were still in Hall 2 when Bank B went. Nine of them.
}
{robert_vance_ko:
    The facility manager's being treated by medics. He'll live. He won't be filing a commendation.
}
{security_guard_ko:
    And the gate guard's in A&E with a sore head. He was the one person on site doing his job by the book.
}
->->

=== debrief_voltage_status ===
#speaker:agent_0x99

{voltage_captured:
    #set_global:blackout_named:true
    // C3 (D7-9): no "Good." before the nine.
    {crew_lost:In custody.|Good.} Nobody else in that building knows the chain above Blackout.

    He'll talk. He wants someone to check his sums.
- else:
    // Phase 4 dialogue C2 (D6-1): no "A shame" straight before nine dead.
    {crew_lost:
        He's out of reach. For now.
    - else:
        A shame. But the attack's stopped, and that was the job.
    }
    // Phase 4 dialogue C1 (D5-11): "Lives over one operative" cut; the briefing
    // already gave that moral.
}

// Round 4 (review m5): this opener skipped the Vance and KO lines.
-> debrief_people ->

// Phase 4 dialogue C3 (D7-1): the same player beat as the first opener, so a
// thorough run isn't fourteen bubbles before a choice.
+ [{crew_lost:Nine. Tell me we came out with something.|What did we get out of there?}]
    -> debrief_intelligence_gathered

=== debrief_intelligence_gathered ===
#speaker:agent_0x99

// PASS 3 review: the "proof" claim needs the paper; the directive itself is
// m03's, so HaX can quote it either way.
// C3 (D7-1): "the proof we've been chasing" folded into the documents line below.
The directive said it: Zero Day supplies, Critical Mass executes, grid storage this winter. Tonight was that plan, running.

{voltage_captured:
    Voltage is in a room now. So far he's given us one thing: his casualty figure.
    // Phase 4 dialogue C1 (D5-27, D5-32): the number he gave when asked, and the
    // "alive" stance, paid off.
    {asked_the_number:
        // C2 (D6-3): in the plant room he gave "forty-odd", not a decimal.
        To the decimal this time. You only got "forty-odd".
    }
    {promised_voltage_alive:
        You said you'd bring him in breathing. You did.
    }
- else:
    Voltage is gone, so the paper will have to talk.
    {asked_the_number:
        You got his number out of him, at least. It goes in the file next to Blackout's signature.
    }
    {promised_voltage_alive and voltage_escaped:
        You wanted him alive, and you chose the button. I'd have chosen the same.
    }
}
{voltage_print_on_bypass:
    {voltage_captured:
        And his print on that bypass module puts his own hand in the cabinet. That'll stand up in court.
    - else:
        His print's on that bypass module. When someone does find him, it'll be waiting.
    }
}
{cipher_walked:
    Cipher went to look at the night crew and kept walking. Police picked him up on the access road. He's talking.
}

{lore_cross_cell_coordination_found or lore_architect_directive_found:
    The documents show Critical Mass and Social Fabric coordinating the one attack, in their own handwriting. That's the proof we've chased since Zero Day.
- else:
    // Scenario design M1: the required FTP flag already showed the cross-cell link.
    Their FTP drop already put Critical Mass and Social Fabric on the same job. The paper in the plant room would have signed it.
}

{lore_safehouse_address_found:
    And that card from the go-bag. It decodes to Calder Wharf, Social Fabric's regional safehouse. That goes on the board.
}

// C3: "crew" now follows the nine dead, so the kit is named as OptiGrid's. m05's
// briefing depends on it ("the print kit you brought back from Albion",
// m05_insider_trading_opening.ink:218): keep on every route.
Keep the OptiGrid print kit. Forensics can have the case it came in.

// PLAYTEST ROUND: second player beat before the what-failed lesson.
+ [And how did they get in? How did I?]
    -> debrief_what_failed

// ===========================================
// PASS 4 fix 5: what failed (m01 pattern, m01_closing_debrief.ink:149-175).
// The three weaknesses the player used, and the fix for each, in plain lines.
// ===========================================

=== debrief_what_failed ===
#speaker:agent_0x99

Agent HaX: Before you write it up. Here's what let them in. Nearly all of it let you in too.
{vance_card_cloned:
    Agent HaX: Vance's door card copied from across his own desk. Old prox hands its number to anything that asks.
- else:
    Agent HaX: Their door cards are old prox. They hand their number to anything that asks. You could have had Vance's from across his desk.
}
{relay_card_cloned:
    // C3 (D7-6): "too" only if Vance's card was cloned.
    Agent HaX: You did it to Relay{vance_card_cloned: too}, while she was talking.
}
Agent HaX: The HV door took one finger, and that finger was on a panel he touched every two hours. A print names you. It can't prove you're the one standing there.
Agent HaX: And the control room believed its own sensors. The honest ones weren't on the bus: a dial on a wall, and a gas monitor off their network.

// Phase 4 dialogue C1 (D5-4): the lecture split by a player beat; each fix sits
// beside its weakness, no fragment list. Both questions get the same answer.
* [And the network?]
    -> debrief_what_failed_fixes
* [So what do they fix first?]
    -> debrief_what_failed_fixes

=== debrief_what_failed_fixes ===
#speaker:agent_0x99
// Scenario design M1 (orchestrator decision 1): what the four flags exposed, at
// the brief's level (no commands, ports or exploit detail). Check against SecGen
// by the user.
Agent HaX: A legacy compile service on an OT box, trusting whatever it was sent. That comes off the network.
Agent HaX: An FTP service handing their cross-cell plan to anyone who looked, and a jump-server account with more privilege than it ever needed. Somebody reviews those.
Agent HaX: And on site: encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads.

* {vance_spoken or vance_is_ally} [It goes in the report. Vance will want every line.]
    -> debrief_big_picture

* {not vance_spoken and not vance_is_ally} [It goes in the report.]
    -> debrief_big_picture

* [The budget let them in as much as the readers did.]
    Agent HaX: Put that in too. It's the line nobody upstairs will want to read.
    -> debrief_big_picture

=== debrief_big_picture ===
#speaker:agent_0x99

// C2 (D6-18): "None of this was random." cut.
// C3 (D7-4): true on routes where nothing burned.
Social Fabric had disinformation queued for the morning, ready to turn a fire into a panic.

* [The Architect. He's running all of it.]
    -> debrief_architect_revelation

* [How far does this reach?]
    -> debrief_scale_explanation

=== debrief_architect_revelation ===
#speaker:agent_0x99

The same name the Zero Day directive carried. The Architect.

We've just watched one of his strikes from the inside. Now we know how the cells fit together.

This site was a rehearsal.

-> debrief_task_force_announcement

=== debrief_scale_explanation ===
#speaker:agent_0x99

// Scenario design m7: he said it in the plant room (voltage_six_cities); in
// custody he has given only his casualty figure.
{voltage_six_cities:
    Voltage told you six cities, in the plant room.

    OptiGrid, their cover firm, has contracts at forty sites nationwide. We're auditing every one.
- else:
    The documents name several cities.

    OptiGrid's contracts turn up at dozens of infrastructure sites.
}

We've never seen it run this tight.

-> debrief_task_force_announcement

=== debrief_task_force_announcement ===
#speaker:agent_0x99

// PASS 4 fix 22: Task Force Null, Voltage's interrogation and Calder Wharf are
// open threads; no later mission picks them up yet, so nothing here promises a
// date or a result.
Netherton wants a standing team on The Architect. Hunt the coordination, not the cells.

He's calling it Task Force Null. Your name's on his list.

* [What would Task Force Null do?]
    -> task_force_mission_explanation

* [I'm in. When do we start?]
    -> task_force_accepted

=== task_force_mission_explanation ===
#speaker:agent_0x99

Find whoever sends the directives. Every cell we've hit so far was working from the same ones.

Four missions now, and you're still standing. Tonight nearly went the other way.

-> task_force_accepted

=== task_force_accepted ===
#speaker:agent_0x99

He'll call when he's ready. Not tonight.

// Phase 4 dialogue C1: "First, one more decision." cut; the run before the
// disclosure choice was 9 lines with the crew-lost alarm line, and "How do we
// handle this publicly?" already asks it.

{racks_vented:
    // C3 (D7-2): only on the Voltage-first opener, where it's news; the first
    // opener has already named Bank B.
    {not debrief_attack_stopped:
        {vented_by_trigger:
            // Struggling run A (F3): he reached the laptop, then was put down and
            // taken (vented_by_trigger implies a fight, so no escape): say both in order.
            Agent HaX: The banks are isolated, but he reached the laptop before you put him down, and Bank B went with it.
        - else:
            Agent HaX: The banks are isolated, but Bank B went before you got to the button.
        }
    }
    // Pass 5 decision 1: the casualties depend on whether the crew was warned.
    {
    - crew_lost:
        // C2 (D6-1): a recap now; the nine were named at the top.
        Agent HaX: Nine in Hall 2. Two more on the feed before the grid caught up.
        // Phase 4 dialogue C1 (D5-3, user decision): the alarm that wasn't sounded,
        // stated once and left. crew_lost means it never went.
        {
        - robert_vance_ko:
            Agent HaX: The evacuation alarm was on Vance's desk. He was on the floor beside it.
        - vance_is_ally:
            Agent HaX: Vance had the evacuation alarm on his desk all night.
        - else:
            Agent HaX: The evacuation alarm was on Vance's desk. He never knew he had a reason to use it.
        }
        // C3 (D7-3): she has just given the number.
        Agent HaX: You stopped the rest of it. Hold on to that when the names come out tomorrow.
    - vented_by_alarm_clock:
        // Round 2 (review M1d): the alarm's own clock vented the bank.
        Agent HaX: Your alarm started his clock. Bank B and two on the feed are what it cost.
        Agent HaX: Nine people in Hall 2 are what it bought. Hall 2 was empty when it went.
    - else:
        Agent HaX: Hall 2 was empty when it went. Vance's alarm had the night crew out through the fire doors.
        Agent HaX: Two on the feed before the grid caught up. The number tomorrow won't be zero. It could have been fifty.
    }
- else:
    // Eleven on site: the nine night crew, Vance and the gate guard.
    {security_guard_ko or robert_vance_ko:
        Agent HaX: Everyone on site got out alive tonight, not all of them on their own feet. Two hundred and forty thousand people kept their lights on and never knew why.
    - else:
        Agent HaX: Eleven people walked out of there tonight. Two hundred and forty thousand people kept their lights on and never knew why.
    }
    // Round 2 (review m1): "started your clock early" only when it did.
    {
    - crew_warned_early:
        Agent HaX: And Vance's alarm had the night crew out before the button went in. It started your clock early.
    - crew_warned:
        Agent HaX: And Vance's alarm had the night crew out before the button went in.
    }
}


-> disclosure_decision

=== disclosure_decision ===
#speaker:agent_0x99

// Robert Vance present, listening
// Phase 4 dialogue C1 (D5-9): why he's in an HQ debrief.
{(vance_spoken or vance_is_ally) and not robert_vance_ko:
    Narrator: Vance is on the line from the Albion ops desk.
}

// The narrator line above now says Vance is listening ("Vance needs to hear it
// too." cut as the same fact twice).
How do we handle this publicly?

* [Full public disclosure. People have a right to know.]
    -> disclosure_full_public

* [Keep it classified. Let them patch it quietly.]
    -> disclosure_quiet

* [Say there was an incident. Keep the details back.]
    -> disclosure_partial

=== disclosure_full_public ===
#speaker:agent_0x99

~ disclosure_choice = "full"

Full transparency. The attack, the holes it came through, ENTROPY. All of it.

{(vance_spoken or vance_is_ally) and not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    // Phase 4 dialogue C1 (D5-2): nine dead is not "how close it came".
    {
    - crew_lost and vance_trust_level >= 70:
        Robert Vance: Good. Nobody gets to call it an accident.
    - crew_lost:
        Robert Vance: There'll be hell to pay for this place. There should be.
    - vance_trust_level >= 70:
        Robert Vance: It'll hurt us. People should still know how close it came.
    - else:
        Robert Vance: There'll be hell to pay for this place. Fair enough.
    }
    #speaker:agent_0x99
}

The public gets the truth and the warning with it. Albion takes the hit, every other storage site gets audited, and someone in Parliament finally answers for the funding.

Netherton will back that.

-> disclosure_outcome

=== disclosure_quiet ===
#speaker:agent_0x99

~ disclosure_choice = "quiet"

// Phase 4 dialogue C1 (D5-2): nine deaths don't classify as a fault.
{crew_lost:
    We classify what we can. Nine deaths don't go in a drawer, so it's an industrial accident, cause under investigation.
- else:
    We classify it. A maintenance fault, resolved. Albion patches the holes quietly.
}

{(vance_spoken or vance_is_ally) and not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {
    - crew_lost and vance_trust_level >= 70:
        Robert Vance: Accident. I'll sign it. I'll not pretend I like it.
    - crew_lost:
        Robert Vance: An accident. Aye. That's what the inquiry will call it.
    - vance_trust_level >= 70:
        Robert Vance: I'll keep my mouth shut. Doesn't mean I like it. Those people are on our feed.
    - else:
        Robert Vance: Good. One more headline and they'd close us.
    }
    #speaker:agent_0x99
}

// D5-38: "Stability, bought with silence." cut.
{crew_lost:
    // C2 (D6-5): not a third "accident" in a row.
    Nine families get a report with no cause in it. Albion's name survives, the upgrades happen, and nothing makes the rest of the sector move.
- else:
    Nobody hears how close this came. Albion's name survives, the upgrades happen, and nothing makes the rest of the sector move.
}

Netherton won't argue.

-> disclosure_outcome

=== disclosure_partial ===
#speaker:agent_0x99

~ disclosure_choice = "partial"

{crew_lost:
    An incident, nine dead, cause withheld. The coroner will want more than that, and get it.
- else:
    An incident, acknowledged. No detail.
}

{(vance_spoken or vance_is_ally) and not robert_vance_ko:
    // Robert Vance reacts
    #speaker:robert_vance
    {
    - crew_lost and vance_trust_level >= 70:
        Robert Vance: Something, not everything. I'll answer the rest at the inquest.
    - crew_lost:
        Robert Vance: Upstairs will like that. The inquest won't.
    - vance_trust_level >= 70:
        Robert Vance: Something, not everything. I can live with that.
    - else:
        Robert Vance: That'll go down well upstairs, I suppose.
    }
    #speaker:agent_0x99
}

{crew_lost:
    People hear the number, not the reason. Enough to push some change, not enough to start a panic.
- else:
    People hear something happened, not all of it. Enough to push some change, not enough to start a panic.
}

Netherton will sign off on it.

-> disclosure_outcome

=== disclosure_outcome ===
#speaker:agent_0x99

Done.

{disclosure_choice == "full":
    Statement goes out with the local authorities.
}
{disclosure_choice == "quiet":
    It stays classified. Cover story's prepared.
}
{disclosure_choice == "partial":
    A controlled statement goes to the press.
}

{(vance_spoken or vance_is_ally) and not robert_vance_ko:
    // Robert Vance final words
    #speaker:robert_vance
    // Phase 4 dialogue C2 (D6-2): every trust band accounts for the nine.
    {vance_trust_level >= 80:
        {not crew_lost:
            Robert Vance: Thank you.
        }

        Robert Vance: I don't know what you are. I know what you did.

        // Round 2 (review m7): nine of his crew dead is not "one bank".
        {
        - crew_lost:
            Robert Vance: Nine of mine. I'll be telling their families myself.
        - casualties_occurred:
            Robert Vance: You kept it to one bank. Without you it was the whole hall.
        - else:
            Robert Vance: Nobody in that hall died, and two hundred and forty thousand never lost the lights.
        }
    }
    {vance_trust_level >= 50 and vance_trust_level < 80:
        {crew_lost:
            Robert Vance: The hall's standing. Nine of mine aren't.

            Robert Vance: I'll not forget either.
        - else:
            Robert Vance: You did right by this place.

            Robert Vance: I'll not forget it.
        }
    }
    {vance_trust_level < 50:
        {crew_lost:
            Robert Vance: Nobody told me what was in my own plant. Nine of mine paid for that.
        - else:
            Robert Vance: I don't follow all of it. I know the hall's still standing.
        }
    }
}

#speaker:agent_0x99

// C3 (D7-7): the player's last words fit nine dead; the replies fit both.
* {(vance_spoken or vance_is_ally) and not robert_vance_ko} [{crew_lost:I'm sorry about your people, Mr Vance.|It was an honour working with you, Mr Vance.}]
    -> debrief_end_respectful

* {(vance_spoken or vance_is_ally) and not robert_vance_ko} [{crew_lost:It's all going in the report. Every line.|Just doing my job.}]
    -> debrief_end_professional

// Scenario design m4 / browser M-3: the player never met him.
* {not vance_spoken and not vance_is_ally and not robert_vance_ko} [Make sure the site manager gets the report.]
    -> debrief_end_not_met

* {not vance_spoken and not vance_is_ally and not robert_vance_ko} [Just doing my job.]
    -> debrief_end_not_met_job

* {robert_vance_ko} [Make sure Vance gets the full credit when he comes round.]
    -> debrief_end_ko

* {robert_vance_ko} [Just doing my job.]
    -> debrief_end_ko

=== debrief_end_respectful ===
#speaker:robert_vance

Robert Vance: We've run this place on hope and gaffer tape for years.

Robert Vance: That stops on my shift.

-> mission_complete

=== debrief_end_professional ===
#speaker:robert_vance

Robert Vance: I'll have those card readers out by the end of the week.

-> mission_complete

=== debrief_end_not_met ===
#speaker:agent_0x99

He'll get it. He'll want to know who was in his plant tonight, and why nobody told him.

-> mission_complete

// Phase 4 dialogue C1 (D5-8): its own reply.
=== debrief_end_not_met_job ===
#speaker:agent_0x99

Then do it again. And somebody should tell Vance you were there.

-> mission_complete

=== debrief_end_ko ===
#speaker:agent_0x99

Noted. It'll be in the report either way.

The methods are a separate conversation. You put a facility manager on the floor of his own office tonight.

-> mission_complete

=== mission_complete ===
#speaker:agent_0x99

// Phase 4 dialogue C1: one sign-off ("Get some rest." cut, "Sleep. I'll call." kept).
{voltage_captured:
    Voltage will keep.
- else:
    Voltage is out there. So is The Architect.
}

// C2 (D6-4): not after nine of Vance's crew died, and "operatives", so "crew"
// stays the night crew's word.
{not crew_lost:
    {
    - operative_cipher_defeated and operative_relay_defeated and operative_static_defeated:
        All three of his operatives on the floor. Remind me not to annoy you.
    - not operative_cipher_defeated and not operative_relay_defeated and not operative_static_defeated:
        And not one of his operatives on the floor. Harder than it looks.
    }
}

Sleep. I'll call.

// Task 3.3 completes HERE, at the end of the debrief, so the bond_visualiser
// conclusion screen is raised after the player has actually heard it.
#complete_task:report_to_0x99
#exit_conversation

// Linear cutscene: terminate, do not loop back to `start`.
// Pattern follows m02_closing_debrief.ink:809-811.
-> END
