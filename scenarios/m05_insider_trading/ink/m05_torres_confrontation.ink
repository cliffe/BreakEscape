// ===========================================
// Mission 5: Torres Confrontation - Act 3
// Critical choice: turn / hand over / expose / fight (fight resolves
// in-engine, then the player decides his fate after the knockout).
//
// PASS 2:
// - Torres waits in the data centre, at the upload terminal the scene
//   describes. He is shown when he is named; the player walks to him.
// - Re-entry guard (lesson 14): once final_choice is set, talking again
//   goes to a resting knot and can't replay or overwrite the outcome.
// - Never reaches DONE/END (lesson 21).
// - final_choice is a synced global; the debrief waits for this
//   conversation to CLOSE (conversation_closed:david_torres).
// - Canon (review M2): SAFETYNET has no jurisdiction and no arrest powers
//   (universe_bible/02_organisations/safetynet/overview.md:41-47). The
//   player detains Torres and hands him to Patricia, who calls the police.
//   "Cooperation" is a private deal: SAFETYNET pays for Elena's treatment
//   in exchange for a debrief before the police arrive. What a court does
//   next is not SAFETYNET's to promise.
// ===========================================

VAR final_choice = ""  // "turn_double_agent", "arrest", "combat_nonlethal", "combat_lethal", "public_exposure"
VAR confront_stance = ""  // "sympathetic" or "hardline"
VAR torres_turned = false
VAR torres_arrested = false
VAR torres_killed = false
VAR elena_treatment_funded = false
VAR entropy_program_exposed = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR found_pipeline_list = false
VAR flag4_submitted = false
VAR recruiter_contacted_player = false
VAR patricia_ko = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{final_choice != "":
    -> after_choice
}
-> confrontation_scene

=== confrontation_scene ===
#speaker:narrator
Narrator: 8:14 PM. The data centre. Fans roar in the racks.

Narrator: David Torres sits alone at the terminal, a USB drive in the front port. The transfer bar reads 94%. Sixteen minutes to the window.

Narrator: He doesn't turn around.

#speaker:david_torres
{patricia_ko:
    David Torres: I know you're there. Security's gone quiet tonight. That was you, wasn't it?
- else:
    David Torres: I know you're there. Patricia sent you.
}

David Torres: "Security consultant." You're not an auditor.

David Torres: The vault logged me in twice tonight. One of them was you.

+ [It's over. Step away from the terminal.]
    You: It's over, David. Step away from the terminal.
    #speaker:narrator
    Narrator: He turns slowly. His hand stays near the keyboard.
    #speaker:david_torres
    David Torres: Is it?
    -> torres_confrontation

+ [I've seen the portal. The Recruiter. All of it.]
    You: I've seen the staging on the portal. The Recruiter. All of it.
    David Torres: Then you know more than I did when I started.
    -> torres_confrontation

// ===========================================
// MAIN CONFRONTATION
// ===========================================

=== torres_confrontation ===
#speaker:david_torres

{found_medical_bills or found_vetting_file:
    David Torres: You've seen the bills, then. Elena's trial. Three hundred and eighty thousand dollars.
- else:
    David Torres: Do you know what a clinical trial costs, when the insurer says no? I do. To the dollar.
}

{found_torres_journal:
    David Torres: Did you read my journal as well? Three months of me lying to myself, in my own handwriting.
}

+ [They played you. You didn't know what this was.]
    You: They lied to you. Told you it was for journalists, right?
    ~ confront_stance = "sympathetic"
    -> torres_knows_truth

+ [You knew exactly what you were doing.]
    You: You knew. The dispatch network. The projection. You knew.
    ~ confront_stance = "hardline"
    -> torres_knows_truth

=== torres_knows_truth ===
#speaker:david_torres

David Torres: "Investigative journalists exposing a corrupt contractor." That's what the Recruiter said. For about two weeks.

{flag4_submitted:
    David Torres: Then they showed me the paperwork you've clearly found. The Architect's signature under a number.
- else:
    David Torres: Then they showed me the casualty projection.
}

David Torres: I've known for two months. It was never going to a newspaper. ENTROPY wants the dispatch network for themselves.

David Torres: Thirty to forty-five people, the first time they use it. Ambulances that don't arrive.

+ [You knew people would die. Why keep going?]
    You: You knew people would die. Why did you keep going?
    -> torres_rationalization

+ [You're no different from the rest of them.]
    You: You're no different from ENTROPY's other true believers.
    #speaker:narrator
    Narrator: He opens his mouth to answer, then stops himself.
    -> torres_rationalization

=== torres_rationalization ===
#speaker:david_torres

David Torres: Because the system is rotten. Because it would all come down anyway, and better it comes down on purpose...

David Torres: Because Elena was dying and nobody else was going to pay...

David Torres: Because thirty to forty-five people is... is...

David Torres: Is thirty to forty-five families. Like mine.

{found_torres_journal:
    David Torres: You read it. "Collateral damage for the greater good." I wrote that about strangers so I wouldn't have to think of them as people.
}

-> evidence_revelation

=== evidence_revelation ===
#speaker:david_torres

David Torres: Three months ago I was trying to save my wife.

David Torres: Now I'm sixteen minutes from getting people killed.

#speaker:narrator
Narrator: The transfer bar ticks to 95%. This is the choice.

-> final_choice_moment

// ===========================================
// CRITICAL CHOICE
// ===========================================

=== final_choice_moment ===
#speaker:narrator

+ [You're not too far gone. Help us, and we'll help Elena.]
    #complete_task:confront_torres
    -> turn_double_agent_path

+ [It's over. You're staying here until the police arrive.]
    #complete_task:confront_torres
    -> arrest_path

+ [Drop the philosophy. Step away, or I make you.]
    #complete_task:confront_torres
    -> combat_offer

+ [I'm going public. ENTROPY's programme, your part in it, all of it.]
    #complete_task:confront_torres
    -> public_exposure_path

// ===========================================
// PATH 1: TURN
// ===========================================

=== turn_double_agent_path ===
#speaker:david_torres

You: They've had you three months, not three years. You wrote "what have I become". People who've gone all the way don't ask that.

David Torres: Come back how?

+ [Work for us. Feed them false data. Lead us to the network.]
    You: You go back to your desk. You pass them what we give you. And you lead us to the rest of the network.
    -> torres_deal_offered

=== torres_deal_offered ===
#speaker:david_torres

David Torres: And Elena?

You: We pay for the trial. If it ever gets dangerous, we can move your family somewhere quiet.

{recruiter_contacted_player:
    You: The Recruiter rang me tonight. She's lining up forty-seven more people like you.
    David Torres: Forty-seven...
}

+ [Everything. Her name, the channels, the money.]
    You: I need everything. How she contacts you, how you're paid, who else you've met.
    -> torres_accepts_turn

=== torres_accepts_turn ===
#speaker:david_torres

David Torres: All right. All right. I'll do it.

David Torres: I'll help you get to the others before they end up where I am.

~ torres_turned = true
~ elena_treatment_funded = true
#complete_task:make_critical_choice
~ final_choice = "turn_double_agent"
David Torres: Thank you. I didn't think anyone would give me a way out.

-> stop_upload

// ===========================================
// PATH 2: HAND HIM OVER
// ===========================================

=== arrest_path ===
#speaker:david_torres

You: I'm not police, David. I can't arrest you. But you're not leaving this room, and Patricia is calling them.

David Torres: So what are you?

+ [Someone who stopped this. That's all you need to know.]
    You: Someone who stopped this. The police can have you, and the evidence.
    David Torres: What about Elena? The kids?
    -> arrest_family_question

+ [It doesn't matter. What matters is who arrives next.]
    David Torres: That's not an answer.
    -> arrest_family_question

=== arrest_family_question ===
#speaker:david_torres

David Torres: Elena's trial. If I'm in a cell, nobody pays for it.

David Torres: She dies. Sofia and Miguel watch it happen.

+ [Talk to me before they get here, and we'll pay for her treatment.]
    You: Before the police arrive, you tell me everything about ENTROPY: names, channels, money. Do that, and we pay for Elena's treatment. What a court does with you is not mine to promise.
    David Torres: Everything. Whatever you need.
    ~ elena_treatment_funded = true
    -> arrest_cooperation

+ [That isn't my problem.]
    You: I'm not a social worker, David.
    David Torres: No. Of course not.
    -> arrest_no_cooperation

=== arrest_cooperation ===
#speaker:david_torres

David Torres: The Recruiter. How they found me. Where the money comes from. All of it.

David Torres: Just... Elena. Please.

~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "arrest"
You: Stop the upload first. Then we talk, quickly.

-> stop_upload

=== arrest_no_cooperation ===
#speaker:david_torres

David Torres: Then I've got nothing to say to you. I'll wait for them.

~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "arrest"
You: Fine. But that upload stops. Now.

-> stop_upload

// ===========================================
// PATH 3: FIGHT
// The fight resolves in-engine. The player decides his fate after the
// knockout in post_ko_choice (npc_ko:david_torres mapping, disableClose).
// ===========================================

=== combat_offer ===
#speaker:david_torres

You: No more talk. Hands off the keyboard, or I take them off it.

David Torres: You're not taking me. Elena needs me.

#hostile:david_torres
#speaker:narrator
Narrator: He shoves the chair back and comes at you.

#exit_conversation
-> fighting

// Resting knot while he is hostile. A hostile NPC is struck, not talked to,
// so this is only a safety net that keeps the story live (lesson 21).
=== fighting ===
#speaker:narrator
+ [Back off and keep your guard up.]
    Narrator: He's past talking.
    #exit_conversation
    -> fighting

// ===========================================
// POST-KNOCKOUT: DECIDE HIS FATE
// ===========================================

=== post_ko_choice ===
{final_choice != "":
    -> after_choice
}
#speaker:narrator
Narrator: Torres went down hard against the rack. He isn't getting up.

Narrator: His breathing is ragged, and blood is pooling under his head. The terminal reads 97%.

+ [Kill the upload, then stay with him: recovery position, pressure, call it in.]
    You: Upload first. Then him.
    ~ torres_arrested = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_nonlethal"
    -> post_ko_arrest

+ [Kill the upload and walk out. Leave him bleeding on the floor.]
    You: Upload first. He can wait for whoever comes.
    ~ torres_killed = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_lethal"
    -> post_ko_handoff

=== post_ko_arrest ===
#speaker:narrator
Narrator: You pull the drive and kill the transfer at 97%. The last of it stays in the building.

Narrator: Then you roll him onto his side, press your jacket to the cut, and call Patricia. She brings the police and an ambulance. He comes round in hospital, under guard.

#exit_conversation
-> after_choice

=== post_ko_handoff ===
#speaker:narrator
Narrator: You pull the drive and kill the transfer at 97%. The last of it stays in the building.

Narrator: You step over him on the way out. Nobody else knows he's down here.

#exit_conversation
-> after_choice

// ===========================================
// PATH 4: PUBLIC EXPOSURE
// ===========================================

=== public_exposure_path ===
#speaker:david_torres

You: I'm not handing you over quietly, David. I'm burning the whole programme.

You: Your case, the Recruiter, the other placements. Every newsroom that will take it.

David Torres: You'll wreck everyone. The other targets...

You: They'll be warned. ENTROPY's recruiting operation will be finished.

David Torres: And me? My family?

+ [You'll be named. I can't protect you from that.]
    You: You'll be named publicly. Elena will read it. Sofia and Miguel will see your face on the news.
    -> public_exposure_consequence

=== public_exposure_consequence ===
#speaker:david_torres

David Torres: They're eight and eleven.

David Torres: This will follow them for the rest of their lives.

You: You should have thought about that before tonight.

~ entropy_program_exposed = true
~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "public_exposure"
David Torres: I did this to save them. And you're going to wreck them anyway.

-> stop_upload

// ===========================================
// STOP THE UPLOAD (conversational paths)
// ===========================================

=== stop_upload ===
#speaker:narrator
Narrator: He reaches past you and cancels the transfer. 97%. The last of it stays in the building.

{found_pipeline_list:
    Narrator: The TalentStack envelope is still in your pocket. He looks at it, then away.
}

{torres_turned:
    #speaker:david_torres
    David Torres: What happens now?
    You: You go home and act normal. Elena starts treatment on Monday. We'll be in touch.
    David Torres: And the others?
    You: We reach as many as we can.
}

{torres_arrested and not entropy_program_exposed:
    #speaker:david_torres
    David Torres: How long will I get?
    You: That's for a court. Not me.
    {elena_treatment_funded:
        David Torres: But Elena gets her treatment?
        You: We keep our deals.
    - else:
        David Torres: Elena will be dead before I get out.
    }
}

{entropy_program_exposed:
    #speaker:david_torres
    David Torres: When does it go public?
    You: Within the week. That gives us time to warn the others first. The police will come for you before then.
    David Torres: And then my face is everywhere.
}

#speaker:narrator
Narrator: Operation Schrödinger is stopped. What it cost depends on what you just chose.

#exit_conversation
-> after_choice

// ===========================================
// RESTING KNOT (re-entry after the choice)
// ===========================================

=== after_choice ===
#speaker:narrator
+ {final_choice == "turn_double_agent"} [We'll be in touch, David.]
    #speaker:david_torres
    David Torres: I know. I'll be waiting for the call.
    #exit_conversation
    -> after_choice
+ {final_choice == "arrest" or final_choice == "public_exposure"} [Sit tight. Patricia's on her way with the police.]
    #speaker:david_torres
    David Torres: Where would I go?
    #exit_conversation
    -> after_choice
+ {final_choice == "combat_nonlethal" or final_choice == "combat_lethal"} [Leave him.]
    Narrator: He doesn't move.
    #exit_conversation
    -> after_choice
+ {final_choice == ""} [Not yet.]
    #exit_conversation
    -> start
